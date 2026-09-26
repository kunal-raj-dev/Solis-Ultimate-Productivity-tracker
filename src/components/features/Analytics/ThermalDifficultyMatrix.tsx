import React from 'react';
import { Flame } from 'lucide-react';
import { TopicMasterySignal } from '../../../utils/intelligence/types';
import { Button } from '../../ui/Button/Button';

/** Red Alert Zone thresholds (plan §5.5): low mastery × high self-reported difficulty. */
export const THERMAL_RED_ALERT_MASTERY_MAX = 40;
export const THERMAL_RED_ALERT_DIFFICULTY_MIN = 4;

export interface ThermalDifficultyPoint {
  topicId: string;
  topicTitle: string;
  subjectId: string;
  subjectName: string;
  /** X axis: composite topic mastery signal, 0–100. */
  masteryPercent: number;
  /** Y axis: self-reported difficulty 1 (easy) – 5 (very hard), derived from session retention ratings. */
  difficultyRating: number;
  sessionCount: number;
}

/**
 * Maps mastery signals onto the thermal matrix plane. Deterministic:
 * difficulty = 6 − averageRetentionRating (a topic the scholar rates as
 * retained 5/5 sits at difficulty 1; a 1/5-rated topic sits at difficulty 5).
 */
export function buildThermalDifficultyPoints(topics: TopicMasterySignal[]): ThermalDifficultyPoint[] {
  return topics.map((t) => ({
    topicId: t.topicId,
    topicTitle: t.topicTitle,
    subjectId: t.subjectId,
    subjectName: t.subjectName,
    masteryPercent: Math.max(0, Math.min(100, t.compositeMasterySignal)),
    difficultyRating: Math.max(1, Math.min(5, +(6 - t.averageRetentionRating).toFixed(1))),
    sessionCount: t.studyCount
  }));
}

export function isInRedAlertZone(point: ThermalDifficultyPoint): boolean {
  return (
    point.masteryPercent < THERMAL_RED_ALERT_MASTERY_MAX &&
    point.difficultyRating >= THERMAL_RED_ALERT_DIFFICULTY_MIN
  );
}

export interface ThermalDifficultyMatrixProps {
  points: ThermalDifficultyPoint[];
  /** Optional 1-click follow-through: launch focus on a topic (25m). */
  onFocusTopic?: (point: ThermalDifficultyPoint) => void;
}

/**
 * 2D Thermal Difficulty Matrix (plan §5.5, audit item #25)
 *
 * Plots Topic Mastery (X) against Self-Reported Difficulty (Y) and highlights
 * the Red Alert Zone — low-mastery topics the scholar also finds hard — so
 * fragile, high-friction knowledge surfaces before exams do.
 */
export const ThermalDifficultyMatrix: React.FC<ThermalDifficultyMatrixProps> = ({
  points,
  onFocusTopic
}) => {
  const redAlertTopics = points.filter(isInRedAlertZone);

  // Plot geometry: 0–100% mastery left→right, difficulty 5 (top) → 1 (bottom).
  const toLeftPercent = (mastery: number) => Math.max(0, Math.min(100, mastery));
  const toBottomPercent = (difficulty: number) =>
    ((Math.max(1, Math.min(5, difficulty)) - 1) / 4) * 100;
  // Red Alert Zone occupies the top band (difficulty ≥ 4) and left band (mastery < 40).
  const zoneLeft = 0;
  const zoneWidth = THERMAL_RED_ALERT_MASTERY_MAX;
  const zoneBottom = toBottomPercent(THERMAL_RED_ALERT_DIFFICULTY_MIN);
  const zoneHeight = 100 - zoneBottom;

  return (
    <div
      style={{
        background: 'var(--bg-surface-secondary)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-lg)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px'
      }}
    >
      <div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Flame size={16} color="var(--status-error)" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-3)', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
            Thermal Difficulty Matrix
          </h3>
        </div>
        <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: '4px 0 0' }}>
          Topic mastery (X) against self-reported difficulty (Y). The Red Alert Zone flags topics
          you find hard that also have low mastery — start there.
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
        {/* Y axis label */}
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: 'var(--text-micro)',
            color: 'var(--text-muted)',
            textAlign: 'center',
            letterSpacing: '0.05em'
          }}
        >
          Self-Reported Difficulty →
        </div>

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div
            style={{
              position: 'relative',
              width: '100%',
              height: '220px',
              background: 'var(--bg-surface-primary)',
              border: '1px solid var(--border-subtle)',
              borderRadius: 'var(--radius-md)',
              overflow: 'hidden'
            }}
            role="img"
            aria-label={`Thermal difficulty matrix with ${points.length} topics plotted, ${redAlertTopics.length} in the red alert zone`}
          >
            {/* Red Alert Zone highlight */}
            <div
              style={{
                position: 'absolute',
                left: `${zoneLeft}%`,
                bottom: `${zoneBottom}%`,
                width: `${zoneWidth}%`,
                height: `${zoneHeight}%`,
                background: 'rgba(225, 29, 72, 0.10)',
                border: '1px dashed rgba(225, 29, 72, 0.45)',
                borderTop: 'none',
                borderRight: 'none',
                borderBottom: 'none',
                pointerEvents: 'none'
              }}
            >
              <span
                style={{
                  position: 'absolute',
                  top: '6px',
                  left: '8px',
                  fontSize: '9px',
                  fontWeight: 700,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  color: 'var(--status-error)'
                }}
              >
                Red Alert Zone
              </span>
            </div>

            {/* Gridlines at mastery 25/50/75 */}
            {[25, 50, 75].map((g) => (
              <div
                key={g}
                style={{
                  position: 'absolute',
                  left: `${g}%`,
                  top: 0,
                  bottom: 0,
                  width: '1px',
                  background: 'var(--border-subtle)',
                  opacity: 0.6,
                  pointerEvents: 'none'
                }}
              />
            ))}

            {/* Topic dots */}
            {points.map((point) => {
              const alert = isInRedAlertZone(point);
              return (
                <button
                  key={point.topicId}
                  type="button"
                  onClick={() => onFocusTopic?.(point)}
                  title={`${point.topicTitle} (${point.subjectName}) — mastery ${point.masteryPercent}%, difficulty ${point.difficultyRating}/5${alert ? ' • Red Alert' : ''}`}
                  aria-label={`${point.topicTitle}: mastery ${point.masteryPercent} percent, difficulty ${point.difficultyRating} of 5${alert ? ', in red alert zone' : ''}`}
                  style={{
                    position: 'absolute',
                    left: `calc(${toLeftPercent(point.masteryPercent)}% - 6px)`,
                    bottom: `calc(${toBottomPercent(point.difficultyRating)}% - 6px)`,
                    width: '12px',
                    height: '12px',
                    borderRadius: '50%',
                    border: alert ? '2px solid var(--status-error)' : '1px solid var(--border-default)',
                    background: alert ? 'rgba(225, 29, 72, 0.55)' : 'var(--color-sage-500)',
                    cursor: onFocusTopic ? 'pointer' : 'default',
                    padding: 0
                  }}
                />
              );
            })}
          </div>

          {/* X axis label */}
          <div
            style={{
              fontSize: 'var(--text-micro)',
              color: 'var(--text-muted)',
              textAlign: 'center',
              letterSpacing: '0.05em'
            }}
          >
            Topic Mastery (0% → 100%)
          </div>
        </div>
      </div>

      {/* Red Alert topic follow-through */}
      {redAlertTopics.length > 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {redAlertTopics.length} topic{redAlertTopics.length === 1 ? '' : 's'} in the Red Alert Zone
          </span>
          {redAlertTopics.slice(0, 3).map((point) => (
            <div
              key={`alert-${point.topicId}`}
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}
            >
              <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-primary)', fontWeight: 600 }}>
                {point.topicTitle}
                <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}> · {point.subjectName}</span>
              </span>
              {onFocusTopic && (
                <Button variant="subtle" size="sm" onClick={() => onFocusTopic(point)}>
                  Focus (25m)
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', textAlign: 'center', padding: '4px 0' }}>
          {points.length > 0
            ? 'Nothing in the Red Alert Zone — your difficult topics are still well mastered.'
            : 'Add syllabus topics and log study sessions to activate the matrix.'}
        </div>
      )}
    </div>
  );
};
