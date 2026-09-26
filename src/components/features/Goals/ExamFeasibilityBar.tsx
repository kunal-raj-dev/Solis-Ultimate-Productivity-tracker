import React from 'react';
import { TimeCushionAnalysis, formatCushionHours } from '../../../utils/planning/timeCushion';
import { Badge } from '../../ui/Badge/Badge';
import './ExamFeasibilityBar.css';

export interface ExamFeasibilityBarProps {
  cushion: TimeCushionAnalysis;
  compact?: boolean;
}

export const ExamFeasibilityBar: React.FC<ExamFeasibilityBarProps> = ({
  cushion,
  compact = false
}) => {
  const { netAvailableStudyHours, estimatedHoursRequired, cushionHours } = cushion;
  const isSurplus = cushionHours >= 0;

  // Normalize scale: total scale is max(available, required) with some headroom
  const maxScale = Math.max(1, Math.max(netAvailableStudyHours, estimatedHoursRequired) * 1.15);
  const availablePct = Math.min(100, Math.max(0, (netAvailableStudyHours / maxScale) * 100));
  const requiredPct = Math.min(100, Math.max(0, (estimatedHoursRequired / maxScale) * 100));

  const badgeVariant = isSurplus ? 'sage' : 'coral';
  const cushionLabel = isSurplus
    ? `+${formatCushionHours(cushionHours)}h Cushion`
    : `-${formatCushionHours(Math.abs(cushionHours))}h Deficit`;

  return (
    <div className="solis-feasibility-bar-container">
      {!compact && (
        <div className="solis-feasibility-bar-labels">
          <span style={{ fontWeight: 600 }}>Visual Time-Cushion Balance</span>
          <Badge variant={badgeVariant} style={{ fontVariantNumeric: 'tabular-nums' }}>
            {cushionLabel}
          </Badge>
        </div>
      )}

      {/* Visual Stacked/Comparison Track */}
      <div className="solis-feasibility-track" style={{ height: compact ? '16px' : '24px' }}>
        {/* Available Hours Bar */}
        <div
          className="solis-feasibility-segment-available"
          style={{ width: `${availablePct}%` }}
          title={`Net Available Study Hours: ${formatCushionHours(netAvailableStudyHours)}h`}
        />

        {/* Required Syllabus Hours Overlay */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            height: '100%',
            width: `${requiredPct}%`,
            borderRight: '3px solid var(--color-coral-500)',
            pointerEvents: 'none'
          }}
          title={`Required Syllabus Hours: ${formatCushionHours(estimatedHoursRequired)}h`}
        />
      </div>

      <div className="solis-feasibility-bar-legend">
        <div className="solis-feasibility-legend-item">
          <div className="solis-feasibility-legend-dot" style={{ backgroundColor: 'var(--color-sage-500)' }} />
          <span>Available Study Time: <strong>{formatCushionHours(netAvailableStudyHours)}h</strong></span>
        </div>

        <div className="solis-feasibility-legend-item">
          <div className="solis-feasibility-legend-dot" style={{ backgroundColor: 'var(--color-coral-500)' }} />
          <span>Syllabus Required: <strong>{formatCushionHours(estimatedHoursRequired)}h</strong></span>
        </div>
      </div>
    </div>
  );
};
