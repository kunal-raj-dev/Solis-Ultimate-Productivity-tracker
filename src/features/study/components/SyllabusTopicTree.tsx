import React from 'react';
import { Sparkles, Flame, FileEdit, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/feedback/Modal/Modal';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { StudySubject, StudyTopic } from '../../../types/study';
import { LearningIntelligenceSnapshot } from '../../../types/learningIntelligence';

export interface SyllabusTopicTreeProps {
  isOpen: boolean;
  onClose: () => void;
  subject: StudySubject | null;
  topicsList: StudyTopic[];
  newTopicTitle: string;
  onNewTopicTitleChange: (val: string) => void;
  onAddTopic: (e: React.FormEvent) => void;
  learningSnapshot: LearningIntelligenceSnapshot;
  onSelectTopicForDrawer: (topicId: string) => void;
  onTopicFocus: (topic: StudyTopic) => void;
  onTopicNote: (topic: StudyTopic) => void;
  onOpenCardCreator: (subjectId: string, topicId: string) => void;
  onOpenResourceModal: (subjectId: string, topicId: string) => void;
  onToggleMastery: (topic: StudyTopic) => void;
  onDeleteTopic: (topicId: string) => void;
}

export const SyllabusTopicTree: React.FC<SyllabusTopicTreeProps> = ({
  isOpen,
  onClose,
  subject,
  topicsList,
  newTopicTitle,
  onNewTopicTitleChange,
  onAddTopic,
  learningSnapshot,
  onSelectTopicForDrawer,
  onTopicFocus,
  onTopicNote,
  onOpenCardCreator,
  onOpenResourceModal,
  onToggleMastery,
  onDeleteTopic
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Syllabus Topics — ${subject?.name || ''}`}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <form onSubmit={onAddTopic} style={{ display: 'flex', gap: '8px' }}>
          <Input
            placeholder="Add new syllabus topic..."
            value={newTopicTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onNewTopicTitleChange(e.target.value)}
            required
          />
          <Button variant="accent" type="submit">
            Add
          </Button>
        </form>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: '300px', overflowY: 'auto' }}>
          {topicsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: 'var(--text-body-sm)' }}>
              No topics defined for this subject yet.
            </div>
          ) : (
            topicsList.map((topic) => {
              const mastery = learningSnapshot.masteryEvaluations.get(topic.id);
              const retention = learningSnapshot.retentionSignals.get(topic.id);

              return (
                <div
                  key={topic.id}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '8px 12px',
                    borderRadius: '6px',
                    background: 'var(--bg-surface-secondary)',
                    border: '1px solid var(--border-subtle)',
                    gap: '8px'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
                    <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {topic.title}
                    </span>
                    {mastery && mastery.state !== 'NOT_ASSESSED' && (
                      <span
                        className={`solis-health-pill solis-health-pill--${
                          mastery.state === 'STRONG' ? 'strong' : mastery.state === 'STABLE' ? 'stable' : 'developing'
                        }`}
                        style={{ fontSize: '9px', padding: '1px 5px' }}
                      >
                        {mastery.state}
                      </span>
                    )}
                    {retention && (retention.signal === 'DUE_FOR_REVIEW' || retention.signal === 'NEEDS_ATTENTION' || retention.signal === 'OVERDUE') && (
                      <span className="solis-health-pill solis-health-pill--review" style={{ fontSize: '9px', padding: '1px 5px' }}>
                        {retention.signal === 'DUE_FOR_REVIEW' ? 'Due' : retention.signal === 'NEEDS_ATTENTION' ? 'Recall Alert' : 'Overdue'}
                      </span>
                    )}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                    <button
                      type="button"
                      onClick={() => {
                        onSelectTopicForDrawer(topic.id);
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px 6px',
                        fontSize: 'var(--text-micro)',
                        color: 'var(--color-coral-500)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '3px'
                      }}
                      title="View Evidence & Learning Intelligence"
                    >
                      <Sparkles size={11} />
                      Evidence
                    </button>
                    <button
                      type="button"
                      onClick={() => onTopicFocus(topic)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-coral-500)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                      title={`Start Focus Block on ${topic.title}`}
                    >
                      <Flame size={14} />
                    </button>
                    <button
                      type="button"
                      onClick={() => onTopicNote(topic)}
                      style={{ background: 'none', border: 'none', color: 'var(--color-lavender-500)', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                      title={`Draft Note on ${topic.title}`}
                    >
                      <FileEdit size={14} />
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenCardCreator(topic.subjectId, topic.id);
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px 6px',
                        fontSize: 'var(--text-micro)',
                        color: 'var(--color-coral-500)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                      title="Create Active Recall Flashcard"
                    >
                      + Card
                    </button>
                    <button
                      onClick={() => {
                        onClose();
                        onOpenResourceModal(topic.subjectId, topic.id);
                      }}
                      style={{
                        background: 'none',
                        border: '1px solid var(--border-subtle)',
                        borderRadius: 'var(--radius-sm)',
                        padding: '2px 6px',
                        fontSize: 'var(--text-micro)',
                        color: 'var(--color-amber-500)',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '2px'
                      }}
                      title="Attach Study Resource"
                    >
                      + Resource
                    </button>
                    <button
                      onClick={() => onToggleMastery(topic)}
                      style={{
                        padding: '2px 8px',
                        borderRadius: 'var(--radius-full)',
                        fontSize: 'var(--text-micro)',
                        fontWeight: 600,
                        border: 'none',
                        cursor: 'pointer',
                        background:
                          topic.masteryLevel === 'mastered'
                            ? 'var(--color-sage-500)'
                            : topic.masteryLevel === 'learning'
                            ? 'var(--color-amber-500)'
                            : 'var(--bg-surface)',
                        color: topic.masteryLevel === 'unstudied' ? 'var(--text-secondary)' : '#fff'
                      }}
                      title="Manual mastery level baseline (Click to toggle)"
                    >
                      {topic.masteryLevel}
                    </button>
                    <button
                      onClick={() => onDeleteTopic(topic.id)}
                      style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
                      title="Delete Topic"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </Modal>
  );
};
