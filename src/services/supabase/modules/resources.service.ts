import { IResourceService } from '../../api.interface';
import { StudyResource, ResourceFilterOptions } from '../../../types/resource';
import { mapResource } from '../supabaseMappers';
import { ValidationError } from '../../../utils/validation';
import { SupabaseServiceContext } from './types';

export class SupabaseResourceService implements IResourceService {
  constructor(private ctx: SupabaseServiceContext) {}

  getResources = async (filter?: ResourceFilterOptions): Promise<StudyResource[]> => {
    const userId = await this.ctx.getUserId();
    let query = this.ctx.client
      .from('study_resources')
      .select(`
        *,
        subjects (id, name),
        study_topics (id, title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filter) {
      if (filter.subjectId) query = query.eq('subject_id', filter.subjectId);
      if (filter.topicId) query = query.eq('topic_id', filter.topicId);
      if (filter.type) query = query.eq('type', filter.type);
      if (filter.status) query = query.eq('status', filter.status);
    }

    const { data, error } = await query;
    if (error) {
      if (error.code === '42P01') return [];
      throw error;
    }

    let results = (data || []).map((row) =>
      mapResource(row, row.subjects?.name, row.study_topics?.title)
    );

    if (filter?.search) {
      const q = filter.search.toLowerCase();
      results = results.filter(
        (r) =>
          r.title.toLowerCase().includes(q) ||
          r.author?.toLowerCase().includes(q) ||
          r.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return results;
  };

  getResourceById = async (id: string): Promise<StudyResource | null> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('study_resources')
      .select(`
        *,
        subjects (id, name),
        study_topics (id, title)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return mapResource(data, data.subjects?.name, data.study_topics?.title);
  };

  createResource = async (resourceData: Partial<StudyResource>): Promise<StudyResource> => {
    const userId = await this.ctx.getUserId();
    if (!resourceData.title || !resourceData.subjectId) {
      throw new ValidationError('Resource requires a title and associated study subject.');
    }

    const { data, error } = await this.ctx.client
      .from('study_resources')
      .insert({
        user_id: userId,
        subject_id: resourceData.subjectId,
        topic_id: resourceData.topicId || null,
        title: resourceData.title.trim(),
        author: resourceData.author?.trim() || null,
        url: resourceData.url?.trim() || null,
        type: resourceData.type || 'paper',
        status: resourceData.status || 'unread',
        rating: resourceData.rating || null,
        notes: resourceData.notes?.trim() || null,
        tags: Array.isArray(resourceData.tags) ? resourceData.tags : []
      })
      .select(`
        *,
        subjects (id, name),
        study_topics (id, title)
      `)
      .single();

    if (error) throw error;
    this.ctx.notify();
    return mapResource(data, data.subjects?.name, data.study_topics?.title);
  };

  updateResource = async (id: string, updates: Partial<StudyResource>): Promise<StudyResource> => {
    const userId = await this.ctx.getUserId();
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.author !== undefined) payload.author = updates.author.trim() || null;
    if (updates.url !== undefined) payload.url = updates.url.trim() || null;
    if (updates.type !== undefined) payload.type = updates.type;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.rating !== undefined) payload.rating = updates.rating;
    if (updates.notes !== undefined) payload.notes = updates.notes;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId;
    if (updates.topicId !== undefined) payload.topic_id = updates.topicId;

    const { data, error } = await this.ctx.client
      .from('study_resources')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`
        *,
        subjects (id, name),
        study_topics (id, title)
      `)
      .single();

    if (error) throw error;
    this.ctx.notify();
    return mapResource(data, data.subjects?.name, data.study_topics?.title);
  };

  deleteResource = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('study_resources')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };
}
