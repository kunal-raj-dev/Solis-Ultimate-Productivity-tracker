/**
 * Solis Intelligence Engine — Recommendations Module
 * Deterministic, ranked Signal → Evidence → Action recommendations.
 */

import {
  AttentionIntelligenceInsight,
  CognitiveRhythmInsight,
  ExecutionIntelligenceInsight,
  IntelligenceSourceData,
  MasteryIntelligenceInsight,
  StudyRecommendation
} from './types';

export function computeRecommendations(
  data: IntelligenceSourceData,
  _rhythm: CognitiveRhythmInsight,
  execution: ExecutionIntelligenceInsight,
  mastery: MasteryIntelligenceInsight,
  attention: AttentionIntelligenceInsight
): StudyRecommendation[] {
  const { subjects, planItems } = data;
  const candidates: StudyRecommendation[] = [];

  // 1. Spaced Review Recommendation (High Priority: preservation of learning)
  if (mastery.reviewQueue.length > 0) {
    const topReviewTopic = mastery.reviewQueue[0];
    const days = topReviewTopic.daysSinceLastReview ?? 7;
    const rating = topReviewTopic.averageRetentionRating;

    candidates.push({
      id: `rec-review-${topReviewTopic.topicId}`,
      type: 'spaced_review',
      priority: 'secondary', // adjusted after sorting
      weight: 100 + (rating <= 2 ? 30 : 0) + Math.min(30, days * 2),
      title: `Review ${topReviewTopic.topicTitle}`,
      signal: `Neural retention decay signal for "${topReviewTopic.topicTitle}" (${topReviewTopic.subjectName}).`,
      evidence: `Last reviewed ${days} days ago with an average retention rating of ${rating}/5. Solis mastery signal: ${topReviewTopic.compositeMasterySignal}%.`,
      action: `Complete a 30-minute Active Recall session.`,
      actionPayload: {
        type: 'start_focus',
        subjectId: topReviewTopic.subjectId,
        subjectName: topReviewTopic.subjectName,
        topicId: topReviewTopic.topicId,
        topicTitle: topReviewTopic.topicTitle,
        suggestedDurationMinutes: 30
      }
    });
  }

  // 2. Subject Neglect Rebalance Recommendation
  if (attention.neglectAlerts.length > 0) {
    const topNeglect = attention.neglectAlerts[0];
    candidates.push({
      id: `rec-neglect-${topNeglect.subjectId}`,
      type: 'neglect_rebalance',
      priority: 'secondary',
      weight: 85 + Math.min(40, topNeglect.divergence),
      title: `Rebalance ${topNeglect.subjectName}`,
      signal: `${topNeglect.subjectName} effort is significantly below intended trajectory.`,
      evidence: topNeglect.reason,
      action: `Schedule a 45-minute Deep Study block for ${topNeglect.subjectName}.`,
      actionPayload: {
        type: 'start_focus',
        subjectId: topNeglect.subjectId,
        subjectName: topNeglect.subjectName,
        suggestedDurationMinutes: 45
      }
    });
  }

  // 3. Postponement Pattern Intervention
  if (execution.postponementPatterns.length > 0) {
    const topPostponed = execution.postponementPatterns[0];
    candidates.push({
      id: `rec-postponed-${topPostponed.planItemId}`,
      type: 'plan_calibration',
      priority: 'secondary',
      weight: 80 + topPostponed.uncompletedCount * 10,
      title: `Reduce Friction for "${topPostponed.title}"`,
      signal: `Recurring postponement pattern detected for "${topPostponed.title}".`,
      evidence: `This plan item has remained incomplete across ${topPostponed.uncompletedCount} scheduled dates.`,
      action: `Break this into a smaller 20-minute micro-session to regain momentum.`,
      actionPayload: {
        type: 'start_focus',
        subjectId: topPostponed.subjectId,
        subjectName: topPostponed.subjectName,
        suggestedDurationMinutes: 20
      }
    });
  }

  // 4. Planning Realism Calibration
  if (execution.planningRealismVerdict === 'over_planning' && execution.plannedStudyMinutes > 180) {
    candidates.push({
      id: 'rec-plan-calibration',
      type: 'plan_calibration',
      priority: 'secondary',
      weight: 70,
      title: 'Calibrate Planning Realism',
      signal: 'Recent study plan volume exceeds executed velocity.',
      evidence: `You planned ${(execution.plannedStudyMinutes / 60).toFixed(1)}h and completed ${(execution.actualStudyMinutes / 60).toFixed(1)}h (${Math.round(execution.planningRealismRatio * 100)}% execution ratio).`,
      action: 'Set slightly smaller, higher-focus daily plan targets for tomorrow.',
      actionPayload: {
        type: 'open_study_plan'
      }
    });
  }

  // 5. Next Syllabus Continuity Step
  const uncompletedPlan = planItems.find((p) => !p.completed && p.scheduledDate);
  if (uncompletedPlan) {
    candidates.push({
      id: `rec-continuity-${uncompletedPlan.id}`,
      type: 'continuity_resume',
      priority: 'secondary',
      weight: 60,
      title: `Continue with ${uncompletedPlan.title}`,
      signal: `Scheduled study plan block waiting in your queue.`,
      evidence: `Planned for ${uncompletedPlan.targetMinutes || 45} minutes in ${uncompletedPlan.subjectName || 'Syllabus'}.`,
      action: `Start study session for "${uncompletedPlan.title}".`,
      actionPayload: {
        type: 'start_focus',
        subjectId: uncompletedPlan.subjectId,
        subjectName: uncompletedPlan.subjectName,
        suggestedDurationMinutes: uncompletedPlan.targetMinutes || 45
      }
    });
  }

  // 6. Insufficient Data Fallback / Onboarding
  if (candidates.length === 0) {
    const activeSubj = subjects.find((s) => s.status === 'active') || subjects[0];
    candidates.push({
      id: 'rec-onboarding',
      type: 'routine_continuation',
      priority: 'primary',
      weight: 50,
      title: 'Establish Your Study Baseline',
      signal: 'Your cognitive rhythm is beginning to take shape.',
      evidence: 'Complete 3 or more focus sessions to unlock detailed time-of-day concentration and mastery signals.',
      action: activeSubj
        ? `Start a 25-minute focus session in ${activeSubj.name}.`
        : 'Create your first subject in Study Studio.',
      actionPayload: activeSubj
        ? {
            type: 'start_focus',
            subjectId: activeSubj.id,
            subjectName: activeSubj.name,
            suggestedDurationMinutes: 25
          }
        : {
            type: 'open_study_plan'
          }
    });
  }

  // Sort candidates by weight descending and limit to top 3
  const sorted = candidates.sort((a, b) => b.weight - a.weight).slice(0, 3);
  if (sorted.length > 0) {
    sorted[0].priority = 'primary';
    for (let i = 1; i < sorted.length; i++) {
      sorted[i].priority = 'secondary';
    }
  }

  return sorted;
}
