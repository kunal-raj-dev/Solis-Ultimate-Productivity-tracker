import React, { useState } from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';
import { Textarea } from '../../ui/Textarea/Textarea';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import { Sparkles, Flame, Zap, Check, ShieldAlert } from 'lucide-react';
import './PostFocusReflectionModal.css';

export interface PostFocusReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionMinutes: number;
  subjectName?: string;
  topicTitle?: string;
  targetOutcome?: string;
  onSaveSession: (data: {
    flowQuality: number;
    interruptionsCount: number;
    notes?: string;
    synthesizeNote: boolean;
  }) => Promise<void>;
}

export const PostFocusReflectionModal: React.FC<PostFocusReflectionModalProps> = ({
  isOpen,
  onClose,
  sessionMinutes,
  subjectName,
  topicTitle,
  targetOutcome,
  onSaveSession
}) => {
  const [flowQuality, setFlowQuality] = useState<number>(4);
  const [interruptions, setInterruptions] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [synthesizeNote, setSynthesizeNote] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSession({
        flowQuality,
        interruptionsCount: interruptions,
        notes: notes.trim() || undefined,
        synthesizeNote
      });
      onClose();
    } catch (err) {
      console.error('Failed to record session reflection:', err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Focus Session Complete — Reflect & Integrate"
    >
      <form onSubmit={handleSubmit} className="solis-post-focus-modal">
        {/* Session Accomplishment Header */}
        <div className="solis-session-badge-strip">
          <div style={{ flex: 1 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '2px' }}>
              <Badge variant="coral">{sessionMinutes} Minutes Logged</Badge>
              {subjectName && <Badge variant="neutral">{subjectName}</Badge>}
            </div>
            {targetOutcome ? (
              <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Target: {targetOutcome}
              </p>
            ) : topicTitle ? (
              <p style={{ margin: 0, fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)' }}>
                Topic: {topicTitle}
              </p>
            ) : null}
          </div>
        </div>

        {/* Flow Quality Rating */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: '6px' }}>
            Flow & Immersion Quality
          </label>
          <div className="solis-flow-quality-pills">
            {[
              { score: 1, label: 'Friction', icon: <ShieldAlert size={14} /> },
              { score: 2, label: 'Scattered', icon: <Zap size={14} /> },
              { score: 3, label: 'Moderate', icon: <Zap size={14} /> },
              { score: 4, label: 'High Focus', icon: <Flame size={14} /> },
              { score: 5, label: 'Deep Flow', icon: <Sparkles size={14} /> }
            ].map(({ score, label, icon }) => (
              <button
                key={score}
                type="button"
                className={`solis-flow-quality-pill ${flowQuality === score ? 'solis-flow-quality-pill--selected' : ''}`}
                onClick={() => setFlowQuality(score)}
              >
                {icon}
                <span>{score} • {label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Interruptions Count */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: '6px' }}>
            Distraction Interruptions
          </label>
          <div style={{ display: 'flex', gap: '8px' }}>
            {[0, 1, 2, 3, 4].map((count) => (
              <button
                key={count}
                type="button"
                className={`solis-score-pill ${interruptions === count ? 'solis-score-pill--selected' : ''}`}
                style={{ flex: 1, padding: '6px 0' }}
                onClick={() => setInterruptions(count)}
              >
                <span>{count === 4 ? '4+' : count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Key Takeaways & Distillations */}
        <Textarea
          label="Key Insights & Distillations"
          placeholder="What breakthroughs, proofs, or equations became crystal clear?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        {/* 1-Click Note Synthesis Option */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)' }}>
          <Checkbox
            checked={synthesizeNote}
            onChange={(e) => setSynthesizeNote(e.target.checked)}
            aria-label="Synthesize into permanent note"
          />
          <div style={{ fontSize: 'var(--text-body-sm)' }}>
            <span style={{ fontWeight: 600 }}>Synthesize into Knowledge Note</span>
            <span style={{ display: 'block', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              Automatically saves insights to Notes with subject & topic backlink.
            </span>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid var(--border-subtle)', paddingTop: '12px' }}>
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Skip Reflection
          </Button>
          <Button variant="primary" size="sm" type="submit" isLoading={isSaving} leftIcon={<Check size={14} />}>
            Record & Close Sanctuary
          </Button>
        </div>
      </form>
    </Modal>
  );
};
