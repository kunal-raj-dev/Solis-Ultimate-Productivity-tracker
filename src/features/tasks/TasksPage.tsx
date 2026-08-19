import React, { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  CheckCircle2,
  Search,
  ChevronDown,
  ChevronUp,
  Edit2,
  Trash2,
  Clock,
  Tag,
  AlertCircle,
  X,
  Sparkles
} from 'lucide-react';
import { SectionHeader } from '../../components/layout/SectionHeader/SectionHeader';
import { Button } from '../../components/ui/Button/Button';
import { Badge, BadgeVariant } from '../../components/ui/Badge/Badge';
import { Card } from '../../components/ui/Card/Card';
import { Checkbox } from '../../components/ui/Checkbox/Checkbox';
import { Input } from '../../components/ui/Input/Input';
import { CustomSelect } from '../../components/ui/Select/CustomSelect';
import { SegmentedControl } from '../../components/ui/SegmentedControl/SegmentedControl';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Progress } from '../../components/ui/Progress/Progress';
import { Modal } from '../../components/feedback/Modal/Modal';
import { EmptyState } from '../../components/feedback/EmptyState/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton/Skeleton';
import { useToast } from '../../context/ToastContext';
import { dataService } from '../../services/dataService';
import {
  Task,
  TaskCategory,
  TaskTimeFilter,
  TaskSortField
} from '../../types/task';
import { StudySubject } from '../../types/study';
import { PriorityLevel } from '../../types/common';
import { formatFriendlyDate, getISODateString } from '../../utils/date';
import { ValidationError } from '../../utils/validation';

export const TasksPage: React.FC = () => {
  const { addToast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [subjects, setSubjects] = useState<StudySubject[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedTaskIds, setExpandedTaskIds] = useState<Set<string>>(new Set());

  // Filter & Search State
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTimeFilter, setSelectedTimeFilter] = useState<TaskTimeFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<TaskSortField>('priority');

  // Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTaskId, setDeletingTaskId] = useState<string | null>(null);
  const [showMoreOptions, setShowMoreOptions] = useState(false);

  // Form State
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState<TaskCategory>('study');
  const [formPriority, setFormPriority] = useState<PriorityLevel>('medium');
  const [formSubjectId, setFormSubjectId] = useState<string>('');
  const [formDueDate, setFormDueDate] = useState(getISODateString(new Date()));
  const [formDueTime, setFormDueTime] = useState('18:00');
  const [formEstimatedMinutes, setFormEstimatedMinutes] = useState('30');
  const [formTags, setFormTags] = useState('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Inline subtask input per expanded task
  const [newSubtaskTitles, setNewSubtaskTitles] = useState<Record<string, string>>({});

  const loadTasks = useCallback(async () => {
    try {
      const [data, subList] = await Promise.all([
        dataService.tasks.getTasks({
          category: selectedCategory as any,
          timeFilter: selectedTimeFilter,
          search: searchQuery,
          sortBy
        }),
        dataService.study.getSubjects()
      ]);
      setTasks(data);
      setSubjects(subList);
    } catch (err) {
      console.error('Failed to load tasks:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, selectedTimeFilter, searchQuery, sortBy]);

  useEffect(() => {
    loadTasks();
    const unsubscribe = dataService.subscribe(() => {
      loadTasks();
    });
    return () => unsubscribe();
  }, [loadTasks]);

  const toggleAccordion = (id: string) => {
    setExpandedTaskIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleToggleTask = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      const updated = await dataService.tasks.toggleTaskCompletion(id);
      setTasks((prev) => prev.map((t) => (t.id === id ? updated : t)));
      addToast({
        title: updated.status === 'completed' ? 'Task Completed' : 'Task Reopened',
        description: updated.title,
        type: 'success'
      });
    } catch {
      addToast({ title: 'Could not toggle task', type: 'error' });
    }
  };

  const openCreateModal = () => {
    setEditingTask(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory('study');
    setFormPriority('medium');
    setFormSubjectId('');
    setFormDueDate(getISODateString(new Date()));
    setFormDueTime('18:00');
    setFormEstimatedMinutes('30');
    setFormTags('');
    setFormError(null);
    setShowMoreOptions(false);
    setIsCreateModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setEditingTask(task);
    setFormTitle(task.title);
    setFormDescription(task.description || '');
    setFormCategory(task.category);
    setFormPriority(task.priority);
    setFormSubjectId(task.subjectId || '');
    setFormDueDate(task.dueDate || getISODateString(new Date()));
    setFormDueTime(task.dueTime || '18:00');
    setFormEstimatedMinutes(String(task.estimatedMinutes || 30));
    setFormTags(task.tags.join(', '));
    setFormError(null);
    setShowMoreOptions(Boolean(task.description || task.tags.length > 0 || task.subjectId));
    setIsCreateModalOpen(true);
  };

  const handleSaveTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setIsSubmitting(true);

    const tagList = formTags
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);

    try {
      if (editingTask) {
        const updated = await dataService.tasks.updateTask(editingTask.id, {
          title: formTitle,
          description: formDescription,
          category: formCategory,
          priority: formPriority,
          subjectId: formSubjectId || undefined,
          dueDate: formDueDate,
          dueTime: formDueTime,
          estimatedMinutes: parseInt(formEstimatedMinutes, 10) || 30,
          tags: tagList
        });
        setTasks((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
        setEditingTask(null);
        setIsCreateModalOpen(false);
        addToast({ title: 'Task Updated', description: updated.title, type: 'success' });
      } else {
        const created = await dataService.tasks.createTask({
          title: formTitle,
          description: formDescription,
          category: formCategory,
          priority: formPriority,
          subjectId: formSubjectId || undefined,
          dueDate: formDueDate,
          dueTime: formDueTime,
          estimatedMinutes: parseInt(formEstimatedMinutes, 10) || 30,
          tags: tagList,
          subTasks: []
        });
        setTasks((prev) => [created, ...prev]);
        setIsCreateModalOpen(false);
        addToast({ title: 'Task Created', description: created.title, type: 'success' });
      }
    } catch (err) {
      if (err instanceof ValidationError) {
        setFormError(err.message);
      } else {
        setFormError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTask = async () => {
    if (!deletingTaskId) return;
    try {
      await dataService.tasks.deleteTask(deletingTaskId);
      setTasks((prev) => prev.filter((t) => t.id !== deletingTaskId));
      setDeletingTaskId(null);
      addToast({ title: 'Task Deleted', type: 'info' });
    } catch {
      addToast({ title: 'Could not delete task', type: 'error' });
    }
  };

  const handleAddSubtask = async (taskId: string, e: React.FormEvent) => {
    e.preventDefault();
    const title = newSubtaskTitles[taskId]?.trim();
    if (!title) return;

    try {
      await dataService.tasks.addSubTask(taskId, title);
      setNewSubtaskTitles((prev) => ({ ...prev, [taskId]: '' }));
    } catch (err) {
      addToast({
        title: 'Error adding subtask',
        description: err instanceof Error ? err.message : 'Invalid subtask',
        type: 'error'
      });
    }
  };

  const handleToggleSubtask = async (taskId: string, subId: string) => {
    try {
      await dataService.tasks.toggleSubTask(taskId, subId);
    } catch {
      addToast({ title: 'Error toggling subtask', type: 'error' });
    }
  };

  const handleDeleteSubtask = async (taskId: string, subId: string) => {
    try {
      await dataService.tasks.deleteSubTask(taskId, subId);
    } catch {
      addToast({ title: 'Error deleting subtask', type: 'error' });
    }
  };

  const timeFilters: { id: TaskTimeFilter; label: string }[] = [
    { id: 'all', label: 'All Tasks' },
    { id: 'today', label: 'Today' },
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'overdue', label: 'Overdue' },
    { id: 'completed', label: 'Completed' }
  ];

  const categories = [
    { id: 'all', label: 'All Domains' },
    { id: 'deep_work', label: 'Deep Work' },
    { id: 'study', label: 'Study' },
    { id: 'project', label: 'Projects' },
    { id: 'review', label: 'Review' }
  ];

  return (
    <div>
      <SectionHeader
        tag={<Badge variant="coral">Task Sanctuary</Badge>}
        title="Intentional Tasks"
        subtitle="Curate deliberate focus items with nested subtasks, priority ordering, and deterministic progress."
        actions={
          <Button
            variant="accent"
            size="md"
            leftIcon={<Plus size={16} />}
            onClick={openCreateModal}
          >
            New Task
          </Button>
        }
      />

      {/* Filter and Control Toolbar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: 'var(--space-xl)' }}>
        {/* Time Filters */}
        <div style={{ overflowX: 'auto', paddingBottom: '2px' }}>
          <SegmentedControl
            variant="contained"
            size="sm"
            value={selectedTimeFilter}
            onChange={(val) => setSelectedTimeFilter(val as TaskTimeFilter)}
            options={timeFilters.map((tf) => ({ value: tf.id, label: tf.label }))}
          />
        </div>

        {/* Category, Search & Sort Bar */}
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '12px',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <SegmentedControl
              variant="pills"
              size="sm"
              value={selectedCategory}
              onChange={setSelectedCategory}
              options={categories.map((c) => ({ value: c.id, label: c.label }))}
            />
          </div>

          <div style={{ display: 'flex', gap: '8px', flex: 1, maxWidth: '480px' }}>
            <Input
              placeholder="Search statements, tags, or notes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              leftIcon={<Search size={14} />}
            />
            <div style={{ minWidth: '170px' }}>
              <CustomSelect
                variant="subtle"
                value={sortBy}
                onChange={(val) => setSortBy(val as TaskSortField)}
                options={[
                  { value: 'priority', label: 'Priority' },
                  { value: 'dueDate', label: 'Due Date' },
                  { value: 'createdAt', label: 'Created' },
                  { value: 'title', label: 'Title' }
                ]}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      {isLoading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <Skeleton height="76px" />
          <Skeleton height="76px" />
          <Skeleton height="76px" />
        </div>
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckCircle2}
          title="No tasks match the active filters"
          description="Your task sanctuary is calm. Add an intentional task or adjust your filters."
          actionLabel="Create Intentional Task"
          onAction={openCreateModal}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {tasks.map((task) => {
            const isExpanded = expandedTaskIds.has(task.id);
            const totalSubs = task.subTasks.length;
            const doneSubs = task.subTasks.filter((s) => s.completed).length;
            const subProgress = totalSubs > 0 ? Math.round((doneSubs / totalSubs) * 100) : 0;

            return (
              <Card
                key={task.id}
                className="depth-1"
                style={{
                  padding: 'var(--space-md) var(--space-lg)',
                  backgroundColor: task.status === 'completed' ? 'var(--bg-surface-subtle)' : 'var(--bg-surface-primary)',
                  borderColor: 'var(--border-subtle)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '12px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px', flex: 1 }}>
                    <div style={{ paddingTop: '3px' }}>
                      <Checkbox
                        checked={task.status === 'completed'}
                        onChange={() => handleToggleTask(task.id)}
                        aria-label={`Toggle task ${task.title}`}
                      />
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h3
                          style={{
                            fontFamily: 'var(--font-interface)',
                            fontSize: 'var(--text-body)',
                            fontWeight: 600,
                            textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                            color: task.status === 'completed' ? 'var(--text-muted)' : 'var(--text-primary)'
                          }}
                        >
                          {task.title}
                        </h3>

                        <Badge variant={task.priority === 'urgent' ? 'coral' : task.priority === 'high' ? 'coral' : 'amber'}>
                          {task.priority}
                        </Badge>
                        <Badge variant="neutral">{task.category}</Badge>
                        {(() => {
                          const linkedSub = subjects.find((s) => s.id === task.subjectId);
                          return linkedSub ? (
                            <Badge variant={(linkedSub.color as BadgeVariant) || 'coral'}>
                              {linkedSub.name}
                            </Badge>
                          ) : null;
                        })()}
                      </div>

                      {task.description && (
                        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginTop: '4px' }}>
                          {task.description}
                        </p>
                      )}

                      {/* Meta Pills */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
                        {task.dueDate && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                            <Clock size={12} color="var(--color-coral-500)" />
                            {formatFriendlyDate(task.dueDate)} {task.dueTime ? `at ${task.dueTime}` : ''}
                          </span>
                        )}

                        {task.estimatedMinutes && (
                          <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                            ~{task.estimatedMinutes}m
                          </span>
                        )}

                        {task.tags.map((tag) => (
                          <span
                            key={tag}
                            style={{
                              fontSize: 'var(--text-micro)',
                              color: 'var(--text-muted)',
                              background: 'var(--bg-surface-secondary)',
                              padding: '2px 8px',
                              borderRadius: '4px',
                              border: '1px solid var(--border-subtle)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '4px'
                            }}
                          >
                            <Tag size={10} />
                            {tag}
                          </span>
                        ))}
                      </div>

                      {/* Subtasks Progress Indicator */}
                      {totalSubs > 0 && (
                        <div style={{ marginTop: '10px', maxWidth: '320px' }}>
                          <Progress
                            value={subProgress}
                            size="sm"
                            variant="momentum"
                            label={`Subtasks (${doneSubs}/${totalSubs})`}
                            showValueText
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Right Actions */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleAccordion(task.id)}
                      title="Subtasks"
                      aria-label="Toggle subtasks list"
                    >
                      {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      <span style={{ fontSize: 'var(--text-caption)' }}>
                        {totalSubs > 0 ? `${doneSubs}/${totalSubs}` : 'Subtasks'}
                      </span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditModal(task)}
                      aria-label="Edit task"
                      title="Edit"
                    >
                      <Edit2 size={14} />
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setDeletingTaskId(task.id)}
                      aria-label="Delete task"
                      title="Delete"
                      style={{ color: 'var(--status-error)' }}
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                {/* Expandable Subtasks Manager */}
                {isExpanded && (
                  <div
                    style={{
                      marginTop: 'var(--space-md)',
                      paddingTop: 'var(--space-md)',
                      borderTop: '1px solid var(--border-subtle)',
                      backgroundColor: 'var(--bg-surface-secondary)',
                      borderRadius: 'var(--radius-md)',
                      padding: 'var(--space-md)'
                    }}
                  >
                    <h4 style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>
                      Subtasks Breakdown
                    </h4>

                    {task.subTasks.length === 0 ? (
                      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', marginBottom: '8px' }}>
                        No subtasks added yet. Break this task into small actionable steps.
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '12px' }}>
                        {task.subTasks.map((sub) => (
                          <div
                            key={sub.id}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              padding: '6px 10px',
                              background: 'var(--bg-surface-primary)',
                              borderRadius: '6px',
                              border: '1px solid var(--border-subtle)'
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1 }}>
                              <Checkbox
                                checked={sub.completed}
                                onChange={() => handleToggleSubtask(task.id, sub.id)}
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
                              onClick={() => handleDeleteSubtask(task.id, sub.id)}
                              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                              aria-label={`Delete subtask ${sub.title}`}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Inline Add Subtask Input */}
                    <form onSubmit={(e) => handleAddSubtask(task.id, e)} style={{ display: 'flex', gap: '8px' }}>
                      <Input
                        placeholder="Add next actionable step..."
                        value={newSubtaskTitles[task.id] || ''}
                        onChange={(e) => setNewSubtaskTitles((prev) => ({ ...prev, [task.id]: e.target.value }))}
                      />
                      <Button variant="secondary" size="sm" type="submit">
                        Add Step
                      </Button>
                    </form>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Task Create / Edit Modal with Progressive Disclosure & Subject Linkage */}
      <Modal
        isOpen={isCreateModalOpen || editingTask !== null}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingTask(null);
        }}
        title={editingTask ? 'Edit Task' : 'Add Intentional Task'}
      >
        <form onSubmit={handleSaveTask} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {formError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: '6px',
                backgroundColor: 'var(--status-error-bg)',
                color: 'var(--status-error)',
                fontSize: 'var(--text-caption)'
              }}
            >
              <AlertCircle size={14} />
              <span>{formError}</span>
            </div>
          )}

          <Input
            label="Task Statement"
            placeholder="e.g. Master Raft Consensus State Invariants"
            value={formTitle}
            onChange={(e) => setFormTitle(e.target.value)}
            required
            autoFocus
          />

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '12px' }}>
            <CustomSelect
              label="Domain Category"
              value={formCategory}
              onChange={(val) => setFormCategory(val as TaskCategory)}
              options={[
                { value: 'study', label: 'Study & Coursework' },
                { value: 'deep_work', label: 'Deep Work' },
                { value: 'project', label: 'Project' },
                { value: 'review', label: 'Review & Recall' },
                { value: 'admin', label: 'Admin / Logistics' }
              ]}
            />

            <CustomSelect
              label="Priority Level"
              value={formPriority}
              onChange={(val) => setFormPriority(val as PriorityLevel)}
              options={[
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
            />

            <CustomSelect
              label="Linked Subject (Optional)"
              value={formSubjectId}
              onChange={(val) => setFormSubjectId(val)}
              options={[
                { value: '', label: 'No Subject Link' },
                ...subjects.map((s) => ({ value: s.id, label: s.name, badge: s.code }))
              ]}
            />
          </div>

          {/* Progressive Disclosure: Additional Context & Presets */}
          <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '10px', marginTop: '2px' }}>
            <button
              type="button"
              onClick={() => setShowMoreOptions((prev) => !prev)}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--color-coral-500)',
                fontSize: 'var(--text-body-sm)',
                fontWeight: 600,
                cursor: 'pointer',
                padding: '4px 0',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}
            >
              {showMoreOptions ? '− Hide Additional Schedule & Context' : '+ Additional Context (Due Date, Presets, Tags, Notes)'}
            </button>

            {showMoreOptions && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '12px' }}>
                <Textarea
                  label="Description / Context (Optional)"
                  placeholder="Key notes, references, requirements..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                />

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px' }}>
                  <Input
                    label="Due Date"
                    type="date"
                    value={formDueDate}
                    onChange={(e) => setFormDueDate(e.target.value)}
                  />
                  <Input
                    label="Due Time"
                    type="time"
                    value={formDueTime}
                    onChange={(e) => setFormDueTime(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                    Estimated Duration
                  </label>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    {[15, 30, 45, 60].map((mins) => (
                      <Button
                        key={mins}
                        type="button"
                        variant={formEstimatedMinutes === String(mins) ? 'accent' : 'subtle'}
                        size="sm"
                        onClick={() => setFormEstimatedMinutes(String(mins))}
                      >
                        {mins}m
                      </Button>
                    ))}
                    <div style={{ width: '100px' }}>
                      <Input
                        type="number"
                        placeholder="Custom"
                        value={formEstimatedMinutes}
                        onChange={(e) => setFormEstimatedMinutes(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Input
                  label="Tags (Comma separated)"
                  placeholder="Architecture, Raft, Core"
                  value={formTags}
                  onChange={(e) => setFormTags(e.target.value)}
                />
              </div>
            )}
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '12px' }}>
            <Button
              variant="ghost"
              type="button"
              onClick={() => {
                setIsCreateModalOpen(false);
                setEditingTask(null);
              }}
            >
              Cancel
            </Button>
            <Button variant="accent" type="submit" isLoading={isSubmitting} leftIcon={<Sparkles size={14} />}>
              {editingTask ? 'Update Task' : 'Save Task'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal with shared Destructive Primitive */}
      <Modal
        isOpen={deletingTaskId !== null}
        onClose={() => setDeletingTaskId(null)}
        title="Delete Task"
      >
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', marginBottom: '16px' }}>
          Are you sure you want to remove this intentional task from your sanctuary? This action cannot be undone.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
          <Button variant="ghost" onClick={() => setDeletingTaskId(null)}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteTask}
          >
            Confirm Delete
          </Button>
        </div>
      </Modal>
    </div>
  );
};
