import React, { useMemo } from 'react';
import { X, Network } from 'lucide-react';
import { Note } from '../../../types/note';
import { extractWikilinks } from '../../../utils/notes/wikilinks';

export interface KnowledgeGraphProps {
  notes: Note[];
  onOpenNote: (noteId: string) => void;
  onClose: () => void;
}

interface GraphNode {
  id: string;
  title: string;
  degree: number;
  x: number;
  y: number;
}

interface GraphEdge {
  from: number;
  to: number;
}

/**
 * Phase 2 (P2.6) — knowledge graph visualization.
 * Nodes are notes (sized by connection count), edges are `[[wiki-links]]`
 * resolved against note titles. Deterministic circular layout — no physics,
 * no external graph library, fully navigable.
 */
export const KnowledgeGraph: React.FC<KnowledgeGraphProps> = ({ notes, onOpenNote, onClose }) => {
  const graph = useMemo(() => {
    const capped = notes.slice(0, 80);
    const titleToIndex = new Map<string, number>();
    capped.forEach((n, i) => {
      if (n.title) titleToIndex.set(n.title.trim().toLowerCase(), i);
    });

    const degree = new Array(capped.length).fill(0);
    const edges: GraphEdge[] = [];
    capped.forEach((n, i) => {
      if (!n.content) return;
      const seen = new Set<number>();
      for (const link of extractWikilinks(n.content)) {
        const j = titleToIndex.get(link.target.toLowerCase());
        if (j === undefined || j === i || seen.has(j)) continue;
        seen.add(j);
        edges.push({ from: i, to: j });
        degree[i] += 1;
        degree[j] += 1;
      }
    });

    // Deterministic two-ring circular layout: connected notes inner, lonely outer.
    const connected = capped.map((_, i) => i).filter((i) => degree[i] > 0);
    const lonely = capped.map((_, i) => i).filter((i) => degree[i] === 0);
    const nodes: GraphNode[] = new Array(capped.length);
    const cx = 300;
    const cy = 280;

    const placeRing = (ids: number[], radius: number) => {
      ids.forEach((idx, k) => {
        const angle = (k / Math.max(1, ids.length)) * 2 * Math.PI - Math.PI / 2;
        nodes[idx] = {
          id: capped[idx].id,
          title: capped[idx].title || 'Untitled Note',
          degree: degree[idx],
          x: cx + radius * Math.cos(angle),
          y: cy + radius * Math.sin(angle)
        };
      });
    };

    placeRing(connected, connected.length > 0 ? 190 : 0);
    placeRing(lonely, 250);

    return { nodes, edges, count: capped.length };
  }, [notes]);

  const connectedCount = graph.nodes.filter((n) => n && n.degree > 0).length;

  return (
    <div className="solis-knowledge-graph" role="dialog" aria-label="Knowledge graph">
      <div className="solis-knowledge-graph__header">
        <Network size={16} />
        <span>Knowledge Graph</span>
        <span className="solis-knowledge-graph__meta">
          {graph.count} notes · {graph.edges.length} links · {connectedCount} connected
        </span>
        <button
          type="button"
          className="solis-knowledge-graph__close tactile-press"
          onClick={onClose}
          aria-label="Close knowledge graph"
        >
          <X size={15} />
        </button>
      </div>

      {graph.count === 0 ? (
        <p className="solis-knowledge-graph__empty">
          Create notes and connect them with [[wiki-links]] to see your knowledge graph.
        </p>
      ) : (
        <svg
          viewBox="0 0 600 560"
          className="solis-knowledge-graph__svg"
          role="img"
          aria-label="Graph of notes connected by wiki-links"
        >
          {graph.edges.map((e, i) => {
            const a = graph.nodes[e.from];
            const b = graph.nodes[e.to];
            if (!a || !b) return null;
            return (
              <line
                key={i}
                x1={a.x}
                y1={a.y}
                x2={b.x}
                y2={b.y}
                className="solis-knowledge-graph__edge"
              />
            );
          })}
          {graph.nodes.map((n) =>
            n ? (
              <g
                key={n.id}
                className={`solis-knowledge-graph__node ${n.degree > 0 ? 'solis-knowledge-graph__node--connected' : ''}`}
                onClick={() => onOpenNote(n.id)}
                tabIndex={0}
                role="button"
                aria-label={`Open note ${n.title}`}
                onKeyDown={(ev) => {
                  if (ev.key === 'Enter') onOpenNote(n.id);
                }}
              >
                <circle
                  cx={n.x}
                  cy={n.y}
                  r={6 + Math.min(6, n.degree * 1.5)}
                />
                <text x={n.x} y={n.y + 16 + Math.min(6, n.degree * 1.5)} textAnchor="middle">
                  {n.title.length > 18 ? `${n.title.slice(0, 17)}…` : n.title}
                </text>
              </g>
            ) : null
          )}
        </svg>
      )}
      <p className="solis-knowledge-graph__hint">
        Node size reflects connections. Click any node to open the note. Link notes by typing [[title]] in the editor.
      </p>
    </div>
  );
};
