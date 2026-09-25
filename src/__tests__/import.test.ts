import { describe, it, expect } from 'vitest';
import { validateSolisBackup, executeWorkspaceImport } from '../utils/import';
import { createWorkspaceBackup } from '../utils/export';
import { MockDataService } from '../services/mock/mockService';

describe('Solis Workspace Import & Recovery Engine', () => {
  it('validates a correct solis-export-v1 backup successfully', () => {
    const validBackup = createWorkspaceBackup({
      profile: {
        id: 'usr-1',
        name: 'Scholar',
        email: 'scholar@solis.space',
        focusField: 'Systems',
        preferences: {
          theme: 'light',
          soundEnabled: true,
          defaultFocusDurationMinutes: 25,
          defaultBreakDurationMinutes: 5,
          dailyStudyGoalMinutes: 180,
          dailyTasksGoalCount: 5,
          focusGradientTheme: 'momentum'
        },
        createdAt: '2026-01-01T00:00:00Z',
        updatedAt: '2026-01-01T00:00:00Z'
      },
      subjects: [
        {
          id: 'sub-1',
          name: 'Distributed Systems',
          color: 'coral',
          targetHoursPerWeek: 6,
          completedHoursThisWeek: 2,
          status: 'active',
          notesCount: 4,
          createdAt: '2026-08-17T00:00:00Z',
          updatedAt: '2026-08-17T00:00:00Z'
        }
      ],
      topics: [
        { id: 'top-1', subjectId: 'sub-1', title: 'Raft Consensus', masteryLevel: 'mastered', orderIndex: 0, createdAt: '2026-08-17T00:00:00Z', updatedAt: '2026-08-17T00:00:00Z' }
      ],
      studyPlans: [],
      studySessions: [],
      focusSessions: [],
      tasks: [
        { id: 't-1', title: 'Review Paper', category: 'study', priority: 'high', status: 'todo', subTasks: [], tags: [], createdAt: '2026-08-17T00:00:00Z', updatedAt: '2026-08-17T00:00:00Z' }
      ],
      habits: [],
      goals: [],
      notes: []
    });

    const result = validateSolisBackup(validBackup);
    expect(result.isValid).toBe(true);
    expect(result.summary?.subjectsCount).toBe(1);
    expect(result.summary?.topicsCount).toBe(1);
    expect(result.summary?.tasksCount).toBe(1);
  });

  it('rejects corrupt JSON strings', () => {
    const result = validateSolisBackup('{ "schema": "solis-export-v1", invalid_json ');
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Invalid JSON file');
  });

  it('rejects unsupported schemas', () => {
    const result = validateSolisBackup({ schema: 'notion-backup-v2', version: 1 });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Unsupported backup schema');
  });

  it('rejects unsupported schema versions', () => {
    const result = validateSolisBackup({ schema: 'solis-export-v1', version: 99 });
    expect(result.isValid).toBe(false);
    expect(result.error).toContain('Unsupported schema version');
  });

  it('executes workspace import into MockDataService safely', async () => {
    const mockService = new MockDataService();
    const backup = createWorkspaceBackup({
      profile: null,
      subjects: [
        {
          id: 's-import',
          name: 'Database Internals',
          color: 'amber',
          targetHoursPerWeek: 5,
          completedHoursThisWeek: 0,
          status: 'active',
          notesCount: 0,
          createdAt: '2026-08-17',
          updatedAt: '2026-08-17'
        }
      ],
      topics: [{ id: 'top-import', subjectId: 's-import', title: 'LSM Trees', masteryLevel: 'learning', orderIndex: 0, createdAt: '2026-08-17', updatedAt: '2026-08-17' }],
      studyPlans: [],
      studySessions: [],
      focusSessions: [],
      tasks: [{ id: 't-import', title: 'Implement SSTable', category: 'project', priority: 'medium', status: 'todo', subTasks: [], tags: [], createdAt: '2026-08-17', updatedAt: '2026-08-17' }],
      habits: [],
      goals: [],
      notes: [{ id: 'n-import', title: 'Write-Ahead Log Notes', content: 'WAL is appended sequentially.', category: 'concept', tags: ['storage'], createdAt: '2026-08-17', updatedAt: '2026-08-17' }]
    });

    const result = await executeWorkspaceImport(backup, 'merge_skip', mockService);
    expect(result.importedCount).toBeGreaterThanOrEqual(4);

    const subjects = await mockService.study.getSubjects();
    expect(subjects.some((s) => s.name === 'Database Internals')).toBe(true);

    const notes = await mockService.notes.getNotes();
    expect(notes.some((n) => n.title === 'Write-Ahead Log Notes')).toBe(true);
  });

  it('still validates legacy v1 backups that predate the new collections', () => {
    const legacyBackup = {
      schema: 'solis-export-v1',
      version: 1,
      exportedAt: '2026-01-01T00:00:00Z',
      client: 'Solis Productivity OS',
      profile: {},
      subjects: [],
      topics: [],
      studyPlans: [],
      studySessions: [],
      focusSessions: [],
      tasks: [],
      habits: [],
      goals: [],
      notes: []
    };

    const result = validateSolisBackup(legacyBackup);
    expect(result.isValid).toBe(true);
    expect(result.summary?.routinesCount).toBe(0);
    expect(result.summary?.timeBlocksCount).toBe(0);
    expect(result.summary?.flashcardsCount).toBe(0);
    expect(result.summary?.reflectionsCount).toBe(0);
    expect(result.summary?.resourcesCount).toBe(0);
  });

  it('round-trips every user collection and preserves habit history, milestone flags and SM-2 state', async () => {
    const mockService = new MockDataService();
    const backup = createWorkspaceBackup({
      profile: null,
      subjects: [
        {
          id: 'rt-sub-1',
          name: 'Round Trip Neuroscience',
          color: 'amber',
          targetHoursPerWeek: 5,
          completedHoursThisWeek: 0,
          status: 'active',
          notesCount: 0,
          createdAt: '2026-08-17T00:00:00Z',
          updatedAt: '2026-08-17T00:00:00Z'
        }
      ],
      topics: [
        {
          id: 'rt-top-1',
          subjectId: 'rt-sub-1',
          title: 'Synaptic Plasticity',
          masteryLevel: 'learning',
          orderIndex: 0,
          createdAt: '2026-08-17T00:00:00Z',
          updatedAt: '2026-08-17T00:00:00Z'
        }
      ],
      studyPlans: [
        {
          id: 'rt-plan-1',
          subjectId: 'rt-sub-1',
          subjectName: 'Round Trip Neuroscience',
          topicId: 'rt-top-1',
          title: 'Review LTP papers',
          targetMinutes: 45,
          scheduledDate: '2026-09-01',
          scheduledTime: '02:00 PM',
          priority: 'high',
          completed: true,
          createdAt: '2026-08-17T00:00:00Z'
        }
      ],
      studySessions: [
        {
          id: 'rt-ses-1',
          subjectId: 'rt-sub-1',
          subjectName: 'Round Trip Neuroscience',
          type: 'deep_study',
          durationMinutes: 50,
          topicsCovered: ['LTP'],
          retentionRating: 4,
          completedAt: '2026-08-17T12:00:00Z',
          createdAt: '2026-08-17T11:00:00Z',
          updatedAt: '2026-08-17T12:00:00Z'
        }
      ],
      studyRoutines: [
        {
          id: 'rt-rtn-1',
          subjectId: 'rt-sub-1',
          subjectName: 'Round Trip Neuroscience',
          topicId: 'rt-top-1',
          topicTitle: 'Synaptic Plasticity',
          title: 'Morning Neuro Review',
          targetMinutes: 30,
          daysOfWeek: [1, 3],
          scheduledTime: '07:30',
          priority: 'high',
          isActive: true,
          createdAt: '2026-08-17T00:00:00Z',
          updatedAt: '2026-08-17T00:00:00Z'
        }
      ],
      studyResources: [
        {
          id: 'rt-res-1',
          subjectId: 'rt-sub-1',
          subjectName: 'Round Trip Neuroscience',
          topicId: 'rt-top-1',
          topicTitle: 'Synaptic Plasticity',
          title: 'Principles of Neural Science',
          author: 'Kandel',
          url: 'https://example.com/neuro',
          type: 'book',
          status: 'in_progress',
          rating: 5,
          notes: 'Chapter 12',
          tags: ['neuro'],
          createdAt: '2026-08-17T00:00:00Z',
          updatedAt: '2026-08-17T00:00:00Z'
        }
      ],
      focusSessions: [
        {
          id: 'rt-fcs-1',
          mode: 'deep_flow',
          durationMinutes: 45,
          taskId: 'rt-task-1',
          subjectId: 'rt-sub-1',
          subjectName: 'Round Trip Neuroscience',
          topic: 'Synaptic Plasticity',
          title: 'Deep neuro session',
          completed: true,
          interruptionsCount: 0,
          createdAt: '2026-08-17T09:00:00Z',
          updatedAt: '2026-08-17T10:00:00Z'
        }
      ],
      tasks: [
        {
          id: 'rt-task-1',
          title: 'Summarize plasticity paper',
          category: 'study',
          priority: 'high',
          status: 'todo',
          dueDate: '2026-09-01',
          subTasks: [],
          tags: ['neuro'],
          createdAt: '2026-08-17T00:00:00Z',
          updatedAt: '2026-08-17T00:00:00Z'
        }
      ],
      taskTimeBlocks: [
        {
          id: 'rt-blk-1',
          taskId: 'rt-task-1',
          taskTitle: 'Summarize plasticity paper',
          date: '2026-09-01',
          startHour: 9,
          startMinute: 30,
          durationMinutes: 60,
          subjectId: 'rt-sub-1',
          goalId: 'rt-goal-1',
          priority: 'high',
          status: 'planned',
          actualMinutes: 0,
          progressPercent: 0,
          createdAt: '2026-08-17T00:00:00Z',
          updatedAt: '2026-08-17T00:00:00Z'
        }
      ],
      habits: [
        {
          id: 'rt-hab-1',
          title: 'Round Trip Meditation',
          category: 'wellness',
          frequency: 'daily',
          color: 'coral',
          currentStreak: 2,
          longestStreak: 4,
          completedToday: false,
          history: { '2026-09-01': true, '2026-09-02': true, '2026-09-03': false },
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-01T00:00:00Z'
        }
      ],
      goals: [
        {
          id: 'rt-goal-1',
          title: 'Round Trip Mastery Goal',
          horizon: 'short_term',
          status: 'active',
          category: 'skill',
          priority: 'high',
          color: 'coral',
          targetDate: '2026-09-30',
          progressPercentage: 50,
          milestones: [
            { id: 'rt-m-1', title: 'Read the paper', targetDate: '2026-09-10', completed: true },
            { id: 'rt-m-2', title: 'Write the summary', targetDate: '2026-09-20', completed: false }
          ],
          createdAt: '2026-08-01T00:00:00Z',
          updatedAt: '2026-08-01T00:00:00Z'
        }
      ],
      notes: [
        {
          id: 'rt-note-1',
          title: 'Round Trip Synapse Notes',
          content: 'LTP strengthens synapses.',
          category: 'concept',
          subjectId: 'rt-sub-1',
          tags: ['neuro'],
          createdAt: '2026-08-17T00:00:00Z',
          updatedAt: '2026-08-17T00:00:00Z'
        }
      ],
      flashcards: [
        {
          id: 'rt-fc-1',
          subjectId: 'rt-sub-1',
          topicId: 'rt-top-1',
          noteId: 'rt-note-1',
          frontPrompt: 'What strengthens synapses in LTP?',
          backAnswer: 'Repeated high-frequency stimulation',
          cardType: 'standard',
          difficultyRating: 'hard',
          repetitionCount: 3,
          intervalDays: 7,
          easeFactor: 2.32,
          nextReviewDate: '2026-09-20',
          lastReviewedAt: '2026-09-13T00:00:00Z',
          createdAt: '2026-08-17T00:00:00Z',
          updatedAt: '2026-08-17T00:00:00Z'
        }
      ],
      dailyReflections: [
        {
          id: 'rt-ref-1',
          date: '2026-09-01',
          energyScore: 5,
          focusScore: 4,
          wins: ['Finished the paper'],
          frictionPoints: ['Late start'],
          tomorrowIntentions: ['Start at 8am'],
          synthesisNotes: 'Good day overall',
          completedHabitsCount: 2,
          completedTasksCount: 1,
          studyMinutesLogged: 95,
          reviewCardsCompleted: 12,
          createdAt: '2026-09-01T21:00:00Z',
          updatedAt: '2026-09-01T21:00:00Z'
        }
      ]
    });

    const validated = validateSolisBackup(backup);
    expect(validated.isValid).toBe(true);
    expect(validated.summary?.timeBlocksCount).toBe(1);
    expect(validated.summary?.flashcardsCount).toBe(1);
    expect(validated.summary?.reflectionsCount).toBe(1);
    expect(validated.summary?.routinesCount).toBe(1);
    expect(validated.summary?.resourcesCount).toBe(1);

    // Full restore into the fresh (seeded) workspace: replace mode must clear
    // every collection it restores before importing.
    const result = await executeWorkspaceImport(validated.backup!, 'replace', mockService);
    expect(result.importedCount).toBeGreaterThanOrEqual(11);

    // Core collections survived (existing guarantees stay intact).
    const subjects = await mockService.study.getSubjects();
    const subject = subjects.find((s) => s.name === 'Round Trip Neuroscience');
    expect(subject).toBeDefined();

    const tasks = await mockService.tasks.getTasks();
    const task = tasks.find((t) => t.title === 'Summarize plasticity paper');
    expect(task).toBeDefined();

    // New collection: routines (with mapped subject FK)
    const routines = await mockService.routines.getRoutines();
    const routine = routines.find((r) => r.title === 'Morning Neuro Review');
    expect(routine).toBeDefined();
    expect(routine!.subjectId).toBe(subject!.id);
    expect(routine!.daysOfWeek).toEqual([1, 3]);
    expect(routine!.isActive).toBe(true);

    // New collection: resources (with mapped subject FK)
    const resources = await mockService.resources.getResources();
    const resource = resources.find((r) => r.title === 'Principles of Neural Science');
    expect(resource).toBeDefined();
    expect(resource!.subjectId).toBe(subject!.id);
    expect(resource!.status).toBe('in_progress');

    // New collection: time blocks (task FK remapped to the imported task's new ID)
    const blocks = await mockService.tasks.getAllTimeBlocks!();
    const block = blocks.find((b) => b.date === '2026-09-01' && b.startHour === 9);
    expect(block).toBeDefined();
    expect(block!.taskId).toBe(task!.id);
    expect(block!.subjectId).toBe(subject!.id);
    expect(block!.goalId).toBeDefined();
    expect(block!.startMinute).toBe(30);

    // New collection: flashcards (subject/topic FKs mapped, SM-2 fields preserved)
    const flashcards = await mockService.flashcards.getFlashcards();
    const card = flashcards.find((c) => c.frontPrompt === 'What strengthens synapses in LTP?');
    expect(card).toBeDefined();
    expect(card!.subjectId).toBe(subject!.id);
    const topics = await mockService.study.getTopics(subject!.id);
    const topic = topics.find((t) => t.title === 'Synaptic Plasticity');
    expect(topic).toBeDefined();
    expect(card!.topicId).toBe(topic!.id);
    expect(card!.repetitionCount).toBe(3);
    expect(card!.intervalDays).toBe(7);
    expect(card!.easeFactor).toBe(2.32);
    expect(card!.nextReviewDate).toBe('2026-09-20');

    // New collection: daily reflections (standalone)
    const reflections = await mockService.reflections.getReflections(3650);
    const reflection = reflections.find((r) => r.date === '2026-09-01');
    expect(reflection).toBeDefined();
    expect(reflection!.energyScore).toBe(5);
    expect(reflection!.studyMinutesLogged).toBe(95);

    // Habit completion history survives untouched (true dates restored,
    // explicitly-false dates stay absent, streaks recomputed from history).
    const habits = await mockService.habits.getHabits();
    const habit = habits.find((h) => h.title === 'Round Trip Meditation');
    expect(habit).toBeDefined();
    expect(habit!.history['2026-09-01']).toBe(true);
    expect(habit!.history['2026-09-02']).toBe(true);
    expect(habit!.history['2026-09-03']).toBeFalsy();

    // Goal milestone completed flags survive untouched.
    const goals = await mockService.goals.getGoals();
    const goal = goals.find((g) => g.title === 'Round Trip Mastery Goal');
    expect(goal).toBeDefined();
    const readMilestone = goal!.milestones.find((m) => m.title === 'Read the paper');
    const writeMilestone = goal!.milestones.find((m) => m.title === 'Write the summary');
    expect(readMilestone!.completed).toBe(true);
    expect(writeMilestone!.completed).toBe(false);

    // Study plan items restore with their completion state and mapped subject.
    const plans = await mockService.study.getTodayPlan();
    const plan = plans.find((p) => p.title === 'Review LTP papers');
    expect(plan).toBeDefined();
    expect(plan!.subjectId).toBe(subject!.id);
    expect(plan!.completed).toBe(true);
  });

  it('skips already-existing records in merge_skip mode instead of duplicating them', async () => {
    const mockService = new MockDataService();
    const backup = createWorkspaceBackup({
      profile: null,
      subjects: [
        {
          id: 'dup-sub-1',
          name: 'Merge Skip Physics',
          color: 'coral',
          targetHoursPerWeek: 5,
          completedHoursThisWeek: 0,
          status: 'active',
          notesCount: 0,
          createdAt: '2026-08-17T00:00:00Z',
          updatedAt: '2026-08-17T00:00:00Z'
        }
      ],
      topics: [
        {
          id: 'dup-top-1',
          subjectId: 'dup-sub-1',
          title: 'Merge Skip Optics',
          masteryLevel: 'learning',
          orderIndex: 0,
          createdAt: '2026-08-17T00:00:00Z',
          updatedAt: '2026-08-17T00:00:00Z'
        }
      ],
      studyPlans: [],
      studySessions: [],
      focusSessions: [],
      tasks: [],
      habits: [],
      goals: [],
      notes: [],
      flashcards: [
        {
          id: 'dup-fc-1',
          subjectId: 'dup-sub-1',
          frontPrompt: 'Merge skip prompt?',
          backAnswer: 'Merge skip answer',
          cardType: 'standard',
          difficultyRating: 'good',
          repetitionCount: 1,
          intervalDays: 2,
          easeFactor: 2.5,
          nextReviewDate: '2026-09-10',
          createdAt: '2026-08-17T00:00:00Z',
          updatedAt: '2026-08-17T00:00:00Z'
        }
      ],
      dailyReflections: [
        {
          id: 'dup-ref-1',
          date: '2026-09-05',
          energyScore: 4,
          focusScore: 4,
          wins: [],
          frictionPoints: [],
          tomorrowIntentions: [],
          completedHabitsCount: 0,
          completedTasksCount: 0,
          studyMinutesLogged: 30,
          reviewCardsCompleted: 0,
          createdAt: '2026-09-05T21:00:00Z',
          updatedAt: '2026-09-05T21:00:00Z'
        }
      ]
    });

    await executeWorkspaceImport(backup, 'merge_skip', mockService);
    await executeWorkspaceImport(backup, 'merge_skip', mockService);

    const subjects = await mockService.study.getSubjects();
    expect(subjects.filter((s) => s.name === 'Merge Skip Physics')).toHaveLength(1);

    const subjectsAfterFirst = subjects.find((s) => s.name === 'Merge Skip Physics')!;
    const topics = await mockService.study.getTopics(subjectsAfterFirst.id);
    expect(topics.filter((t) => t.title === 'Merge Skip Optics')).toHaveLength(1);

    const flashcards = await mockService.flashcards.getFlashcards();
    expect(flashcards.filter((c) => c.frontPrompt === 'Merge skip prompt?')).toHaveLength(1);

    const reflections = await mockService.reflections.getReflections(3650);
    expect(reflections.filter((r) => r.date === '2026-09-05')).toHaveLength(1);
  });

  it('restores replace mode without duplicating existing focus sessions (no delete API)', async () => {
    const mockService = new MockDataService();
    // IFocusService exposes no delete on any backend, so a replace-mode
    // restore cannot clear focus sessions first. It must skip the existing
    // record by natural key instead of adding a second copy (master.md §16.3).
    await mockService.focus.saveFocusSession({
      mode: 'pomodoro',
      durationMinutes: 45,
      title: 'Replace Focus Original',
      completed: true
    });

    const backup = createWorkspaceBackup({
      profile: null,
      subjects: [],
      topics: [],
      studyPlans: [],
      studySessions: [],
      focusSessions: [
        {
          id: 'fcs-backup-1',
          mode: 'pomodoro',
          durationMinutes: 45,
          title: 'Replace Focus Original',
          completed: true,
          interruptionsCount: 0,
          createdAt: '2026-09-01T10:00:00Z',
          updatedAt: '2026-09-01T10:00:00Z'
        }
      ],
      tasks: [],
      habits: [],
      goals: [],
      notes: []
    });

    await executeWorkspaceImport(backup, 'replace', mockService);

    const sessions = await mockService.focus.getRecentSessions();
    expect(sessions.filter((s) => s.title === 'Replace Focus Original')).toHaveLength(1);
  });
});
