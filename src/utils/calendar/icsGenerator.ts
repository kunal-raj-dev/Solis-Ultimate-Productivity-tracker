/**
 * Solis — Plan §8.1: One-Way Read-Only `.ics` Calendar Feed
 *
 * Generates RFC 5545 standard `.ics` data from TaskTimeBlocks and ExamHorizon
 * targets (active exam goals). Students import or subscribe to the result with
 * Google Calendar / Apple Calendar — zero brittle 2-way OAuth.
 *
 * Pure, deterministic engine (master.md §18): no React state, no DOM or
 * network side effects. Local wall-clock times (block date + start hour) are
 * materialized through the local timezone and emitted as RFC 5545 UTC values,
 * matching how the rest of the app treats `block.date` as a local date key.
 */

import { TaskTimeBlock } from '../../types/task';
import { Goal } from '../../types/goal';

export const ICS_PRODID = '-//Solis//Study Schedule 1.0//EN';
export const ICS_UID_SUFFIX = '@solis.app';

/** RFC 5545 §3.1 — content lines MUST NOT be longer than 75 octets. */
const MAX_LINE_OCTETS = 75;
const CRLF = '\r\n';

/** Shared UTF-8 encoder for octet-accurate line folding (review P8F9). */
const utf8Encoder = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null;

export interface IcsCalendarEventInput {
  uid: string;
  summary: string;
  description?: string;
  start: Date;
  end: Date;
  allDay?: boolean;
}

export interface IcsFeedInput {
  timeBlocks: TaskTimeBlock[];
  /** ExamHorizon targets: active exam goals projected as all-day events. */
  examGoals?: Goal[];
  calendarName?: string;
  /** Injectable clock for deterministic output (defaults to `new Date()`). */
  referenceNow?: Date;
}

/** RFC 5545 §3.3.11 TEXT escaping: backslash, semicolon, comma, newlines. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

/**
 * Folds a content line at 75 octets (continuation lines begin with a space).
 *
 * Review P8F9: octet-accurate — measures and cuts on UTF-8 octet counts, not
 * UTF-16 code units, and iterates code points so multi-byte sequences and
 * surrogate pairs are never split.
 */
export function foldIcsLine(line: string): string {
  const totalOctets = utf8Encoder ? utf8Encoder.encode(line).length : line.length;
  if (totalOctets <= MAX_LINE_OCTETS) return line;

  const parts: string[] = [];
  let current = '';
  let currentOctets = 0;
  let isFirstPart = true;

  for (const char of line) {
    // `for…of` yields whole code points (no surrogate-pair splits).
    const charOctets = utf8Encoder ? utf8Encoder.encode(char).length : char.length;
    const cap = isFirstPart ? MAX_LINE_OCTETS : MAX_LINE_OCTETS - 1;
    if (currentOctets + charOctets > cap) {
      parts.push(isFirstPart ? current : ` ${current}`);
      isFirstPart = false;
      current = '';
      currentOctets = 0;
    }
    current += char;
    currentOctets += charOctets;
  }
  if (current.length > 0) {
    parts.push(isFirstPart ? current : ` ${current}`);
  }
  return parts.join(CRLF);
}

/** `YYYYMMDDTHHMMSSZ` (UTC) rendering of a Date — RFC 5545 §3.3.5 form #1. */
export function formatIcsUtc(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return (
    `${date.getUTCFullYear()}${pad(date.getUTCMonth() + 1)}${pad(date.getUTCDate())}` +
    `T${pad(date.getUTCHours())}${pad(date.getUTCMinutes())}${pad(date.getUTCSeconds())}Z`
  );
}

/** `YYYYMMDD` rendering for all-day (VALUE=DATE) values. */
export function formatIcsDate(date: Date): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}`;
}

/**
 * Parses a local `YYYY-MM-DD` date key into a local-midnight Date.
 * Never uses UTC `toISOString().split('T')[0]` (master.md §16.2); returns
 * null for missing or malformed keys.
 */
export function localDateKeyToDate(dateKey?: string): Date | null {
  if (!dateKey) return null;
  const match = dateKey.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  if (month < 1 || month > 12 || day < 1 || day > 31) return null;
  const date = new Date(year, month - 1, day);
  return isNaN(date.getTime()) ? null : date;
}

/** Materializes a time block's local wall-clock start into a Date. */
function timeBlockStartDate(block: TaskTimeBlock): Date | null {
  const base = localDateKeyToDate(block.date);
  if (!base) return null;
  const hour = Math.min(23, Math.max(0, Math.round(block.startHour ?? 0)));
  const minute = Math.min(59, Math.max(0, Math.round(block.startMinute ?? 0)));
  base.setHours(hour, minute, 0, 0);
  return base;
}

function timeBlockDescription(block: TaskTimeBlock): string {
  const parts: string[] = [];
  if (block.description) parts.push(block.description);
  parts.push(`Status: ${block.status}`);
  return parts.join('\n');
}

export function buildIcsEvent(event: IcsCalendarEventInput, dtstamp: Date): string[] {
  const lines: string[] = ['BEGIN:VEVENT'];
  lines.push(`UID:${escapeIcsText(event.uid)}`);
  lines.push(`DTSTAMP:${formatIcsUtc(dtstamp)}`);
  if (event.allDay) {
    const nextDay = new Date(event.end.getTime());
    lines.push(`DTSTART;VALUE=DATE:${formatIcsDate(event.start)}`);
    lines.push(`DTEND;VALUE=DATE:${formatIcsDate(nextDay)}`);
    lines.push('TRANSP:TRANSPARENT');
  } else {
    lines.push(`DTSTART:${formatIcsUtc(event.start)}`);
    lines.push(`DTEND:${formatIcsUtc(event.end)}`);
    lines.push('TRANSP:OPAQUE');
  }
  lines.push(`SUMMARY:${escapeIcsText(event.summary)}`);
  if (event.description && event.description.trim().length > 0) {
    lines.push(`DESCRIPTION:${escapeIcsText(event.description)}`);
  }
  lines.push('STATUS:CONFIRMED');
  lines.push('CATEGORIES:SOLIS');
  lines.push('END:VEVENT');
  return lines;
}

/**
 * Generates a complete RFC 5545 VCALENDAR document from Solis time blocks and
 * exam-horizon goals. Events are ordered deterministically (by start instant,
 * then UID) so the same input always yields byte-identical output.
 */
export function generateIcsCalendar(input: IcsFeedInput): string {
  const dtstamp = input.referenceNow ? new Date(input.referenceNow.getTime()) : new Date();
  const events: IcsCalendarEventInput[] = [];

  for (const block of input.timeBlocks || []) {
    const start = timeBlockStartDate(block);
    if (!start) continue;
    const durationMinutes = Math.max(1, Math.round(block.durationMinutes || 60));
    const end = new Date(start.getTime() + durationMinutes * 60 * 1000);
    events.push({
      uid: `${block.id || 'block'}${ICS_UID_SUFFIX}`,
      summary: block.taskTitle || 'Study block',
      description: timeBlockDescription(block),
      start,
      end
    });
  }

  for (const goal of input.examGoals || []) {
    if (goal.status && goal.status !== 'active') continue;
    // Review P8F5: only ExamHorizon targets feed the calendar — the same
    // active-exam predicate the app uses (ExamHorizonBar / D-Day pill).
    // Standard, project, and personal goals must not be mislabeled as exams.
    const isExamHorizonTarget = goal.experienceType === 'exam' || goal.category === 'academic';
    if (!isExamHorizonTarget) continue;
    const start = localDateKeyToDate(goal.targetDate);
    if (!start) continue;
    const end = new Date(start.getTime());
    end.setDate(end.getDate() + 1);
    events.push({
      uid: `${goal.id || 'goal'}${ICS_UID_SUFFIX}`,
      summary: `Exam: ${goal.title || 'Exam'}`,
      description: goal.subjectName ? `Subject: ${goal.subjectName}` : undefined,
      start,
      end,
      allDay: true
    });
  }

  // Deterministic ordering: chronological, ties broken by UID.
  events.sort((a, b) => {
    const byStart = a.start.getTime() - b.start.getTime();
    if (byStart !== 0) return byStart;
    return a.uid.localeCompare(b.uid);
  });

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    `PRODID:${ICS_PRODID}`,
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeIcsText(input.calendarName || 'Solis Study Schedule')}`
  ];

  for (const event of events) {
    lines.push(...buildIcsEvent(event, dtstamp));
  }

  lines.push('END:VCALENDAR');
  return lines.map(foldIcsLine).join(CRLF) + CRLF;
}
