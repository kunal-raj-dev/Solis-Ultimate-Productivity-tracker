import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Plus,
  Target,
  Sparkles,
  FilterX
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { SectionHeader } from '../../components/layout/SectionHeader/SectionHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Card } from '../../components/ui/Card/Card';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { Modal } from '../../components/feedback/Modal/Modal';
import { EmptyState } from '../../components/feedback/EmptyState/EmptyState';
import { ExamWorkspaceModal } from '../../components/features/Goals/ExamWorkspaceModal';
import { ProjectWorkspaceModal } from '../../components/features/Goals/ProjectWorkspaceModal';
import { GoalHeaderStats } from './components/GoalHeaderStats';
import { GoalFilterBar, SortOption } from './components/GoalFilterBar';
import { GoalCard } from './components/GoalCard';
import { GoalModal } from './components/GoalModal';
import { useToast } from '../../context/ToastContext';
import { useGuide } from '../../context/GuideContext';
import { dataService } from '../../services/dataService';
import { Goal, GoalHorizon, GoalExperienceType, GoalStatus } from '../../types/goal';
import { StudySubject, StudyTopic } from '../../types/study';
import { Flashcard } from '../../types/learning';
import { Task } from '../../types/task';
import { StudyResource } from '../../types/resource';
import { Habit } from '../../types/habit';
import './GoalsPage.css';

export const GoalsPage: React.FC = () => {
  const { addToast } = useToast();
  const { openGuide } = useGuide();
  const navigate = useNavigate();

  // Core Data State
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

  // Filter & Sort State
  const [selectedHorizon, setSelectedHorizon] = useState<GoalHorizon | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExpType, setSelectedExpType] = useState<GoalExperienceType | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<GoalStatus | 'all'>('active');
  const [sortBy, setSortBy] = useState<SortOption>('date_asc');

  // Modals State
  const [isGoalModalOpen, setIsGoalModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deletingGoalId, setDeletingGoalId] = useState<string | null>(null);
  const [selectedExamGoal, setSelectedExamGoal] = useState<Goal | null>(null);
  const [selectedProjectGoal, setSelectedProjectGoal] = useState<Goal | null>(null);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  // Active subjects only for goal linkages
  const activeSubjects = useMemo(() => subjects.filter((s) => s.status !== 'archived'), [subjects]);

  const loadGoals = useCallback(async (isInitial = false) => {
    if (isInitial) setInitialLoadStatus('loading');
    else setSyncStatus('syncing');

    try {
      const [goalsRes, subsRes, tasksRes, cardsRes, resourcesRes, habitsRes] = await Promise.allSettled([
        dataService.goals.getGoals(),
        dataService.study.getSubjects(),
        dataService.tasks.getTasks(),
        dataService.flashcards ? dataService.flashcards.getFlashcards() : Promise.resolve([]),
        dataService.resources ? dataService.resources.getResources() : Promise.resolve([]),
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
          const topicArrays = await Promise.all(
            subsRes.value.map((s) => dataService.study.getTopics(s.id).catch(() => []))
          );
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
    // Plan §6.1 scoped entity pub/sub: this page renders goals plus
    // subjects/tasks/habits context; flashcards and resources broadcast on
    // 'all' and still reach it.
    const unsubscribe = dataService.subscribe(() => {
      loadGoals(false);
    }, ['goals', 'study', 'tasks', 'habits']);
    return () => unsubscribe();
  }, [loadGoals]);

  const handleRetry = async () => {
    setIsRetrying(true);
    await loadGoals(goals.length === 0);
    setIsRetrying(false);
  };

  const openCreateModal = () => {
    setEditingGoal(null);
    setIsGoalModalOpen(true);
  };

  const openEditModal = (g: Goal) => {
    setEditingGoal(g);
    setIsGoalModalOpen(true);
  };

  const handleSaveGoal = async (goalData: Partial<Goal>) => {
    const prevGoals = goals;
    try {
      if (editingGoal) {
        const updated = await dataService.goals.updateGoal(editingGoal.id, goalData);
        setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
        addToast({ title: 'Goal Horizon Updated', description: updated.title, type: 'success' });
      } else {
        const created = await dataService.goals.createGoal(goalData);
        setGoals((prev) => [...prev, created]);
        addToast({ title: 'Goal Horizon Established', description: created.title, type: 'success' });
      }
    } catch (err) {
      setGoals(prevGoals);
      throw err;
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

  const handleAddMilestone = async (goalId: string, title: string, targetDate?: string) => {
    const prevGoals = goals;
    try {
      const updated = await dataService.goals.addMilestone(goalId, { title, targetDate });
      setGoals((prev) => prev.map((g) => (g.id === goalId ? updated : g)));
      addToast({ title: 'Milestone Added', description: title, type: 'success' });
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
      addToast({ title: 'Milestone removed', type: 'info' });
    } catch {
      setGoals(prevGoals);
      addToast({ title: 'Could not remove milestone', type: 'error' });
    }
  };

  const handleToggleStatus = async (goal: Goal) => {
    const newStatus: GoalStatus = goal.status === 'completed' ? 'active' : 'completed';
    const prevGoals = goals;
    try {
      const updated = await dataService.goals.updateGoal(goal.id, { status: newStatus });
      setGoals((prev) => prev.map((g) => (g.id === updated.id ? updated : g)));
      addToast({
        title: newStatus === 'completed' ? 'Horizon Completed!' : 'Horizon Reactivated',
        description: goal.title,
        type: 'success'
      });
    } catch {
      setGoals(prevGoals);
      addToast({ title: 'Failed to update status', type: 'error' });
    }
  };

  const handleLaunchFocus = (subjectId?: string, title?: string) => {
    navigate(
      `/app/focus?subjectId=${subjectId || ''}&title=${encodeURIComponent(title || 'Horizon Focus')}`
    );
  };

  const handleScrollToGoal = (goalId: string) => {
    const el = document.getElementById(`goal-card-${goalId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.style.transition = 'box-shadow 0.3s ease';
      el.style.boxShadow = '0 0 0 3px var(--color-coral-500)';
      setTimeout(() => {
        el.style.boxShadow = '';
      }, 1500);
    }
  };

  const handleResetFilters = () => {
    setSelectedHorizon('all');
    setSelectedExpType('all');
    setSelectedCategory('all');
    setSelectedStatus('active');
    setSearchQuery('');
    setSortBy('date_asc');
  };

  // Filter & Sort Logic
  const filteredGoals = useMemo(() => {
    return goals
      .filter((g) => {
        // Horizon filter
        if (selectedHorizon !== 'all' && g.horizon !== selectedHorizon) return false;

        // Experience mode filter
        if (selectedExpType !== 'all') {
          const type = g.experienceType || 'standard';
          if (type !== selectedExpType) return false;
        }

        // Category filter
        if (selectedCategory !== 'all' && g.category !== selectedCategory) return false;

        // Status filter
        if (selectedStatus !== 'all' && g.status !== selectedStatus) return false;

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase().trim();
          const matchTitle = g.title.toLowerCase().includes(q);
          const matchDesc = g.description?.toLowerCase().includes(q);
          const matchSubject = g.subjectName?.toLowerCase().includes(q);
          const matchDeliverables = g.deliverables?.some((d) => d.toLowerCase().includes(q));
          if (!matchTitle && !matchDesc && !matchSubject && !matchDeliverables) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'date_asc') {
          return new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime();
        }
        if (sortBy === 'priority_desc') {
          const rank: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
          return (rank[b.priority] || 0) - (rank[a.priority] || 0);
        }
        if (sortBy === 'progress_desc') {
          return b.progressPercentage - a.progressPercentage;
        }
        if (sortBy === 'progress_asc') {
          return a.progressPercentage - b.progressPercentage;
        }
        if (sortBy === 'title_asc') {
          return a.title.localeCompare(b.title);
        }
        return 0;
      });
  }, [goals, selectedHorizon, selectedExpType, selectedCategory, selectedStatus, searchQuery, sortBy]);

  return (
    <div>
      {/* 1. Header with CTA */}
      <SectionHeader
        tag={<Badge variant="lavender">Study Targets</Badge>}
        title="Goals & Targets"
        subtitle="Set exam targets, projects, and long-term study goals."
        guideId="goal-horizons"
        onOpenGuide={openGuide}
        actions={
          <Button variant="accent" size="md" leftIcon={<Plus size={16} />} onClick={openCreateModal}>
            New Horizon
          </Button>
        }
      />

      {/* 2. Offline / Server Sync Warning */}
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
            <span>Couldn't sync latest goals with server. Displaying cached version.</span>
          </div>
          <Button variant="outline" size="sm" onClick={handleRetry} isLoading={isRetrying}>
            Retry Sync
          </Button>
        </div>
      )}

      {/* 3. Loading, Error, or Main Content */}
      {initialLoadStatus === 'loading' && goals.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <Skeleton height="120px" />
          <Skeleton height="240px" />
          <Skeleton height="240px" />
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
          illustration="observatory"
          icon={Target}
          title="No long-term goal horizons set"
          description="Define clear exam, project, or long-term horizons to anchor and direct your daily focus sessions."
          actionLabel="Create Goal Horizon"
          onAction={openCreateModal}
        />
      ) : (
        <>
          {/* 4. Strategic Executive Overview */}
          <GoalHeaderStats
            goals={goals}
            onLaunchFocus={handleLaunchFocus}
            onScrollToGoal={handleScrollToGoal}
          />

          {/* 5. Filter & Sort Bar */}
          <GoalFilterBar
            goals={goals}
            selectedHorizon={selectedHorizon}
            onSelectHorizon={setSelectedHorizon}
            searchQuery={searchQuery}
            onSearchChange={setSearchQuery}
            selectedExpType={selectedExpType}
            onSelectExpType={setSelectedExpType}
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
            selectedStatus={selectedStatus}
            onSelectStatus={setSelectedStatus}
            sortBy={sortBy}
            onSortChange={setSortBy}
            onResetFilters={handleResetFilters}
          />

          {/* 6. Goals Cards List */}
          {filteredGoals.length === 0 ? (
            <Card style={{ textAlign: 'center', padding: '40px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
              <FilterX size={32} color="var(--text-muted)" />
              <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>
                No goal horizons match the current filters.
              </div>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: 0 }}>
                Try adjusting your search query, horizon tabs, or status filters.
              </p>
              <Button variant="secondary" size="sm" onClick={handleResetFilters}>
                Clear All Filters
              </Button>
            </Card>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
              {filteredGoals.map((goal) => (
                <GoalCard
                  key={goal.id}
                  goal={goal}
                  topics={topics}
                  flashcards={flashcards}
                  tasks={tasks}
                  habits={habits}
                  onOpenEdit={openEditModal}
                  onConfirmDelete={(id) => setDeletingGoalId(id)}
                  onToggleMilestone={handleToggleMilestone}
                  onAddMilestone={handleAddMilestone}
                  onDeleteMilestone={handleDeleteMilestone}
                  onOpenExamWorkspace={(g) => {
                    setSelectedExamGoal(g);
                    setIsExamModalOpen(true);
                  }}
                  onOpenProjectWorkspace={(g) => {
                    setSelectedProjectGoal(g);
                    setIsProjectModalOpen(true);
                  }}
                  onLaunchFocus={handleLaunchFocus}
                  onToggleStatus={handleToggleStatus}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/* 7. Create / Edit Goal Modal */}
      <GoalModal
        isOpen={isGoalModalOpen}
        onClose={() => {
          setIsGoalModalOpen(false);
          setEditingGoal(null);
        }}
        editingGoal={editingGoal}
        activeSubjects={activeSubjects}
        onSave={handleSaveGoal}
      />

      {/* 8. Delete Confirmation Modal */}
      <Modal
        isOpen={deletingGoalId !== null}
        onClose={() => setDeletingGoalId(null)}
        title="Delete Goal Horizon"
      >
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Are you sure you want to delete this goal horizon and its milestones? This action cannot be undone.
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

      {/* 9. Exam Command Workspace Modal */}
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
          handleLaunchFocus(subjectId, title);
        }}
      />

      {/* 10. Project Engineering Workspace Modal */}
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
          handleLaunchFocus(subjectId, title);
        }}
      />
    </div>
  );
};
