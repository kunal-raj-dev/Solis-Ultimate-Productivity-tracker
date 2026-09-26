import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Sparkles, Flame, FileEdit, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/feedback/Modal/Modal';
import { Input } from '../../../components/ui/Input/Input';
import { Button } from '../../../components/ui/Button/Button';
import { StudySubject, StudyTopic, TopicMasteryLevel } from '../../../types/study';
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
  inline?: boolean;
}

// ── Hierarchical syllabus tree (plan §4.2: Unit → Chapter → Concept) ────────

/** Deterministic leaf mastery baseline used for the rollup (plan §4.2). */
export const TOPIC_MASTERY_PERCENT: Record<TopicMasteryLevel, number> = {
  unstudied: 0,
  learning: 50,
  mastered: 100
};

export interface TopicTreeNode {
  topic: StudyTopic;
  depth: number;
  children: TopicTreeNode[];
}

const ROOT_KEY = '__root__';

/**
 * Builds the nested Unit → Chapter → Concept tree from the flat topic list.
 * Topics without a parent (or with a deleted/mis-linked parent) become roots,
 * so no topic ever disappears from the roadmap. Members of a parentId cycle
 * are promoted to roots so every topic renders exactly once at the top level.
 * Siblings keep their `orderIndex` order.
 */
export function buildTopicTree(topics: StudyTopic[]): TopicTreeNode[] {
  const ids = new Set(topics.map((t) => t.id));
  const parentOf = new Map(topics.map((t) => [t.id, t.parentId]));

  // Detect parentId-cycle members: a walk that re-enters its own chain marks
  // every node of the loop, and those nodes are promoted to roots below.
  const cyclic = new Set<string>();
  for (const topic of topics) {
    const chain: string[] = [];
    const seen = new Set<string>();
    let cursor: string | undefined = topic.id;
    while (cursor && ids.has(cursor) && !seen.has(cursor)) {
      seen.add(cursor);
      chain.push(cursor);
      cursor = parentOf.get(cursor);
    }
    if (cursor && seen.has(cursor)) {
      for (const id of chain.slice(chain.indexOf(cursor))) {
        cyclic.add(id);
      }
    }
  }

  const byParent = new Map<string, StudyTopic[]>();
  for (const topic of [...topics].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0))) {
    const hasValidParent = topic.parentId && ids.has(topic.parentId) && !cyclic.has(topic.id);
    const parentKey = hasValidParent ? (topic.parentId as string) : ROOT_KEY;
    const siblings = byParent.get(parentKey);
    if (siblings) {
      siblings.push(topic);
    } else {
      byParent.set(parentKey, [topic]);
    }
  }

  const buildNodes = (parentKey: string, depth: number): TopicTreeNode[] =>
    (byParent.get(parentKey) || []).map((topic) => ({
      topic,
      depth,
      children: buildNodes(topic.id, depth + 1)
    }));

  return buildNodes(ROOT_KEY, 0);
}

/**
 * Mastery rollup (plan §4.2): a leaf scores from its own mastery baseline,
 * while a unit/chapter's mastery percent is the weighted average of its child
 * concepts (equal weights — StudyTopic carries no hour/minute weighting field).
 */
export function computeTopicMasteryPercent(node: TopicTreeNode): number {
  if (node.children.length === 0) {
    return TOPIC_MASTERY_PERCENT[node.topic.masteryLevel] ?? 0;
  }
  const childScores = node.children.map(computeTopicMasteryPercent);
  return Math.round(childScores.reduce((sum, score) => sum + score, 0) / childScores.length);
}

const topicActionButtonStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '2px',
  display: 'flex',
  alignItems: 'center'
};

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
  onDeleteTopic,
  inline = false
}) => {
  const [collapsedTopicIds, setCollapsedTopicIds] = useState<ReadonlySet<string>>(new Set());

  const toggleCollapsed = (topicId: string) => {
    setCollapsedTopicIds((prev) => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  const renderTopicNode = (node: TopicTreeNode): React.ReactNode => {
    const { topic, depth, children } = node;
    const mastery = learningSnapshot.masteryEvaluations.get(topic.id);
    const retention = learningSnapshot.retentionSignals.get(topic.id);
    const hasChildren = children.length > 0;
    const isCollapsed = collapsedTopicIds.has(topic.id);

    return (
      <div key={topic.id} style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '8px 12px',
            borderRadius: '6px',
            background: 'var(--bg-surface-secondary)',
            border: '1px solid var(--border-subtle)',
            gap: '8px',
            marginLeft: `${depth * 16}px`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flex: 1 }}>
            {hasChildren ? (
              <button
                type="button"
                onClick={() => toggleCollapsed(topic.id)}
                aria-expanded={!isCollapsed}
                aria-label={isCollapsed ? `Expand ${topic.title}` : `Collapse ${topic.title}`}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer',
                  padding: '0',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                {isCollapsed ? <ChevronRight size={14} /> : <ChevronDown size={14} />}
              </button>
            ) : (
              <span style={{ width: '14px', flexShrink: 0 }} />
            )}
            <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {topic.title}
            </span>
            {hasChildren && (
              <span
                className="solis-health-pill solis-health-pill--stable"
                style={{ fontSize: '9px', padding: '1px 5px', fontFamily: 'var(--font-mono, monospace)' }}
                title="Mastery rollup — weighted average of child concepts"
              >
                {computeTopicMasteryPercent(node)}%
              </span>
            )}
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
              style={{ ...topicActionButtonStyle, color: 'var(--color-coral-500)' }}
              title={`Start Focus Block on ${topic.title}`}
            >
              <Flame size={14} />
            </button>
            <button
              type="button"
              onClick={() => onTopicNote(topic)}
              style={{ ...topicActionButtonStyle, color: 'var(--color-lavender-500)' }}
              title={`Draft Note on ${topic.title}`}
            >
              <FileEdit size={14} />
            </button>
            <button
              onClick={() => {
                if (!inline) onClose();
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
                if (!inline) onClose();
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
              style={{ ...topicActionButtonStyle, color: 'var(--text-muted)' }}
              title="Delete Topic"
            >
              <Trash2 size={12} />
            </button>
          </div>
        </div>

        {hasChildren && !isCollapsed && children.map(renderTopicNode)}
      </div>
    );
  };

  const topicTree = buildTopicTree(topicsList);

  const treeContent = (
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

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', maxHeight: inline ? '540px' : '320px', overflowY: 'auto' }}>
          {topicsList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '16px', color: 'var(--text-muted)', fontSize: 'var(--text-body-sm)' }}>
              No topics defined for this subject yet.
            </div>
          ) : (
            topicTree.map(renderTopicNode)
          )}
        </div>
      </div>
    );

  if (inline) {
    return (
      <div className="solis-syllabus-inline">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h3 style={{ fontSize: 'var(--text-body)', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>
              Syllabus Roadmap — {subject?.name || 'Selected Discipline'}
            </h3>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
              {topicsList.length} defined topic(s)
            </span>
          </div>
          <Button variant="subtle" size="sm" onClick={onClose}>
            Close Roadmap
          </Button>
        </div>
        {treeContent}
      </div>
    );
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Syllabus Topics — ${subject?.name || ''}`}
    >
      {treeContent}
    </Modal>
  );
};
