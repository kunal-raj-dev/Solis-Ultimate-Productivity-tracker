import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Flame,
  Edit2,
  Trash2
} from 'lucide-react';
import { Task, TaskTimeBlock } from '../../types/task';
import { StudySubject } from '../../types/study';
import { Goal } from '../../types/goal';
import { Badge, BadgeVariant } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Progress } from '../../components/ui/Progress/Progress';
import { getISODateString } from '../../utils/date';

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
  onToggleBlockComplete
}) => {
  const navigate = useNavigate();
  const currentHourRef = useRef<HTMLDivElement>(null);
  const [currentHour, setCurrentHour] = useState<number>(new Date().getHours());
  const [currentMinute, setCurrentMinute] = useState<number>(new Date().getMinutes());

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

        <div style={{ display: 'flex', gap: '8px' }}>
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

      {/* 24-Hour Grid Container */}
      <div className="solis-hourly-grid">
        {Array.from({ length: 24 }, (_, hour) => {
          const isNow = isToday && hour === currentHour;
          const isPastHour = isPastDate || (isToday && hour < currentHour);
          const isUpcoming = !isPastDate && !isToday ? true : (isToday && hour > currentHour);
          const blocks = blocksByHour.get(hour) || [];
          const hasBlocks = blocks.length > 0;

          return (
            <div
              key={hour}
              ref={isNow ? currentHourRef : undefined}
              className={`solis-hour-row ${isNow ? 'solis-hour-row--now' : ''} ${isPastHour ? 'solis-hour-row--past' : ''} ${isUpcoming ? 'solis-hour-row--upcoming' : ''}`}
            >
              {/* Hour Timestamp Axis */}
              <div className="solis-hour-axis">
                <span className="solis-hour-label">{formatHourLabel(hour)}</span>
                {isNow && (
                  <span className="solis-hour-now-badge">
                    <span className="solis-hour-now-dot" />
                    NOW ({String(currentMinute).padStart(2, '0')}m)
                  </span>
                )}
              </div>

              {/* Hour Slot Content */}
              <div className="solis-hour-content">
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
                                  onClick={() => onToggleBlockComplete(block)}
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
                                        block.taskId ? `/app/focus?taskId=${block.taskId}` : '/app/focus',
                                        {
                                          state: {
                                            title: block.taskTitle,
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
                  <button
                    type="button"
                    className="solis-hour-empty-slot"
                    onClick={() => onOpenCreateBlock(hour)}
                  >
                    <Plus size={13} />
                    <span>Plan this hour ({formatHourLabel(hour)})</span>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
