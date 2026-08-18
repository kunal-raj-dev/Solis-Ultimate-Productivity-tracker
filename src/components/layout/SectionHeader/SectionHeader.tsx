import React from 'react';
import { cn } from '../../../utils/classNames';
import './SectionHeader.css';

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  tag?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

export const SectionHeader: React.FC<SectionHeaderProps> = ({
  title,
  subtitle,
  tag,
  actions,
  className
}) => {
  return (
    <div className={cn('solis-section-header', className)}>
      <div>
        {tag && <div className="solis-section-header__meta">{tag}</div>}
        <h1 className="solis-section-header__title">{title}</h1>
        {subtitle && <p className="solis-section-header__subtitle">{subtitle}</p>}
      </div>
      {actions && <div className="solis-section-header__actions">{actions}</div>}
    </div>
  );
};
