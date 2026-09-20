import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { Goal } from '../types/goal';
import { validateGoalInput } from '../utils/validation';
import { calculateExamReadiness } from '../utils/intelligence/masteryIntelligence';
import { StudyTopic } from '../types/study';
import { Flashcard } from '../types/learning';
import { Habit } from '../types/habit';

describe('Goal Horizons & Command Center — Service & Data Integrity', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  it('creates standard goals and preserves all fields', async () => {
    const created = await service.goals.createGoal({
      title: 'Master Classical Mechanics',
      description: 'Understand Lagrangian and Hamiltonian mechanics in depth.',
      horizon: 'medium_term',
      status: 'active',
      category: 'academic',
      experienceType: 'standard',
      targetDate: '2026-12-15',
      priority: 'high'
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Master Classical Mechanics');
    expect(created.horizon).toBe('medium_term');
    expect(created.category).toBe('academic');
    expect(created.experienceType).toBe('standard');
    expect(created.progressPercentage).toBe(0);
    expect(created.milestones).toHaveLength(0);
  });

  it('preserves Exam Workspace metadata (targetScore, examWeight) on creation and updates', async () => {
    const examGoal = await service.goals.createGoal({
      title: 'CS 550 Advanced Operating Systems Final',
      horizon: 'short_term',
      category: 'academic',
      experienceType: 'exam',
      targetDate: '2026-10-20',
      priority: 'urgent',
      targetScore: '98% Distinction',
      examWeight: 45
    });

    expect(examGoal.experienceType).toBe('exam');
    expect(examGoal.targetScore).toBe('98% Distinction');
    expect(examGoal.examWeight).toBe(45);

    const updated = await service.goals.updateGoal(examGoal.id, {
      targetScore: '100% Honors',
      examWeight: 50
    });

    expect(updated.targetScore).toBe('100% Honors');
    expect(updated.examWeight).toBe(50);
  });

  it('preserves Project Workspace metadata (repository, deliverables) on creation and updates', async () => {
    const projectGoal = await service.goals.createGoal({
      title: 'Distributed File System Capstone',
      horizon: 'medium_term',
      category: 'career',
      experienceType: 'project',
      targetDate: '2026-11-30',
      priority: 'high',
      projectRepositoryUrl: 'https://github.com/scholar/dfs-capstone',
      deliverables: ['Metadata Raft Server', 'Chunk Server Replication', 'Client SDK']
    });

    expect(projectGoal.experienceType).toBe('project');
    expect(projectGoal.projectRepositoryUrl).toBe('https://github.com/scholar/dfs-capstone');
    expect(projectGoal.deliverables).toHaveLength(3);
    expect(projectGoal.deliverables).toContain('Metadata Raft Server');

    const updated = await service.goals.updateGoal(projectGoal.id, {
      deliverables: ['Metadata Raft Server', 'Chunk Server Replication', 'Client SDK', 'Benchmark Suite']
    });

    expect(updated.deliverables).toHaveLength(4);
  });

  it('calculates initial progress percentage if initial milestones are provided', async () => {
    const goalWithMilestones = await service.goals.createGoal({
      title: 'Quantum Computing Foundations',
      horizon: 'long_term',
      category: 'skill',
      targetDate: '2027-01-01',
      milestones: [
        { id: 'm1', title: 'Qubits and Superposition', targetDate: '2026-09-01', completed: true },
        { id: 'm2', title: 'Quantum Teleportation', targetDate: '2026-10-01', completed: false }
      ]
    });

    expect(goalWithMilestones.milestones).toHaveLength(2);
    expect(goalWithMilestones.progressPercentage).toBe(50);
  });

  it('handles milestone lifecycle: add, toggle, update, delete with automatic progress recalculation', async () => {
    const goal = await service.goals.createGoal({
      title: 'Neural Networks from Scratch',
      horizon: 'short_term',
      category: 'skill',
      targetDate: '2026-11-01'
    });

    // 1. Add Milestone
    const withM1 = await service.goals.addMilestone(goal.id, {
      title: 'Implement Backprop in Python',
      targetDate: '2026-09-15'
    });
    expect(withM1.milestones).toHaveLength(1);
    expect(withM1.progressPercentage).toBe(0);

    // 2. Add second Milestone
    const withM2 = await service.goals.addMilestone(goal.id, {
      title: 'Convolutional Layer Forward & Backward',
      targetDate: '2026-09-30'
    });
    expect(withM2.milestones).toHaveLength(2);

    // 3. Toggle first milestone -> 50%
    const toggled1 = await service.goals.toggleMilestone(goal.id, withM2.milestones[0].id);
    expect(toggled1.progressPercentage).toBe(50);
    expect(toggled1.status).toBe('active');

    // 4. Update milestone title and target date
    if (service.goals.updateMilestone) {
      const updatedM = await service.goals.updateMilestone(goal.id, withM2.milestones[1].id, {
        title: 'Optimized CNN with CUDA kernels',
        targetDate: '2026-10-15'
      });
      const m = updatedM.milestones.find((x) => x.id === withM2.milestones[1].id);
      expect(m?.title).toBe('Optimized CNN with CUDA kernels');
      expect(m?.targetDate).toBe('2026-10-15');
    }

    // 5. Toggle second milestone -> 100% -> Auto-completes goal
    const toggled2 = await service.goals.toggleMilestone(goal.id, withM2.milestones[1].id);
    expect(toggled2.progressPercentage).toBe(100);
    expect(toggled2.status).toBe('completed');

    // 6. Untoggle -> re-activates goal
    const untoggled = await service.goals.toggleMilestone(goal.id, withM2.milestones[1].id);
    expect(untoggled.progressPercentage).toBe(50);
    expect(untoggled.status).toBe('active');

    // 7. Delete milestone
    const deleted = await service.goals.deleteMilestone(goal.id, withM2.milestones[0].id);
    expect(deleted.milestones).toHaveLength(1);
    expect(deleted.progressPercentage).toBe(0);
  });

  it('synchronizes goal status with milestone lifecycle: addMilestone reactivates completed goal', async () => {
    const goal = await service.goals.createGoal({
      title: 'Algorithm Design Mastery',
      horizon: 'short_term',
      milestones: [
        { id: 'm1', title: 'Dynamic Programming', targetDate: '2026-10-01', completed: true }
      ]
    });

    // Should auto-complete if created with 100% completed milestones
    expect(goal.progressPercentage).toBe(100);
    expect(goal.status).toBe('completed');

    // Adding a new incomplete milestone must reactivate goal to 'active'
    const withNew = await service.goals.addMilestone(goal.id, {
      title: 'Network Flows',
      targetDate: '2026-10-15'
    });

    expect(withNew.progressPercentage).toBe(50);
    expect(withNew.status).toBe('active');
  });

  it('synchronizes goal status with milestone lifecycle: deleteMilestone auto-completes or reactivates properly', async () => {
    // 1. Goal with 1 completed, 1 incomplete
    const goal = await service.goals.createGoal({
      title: 'System Design Architecture',
      horizon: 'short_term',
      milestones: [
        { id: 'm1', title: 'Consistent Hashing', targetDate: '2026-10-01', completed: true },
        { id: 'm2', title: 'Bloom Filters', targetDate: '2026-10-02', completed: false }
      ]
    });
    expect(goal.status).toBe('active');

    // Deleting the incomplete milestone leaves 100% completed -> auto-completes
    const afterDeleteIncomplete = await service.goals.deleteMilestone(goal.id, 'm2');
    expect(afterDeleteIncomplete.progressPercentage).toBe(100);
    expect(afterDeleteIncomplete.status).toBe('completed');

    // Add milestone -> reactivates
    const reactivated = await service.goals.addMilestone(goal.id, { title: 'LSM Trees' });
    expect(reactivated.status).toBe('active');
  });
});

describe('Goal Horizons — Input Validation & Error Handling', () => {
  it('rejects empty or whitespace-only goal titles', () => {
    expect(validateGoalInput({ title: '' }).success).toBe(false);
    expect(validateGoalInput({ title: '   ' }).success).toBe(false);
  });

  it('rejects titles exceeding 200 characters', () => {
    const longTitle = 'a'.repeat(201);
    const res = validateGoalInput({ title: longTitle });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toContain('200 characters');
    }
  });

  it('validates target date strings', () => {
    expect(validateGoalInput({ title: 'Valid', targetDate: 'invalid-date' }).success).toBe(false);
    expect(validateGoalInput({ title: 'Valid', targetDate: '2026-12-31' }).success).toBe(true);
  });
});

describe('Goal Horizons — Exam Readiness Deterministic Intelligence', () => {
  it('computes accurate readiness scores from topics, flashcards, habits, and milestones', () => {
    const goal: Goal = {
      id: 'g_exam_1',
      title: 'Distributed Systems Midterm',
      horizon: 'short_term',
      status: 'active',
      category: 'academic',
      experienceType: 'exam',
      subjectId: 'sbj_ds',
      targetDate: '2026-10-15',
      progressPercentage: 50,
      priority: 'urgent',
      color: 'coral',
      milestones: [
        { id: 'm1', title: 'Read Ch 1-4', targetDate: '2026-09-10', completed: true },
        { id: 'm2', title: 'Practice Problems', targetDate: '2026-09-20', completed: false }
      ],
      createdAt: '2026-08-01',
      updatedAt: '2026-08-01'
    };

    const topics: StudyTopic[] = [
      { id: 't1', subjectId: 'sbj_ds', title: 'Consensus', orderIndex: 1, masteryLevel: 'mastered', createdAt: '', updatedAt: '' },
      { id: 't2', subjectId: 'sbj_ds', title: 'Replication', orderIndex: 2, masteryLevel: 'mastered', createdAt: '', updatedAt: '' }
    ];

    const flashcards: Flashcard[] = [
      {
        id: 'fc1',
        subjectId: 'sbj_ds',
        frontPrompt: 'What is Raft?',
        backAnswer: 'Consensus algorithm',
        cardType: 'standard',
        difficultyRating: 'good',
        intervalDays: 14,
        easeFactor: 2.5,
        repetitionCount: 4,
        nextReviewDate: new Date(Date.now() + 86400000 * 5).toISOString(),
        createdAt: '',
        updatedAt: ''
      }
    ];

    const habits: Habit[] = [
      {
        id: 'h1',
        goalId: 'g_exam_1',
        title: 'Daily Paper Reading',
        category: 'study',
        frequency: 'daily',
        color: 'coral',
        currentStreak: 12,
        longestStreak: 15,
        completedToday: true,
        history: {},
        createdAt: '',
        updatedAt: ''
      }
    ];

    const result = calculateExamReadiness({
      goal,
      topics,
      flashcards,
      habits
    });

    expect(result.readinessScore).toBeGreaterThanOrEqual(80);
    expect(result.grade).toBe('Exceptional');
    expect(result.gradeColor).toBe('sage');
    expect(result.componentScores.topicsScore).toBe(100);
    expect(result.componentScores.habitScore).toBe(100);
    expect(result.componentScores.milestoneScore).toBe(50);
  });

  it('detects borderline or at-risk exam preparedness when topics and cards are unstudied or overdue', () => {
    const goal: Goal = {
      id: 'g_exam_2',
      title: 'Compiler Design Final',
      horizon: 'short_term',
      status: 'active',
      category: 'academic',
      experienceType: 'exam',
      subjectId: 'sbj_comp',
      targetDate: '2026-09-25',
      progressPercentage: 0,
      priority: 'urgent',
      color: 'coral',
      milestones: [],
      createdAt: '',
      updatedAt: ''
    };

    const topics: StudyTopic[] = [
      { id: 't1', subjectId: 'sbj_comp', title: 'Parsing', orderIndex: 1, masteryLevel: 'unstudied', createdAt: '', updatedAt: '' },
      { id: 't2', subjectId: 'sbj_comp', title: 'Code Generation', orderIndex: 2, masteryLevel: 'unstudied', createdAt: '', updatedAt: '' }
    ];

    const flashcards: Flashcard[] = [
      {
        id: 'fc1',
        subjectId: 'sbj_comp',
        frontPrompt: 'LL(1) grammar condition',
        backAnswer: 'No first/follow conflicts',
        cardType: 'standard',
        difficultyRating: 'hard',
        intervalDays: 1,
        easeFactor: 1.3,
        repetitionCount: 1,
        nextReviewDate: new Date(Date.now() - 86400000 * 10).toISOString(), // 10 days overdue
        createdAt: '',
        updatedAt: ''
      }
    ];

    const result = calculateExamReadiness({
      goal,
      topics,
      flashcards,
      habits: []
    });

    expect(result.readinessScore).toBeLessThan(60);
    expect(['Borderline', 'At Risk']).toContain(result.grade);
    expect(result.riskDiagnostics.length).toBeGreaterThan(0);
  });

  it('honestly reports 0% readiness and At Risk status when no topics, flashcards, habits, or milestones exist', () => {
    const emptyGoal: Goal = {
      id: 'g_empty_exam',
      title: 'Real Analysis Qualifying Exam',
      horizon: 'medium_term',
      status: 'active',
      category: 'academic',
      experienceType: 'exam',
      subjectId: 'sbj_math',
      targetDate: '2026-12-01',
      progressPercentage: 0,
      priority: 'high',
      color: 'coral',
      milestones: [],
      createdAt: '',
      updatedAt: ''
    };

    const result = calculateExamReadiness({
      goal: emptyGoal,
      topics: [],
      flashcards: [],
      habits: []
    });

    // Should NOT report a fake 72% or 'Prepared' for an unstudied exam with 0 items!
    expect(result.readinessScore).toBe(0);
    expect(result.grade).toBe('At Risk');
    expect(result.riskDiagnostics.length).toBeGreaterThan(0);
  });
});

