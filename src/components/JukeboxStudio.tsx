"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SegmentedLedMeter from "@/components/SegmentedLedMeter";
import { analyzeCanvasFrame } from "@/lib/cv-analyzer";
import {
  drawScanlineOverlay,
  getCachedImage,
  loadImageAsset,
  renderCompositeFrameToCanvas,
  renderImageToCanvas,
} from "@/lib/frame-renderer";
import { NASA_DATASETS } from "@/lib/nasa-datasets";
import type { EarthSoundEngine } from "@/lib/sound-engine";
import type {
  CVFrameMetrics,
  DeltaMetrics,
  NASADataset,
  ScaleType,
  ScanMode,
  StemId,
  StemsMap,
  SVSApiMetadata,
} from "@/lib/types";

interface JukeboxStudioProps {
  activeDataset: NASADataset;
  onSelectDataset: (dataset: NASADataset) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  scale: ScaleType;
  onChangeScale: (scale: ScaleType) => void;
  scanMode: ScanMode;
  onChangeScanMode: (mode: ScanMode) => void;
  stems: StemsMap;
  onUpdateStems: React.Dispatch<React.SetStateAction<StemsMap>>;
  masterVolume: number;
  onChangeMasterVolume: (vol: number) => void;
  isRecording: boolean;
  onToggleRecord: () => void;
  onNarrateTelemetry: (metrics: CVFrameMetrics) => void;
  soundEngine: EarthSoundEngine | null;
  latestMetrics: CVFrameMetrics;
  onMetricsUpdate: (metrics: CVFrameMetrics) => void;
  requestedFrameIdx?: number;
}

const SCALE_OPTIONS: { value: ScaleType; label: string }[] = [
  { value: "pentatonic", label: "PENTATONIC // MAJOR CLEAR" },
  { value: "lydian", label: "LYDIAN // OCEANIC HARMONIC" },
  { value: "dorian", label: "DORIAN // CLIMATE URGENCY" },
  { value: "harmonicMinor", label: "HARM-MINOR // TENSION FIELD" },
  { value: "scientificChromatic", label: "CHROMATIC // 12-TET LINEAR" },
];

const SCAN_MODES: { value: ScanMode; label: string }[] = [
  { value: "horizontal", label: "SWEEP W→E (LONGITUDINAL)" },
  { value: "vertical", label: "SWEEP N↔S (LATITUDINAL)" },
  { value: "radar", label: "SWEEP POLAR RADAR" },
  { value: "probe", label: "MANUAL CROSSHAIR PROBE" },
];

const CATEGORY_FILTERS = [
  { id: "all", label: "ALL" },
  { id: "Oceans & Thermal", label: "OCEANS" },
  { id: "Atmosphere & Air", label: "ATMOS" },
  { id: "Climate & Carbon", label: "CARBON" },
  { id: "Biosphere", label: "BIOSPHERE" },
  { id: "Urban & Energy", label: "URBAN" },
] as const;

const SWEEP_SPEEDS = [0.5, 1, 1.5, 2] as const;

const STEM_LABELS: Record<StemId, string> = {
  melody: "CH-01 // LEAD VOICE",
  harmony: "CH-02 // HARMONIC PAD",
  rhythm: "CH-03 // KINETIC PULSE",
  texture: "CH-04 // NOISE FIELD",
};

function formatDb(linearGain: number): string {
  if (linearGain <= 0.01) return "-∞ dB";
  const db = 20 * Math.log10(linearGain);
  return `${db >= 0 ? "+" : ""}${db.toFixed(1)} dB`;
}

export default function JukeboxStudio({
  activeDataset,
  onSelectDataset,
  isPlaying,
  onTogglePlay,
  scale,
  onChangeScale,
  scanMode,
  onChangeScanMode,
  stems,
  onUpdateStems,
  masterVolume,
  onChangeMasterVolume,
  isRecording,
  onToggleRecord,
  onNarrateTelemetry,
  soundEngine,
  latestMetrics,
  onMetricsUpdate,
  requestedFrameIdx,
}: JukeboxStudioProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const spectrumCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const scanPosRef = useRef<number>(0.5);
  const panOffsetRef = useRef<number>(0);
  const probeRef = useRef<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  // Performance refs: prevent 60Hz React re-renders while paused
  const latestMetricsRef = useRef<CVFrameMetrics>(latestMetrics);
  const dirtyMetricsRef = useRef<boolean>(true);
  const autoSeqRef = useRef<boolean>(true);
  const speedRef = useRef<number>(1);
  const lastFrameAdvanceRef = useRef<number>(0);
  const outgoingSrcRef = useRef<string | null>(null);
  const morphAlphaRef = useRef<number>(0);
  const prevActiveSrcRef = useRef<string>(activeDataset.frames[0].localSrc);
  const lastPointerActiveRef = useRef<number>(0);
  const lastProbeAudioRef = useRef<number>(0);
  const deltaCanvasRef = useRef<HTMLCanvasElement | null>(null);

  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [frameVariantIdx, setFrameVariantIdx] = useState<number>(0);
  const [orbitalDrift, setOrbitalDrift] = useState<boolean>(false);
  const [autoSequence, setAutoSequence] = useState<boolean>(true);
  const [kinematicMotion, setKinematicMotion] = useState<boolean>(false);
  const [deltaCompare, setDeltaCompare] = useState<boolean>(false);
  const [deltaMetrics, setDeltaMetrics] = useState<DeltaMetrics | null>(null);
  const [sweepSpeed, setSweepSpeed] = useState<number>(1);
  const [imageReady, setImageReady] = useState<boolean>(false);
  const [svsMeta, setSvsMeta] = useState<SVSApiMetadata | null>(null);
  const [exportStatus, setExportStatus] = useState<string>("");

  const activeFrame =
    activeDataset.frames[frameVariantIdx] ?? activeDataset.frames[0];
  const baselineFrame = activeDataset.frames[0];

  const filteredDatasets = useMemo(() => {
    if (categoryFilter === "all") return NASA_DATASETS;
    return NASA_DATASETS.filter((d) => d.category === categoryFilter);
  }, [categoryFilter]);

  useEffect(() => {
    latestMetricsRef.current = latestMetrics;
  }, [latestMetrics]);

  useEffect(() => {
    autoSeqRef.current = autoSequence;
  }, [autoSequence]);

  useEffect(() => {
    speedRef.current = sweepSpeed;
  }, [sweepSpeed]);

  // Reset frame index and flag metric extraction on dataset change
  useEffect(() => {
    const initialIdx =
      typeof requestedFrameIdx === "number" &&
      requestedFrameIdx >= 0 &&
      requestedFrameIdx < activeDataset.frames.length
        ? requestedFrameIdx
        : 0;
    setFrameVariantIdx(initialIdx);
    setDeltaCompare(false);
    setDeltaMetrics(null);
    outgoingSrcRef.current = null;
    morphAlphaRef.current = 0;
    prevActiveSrcRef.current = activeDataset.frames[initialIdx].localSrc;
    panOffsetRef.current = 0;
    scanPosRef.current = 0.5;
    dirtyMetricsRef.current = true;
  }, [activeDataset, requestedFrameIdx]);

  // Trigger smooth crossfade morph whenever active frame switches within same dataset
  useEffect(() => {
    if (prevActiveSrcRef.current && prevActiveSrcRef.current !== activeFrame.localSrc) {
      outgoingSrcRef.current = prevActiveSrcRef.current;
      morphAlphaRef.current = 0.96;
    }
    prevActiveSrcRef.current = activeFrame.localSrc;
    dirtyMetricsRef.current = true;
  }, [activeFrame.localSrc]);

  // Flag metric extraction when frame, scan mode, scale, or delta mode changes
  useEffect(() => {
    dirtyMetricsRef.current = true;
  }, [activeFrame.id, scanMode, scale, deltaCompare]);

  // Preload active dataset imagery
  useEffect(() => {
    let cancelled = false;
    const cached = Boolean(getCachedImage(activeFrame.localSrc));
    setImageReady(cached);
    if (cached) dirtyMetricsRef.current = true;

    loadImageAsset(activeFrame.localSrc)
      .then(() => {
        if (!cancelled) {
          setImageReady(true);
          dirtyMetricsRef.current = true;
        }
      })
      .catch(() => {
        if (!cancelled) setImageReady(false);
      });

    activeDataset.frames.forEach((f) => {
      void loadImageAsset(f.localSrc).catch(() => undefined);
    });

    return () => {
      cancelled = true;
    };
  }, [activeDataset, activeFrame.localSrc]);

  // Fetch live NASA SVS metadata from official server-side parser
  useEffect(() => {
    let active = true;
    fetch(`/api/svs/${activeDataset.svsId}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data: SVSApiMetadata | null) => {
        if (active && data) setSvsMeta(data);
      })
      .catch(() => undefined);
    return () => {
      active = false;
    };
  }, [activeDataset.svsId]);

  // Real-time CV extraction + Web Audio DSP drive (throttled state updates, zero idle re-render storm)
  useEffect(() => {
    let rafId = 0;
    let tickCount = 0;

    const computeABDelta = (
      imgA: HTMLImageElement,
      imgB: HTMLImageElement
    ): DeltaMetrics | null => {
      deltaCanvasRef.current ??= document.createElement("canvas");
      const dCanvas = deltaCanvasRef.current;
      dCanvas.width = 180;
      dCanvas.height = 101;
      const dctx = dCanvas.getContext("2d", { willReadFrequently: true });
      if (!dctx) return null;

      renderImageToCanvas(dctx, 180, 101, imgA, panOffsetRef.current, orbitalDrift);
      const mA = analyzeCanvasFrame(
        dctx,
        180,
        101,
        scanPosRef.current,
        scanMode,
        probeRef.current,
        activeDataset,
        scale,
        {
          projection: baselineFrame.projection,
          invertLuminance: baselineFrame.invertLuminance,
        }
      );

      renderImageToCanvas(dctx, 180, 101, imgB, panOffsetRef.current, orbitalDrift);
      const mB = analyzeCanvasFrame(
        dctx,
        180,
        101,
        scanPosRef.current,
        scanMode,
        probeRef.current,
        activeDataset,
        scale,
        {
          projection: activeFrame.projection,
          invertLuminance: activeFrame.invertLuminance,
        }
      );

      return {
        baselineLabel: baselineFrame.label,
        targetLabel: activeFrame.label,
        luminanceDelta: mB.luminance - mA.luminance,
        thermalDelta: mB.redMean - mA.redMean,
        densityDelta: mB.pixelDensity - mA.pixelDensity,
        baselineReading: mA.scientificReading,
        targetReading: mB.scientificReading,
      };
    };

    const loop = () => {
      const canvas = canvasRef.current;
      const nowMs = performance.now();
      if (canvas) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          if (isPlaying) {
            tickCount++;
            const step = (activeDataset.defaultBpm / 22000) * speedRef.current;
            const nextPos = scanPosRef.current + step;
            if (nextPos >= 1) {
              scanPosRef.current = nextPos % 1;
              if (
                autoSeqRef.current &&
                !deltaCompare &&
                activeDataset.frames.length > 1 &&
                nowMs - lastFrameAdvanceRef.current > 800
              ) {
                lastFrameAdvanceRef.current = nowMs;
                setFrameVariantIdx(
                  (prev) => (prev + 1) % activeDataset.frames.length
                );
              }
            } else {
              scanPosRef.current = nextPos;
            }

            if (orbitalDrift) {
              panOffsetRef.current = (panOffsetRef.current + 0.00055) % 1;
            }
          }

          if (morphAlphaRef.current > 0) {
            morphAlphaRef.current = Math.max(0, morphAlphaRef.current - 0.032);
            if (morphAlphaRef.current === 0) outgoingSrcRef.current = null;
          }

          const img = getCachedImage(activeFrame.localSrc);
          const baselineImg = getCachedImage(baselineFrame.localSrc);
          const outgoingImg = outgoingSrcRef.current
            ? getCachedImage(outgoingSrcRef.current)
            : null;

          if (deltaCompare && baselineImg && img) {
            renderCompositeFrameToCanvas(ctx, canvas.width, canvas.height, baselineImg, {
              secondaryImg: img,
              deltaCompare: true,
              splitPosition: scanMode === "horizontal" ? scanPosRef.current : 0.5,
              baselineLabel: baselineFrame.label,
              targetLabel: activeFrame.label,
              panOffsetNormalized: panOffsetRef.current,
              subtleMotion: orbitalDrift,
            });
          } else {
            renderCompositeFrameToCanvas(ctx, canvas.width, canvas.height, img, {
              secondaryImg: kinematicMotion ? outgoingImg : null,
              morphAlpha: kinematicMotion ? morphAlphaRef.current : 0,
              svsId: activeDataset.svsId,
              kinematicTime: kinematicMotion && isPlaying ? nowMs / 1000 : 0,
              panOffsetNormalized: panOffsetRef.current,
              subtleMotion: orbitalDrift,
            });
          }

          const shouldAnalyze =
            Boolean(img) &&
            (isPlaying || dirtyMetricsRef.current);

          let metrics = latestMetricsRef.current;
          if (shouldAnalyze) {
            metrics = analyzeCanvasFrame(
              ctx,
              canvas.width,
              canvas.height,
              scanPosRef.current,
              scanMode,
              probeRef.current,
              activeDataset,
              scale,
              {
                projection: activeFrame.projection,
                invertLuminance: activeFrame.invertLuminance,
              }
            );
            latestMetricsRef.current = metrics;
          }

          const showProbeRecently = nowMs - lastPointerActiveRef.current < 2400;
          drawScanlineOverlay(
            ctx,
            canvas.width,
            canvas.height,
            scanPosRef.current,
            scanMode,
            "#E5A93C",
            probeRef.current,
            {
              showProbeCallout: showProbeRecently,
              probeLabel: `${metrics.activeNoteName} · ${metrics.spatialZoneLabel}`,
            }
          );

          if (isPlaying && soundEngine && img) {
            soundEngine.updateFromMetrics(
              metrics,
              activeDataset,
              scale,
              activeDataset.defaultBpm * speedRef.current
            );
          }

          // Update React telemetry at ~10 Hz when playing, or once when paused & dirty
          if (img && ((isPlaying && tickCount % 6 === 0) || dirtyMetricsRef.current)) {
            dirtyMetricsRef.current = false;
            onMetricsUpdate(metrics);
            if (deltaCompare && baselineImg) {
              const delta = computeABDelta(baselineImg, img);
              if (delta) setDeltaMetrics(delta);
            }
          }
        }
      }

      // Draw Graticule FFT Spectrum & Oscilloscope
      const specCanvas = spectrumCanvasRef.current;
      if (specCanvas && soundEngine) {
        const sctx = specCanvas.getContext("2d");
        if (sctx) {
          const w = specCanvas.width;
          const h = specCanvas.height;
          sctx.fillStyle = "#040507";
          sctx.fillRect(0, 0, w, h);

          // Instrument graticule lines
          sctx.strokeStyle = "#161922";
          sctx.lineWidth = 1;
          sctx.beginPath();
          for (let gx = 1; gx < 6; gx++) {
            const x = (gx / 6) * w;
            sctx.moveTo(x, 0);
            sctx.lineTo(x, h);
          }
          for (let gy = 1; gy < 4; gy++) {
            const y = (gy / 4) * h;
            sctx.moveTo(0, y);
            sctx.lineTo(w, y);
          }
          sctx.stroke();

          const freqData = new Uint8Array(new ArrayBuffer(64));
          const waveData = new Uint8Array(new ArrayBuffer(128));
          soundEngine.getSpectrumData(freqData);
          soundEngine.getWaveformData(waveData);

          const bars = 32;
          const barW = w / bars;
          for (let i = 0; i < bars; i++) {
            const val = isPlaying
              ? freqData[i] / 255
              : latestMetricsRef.current.columnProfile[i % 32] * 0.4;
            const barH = Math.max(2, val * (h * 0.78));
            sctx.fillStyle = isPlaying ? "#E5A93C" : "#323846";
            sctx.fillRect(i * barW + 1.5, h - barH, barW - 3, barH);
          }

          sctx.strokeStyle = "#ECEBE6";
          sctx.lineWidth = 1.25;
          sctx.beginPath();
          for (let i = 0; i < waveData.length; i++) {
            const x = (i / (waveData.length - 1)) * w;
            const v = waveData[i] / 128.0;
            const y = isPlaying ? (v * h) / 2 : h / 2;
            if (i === 0) sctx.moveTo(x, y);
            else sctx.lineTo(x, y);
          }
          sctx.stroke();
        }
      }

      rafId = requestAnimationFrame(loop);
    };

    rafId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafId);
  }, [
    activeDataset,
    activeFrame.id,
    activeFrame.invertLuminance,
    activeFrame.label,
    activeFrame.localSrc,
    activeFrame.projection,
    baselineFrame.invertLuminance,
    baselineFrame.label,
    baselineFrame.localSrc,
    baselineFrame.projection,
    deltaCompare,
    isPlaying,
    kinematicMotion,
    orbitalDrift,
    scale,
    scanMode,
    soundEngine,
    onMetricsUpdate,
  ]);

  const handleCanvasPointer = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const nx = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const ny = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));
    const nowMs = performance.now();

    probeRef.current = { x: nx, y: ny };
    lastPointerActiveRef.current = nowMs;
    dirtyMetricsRef.current = true;

    if (scanMode === "horizontal") {
      scanPosRef.current = nx;
    } else if (scanMode === "vertical") {
      scanPosRef.current = ny;
    } else if (scanMode === "radar") {
      const angle = (Math.atan2(ny - 0.5, nx - 0.5) + Math.PI * 2) % (Math.PI * 2);
      scanPosRef.current = angle / (Math.PI * 2);
    }

    if (soundEngine && (e.type === "pointerdown" || nowMs - lastProbeAudioRef.current > 95)) {
      lastProbeAudioRef.current = nowMs;
      soundEngine.triggerTactileProbe(
        nx,
        ny,
        latestMetricsRef.current.luminance,
        scale,
        0.72
      );
    }
  };

  const handleStemChange = (
    id: StemId,
    patch: Partial<{ gain: number; muted: boolean; solo: boolean }>
  ) => {
    onUpdateStems((prev) => ({
      ...prev,
      [id]: { ...prev[id], ...patch },
    }));
  };

  const handleSnapshotDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const link = document.createElement("a");
    link.href = url;
    link.download = `terra-sonic-svs-${activeDataset.svsId}-${activeFrame.id}.png`;
    link.click();
    setExportStatus(`SAVED SNAPSHOT // SVS-${activeDataset.svsId}-${activeFrame.id}.PNG`);
    setTimeout(() => setExportStatus(""), 3200);
  };

  const projTag =
    latestMetrics.projection === "equirectangular"
      ? "EQUIRECTANGULAR"
      : latestMetrics.projection === "multi-strip-pollutants"
        ? "MULTI-STRIP SPHERE"
        : latestMetrics.projection === "regional-grid"
          ? "REGIONAL SECTOR"
          : latestMetrics.projection === "celestial-cluster"
            ? "DEEP-SPACE FIELD"
            : "ORTHOGRAPHIC GLOBE";

  return (
    <div className="instrument-rack grid grid-cols-1 border-x border-b border-[var(--hairline)] lg:grid-cols-12 lg:divide-x lg:divide-[var(--hairline)]">
      {/* MOD-01 // LEFT RACK — NASA SVS TELEMETRY BANK */}
      <aside
        aria-label="NASA Earth Information Center Dataset Bank"
        className="flex flex-col lg:col-span-3"
      >
        <div className="flex items-center justify-between border-b border-[var(--hairline)] bg-[var(--rack-panel)] px-3.5 py-2.5">
          <div>
            <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--sig-amber)]">
              MOD-01 // SVS TELEMETRY BANK
            </div>
            <div className="font-mono text-[10px] text-[var(--text-steel)]">
              HOTKEYS [1-9, 0] · {filteredDatasets.length} STREAMS
            </div>
          </div>
          <span className="border border-[var(--hairline-strong)] bg-[var(--display-well)] px-1.5 py-0.5 font-mono text-[10px] text-[var(--text-ivory)]">
            {activeDataset.trackNumber > 0
              ? `TRK-${String(activeDataset.trackNumber).padStart(2, "0")}`
              : "REF-00"}
          </span>
        </div>

        {/* Filter Bar */}
        <div
          role="group"
          aria-label="Filter NASA datasets by science category"
          className="flex flex-wrap gap-1 border-b border-[var(--hairline)] bg-[var(--display-well)] p-2"
        >
          {CATEGORY_FILTERS.map((cat) => {
            const active = categoryFilter === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`rounded-[2px] border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                  active
                    ? "border-[var(--sig-amber)] bg-[var(--sig-amber)] text-[#07080B]"
                    : "border-[var(--hairline)] bg-[var(--switch-cap)] text-[var(--text-steel)] hover:border-[var(--hairline-strong)] hover:text-[var(--text-ivory)]"
                }`}
              >
                {cat.label}
              </button>
            );
          })}
        </div>

        {/* High-Density Tape Rack List */}
        <div className="flex max-h-[680px] flex-col divide-y divide-[var(--hairline)] overflow-y-auto">
          {filteredDatasets.map((ds) => {
            const selected = ds.id === activeDataset.id;
            const thumbSrc = ds.frames[0]?.localSrc;
            return (
              <button
                key={ds.id}
                type="button"
                onClick={() => onSelectDataset(ds)}
                aria-pressed={selected}
                aria-label={`Select Track ${ds.trackNumber}: ${ds.title}, NASA SVS ${ds.svsId}`}
                className={`flex items-center gap-3 border-l-2 p-2.5 text-left transition-colors ${
                  selected
                    ? "border-l-[var(--sig-amber)] bg-[#151821]"
                    : "border-l-transparent bg-[var(--rack-panel)] hover:bg-[#13161e]"
                }`}
              >
                <div className="relative h-11 w-16 shrink-0 overflow-hidden border border-[var(--hairline-strong)] bg-[var(--display-well)]">
                  {thumbSrc && (
                    <img
                      src={thumbSrc}
                      alt={`${ds.shortTitle} thumbnail`}
                      className="h-full w-full object-cover"
                    />
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2 font-mono text-[10px]">
                    <span
                      className={
                        selected
                          ? "font-bold text-[var(--sig-amber)]"
                          : "text-[var(--text-engraved)]"
                      }
                    >
                      {ds.trackNumber > 0
                        ? `CH-${String(ds.trackNumber).padStart(2, "0")}`
                        : "CAL-00"}{" "}
                      // SVS-{ds.svsId}
                    </span>
                    {selected && isPlaying && (
                      <span className="font-bold text-[var(--sig-emerald)]">
                        [ON AIR]
                      </span>
                    )}
                  </div>
                  <div className="truncate text-xs font-semibold text-[var(--text-ivory)]">
                    {ds.shortTitle}
                  </div>
                  <div className="truncate font-mono text-[10px] text-[var(--text-steel)]">
                    {ds.instrumentSensor}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </aside>

      {/* MOD-02 // CENTER RACK — OPTICAL RETICLE VIEWPORT & TRANSPORT DECK */}
      <section
        aria-label="NASA SVS Visualization Viewport and Sonification Transport"
        className="flex flex-col divide-y divide-[var(--hairline)] lg:col-span-6"
      >
        {/* Dataset Hardware Header */}
        <div className="flex flex-wrap items-start justify-between gap-3 bg-[var(--rack-panel)] p-3.5">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.12em]">
              <span className="bg-[var(--sig-amber)] px-1.5 py-0.5 font-bold text-[#07080B]">
                MOD-02 // SVS-{activeDataset.svsId}
              </span>
              <span className="border border-[var(--hairline-strong)] bg-[var(--display-well)] px-2 py-0.5 text-[var(--text-steel)]">
                {activeDataset.instrumentSensor}
              </span>
              <span className="text-[var(--sig-emerald)]">
                {svsMeta?.source === "live-svs-page"
                  ? "LIVE SVS SYNCED"
                  : "VERIFIED ARCHIVE"}
              </span>
            </div>
            <h2 className="mt-1.5 font-display text-base font-bold tracking-tight text-[var(--text-ivory)] sm:text-lg">
              {activeDataset.title}
            </h2>
          </div>

          <a
            href={activeDataset.svsUrl}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open official NASA SVS ${activeDataset.svsId} webpage`}
            className="shrink-0 rounded-[2px] border border-[var(--hairline-strong)] bg-[var(--switch-cap)] px-2.5 py-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.1em] text-[var(--sig-ice)] transition-colors hover:border-[var(--sig-ice)]"
          >
            SVS RECORD ↗
          </a>
        </div>

        {/* Frame Sequence & Viewport Option Strip */}
        <div className="flex flex-wrap items-center justify-between gap-2 bg-[var(--display-well)] px-3.5 py-2">
          <div className="flex flex-wrap items-center gap-1">
            {activeDataset.frames.map((frame, idx) => {
              const active = idx === frameVariantIdx;
              return (
                <button
                  key={frame.id}
                  type="button"
                  onClick={() => setFrameVariantIdx(idx)}
                  className={`rounded-[2px] border px-2 py-1 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] transition-colors ${
                    active
                      ? "border-[var(--text-ivory)] bg-[var(--text-ivory)] text-[#07080B]"
                      : "border-[var(--hairline)] bg-[var(--switch-cap)] text-[var(--text-steel)] hover:text-[var(--text-ivory)]"
                  }`}
                >
                  F{idx + 1}: {frame.label}
                </button>
              );
            })}
          </div>

          <div className="flex flex-wrap items-center gap-1.5 font-mono text-[10px]">
            {activeDataset.frames.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setDeltaCompare((prev) => {
                      const next = !prev;
                      if (next && frameVariantIdx === 0) {
                        setFrameVariantIdx(1);
                      }
                      return next;
                    });
                  }}
                  aria-pressed={deltaCompare}
                  aria-label="Toggle split-screen scientific A versus B baseline comparison"
                  className={`rounded-[2px] border px-2 py-1 uppercase transition-colors ${
                    deltaCompare
                      ? "border-[var(--sig-amber)] bg-[#2b1f09] font-bold text-[var(--sig-amber)]"
                      : "border-[var(--hairline)] bg-[var(--switch-cap)] text-[var(--text-steel)] hover:text-[var(--text-ivory)]"
                  }`}
                >
                  DELTA A/B: {deltaCompare ? "ON" : "OFF"}
                </button>

                <button
                  type="button"
                  onClick={() => setAutoSequence((v) => !v)}
                  aria-pressed={autoSequence}
                  aria-label="Toggle automatic multi-frame time-series sequencing"
                  className={`rounded-[2px] border px-2 py-1 uppercase transition-colors ${
                    autoSequence
                      ? "border-[var(--sig-emerald)] bg-[#10261b] text-[var(--sig-emerald)]"
                      : "border-[var(--hairline)] bg-[var(--switch-cap)] text-[var(--text-steel)]"
                  }`}
                >
                  AUTO-SEQ: {autoSequence ? "ON" : "OFF"}
                </button>
              </>
            )}

            <button
              type="button"
              onClick={() => setKinematicMotion((v) => !v)}
              aria-pressed={kinematicMotion}
              aria-label="Toggle temporal morphing and optical phenomenon kinematics"
              className={`rounded-[2px] border px-2 py-1 uppercase transition-colors ${
                kinematicMotion
                  ? "border-[var(--sig-ice)] bg-[#101c31] text-[var(--sig-ice)]"
                  : "border-[var(--hairline)] bg-[var(--switch-cap)] text-[var(--text-steel)]"
              }`}
            >
              KINEMATICS: {kinematicMotion ? "ON" : "OFF"}
            </button>

            <button
              type="button"
              onClick={() => setOrbitalDrift((v) => !v)}
              aria-pressed={orbitalDrift}
              className={`rounded-[2px] border px-2 py-1 uppercase transition-colors ${
                orbitalDrift
                  ? "border-[var(--sig-ice)] bg-[#101c31] text-[var(--sig-ice)]"
                  : "border-[var(--hairline)] bg-[var(--switch-cap)] text-[var(--text-steel)]"
              }`}
            >
              DRIFT: {orbitalDrift ? "ON" : "OFF"}
            </button>

            <button
              type="button"
              onClick={() =>
                setSweepSpeed((curr) => {
                  const nextIdx =
                    (SWEEP_SPEEDS.indexOf(
                      curr as (typeof SWEEP_SPEEDS)[number]
                    ) +
                      1) %
                    SWEEP_SPEEDS.length;
                  return SWEEP_SPEEDS[nextIdx];
                })
              }
              aria-label={`Cycle optical sweep speed multiplier (currently ${sweepSpeed}x)`}
              className="rounded-[2px] border border-[var(--hairline)] bg-[var(--switch-cap)] px-2 py-1 uppercase text-[var(--sig-amber)] hover:border-[var(--sig-amber)]"
            >
              SPD {sweepSpeed}X
            </button>
          </div>
        </div>

        {/* Recessed Optical CRT/Monitor Viewport */}
        <div className="bg-[var(--rack-panel)] p-3.5">
          <div className="instrument-well border border-[var(--hairline-strong)]">
            {/* Top Bezel Telemetry Strip */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hairline)] bg-[#090b0f] px-3 py-1 font-mono text-[10px]">
              <div className="flex items-center gap-2">
                <span
                  aria-hidden="true"
                  className={`h-1.5 w-1.5 rounded-[1px] ${
                    isPlaying
                      ? "bg-[var(--sig-emerald)]"
                      : "bg-[var(--sig-amber)]"
                  }`}
                />
                <span className="font-bold text-[var(--text-ivory)]">
                  {isPlaying ? "SCANNING" : "HOLD"}
                </span>
                <span className="text-[var(--text-engraved)]">|</span>
                <span className="text-[var(--text-steel)]">
                  {activeFrame.label.toUpperCase()}
                </span>
              </div>
              <div className="text-[var(--sig-ice)]">
                PROJ: {projTag} · CLICK/DRAG TO SCRUB
              </div>
            </div>

            {/* Pure NASA Frame Optical Viewport */}
            <div className="relative bg-[#040507]">
              <canvas
                ref={canvasRef}
                width={720}
                height={405}
                onPointerDown={handleCanvasPointer}
                onPointerMove={(e) => {
                  if (e.buttons === 1 || scanMode === "probe") {
                    handleCanvasPointer(e);
                  }
                }}
                aria-label={`Interactive optical analysis viewport for ${activeDataset.title} — ${activeFrame.label}. Click or drag anywhere to scrub scanline and audition coordinates.`}
                className="aspect-video w-full cursor-crosshair touch-none"
              />

              {!imageReady && (
                <div className="absolute inset-0 flex items-center justify-center bg-[#040507] font-mono text-xs uppercase tracking-[0.12em] text-[var(--sig-amber)]">
                  ACQUIRING NASA SVS FRAME BUFFER...
                </div>
              )}
            </div>

            {/* Bottom Bezel Readout Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-t border-[var(--hairline)] bg-[#090b0f] px-3 py-1.5 font-mono text-[11px]">
              <span className="truncate text-[var(--text-steel)]">
                ZONE:{" "}
                <strong className="text-[var(--text-ivory)]">
                  {latestMetrics.spatialZoneLabel}
                </strong>
              </span>
              <span className="font-bold text-[var(--sig-amber)]">
                {latestMetrics.scientificReading}
              </span>
            </div>
          </div>

          {deltaCompare && deltaMetrics && (
            <div
              role="region"
              aria-label="Scientific Delta A/B Comparison Telemetry"
              className="mt-2.5 border border-[var(--sig-amber)] bg-[var(--display-well)] p-2.5 font-mono text-[11px]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--hairline)] pb-1.5 text-[10px]">
                <span className="font-bold uppercase tracking-[0.1em] text-[var(--sig-amber)]">
                  SCIENTIFIC DELTA ANALYSIS (A vs B AT SCANLINE)
                </span>
                <span className="text-[var(--text-steel)]">
                  A: {deltaMetrics.baselineLabel} ↔ B: {deltaMetrics.targetLabel}
                </span>
              </div>
              <div className="mt-2 grid grid-cols-3 gap-2">
                <DeltaBadge
                  label="Δ OPTICAL SIGNAL"
                  delta={deltaMetrics.luminanceDelta}
                />
                <DeltaBadge
                  label="Δ THERMAL / RED"
                  delta={deltaMetrics.thermalDelta}
                />
                <DeltaBadge
                  label="Δ PLUME DENSITY"
                  delta={deltaMetrics.densityDelta}
                />
              </div>
              <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-[10px] text-[var(--text-steel)]">
                <span>A: {deltaMetrics.baselineReading}</span>
                <span className="text-[var(--sig-emerald)]">B: {deltaMetrics.targetReading}</span>
              </div>
            </div>
          )}

          <p className="mt-2 font-mono text-[11px] text-[var(--text-steel)]">
            FRAME NOTE: {activeFrame.caption}
          </p>

          {/* Hardware Transport Switch Bank */}
          <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-[var(--hairline)] pt-3">
            <button
              type="button"
              onClick={onTogglePlay}
              aria-label={
                isPlaying
                  ? "Hold optical sonification (Space)"
                  : "Engage optical sonification (Space)"
              }
              className={`rounded-[2px] border px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
                isPlaying
                  ? "border-[var(--sig-amber)] bg-[var(--sig-amber)] text-[#07080B]"
                  : "border-[var(--sig-emerald)] bg-[var(--sig-emerald)] text-[#07080B] hover:opacity-90"
              }`}
            >
              {isPlaying ? "⏸ HOLD SCAN [SPACE]" : "▶ ENGAGE SONIFICATION [SPACE]"}
            </button>

            <button
              type="button"
              onClick={() => onNarrateTelemetry(latestMetrics)}
              aria-label="Speak live telemetry and scientific story (Hotkey N)"
              className="rounded-[2px] border border-[var(--hairline-strong)] bg-[var(--switch-cap)] px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--text-ivory)] transition-colors hover:border-[var(--sig-ice)] hover:text-[var(--sig-ice)]"
            >
              TTS SPEAK [N]
            </button>

            <button
              type="button"
              onClick={onToggleRecord}
              aria-label={
                isRecording
                  ? "Stop recording and download WAV audio (Hotkey R)"
                  : "Record sonification as WAV audio (Hotkey R)"
              }
              className={`rounded-[2px] border px-3 py-2 font-mono text-[11px] font-semibold uppercase tracking-[0.08em] transition-colors ${
                isRecording
                  ? "border-[var(--sig-vermilion)] bg-[var(--sig-vermilion)] font-bold text-[#07080B]"
                  : "border-[var(--hairline-strong)] bg-[var(--switch-cap)] text-[var(--text-ivory)] hover:border-[var(--sig-vermilion)]"
              }`}
            >
              {isRecording ? "■ STOP & SAVE .WAV" : "● REC .WAV [R]"}
            </button>

            <button
              type="button"
              onClick={handleSnapshotDownload}
              aria-label="Export analyzed PNG frame"
              className="rounded-[2px] border border-[var(--hairline-strong)] bg-[var(--switch-cap)] px-3 py-2 font-mono text-[11px] uppercase tracking-[0.08em] text-[var(--text-steel)] transition-colors hover:border-[var(--text-ivory)] hover:text-[var(--text-ivory)]"
            >
              EXPORT PNG
            </button>
          </div>

          {exportStatus && (
            <p
              role="status"
              className="mt-2 font-mono text-[11px] text-[var(--sig-emerald)]"
            >
              // {exportStatus}
            </p>
          )}

          {/* Scan Pattern & Scale Quantizer Controls */}
          <div className="mt-3 grid grid-cols-1 gap-3 border-t border-[var(--hairline)] pt-3 sm:grid-cols-2">
            <div>
              <label
                htmlFor="scan-mode-select"
                className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-engraved)]"
              >
                SCAN GEOMETRY [S]
              </label>
              <select
                id="scan-mode-select"
                value={scanMode}
                onChange={(e) => onChangeScanMode(e.target.value as ScanMode)}
                className="w-full rounded-[2px] border border-[var(--hairline-strong)] bg-[var(--display-well)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-ivory)]"
              >
                {SCAN_MODES.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label
                htmlFor="musical-scale-select"
                className="mb-1 block font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-engraved)]"
              >
                HARMONIC QUANTIZER [M]
              </label>
              <select
                id="musical-scale-select"
                value={scale}
                onChange={(e) => onChangeScale(e.target.value as ScaleType)}
                className="w-full rounded-[2px] border border-[var(--hairline-strong)] bg-[var(--display-well)] px-2.5 py-1.5 font-mono text-xs text-[var(--text-ivory)]"
              >
                {SCALE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Scientific Context & Sight-to-Sound Mapping Ledger */}
        <div className="bg-[var(--rack-panel)] p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-mono text-[11px] font-bold uppercase tracking-[0.12em] text-[var(--sig-amber)]">
              OPTICAL-TO-DSP MAPPING PATCH // {activeDataset.shortTitle.toUpperCase()}
            </h3>
            <span className="font-mono text-[10px] text-[var(--text-engraved)]">
              WINDOW: {activeDataset.timeframe}
            </span>
          </div>
          <p className="mt-1.5 text-xs leading-relaxed text-[var(--text-steel)]">
            {svsMeta?.description || activeDataset.climateStory}
          </p>

          <div className="mt-3 grid grid-cols-1 divide-y divide-[var(--hairline)] border border-[var(--hairline)] bg-[var(--display-well)] sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {activeDataset.mappingRules.map((rule) => (
              <div key={rule.visualFeature} className="p-2.5">
                <div className="font-mono text-[10px] font-bold uppercase text-[var(--sig-ice)]">
                  IN: {rule.visualFeature}
                </div>
                <div className="mt-0.5 font-mono text-[11px] font-semibold text-[var(--text-ivory)]">
                  OUT → {rule.audioParameter}
                </div>
                <p className="mt-1 text-[11px] text-[var(--text-steel)]">
                  {rule.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MOD-03 & MOD-04 // RIGHT RACK — TELEMETRY METERS + SCOPE + 4-BUS MIXER */}
      <aside
        aria-label="Real-Time Optical Telemetry and 4-Bus Synth Mixer"
        className="flex flex-col divide-y divide-[var(--hairline)] lg:col-span-3"
      >
        {/* MOD-03: Optical CV Signal Meters */}
        <div aria-live="polite" className="bg-[var(--rack-panel)] p-3.5">
          <div className="mb-3 flex items-center justify-between border-b border-[var(--hairline)] pb-2">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--sig-emerald)]">
              MOD-03 // OPTICAL TELEMETRY
            </h3>
            <span className="border border-[var(--hairline-strong)] bg-[var(--display-well)] px-2 py-0.5 font-mono text-[11px] font-bold text-[var(--sig-amber)]">
              {latestMetrics.activeNoteName} · {latestMetrics.activeChordName}
            </span>
          </div>

          <div className="space-y-3">
            <SegmentedLedMeter
              label={
                activeFrame.invertLuminance
                  ? "OPTICAL ABSORPTION"
                  : "LUMINANCE / PITCH"
              }
              value={latestMetrics.luminance}
            />
            <SegmentedLedMeter
              label="SIGNAL DENSITY / BPM"
              value={latestMetrics.pixelDensity}
            />
            <SegmentedLedMeter
              label="CONTRAST / TEXTURE"
              value={latestMetrics.contrastEnergy}
            />

            <div className="grid grid-cols-3 divide-x divide-[var(--hairline)] border border-[var(--hairline)] bg-[var(--display-well)] font-mono">
              <div className="p-2 text-center">
                <div className="text-[10px] text-[var(--sig-vermilion)]">CH-R</div>
                <div className="text-xs font-bold text-[var(--text-ivory)]">
                  {Math.round(latestMetrics.redMean * 100)}%
                </div>
              </div>
              <div className="p-2 text-center">
                <div className="text-[10px] text-[var(--sig-emerald)]">CH-G</div>
                <div className="text-xs font-bold text-[var(--text-ivory)]">
                  {Math.round(latestMetrics.greenMean * 100)}%
                </div>
              </div>
              <div className="p-2 text-center">
                <div className="text-[10px] text-[var(--sig-ice)]">CH-B</div>
                <div className="text-xs font-bold text-[var(--text-ivory)]">
                  {Math.round(latestMetrics.blueMean * 100)}%
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between border border-[var(--hairline)] bg-[var(--display-well)] px-2.5 py-1.5 font-mono text-[11px]">
              <span className="text-[var(--text-steel)]">STEREO AZIMUTH</span>
              <span className="font-bold text-[var(--sig-ice)]">
                {latestMetrics.spatialPan < -0.15
                  ? `L ${Math.abs(Math.round(latestMetrics.spatialPan * 100))}%`
                  : latestMetrics.spatialPan > 0.15
                    ? `R +${Math.round(latestMetrics.spatialPan * 100)}%`
                    : "CTR 0%"}
              </span>
            </div>
          </div>
        </div>

        {/* Graticule FFT & Oscilloscope */}
        <div className="bg-[var(--rack-panel)] p-3.5">
          <div className="mb-2 flex items-center justify-between font-mono text-[10px] uppercase tracking-[0.12em]">
            <span className="font-bold text-[var(--text-steel)]">
              FFT SPECTRUM &amp; SCOPE
            </span>
            <span className="text-[var(--text-engraved)]">48 kHz / FLOAT32</span>
          </div>
          <canvas
            ref={spectrumCanvasRef}
            width={300}
            height={92}
            aria-label="Live audio spectrum analyzer and oscilloscope"
            className="w-full border border-[var(--hairline-strong)] bg-[var(--display-well)]"
          />
        </div>

        {/* MOD-04: 4-Bus Synth Mixing Console */}
        <div className="flex-1 bg-[var(--rack-panel)] p-3.5">
          <div className="mb-3 flex items-center justify-between border-b border-[var(--hairline)] pb-2">
            <h3 className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--sig-amber)]">
              MOD-04 // 4-BUS DSP MIXER
            </h3>
            <div className="flex items-center gap-2 font-mono text-[10px]">
              <span className="text-[var(--text-steel)]">MST</span>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={masterVolume}
                onChange={(e) => onChangeMasterVolume(Number(e.target.value))}
                aria-label="Master Bus Output Level"
                className="w-16"
              />
              <span className="w-12 text-right font-bold text-[var(--text-ivory)]">
                {formatDb(masterVolume)}
              </span>
            </div>
          </div>

          <div className="space-y-2">
            {(["melody", "harmony", "rhythm", "texture"] as StemId[]).map(
              (stemId) => {
                const st = stems[stemId];
                return (
                  <div
                    key={stemId}
                    className="border border-[var(--hairline)] bg-[var(--display-well)] p-2.5"
                  >
                    <div className="mb-1.5 flex items-center justify-between gap-2">
                      <div className="min-w-0">
                        <div className="font-mono text-[9px] font-bold uppercase tracking-[0.1em] text-[var(--text-engraved)]">
                          {STEM_LABELS[stemId]}
                        </div>
                        <div className="truncate text-xs font-semibold text-[var(--text-ivory)]">
                          {activeDataset.stemDescriptions[stemId]}
                        </div>
                      </div>

                      <div className="flex shrink-0 items-center gap-1 font-mono text-[10px]">
                        <button
                          type="button"
                          onClick={() =>
                            handleStemChange(stemId, { muted: !st.muted })
                          }
                          aria-pressed={st.muted}
                          aria-label={`Mute ${stemId} bus`}
                          className={`h-5 w-6 rounded-[2px] border font-bold transition-colors ${
                            st.muted
                              ? "border-[var(--sig-vermilion)] bg-[var(--sig-vermilion)] text-[#07080B]"
                              : "border-[var(--hairline-strong)] bg-[var(--switch-cap)] text-[var(--text-steel)] hover:text-[var(--text-ivory)]"
                          }`}
                        >
                          M
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            handleStemChange(stemId, { solo: !st.solo })
                          }
                          aria-pressed={st.solo}
                          aria-label={`Solo ${stemId} bus`}
                          className={`h-5 w-6 rounded-[2px] border font-bold transition-colors ${
                            st.solo
                              ? "border-[var(--sig-amber)] bg-[var(--sig-amber)] text-[#07080B]"
                              : "border-[var(--hairline-strong)] bg-[var(--switch-cap)] text-[var(--text-steel)] hover:text-[var(--text-ivory)]"
                          }`}
                        >
                          S
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <input
                        type="range"
                        min={0}
                        max={1}
                        step={0.02}
                        value={st.gain}
                        onChange={(e) =>
                          handleStemChange(stemId, {
                            gain: Number(e.target.value),
                          })
                        }
                        aria-label={`${activeDataset.stemDescriptions[stemId]} fader level`}
                        className="flex-1"
                      />
                      <span className="w-12 text-right font-mono text-[10px] text-[var(--text-steel)]">
                        {formatDb(st.gain)}
                      </span>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}

function DeltaBadge({ label, delta }: { label: string; delta: number }) {
  const pct = Math.round(delta * 100);
  const sign = pct > 0 ? "+" : "";
  const color =
    pct > 4
      ? "text-[var(--sig-amber)]"
      : pct < -4
        ? "text-[var(--sig-ice)]"
        : "text-[var(--sig-emerald)]";
  return (
    <div className="border border-[var(--hairline)] bg-[#07090d] p-2">
      <div className="text-[9px] uppercase tracking-[0.08em] text-[var(--text-engraved)]">
        {label}
      </div>
      <div className={`mt-0.5 text-sm font-bold ${color}`}>
        {sign}
        {pct}%
      </div>
    </div>
  );
}
