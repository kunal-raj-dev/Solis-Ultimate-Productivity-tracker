import React, { useRef } from 'react';
import { Bold, Italic, Heading2, Code, List, Quote } from 'lucide-react';

export interface MarkdownToolbarProps {
  value: string;
  onChange: (next: string, selection?: { start: number; end: number }) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  disabled?: boolean;
}

/**
 * Phase 2 (P2.2) — lightweight markdown formatting toolbar for the note
 * editor. Operates on the textarea's current selection; no execCommand.
 */
export const MarkdownToolbar: React.FC<MarkdownToolbarProps> = ({ value, onChange, textareaRef, disabled }) => {
  const restoreSelectionRef = useRef<{ start: number; end: number } | null>(null);

  const applyWrap = (before: string, after: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const selected = value.slice(start, end);
    const next =
      value.slice(0, start) + before + selected + after + value.slice(end);
    restoreSelectionRef.current = { start: start + before.length, end: end + before.length };
    onChange(next, restoreSelectionRef.current);
  };

  const applyLinePrefix = (prefix: string) => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end);
    const block = value.slice(lineStart, lineEnd);
    const prefixed = block
      .split('\n')
      .map((line) => (line.trim().startsWith(prefix.trim()) ? line : prefix + line))
      .join('\n');
    const next = value.slice(0, lineStart) + prefixed + value.slice(lineEnd);
    restoreSelectionRef.current = { start: lineStart, end: lineStart + prefixed.length };
    onChange(next, restoreSelectionRef.current);
  };

  const actions: { icon: React.ReactNode; label: string; run: () => void }[] = [
    { icon: <Bold size={13} />, label: 'Bold (**)', run: () => applyWrap('**', '**') },
    { icon: <Italic size={13} />, label: 'Italic (*)', run: () => applyWrap('*', '*') },
    { icon: <Heading2 size={13} />, label: 'Heading (##)', run: () => applyLinePrefix('## ') },
    { icon: <Code size={13} />, label: 'Inline code (`)', run: () => applyWrap('`', '`') },
    { icon: <List size={13} />, label: 'Bullet list (- )', run: () => applyLinePrefix('- ') },
    { icon: <Quote size={13} />, label: 'Blockquote (> )', run: () => applyLinePrefix('> ') }
  ];

  return (
    <div className="solis-md-toolbar" role="toolbar" aria-label="Markdown formatting">
      {actions.map((a) => (
        <button
          key={a.label}
          type="button"
          className="solis-md-toolbar__btn tactile-press"
          onClick={a.run}
          disabled={disabled}
          title={a.label}
          aria-label={a.label}
        >
          {a.icon}
        </button>
      ))}
    </div>
  );
};
