import { describe, it, expect } from 'vitest';
import {
  evaluateHabitTier,
  getTierThresholds,
  getTierMeta,
  getTierProgressInfo,
  calculateTieredStreak,
  formatHabitProgress
} from '../tieredHabits';
import { Habit } from '../../../types/habit';

describe('TieredHabits Engine', () => {
  const mockQuantitativeHabit: Habit = {
    id: 'hab_read',
    title: 'Textbook Reading',
    category: 'study',
    frequency: 'daily',
    color: 'emerald',
    kind: 'quantitative',
    unit: 'pages',
    targetValue: 20,
    baseTierValue: 5,
    stretchTierValue: 35,
    currentStreak: 0,
    longestStreak: 0,
    completedToday: false,
    history: {},
    valueHistory: {},
    createdAt: '2026-01-01T00:00:00Z',
    updatedAt: '2026-01-01T00:00:00Z'
  };

  describe('getTierThresholds', () => {
    it('honors explicitly provided base and stretch values', () => {
      const thresholds = getTierThresholds(mockQuantitativeHabit);
      expect(thresholds).toEqual({
        base: 5,
        target: 20,
        stretch: 35
      });
    });

    it('derives sensible defaults when base and stretch are omitted', () => {
      const habit: Pick<Habit, 'kind' | 'targetValue'> = {
        kind: 'quantitative',
        targetValue: 50
      };
      const thresholds = getTierThresholds(habit);
      expect(thresholds.target).toBe(50);
      expect(thresholds.base).toBe(15); // 30% of 50
      expect(thresholds.stretch).toBe(75); // 150% of 50
    });

    it('ensures minimum viable base is at least 1 for low target values', () => {
      const habit: Pick<Habit, 'kind' | 'targetValue'> = {
        kind: 'quantitative',
        targetValue: 2
      };
      const thresholds = getTierThresholds(habit);
      expect(thresholds.base).toBe(1);
      expect(thresholds.stretch).toBe(3);
    });
  });

  describe('evaluateHabitTier', () => {
    it('returns null for non-positive values', () => {
      expect(evaluateHabitTier(0, mockQuantitativeHabit)).toBeNull();
      expect(evaluateHabitTier(-5, mockQuantitativeHabit)).toBeNull();
    });

    it('evaluates boolean habits as target or null', () => {
      const booleanHabit: Pick<Habit, 'kind'> = { kind: 'boolean' };
      expect(evaluateHabitTier(0, booleanHabit)).toBeNull();
      expect(evaluateHabitTier(1, booleanHabit)).toBe('target');
    });

    it('correctly categorizes values into base, target, and stretch tiers', () => {
      // Thresholds: base: 5, target: 20, stretch: 35
      expect(evaluateHabitTier(2, mockQuantitativeHabit)).toBeNull();
      expect(evaluateHabitTier(5, mockQuantitativeHabit)).toBe('base');
      expect(evaluateHabitTier(12, mockQuantitativeHabit)).toBe('base');
      expect(evaluateHabitTier(20, mockQuantitativeHabit)).toBe('target');
      expect(evaluateHabitTier(30, mockQuantitativeHabit)).toBe('target');
      expect(evaluateHabitTier(35, mockQuantitativeHabit)).toBe('stretch');
      expect(evaluateHabitTier(50, mockQuantitativeHabit)).toBe('stretch');
    });
  });

  describe('getTierMeta', () => {
    it('provides compassionate, non-punitive metadata for each tier', () => {
      const baseMeta = getTierMeta('base');
      expect(baseMeta.label).toBe('Base Tier Met');
      expect(baseMeta.subLabel).toBe('Streak Protected');
      expect(baseMeta.badgeVariant).toBe('amber');

      const targetMeta = getTierMeta('target');
      expect(targetMeta.label).toBe('Target Goal Achieved');
      expect(targetMeta.badgeVariant).toBe('sage');

      const stretchMeta = getTierMeta('stretch');
      expect(stretchMeta.label).toBe('Mastery Stretch Unlocked');
      expect(stretchMeta.badgeVariant).toBe('coral');

      const nullMeta = getTierMeta(null);
      expect(nullMeta.label).toBe('Pending Check-In');
      expect(nullMeta.badgeVariant).toBe('neutral');
    });
  });

  describe('getTierProgressInfo', () => {
    it('calculates progress percentages and remaining quantities accurately', () => {
      const info = getTierProgressInfo(15, mockQuantitativeHabit);
      expect(info.current).toBe(15);
      expect(info.tier).toBe('base');
      expect(info.percentToTarget).toBe(75); // 15 / 20 = 75%
      expect(info.remainingForTarget).toBe(5);
      expect(info.remainingForStretch).toBe(20);
      expect(info.statusMessage).toContain('Streak protected');
    });

    it('emits mastery message when stretch tier is surpassed', () => {
      const info = getTierProgressInfo(40, mockQuantitativeHabit);
      expect(info.tier).toBe('stretch');
      expect(info.statusMessage).toContain('Mastery achieved');
      expect(info.statusMessage).toContain('5 pages');
    });

    it('emits low-energy encouragement when below base tier', () => {
      const info = getTierProgressInfo(2, mockQuantitativeHabit);
      expect(info.tier).toBeNull();
      expect(info.statusMessage).toContain('Low-energy floor: 5 pages to protect your streak');
    });
  });

  describe('calculateTieredStreak', () => {
    it('preserves the streak when only the base tier is reached', () => {
      // 3 days where user only did base tier (5 pages)
      const habit: Habit = {
        ...mockQuantitativeHabit,
        history: {
          '2026-09-01': true,
          '2026-09-02': true,
          '2026-09-03': true
        },
        valueHistory: {
          '2026-09-01': 5,
          '2026-09-02': 5,
          '2026-09-03': 5
        }
      };

      const result = calculateTieredStreak(habit, { referenceDate: new Date('2026-09-03T12:00:00') });
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
      expect(result.baseDaysCount).toBe(3);
      expect(result.targetDaysCount).toBe(0);
      expect(result.stretchDaysCount).toBe(0);
      expect(result.targetStreak).toBe(0);
    });

    it('correctly tallies multi-tier breakdown and uninterrupted target streak', () => {
      const habit: Habit = {
        ...mockQuantitativeHabit,
        history: {
          '2026-09-01': true, // 5 pages (base)
          '2026-09-02': true, // 20 pages (target)
          '2026-09-03': true, // 35 pages (stretch)
          '2026-09-04': true  // 25 pages (target)
        },
        valueHistory: {
          '2026-09-01': 5,
          '2026-09-02': 20,
          '2026-09-03': 35,
          '2026-09-04': 25
        }
      };

      const result = calculateTieredStreak(habit, { referenceDate: new Date('2026-09-04T12:00:00') });
      expect(result.currentStreak).toBe(4);
      expect(result.totalCompletions).toBe(4);
      expect(result.baseDaysCount).toBe(1);
      expect(result.targetDaysCount).toBe(3);
      expect(result.stretchDaysCount).toBe(1);
      expect(result.targetStreak).toBe(3); // days 2, 3, 4 reached target or higher
    });
  });

  describe('formatHabitProgress', () => {
    it('formats quantitative habit progress with unit', () => {
      expect(formatHabitProgress(15, mockQuantitativeHabit)).toBe('15 / 20 pages');
    });

    it('formats boolean habit progress', () => {
      const booleanHabit: Habit = {
        ...mockQuantitativeHabit,
        kind: 'boolean'
      };
      expect(formatHabitProgress(1, booleanHabit)).toBe('Completed');
      expect(formatHabitProgress(0, booleanHabit)).toBe('Not Done');
    });
  });
});
