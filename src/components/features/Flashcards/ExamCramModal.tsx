import React, { useState, useMemo } from 'react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import { CustomSelect } from '../../ui/Select/CustomSelect';
import { StudySubject, StudyTopic } from '../../../types/study';
import { Flashcard } from '../../../types/learning';
import { Flame, ShieldCheck, Shuffle } from 'lucide-react';
import { filterCramDeck, CramFilterCriteria } from '../../../utils/learning/examCram';

export type { CramFilterCriteria };

export interface ExamCramModalProps {
  isOpen: boolean;
  onClose: () => void;
  flashcards: Flashcard[];
  subjects: StudySubject[];
  topics: StudyTopic[];
  onStartCram: (filteredDeck: Flashcard[]) => void;
}

/**
 * Feature 2.4: Exam Cram Mode (Filtered Decks Without FSRS Damage)
 *
 * Allows students preparing for upcoming exams to drill filtered card sets
 * on-demand without corrupting or ballooning their long-term FSRS memory stability.
 */
export const ExamCramModal: React.FC<ExamCramModalProps> = ({
  isOpen,
  onClose,
  flashcards,
  subjects,
  topics,
  onStartCram
}) => {
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('all');
  const [selectedTopicId, setSelectedTopicId] = useState<string>('all');
  const [filterCriteria, setFilterCriteria] = useState<CramFilterCriteria>('all');
  const [cardLimit, setCardLimit] = useState<string>('25');
  const [shuffleCards, setShuffleCards] = useState<boolean>(true);

  // Subject options
  const subjectOptions = [
    { value: 'all', label: 'All Subjects' },
    ...subjects.map((s) => ({ value: s.id, label: s.name }))
  ];

  // Topic options filtered by selected subject
  const availableTopics = useMemo(() => {
    if (selectedSubjectId === 'all') return topics;
    return topics.filter((t) => t.subjectId === selectedSubjectId);
  }, [topics, selectedSubjectId]);

  const topicOptions = [
    { value: 'all', label: 'All Syllabus Topics' },
    ...availableTopics.map((t) => ({ value: t.id, label: t.title }))
  ];

  // Compute matching cards
  const matchingCards = useMemo(() => {
    return filterCramDeck(flashcards, {
      subjectId: selectedSubjectId,
      topicId: selectedTopicId,
      criteria: filterCriteria,
      limit: cardLimit,
      shuffle: shuffleCards
    });
  }, [flashcards, selectedSubjectId, selectedTopicId, filterCriteria, cardLimit, shuffleCards]);

  const handleLaunch = () => {
    if (matchingCards.length === 0) return;
    onStartCram(matchingCards);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Exam Cram Mode (Zero FSRS Damage)">
      <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-md)' }}>
        {/* Zero-damage assurance notice */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: '10px',
            padding: '12px 14px',
            backgroundColor: 'rgba(235, 94, 40, 0.08)',
            border: '1px solid rgba(235, 94, 40, 0.25)',
            borderRadius: 'var(--radius-md)'
          }}
        >
          <ShieldCheck size={20} color="var(--color-coral-500)" style={{ flexShrink: 0, marginTop: '2px' }} />
          <div>
            <div style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
              Protected Active Recall Drill
            </div>
            <p style={{ margin: '2px 0 0', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Cram sessions allow ad-hoc practice before exams without ballooning or corrupting your long-term FSRS memory stability. Card intervals will remain intact.
            </p>
          </div>
        </div>

        {/* Filter Selection Controls */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
          <CustomSelect
            label="Domain / Subject"
            value={selectedSubjectId}
            onChange={(val) => {
              setSelectedSubjectId(val);
              setSelectedTopicId('all');
            }}
            options={subjectOptions}
          />

          <CustomSelect
            label="Syllabus Topic"
            value={selectedTopicId}
            onChange={setSelectedTopicId}
            options={topicOptions}
          />
        </div>

        <div>
          <label style={{ display: 'block', fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '8px' }}>
            Recall Filter Criteria
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '6px' }}>
            {[
              { id: 'all', label: 'All Cards in Deck' },
              { id: 'hard', label: 'Hard & Lapsed Only' },
              { id: 'unstudied', label: 'New / Unstudied' },
              { id: 'image_occlusion', label: 'Visual Diagrams' },
              { id: 'cloze', label: 'Cloze Deletions' }
            ].map((crit) => (
              <button
                key={crit.id}
                type="button"
                onClick={() => setFilterCriteria(crit.id as CramFilterCriteria)}
                style={{
                  padding: '8px 10px',
                  borderRadius: 'var(--radius-sm)',
                  border: filterCriteria === crit.id ? '1.5px solid var(--color-coral-500)' : '1px solid var(--border-subtle)',
                  background: filterCriteria === crit.id ? 'rgba(235, 94, 40, 0.08)' : 'var(--bg-surface-secondary)',
                  color: filterCriteria === crit.id ? 'var(--color-coral-500)' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-caption)',
                  fontWeight: filterCriteria === crit.id ? 600 : 500,
                  textAlign: 'center'
                }}
              >
                {crit.label}
              </button>
            ))}
          </div>
        </div>

        {/* Limit and Shuffle Options */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)' }}>Card Limit:</span>
            {['10', '25', '50', 'all'].map((limit) => (
              <button
                key={limit}
                type="button"
                onClick={() => setCardLimit(limit)}
                style={{
                  padding: '4px 10px',
                  borderRadius: 'var(--radius-xs)',
                  border: cardLimit === limit ? '1.5px solid var(--color-coral-500)' : '1px solid var(--border-subtle)',
                  background: cardLimit === limit ? 'var(--color-coral-500)' : 'var(--bg-surface-elevated)',
                  color: cardLimit === limit ? '#fff' : 'var(--text-secondary)',
                  cursor: 'pointer',
                  fontSize: 'var(--text-micro)',
                  fontWeight: 600
                }}
              >
                {limit.toUpperCase()}
              </button>
            ))}
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <input
              type="checkbox"
              checked={shuffleCards}
              onChange={(e) => setShuffleCards(e.target.checked)}
              style={{ accentColor: 'var(--color-coral-500)' }}
            />
            <Shuffle size={13} />
            <span>Randomize Card Order</span>
          </label>
        </div>

        {/* Summary Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: 'var(--space-md)',
            marginTop: '4px'
          }}
        >
          <span style={{ fontSize: 'var(--text-body-sm)', fontWeight: 600, color: 'var(--text-primary)' }}>
            {matchingCards.length} matching {matchingCards.length === 1 ? 'card' : 'cards'} selected
          </span>

          <div style={{ display: 'flex', gap: '8px' }}>
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="accent"
              onClick={handleLaunch}
              disabled={matchingCards.length === 0}
              leftIcon={<Flame size={15} />}
            >
              Start Cram Drill ({matchingCards.length})
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
};
