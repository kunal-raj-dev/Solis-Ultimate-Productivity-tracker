import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button/Button';
import { cn } from '../../../utils/classNames';
import './EmptyState.css';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  /** Optional guide ID — renders a "Learn how" link to the guide page */
  guideId?: string;
  /** Label for the guide link (default: "Learn how this works") */
  guideLabel?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon: Icon = Sparkles,
  title,
  description,
  actionLabel,
  onAction,
  className,
  guideId,
  guideLabel = 'Learn how this works'
}) => {
  const navigate = useNavigate();

  return (
    <div className={cn('solis-empty-state', className)}>
      <div className="solis-empty-state__icon-wrap">
        <Icon size={24} strokeWidth={1.75} />
      </div>
      <h4 className="solis-empty-state__title">{title}</h4>
      <p className="solis-empty-state__description">{description}</p>
      {actionLabel && onAction && (
        <Button variant="secondary" size="sm" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
      {guideId && (
        <button
          className="solis-empty-state__guide-link"
          onClick={() => navigate(`/app/guides/${guideId}`)}
        >
          {guideLabel}
        </button>
      )}
    </div>
  );
};
