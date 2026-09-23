import React, { useEffect, useRef, useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Flame,
  Edit2,
  Trash2,
  Calendar
} from 'lucide-react';
import { Task, TaskTimeBlock } from '../../types/task';
import { ExternalCalendarEvent } from '../../types/calendar';
import { calendarService } from '../../services/calendar/calendar.service';
import { StudySubject } from '../../types/study';
import { Goal } from '../../types/goal';
import { Badge, BadgeVariant } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Progress } from '../../components/ui/Progress/Progress';
import { getISODateString } from '../../utils/date';
import { hapticsEngine } from '../../utils/focus/hapticsEngine';
import { calculateWorkload } from '../../utils/tasks/workloadCalculator';
import { WorkloadCapacityBar } from './components/WorkloadCapacityBar';
import { getReplanSuggestions } from '../../utils/tasks/replanEngine';

interface HourlyPlannerViewProps {
  selectedDate: string;
  timeBlocks: TaskTimeBlock[];
  tasks: Task[];
  subjects: StudySubject[];
  goals: Goal[];
  onOpenCreateBlock: (hour: number) => void;
  onOpenEditBlock: (block: TaskTimeBlock) => void;
  onOpenReviewBlock: (block: TaskTimeBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onToggleBlockComplete: (block: TaskTimeBlock) => void;
  onScheduleTaskToHour?: (task: Task, hour: number) => Promise<void>;
  onAutoReplanCandidates?: () => void;
  onQuickReplanBlock?: (block: TaskTimeBlock, targetDate: string, targetHour: number) => Promise<void>;
}

export const HourlyPlannerView: React.FC<HourlyPlannerViewProps> = ({
  selectedDate,
  timeBlocks,
  tasks,
  subjects,
  goals,
  onOpenCreateBlock,
  onOpenEditBlock,
  onOpenReviewBlock,
  onDeleteBlock,
  onToggleBlockComplete,
  onScheduleTaskToHour,
  onAutoReplanCandidates,
  onQuickReplanBlock
}) => {
  const navigate = useNavigate();
  const currentHourRef = useRef<HTMLDivElement>(null);
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours());
  const [currentMinute, setCurrentMinute] = useState<number>(new Date().getMinutes());
  const [viewMode, setViewMode] = useState<'workday' | '24h'>('workday');
  const [isUnscheduledShelfOpen, setIsUnscheduledShelfOpen] = useState(false);

  const handleToggleBlock = (block: TaskTimeBlock) => {
    hapticsEngine.playMechanicalTick();
    onToggleBlockComplete(block);
  };

  // Keep clock updated
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentHour(now.getHours());
      setCurrentMinute(now.getMinutes());
    };
    const interval = setInterval(updateTime, 10000);
    return () => clearInterval(interval);
  }, []);

  // Check if viewing today using local calendar date
  const todayStr = getISODateString(new Date());
  const isToday = !selectedDate || selectedDate === todayStr;
  const isPastDate = selectedDate < todayStr;

  // Workload Realism Calculation
  const workload = useMemo(() => {
    return calculateWorkload({
      date: selectedDate,
      tasks,
      timeBlocks
    });
  }, [selectedDate, tasks, timeBlocks]);

  // Unscheduled tasks for this date
  const scheduledTaskIds = useMemo(() => {
    return new Set(timeBlocks.map((b) => b.taskId).filter(Boolean) as string[]);
  }, [timeBlocks]);

  const unscheduledTasks = useMemo(() => {
    return tasks.filter((t) => {
      if (t.status === 'completed' || t.status === 'archived') return false;
      return t.dueDate === selectedDate && !scheduledTaskIds.has(t.id);
    });
  }, [tasks, selectedDate, scheduledTaskIds]);

  // Auto-scroll to active hour once on mount if viewing today
  useEffect(() => {
    if (!isToday) return;
    const timer = setTimeout(() => {
      if (currentHourRef.current) {
        currentHourRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [isToday]);

  const [externalEvents, setExternalEvents] = useState<ExternalCalendarEvent[]>(() => calendarService.getEvents());

  useEffect(() => {
    const unsub = calendarService.subscribe(() => {
      setExternalEvents(calendarService.getEvents());
    });
    return () => unsub();
  }, []);

  const externalEventsByHour = useMemo(() => {
    const map = new Map<number, ExternalCalendarEvent[]>();
    externalEvents.forEach((ev) => {
      if (!ev.isBusy) return;
      const startIso = ev.startTime.slice(0, 10);
      const endIso = ev.endTime.slice(0, 10);
      if (startIso !== selectedDate && endIso !== selectedDate) return;

      const startDate = new Date(ev.startTime);
      const h = startDate.getHours();
      const existing = map.get(h) || [];
      existing.push(ev);
      map.set(h, existing);
    });
    return map;
  }, [externalEvents, selectedDate]);

  // Group time blocks by start hour
  const blocksByHour = new Map<number, TaskTimeBlock[]>();
  timeBlocks.forEach((block) => {
    const hour = block.startHour;
    const existing = blocksByHour.get(hour) || [];
    existing.push(block);
    blocksByHour.set(hour, existing);
  });

  // Calculate day summary metrics
  const totalPlannedBlocks = timeBlocks.length;
  const completedBlocks = timeBlocks.filter((b) => b.status === 'completed').length;
  const partialBlocks = timeBlocks.filter((b) => b.status === 'partial').length;
  const missedBlocks = timeBlocks.filter((b) => b.status === 'missed').length;
  const currentTotalMins = currentHour * 60 + currentMinute;
  const pendingReviewBlocks = timeBlocks.filter((b) => {
    const blockEndMins = b.startHour * 60 + (b.startMinute || 0) + (b.durationMinutes || 60);
    const isPastBlock = isPastDate || (isToday && blockEndMins <= currentTotalMins);
    return isPastBlock && (b.status === 'planned' || b.status === 'active');
  }).length;

  const totalPlannedMinutes = timeBlocks.reduce((acc, b) => acc + (b.durationMinutes || 60), 0);
  const actualMinutesLogged = timeBlocks.reduce((acc, b) => acc + (b.actualMinutes || 0), 0);

  const formatHourLabel = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 === 0 ? 12 : hour % 12;
    return `${displayHour}:00 ${ampm}`;
  };

  const scrollToNow = () => {
    if (currentHourRef.current) {
      currentHourRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  };

  return (
    <div className="solis-hourly-planner">
      {/* 1. Workload Realism & Capacity Bar */}
      <div style={{ marginBottom: '14px' }}>
        <WorkloadCapacityBar
          workload={workload}
          onAutoReplanCandidates={onAutoReplanCandidates}
        />
      </div>

      {/* 2. Unscheduled Tasks Shelf (if any tasks due today are not in a time block) */}
      {unscheduledTasks.length > 0 && onScheduleTaskToHour && (
        <div className="solis-unscheduled-shelf">
          <div className="solis-unscheduled-shelf-header">
            <span className="solis-unscheduled-shelf-title">
              Unscheduled Today ({unscheduledTasks.length}):
            </span>
            <button
              type="button"
              className="solis-unscheduled-toggle-btn"
              onClick={() => setIsUnscheduledShelfOpen((prev) => !prev)}
            >
              {isUnscheduledShelfOpen ? 'Collapse' : 'Show tasks to slot'}
            </button>
          </div>

          {isUnscheduledShelfOpen && (
            <div className="solis-unscheduled-tasks-list">
              {unscheduledTasks.map((t) => (
                <div key={t.id} className="solis-unscheduled-task-chip">
                  <span className="solis-unscheduled-task-name">{t.title}</span>
                  <div style={{ display: 'flex', gap: '4px' }}>
                    <button
                      type="button"
                      className="solis-slot-chip-btn"
                      onClick={() => onScheduleTaskToHour(t, currentHour)}
                      title={`Slot to Current Hour (${formatHourLabel(currentHour)})`}
                    >
                      Slot Now
                    </button>
                    <button
                      type="button"
                      className="solis-slot-chip-btn"
                      onClick={() => onScheduleTaskToHour(t, (currentHour + 1) % 24)}
                      title="Slot to Next Hour"
                    >
                      +1h
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Horizon Day Summary Strip */}
      <div className="solis-hourly-summary-bar">
        <div className="solis-hourly-summary-stats">
          <div className="solis-hourly-stat-item">
            <span className="solis-hourly-stat-val">{totalPlannedBlocks}</span>
            <span className="solis-hourly-stat-lbl">Planned Blocks</span>
          </div>
          <div className="solis-hourly-stat-item">
            <span className="solis-hourly-stat-val" style={{ color: 'var(--color-emerald-500, #10b981)' }}>
              {completedBlocks}
            </span>
            <span className="solis-hourly-stat-lbl">Completed</span>
          </div>
          {partialBlocks > 0 && (
            <div className="solis-hourly-stat-item">
              <span className="solis-hourly-stat-val" style={{ color: 'var(--color-amber-500, #f59e0b)' }}>
                {partialBlocks}
              </span>
              <span className="solis-hourly-stat-lbl">Partial</span>
            </div>
          )}
          {pendingReviewBlocks > 0 && (
            <div className="solis-hourly-stat-item">
              <span className="solis-hourly-stat-val" style={{ color: 'var(--color-rose-500, #e11d48)' }}>
                {pendingReviewBlocks}
              </span>
              <span className="solis-hourly-stat-lbl">Needs Review</span>
            </div>
          )}
          {missedBlocks > 0 && (
            <div className="solis-hourly-stat-item">
              <span className="solis-hourly-stat-val" style={{ color: 'var(--text-muted)' }}>
                {missedBlocks}
              </span>
              <span className="solis-hourly-stat-lbl">Missed</span>
            </div>
          )}
          <div className="solis-hourly-stat-item">
            <span className="solis-hourly-stat-val">
              {Math.round(totalPlannedMinutes / 60 * 10) / 10}h
            </span>
            <span className="solis-hourly-stat-lbl">Planned Focus</span>
          </div>
          <div className="solis-hourly-stat-item">
            <span className="solis-hourly-stat-val" style={{ color: 'var(--color-coral-500)' }}>
              {Math.round(actualMinutesLogged / 60 * 10) / 10}h
            </span>
            <span className="solis-hourly-stat-lbl">Actual Logged</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <Button
            variant={viewMode === 'workday' ? 'primary' : 'subtle'}
            size="sm"
            onClick={() => setViewMode((prev) => (prev === 'workday' ? '24h' : 'workday'))}
          >
            {viewMode === 'workday' ? 'Workday (8 AM – 8 PM)' : 'All 24 Hours'}
          </Button>
          {isToday && (
            <Button variant="subtle" size="sm" onClick={scrollToNow} leftIcon={<Clock size={13} />}>
              Jump to Now ({formatHourLabel(currentHour)})
            </Button>
          )}
          <Button
            variant="accent"
            size="sm"
            onClick={() => onOpenCreateBlock(currentHour)}
            leftIcon={<Plus size={14} />}
          >
            Plan Block
          </Button>
        </div>
      </div>

      {/* Hourly Grid Container */}
      <div className="solis-hourly-grid">
        {Array.from({ length: 24 }, (_, hour) => hour)
          .filter((hour) => {
            if (viewMode === '24h') return true;
            const hasBlocks = (blocksByHour.get(hour) || []).length > 0;
            const isCurrent = isToday && hour === currentHour;
            return (hour >= 8 && hour <= 20) || hasBlocks || isCurrent;
          })
          .map((hour) => {
          const isNow = isToday && hour === currentHour;
          const isPastHour = isPastDate || (isToday && hour < currentHour);
          const isUpcoming = !isPastDate && !isToday ? true : (isToday && hour > currentHour);
          const isPeakCircadian = hour >= 9 && hour <= 12;
          const blocks = blocksByHour.get(hour) || [];
          const hasBlocks = blocks.length > 0;
          const isCompact = viewMode === '24h' && (hour < 8 || hour > 20) && !hasBlocks && !isNow;

          return (
            <div
              key={hour}
              ref={isNow ? currentHourRef : undefined}
              className={`solis-hour-row ${isNow ? 'solis-hour-row--now' : ''} ${isPeakCircadian ? 'solis-hour-row--peak' : ''} ${isPastHour ? 'solis-hour-row--past' : ''} ${isUpcoming ? 'solis-hour-row--upcoming' : ''} ${isCompact ? 'solis-hour-row--compact' : ''}`}
            >
              {/* Living Time Needle for Current Hour */}
              {isNow && (
                <div
                  className="solis-living-needle"
                  style={{
                    top: `${Math.min(100, Math.max(0, (currentMinute / 60) * 100))}%`
                  }}
                  title={`Living Time Needle: ${formatHourLabel(currentHour)} (${currentMinute}m)`}
                />
              )}

              {/* Hour Timestamp Axis */}
              <div className="solis-hour-axis">
                <span className="solis-hour-label">{formatHourLabel(hour)}</span>
                {isPeakCircadian && (
                  <span className="solis-hour-peak-badge">Peak Focus</span>
                )}
                {isNow && (
                  <span className="solis-hour-now-badge">
                    <span className="solis-hour-now-dot" />
                    NOW ({String(currentMinute).padStart(2, '0')}m)
                  </span>
                )}
              </div>

              {/* Hour Slot Content */}
              <div className="solis-hour-content">
                {/* External Calendar Events for this hour */}
                {externalEventsByHour.get(hour)?.map((ev) => (
                  <div key={ev.id} className="solis-calendar-event-row">
                    <Calendar size={13} className="solis-calendar-event-icon" />
                    <span className="solis-calendar-event-title">{ev.title}</span>
                    <span className="solis-calendar-event-time">
                      {ev.startTime.slice(11, 16)}–{ev.endTime.slice(11, 16)}
                    </span>
                    <span className="solis-calendar-event-badge">
                      {ev.calendarName}
                    </span>
                  </div>
                ))}

                {hasBlocks ? (
                  <div className="solis-hour-blocks-list">
                    {blocks.map((block) => {
                      const linkedSub = subjects.find((s) => s.id === block.subjectId);
                      const linkedGoal = goals.find((g) => g.id === block.goalId);
                      const linkedTask = tasks.find((t) => t.id === block.taskId);
                      const isComplete = block.status === 'completed';
                      const isPartial = block.status === 'partial';
                      const isMissed = block.status === 'missed';
                      const blockEndMins = block.startHour * 60 + (block.startMinute || 0) + (block.durationMinutes || 60);
                      const isBlockEnded = isPastDate || (isToday && blockEndMins <= currentTotalMins);
                      const isNeedsReview = isBlockEnded && (block.status === 'planned' || block.status === 'active');

                      return (
                        <div
                          key={block.id}
                          className={`solis-time-block-card solis-time-block-card--${block.status} ${isNow ? 'solis-time-block-card--active' : ''}`}
                        >
                          <div className="solis-time-block-main">
                            <div className="solis-time-block-header">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                <button
                                  type="button"
                                  className="solis-time-block-check-btn"
                                  onClick={() => handleToggleBlock(block)}
                                  aria-label={`Toggle complete ${block.taskTitle}`}
                                >
                                  {isComplete ? (
                                    <CheckCircle2 size={18} color="var(--color-emerald-500, #10b981)" />
                                  ) : isPartial ? (
                                    <AlertTriangle size={18} color="var(--color-amber-500, #f59e0b)" />
                                  ) : isMissed ? (
                                    <RotateCcw size={18} color="var(--color-rose-500, #e11d48)" />
                                  ) : (
                                    <div className="solis-time-block-empty-check" />
                                  )}
                                </button>

                                <h4 className={`solis-time-block-title ${isComplete ? 'solis-time-block-title--done' : ''}`}>
                                  {block.taskTitle}
                                </h4>

                                <Badge variant={block.priority === 'urgent' || block.priority === 'high' ? 'coral' : 'neutral'}>
                                  {block.priority}
                                </Badge>

                                {linkedSub && (
                                  <Badge variant={(linkedSub.color as BadgeVariant) || 'coral'}>
                                    {linkedSub.name}
                                  </Badge>
                                )}

                                {linkedGoal && (
                                  <Badge variant="lavender">
                                    🎯 {linkedGoal.title}
                                  </Badge>
                                )}

                                {linkedTask && linkedTask.category && (
                                  <Badge variant="neutral">
                                    {linkedTask.category}
                                  </Badge>
                                )}

                                {isNeedsReview && (
                                  <span
                                    className="solis-time-block-review-tag"
                                    onClick={() => onOpenReviewBlock(block)}
                                    title="Hour block has passed. Click to record what you completed."
                                  >
                                    <AlertTriangle size={11} />
                                    Review Needed
                                  </span>
                                )}
                              </div>

                              <div className="solis-time-block-actions">
                                {!isComplete && (
                                  <Button
                                    variant="subtle"
                                    size="sm"
                                    className="tactile-press"
                                    leftIcon={<Flame size={12} color="var(--color-coral-500)" />}
                                    onClick={() =>
                                      navigate(
                                        block.taskId
                                          ? `/app/focus?taskId=${block.taskId}&blockId=${block.id}`
                                          : `/app/focus?blockId=${block.id}`,
                                        {
                                          state: {
                                            title: block.taskTitle,
                                            taskId: block.taskId,
                                            blockId: block.id,
                                            subjectId: block.subjectId,
                                            durationMinutes: block.durationMinutes || 45
                                          }
                                        }
                                      )
                                    }
                                  >
                                    Focus
                                  </Button>
                                )}

                                <Button
                                  variant="subtle"
                                  size="sm"
                                  onClick={() => onOpenReviewBlock(block)}
                                  title="Record reflection and progress"
                                >
                                  Review
                                </Button>

                                {onQuickReplanBlock && (isNeedsReview || isMissed) && (
                                  <Button
                                    variant="subtle"
                                    size="sm"
                                    className="tactile-press"
                                    leftIcon={<RotateCcw size={12} color="var(--color-coral-500)" />}
                                    onClick={() => {
                                      const suggestions = getReplanSuggestions(block, timeBlocks, currentHour);
                                      if (suggestions.length > 0) {
                                        onQuickReplanBlock(block, suggestions[0].date, suggestions[0].startHour);
                                      }
                                    }}
                                    title="Auto-replan to next available free slot"
                                  >
                                    Replan
                                  </Button>
                                )}

                                <button
                                  type="button"
                                  className="solis-time-block-icon-btn"
                                  onClick={() => onOpenEditBlock(block)}
                                  aria-label="Edit time block"
                                >
                                  <Edit2 size={13} />
                                </button>

                                <button
                                  type="button"
                                  className="solis-time-block-icon-btn"
                                  onClick={() => onDeleteBlock(block.id)}
                                  aria-label="Delete time block"
                                >
                                  <Trash2 size={13} />
                                </button>
                              </div>
                            </div>

                            {block.description && (
                              <p className="solis-time-block-desc">{block.description}</p>
                            )}

                            {/* Progress & Reflection Snippet */}
                            <div className="solis-time-block-meta">
                              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                                  {block.durationMinutes}m planned
                                </span>
                                {block.actualMinutes !== undefined && block.actualMinutes > 0 && (
                                  <span style={{ fontSize: 'var(--text-micro)', color: 'var(--color-coral-500)', fontWeight: 600 }}>
                                    {block.actualMinutes}m logged
                                  </span>
                                )}
                              </div>

                              {block.progressPercent !== undefined && block.progressPercent > 0 && (
                                <div style={{ width: '120px' }}>
                                  <Progress
                                    value={block.progressPercent}
                                    size="sm"
                                    variant="momentum"
                                  />
                                </div>
                              )}
                            </div>

                            {block.reflection && (
                              <div className="solis-time-block-reflection-pill">
                                <em>"{block.reflection}"</em>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div
                    className="solis-hour-empty-canvas"
                    onClick={() => onOpenCreateBlock(hour)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        onOpenCreateBlock(hour);
                      }
                    }}
                    aria-label={`Plan time block at ${formatHourLabel(hour)}`}
                  >
                    <span className="solis-hour-empty-hint">
                      <Plus size={12} />
                      <span>Plan {formatHourLabel(hour)}</span>
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
