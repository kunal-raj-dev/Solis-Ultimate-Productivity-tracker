import { Habit, HabitTierLevel } from '../../types/habit';
import { calculateStreaks, StreakCalculationOptions, StreakResult } from '../streaks';

/**
 * Solis - Quantitative & Multi-Tier Habit Tracking Engine
 *
 * Implements non-punitive 3-tier progress mechanics:
 * - Tier 1: Base Tier (Minimum Viable Habit): keeps momentum alive on heavy/exam days, protects streak.
 * - Tier 2: Target Tier (Optimal Daily Goal): expected full commitment.
 * - Tier 3: Stretch Tier (Mastery / Peak Flow): aspirational high-energy accomplishment.
 */

export interface TierThresholds {
  base: number;
  target: number;
  stretch: number;
}

export interface TierMeta {
  tier: HabitTierLevel | null;
  label: string;
  subLabel?: string;
  shortLabel: string;
  badgeVariant: 'neutral' | 'amber' | 'sage' | 'coral';
  description: string;
}

export interface TierProgressInfo {
  current: number;
  thresholds: TierThresholds;
  tier: HabitTierLevel | null;
  percentToTarget: number;
  percentToStretch: number;
  remainingForBase: number;
  remainingForTarget: number;
  remainingForStretch: number;
  statusMessage: string;
}

export interface TieredStreakResult extends StreakResult {
  targetStreak: number;
  totalCompletions: number;
  baseDaysCount: number;
  targetDaysCount: number;
  stretchDaysCount: number;
}

/**
 * Resolves standard 3-tier thresholds for any habit.
 * If user hasn't customized base or stretch, gentle heuristic defaults are applied.
 */
export function getTierThresholds(
  habit: Pick<Habit, 'kind' | 'targetValue' | 'baseTierValue' | 'stretchTierValue'>
): TierThresholds {
  const target = Math.max(1, habit.targetValue || 1);
  const base = habit.baseTierValue !== undefined && habit.baseTierValue > 0
    ? habit.baseTierValue
    : target > 1 ? Math.max(1, Math.round(target * 0.3)) : 1;
  const stretch = habit.stretchTierValue !== undefined && habit.stretchTierValue >= target
    ? habit.stretchTierValue
    : target > 1 ? Math.round(target * 1.5) : 2;

  return {
    base,
    target,
    stretch
  };
}

/**
 * Evaluates which tier a given numeric progress level satisfies.
 * Non-punitive: Base tier counts as streak-preserving completion.
 */
export function evaluateHabitTier(
  value: number,
  habit: Pick<Habit, 'kind' | 'targetValue' | 'baseTierValue' | 'stretchTierValue'>
): HabitTierLevel | null {
  if (value <= 0) return null;

  if (habit.kind === 'boolean') {
    return value >= 1 ? 'target' : null;
  }

  const { base, target, stretch } = getTierThresholds(habit);

  if (value >= stretch) {
    return 'stretch';
  }
  if (value >= target) {
    return 'target';
  }
  if (value >= base) {
    return 'base';
  }
  return null;
}

/**
 * Returns UI metadata (labels, badge styling, encouragement) for a given tier.
 */
export function getTierMeta(tier: HabitTierLevel | null): TierMeta {
  switch (tier) {
    case 'stretch':
      return {
        tier: 'stretch',
        label: 'Mastery Stretch Unlocked',
        shortLabel: 'Stretch',
        badgeVariant: 'coral',
        description: 'Deep focus flow reached. Aspirational challenge conquered.'
      };
    case 'target':
      return {
        tier: 'target',
        label: 'Target Goal Achieved',
        shortLabel: 'Target',
        badgeVariant: 'sage',
        description: 'Optimal daily consistency fulfilled.'
      };
    case 'base':
      return {
        tier: 'base',
        label: 'Base Tier Met',
        subLabel: 'Streak Protected',
        shortLabel: 'Base',
        badgeVariant: 'amber',
        description: 'Minimum viable habit completed. Momentum preserved with grace.'
      };
    case null:
    default:
      return {
        tier: null,
        label: 'Pending Check-In',
        shortLabel: '—',
        badgeVariant: 'neutral',
        description: 'Ready whenever you are.'
      };
  }
}

/**
 * Calculates detailed progress statistics and compassionate guidance for the day.
 */
export function getTierProgressInfo(currentValue: number, habit: Habit): TierProgressInfo {
  const current = Math.max(0, currentValue || 0);
  const thresholds = getTierThresholds(habit);
  const tier = evaluateHabitTier(current, habit);
  const unit = habit.unit ? ` ${habit.unit}` : '';

  const percentToTarget = Math.min(100, Math.round((current / thresholds.target) * 100));
  const percentToStretch = Math.min(100, Math.round((current / thresholds.stretch) * 100));

  const remainingForBase = Math.max(0, thresholds.base - current);
  const remainingForTarget = Math.max(0, thresholds.target - current);
  const remainingForStretch = Math.max(0, thresholds.stretch - current);

  let statusMessage: string;
  if (tier === 'stretch') {
    statusMessage = `Mastery achieved! Surpassed stretch by ${current - thresholds.stretch}${unit}.`;
  } else if (tier === 'target') {
    statusMessage = remainingForStretch > 0
      ? `Target locked! ${remainingForStretch}${unit} to reach mastery stretch.`
      : `Target locked in!`;
  } else if (tier === 'base') {
    statusMessage = `Streak protected! ${remainingForTarget}${unit} to reach optimal target.`;
  } else {
    statusMessage = `Low-energy floor: ${thresholds.base}${unit} to protect your streak.`;
  }

  return {
    current,
    thresholds,
    tier,
    percentToTarget,
    percentToStretch,
    remainingForBase,
    remainingForTarget,
    remainingForStretch,
    statusMessage
  };
}

/**
 * Extended streak engine for multi-tier habits.
 * Evaluates base tier as streak-preserving, while also calculating
 * the uninterrupted target-tier streak and tier breakdown.
 */
export function calculateTieredStreak(
  habit: Habit,
  options?: StreakCalculationOptions | string
): TieredStreakResult {
  const history = habit.history || {};
  const baseStreaks = calculateStreaks(history, options);

  // Compute target-tier-only history
  const targetHistory: Record<string, boolean> = {};
  const valueHistory = habit.valueHistory || {};
  const thresholds = getTierThresholds(habit);

  let baseDaysCount = 0;
  let targetDaysCount = 0;
  let stretchDaysCount = 0;
  let totalCompletions = 0;

  for (const [dateStr, isDone] of Object.entries(history)) {
    if (!isDone) continue;
    totalCompletions++;

    if (habit.kind === 'quantitative') {
      const val = valueHistory[dateStr] ?? (isDone ? thresholds.target : 0);
      const tier = evaluateHabitTier(val, habit);
      if (tier === 'stretch') {
        stretchDaysCount++;
        targetDaysCount++;
        targetHistory[dateStr] = true;
      } else if (tier === 'target') {
        targetDaysCount++;
        targetHistory[dateStr] = true;
      } else if (tier === 'base') {
        baseDaysCount++;
        targetHistory[dateStr] = false;
      }
    } else {
      targetDaysCount++;
      targetHistory[dateStr] = true;
    }
  }

  const targetStreaks = calculateStreaks(targetHistory, options);

  return {
    ...baseStreaks,
    targetStreak: targetStreaks.currentStreak,
    totalCompletions,
    baseDaysCount,
    targetDaysCount,
    stretchDaysCount
  };
}

/**
 * Formats habit progress for badges, cards, or notifications.
 */
export function formatHabitProgress(value: number, habit: Habit): string {
  if (habit.kind !== 'quantitative') {
    return value >= 1 ? 'Completed' : 'Not Done';
  }
  const unit = habit.unit ? ` ${habit.unit}` : '';
  const thresholds = getTierThresholds(habit);
  return `${value} / ${thresholds.target}${unit}`;
}
