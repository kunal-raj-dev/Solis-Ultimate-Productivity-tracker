import { useEffect } from 'react';

export type CircadianPhase = 'dawn' | 'noon' | 'twilight' | 'night';

export function getCircadianPhase(date: Date = new Date()): CircadianPhase {
  const hour = date.getHours();
  if (hour >= 6 && hour < 9) return 'dawn';
  if (hour >= 9 && hour < 17) return 'noon';
  if (hour >= 17 && hour < 20) return 'twilight';
  return 'night';
}

/**
 * useCircadianCanvas
 * Silently monitors the solar hour and updates the `data-circadian` attribute
 * on document.documentElement, enabling subtle biological lighting adaptation
 * without triggering React re-renders or layout shifts.
 */
export function useCircadianCanvas(): void {
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const updatePhase = () => {
      const phase = getCircadianPhase();
      const root = document.documentElement;
      if (root.getAttribute('data-circadian') !== phase) {
        root.setAttribute('data-circadian', phase);
      }
    };

    updatePhase();
    // Check every 5 minutes
    const interval = setInterval(updatePhase, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);
}
