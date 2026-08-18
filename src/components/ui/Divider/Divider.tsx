import React from 'react';
import { cn } from '../../../utils/classNames';
import './Divider.css';

export interface DividerProps {
  orientation?: 'horizontal' | 'vertical';
  label?: string;
  className?: string;
}

export const Divider: React.FC<DividerProps> = ({
  orientation = 'horizontal',
  label,
  className
}) => {
  if (label && orientation === 'horizontal') {
    return (
      <div className={cn('solis-divider-label', className)} role="separator">
        <span>{label}</span>
      </div>
    );
  }

  return (
    <div
      className={cn('solis-divider', `solis-divider--${orientation}`, className)}
      role="separator"
      aria-orientation={orientation}
    />
  );
};
