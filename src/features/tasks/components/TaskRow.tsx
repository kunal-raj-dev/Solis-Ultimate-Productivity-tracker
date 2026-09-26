import React, { useState } from 'react';
import {
  Flame,
  Clock,
  Edit2,
  Trash2,
  Repeat,
  AlertTriangle,
  RotateCcw,
  Check,
  ArrowRight,
  Scissors
} from 'lucide-react';
import { Task } from '../../../types/task';
import { StudySubject } from '../../../types/study';
import { Badge, BadgeVariant } from '../../../components/ui/Badge/Badge';
import { useToast } from '../../../context/ToastContext';
import { dataService } from '../../../services/dataService';
import { formatErrorMessage } from '../../../utils/errors';
import { hapticsEngine } from '../../../utils/focus/hapticsEngine';
import { getISODateString } from '../../../utils/date';
import { buildMicroSteps, isMicroStepEligible } from '../../../utils/tasks/taskMicroStepper';
import './TaskRow.css';

interface TaskRowProps {
  task: Task;
  subject?: StudySubject;
  isSelected?: boolean;
  onToggle: (taskId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
  onStartFocus: (task: Task) => void;
  onSlotToHour?: (task: Task, hour: number) => void;
  /** Plan §3.3: one-tap Zeigarnik deferral for overdue tasks ("→ Tomorrow"). */
  onDeferToTomorrow?: (task: Task) => void;
  showScheduleAction?: boolean;
}

export const TaskRow: React.FC<TaskRowProps> = ({
  task,
  subject,
  isSelected = false,
  onToggle,
  onEdit,
  onDelete,
  onStartFocus,
  onSlotToHour,
  onDeferToTomorrow,
  showScheduleAction = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSlotMenuOpen, setIsSlotMenuOpen] = useState(false);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const { addToast } = useToast();

  const isComplete = task.status === 'completed';
  const isPartial = task.status === 'partial';
  const isMissed = task.status === 'missed';
  const isInProgress = task.status === 'in_progress';
  // Overdue = due before today's local calendar date (plan §3.3 deferral target).
  const isOverdue =
    !isComplete && Boolean(task.dueDate) && task.dueDate! < getISODateString(new Date());
  // Plan §5.4: 60m+ tasks without existing subtasks can be broken into micro-steps.
  const isBreakDownEligible =
    !isComplete && isMicroStepEligible(task.estimatedMinutes) && (task.subTasks?.length ?? 0) === 0;

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticsEngine.playMechanicalTick();
    onToggle(task.id);
  };

  // Plan §5.4: deterministic micro-step decomposition (3 sub-tasks < 20m each).
  const handleBreakDown = async (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticsEngine.playMechanicalTick();
    const steps = buildMicroSteps(task.title, task.estimatedMinutes);
    if (steps.length === 0 || isBreakingDown) return;

    setIsBreakingDown(true);
    const createdSubTaskIds: string[] = [];
    try {
      // Persisted via the canonical addSubTask API so both Mock and Supabase
      // backends store the micro-steps (subtasks table / mock collection).
      for (const step of steps) {
        const created = await dataService.tasks.addSubTask(
          task.id,
          `${step.title} (~${step.suggestedMinutes}m)`
        );
        createdSubTaskIds.push(created.id);
      }

      addToast({
        title: 'Task broken into micro-steps',
        description: `3 low-activation steps (< 20m each) were added to "${task.title}".`,
        type: 'success'
      });
    } catch (err) {
      // Roll back any micro-steps created before the failure so the task is
      // never left with a partial subset (P5F9).
      for (const subTaskId of createdSubTaskIds.reverse()) {
        try {
          await dataService.tasks.deleteSubTask(task.id, subTaskId);
        } catch {
          // Best-effort rollback; the error toast below reports the failure.
        }
      }
      addToast({
        title: 'Could not break down task',
        description: formatErrorMessage(err),
        type: 'error'
      });
    } finally {
      setIsBreakingDown(false);
    }
  };

  const getPriorityVariant = (p: Task['priority']): BadgeVariant => {
    switch (p) {
      case 'urgent':
        return 'coral';
      case 'high':
        return 'amber';
      case 'medium':
        return 'neutral';
      case 'low':
        return 'neutral';
      default:
        return 'neutral';
    }
  };

  const commonHours = [
    { hour: 9, label: '9 AM' },
    { hour: 11, label: '11 AM' },
    { hour: 14, label: '2 PM' },
    { hour: 16, label: '4 PM' },
    { hour: 18, label: '6 PM' },
    { hour: 20, label: '8 PM' }
  ];

  const isMac = typeof navigator !== 'undefined' && /Mac|iPod|iPhone|iPad/.test(navigator.platform || navigator.userAgent);
  const undoShortcutLabel = isMac ? '⌘Z' : 'Ctrl+Z';

  return (
    <div
      className={`solis-task-row ${isComplete ? 'solis-task-row--completed' : ''} ${
        isInProgress ? 'solis-task-row--in-progress' : ''
      } ${isSelected ? 'solis-task-row--selected' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => {
        setIsHovered(false);
        setIsSlotMenuOpen(false);
      }}
      onClick={() => onEdit(task)}
      role="row"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' && e.target === e.currentTarget) {
          e.preventDefault();
          onEdit(task);
        }
      }}
    >
      {/* 1. Precise Tactile Checkbox */}
      <button
        type="button"
        className={`solis-task-check-button ${isComplete ? 'solis-task-check-button--checked' : ''}`}
        onClick={handleCheckboxClick}
        aria-label={`Mark task "${task.title}" as ${isComplete ? 'incomplete' : 'complete'}`}
      >
        {isComplete ? (
          <Check size={13} strokeWidth={3} className="solis-task-check-icon" />
        ) : isPartial ? (
          <AlertTriangle size={12} color="var(--color-amber-500)" />
        ) : isMissed ? (
          <RotateCcw size={12} color="var(--color-rose-500)" />
        ) : null}
      </button>

      {/* 2. Priority indicator dot */}
      <span
        className={`solis-task-priority-indicator solis-task-priority-indicator--${task.priority}`}
        title={`Priority: ${task.priority}`}
      />

      {/* 3. Task Main Info: Title & Recurrence */}
      <div className="solis-task-main-col">
        <div className="solis-task-title-line">
          <span className={`solis-task-title ${isComplete ? 'solis-task-title--done' : ''}`}>
            {task.title}
          </span>

          {task.recurrence && (
            <span
              className="solis-task-recurrence-badge"
              title={`Recurring: ${task.recurrence.frequency}`}
            >
              <Repeat size={11} />
              <span>{task.recurrence.frequency}</span>
            </span>
          )}

          {task.subTasks && task.subTasks.length > 0 && (
            <span className="solis-task-subtasks-count">
              {task.subTasks.filter((s) => s.completed).length}/{task.subTasks.length}
            </span>
          )}
        </div>

        {task.description && (
          <p className="solis-task-desc-snippet">{task.description}</p>
        )}

        {/* 4. Metadata Pills (Subject, Category, Due Time, Duration) */}
        {(subject || task.dueTime || (task.estimatedMinutes !== undefined && task.estimatedMinutes > 0) || task.priority !== 'medium') && (
          <div className="solis-task-metadata-col">
            {subject && (
              <Badge variant={(subject.color as BadgeVariant) || 'coral'}>
                {subject.name}
              </Badge>
            )}

            {task.dueTime && (
              <span className="solis-task-meta-item" title="Due time">
                <Clock size={11} />
                <span>{task.dueTime}</span>
              </span>
            )}

            {task.estimatedMinutes !== undefined && task.estimatedMinutes > 0 && (
              <span className="solis-task-meta-item" title="Estimated duration">
                <span>{task.estimatedMinutes}m</span>
                {task.completedMinutes !== undefined && task.completedMinutes > 0 && (
                  <span className="solis-task-logged-span">({task.completedMinutes}m logged)</span>
                )}
              </span>
            )}

            {task.priority !== 'medium' && (
              <Badge variant={getPriorityVariant(task.priority)}>
                {task.priority}
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* 5. Fast Action Bar (Visible on hover/focus) */}
      <div
        className={`solis-task-actions-col ${isHovered || isSlotMenuOpen ? 'solis-task-actions-col--visible' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {!isComplete && (
          <button
            type="button"
            className="solis-task-action-btn solis-task-action-btn--focus tactile-press"
            onClick={() => onStartFocus(task)}
            title="Start deep focus on this task"
            aria-label={`Start deep focus on ${task.title}`}
          >
            <Flame size={13} />
            <span>Focus</span>
          </button>
        )}

        {/* Plan §5.4: deterministic micro-stepping assistant for large tasks */}
        {isBreakDownEligible && (
          <button
            type="button"
            className="solis-task-action-btn tactile-press"
            onClick={handleBreakDown}
            disabled={isBreakingDown}
            title="Break into 3 gentle micro-steps under 20 minutes each"
            aria-label={`Break down ${task.title} into 3 micro-steps`}
          >
            <Scissors size={13} />
            <span>{isBreakingDown ? 'Breaking…' : 'Break Down'}</span>
          </button>
        )}

        {/* Plan §3.3: calm one-tap deferral for overdue tasks */}
        {isOverdue && onDeferToTomorrow && (
          <button
            type="button"
            className="solis-task-action-btn solis-task-action-btn--defer tactile-press"
            onClick={() => {
              hapticsEngine.playMechanicalTick();
              onDeferToTomorrow(task);
            }}
            title="Move to tomorrow — it will be waiting for you"
            aria-label={`Defer ${task.title} to tomorrow`}
          >
            <ArrowRight size={13} />
            <span>Tomorrow</span>
          </button>
        )}

        {showScheduleAction && onSlotToHour && !isComplete && (
          <div className="solis-task-slot-dropdown-wrapper">
            <button
              type="button"
              className="solis-task-action-btn tactile-press"
              onClick={() => setIsSlotMenuOpen((prev) => !prev)}
              title="Slot into a time block"
              aria-label="Slot into time block"
            >
              <Clock size={13} />
              <span>Slot</span>
            </button>

            {isSlotMenuOpen && (
              <div className="solis-task-slot-menu">
                <span className="solis-task-slot-menu-title">Slot into Today:</span>
                {commonHours.map((h) => (
                  <button
                    key={h.hour}
                    type="button"
                    className="solis-task-slot-menu-item"
                    onClick={() => {
                      onSlotToHour(task, h.hour);
                      setIsSlotMenuOpen(false);
                    }}
                  >
                    {h.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        <button
          type="button"
          className="solis-task-action-icon-btn"
          onClick={() => onEdit(task)}
          title="Edit task details"
          aria-label={`Edit task ${task.title}`}
        >
          <Edit2 size={13} />
        </button>

        <button
          type="button"
          className="solis-task-action-icon-btn solis-task-action-icon-btn--delete"
          onClick={() => onDelete(task.id)}
          title={`Delete task (${undoShortcutLabel} to undo)`}
          aria-label={`Delete task ${task.title}`}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
