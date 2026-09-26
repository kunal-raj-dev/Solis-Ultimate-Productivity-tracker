/**
 * Solis FSRS (Free Spaced Repetition Scheduler) Memory Engine — plan §4.1
 *
 * Implements the modern DSR memory model as a replacement for 1987 SM-2:
 * - Difficulty   D ∈ [1, 10]  (bounded — no "Ease Hell" collapse)
 * - Stability    S > 0        (days until recall probability decays to ~90%)
 * - Retrievability R ∈ [0, 1] (probability the material is still recallable)
 *
 * Retention probability (plan §4.1):
 *   R(t, S) = (1 + 0.19 · t / S) ^ -0.5
 *
 * Rating outcomes (`again`, `hard`, `good`, `easy`) update S and D predictably
 * through the documented FSRS update rules; every function here is pure and
 * deterministic (master.md §18: utils engines carry zero React state and no
 * DOM/network side effects).
 */

import { CardRating } from '../../types/learning';

// ── Forgetting curve constants (plan §4.1) ──────────────────────────────────

/** Decay exponent of the plan's power-law forgetting curve. */
export const FSRS_DECAY = -0.5;
/** Linear factor of the plan's power-law forgetting curve. */
export const FSRS_FACTOR = 0.19;
/** Default probability target when converting stability into an interval. */
export const DEFAULT_REQUEST_RETENTION = 0.9;

// ── Memory state bounds ──────────────────────────────────────────────────────

export const MIN_DIFFICULTY = 1;
export const MAX_DIFFICULTY = 10;
/** Stability floor (days) — keeps every update well-defined. */
export const MIN_STABILITY = 0.01;

/**
 * FSRS-5 default weight vector w0…w18 (open-spaced-repetition defaults):
 * w0–w3 initial stability per rating; w4–w5 initial difficulty; w6 difficulty
 * step; w7 difficulty mean reversion; w8–w10 successful-recall growth;
 * w11–w14 post-lapse stability; w15 hard penalty; w16 easy bonus;
 * w17–w18 same-day (short-term) learning steps.
 */
export const FSRS_WEIGHTS: readonly number[] = [
  0.40255, 1.18385, 3.173, 15.69105,
  7.1949, 0.5345,
  1.4604, 0.0046,
  1.54575, 0.1192, 1.01925,
  1.9395, 0.11, 0.29605, 2.2698,
  0.2315, 2.9898,
  0.51655, 0.6621
];

// ── SM-2 persistence anchors (backward-compatibility, plan §4.1) ─────────────
// The Flashcard record keeps its SM-2-shaped columns (master.md §13), so the
// FSRS engine defines the canonical encoding between FSRS memory state and the
// persisted `easeFactor` / `intervalDays` fields.

export const MIN_EASE_FACTOR = 1.30;
export const DEFAULT_EASE_FACTOR = 2.50;
export const MAX_EASE_FACTOR = 3.00;
/** Neutral ease ↔ neutral difficulty anchor (ease 2.5 ≡ D 5.5). */
const DIFFICULTY_AT_DEFAULT_EASE = 5.5;

const RATING_INDEX: Record<CardRating, 1 | 2 | 3 | 4> = {
  again: 1,
  hard: 2,
  good: 3,
  easy: 4
};

export interface FsrsMemoryState {
  /** S > 0 — memory stability in days. On the plan's curve R(S, S) ≈ 0.917; the requested-retention interval is computeIntervalForRetention(S) ≈ 1.235·S. */
  stability: number;
  /** D ∈ [1, 10] — bounded item difficulty. */
  difficulty: number;
}

function clamp(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

// ── Forgetting curve ─────────────────────────────────────────────────────────

/**
 * Days at which retrievability decays to `requestRetention`, expressed as a
 * multiple of stability: interval = S · (r^(1/DECAY) − 1) / FACTOR.
 */
export function computeIntervalPerStability(requestRetention: number = DEFAULT_REQUEST_RETENTION): number {
  const r = clamp(requestRetention, 0.5, 0.99);
  return (Math.pow(r, 1 / FSRS_DECAY) - 1) / FSRS_FACTOR;
}

/**
 * Retrievability R(t, S) = (1 + 0.19 · t / S)^-0.5 (plan §4.1).
 * Perfectly re-encountered material (t = 0) returns exactly 1.
 */
export function computeRetrievability(stability: number, elapsedDays: number): number {
  if (stability <= 0) return 0;
  const t = Math.max(0, elapsedDays);
  const r = Math.pow(1 + FSRS_FACTOR * (t / stability), FSRS_DECAY);
  return clamp(r, 0, 1);
}

/**
 * Interval (days, float) that decays to `requestRetention` for the given
 * stability. Round-trip inverse of `stabilityFromSM2Interval`.
 */
export function computeIntervalForRetention(
  stability: number,
  requestRetention: number = DEFAULT_REQUEST_RETENTION
): number {
  return Math.max(0, stability * computeIntervalPerStability(requestRetention));
}

// ── Backward-compatible SM-2 ↔ FSRS state mapping (plan §4.1) ────────────────

/**
 * Decodes the persisted SM-2 `intervalDays` into an FSRS stability: an SM-2
 * interval is treated as the spacing the learner historically cleared, i.e.
 * the elapsed time at which recall succeeded ≈ the 90% retention point.
 */
export function stabilityFromSM2Interval(
  intervalDays: number,
  requestRetention: number = DEFAULT_REQUEST_RETENTION
): number {
  const interval = Math.max(1, intervalDays || 1);
  return Math.max(MIN_STABILITY, interval / computeIntervalPerStability(requestRetention));
}

/**
 * Encodes an FSRS stability back into the persisted `intervalDays` scale.
 * Round-trip inverse of `stabilityFromSM2Interval`.
 */
export function sm2IntervalFromStability(
  stability: number,
  requestRetention: number = DEFAULT_REQUEST_RETENTION
): number {
  return computeIntervalForRetention(stability, requestRetention);
}

/**
 * Decodes the persisted SM-2 `easeFactor` into an FSRS difficulty D ∈ [1, 10].
 * The mapping is linear and anchored at the SM-2 default: ease 2.5 ↔ D 5.5.
 * Higher ease = easier material = lower difficulty, so Ease-Hell victims
 * (ease pinned at the 1.3 floor) enter FSRS as maximally difficult items and
 * can recover — instead of being trapped by a collapsing multiplier.
 */
export function difficultyFromEaseFactor(easeFactor: number): number {
  const ease = clamp(
    Number.isFinite(easeFactor) ? easeFactor : DEFAULT_EASE_FACTOR,
    MIN_EASE_FACTOR,
    MAX_EASE_FACTOR
  );
  const easeSpan = MAX_EASE_FACTOR - MIN_EASE_FACTOR;
  const difficulty =
    DIFFICULTY_AT_DEFAULT_EASE - (ease - DEFAULT_EASE_FACTOR) * ((MAX_DIFFICULTY - MIN_DIFFICULTY) / easeSpan);
  return clamp(difficulty, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

/**
 * Encodes an FSRS difficulty back into the persisted `easeFactor` field.
 * Round-trip inverse of `difficultyFromEaseFactor` (within the ease clamps).
 */
export function easeFactorFromDifficulty(difficulty: number): number {
  const d = clamp(difficulty, MIN_DIFFICULTY, MAX_DIFFICULTY);
  const easeSpan = MAX_EASE_FACTOR - MIN_EASE_FACTOR;
  const ease = DEFAULT_EASE_FACTOR + (DIFFICULTY_AT_DEFAULT_EASE - d) * (easeSpan / (MAX_DIFFICULTY - MIN_DIFFICULTY));
  return Number(clamp(ease, MIN_EASE_FACTOR, MAX_EASE_FACTOR).toFixed(4));
}

// ── FSRS update rules ────────────────────────────────────────────────────────

function initialDifficulty(ratingIndex: number): number {
  const w = FSRS_WEIGHTS;
  return clamp(w[4] - Math.exp(w[5] * (ratingIndex - 1)) + 1, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

/** Bounded difficulty update: linear damping + mean reversion (no Ease Hell). */
function updateDifficulty(difficulty: number, ratingIndex: number): number {
  const w = FSRS_WEIGHTS;
  const dampedRange = (MAX_DIFFICULTY - difficulty) / (MAX_DIFFICULTY - MIN_DIFFICULTY);
  const deltaD = -w[6] * (ratingIndex - 3);
  const damped = difficulty + deltaD * dampedRange;
  const reverted = w[7] * initialDifficulty(ratingIndex) + (1 - w[7]) * damped;
  return clamp(reverted, MIN_DIFFICULTY, MAX_DIFFICULTY);
}

/**
 * Memory state for a card's very first rating (no prior review history):
 * stability seeds from w[rating−1] and difficulty from the FSRS-5 D₀ curve.
 */
export function initialMemoryState(rating: CardRating): FsrsMemoryState {
  const g = RATING_INDEX[rating];
  return {
    stability: Math.max(MIN_STABILITY, FSRS_WEIGHTS[g - 1]),
    difficulty: initialDifficulty(g)
  };
}

/**
 * Applies one FSRS review to an existing memory state.
 *
 * - Same-day reviews (elapsedDays < 1) follow the FSRS-5 short-term learning
 *   steps so intra-session re-testing still moves stability.
 * - Lapses (`again`) use the post-lapse stability rule — a short but never
 *   punitive interval, without Ease-Hell collapse.
 * - Successful recall grows stability multiplicatively, modulated by the
 *   bounded difficulty and elapsed-time retrievability (the harder the
 *   successful retrieval, the bigger the jump).
 */
export function updateMemoryState(
  state: FsrsMemoryState,
  rating: CardRating,
  retrievability: number,
  elapsedDays: number
): FsrsMemoryState {
  const g = RATING_INDEX[rating];
  const w = FSRS_WEIGHTS;
  const S = Math.max(MIN_STABILITY, state.stability);
  const D = clamp(state.difficulty, MIN_DIFFICULTY, MAX_DIFFICULTY);
  const R = clamp(retrievability, 0, 1);

  // Short-term (same-day) learning steps.
  if (elapsedDays < 1) {
    const stability = Math.max(S * Math.exp(w[17] * (g - 3 + w[18])), MIN_STABILITY);
    return { stability, difficulty: updateDifficulty(D, g) };
  }

  if (g === 1) {
    // Post-lapse stability: relearning keeps the card queued soon, but the
    // interval derives from memory state instead of a fixed 1-day punishment.
    const stability =
      w[11] * Math.pow(D, -w[12]) * (Math.pow(S + 1, w[13]) - 1) * Math.exp(w[14] * (1 - R));
    return { stability: Math.max(MIN_STABILITY, stability), difficulty: updateDifficulty(D, g) };
  }

  // Successful recall (hard / good / easy).
  const growth =
    Math.exp(w[8]) * (11 - D) * Math.pow(S, -w[9]) * (Math.exp(w[10] * (1 - R)) - 1);
  const penalty = g === 2 ? w[15] : g === 4 ? w[16] : 1;
  const stability = S * (1 + penalty * growth);
  return { stability: Math.max(MIN_STABILITY, stability), difficulty: updateDifficulty(D, g) };
}
