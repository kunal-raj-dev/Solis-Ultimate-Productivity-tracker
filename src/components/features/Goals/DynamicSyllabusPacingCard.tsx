import React, { useMemo } from 'react';
import { StudyTopic } from '../../../types/study';
import {
  calculateDynamicSyllabusPacing,
  MAX_SUSTAINABLE_DAILY_HOURS
} from '../../../utils/planning/syllabusPacing';
import { Badge } from '../../ui/Badge/Badge';
import { ShieldAlert, CheckCircle2, Flame, HeartHandshake, Compass } from 'lucide-react';
import './DynamicSyllabusPacingCard.css';

export interface DynamicSyllabusPacingCardProps {
  targetExamDate: string;
  topics: StudyTopic[];
  dailyCapacityMinutes?: number;
  className?: string;
}

export const DynamicSyllabusPacingCard: React.FC<DynamicSyllabusPacingCardProps> = ({
  targetExamDate,
  topics,
  dailyCapacityMinutes = 360,
  className = ''
}) => {
  const pace = useMemo(() => {
    return calculateDynamicSyllabusPacing({
      targetExamDate,
      topics,
      dailyCapacityMinutes
    });
  }, [targetExamDate, topics, dailyCapacityMinutes]);

  const riskBadge = useMemo(() => {
    if (pace.burnoutRisk === 'critical') {
      return <Badge variant="coral">Burnout Guard Active</Badge>;
    }
    if (pace.burnoutRisk === 'elevated') {
      return <Badge variant="amber">Elevated Daily Pace</Badge>;
    }
    return <Badge variant="sage">Sustainable Cadence</Badge>;
  }, [pace.burnoutRisk]);

  const riskIcon = useMemo(() => {
    if (pace.burnoutRisk === 'critical') {
      return <ShieldAlert size={18} color="var(--color-coral-500, #eb5e28)" />;
    }
    if (pace.burnoutRisk === 'elevated') {
      return <Flame size={18} color="var(--color-amber-500, #f59e0b)" />;
    }
    return <CheckCircle2 size={18} color="var(--color-sage-500, #10b981)" />;
  }, [pace.burnoutRisk]);

  return (
    <div
      className={`solis-pacing-card solis-pacing-card--${pace.burnoutRisk} ${className}`}
      data-testid="dynamic-syllabus-pacing-card"
    >
      <div className="solis-pacing-header">
        <div className="solis-pacing-headline">
          {riskIcon}
          <span>{pace.advisoryHeadline}</span>
        </div>
        <div>{riskBadge}</div>
      </div>

      <div className="solis-pacing-stat-grid">
        <div className="solis-pacing-stat-tile">
          <div className="solis-pacing-stat-label">Daily Target</div>
          <div className="solis-pacing-stat-value">
            {pace.cappedSafeDailyHours}h<span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/day</span>
          </div>
        </div>

        <div className="solis-pacing-stat-tile">
          <div className="solis-pacing-stat-label">Exam Horizon</div>
          <div className="solis-pacing-stat-value">
            {pace.daysRemaining} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>days</span>
          </div>
        </div>

        <div className="solis-pacing-stat-tile">
          <div className="solis-pacing-stat-label">Remaining Workload</div>
          <div className="solis-pacing-stat-value">
            {pace.estimatedRemainingHours} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>hrs</span>
          </div>
        </div>

        <div className="solis-pacing-stat-tile">
          <div className="solis-pacing-stat-label">Unmastered Topics</div>
          <div className="solis-pacing-stat-value">
            {pace.unmasteredTopicsCount} <span style={{ fontSize: '12px', fontWeight: 'normal', color: 'var(--text-muted)' }}>/ {pace.totalTopics}</span>
          </div>
        </div>
      </div>

      {/* Compassionate Anti-Shame Advice */}
      <div className="solis-pacing-advice-box">
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '4px' }}>
          <HeartHandshake size={15} color="var(--color-coral-500)" />
          <span>Solis Cognitive Pacing Advisory</span>
        </div>
        <p style={{ margin: 0 }}>{pace.compassionateAdvice}</p>

        {pace.isPaceCapped && (
          <div style={{ marginTop: '8px', fontSize: '12px', color: 'var(--color-amber-600, #d97706)' }}>
            ⚠️ Raw uncapped pace was {pace.rawRequiredDailyHours}h/day. Capped at {MAX_SUSTAINABLE_DAILY_HOURS}h to safeguard long-term retention.
          </div>
        )}
      </div>

      {/* Triaged Concepts section when pace is capped */}
      {pace.deprioritizedTopics.length > 0 && (
        <div style={{ padding: '8px 12px', borderRadius: '8px', background: 'var(--bg-surface-primary)', border: '1px solid var(--border-subtle)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '6px' }}>
            <Compass size={14} />
            <span>Recommended Scope Triage ({pace.deprioritizedTopics.length} Concepts Deferred)</span>
          </div>
          <div className="solis-pacing-triage-list">
            {pace.deprioritizedTopics.slice(0, 3).map((topic) => (
              <div key={topic.id} className="solis-pacing-triage-item">
                <span style={{ color: 'var(--text-muted)' }}>• {topic.title}</span>
                <Badge variant="neutral">Post-Exam</Badge>
              </div>
            ))}
            {pace.deprioritizedTopics.length > 3 && (
              <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '2px' }}>
                +{pace.deprioritizedTopics.length - 3} more optional concepts deferred
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
