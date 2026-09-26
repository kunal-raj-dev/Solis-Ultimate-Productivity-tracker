import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/feedback/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import {
  aiService,
  GroundedFlashcard,
  GroundedGenerationSource
} from '../../../services/ai/ai.service';
import { useToast } from '../../../context/ToastContext';
import { Sparkles, Save, BookOpen } from 'lucide-react';
import { dataService } from '../../../services/dataService';

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  noteContent: string;
  subjectId: string;
  topicId?: string;
  noteId?: string;
  /**
   * Plan §8.2: clicking a card's citation chip jumps back to the exact note
   * paragraph (`sourceLineIndex`). Wired by NotesPage to the editor scroller.
   */
  onCitationClick?: (sourceLineIndex: number) => void;
}

const SOURCE_LABELS: Record<GroundedGenerationSource, string> = {
  solis_edge_proxy: 'Generated via the Solis secure AI proxy — every card cites its source paragraph.',
  gemini_direct: 'Generated with your Gemini session key — every card cites its source paragraph.',
  deterministic: 'Extracted from your note structure deterministically — every card cites its source paragraph.'
};

export const AIGenerationModal: React.FC<AIGenerationModalProps> = ({
  isOpen,
  onClose,
  noteTitle,
  noteContent,
  subjectId,
  topicId,
  noteId,
  onCitationClick
}) => {
  const { addToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<GroundedFlashcard[]>([]);
  const [generationSource, setGenerationSource] = useState<GroundedGenerationSource | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Review P8F6: cards belong to the note they were generated from. Clear
  // them whenever the modal opens/closes or the active note changes, so
  // "Save All" can never file note A's cards under note B's subject/note and
  // citation chips can never jump into the wrong note.
  useEffect(() => {
    setGeneratedCards([]);
    setGenerationSource(null);
  }, [noteId, isOpen]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedCards([]);
    setGenerationSource(null);
    try {
      // Plan §8.2: grounded generation — edge proxy → direct key →
      // deterministic extraction. Cards are always chunk-cited; nothing is
      // simulated when a tier is unavailable.
      const result = await aiService.generateGroundedFlashcards(
        noteId || 'unsaved-note',
        noteTitle,
        noteContent,
        3
      );

      if (result.cards.length === 0) {
        addToast({
          title: 'Nothing to Extract Yet',
          description: 'This note has no extractable content yet — write a little more and try again.',
          type: 'info'
        });
      } else {
        setGeneratedCards(result.cards);
        setGenerationSource(result.source);
        if (result.source === 'deterministic') {
          addToast({
            title: 'Algorithmic Flashcards',
            description: `Extracted ${result.cards.length} flashcard(s) strictly from your note (no AI key needed).`,
            type: 'info'
          });
        }
      }
    } catch (err: any) {
      // Honest failure: surface the error, never fabricate cards.
      addToast({
        title: 'Generation Failed',
        description: err?.message || 'Could not generate flashcards from this note.',
        type: 'error'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveAll = async () => {
    if (generatedCards.length === 0) return;
    setIsSaving(true);
    try {
      for (const card of generatedCards) {
        await dataService.flashcards.createFlashcard({
          subjectId,
          topicId,
          noteId,
          frontPrompt: card.front,
          backAnswer: card.back,
          cardType: card.type
        });
      }
      addToast({ title: 'Flashcards Saved', description: `Saved ${generatedCards.length} grounded flashcards.`, type: 'success' });
      onClose();
    } catch (err: any) {
      addToast({ title: 'Save Failed', description: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Generate Flashcards: ${noteTitle}`}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <p style={{ fontSize: 'var(--text-body-sm)', color: 'var(--text-secondary)', margin: 0 }}>
          Solis generates active-recall flashcards grounded strictly in this note. Every card carries a
          citation chip linking back to the exact paragraph it came from.
        </p>

        {generatedCards.length === 0 && !isGenerating && (
          <Button variant="accent" onClick={handleGenerate} leftIcon={<Sparkles size={16} />}>
            Generate 3 Grounded Flashcards
          </Button>
        )}

        {isGenerating && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Sparkles size={24} className="spin-animation" style={{ marginBottom: '10px' }} />
            <p>Analyzing note content and generating flashcards...</p>
          </div>
        )}

        {generationSource && generatedCards.length > 0 && (
          <p
            role="status"
            style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)', margin: 0 }}
          >
            {SOURCE_LABELS[generationSource]}
          </p>
        )}

        {generatedCards.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: 0, fontSize: 'var(--text-body-sm)' }}>Generated Flashcards</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              {generatedCards.map((c, i) => (
                <div key={`${c.sourceChunkId}-${i}`} style={{ padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-secondary)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', marginBottom: '4px' }}>
                    <span style={{ fontSize: 'var(--text-micro)', color: 'var(--color-coral-500)', textTransform: 'uppercase' }}>
                      Type: {c.type}
                    </span>
                    {typeof c.sourceLineIndex === 'number' && (
                      <button
                        type="button"
                        onClick={() => onCitationClick?.(c.sourceLineIndex as number)}
                        title={c.sourceExcerpt ? `Source paragraph: "${c.sourceExcerpt}"` : 'Jump to the source paragraph in this note'}
                        aria-label={`Cite source: jump to note line ${(c.sourceLineIndex ?? 0) + 1}`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '4px',
                          border: '1px solid var(--border-subtle)',
                          borderRadius: 'var(--radius-full)',
                          background: 'var(--bg-surface-primary)',
                          color: 'var(--color-lavender-500, #6366F1)',
                          cursor: 'pointer',
                          fontSize: 'var(--text-micro)',
                          padding: '2px 8px',
                          flexShrink: 0
                        }}
                      >
                        <BookOpen size={10} />
                        ¶ Line {(c.sourceLineIndex ?? 0) + 1}
                      </button>
                    )}
                  </div>
                  <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, marginBottom: '4px' }}>
                    Q: {c.front}
                  </div>
                  <div style={{ fontSize: 'var(--text-body-sm)' }}>
                    A: {c.back}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '10px' }}>
              <Button variant="outline" onClick={handleGenerate} disabled={isSaving}>Regenerate</Button>
              <Button variant="primary" onClick={handleSaveAll} isLoading={isSaving} leftIcon={<Save size={16} />}>
                Save All to {subjectId ? 'Subject' : 'General'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </Modal>
  );
};
