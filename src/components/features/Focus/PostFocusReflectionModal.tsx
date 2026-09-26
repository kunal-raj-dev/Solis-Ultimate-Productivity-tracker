import React, { useState, useMemo } from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';
import { Textarea } from '../../ui/Textarea/Textarea';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import { Sparkles, Flame, Zap, Check, ShieldAlert, Shield, BellOff, Minus, Plus } from 'lucide-react';
import { calculateDistractionSummary } from '../../../utils/focus/interruptionTracker';
import { InterruptionEvent } from '../../../types/focus';
import './PostFocusReflectionModal.css';

export interface PostFocusReflectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionMinutes: number;
  subjectName?: string;
  topicTitle?: string;
  targetOutcome?: string;
  taskId?: string;
  taskTitle?: string;
  planItemId?: string;
  parkedThoughts?: Array<{ id: string; text: string; type: string }>;
  initialInternalCount?: number;
  initialExternalCount?: number;
  interruptionsLog?: InterruptionEvent[];
  onSaveSession: (data: {
    flowQuality: number;
    interruptionsCount: number;
    internalInterruptionsCount?: number;
    externalInterruptionsCount?: number;
    notes?: string;
    synthesizeNote: boolean;
    completeLinkedTask?: boolean;
    completePlanItem?: boolean;
  }) => Promise<void>;
}

export const PostFocusReflectionModal: React.FC<PostFocusReflectionModalProps> = ({
  isOpen,
  onClose,
  sessionMinutes,
  subjectName,
  topicTitle,
  targetOutcome,
  taskId,
  taskTitle,
  planItemId,
  parkedThoughts,
  initialInternalCount,
  initialExternalCount,
  interruptionsLog,
  onSaveSession
}) => {
  const [flowQuality, setFlowQuality] = useState<number>(4);
  const [internalCount, setInternalCount] = useState<number>(() => {
    if (initialInternalCount !== undefined) return initialInternalCount;
    if (interruptionsLog && interruptionsLog.length > 0) {
      return interruptionsLog.filter((i) => i.type === 'internal').length;
    }
    return parkedThoughts ? Math.min(4, parkedThoughts.length) : 0;
  });
  const [externalCount, setExternalCount] = useState<number>(() => {
    if (initialExternalCount !== undefined) return initialExternalCount;
    if (interruptionsLog && interruptionsLog.length > 0) {
      return interruptionsLog.filter((i) => i.type === 'external').length;
    }
    return 0;
  });
  const [notes, setNotes] = useState('');
  const [synthesizeNote, setSynthesizeNote] = useState(false);
  const [completeLinkedTask, setCompleteLinkedTask] = useState(true);
  const [completePlanItem, setCompletePlanItem] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const totalInterruptions = internalCount + externalCount;

  const distractionSummary = useMemo(() => {
    return calculateDistractionSummary(
      { internal: internalCount, external: externalCount },
      sessionMinutes
    );
  }, [internalCount, externalCount, sessionMinutes]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSaveSession({
        flowQuality,
        interruptionsCount: totalInterruptions,
        internalInterruptionsCount: internalCount,
        externalInterruptionsCount: externalCount,
        notes: notes.trim() || undefined,
        synthesizeNote,
        completeLinkedTask: taskId ? completeLinkedTask : undefined,
        completePlanItem: planItemId ? completePlanItem : undefined
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

        {/* Feature 2.5: Attentional Friction & Distraction Breakdown */}
        <div style={{ padding: '12px 14px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Shield size={16} color="var(--color-coral-500)" />
              <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Attentional Friction & Distraction Log
              </span>
            </div>
            <Badge variant={distractionSummary.frictionTier === 'pristine' ? 'coral' : distractionSummary.frictionTier === 'mild' ? 'neutral' : 'amber'}>
              {distractionSummary.frictionLabel} ({distractionSummary.focusScore}% Flow)
            </Badge>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: '10px' }}>
            {/* Internal Mind Drift */}
            <div style={{ padding: '8px 12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Zap size={13} color="var(--color-amber-500)" /> Internal Drift
                </span>
                <span style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {internalCount}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setInternalCount((p) => Math.max(0, p - 1))}
                  style={{ flex: 1, padding: '4px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}
                  aria-label="Decrease internal drift count"
                >
                  <Minus size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setInternalCount((p) => p + 1)}
                  style={{ flex: 1, padding: '4px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}
                  aria-label="Increase internal drift count"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>

            {/* External Surrounding Interruption */}
            <div style={{ padding: '8px 12px', background: 'var(--bg-surface-elevated)', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-subtle)' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <BellOff size={13} color="var(--color-coral-500)" /> External Intrusions
                </span>
                <span style={{ fontSize: 'var(--text-caption)', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {externalCount}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <button
                  type="button"
                  onClick={() => setExternalCount((p) => Math.max(0, p - 1))}
                  style={{ flex: 1, padding: '4px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}
                  aria-label="Decrease external intrusion count"
                >
                  <Minus size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => setExternalCount((p) => p + 1)}
                  style={{ flex: 1, padding: '4px', borderRadius: 'var(--radius-xs)', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-primary)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-primary)' }}
                  aria-label="Increase external intrusion count"
                >
                  <Plus size={12} />
                </button>
              </div>
            </div>
          </div>

          {/* Metacognitive Guidance */}
          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 1.4, background: 'rgba(0,0,0,0.1)', padding: '8px 10px', borderRadius: 'var(--radius-xs)' }}>
            <p style={{ margin: 0, fontWeight: 500, color: 'var(--text-primary)' }}>{distractionSummary.reflectionPrompt}</p>
            {distractionSummary.cognitiveInsight && (
              <p style={{ margin: '3px 0 0', fontSize: '11px', color: 'var(--text-muted)' }}>
                {distractionSummary.cognitiveInsight}
              </p>
            )}
          </div>
        </div>

        {/* Parked Thoughts During Session */}
        {parkedThoughts && parkedThoughts.length > 0 && (
          <div style={{ padding: '10px 12px', background: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
              <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-primary)' }}>
                Parked Thoughts Captured ({parkedThoughts.length})
              </span>
              <span style={{ fontSize: '11px', color: 'var(--color-coral-500)', fontWeight: 500 }}>Preserved in System</span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', maxHeight: '100px', overflowY: 'auto' }}>
              {parkedThoughts.map((pt) => (
                <div key={pt.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                  <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '320px' }}>• {pt.text}</span>
                  <Badge variant="neutral" style={{ fontSize: '10px', textTransform: 'capitalize' }}>{pt.type}</Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Key Takeaways & Distillations */}
        <Textarea
          label="Key Insights & Distillations"
          placeholder="What breakthroughs, proofs, or equations became crystal clear?"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
        />

        {/* Linked Task Completion Option */}
        {taskTitle && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <Checkbox
              checked={completeLinkedTask}
              onChange={(e) => setCompleteLinkedTask(e.target.checked)}
              aria-label="Mark linked task completed"
            />
            <div style={{ fontSize: 'var(--text-body-sm)' }}>
              <span style={{ fontWeight: 600 }}>Mark Linked Task as Completed</span>
              <span style={{ display: 'block', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                "{taskTitle}" will be marked completed with logged focus time.
              </span>
            </div>
          </div>
        )}

        {/* Linked Study Plan Item Completion Option */}
        {planItemId && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
            <Checkbox
              checked={completePlanItem}
              onChange={(e) => setCompletePlanItem(e.target.checked)}
              aria-label="Mark study plan item completed"
            />
            <div style={{ fontSize: 'var(--text-body-sm)' }}>
              <span style={{ fontWeight: 600 }}>Mark Study Syllabus Item as Completed</span>
              <span style={{ display: 'block', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                Updates your daily study plan & syllabus progress.
              </span>
            </div>
          </div>
        )}

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
            Record & Complete Session
          </Button>
        </div>
      </form>
    </Modal>
  );
};
