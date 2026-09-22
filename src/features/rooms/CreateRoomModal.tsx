import React, { useState } from 'react';
import { Modal } from '../../components/feedback/Modal/Modal';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { CustomSelect } from '../../components/ui/Select/CustomSelect';
import { Clock, Flame, Sparkles, Coffee, Lock, Globe } from 'lucide-react';
import { CreateRoomPayload, RoomSessionType } from '../../types/room';
import { StudySubject } from '../../types/study';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateRoomPayload) => Promise<void>;
  subjects?: StudySubject[];
}

const DURATION_PRESETS = [
  { label: '15m Sprint', seconds: 900 },
  { label: '25m Pomodoro', seconds: 1500 },
  { label: '45m Deep Flow', seconds: 2700 },
  { label: '50m Standard', seconds: 3000 },
  { label: '60m Marathon', seconds: 3600 }
];

const BREAK_PRESETS = [
  { label: '5m Quick Breath', seconds: 300 },
  { label: '10m Coffee Break', seconds: 600 },
  { label: '15m Walk & Rest', seconds: 900 }
];

const SESSION_TYPES: { value: RoomSessionType; label: string }[] = [
  { value: 'deep_focus', label: 'Deep Focus' },
  { value: 'pomodoro', label: 'Pomodoro' },
  { value: 'exam_cram', label: 'Exam Prep' },
  { value: 'silent_reading', label: 'Silent Reading' },
  { value: 'code_review', label: 'Code Review' }
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  subjects = []
}) => {
  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [topic, setTopic] = useState('');
  const [sessionType, setSessionType] = useState<RoomSessionType>('deep_focus');
  const [sharedObjective, setSharedObjective] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(1500);
  const [breakDurationSeconds, setBreakDurationSeconds] = useState<number>(300);
  const [isCustom, setIsCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('25');
  const [isPrivate, setIsPrivate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a title for your Study Sanctuary.');
      return;
    }

    let targetDurationSeconds = selectedDuration;
    if (isCustom) {
      const parsed = parseInt(customMinutes, 10);
      if (isNaN(parsed) || parsed < 1 || parsed > 240) {
        setError('Custom duration must be between 1 and 240 minutes.');
        return;
      }
      targetDurationSeconds = parsed * 60;
    }

    const selectedSubject = subjects.find((s) => s.id === subjectId);

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        subjectId: subjectId || undefined,
        subjectName: selectedSubject?.name,
        topic: topic.trim() || undefined,
        sessionType,
        sharedObjective: sharedObjective.trim() || undefined,
        targetDurationSeconds,
        breakDurationSeconds,
        isPrivate
      });

      // Reset
      setTitle('');
      setSubjectId('');
      setTopic('');
      setSessionType('deep_focus');
      setSharedObjective('');
      setSelectedDuration(1500);
      setBreakDurationSeconds(300);
      setIsCustom(false);
      setIsPrivate(false);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create room. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Create Study Sanctuary"
      className="solis-modal--md"
    >
      <form onSubmit={handleSubmit} className="solis-create-room-form">
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Title */}
          <div>
            <label
              htmlFor="room-title"
              style={{
                display: 'block',
                fontSize: 'var(--text-caption)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '6px'
              }}
            >
              Sanctuary Title *
            </label>
            <Input
              id="room-title"
              placeholder="e.g. Distributed Systems Final Review, Organic Chem Pod"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          {/* Subject & Session Type */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
                Subject (Optional)
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
                Session Modality
              </label>
              <CustomSelect
                variant="surface"
                value={sessionType}
                onChange={(val) => setSessionType(val as RoomSessionType)}
                options={SESSION_TYPES}
              />
            </div>
          </div>

          {/* Shared Objective */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Shared Pod Objective (Optional)
            </label>
            <Textarea
              placeholder="What mutual milestone will all scholars in this sanctuary commit to finishing?"
              value={sharedObjective}
              onChange={(e) => setSharedObjective(e.target.value)}
              rows={2}
            />
          </div>

          {/* Focus Duration */}
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-caption)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '8px'
              }}
            >
              Target Focus Duration
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '6px' }}>
              {DURATION_PRESETS.map((preset) => {
                const isSelected = !isCustom && selectedDuration === preset.seconds;
                return (
                  <button
                    key={preset.seconds}
                    type="button"
                    onClick={() => {
                      setIsCustom(false);
                      setSelectedDuration(preset.seconds);
                    }}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '1.5px solid var(--color-coral-500)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'rgba(255, 107, 74, 0.12)' : 'var(--bg-surface-elevated)',
                      color: isSelected ? 'var(--color-coral-500)' : 'var(--text-primary)',
                      fontSize: 'var(--text-caption)',
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Clock size={12} />
                    {preset.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCustom(true)}
                style={{
                  padding: '8px 6px',
                  borderRadius: 'var(--radius-sm)',
                  border: isCustom ? '1.5px solid var(--color-coral-500)' : '1px solid var(--border-subtle)',
                  backgroundColor: isCustom ? 'rgba(255, 107, 74, 0.12)' : 'var(--bg-surface-elevated)',
                  color: isCustom ? 'var(--color-coral-500)' : 'var(--text-primary)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: isCustom ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '4px'
                }}
              >
                <Sparkles size={12} />
                Custom
              </button>
            </div>

            {isCustom && (
              <div style={{ marginTop: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Input
                  type="number"
                  min="1"
                  max="240"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  style={{ width: '100px' }}
                />
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>minutes</span>
              </div>
            )}
          </div>

          {/* Break Duration Presets */}
          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
              Intermission / Break Duration
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '6px' }}>
              {BREAK_PRESETS.map((preset) => {
                const isSelected = breakDurationSeconds === preset.seconds;
                return (
                  <button
                    key={preset.seconds}
                    type="button"
                    onClick={() => setBreakDurationSeconds(preset.seconds)}
                    style={{
                      padding: '8px 6px',
                      borderRadius: 'var(--radius-sm)',
                      border: isSelected ? '1.5px solid var(--color-amber-500, #f59e0b)' : '1px solid var(--border-subtle)',
                      backgroundColor: isSelected ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-surface-elevated)',
                      color: isSelected ? 'var(--color-amber-500, #f59e0b)' : 'var(--text-primary)',
                      fontSize: 'var(--text-caption)',
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '4px'
                    }}
                  >
                    <Coffee size={12} />
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Privacy Toggle */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '10px 14px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'var(--bg-surface-elevated)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isPrivate ? <Lock size={16} color="var(--color-amber-500)" /> : <Globe size={16} color="var(--color-coral-500)" />}
              <div>
                <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--text-primary)', display: 'block' }}>
                  {isPrivate ? 'Private Sanctuary (Code Required)' : 'Public Sanctuary'}
                </span>
                <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)' }}>
                  {isPrivate ? 'Only scholars with your 6-digit room code can enter.' : 'Visible on the Solis study floor for anyone to join.'}
                </span>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setIsPrivate((p) => !p)}
              style={{
                padding: '4px 10px',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--border-subtle)',
                background: isPrivate ? 'rgba(245, 158, 11, 0.15)' : 'var(--bg-surface-primary)',
                color: isPrivate ? 'var(--color-amber-500)' : 'var(--text-secondary)',
                fontSize: 'var(--text-caption)',
                cursor: 'pointer',
                fontWeight: 600
              }}
            >
              {isPrivate ? 'Private' : 'Public'}
            </button>
          </div>

          <div
            style={{
              padding: '10px 12px',
              borderRadius: 'var(--radius-md)',
              backgroundColor: 'rgba(255, 107, 74, 0.06)',
              border: '1px solid rgba(255, 107, 74, 0.15)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <Flame size={16} color="var(--color-coral-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Synchronized Flow:</strong> As host, your timer controls epoch countdowns and break transitions for all joined scholars.
            </div>
          </div>

          {error && (
            <div
              style={{
                color: 'var(--color-rose-500, #e11d48)',
                fontSize: 'var(--text-caption)',
                backgroundColor: 'rgba(225, 29, 72, 0.08)',
                padding: '8px 12px',
                borderRadius: '6px'
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '6px' }}>
            <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={isSubmitting}>
              Create Sanctuary
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};
