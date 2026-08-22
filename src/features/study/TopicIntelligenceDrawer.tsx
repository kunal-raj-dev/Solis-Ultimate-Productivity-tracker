/**
 * Solis Study Studio — Topic Intelligence Drawer
 * 
 * Interactive slide-over / modal drawer presenting transparent, evidence-based learning signals:
 *  - Evaluated Mastery State & Retention Health
 *  - Human-readable "Why this conclusion?" explainability breakdown
 *  - Verifiable historical metrics (sessions, minutes, recall %, flashcards, notes)
 *  - Direct Action Triggers (Start Focus, Drill Flashcards, Capture Notes)
 */

import React from 'react';
import {
  X,
  Brain,
  Clock,
  RotateCcw,
  Sparkles,
  BookOpen,
  FileText,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  Flame,
  Layers
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import {
  TopicLearningHistory,
  TopicMasteryEvaluation,
  TopicRetentionSignal,
  EvaluatedMasteryState,
  RetentionHealthSignal
} from '../../types/learningIntelligence';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import './TopicIntelligenceDrawer.css';

export interface TopicIntelligenceDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history?: TopicLearningHistory;
  mastery?: TopicMasteryEvaluation;
  retention?: TopicRetentionSignal;
  onStartFlashcardDrill?: (topicId: string) => void;
  onOpenNotes?: (subjectId: string, topicId: string) => void;
}

export const TopicIntelligenceDrawer: React.FC<TopicIntelligenceDrawerProps> = ({
  isOpen,
  onClose,
  history,
  mastery,
  retention,
  onStartFlashcardDrill,
  onOpenNotes
}) => {
  const navigate = useNavigate();
  const drawerRef = React.useRef<HTMLDivElement>(null);
  const previousActiveElementRef = React.useRef<HTMLElement | null>(null);

  const handleKeyDown = React.useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }

      if (e.key === 'Tab' && drawerRef.current) {
        const focusableElements = drawerRef.current.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (focusableElements.length === 0) return;

        const firstElement = focusableElements[0];
        const lastElement = focusableElements[focusableElements.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement) {
            lastElement.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === lastElement) {
            firstElement.focus();
            e.preventDefault();
          }
        }
      }
    },
    [onClose]
  );

  React.useEffect(() => {
    if (isOpen) {
      previousActiveElementRef.current = document.activeElement as HTMLElement;
      document.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';

      // Auto-focus first interactive element
      setTimeout(() => {
        if (drawerRef.current) {
          const firstFocusable = drawerRef.current.querySelector<HTMLElement>(
            'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
          );
          firstFocusable?.focus();
        }
      }, 50);
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
      if (previousActiveElementRef.current && typeof previousActiveElementRef.current.focus === 'function') {
        previousActiveElementRef.current.focus();
      }
    };
  }, [isOpen, handleKeyDown]);

  if (!isOpen || !history) return null;

  const handleStartFocus = (durationMinutes = 25) => {
    onClose();
    navigate(`/app/focus?subjectId=${history.subjectId}&topicId=${history.topicId}&duration=${durationMinutes}&topicTitle=${encodeURIComponent(history.topicTitle)}`);
  };

  const renderMasteryBadge = (state?: EvaluatedMasteryState) => {
    switch (state) {
      case 'STRONG':
        return <span className="solis-topic-badge solis-topic-badge--strong"><CheckCircle2 size={12} /> Strong</span>;
      case 'STABLE':
        return <span className="solis-topic-badge solis-topic-badge--stable"><CheckCircle2 size={12} /> Stable</span>;
      case 'DEVELOPING':
        return <span className="solis-topic-badge solis-topic-badge--developing"><Layers size={12} /> Developing</span>;
      case 'EMERGING':
        return <span className="solis-topic-badge solis-topic-badge--emerging"><Sparkles size={12} /> Emerging</span>;
      default:
        return <span className="solis-topic-badge solis-topic-badge--unassessed"><HelpCircle size={12} /> Not Assessed</span>;
    }
  };

  const renderRetentionBadge = (signal?: RetentionHealthSignal) => {
    switch (signal) {
      case 'FRESH':
        return <span className="solis-retention-badge solis-retention-badge--fresh"><Sparkles size={12} /> Fresh</span>;
      case 'DUE_FOR_REVIEW':
        return <span className="solis-retention-badge solis-retention-badge--due"><RotateCcw size={12} /> Due for Review</span>;
      case 'NEEDS_ATTENTION':
        return <span className="solis-retention-badge solis-retention-badge--attention"><AlertCircle size={12} /> Needs Attention</span>;
      case 'OVERDUE':
        return <span className="solis-retention-badge solis-retention-badge--overdue"><AlertCircle size={12} /> Overdue</span>;
      default:
        return <span className="solis-retention-badge solis-retention-badge--unstudied">Unstudied</span>;
    }
  };

  return (
    <div className="solis-topic-drawer-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="Topic Intelligence Drawer">
      <div className="solis-topic-drawer" ref={drawerRef} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="solis-topic-drawer__header">
          <div>
            <div className="solis-topic-drawer__subject-tag">
              <Badge variant="neutral">{history.subjectName}</Badge>
            </div>
            <h2 className="solis-topic-drawer__title">{history.topicTitle}</h2>
          </div>
          <button
            className="solis-topic-drawer__close"
            onClick={onClose}
            aria-label="Close topic intelligence drawer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="solis-topic-drawer__body">
          {/* Status Badges Row */}
          <div className="solis-topic-drawer__status-row">
            <div className="solis-topic-drawer__status-item">
              <span className="solis-topic-drawer__status-label">Learning State</span>
              {renderMasteryBadge(mastery?.state)}
            </div>
            <div className="solis-topic-drawer__status-item">
              <span className="solis-topic-drawer__status-label">Retention Signal</span>
              {renderRetentionBadge(retention?.signal)}
            </div>
            <div className="solis-topic-drawer__status-item">
              <span className="solis-topic-drawer__status-label">Evidence Quality</span>
              <span className="solis-topic-drawer__confidence-text">
                {mastery?.confidence === 'HIGH' ? '● High Spaced Confidence' : mastery?.confidence === 'MEDIUM' ? '◐ Moderate Spacing' : '○ Initial Evidence'}
              </span>
            </div>
          </div>

          {/* Explainability Callout: Why this conclusion? */}
          <div className="solis-topic-drawer__explanation-box">
            <div className="solis-topic-drawer__explanation-header">
              <Brain size={16} color="var(--color-coral-500)" />
              <span className="solis-topic-drawer__explanation-title">Why this conclusion?</span>
            </div>
            <p className="solis-topic-drawer__explanation-text">
              {mastery?.whyExplanation || 'No evidence recorded yet.'}
            </p>
            {retention && retention.signal !== 'FRESH' && retention.signal !== 'UNSTUDIED' && (
              <p className="solis-topic-drawer__retention-note">
                <strong>Retention Note:</strong> {retention.whyExplanation}
              </p>
            )}
          </div>

          {/* Verifiable Evidence Metrics Grid */}
          <div className="solis-topic-drawer__metrics-grid">
            <div className="solis-topic-drawer__metric-card">
              <div className="solis-topic-drawer__metric-icon">
                <Clock size={16} />
              </div>
              <div className="solis-topic-drawer__metric-value">
                {history.totalStudyMinutes} <span className="solis-topic-drawer__metric-unit">min</span>
              </div>
              <div className="solis-topic-drawer__metric-label">
                Across {history.totalSessionsCount} session{history.totalSessionsCount !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="solis-topic-drawer__metric-card">
              <div className="solis-topic-drawer__metric-icon">
                <RotateCcw size={16} />
              </div>
              <div className="solis-topic-drawer__metric-value">
                {history.recallAccuracyRate !== null ? `${Math.round(history.recallAccuracyRate * 100)}%` : '—'}
              </div>
              <div className="solis-topic-drawer__metric-label">
                {history.totalRecallAttempts} recall attempt{history.totalRecallAttempts !== 1 ? 's' : ''}
              </div>
            </div>

            <div className="solis-topic-drawer__metric-card">
              <div className="solis-topic-drawer__metric-icon">
                <Sparkles size={16} />
              </div>
              <div className="solis-topic-drawer__metric-value">
                {history.averageRetentionRating !== null ? `${history.averageRetentionRating}/5` : '—'}
              </div>
              <div className="solis-topic-drawer__metric-label">
                Avg. retention score
              </div>
            </div>

            <div className="solis-topic-drawer__metric-card">
              <div className="solis-topic-drawer__metric-icon">
                <BookOpen size={16} />
              </div>
              <div className="solis-topic-drawer__metric-value">
                {history.daysSinceLastStudied !== null ? (history.daysSinceLastStudied === 0 ? 'Today' : `${history.daysSinceLastStudied}d ago`) : 'Never'}
              </div>
              <div className="solis-topic-drawer__metric-label">
                Last engaged
              </div>
            </div>
          </div>

          {/* Supporting Artifacts */}
          <div className="solis-topic-drawer__artifacts">
            <h4 className="solis-topic-drawer__section-heading">Connected Learning Artifacts</h4>
            <div className="solis-topic-drawer__artifacts-row">
              <div className="solis-topic-drawer__artifact-badge">
                <RotateCcw size={14} />
                <span>{history.flashcardsCount} Flashcards</span>
              </div>
              <div className="solis-topic-drawer__artifact-badge">
                <FileText size={14} />
                <span>{history.notesCount} Linked Notes</span>
              </div>
              <div className="solis-topic-drawer__artifact-badge">
                <BookOpen size={14} />
                <span>{history.resourcesCount} Resources</span>
              </div>
            </div>
          </div>

          {/* Action Triggers */}
          <div className="solis-topic-drawer__actions">
            <h4 className="solis-topic-drawer__section-heading">Recommended Learning Action</h4>
            <p className="solis-topic-drawer__action-subtext">
              {retention?.recommendedAction || 'Start a focused study session.'}
            </p>
            <div className="solis-topic-drawer__action-buttons">
              <Button
                variant="primary"
                leftIcon={<Flame size={16} />}
                onClick={() => handleStartFocus(25)}
              >
                Start 25m Focus Session
              </Button>
              {history.flashcardsCount > 0 ? (
                <Button
                  variant="outline"
                  leftIcon={<RotateCcw size={16} />}
                  onClick={() => {
                    onClose();
                    onStartFlashcardDrill?.(history.topicId);
                  }}
                >
                  Drill {history.flashcardsCount} Flashcards
                </Button>
              ) : (
                <Button
                  variant="outline"
                  leftIcon={<FileText size={16} />}
                  onClick={() => {
                    onClose();
                    onOpenNotes?.(history.subjectId, history.topicId);
                  }}
                >
                  Capture Knowledge Note
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
