import React, { useState } from 'react';
import {
  Star,
  Sparkles,
  Flame,
  Plus
} from 'lucide-react';
import { Modal } from '../../components/feedback/Modal/Modal';
import { Button } from '../../components/ui/Button/Button';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Input } from '../../components/ui/Input/Input';
import { StudyRoom, RoomReflection } from '../../types/room';
import { dataService } from '../../services/dataService';
import { useToast } from '../../context/ToastContext';
import { getISODateString } from '../../utils/date';

interface RoomReflectionModalProps {
  isOpen: boolean;
  room: StudyRoom | null;
  onClose: () => void;
  onCompleted?: () => void;
}

export const RoomReflectionModal: React.FC<RoomReflectionModalProps> = ({
  isOpen,
  room,
  onClose,
  onCompleted
}) => {
  const { addToast } = useToast();
  const [retentionRating, setRetentionRating] = useState<number>(4);
  const [keyTakeaways, setKeyTakeaways] = useState('');
  const [nextSteps, setNextSteps] = useState('');
  const [convertTaskTitle, setConvertTaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!room) return null;

  const sessionMinutes = Math.round((room.targetDurationSeconds || 1500) / 60);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // 1. Save Room Reflection
      const reflectionPayload: Partial<RoomReflection> = {
        roomId: room.id,
        roomTitle: room.title,
        subjectId: room.subjectId,
        subjectName: room.subjectName,
        durationSeconds: sessionMinutes * 60,
        objectiveAchieved: true,
        reflectionText: keyTakeaways.trim(),
        nextStep: nextSteps.trim(),
        retentionRating
      };

      await dataService.rooms.saveRoomReflection(reflectionPayload);

      // 2. Optionally create follow-up Task if entered
      if (convertTaskTitle.trim()) {
        await dataService.tasks.createTask({
          title: convertTaskTitle.trim(),
          category: 'study',
          priority: 'medium',
          subjectId: room.subjectId,
          dueDate: getISODateString(new Date())
        });
        addToast({
          title: 'Follow-Up Task Created',
          description: convertTaskTitle.trim(),
          type: 'success'
        });
      }

      addToast({
        title: 'Reflection Logged',
        description: `Deliberate study session recorded for ${room.subjectName || room.title}.`,
        type: 'success'
      });

      if (onCompleted) onCompleted();
      onClose();
    } catch (err: any) {
      addToast({
        title: 'Could not save reflection',
        description: err?.message || 'Please check input',
        type: 'error'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Study Session Reflection"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
        {/* Session Stats Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 16px',
            backgroundColor: 'rgba(255, 107, 74, 0.08)',
            border: '1px solid rgba(255, 107, 74, 0.25)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Flame size={16} color="var(--color-coral-500)" />
              <strong style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>
                {room.title}
              </strong>
            </div>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              {room.subjectName ? `${room.subjectName} • ` : ''}{sessionMinutes} minutes focused
            </span>
          </div>

          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', display: 'block' }}>
              SESSION TYPE
            </span>
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--color-coral-500)', textTransform: 'capitalize' }}>
              {room.sessionType || 'Focus'}
            </span>
          </div>
        </div>

        {/* Shared Objective Recap */}
        {room.sharedObjective && (
          <div style={{ padding: '8px 12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
            <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Shared Sanctuary Objective:
            </span>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-primary)', margin: '2px 0 0', fontWeight: 500 }}>
              "{room.sharedObjective}"
            </p>
          </div>
        )}

        {/* Rating Stars */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '8px' }}>
            Session Quality & Deep Focus Rating (1 to 5)
          </label>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setRetentionRating(star)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center'
                }}
                aria-label={`Rate ${star} star`}
              >
                <Star
                  size={24}
                  color={star <= retentionRating ? 'var(--color-amber-500, #f59e0b)' : 'var(--text-muted)'}
                  fill={star <= retentionRating ? 'var(--color-amber-500, #f59e0b)' : 'transparent'}
                  style={{ transition: 'all 0.15s ease' }}
                />
              </button>
            ))}
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', marginLeft: '6px' }}>
              {retentionRating === 5 ? 'Exceptional flow' : retentionRating === 4 ? 'Solid progress' : retentionRating === 3 ? 'Moderate' : 'Challenging'}
            </span>
          </div>
        </div>

        {/* Breakthrough / Key Learnings */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Key Solidification / Artifact Produced *
          </label>
          <Textarea
            placeholder="What exact concept clicked? What equation, code, or chapter did you master?"
            value={keyTakeaways}
            onChange={(e) => setKeyTakeaways(e.target.value)}
            rows={2}
            required
          />
        </div>

        {/* Blockers or Next Action */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Next Open Question or Continuation Step
          </label>
          <Textarea
            placeholder="Where should you pick up next time to maintain momentum?"
            value={nextSteps}
            onChange={(e) => setNextSteps(e.target.value)}
            rows={2}
          />
        </div>

        {/* 1-Click Follow-Up Task Converter */}
        <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <Plus size={13} color="var(--color-coral-500)" />
            Convert Unfinished Work to Intentional Task (Optional)
          </label>
          <Input
            placeholder="e.g. Solve dynamic programming practice set 4"
            value={convertTaskTitle}
            onChange={(e) => setConvertTaskTitle(e.target.value)}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
          <Button type="button" variant="ghost" onClick={onClose} disabled={isSubmitting}>
            Skip Reflection
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting} leftIcon={<Sparkles size={14} />}>
            Commit Reflection & Log
          </Button>
        </div>
      </form>
    </Modal>
  );
};
