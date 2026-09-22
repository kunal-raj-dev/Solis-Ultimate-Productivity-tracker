/**
 * Solis Sovereign Knowledge System — Bidirectional Wikilink & Backlink Engine
 * 
 * Provides pure utilities for:
 * - Parsing [[Note Title]] and [[Note Title|Custom Alias]] syntax
 * - Resolving query parameter navigation URLs
 * - Bidirectional backlink graph discovery across the notes repository
 * - Converting wikilinks into standard markdown links
 */

export interface ParsedWikilink {
  raw: string;
  target: string;
  alias: string;
  heading?: string;
  isValid: boolean;
  index?: number;
}

export interface BacklinkMatch {
  noteId: string;
  noteTitle: string;
  matchCount: number;
  snippet: string;
}

export const WIKILINK_REGEX = /\[\[((?:(?!\]\])[^\n])+?)\]\]/g;

/**
 * Parses an individual [[Wikilink]], [[Target|Alias]], or [[Target#Heading|Alias]] token.
 */
export function parseWikilinkToken(rawToken: string): ParsedWikilink {
  const trimmed = (rawToken || '').trim();
  if (!trimmed.startsWith('[[') || !trimmed.endsWith(']]')) {
    return { raw: rawToken, target: '', alias: '', isValid: false };
  }

  const inner = trimmed.slice(2, -2).trim();
  if (!inner) {
    return { raw: rawToken, target: '', alias: '', isValid: false };
  }

  let fullTarget = inner;
  let alias = '';

  const pipeIndex = inner.indexOf('|');
  if (pipeIndex !== -1) {
    fullTarget = inner.slice(0, pipeIndex).trim();
    alias = inner.slice(pipeIndex + 1).trim();
  }

  let target = fullTarget;
  let heading: string | undefined = undefined;

  const hashIndex = fullTarget.indexOf('#');
  if (hashIndex !== -1) {
    target = fullTarget.slice(0, hashIndex).trim();
    heading = fullTarget.slice(hashIndex + 1).trim();
  }

  const displayAlias = alias || fullTarget;
  const isValid = target.length > 0 || (heading !== undefined && heading.length > 0);

  return {
    raw: rawToken,
    target,
    alias: displayAlias,
    heading,
    isValid
  };
}

/**
 * Extracts all valid wikilink occurrences from text.
 */
export function extractWikilinks(text: string): ParsedWikilink[] {
  if (!text) return [];

  const results: ParsedWikilink[] = [];
  const regex = new RegExp(WIKILINK_REGEX.source, 'g');
  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const raw = match[0];
    const parsed = parseWikilinkToken(raw);
    if (parsed.isValid) {
      results.push({
        ...parsed,
        index: match.index
      });
    }
  }

  return results;
}

/**
 * Generates canonical notes navigation URL for a wikilink target (with optional section heading anchor).
 */
export function buildWikilinkUrl(target: string, basePath: string = '/app/notes'): string {
  const cleanTarget = (target || '').trim();
  if (cleanTarget.includes('#')) {
    const hashIndex = cleanTarget.indexOf('#');
    const titlePart = cleanTarget.slice(0, hashIndex).trim();
    const hashPart = cleanTarget.slice(hashIndex + 1).trim();
    const hashSuffix = hashPart ? `#${encodeURIComponent(hashPart)}` : '';
    return `${basePath}?q=${encodeURIComponent(titlePart)}${hashSuffix}`;
  }
  return `${basePath}?q=${encodeURIComponent(cleanTarget)}`;
}

/**
 * Checks whether content contains a wikilink referencing the target note title (case-insensitive).
 */
export function hasWikilinkTo(content: string, targetTitle: string): boolean {
  if (!content || !targetTitle) return false;
  const targetLower = targetTitle.trim().toLowerCase();
  const links = extractWikilinks(content);
  return links.some((link) => link.target.toLowerCase() === targetLower);
}

/**
 * Finds all backlinks in the notes repository referencing a specific target note title.
 * Omits the current note if currentNoteId is provided.
 */
export function findBacklinks(
  targetTitle: string,
  allNotes: Array<{ id: string; title: string; content: string }>,
  currentNoteId?: string
): BacklinkMatch[] {
  if (!targetTitle || !allNotes || allNotes.length === 0) return [];
  const targetLower = targetTitle.trim().toLowerCase();
  const matches: BacklinkMatch[] = [];

  for (const note of allNotes) {
    if (currentNoteId && note.id === currentNoteId) continue;
    if (!note.content) continue;

    const links = extractWikilinks(note.content);
    const targetLinks = links.filter((l) => l.target.toLowerCase() === targetLower);

    if (targetLinks.length > 0) {
      // Create concise contextual snippet around first match
      const firstLink = targetLinks[0];
      const start = Math.max(0, (firstLink.index || 0) - 40);
      const end = Math.min(note.content.length, (firstLink.index || 0) + firstLink.raw.length + 40);
      let snippet = note.content.slice(start, end).replace(/\n/g, ' ').trim();
      if (start > 0) snippet = '...' + snippet;
      if (end < note.content.length) snippet = snippet + '...';

      matches.push({
        noteId: note.id,
        noteTitle: note.title,
        matchCount: targetLinks.length,
        snippet
      });
    }
  }

  return matches;
}

/**
 * Converts all [[Wikilinks]] in text into standard Markdown links with URL encoding.
 */
export function replaceWikilinksWithMarkdown(text: string, basePath: string = '/app/notes'): string {
  if (!text) return '';
  return text.replace(WIKILINK_REGEX, (raw) => {
    const parsed = parseWikilinkToken(raw);
    if (!parsed.isValid) return raw;
    const fullTarget = parsed.heading ? `${parsed.target}#${parsed.heading}` : parsed.target;
    const url = buildWikilinkUrl(fullTarget, basePath);
    return `[${parsed.alias}](${url})`;
  });
}
