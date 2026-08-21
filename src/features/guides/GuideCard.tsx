import React from 'react';
import { Guide } from '../../types/guide';
import { Badge } from '../../components/ui/Badge/Badge';

interface GuideCardProps {
  guide: Guide;
  isSelected?: boolean;
  onClick?: () => void;
  compact?: boolean;
}

export const GuideCard: React.FC<GuideCardProps> = ({
  guide,
  isSelected = false,
  onClick,
  compact = false
}) => {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onClick?.();
    }
  };

  return (
    <div
      className={`solis-guide-card ${isSelected ? 'solis-guide-card--selected' : ''} ${compact ? 'solis-guide-card--compact' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      aria-selected={isSelected}
    >
      <div className="solis-guide-card__category">
        <Badge variant="neutral">{guide.category.toUpperCase()}</Badge>
      </div>
      <h3 className="solis-guide-card__title">{guide.title}</h3>
      <p className="solis-guide-card__summary">{guide.summary}</p>
      <div className="solis-guide-card__meta">
        {guide.steps.length} steps &middot; ~{guide.estimatedMinutes || 5} min
      </div>
    </div>
  );
};
