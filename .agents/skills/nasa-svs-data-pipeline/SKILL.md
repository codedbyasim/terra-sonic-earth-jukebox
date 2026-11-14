---
name: nasa-svs-data-pipeline
description: Blueprint for integrating NASA Scientific Visualization Studio (SVS) Earth Information Center (EIC) datasets (#5313, #3912, #5669, #5533, #5425, #5196, #5011, #4960, #4950, and reference #13786), parsing live SVS pages, proxying CORS-safe remote imagery, and declaring frame projections for CV analysis.
---

# NASA SVS Data Pipeline Skill

## Official Challenge Datasets
Always include these exact NASA SVS entries with complete `https://` URLs:
1. **Change in Night Lights (2012-2023) - EIC Version** (`SVS #5313`) — `https://svs.gsfc.nasa.gov/5313/`
2. **Global Sea Surface Currents and Temperature** (`SVS #3912`) — `https://svs.gsfc.nasa.gov/3912/#media_group_349716`
3. **GEOS Aerosols** (`SVS #5669`) — `https://svs.gsfc.nasa.gov/5669/`
4. **Air Quality Model Runs** (`SVS #5533`) — `https://svs.gsfc.nasa.gov/5533/`
5. **Perpetual Ocean 2: Western Boundary Currents** (`SVS #5425`) — `https://svs.gsfc.nasa.gov/5425/`
6. **DYAMOND Global Carbon Dioxide** (`SVS #5196`) — `https://svs.gsfc.nasa.gov/5196/`
7. **Lightning Events Detected from the ISS 2017-2023** (`SVS #5011`) — `https://svs.gsfc.nasa.gov/5011/`
8. **A 3D View of an Atmospheric River from an Earth System Model** (`SVS #4960`) — `https://svs.gsfc.nasa.gov/4960/`
9. **GEDI Forest Height** (`SVS #4950`) — `https://svs.gsfc.nasa.gov/4950/`
10. **Data Sonification: Caldwell 73** (`SVS #13786`, Conceptual Reference) — `https://svs.gsfc.nasa.gov/13786/`
11. **Earth Information Center Content Database** — `https://svs.gsfc.nasa.gov/gallery/earth-information-center/`

## Live Sync & CORS-Safe Local Frame Architecture
- Use `src/app/api/svs/[id]/route.ts` to query and parse the canonical HTML record at `https://svs.gsfc.nasa.gov/{id}/` (note: `/api/vis/{id}` returns HTML rather than JSON).
- Use `src/app/api/svs/proxy/route.ts` to stream live `https://svs.gsfc.nasa.gov/vis/...` assets with CORS headers (`Access-Control-Allow-Origin: *`) so browser Canvas `getImageData` never hits security tainting errors.
- Bundle all **24 verified official NASA SVS frames** locally in `public/nasa-frames/` with per-frame `projection` (`equirectangular`, `globe-americas`, `globe-eastern`, `globe-pacific`, `multi-strip-pollutants`, `regional-grid`, `celestial-cluster`) and `invertLuminance` metadata (`SVS #5533` white-background chemistry strips) so optical CV readings and BLV sector descriptions stay scientifically accurate.
