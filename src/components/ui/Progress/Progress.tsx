import React from 'react';
import { cn } from '../../../utils/classNames';
import './Progress.css';

export interface ProgressProps {
  value: number; // 0 to 100
  max?: number;
  label?: string;
  showValueText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'coral' | 'amber' | 'sage' | 'lavender' | 'momentum' | 'charcoal';
  className?: string;
}

export const Progress: React.FC<ProgressProps> = ({
  value,
  max = 100,
  label,
  showValueText = false,
  size = 'md',
  variant = 'coral',
  className
}) => {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('solis-progress-container', className)}>
      {(label || showValueText) && (
        <div className="solis-progress-header">
          {label && <span>{label}</span>}
          {showValueText && (
            <span className="text-metric">{Math.round(percentage)}%</span>
          )}
        </div>
      )}
      <div
        className={cn('solis-progress-track', `solis-progress-track--${size}`)}
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label || 'Progress'}
      >
        <div
          className={cn('solis-progress-fill', `solis-progress-fill--${variant}`)}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};
