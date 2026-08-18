/**
 * Solis Intelligence Engine — Unified Entry Point
 * Deterministic, explainable, and multi-layered study analytics aggregator.
 */

import { calculateDateWindow, computeCognitiveRhythm } from './rhythm';
import { computeExecutionIntelligence } from './execution';
import { computeTopicMastery } from './mastery';
import { computeAttentionIntelligence } from './attention';
import { computeRecommendations } from './recommendations';
import {
  IntelligenceSourceData,
  SolisIntelligenceReport,
  TimeRangeScope
} from './types';

export * from './types';
export * from './rhythm';
export * from './execution';
export * from './mastery';
export * from './attention';
export * from './recommendations';

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
  const recommendations = computeRecommendations(data, rhythm, execution, mastery, attention);

  const hasOverallSufficientData =
    rhythm.hasSufficientData || execution.hasSufficientData || attention.hasSufficientData;

  return {
    scope,
    window,
    rhythm,
    execution,
    mastery,
    attention,
    recommendations,
    hasOverallSufficientData
  };
}
