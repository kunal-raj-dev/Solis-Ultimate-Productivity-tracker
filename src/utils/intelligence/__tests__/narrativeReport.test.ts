import { describe, it, expect } from 'vitest';
import {
  generateWeeklyNarrativeReport,
  getPreviousWeekStudyMinutes
} from '../narrativeReport';
import { SolisIntelligenceReport } from '../types';
import { getISODateString, addDays } from '../../date';

/**
 * Plan §5.6: Deterministic 5-Sentence Weekly Narrative Report.
 * The narrative must be a stable, encouraging, exactly-five-sentence paragraph
 * derived purely from the SolisIntelligenceReport (string snapshot contract).
 */
function buildReport(overrides: Partial<SolisIntelligenceReport> = {}): SolisIntelligenceReport {
  const base = {
    scope: 'this_week' as const,
    window: { startDate: '2026-09-21', endDate: '2026-09-27', daysCount: 7 },
    rhythm: {
      totalStudyMinutes: 480,
      totalStudyHours: 8.0,
      totalFocusMinutes: 0,
      totalFocusHours: 0,
      activeStudyDaysCount: 4,
      consistencyPercentage: 57,
      averageSessionDurationMinutes: 60,
      timeOfDay: [],
      dominantTimeOfDay: null,
      dayOfWeek: [],
      subjectEfforts: [
        {
          subjectId: 'sub-1',
          subjectName: 'Neurobiology',
          color: 'coral',
          actualMinutes: 300,
          actualHours: 5.0,
          plannedMinutes: 240,
          plannedHours: 4.0,
          actualSharePercentage: 62,
          plannedSharePercentage: 50,
          sessionCount: 5
        },
        {
          subjectId: 'sub-2',
          subjectName: 'Distributed Systems',
          color: 'lavender',
          actualMinutes: 180,
          actualHours: 3.0,
          plannedMinutes: 240,
          plannedHours: 4.0,
          actualSharePercentage: 38,
          plannedSharePercentage: 50,
          sessionCount: 3
        }
      ],
      hasSufficientData: true
    },
    execution: {
      planAdherenceRate: 100,
      sessionCompletionRate: 100,
      taskExecutionRate: 100,
      plannedStudyMinutes: 480,
      actualStudyMinutes: 480,
      planningRealismRatio: 1,
      planningRealismVerdict: 'calibrated' as const,
      postponementPatterns: [],
      hasSufficientData: true
    },
    mastery: {
      topics: [],
      masteredCount: 0,
      learningCount: 0,
      unstudiedCount: 0,
      averageMasteryScore: 0,
      reviewQueue: [],
      hasSufficientData: true
    },
    attention: {
      totalFocusSessions: 0,
      completedFocusSessions: 0,
      completionRate: 0,
      averageFocusDurationMinutes: 0,
      totalInterruptions: 0,
      interruptionsPerHour: 0,
      neglectAlerts: [
        {
          subjectId: 'sub-2',
          subjectName: 'Distributed Systems',
          color: 'lavender',
          plannedShare: 50,
          actualShare: 38,
          divergence: 12,
          daysSinceLastStudied: 6,
          reason: 'Planned 50% of study time but received 38%.'
        }
      ],
      hasSufficientData: true
    },
    recommendations: [
      {
        id: 'rec-1',
        type: 'neglect_rebalance' as const,
        priority: 'primary' as const,
        weight: 10,
        title: 'Rebalance attention toward Distributed Systems',
        signal: 'Under-served subject',
        evidence: 'Planned vs actual divergence of 12%',
        action: 'Schedule a focus block this week'
      }
    ],
    hasOverallSufficientData: true
  };

  return { ...base, ...overrides } as SolisIntelligenceReport;
}

describe('generateWeeklyNarrativeReport (plan §5.6)', () => {
  it('produces exactly five sentences', () => {
    const narrative = generateWeeklyNarrativeReport(buildReport());
    const sentenceCount = narrative.sentences.length;
    expect(sentenceCount).toBe(5);
    // Paragraph is the sentences joined with single spaces.
    expect(narrative.paragraph).toBe(narrative.sentences.join(' '));
    // No double spaces or trailing periods before spaces artifacts.
    expect(narrative.paragraph).not.toMatch(/  /);
  });

  it('is a stable string snapshot for the same report (deterministic)', () => {
    const expected =
      'This week you logged 8.0 hours of focused study across 4 active days. ' +
      'Your rhythm had a natural ebb and flow this week, active on 57% of days. ' +
      'Neurobiology received the most attention with 5.0 hours invested. ' +
      'Distributed Systems would appreciate a gentle catch-up next week — it has been waiting patiently. ' +
      "Next week's smartest next step: Rebalance attention toward Distributed Systems.";
    expect(generateWeeklyNarrativeReport(buildReport()).paragraph).toBe(expected);
    // Identical input → identical output.
    expect(generateWeeklyNarrativeReport(buildReport()).paragraph).toBe(
      generateWeeklyNarrativeReport(buildReport()).paragraph
    );
  });

  it('keeps an anti-shame tone for the neglected subject sentence', () => {
    const { sentences } = generateWeeklyNarrativeReport(buildReport());
    expect(sentences[3]).toContain('Distributed Systems');
    expect(sentences[3].toLowerCase()).not.toMatch(/fail|lazy|broken|missed streak/);
  });

  it('degrades gracefully with an empty report (no NaN or undefined)', () => {
    const empty = buildReport({
      rhythm: {
        totalStudyMinutes: 0,
        totalStudyHours: 0,
        totalFocusMinutes: 0,
        totalFocusHours: 0,
        activeStudyDaysCount: 0,
        consistencyPercentage: 0,
        averageSessionDurationMinutes: 0,
        timeOfDay: [],
        dominantTimeOfDay: null,
        dayOfWeek: [],
        subjectEfforts: [],
        hasSufficientData: false
      },
      attention: {
        totalFocusSessions: 0,
        completedFocusSessions: 0,
        completionRate: 0,
        averageFocusDurationMinutes: 0,
        totalInterruptions: 0,
        interruptionsPerHour: 0,
        neglectAlerts: [],
        hasSufficientData: false
      },
      recommendations: []
    } as Partial<SolisIntelligenceReport>);

    const { paragraph } = generateWeeklyNarrativeReport(empty);
    expect(paragraph).not.toMatch(/NaN|undefined|null/);
    expect(paragraph.split(/(?<=[.!?]) (?=[A-Z])/).length).toBe(5);
  });

  it('falls back to a generic strategic sentence when no recommendations exist', () => {
    const report = buildReport();
    report.recommendations = [];
    const { sentences } = generateWeeklyNarrativeReport(report);
    expect(sentences[4]).toContain('Next week');
  });
});

describe('getPreviousWeekStudyMinutes (plan §5.6 next-week target default)', () => {
  // Saturday 2026-09-26 → current week Monday = 2026-09-21,
  // previous week = Monday 2026-09-14 … Sunday 2026-09-20.
  const reference = new Date(2026, 8, 26); // month index 8 = September

  const sessionOn = (date: Date, minutes = 60) => ({
    durationMinutes: minutes,
    completedAt: new Date(date.getFullYear(), date.getMonth(), date.getDate(), 10).toISOString()
  });

  it('sums only sessions inside the previous Mon–Sun window', () => {
    const mondayLastWeek = addDays(reference, -12); // 2026-09-14
    const sundayLastWeek = addDays(reference, -6); // 2026-09-20
    const mondayThisWeek = addDays(reference, -5); // 2026-09-21
    const today = reference;

    const sessions = [
      sessionOn(mondayLastWeek, 45),
      sessionOn(sundayLastWeek, 60),
      sessionOn(mondayThisWeek, 120), // current week — excluded
      sessionOn(today, 30) // current week — excluded
    ];

    expect(getPreviousWeekStudyMinutes(sessions, reference)).toBe(105);
  });

  it('returns 0 when there were no sessions last week', () => {
    expect(getPreviousWeekStudyMinutes([], reference)).toBe(0);
    expect(getPreviousWeekStudyMinutes([sessionOn(reference, 90)], reference)).toBe(0);
  });

  it('uses local date keys, not UTC slices', () => {
    const sundayLastWeek = addDays(reference, -6);
    const key = getISODateString(sundayLastWeek);
    expect(key).toBe('2026-09-20');
    expect(getPreviousWeekStudyMinutes([sessionOn(sundayLastWeek, 25)], reference)).toBe(25);
  });
});
