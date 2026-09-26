import { describe, it, expect } from 'vitest';
import {
  identifyRolloverTasks,
  calculateWorkloadCeiling,
  findAvailableFocusSlots
} from '../morningRitual';
import { Task, TaskTimeBlock } from '../../../types/task';
import { ExternalCalendarEvent } from '../../../types/calendar';

const makeTask = (id: string, title: string, dueDate?: string, completed = false): Task => ({
  id,
  title,
  status: completed ? 'completed' : 'todo',
  priority: 'medium',
  category: 'deep_work',
  estimatedMinutes: 60,
  dueDate,
  subTasks: [],
  tags: [],
  createdAt: '2026-09-20T00:00:00Z',
  updatedAt: '2026-09-20T00:00:00Z'
});

describe('Morning Planning Ritual Engine (F-201)', () => {
  describe('identifyRolloverTasks', () => {
    it('identifies uncompleted tasks with past due dates as rollovers', () => {
      const tasks = [
        makeTask('t1', 'Yesterday Task', '2026-09-22', false),
        makeTask('t2', 'Old Completed', '2026-09-21', true),
        makeTask('t3', 'Today Task', '2026-09-23', false),
        makeTask('t4', 'Future Task', '2026-09-24', false)
      ];

      const rollovers = identifyRolloverTasks(tasks, '2026-09-23');
      expect(rollovers.length).toBe(1);
      expect(rollovers[0].id).toBe('t1');
    });
  });

  describe('calculateWorkloadCeiling', () => {
    it('rates workload as optimal when under 80% capacity', () => {
      const assessment = calculateWorkloadCeiling(180, 360); // 3h on 6h capacity
      expect(assessment.status).toBe('optimal');
      expect(assessment.isOvercommitted).toBe(false);
      expect(assessment.utilizationPercentage).toBe(50);
      expect(assessment.warningMessage).toBeUndefined();
    });

    it('warns when planned work exceeds 6 hours cognitive ceiling', () => {
      const assessment = calculateWorkloadCeiling(420, 480); // 7h planned on 8h capacity
      expect(assessment.status).toBe('overcommitted');
      expect(assessment.isOvercommitted).toBe(true);
      expect(assessment.warningMessage).toContain('6h');
    });

    it('warns when planned work exceeds student personal capacity', () => {
      const assessment = calculateWorkloadCeiling(240, 180); // 4h planned on 3h capacity
      expect(assessment.status).toBe('overcommitted');
      expect(assessment.isOvercommitted).toBe(true);
      expect(assessment.warningMessage).toContain('daily capacity');
    });
  });

  describe('findAvailableFocusSlots', () => {
    it('avoids external busy events and existing study blocks', () => {
      const externalEvents: ExternalCalendarEvent[] = [
        {
          id: 'ext_lecture',
          provider: 'google',
          externalId: 'ext_1',
          calendarName: 'Uni',
          title: 'Algorithms Lecture',
          startTime: '2026-09-23T09:00:00Z',
          endTime: '2026-09-23T11:00:00Z',
          allDay: false,
          isBusy: true
        }
      ];

      const existingBlocks: TaskTimeBlock[] = [
        {
          id: 'block_1',
          date: '2026-09-23',
          taskTitle: 'Discrete Math Study',
          startHour: 14,
          durationMinutes: 120, // 14 to 16
          priority: 'medium',
          status: 'planned',
          createdAt: '2026-09-23T00:00:00Z',
          updatedAt: '2026-09-23T00:00:00Z'
        }
      ];

      // Request 2 slots for Big 3
      const slots = findAvailableFocusSlots({
        externalEvents,
        existingBlocks,
        dayStartHour: 8,
        dayEndHour: 18,
        neededSlotsCount: 2
      });

      expect(slots.length).toBe(2);
      // Slots must not be 9, 10 (external lecture) or 14, 15 (discrete math)
      expect(slots.includes(9)).toBe(false);
      expect(slots.includes(10)).toBe(false);
      expect(slots.includes(14)).toBe(false);
      expect(slots.includes(15)).toBe(false);
    });
  });
});
