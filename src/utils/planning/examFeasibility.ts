/**
 * Solis — Exam Feasibility & Visual Time-Cushion Engine (F-104)
 *
 * Grounded in Shovel "Time Cushion Technology" and Solis anti-shame principles.
 * Translates abstract countdowns and raw hours into visual feasibility tiers,
 * pace realism scores (0-100), and interactive what-if simulations.
 *
 * Pure, deterministic functions only — zero DOM or side effects (master.md §18).
 */

import {
  TimeCushionAnalysis,
  TimeCushionInput,
  calculateTimeCushion,
  formatCushionHours
} from './timeCushion';

export type FeasibilityTier = 'optimal' | 'feasible' | 'demanding' | 'infeasible';

export interface ExamFeasibilityAnalysis {
  cushion: TimeCushionAnalysis;
  feasibilityScore: number; // 0 to 100
  tier: FeasibilityTier;
  tierLabel: string;
  tierColor: string;
  badgeVariant: 'sage' | 'amber' | 'coral';
  requiredDailyHours: number;
  studentDailyCapacityHours: number;
  capacityUtilizationPercentage: number;
  paceRealismRatio: number; // required / capacity (1.0 = 100% capacity)
  headline: string;
  recommendation: string;
  actionableSteps: string[];
}

export const FEASIBILITY_TIER_META: Record<
  FeasibilityTier,
  { label: string; color: string; badgeVariant: 'sage' | 'amber' | 'coral' }
> = {
  optimal: { label: 'Optimal Cushion', color: 'var(--color-sage-500)', badgeVariant: 'sage' },
  feasible: { label: 'Feasible Pace', color: 'var(--color-sage-500)', badgeVariant: 'sage' },
  demanding: { label: 'Demanding Pace', color: 'var(--color-amber-500)', badgeVariant: 'amber' },
  infeasible: { label: 'Scope Deficit', color: 'var(--color-coral-500)', badgeVariant: 'coral' }
};

/**
 * Calculates exam feasibility metrics from a computed TimeCushionAnalysis
 * and the student's daily focus capacity (in minutes).
 */
export function calculateExamFeasibility(
  cushion: TimeCushionAnalysis,
  dailyCapacityMinutes: number = 360
): ExamFeasibilityAnalysis {
  const capacityHours = Math.max(0.5, dailyCapacityMinutes / 60);
  const requiredDailyHours = cushion.requiredHoursPerDay;
  const paceRealismRatio = requiredDailyHours / capacityHours;
  const capacityUtilizationPercentage = Math.round(paceRealismRatio * 100);

  let tier: FeasibilityTier;
  let feasibilityScore: number;
  let headline: string;
  let recommendation: string;
  const actionableSteps: string[] = [];

  // When 0 topics remaining or cushion is very positive
  if (cushion.estimatedHoursRequired <= 0) {
    tier = 'optimal';
    feasibilityScore = 100;
    headline = 'Syllabus Fully Mastered';
    recommendation = 'Maintain active recall with daily flashcard drills.';
    actionableSteps.push('Schedule light maintenance recall sessions (15-20m).');
  } else if (cushion.cushionHours >= 6 && paceRealismRatio <= 0.7) {
    tier = 'optimal';
    feasibilityScore = Math.min(100, Math.round(85 + Math.min(15, cushion.cushionHours)));
    headline = `Comfortable +${formatCushionHours(cushion.cushionHours)}h Time Cushion`;
    recommendation = 'Your scheduled pace leaves generous buffer for review drills and rest.';
    actionableSteps.push('Pace steady: continue planned study blocks without cramming.');
    actionableSteps.push('Lock in mock exam practice 4 days prior to target date.');
  } else if (cushion.cushionHours >= 0 && paceRealismRatio <= 1.0) {
    tier = 'feasible';
    feasibilityScore = Math.round(70 + (1 - paceRealismRatio) * 15);
    headline = `On Track (${formatCushionHours(cushion.cushionHours)}h Cushion)`;
    recommendation = `Requires ${formatCushionHours(requiredDailyHours)}h daily prep (${capacityUtilizationPercentage}% of capacity).`;
    actionableSteps.push(`Protect daily ${formatCushionHours(requiredDailyHours)}h deep work blocks.`);
    actionableSteps.push('Review high-yield flashcard decks during circadian peak hours.');
  } else if (cushion.cushionHours > -5 && paceRealismRatio <= 1.25) {
    tier = 'demanding';
    feasibilityScore = Math.max(40, Math.round(55 + cushion.cushionHours * 3));
    const deficitAbs = formatCushionHours(Math.abs(cushion.cushionHours));
    headline = `Tight Horizon: ${deficitAbs}h Deficit at Current Pace`;
    recommendation = `Requires ${formatCushionHours(requiredDailyHours)}h/day. Minor scope triage or +45m daily study needed.`;
    actionableSteps.push('Add +45 minutes to your daily study routine to recover cushion.');
    actionableSteps.push('Triage lowest-weight syllabus topics to priority focus.');
  } else {
    tier = 'infeasible';
    const deficitAbs = formatCushionHours(Math.abs(cushion.cushionHours));
    feasibilityScore = Math.max(15, Math.round(35 - Math.min(20, Math.abs(cushion.cushionHours))));
    headline = `Critical Scope Deficit: -${deficitAbs}h`;
    recommendation = `Required pace (${formatCushionHours(requiredDailyHours)}h/day) exceeds realistic daily capacity.`;
    actionableSteps.push('Scope reduction: focus strictly on Core and High-Yield chapters.');
    actionableSteps.push('Eliminate non-essential routine commitments before exam week.');
    actionableSteps.push('Use active study rooms to double deep-work stamina.');
  }

  const meta = FEASIBILITY_TIER_META[tier];

  return {
    cushion,
    feasibilityScore,
    tier,
    tierLabel: meta.label,
    tierColor: meta.color,
    badgeVariant: meta.badgeVariant,
    requiredDailyHours,
    studentDailyCapacityHours: capacityHours,
    capacityUtilizationPercentage,
    paceRealismRatio,
    headline,
    recommendation,
    actionableSteps
  };
}

export interface SimulationParams {
  cushionInput: TimeCushionInput;
  extraDailyMinutes: number; // e.g. +30, +60, +90
  excludedTopicIds?: string[]; // triaged topics
}

/**
 * Interactive What-If simulation:
 * Calculates revised cushion and feasibility if the student adds study hours
 * or triages specific unmastered topics.
 */
export function simulateFeasibilityAdjustment(
  params: SimulationParams
): ExamFeasibilityAnalysis {
  const { cushionInput, extraDailyMinutes, excludedTopicIds = [] } = params;

  // Filter out triaged topics
  const remainingTopics = cushionInput.topics.filter(
    (t) => !excludedTopicIds.includes(t.id)
  );

  const revisedCapacity = cushionInput.dailyCapacityMinutes + extraDailyMinutes;

  const simulatedCushion = calculateTimeCushion({
    ...cushionInput,
    dailyCapacityMinutes: revisedCapacity,
    topics: remainingTopics
  });

  return calculateExamFeasibility(simulatedCushion, revisedCapacity);
}
