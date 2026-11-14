---
name: scientific-instrument-ui
description: Anti-AI-Slop Bespoke Scientific Acoustic Workstation & Telemetry Instrument Design System for TERRA-SONIC, inspired by NASA JPL Mission Control, Teenage Engineering hardware synthesizers, and Dieter Rams industrial design.
---

# Scientific Instrument UI Design System (`TERRA-SONIC // EIC-DSP`)

This skill eliminates generic "AI-generated dark dashboard" clichés and enforces an authentic, tactile **Earth Science Telemetry Console & Hardware Acoustic Workstation** design language.

## 1. Strict Anti-AI-Slop Prohibitions

When writing or editing UI components in `src/`:
- **NO bubbly rounded cards**: Never use `rounded-2xl`, `rounded-3xl`, or floating translucent glassmorphic cards (`backdrop-blur-md bg-slate-900/60`).
- **NO neon glow box-shadows or gradient text**: Never use `shadow-[0_0_15px_rgba(...)]`, `bg-gradient-to-r ... bg-clip-text text-transparent`, or decorative neon borders.
- **NO generic AI pill badges**: Never write decorative pill badges like `1 · SELECT NASA EIC STREAM`, pulsing dots for fake status, or place a cute rounded icon box before every heading.
- **NO SaaS marketing hero clutter**: Do not waste viewport height on decorative marketing cards; use the space as a working laboratory rack.

## 2. Structural & Surface Architecture (Hardware Chassis)

- **Exposed Structural Hairline Grid**: Use crisp `1px solid #222631` hairline dividers separating edge-to-edge modular bays inside a unified console frame (`border border-[#222631]`).
- **Surface Hierarchy**:
  - Chassis Well (Viewport background): `#07080B`
  - Primary Instrument Rack Panel: `#0F1116`
  - Elevated Switch Cap / Interactive Surface: `#171A22`
  - Recessed Display Well (Canvas, Scope, LED screen): `#040507`
  - High-Contrast Mode Overrides (`data-contrast="high"`): Pure `#000000` background, `#0A0A0A` panels, `2px solid #FFD60A` / `#FFFFFF` borders.
- **Geometry & Corner Radius**: Strict hardware tolerances — `rounded-none` (`0px`) on structural rack compartments and `rounded-[2px]` on tactile switches and meter housings. Use subtle corner tick crosshairs (`+` / L-brackets) on the primary optical viewport.

## 3. Calibrated Signal & Instrument Color Palette

Use color strictly as **functional telemetry**, never as decoration:
- **Warm Ivory (`#ECEBE6`)**: Primary labels, instrument readouts, active switch text.
- **Cool Steel (`#8E939E`)**: Secondary descriptions, axis ticks.
- **Engraved Graphite (`#585E6B`)**: Panel engravings (`MOD-01 // SVS BANK`, `CH-01`, `GAIN dB`).
- **Phosphor Amber (`#E5A93C`)**: Primary active reticle, selected tape/dataset bay, scanline cursor, and hardware `ENGAGE` switch.
- **Telemetry Emerald (`#2EB872`)**: Verified data lock (`NASA SVS LOCAL CACHE // READY`), `SOLO` active state, safe nominal signal.
- **Spectral Ice (`#689DF6`)**: Harmonic/frequency readout, Pad channel indicator, spatial coordinate readouts.
- **Signal Vermilion (`#E05A47`)**: Peak clipping (> -1 dB), `MUTE` active state, aerosol/thermal extreme alert.

## 4. Typography & Readouts

- Display / Panel Labels: Uppercase geometric sans (`Inter` / `Space Grotesk`) with `tracking-[0.14em]` and compact `10px–11px` sizing.
- Telemetry & Measurements: Strict `JetBrains Mono` with `tabular-nums` so numbers never jitter at 10 Hz update rates. Include explicit units (`Hz`, `dB`, `LUX`, `BPM`, `µg/m³`, `m`).

## 5. Tactile Hardware Controls

- **Segmented LED Bar Meters**: Display signal amplitude across discrete rectangular LED blocks (`8–12` segments, transitioning Emerald -> Amber -> Vermilion) rather than blurry CSS gradients.
- **Hardware Mixer Strips**: Label channels `CH-01 // SUB DRONE`, `CH-02 // THERMAL PAD`, `CH-03 // SPECTRAL LEAD`, `CH-04 // KINETIC PULSE`, with explicit `[M]` Mute and `[S]` Solo square micro-switches, rotary/slider fader tracks with dB tick marks, and numeric percentage/dB readouts.
- **Transport Deck**: Styled after reel-to-reel / broadcast transport controls (`[▶ SCAN]`, `[⏸ HOLD]`, `[↻ AUTO-SEQ]`, `[● REC WAV]`, `[⤓ EXPORT JSON]`).
