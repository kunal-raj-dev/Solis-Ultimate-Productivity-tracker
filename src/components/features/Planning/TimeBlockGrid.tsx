import React from 'react';
import { TimeBlock, TimeBlockConflict, TimeAllocationStats } from '../../../types/planning';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { Checkbox } from '../../ui/Checkbox/Checkbox';
import { formatTimeBlockDuration } from '../../../utils/planning/timeBlocking';
import { Play, AlertTriangle, Clock, CheckCircle2 } from 'lucide-react';
import './TimeBlockGrid.css';

export interface TimeBlockGridProps {
  blocks: TimeBlock[];
  stats: TimeAllocationStats;
  conflicts: TimeBlockConflict[];
  onToggleComplete?: (block: TimeBlock) => void;
  onLaunchFocus?: (block: TimeBlock) => void;
}

export const TimeBlockGrid: React.FC<TimeBlockGridProps> = ({
  blocks,
  stats,
  conflicts,
  onToggleComplete,
  onLaunchFocus
}) => {
  return (
    <div className="solis-timeblock-container">
      {/* Time Allocation Header Stats */}
      <div className="solis-timeblock-stats">
        <div className="solis-timeblock-stat-item">
          <span className="solis-timeblock-stat-label">Planned Work</span>
          <span className="solis-timeblock-stat-value">{formatTimeBlockDuration(stats.totalPlannedMinutes)}</span>
        </div>
        <div className="solis-timeblock-stat-item">
          <span className="solis-timeblock-stat-label">Deep Study</span>
          <span className="solis-timeblock-stat-value">{formatTimeBlockDuration(stats.deepStudyMinutes)}</span>
        </div>
        <div className="solis-timeblock-stat-item">
          <span className="solis-timeblock-stat-label">Tasks Due</span>
          <span className="solis-timeblock-stat-value">{formatTimeBlockDuration(stats.taskMinutes)}</span>
        </div>
        <div className="solis-timeblock-stat-item">
          <span className="solis-timeblock-stat-label">Conflicts</span>
          <span
            className="solis-timeblock-stat-value"
            style={{ color: stats.conflictCount > 0 ? 'var(--status-warning)' : 'var(--color-sage-600)' }}
          >
            {stats.conflictCount === 0 ? 'All Clear' : `${stats.conflictCount} Detected`}
          </span>
        </div>
      </div>

      {/* Conflict Alert Banner */}
      {conflicts.length > 0 && (
        <div className="solis-timeblock-conflict-banner">
          <AlertTriangle size={16} />
          <span>
            {conflicts.length} time conflict{conflicts.length > 1 ? 's' : ''} detected:{' '}
            {conflicts.map((c) => `"${c.blockA.title}" overlaps "${c.blockB.title}" by ${c.overlapMinutes}m`).join('; ')}
          </span>
        </div>
      )}

      {/* Chronological Schedule Blocks */}
      {blocks.length === 0 ? (
        <div style={{ textAlign: 'center', padding: 'var(--space-xl)', color: 'var(--text-secondary)', fontSize: 'var(--text-body-sm)' }}>
          <Clock size={32} color="var(--text-muted)" style={{ margin: '0 auto 8px' }} />
          <p>No time blocks scheduled for this day.</p>
        </div>
      ) : (
        <div className="solis-timeblock-list">
          {blocks.map((block) => {
            const hasConflict = conflicts.some(
              (c) => c.blockA.id === block.id || c.blockB.id === block.id
            );

            return (
              <div
                key={block.id}
                className={`solis-timeblock-card ${hasConflict ? 'solis-timeblock-card--conflict' : ''} ${
                  block.completed ? 'solis-timeblock-card--completed' : ''
                }`}
              >
                {/* Time Range */}
                <div className="solis-timeblock-card__time">
                  {block.startTime} – {block.endTime}
                </div>

                {/* Checkbox (if actionable) */}
                {onToggleComplete && (
                  <Checkbox
                    checked={block.completed}
                    onChange={() => onToggleComplete(block)}
                    aria-label={`Mark ${block.title} complete`}
                  />
                )}

                {/* Card Main Info */}
                <div className="solis-timeblock-card__content">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span
                      className="solis-timeblock-card__title"
                      style={{ textDecoration: block.completed ? 'line-through' : 'none' }}
                    >
                      {block.title}
                    </span>
                    <Badge
                      variant={
                        block.type === 'study_plan'
                          ? 'coral'
                          : block.type === 'focus_session'
                          ? 'lavender'
                          : 'amber'
                      }
                    >
                      {block.type === 'study_plan'
                        ? 'Study Block'
                        : block.type === 'focus_session'
                        ? 'Focus Log'
                        : 'Task Due'}
                    </Badge>
                  </div>
                  <div className="solis-timeblock-card__meta">
                    {block.subjectName && <span>{block.subjectName} • </span>}
                    <span>{formatTimeBlockDuration(block.durationMinutes)}</span>
                    {hasConflict && (
                      <span style={{ color: 'var(--status-warning)', display: 'inline-flex', alignItems: 'center', gap: '2px' }}>
                        <AlertTriangle size={12} /> Conflict
                      </span>
                    )}
                  </div>
                </div>

                {/* Action: Focus Now */}
                <div className="solis-timeblock-card__actions">
                  {onLaunchFocus && !block.completed && (
                    <Button
                      variant="subtle"
                      size="sm"
                      leftIcon={<Play size={12} />}
                      onClick={() => onLaunchFocus(block)}
                    >
                      Focus
                    </Button>
                  )}
                  {block.completed && (
                    <span style={{ color: 'var(--color-sage-600)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: 'var(--text-caption)' }}>
                      <CheckCircle2 size={16} /> Completed
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
