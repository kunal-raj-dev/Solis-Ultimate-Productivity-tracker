import React from 'react';
import { FileText } from 'lucide-react';

export interface WikiLinkAutocompleteProps {
  /** Note titles matching the current `[[` draft query. */
  suggestions: Array<{ id: string; title: string }>;
  /** Index of the highlighted suggestion (keyboard-driven). */
  highlightIndex: number;
  /** Vertical offset (px) from the top of the textarea wrapper to the caret line. */
  top: number;
  onSelect: (title: string) => void;
}

/**
 * Phase 2 (P2.1) — `[[` wiki-link autocomplete dropdown for the note editor.
 * Purely presentational: keyboard handling lives with the textarea's keydown.
 */
export const WikiLinkAutocomplete: React.FC<WikiLinkAutocompleteProps> = ({
  suggestions,
  highlightIndex,
  top,
  onSelect
}) => {
  if (suggestions.length === 0) return null;
  return (
    <div
      className="solis-wikilink-autocomplete"
      style={{ top: Math.max(0, top) }}
      role="listbox"
      aria-label="Wiki-link suggestions"
    >
      {suggestions.slice(0, 6).map((s, i) => (
        <button
          key={s.id}
          type="button"
          role="option"
          aria-selected={i === highlightIndex}
          className={`solis-wikilink-autocomplete__item ${
            i === highlightIndex ? 'solis-wikilink-autocomplete__item--active' : ''
          }`}
          // onMouseDown (not onClick) so the textarea keeps focus.
          onMouseDown={(e) => {
            e.preventDefault();
            onSelect(s.title);
          }}
        >
          <FileText size={12} />
          <span className="solis-wikilink-autocomplete__title">{s.title}</span>
        </button>
      ))}
    </div>
  );
};
