import { IReviewService } from '../../api.interface';
import { ReviewQueueItem } from '../../../types/learning';
import { mapReviewItem } from '../supabaseMappers';
import { getISODateString } from '../../../utils/date';
import { ValidationError } from '../../../utils/validation';
import { SupabaseServiceContext } from './types';

export class SupabaseReviewService implements IReviewService {
  constructor(private ctx: SupabaseServiceContext) {}

  getDueReviewItems = async (): Promise<ReviewQueueItem[]> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('review_queue_items')
      .select(`
        *,
        subjects (id, name, color),
        study_topics (id, title)
      `)
      .eq('user_id', userId)
      .eq('completed', false)
      .order('due_date', { ascending: true });

    if (error) {
      if (error.code === '42P01') return [];
      throw error;
    }

    return (data || []).map((row) =>
      mapReviewItem(row, row.subjects?.name, row.subjects?.color, row.study_topics?.title)
    );
  };

  createReviewItem = async (item: Partial<ReviewQueueItem>): Promise<ReviewQueueItem> => {
    const userId = await this.ctx.getUserId();
    if (!item.subjectId || !item.topicId || !item.reason) {
      throw new ValidationError('Review queue item requires subject, topic, and reason.');
    }

    const { data, error } = await this.ctx.client
      .from('review_queue_items')
      .insert({
        user_id: userId,
        subject_id: item.subjectId,
        topic_id: item.topicId,
        flashcard_id: item.flashcardId || null,
        due_date: item.dueDate || getISODateString(new Date()),
        priority: item.priority || 'medium',
        reason: item.reason,
        completed: false
      })
      .select(`
        *,
        subjects (id, name, color),
        study_topics (id, title)
      `)
      .single();

    if (error) throw error;
    this.ctx.notify();
    return mapReviewItem(data, data.subjects?.name, data.subjects?.color, data.study_topics?.title);
  };

  completeReviewItem = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('review_queue_items')
      .update({
        completed: true,
        completed_at: new Date().toISOString()
      })
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };

  deleteReviewItem = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('review_queue_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };
}
