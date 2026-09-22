import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { parseNLPTaskInput } from '../utils/tasks/nlpParser';
import {
  calculateNextDueDate,
  shouldSpawnNextOccurrence,
  spawnNextRecurringOccurrence
} from '../utils/tasks/recurrenceEngine';
import {
  calculateWorkload,
  formatMinutesFriendly
} from '../utils/tasks/workloadCalculator';
import {
  findNextAvailableSlot,
  getTomorrowDateString,
  getReplanSuggestions
} from '../utils/tasks/replanEngine';
import { ServiceContainer, dataService } from '../services/dataService';
import { Task, TaskTimeBlock } from '../types/task';
import { getISODateString } from '../utils/date';

const createMockTask = (overrides: Partial<Task>): Task => ({
  id: `task-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  title: 'Mock Task',
  status: 'todo',
  priority: 'medium',
  category: 'study',
  subTasks: [],
  tags: [],
  createdAt: '2026-10-15T08:00:00.000Z',
  updatedAt: '2026-10-15T08:00:00.000Z',
  ...overrides
});

const createMockBlock = (overrides: Partial<TaskTimeBlock>): TaskTimeBlock => ({
  id: `block-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  date: '2026-10-15',
  startHour: 9,
  startMinute: 0,
  durationMinutes: 60,
  taskTitle: 'Mock Block',
  priority: 'medium',
  status: 'planned',
  progressPercent: 0,
  createdAt: '2026-10-15T08:00:00.000Z',
  updatedAt: '2026-10-15T08:00:00.000Z',
  ...overrides
});

describe('SOLIS PART 1 — Tasks & Daily Horizon Engineering Suite', () => {
  /* =========================================================================
     1. Natural Language Processing (NLP) Parser
     ========================================================================= */
  describe('Natural Language Task Input Parser (nlpParser)', () => {
    const mockSubjects = [
      { id: 'sub-comp-arch', name: 'Computer Architecture' },
      { id: 'sub-dist-sys', name: 'Distributed Systems' }
    ];

    it('extracts dates, 12h times, durations, and priorities accurately', () => {
      const input = 'Study Raft consensus tomorrow at 3pm for 90m !high';
      const result = parseNLPTaskInput(input, mockSubjects);

      expect(result.dueDate).toBeDefined();
      expect(result.dueTime).toBe('15:00');
      expect(result.estimatedMinutes).toBe(90);
      expect(result.priority).toBe('high');
      expect(result.title).toBe('Study Raft consensus');
      expect(result.chips.length).toBeGreaterThanOrEqual(4);
    });

    it('extracts 24h format times and custom tags', () => {
      const input = 'System kernel profiling at 14:30 for 2h !urgent #linux #kernel';
      const result = parseNLPTaskInput(input);

      expect(result.dueTime).toBe('14:30');
      expect(result.estimatedMinutes).toBe(120);
      expect(result.priority).toBe('urgent');
      expect(result.tags).toEqual(['linux', 'kernel']);
      expect(result.title).toBe('System kernel profiling');
    });

    it('extracts recurrence frequencies (daily, weekdays, weekly)', () => {
      const dailyInput = 'Daily sync meeting at 10am every day';
      const dailyResult = parseNLPTaskInput(dailyInput);
      expect(dailyResult.recurrence?.frequency).toBe('daily');

      const weekdayInput = 'Standup every weekday at 9am';
      const weekdayResult = parseNLPTaskInput(weekdayInput);
      expect(weekdayResult.recurrence?.frequency).toBe('weekdays');

      const weeklyInput = 'Architecture review weekly on friday';
      const weeklyResult = parseNLPTaskInput(weeklyInput);
      expect(weeklyResult.recurrence?.frequency).toBe('weekly');
    });

    it('detects domain categories via @ prefix', () => {
      const input = 'Synthesize lecture notes @study';
      const result = parseNLPTaskInput(input);
      expect(result.category).toBe('study');
      expect(result.title).toBe('Synthesize lecture notes');

      const deepInput = 'Build Raft cluster @deep_work !urgent';
      const deepResult = parseNLPTaskInput(deepInput);
      expect(deepResult.category).toBe('deep_work');
      expect(deepResult.priority).toBe('urgent');
      expect(deepResult.title).toBe('Build Raft cluster');
    });

    it('matches known subjects without requiring special syntax', () => {
      const input = 'Review Distributed Systems homework tomorrow for 45m';
      const result = parseNLPTaskInput(input, mockSubjects);

      expect(result.subjectId).toBe('sub-dist-sys');
      expect(result.estimatedMinutes).toBe(45);
      expect(result.title).toBe('Review homework');
    });

    it('handles empty and malformed inputs gracefully without throwing', () => {
      const emptyRes = parseNLPTaskInput('');
      expect(emptyRes.title).toBe('');
      expect(emptyRes.chips).toHaveLength(0);

      const whitespaceRes = parseNLPTaskInput('   \n  \t  ');
      expect(whitespaceRes.title).toBe('');
      expect(whitespaceRes.chips).toHaveLength(0);

      const symbolOnlyRes = parseNLPTaskInput('!p1 #tag1 #tag2 @review');
      expect(symbolOnlyRes.priority).toBe('urgent');
      expect(symbolOnlyRes.category).toBe('review');
      expect(symbolOnlyRes.tags).toEqual(['tag1', 'tag2']);
    });
  });

  /* =========================================================================
     2. Recurrence Calculation & Spawning Engine (recurrenceEngine)
     ========================================================================= */
  describe('Recurrence Calculation & Lifecycle Engine (recurrenceEngine)', () => {
    it('calculates daily recurrence by adding exactly 1 day', () => {
      const nextDate = calculateNextDueDate('2026-10-15', { frequency: 'daily' });
      expect(nextDate).toBe('2026-10-16');
    });

    it('skips weekends for weekday recurrences (Friday rolls to Monday)', () => {
      // 2026-10-16 is a Friday
      const friday = '2026-10-16';
      const nextDate = calculateNextDueDate(friday, { frequency: 'weekdays' });
      // Should roll to Monday 2026-10-19
      expect(nextDate).toBe('2026-10-19');

      // Monday rolls to Tuesday
      const monday = '2026-10-19';
      expect(calculateNextDueDate(monday, { frequency: 'weekdays' })).toBe('2026-10-20');
    });

    it('calculates weekly recurrence by adding 7 days', () => {
      const nextDate = calculateNextDueDate('2026-10-15', { frequency: 'weekly' });
      expect(nextDate).toBe('2026-10-22');
    });

    it('calculates custom interval recurrences', () => {
      const nextDate = calculateNextDueDate('2026-10-15', { frequency: 'custom', interval: 3 });
      expect(nextDate).toBe('2026-10-18');
    });

    it('evaluates series completion limits', () => {
      expect(
        shouldSpawnNextOccurrence({
          frequency: 'daily',
          occurrenceCount: 5,
          maxOccurrences: 5
        })
      ).toBe(false);

      expect(
        shouldSpawnNextOccurrence({
          frequency: 'daily',
          occurrenceCount: 2,
          maxOccurrences: 5
        })
      ).toBe(true);
    });

    it('spawns a new occurrence with parent linkage and reset state', () => {
      const parentTask = createMockTask({
        id: 'task-orig-1',
        title: 'Review System Metrics',
        status: 'completed',
        category: 'deep_work',
        priority: 'high',
        dueDate: '2026-10-15',
        dueTime: '11:00',
        estimatedMinutes: 45,
        subTasks: [],
        tags: ['ops'],
        isRecurring: true,
        recurrence: {
          frequency: 'daily',
          occurrenceCount: 1
        }
      });

      const spawned = spawnNextRecurringOccurrence(parentTask);
      expect(spawned).not.toBeNull();
      expect(spawned?.title).toBe('Review System Metrics');
      expect(spawned?.dueDate).toBe('2026-10-16');
      expect(spawned?.dueTime).toBe('11:00');
      expect(spawned?.status).toBe('todo');
      expect(spawned?.recurrence?.occurrenceCount).toBe(2);
      expect(spawned?.recurrence?.parentTaskId).toBe('task-orig-1');
    });
  });

  /* =========================================================================
     3. Workload Realism & Calm Capacity Calculator (workloadCalculator)
     ========================================================================= */
  describe('Workload Realism & Capacity Engine (workloadCalculator)', () => {
    it('aggregates planned task and block minutes cleanly', () => {
      const tasks: Task[] = [
        createMockTask({
          id: 't1',
          title: 'Paper review',
          status: 'todo',
          category: 'study',
          priority: 'high',
          dueDate: '2026-10-15',
          estimatedMinutes: 60
        }),
        createMockTask({
          id: 't2',
          title: 'Code cleanup',
          status: 'todo',
          category: 'project',
          priority: 'medium',
          dueDate: '2026-10-15',
          estimatedMinutes: 90
        })
      ];

      const blocks: TaskTimeBlock[] = [
        createMockBlock({
          id: 'b1',
          date: '2026-10-15',
          startHour: 9,
          startMinute: 0,
          durationMinutes: 60,
          taskTitle: 'Ad-hoc Focus Block',
          status: 'planned',
          progressPercent: 0
        })
      ];

      const summary = calculateWorkload({
        date: '2026-10-15',
        tasks,
        timeBlocks: blocks,
        dailyCapacityMinutes: 360
      });

      expect(summary.plannedTasksMinutes).toBe(150);
      expect(summary.plannedBlocksMinutes).toBe(60);
      expect(summary.totalPlannedMinutes).toBe(210);
      expect(summary.state).toBe('optimal');
      expect(summary.remainingCapacityMinutes).toBe(150);
    });

    it('deduplicates tasks already mapped to a time block', () => {
      const tasks: Task[] = [
        createMockTask({
          id: 't-shared',
          title: 'Core Algorithm Implementation',
          status: 'todo',
          category: 'deep_work',
          priority: 'urgent',
          dueDate: '2026-10-15',
          estimatedMinutes: 120
        })
      ];

      const blocks: TaskTimeBlock[] = [
        createMockBlock({
          id: 'b-shared',
          taskId: 't-shared',
          date: '2026-10-15',
          startHour: 10,
          startMinute: 0,
          durationMinutes: 120,
          taskTitle: 'Core Algorithm Implementation',
          status: 'planned',
          progressPercent: 0
        })
      ];

      const summary = calculateWorkload({
        date: '2026-10-15',
        tasks,
        timeBlocks: blocks,
        dailyCapacityMinutes: 360
      });

      // Task duration must not be double counted
      expect(summary.totalPlannedMinutes).toBe(120);
      expect(summary.plannedBlocksMinutes).toBe(120);
      expect(summary.plannedTasksMinutes).toBe(0);
    });

    it('identifies overcommitment threshold and nominates deferral candidates', () => {
      const tasks: Task[] = [
        createMockTask({
          id: 't-low-1',
          title: 'Low priority backlog',
          status: 'todo',
          category: 'admin',
          priority: 'low',
          dueDate: '2026-10-15',
          estimatedMinutes: 120
        }),
        createMockTask({
          id: 't-med-1',
          title: 'Medium priority backlog',
          status: 'todo',
          category: 'study',
          priority: 'medium',
          dueDate: '2026-10-15',
          estimatedMinutes: 180
        }),
        createMockTask({
          id: 't-urg-1',
          title: 'Critical architecture review',
          status: 'todo',
          category: 'deep_work',
          priority: 'urgent',
          dueDate: '2026-10-15',
          estimatedMinutes: 180
        })
      ];

      const summary = calculateWorkload({
        date: '2026-10-15',
        tasks,
        timeBlocks: [],
        dailyCapacityMinutes: 360 // Total is 480m -> overcommitted by 120m
      });

      expect(summary.state).toBe('overcommitted');
      expect(summary.overcommittedMinutes).toBe(120);
      expect(summary.rescheduleCandidates.length).toBeGreaterThan(0);
      // Low priority tasks are nominated first for deferral
      expect(summary.rescheduleCandidates[0].priority).toBe('low');
    });

    it('formats minutes into calm human-friendly strings', () => {
      expect(formatMinutesFriendly(45)).toBe('45m');
      expect(formatMinutesFriendly(60)).toBe('1h');
      expect(formatMinutesFriendly(135)).toBe('2h 15m');
    });
  });

  /* =========================================================================
     4. 1-Click Replan & Slot Finding Engine (replanEngine)
     ========================================================================= */
  describe('1-Click Auto-Replan Engine (replanEngine)', () => {
    it('finds the next available unallocated hour on the grid', () => {
      const existingBlocks: TaskTimeBlock[] = [
        createMockBlock({
          id: 'b9',
          date: '2026-10-15',
          startHour: 9,
          startMinute: 0,
          durationMinutes: 60,
          taskTitle: 'Block 9am',
          status: 'planned',
          progressPercent: 0
        }),
        createMockBlock({
          id: 'b10',
          date: '2026-10-15',
          startHour: 10,
          startMinute: 0,
          durationMinutes: 60,
          taskTitle: 'Block 10am',
          status: 'planned',
          progressPercent: 0
        })
      ];

      // After 8am: 9 & 10 are occupied, next should be 11
      const slot = findNextAvailableSlot('2026-10-15', existingBlocks, 8);
      expect(slot).toEqual({ hour: 11, minute: 0 });
    });

    it('generates structured 1-click replan options for bumped or missed blocks', () => {
      const todayStr = getISODateString(new Date());
      const block: TaskTimeBlock = createMockBlock({
        id: 'b-missed',
        date: todayStr,
        startHour: 9,
        startMinute: 0,
        durationMinutes: 60,
        taskTitle: 'Missed Focus Hour',
        status: 'partial',
        progressPercent: 20
      });

      const suggestions = getReplanSuggestions(block, [block], 10);
      expect(suggestions.length).toBeGreaterThanOrEqual(2);
      // At least one suggestion for today or tomorrow
      expect(suggestions.some((s) => s.date === todayStr || s.date === getTomorrowDateString(todayStr))).toBe(true);
    });
  });

  /* =========================================================================
     5. End-to-End Recurring Task Lifecycle via Data Service
     ========================================================================= */
  describe('End-to-End Task Recurrence Lifecycle via Data Service', () => {
    beforeEach(() => {
      ServiceContainer.switchToMock();
    });

    afterEach(() => {
      ServiceContainer.switchToSupabase();
    });

    it('automatically spawns the next occurrence when a recurring task is completed', async () => {
      const todayStr = getISODateString(new Date());
      const created = await dataService.tasks.createTask({
        title: 'Daily Architecture Standup',
        category: 'deep_work',
        priority: 'high',
        dueDate: todayStr,
        dueTime: '09:00',
        estimatedMinutes: 30,
        isRecurring: true,
        recurrence: {
          frequency: 'daily',
          occurrenceCount: 1,
          maxOccurrences: 10
        }
      });

      expect(created.isRecurring).toBe(true);
      expect(created.recurrence?.frequency).toBe('daily');

      // Complete the recurring task
      const updated = await dataService.tasks.toggleTaskCompletion(created.id);
      expect(updated.status).toBe('completed');

      // Verify the next occurrence was spawned in the repository
      const allTasks = await dataService.tasks.getTasks();
      const spawned = allTasks.find(
        (t) => t.recurrence?.parentTaskId === created.id && t.status === 'todo'
      );

      expect(spawned).toBeDefined();
      expect(spawned?.title).toBe('Daily Architecture Standup');
      expect(spawned?.dueDate).toBe(calculateNextDueDate(todayStr, { frequency: 'daily' }));
      expect(spawned?.recurrence?.occurrenceCount).toBe(2);
    });
  });
});
