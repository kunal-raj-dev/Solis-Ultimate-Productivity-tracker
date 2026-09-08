import { IReflectionService } from '../../api.interface';
import { DailyReflection } from '../../../types/reflection';
import { mapReflection } from '../supabaseMappers';
import { getISODateString } from '../../../utils/date';
import { SupabaseServiceContext } from './types';

export class SupabaseReflectionService implements IReflectionService {
  constructor(private ctx: SupabaseServiceContext) {}

  getReflections = async (limit = 30): Promise<DailyReflection[]> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('daily_reflections')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false })
      .limit(limit);

    if (error) {
      if (error.code === '42P01') return [];
      throw error;
    }

    return (data || []).map(mapReflection);
  };

  getReflectionByDate = async (date: string): Promise<DailyReflection | null> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('daily_reflections')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }

    return mapReflection(data);
  };

  saveDailyReflection = async (reflectionData: Partial<DailyReflection>): Promise<DailyReflection> => {
    const userId = await this.ctx.getUserId();
    const dateStr = reflectionData.date || getISODateString(new Date());

    const payload = {
      user_id: userId,
      date: dateStr,
      energy_score: reflectionData.energyScore ?? 4,
      focus_score: reflectionData.focusScore ?? 4,
      wins: Array.isArray(reflectionData.wins) ? reflectionData.wins : [],
      friction_points: Array.isArray(reflectionData.frictionPoints) ? reflectionData.frictionPoints : [],
      tomorrow_intentions: Array.isArray(reflectionData.tomorrowIntentions) ? reflectionData.tomorrowIntentions : [],
      synthesis_notes: reflectionData.synthesisNotes?.trim() || null,
      completed_habits_count: reflectionData.completedHabitsCount ?? 0,
      completed_tasks_count: reflectionData.completedTasksCount ?? 0,
      study_minutes_logged: reflectionData.studyMinutesLogged ?? 0,
      review_cards_completed: reflectionData.reviewCardsCompleted ?? 0,
      updated_at: new Date().toISOString()
    };

    const { data, error } = await this.ctx.client
      .from('daily_reflections')
      .upsert(payload, { onConflict: 'user_id,date' })
      .select()
      .single();

    if (error) throw error;
    this.ctx.notify();
    return mapReflection(data);
  };

  deleteReflection = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('daily_reflections')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };
}
