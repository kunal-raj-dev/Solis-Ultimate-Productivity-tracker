import React, { useState, useRef, useEffect } from 'react';
import { X, Zap, Sparkles, CheckSquare, HelpCircle, ArrowRight } from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { useFocus } from '../../../context/FocusContext';
import './CognitiveDriftPad.css';

export interface CognitiveDriftPadProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CognitiveDriftPad: React.FC<CognitiveDriftPadProps> = ({ isOpen, onClose }) => {
  const { parkThought, parkedThoughts } = useFocus();
  const [text, setText] = useState('');
  const [type, setType] = useState<'task' | 'note' | 'question'>('task');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);

      const handleGlobalKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          onClose();
        }
      };
      window.addEventListener('keydown', handleGlobalKeyDown);
      return () => window.removeEventListener('keydown', handleGlobalKeyDown);
    } else {
      setText('');
      setFeedback(null);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const trimmed = text.trim();
    if (!trimmed) return;

    setIsSubmitting(true);
    try {
      await parkThought(trimmed, type);
      setText('');
      setFeedback(`Anchored as ${type === 'task' ? 'Actionable Task' : type === 'note' ? 'Idea Spark' : 'Parked Question'}`);
      setTimeout(() => {
        setFeedback(null);
        textareaRef.current?.focus();
      }, 1800);
    } catch (err) {
      console.error('Failed to park thought:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  return (
    <div
      className="solis-drift-pad-overlay"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      role="dialog"
      aria-modal="true"
      aria-label="Cognitive Drift Pad"
    >
      <div className="solis-drift-pad">
        {/* Header */}
        <div className="solis-drift-pad__header">
          <div className="solis-drift-pad__title-wrap">
            <Zap size={16} color="var(--color-coral-400)" />
            <span className="solis-drift-pad__title">Cognitive Drift Pad</span>
            <span className="solis-drift-pad__badge">Flow Shield</span>
          </div>
          <button
            type="button"
            className="solis-drift-pad__close"
            onClick={onClose}
            aria-label="Close Drift Pad"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="solis-drift-pad__body">
          <div className="solis-drift-pad__type-selector">
            <button
              type="button"
              className={`solis-drift-pad__type-btn ${type === 'task' ? 'solis-drift-pad__type-btn--active' : ''}`}
              onClick={() => setType('task')}
            >
              <CheckSquare size={13} />
              <span>To-Do Task</span>
            </button>
            <button
              type="button"
              className={`solis-drift-pad__type-btn ${type === 'note' ? 'solis-drift-pad__type-btn--active' : ''}`}
              onClick={() => setType('note')}
            >
              <Sparkles size={13} />
              <span>Idea Spark</span>
            </button>
            <button
              type="button"
              className={`solis-drift-pad__type-btn ${type === 'question' ? 'solis-drift-pad__type-btn--active' : ''}`}
              onClick={() => setType('question')}
            >
              <HelpCircle size={13} />
              <span>Question</span>
            </button>
          </div>

          <textarea
            ref={textareaRef}
            className="solis-drift-pad__input"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              type === 'task'
                ? 'Capture intrusive to-do item... (Enter to anchor to tasks)'
                : type === 'note'
                ? 'Capture sudden idea or insight... (Enter to anchor to notes)'
                : 'Save curiosity or question to investigate after this session...'
            }
            rows={2}
          />

          <div className="solis-drift-pad__footer">
            <span className="solis-drift-pad__hint">
              {feedback ? (
                <span style={{ color: 'var(--color-coral-400)', fontWeight: 600 }}>✓ {feedback}</span>
              ) : (
                'Press Enter to anchor • Esc to close'
              )}
            </span>
            <div style={{ display: 'flex', gap: '8px' }}>
              <Button
                variant="ghost"
                size="sm"
                type="button"
                onClick={onClose}
                style={{ color: 'rgba(255, 255, 255, 0.6)' }}
              >
                Return to Flow
              </Button>
              <Button
                variant="accent"
                size="sm"
                type="submit"
                isLoading={isSubmitting}
                disabled={!text.trim()}
                rightIcon={<ArrowRight size={13} />}
              >
                Anchor
              </Button>
            </div>
          </div>
        </form>

        {/* Recently Parked In This Session */}
        {parkedThoughts.length > 0 && (
          <div className="solis-drift-pad__recent-list">
            <div className="solis-drift-pad__recent-title">
              Parked this session ({parkedThoughts.length})
            </div>
            {parkedThoughts.slice(-3).reverse().map((pt) => (
              <div key={pt.id} className="solis-drift-pad__thought-item">
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '380px' }}>
                  {pt.text}
                </span>
                <span className="solis-drift-pad__thought-type">{pt.type}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
