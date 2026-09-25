import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  synthesizeDailyTimeline,
  buildTimeBlocks,
  findTimeBlockConflicts,
  calculateTimeAllocation
} from '../utils/planning/timeBlocking';
import {
  getOccupiedHours,
  findNextAvailableSlot,
  getReplanSuggestions
} from '../utils/tasks/replanEngine';
import { Task, TaskTimeBlock } from '../types/task';
import { StudyPlanItem } from '../types/study';
import { RecurringStudyRoutine } from '../types/planning';
import { FocusSession } from '../types/focus';
import { ServiceContainer, dataService } from '../services/dataService';

describe('Phase 2 — Schedule & Tasks Consolidation Suite', () => {
  beforeEach(() => {
    ServiceContainer.switchToMock();
  });

  afterEach(() => {
    ServiceContainer.switchToSupabase();
  });

  describe('synthesizeDailyTimeline Engine', () => {
    const today = '2026-09-25';

    it('merges TaskTimeBlock, StudyPlanItem, RecurringStudyRoutine, and FocusSession into single chronological timeline', () => {
      const taskBlocks: TaskTimeBlock[] = [
        {
          id: 'tb-1',
          taskTitle: 'Algorithm Practice',
          date: today,
          startHour: 10,
          startMinute: 0,
          durationMinutes: 60,
          priority: 'high',
          status: 'planned',
          createdAt: today,
          updatedAt: today
        }
      ];

      const studyPlan: StudyPlanItem[] = [
        {
          id: 'sp-1',
          title: 'Algorithms Revision',
          subjectId: 'sub-cs',
          subjectName: 'Computer Science',
          scheduledDate: today,
          scheduledTime: '08:30',
          targetMinutes: 60,
          priority: 'high',
          completed: false
        }
      ];

      const routines: RecurringStudyRoutine[] = [
        {
          id: 'rtn-1',
          title: 'Daily Evening Review',
          subjectId: 'sub-cs',
          subjectName: 'Computer Science',
          daysOfWeek: [new Date(today).getDay() as any],
          scheduledTime: '17:00',
          targetMinutes: 60,
          priority: 'medium',
          isActive: true,
          createdAt: today,
          updatedAt: today
        }
      ];

      const focusSessions: FocusSession[] = [
        {
          id: 'fs-1',
          mode: 'focus',
          durationMinutes: 45,
          completed: true,
          date: today,
          createdAt: `${today}T14:00:00`,
          startTime: '14:00'
        } as any
      ];

      const tasks: Task[] = [
        {
          id: 't-deadline',
          title: 'Submit Assignment',
          category: 'study',
          priority: 'urgent',
          status: 'todo',
          dueDate: today,
          dueTime: '20:00',
          estimatedMinutes: 30,
          tags: [],
          subTasks: [],
          createdAt: today,
          updatedAt: today
        }
      ];

      const blocks = synthesizeDailyTimeline({
        taskTimeBlocks: taskBlocks,
        studyPlan,
        routines,
        focusSessions,
        tasks,
        targetDate: today
      });

      // Verify all 5 entities are represented
      expect(blocks.length).toBe(5);

      // Verify chronological sorting (08:30 -> 10:00 -> 14:00 -> 17:00 -> 20:00)
      expect(blocks[0].type).toBe('study_plan');
      expect(blocks[0].startTime).toBe('08:30');
      expect(blocks[0].title).toBe('Algorithms Revision');

      expect(blocks[1].type).toBe('task_block');
      expect(blocks[1].startTime).toBe('10:00');
      expect(blocks[1].title).toBe('Algorithm Practice');

      expect(blocks[2].type).toBe('focus_session');
      expect(blocks[2].startTime).toBe('14:00');
      expect(blocks[2].completed).toBe(true);

      expect(blocks[3].type).toBe('routine');
      expect(blocks[3].startTime).toBe('17:00');
      expect(blocks[3].title).toBe('Daily Evening Review');

      expect(blocks[4].type).toBe('task_deadline');
      expect(blocks[4].startTime).toBe('19:30');
      expect(blocks[4].endTime).toBe('20:00');
      expect(blocks[4].title).toBe('Submit Assignment');
    });

    it('accurately identifies conflicts across heterogeneous block types', () => {
      const taskBlocks: TaskTimeBlock[] = [
        {
          id: 'tb-conflict-1',
          taskTitle: 'Project Sprint',
          date: today,
          startHour: 10,
          durationMinutes: 120, // 10:00 to 12:00
          priority: 'urgent',
          status: 'planned',
          createdAt: today,
          updatedAt: today
        }
      ];

      const studyPlan: StudyPlanItem[] = [
        {
          id: 'sp-conflict-2',
          title: 'Math Proofs',
          subjectId: 'sub-math',
          subjectName: 'Mathematics',
          scheduledDate: today,
          scheduledTime: '11:00', // overlaps with Project Sprint (10:00-12:00)
          targetMinutes: 60,
          priority: 'high',
          completed: false
        }
      ];

      const blocks = buildTimeBlocks({
        taskTimeBlocks: taskBlocks,
        studyPlan,
        targetDate: today
      });

      const conflicts = findTimeBlockConflicts(blocks);
      expect(conflicts.length).toBeGreaterThan(0);
      expect(conflicts.some(c => c.blockA.entityId === 'tb-conflict-1' || c.blockB.entityId === 'tb-conflict-1')).toBe(true);
    });

    it('calculates time allocation stats accounting for task blocks and routines', () => {
      const taskBlocks: TaskTimeBlock[] = [
        {
          id: 'tb-stat',
          taskTitle: 'Feature Dev',
          date: today,
          startHour: 9,
          durationMinutes: 90,
          priority: 'medium',
          status: 'planned',
          createdAt: today,
          updatedAt: today
        }
      ];

      const routines: RecurringStudyRoutine[] = [
        {
          id: 'rtn-stat',
          title: 'Morning Ritual',
          subjectId: 'sub-mindset',
          subjectName: 'Mindset',
          daysOfWeek: [new Date(today).getDay() as any],
          scheduledTime: '07:00',
          targetMinutes: 30,
          priority: 'low',
          isActive: true,
          createdAt: today,
          updatedAt: today
        }
      ];

      const blocks = buildTimeBlocks({
        taskTimeBlocks: taskBlocks,
        routines,
        targetDate: today
      });

      const stats = calculateTimeAllocation(blocks);
      expect(stats.totalPlannedMinutes).toBe(120); // 90m task block + 30m routine
      expect(stats.taskMinutes).toBe(90);
      expect(stats.deepStudyMinutes).toBe(30);
    });
  });

  describe('replanEngine Multi-Hour Collision Defense', () => {
    it('occupies multiple hours for a block with duration > 60m', () => {
      const blocks: TaskTimeBlock[] = [
        {
          id: 'tb-long',
          taskTitle: 'Deep Study 120m',
          date: '2026-09-25',
          startHour: 9,
          durationMinutes: 120, // Occupies 9 and 10
          priority: 'high',
          status: 'planned',
          createdAt: '2026-09-25',
          updatedAt: '2026-09-25'
        }
      ];

      const occupied = getOccupiedHours(blocks);
      expect(occupied.has(9)).toBe(true);
      expect(occupied.has(10)).toBe(true);
      expect(occupied.has(11)).toBe(false);
    });

    it('finds next available slot respecting target block duration to prevent overlapping slots', () => {
      const blocks: TaskTimeBlock[] = [
        {
          id: 'tb-1',
          taskTitle: 'Block 1',
          date: '2026-09-25',
          startHour: 9,
          durationMinutes: 60, // Occupies 9:00-10:00
          priority: 'high',
          status: 'planned',
          createdAt: '2026-09-25',
          updatedAt: '2026-09-25'
        },
        {
          id: 'tb-2',
          taskTitle: 'Block 2',
          date: '2026-09-25',
          startHour: 11,
          durationMinutes: 60, // Occupies 11:00-12:00
          priority: 'high',
          status: 'planned',
          createdAt: '2026-09-25',
          updatedAt: '2026-09-25'
        }
      ];

      // A 2-hour block starting search at afterHour=8:
      // Hour 9 is occupied.
      // Hour 10 is free, but 10 + 2 = 12 overlaps hour 11!
      // Therefore next fit for a 120m block must be 12:00.
      const slot = findNextAvailableSlot('2026-09-25', blocks, 8, 120);
      expect(slot).toEqual({ hour: 12, minute: 0 });

      // A 1-hour block starting search at afterHour=8 fits right into the gap at 10:00.
      const slot1h = findNextAvailableSlot('2026-09-25', blocks, 8, 60);
      expect(slot1h).toEqual({ hour: 10, minute: 0 });
    });

    it('excludes target block itself from occupied hours during replan suggestions', () => {
      const blockToReplan: TaskTimeBlock = {
        id: 'tb-target',
        taskTitle: 'Target to Move',
        date: '2026-09-25',
        startHour: 14,
        durationMinutes: 60,
        priority: 'medium',
        status: 'partial',
        createdAt: '2026-09-25',
        updatedAt: '2026-09-25'
      };

      const otherBlocks: TaskTimeBlock[] = [blockToReplan];
      const suggestions = getReplanSuggestions(blockToReplan, otherBlocks, 14);

      // Suggestions should exist and have valid hours between 8 and 22
      expect(suggestions.length).toBeGreaterThan(0);
      suggestions.forEach(s => {
        expect(s.startHour).toBeGreaterThanOrEqual(8);
        expect(s.startHour).toBeLessThanOrEqual(22);
      });
    });
  });

  describe('Unscheduled Task Filter Integrity', () => {
    it('supports unscheduled timeFilter in dataService', async () => {
      // Create a task without dueDate
      const unscheduledTask = await dataService.tasks.createTask({
        title: 'Unscheduled Test Task',
        category: 'project',
        priority: 'medium',
        estimatedMinutes: 45
      });

      // Create a dated task
      const datedTask = await dataService.tasks.createTask({
        title: 'Dated Task',
        category: 'study',
        priority: 'high',
        dueDate: '2026-09-25',
        estimatedMinutes: 30
      });

      const unscheduledResults = await dataService.tasks.getTasks({ timeFilter: 'unscheduled' });
      expect(unscheduledResults.some(t => t.id === unscheduledTask.id)).toBe(true);
      expect(unscheduledResults.some(t => t.id === datedTask.id)).toBe(false);

      // Cleanup
      await dataService.tasks.deleteTask(unscheduledTask.id);
      await dataService.tasks.deleteTask(datedTask.id);
    });
  });
});
