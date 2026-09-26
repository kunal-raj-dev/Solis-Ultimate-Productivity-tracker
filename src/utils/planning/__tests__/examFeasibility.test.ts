import { describe, it, expect } from 'vitest';
import {
  calculateExamFeasibility,
  simulateFeasibilityAdjustment
} from '../examFeasibility';
import { calculateTimeCushion, TimeCushionInput } from '../timeCushion';
import { StudyTopic } from '../../../types/study';

const makeTopic = (id: string, masteryLevel: StudyTopic['masteryLevel']): StudyTopic => ({
  id,
  subjectId: 'sub_1',
  title: `Topic ${id}`,
  orderIndex: 0,
  masteryLevel,
  createdAt: '2026-09-01T00:00:00Z',
  updatedAt: '2026-09-01T00:00:00Z'
});

describe('Exam Feasibility Engine (F-104)', () => {
  const refDate = new Date('2026-09-20T00:00:00Z');

  it('rates 100% feasibility when all topics are mastered', () => {
    const topics = [
      makeTopic('t1', 'mastered'),
      makeTopic('t2', 'mastered')
    ];
    const cushion = calculateTimeCushion({
      examDate: '2026-09-30',
      subjectId: 'sub_1',
      topics,
      dailyCapacityMinutes: 300,
      referenceDate: refDate
    });

    const feasibility = calculateExamFeasibility(cushion, 300);
    expect(feasibility.tier).toBe('optimal');
    expect(feasibility.feasibilityScore).toBe(100);
    expect(feasibility.badgeVariant).toBe('sage');
    expect(feasibility.headline).toContain('Fully Mastered');
  });

  it('rates optimal when available hours far exceed syllabus needs (+10h cushion)', () => {
    // 10 days remaining * 4h/day = 40h gross. 2 unstudied topics = 8h required. Cushion = +32h.
    const topics = [
      makeTopic('t1', 'unstudied'),
      makeTopic('t2', 'unstudied')
    ];
    const cushion = calculateTimeCushion({
      examDate: '2026-09-30',
      subjectId: 'sub_1',
      topics,
      dailyCapacityMinutes: 240, // 4h/day
      referenceDate: refDate
    });

    const feasibility = calculateExamFeasibility(cushion, 240);
    expect(feasibility.tier).toBe('optimal');
    expect(feasibility.feasibilityScore).toBeGreaterThanOrEqual(85);
    expect(feasibility.paceRealismRatio).toBeLessThan(0.7);
  });

  it('rates feasible when required pace is within student daily capacity', () => {
    // 5 days remaining * 2h/day = 10h available.
    // 2 learning topics (2h each) + 1 unstudied (4h) = 8h required.
    // Cushion = +2h. Required pace = 8h / 5d = 1.6h/day. Capacity = 2h/day.
    const topics = [
      makeTopic('t1', 'learning'),
      makeTopic('t2', 'learning'),
      makeTopic('t3', 'unstudied')
    ];
    const cushion = calculateTimeCushion({
      examDate: '2026-09-25',
      subjectId: 'sub_1',
      topics,
      dailyCapacityMinutes: 120, // 2h/day
      referenceDate: refDate
    });

    const feasibility = calculateExamFeasibility(cushion, 120);
    expect(feasibility.tier).toBe('feasible');
    expect(feasibility.feasibilityScore).toBeGreaterThanOrEqual(70);
    expect(feasibility.badgeVariant).toBe('sage');
  });

  it('diagnoses critical deficit as infeasible with calm prescriptive steps', () => {
    // 3 days remaining * 2h/day = 6h available.
    // 4 unstudied topics * 4h = 16h required.
    // Deficit = -10h. Required pace = 5.3h/day on a 2h capacity.
    const topics = [
      makeTopic('t1', 'unstudied'),
      makeTopic('t2', 'unstudied'),
      makeTopic('t3', 'unstudied'),
      makeTopic('t4', 'unstudied')
    ];
    const cushion = calculateTimeCushion({
      examDate: '2026-09-23',
      subjectId: 'sub_1',
      topics,
      dailyCapacityMinutes: 120,
      referenceDate: refDate
    });

    const feasibility = calculateExamFeasibility(cushion, 120);
    expect(feasibility.tier).toBe('infeasible');
    expect(feasibility.badgeVariant).toBe('coral');
    expect(feasibility.actionableSteps.length).toBeGreaterThan(0);
    expect(feasibility.headline).toContain('Deficit');
  });

  it('simulates adjustment: adding study time and triaging topics improves cushion', () => {
    // Base setup with demanding/deficit
    const topics = [
      makeTopic('t1', 'unstudied'), // 4h
      makeTopic('t2', 'unstudied'), // 4h
      makeTopic('t3', 'learning')   // 2h
    ];
    // 4 days * 2h/day = 8h available. Required = 10h. Deficit = -2h.
    const baseInput: TimeCushionInput = {
      examDate: '2026-09-24',
      subjectId: 'sub_1',
      topics,
      dailyCapacityMinutes: 120, // 2h
      referenceDate: refDate
    };

    const initial = calculateExamFeasibility(calculateTimeCushion(baseInput), 120);
    expect(initial.cushion.cushionHours).toBe(-2);

    // Simulation: add +60m daily (3h/day -> 12h available) AND triage t1 (save 4h)
    const simulated = simulateFeasibilityAdjustment({
      cushionInput: baseInput,
      extraDailyMinutes: 60,
      excludedTopicIds: ['t1']
    });

    // Revised available: 4d * 3h = 12h. Revised required: 6h. Cushion = +6h.
    expect(simulated.cushion.cushionHours).toBe(6);
    expect(simulated.tier).toBe('optimal');
    expect(simulated.feasibilityScore).toBeGreaterThanOrEqual(85);
  });
});
