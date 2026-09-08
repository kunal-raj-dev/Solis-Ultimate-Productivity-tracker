import { IFlashcardService } from '../../api.interface';
import { Flashcard, CardRating } from '../../../types/learning';
import { mapFlashcard } from '../supabaseMappers';
import { getISODateString } from '../../../utils/date';
import { ValidationError } from '../../../utils/validation';
import { calculateNextCardReview } from '../../../utils/learning/spacedRepetition';
import { SupabaseServiceContext } from './types';

export class SupabaseFlashcardService implements IFlashcardService {
  constructor(private ctx: SupabaseServiceContext) {}

  getFlashcards = async (filter?: { subjectId?: string; topicId?: string }): Promise<Flashcard[]> => {
    const userId = await this.ctx.getUserId();
    let query = this.ctx.client
      .from('flashcards')
      .select(`
        *,
        subjects (id, name),
        study_topics (id, title)
      `)
      .eq('user_id', userId)
      .order('next_review_date', { ascending: true });

    if (filter?.subjectId) {
      query = query.eq('subject_id', filter.subjectId);
    }
    if (filter?.topicId) {
      query = query.eq('topic_id', filter.topicId);
    }

    const { data, error } = await query;
    if (error) {
      // Return empty array gracefully if table is not yet migrated in dev
      if (error.code === '42P01') return [];
      throw error;
    }

    return (data || []).map((row) => mapFlashcard(row, row.subjects?.name, row.study_topics?.title));
  };

  getFlashcardById = async (id: string): Promise<Flashcard | null> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('flashcards')
      .select(`
        *,
        subjects (id, name),
        study_topics (id, title)
      `)
      .eq('id', id)
      .eq('user_id', userId)
      .maybeSingle();

    if (error) throw error;
    return data ? mapFlashcard(data, data.subjects?.name, data.study_topics?.title) : null;
  };

  createFlashcard = async (cardData: Partial<Flashcard>): Promise<Flashcard> => {
    const userId = await this.ctx.getUserId();
    if (!cardData.frontPrompt || !cardData.backAnswer || !cardData.subjectId) {
      throw new ValidationError('Flashcard requires front prompt, back answer, and subject.');
    }

    const { data, error } = await this.ctx.client
      .from('flashcards')
      .insert({
        user_id: userId,
        subject_id: cardData.subjectId,
        topic_id: cardData.topicId || null,
        note_id: cardData.noteId || null,
        front_prompt: cardData.frontPrompt,
        back_answer: cardData.backAnswer,
        card_type: cardData.cardType || 'standard',
        difficulty_rating: cardData.difficultyRating || 'good',
        repetition_count: 0,
        interval_days: 1,
        ease_factor: 2.5,
        next_review_date: getISODateString(new Date())
      })
      .select(`
        *,
        subjects (id, name),
        study_topics (id, title)
      `)
      .single();

    if (error) throw error;
    this.ctx.notify();
    return mapFlashcard(data, data.subjects?.name, data.study_topics?.title);
  };

  updateFlashcard = async (id: string, updates: Partial<Flashcard>): Promise<Flashcard> => {
    const userId = await this.ctx.getUserId();
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.frontPrompt !== undefined) payload.front_prompt = updates.frontPrompt;
    if (updates.backAnswer !== undefined) payload.back_answer = updates.backAnswer;
    if (updates.cardType !== undefined) payload.card_type = updates.cardType;
    if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId;
    if (updates.topicId !== undefined) payload.topic_id = updates.topicId;

    const { data, error } = await this.ctx.client
      .from('flashcards')
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
    return mapFlashcard(data, data.subjects?.name, data.study_topics?.title);
  };

  deleteFlashcard = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('flashcards')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };

  recordCardAttempt = async (cardId: string, rating: CardRating): Promise<Flashcard> => {
    const card = await this.getFlashcardById(cardId);
    if (!card) throw new ValidationError(`Flashcard "${cardId}" not found.`);

    const userId = await this.ctx.getUserId();
    const nextSchedule = calculateNextCardReview(card, rating);

    const { data, error } = await this.ctx.client
      .from('flashcards')
      .update({
        difficulty_rating: rating,
        repetition_count: nextSchedule.repetitionCount,
        interval_days: nextSchedule.intervalDays,
        ease_factor: nextSchedule.easeFactor,
        next_review_date: nextSchedule.nextReviewDate,
        last_reviewed_at: nextSchedule.lastReviewedAt,
        updated_at: new Date().toISOString()
      })
      .eq('id', cardId)
      .eq('user_id', userId)
      .select(`
        *,
        subjects (id, name),
        study_topics (id, title)
      `)
      .single();

    if (error) throw error;

    // Update topic mastery if associated
    if (card.topicId) {
      if (rating === 'easy' || rating === 'good') {
        const services = this.ctx.getServices();
        if (nextSchedule.repetitionCount >= 3) {
          await services.study.updateTopic(card.topicId, { masteryLevel: 'mastered' }).catch(() => {});
        } else {
          await services.study.updateTopic(card.topicId, { masteryLevel: 'learning' }).catch(() => {});
        }
      }
    }

    this.ctx.notify();
    return mapFlashcard(data, data.subjects?.name, data.study_topics?.title);
  };
}
