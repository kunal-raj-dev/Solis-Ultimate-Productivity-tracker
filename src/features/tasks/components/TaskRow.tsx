import React, { useState } from 'react';
import {
  Flame,
  Clock,
  Edit2,
  Trash2,
  Repeat,
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';
import { Task } from '../../../types/task';
import { StudySubject } from '../../../types/study';
import { Badge, BadgeVariant } from '../../../components/ui/Badge/Badge';
import { hapticsEngine } from '../../../utils/focus/hapticsEngine';
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
  showScheduleAction = true
}) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isSlotMenuOpen, setIsSlotMenuOpen] = useState(false);

  const isComplete = task.status === 'completed';
  const isPartial = task.status === 'partial';
  const isMissed = task.status === 'missed';
  const isInProgress = task.status === 'in_progress';

  const handleCheckboxClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    hapticsEngine.playMechanicalTick();
    onToggle(task.id);
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
      </div>

      {/* 4. Metadata Pills (Subject, Category, Due Time, Duration) */}
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
          title="Delete task (Cmd+Z to undo)"
          aria-label={`Delete task ${task.title}`}
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  );
};
