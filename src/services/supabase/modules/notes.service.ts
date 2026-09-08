import { INoteService } from '../../api.interface';
import { Note, NoteFilterOptions } from '../../../types/note';
import { mapNote } from '../supabaseMappers';
import { validateNoteInput, normalizeTag, normalizeTagList, filterNotes } from '../../../utils/notes';
import { queryCache } from '../../cache';
import { SupabaseServiceContext } from './types';

export class SupabaseNoteService implements INoteService {
  constructor(private ctx: SupabaseServiceContext) {}

  getNotes = async (filter?: NoteFilterOptions): Promise<Note[]> => {
    const cacheKey = `notes:${JSON.stringify(filter || {})}`;
    const cached = queryCache.get<Note[]>(cacheKey);
    if (cached) return cached;

    const userId = await this.ctx.getUserId();
    const [notesRes, subjectsRes] = await Promise.all([
      this.ctx.client
        .from('notes')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false }),
      this.ctx.client.from('subjects').select('id, name').eq('user_id', userId)
    ]);

    if (notesRes.error) throw notesRes.error;
    const subjectsMap = new Map((subjectsRes.data || []).map((s: any) => [s.id, s.name]));

    const notes = (notesRes.data || []).map((row: any) => {
      const resolvedSubjectName = subjectsMap.get(row.subject_id);
      return mapNote(row, resolvedSubjectName);
    });

    const result = filterNotes(notes, filter);
    queryCache.set(cacheKey, result);
    return result;
  };

  getNoteById = async (id: string): Promise<Note | null> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('notes')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;

    let subjectName: string | undefined;
    if (data.subject_id) {
      const { data: sub } = await this.ctx.client
        .from('subjects')
        .select('name')
        .eq('id', data.subject_id)
        .single();
      subjectName = sub?.name;
    }

    return mapNote(data, subjectName);
  };

  createNote = async (note: Partial<Note>): Promise<Note> => {
    validateNoteInput(note);
    const userId = await this.ctx.getUserId();
    const cleanTags = normalizeTagList(note.tags || []);

    const { data, error } = await this.ctx.client
      .from('notes')
      .insert({
        user_id: userId,
        subject_id: note.subjectId || null,
        plan_item_id: note.planItemId || null,
        study_session_id: note.studySessionId || null,
        title: note.title!.trim(),
        content: note.content || '',
        category: note.category || 'concept',
        tags: cleanTags
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to create note');

    this.ctx.notify();
    return mapNote(data, note.subjectName);
  };

  updateNote = async (id: string, updates: Partial<Note>): Promise<Note> => {
    if (updates.title !== undefined) {
      validateNoteInput(updates);
    }

    const userId = await this.ctx.getUserId();
    const payload: any = { updated_at: new Date().toISOString() };

    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.content !== undefined) payload.content = updates.content;
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId || null;
    if (updates.planItemId !== undefined) payload.plan_item_id = updates.planItemId || null;
    if (updates.studySessionId !== undefined) payload.study_session_id = updates.studySessionId || null;
    if (updates.tags !== undefined) payload.tags = normalizeTagList(updates.tags);

    const { data, error } = await this.ctx.client
      .from('notes')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to update note');

    this.ctx.notify();
    return mapNote(data, updates.subjectName);
  };

  deleteNote = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('notes')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };

  getAllTags = async (): Promise<string[]> => {
    const notes = await this.getNotes();
    const tagSet = new Set<string>();
    for (const note of notes) {
      for (const tag of note.tags) {
        const norm = normalizeTag(tag);
        if (norm) tagSet.add(norm);
      }
    }
    return Array.from(tagSet).sort();
  };
}
