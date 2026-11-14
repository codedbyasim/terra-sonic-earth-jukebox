---
name: blv-accessibility-sonifier
description: Standard for Blind & Low-Vision (BLV) tactile coordinate sonification, Web Speech API data narration, keyboard-first navigation, and high-contrast Earth data exploration.
---

# Blind & Low-Vision (BLV) Accessibility Sonifier Skill

## Core Principles
1. **Spatial Audio Coordinates**:
   - Horizontal X axis (`West -> East`) maps linearly to `StereoPannerNode.pan` (`-1.0` Left Ear to `+1.0` Right Ear).
   - Vertical Y axis (`South -> North`) and local data intensity map to musical pitch register.
2. **8x6 Tactile Exploration Grid (`TactileExplorer`)**:
   - Users move across 48 geographic sectors using `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`, `Tab`, or mouse/touch hover.
   - Moving into any cell immediately triggers `triggerTactileProbe()` and optionally speaks concise climate telemetry via `window.speechSynthesis`.
3. **Global Keyboard Map**:
   - `Space`: Play / Pause Jukebox
   - `1`–`9`: Load NASA EIC Track 1–9 (`0` for Caldwell 73 Reference)
   - `N`: Narrate live CV telemetry & scientific story
   - `S`: Cycle Computer Vision Scan Mode
   - `M`: Cycle Musical Scale
   - `H`: Toggle WCAG AAA High-Contrast Mode
   - `R`: Start / Stop & Export `.WAV` Recording
4. **Screen-Reader Compliance**:
   - Every telemetry readout resides inside an `aria-live="polite"` region without spammy frame-by-frame interruptions.
