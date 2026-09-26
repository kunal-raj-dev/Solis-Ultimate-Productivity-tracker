import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, RotateCcw, FileText, CheckCircle2, Plus } from 'lucide-react';
import { Badge } from '../../ui/Badge/Badge';
import { Button } from '../../ui/Button/Button';
import { Note } from '../../../types/note';
import { calculateResurfacedNote, getResurfacingBadgeLabel } from '../../../utils/notes/resurfacing';
import './KnowledgeResurfacingCard.css';

export interface KnowledgeResurfacingCardProps {
  notes: Note[];
}

export const KnowledgeResurfacingCard: React.FC<KnowledgeResurfacingCardProps> = ({ notes }) => {
  const navigate = useNavigate();

  // Find 1 note that is oldest or has not been updated recently to combat forgetting curve
  const resurfacedNote = useMemo(() => {
    return calculateResurfacedNote(notes);
  }, [notes]);

  if (!notes || notes.length === 0) {
    return (
      <div className="solis-empty-stub">
        <FileText size={20} className="solis-empty-stub-icon" aria-hidden="true" />
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>No Concept Notes Archived</span>
        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', maxWidth: '360px' }}>
          Capture synthesis notes as you study to enable spaced resurfacing and long-term retention.
        </span>
        <Button
          variant="subtle"
          size="sm"
          leftIcon={<Plus size={13} />}
          onClick={() => navigate('/app/notes?action=new')}
        >
          Create First Note
        </Button>
      </div>
    );
  }

  if (resurfacedNote) {
    const { note, daysSince } = resurfacedNote;
    return (
      <div className="solis-resurface-container">
        <div className="solis-resurface-box">
          <div className="solis-resurface-meta">
            <div className="solis-resurface-meta__left">
              <RotateCcw size={13} color="var(--accent-terracotta)" aria-hidden="true" />
              <span>Spaced Recall Concept</span>
            </div>
            <Badge variant="neutral" style={{ fontSize: '11px' }}>
              {getResurfacingBadgeLabel(daysSince)}
            </Badge>
          </div>

          <h4 className="solis-resurface-title">
            {note.title || 'Untitled Concept'}
          </h4>

          <p className="solis-resurface-snippet">
            {note.content || 'Tap review to reinforce this foundational concept before retention decays.'}
          </p>

          <div className="solis-resurface-actions">
            <Button
              variant="subtle"
              size="sm"
              rightIcon={<ArrowRight size={13} />}
              onClick={() => navigate(`/app/notes?q=${encodeURIComponent(note.title)}`)}
            >
              Review Concept
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="solis-empty-stub">
      <CheckCircle2 size={20} color="var(--status-success)" aria-hidden="true" />
      <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>Knowledge Base Synchronized</span>
      <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', maxWidth: '360px' }}>
        {notes.length} {notes.length === 1 ? 'concept note' : 'concept notes'} retained. Foundational ideas remain fresh in active memory.
      </span>
      <Button
        variant="subtle"
        size="sm"
        onClick={() => navigate('/app/notes')}
      >
        Open Notes Studio
      </Button>
    </div>
  );
};
