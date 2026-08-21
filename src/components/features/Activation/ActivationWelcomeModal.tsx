import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  CheckCircle2,
  Flame,
  FileText,
  Sparkles,
  BookOpen,
  ArrowRight,
  Check
} from 'lucide-react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import {
  ActivationStep
} from '../../../types/activation';
import {
  getActivationState,
  setActivationState,
  getCompletedActivationSteps,
  markActivationStepCompleted,
  computeActivationSteps,
  WorkspaceEntityCounts
} from '../../../utils/activation';
import './ActivationWelcomeModal.css';

export interface ActivationWelcomeModalProps {
  isOpen: boolean;
  onClose: () => void;
  counts: WorkspaceEntityCounts;
  userId?: string;
}

export const ActivationWelcomeModal: React.FC<ActivationWelcomeModalProps> = ({
  isOpen,
  onClose,
  counts,
  userId
}) => {
  const navigate = useNavigate();
  const [currentStage, setCurrentStage] = useState<'welcome' | 'mental_model' | 'checklist'>('welcome');
  const [completedSteps, setCompletedSteps] = useState<string[]>(() => getCompletedActivationSteps(userId));

  useEffect(() => {
    if (isOpen) {
      const savedState = getActivationState(userId);
      if (savedState === 'mental_model') setCurrentStage('mental_model');
      else if (savedState === 'checklist') setCurrentStage('checklist');
      else setCurrentStage('welcome');
      setCompletedSteps(getCompletedActivationSteps(userId));
    }
  }, [isOpen, userId]);

  const steps = computeActivationSteps(counts, completedSteps);
  const completedCount = steps.filter((s) => s.isCompleted).length;
  const isAllComplete = completedCount === steps.length;

  const handleGoToMentalModel = () => {
    setCurrentStage('mental_model');
    setActivationState('mental_model', userId);
    markActivationStepCompleted('understand_loop', userId);
    setCompletedSteps(getCompletedActivationSteps(userId));
  };

  const handleGoToChecklist = () => {
    setCurrentStage('checklist');
    setActivationState('checklist', userId);
  };

  const handleDismiss = () => {
    setActivationState('dismissed', userId);
    onClose();
  };

  const handleCompleteActivation = () => {
    setActivationState('completed', userId);
    onClose();
  };

  const handleStepAction = (step: ActivationStep) => {
    markActivationStepCompleted(step.id, userId);
    onClose();
    navigate(step.targetPath);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="solis-activation-modal">
        {/* Stage 1: Welcome & Philosophy */}
        {currentStage === 'welcome' && (
          <div>
            <div className="solis-activation-header">
              <div className="solis-activation-tag">
                <Sparkles size={13} />
                <span>Welcome to Solis</span>
              </div>
              <h2 className="solis-activation-title">A quiet room for ambitious minds.</h2>
              <p className="solis-activation-subtitle">
                Solis is an intentional personal operating system designed to turn high ambitions into calm, consistent daily focus.
              </p>
            </div>

            <div style={{ textAlign: 'center', margin: 'var(--space-lg) 0' }}>
              <div
                style={{
                  padding: 'var(--space-md)',
                  background: 'var(--bg-surface-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  fontFamily: 'var(--font-display)',
                  fontStyle: 'italic',
                  color: 'var(--text-secondary)',
                  fontSize: 'var(--text-body-sm)',
                  lineHeight: 1.6
                }}
              >
                “Order is not pressure; it is the calm canvas upon which deep mastery is composed.”
              </div>
            </div>

            <div className="solis-activation-actions">
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Skip for now
              </Button>
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight size={16} />}
                onClick={handleGoToMentalModel}
              >
                Show me how Solis works
              </Button>
            </div>
          </div>
        )}

        {/* Stage 2: The Solis Loop (Visual Map) */}
        {currentStage === 'mental_model' && (
          <div>
            <div className="solis-activation-header">
              <div className="solis-activation-tag">
                <Compass size={13} />
                <span>The Solis Loop</span>
              </div>
              <h2 className="solis-activation-title">How the system connects</h2>
              <p className="solis-activation-subtitle">
                Everything in Solis flows through five simple, continuous stages:
              </p>
            </div>

            <div className="solis-activation-loop-grid">
              <div className="solis-activation-loop-card">
                <div className="solis-activation-loop-icon">
                  <CheckCircle2 size={16} />
                </div>
                <div className="solis-activation-loop-stage">1. DECIDE</div>
                <div className="solis-activation-loop-env">Task Sanctuary</div>
              </div>

              <div className="solis-activation-loop-card">
                <div className="solis-activation-loop-icon">
                  <Flame size={16} />
                </div>
                <div className="solis-activation-loop-stage">2. DO</div>
                <div className="solis-activation-loop-env">Focus Sanctuary</div>
              </div>

              <div className="solis-activation-loop-card">
                <div className="solis-activation-loop-icon">
                  <FileText size={16} />
                </div>
                <div className="solis-activation-loop-stage">3. CAPTURE</div>
                <div className="solis-activation-loop-env">Knowledge Studio</div>
              </div>

              <div className="solis-activation-loop-card">
                <div className="solis-activation-loop-icon">
                  <BookOpen size={16} />
                </div>
                <div className="solis-activation-loop-stage">4. RECALL</div>
                <div className="solis-activation-loop-env">Active Recall</div>
              </div>

              <div className="solis-activation-loop-card">
                <div className="solis-activation-loop-icon">
                  <Sparkles size={16} />
                </div>
                <div className="solis-activation-loop-stage">5. REFLECT</div>
                <div className="solis-activation-loop-env">Weekly Review</div>
              </div>
            </div>

            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', textAlign: 'center', lineHeight: 1.5 }}>
              Study Studio and Goal Horizons provide the overarching syllabus and milestone structure for these daily actions.
            </p>

            <div className="solis-activation-actions">
              <Button variant="ghost" size="sm" onClick={() => setCurrentStage('welcome')}>
                Back
              </Button>
              <Button
                variant="primary"
                size="md"
                rightIcon={<ArrowRight size={16} />}
                onClick={handleGoToChecklist}
              >
                Begin Setup Checklist
              </Button>
            </div>
          </div>
        )}

        {/* Stage 3: Adaptive Setup Checklist */}
        {currentStage === 'checklist' && (
          <div>
            <div className="solis-activation-header">
              <div className="solis-activation-tag">
                <CheckCircle2 size={13} />
                <span>Your Solis Setup</span>
              </div>
              <h2 className="solis-activation-title">Initialize Your Foundation</h2>
              <p className="solis-activation-subtitle">
                Complete these high-leverage actions to unlock full momentum tracking ({completedCount}/{steps.length} completed).
              </p>
            </div>

            <div className="solis-activation-checklist">
              {steps.map((step) => (
                <div
                  key={step.id}
                  className={`solis-activation-check-item ${step.isCompleted ? 'solis-activation-check-item--done' : ''}`}
                >
                  <div className="solis-activation-check-left">
                    <div
                      className={`solis-activation-check-status ${step.isCompleted ? 'solis-activation-check-status--done' : ''}`}
                    >
                      {step.isCompleted && <Check size={14} />}
                    </div>
                    <div>
                      <h5 className="solis-activation-check-title">{step.title}</h5>
                      <p className="solis-activation-check-desc">{step.description}</p>
                    </div>
                  </div>

                  <Button
                    variant={step.isCompleted ? 'ghost' : 'secondary'}
                    size="sm"
                    onClick={() => handleStepAction(step)}
                  >
                    {step.actionLabel}
                  </Button>
                </div>
              ))}
            </div>

            <div className="solis-activation-actions">
              <Button variant="ghost" size="sm" onClick={handleDismiss}>
                Dismiss for now
              </Button>
              {isAllComplete ? (
                <Button
                  variant="primary"
                  size="md"
                  rightIcon={<Sparkles size={16} />}
                  onClick={handleCompleteActivation}
                >
                  You&apos;re Set — Enter Sanctuary
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleDismiss}
                >
                  Continue in Daily Flow
                </Button>
              )}
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
