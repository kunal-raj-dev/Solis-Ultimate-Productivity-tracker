/**
 * GuideCenterPage — Full Guide Reading & Learning Experience
 *
 * The primary Guide Center V2 experience. Replaces the old constrained modal
 * with a dedicated full-page layout featuring:
 *  - Sticky category/guide sidebar (240px desktop)
 *  - Readable content column (720px max-width, ~65 char/line)
 *  - Step-by-step navigation with progress, keyboard shortcuts, auto-completion
 *  - Quick/Deep mode toggle
 *  - Resume state from sessionStorage
 *  - Return-to-guide banner after product actions
 *  - Full mobile responsiveness (single-column, no split panes)
 */
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  BookOpen,
  Search,
  Layers,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';
import { useGuide } from '../../context/GuideContext';
import { useGuideActions } from './useGuideActions';
import { useGuideCompletion } from './useGuideCompletion';
import { GuideCard } from './GuideCard';
import { GuideStepView } from './GuideStepView';
import { GuideProgressBar } from './GuideProgressBar';
import { GuideNavigation } from './GuideNavigation';
import { GuideCompletion } from './GuideCompletion';
import {
  SOLIS_GUIDES,
  GUIDE_CATEGORIES,
  findGuideById,
  searchGuides
} from '../../data/guides';
import { Guide, GuideCategory, GuideStepAction } from '../../types/guide';
import './GuideCenterPage.css';

export const GuideCenterPage: React.FC = () => {
  const { guideId: urlGuideId } = useParams<{ guideId?: string }>();
  const navigate = useNavigate();
  const {
    activeStepIndex,
    setActiveStepIndex,
    completedSteps,
    markStepComplete,
    isStepComplete,
    isDeepMode,
    toggleDeepMode,
    saveGuideSession,
    getGuideSession,
    returnGuideId,
    setReturnGuideId
  } = useGuide();
  const { executeAction } = useGuideActions();
  const { checkStepCompletion } = useGuideCompletion();

  // Local UI state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<GuideCategory | 'all'>('all');
  const [isGuideComplete, setIsGuideComplete] = useState(false);
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  // Resolve active guide from URL
  const activeGuide: Guide | undefined = useMemo(() => {
    if (urlGuideId) return findGuideById(urlGuideId);
    return undefined;
  }, [urlGuideId]);

  // Filter guides for sidebar
  const filteredGuides = useMemo(() => {
    let result = searchGuides(searchQuery);
    if (selectedCategory !== 'all') {
      result = result.filter((g) => g.category === selectedCategory);
    }
    return result;
  }, [searchQuery, selectedCategory]);

  // Resolve related guides
  const relatedGuides = useMemo(() => {
    if (!activeGuide?.relatedGuides) return [];
    return activeGuide.relatedGuides
      .map((id) => findGuideById(id))
      .filter((g): g is Guide => g !== undefined);
  }, [activeGuide]);

  // Resume session state when guide changes
  useEffect(() => {
    if (activeGuide) {
      const session = getGuideSession(activeGuide.id);
      if (session) {
        setActiveStepIndex(session.currentStep);
        if (session.isDeepMode !== isDeepMode) {
          toggleDeepMode();
        }
      } else {
        setActiveStepIndex(0);
      }
      setIsGuideComplete(false);

      // Auto-set category filter to match guide
      setSelectedCategory(activeGuide.category);
    }
  }, [activeGuide?.id]);

  // Save session on step changes (debounced via effect)
  useEffect(() => {
    if (activeGuide) {
      saveGuideSession(activeGuide.id);
    }
  }, [activeStepIndex, completedSteps, isDeepMode, activeGuide?.id]);

  // Auto-verify steps that have completionCheck
  useEffect(() => {
    if (!activeGuide) return;
    activeGuide.steps.forEach((step) => {
      if (step.completionCheck) {
        const result = checkStepCompletion(step.completionCheck);
        if (result === true && !isStepComplete(activeGuide.id, step.stepNumber)) {
          markStepComplete(activeGuide.id, step.stepNumber);
        }
      }
    });
  }, [activeGuide, checkStepCompletion]);

  // Keyboard navigation for steps
  useEffect(() => {
    if (!activeGuide || isGuideComplete) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      const isInput = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable;
      if (isInput) return;

      if (e.key === 'ArrowRight' && activeStepIndex < activeGuide.steps.length - 1) {
        e.preventDefault();
        handleNext();
      } else if (e.key === 'ArrowLeft' && activeStepIndex > 0) {
        e.preventDefault();
        handlePrevious();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [activeGuide, activeStepIndex, isGuideComplete]);

  // Navigation handlers
  const handleNext = useCallback(() => {
    if (!activeGuide) return;
    if (activeStepIndex < activeGuide.steps.length - 1) {
      setActiveStepIndex(activeStepIndex + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeGuide, activeStepIndex, setActiveStepIndex]);

  const handlePrevious = useCallback(() => {
    if (activeStepIndex > 0) {
      setActiveStepIndex(activeStepIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeStepIndex, setActiveStepIndex]);

  const handleComplete = useCallback(() => {
    setIsGuideComplete(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleSelectGuide = useCallback((guideId: string) => {
    navigate(`/app/guides/${guideId}`);
    setIsMobileSidebarOpen(false);
  }, [navigate]);

  const handleStepAction = useCallback((action: GuideStepAction) => {
    if (activeGuide) {
      saveGuideSession(activeGuide.id);
    }
    executeAction(action);
  }, [activeGuide, saveGuideSession, executeAction]);

  const handleReturnToGuide = useCallback(() => {
    if (returnGuideId) {
      navigate(`/app/guides/${returnGuideId}`);
      setReturnGuideId(undefined);
    }
  }, [returnGuideId, navigate, setReturnGuideId]);

  const handleReturnToProduct = useCallback(() => {
    if (activeGuide?.action) {
      executeAction(activeGuide.action);
    }
  }, [activeGuide, executeAction]);

  const handleNavigateToRelated = useCallback((guideId: string) => {
    navigate(`/app/guides/${guideId}`);
    setIsGuideComplete(false);
  }, [navigate]);

  // Current step data
  const currentStep = activeGuide ? activeGuide.steps[activeStepIndex] : undefined;
  const currentStepCompleted = activeGuide && currentStep
    ? isStepComplete(activeGuide.id, currentStep.stepNumber)
    : false;
  const currentStepAutoVerified = currentStep?.completionCheck
    ? checkStepCompletion(currentStep.completionCheck) === true
    : false;

  const guideCompletedSteps = activeGuide
    ? (completedSteps[activeGuide.id] || [])
    : [];

  return (
    <div className="solis-guide-page">
      {/* ================================================================
          SIDEBAR
          ================================================================ */}
      <aside
        className={`solis-guide-page__sidebar ${isMobileSidebarOpen ? 'solis-guide-page__sidebar--mobile-open' : ''}`}
        aria-label="Guide navigation"
      >
        <div className="solis-guide-page__sidebar-header">
          <h1 className="solis-guide-page__sidebar-title">
            <BookOpen size={18} color="var(--color-coral-500)" />
            Guide Center
          </h1>
          <div className="solis-guide-page__search-box">
            <Search size={14} className="solis-guide-page__search-icon" />
            <input
              type="text"
              className="solis-guide-page__search-input"
              placeholder="Search guides or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              aria-label="Search guides"
            />
          </div>
        </div>

        <nav className="solis-guide-page__categories" aria-label="Guide categories">
          <button
            type="button"
            className={`solis-guide-page__cat-btn ${selectedCategory === 'all' ? 'solis-guide-page__cat-btn--active' : ''}`}
            onClick={() => setSelectedCategory('all')}
          >
            All Guides
            <span className="solis-guide-page__cat-count">{SOLIS_GUIDES.length}</span>
          </button>
          {GUIDE_CATEGORIES.map((cat) => {
            const count = SOLIS_GUIDES.filter((g) => g.category === cat.id).length;
            return (
              <button
                key={cat.id}
                type="button"
                className={`solis-guide-page__cat-btn ${selectedCategory === cat.id ? 'solis-guide-page__cat-btn--active' : ''}`}
                onClick={() => setSelectedCategory(cat.id)}
                title={cat.description}
              >
                {cat.label}
                <span className="solis-guide-page__cat-count">{count}</span>
              </button>
            );
          })}
        </nav>

        <div className="solis-guide-page__guide-list" role="listbox" aria-label="Available guides">
          {filteredGuides.length === 0 ? (
            <div className="solis-guide-page__no-results">
              No guides match your search.
            </div>
          ) : (
            filteredGuides.map((g) => (
              <GuideCard
                key={g.id}
                guide={g}
                isSelected={g.id === activeGuide?.id}
                onClick={() => handleSelectGuide(g.id)}
                compact
              />
            ))
          )}
        </div>
      </aside>

      {/* ================================================================
          MAIN CONTENT
          ================================================================ */}
      <main className="solis-guide-page__main">
        <div className="solis-guide-page__content">

          {/* Mobile back button */}
          {activeGuide && (
            <div className="solis-guide-page__mobile-header">
              <button
                className="solis-guide-page__mobile-back"
                onClick={() => navigate('/app/guides')}
                aria-label="Back to guide list"
              >
                <ArrowLeft size={14} />
                All Guides
              </button>
            </div>
          )}

          {/* Return-to-guide banner */}
          {returnGuideId && !urlGuideId && (
            <div className="solis-guide-page__return-banner" role="alert">
              <BookOpen size={16} />
              <span>You were learning a guide.</span>
              <button onClick={handleReturnToGuide}>
                Return to guide →
              </button>
            </div>
          )}

          {/* ============================================================
              NO GUIDE SELECTED — DIRECTORY
              ============================================================ */}
          {!activeGuide && (
            <div className="solis-guide-directory">
              <BookOpen size={48} className="solis-guide-directory__icon" />
              <h2 className="solis-guide-directory__title">Guide Center</h2>
              <p className="solis-guide-directory__subtitle">
                Learn how to use Solis effectively. Select a guide from the sidebar,
                or browse below.
              </p>
              <div className="solis-guide-directory__grid">
                {SOLIS_GUIDES.slice(0, 6).map((g) => (
                  <GuideCard
                    key={g.id}
                    guide={g}
                    onClick={() => handleSelectGuide(g.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* ============================================================
              GUIDE SELECTED — COMPLETION SCREEN
              ============================================================ */}
          {activeGuide && isGuideComplete && (
            <GuideCompletion
              guide={activeGuide}
              relatedGuides={relatedGuides}
              onNavigateToGuide={handleNavigateToRelated}
              onReturnToProduct={handleReturnToProduct}
            />
          )}

          {/* ============================================================
              GUIDE SELECTED — STEP-BY-STEP EXPERIENCE
              ============================================================ */}
          {activeGuide && !isGuideComplete && currentStep && (
            <>
              {/* Guide Header */}
              <div>
                <span className="solis-guide-page__guide-category">
                  {GUIDE_CATEGORIES.find((c) => c.id === activeGuide.category)?.label || activeGuide.category}
                </span>
                <h2 className="solis-guide-page__guide-title">{activeGuide.title}</h2>
                <p className="solis-guide-page__guide-summary">{activeGuide.summary}</p>
                <div className="solis-guide-page__guide-meta">
                  <span>{activeGuide.steps.length} steps</span>
                  {activeGuide.estimatedMinutes && (
                    <span>~{activeGuide.estimatedMinutes} min</span>
                  )}
                  <div className="solis-guide-page__mode-toggle">
                    <button
                      className={`solis-guide-page__mode-btn ${!isDeepMode ? 'solis-guide-page__mode-btn--active' : ''}`}
                      onClick={() => { if (isDeepMode) toggleDeepMode(); }}
                      aria-pressed={!isDeepMode}
                    >
                      Quick
                    </button>
                    <button
                      className={`solis-guide-page__mode-btn ${isDeepMode ? 'solis-guide-page__mode-btn--active' : ''}`}
                      onClick={() => { if (!isDeepMode) toggleDeepMode(); }}
                      aria-pressed={isDeepMode}
                    >
                      Deep
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Understanding */}
              <section className="solis-guide-page__quick-context" aria-label="Guide context">
                <div className="solis-guide-page__context-item">
                  <h3 className="solis-guide-page__context-label">What is this?</h3>
                  <p className="solis-guide-page__context-text">{activeGuide.summary}</p>
                </div>
                <div className="solis-guide-page__context-item">
                  <h3 className="solis-guide-page__context-label">When should I use it?</h3>
                  <p className="solis-guide-page__context-text">{activeGuide.whenToUse}</p>
                </div>
              </section>

              {/* Progress */}
              <GuideProgressBar
                totalSteps={activeGuide.steps.length}
                currentStep={activeStepIndex}
                completedSteps={guideCompletedSteps}
                onStepClick={(i) => setActiveStepIndex(i)}
              />

              {/* Current Step */}
              <GuideStepView
                step={currentStep}
                totalSteps={activeGuide.steps.length}
                isCompleted={currentStepCompleted}
                isAutoVerified={currentStepAutoVerified}
                onMarkComplete={() => {
                  if (activeGuide) {
                    markStepComplete(activeGuide.id, currentStep.stepNumber);
                  }
                }}
                onExecuteAction={handleStepAction}
              />

              {/* Navigation */}
              <GuideNavigation
                currentStep={activeStepIndex}
                totalSteps={activeGuide.steps.length}
                onPrevious={handlePrevious}
                onNext={handleNext}
                onComplete={handleComplete}
              />

              {/* Deep Mode: Extra Content */}
              {isDeepMode && (
                <>
                  {/* System Connection */}
                  <div className="solis-guide-page__connection-box">
                    <div className="solis-guide-page__connection-label">
                      <Layers size={15} color="var(--color-coral-500)" />
                      <span>System Connection</span>
                    </div>
                    <p className="solis-guide-page__connection-text">
                      {activeGuide.connection.explanation}
                    </p>
                  </div>

                  {/* Common Mistakes */}
                  {activeGuide.commonMistakes && activeGuide.commonMistakes.length > 0 && (
                    <div>
                      <h4 className="solis-guide-page__mistakes-heading">
                        <AlertTriangle size={15} color="var(--status-warning)" />
                        <span>Common Mistakes to Avoid</span>
                      </h4>
                      <ul className="solis-guide-page__mistakes-list">
                        {activeGuide.commonMistakes.map((mistake, idx) => (
                          <li key={idx}>{mistake}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Deep Content */}
                  {activeGuide.deepContent && (
                    <div className="solis-guide-page__deep-content">
                      {activeGuide.deepContent.advancedTips && activeGuide.deepContent.advancedTips.length > 0 && (
                        <>
                          <h4 className="solis-guide-page__deep-heading">Advanced Tips</h4>
                          <ul className="solis-guide-page__deep-list">
                            {activeGuide.deepContent.advancedTips.map((tip, idx) => (
                              <li key={idx}>{tip}</li>
                            ))}
                          </ul>
                        </>
                      )}
                      {activeGuide.deepContent.relatedConcepts && activeGuide.deepContent.relatedConcepts.length > 0 && (
                        <>
                          <h4 className="solis-guide-page__deep-heading">Related Concepts</h4>
                          <ul className="solis-guide-page__deep-list">
                            {activeGuide.deepContent.relatedConcepts.map((concept, idx) => (
                              <li key={idx}>{concept}</li>
                            ))}
                          </ul>
                        </>
                      )}
                    </div>
                  )}
                </>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
};
