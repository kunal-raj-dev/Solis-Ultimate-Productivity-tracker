import { describe, it, expect } from 'vitest';
import {
  calculateTimeCushion,
  projectRoutineCommitmentsByDay,
  formatCushionHours,
  TOPIC_ESTIMATED_HOURS
} from '../timeCushion';
import { StudyTopic } from '../../../types/study';
import { RecurringStudyRoutine, DayOfWeek } from '../../../types/planning';
import { addDays, getISODateString } from '../../date';

/**
 * Phase 2.1 — Multi-Day Lookahead Time Cushion Engine (plan §2.1)
 *
 * Verification gate: cushion calculations under a positive cushion (+12h),
 * a negative cushion (-8h), 0 days remaining, and an empty syllabus.
 *
 * All expectations are derived through `expectedDaysRemaining`, which mirrors
 * the plan's days-remaining formula (and the engine's shared date-parsing
 * convention with `calculateExamReadiness`). That keeps every assertion valid
 * in any machine timezone instead of hardcoding a day count.
 */

// Local-noon reference keeps weekday and date-key math timezone-stable.
const REFERENCE = new Date('2026-09-26T12:00:00');
const REFERENCE_KEY = getISODateString(REFERENCE);

const expectedDaysRemaining = (examDate: string): number =>
  Math.max(
    0,
    Math.ceil((new Date(examDate).getTime() - REFERENCE.getTime()) / (1000 * 60 * 60 * 24))
  );

const examNDaysOut = (days: number): string => getISODateString(addDays(REFERENCE, days));

/** Capacity that leaves exactly `targetCushion` hours after funding `requiredHours`. */
const capacityForCushion = (requiredHours: number, targetCushion: number, examDate: string): number =>
  Math.round(((requiredHours + targetCushion) / expectedDaysRemaining(examDate)) * 60);

const makeTopic = (overrides: Partial<StudyTopic> = {}): StudyTopic => ({
  id: 'topic_1',
  subjectId: 'subject_1',
  title: 'Consistency & CAP theorem',
  orderIndex: 1,
  masteryLevel: 'unstudied',
  createdAt: '',
  updatedAt: '',
  ...overrides
});

const makeRoutine = (overrides: Partial<RecurringStudyRoutine> = {}): RecurringStudyRoutine => ({
  id: 'routine_1',
  title: 'Morning lecture',
  subjectId: 'subject_1',
  targetMinutes: 90,
  daysOfWeek: [1, 3, 5],
  scheduledTime: '09:00',
  priority: 'high',
  isActive: true,
  createdAt: '',
  updatedAt: '',
  ...overrides
});

describe('calculateTimeCushion — plan §2.1 verification gate', () => {
  it('computes a positive cushion (+12h) with 3 unstudied topics and 4 study days', () => {
    const examDate = examNDaysOut(4);
    const days = expectedDaysRemaining(examDate);
    // 3 unstudied topics x 4h = 12h required; capacity sized so the cushion
    // lands at exactly +12h regardless of the machine timezone.
    const capacity = capacityForCushion(12, 12, examDate);

    const result = calculateTimeCushion({
      examDate,
      subjectId: 'subject_1',
      topics: [
        makeTopic({ id: 'topic_1' }),
        makeTopic({ id: 'topic_2', title: 'Sharding' }),
        makeTopic({ id: 'topic_3', title: 'Queues' })
      ],
      dailyCapacityMinutes: capacity,
      referenceDate: REFERENCE
    });

    expect(result.daysRemaining).toBe(days);
    expect(result.grossAvailableHours).toBe(days * (capacity / 60));
    expect(result.netAvailableStudyHours).toBe(days * (capacity / 60));
    expect(result.estimatedHoursRequired).toBe(12);
    expect(result.cushionHours).toBeCloseTo(12, 5);
    expect(result.requiredHoursPerDay).toBeCloseTo(12 / days, 5);
    expect(result.status).toBe('comfortable');
    expect(result.deficitSeverityPercentage).toBe(0);
  });

  it('subtracts scheduled commitments from the net available hours', () => {
    const examDate = examNDaysOut(4);
    const days = expectedDaysRemaining(examDate);
    const capacity = capacityForCushion(12, 12, examDate);
    const dayPlusTwo = getISODateString(addDays(REFERENCE, 2));

    const result = calculateTimeCushion({
      examDate,
      subjectId: 'subject_1',
      topics: [
        makeTopic({ id: 'topic_1' }),
        makeTopic({ id: 'topic_2', title: 'Sharding' }),
        makeTopic({ id: 'topic_3', title: 'Queues' })
      ],
      dailyCapacityMinutes: capacity,
      existingCommitmentsMinutesByDay: { [REFERENCE_KEY]: 120, [dayPlusTwo]: 60 },
      referenceDate: REFERENCE
    });

    expect(result.grossAvailableHours).toBe(days * (capacity / 60)); // gross ignores commitments
    expect(result.netAvailableStudyHours).toBeCloseTo(days * (capacity / 60) - 3, 5);
    expect(result.cushionHours).toBeCloseTo(days * (capacity / 60) - 3 - 12, 5);
    expect(result.status).toBe('comfortable');
  });

  it('computes a negative cushion (-8h deficit) and its severity', () => {
    const examDate = examNDaysOut(2);
    const days = expectedDaysRemaining(examDate);
    // 5 unstudied topics x 4h = 20h required vs the canonical 6h/day capacity.
    const result = calculateTimeCushion({
      examDate,
      subjectId: 'subject_1',
      topics: [
        makeTopic({ id: 'topic_1' }),
        makeTopic({ id: 'topic_2', title: 'Sharding' }),
        makeTopic({ id: 'topic_3', title: 'Queues' }),
        makeTopic({ id: 'topic_4', title: 'Consensus' }),
        makeTopic({ id: 'topic_5', title: 'Replication' })
      ],
      dailyCapacityMinutes: 360,
      referenceDate: REFERENCE
    });

    const expectedCushion = days * 6 - 20; // -8h on a 4-day-per-2-days horizon machine
    expect(result.estimatedHoursRequired).toBe(20);
    expect(result.cushionHours).toBeCloseTo(expectedCushion, 5);
    expect(result.status).toBe('critical_deficit');
    expect(result.deficitSeverityPercentage).toBe(
      Math.round((Math.max(0, -expectedCushion) / 20) * 100)
    );
  });

  it('clamps an at-or-past horizon to 0 days remaining with no available hours', () => {
    // Yesterday's LOCAL date (sanctioned helpers only — master.md §16.2) has a
    // UTC midnight that always lies at or before the local-noon reference, so
    // the engine's shared date-parse convention clamps it to 0 days remaining
    // in every timezone: the exam-day/overdue horizon is fully exhausted.
    const examAtOrPastHorizon = getISODateString(addDays(REFERENCE, -1));
    const result = calculateTimeCushion({
      examDate: examAtOrPastHorizon,
      subjectId: 'subject_1',
      topics: [makeTopic({ id: 'topic_1' }), makeTopic({ id: 'topic_2', title: 'Sharding' })],
      dailyCapacityMinutes: 360,
      existingCommitmentsMinutesByDay: { [REFERENCE_KEY]: 120 },
      referenceDate: REFERENCE
    });

    expect(result.daysRemaining).toBe(expectedDaysRemaining(examAtOrPastHorizon));
    expect(result.daysRemaining).toBe(0);
    expect(result.grossAvailableHours).toBe(0);
    expect(result.netAvailableStudyHours).toBe(0);
    expect(result.cushionHours).toBe(-8);
    expect(result.requiredHoursPerDay).toBe(8); // required / max(1, 0)
    expect(result.status).toBe('critical_deficit');
    expect(result.deficitSeverityPercentage).toBe(100);
  });

  it('treats an empty syllabus as requiring nothing', () => {
    const examDate = examNDaysOut(4);
    const capacity = capacityForCushion(0, 12, examDate);

    const result = calculateTimeCushion({
      examDate,
      subjectId: 'subject_1',
      topics: [makeTopic({ id: 'other', subjectId: 'subject_9' })],
      dailyCapacityMinutes: capacity,
      referenceDate: REFERENCE
    });

    expect(result.estimatedHoursRequired).toBe(0);
    expect(result.cushionHours).toBe(result.netAvailableStudyHours);
    expect(result.requiredHoursPerDay).toBe(0);
    expect(result.status).toBe('comfortable');
    expect(result.deficitSeverityPercentage).toBe(0);
  });

  it('excludes mastered topics and other subjects from the requirement', () => {
    const result = calculateTimeCushion({
      examDate: examNDaysOut(4),
      subjectId: 'subject_1',
      topics: [
        makeTopic({ id: 'topic_1', masteryLevel: 'mastered' }),
        makeTopic({ id: 'topic_2', title: 'Sharding', masteryLevel: 'mastered' }),
        makeTopic({ id: 'topic_3', title: 'Queues' }),
        makeTopic({ id: 'topic_4', title: 'Other subject', subjectId: 'subject_9' })
      ],
      dailyCapacityMinutes: 360,
      referenceDate: REFERENCE
    });

    expect(result.estimatedHoursRequired).toBe(TOPIC_ESTIMATED_HOURS.unstudied);
  });

  it('estimates partially-learned topics at half the unstudied effort', () => {
    const result = calculateTimeCushion({
      examDate: examNDaysOut(4),
      subjectId: 'subject_1',
      topics: [makeTopic({ id: 'topic_1', masteryLevel: 'learning' })],
      dailyCapacityMinutes: 360,
      referenceDate: REFERENCE
    });

    expect(result.estimatedHoursRequired).toBe(TOPIC_ESTIMATED_HOURS.learning);
  });

  it('clamps invalid exam dates to 0 days remaining', () => {
    const result = calculateTimeCushion({
      examDate: 'not-a-date',
      subjectId: 'subject_1',
      topics: [makeTopic({ id: 'topic_1' }), makeTopic({ id: 'topic_2', title: 'Sharding' })],
      dailyCapacityMinutes: 360,
      referenceDate: REFERENCE
    });

    expect(result.daysRemaining).toBe(0);
    expect(result.netAvailableStudyHours).toBe(0);
    expect(result.status).toBe('critical_deficit');
  });

  it('maps the plan §2.3 color-token thresholds onto the four statuses', () => {
    const examDate = examNDaysOut(4);
    const required = 12;
    const scenario = (targetCushion: number) =>
      calculateTimeCushion({
        examDate,
        subjectId: 'subject_1',
        topics: [makeTopic({}), makeTopic({ id: 'topic_2', title: 'Sharding' }), makeTopic({ id: 'topic_3', title: 'Queues' })],
        dailyCapacityMinutes: capacityForCushion(required, targetCushion, examDate),
        referenceDate: REFERENCE
      }).status;

    expect(scenario(6)).toBe('comfortable'); // Sage: +6h
    expect(scenario(5)).toBe('on_track');
    expect(scenario(3)).toBe('tight'); // Amber: 0–3h
    expect(scenario(0)).toBe('tight');
    expect(scenario(-2)).toBe('critical_deficit'); // Terracotta: deficit
  });
});

describe('projectRoutineCommitmentsByDay', () => {
  it('projects active recurring routines onto their weekdays before the exam', () => {
    const referenceWeekday = REFERENCE.getDay() as DayOfWeek;
    const nextWeekKey = getISODateString(addDays(REFERENCE, 7));
    const activeRoutine = makeRoutine({
      id: 'routine_active',
      targetMinutes: 90,
      daysOfWeek: [referenceWeekday]
    });
    const inactiveRoutine = makeRoutine({
      id: 'routine_paused',
      targetMinutes: 120,
      daysOfWeek: [referenceWeekday],
      isActive: false
    });
    const offDayRoutine = makeRoutine({
      id: 'routine_offday',
      targetMinutes: 60,
      daysOfWeek: [(referenceWeekday + 1) % 7 as DayOfWeek]
    });

    // +9 days out guarantees both same-weekday occurrences fall inside the horizon.
    const commitments = projectRoutineCommitmentsByDay(
      [activeRoutine, inactiveRoutine, offDayRoutine],
      examNDaysOut(9),
      REFERENCE
    );

    expect(commitments[REFERENCE_KEY]).toBe(90);
    expect(commitments[nextWeekKey]).toBe(90);
    // The off-day routine also recurs weekly at 60m (indices 1 and 8), the
    // paused one never appears — 4 distinct committed days in total.
    expect(commitments[getISODateString(addDays(REFERENCE, 1))]).toBe(60);
    expect(commitments[getISODateString(addDays(REFERENCE, 8))]).toBe(60);
    expect(Object.keys(commitments).length).toBe(4);
  });

  it('returns no commitments for 0-day or invalid horizons', () => {
    expect(projectRoutineCommitmentsByDay([makeRoutine()], examNDaysOut(0), REFERENCE)).toEqual({});
    expect(projectRoutineCommitmentsByDay([makeRoutine()], 'not-a-date', REFERENCE)).toEqual({});
  });
});

describe('formatCushionHours', () => {
  it('formats whole and fractional hours for UI copy', () => {
    expect(formatCushionHours(4)).toBe('4');
    expect(formatCushionHours(2.4)).toBe('2.4');
    expect(formatCushionHours(-5.25)).toBe('5.3');
    expect(formatCushionHours(0)).toBe('0');
  });
});
