import React, { useState, useRef, useEffect } from 'react';
import { HelpCircle, X, ExternalLink } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './ContextualHelp.css';

export interface ContextualHelpProps {
  title: string;
  content: string;
  example?: string;
  guideId?: string;
  onOpenGuide?: (guideId: string) => void;
  position?: 'top' | 'bottom';
  ariaLabel?: string;
}

export const ContextualHelp: React.FC<ContextualHelpProps> = ({
  title,
  content,
  example,
  guideId,
  onOpenGuide,
  position = 'bottom',
  ariaLabel
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();
  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
        triggerRef.current?.focus();
      }
    };

    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleLearnMore = () => {
    setIsOpen(false);
    if (guideId) {
      navigate(`/app/guides/${guideId}`);
    } else if (onOpenGuide && guideId) {
      onOpenGuide(guideId);
    }
  };

  return (
    <div className="solis-contextual-help" ref={containerRef}>
      <button
        ref={triggerRef}
        type="button"
        className="solis-contextual-help__trigger"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={ariaLabel || `Learn more about ${title}`}
        aria-expanded={isOpen}
      >
        <HelpCircle size={14} />
      </button>

      {isOpen && (
        <div
          className={`solis-contextual-help__popover ${position === 'top' ? 'solis-contextual-help__popover--top' : ''}`}
          role="tooltip"
        >
          <div className="solis-contextual-help__header">
            <h5 className="solis-contextual-help__title">{title}</h5>
            <button
              type="button"
              className="solis-contextual-help__close"
              onClick={() => setIsOpen(false)}
              aria-label="Close help popover"
            >
              <X size={14} />
            </button>
          </div>

          <div className="solis-contextual-help__body">{content}</div>

          {example && (
            <div className="solis-contextual-help__example">
              <strong>Example:</strong> {example}
            </div>
          )}

          {guideId && onOpenGuide && (
            <div className="solis-contextual-help__footer">
              <button
                type="button"
                className="solis-contextual-help__link"
                onClick={handleLearnMore}
              >
                <span>Read Full Guide</span>
                <ExternalLink size={12} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
