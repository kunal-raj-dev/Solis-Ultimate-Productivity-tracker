import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RotateCcw } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../../ui/Card/Card';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { Note } from '../../../types/note';
import { calculateResurfacedNote, getResurfacingBadgeLabel } from '../../../utils/notes/resurfacing';

interface KnowledgeResurfacingCardProps {
  notes: Note[];
}

export const KnowledgeResurfacingCard: React.FC<KnowledgeResurfacingCardProps> = ({ notes }) => {
  const navigate = useNavigate();

  // Find 1-2 notes that are older than 7 days, or have not been updated recently to combat forgetting curve
  const resurfacedNote = useMemo(() => {
    return calculateResurfacedNote(notes);
  }, [notes]);

  if (!resurfacedNote) return null;

  const { note, daysSince } = resurfacedNote;

  return (
    <Card className="solis-resurfacing-card" style={{ marginBottom: '20px', border: '1px solid var(--border-subtle)', background: 'var(--bg-surface-secondary)' }}>
      <CardHeader style={{ paddingBottom: '8px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <RotateCcw size={16} color="var(--color-lavender-500)" />
            <CardTitle style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600 }}>Daily Knowledge Resurfacing</CardTitle>
          </div>
          <Badge variant="neutral" style={{ fontSize: '11px' }}>
            {getResurfacingBadgeLabel(daysSince)}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px' }}>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: '0 0 4px 0', fontSize: 'var(--text-body-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
              {note.title || 'Untitled Thought'}
            </h4>
            <p style={{ margin: 0, fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
              {note.content || 'Tap to review this foundational concept before recall degrades.'}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            rightIcon={<ArrowRight size={14} />}
            onClick={() => navigate(`/app/notes?q=${encodeURIComponent(note.title)}`)}
          >
            Review
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
