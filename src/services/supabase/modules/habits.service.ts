import { IHabitService } from '../../api.interface';
import { Habit } from '../../../types/habit';
import { mapHabit } from '../supabaseMappers';
import { getISODateString } from '../../../utils/date';
import { validateHabitInput, ValidationError } from '../../../utils/validation';
import { queryCache } from '../../cache';
import { SupabaseServiceContext } from './types';

export class SupabaseHabitService implements IHabitService {
  constructor(private ctx: SupabaseServiceContext) {}

  getHabits = async (): Promise<Habit[]> => {
    const cacheKey = 'habits_all';
    const cached = queryCache.get<Habit[]>(cacheKey);
    if (cached) return cached;

    const userId = await this.ctx.getUserId();
    const [habitsRes, recordsRes, goalsRes] = await Promise.all([
      this.ctx.client.from('habits').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      this.ctx.client.from('habit_records').select('*').eq('user_id', userId),
      this.ctx.client.from('goals').select('id, title').eq('user_id', userId)
    ]);

    if (habitsRes.error) throw habitsRes.error;
    const records = recordsRes.data || [];
    const goalsMap = new Map((goalsRes.data || []).map((g: any) => [g.id, g.title]));

    const result = (habitsRes.data || []).map((h: any) => {
      const history: Record<string, boolean> = {};
      for (const rec of records) {
        if (rec.habit_id === h.id) {
          history[rec.completion_date] = rec.completed;
        }
      }
      const resolvedGoalTitle = h.goal_id ? goalsMap.get(h.goal_id) : undefined;
      return mapHabit(h, history, resolvedGoalTitle);
    });

    queryCache.set(cacheKey, result);
    return result;
  };

  createHabit = async (habit: Partial<Habit>): Promise<Habit> => {
    const validation = validateHabitInput(habit);
    if (!validation.success) {
      throw new ValidationError(validation.error, validation.field);
    }

    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('habits')
      .insert({
        user_id: userId,
        title: habit.title!.trim(),
        description: habit.description?.trim() || null,
        category: habit.category || 'study',
        frequency: habit.frequency || 'daily',
        color: habit.color || 'coral',
        goal_id: habit.goalId || null
      })
      .select('*')
      .single();

    if (error || !data) throw error || new Error('Failed to create habit');

    this.ctx.notify();
    return mapHabit(data, {}, habit.goalTitle);
  };

  updateHabit = async (id: string, updates: Partial<Habit>): Promise<Habit> => {
    const userId = await this.ctx.getUserId();
    const payload: any = { updated_at: new Date().toISOString() };

    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (updates.category !== undefined) payload.category = updates.category;
    if (updates.frequency !== undefined) payload.frequency = updates.frequency;
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.goalId !== undefined) payload.goal_id = updates.goalId || null;
    // Plan §3.4 "Streak Amnesty": persist excused absence dates (YYYY-MM-DD[]).
    if (updates.amnestyDates !== undefined) payload.amnesty_dates = updates.amnestyDates;

    const { data, error } = await this.ctx.client
      .from('habits')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select('*')
      .single();

    if (error || !data) throw error || new Error('Failed to update habit');

    this.ctx.notify();
    const all = await this.getHabits();
    return all.find((h) => h.id === id)!;
  };

  deleteHabit = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('habits')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };

  toggleHabitToday = async (id: string): Promise<Habit> => {
    const todayStr = getISODateString(new Date());
    return this.toggleHabitDate(id, todayStr);
  };

  toggleHabitDate = async (id: string, dateStr: string): Promise<Habit> => {
    const userId = await this.ctx.getUserId();

    const { data: existing } = await this.ctx.client
      .from('habit_records')
      .select('*')
      .eq('habit_id', id)
      .eq('completion_date', dateStr)
      .eq('user_id', userId)
      .maybeSingle();

    if (existing) {
      if (existing.completed) {
        await this.ctx.client
          .from('habit_records')
          .delete()
          .eq('id', existing.id)
          .eq('user_id', userId);
      } else {
        await this.ctx.client
          .from('habit_records')
          .update({ completed: true })
          .eq('id', existing.id)
          .eq('user_id', userId);
      }
    } else {
      await this.ctx.client
        .from('habit_records')
        .insert({
          habit_id: id,
          user_id: userId,
          completion_date: dateStr,
          completed: true
        });
    }

    this.ctx.notify();
    const all = await this.getHabits();
    return all.find((h) => h.id === id)!;
  };

  importHabitCompletions = async (habitId: string, completionDates: string[]): Promise<Habit> => {
    const userId = await this.ctx.getUserId();
    const dates = Array.from(new Set(completionDates.filter(Boolean)));

    if (dates.length > 0) {
      // Deduplicate against already-recorded dates so re-runs never duplicate.
      const { data: existing } = await this.ctx.client
        .from('habit_records')
        .select('completion_date')
        .eq('habit_id', habitId)
        .eq('user_id', userId);
      const existingDates = new Set((existing || []).map((row: any) => row.completion_date));
      const missing = dates.filter((date) => !existingDates.has(date));

      if (missing.length > 0) {
        const { error } = await this.ctx.client.from('habit_records').insert(
          missing.map((completion_date) => ({
            habit_id: habitId,
            user_id: userId,
            completion_date,
            completed: true
          }))
        );
        if (error) throw error;
      }
    }

    this.ctx.notify();
    const all = await this.getHabits();
    const imported = all.find((h) => h.id === habitId);
    if (!imported) throw new Error(`Habit ${habitId} not found`);
    return imported;
  };
}
