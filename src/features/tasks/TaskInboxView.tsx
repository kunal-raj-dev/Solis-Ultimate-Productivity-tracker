import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Task } from '../../types/task';
import { StudySubject } from '../../types/study';
import { Goal } from '../../types/goal';
import { hapticsEngine } from '../../utils/focus/hapticsEngine';
import { TaskRow } from './components/TaskRow';

interface TaskInboxViewProps {
  tasks: Task[];
  subjects: StudySubject[];
  goals: Goal[];
  onToggleTask: (taskId: string) => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (taskId: string) => void;
  onScheduleToHour: (task: Task, hour: number) => Promise<void>;
  onAddSubtask?: (taskId: string, title: string) => Promise<void>;
  onToggleSubtask?: (taskId: string, subId: string) => Promise<void>;
  onDeleteSubtask?: (taskId: string, subId: string) => Promise<void>;
  title?: string;
  subtitle?: string;
  emptyMessage?: string;
}

export const TaskInboxView: React.FC<TaskInboxViewProps> = ({
  tasks,
  subjects,
  goals: _goals,
  onToggleTask,
  onEditTask,
  onDeleteTask,
  onScheduleToHour,
  title,
  subtitle,
  emptyMessage
}) => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  // Single-key navigation (J = down, K = up, E = toggle complete)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (active && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || (active as HTMLElement).isContentEditable)) {
        return;
      }

      if (e.key === 'j' || e.key === 'J') {
        e.preventDefault();
        setActiveIndex((prev) => (prev < tasks.length - 1 ? prev + 1 : 0));
      } else if (e.key === 'k' || e.key === 'K') {
        e.preventDefault();
        setActiveIndex((prev) => (prev > 0 ? prev - 1 : Math.max(0, tasks.length - 1)));
      } else if (e.key === 'e' || e.key === 'E') {
        if (activeIndex >= 0 && activeIndex < tasks.length) {
          e.preventDefault();
          const target = tasks[activeIndex];
          hapticsEngine.playMechanicalTick();
          onToggleTask(target.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [tasks, activeIndex, onToggleTask]);

  const handleToggle = (taskId: string) => {
    hapticsEngine.playMechanicalTick();
    onToggleTask(taskId);
  };

  return (
    <div className="solis-task-inbox">
      <div className="solis-inbox-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '16px' }}>
        <div>
          <h3 style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {title || 'Tasks & Intentional Backlog'}
          </h3>
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '2px' }}>
            {subtitle || 'Capture fast, then slot tasks into dedicated 1-hour time blocks when you are ready to execute.'}
          </p>
        </div>
        <div className="solis-task-kbd-hint">
          <span className="solis-task-kbd">J</span>
          <span className="solis-task-kbd">K</span>
          <span>navigate</span>
          <span className="solis-task-kbd">E</span>
          <span>toggle</span>
        </div>
      </div>

      <div className="solis-task-inbox-list">
        {tasks.length === 0 ? (
          <div
            className="solis-inbox-empty"
            style={{
              padding: 'var(--space-2xl) var(--space-md)',
              textAlign: 'center',
              border: '1px solid var(--border-hairline)',
              borderRadius: 'var(--radius-lg)',
              background: 'var(--bg-surface-secondary)'
            }}
          >
            <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: 0, fontWeight: 500 }}>
              {emptyMessage || 'No tasks found.'}
            </p>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', display: 'block', marginTop: '6px' }}>
              Press <kbd className="solis-task-kbd">N</kbd> or use the input above to capture intentional tasks.
            </span>
          </div>
        ) : (
          tasks.map((task, index) => {
            const linkedSub = subjects.find((s) => s.id === task.subjectId);
            return (
              <TaskRow
                key={task.id}
                task={task}
                subject={linkedSub}
                isSelected={index === activeIndex}
                onToggle={handleToggle}
                onEdit={onEditTask}
                onDelete={onDeleteTask}
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
                onSlotToHour={onScheduleToHour}
                showScheduleAction={true}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
