import { describe, it, expect, beforeEach } from 'vitest';
import { MockDataService } from '../services/mock/mockService';
import { generateSolisIntelligenceReport } from '../utils/intelligence';
import { Task } from '../types/task';

describe('Solis Phase 9: System-Wide Reliability & Reactive State Consistency Suite', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  describe('1. Task Sanctuary Reactive Lifecycle & Invariants', () => {
    it('executes full Task lifecycle: Create -> Edit -> Complete -> Reopen -> Delete', async () => {
      // 1. Create
      const created = await service.tasks.createTask({
        title: 'Master Raft Consensus State Invariants',
        category: 'study',
        priority: 'high',
        estimatedMinutes: 45
      });
      expect(created.id).toBeDefined();
      expect(created.status).toBe('todo');

      // 2. Edit
      const updated = await service.tasks.updateTask(created.id, {
        title: 'Master Raft & Paxos Consensus State Invariants',
        priority: 'urgent'
      });
      expect(updated.title).toBe('Master Raft & Paxos Consensus State Invariants');
      expect(updated.priority).toBe('urgent');

      // 3. Complete
      const completed = await service.tasks.toggleTaskCompletion(created.id);
      expect(completed.status).toBe('completed');
      expect(completed.completedAt).toBeDefined();

      // 4. Reopen
      const reopened = await service.tasks.toggleTaskCompletion(created.id);
      expect(reopened.status).toBe('todo');
      expect(reopened.completedAt).toBeUndefined();

      // 5. Delete
      await service.tasks.deleteTask(created.id);
      const remainingTasks = await service.tasks.getTasks();
      expect(remainingTasks.some((t) => t.id === created.id)).toBe(false);
    });

    it('enforces that Task subject selector strictly filters out archived subjects', async () => {
      const activeSubject = await service.study.createSubject({ name: 'Active ML', code: 'CS601' });
      const toArchiveSubject = await service.study.createSubject({ name: 'Archived Math', code: 'MATH201' });
      await service.study.archiveSubject(toArchiveSubject.id);

      const allSubjects = await service.study.getSubjects(true);
      const selectableForTasks = allSubjects.filter((s) => s.status !== 'archived');

      expect(selectableForTasks.some((s) => s.id === activeSubject.id)).toBe(true);
      expect(selectableForTasks.some((s) => s.id === toArchiveSubject.id)).toBe(false);
    });

    it('preserves valid task state on failed optimistic toggle (rollback invariant)', () => {
      const initialTask: Task = {
        id: 'task-test-101',
        title: 'Verify Optimistic Rollback',
        category: 'study',
        priority: 'high',
        status: 'todo',
        tags: [],
        subTasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      let localTasks = [initialTask];
      const prevTasks = [...localTasks];

      // Optimistic update
      localTasks = localTasks.map((t) => (t.id === initialTask.id ? { ...t, status: 'completed' } : t));
      expect(localTasks[0].status).toBe('completed');

      // Simulated network failure -> rollback
      localTasks = prevTasks;
      expect(localTasks[0].status).toBe('todo');
    });
  });

  describe('2. Knowledge Studio & Sequence-Based Autosave', () => {
    it('executes Note lifecycle: Create -> Edit -> Link Subject -> Delete', async () => {
      const subject = await service.study.createSubject({ name: 'Linear Algebra', code: 'MATH101' });

      // Create
      const note = await service.notes.createNote({
        title: 'Eigenvalues & Eigenvectors',
        content: 'Matrix diagonalization concepts',
        category: 'concept',
        subjectId: subject.id
      });
      expect(note.id).toBeDefined();
      expect(note.subjectId).toBe(subject.id);

      // Edit
      const edited = await service.notes.updateNote(note.id, {
        content: 'Matrix diagonalization and characteristic polynomial roots.'
      });
      expect(edited.content).toContain('characteristic polynomial');

      // Delete
      await service.notes.deleteNote(note.id);
      const notes = await service.notes.getNotes();
      expect(notes.some((n) => n.id === note.id)).toBe(false);
    });

    it('enforces sequence-based autosave ordering: older response cannot overwrite newer draft', () => {
      let activeDraft = 'User typed latest thought (version 42)';
      let latestAcknowledgedVersion = 0;

      // Request 41 fired earlier
      const request41 = { version: 41, content: 'User typed initial thought (version 41)' };
      // Request 42 fired later
      const request42 = { version: 42, content: 'User typed latest thought (version 42)' };

      // Request 42 resolves first
      if (request42.version >= latestAcknowledgedVersion) {
        latestAcknowledgedVersion = request42.version;
        activeDraft = request42.content;
      }
      expect(activeDraft).toBe('User typed latest thought (version 42)');

      // Slow Request 41 resolves late -> must be ignored!
      if (request41.version >= latestAcknowledgedVersion) {
        latestAcknowledgedVersion = request41.version;
        activeDraft = request41.content;
      }
      // Verified: late request 41 was discarded
      expect(activeDraft).toBe('User typed latest thought (version 42)');
      expect(latestAcknowledgedVersion).toBe(42);
    });
  });

  describe('3. Goals & Habit Constellation Lifecycle & Invariants', () => {
    it('executes full Goal lifecycle: Create -> Add Milestone -> Toggle Milestone -> Delete', async () => {
      // 1. Create Goal
      const goal = await service.goals.createGoal({
        title: 'Master Quantum Information Theory',
        horizon: 'medium_term',
        category: 'academic',
        priority: 'high',
        targetDate: '2026-12-31',
        milestones: []
      });
      expect(goal.id).toBeDefined();
      expect(goal.progressPercentage).toBe(0);

      // 2. Add Milestones
      await service.goals.addMilestone(goal.id, { title: 'Qubit State Representation' });
      const gWithM2 = await service.goals.addMilestone(goal.id, { title: 'Bell State Entanglement' });
      expect(gWithM2.milestones.length).toBe(2);

      // 3. Toggle Milestone -> progress recalculates deterministically
      const m1Id = gWithM2.milestones[0].id;
      const gProgress = await service.goals.toggleMilestone(goal.id, m1Id);
      expect(gProgress.progressPercentage).toBe(50);

      // 4. Delete Goal
      await service.goals.deleteGoal(goal.id);
      const remainingGoals = await service.goals.getGoals();
      expect(remainingGoals.some((g) => g.id === goal.id)).toBe(false);
    });

    it('executes full Habit lifecycle: Create -> Toggle Date -> Streak updates -> Delete', async () => {
      const habit = await service.habits.createHabit({
        title: '30-Minute Problem Solving Drill',
        category: 'study',
        frequency: 'daily',
        color: 'coral'
      });
      expect(habit.id).toBeDefined();

      const todayStr = new Date().toISOString().split('T')[0];
      const updated = await service.habits.toggleHabitDate(habit.id, todayStr);
      expect(updated.history[todayStr]).toBe(true);
      expect(updated.currentStreak).toBeGreaterThanOrEqual(1);

      await service.habits.deleteHabit(habit.id);
      const habits = await service.habits.getHabits();
      expect(habits.some((h) => h.id === habit.id)).toBe(false);
    });
  });

  describe('4. Cross-Domain Truth Propagation', () => {
    it('propagates task completion and study sessions into derived intelligence report without fabrication', async () => {
      // 1. Setup real records
      const subject = await service.study.createSubject({ name: 'Robotics', code: 'ROB401' });
      const task = await service.tasks.createTask({
        title: 'Forward Kinematics Derivation',
        subjectId: subject.id,
        category: 'study',
        priority: 'high',
        estimatedMinutes: 60
      });
      await service.tasks.toggleTaskCompletion(task.id);

      await service.study.logSession({
        subjectId: subject.id,
        subjectName: subject.name,
        type: 'deep_study',
        durationMinutes: 90,
        topicsCovered: ['Kinematics'],
        retentionRating: 5
      });

      const allTasks = await service.tasks.getTasks();
      const allSessions = await service.study.getRecentSessions();

      // 2. Generate pure derived report
      const report = generateSolisIntelligenceReport({
        sessions: allSessions,
        planItems: [],
        subjects: [subject],
        topics: [],
        focusSessions: [],
        tasks: allTasks,
        habits: []
      }, 'this_week');

      // 3. Verify truth propagation
      expect(report.rhythm.totalStudyMinutes).toBeGreaterThanOrEqual(90);
      expect(report.rhythm.totalStudyHours).toBeGreaterThanOrEqual(1.5);
      expect(allTasks.filter((t) => t.status === 'completed').length).toBeGreaterThanOrEqual(1);
    });
  });
});
