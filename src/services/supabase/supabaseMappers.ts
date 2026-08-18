import { UserProfile } from '../../types/auth';
import { Task, SubTask } from '../../types/task';
import { StudySubject, StudySession, StudyPlanItem, StudyTopic } from '../../types/study';
import { Note } from '../../types/note';
import { FocusSession } from '../../types/focus';
import { Habit } from '../../types/habit';
import { Goal, GoalMilestone } from '../../types/goal';
import { Flashcard, ReviewQueueItem } from '../../types/learning';
import { RecurringStudyRoutine } from '../../types/planning';
import { StudyResource } from '../../types/resource';
import { DailyReflection } from '../../types/reflection';
import { calculateStreaks } from '../../utils/streaks';
import { getISODateString } from '../../utils/date';

export function mapProfile(row: any): UserProfile {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    focusField: row.focus_field || 'Systems Architecture & Computational Design',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    preferences: row.preferences || {
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

export function mapSubtask(row: any): SubTask {
  return {
    id: row.id,
    title: row.title,
    completed: row.completed ?? false,
    createdAt: row.created_at
  };
}

export function mapTask(row: any, subtasks: any[] = []): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description || undefined,
    status: row.status || 'todo',
    priority: row.priority || 'medium',
    category: row.category || 'study',
    dueDate: row.due_date || undefined,
    dueTime: row.due_time || undefined,
    estimatedMinutes: row.estimated_minutes ?? 30,
    completedMinutes: row.completed_minutes ?? 0,
    completedAt: row.completed_at || undefined,
    subjectId: row.subject_id || undefined,
    planItemId: row.plan_item_id || undefined,
    tags: row.tags || [],
    subTasks: subtasks.map(mapSubtask),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapSubject(
  row: any,
  completedHoursThisWeek = 0,
  notesCount = 0
): StudySubject {
  return {
    id: row.id,
    name: row.name,
    code: row.code || 'CORE',
    description: row.description || undefined,
    color: row.color || 'coral',
    targetHoursPerWeek: Number(row.target_hours_per_week) || 10,
    completedHoursThisWeek,
    status: row.status || 'active',
    notesCount,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapTopic(row: any): StudyTopic {
  return {
    id: row.id,
    subjectId: row.subject_id,
    title: row.title,
    description: row.description || undefined,
    orderIndex: row.order_index ?? 0,
    masteryLevel: row.mastery_level || 'unstudied',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapStudySession(row: any, subjectName = 'General Study'): StudySession {
  return {
    id: row.id,
    subjectId: row.subject_id || undefined,
    subjectName: row.subject_name || subjectName,
    planItemId: row.plan_item_id || undefined,
    focusSessionId: row.focus_session_id || undefined,
    type: row.type || 'deep_study',
    durationMinutes: row.duration_minutes,
    topicsCovered: row.topics_covered || [],
    notes: row.notes || undefined,
    retentionRating: row.retention_rating ?? 4,
    completedAt: row.completed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapStudyPlanItem(
  row: any,
  subjectName = 'General Study',
  actualMinutesLogged = 0
): StudyPlanItem {
  return {
    id: row.id,
    subjectId: row.subject_id || undefined,
    subjectName: row.subject_name || subjectName,
    topicId: row.topic_id || undefined,
    title: row.title,
    targetMinutes: row.target_minutes ?? 45,
    scheduledDate: row.scheduled_date || undefined,
    scheduledTime: row.scheduled_time || '02:00 PM',
    priority: row.priority || 'medium',
    completed: row.completed ?? false,
    notes: row.notes || undefined,
    linkedTaskId: row.linked_task_id || undefined,
    actualMinutesLogged,
    createdAt: row.created_at
  };
}

export function mapNote(row: any, subjectName?: string): Note {
  return {
    id: row.id,
    userId: row.user_id || undefined,
    subjectId: row.subject_id || undefined,
    subjectName,
    planItemId: row.plan_item_id || undefined,
    studySessionId: row.study_session_id || undefined,
    title: row.title,
    content: row.content || '',
    category: row.category || 'general',
    tags: row.tags || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapFocusSession(row: any, subjectName?: string): FocusSession {
  return {
    id: row.id,
    mode: row.mode || 'pomodoro',
    durationMinutes: row.duration_minutes,
    breakDurationMinutes: row.break_duration_minutes || undefined,
    subjectId: row.subject_id || undefined,
    subjectName,
    planItemId: row.plan_item_id || undefined,
    topic: row.topic || undefined,
    title: row.title || 'Deep Focus Session',
    completed: row.completed ?? true,
    interruptionsCount: row.interruptions_count ?? 0,
    notes: row.notes || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapHabit(row: any, history: Record<string, boolean> = {}, goalTitle?: string): Habit {
  const todayStr = getISODateString(new Date());
  const { currentStreak, longestStreak } = calculateStreaks(history, todayStr);

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category || 'study',
    frequency: row.frequency || 'daily',
    color: row.color || 'coral',
    currentStreak,
    longestStreak,
    completedToday: history[todayStr] === true,
    history,
    goalId: row.goal_id || undefined,
    goalTitle: goalTitle || row.goals?.title || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapMilestone(row: any): GoalMilestone {
  return {
    id: row.id,
    title: row.title,
    targetDate: row.target_date || undefined,
    completed: row.completed ?? false,
    completedAt: row.completed_at || undefined
  };
}

export function mapGoal(row: any, milestones: GoalMilestone[] = [], subjectName?: string): Goal {
  const total = milestones.length;
  const completed = milestones.filter((m) => m.completed).length;
  const progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    horizon: row.horizon || 'medium_term',
    status: row.status || 'active',
    category: row.category || 'academic',
    experienceType: row.experience_type || 'standard',
    subjectId: row.subject_id || undefined,
    subjectName,
    targetDate: row.target_date,
    progressPercentage,
    priority: row.priority || 'high',
    color: row.color || 'coral',
    targetScore: row.target_score || undefined,
    examWeight: row.exam_weight !== undefined && row.exam_weight !== null ? Number(row.exam_weight) : undefined,
    projectRepositoryUrl: row.project_repository_url || undefined,
    deliverables: Array.isArray(row.deliverables) ? row.deliverables : undefined,
    milestones,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapRoutine(row: any, subjectName?: string, topicTitle?: string): RecurringStudyRoutine {
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectName: subjectName || row.subjects?.name,
    topicId: row.topic_id || undefined,
    topicTitle: topicTitle || row.study_topics?.title,
    title: row.title,
    targetMinutes: row.target_minutes ?? 45,
    daysOfWeek: Array.isArray(row.days_of_week) ? row.days_of_week : [1, 3, 5],
    scheduledTime: row.scheduled_time || '14:00',
    priority: row.priority || 'medium',
    isActive: row.is_active ?? true,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapFlashcard(row: any, subjectName?: string, topicTitle?: string): Flashcard {
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectName: subjectName || row.subjects?.name,
    topicId: row.topic_id || undefined,
    topicTitle: topicTitle || row.study_topics?.title,
    noteId: row.note_id || undefined,
    frontPrompt: row.front_prompt,
    backAnswer: row.back_answer,
    cardType: row.card_type || 'standard',
    difficultyRating: row.difficulty_rating || 'good',
    repetitionCount: row.repetition_count ?? 0,
    intervalDays: row.interval_days ?? 1,
    easeFactor: Number(row.ease_factor ?? 2.5),
    nextReviewDate: row.next_review_date || getISODateString(new Date()),
    lastReviewedAt: row.last_reviewed_at || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapReviewItem(row: any, subjectName?: string, subjectColor?: string, topicTitle?: string): ReviewQueueItem {
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectName: subjectName || row.subjects?.name || 'General',
    subjectColor: subjectColor || row.subjects?.color || 'coral',
    topicId: row.topic_id,
    topicTitle: topicTitle || row.study_topics?.title || 'General Topic',
    flashcardId: row.flashcard_id || undefined,
    dueDate: row.due_date || getISODateString(new Date()),
    priority: row.priority || 'medium',
    reason: row.reason || 'Spaced review interval due',
    completed: row.completed ?? false,
    completedAt: row.completed_at || undefined,
    createdAt: row.created_at
  };
}

export function mapResource(row: any, subjectName?: string, topicTitle?: string): StudyResource {
  return {
    id: row.id,
    subjectId: row.subject_id,
    subjectName: subjectName || row.subjects?.name,
    topicId: row.topic_id || undefined,
    topicTitle: topicTitle || row.study_topics?.title,
    title: row.title,
    author: row.author || undefined,
    url: row.url || undefined,
    type: row.type || 'paper',
    status: row.status || 'unread',
    rating: row.rating ? Number(row.rating) : undefined,
    notes: row.notes || undefined,
    tags: Array.isArray(row.tags) ? row.tags : [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapReflection(row: any): DailyReflection {
  return {
    id: row.id,
    date: row.date,
    energyScore: row.energy_score ?? 4,
    focusScore: row.focus_score ?? 4,
    wins: Array.isArray(row.wins) ? row.wins : [],
    frictionPoints: Array.isArray(row.friction_points) ? row.friction_points : [],
    tomorrowIntentions: Array.isArray(row.tomorrow_intentions) ? row.tomorrow_intentions : [],
    synthesisNotes: row.synthesis_notes || undefined,
    completedHabitsCount: row.completed_habits_count ?? 0,
    completedTasksCount: row.completed_tasks_count ?? 0,
    studyMinutesLogged: row.study_minutes_logged ?? 0,
    reviewCardsCompleted: row.review_cards_completed ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}
