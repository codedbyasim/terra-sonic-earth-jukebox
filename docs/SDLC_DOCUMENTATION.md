# 6-Phase Software Development Life Cycle (SDLC) — TERRA-SONIC

**TeamX:** Asim Hanif (Team Leader & Systems Architect), Maira Noor (Computer Vision & Data Engineer), Malaika Altaf (Sound Design & Accessibility Lead), Tayyab Ali (Frontend Engineering & Storyteller)  
**Challenge:** 2026 NASA Space Apps Challenge — *The Earth Information Jukebox*

---

## Phase 1: Planning & Requirements Analysis
- **Functional Requirements:**
  - Real-time Computer Vision extraction (`getImageData`) across 24 verified high-resolution frames covering all 9 NASA EIC datasets plus the Caldwell 73 reference, plus live NASA SVS URL proxying and local file upload.
  - Real-time procedural 4-stem Web Audio API synthesis (`Lead Voice`, `Harmonic Pad`, `Kinetic Pulse`, `Noise Field`) quantized to musical scales (Pentatonic, Lydian, Dorian, Harmonic Minor, Chromatic).
  - Multi-frame `AUTO-SEQ` time-series progression and projection-aware coordinate interpretation (`equirectangular`, `orthographic globe`, `multi-strip-pollutants`, `regional-grid`, `celestial-cluster`).
  - Blind & Low-Vision (BLV) accessibility: WAI-ARIA `grid`/`row`/`gridcell` matrix with roving `tabIndex`, Web Speech API narration without hover spam, `aria-live="polite"` telemetry, global keyboard shortcuts, and WCAG AAA High-Contrast mode.
  - `.WAV` PCM audio + Super Intelligence disclosure `.JSON` metadata export.
- **Compliance & Judging Requirements:**
  - Keep pitch decks (`docs/PITCH_DECK_7_SLIDES.md`) and submission artifacts (`docs/SUBMISSION_PACKAGE.md`) strictly outside the web app UI.
  - Zero NASA logos/insignias and transparent Super Intelligence (SI) disclosure.

## Phase 2: System Design & Architecture
- **Frontend Framework:** Next.js 15 App Router + React 19 + TypeScript + Tailwind CSS v4.
- **Design System (`.agents/skills/scientific-instrument-ui/SKILL.md`):**
  - Bespoke **JPL Mission Telemetry & Hardware Audio Workstation** aesthetic using matte graphite surfaces (`#07080B` / `#0F1116`), `1px` exposed structural hairlines, tabular monospace readouts, graticule FFT/oscilloscopes, and discrete 16-segment LED meters.
- **Data Layer (`src/lib/nasa-datasets.ts`, `src/app/api/svs/[id]/route.ts`, `src/app/api/svs/proxy/route.ts`):**
  - Bundles 24 genuine NASA SVS assets in `public/nasa-frames/`, parses live NASA metadata pages (`https://svs.gsfc.nasa.gov/{id}/`), and proxies remote `/vis/` imagery cleanly past cross-origin restrictions.
- **Visual & CV Layer (`src/lib/frame-renderer.ts` & `src/lib/cv-analyzer.ts`):**
  - Throttled ~10 Hz telemetry updates (eliminating idle 60 Hz re-render overhead), optical absorption inversion on white-background chemistry charts (`SVS #5533`), canopy elevation calibration (`SVS #4950`), and projection-accurate zone descriptions.
- **DSP Audio Layer (`src/lib/sound-engine.ts`):**
  - Zero-sample pure Web Audio API synthesizer (`AudioContext`, `OscillatorNode`, `BiquadFilterNode`, `StereoPannerNode`, `DynamicsCompressorNode`, `AnalyserNode`, stereo PCM `.WAV` encoder).

## Phase 3: Implementation
- Built modular console workspaces (`JukeboxStudio`, `TactileExplorer`, `CustomFrameLab`, `SegmentedLedMeter`) coordinated through `src/app/page.tsx`.
- Configured Antigravity rules and skills in `.agents/rules/` and `.agents/skills/` covering compliance, CV DSP math, NASA SVS ingestion, BLV accessibility, scientific hardware UI, and Space Apps submission limits.

## Phase 4: Testing & Verification
- Static TypeScript verification (`npm run typecheck` / `npx tsc --noEmit`).
- Production Next.js build verification (`npm run build`).
- Automated live browser UI & interaction verification across all 3 console modes (`Optical Console`, `BLV Tactile 8×6`, `Custom Ingest`), multi-frame sequencing, High-Contrast mode (`H`), and keymap modal.

## Phase 5: Deployment
- Clean production build ready for Vercel deployment and GitHub repository hosting with zero authentication walls.

## Phase 6: Maintenance & Future Roadmap
- Modular `NASA_DATASETS` registry enables instant addition of new EIC visualizations with automatic projection and frame sequencing support.
- Future enhancements include WebGL fluid shaders and multi-channel spatial output for classrooms and planetarium domes.
