import React from 'react';
import { useNavigate } from 'react-router-dom';
import { BookOpen, Archive, MoreVertical, Layers, Edit2, RotateCcw, Trash2, AlertCircle, Flame } from 'lucide-react';
import { Card } from '../../../components/ui/Card/Card';
import { Badge, BadgeVariant } from '../../../components/ui/Badge/Badge';
import { Button } from '../../../components/ui/Button/Button';
import { Skeleton } from '../../../components/ui/Skeleton/Skeleton';
import { EmptyState } from '../../../components/feedback/EmptyState/EmptyState';
import { Progress } from '../../../components/ui/Progress/Progress';
import { StudySubject } from '../../../types/study';
import { LearningIntelligenceSnapshot } from '../../../types/learningIntelligence';

export interface SubjectDetailHeaderProps {
  displayedSubjects: StudySubject[];
  subjects: StudySubject[];
  activeCount: number;
  archivedCount: number;
  subjectViewTab: 'active' | 'archived';
  initialLoadStatus: 'idle' | 'loading' | 'success' | 'error';
  isRetrying: boolean;
  activeActionMenuSubjectId: string | null;
  learningSnapshot: LearningIntelligenceSnapshot;
  onRetry: () => void;
  onSelectTab: (tab: 'active' | 'archived') => void;
  onOpenAddSubjectModal: () => void;
  onToggleActionMenu: (subjectId: string | null) => void;
  onOpenTopicsModal: (subject: StudySubject) => void;
  onOpenEditSubject: (subject: StudySubject) => void;
  onRestoreSubject: (id: string) => void;
  onArchiveSubject: (id: string) => void;
  onSetDeletingSubject: (subject: StudySubject) => void;
}

export const SubjectDetailHeader: React.FC<SubjectDetailHeaderProps> = ({
  displayedSubjects,
  subjects,
  archivedCount,
  subjectViewTab,
  initialLoadStatus,
  isRetrying,
  activeActionMenuSubjectId,
  learningSnapshot,
  onRetry,
  onSelectTab,
  onOpenAddSubjectModal,
  onToggleActionMenu,
  onOpenTopicsModal,
  onOpenEditSubject,
  onRestoreSubject,
  onArchiveSubject,
  onSetDeletingSubject
}) => {
  const navigate = useNavigate();

  if (initialLoadStatus === 'loading' && subjects.length === 0) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 280px), 1fr))', gap: '16px' }}>
        <Skeleton height="180px" />
        <Skeleton height="180px" />
        <Skeleton height="180px" />
      </div>
    );
  }

  if (initialLoadStatus === 'error' && subjects.length === 0) {
    return (
      <Card className="depth-1" style={{ textAlign: 'center', padding: '36px 16px' }}>
        <AlertCircle size={28} color="var(--status-error)" style={{ margin: '0 auto 8px' }} />
        <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)', color: 'var(--text-primary)' }}>
          We couldn&apos;t load your study subjects.
        </div>
        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', marginTop: '4px', marginBottom: '14px' }}>
          A network or server connectivity error occurred.
        </div>
        <Button variant="outline" size="sm" onClick={onRetry} isLoading={isRetrying}>
          Retry
        </Button>
      </Card>
    );
  }

  if (displayedSubjects.length === 0) {
    if (subjectViewTab === 'active') {
      if (archivedCount > 0) {
        return (
          <EmptyState
            icon={BookOpen}
            title="No active subjects right now"
            description={`You have ${archivedCount} archived subject(s) preserved in your repository.`}
            actionLabel={`View Archived (${archivedCount})`}
            onAction={() => onSelectTab('archived')}
          />
        );
      }
      return (
        <EmptyState
          illustration="study"
          icon={BookOpen}
          title="No active subjects yet"
          description="Create your first subject to begin building your living syllabus and study system."
          actionLabel="Add Subject"
          onAction={onOpenAddSubjectModal}
        />
      );
    }
    return (
      <EmptyState
        icon={Archive}
        title="No archived subjects"
        description="Active subjects you archive will be stored here with full syllabus and notes history."
      />
    );
  }

  return (
    <div className="solis-subject-worlds-grid">
      {displayedSubjects.map((subject) => (
        <div
          key={subject.id}
          id={`subject-${subject.id}`}
          className={`solis-subject-world-tile solis-subject-world-tile--${subject.color || 'coral'}`}
          style={{ opacity: subject.status === 'archived' ? 0.85 : 1 }}
        >
          <div>
            <div className="solis-subject-world-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Badge variant={(subject.color as BadgeVariant) || 'coral'}>
                  {subject.code || 'CORE'}
                </Badge>
                {subject.status === 'archived' && (
                  <Badge variant="neutral">Archived</Badge>
                )}
              </div>

              {/* Contextual Action Menu */}
              <div className="solis-subject-action-menu-container" style={{ position: 'relative' }}>
                <button
                  type="button"
                  onClick={() => onToggleActionMenu(activeActionMenuSubjectId === subject.id ? null : subject.id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: 'var(--text-muted)',
                    cursor: 'pointer',
                    padding: '4px',
                    borderRadius: 'var(--radius-sm)',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  aria-label={`Subject actions for ${subject.name}`}
                  title="Subject Actions"
                >
                  <MoreVertical size={16} />
                </button>

                {activeActionMenuSubjectId === subject.id && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: '100%',
                      marginTop: '4px',
                      backgroundColor: 'var(--bg-surface-elevated)',
                      border: '1px solid var(--border-default)',
                      borderRadius: 'var(--radius-md)',
                      boxShadow: 'var(--shadow-dropdown)',
                      padding: '4px',
                      zIndex: 50,
                      minWidth: '180px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '2px'
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => {
                        onToggleActionMenu(null);
                        navigate(`/app/focus?subjectId=${subject.id}&title=${encodeURIComponent(`Study: ${subject.name}`)}`);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        background: 'none',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-caption)',
                        color: 'var(--color-coral-500)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      <Flame size={14} color="var(--color-coral-500)" />
                      <span>Start Focus Block</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleActionMenu(null);
                        onOpenTopicsModal(subject);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        background: 'none',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-caption)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      <Layers size={14} color="var(--text-secondary)" />
                      <span>Manage Syllabus</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        onToggleActionMenu(null);
                        onOpenEditSubject(subject);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        background: 'none',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-caption)',
                        color: 'var(--text-primary)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      <Edit2 size={14} color="var(--text-secondary)" />
                      <span>Edit Subject</span>
                    </button>

                    {subject.status === 'archived' ? (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleActionMenu(null);
                          onRestoreSubject(subject.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          background: 'none',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--text-caption)',
                          color: 'var(--color-sage-500)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%'
                        }}
                      >
                        <RotateCcw size={14} color="var(--color-sage-500)" />
                        <span>Restore to Active</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          onToggleActionMenu(null);
                          onArchiveSubject(subject.id);
                        }}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px',
                          padding: '8px 10px',
                          background: 'none',
                          border: 'none',
                          borderRadius: 'var(--radius-sm)',
                          fontSize: 'var(--text-caption)',
                          color: 'var(--text-primary)',
                          cursor: 'pointer',
                          textAlign: 'left',
                          width: '100%'
                        }}
                      >
                        <Archive size={14} color="var(--text-secondary)" />
                        <span>Archive Subject</span>
                      </button>
                    )}

                    <div style={{ height: '1px', background: 'var(--border-subtle)', margin: '2px 0' }} />

                    <button
                      type="button"
                      onClick={() => {
                        onToggleActionMenu(null);
                        onSetDeletingSubject(subject);
                      }}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '8px 10px',
                        background: 'none',
                        border: 'none',
                        borderRadius: 'var(--radius-sm)',
                        fontSize: 'var(--text-caption)',
                        color: 'var(--status-error)',
                        cursor: 'pointer',
                        textAlign: 'left',
                        width: '100%'
                      }}
                    >
                      <Trash2 size={14} color="var(--status-error)" />
                      <span>Delete Subject</span>
                    </button>
                  </div>
                )}
              </div>
            </div>

            <h3 className="solis-subject-world-title">
              {subject.name}
            </h3>

            {subject.description && (
              <p className="solis-subject-world-desc">
                {subject.description}
              </p>
            )}
          </div>

          <div>
            <div style={{ margin: '12px 0 8px' }}>
              <Progress
                value={subject.completedHoursThisWeek}
                max={subject.targetHoursPerWeek}
                variant={subject.color === 'amber' ? 'amber' : subject.color === 'lavender' ? 'lavender' : 'coral'}
                label={`Weekly Goal: ${subject.completedHoursThisWeek} / ${subject.targetHoursPerWeek} hrs`}
                showValueText
              />
            </div>

            {(() => {
              const health = learningSnapshot.subjectHealths.get(subject.id);
              if (!health || health.totalTopicsCount === 0) return null;
              return (
                <div className="solis-subject-learning-health">
                  <div className="solis-subject-learning-health__header">
                    <span className="solis-subject-learning-health__title">{health.overallStatusText}</span>
                    <span className="solis-subject-learning-health__topics-count">
                      {health.topicsAssessedCount} / {health.totalTopicsCount} assessed
                    </span>
                  </div>
                  <div className="solis-subject-learning-health__pills">
                    {health.strongCount > 0 && <span className="solis-health-pill solis-health-pill--strong">{health.strongCount} Strong</span>}
                    {health.stableCount > 0 && <span className="solis-health-pill solis-health-pill--stable">{health.stableCount} Stable</span>}
                    {health.developingCount > 0 && <span className="solis-health-pill solis-health-pill--developing">{health.developingCount} Dev</span>}
                    {health.dueForReviewCount + health.needsAttentionCount + health.overdueCount > 0 && (
                      <span className="solis-health-pill solis-health-pill--review">
                        {health.dueForReviewCount + health.needsAttentionCount + health.overdueCount} Review
                      </span>
                    )}
                    {health.notAssessedCount > 0 && <span className="solis-health-pill solis-health-pill--unassessed">{health.notAssessedCount} Unassessed</span>}
                  </div>
                </div>
              );
            })()}

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>
              <span>{subject.notesCount} thoughts synthesized</span>
              {subject.status === 'archived' ? (
                <Button
                  variant="subtle"
                  size="sm"
                  leftIcon={<RotateCcw size={13} />}
                  onClick={() => onRestoreSubject(subject.id)}
                >
                  Unarchive
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onOpenTopicsModal(subject)}
                >
                  Syllabus Roadmap →
                </Button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};
