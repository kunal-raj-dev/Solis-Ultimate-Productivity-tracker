import React from 'react';
import { LucideIcon, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../ui/Button/Button';
import { cn } from '../../../utils/classNames';
import {
  ScholarObservatoryIllustration,
  StudySanctuaryEmptyIllustration,
  NotesEmptyIllustration,
  TasksEmptyIllustration,
  FocusZenIllustration
} from '../../illustrations';
import './EmptyState.css';

export type EmptyStateIllustrationType = 'study' | 'notes' | 'tasks' | 'focus' | 'observatory';

export interface EmptyStateProps {
  icon?: LucideIcon;
  illustration?: EmptyStateIllustrationType;
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
  illustration,
  title,
  description,
  actionLabel,
  onAction,
  className,
  guideId,
  guideLabel = 'Learn how this works'
}) => {
  const navigate = useNavigate();

  const renderVisual = () => {
    switch (illustration) {
      case 'study':
        return (
          <div className="solis-empty-state__illustration-wrap">
            <StudySanctuaryEmptyIllustration width={220} height={165} />
          </div>
        );
      case 'notes':
        return (
          <div className="solis-empty-state__illustration-wrap">
            <NotesEmptyIllustration width={220} height={165} />
          </div>
        );
      case 'tasks':
        return (
          <div className="solis-empty-state__illustration-wrap">
            <TasksEmptyIllustration width={220} height={165} />
          </div>
        );
      case 'focus':
        return (
          <div className="solis-empty-state__illustration-wrap">
            <FocusZenIllustration width={220} height={165} />
          </div>
        );
      case 'observatory':
        return (
          <div className="solis-empty-state__illustration-wrap">
            <ScholarObservatoryIllustration width={260} height={170} />
          </div>
        );
      default:
        return (
          <div className="solis-empty-state__icon-wrap">
            <Icon size={24} strokeWidth={1.75} />
          </div>
        );
    }
  };

  return (
    <div className={cn('solis-empty-state', illustration && 'solis-empty-state--illustrated', className)}>
      {renderVisual()}
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
