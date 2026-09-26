import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';
import { Progress } from '../../ui/Progress/Progress';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import { Goal } from '../../../types/goal';
import { StudyTopic } from '../../../types/study';
import { Flashcard } from '../../../types/learning';
import { StudyResource } from '../../../types/resource';
import { Habit } from '../../../types/habit';
import { RecurringStudyRoutine } from '../../../types/planning';
import { dataService } from '../../../services/dataService';
import { calculateExamReadiness } from '../../../utils/intelligence/masteryIntelligence';
import {
  calculateTimeCushion,
  formatCushionHours,
  projectRoutineCommitmentsByDay,
  TIME_CUSHION_STATUS_META
} from '../../../utils/planning/timeCushion';
import { getDefaultDailyCapacityMinutes } from '../../../utils/tasks/workloadCalculator';
import { formatErrorMessage } from '../../../utils/errors';
import { getISODateString, isPast } from '../../../utils/date';
import { ExamReadinessCard } from '../Analytics/ExamReadinessCard';
import { ExamFeasibilityCard } from './ExamFeasibilityCard';
import { calculateExamFeasibility } from '../../../utils/planning/examFeasibility';
import { TimeCushionInput } from '../../../utils/planning/timeCushion';
import { BrainCircuit, Play, Bookmark, ExternalLink, Flame, CalendarPlus } from 'lucide-react';
import './ExamWorkspaceModal.css';

export interface ExamWorkspaceModalProps {
  isOpen: boolean;
  onClose: () => void;
  goal: Goal | null;
  topics: StudyTopic[];
  flashcards: Flashcard[];
  resources?: StudyResource[];
  habits?: Habit[];
  /** Daily deep-work capacity in minutes (user.dailyGoalMinutes || 360). */
  dailyCapacityMinutes?: number;
  onToggleMilestone: (goalId: string, milestoneId: string) => Promise<void>;
  onStartRecallDrill: (topicCards: Flashcard[]) => void;
  onLaunchFocus: (subjectId?: string, title?: string) => void;
}

/** Service-layer ceiling: validateTimeBlockInput rejects durations > 720 minutes (12h). */
const MAX_BLOCK_DURATION_MINUTES = 720;

export const ExamWorkspaceModal: React.FC<ExamWorkspaceModalProps> = ({
  isOpen,
  onClose,
  goal,
  topics,
  flashcards,
  resources,
  habits,
  dailyCapacityMinutes,
  onToggleMilestone,
  onStartRecallDrill,
  onLaunchFocus
}) => {
  const navigate = useNavigate();
  const [routines, setRoutines] = useState<RecurringStudyRoutine[]>([]);
  const [routinesUnavailable, setRoutinesUnavailable] = useState(false);
  const [scheduleError, setScheduleError] = useState<string | null>(null);
  const isWorkspaceActive = isOpen && goal !== null;

  // Recurring routines project onto the exam horizon as scheduled commitments
  // for the Time Cushion diagnostic (master.md §6). Single cached read on open.
  useEffect(() => {
    if (!isWorkspaceActive) return;
    let isMounted = true;
    setRoutinesUnavailable(false);
    if (dataService.routines) {
      dataService.routines
        .getRoutines()
        .then((res) => {
          if (isMounted) setRoutines(res || []);
        })
        .catch(() => {
          // Honest degradation: without routines the cushion would silently
          // overstate available hours, so the card says so (master.md §16.1).
          if (isMounted) setRoutinesUnavailable(true);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [isWorkspaceActive, goal?.id]);

  if (!isOpen || !goal) return null;

  const subjectTopics = goal.subjectId ? topics.filter((t) => t.subjectId === goal.subjectId) : [];
  const subjectFlashcards = goal.subjectId ? flashcards.filter((c) => c.subjectId === goal.subjectId) : [];
  const masteredCount = subjectTopics.filter((t) => t.masteryLevel === 'mastered').length;
  const masteryPercentage = subjectTopics.length > 0
    ? Math.round((masteredCount / subjectTopics.length) * 100)
    : 0;
  const completedMilestones = (goal.milestones || []).filter((m) => m.completed).length;

  const readiness = calculateExamReadiness({
    goal,
    topics: subjectTopics,
    flashcards: subjectFlashcards,
    habits: habits || []
  });

  // Forward Time Cushion (plan §2.1/§2.3 / F-104)
  const capacityMins = dailyCapacityMinutes ?? getDefaultDailyCapacityMinutes();
  const cushionInput: TimeCushionInput = {
    examDate: goal.targetDate,
    subjectId: goal.subjectId || '',
    topics: subjectTopics,
    dailyCapacityMinutes: capacityMins,
    existingCommitmentsMinutesByDay: projectRoutineCommitmentsByDay(routines, goal.targetDate)
  };
  const cushion = calculateTimeCushion(cushionInput);
  const feasibility = calculateExamFeasibility(cushion, capacityMins);
  const cushionMeta = TIME_CUSHION_STATUS_META[cushion.status];

  // The scheduled block honors the service validation cap (720m / 12h); when
  // the required pace exceeds it, the CTA labels the actual block size while
  // the diagnostic card above keeps showing the true pace.
  const scheduleBlockMinutes = Math.min(
    MAX_BLOCK_DURATION_MINUTES,
    Math.max(30, Math.round(cushion.requiredHoursPerDay * 60))
  );

  // Days Remaining 0 covers both exam-day and overdue/past target dates —
  // label them honestly instead of showing "Exam today" indefinitely.
  const horizonLabel =
    cushion.daysRemaining > 0
      ? `${cushion.daysRemaining}d remaining`
      : isPast(goal.targetDate)
        ? 'Past due'
        : 'Exam today';

  const handleScheduleDailyFocusBlock = async () => {
    setScheduleError(null);
    try {
      await dataService.tasks.createTimeBlock({
        taskTitle: `Exam Prep: ${goal.title}`,
        date: getISODateString(new Date()),
        startHour: Math.min(23, new Date().getHours() + 1),
        durationMinutes: scheduleBlockMinutes,
        goalId: goal.id,
        subjectId: goal.subjectId,
        priority: 'high',
        status: 'planned'
      });
      onClose();
      navigate('/app/tasks?view=schedule');
    } catch (err) {
      setScheduleError(
        formatErrorMessage(err, 'Could not schedule the focus block just now. Please try again.')
      );
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Exam Command Sanctuary"
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Deterministic Exam Readiness Card */}
        <ExamReadinessCard result={readiness} goalTitle={goal.title} />

        {/* Visual Time-Cushion & Exam Feasibility UI (F-104) */}
        <ExamFeasibilityCard
          analysis={feasibility}
          cushionInput={cushionInput}
          onSchedulePacedBlock={() => handleScheduleDailyFocusBlock()}
        />

        {/* Top Header: Countdown & Target Grade */}
        <div className="solis-exam-countdown-card">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Badge variant="coral">Exam Workspace</Badge>
              {goal.subjectName && (
                <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                  {goal.subjectName}
                </span>
              )}
            </div>
            <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-2)', margin: '6px 0 2px' }}>
              {goal.title}
            </h3>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: 0 }}>
              {goal.targetScore ? `Target Score: ${goal.targetScore}` : 'Target: High Distinction'}
              {goal.examWeight ? ` • ${goal.examWeight}% of Total Course Grade` : ''}
            </p>
          </div>

          {/* Time Cushion Diagnostic (plan §2.3): available vs required hours */}
          <div style={{ textAlign: 'right', minWidth: '190px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '6px' }}>
              <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Time Cushion
              </span>
              <Badge variant={cushionMeta.badgeVariant}>{cushionMeta.label}</Badge>
            </div>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontVariantNumeric: 'tabular-nums',
                fontSize: 'var(--text-heading-2)',
                fontWeight: 600,
                color: cushionMeta.colorToken,
                margin: '2px 0 1px'
              }}
            >
              {cushion.cushionHours >= 0 ? '+' : '-'}
              {formatCushionHours(cushion.cushionHours)}h
            </div>
            <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              {formatCushionHours(cushion.netAvailableStudyHours)}h available vs{' '}
              {formatCushionHours(cushion.estimatedHoursRequired)}h required
              <br />
              {formatCushionHours(cushion.requiredHoursPerDay)} hrs/day needed • {horizonLabel}
            </div>
            {routinesUnavailable && (
              <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', marginTop: '4px' }}>
                Fixed commitments unavailable — cushion shown without routine hours.
              </div>
            )}
          </div>
        </div>

        {/* Syllabus Coverage & Mastery Progress */}
        <div style={{ padding: '14px', backgroundColor: 'var(--bg-surface-primary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>
              Syllabus Topic Mastery
            </span>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-sage-600)', fontWeight: 600 }}>
              {masteredCount} of {subjectTopics.length} Topics Mastered ({masteryPercentage}%)
            </span>
          </div>
          <Progress value={masteryPercentage} variant="sage" size="md" />

          {/* Topics List with Mastery Badges */}
          <div style={{ marginTop: '12px', maxHeight: '160px', overflowY: 'auto' }}>
            {subjectTopics.map((topic) => (
              <div key={topic.id} className="solis-exam-topic-item">
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span
                    style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      backgroundColor:
                        topic.masteryLevel === 'mastered'
                          ? 'var(--color-sage-500)'
                          : topic.masteryLevel === 'learning'
                          ? 'var(--color-amber-500)'
                          : 'var(--color-charcoal-400)'
                    }}
                  />
                  <span style={{ fontSize: 'var(--text-body-sm)' }}>{topic.title}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Badge
                    variant={
                      topic.masteryLevel === 'mastered'
                        ? 'sage'
                        : topic.masteryLevel === 'learning'
                        ? 'amber'
                        : 'neutral'
                    }
                  >
                    {topic.masteryLevel}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    leftIcon={<BrainCircuit size={12} />}
                    onClick={() => {
                      const topicCards = flashcards.filter((c) => c.topicId === topic.id);
                      onStartRecallDrill(topicCards.length > 0 ? topicCards : flashcards);
                    }}
                  >
                    Recall Drill
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Linked Syllabus Resources */}
        {resources && resources.filter((r) => !goal.subjectId || r.subjectId === goal.subjectId).length > 0 && (
          <div>
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Associated Research Papers & Textbooks
            </span>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {resources
                .filter((r) => !goal.subjectId || r.subjectId === goal.subjectId)
                .slice(0, 3)
                .map((res) => (
                  <div
                    key={res.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '8px 12px',
                      backgroundColor: 'var(--bg-surface-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-body-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Bookmark size={14} color="var(--color-amber-500)" />
                      <span style={{ fontWeight: 500 }}>{res.title}</span>
                      {res.author && <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>— {res.author}</span>}
                    </div>
                    {res.url && (
                      <a href={res.url} target="_blank" rel="noreferrer" style={{ color: 'var(--color-coral-500)', display: 'inline-flex' }}>
                        <ExternalLink size={13} />
                      </a>
                    )}
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Linked Daily Consistency Rituals */}
        {habits && habits.filter((h) => h.goalId === goal.id).length > 0 && (
          <div>
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
              Linked Daily Consistency Rituals
            </span>
            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              {habits
                .filter((h) => h.goalId === goal.id)
                .map((h) => (
                  <div
                    key={h.id}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      padding: '6px 10px',
                      backgroundColor: 'var(--bg-surface-secondary)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: 'var(--text-body-sm)'
                    }}
                  >
                    <Flame size={14} color="var(--color-coral-500)" />
                    <span style={{ fontWeight: 500 }}>{h.title}</span>
                    <Badge variant="coral">{h.currentStreak}d streak</Badge>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Milestone Roadmap */}
        <div>
          <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)', display: 'block', marginBottom: '8px' }}>
            Revision Milestones ({completedMilestones}/{goal.milestones.length})
          </span>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {goal.milestones.map((m) => (
              <div
                key={m.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '8px 12px',
                  backgroundColor: 'var(--bg-surface-secondary)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <Checkbox
                  checked={m.completed}
                  onChange={() => onToggleMilestone(goal.id, m.id)}
                  aria-label={`Mark milestone ${m.title} complete`}
                />
                <span
                  style={{
                    fontSize: 'var(--text-body-sm)',
                    textDecoration: m.completed ? 'line-through' : 'none',
                    color: m.completed ? 'var(--text-muted)' : 'var(--text-primary)',
                    flex: 1
                  }}
                >
                  {m.title}
                </span>
                {m.targetDate && (
                  <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                    {m.targetDate}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Primary Action Launcher */}
        {scheduleError && (
          <span role="alert" style={{ fontSize: 'var(--text-caption)', color: 'var(--status-error)', textAlign: 'right' }}>
            {scheduleError}
          </span>
        )}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: 'var(--space-xs)', flexWrap: 'wrap' }}>
          <Button variant="ghost" onClick={onClose}>
            Close
          </Button>
          {cushion.estimatedHoursRequired > 0 && (
            <Button
              variant="accent"
              leftIcon={<CalendarPlus size={14} />}
              onClick={handleScheduleDailyFocusBlock}
              title="Pre-fills today's daily planner with a focus block at the required pace"
            >
              Schedule Daily Focus Block ({formatCushionHours(scheduleBlockMinutes / 60)}h)
            </Button>
          )}
          <Button
            variant="primary"
            leftIcon={<Play size={14} />}
            onClick={() => {
              onClose();
              onLaunchFocus(goal.subjectId, `Exam Practice: ${goal.title}`);
            }}
          >
            Start Exam Focus Block (60m)
          </Button>
        </div>
      </div>
    </Modal>
  );
};
