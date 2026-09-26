import { describe, it, expect } from 'vitest';
import { StudyTopic } from '../../../../types/study';
import { buildTopicTree, computeTopicMasteryPercent } from '../SyllabusTopicTree';

/**
 * Phase 4.2 — Hierarchical Syllabus Tree harness (plan §4.2, matrix Item #47
 * "Tree Render Test").
 *
 * Pins the pure tree-building and mastery-rollup contracts that
 * SyllabusTopicTree renders: Unit → Chapter → Concept nesting, orphan
 * promotion, parentId-cycle promotion (every topic renders exactly once),
 * and the weighted-average rollup of child concept mastery.
 */

let topicCounter = 0;
function makeTopic(overrides: Partial<StudyTopic> = {}): StudyTopic {
  topicCounter += 1;
  return {
    id: `top_${topicCounter}`,
    subjectId: 'sbj_1',
    title: `Topic ${topicCounter}`,
    orderIndex: topicCounter,
    masteryLevel: 'unstudied',
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
    ...overrides
  };
}

describe('buildTopicTree (plan §4.2)', () => {
  it('nests Unit → Chapter → Concept by parentId and keeps orderIndex order', () => {
    const conceptB = makeTopic({ title: 'Neurotransmitters', parentId: 'ch_1', level: 'concept', orderIndex: 2 });
    const conceptA = makeTopic({ title: 'Neuron anatomy', parentId: 'ch_1', level: 'concept', orderIndex: 1 });
    const chapter = makeTopic({ id: 'ch_1', title: 'Chapter 1', parentId: 'unit_1', level: 'chapter' });
    const unit = makeTopic({ id: 'unit_1', title: 'Unit 1', level: 'unit' });

    const tree = buildTopicTree([conceptB, unit, conceptA, chapter]);

    expect(tree).toHaveLength(1);
    expect(tree[0].topic.id).toBe('unit_1');
    expect(tree[0].depth).toBe(0);
    expect(tree[0].children.map((n) => n.topic.id)).toEqual(['ch_1']);
    expect(tree[0].children[0].depth).toBe(1);
    expect(tree[0].children[0].children.map((n) => n.topic.title)).toEqual(['Neuron anatomy', 'Neurotransmitters']);
    expect(tree[0].children[0].children[0].depth).toBe(2);
  });

  it('promotes topics with a missing parent to roots', () => {
    const orphan = makeTopic({ parentId: 'top_deleted' });
    const root = makeTopic();

    const tree = buildTopicTree([orphan, root]);

    expect(tree.map((n) => n.topic.id)).toEqual([orphan.id, root.id]);
    expect(tree[0].children).toHaveLength(0);
  });

  it('renders every member of a disconnected parentId cycle exactly once as roots', () => {
    const a = makeTopic({ id: 'cyc_a', parentId: 'cyc_b' });
    const b = makeTopic({ id: 'cyc_b', parentId: 'cyc_a' });
    const normal = makeTopic();

    const tree = buildTopicTree([a, b, normal]);

    expect(tree.map((n) => n.topic.id)).toEqual(['cyc_a', 'cyc_b', normal.id]);
    expect(tree.every((n) => n.children.length === 0)).toBe(true);
  });

  it('renders a cycle reachable from a root without duplicating or dropping members', () => {
    const root = makeTopic({ id: 'root', level: 'unit' });
    const a = makeTopic({ id: 'rc_a', parentId: 'rc_b' });
    const b = makeTopic({ id: 'rc_b', parentId: 'rc_a' });

    const tree = buildTopicTree([root, a, b]);

    const allIds = tree.map((n) => n.topic.id);
    expect(allIds).toHaveLength(3);
    expect(new Set(allIds).size).toBe(3);
    expect(allIds).toEqual(['root', 'rc_a', 'rc_b']);
  });
});

describe('computeTopicMasteryPercent (plan §4.2 rollup)', () => {
  it('maps leaf mastery baselines to 0 / 50 / 100', () => {
    const unstudied = buildTopicTree([makeTopic({ masteryLevel: 'unstudied' })])[0];
    const learning = buildTopicTree([makeTopic({ masteryLevel: 'learning' })])[0];
    const mastered = buildTopicTree([makeTopic({ masteryLevel: 'mastered' })])[0];

    expect(computeTopicMasteryPercent(unstudied)).toBe(0);
    expect(computeTopicMasteryPercent(learning)).toBe(50);
    expect(computeTopicMasteryPercent(mastered)).toBe(100);
  });

  it('rolls unit mastery up as the weighted average of child concepts', () => {
    const c1 = makeTopic({ parentId: 'unit_x', masteryLevel: 'mastered' }); // 100
    const c2 = makeTopic({ parentId: 'unit_x', masteryLevel: 'unstudied' }); // 0
    const c3 = makeTopic({ parentId: 'unit_x', masteryLevel: 'learning' }); // 50
    const unit = makeTopic({ id: 'unit_x', level: 'unit' });

    const tree = buildTopicTree([c1, c2, c3, unit]);

    expect(computeTopicMasteryPercent(tree[0])).toBe(50); // (100 + 0 + 50) / 3
  });

  it('rolls up recursively through nested chapters', () => {
    const leaf = makeTopic({ parentId: 'ch_y', masteryLevel: 'mastered' }); // 100
    const chapter = makeTopic({ id: 'ch_y', parentId: 'unit_z', level: 'chapter', masteryLevel: 'unstudied' });
    const unit = makeTopic({ id: 'unit_z', level: 'unit' });

    const tree = buildTopicTree([leaf, chapter, unit]);

    expect(computeTopicMasteryPercent(tree[0].children[0])).toBe(100);
    expect(computeTopicMasteryPercent(tree[0])).toBe(100); // chapter inherits its child's 100
  });
});
