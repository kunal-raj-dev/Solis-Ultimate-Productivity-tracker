import { describe, it, expect } from 'vitest';
import { normalizeTag, normalizeTagList, validateNoteInput, filterNotes } from '../utils/notes';
import { Note } from '../types/note';
import { ValidationError } from '../utils/validation';

describe('Phase 4 — Notes Domain & Pure Utilities', () => {
  describe('normalizeTag', () => {
    it('normalizes tags by trimming, lowercasing, and stripping leading hashtags', () => {
      expect(normalizeTag('#DistributedSystems')).toBe('distributedsystems');
      expect(normalizeTag('  ###Raft-Consensus  ')).toBe('raft-consensus');
      expect(normalizeTag('Graph Algorithms!')).toBe('graph-algorithms');
      expect(normalizeTag('---multi---hyphen---')).toBe('multi-hyphen');
    });

    it('returns empty string for empty or whitespace tag', () => {
      expect(normalizeTag('')).toBe('');
      expect(normalizeTag('   ')).toBe('');
      expect(normalizeTag('###')).toBe('');
    });
  });

  describe('normalizeTagList', () => {
    it('cleans and deduplicates tag lists', () => {
      const input = ['#Raft', 'raft', '  RAFT  ', '#Consensus', ''];
      const result = normalizeTagList(input);
      expect(result).toEqual(['raft', 'consensus']);
    });
  });

  describe('validateNoteInput', () => {
    it('accepts valid note data', () => {
      expect(() =>
        validateNoteInput({
          title: 'Raft Log Matching Property',
          category: 'concept',
          content: 'Invariant proofs'
        })
      ).not.toThrow();
    });

    it('rejects empty or whitespace-only title', () => {
      expect(() => validateNoteInput({ title: '' })).toThrow(ValidationError);
      expect(() => validateNoteInput({ title: '   ' })).toThrow(ValidationError);
    });

    it('rejects title longer than 200 characters', () => {
      const longTitle = 'a'.repeat(201);
      expect(() => validateNoteInput({ title: longTitle })).toThrow(ValidationError);
    });

    it('rejects invalid note category', () => {
      expect(() =>
        validateNoteInput({ title: 'Valid Title', category: 'invalid_category' as any })
      ).toThrow(ValidationError);
    });
  });

  describe('filterNotes', () => {
    const mockNotes: Note[] = [
      {
        id: '1',
        title: 'Raft Leader Election Protocol',
        content: 'Randomized election timeouts prevent split votes in distributed systems.',
        category: 'concept',
        subjectId: 'sbj_1',
        tags: ['raft', 'consensus', 'distributed'],
        createdAt: '2026-08-17T00:00:00Z',
        updatedAt: '2026-08-17T00:00:00Z'
      },
      {
        id: '2',
        title: 'Topological Sort DAG Properties',
        content: 'Kahns algorithm for dependency resolution.',
        category: 'revision',
        subjectId: 'sbj_2',
        tags: ['graphs', 'algorithms', 'dag'],
        createdAt: '2026-08-17T00:00:00Z',
        updatedAt: '2026-08-17T00:00:00Z'
      },
      {
        id: '3',
        title: 'LLVM IR Generation Pass',
        content: 'Abstract syntax tree translation into SSA form.',
        category: 'lecture',
        subjectId: 'sbj_3',
        tags: ['llvm', 'compilers'],
        createdAt: '2026-08-17T00:00:00Z',
        updatedAt: '2026-08-17T00:00:00Z'
      }
    ];

    it('filters by category', () => {
      const result = filterNotes(mockNotes, { category: 'concept' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('filters by subjectId', () => {
      const result = filterNotes(mockNotes, { subjectId: 'sbj_2' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('2');
    });

    it('filters by tag case-insensitively with leading hash tolerance', () => {
      const result = filterNotes(mockNotes, { tag: '#Consensus' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('performs full-text search across title and content', () => {
      const result = filterNotes(mockNotes, { searchQuery: 'split votes' });
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });

    it('handles partial updates without violating schema validation', () => {
      expect(() =>
        validateNoteInput({
          title: 'Updated Thinking Note'
        })
      ).not.toThrow();
    });
  });
});
