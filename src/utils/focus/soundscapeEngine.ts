import { SoundscapeType } from '../../types/focus';

export interface SoundscapePreset {
  id: SoundscapeType;
  label: string;
  description: string;
  category: 'noise' | 'binaural' | 'nature' | 'drone';
}

export const SOUNDSCAPE_PRESETS: SoundscapePreset[] = [
  {
    id: 'pink_noise',
    label: 'Pink Noise',
    description: 'Balanced frequency distribution for sustained high cognitive endurance.',
    category: 'noise'
  },
  {
    id: 'brown_noise',
    label: 'Brownian Noise',
    description: 'Deep, warm rumble that masks distracting ambient sound.',
    category: 'noise'
  },
  {
    id: 'binaural_alpha',
    label: 'Alpha Waves (10 Hz)',
    description: 'Binaural flow frequency encouraging relaxed, active alertness.',
    category: 'binaural'
  },
  {
    id: 'binaural_theta',
    label: 'Theta Waves (6 Hz)',
    description: 'Deep contemplation frequency for conceptual breakthrough.',
    category: 'binaural'
  },
  {
    id: 'rain',
    label: 'Rainfall Simulation',
    description: 'Organic stochastic patter for calming rhythmic focus.',
    category: 'nature'
  },
  {
    id: 'deep_drone',
    label: 'Deep Harmonic Drone',
    description: 'Resonant sub-harmonic drone for grounding intense study sprints.',
    category: 'drone'
  }
];

class SyntheticSoundscapeEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: (AudioNode | number)[] = [];
  private currentType: SoundscapeType = 'none';
  private currentVolume = 0.5; // 0.0 to 1.0

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      try {
        this.ctx = new AudioCtx();
      } catch {
        return null;
      }
    }

    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    return this.ctx;
  }

  public setSoundscape(type: SoundscapeType, volume = this.currentVolume): void {
    this.stop();
    this.currentType = type;
    this.currentVolume = Math.max(0, Math.min(1, volume));

    if (type === 'none') return;

    const ctx = this.getAudioContext();
    if (!ctx) return;

    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.currentVolume * 0.35, ctx.currentTime);
    this.masterGain.connect(ctx.destination);

    switch (type) {
      case 'pink_noise':
        this.generatePinkNoise(ctx, this.masterGain);
        break;
      case 'brown_noise':
        this.generateBrownNoise(ctx, this.masterGain);
        break;
      case 'binaural_alpha':
        this.generateBinauralBeats(ctx, this.masterGain, 200, 210);
        break;
      case 'binaural_theta':
        this.generateBinauralBeats(ctx, this.masterGain, 200, 206);
        break;
      case 'rain':
        this.generateRainfall(ctx, this.masterGain);
        break;
      case 'deep_drone':
        this.generateDeepDrone(ctx, this.masterGain);
        break;
    }
  }

  public setVolume(volume: number): void {
    this.currentVolume = Math.max(0, Math.min(1, volume));
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setValueAtTime(this.currentVolume * 0.35, this.ctx.currentTime);
    }
  }

  public stop(): void {
    this.activeNodes.forEach((node) => {
      if (typeof node === 'number') {
        clearInterval(node);
      } else {
        try {
          if ('stop' in node && typeof (node as AudioScheduledSourceNode).stop === 'function') {
            (node as AudioScheduledSourceNode).stop();
          }
          node.disconnect();
        } catch {
          // Node already disconnected or stopped
        }
      }
    });

    this.activeNodes = [];
    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {}
      this.masterGain = null;
    }
    this.currentType = 'none';
  }

  public getCurrentSoundscape(): SoundscapeType {
    return this.currentType;
  }

  public getCurrentVolume(): number {
    return this.currentVolume;
  }

  // --- Synthesis Generators ---

  private generatePinkNoise(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      b0 = 0.99886 * b0 + white * 0.0555179;
      b1 = 0.99332 * b1 + white * 0.0750759;
      b2 = 0.96900 * b2 + white * 0.1538520;
      b3 = 0.86650 * b3 + white * 0.3104856;
      b4 = 0.55000 * b4 + white * 0.5329522;
      b5 = -0.7616 * b5 - white * 0.0168980;
      data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
      b6 = white * 0.115926;
    }

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    noiseSource.connect(destination);
    noiseSource.start();
    this.activeNodes.push(noiseSource);
  }

  private generateBrownNoise(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      data[i] = (lastOut + 0.02 * white) / 1.02;
      lastOut = data[i];
      data[i] *= 3.5; // Gain compensation
    }

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(400, ctx.currentTime);

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    noiseSource.connect(filter);
    filter.connect(destination);
    noiseSource.start();

    this.activeNodes.push(noiseSource, filter);
  }

  private generateBinauralBeats(ctx: AudioContext, destination: GainNode, leftFreq: number, rightFreq: number): void {
    const merger = ctx.createChannelMerger(2);

    // Left Ear Oscillator
    const oscLeft = ctx.createOscillator();
    oscLeft.type = 'sine';
    oscLeft.frequency.setValueAtTime(leftFreq, ctx.currentTime);

    const gainLeft = ctx.createGain();
    gainLeft.gain.setValueAtTime(0.5, ctx.currentTime);
    oscLeft.connect(gainLeft);
    gainLeft.connect(merger, 0, 0); // Connect to Left channel

    // Right Ear Oscillator
    const oscRight = ctx.createOscillator();
    oscRight.type = 'sine';
    oscRight.frequency.setValueAtTime(rightFreq, ctx.currentTime);

    const gainRight = ctx.createGain();
    gainRight.gain.setValueAtTime(0.5, ctx.currentTime);
    oscRight.connect(gainRight);
    gainRight.connect(merger, 0, 1); // Connect to Right channel

    // Soft carrier pink bed for comfortable listening
    const pinkGain = ctx.createGain();
    pinkGain.gain.setValueAtTime(0.1, ctx.currentTime);
    this.generatePinkNoise(ctx, pinkGain);
    pinkGain.connect(destination);

    merger.connect(destination);
    oscLeft.start();
    oscRight.start();

    this.activeNodes.push(oscLeft, oscRight, gainLeft, gainRight, merger, pinkGain);
  }

  private generateRainfall(ctx: AudioContext, destination: GainNode): void {
    const bufferSize = ctx.sampleRate * 2;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const filter = ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(1000, ctx.currentTime);
    filter.Q.setValueAtTime(0.8, ctx.currentTime);

    const noiseSource = ctx.createBufferSource();
    noiseSource.buffer = buffer;
    noiseSource.loop = true;
    noiseSource.connect(filter);
    filter.connect(destination);
    noiseSource.start();

    this.activeNodes.push(noiseSource, filter);
  }

  private generateDeepDrone(ctx: AudioContext, destination: GainNode): void {
    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(55, ctx.currentTime); // A1

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(110, ctx.currentTime); // A2

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, ctx.currentTime);

    const lfo = ctx.createOscillator();
    lfo.type = 'sine';
    lfo.frequency.setValueAtTime(0.2, ctx.currentTime); // Slow 5s cycle

    const lfoGain = ctx.createGain();
    lfoGain.gain.setValueAtTime(40, ctx.currentTime);
    lfo.connect(lfoGain);
    lfoGain.connect(filter.frequency);

    osc1.connect(filter);
    osc2.connect(filter);
    filter.connect(destination);

    osc1.start();
    osc2.start();
    lfo.start();

    this.activeNodes.push(osc1, osc2, lfo, lfoGain, filter);
  }
}

export const soundscapeEngine = new SyntheticSoundscapeEngine();
