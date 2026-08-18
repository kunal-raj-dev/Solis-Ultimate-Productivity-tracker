/**
 * Solis - Focus Timer Engine & Audio Suite
 * Timestamp-based elapsed calculation resilient to tab backgrounding and throttling.
 */

export interface TimerEngineState {
  status: 'idle' | 'running' | 'paused' | 'completed' | 'cancelled';
  totalDurationSeconds: number;
  remainingSeconds: number;
  targetEndTimeMs: number | null;
  pausedRemainingMs: number | null;
}

export function calculateTimerRemaining(
  targetEndTimeMs: number | null,
  pausedRemainingMs: number | null,
  status: 'idle' | 'running' | 'paused' | 'completed' | 'cancelled',
  totalDurationSeconds: number
): number {
  if (status === 'idle') {
    return totalDurationSeconds;
  }

  if (status === 'paused') {
    return pausedRemainingMs !== null
      ? Math.max(0, Math.ceil(pausedRemainingMs / 1000))
      : totalDurationSeconds;
  }

  if (status === 'completed' || status === 'cancelled') {
    return 0;
  }

  if (status === 'running' && targetEndTimeMs !== null) {
    const now = Date.now();
    const remainingMs = targetEndTimeMs - now;
    return Math.max(0, Math.ceil(remainingMs / 1000));
  }

  return totalDurationSeconds;
}

/**
 * Synthesizes a tranquil acoustic singing bowl / chime using Web Audio API.
 * Zero external audio assets required.
 */
export function playFocusCompletionChime(): void {
  try {
    if (typeof window === 'undefined') return;
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;

    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // Harmonic frequencies for calm singing bowl resonance (528Hz Solfeggio Love frequency & overtone)
    const fundamentalFreq = 528;
    const overtoneFreq = 1056;

    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gainNode = ctx.createGain();

    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(fundamentalFreq, now);

    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(overtoneFreq, now);

    // Smooth exponential decay envelope
    gainNode.gain.setValueAtTime(0.001, now);
    gainNode.gain.exponentialRampToValueAtTime(0.3, now + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);

    osc1.connect(gainNode);
    osc2.connect(gainNode);
    gainNode.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);

    osc1.stop(now + 2.5);
    osc2.stop(now + 2.5);
  } catch (err) {
    console.warn('Could not play audio chime:', err);
  }
}
