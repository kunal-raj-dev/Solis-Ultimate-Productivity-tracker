import { describe, it, expect } from 'vitest';
import {
  calculateDaysSince,
  sortNotesByOldestReview,
  calculateResurfacedNote,
  getResurfacingCandidates,
  getResurfacingBadgeLabel
} from '../utils/notes/resurfacing';
import { Note } from '../types/note';

const createMockNote = (overrides: Partial<Note>): Note => ({
  id: `note-${Math.random().toString(36).slice(2, 7)}`,
  title: 'Sample Thought',
  content: 'Concept description body.',
  category: 'concept',
  tags: ['learning'],
  createdAt: '2026-09-01T10:00:00.000Z',
  updatedAt: '2026-09-01T10:00:00.000Z',
  ...overrides
});

describe('SOLIS PART 2 — Knowledge Resurfacing & Memory Decay Suite', () => {
  // Reference fixed "now": 2026-09-22T12:00:00.000Z
  const REFERENCE_NOW = new Date('2026-09-22T12:00:00.000Z').getTime();

  /* =========================================================================
     1. Boundary & Empty Handling
     ========================================================================= */
  describe('Boundary & Empty Input Safety', () => {
    it('returns null when notes list is empty or undefined', () => {
      expect(calculateResurfacedNote([], REFERENCE_NOW)).toBeNull();
      expect(calculateResurfacedNote(undefined as any, REFERENCE_NOW)).toBeNull();
      expect(calculateResurfacedNote(null as any, REFERENCE_NOW)).toBeNull();
    });

    it('returns empty array from sortNotesByOldestReview for empty inputs', () => {
      expect(sortNotesByOldestReview([])).toEqual([]);
      expect(sortNotesByOldestReview(null as any)).toEqual([]);
    });

    it('handles single note array without throwing', () => {
      const single = [createMockNote({ title: 'Solo Idea' })];
      const result = calculateResurfacedNote(single, REFERENCE_NOW);
      expect(result).not.toBeNull();
      expect(result?.note.title).toBe('Solo Idea');
    });
  });

  /* =========================================================================
     2. Sorting by Oldest Review Timestamp
     ========================================================================= */
  describe('Sorting by Oldest Review Timestamp', () => {
    it('sorts notes with oldest updatedAt first to combat memory decay', () => {
      const notes: Note[] = [
        createMockNote({ id: 'n-new', title: 'Recent Note', updatedAt: '2026-09-20T10:00:00.000Z' }),
        createMockNote({ id: 'n-old', title: 'Ancient Note', updatedAt: '2026-08-01T10:00:00.000Z' }),
        createMockNote({ id: 'n-mid', title: 'Mid Note', updatedAt: '2026-09-10T10:00:00.000Z' })
      ];

      const sorted = sortNotesByOldestReview(notes);
      expect(sorted[0].id).toBe('n-old');
      expect(sorted[1].id).toBe('n-mid');
      expect(sorted[2].id).toBe('n-new');
    });

    it('falls back to createdAt when updatedAt is missing or undefined', () => {
      const notes: Note[] = [
        createMockNote({
          id: 'n-no-updated',
          title: 'Created Long Ago',
          createdAt: '2026-07-15T08:00:00.000Z',
          updatedAt: undefined as any
        }),
        createMockNote({
          id: 'n-has-updated',
          title: 'Updated Yesterday',
          createdAt: '2026-07-01T08:00:00.000Z',
          updatedAt: '2026-09-21T08:00:00.000Z'
        })
      ];

      const sorted = sortNotesByOldestReview(notes);
      // n-no-updated effective review is July 15, whereas n-has-updated was reviewed Sept 21
      expect(sorted[0].id).toBe('n-no-updated');
      expect(sorted[1].id).toBe('n-has-updated');
    });

    it('does not mutate the original input array', () => {
      const notes: Note[] = [
        createMockNote({ title: 'B', updatedAt: '2026-09-15T00:00:00.000Z' }),
        createMockNote({ title: 'A', updatedAt: '2026-09-01T00:00:00.000Z' })
      ];

      const originalOrder = [...notes.map((n) => n.title)];
      sortNotesByOldestReview(notes);
      expect(notes.map((n) => n.title)).toEqual(originalOrder);
    });
  });

  /* =========================================================================
     3. Temporal Decay Calculation (calculateDaysSince)
     ========================================================================= */
  describe('Temporal Decay Calculation (calculateDaysSince)', () => {
    it('calculates exact elapsed days accurately', () => {
      // 21 days before Sept 22 is Sept 1
      const sept1 = '2026-09-01T12:00:00.000Z';
      expect(calculateDaysSince(sept1, REFERENCE_NOW)).toBe(21);

      // 7 days before Sept 22 is Sept 15
      const sept15 = '2026-09-15T12:00:00.000Z';
      expect(calculateDaysSince(sept15, REFERENCE_NOW)).toBe(7);

      // 14 days before Sept 22 is Sept 8
      const sept8 = '2026-09-08T12:00:00.000Z';
      expect(calculateDaysSince(sept8, REFERENCE_NOW)).toBe(14);
    });

    it('clamps to minimum 1 day for notes created or updated today', () => {
      // 10 minutes ago
      const tenMinsAgo = new Date(REFERENCE_NOW - 10 * 60 * 1000).toISOString();
      expect(calculateDaysSince(tenMinsAgo, REFERENCE_NOW)).toBe(1);

      // Same timestamp
      const exactNow = new Date(REFERENCE_NOW).toISOString();
      expect(calculateDaysSince(exactNow, REFERENCE_NOW)).toBe(1);
    });

    it('clamps future timestamps gracefully to 1 day instead of negative numbers', () => {
      const tomorrow = new Date(REFERENCE_NOW + 24 * 60 * 60 * 1000).toISOString();
      expect(calculateDaysSince(tomorrow, REFERENCE_NOW)).toBe(1);
    });

    it('returns safe fallback of 1 for invalid date strings', () => {
      expect(calculateDaysSince('invalid-date-string', REFERENCE_NOW)).toBe(1);
      expect(calculateDaysSince('', REFERENCE_NOW)).toBe(1);
    });
  });

  /* =========================================================================
     4. Resurfacing Candidate Selection (calculateResurfacedNote)
     ========================================================================= */
  describe('Resurfacing Candidate Selection (calculateResurfacedNote)', () => {
    it('selects the single oldest concept for the daily dashboard card', () => {
      const notes: Note[] = [
        createMockNote({
          id: 'note-1',
          title: 'Memory Hierarchy & Cache Locality',
          content: 'L1/L2/L3 cache latency and spatial locality principles.',
          updatedAt: '2026-09-02T12:00:00.000Z' // 20 days ago
        }),
        createMockNote({
          id: 'note-2',
          title: 'Raft Log Replication',
          content: 'Leader election safety invariants.',
          updatedAt: '2026-09-18T12:00:00.000Z' // 4 days ago
        })
      ];

      const candidate = calculateResurfacedNote(notes, REFERENCE_NOW);
      expect(candidate).not.toBeNull();
      expect(candidate?.note.id).toBe('note-1');
      expect(candidate?.note.title).toBe('Memory Hierarchy & Cache Locality');
      expect(candidate?.daysSince).toBe(20);
    });

    it('shifts candidate automatically when the oldest note is updated', () => {
      const note1 = createMockNote({
        id: 'note-1',
        title: 'Memory Hierarchy',
        updatedAt: '2026-09-02T12:00:00.000Z'
      });
      const note2 = createMockNote({
        id: 'note-2',
        title: 'Raft Log Replication',
        updatedAt: '2026-09-10T12:00:00.000Z'
      });

      // Before update: note1 is oldest
      expect(calculateResurfacedNote([note1, note2], REFERENCE_NOW)?.note.id).toBe('note-1');

      // User reviews note1 today: note1 updatedAt becomes today
      const reviewedNote1 = { ...note1, updatedAt: new Date(REFERENCE_NOW).toISOString() };

      // After update: note2 becomes the oldest candidate
      const nextCandidate = calculateResurfacedNote([reviewedNote1, note2], REFERENCE_NOW);
      expect(nextCandidate?.note.id).toBe('note-2');
      expect(nextCandidate?.daysSince).toBe(12);
    });
  });

  /* =========================================================================
     5. Multi-Candidate Threshold Filtering (getResurfacingCandidates)
     ========================================================================= */
  describe('Multi-Candidate Threshold Filtering (getResurfacingCandidates)', () => {
    const candidateNotes: Note[] = [
      createMockNote({ id: 'n-45', title: 'Note 45d', updatedAt: '2026-08-08T12:00:00.000Z' }), // 45d
      createMockNote({ id: 'n-20', title: 'Note 20d', updatedAt: '2026-09-02T12:00:00.000Z' }), // 20d
      createMockNote({ id: 'n-14', title: 'Note 14d', updatedAt: '2026-09-08T12:00:00.000Z' }), // 14d
      createMockNote({ id: 'n-5', title: 'Note 5d', updatedAt: '2026-09-17T12:00:00.000Z' }),   // 5d
      createMockNote({ id: 'n-1', title: 'Note 1d', updatedAt: '2026-09-21T12:00:00.000Z' })    // 1d
    ];

    it('filters candidates based on minDaysSince threshold (e.g. 14+ days decay)', () => {
      const decayingNotes = getResurfacingCandidates(candidateNotes, {
        minDaysSince: 14,
        now: REFERENCE_NOW
      });

      expect(decayingNotes).toHaveLength(3);
      expect(decayingNotes.map((c) => c.note.id)).toEqual(['n-45', 'n-20', 'n-14']);
    });

    it('respects the limit parameter', () => {
      const top2 = getResurfacingCandidates(candidateNotes, {
        limit: 2,
        now: REFERENCE_NOW
      });

      expect(top2).toHaveLength(2);
      expect(top2[0].note.id).toBe('n-45');
      expect(top2[1].note.id).toBe('n-20');
    });

    it('returns empty array when no notes meet the minDaysSince requirement', () => {
      const freshOnly = [
        createMockNote({ updatedAt: '2026-09-21T12:00:00.000Z' }),
        createMockNote({ updatedAt: '2026-09-22T12:00:00.000Z' })
      ];

      const results = getResurfacingCandidates(freshOnly, { minDaysSince: 14, now: REFERENCE_NOW });
      expect(results).toHaveLength(0);
    });
  });

  /* =========================================================================
     6. Badge Text Phrasing (getResurfacingBadgeLabel)
     ========================================================================= */
  describe('Badge Text Phrasing (getResurfacingBadgeLabel)', () => {
    it('returns "Spaced Recall" for notes reviewed within 1 day', () => {
      expect(getResurfacingBadgeLabel(1)).toBe('Spaced Recall');
      expect(getResurfacingBadgeLabel(0)).toBe('Spaced Recall');
    });

    it('returns "Reviewed Nd ago" for decaying notes (> 1 day)', () => {
      expect(getResurfacingBadgeLabel(7)).toBe('Reviewed 7d ago');
      expect(getResurfacingBadgeLabel(14)).toBe('Reviewed 14d ago');
      expect(getResurfacingBadgeLabel(42)).toBe('Reviewed 42d ago');
    });
  });

  /* =========================================================================
     7. Review Navigation URL Target
     ========================================================================= */
  describe('Review Action URL Target Formatting', () => {
    it('formats note query parameter url with full uri encoding', () => {
      const noteTitle = 'Raft Consensus & Invariants? Yes/No!';
      const targetUrl = `/app/notes?q=${encodeURIComponent(noteTitle)}`;
      expect(targetUrl).toBe('/app/notes?q=Raft%20Consensus%20%26%20Invariants%3F%20Yes%2FNo!');
    });
  });
});
