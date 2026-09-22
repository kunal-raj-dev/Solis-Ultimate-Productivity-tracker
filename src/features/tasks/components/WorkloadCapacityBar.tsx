import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, ArrowRight } from 'lucide-react';
import { WorkloadSummary } from '../../../types/task';
import { formatMinutesFriendly } from '../../../utils/tasks/workloadCalculator';
import './WorkloadCapacityBar.css';

interface WorkloadCapacityBarProps {
  workload: WorkloadSummary;
  onAutoReplanCandidates?: () => void;
}

export const WorkloadCapacityBar: React.FC<WorkloadCapacityBarProps> = ({
  workload,
  onAutoReplanCandidates
}) => {
  const {
    totalPlannedMinutes,
    dailyCapacityMinutes,
    overcommittedMinutes,
    state,
    rescheduleCandidates
  } = workload;

  const percent = Math.min(100, Math.round((totalPlannedMinutes / dailyCapacityMinutes) * 100));

  const getStateBadge = () => {
    switch (state) {
      case 'overcommitted':
        return {
          label: 'Overcommitted',
          className: 'solis-workload-badge--overcommitted',
          icon: <AlertTriangle size={12} />
        };
      case 'heavy':
        return {
          label: 'Near Capacity',
          className: 'solis-workload-badge--heavy',
          icon: <Clock size={12} />
        };
      case 'optimal':
        return {
          label: 'Optimal Load',
          className: 'solis-workload-badge--optimal',
          icon: <CheckCircle2 size={12} />
        };
      case 'light':
      default:
        return {
          label: 'Light Load',
          className: 'solis-workload-badge--light',
          icon: <Clock size={12} />
        };
    }
  };

  const badge = getStateBadge();

  return (
    <div className={`solis-workload-bar-container solis-workload-bar-container--${state}`}>
      <div className="solis-workload-header">
        <div className="solis-workload-title-wrap">
          <span className="solis-workload-label">Daily Capacity Horizon:</span>
          <span className="solis-workload-values">
            <strong>{formatMinutesFriendly(totalPlannedMinutes)}</strong> planned /{' '}
            {formatMinutesFriendly(dailyCapacityMinutes)} target
          </span>
        </div>

        <div className="solis-workload-status-wrap">
          <span className={`solis-workload-badge ${badge.className}`}>
            {badge.icon}
            <span>{badge.label}</span>
          </span>
        </div>
      </div>

      {/* Capacity Progress Bar */}
      <div className="solis-workload-progress-track">
        <div
          className={`solis-workload-progress-fill solis-workload-progress-fill--${state}`}
          style={{ width: `${percent}%` }}
        />
      </div>

      {/* Calm Advisory if Overcommitted */}
      {state === 'overcommitted' && (
        <div className="solis-workload-advisory">
          <p className="solis-workload-advisory-text">
            Day is overbooked by <strong>{formatMinutesFriendly(overcommittedMinutes)}</strong>. To protect deep attention, consider deferring lower priority tasks.
          </p>

          {onAutoReplanCandidates && rescheduleCandidates.length > 0 && (
            <button
              type="button"
              className="solis-workload-replan-btn tactile-press"
              onClick={onAutoReplanCandidates}
            >
              <span>Move {Math.min(2, rescheduleCandidates.length)} task(s) to Tomorrow</span>
              <ArrowRight size={12} />
            </button>
          )}
        </div>
      )}
    </div>
  );
};
