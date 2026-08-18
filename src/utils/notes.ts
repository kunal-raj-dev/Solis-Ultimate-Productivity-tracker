import { Note, NoteFilterOptions } from '../types/note';
import { ValidationError } from './validation';

/**
 * Pure Tag Normalizer
 * Cleans user tag strings (lowercase, removes leading #, strips disallowed chars, trims).
 */
export function normalizeTag(tag: string): string {
  if (!tag) return '';
  return tag
    .trim()
    .toLowerCase()
    .replace(/^#+/, '')
    .replace(/[^a-z0-9-_]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

/**
 * Normalizes a list of tags, deduplicating and omitting empty results.
 */
export function normalizeTagList(tags: string[]): string[] {
  if (!Array.isArray(tags)) return [];
  const normalized = tags
    .map(normalizeTag)
    .filter((t) => t.length > 0);
  return Array.from(new Set(normalized));
}

/**
 * Validates Note input before creation or updating.
 */
export function validateNoteInput(note: Partial<Note>): void {
  if (!note.title || note.title.trim().length === 0) {
    throw new ValidationError('Note title cannot be empty.', 'title');
  }

  if (note.title.trim().length > 200) {
    throw new ValidationError('Note title cannot exceed 200 characters.', 'title');
  }

  const validCategories = [
    'lecture',
    'concept',
    'revision',
    'problem_solving',
    'idea',
    'reflection',
    'reference'
  ];

  if (note.category && !validCategories.includes(note.category)) {
    throw new ValidationError(`Invalid note category: ${note.category}`, 'category');
  }
}

/**
 * Pure in-memory note filtering and search engine.
 */
export function filterNotes(notes: Note[], filter?: NoteFilterOptions): Note[] {
  if (!filter) return notes;

  let result = [...notes];

  if (filter.category && filter.category !== 'all') {
    result = result.filter((n) => n.category === filter.category);
  }

  if (filter.subjectId && filter.subjectId !== 'all') {
    result = result.filter((n) => n.subjectId === filter.subjectId);
  }

  if (filter.tag && filter.tag !== 'all') {
    const normalizedTargetTag = normalizeTag(filter.tag);
    result = result.filter((n) =>
      n.tags.some((t) => normalizeTag(t) === normalizedTargetTag)
    );
  }

  if (filter.searchQuery && filter.searchQuery.trim().length > 0) {
    const query = filter.searchQuery.toLowerCase().trim();
    result = result.filter((n) => {
      const inTitle = n.title.toLowerCase().includes(query);
      const inContent = n.content.toLowerCase().includes(query);
      const inTags = n.tags.some((t) => t.toLowerCase().includes(query));
      const inCategory = n.category.toLowerCase().includes(query);
      return inTitle || inContent || inTags || inCategory;
    });
  }

  return result;
}
