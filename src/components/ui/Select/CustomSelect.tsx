import React, { useState, useRef, useEffect, useId } from 'react';
import { ChevronDown, Check } from 'lucide-react';
import { cn } from '../../../utils/classNames';
import './CustomSelect.css';

export interface CustomSelectOption {
  value: string;
  label: string;
  sublabel?: string;
  badge?: string;
  color?: string;
}

export interface CustomSelectProps {
  label?: string;
  value?: string;
  onChange?: (value: string) => void;
  options: CustomSelectOption[];
  placeholder?: string;
  helperText?: string;
  error?: string;
  variant?: 'surface' | 'subtle' | 'dark';
  className?: string;
  disabled?: boolean;
  id?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  label,
  value,
  onChange,
  options,
  placeholder = 'Select option...',
  helperText,
  error,
  variant = 'surface',
  className,
  disabled = false,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const listboxRef = useRef<HTMLUListElement>(null);
  const generatedId = useId();
  const selectId = id || generatedId;

  const selectedOption = options.find((opt) => opt.value === value);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && options[highlightedIndex]) {
        onChange?.(options[highlightedIndex].value);
        setIsOpen(false);
      } else {
        setIsOpen(!isOpen);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        setIsOpen(true);
        setHighlightedIndex(options.length - 1);
      } else {
        setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : options.length - 1));
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  return (
    <div className={cn('solis-custom-select-group', className)} ref={containerRef}>
      {label && (
        <label htmlFor={selectId} className="solis-custom-select-label">
          {label}
        </label>
      )}

      <div className="solis-custom-select-wrapper">
        <button
          type="button"
          id={selectId}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          disabled={disabled}
          onClick={() => !disabled && setIsOpen(!isOpen)}
          onKeyDown={handleKeyDown}
          className={cn(
            'solis-custom-select-trigger',
            `solis-custom-select-trigger--${variant}`,
            isOpen && 'solis-custom-select-trigger--open',
            error && 'solis-custom-select-trigger--error',
            disabled && 'solis-custom-select-trigger--disabled'
          )}
        >
          <span className="solis-custom-select-trigger__label">
            {selectedOption ? (
              <span className="solis-custom-select-value">
                {selectedOption.badge && (
                  <span className="solis-custom-select-badge">{selectedOption.badge}</span>
                )}
                <span>{selectedOption.label}</span>
              </span>
            ) : (
              <span className="solis-custom-select-placeholder">{placeholder}</span>
            )}
          </span>

          <ChevronDown
            size={16}
            className={cn('solis-custom-select-chevron', isOpen && 'solis-custom-select-chevron--rotated')}
          />
        </button>

        {isOpen && (
          <ul
            ref={listboxRef}
            role="listbox"
            tabIndex={-1}
            className={cn('solis-custom-select-dropdown', `solis-custom-select-dropdown--${variant}`)}
          >
            {options.map((opt, idx) => {
              const isSelected = opt.value === value;
              const isHighlighted = idx === highlightedIndex;

              return (
                <li
                  key={opt.value}
                  role="option"
                  aria-selected={isSelected}
                  className={cn(
                    'solis-custom-select-option',
                    isSelected && 'solis-custom-select-option--selected',
                    isHighlighted && 'solis-custom-select-option--highlighted'
                  )}
                  onClick={() => {
                    onChange?.(opt.value);
                    setIsOpen(false);
                  }}
                  onMouseEnter={() => setHighlightedIndex(idx)}
                >
                  <div className="solis-custom-select-option__content">
                    {opt.badge && <span className="solis-custom-select-badge">{opt.badge}</span>}
                    <div className="solis-custom-select-option__text">
                      <span className="solis-custom-select-option__label">{opt.label}</span>
                      {opt.sublabel && (
                        <span className="solis-custom-select-option__sublabel">{opt.sublabel}</span>
                      )}
                    </div>
                  </div>
                  {isSelected && <Check size={14} className="solis-custom-select-option__check" />}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {(error || helperText) && (
        <span className={cn('solis-input-helper', error && 'solis-input-helper--error')}>
          {error || helperText}
        </span>
      )}
    </div>
  );
};
