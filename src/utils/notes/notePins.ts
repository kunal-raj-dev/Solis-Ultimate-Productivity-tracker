/**
 * Phase 2 (P2.3) — note pinning.
 * Client-side pin set (localStorage) so important reference notes float to
 * the top of the Knowledge Index without a database migration.
 */

const PINS_KEY = 'solis_pinned_note_ids';

export function getPinnedNoteIds(): string[] {
  try {
    const raw = localStorage.getItem(PINS_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((id) => typeof id === 'string') : [];
  } catch {
    return [];
  }
}

export function isNotePinned(noteId: string): boolean {
  return getPinnedNoteIds().includes(noteId);
}

/** Toggles the pin and returns the updated id set (persisted best-effort). */
export function toggleNotePin(noteId: string): string[] {
  const current = getPinnedNoteIds();
  const next = current.includes(noteId)
    ? current.filter((id) => id !== noteId)
    : [...current, noteId];
  try {
    localStorage.setItem(PINS_KEY, JSON.stringify(next));
  } catch {
    // storage unavailable — pin lives in session state only
  }
  return next;
}
