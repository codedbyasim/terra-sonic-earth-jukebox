# NASA Space Apps Challenge Submission Package — TeamX

## 1. Project Name
**TERRA-SONIC: The NASA Earth Information Jukebox**

## 2. High-Level Summary (158 Words)
TERRA-SONIC: The NASA Earth Information Jukebox, developed by TeamX, transforms NASA Earth Information Center (EIC) visualizations into real-time, musically structured soundscapes so everyone—especially Blind and Low-Vision (BLV) audiences—can experience planetary change through sound. Using browser-based Computer Vision pixel analysis across 24 authentic NASA SVS imagery frames, TERRA-SONIC extracts luminance, optical absorption, RGB species distributions, pixel density, contrast energy, projection-aware coordinates, and transient bursts across all 9 official NASA EIC datasets plus the Caldwell 73 reference. These visual metrics drive a 4-bus Web Audio API polyphonic synthesizer quantized to harmonic scales. Accessibility sits at the core: an interactive WAI-ARIA 8×6 BLV Tactile Explorer provides 3D stereo panning, roving-focus keyboard navigation, Web Speech API climate narration, and High-Contrast mode. Users can sequence multi-frame planetary changes, upload custom NASA imagery, proxy live `svs.gsfc.nasa.gov/vis/` assets, and export `.WAV` audio paired with Super Intelligence disclosure metadata.

## 3. Team Credits
- **Team Name:** TeamX
- **Asim Hanif** — Team Leader & Systems Architect
- **Maira Noor** — Computer Vision & Data Engineer
- **Malaika Altaf** — Sound Design & Accessibility Lead
- **Tayyab Ali** — Frontend Engineering & Storyteller

## 4. 30-Second Video Pitch Script (Strict 30s Limit)
- **[0:00 – 0:02] Intro:** "Hi, I'm Asim Hanif with TeamX — Asim, Maira Noor, Malaika Altaf, and Tayyab Ali!"
- **[0:02 – 0:05] Challenge:** "NASA's Earth visuals are breathtaking, yet blind and low-vision users cannot experience sight-only climate data."
- **[0:05 – 0:10] Title & Tagline:** "Meet TERRA-SONIC: The Earth Information Jukebox — turning NASA Earth frames into real-time music!"
- **[0:10 – 0:20] How It Works:** "Our Computer Vision scanner analyzes 9 official NASA SVS datasets—from Night Lights and GEOS Aerosols to CO₂ and ISS Lightning—driving a 4-bus Web Audio synthesizer, tactile 8×6 matrix, and voice narrator."
- **[0:20 – 0:30] Future Impact:** "Upload any Earth frame, export WAV soundscapes, and empower classrooms and blind learners worldwide to truly hear our changing planet!"

## 5. Official NASA Data Links (All 11 Required Entries)
1. **Earth Information Center (EIC) Content Database:** `https://svs.gsfc.nasa.gov/gallery/earth-information-center/`
2. **Data Sonification: Caldwell 73:** `https://svs.gsfc.nasa.gov/13786/`
3. **Change in Night Lights between 2012 and 2023 - EIC Version:** `https://svs.gsfc.nasa.gov/5313/`
4. **Global Sea Surface Currents and Temperature:** `https://svs.gsfc.nasa.gov/3912/#media_group_349716`
5. **GEOS Aerosols:** `https://svs.gsfc.nasa.gov/5669/`
6. **Air Quality Model Runs:** `https://svs.gsfc.nasa.gov/5533/`
7. **Perpetual Ocean 2: Western Boundary Currents:** `https://svs.gsfc.nasa.gov/5425/`
8. **DYAMOND Global Carbon Dioxide:** `https://svs.gsfc.nasa.gov/5196/`
9. **Lightning Events Detected from the ISS 2017-2023:** `https://svs.gsfc.nasa.gov/5011/`
10. **A 3D View of an Atmospheric River from an Earth System Model:** `https://svs.gsfc.nasa.gov/4960/`
11. **GEDI Forest Height:** `https://svs.gsfc.nasa.gov/4950/`

## 6. Use of Super Intelligence (SI) Disclosure
Super Intelligence (SI) tools were utilized responsibly to assist with software architecture, TypeScript/Web Audio API implementation, scientific instrument UI standards, and documentation structuring. All NASA SVS visualizations, scientific descriptions, and procedural sonification algorithms are verified and explicitly attributed without NASA logo reproduction. Exported `.json` audio metadata explicitly documents SI assistance.

## 7. Partner & Open-Source Acknowledgments
- **NASA Scientific Visualization Studio (SVS) & Earth Information Center (EIC):** Primary Earth science and astrophysical visualization data.
- **2026 NASA Space Apps Challenge Organizing Partners:** Funded by NASA's Science Mission Directorate through Booz Allen Hamilton, Mindgrub, and SecondMuse.
- **Open-Source Software Stack:** Next.js, React, TypeScript, Tailwind CSS, W3C Web Audio API, HTML5 Canvas 2D API, and Web Speech API.
