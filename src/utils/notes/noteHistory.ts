/**
 * Phase 2 (P2.5) — lightweight note version history.
 * A per-note ring buffer of the last 10 synced snapshots, stored in
 * localStorage so accidental deletions are recoverable without a schema
 * change. Snapshots are recorded after each successful cloud save.
 */

const MAX_SNAPSHOTS = 10;

export interface NoteSnapshot {
  /** ISO timestamp of when the snapshot was recorded. */
  at: string;
  content: string;
}

const storageKey = (noteId: string) => `solis_note_history_${noteId}`;

export function recordNoteSnapshot(noteId: string, content: string): void {
  if (!noteId) return;
  try {
    const history = getNoteHistory(noteId);
    const newest = history[0];
    if (newest && newest.content === content) return; // nothing changed
    const next: NoteSnapshot[] = [{ at: new Date().toISOString(), content }, ...history].slice(0, MAX_SNAPSHOTS);
    localStorage.setItem(storageKey(noteId), JSON.stringify(next));
  } catch {
    // storage full/unavailable — history is best-effort
  }
}

export function getNoteHistory(noteId: string): NoteSnapshot[] {
  try {
    const raw = localStorage.getItem(storageKey(noteId));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (s): s is NoteSnapshot =>
        s && typeof s.at === 'string' && typeof s.content === 'string'
    );
  } catch {
    return [];
  }
}

export function clearNoteHistory(noteId: string): void {
  try {
    localStorage.removeItem(storageKey(noteId));
  } catch {
    // ignore
  }
}
