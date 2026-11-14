"use client";

import React, { useEffect, useRef, useState } from "react";
import SegmentedLedMeter from "@/components/SegmentedLedMeter";
import {
  describeGeoSector,
  speakTactileSector,
  stopSpeaking,
} from "@/lib/accessibility-narrator";
import { extractTactileMatrix } from "@/lib/cv-analyzer";
import { loadImageAsset, renderImageToCanvas } from "@/lib/frame-renderer";
import type { EarthSoundEngine } from "@/lib/sound-engine";
import type { NASADataset, ScaleType } from "@/lib/types";

interface TactileExplorerProps {
  activeDataset: NASADataset;
  scale: ScaleType;
  soundEngine: EarthSoundEngine | null;
}

const COLS = 8;
const ROWS = 6;

export default function TactileExplorer({
  activeDataset,
  scale,
  soundEngine,
}: TactileExplorerProps) {
  const bgCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const cellRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const [frameIdx, setFrameIdx] = useState<number>(0);
  const [sectorGrid, setSectorGrid] = useState<number[][]>(() =>
    Array.from({ length: ROWS }, () => Array(COLS).fill(0))
  );
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number }>({
    row: 2,
    col: 3,
  });
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [lastAnnouncement, setLastAnnouncement] = useState<string>(
    "WAI-ARIA 8x6 MATRIX READY // USE ARROW KEYS OR CLICK ANY CELL FOR SPOKEN COORDINATE TELEMETRY."
  );

  useEffect(() => {
    setFrameIdx(0);
  }, [activeDataset.id]);

  const activeFrame = activeDataset.frames[frameIdx] ?? activeDataset.frames[0];

  // Sample real NASA pixels onto the canvas & extract projection-calibrated matrix
  useEffect(() => {
    let active = true;
    const src = activeFrame?.localSrc;
    if (!src) return;

    loadImageAsset(src)
      .then((img) => {
        if (!active) return;
        const canvas = bgCanvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (!ctx) return;

        renderImageToCanvas(ctx, canvas.width, canvas.height, img, 0, false);
        const matrix = extractTactileMatrix(
          ctx,
          canvas.width,
          canvas.height,
          COLS,
          ROWS,
          Boolean(activeFrame.invertLuminance)
        );
        setSectorGrid(matrix);
      })
      .catch(() => undefined);

    return () => {
      active = false;
    };
  }, [activeFrame]);

  const updateSectorReadout = (
    row: number,
    col: number,
    shouldSpeak: boolean,
    gainScale: number
  ) => {
    setSelectedCell({ row, col });
    const intensity = sectorGrid[row]?.[col] ?? 0.2;
    const nx = col / (COLS - 1);
    const ny = row / (ROWS - 1);

    const noteName = soundEngine
      ? soundEngine.triggerTactileProbe(nx, ny, intensity, scale, gainScale)
      : "C4";

    const info = describeGeoSector(
      nx,
      ny,
      activeFrame.projection,
      intensity
    );
    const pct = Math.round(intensity * 100);
    setLastAnnouncement(
      `${info.projectionTag} // ${info.regionHint} (${info.latitudeLabel}, ${info.longitudeLabel}) // ${activeDataset.shortTitle}: ${pct}% SIGNAL // PITCH ${noteName}`
    );

    if (shouldSpeak && autoSpeak) {
      speakTactileSector(
        col,
        row,
        COLS,
        ROWS,
        intensity,
        noteName,
        activeDataset,
        activeFrame.projection
      );
    }
  };

  // Hover only triggers subtle audio grain without speech spam
  const handleHoverSector = (row: number, col: number) => {
    updateSectorReadout(row, col, false, 0.45);
  };

  // Click or keyboard action triggers full audio probe + spoken telemetry
  const handleActivateSector = (row: number, col: number) => {
    updateSectorReadout(row, col, true, 1.0);
  };

  const handleGridKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    let { row, col } = selectedCell;
    if (e.key === "ArrowRight") col = Math.min(COLS - 1, col + 1);
    else if (e.key === "ArrowLeft") col = Math.max(0, col - 1);
    else if (e.key === "ArrowDown") row = Math.min(ROWS - 1, row + 1);
    else if (e.key === "ArrowUp") row = Math.max(0, row - 1);
    else if (e.key === "Home") col = 0;
    else if (e.key === "End") col = COLS - 1;
    else return;

    e.preventDefault();
    const targetBtn = cellRefs.current[row * COLS + col];
    targetBtn?.focus();
    handleActivateSector(row, col);
  };

  const activeVal = sectorGrid[selectedCell.row]?.[selectedCell.col] ?? 0;
  const activeGeo = describeGeoSector(
    selectedCell.col / (COLS - 1),
    selectedCell.row / (ROWS - 1),
    activeFrame.projection,
    activeVal
  );

  return (
    <section
      aria-label="Blind and Low-Vision Tactile Spatial Matrix"
      className="instrument-rack border-x border-b border-[var(--hairline)]"
    >
      {/* Module Header Strip */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[var(--hairline)] bg-[var(--rack-panel)] p-3.5">
        <div>
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] uppercase tracking-[0.14em]">
            <span className="bg-[var(--sig-emerald)] px-1.5 py-0.5 font-bold text-[#07080B]">
              BLV MATRIX // WAI-ARIA 8×6
            </span>
            <span className="text-[var(--sig-amber)]">
              SVS-{activeDataset.svsId} // {activeGeo.projectionTag}
            </span>
          </div>
          <h2 className="mt-1 font-display text-base font-bold text-[var(--text-ivory)] sm:text-lg">
            Blind &amp; Low-Vision Tactile Sector Explorer — {activeDataset.title}
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {activeDataset.frames.length > 1 && (
            <div className="flex border border-[var(--hairline)] bg-[var(--display-well)]">
              {activeDataset.frames.map((fr, idx) => (
                <button
                  key={fr.id}
                  type="button"
                  onClick={() => setFrameIdx(idx)}
                  className={`border-r border-[var(--hairline)] px-2.5 py-1.5 font-mono text-[10px] uppercase last:border-r-0 ${
                    idx === frameIdx
                      ? "bg-[var(--text-ivory)] font-bold text-[#07080B]"
                      : "text-[var(--text-steel)] hover:text-[var(--text-ivory)]"
                  }`}
                >
                  F{idx + 1}: {fr.label}
                </button>
              ))}
            </div>
          )}

          <button
            type="button"
            onClick={() => {
              if (autoSpeak) stopSpeaking();
              setAutoSpeak((v) => !v);
            }}
            aria-pressed={autoSpeak}
            aria-label="Toggle automatic Web Speech API voice readout on cell selection"
            className={`rounded-[2px] border px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-[0.08em] transition-colors ${
              autoSpeak
                ? "border-[var(--sig-emerald)] bg-[#10261b] text-[var(--sig-emerald)]"
                : "border-[var(--hairline-strong)] bg-[var(--switch-cap)] text-[var(--text-steel)]"
            }`}
          >
            AUTO-TTS: {autoSpeak ? "ON" : "OFF"}
          </button>
        </div>
      </div>

      {/* Main Split Grid & Telemetry Inspector */}
      <div className="grid grid-cols-1 divide-y divide-[var(--hairline)] lg:grid-cols-12 lg:divide-x lg:divide-y-0">
        {/* Left: 8x6 WAI-ARIA Matrix */}
        <div className="bg-[var(--rack-panel)] p-4 lg:col-span-8">
          <div className="instrument-well border border-[var(--hairline-strong)]">
            <div className="flex items-center justify-between border-b border-[var(--hairline)] bg-[#090b0f] px-3 py-1 font-mono text-[10px]">
              <span className="text-[var(--text-steel)]">
                GRID NAVIGATION: TAB INTO MATRIX → ARROWS / ENTER / CLICK
              </span>
              <span className="text-[var(--sig-amber)]">48 SECTORS ACTIVE</span>
            </div>

            <div className="relative bg-[#040507]">
              <canvas
                ref={bgCanvasRef}
                width={720}
                height={405}
                aria-hidden="true"
                className="aspect-video w-full"
              />

              <div
                role="grid"
                aria-label={`8 by 6 tactile data matrix for ${activeDataset.shortTitle}. Use arrow keys to step across spatial sectors and hear telemetry.`}
                onKeyDown={handleGridKeyDown}
                className="absolute inset-0 grid grid-rows-6"
              >
                {sectorGrid.map((rowArr, r) => (
                  <div key={r} role="row" className="grid grid-cols-8">
                    {rowArr.map((val, c) => {
                      const isSelected =
                        selectedCell.row === r && selectedCell.col === c;
                      const geo = describeGeoSector(
                        c / (COLS - 1),
                        r / (ROWS - 1),
                        activeFrame.projection,
                        val
                      );
                      const pct = Math.round(val * 100);
                      return (
                        <button
                          key={`${r}-${c}`}
                          ref={(el) => {
                            cellRefs.current[r * COLS + c] = el;
                          }}
                          type="button"
                          role="gridcell"
                          tabIndex={isSelected ? 0 : -1}
                          aria-selected={isSelected}
                          aria-label={`Row ${r + 1} Col ${c + 1}: ${geo.regionHint}, ${geo.latitudeLabel}, ${geo.longitudeLabel}, ${pct} percent intensity`}
                          onClick={() => handleActivateSector(r, c)}
                          onMouseEnter={() => handleHoverSector(r, c)}
                          className={`flex flex-col items-center justify-center border border-[#222631]/80 font-mono text-[10px] transition-colors ${
                            isSelected
                              ? "border-[var(--sig-amber)] bg-[#e5a93c]/25 font-bold text-[#ffffff] ring-2 ring-inset ring-[var(--sig-amber)]"
                              : "bg-transparent text-white/80 hover:bg-white/10"
                          }`}
                        >
                          <span className="border border-white/15 bg-black/75 px-1 py-0.5 leading-none">
                            {pct}%
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div
            aria-live="polite"
            className="mt-3 border border-[var(--hairline-strong)] bg-[var(--display-well)] px-3 py-2 font-mono text-xs text-[var(--sig-emerald)]"
          >
            // {lastAnnouncement}
          </div>
        </div>

        {/* Right: Sector Coordinate & Acoustic Inspector */}
        <aside className="flex flex-col justify-between gap-4 bg-[var(--rack-panel)] p-4 lg:col-span-4">
          <div className="space-y-4">
            <div className="border-b border-[var(--hairline)] pb-2 font-mono text-[10px] font-bold uppercase tracking-[0.14em] text-[var(--sig-amber)]">
              ACTIVE SECTOR INSPECTOR
            </div>

            <div className="border border-[var(--hairline)] bg-[var(--display-well)] p-3">
              <div className="font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--text-engraved)]">
                PROJECTION: {activeGeo.projectionTag}
              </div>
              <div className="mt-1 font-display text-sm font-bold text-[var(--text-ivory)]">
                {activeGeo.regionHint}
              </div>
              <div className="mt-1 font-mono text-xs text-[var(--sig-ice)]">
                {activeGeo.latitudeLabel} · {activeGeo.longitudeLabel}
              </div>
            </div>

            <SegmentedLedMeter
              label={
                activeFrame.invertLuminance
                  ? "SECTOR ABSORPTION INDEX"
                  : "SECTOR OPTICAL INTENSITY"
              }
              value={activeVal}
            />

            <div className="grid grid-cols-2 divide-x divide-[var(--hairline)] border border-[var(--hairline)] bg-[var(--display-well)] font-mono">
              <div className="p-3">
                <div className="text-[10px] text-[var(--text-engraved)]">
                  MATRIX COORD
                </div>
                <div className="mt-1 text-base font-bold text-[var(--text-ivory)]">
                  R{selectedCell.row + 1} · C{selectedCell.col + 1}
                </div>
              </div>
              <div className="p-3">
                <div className="text-[10px] text-[var(--text-engraved)]">
                  STEREO PAN
                </div>
                <div className="mt-1 text-base font-bold text-[var(--sig-amber)]">
                  {selectedCell.col < 3
                    ? "LEFT EAR"
                    : selectedCell.col > 4
                      ? "RIGHT EAR"
                      : "CENTER"}
                </div>
              </div>
            </div>
          </div>

          <div className="border border-[var(--hairline)] bg-[var(--display-well)] p-3 font-mono text-[11px] leading-relaxed text-[var(--text-steel)]">
            <strong className="text-[var(--text-ivory)]">BLV DESIGN NOTE:</strong>{" "}
            Mouse hover triggers quiet spatial audio grain only (preventing speech overlap). Arrow keys, Enter, or clicks trigger full coordinates narration.
          </div>
        </aside>
      </div>
    </section>
  );
}
