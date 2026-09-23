import React, { HTMLAttributes } from 'react';
import { cn } from '../../../utils/classNames';
import './Card.css';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'primary' | 'elevated' | 'subtle' | 'dark';
  isInteractive?: boolean;
  'data-cursor'?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  className,
  variant = 'primary',
  isInteractive = false,
  'data-cursor': dataCursor,
  role,
  tabIndex,
  onKeyDown,
  ...props
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (isInteractive && props.onClick && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      props.onClick(e as any);
    }
    onKeyDown?.(e);
  };

  return (
    <div
      className={cn(
        'solis-card',
        `solis-card--${variant}`,
        isInteractive && 'solis-card--interactive',
        className
      )}
      data-cursor={isInteractive ? (dataCursor || 'examine') : dataCursor}
      role={role || (isInteractive ? 'button' : undefined)}
      tabIndex={tabIndex !== undefined ? tabIndex : (isInteractive ? 0 : undefined)}
      onKeyDown={handleKeyDown}
      {...props}
    >
      {children}
    </div>
  );
};

export const CardHeader: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('solis-card-header', className)} {...props}>
    {children}
  </div>
);

export const CardTitle: React.FC<HTMLAttributes<HTMLHeadingElement>> = ({ children, className, ...props }) => (
  <h3 className={cn('solis-card-title', className)} {...props}>
    {children}
  </h3>
);

export const CardSubtitle: React.FC<HTMLAttributes<HTMLParagraphElement>> = ({ children, className, ...props }) => (
  <p className={cn('solis-card-subtitle', className)} {...props}>
    {children}
  </p>
);

export const CardContent: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('solis-card-content', className)} {...props}>
    {children}
  </div>
);

export const CardFooter: React.FC<HTMLAttributes<HTMLDivElement>> = ({ children, className, ...props }) => (
  <div className={cn('solis-card-footer', className)} {...props}>
    {children}
  </div>
);
