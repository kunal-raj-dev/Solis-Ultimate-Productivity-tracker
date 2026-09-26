import { describe, it, expect } from 'vitest';
import {
  buildMicroSteps,
  isMicroStepEligible,
  MICRO_STEP_COUNT,
  MICRO_STEP_MAX_MINUTES
} from '../taskMicroStepper';

/**
 * Plan §5.4: Task Micro-Stepping Assistant heuristic contract.
 * Tasks estimated at ≥ 60 minutes decompose into exactly 3 deterministic
 * sub-tasks, each suggesting < 20 minutes of effort.
 */
describe('isMicroStepEligible', () => {
  it('accepts tasks estimated at 60 minutes or more', () => {
    expect(isMicroStepEligible(60)).toBe(true);
    expect(isMicroStepEligible(90)).toBe(true);
    expect(isMicroStepEligible(240)).toBe(true);
  });

  it('rejects short tasks and missing estimates', () => {
    expect(isMicroStepEligible(59)).toBe(false);
    expect(isMicroStepEligible(25)).toBe(false);
    expect(isMicroStepEligible(undefined)).toBe(false);
    expect(isMicroStepEligible(0)).toBe(false);
  });
});

describe('buildMicroSteps heuristic', () => {
  it('returns exactly 3 steps, each under 20 minutes, for eligible tasks', () => {
    for (const minutes of [60, 61, 90, 120, 180, 300]) {
      const steps = buildMicroSteps('Solve 15 organic chemistry problems', minutes);
      expect(steps).toHaveLength(MICRO_STEP_COUNT);
      for (const step of steps) {
        expect(step.suggestedMinutes).toBeLessThan(20);
        expect(step.suggestedMinutes).toBeGreaterThanOrEqual(5);
        expect(step.title.length).toBeGreaterThan(0);
      }
    }
  });

  it('returns an empty array for tasks below the eligibility bar', () => {
    expect(buildMicroSteps('Quick review', 45)).toEqual([]);
    expect(buildMicroSteps('Quick review')).toEqual([]);
  });

  it('is deterministic — same input, same output', () => {
    const a = buildMicroSteps('Write thesis literature review', 120);
    const b = buildMicroSteps('Write thesis literature review', 120);
    expect(a).toEqual(b);
  });

  it('anchors each step to the task title', () => {
    const steps = buildMicroSteps('Master Fourier transforms', 90);
    expect(steps.every((s) => s.title.includes('Master Fourier transforms'))).toBe(true);
    // The three steps follow the warm-up → core → wrap-up arc.
    expect(steps[0].title.startsWith('Warm-up:')).toBe(true);
    expect(steps[1].title.startsWith('Core push:')).toBe(true);
    expect(steps[2].title.startsWith('Wrap-up:')).toBe(true);
  });

  it('clamps very long task titles to keep step titles readable', () => {
    const longTitle = 'A'.repeat(200);
    const steps = buildMicroSteps(longTitle, 120);
    expect(steps.every((s) => s.title.length < 120)).toBe(true);
  });

  it('never reaches the 20-minute ceiling even for huge tasks', () => {
    const steps = buildMicroSteps('Full syllabus sweep', 600);
    expect(Math.max(...steps.map((s) => s.suggestedMinutes))).toBeLessThanOrEqual(MICRO_STEP_MAX_MINUTES);
    expect(MICRO_STEP_MAX_MINUTES).toBeLessThan(20);
  });
});
