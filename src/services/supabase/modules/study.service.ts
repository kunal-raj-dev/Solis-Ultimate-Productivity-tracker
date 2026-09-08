import { IStudyService } from '../../api.interface';
import { StudySubject, StudySession, StudyPlanItem, StudyTopic } from '../../../types/study';
import { mapSubject, mapTopic, mapStudySession, mapStudyPlanItem } from '../supabaseMappers';
import { isThisWeek, getISODateString } from '../../../utils/date';
import { validateStudySessionInput, ValidationError } from '../../../utils/validation';
import { validateStudyPlanInput } from '../../../utils/study';
import { queryCache } from '../../cache';
import { SupabaseServiceContext } from './types';

export class SupabaseStudyService implements IStudyService {
  constructor(private ctx: SupabaseServiceContext) {}

  getSubjects = async (includeArchived = false): Promise<StudySubject[]> => {
    const cacheKey = `subjects:${includeArchived}`;
    const cached = queryCache.get<StudySubject[]>(cacheKey);
    if (cached) return cached;

    const userId = await this.ctx.getUserId();

    let query = this.ctx.client.from('subjects').select('*').eq('user_id', userId);
    if (!includeArchived) {
      query = query.neq('status', 'archived');
    }

    const [subjectsRes, sessionsRes, notesRes] = await Promise.all([
      query.order('created_at', { ascending: true }),
      this.ctx.client.from('study_sessions').select('subject_id, duration_minutes, completed_at').eq('user_id', userId),
      this.ctx.client.from('notes').select('subject_id').eq('user_id', userId)
    ]);

    if (subjectsRes.error) throw subjectsRes.error;

    const subjects = subjectsRes.data || [];
    const sessions = sessionsRes.data || [];
    const notes = notesRes.data || [];

    const result = subjects.map((sub: any) => {
      const subSessions = sessions.filter(
        (s: any) => s.subject_id === sub.id && isThisWeek(s.completed_at)
      );
      const totalMinutes = subSessions.reduce((acc: number, curr: any) => acc + (curr.duration_minutes || 0), 0);
      const completedHours = Math.round((totalMinutes / 60) * 10) / 10;
      const notesCount = notes.filter((n: any) => n.subject_id === sub.id).length;

      return mapSubject(sub, completedHours, notesCount);
    });

    queryCache.set(cacheKey, result);
    return result;
  };

  getSubjectById = async (id: string): Promise<StudySubject | null> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('subjects')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return mapSubject(data);
  };

  createSubject = async (subject: Partial<StudySubject>): Promise<StudySubject> => {
    if (!subject.name || !subject.name.trim()) {
      throw new ValidationError('Subject name is required.', 'name');
    }

    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('subjects')
      .insert({
        user_id: userId,
        name: subject.name.trim(),
        code: subject.code?.trim() || 'CORE',
        description: subject.description?.trim() || null,
        color: subject.color || 'coral',
        target_hours_per_week: subject.targetHoursPerWeek || 10,
        status: 'active'
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to create subject');

    this.ctx.notify();
    return mapSubject(data, 0, 0);
  };

  updateSubject = async (id: string, updates: Partial<StudySubject>): Promise<StudySubject> => {
    const userId = await this.ctx.getUserId();
    const payload: any = { updated_at: new Date().toISOString() };

    if (updates.name !== undefined) payload.name = updates.name.trim();
    if (updates.code !== undefined) payload.code = updates.code.trim();
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (updates.color !== undefined) payload.color = updates.color;
    if (updates.targetHoursPerWeek !== undefined) payload.target_hours_per_week = updates.targetHoursPerWeek;
    if (updates.status !== undefined) payload.status = updates.status;

    const { data, error } = await this.ctx.client
      .from('subjects')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to update subject');

    this.ctx.notify();
    return mapSubject(data);
  };

  archiveSubject = async (id: string): Promise<StudySubject> => {
    return this.updateSubject(id, { status: 'archived' });
  };

  restoreSubject = async (id: string): Promise<StudySubject> => {
    return this.updateSubject(id, { status: 'active' });
  };

  deleteSubject = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('subjects')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };

  // Study Topics
  getTopics = async (subjectId: string): Promise<StudyTopic[]> => {
    const cacheKey = `topics:${subjectId}`;
    const cached = queryCache.get<StudyTopic[]>(cacheKey);
    if (cached) return cached;

    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('study_topics')
      .select('*')
      .eq('subject_id', subjectId)
      .eq('user_id', userId)
      .order('order_index', { ascending: true });

    if (error) throw error;
    const result = (data || []).map(mapTopic);
    queryCache.set(cacheKey, result);
    return result;
  };

  createTopic = async (topic: Partial<StudyTopic>): Promise<StudyTopic> => {
    if (!topic.title || !topic.title.trim()) {
      throw new ValidationError('Topic title is required.', 'title');
    }
    if (!topic.subjectId) {
      throw new ValidationError('Subject ID is required for topic.', 'subjectId');
    }

    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('study_topics')
      .insert({
        user_id: userId,
        subject_id: topic.subjectId,
        title: topic.title.trim(),
        description: topic.description?.trim() || null,
        order_index: topic.orderIndex ?? 0,
        mastery_level: topic.masteryLevel || 'unstudied'
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to create topic');

    this.ctx.notify();
    return mapTopic(data);
  };

  updateTopic = async (id: string, updates: Partial<StudyTopic>): Promise<StudyTopic> => {
    const userId = await this.ctx.getUserId();
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.description !== undefined) payload.description = updates.description.trim();
    if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex;
    if (updates.masteryLevel !== undefined) payload.mastery_level = updates.masteryLevel;

    const { data, error } = await this.ctx.client
      .from('study_topics')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to update topic');

    this.ctx.notify();
    return mapTopic(data);
  };

  deleteTopic = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('study_topics')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };

  // Study Sessions
  getRecentSessions = async (): Promise<StudySession[]> => {
    const cacheKey = 'study_sessions_recent';
    const cached = queryCache.get<StudySession[]>(cacheKey);
    if (cached) return cached;

    const userId = await this.ctx.getUserId();
    const [sessionsRes, subjectsRes] = await Promise.all([
      this.ctx.client
        .from('study_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false }),
      this.ctx.client.from('subjects').select('id, name').eq('user_id', userId)
    ]);

    if (sessionsRes.error) throw sessionsRes.error;
    const subjectsMap = new Map((subjectsRes.data || []).map((s: any) => [s.id, s.name]));

    const result = (sessionsRes.data || []).map((row: any) => {
      const resolvedName = subjectsMap.get(row.subject_id) || row.subject_name || 'General Study';
      return mapStudySession(row, resolvedName);
    });

    queryCache.set(cacheKey, result);
    return result;
  };

  logSession = async (session: Partial<StudySession>): Promise<StudySession> => {
    const validation = validateStudySessionInput(session);
    if (!validation.success) {
      throw new ValidationError(validation.error, validation.field);
    }

    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('study_sessions')
      .insert({
        user_id: userId,
        subject_id: session.subjectId || null,
        subject_name: session.subjectName?.trim() || 'General Study',
        plan_item_id: session.planItemId || null,
        focus_session_id: session.focusSessionId || null,
        type: session.type || 'deep_study',
        duration_minutes: session.durationMinutes || 45,
        topics_covered: session.topicsCovered || ['Core study block'],
        notes: session.notes?.trim() || null,
        retention_rating: session.retentionRating || 4,
        completed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to log study session');

    this.ctx.notify();
    return mapStudySession(data, session.subjectName);
  };

  deleteSession = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('study_sessions')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };

  // Study Plan
  getTodayPlan = async (): Promise<StudyPlanItem[]> => {
    const cacheKey = 'study_plan_today';
    const cached = queryCache.get<StudyPlanItem[]>(cacheKey);
    if (cached) return cached;

    const userId = await this.ctx.getUserId();
    const [planRes, subjectsRes, sessionsRes] = await Promise.all([
      this.ctx.client
        .from('study_plan_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true }),
      this.ctx.client.from('subjects').select('id, name').eq('user_id', userId),
      this.ctx.client.from('study_sessions').select('plan_item_id, duration_minutes').eq('user_id', userId)
    ]);

    if (planRes.error) throw planRes.error;
    const subjectsMap = new Map((subjectsRes.data || []).map((s: any) => [s.id, s.name]));
    const sessions = sessionsRes.data || [];

    const result = (planRes.data || []).map((row: any) => {
      const resolvedSubject = subjectsMap.get(row.subject_id) || row.subject_name || 'General Study';
      const itemSessions = sessions.filter((s: any) => s.plan_item_id === row.id);
      const actualMinutes = itemSessions.reduce((acc: number, curr: any) => acc + (curr.duration_minutes || 0), 0);
      return mapStudyPlanItem(row, resolvedSubject, actualMinutes);
    });

    queryCache.set(cacheKey, result);
    return result;
  };

  createPlanItem = async (item: Partial<StudyPlanItem>): Promise<StudyPlanItem> => {
    validateStudyPlanInput(item);
    const userId = await this.ctx.getUserId();

    const { data, error } = await this.ctx.client
      .from('study_plan_items')
      .insert({
        user_id: userId,
        subject_id: item.subjectId || null,
        topic_id: item.topicId || null,
        subject_name: item.subjectName || 'General Study',
        title: item.title!.trim(),
        target_minutes: item.targetMinutes || 45,
        scheduled_date: item.scheduledDate || getISODateString(new Date()),
        scheduled_time: item.scheduledTime || '02:00 PM',
        priority: item.priority || 'medium',
        notes: item.notes?.trim() || null,
        linked_task_id: item.linkedTaskId || null,
        completed: false
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to create study plan');

    this.ctx.notify();
    return mapStudyPlanItem(data, item.subjectName, 0);
  };

  updatePlanItem = async (id: string, updates: Partial<StudyPlanItem>): Promise<StudyPlanItem> => {
    const userId = await this.ctx.getUserId();
    const payload: any = {};

    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.targetMinutes !== undefined) payload.target_minutes = updates.targetMinutes;
    if (updates.scheduledDate !== undefined) payload.scheduled_date = updates.scheduledDate;
    if (updates.scheduledTime !== undefined) payload.scheduled_time = updates.scheduledTime;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.completed !== undefined) payload.completed = updates.completed;
    if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;
    if (updates.linkedTaskId !== undefined) payload.linked_task_id = updates.linkedTaskId || null;

    const { data, error } = await this.ctx.client
      .from('study_plan_items')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to update plan item');

    this.ctx.notify();
    return mapStudyPlanItem(data, updates.subjectName);
  };

  togglePlanItem = async (id: string): Promise<StudyPlanItem> => {
    const userId = await this.ctx.getUserId();
    const { data: item, error: fetchErr } = await this.ctx.client
      .from('study_plan_items')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (fetchErr || !item) throw fetchErr || new Error('Plan item not found');

    const nextCompleted = !item.completed;
    return this.updatePlanItem(id, { completed: nextCompleted });
  };

  deletePlanItem = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('study_plan_items')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };
}
