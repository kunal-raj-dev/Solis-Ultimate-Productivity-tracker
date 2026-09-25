import { describe, it, expect } from 'vitest';
import {
  generateSolisIntelligenceReport,
  computeRecommendations,
  computeTopicMastery
} from '../utils/intelligence';
import {
  calculateExamReadiness,
  calculateTopicRetentionForecast
} from '../utils/intelligence/masteryIntelligence';
import {
  DEFAULT_DAILY_CAPACITY_MINUTES,
  getDefaultDailyCapacityMinutes,
  calculateWorkload
} from '../utils/tasks/workloadCalculator';
import { synthesizeCircadianResonance } from '../utils/intelligence/circadianSynthesis';
import {
  calculateStreaks,
  calculateStudyStreak,
  calculateOverallHabitStreak
} from '../utils/streaks';
import { calculateDailySummary } from '../utils/productivity';
import { StudySubject, StudyTopic, StudySession } from '../types/study';
import { Flashcard, ReviewQueueItem } from '../types/learning';
import { Note } from '../types/note';
import { StudyResource } from '../types/resource';
import { Goal } from '../types/goal';
import { Habit } from '../types/habit';
import { Task } from '../types/task';
import { FocusSession } from '../types/focus';

describe('Phase 3 — Intelligence, Mastery & Recommendation Consolidation', () => {
  const refDate = new Date('2026-08-25T12:00:00Z');

  const mockSubject: StudySubject = {
    id: 'sbj-dist',
    name: 'Distributed Systems',
    color: 'coral',
    targetHoursPerWeek: 10,
    completedHoursThisWeek: 6,
    status: 'active',
    notesCount: 2,
    createdAt: '2026-08-01T00:00:00Z',
    updatedAt: '2026-08-01T00:00:00Z'
  };

  const mockTopics: StudyTopic[] = [
    {
      id: 'top-raft',
      subjectId: 'sbj-dist',
      title: 'Raft Consensus Protocol',
      orderIndex: 0,
      masteryLevel: 'learning',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z'
    },
    {
      id: 'top-paxos',
      subjectId: 'sbj-dist',
      title: 'Paxos Foundations',
      orderIndex: 1,
      masteryLevel: 'unstudied',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z'
    }
  ];

  const mockSessions: StudySession[] = [
    {
      id: 'sess-1',
      subjectId: 'sbj-dist',
      subjectName: 'Distributed Systems',
      topicsCovered: ['top-raft'],
      durationMinutes: 60,
      type: 'deep_study',
      retentionRating: 4,
      completedAt: '2026-08-20T10:00:00Z',
      createdAt: '2026-08-20T10:00:00Z',
      updatedAt: '2026-08-20T10:00:00Z'
    }
  ];

  const mockFlashcards: Flashcard[] = [
    {
      id: 'card-raft-1',
      subjectId: 'sbj-dist',
      topicId: 'top-raft',
      frontPrompt: 'What guarantees leader completeness?',
      backAnswer: 'Commit rule across majority of nodes.',
      cardType: 'standard',
      difficultyRating: 'good',
      repetitionCount: 3,
      intervalDays: 4,
      easeFactor: 2.5,
      nextReviewDate: '2026-08-24', // Overdue relative to refDate (2026-08-25)
      lastReviewedAt: '2026-08-20T10:00:00Z',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-20T10:00:00Z'
    }
  ];

  const mockReviews: ReviewQueueItem[] = [
    {
      id: 'rev-1',
      subjectId: 'sbj-dist',
      subjectName: 'Distributed Systems',
      subjectColor: 'coral',
      topicId: 'top-raft',
      topicTitle: 'Raft Consensus Protocol',
      flashcardId: 'card-raft-1',
      dueDate: '2026-08-24',
      priority: 'high',
      reason: 'Spaced repetition schedule',
      completed: true,
      completedAt: '2026-08-20T10:00:00Z',
      createdAt: '2026-08-16T10:00:00Z'
    }
  ];

  const mockNotes: Note[] = [
    {
      id: 'note-raft',
      title: 'Raft Invariants & Election Safety',
      content: '# Raft Invariants\nKey proof of election safety.',
      category: 'concept',
      tags: ['consensus', 'distributed'],
      subjectId: 'sbj-dist',
      topicId: 'top-raft',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-20T00:00:00Z'
    }
  ];

  const mockResources: StudyResource[] = [
    {
      id: 'res-raft-paper',
      title: 'In Search of an Understandable Consensus Algorithm',
      type: 'paper',
      url: 'https://raft.github.io/raft.pdf',
      subjectId: 'sbj-dist',
      topicId: 'top-raft',
      status: 'in_progress',
      tags: ['paper', 'raft'],
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-20T00:00:00Z'
    }
  ];

  describe('1. Real Entities Ingestion into Intelligence & Recommendations', () => {
    it('passes flashcards, reviews, notes, and resources into generateSolisIntelligenceReport and populates snapshot', () => {
      const report = generateSolisIntelligenceReport(
        {
          sessions: mockSessions,
          planItems: [],
          subjects: [mockSubject],
          topics: mockTopics,
          focusSessions: [],
          tasks: [],
          habits: [],
          flashcards: mockFlashcards,
          reviews: mockReviews,
          notes: mockNotes,
          resources: mockResources
        },
        'this_week',
        refDate
      );

      expect(report.snapshot).toBeDefined();
      const raftHistory = report.snapshot?.topicHistories.get('top-raft');
      expect(raftHistory).toBeDefined();
      expect(raftHistory?.flashcardsCount).toBe(1);
      expect(raftHistory?.dueFlashcardsCount).toBe(1); // 2026-08-24 is before refDate (2026-08-25)
      expect(raftHistory?.notesCount).toBe(1);
      expect(raftHistory?.resourcesCount).toBe(1);
      expect(raftHistory?.totalSessionsCount).toBe(1);

      // Recommendations should generate flashcard drill recommendation
      expect(report.recommendations.length).toBeGreaterThan(0);
      const topRec = report.recommendations[0];
      expect(topRec.actionPayload?.type).toBe('drill_flashcards');
      expect(topRec.actionPayload?.topicId).toBe('top-raft');
      expect(topRec.actionLabel).toContain('Drill 1 Due Flashcard');
    });

    it('computeRecommendations forwards flashcards, reviews, notes, and resources', () => {
      const recs = computeRecommendations(
        {
          subjects: [mockSubject],
          topics: mockTopics,
          sessions: mockSessions,
          planItems: [],
          flashcards: mockFlashcards,
          reviews: mockReviews,
          notes: mockNotes,
          resources: mockResources
        },
        undefined,
        undefined,
        undefined,
        undefined
      );

      expect(recs.length).toBeGreaterThan(0);
      expect(recs.some((r) => r.actionPayload?.type === 'drill_flashcards')).toBe(true);
    });
  });

  describe('2. Mastery Engine Consolidation', () => {
    it('computeTopicMastery in mastery.ts incorporates flashcards and reviews into repetition and retention scores', () => {
      const mastery = computeTopicMastery(
        {
          sessions: mockSessions,
          planItems: [],
          subjects: [mockSubject],
          topics: mockTopics,
          focusSessions: [],
          tasks: [],
          habits: [],
          flashcards: mockFlashcards,
          reviews: mockReviews
        },
        refDate
      );

      const raftSignal = mastery.topics.find((t) => t.topicId === 'top-raft');
      expect(raftSignal).toBeDefined();
      // Repetition should include studyCount (1*20=20) + flashcard repetitions (3*10=30) + review attempts (1*10=10) = 60
      expect(raftSignal?.repetitionScore).toBeGreaterThanOrEqual(50);
      expect(raftSignal?.isReviewRecommended).toBe(true);
      expect(raftSignal?.reviewReason).toContain('due for spaced retrieval review');
    });

    it('calculateExamReadiness in masteryIntelligence evaluates topics using canonical masteryEngine', () => {
      const examGoal: Goal = {
        id: 'goal-exam',
        title: 'Distributed Systems Final Exam',
        subjectId: 'sbj-dist',
        experienceType: 'exam',
        category: 'academic',
        horizon: 'medium_term',
        status: 'active',
        progressPercentage: 50,
        priority: 'high',
        color: 'coral',
        targetDate: '2026-09-10',
        milestones: [{ id: 'm1', title: 'Midterm', targetDate: '2026-08-20', completed: true }],
        createdAt: '2026-08-01',
        updatedAt: '2026-08-20'
      };

      const result = calculateExamReadiness({
        goal: examGoal,
        topics: mockTopics,
        flashcards: mockFlashcards,
        habits: [],
        studySessions: mockSessions
      });

      expect(result.componentScores.topicsScore).toBeGreaterThan(0);
      expect(result.grade).toBeDefined();
      expect(result.readinessScore).toBeGreaterThanOrEqual(10);
    });

    it('calculateTopicRetentionForecast evaluates baseline retention via masteryEngine when history is provided', () => {
      const history = {
        topicId: 'top-raft',
        topicTitle: 'Raft Consensus Protocol',
        subjectId: 'sbj-dist',
        subjectName: 'Distributed Systems',
        subjectColor: 'coral',
        manualStatus: 'learning' as const,
        firstSeenAt: '2026-08-01T00:00:00Z',
        lastStudiedAt: '2026-08-20T00:00:00Z',
        daysSinceLastStudied: 5,
        lastReviewedAt: '2026-08-20T00:00:00Z',
        daysSinceLastReviewed: 5,
        totalSessionsCount: 4,
        totalStudyMinutes: 120,
        averageRetentionRating: 4.5,
        latestRetentionRating: 5,
        flashcardsCount: 4,
        totalRecallAttempts: 4,
        successfulRecallCount: 4,
        failedRecallCount: 0,
        recallAccuracyRate: 1.0,
        averageEaseFactor: 2.6,
        dueFlashcardsCount: 0,
        notesCount: 2,
        resourcesCount: 1,
        unresolvedEventCount: 0
      };

      const forecast = calculateTopicRetentionForecast(mockTopics[0], mockFlashcards, history);
      expect(forecast.currentRetention).toBeGreaterThanOrEqual(80);
      expect(forecast.forecast7Day).toBeLessThan(forecast.currentRetention);
      expect(forecast.forecast14Day).toBeLessThan(forecast.forecast7Day);
    });
  });

  describe('3. Unified Daily Deep-Work Capacity (360 Minutes)', () => {
    it('DEFAULT_DAILY_CAPACITY_MINUTES is 360 (6.0 hours)', () => {
      expect(DEFAULT_DAILY_CAPACITY_MINUTES).toBe(360);
      expect(getDefaultDailyCapacityMinutes()).toBe(360);
    });

    it('synthesizeCircadianResonance defaults to 360m capacity when unspecified', () => {
      const resonance = synthesizeCircadianResonance({
        currentDate: refDate,
        workload: { totalEstimatedMinutes: 180 }, // 3 hours planned
        tasks: [],
        studyPlan: [],
        subjects: [mockSubject]
      });

      // 180 / 360 = 50%
      expect(resonance.capacityPercentUsed).toBe(50);
      expect(resonance.capacityRemainingMinutes).toBe(180);
      expect(resonance.isCeilingReached).toBe(false);
    });

    it('calculateWorkload respects 360m capacity and calculates calm utilization', () => {
      const mockTasks: Task[] = [
        {
          id: 'tsk-1',
          title: 'Review Raft paper',
          dueDate: '2026-08-25',
          estimatedMinutes: 180,
          status: 'todo',
          priority: 'high',
          category: 'study',
          subTasks: [],
          tags: [],
          createdAt: '2026-08-25T00:00:00Z',
          updatedAt: '2026-08-25T00:00:00Z'
        }
      ];

      const workload = calculateWorkload({
        date: '2026-08-25',
        tasks: mockTasks,
        timeBlocks: []
      });

      expect(workload.dailyCapacityMinutes).toBe(360);
      expect(workload.totalPlannedMinutes).toBe(180);
      expect(workload.remainingCapacityMinutes).toBe(180);
      expect(workload.state).toBe('light');
    });
  });

  describe('4. Single Productivity Score Engine', () => {
    it('calculateDailySummary defaults to 360m capacity and derives deterministic weighted momentum', () => {
      const mockTasks: Task[] = [
        {
          id: 't-1',
          title: 'T1',
          status: 'completed',
          priority: 'high',
          category: 'study',
          subTasks: [],
          tags: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const mockStudy: StudySession[] = [
        {
          id: 's-1',
          subjectId: 'sbj-dist',
          subjectName: 'Distributed Systems',
          type: 'deep_study',
          durationMinutes: 180,
          topicsCovered: [],
          retentionRating: 4,
          completedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const mockFocus: FocusSession[] = [
        {
          id: 'f-1',
          title: 'Deep Focus',
          mode: 'pomodoro',
          durationMinutes: 60,
          interruptionsCount: 0,
          completed: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const mockHabits: Habit[] = [
        {
          id: 'h-1',
          title: 'H1',
          category: 'study',
          frequency: 'daily',
          color: 'coral',
          currentStreak: 4,
          longestStreak: 8,
          completedToday: true,
          history: {},
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];

      const { summary, breakdown } = calculateDailySummary({
        tasks: mockTasks,
        studySessions: mockStudy,
        focusSessions: mockFocus,
        habits: mockHabits
      });

      // 180 study min / 360 capacity = 50%
      expect(breakdown.studyScore).toBe(50);
      expect(breakdown.taskScore).toBe(100);
      expect(breakdown.focusScore).toBe(50); // 60 / 120 = 50%
      expect(breakdown.habitScore).toBe(100);

      // Weighted: 0.3(100) + 0.3(50) + 0.2(50) + 0.2(100) = 30 + 15 + 10 + 20 = 75
      expect(summary.momentumScore).toBe(75);
    });
  });

  describe('5. Local-Date Streak Engine', () => {
    it('calculateStreaks handles active, broken, and continuing streaks safely on local date keys', () => {
      const history = {
        '2026-08-25': true,
        '2026-08-24': true,
        '2026-08-23': true,
        '2026-08-21': true // gap on 2026-08-22
      };

      const result = calculateStreaks(history, '2026-08-25');
      expect(result.currentStreak).toBe(3);
      expect(result.longestStreak).toBe(3);
    });

    it('calculateOverallHabitStreak returns the maximum current streak across habits', () => {
      const habits: Habit[] = [
        {
          id: 'h1',
          title: 'Habit 1',
          category: 'study',
          frequency: 'daily',
          color: 'coral',
          currentStreak: 5,
          longestStreak: 10,
          completedToday: true,
          history: {},
          createdAt: '2026-08-01',
          updatedAt: '2026-08-25'
        },
        {
          id: 'h2',
          title: 'Habit 2',
          category: 'routine',
          frequency: 'daily',
          color: 'amber',
          currentStreak: 12,
          longestStreak: 15,
          completedToday: false,
          history: {},
          createdAt: '2026-08-01',
          updatedAt: '2026-08-25'
        }
      ];

      expect(calculateOverallHabitStreak(habits)).toBe(12);
    });

    it('calculateStudyStreak tracks consecutive daily study sessions', () => {
      const sessions = [
        { completedAt: '2026-08-25T14:00:00' },
        { completedAt: '2026-08-24T10:00:00' },
        { completedAt: '2026-08-23T16:00:00' }
      ];

      const streak = calculateStudyStreak(sessions, '2026-08-25');
      expect(streak).toBe(3);
    });
  });
});
