import { TEAMX_INFO } from "./nasa-datasets";
import type { CVFrameMetrics, NASADataset, ScaleType, StemId, StemsMap } from "./types";

const SCALE_SEMITONES: Record<ScaleType, number[]> = {
  pentatonic: [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24],
  lydian: [0, 2, 4, 6, 7, 9, 11, 12, 14, 16, 18, 19],
  dorian: [0, 2, 3, 5, 7, 9, 10, 12, 14, 15, 17, 19],
  harmonicMinor: [0, 2, 3, 5, 7, 8, 11, 12, 14, 15, 17, 19],
  scientificChromatic: [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16, 19],
};

function midiToFreq(midi: number): number {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

function encodeWavFromFloat32(
  left: Float32Array,
  right: Float32Array,
  sampleRate: number
): Blob {
  const length = left.length;
  const numChannels = 2;
  const bytesPerSample = 2;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const buffer = new ArrayBuffer(44 + dataSize);
  const view = new DataView(buffer);

  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  writeString(0, "RIFF");
  view.setUint32(4, 36 + dataSize, true);
  writeString(8, "WAVE");
  writeString(12, "fmt ");
  view.setUint32(16, 16, true); // PCM chunk size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, 16, true);
  writeString(36, "data");
  view.setUint32(40, dataSize, true);

  let offset = 44;
  for (let i = 0; i < length; i++) {
    const l = Math.max(-1, Math.min(1, left[i]));
    const r = Math.max(-1, Math.min(1, right[i]));
    view.setInt16(offset, l < 0 ? l * 0x8000 : l * 0x7fff, true);
    view.setInt16(offset + 2, r < 0 ? r * 0x8000 : r * 0x7fff, true);
    offset += 4;
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export class EarthSoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private analyser: AnalyserNode | null = null;

  private stemGains: Record<StemId, GainNode> | null = null;
  private leadOsc: OscillatorNode | null = null;
  private leadGain: GainNode | null = null;
  private leadPan: StereoPannerNode | null = null;

  private padOscs: OscillatorNode[] = [];
  private padFilter: BiquadFilterNode | null = null;
  private padGain: GainNode | null = null;

  private textureGain: GainNode | null = null;
  private textureFilter: BiquadFilterNode | null = null;

  private isInitialized = false;
  private isPlaying = false;
  private lastRhythmTime = 0;
  private lastTransientTime = 0;

  // PCM WAV Recording buffers
  private recordingNode: ScriptProcessorNode | null = null;
  private isRecording = false;
  private recordedLeft: Float32Array[] = [];
  private recordedRight: Float32Array[] = [];
  private recordedSamples = 0;

  public init(): void {
    if (this.isInitialized && this.ctx) {
      if (this.ctx.state === "suspended") {
        void this.ctx.resume();
      }
      return;
    }

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext })
        .webkitAudioContext;

    const ctx = new AudioCtx();
    this.ctx = ctx;

    const compressor = ctx.createDynamicsCompressor();
    compressor.threshold.value = -16;
    compressor.knee.value = 18;
    compressor.ratio.value = 4;
    compressor.attack.value = 0.01;
    compressor.release.value = 0.2;

    const masterGain = ctx.createGain();
    masterGain.gain.value = 0.72;

    const analyser = ctx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.82;

    masterGain.connect(compressor);
    compressor.connect(analyser);
    analyser.connect(ctx.destination);

    // 4 Stems
    const melodyGain = ctx.createGain();
    const harmonyGain = ctx.createGain();
    const rhythmGain = ctx.createGain();
    const textureGainNode = ctx.createGain();

    melodyGain.connect(masterGain);
    harmonyGain.connect(masterGain);
    rhythmGain.connect(masterGain);
    textureGainNode.connect(masterGain);

    this.stemGains = {
      melody: melodyGain,
      harmony: harmonyGain,
      rhythm: rhythmGain,
      texture: textureGainNode,
    };

    // Lead Voice
    const leadOsc = ctx.createOscillator();
    leadOsc.type = "triangle";
    leadOsc.frequency.value = 261.63;
    const leadGain = ctx.createGain();
    leadGain.gain.value = 0.0;
    const leadPan = ctx.createStereoPanner();
    leadOsc.connect(leadGain);
    leadGain.connect(leadPan);
    leadPan.connect(melodyGain);
    leadOsc.start();

    this.leadOsc = leadOsc;
    this.leadGain = leadGain;
    this.leadPan = leadPan;

    // 3-Voice Harmonic Pad
    const padFilter = ctx.createBiquadFilter();
    padFilter.type = "lowpass";
    padFilter.frequency.value = 850;
    padFilter.Q.value = 1.4;
    const padGain = ctx.createGain();
    padGain.gain.value = 0.0;
    padFilter.connect(padGain);
    padGain.connect(harmonyGain);

    const baseFreqs = [130.81, 196.0, 261.63];
    this.padOscs = baseFreqs.map((f, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 1 ? "sawtooth" : "sine";
      osc.frequency.value = f;
      const voiceGain = ctx.createGain();
      voiceGain.gain.value = idx === 1 ? 0.16 : 0.38;
      osc.connect(voiceGain);
      voiceGain.connect(padFilter);
      osc.start();
      return osc;
    });

    this.padFilter = padFilter;
    this.padGain = padGain;

    // Atmospheric Wind / Ocean Noise Texture
    const bufferSize = ctx.sampleRate * 2;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      output[i] = Math.random() * 2 - 1;
    }
    const noiseSrc = ctx.createBufferSource();
    noiseSrc.buffer = noiseBuffer;
    noiseSrc.loop = true;

    const textureFilter = ctx.createBiquadFilter();
    textureFilter.type = "bandpass";
    textureFilter.frequency.value = 420;
    textureFilter.Q.value = 1.8;

    const textureGain = ctx.createGain();
    textureGain.gain.value = 0.0;

    noiseSrc.connect(textureFilter);
    textureFilter.connect(textureGain);
    textureGain.connect(textureGainNode);
    noiseSrc.start();

    this.textureFilter = textureFilter;
    this.textureGain = textureGain;

    // PCM Recorder Tap
    const recorder = ctx.createScriptProcessor(2048, 2, 2);
    recorder.onaudioprocess = (e) => {
      if (!this.isRecording) return;
      const left = e.inputBuffer.getChannelData(0);
      const right = e.inputBuffer.getChannelData(1);
      this.recordedLeft.push(new Float32Array(left));
      this.recordedRight.push(new Float32Array(right));
      this.recordedSamples += left.length;
    };
    analyser.connect(recorder);
    // Connect silently to destination so ScriptProcessor fires without doubling output
    const silentGain = ctx.createGain();
    silentGain.gain.value = 0;
    recorder.connect(silentGain);
    silentGain.connect(ctx.destination);
    this.recordingNode = recorder;

    this.compressor = compressor;
    this.masterGain = masterGain;
    this.analyser = analyser;
    this.isInitialized = true;
  }

  public startPlayback(): void {
    this.init();
    this.isPlaying = true;
    if (this.ctx && this.ctx.state === "suspended") {
      void this.ctx.resume();
    }
  }

  public stopPlayback(): void {
    this.isPlaying = false;
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.leadGain?.gain.setTargetAtTime(0, now, 0.06);
    this.padGain?.gain.setTargetAtTime(0, now, 0.12);
    this.textureGain?.gain.setTargetAtTime(0, now, 0.12);
  }

  public setMasterVolume(volume: number): void {
    if (!this.ctx || !this.masterGain) return;
    this.masterGain.gain.setTargetAtTime(
      Math.max(0, Math.min(1, volume)),
      this.ctx.currentTime,
      0.04
    );
  }

  public applyStemMix(stems: StemsMap): void {
    if (!this.ctx || !this.stemGains) return;
    const anySolo = Object.values(stems).some((s) => s.solo);
    const now = this.ctx.currentTime;
    (Object.keys(stems) as StemId[]).forEach((id) => {
      const st = stems[id];
      const active = anySolo ? st.solo : !st.muted;
      this.stemGains?.[id].gain.setTargetAtTime(
        active ? st.gain : 0,
        now,
        0.04
      );
    });
  }

  public updateFromMetrics(
    metrics: CVFrameMetrics,
    dataset: NASADataset,
    scale: ScaleType,
    bpm: number
  ): void {
    if (!this.isPlaying || !this.ctx || !this.isInitialized) return;

    const now = this.ctx.currentTime;
    const intervals = SCALE_SEMITONES[scale];
    const baseMidi = dataset.id === "sea-currents-temp" ? 48 : 55;

    // 1. Lead Voice (Luminance + Elevation -> Quantized Pitch)
    const idx = Math.min(
      intervals.length - 1,
      Math.floor((metrics.luminance * 0.55 + metrics.spatialElevation * 0.45) * intervals.length)
    );
    const leadFreq = midiToFreq(baseMidi + intervals[idx]);
    this.leadOsc?.frequency.setTargetAtTime(leadFreq, now, 0.045);
    this.leadGain?.gain.setTargetAtTime(
      0.06 + metrics.luminance * 0.24,
      now,
      0.05
    );
    this.leadPan?.pan.setTargetAtTime(metrics.spatialPan, now, 0.05);

    // 2. Harmonic Pad (Warmth -> Filter Cutoff & Triad Voicing)
    const rootMidi = baseMidi - 12 + (intervals[Math.floor(metrics.redMean * 4)] ?? 0);
    const thirdMidi = rootMidi + (intervals[2] ?? 4);
    const fifthMidi = rootMidi + (intervals[4] ?? 7);
    if (this.padOscs.length >= 3) {
      this.padOscs[0].frequency.setTargetAtTime(midiToFreq(rootMidi), now, 0.15);
      this.padOscs[1].frequency.setTargetAtTime(midiToFreq(thirdMidi), now, 0.15);
      this.padOscs[2].frequency.setTargetAtTime(midiToFreq(fifthMidi), now, 0.15);
    }
    const warmthCutoff =
      320 + metrics.redMean * 1800 + metrics.luminance * 600;
    this.padFilter?.frequency.setTargetAtTime(warmthCutoff, now, 0.1);
    this.padGain?.gain.setTargetAtTime(
      0.1 + metrics.pixelDensity * 0.2,
      now,
      0.1
    );

    // 3. Atmospheric Noise Texture
    this.textureFilter?.frequency.setTargetAtTime(
      240 + metrics.blueMean * 950 + metrics.contrastEnergy * 500,
      now,
      0.12
    );
    this.textureGain?.gain.setTargetAtTime(
      0.02 + metrics.contrastEnergy * 0.11,
      now,
      0.1
    );

    // 4. Rhythm Stem (Density-Driven Arpeggiated Pulse)
    const stepSeconds = Math.max(0.11, 60 / (bpm * (1 + metrics.pixelDensity)));
    if (now - this.lastRhythmTime >= stepSeconds && metrics.pixelDensity > 0.08) {
      this.lastRhythmTime = now;
      this.triggerPulseNote(
        midiToFreq(
          baseMidi +
            12 +
            intervals[Math.floor(metrics.contrastEnergy * (intervals.length - 1))]
        ),
        metrics.spatialPan,
        0.06 + metrics.pixelDensity * 0.12,
        dataset.id === "geos-aerosols" ? "triangle" : "sine"
      );
    }

    // 5. Transient Spark Chimes (Lightning / Urban Peaks)
    if (metrics.transientSpike > 0.35 && now - this.lastTransientTime > 0.14) {
      this.lastTransientTime = now;
      this.triggerPulseNote(
        midiToFreq(baseMidi + 24 + (intervals[Math.floor(Math.random() * 5)] ?? 7)),
        metrics.spatialPan,
        0.18,
        "sine",
        0.22
      );
    }
  }

  private triggerPulseNote(
    freq: number,
    panValue: number,
    peakGain: number,
    type: OscillatorType = "sine",
    decay = 0.16
  ): void {
    if (!this.ctx || !this.stemGains) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, now);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(Math.max(0.01, peakGain), now + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, now + decay);

    const pan = this.ctx.createStereoPanner();
    pan.pan.setValueAtTime(Math.max(-1, Math.min(1, panValue)), now);

    osc.connect(g);
    g.connect(pan);
    pan.connect(this.stemGains.rhythm);
    osc.start(now);
    osc.stop(now + decay + 0.03);
  }

  public triggerTactileProbe(
    normalizedX: number,
    normalizedY: number,
    intensity: number,
    scale: ScaleType,
    gainScale = 1
  ): string {
    this.init();
    if (!this.ctx || !this.stemGains) return "C4";
    if (this.ctx.state === "suspended") void this.ctx.resume();

    const intervals = SCALE_SEMITONES[scale];
    const combined = Math.max(
      0,
      Math.min(0.99, (1 - normalizedY) * 0.6 + intensity * 0.4)
    );
    const idx = Math.floor(combined * intervals.length);
    const midi = 54 + intervals[idx];
    const freq = midiToFreq(midi);
    const pan = Math.max(-1, Math.min(1, normalizedX * 2 - 1));

    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    osc.type = "triangle";
    osc.frequency.setValueAtTime(freq, now);

    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0.001, now);
    g.gain.exponentialRampToValueAtTime(
      Math.max(0.02, (0.18 + intensity * 0.15) * gainScale),
      now + 0.02
    );
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.42 * gainScale);

    const panner = this.ctx.createStereoPanner();
    panner.pan.setValueAtTime(pan, now);

    osc.connect(g);
    g.connect(panner);
    panner.connect(this.stemGains.melody);
    osc.start(now);
    osc.stop(now + 0.45);

    const noteNames = [
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
    ];
    return `${noteNames[midi % 12]}${Math.floor(midi / 12) - 1}`;
  }

  public getSpectrumData(target: Uint8Array<ArrayBuffer>): void {
    if (!this.analyser) return;
    this.analyser.getByteFrequencyData(target);
  }

  public getWaveformData(target: Uint8Array<ArrayBuffer>): void {
    if (!this.analyser) return;
    this.analyser.getByteTimeDomainData(target);
  }

  public startRecording(): void {
    this.init();
    this.recordedLeft = [];
    this.recordedRight = [];
    this.recordedSamples = 0;
    this.isRecording = true;
  }

  public stopRecordingAndExportWav(dataset: NASADataset): {
    wavBlob: Blob;
    metadataJson: string;
    durationSeconds: number;
  } | null {
    this.isRecording = false;
    if (!this.ctx || this.recordedSamples === 0) return null;

    const mergedLeft = new Float32Array(this.recordedSamples);
    const mergedRight = new Float32Array(this.recordedSamples);
    let offset = 0;
    for (let i = 0; i < this.recordedLeft.length; i++) {
      mergedLeft.set(this.recordedLeft[i], offset);
      mergedRight.set(this.recordedRight[i], offset);
      offset += this.recordedLeft[i].length;
    }

    const wavBlob = encodeWavFromFloat32(
      mergedLeft,
      mergedRight,
      this.ctx.sampleRate
    );

    const metadata = {
      project: TEAMX_INFO.projectName,
      team: TEAMX_INFO.teamName,
      members: TEAMX_INFO.members.map((m) => m.name),
      nasaSourceTitle: dataset.title,
      nasaSvsId: dataset.svsId,
      nasaSvsUrl: dataset.svsUrl,
      sonificationMethod: "Real-Time Computer Vision Pixel Extraction + 4-Stem Web Audio Synthesis",
      superIntelligenceDisclosure: TEAMX_INFO.siDisclosure,
      generatedAt: new Date().toISOString(),
      sampleRate: this.ctx.sampleRate,
      durationSeconds: Number((this.recordedSamples / this.ctx.sampleRate).toFixed(2)),
    };

    return {
      wavBlob,
      metadataJson: JSON.stringify(metadata, null, 2),
      durationSeconds: metadata.durationSeconds,
    };
  }

  public dispose(): void {
    this.stopPlayback();
    if (this.recordingNode) {
      this.recordingNode.disconnect();
    }
    if (this.ctx) {
      void this.ctx.close();
    }
    this.isInitialized = false;
  }
}
