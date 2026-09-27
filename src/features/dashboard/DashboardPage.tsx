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
  Plus,
  Sun,
  AlertTriangle,
  BookOpen
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Checkbox } from '../../components/ui/Checkbox/Checkbox';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { cn } from '../../utils/classNames';
import { TimeBlockGrid } from '../../components/features/Planning/TimeBlockGrid';
import { RecurringRoutinesModal } from '../../components/features/Planning/RecurringRoutinesModal';
import { EveningClosureModal } from '../../components/features/Reflection/EveningClosureModal';
import { MorningPlanningModal } from '../../components/features/Planning/MorningPlanningModal';
import { CognitiveLoadAlert } from '../../components/features/Analytics/CognitiveLoadAlert';
import { PartialDataWarningBanner } from '../../components/feedback/PartialDataWarningBanner';
import { KnowledgeResurfacingCard } from '../../components/features/Notes/KnowledgeResurfacingCard';
import { ExamHorizonBar } from '../../components/features/Goals/ExamHorizonBar';
import { AmbientPeerPresenceWidget } from '../../components/features/Presence/AmbientPeerPresenceWidget';
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
import { createLearningIntelligenceSnapshot } from '../../utils/intelligence';
import { calculateDailySummary } from '../../utils/productivity';
import { ExplainableRecommendation } from '../../types/learningIntelligence';
import { DashboardIntelligenceBrief } from '../../components/features/Intelligence/DashboardIntelligenceBrief';
import { UnifiedReflectionsTimeline } from '../../components/features/Reflection/UnifiedReflectionsTimeline';
import { buildTimeBlocks, findTimeBlockConflicts, calculateTimeAllocation } from '../../utils/planning/timeBlocking';
import { projectScheduleEntriesToTimeBlocks } from '../../utils/planning/scheduleProjections';
import { ScheduleEntry } from '../../types/schedule';
import { evaluateHabitTier, getTierMeta } from '../../utils/habits/tieredHabits';
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
  // V2 Phase 1 (C3): canonical schedule entries for today + due-review count.
  const [scheduleEntries, setScheduleEntries] = useState<ScheduleEntry[]>([]);
  const [dueReviewCount, setDueReviewCount] = useState(0);
  // V2 Phase 1 (C5): open proposals for the triage badge.
  const [openProposalCount, setOpenProposalCount] = useState(0);
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
  const [isMorningModalOpen, setIsMorningModalOpen] = useState(false);
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
  // V2 Phase 1 (P1-05) — flagged hybrid cutover, first surface: when the
  // canonical model has entries for today, the timeline PROJECTS from it
  // (entityId still points at the owning domain, so toggles behave exactly
  // as before). When the model is empty for today (fresh account, or
  // backfill still running), the V1 derivation keeps rendering.
  const timeBlocks = useMemo(() => {
    if (scheduleEntries.length > 0) {
      return projectScheduleEntriesToTimeBlocks(scheduleEntries, getISODateString(currentTime));
    }
    return buildTimeBlocks({
      studyPlan,
      tasks,
      focusSessions: recentFocus,
      routines,
      taskTimeBlocks,
      targetDate: getISODateString(currentTime)
    });
  }, [scheduleEntries, studyPlan, tasks, recentFocus, routines, taskTimeBlocks, currentTime]);

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
      // V2 Phase 1 (P1-08/C2): the intention is user_content — it follows the
      // student to any device. localStorage stays as the offline cache.
      void dataService.stateSync
        .put(`intention:${getISODateString(new Date())}`, 'user_content', { text: latestIntentionRef.current })
        .catch(() => {});
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

  // V2 Phase 1 (P1-08/C2): read-through from the state-continuity service —
  // a second device (or a re-login) adopts the cloud values when present.
  useEffect(() => {
    const today = getISODateString(new Date());
    void dataService.stateSync
      .get(`intention:${today}`)
      .then((item) => {
        const payload = item?.payload as { text?: string } | null;
        if (payload && typeof payload.text === 'string') setDailyIntention(payload.text);
      })
      .catch(() => {});
    void dataService.stateSync
      .get(`ritual:morning:${today}`)
      .then((item) => {
        const payload = item?.payload as { completed?: boolean } | null;
        if (payload?.completed) setIsMorningPlanned(true);
      })
      .catch(() => {});
  }, []);

  // Phase 0 P0.3: the morning ritual persists its completion record
  // (MorningPlanningModal writes solis_morning_calibration_<date>); the CTA
  // swaps to a done-state instead of repeating the same invitation all morning.
  const [isMorningPlanned, setIsMorningPlanned] = useState(() => {
    try {
      return Boolean(localStorage.getItem(`solis_morning_calibration_${getISODateString(new Date())}`));
    } catch {
      return false;
    }
  });

  // Phase 0 P0.8: today's intention can be linked to an active goal so the
  // intention strip feeds the goals system instead of vanishing into free text.
  const [intentionGoalId, setIntentionGoalId] = useState(() => {
    try {
      return localStorage.getItem(`solis_daily_intention_goal_${getISODateString(new Date())}`) || '';
    } catch {
      return '';
    }
  });

  const handleLinkIntentionGoal = (goalId: string) => {
    setIntentionGoalId(goalId);
    try {
      localStorage.setItem(`solis_daily_intention_goal_${getISODateString(currentTime)}`, goalId);
    } catch {
      // storage unavailable — the link stays in session state only
    }
  };

  const greetingInfo = getTimeOfDayGreeting(user?.name || 'Scholar');

  const loadDashboardData = useCallback(async () => {
    try {
      const today = getISODateString(new Date());

      // V2 Phase 1 (P1-03/P1-16): idempotent backfill of the canonical
      // schedule model and auto-materialization of recurring routines —
      // both once per day, both fire-and-forget (never block the load).
      try {
        const backfillKey = `solis_v2_backfilled_${today}`;
        if (!localStorage.getItem(backfillKey)) {
          localStorage.setItem(backfillKey, '1');
          void dataService.schedule.backfillFromSources().catch(() => {});
        }
        const routinesKey = `solis_routines_materialized_${today}`;
        if (!localStorage.getItem(routinesKey) && dataService.routines?.materializeRoutinesForToday) {
          localStorage.setItem(routinesKey, '1');
          void dataService.routines.materializeRoutinesForToday().catch(() => {});
        }
      } catch {
        // storage unavailable — backfill simply runs unguarded
      }

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
        flashRes,
        scheduleRes,
        proposalsRes
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
        dataService.flashcards ? dataService.flashcards.getFlashcards() : Promise.resolve([]),
        dataService.schedule.getEntriesForDate(today),
        dataService.proposals.countOpen()
      ]);

      // Plan §6.3 partial fetch failure resilience: fulfilled slices still
      // populate the page (cached data first), while the rejected count
      // drives the gentle retry banner.
      const failedFetches = [taskRes, planRes, subRes, noteRes, habitRes, sessRes, focusRes, dailySumRes, rtnRes, refRes, blocksRes, goalRes, flashRes, scheduleRes, proposalsRes]
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
      if (flashRes.status === 'fulfilled') {
        setFlashcards(flashRes.value || []);
        // V2 Phase 1 (P1-10): due-review materialization — one defended
        // review block when spaced-repetition cards are due, capped at 30m.
        try {
          const todayKey = getISODateString(new Date());
          const dueCount = (flashRes.value || []).filter((f) => {
            const due = f.nextReviewDate || (f as unknown as { dueDate?: string }).dueDate;
            return due && due <= todayKey;
          }).length;
          setDueReviewCount(dueCount);
          if (dueCount > 0) {
            const durationMinutes = Math.max(15, Math.min(30, Math.ceil(dueCount / 4) * 5));
            await dataService.schedule.upsertFromSource({
              sourceKind: 'review',
              sourceId: `review-${todayKey}`,
              title: `Due recall — ${dueCount} card${dueCount === 1 ? '' : 's'}`,
              date: todayKey,
              durationMinutes,
              entryType: 'defended',
              provenance: { dueCount }
            });
          }
        } catch {
          // materialization is best-effort; the banner still shows the count
        }
      }
      if (scheduleRes.status === 'fulfilled') setScheduleEntries(scheduleRes.value);
      if (proposalsRes.status === 'fulfilled') setOpenProposalCount(proposalsRes.value);

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
    }, ['tasks', 'habits', 'notes', 'study', 'focus', 'goals', 'schedule', 'proposals']);
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
    // V2 Phase 1 (C2): the welcome-back choice is user_content — it follows
    // the student across devices so a second login gets the same calm entry.
    void dataService.stateSync
      .put(`welcomeback:choice:${getISODateString(new Date())}`, 'user_content', { choice: 'gentle_start' })
      .catch(() => {});
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
    // V2 Phase 1 (C2): the welcome-back choice is user_content.
    void dataService.stateSync
      .put(`welcomeback:choice:${getISODateString(new Date())}`, 'user_content', { choice: 'priority_triage' })
      .catch(() => {});
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
    } else if (block.type === 'review' || block.type === 'rest' || block.type === 'buffer' || block.type === 'external') {
      // V2 Phase 1 (P1-05): schedule-native block types — completion writes
      // straight to the canonical model entry.
      try {
        await dataService.schedule.setStatus(block.id, block.completed ? 'planned' : 'done', block.durationMinutes);
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
        const tomorrowKey = getISODateString(addDays(new Date(), 1));
        for (const intention of refData.tomorrowIntentions) {
          const trimmed = intention?.trim();
          if (trimmed) {
            try {
              // V2 Phase 1 (P1-17): link-or-create — if an unfinished task
              // with the same title already exists, carry IT forward instead
              // of duplicating the work into a new row.
              const existing = tasks.find(
                (t) =>
                  t.status !== 'completed' &&
                  t.title.trim().toLowerCase() === trimmed.toLowerCase()
              );
              if (existing) {
                await dataService.tasks.updateTask(existing.id, {
                  dueDate: tomorrowKey,
                  priority: 'high'
                });
              } else {
                await dataService.tasks.createTask({
                  title: trimmed,
                  category: 'deep_work',
                  priority: 'high',
                  dueDate: tomorrowKey,
                  tags: ['tomorrow-priority']
                });
              }
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

  // Phase 0 P0.4: deterministic daily momentum score (30% tasks / 30% study /
  // 20% focus / 20% habits) derived from the data this page already fetches.
  const dailyMomentum = useMemo(
    () =>
      calculateDailySummary({
        tasks,
        studySessions: recentSessions,
        focusSessions: recentFocus,
        habits
      }),
    [tasks, recentSessions, recentFocus, habits]
  );

  // Phase 0 P0.5: the same learning intelligence snapshot Analytics computes,
  // so the dashboard can surface the top explainable recommendations without
  // any additional requests.
  const intelligenceSnapshot = useMemo(() => {
    if (subjects.length === 0) return null;
    try {
      return createLearningIntelligenceSnapshot({
        subjects,
        topics,
        sessions: recentSessions,
        flashcards,
        reviews: [],
        notes,
        resources: [],
        planItems: studyPlan
      });
    } catch (err) {
      console.warn('Dashboard intelligence snapshot failed:', err);
      return null;
    }
  }, [subjects, topics, recentSessions, flashcards, notes, studyPlan]);

  const topRecommendations = useMemo(
    () => intelligenceSnapshot?.recommendations.slice(0, 2) ?? [],
    [intelligenceSnapshot]
  );

  const handleRecommendationAction = useCallback((rec: ExplainableRecommendation) => {
    const payload = rec.actionPayload;
    if (payload.type === 'drill_flashcards') {
      navigate('/app/study');
      return;
    }
    const params = new URLSearchParams();
    if (payload.subjectId) params.set('subjectId', payload.subjectId);
    if (payload.topicTitle) params.set('title', payload.topicTitle);
    if (payload.suggestedDurationMinutes) params.set('duration', String(payload.suggestedDurationMinutes));
    navigate(`/app/focus?${params.toString()}`);
  }, [navigate, addToast]);

  // V2 Phase 1 (P1-14/C5): analytics insights become proposal objects — the
  // write-back that was missing ("the app tells me things but makes me do
  // the work"). dedupeKey keeps one open proposal per insight.
  const handleSendRecommendationToTriage = useCallback(
    (rec: ExplainableRecommendation) => {
      void dataService.proposals
        .create({
          kind: 'insight_action',
          source: 'engine',
          title: rec.title,
          evidence: rec.evidence || rec.signal,
          diff: { actionUrl: rec.actionPayload?.targetRoute || '/app/focus', actionLabel: rec.actionLabel },
          dedupeKey: `insight:${rec.id}`
        })
        .then((created) => {
          addToast({
            title: 'Filed in Triage',
            description: `"${created.title}" is waiting in Needs-a-decision.`,
            type: 'info'
          });
          setOpenProposalCount((prev) => prev + 1);
        })
        .catch(() => {
          addToast({ title: 'Could not file the insight', type: 'error' });
        });
    },
    [addToast]
  );

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
                {goals.some((g) => g.status === 'active') && (
                  <select
                    className="solis-intention-goal-select"
                    value={intentionGoalId}
                    onChange={(e) => handleLinkIntentionGoal(e.target.value)}
                    aria-label="Link today's intention to a goal"
                  >
                    <option value="">No linked goal</option>
                    {goals
                      .filter((g) => g.status === 'active')
                      .map((g) => (
                        <option key={g.id} value={g.id}>
                          {g.title}
                        </option>
                      ))}
                  </select>
                )}
                {intentionSaved && (
                  <span className="solis-intention-pill" aria-live="polite">
                    ✓ Saved
                  </span>
                )}
              </div>

              {/* Phase 6 (P6.5): proactive retention alert — when the top
                  intelligence signal is an overdue review, say so plainly. */}
              {topRecommendations[0]?.type === 'spaced_retrieval' &&
                topRecommendations[0].signal.toLowerCase().includes('overdue') && (
                  <div
                    className="solis-retention-alert"
                    role="alert"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      marginTop: '12px',
                      maxWidth: '640px',
                      padding: '9px 14px',
                      borderRadius: 'var(--radius-md)',
                      background: 'rgba(230, 90, 65, 0.12)',
                      border: '1px solid var(--color-coral-500)',
                      fontSize: 'var(--text-caption)',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <AlertTriangle size={14} color="var(--color-coral-500)" style={{ flexShrink: 0 }} />
                    <span>
                      <strong>Retention alert:</strong> {topRecommendations[0].title} is overdue —{' '}
                      {topRecommendations[0].evidence}
                    </span>
                  </div>
                )}

              {/* Phase 0 P0.4/P0.5: daily momentum score + the top explainable
                  study recommendations, computed from the page's existing data. */}
              <DashboardIntelligenceBrief
                breakdown={dailyMomentum.breakdown}
                summary={dailyMomentum.summary}
                topRecommendations={topRecommendations}
                onRecommendationAction={handleRecommendationAction}
                onSendToTriage={handleSendRecommendationToTriage}
              />
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
              {/* Morning Planning primary CTA before 14:00 (F-201); Phase 0 P0.3
                  swaps to a done-state once the ritual is completed today. */}
              {currentTime.getHours() < 14 && (
                <Button
                  variant={isMorningPlanned ? 'outline' : 'accent'}
                  size="md"
                  className="tactile-press"
                  leftIcon={isMorningPlanned ? <CheckCircle2 size={16} /> : <Sun size={16} />}
                  title={
                    isMorningPlanned
                      ? "Today's morning planning is complete — reopen to review"
                      : undefined
                  }
                  onClick={() => setIsMorningModalOpen(true)}
                >
                  {isMorningPlanned ? 'Morning Planned ✓' : 'Morning Planning (90s)'}
                </Button>
              )}
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

      {/* Feature 3.3: Ambient Peer Presence (Friends Studying Now) */}
      <AmbientPeerPresenceWidget />

      {/* Cognitive Load Alert if needed */}
      {cognitiveReport.status !== 'optimal' && (
        <CognitiveLoadAlert report={cognitiveReport} />
      )}

      {/* V2 Phase 1 (P1-11): due-recall block — the strongest deterministic
          engine finally renders inside the day instead of a hop away. */}
      {dueReviewCount > 0 && (
        <div
          className="solis-due-recall-banner"
          role="status"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            padding: '12px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-secondary)',
            border: '1px solid var(--color-amber-500)'
          }}
        >
          <BookOpen size={18} color="var(--color-amber-500)" aria-hidden="true" />
          <div style={{ flex: 1 }}>
            <strong style={{ color: 'var(--text-primary)' }}>
              {dueReviewCount} card{dueReviewCount === 1 ? '' : 's'} due for review
            </strong>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              A defended recall block is on today's timeline — memory that never pushes on the calendar is memory you lose.
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="tactile-press"
            rightIcon={<ArrowRight size={14} />}
            onClick={() => navigate('/app/study')}
          >
            Start recall drill
          </Button>
        </div>
      )}

      {/* V2 Phase 1 (P1-13): triage entry point — decisions get one address. */}
      {openProposalCount > 0 && (
        <button
          type="button"
          className="tactile-press"
          onClick={() => navigate('/app/triage')}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '10px 16px',
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-surface-secondary)',
            border: '1px solid var(--border-subtle)',
            cursor: 'pointer',
            textAlign: 'left',
            width: '100%'
          }}
        >
          <CheckCircle2 size={16} color="var(--color-coral-500)" aria-hidden="true" />
          <span style={{ flex: 1, fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>
            <strong>{openProposalCount}</strong> insight{openProposalCount === 1 ? '' : 's'} need{openProposalCount === 1 ? 's' : ''} a decision
          </span>
          <ArrowRight size={14} color="var(--text-secondary)" aria-hidden="true" />
        </button>
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
                      {h.kind === 'quantitative' ? (
                        <span>
                          {h.currentStreak}d streak • {h.currentValueToday || 0}/{h.targetValue} {h.unit || 'units'}
                          {h.completedToday && (() => {
                            const tier = evaluateHabitTier(h.currentValueToday || 0, h);
                            return tier ? ` (${getTierMeta(tier).shortLabel})` : '';
                          })()}
                        </span>
                      ) : (
                        <span>{h.currentStreak}d streak {h.frequency ? `• ${h.frequency.replace(/_/g, ' ')}` : ''}</span>
                      )}
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

      {/* V2 Phase 1 (P1-15): unified reflections — evening closures, weekly
          reviews, and drift-pad thoughts in one honest timeline. */}
      <section className="solis-panel" aria-label="Unified reflections timeline">
        <div className="solis-panel__header">
          <div className="solis-panel__title-group">
            <FileText size={16} className="solis-panel__icon" aria-hidden="true" />
            <h2 className="solis-panel__title">Reflections Timeline</h2>
          </div>
        </div>
        <UnifiedReflectionsTimeline reflections={reflections} notes={notes} />
      </section>

      {/* Guided 90-Second Morning Planning Ritual Modal (F-201) */}
      <MorningPlanningModal
        isOpen={isMorningModalOpen}
        onClose={() => setIsMorningModalOpen(false)}
        tasks={tasks}
        timeBlocks={taskTimeBlocks}
        dailyCapacityMinutes={getDefaultDailyCapacityMinutes()}
        onPlanningCompleted={() => {
          setIsMorningPlanned(true);
          // V2 Phase 1 (C2): the morning-completion flag follows the student.
          void dataService.stateSync
            .put(`ritual:morning:${getISODateString(new Date())}`, 'user_content', { completed: true })
            .catch(() => {});
          loadDashboardData();
        }}
      />

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
