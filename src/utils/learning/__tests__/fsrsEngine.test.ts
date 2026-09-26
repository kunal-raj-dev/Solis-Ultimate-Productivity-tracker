import { describe, it, expect } from 'vitest';
import { CardRating } from '../../../types/learning';
import {
  DEFAULT_REQUEST_RETENTION,
  FSRS_DECAY,
  FSRS_FACTOR,
  FSRS_WEIGHTS,
  MAX_DIFFICULTY,
  MAX_EASE_FACTOR,
  MIN_DIFFICULTY,
  MIN_EASE_FACTOR,
  MIN_STABILITY,
  computeIntervalForRetention,
  computeIntervalPerStability,
  computeRetrievability,
  difficultyFromEaseFactor,
  easeFactorFromDifficulty,
  initialMemoryState,
  sm2IntervalFromStability,
  stabilityFromSM2Interval,
  updateMemoryState
} from '../fsrsEngine';

/**
 * Phase 4.1 — FSRS (Free Spaced Repetition Scheduler) engine harness (plan §4.1).
 *
 * The FSRS engine is the canonical memory model; these tests verify the plan's
 * retention formula R(t, S) = (1 + 0.19·t/S)^-0.5, the bounded DSR update
 * rules (no Ease Hell), the backward-compatible SM-2 → FSRS state mapping,
 * and the headline gate: interval growth over 50 consecutive reviews without
 * collapse.
 */

const reviewAtDue = (
  state: { stability: number; difficulty: number },
  rating: CardRating
) => {
  // Reviewing exactly when due: elapsed = the interval at 90% retention,
  // so retrievability is exactly the request retention.
  const elapsed = computeIntervalForRetention(state.stability);
  const retrievability = computeRetrievability(state.stability, elapsed);
  return updateMemoryState(state, rating, retrievability, elapsed);
};

describe('retention probability formula (plan §4.1)', () => {
  it('implements R(t, S) = (1 + 0.19·t/S)^-0.5 exactly', () => {
    const stability = 6.5;
    expect(computeRetrievability(stability, 0)).toBe(1);
    expect(computeRetrievability(stability, 4)).toBeCloseTo(
      Math.pow(1 + FSRS_FACTOR * (4 / stability), FSRS_DECAY),
      12
    );
  });

  it('decays monotonically and never leaves [0, 1]', () => {
    const stability = 3;
    let previous = 1;
    for (let days = 0; days <= 60; days += 1) {
      const r = computeRetrievability(stability, days);
      expect(r).toBeGreaterThanOrEqual(0);
      expect(r).toBeLessThanOrEqual(1);
      expect(r).toBeLessThanOrEqual(previous);
      previous = r;
    }
  });

  it('the scheduled interval is exactly the point where R reaches the request retention', () => {
    const stability = 12;
    const interval = computeIntervalForRetention(stability, DEFAULT_REQUEST_RETENTION);
    expect(computeRetrievability(stability, interval)).toBeCloseTo(DEFAULT_REQUEST_RETENTION, 10);
  });

  it('interval ↔ stability conversion constants are consistent', () => {
    const perStability = computeIntervalPerStability();
    expect(perStability).toBeCloseTo((Math.pow(DEFAULT_REQUEST_RETENTION, 1 / FSRS_DECAY) - 1) / FSRS_FACTOR, 12);
    expect(computeIntervalForRetention(7)).toBeCloseTo(7 * perStability, 12);
  });
});

describe('backward-compatible SM-2 → FSRS state mapping (plan §4.1)', () => {
  it('maps the persisted SM-2 interval to 90%-retention stability', () => {
    expect(stabilityFromSM2Interval(10)).toBeCloseTo(10 / computeIntervalPerStability(), 10);
    expect(sm2IntervalFromStability(stabilityFromSM2Interval(10))).toBeCloseTo(10, 10);
  });

  it('anchors the SM-2 default ease 2.5 at neutral difficulty 5.5', () => {
    expect(difficultyFromEaseFactor(2.5)).toBeCloseTo(5.5, 10);
    expect(easeFactorFromDifficulty(5.5)).toBeCloseTo(2.5, 4);
  });

  it('maps Ease-Hell victims to hard items and strong ease to easy items, bounded', () => {
    expect(difficultyFromEaseFactor(1.3)).toBe(MAX_DIFFICULTY);
    expect(difficultyFromEaseFactor(3.0)).toBeCloseTo(2.8529, 3);
    expect(difficultyFromEaseFactor(2.0)).toBeGreaterThan(difficultyFromEaseFactor(2.8));
  });

  it('keeps ease encoding inside the SM-2 persistence bounds and round-trips', () => {
    for (let d = MIN_DIFFICULTY; d <= MAX_DIFFICULTY; d += 0.5) {
      const ease = easeFactorFromDifficulty(d);
      expect(ease).toBeGreaterThanOrEqual(MIN_EASE_FACTOR);
      expect(ease).toBeLessThanOrEqual(MAX_EASE_FACTOR);
      const decoded = difficultyFromEaseFactor(ease);
      // Exact round-trip inside the non-clamped ease band, fixed-point at the edges.
      expect(decoded).toBeCloseTo(Math.max(2.8529, Math.min(MAX_DIFFICULTY, d)), 1);
    }
  });
});

describe('FSRS update rules', () => {
  it('seeds a new card from the FSRS-5 initial weights', () => {
    const good = initialMemoryState('good');
    expect(good.stability).toBeCloseTo(FSRS_WEIGHTS[2], 10);
    expect(good.difficulty).toBeCloseTo(FSRS_WEIGHTS[4] - Math.exp(FSRS_WEIGHTS[5] * 2) + 1, 10);

    const again = initialMemoryState('again');
    expect(again.stability).toBeCloseTo(FSRS_WEIGHTS[0], 10);
  });

  it('successful recall grows stability; easy grows more than good, hard less', () => {
    const base = initialMemoryState('good');
    const hard = reviewAtDue(base, 'hard');
    const good = reviewAtDue(base, 'good');
    const easy = reviewAtDue(base, 'easy');

    expect(hard.stability).toBeGreaterThan(base.stability);
    expect(good.stability).toBeGreaterThan(hard.stability);
    expect(easy.stability).toBeGreaterThan(good.stability);
  });

  it('a lapse shortens stability but never collapses to zero (no Ease Hell)', () => {
    const mature = { stability: 21, difficulty: 5.5 };
    const afterLapse = reviewAtDue(mature, 'again');

    expect(afterLapse.stability).toBeLessThan(mature.stability);
    expect(afterLapse.stability).toBeGreaterThanOrEqual(MIN_STABILITY);

    const relapse = reviewAtDue(afterLapse, 'again');
    expect(relapse.stability).toBeGreaterThanOrEqual(MIN_STABILITY);
    expect(computeIntervalForRetention(relapse.stability)).toBeGreaterThanOrEqual(1);
  });

  it('keeps difficulty inside [1, 10] under any rating storm', () => {
    let state = initialMemoryState('good');
    const storm: CardRating[] = ['easy', 'easy', 'again', 'hard', 'again', 'good', 'easy', 'again'];
    for (const rating of storm) {
      state = reviewAtDue(state, rating);
      expect(state.difficulty).toBeGreaterThanOrEqual(MIN_DIFFICULTY);
      expect(state.difficulty).toBeLessThanOrEqual(MAX_DIFFICULTY);
      expect(Number.isFinite(state.stability)).toBe(true);
      expect(state.stability).toBeGreaterThan(0);
    }
  });

  it('is deterministic for identical inputs', () => {
    const base = initialMemoryState('good');
    const elapsed = computeIntervalForRetention(base.stability);
    const r = computeRetrievability(base.stability, elapsed);
    const first = updateMemoryState(base, 'good', r, elapsed);
    const second = updateMemoryState(base, 'good', r, elapsed);
    expect(second).toEqual(first);
  });
});

describe('verification gate — 50 consecutive reviews without Ease Hell (plan §4.1)', () => {
  it('grows the interval monotonically over 50 consecutive good reviews', () => {
    let state = initialMemoryState('good');
    let previousInterval = 0;
    const intervals: number[] = [];

    for (let i = 0; i < 50; i += 1) {
      const interval = computeIntervalForRetention(state.stability);
      intervals.push(interval);
      expect(Number.isFinite(interval)).toBe(true);
      expect(interval).toBeGreaterThan(previousInterval); // strict growth — no stall, no collapse
      previousInterval = interval;

      // Review exactly when due: R = 0.9, then apply the FSRS update.
      state = reviewAtDue(state, 'good');
      expect(state.difficulty).toBeGreaterThanOrEqual(MIN_DIFFICULTY);
      expect(state.difficulty).toBeLessThanOrEqual(MAX_DIFFICULTY);
      // The persisted ease encoding must never enter Ease-Hell territory.
      const ease = easeFactorFromDifficulty(state.difficulty);
      expect(ease).toBeGreaterThanOrEqual(MIN_EASE_FACTOR);
      expect(ease).toBeLessThanOrEqual(MAX_EASE_FACTOR);
    }

    expect(intervals[49]).toBeGreaterThan(intervals[0] * 10);
  });

  it('rebuilds stability quickly after a lapse among successful reviews', () => {
    let state = initialMemoryState('good');
    for (let i = 0; i < 6; i += 1) state = reviewAtDue(state, 'good');
    const preLapseInterval = computeIntervalForRetention(state.stability);

    state = reviewAtDue(state, 'again');
    const postLapseInterval = computeIntervalForRetention(state.stability);
    expect(postLapseInterval).toBeLessThan(preLapseInterval);

    // Successful reviews rebuild stability — never an Ease-Hell permanent 1-day trap.
    for (let i = 0; i < 3; i += 1) state = reviewAtDue(state, 'good');
    expect(computeIntervalForRetention(state.stability)).toBeGreaterThan(postLapseInterval * 10);
  });
});
