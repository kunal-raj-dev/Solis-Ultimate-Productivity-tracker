import React, { useState, useEffect, useMemo } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Target } from 'lucide-react';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { Sidebar } from '../components/layout/Sidebar/Sidebar';
import { AppHeader } from '../components/layout/AppHeader/AppHeader';
import { MobileNav } from '../components/layout/MobileNav/MobileNav';
import { AtmosphereCanvas } from '../components/layout/AtmosphereCanvas/AtmosphereCanvas';
import { CommandPalette } from '../components/layout/CommandPalette/CommandPalette';
import { AskSolisDrawer } from '../components/layout/AskSolisDrawer/AskSolisDrawer';
import { ExamWorkspaceModal } from '../components/features/Goals/ExamWorkspaceModal';
import { useKeyboardShortcuts } from '../hooks/useKeyboardShortcuts';
import { useCircadianCanvas } from '../hooks/useCircadianCanvas';
import { FocusProvider } from '../context/FocusContext';
import { useToast } from '../context/ToastContext';
import { MiniFocusPlayer } from '../components/layout/MiniFocusPlayer/MiniFocusPlayer';
import { isFocusRoute } from '../constants/navigation';
import { dataService } from '../services/dataService';
import { getISODateString } from '../utils/date';
import { formatErrorMessage } from '../utils/errors';
import { notificationService } from '../services/notifications/notification.service';
import { globalNotifiedStarts, globalNotifiedReviews } from '../hooks/useTimeBlockScheduler';
import {
  calculateTimeCushion,
  formatCushionHours,
  projectRoutineCommitmentsByDay,
  TIME_CUSHION_STATUS_META
} from '../utils/planning/timeCushion';
import { getDefaultDailyCapacityMinutes } from '../utils/tasks/workloadCalculator';
import { Goal } from '../types/goal';
import { StudyTopic } from '../types/study';
import { Flashcard } from '../types/learning';
import { Habit } from '../types/habit';
import { RecurringStudyRoutine } from '../types/planning';
import { cn } from '../utils/classNames';
import './AppLayout.css';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { addToast } = useToast();
  const isFocus = isFocusRoute(location.pathname);
  const [isCommandOpen, setIsCommandOpen] = useState(false);
  const [isAskSolisOpen, setIsAskSolisOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('solis_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  useCircadianCanvas();

  // Global Time Block Monitor: ensures scheduled alerts fire across all views
  useEffect(() => {
    let isMounted = true;
    const checkTodaySchedule = async () => {
      try {
        const todayStr = getISODateString(new Date());
        const blocks = await dataService.tasks.getTimeBlocks(todayStr);
        if (!isMounted || !blocks || !blocks.length) return;

        const now = new Date();
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        const nowTotalMins = currentHour * 60 + currentMinute;

        blocks.forEach((block) => {
          if (block.date !== todayStr) return;
          const blockKey = `${block.id}_${block.date}_${block.startHour}_${block.startMinute || 0}`;
          const totalStartMins = block.startHour * 60 + (block.startMinute || 0);
          const totalEndMins = totalStartMins + (block.durationMinutes || 60);
          const blockEndHour = Math.floor(totalEndMins / 60) % 24;

          const elapsedSinceStart = nowTotalMins - totalStartMins;
          if (elapsedSinceStart >= 0 && elapsedSinceStart <= 3 && block.status === 'planned') {
            if (!globalNotifiedStarts.has(blockKey)) {
              globalNotifiedStarts.add(blockKey);
              notificationService.notifyTimeBlockStart(block.taskTitle, block.durationMinutes);
            }
          }

          const elapsedSinceEnd = nowTotalMins - totalEndMins;
          if (elapsedSinceEnd >= 0 && elapsedSinceEnd <= 15 && (block.status === 'planned' || block.status === 'active')) {
            if (!globalNotifiedReviews.has(blockKey)) {
              globalNotifiedReviews.add(blockKey);
              notificationService.notifyHourReviewPrompt(blockEndHour, block.taskTitle);
            }
          }
        });
      } catch {
        // Silently skip background poll errors
      }
    };

    checkTodaySchedule();
    const interval = setInterval(checkTodaySchedule, 30000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  const handleToggleSidebar = () => {
    setIsSidebarCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem('solis_sidebar_collapsed', String(next));
      } catch {}
      return next;
    });
  };

  const isTasksRoute = location.pathname.startsWith('/app/tasks');

  // ---------------------------------------------------------------------------
  // Persistent Global D-Day Pill (plan §2.4)
  // Tracks the most urgent active exam goal so its countdown anchor is
  // available from any page; clicking opens the Exam Command Workspace.
  // ---------------------------------------------------------------------------
  const [examGoal, setExamGoal] = useState<Goal | null>(null);
  const [examTopics, setExamTopics] = useState<StudyTopic[]>([]);
  const [examRoutines, setExamRoutines] = useState<RecurringStudyRoutine[]>([]);
  const [isExamCushionReady, setIsExamCushionReady] = useState(false);
  const [examFlashcards, setExamFlashcards] = useState<Flashcard[]>([]);
  const [examHabits, setExamHabits] = useState<Habit[]>([]);
  const [isExamWorkspaceOpen, setIsExamWorkspaceOpen] = useState(false);
  const [isCompactHeader, setIsCompactHeader] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 900px)').matches
  );
  // The Sidebar is display:none below 1024px (Sidebar.css); the pill centers
  // on the header, which spans [sidebar edge, viewport] when it is visible.
  const [isSidebarVisible, setIsSidebarVisible] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(min-width: 1024px)').matches
  );

  useEffect(() => {
    const compactQuery = window.matchMedia('(max-width: 900px)');
    const sidebarQuery = window.matchMedia('(min-width: 1024px)');
    const onCompactChange = (event: MediaQueryListEvent) => setIsCompactHeader(event.matches);
    const onSidebarChange = (event: MediaQueryListEvent) => setIsSidebarVisible(event.matches);
    compactQuery.addEventListener('change', onCompactChange);
    sidebarQuery.addEventListener('change', onSidebarChange);
    return () => {
      compactQuery.removeEventListener('change', onCompactChange);
      sidebarQuery.removeEventListener('change', onSidebarChange);
    };
  }, []);

  useEffect(() => {
    let isMounted = true;
    // Sequence guard: rapid dataService notifications can overlap loads; only
    // the newest run may commit state (P2F7 out-of-order protection).
    let currentRun = 0;
    const loadExamHorizon = async () => {
      const runId = ++currentRun;
      try {
        if (!dataService.goals) return;
        const goals = await dataService.goals.getGoals();
        if (!isMounted || runId !== currentRun) return;
        // Same active-exam predicate and ordering as ExamHorizonBar.
        const activeExamGoals = (goals || [])
          .filter(
            (g) =>
              (g.experienceType === 'exam' || g.category === 'academic') && g.status === 'active'
          )
          .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
        const urgentGoal = activeExamGoals[0] || null;
        setExamGoal(urgentGoal);
        if (!urgentGoal) {
          setExamTopics([]);
          setExamRoutines([]);
          setIsExamCushionReady(false);
          return;
        }
        const [topicsRes, routinesRes] = await Promise.allSettled([
          urgentGoal.subjectId
            ? dataService.study.getTopics(urgentGoal.subjectId)
            : Promise.resolve([]),
          dataService.routines ? dataService.routines.getRoutines() : Promise.resolve([])
        ]);
        if (!isMounted || runId !== currentRun) return;
        setExamTopics(topicsRes.status === 'fulfilled' ? topicsRes.value || [] : []);
        setExamRoutines(routinesRes.status === 'fulfilled' ? routinesRes.value || [] : []);
        setIsExamCushionReady(true);
      } catch {
        // Background horizon reads stay silent; the pill simply stays hidden.
      }
    };

    loadExamHorizon();
    // Plan §6.1 scoped entity pub/sub: the exam horizon pill reads goals and
    // their topics; routines broadcast on 'all'.
    const unsubscribe = dataService.subscribe(loadExamHorizon, ['goals', 'study']);
    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const examCushion = useMemo(() => {
    if (!examGoal) return null;
    return calculateTimeCushion({
      examDate: examGoal.targetDate,
      subjectId: examGoal.subjectId || '',
      topics: examTopics,
      dailyCapacityMinutes: getDefaultDailyCapacityMinutes(),
      existingCommitmentsMinutesByDay: projectRoutineCommitmentsByDay(
        examRoutines,
        examGoal.targetDate
      )
    });
  }, [examGoal, examTopics, examRoutines]);

  const handleOpenExamWorkspace = () => {
    setIsExamWorkspaceOpen(true);
    // Modal-support reads (cached by the query cache); the modal opens instantly.
    if (dataService.flashcards) {
      dataService.flashcards
        .getFlashcards()
        .then((res) => setExamFlashcards(res || []))
        .catch(() => {});
    }
    if (dataService.habits) {
      dataService.habits
        .getHabits()
        .then((res) => setExamHabits(res || []))
        .catch(() => {});
    }
  };

  const handleToggleExamMilestone = async (goalId: string, milestoneId: string) => {
    try {
      const updatedGoal = await dataService.goals.toggleMilestone(goalId, milestoneId);
      setExamGoal((prev) => (prev && prev.id === updatedGoal.id ? updatedGoal : prev));
    } catch (err) {
      addToast({
        title: 'Milestone update failed',
        description: formatErrorMessage(err),
        type: 'error'
      });
    }
  };

  const handleExamRecallDrill = () => {
    setIsExamWorkspaceOpen(false);
    const query = new URLSearchParams();
    if (examGoal?.subjectId) query.set('subjectId', examGoal.subjectId);
    query.set('action', 'review');
    navigate(`/app/study?${query.toString()}`);
  };

  const handleExamLaunchFocus = (subjectId?: string, title?: string) => {
    setIsExamWorkspaceOpen(false);
    const query = new URLSearchParams();
    if (subjectId) query.set('subjectId', subjectId);
    query.set('title', title || `Exam Prep: ${examGoal?.title || 'Exam'}`);
    navigate(`/app/focus?${query.toString()}`);
  };

  useKeyboardShortcuts({
    onOpenCommandPalette: () => setIsCommandOpen(true),
    onOpenAskSolis: () => setIsAskSolisOpen(true),
    onToggleSidebar: handleToggleSidebar,
    onNewNote: isTasksRoute ? undefined : () => navigate('/app/notes?action=new'),
    onNewTask: isTasksRoute ? undefined : () => navigate('/app/tasks?action=new'),
    onStartFocus: () => navigate('/app/focus')
  });

  return (
    <ProtectedRoute>
      <FocusProvider>
        <div className={cn('solis-app-shell', isFocus && 'solis-app-shell--focus')}>
          <AtmosphereCanvas intensity="subtle" />
          
          {!isFocus && (
            <Sidebar
              isCollapsed={isSidebarCollapsed}
              onToggleCollapse={handleToggleSidebar}
            />
          )}

          <div className="solis-app-main-wrapper">
            {!isFocus && (
              <AppHeader
                onOpenSearch={() => setIsCommandOpen(true)}
                onOpenAskSolis={() => setIsAskSolisOpen(true)}
              />
            )}

            {/* Persistent Global D-Day Pill (plan §2.4): `🎯 MCAT: D-38 • On Track (+4h)` */}
            {!isFocus && examGoal && examCushion && (
              <button
                type="button"
                onClick={handleOpenExamWorkspace}
                aria-label={`Open exam workspace for ${examGoal.title}`}
                style={{
                  position: 'fixed',
                  top: 'calc((var(--header-height) - 28px) / 2)',
                  // Center on the top navbar, not the viewport: the header spans
                  // [sidebar edge, viewport] whenever the Sidebar is visible.
                  left: isSidebarVisible
                    ? `calc(50% + ${
                        isSidebarCollapsed ? 'var(--sidebar-collapsed-width)' : 'var(--sidebar-width)'
                      } / 2)`
                    : '50%',
                  transform: 'translateX(-50%)',
                  zIndex: 201, // one layer above --z-header (200), below modals (400+)
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  maxWidth: isCompactHeader ? '34vw' : 'min(40vw, 320px)',
                  padding: '4px 12px',
                  backgroundColor: 'var(--bg-canvas-glass)',
                  backdropFilter: 'blur(8px)',
                  WebkitBackdropFilter: 'blur(8px)',
                  border: '1px solid var(--border-subtle)',
                  borderRadius: 'var(--radius-full)',
                  cursor: 'pointer',
                  fontFamily: 'var(--font-interface)',
                  fontSize: 'var(--text-caption)',
                  color: 'var(--text-secondary)',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden'
                }}
              >
                <Target
                  size={12}
                  style={{
                    color: TIME_CUSHION_STATUS_META[examCushion.status].colorToken,
                    flexShrink: 0
                  }}
                  aria-hidden="true"
                />
                <span
                  style={{ color: 'var(--text-primary)', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}
                >
                  {!isCompactHeader && `${examGoal.title}: `}
                  {examCushion.daysRemaining === 0 ? 'D-Day' : `D-${examCushion.daysRemaining}`}
                </span>
                {isExamCushionReady && (
                  <span
                    style={{
                      color: TIME_CUSHION_STATUS_META[examCushion.status].colorToken,
                      fontFamily: 'var(--font-mono)',
                      fontVariantNumeric: 'tabular-nums',
                      fontWeight: 600,
                      flexShrink: 0
                    }}
                  >
                    • {TIME_CUSHION_STATUS_META[examCushion.status].label} (
                    {examCushion.cushionHours >= 0 ? '+' : '-'}
                    {formatCushionHours(examCushion.cushionHours)}h)
                  </span>
                )}
              </button>
            )}

            <main className={cn('solis-app-view', isFocus && 'solis-app-view--focus')}>
              <Outlet />
            </main>
          </div>

          {/* Plan §7.2: canonical 5-tab mobile bottom bar (master.md §9.4);
              hidden ≥1024px by MobileNav.css, so it never conflicts with the Sidebar. */}
          {!isFocus && <MobileNav />}
          {!isFocus && <MiniFocusPlayer />}

          <CommandPalette
            isOpen={isCommandOpen}
            onClose={() => setIsCommandOpen(false)}
          />

          <AskSolisDrawer
            isOpen={isAskSolisOpen}
            onClose={() => setIsAskSolisOpen(false)}
          />

          {/* Exam Command Workspace reachable from any page via the D-Day pill */}
          <ExamWorkspaceModal
            isOpen={isExamWorkspaceOpen}
            onClose={() => setIsExamWorkspaceOpen(false)}
            goal={examGoal}
            topics={examTopics}
            flashcards={examFlashcards}
            habits={examHabits}
            onToggleMilestone={handleToggleExamMilestone}
            onStartRecallDrill={handleExamRecallDrill}
            onLaunchFocus={handleExamLaunchFocus}
          />
        </div>
      </FocusProvider>
    </ProtectedRoute>
  );
};
