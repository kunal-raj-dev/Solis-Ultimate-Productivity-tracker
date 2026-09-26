/**
 * Solis — RFC 5545 Standard .ics Calendar Feed Parser (F-101)
 *
 * Deterministic parser for external iCalendar (.ics / webcal) feeds from
 * Google Calendar, Canvas LMS, Apple Calendar, Outlook, and university timetables.
 *
 * Capabilities:
 *  - RFC 5545 line unfolding (spaces and tabs continuation)
 *  - Text unescaping (\,, \;, \\, \n, \N)
 *  - VEVENT extraction: UID, SUMMARY, DESCRIPTION, LOCATION, URL, TRANSP
 *  - ISO 8601 normalization for UTC, floating, and all-day (VALUE=DATE) dates
 *  - RRULE recurrence expansion (DAILY, WEEKLY, MONTHLY) within a horizon window
 *    (defaults to past 14 days to future 60 days) to prevent infinite loops.
 */

import { ExternalCalendarEvent, CalendarProvider } from '../../types/calendar';

export interface ParseIcsOptions {
  provider?: CalendarProvider;
  calendarName?: string;
  calendarColor?: string;
  /** Window for expanding recurring events (defaults to -14d to +60d from referenceNow). */
  horizonStart?: Date;
  horizonEnd?: Date;
  referenceNow?: Date;
}

/** RFC 5545 §3.3.11 TEXT unescaping */
export function unescapeIcsText(text: string): string {
  if (!text) return '';
  return text
    .replace(/\\n/gi, '\n')
    .replace(/\\,/g, ',')
    .replace(/\\;/g, ';')
    .replace(/\\\\/g, '\\');
}

/** Unfolds RFC 5545 lines (continuation lines begin with a space or tab). */
export function unfoldIcsLines(raw: string): string[] {
  const normalized = raw.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalized.split('\n');
  const unfolded: string[] = [];

  for (const line of lines) {
    if (line.length === 0) continue;
    if (line.startsWith(' ') || line.startsWith('\t')) {
      if (unfolded.length > 0) {
        unfolded[unfolded.length - 1] += line.slice(1);
      } else {
        unfolded.push(line.slice(1));
      }
    } else {
      unfolded.push(line);
    }
  }

  return unfolded;
}

interface ParsedProperty {
  name: string;
  params: Record<string, string>;
  value: string;
}

export function parseIcsLine(line: string): ParsedProperty | null {
  const colonIdx = line.indexOf(':');
  if (colonIdx === -1) return null;

  const left = line.slice(0, colonIdx);
  const value = line.slice(colonIdx + 1);

  const parts = left.split(';');
  const name = parts[0].toUpperCase().trim();
  const params: Record<string, string> = {};

  for (let i = 1; i < parts.length; i++) {
    const eqIdx = parts[i].indexOf('=');
    if (eqIdx !== -1) {
      const pKey = parts[i].slice(0, eqIdx).toUpperCase().trim();
      const pVal = parts[i].slice(eqIdx + 1).replace(/^"|"$/g, '').trim();
      params[pKey] = pVal;
    }
  }

  return { name, params, value };
}

/**
 * Parses iCalendar date/datetime strings:
 *  - `20260923T143000Z` (UTC)
 *  - `20260923T143000` (Floating/Local)
 *  - `20260923` (Date-only)
 */
export function parseIcsDateTime(raw: string, params: Record<string, string> = {}): { date: Date; allDay: boolean } | null {
  if (!raw) return null;
  const clean = raw.trim();

  // VALUE=DATE or 8-digit date string without time
  if (params['VALUE'] === 'DATE' || /^\d{8}$/.test(clean)) {
    const y = parseInt(clean.slice(0, 4), 10);
    const m = parseInt(clean.slice(4, 6), 10) - 1;
    const d = parseInt(clean.slice(6, 8), 10);
    const date = new Date(y, m, d, 0, 0, 0);
    return isNaN(date.getTime()) ? null : { date, allDay: true };
  }

  // Format: YYYYMMDDTHHMMSS[Z]
  const match = clean.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z)?/);
  if (!match) return null;

  const [, year, month, day, hour, min, sec, isUtc] = match;
  const y = parseInt(year, 10);
  const m = parseInt(month, 10) - 1;
  const d = parseInt(day, 10);
  const h = parseInt(hour, 10);
  const mi = parseInt(min, 10);
  const s = parseInt(sec, 10);

  if (isUtc) {
    const date = new Date(Date.UTC(y, m, d, h, mi, s));
    return isNaN(date.getTime()) ? null : { date, allDay: false };
  }

  // Local / Floating
  const date = new Date(y, m, d, h, mi, s);
  return isNaN(date.getTime()) ? null : { date, allDay: false };
}

/** Parses ISO 8601 duration e.g. PT1H30M, PT45M, P1D */
export function parseIcsDurationMinutes(raw: string): number {
  if (!raw) return 60;
  let total = 0;
  const hours = raw.match(/(\d+)H/);
  const mins = raw.match(/(\d+)M/);
  const days = raw.match(/(\d+)D/);

  if (days) total += parseInt(days[1], 10) * 1440;
  if (hours) total += parseInt(hours[1], 10) * 60;
  if (mins) total += parseInt(mins[1], 10);

  return total > 0 ? total : 60;
}

const DAY_MAP: Record<string, number> = {
  SU: 0,
  MO: 1,
  TU: 2,
  WE: 3,
  TH: 4,
  FR: 5,
  SA: 6
};

interface RRuleConfig {
  freq: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  interval: number;
  until?: Date;
  count?: number;
  byDay?: number[]; // [1, 3, 5] for Mon, Wed, Fri
}

function parseRRule(rruleStr: string): RRuleConfig | null {
  const parts = rruleStr.split(';');
  let freq: 'DAILY' | 'WEEKLY' | 'MONTHLY' | null = null;
  let interval = 1;
  let until: Date | undefined;
  let count: number | undefined;
  let byDay: number[] | undefined;

  for (const part of parts) {
    const [k, v] = part.split('=');
    if (!k || !v) continue;
    const key = k.toUpperCase().trim();
    const val = v.trim();

    if (key === 'FREQ') {
      if (val === 'DAILY' || val === 'WEEKLY' || val === 'MONTHLY') {
        freq = val;
      }
    } else if (key === 'INTERVAL') {
      interval = Math.max(1, parseInt(val, 10) || 1);
    } else if (key === 'COUNT') {
      count = parseInt(val, 10) || undefined;
    } else if (key === 'UNTIL') {
      const parsedUntil = parseIcsDateTime(val);
      if (parsedUntil) until = parsedUntil.date;
    } else if (key === 'BYDAY') {
      const days = val.split(',').map((d) => d.trim().slice(-2).toUpperCase());
      byDay = days.map((d) => DAY_MAP[d]).filter((n) => typeof n === 'number');
    }
  }

  if (!freq) return null;
  return { freq, interval, until, count, byDay };
}

/** Expands a recurring event within [horizonStart, horizonEnd] */
function expandRecurringEvent(
  baseEvent: Omit<ExternalCalendarEvent, 'id' | 'startTime' | 'endTime'>,
  start: Date,
  durationMs: number,
  allDay: boolean,
  rrule: RRuleConfig,
  horizonStart: Date,
  horizonEnd: Date
): ExternalCalendarEvent[] {
  const results: ExternalCalendarEvent[] = [];
  const maxOccurrences = Math.min(rrule.count || 200, 200);

  const cur = new Date(start.getTime());
  let count = 0;

  while (cur.getTime() <= horizonEnd.getTime() && count < maxOccurrences) {
    if (rrule.until && cur.getTime() > rrule.until.getTime()) {
      break;
    }

    if (rrule.freq === 'DAILY') {
      if (cur.getTime() >= horizonStart.getTime() - durationMs) {
        const evStart = new Date(cur.getTime());
        const evEnd = new Date(cur.getTime() + durationMs);
        results.push({
          ...baseEvent,
          id: `${baseEvent.externalId}_${evStart.getTime()}`,
          startTime: evStart.toISOString(),
          endTime: evEnd.toISOString(),
          allDay
        });
      }
      cur.setDate(cur.getDate() + rrule.interval);
      count++;
    } else if (rrule.freq === 'WEEKLY') {
      if (rrule.byDay && rrule.byDay.length > 0) {
        // Expand across weekly days
        const weekStart = new Date(cur.getTime());
        for (const targetDay of rrule.byDay) {
          const dayOffset = (targetDay - weekStart.getDay() + 7) % 7;
          const occurrenceStart = new Date(weekStart.getTime());
          occurrenceStart.setDate(occurrenceStart.getDate() + dayOffset);

          if (rrule.until && occurrenceStart.getTime() > rrule.until.getTime()) continue;
          if (occurrenceStart.getTime() < start.getTime()) continue; // Don't precede initial start
          if (occurrenceStart.getTime() >= horizonStart.getTime() - durationMs && occurrenceStart.getTime() <= horizonEnd.getTime()) {
            const evEnd = new Date(occurrenceStart.getTime() + durationMs);
            results.push({
              ...baseEvent,
              id: `${baseEvent.externalId}_${occurrenceStart.getTime()}`,
              startTime: occurrenceStart.toISOString(),
              endTime: evEnd.toISOString(),
              allDay
            });
          }
          count++;
          if (count >= maxOccurrences) break;
        }
        cur.setDate(cur.getDate() + 7 * rrule.interval);
      } else {
        if (cur.getTime() >= horizonStart.getTime() - durationMs) {
          const evStart = new Date(cur.getTime());
          const evEnd = new Date(cur.getTime() + durationMs);
          results.push({
            ...baseEvent,
            id: `${baseEvent.externalId}_${evStart.getTime()}`,
            startTime: evStart.toISOString(),
            endTime: evEnd.toISOString(),
            allDay
          });
        }
        cur.setDate(cur.getDate() + 7 * rrule.interval);
        count++;
      }
    } else if (rrule.freq === 'MONTHLY') {
      if (cur.getTime() >= horizonStart.getTime() - durationMs) {
        const evStart = new Date(cur.getTime());
        const evEnd = new Date(cur.getTime() + durationMs);
        results.push({
          ...baseEvent,
          id: `${baseEvent.externalId}_${evStart.getTime()}`,
          startTime: evStart.toISOString(),
          endTime: evEnd.toISOString(),
          allDay
        });
      }
      cur.setMonth(cur.getMonth() + rrule.interval);
      count++;
    } else {
      break;
    }
  }

  return results;
}

/**
 * Parses raw RFC 5545 iCalendar data into normalized ExternalCalendarEvent[].
 */
export function parseIcsCalendar(icsContent: string, options: ParseIcsOptions = {}): ExternalCalendarEvent[] {
  if (!icsContent || typeof icsContent !== 'string') return [];

  const now = options.referenceNow || new Date();
  const horizonStart = options.horizonStart || new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const horizonEnd = options.horizonEnd || new Date(now.getTime() + 60 * 24 * 60 * 60 * 1000);
  const provider = options.provider || 'ical_feed';
  let calendarName = options.calendarName || 'External Calendar';
  const calendarColor = options.calendarColor || '#E65A41';

  const lines = unfoldIcsLines(icsContent);
  const events: ExternalCalendarEvent[] = [];

  let inVEvent = false;
  let uid = '';
  let summary = '';
  let description = '';
  let location = '';
  let url = '';
  let transp = 'OPAQUE'; // default busy
  let dtStartRaw: { date: Date; allDay: boolean } | null = null;
  let dtEndRaw: { date: Date; allDay: boolean } | null = null;
  let durationMinutes: number | null = null;
  let rruleRaw = '';

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    if (trimmed === 'BEGIN:VEVENT') {
      inVEvent = true;
      uid = '';
      summary = '';
      description = '';
      location = '';
      url = '';
      transp = 'OPAQUE';
      dtStartRaw = null;
      dtEndRaw = null;
      durationMinutes = null;
      rruleRaw = '';
      continue;
    }

    if (trimmed === 'END:VEVENT') {
      if (inVEvent && dtStartRaw) {
        const start = dtStartRaw.date;
        const allDay = dtStartRaw.allDay;
        let end: Date;

        if (dtEndRaw) {
          end = dtEndRaw.date;
        } else if (durationMinutes !== null) {
          end = new Date(start.getTime() + durationMinutes * 60 * 1000);
        } else if (allDay) {
          end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
        } else {
          end = new Date(start.getTime() + 60 * 60 * 1000); // 1h default
        }

        const durationMs = Math.max(0, end.getTime() - start.getTime());
        // All-day events default to free unless explicitly marked OPAQUE
        const isBusy = allDay ? transp === 'OPAQUE' && false : transp !== 'TRANSPARENT';

        const baseEvent: Omit<ExternalCalendarEvent, 'id' | 'startTime' | 'endTime'> = {
          provider,
          externalId: uid || `event_${start.getTime()}_${Math.random().toString(36).slice(2, 7)}`,
          calendarName,
          calendarColor,
          title: summary || 'Untitled Event',
          description: description || undefined,
          location: location || undefined,
          url: url || undefined,
          allDay,
          isBusy
        };

        if (rruleRaw) {
          const rrule = parseRRule(rruleRaw);
          if (rrule) {
            const recurringEvents = expandRecurringEvent(
              baseEvent,
              start,
              durationMs,
              allDay,
              rrule,
              horizonStart,
              horizonEnd
            );
            events.push(...recurringEvents);
          } else {
            // Fallback non-expanded
            events.push({
              ...baseEvent,
              id: `${baseEvent.externalId}_${start.getTime()}`,
              startTime: start.toISOString(),
              endTime: end.toISOString()
            });
          }
        } else {
          // Single event — include if within horizon
          if (end.getTime() >= horizonStart.getTime() && start.getTime() <= horizonEnd.getTime()) {
            events.push({
              ...baseEvent,
              id: `${baseEvent.externalId}_${start.getTime()}`,
              startTime: start.toISOString(),
              endTime: end.toISOString()
            });
          }
        }
      }
      inVEvent = false;
      continue;
    }

    if (!inVEvent) {
      if (trimmed.startsWith('X-WR-CALNAME:')) {
        calendarName = unescapeIcsText(trimmed.slice('X-WR-CALNAME:'.length).trim()) || calendarName;
      }
      continue;
    }

    const prop = parseIcsLine(trimmed);
    if (!prop) continue;

    switch (prop.name) {
      case 'UID':
        uid = unescapeIcsText(prop.value);
        break;
      case 'SUMMARY':
        summary = unescapeIcsText(prop.value);
        break;
      case 'DESCRIPTION':
        description = unescapeIcsText(prop.value);
        break;
      case 'LOCATION':
        location = unescapeIcsText(prop.value);
        break;
      case 'URL':
        url = prop.value.trim();
        break;
      case 'TRANSP':
        transp = prop.value.toUpperCase().trim();
        break;
      case 'DTSTART':
        dtStartRaw = parseIcsDateTime(prop.value, prop.params);
        break;
      case 'DTEND':
        dtEndRaw = parseIcsDateTime(prop.value, prop.params);
        break;
      case 'DURATION':
        durationMinutes = parseIcsDurationMinutes(prop.value);
        break;
      case 'RRULE':
        rruleRaw = prop.value;
        break;
    }
  }

  // Deterministic chronological ordering
  events.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
  return events;
}
