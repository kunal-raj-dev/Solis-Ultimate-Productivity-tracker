import { describe, it, expect } from 'vitest';
import {
  generateIcsCalendar,
  escapeIcsText,
  foldIcsLine,
  formatIcsUtc,
  localDateKeyToDate,
  ICS_PRODID
} from '../icsGenerator';
import { TaskTimeBlock } from '../../../types/task';
import { Goal } from '../../../types/goal';
import { addDays, getISODateString } from '../../date';

/**
 * Phase 8.1 — One-Way Read-Only `.ics` Calendar Feed (plan §8.1)
 *
 * Verification gate: RFC 5545 structure, time-block and exam-horizon event
 * projection, TEXT escaping, 75-octet line folding, and deterministic output.
 * All wall-clock expectations are derived with the same local-timezone
 * constructor the engine uses, so assertions hold in any machine timezone.
 */

const makeBlock = (overrides: Partial<TaskTimeBlock> = {}): TaskTimeBlock => ({
  id: 'block_1',
  taskTitle: 'Deep Work: Graph Algorithms',
  date: '2026-09-28',
  startHour: 14,
  startMinute: 30,
  durationMinutes: 90,
  priority: 'high',
  status: 'planned',
  createdAt: '2026-09-26T08:00:00.000Z',
  updatedAt: '2026-09-26T08:00:00.000Z',
  ...overrides
});

const makeExamGoal = (overrides: Partial<Goal> = {}): Goal => ({
  id: 'goal_exam_1',
  title: 'Distributed Systems Final',
  horizon: 'medium_term',
  status: 'active',
  category: 'academic',
  experienceType: 'exam',
  targetDate: '2026-12-15',
  progressPercentage: 40,
  priority: 'urgent',
  color: 'coral',
  milestones: [],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-26T00:00:00.000Z',
  ...overrides
});

const REFERENCE_NOW = new Date(2026, 8, 26, 9, 0, 0); // local 2026-09-26 09:00

describe('escapeIcsText — RFC 5545 §3.3.11 TEXT escaping', () => {
  it('escapes backslashes, semicolons, commas, and newlines', () => {
    expect(escapeIcsText('Path\\to; success, always\nand more\r\nlines')).toBe(
      'Path\\\\to\\; success\\, always\\nand more\\nlines'
    );
  });

  it('leaves safe text untouched', () => {
    expect(escapeIcsText('Study session: Raft consensus')).toBe('Study session: Raft consensus');
  });
});

describe('foldIcsLine — RFC 5545 §3.1 75-octet folding', () => {
  it('keeps short lines unfolded', () => {
    expect(foldIcsLine('SUMMARY:short')).toBe('SUMMARY:short');
  });

  it('folds long lines with a leading space on continuations', () => {
    const long = 'SUMMARY:' + 'x'.repeat(200);
    const folded = foldIcsLine(long);
    for (const line of folded.split('\r\n')) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
    // Unfolding (drop CRLF + one space) restores the original value.
    expect(folded.replace(/\r\n /g, '')).toBe(long);
  });

  it('measures non-ASCII content in UTF-8 octets, never splitting sequences (review P8F9)', () => {
    const encoder = new TextEncoder();
    // 40 'é' = 40 UTF-16 units but 80 UTF-8 octets: a code-unit check would
    // leave the line unfolded over the 75-octet limit.
    const accents = 'SUMMARY:' + 'é'.repeat(40);
    const foldedAccents = foldIcsLine(accents);
    for (const part of foldedAccents.split('\r\n')) {
      expect(encoder.encode(part).length).toBeLessThanOrEqual(75);
    }
    expect(foldedAccents.replace(/\r\n /g, '')).toBe(accents);
    expect(foldedAccents).not.toContain('\uFFFD'); // no sequence was split
  });

  it('folds on code-point boundaries so surrogate pairs survive intact (review P8F9)', () => {
    const encoder = new TextEncoder();
    // 🎯 is 2 UTF-16 units / 4 octets; the old unit-based slice could cut one
    // in half (odd offset). 40 emoji = 80 units = 168 octets.
    const emojiLine = 'SUMMARY:' + '🎯'.repeat(40);
    const folded = foldIcsLine(emojiLine);
    for (const part of folded.split('\r\n')) {
      expect(encoder.encode(part).length).toBeLessThanOrEqual(75);
    }
    expect(folded.replace(/\r\n /g, '')).toBe(emojiLine);
    expect(folded).not.toContain('\uFFFD');
  });
});

describe('localDateKeyToDate — local-timezone date-key parsing', () => {
  it('parses a YYYY-MM-DD key into local midnight', () => {
    const date = localDateKeyToDate('2026-09-28');
    expect(date).not.toBeNull();
    expect(date!.getFullYear()).toBe(2026);
    expect(date!.getMonth()).toBe(8);
    expect(date!.getDate()).toBe(28);
    expect(date!.getHours()).toBe(0);
  });

  it('rejects malformed keys', () => {
    expect(localDateKeyToDate('not-a-date')).toBeNull();
    expect(localDateKeyToDate(undefined)).toBeNull();
    expect(localDateKeyToDate('2026-13-40')).toBeNull();
  });
});

describe('generateIcsCalendar — plan §8.1 verification gate', () => {
  it('emits a valid RFC 5545 VCALENDAR envelope with CRLF endings', () => {
    const ics = generateIcsCalendar({
      timeBlocks: [makeBlock()],
      referenceNow: REFERENCE_NOW
    });

    expect(ics.startsWith('BEGIN:VCALENDAR\r\n')).toBe(true);
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain(`PRODID:${ICS_PRODID}`);
    expect(ics).toContain('CALSCALE:GREGORIAN');
    expect(ics).toContain('METHOD:PUBLISH');
    expect(ics).not.toMatch(/[^\r]\n/); // every line ending is CRLF
  });

  it('projects a time block into a timed VEVENT with UTC start/end', () => {
    const ics = generateIcsCalendar({
      timeBlocks: [makeBlock({ startHour: 14, startMinute: 30, durationMinutes: 90 })],
      referenceNow: REFERENCE_NOW
    });

    // Same local-timezone materialization the engine uses for the block start.
    const expectedStart = new Date(2026, 8, 28, 14, 30, 0);
    const expectedEnd = new Date(expectedStart.getTime() + 90 * 60 * 1000);

    expect(ics).toContain('BEGIN:VEVENT');
    expect(ics).toContain('UID:block_1@solis.app');
    expect(ics).toContain(`DTSTAMP:${formatIcsUtc(REFERENCE_NOW)}`);
    expect(ics).toContain(`DTSTART:${formatIcsUtc(expectedStart)}`);
    expect(ics).toContain(`DTEND:${formatIcsUtc(expectedEnd)}`);
    expect(ics).toContain('SUMMARY:Deep Work: Graph Algorithms'); // colons stay literal per RFC 5545
    expect(ics).toContain('STATUS:CONFIRMED');
    expect(ics).toContain('END:VEVENT');
  });

  it('escapes commas, semicolons, and newlines in summaries and descriptions', () => {
    const ics = generateIcsCalendar({
      timeBlocks: [makeBlock({ taskTitle: 'Review; Chapters 4, 5', description: 'Part A\nPart B' })],
      referenceNow: REFERENCE_NOW
    });

    expect(ics).toContain('SUMMARY:Review\\; Chapters 4\\, 5');
    expect(ics).toContain('DESCRIPTION:Part A\\nPart B');
  });

  it('projects active exam-horizon goals as all-day events', () => {
    const ics = generateIcsCalendar({
      timeBlocks: [],
      examGoals: [makeExamGoal({ targetDate: '2026-12-15' })],
      referenceNow: REFERENCE_NOW
    });

    expect(ics).toContain('UID:goal_exam_1@solis.app');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261215');
    expect(ics).toContain('DTEND;VALUE=DATE:20261216'); // exclusive end per RFC 5545
    expect(ics).toContain('SUMMARY:Exam: Distributed Systems Final');
    expect(ics).toContain('TRANSP:TRANSPARENT');
  });

  it('skips non-active goals and blocks with invalid dates', () => {
    const ics = generateIcsCalendar({
      timeBlocks: [makeBlock({ id: 'block_bad', date: 'garbage' })],
      examGoals: [
        makeExamGoal({ id: 'goal_done', status: 'completed' }),
        makeExamGoal({ id: 'goal_paused', status: 'paused' })
      ],
      referenceNow: REFERENCE_NOW
    });

    expect(ics).not.toContain('block_bad');
    expect(ics).not.toContain('goal_done');
    expect(ics).not.toContain('goal_paused');
    expect(ics).not.toContain('BEGIN:VEVENT');
  });

  it('emits only ExamHorizon targets — other goals are not labeled as exams (review P8F5)', () => {
    const ics = generateIcsCalendar({
      timeBlocks: [],
      examGoals: [
        // Not exam-horizon: standard experience, non-academic category.
        makeExamGoal({ id: 'goal_standard', experienceType: 'standard', category: 'personal' }),
        makeExamGoal({ id: 'goal_project', experienceType: 'project', category: 'personal' }),
        // Academic-category goals are exam-horizon targets (the app's own
        // predicate in ExamHorizonBar / the D-Day pill) even when the
        // experience type is 'standard'.
        makeExamGoal({ id: 'goal_academic_std', experienceType: 'standard', category: 'academic' })
      ],
      referenceNow: REFERENCE_NOW
    });

    expect(ics).not.toContain('goal_standard');
    expect(ics).not.toContain('goal_project');
    expect(ics).toContain('goal_academic_std@solis.app');
  });

  it('orders events chronologically for deterministic output', () => {
    const laterBlock = makeBlock({ id: 'block_later', date: '2026-09-29', startHour: 9 });
    const earlierBlock = makeBlock({ id: 'block_earlier', date: '2026-09-28', startHour: 8 });

    const ics = generateIcsCalendar({
      timeBlocks: [laterBlock, earlierBlock],
      referenceNow: REFERENCE_NOW
    });

    expect(ics.indexOf('UID:block_earlier@solis.app')).toBeLessThan(
      ics.indexOf('UID:block_later@solis.app')
    );
  });

  it('is byte-identical for identical inputs (deterministic engine)', () => {
    const input = {
      timeBlocks: [makeBlock(), makeBlock({ id: 'block_2', startHour: 9 })],
      examGoals: [makeExamGoal()],
      referenceNow: REFERENCE_NOW
    };
    expect(generateIcsCalendar(input)).toBe(generateIcsCalendar(input));
  });

  it('rolls forward across midnight without overflowing the end hour', () => {
    const ics = generateIcsCalendar({
      timeBlocks: [makeBlock({ date: '2026-09-28', startHour: 23, startMinute: 30, durationMinutes: 60 })],
      referenceNow: REFERENCE_NOW
    });
    const expectedStart = new Date(2026, 8, 28, 23, 30, 0);
    const expectedEnd = new Date(expectedStart.getTime() + 60 * 60 * 1000); // next day 00:30
    expect(ics).toContain(`DTEND:${formatIcsUtc(expectedEnd)}`);
  });

  it('exports the full workspace date range: blocks + exams coexist in one feed', () => {
    const ics = generateIcsCalendar({
      timeBlocks: [makeBlock()],
      examGoals: [makeExamGoal()],
      referenceNow: REFERENCE_NOW
    });
    expect(ics).toContain('UID:block_1@solis.app');
    expect(ics).toContain('UID:goal_exam_1@solis.app');
    // A week-spanning sanity check on the exam key round-trip helper.
    expect(getISODateString(addDays(localDateKeyToDate('2026-09-28') as Date, 1))).toBe('2026-09-29');
  });
});
