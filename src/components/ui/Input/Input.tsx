import React, { InputHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '../../../utils/classNames';
import './Input.css';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  helperText?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  (
    {
      label,
      helperText,
      error,
      leftIcon,
      rightIcon,
      className,
      disabled,
      id,
      ...props
    },
    ref
  ) => {
    const generatedId = useId();
    const inputId = id || generatedId;

    return (
      <div className={cn('solis-input-group', className)}>
        {label && (
          <label htmlFor={inputId} className="solis-input-label">
            {label}
          </label>
        )}
        <div
          className={cn(
            'solis-input-wrapper',
            error && 'solis-input-wrapper--error',
            disabled && 'solis-input-wrapper--disabled'
          )}
        >
          {leftIcon && <span className="solis-input-icon">{leftIcon}</span>}
          <input
            ref={ref}
            id={inputId}
            disabled={disabled}
            className="solis-input"
            {...props}
          />
          {rightIcon && <span className="solis-input-icon">{rightIcon}</span>}
        </div>
        {(error || helperText) && (
          <span className={cn('solis-input-helper', error && 'solis-input-helper--error')}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
