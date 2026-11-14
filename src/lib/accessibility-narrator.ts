import type { CVFrameMetrics, FrameProjection, NASADataset } from "./types";

export function isSpeechSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function stopSpeaking(): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
}

export function speakText(text: string, rate = 1.05): void {
  if (!isSpeechSupported()) return;
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = rate;
  utterance.pitch = 1.0;
  utterance.lang = "en-US";
  window.speechSynthesis.speak(utterance);
}

export function speakTrackIntro(dataset: NASADataset): void {
  const trackLabel =
    dataset.trackNumber > 0
      ? `Track ${dataset.trackNumber}`
      : "Calibration Reference";
  speakText(
    `${trackLabel}: ${dataset.shortTitle}, from NASA SVS number ${dataset.svsId}. ${dataset.climateStory}`
  );
}

export function speakTelemetry(
  dataset: NASADataset,
  metrics: CVFrameMetrics
): void {
  const panDirection =
    metrics.spatialPan < -0.2
      ? "left stereo channel"
      : metrics.spatialPan > 0.2
        ? "right stereo channel"
        : "center channel";
  const lumPct = Math.round(metrics.luminance * 100);
  const densityPct = Math.round(metrics.pixelDensity * 100);

  speakText(
    `${dataset.shortTitle}, ${metrics.spatialZoneLabel}. ${metrics.scientificReading}. Optical signal ${lumPct} percent, density ${densityPct} percent panned to ${panDirection}, playing ${metrics.activeNoteName} in ${metrics.activeChordName}.`
  );
}

export interface GeoSectorDescription {
  latitudeLabel: string;
  longitudeLabel: string;
  regionHint: string;
  projectionTag: string;
}

export function describeGeoSector(
  normX: number,
  normY: number,
  projection: FrameProjection = "equirectangular",
  signalStrength = 0.5
): GeoSectorDescription {
  const x = Math.max(0, Math.min(1, normX));
  const y = Math.max(0, Math.min(1, normY));

  if (projection === "celestial-cluster") {
    const radialDist = Math.hypot(x - 0.5, y - 0.5);
    let regionHint = "Outer Stellar Field (NGC 1851 Halo)";
    if (radialDist < 0.18) regionHint = "Caldwell 73 Core (Peak Star Density)";
    else if (radialDist < 0.34) regionHint = "Inner Globular Cluster Ring";

    return {
      latitudeLabel: `DEC Offset ${Math.round((0.5 - y) * 18)} arcmin`,
      longitudeLabel: `RA Offset ${Math.round((x - 0.5) * 24)} arcmin`,
      regionHint,
      projectionTag: "DEEP-SPACE FIELD",
    };
  }

  if (projection === "multi-strip-pollutants") {
    const radialDist = Math.hypot((x - 0.5) * 1.45, y - 0.5);
    if (radialDist > 0.52) {
      return {
        latitudeLabel: "Off-Disk",
        longitudeLabel: "Margin Background",
        regionHint: "Frame Margin Outside Earth Disk",
        projectionTag: "MULTI-STRIP SPHERE",
      };
    }

    let species = "Carbon Monoxide (CO) Plume Band";
    if (x >= 0.25 && x < 0.43) species = "Particulate Matter (PM2.5) Band";
    else if (x >= 0.43 && x < 0.63) species = "Nitrous Oxides (NOx) Band";
    else if (x >= 0.63 && x < 0.78) species = "Tropospheric Ozone (O₃) Band";
    else if (x >= 0.78) species = "Eastern Margin Dispersion Band";

    const band =
      y < 0.35
        ? "Northern Hemisphere"
        : y > 0.65
          ? "Southern Hemisphere"
          : "Tropical Belt";

    return {
      latitudeLabel: band,
      longitudeLabel: `Scan ${Math.round(x * 100)}% Width`,
      regionHint: `${species} · ${band}`,
      projectionTag: "MULTI-STRIP SPHERE",
    };
  }

  if (
    projection === "globe-americas" ||
    projection === "globe-eastern" ||
    projection === "globe-pacific"
  ) {
    const radialDist = Math.hypot((x - 0.5) * 1.45, y - 0.5);
    if (radialDist > 0.52 && signalStrength < 0.1) {
      return {
        latitudeLabel: "Off-Disk",
        longitudeLabel: "Space Vacuum",
        regionHint: "Deep Space Limb Margin (Off-Disk)",
        projectionTag: "ORTHOGRAPHIC GLOBE",
      };
    }

    const latBand =
      y < 0.28
        ? "High Northern Band"
        : y < 0.44
          ? "Northern Mid-Latitude"
          : y <= 0.58
            ? "Equatorial Belt"
            : "Southern Hemisphere";

    const hemiLabel =
      projection === "globe-americas"
        ? "Americas / Atlantic View"
        : projection === "globe-eastern"
          ? "Afro-Eurasian View"
          : "Indo-Pacific Basin View";

    const limbPos =
      x < 0.34 ? "Western Limb" : x > 0.66 ? "Eastern Limb" : "Central Meridian";

    return {
      latitudeLabel: latBand,
      longitudeLabel: limbPos,
      regionHint: `${hemiLabel} · ${latBand}`,
      projectionTag: "ORTHOGRAPHIC GLOBE",
    };
  }

  if (projection === "regional-grid") {
    return {
      latitudeLabel: `Row ${Math.round(y * 100)}%`,
      longitudeLabel: `Col ${Math.round(x * 100)}%`,
      regionHint: "High-Resolution Regional Zoom Sector",
      projectionTag: "REGIONAL SECTOR",
    };
  }

  // Default: true equirectangular global grid
  const latDeg = Math.round(75 - y * 135);
  const lonDeg = Math.round(-165 + x * 330);

  const latitudeLabel =
    latDeg >= 0 ? `${latDeg}°N` : `${Math.abs(latDeg)}°S`;
  const longitudeLabel =
    lonDeg >= 0 ? `${lonDeg}°E` : `${Math.abs(lonDeg)}°W`;

  let regionHint = "Open Oceanic Basin";
  if (lonDeg < -35 && latDeg > 15) regionHint = "North America & N. Atlantic";
  else if (lonDeg < -30 && latDeg <= 15) regionHint = "South America & Amazonia";
  else if (lonDeg >= -30 && lonDeg <= 50 && latDeg > 32)
    regionHint = "Europe & Mediterranean";
  else if (lonDeg >= -20 && lonDeg <= 52 && latDeg <= 32 && latDeg >= -35)
    regionHint = "Africa & Tropical Corridor";
  else if (lonDeg > 50 && latDeg > 5) regionHint = "Asia & Himalayan Arc";
  else if (lonDeg > 100 && latDeg <= 5) regionHint = "Indo-Pacific & Australia";

  return {
    latitudeLabel,
    longitudeLabel,
    regionHint,
    projectionTag: "EQUIRECTANGULAR MAP",
  };
}

export function speakTactileSector(
  col: number,
  row: number,
  cols: number,
  rows: number,
  intensity: number,
  noteName: string,
  dataset: NASADataset,
  projection: FrameProjection = "equirectangular"
): void {
  const nx = col / Math.max(1, cols - 1);
  const ny = row / Math.max(1, rows - 1);
  const { latitudeLabel, longitudeLabel, regionHint } = describeGeoSector(
    nx,
    ny,
    projection,
    intensity
  );
  const pct = Math.round(intensity * 100);
  const level =
    pct > 70 ? "high intensity" : pct > 35 ? "moderate signal" : "low background";
  speakText(
    `${regionHint}, ${latitudeLabel}, ${longitudeLabel}. ${dataset.shortTitle} registers ${level} at ${pct} percent, sounding ${noteName}.`,
    1.1
  );
}
