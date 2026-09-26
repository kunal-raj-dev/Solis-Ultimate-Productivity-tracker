import { ITaskService } from '../../api.interface';
import { Task, TaskFilterOptions, SubTask, TaskTimeBlock, TimeBlockReviewPayload } from '../../../types/task';
import { mapTask, mapSubtask, mapTaskTimeBlock } from '../supabaseMappers';

import { isToday, isFuture, isPast, getISODateString } from '../../../utils/date';
import { validateTaskInput, validateTimeBlockInput, ValidationError } from '../../../utils/validation';
import { spawnNextRecurringOccurrence } from '../../../utils/tasks/recurrenceEngine';
import { queryCache } from '../../cache';
import { SupabaseServiceContext } from './types';

export class SupabaseTaskService implements ITaskService {
  constructor(private ctx: SupabaseServiceContext) {}

  getTasks = async (filter?: TaskFilterOptions): Promise<Task[]> => {
    const cacheKey = `tasks:${JSON.stringify(filter || {})}`;
    const cached = queryCache.get<Task[]>(cacheKey);
    if (cached) return cached;

    const userId = await this.ctx.getUserId();

    let query = this.ctx.client
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
      } else if (filter.timeFilter === 'unscheduled') {
        result = result.filter((t) => (!t.dueDate || t.dueDate === '') && t.status !== 'completed');
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
  };

  getTaskById = async (id: string): Promise<Task | null> => {
    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('tasks')
      .select(`*, subtasks (*)`)
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error || !data) return null;
    return mapTask(data, data.subtasks || []);
  };

  createTask = async (task: Partial<Task>): Promise<Task> => {
    const validation = validateTaskInput(task);
    if (!validation.success) {
      throw new ValidationError(validation.error, validation.field);
    }

    const userId = await this.ctx.getUserId();

    const basePayload: any = {
      user_id: userId,
      subject_id: task.subjectId || null,
      plan_item_id: task.planItemId || null,
      title: task.title!.trim(),
      description: task.description ? task.description.trim() : null,
      status: task.status || 'todo',
      priority: task.priority || 'medium',
      category: task.category || 'study',
      due_date: task.dueDate || null,
      due_time: task.dueTime || null,
      estimated_minutes: task.estimatedMinutes || 30,
      tags: task.tags || []
    };

    let { data, error } = await this.ctx.client
      .from('tasks')
      .insert({
        ...basePayload,
        recurrence: task.recurrence || null,
        is_recurring: Boolean(task.isRecurring || task.recurrence),
        natural_language_input: task.naturalLanguageInput || null
      })
      .select()
      .single();

    if (error && (error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('column'))) {
      const retryResult = await this.ctx.client
        .from('tasks')
        .insert(basePayload)
        .select()
        .single();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error || !data) throw error || new Error('Failed to create task');

    this.ctx.notify();
    return mapTask(data, []);
  };

  updateTask = async (id: string, updates: Partial<Task>): Promise<Task> => {
    if (updates.title !== undefined) {
      const validation = validateTaskInput(updates);
      if (!validation.success) {
        throw new ValidationError(validation.error, validation.field);
      }
    }

    const userId = await this.ctx.getUserId();
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
    if (updates.completedMinutes !== undefined) payload.completed_minutes = updates.completedMinutes;
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId || null;
    if (updates.planItemId !== undefined) payload.plan_item_id = updates.planItemId || null;
    if (updates.recurrence !== undefined) payload.recurrence = updates.recurrence;
    if (updates.isRecurring !== undefined) payload.is_recurring = updates.isRecurring;
    // Plan §3.3: Zeigarnik "→ Tomorrow" deferral counter.
    if (updates.deferralCount !== undefined) payload.deferral_count = updates.deferralCount;

    let { data, error } = await this.ctx.client
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`*, subtasks (*)`)
      .single();

    if (error && (error.code === 'PGRST204' || error.message?.includes('schema cache') || error.message?.includes('column'))) {
      delete payload.recurrence;
      delete payload.is_recurring;
      delete payload.natural_language_input;
      delete payload.deferral_count;
      const retryResult = await this.ctx.client
        .from('tasks')
        .update(payload)
        .eq('id', id)
        .eq('user_id', userId)
        .select(`*, subtasks (*)`)
        .single();
      data = retryResult.data;
      error = retryResult.error;
    }

    if (error || !data) throw error || new Error(`Task ${id} update failed`);

    // Bidirectional sync with linked study plan item and time blocks
    if (updates.status !== undefined) {
      const isDone = updates.status === 'completed';
      if (data.plan_item_id) {
        try {
          await this.ctx.client
            .from('study_plan_items')
            .update({ completed: isDone })
            .eq('id', data.plan_item_id)
            .eq('user_id', userId);
        } catch {}
      }
      try {
        await this.ctx.client
          .from('task_time_blocks')
          .update({
            status: isDone ? 'completed' : 'planned',
            progress_percent: isDone ? 100 : 0
          })
          .eq('task_id', id)
          .eq('user_id', userId);
      } catch {}
    }

    this.ctx.notify();
    return mapTask(data, data.subtasks || []);
  };

  deleteTask = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('tasks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };

  toggleTaskCompletion = async (id: string): Promise<Task> => {
    const task = await this.getTaskById(id);
    if (!task) throw new Error(`Task ${id} not found`);

    const newStatus = task.status === 'completed' ? 'todo' : 'completed';
    const updated = await this.updateTask(id, { status: newStatus });

    // When completing a recurring task, spawn next occurrence
    if (newStatus === 'completed' && updated.isRecurring && updated.recurrence) {
      const nextOccurrence = spawnNextRecurringOccurrence(updated);
      if (nextOccurrence) {
        try {
          await this.createTask(nextOccurrence);
        } catch (err) {
          console.error('Failed to spawn next recurring occurrence in Supabase:', err);
        }
      }
    }

    return updated;
  };

  addSubTask = async (taskId: string, title: string): Promise<SubTask> => {
    if (!title || !title.trim()) {
      throw new ValidationError('Subtask title is required.', 'title');
    }

    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
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

    this.ctx.notify();
    return mapSubtask(data);
  };

  toggleSubTask = async (taskId: string, subTaskId: string): Promise<Task> => {
    const userId = await this.ctx.getUserId();
    const { data: sub, error: subErr } = await this.ctx.client
      .from('subtasks')
      .select('*')
      .eq('id', subTaskId)
      .eq('user_id', userId)
      .single();

    if (subErr || !sub) throw subErr || new Error('Subtask not found');

    const nextCompleted = !sub.completed;
    await this.ctx.client
      .from('subtasks')
      .update({ completed: nextCompleted })
      .eq('id', subTaskId)
      .eq('user_id', userId);

    const { data: allSubs } = await this.ctx.client
      .from('subtasks')
      .select('*')
      .eq('task_id', taskId)
      .eq('user_id', userId);

    const subList = allSubs || [];
    const allDone = subList.length > 0 && subList.every((s) => s.completed);

    if (allDone) {
      await this.ctx.client
        .from('tasks')
        .update({ status: 'completed', completed_at: new Date().toISOString() })
        .eq('id', taskId)
        .eq('user_id', userId);
    }

    this.ctx.notify();
    const task = await this.getTaskById(taskId);
    return task!;
  };

  deleteSubTask = async (taskId: string, subTaskId: string): Promise<Task> => {
    const userId = await this.ctx.getUserId();
    await this.ctx.client
      .from('subtasks')
      .delete()
      .eq('id', subTaskId)
      .eq('user_id', userId);

    this.ctx.notify();
    const task = await this.getTaskById(taskId);
    return task!;
  };

  editSubTask = async (taskId: string, subTaskId: string, title: string): Promise<Task> => {
    if (!title || !title.trim()) {
      throw new ValidationError('Subtask title cannot be empty.', 'title');
    }

    const userId = await this.ctx.getUserId();
    await this.ctx.client
      .from('subtasks')
      .update({ title: title.trim() })
      .eq('id', subTaskId)
      .eq('user_id', userId);

    this.ctx.notify();
    const task = await this.getTaskById(taskId);
    return task!;
  };

  // 24-Hour Time-Blocking Engine
  getTimeBlocks = async (date: string): Promise<TaskTimeBlock[]> => {
    const userId = await this.ctx.getUserId();
    const cacheKey = `time_blocks:${userId}:${date}`;
    const cached = queryCache.get<TaskTimeBlock[]>(cacheKey);
    if (cached) return cached;

    const { data, error } = await this.ctx.client
      .from('task_time_blocks')
      .select('*')
      .eq('user_id', userId)
      .eq('date', date)
      .order('start_hour', { ascending: true })
      .order('start_minute', { ascending: true });

    if (error) {
      // In local dev if table doesn't exist yet, return empty list gracefully
      console.warn('Could not query task_time_blocks from Supabase:', error.message);
      return [];
    }

    const blocks = (data || []).map(mapTaskTimeBlock);
    queryCache.set(cacheKey, blocks);
    return blocks;
  };

  createTimeBlock = async (block: Partial<TaskTimeBlock>): Promise<TaskTimeBlock> => {
    if (!block.taskTitle || !block.taskTitle.trim()) {
      throw new ValidationError('Task title is required for a time block.', 'taskTitle');
    }

    const validation = validateTimeBlockInput(block);
    if (!validation.success) {
      throw new ValidationError(validation.error, validation.field);
    }

    const userId = await this.ctx.getUserId();
    const payload = {
      user_id: userId,
      task_id: block.taskId || null,
      task_title: block.taskTitle.trim(),
      description: block.description?.trim() || null,
      date: block.date || getISODateString(new Date()),
      start_hour: typeof block.startHour === 'number' ? block.startHour : 9,
      start_minute: block.startMinute ?? 0,
      duration_minutes: block.durationMinutes || 60,
      subject_id: block.subjectId || null,
      goal_id: block.goalId || null,
      priority: block.priority || 'medium',
      status: block.status || 'planned',
      actual_minutes: block.actualMinutes ?? 0,
      progress_percent: block.progressPercent ?? 0,
      reflection: block.reflection || null,
      blocker: block.blocker || null,
      next_action: block.nextAction || null
    };

    const { data, error } = await this.ctx.client
      .from('task_time_blocks')
      .insert(payload)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error('Failed to create task time block');
    }

    this.ctx.notify();
    queryCache.invalidatePrefix('supabase:timeblocks:');
    return mapTaskTimeBlock(data);
  };

  updateTimeBlock = async (id: string, updates: Partial<TaskTimeBlock>): Promise<TaskTimeBlock> => {
    const userId = await this.ctx.getUserId();
    const payload: Record<string, any> = {
      updated_at: new Date().toISOString()
    };

    if (updates.taskTitle !== undefined) payload.task_title = updates.taskTitle.trim();
    if (updates.description !== undefined) payload.description = updates.description?.trim() || null;
    if (updates.date !== undefined) payload.date = updates.date;
    if (updates.startHour !== undefined) payload.start_hour = updates.startHour;
    if (updates.startMinute !== undefined) payload.start_minute = updates.startMinute;
    if (updates.durationMinutes !== undefined) payload.duration_minutes = updates.durationMinutes;
    if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId || null;
    if (updates.goalId !== undefined) payload.goal_id = updates.goalId || null;
    if (updates.priority !== undefined) payload.priority = updates.priority;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.actualMinutes !== undefined) payload.actual_minutes = updates.actualMinutes;
    if (updates.progressPercent !== undefined) payload.progress_percent = updates.progressPercent;
    if (updates.reflection !== undefined) payload.reflection = updates.reflection || null;
    if (updates.blocker !== undefined) payload.blocker = updates.blocker || null;
    if (updates.nextAction !== undefined) payload.next_action = updates.nextAction || null;

    const { data, error } = await this.ctx.client
      .from('task_time_blocks')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) {
      throw error || new Error(`Failed to update task time block ${id}`);
    }

    // Synchronize parent task status if linked
    const mapped = mapTaskTimeBlock(data);
    if (mapped.taskId && mapped.status) {
      try {
        if (mapped.status === 'completed') {
          await this.updateTask(mapped.taskId, { status: 'completed' });
        } else if (mapped.status === 'partial') {
          await this.updateTask(mapped.taskId, { status: 'partial' });
        } else if (mapped.status === 'missed') {
          await this.updateTask(mapped.taskId, { status: 'missed' });
        } else if (mapped.status === 'planned') {
          await this.updateTask(mapped.taskId, { status: 'todo' });
        }
      } catch (err) {
        console.warn('Could not sync linked task status:', err);
      }
    }

    this.ctx.notify();
    queryCache.invalidatePrefix('supabase:timeblocks:');
    return mapped;
  };

  deleteTimeBlock = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('task_time_blocks')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    queryCache.invalidatePrefix('supabase:timeblocks:');
    return true;
  };

  reviewTimeBlock = async (
    id: string,
    review: TimeBlockReviewPayload
  ): Promise<{ updatedBlock: TaskTimeBlock; rescheduledBlock?: TaskTimeBlock }> => {
    const updated = await this.updateTimeBlock(id, {
      status: review.status,
      progressPercent: review.progressPercent,
      actualMinutes: review.actualMinutes,
      reflection: review.reflection,
      blocker: review.blocker,
      nextAction: review.nextAction
    });

    let rescheduledBlock: TaskTimeBlock | undefined;
    if (review.rescheduleToHour !== undefined) {
      const targetDate = review.rescheduleToDate || updated.date;
      rescheduledBlock = await this.createTimeBlock({
        taskId: updated.taskId,
        taskTitle: review.nextAction ? `${updated.taskTitle} (Next: ${review.nextAction})` : updated.taskTitle,
        description: updated.description,
        date: targetDate,
        startHour: review.rescheduleToHour,
        startMinute: 0,
        durationMinutes: updated.durationMinutes,
        subjectId: updated.subjectId,
        goalId: updated.goalId,
        priority: updated.priority,
        status: 'planned',
        progressPercent: 0,
        actualMinutes: 0
      });
    }

    return { updatedBlock: updated, rescheduledBlock };
  };

  rescheduleTimeBlock = async (id: string, newDate: string, newHour: number): Promise<TaskTimeBlock> => {
    return this.updateTimeBlock(id, {
      date: newDate,
      startHour: newHour,
      status: 'planned'
    });
  };
}

