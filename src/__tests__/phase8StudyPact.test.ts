import { describe, it, expect } from 'vitest';
import {
  StudyPact,
  buildPactWeekSummary,
  computePactMinutesThisWeek,
  countScholarsFocusingNow,
  createStudyPact,
  getPactWeekWindow,
  isPactWeekOver
} from '../types/studyPact';
import { StudySession } from '../types/study';

/**
 * Phase 8.3 — Study Pact Accountability & Passive Quiet Peer Presence
 * (plan §8.3). Verification gates: deterministic week windows, progress
 * computed only from real logged sessions, automatic end-of-week summaries
 * with calm anti-shame language, honest partner check-ins (no simulated peer
 * data), and the anonymous presence counter.
 */

// Local-noon reference keeps date-key math timezone-stable (Monday).
const REFERENCE = new Date(2026, 8, 21, 12, 0, 0); // 2026-09-21 is a Monday

const makeSession = (overrides: Partial<StudySession> = {}): StudySession => ({
  id: 'session_1',
  subjectId: 'subject_1',
  subjectName: 'Distributed Systems',
  type: 'deep_study',
  durationMinutes: 60,
  topicsCovered: [],
  retentionRating: 4,
  completedAt: '2026-09-22T10:00:00.000Z',
  createdAt: '',
  updatedAt: '',
  ...overrides
});

const makePact = (overrides: Partial<StudyPact> = {}): StudyPact => ({
  id: 'pact_1',
  partnerName: 'Alyssa Vance',
  weekStartDate: '2026-09-21',
  weekEndDate: '2026-09-27',
  myWeeklyTargetMinutes: 300,
  partnerWeeklyTargetMinutes: 240,
  status: 'active',
  createdAt: '2026-09-21T09:00:00.000Z',
  ...overrides
});

describe('getPactWeekWindow — deterministic Monday→Sunday window', () => {
  it('starts on Monday 00:00 and ends Sunday 23:59:59.999, locally', () => {
    const window = getPactWeekWindow(REFERENCE);
    expect(window.start.getDay()).toBe(1);
    expect(window.start.getHours()).toBe(0);
    expect(window.startKey).toBe('2026-09-21');
    expect(window.endKey).toBe('2026-09-27');
    expect(window.end.getHours()).toBe(23);
    expect(window.end.getMinutes()).toBe(59);
    expect(window.end.getSeconds()).toBe(59);
  });

  it('maps a mid-week Wednesday into the same Monday-anchored window', () => {
    const wednesday = new Date(2026, 8, 23, 18, 30, 0);
    const window = getPactWeekWindow(wednesday);
    expect(window.startKey).toBe('2026-09-21');
    expect(window.endKey).toBe('2026-09-27');
  });

  it('maps a Sunday into the window that opened the previous Monday', () => {
    const sunday = new Date(2026, 8, 27, 9, 0, 0);
    const window = getPactWeekWindow(sunday);
    expect(window.startKey).toBe('2026-09-21');
    expect(window.endKey).toBe('2026-09-27');
  });
});

describe('createStudyPact — validation', () => {
  it('creates an active pact scoped to the current week window', () => {
    const pact = createStudyPact({
      partnerName: 'Alyssa Vance',
      myWeeklyTargetMinutes: 300,
      partnerWeeklyTargetMinutes: 240,
      sharedObjective: 'Finish Chapter 6 problem sets',
      now: REFERENCE
    });

    expect(pact).not.toBeNull();
    expect(pact!.status).toBe('active');
    expect(pact!.weekStartDate).toBe('2026-09-21');
    expect(pact!.weekEndDate).toBe('2026-09-27');
    expect(pact!.sharedObjective).toBe('Finish Chapter 6 problem sets');
  });

  it('rejects missing partner names and pledges under 15 minutes', () => {
    expect(createStudyPact({ partnerName: '  ', myWeeklyTargetMinutes: 300, partnerWeeklyTargetMinutes: 240, now: REFERENCE })).toBeNull();
    expect(createStudyPact({ partnerName: 'Alyssa Vance', myWeeklyTargetMinutes: 10, partnerWeeklyTargetMinutes: 240, now: REFERENCE })).toBeNull();
    expect(createStudyPact({ partnerName: 'Alyssa Vance', myWeeklyTargetMinutes: 300, partnerWeeklyTargetMinutes: 0, now: REFERENCE })).toBeNull();
  });
});

describe('computePactMinutesThisWeek — progress from real sessions only', () => {
  it('sums session minutes falling inside the pact week window', () => {
    const pact = makePact();
    const sessions = [
      makeSession({ id: 's1', durationMinutes: 90, completedAt: '2026-09-22T10:00:00.000Z' }),
      makeSession({ id: 's2', durationMinutes: 45, completedAt: '2026-09-25T18:00:00.000Z' }),
      makeSession({ id: 's3', durationMinutes: 120, completedAt: '2026-09-26T23:59:00.000Z' })
    ];
    expect(computePactMinutesThisWeek(pact, sessions)).toBe(255);
  });

  it('excludes sessions outside the week window (before and after)', () => {
    const pact = makePact();
    const sessions = [
      makeSession({ id: 'early', durationMinutes: 200, completedAt: '2026-09-20T10:00:00.000Z' }),
      makeSession({ id: 'inside', durationMinutes: 60, completedAt: '2026-09-23T10:00:00.000Z' }),
      makeSession({ id: 'late', durationMinutes: 200, completedAt: '2026-09-28T10:00:00.000Z' })
    ];
    expect(computePactMinutesThisWeek(pact, sessions)).toBe(60);
  });

  it('scopes to the pact subject when one is set', () => {
    const pact = makePact({ subjectId: 'subject_2' });
    const sessions = [
      makeSession({ id: 'in-scope', subjectId: 'subject_2', durationMinutes: 70 }),
      makeSession({ id: 'out-scope', subjectId: 'subject_1', durationMinutes: 500 })
    ];
    expect(computePactMinutesThisWeek(pact, sessions)).toBe(70);
  });

  it('ignores sessions with malformed timestamps', () => {
    const pact = makePact();
    const sessions = [makeSession({ id: 'bad', completedAt: 'not-a-date', durationMinutes: 90 })];
    expect(computePactMinutesThisWeek(pact, sessions)).toBe(0);
  });
});

describe('isPactWeekOver — automatic end-of-week trigger', () => {
  it('is false inside the week and true after the week ends', () => {
    const pact = makePact();
    expect(isPactWeekOver(pact, new Date(2026, 8, 24, 12, 0, 0))).toBe(false);
    expect(isPactWeekOver(pact, new Date(2026, 8, 27, 23, 0, 0))).toBe(false);
    expect(isPactWeekOver(pact, new Date(2026, 8, 28, 0, 0, 0))).toBe(true);
  });
});

describe('buildPactWeekSummary — calm, honest end-of-week summaries', () => {
  it('records a met mutual commitment when both sides confirm their pledges', () => {
    const pact = makePact({ partnerConfirmedMinutes: 250 });
    const summary = buildPactWeekSummary(pact, 320);

    expect(summary.mutualCommitmentMet).toBe(true);
    expect(summary.myMinutes).toBe(320);
    expect(summary.partnerMinutes).toBe(250);
    expect(summary.narrative).toContain('commitment met');
  });

  it('never frames a partial week as failure (anti-shame language)', () => {
    const pact = makePact({ partnerConfirmedMinutes: 100 });
    const summary = buildPactWeekSummary(pact, 120);

    expect(summary.mutualCommitmentMet).toBe(false);
    expect(summary.narrative).not.toMatch(/fail|failed|broken|miss|guilt/i);
    expect(summary.narrative).toContain('every session counts');
  });

  it('leaves the partner side open when no check-in was confirmed (no fake peer data)', () => {
    const pact = makePact();
    const summary = buildPactWeekSummary(pact, 300);

    expect(summary.partnerMinutes).toBeNull();
    expect(summary.partnerMinutes === null ? false : true).toBe(false);
    expect(summary.mutualCommitmentMet).toBe(false);
    expect(summary.narrative).toContain('awaiting their check-in');
  });

  it('is deterministic for identical inputs', () => {
    const pact = makePact({ partnerConfirmedMinutes: 240 });
    expect(buildPactWeekSummary(pact, 300)).toEqual(buildPactWeekSummary(pact, 300));
  });
});

describe('countScholarsFocusingNow — passive quiet peer presence', () => {
  it('sums participants of running rooms only', () => {
    const rooms = [
      { timerState: 'running', participantsCount: 3 },
      { timerState: 'idle', participantsCount: 2 },
      { timerState: 'paused', participantsCount: 5 },
      { timerState: 'running', participantsCount: 1 }
    ];
    expect(countScholarsFocusingNow(rooms)).toBe(4);
  });

  it('is zero when nobody is focusing (never padded)', () => {
    expect(
      countScholarsFocusingNow([
        { timerState: 'idle', participantsCount: 3 },
        { timerState: 'paused', participantsCount: 7 }
      ])
    ).toBe(0);
    expect(countScholarsFocusingNow([])).toBe(0);
  });

  it('treats missing participant counts as zero rather than one', () => {
    expect(countScholarsFocusingNow([{ timerState: 'running' }])).toBe(0);
  });
});
