import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  GraduationCap,
  Clock,
  Flame,
  BrainCircuit
} from 'lucide-react';
import { Goal } from '../../../types/goal';
import { StudyTopic } from '../../../types/study';
import { Flashcard } from '../../../types/learning';
import { Habit } from '../../../types/habit';
import { dataService } from '../../../services/dataService';
import { calculateExamReadiness } from '../../../utils/intelligence/masteryIntelligence';
import { calculateTimeCushion } from '../../../utils/planning/timeCushion';
import { ExamWorkspaceModal } from './ExamWorkspaceModal';
import { ExamFeasibilityBar } from './ExamFeasibilityBar';
import { Button } from '../../ui/Button/Button';
import { Badge } from '../../ui/Badge/Badge';
import { useToast } from '../../../context/ToastContext';
import { formatErrorMessage } from '../../../utils/errors';
import './ExamHorizonBar.css';

export interface ExamHorizonBarProps {
  goals?: Goal[];
  topics?: StudyTopic[];
  flashcards?: Flashcard[];
  habits?: Habit[];
  /**
   * Daily deep-work capacity in minutes (user.dailyGoalMinutes || 360),
   * passed from Today so the horizon bar runs zero parallel queries of its own.
   */
  dailyCapacity?: number;
  onRefresh?: () => void;
}

export const ExamHorizonBar: React.FC<ExamHorizonBarProps> = ({
  goals: propGoals,
  topics: propTopics,
  flashcards: propFlashcards,
  habits: propHabits,
  dailyCapacity,
  onRefresh
}) => {
  const navigate = useNavigate();
  const { addToast } = useToast();
  const [internalGoals, setInternalGoals] = useState<Goal[]>([]);
  const [internalTopics, setInternalTopics] = useState<StudyTopic[]>([]);
  const [internalCards, setInternalCards] = useState<Flashcard[]>([]);
  const [internalHabits, setInternalHabits] = useState<Habit[]>([]);
  const [isWorkspaceOpen, setIsWorkspaceOpen] = useState(false);
  const [activeGoalIndex, setActiveGoalIndex] = useState(0);

  // Self-fetch if props not supplied
  useEffect(() => {
    if (!propGoals) {
      dataService.goals.getGoals().then((res) => setInternalGoals(res || [])).catch(() => {});
    }
    if (!propFlashcards) {
      dataService.flashcards.getFlashcards().then((res) => setInternalCards(res || [])).catch(() => {});
    }
    if (!propHabits) {
      dataService.habits.getHabits().then((res) => setInternalHabits(res || [])).catch(() => {});
    }
  }, [propGoals, propFlashcards, propHabits]);

  const allGoals = propGoals || internalGoals;

  // Filter for active exams
  const examGoals = useMemo(() => {
    return allGoals
      .filter((g) => (g.experienceType === 'exam' || g.category === 'academic') && g.status === 'active')
      .sort((a, b) => new Date(a.targetDate).getTime() - new Date(b.targetDate).getTime());
  }, [allGoals]);

  // When active exam changes and has a subjectId, load its topics if topics not provided
  useEffect(() => {
    if (!propTopics && examGoals.length > 0) {
      const g = examGoals[0];
      if (g.subjectId) {
        dataService.study.getTopics(g.subjectId).then((res) => setInternalTopics(res || [])).catch(() => {});
      }
    }
  }, [propTopics, examGoals]);

  const activeGoal = examGoals.length > 0
    ? examGoals[Math.min(activeGoalIndex, examGoals.length - 1)]
    : null;

  const allTopics = propTopics || internalTopics;
  const allCards = propFlashcards || internalCards;
  const allHabits = propHabits || internalHabits;

  const subjectTopics = useMemo(() => {
    if (!activeGoal) return [];
    return activeGoal.subjectId
      ? allTopics.filter((t) => t.subjectId === activeGoal.subjectId)
      : allTopics;
  }, [activeGoal, allTopics]);

  const subjectCards = useMemo(() => {
    if (!activeGoal) return [];
    return activeGoal.subjectId
      ? allCards.filter((c) => c.subjectId === activeGoal.subjectId)
      : allCards;
  }, [activeGoal, allCards]);

  const cushion = useMemo(() => {
    if (!activeGoal) return null;
    return calculateTimeCushion({
      examDate: activeGoal.targetDate,
      subjectId: activeGoal.subjectId || '',
      topics: subjectTopics,
      dailyCapacityMinutes: dailyCapacity ?? 360
    });
  }, [activeGoal, subjectTopics, dailyCapacity]);

  if (!activeGoal || !cushion) {
    return null;
  }

  const targetDateObj = new Date(activeGoal.targetDate);
  const diffDays = Math.max(0, Math.ceil((targetDateObj.getTime() - Date.now()) / (1000 * 60 * 60 * 24)));
  const isUrgent = diffDays <= 7;

  const readiness = calculateExamReadiness({
    goal: activeGoal,
    topics: subjectTopics,
    flashcards: subjectCards,
    habits: allHabits
  });

  const masteredTopicsCount = subjectTopics.filter((t) => t.masteryLevel === 'mastered').length;
  const totalTopicsCount = subjectTopics.length;

  const handleToggleMilestone = async (goalId: string, milestoneId: string) => {
    const goal = examGoals.find((g) => g.id === goalId);
    if (!goal) return;
    const updatedMilestones = (goal.milestones || []).map((m) =>
      m.id === milestoneId
        ? { ...m, completed: !m.completed, completedAt: !m.completed ? new Date().toISOString() : undefined }
        : m
    );
    try {
      await dataService.goals.updateGoal(goalId, { milestones: updatedMilestones });
      if (onRefresh) onRefresh();
    } catch (err) {
      addToast({
        title: 'Milestone update failed',
        description: formatErrorMessage(err),
        type: 'error'
      });
    }
  };

  const handleStartRecallDrill = () => {
    setIsWorkspaceOpen(false);
    navigate(`/app/study?subjectId=${activeGoal.subjectId || ''}&action=review`);
  };

  const handleLaunchFocus = (subjectId?: string, title?: string) => {
    setIsWorkspaceOpen(false);
    const query = new URLSearchParams();
    if (subjectId) query.set('subjectId', subjectId);
    query.set('title', title || `Exam Prep: ${activeGoal.title}`);
    navigate(`/app/focus?${query.toString()}`);
  };

  return (
    <>
      <section className="solis-exam-horizon-bar" aria-label="Upcoming Exam Horizon">
        <div className="solis-exam-horizon-bar__header">
          <div className="solis-exam-horizon-bar__identity">
            <span className="solis-exam-horizon-bar__tag">Exam Mode</span>
            <h3 className="solis-exam-horizon-bar__title">{activeGoal.title}</h3>
            {activeGoal.subjectName && (
              <Badge variant="neutral" style={{ fontSize: '11px' }}>
                {activeGoal.subjectName}
              </Badge>
            )}
            {activeGoal.targetScore && (
              <span className="solis-exam-horizon-bar__target">
                Target: {activeGoal.targetScore}
                {activeGoal.examWeight ? ` (${activeGoal.examWeight}% weight)` : ''}
              </span>
            )}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {examGoals.length > 1 && (
              <button
                type="button"
                onClick={() => setActiveGoalIndex((prev) => (prev + 1) % examGoals.length)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: 'var(--text-micro)',
                  color: 'var(--color-coral-500)',
                  fontWeight: 600
                }}
              >
                Next Exam ({activeGoalIndex + 1}/{examGoals.length})
              </button>
            )}
            <div className={`solis-exam-horizon-bar__countdown ${isUrgent ? 'solis-exam-horizon-bar__countdown--urgent' : ''}`}>
              <Clock size={13} />
              <span>{diffDays === 0 ? 'Today!' : `${diffDays}d remaining`}</span>
            </div>
          </div>
        </div>

        <div className="solis-exam-horizon-bar__body">
          <div className="solis-exam-horizon-bar__metric">
            <span className="solis-exam-horizon-bar__metric-label">Readiness Score</span>
            <span className="solis-exam-horizon-bar__metric-value" style={{ color: readiness.readinessScore >= 70 ? 'var(--color-emerald-500, #10b981)' : 'var(--color-amber-500, #f59e0b)' }}>
              {readiness.readinessScore}% • {readiness.grade}
            </span>
          </div>

          <div className="solis-exam-horizon-bar__metric">
            <span className="solis-exam-horizon-bar__metric-label">Syllabus Mastered</span>
            <span className="solis-exam-horizon-bar__metric-value">
              {totalTopicsCount > 0 ? `${masteredTopicsCount} / ${totalTopicsCount} topics` : 'No syllabus mapped'}
            </span>
          </div>

          <div className="solis-exam-horizon-bar__metric">
            <span className="solis-exam-horizon-bar__metric-label">Flashcard Retention</span>
            <span className="solis-exam-horizon-bar__metric-value">
              {readiness.componentScores.retentionScore}% retention
            </span>
          </div>

          <div className="solis-exam-horizon-bar__metric">
            <span className="solis-exam-horizon-bar__metric-label">Milestone Progress</span>
            <span className="solis-exam-horizon-bar__metric-value">
              {readiness.componentScores.milestoneScore}% completed
            </span>
          </div>
        </div>

        {/* Visual Time-Cushion & Exam Feasibility (F-104) */}
        <div style={{ padding: '0 16px 12px' }}>
          <ExamFeasibilityBar cushion={cushion} compact />
        </div>

        <div className="solis-exam-horizon-bar__footer">
          <span className="solis-exam-horizon-bar__tip">
            {readiness.riskDiagnostics.length > 0
              ? `Diagnostic: ${readiness.riskDiagnostics[0]}`
              : 'All active retention parameters on target for distinction.'}
          </span>

          <div className="solis-exam-horizon-bar__actions">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<BrainCircuit size={13} color="var(--color-coral-500)" />}
              onClick={() => handleStartRecallDrill()}
              title="Review high-stakes flashcards"
            >
              Recall Drill
            </Button>

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Flame size={13} color="var(--color-coral-500)" />}
              onClick={() => handleLaunchFocus(activeGoal.subjectId, `Exam Prep: ${activeGoal.title}`)}
              title="Launch dedicated study session"
            >
              Focus Block
            </Button>

            <Button
              variant="accent"
              size="sm"
              leftIcon={<GraduationCap size={14} />}
              onClick={() => setIsWorkspaceOpen(true)}
              title="Open full exam workspace modal"
            >
              Command Workspace
            </Button>
          </div>
        </div>
      </section>

      {isWorkspaceOpen && (
        <ExamWorkspaceModal
          isOpen={isWorkspaceOpen}
          onClose={() => setIsWorkspaceOpen(false)}
          goal={activeGoal}
          topics={subjectTopics}
          flashcards={subjectCards}
          habits={allHabits}
          dailyCapacityMinutes={dailyCapacity}
          onToggleMilestone={handleToggleMilestone}
          onStartRecallDrill={handleStartRecallDrill}
          onLaunchFocus={handleLaunchFocus}
        />
      )}
    </>
  );
};
