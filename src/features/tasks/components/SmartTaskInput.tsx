import React, { useState, useMemo } from 'react';
import { Sparkles, Plus, X, Calendar, Clock, Timer, AlertCircle, Repeat, Tag, BookOpen } from 'lucide-react';
import { parseNLPTaskInput, ParsedNLPChip } from '../../../utils/tasks/nlpParser';
import { Task, TaskCategory } from '../../../types/task';
import { StudySubject } from '../../../types/study';
import { Button } from '../../../components/ui/Button/Button';
import { hapticsEngine } from '../../../utils/focus/hapticsEngine';
import './SmartTaskInput.css';

interface SmartTaskInputProps {
  onCommit: (taskData: Partial<Task>) => Promise<void>;
  subjects?: StudySubject[];
  defaultCategory?: TaskCategory;
  defaultDueDate?: string;
  placeholder?: string;
  autoFocus?: boolean;
  inputRef?: React.Ref<HTMLInputElement>;
}

export const SmartTaskInput: React.FC<SmartTaskInputProps> = ({
  onCommit,
  subjects = [],
  defaultCategory = 'study',
  defaultDueDate,
  placeholder = 'Add deliberate task... e.g. "Study DSA tomorrow at 4pm for 90m !high #study"',
  autoFocus = false,
  inputRef
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dismissedChipIds, setDismissedChipIds] = useState<Set<string>>(new Set());

  // Known subjects for NLP parsing
  const knownSubs = useMemo(() => {
    return subjects.map((s) => ({ id: s.id, name: s.name }));
  }, [subjects]);

  // Live NLP parsing
  const parsed = useMemo(() => {
    if (!inputVal.trim()) return null;
    return parseNLPTaskInput(inputVal, knownSubs);
  }, [inputVal, knownSubs]);

  // Filter out dismissed chips
  const activeChips = useMemo(() => {
    if (!parsed) return [];
    return parsed.chips.filter((c) => !dismissedChipIds.has(c.id));
  }, [parsed, dismissedChipIds]);

  const handleDismissChip = (chipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedChipIds((prev) => new Set(prev).add(chipId));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() || isSubmitting) return;

    setIsSubmitting(true);
    hapticsEngine.playMechanicalTick();

    try {
      const taskPayload: Partial<Task> = {
        title: parsed?.title || inputVal.trim(),
        naturalLanguageInput: inputVal.trim(),
        category: defaultCategory,
        priority: 'medium',
        dueDate: defaultDueDate
      };

      if (parsed) {
        if (!dismissedChipIds.has('date') && parsed.dueDate) {
          taskPayload.dueDate = parsed.dueDate;
        }
        if (!dismissedChipIds.has('time') && parsed.dueTime) {
          taskPayload.dueTime = parsed.dueTime;
        }
        if (!dismissedChipIds.has('duration') && parsed.estimatedMinutes) {
          taskPayload.estimatedMinutes = parsed.estimatedMinutes;
        }
        if (!dismissedChipIds.has('priority') && parsed.priority) {
          taskPayload.priority = parsed.priority;
        }
        if (!dismissedChipIds.has('category') && parsed.category) {
          taskPayload.category = parsed.category;
        }
        if (!dismissedChipIds.has('recurrence') && parsed.recurrence) {
          taskPayload.recurrence = parsed.recurrence;
          taskPayload.isRecurring = true;
        }
        if (!dismissedChipIds.has('subject') && parsed.subjectId) {
          taskPayload.subjectId = parsed.subjectId;
        }
        if (parsed.tags && parsed.tags.length > 0) {
          taskPayload.tags = parsed.tags.filter((t) => !dismissedChipIds.has(`tag-${t}`));
        }
      }

      await onCommit(taskPayload);
      setInputVal('');
      setDismissedChipIds(new Set());
    } finally {
      setIsSubmitting(false);
    }
  };

  const getChipIcon = (type: ParsedNLPChip['type']) => {
    switch (type) {
      case 'date':
        return <Calendar size={11} />;
      case 'time':
        return <Clock size={11} />;
      case 'duration':
        return <Timer size={11} />;
      case 'priority':
        return <AlertCircle size={11} />;
      case 'recurrence':
        return <Repeat size={11} />;
      case 'category':
      case 'tag':
        return <Tag size={11} />;
      case 'subject':
        return <BookOpen size={11} />;
      default:
        return null;
    }
  };

  return (
    <div className="solis-smart-input-container">
      <form onSubmit={handleSubmit} className="solis-smart-input-box">
        <Sparkles size={16} className="solis-smart-input-sparkle" />
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => {
            setInputVal(e.target.value);
            if (dismissedChipIds.size > 0) {
              setDismissedChipIds(new Set());
            }
          }}
          placeholder={placeholder}
          className="solis-smart-input-field"
          disabled={isSubmitting}
          autoFocus={autoFocus}
          aria-label="Natural language task capture"
        />
        <Button
          type="submit"
          variant="accent"
          size="sm"
          disabled={!inputVal.trim() || isSubmitting}
          isLoading={isSubmitting}
          leftIcon={<Plus size={14} />}
        >
          Capture
        </Button>
      </form>

      {/* Live Natural Language Parsing Chips */}
      {activeChips.length > 0 && (
        <div className="solis-smart-input-chips-tray" aria-label="Parsed task interpretation">
          <span className="solis-smart-chips-label">Parsed interpretation:</span>
          {activeChips.map((chip) => (
            <span key={chip.id} className={`solis-smart-chip solis-smart-chip--${chip.type}`}>
              {getChipIcon(chip.type)}
              <span>{chip.label}</span>
              <button
                type="button"
                className="solis-smart-chip-remove"
                onClick={(e) => handleDismissChip(chip.id, e)}
                title={`Remove ${chip.type}`}
                aria-label={`Remove ${chip.label}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
};
