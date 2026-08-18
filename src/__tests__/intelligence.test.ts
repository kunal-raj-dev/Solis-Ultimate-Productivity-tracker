import { describe, it, expect } from 'vitest';
import { generateSolisIntelligenceReport } from '../utils/intelligence';
import { IntelligenceSourceData } from '../utils/intelligence/types';
import { StudySession, StudyPlanItem, StudySubject, StudyTopic } from '../types/study';
import { FocusSession } from '../types/focus';
import { Task } from '../types/task';

describe('Solis Phase 6 — Pure Intelligence Engine Suite', () => {
  const refDate = new Date('2026-08-17T12:00:00.000Z');

  const mockSubjects: StudySubject[] = [
    {
      id: 'subj-1',
      name: 'Computer Science',
      color: 'coral',
      targetHoursPerWeek: 10,
      completedHoursThisWeek: 4,
      status: 'active',
      notesCount: 5,
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z'
    },
    {
      id: 'subj-2',
      name: 'Mathematics',
      color: 'amber',
      targetHoursPerWeek: 8,
      completedHoursThisWeek: 1,
      status: 'active',
      notesCount: 2,
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z'
    },
    {
      id: 'subj-3',
      name: 'Philosophy',
      color: 'lavender',
      targetHoursPerWeek: 4,
      completedHoursThisWeek: 0,
      status: 'active',
      notesCount: 1,
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z'
    }
  ];

  const mockTopics: StudyTopic[] = [
    {
      id: 'top-1',
      subjectId: 'subj-1',
      title: 'Binary Trees',
      orderIndex: 1,
      masteryLevel: 'mastered',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z'
    },
    {
      id: 'top-2',
      subjectId: 'subj-1',
      title: 'Graph Algorithms',
      orderIndex: 2,
      masteryLevel: 'learning',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z'
    },
    {
      id: 'top-3',
      subjectId: 'subj-2',
      title: 'Linear Algebra',
      orderIndex: 1,
      masteryLevel: 'unstudied',
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-01T00:00:00Z'
    }
  ];

  const mockSessions: StudySession[] = [
    // Binary trees studied Aug 9
    {
      id: 'sess-1',
      subjectId: 'subj-1',
      subjectName: 'Computer Science',
      type: 'deep_study',
      durationMinutes: 60,
      topicsCovered: ['Binary Trees'],
      retentionRating: 3,
      completedAt: '2026-08-09T09:30:00.000Z',
      createdAt: '2026-08-09T09:30:00.000Z',
      updatedAt: '2026-08-09T09:30:00.000Z'
    },
    // Binary trees studied again Aug 9
    {
      id: 'sess-2',
      subjectId: 'subj-1',
      subjectName: 'Computer Science',
      type: 'active_recall',
      durationMinutes: 45,
      topicsCovered: ['Binary Trees'],
      retentionRating: 4,
      completedAt: '2026-08-09T14:30:00.000Z',
      createdAt: '2026-08-09T14:30:00.000Z',
      updatedAt: '2026-08-09T14:30:00.000Z'
    },
    // Graph algorithms studied Aug 15
    {
      id: 'sess-3',
      subjectId: 'subj-1',
      subjectName: 'Computer Science',
      type: 'deep_study',
      durationMinutes: 90,
      topicsCovered: ['Graph Algorithms'],
      retentionRating: 5,
      completedAt: '2026-08-15T18:00:00.000Z',
      createdAt: '2026-08-15T18:00:00.000Z',
      updatedAt: '2026-08-15T18:00:00.000Z'
    }
  ];

  const mockPlanItems: StudyPlanItem[] = [
    {
      id: 'plan-1',
      subjectId: 'subj-1',
      subjectName: 'Computer Science',
      title: 'Graph Traversal Practice',
      targetMinutes: 60,
      scheduledDate: '2026-08-15',
      priority: 'high',
      completed: true
    },
    {
      id: 'plan-2',
      subjectId: 'subj-2',
      subjectName: 'Mathematics',
      title: 'Matrix Eigenvalues',
      targetMinutes: 120,
      scheduledDate: '2026-08-14',
      priority: 'high',
      completed: false
    },
    {
      id: 'plan-3',
      subjectId: 'subj-2',
      subjectName: 'Mathematics',
      title: 'Matrix Eigenvalues',
      targetMinutes: 120,
      scheduledDate: '2026-08-16',
      priority: 'high',
      completed: false
    }
  ];

  const mockFocusSessions: FocusSession[] = [
    {
      id: 'foc-1',
      mode: 'deep_flow',
      durationMinutes: 45,
      title: 'Algorithms focus',
      completed: true,
      interruptionsCount: 1,
      createdAt: '2026-08-15T18:00:00.000Z',
      updatedAt: '2026-08-15T18:45:00.000Z'
    }
  ];

  const mockTasks: Task[] = [
    {
      id: 'task-1',
      title: 'Review proof 1',
      status: 'completed',
      priority: 'high',
      category: 'study',
      dueDate: '2026-08-15',
      subTasks: [],
      tags: [],
      createdAt: '2026-08-01T00:00:00Z',
      updatedAt: '2026-08-15T00:00:00Z'
    }
  ];

  const baseData: IntelligenceSourceData = {
    subjects: mockSubjects,
    topics: mockTopics,
    sessions: mockSessions,
    planItems: mockPlanItems,
    focusSessions: mockFocusSessions,
    tasks: mockTasks,
    habits: []
  };

  it('calculates cognitive rhythm metrics deterministically over 28 days', () => {
    const report = generateSolisIntelligenceReport(baseData, '28_days', refDate);
    expect(report.rhythm.totalStudyMinutes).toBe(195);
    expect(report.rhythm.totalStudyHours).toBe(3.3);
    expect(report.rhythm.activeStudyDaysCount).toBe(2);
    expect(report.rhythm.averageSessionDurationMinutes).toBe(65);

    const csEffort = report.rhythm.subjectEfforts.find((s) => s.subjectName === 'Computer Science');
    expect(csEffort?.actualMinutes).toBe(195);
    expect(csEffort?.actualSharePercentage).toBe(100);
  });

  it('evaluates execution intelligence and identifies postponement patterns', () => {
    const report = generateSolisIntelligenceReport(baseData, '28_days', refDate);
    
    expect(report.execution.postponementPatterns.length).toBeGreaterThanOrEqual(1);
    const postponed = report.execution.postponementPatterns[0];
    expect(postponed.title).toBe('Matrix Eigenvalues');
    expect(postponed.uncompletedCount).toBe(2);
  });

  it('computes transparent Solis Study Mastery Signal with recency decay', () => {
    const report = generateSolisIntelligenceReport(baseData, '28_days', refDate);
    const binaryTrees = report.mastery.topics.find((t) => t.topicTitle === 'Binary Trees');

    expect(binaryTrees).toBeDefined();
    if (binaryTrees) {
      expect(binaryTrees.state).toBe('mastered');
      expect(binaryTrees.stateScore).toBe(100);
      expect(binaryTrees.studyCount).toBe(2);
      expect(binaryTrees.repetitionScore).toBe(40);
      expect(binaryTrees.averageRetentionRating).toBe(3.5);
      expect(binaryTrees.retentionScore).toBe(70);
      expect(binaryTrees.daysSinceLastReview).toBe(7);

      // Recency formula: 100 * e^(-0.05 * 7) ≈ 70
      expect(binaryTrees.recencyScore).toBe(70);

      // Composite: 100*0.3 + 40*0.25 + 70*0.25 + 70*0.2 = 30 + 10 + 17.5 + 14 = 71.5 -> 72%
      expect(binaryTrees.compositeMasterySignal).toBe(72);

      // Review recommended since daysSinceLastReview >= 7 and score >= 35
      expect(binaryTrees.isReviewRecommended).toBe(true);
      expect(binaryTrees.reviewReason).toContain('Last studied 7 days ago');
    }
  });

  it('detects neglected subjects when active targets exist without study time', () => {
    const report = generateSolisIntelligenceReport(baseData, '28_days', refDate);
    const mathNeglect = report.attention.neglectAlerts.find((a) => a.subjectName === 'Mathematics');
    expect(mathNeglect).toBeDefined();

    const philNeglect = report.attention.neglectAlerts.find((a) => a.subjectName === 'Philosophy');
    expect(philNeglect).toBeDefined();
    expect(philNeglect?.reason).toContain('has a weekly target of 4h');
  });

  it('generates ranked, actionable recommendations with Signal -> Evidence -> Action', () => {
    const report = generateSolisIntelligenceReport(baseData, '28_days', refDate);
    expect(report.recommendations.length).toBeGreaterThanOrEqual(1);
    expect(report.recommendations.length).toBeLessThanOrEqual(3);

    const primaryRec = report.recommendations[0];
    expect(primaryRec.priority).toBe('primary');
    expect(primaryRec.signal).toBeTruthy();
    expect(primaryRec.evidence).toBeTruthy();
    expect(primaryRec.action).toBeTruthy();
    expect(primaryRec.actionPayload?.suggestedDurationMinutes).toBeGreaterThan(0);
  });

  it('handles completely empty datasets gracefully without fabricating data', () => {
    const emptyData: IntelligenceSourceData = {
      subjects: [],
      topics: [],
      sessions: [],
      planItems: [],
      focusSessions: [],
      tasks: [],
      habits: []
    };

    const report = generateSolisIntelligenceReport(emptyData, 'this_week', refDate);
    expect(report.rhythm.totalStudyMinutes).toBe(0);
    expect(report.rhythm.hasSufficientData).toBe(false);
    expect(report.mastery.topics.length).toBe(0);
    expect(report.recommendations.length).toBe(1);
    expect(report.recommendations[0].title).toBe('Establish Your Study Baseline');
    expect(report.recommendations[0].signal).toContain('take shape');
  });
});
