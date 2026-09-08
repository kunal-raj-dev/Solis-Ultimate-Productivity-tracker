import { IRoutineService } from '../../api.interface';
import { StudyPlanItem } from '../../../types/study';
import { RecurringStudyRoutine } from '../../../types/planning';
import { mapRoutine } from '../supabaseMappers';
import { getISODateString } from '../../../utils/date';
import { ValidationError } from '../../../utils/validation';
import { evaluateRoutinesForDate } from '../../../utils/planning/timeBlocking';
import { SupabaseServiceContext } from './types';

export class SupabaseRoutineService implements IRoutineService {
  constructor(private ctx: SupabaseServiceContext) {}

  getRoutines = async (): Promise<RecurringStudyRoutine[]> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('study_routines')
      .select(`
        *,
        subjects (id, name),
        study_topics (id, title)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: true });

    if (error) {
      if (error.code === '42P01') return [];
      throw error;
    }

    return (data || []).map((row) =>
      mapRoutine(row, row.subjects?.name, row.study_topics?.title)
    );
  };

  createRoutine = async (routineData: Partial<RecurringStudyRoutine>): Promise<RecurringStudyRoutine> => {
    const userId = await this.ctx.getUserId();
    if (!routineData.title || !routineData.subjectId || !routineData.daysOfWeek?.length) {
      throw new ValidationError('Routine requires title, subject, and at least one day of the week.');
    }

    const { data, error } = await this.ctx.client
      .from('study_routines')
      .insert({
        user_id: userId,
        subject_id: routineData.subjectId,
        topic_id: routineData.topicId || null,
        title: routineData.title.trim(),
        target_minutes: routineData.targetMinutes || 45,
        days_of_week: routineData.daysOfWeek,
        scheduled_time: routineData.scheduledTime || '14:00',
        priority: routineData.priority || 'medium',
        is_active: routineData.isActive !== false
      })
      .select(`
        *,
        subjects (id, name),
        study_topics (id, title)
      `)
      .single();

    if (error) throw error;
    this.ctx.notify();
    return mapRoutine(data, data.subjects?.name, data.study_topics?.title);
  };

  updateRoutine = async (id: string, updates: Partial<RecurringStudyRoutine>): Promise<RecurringStudyRoutine> => {
    const userId = await this.ctx.getUserId();
    const payload: any = { updated_at: new Date().toISOString() };
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.targetMinutes !== undefined) payload.target_minutes = updates.targetMinutes;
    if (updates.daysOfWeek !== undefined) payload.days_of_week = updates.daysOfWeek;
    if (updates.scheduledTime !== undefined) payload.scheduled_time = updates.scheduledTime;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.isActive !== undefined) payload.is_active = updates.isActive;
    if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId;
    if (updates.topicId !== undefined) payload.topic_id = updates.topicId;

    const { data, error } = await this.ctx.client
      .from('study_routines')
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
    return mapRoutine(data, data.subjects?.name, data.study_topics?.title);
  };

  deleteRoutine = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('study_routines')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };

  materializeRoutinesForToday = async (): Promise<StudyPlanItem[]> => {
    const allRoutines = await this.getRoutines();
    const today = new Date();
    const todayStr = getISODateString(today);
    const activeForToday = evaluateRoutinesForDate(allRoutines, today);
    const services = this.ctx.getServices();
    const todayPlan = await services.study.getTodayPlan();
    const addedItems: StudyPlanItem[] = [];

    for (const routine of activeForToday) {
      const exists = todayPlan.some(
        (p) => (p.scheduledDate === todayStr || !p.scheduledDate) && p.title === routine.title
      );

      if (!exists) {
        const created = await services.study.createPlanItem({
          subjectId: routine.subjectId,
          topicId: routine.topicId,
          title: routine.title,
          targetMinutes: routine.targetMinutes,
          scheduledDate: todayStr,
          scheduledTime: routine.scheduledTime,
          priority: routine.priority,
          completed: false
        });
        addedItems.push(created);
      }
    }

    if (addedItems.length > 0) this.ctx.notify();
    return addedItems;
  };
}
