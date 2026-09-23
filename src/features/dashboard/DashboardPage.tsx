import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  ArrowRight,
  CheckCircle2,
  Repeat,
  Sparkles,
  Play,
  Info,
  FileText,
  Layers,
  Compass,
  Moon,
  ChevronRight,
  Clock
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Progress } from '../../components/ui/Progress/Progress';
import { Checkbox } from '../../components/ui/Checkbox/Checkbox';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { Modal } from '../../components/feedback/Modal/Modal';
import { cn } from '../../utils/classNames';
import { TimeBlockGrid } from '../../components/features/Planning/TimeBlockGrid';
import { RecurringRoutinesModal } from '../../components/features/Planning/RecurringRoutinesModal';
import { EveningClosureModal } from '../../components/features/Reflection/EveningClosureModal';
import { CognitiveLoadAlert } from '../../components/features/Analytics/CognitiveLoadAlert';
import { KnowledgeResurfacingCard } from '../../components/features/Notes/KnowledgeResurfacingCard';
import { CalendarOverlayCard } from '../../components/features/Calendar/CalendarOverlayCard';
import { ExamHorizonBar } from '../../components/features/Goals/ExamHorizonBar';
import { SolarArc, SolarDial } from '../../components/illustrations';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dataService } from '../../services/dataService';
import { Task, TaskTimeBlock } from '../../types/task';
import { WorkloadCapacityBar } from '../tasks/components/WorkloadCapacityBar';
import { SmartTaskInput } from '../tasks/components/SmartTaskInput';
import { TaskRow } from '../tasks/components/TaskRow';
import { calculateWorkload } from '../../utils/tasks/workloadCalculator';
import { StudyPlanItem, StudySubject, StudySession, StudyTopic } from '../../types/study';
import { Note } from '../../types/note';
import { Habit } from '../../types/habit';
import { FocusSession } from '../../types/focus';
import { DailySummary } from '../../types/analytics';
import { RecurringStudyRoutine, TimeBlock } from '../../types/planning';
import { DailyReflection } from '../../types/reflection';
import { getTimeOfDayGreeting, formatFriendlyDate, formatFullDate, getISODateString } from '../../utils/date';
import { calculateDailySummary } from '../../utils/productivity';
import { generateSolisIntelligenceReport } from '../../utils/intelligence';
import { evaluateCognitiveLoad } from '../../utils/intelligence/masteryIntelligence';
import { buildTimeBlocks, findTimeBlockConflicts, calculateTimeAllocation } from '../../utils/planning/timeBlocking';
import { ActivationWelcomeModal } from '../../components/features/Activation/ActivationWelcomeModal';
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
  const [recentSessions, setRecentSessions] = useState<StudySession[]>([]);
  const [recentFocus, setRecentFocus] = useState<FocusSession[]>([]);
  const [routines, setRoutines] = useState<RecurringStudyRoutine[]>([]);
  const [reflections, setReflections] = useState<DailyReflection[]>([]);
  const [taskTimeBlocks, setTaskTimeBlocks] = useState<TaskTimeBlock[]>([]);
  const [summary, setSummary] = useState<DailySummary | null>(() => queryCache.get<DailySummary>('daily_summary'));
  const [viewMode, setViewMode] = useState<'lists' | 'timeline'>('lists');

  const [currentTime, setCurrentTime] = useState<Date>(() => new Date());
  const lastCompletedTaskIdRef = useRef<{ id: string; timestamp: number } | null>(null);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 15000);
    return () => clearInterval(timer);
  }, []);

  // Workload Realism Calculation
  const workload = useMemo(() => {
    return calculateWorkload({
      date: getISODateString(currentTime),
      tasks,
      timeBlocks: taskTimeBlocks
    });
  }, [currentTime, tasks, taskTimeBlocks]);

  // Modals
  const [isScoreModalOpen, setIsScoreModalOpen] = useState(false);
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
      routines
    });
  }, [studyPlan, tasks, recentFocus, routines]);

  const timeConflicts = useMemo(() => findTimeBlockConflicts(timeBlocks), [timeBlocks]);
  const timeStats = useMemo(() => calculateTimeAllocation(timeBlocks), [timeBlocks]);

  // Daily Intention state
  const todayKey = `solis_daily_intention_${getISODateString(currentTime)}`;
  const [dailyIntention, setDailyIntention] = useState(() => {
    return localStorage.getItem(todayKey) || '';
  });
  const [intentionSaved, setIntentionSaved] = useState(false);

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
        blocksRes
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
        dataService.tasks.getTimeBlocks ? dataService.tasks.getTimeBlocks(getISODateString(new Date())) : Promise.resolve([])
      ]);

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

    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
    const unsubscribe = dataService.subscribe(() => {
      loadDashboardData();
    });
    return () => unsubscribe();
  }, [loadDashboardData]);

  const handleSaveIntention = (val: string) => {
    setDailyIntention(val);
    localStorage.setItem(todayKey, val);
    setIntentionSaved(true);
    setTimeout(() => setIntentionSaved(false), 2000);
  };

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

  const scoreDetails = calculateDailySummary({
    tasks,
    studySessions: recentSessions,
    focusSessions: recentFocus,
    habits
  }).breakdown;

  const cognitiveReport = useMemo(() => {
    return evaluateCognitiveLoad({
      focusSessions: recentFocus,
      studySessions: recentSessions,
      reflections
    });
  }, [recentFocus, recentSessions, reflections]);

  // Intelligence Recommendation Resolution
  const intelligenceReport = useMemo(() => {
    return generateSolisIntelligenceReport(
      {
        sessions: recentSessions,
        planItems: studyPlan,
        subjects,
        topics,
        focusSessions: recentFocus,
        tasks,
        habits
      },
      'today'
    );
  }, [recentSessions, studyPlan, subjects, topics, recentFocus, tasks, habits]);

  const topRecommendation = intelligenceReport.recommendations[0];

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

  const activeTasks = tasks.filter((t) => t.status !== 'completed');
  const lastFocus = recentFocus.length > 0 ? recentFocus[0] : null;
  const lastStudy = recentSessions.length > 0 ? recentSessions[0] : null;
  const nextPendingPlan = studyPlan.find((p) => !p.completed);
  const latestNote = notes.length > 0 ? notes[0] : null;

  return (
    <div className="solis-cockpit-layout">
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
              <SolarArc currentDate={currentTime} />
              <Button
                variant="primary"
                size="md"
                className="solis-focus-primary-btn tactile-press"
                leftIcon={<Flame size={16} />}
                onClick={() => navigate('/app/focus')}
              >
                Start Focus Session
              </Button>
            </div>
          </div>

          {/* 3-Step Quick Start Checklist for Students & New Users */}
          <div className="solis-quick-start-banner" role="region" aria-label="Quick Start Guide">
            <div className="solis-quick-start-title">
              <Sparkles size={16} color="var(--color-coral-500)" />
              <span>Quick Start — 3 Easy Steps to Begin</span>
            </div>
            <div className="solis-quick-start-grid">
              <button
                type="button"
                className="solis-quick-step-card tactile-press"
                onClick={() => navigate('/app/study')}
              >
                <span className="solis-quick-step-num">1</span>
                <div className="solis-quick-step-info">
                  <strong>1. Add Your Subjects</strong>
                  <span>Add your classes, courses & exams</span>
                </div>
              </button>
              <button
                type="button"
                className="solis-quick-step-card tactile-press"
                onClick={() => navigate('/app/tasks')}
              >
                <span className="solis-quick-step-num">2</span>
                <div className="solis-quick-step-info">
                  <strong>2. Add Today's Tasks</strong>
                  <span>List homework, readings & practice</span>
                </div>
              </button>
              <button
                type="button"
                className="solis-quick-step-card tactile-press"
                onClick={() => navigate('/app/focus')}
              >
                <span className="solis-quick-step-num">3</span>
                <div className="solis-quick-step-info">
                  <strong>3. Start Focus Timer</strong>
                  <span>Study distraction-free for 25 mins</span>
                </div>
              </button>
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

      {/* Cognitive Load Alert if needed */}
      {cognitiveReport.status !== 'optimal' && (
        <CognitiveLoadAlert report={cognitiveReport} />
      )}

      {/* Evening Closure Banner (Circadian conditional >= 18:00) */}
      {currentTime.getHours() >= 18 && (
        <section className="solis-evening-closure-banner" aria-label="Evening Reflection & Closure">
          <div className="solis-evening-closure-banner__lead">
            <div className="solis-evening-closure-banner__icon">
              <Moon size={20} />
            </div>
            <div>
              <span className="solis-evening-closure-banner__title">Evening Rest & Reflection</span>
              <span className="solis-evening-closure-banner__desc">
                Take 3 minutes to synthesize today's achievements and prepare tomorrow's intentions.
              </span>
            </div>
          </div>
          <Button
            variant="accent"
            size="md"
            className="tactile-press"
            onClick={() => setIsClosureModalOpen(true)}
          >
            Begin Evening Closure
          </Button>
        </section>
      )}

      {/* 02 // ASYMMETRIC MASTER GRID (Stage 62% / Vault 38%) */}
      <div className="solis-cockpit-grid">
        {/* LEFT COLUMN: THE LIVING STAGE */}
        <main className="solis-cockpit-stage">
          {/* Sanctuary Horizon (Active Orbit) */}
          {(topRecommendation || nextPendingPlan || lastFocus || lastStudy || latestNote) && (
            <section className="solis-orbit-stage" aria-label="Active Focus Horizon">
              <div className="solis-orbit-stage__content">
                <div className="solis-orbit-stage__tag">
                  <Compass size={14} color="var(--color-coral-500)" aria-hidden="true" />
                  <span>
                    {topRecommendation
                      ? 'Recommended Focus Horizon'
                      : nextPendingPlan
                      ? 'Next Scheduled Study Block'
                      : lastFocus
                      ? 'Recent Study Momentum'
                      : 'External Knowledge State'}
                  </span>
                  <Badge variant="neutral">
                    {topRecommendation
                      ? (topRecommendation.type === 'spaced_retrieval' ? 'Spaced Retrieval' : 'Active Rec')
                      : nextPendingPlan
                      ? (nextPendingPlan.scheduledTime ? `${nextPendingPlan.scheduledTime}` : 'Today')
                      : 'Continuity Anchor'}
                  </Badge>
                </div>

                <div className="solis-orbit-stage__title">
                  {topRecommendation?.title || nextPendingPlan?.title || (lastFocus ? `Resume: ${lastFocus.title || lastFocus.topic || 'Subject Study'}` : latestNote?.title || 'Knowledge Note')}
                </div>

                <div className="solis-orbit-stage__reason">
                  {topRecommendation?.whyExplanation || topRecommendation?.evidence || (
                    nextPendingPlan
                      ? `${nextPendingPlan.subjectName || 'General'} • ${nextPendingPlan.targetMinutes}m planned`
                      : lastFocus
                      ? `${lastFocus.subjectName || 'General'} • ${lastFocus.durationMinutes}m logged`
                      : `${latestNote?.subjectName || 'Notes'} • ${formatFriendlyDate(latestNote?.updatedAt || '')}`
                  )}
                </div>
              </div>

              <div className="solis-orbit-stage__actions">
                {topRecommendation ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="tactile-press"
                    leftIcon={<Flame size={14} />}
                    onClick={() => {
                      if (topRecommendation.actionPayload?.type === 'start_focus') {
                        navigate('/app/focus', {
                          state: {
                            subjectId: topRecommendation.actionPayload.subjectId,
                            subjectName: topRecommendation.actionPayload.subjectName,
                            topic: topRecommendation.actionPayload.topicTitle,
                            durationMinutes: topRecommendation.actionPayload.durationMinutes || 25
                          }
                        });
                      } else if (topRecommendation.actionPayload?.type === 'drill_flashcards') {
                        navigate('/app/study');
                      } else {
                        navigate(topRecommendation.actionPayload?.targetRoute || '/app/study');
                      }
                    }}
                  >
                    {topRecommendation.actionLabel || 'Engage Focus'}
                  </Button>
                ) : nextPendingPlan ? (
                  <Button
                    variant="primary"
                    size="sm"
                    className="tactile-press"
                    leftIcon={<Flame size={14} />}
                    onClick={() => navigate(`/app/focus?subjectId=${nextPendingPlan.subjectId}&planId=${nextPendingPlan.id}&title=${encodeURIComponent(nextPendingPlan.title)}`)}
                  >
                    Begin Study Block
                  </Button>
                ) : lastFocus ? (
                  <Button
                    variant="subtle"
                    size="sm"
                    className="tactile-press"
                    rightIcon={<ChevronRight size={14} />}
                    onClick={() => navigate(`/app/focus?subjectId=${lastFocus.subjectId || ''}`)}
                  >
                    Resume Subject
                  </Button>
                ) : (
                  <Button
                    variant="subtle"
                    size="sm"
                    className="tactile-press"
                    rightIcon={<ChevronRight size={14} />}
                    onClick={() => navigate('/app/notes')}
                  >
                    Open Notes
                  </Button>
                )}
              </div>
            </section>
          )}

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

            {/* Task Rows */}
            {activeTasks.length === 0 ? (
              <div className="solis-empty-stub">
                <span>All deliberate intentions completed. Ready to reflect or rest.</span>
                <Button variant="subtle" size="sm" onClick={() => navigate('/app/tasks')}>
                  View Completed
                </Button>
              </div>
            ) : (
              <div className="solis-actions-list">
                {activeTasks.slice(0, 5).map((task) => {
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
                    />
                  );
                })}
              </div>
            )}
          </section>

          {/* Academic Calendar Awareness */}
          <CalendarOverlayCard
            date={getISODateString(new Date())}
            solisBlocks={timeBlocks}
            studyPlans={studyPlan}
            onResolveConflict={(conflict) => {
              if (conflict.suggestedAction.proposedStartTime) {
                navigate(`/app/tasks?action=replan&id=${conflict.solisPlanId}&time=${conflict.suggestedAction.proposedStartTime}`);
              } else {
                navigate('/app/tasks');
              }
            }}
          />
        </main>

        {/* RIGHT COLUMN: THE INTELLECTUAL VAULT */}
        <aside className="solis-cockpit-vault" aria-label="Intellectual Vault & Telemetry">
          {/* Momentum Telemetry Dial */}
          <section className="solis-panel" aria-label="Circadian Momentum Telemetry">
            <div className="solis-panel__header">
              <div className="solis-panel__title-group">
                <Sparkles size={16} className="solis-panel__icon" aria-hidden="true" />
                <h2 className="solis-panel__title">Momentum Telemetry</h2>
              </div>
              <button
                type="button"
                onClick={() => setIsScoreModalOpen(true)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  fontSize: '11px',
                  fontFamily: 'var(--font-mono, monospace)'
                }}
                title="View formula breakdown"
              >
                <Info size={13} /> Formula
              </button>
            </div>

            <div className="solis-momentum-vault">
              <div className="solis-momentum-gauge-row">
                <SolarDial
                  score={
                    Boolean(summary && (summary.totalTasksCount > 0 || summary.totalStudyMinutes > 0 || summary.focusSessionsCount > 0))
                      ? summary?.momentumScore ?? 0
                      : 0
                  }
                  size={114}
                  onClick={() => setIsScoreModalOpen(true)}
                />

                <div className="solis-momentum-telemetry-stack">
                  <div className="solis-telemetry-row">
                    <div className="solis-telemetry-row__labels">
                      <span>Task Velocity</span>
                      <span className="solis-telemetry-row__metric">{scoreDetails.taskScore}%</span>
                    </div>
                    <div className="solis-telemetry-row__bar">
                      <div className="solis-telemetry-row__fill" style={{ width: `${scoreDetails.taskScore}%` }} />
                    </div>
                  </div>

                  <div className="solis-telemetry-row">
                    <div className="solis-telemetry-row__labels">
                      <span>Study Volume</span>
                      <span className="solis-telemetry-row__metric">{summary?.totalStudyMinutes || 0}m</span>
                    </div>
                    <div className="solis-telemetry-row__bar">
                      <div
                        className="solis-telemetry-row__fill solis-telemetry-row__fill--amber"
                        style={{ width: `${Math.min(100, Math.round(((summary?.totalStudyMinutes || 0) / 180) * 100))}%` }}
                      />
                    </div>
                  </div>

                  <div className="solis-telemetry-row">
                    <div className="solis-telemetry-row__labels">
                      <span>Deep Focus</span>
                      <span className="solis-telemetry-row__metric">{scoreDetails.focusScore}%</span>
                    </div>
                    <div className="solis-telemetry-row__bar">
                      <div
                        className="solis-telemetry-row__fill solis-telemetry-row__fill--lavender"
                        style={{ width: `${scoreDetails.focusScore}%` }}
                      />
                    </div>
                  </div>

                  <div className="solis-telemetry-row">
                    <div className="solis-telemetry-row__labels">
                      <span>Ritual Consistency</span>
                      <span className="solis-telemetry-row__metric">{summary?.habitsCompletedRatio || '0/0'}</span>
                    </div>
                    <div className="solis-telemetry-row__bar">
                      <div
                        className="solis-telemetry-row__fill solis-telemetry-row__fill--sage"
                        style={{ width: `${scoreDetails.habitScore}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
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
                <span>No daily rituals active today.</span>
                <Button variant="subtle" size="sm" onClick={() => navigate('/app/habits')}>
                  Create Habit
                </Button>
              </div>
            ) : (
              <div className="solis-habit-pulse-list">
                {habits.slice(0, 4).map((h) => (
                  <div key={h.id} className="solis-habit-pulse-item">
                    <div className="solis-habit-pulse-item__info">
                      <span
                        className="solis-habit-pulse-item__title"
                        style={{ textDecoration: h.completedToday ? 'line-through' : 'none', opacity: h.completedToday ? 0.65 : 1 }}
                      >
                        {h.title}
                      </span>
                      <span className="solis-habit-pulse-item__streak">
                        🔥 {h.currentStreak}d streak {h.frequency ? `• ${h.frequency.replace(/_/g, ' ')}` : ''}
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

          {/* Knowledge Studio Resurfacing & Syllabus */}
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

          {/* Knowledge Disciplines (Subject Worlds) & Exam Horizon */}
          <section className="solis-panel" aria-label="Knowledge Disciplines">
            <div className="solis-panel__header">
              <div className="solis-panel__title-group">
                <Layers size={16} className="solis-panel__icon" aria-hidden="true" />
                <h2 className="solis-panel__title">Disciplines</h2>
                <span className="solis-panel__badge">{subjects.length} Active</span>
              </div>
              <Link to="/app/study">
                <Button variant="ghost" size="sm">Syllabus</Button>
              </Link>
            </div>

            <ExamHorizonBar />

            <div className="solis-subject-vault-grid" style={{ marginTop: '12px' }}>
              {subjects.filter((s) => s.status !== 'archived').slice(0, 4).map((sub) => {
                const studiedHours = recentSessions
                  .filter((s) => s.subjectId === sub.id)
                  .reduce((acc, s) => acc + (s.durationMinutes || 0), 0) / 60;
                return (
                  <div
                    key={sub.id}
                    className="solis-subject-vault-chip"
                    onClick={() => navigate(`/app/study?subjectId=${sub.id}`)}
                  >
                    <div className="solis-subject-vault-chip__top">
                      <Badge variant={sub.color as any || 'coral'}>
                        {sub.code || 'CORE'}
                      </Badge>
                      <span style={{ fontSize: '10.5px', fontFamily: 'var(--font-mono, monospace)', color: 'var(--text-muted)' }}>
                        {sub.targetHoursPerWeek}h/wk
                      </span>
                    </div>
                    <div className="solis-subject-vault-chip__name">
                      {sub.name}
                    </div>
                    <Progress value={studiedHours} max={sub.targetHoursPerWeek || 10} size="sm" variant={sub.color as any || 'coral'} />
                  </div>
                );
              })}
            </div>
          </section>
        </aside>
      </div>

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

      {/* Momentum Formula Modal */}
      <Modal
        isOpen={isScoreModalOpen}
        onClose={() => setIsScoreModalOpen(false)}
        title="Momentum Score & Deterministic Formula"
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Solis derives your daily momentum deterministically across 4 weighted intellectual pillars:
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <div style={{ padding: '10px 14px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Tasks Velocity (30% weight)</span>
              <strong>{scoreDetails.taskScore}%</strong>
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Study Volume (30% weight)</span>
              <strong>{Math.min(100, Math.round(((summary?.totalStudyMinutes || 0) / 180) * 100))}%</strong>
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Deep Focus Concentration (20% weight)</span>
              <strong>{scoreDetails.focusScore}%</strong>
            </div>
            <div style={{ padding: '10px 14px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', display: 'flex', justifyContent: 'space-between' }}>
              <span>Ritual Consistency (20% weight)</span>
              <strong>{scoreDetails.habitScore}%</strong>
            </div>
          </div>
        </div>
      </Modal>

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
    </div>
  );
};

export default DashboardPage;
