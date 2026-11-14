---
name: cv-sonification-engine
description: Mathematical specification for real-time Computer Vision pixel extraction from HTML5 Canvas frames and mapping to 4-stem Web Audio API musical synthesis and WAV recording.
---

# Computer Vision & Sonification Engine Skill

## 1. Computer Vision Frame Extraction (`src/lib/cv-analyzer.ts`)
Extract pixel regions from `CanvasRenderingContext2D.getImageData()` based on `scanMode` (`horizontal`, `vertical`, `radar`, `probe`):
- **Luminance**: `L = (0.299 * R + 0.587 * G + 0.114 * B) / 255` (`0..1`)
- **RGB Channel Means**: `redMean`, `greenMean`, `blueMean` (`0..1`)
- **Pixel Density**: Fraction of sampled pixels exceeding intensity threshold (`L > 0.22`)
- **Contrast Energy**: Standard deviation of pixel luminance across the active scan band
- **Transient Spike**: Detection of intense luminous bursts (`L > 0.88` peaks)
- **Spatial Pan**: Horizontal centroid or scan X normalized to `[-1, 1]`
- **Spatial Elevation**: Vertical centroid or scan Y normalized to `[0, 1]`
- **Dominant Hue**: HSL hue (`0..360`) computed from mean RGB
- **Column Profile**: 32-bin energy array for reactive equalizer bars

## 2. Web Audio API 4-Stem Synthesis (`src/lib/sound-engine.ts`)
Map `CVFrameMetrics` into a musical, non-fatiguing soundscape:
- **Musical Scales**: Quantize frequencies to `pentatonic`, `lydian`, `dorian`, `harmonicMinor`, or `scientificChromatic`.
- **4 Independent Stems**:
  1. `melody`: Scanline lead voice (sine/triangle oscillator), frequency quantized by luminance + spatial elevation, panned in 3D via `StereoPannerNode`.
  2. `harmony`: 3-oscillator chord pad whose low-pass filter cutoff tracks thermal warmth (`redMean - blueMean`).
  3. `rhythm`: Density-triggered rhythmic pulse modulated by `pixelDensity` and `contrastEnergy`.
  4. `texture`: Transient bell/spark chimes when `transientSpike` triggers, layered over gently filtered atmospheric noise.
- **WAV + SI Metadata Export**: Capture live audio stream via `MediaStreamAudioDestinationNode` / Web Audio PCM buffer recorder and download `.wav` alongside a companion `.json` attribution manifest.
