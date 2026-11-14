"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import CustomFrameLab from "@/components/CustomFrameLab";
import JukeboxStudio from "@/components/JukeboxStudio";
import TactileExplorer from "@/components/TactileExplorer";
import {
  speakTelemetry,
  speakTrackIntro,
  stopSpeaking,
} from "@/lib/accessibility-narrator";
import { NASA_DATASETS, TEAMX_INFO } from "@/lib/nasa-datasets";
import { EarthSoundEngine } from "@/lib/sound-engine";
import type {
  CVFrameMetrics,
  NASADataset,
  ScaleType,
  ScanMode,
  StemsMap,
} from "@/lib/types";

type ActiveTab = "jukebox" | "tactile" | "custom";

const INITIAL_METRICS: CVFrameMetrics = {
  luminance: 0.25,
  redMean: 0.22,
  greenMean: 0.24,
  blueMean: 0.28,
  pixelDensity: 0.34,
  contrastEnergy: 0.31,
  transientSpike: 0.05,
  spatialPan: 0,
  spatialElevation: 0.5,
  dominantHue: 210,
  columnProfile: Array(32).fill(0.25),
  activeNoteName: "G4",
  activeChordName: "Cmaj7",
  scientificReading: "Optical Radiance Index: 25.0% · Peak Density 34%",
  projection: "equirectangular",
  spatialZoneLabel: "Central Meridian · 0°N, 0°E",
};

const INITIAL_STEMS: StemsMap = {
  melody: { gain: 0.78, muted: false, solo: false },
  harmony: { gain: 0.72, muted: false, solo: false },
  rhythm: { gain: 0.75, muted: false, solo: false },
  texture: { gain: 0.6, muted: false, solo: false },
};

const SCALE_ORDER: ScaleType[] = [
  "pentatonic",
  "lydian",
  "dorian",
  "harmonicMinor",
  "scientificChromatic",
];

const SCAN_ORDER: ScanMode[] = ["horizontal", "vertical", "radar", "probe"];

export default function HomePage() {
  const engineRef = useRef<EarthSoundEngine | null>(null);
  const [soundEngine, setSoundEngine] = useState<EarthSoundEngine | null>(null);

  const [activeTab, setActiveTab] = useState<ActiveTab>("jukebox");
  const [activeDataset, setActiveDataset] = useState<NASADataset>(
    NASA_DATASETS[0]
  );
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [scale, setScale] = useState<ScaleType>(NASA_DATASETS[0].defaultScale);
  const [scanMode, setScanMode] = useState<ScanMode>("horizontal");
  const [stems, setStems] = useState<StemsMap>(INITIAL_STEMS);
  const [masterVolume, setMasterVolume] = useState<number>(0.75);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [highContrast, setHighContrast] = useState<boolean>(false);
  const [showShortcuts, setShowShortcuts] = useState<boolean>(false);
  const [latestMetrics, setLatestMetrics] =
    useState<CVFrameMetrics>(INITIAL_METRICS);
  const [toastMessage, setToastMessage] = useState<string>("");

  useEffect(() => {
    const engine = new EarthSoundEngine();
    engineRef.current = engine;
    setSoundEngine(engine);
    return () => {
      engine.dispose();
    };
  }, []);

  useEffect(() => {
    engineRef.current?.applyStemMix(stems);
  }, [stems]);

  useEffect(() => {
    engineRef.current?.setMasterVolume(masterVolume);
  }, [masterVolume]);

  const showNotice = useCallback((msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(""), 3600);
  }, []);

  const handleSelectDataset = useCallback(
    (ds: NASADataset) => {
      setActiveDataset(ds);
      setScale(ds.defaultScale);
      if (isPlaying) {
        speakTrackIntro(ds);
      }
      showNotice(`LOADED SVS-${ds.svsId} // ${ds.shortTitle.toUpperCase()}`);
    },
    [isPlaying, showNotice]
  );

  const handleTogglePlay = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;
    if (isPlaying) {
      eng.stopPlayback();
      setIsPlaying(false);
    } else {
      eng.startPlayback();
      eng.applyStemMix(stems);
      eng.setMasterVolume(masterVolume);
      setIsPlaying(true);
    }
  }, [isPlaying, masterVolume, stems]);

  const handleTabSwitch = (next: ActiveTab) => {
    if (next !== "jukebox" && isPlaying) {
      engineRef.current?.stopPlayback();
      setIsPlaying(false);
    }
    setActiveTab(next);
  };

  const handleToggleRecord = useCallback(() => {
    const eng = engineRef.current;
    if (!eng) return;

    if (!isRecording) {
      if (!isPlaying) {
        eng.startPlayback();
        setIsPlaying(true);
      }
      eng.startRecording();
      setIsRecording(true);
      showNotice("PCM RECORDER ENGAGED // CAPTURING REAL-TIME DSP OUTPUT");
    } else {
      const result = eng.stopRecordingAndExportWav(activeDataset);
      setIsRecording(false);
      if (!result) {
        showNotice("NO AUDIO BUFFER CAPTURED // RUN TRANSPORT 1-2s FIRST");
        return;
      }

      const wavUrl = URL.createObjectURL(result.wavBlob);
      const wavLink = document.createElement("a");
      wavLink.href = wavUrl;
      wavLink.download = `terra-sonic-svs-${activeDataset.svsId}.wav`;
      wavLink.click();
      URL.revokeObjectURL(wavUrl);

      const jsonBlob = new Blob([result.metadataJson], {
        type: "application/json",
      });
      const jsonUrl = URL.createObjectURL(jsonBlob);
      const jsonLink = document.createElement("a");
      jsonLink.href = jsonUrl;
      jsonLink.download = `terra-sonic-svs-${activeDataset.svsId}-metadata.json`;
      jsonLink.click();
      URL.revokeObjectURL(jsonUrl);

      showNotice(
        `EXPORTED ${result.durationSeconds}s .WAV + SI-DISCLOSURE .JSON`
      );
    }
  }, [activeDataset, isPlaying, isRecording, showNotice]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "SELECT" ||
          target.tagName === "TEXTAREA")
      ) {
        return;
      }

      if (e.code === "Space" && activeTab === "jukebox") {
        e.preventDefault();
        handleTogglePlay();
      } else if (e.key >= "1" && e.key <= "9") {
        const idx = Number(e.key) - 1;
        if (NASA_DATASETS[idx]) handleSelectDataset(NASA_DATASETS[idx]);
      } else if (e.key === "0") {
        handleSelectDataset(NASA_DATASETS[9]);
      } else if (e.key.toLowerCase() === "n") {
        speakTelemetry(activeDataset, latestMetrics);
      } else if (e.key.toLowerCase() === "s") {
        setScanMode((prev) => {
          const next =
            SCAN_ORDER[(SCAN_ORDER.indexOf(prev) + 1) % SCAN_ORDER.length];
          showNotice(`SCAN MODE // ${next.toUpperCase()}`);
          return next;
        });
      } else if (e.key.toLowerCase() === "m") {
        setScale((prev) => {
          const next =
            SCALE_ORDER[(SCALE_ORDER.indexOf(prev) + 1) % SCALE_ORDER.length];
          showNotice(`QUANTIZER // ${next.toUpperCase()}`);
          return next;
        });
      } else if (e.key.toLowerCase() === "h") {
        setHighContrast((prev) => !prev);
      } else if (e.key.toLowerCase() === "r") {
        handleToggleRecord();
      } else if (e.key === "Escape") {
        stopSpeaking();
        setShowShortcuts(false);
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [
    activeDataset,
    activeTab,
    handleSelectDataset,
    handleTogglePlay,
    handleToggleRecord,
    latestMetrics,
    showNotice,
  ]);

  return (
    <div
      className={
        highContrast
          ? "high-contrast min-h-screen bg-[var(--chassis-well)] text-[var(--text-ivory)]"
          : "min-h-screen bg-[var(--chassis-well)] text-[var(--text-ivory)]"
      }
    >
      <a
        href="#main-workspace"
        className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:border focus:border-[var(--sig-amber)] focus:bg-[var(--display-well)] focus:px-4 focus:py-2 focus:font-mono focus:text-xs focus:font-bold focus:text-[var(--sig-amber)]"
      >
        SKIP TO WORKSTATION CONSOLE
      </a>

      {/* Top Engraved Hardware Header */}
      <header className="sticky top-0 z-30 border-b border-[var(--hairline)] bg-[var(--rack-panel)]">
        <div className="mx-auto flex max-w-[1580px] flex-wrap items-center justify-between gap-3 px-4 py-2.5">
          {/* Instrument Nameplate */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 border border-[var(--hairline-strong)] bg-[var(--display-well)] px-2.5 py-1">
              <span
                aria-hidden="true"
                className={`h-2 w-2 rounded-[1px] ${
                  isPlaying
                    ? "bg-[var(--sig-emerald)]"
                    : isRecording
                      ? "bg-[var(--sig-vermilion)]"
                      : "bg-[var(--sig-amber)]"
                }`}
              />
              <span className="font-mono text-[11px] font-bold tracking-[0.16em] text-[var(--text-ivory)]">
                TS-2026
              </span>
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="font-display text-sm font-bold tracking-[0.08em] text-[var(--text-ivory)] sm:text-base">
                  TERRA-SONIC // EIC-DSP WORKSTATION
                </h1>
                <span className="hidden border-l border-[var(--hairline-strong)] pl-2.5 font-mono text-[10px] uppercase tracking-[0.14em] text-[var(--sig-emerald)] sm:inline">
                  {isPlaying ? "SIGNAL LOCK" : "STANDBY"}
                </span>
              </div>
              <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-[var(--text-steel)]">
                NASA SVS Optical-to-Audio Extraction Console
              </p>
            </div>
          </div>

          {/* Hardware Console Bank Switcher */}
          <nav
            aria-label="Workstation Console Modes"
            className="flex flex-wrap items-center border border-[var(--hairline)] bg-[var(--display-well)]"
          >
            <ConsoleTab
              index="01"
              label="OPTICAL CONSOLE"
              active={activeTab === "jukebox"}
              onClick={() => handleTabSwitch("jukebox")}
            />
            <ConsoleTab
              index="02"
              label="BLV TACTILE 8×6"
              active={activeTab === "tactile"}
              onClick={() => handleTabSwitch("tactile")}
            />
            <ConsoleTab
              index="03"
              label="CUSTOM INGEST"
              active={activeTab === "custom"}
              onClick={() => handleTabSwitch("custom")}
            />
          </nav>

          {/* Hardware Utility Micro-Switches */}
          <div className="flex items-center gap-1.5 font-mono text-[11px]">
            <button
              type="button"
              onClick={() => setHighContrast((v) => !v)}
              aria-pressed={highContrast}
              aria-label="Toggle High-Contrast Accessibility Mode (Hotkey H)"
              className={`rounded-[2px] border px-2.5 py-1.5 uppercase tracking-[0.1em] transition-colors ${
                highContrast
                  ? "border-[var(--sig-amber)] bg-[var(--sig-amber)] font-bold text-[#07080B]"
                  : "border-[var(--hairline-strong)] bg-[var(--switch-cap)] text-[var(--text-steel)] hover:border-[var(--text-ivory)] hover:text-[var(--text-ivory)]"
              }`}
            >
              [H] CONTRAST
            </button>

            <button
              type="button"
              onClick={stopSpeaking}
              aria-label="Silence Web Speech Narration (Esc)"
              className="rounded-[2px] border border-[var(--hairline-strong)] bg-[var(--switch-cap)] px-2.5 py-1.5 uppercase tracking-[0.1em] text-[var(--text-steel)] transition-colors hover:border-[var(--sig-vermilion)] hover:text-[var(--text-ivory)]"
            >
              [ESC] MUTE TTS
            </button>

            <button
              type="button"
              onClick={() => setShowShortcuts(true)}
              aria-label="Open keyboard shortcut matrix"
              className="rounded-[2px] border border-[var(--hairline-strong)] bg-[var(--switch-cap)] px-2.5 py-1.5 uppercase tracking-[0.1em] text-[var(--text-steel)] transition-colors hover:border-[var(--text-ivory)] hover:text-[var(--text-ivory)]"
            >
              KEYMAP
            </button>
          </div>
        </div>
      </header>

      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-4 right-4 z-40 border border-[var(--sig-amber)] bg-[var(--display-well)] px-3.5 py-2 font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--sig-amber)]"
        >
          // {toastMessage}
        </div>
      )}

      {/* Main Unified Console Chassis */}
      <main id="main-workspace" className="mx-auto max-w-[1580px]">
        {activeTab === "jukebox" && (
          <JukeboxStudio
            activeDataset={activeDataset}
            onSelectDataset={handleSelectDataset}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            scale={scale}
            onChangeScale={setScale}
            scanMode={scanMode}
            onChangeScanMode={setScanMode}
            stems={stems}
            onUpdateStems={setStems}
            masterVolume={masterVolume}
            onChangeMasterVolume={setMasterVolume}
            isRecording={isRecording}
            onToggleRecord={handleToggleRecord}
            onNarrateTelemetry={(m) => speakTelemetry(activeDataset, m)}
            soundEngine={soundEngine}
            latestMetrics={latestMetrics}
            onMetricsUpdate={setLatestMetrics}
          />
        )}

        {activeTab === "tactile" && (
          <TactileExplorer
            activeDataset={activeDataset}
            scale={scale}
            soundEngine={soundEngine}
          />
        )}

        {activeTab === "custom" && (
          <CustomFrameLab
            scale={scale}
            scanMode={scanMode}
            soundEngine={soundEngine}
          />
        )}
      </main>

      {/* Engraved Chassis Footer with SI Disclosure */}
      <footer className="border-t border-[var(--hairline)] bg-[var(--rack-panel)] py-3 font-mono text-[11px] text-[var(--text-steel)]">
        <div className="mx-auto flex max-w-[1580px] flex-col gap-1.5 px-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <span className="font-bold text-[var(--text-ivory)]">
              {TEAMX_INFO.projectName}
            </span>{" "}
            // TEAMX // IMAGERY: NASA SCIENTIFIC VISUALIZATION STUDIO (SVS)
          </div>
          <div className="text-[10px] uppercase tracking-[0.08em] text-[var(--text-engraved)]">
            SI DISCLOSURE: AI-ASSISTED DSP & SOFTWARE ENGINEERING · ZERO NASA LOGOS REPRODUCED
          </div>
        </div>
      </footer>

      {showShortcuts && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Workstation Keyboard Shortcuts Reference"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
        >
          <div className="instrument-rack w-full max-w-md border border-[var(--hairline-strong)] p-4">
            <div className="mb-3 flex items-center justify-between border-b border-[var(--hairline)] pb-2">
              <h2 className="font-mono text-xs font-bold uppercase tracking-[0.14em] text-[var(--sig-amber)]">
                HARDWARE KEYMAP REFERENCE
              </h2>
              <button
                type="button"
                onClick={() => setShowShortcuts(false)}
                aria-label="Close keyboard shortcuts modal"
                className="rounded-[2px] border border-[var(--hairline-strong)] bg-[var(--switch-cap)] px-2 py-0.5 font-mono text-[11px] text-[var(--text-ivory)] hover:border-[var(--sig-amber)]"
              >
                ESC / CLOSE
              </button>
            </div>
            <ul className="space-y-2 font-mono text-xs text-[var(--text-ivory)]">
              <ShortcutRow action="Engage / Hold Sonification" keys="SPACE" />
              <ShortcutRow action="Select NASA SVS Track 1–9" keys="1 – 9" />
              <ShortcutRow action="Load Caldwell 73 Reference" keys="0" />
              <ShortcutRow action="Speak Live Optical Telemetry" keys="N" />
              <ShortcutRow action="Cycle Optical Scan Mode" keys="S" />
              <ShortcutRow action="Cycle Harmonic Scale Quantizer" keys="M" />
              <ShortcutRow action="Record & Export .WAV + .JSON" keys="R" />
              <ShortcutRow action="Toggle High-Contrast Mode" keys="H" />
              <ShortcutRow action="Navigate Tactile 8×6 Matrix" keys="ARROWS" />
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}

function ConsoleTab({
  index,
  label,
  active,
  onClick,
}: {
  index: string;
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? "page" : undefined}
      className={`border-r border-[var(--hairline)] px-3 py-1.5 font-mono text-[11px] uppercase tracking-[0.1em] transition-colors last:border-r-0 ${
        active
          ? "border-b-2 border-b-[var(--sig-amber)] bg-[var(--switch-cap)] font-bold text-[var(--text-ivory)]"
          : "text-[var(--text-steel)] hover:bg-[#14171f] hover:text-[var(--text-ivory)]"
      }`}
    >
      <span className={active ? "text-[var(--sig-amber)]" : "text-[var(--text-engraved)]"}>
        [{index}]
      </span>{" "}
      {label}
    </button>
  );
}

function ShortcutRow({ action, keys }: { action: string; keys: string }) {
  return (
    <li className="flex items-center justify-between border-b border-[var(--hairline)] pb-1.5 last:border-b-0 last:pb-0">
      <span className="text-[var(--text-steel)]">{action}</span>
      <kbd className="rounded-[2px] border border-[var(--hairline-strong)] bg-[var(--display-well)] px-2 py-0.5 text-[11px] font-bold text-[var(--sig-amber)]">
        {keys}
      </kbd>
    </li>
  );
}
