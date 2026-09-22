import React, { useState } from 'react';
import { Modal } from '../../../components/feedback/Modal/Modal';
import { Button } from '../../../components/ui/Button/Button';
import { aiService } from '../../../services/ai/ai.service';
import { useToast } from '../../../context/ToastContext';
import { Sparkles, Save } from 'lucide-react';
import { dataService } from '../../../services/dataService';

interface AIGenerationModalProps {
  isOpen: boolean;
  onClose: () => void;
  noteTitle: string;
  noteContent: string;
  subjectId: string;
  topicId?: string;
  noteId?: string;
}

export const AIGenerationModal: React.FC<AIGenerationModalProps> = ({
  isOpen,
  onClose,
  noteTitle,
  noteContent,
  subjectId,
  topicId,
  noteId
}) => {
  const { addToast } = useToast();
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCards, setGeneratedCards] = useState<any[]>([]);
  const [isSaving, setIsSaving] = useState(false);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setGeneratedCards([]);
    try {
      const cards = await aiService.generateFlashcards(noteContent, 3);
      setGeneratedCards(cards);
    } catch (err: any) {
      addToast({ title: 'AI Generation Failed', description: err.message, type: 'error' });
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
      addToast({ title: 'Flashcards Saved', description: `Saved ${generatedCards.length} AI-generated flashcards.`, type: 'success' });
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
          Solis Intelligence will analyze this note and generate high-yield active recall flashcards.
        </p>

        {generatedCards.length === 0 && !isGenerating && (
          <Button variant="accent" onClick={handleGenerate} leftIcon={<Sparkles size={16} />}>
            Generate 3 Flashcards
          </Button>
        )}

        {isGenerating && (
          <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-secondary)' }}>
            <Sparkles size={24} className="spin-animation" style={{ marginBottom: '10px' }} />
            <p>Analyzing note content and generating flashcards...</p>
          </div>
        )}

        {generatedCards.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            <h4 style={{ margin: 0, fontSize: 'var(--text-body-sm)' }}>Generated Flashcards</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxHeight: '300px', overflowY: 'auto' }}>
              {generatedCards.map((c, i) => (
                <div key={i} style={{ padding: '12px', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-sm)', background: 'var(--bg-surface-secondary)' }}>
                  <div style={{ fontSize: 'var(--text-micro)', color: 'var(--color-coral-500)', marginBottom: '4px', textTransform: 'uppercase' }}>
                    Type: {c.type}
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
