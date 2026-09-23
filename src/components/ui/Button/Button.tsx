import React, { ButtonHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../../utils/classNames';
import './Button.css';

export type ButtonVariant = 'primary' | 'secondary' | 'accent' | 'outline' | 'ghost' | 'subtle' | 'destructive';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  isFullWidth?: boolean;
  'data-cursor'?: string;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      isFullWidth = false,
      disabled,
      'data-cursor': dataCursor = 'action',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        aria-busy={isLoading ? 'true' : undefined}
        aria-disabled={disabled || isLoading ? 'true' : undefined}
        data-cursor={dataCursor}
        className={cn(
          'solis-btn',
          `solis-btn--${variant}`,
          `solis-btn--${size}`,
          isLoading && 'solis-btn--loading',
          isFullWidth && 'solis-btn--full',
          className
        )}
        {...props}
      >
        {isLoading ? (
          <span className="solis-btn__spinner" aria-hidden="true" />
        ) : (
          leftIcon && <span className="solis-btn__icon-left">{leftIcon}</span>
        )}
        <span>{children}</span>
        {!isLoading && rightIcon && <span className="solis-btn__icon-right">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';
