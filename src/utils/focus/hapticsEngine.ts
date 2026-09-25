/**
 * Solis Web Audio Micro-Haptics Engine
 * Provides subtle, physical acoustic feedback for task completion, focus milestones,
 * and key state changes without loading external audio files.
 */

import type { NotificationChimeType } from '../../types/notification';

class MicroHapticsEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('solis_haptics_muted');
        this.isMuted = saved === 'true';
      } catch {
        this.isMuted = false;
      }
    }
  }

  private getContext(): AudioContext | null {
    if (typeof window === 'undefined' || this.isMuted) return null;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return null;
        this.ctx = new AudioCtx();
      }
      if (this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean): void {
    this.isMuted = muted;
    try {
      localStorage.setItem('solis_haptics_muted', String(muted));
    } catch {}
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Mechanical Shutter Tick
   * 15ms high-damped 850Hz sine burst imitating a tactile shutter click.
   * Triggered on task/habit completion.
   */
  public playMechanicalTick(volume: number = 0.08): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(850, now);
      osc.frequency.exponentialRampToValueAtTime(320, now + 0.015);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.015);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.016);
    } catch {}
  }

  /**
   * Soft Resonant Bell (528 Hz Harmonic)
   * 1.6s harmonic decaying chime triggered when focus timer finishes.
   */
  public playResonantBell(volume: number = 0.12): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const fundamental = 528; // Hz Solfeggio frequency
      const harmonics = [1, 2, 3];
      const harmonicGains = [1, 0.4, 0.15];

      harmonics.forEach((h, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(fundamental * h, now);

        const initialGain = volume * harmonicGains[i];
        gain.gain.setValueAtTime(initialGain, now);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.6);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 1.6);
      });
    } catch {}
  }

  /**
   * Gentle Notification Chime (Web Audio, zero external assets)
   * Single canonical chime synthesis for notification fallbacks
   * (absorbed from the retired src/utils/notifications.ts duplicate audio path).
   * 'start' = ascending fifth for block starts, 'transition' = reflective
   * single tone for hour reviews, 'chime' = soft default tone.
   */
  public playNotificationChime(type: NotificationChimeType = 'chime'): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      if (type === 'start') {
        // Ascending gentle fifth (440Hz -> 660Hz)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(660, now + 0.35);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.2, now + 0.05);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.7);
      } else if (type === 'transition') {
        // Reflective double-tone (523Hz C5)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(523.25, now);
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.06);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.2);
      } else {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(587.33, now); // D5
        gain.gain.setValueAtTime(0.001, now);
        gain.gain.linearRampToValueAtTime(0.18, now + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.6);
      }

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now);
      osc.stop(now + 1.3);
    } catch {
      // AudioContext blocked or not allowed yet
    }
  }

  /**
   * Subtle Wood Tap
   * 25ms low-pass filtered click for tab transitions or mode toggles.
   */
  public playWoodTap(volume: number = 0.05): void {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const filter = ctx.createBiquadFilter();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(240, now);
      osc.frequency.exponentialRampToValueAtTime(80, now + 0.025);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(600, now);

      gain.gain.setValueAtTime(volume, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.025);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.026);
    } catch {}
  }
}

export const hapticsEngine = new MicroHapticsEngine();
