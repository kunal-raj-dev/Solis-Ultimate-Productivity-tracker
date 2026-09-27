import { TimeBlock, TimeBlockType } from '../../types/planning';
import { ScheduleEntry, ScheduleEntrySourceKind } from '../../types/schedule';

/**
 * V2 Phase 1 (C3/P1-04) — projection layer.
 *
 * The canonical schedule model is the source of truth; the four planning
 * surfaces are PROJECTIONS of it. This module projects schedule entries into
 * the TimeBlock shapes the existing surfaces already render, so a cutover
 * changes where blocks come from — not how they look or how their toggles
 * behave (entityId keeps pointing at the owning domain object).
 */

const SOURCE_TO_BLOCK_TYPE: Record<ScheduleEntrySourceKind, TimeBlockType> = {
  task: 'task_deadline',
  study_plan_item: 'study_plan',
  time_block: 'task_block',
  habit_window: 'routine',
  review: 'review',
  rest: 'rest',
  buffer: 'buffer',
  external_calendar: 'external',
  manual: 'task_block'
};

const PROVENANCE_SUBJECT_COLORS: Record<string, string> = {
  coral: 'coral',
  amber: 'amber',
  lavender: 'lavender',
  sage: 'sage'
};

function formatHour(hour: number): string {
  const h = Math.floor(hour) % 24;
  const m = Math.round((hour - Math.floor(hour)) * 60);
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function computeTimes(startHour: number | undefined, durationMinutes: number): { startTime: string; endTime: string } {
  const start = startHour ?? 8;
  return { startTime: formatHour(start), endTime: formatHour(start + durationMinutes / 60) };
}

/**
 * Projects schedule entries for ONE date into the TimeBlock shapes the
 * existing timeline renders. Anchored entries keep their slot; unanchored
 * flexible entries are packed sequentially after the last anchored end (or
 * from 08:00 when nothing is anchored), preserving entry order.
 */
export function projectScheduleEntriesToTimeBlocks(
  entries: ScheduleEntry[],
  date: string
): TimeBlock[] {
  const anchored = entries.filter((e) => typeof e.startHour === 'number');
  const unanchored = entries.filter((e) => typeof e.startHour !== 'number');

  const blocks: TimeBlock[] = [];

  for (const entry of anchored) {
    blocks.push(toTimeBlock(entry, date));
  }

  // Pack unanchored entries after the last anchored end (or 08:00), with a
  // small breather between them.
  let cursor = anchored.length
    ? Math.max(...anchored.map((e) => (e.startHour as number) + e.durationMinutes / 60))
    : 8;
  cursor = Math.min(22, Math.max(8, cursor));

  for (const entry of unanchored) {
    const block = toTimeBlock(entry, date, cursor);
    blocks.push(block);
    cursor = cursor + entry.durationMinutes / 60 + 0.25;
  }

  return blocks;
}

function toTimeBlock(entry: ScheduleEntry, date: string, forcedStartHour?: number): TimeBlock {
  const startHour = forcedStartHour ?? entry.startHour ?? 8;
  const { startTime, endTime } = computeTimes(startHour, entry.durationMinutes);
  const provenance = (entry.provenance || {}) as Record<string, unknown>;
  const subjectColor = typeof provenance.subjectColor === 'string' ? provenance.subjectColor : undefined;

  return {
    id: entry.id,
    entityId: entry.sourceId || entry.id,
    type: SOURCE_TO_BLOCK_TYPE[entry.sourceKind] || 'task_block',
    title: entry.title,
    startTime,
    endTime,
    durationMinutes: entry.durationMinutes,
    date,
    subjectId: typeof provenance.subjectId === 'string' ? provenance.subjectId : undefined,
    subjectName: typeof provenance.subjectName === 'string' ? provenance.subjectName : undefined,
    color: subjectColor && PROVENANCE_SUBJECT_COLORS[subjectColor] ? subjectColor : undefined,
    completed: entry.status === 'done',
    priority:
      provenance.priority === 'urgent' || provenance.priority === 'high' ||
      provenance.priority === 'medium' || provenance.priority === 'low'
        ? provenance.priority
        : undefined
  };
}
