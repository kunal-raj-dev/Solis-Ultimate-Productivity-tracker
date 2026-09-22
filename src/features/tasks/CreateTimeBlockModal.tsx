import React, { useState, useEffect } from 'react';
import { AlertCircle } from 'lucide-react';
import { Modal } from '../../components/feedback/Modal/Modal';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { CustomSelect } from '../../components/ui/Select/CustomSelect';
import { Task, TaskTimeBlock } from '../../types/task';
import { StudySubject } from '../../types/study';
import { Goal } from '../../types/goal';
import { PriorityLevel } from '../../types/common';
import { getISODateString } from '../../utils/date';

interface CreateTimeBlockModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (block: Partial<TaskTimeBlock>) => Promise<void>;
  defaultHour?: number;
  defaultDate?: string;
  tasks: Task[];
  subjects: StudySubject[];
  goals: Goal[];
  editingBlock?: TaskTimeBlock | null;
}

export const CreateTimeBlockModal: React.FC<CreateTimeBlockModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  defaultHour = 9,
  defaultDate,
  tasks,
  subjects,
  goals,
  editingBlock
}) => {
  const [selectedTaskId, setSelectedTaskId] = useState<string>('');
  const [customTitle, setCustomTitle] = useState<string>('');
  const [description, setDescription] = useState<string>('');
  const [date, setDate] = useState<string>(defaultDate || getISODateString(new Date()));
  const [startHour, setStartHour] = useState<number>(defaultHour);
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [subjectId, setSubjectId] = useState<string>('');
  const [goalId, setGoalId] = useState<string>('');
  const [priority, setPriority] = useState<PriorityLevel>('medium');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (editingBlock) {
      setSelectedTaskId(editingBlock.taskId || '');
      setCustomTitle(editingBlock.taskTitle);
      setDescription(editingBlock.description || '');
      setDate(editingBlock.date);
      setStartHour(editingBlock.startHour);
      setDurationMinutes(editingBlock.durationMinutes);
      setSubjectId(editingBlock.subjectId || '');
      setGoalId(editingBlock.goalId || '');
      setPriority(editingBlock.priority);
    } else {
      setSelectedTaskId('');
      setCustomTitle('');
      setDescription('');
      setDate(defaultDate || getISODateString(new Date()));
      setStartHour(defaultHour);
      setDurationMinutes(60);
      setSubjectId('');
      setGoalId('');
      setPriority('medium');
    }
    setError(null);
  }, [editingBlock, defaultHour, defaultDate, isOpen]);

  const handleTaskSelect = (taskId: string) => {
    setSelectedTaskId(taskId);
    if (taskId) {
      const matched = tasks.find((t) => t.id === taskId);
      if (matched) {
        setCustomTitle(matched.title);
        setDescription(matched.description || '');
        setPriority(matched.priority);
        if (matched.subjectId) setSubjectId(matched.subjectId);
        if (matched.goalId) setGoalId(matched.goalId);
        if (matched.estimatedMinutes) setDurationMinutes(matched.estimatedMinutes);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalTitle = customTitle.trim();
    if (!finalTitle) {
      setError('Please specify a title or intention for this block.');
      return;
    }

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        id: editingBlock?.id,
        taskId: selectedTaskId || undefined,
        taskTitle: finalTitle,
        description: description.trim() || undefined,
        date,
        startHour,
        startMinute: 0,
        durationMinutes,
        subjectId: subjectId || undefined,
        goalId: goalId || undefined,
        priority
      });
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Could not schedule time block.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const hourOptions = Array.from({ length: 24 }, (_, i) => {
    const formatted = `${i % 12 === 0 ? 12 : i % 12}:00 ${i >= 12 ? 'PM' : 'AM'}`;
    return { value: String(i), label: formatted };
  });

  const durationPresets = [
    { label: '30m Sprint', mins: 30 },
    { label: '45m Block', mins: 45 },
    { label: '60m Hour', mins: 60 },
    { label: '90m Deep', mins: 90 },
    { label: '120m Long', mins: 120 }
  ];

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={editingBlock ? 'Edit Planned Block' : 'Schedule Time Block'}
      className="solis-modal--md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Existing Task Picker */}
        {!editingBlock && tasks.filter((t) => t.status !== 'completed').length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Assign Existing Task (Optional)
            </label>
            <CustomSelect
              variant="surface"
              value={selectedTaskId}
              onChange={handleTaskSelect}
              options={[
                { value: '', label: '— Or create new block intention below —' },
                ...tasks
                  .filter((t) => t.status !== 'completed')
                  .map((t) => ({ value: t.id, label: t.title }))
              ]}
            />
          </div>
        )}

        {/* Title */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Block Title / Intention *
          </label>
          <Input
            placeholder="e.g. Distributed Consensus Verification, Review LeetCode Hard"
            value={customTitle}
            onChange={(e) => setCustomTitle(e.target.value)}
            required
            autoFocus={!selectedTaskId}
          />
        </div>

        {/* Date & Start Hour */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Date
            </label>
            <Input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Start Hour
            </label>
            <CustomSelect
              variant="surface"
              value={String(startHour)}
              onChange={(val) => setStartHour(parseInt(val, 10))}
              options={hourOptions}
            />
          </div>
        </div>

        {/* Duration Presets */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Duration
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
            {durationPresets.map((preset) => (
              <button
                key={preset.mins}
                type="button"
                onClick={() => setDurationMinutes(preset.mins)}
                style={{
                  padding: '8px 4px',
                  borderRadius: 'var(--radius-sm)',
                  border: durationMinutes === preset.mins ? '1.5px solid var(--color-coral-500)' : '1px solid var(--border-subtle)',
                  background: durationMinutes === preset.mins ? 'rgba(255, 107, 74, 0.12)' : 'var(--bg-surface-elevated)',
                  color: durationMinutes === preset.mins ? 'var(--color-coral-500)' : 'var(--text-secondary)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: durationMinutes === preset.mins ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {preset.label}
              </button>
            ))}
          </div>
        </div>

        {/* Subject & Priority */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Study Subject
            </label>
            <CustomSelect
              variant="surface"
              value={subjectId}
              onChange={setSubjectId}
              options={[
                { value: '', label: 'General / No Subject' },
                ...subjects.filter((s) => s.status !== 'archived').map((s) => ({ value: s.id, label: s.name }))
              ]}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Priority
            </label>
            <CustomSelect
              variant="surface"
              value={priority}
              onChange={(val) => setPriority(val as PriorityLevel)}
              options={[
                { value: 'urgent', label: 'Urgent' },
                { value: 'high', label: 'High' },
                { value: 'medium', label: 'Medium' },
                { value: 'low', label: 'Low' }
              ]}
            />
          </div>
        </div>

        {/* Strategic Goal Link */}
        {goals && goals.length > 0 && (
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Link to Strategic Goal (Optional)
            </label>
            <CustomSelect
              variant="surface"
              value={goalId}
              onChange={setGoalId}
              options={[
                { value: '', label: 'No Goal Link' },
                ...goals.filter((g) => g.status !== 'completed').map((g) => ({ value: g.id, label: g.title }))
              ]}
            />
          </div>
        )}

        {/* Description / Outcome */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Expected Outcome / Notes
          </label>
          <Textarea
            placeholder="What exact artifact or understanding will prove this block was successful?"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={2}
          />
        </div>

        {error && (
          <div
            style={{
              padding: '8px 12px',
              backgroundColor: 'rgba(225, 29, 72, 0.1)',
              border: '1px solid var(--color-rose-500)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--color-rose-500)',
              fontSize: 'var(--text-caption)',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            <AlertCircle size={14} />
            <span>{error}</span>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            {editingBlock ? 'Update Block' : 'Commit Block'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
