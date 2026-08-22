import React, { useState, useRef, useEffect } from 'react';
import { Clock, X, Check } from 'lucide-react';
import { cn } from '../../../utils/classNames';
import './DatePicker.css';

export interface TimePickerProps {
  label?: string;
  value?: string; // HH:MM in 24h format e.g. "18:00"
  onChange: (time: string) => void;
  placeholder?: string;
  disabled?: boolean;
  align?: 'left' | 'right' | 'auto';
  className?: string;
}

const TIME_PRESETS = [
  { label: 'Morning (09:00)', value: '09:00' },
  { label: 'Midday (12:00)', value: '12:00' },
  { label: 'Afternoon (15:00)', value: '15:00' },
  { label: 'Evening (18:00)', value: '18:00' },
  { label: 'Night (21:00)', value: '21:00' }
];

export const TimePicker: React.FC<TimePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select Time...',
  disabled = false,
  align = 'auto',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [computedAlign, setComputedAlign] = useState<'left' | 'right'>('left');
  const containerRef = useRef<HTMLDivElement>(null);

  const initialHour = value ? value.split(':')[0] : '09';
  const initialMinute = value ? value.split(':')[1] : '00';
  const [selectedHour, setSelectedHour] = useState(initialHour);
  const [selectedMinute, setSelectedMinute] = useState(initialMinute);

  useEffect(() => {
    if (value) {
      const parts = value.split(':');
      if (parts.length >= 2) {
        setSelectedHour(parts[0]);
        setSelectedMinute(parts[1]);
      }
    }
  }, [value]);

  useEffect(() => {
    const handleOutsideClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const calculatePlacement = () => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const spaceBelow = window.innerHeight - rect.bottom;
      if (spaceBelow < 280 && rect.top > 280) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }

      if (align === 'left' || align === 'right') {
        setComputedAlign(align);
      } else {
        const spaceRight = window.innerWidth - rect.left;
        if (spaceRight < 280 || rect.left > window.innerWidth / 2) {
          setComputedAlign('right');
        } else {
          setComputedAlign('left');
        }
      }
    }
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) calculatePlacement();
    setIsOpen(!isOpen);
  };

  const handleSelectTime = (timeStr: string) => {
    onChange(timeStr);
    setIsOpen(false);
  };

  const handleApplyCustomTime = (hour: string, min: string) => {
    setSelectedHour(hour);
    setSelectedMinute(min);
    onChange(`${hour}:${min}`);
    setIsOpen(false);
  };

  const handleNow = () => {
    const now = new Date();
    const h = String(now.getHours()).padStart(2, '0');
    const m = String(now.getMinutes()).padStart(2, '0');
    handleApplyCustomTime(h, m);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  const hours = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'));
  const minutes = ['00', '05', '10', '15', '20', '25', '30', '35', '40', '45', '50', '55'];

  return (
    <div
      className={cn('solis-datepicker-group', isOpen && 'solis-datepicker-group--open', className)}
      ref={containerRef}
    >
      {label && <label className="solis-datepicker-label">{label}</label>}

      <div
        className={cn(
          'solis-datepicker-trigger',
          isOpen && 'solis-datepicker-trigger--active',
          disabled && 'solis-datepicker-trigger--disabled'
        )}
        onClick={toggleOpen}
        role="button"
        tabIndex={disabled ? -1 : 0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            toggleOpen();
          }
        }}
      >
        <Clock size={15} className="solis-datepicker-icon" />
        <span className={cn('solis-datepicker-value', !value && 'solis-datepicker-placeholder')}>
          {value || placeholder}
        </span>

        {value && !disabled && (
          <button
            type="button"
            className="solis-datepicker-clear-btn"
            onClick={handleClear}
            title="Clear time"
            aria-label="Clear time"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={cn(
            'solis-timepicker-dropdown',
            placement === 'top' && 'solis-datepicker-dropdown--top',
            computedAlign === 'right' && 'solis-timepicker-dropdown--right'
          )}
          onWheel={(e) => e.stopPropagation()}
        >
          {/* Quick Presets List */}
          <div className="solis-timepicker-presets">
            {TIME_PRESETS.map((p) => (
              <button
                key={p.value}
                type="button"
                className={cn(
                  'solis-timepicker-preset-item',
                  value === p.value && 'solis-timepicker-preset-item--active'
                )}
                onClick={() => handleSelectTime(p.value)}
              >
                <span>{p.label}</span>
                {value === p.value && <Check size={13} />}
              </button>
            ))}
          </div>

          {/* Dual Columns: Hour & Minute Scrollers */}
          <div className="solis-timepicker-custom-grid">
            <div className="solis-timepicker-column">
              <span className="solis-timepicker-column-header">Hour</span>
              <div className="solis-timepicker-column-list">
                {hours.map((h) => (
                  <button
                    key={h}
                    type="button"
                    className={cn(
                      'solis-timepicker-cell',
                      selectedHour === h && 'solis-timepicker-cell--selected'
                    )}
                    onClick={() => {
                      setSelectedHour(h);
                      handleApplyCustomTime(h, selectedMinute);
                    }}
                  >
                    {h}
                  </button>
                ))}
              </div>
            </div>

            <div className="solis-timepicker-column">
              <span className="solis-timepicker-column-header">Minute</span>
              <div className="solis-timepicker-column-list">
                {minutes.map((m) => (
                  <button
                    key={m}
                    type="button"
                    className={cn(
                      'solis-timepicker-cell',
                      selectedMinute === m && 'solis-timepicker-cell--selected'
                    )}
                    onClick={() => {
                      setSelectedMinute(m);
                      handleApplyCustomTime(selectedHour, m);
                    }}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Bottom Footer Actions */}
          <div className="solis-datepicker-footer">
            <button
              type="button"
              className="solis-datepicker-footer-clear"
              onClick={() => {
                onChange('');
                setIsOpen(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              className="solis-datepicker-footer-today"
              onClick={handleNow}
            >
              Now
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
