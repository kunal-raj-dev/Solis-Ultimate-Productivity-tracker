import React, { useState } from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Textarea } from '../../ui/Textarea/Textarea';
import { DailyReflection } from '../../../types/reflection';
import {
  Zap,
  Flame,
  ArrowRight,
  ArrowLeft,
  Plus,
  Trash2,
  Check
} from 'lucide-react';
import './EveningClosureModal.css';

export interface EveningClosureModalProps {
  isOpen: boolean;
  onClose: () => void;
  todaySummary: {
    studyMinutes: number;
    tasksCompleted: number;
    habitsCompleted: number;
    reviewsCompleted: number;
  };
  onSaveReflection: (reflection: Partial<DailyReflection>) => Promise<void>;
}

export const EveningClosureModal: React.FC<EveningClosureModalProps> = ({
  isOpen,
  onClose,
  todaySummary,
  onSaveReflection
}) => {
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form states
  const [energyScore, setEnergyScore] = useState<number>(4);
  const [focusScore, setFocusScore] = useState<number>(4);
  const [wins, setWins] = useState<string[]>(['']);
  const [frictions, setFrictions] = useState<string[]>(['']);
  const [tomorrowIntentions, setTomorrowIntentions] = useState<string[]>(['']);
  const [synthesisNotes, setSynthesisNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleAddWin = () => setWins((prev) => [...prev, '']);
  const handleRemoveWin = (index: number) => setWins((prev) => prev.filter((_, i) => i !== index));
  const handleUpdateWin = (index: number, val: string) =>
    setWins((prev) => prev.map((w, i) => (i === index ? val : w)));

  const handleAddFriction = () => setFrictions((prev) => [...prev, '']);
  const handleRemoveFriction = (index: number) => setFrictions((prev) => prev.filter((_, i) => i !== index));
  const handleUpdateFriction = (index: number, val: string) =>
    setFrictions((prev) => prev.map((f, i) => (i === index ? val : f)));

  const handleAddIntention = () => setTomorrowIntentions((prev) => [...prev, '']);
  const handleRemoveIntention = (index: number) => setTomorrowIntentions((prev) => prev.filter((_, i) => i !== index));
  const handleUpdateIntention = (index: number, val: string) =>
    setTomorrowIntentions((prev) => prev.map((t, i) => (i === index ? val : t)));

  const handleComplete = async () => {
    setIsSubmitting(true);
    try {
      await onSaveReflection({
        energyScore,
        focusScore,
        wins: wins.map((w) => w.trim()).filter(Boolean),
        frictionPoints: frictions.map((f) => f.trim()).filter(Boolean),
        tomorrowIntentions: tomorrowIntentions.map((t) => t.trim()).filter(Boolean),
        synthesisNotes: synthesisNotes.trim() || undefined,
        completedHabitsCount: todaySummary.habitsCompleted,
        completedTasksCount: todaySummary.tasksCompleted,
        studyMinutesLogged: todaySummary.studyMinutes,
        reviewCardsCompleted: todaySummary.reviewsCompleted
      });
      onClose();
    } catch (err) {
      console.error('Failed to save reflection:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Evening Closure & Daily Reflection"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Step Indicator */}
        <div className="solis-reflection-steps">
          {[1, 2, 3, 4].map((s) => (
            <div
              key={s}
              className={`solis-reflection-step-dot ${
                step === s
                  ? 'solis-reflection-step-dot--active'
                  : step > s
                  ? 'solis-reflection-step-dot--completed'
                  : ''
              }`}
            />
          ))}
        </div>

        {/* STEP 1: METRICS & ENERGY RATINGS */}
        {step === 1 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {/* Daily Celebration Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px', textAlign: 'center' }}>
              <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 'var(--text-heading-3)', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-coral-500)', display: 'block' }}>
                  {todaySummary.studyMinutes}m
                </span>
                <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)' }}>Deep Study</span>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 'var(--text-heading-3)', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-amber-500)', display: 'block' }}>
                  {todaySummary.tasksCompleted}
                </span>
                <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)' }}>Tasks Done</span>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 'var(--text-heading-3)', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-sage-500)', display: 'block' }}>
                  {todaySummary.habitsCompleted}
                </span>
                <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)' }}>Habits Kept</span>
              </div>

              <div style={{ padding: '10px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 'var(--text-heading-3)', fontWeight: 700, fontFamily: 'var(--font-display)', color: 'var(--color-lavender-500)', display: 'block' }}>
                  {todaySummary.reviewsCompleted}
                </span>
                <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)' }}>Reviews</span>
              </div>
            </div>

            {/* Energy Score Rating */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: '6px' }}>
                How was your physical & mental energy today?
              </label>
              <div className="solis-score-pills">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    className={`solis-score-pill ${energyScore === score ? 'solis-score-pill--selected' : ''}`}
                    onClick={() => setEnergyScore(score)}
                  >
                    <Zap size={16} />
                    <span>{score}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Focus Score Rating */}
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: '6px' }}>
                How would you rate your cognitive depth & focus?
              </label>
              <div className="solis-score-pills">
                {[1, 2, 3, 4, 5].map((score) => (
                  <button
                    key={score}
                    type="button"
                    className={`solis-score-pill ${focusScore === score ? 'solis-score-pill--selected-amber' : ''}`}
                    onClick={() => setFocusScore(score)}
                  >
                    <Flame size={16} />
                    <span>{score}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: CELEBRATE WINS */}
        {step === 2 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-body-md)', fontWeight: 600 }}>
                What went right today? (Key Wins)
              </h4>
              <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                Capture breakthroughs, mastered concepts, or disciplined habits.
              </p>
            </div>

            {wins.map((w, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Input
                  placeholder={`Win #${idx + 1}...`}
                  value={w}
                  onChange={(e) => handleUpdateWin(idx, e.target.value)}
                  autoFocus={idx === 0}
                />
                {wins.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveWin(idx)}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}

            <Button variant="ghost" size="sm" leftIcon={<Plus size={14} />} onClick={handleAddWin}>
              Add Another Win
            </Button>
          </div>
        )}

        {/* STEP 3: FRICTION & OBSTACLES */}
        {step === 3 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-body-md)', fontWeight: 600 }}>
                Where was the friction or distraction?
              </h4>
              <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                Identify energy leaks, procrastination triggers, or conceptual hurdles.
              </p>
            </div>

            {frictions.map((f, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Input
                  placeholder={`Friction point #${idx + 1}...`}
                  value={f}
                  onChange={(e) => handleUpdateFriction(idx, e.target.value)}
                  autoFocus={idx === 0}
                />
                {frictions.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveFriction(idx)}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}

            <Button variant="ghost" size="sm" leftIcon={<Plus size={14} />} onClick={handleAddFriction}>
              Add Another Friction Point
            </Button>
          </div>
        )}

        {/* STEP 4: TOMORROW INTENTIONS & SYNTHESIS */}
        {step === 4 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-body-md)', fontWeight: 600 }}>
                Tomorrow&apos;s Core Priorities & Closure
              </h4>
              <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                Lock in your high-leverage intentions before shutting down for the night.
              </p>
            </div>

            {tomorrowIntentions.map((t, idx) => (
              <div key={idx} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                <Input
                  placeholder={`Tomorrow intention #${idx + 1}...`}
                  value={t}
                  onChange={(e) => handleUpdateIntention(idx, e.target.value)}
                  autoFocus={idx === 0}
                />
                {tomorrowIntentions.length > 1 && (
                  <Button variant="ghost" size="sm" onClick={() => handleRemoveIntention(idx)}>
                    <Trash2 size={14} />
                  </Button>
                )}
              </div>
            ))}

            <Button variant="ghost" size="sm" leftIcon={<Plus size={14} />} onClick={handleAddIntention}>
              Add Priority Intention
            </Button>

            <Textarea
              label="Evening Journal / Freeform Synthesis"
              placeholder="Closing thoughts, mental state, or gratitude..."
              value={synthesisNotes}
              onChange={(e) => setSynthesisNotes(e.target.value)}
            />
          </div>
        )}

        {/* Navigation Buttons */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--border-subtle)', paddingTop: '14px', marginTop: '6px' }}>
          {step > 1 ? (
            <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => setStep((s) => (s - 1) as any)}>
              Back
            </Button>
          ) : (
            <Button variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </Button>
          )}

          {step < 4 ? (
            <Button variant="primary" size="sm" rightIcon={<ArrowRight size={14} />} onClick={() => setStep((s) => (s + 1) as any)}>
              Next Step
            </Button>
          ) : (
            <Button variant="primary" size="sm" isLoading={isSubmitting} leftIcon={<Check size={14} />} onClick={handleComplete}>
              Complete Evening Closure
            </Button>
          )}
        </div>
      </div>
    </Modal>
  );
};
