import React, { HTMLAttributes } from 'react';
import { cn } from '../../../utils/classNames';
import './Badge.css';

export type BadgeVariant = 'coral' | 'amber' | 'rose' | 'lavender' | 'sage' | 'charcoal' | 'neutral';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  showDot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  className,
  variant = 'neutral',
  showDot = false,
  ...props
}) => {
  return (
    <span className={cn('solis-badge', `solis-badge--${variant}`, className)} {...props}>
      {showDot && <span className="solis-badge__dot" aria-hidden="true" />}
      {children}
    </span>
  );
};
