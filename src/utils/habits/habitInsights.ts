import { Habit } from '../../types/habit';
import { getISODateString } from '../date';
import { evaluateHabitTier } from './tieredHabits';

/**
 * Phase 4 — habit insight derivations (P4.1, P4.6, P4.7).
 * Pure, deterministic functions over the habit domain model.
 */

export type HabitDayStatus = 'done' | 'partial' | 'excused' | 'missed';

export interface HabitHeatmapCell {
  date: string;
  status: HabitDayStatus;
  /** Quantitative value recorded that day (0 for boolean habits). */
  value: number;
}

/**
 * P4.1 — trailing `days`-day completion heatmap for one habit, oldest →
 * newest. Quantitative habits grade each day by its recorded tier; boolean
 * habits are done/missed; amnesty dates render as "excused", never missed.
 */
export function computeHabitHeatmap(habit: Habit, days = 90, referenceDate = new Date()): HabitHeatmapCell[] {
  const cells: HabitHeatmapCell[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    d.setDate(d.getDate() - i);
    const date = getISODateString(d);
    const isQuant = habit.kind === 'quantitative';
    const value = isQuant ? habit.valueHistory?.[date] ?? 0 : habit.history[date] === true ? 1 : 0;

    let status: HabitDayStatus;
    if ((habit.amnestyDates || []).includes(date)) {
      status = 'excused';
    } else if (isQuant) {
      if (value <= 0) status = 'missed';
      else {
        const tier = evaluateHabitTier(value, habit);
        status = tier === 'target' || tier === 'stretch' ? 'done' : 'partial';
      }
    } else {
      status = value > 0 ? 'done' : 'missed';
    }

    cells.push({ date, status, value });
  }
  return cells;
}

export interface HabitCategoryInsight {
  category: Habit['category'];
  /** Completed habit-days / expected slots over the trailing window (0–1). */
  completionRate: number;
  completions: number;
  habitsCount: number;
}

/**
 * P4.6 — completion rate per habit category over the trailing 30 days,
 * so the scholar can see which life area is strongest ("Wellness 87% —
 * strongest this month").
 */
export function computeCategoryInsights(
  habits: Habit[],
  windowDays = 30,
  referenceDate = new Date()
): HabitCategoryInsight[] {
  const categories: Habit['category'][] = ['study', 'wellness', 'mindset', 'routine'];
  const dayKeys: string[] = [];
  for (let i = windowDays - 1; i >= 0; i--) {
    const d = new Date(referenceDate.getFullYear(), referenceDate.getMonth(), referenceDate.getDate());
    d.setDate(d.getDate() - i);
    dayKeys.push(getISODateString(d));
  }

  return categories
    .map((category) => {
      const group = habits.filter((h) => h.category === category);
      let completions = 0;
      for (const h of group) {
        for (const day of dayKeys) {
          if (h.history[day] === true) completions += 1;
        }
      }
      const slots = group.length * windowDays;
      return {
        category,
        completionRate: slots > 0 ? Math.min(1, completions / slots) : 0,
        completions,
        habitsCount: group.length
      };
    })
    .filter((c) => c.habitsCount > 0)
    .sort((a, b) => b.completionRate - a.completionRate);
}

export interface ChainRiskHabit {
  habit: Habit;
  /** Whole hours remaining before midnight local time. */
  hoursLeft: number;
}

/**
 * P4.7 — habits whose meaningful streak (7+ days) is at risk today: not yet
 * completed, scheduled today, and at least `thresholdHours` past midnight.
 */
export function computeChainRiskHabits(
  habits: Habit[],
  thresholdHours = 18,
  referenceDate = new Date()
): ChainRiskHabit[] {
  const todayKey = getISODateString(referenceDate);
  const dow = referenceDate.getDay();
  const hoursLeft = Math.max(0, 23 - referenceDate.getHours());

  return habits
    .filter((h) => {
      if (h.completedToday || h.history[todayKey] === true) return false;
      if ((h.currentStreak || 0) < 7) return false;
      if (h.frequency === 'weekdays' && (dow === 0 || dow === 6)) return false;
      if (h.frequency === 'weekends' && dow !== 0 && dow !== 6) return false;
      if (Array.isArray(h.customDays) && h.customDays.length > 0 && !h.customDays.includes(dow)) return false;
      return hoursLeft <= (24 - thresholdHours);
    })
    .map((habit) => ({ habit, hoursLeft }));
}
