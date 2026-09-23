import React, { useState, useMemo } from 'react';
import { Sparkles, Plus, X, Calendar, Clock, Timer, AlertCircle, Repeat, Tag, BookOpen } from 'lucide-react';
import { parseNLPTaskInput, ParsedNLPChip } from '../../../utils/tasks/nlpParser';
import { Task, TaskCategory } from '../../../types/task';
import { StudySubject } from '../../../types/study';
import { Button } from '../../../components/ui/Button/Button';
import { hapticsEngine } from '../../../utils/focus/hapticsEngine';
import { getISODateString } from '../../../utils/date';
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
  placeholder = 'Add a new task... (e.g. "Read Math Chapter 3 tomorrow at 4pm for 45m")',
  autoFocus = false,
  inputRef
}) => {
  const [inputVal, setInputVal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [dismissedChipIds, setDismissedChipIds] = useState<Set<string>>(new Set());
  const [chipOverrides, setChipOverrides] = useState<Record<string, { label: string; value: any }>>({});

  // Known subjects for NLP parsing
  const knownSubs = useMemo(() => {
    return subjects.map((s) => ({ id: s.id, name: s.name }));
  }, [subjects]);

  // Live NLP parsing
  const parsed = useMemo(() => {
    if (!inputVal.trim()) return null;
    return parseNLPTaskInput(inputVal, knownSubs);
  }, [inputVal, knownSubs]);

  // Filter out dismissed chips and apply interactive overrides
  const activeChips = useMemo(() => {
    if (!parsed) return [];
    return parsed.chips
      .filter((c) => !dismissedChipIds.has(c.id))
      .map((c) => {
        if (chipOverrides[c.id]) {
          return { ...c, label: chipOverrides[c.id].label, value: chipOverrides[c.id].value };
        }
        return c;
      });
  }, [parsed, dismissedChipIds, chipOverrides]);

  const handleDismissChip = (chipId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedChipIds((prev) => new Set(prev).add(chipId));
  };

  const handleEditChip = (chip: ParsedNLPChip, e: React.MouseEvent) => {
    e.stopPropagation();
    hapticsEngine.playMechanicalTick();

    if (chip.type === 'priority') {
      const currentPrio = chipOverrides['priority']?.value || chip.value || 'medium';
      const order: ('urgent' | 'high' | 'medium' | 'low')[] = ['urgent', 'high', 'medium', 'low'];
      const nextPrio = order[(order.indexOf(currentPrio) + 1) % order.length];
      setChipOverrides((prev) => ({
        ...prev,
        priority: { label: `Priority: ${nextPrio.toUpperCase()}`, value: nextPrio }
      }));
    } else if (chip.type === 'duration') {
      const currentDur = chipOverrides['duration']?.value || chip.value || 30;
      const durations = [15, 25, 30, 45, 60, 90, 120];
      const nextIdx = (durations.indexOf(currentDur) + 1) % durations.length;
      const nextDur = nextIdx >= 0 ? durations[nextIdx] : 45;
      setChipOverrides((prev) => ({
        ...prev,
        duration: { label: `⏱️ ${nextDur}m`, value: nextDur }
      }));
    } else if (chip.type === 'category') {
      const currentCat = chipOverrides['category']?.value || chip.value || 'study';
      const cats: TaskCategory[] = ['study', 'deep_work', 'project', 'review', 'admin'];
      const nextCat = cats[(cats.indexOf(currentCat) + 1) % cats.length];
      setChipOverrides((prev) => ({
        ...prev,
        category: { label: `#${nextCat}`, value: nextCat }
      }));
    } else if (chip.type === 'date') {
      const now = new Date();
      const todayStr = getISODateString(now);
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = getISODateString(tomorrow);
      const nextWeek = new Date(now);
      nextWeek.setDate(nextWeek.getDate() + 7);
      const nextWeekStr = getISODateString(nextWeek);

      const currentDate = chipOverrides['date']?.value || chip.value || todayStr;
      let nextDate = tomorrowStr;
      let nextLabel = '📅 Tomorrow';
      if (currentDate === tomorrowStr) {
        nextDate = nextWeekStr;
        nextLabel = '📅 Next Week';
      } else if (currentDate === nextWeekStr) {
        nextDate = todayStr;
        nextLabel = '📅 Today';
      }
      setChipOverrides((prev) => ({
        ...prev,
        date: { label: nextLabel, value: nextDate }
      }));
    } else if (chip.type === 'subject' && subjects.length > 0) {
      const currentSubId = chipOverrides['subject']?.value || chip.value;
      const subIdx = subjects.findIndex((s) => s.id === currentSubId);
      const nextSub = subjects[(subIdx + 1) % subjects.length];
      setChipOverrides((prev) => ({
        ...prev,
        subject: { label: `📖 ${nextSub.name}`, value: nextSub.id }
      }));
    }
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
        if (!dismissedChipIds.has('date')) {
          taskPayload.dueDate = chipOverrides['date']?.value || parsed.dueDate || defaultDueDate;
        }
        if (!dismissedChipIds.has('time') && parsed.dueTime) {
          taskPayload.dueTime = parsed.dueTime;
        }
        if (!dismissedChipIds.has('duration')) {
          taskPayload.estimatedMinutes = chipOverrides['duration']?.value || parsed.estimatedMinutes;
        }
        if (!dismissedChipIds.has('priority')) {
          taskPayload.priority = chipOverrides['priority']?.value || parsed.priority;
        }
        if (!dismissedChipIds.has('category')) {
          taskPayload.category = chipOverrides['category']?.value || parsed.category || defaultCategory;
        }
        if (!dismissedChipIds.has('recurrence') && parsed.recurrence) {
          taskPayload.recurrence = parsed.recurrence;
          taskPayload.isRecurring = true;
        }
        if (!dismissedChipIds.has('subject')) {
          taskPayload.subjectId = chipOverrides['subject']?.value || parsed.subjectId;
        }
        if (parsed.tags && parsed.tags.length > 0) {
          taskPayload.tags = parsed.tags.filter((t) => !dismissedChipIds.has(`tag-${t}`));
        }
      }

      await onCommit(taskPayload);
      setInputVal('');
      setDismissedChipIds(new Set());
      setChipOverrides({});
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
          aria-label="Add a task"
        />
        <Button
          type="submit"
          variant="accent"
          size="sm"
          disabled={!inputVal.trim() || isSubmitting}
          isLoading={isSubmitting}
          leftIcon={<Plus size={14} />}
        >
          Add Task
        </Button>
      </form>

      {/* Live Natural Language Parsing Chips */}
      {activeChips.length > 0 && (
        <div className="solis-smart-input-chips-tray" aria-label="Detected task details">
          <span className="solis-smart-chips-label">Auto-detected details:</span>
          {activeChips.map((chip) => (
            <span
              key={chip.id}
              className={`solis-smart-chip solis-smart-chip--${chip.type}`}
              onClick={(e) => handleEditChip(chip, e)}
              title="Click to cycle/edit value, or click × to dismiss"
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleEditChip(chip, e as any);
                }
              }}
            >
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
