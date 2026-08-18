/**
 * Solis Spaced Retrieval & Active Recall Engine (SM-2 / Solis Algorithm)
 * Deterministic interval scheduling, retention decay modeling, and cloze parsing.
 */

import { Flashcard, CardRating } from '../../types/learning';
import { getISODateString, addDays } from '../date';

export const MIN_EASE_FACTOR = 1.30;
export const DEFAULT_EASE_FACTOR = 2.50;
export const MAX_EASE_FACTOR = 3.00;

export interface CardNextSchedule {
  intervalDays: number;
  easeFactor: number;
  repetitionCount: number;
  nextReviewDate: string;
  lastReviewedAt: string;
}

/**
 * Calculates the next spaced repetition interval for a flashcard based on recall difficulty.
 */
export function calculateNextCardReview(
  card: Pick<Flashcard, 'intervalDays' | 'easeFactor' | 'repetitionCount'>,
  rating: CardRating,
  baseDate: Date = new Date()
): CardNextSchedule {
  let intervalDays = card.intervalDays || 1;
  let easeFactor = card.easeFactor || DEFAULT_EASE_FACTOR;
  let repetitionCount = card.repetitionCount || 0;

  switch (rating) {
    case 'again':
      intervalDays = 1;
      easeFactor = Math.max(MIN_EASE_FACTOR, Number((easeFactor - 0.20).toFixed(2)));
      repetitionCount = 0;
      break;

    case 'hard':
      intervalDays = Math.max(1, Math.round(intervalDays * 1.2));
      easeFactor = Math.max(MIN_EASE_FACTOR, Number((easeFactor - 0.15).toFixed(2)));
      repetitionCount += 1;
      break;

    case 'good':
      if (repetitionCount === 0) {
        intervalDays = 1;
      } else if (repetitionCount === 1) {
        intervalDays = 3;
      } else {
        intervalDays = Math.max(1, Math.round(intervalDays * easeFactor));
      }
      repetitionCount += 1;
      break;

    case 'easy':
      if (repetitionCount === 0) {
        intervalDays = 3;
      } else if (repetitionCount === 1) {
        intervalDays = 6;
      } else {
        intervalDays = Math.max(1, Math.round(intervalDays * easeFactor * 1.3));
      }
      easeFactor = Math.min(MAX_EASE_FACTOR, Number((easeFactor + 0.15).toFixed(2)));
      repetitionCount += 1;
      break;
  }

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
