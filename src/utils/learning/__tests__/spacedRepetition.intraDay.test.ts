import { describe, it, expect } from 'vitest';
import {
  calculateNextCardReview,
  MIN_EASE_FACTOR,
  ReviewSessionQueues
} from '../spacedRepetition';
import * as spacedRepetitionModule from '../spacedRepetition';

/**
 * Phase 0 — Intra-Day Spaced Repetition Re-Queue Harness (plan §0.1 / §1.4)
 *
 * Since plan §4.1 the scheduler behind `calculateNextCardReview` is the FSRS
 * DSR memory model (src/utils/learning/fsrsEngine.ts); the characterization
 * below pins the FSRS-backed contract that the session must respect:
 *
 *   - a failed card (`again`) resets repetitions and receives a short
 *     FSRS post-lapse interval (no Ease-Hell collapse);
 *   - difficulty/ease stay inside the persisted [1.30, 3.00] ease bounds;
 *   - an in-session pass (`good`) on a relearning card commits the final
 *     schedule through the FSRS short-term learning step (elapsed < 1 day).
 *
 * The intra-day re-queue tests reproduce audit §18.10 (Item #40): a card
 * rated `again` must never be ejected from the drill. They pin the Phase 1.4
 * canonical session-queue contract, which ships in
 * src/utils/learning/spacedRepetition.ts:
 *
 *   interface ReviewSessionQueues {
 *     activeQueue: string[];   // card ids not yet presented this session
 *     learningQueue: string[]; // cards rated `again`, in failure order (step 0)
 *   }
 *   requeueCardInSession(queues, cardId): ReviewSessionQueues
 *     - removes cardId from activeQueue and appends it to learningQueue;
 *     - the card always stays inside the session (never ejected).
 *   resolvePresentationOrder(queues, presentedSinceLastLearningCard): string[]
 *     - learning cards surface once activeQueue is exhausted OR once 5
 *       intervening cards have been presented; active cards come first
 *       otherwise; failure order (FIFO) is preserved.
 */

// Local-noon base dates keep date math timezone-safe.
const BASE_DATE = new Date('2026-09-26T12:00:00');

const makeCardState = (overrides: Partial<{ intervalDays: number; easeFactor: number; repetitionCount: number }> = {}) => ({
  intervalDays: 8,
  easeFactor: 2.5,
  repetitionCount: 4,
  ...overrides
});

describe('calculateNextCardReview — FSRS engine characterization (runs live)', () => {
  it('schedules a failed card with a short post-lapse interval and resets repetitions', () => {
    const result = calculateNextCardReview(makeCardState(), 'again', BASE_DATE);

    expect(result.repetitionCount).toBe(0);
    // FSRS post-lapse stability for (S ≈ 6.48, D ≈ 5.5, R ≈ 0.9) ≈ 1.64 days
    // → interval 2: short, but derived from memory state instead of a fixed
    // 1-day punishment.
    expect(result.intervalDays).toBe(2);
    expect(result.easeFactor).toBeCloseTo(2.2239, 3);
    expect(result.nextReviewDate).toBe('2026-09-28');
  });

  it('keeps the persisted ease encoding inside the SM-2 bounds on repeated failures', () => {
    const result = calculateNextCardReview(
      makeCardState({ easeFactor: 1.35 }),
      'again',
      BASE_DATE
    );

    expect(result.easeFactor).toBeGreaterThanOrEqual(MIN_EASE_FACTOR);
    expect(result.easeFactor).toBeLessThan(2.0); // difficulty rose, bounded — no runaway
    expect(result.intervalDays).toBeGreaterThanOrEqual(1);
  });

  it('commits the final schedule once the card passes in-session with good', () => {
    const failed = calculateNextCardReview(makeCardState(), 'again', BASE_DATE);
    // Production persists `lastReviewedAt` after the failed attempt, so the
    // in-session pass arrives as a relearning review with elapsed < 1 day.
    const passed = calculateNextCardReview(
      {
        intervalDays: failed.intervalDays,
        easeFactor: failed.easeFactor,
        repetitionCount: failed.repetitionCount,
        lastReviewedAt: BASE_DATE.toISOString()
      },
      'good',
      BASE_DATE
    );

    // FSRS-5 short-term learning step on the post-lapse state.
    expect(passed.repetitionCount).toBe(1);
    expect(passed.intervalDays).toBe(3);
    expect(passed.nextReviewDate).toBe('2026-09-29');
  });

  it('is deterministic for identical inputs (no hidden clock reads)', () => {
    const first = calculateNextCardReview(makeCardState(), 'good', BASE_DATE);
    const second = calculateNextCardReview(makeCardState(), 'good', BASE_DATE);

    expect(second).toEqual(first);
  });

  it('does not pin a 1-day card re-passed within 24 hours at a 1-day interval forever', () => {
    // Review-history card at interval 1 (S ≈ 0.81): a same-day pass grows
    // stability (× short-term step), so the persisted interval must round UP
    // instead of re-encoding the gain away.
    const first = calculateNextCardReview(
      { intervalDays: 1, easeFactor: 2.5, repetitionCount: 1, lastReviewedAt: BASE_DATE.toISOString() },
      'good',
      BASE_DATE
    );
    expect(first.intervalDays).toBe(2);

    // The next same-day pass keeps growing — the cycle is broken.
    const second = calculateNextCardReview(
      {
        intervalDays: first.intervalDays,
        easeFactor: first.easeFactor,
        repetitionCount: first.repetitionCount,
        lastReviewedAt: BASE_DATE.toISOString()
      },
      'good',
      BASE_DATE
    );
    expect(second.intervalDays).toBeGreaterThan(first.intervalDays);
  });
});

describe('intra-day re-queueing (Phase 1.4 contract, live)', () => {
  // Every test in this block exercises the canonical session-queue helpers
  // pinned in the header.

  it('UNSKIP in Phase 1.4: a card rated again re-queues into the learning queue instead of being ejected', () => {
    const queues: ReviewSessionQueues = {
      activeQueue: ['card_1', 'card_2', 'card_3', 'card_4', 'card_5'],
      learningQueue: []
    };

    const next = spacedRepetitionModule.requeueCardInSession(queues, 'card_1');

    expect(next.learningQueue).toContain('card_1');
    expect(next.activeQueue).toEqual(['card_2', 'card_3', 'card_4', 'card_5']);
  });

  it('UNSKIP in Phase 1.4: failed cards are presented once the active queue is exhausted', () => {
    const queues: ReviewSessionQueues = {
      activeQueue: [],
      learningQueue: ['card_1']
    };

    const order = spacedRepetitionModule.resolvePresentationOrder(queues, 0);

    expect(order[0]).toBe('card_1');
  });

  it('UNSKIP in Phase 1.4: failed cards surface after 5 intervening cards, not before', () => {
    const queues: ReviewSessionQueues = {
      activeQueue: ['card_2', 'card_3', 'card_4', 'card_5', 'card_6'],
      learningQueue: ['card_1']
    };

    const earlyOrder = spacedRepetitionModule.resolvePresentationOrder(queues, 2);
    expect(earlyOrder[0]).toBe('card_2');

    const afterFive = spacedRepetitionModule.resolvePresentationOrder(queues, 5);
    expect(afterFive[0]).toBe('card_1');
  });

  it('UNSKIP in Phase 1.4: multiple failed cards keep failure order (FIFO)', () => {
    let queues: ReviewSessionQueues = {
      activeQueue: ['card_1', 'card_2', 'card_3', 'card_4'],
      learningQueue: []
    };

    queues = spacedRepetitionModule.requeueCardInSession(queues, 'card_2');
    queues = spacedRepetitionModule.requeueCardInSession(queues, 'card_4');

    expect(queues.learningQueue).toEqual(['card_2', 'card_4']);
  });

  it('UNSKIP in Phase 1.4: failing a re-presented card again keeps it queued in the session', () => {
    const queues: ReviewSessionQueues = {
      activeQueue: ['card_2', 'card_3'],
      learningQueue: ['card_1']
    };

    const next = spacedRepetitionModule.requeueCardInSession(queues, 'card_1');

    expect(next.learningQueue).toContain('card_1');
    expect(next.activeQueue).toEqual(['card_2', 'card_3']);
  });
});
