# TERRA-SONIC: 7-Slide Hackathon Demo Deck (TeamX)

> Strictly within the **7-slide limit** (including Title & Intro) for the **2026 NASA Space Apps Challenge — The Earth Information Jukebox**.

---

## Slide 1 of 7 · Title & Team
**TERRA-SONIC: The NASA Earth Information Jukebox**  
*Translating NASA Earth Visualizations into Real-Time Accessible Soundscapes*
- **Team Name:** TeamX
- **Asim Hanif** — Team Leader & Systems Architect
- **Maira Noor** — Computer Vision & Data Engineer
- **Malaika Altaf** — Sound Design & Accessibility Lead
- **Tayyab Ali** — Frontend Engineering & Storyteller
- *100% Web-Based · Zero Login · Blind & Low-Vision Ready*

---

## Slide 2 of 7 · Problem & Accessibility Gap
**Making Earth Science Multi-Sensory for Every Citizen**
- NASA's Earth Information Center (EIC) produces extraordinary visual tracking of CO₂, ocean currents, night lights, aerosols, and forest canopy heights.
- Relying exclusively on sight excludes Blind & Low-Vision (BLV) communities and hides multi-dimensional patterns across planetary time series.
- Raw pixel-to-tone noise is harsh and fatiguing—TERRA-SONIC converts real NASA imagery into structured, emotionally expressive, musical soundscapes.

---

## Slide 3 of 7 · Technical Architecture
**Real-Time Computer Vision → 4-Stem Web Audio Pipeline**
1. **Real NASA SVS Media Ingestion:** Curated authentic NASA SVS high-resolution frames + live SVS metadata parser + local/remote NASA media proxy (`/api/svs/proxy`).
2. **Computer Vision Extraction (`getImageData`):** Extracts Luminance, RGB Species Dominance, Pixel Density, Contrast Variance, Spatial Centroids, and Transient Flash Spikes at 60 FPS.
3. **Musical Scale Quantizer & 4-Stem Synth:** Drives Melody, Harmony, Rhythm, and Atmospheric Texture in Pentatonic, Lydian, Dorian, Harmonic Minor, or Scientific Chromatic scales.
4. **Lossless `.WAV` + SI Metadata Export:** Captures live Web Audio PCM buffers alongside Super Intelligence disclosure metadata.

---

## Slide 4 of 7 · NASA Open Data Integration
**All 9 Official NASA EIC Datasets + Caldwell 73 Reference**
- `SVS #5313` Change in Night Lights (2012–2023)
- `SVS #3912` Global Sea Surface Currents and Temperature
- `SVS #5669` GEOS Aerosols (4-Species RGB Instrument Mapping)
- `SVS #5533` Air Quality Model Runs
- `SVS #5425` Perpetual Ocean 2: Western Boundary Currents
- `SVS #5196` DYAMOND Global Carbon Dioxide
- `SVS #5011` Lightning Events Detected from the ISS (2017–2023)
- `SVS #4960` 3D View of an Atmospheric River
- `SVS #4950` GEDI Forest Height
- `SVS #13786` Data Sonification: Caldwell 73 (Calibration Reference)

---

## Slide 5 of 7 · BLV Accessibility Innovation
**Touch, Keyboard & Voice-Guided Earth Exploration**
- **WAI-ARIA 8×6 Tactile Matrix:** Explore 48 spatial sectors over real NASA imagery via roving-focus Arrow Keys or Click/Touch.
- **3D Stereo Panning:** West-to-East azimuth pans Left-to-Right ears; elevation & optical signal shape pitch cleanly.
- **Projection-Aware Web Speech Narrator:** Announces accurate sectors (lat/lon on flat maps, hemisphere disc/space margin on globes, or pollutant strips on SVS #5533) without mouse-hover speech spam.
- **WCAG AAA High-Contrast Mode (`H`)** + Global Keyboard Shortcuts (`Space`, `0–9`, `N`, `S`, `M`, `R`).

---

## Slide 6 of 7 · 6-Phase SDLC Execution
**Engineered by TeamX with Rigorous Software Engineering**
1. **Requirements & Compliance:** BLV accessibility, zero NASA logos, transparent SI disclosure.
2. **Architecture:** Next.js 15 App Router, TypeScript, Canvas 2D CV engine, Web Audio API DSP, CORS-safe NASA SVS proxy.
3. **Implementation:** Scientific acoustic workstation with Optical Console, BLV Tactile 8×6 Matrix, Custom Ingest, and `.WAV` Exporter.
4. **Verification:** `tsc --noEmit`, `next build`, live browser verification across real NASA imagery.
5. **Documentation & Packaging:** Complete SDLC docs, submission copy, and strict 7-slide / 30-second pitch outside the app UI.
6. **Public Deployment:** Accessible on Vercel & GitHub with zero permissions required.

---

## Slide 7 of 7 · Impact & Future Vision
**Democratizing Planetary Storytelling Through Sound**
- Empowers classrooms, planetariums, climate journalists, and Blind & Low-Vision researchers worldwide.
- Extensible Custom Media Studio lets users drop in any new NASA EIC frame or live `svs.gsfc.nasa.gov` URL immediately.
- Future Roadmap: Ambisonic museum sound domes, tactile haptic hardware integration, and direct NASA Worldview orbital telemetry streams.
