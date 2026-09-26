import { UserProfile } from '../../types/auth';
import { Task, SubTask, TaskTimeBlock } from '../../types/task';
import { StudySubject, StudySession, StudyPlanItem, StudyTopic } from '../../types/study';
import { Note } from '../../types/note';
import { FocusSession } from '../../types/focus';
import { Habit } from '../../types/habit';
import { Goal, GoalMilestone } from '../../types/goal';
import { Flashcard, ReviewQueueItem } from '../../types/learning';
import { RecurringStudyRoutine } from '../../types/planning';
import { StudyResource } from '../../types/resource';
import { DailyReflection } from '../../types/reflection';
import { StudyRoom, RoomParticipant, RoomMessage, RoomTimelineEvent, RoomReflection } from '../../types/room';
import { CloudStudyPact } from '../../types/studyPact';
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
      focusGradientTheme: 'momentum',
      fsrsRetention: 0.90,
      fsrsAlgorithm: 'fsrs-5'
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
    recurrence: row.recurrence || undefined,
    isRecurring: row.is_recurring ?? Boolean(row.recurrence),
    naturalLanguageInput: row.natural_language_input || undefined,
    deferralCount: row.deferral_count ?? undefined,
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
    taskId: row.task_id || undefined,
    subjectId: row.subject_id || undefined,
    subjectName,
    planItemId: row.plan_item_id || undefined,
    topic: row.topic || undefined,
    title: row.title || 'Deep Focus Session',
    completed: row.completed ?? true,
    interruptionsCount: row.interruptions_count ?? 0,
    internalInterruptionsCount: row.internal_interruptions_count ?? undefined,
    externalInterruptionsCount: row.external_interruptions_count ?? undefined,
    interruptionsLog: row.interruptions_log || undefined,
    flowQuality: row.flow_quality ?? undefined,
    soundscapeType: row.soundscape_type ?? undefined,
    targetOutcome: row.target_outcome ?? undefined,
    notes: row.notes || undefined,
    parkedThoughts: row.parked_thoughts || undefined,
    preSessionEnergy: row.pre_session_energy || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapHabit(
  row: any,
  history: Record<string, boolean> = {},
  goalTitle?: string,
  valueHistory: Record<string, number> = {}
): Habit {
  const todayStr = getISODateString(new Date());
  const { currentStreak, longestStreak } = calculateStreaks(history, {
    frequency: row.frequency || 'daily',
    // "Never miss twice" (master.md §4.7): one isolated miss never zeroes a streak.
    allowGraceDays: true,
    // Plan §3.4 "Streak Amnesty": excused absence days stay transparent.
    amnestyDates: row.amnesty_dates || undefined,
    referenceDate: new Date(`${todayStr}T12:00:00`)
  });

  const kind = row.kind || (row.target_value ? 'quantitative' : 'boolean');
  const targetValue = row.target_value !== undefined && row.target_value !== null ? Number(row.target_value) : undefined;
  const baseTierValue = row.base_tier_value !== undefined && row.base_tier_value !== null ? Number(row.base_tier_value) : undefined;
  const stretchTierValue = row.stretch_tier_value !== undefined && row.stretch_tier_value !== null ? Number(row.stretch_tier_value) : undefined;

  const valToday = valueHistory[todayStr] ?? (history[todayStr] ? (targetValue || 1) : 0);
  const isDoneToday = kind === 'quantitative'
    ? valToday >= (baseTierValue || targetValue || 1)
    : history[todayStr] === true;

  return {
    id: row.id,
    title: row.title,
    description: row.description || '',
    category: row.category || 'study',
    frequency: row.frequency || 'daily',
    color: row.color || 'coral',
    currentStreak,
    longestStreak,
    completedToday: isDoneToday,
    history,
    amnestyDates: row.amnesty_dates || undefined,
    goalId: row.goal_id || undefined,
    goalTitle: goalTitle || row.goals?.title || undefined,
    kind,
    unit: row.unit || undefined,
    targetValue,
    baseTierValue,
    stretchTierValue,
    currentValueToday: valToday,
    valueHistory,
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
    imageUrl: row.image_url || undefined,
    occlusionZones: row.occlusion_zones || undefined,
    activeOcclusionZoneId: row.active_occlusion_zone_id || undefined,
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

export function mapStudyRoom(row: any, hostName?: string, participantsCount?: number): StudyRoom {
  return {
    id: row.id,
    hostId: row.host_id,
    hostName: hostName || row.profiles?.name || undefined,
    roomCode: row.room_code || undefined,
    title: row.title,
    subjectId: row.subject_id || undefined,
    subjectName: row.subjects?.name || undefined,
    topic: row.topic || undefined,
    sessionType: row.session_type || 'deep_focus',
    sharedObjective: row.shared_objective || undefined,
    timerState: row.timer_state || 'idle',
    targetDurationSeconds: row.target_duration_seconds ?? 1500,
    breakDurationSeconds: row.break_duration_seconds ?? 300,
    isBreak: row.is_break ?? false,
    isPrivate: row.is_private ?? false,
    startedAt: row.started_at || null,
    pausedElapsedSeconds: row.paused_elapsed_seconds ?? 0,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    participantsCount: participantsCount ?? (row.room_participants ? row.room_participants.length : undefined)
  };
}

export function mapRoomParticipant(row: any, userName?: string, userEmail?: string): RoomParticipant {
  return {
    roomId: row.room_id,
    userId: row.user_id,
    userName: userName || row.profiles?.name || undefined,
    userEmail: userEmail || row.profiles?.email || undefined,
    status: row.status || 'focusing',
    joinedAt: row.joined_at,
    personalObjective: row.personal_objective || undefined,
    isReady: row.is_ready ?? false
  };
}

export function mapRoomMessage(row: any, userName?: string): RoomMessage {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    userName: userName || row.profiles?.name || undefined,
    content: row.content,
    createdAt: row.created_at
  };
}

export function mapRoomTimelineEvent(row: any, userName?: string): RoomTimelineEvent {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    userName: userName || row.user_name || row.profiles?.name || 'Solis Scholar',
    eventType: row.event_type,
    message: row.message || undefined,
    createdAt: row.created_at
  };
}

export function mapRoomReflection(row: any, userName?: string, roomTitle?: string): RoomReflection {
  return {
    id: row.id,
    roomId: row.room_id,
    userId: row.user_id,
    userName: userName || row.user_name || row.profiles?.name || 'Solis Scholar',
    roomTitle: roomTitle || row.room_title || row.study_rooms?.title || 'Study Sanctuary',
    subjectId: row.subject_id || undefined,
    subjectName: row.subject_name || undefined,
    durationSeconds: row.duration_seconds ?? 0,
    objectiveAchieved: row.objective_achieved ?? true,
    reflectionText: row.reflection_text || '',
    nextStep: row.next_step || undefined,
    retentionRating: row.retention_rating ?? 5,
    createdAt: row.created_at
  };
}

export function mapTaskTimeBlock(row: any): TaskTimeBlock {
  return {
    id: row.id,
    userId: row.user_id,
    taskId: row.task_id || undefined,
    taskTitle: row.task_title || row.title || 'Untitled Block',
    description: row.description || undefined,
    date: row.date,
    startHour: row.start_hour ?? 9,
    startMinute: row.start_minute ?? 0,
    durationMinutes: row.duration_minutes ?? 60,
    subjectId: row.subject_id || undefined,
    goalId: row.goal_id || undefined,
    priority: row.priority || 'medium',
    status: row.status || 'planned',
    actualMinutes: row.actual_minutes ?? 0,
    progressPercent: row.progress_percent ?? 0,
    reflection: row.reflection || undefined,
    blocker: row.blocker || undefined,
    nextAction: row.next_action || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapStudyPact(row: any): CloudStudyPact {
  return {
    id: row.id,
    createdBy: row.created_by,
    creatorName: row.creator_name || 'Scholar',
    partnerId: row.partner_id || null,
    partnerName: row.partner_name || 'Peer Scholar',
    partnerEmail: row.partner_email || null,
    inviteCode: row.invite_code,
    sharedObjective: row.shared_objective || undefined,
    subjectId: row.subject_id || undefined,
    subjectName: row.subject_name || undefined,
    weekStartDate: row.week_start_date,
    weekEndDate: row.week_end_date,
    creatorTargetMinutes: row.creator_target_minutes,
    partnerTargetMinutes: row.partner_target_minutes,
    creatorConfirmedMinutes: row.creator_confirmed_minutes ?? 0,
    partnerConfirmedMinutes: row.partner_confirmed_minutes ?? 0,
    status: row.status || 'pending',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    completedAt: row.completed_at || null,
    summary: row.summary || undefined
  };
}


