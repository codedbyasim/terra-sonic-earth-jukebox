# TERRA-SONIC: The NASA Earth Information Jukebox

**2026 NASA Space Apps Challenge — The Earth Information Jukebox**

---

## Overview
**TERRA-SONIC** is an interactive scientific acoustic workstation translating authentic NASA Earth Information Center (EIC) visualizations from the Scientific Visualization Studio (SVS) into **real-time, musically structured, Blind & Low-Vision (BLV) accessible soundscapes**.

## Core Architecture
1. **24 Verified High-Resolution NASA SVS Frames (`public/nasa-frames/`):**
   - Covers all 9 official challenge datasets (`#5313`, `#3912`, `#5669`, `#5533`, `#5425`, `#5196`, `#5011`, `#4960`, `#4950`) plus the Caldwell 73 reference (`#13786`), paired with live server-side SVS page metadata extraction (`/api/svs/[id]`), CORS-safe image proxy (`/api/svs/proxy`), and per-frame projection declarations.
2. **Real-Time Optical Computer Vision (`src/lib/cv-analyzer.ts`):**
   - Extracts optical signal luminance (with automatic background inversion on white-background chemistry strips like SVS #5533), RGB channel balance, signal density, contrast energy, transient peaks, and projection-aware spatial zones (`Equirectangular`, `Orthographic Globe`, `Multi-Strip Sphere`, `Regional Sector`, `Deep-Space Field`).
3. **4-Bus Polyphonic Web Audio Synthesizer (`src/lib/sound-engine.ts`):**
   - Synthesizes **Lead Voice, Harmonic Pad, Kinetic Pulse, and Atmospheric Noise Field** quantized to Pentatonic, Lydian, Dorian, Harmonic Minor, or Chromatic scales, with **3D Stereo Panning**, hardware dB bus mixer, and **`.WAV` + SI-Disclosure `.JSON` export**.
4. **3 Integrated Workstation Console Modes:**
   - **01 // Optical Console** (`src/components/JukeboxStudio.tsx`): Category filtering, `AUTO-SEQ` multi-frame progression, variable sweep speed, recessed optical viewport, graticule FFT/oscilloscope, 16-segment LED telemetry meters, and 4-bus mixer.
   - **02 // BLV Tactile 8×6 Matrix** (`src/components/TactileExplorer.tsx`): WAI-ARIA `grid`/`row`/`gridcell` matrix with roving `tabIndex` keyboard arrow navigation, 3D stereo audio probes, and non-spammy Web Speech API coordinate narration.
   - **03 // Custom Ingest** (`src/components/CustomFrameLab.tsx`): Upload local NASA imagery, fetch live `https://svs.gsfc.nasa.gov/vis/...` URLs via proxy, or probe all 24 archive frames.

## Hackathon Deliverables (Outside App UI)
- [7-Slide Pitch Deck](./docs/PITCH_DECK_7_SLIDES.md)
- [Hackathon Submission Package](./docs/SUBMISSION_PACKAGE.md)
- [6-Phase SDLC Documentation](./docs/SDLC_DOCUMENTATION.md)

## Running Locally
```bash
npm install
npm run typecheck
npm run build
npm run dev
```
Open `http://localhost:3000`.
