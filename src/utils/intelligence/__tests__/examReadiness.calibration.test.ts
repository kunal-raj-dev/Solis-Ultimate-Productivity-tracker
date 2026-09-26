import { describe, it, expect, vi } from 'vitest';
import { calculateExamReadiness } from '../masteryIntelligence';
import { Goal } from '../../../types/goal';
import { StudyTopic } from '../../../types/study';
import { Flashcard } from '../../../types/learning';
import { Habit } from '../../../types/habit';
import { addDays, getISODateString } from '../../date';

/**
 * Phase 0 — Exam Readiness Calibration Harness (plan §0.1 / §2.2)
 *
 * Live tests characterize already-correct, recalibration-stable behaviour:
 * an exam with zero studied material must score honestly at "At Risk", a
 * fully mastered syllabus must score "Prepared" or better, and daysRemaining
 * must clamp past/invalid dates to 0.
 *
 * The hard-gate tests reproduce audit §18.2 (Item #15): with 0 mastered
 * topics, habit streaks and milestone checkboxes must not inflate the score
 * into "Prepared"/"Borderline" (or even "Exceptional"). They encode the
 * Phase 2.2 target contract — Topics Mastery at 0% caps readiness at 15/100
 * ("At Risk") — and run live since the recalibration landed in
 * masteryIntelligence.ts (hard gate, unlinked-habits fallback, proximity decay).
 */

const FUTURE_DATE = getISODateString(addDays(new Date(), 30));

const makeExamGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 'goal_exam',
  title: 'Systems Design Final',
  horizon: 'short_term',
  status: 'active',
  category: 'academic',
  experienceType: 'exam',
  subjectId: 'subject_1',
  targetDate: FUTURE_DATE,
  progressPercentage: 0,
  priority: 'high',
  color: 'coral',
  milestones: [],
  createdAt: '',
  updatedAt: '',
  ...overrides
});

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

const makeHealthyCard = (overrides: Partial<Flashcard> = {}): Flashcard => ({
  id: 'card_1',
  subjectId: 'subject_1',
  frontPrompt: 'What does CAP trade off during a partition?',
  backAnswer: 'Consistency vs Availability',
  cardType: 'standard',
  difficultyRating: 'good',
  repetitionCount: 3,
  intervalDays: 5,
  easeFactor: 2.5,
  nextReviewDate: getISODateString(addDays(new Date(), 3)), // comfortably due later
  createdAt: '',
  updatedAt: '',
  ...overrides
});

const makeLinkedHabit = (overrides: Partial<Habit> = {}): Habit => ({
  id: 'habit_1',
  title: 'Daily systems review',
  category: 'study',
  frequency: 'daily',
  color: 'sage',
  currentStreak: 10,
  longestStreak: 10,
  completedToday: true,
  history: {},
  goalId: 'goal_exam',
  createdAt: '',
  updatedAt: '',
  ...overrides
});

describe('calculateExamReadiness — honest baseline (already-correct behaviour, runs live)', () => {
  it('scores an exam with no topics, cards, habits, or milestones at At Risk', () => {
    const result = calculateExamReadiness({
      goal: makeExamGoal(),
      topics: [],
      flashcards: [],
      habits: []
    });

    expect(result.readinessScore).toBeLessThanOrEqual(15);
    expect(result.grade).toBe('At Risk');
    expect(result.riskDiagnostics.length).toBeGreaterThan(0);
  });

  it('keeps zero-studied topics firmly in At Risk with no supporting signals', () => {
    const result = calculateExamReadiness({
      goal: makeExamGoal(),
      topics: [makeTopic({ id: 'topic_1' }), makeTopic({ id: 'topic_2', title: 'Sharding' })],
      flashcards: [],
      habits: []
    });

    expect(result.readinessScore).toBeLessThan(50);
    expect(result.grade).toBe('At Risk');
  });

  it('grades a fully mastered syllabus with strong signals Prepared or better', () => {
    const result = calculateExamReadiness({
      goal: makeExamGoal({
        milestones: [
          { id: 'm1', title: 'Finish syllabus', targetDate: FUTURE_DATE, completed: true },
          { id: 'm2', title: 'Two mock exams', targetDate: FUTURE_DATE, completed: true }
        ]
      }),
      topics: [
        makeTopic({ id: 'topic_1', masteryLevel: 'mastered' }),
        makeTopic({ id: 'topic_2', masteryLevel: 'mastered', title: 'Replication' }),
        makeTopic({ id: 'topic_3', masteryLevel: 'mastered', title: 'Queues' })
      ],
      flashcards: [makeHealthyCard()],
      habits: [makeLinkedHabit({ currentStreak: 10 })]
      // Component math under the canonical weights:
      // 0.35*100 (topics) + 0.30*100 (retention) + 0.20*100 (habit) + 0.15*100 (milestones)
    });

    expect(result.componentScores.topicsScore).toBe(100);
    expect(result.readinessScore).toBe(100);
    expect(result.grade).toBe('Exceptional');
    expect(result.gradeColor).toBe('sage');
  });

  it('clamps daysRemaining to 0 for past or invalid target dates', () => {
    const past = calculateExamReadiness({
      goal: makeExamGoal({ targetDate: '2020-01-01' }),
      topics: [],
      flashcards: [],
      habits: []
    });
    const invalid = calculateExamReadiness({
      goal: makeExamGoal({ targetDate: 'not-a-date' }),
      topics: [],
      flashcards: [],
      habits: []
    });

    expect(past.daysRemaining).toBe(0);
    expect(invalid.daysRemaining).toBe(0);
  });

  it('counts down the days remaining to a future target date', () => {
    // Freeze the clock so the test-side formula read and the engine's own
    // Date.now() read observe the same instant — no local-midnight race.
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-09-26T12:00:00'));
    try {
      const goal = makeExamGoal({ targetDate: getISODateString(addDays(new Date(), 10)) });
      const expected = Math.max(
        0,
        Math.ceil((new Date(goal.targetDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      );

      const result = calculateExamReadiness({
        goal,
        topics: [],
        flashcards: [],
        habits: []
      });

      expect(result.daysRemaining).toBe(expected);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe('calculateExamReadiness — hard gates (Phase 2.2 target contract, runs live)', () => {
  // Phase 2.2 landed: 0% Topics Mastery caps readinessScore at 15/100 ("At Risk").

  it('caps 0 mastered topics with streak, milestone, and retention inflation at the 15/100 cap', () => {
    // Current (pre-Phase-2.2) behaviour: 0.35*20 + 0.30*100 + 0.20*100 + 0.15*100 = 72
    // -> grades "Prepared" for an exam where nothing has been mastered.
    const result = calculateExamReadiness({
      goal: makeExamGoal({
        milestones: [{ id: 'm1', title: 'Check the box', targetDate: FUTURE_DATE, completed: true }]
      }),
      topics: [
        makeTopic({ id: 'topic_1' }),
        makeTopic({ id: 'topic_2', title: 'Replication' }),
        makeTopic({ id: 'topic_3', title: 'Queues' })
      ],
      flashcards: [makeHealthyCard(), makeHealthyCard({ id: 'card_2' })],
      habits: [makeLinkedHabit({ currentStreak: 12 })]
    });

    expect(result.readinessScore).toBeLessThanOrEqual(15);
    expect(result.grade).toBe('At Risk');
    expect(['Prepared', 'Borderline']).not.toContain(result.grade);
  });

  it('caps a partially-seen syllabus with zero mastered topics at At Risk', () => {
    // Current (pre-Phase-2.2) behaviour: 0.35*60 + 0.30*100 + 0.20*100 + 0.15*100 = 86
    // -> grades "Exceptional" from a single "learning" topic plus hygiene signals.
    const result = calculateExamReadiness({
      goal: makeExamGoal({
        milestones: [{ id: 'm1', title: 'Check the box', targetDate: FUTURE_DATE, completed: true }]
      }),
      topics: [makeTopic({ id: 'topic_1', masteryLevel: 'learning' })],
      flashcards: [makeHealthyCard()],
      habits: [makeLinkedHabit({ currentStreak: 10 })]
    });

    expect(result.readinessScore).toBeLessThanOrEqual(15);
    expect(result.grade).toBe('At Risk');
    expect(['Prepared', 'Borderline']).not.toContain(result.grade);
  });

  it('redistributes the 20% habit weight when no habits are linked to the goal', () => {
    // Plan §2.2 Unlinked Habits Fallback: Topics Mastery 50% + Retention 35%
    // (Milestones keep 15%). Fully mastered syllabus + healthy retention:
    // 0.50*100 + 0.35*100 + 0.15*0 = 85.
    // Current (pre-Phase-2.2) behaviour: 0.35*100 + 0.30*100 + 0 + 0 = 65 "Borderline".
    const result = calculateExamReadiness({
      goal: makeExamGoal(),
      topics: [
        makeTopic({ id: 'topic_1', masteryLevel: 'mastered' }),
        makeTopic({ id: 'topic_2', masteryLevel: 'mastered', title: 'Replication' })
      ],
      flashcards: [makeHealthyCard()],
      habits: [] // no habits linked to the goal anywhere
    });

    expect(result.readinessScore).toBe(85);
    expect(result.grade).toBe('Exceptional');
  });
});
