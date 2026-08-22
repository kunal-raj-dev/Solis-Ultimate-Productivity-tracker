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
  align?: 'left' | 'right' | 'auto';
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
  align = 'auto',
  className,
  disabled = false,
  id
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [computedAlign, setComputedAlign] = useState<'left' | 'right'>('left');
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

  const calculatePlacement = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 240 && rect.top > 200) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }

      if (align === 'left' || align === 'right') {
        setComputedAlign(align);
      } else {
        const spaceRight = window.innerWidth - rect.left;
        if (spaceRight < 220 || rect.left > window.innerWidth / 2) {
          setComputedAlign('right');
        } else {
          setComputedAlign('left');
        }
      }
    }
  };

  const handleToggle = () => {
    if (disabled) return;
    if (!isOpen) {
      calculatePlacement();
    }
    setIsOpen(!isOpen);
  };

  // Keyboard accessibility
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (disabled) return;

    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      if (isOpen && highlightedIndex >= 0 && options[highlightedIndex]) {
        onChange?.(options[highlightedIndex].value);
        setIsOpen(false);
      } else {
        handleToggle();
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (!isOpen) {
        calculatePlacement();
        setIsOpen(true);
        setHighlightedIndex(0);
      } else {
        setHighlightedIndex((prev) => (prev < options.length - 1 ? prev + 1 : 0));
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (!isOpen) {
        calculatePlacement();
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
    <div
      className={cn('solis-custom-select-group', isOpen && 'solis-custom-select-group--open', className)}
      ref={containerRef}
    >
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
          onClick={handleToggle}
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
            id={`${selectId}-listbox`}
            role="listbox"
            tabIndex={-1}
            aria-labelledby={selectId}
            className={cn(
              'solis-custom-select-dropdown',
              `solis-custom-select-dropdown--${variant}`,
              placement === 'top' && 'solis-custom-select-dropdown--open-up',
              computedAlign === 'right' && 'solis-custom-select-dropdown--right'
            )}
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
