/**
 * Solis Inline Flashcard Extraction Parser — plan §4.3 (master.md §6: BUILD CANONICAL)
 *
 * Detects inline active-recall cards typed directly in markdown notes:
 *   - `Term :: Definition`
 *   - `Q: Question? :: A: Answer`
 *
 * Code blocks (fenced), blockquotes, math blocks, and inline code spans are
 * excluded so quoted or example code never leaks into the recall deck.
 * (Indented lines are NOT excluded: the app's own markdown renderer treats
 * indented lines as normal paragraphs/list continuations, so `Term ::
 * Definition` written under a parent bullet is a legitimate card.)
 * Pure, deterministic functions only (master.md §18).
 */

export interface InlineFlashcard {
  frontPrompt: string;
  backAnswer: string;
  /** 0-based index of the source line inside the note content. */
  sourceLineIndex: number;
}

/** Separators/prefixes that must never be treated as card content. */
const FENCE_RE = /^\s*(```|~~~)/;
const BLOCKQUOTE_RE = /^\s*>/;
const MATH_FENCE_RE = /^\s*\$\$/;
/** Pandoc-style fenced divs (`::: name`) and attribute lines. */
const FENCED_DIV_RE = /^\s*:/;
/** Leading markdown constructs that are not part of the card prompt. */
const LIST_OR_HEADING_PREFIX_RE = /^\s*(?:[-*+]\s+|(?:\d+|[a-zA-Z])[.)]\s+|#{1,6}\s+)/;
const INLINE_CODE_SPAN_RE = /`[^`]*`/g;
const QUESTION_PREFIX_RE = /^\s*q\s*:\s*/i;
const ANSWER_PREFIX_RE = /^\s*a\s*:\s*/i;
const INLINE_SEPARATOR = '::';

/** Upper sanity bound so a runaway line cannot produce an absurd card. */
const MAX_CARD_FIELD_LENGTH = 500;

function stripInlineCodeSpans(line: string): string {
  return line.replace(INLINE_CODE_SPAN_RE, '');
}

function normalizeTerm(rawTerm: string): string {
  return rawTerm
    .replace(LIST_OR_HEADING_PREFIX_RE, '')
    .replace(QUESTION_PREFIX_RE, '')
    .trim();
}

function normalizeDefinition(rawDefinition: string): string {
  return rawDefinition.replace(ANSWER_PREFIX_RE, '').trim();
}

/**
 * Extracts every inline flashcard (`Term :: Definition`, optionally with
 * `Q:` / `A:` prefixes) from note content. The first `::` on a qualifying
 * line separates prompt from answer; later `::` occurrences stay in the
 * answer text. Lines inside code blocks, blockquotes, math blocks, or inline
 * code spans are ignored, as are lines without a usable separator.
 */
export function extractInlineFlashcards(content: string): InlineFlashcard[] {
  if (!content) return [];

  const cards: InlineFlashcard[] = [];
  const lines = content.split('\n');

  let inFencedCode = false;
  let inMathBlock = false;

  for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
    const line = lines[lineIndex];

    if (FENCE_RE.test(line)) {
      inFencedCode = !inFencedCode;
      continue;
    }
    if (inFencedCode) continue;

    if (MATH_FENCE_RE.test(line)) {
      inMathBlock = !inMathBlock;
      continue;
    }
    if (inMathBlock) continue;

    if (BLOCKQUOTE_RE.test(line)) continue;
    if (FENCED_DIV_RE.test(line)) continue;

    const withoutCodeSpans = stripInlineCodeSpans(line);
    const separatorIndex = withoutCodeSpans.indexOf(INLINE_SEPARATOR);
    if (separatorIndex === -1) continue;

    const term = normalizeTerm(withoutCodeSpans.slice(0, separatorIndex));
    const definition = normalizeDefinition(withoutCodeSpans.slice(separatorIndex + INLINE_SEPARATOR.length));

    if (!term || !definition) continue;
    if (term.length > MAX_CARD_FIELD_LENGTH || definition.length > MAX_CARD_FIELD_LENGTH) continue;

    cards.push({
      frontPrompt: term,
      backAnswer: definition,
      sourceLineIndex: lineIndex
    });
  }

  return cards;
}
