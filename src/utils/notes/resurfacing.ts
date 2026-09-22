import { Note } from '../../types/note';

export interface ResurfacedNoteResult {
  note: Note;
  daysSince: number;
}

export interface ResurfacingOptions {
  limit?: number;
  minDaysSince?: number;
  now?: number;
}

/**
 * Calculates days elapsed between a timestamp and now, clamped to a minimum of 1 day.
 */
export function calculateDaysSince(dateString: string, now: number = Date.now()): number {
  const timestamp = new Date(dateString).getTime();
  if (isNaN(timestamp)) return 1;
  const elapsedMs = now - timestamp;
  return Math.max(1, Math.round(elapsedMs / (1000 * 60 * 60 * 24)));
}

/**
 * Returns notes sorted by oldest review timestamp (updatedAt || createdAt) first.
 */
export function sortNotesByOldestReview(notes: Note[]): Note[] {
  if (!notes || notes.length === 0) return [];
  return [...notes].sort((a, b) => {
    const timeA = new Date(a.updatedAt || a.createdAt).getTime();
    const timeB = new Date(b.updatedAt || b.createdAt).getTime();
    return timeA - timeB;
  });
}

/**
 * Derives the single best resurfacing candidate note based on oldest review date.
 */
export function calculateResurfacedNote(
  notes: Note[],
  now: number = Date.now()
): ResurfacedNoteResult | null {
  if (!notes || notes.length === 0) return null;
  const sorted = sortNotesByOldestReview(notes);
  const candidate = sorted[0];
  const daysSince = calculateDaysSince(candidate.updatedAt || candidate.createdAt, now);
  return {
    note: candidate,
    daysSince
  };
}

/**
 * Returns a list of resurfacing candidates filtered by minimum decay age.
 */
export function getResurfacingCandidates(
  notes: Note[],
  options: ResurfacingOptions = {}
): ResurfacedNoteResult[] {
  if (!notes || notes.length === 0) return [];
  const { limit = 5, minDaysSince = 0, now = Date.now() } = options;

  const sorted = sortNotesByOldestReview(notes);
  const results: ResurfacedNoteResult[] = [];

  for (const note of sorted) {
    const daysSince = calculateDaysSince(note.updatedAt || note.createdAt, now);
    if (daysSince >= minDaysSince) {
      results.push({ note, daysSince });
    }
    if (results.length >= limit) break;
  }

  return results;
}

/**
 * Produces user-facing badge text for resurfacing card.
 */
export function getResurfacingBadgeLabel(daysSince: number): string {
  return daysSince > 1 ? `Reviewed ${daysSince}d ago` : 'Spaced Recall';
}
