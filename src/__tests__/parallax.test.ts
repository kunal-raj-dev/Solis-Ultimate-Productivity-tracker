import { describe, it, expect } from 'vitest';

describe('Design System 2.0 — Motion & Parallax Geometry', () => {
  it('clamps parallax offset correctly within safe pixel boundaries', () => {
    const calculateOffset = (progress: number, speed: number, maxOffsetPx = 40) => {
      const raw = progress * speed * 100;
      return Math.max(-maxOffsetPx, Math.min(maxOffsetPx, raw));
    };

    // At center (0)
    expect(calculateOffset(0, 0.05)).toBe(0);

    // At positive scroll progress
    expect(calculateOffset(0.5, 0.05)).toBe(2.5);

    // Damped at max boundaries
    expect(calculateOffset(2.0, 0.5, 40)).toBe(40);
    expect(calculateOffset(-2.0, 0.5, 40)).toBe(-40);
  });

  it('verifies depth levels consistency', () => {
    const depthLevels = {
      canvas: 0,
      surface: 1,
      floating: 2,
      atmosphere: 3,
      foreground: 4
    };

    expect(depthLevels.canvas).toBeLessThan(depthLevels.surface);
    expect(depthLevels.surface).toBeLessThan(depthLevels.floating);
    expect(depthLevels.floating).toBeLessThan(depthLevels.atmosphere);
    expect(depthLevels.atmosphere).toBeLessThan(depthLevels.foreground);
  });
});
