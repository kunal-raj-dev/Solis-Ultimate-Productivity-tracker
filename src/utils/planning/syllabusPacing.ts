/**
 * Solis Dynamic Syllabus Pacing & Burnout-Aware Target Engine
 *
 * Feature 3.5 (Weeks 9–12):
 * Dynamically computes required study pace based on remaining syllabus topic hours
 * divided by days to exam horizon:
 *   Daily Target Hours = Remaining Syllabus Hours / max(1, Days to Exam)
 *
 * Anti-Burnout & Anti-Shame Discipline:
 * - When target hours exceed sustainable human capacity (e.g. > 5.5h/day), Solis
 *   never shames or panics the student.
 * - Caps the daily target pace at a safe, sustainable threshold (5.5h).
 * - Intelligently triages topics, deprioritizing low-weight concepts to keep
 *   the student focused on high-yield core units and chapters without cognitive exhaustion.
 */

import { StudyTopic } from '../../types/study';

export const MAX_SUSTAINABLE_DAILY_HOURS = 5.5;
export const DEFAULT_DAILY_CAPACITY_MINUTES = 360; // 6 hours
export const DEFAULT_UNSTUDIED_TOPIC_HOURS = 1.5;
export const DEFAULT_LEARNING_TOPIC_HOURS = 0.75;

export type BurnoutRiskLevel = 'sustainable' | 'elevated' | 'critical';

export interface SyllabusPacingInput {
  targetExamDate: string; // ISO date 'YYYY-MM-DD'
  topics: StudyTopic[];
  targetHoursPerWeek?: number;
  dailyCapacityMinutes?: number;
  baseDate?: Date;
  averageTopicHours?: number;
}

export interface DynamicSyllabusPace {
  targetExamDate: string;
  daysRemaining: number;
  totalTopics: number;
  unmasteredTopicsCount: number;
  masteredTopicsCount: number;
  estimatedRemainingHours: number;
  rawRequiredDailyHours: number;
  cappedSafeDailyHours: number;
  isPaceCapped: boolean;
  burnoutRisk: BurnoutRiskLevel;
  burnoutScore: number; // 0 to 100
  recommendedTopicsToPrioritize: StudyTopic[];
  deprioritizedTopics: StudyTopic[];
  advisoryHeadline: string;
  compassionateAdvice: string;
  actionableAdjustments: string[];
}

/**
 * Calculates days remaining until the target exam date.
 */
export function calculateDaysToExam(targetExamDate: string, baseDate: Date = new Date()): number {
  const parts = targetExamDate.split('-').map(Number);
  const target = new Date(parts[0], (parts[1] || 1) - 1, parts[2] || 1);
  const start = new Date(baseDate.getFullYear(), baseDate.getMonth(), baseDate.getDate());
  const diffMs = target.getTime() - start.getTime();
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, diffDays);
}

/**
 * Computes remaining syllabus hours from study topics based on their mastery levels.
 */
export function calculateRemainingSyllabusHours(
  topics: StudyTopic[],
  unstudiedHours: number = DEFAULT_UNSTUDIED_TOPIC_HOURS,
  learningHours: number = DEFAULT_LEARNING_TOPIC_HOURS
): number {
  return topics.reduce((acc, topic) => {
    if (topic.masteryLevel === 'mastered') return acc;
    if (topic.masteryLevel === 'learning') return acc + learningHours;
    return acc + unstudiedHours;
  }, 0);
}

/**
 * Computes the dynamic syllabus pacing and burnout risk analysis.
 */
export function calculateDynamicSyllabusPacing(input: SyllabusPacingInput): DynamicSyllabusPace {
  const baseDate = input.baseDate || new Date();
  const daysRemaining = Math.max(1, calculateDaysToExam(input.targetExamDate, baseDate));
  const dailyCapacityHours = Math.max(1, (input.dailyCapacityMinutes || DEFAULT_DAILY_CAPACITY_MINUTES) / 60);

  const totalTopics = input.topics.length;
  const masteredTopics = input.topics.filter((t) => t.masteryLevel === 'mastered');
  const unmasteredTopics = input.topics.filter((t) => t.masteryLevel !== 'mastered');

  const unstudiedHours = input.averageTopicHours || DEFAULT_UNSTUDIED_TOPIC_HOURS;
  const learningHours = unstudiedHours * 0.5;
  const estimatedRemainingHours = calculateRemainingSyllabusHours(input.topics, unstudiedHours, learningHours);

  const rawRequiredDailyHours = Math.round((estimatedRemainingHours / daysRemaining) * 10) / 10;
  const isPaceCapped = rawRequiredDailyHours > MAX_SUSTAINABLE_DAILY_HOURS;
  const cappedSafeDailyHours = isPaceCapped ? MAX_SUSTAINABLE_DAILY_HOURS : rawRequiredDailyHours;

  // Determine Burnout Risk Tier
  let burnoutRisk: BurnoutRiskLevel = 'sustainable';
  let burnoutScore = 20;

  if (rawRequiredDailyHours > MAX_SUSTAINABLE_DAILY_HOURS || rawRequiredDailyHours > dailyCapacityHours * 1.1) {
    burnoutRisk = 'critical';
    burnoutScore = Math.min(100, Math.round(75 + (rawRequiredDailyHours - MAX_SUSTAINABLE_DAILY_HOURS) * 10));
  } else if (rawRequiredDailyHours > 3.5 || rawRequiredDailyHours > dailyCapacityHours * 0.75) {
    burnoutRisk = 'elevated';
    burnoutScore = Math.round(45 + (rawRequiredDailyHours / dailyCapacityHours) * 30);
  } else {
    burnoutRisk = 'sustainable';
    burnoutScore = Math.max(10, Math.round((rawRequiredDailyHours / dailyCapacityHours) * 40));
  }

  // Topic Triage: Prioritize units & chapters; deprioritize leaf concepts if critical
  let prioritized: StudyTopic[] = [...unmasteredTopics];
  let deprioritized: StudyTopic[] = [];

  if (isPaceCapped && unmasteredTopics.length > 2) {
    // Sort so units & chapters come first
    const hierarchyRank = (topic: StudyTopic) => {
      if (topic.level === 'unit') return 1;
      if (topic.level === 'chapter') return 2;
      return 3;
    };

    const sorted = [...unmasteredTopics].sort((a, b) => {
      const rankDiff = hierarchyRank(a) - hierarchyRank(b);
      if (rankDiff !== 0) return rankDiff;
      return a.orderIndex - b.orderIndex;
    });

    // Calculate how many topics fit into the safe capped hours
    const totalSafeAvailableHours = cappedSafeDailyHours * daysRemaining;
    let accumulatedHours = 0;
    const kept: StudyTopic[] = [];
    const dropped: StudyTopic[] = [];

    for (const topic of sorted) {
      const topicHour = topic.masteryLevel === 'learning' ? learningHours : unstudiedHours;
      if (accumulatedHours + topicHour <= totalSafeAvailableHours || kept.length < 2) {
        kept.push(topic);
        accumulatedHours += topicHour;
      } else {
        dropped.push(topic);
      }
    }

    prioritized = kept;
    deprioritized = dropped;
  }

  // Editorial Copy (anti-shame, calm, grounded)
  let advisoryHeadline: string;
  let compassionateAdvice: string;
  const actionableAdjustments: string[] = [];

  if (burnoutRisk === 'critical') {
    advisoryHeadline = `Burnout Guard: Daily study capped at ${MAX_SUSTAINABLE_DAILY_HOURS}h`;
    compassionateAdvice =
      `Covering all remaining syllabus items would require ${rawRequiredDailyHours}h/day, which risks cognitive exhaustion and sleep deprivation. To protect your cognitive stamina, Solis has capped your daily pace at ${MAX_SUSTAINABLE_DAILY_HOURS}h and triaged ${deprioritized.length} lower-weight concepts so you master core foundations with calm confidence.`;
    actionableAdjustments.push(`Focus 100% of your energy on the ${prioritized.length} prioritized core topics.`);
    actionableAdjustments.push(`Defer ${deprioritized.length} optional concepts to post-exam learning.`);
    actionableAdjustments.push('Enforce a mandatory 30-minute evening cognitive wind-down.');
  } else if (burnoutRisk === 'elevated') {
    advisoryHeadline = `Intensive Pace: ${rawRequiredDailyHours}h daily prep needed`;
    compassionateAdvice =
      `Your exam is in ${daysRemaining} days. At ${rawRequiredDailyHours}h/day, you are on track, but maintain recovery buffers between deep focus blocks to sustain retention.`;
    actionableAdjustments.push('Use 50/10 Pomodoro intervals with zero screen exposure on breaks.');
    actionableAdjustments.push('Front-load highest-friction flashcard drills to morning hours.');
  } else {
    advisoryHeadline = `Sustainable Cadence: ${rawRequiredDailyHours}h/day`;
    compassionateAdvice =
      `Your current pace of ${rawRequiredDailyHours}h/day is well within healthy cognitive limits (${daysRemaining} days remaining). Memory consolidation and retention will remain optimal.`;
    actionableAdjustments.push('Maintain regular daily review drills.');
    actionableAdjustments.push('Schedule 1 full rest day each week to consolidate long-term memory.');
  }

  return {
    targetExamDate: input.targetExamDate,
    daysRemaining,
    totalTopics,
    unmasteredTopicsCount: unmasteredTopics.length,
    masteredTopicsCount: masteredTopics.length,
    estimatedRemainingHours,
    rawRequiredDailyHours,
    cappedSafeDailyHours,
    isPaceCapped,
    burnoutRisk,
    burnoutScore,
    recommendedTopicsToPrioritize: prioritized,
    deprioritizedTopics: deprioritized,
    advisoryHeadline,
    compassionateAdvice,
    actionableAdjustments
  };
}
