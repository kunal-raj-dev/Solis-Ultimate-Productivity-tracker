import React from 'react';
import { Target, CheckCircle2, Clock, Sparkles, ArrowRight } from 'lucide-react';
import { Goal } from '../../../types/goal';
import { Badge } from '../../../components/ui/Badge/Badge';
import { Progress } from '../../../components/ui/Progress/Progress';
import { Button } from '../../../components/ui/Button/Button';

export interface GoalHeaderStatsProps {
  goals: Goal[];
  onLaunchFocus: (subjectId?: string, title?: string) => void;
  onScrollToGoal?: (goalId: string) => void;
}

export const GoalHeaderStats: React.FC<GoalHeaderStatsProps> = ({
  goals,
  onLaunchFocus,
  onScrollToGoal
}) => {
  const activeGoals = goals.filter((g) => g.status === 'active');
  const completedGoals = goals.filter((g) => g.status === 'completed');

  // Milestone metrics
  const allMilestones = activeGoals.flatMap((g) => g.milestones);
  const totalMilestones = allMilestones.length;
  const completedMilestones = allMilestones.filter((m) => m.completed).length;
  const milestonePercent = totalMilestones > 0
    ? Math.round((completedMilestones / totalMilestones) * 100)
    : 0;

  // Nearest upcoming deadline among active goals
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const upcomingGoals = [...activeGoals]
    .filter((g) => Boolean(g.targetDate) && !isNaN(new Date(g.targetDate).getTime()))
    .map((g) => {
      const target = new Date(g.targetDate);
      target.setHours(0, 0, 0, 0);
      const diffMs = target.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return { goal: g, diffDays };
    })
    .sort((a, b) => a.diffDays - b.diffDays);

  const nearest = upcomingGoals[0];

  // Highest priority active goal for focus alignment
  const priorityRank: Record<string, number> = { urgent: 4, high: 3, medium: 2, low: 1 };
  const topPriorityGoal = [...activeGoals].sort((a, b) => {
    return (priorityRank[b.priority] || 0) - (priorityRank[a.priority] || 0);
  })[0];

  // Horizon breakdown
  const shortTermCount = activeGoals.filter((g) => g.horizon === 'short_term').length;
  const mediumTermCount = activeGoals.filter((g) => g.horizon === 'medium_term').length;
  const longTermCount = activeGoals.filter((g) => g.horizon === 'long_term' || g.horizon === 'vision').length;

  return (
    <div className="solis-goals-stats-grid" aria-label="Goal Horizons Strategic Overview">
      {/* 1. Active Horizons */}
      <div className="solis-goals-stat-card">
        <div className="solis-goals-stat-card__icon solis-goals-stat-card__icon--coral">
          <Target size={18} />
        </div>
        <div className="solis-goals-stat-card__content">
          <span className="solis-goals-stat-card__label">Active Horizons</span>
          <div className="solis-goals-stat-card__value">
            {activeGoals.length}
            <span className="solis-goals-stat-card__subvalue">
              {completedGoals.length > 0 ? ` • ${completedGoals.length} completed` : ''}
            </span>
          </div>
          <div className="solis-goals-stat-card__badges">
            {shortTermCount > 0 && <Badge variant="neutral">{shortTermCount} Short-Term</Badge>}
            {mediumTermCount > 0 && <Badge variant="neutral">{mediumTermCount} Semester</Badge>}
            {longTermCount > 0 && <Badge variant="neutral">{longTermCount} Long-Term</Badge>}
          </div>
        </div>
      </div>

      {/* 2. Milestone Velocity */}
      <div className="solis-goals-stat-card">
        <div className="solis-goals-stat-card__icon solis-goals-stat-card__icon--sage">
          <CheckCircle2 size={18} />
        </div>
        <div className="solis-goals-stat-card__content">
          <span className="solis-goals-stat-card__label">Milestone Velocity</span>
          <div className="solis-goals-stat-card__value">
            {completedMilestones}/{totalMilestones}
            <span className="solis-goals-stat-card__subvalue">({milestonePercent}%)</span>
          </div>
          <div style={{ marginTop: '8px' }}>
            <Progress value={milestonePercent} variant="sage" size="sm" />
          </div>
        </div>
      </div>

      {/* 3. Nearest High-Stakes Deadline */}
      <div className="solis-goals-stat-card">
        <div className="solis-goals-stat-card__icon solis-goals-stat-card__icon--amber">
          <Clock size={18} />
        </div>
        <div className="solis-goals-stat-card__content">
          <span className="solis-goals-stat-card__label">Nearest Target Horizon</span>
          {nearest ? (
            <>
              <div className="solis-goals-stat-card__value">
                {nearest.diffDays === 0
                  ? 'Due Today'
                  : nearest.diffDays < 0
                  ? `${Math.abs(nearest.diffDays)}d overdue`
                  : `${nearest.diffDays} Days`}
                <Badge
                  variant={
                    nearest.diffDays <= 7
                      ? 'coral'
                      : nearest.diffDays <= 30
                      ? 'amber'
                      : 'sage'
                  }
                  style={{ marginLeft: '6px' }}
                >
                  {nearest.goal.experienceType === 'exam' ? 'Exam' : nearest.goal.experienceType === 'project' ? 'Project' : 'Goal'}
                </Badge>
              </div>
              <div
                className="solis-goals-stat-card__nearest-title"
                title={nearest.goal.title}
                onClick={() => onScrollToGoal?.(nearest.goal.id)}
              >
                {nearest.goal.title}
              </div>
            </>
          ) : (
            <div className="solis-goals-stat-card__empty-text">No active deadlines</div>
          )}
        </div>
      </div>

      {/* 4. Strategic Focus Alignment */}
      <div className="solis-goals-stat-card solis-goals-stat-card--highlight">
        <div className="solis-goals-stat-card__icon solis-goals-stat-card__icon--lavender">
          <Sparkles size={18} />
        </div>
        <div className="solis-goals-stat-card__content">
          <span className="solis-goals-stat-card__label">Focus Direction</span>
          {topPriorityGoal ? (
            <>
              <div className="solis-goals-stat-card__focus-title" title={topPriorityGoal.title}>
                {topPriorityGoal.title}
              </div>
              <Button
                variant="accent"
                size="sm"
                rightIcon={<ArrowRight size={13} />}
                onClick={() =>
                  onLaunchFocus(
                    topPriorityGoal.subjectId,
                    `Horizon Focus: ${topPriorityGoal.title}`
                  )
                }
                style={{ marginTop: '8px', width: '100%', justifyContent: 'center' }}
              >
                Launch Focus Session
              </Button>
            </>
          ) : (
            <div className="solis-goals-stat-card__empty-text">Create a horizon to direct daily focus</div>
          )}
        </div>
      </div>
    </div>
  );
};
