import { ITaskService } from '../../api.interface';
import { Task, TaskFilterOptions, SubTask } from '../../../types/task';
import { mapTask, mapSubtask } from '../supabaseMappers';
import { isToday, isFuture, isPast, getISODateString } from '../../../utils/date';
import { validateTaskInput, ValidationError } from '../../../utils/validation';
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

    const { data, error } = await this.ctx.client
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
    if (updates.tags !== undefined) payload.tags = updates.tags;
    if (updates.subjectId !== undefined) payload.subject_id = updates.subjectId || null;
    if (updates.planItemId !== undefined) payload.plan_item_id = updates.planItemId || null;

    const { data, error } = await this.ctx.client
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select(`*, subtasks (*)`)
      .single();

    if (error || !data) throw error || new Error(`Task ${id} update failed`);

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
    return this.updateTask(id, { status: newStatus });
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

    const task = await this.getTaskById(taskId);
    this.ctx.notify();
    return task!;
  };

  deleteSubTask = async (taskId: string, subTaskId: string): Promise<Task> => {
    const userId = await this.ctx.getUserId();
    await this.ctx.client
      .from('subtasks')
      .delete()
      .eq('id', subTaskId)
      .eq('user_id', userId);

    const task = await this.getTaskById(taskId);
    this.ctx.notify();
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

    const task = await this.getTaskById(taskId);
    this.ctx.notify();
    return task!;
  };
}
