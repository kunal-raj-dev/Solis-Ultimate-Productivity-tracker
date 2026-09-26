import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Progress } from '../../ui/Progress/Progress';
import { Badge } from '../../ui/Badge/Badge';
import { Flashcard, CardRating } from '../../../types/learning';
import {
  requeueCardInSession,
  resolvePresentationOrder,
  ReviewSessionQueues,
  calculateNextCardReview,
  DEFAULT_REQUEST_RETENTION
} from '../../../utils/learning/spacedRepetition';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../context/ToastContext';
import { dataService } from '../../../services/dataService';
import {
  isCardLeech,
  generateConceptAtomization,
  updateCardLapseTelemetry,
  AtomizedCardPair
} from '../../../utils/learning/leechDetector';
import { Sparkles, RotateCw, CheckCircle2, BookOpen, Scissors, AlertTriangle } from 'lucide-react';
import './FlashcardReviewModal.css';

export interface FlashcardReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  cards: Flashcard[];
  onRecordAttempt: (cardId: string, rating: CardRating) => Promise<void>;
  onCompleteSession?: (totalReviewed: number) => void;
  requestRetention?: number;
  isCramMode?: boolean;
}

/**
 * Active Recall session state machine (plan §1.4 — intra-day re-queueing).
 *
 * Two queues drive the session: `activeQueue` (cards not yet passed) and
 * `learningQueue` (cards rated `again`, FIFO failure order). A failed card is
 * never ejected from the session — it re-surfaces after the active queue is
 * exhausted or after 5 intervening cards, and the final SM-2 schedule
 * (`nextReviewDate = tomorrow`) is only committed once the card is passed
 * (`hard` / `good` / `easy`) within the session.
 */
export const FlashcardReviewModal: React.FC<FlashcardReviewModalProps> = ({
  isOpen,
  onClose,
  cards,
  onRecordAttempt,
  onCompleteSession,
  requestRetention,
  isCramMode = false
}) => {
  const { user } = useAuth();
  const { addToast } = useToast();
  const activeRetention = requestRetention ?? user?.preferences?.fsrsRetention ?? DEFAULT_REQUEST_RETENTION;
  const [activeQueue, setActiveQueue] = useState<string[]>([]);
  const [learningQueue, setLearningQueue] = useState<string[]>([]);
  const [presentedSinceLearning, setPresentedSinceLearning] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [isFinished, setIsFinished] = useState(false);

  // Feature 3.4: Active Leech Detection & Concept Atomization
  const [isAtomizeOpen, setIsAtomizeOpen] = useState(false);
  const [atomizedPair, setAtomizedPair] = useState<AtomizedCardPair | null>(null);
  const [atomizedP1, setAtomizedP1] = useState({ prompt: '', answer: '' });
  const [atomizedP2, setAtomizedP2] = useState({ prompt: '', answer: '' });
  const [isAtomizing, setIsAtomizing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setActiveQueue(cards.map((card) => card.id));
      setLearningQueue([]);
      setPresentedSinceLearning(0);
      setIsFlipped(false);
      setIsFinished(false);
    }
  }, [isOpen, cards]);

  const presentationOrder = resolvePresentationOrder(
    { activeQueue, learningQueue } as ReviewSessionQueues,
    presentedSinceLearning
  );
  const currentCardId = presentationOrder[0];
  const currentCard = cards.find((card) => card.id === currentCardId);
  const isRepresenting = currentCardId !== undefined && learningQueue.includes(currentCardId);

  const cardIsLeech = currentCard ? isCardLeech(currentCard) : false;

  const handleOpenAtomize = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!currentCard) return;
    const pair = generateConceptAtomization(currentCard);
    setAtomizedPair(pair);
    setAtomizedP1({ prompt: pair.card1.frontPrompt, answer: pair.card1.backAnswer });
    setAtomizedP2({ prompt: pair.card2.frontPrompt, answer: pair.card2.backAnswer });
    setIsAtomizeOpen(true);
  };

  const handleConfirmAtomize = async () => {
    if (!currentCard || !atomizedP1.prompt || !atomizedP2.prompt) return;
    setIsAtomizing(true);
    try {
      // 1. Create two new atomic cards
      await dataService.flashcards.createFlashcard({
        subjectId: currentCard.subjectId,
        subjectName: currentCard.subjectName,
        topicId: currentCard.topicId,
        topicTitle: currentCard.topicTitle,
        noteId: currentCard.noteId,
        frontPrompt: atomizedP1.prompt,
        backAnswer: atomizedP1.answer,
        cardType: 'standard',
        difficultyRating: 'good',
        intervalDays: 1,
        repetitionCount: 0,
        easeFactor: 2.5,
        isLeech: false,
        lapsesCount: 0
      });

      await dataService.flashcards.createFlashcard({
        subjectId: currentCard.subjectId,
        subjectName: currentCard.subjectName,
        topicId: currentCard.topicId,
        topicTitle: currentCard.topicTitle,
        noteId: currentCard.noteId,
        frontPrompt: atomizedP2.prompt,
        backAnswer: atomizedP2.answer,
        cardType: 'standard',
        difficultyRating: 'good',
        intervalDays: 1,
        repetitionCount: 0,
        easeFactor: 2.5,
        isLeech: false,
        lapsesCount: 0
      });

      // 2. Mark parent card as resolved/reset leech status
      await dataService.flashcards.updateFlashcard(currentCard.id, {
        isLeech: false,
        lapsesCount: 0
      });

      // 3. Remove from session queues
      const nextActive = activeQueue.filter((id) => id !== currentCard.id);
      const nextLearning = learningQueue.filter((id) => id !== currentCard.id);
      setActiveQueue(nextActive);
      setLearningQueue(nextLearning);
      setIsAtomizeOpen(false);
      setIsFlipped(false);

      addToast({
        title: 'Concept Atomized',
        description: 'Split into 2 focused cards. Overloaded leech card resolved.',
        type: 'success'
      });

      if (nextActive.length === 0 && nextLearning.length === 0) {
        setIsFinished(true);
        onCompleteSession?.(totalCards);
      }
    } catch {
      addToast({
        title: 'Atomization Failed',
        description: 'Could not create atomic flashcards. Please try again.',
        type: 'error'
      });
    } finally {
      setIsAtomizing(false);
    }
  };

  const intervals = useMemo(() => {
    if (!currentCard) return null;
    if (isCramMode) {
      return {
        again: 'Re-test in session',
        hard: 'Pass (Session Only)',
        good: 'Pass (Session Only)',
        easy: 'Pass (Session Only)',
      };
    }
    const now = new Date();
    const formatInterval = (days: number) => {
      if (days <= 0) return '< 1 day';
      if (days === 1) return '1 day';
      return `${days} days`;
    };
    return {
      again: '< 1 day',
      hard: formatInterval(calculateNextCardReview(currentCard, 'hard', now, activeRetention).intervalDays),
      good: formatInterval(calculateNextCardReview(currentCard, 'good', now, activeRetention).intervalDays),
      easy: formatInterval(calculateNextCardReview(currentCard, 'easy', now, activeRetention).intervalDays),
    };
  }, [currentCard, activeRetention, isCramMode]);

  const totalCards = cards.length;
  const resolvedCount = totalCards - (activeQueue.length + learningQueue.length);
  const progressPercent = totalCards > 0 ? (resolvedCount / totalCards) * 100 : 0;

  const handleFlip = useCallback(() => {
    setIsFlipped((prev) => !prev);
  }, []);

  // In-flight guard: a rapid second rating while onRecordAttempt is awaited
  // must never commit the same card's SM-2 schedule twice.
  const isCommittingRef = React.useRef(false);

  const handleRating = useCallback(async (rating: CardRating) => {
    if (isCommittingRef.current) return;
    const cardId = presentationOrder[0];
    if (!cardId) return;
    isCommittingRef.current = true;

    try {
      let nextActive = activeQueue;
      let nextLearning = learningQueue;
      let nextPresentedSinceLearning = presentedSinceLearning;

      if (rating === 'again') {
        // Track lapse telemetry
        if (currentCard && !isCramMode) {
          const telemetry = updateCardLapseTelemetry(currentCard, 'again');
          currentCard.lapsesCount = telemetry.lapsesCount;
          currentCard.lastLapseAt = telemetry.lastLapseAt;
          currentCard.isLeech = telemetry.isLeech;
          void dataService.flashcards.updateFlashcard(cardId, telemetry).catch(() => {});
        }
        // Intra-day re-queue: the card stays in the session (step 0) and the
        // final tomorrow schedule is NOT committed yet.
        const next = requeueCardInSession({ activeQueue, learningQueue }, cardId);
        nextActive = next.activeQueue;
        nextLearning = next.learningQueue;
        nextPresentedSinceLearning = 0;
      } else {
        // Successful recall (hard / good / easy) commits the SM-2 schedule only if NOT in exam cram mode.
        if (!isCramMode) {
          await onRecordAttempt(cardId, rating);
        }
        if (learningQueue.includes(cardId)) {
          nextLearning = learningQueue.filter((id) => id !== cardId);
          nextPresentedSinceLearning = 0;
        } else {
          nextActive = activeQueue.filter((id) => id !== cardId);
          nextPresentedSinceLearning = presentedSinceLearning + 1;
        }
      }

      setActiveQueue(nextActive);
      setLearningQueue(nextLearning);
      setPresentedSinceLearning(nextPresentedSinceLearning);
      setIsFlipped(false);

      // The session only completes once every failed card has been passed.
      if (nextActive.length === 0 && nextLearning.length === 0) {
        setIsFinished(true);
        onCompleteSession?.(totalCards);
      }
    } finally {
      isCommittingRef.current = false;
    }
  }, [presentationOrder, activeQueue, learningQueue, presentedSinceLearning, onRecordAttempt, onCompleteSession, totalCards]);

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

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isFinished
          ? (isCramMode ? 'Exam Cram Complete' : 'Active Recall Complete')
          : (isCramMode ? 'Exam Cram Sanctuary' : 'Active Recall Sanctuary')
      }
    >
      <div style={{ padding: '4px 0' }}>
        {!isFinished && currentCard ? (
          <>
            {/* Header / Meta */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-md)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                <Badge variant="coral">{currentCard.subjectName || 'Study Subject'}</Badge>
                {isCramMode ? (
                  <Badge variant="amber">Exam Cram (Zero FSRS Damage)</Badge>
                ) : (
                  <Badge variant="neutral">FSRS-5 ({Math.round(activeRetention * 100)}% Retention)</Badge>
                )}
                {currentCard.topicTitle && (
                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                    • {currentCard.topicTitle}
                  </span>
                )}
                {isRepresenting && (
                  <Badge variant="amber">Re-testing in this session</Badge>
                )}
                {cardIsLeech && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                    <Badge variant="amber" title="This concept has 4+ lapses in the rolling 14-day window">
                      ⚡ Struggling Concept (Leech)
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-touch-target"
                      leftIcon={<Scissors size={12} />}
                      onClick={handleOpenAtomize}
                      title="Split this high-friction card into 2 atomic flashcards"
                      style={{ height: '22px', padding: '0 8px', fontSize: '11px' }}
                    >
                      Atomize
                    </Button>
                  </div>
                )}
              </div>
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                Card {Math.min(resolvedCount + 1, totalCards)} of {totalCards}
              </span>
            </div>

            <Progress value={progressPercent} size="sm" variant="coral" />

            {/* 3D Flipping Card */}
            <div className="solis-card-flip-container" onClick={handleFlip}>
              <div className={`solis-card-flip-inner ${isFlipped ? 'is-flipped' : ''}`}>
                {/* Front Face */}
                <div className="solis-card-face solis-card-face--front">
                  <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                    {currentCard.cardType === 'image_occlusion' ? 'Visual Occlusion Prompt' : 'Prompt / Question'}
                  </span>

                  {currentCard.cardType === 'image_occlusion' && currentCard.imageUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '8px' }}>
                      <div style={{ position: 'relative', width: '100%', maxWidth: '440px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#111418' }}>
                        <img
                          src={currentCard.imageUrl}
                          alt="Visual Diagram Prompt"
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                          draggable={false}
                        />
                        {(currentCard.occlusionZones || []).map((zone, idx) => {
                          const isTarget = zone.id === (currentCard.activeOcclusionZoneId || currentCard.occlusionZones?.[0]?.id);
                          return (
                            <div
                              key={zone.id}
                              style={{
                                position: 'absolute',
                                left: `${zone.x}%`,
                                top: `${zone.y}%`,
                                width: `${zone.width}%`,
                                height: `${zone.height}%`,
                                backgroundColor: isTarget ? 'rgba(235, 94, 40, 0.95)' : 'rgba(30, 41, 59, 0.9)',
                                border: isTarget ? '2px solid #fff' : '1px solid rgba(255,255,255,0.2)',
                                boxShadow: isTarget ? '0 0 0 3px rgba(235,94,40,0.4)' : undefined,
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#fff',
                                fontWeight: 700,
                                fontSize: '11px',
                                pointerEvents: 'none'
                              }}
                            >
                              {isTarget ? '?' : `[${idx + 1}]`}
                            </div>
                          );
                        })}
                      </div>
                      <div className="solis-card-prompt" style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                        {currentCard.frontPrompt}
                      </div>
                    </div>
                  ) : (
                    <div className="solis-card-prompt">{currentCard.frontPrompt}</div>
                  )}

                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', display: 'inline-flex', alignItems: 'center', gap: '6px', marginTop: 'auto' }}>
                    <RotateCw size={14} /> Click card or press <kbd style={{ padding: '2px 5px', fontSize: '10px', borderRadius: '4px', background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)' }}>Space</kbd> to flip
                  </span>
                </div>

                {/* Back Face */}
                <div className="solis-card-face solis-card-face--back">
                  <span style={{ fontSize: 'var(--text-micro)', color: 'var(--color-coral-500)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '12px' }}>
                    {currentCard.cardType === 'image_occlusion' ? 'Revealed Visual Diagram' : 'Active Retrieval Answer'}
                  </span>

                  {currentCard.cardType === 'image_occlusion' && currentCard.imageUrl ? (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', gap: '8px' }}>
                      <div style={{ position: 'relative', width: '100%', maxWidth: '440px', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border-subtle)', background: '#111418' }}>
                        <img
                          src={currentCard.imageUrl}
                          alt="Visual Diagram Revealed"
                          style={{ width: '100%', height: 'auto', display: 'block' }}
                          draggable={false}
                        />
                        {(currentCard.occlusionZones || []).map((zone, idx) => {
                          const isTarget = zone.id === (currentCard.activeOcclusionZoneId || currentCard.occlusionZones?.[0]?.id);
                          return (
                            <div
                              key={zone.id}
                              style={{
                                position: 'absolute',
                                left: `${zone.x}%`,
                                top: `${zone.y}%`,
                                width: `${zone.width}%`,
                                height: `${zone.height}%`,
                                backgroundColor: isTarget ? 'rgba(16, 185, 129, 0.25)' : 'rgba(30, 41, 59, 0.9)',
                                border: isTarget ? '2px solid var(--color-emerald-500, #10b981)' : '1px solid rgba(255,255,255,0.2)',
                                borderRadius: '4px',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: isTarget ? 'var(--color-emerald-500, #10b981)' : '#fff',
                                fontWeight: 700,
                                fontSize: '11px',
                                backdropFilter: isTarget ? 'blur(1px)' : undefined,
                                pointerEvents: 'none'
                              }}
                            >
                              {isTarget ? (zone.label || currentCard.backAnswer) : `[${idx + 1}]`}
                            </div>
                          );
                        })}
                      </div>
                      <div className="solis-card-answer" style={{ color: 'var(--color-emerald-500, #10b981)', fontSize: 'var(--text-h4, 18px)', fontWeight: 700 }}>
                        {currentCard.backAnswer}
                      </div>
                    </div>
                  ) : (
                    <div className="solis-card-answer">{currentCard.backAnswer}</div>
                  )}

                  <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: 'auto' }}>
                    Rate retrieval difficulty (<kbd style={{ padding: '1px 4px', fontSize: '10px', borderRadius: '3px', background: 'var(--bg-surface-secondary)', border: '1px solid var(--border-subtle)' }}>1-4</kbd>) below
                  </span>
                </div>
              </div>
            </div>

            {/* Difficulty Rating Actions (FSRS-5 Spaced Retrieval) */}
            {isFlipped && (
              <div className="solis-recall-actions animate-fade-in">
                <button
                  className="solis-recall-btn solis-recall-btn--again"
                  onClick={() => handleRating('again')}
                >
                  <span className="solis-recall-btn__label" style={{ color: 'var(--status-error)' }}>[1] Again</span>
                  <span className="solis-recall-btn__interval">{intervals?.again ?? '< 1 day'}</span>
                </button>

                <button
                  className="solis-recall-btn solis-recall-btn--hard"
                  onClick={() => handleRating('hard')}
                >
                  <span className="solis-recall-btn__label" style={{ color: 'var(--status-warning)' }}>[2] Hard</span>
                  <span className="solis-recall-btn__interval">{intervals?.hard ?? '1-2 days'}</span>
                </button>

                <button
                  className="solis-recall-btn solis-recall-btn--good"
                  onClick={() => handleRating('good')}
                >
                  <span className="solis-recall-btn__label" style={{ color: 'var(--color-sage-600)' }}>[3] Good</span>
                  <span className="solis-recall-btn__interval">{intervals?.good ?? '3-4 days'}</span>
                </button>

                <button
                  className="solis-recall-btn solis-recall-btn--easy"
                  onClick={() => handleRating('easy')}
                >
                  <span className="solis-recall-btn__label" style={{ color: 'var(--color-lavender-500)' }}>[4] Easy</span>
                  <span className="solis-recall-btn__interval">{intervals?.easy ?? '6-7 days'}</span>
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
              {isCramMode ? 'Exam Cram Complete' : 'Memory Reinforced'}
            </h3>

            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body-sm)', maxWidth: '420px', margin: '0 auto var(--space-xl)', lineHeight: 1.6 }}>
              {isCramMode
                ? `You drilled ${totalCards} cards in protected Exam Cram mode. Spaced repetition intervals and long-term memory stability were kept completely safe and unchanged.`
                : `You completed active recall on ${totalCards} flashcards. Spaced repetition intervals and syllabus mastery signals have been updated.`}
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

      {/* Feature 3.4: Concept Atomization Modal */}
      {isAtomizeOpen && (
        <Modal
          isOpen={isAtomizeOpen}
          onClose={() => setIsAtomizeOpen(false)}
          title="Atomize Struggling Concept"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '8px 0' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', padding: '12px', background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: '8px' }}>
              <AlertTriangle size={18} color="var(--color-amber-500, #f59e0b)" style={{ flexShrink: 0, marginTop: '2px' }} />
              <div style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>
                <strong>High Cognitive Load Detected:</strong>
                <p style={{ margin: '4px 0 0', color: 'var(--text-secondary)' }}>
                  {atomizedPair?.rationale || 'This concept has failed 4+ times in 14 days. Splitting it into two focused, atomic cards eliminates interference and locks in retention.'}
                </p>
              </div>
            </div>

            {/* Card 1 Preview */}
            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-secondary)' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-coral-500)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Child Card 1</span>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Question / Prompt</label>
              <input
                type="text"
                value={atomizedP1.prompt}
                onChange={(e) => setAtomizedP1({ ...atomizedP1, prompt: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-primary)', color: 'var(--text-primary)', marginBottom: '8px' }}
              />
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Answer</label>
              <input
                type="text"
                value={atomizedP1.answer}
                onChange={(e) => setAtomizedP1({ ...atomizedP1, answer: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-primary)', color: 'var(--text-primary)' }}
              />
            </div>

            {/* Card 2 Preview */}
            <div style={{ padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-secondary)' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--color-coral-500)', textTransform: 'uppercase', display: 'block', marginBottom: '8px' }}>Child Card 2</span>
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Question / Prompt</label>
              <input
                type="text"
                value={atomizedP2.prompt}
                onChange={(e) => setAtomizedP2({ ...atomizedP2, prompt: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-primary)', color: 'var(--text-primary)', marginBottom: '8px' }}
              />
              <label style={{ display: 'block', fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '4px' }}>Answer</label>
              <input
                type="text"
                value={atomizedP2.answer}
                onChange={(e) => setAtomizedP2({ ...atomizedP2, answer: e.target.value })}
                style={{ width: '100%', padding: '6px 10px', borderRadius: '6px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-primary)', color: 'var(--text-primary)' }}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '8px' }}>
              <Button variant="ghost" onClick={() => setIsAtomizeOpen(false)}>
                Cancel
              </Button>
              <Button
                variant="primary"
                leftIcon={<Scissors size={15} />}
                isLoading={isAtomizing}
                onClick={handleConfirmAtomize}
              >
                Confirm & Split Into 2 Cards
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
};
