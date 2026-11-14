import type { NASADataset } from "./types";

export const TEAMX_INFO = {
  projectName: "TERRA-SONIC: The NASA Earth Information Jukebox",
  tagline: "Translating NASA Earth Visualizations into Real-Time Accessible Soundscapes",
  teamName: "TeamX",
  challengeName: "The Earth Information Jukebox",
  eventName: "2026 NASA Space Apps Challenge",
  members: [
    { name: "Asim Hanif", role: "Team Leader & Systems Architect" },
    { name: "Maira Noor", role: "Computer Vision & Data Engineer" },
    { name: "Malaika Altaf", role: "Sound Design & Accessibility Lead" },
    { name: "Tayyab Ali", role: "Frontend Engineering & Storyteller" },
  ],
  siDisclosure:
    "Super Intelligence (SI) tools were utilized responsibly to assist with software architecture, TypeScript/Web Audio API implementation, and scientific documentation structuring. All NASA SVS visualizations, scientific descriptions, and procedural sonification algorithms are verified and explicitly attributed without NASA logo reproduction.",
};

export const PARTNER_AND_OPEN_SOURCE_REFERENCES = [
  {
    name: "NASA Scientific Visualization Studio (SVS)",
    role: "Primary Earth & Astrophysical Visualization Repository (No NASA logo reproduction)",
    url: "https://svs.gsfc.nasa.gov/gallery/earth-information-center/",
  },
  {
    name: "2026 NASA Space Apps Challenge Program & Contractors",
    role: "Funded by NASA Science Mission Directorate via Booz Allen Hamilton, Mindgrub, and SecondMuse",
    url: "https://www.spaceappschallenge.org/2026/challenges/the-earth-information-jukebox/",
  },
  {
    name: "Open-Source Web Audio & Canvas Stack",
    role: "Next.js 15, React 19, TypeScript, Tailwind CSS v4, Web Audio API, HTML5 Canvas 2D getImageData, Web Speech API",
    url: "https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API",
  },
];

export const NASA_DATASETS: NASADataset[] = [
  {
    id: "night-lights",
    trackNumber: 1,
    svsId: 5313,
    title: "Change in Night Lights (2012–2023) - EIC Version",
    shortTitle: "Night Lights 2012–2023",
    category: "Urban & Energy",
    instrumentSensor: "Suomi NPP / NOAA-20 VIIRS Black Marble",
    svsUrl: "https://svs.gsfc.nasa.gov/5313/",
    frames: [
      {
        id: "5313-1",
        label: "2023 Global Radiance",
        localSrc: "/nasa-frames/5313-1.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005200/a005276/nightlights_flat_series_stills_only_lights.2023_web.jpg",
        caption: "Global nocturnal radiance observed by VIIRS in 2023.",
        projection: "equirectangular",
      },
      {
        id: "5313-2",
        label: "2012–2023 Change Map",
        localSrc: "/nasa-frames/5313-2.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005300/a005313/nightlights_flat_series_and_change_wZooms_13_EIC.02599_print.jpg",
        caption: "Decadal urban expansion & decline contrast (blue/amber change).",
        projection: "regional-grid",
      },
      {
        id: "5313-3",
        label: "Regional Grid Detail",
        localSrc: "/nasa-frames/5313-3.png",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005400/a005475/nightlights_2012-2024_KSC_SOS_04_plus2_0900_2k.png",
        caption: "High-resolution metropolitan & transport corridor illumination.",
        projection: "equirectangular",
      },
    ],
    timeframe: "2012 – 2023",
    scienceSummary:
      "Tracks over a decade of shifting human settlements, grid expansion, and coastal urbanization across dark continental terrain.",
    climateStory:
      "As scanlines sweep across Earth's illuminated corridors, dense city centers accelerate rhythmic synth bells while dark oceans preserve serene acoustic space.",
    sonicSignature: "Shimmering major pentatonic plucks over deep nocturnal sub-bass",
    defaultScale: "pentatonic",
    defaultBpm: 112,
    accentColor: "#f59e0b",
    unitLabel: "Radiance (nW/cm²/sr)",
    mappingRules: [
      {
        visualFeature: "Gold/White Radiance Pixels",
        audioParameter: "Arpeggio Velocity & Pitch",
        description: "Dense city clusters trigger rapid bright synth bells.",
      },
      {
        visualFeature: "Dark Ocean & Wilderness",
        audioParameter: "Sub-Bass Floor & Silence",
        description: "Unlit terrain creates calm acoustic breathing room.",
      },
      {
        visualFeature: "West–East Longitude",
        audioParameter: "3D Stereo Panning",
        description: "Americas sound left, Europe/Africa center, Asia/Pacific right.",
      },
    ],
    stemDescriptions: {
      melody: "Urban Radiance Synth Bells",
      harmony: "Nocturnal Horizon Drone Pad",
      rhythm: "Population Corridor Pulse",
      texture: "High-Intensity Grid Shimmer",
    },
  },
  {
    id: "sea-currents-temp",
    trackNumber: 2,
    svsId: 3912,
    title: "Global Sea Surface Currents and Temperature",
    shortTitle: "Sea Currents & Temp",
    category: "Oceans & Thermal",
    instrumentSensor: "NASA ECCO2 High-Res Ocean Circulation Model",
    svsUrl: "https://svs.gsfc.nasa.gov/3912/#media_group_349716",
    frames: [
      {
        id: "3912-1",
        label: "Global SST & Currents",
        localSrc: "/nasa-frames/3912-1.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a003900/a003912/flat_global_ecco2_2028x1024.25000.jpg",
        caption: "Global ocean current streamlines colored by sea surface temperature.",
        projection: "equirectangular",
      },
      {
        id: "3912-2",
        label: "Eddy & Grid Detail",
        localSrc: "/nasa-frames/3912-2.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a003900/a003912/ecco2_and_grid_crop1.jpg",
        caption: "Close-up of mesoscale ocean eddies and computational current vectors.",
        projection: "regional-grid",
      },
    ],
    timeframe: "ECCO2 Global Simulation",
    scienceSummary:
      "Illustrates fluid global ocean circulation layered atop thermal gradients from frigid polar waters to warm equatorial streams.",
    climateStory:
      "Warm red equatorial currents open harmonic low-pass filters into rich chords, while cold polar currents pull the music down into deep cello-like registers.",
    sonicSignature: "Lydian warm pads gliding smoothly with ocean thermal eddies",
    defaultScale: "lydian",
    defaultBpm: 92,
    accentColor: "#38bdf8",
    unitLabel: "SST (°C) / Velocity",
    mappingRules: [
      {
        visualFeature: "Red/Warm vs Blue/Cold Hue",
        audioParameter: "Filter Cutoff & Chord Warmth",
        description: "Warm tropical eddies open overtones; cold currents darken timbre.",
      },
      {
        visualFeature: "Streamline Contrast Energy",
        audioParameter: "LFO Modulation Depth",
        description: "Turbulent eddy shear shapes rhythmic modulation intensity.",
      },
      {
        visualFeature: "Thermal Pixel Density",
        audioParameter: "Pad Polyphony Density",
        description: "Broader warm basins swell multi-voice chords.",
      },
    ],
    stemDescriptions: {
      melody: "Current Streamline Voice",
      harmony: "Thermal Gradient String Pad",
      rhythm: "Tidal Eddy Undulation",
      texture: "Deep Abyssal Ocean Wash",
    },
  },
  {
    id: "geos-aerosols",
    trackNumber: 3,
    svsId: 5669,
    title: "GEOS Aerosols (Dust, Smoke, Sea Salt, Sulfates)",
    shortTitle: "GEOS Aerosols",
    category: "Atmosphere & Air",
    instrumentSensor: "NASA GEOS-5 Earth System Model",
    svsUrl: "https://svs.gsfc.nasa.gov/5669/",
    frames: [
      {
        id: "5669-1",
        label: "Global 4-Species Aerosols",
        localSrc: "/nasa-frames/5669-1.png",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005600/a005669/Aerosols_2025-08-19T20_00_00_1920x1080.png",
        caption: "Global GEOS model showing Dust (lavender), Smoke/Organic (green/orange), Sea Salt (blue).",
        projection: "equirectangular",
      },
      {
        id: "5669-2",
        label: "Atmospheric Transport",
        localSrc: "/nasa-frames/5669-2.png",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005600/a005669/Aerosols_2025-08-19T20_00_00_1500x1179_72dpi.png",
        caption: "Cross-continental dust and biomass smoke plumes in transit.",
        projection: "equirectangular",
      },
    ],
    timeframe: "August 2025 GEOS Run",
    scienceSummary:
      "Separates airborne dust, biomass wildfire smoke, marine sea salt, and industrial sulfates circling Earth's atmosphere.",
    climateStory:
      "Four distinct atmospheric particle species act as a four-piece chamber ensemble—Saharan dust taps percussion while wildfire smoke bows sustained tones.",
    sonicSignature: "Multi-track RGB-separated 4-instrument atmospheric symphony",
    defaultScale: "dorian",
    defaultBpm: 104,
    accentColor: "#fb923c",
    unitLabel: "Aerosol Optical Depth",
    mappingRules: [
      {
        visualFeature: "Red Channel (Saharan Dust)",
        audioParameter: "Rhythm Stem Percussion",
        description: "Desert dust plumes drive earthy rhythmic hits.",
      },
      {
        visualFeature: "Green Channel (Wildfire Smoke)",
        audioParameter: "Harmony Stem Sustained Reeds",
        description: "Smoke corridors trigger haunting sustained harmonic chords.",
      },
      {
        visualFeature: "Blue Channel (Sea Salt Spray)",
        audioParameter: "Lead Crystalline Chimes",
        description: "Marine spray sparkles in upper octave tones.",
      },
    ],
    stemDescriptions: {
      melody: "Blue Sea-Salt Bell Chimes",
      harmony: "Green Smoke Bowed Pad",
      rhythm: "Red Saharan Dust Percussion",
      texture: "Sulfate Atmospheric Wind",
    },
  },
  {
    id: "air-quality",
    trackNumber: 4,
    svsId: 5533,
    title: "Air Quality Model Runs",
    shortTitle: "Air Quality Models",
    category: "Atmosphere & Air",
    instrumentSensor: "NASA GMAO GEOS-CF Atmospheric Chemistry",
    svsUrl: "https://svs.gsfc.nasa.gov/5533/",
    frames: [
      {
        id: "5533-1",
        label: "Global Air Quality Sphere",
        localSrc: "/nasa-frames/5533-1.png",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005533/AirQuality_Sphere_1920x1080_0000.png",
        caption: "Americas pollutant strips: PM2.5 (orange), NOx (green), Ozone (violet).",
        projection: "multi-strip-pollutants",
        invertLuminance: true,
      },
      {
        id: "5533-2",
        label: "Labeled Pollutant Plumes",
        localSrc: "/nasa-frames/5533-2.png",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005533/AirQuality_WithLabels_1920x1080_0000.png",
        caption: "CO, PM2.5, NOx & O₃ atmospheric chemistry strips across hemispheres.",
        projection: "multi-strip-pollutants",
        invertLuminance: true,
      },
      {
        id: "5533-3",
        label: "Hemispheric Run Frame",
        localSrc: "/nasa-frames/5533-3.png",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005500/a005533/AirQuality_SphereLong_1920x1080_3030.png",
        caption: "Night/dark-field atmospheric pollutant sphere across the Americas.",
        projection: "multi-strip-pollutants",
        invertLuminance: false,
      },
    ],
    timeframe: "GEOS-CF High-Res Model",
    scienceSummary:
      "High-resolution atmospheric chemistry frames showing nitrogen dioxide and particulate plumes dispersing over metropolitan basins.",
    climateStory:
      "Clean air resonates in open, pure consonant fifths; as dense pollution bands pass under the scanline, harmonic tension and breathy air noise rise.",
    sonicSignature: "Consonant-to-tense harmonic breath revealing air cleanliness",
    defaultScale: "harmonicMinor",
    defaultBpm: 98,
    accentColor: "#c084fc",
    unitLabel: "AQI / NO₂ (µg/m³)",
    mappingRules: [
      {
        visualFeature: "Plume Pixel Density",
        audioParameter: "Filtered Wind Breath",
        description: "Thick particulate regions swell filtered noise air flow.",
      },
      {
        visualFeature: "Local Contrast Variance",
        audioParameter: "Harmonic Tension Interval",
        description: "Sharp pollution fronts introduce urgent harmonic intervals.",
      },
      {
        visualFeature: "Clear Atmosphere Luminance",
        audioParameter: "Pure Sine Resonance",
        description: "Unpolluted corridors restore clear, serene harmonics.",
      },
    ],
    stemDescriptions: {
      melody: "Tropospheric Clarity Lead",
      harmony: "Particulate Tension Pad",
      rhythm: "Dispersion Front Pulse",
      texture: "Filtered Atmospheric Wind",
    },
  },
  {
    id: "perpetual-ocean",
    trackNumber: 5,
    svsId: 5425,
    title: "Perpetual Ocean 2: Western Boundary Currents",
    shortTitle: "Perpetual Ocean 2",
    category: "Oceans & Thermal",
    instrumentSensor: "ECCO / MITgcm Ocean Flow Simulation",
    svsUrl: "https://svs.gsfc.nasa.gov/5425/",
    frames: [
      {
        id: "5425-1",
        label: "Boundary Streamlines",
        localSrc: "/nasa-frames/5425-1.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005400/a005425/perpetual_ocean2_CLOSE_093_4k_clean_noDate.00000_print.jpg",
        caption: "High-contrast Indo-Pacific & Kuroshio boundary current velocity filaments.",
        projection: "globe-pacific",
      },
      {
        id: "5425-2",
        label: "Ocean Thermal Flow",
        localSrc: "/nasa-frames/5425-2.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005400/a005425/perpetual_ocean2_CLOSE_096_temperature.00000_print.jpg",
        caption: "Western boundary current turbulence paired with sea surface temperature.",
        projection: "globe-pacific",
      },
      {
        id: "5425-3",
        label: "Ocean Salinity Field",
        localSrc: "/nasa-frames/5425-3.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005400/a005425/perpetual_ocean2_CLOSE_103_salinity.00001_print.jpg",
        caption: "Ocean salinity gradients interwoven with boundary currents.",
        projection: "globe-pacific",
      },
    ],
    timeframe: "4K Streamline Series",
    scienceSummary:
      "Captures the powerful western boundary currents like the Gulf Stream and Kuroshio transporting heat across ocean basins.",
    climateStory:
      "High-contrast swirling white current filaments spin into interlocking Lydian polyrhythms—translating fluid turbulence into kinetic acoustic beauty.",
    sonicSignature: "Kinetic polyrhythmic harp and marimba streams",
    defaultScale: "lydian",
    defaultBpm: 118,
    accentColor: "#22d3ee",
    unitLabel: "Current Speed (m/s)",
    mappingRules: [
      {
        visualFeature: "Filament Edge Contrast",
        audioParameter: "Polyrhythmic Harp Velocity",
        description: "Fast Gulf Stream jets trigger rapid cascading arpeggios.",
      },
      {
        visualFeature: "Vortex Rotation Density",
        audioParameter: "Stereo Harmonic Width",
        description: "Swirling eddies modulate stereo spatial balance.",
      },
      {
        visualFeature: "Deep Ocean Floor",
        audioParameter: "Sub-Harmonic Anchor",
        description: "Calm basin centers stabilize the harmonic root note.",
      },
    ],
    stemDescriptions: {
      melody: "Streamline Velocity Harp",
      harmony: "Oceanic Basin Pad",
      rhythm: "Boundary Jet Polyrhythm",
      texture: "Vortex Echo Shimmer",
    },
  },
  {
    id: "dyamond-co2",
    trackNumber: 6,
    svsId: 5196,
    title: "DYAMOND Global Carbon Dioxide",
    shortTitle: "DYAMOND Global CO₂",
    category: "Climate & Carbon",
    instrumentSensor: "GEOS DYAMOND Ultra-High-Res Model",
    svsUrl: "https://svs.gsfc.nasa.gov/5196/",
    frames: [
      {
        id: "5196-1",
        label: "Global CO₂ Orbit",
        localSrc: "/nasa-frames/5196-1.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005196/dyamondPointCloud_12-1-2023b_dyamond_co2_anim_globe_orbit_3x3Hyperwall.00200_print.jpg",
        caption: "Global atmospheric CO₂ concentration plumes orbiting Afro-Eurasia & Australia.",
        projection: "globe-eastern",
      },
      {
        id: "5196-2",
        label: "Hemispheric Plume Zoom",
        localSrc: "/nasa-frames/5196-2.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005100/a005196/dyamondPointCloud_3-29-2023a_dyamond_co2_anim_globe_zoom_3x3hyperwall.00800_print.jpg",
        caption: "High-resolution North American CO₂ and wildfire emission plumes.",
        projection: "regional-grid",
      },
    ],
    timeframe: "Jan–Mar 2020 Global Run",
    scienceSummary:
      "Visualizes global carbon dioxide concentrations swirling across hemispheres as emissions mix with seasonal biosphere absorption.",
    climateStory:
      "Dense amber and crimson CO₂ plumes raise the harmonic pitch center and quicken a steady Dorian pulse, communicating climate urgency directly.",
    sonicSignature: "Emotional Dorian strings with rising carbon-intensity urgency",
    defaultScale: "dorian",
    defaultBpm: 96,
    accentColor: "#f43f5e",
    unitLabel: "CO₂ Concentration (ppm)",
    mappingRules: [
      {
        visualFeature: "Crimson/Amber CO₂ Plumes",
        audioParameter: "Urgency Pulse & Pitch Rise",
        description: "Concentrated carbon plumes lift pitch and drive a steady heartbeat.",
      },
      {
        visualFeature: "Hemispheric Plume Spread",
        audioParameter: "Stereo Pad Density",
        description: "Global mixing fills chord harmonics across the soundstage.",
      },
      {
        visualFeature: "Biosphere Sink Gaps",
        audioParameter: "Acoustic Filter Relaxation",
        description: "Lower-concentration zones soften harmonic tension.",
      },
    ],
    stemDescriptions: {
      melody: "Carbon Concentration Voice",
      harmony: "Climate Urgency Strings",
      rhythm: "Planetary Heartbeat Pulse",
      texture: "Atmospheric Plume Rush",
    },
  },
  {
    id: "iss-lightning",
    trackNumber: 7,
    svsId: 5011,
    title: "Lightning Events Detected from the ISS (2017–2023)",
    shortTitle: "ISS Lightning Events",
    category: "Atmosphere & Air",
    instrumentSensor: "ISS Lightning Imaging Sensor (LIS)",
    svsUrl: "https://svs.gsfc.nasa.gov/5011/",
    frames: [
      {
        id: "5011-1",
        label: "LIS Orbital Swath",
        localSrc: "/nasa-frames/5011-1.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005000/a005011/iss_lightning_preview.jpg",
        caption: "ISS orbit and real-time optical lightning detections over Africa.",
        projection: "globe-eastern",
      },
      {
        id: "5011-2",
        label: "2023 Global Lightning Map",
        localSrc: "/nasa-frames/5011-2.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a005000/a005011/iss_lightning_sos_yearly_debug_2023_sos_2048p60.00420_print.jpg",
        caption: "Equirectangular tropical & continental thunderstorm belts (2023).",
        projection: "equirectangular",
      },
    ],
    timeframe: "2017 – 2023",
    scienceSummary:
      "Maps millions of orbital lightning flashes detected by the Lightning Imaging Sensor aboard the International Space Station.",
    climateStory:
      "Every intense electrical hotspot scanned in the frame fires a crisp, spatialized percussive spark—turning storm belts into electric rhythms.",
    sonicSignature: "Punctuated electric plucks and spatial transient sparks",
    defaultScale: "pentatonic",
    defaultBpm: 126,
    accentColor: "#60a5fa",
    unitLabel: "Flashes / min / km²",
    mappingRules: [
      {
        visualFeature: "High-Luminance Flash Peaks",
        audioParameter: "Sharp Percussive Sparks",
        description: "Pixels exceeding flash threshold fire crisp stereo chimes.",
      },
      {
        visualFeature: "Storm Belt Latitude",
        audioParameter: "Spark Pitch Register",
        description: "Equatorial storms sit warm-mid; mid-latitudes chime higher.",
      },
      {
        visualFeature: "Storm Cluster Density",
        audioParameter: "Rhythmic Trigger Rate",
        description: "Dense thunderstorm corridors accelerate percussive bursts.",
      },
    ],
    stemDescriptions: {
      melody: "Orbital Lightning Plucks",
      harmony: "Night Storm Cloud Pad",
      rhythm: "Thunderhead Transient Grid",
      texture: "High-Voltage Ionosphere Spark",
    },
  },
  {
    id: "atmospheric-river",
    trackNumber: 8,
    svsId: 4960,
    title: "A 3D View of an Atmospheric River from an Earth System Model",
    shortTitle: "3D Atmospheric River",
    category: "Climate & Carbon",
    instrumentSensor: "NASA GEOS-FP Water Vapor 3D",
    svsUrl: "https://svs.gsfc.nasa.gov/4960/",
    frames: [
      {
        id: "4960-1",
        label: "3D Moisture Overview",
        localSrc: "/nasa-frames/4960-1.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a004900/a004960/atmos_rivers_narrated_4k.00090_print.jpg",
        caption: "3D Earth limb illustrating atmospheric moisture transport.",
        projection: "globe-eastern",
      },
      {
        id: "4960-2",
        label: "Pacific Vapor Landfall",
        localSrc: "/nasa-frames/4960-2.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a004900/a004960/atmos_river.0324_rfm23_2021-11-29_1351.04370_print.jpg",
        caption: "Volumetric NE Pacific atmospheric river hitting Western North America.",
        projection: "regional-grid",
      },
    ],
    timeframe: "GEOS 3D Moisture Event",
    scienceSummary:
      "Follows an immense sky-river of concentrated water vapor transporting tropical moisture toward coastal mountain ranges.",
    climateStory:
      "As the cyan moisture corridor sweeps across the Pacific, lush cascading tones and wide stereo textures evoke the sheer volume of sky water.",
    sonicSignature: "Rain-soaked ambient reverb with cascading moisture droplets",
    defaultScale: "lydian",
    defaultBpm: 88,
    accentColor: "#2dd4bf",
    unitLabel: "Integrated Vapor (kg/m/s)",
    mappingRules: [
      {
        visualFeature: "Cyan/Teal Vapor Core",
        audioParameter: "Spatial Wash & Chorus",
        description: "Dense water vapor opens rich cascading harmonics.",
      },
      {
        visualFeature: "Vertical 3D Plume Span",
        audioParameter: "Harmonic Octave Width",
        description: "Tall moisture columns span multiple octaves.",
      },
      {
        visualFeature: "Coastal Landfall Contrast",
        audioParameter: "Sub-Bass Swell",
        description: "Plume density deepens lower frequencies.",
      },
    ],
    stemDescriptions: {
      melody: "Vapor Droplet Piano",
      harmony: "Pacific Moisture Chorus",
      rhythm: "Jet Stream Cascade",
      texture: "Rainfall Spatial Mist",
    },
  },
  {
    id: "gedi-forest",
    trackNumber: 9,
    svsId: 4950,
    title: "GEDI Forest Height",
    shortTitle: "GEDI Forest Height",
    category: "Biosphere",
    instrumentSensor: "ISS GEDI Spaceborne Laser LiDAR",
    svsUrl: "https://svs.gsfc.nasa.gov/4950/",
    frames: [
      {
        id: "4950-1",
        label: "Global Canopy Sphere",
        localSrc: "/nasa-frames/4950-1.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a004900/a004950/GEDI_global.0900_print.jpg",
        caption: "3D global forest canopy elevation measured by ISS GEDI laser pulses.",
        projection: "globe-eastern",
      },
      {
        id: "4950-2",
        label: "Canopy Height + 0–50m Scale",
        localSrc: "/nasa-frames/4950-2.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a004900/a004950/GEDI_global_w_colorbar_0900_print.jpg",
        caption: "GEDI height map with 0–50m calibrated elevation scale across Africa/Eurasia.",
        projection: "globe-eastern",
      },
      {
        id: "4950-3",
        label: "California Transect",
        localSrc: "/nasa-frames/4950-3.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a000000/a004900/a004950/GEDI_CA_w_colorbar_0850_print.jpg",
        caption: "Regional LiDAR transect highlighting California redwood & montane forests.",
        projection: "regional-grid",
      },
    ],
    timeframe: "ISS GEDI LiDAR Mission",
    scienceSummary:
      "Maps global forest canopy heights measured by spaceborne LiDAR—highlighting towering emerald rainforests versus low arid scrub.",
    climateStory:
      "Towering 50-meter rainforests in the Amazon and Congo bloom into rich, warm kalimba and woodwind chords, while arid plains thin to delicate clicks.",
    sonicSignature: "Organic kalimba & woodwind harmonics tuned to canopy elevation",
    defaultScale: "pentatonic",
    defaultBpm: 94,
    accentColor: "#10b981",
    unitLabel: "Canopy Height (m)",
    mappingRules: [
      {
        visualFeature: "Emerald Canopy Pixels",
        audioParameter: "Harmonic Richness & Pitch",
        description: "Tall old-growth forests resonate with warm multi-harmonic overtones.",
      },
      {
        visualFeature: "Biome Color Spectrum",
        audioParameter: "Timbre Brightness",
        description: "Tropical greens play mellow woodwinds; arid browns thin out.",
      },
      {
        visualFeature: "Fragmentation Gaps",
        audioParameter: "Rhythmic Silence Dropouts",
        description: "Cleared canopy areas produce acoustic thinning.",
      },
    ],
    stemDescriptions: {
      melody: "Canopy Kalimba Voice",
      harmony: "Rainforest Biosphere Chord",
      rhythm: "LiDAR Laser Pulse",
      texture: "Canopy Breeze Texture",
    },
  },
  {
    id: "caldwell-73",
    trackNumber: 0,
    svsId: 13786,
    title: "Data Sonification: Caldwell 73 (Conceptual Reference)",
    shortTitle: "Caldwell 73 Reference",
    category: "Conceptual Reference",
    instrumentSensor: "Hubble Space Telescope ACS / WFC",
    svsUrl: "https://svs.gsfc.nasa.gov/13786/",
    frames: [
      {
        id: "13786-1",
        label: "Caldwell 73 Wide Field",
        localSrc: "/nasa-frames/13786-1.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a010000/a013700/a013786/wide.jpg",
        caption: "Globular cluster NGC 1851 (Caldwell 73) wide astronomical field.",
        projection: "celestial-cluster",
      },
      {
        id: "13786-2",
        label: "NGC 1851 Cluster Core",
        localSrc: "/nasa-frames/13786-2.jpg",
        remoteUrl:
          "https://svs.gsfc.nasa.gov/vis/a010000/a013700/a013786/print.jpg",
        caption: "High-density stellar core used in NASA's original sonification reference.",
        projection: "celestial-cluster",
      },
    ],
    timeframe: "Reference Benchmark",
    scienceSummary:
      "NASA's landmark astronomical sonification mapping luminosity to volume, vertical coordinate to pitch, and horizontal sweep to stereo time.",
    climateStory:
      "Included as TERRA-SONIC's calibration reference—demonstrating NASA's coordinate-to-sound benchmark applied across Earth science datasets.",
    sonicSignature: "Pure scientific radar sweep demonstrating NASA's core coordinate rules",
    defaultScale: "scientificChromatic",
    defaultBpm: 84,
    accentColor: "#818cf8",
    unitLabel: "Luminosity (Normalized)",
    mappingRules: [
      {
        visualFeature: "Vertical Y Position",
        audioParameter: "Musical Pitch Frequency",
        description: "Higher features play higher notes; lower features play bass tones.",
      },
      {
        visualFeature: "Pixel Brightness",
        audioParameter: "Voice Amplitude / Volume",
        description: "Dense star clusters swell smoothly in loudness.",
      },
      {
        visualFeature: "Horizontal X Position",
        audioParameter: "Stereo Pan & Time Sweep",
        description: "Left-to-right scanline moves smoothly from left ear to right ear.",
      },
    ],
    stemDescriptions: {
      melody: "Pure Coordinate Sine Sweep",
      harmony: "Cluster Stellar Pad",
      rhythm: "Clock Calibration Pulse",
      texture: "Deep Space Dust Halo",
    },
  },
];

export const OFFICIAL_NASA_SUBMISSION_LINKS = [
  {
    label: "Earth Information Center (EIC) Content Database",
    url: "https://svs.gsfc.nasa.gov/gallery/earth-information-center/",
  },
  {
    label: "Data Sonification: Caldwell 73",
    url: "https://svs.gsfc.nasa.gov/13786/",
  },
  {
    label: "Change in Night Lights between 2012 and 2023 - EIC Version",
    url: "https://svs.gsfc.nasa.gov/5313/",
  },
  {
    label: "Global Sea Surface Currents and Temperature",
    url: "https://svs.gsfc.nasa.gov/3912/#media_group_349716",
  },
  {
    label: "GEOS Aerosols",
    url: "https://svs.gsfc.nasa.gov/5669/",
  },
  {
    label: "Air Quality Model Runs",
    url: "https://svs.gsfc.nasa.gov/5533/",
  },
  {
    label: "Perpetual Ocean 2: Western Boundary Currents",
    url: "https://svs.gsfc.nasa.gov/5425/",
  },
  {
    label: "DYAMOND Global Carbon Dioxide",
    url: "https://svs.gsfc.nasa.gov/5196/",
  },
  {
    label: "Lightning Events Detected from the ISS 2017-2023",
    url: "https://svs.gsfc.nasa.gov/5011/",
  },
  {
    label: "A 3D View of an Atmospheric River from an Earth System Model",
    url: "https://svs.gsfc.nasa.gov/4960/",
  },
  {
    label: "GEDI Forest Height",
    url: "https://svs.gsfc.nasa.gov/4950/",
  },
];
