import { describe, it, expect } from 'vitest';
import {
  calculateExamReadiness,
  evaluateCognitiveLoad,
  calculateTopicRetentionForecast
} from '../utils/intelligence/masteryIntelligence';
import { Goal } from '../types/goal';
import { StudyTopic } from '../types/study';
import { Flashcard } from '../types/learning';
import { Habit } from '../types/habit';
import { FocusSession } from '../types/focus';
import { DailyReflection } from '../types/reflection';

describe('Stage F — Mastery Intelligence 2.0 Engine', () => {
  const mockGoal: Goal = {
    id: 'goal_exam_1',
    title: 'Distributed Systems Midterm Exam',
    targetDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
    category: 'academic',
    experienceType: 'exam',
    horizon: 'medium_term',
    status: 'active',
    progressPercentage: 50,
    priority: 'high',
    color: 'coral',
    targetScore: '95%',
    examWeight: 40,
    milestones: [
      { id: 'm1', title: 'Review Raft Invariants', targetDate: '2026-08-25', completed: true },
      { id: 'm2', title: 'Complete 2024 Practice Exam', targetDate: '2026-08-27', completed: false }
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  const mockTopics: StudyTopic[] = [
    {
      id: 'topic_1',
      subjectId: 'sbj_1',
      title: 'Consensus Protocols',
      orderIndex: 0,
      masteryLevel: 'mastered',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'topic_2',
      subjectId: 'sbj_1',
      title: 'Paxos vs Raft',
      orderIndex: 1,
      masteryLevel: 'learning',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockCards: Flashcard[] = [
    {
      id: 'card_1',
      subjectId: 'sbj_1',
      topicId: 'topic_1',
      frontPrompt: 'What is Leader Completeness?',
      backAnswer: 'If a log entry is committed in a given term, it will be present in logs of leaders for all higher terms.',
      cardType: 'standard',
      difficultyRating: 'good',
      repetitionCount: 3,
      intervalDays: 6,
      easeFactor: 2.5,
      nextReviewDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  const mockHabits: Habit[] = [
    {
      id: 'hab_1',
      title: 'Distributed Systems Daily Review',
      goalId: 'goal_exam_1',
      goalTitle: 'Distributed Systems Midterm Exam',
      category: 'study',
      frequency: 'daily',
      color: 'coral',
      currentStreak: 7,
      longestStreak: 14,
      completedToday: true,
      history: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  describe('Deterministic Exam Readiness Index', () => {
    it('calculates 4-factor weighted score accurately', () => {
      const result = calculateExamReadiness({
        goal: mockGoal,
        topics: mockTopics,
        flashcards: mockCards,
        habits: mockHabits
      });

      expect(result.readinessScore).toBeGreaterThanOrEqual(60);
      expect(result.readinessScore).toBeLessThanOrEqual(100);
      expect(result.grade).toBeDefined();
      expect(result.componentScores.topicsScore).toBe(80); // (100 + 60) / 2
      expect(result.componentScores.milestoneScore).toBe(50); // 1 of 2
      expect(result.daysRemaining).toBe(10);
    });

    it('generates actionable risk diagnostics when milestones are lagging close to exam', () => {
      const urgentGoal: Goal = {
        ...mockGoal,
        targetDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
        milestones: [
          { id: 'm1', title: 'Pending Task', targetDate: '2026-08-20', completed: false }
        ]
      };

      const result = calculateExamReadiness({
        goal: urgentGoal,
        topics: mockTopics,
        flashcards: mockCards,
        habits: []
      });

      expect(result.riskDiagnostics.length).toBeGreaterThan(0);
      expect(result.riskDiagnostics.some((d) => d.includes('Milestone progress lagging'))).toBe(true);
      expect(result.riskDiagnostics.some((d) => d.includes('No daily consistency habit'))).toBe(true);
    });
  });

  describe('Cognitive Load & Burnout Resilience Heuristics', () => {
    it('identifies optimal cognitive balance when workload is well distributed', () => {
      const recentFocus: FocusSession[] = [
        {
          id: 'f1',
          title: 'Sprint 1',
          mode: 'pomodoro',
          durationMinutes: 50,
          flowQuality: 5,
          interruptionsCount: 0,
          completed: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const reflections: DailyReflection[] = [
        {
          id: 'r1',
          date: '2026-08-17',
          energyScore: 5,
          focusScore: 5,
          wins: ['Crushed problem set'],
          frictionPoints: [],
          tomorrowIntentions: [],
          completedHabitsCount: 2,
          completedTasksCount: 4,
          studyMinutesLogged: 50,
          reviewCardsCompleted: 10,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const report = evaluateCognitiveLoad({
        focusSessions: recentFocus,
        reflections,
        topics: mockTopics
      });

      expect(report.status).toBe('optimal');
      expect(report.score).toBeGreaterThanOrEqual(80);
      expect(report.recommendedAction).toContain('optimal');
    });

    it('triggers critical alert on severe fatigue combined with extreme focus hours', () => {
      const heavyFocus: FocusSession[] = [
        { id: 'f1', title: 'Deep 1', mode: 'deep_flow', durationMinutes: 360, interruptionsCount: 0, completed: true, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
        { id: 'f2', title: 'Deep 2', mode: 'deep_flow', durationMinutes: 360, interruptionsCount: 0, completed: true, createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() },
        { id: 'f3', title: 'Deep 3', mode: 'deep_flow', durationMinutes: 360, interruptionsCount: 0, completed: true, createdAt: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), updatedAt: new Date().toISOString() }
      ];

      const exhaustedReflections: DailyReflection[] = [
        {
          id: 'r1',
          date: '2026-08-17',
          energyScore: 1,
          focusScore: 2,
          wins: [],
          frictionPoints: ['Severe mental exhaustion'],
          tomorrowIntentions: [],
          completedHabitsCount: 1,
          completedTasksCount: 1,
          studyMinutesLogged: 360,
          reviewCardsCompleted: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const report = evaluateCognitiveLoad({
        focusSessions: heavyFocus,
        reflections: exhaustedReflections
      });

      expect(report.status).toBe('burnout_risk');
      expect(report.alerts.some((a) => a.id === 'alert_burnout')).toBe(true);
      expect(report.score).toBeLessThanOrEqual(50);
    });
  });

  describe('Ebbinghaus Forgetting Curve Forecasting', () => {
    it('projects exponential decay over 7-day and 14-day intervals', () => {
      const topic: StudyTopic = {
        id: 'topic_calc',
        subjectId: 'sbj_1',
        title: 'Fourier Transform',
        orderIndex: 0,
        masteryLevel: 'mastered',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const forecast = calculateTopicRetentionForecast(topic, mockCards);

      expect(forecast.currentRetention).toBe(95);
      expect(forecast.forecast7Day).toBeLessThan(forecast.currentRetention);
      expect(forecast.forecast14Day).toBeLessThan(forecast.forecast7Day);
      expect(forecast.daysUntilDecayBelow80).toBeGreaterThanOrEqual(1);
    });
  });
});
