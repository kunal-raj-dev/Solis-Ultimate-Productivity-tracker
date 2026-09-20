import { describe, it, expect, beforeEach } from 'vitest';
import {
  parseMarkdownBlocks,
  calculateNoteMetrics,
  serializeNoteToMarkdown
} from '../utils/notes/markdownParser';
import { MockDataService } from '../services/mock/mockService';
import { ParkedThought } from '../types/focus';

describe('Cognitive Drift & Editorial Markdown Synthesis Suite', () => {
  describe('calculateNoteMetrics', () => {
    it('returns zeroes for empty or whitespace content', () => {
      expect(calculateNoteMetrics('')).toEqual({
        wordCount: 0,
        charCount: 0,
        readingTimeMinutes: 0
      });

      expect(calculateNoteMetrics('   \n\t  ')).toEqual({
        wordCount: 0,
        charCount: 0,
        readingTimeMinutes: 0
      });
    });

    it('accurately computes word counts and character counts', () => {
      const text = 'Solis is an editorial sanctuary for deep focus and structured intellectual work.';
      const metrics = calculateNoteMetrics(text);
      expect(metrics.wordCount).toBe(12);
      expect(metrics.charCount).toBe(text.length);
      expect(metrics.readingTimeMinutes).toBe(1); // 12 words: ceil(12/200) = 1
    });

    it('computes reading time for longer scholarly essays at 200 wpm', () => {
      const words = Array.from({ length: 450 }, (_, i) => `concept${i}`).join(' ');
      const metrics = calculateNoteMetrics(words);
      expect(metrics.wordCount).toBe(450);
      expect(metrics.readingTimeMinutes).toBe(3); // ceil(450 / 200) = 3
    });
  });

  describe('serializeNoteToMarkdown', () => {
    it('produces valid YAML frontmatter and markdown body', () => {
      const note = {
        title: 'Raft Safety Proof',
        content: '# Distributed Consensus\n\nLeader completeness property holds under network partitions.',
        category: 'theorem',
        subjectName: 'Distributed Systems',
        tags: ['distributed-systems', 'consensus', 'raft'],
        updatedAt: '2026-09-19T01:00:00.000Z'
      };

      const md = serializeNoteToMarkdown(note);
      expect(md).toContain('---');
      expect(md).toContain('title: "Raft Safety Proof"');
      expect(md).toContain('category: theorem');
      expect(md).toContain('discipline: "Distributed Systems"');
      expect(md).toContain('tags: ["distributed-systems", "consensus", "raft"]');
      expect(md).toContain('generator: "Solis OS (Sovereign Knowledge Sanctuary)"');
      expect(md).toContain('# Distributed Consensus');
      expect(md).toContain('Leader completeness property holds under network partitions.');
    });

    it('escapes quotes in title gracefully', () => {
      const note = {
        title: 'The "Byzantine" Generals Problem',
        content: 'Proof sketch',
        category: 'concept',
        tags: []
      };

      const md = serializeNoteToMarkdown(note);
      expect(md).toContain('title: "The \\"Byzantine\\" Generals Problem"');
    });
  });

  describe('parseMarkdownBlocks', () => {
    it('parses headings (H1, H2, H3, H4) correctly', () => {
      const raw = '# Chapter 1: First Principles\n## Section 1.1: Core Axioms\n### Subsection: Epistemology\n#### Minor Note';
      const blocks = parseMarkdownBlocks(raw);

      expect(blocks).toHaveLength(4);
      expect(blocks[0]).toEqual({ type: 'heading', level: 1, content: 'Chapter 1: First Principles' });
      expect(blocks[1]).toEqual({ type: 'heading', level: 2, content: 'Section 1.1: Core Axioms' });
      expect(blocks[2]).toEqual({ type: 'heading', level: 3, content: 'Subsection: Epistemology' });
      expect(blocks[3]).toEqual({ type: 'heading', level: 4, content: 'Minor Note' });
    });

    it('parses fenced code blocks with language specifiers and content', () => {
      const raw = '```typescript\nconst alpha = 42;\nconsole.log(alpha);\n```';
      const blocks = parseMarkdownBlocks(raw);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('code_block');
      expect(blocks[0].language).toBe('typescript');
      expect(blocks[0].content).toBe('const alpha = 42;\nconsole.log(alpha);');
    });

    it('parses callout blocks [!KEY], [!INSIGHT], [!THEOREM], [!NOTE], [!WARNING]', () => {
      const raw = '> [!KEY] All complex ideas must be broken into irreducible components.\n\n> [!THEOREM] T(n) = aT(n/b) + f(n)';
      const blocks = parseMarkdownBlocks(raw);

      expect(blocks).toHaveLength(2);
      expect(blocks[0].type).toBe('callout');
      expect(blocks[0].calloutType).toBe('KEY');
      expect(blocks[0].content).toBe('All complex ideas must be broken into irreducible components.');

      expect(blocks[1].type).toBe('callout');
      expect(blocks[1].calloutType).toBe('THEOREM');
      expect(blocks[1].content).toBe('T(n) = aT(n/b) + f(n)');
    });

    it('parses math blocks $$ ... $$', () => {
      const raw = '$$\\nabla \\times \\mathbf{B} = \\mu_0 \\left( \\mathbf{J} + \\varepsilon_0 \\frac{\\partial \\mathbf{E}}{\\partial t} \\right)$$';
      const blocks = parseMarkdownBlocks(raw);

      expect(blocks).toHaveLength(1);
      expect(blocks[0].type).toBe('math_block');
      expect(blocks[0].content).toContain('\\nabla \\times \\mathbf{B}');
    });

    it('parses task checklist items', () => {
      const raw = '- [ ] Verify state invariants\n- [x] Prove convergence in finite rounds';
      const blocks = parseMarkdownBlocks(raw);

      expect(blocks).toHaveLength(2);
      expect(blocks[0]).toEqual({ type: 'task_item', completed: false, content: 'Verify state invariants', taskIndex: 0 });
      expect(blocks[1]).toEqual({ type: 'task_item', completed: true, content: 'Prove convergence in finite rounds', taskIndex: 1 });
    });

    it('parses standard bullet lists and paragraphs', () => {
      const raw = '- First item\n- Second item\n\nStandard prose describing observations.';
      const blocks = parseMarkdownBlocks(raw);

      expect(blocks).toHaveLength(3);
      expect(blocks[0]).toEqual({ type: 'bullet_item', content: 'First item' });
      expect(blocks[1]).toEqual({ type: 'bullet_item', content: 'Second item' });
      expect(blocks[2]).toEqual({ type: 'paragraph', content: 'Standard prose describing observations.' });
    });
  });

  describe('Focus Sanctuary: Cognitive Drift Persistence & Mock Service', () => {
    let service: MockDataService;

    beforeEach(() => {
      service = new MockDataService();
    });

    it('persists parked thoughts attached to a focus session', async () => {
      const parkedThoughts: ParkedThought[] = [
        {
          id: 'drift_1',
          text: 'Need to review Paxos Synod ballot numbering invariant',
          type: 'note',
          timestamp: '2026-09-19T01:15:00.000Z'
        },
        {
          id: 'drift_2',
          text: 'Check email for conference submission confirmation',
          type: 'task',
          timestamp: '2026-09-19T01:22:00.000Z'
        }
      ];

      const session = await service.focus.saveFocusSession({
        mode: 'deep_flow',
        durationMinutes: 45,
        title: 'Invariant Synthesis',
        completed: true,
        interruptionsCount: 2,
        flowQuality: 5,
        parkedThoughts
      });

      expect(session.parkedThoughts).toBeDefined();
      expect(session.parkedThoughts).toHaveLength(2);
      expect(session.parkedThoughts![0].text).toBe('Need to review Paxos Synod ballot numbering invariant');
      expect(session.parkedThoughts![0].type).toBe('note');
      expect(session.parkedThoughts![1].type).toBe('task');
    });

    it('gracefully handles focus sessions without parked thoughts', async () => {
      const session = await service.focus.saveFocusSession({
        mode: 'pomodoro',
        durationMinutes: 25,
        title: 'Clean Focus Session',
        completed: true,
        interruptionsCount: 0,
        flowQuality: 5
      });

      expect(session).toBeDefined();
      expect(session.title).toBe('Clean Focus Session');
      expect(session.parkedThoughts).toBeUndefined();
    });
  });
});
