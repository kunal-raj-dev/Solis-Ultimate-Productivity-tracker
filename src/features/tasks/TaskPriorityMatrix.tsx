import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Flame,
  Calendar
} from 'lucide-react';
import { Task } from '../../types/task';
import { StudySubject } from '../../types/study';
import { Badge, BadgeVariant } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';

interface TaskPriorityMatrixProps {
  tasks: Task[];
  subjects: StudySubject[];
  onScheduleToHour: (task: Task, hour: number) => Promise<void>;
  onToggleTask: (taskId: string) => void;
}

export const TaskPriorityMatrix: React.FC<TaskPriorityMatrixProps> = ({
  tasks,
  subjects,
  onScheduleToHour,
  onToggleTask
}) => {
  const navigate = useNavigate();

  const urgentTasks = tasks.filter((t) => t.priority === 'urgent' && t.status !== 'completed');
  const highTasks = tasks.filter((t) => t.priority === 'high' && t.status !== 'completed');
  const mediumTasks = tasks.filter((t) => t.priority === 'medium' && t.status !== 'completed');
  const lowTasks = tasks.filter((t) => t.priority === 'low' && t.status !== 'completed');

  const renderQuadrant = (
    title: string,
    subtitle: string,
    taskList: Task[],
    accentColor: string,
    suggestedHour: number
  ) => {
    return (
      <div className="solis-matrix-quadrant" style={{ borderTop: `3px solid ${accentColor}` }}>
        <div className="solis-matrix-quadrant-header">
          <div>
            <h4 style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {title}
            </h4>
            <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
              {subtitle} ({taskList.length})
            </span>
          </div>
        </div>

        <div className="solis-matrix-list">
          {taskList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '24px 8px', color: 'var(--text-muted)', fontSize: 'var(--text-caption)' }}>
              Clear — no tasks in this quadrant
            </div>
          ) : (
            taskList.map((task) => {
              const linkedSub = subjects.find((s) => s.id === task.subjectId);
              return (
                <div key={task.id} className="solis-matrix-card">
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                    <h5 className="solis-matrix-card-title">{task.title}</h5>
                    <button
                      type="button"
                      className="solis-time-block-check-btn"
                      onClick={() => onToggleTask(task.id)}
                      title="Mark task completed"
                    >
                      <div className="solis-time-block-empty-check" />
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {linkedSub && (
                      <Badge variant={(linkedSub.color as BadgeVariant) || 'coral'}>
                        {linkedSub.name}
                      </Badge>
                    )}
                    {task.estimatedMinutes && (
                      <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                        ~{task.estimatedMinutes}m
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '6px', marginTop: '10px' }}>
                    <button
                      type="button"
                      className="solis-matrix-schedule-btn"
                      onClick={() => onScheduleToHour(task, suggestedHour)}
                      title={`Schedule block at ${suggestedHour}:00`}
                    >
                      <Calendar size={11} />
                      Slot at {suggestedHour % 12 === 0 ? 12 : suggestedHour % 12} {suggestedHour >= 12 ? 'PM' : 'AM'}
                    </button>
                    <Button
                      variant="subtle"
                      size="sm"
                      leftIcon={<Flame size={11} color="var(--color-coral-500)" />}
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
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="solis-priority-matrix">
      <div className="solis-matrix-grid">
        {renderQuadrant('Urgent & Critical', 'Execute right now in today’s active window', urgentTasks, 'var(--color-rose-500, #e11d48)', 9)}
        {renderQuadrant('High Mastery Impact', 'Prime deep focus study & core architecture', highTasks, 'var(--color-coral-500, #ff6b4a)', 11)}
        {renderQuadrant('Progress & Practice', 'Review sets, problem solving & revisions', mediumTasks, 'var(--color-amber-500, #f59e0b)', 14)}
        {renderQuadrant('Secondary Backlog', 'Readings, administrative steps & future planning', lowTasks, 'var(--text-muted)', 16)}
      </div>
    </div>
  );
};
