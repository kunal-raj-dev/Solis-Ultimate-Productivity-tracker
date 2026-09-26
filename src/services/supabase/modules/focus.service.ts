import { IFocusService } from '../../api.interface';
import { FocusSession } from '../../../types/focus';
import { mapFocusSession } from '../supabaseMappers';
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
    const insertPayload: Record<string, any> = {
      user_id: userId,
      mode: session.mode || 'pomodoro',
      duration_minutes: session.durationMinutes || 25,
      break_duration_minutes: session.breakDurationMinutes || null,
      task_id: session.taskId || null,
      subject_id: session.subjectId || null,
      plan_item_id: session.planItemId || null,
      topic: session.topic?.trim() || null,
      title: session.title || 'Deep Focus Pod Session',
      completed: session.completed ?? true,
      interruptions_count: session.interruptionsCount || 0,
      flow_quality: session.flowQuality || null,
      soundscape_type: session.soundscapeType || null,
      target_outcome: session.targetOutcome?.trim() || null,
      notes: session.notes?.trim() || null,
      parked_thoughts: session.parkedThoughts || [],
      // Plan §5.1: pre-session energy calibration (migration 20260926_phase5_learning_intelligence).
      pre_session_energy: session.preSessionEnergy || null
    };

    let payload: Record<string, any> = insertPayload;
    let { data, error } = await this.ctx.client
      .from('focus_sessions')
      .insert(payload)
      .select()
      .single();

    // Pre-Phase-1 schemas without task_id degrade gracefully (task_id is the
    // only column stripped — PGRST204 messages always name the missing column).
    if (error && error.message?.includes('task_id')) {
      const { task_id: _omittedTaskId, ...fallbackPayload } = payload;
      payload = fallbackPayload;
      const retry = await this.ctx.client
        .from('focus_sessions')
        .insert(payload)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    // Older schemas without the Phase 5 energy column degrade gracefully while
    // keeping every other field — including the task link (P5F5).
    if (error && error.message?.includes('pre_session_energy')) {
      const { pre_session_energy: _omittedEnergy, ...fallbackPayload } = payload;
      payload = fallbackPayload;
      const retry = await this.ctx.client
        .from('focus_sessions')
        .insert(payload)
        .select()
        .single();
      data = retry.data;
      error = retry.error;
    }

    if (error || !data) throw error || new Error('Failed to save focus session');

    this.ctx.notify();
    const mapped = mapFocusSession(data, session.subjectName);
    return {
      ...mapped,
      taskId: mapped.taskId || session.taskId || undefined
    };
  };

  getTodayFocusMinutes = async (): Promise<number> => {
    const userId = await this.ctx.getUserId();
    // Local-midnight instant (master.md §16.2, P5F12): the absolute UTC instant
    // of the user's local 00:00 — not a UTC-midnight string built from the
    // local date key, which excludes early-morning sessions in UTC+ zones.
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const { data, error } = await this.ctx.client
      .from('focus_sessions')
      .select('duration_minutes, created_at, completed')
      .eq('user_id', userId)
      .eq('completed', true)
      .gte('created_at', startOfToday.toISOString());

    if (error) throw error;
    return (data || []).reduce((acc: number, curr: any) => acc + (curr.duration_minutes || 0), 0);
  };
}
