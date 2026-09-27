import { describe, it, expect } from 'vitest';
import {
  computeHabitHeatmap,
  computeCategoryInsights,
  computeChainRiskHabits
} from '../habitInsights';
import { Habit } from '../../../types/habit';
import { getISODateString } from '../../date';

const REFERENCE = new Date(2026, 8, 23, 19, 0, 0); // Wed Sep 23 2026, 7pm

function isoDaysAgo(days: number): string {
  const d = new Date(REFERENCE);
  d.setDate(d.getDate() - days);
  return getISODateString(d);
}

function makeHabit(partial: Partial<Habit>): Habit {
  return {
    id: 'h',
    title: 'Review flashcards',
    category: 'study',
    frequency: 'daily',
    color: 'coral',
    currentStreak: 0,
    longestStreak: 0,
    completedToday: false,
    history: {},
    ...partial
  } as Habit;
}

describe('computeHabitHeatmap', () => {
  it('marks done, missed, and excused days correctly for boolean habits', () => {
    const habit = makeHabit({
      history: { [isoDaysAgo(0)]: true, [isoDaysAgo(2)]: true },
      amnestyDates: [isoDaysAgo(1)]
    });
    const cells = computeHabitHeatmap(habit, 5, REFERENCE);
    expect(cells).toHaveLength(5);
    expect(cells[4]).toMatchObject({ status: 'done' }); // today
    expect(cells[3]).toMatchObject({ status: 'excused' }); // amnesty yesterday
    expect(cells[2]).toMatchObject({ status: 'done' }); // 2 days ago
    expect(cells[1]).toMatchObject({ status: 'missed' });
    expect(cells[0]).toMatchObject({ status: 'missed' });
  });

  it('grades quantitative days by tier', () => {
    const habit = makeHabit({
      kind: 'quantitative',
      targetValue: 20,
      baseTierValue: 5,
      valueHistory: { [isoDaysAgo(0)]: 12 }
    });
    const cells = computeHabitHeatmap(habit, 2, REFERENCE);
    expect(cells[1]).toMatchObject({ status: 'partial', value: 12 });
    expect(cells[0]).toMatchObject({ status: 'missed', value: 0 });
  });
});

describe('computeCategoryInsights', () => {
  it('computes per-category completion rates and sorts strongest first', () => {
    const wellness = makeHabit({ id: 'w1', category: 'wellness', history: { [isoDaysAgo(0)]: true } });
    const study = makeHabit({
      id: 's1',
      category: 'study',
      history: Object.fromEntries(Array.from({ length: 30 }, (_, i) => [isoDaysAgo(i), true]))
    });
    const insights = computeCategoryInsights([wellness, study], 30, REFERENCE);
    expect(insights[0].category).toBe('study');
    expect(insights[0].completionRate).toBeCloseTo(1, 2);
    expect(insights.find((c) => c.category === 'wellness')?.completionRate).toBeCloseTo(1 / 30, 3);
  });
});

describe('computeChainRiskHabits', () => {
  it('flags an incomplete 7+ day streak late in the day', () => {
    const atRisk = makeHabit({ currentStreak: 12 });
    const safe = makeHabit({ id: 'safe', currentStreak: 2 });
    const done = makeHabit({ id: 'done', currentStreak: 30, completedToday: true });
    const weekendOff = makeHabit({ id: 'wk', frequency: 'weekends', currentStreak: 10 });
    const risks = computeChainRiskHabits([atRisk, safe, done, weekendOff], 18, REFERENCE);
    expect(risks.map((r) => r.habit.id)).toEqual(['h']);
    expect(risks[0].hoursLeft).toBeGreaterThanOrEqual(0);
  });
});
