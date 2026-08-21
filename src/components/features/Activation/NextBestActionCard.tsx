import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Compass,
  BookOpen,
  CheckCircle2,
  Flame,
  FileText,
  ArrowRight,
  Sparkles
} from 'lucide-react';
import { Button } from '../../ui/Button/Button';
import { NextBestAction } from '../../../types/activation';
import './NextBestActionCard.css';

export interface NextBestActionCardProps {
  action: NextBestAction;
  onDismiss?: () => void;
}

export const NextBestActionCard: React.FC<NextBestActionCardProps> = ({
  action,
  onDismiss
}) => {
  const navigate = useNavigate();

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'BookOpen':
        return <BookOpen size={20} />;
      case 'CheckCircle2':
        return <CheckCircle2 size={20} />;
      case 'Flame':
        return <Flame size={20} />;
      case 'FileText':
        return <FileText size={20} />;
      case 'Compass':
      default:
        return <Compass size={20} />;
    }
  };

  return (
    <div className="solis-next-best-action">
      <div className="solis-next-best-action__content">
        <div className="solis-next-best-action__icon-box">
          {renderIcon(action.iconName)}
        </div>
        <div>
          <div className="solis-next-best-action__tag">
            <Sparkles size={11} />
            <span>Next Recommended Step</span>
          </div>
          <h4 className="solis-next-best-action__title">{action.title}</h4>
          <p className="solis-next-best-action__desc">{action.description}</p>
        </div>
      </div>

      <div className="solis-next-best-action__controls">
        {onDismiss && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onDismiss}
            aria-label="Dismiss recommendation"
          >
            Dismiss
          </Button>
        )}
        <Button
          variant="primary"
          size="sm"
          rightIcon={<ArrowRight size={14} />}
          onClick={() => navigate(action.targetPath)}
        >
          {action.actionLabel}
        </Button>
      </div>
    </div>
  );
};
