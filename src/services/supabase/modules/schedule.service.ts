import { IScheduleService } from '../../api.interface';
import {
  ScheduleEntry,
  ScheduleEntryRangeFilter,
  ScheduleEntrySourceKind,
  ScheduleEntryStatus,
  ScheduleUpsertFromSource
} from '../../../types/schedule';
import { mapScheduleEntry } from '../supabaseMappers';
import { getISODateString } from '../../../utils/date';
import { SupabaseServiceContext } from './types';

/**
 * V2 Phase 1 (C3) — Supabase implementation of the canonical schedule model.
 * All writes flow through upsertFromSource (provenance-anchored) or explicit
 * status updates; ad-hoc edits bypassing provenance are deliberately absent.
 */
export class SupabaseScheduleService implements IScheduleService {
  constructor(private ctx: SupabaseServiceContext) {}

  getEntries = async (filter?: ScheduleEntryRangeFilter): Promise<ScheduleEntry[]> => {
    const userId = await this.ctx.getUserId();
    let query = this.ctx.client
      .from('schedule_entries')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true })
      .order('start_hour', { ascending: true, nullsFirst: false });

    if (filter?.from) query = query.gte('date', filter.from);
    if (filter?.to) query = query.lte('date', filter.to);

    const { data, error } = await query;
    if (error) throw error;
    return (data || []).map((row: any) => mapScheduleEntry(row));
  };

  getEntriesForDate = async (date: string): Promise<ScheduleEntry[]> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('schedule_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('start_hour', { ascending: true, nullsFirst: false });

    if (error) throw error;
    return (data || []).map((row: any) => mapScheduleEntry(row));
  };

  getEntryBySource = async (
    sourceKind: ScheduleEntrySourceKind,
    sourceId: string,
    date?: string
  ): Promise<ScheduleEntry | null> => {
    const userId = await this.ctx.getUserId();
    let query = this.ctx.client
      .from('schedule_entries')
      .select('*')
      .eq('user_id', userId)
      .eq('source_kind', sourceKind)
      .eq('source_id', sourceId)
      .limit(1);

    if (date) query = query.eq('date', date);

    const { data, error } = await query;
    if (error) throw error;
    const row = (data || [])[0];
    return row ? mapScheduleEntry(row) : null;
  };

  upsertFromSource = async (entry: ScheduleUpsertFromSource): Promise<ScheduleEntry> => {
    const userId = await this.ctx.getUserId();

    const existing = await this.getEntryBySource(entry.sourceKind, entry.sourceId, entry.date);

    const payload: Record<string, unknown> = {
      user_id: userId,
      entry_type: entry.entryType,
      source_kind: entry.sourceKind,
      source_id: entry.sourceId,
      title: entry.title,
      date: entry.date,
      start_hour: entry.startHour ?? null,
      duration_minutes: entry.durationMinutes,
      status: entry.status || 'planned',
      actual_minutes: entry.actualMinutes ?? 0,
      provenance: entry.provenance || null,
      recurrence_rule: entry.recurrenceRule ?? null,
      updated_at: new Date().toISOString()
    };

    if (existing) {
      const { data, error } = await this.ctx.client
        .from('schedule_entries')
        .update(payload)
        .eq('id', existing.id)
        .eq('user_id', userId)
        .select()
        .single();
      if (error) throw error;
      this.ctx.notify();
      return mapScheduleEntry(data);
    }

    const { data, error } = await this.ctx.client
      .from('schedule_entries')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    this.ctx.notify();
    return mapScheduleEntry(data);
  };

  updateEntry = async (id: string, updates: Partial<ScheduleEntry>): Promise<ScheduleEntry> => {
    const userId = await this.ctx.getUserId();
    const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) payload.title = updates.title;
    if (updates.startHour !== undefined) payload.start_hour = updates.startHour;
    if (updates.durationMinutes !== undefined) payload.duration_minutes = updates.durationMinutes;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.actualMinutes !== undefined) payload.actual_minutes = updates.actualMinutes;
    if (updates.entryType !== undefined) payload.entry_type = updates.entryType;
    if (updates.provenance !== undefined) payload.provenance = updates.provenance;

    const { data, error } = await this.ctx.client
      .from('schedule_entries')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    this.ctx.notify();
    return mapScheduleEntry(data);
  };

  setStatus = async (
    id: string,
    status: ScheduleEntryStatus,
    actualMinutes?: number
  ): Promise<ScheduleEntry> => {
    return this.updateEntry(id, { status, ...(actualMinutes !== undefined ? { actualMinutes } : {}) });
  };

  deleteBySource = async (
    sourceKind: ScheduleEntrySourceKind,
    sourceId: string
  ): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('schedule_entries')
      .delete()
      .eq('user_id', userId)
      .eq('source_kind', sourceKind)
      .eq('source_id', sourceId)
      .select('id');
    if (error) throw error;
    if ((data || []).length > 0) this.ctx.notify();
    return (data || []).length > 0;
  };

  /**
   * Idempotent one-time migration (P1-03): projects every incomplete task and
   * every study-plan item into the model. Re-runs are safe — upsertFromSource
   * updates existing entries instead of duplicating them.
   */
  backfillFromSources = async (): Promise<{ created: number; skipped: number }> => {
    const services = this.ctx.getServices();
    const before = await this.countEntries();

    const today = getISODateString(new Date());
    const tasks = await services.tasks.getTasks();
    for (const task of tasks) {
      if (task.status === 'completed' || task.status === 'archived') continue;
      await this.upsertFromSource({
        sourceKind: 'task',
        sourceId: task.id,
        title: task.title,
        date: task.dueDate || today,
        durationMinutes: task.estimatedMinutes || 30,
        entryType: 'flexible',
        status: task.status === 'in_progress' ? 'in_progress' : 'planned',
        provenance: { priority: task.priority, category: task.category }
      });
    }

    const planItems = await services.study.getTodayPlan();
    for (const item of planItems) {
      await this.upsertFromSource({
        sourceKind: 'study_plan_item',
        sourceId: item.id,
        title: item.title,
        date: item.scheduledDate || today,
        durationMinutes: item.targetMinutes || 45,
        entryType: 'defended',
        status: item.completed ? 'done' : 'planned',
        actualMinutes: item.actualMinutesLogged || 0,
        provenance: { subjectId: item.subjectId, subjectName: item.subjectName, priority: item.priority }
      });
    }

    const after = await this.countEntries();
    const created = Math.max(0, after - before);
    return { created, skipped: tasks.length + planItems.length - created };
  };

  private countEntries = async (): Promise<number> => {
    const userId = await this.ctx.getUserId();
    const { count, error } = await this.ctx.client
      .from('schedule_entries')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId);
    if (error) throw error;
    return count || 0;
  };
}
