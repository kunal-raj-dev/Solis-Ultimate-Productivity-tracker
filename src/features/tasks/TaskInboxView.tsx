import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  Clock,
  Flame,
  ChevronDown,
  ChevronUp,
  Trash2,
  Edit2,
  Tag,
  Target
} from 'lucide-react';
import { Task } from '../../types/task';
import { StudySubject } from '../../types/study';
import { Goal } from '../../types/goal';
import { Button } from '../../components/ui/Button/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge/Badge';
import { Card } from '../../components/ui/Card/Card';
import { Checkbox } from '../../components/ui/Checkbox/Checkbox';
import { Progress } from '../../components/ui/Progress/Progress';
import { formatFriendlyDate } from '../../utils/date';

interface TaskInboxViewProps {
  tasks: Task[];
  subjects: StudySubject[];
  goals: Goal[];
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onScheduleToHour: (task: Task, hour: number) => Promise<void>;
  onAddSubtask: (taskId: string, title: string) => Promise<void>;
  onToggleSubtask: (taskId: string, subId: string) => Promise<void>;
  onDeleteSubtask: (taskId: string, subId: string) => Promise<void>;
}

export const TaskInboxView: React.FC<TaskInboxViewProps> = ({
  tasks,
  subjects,
  goals,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onScheduleToHour,
  onAddSubtask,
  onToggleSubtask,
  onDeleteSubtask
}) => {
  const navigate = useNavigate();
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());
  const [newSubtaskTitles, setNewSubtaskTitles] = useState<Record<string, string>>({});

  const toggleAccordion = (id: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleSubtaskSubmit = async (taskId: string, e: React.FormEvent) => {
    e.preventDefault();
    const val = newSubtaskTitles[taskId]?.trim();
    if (!val) return;
    await onAddSubtask(taskId, val);
    setNewSubtaskTitles((prev) => ({ ...prev, [taskId]: '' }));
  };

  const quickHours = [
    { hour: 9, label: '9 AM' },
    { hour: 11, label: '11 AM' },
    { hour: 14, label: '2 PM' },
    { hour: 16, label: '4 PM' },
    { hour: 18, label: '6 PM' },
    { hour: 20, label: '8 PM' }
  ];

  return (
    <div className="solis-task-inbox">
      <div className="solis-inbox-header">
        <div>
          <h3 style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Inbox & Intentional Backlog
          </h3>
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '2px' }}>
            Capture fast, then slot tasks into dedicated 1-hour time blocks when you are ready to execute.
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {tasks.map((task) => {
          const isExpanded = expandedTaskIds.has(task.id);
          const linkedSub = subjects.find((s) => s.id === task.subjectId);
          const linkedGoal = goals.find((g) => g.id === task.goalId);
          const isDone = task.status === 'completed';
          const totalSubs = task.subTasks?.length || 0;
          const doneSubs = (task.subTasks || []).filter((s) => s.completed).length;

          return (
            <Card
              key={task.id}
              className="depth-1"
              style={{
                padding: 'var(--space-md) var(--space-lg)',
                backgroundColor: isDone ? 'var(--bg-surface-subtle)' : 'var(--bg-surface-primary)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px', flex: 1 }}>
                  <div style={{ paddingTop: '3px' }}>
                    <Checkbox
                      checked={isDone}
                      onChange={() => onToggleTask(task.id)}
                      aria-label={`Toggle task ${task.title}`}
                    />
                  </div>

                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                      <h4
                        style={{
                          fontSize: 'var(--text-body)',
                          fontWeight: 600,
                          textDecoration: isDone ? 'line-through' : 'none',
                          color: isDone ? 'var(--text-muted)' : 'var(--text-primary)'
                        }}
                      >
                        {task.title}
                      </h4>

                      <Badge variant={task.priority === 'urgent' || task.priority === 'high' ? 'coral' : 'neutral'}>
                        {task.priority}
                      </Badge>

                      <Badge variant="neutral">{task.category}</Badge>

                      {linkedSub && (
                        <Badge variant={(linkedSub.color as BadgeVariant) || 'coral'}>
                          {linkedSub.name}
                        </Badge>
                      )}

                      {linkedGoal && (
                        <Badge variant="amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Target size={11} />
                          <span>{linkedGoal.title}</span>
                        </Badge>
                      )}
                    </div>

                    {task.description && (
                      <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {task.description}
                      </p>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
                      {task.dueDate && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                          <Clock size={11} color="var(--color-coral-500)" />
                          {formatFriendlyDate(task.dueDate)} {task.dueTime || ''}
                        </span>
                      )}

                      {task.estimatedMinutes && (
                        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                          ~{task.estimatedMinutes}m
                        </span>
                      )}

                      {task.tags?.map((t) => (
                        <span key={t} className="solis-task-tag">
                          <Tag size={10} />
                          {t}
                        </span>
                      ))}
                    </div>

                    {/* Quick Schedule to Hour Bar */}
                    {!isDone && (
                      <div className="solis-inbox-schedule-bar">
                        <span className="solis-inbox-schedule-label">
                          <Calendar size={12} /> Schedule into Day Grid:
                        </span>
                        <div className="solis-inbox-quick-hours">
                          {quickHours.map((qh) => (
                            <button
                              key={qh.hour}
                              type="button"
                              className="solis-inbox-hour-chip"
                              onClick={() => onScheduleToHour(task, qh.hour)}
                            >
                              +{qh.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Subtasks Progress */}
                    {totalSubs > 0 && (
                      <div style={{ marginTop: '8px', maxWidth: '280px' }}>
                        <Progress
                          value={Math.round((doneSubs / totalSubs) * 100)}
                          size="sm"
                          variant="momentum"
                          label={`Subtasks (${doneSubs}/${totalSubs})`}
                          showValueText
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  {!isDone && (
                    <Button
                      variant="subtle"
                      size="sm"
                      leftIcon={<Flame size={12} color="var(--color-coral-500)" />}
                      onClick={() =>
                        navigate(`/app/focus?taskId=${task.id}`, {
                          state: {
                            title: task.title,
                            subjectId: task.subjectId,
                            durationMinutes: task.estimatedMinutes || 30
                          }
                        })
                      }
                    >
                      Focus
                    </Button>
                  )}

                  <button
                    type="button"
                    className="solis-time-block-icon-btn"
                    onClick={() => toggleAccordion(task.id)}
                    aria-label="Toggle subtasks"
                  >
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </button>

                  <button
                    type="button"
                    className="solis-time-block-icon-btn"
                    onClick={() => onEditTask(task)}
                    aria-label="Edit task"
                  >
                    <Edit2 size={14} />
                  </button>

                  <button
                    type="button"
                    className="solis-time-block-icon-btn"
                    onClick={() => onDeleteTask(task.id)}
                    aria-label="Delete task"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>

              {/* Subtasks Accordion Content */}
              {isExpanded && (
                <div style={{ marginTop: '14px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {task.subTasks?.map((sub) => (
                      <div key={sub.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Checkbox
                            checked={sub.completed}
                            onChange={() => onToggleSubtask(task.id, sub.id)}
                            aria-label={`Toggle subtask ${sub.title}`}
                          />
                          <span
                            style={{
                              fontSize: 'var(--text-body-sm)',
                              textDecoration: sub.completed ? 'line-through' : 'none',
                              color: sub.completed ? 'var(--text-muted)' : 'var(--text-primary)'
                            }}
                          >
                            {sub.title}
                          </span>
                        </div>
                        <button
                          type="button"
                          className="solis-time-block-icon-btn"
                          onClick={() => onDeleteSubtask(task.id, sub.id)}
                          aria-label="Delete subtask"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}

                    {/* Add Subtask input */}
                    <form onSubmit={(e) => handleSubtaskSubmit(task.id, e)} style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                      <input
                        type="text"
                        placeholder="Add actionable subtask step..."
                        value={newSubtaskTitles[task.id] || ''}
                        onChange={(e) => setNewSubtaskTitles((prev) => ({ ...prev, [task.id]: e.target.value }))}
                        className="solis-subtask-input"
                      />
                      <Button type="submit" variant="subtle" size="sm" disabled={!newSubtaskTitles[task.id]?.trim()}>
                        Add
                      </Button>
                    </form>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
};
