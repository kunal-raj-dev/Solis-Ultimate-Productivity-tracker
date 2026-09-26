import React, { useState } from 'react';
import {
  ExamFeasibilityAnalysis,
  simulateFeasibilityAdjustment
} from '../../../utils/planning/examFeasibility';
import { TimeCushionInput, formatCushionHours } from '../../../utils/planning/timeCushion';
import { ExamFeasibilityBar } from './ExamFeasibilityBar';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { Progress } from '../../ui/Progress/Progress';
import { Sparkles, CalendarPlus, CheckCircle2 } from 'lucide-react';
import './ExamFeasibilityCard.css';

export interface ExamFeasibilityCardProps {
  analysis: ExamFeasibilityAnalysis;
  cushionInput?: TimeCushionInput;
  onSchedulePacedBlock?: (durationMinutes: number) => void;
}

export const ExamFeasibilityCard: React.FC<ExamFeasibilityCardProps> = ({
  analysis: initialAnalysis,
  cushionInput,
  onSchedulePacedBlock
}) => {
  const [extraMinutes, setExtraMinutes] = useState<number>(0);

  // If user adjusts extra time, dynamically simulate adjusted analysis
  const currentAnalysis = React.useMemo(() => {
    if (extraMinutes === 0 || !cushionInput) {
      return initialAnalysis;
    }
    return simulateFeasibilityAdjustment({
      cushionInput,
      extraDailyMinutes: extraMinutes
    });
  }, [initialAnalysis, cushionInput, extraMinutes]);

  const {
    feasibilityScore,
    tierLabel,
    tierColor,
    badgeVariant,
    requiredDailyHours,
    studentDailyCapacityHours,
    capacityUtilizationPercentage,
    headline,
    recommendation,
    actionableSteps,
    cushion
  } = currentAnalysis;

  const handleToggleExtra = (mins: number) => {
    setExtraMinutes((prev) => (prev === mins ? 0 : mins));
  };

  const recommendedPacedMinutes = Math.min(
    720,
    Math.max(30, Math.round(requiredDailyHours * 60))
  );

  return (
    <div className="solis-feasibility-card">
      {/* Top Header: Score & Tier */}
      <div className="solis-feasibility-card-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
            <Badge variant={badgeVariant}>{tierLabel}</Badge>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              {cushion.daysRemaining} days until target date
            </span>
          </div>
          <h4 style={{ margin: 0, fontSize: 'var(--text-heading-3)', fontWeight: 600 }}>
            {headline}
          </h4>
          <p style={{ margin: '4px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
            {recommendation}
          </p>
        </div>

        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <div className="solis-feasibility-score-pill">
            <span className="solis-feasibility-score-val" style={{ color: tierColor }}>
              {feasibilityScore}
            </span>
            <span className="solis-feasibility-score-denom">/100</span>
          </div>
          <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Feasibility Index
          </span>
        </div>
      </div>

      {/* Visual Time-Cushion Stacked Bar */}
      <ExamFeasibilityBar cushion={cushion} />

      {/* Pace Realism Grid */}
      <div className="solis-feasibility-grid">
        <div className="solis-feasibility-metric">
          <span className="solis-feasibility-metric-label">Required Pace</span>
          <span className="solis-feasibility-metric-value" style={{ color: tierColor }}>
            {formatCushionHours(requiredDailyHours)}h / day
          </span>
        </div>

        <div className="solis-feasibility-metric">
          <span className="solis-feasibility-metric-label">Daily Capacity</span>
          <span className="solis-feasibility-metric-value">
            {formatCushionHours(studentDailyCapacityHours)}h / day
          </span>
        </div>

        <div className="solis-feasibility-metric">
          <span className="solis-feasibility-metric-label">Capacity Load</span>
          <span className="solis-feasibility-metric-value">
            {capacityUtilizationPercentage}%
          </span>
          <div style={{ marginTop: '4px' }}>
            <Progress
              value={Math.min(100, capacityUtilizationPercentage)}
              variant={badgeVariant}
              size="sm"
            />
          </div>
        </div>
      </div>

      {/* Interactive What-If Realism Calibrator */}
      {cushionInput && (
        <div className="solis-feasibility-calibrator">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Sparkles size={14} color="var(--color-amber-500)" />
              What-If Realism Calibrator:
            </span>
            {extraMinutes > 0 && (
              <Badge variant="amber" style={{ fontSize: '10px' }}>
                Simulating +{extraMinutes}m / day
              </Badge>
            )}
          </div>

          <div className="solis-feasibility-calibrator-btns">
            {[30, 45, 60, 90].map((mins) => (
              <Button
                key={mins}
                variant={extraMinutes === mins ? 'accent' : 'outline'}
                size="sm"
                onClick={() => handleToggleExtra(mins)}
                style={{ fontSize: '11px', height: '26px' }}
              >
                +{mins}m daily
              </Button>
            ))}
            {extraMinutes > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setExtraMinutes(0)}
                style={{ fontSize: '11px', height: '26px' }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Actionable Steps */}
      {actionableSteps.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          {actionableSteps.map((step, idx) => (
            <div key={idx} className="solis-feasibility-step-item">
              <CheckCircle2 size={14} color="var(--color-sage-500)" style={{ flexShrink: 0 }} />
              <span>{step}</span>
            </div>
          ))}
        </div>
      )}

      {/* Schedule Paced Block CTA */}
      {onSchedulePacedBlock && (
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <Button
            variant="accent"
            size="sm"
            leftIcon={<CalendarPlus size={14} />}
            onClick={() => onSchedulePacedBlock(recommendedPacedMinutes)}
          >
            Lock In Daily {formatCushionHours(recommendedPacedMinutes / 60)}h Paced Block
          </Button>
        </div>
      )}
    </div>
  );
};
