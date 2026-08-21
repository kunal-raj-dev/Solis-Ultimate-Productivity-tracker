import React from 'react';
import { Guide } from '../../types/guide';
import { CheckCircle2, ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { GuideCard } from './GuideCard';

interface GuideCompletionProps {
  guide: Guide;
  relatedGuides: Guide[];
  onNavigateToGuide: (guideId: string) => void;
  onReturnToProduct: () => void;
}

export const GuideCompletion: React.FC<GuideCompletionProps> = ({
  guide,
  relatedGuides,
  onNavigateToGuide,
  onReturnToProduct
}) => {
  return (
    <div className="solis-guide-completion">
      <div className="solis-guide-completion__header">
        <CheckCircle2 className="solis-guide-completion__icon" size={64} />
        <h2 className="solis-guide-completion__title">✓ You're ready</h2>
      </div>
      
      <p className="solis-guide-completion__summary">
        {guide.summary}
      </p>

      {guide.action && (
        <div className="solis-guide-completion__action">
          <Button
            variant="primary"
            size="lg"
            rightIcon={<ArrowRight size={16} />}
            onClick={onReturnToProduct}
          >
            {guide.action.label}
          </Button>
        </div>
      )}

      <hr className="solis-guide-completion__divider" />

      {relatedGuides.length > 0 && (
        <div className="solis-guide-completion__related">
          <h3 className="solis-guide-completion__related-title">
            <Sparkles size={16} className="solis-guide-completion__sparkles" />
            Continue learning
          </h3>
          <div className="solis-guide-completion__related-grid">
            {relatedGuides.map(related => (
              <GuideCard
                key={related.id}
                guide={related}
                compact
                onClick={() => onNavigateToGuide(related.id)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
