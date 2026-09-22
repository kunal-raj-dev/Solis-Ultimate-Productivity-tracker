import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Clock,
  Flame,
  AlertCircle,
  Edit2,
  Trash2
} from 'lucide-react';
import { TaskTimeBlock } from '../../types/task';
import { StudySubject } from '../../types/study';
import { Badge, BadgeVariant } from '../../components/ui/Badge/Badge';
import { Button } from '../../components/ui/Button/Button';
import { Progress } from '../../components/ui/Progress/Progress';
import { formatFriendlyDate } from '../../utils/date';

interface TaskTimelineViewProps {
  selectedDate: string;
  timeBlocks: TaskTimeBlock[];
  subjects: StudySubject[];
  onOpenCreateBlock: (hour: number) => void;
  onOpenEditBlock: (block: TaskTimeBlock) => void;
  onOpenReviewBlock: (block: TaskTimeBlock) => void;
  onDeleteBlock: (blockId: string) => void;
}

export const TaskTimelineView: React.FC<TaskTimelineViewProps> = ({
  selectedDate,
  timeBlocks,
  subjects,
  onOpenCreateBlock,
  onOpenEditBlock,
  onOpenReviewBlock,
  onDeleteBlock
}) => {
  const navigate = useNavigate();
  const sortedBlocks = [...timeBlocks].sort((a, b) => a.startHour - b.startHour || (a.startMinute || 0) - (b.startMinute || 0));

  // Detect time block overlaps/conflicts accurately using minutes from midnight
  const conflicts: Array<{ a: TaskTimeBlock; b: TaskTimeBlock }> = [];
  for (let i = 0; i < sortedBlocks.length; i++) {
    const cur = sortedBlocks[i];
    const curStart = cur.startHour * 60 + (cur.startMinute || 0);
    const curEnd = curStart + (cur.durationMinutes || 60);
    for (let j = i + 1; j < sortedBlocks.length; j++) {
      const nxt = sortedBlocks[j];
      const nxtStart = nxt.startHour * 60 + (nxt.startMinute || 0);
      if (curEnd > nxtStart) {
        conflicts.push({ a: cur, b: nxt });
      } else {
        break;
      }
    }
  }

  const formatHour = (hour: number, min = 0) => {
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const h = hour % 12 === 0 ? 12 : hour % 12;
    return `${h}:${String(min).padStart(2, '0')} ${ampm}`;
  };

  return (
    <div className="solis-timeline-view">
      {/* Conflicts Alert if any */}
      {conflicts.length > 0 && (
        <div className="solis-timeline-conflict-alert">
          <AlertCircle size={16} color="var(--color-amber-500, #f59e0b)" />
          <div>
            <strong>Schedule Overlap Detected:</strong> "{conflicts[0].a.taskTitle}" overlaps with "{conflicts[0].b.taskTitle}".
          </div>
        </div>
      )}

      {sortedBlocks.length === 0 ? (
        <div className="solis-timeline-empty">
          <Clock size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px' }} />
          <h3 style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)' }}>
            No Time Blocks Scheduled for {formatFriendlyDate(selectedDate)}
          </h3>
          <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '16px' }}>
            Plan focused intervals to give your intentions dedicated temporal space.
          </p>
          <Button variant="accent" size="sm" onClick={() => onOpenCreateBlock(9)}>
            Schedule First Block
          </Button>
        </div>
      ) : (
        <div className="solis-timeline-track">
          {sortedBlocks.map((block, idx) => {
            const linkedSub = subjects.find((s) => s.id === block.subjectId);
            const startHour = block.startHour;
            const startMin = block.startMinute || 0;
            const totalStartMins = startHour * 60 + startMin;
            const totalEndMins = totalStartMins + (block.durationMinutes || 60);
            const endHour = Math.floor(totalEndMins / 60) % 24;
            const endMin = totalEndMins % 60;

            return (
              <div key={block.id} className="solis-timeline-node">
                {/* Timeline time marker */}
                <div className="solis-timeline-node-time">
                  <span className="solis-timeline-time-label">{formatHour(startHour, startMin)}</span>
                  <span className="solis-timeline-time-end">to {formatHour(endHour, endMin)}</span>
                </div>

                {/* Vertical spine line & bullet */}
                <div className="solis-timeline-spine">
                  <div className={`solis-timeline-bullet solis-timeline-bullet--${block.status}`} />
                  {idx < sortedBlocks.length - 1 && <div className="solis-timeline-line" />}
                </div>

                {/* Timeline Card */}
                <div className="solis-timeline-card">
                  <div className="solis-timeline-card-header">
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <h4 className="solis-timeline-card-title">{block.taskTitle}</h4>
                        <Badge variant={block.priority === 'urgent' || block.priority === 'high' ? 'coral' : 'neutral'}>
                          {block.priority}
                        </Badge>
                        {linkedSub && (
                          <Badge variant={(linkedSub.color as BadgeVariant) || 'coral'}>
                            {linkedSub.name}
                          </Badge>
                        )}
                        <span className={`solis-timeline-status-badge solis-timeline-status-badge--${block.status}`}>
                          {block.status}
                        </span>
                      </div>
                      {block.description && (
                        <p className="solis-timeline-card-desc">{block.description}</p>
                      )}
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      {block.status !== 'completed' && (
                        <Button
                          variant="subtle"
                          size="sm"
                          leftIcon={<Flame size={12} color="var(--color-coral-500)" />}
                          onClick={() =>
                            navigate(
                              block.taskId
                                ? `/app/focus?taskId=${block.taskId}&blockId=${block.id}`
                                : `/app/focus?blockId=${block.id}`,
                              {
                                state: {
                                  title: block.taskTitle,
                                  taskId: block.taskId,
                                  blockId: block.id,
                                  subjectId: block.subjectId,
                                  durationMinutes: block.durationMinutes
                                }
                              }
                            )
                          }
                        >
                          Focus
                        </Button>
                      )}
                      <Button
                        variant="subtle"
                        size="sm"
                        onClick={() => onOpenReviewBlock(block)}
                      >
                        Review
                      </Button>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        onClick={() => onOpenEditBlock(block)}
                        title="Edit time block"
                        aria-label="Edit time block"
                      >
                        <Edit2 size={13} />
                      </button>
                      <button
                        type="button"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: 'var(--text-muted)',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center'
                        }}
                        onClick={() => onDeleteBlock(block.id)}
                        title="Delete time block"
                        aria-label="Delete time block"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Progress & Duration Bar */}
                  <div className="solis-timeline-card-footer">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                        Planned: {block.durationMinutes}m
                      </span>
                      {block.actualMinutes !== undefined && block.actualMinutes > 0 && (
                        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--color-coral-500)', fontWeight: 600 }}>
                          Actual: {block.actualMinutes}m
                        </span>
                      )}
                    </div>
                    {block.progressPercent !== undefined && block.progressPercent > 0 && (
                      <div style={{ width: '140px' }}>
                        <Progress value={block.progressPercent} size="sm" variant="momentum" />
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
