import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  FolderGit2,
  Target,
  Clock,
  ExternalLink,
  Flame,
  CheckCircle2,
  Circle,
  Plus,
  Trash2,
  Edit2,
  Play,
  Check,
  RotateCcw,
  ListTodo,
  AlertTriangle
} from 'lucide-react';
import { Goal } from '../../../types/goal';
import { StudyTopic } from '../../../types/study';
import { Flashcard } from '../../../types/learning';
import { Task } from '../../../types/task';
import { Habit } from '../../../types/habit';
import { Badge } from '../../../components/ui/Badge/Badge';
import { Button } from '../../../components/ui/Button/Button';
import { Progress } from '../../../components/ui/Progress/Progress';
import { calculateExamReadiness } from '../../../utils/intelligence/masteryIntelligence';

export interface GoalCardProps {
  goal: Goal;
  topics: StudyTopic[];
  flashcards: Flashcard[];
  tasks: Task[];
  habits: Habit[];
  onOpenEdit: (goal: Goal) => void;
  onConfirmDelete: (goalId: string) => void;
  onToggleMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  onAddMilestone: (goalId: string, title: string, targetDate?: string) => Promise<void>;
  onDeleteMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  onLaunchFocus: (subjectId?: string, title?: string) => void;
  onOpenExamWorkspace: (goal: Goal) => void;
  onOpenProjectWorkspace: (goal: Goal) => void;
  onToggleStatus: (goal: Goal) => Promise<void>;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  goal,
  topics,
  flashcards,
  tasks,
  habits,
  onOpenEdit,
  onConfirmDelete,
  onToggleMilestone,
  onAddMilestone,
  onDeleteMilestone,
  onLaunchFocus,
  onOpenExamWorkspace,
  onOpenProjectWorkspace,
  onToggleStatus
}) => {
  const navigate = useNavigate();
  const [isAddingMilestone, setIsAddingMilestone] = useState(false);
  const [newMilestoneTitle, setNewMilestoneTitle] = useState('');
  const [newMilestoneDate, setNewMilestoneDate] = useState('');
  const [isSubmittingMilestone, setIsSubmittingMilestone] = useState(false);

  // Milestone statistics
  const milestones = goal.milestones || [];
  const doneCount = milestones.filter((m) => m.completed).length;
  const totalCount = milestones.length;

  // Deadline calculation
  const targetDateObj = new Date(goal.targetDate);
  const isValidDate = Boolean(goal.targetDate) && !isNaN(targetDateObj.getTime());
  targetDateObj.setHours(0, 0, 0, 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diffDays = isValidDate
    ? Math.ceil((targetDateObj.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Linked habits
  const linkedHabits = habits.filter((h) => h.goalId === goal.id);

  // Linked tasks (for project workspace, subject, or directly assigned goalId)
  const linkedTasks = tasks.filter(
    (t) => (t.goalId === goal.id || (goal.subjectId && t.subjectId === goal.subjectId)) && t.status !== 'completed'
  );

  // Exam Readiness (if exam mode)
  const examReadiness = goal.experienceType === 'exam'
    ? calculateExamReadiness({
        goal,
        topics: goal.subjectId ? topics.filter((t) => t.subjectId === goal.subjectId) : [],
        flashcards: goal.subjectId ? flashcards.filter((c) => c.subjectId === goal.subjectId) : [],
        habits
      })
    : null;

  const handleAddMilestoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMilestoneTitle.trim() || isSubmittingMilestone) return;

    setIsSubmittingMilestone(true);
    try {
      await onAddMilestone(goal.id, newMilestoneTitle.trim(), newMilestoneDate || undefined);
      setNewMilestoneTitle('');
      setNewMilestoneDate('');
      setIsAddingMilestone(false);
    } finally {
      setIsSubmittingMilestone(false);
    }
  };

  return (
    <div
      id={`goal-card-${goal.id}`}
      className={`solis-goal-card ${goal.status === 'completed' ? 'solis-goal-card--completed' : ''}`}
    >
      {/* 1. Header Section */}
      <div className="solis-goal-card__header">
        <div className="solis-goal-card__meta">
          {/* Experience Badge */}
          {goal.experienceType === 'exam' ? (
            <Badge variant="coral" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <GraduationCap size={13} />
              <span>Exam Workspace</span>
            </Badge>
          ) : goal.experienceType === 'project' ? (
            <Badge variant="amber" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <FolderGit2 size={13} />
              <span>Project Workspace</span>
            </Badge>
          ) : (
            <Badge variant="neutral" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
              <Target size={13} />
              <span>Standard Horizon</span>
            </Badge>
          )}

          {/* Horizon & Category */}
          <Badge variant="neutral">{goal.horizon.replace('_', ' ')}</Badge>
          <Badge variant="neutral">{goal.category}</Badge>
          {goal.subjectName && <Badge variant="neutral">{goal.subjectName}</Badge>}

          {/* Priority */}
          <Badge
            variant={
              goal.priority === 'urgent'
                ? 'coral'
                : goal.priority === 'high'
                ? 'amber'
                : 'neutral'
            }
          >
            {goal.priority}
          </Badge>

          {/* Status */}
          {goal.status === 'completed' && <Badge variant="sage">Completed</Badge>}
          {goal.status === 'paused' && <Badge variant="neutral">Paused</Badge>}
        </div>

        {/* Deadline & Quick Card Actions */}
        <div className="solis-goal-card__header-right">
          <div className="solis-goal-card__deadline-pill">
            <Clock size={13} />
            <span>{isValidDate ? goal.targetDate : 'No target date'}</span>
            {isValidDate && diffDays !== null && goal.status !== 'completed' && (
              <span
                className={`solis-goal-card__countdown-tag ${
                  diffDays < 0
                    ? 'solis-goal-card__countdown-tag--overdue'
                    : diffDays <= 7
                    ? 'solis-goal-card__countdown-tag--urgent'
                    : ''
                }`}
              >
                {diffDays === 0
                  ? 'Due Today'
                  : diffDays < 0
                  ? `${Math.abs(diffDays)}d overdue`
                  : `${diffDays}d left`}
              </span>
            )}
          </div>

          <div className="solis-goal-card__actions">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onOpenEdit(goal)}
              aria-label="Edit goal horizon"
              title="Edit goal details"
            >
              <Edit2 size={14} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onConfirmDelete(goal.id)}
              aria-label="Delete goal horizon"
              title="Delete goal"
              style={{ color: 'var(--status-error)' }}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        </div>
      </div>

      {/* 2. Main Title & Description */}
      <div className="solis-goal-card__body">
        <h3 className="solis-goal-card__title">{goal.title}</h3>
        {goal.description && <p className="solis-goal-card__desc">{goal.description}</p>}

        {/* Specialized Exam Workspace Strip */}
        {goal.experienceType === 'exam' && (
          <div className="solis-goal-card__exam-strip">
            <div className="solis-goal-card__exam-info">
              {goal.targetScore && (
                <span className="solis-goal-card__exam-pill">
                  Target: <strong>{goal.targetScore}</strong>
                </span>
              )}
              {goal.examWeight && (
                <span className="solis-goal-card__exam-pill">
                  Weight: <strong>{goal.examWeight}%</strong> of course
                </span>
              )}

              {/* Exam Readiness Preview Pill */}
              {examReadiness && (
                <button
                  type="button"
                  onClick={() => onOpenExamWorkspace(goal)}
                  className={`solis-goal-card__readiness-btn solis-goal-card__readiness-btn--${examReadiness.gradeColor}`}
                  title="Deterministic readiness based on topics, flashcards, and habits"
                >
                  <span>Readiness:</span>
                  <strong>{examReadiness.readinessScore}%</strong>
                  <span>• {examReadiness.grade}</span>
                </button>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<GraduationCap size={14} />}
              onClick={() => onOpenExamWorkspace(goal)}
            >
              Open Exam Command Workspace →
            </Button>
          </div>
        )}

        {/* Specialized Project Workspace Strip */}
        {goal.experienceType === 'project' && (
          <div className="solis-goal-card__project-strip">
            <div className="solis-goal-card__project-info">
              {goal.projectRepositoryUrl && (
                <a
                  href={goal.projectRepositoryUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="solis-goal-card__repo-link"
                >
                  <ExternalLink size={13} />
                  <span>Repository / Specs</span>
                </a>
              )}

              {goal.deliverables && goal.deliverables.length > 0 && (
                <span className="solis-goal-card__deliverables-count">
                  <ListTodo size={13} />
                  <span>{goal.deliverables.length} Deliverables</span>
                </span>
              )}

              {linkedTasks.length > 0 && (
                <span className="solis-goal-card__deliverables-count">
                  <span>{linkedTasks.length} Active Tasks</span>
                </span>
              )}
            </div>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<FolderGit2 size={14} />}
              onClick={() => onOpenProjectWorkspace(goal)}
            >
              Open Project Engineering Workspace →
            </Button>
          </div>
        )}

        {/* Linked Daily Consistency Rituals (Habits) */}
        {linkedHabits.length > 0 && (
          <div className="solis-goal-card__habits-row">
            <span className="solis-goal-card__habits-label">Linked Daily Rituals:</span>
            <div className="solis-goal-card__habits-list">
              {linkedHabits.map((h) => (
                <div key={h.id} className="solis-goal-card__habit-pill">
                  <Flame size={13} color="var(--color-coral-500)" />
                  <span>{h.title}</span>
                  <Badge variant="coral" style={{ fontSize: '10px', padding: '1px 5px' }}>
                    {h.currentStreak}d streak
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Linked Active Tasks */}
        {linkedTasks.length > 0 && (
          <div className="solis-goal-card__habits-row" style={{ marginTop: 'var(--space-2)' }}>
            <span className="solis-goal-card__habits-label">Linked Active Tasks:</span>
            <div className="solis-goal-card__habits-list">
              {linkedTasks.slice(0, 4).map((t) => (
                <div
                  key={t.id}
                  className="solis-goal-card__habit-pill"
                  style={{ cursor: 'pointer' }}
                  onClick={() => navigate(`/app/tasks?search=${encodeURIComponent(t.title)}`)}
                  title="Click to view task"
                >
                  <ListTodo size={13} color="var(--color-brand-primary, #6366f1)" />
                  <span>{t.title}</span>
                  {t.priority === 'urgent' && (
                    <Badge variant="coral" style={{ fontSize: '10px', padding: '1px 5px' }}>
                      urgent
                    </Badge>
                  )}
                </div>
              ))}
              {linkedTasks.length > 4 && (
                <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--text-tertiary)', alignSelf: 'center' }}>
                  +{linkedTasks.length - 4} more
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3. Progress Bar */}
      <div className="solis-goal-card__progress-section">
        <Progress
          value={goal.progressPercentage}
          variant={goal.experienceType === 'exam' ? 'coral' : goal.experienceType === 'project' ? 'amber' : 'momentum'}
          showValueText
          label={`Milestones Completed: ${doneCount} of ${totalCount}`}
        />
      </div>

      {/* 4. Milestones Checklist */}
      <div className="solis-goal-card__milestones-section">
        <div className="solis-goal-card__milestones-header">
          <span className="solis-goal-card__milestones-label">
            Milestones Roadmap ({doneCount}/{totalCount})
          </span>
          {!isAddingMilestone && (
            <button
              type="button"
              onClick={() => setIsAddingMilestone(true)}
              className="solis-goal-card__add-milestone-trigger"
            >
              <Plus size={13} />
              <span>Add Step</span>
            </button>
          )}
        </div>

        {/* Milestone Grid */}
        {goal.milestones.length > 0 ? (
          <div className="solis-goal-card__milestone-grid">
            {milestones.map((m) => {
              const isOverdue = !m.completed && Boolean(m.targetDate) && !isNaN(new Date(m.targetDate).getTime()) && new Date(m.targetDate) < today;

              return (
                <div
                  key={m.id}
                  className={`solis-goal-card__milestone-item ${
                    m.completed ? 'solis-goal-card__milestone-item--completed' : ''
                  }`}
                >
                  <button
                    type="button"
                    onClick={() => onToggleMilestone(goal.id, m.id)}
                    className="solis-goal-card__milestone-toggle"
                    aria-label={`Toggle milestone ${m.title}`}
                  >
                    {m.completed ? (
                      <CheckCircle2 size={16} className="solis-goal-card__milestone-icon--done" />
                    ) : (
                      <Circle size={16} className="solis-goal-card__milestone-icon--todo" />
                    )}
                    <span className="solis-goal-card__milestone-text">{m.title}</span>
                  </button>

                  {m.targetDate && (
                    <span
                      className={`solis-goal-card__milestone-date ${
                        isOverdue ? 'solis-goal-card__milestone-date--overdue' : ''
                      }`}
                      title={isOverdue ? 'Milestone target date is in the past' : undefined}
                    >
                      {isOverdue && <AlertTriangle size={11} style={{ marginRight: '3px' }} />}
                      {m.targetDate}
                    </span>
                  )}

                  <button
                    type="button"
                    onClick={() => onDeleteMilestone(goal.id, m.id)}
                    className="solis-goal-card__milestone-delete"
                    title="Remove milestone"
                    aria-label="Remove milestone"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="solis-goal-card__milestones-empty">
            No milestones added yet. Break down this horizon into concrete checkpoints.
          </div>
        )}

        {/* Inline Add Milestone Form */}
        {isAddingMilestone && (
          <form onSubmit={handleAddMilestoneSubmit} className="solis-goal-card__inline-form">
            <input
              type="text"
              placeholder="Milestone title..."
              value={newMilestoneTitle}
              onChange={(e) => setNewMilestoneTitle(e.target.value)}
              className="solis-goal-card__inline-input"
              autoFocus
              required
            />
            <input
              type="date"
              value={newMilestoneDate}
              onChange={(e) => setNewMilestoneDate(e.target.value)}
              className="solis-goal-card__inline-date"
              title="Milestone target date (optional)"
            />
            <Button
              variant="accent"
              size="sm"
              type="submit"
              isLoading={isSubmittingMilestone}
              leftIcon={<Plus size={13} />}
            >
              Add
            </Button>
            <Button
              variant="ghost"
              size="sm"
              type="button"
              onClick={() => {
                setIsAddingMilestone(false);
                setNewMilestoneTitle('');
                setNewMilestoneDate('');
              }}
            >
              Cancel
            </Button>
          </form>
        )}
      </div>

      {/* 5. Footer CTA Bar */}
      <div className="solis-goal-card__footer">
        <div className="solis-goal-card__footer-left">
          <Button
            variant="accent"
            size="sm"
            leftIcon={<Play size={13} />}
            onClick={() =>
              onLaunchFocus(
                goal.subjectId,
                `Horizon Sprint: ${goal.title}`
              )
            }
          >
            Launch Focus Sprint
          </Button>

          <Button
            variant="ghost"
            size="sm"
            leftIcon={<Plus size={13} />}
            onClick={() => navigate(`/app/tasks?action=new&goalId=${goal.id}`)}
            title="Create task linked to this goal"
          >
            + Task
          </Button>

          {goal.experienceType === 'exam' && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<GraduationCap size={13} />}
              onClick={() => onOpenExamWorkspace(goal)}
            >
              Command Workspace
            </Button>
          )}

          {goal.experienceType === 'project' && (
            <Button
              variant="secondary"
              size="sm"
              leftIcon={<FolderGit2 size={13} />}
              onClick={() => onOpenProjectWorkspace(goal)}
            >
              Engineering Workspace
            </Button>
          )}
        </div>

        <div className="solis-goal-card__footer-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onToggleStatus(goal)}
            leftIcon={goal.status === 'completed' ? <RotateCcw size={13} /> : <Check size={13} />}
          >
            {goal.status === 'completed' ? 'Reactivate Horizon' : 'Mark Completed'}
          </Button>
        </div>
      </div>
    </div>
  );
};
