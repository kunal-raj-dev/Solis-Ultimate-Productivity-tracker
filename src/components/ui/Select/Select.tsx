import { SelectHTMLAttributes, forwardRef, useId } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '../../../utils/classNames';
import './Select.css';

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  error?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, helperText, error, className, id, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;

    return (
      <div className={cn('solis-select-group', className)}>
        {label && (
          <label htmlFor={selectId} className="solis-select-label">
            {label}
          </label>
        )}
        <div className="solis-select-wrapper">
          <select ref={ref} id={selectId} className="solis-select" {...props}>
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          <span className="solis-select-icon" aria-hidden="true">
            <ChevronDown size={16} />
          </span>
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

Select.displayName = 'Select';
