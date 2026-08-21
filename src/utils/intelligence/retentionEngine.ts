/**
 * Solis Learning Intelligence — Retention Health Signal Engine
 * 
 * Implements a single, deterministic retention timeline policy:
 *  - 0–3 days: FRESH (unless weak recall triggers intervention)
 *  - 4–7 days: DUE_FOR_REVIEW
 *  - 8–14 days: NEEDS_ATTENTION (or poor retention <= 2/5)
 *  - >14 days: OVERDUE
 *  - Unstudied: UNSTUDIED
 */

import { ID } from '../../types/common';
import {
  TopicLearningHistory,
  TopicRetentionSignal,
  RetentionHealthSignal
} from '../../types/learningIntelligence';
import { LEARNING_HEURISTICS_CONFIG } from './config';

const { RETENTION_POLICY } = LEARNING_HEURISTICS_CONFIG;

/**
 * Computes the deterministic retention health signal for a single topic.
 */
export function evaluateTopicRetention(
  history: TopicLearningHistory
): TopicRetentionSignal {
  const {
    topicId,
    topicTitle,
    subjectId,
    subjectName,
    daysSinceLastStudied,
    daysSinceLastReviewed,
    latestRetentionRating,
    totalSessionsCount,
    totalRecallAttempts,
    recallAccuracyRate
  } = history;

  // 1. Unstudied state
  if (totalSessionsCount === 0 && totalRecallAttempts === 0) {
    return {
      topicId,
      topicTitle,
      subjectId,
      subjectName,
      signal: 'UNSTUDIED',
      daysElapsed: null,
      recommendedAction: 'Start an initial 25-minute deep study session.',
      whyExplanation: 'No study history has been recorded yet for this topic.'
    };
  }

  // Determine effective elapsed days (minimum of study days and review days)
  const elapsedDays = Math.min(
    daysSinceLastStudied !== null ? daysSinceLastStudied : 999,
    daysSinceLastReviewed !== null ? daysSinceLastReviewed : 999
  );

  const days = elapsedDays === 999 ? (daysSinceLastStudied ?? 0) : elapsedDays;

  let signal: RetentionHealthSignal = 'FRESH';
  let recommendedAction = '';
  let whyExplanation = '';

  // 2. Immediate Quality Trigger: Low retention rating or failing recall rate
  const hasPoorRetention = latestRetentionRating !== null && latestRetentionRating <= RETENTION_POLICY.POOR_RETENTION_THRESHOLD;
  const hasFailingRecall = totalRecallAttempts >= 2 && recallAccuracyRate !== null && recallAccuracyRate < 0.50;

  if (hasPoorRetention || hasFailingRecall) {
    signal = 'NEEDS_ATTENTION';
    recommendedAction = 'Complete a 20-minute active recall retrieval drill.';
    whyExplanation = hasPoorRetention
      ? `Last self-assessed retention was low (${latestRetentionRating}/5). An immediate retrieval session is recommended to repair recall pathways.`
      : `Recent flashcard recall accuracy dropped to ${Math.round((recallAccuracyRate || 0) * 100)}%. Immediate retrieval drill suggested.`;
  }
  // 3. Temporal Policy: OVERDUE (> 14 days)
  else if (days >= RETENTION_POLICY.OVERDUE_MIN_DAYS) {
    signal = 'OVERDUE';
    recommendedAction = 'Schedule a 30-minute spaced retrieval and revision session.';
    whyExplanation = `Last engaged ${days} days ago. Long interval indicates significant neural decay risk.`;
  }
  // 4. Temporal Policy: NEEDS_ATTENTION (8–14 days)
  else if (days >= RETENTION_POLICY.NEEDS_ATTENTION_MIN_DAYS) {
    signal = 'NEEDS_ATTENTION';
    recommendedAction = 'Start a 20-minute retrieval practice.';
    whyExplanation = `Last studied ${days} days ago. Recall evidence is beginning to weaken.`;
  }
  // 5. Temporal Policy: DUE_FOR_REVIEW (4–7 days)
  else if (days >= RETENTION_POLICY.DUE_FOR_REVIEW_MIN_DAYS) {
    signal = 'DUE_FOR_REVIEW';
    recommendedAction = 'Run a quick 15-minute flashcard drill.';
    whyExplanation = `Last studied ${days} days ago. Perfect timing for spaced repetition to reinforce long-term memory.`;
  }
  // 6. Temporal Policy: FRESH (0–3 days)
  else {
    signal = 'FRESH';
    recommendedAction = 'Retention is currently steady.';
    whyExplanation = `Recently studied (${days === 0 ? 'today' : `${days}d ago`}) with solid retention. No immediate review needed.`;
  }

  return {
    topicId,
    topicTitle,
    subjectId,
    subjectName,
    signal,
    daysElapsed: days,
    recommendedAction,
    whyExplanation
  };
}

/**
 * Batch evaluates retention for all topic histories.
 */
export function evaluateAllTopicRetention(
  histories: Map<ID, TopicLearningHistory>
): Map<ID, TopicRetentionSignal> {
  const result = new Map<ID, TopicRetentionSignal>();
  for (const [id, history] of histories.entries()) {
    result.set(id, evaluateTopicRetention(history));
  }
  return result;
}
