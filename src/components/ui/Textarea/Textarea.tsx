import { TextareaHTMLAttributes, forwardRef, useId } from 'react';
import { cn } from '../../../utils/classNames';
import './Textarea.css';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, error, className, disabled, id, ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id || generatedId;

    return (
      <div className={cn('solis-textarea-group', className)}>
        {label && (
          <label htmlFor={textareaId} className="solis-textarea-label">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          disabled={disabled}
          className={cn('solis-textarea', error && 'solis-textarea--error')}
          {...props}
        />
        {(error || helperText) && (
          <span className={cn('solis-input-helper', error && 'solis-input-helper--error')}>
            {error || helperText}
          </span>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';
