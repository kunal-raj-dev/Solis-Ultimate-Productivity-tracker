import React from 'react';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';

interface GuideNavigationProps {
  currentStep: number;
  totalSteps: number;
  onPrevious: () => void;
  onNext: () => void;
  onComplete: () => void;
}

export const GuideNavigation: React.FC<GuideNavigationProps> = ({
  currentStep,
  totalSteps,
  onPrevious,
  onNext,
  onComplete
}) => {
  const isFirst = currentStep === 0;
  const isLast = currentStep === totalSteps - 1;

  return (
    <div className="solis-guide-nav">
      <div className="solis-guide-nav__previous">
        {!isFirst && (
          <Button
            variant="ghost"
            leftIcon={<ArrowLeft size={16} />}
            onClick={onPrevious}
          >
            Previous
          </Button>
        )}
      </div>
      <div className="solis-guide-nav__next">
        {isLast ? (
          <Button
            variant="accent"
            rightIcon={<CheckCircle2 size={16} />}
            onClick={onComplete}
          >
            Complete Guide
          </Button>
        ) : (
          <Button
            variant="primary"
            rightIcon={<ArrowRight size={16} />}
            onClick={onNext}
          >
            Next
          </Button>
        )}
      </div>
    </div>
  );
};
