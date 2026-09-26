import React from 'react';
import { Sunrise, HeartHandshake, ListFilter, ArrowRight } from 'lucide-react';
import { Modal } from '../../feedback/Modal/Modal';
import { Button } from '../../ui/Button/Button';
import './WelcomeBackModal.css';

export interface WelcomeBackModalProps {
  isOpen: boolean;
  onClose: () => void;
  /** Chosen gentle re-entry option (plan §3.4). */
  onGentleStart: () => void;
  onStreakAmnesty: () => void;
  onPriorityTriage: () => void;
}

interface ReEntryOption {
  id: 'gentle_start' | 'streak_amnesty' | 'priority_triage';
  icon: React.ReactNode;
  title: string;
  description: string;
  onChoose: () => void;
}

/**
 * Plan §3.4 — "Welcome Back" Gentle Re-Entry Flow.
 * Rendered after a 3+ day absence. Absences are met with a calm, choice-based
 * re-entry — never guilt, never red alerts, never broken-streak shaming.
 */
export const WelcomeBackModal: React.FC<WelcomeBackModalProps> = ({
  isOpen,
  onClose,
  onGentleStart,
  onStreakAmnesty,
  onPriorityTriage
}) => {
  const options: ReEntryOption[] = [
    {
      id: 'gentle_start',
      icon: <Sunrise size={18} />,
      title: 'Gentle Start',
      description: 'Ease in at half of your usual daily capacity today.',
      onChoose: onGentleStart
    },
    {
      id: 'streak_amnesty',
      icon: <HeartHandshake size={18} />,
      title: 'Streak Amnesty',
      description: 'Protects habit continuity — your excused days will not break your streaks.',
      onChoose: onStreakAmnesty
    },
    {
      id: 'priority_triage',
      icon: <ListFilter size={18} />,
      title: 'Priority Triage',
      description: 'Hides the backlog noise and presents only your Top 3 tasks.',
      onChoose: onPriorityTriage
    }
  ];

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="solis-welcome-back-modal">
        <div className="solis-welcome-back-header">
          <div className="solis-welcome-back-tag">
            <Sunrise size={13} />
            <span>Gentle Re-Entry</span>
          </div>
          <h2 className="solis-welcome-back-title">
            Welcome back. Let&apos;s ease into today without stress.
          </h2>
          <p className="solis-welcome-back-subtitle">
            A few days have passed — that is a natural rhythm, not a setback. Choose how
            you would like today to begin (or skip this entirely).
          </p>
        </div>

        <div className="solis-welcome-back-options">
          {options.map((option) => (
            <button
              key={option.id}
              type="button"
              className="solis-welcome-back-option"
              onClick={() => {
                option.onChoose();
                onClose();
              }}
            >
              <span className="solis-welcome-back-option-icon" aria-hidden="true">
                {option.icon}
              </span>
              <span className="solis-welcome-back-option-body">
                <span className="solis-welcome-back-option-title">{option.title}</span>
                <span className="solis-welcome-back-option-desc">{option.description}</span>
              </span>
              <ArrowRight size={15} className="solis-welcome-back-option-arrow" aria-hidden="true" />
            </button>
          ))}
        </div>

        <div className="solis-welcome-back-actions">
          <Button variant="ghost" size="sm" onClick={onClose}>
            Just open my workspace
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default WelcomeBackModal;
