import { InputHTMLAttributes, forwardRef } from 'react';
import { cn } from '../../../utils/classNames';
import './Switch.css';

export interface SwitchProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(
  ({ label, className, checked, ...props }, ref) => {
    return (
      <label className={cn('solis-switch-label', className)}>
        <input
          ref={ref}
          type="checkbox"
          role="switch"
          aria-checked={Boolean(checked)}
          checked={checked}
          className="solis-switch-input sr-only"
          {...props}
        />
        <span className="solis-switch-track" aria-hidden="true">
          <span className="solis-switch-thumb" />
        </span>
        {label && <span>{label}</span>}
      </label>
    );
  }
);

Switch.displayName = 'Switch';
