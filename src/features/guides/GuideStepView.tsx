import React, { useState } from 'react';
import { GuideStep, GuideStepAction } from '../../types/guide';
import { Check, CircleDot, Lightbulb, ArrowRight } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';

interface GuideStepViewProps {
  step: GuideStep;
  totalSteps: number;
  isCompleted: boolean;
  isAutoVerified: boolean;
  onMarkComplete?: () => void;
  onExecuteAction?: (action: GuideStepAction) => void;
}

export const GuideStepView: React.FC<GuideStepViewProps> = ({
  step,
  totalSteps,
  isCompleted,
  isAutoVerified,
  onMarkComplete,
  onExecuteAction
}) => {
  const [isTipExpanded, setIsTipExpanded] = useState(false);

  return (
    <div className="solis-guide-step">
      <div className="solis-guide-step__header">
        <div className="solis-guide-step__indicator" aria-hidden="true">
          {isCompleted ? (
            <Check className="solis-guide-step__icon solis-guide-step__icon--completed" size={20} />
          ) : (
            <CircleDot className="solis-guide-step__icon solis-guide-step__icon--current" size={20} />
          )}
        </div>
        <h3 className="solis-guide-step__title">
          <span className="solis-guide-step__number">Step {step.stepNumber} of {totalSteps}</span>: {step.title}
        </h3>
      </div>

      <div className="solis-guide-step__content">
        <p className="solis-guide-step__description">{step.description}</p>

        {step.why && (
          <div className="solis-guide-step__why">
            <strong>Why:</strong> {step.why}
          </div>
        )}

        {step.action && (
          <div className="solis-guide-step__action-container">
            <Button
              variant="outline"
              size="sm"
              rightIcon={<ArrowRight size={16} />}
              onClick={() => onExecuteAction?.(step.action!)}
            >
              {step.action.label}
            </Button>
          </div>
        )}

        {step.tip && (
          <div className="solis-guide-step__tip-container">
            <button
              className="solis-guide-step__tip-toggle"
              onClick={() => setIsTipExpanded(!isTipExpanded)}
              aria-expanded={isTipExpanded}
            >
              <Lightbulb size={16} /> Tip
            </button>
            {isTipExpanded && (
              <p className="solis-guide-step__tip-content">
                <em>{step.tip}</em>
              </p>
            )}
          </div>
        )}

        <div className="solis-guide-step__completion-status">
          {isCompleted && isAutoVerified && (
            <span className="solis-guide-step__status-text solis-guide-step__status-text--verified">
              <Check size={14} /> Verified &mdash; Solis detected this step is complete
            </span>
          )}
          {isCompleted && !isAutoVerified && (
            <span className="solis-guide-step__status-text solis-guide-step__status-text--muted">
              <Check size={14} /> Marked as understood
            </span>
          )}
          {!isCompleted && step.completionCheck && (
            <span className="solis-guide-step__status-text solis-guide-step__status-text--muted">
              Waiting for verification...
            </span>
          )}
          {!isCompleted && !step.completionCheck && (
            <Button variant="subtle" size="sm" onClick={onMarkComplete}>
              Mark as understood
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
