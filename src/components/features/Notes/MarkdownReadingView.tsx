import React, { useState } from 'react';
import {
  Copy,
  Check,
  Info,
  Key,
  Sparkles,
  AlertTriangle,
  FileCode,
  CheckSquare,
  Square
} from 'lucide-react';
import { parseMarkdownBlocks } from '../../../utils/notes/markdownParser';
import './MarkdownReadingView.css';

export interface MarkdownReadingViewProps {
  content: string;
  className?: string;
  onToggleTask?: (taskIndex: number, completed: boolean) => void;
}

/**
 * Safely renders inline markdown elements: links, bold, italic, code, math, and tags.
 */
function renderInlineContent(text: string): React.ReactNode[] {
  // Regex splitting by: [link](url), **bold**, *italic*, `code`, $math$, #tag
  const tokenRegex = /(\[[^\]]+\]\([^)]+\)|\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`|\$[^$]+\$|#[a-zA-Z0-9_-]+)/g;
  const parts = text.split(tokenRegex);

  return parts.map((part, idx) => {
    if (!part) return null;

    if (part.startsWith('[') && part.endsWith(')')) {
      const linkMatch = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (linkMatch) {
        return (
          <a
            key={idx}
            href={linkMatch[2]}
            target="_blank"
            rel="noopener noreferrer"
            className="solis-markdown-link"
          >
            {linkMatch[1]}
          </a>
        );
      }
    }

    if (part.startsWith('**') && part.endsWith('**') && part.length > 4) {
      return <strong key={idx} style={{ fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    if (part.startsWith('*') && part.endsWith('*') && part.length > 2) {
      return <em key={idx} style={{ fontStyle: 'italic' }}>{part.slice(1, -1)}</em>;
    }
    if (part.startsWith('`') && part.endsWith('`') && part.length > 2) {
      return <code key={idx} className="solis-markdown-inline-code">{part.slice(1, -1)}</code>;
    }
    if (part.startsWith('$') && part.endsWith('$') && part.length > 2) {
      return <span key={idx} className="solis-markdown-math-inline">{part.slice(1, -1)}</span>;
    }
    if (part.startsWith('#') && part.length > 1) {
      return <span key={idx} className="solis-markdown-inline-tag">{part}</span>;
    }

    return <React.Fragment key={idx}>{part}</React.Fragment>;
  });
}

export const MarkdownReadingView: React.FC<MarkdownReadingViewProps> = ({
  content,
  className = '',
  onToggleTask
}) => {
  const blocks = parseMarkdownBlocks(content);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopyCode = async (code: string, index: number) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch {
      // Fallback
    }
  };

  if (!content || !content.trim()) {
    return (
      <div className={`solis-markdown-view ${className}`} style={{ opacity: 0.5, fontStyle: 'italic' }}>
        No content written yet. Switch to Edit Mode to begin distilling thoughts.
      </div>
    );
  }

  return (
    <div className={`solis-markdown-view ${className}`}>
      {blocks.map((block, idx) => {
        switch (block.type) {
          case 'heading': {
            if (block.level === 1) return <h1 key={idx} className="solis-markdown-h1">{block.content}</h1>;
            if (block.level === 2) return <h2 key={idx} className="solis-markdown-h2">{block.content}</h2>;
            return <h3 key={idx} className="solis-markdown-h3">{block.content}</h3>;
          }

          case 'callout': {
            const calloutType = block.calloutType || 'NOTE';
            const Icon =
              calloutType === 'THEOREM' ? Sparkles :
              calloutType === 'KEY' || calloutType === 'INSIGHT' ? Key :
              calloutType === 'WARNING' ? AlertTriangle : Info;

            return (
              <div key={idx} className={`solis-markdown-callout solis-markdown-callout--${calloutType}`}>
                <div className="solis-markdown-callout__icon">
                  <Icon size={16} />
                </div>
                <div className="solis-markdown-callout__content">
                  <div className="solis-markdown-callout__tag">{calloutType}</div>
                  {block.calloutTitle && (
                    <div className="solis-markdown-callout__title">
                      {renderInlineContent(block.calloutTitle)}
                    </div>
                  )}
                  {block.content && (
                    <div className="solis-markdown-callout__body">
                      {renderInlineContent(block.content)}
                    </div>
                  )}
                </div>
              </div>
            );
          }

          case 'code_block': {
            const isCopied = copiedIndex === idx;
            return (
              <div key={idx} className="solis-markdown-code-block">
                <div className="solis-markdown-code-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileCode size={13} />
                    <span>{block.language || 'code'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleCopyCode(block.content, idx)}
                    style={{
                      background: 'none',
                      border: 'none',
                      color: isCopied ? 'var(--color-sage-400, #85B392)' : 'rgba(255, 255, 255, 0.6)',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '4px',
                      fontSize: '11px'
                    }}
                    title="Copy code to clipboard"
                  >
                    {isCopied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{isCopied ? 'Copied' : 'Copy'}</span>
                  </button>
                </div>
                <pre className="solis-markdown-code-content">
                  <code>{block.content}</code>
                </pre>
              </div>
            );
          }

          case 'math_block': {
            return (
              <div key={idx} className="solis-markdown-math-block">
                <span>$$ {block.content} $$</span>
              </div>
            );
          }

          case 'blockquote': {
            return (
              <blockquote key={idx} className="solis-markdown-blockquote">
                {renderInlineContent(block.content)}
              </blockquote>
            );
          }

          case 'task_item': {
            const taskIdx = block.taskIndex !== undefined ? block.taskIndex : idx;
            return (
              <div key={idx} className="solis-markdown-task">
                <button
                  type="button"
                  onClick={() => onToggleTask && onToggleTask(taskIdx, !block.completed)}
                  style={{ background: 'none', border: 'none', padding: 0, cursor: onToggleTask ? 'pointer' : 'default', display: 'flex', alignItems: 'center' }}
                  aria-label={block.completed ? 'Completed task' : 'Incomplete task'}
                >
                  {block.completed ? (
                    <CheckSquare size={16} color="var(--color-coral-500)" />
                  ) : (
                    <Square size={16} color="var(--text-muted)" />
                  )}
                </button>
                <span style={{ textDecoration: block.completed ? 'line-through' : 'none', color: block.completed ? 'var(--text-muted)' : 'var(--text-primary)' }}>
                  {renderInlineContent(block.content)}
                </span>
              </div>
            );
          }

          case 'numbered_item': {
            return (
              <div key={idx} className="solis-markdown-numbered-item">
                <span className="solis-markdown-list-num">{block.orderNumber ?? 1}.</span>
                <span style={{ flex: 1, lineHeight: '1.6' }}>{renderInlineContent(block.content)}</span>
              </div>
            );
          }

          case 'bullet_item': {
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', margin: '4px 0' }}>
                <span style={{ color: 'var(--color-coral-500)', fontSize: '14px', lineHeight: '1.6' }}>•</span>
                <span style={{ flex: 1, lineHeight: '1.6' }}>{renderInlineContent(block.content)}</span>
              </div>
            );
          }

          case 'thematic_break': {
            return <hr key={idx} style={{ border: 'none', borderTop: '1px solid var(--border-subtle)', margin: '24px 0' }} />;
          }

          case 'paragraph':
          default: {
            return (
              <p key={idx} className="solis-markdown-p">
                {renderInlineContent(block.content)}
              </p>
            );
          }
        }
      })}
    </div>
  );
};
