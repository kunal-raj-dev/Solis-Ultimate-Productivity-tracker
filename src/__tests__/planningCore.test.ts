import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseTimeToMinutes,
  minutesToTimeString,
  formatTimeBlockDuration,
  buildTimeBlocks,
  findTimeBlockConflicts,
  calculateTimeAllocation,
  evaluateRoutinesForDate
} from '../utils/planning/timeBlocking';
import { RecurringStudyRoutine, TimeBlock } from '../types/planning';
import { StudyPlanItem } from '../types/study';
import { Task } from '../types/task';
import { FocusSession } from '../types/focus';
import { MockDataService } from '../services/mock/mockService';

describe('Planning Core — Time-Blocking & Routines Mathematics', () => {
  it('converts time string "HH:mm" to minutes from midnight and back deterministically', () => {
    expect(parseTimeToMinutes('00:00')).toBe(0);
    expect(parseTimeToMinutes('08:30')).toBe(510);
    expect(parseTimeToMinutes('14:45')).toBe(885);
    expect(parseTimeToMinutes('23:59')).toBe(1439);

    expect(minutesToTimeString(0)).toBe('00:00');
    expect(minutesToTimeString(510)).toBe('08:30');
    expect(minutesToTimeString(885)).toBe('14:45');
  });

  it('formats minute durations into human-friendly strings', () => {
    expect(formatTimeBlockDuration(30)).toBe('30m');
    expect(formatTimeBlockDuration(60)).toBe('1h');
    expect(formatTimeBlockDuration(90)).toBe('1h 30m');
    expect(formatTimeBlockDuration(150)).toBe('2h 30m');
  });

  it('builds chronological time blocks by combining study plans, tasks, and focus sessions', () => {
    const studyPlan: StudyPlanItem[] = [
      {
        id: 'spl_1',
        title: 'Distributed Consensus Study',
        subjectId: 'sub_1',
        subjectName: 'Distributed Systems',
        targetMinutes: 60,
        scheduledDate: '2026-08-17',
        scheduledTime: '10:00',
        priority: 'high',
        completed: false
      }
    ];

    const tasks: Task[] = [
      {
        id: 'tsk_1',
        title: 'Submit Storage Report',
        dueDate: '2026-08-17',
        dueTime: '14:00',
        estimatedMinutes: 30,
        priority: 'urgent',
        status: 'todo',
        category: 'study',
        tags: ['storage'],
        subTasks: [],
        createdAt: '2026-08-01',
        updatedAt: '2026-08-01'
      }
    ];

    const focusSessions: FocusSession[] = [
      {
        id: 'foc_1',
        title: 'Deep Architecture Sprint',
        mode: 'pomodoro',
        durationMinutes: 45,
        interruptionsCount: 0,
        completed: true,
        createdAt: '2026-08-17T16:00:00Z',
        updatedAt: '2026-08-17T16:45:00Z'
      }
    ];

    const blocks = buildTimeBlocks({
      studyPlan,
      tasks,
      focusSessions,
      targetDate: '2026-08-17'
    });

    expect(blocks).toHaveLength(3);
    expect(blocks[0].title).toBe('Distributed Consensus Study');
    expect(blocks[1].title).toBe('Submit Storage Report');
  });

  it('detects chronological overlaps and conflicts accurately', () => {
    const block1: TimeBlock = {
      id: 'b1',
      title: 'Consensus Algorithms Study',
      type: 'study_plan',
      startTime: '10:00',
      endTime: '11:00',
      durationMinutes: 60,
      date: '2026-08-17',
      completed: false,
      entityId: 'spl1'
    };

    const block2: TimeBlock = {
      id: 'b2',
      title: 'Distributed Storage Design Task',
      type: 'task_deadline',
      startTime: '10:30',
      endTime: '11:30',
      durationMinutes: 60,
      date: '2026-08-17',
      completed: false,
      entityId: 'tsk1'
    };

    const block3: TimeBlock = {
      id: 'b3',
      title: 'Afternoon Reflection',
      type: 'study_plan',
      startTime: '14:00',
      endTime: '15:00',
      durationMinutes: 60,
      date: '2026-08-17',
      completed: false,
      entityId: 'spl2'
    };

    const conflicts = findTimeBlockConflicts([block1, block2, block3]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].blockA.id).toBe('b1');
    expect(conflicts[0].blockB.id).toBe('b2');
    expect(conflicts[0].overlapMinutes).toBe(30);
  });

  it('calculates aggregate time allocation statistics and deep study metrics', () => {
    const blocks: TimeBlock[] = [
      {
        id: '1',
        title: 'Study 1',
        type: 'study_plan',
        startTime: '09:00',
        endTime: '10:00',
        durationMinutes: 60,
        date: '2026-08-17',
        completed: false,
        entityId: 'e1'
      },
      {
        id: '2',
        title: 'Task 1',
        type: 'task_deadline',
        startTime: '11:00',
        endTime: '11:30',
        durationMinutes: 30,
        date: '2026-08-17',
        completed: false,
        entityId: 'e2'
      },
      {
        id: '3',
        title: 'Focus 1',
        type: 'focus_session',
        startTime: '14:00',
        endTime: '14:45',
        durationMinutes: 45,
        date: '2026-08-17',
        completed: true,
        entityId: 'e3'
      }
    ];

    const stats = calculateTimeAllocation(blocks);
    expect(stats.totalPlannedMinutes).toBe(90);
    expect(stats.deepStudyMinutes).toBe(60);
    expect(stats.taskMinutes).toBe(30);
    expect(stats.focusMinutes).toBe(45);
    expect(stats.conflictCount).toBe(0);
  });

  it('evaluates recurring study routines against target day of week', () => {
    const mondayDate = new Date('2026-08-17T10:00:00Z'); // Monday (Day 1)
    const tuesdayDate = new Date('2026-08-18T10:00:00Z'); // Tuesday (Day 2)

    const routines: RecurringStudyRoutine[] = [
      {
        id: 'rtn_1',
        title: 'Monday & Wednesday Drill',
        subjectId: 'sub_1',
        targetMinutes: 45,
        daysOfWeek: [1, 3],
        scheduledTime: '10:00',
        priority: 'high',
        isActive: true,
        createdAt: '2026-08-01',
        updatedAt: '2026-08-01'
      },
      {
        id: 'rtn_2',
        title: 'Tuesday Drill',
        subjectId: 'sub_2',
        targetMinutes: 60,
        daysOfWeek: [2],
        scheduledTime: '15:00',
        priority: 'medium',
        isActive: true,
        createdAt: '2026-08-01',
        updatedAt: '2026-08-01'
      },
      {
        id: 'rtn_paused',
        title: 'Paused Monday Drill',
        subjectId: 'sub_1',
        targetMinutes: 30,
        daysOfWeek: [1],
        scheduledTime: '12:00',
        priority: 'low',
        isActive: false,
        createdAt: '2026-08-01',
        updatedAt: '2026-08-01'
      }
    ];

    const mondayMatches = evaluateRoutinesForDate(routines, mondayDate);
    expect(mondayMatches).toHaveLength(1);
    expect(mondayMatches[0].id).toBe('rtn_1');

    const tuesdayMatches = evaluateRoutinesForDate(routines, tuesdayDate);
    expect(tuesdayMatches).toHaveLength(1);
    expect(tuesdayMatches[0].id).toBe('rtn_2');
  });
});

describe('Planning Core — MockDataService Integration', () => {
  let service: MockDataService;

  beforeEach(() => {
    service = new MockDataService();
  });

  it('manages recurring study routines CRUD workflows', async () => {
    const initial = await service.routines.getRoutines();
    expect(initial.length).toBeGreaterThan(0);

    const created = await service.routines.createRoutine({
      title: 'Daily Distributed Systems Review',
      subjectId: initial[0].subjectId,
      targetMinutes: 50,
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      scheduledTime: '16:00',
      priority: 'urgent',
      isActive: true
    });

    expect(created.id).toBeDefined();
    expect(created.title).toBe('Daily Distributed Systems Review');

    const updated = await service.routines.updateRoutine(created.id, {
      targetMinutes: 60,
      isActive: false
    });
    expect(updated.targetMinutes).toBe(60);
    expect(updated.isActive).toBe(false);

    const deleted = await service.routines.deleteRoutine(created.id);
    expect(deleted).toBe(true);
  });

  it('materializes active study routines for today without creating duplicates', async () => {
    const today = new Date();
    const dayOfWeek = today.getDay() as any;

    // Create routine active today
    await service.routines.createRoutine({
      title: 'Automated Morning Drill Test',
      subjectId: (await service.study.getSubjects())[0].id,
      targetMinutes: 30,
      daysOfWeek: [dayOfWeek],
      scheduledTime: '08:00',
      priority: 'high',
      isActive: true
    });

    const firstMaterialization = await service.routines.materializeRoutinesForToday();
    expect(firstMaterialization.some((p) => p.title === 'Automated Morning Drill Test')).toBe(true);

    // Second materialization should detect that it already exists and add 0 duplicate items
    const secondMaterialization = await service.routines.materializeRoutinesForToday();
    const duplicates = secondMaterialization.filter((p) => p.title === 'Automated Morning Drill Test');
    expect(duplicates).toHaveLength(0);
  });

  it('supports Exam and Project workspace metadata on Goals', async () => {
    const goals = await service.goals.getGoals();
    const examGoal = goals.find((g) => g.experienceType === 'exam');
    const projectGoal = goals.find((g) => g.experienceType === 'project');

    expect(examGoal).toBeDefined();
    expect(examGoal?.targetScore).toBeDefined();
    expect(examGoal?.examWeight).toBeDefined();

    expect(projectGoal).toBeDefined();
    expect(projectGoal?.projectRepositoryUrl).toBeDefined();
    expect(projectGoal?.deliverables).toBeInstanceOf(Array);
  });
});
