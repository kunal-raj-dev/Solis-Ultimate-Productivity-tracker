import { describe, it, expect } from 'vitest';
import {
  computeRequiredWeeklyHours,
  generateGoalStudyPlanDrafts
} from '../goalPlanGenerator';
import { Goal } from '../../../types/goal';
import { StudyTopic } from '../../../types/study';

// Wednesday, Sep 23 2026 (local). Exam on Nov 4 2026 (~6 weeks out).
const REFERENCE = new Date(2026, 8, 23, 12, 0, 0);
const TARGET = '2026-11-04';

function makeGoal(partial: Partial<Goal>): Goal {
  return {
    id: 'g1',
    title: 'Physics Midterm',
    status: 'active',
    category: 'academic',
    horizon: 'monthly',
    priority: 'high',
    color: 'coral',
    targetDate: TARGET,
    progressPercentage: 0,
    milestones: [],
    ...partial
  } as Goal;
}

function makeTopic(partial: Partial<StudyTopic>): StudyTopic {
  return {
    id: 't',
    subjectId: 'sub-1',
    title: 'Topic',
    masteryLevel: 'unstudied',
    ...partial
  } as StudyTopic;
}

describe('computeRequiredWeeklyHours', () => {
  it('scales with unmastered topics and remaining weeks', () => {
    const topics = [makeTopic({}), makeTopic({ masteryLevel: 'learning' }), makeTopic({ masteryLevel: 'mastered' })];
    const hours = computeRequiredWeeklyHours({ topics, targetDate: TARGET, referenceDate: REFERENCE });
    // 2 open topics × 90m = 180m = 3h over ~6 weeks → 0.5h/week
    expect(hours).toBeCloseTo(0.5, 1);
  });

  it('returns 0 for an invalid target date', () => {
    expect(computeRequiredWeeklyHours({ topics: [makeTopic({})], targetDate: '', referenceDate: REFERENCE })).toBe(0);
  });
});

describe('generateGoalStudyPlanDrafts', () => {
  it('spreads sessions across spaced weekdays and stops before the exam date', () => {
    const goal = makeGoal({});
    const topics = [makeTopic({ title: 'Kinematics' }), makeTopic({ title: 'Thermodynamics' })];
    const drafts = generateGoalStudyPlanDrafts({ goal, topics, sessionsPerWeek: 3, minutesPerSession: 60, weeks: 6, referenceDate: REFERENCE });

    expect(drafts.length).toBeGreaterThan(0);
    expect(drafts.length).toBeLessThanOrEqual(6 * 3);
    // Titles cycle through open topics
    expect(drafts[0].title).toContain('Kinematics');
    expect(drafts[1].title).toContain('Thermodynamics');
    // Nothing scheduled on/after the exam date
    for (const d of drafts) {
      expect(d.scheduledDate < TARGET).toBe(true);
    }
    // Exam within 14 days → priority escalates; here ~6 weeks → medium
    expect(drafts.every((d) => d.priority === 'medium')).toBe(true);
  });

  it('escalates priority when the exam is imminent', () => {
    const goal = makeGoal({ targetDate: '2026-09-28' }); // 5 days out
    const drafts = generateGoalStudyPlanDrafts({ goal, topics: [], weeks: 2, referenceDate: REFERENCE });
    expect(drafts.every((d) => d.priority === 'high')).toBe(true);
    expect(drafts[0].title).toContain('Physics Midterm');
  });

  it('returns nothing without a usable target date', () => {
    expect(generateGoalStudyPlanDrafts({ goal: makeGoal({ targetDate: '' }), topics: [], referenceDate: REFERENCE })).toEqual([]);
  });
});
