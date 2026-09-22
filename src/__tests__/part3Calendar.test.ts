import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  calculateAvailableTime,
  timeStringToMinutes,
  minutesToTimeString
} from '../utils/calendar/availableTime';
import { calendarService } from '../services/calendar/calendar.service';
import { ExternalCalendarEvent } from '../types/calendar';
import { TimeBlock } from '../types/planning';

const mockLocalStorage = {
  store: {} as Record<string, string>,
  getItem: (key: string) => mockLocalStorage.store[key] || null,
  setItem: (key: string, value: string) => { mockLocalStorage.store[key] = String(value); },
  removeItem: (key: string) => { delete mockLocalStorage.store[key]; },
  clear: () => { mockLocalStorage.store = {}; }
};
vi.stubGlobal('localStorage', mockLocalStorage);

describe('SOLIS PART 3 — Pillar 1: External Calendar & Available-Time Engine', () => {
  beforeEach(() => {
    mockLocalStorage.clear();
  });

  describe('Time Conversion Helpers', () => {
    it('converts HH:MM string to absolute minutes from midnight', () => {
      expect(timeStringToMinutes('00:00')).toBe(0);
      expect(timeStringToMinutes('08:30')).toBe(510);
      expect(timeStringToMinutes('14:45')).toBe(885);
      expect(timeStringToMinutes('23:59')).toBe(1439);
    });

    it('converts minutes to HH:MM formatted strings', () => {
      expect(minutesToTimeString(0)).toBe('00:00');
      expect(minutesToTimeString(510)).toBe('08:30');
      expect(minutesToTimeString(885)).toBe('14:45');
    });
  });

  describe('Available-Time Calculation (calculateAvailableTime)', () => {
    it('calculates total day minutes when there are zero events or plans', () => {
      const report = calculateAvailableTime({
        date: '2026-09-23',
        dayStartHour: 8,
        dayEndHour: 22,
        externalEvents: [],
        solisBlocks: []
      });

      // 8:00 to 22:00 = 14 hours = 840 minutes
      expect(report.totalAvailableMinutes).toBe(840);
      expect(report.externalCommitmentsMinutes).toBe(0);
      expect(report.plannedSolisMinutes).toBe(0);
      expect(report.unallocatedFreeMinutes).toBe(840);
      expect(report.availableSlots.length).toBe(1);
      expect(report.availableSlots[0].durationMinutes).toBe(840);
      expect(report.availableSlots[0].isOptimalForFocus).toBe(true);
    });

    it('subtracts external busy events and planned Solis blocks accurately', () => {
      const externalEvents: ExternalCalendarEvent[] = [
        {
          id: 'ext-1',
          provider: 'google',
          externalId: 'g-101',
          calendarName: 'Primary Academic',
          title: 'Team Architecture Standup',
          startTime: '2026-09-23T09:00:00',
          endTime: '2026-09-23T10:00:00',
          allDay: false,
          isBusy: true
        },
        {
          id: 'ext-2',
          provider: 'google',
          externalId: 'g-102',
          calendarName: 'Primary Academic',
          title: 'Doctor Appointment',
          startTime: '2026-09-23T14:00:00',
          endTime: '2026-09-23T15:30:00', // 90 mins
          allDay: false,
          isBusy: true
        }
      ];

      const solisBlocks: TimeBlock[] = [
        {
          id: 'plan-1',
          entityId: 'ent-1',
          date: '2026-09-23',
          type: 'study_plan',
          title: 'Distributed Systems Deep Focus',
          startTime: '10:30',
          endTime: '12:00', // 90 mins
          completed: false,
          durationMinutes: 90
        }
      ];

      const report = calculateAvailableTime({
        date: '2026-09-23',
        dayStartHour: 8,
        dayEndHour: 20, // 12 hours = 720 mins
        externalEvents,
        solisBlocks
      });

      expect(report.totalAvailableMinutes).toBe(720);
      expect(report.externalCommitmentsMinutes).toBe(150); // 60 + 90
      expect(report.plannedSolisMinutes).toBe(90);
      // Free = 720 - 150 - 90 = 480 mins
      expect(report.unallocatedFreeMinutes).toBe(480);
      // Checks continuous focus slots (slots >= 45m)
      expect(report.availableSlots.length).toBeGreaterThanOrEqual(2);
    });

    it('ignores non-busy (free/transparent) external events', () => {
      const externalEvents: ExternalCalendarEvent[] = [
        {
          id: 'ext-free',
          provider: 'google',
          externalId: 'g-200',
          calendarName: 'Primary Academic',
          title: 'Lunch Placeholder (Free)',
          startTime: '2026-09-23T12:00:00',
          endTime: '2026-09-23T13:00:00',
          allDay: false,
          isBusy: false
        }
      ];

      const report = calculateAvailableTime({
        date: '2026-09-23',
        dayStartHour: 8,
        dayEndHour: 20,
        externalEvents,
        solisBlocks: []
      });

      expect(report.externalCommitmentsMinutes).toBe(0);
      expect(report.unallocatedFreeMinutes).toBe(720);
    });
  });

  describe('Conflict Detection & Auto-Replan in calculateAvailableTime', () => {
    it('detects direct overlap between external busy event and planned Solis block', () => {
      const externalEvents: ExternalCalendarEvent[] = [
        {
          id: 'ext-conf',
          provider: 'google',
          externalId: 'g-conflict-1',
          calendarName: 'Primary Academic',
          title: 'Emergency Client Sync',
          startTime: '2026-09-23T11:00:00',
          endTime: '2026-09-23T12:00:00',
          allDay: false,
          isBusy: true
        }
      ];

      const solisBlocks: TimeBlock[] = [
        {
          id: 'plan-clash',
          entityId: 'ent-clash',
          date: '2026-09-23',
          type: 'study_plan',
          title: 'Advanced Operating Systems Study',
          startTime: '11:15',
          endTime: '12:45',
          completed: false,
          durationMinutes: 90
        }
      ];

      const report = calculateAvailableTime({
        date: '2026-09-23',
        dayStartHour: 8,
        dayEndHour: 20,
        externalEvents,
        solisBlocks
      });

      expect(report.conflicts.length).toBe(1);
      const conflict = report.conflicts[0];
      expect(conflict.solisPlanId).toBe('plan-clash');
      expect(conflict.externalEventTitle).toBe('Emergency Client Sync');
      expect(conflict.suggestedAction.proposedStartTime).toBeDefined();
    });

    it('returns empty conflicts when there are no schedule collisions', () => {
      const externalEvents: ExternalCalendarEvent[] = [
        {
          id: 'ext-ok',
          provider: 'google',
          externalId: 'g-ok-1',
          calendarName: 'Primary Academic',
          title: 'Breakfast',
          startTime: '2026-09-23T07:00:00',
          endTime: '2026-09-23T08:00:00',
          allDay: false,
          isBusy: true
        }
      ];

      const solisBlocks: TimeBlock[] = [
        {
          id: 'plan-ok',
          entityId: 'ent-ok',
          date: '2026-09-23',
          type: 'task_deadline',
          title: 'Review PRs',
          startTime: '09:00',
          endTime: '10:00',
          completed: false,
          durationMinutes: 60
        }
      ];

      const report = calculateAvailableTime({
        date: '2026-09-23',
        dayStartHour: 8,
        dayEndHour: 20,
        externalEvents,
        solisBlocks
      });

      expect(report.conflicts.length).toBe(0);
    });
  });

  describe('CalendarService Local Integration & ICS Export', () => {
    it('manages connections and persists provider settings', async () => {
      const initialConfig = calendarService.getConfig();
      expect(initialConfig).toBeDefined();
      expect(initialConfig.provider).toBe('google');

      const connected = await calendarService.connectCalendar('scholar@solis.space', 'google');
      expect(connected.status).toBe('synced');
      expect(connected.accountEmail).toBe('scholar@solis.space');

      const events = calendarService.getEvents();
      expect(Array.isArray(events)).toBe(true);
      expect(events.length).toBeGreaterThan(0);
    });

    it('retrieves available time report via service wrapper', () => {
      const report = calendarService.getAvailableTimeReport('2026-09-23');
      expect(report).toBeDefined();
      expect(report.totalAvailableMinutes).toBeGreaterThan(0);
    });

    it('exports planned Solis blocks to a RFC 5545 valid .ics formatted string', () => {
      const blocks: TimeBlock[] = [
        {
          id: 'block-ics-1',
          entityId: 'ent-ics-1',
          date: '2026-09-23',
          type: 'study_plan',
          title: 'Algorithms Revision',
          startTime: '09:00',
          endTime: '10:30',
          completed: false,
          durationMinutes: 90
        },
        {
          id: 'block-ics-2',
          entityId: 'ent-ics-2',
          date: '2026-09-23',
          type: 'task_deadline',
          title: 'Project Submission',
          startTime: '15:00',
          endTime: '16:00',
          completed: true,
          durationMinutes: 60
        }
      ];

      const ics = calendarService.exportSolisBlocksToICS(blocks, '2026-09-23');

      expect(ics).toContain('BEGIN:VCALENDAR');
      expect(ics).toContain('VERSION:2.0');
      expect(ics).toContain('PRODID:-//Solis OS//Solis Study OS//EN');
      expect(ics).toContain('BEGIN:VEVENT');
      expect(ics).toContain('SUMMARY:Algorithms Revision');
      expect(ics).toContain('SUMMARY:Project Submission');
      expect(ics).toContain('END:VEVENT');
      expect(ics).toContain('END:VCALENDAR');
    });
  });
});
