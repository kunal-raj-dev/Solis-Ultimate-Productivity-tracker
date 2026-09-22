import React, { useState, useEffect } from 'react';
import {
  CheckCircle2,
  Clock,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ArrowRight,
  Calendar
} from 'lucide-react';
import { Modal } from '../../components/feedback/Modal/Modal';
import { Button } from '../../components/ui/Button/Button';
import { Input } from '../../components/ui/Input/Input';
import { Textarea } from '../../components/ui/Textarea/Textarea';
import { Badge } from '../../components/ui/Badge/Badge';
import { TaskTimeBlock, TimeBlockReviewPayload } from '../../types/task';
import { getISODateString } from '../../utils/date';

interface HourReviewModalProps {
  isOpen: boolean;
  block: TaskTimeBlock | null;
  onClose: () => void;
  onSubmit: (review: TimeBlockReviewPayload) => Promise<void>;
}

export const HourReviewModal: React.FC<HourReviewModalProps> = ({
  isOpen,
  block,
  onClose,
  onSubmit
}) => {
  const [status, setStatus] = useState<'completed' | 'partial' | 'missed'>('completed');
  const [progressPercent, setProgressPercent] = useState<number>(100);
  const [actualMinutes, setActualMinutes] = useState<string>('60');
  const [reflection, setReflection] = useState<string>('');
  const [blocker, setBlocker] = useState<string>('');
  const [nextAction, setNextAction] = useState<string>('');
  const [rescheduleChoice, setRescheduleChoice] = useState<'none' | 'next_hour' | 'tomorrow'>('none');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (block) {
      setStatus(block.status === 'missed' ? 'missed' : block.status === 'partial' ? 'partial' : 'completed');
      setProgressPercent(block.progressPercent || (block.status === 'completed' ? 100 : block.status === 'partial' ? 50 : 0));
      setActualMinutes(String(block.actualMinutes || block.durationMinutes || 60));
      setReflection(block.reflection || '');
      setBlocker(block.blocker || '');
      setNextAction(block.nextAction || '');
      setRescheduleChoice(block.status === 'partial' || block.status === 'missed' ? 'next_hour' : 'none');
    }
  }, [block]);

  if (!block) return null;

  const handleStatusChange = (newStatus: 'completed' | 'partial' | 'missed') => {
    setStatus(newStatus);
    if (newStatus === 'completed') {
      setProgressPercent(100);
      setRescheduleChoice('none');
    } else if (newStatus === 'partial') {
      setProgressPercent(50);
      setRescheduleChoice('next_hour');
    } else {
      setProgressPercent(0);
      setRescheduleChoice('next_hour');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    const now = new Date();
    const currentHour = now.getHours();
    const todayStr = getISODateString(now);
    let rescheduleToHour: number | undefined;
    let rescheduleToDate: string | undefined;

    const blockStartMins = block.startHour * 60 + (block.startMinute || 0);
    const blockEndMins = blockStartMins + (block.durationMinutes || 60);
    const blockEndHour = Math.floor(blockEndMins / 60) % 24;

    if (rescheduleChoice === 'next_hour') {
      const nextHourCandidate = block.date === todayStr ? Math.max(currentHour, blockEndHour) : currentHour;
      rescheduleToHour = (nextHourCandidate + 1) % 24;
      if (rescheduleToHour === 0 || nextHourCandidate >= 23) {
        // Wrapped past midnight
        const tmrw = new Date();
        tmrw.setDate(tmrw.getDate() + 1);
        rescheduleToDate = getISODateString(tmrw);
        rescheduleToHour = 9;
      } else {
        rescheduleToDate = todayStr;
      }
    } else if (rescheduleChoice === 'tomorrow') {
      const tmrw = new Date();
      tmrw.setDate(tmrw.getDate() + 1);
      rescheduleToDate = getISODateString(tmrw);
      rescheduleToHour = block.startHour;
    }

    try {
      await onSubmit({
        status,
        progressPercent,
        actualMinutes: Math.max(0, parseInt(actualMinutes, 10) || 0),
        reflection: reflection.trim() || undefined,
        blocker: blocker.trim() || undefined,
        nextAction: nextAction.trim() || undefined,
        rescheduleToHour,
        rescheduleToDate
      });
      onClose();
    } catch (err) {
      console.error('Failed to submit hour review:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const startMin = block.startMinute || 0;
  const totalStartMins = block.startHour * 60 + startMin;
  const totalEndMins = totalStartMins + (block.durationMinutes || 60);
  const endHour = Math.floor(totalEndMins / 60) % 24;
  const endMin = totalEndMins % 60;

  const formatClock = (h: number, m: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:${String(m).padStart(2, '0')} ${ampm}`;
  };

  const startHourStr = formatClock(block.startHour, startMin);
  const endHourStr = formatClock(endHour, endMin);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Hour Block Reflection"
      className="solis-modal--md"
    >
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Block Banner */}
        <div
          style={{
            padding: '12px 16px',
            backgroundColor: 'var(--bg-surface-secondary)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-subtle)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
        >
          <div>
            <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Clock size={12} color="var(--color-coral-500)" />
              <span>{startHourStr} — {endHourStr}</span>
              <span>•</span>
              <span>{block.durationMinutes}m planned</span>
            </div>
            <h3 style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)', marginTop: '3px' }}>
              {block.taskTitle}
            </h3>
          </div>
          <Badge variant={block.priority === 'urgent' || block.priority === 'high' ? 'coral' : 'neutral'}>
            {block.priority}
          </Badge>
        </div>

        {/* 1. What actually happened? (Status Selector) */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            What was the outcome of this hour?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px' }}>
            <button
              type="button"
              onClick={() => handleStatusChange('completed')}
              style={{
                padding: '12px 8px',
                borderRadius: 'var(--radius-md)',
                border: status === 'completed' ? '1.5px solid var(--color-emerald-500, #10b981)' : '1px solid var(--border-subtle)',
                backgroundColor: status === 'completed' ? 'rgba(16, 185, 129, 0.12)' : 'var(--bg-surface-elevated)',
                color: status === 'completed' ? 'var(--color-emerald-500, #10b981)' : 'var(--text-secondary)',
                fontWeight: status === 'completed' ? 600 : 500,
                fontSize: 'var(--text-caption)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <CheckCircle2 size={18} />
              <span>Completed</span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange('partial')}
              style={{
                padding: '12px 8px',
                borderRadius: 'var(--radius-md)',
                border: status === 'partial' ? '1.5px solid var(--color-amber-500, #f59e0b)' : '1px solid var(--border-subtle)',
                backgroundColor: status === 'partial' ? 'rgba(245, 158, 11, 0.12)' : 'var(--bg-surface-elevated)',
                color: status === 'partial' ? 'var(--color-amber-500, #f59e0b)' : 'var(--text-secondary)',
                fontWeight: status === 'partial' ? 600 : 500,
                fontSize: 'var(--text-caption)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <AlertTriangle size={18} />
              <span>Partially Done</span>
            </button>

            <button
              type="button"
              onClick={() => handleStatusChange('missed')}
              style={{
                padding: '12px 8px',
                borderRadius: 'var(--radius-md)',
                border: status === 'missed' ? '1.5px solid var(--color-rose-500, #e11d48)' : '1px solid var(--border-subtle)',
                backgroundColor: status === 'missed' ? 'rgba(225, 29, 72, 0.12)' : 'var(--bg-surface-elevated)',
                color: status === 'missed' ? 'var(--color-rose-500, #e11d48)' : 'var(--text-secondary)',
                fontWeight: status === 'missed' ? 600 : 500,
                fontSize: 'var(--text-caption)',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '6px',
                transition: 'all 0.15s ease'
              }}
            >
              <RotateCcw size={18} />
              <span>Missed / Blocked</span>
            </button>
          </div>
        </div>

        {/* 2. Progress Slider & Actual Minutes */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
              <label style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                Progress Achieved
              </label>
              <span style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--color-coral-500)' }}>
                {progressPercent}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={progressPercent}
              onChange={(e) => setProgressPercent(parseInt(e.target.value, 10))}
              style={{ width: '100%', accentColor: 'var(--color-coral-500)', cursor: 'pointer' }}
            />
            <div style={{ display: 'flex', gap: '4px', marginTop: '6px' }}>
              {[25, 50, 75, 100].map((pct) => (
                <button
                  key={pct}
                  type="button"
                  onClick={() => setProgressPercent(pct)}
                  style={{
                    flex: 1,
                    fontSize: 'var(--text-micro)',
                    padding: '2px 0',
                    borderRadius: '4px',
                    border: '1px solid var(--border-subtle)',
                    background: progressPercent === pct ? 'var(--color-coral-500)' : 'var(--bg-surface-secondary)',
                    color: progressPercent === pct ? '#fff' : 'var(--text-muted)',
                    cursor: 'pointer'
                  }}
                >
                  {pct}%
                </button>
              ))}
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
              Actual Minutes Spent
            </label>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Input
                type="number"
                min="0"
                max="360"
                value={actualMinutes}
                onChange={(e) => setActualMinutes(e.target.value)}
                style={{ width: '100px' }}
              />
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>min</span>
            </div>
          </div>
        </div>

        {/* 3. Reflection / Observations */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            Quick Reflection (What worked? Any blockers?)
          </label>
          <Textarea
            placeholder="e.g. Cleared 4 proofs without interruption. Energy was sharp."
            value={reflection}
            onChange={(e) => setReflection(e.target.value)}
            rows={2}
          />
        </div>

        {/* 4. Rescheduling Actions (if partial or missed) */}
        {(status === 'partial' || status === 'missed') && (
          <div
            style={{
              padding: '12px 14px',
              backgroundColor: 'rgba(255, 107, 74, 0.08)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid rgba(255, 107, 74, 0.2)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <Sparkles size={14} color="var(--color-coral-500)" />
              <strong style={{ fontSize: 'var(--text-caption)', color: 'var(--text-primary)' }}>
                Frictionless Rescheduling
              </strong>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setRescheduleChoice('next_hour')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: rescheduleChoice === 'next_hour' ? '1.5px solid var(--color-coral-500)' : '1px solid var(--border-subtle)',
                  background: rescheduleChoice === 'next_hour' ? 'rgba(255, 107, 74, 0.18)' : 'var(--bg-surface-primary)',
                  color: rescheduleChoice === 'next_hour' ? 'var(--color-coral-500)' : 'var(--text-primary)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <ArrowRight size={12} />
                Move to Next Hour
              </button>

              <button
                type="button"
                onClick={() => setRescheduleChoice('tomorrow')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: rescheduleChoice === 'tomorrow' ? '1.5px solid var(--color-coral-500)' : '1px solid var(--border-subtle)',
                  background: rescheduleChoice === 'tomorrow' ? 'rgba(255, 107, 74, 0.18)' : 'var(--bg-surface-primary)',
                  color: rescheduleChoice === 'tomorrow' ? 'var(--color-coral-500)' : 'var(--text-primary)',
                  fontSize: 'var(--text-caption)',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
              >
                <Calendar size={12} />
                Plan for Tomorrow
              </button>

              <button
                type="button"
                onClick={() => setRescheduleChoice('none')}
                style={{
                  padding: '6px 12px',
                  borderRadius: 'var(--radius-sm)',
                  border: rescheduleChoice === 'none' ? '1.5px solid var(--text-muted)' : '1px solid var(--border-subtle)',
                  background: rescheduleChoice === 'none' ? 'var(--bg-surface-secondary)' : 'var(--bg-surface-primary)',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-caption)',
                  cursor: 'pointer'
                }}
              >
                Done with task
              </button>
            </div>

            {rescheduleChoice !== 'none' && (
              <div style={{ marginTop: '10px' }}>
                <Input
                  placeholder="Optional next step note (e.g. 'Solve remaining 2 edge cases')"
                  value={nextAction}
                  onChange={(e) => setNextAction(e.target.value)}
                  style={{ fontSize: 'var(--text-caption)' }}
                />
              </div>
            )}
          </div>
        )}

        {/* Modal Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
          <Button type="button" variant="secondary" onClick={onClose} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={isSubmitting}>
            Save Reflection
          </Button>
        </div>
      </form>
    </Modal>
  );
};
