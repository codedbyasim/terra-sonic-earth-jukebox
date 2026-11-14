"use client";

import React from "react";

interface SegmentedLedMeterProps {
  label: string;
  value: number; // 0..1
  unitDisplay?: string;
  segments?: number;
}

/**
 * Discrete segmented hardware LED meter (Emerald -> Phosphor Amber -> Vermilion).
 * Designed for tabular scientific signal telemetry without blurry neon glows.
 */
export default function SegmentedLedMeter({
  label,
  value,
  unitDisplay,
  segments = 16,
}: SegmentedLedMeterProps) {
  const clamped = Math.max(0, Math.min(1, value));
  const litCount = Math.round(clamped * segments);
  const pct = Math.round(clamped * 100);

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between font-mono text-[11px]">
        <span className="uppercase tracking-[0.08em] text-[var(--text-steel)]">
          {label}
        </span>
        <span className="font-semibold text-[var(--text-ivory)]">
          {unitDisplay ?? `${pct}%`}
        </span>
      </div>
      <div
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={pct}
        className="grid gap-[2px] border border-[var(--hairline)] bg-[var(--display-well)] p-[3px]"
        style={{ gridTemplateColumns: `repeat(${segments}, minmax(0, 1fr))` }}
      >
        {Array.from({ length: segments }).map((_, idx) => {
          const active = idx < litCount;
          const ratio = idx / (segments - 1);
          let activeColor = "bg-[var(--sig-emerald)]";
          if (ratio >= 0.8) activeColor = "bg-[var(--sig-vermilion)]";
          else if (ratio >= 0.56) activeColor = "bg-[var(--sig-amber)]";

          return (
            <span
              key={idx}
              className={`h-2.5 rounded-[1px] transition-colors duration-75 ${
                active ? activeColor : "bg-[#161922]"
              }`}
            />
          );
        })}
      </div>
    </div>
  );
}
