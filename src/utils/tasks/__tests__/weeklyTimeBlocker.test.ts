import { describe, it, expect } from 'vitest';
import { getWeekDays, formatWeekRange, getISODateString } from '../../date';
import { TaskTimeBlock } from '../../../types/task';

describe('Feature 1.2: 7-Day Multi-Day Calendar Time-Blocker Suite', () => {
  describe('Week Days Computation Engine', () => {
    it('returns exactly 7 consecutive days starting on Monday', () => {
      // 2026-09-23 is Wednesday
      const week = getWeekDays('2026-09-23', true);
      expect(week).toHaveLength(7);
      expect(week[0].dayName).toBe('Mon');
      expect(week[0].date).toBe('2026-09-21');
      expect(week[1].dayName).toBe('Tue');
      expect(week[1].date).toBe('2026-09-22');
      expect(week[2].dayName).toBe('Wed');
      expect(week[2].date).toBe('2026-09-23');
      expect(week[6].dayName).toBe('Sun');
      expect(week[6].date).toBe('2026-09-27');
    });

    it('correctly marks isToday for the current date', () => {
      const todayStr = getISODateString(new Date());
      const week = getWeekDays(todayStr, true);
      const todayEntry = week.find((d) => d.date === todayStr);
      expect(todayEntry).toBeDefined();
      expect(todayEntry?.isToday).toBe(true);

      const otherDays = week.filter((d) => d.date !== todayStr);
      otherDays.forEach((d) => expect(d.isToday).toBe(false));
    });

    it('supports Sunday start configuration', () => {
      const week = getWeekDays('2026-09-23', false);
      expect(week).toHaveLength(7);
      expect(week[0].dayName).toBe('Sun');
      expect(week[0].date).toBe('2026-09-20');
      expect(week[6].dayName).toBe('Sat');
      expect(week[6].date).toBe('2026-09-26');
    });
  });

  describe('formatWeekRange Formatter', () => {
    it('formats a single-month week range clearly', () => {
      const week = getWeekDays('2026-09-23', true);
      const formatted = formatWeekRange(week);
      expect(formatted).toContain('Sep 21');
      expect(formatted).toContain('27');
      expect(formatted).toContain('2026');
    });

    it('formats cross-month boundaries gracefully', () => {
      // 2026-09-30 is Wednesday, week spans Sep 28 – Oct 4
      const week = getWeekDays('2026-09-30', true);
      const formatted = formatWeekRange(week);
      expect(formatted).toContain('Sep 28');
      expect(formatted).toContain('Oct 4');
      expect(formatted).toContain('2026');
    });
  });

  describe('Multi-Day Block Filtering & Slot Distribution', () => {
    const mockBlocks: TaskTimeBlock[] = [
      {
        id: 'b1',
        taskTitle: 'Algorithms Problem Set',
        date: '2026-09-21',
        startHour: 9,
        durationMinutes: 90,
        priority: 'high',
        status: 'completed',
        createdAt: '2026-09-21T09:00:00Z',
        updatedAt: '2026-09-21T10:30:00Z'
      },
      {
        id: 'b2',
        taskTitle: 'Deep Systems Lab',
        date: '2026-09-21',
        startHour: 14,
        durationMinutes: 120,
        priority: 'urgent',
        status: 'planned',
        createdAt: '2026-09-21T14:00:00Z',
        updatedAt: '2026-09-21T14:00:00Z'
      },
      {
        id: 'b3',
        taskTitle: 'Cognitive Science Seminar',
        date: '2026-09-23',
        startHour: 10,
        durationMinutes: 60,
        priority: 'medium',
        status: 'planned',
        createdAt: '2026-09-23T10:00:00Z',
        updatedAt: '2026-09-23T10:00:00Z'
      }
    ];

    it('maps blocks to their respective day columns and hours', () => {
      const weekDays = getWeekDays('2026-09-23', true);
      const blocksByDay: Record<string, TaskTimeBlock[]> = {};
      weekDays.forEach((d) => {
        blocksByDay[d.date] = mockBlocks.filter((b) => b.date === d.date);
      });

      expect(blocksByDay['2026-09-21']).toHaveLength(2);
      expect(blocksByDay['2026-09-22']).toHaveLength(0);
      expect(blocksByDay['2026-09-23']).toHaveLength(1);

      // Verify slot location
      const mon9am = blocksByDay['2026-09-21'].find((b) => b.startHour === 9);
      expect(mon9am?.taskTitle).toBe('Algorithms Problem Set');
    });

    it('aggregates total weekly planned study workload accurately', () => {
      const totalMinutes = mockBlocks.reduce((acc, b) => acc + (b.durationMinutes || 60), 0);
      expect(totalMinutes).toBe(270); // 90 + 120 + 60 = 270 minutes = 4.5 hours
      const totalHours = totalMinutes / 60;
      expect(totalHours).toBe(4.5);
    });
  });
});
