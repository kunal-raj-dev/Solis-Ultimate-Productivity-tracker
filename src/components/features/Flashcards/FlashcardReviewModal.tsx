import React, { useState, useEffect, useCallback } from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Progress } from '../../ui/Progress/Progress';
import { Badge } from '../../ui/Badge/Badge';
import { Flashcard, CardRating } from '../../../types/learning';
import { Sparkles, RotateCw, CheckCircle2, BookOpen } from 'lucide-react';
import './FlashcardReviewModal.css';

export interface FlashcardReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Flashcard[];
  onRecordAttempt: (cardId: string, rating: CardRating) => Promise<void>;
  onCompleteSession?: (totalReviewed: number) => void;
}

export const FlashcardReviewModal: React.FC<FlashcardReviewModalProps> = ({
  isOpen,
  onClose,
  cards,
  onRecordAttempt,
  onCompleteSession
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [isFinished, setIsFinished] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setCurrentIndex(0);
      setIsFlipped(false);
      setReviewedCount(0);
      setIsFinished(false);
    }
  }, [isOpen]);

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  const handleRating = useCallback(async (rating: CardRating) => {
    const currentCard = cards[currentIndex];
    if (!currentCard) return;

    await onRecordAttempt(currentCard.id, rating);
    const nextReviewed = reviewedCount + 1;
    setReviewedCount(nextReviewed);

    if (currentIndex + 1 < cards.length) {
      setIsFlipped(false);
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsFinished(true);
      if (onCompleteSession) onCompleteSession(nextReviewed);
    }
  }, [cards, currentIndex, onRecordAttempt, onCompleteSession, reviewedCount]);

  // Keyboard navigation for active recall power users
  useEffect(() => {
    if (!isOpen || isFinished) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input or textarea
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === 'Space' || e.key === 'Enter') {
        e.preventDefault();
        handleFlip();
      } else if (isFlipped) {
        if (e.key === '1') {
          e.preventDefault();
          handleRating('again');
        } else if (e.key === '2') {
          e.preventDefault();
          handleRating('hard');
        } else if (e.key === '3') {
          e.preventDefault();
          handleRating('good');
        } else if (e.key === '4') {
          e.preventDefault();
          handleRating('easy');
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isFinished, isFlipped, handleFlip, handleRating]);

  if (!isOpen) return null;

  const currentCard = cards[currentIndex];
  const progressPercent = cards.length > 0 ? (reviewedCount / cards.length) * 100 : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isFinished ? 'Active Recall Complete' : 'Active Recall Sanctuary'}
    >
      <div style={{ padding: '4px 0' }}>
        {!isFinished && currentCard ? (
          <>
            {/* Header / Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Badge variant="coral">{currentCard.subjectName || 'Study Subject'}</Badge>
                {currentCard.topicTitle && (
                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                    • {currentCard.topicTitle}
                  </span>
                )}
              </div>
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                Card {currentIndex + 1} of {cards.length}
              </span>
            </div>

            <Progress value={progressPercent} size="sm" variant="coral" />

            {/* 3D Flipping Card */}
            <div className="solis-card-flip-container" onClick={handleFlip}>
              <div className={`solis-card-flip-inner ${isFlipped ? 'is-flipped' : ''}`}>
                {/* Front Face */}
                <div className="solis-card-face solis-card-face--front">
                  <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                    Prompt / Question
                  </span>
                  <div className="solis-card-prompt">{currentCard.frontPrompt}</div>
                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: 'auto' }}>
                    <RotateCw size={14} /> Click card or press <kbd style={{ padding: '2px 5px', fontSize: '10px', borderRadius: '4px', background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)' }}>Space</kbd> to flip
                  </span>
                </div>

                {/* Back Face */}
                <div className="solis-card-face solis-card-face--back">
                  <span style={{ fontSize: 'var(--text-micro)', color: 'var(--color-coral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                    Active Retrieval Answer
                  </span>
                  <div className="solis-card-answer">{currentCard.backAnswer}</div>
                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                    Rate retrieval difficulty (<kbd style={{ padding: '1px 4px', fontSize: '10px', borderRadius: '3px', background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)' }}>1-4</kbd>) below
                  </span>
                </div>
              </div>
            </div>

            {/* Difficulty Rating Actions (SM-2 Spaced Retrieval) */}
            {isFlipped && (
              <div className="solis-recall-actions animate-fade-in">
                <button
                  className="solis-recall-btn solis-recall-btn--again"
                  onClick={() => handleRating('again')}
                >
                  <span className="solis-recall-btn__label" style={{ color: 'var(--status-error)' }}>[1] Again</span>
                  <span className="solis-recall-btn__interval">&lt; 1 day</span>
                </button>

                <button
                  className="solis-recall-btn solis-recall-btn--hard"
                  onClick={() => handleRating('hard')}
                >
                  <span className="solis-recall-btn__label" style={{ color: 'var(--status-warning)' }}>[2] Hard</span>
                  <span className="solis-recall-btn__interval">1-2 days</span>
                </button>

                <button
                  className="solis-recall-btn solis-recall-btn--good"
                  onClick={() => handleRating('good')}
                >
                  <span className="solis-recall-btn__label" style={{ color: 'var(--color-sage-600)' }}>[3] Good</span>
                  <span className="solis-recall-btn__interval">3-4 days</span>
                </button>

                <button
                  className="solis-recall-btn solis-recall-btn--easy"
                  onClick={() => handleRating('easy')}
                >
                  <span className="solis-recall-btn__label" style={{ color: 'var(--color-lavender-500)' }}>[4] Easy</span>
                  <span className="solis-recall-btn__interval">6-7 days</span>
                </button>
              </div>
            )}
          </>
        ) : isFinished ? (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl) var(--space-md)' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'var(--color-sage-100)',
                color: 'var(--color-sage-600)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 'var(--space-md)'
              }}
            >
              <CheckCircle2 size={28} />
            </div>

            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-2)', marginBottom: '8px' }}>
              Memory Reinforced
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body-sm)', maxWidth: '420px', margin: '0 auto var(--space-xl)', lineHeight: 1.6 }}>
              You completed active recall on {reviewedCount} flashcards. Spaced repetition intervals and syllabus mastery signals have been updated.
            </p>

            <Button variant="primary" onClick={onClose} leftIcon={<Sparkles size={16} />}>
              Return to Study Studio
            </Button>
          </div>
        ) : (
          <div style={{ textAlign: 'center', padding: 'var(--space-xl)' }}>
            <BookOpen size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: 'var(--text-secondary)' }}>No cards currently due in this deck.</p>
          </div>
        )}
      </div>
    </Modal>
  );
};
