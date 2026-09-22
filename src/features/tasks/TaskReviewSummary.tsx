import React from 'react';
import {
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
  Brain,
  Award,
  ChevronLeft,
  ChevronRight,
  Flame
} from 'lucide-react';
import { TaskTimeBlock, Task } from '../../types/task';
import { StudySubject } from '../../types/study';
import { Badge, BadgeVariant } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Card } from '../../components/ui/Card/Card';
import { Progress } from '../../components/ui/Progress/Progress';
import { formatFriendlyDate } from '../../utils/date';

interface TaskReviewSummaryProps {
  selectedDate: string;
  timeBlocks: TaskTimeBlock[];
  tasks: Task[];
  subjects: StudySubject[];
  onOpenReviewBlock: (block: TaskTimeBlock) => void;
  onNavigateDate: (deltaDays: number) => void;
  onSwitchToPlanner: () => void;
}

export const TaskReviewSummary: React.FC<TaskReviewSummaryProps> = ({
  selectedDate,
  timeBlocks,
  subjects,
  onOpenReviewBlock,
  onNavigateDate,
  onSwitchToPlanner
}) => {
  const totalBlocks = timeBlocks.length;
  const completedBlocks = timeBlocks.filter((b) => b.status === 'completed');
  const partialBlocks = timeBlocks.filter((b) => b.status === 'partial');
  const missedBlocks = timeBlocks.filter((b) => b.status === 'missed');
  const unreviewedBlocks = timeBlocks.filter((b) => b.status === 'planned');

  const totalPlannedMinutes = timeBlocks.reduce((acc, b) => acc + (b.durationMinutes || 60), 0);
  const totalActualMinutes = timeBlocks.reduce((acc, b) => acc + (b.actualMinutes || 0), 0);

  const completionRate = totalBlocks > 0
    ? Math.round(((completedBlocks.length + partialBlocks.length * 0.5) / totalBlocks) * 100)
    : 0;

  const estimationAccuracy = totalPlannedMinutes > 0 && totalActualMinutes > 0
    ? Math.round((Math.min(totalActualMinutes, totalPlannedMinutes) / Math.max(totalActualMinutes, totalPlannedMinutes)) * 100)
    : null;

  const sortedBlocks = [...timeBlocks].sort((a, b) => a.startHour - b.startHour);

  const formatHour = (hour: number) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 === 0 ? 12 : hour % 12;
    return `${h}:00 ${ampm}`;
  };

  return (
    <div className="solis-task-review-summary">
      {/* Date Navigation & Header */}
      <div className="solis-review-header-bar">
        <div>
          <h2 style={{ fontSize: 'var(--text-h2)', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
            Daily Focus & Execution Review
          </h2>
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Inspect planned intention versus real-world execution for {formatFriendlyDate(selectedDate)}
          </p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => onNavigateDate(-1)}
            leftIcon={<ChevronLeft size={14} />}
          >
            Prev Day
          </Button>
          <Button
            variant="subtle"
            size="sm"
            onClick={() => onNavigateDate(1)}
            rightIcon={<ChevronRight size={14} />}
          >
            Next Day
          </Button>
          <Button
            variant="primary"
            size="sm"
            onClick={onSwitchToPlanner}
          >
            Go to Hourly Planner
          </Button>
        </div>
      </div>

      {totalBlocks === 0 ? (
        <Card variant="primary" className="solis-review-empty-card" style={{ padding: '40px', textAlign: 'center' }}>
          <Clock size={36} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)' }}>
            No Time Blocks Scheduled for {formatFriendlyDate(selectedDate)}
          </h3>
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', maxWidth: '420px', margin: '8px auto 20px' }}>
            Schedule hourly blocks to capture deliberate focus and review your real cognitive output at the end of the day.
          </p>
          <Button variant="accent" onClick={onSwitchToPlanner}>
            Open Hourly Grid to Plan
          </Button>
        </Card>
      ) : (
        <>
          {/* Top KPI Cards Grid */}
          <div className="solis-review-kpi-grid">
            <Card variant="primary" className="solis-review-kpi-card">
              <div className="solis-review-kpi-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--color-emerald-500, #10b981)' }}>
                <CheckCircle2 size={20} />
              </div>
              <div className="solis-review-kpi-data">
                <span className="solis-review-kpi-label">Completion Velocity</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span className="solis-review-kpi-value">{completionRate}%</span>
                  <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                    {completedBlocks.length}/{totalBlocks} blocks
                  </span>
                </div>
                <div style={{ marginTop: '8px' }}>
                  <Progress value={completionRate} size="sm" variant="momentum" />
                </div>
              </div>
            </Card>

            <Card variant="primary" className="solis-review-kpi-card">
              <div className="solis-review-kpi-icon" style={{ background: 'rgba(255, 107, 74, 0.12)', color: 'var(--color-coral-500)' }}>
                <Flame size={20} />
              </div>
              <div className="solis-review-kpi-data">
                <span className="solis-review-kpi-label">Actual Focus Time</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span className="solis-review-kpi-value">
                    {Math.round(totalActualMinutes / 60 * 10) / 10}h
                  </span>
                  <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                    of {Math.round(totalPlannedMinutes / 60 * 10) / 10}h planned
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  {totalActualMinutes >= totalPlannedMinutes ? 'Met planned budget' : `${totalPlannedMinutes - totalActualMinutes}m under plan`}
                </div>
              </div>
            </Card>

            <Card variant="primary" className="solis-review-kpi-card">
              <div className="solis-review-kpi-icon" style={{ background: 'rgba(99, 102, 241, 0.12)', color: '#818cf8' }}>
                <TrendingUp size={20} />
              </div>
              <div className="solis-review-kpi-data">
                <span className="solis-review-kpi-label">Estimation Calibration</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span className="solis-review-kpi-value">
                    {estimationAccuracy !== null ? `${estimationAccuracy}%` : 'N/A'}
                  </span>
                  <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>accuracy</span>
                </div>
                <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-secondary)', marginTop: '8px' }}>
                  {estimationAccuracy && estimationAccuracy >= 80 ? '🎯 Calibrated estimation' : '⚡ Refine block durations'}
                </div>
              </div>
            </Card>

            <Card variant="primary" className="solis-review-kpi-card">
              <div className="solis-review-kpi-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--color-amber-500, #f59e0b)' }}>
                <Award size={20} />
              </div>
              <div className="solis-review-kpi-data">
                <span className="solis-review-kpi-label">Review Status</span>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                  <span className="solis-review-kpi-value">
                    {totalBlocks - unreviewedBlocks.length}/{totalBlocks}
                  </span>
                  <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                    ({missedBlocks.length} missed)
                  </span>
                </div>
                <div style={{ fontSize: 'var(--text-micro)', color: unreviewedBlocks.length > 0 ? 'var(--color-amber-500, #f59e0b)' : 'var(--color-emerald-500, #10b981)', marginTop: '8px' }}>
                  {unreviewedBlocks.length > 0 ? `${unreviewedBlocks.length} pending review` : 'All blocks reviewed ✨'}
                </div>
              </div>
            </Card>
          </div>

          {/* Deep Reflection Section */}
          <div className="solis-review-breakdown-section">
            <h3 style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Brain size={18} color="var(--color-coral-500)" />
              Hour-by-Hour Reflection Log
            </h3>

            <div className="solis-review-blocks-table">
              {sortedBlocks.map((block) => {
                const linkedSub = subjects.find((s) => s.id === block.subjectId);

                return (
                  <div key={block.id} className="solis-review-block-row">
                    <div className="solis-review-block-time">
                      <span className="solis-review-hour-tag">{formatHour(block.startHour)}</span>
                      <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>
                        {block.durationMinutes}m
                      </span>
                    </div>

                    <div className="solis-review-block-info">
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 className="solis-review-block-title">{block.taskTitle}</h4>
                        {linkedSub && (
                          <Badge variant={(linkedSub.color as BadgeVariant) || 'coral'}>
                            {linkedSub.name}
                          </Badge>
                        )}
                        <span className={`solis-timeline-status-badge solis-timeline-status-badge--${block.status}`}>
                          {block.status}
                        </span>
                      </div>

                      {block.reflection ? (
                        <div className="solis-review-quote">
                          <Sparkles size={12} color="var(--color-coral-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
                          <span>"{block.reflection}"</span>
                        </div>
                      ) : (
                        <p style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', fontStyle: 'italic', margin: '4px 0 0' }}>
                          No reflection recorded yet.
                        </p>
                      )}
                    </div>

                    <div className="solis-review-block-stats">
                      <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
                        <strong>{block.actualMinutes || 0}</strong> / {block.durationMinutes}m logged
                      </div>
                      {block.progressPercent !== undefined && (
                        <div style={{ width: '90px', marginTop: '4px' }}>
                          <Progress value={block.progressPercent} size="sm" variant="momentum" />
                        </div>
                      )}
                    </div>

                    <div className="solis-review-block-action">
                      <Button
                        variant={block.status === 'planned' ? 'accent' : 'subtle'}
                        size="sm"
                        onClick={() => onOpenReviewBlock(block)}
                      >
                        {block.status === 'planned' ? 'Review Hour' : 'Edit Review'}
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
