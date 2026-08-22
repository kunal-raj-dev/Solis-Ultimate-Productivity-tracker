import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Target,
  CheckCircle2,
  Circle,
  Trash2,
  Edit2,
  Sparkles,
  X,
  GraduationCap,
  FolderGit2
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../../components/layout/SectionHeader/SectionHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Card } from '../../components/ui/Card/Card';
import { Progress } from '../../components/ui/Progress/Progress';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { Modal } from '../../components/feedback/Modal/Modal';
import { Input } from '../../components/ui/Input/Input';
import { CustomSelect } from '../../components/ui/Select/CustomSelect';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { EmptyState } from '../../components/feedback/EmptyState/EmptyState';
import { ExamWorkspaceModal } from '../../components/features/Goals/ExamWorkspaceModal';
import { ProjectWorkspaceModal } from '../../components/features/Goals/ProjectWorkspaceModal';
import { useToast } from '../../context/ToastContext';
import { useGuide } from '../../context/GuideContext';
import { dataService } from '../../services/dataService';
import { Goal, GoalHorizon, GoalExperienceType } from '../../types/goal';
import { StudySubject, StudyTopic } from '../../types/study';
import { Flashcard } from '../../types/learning';
import { Task } from '../../types/task';
import { StudyResource } from '../../types/resource';
import { Habit } from '../../types/habit';
import { PriorityLevel } from '../../types/common';
import { ValidationError } from '../../utils/validation';
import './GoalsPage.css';

export const GoalsPage: React.FC = () => {
  const { addToast } = useToast();
  const { openGuide } = useGuide();
  const navigate = useNavigate();

  const [goals, setGoals] = useState<Goal[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [topics, setTopics] = useState<StudyTopic[]>([]);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [resources, setResources] = useState<StudyResource[]>([]);
  const [habits, setHabits] = useState<Habit[]>([]);
  const [initialLoadStatus, setInitialLoadStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'error'>('idle');
  const [isRetrying, setIsRetrying] = useState(false);

  // Active subjects only for goal linkages
  const activeSubjects = useMemo(() => subjects.filter((s) => s.status !== 'archived'), [subjects]);

  // Modals
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [selectedExamGoal, setSelectedExamGoal] = useState<Goal | null>(null);
  const [selectedProjectGoal, setSelectedProjectGoal] = useState<Goal | null>(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Form State
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDesc, setGoalDesc] = useState('');
  const [goalExpType, setGoalExpType] = useState<GoalExperienceType>('standard');
  const [goalSubjectId, setGoalSubjectId] = useState('');
  const [goalHorizon, setGoalHorizon] = useState<GoalHorizon>('medium_term');
  const [goalCat, setGoalCat] = useState<'academic' | 'career' | 'skill' | 'personal'>('academic');
  const [goalTargetDate, setGoalTargetDate] = useState('2026-12-31');
  const [goalPriority, setGoalPriority] = useState<PriorityLevel>('high');
  const [goalTargetScore, setGoalTargetScore] = useState('95%');
  const [goalExamWeight, setGoalExamWeight] = useState('40');
  const [goalRepoUrl, setGoalRepoUrl] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  // Inline milestone inputs per goal
  const [newMilestoneTitles, setNewMilestoneTitles] = useState<Record<string, string>>({});

  const loadGoals = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoadStatus('loading');
    else setSyncStatus('syncing');

    try {
      const [goalsRes, subsRes, tasksRes, cardsRes, resourcesRes, habitsRes] = await Promise.allSettled([
        dataService.goals.getGoals(),
        dataService.study.getSubjects(),
        dataService.tasks.getTasks(),
        dataService.flashcards ? dataService.flashcards.getFlashcards() : Promise.resolve([]),
        dataService.resources ? dataService.resources.getResources() : Promise.resolve([]) ,
        dataService.habits ? dataService.habits.getHabits() : Promise.resolve([])
      ]);

      if (goalsRes.status === 'fulfilled') {
        setGoals(goalsRes.value);
        setInitialLoadStatus('success');
        setSyncStatus('idle');
      } else {
        console.error('Primary goals load failed:', goalsRes.reason);
        throw goalsRes.reason;
      }

      if (subsRes.status === 'fulfilled') {
        setSubjects(subsRes.value);
        try {
          const topicArrays = await Promise.all(subsRes.value.map((s) => dataService.study.getTopics(s.id).catch(() => [])));
          setTopics(topicArrays.flat());
        } catch {
          // secondary topics
        }
      }

      if (tasksRes.status === 'fulfilled') setTasks(tasksRes.value);
      if (cardsRes.status === 'fulfilled') setFlashcards(cardsRes.value);
      if (resourcesRes.status === 'fulfilled') setResources(resourcesRes.value);
      if (habitsRes.status === 'fulfilled') setHabits(habitsRes.value);

    } catch (err) {
      console.error('Failed to load goals data:', err);
      setGoals((current) => {
        if (current.length === 0) setInitialLoadStatus('error');
        else setSyncStatus('error');
        return current;
      });
    }
  }, []);

  useEffect(() => {
    loadGoals(true);
    const unsubscribe = dataService.subscribe(() => {
      loadGoals(false);
    });
    return () => unsubscribe();
  }, [loadGoals]);

  const handleRetry = async () => {
    setIsRetrying(true);
    await loadGoals(goals.length === 0);
    setIsRetrying(false);
  };

  const openCreateModal = () => {
    setGoalTitle('');
    setGoalDesc('');
    setGoalExpType('standard');
    setGoalSubjectId(activeSubjects[0]?.id || '');
    setGoalHorizon('medium_term');
    setGoalCat('academic');
    setGoalTargetDate('2026-12-31');
    setGoalPriority('high');
    setGoalTargetScore('95%');
    setGoalExamWeight('40');
    setGoalRepoUrl('');
    setFormError(null);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (g: Goal) => {
    setEditingGoal(g);
    setGoalTitle(g.title);
    setGoalDesc(g.description || '');
    setGoalExpType(g.experienceType || 'standard');
    setGoalSubjectId(g.subjectId || (activeSubjects[0]?.id ?? ''));
    setGoalHorizon(g.horizon);
    setGoalCat(g.category);
    setGoalTargetDate(g.targetDate);
    setGoalPriority(g.priority);
    setGoalTargetScore(g.targetScore || '95%');
    setGoalExamWeight(String(g.examWeight || '40'));
    setGoalRepoUrl(g.projectRepositoryUrl || '');
    setFormError(null);
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    const prevGoals = goals;

    try {
      if (editingGoal) {
        const updated = await dataService.goals.updateGoal(editingGoal.id, {
          title: goalTitle,
          description: goalDesc,
          experienceType: goalExpType,
          subjectId: goalSubjectId || undefined,
          horizon: goalHorizon,
          category: goalCat,
          targetDate: goalTargetDate,
          priority: goalPriority,
          targetScore: goalExpType === 'exam' ? goalTargetScore : undefined,
          examWeight: goalExpType === 'exam' ? parseInt(goalExamWeight, 10) || 40 : undefined,
          projectRepositoryUrl: goalExpType === 'project' ? goalRepoUrl : undefined
        });
        setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        setEditingGoal(null);
        addToast({ title: 'Goal Horizon Updated', description: updated.title, type: 'success' });
      } else {
        const created = await dataService.goals.createGoal({
          title: goalTitle,
          description: goalDesc,
          experienceType: goalExpType,
          subjectId: goalSubjectId || undefined,
          horizon: goalHorizon,
          category: goalCat,
          targetDate: goalTargetDate,
          priority: goalPriority,
          color: goalExpType === 'exam' ? 'coral' : goalExpType === 'project' ? 'amber' : 'sage',
          targetScore: goalExpType === 'exam' ? goalTargetScore : undefined,
          examWeight: goalExpType === 'exam' ? parseInt(goalExamWeight, 10) || 40 : undefined,
          projectRepositoryUrl: goalExpType === 'project' ? goalRepoUrl : undefined,
          milestones: []
        });
        setGoals((prev) => [...prev, created]);
        setIsCreateModalOpen(false);
        addToast({ title: 'Goal Horizon Established', description: created.title, type: 'success' });
      }
    } catch (err) {
      setGoals(prevGoals);
      if (err instanceof ValidationError) setFormError(err.message);
      else setFormError(err instanceof Error ? err.message : 'Error saving goal');
    }
  };

  const handleDeleteGoal = async () => {
    if (!deletingGoalId) return;
    const prevGoals = goals;
    const id = deletingGoalId;
    setGoals((prev) => prev.filter((g) => g.id !== id));
    setDeletingGoalId(null);

    try {
      await dataService.goals.deleteGoal(id);
      addToast({ title: 'Goal Horizon Removed', type: 'info' });
    } catch {
      setGoals(prevGoals);
      addToast({ title: 'Could not delete goal', type: 'error' });
    }
  };

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    const prevGoals = goals;
    try {
      const updated = await dataService.goals.toggleMilestone(goalId, milestoneId);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
      addToast({
        title: 'Milestone Updated',
        description: `Goal progress: ${updated.progressPercentage}%`,
        type: 'success'
      });
    } catch {
      setGoals(prevGoals);
      addToast({ title: 'Could not toggle milestone', type: 'error' });
    }
  };

  const handleAddMilestone = async (goalId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = newMilestoneTitles[goalId]?.trim();
    if (!title) return;
    const prevGoals = goals;

    try {
      const updated = await dataService.goals.addMilestone(goalId, { title });
      setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
      setNewMilestoneTitles((prev) => ({ ...prev, [goalId]: '' }));
    } catch (err) {
      setGoals(prevGoals);
      addToast({
        title: 'Error adding milestone',
        description: err instanceof Error ? err.message : 'Invalid milestone',
        type: 'error'
      });
    }
  };

  const handleDeleteMilestone = async (goalId: string, milestoneId: string) => {
    const prevGoals = goals;
    try {
      const updated = await dataService.goals.deleteMilestone(goalId, milestoneId);
      setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
    } catch {
      setGoals(prevGoals);
      addToast({ title: 'Could not remove milestone', type: 'error' });
    }
  };

  return (
    <div>
      <SectionHeader
        tag={<Badge variant="lavender">Long-term Horizons</Badge>}
        title="Goal Horizons & Milestones"
        subtitle="Connect semester milestones and multi-year vision to daily actionable momentum."
        guideId="goal-horizons"
        onOpenGuide={openGuide}
        actions={
          <Button variant="accent" size="md" leftIcon={<Plus size={16} />} onClick={openCreateModal}>
            New Horizon
          </Button>
        }
      />

      {syncStatus === 'error' && goals.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 14px',
            backgroundColor: 'var(--status-warning-bg)',
            border: '1px solid var(--status-warning)',
            borderRadius: 'var(--radius-md)',
            marginBottom: 'var(--space-md)',
            fontSize: 'var(--text-caption)',
            color: 'var(--text-primary)',
            gap: '12px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Sparkles size={14} color="var(--color-amber-500)" />
            <span>Couldn't sync latest goals with server. Displaying last saved version.</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry} isLoading={isRetrying}>
            Retry Sync
          </Button>
        </div>
      )}

      {initialLoadStatus === 'loading' && goals.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Skeleton height="200px" />
          <Skeleton height="200px" />
        </div>
      ) : initialLoadStatus === 'error' && goals.length === 0 ? (
        <Card className="depth-1" style={{ textAlign: 'center', padding: '36px 16px' }}>
          <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>
            We couldn't load your goal horizons.
          </div>
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '14px' }}>
            A network or server connectivity error occurred.
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry} isLoading={isRetrying}>
            Retry
          </Button>
        </Card>
      ) : goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="No long-term goal horizons set"
          description="Define clear exam, project, or long-term horizons to anchor and direct your daily focus sessions."
          actionLabel="Create Goal Horizon"
          onAction={openCreateModal}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {goals.map((goal) => {
            const doneCount = goal.milestones.filter((m) => m.completed).length;
            const totalCount = goal.milestones.length;

            return (
              <Card key={goal.id}>
                {/* Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px' }}>
                  <div style={{ flex: 1, minWidth: '240px' }}>
                    <div style={{ display: 'flex', gap: '8px', marginBottom: '6px', alignItems: 'center', flexWrap: 'wrap' }}>
                      <Badge variant={goal.experienceType === 'exam' ? 'coral' : goal.experienceType === 'project' ? 'amber' : 'neutral'}>
                        {goal.experienceType === 'exam' ? 'Exam Workspace' : goal.experienceType === 'project' ? 'Project Workspace' : 'Goal'}
                      </Badge>
                      <Badge variant="neutral">{goal.category}</Badge>
                      <Badge variant="neutral">{goal.horizon.replace('_', ' ')}</Badge>
                      {goal.subjectName && <Badge variant="neutral">{goal.subjectName}</Badge>}
                      {goal.status === 'completed' && <Badge variant="sage">Completed</Badge>}
                    </div>

                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-2)', color: 'var(--text-primary)' }}>
                      {goal.title}
                    </h3>
                    {goal.description && (
                      <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                        {goal.description}
                      </p>
                    )}

                    {goal.experienceType === 'exam' && (
                      <div style={{ marginTop: '10px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<GraduationCap size={14} />}
                          onClick={() => {
                            setSelectedExamGoal(goal);
                            setIsExamModalOpen(true);
                          }}
                        >
                          Open Exam Command Workspace →
                        </Button>
                      </div>
                    )}

                    {goal.experienceType === 'project' && (
                      <div style={{ marginTop: '10px' }}>
                        <Button
                          variant="outline"
                          size="sm"
                          leftIcon={<FolderGit2 size={14} />}
                          onClick={() => {
                            setSelectedProjectGoal(goal);
                            setIsProjectModalOpen(true);
                          }}
                        >
                          Open Project Engineering Workspace →
                        </Button>
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>Target Deadline</div>
                      <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>{goal.targetDate}</div>
                    </div>

                    <div style={{ display: 'flex', gap: '4px' }}>
                      <Button variant="ghost" size="sm" onClick={() => openEditModal(goal)} aria-label="Edit goal">
                        <Edit2 size={14} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeletingGoalId(goal.id)}
                        aria-label="Delete goal"
                        style={{ color: 'var(--status-error)' }}
                      >
                        <Trash2 size={14} />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Progress */}
                <div style={{ margin: '18px 0 16px' }}>
                  <Progress
                    value={goal.progressPercentage}
                    variant="momentum"
                    showValueText
                    label={`Milestones Completed: ${doneCount} of ${totalCount}`}
                  />
                </div>

                {/* Milestones Manager */}
                <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
                  <h4 style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px' }}>
                    Milestones Checklist
                  </h4>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 240px), 1fr))', gap: '10px', marginBottom: '12px' }}>
                    {goal.milestones.map((m) => (
                      <div
                        key={m.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '8px 12px',
                          borderRadius: '6px',
                          backgroundColor: m.completed ? 'var(--status-success-bg)' : 'var(--bg-surface-secondary)',
                          border: '1px solid var(--border-subtle)'
                        }}
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleMilestone(goal.id, m.id)}
                          style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'none', border: 'none', textAlign: 'left', flex: 1 }}
                        >
                          {m.completed ? (
                            <CheckCircle2 size={16} color="var(--status-success)" />
                          ) : (
                            <Circle size={16} color="var(--text-muted)" />
                          )}
                          <span
                            style={{
                              fontSize: 'var(--text-caption)',
                              textDecoration: m.completed ? 'line-through' : 'none',
                              color: m.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                              fontWeight: 500
                            }}
                          >
                            {m.title}
                          </span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleDeleteMilestone(goal.id, m.id)}
                          style={{ color: 'var(--text-muted)', padding: '2px', background: 'none', border: 'none' }}
                          title="Remove milestone"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Add Milestone Form */}
                  <form onSubmit={(e) => handleAddMilestone(goal.id, e)} style={{ display: 'flex', gap: '8px', maxWidth: '420px' }}>
                    <Input
                      placeholder="Add milestone step..."
                      value={newMilestoneTitles[goal.id] || ''}
                      onChange={(e) => setNewMilestoneTitles((prev) => ({ ...prev, [goal.id]: e.target.value }))}
                    />
                    <Button variant="secondary" size="sm" type="submit" leftIcon={<Plus size={14} />}>
                      Add
                    </Button>
                  </form>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create / Edit Goal Modal */}
      <Modal
        isOpen={isCreateModalOpen || editingGoal !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingGoal(null);
        }}
        title={editingGoal ? 'Edit Goal Horizon' : 'Establish Goal Horizon'}
      >
        <form onSubmit={handleSaveGoal} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {formError && (
            <div style={{ color: 'var(--status-error)', fontSize: 'var(--text-caption)' }}>
              {formError}
            </div>
          )}

          <Input
            label="Goal Statement"
            placeholder="e.g. Master Distributed Systems Architecture & Capstone"
            value={goalTitle}
            onChange={(e) => setGoalTitle(e.target.value)}
            required
            autoFocus
          />

          <Textarea
            label="Vision / Objective"
            placeholder="Why this horizon matters to your intellectual momentum..."
            value={goalDesc}
            onChange={(e) => setGoalDesc(e.target.value)}
          />

          <div className="solis-goals-form-grid">
            <CustomSelect
              label="Goal Experience Mode"
              value={goalExpType}
              onChange={(val) => setGoalExpType(val as GoalExperienceType)}
              options={[
                { value: 'standard', label: 'Standard Milestone Goal' },
                { value: 'exam', label: 'Exam Preparation Command' },
                { value: 'project', label: 'Project Engineering Workspace' }
              ]}
            />

            {activeSubjects.length > 0 && (
              <CustomSelect
                label="Associated Study Subject"
                value={goalSubjectId}
                onChange={setGoalSubjectId}
                options={[
                  { value: '', label: 'General / No Subject' },
                  ...activeSubjects.map((s: StudySubject) => ({ value: s.id, label: s.name }))
                ]}
              />
            )}
          </div>

          {goalExpType === 'exam' && (
            <div className="solis-goals-form-grid--nested">
              <Input
                label="Target Exam Score / Grade"
                placeholder="e.g. 95% (Distinction)"
                value={goalTargetScore}
                onChange={(e) => setGoalTargetScore(e.target.value)}
              />
              <Input
                label="Exam Weight (% of Final Grade)"
                type="number"
                placeholder="e.g. 40"
                value={goalExamWeight}
                onChange={(e) => setGoalExamWeight(e.target.value)}
              />
            </div>
          )}

          {goalExpType === 'project' && (
            <div style={{ padding: '12px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
              <Input
                label="Project Repository / Research URL"
                placeholder="https://github.com/scholar/storage-engine"
                value={goalRepoUrl}
                onChange={(e) => setGoalRepoUrl(e.target.value)}
              />
            </div>
          )}

          <div className="solis-goals-form-grid">
            <CustomSelect
              label="Horizon Period"
              value={goalHorizon}
              onChange={(val) => setGoalHorizon(val as GoalHorizon)}
              options={[
                { value: 'short_term', label: 'Short-Term (1-3 months)' },
                { value: 'medium_term', label: 'Medium-Term (Semester)' },
                { value: 'long_term', label: 'Long-Term (1-2 years)' },
                { value: 'vision', label: 'Life Vision' }
              ]}
            />

            <CustomSelect
              label="Category"
              value={goalCat}
              onChange={(val) => setGoalCat(val as any)}
              options={[
                { value: 'academic', label: 'Academic & Courses' },
                { value: 'career', label: 'Career & Industry' },
                { value: 'skill', label: 'Cognitive Skill' },
                { value: 'personal', label: 'Personal Growth' }
              ]}
            />
          </div>

          <div className="solis-goals-form-grid">
            <Input
              label="Target Completion Date"
              type="date"
              value={goalTargetDate}
              onChange={(e) => setGoalTargetDate(e.target.value)}
              required
            />

            <CustomSelect
              label="Priority"
              value={goalPriority}
              onChange={(val) => setGoalPriority(val as PriorityLevel)}
              options={[
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingGoal(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="accent" type="submit" leftIcon={<Sparkles size={14} />}>
              {editingGoal ? 'Update Goal' : 'Establish Goal'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deletingGoalId !== null}
        onClose={() => setDeletingGoalId(null)}
        title="Delete Goal Horizon"
      >
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Are you sure you want to delete this goal horizon and its milestones?
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={() => setDeletingGoalId(null)}>
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={handleDeleteGoal}
            style={{ backgroundColor: 'var(--status-error)', color: '#FFFFFF' }}
          >
            Confirm Delete
          </Button>
        </div>
      </Modal>

      {/* Exam Command Workspace Modal */}
      <ExamWorkspaceModal
        isOpen={isExamModalOpen}
        onClose={() => {
          setIsExamModalOpen(false);
          setSelectedExamGoal(null);
        }}
        goal={selectedExamGoal}
        topics={topics}
        flashcards={flashcards}
        resources={resources}
        habits={habits}
        onToggleMilestone={async (goalId, milestoneId) => {
          const updatedGoal = await dataService.goals.toggleMilestone(goalId, milestoneId);
          setSelectedExamGoal(updatedGoal);
          setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
        }}
        onStartRecallDrill={() => {
          setIsExamModalOpen(false);
          navigate('/app/study');
        }}
        onLaunchFocus={(subjectId, title) => {
          setIsExamModalOpen(false);
          navigate(`/app/focus?subjectId=${subjectId || ''}&title=${encodeURIComponent(title || 'Exam Focus')}`);
        }}
      />

      {/* Project Engineering Workspace Modal */}
      <ProjectWorkspaceModal
        isOpen={isProjectModalOpen}
        onClose={() => {
          setIsProjectModalOpen(false);
          setSelectedProjectGoal(null);
        }}
        goal={selectedProjectGoal}
        tasks={tasks}
        resources={resources}
        habits={habits}
        onToggleMilestone={async (goalId, milestoneId) => {
          const updatedGoal = await dataService.goals.toggleMilestone(goalId, milestoneId);
          setSelectedProjectGoal(updatedGoal);
          setGoals((prev) => prev.map((g) => (g.id === updatedGoal.id ? updatedGoal : g)));
        }}
        onLaunchFocus={(subjectId, title) => {
          setIsProjectModalOpen(false);
          navigate(`/app/focus?subjectId=${subjectId || ''}&title=${encodeURIComponent(title || 'Project Sprint')}`);
        }}
      />
    </div>
  );
};
