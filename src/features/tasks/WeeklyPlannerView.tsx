import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  Clock,
  Plus,
  CheckCircle2,
  Trash2,
  Edit2,
  Calendar as CalendarIcon,
  Flame
} from 'lucide-react';
import { Task, TaskTimeBlock } from '../../types/task';
import { StudySubject } from '../../types/study';
import { Goal } from '../../types/goal';
import { Button } from '../../components/ui/Button/Button';
import {
  getWeekDays,
  formatWeekRange,
  getISODateString,
  addDays,
  WeekDayInfo
} from '../../utils/date';
import { dataService } from '../../services/dataService';
import { calendarService } from '../../services/calendar/calendar.service';
import { ExternalCalendarEvent } from '../../types/calendar';
import { hapticsEngine } from '../../utils/focus/hapticsEngine';
import './WeeklyPlannerView.css';

export interface WeeklyPlannerViewProps {
  selectedDate: string;
  onSelectDate: (date: string) => void;
  tasks: Task[];
  subjects: StudySubject[];
  goals: Goal[];
  onOpenCreateBlock: (date: string, hour: number) => void;
  onOpenEditBlock: (block: TaskTimeBlock) => void;
  onOpenReviewBlock: (block: TaskTimeBlock) => void;
  onDeleteBlock: (blockId: string) => void;
  onToggleBlockComplete: (block: TaskTimeBlock) => void;
  onScheduleTaskToDateAndHour?: (task: Task, date: string, hour: number) => Promise<void>;
  onSwitchToDayView?: (date: string) => void;
}

const TASK_DRAG_MIME = 'application/x-solis-task-id';

/**
 * Feature 1.2: Multi-Day / 7-Day Weekly Calendar Time-Blocker
 *
 * Provides a responsive 7-column weekly time-grid view with:
 * - Parallel horizontal alignment of all 7 days of the active week
 * - Workday (08:00–20:00) vs 24-Hour mode toggles
 * - Live external .ics calendar overlay integration per cell
 * - Drag-and-drop task placement across any day and hour
 * - Quick-slot creation, completion toggling, and review actions
 * - Real-time current-time indicator across today's column
 * - Comprehensive week workload synthesis
 */
export const WeeklyPlannerView: React.FC<WeeklyPlannerViewProps> = ({
  selectedDate,
  onSelectDate,
  tasks,
  subjects: _subjects,
  goals: _goals,
  onOpenCreateBlock,
  onOpenEditBlock,
  onOpenReviewBlock,
  onDeleteBlock,
  onToggleBlockComplete,
  onScheduleTaskToDateAndHour,
  onSwitchToDayView
}) => {
  const [viewHoursMode, setViewHoursMode] = useState<'workday' | '24h'>('workday');
  const [weekBlocks, setWeekBlocks] = useState<Record<string, TaskTimeBlock[]>>({});
  const [calendarEvents, setCalendarEvents] = useState<ExternalCalendarEvent[]>([]);
  const [dragOverCell, setDragOverCell] = useState<{ date: string; hour: number } | null>(null);
  const [isBacklogShelfOpen, setIsBacklogShelfOpen] = useState(false);

  // Compute 7 days for the current week
  const weekDays = useMemo<WeekDayInfo[]>(() => {
    return getWeekDays(selectedDate, true);
  }, [selectedDate]);

  const weekRangeTitle = useMemo(() => {
    return formatWeekRange(weekDays);
  }, [weekDays]);

  // Load time blocks for all 7 days
  const loadWeekBlocks = useCallback(async () => {
    try {
      const dates = weekDays.map((d) => d.date);
      const results = await Promise.all(dates.map((d) => dataService.tasks.getTimeBlocks(d)));
      const map: Record<string, TaskTimeBlock[]> = {};
      dates.forEach((d, idx) => {
        map[d] = results[idx] || [];
      });
      setWeekBlocks(map);
    } catch {
      // Non-fatal
    }
  }, [weekDays]);

  useEffect(() => {
    loadWeekBlocks();
    const unsub = dataService.subscribe(() => {
      loadWeekBlocks();
    }, ['tasks']);
    return () => unsub();
  }, [loadWeekBlocks]);

  // Load external calendar events
  useEffect(() => {
    try {
      setCalendarEvents(calendarService.getAllEvents());
      const unsub = calendarService.subscribe(() => {
        setCalendarEvents(calendarService.getAllEvents());
      });
      return () => unsub();
    } catch {
      // Non-fatal
    }
  }, []);

  // Time boundaries
  const hours = useMemo(() => {
    if (viewHoursMode === 'workday') {
      return Array.from({ length: 13 }, (_, i) => i + 8); // 8:00 to 20:00 (8am - 8pm)
    }
    return Array.from({ length: 24 }, (_, i) => i); // 0:00 to 23:00
  }, [viewHoursMode]);

  // Current real-time clock
  const [nowDate, setNowDate] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setNowDate(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  const currentHour = nowDate.getHours();
  const currentMinute = nowDate.getMinutes();

  // Weekly workload stats
  const allWeekBlocksList = useMemo(() => {
    return Object.values(weekBlocks).flat();
  }, [weekBlocks]);

  const totalWeekMinutes = useMemo(() => {
    return allWeekBlocksList.reduce((acc, b) => acc + (b.durationMinutes || 60), 0);
  }, [allWeekBlocksList]);

  const completedBlocksCount = useMemo(() => {
    return allWeekBlocksList.filter((b) => b.status === 'completed').length;
  }, [allWeekBlocksList]);

  // Navigation handlers
  const handlePrevWeek = () => {
    const ref = new Date(`${selectedDate}T00:00:00`);
    const newDate = addDays(ref, -7);
    onSelectDate(getISODateString(newDate));
  };

  const handleNextWeek = () => {
    const ref = new Date(`${selectedDate}T00:00:00`);
    const newDate = addDays(ref, 7);
    onSelectDate(getISODateString(newDate));
  };

  const handleJumpToThisWeek = () => {
    onSelectDate(getISODateString(new Date()));
  };

  // Drag and drop handlers
  const handleDragOver = (date: string, hour: number) => (e: React.DragEvent) => {
    if (!onScheduleTaskToDateAndHour) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
    if (!dragOverCell || dragOverCell.date !== date || dragOverCell.hour !== hour) {
      setDragOverCell({ date, hour });
    }
  };

  const handleDragLeave = () => {
    setDragOverCell(null);
  };

  const handleDropTask = (date: string, hour: number) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOverCell(null);
    if (!onScheduleTaskToDateAndHour) return;

    const taskId = e.dataTransfer.getData(TASK_DRAG_MIME) || e.dataTransfer.getData('text/plain');
    const task = tasks.find((t) => t.id === taskId);
    if (!task) return;

    hapticsEngine.playMechanicalTick();
    onScheduleTaskToDateAndHour(task, date, hour);
  };

  // Find unscheduled backlog tasks
  const scheduledTaskIds = useMemo(() => {
    return new Set(allWeekBlocksList.map((b) => b.taskId).filter(Boolean));
  }, [allWeekBlocksList]);

  const unscheduledTasks = useMemo(() => {
    return tasks.filter((t) => t.status !== 'completed' && !scheduledTaskIds.has(t.id));
  }, [tasks, scheduledTaskIds]);

  return (
    <div className="solis-weekly-planner animate-fade-in">
      {/* 1. Header Navigation Bar */}
      <div className="solis-weekly-nav-bar">
        <div className="solis-weekly-nav-controls">
          <Button
            variant="subtle"
            size="sm"
            onClick={handlePrevWeek}
            aria-label="Previous week"
            leftIcon={<ChevronLeft size={16} />}
          >
            Prev
          </Button>

          <span className="solis-weekly-range-label">{weekRangeTitle}</span>

          <Button
            variant="subtle"
            size="sm"
            onClick={handleNextWeek}
            aria-label="Next week"
            rightIcon={<ChevronRight size={16} />}
          >
            Next
          </Button>

          <Button variant="outline" size="sm" onClick={handleJumpToThisWeek}>
            This Week
          </Button>
        </div>

        <div className="solis-weekly-view-toggles">
          <div style={{ display: 'flex', gap: '4px' }}>
            <Button
              variant={viewHoursMode === 'workday' ? 'primary' : 'subtle'}
              size="sm"
              onClick={() => setViewHoursMode('workday')}
            >
              Workday (8–20)
            </Button>
            <Button
              variant={viewHoursMode === '24h' ? 'primary' : 'subtle'}
              size="sm"
              onClick={() => setViewHoursMode('24h')}
            >
              24h
            </Button>
          </div>

          {onSwitchToDayView && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onSwitchToDayView(selectedDate)}
              leftIcon={<Clock size={14} />}
            >
              Day Detail
            </Button>
          )}
        </div>
      </div>

      {/* 2. Weekly Synthesis Strip */}
      <div className="solis-weekly-summary-strip">
        <div className="solis-weekly-stats-group">
          <div className="solis-weekly-stat">
            <Clock size={15} color="var(--color-coral-500)" />
            <span>
              Total Planned: <strong>{(totalWeekMinutes / 60).toFixed(1)} hrs</strong>
            </span>
          </div>

          <div className="solis-weekly-stat">
            <CheckCircle2 size={15} color="var(--color-emerald-500, #10b981)" />
            <span>
              Completion: <strong>{completedBlocksCount}/{allWeekBlocksList.length} blocks</strong>
            </span>
          </div>

          <div className="solis-weekly-stat">
            <Flame size={15} color="var(--color-amber-500, #f59e0b)" />
            <span>
              Daily Average: <strong>{(totalWeekMinutes / 7 / 60).toFixed(1)} hrs/day</strong>
            </span>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <button
            type="button"
            className="solis-slot-chip-btn tactile-press"
            onClick={() => setIsBacklogShelfOpen((prev) => !prev)}
            style={{ fontSize: '11px', padding: '4px 10px' }}
          >
            {isBacklogShelfOpen ? 'Hide Unscheduled Backlog' : `Unscheduled Backlog (${unscheduledTasks.length})`}
          </button>
        </div>
      </div>

      {/* Optional Unscheduled Backlog Shelf */}
      {isBacklogShelfOpen && (
        <div className="solis-unscheduled-shelf animate-fade-in" style={{ marginBottom: 0 }}>
          <div className="solis-unscheduled-shelf-header" style={{ marginBottom: '8px' }}>
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Drag tasks into any day and hour slot:
            </span>
            <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
              {unscheduledTasks.length} backlog items ready
            </span>
          </div>
          <div className="solis-unscheduled-chips-row" style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {unscheduledTasks.length === 0 ? (
              <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                All tasks are slotted into your schedule!
              </span>
            ) : (
              unscheduledTasks.slice(0, 15).map((task) => (
                <div
                  key={task.id}
                  className="solis-unscheduled-task-chip solis-unscheduled-task-chip--draggable tactile-press"
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(TASK_DRAG_MIME, task.id);
                    e.dataTransfer.setData('text/plain', task.id);
                  }}
                  title="Drag onto any slot in the 7-day grid"
                  style={{ display: 'flex', alignItems: 'center', gap: '6px' }}
                >
                  <span className="solis-unscheduled-task-name">{task.title}</span>
                  <span style={{ fontSize: '9px', color: 'var(--text-muted)' }}>
                    {task.estimatedMinutes || 30}m
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* 3. Main 7-Day Multi-Day Calendar Time Grid */}
      <div className="solis-weekly-scroll-container">
        <div className="solis-weekly-grid-table">
          {/* Header Row: Corner Cell + 7 Day Headers */}
          <div className="solis-weekly-header-row">
            <div className="solis-weekly-corner-cell">Time</div>
            {weekDays.map((day) => {
              const dayBlocks = weekBlocks[day.date] || [];
              const dayMins = dayBlocks.reduce((acc, b) => acc + (b.durationMinutes || 60), 0);
              const isSelected = day.date === selectedDate;

              return (
                <div
                  key={day.date}
                  className={`solis-weekly-day-header ${day.isToday ? 'solis-weekly-day-header--today' : ''}`}
                  onClick={() => {
                    onSelectDate(day.date);
                    if (onSwitchToDayView) onSwitchToDayView(day.date);
                  }}
                  title={`Click to focus on ${day.fullDayName}, ${day.monthName} ${day.dayNumber}`}
                  style={{
                    backgroundColor: isSelected && !day.isToday ? 'rgba(0,0,0,0.03)' : undefined
                  }}
                >
                  <span className="solis-weekly-day-name">{day.dayName}</span>
                  <span className="solis-weekly-day-number">{day.dayNumber}</span>
                  <span className="solis-weekly-day-meta">
                    {dayMins > 0 ? `${(dayMins / 60).toFixed(1)}h` : '—'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Body Rows: One Row Per Hour */}
          <div className="solis-weekly-body">
            {hours.map((hour) => {
              const hourLabel = `${hour.toString().padStart(2, '0')}:00`;

              return (
                <div key={hour} className="solis-weekly-hour-row">
                  {/* Left-hand sticky time gutter */}
                  <div className="solis-weekly-time-gutter">{hourLabel}</div>

                  {/* 7 Columns for the 7 Days */}
                  {weekDays.map((day) => {
                    const dayBlocks = weekBlocks[day.date] || [];
                    const matchingBlocks = dayBlocks.filter((b) => b.startHour === hour);
                    const matchingEvents = calendarEvents.filter((ev) => {
                      if (!ev.startTime) return false;
                      const [evDate, evTime] = ev.startTime.split('T');
                      if (evDate !== day.date) return false;
                      const evHour = parseInt(evTime?.split(':')[0] || '-1', 10);
                      return evHour === hour;
                    });

                    const isOver = dragOverCell?.date === day.date && dragOverCell?.hour === hour;
                    const isCurrentHourCell = day.isToday && currentHour === hour;

                    return (
                      <div
                        key={`${day.date}_${hour}`}
                        className={`solis-weekly-cell ${day.isToday ? 'solis-weekly-cell--today' : ''} ${
                          isOver ? 'solis-weekly-cell--drag-over' : ''
                        }`}
                        onDragOver={handleDragOver(day.date, hour)}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDropTask(day.date, hour)}
                      >
                        {/* Current time horizontal indicator */}
                        {isCurrentHourCell && (
                          <div
                            className="solis-week-now-indicator"
                            style={{ top: `${(currentMinute / 60) * 100}%` }}
                            title={`Current time: ${hourLabel}`}
                          />
                        )}

                        {/* Render External Calendar Events */}
                        {matchingEvents.map((evt) => (
                          <div
                            key={evt.id}
                            className="solis-week-event-chip"
                            title={`External Calendar: ${evt.title} (${evt.calendarName || 'Feed'})`}
                          >
                            <CalendarIcon size={10} color="#3b82f6" />
                            <span>{evt.title}</span>
                          </div>
                        ))}

                        {/* Render Time Blocks */}
                        {matchingBlocks.map((block) => {
                          const statusClass =
                            block.status === 'completed'
                              ? 'solis-week-block-chip--completed'
                              : block.status === 'active'
                              ? 'solis-week-block-chip--active'
                              : block.status === 'partial'
                              ? 'solis-week-block-chip--partial'
                              : block.status === 'missed'
                              ? 'solis-week-block-chip--missed'
                              : '';

                          return (
                            <div
                              key={block.id}
                              className={`solis-week-block-chip ${statusClass}`}
                              onClick={(e) => {
                                e.stopPropagation();
                                if (block.status === 'completed' || block.status === 'partial') {
                                  onOpenReviewBlock(block);
                                } else {
                                  onOpenEditBlock(block);
                                }
                              }}
                            >
                              <div className="solis-week-block-top">
                                <span className="solis-week-block-title">{block.taskTitle}</span>
                                <span className="solis-week-block-meta">
                                  {block.durationMinutes || 60}m
                                </span>
                              </div>

                              <div className="solis-week-block-actions">
                                <button
                                  type="button"
                                  className="solis-week-block-btn solis-week-block-btn--check"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    hapticsEngine.playMechanicalTick();
                                    onToggleBlockComplete(block);
                                  }}
                                  title={block.status === 'completed' ? 'Reopen block' : 'Complete block'}
                                >
                                  <CheckCircle2
                                    size={12}
                                    color={block.status === 'completed' ? 'var(--color-emerald-500, #10b981)' : 'currentColor'}
                                  />
                                </button>

                                <button
                                  type="button"
                                  className="solis-week-block-btn"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onOpenEditBlock(block);
                                  }}
                                  title="Edit block"
                                >
                                  <Edit2 size={11} />
                                </button>

                                <button
                                  type="button"
                                  className="solis-week-block-btn solis-week-block-btn--delete"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    onDeleteBlock(block.id);
                                  }}
                                  title="Delete block"
                                >
                                  <Trash2 size={11} />
                                </button>
                              </div>
                            </div>
                          );
                        })}

                        {/* Hover Quick Add Slot Button */}
                        <button
                          type="button"
                          className="solis-weekly-add-slot-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            onOpenCreateBlock(day.date, hour);
                          }}
                          title={`Schedule time block at ${hourLabel} on ${day.dayName}`}
                        >
                          <Plus size={10} />
                          <span>Slot</span>
                        </button>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
