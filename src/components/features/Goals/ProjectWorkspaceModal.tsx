import React from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';
import { Progress } from '../../ui/Progress/Progress';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import { Goal } from '../../../types/goal';
import { Task } from '../../../types/task';
import { StudyResource } from '../../../types/resource';
import { Habit } from '../../../types/habit';
import { Play, ExternalLink, GitBranch, ListTodo, Bookmark, Flame } from 'lucide-react';

export interface ProjectWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  tasks: Task[];
  resources?: StudyResource[];
  habits?: Habit[];
  onToggleMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  onLaunchFocus: (subjectId?: string, title?: string) => void;
}

export const ProjectWorkspaceModal: React.FC<ProjectWorkspaceModalProps> = ({
  isOpen,
  onClose,
  goal,
  tasks,
  resources,
  habits,
  onToggleMilestone,
  onLaunchFocus
}) => {
  if (!isOpen || !goal) return null;

  const projectTasks = tasks.filter((t) => !goal.subjectId || t.subjectId === goal.subjectId);
  const completedMilestones = goal.milestones.filter((m) => m.completed).length;
  const progressPercent = goal.milestones.length > 0
    ? Math.round((completedMilestones / goal.milestones.length) * 100)
    : goal.progressPercentage;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Project Engineering Sanctuary"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Header Summary */}
        <div style={{ padding: '16px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant="amber">Project Workspace</Badge>
              {goal.subjectName && (
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                  {goal.subjectName}
                </span>
              )}
            </div>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
              Target: {goal.targetDate}
            </span>
          </div>

          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-2)', margin: '8px 0 4px' }}>
            {goal.title}
          </h3>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.5 }}>
            {goal.description}
          </p>

          {goal.projectRepositoryUrl && (
            <div style={{ marginTop: '12px' }}>
              <a
                href={goal.projectRepositoryUrl}
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: 'var(--text-caption)',
                  color: 'var(--color-coral-500)',
                  textDecoration: 'none',
                  fontWeight: 500
                }}
              >
                <GitBranch size={14} /> {goal.projectRepositoryUrl} <ExternalLink size={12} />
              </a>
            </div>
          )}
        </div>

        {/* Milestone Deliverables Roadmap */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
              Milestone Deliverables
            </span>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-amber-600)', fontWeight: 600 }}>
              {completedMilestones} of {goal.milestones.length} Completed ({progressPercent}%)
            </span>
          </div>
          <Progress value={progressPercent} variant="amber" size="md" />

          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginTop: '10px' }}>
            {goal.milestones.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-surface-primary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <Checkbox
                  checked={m.completed}
                  onChange={() => onToggleMilestone(goal.id, m.id)}
                  aria-label={`Mark milestone ${m.title} complete`}
                />
                <span
                  style={{
                    fontSize: 'var(--text-body-sm)',
                    textDecoration: m.completed ? 'line-through' : 'none',
                    color: m.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                    flex: 1
                  }}
                >
                  {m.title}
                </span>
                {m.targetDate && (
                  <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                    {m.targetDate}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Linked Technical Documentation & Resources */}
        {resources && resources.filter((r) => !goal.subjectId || r.subjectId === goal.subjectId).length > 0 && (
          <div>
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Engineering References & Docs
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {resources
                .filter((r) => !goal.subjectId || r.subjectId === goal.subjectId)
                .slice(0, 3)
                .map((res) => (
                  <div
                    key={res.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-surface-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-body-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bookmark size={14} color="var(--color-amber-500)" />
                      <span style={{ fontWeight: 500 }}>{res.title}</span>
                    </div>
                    {res.url && (
                      <a href={res.url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-coral-500)', display: 'inline-flex' }}>
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Linked Daily Consistency Rituals */}
        {habits && habits.filter((h) => h.goalId === goal.id).length > 0 && (
          <div>
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Linked Daily Consistency Rituals
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {habits
                .filter((h) => h.goalId === goal.id)
                .map((h) => (
                  <div
                    key={h.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      backgroundColor: 'var(--bg-surface-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-body-sm)'
                    }}
                  >
                    <Flame size={14} color="var(--color-coral-500)" />
                    <span style={{ fontWeight: 500 }}>{h.title}</span>
                    <Badge variant="coral">{h.currentStreak}d streak</Badge>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Key Deliverable Items if any */}
        {goal.deliverables && goal.deliverables.length > 0 && (
          <div style={{ padding: '12px 14px', backgroundColor: 'var(--bg-surface-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--text-caption)', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
              Core Technical Deliverables
            </span>
            <ul style={{ margin: '6px 0 0 0', paddingLeft: '18px', fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>
              {goal.deliverables.map((item, idx) => (
                <li key={idx} style={{ marginBottom: '4px' }}>{item}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Linked Project Action Tasks */}
        {projectTasks.length > 0 && (
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <ListTodo size={15} color="var(--color-coral-500)" />
              <span style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
                Active Project Tasks ({projectTasks.length})
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '120px', overflowY: 'auto' }}>
              {projectTasks.map((t) => (
                <div
                  key={t.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '6px 10px',
                    borderRadius: 'var(--radius-sm)',
                    backgroundColor: 'var(--bg-surface-primary)',
                    border: '1px solid var(--border-subtle)',
                    fontSize: 'var(--text-caption)'
                  }}
                >
                  <span style={{ textDecoration: t.status === 'completed' ? 'line-through' : 'none', color: t.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                    {t.title}
                  </span>
                  <Badge variant={t.priority === 'urgent' ? 'coral' : t.priority === 'high' ? 'amber' : 'neutral'}>
                    {t.priority}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-xs)' }}>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          <Button
            variant="primary"
            leftIcon={<Play size={14} />}
            onClick={() => {
              onClose();
              onLaunchFocus(goal.subjectId, `Project Sprint: ${goal.title}`);
            }}
          >
            Start Project Focus Sprint (45m)
          </Button>
        </div>
      </div>
    </Modal>
  );
};
