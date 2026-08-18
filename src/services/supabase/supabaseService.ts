import {
  IDataService,
  IAuthService,
  ITaskService,
  IStudyService,
  INoteService,
  IFocusService,
  IHabitService,
  IGoalService,
  IAnalyticsService,
  IFlashcardService,
  IReviewService,
  IRoutineService,
  IResourceService,
  IReflectionService
} from '../api.interface';
import { supabase } from './supabaseClient';
import {
  mapProfile,
  mapTask,
  mapSubtask,
  mapSubject,
  mapTopic,
  mapStudySession,
  mapStudyPlanItem,
  mapNote,
  mapFocusSession,
  mapHabit,
  mapGoal,
  mapMilestone,
  mapFlashcard,
  mapReviewItem,
  mapRoutine,
  mapResource,
  mapReflection
} from './supabaseMappers';
import { Task, TaskFilterOptions, SubTask } from '../../types/task';
import { StudySubject, StudySession, StudyPlanItem, StudyTopic } from '../../types/study';
import { Note, NoteFilterOptions } from '../../types/note';
import { FocusSession } from '../../types/focus';
import { Habit } from '../../types/habit';
import { Goal, GoalMilestone } from '../../types/goal';
import { Flashcard, CardRating, ReviewQueueItem } from '../../types/learning';
import { RecurringStudyRoutine } from '../../types/planning';
import { StudyResource, ResourceFilterOptions } from '../../types/resource';
import { DailyReflection } from '../../types/reflection';
import { DailySummary, ProductivityMetric, DayStudyHeatmap } from '../../types/analytics';
import { UserProfile, LoginCredentials, SignupCredentials, AuthSession } from '../../types/auth';
import { getISODateString, isThisWeek, isToday, isFuture, isPast } from '../../utils/date';
import { calculateDailySummary } from '../../utils/productivity';
import {
  validateTaskInput,
  validateStudySessionInput,
  validateHabitInput,
  validateGoalInput,
  ValidationError
} from '../../utils/validation';
import { validateNoteInput, normalizeTag, normalizeTagList, filterNotes } from '../../utils/notes';
import { validateStudyPlanInput } from '../../utils/study';
import { calculateNextCardReview } from '../../utils/learning/spacedRepetition';
import { evaluateRoutinesForDate } from '../../utils/planning/timeBlocking';
import { queryCache } from '../cache';

export class SupabaseDataService implements IDataService {
  private listeners: Set<() => void> = new Set();

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    // Invalidate client-side query cache on any mutation
    queryCache.invalidate();
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error in Solis repository listener:', err);
      }
    }
  }

  private async getRequiredUserId(): Promise<string> {
    // Fast path: retrieve local session user ID without HTTP roundtrip
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user?.id) {
      return session.user.id;
    }

    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) {
      throw new Error('Unauthorized: No active authenticated Supabase session.');
    }
    return user.id;
  }

  /* ==========================================================================
     1. AUTH SERVICE IMPLEMENTATION
     ========================================================================== */
  auth: IAuthService = {
    getCurrentUser: async (): Promise<UserProfile | null> => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) return null;

      const { data: profile, error: profileErr } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileErr || !profile) {
        return {
          id: user.id,
          name: user.user_metadata?.name || 'Solis Scholar',
          email: user.email || '',
          focusField: user.user_metadata?.focus_field || 'Systems Architecture & Computational Design',
          createdAt: user.created_at,
          updatedAt: user.created_at,
          preferences: {
            theme: 'light',
            soundEnabled: true,
            defaultFocusDurationMinutes: 25,
            defaultBreakDurationMinutes: 5,
            dailyStudyGoalMinutes: 180,
            dailyTasksGoalCount: 5,
            focusGradientTheme: 'momentum'
          }
        };
      }

      return mapProfile(profile);
    },

    login: async (credentials: LoginCredentials): Promise<AuthSession> => {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password || ''
      });

      if (error) throw error;
      if (!data.user || !data.session) {
        throw new Error('No active session returned after login.');
      }

      const currentUser = await this.auth.getCurrentUser();
      if (!currentUser) {
        throw new Error('Failed to retrieve user profile after login.');
      }

      this.notify();
      return {
        token: data.session.access_token,
        user: currentUser,
        expiresAt: new Date(data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 86400000).toISOString()
      };
    },

    signup: async (credentials: SignupCredentials): Promise<AuthSession> => {
      const { data, error } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password || '',
        options: {
          data: {
            name: credentials.name,
            focus_field: credentials.focusField
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('Failed to create account.');

      if (!data.session) {
        const unconfirmedErr = new Error(
          'Account created! Please check your email to confirm your account before signing in (or disable "Confirm email" in Supabase Authentication settings for instant signups).'
        );
        (unconfirmedErr as any).code = 'email_confirmation_required';
        throw unconfirmedErr;
      }

      // Upsert profile in case trigger had delay
      await supabase.from('profiles').upsert({
        id: data.user.id,
        name: credentials.name,
        email: credentials.email,
        focus_field: credentials.focusField || 'Systems Architecture & Computational Design'
      });

      const currentUser = await this.auth.getCurrentUser();
      this.notify();

      return {
        token: data.session.access_token,
        user: currentUser || {
          id: data.user.id,
          name: credentials.name,
          email: credentials.email,
          focusField: credentials.focusField || 'Systems Architecture & Computational Design',
          preferences: {
            theme: 'light',
            soundEnabled: true,
            defaultFocusDurationMinutes: 25,
            defaultBreakDurationMinutes: 5,
            dailyStudyGoalMinutes: 180,
            dailyTasksGoalCount: 5,
            focusGradientTheme: 'momentum'
          },
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        expiresAt: new Date(data.session.expires_at ? data.session.expires_at * 1000 : Date.now() + 86400000 * 7).toISOString()
      };
    },

    logout: async (): Promise<void> => {
      await supabase.auth.signOut();
      this.notify();
    }
  };

  /* ==========================================================================
     2. TASK SERVICE IMPLEMENTATION
     ========================================================================== */
  tasks: ITaskService = {
    getTasks: async (filter?: TaskFilterOptions): Promise<Task[]> => {
      const cacheKey = `tasks:${JSON.stringify(filter || {})}`;
      const cached = queryCache.get<Task[]>(cacheKey);
      if (cached) return cached;

      const userId = await this.getRequiredUserId();

      let query = supabase
        .from('tasks')
        .select(`*, subtasks (*)`)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filter?.status && filter.status !== 'all') {
        query = query.eq('status', filter.status);
      }
      if (filter?.priority && filter.priority !== 'all') {
        query = query.eq('priority', filter.priority);
      }
      if (filter?.category && filter.category !== 'all') {
        query = query.eq('category', filter.category);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data || []).map((row: any) => mapTask(row, row.subtasks || []));

      if (filter?.timeFilter && filter.timeFilter !== 'all') {
        if (filter.timeFilter === 'today') {
          result = result.filter((t) => isToday(t.dueDate));
        } else if (filter.timeFilter === 'upcoming') {
          result = result.filter((t) => isFuture(t.dueDate) && t.status !== 'completed');
        } else if (filter.timeFilter === 'overdue') {
          result = result.filter((t) => isPast(t.dueDate) && t.status !== 'completed');
        } else if (filter.timeFilter === 'completed') {
          result = result.filter((t) => t.status === 'completed');
        }
      }

      if (filter?.search && filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        result = result.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }

      queryCache.set(cacheKey, result);
      return result;
    },

    getTaskById: async (id: string): Promise<Task | null> => {
      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
        .from('tasks')
        .select(`*, subtasks (*)`)
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;
      return mapTask(data, data.subtasks || []);
    },

    createTask: async (task: Partial<Task>): Promise<Task> => {
      const validation = validateTaskInput(task);
      if (!validation.success) {
        throw new ValidationError(validation.error, validation.field);
      }

      const userId = await this.getRequiredUserId();

      const { data, error } = await supabase
        .from('tasks')
        .insert({
          user_id: userId,
          subject_id: task.subjectId || null,
          plan_item_id: task.planItemId || null,
          title: task.title!.trim(),
          description: task.description ? task.description.trim() : null,
          status: task.status || 'todo',
          priority: task.priority || 'medium',
          category: task.category || 'study',
          due_date: task.dueDate || getISODateString(new Date()),
          due_time: task.dueTime || null,
          estimated_minutes: task.estimatedMinutes || 30,
          tags: task.tags || []
        })
        .select()
        .single();

      if (error || !data) throw error || new Error('Failed to create task');

      this.notify();
      return mapTask(data, []);
    },

    updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
      if (updates.title !== undefined) {
        const validation = validateTaskInput(updates);
        if (!validation.success) {
          throw new ValidationError(validation.error, validation.field);
        }
      }

      const userId = await this.getRequiredUserId();
      const payload: any = { updated_at: new Date().toISOString() };

      if (updates.title !== undefined) payload.title = updates.title.trim();
      if (updates.description !== undefined) payload.description = updates.description.trim();
      if (updates.status !== undefined) {
        payload.status = updates.status;
        payload.completed_at = updates.status === 'completed' ? new Date().toISOString() : null;
      }
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.dueDate !== undefined) payload.due_date = updates.dueDate;
      if (updates.dueTime !== undefined) payload.due_time = updates.dueTime;
      if (updates.estimatedMinutes !== undefined) payload.estimated_minutes = updates.estimatedMinutes;
      if (updates.tags !== undefined) payload.tags = updates.tags;
      if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId || null;
      if (updates.planItemId !== undefined) payload.plan_item_id = updates.planItemId || null;

      const { data, error } = await supabase
        .from('tasks')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select(`*, subtasks (*)`)
        .single();

      if (error || !data) throw error || new Error(`Task ${id} update failed`);

      this.notify();
      return mapTask(data, data.subtasks || []);
    },

    deleteTask: async (id: string): Promise<boolean> => {
      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('tasks')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      this.notify();
      return true;
    },

    toggleTaskCompletion: async (id: string): Promise<Task> => {
      const task = await this.tasks.getTaskById(id);
      if (!task) throw new Error(`Task ${id} not found`);

      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      return this.tasks.updateTask(id, { status: newStatus });
    },

    addSubTask: async (taskId: string, title: string): Promise<SubTask> => {
      if (!title || !title.trim()) {
        throw new ValidationError('Subtask title is required.', 'title');
      }

      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
        .from('subtasks')
        .insert({
          task_id: taskId,
          user_id: userId,
          title: title.trim(),
          completed: false
        })
        .select()
        .single();

      if (error || !data) throw error || new Error('Failed to create subtask');

      this.notify();
      return mapSubtask(data);
    },

    toggleSubTask: async (taskId: string, subTaskId: string): Promise<Task> => {
      const userId = await this.getRequiredUserId();
      const { data: sub, error: subErr } = await supabase
        .from('subtasks')
        .select('*')
        .eq('id', subTaskId)
        .eq('user_id', userId)
        .single();

      if (subErr || !sub) throw subErr || new Error('Subtask not found');

      const nextCompleted = !sub.completed;
      await supabase
        .from('subtasks')
        .update({ completed: nextCompleted })
        .eq('id', subTaskId)
        .eq('user_id', userId);

      const { data: allSubs } = await supabase
        .from('subtasks')
        .select('*')
        .eq('task_id', taskId)
        .eq('user_id', userId);

      const subList = allSubs || [];
      const allDone = subList.length > 0 && subList.every((s) => s.completed);

      if (allDone) {
        await supabase
          .from('tasks')
          .update({ status: 'completed', completed_at: new Date().toISOString() })
          .eq('id', taskId)
          .eq('user_id', userId);
      }

      const task = await this.tasks.getTaskById(taskId);
      this.notify();
      return task!;
    },

    deleteSubTask: async (taskId: string, subTaskId: string): Promise<Task> => {
      const userId = await this.getRequiredUserId();
      await supabase
        .from('subtasks')
        .delete()
        .eq('id', subTaskId)
        .eq('user_id', userId);

      const task = await this.tasks.getTaskById(taskId);
      this.notify();
      return task!;
    },

    editSubTask: async (taskId: string, subTaskId: string, title: string): Promise<Task> => {
      if (!title || !title.trim()) {
        throw new ValidationError('Subtask title cannot be empty.', 'title');
      }

      const userId = await this.getRequiredUserId();
      await supabase
        .from('subtasks')
        .update({ title: title.trim() })
        .eq('id', subTaskId)
        .eq('user_id', userId);

      const task = await this.tasks.getTaskById(taskId);
      this.notify();
      return task!;
    }
  };

  /* ==========================================================================
     3. STUDY SERVICE IMPLEMENTATION (Topics, Plans, Sessions, Pure Progress)
     ========================================================================== */
  study: IStudyService = {
    getSubjects: async (includeArchived = false): Promise<StudySubject[]> => {
      const cacheKey = `subjects:${includeArchived}`;
      const cached = queryCache.get<StudySubject[]>(cacheKey);
      if (cached) return cached;

      const userId = await this.getRequiredUserId();

      let query = supabase.from('subjects').select('*').eq('user_id', userId);
      if (!includeArchived) {
        query = query.neq('status', 'archived');
      }

      const [subjectsRes, sessionsRes, notesRes] = await Promise.all([
        query.order('created_at', { ascending: true }),
        supabase.from('study_sessions').select('subject_id, duration_minutes, completed_at').eq('user_id', userId),
        supabase.from('notes').select('subject_id').eq('user_id', userId)
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
    },

    getSubjectById: async (id: string): Promise<StudySubject | null> => {
      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
        .from('subjects')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;
      return mapSubject(data);
    },

    createSubject: async (subject: Partial<StudySubject>): Promise<StudySubject> => {
      if (!subject.name || !subject.name.trim()) {
        throw new ValidationError('Subject name is required.', 'name');
      }

      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
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

      this.notify();
      return mapSubject(data, 0, 0);
    },

    updateSubject: async (id: string, updates: Partial<StudySubject>): Promise<StudySubject> => {
      const userId = await this.getRequiredUserId();
      const payload: any = { updated_at: new Date().toISOString() };

      if (updates.name !== undefined) payload.name = updates.name.trim();
      if (updates.code !== undefined) payload.code = updates.code.trim();
      if (updates.description !== undefined) payload.description = updates.description.trim();
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.targetHoursPerWeek !== undefined) payload.target_hours_per_week = updates.targetHoursPerWeek;
      if (updates.status !== undefined) payload.status = updates.status;

      const { data, error } = await supabase
        .from('subjects')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !data) throw error || new Error('Failed to update subject');

      this.notify();
      return mapSubject(data);
    },

    archiveSubject: async (id: string): Promise<StudySubject> => {
      return this.study.updateSubject(id, { status: 'archived' });
    },

    restoreSubject: async (id: string): Promise<StudySubject> => {
      return this.study.updateSubject(id, { status: 'active' });
    },

    deleteSubject: async (id: string): Promise<boolean> => {
      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('subjects')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      this.notify();
      return true;
    },

    // Study Topics
    getTopics: async (subjectId: string): Promise<StudyTopic[]> => {
      const cacheKey = `topics:${subjectId}`;
      const cached = queryCache.get<StudyTopic[]>(cacheKey);
      if (cached) return cached;

      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
        .from('study_topics')
        .select('*')
        .eq('subject_id', subjectId)
        .eq('user_id', userId)
        .order('order_index', { ascending: true });

      if (error) throw error;
      const result = (data || []).map(mapTopic);
      queryCache.set(cacheKey, result);
      return result;
    },

    createTopic: async (topic: Partial<StudyTopic>): Promise<StudyTopic> => {
      if (!topic.title || !topic.title.trim()) {
        throw new ValidationError('Topic title is required.', 'title');
      }
      if (!topic.subjectId) {
        throw new ValidationError('Subject ID is required for topic.', 'subjectId');
      }

      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
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

      this.notify();
      return mapTopic(data);
    },

    updateTopic: async (id: string, updates: Partial<StudyTopic>): Promise<StudyTopic> => {
      const userId = await this.getRequiredUserId();
      const payload: any = {};
      if (updates.title !== undefined) payload.title = updates.title.trim();
      if (updates.description !== undefined) payload.description = updates.description.trim();
      if (updates.orderIndex !== undefined) payload.order_index = updates.orderIndex;
      if (updates.masteryLevel !== undefined) payload.mastery_level = updates.masteryLevel;

      const { data, error } = await supabase
        .from('study_topics')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !data) throw error || new Error('Failed to update topic');

      this.notify();
      return mapTopic(data);
    },

    deleteTopic: async (id: string): Promise<boolean> => {
      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('study_topics')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      this.notify();
      return true;
    },

    // Study Sessions
    getRecentSessions: async (): Promise<StudySession[]> => {
      const cacheKey = 'study_sessions_recent';
      const cached = queryCache.get<StudySession[]>(cacheKey);
      if (cached) return cached;

      const userId = await this.getRequiredUserId();
      const [sessionsRes, subjectsRes] = await Promise.all([
        supabase
          .from('study_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('completed_at', { ascending: false }),
        supabase.from('subjects').select('id, name').eq('user_id', userId)
      ]);

      if (sessionsRes.error) throw sessionsRes.error;
      const subjectsMap = new Map((subjectsRes.data || []).map((s: any) => [s.id, s.name]));

      const result = (sessionsRes.data || []).map((row: any) => {
        const resolvedName = subjectsMap.get(row.subject_id) || row.subject_name || 'General Study';
        return mapStudySession(row, resolvedName);
      });

      queryCache.set(cacheKey, result);
      return result;
    },

    logSession: async (session: Partial<StudySession>): Promise<StudySession> => {
      const validation = validateStudySessionInput(session);
      if (!validation.success) {
        throw new ValidationError(validation.error, validation.field);
      }

      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
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

      this.notify();
      return mapStudySession(data, session.subjectName);
    },

    deleteSession: async (id: string): Promise<boolean> => {
      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('study_sessions')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      this.notify();
      return true;
    },

    // Study Plan
    getTodayPlan: async (): Promise<StudyPlanItem[]> => {
      const cacheKey = 'study_plan_today';
      const cached = queryCache.get<StudyPlanItem[]>(cacheKey);
      if (cached) return cached;

      const userId = await this.getRequiredUserId();
      const [planRes, subjectsRes, sessionsRes] = await Promise.all([
        supabase
          .from('study_plan_items')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: true }),
        supabase.from('subjects').select('id, name').eq('user_id', userId),
        supabase.from('study_sessions').select('plan_item_id, duration_minutes').eq('user_id', userId)
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
    },

    createPlanItem: async (item: Partial<StudyPlanItem>): Promise<StudyPlanItem> => {
      validateStudyPlanInput(item);
      const userId = await this.getRequiredUserId();

      const { data, error } = await supabase
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

      this.notify();
      return mapStudyPlanItem(data, item.subjectName, 0);
    },

    updatePlanItem: async (id: string, updates: Partial<StudyPlanItem>): Promise<StudyPlanItem> => {
      const userId = await this.getRequiredUserId();
      const payload: any = {};

      if (updates.title !== undefined) payload.title = updates.title.trim();
      if (updates.targetMinutes !== undefined) payload.target_minutes = updates.targetMinutes;
      if (updates.scheduledDate !== undefined) payload.scheduled_date = updates.scheduledDate;
      if (updates.scheduledTime !== undefined) payload.scheduled_time = updates.scheduledTime;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.completed !== undefined) payload.completed = updates.completed;
      if (updates.notes !== undefined) payload.notes = updates.notes?.trim() || null;
      if (updates.linkedTaskId !== undefined) payload.linked_task_id = updates.linkedTaskId || null;

      const { data, error } = await supabase
        .from('study_plan_items')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !data) throw error || new Error('Failed to update plan item');

      this.notify();
      return mapStudyPlanItem(data, updates.subjectName);
    },

    togglePlanItem: async (id: string): Promise<StudyPlanItem> => {
      const userId = await this.getRequiredUserId();
      const { data: item, error: fetchErr } = await supabase
        .from('study_plan_items')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (fetchErr || !item) throw fetchErr || new Error('Plan item not found');

      const nextCompleted = !item.completed;
      return this.study.updatePlanItem(id, { completed: nextCompleted });
    },

    deletePlanItem: async (id: string): Promise<boolean> => {
      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('study_plan_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      this.notify();
      return true;
    }
  };

  /* ==========================================================================
     4. NOTE SERVICE IMPLEMENTATION (Persistent Workspace, Search, Tags)
     ========================================================================== */
  notes: INoteService = {
    getNotes: async (filter?: NoteFilterOptions): Promise<Note[]> => {
      const cacheKey = `notes:${JSON.stringify(filter || {})}`;
      const cached = queryCache.get<Note[]>(cacheKey);
      if (cached) return cached;

      const userId = await this.getRequiredUserId();
      const [notesRes, subjectsRes] = await Promise.all([
        supabase
          .from('notes')
          .select('*')
          .eq('user_id', userId)
          .order('updated_at', { ascending: false }),
        supabase.from('subjects').select('id, name').eq('user_id', userId)
      ]);

      if (notesRes.error) throw notesRes.error;
      const subjectsMap = new Map((subjectsRes.data || []).map((s: any) => [s.id, s.name]));

      const notes = (notesRes.data || []).map((row: any) => {
        const resolvedSubjectName = subjectsMap.get(row.subject_id);
        return mapNote(row, resolvedSubjectName);
      });

      const result = filterNotes(notes, filter);
      queryCache.set(cacheKey, result);
      return result;
    },

    getNoteById: async (id: string): Promise<Note | null> => {
      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
        .from('notes')
        .select('*')
        .eq('id', id)
        .eq('user_id', userId)
        .single();

      if (error || !data) return null;

      let subjectName: string | undefined;
      if (data.subject_id) {
        const { data: sub } = await supabase
          .from('subjects')
          .select('name')
          .eq('id', data.subject_id)
          .single();
        subjectName = sub?.name;
      }

      return mapNote(data, subjectName);
    },

    createNote: async (note: Partial<Note>): Promise<Note> => {
      validateNoteInput(note);
      const userId = await this.getRequiredUserId();
      const cleanTags = normalizeTagList(note.tags || []);

      const { data, error } = await supabase
        .from('notes')
        .insert({
          user_id: userId,
          subject_id: note.subjectId || null,
          plan_item_id: note.planItemId || null,
          study_session_id: note.studySessionId || null,
          title: note.title!.trim(),
          content: note.content || '',
          category: note.category || 'concept',
          tags: cleanTags
        })
        .select()
        .single();

      if (error || !data) throw error || new Error('Failed to create note');

      this.notify();
      return mapNote(data, note.subjectName);
    },

    updateNote: async (id: string, updates: Partial<Note>): Promise<Note> => {
      if (updates.title !== undefined) {
        validateNoteInput(updates);
      }

      const userId = await this.getRequiredUserId();
      const payload: any = { updated_at: new Date().toISOString() };

      if (updates.title !== undefined) payload.title = updates.title.trim();
      if (updates.content !== undefined) payload.content = updates.content;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId || null;
      if (updates.planItemId !== undefined) payload.plan_item_id = updates.planItemId || null;
      if (updates.studySessionId !== undefined) payload.study_session_id = updates.studySessionId || null;
      if (updates.tags !== undefined) payload.tags = normalizeTagList(updates.tags);

      const { data, error } = await supabase
        .from('notes')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !data) throw error || new Error('Failed to update note');

      this.notify();
      return mapNote(data, updates.subjectName);
    },

    deleteNote: async (id: string): Promise<boolean> => {
      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('notes')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      this.notify();
      return true;
    },

    getAllTags: async (): Promise<string[]> => {
      const notes = await this.notes.getNotes();
      const tagSet = new Set<string>();
      for (const note of notes) {
        for (const tag of note.tags) {
          const norm = normalizeTag(tag);
          if (norm) tagSet.add(norm);
        }
      }
      return Array.from(tagSet).sort();
    }
  };

  /* ==========================================================================
     5. FOCUS SERVICE IMPLEMENTATION (Carries Study Context)
     ========================================================================== */
  focus: IFocusService = {
    getRecentSessions: async (): Promise<FocusSession[]> => {
      const cacheKey = 'focus_sessions_recent';
      const cached = queryCache.get<FocusSession[]>(cacheKey);
      if (cached) return cached;

      const userId = await this.getRequiredUserId();
      const [focusRes, subjectsRes] = await Promise.all([
        supabase
          .from('focus_sessions')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase.from('subjects').select('id, name').eq('user_id', userId)
      ]);

      if (focusRes.error) throw focusRes.error;
      const subjectsMap = new Map((subjectsRes.data || []).map((s: any) => [s.id, s.name]));

      const result = (focusRes.data || []).map((row: any) => {
        const resolvedName = subjectsMap.get(row.subject_id);
        return mapFocusSession(row, resolvedName);
      });

      queryCache.set(cacheKey, result);
      return result;
    },

    saveFocusSession: async (session: Partial<FocusSession>): Promise<FocusSession> => {
      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
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

      this.notify();
      return mapFocusSession(data, session.subjectName);
    },

    getTodayFocusMinutes: async (): Promise<number> => {
      const userId = await this.getRequiredUserId();
      const todayStr = getISODateString(new Date());

      const { data, error } = await supabase
        .from('focus_sessions')
        .select('duration_minutes, created_at, completed')
        .eq('user_id', userId)
        .eq('completed', true)
        .gte('created_at', `${todayStr}T00:00:00.000Z`);

      if (error) throw error;
      return (data || []).reduce((acc: number, curr: any) => acc + (curr.duration_minutes || 0), 0);
    }
  };

  /* ==========================================================================
     6. HABIT SERVICE IMPLEMENTATION
     ========================================================================== */
  habits: IHabitService = {
    getHabits: async (): Promise<Habit[]> => {
      const cacheKey = 'habits_all';
      const cached = queryCache.get<Habit[]>(cacheKey);
      if (cached) return cached;

      const userId = await this.getRequiredUserId();
      const [habitsRes, recordsRes] = await Promise.all([
        supabase.from('habits').select('*, goals (id, title)').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('habit_records').select('*').eq('user_id', userId)
      ]);

      if (habitsRes.error) throw habitsRes.error;
      const records = recordsRes.data || [];

      const result = (habitsRes.data || []).map((h: any) => {
        const history: Record<string, boolean> = {};
        for (const rec of records) {
          if (rec.habit_id === h.id) {
            history[rec.completion_date] = rec.completed;
          }
        }
        return mapHabit(h, history, h.goals?.title);
      });

      queryCache.set(cacheKey, result);
      return result;
    },

    createHabit: async (habit: Partial<Habit>): Promise<Habit> => {
      const validation = validateHabitInput(habit);
      if (!validation.success) {
        throw new ValidationError(validation.error, validation.field);
      }

      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
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
        .select('*, goals (id, title)')
        .single();

      if (error || !data) throw error || new Error('Failed to create habit');

      this.notify();
      return mapHabit(data, {}, data.goals?.title);
    },

    updateHabit: async (id: string, updates: Partial<Habit>): Promise<Habit> => {
      const userId = await this.getRequiredUserId();
      const payload: any = { updated_at: new Date().toISOString() };

      if (updates.title !== undefined) payload.title = updates.title.trim();
      if (updates.description !== undefined) payload.description = updates.description.trim();
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.frequency !== undefined) payload.frequency = updates.frequency;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.goalId !== undefined) payload.goal_id = updates.goalId || null;

      const { data, error } = await supabase
        .from('habits')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select('*, goals (id, title)')
        .single();

      if (error || !data) throw error || new Error('Failed to update habit');

      const all = await this.habits.getHabits();
      this.notify();
      return all.find((h) => h.id === id)!;
    },

    deleteHabit: async (id: string): Promise<boolean> => {
      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('habits')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      this.notify();
      return true;
    },

    toggleHabitToday: async (id: string): Promise<Habit> => {
      const todayStr = getISODateString(new Date());
      return this.habits.toggleHabitDate(id, todayStr);
    },

    toggleHabitDate: async (id: string, dateStr: string): Promise<Habit> => {
      const userId = await this.getRequiredUserId();

      const { data: existing } = await supabase
        .from('habit_records')
        .select('*')
        .eq('habit_id', id)
        .eq('completion_date', dateStr)
        .eq('user_id', userId)
        .maybeSingle();

      if (existing) {
        if (existing.completed) {
          await supabase
            .from('habit_records')
            .delete()
            .eq('id', existing.id)
            .eq('user_id', userId);
        } else {
          await supabase
            .from('habit_records')
            .update({ completed: true })
            .eq('id', existing.id)
            .eq('user_id', userId);
        }
      } else {
        await supabase
          .from('habit_records')
          .insert({
            habit_id: id,
            user_id: userId,
            completion_date: dateStr,
            completed: true
          });
      }

      const all = await this.habits.getHabits();
      this.notify();
      return all.find((h) => h.id === id)!;
    }
  };

  /* ==========================================================================
     7. GOAL SERVICE IMPLEMENTATION
     ========================================================================== */
  goals: IGoalService = {
    getGoals: async (): Promise<Goal[]> => {
      const cacheKey = 'goals_all';
      const cached = queryCache.get<Goal[]>(cacheKey);
      if (cached) return cached;

      const userId = await this.getRequiredUserId();
      const [goalsRes, milestonesRes, subjectsRes] = await Promise.all([
        supabase.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('goal_milestones').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
        supabase.from('subjects').select('id, name').eq('user_id', userId)
      ]);

      if (goalsRes.error) throw goalsRes.error;
      const milestones = milestonesRes.data || [];
      const subjectsMap = new Map((subjectsRes.data || []).map((s: any) => [s.id, s.name]));

      const result = (goalsRes.data || []).map((g: any) => {
        const goalMilestones = milestones
          .filter((m: any) => m.goal_id === g.id)
          .map(mapMilestone);
        const resolvedSubjectName = subjectsMap.get(g.subject_id);
        return mapGoal(g, goalMilestones, resolvedSubjectName);
      });

      queryCache.set(cacheKey, result);
      return result;
    },

    createGoal: async (goal: Partial<Goal>): Promise<Goal> => {
      const validation = validateGoalInput(goal);
      if (!validation.success) {
        throw new ValidationError(validation.error, validation.field);
      }

      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
        .from('goals')
        .insert({
          user_id: userId,
          subject_id: goal.subjectId || null,
          title: goal.title!.trim(),
          description: goal.description?.trim() || null,
          horizon: goal.horizon || 'medium_term',
          status: goal.status || 'active',
          category: goal.category || 'academic',
          target_date: goal.targetDate || getISODateString(new Date()),
          priority: goal.priority || 'high',
          color: goal.color || 'coral'
        })
        .select()
        .single();

      if (error || !data) throw error || new Error('Failed to create goal');

      this.notify();
      return mapGoal(data, [], goal.subjectName);
    },

    updateGoal: async (id: string, updates: Partial<Goal>): Promise<Goal> => {
      const userId = await this.getRequiredUserId();
      const payload: any = { updated_at: new Date().toISOString() };

      if (updates.title !== undefined) payload.title = updates.title.trim();
      if (updates.description !== undefined) payload.description = updates.description.trim();
      if (updates.horizon !== undefined) payload.horizon = updates.horizon;
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.category !== undefined) payload.category = updates.category;
      if (updates.targetDate !== undefined) payload.target_date = updates.targetDate;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.color !== undefined) payload.color = updates.color;
      if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId || null;

      const { data, error } = await supabase
        .from('goals')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !data) throw error || new Error('Failed to update goal');

      const all = await this.goals.getGoals();
      this.notify();
      return all.find((g) => g.id === id)!;
    },

    deleteGoal: async (id: string): Promise<boolean> => {
      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      this.notify();
      return true;
    },

    addMilestone: async (goalId: string, milestone: Partial<GoalMilestone>): Promise<Goal> => {
      if (!milestone.title || !milestone.title.trim()) {
        throw new ValidationError('Milestone title is required.', 'title');
      }

      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('goal_milestones')
        .insert({
          goal_id: goalId,
          user_id: userId,
          title: milestone.title.trim(),
          target_date: milestone.targetDate || null,
          completed: false
        });

      if (error) throw error;

      const all = await this.goals.getGoals();
      this.notify();
      return all.find((g) => g.id === goalId)!;
    },

    toggleMilestone: async (goalId: string, milestoneId: string): Promise<Goal> => {
      const userId = await this.getRequiredUserId();
      const { data: mil } = await supabase
        .from('goal_milestones')
        .select('*')
        .eq('id', milestoneId)
        .eq('user_id', userId)
        .single();

      if (!mil) throw new Error('Milestone not found');

      const nextCompleted = !mil.completed;
      await supabase
        .from('goal_milestones')
        .update({
          completed: nextCompleted,
          completed_at: nextCompleted ? new Date().toISOString() : null
        })
        .eq('id', milestoneId)
        .eq('user_id', userId);

      const all = await this.goals.getGoals();
      const goal = all.find((g) => g.id === goalId)!;

      if (goal.progressPercentage === 100 && goal.status !== 'completed') {
        await this.goals.updateGoal(goalId, { status: 'completed' });
      } else if (goal.progressPercentage < 100 && goal.status === 'completed') {
        await this.goals.updateGoal(goalId, { status: 'active' });
      }

      this.notify();
      return goal;
    },

    deleteMilestone: async (goalId: string, milestoneId: string): Promise<Goal> => {
      const userId = await this.getRequiredUserId();
      await supabase
        .from('goal_milestones')
        .delete()
        .eq('id', milestoneId)
        .eq('user_id', userId);

      const all = await this.goals.getGoals();
      this.notify();
      return all.find((g) => g.id === goalId)!;
    }
  };

  /* ==========================================================================
     8. ANALYTICS SERVICE IMPLEMENTATION (Deterministic Momentum Score)
     ========================================================================== */
  analytics: IAnalyticsService = {
    getDailySummary: async (): Promise<DailySummary> => {
      const cacheKey = 'daily_summary';
      const cached = queryCache.get<DailySummary>(cacheKey);
      if (cached) return cached;

      const [tasks, studySessions, focusSessions, habits, user] = await Promise.all([
        this.tasks.getTasks(),
        this.study.getRecentSessions(),
        this.focus.getRecentSessions(),
        this.habits.getHabits(),
        this.auth.getCurrentUser()
      ]);

      const { summary } = calculateDailySummary({
        tasks,
        studySessions,
        focusSessions,
        habits,
        dailyStudyGoalMinutes: user?.preferences?.dailyStudyGoalMinutes || 180,
        targetFocusMinutes: 120
      });

      queryCache.set(cacheKey, summary);
      return summary;
    },

    getProductivityMetrics: async (): Promise<ProductivityMetric[]> => {
      const summary = await this.analytics.getDailySummary();
      const { breakdown } = calculateDailySummary({
        tasks: [],
        studySessions: [],
        focusSessions: [],
        habits: []
      });

      return [
        { id: 'm1', label: 'Tasks Velocity', value: `${breakdown.taskScore}%`, changePercentage: 12, trend: 'up', timeframe: 'today' },
        { id: 'm2', label: 'Study Volume', value: `${summary.totalStudyMinutes}m`, changePercentage: 25, trend: 'up', timeframe: 'today' },
        { id: 'm3', label: 'Deep Focus Rate', value: `${breakdown.focusScore}%`, changePercentage: 8, trend: 'up', timeframe: 'today' },
        { id: 'm4', label: 'Ritual Consistency', value: `${breakdown.habitScore}%`, changePercentage: 0, trend: 'neutral', timeframe: 'today' }
      ];
    },

    getStudyHeatmap: async (days = 28): Promise<DayStudyHeatmap[]> => {
      const sessions = await this.study.getRecentSessions();
      const heatmap: DayStudyHeatmap[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const dateStr = getISODateString(d);

        const daySessions = sessions.filter((s) => s.completedAt.startsWith(dateStr));
        const totalMinutes = daySessions.reduce((acc, s) => acc + s.durationMinutes, 0);

        let level: 0 | 1 | 2 | 3 | 4 = 0;
        if (totalMinutes > 0 && totalMinutes < 45) level = 1;
        else if (totalMinutes >= 45 && totalMinutes < 90) level = 2;
        else if (totalMinutes >= 90 && totalMinutes < 150) level = 3;
        else if (totalMinutes >= 150) level = 4;

        heatmap.push({
          date: dateStr,
          hours: Math.round((totalMinutes / 60) * 10) / 10,
          level
        });
      }

      return heatmap;
    }
  };

  public flashcards: IFlashcardService = {
    getFlashcards: async (filter?: { subjectId?: string; topicId?: string }): Promise<Flashcard[]> => {
      const userId = await this.getRequiredUserId();
      let query = supabase
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
    },

    getFlashcardById: async (id: string): Promise<Flashcard | null> => {
      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
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
    },

    createFlashcard: async (cardData: Partial<Flashcard>): Promise<Flashcard> => {
      const userId = await this.getRequiredUserId();
      if (!cardData.frontPrompt || !cardData.backAnswer || !cardData.subjectId) {
        throw new ValidationError('Flashcard requires front prompt, back answer, and subject.');
      }

      const { data, error } = await supabase
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
      this.notify();
      return mapFlashcard(data, data.subjects?.name, data.study_topics?.title);
    },

    updateFlashcard: async (id: string, updates: Partial<Flashcard>): Promise<Flashcard> => {
      const userId = await this.getRequiredUserId();
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.frontPrompt !== undefined) payload.front_prompt = updates.frontPrompt;
      if (updates.backAnswer !== undefined) payload.back_answer = updates.backAnswer;
      if (updates.cardType !== undefined) payload.card_type = updates.cardType;
      if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId;
      if (updates.topicId !== undefined) payload.topic_id = updates.topicId;

      const { data, error } = await supabase
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
      this.notify();
      return mapFlashcard(data, data.subjects?.name, data.study_topics?.title);
    },

    deleteFlashcard: async (id: string): Promise<boolean> => {
      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('flashcards')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      this.notify();
      return true;
    },

    recordCardAttempt: async (cardId: string, rating: CardRating): Promise<Flashcard> => {
      const card = await this.flashcards.getFlashcardById(cardId);
      if (!card) throw new ValidationError(`Flashcard "${cardId}" not found.`);

      const userId = await this.getRequiredUserId();
      const nextSchedule = calculateNextCardReview(card, rating);

      const { data, error } = await supabase
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
          if (nextSchedule.repetitionCount >= 3) {
            await this.study.updateTopic(card.topicId, { masteryLevel: 'mastered' }).catch(() => {});
          } else {
            await this.study.updateTopic(card.topicId, { masteryLevel: 'learning' }).catch(() => {});
          }
        }
      }

      this.notify();
      return mapFlashcard(data, data.subjects?.name, data.study_topics?.title);
    }
  };

  public reviews: IReviewService = {
    getDueReviewItems: async (): Promise<ReviewQueueItem[]> => {
      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
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
    },

    createReviewItem: async (item: Partial<ReviewQueueItem>): Promise<ReviewQueueItem> => {
      const userId = await this.getRequiredUserId();
      if (!item.subjectId || !item.topicId || !item.reason) {
        throw new ValidationError('Review queue item requires subject, topic, and reason.');
      }

      const { data, error } = await supabase
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
      this.notify();
      return mapReviewItem(data, data.subjects?.name, data.subjects?.color, data.study_topics?.title);
    },

    completeReviewItem: async (id: string): Promise<boolean> => {
      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('review_queue_items')
        .update({
          completed: true,
          completed_at: new Date().toISOString()
        })
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      this.notify();
      return true;
    },

    deleteReviewItem: async (id: string): Promise<boolean> => {
      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('review_queue_items')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      this.notify();
      return true;
    }
  };

  public routines: IRoutineService = {
    getRoutines: async (): Promise<RecurringStudyRoutine[]> => {
      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
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
    },

    createRoutine: async (routineData: Partial<RecurringStudyRoutine>): Promise<RecurringStudyRoutine> => {
      const userId = await this.getRequiredUserId();
      if (!routineData.title || !routineData.subjectId || !routineData.daysOfWeek?.length) {
        throw new ValidationError('Routine requires title, subject, and at least one day of the week.');
      }

      const { data, error } = await supabase
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
      this.notify();
      return mapRoutine(data, data.subjects?.name, data.study_topics?.title);
    },

    updateRoutine: async (id: string, updates: Partial<RecurringStudyRoutine>): Promise<RecurringStudyRoutine> => {
      const userId = await this.getRequiredUserId();
      const payload: any = { updated_at: new Date().toISOString() };
      if (updates.title !== undefined) payload.title = updates.title.trim();
      if (updates.targetMinutes !== undefined) payload.target_minutes = updates.targetMinutes;
      if (updates.daysOfWeek !== undefined) payload.days_of_week = updates.daysOfWeek;
      if (updates.scheduledTime !== undefined) payload.scheduled_time = updates.scheduledTime;
      if (updates.priority !== undefined) payload.priority = updates.priority;
      if (updates.isActive !== undefined) payload.is_active = updates.isActive;
      if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId;
      if (updates.topicId !== undefined) payload.topic_id = updates.topicId;

      const { data, error } = await supabase
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
      this.notify();
      return mapRoutine(data, data.subjects?.name, data.study_topics?.title);
    },

    deleteRoutine: async (id: string): Promise<boolean> => {
      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('study_routines')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      this.notify();
      return true;
    },

    materializeRoutinesForToday: async (): Promise<StudyPlanItem[]> => {
      const allRoutines = await this.routines.getRoutines();
      const today = new Date();
      const todayStr = getISODateString(today);
      const activeForToday = evaluateRoutinesForDate(allRoutines, today);
      const todayPlan = await this.study.getTodayPlan();
      const addedItems: StudyPlanItem[] = [];

      for (const routine of activeForToday) {
        const exists = todayPlan.some(
          (p) => (p.scheduledDate === todayStr || !p.scheduledDate) && p.title === routine.title
        );

        if (!exists) {
          const created = await this.study.createPlanItem({
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

      if (addedItems.length > 0) this.notify();
      return addedItems;
    }
  };

  public resources: IResourceService = {
    getResources: async (filter?: ResourceFilterOptions): Promise<StudyResource[]> => {
      const userId = await this.getRequiredUserId();
      let query = supabase
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
    },

    getResourceById: async (id: string): Promise<StudyResource | null> => {
      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
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
    },

    createResource: async (resourceData: Partial<StudyResource>): Promise<StudyResource> => {
      const userId = await this.getRequiredUserId();
      if (!resourceData.title || !resourceData.subjectId) {
        throw new ValidationError('Resource requires a title and associated study subject.');
      }

      const { data, error } = await supabase
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
      this.notify();
      return mapResource(data, data.subjects?.name, data.study_topics?.title);
    },

    updateResource: async (id: string, updates: Partial<StudyResource>): Promise<StudyResource> => {
      const userId = await this.getRequiredUserId();
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

      const { data, error } = await supabase
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
      this.notify();
      return mapResource(data, data.subjects?.name, data.study_topics?.title);
    },

    deleteResource: async (id: string): Promise<boolean> => {
      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('study_resources')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      this.notify();
      return true;
    }
  };

  public reflections: IReflectionService = {
    getReflections: async (limit = 30): Promise<DailyReflection[]> => {
      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
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
    },

    getReflectionByDate: async (date: string): Promise<DailyReflection | null> => {
      const userId = await this.getRequiredUserId();
      const { data, error } = await supabase
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
    },

    saveDailyReflection: async (reflectionData: Partial<DailyReflection>): Promise<DailyReflection> => {
      const userId = await this.getRequiredUserId();
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

      const { data, error } = await supabase
        .from('daily_reflections')
        .upsert(payload, { onConflict: 'user_id,date' })
        .select()
        .single();

      if (error) throw error;
      this.notify();
      return mapReflection(data);
    },

    deleteReflection: async (id: string): Promise<boolean> => {
      const userId = await this.getRequiredUserId();
      const { error } = await supabase
        .from('daily_reflections')
        .delete()
        .eq('id', id)
        .eq('user_id', userId);

      if (error) throw error;
      this.notify();
      return true;
    }
  };
}
