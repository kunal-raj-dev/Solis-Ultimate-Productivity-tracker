import { InputHTMLAttributes, forwardRef } from 'react';
import { Check } from 'lucide-react';
import { cn } from '../../../utils/classNames';
import './Checkbox.css';

export interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: React.ReactNode;
}

export const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  ({ label, className, checked, ...props }, ref) => {
    return (
      <label className={cn('solis-checkbox-label', className)}>
        <input
          ref={ref}
          type="checkbox"
          aria-checked={Boolean(checked)}
          checked={checked}
          className="solis-checkbox-input sr-only"
          {...props}
        />
        <span className="solis-checkbox-custom" aria-hidden="true">
          {checked && <Check size={12} strokeWidth={3} />}
        </span>
        {label && <span>{label}</span>}
      </label>
    );
  }
);

Checkbox.displayName = 'Checkbox';
