import React, { useState, useEffect } from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Textarea } from '../../ui/Textarea/Textarea';
import { CustomSelect } from '../../ui/Select/CustomSelect';
import { StudySubject, StudyTopic } from '../../../types/study';
import { CardType } from '../../../types/learning';
import { parseClozeSyntax } from '../../../utils/learning/spacedRepetition';
import { Plus } from 'lucide-react';

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
    if (!subjectId || !frontPrompt.trim() || (!backAnswer.trim() && !clozeResult.hasCloze)) return;

    setIsSubmitting(true);
    try {
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
