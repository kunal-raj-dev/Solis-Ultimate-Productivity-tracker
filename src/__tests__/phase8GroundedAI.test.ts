import { describe, it, expect } from 'vitest';
import {
  chunkMarkdownDocument,
  getChunkSourceLineIndex
} from '../utils/ai/ragPipeline';
import {
  toGroundedChunkPayloads,
  validateGroundedCards,
  extractDeterministicGroundedCards,
  GENERATE_CARDS_EDGE_FUNCTION
} from '../services/ai/ai.service';

/**
 * Phase 8.2 — Grounded RAG Flashcard Citations (plan §8.2)
 *
 * Verification gates:
 *   1. Chunks carry `sourceLineIndex` lineage into the original note.
 *   2. The grounding gate drops every card whose sourceChunkId was not in
 *      the provided chunk set (hallucinated citations cannot render).
 *   3. Deterministic extraction is strictly chunk-grounded and always
 *      available without a key (master.md §4 principle 4).
 *   4. The Edge Function contract name matches the client constant.
 */

const NOTE = `# Biology

## Cellular Respiration
Mitosis is a process of cell duplication. The cell grows and copies its DNA.

### Glycolysis
Glycolysis: the breakdown of glucose into pyruvate with a net gain of two ATP.

## Photosynthesis
Chlorophyll is the pigment that absorbs light energy in plants.
Photosynthesis converts light energy into chemical energy stored as glucose.`;

describe('chunkMarkdownDocument — sourceLineIndex lineage (plan §8.2)', () => {
  it('records the 0-based source line of each chunk\'s first paragraph', () => {
    const chunks = chunkMarkdownDocument('note-1', 'Biology', NOTE, { targetTokens: 40 });
    expect(chunks.length).toBeGreaterThan(1);

    for (const chunk of chunks) {
      const lineIndex = getChunkSourceLineIndex(chunk);
      expect(lineIndex).toBeGreaterThanOrEqual(0);
      expect(lineIndex).toBeLessThan(NOTE.split('\n').length);
      // The cited line must exist inside the note and be the start of real content.
      expect(NOTE.split('\n')[lineIndex].trim().length).toBeGreaterThan(0);
    }
  });

  it('cites the exact paragraph a chunk was grounded in', () => {
    const lines = NOTE.split('\n');
    // Paragraph-sized chunks with no overlap: each chunk's first paragraph IS
    // its cited line.
    const chunks = chunkMarkdownDocument('note-1', 'Biology', NOTE, {
      targetTokens: 20,
      overlapTokens: 0
    });
    const glycolysisChunk = chunks.find((c) => c.content.startsWith('Glycolysis'));

    expect(glycolysisChunk).toBeDefined();
    const citedLine = lines[getChunkSourceLineIndex(glycolysisChunk!)];
    expect(citedLine).toContain('Glycolysis');
  });

  it('defaults the lineage of the empty-document chunk to line 0', () => {
    const chunks = chunkMarkdownDocument('note-empty', 'Empty', '');
    expect(chunks).toHaveLength(1);
    expect(getChunkSourceLineIndex(chunks[0])).toBe(0);
  });

  it('keeps the whole-document fallback chunk grounded at line 0', () => {
    // A document with only unbreakable content still cites line 0.
    const chunks = chunkMarkdownDocument('note-fb', 'Fallback', 'Single paragraph only', {
      targetTokens: 1,
      overlapTokens: 0
    });
    expect(chunks.length).toBeGreaterThanOrEqual(1);
    expect(chunks[0].metadata?.sourceLineIndex).toBe(0);
  });
});

describe('toGroundedChunkPayloads', () => {
  it('maps chunks to proxy payloads with citation lineage', () => {
    const chunks = chunkMarkdownDocument('note-1', 'Biology', NOTE, { targetTokens: 40 });
    const payloads = toGroundedChunkPayloads(chunks);

    expect(payloads.length).toBe(chunks.length);
    for (let i = 0; i < payloads.length; i++) {
      expect(payloads[i].id).toBe(chunks[i].id);
      expect(payloads[i].sourceLineIndex).toBe(getChunkSourceLineIndex(chunks[i]));
      expect(payloads[i].content.length).toBeGreaterThan(0);
    }
  });
});

describe('validateGroundedCards — the grounding gate', () => {
  const payloads = [
    {
      id: 'note-1-chunk-0',
      title: 'Biology',
      breadcrumb: 'Biology > Cellular Respiration',
      content: 'Glycolysis is the breakdown of glucose into pyruvate.',
      sourceLineIndex: 3
    },
    {
      id: 'note-1-chunk-1',
      title: 'Biology',
      breadcrumb: 'Biology > Photosynthesis',
      content: 'Chlorophyll is the pigment that absorbs light energy.',
      sourceLineIndex: 6
    }
  ];

  it('keeps cards whose sourceChunkId points at a provided chunk', () => {
    const grounded = validateGroundedCards(
      [
        { front: 'What is glycolysis?', back: 'The breakdown of glucose into pyruvate.', type: 'concept', sourceChunkId: 'note-1-chunk-0' }
      ],
      payloads
    );

    expect(grounded).toHaveLength(1);
    expect(grounded[0].sourceChunkId).toBe('note-1-chunk-0');
    expect(grounded[0].sourceLineIndex).toBe(3);
    expect(grounded[0].sourceExcerpt).toContain('Glycolysis');
  });

  it('drops hallucinated cards citing chunks that were never provided', () => {
    const grounded = validateGroundedCards(
      [
        { front: 'What is quantum tunneling?', back: 'Made-up content.', type: 'standard', sourceChunkId: 'hallucinated-chunk-99' },
        { front: 'No source id at all', back: 'Also dropped.', type: 'standard' },
        { front: '', back: 'Empty front.', type: 'standard', sourceChunkId: 'note-1-chunk-0' }
      ],
      payloads
    );

    expect(grounded).toHaveLength(0);
  });

  it('normalizes unknown card types to standard and truncates oversized fields', () => {
    const grounded = validateGroundedCards(
      [
        {
          front: 'F'.repeat(600),
          back: 'B'.repeat(2000),
          type: 'exotic-unknown',
          sourceChunkId: 'note-1-chunk-1'
        }
      ],
      payloads
    );

    expect(grounded).toHaveLength(1);
    expect(grounded[0].type).toBe('standard');
    expect(grounded[0].front.length).toBeLessThanOrEqual(500);
    expect(grounded[0].back.length).toBeLessThanOrEqual(1000);
  });

  it('returns an empty array for non-array payloads', () => {
    expect(validateGroundedCards('not an array', payloads)).toHaveLength(0);
    expect(validateGroundedCards(null, payloads)).toHaveLength(0);
  });
});

describe('extractDeterministicGroundedCards — keyless fallback', () => {
  const payloads = [
    {
      id: 'note-1-chunk-0',
      title: 'Biology',
      breadcrumb: 'Biology > Cellular Respiration',
      content: 'Glycolysis is the breakdown of glucose into pyruvate with a net gain of two ATP. Pyruvate is transported into the mitochondria for the Krebs cycle.',
      sourceLineIndex: 3
    },
    {
      id: 'note-1-chunk-1',
      title: 'Biology',
      breadcrumb: 'Biology > Photosynthesis',
      content: 'Chlorophyll: the pigment that absorbs light energy in plants and gives leaves their green color.',
      sourceLineIndex: 6
    }
  ];

  it('mines definitional cards strictly from chunk content', () => {
    const cards = extractDeterministicGroundedCards(payloads, 3);

    expect(cards.length).toBeGreaterThan(0);
    expect(cards.length).toBeLessThanOrEqual(3);
    for (const card of cards) {
      // Every card must cite one of the provided chunks — nothing invented.
      expect(payloads.some((p) => p.id === card.sourceChunkId)).toBe(true);
      expect(['note-1-chunk-0', 'note-1-chunk-1'].includes(card.sourceChunkId)).toBe(true);
    }
  });

  it('carries the citation lineage of the chunk it was extracted from', () => {
    const cards = extractDeterministicGroundedCards(payloads, 5);
    for (const card of cards) {
      expect(typeof card.sourceLineIndex).toBe('number');
      expect([3, 6].includes(card.sourceLineIndex as number)).toBe(true);
    }
  });

  it('falls back to an explain-the-section card for unpatterned chunks', () => {
    const unpatterned = [
      {
        id: 'chunk-flat',
        title: 'History',
        breadcrumb: 'History > Treaty of Westphalia',
        content: 'Signed in sixteen forty eight it ended decades of war across the continent',
        sourceLineIndex: 12
      }
    ];
    const cards = extractDeterministicGroundedCards(unpatterned, 3);

    expect(cards).toHaveLength(1);
    expect(cards[0].front).toContain('Treaty of Westphalia');
    expect(cards[0].sourceChunkId).toBe('chunk-flat');
    expect(cards[0].sourceLineIndex).toBe(12);
  });

  it('respects the requested count and de-duplicates fronts', () => {
    const cards = extractDeterministicGroundedCards(payloads, 1);
    expect(cards).toHaveLength(1);

    const fronts = cards.map((c) => c.front.trim().toLowerCase());
    expect(new Set(fronts).size).toBe(fronts.length);
  });

  it('produces zero cards from zero chunks (never fabricates)', () => {
    expect(extractDeterministicGroundedCards([], 3)).toHaveLength(0);
  });
});

describe('Edge Function contract (plan §8.2)', () => {
  it('uses the generate-cards Supabase Edge Function name', () => {
    expect(GENERATE_CARDS_EDGE_FUNCTION).toBe('generate-cards');
  });
});
