import { BookOpen } from 'lucide-react';
import { cn } from '../../../utils/classNames';
import { Button } from '../../ui/Button/Button';
import './SectionHeader.css';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  tag?: React.ReactNode;
  actions?: React.ReactNode;
  guideId?: string;
  onOpenGuide?: (guideId: string) => void;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  tag,
  actions,
  guideId,
  onOpenGuide,
  className
}) => {
  return (
    <div className={cn('solis-section-header', className)}>
      <div>
        {tag && <div className="solis-section-header__meta">{tag}</div>}
        <h1 className="solis-section-header__title">{title}</h1>
        {subtitle && <p className="solis-section-header__subtitle">{subtitle}</p>}
      </div>
      <div className="solis-section-header__actions">
        {guideId && onOpenGuide && (
          <Button
            variant="ghost"
            size="sm"
            leftIcon={<BookOpen size={14} />}
            onClick={() => onOpenGuide(guideId)}
            title="Learn how this environment works"
          >
            How to use this
          </Button>
        )}
        {actions}
      </div>
    </div>
  );
};
