import { describe, it, expect } from 'vitest';
import { extractInlineFlashcards } from '../inlineCardParser';

/**
 * Phase 4.3 — Inline Flashcard Extraction Syntax (`::`) harness (plan §4.3).
 *
 * Pins the parser contract: `Term :: Definition` and `Q: Question? :: A: Answer`
 * lines become recall cards; code blocks, blockquotes, math blocks, and inline
 * code spans are excluded.
 */

describe('extractInlineFlashcards — detection', () => {
  it('extracts a simple Term :: Definition line', () => {
    const cards = extractInlineFlashcards('Mitochondria :: The powerhouse of the cell');

    expect(cards).toHaveLength(1);
    expect(cards[0].frontPrompt).toBe('Mitochondria');
    expect(cards[0].backAnswer).toBe('The powerhouse of the cell');
    expect(cards[0].sourceLineIndex).toBe(0);
  });

  it('strips Q: / A: prefixes from the Question? :: Answer form', () => {
    const cards = extractInlineFlashcards('Q: What is FSRS? :: A: A modern spaced repetition scheduler');

    expect(cards).toHaveLength(1);
    expect(cards[0].frontPrompt).toBe('What is FSRS?');
    expect(cards[0].backAnswer).toBe('A modern spaced repetition scheduler');
  });

  it('extracts multiple cards and preserves source line indexes', () => {
    const content = [
      'Intro paragraph without a separator.',
      '',
      'Axon :: Conducts electrical impulses away from the cell body',
      'Myelin :: Insulating sheath that speeds up conduction',
      'Closing remarks.'
    ].join('\n');

    const cards = extractInlineFlashcards(content);

    expect(cards).toHaveLength(2);
    expect(cards[0].frontPrompt).toBe('Axon');
    expect(cards[0].sourceLineIndex).toBe(2);
    expect(cards[1].frontPrompt).toBe('Myelin');
    expect(cards[1].sourceLineIndex).toBe(3);
  });

  it('splits on the first :: only, keeping later :: in the answer', () => {
    const cards = extractInlineFlashcards('Raft terms :: leader :: follower');

    expect(cards).toHaveLength(1);
    expect(cards[0].frontPrompt).toBe('Raft terms');
    expect(cards[0].backAnswer).toBe('leader :: follower');
  });

  it('strips list markers and heading markers from the prompt', () => {
    const cards = extractInlineFlashcards([
      '- Apoptosis :: Programmed cell death',
      '## Osmosis :: Diffusion of water across a semipermeable membrane',
      '1. Entropy :: A measure of system disorder'
    ].join('\n'));

    expect(cards).toHaveLength(3);
    expect(cards[0].frontPrompt).toBe('Apoptosis');
    expect(cards[1].frontPrompt).toBe('Osmosis');
    expect(cards[2].frontPrompt).toBe('Entropy');
  });

  it('tolerates tight (unspaced) separators and surrounding whitespace', () => {
    const cards = extractInlineFlashcards('  Enzyme::Biological catalyst  ');

    expect(cards).toHaveLength(1);
    expect(cards[0].frontPrompt).toBe('Enzyme');
    expect(cards[0].backAnswer).toBe('Biological catalyst');
  });
});

describe('extractInlineFlashcards — exclusions', () => {
  it('ignores lines inside fenced code blocks', () => {
    const content = [
      'Real concept :: Real definition',
      '```ts',
      'const map = { key :: value };',
      '```',
      'Another concept :: Another definition'
    ].join('\n');

    const cards = extractInlineFlashcards(content);

    expect(cards).toHaveLength(2);
    expect(cards.map((c) => c.frontPrompt)).toEqual(['Real concept', 'Another concept']);
    expect(cards[1].sourceLineIndex).toBe(4);
  });

  it('treats indented list-continuation lines as legitimate cards', () => {
    // The app's markdown renderer treats indented lines as normal list
    // continuations, so cards nested under a parent bullet are extracted.
    const content = [
      '- Cell structures:',
      '    Nucleus :: Control center of the cell',
      '    Ribosome :: Protein assembly site'
    ].join('\n');

    const cards = extractInlineFlashcards(content);

    expect(cards.map((c) => c.frontPrompt)).toEqual(['Nucleus', 'Ribosome']);
    expect(cards.map((c) => c.backAnswer)).toEqual(['Control center of the cell', 'Protein assembly site']);
  });

  it('ignores blockquotes', () => {
    const content = [
      '> Quote: the professor said X :: Y once',
      'Real :: Card'
    ].join('\n');

    const cards = extractInlineFlashcards(content);

    expect(cards).toHaveLength(1);
    expect(cards[0].frontPrompt).toBe('Real');
  });

  it('ignores inline code spans', () => {
    const content = 'Use `term :: definition` syntax — see the docs';

    expect(extractInlineFlashcards(content)).toHaveLength(0);
  });

  it('ignores block math fences', () => {
    const content = [
      '$$',
      'E :: mc^2',
      '$$',
      'Force :: Mass times acceleration'
    ].join('\n');

    const cards = extractInlineFlashcards(content);

    expect(cards).toHaveLength(1);
    expect(cards[0].frontPrompt).toBe('Force');
  });
});

describe('extractInlineFlashcards — safety', () => {
  it('returns nothing for content without separators, empty terms, or empty answers', () => {
    expect(extractInlineFlashcards('')).toEqual([]);
    expect(extractInlineFlashcards('Plain line with no separator')).toEqual([]);
    expect(extractInlineFlashcards(':: Orphan definition')).toEqual([]);
    expect(extractInlineFlashcards('Orphan term ::')).toEqual([]);
  });

  it('is deterministic for identical input', () => {
    const content = 'A :: B\nQ: C? :: D';
    expect(extractInlineFlashcards(content)).toEqual(extractInlineFlashcards(content));
  });
});
