import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  ArrowRight,
  CheckCircle2,
  Repeat,
  Sparkles,
  Play,
  FileText,
  Moon,
  Clock,
  Plus
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Checkbox } from '../../components/ui/Checkbox/Checkbox';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { cn } from '../../utils/classNames';
import { TimeBlockGrid } from '../../components/features/Planning/TimeBlockGrid';
import { RecurringRoutinesModal } from '../../components/features/Planning/RecurringRoutinesModal';
import { EveningClosureModal } from '../../components/features/Reflection/EveningClosureModal';
import { CognitiveLoadAlert } from '../../components/features/Analytics/CognitiveLoadAlert';
import { PartialDataWarningBanner } from '../../components/feedback/PartialDataWarningBanner';
import { KnowledgeResurfacingCard } from '../../components/features/Notes/KnowledgeResurfacingCard';
import { ExamHorizonBar } from '../../components/features/Goals/ExamHorizonBar';
import { SolarArc } from '../../components/illustrations';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dataService } from '../../services/dataService';
import { Task, TaskTimeBlock } from '../../types/task';
import { WorkloadCapacityBar } from '../tasks/components/WorkloadCapacityBar';
import { SmartTaskInput } from '../tasks/components/SmartTaskInput';
import { TaskRow } from '../tasks/components/TaskRow';
import { calculateWorkload, getDefaultDailyCapacityMinutes, getGentleStartDailyCapacityMinutes } from '../../utils/tasks/workloadCalculator';
import { StudyPlanItem, StudySubject, StudySession, StudyTopic } from '../../types/study';
import { Note } from '../../types/note';
import { Habit } from '../../types/habit';
import { Goal } from '../../types/goal';
import { Flashcard } from '../../types/learning';
import { FocusSession } from '../../types/focus';
import { DailySummary } from '../../types/analytics';
import { RecurringStudyRoutine, TimeBlock } from '../../types/planning';
import { DailyReflection } from '../../types/reflection';
import { getTimeOfDayGreeting, formatFriendlyDate, formatFullDate, getISODateString, addDays } from '../../utils/date';
import { evaluateCognitiveLoad } from '../../utils/intelligence/masteryIntelligence';
import { buildTimeBlocks, findTimeBlockConflicts, calculateTimeAllocation } from '../../utils/planning/timeBlocking';
import { ActivationWelcomeModal } from '../../components/features/Activation/ActivationWelcomeModal';
import { WelcomeBackModal } from '../../components/features/Activation/WelcomeBackModal';
import { NextBestActionCard } from '../../components/features/Activation/NextBestActionCard';
import { getActivationState, calculateNextBestAction } from '../../utils/activation';
import { queryCache } from '../../services/cache';
import './DashboardPage.css';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const navigate = useNavigate();

  const cachedTasks = queryCache.get<Task[]>('tasks:{}');
  const cachedPlan = queryCache.get<StudyPlanItem[]>('study_plan_today');
  const cachedSubjects = queryCache.get<StudySubject[]>('subjects:false');

  const [isLoading, setIsLoading] = useState(() => !cachedTasks && !cachedPlan);
  const [tasks, setTasks] = useState<Task[]>(() => cachedTasks || []);
  const [studyPlan, setStudyPlan] = useState<StudyPlanItem[]>(() => cachedPlan || []);
  const [subjects, setSubjects] = useState<StudySubject[]>(() => cachedSubjects || []);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [recentFocus, setRecentFocus] = useState<FocusSession[]>([]);
  const [routines, setRoutines] = useState<RecurringStudyRoutine[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [taskTimeBlocks, setTaskTimeBlocks] = useState<TaskTimeBlock[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(() => queryCache.get<DailySummary>('daily_summary'));
  const [viewMode, setViewMode] = useState<'lists' | 'timeline'>('lists');

  // Plan §6.3: number of slices that rejected in Promise.allSettled during
  // the last load — > 0 renders the gentle partial-data warning banner.
  const [partialFailureCount, setPartialFailureCount] = useState(0);

  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const lastCompletedTaskIdRef = useRef<{ id: string; timestamp: number } | null>(null);

  // Plan §3.2: "Show all (N) tasks" accordion state (top-5 view is the default).
  const [showAllTasks, setShowAllTasks] = useState(false);

  // Plan §3.4: gentle re-entry after a 3+ day absence. The day-scoped choice
  // key keeps the Gentle Start / Priority Triage effect alive across reloads
  // for the rest of the day. The key is frozen at mount so a page left open
  // across midnight never copies yesterday's choice under the new day's key (P3F4).
  type WelcomeBackChoice = 'gentle_start' | 'priority_triage';
  const [welcomeBackChoiceKey] = useState(() => `solis_welcome_back_choice_${getISODateString(new Date())}`);
  const [isWelcomeBackOpen, setIsWelcomeBackOpen] = useState(false);
  const [welcomeBackChoice, setWelcomeBackChoice] = useState<WelcomeBackChoice | null>(() => {
    try {
      const raw = localStorage.getItem(welcomeBackChoiceKey);
      return raw === 'gentle_start' || raw === 'priority_triage' ? raw : null;
    } catch {
      return null;
    }
  });
  const lastActiveTimestampRef = useRef<number>(0);

  useEffect(() => {
    let previous = 0;
    try {
      previous = Number(localStorage.getItem('solis_last_active_timestamp')) || 0;
    } catch {
      previous = 0;
    }
    lastActiveTimestampRef.current = previous;
    const now = Date.now();
    // 3+ day absence triggers the gentle re-entry flow (first-ever visit never does).
    if (previous > 0 && now - previous >= 3 * 24 * 60 * 60 * 1000) {
      setIsWelcomeBackOpen(true);
    }
    try {
      localStorage.setItem('solis_last_active_timestamp', String(now));
    } catch {
      // storage unavailable — absence detection silently disabled
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(welcomeBackChoiceKey, welcomeBackChoice || '');
  }, [welcomeBackChoiceKey, welcomeBackChoice]);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Workload Realism Calculation
  const workload = useMemo(() => {
    const date = getISODateString(currentTime);
    return calculateWorkload({
      date,
      tasks,
      timeBlocks: taskTimeBlocks,
      // Plan §3.4 "Gentle Start": shared day-scoped 50% capacity override,
      // resolved from the same key the Tasks page reads (P3F5).
      dailyCapacityMinutes: getGentleStartDailyCapacityMinutes(date)
    });
    // `welcomeBackChoice` is a reactive trigger: it changes the moment the
    // gentle option is picked, forcing the memo to re-read the choice key.
  }, [currentTime, tasks, taskTimeBlocks, welcomeBackChoice]);

  // Modals
  const [isClosureModalOpen, setIsClosureModalOpen] = useState(false);
  const [isRoutinesModalOpen, setIsRoutinesModalOpen] = useState(false);
  const [isActivationModalOpen, setIsActivationModalOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    const params = new URLSearchParams(window.location.search);
    if (params.get('onboarding') === 'true') return true;
    const state = getActivationState(user?.id);
    return state !== 'completed' && state !== 'dismissed';
  });
  const [isNextActionDismissed, setIsNextActionDismissed] = useState(false);

  const nextBestAction = useMemo(() => {
    return calculateNextBestAction({
      subjects: subjects.length,
      tasks: tasks.length,
      focusSessions: recentFocus.length,
      notes: notes.length,
      habits: habits.length
    });
  }, [subjects.length, tasks.length, recentFocus.length, notes.length, habits.length]);

  // Time Blocking Memo Calculations
  const timeBlocks = useMemo(() => {
    return buildTimeBlocks({
      studyPlan,
      tasks,
      focusSessions: recentFocus,
      routines,
      taskTimeBlocks,
      targetDate: getISODateString(currentTime)
    });
  }, [studyPlan, tasks, recentFocus, routines, taskTimeBlocks, currentTime]);

  const timeConflicts = useMemo(() => findTimeBlockConflicts(timeBlocks), [timeBlocks]);
  const timeStats = useMemo(() => calculateTimeAllocation(timeBlocks), [timeBlocks]);

  // Daily Intention state
  const todayKey = `solis_daily_intention_${getISODateString(currentTime)}`;
  const [dailyIntention, setDailyIntention] = useState(() => {
    return localStorage.getItem(todayKey) || '';
  });
  const [intentionSaved, setIntentionSaved] = useState(false);
  // Plan §3.2: the intention persists through a 1,000ms debounce so the
  // "✓ Saved" pill no longer flickers on every keystroke.
  const intentionSaveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const latestIntentionRef = useRef(dailyIntention);
  const todayKeyRef = useRef(todayKey);

  useEffect(() => {
    todayKeyRef.current = todayKey;
  }, [todayKey]);

  const handleSaveIntention = (val: string) => {
    setDailyIntention(val);
    latestIntentionRef.current = val;
    const scheduledKey = todayKey;
    if (intentionSaveTimerRef.current) clearTimeout(intentionSaveTimerRef.current);
    intentionSaveTimerRef.current = setTimeout(() => {
      intentionSaveTimerRef.current = null;
      try {
        localStorage.setItem(scheduledKey, latestIntentionRef.current);
      } catch {
        // storage unavailable — intention stays in session state only
      }
      setIntentionSaved(true);
      setTimeout(() => setIntentionSaved(false), 2000);
    }, 1000);
  };

  // Flush a pending intention write on unmount so navigating away within the
  // debounce window never loses the tail of the edit (zero silent data loss).
  useEffect(() => {
    return () => {
      if (intentionSaveTimerRef.current) {
        clearTimeout(intentionSaveTimerRef.current);
        intentionSaveTimerRef.current = null;
        try {
          localStorage.setItem(todayKeyRef.current, latestIntentionRef.current);
        } catch {
          // ignore storage errors
        }
      }
    };
  }, []);

  const greetingInfo = getTimeOfDayGreeting(user?.name || 'Scholar');

  const loadDashboardData = useCallback(async () => {
    try {
      const [
        taskRes,
        planRes,
        subRes,
        noteRes,
        habitRes,
        sessRes,
        focusRes,
        dailySumRes,
        rtnRes,
        refRes,
        blocksRes,
        goalRes,
        flashRes
      ] = await Promise.allSettled([
        dataService.tasks.getTasks(),
        dataService.study.getTodayPlan(),
        dataService.study.getSubjects(),
        dataService.notes.getNotes(),
        dataService.habits.getHabits(),
        dataService.study.getRecentSessions(),
        dataService.focus.getRecentSessions(),
        dataService.analytics.getDailySummary(),
        dataService.routines ? dataService.routines.getRoutines() : Promise.resolve([]),
        dataService.reflections ? dataService.reflections.getReflections(5) : Promise.resolve([]),
        dataService.tasks.getTimeBlocks ? dataService.tasks.getTimeBlocks(getISODateString(new Date())) : Promise.resolve([]),
        dataService.goals ? dataService.goals.getGoals() : Promise.resolve([]),
        dataService.flashcards ? dataService.flashcards.getFlashcards() : Promise.resolve([])
      ]);

      // Plan §6.3 partial fetch failure resilience: fulfilled slices still
      // populate the page (cached data first), while the rejected count
      // drives the gentle retry banner.
      const failedFetches = [taskRes, planRes, subRes, noteRes, habitRes, sessRes, focusRes, dailySumRes, rtnRes, refRes, blocksRes, goalRes, flashRes]
        .filter((res) => res.status === 'rejected');
      if (failedFetches.length > 0) {
        console.warn(
          `[Dashboard] ${failedFetches.length} data slice(s) failed to load:`,
          failedFetches.map((res) => (res as PromiseRejectedResult).reason)
        );
      }
      setPartialFailureCount(failedFetches.length);

      if (taskRes.status === 'fulfilled') setTasks(taskRes.value);
      if (planRes.status === 'fulfilled') setStudyPlan(planRes.value);
      if (subRes.status === 'fulfilled') {
        setSubjects(subRes.value);
        try {
          const topicArrays = await Promise.all(subRes.value.map((s) => dataService.study.getTopics(s.id).catch(() => [])));
          setTopics(topicArrays.flat());
        } catch {
          // secondary
        }
      }
      if (noteRes.status === 'fulfilled') setNotes(noteRes.value);
      if (habitRes.status === 'fulfilled') setHabits(habitRes.value);
      if (sessRes.status === 'fulfilled') setRecentSessions(sessRes.value);
      if (focusRes.status === 'fulfilled') setRecentFocus(focusRes.value);
      if (dailySumRes.status === 'fulfilled') setSummary(dailySumRes.value);
      if (rtnRes.status === 'fulfilled') setRoutines(rtnRes.value);
      if (refRes.status === 'fulfilled') setReflections(refRes.value);
      if (blocksRes.status === 'fulfilled') setTaskTimeBlocks(blocksRes.value);
      if (goalRes.status === 'fulfilled') setGoals(goalRes.value || []);
      if (flashRes.status === 'fulfilled') setFlashcards(flashRes.value || []);

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    // Plan §6.1 scoped entity pub/sub: the Today hub renders every canonical
    // entity channel. Domains outside the enum (routines, reflections,
    // flashcards, analytics) broadcast on 'all' and still reach it.
    const unsubscribe = dataService.subscribe(() => {
      loadDashboardData();
    }, ['tasks', 'habits', 'notes', 'study', 'focus', 'goals']);
    return () => unsubscribe();
  }, [loadDashboardData]);

  const handleCreateFromNLP = async (taskPayload: Partial<Task>) => {
    try {
      const created = await dataService.tasks.createTask({
        title: taskPayload.title || 'Untitled Intentional Task',
        description: taskPayload.description,
        category: taskPayload.category || 'study',
        priority: taskPayload.priority || 'medium',
        subjectId: taskPayload.subjectId,
        goalId: taskPayload.goalId,
        dueDate: taskPayload.dueDate || getISODateString(new Date()),
        dueTime: taskPayload.dueTime,
        estimatedMinutes: taskPayload.estimatedMinutes || 30,
        tags: taskPayload.tags || [],
        recurrence: taskPayload.recurrence,
        isRecurring: taskPayload.isRecurring,
        naturalLanguageInput: taskPayload.naturalLanguageInput
      });
      setTasks((prev) => [created, ...prev]);
      addToast({
        title: 'Task Created',
        description: created.title,
        type: 'success'
      });
    } catch (err: any) {
      addToast({
        title: 'Could not create task',
        description: err?.message || 'Check input details',
        type: 'error'
      });
    }
  };

  const handleDeleteTask = async (id: string) => {
    const prev = tasks;
    setTasks((current) => current.filter((t) => t.id !== id));
    try {
      await dataService.tasks.deleteTask(id);
      addToast({ title: 'Task removed', type: 'info' });
    } catch {
      setTasks(prev);
      addToast({ title: 'Could not delete task', type: 'error' });
    }
  };

  const handleStartFocusOnTask = (task: Task) => {
    const subjectParam = task.subjectId ? `&subjectId=${task.subjectId}` : '';
    navigate(`/app/focus?taskId=${task.id}${subjectParam}&title=${encodeURIComponent(task.title)}`, {
      state: {
        title: task.title,
        subjectId: task.subjectId,
        durationMinutes: task.estimatedMinutes || 30
      }
    });
  };

  const handleUndoCompletion = async (id: string) => {
    try {
      const updated = await dataService.tasks.toggleTaskCompletion(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      addToast({
        title: 'Task Restored',
        description: updated.title,
        type: 'info'
      });
      lastCompletedTaskIdRef.current = null;
    } catch {
      addToast({ title: 'Undo failed', type: 'error' });
    }
  };

  const handleToggleTask = async (id: string) => {
    const prevTasks = tasks;
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    const nextStatus = target.status === 'completed' ? 'todo' : 'completed';
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: nextStatus } : t)));

    try {
      const updated = await dataService.tasks.toggleTaskCompletion(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      if (updated.status === 'completed') {
        lastCompletedTaskIdRef.current = { id, timestamp: Date.now() };
        addToast({
          title: 'Task Completed',
          description: updated.title,
          type: 'success',
          durationMs: 5000,
          action: {
            label: 'Undo (⌘Z)',
            onClick: () => handleUndoCompletion(id)
          }
        });
      } else {
        addToast({
          title: 'Task Reopened',
          description: updated.title,
          type: 'info'
        });
      }
    } catch {
      setTasks(prevTasks);
      addToast({
        title: 'Update failed',
        type: 'error'
      });
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        if (lastCompletedTaskIdRef.current) {
          const { id, timestamp } = lastCompletedTaskIdRef.current;
          if (Date.now() - timestamp < 5000) {
            e.preventDefault();
            handleUndoCompletion(id);
          }
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Plan §3.3: one-tap Zeigarnik deferral — "→ Tomorrow" moves an overdue task
  // to tomorrow, increments its deferral count, and offers an undo toast.
  const handleDeferTaskToTomorrow = async (task: Task) => {
    const tomorrowKey = getISODateString(addDays(new Date(), 1));
    const prevDueDate = task.dueDate;
    const nextDeferralCount = (task.deferralCount || 0) + 1;
    setTasks((prev) =>
      prev.map((t) => (t.id === task.id ? { ...t, dueDate: tomorrowKey, deferralCount: nextDeferralCount } : t))
    );
    try {
      const updated = await dataService.tasks.updateTask(task.id, {
        dueDate: tomorrowKey,
        deferralCount: nextDeferralCount
      });
      setTasks((prev) => prev.map((t) => (t.id === updated.id ? { ...updated, deferralCount: nextDeferralCount } : t)));
      const undoDeferral = async () => {
        try {
          const restored = await dataService.tasks.updateTask(task.id, {
            ...(prevDueDate ? { dueDate: prevDueDate } : {}),
            deferralCount: task.deferralCount || 0
          });
          setTasks((prev) => prev.map((t) => (t.id === restored.id ? restored : t)));
          addToast({ title: 'Deferral Undone', description: restored.title, type: 'info' });
        } catch {
          addToast({ title: 'Undo failed', type: 'error' });
        }
      };
      addToast({
        title: 'Moved to Tomorrow',
        description: `"${updated.title}" — no rush, it will be waiting for you.`,
        type: 'info',
        durationMs: 5000,
        action: { label: 'Undo', onClick: undoDeferral }
      });
    } catch {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, dueDate: prevDueDate, deferralCount: task.deferralCount || 0 } : t))
      );
      addToast({ title: 'Could not defer task', type: 'error' });
    }
  };

  // Plan §3.4 helpers — gentle re-entry options chosen in WelcomeBackModal.

  /** Local dates strictly between the last active day and today (the absence). */
  const computeAbsenceDayKeys = (): string[] => {
    const previous = lastActiveTimestampRef.current;
    if (!previous) return [];
    const days: string[] = [];
    const cursor = new Date(previous);
    cursor.setHours(12, 0, 0, 0);
    cursor.setDate(cursor.getDate() + 1);
    const todayKey = getISODateString(new Date());
    while (getISODateString(cursor) < todayKey) {
      days.push(getISODateString(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return days;
  };

  const handleGentleStart = () => {
    // Written synchronously so the workload memo's re-read of the choice key
    // (triggered by the state change below) sees the gentle flag immediately.
    try {
      localStorage.setItem(welcomeBackChoiceKey, 'gentle_start');
    } catch {
      // storage unavailable — gentle start applies to this session's state only
    }
    setWelcomeBackChoice('gentle_start');
    addToast({
      title: 'Gentle Start Active',
      description: 'Today’s capacity is set to half — ease back in.',
      type: 'info'
    });
  };

  const handleStreakAmnesty = async () => {
    const absenceDays = computeAbsenceDayKeys();
    if (habits.length === 0 || absenceDays.length === 0) {
      addToast({
        title: 'Nothing To Excuse',
        description: 'Your habit streaks are already intact.',
        type: 'info'
      });
      return;
    }
    // P3F6: settle per habit so a partial server failure only leaves the
    // failed habits untouched — successful amnesties stay applied instead of
    // a single catch rolling back the whole batch.
    const results = await Promise.allSettled(
      habits.map((h) =>
        dataService.habits.updateHabit(h.id, {
          amnestyDates: Array.from(new Set([...(h.amnestyDates || []), ...absenceDays])).sort()
        })
      )
    );
    const fulfilledById = new Map<string, Habit>();
    results.forEach((res, index) => {
      if (res.status === 'fulfilled') fulfilledById.set(habits[index].id, res.value);
    });
    const failedCount = results.length - fulfilledById.size;

    if (fulfilledById.size > 0) {
      setHabits((prev) => prev.map((h) => fulfilledById.get(h.id) || h));
    }
    if (failedCount === 0) {
      addToast({
        title: 'Streaks Protected',
        description: 'Your absence days are excused — habit continuity stays intact.',
        type: 'success'
      });
    } else if (fulfilledById.size > 0) {
      addToast({
        title: 'Amnesty Partially Applied',
        description: `${fulfilledById.size} of ${habits.length} rituals excused — retry the rest anytime.`,
        type: 'warning'
      });
    } else {
      addToast({ title: 'Could not apply streak amnesty', type: 'error' });
    }
  };

  const handlePriorityTriage = () => {
    setWelcomeBackChoice('priority_triage');
    addToast({
      title: 'Priority Triage Active',
      description: 'Showing only your Top 3 tasks — the backlog can wait.',
      type: 'info'
    });
  };

  const handleToggleHabit = async (id: string) => {
    const prevHabits = habits;
    try {
      const updated = await dataService.habits.toggleHabitToday(id);
      setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
      addToast({
        title: updated.completedToday ? 'Ritual Recorded' : 'Ritual Reset',
        description: `${updated.title} — Current streak: ${updated.currentStreak} days`,
        type: 'info'
      });
    } catch {
      setHabits(prevHabits);
      addToast({
        title: 'Habit update failed',
        type: 'error'
      });
    }
  };

  const handleCreateRoutine = async (routineData: Partial<RecurringStudyRoutine>) => {
    try {
      await dataService.routines.createRoutine(routineData);
      addToast({ title: 'Routine Saved', description: routineData.title, type: 'success' });
      await loadDashboardData();
    } catch {
      addToast({ title: 'Could not create routine', type: 'error' });
    }
  };

  const handleToggleRoutine = async (id: string, isActive: boolean) => {
    try {
      await dataService.routines.updateRoutine(id, { isActive });
      await loadDashboardData();
    } catch {
      addToast({ title: 'Update failed', type: 'error' });
    }
  };

  const handleDeleteRoutine = async (id: string) => {
    try {
      await dataService.routines.deleteRoutine(id);
      addToast({ title: 'Routine removed', type: 'info' });
      await loadDashboardData();
    } catch {
      addToast({ title: 'Delete failed', type: 'error' });
    }
  };

  const handleSyncRoutinesToday = async () => {
    try {
      const added = await dataService.routines.materializeRoutinesForToday();
      if (added.length > 0) {
        addToast({ title: 'Routines Synced', description: `${added.length} study plan block(s) added to Today.`, type: 'success' });
      } else {
        addToast({ title: 'Schedule Up to Date', description: 'All active routines for today are already queued.', type: 'info' });
      }
      await loadDashboardData();
    } catch {
      addToast({ title: 'Sync failed', type: 'error' });
    }
  };

  const handleToggleTimeBlock = async (block: TimeBlock) => {
    if (block.type === 'study_plan') {
      try {
        await dataService.study.togglePlanItem(block.entityId);
        await loadDashboardData();
      } catch {
        addToast({ title: 'Update failed', type: 'error' });
      }
    } else if (block.type === 'task_deadline') {
      await handleToggleTask(block.entityId);
    } else if (block.type === 'task_block') {
      try {
        const nextStatus = block.completed ? 'planned' : 'completed';
        if (dataService.tasks.updateTimeBlock) {
          await dataService.tasks.updateTimeBlock(block.entityId, { status: nextStatus });
        }
        await loadDashboardData();
      } catch {
        addToast({ title: 'Update failed', type: 'error' });
      }
    }
  };

  const handleLaunchTimeBlockFocus = (block: TimeBlock) => {
    const params = new URLSearchParams();
    if (block.subjectId) params.set('subjectId', block.subjectId);
    params.set('title', block.title);
    if (block.type === 'task_deadline') {
      params.set('taskId', block.entityId);
    } else if (block.type === 'study_plan') {
      params.set('planId', block.entityId);
    } else if (block.type === 'task_block') {
      params.set('blockId', block.entityId);
      const matchedBlock = taskTimeBlocks.find(tb => tb.id === block.entityId);
      if (matchedBlock?.taskId) {
        params.set('taskId', matchedBlock.taskId);
      }
    }
    navigate(`/app/focus?${params.toString()}`);
  };

  const handleSaveEveningClosure = async (refData: Partial<DailyReflection>) => {
    try {
      if (dataService.reflections) {
        await dataService.reflections.saveDailyReflection(refData);
      }

      if (refData.tomorrowIntentions && refData.tomorrowIntentions.length > 0) {
        for (const intention of refData.tomorrowIntentions) {
          const trimmed = intention?.trim();
          if (trimmed) {
            try {
              await dataService.tasks.createTask({
                title: trimmed,
                category: 'deep_work',
                priority: 'high',
                tags: ['tomorrow-priority']
              });
            } catch (taskErr) {
              console.warn('Could not auto-create tomorrow intention task:', taskErr);
            }
          }
        }
      }

      if (refData.synthesisNotes && refData.synthesisNotes.trim()) {
        try {
          const cleanNotes = refData.synthesisNotes.trim();
          const winsList = (refData.wins || []).filter(Boolean).map((w) => `- ${w}`).join('\n');
          const intentionsList = (refData.tomorrowIntentions || []).filter(Boolean).map((t) => `- ${t}`).join('\n');

          await dataService.notes.createNote({
            title: `Daily Reflection — ${formatFriendlyDate(getISODateString())}`,
            content: `${cleanNotes}${winsList ? `\n\n**Key Wins:**\n${winsList}` : ''}${intentionsList ? `\n\n**Tomorrow's Intentions:**\n${intentionsList}` : ''}`,
            category: 'reflection',
            tags: ['daily-closure', 'reflection']
          });
        } catch (noteErr) {
          console.warn('Could not auto-create reflection note:', noteErr);
        }
      }

      addToast({
        title: 'Evening Closure Recorded',
        description: 'Daily reflection, wins, and tomorrow intentions saved.',
        type: 'success'
      });
      await loadDashboardData();
    } catch (err) {
      console.error('Evening closure save error:', err);
      addToast({
        title: 'Closure failed to save',
        description: err instanceof Error ? err.message : 'Please verify reflection entries',
        type: 'error'
      });
    }
  };

  const cognitiveReport = useMemo(() => {
    return evaluateCognitiveLoad({
      focusSessions: recentFocus,
      studySessions: recentSessions,
      reflections
    });
  }, [recentFocus, recentSessions, reflections]);

  // Plan §3.2: priority triage — sort active tasks by priority
  // (urgent → high → medium → low) and due date before rendering.
  const activeTasks = useMemo(() => {
    const priorityRank: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
    return tasks
      .filter((t) => t.status !== 'completed')
      .sort((a, b) => {
        const priorityDelta = (priorityRank[a.priority] ?? 2) - (priorityRank[b.priority] ?? 2);
        if (priorityDelta !== 0) return priorityDelta;
        if (!a.dueDate && !b.dueDate) return 0;
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      });
  }, [tasks]);

  if (isLoading) {
    return (
      <div className="solis-cockpit-layout">
        <Skeleton height="140px" style={{ borderRadius: '12px' }} />
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
          <Skeleton height="340px" style={{ borderRadius: '12px' }} />
          <Skeleton height="340px" style={{ borderRadius: '12px' }} />
        </div>
      </div>
    );
  }

  return (
    <div className="solis-cockpit-layout">
      {/* Plan §6.3: gentle notice when some slices of the last load could not
          be fetched — cached data stays visible, retry is one click away. */}
      <PartialDataWarningBanner failedCount={partialFailureCount} onRetry={loadDashboardData} />

      {/* 01 // THE SOLAR HORIZON (Arrival Hero & Living Sky) */}
      <header className="solis-solar-hero" role="banner">
        <div className="solis-solar-hero__main">
          <div className="solis-solar-hero__top">
            <div className="solis-solar-hero__greeting">
              <div className="solis-solar-date-badge">
                <span className="solis-solar-date-badge__dot" aria-hidden="true" />
                <span>{formatFullDate(currentTime)}</span>
                <span>•</span>
                <span>{greetingInfo.period}</span>
              </div>
              <h1 className="solis-solar-heading">{greetingInfo.greeting}</h1>
              <p className="solis-solar-quote">{greetingInfo.suggestion}</p>

              {/* Daily Intention Anchor Bar */}
              <div className="solis-intention-strip">
                <Sparkles size={16} className="solis-intention-icon" aria-hidden="true" />
                <input
                  type="text"
                  value={dailyIntention}
                  onChange={(e) => handleSaveIntention(e.target.value)}
                  placeholder="What is your main study goal today? (e.g. Finish Math Chapter 3)"
                  className="solis-intention-input"
                  aria-label="What is your main study goal today?"
                />
                {intentionSaved && (
                  <span className="solis-intention-pill" aria-live="polite">
                    ✓ Saved
                  </span>
                )}
              </div>
            </div>

            <div className="solis-solar-hero__controls">
              <div data-cursor="examine">
                <SolarArc currentDate={currentTime} />
              </div>
              <Button
                variant="primary"
                size="md"
                className="solis-focus-primary-btn tactile-press"
                leftIcon={<Flame size={16} />}
                onClick={() => navigate('/app/focus')}
                data-cursor="action"
              >
                Start Focus Session
              </Button>
              {/* Evening Closure primary CTA after 17:00 (Zone 1) */}
              {currentTime.getHours() >= 17 && (
                <Button
                  variant="accent"
                  size="md"
                  className="tactile-press"
                  leftIcon={<Moon size={16} />}
                  onClick={() => setIsClosureModalOpen(true)}
                >
                  Evening Closure
                </Button>
              )}
            </div>
          </div>

          {/* Next Best Action Banner if not dismissed */}
          {!isNextActionDismissed && nextBestAction.id !== 'action_continue_flow' && (
            <NextBestActionCard
              action={nextBestAction}
              onDismiss={() => setIsNextActionDismissed(true)}
            />
          )}
        </div>
      </header>

      {/* 01.5 // ACADEMIC EXAM HORIZON (Full-Width Banner when Exam Mode is Active) */}
      <ExamHorizonBar
        goals={goals}
        topics={topics}
        flashcards={flashcards}
        habits={habits}
        dailyCapacity={getDefaultDailyCapacityMinutes()}
        onRefresh={loadDashboardData}
      />
 
      {/* Cognitive Load Alert if needed */}
      {cognitiveReport.status !== 'optimal' && (
        <CognitiveLoadAlert report={cognitiveReport} />
      )}

      {/* ZONES 3 & 4 // ASYMMETRIC MASTER GRID (Priority Tasks left / Unified Schedule right) */}
      <div className="solis-cockpit-grid">
        {/* ZONE 3 — LEFT COLUMN: PRIORITY TASKS & QUICK CAPTURE */}
        <main className="solis-cockpit-stage">
          {/* Today's Deliberate Intentions (Integrated Tasks & Capacity) */}
          <section className="solis-panel" aria-label="Today Priority Queue">
            <div className="solis-panel__header">
              <div className="solis-panel__title-group">
                <CheckCircle2 size={16} className="solis-panel__icon" aria-hidden="true" />
                <h2 className="solis-panel__title">Today Priority Queue</h2>
                <span className="solis-panel__badge">
                  {activeTasks.length} {activeTasks.length === 1 ? 'action' : 'actions'}
                </span>
              </div>
              <Link to="/app/tasks">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={13} />}>
                  All Tasks ({tasks.length})
                </Button>
              </Link>
            </div>

            {/* Integrated Capacity Bar */}
            <div className="solis-actions-capacity">
              <WorkloadCapacityBar
                workload={workload}
                onAutoReplanCandidates={() => navigate('/app/tasks')}
              />
            </div>

            {/* Smart NLP Input */}
            <div className="solis-actions-input-wrap">
              <SmartTaskInput
                onCommit={handleCreateFromNLP}
                subjects={subjects}
                defaultDueDate={getISODateString(currentTime)}
                placeholder='Add intention for today... (e.g. "Review DSA at 4pm for 45m !high")'
              />
            </div>

            {/* Task Rows — top-5 triage view with a "Show all" accordion (plan §3.2);
                Priority Triage (plan §3.4) narrows the view to the Top 3 only */}
            {activeTasks.length === 0 ? (
              <div className="solis-empty-stub">
                <span>All deliberate intentions completed. Ready to reflect or rest.</span>
                <Button variant="subtle" size="sm" onClick={() => navigate('/app/tasks')}>
                  View Completed
                </Button>
              </div>
            ) : (
              <div className="solis-actions-list">
                {(welcomeBackChoice === 'priority_triage'
                  ? activeTasks.slice(0, 3)
                  : showAllTasks
                  ? activeTasks
                  : activeTasks.slice(0, 5)
                ).map((task) => {
                  const linkedSub = subjects.find((s) => s.id === task.subjectId);
                  return (
                    <TaskRow
                      key={task.id}
                      task={task}
                      subject={linkedSub}
                      onToggle={handleToggleTask}
                      onEdit={() => navigate('/app/tasks')}
                      onDelete={handleDeleteTask}
                      onStartFocus={handleStartFocusOnTask}
                      showScheduleAction={false}
                      onDeferToTomorrow={handleDeferTaskToTomorrow}
                    />
                  );
                })}
                {welcomeBackChoice !== 'priority_triage' && activeTasks.length > 5 && (
                  <button
                    type="button"
                    className="solis-tasks-show-all-btn"
                    onClick={() => setShowAllTasks((prev) => !prev)}
                    aria-expanded={showAllTasks}
                  >
                    {showAllTasks
                      ? 'Show top 5 only'
                      : `Show all (${activeTasks.length}) tasks`}
                  </button>
                )}
              </div>
            )}
          </section>
        </main>

        {/* ZONE 4 — RIGHT COLUMN: UNIFIED TODAY SCHEDULE */}
        <aside className="solis-cockpit-vault" aria-label="Unified Today Schedule">
          {/* Living 24H Schedule Ribbon */}
          <section className="solis-panel" aria-label="24-Hour Schedule & Timeline">
            <div className="solis-panel__header">
              <div className="solis-panel__title-group">
                <Clock size={16} className="solis-panel__icon" aria-hidden="true" />
                <h2 className="solis-panel__title">24-Hour Schedule & Timeline</h2>
                <span className="solis-panel__badge">
                  {timeBlocks.length} {timeBlocks.length === 1 ? 'block' : 'blocks'} • {timeStats.totalPlannedMinutes}m
                </span>
              </div>
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode(viewMode === 'timeline' ? 'lists' : 'timeline')}
                >
                  {viewMode === 'timeline' ? 'Compact Ribbon' : 'Expanded Grid'}
                </Button>
                <Button
                  variant="subtle"
                  size="sm"
                  leftIcon={<Repeat size={13} />}
                  onClick={() => setIsRoutinesModalOpen(true)}
                >
                  Routines ({routines.length})
                </Button>
              </div>
            </div>

            {viewMode === 'timeline' ? (
              <TimeBlockGrid
                blocks={timeBlocks}
                stats={timeStats}
                conflicts={timeConflicts}
                onToggleComplete={handleToggleTimeBlock}
                onLaunchFocus={handleLaunchTimeBlockFocus}
              />
            ) : (
              <div>
                {/* Ribbon Hour Track with Needle */}
                <div className="solis-ribbon-track">
                  <div className="solis-ribbon-hours">
                    {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((hr) => (
                      <span key={hr}>{hr}</span>
                    ))}
                  </div>
                  {currentTime.getHours() >= 8 && currentTime.getHours() <= 20 && (
                    <div
                      className="solis-ribbon-needle"
                      style={{
                        left: `${Math.min(100, Math.max(0, ((currentTime.getHours() - 8) * 60 + currentTime.getMinutes()) / (12 * 60) * 100))}%`
                      }}
                      title={`Current: ${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`}
                      aria-hidden="true"
                    />
                  )}
                </div>

                {timeBlocks.length === 0 ? (
                  <div className="solis-empty-stub">
                    <span>No study blocks scheduled today. Establish your first focus block.</span>
                    <Button variant="subtle" size="sm" onClick={() => navigate('/app/tasks')}>
                      Open Hourly Planner
                    </Button>
                  </div>
                ) : (
                  <div className="solis-ribbon-blocks">
                    {timeBlocks.slice(0, 4).map((block) => (
                      <div key={block.id} className={cn('solis-ribbon-item', block.completed && 'solis-ribbon-item--completed')}>
                        <span className="solis-ribbon-item__time">{block.startTime} – {block.endTime}</span>
                        <div className="solis-ribbon-item__main">
                          <span className="solis-ribbon-item__title">{block.title}</span>
                          {block.subjectName && (
                            <span className="solis-ribbon-item__sub">{block.subjectName}</span>
                          )}
                        </div>
                        <Button
                          variant="subtle"
                          size="sm"
                          className="tactile-press"
                          leftIcon={<Play size={11} />}
                          onClick={() => handleLaunchTimeBlockFocus(block)}
                        >
                          Focus
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </aside>
      </div>

      {/* ZONE 5 — BOTTOM ROW: DUE RECALL & DAILY HABITS (Balanced 2-Column Foundation) */}
      <section className="solis-zone-strip" aria-label="Due Recall & Daily Habits">
        {/* Knowledge Studio Resurfacing (Due Recall) */}
        <section className="solis-panel" aria-label="Knowledge Studio Resurfacing">
          <div className="solis-panel__header">
            <div className="solis-panel__title-group">
              <FileText size={16} className="solis-panel__icon" aria-hidden="true" />
              <h2 className="solis-panel__title">Active Knowledge</h2>
            </div>
            <Link to="/app/notes">
              <Button variant="ghost" size="sm">Notes Studio</Button>
            </Link>
          </div>

          <KnowledgeResurfacingCard notes={notes} />
        </section>

        {/* Daily Rituals & Habit Pulse */}
        <section className="solis-panel" aria-label="Daily Rituals & Habits">
          <div className="solis-panel__header">
            <div className="solis-panel__title-group">
              <Repeat size={16} className="solis-panel__icon" aria-hidden="true" />
              <h2 className="solis-panel__title">Daily Rituals</h2>
              <span className="solis-panel__badge">
                {habits.filter((h) => h.completedToday).length}/{habits.length}
              </span>
            </div>
            <Link to="/app/habits">
              <Button variant="ghost" size="sm">Habits</Button>
            </Link>
          </div>

          {habits.length === 0 ? (
            <div className="solis-empty-stub">
              <Repeat size={20} className="solis-empty-stub-icon" aria-hidden="true" />
              <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>No Daily Rituals Active</span>
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', maxWidth: '360px' }}>
                Build long-term momentum through small, consistent daily study habits.
              </span>
              <Button variant="subtle" size="sm" leftIcon={<Plus size={13} />} onClick={() => navigate('/app/habits')}>
                Create Habit
              </Button>
            </div>
          ) : (
            <div className="solis-habit-pulse-list solis-habit-pulse-list--all">
              {habits.map((h) => (
                <div key={h.id} className="solis-habit-pulse-item">
                  <div className="solis-habit-pulse-item__info">
                    <span
                      className="solis-habit-pulse-item__title"
                      style={{ textDecoration: h.completedToday ? 'line-through' : 'none', opacity: h.completedToday ? 0.65 : 1 }}
                    >
                      {h.title}
                    </span>
                    <span className="solis-habit-pulse-item__streak" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                      <Flame size={12} color="var(--accent-terracotta)" aria-hidden="true" />
                      <span>{h.currentStreak}d streak {h.frequency ? `• ${h.frequency.replace(/_/g, ' ')}` : ''}</span>
                    </span>
                  </div>
                  <Checkbox
                    checked={h.completedToday}
                    onChange={() => handleToggleHabit(h.id)}
                    aria-label={`Toggle habit ${h.title}`}
                  />
                </div>
              ))}
            </div>
          )}
        </section>
      </section>

      {/* Evening Closure & Reflection Ritual Modal */}
      <EveningClosureModal
        isOpen={isClosureModalOpen}
        onClose={() => setIsClosureModalOpen(false)}
        todaySummary={{
          studyMinutes: summary?.totalStudyMinutes || 0,
          tasksCompleted: tasks.filter((t) => t.status === 'completed').length,
          habitsCompleted: habits.filter((h) => h.completedToday).length,
          reviewsCompleted: 0
        }}
        onSaveReflection={handleSaveEveningClosure}
      />

      {/* Recurring Routines Management Modal */}
      <RecurringRoutinesModal
        isOpen={isRoutinesModalOpen}
        onClose={() => setIsRoutinesModalOpen(false)}
        routines={routines}
        subjects={subjects}
        topics={topics}
        onCreateRoutine={handleCreateRoutine}
        onToggleRoutine={handleToggleRoutine}
        onDeleteRoutine={handleDeleteRoutine}
        onSyncToday={handleSyncRoutinesToday}
      />

      {/* Activation & First-Time Onboarding Modal */}
      <ActivationWelcomeModal
        isOpen={isActivationModalOpen}
        onClose={() => setIsActivationModalOpen(false)}
        counts={{
          subjects: subjects.length,
          tasks: tasks.length,
          focusSessions: recentFocus.length,
          notes: notes.length,
          habits: habits.length
        }}
        userId={user?.id}
      />

      {/* Plan §3.4: Gentle Re-Entry after a 3+ day absence */}
      <WelcomeBackModal
        isOpen={isWelcomeBackOpen}
        onClose={() => setIsWelcomeBackOpen(false)}
        onGentleStart={handleGentleStart}
        onStreakAmnesty={handleStreakAmnesty}
        onPriorityTriage={handlePriorityTriage}
      />
    </div>
  );
};

export default DashboardPage;
