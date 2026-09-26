/**
 * Solis Spaced Retrieval & Active Recall Engine (FSRS / plan §4.1)
 *
 * Since Phase 4.1 the canonical scheduler is the FSRS DSR memory model
 * (src/utils/learning/fsrsEngine.ts). The Flashcard record keeps its
 * SM-2-shaped persistence fields (master.md §13), so every review decodes the
 * stored `easeFactor`/`intervalDays` into an FSRS (D, S) state through the
 * backward-compatibility mapper, advances the memory state with the rated
 * outcome, and encodes the result back — existing decks upgrade in place with
 * zero data migration.
 *
 * Also hosts intra-day re-queueing (plan §1.4), cloze parsing, and topic
 * review-need evaluation.
 */

import { Flashcard, CardRating } from '../../types/learning';
import { getISODateString, addDays } from '../date';
import {
  DEFAULT_REQUEST_RETENTION,
  FsrsMemoryState,
  computeIntervalForRetention,
  computeRetrievability,
  difficultyFromEaseFactor,
  easeFactorFromDifficulty,
  initialMemoryState,
  stabilityFromSM2Interval,
  updateMemoryState
} from './fsrsEngine';

export {
  MIN_EASE_FACTOR,
  DEFAULT_EASE_FACTOR,
  MAX_EASE_FACTOR,
  DEFAULT_REQUEST_RETENTION,
  computeIntervalForRetention,
  computeIntervalPerStability
} from './fsrsEngine';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Intra-day re-queueing (plan §1.4): after this many intervening cards have
 * been presented, a failed card waiting in the learning queue surfaces again
 * (short-term re-testing), even while the active queue is not yet exhausted.
 */
export const LEARNING_REPRESENTATION_INTERVAL = 5;

export interface CardNextSchedule {
  intervalDays: number;
  easeFactor: number;
  repetitionCount: number;
  nextReviewDate: string;
  lastReviewedAt: string;
}

/**
 * Two in-session review queues (plan §1.4):
 * - `activeQueue`: card ids not yet presented (or passed) this session.
 * - `learningQueue`: card ids rated `again`, kept in failure order (step 0).
 * A card rated `again` is NEVER ejected from the session — it waits in the
 * learning queue until it is successfully passed, and only then is the final
 * SM-2 schedule (tomorrow) committed.
 */
export interface ReviewSessionQueues {
  activeQueue: string[];
  learningQueue: string[];
}

/**
 * Moves a card into the learning queue: removes it from the active queue and
 * appends it to the end of the learning queue (FIFO failure order; re-failing
 * a learning card keeps it queued in the session).
 */
export function requeueCardInSession(
  queues: ReviewSessionQueues,
  cardId: string
): ReviewSessionQueues {
  return {
    activeQueue: queues.activeQueue.filter((id) => id !== cardId),
    learningQueue: [...queues.learningQueue.filter((id) => id !== cardId), cardId]
  };
}

/**
 * Resolves the next presentation order from the session queues:
 * - learning cards surface once the active queue is exhausted, OR once
 *   `presentedSinceLastLearningCard` intervening cards have been presented;
 * - otherwise active cards come first;
 * - failure order (FIFO) is always preserved.
 */
export function resolvePresentationOrder(
  queues: ReviewSessionQueues,
  presentedSinceLastLearningCard: number
): string[] {
  if (queues.learningQueue.length === 0) {
    return [...queues.activeQueue];
  }
  if (queues.activeQueue.length === 0) {
    return [...queues.learningQueue];
  }
  if (presentedSinceLastLearningCard >= LEARNING_REPRESENTATION_INTERVAL) {
    return [...queues.learningQueue, ...queues.activeQueue];
  }
  return [...queues.activeQueue, ...queues.learningQueue];
}

/**
 * Calculates the next spaced repetition schedule for a flashcard (FSRS, plan §4.1).
 *
 * The card's persisted SM-2-shaped state is decoded into FSRS memory:
 * - `intervalDays` → stability S (the interval is treated as the spacing the
 *   learner historically cleared, i.e. the 90% retention point);
 * - `easeFactor` → difficulty D (ease 2.5 ≡ D 5.5, linear and clamped);
 * - a card with `repetitionCount === 0` and no `lastReviewedAt` is brand new
 *   and receives the FSRS initial state for the rating;
 * - a card with review history advances through the FSRS update rules, using
 *   the elapsed days since `lastReviewedAt` to compute retrievability (legacy
 *   cards without a review timestamp are assumed to be reviewed when due).
 */
export function calculateNextCardReview(
  card: Pick<Flashcard, 'intervalDays' | 'easeFactor' | 'repetitionCount' | 'lastReviewedAt'>,
  rating: CardRating,
  baseDate: Date = new Date(),
  requestRetention: number = DEFAULT_REQUEST_RETENTION
): CardNextSchedule {
  const priorInterval = Math.max(1, card.intervalDays || 1);
  const hasReviewHistory = (card.repetitionCount || 0) > 0 || Boolean(card.lastReviewedAt);

  let memoryState: FsrsMemoryState;
  let priorStability = 0;
  if (hasReviewHistory) {
    priorStability = stabilityFromSM2Interval(priorInterval, requestRetention);
    let state: FsrsMemoryState = {
      stability: priorStability,
      difficulty: difficultyFromEaseFactor(card.easeFactor)
    };
    const elapsedDays = card.lastReviewedAt
      ? Math.max(0, (baseDate.getTime() - new Date(card.lastReviewedAt).getTime()) / DAY_MS)
      : priorInterval;
    const retrievability = computeRetrievability(state.stability, elapsedDays);
    state = updateMemoryState(state, rating, retrievability, elapsedDays);
    memoryState = state;
  } else {
    memoryState = initialMemoryState(rating);
  }

  const repetitionCount = rating === 'again' ? 0 : (card.repetitionCount || 0) + 1;
  const trueInterval = computeIntervalForRetention(memoryState.stability, requestRetention);
  let intervalDays = Math.max(1, Math.round(trueInterval));
  // The persisted integer interval re-seeds stability on the next review, so
  // when stability GREW but rounding would re-encode it to the same or a
  // smaller integer (pinning short-interval cards at 1 day forever), round up
  // instead — the next review re-derives stability from the larger interval.
  if (hasReviewHistory && intervalDays <= priorInterval && memoryState.stability > priorStability) {
    intervalDays = Math.max(1, Math.ceil(trueInterval));
  }
  const easeFactor = easeFactorFromDifficulty(memoryState.difficulty);

  const nextReviewDateObj = addDays(baseDate, intervalDays);
  const nextReviewDate = getISODateString(nextReviewDateObj);
  const lastReviewedAt = baseDate.toISOString();

  return {
    intervalDays,
    easeFactor,
    repetitionCount,
    nextReviewDate,
    lastReviewedAt
  };
}

/**
 * Parses Cloze deletion syntax (e.g., "The {{mitochondria}} is the powerhouse of the cell")
 * Produces prompt with blank placeholders and full answer.
 */
export function parseClozeSyntax(text: string): {
  promptText: string;
  extractedAnswers: string[];
  hasCloze: boolean;
} {
  const clozeRegex = /\{\{(.*?)\}\}/g;
  const matches = [...text.matchAll(clozeRegex)];

  if (matches.length === 0) {
    return {
      promptText: text,
      extractedAnswers: [],
      hasCloze: false
    };
  }

  const extractedAnswers = matches.map((m) => m[1].trim());
  const promptText = text.replace(clozeRegex, '[...]');

  return {
    promptText,
    extractedAnswers,
    hasCloze: true
  };
}

/**
 * Determines whether a study topic requires a spaced review drill
 * based on retention score history and days elapsed.
 */
export function evaluateTopicReviewNeed(
  lastStudyDateStr: string | undefined,
  lastRetentionRating: number = 3,
  currentDate: Date = new Date()
): {
  isDue: boolean;
  recommendedIntervalDays: number;
  reason: string;
} {
  if (!lastStudyDateStr) {
    return {
      isDue: true,
      recommendedIntervalDays: 1,
      reason: 'No recorded study session yet'
    };
  }

  const lastDate = new Date(lastStudyDateStr);
  const diffTime = Math.abs(currentDate.getTime() - lastDate.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  // Determine interval based on retention score (1 to 5)
  let targetIntervalDays = 3;
  if (lastRetentionRating >= 5) targetIntervalDays = 7;
  else if (lastRetentionRating === 4) targetIntervalDays = 5;
  else if (lastRetentionRating === 3) targetIntervalDays = 3;
  else if (lastRetentionRating === 2) targetIntervalDays = 2;
  else targetIntervalDays = 1;

  const isDue = diffDays >= targetIntervalDays;
  const reason = isDue
    ? `${diffDays} days elapsed since retention level ${lastRetentionRating}/5 session (Target: ${targetIntervalDays}d)`
    : `Retention steady (${diffDays}/${targetIntervalDays}d elapsed)`;

  return {
    isDue,
    recommendedIntervalDays: targetIntervalDays,
    reason
  };
}
