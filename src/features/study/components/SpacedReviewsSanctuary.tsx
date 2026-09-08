import React from 'react';
import { BrainCircuit, Plus, Sparkles, Play } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge/Badge';
import { Button } from '../../../components/ui/Button/Button';
import { ContextualHelp } from '../../../components/ui/ContextualHelp/ContextualHelp';
import { Flashcard, ReviewQueueItem } from '../../../types/learning';

export interface SpacedReviewsSanctuaryProps {
  reviews: ReviewQueueItem[];
  flashcards: Flashcard[];
  onOpenGuide: (guideId: string) => void;
  onOpenCardCreator: (subjectId?: string, topicId?: string) => void;
  onStartActiveRecall: (cards?: Flashcard[]) => void;
}

export const SpacedReviewsSanctuary: React.FC<SpacedReviewsSanctuaryProps> = ({
  reviews,
  flashcards,
  onOpenGuide,
  onOpenCardCreator,
  onStartActiveRecall
}) => {
  return (
    <div style={{ marginBottom: '32px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <BrainCircuit size={18} color="var(--color-coral-500)" />
          <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 'var(--text-heading-3)' }}>
            Spaced Retrieval & Active Recall
          </h3>
          <ContextualHelp
            title="What is Active Recall?"
            content="Active Recall tests your memory by prompting retrieval of concepts without looking at notes. Combined with SM-2 spaced repetition, it minimizes forgetting."
            example="Testing flashcards on optimal intervals ensures long-term memory retention."
            guideId="active-recall-flashcards"
            onOpenGuide={onOpenGuide}
          />
          {reviews.length > 0 && (
            <Badge variant="coral">{reviews.length} Due</Badge>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px' }}>
          <Button
            variant="outline"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => onOpenCardCreator()}
          >
            New Flashcard
          </Button>
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Sparkles size={14} />}
            onClick={() => onStartActiveRecall()}
          >
            Start Recall Drill ({flashcards.length})
          </Button>
        </div>
      </div>

      {reviews.length > 0 ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))', gap: '14px' }}>
          {reviews.map((rev) => (
            <div
              key={rev.id}
              style={{
                padding: '14px 16px',
                backgroundColor: 'var(--bg-surface-primary)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                display: 'flex',
                flexDirection: 'column',
                gap: '8px'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Badge variant={rev.priority === 'urgent' ? 'coral' : rev.priority === 'high' ? 'amber' : 'neutral'}>
                  {rev.priority} Priority
                </Badge>
                <span style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)' }}>Due Today</span>
              </div>
              <div style={{ fontWeight: 600, fontSize: 'var(--text-body-sm)' }}>{rev.topicTitle}</div>
              <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: 0 }}>
                {rev.subjectName} • {rev.reason}
              </p>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
                <Button
                  variant="subtle"
                  size="sm"
                  leftIcon={<Play size={12} />}
                  onClick={() => {
                    const topicCards = flashcards.filter((c) => c.topicId === rev.topicId);
                    onStartActiveRecall(topicCards.length > 0 ? topicCards : flashcards);
                  }}
                >
                  Drill Recall
                </Button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div style={{ padding: '16px 20px', backgroundColor: 'var(--bg-surface-primary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <p style={{ fontWeight: 500, fontSize: 'var(--text-body-sm)', margin: 0 }}>
              All Spaced Retention Intervals Current
            </p>
            <p style={{ fontSize: 'var(--text-caption)', color: 'var(--text-secondary)', margin: '2px 0 0 0' }}>
              {flashcards.length} active flashcards in your workspace. Retention signals will automatically alert you when spaced reviews become due.
            </p>
          </div>
          {flashcards.length > 0 && (
            <Button variant="ghost" size="sm" onClick={() => onStartActiveRecall()}>
              Practice Deck ({flashcards.length}) →
            </Button>
          )}
        </div>
      )}
    </div>
  );
};
