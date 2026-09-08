import React, { useState } from 'react';
import { Modal } from '../../components/feedback/Modal/Modal';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Clock, Flame, Sparkles } from 'lucide-react';
import { CreateRoomPayload } from '../../types/room';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateRoomPayload) => Promise<void>;
}

const DURATION_PRESETS = [
  { label: '15m Sprint', seconds: 900 },
  { label: '25m Pomodoro', seconds: 1500 },
  { label: '45m Deep Flow', seconds: 2700 },
  { label: '50m Standard', seconds: 3000 },
  { label: '60m Marathon', seconds: 3600 }
];

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const [title, setTitle] = useState('');
  const [selectedDuration, setSelectedDuration] = useState<number>(1500);
  const [isCustom, setIsCustom] = useState(false);
  const [customMinutes, setCustomMinutes] = useState('25');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError('Please provide a name for your Study Sanctuary.');
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

    try {
      setIsSubmitting(true);
      setError(null);
      await onSubmit({
        title: title.trim(),
        targetDurationSeconds
      });
      setTitle('');
      setSelectedDuration(1500);
      setIsCustom(false);
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div>
            <label
              htmlFor="room-title"
              style={{
                display: 'block',
                fontSize: 'var(--text-caption, 0.8125rem)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '8px',
                letterSpacing: '0.02em'
              }}
            >
              Sanctuary Title
            </label>
            <Input
              id="room-title"
              placeholder="e.g. Distributed Consensus Sprint or Organic Chem Pod"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              autoFocus
              required
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--text-caption, 0.8125rem)',
                fontWeight: 600,
                color: 'var(--text-secondary)',
                marginBottom: '10px',
                letterSpacing: '0.02em'
              }}
            >
              Target Synchronized Focus Duration
            </label>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px, 1fr))', gap: '8px' }}>
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
                      padding: '10px 8px',
                      borderRadius: 'var(--radius-md, 8px)',
                      border: isSelected
                        ? '1.5px solid var(--color-coral-500, #ff6b4a)'
                        : '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                      backgroundColor: isSelected
                        ? 'rgba(255, 107, 74, 0.12)'
                        : 'var(--bg-surface-elevated, rgba(255,255,255,0.03))',
                      color: isSelected ? 'var(--color-coral-500, #ff6b4a)' : 'var(--text-primary)',
                      fontSize: 'var(--text-caption, 0.8125rem)',
                      fontWeight: isSelected ? 600 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '5px'
                    }}
                  >
                    <Clock size={13} />
                    {preset.label}
                  </button>
                );
              })}

              <button
                type="button"
                onClick={() => setIsCustom(true)}
                style={{
                  padding: '10px 8px',
                  borderRadius: 'var(--radius-md, 8px)',
                  border: isCustom
                    ? '1.5px solid var(--color-coral-500, #ff6b4a)'
                    : '1px solid var(--border-subtle, rgba(255,255,255,0.1))',
                  backgroundColor: isCustom
                    ? 'rgba(255, 107, 74, 0.12)'
                    : 'var(--bg-surface-elevated, rgba(255,255,255,0.03))',
                  color: isCustom ? 'var(--color-coral-500, #ff6b4a)' : 'var(--text-primary)',
                  fontSize: 'var(--text-caption, 0.8125rem)',
                  fontWeight: isCustom ? 600 : 500,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '5px'
                }}
              >
                <Sparkles size={13} />
                Custom
              </button>
            </div>

            {isCustom && (
              <div style={{ marginTop: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Input
                  type="number"
                  min="1"
                  max="240"
                  value={customMinutes}
                  onChange={(e) => setCustomMinutes(e.target.value)}
                  style={{ width: '120px' }}
                />
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>minutes</span>
              </div>
            )}
          </div>

          <div
            style={{
              padding: '12px 14px',
              borderRadius: 'var(--radius-md, 8px)',
              backgroundColor: 'rgba(255, 107, 74, 0.06)',
              border: '1px solid rgba(255, 107, 74, 0.15)',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px'
            }}
          >
            <Flame size={18} color="var(--color-coral-500, #ff6b4a)" style={{ flexShrink: 0, marginTop: '2px' }} />
            <div style={{ fontSize: 'var(--text-caption, 0.8125rem)', color: 'var(--text-secondary)', lineHeight: 1.45 }}>
              <strong style={{ color: 'var(--text-primary)' }}>Host Authority:</strong> As creator, you dictate when the synchronized epoch timer begins, pauses, and resets. All joined peers focus in perfect sync.
            </div>
          </div>

          {error && (
            <div
              style={{
                color: 'var(--color-rose-500, #e11d48)',
                fontSize: 'var(--text-caption, 0.8125rem)',
                backgroundColor: 'rgba(225, 29, 72, 0.08)',
                padding: '8px 12px',
                borderRadius: '6px'
              }}
            >
              {error}
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
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
