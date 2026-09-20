/**
 * Solis Editorial Markdown & Note Metrics Engine
 * Handcrafted deterministic parser supporting headings, code blocks, callouts,
 * interactive checkboxes, inline math, and export serialization.
 */

export interface NoteMetrics {
  wordCount: number;
  charCount: number;
  readingTimeMinutes: number;
}

/**
 * Calculates deterministic word count, char count, and estimated reading time.
 * Standard academic reading speed: 200 words per minute.
 */
export function calculateNoteMetrics(content: string): NoteMetrics {
  if (!content || !content.trim()) {
    return { wordCount: 0, charCount: 0, readingTimeMinutes: 0 };
  }

  const trimmed = content.trim();
  const words = trimmed.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const charCount = trimmed.length;
  const readingTimeMinutes = Math.max(1, Math.ceil(wordCount / 200));

  return {
    wordCount,
    charCount,
    readingTimeMinutes
  };
}

/**
 * Serializes a note to standard Markdown with YAML frontmatter for portability.
 */
export function serializeNoteToMarkdown(options: {
  title: string;
  content: string;
  category?: string;
  subjectName?: string;
  tags?: string[];
  updatedAt?: string;
}): string {
  const frontmatter = [
    '---',
    `title: "${options.title.replace(/"/g, '\\"')}"`,
    `category: ${options.category || 'concept'}`,
    options.subjectName ? `discipline: "${options.subjectName}"` : null,
    options.tags && options.tags.length > 0 ? `tags: [${options.tags.map((t) => `"${t}"`).join(', ')}]` : null,
    `updated_at: "${options.updatedAt || new Date().toISOString()}"`,
    'generator: "Solis OS (Sovereign Knowledge Sanctuary)"',
    '---',
    '',
    options.content
  ].filter(Boolean).join('\n');

  return frontmatter;
}

export type MarkdownBlockType =
  | 'heading'
  | 'paragraph'
  | 'code_block'
  | 'blockquote'
  | 'callout'
  | 'task_item'
  | 'bullet_item'
  | 'numbered_item'
  | 'math_block'
  | 'thematic_break';

export interface MarkdownBlock {
  type: MarkdownBlockType;
  level?: number; // 1, 2, 3 for headings
  content: string;
  language?: string; // For code blocks
  calloutType?: 'NOTE' | 'KEY' | 'INSIGHT' | 'THEOREM' | 'WARNING';
  calloutTitle?: string;
  completed?: boolean; // For task items
  taskIndex?: number; // Sequential index for interactive toggling
  orderNumber?: number; // For numbered lists
}

/**
 * Parses raw markdown text into structured blocks for editorial rendering.
 */
export function parseMarkdownBlocks(rawText: string): MarkdownBlock[] {
  if (!rawText) return [];

  const lines = rawText.split('\n');
  const blocks: MarkdownBlock[] = [];
  let taskCounter = 0;

  let inCodeBlock = false;
  let codeLang = '';
  let codeBuffer: string[] = [];

  let inMathBlock = false;
  let mathBuffer: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for fenced code block ```
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        // Close code block
        blocks.push({
          type: 'code_block',
          language: codeLang || 'text',
          content: codeBuffer.join('\n')
        });
        inCodeBlock = false;
        codeLang = '';
        codeBuffer = [];
      } else {
        // Start code block
        inCodeBlock = true;
        codeLang = line.trim().slice(3).trim();
        codeBuffer = [];
      }
      continue;
    }

    if (inCodeBlock) {
      codeBuffer.push(line);
      continue;
    }

    // Check for block math $$
    if (line.trim().startsWith('$$')) {
      if (inMathBlock) {
        blocks.push({
          type: 'math_block',
          content: mathBuffer.join('\n')
        });
        inMathBlock = false;
        mathBuffer = [];
      } else {
        inMathBlock = true;
        mathBuffer = [];
        const rest = line.trim().slice(2).trim();
        if (rest && !rest.endsWith('$$')) {
          mathBuffer.push(rest);
        } else if (rest.endsWith('$$')) {
          blocks.push({
            type: 'math_block',
            content: rest.slice(0, -2).trim()
          });
          inMathBlock = false;
        }
      }
      continue;
    }

    if (inMathBlock) {
      if (line.trim().endsWith('$$')) {
        mathBuffer.push(line.trim().slice(0, -2));
        blocks.push({
          type: 'math_block',
          content: mathBuffer.join('\n')
        });
        inMathBlock = false;
        mathBuffer = [];
      } else {
        mathBuffer.push(line);
      }
      continue;
    }

    const trimmedLine = line.trim();

    // Empty lines
    if (!trimmedLine) {
      continue;
    }

    // Thematic break ---
    if (/^(\*{3,}|-{3,}|_{3,})$/.test(trimmedLine)) {
      blocks.push({ type: 'thematic_break', content: '' });
      continue;
    }

    // Headings #, ##, ###
    const headingMatch = line.match(/^(#{1,6})\s+(.*)$/);
    if (headingMatch) {
      blocks.push({
        type: 'heading',
        level: headingMatch[1].length,
        content: headingMatch[2]
      });
      continue;
    }

    // Callout quote > [!NOTE], > [!KEY], etc.
    const calloutMatch = line.match(/^>\s*\[!(NOTE|KEY|INSIGHT|THEOREM|WARNING)\](?:\s+(.*))?$/i);
    if (calloutMatch) {
      const calloutType = calloutMatch[1].toUpperCase() as any;
      const initialHeader = calloutMatch[2]?.trim() || '';
      const calloutLines: string[] = [];

      // Consume subsequent lines belonging to this callout
      while (i + 1 < lines.length && lines[i + 1].startsWith('>')) {
        // If next line starts a brand new callout type, stop consuming
        if (/^>\s*\[!(NOTE|KEY|INSIGHT|THEOREM|WARNING)\]/i.test(lines[i + 1])) {
          break;
        }
        i++;
        calloutLines.push(lines[i].replace(/^>\s?/, ''));
      }

      if (calloutLines.length === 0) {
        // Single-line callout: content is the initialHeader
        blocks.push({
          type: 'callout',
          calloutType,
          content: initialHeader
        });
      } else {
        // Multiline callout: initialHeader is the title, calloutLines is the body
        blocks.push({
          type: 'callout',
          calloutType,
          calloutTitle: initialHeader || undefined,
          content: calloutLines.join('\n')
        });
      }
      continue;
    }

    // Standard blockquote >
    if (line.startsWith('>')) {
      const quoteLines: string[] = [line.replace(/^>\s?/, '')];
      while (i + 1 < lines.length && lines[i + 1].startsWith('>')) {
        if (/^>\s*\[!(NOTE|KEY|INSIGHT|THEOREM|WARNING)\]/i.test(lines[i + 1])) {
          break;
        }
        i++;
        quoteLines.push(lines[i].replace(/^>\s?/, ''));
      }
      blocks.push({
        type: 'blockquote',
        content: quoteLines.join('\n')
      });
      continue;
    }

    // Task checkbox item - [ ] or - [x]
    const taskMatch = line.match(/^[-*]\s+\[([ xX])\]\s+(.*)$/);
    if (taskMatch) {
      blocks.push({
        type: 'task_item',
        completed: taskMatch[1].toLowerCase() === 'x',
        content: taskMatch[2],
        taskIndex: taskCounter++
      });
      continue;
    }

    // Numbered list item: 1. Item
    const numberedMatch = line.match(/^(\d+)\.\s+(.*)$/);
    if (numberedMatch) {
      blocks.push({
        type: 'numbered_item',
        orderNumber: parseInt(numberedMatch[1], 10),
        content: numberedMatch[2]
      });
      continue;
    }

    // Standard list item - or *
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    if (bulletMatch) {
      blocks.push({
        type: 'bullet_item',
        content: bulletMatch[1]
      });
      continue;
    }

    // Paragraph
    blocks.push({
      type: 'paragraph',
      content: line
    });
  }

  // Flush remaining buffers if unclosed
  if (inCodeBlock && codeBuffer.length > 0) {
    blocks.push({
      type: 'code_block',
      language: codeLang || 'text',
      content: codeBuffer.join('\n')
    });
  }
  if (inMathBlock && mathBuffer.length > 0) {
    blocks.push({
      type: 'math_block',
      content: mathBuffer.join('\n')
    });
  }

  return blocks;
}
