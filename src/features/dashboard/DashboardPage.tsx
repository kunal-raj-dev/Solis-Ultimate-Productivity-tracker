import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Flame,
  ArrowRight,
  BookOpen,
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
import { SceneContainer } from '../../components/scene';
import { TimeBlockGrid } from '../../components/features/Planning/TimeBlockGrid';
import { RecurringRoutinesModal } from '../../components/features/Planning/RecurringRoutinesModal';
import { EveningClosureModal } from '../../components/features/Reflection/EveningClosureModal';
import { CognitiveLoadAlert } from '../../components/features/Analytics/CognitiveLoadAlert';
import { KnowledgeResurfacingCard } from '../../components/features/Notes/KnowledgeResurfacingCard';
import { CalendarOverlayCard } from '../../components/features/Calendar/CalendarOverlayCard';
import { ExamHorizonBar } from '../../components/features/Goals/ExamHorizonBar';
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
    } catch (err) {
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

  // Intelligence Recommendation Resolution (Always declare hooks unconditionally before early returns)
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
      <div className="solis-daily-flow">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton width="340px" height="48px" />
          <Skeleton width="520px" height="24px" />
        </div>
        <Skeleton height="280px" />
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: '24px' }}>
          <Skeleton height="320px" />
          <Skeleton height="320px" />
        </div>
      </div>
    );
  }

  const activeTasks = tasks.filter((t) => t.status !== 'completed');

  // Continuity / Memory Resolution from Real Data
  const lastFocus = recentFocus.length > 0 ? recentFocus[0] : null;
  const lastStudy = recentSessions.length > 0 ? recentSessions[0] : null;
  const nextPendingPlan = studyPlan.find((p) => !p.completed);
  const latestNote = notes.length > 0 ? notes[0] : null;

  return (
    <div className="solis-daily-flow">
      {/* TIER 1 // ARRIVAL HERO & DAILY INTENTION */}
      <SceneContainer variant="canvas">
        <div className="solis-arrival-content">
          <div>
            <div className="solis-today-temporal-header">
              <span className="solis-today-temporal-date">
                {formatFullDate(currentTime)}
              </span>
              <span className="solis-today-temporal-separator" aria-hidden="true">•</span>
              <span className="solis-today-temporal-period">
                {greetingInfo.period}
              </span>
            </div>
            <h1 className="solis-arrival-greeting__title">{greetingInfo.greeting}</h1>
            <p className="solis-arrival-greeting__suggestion">{greetingInfo.suggestion}</p>

            {/* Daily Intention Line */}
            <div className="solis-daily-intention-bar">
              <Sparkles size={16} className="solis-intention-icon" aria-hidden="true" />
              <input
                type="text"
                value={dailyIntention}
                onChange={(e) => handleSaveIntention(e.target.value)}
                placeholder="What is your singular intention today?"
                className="solis-daily-intention-input"
                aria-label="What is your singular intention today?"
              />
              {intentionSaved && (
                <span className="solis-intention-anchored" aria-live="polite">
                  ✓ Anchored
                </span>
              )}
            </div>
          </div>

          <div className="solis-dashboard-hero-actions">
            <Button
              variant="accent"
              size="md"
              className="tactile-press"
              leftIcon={<Flame size={16} />}
              onClick={() => navigate('/app/focus')}
            >
              Enter Focus Room
            </Button>
          </div>
        </div>

        {/* TIER 2 // ACTIVE / NEXT ACTION BANNER */}
        {!isNextActionDismissed && nextBestAction.id !== 'action_continue_flow' && (
          <div style={{ marginTop: 'var(--space-md)' }}>
            <NextBestActionCard
              action={nextBestAction}
              onDismiss={() => setIsNextActionDismissed(true)}
            />
          </div>
        )}

        {/* UNIFIED ACTIVE ORBIT & INTELLIGENCE CAPSULE */}
        {(nextPendingPlan || topRecommendation || lastFocus || lastStudy || latestNote) && (
          <div className="solis-active-orbit-card">
            <div className="solis-active-orbit-header">
              <div className="solis-active-orbit-tag">
                <Compass size={15} color="var(--color-coral-500)" aria-hidden="true" />
                <span>
                  {topRecommendation
                    ? 'Recommended Focus Horizon'
                    : nextPendingPlan
                    ? 'Next Scheduled Study Block'
                    : lastFocus
                    ? 'Recent Study Momentum'
                    : 'External Knowledge State'}
                </span>
              </div>
              <Badge variant={topRecommendation?.type === 'spaced_retrieval' ? 'amber' : topRecommendation ? 'coral' : 'neutral'}>
                {topRecommendation
                  ? (topRecommendation.type === 'spaced_retrieval' ? 'Spaced Retrieval Due' : 'Active Intelligence')
                  : nextPendingPlan
                  ? (nextPendingPlan.scheduledTime ? `${nextPendingPlan.scheduledTime} • Planned` : 'Today')
                  : 'Continuity Anchor'}
              </Badge>
            </div>

            <div className="solis-active-orbit-body">
              <div className="solis-active-orbit-content">
                <div className="solis-active-orbit-title">
                  {topRecommendation?.title || nextPendingPlan?.title || (lastFocus ? `Resume: ${lastFocus.title || lastFocus.topic || 'Subject Study'}` : latestNote?.title || 'Knowledge Note')}
                </div>
                <div className="solis-active-orbit-sub">
                  {topRecommendation?.whyExplanation || topRecommendation?.evidence || (
                    nextPendingPlan
                      ? `${nextPendingPlan.subjectName || 'General'} • ${nextPendingPlan.targetMinutes}m planned`
                      : lastFocus
                      ? `${lastFocus.subjectName || 'General'} • ${lastFocus.durationMinutes}m logged`
                      : `${latestNote?.subjectName || 'Notes'} • ${formatFriendlyDate(latestNote?.updatedAt || '')}`
                  )}
                </div>
              </div>

              <div className="solis-active-orbit-actions">
                {topRecommendation ? (
                  <Button
                    variant="accent"
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
                    variant="accent"
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
            </div>
          </div>
        )}

        {/* TIER 3 // 24-HOUR SCHEDULE & TIMELINE WITH LIVING MINUTE NEEDLE */}
        <div style={{ marginTop: 'var(--space-xl)' }} className="solis-cockpit-tier solis-cockpit-tier--3">
          <div className="solis-timeline-header">
            <div className="solis-timeline-title-wrap">
              <Clock size={16} className="solis-timeline-clock-icon" aria-hidden="true" />
              <h2 className="solis-timeline-title">24-Hour Schedule & Timeline</h2>
              <span className="solis-timeline-badge">
                {timeBlocks.length} {timeBlocks.length === 1 ? 'block' : 'blocks'} • {timeStats.totalPlannedMinutes}m
              </span>
            </div>
            <div className="solis-timeline-actions">
              <button
                type="button"
                className={cn('solis-timeline-mode-toggle', viewMode === 'timeline' && 'solis-timeline-mode-toggle--active')}
                onClick={() => setViewMode(viewMode === 'timeline' ? 'lists' : 'timeline')}
              >
                {viewMode === 'timeline' ? 'Compact View' : 'Expanded Grid'}
              </button>
            </div>
          </div>

          <div className="solis-cockpit-timeline-strip">
            <div className="solis-timeline-track">
              <div className="solis-timeline-hours-bar">
                {['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'].map((hr) => (
                  <span key={hr}>{hr}</span>
                ))}
              </div>
              {currentTime.getHours() >= 8 && currentTime.getHours() <= 20 && (
                <div
                  className="solis-living-needle"
                  style={{
                    left: `${Math.min(100, Math.max(0, ((currentTime.getHours() - 8) * 60 + currentTime.getMinutes()) / (12 * 60) * 100))}%`,
                    width: 'auto'
                  }}
                  title={`Now: ${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`}
                  aria-hidden="true"
                />
              )}
            </div>

            {timeBlocks.length === 0 ? (
              <div className="solis-cockpit-empty-stub">
                <span>No time blocks scheduled for today. Shape your first focus block.</span>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => navigate('/app/tasks')}
                >
                  Open Hourly Planner
                </Button>
              </div>
            ) : (
              <div className="solis-cockpit-blocks-list">
                {timeBlocks.slice(0, 4).map((block) => (
                  <div key={block.id} className={cn('solis-cockpit-block-row', block.completed && 'solis-cockpit-block-row--completed')}>
                    <span className="solis-cockpit-block-time text-metric">{block.startTime} – {block.endTime}</span>
                    <div className="solis-cockpit-block-main">
                      <span className="solis-cockpit-block-title">{block.title}</span>
                      {block.subjectName && (
                        <span className="solis-cockpit-block-subject">{block.subjectName}</span>
                      )}
                    </div>
                    <div className="solis-cockpit-block-actions">
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
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* TIER 4 // WORKLOAD REALISM & CAPACITY SIGNAL */}
        <div style={{ marginTop: 'var(--space-xl)' }} className="solis-cockpit-tier solis-cockpit-tier--4">
          <div className="solis-capacity-container">
            <WorkloadCapacityBar
              workload={workload}
              onAutoReplanCandidates={() => navigate('/app/tasks')}
            />
          </div>
        </div>

        {/* TIER 5 // TODAY PRIORITY QUEUE */}
        <div style={{ marginTop: 'var(--space-xl)' }} className="solis-cockpit-tier solis-cockpit-tier--5">
          <div className="solis-queue-header">
            <div className="solis-queue-title-wrap">
              <CheckCircle2 size={18} className="solis-queue-icon" aria-hidden="true" />
              <h2 className="solis-queue-title">Today Priority Queue</h2>
              <span className="solis-queue-badge">
                {activeTasks.length} {activeTasks.length === 1 ? 'deliberate action' : 'deliberate actions'}
              </span>
            </div>
            <Link to="/app/tasks">
              <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                All Tasks ({tasks.length})
              </Button>
            </Link>
          </div>

          <div className="solis-queue-input-wrap">
            <SmartTaskInput
              onCommit={handleCreateFromNLP}
              subjects={subjects}
              defaultDueDate={getISODateString(currentTime)}
              placeholder='Add intention for today... (e.g. "Review DSA at 4pm for 45m !high")'
            />
          </div>

          {activeTasks.length === 0 ? (
            <div className="solis-cockpit-empty-stub">
              <span>All deliberate intentions completed. Ready to reflect or rest.</span>
              <Button variant="subtle" size="sm" onClick={() => navigate('/app/tasks')}>
                View Completed
              </Button>
            </div>
          ) : (
            <div className="solis-queue-list">
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
        </div>
      </SceneContainer>

      {/* RESTRAINED MOMENTUM TELEMETRY & INTELLECTUAL VELOCITY */}
      <SceneContainer variant="canvas">
        {cognitiveReport.status !== 'optimal' && (
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <CognitiveLoadAlert report={cognitiveReport} />
          </div>
        )}
        <div className="solis-momentum-strip">
          <div className="solis-momentum-strip__main">
            <div className="solis-momentum-strip__lead">
              <Sparkles size={15} color="var(--color-coral-500)" aria-hidden="true" />
              <span className="solis-momentum-strip__tag">State of Momentum</span>
              <button
                type="button"
                onClick={() => setIsScoreModalOpen(true)}
                className="solis-momentum-info-btn"
                title="View deterministic formula breakdown"
                aria-label="View momentum formula breakdown"
              >
                <Info size={13} />
              </button>
            </div>
            <div className="solis-momentum-strip__score">
              <span className="solis-momentum-score-num text-metric">
                {Boolean(summary && (summary.totalTasksCount > 0 || summary.totalStudyMinutes > 0 || summary.focusSessionsCount > 0))
                  ? summary?.momentumScore ?? 0
                  : 0}
              </span>
              <span className="solis-momentum-score-unit">%</span>
            </div>
          </div>

          <div className="solis-momentum-telemetry">
            <div className="solis-momentum-telemetry__col">
              <span className="solis-momentum-telemetry__label">Tasks Velocity</span>
              <span className="solis-momentum-telemetry__val text-metric">{scoreDetails.taskScore}%</span>
            </div>
            <div className="solis-momentum-telemetry__sep" aria-hidden="true" />
            <div className="solis-momentum-telemetry__col">
              <span className="solis-momentum-telemetry__label">Study Volume</span>
              <span className="solis-momentum-telemetry__val text-metric">{summary?.totalStudyMinutes || 0}m / 180m</span>
            </div>
            <div className="solis-momentum-telemetry__sep" aria-hidden="true" />
            <div className="solis-momentum-telemetry__col">
              <span className="solis-momentum-telemetry__label">Deep Focus</span>
              <span className="solis-momentum-telemetry__val text-metric">{scoreDetails.focusScore}%</span>
            </div>
            <div className="solis-momentum-telemetry__sep" aria-hidden="true" />
            <div className="solis-momentum-telemetry__col">
              <span className="solis-momentum-telemetry__label">Ritual Consistency</span>
              <span className="solis-momentum-telemetry__val text-metric">{summary?.habitsCompletedRatio || '0/0'}</span>
            </div>
          </div>
        </div>
      </SceneContainer>

      {/* EVENING CLOSURE RITUAL — Smoothly activated after 18:00 without daytime disruption */}
      {currentTime.getHours() >= 18 && (
        <section className="solis-cockpit-evening" aria-label="Evening Reflection & Closure">
          <div className="solis-evening-banner">
            <div className="solis-evening-banner__icon">
              <Moon size={18} />
            </div>
            <div className="solis-evening-banner__text">
              <span className="solis-evening-banner__title">Evening Rest & Reflection</span>
              <span className="solis-evening-banner__sub">Take 3 minutes to synthesize today's achievements and prepare tomorrow's intentions.</span>
            </div>
            <Button
              variant="accent"
              size="md"
              className="tactile-press"
              onClick={() => setIsClosureModalOpen(true)}
            >
              Begin Evening Closure
            </Button>
          </div>
        </section>
      )}

      {/* 03 // DAILY PLANNING & TIME BLOCKING CONTROLS */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            onClick={() => setViewMode('lists')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-body-sm)',
              fontWeight: 600,
              border: '1px solid',
              borderColor: viewMode === 'lists' ? 'var(--color-coral-500)' : 'var(--border-subtle)',
              backgroundColor: viewMode === 'lists' ? 'var(--subject-coral-subtle)' : 'var(--bg-surface-primary)',
              color: viewMode === 'lists' ? 'var(--subject-coral-accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <BookOpen size={14} /> Action Streams
          </button>

          <button
            onClick={() => setViewMode('timeline')}
            style={{
              padding: '6px 14px',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-body-sm)',
              fontWeight: 600,
              border: '1px solid',
              borderColor: viewMode === 'timeline' ? 'var(--color-coral-500)' : 'var(--border-subtle)',
              backgroundColor: viewMode === 'timeline' ? 'var(--subject-coral-subtle)' : 'var(--bg-surface-primary)',
              color: viewMode === 'timeline' ? 'var(--subject-coral-accent)' : 'var(--text-secondary)',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <Clock size={14} /> Schedule Timeline ({timeBlocks.length})
          </button>
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Repeat size={14} />}
            onClick={() => setIsRoutinesModalOpen(true)}
          >
            Recurring Routines ({routines.length})
          </Button>
        </div>
      </div>

      {viewMode === 'timeline' ? (
        <div style={{ marginBottom: '32px' }}>
          <TimeBlockGrid
            blocks={timeBlocks}
            stats={timeStats}
            conflicts={timeConflicts}
            onToggleComplete={handleToggleTimeBlock}
            onLaunchFocus={handleLaunchTimeBlockFocus}
          />
        </div>
      ) : (
        /* 03 // ASYMMETRIC DAILY FLOW STREAMS */
        <div className="solis-flow-columns">
          {/* Left Primary Stream: Study Syllabus & Intentional Tasks */}
          <div className="solis-flow-primary-stream">
            {/* Exam Mode / Active Academic Horizon */}
            <ExamHorizonBar />

            {/* Calendar & Available-Time Awareness Engine */}
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

            {/* Study Planning Horizon */}
            <section className="solis-flow-section">
              <div className="solis-flow-section__header">
                <div className="solis-flow-section__title">
                  <BookOpen size={20} color="var(--color-amber-500)" />
                  <span>Today’s Study Horizon</span>
                  <Badge variant="neutral">{studyPlan.length} scheduled</Badge>
                </div>
              <Link to="/app/study">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                  Full Syllabus
                </Button>
              </Link>
            </div>

            {studyPlan.length === 0 ? (
              <div className="solis-cockpit-empty-stub">
                <span>Nothing planned for today yet. Shape your first study block.</span>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => navigate('/app/study')}
                >
                  Schedule Topic
                </Button>
              </div>
            ) : (
              <div className="solis-flow-list">
                {studyPlan.slice(0, 3).map((item) => (
                  <div key={item.id} className="solis-flow-item">
                    <div className="solis-flow-item__main">
                      <Checkbox
                        checked={item.completed}
                        onChange={async () => {
                          try {
                            const updated = await dataService.study.togglePlanItem(item.id);
                            setStudyPlan((prev) => prev.map((p) => (p.id === item.id ? updated : p)));
                          } catch {
                            addToast({ title: 'Update failed', type: 'error' });
                          }
                        }}
                        aria-label={`Study item ${item.title}`}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', textDecoration: item.completed ? 'line-through' : 'none' }}>
                          {item.title}
                        </div>
                        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                          {item.subjectName} • {item.targetMinutes}m ({item.scheduledTime})
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="subtle"
                      size="sm"
                      className="tactile-press"
                      leftIcon={<Play size={12} />}
                      onClick={() => navigate(`/app/focus?subjectId=${item.subjectId}&planId=${item.id}&title=${encodeURIComponent(item.title)}`)}
                    >
                      Focus
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Supporting Stream: Subject Worlds & Knowledge Studio & Rituals */}
        <div className="solis-flow-secondary-stream">
          {/* Knowledge Disciplines (Subject Worlds) */}
          <section className="solis-flow-section">
            <div className="solis-flow-section__header">
              <div className="solis-flow-section__title">
                <Layers size={18} color="var(--color-lavender-500)" />
                <span>Knowledge Disciplines</span>
              </div>
              <Link to="/app/study">
                <Button variant="ghost" size="sm">Manage</Button>
              </Link>
            </div>

            <div className="solis-subject-grid">
              {subjects.filter((s) => s.status !== 'archived').slice(0, 4).map((sub) => {
                const studiedHours = recentSessions
                  .filter(s => s.subjectId === sub.id)
                  .reduce((acc, s) => acc + (s.durationMinutes || 0), 0) / 60;
                
                return (
                <div
                  key={sub.id}
                  className="solis-subject-world-card"
                  onClick={() => navigate(`/app/study?subjectId=${sub.id}`)}
                  style={{ cursor: 'pointer' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Badge variant={sub.color as any || 'coral'}>
                      {sub.code || 'CORE'}
                    </Badge>
                    <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                      {sub.targetHoursPerWeek}h/wk
                    </span>
                  </div>
                  <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>
                    {sub.name}
                  </div>
                  <Progress value={studiedHours} max={sub.targetHoursPerWeek || 10} size="sm" variant={sub.color as any || 'coral'} />
                </div>
              )})}
            </div>
          </section>

          {/* Knowledge Studio Recent Insights */}
          <section className="solis-flow-section">
            <div className="solis-flow-section__header">
              <div className="solis-flow-section__title">
                <FileText size={18} color="var(--color-sage-500)" />
                <span>Knowledge Studio</span>
              </div>
              <Link to="/app/notes">
                <Button variant="ghost" size="sm">Studio</Button>
              </Link>
            </div>

            <KnowledgeResurfacingCard notes={notes} />

            {notes.length === 0 ? (
              <div className="solis-cockpit-empty-stub">
                <span>External memory is clear. Synthesize your first note.</span>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => navigate('/app/notes')}
                >
                  New Note
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {notes.slice(0, 2).map((n) => (
                  <div
                    key={n.id}
                    className="solis-flow-item"
                    onClick={() => navigate(`/app/notes?id=${n.id}`)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>{n.title}</div>
                      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                        {n.subjectName || 'General'} • {n.category}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Daily Rituals Strip */}
          <section className="solis-flow-section">
            <div className="solis-flow-section__header">
              <div className="solis-flow-section__title">
                <Repeat size={18} color="var(--color-sage-500)" />
                <span>Daily Rituals</span>
                <Badge variant="sage">{habits.filter((h) => h.completedToday).length}/{habits.length}</Badge>
              </div>
              <Link to="/app/habits">
                <Button variant="ghost" size="sm">Habits & Rituals</Button>
              </Link>
            </div>

            {habits.length === 0 ? (
              <div className="solis-cockpit-empty-stub">
                <span>No daily rituals active today. Build your first habit.</span>
                <Button
                  variant="subtle"
                  size="sm"
                  onClick={() => navigate('/app/habits')}
                >
                  Create Habit
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {habits.slice(0, 4).map((h) => (
                  <div key={h.id} className="solis-habit-dot-row">
                    <div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', textDecoration: h.completedToday ? 'line-through' : 'none' }}>
                        {h.title}
                      </div>
                      <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                        🔥 {h.currentStreak} day streak {h.frequency ? `• ${h.frequency.replace(/_/g, ' ')}` : ''}
                      </div>
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

          {/* Recent Reflections Strip */}
          {reflections.length > 0 && (
            <section className="solis-flow-section">
              <div className="solis-flow-section__header">
                <div className="solis-flow-section__title">
                  <Moon size={18} color="var(--color-lavender-500)" />
                  <span>Evening Closures</span>
                </div>
                <Button variant="ghost" size="sm" onClick={() => setIsClosureModalOpen(true)}>
                  Reflect
                </Button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {reflections.slice(0, 2).map((ref) => (
                  <div
                    key={ref.id}
                    style={{
                      padding: '10px 12px',
                      backgroundColor: 'var(--bg-surface-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '4px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600 }}>{ref.date}</span>
                      <span style={{ fontSize: 'var(--text-micro)', color: 'var(--color-coral-500)', fontWeight: 600 }}>
                        ⚡ Energy {ref.energyScore}/5 • 🎯 Focus {ref.focusScore}/5
                      </span>
                    </div>
                    {ref.wins.length > 0 && (
                      <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>
                        🏆 {ref.wins[0]}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
      )}

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
