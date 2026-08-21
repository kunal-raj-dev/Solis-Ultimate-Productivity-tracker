/**
 * Solis Learning Intelligence System — Type Definitions
 * Strict contracts for evidence-based topic mastery, retention signals, and explainable learning recommendations.
 */

import { ID } from './common';
import { TopicMasteryLevel } from './study';

// ============================================================================
// 1. TOPIC LEARNING HISTORY (Normalized Raw Event Aggregate)
// ============================================================================

export interface TopicLearningHistory {
  topicId: ID;
  topicTitle: string;
  subjectId: ID;
  subjectName: string;
  subjectColor: string;
  manualStatus: TopicMasteryLevel; // 'unstudied' | 'learning' | 'mastered' (user-set baseline)

  // Temporal boundaries
  firstSeenAt: string | null;
  lastStudiedAt: string | null;
  daysSinceLastStudied: number | null;
  lastReviewedAt: string | null;
  daysSinceLastReviewed: number | null;

  // Study sessions telemetry
  totalSessionsCount: number;
  totalStudyMinutes: number;
  averageRetentionRating: number | null; // 1.0 - 5.0 (self-assessed)
  latestRetentionRating: number | null;

  // Active recall & flashcards telemetry
  flashcardsCount: number;
  totalRecallAttempts: number;
  successfulRecallCount: number; // 'good' or 'easy' ratings
  failedRecallCount: number;     // 'again' or 'hard' ratings
  recallAccuracyRate: number | null; // 0.0 - 1.0 (ratio)
  averageEaseFactor: number | null;
  dueFlashcardsCount: number;

  // External memory & resources
  notesCount: number;
  resourcesCount: number;

  // Ambiguity / Resolution Status
  unresolvedEventCount: number; // sessions or notes with ambiguous topic matches
}

// ============================================================================
// 2. EVIDENCE FEATURES & SUFFICIENCY vs. CONFIDENCE
// ============================================================================

/**
 * Can we evaluate the topic at all? (Quantity / volume of evidence)
 */
export type EvidenceSufficiencyTier =
  | 'NO_DATA'          // 0 sessions, 0 flashcards, 0 reviews
  | 'MINIMAL_DATA'     // 1 session OR 1-2 flashcards without repeated review
  | 'SUFFICIENT_DATA'  // 2+ sessions OR 3+ review trials
  | 'HIGH_DATA';       // 4+ sessions OR 5+ active recall trials

/**
 * How strongly should we trust that evaluation? (Quality, temporal spread, spacing, consistency)
 */
export type EvidenceQualityConfidence =
  | 'LOW'    // Clustered in time (< 1 day spread), high volatility, or small sample
  | 'MEDIUM' // Spaced across multiple days, moderate consistency
  | 'HIGH';  // Spaced across multiple days/weeks, consistent retention & recall rate

export interface TopicEvidenceFeatures {
  sufficiency: EvidenceSufficiencyTier;
  confidence: EvidenceQualityConfidence;
  temporalSpreadDays: number;
  isSpacedOverTime: boolean;
  retentionConsistency: number; // 0.0 - 1.0 (low variance in ratings)
  recallVolume: number;
  studyVolumeHours: number;
}

// ============================================================================
// 3. EVALUATED MASTERY (Evidence-Derived State)
// ============================================================================

export type EvaluatedMasteryState =
  | 'NOT_ASSESSED' // Insufficient verifiable data exists
  | 'EMERGING'     // Initial exposure (1 session or new flashcards)
  | 'DEVELOPING'   // Ongoing study with mixed recall / moderate retention
  | 'STABLE'       // Consistent study, high recall accuracy, solid retention
  | 'STRONG';      // Spaced study over time, retention >= 4.5/5, recall rate >= 85%

export interface TopicMasteryEvaluation {
  topicId: ID;
  topicTitle: string;
  subjectId: ID;
  subjectName: string;
  state: EvaluatedMasteryState;
  sufficiency: EvidenceSufficiencyTier;
  confidence: EvidenceQualityConfidence;
  summary: string;
  whyExplanation: string;
  evidenceFactors: {
    studyExposure: string;
    retentionScore: string;
    recallPerformance: string;
    recencySignal: string;
  };
}

// ============================================================================
// 4. RETENTION HEALTH & DECAY SIGNALS (Deterministic Policy)
// ============================================================================

export type RetentionHealthSignal =
  | 'FRESH'           // 0–3 days elapsed since good study/recall
  | 'DUE_FOR_REVIEW'  // 4–7 days elapsed
  | 'NEEDS_ATTENTION' // 8–14 days elapsed OR recent recall failure / low retention (<= 2)
  | 'OVERDUE'         // > 14 days elapsed without engagement
  | 'UNSTUDIED';      // 0 recorded study sessions

export interface TopicRetentionSignal {
  topicId: ID;
  topicTitle: string;
  subjectId: ID;
  subjectName: string;
  signal: RetentionHealthSignal;
  daysElapsed: number | null;
  recommendedAction: string;
  whyExplanation: string;
}

// ============================================================================
// 5. SUBJECT LEARNING HEALTH (Topic-Aggregated Distribution)
// ============================================================================

export interface SubjectLearningHealth {
  subjectId: ID;
  subjectName: string;
  subjectColor: string;
  totalTopicsCount: number;
  topicsAssessedCount: number;
  
  // Categorical topic distribution
  strongCount: number;
  stableCount: number;
  developingCount: number;
  emergingCount: number;
  notAssessedCount: number;
  
  // Retention health breakdown
  freshCount: number;
  dueForReviewCount: number;
  needsAttentionCount: number;
  overdueCount: number;
  unstudiedCount: number;

  topTopicsNeedingReview: {
    topicId: ID;
    topicTitle: string;
    signal: RetentionHealthSignal;
    daysElapsed: number | null;
  }[];

  overallStatusText: string;
}

// ============================================================================
// 6. EXPLAINABLE RECOMMENDATIONS (Signal → Evidence → Action)
// ============================================================================

export type LearningRecommendationType =
  | 'spaced_retrieval'
  | 'retention_intervention'
  | 'syllabus_continuation'
  | 'subject_rebalance'
  | 'concept_synthesis'
  | 'routine_continuation';

export interface ExplainableRecommendation {
  id: string;
  type: LearningRecommendationType;
  priority: 'primary' | 'secondary' | 'routine';
  weight: number;
  title: string;
  signal: string;
  evidence: string;
  whyExplanation: string;
  action?: string;
  actionLabel: string;
  actionPayload: {
    type: 'start_focus' | 'drill_flashcards' | 'open_study_plan' | 'open_topic_notes' | 'create_task';
    subjectId?: ID;
    subjectName?: string;
    topicId?: ID;
    topicTitle?: string;
    durationMinutes?: number;
    suggestedDurationMinutes?: number;
    targetRoute?: string;
  };
}

// ============================================================================
// 7. COMPLETE LEARNING SNAPSHOT (Computation Boundary Dataset)
// ============================================================================

export interface LearningIntelligenceSnapshot {
  calculatedAt: string; // ISO date-time
  topicHistories: Map<ID, TopicLearningHistory>;
  masteryEvaluations: Map<ID, TopicMasteryEvaluation>;
  retentionSignals: Map<ID, TopicRetentionSignal>;
  subjectHealths: Map<ID, SubjectLearningHealth>;
  recommendations: ExplainableRecommendation[];
}
