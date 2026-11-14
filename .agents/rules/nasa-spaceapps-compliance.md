---
trigger: always_on
---

# NASA Space Apps Challenge Compliance Rule

When editing or creating any code, documentation, UI, or presentation files in this workspace:

1. **No NASA Logos or Insignias**: Do NOT include NASA logos (Meatball, Worm), US flags, or official mission badges in SVGs, Canvas renders, HTML, or slide decks. Always credit NASA SVS via plain text and official URLs (`https://svs.gsfc.nasa.gov/...`).
2. **Super Intelligence (SI) Transparency**: Include clear SI disclosure notices in exported audio metadata JSON files, UI disclosure badges, and submission docs explaining where AI/SI tools assisted development and procedural algorithm design.
3. **BLV Accessibility Standard**:
   - All buttons and sliders require explicit `aria-label` or `aria-labelledby`.
   - Dynamic data telemetry updates use `aria-live="polite"`.
   - Support keyboard navigation (`Space`, `1-9`, `Arrow Keys`, `N`, `S`, `M`, `H`, `R`).
   - Provide Web Speech API (`window.speechSynthesis`) spoken telemetry and tactile coordinate exploration.
4. **Copyright-Free Synthesis**: Generate all soundscapes purely through Web Audio API oscillators, filters, panners, and noise buffers. Never embed external copyrighted audio tracks.
5. **Strict Demo Limits**: Ensure the Pitch Deck stays strictly within **7 slides** (including Title & Intro) and the Video Pitch Teleprompter stays strictly within **30 seconds**.
