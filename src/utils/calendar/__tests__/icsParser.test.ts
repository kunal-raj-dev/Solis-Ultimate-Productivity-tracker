import { describe, it, expect } from 'vitest';
import {
  parseIcsCalendar,
  unfoldIcsLines,
  unescapeIcsText,
  parseIcsDateTime,
  parseIcsDurationMinutes
} from '../icsParser';

describe('RFC 5545 iCalendar Parser (icsParser)', () => {
  describe('Helper Functions', () => {
    it('unfolds long lines starting with space or tab', () => {
      const raw = 'SUMMARY:This is a very long\r\n  title folded across\r\n\t multiple lines';
      const lines = unfoldIcsLines(raw);
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe('SUMMARY:This is a very long title folded across multiple lines');
    });

    it('unescapes commas, semicolons, backslashes, and newlines', () => {
      const escaped = 'Note with\\, commas\\; semicolons\\\\ and\\nnew lines';
      expect(unescapeIcsText(escaped)).toBe('Note with, commas; semicolons\\ and\nnew lines');
    });

    it('parses UTC dates accurately', () => {
      const res = parseIcsDateTime('20260923T143000Z');
      expect(res).not.toBeNull();
      expect(res!.allDay).toBe(false);
      expect(res!.date.getUTCFullYear()).toBe(2026);
      expect(res!.date.getUTCMonth()).toBe(8); // September
      expect(res!.date.getUTCDate()).toBe(23);
      expect(res!.date.getUTCHours()).toBe(14);
      expect(res!.date.getUTCMinutes()).toBe(30);
    });

    it('parses VALUE=DATE all-day dates', () => {
      const res = parseIcsDateTime('20260923', { VALUE: 'DATE' });
      expect(res).not.toBeNull();
      expect(res!.allDay).toBe(true);
      expect(res!.date.getFullYear()).toBe(2026);
      expect(res!.date.getMonth()).toBe(8);
      expect(res!.date.getDate()).toBe(23);
    });

    it('parses durations (PT1H30M, PT45M)', () => {
      expect(parseIcsDurationMinutes('PT1H30M')).toBe(90);
      expect(parseIcsDurationMinutes('PT45M')).toBe(45);
      expect(parseIcsDurationMinutes('P1D')).toBe(1440);
    });
  });

  describe('Full VCALENDAR Parsing', () => {
    const sampleIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Google Inc//Google Calendar 70.9054//EN
CALSCALE:GREGORIAN
X-WR-CALNAME:University Classes
BEGIN:VEVENT
UID:class-101@canvas.edu
DTSTART:20260923T090000Z
DTEND:20260923T103000Z
SUMMARY:CS 301 Algorithms Lecture
DESCRIPTION:Lecture 4 on Dynamic Programming\\nBring notebook
LOCATION:Hall B, Room 204
TRANSP:OPAQUE
END:VEVENT
BEGIN:VEVENT
UID:office-hours@canvas.edu
DTSTART:20260923T140000Z
DURATION:PT1H
SUMMARY:TA Office Hours (Free/Transparent)
TRANSP:TRANSPARENT
END:VEVENT
BEGIN:VEVENT
UID:campus-holiday@canvas.edu
DTSTART;VALUE=DATE:20260925
DTEND;VALUE=DATE:20260926
SUMMARY:Campus Autumn Break
END:VEVENT
END:VCALENDAR`;

    it('extracts events with proper attributes and busy status', () => {
      const ref = new Date('2026-09-23T00:00:00Z');
      const events = parseIcsCalendar(sampleIcs, {
        referenceNow: ref,
        horizonStart: new Date('2026-09-20T00:00:00Z'),
        horizonEnd: new Date('2026-09-30T00:00:00Z')
      });

      expect(events.length).toBe(3);

      // CS 301 Lecture
      const lecture = events.find((e) => e.title.includes('CS 301'));
      expect(lecture).toBeDefined();
      expect(lecture!.calendarName).toBe('University Classes');
      expect(lecture!.isBusy).toBe(true);
      expect(lecture!.allDay).toBe(false);
      expect(lecture!.location).toBe('Hall B, Room 204');
      expect(lecture!.description).toContain('Lecture 4 on Dynamic Programming\nBring notebook');

      // Office Hours (transparent -> isBusy = false)
      const officeHours = events.find((e) => e.title.includes('Office Hours'));
      expect(officeHours).toBeDefined();
      expect(officeHours!.isBusy).toBe(false);

      // All day holiday
      const holiday = events.find((e) => e.title.includes('Campus Autumn Break'));
      expect(holiday).toBeDefined();
      expect(holiday!.allDay).toBe(true);
    });

    it('expands recurring events across specified days within horizon', () => {
      const recurringIcs = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//EN
BEGIN:VEVENT
UID:rec-rec-1@canvas.edu
DTSTART:20260921T100000Z
DTEND:20260921T110000Z
RRULE:FREQ=WEEKLY;BYDAY=MO,WE,FR;UNTIL=20261015T235959Z
SUMMARY:Physics Lab
TRANSP:OPAQUE
END:VEVENT
END:VCALENDAR`;

      const events = parseIcsCalendar(recurringIcs, {
        referenceNow: new Date('2026-09-21T00:00:00Z'),
        horizonStart: new Date('2026-09-21T00:00:00Z'),
        horizonEnd: new Date('2026-09-28T00:00:00Z') // 1 week horizon
      });

      // 2026-09-21 is Monday, 23 is Wednesday, 25 is Friday
      expect(events.length).toBe(3);
      expect(events.every((e) => e.title === 'Physics Lab')).toBe(true);
      expect(events.every((e) => e.isBusy)).toBe(true);
    });

    it('handles empty or malformed strings gracefully without crashing', () => {
      expect(parseIcsCalendar('')).toEqual([]);
      expect(parseIcsCalendar('NOT AN ICS CONTENT')).toEqual([]);
    });
  });
});
