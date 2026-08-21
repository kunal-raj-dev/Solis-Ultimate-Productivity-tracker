/**
 * Solis Learning Intelligence — Topic Mastery Evaluation Engine
 * 
 * Computes evidence-derived mastery states (NOT_ASSESSED, EMERGING, DEVELOPING, STABLE, STRONG)
 * and generates human-readable "Why?" explanations grounded strictly in verifiable data.
 */

import { ID } from '../../types/common';
import {
  TopicLearningHistory,
  TopicMasteryEvaluation,
  EvaluatedMasteryState
} from '../../types/learningIntelligence';
import { evaluateEvidenceFeatures } from './sufficiencyModel';
import { LEARNING_HEURISTICS_CONFIG } from './config';

const { MASTERY } = LEARNING_HEURISTICS_CONFIG;

/**
 * Evaluates mastery state and human-readable explanations for a single topic.
 */
export function evaluateTopicMastery(
  history: TopicLearningHistory
): TopicMasteryEvaluation {
  const {
    topicId,
    topicTitle,
    subjectId,
    subjectName,
    totalSessionsCount,
    totalStudyMinutes,
    averageRetentionRating,
    latestRetentionRating,
    totalRecallAttempts,
    recallAccuracyRate,
    daysSinceLastStudied
  } = history;

  const features = evaluateEvidenceFeatures(history);
  const { sufficiency, confidence, isSpacedOverTime } = features;

  let state: EvaluatedMasteryState = 'NOT_ASSESSED';
  let summary = '';
  let whyExplanation = '';

  // --------------------------------------------------------------------------
  // Rule 1: No Verifiable Data -> NOT_ASSESSED
  // --------------------------------------------------------------------------
  if (sufficiency === 'NO_DATA') {
    state = 'NOT_ASSESSED';
    summary = 'Not enough evidence yet.';
    whyExplanation = 'No study sessions, flashcards, or active recall drills have been recorded for this topic.';
  }
  // --------------------------------------------------------------------------
  // Rule 2: Minimal Data (1 session or 1-2 recall trials) -> EMERGING
  // --------------------------------------------------------------------------
  else if (sufficiency === 'MINIMAL_DATA') {
    state = 'EMERGING';
    summary = 'Initial study exposure recorded.';
    whyExplanation = totalSessionsCount === 1
      ? `Completed 1 session (${totalStudyMinutes} min). Additional sessions and retrieval practice are needed to consolidate understanding.`
      : `Initial active recall trials recorded (${totalRecallAttempts} attempts). Continue regular practice to establish a reliable baseline.`;
  }
  // --------------------------------------------------------------------------
  // Rule 3: Sufficient Data -> Evaluate STRONG vs STABLE vs DEVELOPING
  // --------------------------------------------------------------------------
  else {
    const hasHighRetention = averageRetentionRating !== null && averageRetentionRating >= MASTERY.STRONG_MIN_RETENTION;
    const hasSolidRetention = averageRetentionRating !== null && averageRetentionRating >= MASTERY.STABLE_MIN_RETENTION;
    const hasHighRecall = recallAccuracyRate !== null && recallAccuracyRate >= MASTERY.STRONG_MIN_RECALL_ACCURACY;
    const hasSolidRecall = recallAccuracyRate !== null && recallAccuracyRate >= MASTERY.STABLE_MIN_RECALL_ACCURACY;

    // Check for STRONG: High exposure, high retention/recall, and temporal spacing
    if (
      totalStudyMinutes >= MASTERY.STRONG_MIN_MINUTES &&
      totalSessionsCount >= MASTERY.STRONG_MIN_SESSIONS &&
      (hasHighRetention || hasHighRecall) &&
      isSpacedOverTime
    ) {
      state = 'STRONG';
      summary = 'High mastery with consistent retrieval performance.';
      whyExplanation = `Demonstrated across ${totalSessionsCount} sessions (${totalStudyMinutes} min)${
        recallAccuracyRate !== null ? ` and ${Math.round(recallAccuracyRate * 100)}% recall accuracy` : ''
      }${averageRetentionRating !== null ? ` with an average retention rating of ${averageRetentionRating}/5` : ''}.`;
    }
    // Check for STABLE: Solid exposure and steady retention/recall
    else if (
      totalStudyMinutes >= MASTERY.STABLE_MIN_MINUTES &&
      (hasSolidRetention || hasSolidRecall || (latestRetentionRating !== null && latestRetentionRating >= 4))
    ) {
      state = 'STABLE';
      summary = 'Consistent understanding with solid retention.';
      whyExplanation = `Supported by ${totalSessionsCount} study sessions (${totalStudyMinutes} min)${
        averageRetentionRating !== null ? ` and ${averageRetentionRating}/5 average retention` : ''
      }${recallAccuracyRate !== null ? ` (${Math.round(recallAccuracyRate * 100)}% recall accuracy)` : ''}.`;
    }
    // Otherwise -> DEVELOPING
    else {
      state = 'DEVELOPING';
      summary = 'Active study in progress; recall consolidation recommended.';
      whyExplanation = `Recorded ${totalSessionsCount} sessions (${totalStudyMinutes} min)${
        averageRetentionRating !== null ? ` with ${averageRetentionRating}/5 retention` : ''
      }. Regular active recall drills will help strengthen retention.`;
    }
  }

  // Generate granular evidence factors
  const studyExposure = totalSessionsCount > 0
    ? `${totalSessionsCount} session${totalSessionsCount > 1 ? 's' : ''} (${totalStudyMinutes} min)`
    : 'No sessions logged';

  const retentionScore = averageRetentionRating !== null
    ? `${averageRetentionRating}/5 avg (${totalSessionsCount} ratings)`
    : 'Not self-assessed';

  const recallPerformance = totalRecallAttempts > 0
    ? `${Math.round((recallAccuracyRate || 0) * 100)}% accuracy (${totalRecallAttempts} attempts)`
    : 'No flashcard drills yet';

  const recencySignal = daysSinceLastStudied !== null
    ? `Last studied ${daysSinceLastStudied === 0 ? 'today' : `${daysSinceLastStudied}d ago`}`
    : 'Never studied';

  return {
    topicId,
    topicTitle,
    subjectId,
    subjectName,
    state,
    sufficiency,
    confidence,
    summary,
    whyExplanation,
    evidenceFactors: {
      studyExposure,
      retentionScore,
      recallPerformance,
      recencySignal
    }
  };
}

/**
 * Batch evaluates mastery for all topic histories.
 */
export function evaluateAllTopicMastery(
  histories: Map<ID, TopicLearningHistory>
): Map<ID, TopicMasteryEvaluation> {
  const result = new Map<ID, TopicMasteryEvaluation>();
  for (const [id, history] of histories.entries()) {
    result.set(id, evaluateTopicMastery(history));
  }
  return result;
}
