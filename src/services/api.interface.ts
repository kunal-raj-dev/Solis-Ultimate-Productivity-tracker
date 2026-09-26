import { Task, TaskFilterOptions, SubTask, TaskTimeBlock, TimeBlockReviewPayload } from '../types/task';
import { StudySubject, StudySession, StudyPlanItem, StudyTopic } from '../types/study';
import { Note, NoteFilterOptions } from '../types/note';
import { FocusSession } from '../types/focus';
import { Habit } from '../types/habit';
import { Goal, GoalMilestone } from '../types/goal';
import { DailySummary, ProductivityMetric, DayStudyHeatmap } from '../types/analytics';
import { UserProfile, UserPreferences, LoginCredentials, SignupCredentials, AuthSession } from '../types/auth';
import { Flashcard, CardRating, ReviewQueueItem } from '../types/learning';
import { RecurringStudyRoutine } from '../types/planning';
import { StudyResource, ResourceFilterOptions } from '../types/resource';
import { DailyReflection } from '../types/reflection';
import {
  StudyRoom,
  RoomParticipant,
  RoomMessage,
  CreateRoomPayload,
  RoomTimerState,
  ParticipantStatus,
  RoomTimelineEvent,
  RoomEventType,
  RoomReflection
} from '../types/room';

export interface IAuthService {
  getCurrentUser(): Promise<UserProfile | null>;
  login(credentials: LoginCredentials): Promise<AuthSession>;
  signup(credentials: SignupCredentials): Promise<AuthSession>;
  logout(): Promise<void>;
  requestPasswordReset(email: string): Promise<void>;
  updatePassword(password: string): Promise<void>;
  updateProfile(updates: {
    name?: string;
    email?: string;
    focusField?: string;
    preferences?: Partial<UserPreferences>;
  }): Promise<UserProfile>;
}

export interface ITaskService {
  getTasks(filter?: TaskFilterOptions): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | null>;
  createTask(task: Partial<Task>): Promise<Task>;
  updateTask(id: string, updates: Partial<Task>): Promise<Task>;
  deleteTask(id: string): Promise<boolean>;
  toggleTaskCompletion(id: string): Promise<Task>;
  addSubTask(taskId: string, title: string): Promise<SubTask>;
  toggleSubTask(taskId: string, subTaskId: string): Promise<Task>;
  deleteSubTask(taskId: string, subTaskId: string): Promise<Task>;
  editSubTask(taskId: string, subTaskId: string, title: string): Promise<Task>;

  // Time-Blocking & Hourly Planner Engine
  getTimeBlocks(date: string): Promise<TaskTimeBlock[]>;
  /** Optional exhaustive fetch for backup/export (not all backends support it). */
  getAllTimeBlocks?(): Promise<TaskTimeBlock[]>;
  createTimeBlock(block: Partial<TaskTimeBlock>): Promise<TaskTimeBlock>;
  updateTimeBlock(id: string, updates: Partial<TaskTimeBlock>): Promise<TaskTimeBlock>;
  deleteTimeBlock(id: string): Promise<boolean>;
  reviewTimeBlock(
    id: string,
    review: TimeBlockReviewPayload
  ): Promise<{ updatedBlock: TaskTimeBlock; rescheduledBlock?: TaskTimeBlock }>;
  rescheduleTimeBlock(id: string, newDate: string, newHour: number): Promise<TaskTimeBlock>;
}


export interface IStudyService {
  getSubjects(includeArchived?: boolean): Promise<StudySubject[]>;
  getSubjectById(id: string): Promise<StudySubject | null>;
  createSubject(subject: Partial<StudySubject>): Promise<StudySubject>;
  updateSubject(id: string, updates: Partial<StudySubject>): Promise<StudySubject>;
  archiveSubject(id: string): Promise<StudySubject>;
  restoreSubject(id: string): Promise<StudySubject>;
  deleteSubject(id: string): Promise<boolean>;

  // Canonical Syllabus Topics
  getTopics(subjectId: string): Promise<StudyTopic[]>;
  createTopic(topic: Partial<StudyTopic>): Promise<StudyTopic>;
  updateTopic(id: string, updates: Partial<StudyTopic>): Promise<StudyTopic>;
  deleteTopic(id: string): Promise<boolean>;

  // Study Sessions
  getRecentSessions(): Promise<StudySession[]>;
  logSession(session: Partial<StudySession>): Promise<StudySession>;
  deleteSession(id: string): Promise<boolean>;

  // Study Plan
  getTodayPlan(): Promise<StudyPlanItem[]>;
  createPlanItem(item: Partial<StudyPlanItem>): Promise<StudyPlanItem>;
  updatePlanItem(id: string, updates: Partial<StudyPlanItem>): Promise<StudyPlanItem>;
  togglePlanItem(id: string): Promise<StudyPlanItem>;
  deletePlanItem(id: string): Promise<boolean>;
}

export interface INoteService {
  getNotes(filter?: NoteFilterOptions): Promise<Note[]>;
  getNoteById(id: string): Promise<Note | null>;
  createNote(note: Partial<Note>): Promise<Note>;
  updateNote(id: string, updates: Partial<Note>): Promise<Note>;
  deleteNote(id: string): Promise<boolean>;
  getAllTags(): Promise<string[]>;
}

export interface IFocusService {
  getRecentSessions(): Promise<FocusSession[]>;
  saveFocusSession(session: Partial<FocusSession>): Promise<FocusSession>;
  getTodayFocusMinutes(): Promise<number>;
}

export interface IHabitService {
  getHabits(): Promise<Habit[]>;
  createHabit(habit: Partial<Habit>): Promise<Habit>;
  updateHabit(id: string, updates: Partial<Habit>): Promise<Habit>;
  deleteHabit(id: string): Promise<boolean>;
  toggleHabitToday(id: string): Promise<Habit>;
  toggleHabitDate(id: string, dateStr: string): Promise<Habit>;
  /** Bulk-imports completed dates (guest-to-cloud migration, plan §1.3). */
  importHabitCompletions(habitId: string, completionDates: string[]): Promise<Habit>;
}

export interface IGoalService {
  getGoals(): Promise<Goal[]>;
  createGoal(goal: Partial<Goal>): Promise<Goal>;
  updateGoal(id: string, updates: Partial<Goal>): Promise<Goal>;
  deleteGoal(id: string): Promise<boolean>;
  addMilestone(goalId: string, milestone: Partial<GoalMilestone>): Promise<Goal>;
  updateMilestone?(goalId: string, milestoneId: string, updates: Partial<GoalMilestone>): Promise<Goal>;
  toggleMilestone(goalId: string, milestoneId: string): Promise<Goal>;
  deleteMilestone(goalId: string, milestoneId: string): Promise<Goal>;
}

export interface IAnalyticsService {
  getDailySummary(): Promise<DailySummary>;
  getProductivityMetrics(): Promise<ProductivityMetric[]>;
  getStudyHeatmap(days?: number): Promise<DayStudyHeatmap[]>;
}

export interface IFlashcardService {
  getFlashcards(filter?: { subjectId?: string; topicId?: string }): Promise<Flashcard[]>;
  getFlashcardById(id: string): Promise<Flashcard | null>;
  createFlashcard(card: Partial<Flashcard>): Promise<Flashcard>;
  updateFlashcard(id: string, updates: Partial<Flashcard>): Promise<Flashcard>;
  deleteFlashcard(id: string): Promise<boolean>;
  recordCardAttempt(cardId: string, rating: CardRating): Promise<Flashcard>;
}

export interface IReviewService {
  getDueReviewItems(): Promise<ReviewQueueItem[]>;
  createReviewItem(item: Partial<ReviewQueueItem>): Promise<ReviewQueueItem>;
  completeReviewItem(id: string): Promise<boolean>;
  deleteReviewItem(id: string): Promise<boolean>;
}

export interface IRoutineService {
  getRoutines(): Promise<RecurringStudyRoutine[]>;
  createRoutine(routine: Partial<RecurringStudyRoutine>): Promise<RecurringStudyRoutine>;
  updateRoutine(id: string, updates: Partial<RecurringStudyRoutine>): Promise<RecurringStudyRoutine>;
  deleteRoutine(id: string): Promise<boolean>;
  materializeRoutinesForToday(): Promise<StudyPlanItem[]>;
}

export interface IResourceService {
  getResources(filter?: ResourceFilterOptions): Promise<StudyResource[]>;
  getResourceById(id: string): Promise<StudyResource | null>;
  createResource(resource: Partial<StudyResource>): Promise<StudyResource>;
  updateResource(id: string, updates: Partial<StudyResource>): Promise<StudyResource>;
  deleteResource(id: string): Promise<boolean>;
}

export interface IReflectionService {
  getReflections(limit?: number): Promise<DailyReflection[]>;
  getReflectionByDate(date: string): Promise<DailyReflection | null>;
  saveDailyReflection(reflection: Partial<DailyReflection>): Promise<DailyReflection>;
  deleteReflection(id: string): Promise<boolean>;
}

export interface IRoomService {
  getRooms(): Promise<StudyRoom[]>;
  getRoom(roomId: string): Promise<StudyRoom | null>;
  getRoomByCode(code: string): Promise<StudyRoom | null>;
  createRoom(payload: CreateRoomPayload): Promise<StudyRoom>;
  updateTimerState(roomId: string, newState: RoomTimerState, targetDuration?: number): Promise<StudyRoom>;
  startBreak(roomId: string, breakDurationSeconds?: number): Promise<StudyRoom>;
  endBreak(roomId: string): Promise<StudyRoom>;
  joinRoom(roomId: string, status?: ParticipantStatus): Promise<RoomParticipant>;
  leaveRoom(roomId: string): Promise<boolean>;
  updateParticipantStatus(roomId: string, status: ParticipantStatus): Promise<RoomParticipant>;
  getParticipants(roomId: string): Promise<RoomParticipant[]>;
  getMessages(roomId: string, limit?: number): Promise<RoomMessage[]>;
  sendMessage(roomId: string, content: string): Promise<RoomMessage>;
  getRoomEvents(roomId: string): Promise<RoomTimelineEvent[]>;
  sendRoomEvent(roomId: string, eventType: RoomEventType, message?: string): Promise<RoomTimelineEvent>;
  saveRoomReflection(reflection: Partial<RoomReflection>): Promise<RoomReflection>;
  getRoomReflections(roomId: string): Promise<RoomReflection[]>;
  getUserRoomHistory(): Promise<RoomReflection[]>;
  deleteRoom(roomId: string): Promise<boolean>;
  /**
   * Host failover (plan §6.2): when the host is no longer among the room
   * participants, the oldest remaining participant is auto-promoted to host.
   * Returns the updated room, or null when no promotion applied (host still
   * present, empty room, or caller not a participant).
   */
  promoteNextHost(roomId: string): Promise<StudyRoom | null>;
}


/**
 * Scoped entity pub/sub channels (plan §6.1).
 * A mutation notifies only the subscribers that declared an interest in its
 * channel, so a single habit toggle no longer fires queries on every mounted
 * page. Subscribing without channels (or with 'all') receives every event.
 * Domains outside this enum (flashcards, reviews, routines, resources,
 * reflections, rooms, auth) broadcast on 'all'.
 */
export type DataEntityChannel = 'tasks' | 'habits' | 'notes' | 'study' | 'focus' | 'goals' | 'all';

/**
 * Shared dispatch predicate for the scoped entity event bus.
 * A global event (no channel or 'all') reaches every subscriber; a scoped
 * event reaches unfiltered subscribers and those holding the channel.
 */
export function matchesChannelFilter(
  subscribedChannels: DataEntityChannel[] | undefined,
  eventChannel: DataEntityChannel | undefined
): boolean {
  if (!eventChannel || eventChannel === 'all') return true;
  if (!subscribedChannels || subscribedChannels.length === 0) return true;
  if (subscribedChannels.includes('all')) return true;
  return subscribedChannels.includes(eventChannel);
}

export interface IDataService {
  auth: IAuthService;
  tasks: ITaskService;
  study: IStudyService;
  notes: INoteService;
  focus: IFocusService;
  habits: IHabitService;
  goals: IGoalService;
  analytics: IAnalyticsService;
  flashcards: IFlashcardService;
  reviews: IReviewService;
  routines: IRoutineService;
  resources: IResourceService;
  reflections: IReflectionService;
  rooms: IRoomService;
  subscribe(listener: () => void, channels?: DataEntityChannel[]): () => void;
  notifySubscribers(channel: DataEntityChannel): void;
}
