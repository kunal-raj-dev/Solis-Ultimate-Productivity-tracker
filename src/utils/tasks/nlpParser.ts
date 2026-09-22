import { PriorityLevel } from '../../types/common';
import { TaskCategory, TaskRecurrence, RecurrenceFrequency } from '../../types/task';
import { getISODateString } from '../date';

export interface ParsedNLPChip {
  id: string;
  type: 'date' | 'time' | 'duration' | 'priority' | 'category' | 'recurrence' | 'tag' | 'subject';
  label: string;
  value: any;
}

export interface ParsedNLPTask {
  title: string;
  rawInput: string;
  dueDate?: string; // YYYY-MM-DD
  dueTime?: string; // HH:mm
  estimatedMinutes?: number;
  priority?: PriorityLevel;
  category?: TaskCategory;
  recurrence?: TaskRecurrence;
  tags: string[];
  subjectId?: string;
  chips: ParsedNLPChip[];
}

interface KnownSubject {
  id: string;
  name: string;
}

/**
 * Parses natural language input for fast, frictionless task entry.
 * Example: "Study Distributed Systems tomorrow at 4pm for 90m !high #study"
 */
export function parseNLPTaskInput(input: string, knownSubjects: KnownSubject[] = []): ParsedNLPTask {
  const rawInput = input || '';
  let working = rawInput.trim();
  const chips: ParsedNLPChip[] = [];
  const tags: string[] = [];

  let dueDate: string | undefined;
  let dueTime: string | undefined;
  let estimatedMinutes: number | undefined;
  let priority: PriorityLevel | undefined;
  let category: TaskCategory | undefined;
  let recurrence: TaskRecurrence | undefined;
  let subjectId: string | undefined;

  const now = new Date();

  // 1. Parse Category Tags: #study, @study, #project, @project, #review, @review, #admin, @admin, #deep_work, @deep_work
  const catRegex = /(?:#|@)(study|project|review|admin|deep_work)\b/i;
  const catMatch = working.match(catRegex);
  if (catMatch) {
    category = catMatch[1].toLowerCase() as TaskCategory;
    const prefix = catMatch[0].startsWith('@') ? '@' : '#';
    chips.push({
      id: 'category',
      type: 'category',
      label: `${prefix}${category}`,
      value: category
    });
    working = working.replace(catMatch[0], ' ');
  }

  // 2. Parse General Tags: #tagname
  const tagRegex = /#([a-zA-Z0-9_\-]+)/g;
  let tagMatch: RegExpExecArray | null;
  while ((tagMatch = tagRegex.exec(working)) !== null) {
    const t = tagMatch[1].toLowerCase();
    if (!tags.includes(t)) {
      tags.push(t);
      chips.push({
        id: `tag-${t}`,
        type: 'tag',
        label: `#${t}`,
        value: t
      });
    }
  }
  working = working.replace(tagRegex, ' ');

  // 3. Parse Priority: !urgent, !high, !medium, !low, !p1, !p2, !p3, !p4
  const priorityRegex = /(?:!|p)([1-4]|urgent|high|med|medium|low)\b/i;
  const prioMatch = working.match(priorityRegex);
  if (prioMatch) {
    const pVal = prioMatch[1].toLowerCase();
    if (pVal === '1' || pVal === 'urgent') priority = 'urgent';
    else if (pVal === '2' || pVal === 'high') priority = 'high';
    else if (pVal === '3' || pVal === 'med' || pVal === 'medium') priority = 'medium';
    else if (pVal === '4' || pVal === 'low') priority = 'low';

    if (priority) {
      chips.push({
        id: 'priority',
        type: 'priority',
        label: `Priority: ${priority.toUpperCase()}`,
        value: priority
      });
    }
    working = working.replace(prioMatch[0], ' ');
  }

  // 4. Parse Recurrence: "every day", "daily", "every weekday", "weekdays", "every week", "weekly"
  const recurrenceRegex = /\b(every\s+(?:day|weekday|week|month)|daily|weekdays|weekly)\b/i;
  const recMatch = working.match(recurrenceRegex);
  if (recMatch) {
    const rPhrase = recMatch[1].toLowerCase();
    let freq: RecurrenceFrequency = 'daily';
    let label = 'Daily';

    if (rPhrase === 'daily' || rPhrase === 'every day') {
      freq = 'daily';
      label = 'Daily';
    } else if (rPhrase === 'weekdays' || rPhrase === 'every weekday') {
      freq = 'weekdays';
      label = 'Weekdays';
    } else if (rPhrase === 'weekly' || rPhrase === 'every week') {
      freq = 'weekly';
      label = 'Weekly';
    }

    recurrence = { frequency: freq };
    chips.push({
      id: 'recurrence',
      type: 'recurrence',
      label: `🔁 ${label}`,
      value: recurrence
    });
    working = working.replace(recMatch[0], ' ');
  }

  // 5. Parse Duration: "for 2 hours", "for 90m", "for 45 mins", "for 1.5h", "for 30 minutes"
  const durationRegex = /\bfor\s+(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?|m|min|mins|minutes?)\b/i;
  const durMatch = working.match(durationRegex);
  if (durMatch) {
    const val = parseFloat(durMatch[1]);
    const unit = durMatch[2].toLowerCase();
    if (unit.startsWith('h')) {
      estimatedMinutes = Math.round(val * 60);
    } else {
      estimatedMinutes = Math.round(val);
    }
    chips.push({
      id: 'duration',
      type: 'duration',
      label: `⏱️ ${estimatedMinutes}m`,
      value: estimatedMinutes
    });
    working = working.replace(durMatch[0], ' ');
  } else {
    // Shorthand standalone duration: e.g. "45m", "90min", "2h"
    const shortDurRegex = /\b(\d+(?:\.\d+)?)\s*(h|hr|hrs|hours?|m|min|mins|minutes?)\b/i;
    const shortMatch = working.match(shortDurRegex);
    if (shortMatch) {
      const val = parseFloat(shortMatch[1]);
      const unit = shortMatch[2].toLowerCase();
      if (unit.startsWith('h')) {
        estimatedMinutes = Math.round(val * 60);
      } else {
        estimatedMinutes = Math.round(val);
      }
      chips.push({
        id: 'duration',
        type: 'duration',
        label: `⏱️ ${estimatedMinutes}m`,
        value: estimatedMinutes
      });
      working = working.replace(shortMatch[0], ' ');
    }
  }

  // 6. Parse Time of Day: "at 6pm", "at 6:30 PM", "at 14:00", "at 9am", "at noon"
  const explicitAtTimeRegex = /\b(?:at\s+)?(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b|\bat\s+(\d{1,2})(?::(\d{2}))?\b/i;
  const noonRegex = /\b(?:at\s+)?noon\b/i;
  const midnightRegex = /\b(?:at\s+)?midnight\b/i;

  if (noonRegex.test(working)) {
    dueTime = '12:00';
    chips.push({ id: 'time', type: 'time', label: '⏰ 12:00 PM', value: dueTime });
    working = working.replace(noonRegex, ' ');
  } else if (midnightRegex.test(working)) {
    dueTime = '00:00';
    chips.push({ id: 'time', type: 'time', label: '⏰ 12:00 AM', value: dueTime });
    working = working.replace(midnightRegex, ' ');
  } else {
    const timeMatch = working.match(explicitAtTimeRegex);
    if (timeMatch) {
      const hRaw = timeMatch[1] || timeMatch[4];
      const mRaw = timeMatch[2] || timeMatch[5];
      let hours = parseInt(hRaw, 10);
      const minutes = mRaw ? parseInt(mRaw, 10) : 0;
      const meridiem = timeMatch[3]?.toLowerCase();

      if (meridiem === 'pm' && hours < 12) hours += 12;
      if (meridiem === 'am' && hours === 12) hours = 0;

      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        dueTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
        const ampm = hours >= 12 ? 'PM' : 'AM';
        const displayH = hours % 12 === 0 ? 12 : hours % 12;
        chips.push({
          id: 'time',
          type: 'time',
          label: `⏰ ${displayH}:${String(minutes).padStart(2, '0')} ${ampm}`,
          value: dueTime
        });
        working = working.replace(timeMatch[0], ' ');
      }
    }
  }

  // 7. Parse Date: "today", "tomorrow", "tonight", "in 2 days", "next monday", "on friday"
  const todayRegex = /\b(today|tonight)\b/i;
  const tomorrowRegex = /\b(tomorrow)\b/i;
  const inDaysRegex = /\bin\s+(\d+)\s+days?\b/i;
  const dayOfWeekRegex = /\b(?:next|this|on)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i;

  if (tomorrowRegex.test(working)) {
    const tmrw = new Date(now);
    tmrw.setDate(tmrw.getDate() + 1);
    dueDate = getISODateString(tmrw);
    chips.push({ id: 'date', type: 'date', label: '📅 Tomorrow', value: dueDate });
    working = working.replace(tomorrowRegex, ' ');
  } else if (todayRegex.test(working)) {
    dueDate = getISODateString(now);
    chips.push({ id: 'date', type: 'date', label: '📅 Today', value: dueDate });
    working = working.replace(todayRegex, ' ');
  } else {
    const inDaysMatch = working.match(inDaysRegex);
    if (inDaysMatch) {
      const daysOffset = parseInt(inDaysMatch[1], 10);
      const targetDate = new Date(now);
      targetDate.setDate(targetDate.getDate() + daysOffset);
      dueDate = getISODateString(targetDate);
      chips.push({ id: 'date', type: 'date', label: `📅 In ${daysOffset} days`, value: dueDate });
      working = working.replace(inDaysMatch[0], ' ');
    } else {
      const dowMatch = working.match(dayOfWeekRegex);
      if (dowMatch) {
        const dowName = dowMatch[1].toLowerCase();
        const daysMap: Record<string, number> = {
          sunday: 0,
          monday: 1,
          tuesday: 2,
          wednesday: 3,
          thursday: 4,
          friday: 5,
          saturday: 6
        };
        const targetDay = daysMap[dowName];
        if (targetDay !== undefined) {
          const currentDay = now.getDay();
          let diff = targetDay - currentDay;
          if (diff <= 0) diff += 7; // next occurrence
          const targetDate = new Date(now);
          targetDate.setDate(targetDate.getDate() + diff);
          dueDate = getISODateString(targetDate);
          chips.push({
            id: 'date',
            type: 'date',
            label: `📅 Next ${dowName.charAt(0).toUpperCase() + dowName.slice(1)}`,
            value: dueDate
          });
          working = working.replace(dowMatch[0], ' ');
        }
      }
    }
  }

  // 8. Subject Matching (if known subjects are passed)
  for (const sub of knownSubjects) {
    const subRegex = new RegExp(`\\b${sub.name}\\b`, 'i');
    if (subRegex.test(working)) {
      subjectId = sub.id;
      chips.push({
        id: 'subject',
        type: 'subject',
        label: `📚 ${sub.name}`,
        value: sub.id
      });
      working = working.replace(subRegex, ' ');
      break;
    }
  }

  // 9. Clean up Title
  let title = working
    .replace(/\s+/g, ' ')
    .replace(/^[-–—:,.\s]+|[-–—:,.\s]+$/g, '')
    .trim();

  // Fallback title if everything was stripped
  if (!title) {
    title = rawInput.trim();
  }

  return {
    title,
    rawInput,
    dueDate,
    dueTime,
    estimatedMinutes,
    priority,
    category,
    recurrence,
    tags,
    subjectId,
    chips
  };
}
