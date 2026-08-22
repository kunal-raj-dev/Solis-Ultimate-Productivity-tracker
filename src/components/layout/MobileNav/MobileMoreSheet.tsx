import React, { useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  FileText,
  Repeat,
  Target,
  BarChart3,
  Sparkles,
  Sliders,
  HelpCircle,
  X,
  ChevronRight
} from 'lucide-react';
import { prefetchRoute } from '../../../utils/prefetch';
import './MobileMoreSheet.css';

interface MobileMoreSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

const MORE_SECTIONS = [
  {
    title: 'Knowledge',
    items: [
      {
        id: 'notes',
        label: 'Knowledge Studio',
        path: '/app/notes',
        description: 'External memory & intellectual synthesis',
        icon: FileText,
        color: 'lavender'
      }
    ]
  },
  {
    title: 'Horizons',
    items: [
      {
        id: 'habits',
        label: 'Rituals & Consistency',
        path: '/app/habits',
        description: 'Daily consistency matrix',
        icon: Repeat,
        color: 'sage'
      },
      {
        id: 'goals',
        label: 'Goal Horizons',
        path: '/app/goals',
        description: 'Milestone progression trajectories',
        icon: Target,
        color: 'coral'
      },
      {
        id: 'analytics',
        label: 'Cognitive Rhythm',
        path: '/app/analytics',
        description: 'Study velocity & intensity constellation',
        icon: BarChart3,
        color: 'amber'
      },
      {
        id: 'review',
        label: 'Weekly Review',
        path: '/app/review',
        description: '5-pillar reflection & calibration ritual',
        icon: Sparkles,
        color: 'rose'
      }
    ]
  },
  {
    title: 'System',
    items: [
      {
        id: 'settings',
        label: 'Preferences',
        path: '/app/settings',
        description: 'Study parameters & learner profile',
        icon: Sliders,
        color: 'neutral'
      },
      {
        id: 'guides',
        label: 'Guide Center',
        path: '/app/guides',
        description: 'Learnability & workflow reference',
        icon: HelpCircle,
        color: 'lavender'
      }
    ]
  }
];

export const MobileMoreSheet: React.FC<MobileMoreSheetProps> = ({ isOpen, onClose }) => {
  const location = useLocation();
  const sheetRef = useRef<HTMLDivElement>(null);

  // Close on route change
  useEffect(() => {
    onClose();
  }, [location.pathname]);

  // Handle ESC key and focus trapping
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="solis-more-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-label="More Navigation">
      <div
        className="solis-more-sheet"
        ref={sheetRef}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="solis-more-sheet__header">
          <h2 className="solis-more-sheet__title">Navigation</h2>
          <button
            type="button"
            className="solis-more-sheet__close"
            onClick={onClose}
            aria-label="Close navigation sheet"
          >
            <X size={18} />
          </button>
        </div>

        <div className="solis-more-sheet__content">
          {MORE_SECTIONS.map((section) => (
            <div key={section.title} className="solis-more-sheet__section">
              <div className="solis-more-sheet__section-title">{section.title}</div>
              <div className="solis-more-sheet__grid">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.id}
                      to={item.path}
                      onMouseEnter={() => prefetchRoute(item.id)}
                      onTouchStart={() => prefetchRoute(item.id)}
                      onClick={onClose}
                      className={({ isActive }) =>
                        `solis-more-sheet__card ${isActive ? 'solis-more-sheet__card--active' : ''}`
                      }
                    >
                      <div className={`solis-more-sheet__card-icon solis-more-sheet__card-icon--${item.color}`}>
                        <Icon size={18} />
                      </div>
                      <div className="solis-more-sheet__card-text">
                        <div className="solis-more-sheet__card-title">{item.label}</div>
                        <div className="solis-more-sheet__card-desc">{item.description}</div>
                      </div>
                      <ChevronRight size={16} className="solis-more-sheet__card-arrow" />
                    </NavLink>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
