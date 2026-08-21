import React from 'react';

interface GuideProgressBarProps {
  totalSteps: number;
  currentStep: number;
  completedSteps: number[];
  onStepClick?: (stepIndex: number) => void;
}

export const GuideProgressBar: React.FC<GuideProgressBarProps> = ({
  totalSteps,
  currentStep,
  completedSteps,
  onStepClick
}) => {
  return (
    <div className="solis-guide-progress">
      <div className="solis-guide-progress__text">
        Step {currentStep + 1} of {totalSteps}
      </div>
      <div className="solis-guide-progress__dots" role="tablist" aria-label="Guide Steps">
        {Array.from({ length: totalSteps }).map((_, i) => {
          const isCurrent = i === currentStep;
          const isCompleted = completedSteps.includes(i + 1);
          
          let stateClass = 'solis-guide-progress__dot--pending';
          if (isCurrent) stateClass = 'solis-guide-progress__dot--current';
          else if (isCompleted) stateClass = 'solis-guide-progress__dot--completed';

          return (
            <button
              key={i}
              role="tab"
              aria-selected={isCurrent}
              aria-label={`Step ${i + 1}`}
              className={`solis-guide-progress__dot ${stateClass}`}
              onClick={() => onStepClick?.(i)}
            >
              {(isCurrent || isCompleted) ? '●' : '○'}
            </button>
          );
        })}
      </div>
    </div>
  );
};
