export type ScaleType =
  | "pentatonic"
  | "lydian"
  | "dorian"
  | "harmonicMinor"
  | "scientificChromatic";

export type ScanMode = "horizontal" | "vertical" | "radar" | "probe";

export type StemId = "melody" | "harmony" | "rhythm" | "texture";

export type FrameProjection =
  | "equirectangular"
  | "globe-americas"
  | "globe-eastern"
  | "globe-pacific"
  | "multi-strip-pollutants"
  | "regional-grid"
  | "celestial-cluster";

export interface StemState {
  gain: number;
  muted: boolean;
  solo: boolean;
}

export type StemsMap = Record<StemId, StemState>;

export interface SVSFrameVariant {
  id: string;
  label: string;
  localSrc: string;
  remoteUrl: string;
  caption: string;
  projection: FrameProjection;
  invertLuminance?: boolean;
}

export interface CVFrameMetrics {
  luminance: number; // 0..1 (calibrated optical signal; inverted on light-background charts)
  redMean: number; // 0..1
  greenMean: number; // 0..1
  blueMean: number; // 0..1
  pixelDensity: number; // 0..1
  contrastEnergy: number; // 0..1
  transientSpike: number; // 0..1
  spatialPan: number; // -1..1 (West to East)
  spatialElevation: number; // 0..1 (South to North)
  dominantHue: number; // 0..360
  columnProfile: number[]; // 32 normalized energy bands
  activeNoteName: string;
  activeChordName: string;
  scientificReading: string;
  projection: FrameProjection;
  spatialZoneLabel: string;
}

export interface MappingRule {
  visualFeature: string;
  audioParameter: string;
  description: string;
}

export interface NASADataset {
  id: string;
  trackNumber: number;
  svsId: number;
  title: string;
  shortTitle: string;
  category:
    | "Urban & Energy"
    | "Oceans & Thermal"
    | "Atmosphere & Air"
    | "Climate & Carbon"
    | "Biosphere"
    | "Conceptual Reference";
  instrumentSensor: string;
  svsUrl: string;
  frames: SVSFrameVariant[];
  timeframe: string;
  scienceSummary: string;
  climateStory: string;
  sonicSignature: string;
  defaultScale: ScaleType;
  defaultBpm: number;
  accentColor: string;
  unitLabel: string;
  mappingRules: MappingRule[];
  stemDescriptions: Record<StemId, string>;
}

export interface SVSApiMetadata {
  svsId: number;
  title: string;
  description: string;
  releaseDate: string;
  previewImageUrl: string | null;
  mediaImages: string[];
  credits: string;
  source: "live-svs-page" | "verified-local-archive";
}

export type CustomMediaSourceMode =
  | "archive-frame"
  | "local-upload"
  | "remote-svs-url";
