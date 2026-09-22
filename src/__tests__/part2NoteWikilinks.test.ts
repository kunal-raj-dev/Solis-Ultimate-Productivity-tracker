import { describe, it, expect, vi } from 'vitest';
import {
  parseWikilinkToken,
  extractWikilinks,
  buildWikilinkUrl,
  hasWikilinkTo,
  findBacklinks,
  replaceWikilinksWithMarkdown
} from '../utils/notes/wikilinks';
import { renderInlineContent } from '../components/features/Notes/MarkdownReadingView';
import { Note } from '../types/note';

const createMockNote = (overrides: Partial<Note>): Note => ({
  id: `note-${Math.random().toString(36).slice(2, 6)}`,
  title: 'Untitled Note',
  content: '',
  category: 'concept',
  tags: [],
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: '2026-09-01T00:00:00.000Z',
  ...overrides
});

describe('SOLIS PART 2 — Bidirectional Wikilink & Knowledge Graph Suite', () => {
  /* =========================================================================
     1. Wikilink Token Parsing (parseWikilinkToken)
     ========================================================================= */
  describe('Wikilink Token Parsing (parseWikilinkToken)', () => {
    it('parses standard [[Note Title]] syntax with identical target and alias', () => {
      const parsed = parseWikilinkToken('[[Raft Consensus]]');
      expect(parsed.isValid).toBe(true);
      expect(parsed.target).toBe('Raft Consensus');
      expect(parsed.alias).toBe('Raft Consensus');
    });

    it('parses [[Target|Custom Alias]] syntax separating target note and display label', () => {
      const parsed = parseWikilinkToken('[[Distributed Systems|Paxos & Raft Principles]]');
      expect(parsed.isValid).toBe(true);
      expect(parsed.target).toBe('Distributed Systems');
      expect(parsed.alias).toBe('Paxos & Raft Principles');
    });

    it('trims leading, trailing, and internal pipe whitespace cleanly', () => {
      const parsed = parseWikilinkToken('[[   Computer Architecture   |   CPU Pipelining   ]]');
      expect(parsed.isValid).toBe(true);
      expect(parsed.target).toBe('Computer Architecture');
      expect(parsed.alias).toBe('CPU Pipelining');
    });

    it('parses section heading anchors [[Target#Heading]] cleanly', () => {
      const parsed = parseWikilinkToken('[[Operating Systems#Paging]]');
      expect(parsed.isValid).toBe(true);
      expect(parsed.target).toBe('Operating Systems');
      expect(parsed.heading).toBe('Paging');
      expect(parsed.alias).toBe('Operating Systems#Paging');
    });

    it('parses aliased section heading anchors [[Target#Heading|Alias]]', () => {
      const parsed = parseWikilinkToken('[[Operating Systems#Paging|Virtual Memory]]');
      expect(parsed.isValid).toBe(true);
      expect(parsed.target).toBe('Operating Systems');
      expect(parsed.heading).toBe('Paging');
      expect(parsed.alias).toBe('Virtual Memory');
    });

    it('resiliently parses note titles containing single square brackets', () => {
      const parsed = parseWikilinkToken('[[Distributed Systems [v2] Architecture]]');
      expect(parsed.isValid).toBe(true);
      expect(parsed.target).toBe('Distributed Systems [v2] Architecture');
      expect(parsed.alias).toBe('Distributed Systems [v2] Architecture');
    });

    it('rejects malformed tokens without throwing', () => {
      expect(parseWikilinkToken('[[Unclosed').isValid).toBe(false);
      expect(parseWikilinkToken('Single Bracket [Link]').isValid).toBe(false);
      expect(parseWikilinkToken('[[]]').isValid).toBe(false);
      expect(parseWikilinkToken('[[   ]]').isValid).toBe(false);
      expect(parseWikilinkToken('[[|]]').isValid).toBe(false);
      expect(parseWikilinkToken('').isValid).toBe(false);
    });
  });

  /* =========================================================================
     2. Wikilink Text Extraction (extractWikilinks)
     ========================================================================= */
  describe('Wikilink Text Extraction (extractWikilinks)', () => {
    it('extracts multiple wikilinks from rich markdown body text', () => {
      const content = `
# Concurrency Notes
Refer to [[Operating Systems]] for process scheduling and [[Distributed Systems|Raft]] for consensus.
Also see [[Memory Hierarchy]].
`;
      const links = extractWikilinks(content);
      expect(links).toHaveLength(3);

      expect(links[0].target).toBe('Operating Systems');
      expect(links[0].alias).toBe('Operating Systems');

      expect(links[1].target).toBe('Distributed Systems');
      expect(links[1].alias).toBe('Raft');

      expect(links[2].target).toBe('Memory Hierarchy');
      expect(links[2].alias).toBe('Memory Hierarchy');
    });

    it('returns empty array when content contains zero wikilinks', () => {
      expect(extractWikilinks('Plain text without links.')).toEqual([]);
      expect(extractWikilinks('')).toEqual([]);
    });

    it('distinguishes between standard markdown links and wikilinks', () => {
      const text = 'Here is a [standard link](https://solis.os) and a [[Wikilink Note]].';
      const extracted = extractWikilinks(text);
      expect(extracted).toHaveLength(1);
      expect(extracted[0].target).toBe('Wikilink Note');
    });
  });

  /* =========================================================================
     3. Canonical Navigation URL Building (buildWikilinkUrl)
     ========================================================================= */
  describe('Canonical Navigation URL Building (buildWikilinkUrl)', () => {
    it('generates URL encoded /app/notes?q=... paths', () => {
      expect(buildWikilinkUrl('Operating Systems')).toBe('/app/notes?q=Operating%20Systems');
    });

    it('encodes special symbols: slashes, ampersands, pluses, and quotes', () => {
      expect(buildWikilinkUrl('C++ & Systems/OS')).toBe('/app/notes?q=C%2B%2B%20%26%20Systems%2FOS');
      expect(buildWikilinkUrl('Gödel, Escher, Bach')).toBe('/app/notes?q=G%C3%B6del%2C%20Escher%2C%20Bach');
    });

    it('allows custom base paths when needed', () => {
      expect(buildWikilinkUrl('Raft', '/app/knowledge')).toBe('/app/knowledge?q=Raft');
    });

    it('formats section heading anchors with clean query and URL hash', () => {
      expect(buildWikilinkUrl('Operating Systems#Paging')).toBe('/app/notes?q=Operating%20Systems#Paging');
    });
  });

  /* =========================================================================
     4. Backlink Discovery Across Notes (findBacklinks)
     ========================================================================= */
  describe('Backlink Discovery Across Knowledge Graph (findBacklinks)', () => {
    const notes: Note[] = [
      createMockNote({
        id: 'n-target',
        title: 'Virtual Memory',
        content: 'Core virtual memory concepts, paging, and TLB.'
      }),
      createMockNote({
        id: 'n-os',
        title: 'Operating Systems Overview',
        content: 'We cover process management and [[Virtual Memory]] in depth.'
      }),
      createMockNote({
        id: 'n-arch',
        title: 'Computer Architecture',
        content: 'Hardware MMUs accelerate [[virtual memory|Virtual Memory]] translations.'
      }),
      createMockNote({
        id: 'n-unrelated',
        title: 'Database Transactions',
        content: 'ACID properties and isolation levels.'
      })
    ];

    it('finds all other notes referencing the target note title', () => {
      const backlinks = findBacklinks('Virtual Memory', notes, 'n-target');
      expect(backlinks).toHaveLength(2);

      const referencingTitles = backlinks.map((b) => b.noteTitle);
      expect(referencingTitles).toContain('Operating Systems Overview');
      expect(referencingTitles).toContain('Computer Architecture');
    });

    it('matches target titles case-insensitively', () => {
      const backlinks = findBacklinks('virtual memory', notes, 'n-target');
      expect(backlinks).toHaveLength(2);
    });

    it('excludes the current note from its own backlinks to prevent self-loops', () => {
      const selfLinkingNote = createMockNote({
        id: 'n-self',
        title: 'Recursion',
        content: 'To understand recursion, see [[Recursion]].'
      });

      const backlinks = findBacklinks('Recursion', [selfLinkingNote], 'n-self');
      expect(backlinks).toHaveLength(0);
    });

    it('extracts contextual surrounding snippets for backlink previews', () => {
      const backlinks = findBacklinks('Virtual Memory', notes, 'n-target');
      expect(backlinks[0].snippet).toContain('[[Virtual Memory]]');
    });
  });

  /* =========================================================================
     5. Wikilink Direct Reference Check (hasWikilinkTo)
     ========================================================================= */
  describe('Wikilink Direct Reference Check (hasWikilinkTo)', () => {
    it('returns true when content references the target note', () => {
      const content = 'This concept is built on [[Distributed Systems]].';
      expect(hasWikilinkTo(content, 'Distributed Systems')).toBe(true);
      expect(hasWikilinkTo(content, 'distributed systems')).toBe(true);
    });

    it('returns false when content does not reference the target note', () => {
      const content = 'This concept is built on [[Compilers]].';
      expect(hasWikilinkTo(content, 'Distributed Systems')).toBe(false);
      expect(hasWikilinkTo('', 'Distributed Systems')).toBe(false);
    });
  });

  /* =========================================================================
     6. Markdown Wikilink Replacement (replaceWikilinksWithMarkdown)
     ========================================================================= */
  describe('Markdown Wikilink Replacement (replaceWikilinksWithMarkdown)', () => {
    it('replaces [[Target]] with standard [Target](/app/notes?q=Target)', () => {
      const text = 'Read [[Operating Systems]] for details.';
      const replaced = replaceWikilinksWithMarkdown(text);
      expect(replaced).toBe('Read [Operating Systems](/app/notes?q=Operating%20Systems) for details.');
    });

    it('replaces [[Target|Alias]] with [Alias](/app/notes?q=Target)', () => {
      const text = 'See [[Distributed Systems|Raft Protocol]].';
      const replaced = replaceWikilinksWithMarkdown(text);
      expect(replaced).toBe('See [Raft Protocol](/app/notes?q=Distributed%20Systems).');
    });
  });

  /* =========================================================================
     7. MarkdownReadingView Inline Tokenizer Integration
     ========================================================================= */
  describe('MarkdownReadingView Inline Tokenizer Integration', () => {
    it('renders wikilinks as anchor tags with solis-markdown-wikilink class and query link', () => {
      const nodes = renderInlineContent('Refer to [[Concurrency Models]] for threads.');
      expect(nodes.length).toBeGreaterThanOrEqual(2);

      // Find the anchor node
      const linkNode = nodes.find((n: any) => n?.type === 'a') as any;
      expect(linkNode).toBeDefined();
      expect(linkNode.props.href).toBe('/app/notes?q=Concurrency%20Models');
      expect(linkNode.props.className).toContain('solis-markdown-wikilink');
      expect(linkNode.props.children).toBe('Concurrency Models');
    });

    it('renders aliased wikilinks displaying the alias while linking to target', () => {
      const nodes = renderInlineContent('Check out [[Computer Architecture|Hardware Pipeline]].');
      const linkNode = nodes.find((n: any) => n?.type === 'a') as any;

      expect(linkNode).toBeDefined();
      expect(linkNode.props.href).toBe('/app/notes?q=Computer%20Architecture');
      expect(linkNode.props.children).toBe('Hardware Pipeline');
    });

    it('gracefully handles text with mixed inline elements (bold, code, tags, wikilinks)', () => {
      const text = '**Important:** Check `index.ts` and [[Raft]] for #distributed systems.';
      const nodes = renderInlineContent(text);
      expect(nodes.length).toBeGreaterThan(3);

      const hasBold = nodes.some((n: any) => n?.type === 'strong');
      const hasCode = nodes.some((n: any) => n?.type === 'code');
      const hasWikilink = nodes.some((n: any) => n?.type === 'a' && n.props.className?.includes('solis-markdown-wikilink'));
      const hasTag = nodes.some((n: any) => n?.type === 'span' && n.props.className?.includes('solis-markdown-inline-tag'));

      expect(hasBold).toBe(true);
      expect(hasCode).toBe(true);
      expect(hasWikilink).toBe(true);
      expect(hasTag).toBe(true);
    });

    it('invokes onWikilinkClick callback and prevents default navigation on click', () => {
      const onWikilinkClick = vi.fn();
      const nodes = renderInlineContent('See [[Distributed Systems]]', onWikilinkClick);
      const linkNode = nodes.find((n: any) => n?.type === 'a') as any;

      expect(linkNode).toBeDefined();

      const mockEvent = { preventDefault: vi.fn() };
      linkNode.props.onClick(mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(onWikilinkClick).toHaveBeenCalledWith('Distributed Systems');
    });
  });
});
