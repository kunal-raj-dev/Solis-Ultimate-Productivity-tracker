/**
 * Solis Learning Intelligence — Evidence Sufficiency & Quality Confidence Model
 * 
 * Strict separation between:
 *  1. Data Sufficiency: "Can we evaluate anything at all based on volume?"
 *  2. Evidence Quality Confidence: "How strongly should we trust that evaluation based on temporal spacing and consistency?"
 */

import {
  TopicLearningHistory,
  TopicEvidenceFeatures,
  EvidenceSufficiencyTier,
  EvidenceQualityConfidence
} from '../../types/learningIntelligence';
import { LEARNING_HEURISTICS_CONFIG } from './config';

const { SUFFICIENCY, CONFIDENCE } = LEARNING_HEURISTICS_CONFIG;

/**
 * Extracts evidence features and evaluates sufficiency and confidence for a topic.
 */
export function evaluateEvidenceFeatures(
  history: TopicLearningHistory
): TopicEvidenceFeatures {
  const {
    totalSessionsCount,
    totalStudyMinutes,
    totalRecallAttempts,
    flashcardsCount,
    firstSeenAt,
    lastStudiedAt,
    averageRetentionRating
  } = history;

  const studyVolumeHours = Number((totalStudyMinutes / 60).toFixed(1));

  // 1. Calculate Temporal Spread (Days between first engagement and latest engagement)
  let temporalSpreadDays = 0;
  if (firstSeenAt && lastStudiedAt) {
    const firstTime = new Date(firstSeenAt).getTime();
    const lastTime = new Date(lastStudiedAt).getTime();
    temporalSpreadDays = Math.max(0, Math.floor((lastTime - firstTime) / (1000 * 60 * 60 * 24)));
  }

  const isSpacedOverTime = temporalSpreadDays >= CONFIDENCE.MIN_SPACED_DAYS;

  // 2. Evaluate Data Sufficiency (Volume / Quantity of telemetry)
  let sufficiency: EvidenceSufficiencyTier = 'NO_DATA';

  if (totalSessionsCount === 0 && totalRecallAttempts === 0 && flashcardsCount === 0) {
    sufficiency = 'NO_DATA';
  } else if (
    totalSessionsCount >= SUFFICIENCY.HIGH_DATA_SESSIONS ||
    totalRecallAttempts >= SUFFICIENCY.HIGH_DATA_REVIEWS
  ) {
    sufficiency = 'HIGH_DATA';
  } else if (
    totalSessionsCount >= SUFFICIENCY.SUFFICIENT_SESSIONS ||
    totalRecallAttempts >= SUFFICIENCY.SUFFICIENT_REVIEWS
  ) {
    sufficiency = 'SUFFICIENT_DATA';
  } else {
    sufficiency = 'MINIMAL_DATA';
  }

  // 3. Evaluate Evidence Quality Confidence (Spacing, consistency, stability)
  let confidence: EvidenceQualityConfidence = 'LOW';

  if (sufficiency === 'NO_DATA' || sufficiency === 'MINIMAL_DATA') {
    confidence = 'LOW';
  } else if (sufficiency === 'HIGH_DATA') {
    // Check if high data is genuinely spaced over time or clustered
    if (isSpacedOverTime && totalRecallAttempts >= CONFIDENCE.MIN_RECALL_ATTEMPTS_FOR_CONFIDENCE) {
      confidence = 'HIGH';
    } else if (isSpacedOverTime && totalSessionsCount >= CONFIDENCE.MIN_SESSIONS_FOR_CONFIDENCE) {
      confidence = 'HIGH';
    } else {
      confidence = 'MEDIUM';
    }
  } else if (sufficiency === 'SUFFICIENT_DATA') {
    if (isSpacedOverTime) {
      confidence = 'MEDIUM';
    } else {
      confidence = 'LOW'; // Clustered in same day
    }
  }

  // Retention consistency heuristic (1.0 = solid, lower if average rating is low/volatile)
  const retentionConsistency = averageRetentionRating !== null
    ? Math.min(1.0, averageRetentionRating / 4.0)
    : 0.5;

  return {
    sufficiency,
    confidence,
    temporalSpreadDays,
    isSpacedOverTime,
    retentionConsistency,
    recallVolume: totalRecallAttempts,
    studyVolumeHours
  };
}
