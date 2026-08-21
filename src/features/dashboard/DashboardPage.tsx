import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { SceneContainer, SceneAtmosphere } from '../../components/scene';
import { TimeBlockGrid } from '../../components/features/Planning/TimeBlockGrid';
import { RecurringRoutinesModal } from '../../components/features/Planning/RecurringRoutinesModal';
import { EveningClosureModal } from '../../components/features/Reflection/EveningClosureModal';
import { CognitiveLoadAlert } from '../../components/features/Analytics/CognitiveLoadAlert';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { dataService } from '../../services/dataService';
import { Task } from '../../types/task';
import { StudyPlanItem, StudySubject, StudySession, StudyTopic } from '../../types/study';
import { Note } from '../../types/note';
import { Habit } from '../../types/habit';
import { FocusSession } from '../../types/focus';
import { DailySummary } from '../../types/analytics';
import { RecurringStudyRoutine, TimeBlock } from '../../types/planning';
import { DailyReflection } from '../../types/reflection';
import { getTimeOfDayGreeting, formatFriendlyDate, getISODateString } from '../../utils/date';
import { calculateDailySummary } from '../../utils/productivity';
import { generateSolisIntelligenceReport } from '../../utils/intelligence';
import { evaluateCognitiveLoad } from '../../utils/intelligence/masteryIntelligence';
import { buildTimeBlocks, findTimeBlockConflicts, calculateTimeAllocation } from '../../utils/planning/timeBlocking';
import { ActivationWelcomeModal } from '../../components/features/Activation/ActivationWelcomeModal';
import { NextBestActionCard } from '../../components/features/Activation/NextBestActionCard';
import { ContextualHelp } from '../../components/ui/ContextualHelp/ContextualHelp';
import { useGuide } from '../../context/GuideContext';
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
  const [summary, setSummary] = useState<DailySummary | null>(() => queryCache.get<DailySummary>('daily_summary'));
  const [viewMode, setViewMode] = useState<'lists' | 'timeline'>('lists');

  const { openGuide } = useGuide();

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
  const todayKey = `solis_daily_intention_${getISODateString()}`;
  const [dailyIntention, setDailyIntention] = useState(() => {
    return localStorage.getItem(todayKey) || '';
  });

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
        refRes
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
        dataService.reflections ? dataService.reflections.getReflections(5) : Promise.resolve([])
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
      addToast({
        title: updated.status === 'completed' ? 'Task Completed' : 'Task Reopened',
        description: updated.title,
        type: 'success'
      });
    } catch {
      setTasks(prevTasks);
      addToast({
        title: 'Update failed',
        type: 'error'
      });
    }
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
    navigate(`/app/focus?subjectId=${block.subjectId || ''}&title=${encodeURIComponent(block.title)}`);
  };

  const handleSaveEveningClosure = async (refData: Partial<DailyReflection>) => {
    try {
      if (dataService.reflections) {
        await dataService.reflections.saveDailyReflection(refData);
      }

      if (refData.tomorrowIntentions && refData.tomorrowIntentions.length > 0) {
        await dataService.tasks.createTask({
          title: refData.tomorrowIntentions[0],
          category: 'deep_work',
          priority: 'high',
          tags: ['tomorrow-priority']
        });
      }

      if (refData.synthesisNotes) {
        await dataService.notes.createNote({
          title: `Daily Reflection — ${formatFriendlyDate(getISODateString())}`,
          content: `${refData.synthesisNotes}\n\n**Key Wins:**\n${(refData.wins || []).map((w) => `- ${w}`).join('\n')}\n\n**Tomorrow's Intentions:**\n${(refData.tomorrowIntentions || []).map((t) => `- ${t}`).join('\n')}`,
          category: 'reflection',
          tags: ['daily-closure', 'reflection']
        });
      }

      addToast({
        title: 'Evening Closure Recorded',
        description: 'Daily reflection, wins, and tomorrow intentions saved.',
        type: 'success'
      });
      await loadDashboardData();
    } catch {
      addToast({
        title: 'Closure failed to save',
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
      {/* ADAPTIVE NEXT BEST ACTION GUIDANCE */}
      {!isNextActionDismissed && nextBestAction.id !== 'action_continue_flow' && (
        <NextBestActionCard
          action={nextBestAction}
          onDismiss={() => setIsNextActionDismissed(true)}
        />
      )}

      {/* 01 // ARRIVAL SCENE & CONTINUITY */}
      <SceneContainer sceneNumber="01 // ARRIVAL" sceneTitle="Daily Rhythm & Focus Field">
        <div className="solis-arrival-content">
          <div>
            <div className="solis-arrival-greeting__meta">
              <Badge variant="coral" showDot>
                {greetingInfo.period}
              </Badge>
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                Field: {user?.focusField || 'Cognitive Systems'}
              </span>
            </div>
            <h1 className="solis-arrival-greeting__title">{greetingInfo.greeting}</h1>
            <p className="solis-arrival-greeting__suggestion">{greetingInfo.suggestion}</p>

            {/* Daily Intention Line */}
            <div className="solis-daily-intention-bar">
              <Sparkles size={16} color="var(--color-coral-500)" />
              <input
                type="text"
                value={dailyIntention}
                onChange={(e) => handleSaveIntention(e.target.value)}
                placeholder="What is your singular intention today?"
                className="solis-daily-intention-input"
              />
            </div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', alignItems: 'flex-start' }}>
            <Button
              variant="accent"
              size="lg"
              className="tactile-press"
              leftIcon={<Flame size={18} />}
              onClick={() => navigate('/app/focus')}
            >
              Enter Sanctuary
            </Button>
            <button
              onClick={() => setIsClosureModalOpen(true)}
              style={{ background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: 'var(--text-caption)', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            >
              <Moon size={14} color="var(--color-lavender-500)" />
              <span>Evening Closure Ritual</span>
            </button>
          </div>
        </div>

        {/* REAL CONTINUITY / MEMORY STRIP */}
        {(lastFocus || lastStudy || nextPendingPlan || latestNote) && (
          <div className="solis-continuity-strip" style={{ marginTop: 'var(--space-lg)' }}>
            <div className="solis-continuity-meta">
              <Compass size={18} color="var(--color-coral-500)" />
              <div>
                <div className="solis-continuity-title">
                  {nextPendingPlan
                    ? `Next Scheduled: ${nextPendingPlan.title}`
                    : lastFocus
                    ? `Last Focused on: ${lastFocus.title || lastFocus.topic}`
                    : `Latest Thought: ${latestNote?.title}`}
                </div>
                <div className="solis-continuity-subtitle">
                  {nextPendingPlan
                    ? `${nextPendingPlan.subjectName || 'General'} • ${nextPendingPlan.targetMinutes}m planned (${nextPendingPlan.scheduledTime || 'Today'})`
                    : lastFocus
                    ? `${lastFocus.subjectName || 'General Flow'} • ${lastFocus.durationMinutes}m logged`
                    : `${latestNote?.subjectName || 'Knowledge Studio'} • ${formatFriendlyDate(latestNote?.updatedAt || '')}`}
                </div>
              </div>
            </div>

            <div>
              {nextPendingPlan ? (
                <Button
                  variant="subtle"
                  size="sm"
                  className="tactile-press"
                  rightIcon={<ChevronRight size={14} />}
                  onClick={() => navigate(`/app/focus?subjectId=${nextPendingPlan.subjectId}&planId=${nextPendingPlan.id}&title=${encodeURIComponent(nextPendingPlan.title)}`)}
                >
                  Continue Where You Left Off
                </Button>
              ) : lastFocus ? (
                <Button
                  variant="subtle"
                  size="sm"
                  className="tactile-press"
                  rightIcon={<ChevronRight size={14} />}
                  onClick={() => navigate(`/app/focus?subjectId=${lastFocus.subjectId || ''}`)}
                >
                  Resume Subject Focus
                </Button>
              ) : (
                <Button
                  variant="subtle"
                  size="sm"
                  className="tactile-press"
                  rightIcon={<ChevronRight size={14} />}
                  onClick={() => navigate('/app/notes')}
                >
                  Open External Memory
                </Button>
              )}
            </div>
          </div>
        )}

        {/* DETERMINISTIC INTELLIGENCE RECOMMENDATION POD */}
        {topRecommendation && (
          <div
            style={{
              marginTop: 'var(--space-md)',
              padding: '16px 20px',
              borderRadius: 'var(--radius-xl)',
              background: 'var(--bg-surface-primary)',
              border: '1px solid var(--border-subtle)',
              borderLeft: '4px solid var(--color-coral-500)',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Sparkles size={16} color="var(--color-coral-500)" />
                <span style={{ fontSize: 'var(--text-micro)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
                  Recommended Focus Step
                </span>
              </div>
              <Badge variant={topRecommendation.type === 'spaced_retrieval' ? 'amber' : 'coral'}>
                {topRecommendation.type === 'spaced_retrieval' ? 'Spaced Retrieval' : topRecommendation.type === 'retention_intervention' ? 'Retention Alert' : 'Daily Flow'}
              </Badge>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <div style={{ fontFamily: 'var(--font-interface)', fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>
                {topRecommendation.title}
              </div>
              <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                {topRecommendation.whyExplanation || topRecommendation.evidence}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
              <Button
                variant="subtle"
                size="sm"
                className="tactile-press"
                rightIcon={<ChevronRight size={14} />}
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
                {topRecommendation.actionLabel || topRecommendation.action || 'Start Action'}
              </Button>
            </div>
          </div>
        )}
      </SceneContainer>

      {/* 02 // SCULPTURAL MOMENTUM SCENE (CALM & ENCOURAGING) */}
      <SceneContainer sceneNumber="02 // MOMENTUM" sceneTitle="Daily Resonance & Cognitive Velocity">
        {cognitiveReport.status !== 'optimal' && (
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <CognitiveLoadAlert report={cognitiveReport} />
          </div>
        )}
        <div className="solis-momentum-hero">
          <SceneAtmosphere glowPrimary="coral" glowSecondary="amber" intensity="vibrant" />
          <div className="solis-momentum-hero__layout">
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Sparkles size={16} color="var(--color-coral-300)" />
                <span style={{ fontSize: 'var(--text-caption)', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--color-charcoal-300)' }}>
                  State of Momentum
                </span>
                <ContextualHelp
                  title="What is Momentum?"
                  content="Momentum is a composite daily measure (0–100%) tracking intentional task completion, study target hours, and deep focus consistency."
                  example="Completing 3 planned tasks and a 45m focus session accumulates high momentum."
                  guideId="what-is-solis"
                  onOpenGuide={openGuide}
                />
                <button
                  onClick={() => setIsScoreModalOpen(true)}
                  style={{ color: 'var(--color-charcoal-300)', padding: '2px', background: 'none', border: 'none', cursor: 'pointer', display: 'flex' }}
                  title="View deterministic formula breakdown"
                >
                  <Info size={14} />
                </button>
              </div>

              <div className="solis-momentum-score-sculpture">
                {Boolean(summary && (summary.totalTasksCount > 0 || summary.totalStudyMinutes > 0 || summary.focusSessionsCount > 0)) ? (
                  <>
                    {summary?.momentumScore ?? 0}
                    <span>%</span>
                  </>
                ) : (
                  <span>—</span>
                )}
              </div>

              <div style={{ color: 'var(--color-charcoal-300)', fontSize: 'var(--text-body-md)', marginTop: '8px', lineHeight: 1.5 }}>
                {Boolean(summary && (summary.totalTasksCount > 0 || summary.totalStudyMinutes > 0 || summary.focusSessionsCount > 0))
                  ? summary?.momentumScore && summary.momentumScore >= 80
                    ? "You're moving the important things forward with calm distinction."
                    : 'Consistent study blocks and small rituals accumulate lasting flow.'
                  : 'Your daily rhythm is forming. Complete your first study block to track momentum.'}
              </div>
            </div>

            <div className="solis-momentum-quad-grid">
              <div className="solis-momentum-quad-pill">
                <div style={{ fontSize: 'var(--text-micro)', textTransform: 'uppercase', color: 'var(--color-charcoal-300)', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Tasks Velocity
                </div>
                <div style={{ fontSize: 'var(--text-heading-3)', fontWeight: 600, color: 'var(--color-ivory-50)', marginBottom: '6px' }}>
                  {scoreDetails.taskScore}%
                </div>
                <Progress value={scoreDetails.taskScore} max={100} size="sm" variant="coral" />
              </div>

              <div className="solis-momentum-quad-pill">
                <div style={{ fontSize: 'var(--text-micro)', textTransform: 'uppercase', color: 'var(--color-charcoal-300)', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Study Volume
                </div>
                <div style={{ fontSize: 'var(--text-heading-3)', fontWeight: 600, color: 'var(--color-ivory-50)', marginBottom: '6px' }}>
                  {summary?.totalStudyMinutes || 0}m / 180m
                </div>
                <Progress value={summary?.totalStudyMinutes || 0} max={180} size="sm" variant="amber" />
              </div>

              <div className="solis-momentum-quad-pill">
                <div style={{ fontSize: 'var(--text-micro)', textTransform: 'uppercase', color: 'var(--color-charcoal-300)', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Deep Focus
                </div>
                <div style={{ fontSize: 'var(--text-heading-3)', fontWeight: 600, color: 'var(--color-ivory-50)', marginBottom: '6px' }}>
                  {scoreDetails.focusScore}%
                </div>
                <Progress value={scoreDetails.focusScore} max={100} size="sm" variant="lavender" />
              </div>

              <div className="solis-momentum-quad-pill">
                <div style={{ fontSize: 'var(--text-micro)', textTransform: 'uppercase', color: 'var(--color-charcoal-300)', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Ritual Consistency
                </div>
                <div style={{ fontSize: 'var(--text-heading-3)', fontWeight: 600, color: 'var(--color-ivory-50)', marginBottom: '6px' }}>
                  {summary?.habitsCompletedRatio || '0/0'}
                </div>
                <Progress value={scoreDetails.habitScore} max={100} size="sm" variant="sage" />
              </div>
            </div>
          </div>
        </div>
      </SceneContainer>

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
              backgroundColor: viewMode === 'lists' ? 'var(--color-coral-100)' : 'var(--bg-surface-primary)',
              color: viewMode === 'lists' ? 'var(--color-coral-600)' : 'var(--text-secondary)',
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
              backgroundColor: viewMode === 'timeline' ? 'var(--color-coral-100)' : 'var(--bg-surface-primary)',
              color: viewMode === 'timeline' ? 'var(--color-coral-600)' : 'var(--text-secondary)',
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
              <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: 'var(--text-body-sm)' }}>
                  Nothing planned for today yet. Shape your first study block.
                </p>
                <Button
                  variant="subtle"
                  size="sm"
                  style={{ marginTop: '10px' }}
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
                        onChange={() => {}}
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

          {/* Priority Intentions */}
          <section className="solis-flow-section">
            <div className="solis-flow-section__header">
              <div className="solis-flow-section__title">
                <CheckCircle2 size={20} color="var(--color-coral-500)" />
                <span>Priority Intentions</span>
                <Badge variant="coral">{activeTasks.length} pending</Badge>
              </div>
              <Link to="/app/tasks">
                <Button variant="ghost" size="sm" rightIcon={<ArrowRight size={14} />}>
                  Task Sanctuary
                </Button>
              </Link>
            </div>

            {activeTasks.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', background: 'var(--bg-surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontFamily: 'var(--font-display)', fontStyle: 'italic', color: 'var(--text-secondary)', fontSize: 'var(--text-body-sm)' }}>
                  All clear. No urgent tasks requiring attention.
                </p>
              </div>
            ) : (
              <div className="solis-flow-list">
                {activeTasks.slice(0, 4).map((task) => (
                  <div
                    key={task.id}
                    className="solis-flow-item"
                    onClick={() => navigate('/app/tasks')}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="solis-flow-item__main">
                      <Checkbox
                        checked={task.status === 'completed'}
                        onChange={() => handleToggleTask(task.id)}
                        aria-label={`Complete task ${task.title}`}
                      />
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
                          {task.title}
                        </div>
                        <div style={{ display: 'flex', gap: '8px', marginTop: '2px', alignItems: 'center' }}>
                          <Badge variant={task.priority === 'urgent' ? 'coral' : task.priority === 'high' ? 'amber' : 'neutral'}>
                            {task.priority}
                          </Badge>
                          <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                            {task.category}
                          </span>
                        </div>
                      </div>
                    </div>
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
              {subjects.filter((s) => s.status !== 'archived').slice(0, 4).map((sub) => (
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
                  <Progress value={sub.targetHoursPerWeek ? (sub.targetHoursPerWeek * 0.4) : 40} max={sub.targetHoursPerWeek || 10} size="sm" variant={sub.color as any || 'coral'} />
                </div>
              ))}
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

            {notes.length === 0 ? (
              <div style={{ padding: '16px', textAlign: 'center', background: 'var(--bg-surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                  External memory is empty. Synthesize your first note.
                </p>
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
              </div>
              <Link to="/app/habits">
                <Button variant="ghost" size="sm">Constellation</Button>
              </Link>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {habits.slice(0, 3).map((h) => (
                <div key={h.id} className="solis-habit-dot-row">
                  <div>
                    <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>{h.title}</div>
                    <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                      🔥 {h.currentStreak} day streak
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
