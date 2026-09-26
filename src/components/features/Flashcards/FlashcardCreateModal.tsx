import React, { useState, useEffect } from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Textarea } from '../../ui/Textarea/Textarea';
import { CustomSelect } from '../../ui/Select/CustomSelect';
import { StudySubject, StudyTopic } from '../../../types/study';
import { CardType, ImageOcclusionZone } from '../../../types/learning';
import { parseClozeSyntax } from '../../../utils/learning/spacedRepetition';
import { ImageOcclusionDrawer, DIAGRAM_PRESETS } from './ImageOcclusionDrawer';
import { Plus, Image as ImageIcon, Type } from 'lucide-react';

export interface FlashcardCreateModalProps {
  isOpen: boolean;
  onClose: () => void;
  subjects: StudySubject[];
  topics: StudyTopic[];
  defaultSubjectId?: string;
  defaultTopicId?: string;
  defaultNoteId?: string;
  defaultPrompt?: string;
  defaultAnswer?: string;
  onCreateCard: (card: {
    subjectId: string;
    topicId?: string;
    noteId?: string;
    frontPrompt: string;
    backAnswer: string;
    cardType: CardType;
    imageUrl?: string;
    occlusionZones?: ImageOcclusionZone[];
    activeOcclusionZoneId?: string;
  }) => Promise<void>;
}

export const FlashcardCreateModal: React.FC<FlashcardCreateModalProps> = ({
  isOpen,
  onClose,
  subjects,
  topics,
  defaultSubjectId,
  defaultTopicId,
  defaultNoteId,
  defaultPrompt = '',
  defaultAnswer = '',
  onCreateCard
}) => {
  const [subjectId, setSubjectId] = useState(defaultSubjectId || '');
  const [topicId, setTopicId] = useState(defaultTopicId || '');
  const [cardType, setCardType] = useState<CardType>('standard');
  const [frontPrompt, setFrontPrompt] = useState(defaultPrompt);
  const [backAnswer, setBackAnswer] = useState(defaultAnswer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [occlusionData, setOcclusionData] = useState<{
    imageUrl: string;
    occlusionZones: ImageOcclusionZone[];
    activeOcclusionZoneId: string;
  }>({
    imageUrl: DIAGRAM_PRESETS[0].url,
    occlusionZones: DIAGRAM_PRESETS[0].defaultZones,
    activeOcclusionZoneId: DIAGRAM_PRESETS[0].defaultZones[0]?.id || ''
  });

  useEffect(() => {
    if (isOpen) {
      setSubjectId(defaultSubjectId || (subjects[0]?.id ?? ''));
      setTopicId(defaultTopicId || '');
      setFrontPrompt(defaultPrompt);
      setBackAnswer(defaultAnswer);
      setCardType('standard');
    }
  }, [isOpen, defaultSubjectId, defaultTopicId, defaultPrompt, defaultAnswer, subjects]);

  const subjectOptions = subjects.map((s) => ({ value: s.id, label: s.name }));
  const filteredTopics = topics.filter((t) => !subjectId || t.subjectId === subjectId);
  const topicOptions = [
    { value: '', label: 'General / No specific topic' },
    ...filteredTopics.map((t) => ({ value: t.id, label: t.title }))
  ];

  const clozeResult = parseClozeSyntax(frontPrompt);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subjectId) return;

    setIsSubmitting(true);
    try {
      if (cardType === 'image_occlusion') {
        if (occlusionData.occlusionZones.length === 0) return;
        const targetZone =
          occlusionData.occlusionZones.find((z) => z.id === occlusionData.activeOcclusionZoneId) ||
          occlusionData.occlusionZones[0];
        const targetAnswer = targetZone?.label?.trim() || backAnswer.trim() || 'Occluded Diagram Region';
        const prompt = frontPrompt.trim() || 'Identify the masked diagram region [?]';

        await onCreateCard({
          subjectId,
          topicId: topicId || undefined,
          noteId: defaultNoteId,
          frontPrompt: prompt,
          backAnswer: targetAnswer,
          cardType: 'image_occlusion',
          imageUrl: occlusionData.imageUrl,
          occlusionZones: occlusionData.occlusionZones,
          activeOcclusionZoneId: targetZone?.id
        });
        onClose();
        return;
      }

      if (!frontPrompt.trim() || (!backAnswer.trim() && !clozeResult.hasCloze)) return;

      const resolvedAnswer = clozeResult.hasCloze ? clozeResult.extractedAnswers.join(', ') : backAnswer;
      const resolvedType: CardType = clozeResult.hasCloze ? 'cloze' : cardType;

      await onCreateCard({
        subjectId,
        topicId: topicId || undefined,
        noteId: defaultNoteId,
        frontPrompt: frontPrompt.trim(),
        backAnswer: resolvedAnswer.trim(),
        cardType: resolvedType
      });
      onClose();
    } catch (err) {
      console.error('Failed to create flashcard:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Create Active Recall Flashcard">
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        <CustomSelect
          label="Study Subject"
          value={subjectId}
          onChange={(val) => {
            setSubjectId(val);
            setTopicId('');
          }}
          options={subjectOptions}
        />

        <CustomSelect
          label="Syllabus Topic Context (Optional)"
          value={topicId}
          onChange={setTopicId}
          options={topicOptions}
        />

        {/* Card Format Selector */}
        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 500, marginBottom: '6px' }}>
            Flashcard Architecture
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setCardType('standard')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: cardType !== 'image_occlusion' ? '1.5px solid var(--color-coral-500)' : '1px solid var(--border-subtle)',
                background: cardType !== 'image_occlusion' ? 'rgba(235, 94, 40, 0.08)' : 'var(--bg-surface-secondary)',
                color: cardType !== 'image_occlusion' ? 'var(--color-coral-500)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 'var(--text-caption)'
              }}
            >
              <Type size={15} />
              <span>Text & Cloze</span>
            </button>

            <button
              type="button"
              onClick={() => setCardType('image_occlusion')}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                padding: '8px 12px',
                borderRadius: 'var(--radius-sm)',
                border: cardType === 'image_occlusion' ? '1.5px solid var(--color-coral-500)' : '1px solid var(--border-subtle)',
                background: cardType === 'image_occlusion' ? 'rgba(235, 94, 40, 0.08)' : 'var(--bg-surface-secondary)',
                color: cardType === 'image_occlusion' ? 'var(--color-coral-500)' : 'var(--text-secondary)',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: 'var(--text-caption)'
              }}
            >
              <ImageIcon size={15} />
              <span>Image Occlusion</span>
            </button>
          </div>
        </div>

        {cardType === 'image_occlusion' ? (
          <ImageOcclusionDrawer
            initialImageUrl={occlusionData.imageUrl}
            initialZones={occlusionData.occlusionZones}
            initialActiveZoneId={occlusionData.activeOcclusionZoneId}
            onChange={setOcclusionData}
          />
        ) : (
          <>
            <div>
              <label style={{ display: 'block', fontSize: 'var(--text-body-sm)', fontWeight: 500, marginBottom: '6px' }}>
                Prompt / Question (Use <code style={{ color: 'var(--color-coral-500)' }}>&#123;&#123;hidden answer&#125;&#125;</code> for cloze)
              </label>
              <Textarea
                placeholder="e.g. In Raft, a candidate wins an election with a {{majority}} of cluster votes."
                value={frontPrompt}
                onChange={(e) => setFrontPrompt(e.target.value)}
                rows={3}
                required
              />
            </div>

            {clozeResult.hasCloze ? (
              <div style={{ padding: '10px 14px', backgroundColor: 'var(--bg-surface-secondary)', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-subtle)' }}>
                <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Cloze Blank Preview
                </span>
                <p style={{ marginTop: '4px', fontSize: 'var(--text-body-sm)' }}>
                  {clozeResult.promptText}
                </p>
                <p style={{ fontSize: 'var(--text-caption)', color: 'var(--color-sage-600)', marginTop: '4px' }}>
                  Extracted Answer: <strong>{clozeResult.extractedAnswers.join(', ')}</strong>
                </p>
              </div>
            ) : (
              <Input
                label="Active Recall Answer"
                placeholder="e.g. The Leader Completeness Property"
                value={backAnswer}
                onChange={(e) => setBackAnswer(e.target.value)}
                required={!clozeResult.hasCloze}
              />
            )}
          </>
        )}

        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 'var(--space-sm)', marginTop: 'var(--space-md)' }}>
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" isLoading={isSubmitting} leftIcon={<Plus size={16} />}>
            Create Flashcard
          </Button>
        </div>
      </form>
    </Modal>
  );
};
