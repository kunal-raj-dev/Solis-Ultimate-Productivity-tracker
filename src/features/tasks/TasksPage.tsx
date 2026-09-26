import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Search,
  Clock,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { SectionHeader } from '../../components/layout/SectionHeader/SectionHeader';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { Input } from '../../components/ui/Input/Input';
import { DatePicker, TimePicker } from '../../components/ui/DatePicker';
import { CustomSelect } from '../../components/ui/Select/CustomSelect';
import { SegmentedControl } from '../../components/ui/SegmentedControl/SegmentedControl';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Modal } from '../../components/feedback/Modal/Modal';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { useToast } from '../../context/ToastContext';
import { useGuide } from '../../context/GuideContext';
import { dataService } from '../../services/dataService';
import {
  Task,
  TaskCategory,
  TaskTimeFilter,
  TaskSortField,
  TaskTimeBlock,
  TaskViewMode,
  TimeBlockReviewPayload
} from '../../types/task';
import { StudySubject } from '../../types/study';
import { Goal } from '../../types/goal';
import { PriorityLevel } from '../../types/common';
import { formatFriendlyDate, getISODateString, addDays } from '../../utils/date';
import { ValidationError } from '../../utils/validation';
import { useTimeBlockScheduler } from '../../hooks/useTimeBlockScheduler';
import { HourlyPlannerView } from './HourlyPlannerView';
import { TaskInboxView } from './TaskInboxView';
import { TaskPriorityMatrix } from './TaskPriorityMatrix';
import { CreateTimeBlockModal } from './CreateTimeBlockModal';
import { HourReviewModal } from './HourReviewModal';
import { SmartTaskInput } from './components/SmartTaskInput';
import { TaskRow } from './components/TaskRow';
import { calculateWorkload, getGentleStartDailyCapacityMinutes } from '../../utils/tasks/workloadCalculator';
import { getReplanSuggestions, findNextAvailableSlot } from '../../utils/tasks/replanEngine';
import { hapticsEngine } from '../../utils/focus/hapticsEngine';
import './TasksPage.css';

export const TasksPage: React.FC = () => {
  const { addToast } = useToast();
  const { openGuide } = useGuide();
  const navigate = useNavigate();

  // Core Data State
  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [initialLoadStatus, setInitialLoadStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [isRetrying, setIsRetrying] = useState(false);

  // View Mode & Temporal State
  const [viewMode, setViewMode] = useState<TaskViewMode>(() => {
    if (typeof window !== 'undefined') {
      const mode = new URLSearchParams(window.location.search).get('view');
      if (mode === 'schedule' || mode === 'today' || mode === 'timeline' || mode === 'review') return 'schedule';
      if (mode === 'matrix') return 'matrix';
      if (mode === 'list' || mode === 'inbox') return 'list';
    }
    return 'list';
  });
  const [selectedDate, setSelectedDate] = useState<string>(getISODateString(new Date()));
  const [timeBlocks, setTimeBlocks] = useState<TaskTimeBlock[]>([]);

  // Time Block Modals State
  const [isCreateBlockModalOpen, setIsCreateBlockModalOpen] = useState(false);
  const [selectedBlockHour, setSelectedBlockHour] = useState<number>(new Date().getHours());
  const [editingBlock, setEditingBlock] = useState<TaskTimeBlock | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [reviewingBlock, setReviewingBlock] = useState<TaskTimeBlock | null>(null);

  // URL Params for deep linking
  const [searchParams, setSearchParams] = useSearchParams();

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TaskTimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<TaskSortField>('priority');

  // Filter out archived subjects for task assignment
  const activeSubjects = useMemo(() => subjects.filter((s) => s.status !== 'archived'), [subjects]);

  // Task Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletedTasksStack, setDeletedTasksStack] = useState<Task[]>([]);
  const [showMoreOptions, setShowMoreOptions] = useState(false);
  const smartInputRef = React.useRef<HTMLInputElement>(null);
  const lastCompletedTaskIdRef = React.useRef<{ id: string; timestamp: number } | null>(null);
  const lastDeletedTaskRef = React.useRef<{ task: Task; timestamp: number } | null>(null);

  // Workload Realism & Metrics
  const activeTasksCount = useMemo(() => tasks.filter((t) => t.status !== 'completed').length, [tasks]);
  const scheduledMinutes = useMemo(
    () => timeBlocks.reduce((acc, b) => acc + (b.durationMinutes || 60), 0),
    [timeBlocks]
  );
  const scheduledHours = useMemo(() => (scheduledMinutes / 60).toFixed(1), [scheduledMinutes]);
  const workload = useMemo(
    () =>
      calculateWorkload({
        date: selectedDate,
        tasks,
        timeBlocks,
        // Plan §3.4 "Gentle Start": same day-scoped 50% capacity override the
        // Today page uses, so both capacity bars agree for the same day (P3F5).
        dailyCapacityMinutes: getGentleStartDailyCapacityMinutes(selectedDate)
      }),
    [selectedDate, tasks, timeBlocks]
  );

  const workloadLabel = useMemo(() => {
    switch (workload.state) {
      case 'light':
        return 'Light Capacity';
      case 'optimal':
        return 'Optimal Focus';
      case 'heavy':
        return 'Heavy Horizon';
      case 'overcommitted':
        return 'Overcommitted';
      default:
        return 'Balanced';
    }
  }, [workload.state]);

  const todayTasks = useMemo(() => {
    return tasks.filter((t) => t.dueDate === selectedDate);
  }, [tasks, selectedDate]);

  const scheduledTaskIds = useMemo(() => {
    return new Set(timeBlocks.map((b) => b.taskId).filter(Boolean) as string[]);
  }, [timeBlocks]);

  const todayStr = getISODateString(new Date());

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      // 1. Time / Status Filter
      if (selectedTimeFilter === 'completed') {
        if (t.status !== 'completed') return false;
      } else {
        if (t.status === 'completed' || t.status === 'archived') {
          if (selectedTimeFilter !== 'all') return false;
        }

        if (selectedTimeFilter === 'today') {
          if (t.dueDate !== selectedDate) return false;
        } else if (selectedTimeFilter === 'upcoming') {
          if (!t.dueDate || t.dueDate <= selectedDate) return false;
        } else if (selectedTimeFilter === 'overdue') {
          if (!t.dueDate || t.dueDate >= todayStr) return false;
        } else if (selectedTimeFilter === 'unscheduled') {
          const isUnscheduled = !t.dueDate || t.dueDate === '' || !scheduledTaskIds.has(t.id);
          if (!isUnscheduled) return false;
        }
      }

      // 2. Domain / Category Filter
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;

      // 3. Search Query Filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchTitle = t.title.toLowerCase().includes(q);
        const matchDesc = t.description?.toLowerCase().includes(q) || false;
        const matchTag = t.tags?.some((tag) => tag.toLowerCase().includes(q)) || false;
        if (!matchTitle && !matchDesc && !matchTag) return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'priority') {
        const priorityOrder: Record<PriorityLevel, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
        return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
      }
      if (sortBy === 'dueDate') {
        if (!a.dueDate) return 1;
        if (!b.dueDate) return -1;
        return a.dueDate.localeCompare(b.dueDate);
      }
      if (sortBy === 'createdAt') {
        return (b.createdAt || '').localeCompare(a.createdAt || '');
      }
      if (sortBy === 'title') {
        return a.title.localeCompare(b.title);
      }
      return 0;
    });
  }, [tasks, selectedTimeFilter, selectedCategory, searchQuery, sortBy, selectedDate, todayStr, scheduledTaskIds]);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<TaskCategory>('study');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('medium');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formGoalId, setFormGoalId] = useState<string>('');
  const [formDueDate, setFormDueDate] = useState('');
  const [formDueTime, setFormDueTime] = useState('18:00');
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState('30');
  const [formTags, setFormTags] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const openCreateModal = useCallback(() => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('study');
    setFormPriority('medium');
    setFormSubjectId('');
    setFormGoalId(searchParams.get('goalId') || '');
    setFormDueDate(viewMode === 'schedule' || viewMode === 'today' ? selectedDate : selectedTimeFilter === 'today' ? selectedDate : '');
    setFormDueTime('18:00');
    setFormEstimatedMinutes('30');
    setFormTags('');
    setFormError(null);
    setShowMoreOptions(false);
    setIsCreateModalOpen(true);
  }, [searchParams, viewMode, selectedDate, selectedTimeFilter]);

  // Load Tasks
  const loadTasks = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoadStatus('loading');
    else setSyncStatus('syncing');

    try {
      const [dataRes, subRes, goalRes] = await Promise.allSettled([
        dataService.tasks.getTasks({
          category: selectedCategory as any,
          timeFilter: selectedTimeFilter,
          search: searchQuery,
          sortBy
        }),
        dataService.study.getSubjects(),
        dataService.goals.getGoals()
      ]);

      if (dataRes.status === 'fulfilled') {
        setTasks(dataRes.value);
        setInitialLoadStatus('success');
        setSyncStatus('idle');
      } else {
        console.error('Failed to load tasks:', dataRes.reason);
        throw dataRes.reason;
      }

      if (subRes.status === 'fulfilled') {
        setSubjects(subRes.value);
      }
      if (goalRes.status === 'fulfilled') {
        setGoals(goalRes.value);
      }
    } catch (err) {
      console.error('Failed to load tasks data:', err);
      setTasks((current) => {
        if (current.length === 0) setInitialLoadStatus('error');
        else setSyncStatus('error');
        return current;
      });
    }
  }, [selectedCategory, selectedTimeFilter, searchQuery, sortBy]);

  // Load Time Blocks for Selected Date
  const loadTimeBlocks = useCallback(async (date: string) => {
    try {
      const blocks = await dataService.tasks.getTimeBlocks(date);
      setTimeBlocks(blocks);
    } catch (err) {
      console.error('Failed to load time blocks:', err);
    }
  }, []);

  useEffect(() => {
    loadTasks(true);
    // Plan §6.1 scoped entity pub/sub: this page renders tasks and time
    // blocks only, so it subscribes to the 'tasks' channel.
    const unsubscribe = dataService.subscribe(() => {
      loadTasks(false);
      loadTimeBlocks(selectedDate);
    }, ['tasks']);
    return () => unsubscribe();
  }, [loadTasks, loadTimeBlocks, selectedDate]);

  useEffect(() => {
    loadTimeBlocks(selectedDate);
  }, [selectedDate, loadTimeBlocks]);

  useEffect(() => {
    const action = searchParams.get('action');
    if (action === 'new') {
      openCreateModal();
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        return next;
      }, { replace: true });
    } else if (action === 'replan') {
      setViewMode('schedule');
      const conflictId = searchParams.get('id');
      const targetTime = searchParams.get('time');
      if (conflictId && targetTime) {
        const [hStr, mStr] = targetTime.split(':');
        const targetHour = parseInt(hStr, 10);
        const targetMin = parseInt(mStr, 10) || 0;
        if (!isNaN(targetHour)) {
          dataService.tasks.getTimeBlocks(selectedDate).then((blocks) => {
            const targetBlock = blocks.find((b) => b.id === conflictId);
            if (targetBlock) {
              dataService.tasks.updateTimeBlock(conflictId, {
                startHour: targetHour,
                startMinute: targetMin,
                status: 'planned'
              }).then((updated) => {
                setTimeBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
                addToast({
                  title: 'Calendar Conflict Resolved',
                  description: `Rescheduled "${targetBlock.taskTitle}" to ${targetTime}.`,
                  type: 'success'
                });
              }).catch(() => {});
            }
          });
        }
      }
      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('action');
        next.delete('id');
        next.delete('time');
        return next;
      }, { replace: true });
    }
  }, [searchParams, openCreateModal, selectedDate, addToast, setSearchParams]);

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const undoShortcutLabel = isMac ? '⌘Z' : 'Ctrl+Z';

  const handleUndoDelete = useCallback(async () => {
    if (deletedTasksStack.length === 0) return;
    const toRestore = deletedTasksStack[0];
    setDeletedTasksStack((prev) => prev.slice(1));
    lastDeletedTaskRef.current = null;
    hapticsEngine.playMechanicalTick();
    try {
      const recreated = await dataService.tasks.createTask({
        title: toRestore.title,
        description: toRestore.description,
        category: toRestore.category,
        priority: toRestore.priority,
        subjectId: toRestore.subjectId,
        goalId: toRestore.goalId,
        dueDate: toRestore.dueDate,
        dueTime: toRestore.dueTime,
        estimatedMinutes: toRestore.estimatedMinutes,
        tags: toRestore.tags,
        subTasks: toRestore.subTasks,
        recurrence: toRestore.recurrence,
        isRecurring: toRestore.isRecurring,
        naturalLanguageInput: toRestore.naturalLanguageInput
      });
      setTasks((prev) => [recreated, ...prev]);
      addToast({ title: 'Task Restored', description: recreated.title, type: 'success' });
    } catch {
      addToast({ title: 'Could not restore task', type: 'error' });
    }
  }, [deletedTasksStack, addToast]);

  const handleUndoCompletion = useCallback(async (taskId?: string) => {
    const id = taskId || lastCompletedTaskIdRef.current?.id;
    if (!id) return;
    const target = tasks.find((t) => t.id === id);
    if (!target) return;
    hapticsEngine.playMechanicalTick();
    setTasks((prev) => prev.map((t) => (t.id === id ? { ...t, status: 'todo' } : t)));
    lastCompletedTaskIdRef.current = null;
    try {
      const reverted = await dataService.tasks.updateTask(id, { status: 'todo' });
      setTasks((prev) => prev.map((t) => (t.id === id ? reverted : t)));
      addToast({ title: 'Task Reopened', description: reverted.title, type: 'info' });
    } catch {
      loadTasks();
    }
  }, [tasks, loadTasks, addToast]);

  const handleFocusInlineCapture = useCallback(() => {
    if (smartInputRef.current) {
      smartInputRef.current.focus();
      smartInputRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Keyboard Shortcuts (N / C = Fast Capture, T = Today View, 1..5 = Mode Switching, Cmd+Z / Ctrl+Z = Undo)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      const isInput = active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable);

      if ((e.metaKey || e.ctrlKey) && (e.key === 'z' || e.key === 'Z') && !e.shiftKey) {
        if (!isInput) {
          const compTime = lastCompletedTaskIdRef.current ? lastCompletedTaskIdRef.current.timestamp : 0;
          const delTime = lastDeletedTaskRef.current ? lastDeletedTaskRef.current.timestamp : 0;

          if (compTime > 0 && Date.now() - compTime < 5000 && compTime >= delTime) {
            e.preventDefault();
            handleUndoCompletion();
            return;
          }
          if (delTime > 0 && Date.now() - delTime < 5000 && deletedTasksStack.length > 0) {
            e.preventDefault();
            handleUndoDelete();
            return;
          }
          if (deletedTasksStack.length > 0) {
            e.preventDefault();
            handleUndoDelete();
            return;
          }
        }
      }

      if (isInput) return;

      if (e.key === 'n' || e.key === 'N' || e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        handleFocusInlineCapture();
      } else if (e.key === 't' || e.key === 'T') {
        e.preventDefault();
        setViewMode('schedule');
        setSelectedDate(getISODateString(new Date()));
      } else if (e.key === '1') {
        setViewMode('list');
      } else if (e.key === '2') {
        setViewMode('schedule');
      } else if (e.key === '3') {
        setViewMode('matrix');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleFocusInlineCapture, deletedTasksStack, handleUndoDelete, handleUndoCompletion]);

  const handleSchedulerReviewNeeded = useCallback((block: TaskTimeBlock) => {
    setReviewingBlock(block);
    setIsReviewModalOpen(true);
  }, []);

  const handleSchedulerFallbackNotice = useCallback((message: string) => {
    addToast({
      title: 'Time Block Notice',
      description: message,
      type: 'info'
    });
  }, [addToast]);

  // Time Block Scheduler Hook (Triggers reminders and reflections)
  useTimeBlockScheduler({
    timeBlocks,
    onReviewNeeded: handleSchedulerReviewNeeded,
    onFallbackNotice: handleSchedulerFallbackNotice
  });

  const handleRetry = async () => {
    setIsRetrying(true);
    await Promise.all([loadTasks(tasks.length === 0), loadTimeBlocks(selectedDate)]);
    setIsRetrying(false);
  };

  const handleNavigateDate = (deltaDays: number) => {
    const current = new Date(selectedDate);
    current.setDate(current.getDate() + deltaDays);
    setSelectedDate(getISODateString(current));
  };

  const handleJumpToToday = () => {
    setSelectedDate(getISODateString(new Date()));
  };

  // Time Block Operations
  const handleOpenCreateBlock = (hour: number) => {
    setEditingBlock(null);
    setSelectedBlockHour(hour);
    setIsCreateBlockModalOpen(true);
  };

  const handleOpenEditBlock = (block: TaskTimeBlock) => {
    setEditingBlock(block);
    setSelectedBlockHour(block.startHour);
    setIsCreateBlockModalOpen(true);
  };

  const handleOpenReviewBlock = (block: TaskTimeBlock) => {
    setReviewingBlock(block);
    setIsReviewModalOpen(true);
  };

  const handleCreateOrUpdateBlock = async (blockData: Partial<TaskTimeBlock>) => {
    try {
      if (editingBlock) {
        const updated = await dataService.tasks.updateTimeBlock(editingBlock.id, blockData);
        setTimeBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        addToast({ title: 'Time Block Updated', description: updated.taskTitle, type: 'success' });
      } else {
        const created = await dataService.tasks.createTimeBlock(blockData);
        setTimeBlocks((prev) => [...prev, created]);
        addToast({ title: 'Time Block Committed', description: created.taskTitle, type: 'success' });
      }
      setIsCreateBlockModalOpen(false);
      setEditingBlock(null);
    } catch (err: any) {
      addToast({ title: 'Could not schedule block', description: err?.message, type: 'error' });
      throw err;
    }
  };

  const handleDeleteTimeBlock = async (blockId: string) => {
    const prev = timeBlocks;
    setTimeBlocks((current) => current.filter((b) => b.id !== blockId));
    try {
      await dataService.tasks.deleteTimeBlock(blockId);
      addToast({ title: 'Time Block Removed', type: 'info' });
    } catch {
      setTimeBlocks(prev);
      addToast({ title: 'Could not delete time block', type: 'error' });
    }
  };

  const handleToggleBlockComplete = async (block: TaskTimeBlock) => {
    const nextStatus = block.status === 'completed' ? 'planned' : 'completed';
    try {
      const updated = await dataService.tasks.updateTimeBlock(block.id, {
        status: nextStatus,
        progressPercent: nextStatus === 'completed' ? 100 : 0
      });
      setTimeBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      if (block.taskId) {
        const nextTaskStatus = nextStatus === 'completed' ? 'completed' : 'todo';
        await dataService.tasks.updateTask(block.taskId, { status: nextTaskStatus });
        setTasks((prev) => prev.map((t) => (t.id === block.taskId ? { ...t, status: nextTaskStatus } : t)));
      }
      addToast({
        title: nextStatus === 'completed' ? 'Block Completed' : 'Block Reopened',
        type: 'success'
      });
    } catch {
      addToast({ title: 'Could not toggle block status', type: 'error' });
    }
  };

  const handleReviewBlockSubmit = async (payload: TimeBlockReviewPayload) => {
    if (!reviewingBlock) return;
    try {
      const res = await dataService.tasks.reviewTimeBlock(reviewingBlock.id, payload);
      setTimeBlocks((prev) => {
        const updated = prev.map((b) => (b.id === res.updatedBlock.id ? res.updatedBlock : b));
        if (res.rescheduledBlock && res.rescheduledBlock.date === selectedDate) {
          return [...updated, res.rescheduledBlock];
        }
        return updated;
      });

      // Synchronize linked task in state
      if (reviewingBlock.taskId) {
        const nextTaskStatus = payload.status === 'completed' ? 'completed' : payload.status === 'partial' ? 'partial' : 'missed';
        setTasks((prev) => prev.map((t) => (t.id === reviewingBlock.taskId ? { ...t, status: nextTaskStatus } : t)));
      }

      addToast({
        title: 'Hour Reviewed',
        description: `Logged ${payload.actualMinutes}m (${payload.status})`,
        type: 'success'
      });
      setIsReviewModalOpen(false);
      setReviewingBlock(null);
    } catch (err: any) {
      addToast({ title: 'Could not save review', description: err?.message, type: 'error' });
      throw err;
    }
  };

  const handleScheduleTaskToHour = async (task: Task, hour: number) => {
    try {
      const created = await dataService.tasks.createTimeBlock({
        taskId: task.id,
        taskTitle: task.title,
        description: task.description,
        date: selectedDate,
        startHour: hour,
        startMinute: 0,
        durationMinutes: task.estimatedMinutes || 60,
        subjectId: task.subjectId,
        goalId: task.goalId,
        priority: task.priority
      });
      setTimeBlocks((prev) => [...prev, created]);
      addToast({
        title: 'Task Slotted into Grid',
        description: `"${task.title}" at ${hour % 12 === 0 ? 12 : hour % 12}:00 ${hour >= 12 ? 'PM' : 'AM'}`,
        type: 'success'
      });
    } catch (err: any) {
      addToast({ title: 'Could not slot task', description: err?.message, type: 'error' });
    }
  };

  // Plan §3.3: one-tap Zeigarnik deferral — "→ Tomorrow" moves an overdue task
  // to tomorrow, increments its deferral count, and offers an undo toast.
  const handleDeferTaskToTomorrow = useCallback(async (task: Task) => {
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
  }, [addToast]);

  // Plan §3.3: calm roll — move past incomplete blocks into today's schedule
  // (next free slot per block) with one click, replacing the guilt banner.
  const handleRollPastBlocksToToday = useCallback(async (blocks: TaskTimeBlock[]) => {
    if (blocks.length === 0) return;
    const todayKey = getISODateString(new Date());
    const nowH = new Date().getHours();
    let rolledCount = 0;
    // P3F1: the occupancy mirror must be TODAY'S full grid. The timeBlocks
    // state only holds the SELECTED date's blocks, so when the roll is used
    // from a past-day view, today's occupied hours are invisible and rolled
    // blocks would double-book them. Fetch today's blocks fresh instead.
    let placed: TaskTimeBlock[];
    try {
      placed = await dataService.tasks.getTimeBlocks(todayKey);
    } catch {
      placed = [...timeBlocks]; // offline fallback: best-effort from the viewed date
    }
    for (const block of blocks) {
      const slot = findNextAvailableSlot(todayKey, placed, nowH, block.durationMinutes, block.id);
      if (!slot) continue; // no free hour left today — the block stays where it is
      try {
        const updated = await dataService.tasks.updateTimeBlock(block.id, {
          date: todayKey,
          startHour: slot.hour,
          startMinute: slot.minute,
          status: 'planned'
        });
        placed = placed.map((b) => (b.id === updated.id ? updated : b));
        setTimeBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
        rolledCount++;
      } catch {
        // leave the block untouched on failure; the prompt stays available
      }
    }
    if (rolledCount > 0) {
      hapticsEngine.playMechanicalTick();
      addToast({
        title: 'Blocks Rolled to Today',
        description: `${rolledCount} unfinished block${rolledCount === 1 ? '' : 's'} placed back on your schedule.`,
        type: 'success'
      });
    } else {
      addToast({
        title: 'Schedule Already Full',
        description: 'No open hour left today — these blocks will wait calmly for tomorrow.',
        type: 'info'
      });
    }
  }, [timeBlocks, addToast]);

  const handleQuickReplanBlock = async (block: TaskTimeBlock, targetDate: string, targetHour: number) => {
    try {
      const updated = await dataService.tasks.updateTimeBlock(block.id, {
        date: targetDate,
        startHour: targetHour,
        status: 'planned'
      });
      setTimeBlocks((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
      addToast({
        title: 'Block Rescheduled',
        description: `"${block.taskTitle}" moved to ${targetDate} at ${targetHour % 12 === 0 ? 12 : targetHour % 12}:00 ${targetHour >= 12 ? 'PM' : 'AM'}`,
        type: 'success'
      });
    } catch (err: any) {
      addToast({ title: 'Could not reschedule block', description: err?.message, type: 'error' });
    }
  };

  const handleAutoReplanCandidates = async () => {
    const candidates = timeBlocks.filter(
      (b) => b.status === 'partial' || (b.status === 'planned' && b.date < selectedDate)
    );
    if (candidates.length === 0) {
      addToast({ title: 'No replan candidates', description: 'All time blocks are on track.', type: 'info' });
      return;
    }
    let rescheduledCount = 0;
    for (const block of candidates) {
      const suggestions = getReplanSuggestions(block, timeBlocks, new Date().getHours());
      const best = suggestions[0];
      if (best) {
        try {
          await handleQuickReplanBlock(block, best.date, best.startHour);
          rescheduledCount++;
        } catch {
          // continue
        }
      }
    }
    if (rescheduledCount > 0) {
      addToast({
        title: 'Auto-Replan Complete',
        description: `Rescheduled ${rescheduledCount} block(s) into open focus slots.`,
        type: 'success'
      });
    }
  };

  // Task CRUD Operations
  const handleToggleTask = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    hapticsEngine.playMechanicalTick();
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
      addToast({ title: 'Could not toggle task', type: 'error' });
    }
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormCategory(task.category);
    setFormPriority(task.priority);
    setFormSubjectId(task.subjectId || '');
    setFormGoalId(task.goalId || '');
    setFormDueDate(task.dueDate || selectedDate);
    setFormDueTime(task.dueTime || '18:00');
    setFormEstimatedMinutes(String(task.estimatedMinutes || 30));
    setFormTags(task.tags.join(', '));
    setFormError(null);
    setShowMoreOptions(Boolean(task.description || task.tags.length > 0 || task.subjectId || task.goalId));
    setIsCreateModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);
    const prevTasks = tasks;

    const tagList = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingTask) {
        const updated = await dataService.tasks.updateTask(editingTask.id, {
          title: formTitle,
          description: formDescription,
          category: formCategory,
          priority: formPriority,
          subjectId: formSubjectId || undefined,
          goalId: formGoalId || undefined,
          dueDate: formDueDate,
          dueTime: formDueTime,
          estimatedMinutes: parseInt(formEstimatedMinutes, 10) || 30,
          tags: tagList
        });
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setEditingTask(null);
        setIsCreateModalOpen(false);
        addToast({ title: 'Task Updated', description: updated.title, type: 'success' });
      } else {
        const created = await dataService.tasks.createTask({
          title: formTitle,
          description: formDescription,
          category: formCategory,
          priority: formPriority,
          subjectId: formSubjectId || undefined,
          goalId: formGoalId || undefined,
          dueDate: formDueDate,
          dueTime: formDueTime,
          estimatedMinutes: parseInt(formEstimatedMinutes, 10) || 30,
          tags: tagList,
          subTasks: []
        });
        setTasks((prev) => [created, ...prev]);
        setIsCreateModalOpen(false);
        addToast({ title: 'Task Created', description: created.title, type: 'success' });
      }
    } catch (err) {
      setTasks(prevTasks);
      if (err instanceof ValidationError) {
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = useCallback(async (taskId: string) => {
    const targetTask = tasks.find((t) => t.id === taskId);
    if (!targetTask) return;
    const prevTasks = tasks;
    hapticsEngine.playMechanicalTick();

    // Optimistic removal from state
    setTasks((prev) => prev.filter((t) => t.id !== taskId));
    setDeletedTasksStack((prev) => [targetTask, ...prev]);
    lastDeletedTaskRef.current = { task: targetTask, timestamp: Date.now() };

    addToast({
      title: 'Task Deleted',
      description: `"${targetTask.title}" — press ${undoShortcutLabel} to undo`,
      type: 'info',
      durationMs: 5000,
      action: {
        label: `Undo (${undoShortcutLabel})`,
        onClick: () => handleUndoDelete()
      }
    });

    try {
      await dataService.tasks.deleteTask(taskId);
    } catch {
      setTasks(prevTasks);
      setDeletedTasksStack((prev) => prev.filter((t) => t.id !== targetTask.id));
      lastDeletedTaskRef.current = null;
      addToast({ title: 'Could not delete task', type: 'error' });
    }
  }, [tasks, undoShortcutLabel, handleUndoDelete, addToast]);

  const handleAddSubtask = async (taskId: string, title: string) => {
    try {
      const subtask = await dataService.tasks.addSubTask(taskId, title);
      setTasks((prev) =>
        prev.map((t) => (t.id === taskId ? { ...t, subTasks: [...t.subTasks, subtask] } : t))
      );
    } catch (err) {
      addToast({
        title: 'Error adding subtask',
        description: err instanceof Error ? err.message : 'Invalid subtask',
        type: 'error'
      });
    }
  };

  const handleToggleSubtask = async (taskId: string, subId: string) => {
    try {
      const updated = await dataService.tasks.toggleSubTask(taskId, subId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch {
      addToast({ title: 'Error toggling subtask', type: 'error' });
    }
  };

  const handleDeleteSubtask = async (taskId: string, subId: string) => {
    try {
      const updated = await dataService.tasks.deleteSubTask(taskId, subId);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
    } catch {
      addToast({ title: 'Error deleting subtask', type: 'error' });
    }
  };

  const timeFilters: { id: TaskTimeFilter; label: string }[] = [
    { id: 'all', label: 'All Tasks' },
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'unscheduled', label: 'Unscheduled' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'completed', label: 'Completed' }
  ];

  const categories = [
    { id: 'all', label: 'All Domains' },
    { id: 'deep_work', label: 'Deep Work' },
    { id: 'study', label: 'Study' },
    { id: 'project', label: 'Projects' },
    { id: 'review', label: 'Review' }
  ];

  const viewModeOptions: { value: string; label: string }[] = [
    { value: 'list', label: 'List' },
    { value: 'schedule', label: 'Schedule (24h)' },
    { value: 'matrix', label: 'Priority Matrix' }
  ];

  const handleCreateFromNLP = useCallback(async (taskPayload: Partial<Task>) => {
    try {
      const created = await dataService.tasks.createTask({
        title: taskPayload.title || 'Untitled Deliberate Task',
        description: taskPayload.description,
        category: taskPayload.category || 'study',
        priority: taskPayload.priority || 'medium',
        subjectId: taskPayload.subjectId,
        goalId: taskPayload.goalId,
        dueDate: taskPayload.dueDate || (viewMode === 'schedule' || viewMode === 'today' ? selectedDate : selectedTimeFilter === 'today' ? selectedDate : undefined),
        dueTime: taskPayload.dueTime,
        estimatedMinutes: taskPayload.estimatedMinutes || 30,
        tags: taskPayload.tags || [],
        subTasks: [],
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
  }, [selectedDate, viewMode, selectedTimeFilter, addToast]);

  return (
    <div>
      <SectionHeader
        title="Tasks & Daily Schedule"
        subtitle={`${activeTasksCount} active tasks · ${scheduledHours}h planned · Workload: ${workloadLabel}`}
        guideId="task-sanctuary"
        onOpenGuide={openGuide}
        actions={
          <div style={{ display: 'flex', gap: '8px' }}>
            <Button
              variant="subtle"
              size="md"
              leftIcon={<Clock size={16} />}
              onClick={() => handleOpenCreateBlock(new Date().getHours())}
            >
              Plan Block
            </Button>
            <Button
              variant="accent"
              size="md"
              leftIcon={<Plus size={16} />}
              onClick={handleFocusInlineCapture}
            >
              New Task
            </Button>
          </div>
        }
      />

      {/* View Mode & Date Navigation Bar */}
      <div className="solis-tasks-view-modes-nav">
        <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
          <SegmentedControl
            variant="contained"
            size="md"
            value={viewMode}
            onChange={(val) => setViewMode(val as TaskViewMode)}
            options={viewModeOptions}
          />
        </div>

        {(viewMode === 'schedule' || viewMode === 'today' || viewMode === 'timeline' || viewMode === 'review') && (
          <div className="solis-tasks-date-controls">
            <Button
              variant="subtle"
              size="sm"
              onClick={() => handleNavigateDate(-1)}
              aria-label="Previous day"
              leftIcon={<ChevronLeft size={14} />}
            >
              Prev
            </Button>
            <span className="solis-tasks-date-display">
              {formatFriendlyDate(selectedDate)}
            </span>
            <Button
              variant="subtle"
              size="sm"
              onClick={() => handleNavigateDate(1)}
              aria-label="Next day"
              rightIcon={<ChevronRight size={14} />}
            >
              Next
            </Button>
            {selectedDate !== getISODateString(new Date()) && (
              <Button variant="outline" size="sm" onClick={handleJumpToToday}>
                Today
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Inline Fast Smart Capture for matrix view (list has it inline above filters, schedule has it in its left panel) */}
      {viewMode === 'matrix' && (
        <div className="solis-tasks-inline-capture" style={{ marginBottom: '16px' }}>
          <SmartTaskInput
            inputRef={smartInputRef}
            onCommit={handleCreateFromNLP}
            subjects={activeSubjects}
            defaultDueDate={undefined}
            placeholder='Quick capture or natural language... e.g. "Draft research abstract !urgent"'
          />
        </div>
      )}

      {/* Sync Error Banner */}
      {syncStatus === 'error' && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-md)',
            fontSize: 'var(--text-caption)',
            color: 'var(--text-primary)',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <AlertCircle size={14} color="var(--color-amber-500)" />
            <span>Couldn't sync latest tasks with server. Displaying offline state.</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry} isLoading={isRetrying}>
            Retry Sync
          </Button>
        </div>
      )}

      {initialLoadStatus === 'loading' && tasks.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton height="76px" />
          <Skeleton height="76px" />
          <Skeleton height="76px" />
        </div>
      ) : initialLoadStatus === 'error' && tasks.length === 0 ? (
        <Card variant="primary" style={{ textAlign: 'center', padding: '36px 16px' }}>
          <AlertCircle size={28} color="var(--status-error)" style={{ margin: '0 auto 8px' }} />
          <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>
            We couldn't load your tasks.
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '14px' }}>
            A network or server connectivity error occurred.
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry} isLoading={isRetrying}>
            Retry
          </Button>
        </Card>
      ) : (
        <>
          {/* VIEW MODE 1: LIST VIEW (CANONICAL LIST WITH FILTERS & SEARCH) */}
          {(viewMode === 'list' || viewMode === 'inbox') && (
            <div>
              <div style={{ marginBottom: '16px' }}>
                <SmartTaskInput
                  inputRef={smartInputRef}
                  onCommit={handleCreateFromNLP}
                  subjects={activeSubjects}
                  defaultDueDate={selectedTimeFilter === 'today' ? selectedDate : undefined}
                  placeholder='Capture deliberate intention... (e.g. "Read OS chapter 4 tomorrow at 3pm for 45m !high")'
                />
              </div>

              {/* Filter Toolbar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: 'var(--space-xl)' }}>
                <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
                  <SegmentedControl
                    variant="contained"
                    size="sm"
                    value={selectedTimeFilter}
                    onChange={(val) => setSelectedTimeFilter(val as TaskTimeFilter)}
                    options={timeFilters.map((tf) => ({ value: tf.id, label: tf.label }))}
                  />
                </div>

                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: '12px',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}
                >
                  <div style={{ overflowX: 'auto' }}>
                    <SegmentedControl
                      variant="pills"
                      size="sm"
                      value={selectedCategory}
                      onChange={setSelectedCategory}
                      options={categories.map((c) => ({ value: c.id, label: c.label }))}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flex: 1, minWidth: '240px', maxWidth: '520px', flexWrap: 'wrap' }}>
                    <div style={{ flex: '1 1 180px', minWidth: '150px' }}>
                      <Input
                        placeholder="Search statements, tags, or notes..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        leftIcon={<Search size={14} />}
                      />
                    </div>
                    <div style={{ flex: '0 0 auto', minWidth: '130px' }}>
                      <CustomSelect
                        variant="subtle"
                        value={sortBy}
                        onChange={(val) => setSortBy(val as TaskSortField)}
                        options={[
                          { value: 'priority', label: 'Priority' },
                          { value: 'dueDate', label: 'Due Date' },
                          { value: 'createdAt', label: 'Created' },
                          { value: 'title', label: 'Title' }
                        ]}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <TaskInboxView
                tasks={filteredTasks}
                subjects={subjects}
                goals={goals}
                onToggleTask={handleToggleTask}
                onEditTask={openEditModal}
                onDeleteTask={handleDeleteTask}
                onScheduleToHour={handleScheduleTaskToHour}
                onDeferTaskToTomorrow={handleDeferTaskToTomorrow}
                onAddSubtask={handleAddSubtask}
                onToggleSubtask={handleToggleSubtask}
                onDeleteSubtask={handleDeleteSubtask}
                title="Task List"
                subtitle="All tasks across your study horizon. Filter by timeframe, domain, or search."
                emptyMessage={
                  selectedTimeFilter === 'overdue'
                    ? "No overdue tasks — you're caught up!"
                    : selectedTimeFilter === 'unscheduled'
                    ? "No unscheduled tasks — all active items are slotted."
                    : selectedTimeFilter === 'today'
                    ? "No tasks due today. Add one above or schedule from your backlog."
                    : "No tasks found matching your filters."
                }
              />
            </div>
          )}

          {/* VIEW MODE 2: SCHEDULE (24H INTERACTIVE PLANNER + UNSCHEDULED TASKS SIDEBAR + INTEGRATED REVIEW) */}
          {(viewMode === 'schedule' || viewMode === 'today' || viewMode === 'timeline' || viewMode === 'review') && (
            <div className="solis-tasks-today-hybrid">
              <div className="solis-tasks-today-panel">
                <SmartTaskInput
                  inputRef={smartInputRef}
                  onCommit={handleCreateFromNLP}
                  subjects={activeSubjects}
                  defaultDueDate={selectedDate}
                  placeholder='Add deliberate task for schedule... (e.g. "Review Chapter 4 at 3pm for 45m !high")'
                />

                <div className="solis-tasks-today-list-header">
                  <span className="solis-tasks-today-list-title">Ready to Schedule</span>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span className="solis-tasks-today-list-counter">
                      {todayTasks.filter((t) => t.status === 'completed').length}/{todayTasks.length} done
                    </span>
                    <button
                      type="button"
                      className="solis-tasks-inline-add-btn tactile-press"
                      onClick={handleFocusInlineCapture}
                      title="Add task (Press N or C)"
                      aria-label="Add deliberate task"
                    >
                      <Plus size={12} />
                      <span>Add task</span>
                    </button>
                  </div>
                </div>

                <div className="solis-tasks-today-list">
                  {todayTasks.length === 0 ? (
                    <div className="solis-tasks-today-empty">
                      <p>No tasks scheduled for {formatFriendlyDate(selectedDate)}.</p>
                      <span>Capture a deliberate task above or slot from your inbox backlog.</span>
                    </div>
                  ) : (
                    todayTasks.map((task) => {
                      const linkedSub = subjects.find((s) => s.id === task.subjectId);
                      return (
                        <TaskRow
                          key={task.id}
                          task={task}
                          subject={linkedSub}
                          onToggle={handleToggleTask}
                          onEdit={openEditModal}
                          onDelete={handleDeleteTask}
                          onStartFocus={(t) =>
                            navigate(`/app/focus?taskId=${t.id}${t.subjectId ? `&subjectId=${t.subjectId}` : ''}`, {
                              state: {
                                taskId: t.id,
                                title: t.title,
                                subjectId: t.subjectId,
                                durationMinutes: t.estimatedMinutes || 30
                              }
                            })
                          }
                          onSlotToHour={handleScheduleTaskToHour}
                          onDeferToTomorrow={handleDeferTaskToTomorrow}
                          showScheduleAction={true}
                        />
                      );
                    })
                  )}
                </div>
              </div>

              <div className="solis-tasks-today-grid-panel">
                <HourlyPlannerView
                  selectedDate={selectedDate}
                  timeBlocks={timeBlocks}
                  tasks={tasks}
                  subjects={subjects}
                  goals={goals}
                  onOpenCreateBlock={handleOpenCreateBlock}
                  onOpenEditBlock={handleOpenEditBlock}
                  onOpenReviewBlock={handleOpenReviewBlock}
                  onDeleteBlock={handleDeleteTimeBlock}
                  onToggleBlockComplete={handleToggleBlockComplete}
                  onScheduleTaskToHour={handleScheduleTaskToHour}
                  onAutoReplanCandidates={handleAutoReplanCandidates}
                  onQuickReplanBlock={handleQuickReplanBlock}
                  onRollPastBlocksToToday={handleRollPastBlocksToToday}
                />
              </div>
            </div>
          )}

          {/* VIEW MODE 3: PRIORITY MATRIX (EISENHOWER) */}
          {viewMode === 'matrix' && (
            <TaskPriorityMatrix
              tasks={tasks}
              subjects={subjects}
              onScheduleToHour={handleScheduleTaskToHour}
              onToggleTask={handleToggleTask}
            />
          )}
        </>
      )}

      {/* Modal 1: Create / Edit Time Block Modal */}
      <CreateTimeBlockModal
        isOpen={isCreateBlockModalOpen}
        onClose={() => {
          setIsCreateBlockModalOpen(false);
          setEditingBlock(null);
        }}
        onSubmit={handleCreateOrUpdateBlock}
        defaultHour={selectedBlockHour}
        defaultDate={selectedDate}
        tasks={tasks}
        subjects={subjects}
        goals={goals}
        editingBlock={editingBlock}
      />

      {/* Modal 2: Frictionless Hour Review & Transition Modal */}
      <HourReviewModal
        isOpen={isReviewModalOpen}
        block={reviewingBlock}
        existingBlocks={timeBlocks}
        onClose={() => {
          setIsReviewModalOpen(false);
          setReviewingBlock(null);
        }}
        onSubmit={handleReviewBlockSubmit}
      />

      {/* Modal 3: Create / Edit Intentional Task Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Create Task'}
      >
        <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {formError && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: 'var(--status-error-bg)',
                border: '1px solid var(--status-error)',
                borderRadius: 'var(--radius-sm)',
                color: 'var(--status-error)',
                fontSize: 'var(--text-caption)'
              }}
            >
              {formError}
            </div>
          )}

          <Input
            label="Task Statement *"
            placeholder="What exact intention will you bring into focus?"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            required
            autoFocus
          />

          <div className="solis-tasks-form-grid">
            <CustomSelect
              label="Domain Category"
              value={formCategory}
              onChange={(val) => setFormCategory(val as TaskCategory)}
              options={[
                { value: 'study', label: 'Study' },
                { value: 'deep_work', label: 'Deep Work' },
                { value: 'project', label: 'Project' },
                { value: 'review', label: 'Review' },
                { value: 'admin', label: 'Admin' }
              ]}
            />

            <CustomSelect
              label="Priority"
              value={formPriority}
              onChange={(val) => setFormPriority(val as PriorityLevel)}
              options={[
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
            />

            <CustomSelect
              label="Linked Subject"
              value={formSubjectId}
              onChange={(val) => setFormSubjectId(val)}
              options={[
                { value: '', label: 'No Subject Link' },
                ...activeSubjects.map((s: StudySubject) => ({ value: s.id, label: s.name, badge: s.code }))
              ]}
            />

            <CustomSelect
              label="Linked Goal"
              value={formGoalId}
              onChange={(val) => setFormGoalId(val)}
              options={[
                { value: '', label: 'No Goal Link' },
                ...goals.filter((g) => g.status === 'active').map((g: Goal) => ({ value: g.id, label: g.title }))
              ]}
            />
          </div>

          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '2px' }}>
            <button
              type="button"
              onClick={() => setShowMoreOptions((prev) => !prev)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-coral-500)',
                fontSize: 'var(--text-body-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {showMoreOptions ? '− Hide Additional Schedule & Context' : '+ Additional Context (Due Date, Presets, Tags, Notes)'}
            </button>

            {showMoreOptions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                <Textarea
                  label="Description / Context (Optional)"
                  placeholder="Key notes, references, requirements..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />

                <div className="solis-tasks-form-grid">
                  <DatePicker
                    label="Due Date"
                    value={formDueDate}
                    onChange={setFormDueDate}
                  />
                  <TimePicker
                    label="Due Time"
                    value={formDueTime}
                    onChange={setFormDueTime}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Estimated Duration
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {[15, 30, 45, 60].map((mins) => (
                      <Button
                        key={mins}
                        type="button"
                        variant={formEstimatedMinutes === String(mins) ? 'accent' : 'subtle'}
                        size="sm"
                        onClick={() => setFormEstimatedMinutes(String(mins))}
                      >
                        {mins}m
                      </Button>
                    ))}
                    <div style={{ width: '100px' }}>
                      <Input
                        type="number"
                        placeholder="Custom"
                        value={formEstimatedMinutes}
                        onChange={(e) => setFormEstimatedMinutes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Input
                  label="Tags (Comma separated)"
                  placeholder="Architecture, Raft, Core"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingTask(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="accent" type="submit" isLoading={isSubmitting} leftIcon={<Sparkles size={14} />}>
              {editingTask ? 'Update Task' : 'Save Task'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
