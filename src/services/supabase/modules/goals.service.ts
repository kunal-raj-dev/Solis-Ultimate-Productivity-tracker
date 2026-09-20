import { IGoalService } from '../../api.interface';
import { Goal, GoalMilestone } from '../../../types/goal';
import { mapGoal, mapMilestone } from '../supabaseMappers';
import { getISODateString } from '../../../utils/date';
import { validateGoalInput, ValidationError } from '../../../utils/validation';
import { queryCache } from '../../cache';
import { SupabaseServiceContext } from './types';

export class SupabaseGoalService implements IGoalService {
  constructor(private ctx: SupabaseServiceContext) {}

  getGoals = async (): Promise<Goal[]> => {
    const cacheKey = 'goals_all';
    const cached = queryCache.get<Goal[]>(cacheKey);
    if (cached) return cached;

    const userId = await this.ctx.getUserId();
    const [goalsRes, milestonesRes, subjectsRes] = await Promise.all([
      this.ctx.client.from('goals').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      this.ctx.client.from('goal_milestones').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
      this.ctx.client.from('subjects').select('id, name').eq('user_id', userId)
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
  };

  createGoal = async (goal: Partial<Goal>): Promise<Goal> => {
    const validation = validateGoalInput(goal);
    if (!validation.success) {
      throw new ValidationError(validation.error, validation.field);
    }

    const userId = await this.ctx.getUserId();
    const { data, error } = await this.ctx.client
      .from('goals')
      .insert({
        user_id: userId,
        subject_id: goal.subjectId || null,
        title: goal.title!.trim(),
        description: goal.description?.trim() || null,
        horizon: goal.horizon || 'medium_term',
        status: goal.status || 'active',
        category: goal.category || 'academic',
        experience_type: goal.experienceType || 'standard',
        target_score: goal.targetScore || null,
        exam_weight: goal.examWeight !== undefined && goal.examWeight !== null ? Number(goal.examWeight) : null,
        project_repository_url: goal.projectRepositoryUrl || null,
        deliverables: goal.deliverables || [],
        target_date: goal.targetDate || getISODateString(new Date()),
        priority: goal.priority || 'high',
        color: goal.color || 'coral'
      })
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to create goal');

    if (goal.milestones && goal.milestones.length > 0) {
      const milestoneInserts = goal.milestones.map((m) => ({
        goal_id: data.id,
        user_id: userId,
        title: m.title.trim(),
        target_date: m.targetDate || null,
        completed: m.completed || false
      }));
      await this.ctx.client.from('goal_milestones').insert(milestoneInserts);

      const allCompleted = goal.milestones.every((m) => m.completed);
      if (allCompleted && (!goal.status || goal.status === 'active')) {
        await this.ctx.client.from('goals').update({ status: 'completed' }).eq('id', data.id).eq('user_id', userId);
      }
    }

    this.ctx.notify();
    const all = await this.getGoals();
    return all.find((g) => g.id === data.id)!;
  };

  updateGoal = async (id: string, updates: Partial<Goal>): Promise<Goal> => {
    const userId = await this.ctx.getUserId();
    const payload: any = { updated_at: new Date().toISOString() };

    if ('title' in updates && updates.title !== undefined) payload.title = updates.title.trim();
    if ('description' in updates) payload.description = updates.description ? updates.description.trim() : null;
    if ('horizon' in updates && updates.horizon !== undefined) payload.horizon = updates.horizon;
    if ('status' in updates && updates.status !== undefined) payload.status = updates.status;
    if ('category' in updates && updates.category !== undefined) payload.category = updates.category;
    if ('experienceType' in updates && updates.experienceType !== undefined) payload.experience_type = updates.experienceType;
    if ('targetScore' in updates) payload.target_score = updates.targetScore || null;
    if ('examWeight' in updates) payload.exam_weight = updates.examWeight !== undefined && updates.examWeight !== null ? Number(updates.examWeight) : null;
    if ('projectRepositoryUrl' in updates) payload.project_repository_url = updates.projectRepositoryUrl || null;
    if ('deliverables' in updates) payload.deliverables = updates.deliverables || [];
    if ('targetDate' in updates && updates.targetDate !== undefined) payload.target_date = updates.targetDate;
    if ('priority' in updates && updates.priority !== undefined) payload.priority = updates.priority;
    if ('color' in updates && updates.color !== undefined) payload.color = updates.color;
    if ('subjectId' in updates) payload.subject_id = updates.subjectId || null;

    const { data, error } = await this.ctx.client
      .from('goals')
      .update(payload)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to update goal');

    const all = await this.getGoals();
    this.ctx.notify();
    return all.find((g) => g.id === id)!;
  };

  deleteGoal = async (id: string): Promise<boolean> => {
    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('goals')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);

    if (error) throw error;
    this.ctx.notify();
    return true;
  };

  addMilestone = async (goalId: string, milestone: Partial<GoalMilestone>): Promise<Goal> => {
    if (!milestone.title || !milestone.title.trim()) {
      throw new ValidationError('Milestone title is required.', 'title');
    }

    const userId = await this.ctx.getUserId();
    const { error } = await this.ctx.client
      .from('goal_milestones')
      .insert({
        goal_id: goalId,
        user_id: userId,
        title: milestone.title.trim(),
        target_date: milestone.targetDate || null,
        completed: false
      });

    if (error) throw error;

    const all = await this.getGoals();
    const goal = all.find((g) => g.id === goalId)!;
    if (goal.status === 'completed') {
      await this.updateGoal(goalId, { status: 'active' });
    }

    this.ctx.notify();
    const refreshed = await this.getGoals();
    return refreshed.find((g) => g.id === goalId)!;
  };

  updateMilestone = async (goalId: string, milestoneId: string, updates: Partial<GoalMilestone>): Promise<Goal> => {
    const userId = await this.ctx.getUserId();
    const payload: any = {};
    if (updates.title !== undefined) payload.title = updates.title.trim();
    if (updates.targetDate !== undefined) payload.target_date = updates.targetDate || null;
    if (updates.completed !== undefined) {
      payload.completed = updates.completed;
      payload.completed_at = updates.completed ? new Date().toISOString() : null;
    }

    const { error } = await this.ctx.client
      .from('goal_milestones')
      .update(payload)
      .eq('id', milestoneId)
      .eq('user_id', userId);

    if (error) throw error;

    const all = await this.getGoals();
    const goal = all.find((g) => g.id === goalId)!;
    if (goal.progressPercentage === 100 && goal.status !== 'completed') {
      await this.updateGoal(goalId, { status: 'completed' });
    } else if (goal.progressPercentage < 100 && goal.status === 'completed') {
      await this.updateGoal(goalId, { status: 'active' });
    }

    this.ctx.notify();
    const refreshed = await this.getGoals();
    return refreshed.find((g) => g.id === goalId)!;
  };

  toggleMilestone = async (goalId: string, milestoneId: string): Promise<Goal> => {
    const userId = await this.ctx.getUserId();
    const { data: mil } = await this.ctx.client
      .from('goal_milestones')
      .select('*')
      .eq('id', milestoneId)
      .eq('user_id', userId)
      .single();

    if (!mil) throw new Error('Milestone not found');

    const nextCompleted = !mil.completed;
    await this.ctx.client
      .from('goal_milestones')
      .update({
        completed: nextCompleted,
        completed_at: nextCompleted ? new Date().toISOString() : null
      })
      .eq('id', milestoneId)
      .eq('user_id', userId);

    const all = await this.getGoals();
    const goal = all.find((g) => g.id === goalId)!;

    if (goal.progressPercentage === 100 && goal.status !== 'completed') {
      await this.updateGoal(goalId, { status: 'completed' });
    } else if (goal.progressPercentage < 100 && goal.status === 'completed') {
      await this.updateGoal(goalId, { status: 'active' });
    }

    this.ctx.notify();
    const refreshed = await this.getGoals();
    return refreshed.find((g) => g.id === goalId)!;
  };

  deleteMilestone = async (goalId: string, milestoneId: string): Promise<Goal> => {
    const userId = await this.ctx.getUserId();
    await this.ctx.client
      .from('goal_milestones')
      .delete()
      .eq('id', milestoneId)
      .eq('user_id', userId);

    const all = await this.getGoals();
    const goal = all.find((g) => g.id === goalId)!;

    if (goal.milestones.length > 0 && goal.progressPercentage === 100 && goal.status !== 'completed') {
      await this.updateGoal(goalId, { status: 'completed' });
    } else if (goal.progressPercentage < 100 && goal.status === 'completed') {
      await this.updateGoal(goalId, { status: 'active' });
    }

    this.ctx.notify();
    const refreshed = await this.getGoals();
    return refreshed.find((g) => g.id === goalId)!;
  };
}
