/**
 * Solis Learning Intelligence — Explainable Recommendations Module
 * 
 * Generates transparent, deterministic learning recommendations with:
 *  - Signal: What pattern was detected
 *  - Evidence: The exact verifiable metrics backing it
 *  - Why Explanation: Plain human-readable rationale
 *  - Action: Typed payload connecting directly to Focus Sanctuary, Flashcards, or Tasks
 */

import { ID } from '../../types/common';
import { StudySubject, StudyPlanItem } from '../../types/study';
import {
  TopicLearningHistory,
  TopicRetentionSignal,
  TopicMasteryEvaluation,
  ExplainableRecommendation
} from '../../types/learningIntelligence';
import { AttentionIntelligenceInsight, ExecutionIntelligenceInsight, StudyRecommendation } from './types';
import { LEARNING_HEURISTICS_CONFIG } from './config';
import { deriveTopicHistories } from './topicHistory';
import { evaluateAllTopicMastery } from './masteryEngine';
import { evaluateAllTopicRetention } from './retentionEngine';

const { RECOMMENDATION } = LEARNING_HEURISTICS_CONFIG;

export interface RecommendationSourceContext {
  subjects: StudySubject[];
  planItems: StudyPlanItem[];
  topicHistories: Map<ID, TopicLearningHistory>;
  masteryEvaluations: Map<ID, TopicMasteryEvaluation>;
  retentionSignals: Map<ID, TopicRetentionSignal>;
  execution?: ExecutionIntelligenceInsight;
  attention?: AttentionIntelligenceInsight;
}

export function computeExplainableRecommendations(
  context: RecommendationSourceContext
): ExplainableRecommendation[] {
  const {
    subjects,
    planItems,
    topicHistories,
    masteryEvaluations,
    retentionSignals,
    execution,
    attention
  } = context;

  const candidates: ExplainableRecommendation[] = [];

  // 1. Spaced Review & Retention Interventions (Highest Priority)
  const urgentRetentionTopics: { history: TopicLearningHistory; retention: TopicRetentionSignal; mastery: TopicMasteryEvaluation }[] = [];

  for (const [topicId, retention] of retentionSignals.entries()) {
    const history = topicHistories.get(topicId);
    const mastery = masteryEvaluations.get(topicId);
    if (!history || !mastery) continue;

    if (retention.signal === 'OVERDUE' || retention.signal === 'NEEDS_ATTENTION' || retention.signal === 'DUE_FOR_REVIEW') {
      urgentRetentionTopics.push({ history, retention, mastery });
    }
  }

  // Sort by urgency: OVERDUE > NEEDS_ATTENTION > DUE_FOR_REVIEW
  urgentRetentionTopics.sort((a, b) => {
    const order = { OVERDUE: 3, NEEDS_ATTENTION: 2, DUE_FOR_REVIEW: 1, FRESH: 0, UNSTUDIED: 0 };
    if (order[b.retention.signal] !== order[a.retention.signal]) {
      return (order[b.retention.signal] || 0) - (order[a.retention.signal] || 0);
    }
    return (b.retention.daysElapsed || 0) - (a.retention.daysElapsed || 0);
  });

  if (urgentRetentionTopics.length > 0) {
    const top = urgentRetentionTopics[0];
    const { history, retention } = top;
    const days = retention.daysElapsed ?? 7;

    const hasFlashcards = history.flashcardsCount > 0;
    const actionType = hasFlashcards ? 'drill_flashcards' : 'start_focus';
    const duration = hasFlashcards ? 15 : 20;

    let title = `Review ${history.topicTitle}`;
    let signal = `Retention signal is ${retention.signal.toLowerCase().replace('_', ' ')} for "${history.topicTitle}".`;
    let evidence = `Last studied ${days} days ago. ${
      history.totalSessionsCount
    } sessions logged, with an average retention rating of ${history.averageRetentionRating ?? 'unrated'}/5.`;
    
    if (history.totalRecallAttempts > 0) {
      evidence += ` Flashcard recall accuracy: ${Math.round((history.recallAccuracyRate || 0) * 100)}% across ${history.totalRecallAttempts} attempts.`;
    }

    const whyExplanation = retention.whyExplanation;

    candidates.push({
      id: `rec-retention-${history.topicId}`,
      type: 'spaced_retrieval',
      priority: 'primary',
      weight: RECOMMENDATION.BASE_SPACED_REVIEW_WEIGHT + (retention.signal === 'OVERDUE' ? 25 : retention.signal === 'NEEDS_ATTENTION' ? 15 : 5),
      title,
      signal,
      evidence,
      whyExplanation,
      action: hasFlashcards ? `Drill ${history.flashcardsCount} Flashcards (15m)` : `Start ${duration}m Retrieval Focus`,
      actionLabel: hasFlashcards ? `Drill ${history.flashcardsCount} Flashcards (15m)` : `Start ${duration}m Retrieval Focus`,
      actionPayload: {
        type: actionType,
        subjectId: history.subjectId,
        subjectName: history.subjectName,
        topicId: history.topicId,
        topicTitle: history.topicTitle,
        durationMinutes: duration,
        suggestedDurationMinutes: duration,
        targetRoute: hasFlashcards ? '/app/study' : '/app/focus'
      }
    });
  }

  // 2. Subject Neglect Rebalancing (if attention telemetry is provided)
  if (attention && attention.neglectAlerts && attention.neglectAlerts.length > 0) {
    const topNeglect = attention.neglectAlerts[0];
    candidates.push({
      id: `rec-neglect-${topNeglect.subjectId}`,
      type: 'subject_rebalance',
      priority: 'secondary',
      weight: RECOMMENDATION.BASE_SUBJECT_REBALANCE_WEIGHT + Math.min(25, topNeglect.divergence),
      title: `Rebalance ${topNeglect.subjectName}`,
      signal: `${topNeglect.subjectName} effort is significantly below your weekly goal allocation.`,
      evidence: topNeglect.reason,
      whyExplanation: `Allocating focused time to ${topNeglect.subjectName} will maintain steady multi-subject momentum.`,
      action: `Start 30m Deep Study in ${topNeglect.subjectName}`,
      actionLabel: `Start 30m Deep Study in ${topNeglect.subjectName}`,
      actionPayload: {
        type: 'start_focus',
        subjectId: topNeglect.subjectId,
        subjectName: topNeglect.subjectName,
        durationMinutes: 30,
        suggestedDurationMinutes: 30,
        targetRoute: '/app/focus'
      }
    });
  }

  // 3. Postponement Intervention (if execution telemetry is provided)
  if (execution && execution.postponementPatterns && execution.postponementPatterns.length > 0) {
    const topPostponed = execution.postponementPatterns[0];
    candidates.push({
      id: `rec-postpone-${topPostponed.planItemId}`,
      type: 'syllabus_continuation',
      priority: 'secondary',
      weight: 70 + Math.min(20, topPostponed.uncompletedCount * 5),
      title: `Break Friction on "${topPostponed.title}"`,
      signal: `Recurring postponement pattern detected for "${topPostponed.title}".`,
      evidence: `This plan item was uncompleted across ${topPostponed.uncompletedCount} scheduled dates.`,
      whyExplanation: 'Breaking this study topic into a short 15-minute starter block will reduce friction and resume flow.',
      action: 'Start 15m Micro-Focus',
      actionLabel: 'Start 15m Micro-Focus',
      actionPayload: {
        type: 'start_focus',
        subjectId: topPostponed.subjectId,
        subjectName: topPostponed.subjectName,
        durationMinutes: 15,
        suggestedDurationMinutes: 15,
        targetRoute: '/app/focus'
      }
    });
  }

  // 4. Next Unfinished Plan Item Continuation
  const pendingPlan = planItems.find((p) => !p.completed && p.scheduledDate);
  if (pendingPlan) {
    candidates.push({
      id: `rec-plan-${pendingPlan.id}`,
      type: 'syllabus_continuation',
      priority: 'routine',
      weight: RECOMMENDATION.BASE_SYLLABUS_CONTINUATION_WEIGHT,
      title: `Continue ${pendingPlan.title}`,
      signal: 'Scheduled study plan block waiting in your queue.',
      evidence: `Planned for ${pendingPlan.targetMinutes || 45} minutes in ${pendingPlan.subjectName || 'Syllabus'}.`,
      whyExplanation: 'Executing your pre-committed plan maintains deliberate daily study momentum.',
      action: `Start ${pendingPlan.targetMinutes || 45}m Session`,
      actionLabel: `Start ${pendingPlan.targetMinutes || 45}m Session`,
      actionPayload: {
        type: 'start_focus',
        subjectId: pendingPlan.subjectId,
        subjectName: pendingPlan.subjectName,
        durationMinutes: pendingPlan.targetMinutes || 45,
        suggestedDurationMinutes: pendingPlan.targetMinutes || 45,
        targetRoute: '/app/focus'
      }
    });
  }

  // 5. Baseline / Onboarding Fallback
  if (candidates.length === 0) {
    const activeSubj = subjects.find((s) => s.status === 'active') || subjects[0];
    if (activeSubj) {
      candidates.push({
        id: 'rec-baseline',
        type: 'syllabus_continuation',
        priority: 'primary',
        weight: 50,
        title: `Study ${activeSubj.name}`,
        signal: 'Your study rhythm is ready for today.',
        evidence: `Curriculum active for ${activeSubj.name}.`,
        whyExplanation: 'Completing a focus session will establish fresh retention and mastery evidence.',
        action: `Start 25m Focus in ${activeSubj.name}`,
        actionLabel: `Start 25m Focus in ${activeSubj.name}`,
        actionPayload: {
          type: 'start_focus',
          subjectId: activeSubj.id,
          subjectName: activeSubj.name,
          durationMinutes: 25,
          suggestedDurationMinutes: 25,
          targetRoute: '/app/focus'
        }
      });
    } else {
      candidates.push({
        id: 'rec-onboarding',
        type: 'routine_continuation',
        priority: 'primary',
        weight: 50,
        title: 'Establish Your Study Baseline',
        signal: 'Your cognitive rhythm will take shape as you log your initial study and focus sessions.',
        evidence: '0 study sessions and 0 focus blocks logged.',
        whyExplanation: 'Completing your first study session establishes your personal cognitive rhythm baseline.',
        action: 'Log your first study session or complete a 25-minute focus block.',
        actionLabel: 'Start First Session',
        actionPayload: {
          type: 'start_focus',
          durationMinutes: 25,
          suggestedDurationMinutes: 25,
          targetRoute: '/app/focus'
        }
      });
    }
  }

  // Sort and limit to top recommendations
  const sorted = candidates.sort((a, b) => b.weight - a.weight).slice(0, RECOMMENDATION.MAX_RECOMMENDATIONS);
  if (sorted.length > 0) {
    sorted[0].priority = 'primary';
    for (let i = 1; i < sorted.length; i++) {
      sorted[i].priority = 'secondary';
    }
  }

  return sorted;
}

/**
 * Legacy & Global Compatibility Wrapper.
 */
export function computeRecommendations(
  data: any,
  _rhythm?: any,
  execution?: ExecutionIntelligenceInsight,
  _mastery?: any,
  attention?: AttentionIntelligenceInsight
): StudyRecommendation[] {
  const rawRecords = {
    subjects: data.subjects || [],
    topics: data.topics || [],
    sessions: data.sessions || [],
    flashcards: [],
    reviews: [],
    notes: [],
    resources: [],
    planItems: data.planItems || []
  };

  const topicHistories = deriveTopicHistories(rawRecords);
  const masteryEvaluations = evaluateAllTopicMastery(topicHistories);
  const retentionSignals = evaluateAllTopicRetention(topicHistories);

  const explainable = computeExplainableRecommendations({
    subjects: data.subjects || [],
    planItems: data.planItems || [],
    topicHistories,
    masteryEvaluations,
    retentionSignals,
    execution,
    attention
  });

  return explainable.map((r) => ({
    ...r,
    action: r.action || r.actionLabel || 'Start'
  }));
}
