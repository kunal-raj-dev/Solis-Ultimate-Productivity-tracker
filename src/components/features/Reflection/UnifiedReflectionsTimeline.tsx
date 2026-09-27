import React, { useMemo } from 'react';
import { Moon, Brain, NotebookPen } from 'lucide-react';
import { DailyReflection } from '../../../types/reflection';
import { Note } from '../../../types/note';

export interface UnifiedReflectionsTimelineProps {
  reflections: DailyReflection[];
  notes: Note[];
  maxItems?: number;
}

interface UnifiedItem {
  id: string;
  kind: 'evening_closure' | 'weekly_review' | 'drift_pad';
  title: string;
  excerpt?: string;
  at: string;
}

const KIND_META: Record<UnifiedItem['kind'], { icon: React.ReactNode; label: string }> = {
  evening_closure: { icon: <Moon size={12} />, label: 'Evening closure' },
  weekly_review: { icon: <NotebookPen size={12} />, label: 'Weekly review' },
  drift_pad: { icon: <Brain size={12} />, label: 'Drift pad' }
};

/**
 * V2 Phase 1 (P1-15/C6) — the unified reflections read-model.
 *
 * V1 scattered reflection across three silences: evening closures (reflections
 * collection), weekly reviews (notes tagged weekly-review), and drift-pad
 * thoughts (notes/tasks tagged focus-drift) that were "preserved in system"
 * but had no reader. This timeline merges them into one honest strip.
 */
export const UnifiedReflectionsTimeline: React.FC<UnifiedReflectionsTimelineProps> = ({
  reflections,
  notes,
  maxItems = 8
}) => {
  const items = useMemo<UnifiedItem[]>(() => {
    const merged: UnifiedItem[] = [];

    for (const r of reflections) {
      if (!r.date) continue;
      merged.push({
        id: `refl-${r.id ?? r.date}`,
        kind: 'evening_closure',
        title: 'Evening closure',
        excerpt:
          (r.wins && r.wins.length > 0 && r.wins[0]) ||
          (r.synthesisNotes ? r.synthesisNotes.slice(0, 120) : undefined),
        at: r.date
      });
    }
    for (const n of notes) {
      const tags = n.tags || [];
      if (tags.includes('weekly-review')) {
        merged.push({
          id: `wr-${n.id}`,
          kind: 'weekly_review',
          title: n.title,
          excerpt: n.content ? n.content.replace(/[#*\n]/g, ' ').slice(0, 120) : undefined,
          at: n.createdAt || n.updatedAt || ''
        });
      } else if (tags.includes('focus-drift')) {
        merged.push({
          id: `drift-${n.id}`,
          kind: 'drift_pad',
          title: n.title,
          excerpt: n.content ? n.content.slice(0, 120) : undefined,
          at: n.createdAt || n.updatedAt || ''
        });
      }
    }

    return merged
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, maxItems);
  }, [reflections, notes, maxItems]);

  if (items.length === 0) {
    return (
      <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
        Reflections — evening closures, weekly reviews, and drift-pad thoughts — appear here
        as one timeline once you record them.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
      {items.map((item) => {
        const meta = KIND_META[item.kind];
        return (
          <div
            key={item.id}
            style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '10px',
              padding: '8px 10px',
              borderRadius: 'var(--radius-md)',
              background: 'var(--bg-surface-secondary)',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                flexShrink: 0,
                fontSize: '10px',
                fontWeight: 600,
                color: 'var(--color-lavender-500, #8b7bd8)',
                paddingTop: '2px'
              }}
            >
              {meta.icon}
              {meta.label}
            </span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 'var(--text-body-sm)',
                  fontWeight: 600,
                  color: 'var(--text-primary)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap'
                }}
              >
                {item.title}
              </div>
              {item.excerpt && (
                <div
                  style={{
                    fontSize: 'var(--text-caption)',
                    color: 'var(--text-secondary)',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                >
                  {item.excerpt}
                </div>
              )}
            </div>
            <span
              style={{
                flexShrink: 0,
                fontSize: '10px',
                color: 'var(--text-muted)',
                paddingTop: '2px'
              }}
            >
              {item.at}
            </span>
          </div>
        );
      })}
    </div>
  );
};
