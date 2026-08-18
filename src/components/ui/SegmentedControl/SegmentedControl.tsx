import React from 'react';
import { cn } from '../../../utils/classNames';
import './SegmentedControl.css';

export interface SegmentedControlOption<T extends string = string> {
  value: T;
  label: string;
  badge?: string | number;
  icon?: React.ReactNode;
}

export interface SegmentedControlProps<T extends string = string> {
  options: SegmentedControlOption<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'pills' | 'underline' | 'contained';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export const SegmentedControl = <T extends string = string>({
  options,
  value,
  onChange,
  variant = 'pills',
  size = 'md',
  className
}: SegmentedControlProps<T>) => {
  return (
    <div
      role="tablist"
      className={cn(
        'solis-segmented-control',
        `solis-segmented-control--${variant}`,
        `solis-segmented-control--${size}`,
        className
      )}
    >
      {options.map((opt) => {
        const isActive = opt.value === value;
        return (
          <button
            key={opt.value}
            role="tab"
            type="button"
            aria-selected={isActive}
            className={cn(
              'solis-segmented-item',
              'tactile-press',
              isActive && 'solis-segmented-item--active'
            )}
            onClick={() => onChange(opt.value)}
          >
            {opt.icon && <span className="solis-segmented-item__icon">{opt.icon}</span>}
            <span className="solis-segmented-item__label">{opt.label}</span>
            {opt.badge !== undefined && (
              <span className={cn('solis-segmented-item__badge', isActive && 'solis-segmented-item__badge--active')}>
                {opt.badge}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
