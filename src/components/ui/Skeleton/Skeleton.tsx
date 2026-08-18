import React, { HTMLAttributes } from 'react';
import { cn } from '../../../utils/classNames';
import './Skeleton.css';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: string | number;
  height?: string | number;
  variant?: 'rect' | 'circle' | 'text';
}

export const Skeleton: React.FC<SkeletonProps> = ({
  width = '100%',
  height = '1rem',
  variant = 'rect',
  className,
  style,
  ...props
}) => {
  return (
    <div
      className={cn(
        'solis-skeleton',
        variant === 'circle' && 'solis-skeleton--circle',
        className
      )}
      style={{
        width,
        height,
        ...style
      }}
      aria-hidden="true"
      {...props}
    />
  );
};
