import React, { useState } from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { CustomSelect } from '../../ui/Select/CustomSelect';
import { Badge } from '../../ui/Badge/Badge';
import { RecurringStudyRoutine, DayOfWeek } from '../../../types/planning';
import { StudySubject, StudyTopic } from '../../../types/study';
import { Plus, Trash2, Sparkles } from 'lucide-react';
import './RecurringRoutinesModal.css';

const DAYS: { value: DayOfWeek; label: string }[] = [
  { value: 0, label: 'Su' },
  { value: 1, label: 'Mo' },
  { value: 2, label: 'Tu' },
  { value: 3, label: 'We' },
  { value: 4, label: 'Th' },
  { value: 5, label: 'Fr' },
  { value: 6, label: 'Sa' }
];

export interface RecurringRoutinesModalProps {
  isOpen: boolean;
  onClose: () => void;
  routines: RecurringStudyRoutine[];
  subjects: StudySubject[];
  topics: StudyTopic[];
  onCreateRoutine: (routine: Partial<RecurringStudyRoutine>) => Promise<void>;
  onToggleRoutine: (id: string, isActive: boolean) => Promise<void>;
  onDeleteRoutine: (id: string) => Promise<void>;
  onSyncToday: () => Promise<void>;
}

export const RecurringRoutinesModal: React.FC<RecurringRoutinesModalProps> = ({
  isOpen,
  onClose,
  routines,
  subjects,
  topics,
  onCreateRoutine,
  onToggleRoutine,
  onDeleteRoutine,
  onSyncToday
}) => {
  const [isCreating, setIsCreating] = useState(false);
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState(subjects[0]?.id || '');
  const [topicId, setTopicId] = useState('');
  const [targetMinutes, setTargetMinutes] = useState('45');
  const [scheduledTime, setScheduledTime] = useState('14:00');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([1, 3, 5]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const subjectTopics = topics.filter((t) => !subjectId || t.subjectId === subjectId);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day].sort()
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !subjectId || selectedDays.length === 0) return;

    setIsSubmitting(true);
    try {
      await onCreateRoutine({
        title: title.trim(),
        subjectId,
        topicId: topicId || undefined,
        targetMinutes: parseInt(targetMinutes, 10) || 45,
        scheduledTime,
        daysOfWeek: selectedDays,
        priority: 'medium',
        isActive: true
      });
      setTitle('');
      setIsCreating(false);
    } catch (err) {
      console.error('Failed to create routine:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Recurring Study Routines"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: 0 }}>
            Automate your weekly study commitments across specific days and time slots.
          </p>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Sparkles size={14} />}
            onClick={onSyncToday}
          >
            Sync to Today
          </Button>
        </div>

        {/* Existing Routines List */}
        <div>
          {routines.length === 0 && !isCreating ? (
            <div style={{ textAlign: 'center', padding: 'var(--space-lg)', color: 'var(--text-secondary)' }}>
              No recurring study routines configured yet.
            </div>
          ) : (
            routines.map((routine) => (
              <div
                key={routine.id}
                className={`solis-routine-item ${!routine.isActive ? 'solis-routine-item--inactive' : ''}`}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
                      {routine.title}
                    </span>
                    <Badge variant="neutral">{routine.subjectName || 'Study'}</Badge>
                  </div>
                  <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '2px' }}>
                    {routine.scheduledTime} • {routine.targetMinutes}m •{' '}
                    {routine.daysOfWeek.map((d) => DAYS.find((item) => item.value === d)?.label).join(', ')}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onToggleRoutine(routine.id, !routine.isActive)}
                  >
                    {routine.isActive ? 'Active' : 'Paused'}
                  </Button>
                  <button
                    onClick={() => onDeleteRoutine(routine.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                    title="Delete routine"
                  >
                    <Trash2 size={15} />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Create Routine Form */}
        {isCreating ? (
          <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '12px', padding: '14px', backgroundColor: 'var(--bg-surface-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <Input
              label="Routine Statement"
              placeholder="e.g. Distributed Consensus Problem Solving"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              autoFocus
            />

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <CustomSelect
                label="Study Subject"
                value={subjectId}
                onChange={(val) => {
                  setSubjectId(val);
                  setTopicId('');
                }}
                options={subjects.map((s) => ({ value: s.id, label: s.name }))}
              />
              {subjectTopics.length > 0 ? (
                <CustomSelect
                  label="Target Topic (Optional)"
                  value={topicId}
                  onChange={setTopicId}
                  options={[
                    { value: '', label: 'General / No specific topic' },
                    ...subjectTopics.map((t) => ({ value: t.id, label: t.title }))
                  ]}
                />
              ) : (
                <Input
                  label="Target Duration (mins)"
                  type="number"
                  value={targetMinutes}
                  onChange={(e) => setTargetMinutes(e.target.value)}
                />
              )}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              <Input
                label="Scheduled Time"
                value={scheduledTime}
                onChange={(e) => setScheduledTime(e.target.value)}
                placeholder="14:00"
                required
              />
              {subjectTopics.length > 0 && (
                <Input
                  label="Target Duration (mins)"
                  type="number"
                  value={targetMinutes}
                  onChange={(e) => setTargetMinutes(e.target.value)}
                />
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 500, marginBottom: '4px' }}>
                Days of Week
              </label>
              <div className="solis-routine-weekday-picker">
                {DAYS.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    className={`solis-routine-day-btn ${selectedDays.includes(day.value) ? 'solis-routine-day-btn--selected' : ''}`}
                    onClick={() => toggleDay(day.value)}
                  >
                    {day.label}
                  </button>
                ))}
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '6px' }}>
              <Button variant="ghost" size="sm" type="button" onClick={() => setIsCreating(false)}>
                Cancel
              </Button>
              <Button variant="primary" size="sm" type="submit" isLoading={isSubmitting} leftIcon={<Plus size={14} />}>
                Save Routine
              </Button>
            </div>
          </form>
        ) : (
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setIsCreating(true)}
          >
            + Add Recurring Study Routine
          </Button>
        )}
      </div>
    </Modal>
  );
};
