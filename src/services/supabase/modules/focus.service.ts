import { IFocusService } from '../../api.interface';
import { FocusSession } from '../../../types/focus';
import { mapFocusSession } from '../supabaseMappers';
import { getISODateString } from '../../../utils/date';
import { queryCache } from '../../cache';
import { SupabaseServiceContext } from './types';

export class SupabaseFocusService implements IFocusService {
  constructor(private ctx: SupabaseServiceContext) {}

  getRecentSessions = async (): Promise<FocusSession[]> => {
    const cacheKey = 'focus_sessions_recent';
    const cached = queryCache.get<FocusSession[]>(cacheKey);
    if (cached) return cached;

    const userId = await this.ctx.getUserId();
    const [focusRes, subjectsRes] = await Promise.all([
      this.ctx.client
        .from('focus_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      this.ctx.client.from('subjects').select('id, name').eq('user_id', userId)
    ]);

    if (focusRes.error) throw focusRes.error;
    const subjectsMap = new Map((subjectsRes.data || []).map((s: any) => [s.id, s.name]));

    const result = (focusRes.data || []).map((row: any) => {
      const resolvedName = subjectsMap.get(row.subject_id);
      return mapFocusSession(row, resolvedName);
    });

    queryCache.set(cacheKey, result);
    return result;
  };

  saveFocusSession = async (session: Partial<FocusSession>): Promise<FocusSession> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('focus_sessions')
      .insert({
        user_id: userId,
        mode: session.mode || 'pomodoro',
        duration_minutes: session.durationMinutes || 25,
        break_duration_minutes: session.breakDurationMinutes || null,
        subject_id: session.subjectId || null,
        plan_item_id: session.planItemId || null,
        topic: session.topic?.trim() || null,
        title: session.title || 'Deep Focus Pod Session',
        completed: session.completed ?? true,
        interruptions_count: session.interruptionsCount || 0,
        notes: session.notes?.trim() || null
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to save focus session');

    this.ctx.notify();
    return mapFocusSession(data, session.subjectName);
  };

  getTodayFocusMinutes = async (): Promise<number> => {
    const userId = await this.ctx.getUserId();
    const todayStr = getISODateString(new Date());

    const { data, error } = await this.ctx.client
      .from('focus_sessions')
      .select('duration_minutes, created_at, completed')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('created_at', `${todayStr}T00:00:00.000Z`);

    if (error) throw error;
    return (data || []).reduce((acc: number, curr: any) => acc + (curr.duration_minutes || 0), 0);
  };
}
