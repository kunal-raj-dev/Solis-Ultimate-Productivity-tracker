/**
 * GuideCenterModal V2 — Quick-Access Guide Launcher
 *
 * Simplified from the old split-pane reader into a guide directory/launcher.
 * No article content is rendered inside this modal.
 * Selecting a guide navigates to the full Guide Center page.
 */
import React, { useState, useMemo } from 'react';
import {
  BookOpen,
  Search,
  X
} from 'lucide-react';
import { Modal } from '../../components/feedback/Modal/Modal';
import { GuideCard } from './GuideCard';
import { useGuide } from '../../context/GuideContext';
import { SOLIS_GUIDES, GUIDE_CATEGORIES, searchGuides } from '../../data/guides';
import { GuideCategory } from '../../types/guide';
import './GuideCenterModal.css';

export interface GuideCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialGuideId?: string;
}

export const GuideCenterModal: React.FC<GuideCenterModalProps> = ({
  isOpen,
  onClose,
  initialGuideId
}) => {
  const { navigateToGuide } = useGuide();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory | 'all'>('all');

  const filteredGuides = useMemo(() => {
    let result = searchGuides(searchQuery);
    if (selectedCategory !== 'all') {
      result = result.filter((g) => g.category === selectedCategory);
    }
    return result;
  }, [searchQuery, selectedCategory]);

  const handleGuideSelect = (guideId: string) => {
    onClose();
    navigateToGuide(guideId);
  };

  // If opened with an initial guide, navigate directly
  React.useEffect(() => {
    if (isOpen && initialGuideId) {
      onClose();
      navigateToGuide(initialGuideId);
    }
  }, [isOpen, initialGuideId]);

  return (
    <Modal isOpen={isOpen} onClose={onClose} className="solis-guide-launcher">
      <div className="solis-guide-launcher__content">
        {/* Header */}
        <div className="solis-guide-launcher__header">
          <div className="solis-guide-launcher__title-row">
            <div className="solis-guide-launcher__title-group">
              <BookOpen size={18} color="var(--color-coral-500)" />
              <h3 className="solis-guide-launcher__heading">Guide Center</h3>
            </div>
            <button
              onClick={onClose}
              className="solis-guide-launcher__close"
              aria-label="Close Guide Center"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search */}
          <div className="solis-guide-launcher__search-box">
            <Search size={14} className="solis-guide-launcher__search-icon" />
            <input
              type="text"
              className="solis-guide-launcher__search-input"
              placeholder="Search guides or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              autoFocus
              aria-label="Search guides"
            />
          </div>

          {/* Category filters */}
          <div className="solis-guide-launcher__categories">
            <button
              type="button"
              className={`solis-guide-launcher__cat-btn ${selectedCategory === 'all' ? 'solis-guide-launcher__cat-btn--active' : ''}`}
              onClick={() => setSelectedCategory('all')}
            >
              All ({SOLIS_GUIDES.length})
            </button>
            {GUIDE_CATEGORIES.map((cat) => {
              const count = SOLIS_GUIDES.filter((g) => g.category === cat.id).length;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`solis-guide-launcher__cat-btn ${selectedCategory === cat.id ? 'solis-guide-launcher__cat-btn--active' : ''}`}
                  onClick={() => setSelectedCategory(cat.id)}
                >
                  {cat.label} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Guide list */}
        <div className="solis-guide-launcher__list" role="listbox" aria-label="Available guides">
          {filteredGuides.length === 0 ? (
            <div className="solis-guide-launcher__no-results">
              <p>No guides match your search.</p>
            </div>
          ) : (
            filteredGuides.map((g) => (
              <GuideCard
                key={g.id}
                guide={g}
                onClick={() => handleGuideSelect(g.id)}
              />
            ))
          )}
        </div>

        {/* Footer */}
        <div className="solis-guide-launcher__footer">
          <button
            className="solis-guide-launcher__browse-all"
            onClick={() => {
              onClose();
              navigateToGuide();
            }}
          >
            Browse all guides →
          </button>
        </div>
      </div>
    </Modal>
  );
};
