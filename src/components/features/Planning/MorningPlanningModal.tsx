import React, { useState, useEffect, useMemo } from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';
import { Input } from '../../ui/Input/Input';
import { Progress } from '../../ui/Progress/Progress';
import {
  Sun,
  Clock,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  Zap,
  Check
} from 'lucide-react';
import { Task, TaskTimeBlock } from '../../../types/task';
import { dataService } from '../../../services/dataService';
import { calendarService } from '../../../services/calendar/calendar.service';
import { getISODateString, addDays } from '../../../utils/date';
import {
  identifyRolloverTasks,
  calculateWorkloadCeiling,
  findAvailableFocusSlots,
  TaskTriageAction
} from '../../../utils/planning/morningRitual';
import { formatDurationMinutes } from '../../../utils/formatters';
import './MorningPlanningModal.css';

export interface MorningPlanningModalProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: Task[];
  timeBlocks: TaskTimeBlock[];
  dailyCapacityMinutes?: number;
  onPlanningCompleted?: () => void;
}

export const MorningPlanningModal: React.FC<MorningPlanningModalProps> = ({
  isOpen,
  onClose,
  tasks,
  timeBlocks,
  dailyCapacityMinutes = 360,
  onPlanningCompleted
}) => {
  const todayKey = useMemo(() => getISODateString(new Date()), []);
  const tomorrowKey = useMemo(() => getISODateString(addDays(new Date(), 1)), []);

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [secondsRemaining, setSecondsRemaining] = useState<number>(90);

  // Rollover triage state
  const rolloverTasks = useMemo(() => identifyRolloverTasks(tasks, todayKey), [tasks, todayKey]);
  const [triage, setTriage] = useState<Record<string, TaskTriageAction>>({});

  // Big 3 priorities
  const [big3Ids, setBig3Ids] = useState<string[]>([]);

  // Intention & Auto-scheduling
  const [dailyIntention, setDailyIntention] = useState('');
  const [isScheduling, setIsScheduling] = useState(false);
  const [scheduledSlotsCount, setScheduledSlotsCount] = useState(0);

  // 90-Second brisk timer
  useEffect(() => {
    if (!isOpen || step === 4) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [isOpen, step]);

  // Pre-seed Big 3 with any existing high priority tasks due today
  useEffect(() => {
    if (isOpen) {
      const todayDue = tasks.filter((t) => t.status !== 'completed' && t.dueDate === todayKey);
      const highPrio = todayDue.filter((t) => t.priority === 'urgent' || t.priority === 'high');
      const seed = highPrio.slice(0, 3).map((t) => t.id);
      setBig3Ids(seed);
    }
  }, [isOpen, tasks, todayKey]);

  if (!isOpen) return null;

  // Active pool of tasks considered for today (due today or triaged for today)
  const todayTasks = tasks.filter((t) => {
    if (t.status === 'completed') return false;
    if (triage[t.id] === 'today') return true;
    if (triage[t.id] === 'tomorrow' || triage[t.id] === 'someday') return false;
    return t.dueDate === todayKey || !t.dueDate;
  });

  // Calculate planned minutes from selected Big 3
  const committedTasks = tasks.filter((t) => big3Ids.includes(t.id));
  const plannedMinutes = committedTasks.reduce((sum, t) => sum + (t.estimatedMinutes || 60), 0);
  const workload = calculateWorkloadCeiling(plannedMinutes, dailyCapacityMinutes);

  const handleTriageAction = (taskId: string, action: TaskTriageAction) => {
    setTriage((prev) => ({ ...prev, [taskId]: action }));
  };

  const handleToggleBig3 = (taskId: string) => {
    setBig3Ids((prev) => {
      if (prev.includes(taskId)) {
        return prev.filter((id) => id !== taskId);
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), taskId]; // Keep at most 3
      }
      return [...prev, taskId];
    });
  };

  const handleAutoScheduleBig3 = async () => {
    setIsScheduling(true);
    try {
      // Apply triages in dataService
      for (const [taskId, action] of Object.entries(triage)) {
        if (action === 'tomorrow') {
          await dataService.tasks.updateTask(taskId, { dueDate: tomorrowKey });
        } else if (action === 'someday') {
          await dataService.tasks.updateTask(taskId, { dueDate: undefined });
        }
      }

      // Schedule committed Big 3 tasks into open slots
      const externalEvents = calendarService.getAllEvents(todayKey);
      const openHours = findAvailableFocusSlots({
        externalEvents,
        existingBlocks: timeBlocks,
        neededSlotsCount: committedTasks.length
      });

      let scheduledCount = 0;
      for (let i = 0; i < committedTasks.length; i++) {
        const task = committedTasks[i];
        const hour = openHours[i] ?? (9 + i * 2);

        // Check if block already exists for this task
        const alreadyScheduled = timeBlocks.some((b) => b.taskId === task.id);
        if (!alreadyScheduled) {
          await dataService.tasks.createTimeBlock({
            taskTitle: task.title,
            taskId: task.id,
            subjectId: task.subjectId,
            date: todayKey,
            startHour: hour,
            durationMinutes: task.estimatedMinutes || 60,
            priority: 'high',
            status: 'planned'
          });
          scheduledCount++;
        }
      }

      // Save calibration record
      const calibrationRecord = {
        date: todayKey,
        completedAt: new Date().toISOString(),
        big3TaskIds: big3Ids,
        plannedFocusMinutes: plannedMinutes,
        intention: dailyIntention.trim() || undefined
      };
      localStorage.setItem(`solis_morning_calibration_${todayKey}`, JSON.stringify(calibrationRecord));

      setScheduledSlotsCount(scheduledCount);
      setStep(4);
    } catch (err) {
      console.error('Failed to complete morning auto-scheduling:', err);
    } finally {
      setIsScheduling(false);
    }
  };

  const timerMin = Math.floor(secondsRemaining / 60);
  const timerSec = secondsRemaining % 60;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Guided 90-Second Morning Planning Ritual"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Top Header: Step Indicators & 90s Timer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div className="solis-morning-steps" style={{ margin: 0 }}>
            {[
              { num: 1, label: 'Triage' },
              { num: 2, label: 'Big 3' },
              { num: 3, label: 'Harmonize' },
              { num: 4, label: 'Ready' }
            ].map((s) => (
              <div
                key={s.num}
                className={`solis-morning-step-dot ${
                  step === s.num
                    ? 'solis-morning-step-dot--active'
                    : step > s.num
                    ? 'solis-morning-step-dot--done'
                    : ''
                }`}
              >
                <span>{s.num}. {s.label}</span>
              </div>
            ))}
          </div>

          <div className="solis-morning-timer-badge">
            <Clock size={12} />
            <span>{timerMin}:{String(timerSec).padStart(2, '0')}</span>
          </div>
        </div>

        {/* STEP 1: Rollover & Inbox Triage */}
        {step === 1 && (
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: 'var(--text-body-md)' }}>
              Step 1: Triage Rollover Work
            </h4>
            <p style={{ margin: '0 0 16px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              Clear lingering mental clutter. Decide quickly: keep for today, postpone to tomorrow, or drop to someday.
            </p>

            {rolloverTasks.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '24px 16px',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  borderRadius: 'var(--radius-md)'
                }}
              >
                <CheckCircle2 size={28} color="var(--color-sage-500)" style={{ margin: '0 auto 8px' }} />
                <h5 style={{ margin: '0 0 4px', fontSize: 'var(--text-body-sm)' }}>Zero Rollover Backlog</h5>
                <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                  You finished all past tasks or started with a clean slate! Proceed to commit today&apos;s Big 3.
                </p>
              </div>
            ) : (
              <div>
                {rolloverTasks.map((t) => {
                  const decision = triage[t.id] || 'today';
                  return (
                    <div key={t.id} className="solis-morning-task-card">
                      <div>
                        <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600 }}>{t.title}</span>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                          Due {t.dueDate} • {t.estimatedMinutes || 60}m estimated
                        </div>
                      </div>

                      <div className="solis-morning-actions-row">
                        <button
                          type="button"
                          className={`solis-triage-btn ${decision === 'today' ? 'solis-triage-btn--active' : ''}`}
                          onClick={() => handleTriageAction(t.id, 'today')}
                        >
                          Today
                        </button>
                        <button
                          type="button"
                          className={`solis-triage-btn ${decision === 'tomorrow' ? 'solis-triage-btn--active' : ''}`}
                          onClick={() => handleTriageAction(t.id, 'tomorrow')}
                        >
                          Tomorrow
                        </button>
                        <button
                          type="button"
                          className={`solis-triage-btn ${decision === 'someday' ? 'solis-triage-btn--active' : ''}`}
                          onClick={() => handleTriageAction(t.id, 'someday')}
                        >
                          Drop
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '16px' }}>
              <Button
                variant="accent"
                size="sm"
                rightIcon={<ArrowRight size={14} />}
                onClick={() => setStep(2)}
              >
                Next: Choose Big 3
              </Button>
            </div>
          </div>
        )}

        {/* STEP 2: Commit The Big 3 Priorities & Workload Ceiling */}
        {step === 2 && (
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: 'var(--text-body-md)' }}>
              Step 2: Commit Today&apos;s &quot;Big 3&quot; Priorities
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              Select up to 3 non-negotiable outcomes. If these 3 get done, today is a total success.
            </p>

            {/* Cognitive Workload Ceiling Guard */}
            <div className="solis-morning-workload-bar">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600 }}>
                  Cognitive Workload Guard
                </span>
                <span style={{ fontSize: 'var(--text-caption)', fontVariantNumeric: 'tabular-nums' }}>
                  <strong>{formatDurationMinutes(workload.plannedMinutes)}</strong> / {formatDurationMinutes(workload.dailyCapacityMinutes)}
                </span>
              </div>
              <Progress
                value={Math.min(100, workload.utilizationPercentage)}
                variant={workload.isOvercommitted ? 'coral' : 'sage'}
                size="sm"
              />
              {workload.warningMessage && (
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '11px',
                    color: 'var(--color-coral-500)',
                    marginTop: '2px'
                  }}
                >
                  <AlertTriangle size={13} style={{ flexShrink: 0 }} />
                  <span>{workload.warningMessage}</span>
                </div>
              )}
            </div>

            {/* Candidate Tasks for Today */}
            <div style={{ maxHeight: '220px', overflowY: 'auto' }}>
              {todayTasks.length === 0 ? (
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                  No open tasks found for today. Add tasks in the Tasks view.
                </p>
              ) : (
                todayTasks.map((t) => {
                  const isSelected = big3Ids.includes(t.id);
                  return (
                    <div
                      key={t.id}
                      className={`solis-morning-task-card ${isSelected ? 'solis-morning-task-card--selected' : ''}`}
                      onClick={() => handleToggleBig3(t.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div
                          style={{
                            width: '18px',
                            height: '18px',
                            borderRadius: '4px',
                            border: `2px solid ${isSelected ? 'var(--color-coral-500)' : 'var(--border-subtle)'}`,
                            backgroundColor: isSelected ? 'var(--color-coral-500)' : 'transparent',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            flexShrink: 0
                          }}
                        >
                          {isSelected && <Check size={12} />}
                        </div>
                        <div>
                          <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600 }}>{t.title}</span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'block' }}>
                            {t.estimatedMinutes || 60}m • {t.priority} priority
                          </span>
                        </div>
                      </div>

                      {isSelected && (
                        <Badge variant="coral" style={{ fontSize: '10px' }}>
                          Big 3 ({big3Ids.indexOf(t.id) + 1})
                        </Badge>
                      )}
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => setStep(1)}>
                Back
              </Button>
              <Button
                variant="accent"
                size="sm"
                rightIcon={<ArrowRight size={14} />}
                onClick={() => setStep(3)}
                disabled={big3Ids.length === 0}
              >
                Next: Harmonize &amp; Time-Block
              </Button>
            </div>
          </div>
        )}

        {/* STEP 3: Harmonize & Auto-Block */}
        {step === 3 && (
          <div>
            <h4 style={{ margin: '0 0 6px', fontSize: 'var(--text-body-md)' }}>
              Step 3: Harmonize with Calendar &amp; Slot
            </h4>
            <p style={{ margin: '0 0 12px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              Harmonize with your external calendar busy blocks and lock your Big 3 into open focus windows.
            </p>

            <div
              style={{
                padding: '12px',
                backgroundColor: 'var(--bg-surface-secondary)',
                borderRadius: 'var(--radius-md)',
                marginBottom: '14px'
              }}
            >
              <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, display: 'block', marginBottom: '8px' }}>
                Committed Big 3 Outcomes:
              </span>
              {committedTasks.map((t, i) => (
                <div key={t.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: 'var(--text-caption)', marginBottom: '4px' }}>
                  <Badge variant="coral" style={{ fontSize: '10px' }}>#{i + 1}</Badge>
                  <span>{t.title} ({t.estimatedMinutes || 60}m)</span>
                </div>
              ))}
            </div>

            <div>
              <label style={{ fontSize: 'var(--text-caption)', fontWeight: 600, display: 'block', marginBottom: '4px' }}>
                Daily Focus Intention (Optional Anchor):
              </label>
              <Input
                placeholder="e.g. Total focus on Operating Systems; no multitasking."
                value={dailyIntention}
                onChange={(e) => setDailyIntention(e.target.value)}
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '16px' }}>
              <Button variant="ghost" size="sm" leftIcon={<ArrowLeft size={14} />} onClick={() => setStep(2)}>
                Back
              </Button>
              <Button
                variant="accent"
                size="sm"
                leftIcon={<Zap size={14} />}
                onClick={handleAutoScheduleBig3}
                disabled={isScheduling}
              >
                {isScheduling ? 'Locking in Schedule...' : 'Auto-Block Big 3 into Open Slots'}
              </Button>
            </div>
          </div>
        )}

        {/* STEP 4: Day Calibrated Complete */}
        {step === 4 && (
          <div style={{ textAlign: 'center', padding: '16px 0' }}>
            <div
              style={{
                width: '56px',
                height: '56px',
                borderRadius: '50%',
                backgroundColor: 'rgba(78, 135, 82, 0.12)',
                color: 'var(--color-sage-500)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px'
              }}
            >
              <Sun size={32} />
            </div>

            <h3 style={{ margin: '0 0 6px', fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-2)' }}>
              Morning Calibration Complete
            </h3>
            <p style={{ margin: '0 0 16px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              {scheduledSlotsCount > 0
                ? `Allocated ${scheduledSlotsCount} study blocks around your commitments. Your day is structured for intentional deep work.`
                : 'Your schedule and Big 3 priorities are locked. Ready to execute.'}
            </p>

            {dailyIntention && (
              <div
                style={{
                  fontStyle: 'italic',
                  padding: '10px 14px',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  borderRadius: 'var(--radius-sm)',
                  fontSize: 'var(--text-caption)',
                  color: 'var(--text-primary)',
                  marginBottom: '20px'
                }}
              >
                &ldquo;{dailyIntention}&rdquo;
              </div>
            )}

            <Button
              variant="accent"
              size="md"
              leftIcon={<Sparkles size={16} />}
              onClick={() => {
                onClose();
                if (onPlanningCompleted) onPlanningCompleted();
              }}
            >
              Launch My Morning
            </Button>
          </div>
        )}
      </div>
    </Modal>
  );
};
