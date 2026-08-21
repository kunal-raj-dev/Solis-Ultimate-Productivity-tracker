/**
 * Solis Intelligence Engine — Unified Entry Point
 * Deterministic, explainable, and multi-layered study analytics aggregator.
 */

import { calculateDateWindow, computeCognitiveRhythm } from './rhythm';
import { computeExecutionIntelligence } from './execution';
import { computeTopicMastery } from './mastery';
import { computeAttentionIntelligence } from './attention';
import { computeExplainableRecommendations } from './recommendations';
import { deriveTopicHistories, RawLearningRecords } from './topicHistory';
import { evaluateAllTopicMastery } from './masteryEngine';
import { evaluateAllTopicRetention } from './retentionEngine';
import { computeSubjectLearningHealths } from './subjectHealthEngine';
import {
  IntelligenceSourceData,
  SolisIntelligenceReport,
  TimeRangeScope
} from './types';
import type {
  LearningIntelligenceSnapshot
} from '../../types/learningIntelligence';

export * from './types';
export * from './config';
export * from './rhythm';
export * from './execution';
export * from './mastery';
export * from './attention';
export * from './recommendations';
export * from './topicHistory';
export * from './sufficiencyModel';
export * from './masteryEngine';
export * from './retentionEngine';
export * from './subjectHealthEngine';

/**
 * Creates a complete memoized learning intelligence snapshot.
 * Acts as the computation boundary for the entire learning graph.
 */
export function createLearningIntelligenceSnapshot(
  records: RawLearningRecords
): LearningIntelligenceSnapshot {
  const topicHistories = deriveTopicHistories(records);
  const masteryEvaluations = evaluateAllTopicMastery(topicHistories);
  const retentionSignals = evaluateAllTopicRetention(topicHistories);
  const subjectHealths = computeSubjectLearningHealths(
    records.subjects,
    topicHistories,
    masteryEvaluations,
    retentionSignals
  );

  const recommendations = computeExplainableRecommendations({
    subjects: records.subjects,
    planItems: records.planItems,
    topicHistories,
    masteryEvaluations,
    retentionSignals
  });

  return {
    calculatedAt: (records.referenceDate || new Date()).toISOString(),
    topicHistories,
    masteryEvaluations,
    retentionSignals,
    subjectHealths,
    recommendations
  };
}

/**
 * Legacy & Global Solis Intelligence Report Generator.
 */
export function generateSolisIntelligenceReport(
  data: IntelligenceSourceData,
  scope: TimeRangeScope = 'this_week',
  referenceDate = new Date()
): SolisIntelligenceReport {
  const window = calculateDateWindow(scope, referenceDate);

  const rhythm = computeCognitiveRhythm(data, window);
  const execution = computeExecutionIntelligence(data, window);
  const mastery = computeTopicMastery(data, referenceDate);
  const attention = computeAttentionIntelligence(data, window, referenceDate);

  // Derive new learning snapshot
  const rawRecords: RawLearningRecords = {
    subjects: data.subjects,
    topics: data.topics,
    sessions: data.sessions,
    flashcards: [],
    reviews: [],
    notes: [],
    resources: [],
    planItems: data.planItems,
    referenceDate
  };

  const snapshot = createLearningIntelligenceSnapshot(rawRecords);

  const hasOverallSufficientData =
    rhythm.hasSufficientData || execution.hasSufficientData || attention.hasSufficientData;

  return {
    scope,
    window,
    rhythm,
    execution,
    mastery,
    attention,
    recommendations: snapshot.recommendations as any,
    hasOverallSufficientData
  };
}
