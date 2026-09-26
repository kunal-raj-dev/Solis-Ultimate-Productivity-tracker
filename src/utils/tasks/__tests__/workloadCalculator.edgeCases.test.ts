import { describe, it, expect } from 'vitest';
import { calculateWorkload, DEFAULT_DAILY_CAPACITY_MINUTES } from '../workloadCalculator';
import { Task, TaskTimeBlock } from '../../../types/task';

/**
 * Phase 0 — Workload Calculator Edge-Case Harness (plan §0.1)
 *
 * Exercises calculateWorkload against missing durations, zero-hour
 * capacities, and date boundaries. The calculator already handles these
 * deterministically, so every test here runs live against current behaviour.
 * Capacity honors the single canonical constant (master.md §4.6:
 * user.dailyGoalMinutes || 360).
 *
 * Week under test: Mon 2026-09-21 .. Sun 2026-09-27.
 */

const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: 'task_1',
  title: 'Read chapter 4',
  status: 'todo',
  priority: 'medium',
  category: 'study',
  dueDate: '2026-09-26',
  subTasks: [],
  tags: [],
  createdAt: '',
  updatedAt: '',
  ...overrides
});

const makeBlock = (overrides: Partial<TaskTimeBlock> = {}): TaskTimeBlock => ({
  id: 'block_1',
  taskId: 'task_1',
  taskTitle: 'Read chapter 4',
  date: '2026-09-26',
  startHour: 10,
  durationMinutes: 60,
  priority: 'medium',
  status: 'planned',
  createdAt: '',
  updatedAt: '',
  ...overrides
});

describe('calculateWorkload — missing durations', () => {
  it('defaults a task without estimatedMinutes to 30 minutes', () => {
    const summary = calculateWorkload({
      date: '2026-09-26',
      tasks: [makeTask({ estimatedMinutes: undefined })],
      timeBlocks: [],
      dailyCapacityMinutes: 360
    });

    expect(summary.plannedTasksMinutes).toBe(30);
    expect(summary.plannedBlocksMinutes).toBe(0);
    expect(summary.totalPlannedMinutes).toBe(30);
  });

  it('defaults a time block with durationMinutes 0 to 60 minutes', () => {
    const summary = calculateWorkload({
      date: '2026-09-26',
      tasks: [],
      timeBlocks: [makeBlock({ durationMinutes: 0 })],
      dailyCapacityMinutes: 360
    });

    expect(summary.plannedBlocksMinutes).toBe(60);
    expect(summary.totalPlannedMinutes).toBe(60);
  });

  it('falls back to the canonical 360-minute capacity when dailyCapacityMinutes is omitted', () => {
    const summary = calculateWorkload({
      date: '2026-09-26',
      tasks: [],
      timeBlocks: []
    });

    expect(summary.dailyCapacityMinutes).toBe(DEFAULT_DAILY_CAPACITY_MINUTES);
    expect(summary.dailyCapacityMinutes).toBe(360);
    expect(summary.remainingCapacityMinutes).toBe(360);
  });
});

describe('calculateWorkload — zero-hour capacities', () => {
  it('flags any planned work as overcommitted when capacity is zero', () => {
    const summary = calculateWorkload({
      date: '2026-09-26',
      tasks: [makeTask({ estimatedMinutes: 60 })],
      timeBlocks: [],
      dailyCapacityMinutes: 0
    });

    expect(summary.totalPlannedMinutes).toBe(60);
    expect(summary.remainingCapacityMinutes).toBe(0);
    expect(summary.overcommittedMinutes).toBe(60);
    expect(summary.state).toBe('overcommitted');
  });

  it('stays calm on an empty day even with zero capacity', () => {
    const summary = calculateWorkload({
      date: '2026-09-26',
      tasks: [],
      timeBlocks: [],
      dailyCapacityMinutes: 0
    });

    expect(summary.totalPlannedMinutes).toBe(0);
    expect(summary.remainingCapacityMinutes).toBe(0);
    expect(summary.overcommittedMinutes).toBe(0);
    expect(summary.state).toBe('light');
  });
});

describe('calculateWorkload — date boundaries', () => {
  it('ignores blocks and tasks that fall outside the requested date', () => {
    const summary = calculateWorkload({
      date: '2026-09-26',
      tasks: [
        makeTask({ id: 'task_yesterday', dueDate: '2026-09-25', estimatedMinutes: 30 }),
        makeTask({ id: 'task_today', dueDate: '2026-09-26', estimatedMinutes: 30 }),
        makeTask({ id: 'task_tomorrow', dueDate: '2026-09-27', estimatedMinutes: 30 })
      ],
      timeBlocks: [
        makeBlock({ id: 'block_yesterday', date: '2026-09-25', durationMinutes: 60 }),
        makeBlock({ id: 'block_today', date: '2026-09-26', durationMinutes: 60 }),
        makeBlock({ id: 'block_tomorrow', date: '2026-09-27', durationMinutes: 60 })
      ],
      dailyCapacityMinutes: 360
    });

    expect(summary.plannedBlocksMinutes).toBe(60);
    expect(summary.plannedTasksMinutes).toBe(30);
    expect(summary.totalPlannedMinutes).toBe(90);
  });

  it('excludes completed tasks and completed blocks from the day total', () => {
    const summary = calculateWorkload({
      date: '2026-09-26',
      tasks: [
        makeTask({ id: 'task_done', status: 'completed', estimatedMinutes: 45 }),
        makeTask({ id: 'task_open', estimatedMinutes: 30 })
      ],
      timeBlocks: [makeBlock({ id: 'block_done', status: 'completed', durationMinutes: 60 })],
      dailyCapacityMinutes: 360
    });

    expect(summary.plannedBlocksMinutes).toBe(0);
    expect(summary.plannedTasksMinutes).toBe(30);
    expect(summary.totalPlannedMinutes).toBe(30);
  });

  it('does not double-count a task that is already scheduled in a time block', () => {
    const summary = calculateWorkload({
      date: '2026-09-26',
      tasks: [makeTask({ id: 'task_1', estimatedMinutes: 90 })],
      timeBlocks: [makeBlock({ id: 'block_1', taskId: 'task_1', durationMinutes: 60 })],
      dailyCapacityMinutes: 360
    });

    expect(summary.plannedBlocksMinutes).toBe(60);
    expect(summary.plannedTasksMinutes).toBe(0);
    expect(summary.totalPlannedMinutes).toBe(60);
    expect(summary.rescheduleCandidates).toHaveLength(0);
  });
});

describe('calculateWorkload — calm state thresholds', () => {
  const workloadOf = (minutes: number) =>
    calculateWorkload({
      date: '2026-09-26',
      tasks: [makeTask({ estimatedMinutes: minutes })],
      timeBlocks: [],
      dailyCapacityMinutes: 360
    }).state;

  it('reads light at or under half capacity and optimal up to the full ceiling', () => {
    expect(workloadOf(180)).toBe('light'); // boundary: 50% of 360
    expect(workloadOf(360)).toBe('optimal'); // boundary: exactly at capacity
  });

  it('reads heavy within the 15% buffer and overcommitted beyond it', () => {
    expect(workloadOf(413)).toBe('heavy'); // inside the 15% buffer
    expect(workloadOf(415)).toBe('overcommitted');
  });

  it('reads the exact 115% buffer boundary (414m of 360m) as heavy, not overcommitted', () => {
    // Regression: 360 * 1.15 === 413.99999999999994 in binary floating point,
    // so the heavy boundary must be compared without that rounding error.
    expect(workloadOf(414)).toBe('heavy');
  });
});

describe('calculateWorkload — reschedule candidates', () => {
  it('offers unblocked tasks lowest priority first and hides already-blocked tasks', () => {
    const summary = calculateWorkload({
      date: '2026-09-26',
      tasks: [
        makeTask({ id: 'task_urgent', priority: 'urgent', estimatedMinutes: 30 }),
        makeTask({ id: 'task_low', priority: 'low', estimatedMinutes: 30 }),
        makeTask({ id: 'task_blocked', priority: 'low', estimatedMinutes: 30 })
      ],
      timeBlocks: [makeBlock({ id: 'block_1', taskId: 'task_blocked', durationMinutes: 30 })],
      dailyCapacityMinutes: 360
    });

    expect(summary.rescheduleCandidates.map((t) => t.id)).toEqual(['task_low', 'task_urgent']);
  });
});
