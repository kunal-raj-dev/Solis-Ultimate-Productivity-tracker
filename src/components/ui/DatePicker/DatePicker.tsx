import React, { useState, useRef, useEffect } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { getISODateString, addDays } from '../../../utils/date';
import { cn } from '../../../utils/classNames';
import './DatePicker.css';

export interface DatePickerProps {
  label?: string;
  value?: string; // YYYY-MM-DD
  onChange: (date: string) => void;
  placeholder?: string;
  disabled?: boolean;
  minDate?: string;
  maxDate?: string;
  align?: 'left' | 'right' | 'auto';
  className?: string;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const DAY_NAMES = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

export const DatePicker: React.FC<DatePickerProps> = ({
  label,
  value,
  onChange,
  placeholder = 'Select Date...',
  disabled = false,
  minDate,
  maxDate,
  align = 'auto',
  className
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const [computedAlign, setComputedAlign] = useState<'left' | 'right'>('left');

  const initialDate = value ? new Date(value + 'T00:00:00') : new Date();
  const [viewYear, setViewYear] = useState<number>(
    isNaN(initialDate.getFullYear()) ? new Date().getFullYear() : initialDate.getFullYear()
  );
  const [viewMonth, setViewMonth] = useState<number>(
    isNaN(initialDate.getMonth()) ? new Date().getMonth() : initialDate.getMonth()
  );

  const containerRef = useRef<HTMLDivElement>(null);
  const lastWheelTimeRef = useRef<number>(0);

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
      if (spaceBelow < 320 && rect.top > 320) {
        setPlacement('top');
      } else {
        setPlacement('bottom');
      }

      if (align === 'left' || align === 'right') {
        setComputedAlign(align);
      } else {
        const spaceRight = window.innerWidth - rect.left;
        if (spaceRight < 300 || rect.left > window.innerWidth / 2) {
          setComputedAlign('right');
        } else {
          setComputedAlign('left');
        }
      }
    }
  };

  const toggleOpen = () => {
    if (disabled) return;
    if (!isOpen) {
      calculatePlacement();
      if (value) {
        const d = new Date(value + 'T00:00:00');
        if (!isNaN(d.getTime())) {
          setViewYear(d.getFullYear());
          setViewMonth(d.getMonth());
        }
      }
    }
    setIsOpen(!isOpen);
  };

  const handlePrevMonth = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else {
      setViewMonth((m) => m - 1);
    }
  };

  const handleNextMonth = (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else {
      setViewMonth((m) => m + 1);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    const now = Date.now();
    // Smooth throttle for responsive mouse wheel flipping
    if (now - lastWheelTimeRef.current < 150) {
      return;
    }
    lastWheelTimeRef.current = now;

    if (e.deltaY > 0) {
      handleNextMonth();
    } else if (e.deltaY < 0) {
      handlePrevMonth();
    }
  };

  const handleSelectDate = (dateStr: string) => {
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleQuickPreset = (daysOffset: number) => {
    const target = addDays(new Date(), daysOffset);
    handleSelectDate(getISODateString(target));
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange('');
  };

  // Generate calendar grid days
  const firstDayOfMonth = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const daysInPrevMonth = new Date(viewYear, viewMonth, 0).getDate();

  const days: { dateStr: string; dayNum: number; isCurrentMonth: boolean }[] = [];

  for (let i = firstDayOfMonth - 1; i >= 0; i--) {
    const dayNum = daysInPrevMonth - i;
    const prevMonthDate = new Date(viewYear, viewMonth - 1, dayNum);
    days.push({
      dateStr: getISODateString(prevMonthDate),
      dayNum,
      isCurrentMonth: false
    });
  }

  for (let i = 1; i <= daysInMonth; i++) {
    const currentDate = new Date(viewYear, viewMonth, i);
    days.push({
      dateStr: getISODateString(currentDate),
      dayNum: i,
      isCurrentMonth: true
    });
  }

  const remaining = (7 - (days.length % 7)) % 7;
  for (let i = 1; i <= remaining; i++) {
    const nextMonthDate = new Date(viewYear, viewMonth + 1, i);
    days.push({
      dateStr: getISODateString(nextMonthDate),
      dayNum: i,
      isCurrentMonth: false
    });
  }

  const todayStr = getISODateString(new Date());

  const getDisplayValue = () => {
    if (!value) return '';
    const parts = value.split('-');
    if (parts.length === 3) {
      const d = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      if (!isNaN(d.getTime())) {
        if (value === todayStr) return 'Today';
        if (value === getISODateString(addDays(new Date(), 1))) return 'Tomorrow';
        return new Intl.DateTimeFormat('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric'
        }).format(d);
      }
    }
    return value;
  };

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
        <CalendarIcon size={15} className="solis-datepicker-icon" />
        <span className={cn('solis-datepicker-value', !value && 'solis-datepicker-placeholder')}>
          {getDisplayValue() || placeholder}
        </span>

        {value && !disabled && (
          <button
            type="button"
            className="solis-datepicker-clear-btn"
            onClick={handleClear}
            title="Clear date"
            aria-label="Clear date"
          >
            <X size={13} />
          </button>
        )}
      </div>

      {isOpen && (
        <div
          className={cn(
            'solis-datepicker-dropdown',
            placement === 'top' && 'solis-datepicker-dropdown--top',
            computedAlign === 'right' && 'solis-datepicker-dropdown--right'
          )}
          onWheel={handleWheel}
        >
          {/* Quick Presets Bar */}
          <div className="solis-datepicker-presets">
            <button type="button" onClick={() => handleQuickPreset(0)} className="solis-datepicker-preset-btn">
              Today
            </button>
            <button type="button" onClick={() => handleQuickPreset(1)} className="solis-datepicker-preset-btn">
              Tomorrow
            </button>
            <button type="button" onClick={() => handleQuickPreset(3)} className="solis-datepicker-preset-btn">
              +3 Days
            </button>
            <button type="button" onClick={() => handleQuickPreset(7)} className="solis-datepicker-preset-btn">
              Next Wk
            </button>
          </div>

          {/* Month/Year Navigation Bar */}
          <div className="solis-datepicker-header">
            <button
              type="button"
              className="solis-datepicker-nav-btn"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft size={16} />
            </button>

            <div className="solis-datepicker-month-label">
              {MONTH_NAMES[viewMonth]} {viewYear}
            </div>

            <button
              type="button"
              className="solis-datepicker-nav-btn"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight size={16} />
            </button>
          </div>

          {/* Day of Week Headers */}
          <div className="solis-datepicker-grid-headers">
            {DAY_NAMES.map((d) => (
              <span key={d} className="solis-datepicker-day-name">
                {d}
              </span>
            ))}
          </div>

          {/* Calendar Grid */}
          <div className="solis-datepicker-grid">
            {days.map((item, idx) => {
              const isSelected = item.dateStr === value;
              const isCurrentDay = item.dateStr === todayStr;
              const isPastDate = minDate && item.dateStr < minDate;
              const isFutureDate = maxDate && item.dateStr > maxDate;
              const isDateDisabled = Boolean(isPastDate || isFutureDate);

              return (
                <button
                  key={`${item.dateStr}_${idx}`}
                  type="button"
                  disabled={isDateDisabled}
                  onClick={() => handleSelectDate(item.dateStr)}
                  className={cn(
                    'solis-datepicker-day',
                    !item.isCurrentMonth && 'solis-datepicker-day--other-month',
                    isCurrentDay && 'solis-datepicker-day--today',
                    isSelected && 'solis-datepicker-day--selected'
                  )}
                >
                  {item.dayNum}
                </button>
              );
            })}
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
              onClick={() => handleSelectDate(todayStr)}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
