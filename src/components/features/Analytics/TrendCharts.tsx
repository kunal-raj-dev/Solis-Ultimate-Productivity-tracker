import React from 'react';
import { TrendingUp, TrendingDown, Minus, BarChart3, Users, Zap, ListChecks } from 'lucide-react';
import {
  WeeklyBucket,
  WeekOverWeekComparison,
  SubjectTimeSlice,
  FocusQualityPoint
} from '../../../utils/analytics/trends';
import './TrendCharts.css';

function formatMinutes(mins: number): string {
  const h = Math.floor(mins / 60);
  const m = Math.round(mins % 60);
  if (h === 0) return `${m}m`;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function subjectColorVar(color?: string): string {
  switch (color) {
    case 'amber':
      return 'var(--color-amber-500)';
    case 'lavender':
      return 'var(--color-lavender-500)';
    case 'sage':
      return 'var(--color-sage-500)';
    case 'coral':
      return 'var(--color-coral-500)';
    default:
      return 'var(--text-muted)';
  }
}

function DeltaBadge({ label, deltaPct, absoluteValue }: { label: string; deltaPct: number | null; absoluteValue?: string }) {
  const tone = deltaPct === null ? 'flat' : deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : 'flat';
  const Icon = tone === 'up' ? TrendingUp : tone === 'down' ? TrendingDown : Minus;
  return (
    <span className={`solis-wow-delta solis-wow-delta--${tone}`} title={absoluteValue}>
      <Icon size={12} />
      <span>{label}</span>
      <strong>{deltaPct === null ? '—' : `${deltaPct > 0 ? '+' : ''}${deltaPct}%`}</strong>
      <span className="solis-wow-delta__vs">vs last week</span>
    </span>
  );
}

/** P1.4 — week-over-week delta badges for the headline metrics. */
export const WeekOverWeekDeltas: React.FC<{ comparison: WeekOverWeekComparison }> = ({ comparison }) => {
  const studyTotal = (w: WeekOverWeekComparison['current']) => w.studyMinutes + w.focusMinutes;
  const currentLabel = formatMinutes(studyTotal(comparison.current));
  const previousLabel = formatMinutes(studyTotal(comparison.previous));
  const habitCurrent = comparison.current.habitCompletionRate;
  return (
    <div className="solis-wow-row">
      <DeltaBadge
        label={`Study time ${currentLabel}`}
        deltaPct={comparison.studyMinutesDeltaPct}
        absoluteValue={`Previous week: ${previousLabel}`}
      />
      <DeltaBadge
        label={`Tasks completed ${comparison.current.tasksCompleted}`}
        deltaPct={
          comparison.previous.tasksCompleted === 0
            ? comparison.current.tasksCompleted > 0
              ? 100
              : null
            : Math.round((comparison.tasksCompletedDelta / comparison.previous.tasksCompleted) * 100)
        }
        absoluteValue={`Previous week: ${comparison.previous.tasksCompleted}`}
      />
      {habitCurrent !== null && comparison.habitRateDeltaPct !== null && (
        <DeltaBadge
          label={`Habit consistency ${Math.round(habitCurrent * 100)}%`}
          deltaPct={comparison.habitRateDeltaPct}
        />
      )}
    </div>
  );
};

/** P1.1 — trailing weekly study + focus minutes as a pure-CSS bar chart. */
export const StudyHoursBarChart: React.FC<{ buckets: WeeklyBucket[] }> = ({ buckets }) => {
  const max = Math.max(1, ...buckets.map((b) => b.studyMinutes + b.focusMinutes));
  return (
    <div className="solis-trend-card">
      <div className="solis-trend-card__header">
        <BarChart3 size={15} />
        <span>Study Hours — Last {buckets.length} Weeks</span>
      </div>
      <div className="solis-weekbars" role="img" aria-label="Weekly study minutes bar chart">
        {buckets.map((b) => {
          const studyPct = (b.studyMinutes / max) * 100;
          const focusPct = (b.focusMinutes / max) * 100;
          const total = b.studyMinutes + b.focusMinutes;
          return (
            <div key={b.weekStart} className="solis-weekbars__col" title={`${b.label}: ${formatMinutes(total)} (${formatMinutes(b.studyMinutes)} study + ${formatMinutes(b.focusMinutes)} focus)`}>
              <div className="solis-weekbars__stack">
                <div className="solis-weekbars__bar solis-weekbars__bar--study" style={{ height: `${studyPct}%` }} />
                <div className="solis-weekbars__bar solis-weekbars__bar--focus" style={{ height: `${focusPct}%` }} />
              </div>
              <span className="solis-weekbars__label">{b.label}</span>
            </div>
          );
        })}
      </div>
      <div className="solis-trend-card__legend">
        <span><i className="solis-legend-dot solis-legend-dot--study" /> Study sessions</span>
        <span><i className="solis-legend-dot solis-legend-dot--focus" /> Focus sessions</span>
      </div>
    </div>
  );
};

/** P1.3 — per-subject study + focus time distribution as horizontal bars. */
export const SubjectTimeBreakdownCard: React.FC<{ slices: SubjectTimeSlice[] }> = ({ slices }) => {
  const max = Math.max(1, ...slices.map((s) => s.minutes));
  const total = slices.reduce((acc, s) => acc + s.minutes, 0);
  return (
    <div className="solis-trend-card">
      <div className="solis-trend-card__header">
        <Users size={15} />
        <span>Time by Subject</span>
      </div>
      {slices.length === 0 ? (
        <p className="solis-trend-card__empty">Log study or focus sessions to see the distribution.</p>
      ) : (
        <div className="solis-subject-slices">
          {slices.slice(0, 7).map((s) => (
            <div key={s.subjectId} className="solis-subject-slice" title={`${formatMinutes(s.minutes)} (${Math.round((s.minutes / Math.max(1, total)) * 100)}%)`}>
              <span className="solis-subject-slice__name">{s.name}</span>
              <div className="solis-subject-slice__track">
                <div
                  className="solis-subject-slice__fill"
                  style={{ width: `${(s.minutes / max) * 100}%`, background: subjectColorVar(s.color) }}
                />
              </div>
              <span className="solis-subject-slice__value">{formatMinutes(s.minutes)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/** P1.7 — flow quality sparkline across the last rated focus sessions. */
export const FocusQualityTrendCard: React.FC<{ points: FocusQualityPoint[] }> = ({ points }) => {
  if (points.length < 2) {
    return (
      <div className="solis-trend-card">
        <div className="solis-trend-card__header">
          <Zap size={15} />
          <span>Focus Quality Trend</span>
        </div>
        <p className="solis-trend-card__empty">Complete at least two rated focus sessions to see your flow trend.</p>
      </div>
    );
  }
  const width = 240;
  const height = 64;
  const stepX = width / (points.length - 1);
  const yFor = (q: number) => height - ((q - 0.5) / 4.5) * height;
  const path = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${(i * stepX).toFixed(1)},${yFor(p.flowQuality).toFixed(1)}`).join(' ');
  const avg = points.reduce((acc, p) => acc + p.flowQuality, 0) / points.length;
  return (
    <div className="solis-trend-card">
      <div className="solis-trend-card__header">
        <Zap size={15} />
        <span>Focus Quality — Last {points.length} Sessions</span>
        <span className="solis-trend-card__avg">avg {avg.toFixed(1)}/5</span>
      </div>
      <svg viewBox={`0 0 ${width} ${height}`} className="solis-flow-spark" role="img" aria-label="Flow quality trend sparkline">
        <path d={path} fill="none" stroke="var(--color-coral-500)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={i} cx={(i * stepX).toFixed(1)} cy={yFor(p.flowQuality).toFixed(1)} r="2.5" fill="var(--color-coral-500)">
            <title>{`${p.label}: ${p.flowQuality}/5`}</title>
          </circle>
        ))}
      </svg>
    </div>
  );
};

/** P1.6 — completed tasks per week as a compact bar trend. */
export const TaskVelocityCard: React.FC<{ buckets: WeeklyBucket[] }> = ({ buckets }) => {
  const max = Math.max(1, ...buckets.map((b) => b.tasksCompleted));
  return (
    <div className="solis-trend-card">
      <div className="solis-trend-card__header">
        <ListChecks size={15} />
        <span>Task Velocity — {buckets.length} Weeks</span>
      </div>
      <div className="solis-velocity-bars" role="img" aria-label="Tasks completed per week">
        {buckets.map((b) => (
          <div key={b.weekStart} className="solis-velocity-bars__col" title={`${b.label}: ${b.tasksCompleted} completed`}>
            <div className="solis-velocity-bars__bar" style={{ height: `${(b.tasksCompleted / max) * 100}%` }} />
            <span className="solis-velocity-bars__value">{b.tasksCompleted || ''}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
