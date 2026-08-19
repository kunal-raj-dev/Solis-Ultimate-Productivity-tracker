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
import {
  MOCK_USER,
  MOCK_TASKS,
  MOCK_SUBJECTS,
  MOCK_TOPICS,
  MOCK_STUDY_SESSIONS,
  MOCK_STUDY_PLAN,
  MOCK_NOTES,
  MOCK_FOCUS_SESSIONS,
  MOCK_HABITS,
  MOCK_GOALS,
  MOCK_FLASHCARDS,
  MOCK_REVIEWS,
  MOCK_ROUTINES,
  MOCK_RESOURCES,
  MOCK_REFLECTIONS
} from './mockData';
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
import { isToday, isPast, isFuture, getISODateString, isThisWeek } from '../../utils/date';
import { calculateStreaks } from '../../utils/streaks';
import { calculateDailySummary } from '../../utils/productivity';
import { calculateNextCardReview } from '../../utils/learning/spacedRepetition';
import { evaluateRoutinesForDate } from '../../utils/planning/timeBlocking';
import {
  validateTaskInput,
  validateStudySessionInput,
  validateHabitInput,
  validateGoalInput,
  ValidationError
} from '../../utils/validation';
import { validateNoteInput, normalizeTag, normalizeTagList, filterNotes } from '../../utils/notes';
import { validateStudyPlanInput, calculatePlannedVsActual } from '../../utils/study';

const delay = (ms = 30) => new Promise((resolve) => setTimeout(resolve, ms));

export class MockDataService implements IDataService {
  private listeners: Set<() => void> = new Set();

  private _user: UserProfile | null = MOCK_USER;
  private _tasks: Task[] = JSON.parse(JSON.stringify(MOCK_TASKS));
  private _subjects: StudySubject[] = JSON.parse(JSON.stringify(MOCK_SUBJECTS));
  private _topics: StudyTopic[] = JSON.parse(JSON.stringify(MOCK_TOPICS));
  private _studySessions: StudySession[] = JSON.parse(JSON.stringify(MOCK_STUDY_SESSIONS));
  private _studyPlan: StudyPlanItem[] = JSON.parse(JSON.stringify(MOCK_STUDY_PLAN));
  private _notes: Note[] = JSON.parse(JSON.stringify(MOCK_NOTES));
  private _focusSessions: FocusSession[] = JSON.parse(JSON.stringify(MOCK_FOCUS_SESSIONS));
  private _habits: Habit[] = JSON.parse(JSON.stringify(MOCK_HABITS));
  private _goals: Goal[] = JSON.parse(JSON.stringify(MOCK_GOALS));
  private _flashcards: Flashcard[] = JSON.parse(JSON.stringify(MOCK_FLASHCARDS));
  private _reviews: ReviewQueueItem[] = JSON.parse(JSON.stringify(MOCK_REVIEWS));
  private _routines: RecurringStudyRoutine[] = JSON.parse(JSON.stringify(MOCK_ROUTINES));
  private _resources: StudyResource[] = JSON.parse(JSON.stringify(MOCK_RESOURCES));
  private _reflections: DailyReflection[] = JSON.parse(JSON.stringify(MOCK_REFLECTIONS));

  constructor() {
    this.recalculateAllStreaks();
  }

  public subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private notify(): void {
    for (const listener of this.listeners) {
      try {
        listener();
      } catch (err) {
        console.error('Error in Solis repository listener:', err);
      }
    }
  }

  private recalculateAllStreaks(): void {
    const today = getISODateString(new Date());
    this._habits = this._habits.map((habit) => {
      const { currentStreak, longestStreak } = calculateStreaks(habit.history || {}, today);
      return {
        ...habit,
        currentStreak,
        longestStreak,
        completedToday: !!habit.history?.[today]
      };
    });
  }

  /* ==========================================================================
     1. AUTH SERVICE IMPLEMENTATION
     ========================================================================== */
  auth: IAuthService = {
    getCurrentUser: async (): Promise<UserProfile | null> => {
      await delay(20);
      return this._user ? { ...this._user } : null;
    },

    login: async (credentials: LoginCredentials): Promise<AuthSession> => {
      await delay(80);
      if (!credentials.email || !credentials.password) {
        throw new Error('Please provide email and password');
      }
      this._user = { ...MOCK_USER, email: credentials.email };
      this.notify();
      return {
        token: 'mock-jwt-solis-token',
        user: this._user,
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };
    },

    signup: async (credentials: SignupCredentials): Promise<AuthSession> => {
      await delay(80);
      if (!credentials.email || !credentials.name) {
        throw new Error('Please fill in all signup fields');
      }
      this._user = {
        id: `usr_${Date.now()}`,
        name: credentials.name,
        email: credentials.email,
        focusField: credentials.focusField || 'Systems Architecture',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
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
      this.notify();
      return {
        token: 'mock-jwt-solis-token',
        user: this._user,
        expiresAt: new Date(Date.now() + 86400000).toISOString()
      };
    },

    logout: async (): Promise<void> => {
      await delay(40);
      this._user = null;
      this.notify();
    },

    requestPasswordReset: async (email: string): Promise<void> => {
      await delay(60);
      if (!email || !email.includes('@')) {
        throw new Error('Please provide a valid email address.');
      }
      // Mock always resolves neutrally
    },

    updatePassword: async (password: string): Promise<void> => {
      await delay(60);
      if (!password || password.length < 6) {
        throw new Error('Password must be at least 6 characters.');
      }
      if (this._user) {
        this._user = { ...this._user, updatedAt: new Date().toISOString() };
      }
      this.notify();
    }
  };

  /* ==========================================================================
     2. TASK SERVICE IMPLEMENTATION
     ========================================================================== */
  tasks: ITaskService = {
    getTasks: async (filter?: TaskFilterOptions): Promise<Task[]> => {
      await delay(20);
      let list = [...this._tasks];

      if (filter?.status && filter.status !== 'all') {
        list = list.filter((t) => t.status === filter.status);
      }
      if (filter?.priority && filter.priority !== 'all') {
        list = list.filter((t) => t.priority === filter.priority);
      }
      if (filter?.category && filter.category !== 'all') {
        list = list.filter((t) => t.category === filter.category);
      }
      if (filter?.timeFilter && filter.timeFilter !== 'all') {
        if (filter.timeFilter === 'today') {
          list = list.filter((t) => isToday(t.dueDate));
        } else if (filter.timeFilter === 'upcoming') {
          list = list.filter((t) => isFuture(t.dueDate) && t.status !== 'completed');
        } else if (filter.timeFilter === 'overdue') {
          list = list.filter((t) => isPast(t.dueDate) && t.status !== 'completed');
        } else if (filter.timeFilter === 'completed') {
          list = list.filter((t) => t.status === 'completed');
        }
      }
      if (filter?.search && filter.search.trim()) {
        const q = filter.search.toLowerCase().trim();
        list = list.filter(
          (t) =>
            t.title.toLowerCase().includes(q) ||
            (t.description && t.description.toLowerCase().includes(q)) ||
            t.tags.some((tag) => tag.toLowerCase().includes(q))
        );
      }

      return list;
    },

    getTaskById: async (id: string): Promise<Task | null> => {
      await delay(10);
      const found = this._tasks.find((t) => t.id === id);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },

    createTask: async (task: Partial<Task>): Promise<Task> => {
      await delay(30);
      const validation = validateTaskInput(task);
      if (!validation.success) {
        throw new ValidationError(validation.error, validation.field);
      }

      const newTask: Task = {
        id: `tsk_${Date.now()}`,
        title: task.title!.trim(),
        description: task.description ? task.description.trim() : undefined,
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        category: task.category || 'study',
        dueDate: task.dueDate || getISODateString(new Date()),
        dueTime: task.dueTime || undefined,
        estimatedMinutes: task.estimatedMinutes || 30,
        completedMinutes: 0,
        subjectId: task.subjectId,
        goalId: task.goalId,
        planItemId: task.planItemId,
        subTasks: task.subTasks || [],
        tags: task.tags || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this._tasks.unshift(newTask);
      this.notify();
      return { ...newTask };
    },

    updateTask: async (id: string, updates: Partial<Task>): Promise<Task> => {
      await delay(30);
      const index = this._tasks.findIndex((t) => t.id === id);
      if (index === -1) throw new Error(`Task with id ${id} not found`);

      if (updates.title !== undefined) {
        const validation = validateTaskInput(updates);
        if (!validation.success) {
          throw new ValidationError(validation.error, validation.field);
        }
      }

      const current = this._tasks[index];
      const updated: Task = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString(),
        completedAt:
          updates.status === 'completed' && current.status !== 'completed'
            ? new Date().toISOString()
            : updates.status && updates.status !== 'completed'
            ? undefined
            : current.completedAt
      };

      this._tasks[index] = updated;
      this.notify();
      return { ...updated };
    },

    deleteTask: async (id: string): Promise<boolean> => {
      await delay(30);
      const before = this._tasks.length;
      this._tasks = this._tasks.filter((t) => t.id !== id);
      const deleted = this._tasks.length < before;
      if (deleted) this.notify();
      return deleted;
    },

    toggleTaskCompletion: async (id: string): Promise<Task> => {
      const task = await this.tasks.getTaskById(id);
      if (!task) throw new Error(`Task with id ${id} not found`);
      const newStatus = task.status === 'completed' ? 'todo' : 'completed';
      return this.tasks.updateTask(id, { status: newStatus });
    },

    addSubTask: async (taskId: string, title: string): Promise<SubTask> => {
      await delay(20);
      if (!title || !title.trim()) {
        throw new ValidationError('Subtask title cannot be empty.', 'title');
      }

      const task = this._tasks.find((t) => t.id === taskId);
      if (!task) throw new Error(`Task ${taskId} not found`);

      const sub: SubTask = {
        id: `st_${Date.now()}`,
        title: title.trim(),
        completed: false,
        createdAt: new Date().toISOString()
      };

      task.subTasks.push(sub);
      task.updatedAt = new Date().toISOString();
      this.notify();
      return { ...sub };
    },

    toggleSubTask: async (taskId: string, subTaskId: string): Promise<Task> => {
      await delay(20);
      const task = this._tasks.find((t) => t.id === taskId);
      if (!task) throw new Error(`Task ${taskId} not found`);

      const sub = task.subTasks.find((s) => s.id === subTaskId);
      if (!sub) throw new Error(`SubTask ${subTaskId} not found`);

      sub.completed = !sub.completed;

      const allDone = task.subTasks.length > 0 && task.subTasks.every((s) => s.completed);
      if (allDone && task.status !== 'completed') {
        task.status = 'completed';
        task.completedAt = new Date().toISOString();
      } else if (!sub.completed && task.status === 'completed') {
        task.status = 'in_progress';
        task.completedAt = undefined;
      }

      task.updatedAt = new Date().toISOString();
      this.notify();
      return JSON.parse(JSON.stringify(task));
    },

    deleteSubTask: async (taskId: string, subTaskId: string): Promise<Task> => {
      await delay(20);
      const task = this._tasks.find((t) => t.id === taskId);
      if (!task) throw new Error(`Task ${taskId} not found`);

      task.subTasks = task.subTasks.filter((s) => s.id !== subTaskId);
      task.updatedAt = new Date().toISOString();
      this.notify();
      return JSON.parse(JSON.stringify(task));
    },

    editSubTask: async (taskId: string, subTaskId: string, title: string): Promise<Task> => {
      await delay(20);
      if (!title || !title.trim()) {
        throw new ValidationError('Subtask title cannot be empty.', 'title');
      }

      const task = this._tasks.find((t) => t.id === taskId);
      if (!task) throw new Error(`Task ${taskId} not found`);

      const sub = task.subTasks.find((s) => s.id === subTaskId);
      if (!sub) throw new Error(`SubTask ${subTaskId} not found`);

      sub.title = title.trim();
      task.updatedAt = new Date().toISOString();
      this.notify();
      return JSON.parse(JSON.stringify(task));
    }
  };

  /* ==========================================================================
     3. STUDY SERVICE IMPLEMENTATION (Topics, Plans, Sessions, Pure Progress)
     ========================================================================== */
  study: IStudyService = {
    getSubjects: async (includeArchived = false): Promise<StudySubject[]> => {
      await delay(20);
      let subjects = [...this._subjects];
      if (!includeArchived) {
        subjects = subjects.filter((s) => s.status !== 'archived');
      }

      return subjects.map((sub) => {
        const subSessions = this._studySessions.filter(
          (s) => s.subjectId === sub.id && isThisWeek(s.completedAt)
        );
        const totalMinutes = subSessions.reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
        const completedHours = Math.round((totalMinutes / 60) * 10) / 10;
        const notesCount = this._notes.filter((n) => n.subjectId === sub.id).length;

        return {
          ...sub,
          completedHoursThisWeek: completedHours,
          notesCount
        };
      });
    },

    getSubjectById: async (id: string): Promise<StudySubject | null> => {
      await delay(10);
      const found = this._subjects.find((s) => s.id === id);
      return found ? JSON.parse(JSON.stringify(found)) : null;
    },

    createSubject: async (subject: Partial<StudySubject>): Promise<StudySubject> => {
      await delay(30);
      if (!subject.name || !subject.name.trim()) {
        throw new ValidationError('Subject name is required.', 'name');
      }

      const newSub: StudySubject = {
        id: `sbj_${Date.now()}`,
        name: subject.name.trim(),
        code: subject.code?.trim() || 'CORE',
        description: subject.description?.trim() || undefined,
        color: subject.color || 'coral',
        targetHoursPerWeek: subject.targetHoursPerWeek || 10,
        completedHoursThisWeek: 0,
        status: 'active',
        notesCount: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this._subjects.push(newSub);
      this.notify();
      return { ...newSub };
    },

    updateSubject: async (id: string, updates: Partial<StudySubject>): Promise<StudySubject> => {
      await delay(30);
      const index = this._subjects.findIndex((s) => s.id === id);
      if (index === -1) throw new Error(`Subject ${id} not found`);

      const current = this._subjects[index];
      const updated: StudySubject = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this._subjects[index] = updated;
      this.notify();
      return { ...updated };
    },

    archiveSubject: async (id: string): Promise<StudySubject> => {
      return this.study.updateSubject(id, { status: 'archived' });
    },

    restoreSubject: async (id: string): Promise<StudySubject> => {
      return this.study.updateSubject(id, { status: 'active' });
    },

    deleteSubject: async (id: string): Promise<boolean> => {
      await delay(30);
      const before = this._subjects.length;
      this._subjects = this._subjects.filter((s) => s.id !== id);
      const deleted = this._subjects.length < before;
      if (deleted) this.notify();
      return deleted;
    },

    // Topics
    getTopics: async (subjectId: string): Promise<StudyTopic[]> => {
      await delay(10);
      return this._topics
        .filter((t) => t.subjectId === subjectId)
        .sort((a, b) => a.orderIndex - b.orderIndex);
    },

    createTopic: async (topic: Partial<StudyTopic>): Promise<StudyTopic> => {
      await delay(20);
      if (!topic.title || !topic.title.trim()) {
        throw new ValidationError('Topic title is required.', 'title');
      }
      if (!topic.subjectId) {
        throw new ValidationError('Subject ID is required for topic.', 'subjectId');
      }

      const newTopic: StudyTopic = {
        id: `top_${Date.now()}`,
        subjectId: topic.subjectId,
        title: topic.title.trim(),
        description: topic.description?.trim() || undefined,
        orderIndex: topic.orderIndex ?? (this._topics.filter((t) => t.subjectId === topic.subjectId).length + 1),
        masteryLevel: topic.masteryLevel || 'unstudied',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this._topics.push(newTopic);
      this.notify();
      return { ...newTopic };
    },

    updateTopic: async (id: string, updates: Partial<StudyTopic>): Promise<StudyTopic> => {
      await delay(20);
      const index = this._topics.findIndex((t) => t.id === id);
      if (index === -1) throw new Error(`Topic ${id} not found`);

      const current = this._topics[index];
      const updated: StudyTopic = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this._topics[index] = updated;
      this.notify();
      return { ...updated };
    },

    deleteTopic: async (id: string): Promise<boolean> => {
      await delay(20);
      const before = this._topics.length;
      this._topics = this._topics.filter((t) => t.id !== id);
      const deleted = this._topics.length < before;
      if (deleted) this.notify();
      return deleted;
    },

    // Sessions
    getRecentSessions: async (): Promise<StudySession[]> => {
      await delay(20);
      return this._studySessions
        .map((s) => {
          const sub = this._subjects.find((sub) => sub.id === s.subjectId);
          return {
            ...s,
            subjectName: sub ? sub.name : s.subjectName || 'General Study'
          };
        })
        .sort((a, b) => new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime());
    },

    logSession: async (session: Partial<StudySession>): Promise<StudySession> => {
      await delay(30);
      const validation = validateStudySessionInput(session);
      if (!validation.success) {
        throw new ValidationError(validation.error, validation.field);
      }

      const sub = this._subjects.find((s) => s.id === session.subjectId);
      const newSession: StudySession = {
        id: `ses_${Date.now()}`,
        subjectId: session.subjectId!,
        subjectName: sub ? sub.name : session.subjectName || 'General Study',
        planItemId: session.planItemId,
        focusSessionId: session.focusSessionId,
        type: session.type || 'deep_study',
        durationMinutes: session.durationMinutes || 45,
        topicsCovered: session.topicsCovered || ['Core syllabus block'],
        notes: session.notes ? session.notes.trim() : undefined,
        retentionRating: session.retentionRating || 4,
        completedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this._studySessions.unshift(newSession);
      this.notify();
      return { ...newSession };
    },

    deleteSession: async (id: string): Promise<boolean> => {
      await delay(30);
      const before = this._studySessions.length;
      this._studySessions = this._studySessions.filter((s) => s.id !== id);
      const deleted = this._studySessions.length < before;
      if (deleted) this.notify();
      return deleted;
    },

    // Plan
    getTodayPlan: async (): Promise<StudyPlanItem[]> => {
      await delay(20);
      const subjectsMap = new Map(this._subjects.map((s) => [s.id, s.name]));

      const planWithNames = this._studyPlan.map((p) => ({
        ...p,
        subjectName: subjectsMap.get(p.subjectId) || p.subjectName || 'General Study'
      }));

      const { enrichedPlan } = calculatePlannedVsActual(planWithNames, this._studySessions);
      return enrichedPlan;
    },

    createPlanItem: async (item: Partial<StudyPlanItem>): Promise<StudyPlanItem> => {
      await delay(30);
      validateStudyPlanInput(item);

      const sub = this._subjects.find((s) => s.id === item.subjectId);
      const newPlan: StudyPlanItem = {
        id: `spl_${Date.now()}`,
        subjectId: item.subjectId!,
        subjectName: sub ? sub.name : item.subjectName || 'General Study',
        topicId: item.topicId,
        title: item.title!.trim(),
        targetMinutes: item.targetMinutes || 45,
        scheduledDate: item.scheduledDate || getISODateString(new Date()),
        scheduledTime: item.scheduledTime || '02:00 PM',
        priority: item.priority || 'medium',
        notes: item.notes ? item.notes.trim() : undefined,
        linkedTaskId: item.linkedTaskId,
        completed: false,
        actualMinutesLogged: 0,
        createdAt: new Date().toISOString()
      };

      this._studyPlan.push(newPlan);
      this.notify();
      return { ...newPlan };
    },

    updatePlanItem: async (id: string, updates: Partial<StudyPlanItem>): Promise<StudyPlanItem> => {
      await delay(20);
      const index = this._studyPlan.findIndex((p) => p.id === id);
      if (index === -1) throw new Error(`Plan item ${id} not found`);

      const current = this._studyPlan[index];
      const updated: StudyPlanItem = {
        ...current,
        ...updates
      };

      this._studyPlan[index] = updated;
      this.notify();
      return { ...updated };
    },

    togglePlanItem: async (id: string): Promise<StudyPlanItem> => {
      const item = this._studyPlan.find((p) => p.id === id);
      if (!item) throw new Error(`Plan item ${id} not found`);
      return this.study.updatePlanItem(id, { completed: !item.completed });
    },

    deletePlanItem: async (id: string): Promise<boolean> => {
      await delay(30);
      const before = this._studyPlan.length;
      this._studyPlan = this._studyPlan.filter((p) => p.id !== id);
      const deleted = this._studyPlan.length < before;
      if (deleted) this.notify();
      return deleted;
    }
  };

  /* ==========================================================================
     4. NOTE SERVICE IMPLEMENTATION (Persistent Workspace, Search, Tags)
     ========================================================================== */
  notes: INoteService = {
    getNotes: async (filter?: NoteFilterOptions): Promise<Note[]> => {
      await delay(20);
      const subjectsMap = new Map(this._subjects.map((s) => [s.id, s.name]));

      const populated = this._notes.map((n) => ({
        ...n,
        subjectName: n.subjectId ? subjectsMap.get(n.subjectId) : undefined
      }));

      return filterNotes(populated, filter);
    },

    getNoteById: async (id: string): Promise<Note | null> => {
      await delay(10);
      const found = this._notes.find((n) => n.id === id);
      if (!found) return null;

      const sub = found.subjectId ? this._subjects.find((s) => s.id === found.subjectId) : undefined;
      return {
        ...found,
        subjectName: sub?.name
      };
    },

    createNote: async (note: Partial<Note>): Promise<Note> => {
      await delay(30);
      validateNoteInput(note);
      const cleanTags = normalizeTagList(note.tags || []);

      const sub = note.subjectId ? this._subjects.find((s) => s.id === note.subjectId) : undefined;
      const newNote: Note = {
        id: `not_${Date.now()}`,
        subjectId: note.subjectId,
        subjectName: sub?.name,
        planItemId: note.planItemId,
        studySessionId: note.studySessionId,
        title: note.title!.trim(),
        content: note.content || '',
        category: note.category || 'concept',
        tags: cleanTags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this._notes.unshift(newNote);
      this.notify();
      return { ...newNote };
    },

    updateNote: async (id: string, updates: Partial<Note>): Promise<Note> => {
      await delay(30);
      const index = this._notes.findIndex((n) => n.id === id);
      if (index === -1) throw new Error(`Note ${id} not found`);

      if (updates.title !== undefined) {
        validateNoteInput(updates);
      }

      const current = this._notes[index];
      const cleanTags = updates.tags !== undefined ? normalizeTagList(updates.tags) : current.tags;

      const sub = (updates.subjectId !== undefined ? updates.subjectId : current.subjectId)
        ? this._subjects.find((s) => s.id === (updates.subjectId !== undefined ? updates.subjectId : current.subjectId))
        : undefined;

      const updated: Note = {
        ...current,
        ...updates,
        tags: cleanTags,
        subjectName: sub?.name,
        updatedAt: new Date().toISOString()
      };

      this._notes[index] = updated;
      this.notify();
      return { ...updated };
    },

    deleteNote: async (id: string): Promise<boolean> => {
      await delay(30);
      const before = this._notes.length;
      this._notes = this._notes.filter((n) => n.id !== id);
      const deleted = this._notes.length < before;
      if (deleted) this.notify();
      return deleted;
    },

    getAllTags: async (): Promise<string[]> => {
      await delay(10);
      const tagSet = new Set<string>();
      for (const note of this._notes) {
        for (const tag of note.tags) {
          const norm = normalizeTag(tag);
          if (norm) tagSet.add(norm);
        }
      }
      return Array.from(tagSet).sort();
    }
  };

  /* ==========================================================================
     5. FOCUS SERVICE IMPLEMENTATION
     ========================================================================== */
  focus: IFocusService = {
    getRecentSessions: async (): Promise<FocusSession[]> => {
      await delay(20);
      const subjectsMap = new Map(this._subjects.map((s) => [s.id, s.name]));
      return this._focusSessions.map((f) => ({
        ...f,
        subjectName: f.subjectId ? subjectsMap.get(f.subjectId) : undefined
      }));
    },

    saveFocusSession: async (session: Partial<FocusSession>): Promise<FocusSession> => {
      await delay(30);
      const sub = session.subjectId ? this._subjects.find((s) => s.id === session.subjectId) : undefined;
      const newSession: FocusSession = {
        id: `fcs_${Date.now()}`,
        mode: session.mode || 'pomodoro',
        durationMinutes: session.durationMinutes || 25,
        breakDurationMinutes: session.breakDurationMinutes,
        subjectId: session.subjectId,
        subjectName: sub?.name,
        planItemId: session.planItemId,
        topic: session.topic?.trim() || undefined,
        title: session.title || 'Deep Focus Pod Session',
        completed: session.completed ?? true,
        interruptionsCount: session.interruptionsCount || 0,
        notes: session.notes?.trim() || undefined,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this._focusSessions.unshift(newSession);
      this.notify();
      return { ...newSession };
    },

    getTodayFocusMinutes: async (): Promise<number> => {
      await delay(10);
      const todayStr = getISODateString(new Date());
      return this._focusSessions
        .filter((s) => s.completed && s.createdAt.startsWith(todayStr))
        .reduce((acc, curr) => acc + (curr.durationMinutes || 0), 0);
    }
  };

  /* ==========================================================================
     6. HABIT SERVICE IMPLEMENTATION
     ========================================================================== */
  habits: IHabitService = {
    getHabits: async (): Promise<Habit[]> => {
      await delay(20);
      return JSON.parse(JSON.stringify(this._habits));
    },

    createHabit: async (habit: Partial<Habit>): Promise<Habit> => {
      await delay(30);
      const validation = validateHabitInput(habit);
      if (!validation.success) {
        throw new ValidationError(validation.error, validation.field);
      }

      const newHabit: Habit = {
        id: `hab_${Date.now()}`,
        title: habit.title!.trim(),
        description: habit.description ? habit.description.trim() : undefined,
        category: habit.category || 'study',
        frequency: habit.frequency || 'daily',
        color: habit.color || 'coral',
        goalId: habit.goalId,
        goalTitle: habit.goalTitle,
        currentStreak: 0,
        longestStreak: 0,
        completedToday: false,
        history: {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this._habits.push(newHabit);
      this.notify();
      return { ...newHabit };
    },

    updateHabit: async (id: string, updates: Partial<Habit>): Promise<Habit> => {
      await delay(30);
      const index = this._habits.findIndex((h) => h.id === id);
      if (index === -1) throw new Error(`Habit ${id} not found`);

      const current = this._habits[index];
      const updated: Habit = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this._habits[index] = updated;
      this.recalculateAllStreaks();
      this.notify();
      return { ...updated };
    },

    deleteHabit: async (id: string): Promise<boolean> => {
      await delay(30);
      const before = this._habits.length;
      this._habits = this._habits.filter((h) => h.id !== id);
      const deleted = this._habits.length < before;
      if (deleted) this.notify();
      return deleted;
    },

    toggleHabitToday: async (id: string): Promise<Habit> => {
      const todayStr = getISODateString(new Date());
      return this.habits.toggleHabitDate(id, todayStr);
    },

    toggleHabitDate: async (id: string, dateStr: string): Promise<Habit> => {
      await delay(20);
      const habit = this._habits.find((h) => h.id === id);
      if (!habit) throw new Error(`Habit ${id} not found`);

      if (!habit.history) habit.history = {};
      habit.history[dateStr] = !habit.history[dateStr];

      this.recalculateAllStreaks();
      this.notify();
      return JSON.parse(JSON.stringify(habit));
    }
  };

  /* ==========================================================================
     7. GOAL SERVICE IMPLEMENTATION
     ========================================================================== */
  goals: IGoalService = {
    getGoals: async (): Promise<Goal[]> => {
      await delay(20);
      const subjectsMap = new Map(this._subjects.map((s) => [s.id, s.name]));
      return this._goals.map((g) => ({
        ...g,
        subjectName: g.subjectId ? subjectsMap.get(g.subjectId) : undefined
      }));
    },

    createGoal: async (goal: Partial<Goal>): Promise<Goal> => {
      await delay(30);
      const validation = validateGoalInput(goal);
      if (!validation.success) {
        throw new ValidationError(validation.error, validation.field);
      }

      const sub = goal.subjectId ? this._subjects.find((s) => s.id === goal.subjectId) : undefined;
      const newGoal: Goal = {
        id: `gol_${Date.now()}`,
        subjectId: goal.subjectId,
        subjectName: sub?.name,
        title: goal.title!.trim(),
        description: goal.description ? goal.description.trim() : undefined,
        horizon: goal.horizon || 'medium_term',
        status: goal.status || 'active',
        category: goal.category || 'academic',
        targetDate: goal.targetDate || getISODateString(new Date()),
        progressPercentage: 0,
        priority: goal.priority || 'high',
        color: goal.color || 'coral',
        milestones: goal.milestones || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this._goals.push(newGoal);
      this.notify();
      return { ...newGoal };
    },

    updateGoal: async (id: string, updates: Partial<Goal>): Promise<Goal> => {
      await delay(30);
      const index = this._goals.findIndex((g) => g.id === id);
      if (index === -1) throw new Error(`Goal ${id} not found`);

      const current = this._goals[index];
      const updated: Goal = {
        ...current,
        ...updates,
        updatedAt: new Date().toISOString()
      };

      this._goals[index] = updated;
      this.notify();
      return { ...updated };
    },

    deleteGoal: async (id: string): Promise<boolean> => {
      await delay(30);
      const before = this._goals.length;
      this._goals = this._goals.filter((g) => g.id !== id);
      const deleted = this._goals.length < before;
      if (deleted) this.notify();
      return deleted;
    },

    addMilestone: async (goalId: string, milestone: Partial<GoalMilestone>): Promise<Goal> => {
      await delay(20);
      if (!milestone.title || !milestone.title.trim()) {
        throw new ValidationError('Milestone title is required.', 'title');
      }

      const goal = this._goals.find((g) => g.id === goalId);
      if (!goal) throw new Error(`Goal ${goalId} not found`);

      const newMilestone: GoalMilestone = {
        id: `m_${Date.now()}`,
        title: milestone.title.trim(),
        targetDate: milestone.targetDate || '',
        completed: false
      };

      goal.milestones.push(newMilestone);
      const total = goal.milestones.length;
      const completed = goal.milestones.filter((m) => m.completed).length;
      goal.progressPercentage = Math.round((completed / total) * 100);
      goal.updatedAt = new Date().toISOString();

      this.notify();
      return JSON.parse(JSON.stringify(goal));
    },

    toggleMilestone: async (goalId: string, milestoneId: string): Promise<Goal> => {
      await delay(20);
      const goal = this._goals.find((g) => g.id === goalId);
      if (!goal) throw new Error(`Goal ${goalId} not found`);

      const milestone = goal.milestones.find((m) => m.id === milestoneId);
      if (!milestone) throw new Error(`Milestone ${milestoneId} not found`);

      milestone.completed = !milestone.completed;
      milestone.completedAt = milestone.completed ? new Date().toISOString() : undefined;

      const total = goal.milestones.length;
      const completed = goal.milestones.filter((m) => m.completed).length;
      goal.progressPercentage = Math.round((completed / total) * 100);

      if (goal.progressPercentage === 100) goal.status = 'completed';
      else if (goal.status === 'completed') goal.status = 'active';

      goal.updatedAt = new Date().toISOString();
      this.notify();
      return JSON.parse(JSON.stringify(goal));
    },

    deleteMilestone: async (goalId: string, milestoneId: string): Promise<Goal> => {
      await delay(20);
      const goal = this._goals.find((g) => g.id === goalId);
      if (!goal) throw new Error(`Goal ${goalId} not found`);

      goal.milestones = goal.milestones.filter((m) => m.id !== milestoneId);
      const total = goal.milestones.length;
      const completed = goal.milestones.filter((m) => m.completed).length;
      goal.progressPercentage = total > 0 ? Math.round((completed / total) * 100) : 0;
      goal.updatedAt = new Date().toISOString();

      this.notify();
      return JSON.parse(JSON.stringify(goal));
    }
  };

  /* ==========================================================================
     8. ANALYTICS SERVICE IMPLEMENTATION (Deterministic Momentum Score)
     ========================================================================== */
  analytics: IAnalyticsService = {
    getDailySummary: async (): Promise<DailySummary> => {
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

      return summary;
    },

    getProductivityMetrics: async (): Promise<ProductivityMetric[]> => {
      const [tasks, studySessions, focusSessions, habits, user] = await Promise.all([
        this.tasks.getTasks(),
        this.study.getRecentSessions(),
        this.focus.getRecentSessions(),
        this.habits.getHabits(),
        this.auth.getCurrentUser()
      ]);

      const { summary, breakdown } = calculateDailySummary({
        tasks,
        studySessions,
        focusSessions,
        habits,
        dailyStudyGoalMinutes: user?.preferences?.dailyStudyGoalMinutes || 180,
        targetFocusMinutes: 120
      });

      return [
        { id: 'm1', label: 'Tasks Velocity', value: `${breakdown.taskScore}%`, changePercentage: null, trend: null, timeframe: 'today' },
        { id: 'm2', label: 'Study Volume', value: `${summary.totalStudyMinutes}m`, changePercentage: null, trend: null, timeframe: 'today' },
        { id: 'm3', label: 'Deep Focus Rate', value: `${breakdown.focusScore}%`, changePercentage: null, trend: null, timeframe: 'today' },
        { id: 'm4', label: 'Ritual Consistency', value: `${breakdown.habitScore}%`, changePercentage: null, trend: null, timeframe: 'today' }
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
      await delay(15);
      let cards = [...this._flashcards];
      if (filter?.subjectId) {
        cards = cards.filter((c) => c.subjectId === filter.subjectId);
      }
      if (filter?.topicId) {
        cards = cards.filter((c) => c.topicId === filter.topicId);
      }
      return cards;
    },

    getFlashcardById: async (id: string): Promise<Flashcard | null> => {
      await delay(10);
      return this._flashcards.find((c) => c.id === id) || null;
    },

    createFlashcard: async (cardData: Partial<Flashcard>): Promise<Flashcard> => {
      await delay(20);
      if (!cardData.frontPrompt || !cardData.backAnswer || !cardData.subjectId) {
        throw new ValidationError('Flashcard requires front prompt, back answer, and subject.');
      }

      const subject = this._subjects.find((s) => s.id === cardData.subjectId);
      const topic = cardData.topicId ? this._topics.find((t) => t.id === cardData.topicId) : undefined;

      const newCard: Flashcard = {
        id: `fc_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        subjectId: cardData.subjectId,
        subjectName: subject?.name || 'General',
        topicId: cardData.topicId,
        topicTitle: topic?.title,
        noteId: cardData.noteId,
        frontPrompt: cardData.frontPrompt,
        backAnswer: cardData.backAnswer,
        cardType: cardData.cardType || 'standard',
        difficultyRating: cardData.difficultyRating || 'good',
        repetitionCount: 0,
        intervalDays: 1,
        easeFactor: 2.5,
        nextReviewDate: getISODateString(new Date()),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this._flashcards.unshift(newCard);
      this.notify();
      return newCard;
    },

    updateFlashcard: async (id: string, updates: Partial<Flashcard>): Promise<Flashcard> => {
      await delay(20);
      const index = this._flashcards.findIndex((c) => c.id === id);
      if (index === -1) throw new ValidationError(`Flashcard "${id}" not found.`);

      const updated = {
        ...this._flashcards[index],
        ...updates,
        updatedAt: new Date().toISOString()
      };
      this._flashcards[index] = updated;
      this.notify();
      return updated;
    },

    deleteFlashcard: async (id: string): Promise<boolean> => {
      await delay(15);
      const prevLen = this._flashcards.length;
      this._flashcards = this._flashcards.filter((c) => c.id !== id);
      const changed = this._flashcards.length !== prevLen;
      if (changed) this.notify();
      return changed;
    },

    recordCardAttempt: async (cardId: string, rating: CardRating): Promise<Flashcard> => {
      await delay(20);
      const card = this._flashcards.find((c) => c.id === cardId);
      if (!card) throw new ValidationError(`Flashcard "${cardId}" not found.`);

      const nextSchedule = calculateNextCardReview(card, rating);
      const updatedCard: Flashcard = {
        ...card,
        ...nextSchedule,
        difficultyRating: rating,
        updatedAt: new Date().toISOString()
      };

      const index = this._flashcards.findIndex((c) => c.id === cardId);
      this._flashcards[index] = updatedCard;

      // Update topic mastery if associated with topic
      if (card.topicId) {
        const topic = this._topics.find((t) => t.id === card.topicId);
        if (topic) {
          if (rating === 'easy' || rating === 'good') {
            if (topic.masteryLevel === 'unstudied') topic.masteryLevel = 'learning';
            else if (topic.masteryLevel === 'learning' && nextSchedule.repetitionCount >= 3) {
              topic.masteryLevel = 'mastered';
            }
          } else if (rating === 'again') {
            if (topic.masteryLevel === 'mastered') topic.masteryLevel = 'learning';
          }
        }
      }

      this.notify();
      return updatedCard;
    }
  };

  public reviews: IReviewService = {
    getDueReviewItems: async (): Promise<ReviewQueueItem[]> => {
      await delay(15);
      return [...this._reviews];
    },

    createReviewItem: async (item: Partial<ReviewQueueItem>): Promise<ReviewQueueItem> => {
      await delay(20);
      if (!item.subjectId || !item.topicId || !item.reason) {
        throw new ValidationError('Review queue item requires subject, topic, and reason.');
      }

      const subject = this._subjects.find((s) => s.id === item.subjectId);
      const topic = this._topics.find((t) => t.id === item.topicId);

      const newItem: ReviewQueueItem = {
        id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        subjectId: item.subjectId,
        subjectName: subject?.name || 'General',
        subjectColor: subject?.color || 'coral',
        topicId: item.topicId,
        topicTitle: topic?.title || 'General Topic',
        flashcardId: item.flashcardId,
        dueDate: item.dueDate || getISODateString(new Date()),
        priority: item.priority || 'medium',
        reason: item.reason,
        completed: false,
        createdAt: new Date().toISOString()
      };

      this._reviews.unshift(newItem);
      this.notify();
      return newItem;
    },

    completeReviewItem: async (id: string): Promise<boolean> => {
      await delay(15);
      const item = this._reviews.find((r) => r.id === id);
      if (!item) return false;

      item.completed = true;
      item.completedAt = new Date().toISOString();
      this.notify();
      return true;
    },

    deleteReviewItem: async (id: string): Promise<boolean> => {
      await delay(15);
      const prevLen = this._reviews.length;
      this._reviews = this._reviews.filter((r) => r.id !== id);
      const changed = this._reviews.length !== prevLen;
      if (changed) this.notify();
      return changed;
    }
  };

  public routines: IRoutineService = {
    getRoutines: async (): Promise<RecurringStudyRoutine[]> => {
      await delay(20);
      return JSON.parse(JSON.stringify(this._routines));
    },

    createRoutine: async (routineData: Partial<RecurringStudyRoutine>): Promise<RecurringStudyRoutine> => {
      await delay(25);
      if (!routineData.title || !routineData.subjectId || !routineData.daysOfWeek?.length) {
        throw new ValidationError('Routine requires title, subject, and at least one day of the week.');
      }

      const subject = this._subjects.find((s) => s.id === routineData.subjectId);
      const topic = routineData.topicId ? this._topics.find((t) => t.id === routineData.topicId) : undefined;

      const newRoutine: RecurringStudyRoutine = {
        id: `rtn_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        subjectId: routineData.subjectId,
        subjectName: subject?.name || 'General Study',
        topicId: routineData.topicId,
        topicTitle: topic?.title,
        title: routineData.title.trim(),
        targetMinutes: routineData.targetMinutes || 45,
        daysOfWeek: routineData.daysOfWeek,
        scheduledTime: routineData.scheduledTime || '14:00',
        priority: routineData.priority || 'medium',
        isActive: routineData.isActive !== false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this._routines.unshift(newRoutine);
      this.notify();
      return newRoutine;
    },

    updateRoutine: async (id: string, updates: Partial<RecurringStudyRoutine>): Promise<RecurringStudyRoutine> => {
      await delay(25);
      const routine = this._routines.find((r) => r.id === id);
      if (!routine) throw new ValidationError(`Routine "${id}" not found.`);

      if (updates.title !== undefined) routine.title = updates.title.trim();
      if (updates.targetMinutes !== undefined) routine.targetMinutes = updates.targetMinutes;
      if (updates.daysOfWeek !== undefined) routine.daysOfWeek = updates.daysOfWeek;
      if (updates.scheduledTime !== undefined) routine.scheduledTime = updates.scheduledTime;
      if (updates.priority !== undefined) routine.priority = updates.priority;
      if (updates.isActive !== undefined) routine.isActive = updates.isActive;
      if (updates.subjectId !== undefined) {
        routine.subjectId = updates.subjectId;
        const sub = this._subjects.find((s) => s.id === updates.subjectId);
        routine.subjectName = sub?.name;
      }
      if (updates.topicId !== undefined) {
        routine.topicId = updates.topicId;
        const top = this._topics.find((t) => t.id === updates.topicId);
        routine.topicTitle = top?.title;
      }
      routine.updatedAt = new Date().toISOString();

      this.notify();
      return JSON.parse(JSON.stringify(routine));
    },

    deleteRoutine: async (id: string): Promise<boolean> => {
      await delay(20);
      const prevLen = this._routines.length;
      this._routines = this._routines.filter((r) => r.id !== id);
      const changed = this._routines.length !== prevLen;
      if (changed) this.notify();
      return changed;
    },

    materializeRoutinesForToday: async (): Promise<StudyPlanItem[]> => {
      await delay(30);
      const today = new Date();
      const todayStr = getISODateString(today);
      const activeRoutinesForToday = evaluateRoutinesForDate(this._routines, today);
      const addedItems: StudyPlanItem[] = [];

      for (const routine of activeRoutinesForToday) {
        // Check if an item for this routine/title already exists today
        const exists = this._studyPlan.some(
          (p) => (p.scheduledDate === todayStr || !p.scheduledDate) && p.title === routine.title
        );

        if (!exists) {
          const newItem: StudyPlanItem = {
            id: `spl_rtn_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
            subjectId: routine.subjectId,
            subjectName: routine.subjectName || 'General',
            topicId: routine.topicId,
            title: routine.title,
            targetMinutes: routine.targetMinutes,
            scheduledDate: todayStr,
            scheduledTime: routine.scheduledTime,
            priority: routine.priority,
            completed: false
          };
          this._studyPlan.unshift(newItem);
          addedItems.push(newItem);
        }
      }

      if (addedItems.length > 0) this.notify();
      return addedItems;
    }
  };

  public resources: IResourceService = {
    getResources: async (filter?: ResourceFilterOptions): Promise<StudyResource[]> => {
      await delay(20);
      let list = [...this._resources];

      if (filter) {
        if (filter.subjectId) list = list.filter((r) => r.subjectId === filter.subjectId);
        if (filter.topicId) list = list.filter((r) => r.topicId === filter.topicId);
        if (filter.type) list = list.filter((r) => r.type === filter.type);
        if (filter.status) list = list.filter((r) => r.status === filter.status);
        if (filter.search) {
          const q = filter.search.toLowerCase();
          list = list.filter(
            (r) =>
              r.title.toLowerCase().includes(q) ||
              r.author?.toLowerCase().includes(q) ||
              r.tags.some((t) => t.toLowerCase().includes(q))
          );
        }
      }

      return JSON.parse(JSON.stringify(list));
    },

    getResourceById: async (id: string): Promise<StudyResource | null> => {
      await delay(15);
      const res = this._resources.find((r) => r.id === id);
      return res ? JSON.parse(JSON.stringify(res)) : null;
    },

    createResource: async (resourceData: Partial<StudyResource>): Promise<StudyResource> => {
      await delay(25);
      if (!resourceData.title || !resourceData.subjectId) {
        throw new ValidationError('Resource requires a title and associated study subject.');
      }

      const subject = this._subjects.find((s) => s.id === resourceData.subjectId);
      const topic = resourceData.topicId ? this._topics.find((t) => t.id === resourceData.topicId) : undefined;

      const newResource: StudyResource = {
        id: `res_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        subjectId: resourceData.subjectId,
        subjectName: subject?.name || 'General Subject',
        topicId: resourceData.topicId,
        topicTitle: topic?.title,
        title: resourceData.title.trim(),
        author: resourceData.author?.trim() || undefined,
        url: resourceData.url?.trim() || undefined,
        type: resourceData.type || 'paper',
        status: resourceData.status || 'unread',
        rating: resourceData.rating || undefined,
        notes: resourceData.notes?.trim() || undefined,
        tags: Array.isArray(resourceData.tags) ? resourceData.tags : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      this._resources.unshift(newResource);
      this.notify();
      return newResource;
    },

    updateResource: async (id: string, updates: Partial<StudyResource>): Promise<StudyResource> => {
      await delay(25);
      const resource = this._resources.find((r) => r.id === id);
      if (!resource) throw new ValidationError(`Resource "${id}" not found.`);

      if (updates.title !== undefined) resource.title = updates.title.trim();
      if (updates.author !== undefined) resource.author = updates.author.trim() || undefined;
      if (updates.url !== undefined) resource.url = updates.url.trim() || undefined;
      if (updates.type !== undefined) resource.type = updates.type;
      if (updates.status !== undefined) resource.status = updates.status;
      if (updates.rating !== undefined) resource.rating = updates.rating;
      if (updates.notes !== undefined) resource.notes = updates.notes;
      if (updates.tags !== undefined) resource.tags = updates.tags;
      if (updates.subjectId !== undefined) {
        resource.subjectId = updates.subjectId;
        const sub = this._subjects.find((s) => s.id === updates.subjectId);
        resource.subjectName = sub?.name;
      }
      if (updates.topicId !== undefined) {
        resource.topicId = updates.topicId;
        const top = this._topics.find((t) => t.id === updates.topicId);
        resource.topicTitle = top?.title;
      }
      resource.updatedAt = new Date().toISOString();

      this.notify();
      return JSON.parse(JSON.stringify(resource));
    },

    deleteResource: async (id: string): Promise<boolean> => {
      await delay(20);
      const prevLen = this._resources.length;
      this._resources = this._resources.filter((r) => r.id !== id);
      const changed = this._resources.length !== prevLen;
      if (changed) this.notify();
      return changed;
    }
  };

  public reflections: IReflectionService = {
    getReflections: async (limit = 30): Promise<DailyReflection[]> => {
      await delay(20);
      const sorted = [...this._reflections].sort((a, b) => b.date.localeCompare(a.date));
      return JSON.parse(JSON.stringify(sorted.slice(0, limit)));
    },

    getReflectionByDate: async (date: string): Promise<DailyReflection | null> => {
      await delay(15);
      const ref = this._reflections.find((r) => r.date === date);
      return ref ? JSON.parse(JSON.stringify(ref)) : null;
    },

    saveDailyReflection: async (reflectionData: Partial<DailyReflection>): Promise<DailyReflection> => {
      await delay(25);
      const dateStr = reflectionData.date || getISODateString(new Date());
      const existingIdx = this._reflections.findIndex((r) => r.date === dateStr);

      const reflection: DailyReflection = {
        id: existingIdx >= 0 ? this._reflections[existingIdx].id : `ref_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        date: dateStr,
        energyScore: reflectionData.energyScore ?? 4,
        focusScore: reflectionData.focusScore ?? 4,
        wins: Array.isArray(reflectionData.wins) ? reflectionData.wins : [],
        frictionPoints: Array.isArray(reflectionData.frictionPoints) ? reflectionData.frictionPoints : [],
        tomorrowIntentions: Array.isArray(reflectionData.tomorrowIntentions) ? reflectionData.tomorrowIntentions : [],
        synthesisNotes: reflectionData.synthesisNotes?.trim() || undefined,
        completedHabitsCount: reflectionData.completedHabitsCount ?? 0,
        completedTasksCount: reflectionData.completedTasksCount ?? 0,
        studyMinutesLogged: reflectionData.studyMinutesLogged ?? 0,
        reviewCardsCompleted: reflectionData.reviewCardsCompleted ?? 0,
        createdAt: existingIdx >= 0 ? this._reflections[existingIdx].createdAt : new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      if (existingIdx >= 0) {
        this._reflections[existingIdx] = reflection;
      } else {
        this._reflections.unshift(reflection);
      }

      this.notify();
      return JSON.parse(JSON.stringify(reflection));
    },

    deleteReflection: async (id: string): Promise<boolean> => {
      await delay(20);
      const prevLen = this._reflections.length;
      this._reflections = this._reflections.filter((r) => r.id !== id);
      const changed = this._reflections.length !== prevLen;
      if (changed) this.notify();
      return changed;
    }
  };
}
