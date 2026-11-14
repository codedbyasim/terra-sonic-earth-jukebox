"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import SegmentedLedMeter from "@/components/SegmentedLedMeter";
import { analyzeCanvasFrame } from "@/lib/cv-analyzer";
import {
  drawScanlineOverlay,
  loadImageAsset,
  renderImageToCanvas,
} from "@/lib/frame-renderer";
import { NASA_DATASETS } from "@/lib/nasa-datasets";
import type { EarthSoundEngine } from "@/lib/sound-engine";
import type {
  CustomMediaSourceMode,
  CVFrameMetrics,
  FrameProjection,
  ScaleType,
  ScanMode,
} from "@/lib/types";

interface CustomFrameLabProps {
  scale: ScaleType;
  scanMode: ScanMode;
  soundEngine: EarthSoundEngine | null;
}

export default function CustomFrameLab({
  scale,
  scanMode,
  soundEngine,
}: CustomFrameLabProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeImgRef = useRef<HTMLImageElement | null>(null);
  const scanRef = useRef<number>(0.5);
  const dirtyRef = useRef<boolean>(true);

  const archiveFrames = useMemo(
    () =>
      NASA_DATASETS.flatMap((ds) =>
        ds.frames.map((frame) => ({
          ...frame,
          dataset: ds,
          datasetTitle: ds.shortTitle,
          svsId: ds.svsId,
        }))
      ),
    []
  );

  const [sourceMode, setSourceMode] =
    useState<CustomMediaSourceMode>("archive-frame");
  const [selectedArchiveId, setSelectedArchiveId] = useState<string>(
    archiveFrames[0].id
  );
  const [remoteUrlInput, setRemoteUrlInput] = useState<string>(
    archiveFrames[0].remoteUrl
  );
  const [activeLabel, setActiveLabel] = useState<string>(
    `${archiveFrames[0].datasetTitle} — ${archiveFrames[0].label}`
  );
  const [statusMessage, setStatusMessage] = useState<string>("");
  const [labPlaying, setLabPlaying] = useState<boolean>(false);
  const [labMetrics, setLabMetrics] = useState<CVFrameMetrics | null>(null);

  const activeArchiveItem = useMemo(
    () =>
      archiveFrames.find((f) => f.id === selectedArchiveId) ?? archiveFrames[0],
    [archiveFrames, selectedArchiveId]
  );

  const activeDataset =
    sourceMode === "archive-frame"
      ? activeArchiveItem.dataset
      : NASA_DATASETS[9]; // Calibration coordinate reference for custom arbitrary uploads

  const activeProjection: FrameProjection =
    sourceMode === "archive-frame"
      ? activeArchiveItem.projection
      : "regional-grid";

  const invertLuminance =
    sourceMode === "archive-frame"
      ? Boolean(activeArchiveItem.invertLuminance)
      : false;

  useEffect(() => {
    if (sourceMode !== "archive-frame") return;
    let cancelled = false;
    loadImageAsset(activeArchiveItem.localSrc)
      .then((img) => {
        if (!cancelled) {
          activeImgRef.current = img;
          dirtyRef.current = true;
          setActiveLabel(
            `${activeArchiveItem.datasetTitle} — ${activeArchiveItem.label}`
          );
          setStatusMessage("");
        }
      })
      .catch(() => {
        if (!cancelled) setStatusMessage("ERR // UNABLE TO LOAD ARCHIVE FRAME.");
      });

    return () => {
      cancelled = true;
    };
  }, [activeArchiveItem, sourceMode]);

  useEffect(() => {
    dirtyRef.current = true;
  }, [scanMode, scale, activeProjection, invertLuminance]);

  useEffect(() => {
    let rafId = 0;
    let ticks = 0;

    const tick = () => {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          if (labPlaying) {
            ticks++;
            scanRef.current = (scanRef.current + 0.0045) % 1;
          }

          const img = activeImgRef.current;
          renderImageToCanvas(ctx, canvas.width, canvas.height, img, 0, false);

          if (img && (labPlaying || dirtyRef.current)) {
            const effectiveMode = scanMode === "probe" ? "horizontal" : scanMode;
            const metrics = analyzeCanvasFrame(
              ctx,
              canvas.width,
              canvas.height,
              scanRef.current,
              effectiveMode,
              { x: 0.5, y: 0.5 },
              activeDataset,
              scale,
              {
                projection: activeProjection,
                invertLuminance,
              }
            );

            drawScanlineOverlay(
              ctx,
              canvas.width,
              canvas.height,
              scanRef.current,
              effectiveMode,
              "#E5A93C",
              { x: 0.5, y: 0.5 }
            );

            if (labPlaying && soundEngine) {
              soundEngine.updateFromMetrics(metrics, activeDataset, scale, 108);
            }

            if ((labPlaying && ticks % 6 === 0) || dirtyRef.current) {
              dirtyRef.current = false;
              setLabMetrics(metrics);
            }
          } else if (img) {
            drawScanlineOverlay(
              ctx,
              canvas.width,
              canvas.height,
              scanRef.current,
              scanMode === "probe" ? "horizontal" : scanMode,
              "#E5A93C",
              { x: 0.5, y: 0.5 }
            );
          }
        }
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [
    activeDataset,
    activeProjection,
    invertLuminance,
    labPlaying,
    scale,
    scanMode,
    soundEngine,
  ]);

  useEffect(() => {
    return () => {
      soundEngine?.stopPlayback();
    };
  }, [soundEngine]);

  const toggleLabPlay = () => {
    if (!soundEngine) return;
    if (labPlaying) {
      soundEngine.stopPlayback();
      setLabPlaying(false);
    } else {
      soundEngine.startPlayback();
      setLabPlaying(true);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const img = new Image();
      img.onload = () => {
        activeImgRef.current = img;
        dirtyRef.current = true;
        setSourceMode("local-upload");
        setActiveLabel(`LOCAL UPLOAD // ${file.name}`);
        setStatusMessage("LOCAL FRAME LOADED INTO CV OPTICAL PIPELINE.");
      };
      if (typeof reader.result === "string") {
        img.src = reader.result;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLoadRemoteSvs = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = remoteUrlInput.trim();
    if (!trimmed.startsWith("https://svs.gsfc.nasa.gov/vis/")) {
      setStatusMessage(
        "ERR // URL MUST BEGIN WITH https://svs.gsfc.nasa.gov/vis/..."
      );
      return;
    }

    setStatusMessage("FETCHING LIVE SVS ASSET VIA CORS PROXY...");
    try {
      const proxySrc = `/api/svs/proxy?url=${encodeURIComponent(trimmed)}`;
      const img = await loadImageAsset(proxySrc);
      activeImgRef.current = img;
      dirtyRef.current = true;
      setSourceMode("remote-svs-url");
      setActiveLabel("LIVE PROXIED NASA SVS FRAME");
      setStatusMessage("LIVE SVS FRAME ACQUIRED.");
    } catch {
      setStatusMessage(
        "ERR // UNABLE TO FETCH SVS ASSET. CHECK DIRECT .JPG OR .PNG PATH UNDER /vis/."
      );
    }
  };

  return (
    <section
      aria-label="Custom NASA Media Ingestion Console"
      className="instrument-rack grid grid-cols-1 divide-y divide-[var(--hairline)] border-x border-b border-[var(--hairline)] lg:grid-cols-12 lg:divide-x lg:divide-y-0"
    >
      {/* Left Bay: Ingestion & Frame Archive */}
      <aside className="flex flex-col divide-y divide-[var(--hairline)] bg-[var(--rack-panel)] lg:col-span-4">
        <div className="p-3.5">
          <div className="font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--sig-amber)]">
            CUSTOM INGESTION CONSOLE
          </div>
          <h2 className="mt-1 font-display text-base font-bold text-[var(--text-ivory)]">
            Local Upload &amp; Live NASA SVS Fetch
          </h2>
          <p className="mt-1 font-mono text-[11px] leading-relaxed text-[var(--text-steel)]">
            Feed any image file, live <span className="text-[var(--sig-ice)]">svs.gsfc.nasa.gov/vis/</span> frame, or select from all {archiveFrames.length} bundled SVS assets.
          </p>
        </div>

        {/* Local File Ingest */}
        <div className="p-3.5">
          <label
            htmlFor="custom-frame-upload"
            className="flex cursor-pointer flex-col items-center justify-center gap-1.5 border border-dashed border-[var(--hairline-strong)] bg-[var(--display-well)] p-3.5 text-center transition-colors hover:border-[var(--sig-amber)]"
          >
            <span className="font-mono text-xs font-bold uppercase tracking-[0.08em] text-[var(--text-ivory)]">
              [+] UPLOAD LOCAL IMAGE FRAME
            </span>
            <span className="font-mono text-[10px] text-[var(--text-steel)]">
              PNG / JPG / WEBP · DIRECT CLIENT CANVAS DECODE
            </span>
            <input
              id="custom-frame-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleFileUpload}
              className="sr-only"
            />
          </label>
        </div>

        {/* Live SVS CORS Proxy Fetch */}
        <form onSubmit={handleLoadRemoteSvs} className="space-y-2 p-3.5">
          <label
            htmlFor="remote-svs-url"
            className="block font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--sig-emerald)]"
          >
            PROXY LIVE NASA SVS ASSET URL
          </label>
          <div className="flex gap-1.5">
            <input
              id="remote-svs-url"
              type="url"
              value={remoteUrlInput}
              onChange={(e) => setRemoteUrlInput(e.target.value)}
              placeholder="https://svs.gsfc.nasa.gov/vis/..."
              className="min-w-0 flex-1 rounded-[2px] border border-[var(--hairline-strong)] bg-[var(--display-well)] px-2.5 py-1.5 font-mono text-[11px] text-[var(--text-ivory)]"
            />
            <button
              type="submit"
              className="shrink-0 rounded-[2px] border border-[var(--sig-amber)] bg-[var(--sig-amber)] px-3 py-1.5 font-mono text-[11px] font-bold uppercase text-[#07080B]"
            >
              FETCH
            </button>
          </div>
          {statusMessage && (
            <p
              role="status"
              className="font-mono text-[11px] text-[var(--sig-emerald)]"
            >
              // {statusMessage}
            </p>
          )}
        </form>

        {/* Bundled Archive Picker */}
        <div className="flex-1 p-3.5">
          <div className="mb-2 font-mono text-[10px] font-bold uppercase tracking-[0.12em] text-[var(--text-engraved)]">
            SVS ARCHIVE BANK ({archiveFrames.length} FRAMES)
          </div>
          <div className="max-h-72 divide-y divide-[var(--hairline)] overflow-y-auto border border-[var(--hairline)] bg-[var(--display-well)]">
            {archiveFrames.map((item) => {
              const active =
                sourceMode === "archive-frame" && selectedArchiveId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setSourceMode("archive-frame");
                    setSelectedArchiveId(item.id);
                  }}
                  className={`flex w-full items-center gap-2.5 border-l-2 p-2 text-left transition-colors ${
                    active
                      ? "border-l-[var(--sig-amber)] bg-[#151821]"
                      : "border-l-transparent hover:bg-[#10131b]"
                  }`}
                >
                  <img
                    src={item.localSrc}
                    alt={item.label}
                    className="h-9 w-14 shrink-0 border border-[var(--hairline)] object-cover"
                  />
                  <div className="min-w-0">
                    <div className="truncate font-mono text-[11px] font-bold text-[var(--text-ivory)]">
                      {item.datasetTitle} · {item.label}
                    </div>
                    <div className="font-mono text-[10px] text-[var(--text-steel)]">
                      SVS-{item.svsId} · {item.projection.toUpperCase()}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* Right Bay: Optical Extraction Viewport */}
      <div className="flex flex-col divide-y divide-[var(--hairline)] bg-[var(--rack-panel)] lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5">
          <div>
            <div className="font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--sig-ice)]">
              REAL-TIME OPTICAL EXTRACTION
            </div>
            <h3 className="font-display text-base font-bold text-[var(--text-ivory)]">
              {activeLabel}
            </h3>
          </div>

          <button
            type="button"
            onClick={toggleLabPlay}
            className={`rounded-[2px] border px-4 py-2 font-mono text-xs font-bold uppercase tracking-[0.1em] transition-colors ${
              labPlaying
                ? "border-[var(--sig-amber)] bg-[var(--sig-amber)] text-[#07080B]"
                : "border-[var(--sig-emerald)] bg-[var(--sig-emerald)] text-[#07080B]"
            }`}
          >
            {labPlaying ? "⏸ PAUSE SYNTH" : "▶ SONIFY FRAME"}
          </button>
        </div>

        <div className="p-3.5">
          <div className="instrument-well border border-[var(--hairline-strong)] bg-[#040507]">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] bg-[#090b0f] px-3 py-1 font-mono text-[10px]">
              <span className="text-[var(--text-steel)]">
                SOURCE: {sourceMode.toUpperCase()}
              </span>
              <span className="text-[var(--sig-amber)]">
                {labMetrics?.scientificReading ?? "READY FOR OPTICAL SCAN"}
              </span>
            </div>
            <canvas
              ref={canvasRef}
              width={720}
              height={405}
              aria-label="Custom NASA media optical sonification canvas"
              className="aspect-video w-full"
            />
          </div>
        </div>

        {labMetrics && (
          <div
            aria-live="polite"
            className="grid grid-cols-1 gap-3 p-3.5 sm:grid-cols-2 lg:grid-cols-4"
          >
            <SegmentedLedMeter
              label="OPTICAL SIGNAL"
              value={labMetrics.luminance}
            />
            <SegmentedLedMeter
              label="SIGNAL DENSITY"
              value={labMetrics.pixelDensity}
            />
            <SegmentedLedMeter
              label="CONTRAST ENERGY"
              value={labMetrics.contrastEnergy}
            />
            <div className="border border-[var(--hairline)] bg-[var(--display-well)] p-2.5 font-mono">
              <div className="text-[10px] text-[var(--text-engraved)]">
                ACTIVE PITCH
              </div>
              <div className="mt-1 text-base font-bold text-[var(--sig-emerald)]">
                {labMetrics.activeNoteName} · {labMetrics.activeChordName}
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
