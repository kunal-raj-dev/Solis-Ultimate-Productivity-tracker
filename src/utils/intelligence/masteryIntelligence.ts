import { Goal } from '../../types/goal';
import { StudyTopic, StudySession } from '../../types/study';
import { Flashcard } from '../../types/learning';
import { Habit } from '../../types/habit';
import { FocusSession } from '../../types/focus';
import { DailyReflection } from '../../types/reflection';
import { TopicLearningHistory } from '../../types/learningIntelligence';
import { evaluateTopicMastery } from './masteryEngine';
import { deriveTopicHistories } from './topicHistory';

export interface ExamReadinessResult {
  readinessScore: number; // 0 to 100
  grade: 'Exceptional' | 'Prepared' | 'Borderline' | 'At Risk';
  gradeColor: 'sage' | 'coral' | 'amber' | 'lavender';
  componentScores: {
    topicsScore: number; // 35% (50% when no habits are linked — Unlinked Habits Fallback)
    retentionScore: number; // 30% (35% when no habits are linked)
    habitScore: number; // 20% (0% when no habits are linked)
    milestoneScore: number; // 15%
  };
  /** Weights actually applied to the composite score, for honest UI labels. */
  appliedWeights: {
    topics: number;
    retention: number;
    habit: number;
    milestone: number;
  };
  riskDiagnostics: string[];
  daysRemaining: number;
}

// Plan §2.2 hard gate: 0% Topics Mastery (no topic at full mastery) caps the
// composite readiness score at 15/100 ("At Risk") so habit streaks, retention
// hygiene, and milestone checkboxes can never manufacture a passing grade.
const HARD_GATE_MAX_SCORE = 15;

// Plan §2.2 proximity decay: urgent exams (≤ 5 days) with unmastered topics
// take an exponential readiness penalty that grows as the horizon shrinks.
const PROXIMITY_DECAY_WINDOW_DAYS = 5;

export interface CognitiveLoadAlertItem {
  id: string;
  type: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  suggestion: string;
}

export interface CognitiveLoadReport {
  status: 'optimal' | 'moderate' | 'elevated' | 'burnout_risk';
  score: number; // 0 to 100 (100 = optimal, <40 = high risk)
  alerts: CognitiveLoadAlertItem[];
  recommendedAction: string;
}

export interface RetentionForecast {
  currentRetention: number;
  forecast7Day: number;
  forecast14Day: number;
  daysUntilDecayBelow80: number;
  isOverdue: boolean;
}

/**
 * Deterministic Exam Readiness Formula (plan §2.2 recalibration)
 * Readiness = W_topics * TopicsMastery + W_retention * SM2Retention +
 *             W_habit * HabitConsistency + 0.15 * MilestoneCompletion
 *
 * Canonical weights: 0.35 / 0.30 / 0.20 / 0.15. When no habit is linked to
 * the goal, the 20% habit weight redistributes to Topics Mastery (0.50) and
 * SM-2 Retention (0.35) instead of zeroing out (Unlinked Habits Fallback).
 *
 * Hard gates applied after the weighted sum:
 * - Topics Mastery Gate: zero mastered topics caps the score at 15/100.
 * - Proximity Decay: exams within 5 days carrying unmastered topics take an
 *   exponential penalty proportional to urgency and the unmastered fraction.
 */
export function calculateExamReadiness(params: {
  goal: Goal;
  topics: StudyTopic[];
  flashcards: Flashcard[];
  habits: Habit[];
  studySessions?: StudySession[];
}): ExamReadinessResult {
  const { goal, topics, flashcards, habits, studySessions } = params;

  // 1. Topics Mastery Score (35%) — Evaluated via canonical MasteryEngine
  const subjectTopics = goal.subjectId ? topics.filter((t) => t.subjectId === goal.subjectId) : topics;
  const relevantCards = goal.subjectId ? flashcards.filter((c) => c.subjectId === goal.subjectId) : flashcards;
  let topicsScore = 0;
  if (subjectTopics.length > 0) {
    const scoreMap: Record<string, number> = { mastered: 100, learning: 60, unstudied: 20 };
    if (studySessions && studySessions.length > 0) {
      const histories = deriveTopicHistories({
        subjects: [],
        topics: subjectTopics,
        sessions: studySessions,
        flashcards: relevantCards,
        reviews: [],
        notes: [],
        resources: [],
        planItems: []
      });
      const topicScores = subjectTopics.map((t) => {
        const hist = histories.get(t.id);
        if (hist && (hist.totalSessionsCount > 0 || hist.totalRecallAttempts > 0)) {
          const evaluated = evaluateTopicMastery(hist);
          if (evaluated.state === 'STRONG') return 100;
          if (evaluated.state === 'STABLE') return 80;
          if (evaluated.state === 'DEVELOPING') return 60;
          if (evaluated.state === 'EMERGING') return 40;
          return scoreMap[t.masteryLevel] || 20;
        }
        return scoreMap[t.masteryLevel] || 50;
      });
      topicsScore = Math.round(topicScores.reduce((acc, s) => acc + s, 0) / subjectTopics.length);
    } else {
      const totalMastery = subjectTopics.reduce((acc, t) => acc + (scoreMap[t.masteryLevel] || 50), 0);
      topicsScore = Math.round(totalMastery / subjectTopics.length);
    }
  }
  let retentionScore = 0;
  if (relevantCards.length > 0) {
    const now = new Date().getTime();
    const scoredCards = relevantCards.map((c) => {
      const nextReview = new Date(c.nextReviewDate).getTime();
      const intervalDays = c.intervalDays || 1;
      if (nextReview < now) {
        const daysOverdue = Math.max(1, Math.round((now - nextReview) / (1000 * 60 * 60 * 24)));
        return Math.max(20, 100 - daysOverdue * 15);
      }
      return Math.min(100, Math.round(50 + intervalDays * 10));
    });
    retentionScore = Math.round(scoredCards.reduce((a, b) => a + b, 0) / scoredCards.length);
  }

  // 3. Linked Habit Consistency Score (20%; redistributes to 0% when no habit is linked)
  const linkedHabits = habits.filter((h) => h.goalId === goal.id);
  let habitScore = 0;
  if (linkedHabits.length > 0) {
    const avgStreak = linkedHabits.reduce((acc, h) => acc + h.currentStreak, 0) / linkedHabits.length;
    habitScore = Math.min(100, Math.round(avgStreak * 10));
  }

  // 4. Milestone Completion Score (15%)
  let milestoneScore = 0;
  if (goal.milestones && goal.milestones.length > 0) {
    const completed = goal.milestones.filter((m) => m.completed).length;
    milestoneScore = Math.round((completed / goal.milestones.length) * 100);
  }

  // Days Remaining (needed by proximity decay and milestone diagnostics)
  const targetDateMs = new Date(goal.targetDate).getTime();
  const todayMs = new Date().getTime();
  const daysRemaining = isNaN(targetDateMs)
    ? 0
    : Math.max(0, Math.ceil((targetDateMs - todayMs) / (1000 * 60 * 60 * 24)));

  // Weighted Holistic Calculation. Unlinked Habits Fallback: with no habit
  // linked to the goal the 20% habit weight redistributes to Topics Mastery
  // (50%) and SM-2 Retention (35%) instead of penalizing with 0/20.
  const hasLinkedHabits = linkedHabits.length > 0;
  const topicsWeight = hasLinkedHabits ? 0.35 : 0.5;
  const retentionWeight = hasLinkedHabits ? 0.3 : 0.35;
  const habitWeight = hasLinkedHabits ? 0.2 : 0;
  const milestoneWeight = 0.15;

  let readinessScore = Math.round(
    topicsWeight * topicsScore +
    retentionWeight * retentionScore +
    habitWeight * habitScore +
    milestoneWeight * milestoneScore
  );

  // Gate inputs: mastery is honest only when at least one topic is mastered.
  const masteredCount = subjectTopics.filter((t) => t.masteryLevel === 'mastered').length;
  const unmasteredCount = subjectTopics.length - masteredCount;
  const hardGateActive = masteredCount === 0;

  // Proximity Decay: urgent exams (≤ 5 days) with unmastered topics take an
  // exponential readiness penalty — urgency rate 1 (5 days out) to 6 (exam
  // day) scaled by the unmastered fraction of the syllabus.
  let proximityDecayApplied = false;
  if (daysRemaining <= PROXIMITY_DECAY_WINDOW_DAYS && unmasteredCount > 0 && subjectTopics.length > 0) {
    const urgencyRate = PROXIMITY_DECAY_WINDOW_DAYS + 1 - daysRemaining;
    const unmasteredFraction = unmasteredCount / subjectTopics.length;
    readinessScore = Math.round(readinessScore * Math.exp(-urgencyRate * unmasteredFraction));
    proximityDecayApplied = true;
  }

  // Hard Gate: 0% Topics Mastery (zero mastered topics) caps the composite
  // score at 15/100 so supporting signals cannot inflate an unmastered exam.
  if (hardGateActive) {
    readinessScore = Math.min(readinessScore, HARD_GATE_MAX_SCORE);
  }

  // Grade & Diagnostics
  let grade: ExamReadinessResult['grade'] = 'At Risk';
  let gradeColor: ExamReadinessResult['gradeColor'] = 'lavender';

  if (readinessScore >= 85) {
    grade = 'Exceptional';
    gradeColor = 'sage';
  } else if (readinessScore >= 70) {
    grade = 'Prepared';
    gradeColor = 'coral';
  } else if (readinessScore >= 50) {
    grade = 'Borderline';
    gradeColor = 'amber';
  } else {
    grade = 'At Risk';
    gradeColor = 'lavender';
  }

  // Risk Diagnostics Generation
  const riskDiagnostics: string[] = [];
  if (subjectTopics.length === 0) {
    riskDiagnostics.push('No syllabus topics linked to this exam. Add study topics to track concept mastery.');
  } else if (topicsScore < 60) {
    riskDiagnostics.push(`Syllabus topics mastery is low (${topicsScore}%). Complete core concept drills.`);
  }

  if (relevantCards.length === 0) {
    riskDiagnostics.push('No flashcard deck linked to this exam. Create flashcards to enable spaced repetition.');
  } else if (retentionScore < 60) {
    riskDiagnostics.push(`Flashcard retention is decaying (${retentionScore}%). Run active recall reviews.`);
  }

  if (linkedHabits.length === 0) {
    riskDiagnostics.push('No daily consistency habit is linked to this exam.');
  } else if (habitScore < 40) {
    riskDiagnostics.push('Consistency ritual streak is broken. Re-anchor 20m daily review block.');
  }

  if (!goal.milestones || goal.milestones.length === 0) {
    riskDiagnostics.push('No milestones defined. Break down this exam horizon into target checkpoints.');
  } else if (milestoneScore < 50 && daysRemaining <= 14) {
    riskDiagnostics.push(`Milestone progress lagging (${milestoneScore}%) with only ${daysRemaining} days remaining.`);
  }

  if (hardGateActive) {
    riskDiagnostics.push(
      `Hard gate: no topic has reached full mastery yet, so readiness is capped at ${HARD_GATE_MAX_SCORE}/100 until the first topic is mastered.`
    );
  }

  if (proximityDecayApplied) {
    const horizonLabel = daysRemaining === 0 ? 'today' : `in ${daysRemaining} ${daysRemaining === 1 ? 'day' : 'days'}`;
    riskDiagnostics.push(
      `Exam is ${horizonLabel} with ${unmasteredCount} ${unmasteredCount === 1 ? 'topic' : 'topics'} not yet mastered — urgent-horizon penalty applied to the composite score.`
    );
  }

  return {
    readinessScore,
    grade,
    gradeColor,
    componentScores: {
      topicsScore,
      retentionScore,
      habitScore,
      milestoneScore
    },
    appliedWeights: {
      topics: topicsWeight,
      retention: retentionWeight,
      habit: habitWeight,
      milestone: milestoneWeight
    },
    riskDiagnostics,
    daysRemaining
  };
}

/**
 * Deterministic Cognitive Load & Burnout Heuristics
 */
export function evaluateCognitiveLoad(params: {
  focusSessions: FocusSession[];
  studySessions?: unknown[];
  reflections: DailyReflection[];
  topics?: StudyTopic[];
}): CognitiveLoadReport {
  const { focusSessions, reflections, topics } = params;
  const alerts: CognitiveLoadAlertItem[] = [];

  // 1. Calculate past 3 days focus duration
  const todayMs = new Date().getTime();
  const threeDaysAgoMs = todayMs - 3 * 24 * 60 * 60 * 1000;

  const recentFocus = focusSessions.filter((s) => new Date(s.createdAt).getTime() >= threeDaysAgoMs);
  const totalRecentMinutes = recentFocus.reduce((acc, s) => acc + s.durationMinutes, 0);
  const avgDailyMinutes = Math.round(totalRecentMinutes / 3);

  // 2. Evaluate recent energy levels
  const recentReflections = reflections.slice(0, 3);
  const avgEnergy = recentReflections.length > 0
    ? recentReflections.reduce((acc, r) => acc + r.energyScore, 0) / recentReflections.length
    : 4;

  let score = 90; // Default optimal score

  // Check 1: Excessive Volume & Low Energy (Burnout warning)
  if (avgDailyMinutes > 300 && avgEnergy <= 2.5) {
    score -= 45;
    alerts.push({
      id: 'alert_burnout',
      type: 'critical',
      title: 'Cognitive Exhaustion Risk',
      message: `You logged ${Math.round(avgDailyMinutes / 60)}h daily focus with low energy ratings (${avgEnergy.toFixed(1)}/5).`,
      suggestion: 'Schedule an intentional restorative rest block. High fatigue degrades conceptual synthesis.'
    });
  } else if (avgDailyMinutes > 330) {
    score -= 25;
    alerts.push({
      id: 'alert_high_volume',
      type: 'warning',
      title: 'High Cognitive Load Sprint',
      message: `Averaging ${Math.round(avgDailyMinutes / 60)}h intense study per day.`,
      suggestion: 'Maintain 10-15 minute walk/hydration breaks between deep flow blocks.'
    });
  }

  // Check 2: Low Interruption Mastery / Flow
  const lowFlowSessions = recentFocus.filter((s) => (s.flowQuality && s.flowQuality <= 2) || s.interruptionsCount >= 3);
  if (lowFlowSessions.length >= 3) {
    score -= 20;
    alerts.push({
      id: 'alert_friction',
      type: 'warning',
      title: 'Elevated Distraction Friction',
      message: `${lowFlowSessions.length} recent sessions suffered from frequent interruptions or low flow quality.`,
      suggestion: 'Switch to 25m Pomodoro pods with synthetic Pink Noise or Brownian noise to isolate audio distractions.'
    });
  }

  // Check 3: Overlearning Heuristic on Mastered Topics
  if (topics) {
    const overlearned = topics.filter((t) => t.masteryLevel === 'mastered');
    if (overlearned.length > 0) {
      alerts.push({
        id: 'alert_overlearning',
        type: 'info',
        title: 'Diminishing Returns Detected (Overlearning)',
        message: `Topic "${overlearned[0].title}" is already at full mastery level.`,
        suggestion: 'Shift cognitive energy to lower-mastery frontier concepts to maximize exam velocity.'
      });
    }
  }

  // Determine Overall Status
  let status: CognitiveLoadReport['status'] = 'optimal';
  let recommendedAction = 'Maintain current study rhythm. Cognitive balance is in optimal flow state.';

  if (score < 50) {
    status = 'burnout_risk';
    recommendedAction = 'Take a 2-hour offline restoration block. Prioritize sleep and concept incubation.';
  } else if (score < 70) {
    status = 'elevated';
    recommendedAction = 'Moderate sprint intensity. Alternate heavy problem sets with light flashcard reviews.';
  } else if (score < 85) {
    status = 'moderate';
    recommendedAction = 'Good intellectual momentum. Keep hydration and soundscape focus active.';
  }

  return {
    status,
    score: Math.max(10, Math.min(100, score)),
    alerts,
    recommendedAction
  };
}

/**
 * Deterministic Forgetting Curve Decay Forecast
 * R(t) = exp(-t / S)
 */
export function calculateTopicRetentionForecast(
  topic: StudyTopic,
  flashcards: Flashcard[],
  history?: TopicLearningHistory
): RetentionForecast {
  const topicCards = flashcards.filter((c) => c.topicId === topic.id);
  const scoreMap: Record<string, number> = { mastered: 95, learning: 65, unstudied: 25 };
  let baseMastery = scoreMap[topic.masteryLevel] || 60;

  if (history && (history.totalSessionsCount > 0 || history.totalRecallAttempts > 0)) {
    const evaluation = evaluateTopicMastery(history);
    if (evaluation.state === 'STRONG') baseMastery = 95;
    else if (evaluation.state === 'STABLE') baseMastery = 80;
    else if (evaluation.state === 'DEVELOPING') baseMastery = 65;
    else if (evaluation.state === 'EMERGING') baseMastery = 45;
  }

  // Derive stability factor S from SM-2 intervals and repetitions
  let avgInterval = 4; // Days
  if (topicCards.length > 0) {
    const totalInterval = topicCards.reduce((acc, c) => acc + (c.intervalDays || 1), 0);
    avgInterval = Math.max(1, totalInterval / topicCards.length);
  }

  // Stability factor in days
  const S = Math.max(2, avgInterval * 2.5);

  // Ebbinghaus exponential decay
  const currentRetention = Math.round(baseMastery);
  const forecast7Day = Math.round(baseMastery * Math.exp(-7 / S));
  const forecast14Day = Math.round(baseMastery * Math.exp(-14 / S));

  // Compute exact day countdown until retention drops below 80%
  let daysUntilDecayBelow80 = 0;
  if (baseMastery > 80) {
    daysUntilDecayBelow80 = Math.max(1, Math.round(-S * Math.log(80 / baseMastery)));
  }

  const isOverdue = topicCards.some((c) => new Date(c.nextReviewDate).getTime() <= Date.now());

  return {
    currentRetention,
    forecast7Day: Math.max(10, forecast7Day),
    forecast14Day: Math.max(5, forecast14Day),
    daysUntilDecayBelow80,
    isOverdue
  };
}
