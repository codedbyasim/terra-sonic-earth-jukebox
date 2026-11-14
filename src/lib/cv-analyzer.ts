import { describeGeoSector } from "./accessibility-narrator";
import type {
  CVFrameMetrics,
  FrameProjection,
  NASADataset,
  ScaleType,
  ScanMode,
} from "./types";

const SCALE_NOTES: Record<ScaleType, string[]> = {
  pentatonic: ["C", "D", "E", "G", "A"],
  lydian: ["F", "G", "A", "B", "C", "D", "E"],
  dorian: ["D", "E", "F", "G", "A", "B", "C"],
  harmonicMinor: ["A", "B", "C", "D", "E", "F", "G#"],
  scientificChromatic: [
    "C",
    "C#",
    "D",
    "D#",
    "E",
    "F",
    "F#",
    "G",
    "G#",
    "A",
    "A#",
    "B",
  ],
};

function computeHue(r: number, g: number, b: number): number {
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const d = max - min;
  if (d === 0) return 0;
  let h = 0;
  if (max === r) h = ((g - b) / d) % 6;
  else if (max === g) h = (b - r) / d + 2;
  else h = (r - g) / d + 4;
  h = Math.round(h * 60);
  return h < 0 ? h + 360 : h;
}

function formatScientificReading(
  dataset: NASADataset,
  signal: number,
  redMean: number,
  greenMean: number,
  blueMean: number,
  density: number,
  spike: number,
  spatialZoneLabel: string,
  projection: FrameProjection
): string {
  switch (dataset.id) {
    case "night-lights":
      return `Optical Radiance Index: ${(signal * 100).toFixed(1)}% · Peak Density ${Math.round(density * 100)}%`;
    case "sea-currents-temp": {
      const thermalBias = Math.max(0, Math.min(1, redMean - blueMean * 0.55 + 0.32));
      return `Thermal Proxy: ${(-1.8 + thermalBias * 32.5).toFixed(1)} °C · Flow Energy ${Math.round(signal * 100)}%`;
    }
    case "geos-aerosols":
      return `Aerosol Optical Index: ${(0.05 + density * 1.35).toFixed(2)} AOD`;
    case "air-quality":
      if (projection === "multi-strip-pollutants") {
        const speciesTag = spatialZoneLabel.split(" · ")[0];
        return `${speciesTag} · Absorption Index ${Math.round(signal * 100)}%`;
      }
      return `Tropospheric Plume Index: ${Math.round(15 + density * 185)} µg/m³`;
    case "perpetual-ocean":
      return `Boundary Current Energy: ${(0.18 + signal * 2.1).toFixed(2)} m/s`;
    case "dyamond-co2": {
      const plumeStrength = Math.max(0, Math.min(1, redMean * 1.15 - blueMean * 0.25));
      return `CO₂ Optical Plume: ${Math.round(402 + plumeStrength * 46)} ppm`;
    }
    case "iss-lightning":
      return `Flash Optical Peaks: ${Math.round(spike * 48)} events/sweep`;
    case "atmospheric-river":
      return `Vapor Plume Optical Index: ${Math.round(180 + (blueMean * 0.5 + density * 0.5) * 780)} kg/m/s`;
    case "gedi-forest": {
      // Dark olive (0m) -> bright forest green / ivory canopy (50m); distinguish vegetation green from ocean blue
      const isVegetated = greenMean > blueMean * 0.92;
      const canopyIndex = isVegetated ? Math.min(1, greenMean * 1.25 + redMean * 0.25) : 0.04;
      return `Canopy Elevation Proxy: ${(canopyIndex * 50).toFixed(1)} m`;
    }
    case "caldwell-73":
    default:
      return `Optical Luminosity: ${(signal * 100).toFixed(1)}%`;
  }
}

export interface CVAnalysisOptions {
  projection?: FrameProjection;
  invertLuminance?: boolean;
}

export function analyzeCanvasFrame(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  scanPosition: number,
  scanMode: ScanMode,
  probePoint: { x: number; y: number },
  dataset: NASADataset,
  scale: ScaleType,
  options: CVAnalysisOptions = {}
): CVFrameMetrics {
  const projection = options.projection ?? dataset.frames[0]?.projection ?? "equirectangular";
  const invertLuminance = Boolean(options.invertLuminance);

  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  let startX = 0;
  let endX = width;
  let startY = 0;
  let endY = height;

  if (scanMode === "horizontal") {
    const cx = Math.floor(scanPosition * width);
    startX = Math.max(0, cx - 10);
    endX = Math.min(width, cx + 10);
  } else if (scanMode === "vertical") {
    const cy = Math.floor(scanPosition * height);
    startY = Math.max(0, cy - 10);
    endY = Math.min(height, cy + 10);
  } else if (scanMode === "probe") {
    const px = Math.floor(probePoint.x * width);
    const py = Math.floor(probePoint.y * height);
    startX = Math.max(0, px - 22);
    endX = Math.min(width, px + 22);
    startY = Math.max(0, py - 22);
    endY = Math.min(height, py + 22);
  }

  let rSum = 0;
  let gSum = 0;
  let bSum = 0;
  let sigSum = 0;
  let sigSqSum = 0;
  let activeCount = 0;
  let spikeCount = 0;
  let weightedX = 0;
  let weightedY = 0;
  let totalWeight = 0;
  let count = 0;

  const step = 3;
  for (let y = startY; y < endY; y += step) {
    for (let x = startX; x < endX; x += step) {
      if (scanMode === "radar") {
        const dx = x - width * 0.5;
        const dy = y - height * 0.5;
        const angle = (Math.atan2(dy, dx) + Math.PI * 2) % (Math.PI * 2);
        const target = scanPosition * Math.PI * 2;
        const diff = Math.abs(angle - target);
        if (diff > 0.35 && Math.abs(diff - Math.PI * 2) > 0.35) continue;
      }

      const idx = (y * width + x) * 4;
      const r = data[idx] / 255;
      const g = data[idx + 1] / 255;
      const b = data[idx + 2] / 255;
      const rawLum = 0.299 * r + 0.587 * g + 0.114 * b;

      // On white-background scientific strips (e.g., SVS #5533), dark saturated ink represents higher concentration,
      // while pure white (r>0.94, g>0.94, b>0.94) is background canvas margin.
      let signal = rawLum;
      if (invertLuminance) {
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        const isWhiteMargin = rawLum > 0.94 && chroma < 0.06;
        signal = isWhiteMargin ? 0 : Math.max(0, Math.min(1, (1 - rawLum) * 0.65 + chroma * 0.6));
      }

      rSum += r;
      gSum += g;
      bSum += b;
      sigSum += signal;
      sigSqSum += signal * signal;
      if (signal > 0.2) activeCount++;
      if (signal > 0.78) spikeCount++;

      weightedX += (x / width) * signal;
      weightedY += (1 - y / height) * signal;
      totalWeight += signal;
      count++;
    }
  }

  const safeCount = Math.max(1, count);
  const redMean = rSum / safeCount;
  const greenMean = gSum / safeCount;
  const blueMean = bSum / safeCount;
  const luminance = sigSum / safeCount;
  const variance = Math.max(0, sigSqSum / safeCount - luminance * luminance);
  const contrastEnergy = Math.min(1, Math.sqrt(variance) * 2.4);
  const pixelDensity = activeCount / safeCount;
  const transientSpike = Math.min(1, (spikeCount / safeCount) * 8);

  const normScanX =
    scanMode === "horizontal"
      ? scanPosition
      : scanMode === "probe"
        ? probePoint.x
        : totalWeight > 0.01
          ? weightedX / totalWeight
          : 0.5;

  const normScanY =
    scanMode === "vertical"
      ? scanPosition
      : scanMode === "probe"
        ? probePoint.y
        : totalWeight > 0.01
          ? 1 - weightedY / totalWeight
          : 0.5;

  const spatialPan = Math.max(-1, Math.min(1, normScanX * 2 - 1));
  const spatialElevation = Math.max(0, Math.min(1, 1 - normScanY));

  const bands = 32;
  const columnProfile: number[] = [];
  for (let bIdx = 0; bIdx < bands; bIdx++) {
    const xPos = Math.floor(((bIdx + 0.5) / bands) * width);
    let colSig = 0;
    let colSamples = 0;
    for (let y = 0; y < height; y += 8) {
      const idx = (y * width + xPos) * 4;
      const r = data[idx] / 255;
      const g = data[idx + 1] / 255;
      const b = data[idx + 2] / 255;
      const rawLum = 0.299 * r + 0.587 * g + 0.114 * b;
      let sig = rawLum;
      if (invertLuminance) {
        const chroma = Math.max(r, g, b) - Math.min(r, g, b);
        sig = rawLum > 0.94 && chroma < 0.06 ? 0 : Math.min(1, (1 - rawLum) * 0.65 + chroma * 0.6);
      }
      colSig += sig;
      colSamples++;
    }
    columnProfile.push(Math.min(1, (colSig / Math.max(1, colSamples)) * 1.8));
  }

  const notes = SCALE_NOTES[scale];
  const noteIdx = Math.min(
    notes.length - 1,
    Math.floor(((luminance + spatialElevation) * 0.5) * notes.length)
  );
  const octave = Math.round(3 + spatialElevation * 2);
  const activeNoteName = `${notes[noteIdx]}${octave}`;
  const chordRoot = notes[Math.floor(redMean * (notes.length - 1))];
  const chordQuality =
    scale === "pentatonic" || scale === "lydian" ? "maj7" : "min9";

  const geo = describeGeoSector(normScanX, normScanY, projection, luminance);
  const spatialZoneLabel =
    projection === "equirectangular"
      ? `${geo.regionHint} (${geo.latitudeLabel}, ${geo.longitudeLabel})`
      : `${geo.regionHint} · ${geo.longitudeLabel}`;

  return {
    luminance,
    redMean,
    greenMean,
    blueMean,
    pixelDensity,
    contrastEnergy,
    transientSpike,
    spatialPan,
    spatialElevation,
    dominantHue: computeHue(redMean, greenMean, blueMean),
    columnProfile,
    activeNoteName,
    activeChordName: `${chordRoot}${chordQuality}`,
    scientificReading: formatScientificReading(
      dataset,
      luminance,
      redMean,
      greenMean,
      blueMean,
      pixelDensity,
      transientSpike,
      spatialZoneLabel,
      projection
    ),
    projection,
    spatialZoneLabel,
  };
}

export function extractTactileMatrix(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  cols = 8,
  rows = 6,
  invertLuminance = false
): number[][] {
  const data = ctx.getImageData(0, 0, width, height).data;
  const cellW = Math.floor(width / cols);
  const cellH = Math.floor(height / rows);
  const matrix: number[][] = [];

  for (let r = 0; r < rows; r++) {
    const rowVals: number[] = [];
    for (let c = 0; c < cols; c++) {
      let sum = 0;
      let count = 0;
      for (let y = r * cellH; y < (r + 1) * cellH; y += 4) {
        for (let x = c * cellW; x < (c + 1) * cellW; x += 4) {
          const idx = (y * width + x) * 4;
          const pr = data[idx] / 255;
          const pg = data[idx + 1] / 255;
          const pb = data[idx + 2] / 255;
          const rawLum = 0.299 * pr + 0.587 * pg + 0.114 * pb;

          let signal = rawLum;
          if (invertLuminance) {
            const chroma = Math.max(pr, pg, pb) - Math.min(pr, pg, pb);
            signal =
              rawLum > 0.94 && chroma < 0.06
                ? 0
                : Math.min(1, (1 - rawLum) * 0.65 + chroma * 0.6);
          }

          sum += signal;
          count++;
        }
      }
      rowVals.push(Math.min(1, sum / Math.max(1, count)));
    }
    matrix.push(rowVals);
  }

  return matrix;
}
