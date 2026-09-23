import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sun,
  Moon,
  Sunset,
  Sparkles,
  Flame,
  CheckCircle2,
  Clock,
  Layers,
  RefreshCw,
  Volume2,
  Share2,
  Shield
} from 'lucide-react';
import { SolarArc, SolarDial } from '../../../components/illustrations';
import { Badge } from '../../../components/ui/Badge/Badge';
import { Button } from '../../../components/ui/Button/Button';
import { cn } from '../../../utils/classNames';

export type TimeOfDayPhase = 'dawn' | 'zenith' | 'dusk' | 'night';
export type DemoTab = 'horizon' | 'recall' | 'focus' | 'graph';

const PHASE_CONFIG: Record<
  TimeOfDayPhase,
  {
    label: string;
    time: string;
    solarDate: Date;
    greeting: string;
    quote: string;
    focusTask: string;
    subject: string;
    badge: string;
    badgeVariant: 'coral' | 'amber' | 'lavender' | 'sage';
    accentBorder: string;
  }
> = {
  dawn: {
    label: 'Dawn Horizon',
    time: '07:15',
    solarDate: new Date('2026-09-23T07:15:00'),
    greeting: 'Good morning, Scholar',
    quote: 'The mind is quietest before the world stirs. Shape your primary intention.',
    focusTask: 'Review Core Consensus Proofs',
    subject: 'Distributed Systems',
    badge: 'Solar Awakening',
    badgeVariant: 'coral',
    accentBorder: 'rgba(224, 90, 62, 0.3)'
  },
  zenith: {
    label: 'Solar Zenith',
    time: '13:30',
    solarDate: new Date('2026-09-23T13:30:00'),
    greeting: 'High Sun, Peak Cognitive Velocity',
    quote: 'Deep mental energy is at its meridian. Eliminate all trivial interruptions.',
    focusTask: 'Implement Topological DAG Sorting & Invariants',
    subject: 'Advanced Algorithms',
    badge: 'Maximum Focus Window',
    badgeVariant: 'amber',
    accentBorder: 'rgba(181, 137, 66, 0.3)'
  },
  dusk: {
    label: 'Dusk Consolidation',
    time: '18:45',
    solarDate: new Date('2026-09-23T18:45:00'),
    greeting: 'Evening Transition, Synthesis Time',
    quote: 'Begin consolidating what was explored into durable long-term memory.',
    focusTask: 'SM-2 Active Spaced Retrieval Deck',
    subject: 'Cognitive Science & Anki Invariants',
    badge: 'Deliberate Review',
    badgeVariant: 'lavender',
    accentBorder: 'rgba(127, 139, 180, 0.3)'
  },
  night: {
    label: 'Night Nadir',
    time: '23:10',
    solarDate: new Date('2026-09-23T23:10:00'),
    greeting: 'Sanctuary Rest, Zero Screen Pressure',
    quote: 'Cognitive consolidation occurs in deep sleep. Review is closed for the day.',
    focusTask: 'Quiet Reading & Rest Preparation',
    subject: 'Sleep Hygiene & Recovery',
    badge: 'Circadian Stillness',
    badgeVariant: 'sage',
    accentBorder: 'rgba(77, 143, 99, 0.3)'
  }
};

export const InteractiveCockpitPreview: React.FC = () => {
  const [phase, setPhase] = useState<TimeOfDayPhase>('zenith');
  const [activeTab, setActiveTab] = useState<DemoTab>('horizon');

  // Interactive states inside the demo
  const [isTaskDone, setIsTaskDone] = useState(false);
  const [isCardFlipped, setIsCardFlipped] = useState(false);
  const [recallCardsLeft, setRecallCardsLeft] = useState(3);
  const [activeSoundscape, setActiveSoundscape] = useState('Rain on Skylight');
  const [activeConcept, setActiveConcept] = useState('Raft Invariants');

  const currentCfg = PHASE_CONFIG[phase];

  return (
    <div className="solis-interactive-cockpit">
      {/* Precision Horological Instrument Titlebar — Zero Cliché Window Dots */}
      <div className="solis-cockpit-titlebar">
        <div className="solis-titlebar-instrument-badge">
          <span className="solis-titlebar-pip" />
          <span className="solis-titlebar-spec">HOROLOGY // 24H_SOLAR_OBSERVATORY</span>
        </div>
        <div className="solis-titlebar-title">
          SOLIS WORKSPACE • LOCAL-FIRST IDB SUBSYSTEM
        </div>
        <div className="solis-titlebar-telemetry">
          <span className="solis-telemetry-badge">
            <Shield size={11} color="var(--color-sage-400)" />
            <span>0.42ms INDEXEDDB</span>
          </span>
          <span className="solis-keycap-hint">⌘K COMMAND</span>
        </div>
      </div>

      {/* Top Controller Bar: Time of Day Selector */}
      <div className="solis-cockpit-toolbar">
        <div className="solis-cockpit-toolbar__time">
          <span className="solis-toolbar-time-text">CIRCADIAN SIMULATOR:</span>
          <div className="solis-toolbar-phase-buttons">
            <button
              type="button"
              className={cn('solis-phase-btn', phase === 'dawn' && 'solis-phase-btn--active')}
              onClick={() => setPhase('dawn')}
            >
              <Sunset size={12} /> Dawn 07:15
            </button>
            <button
              type="button"
              className={cn('solis-phase-btn', phase === 'zenith' && 'solis-phase-btn--active')}
              onClick={() => setPhase('zenith')}
            >
              <Sun size={12} /> Zenith 13:30
            </button>
            <button
              type="button"
              className={cn('solis-phase-btn', phase === 'dusk' && 'solis-phase-btn--active')}
              onClick={() => setPhase('dusk')}
            >
              <Sunset size={12} /> Dusk 18:45
            </button>
            <button
              type="button"
              className={cn('solis-phase-btn', phase === 'night' && 'solis-phase-btn--active')}
              onClick={() => setPhase('night')}
            >
              <Moon size={12} /> Night 23:10
            </button>
          </div>
        </div>

        {/* Feature Simulator Tabs */}
        <div className="solis-cockpit-tabs-wrapper">
          <div className="solis-cockpit-tabs" role="tablist">
            <button
              type="button"
              className={cn('solis-tab-btn', activeTab === 'horizon' && 'solis-tab-btn--active')}
              onClick={() => setActiveTab('horizon')}
              role="tab"
              aria-selected={activeTab === 'horizon'}
            >
              <Clock size={13} /> Today's Horizon
            </button>
            <button
              type="button"
              className={cn('solis-tab-btn', activeTab === 'recall' && 'solis-tab-btn--active')}
              onClick={() => setActiveTab('recall')}
              role="tab"
              aria-selected={activeTab === 'recall'}
            >
              <RefreshCw size={13} /> Spaced Recall
            </button>
            <button
              type="button"
              className={cn('solis-tab-btn', activeTab === 'focus' && 'solis-tab-btn--active')}
              onClick={() => setActiveTab('focus')}
              role="tab"
              aria-selected={activeTab === 'focus'}
            >
              <Flame size={13} /> Focus Sanctuary
            </button>
            <button
              type="button"
              className={cn('solis-tab-btn', activeTab === 'graph' && 'solis-tab-btn--active')}
              onClick={() => setActiveTab('graph')}
              role="tab"
              aria-selected={activeTab === 'graph'}
            >
              <Share2 size={13} /> Knowledge Graph
            </button>
          </div>
        </div>
      </div>

      {/* Main Simulated Canvas */}
      <div className="solis-cockpit-window" style={{ borderColor: currentCfg.accentBorder }}>
        {/* Dynamic Solar Arrival Header in Preview */}
        <div className="solis-preview-hero-strip">
          <div className="solis-preview-hero-info">
            <div className="solis-preview-temporal">
              <span>{currentCfg.label.toUpperCase()}</span>
              <span>•</span>
              <span>{currentCfg.time}</span>
              <Badge variant={currentCfg.badgeVariant}>
                {currentCfg.badge}
              </Badge>
            </div>
            <h3 className="solis-preview-heading">{currentCfg.greeting}</h3>
            <p className="solis-preview-sub">{currentCfg.quote}</p>
          </div>

          <div className="solis-preview-hero-arc">
            <SolarArc currentDate={currentCfg.solarDate} />
          </div>
        </div>

        {/* Dynamic Animated Tab Panes */}
        <AnimatePresence mode="wait">
          {/* Tab 1: Today's Horizon */}
          {activeTab === 'horizon' && (
            <motion.div
              key="horizon"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="solis-preview-body solis-preview-body--grid"
            >
              {/* Left Preview Stage */}
              <div className="solis-preview-left-stream">
                {/* Active Recommended Block */}
                <div className="solis-preview-rec-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Sparkles size={13} color="var(--color-coral-500)" />
                      <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--color-coral-500)' }}>
                        EXPLAINABLE ACTIVE HORIZON
                      </span>
                    </div>
                    <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>45m Session</span>
                  </div>

                  <div style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)', marginTop: '4px' }}>
                    {currentCfg.focusTask}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {currentCfg.subject} • Target retention rate 92% • Exam in 14 days
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
                    <Button variant="primary" size="sm" leftIcon={<Flame size={12} />}>
                      Enter 45m Focus
                    </Button>
                    <Button variant="subtle" size="sm">
                      Inspect Syllabus
                    </Button>
                  </div>
                </div>

                {/* Interactive Clickable Task Item */}
                <div className="solis-preview-task-box">
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Today Priority Intention (Click to toggle)
                  </span>

                  <div
                    className={cn('solis-interactive-task-row', isTaskDone && 'solis-interactive-task-row--done')}
                    onClick={() => setIsTaskDone((prev) => !prev)}
                    role="button"
                    tabIndex={0}
                    aria-label="Toggle task completion"
                  >
                    <div className="solis-task-checkbox-mock">
                      {isTaskDone ? (
                        <CheckCircle2 size={16} color="var(--color-sage-400)" />
                      ) : (
                        <span className="solis-checkbox-ring" />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '13.5px', fontWeight: 500, color: 'var(--text-primary)', textDecoration: isTaskDone ? 'line-through' : 'none' }}>
                        Master Raft leader election invariants & active recall flashcards
                      </div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        Distributed Systems • High Priority • 45m estimated
                      </div>
                    </div>
                    <span className="solis-task-tag">
                      {isTaskDone ? '✓ Completed' : 'Tap to Complete'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Right Preview Telemetry */}
              <div className="solis-preview-right-stream">
                <div className="solis-preview-telemetry-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <span style={{ fontSize: '11.5px', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '0.04em' }}>
                      MOMENTUM VELOCITY
                    </span>
                    <span style={{ fontSize: '10px', fontFamily: 'var(--font-mono)', color: 'var(--color-coral-400)' }}>
                      DETERMINISTIC
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', justifyContent: 'center', padding: '6px 0' }}>
                    <SolarDial score={isTaskDone ? 92 : 84} size={90} strokeWidth={6} />
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', flex: 1 }}>
                      <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Tasks Velocity</span>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>{isTaskDone ? '100%' : '50%'}</strong>
                      </div>
                      <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Study Volume</span>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>145 / 180m</strong>
                      </div>
                      <div style={{ fontSize: '11px', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ color: 'var(--text-secondary)' }}>Habit Consistency</span>
                        <strong style={{ fontFamily: 'var(--font-mono)' }}>3/3 (100%)</strong>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="solis-preview-habit-card">
                  <div style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                    Daily Ritual Pulse
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '6px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>Morning Deep Study</span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-amber-400)' }}>🔥 14d streak</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '4px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-primary)' }}>Evening Review</span>
                    <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--color-sage-400)' }}>✓ Anchored</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 2: Spaced Recall (SM-2) Interactive Card */}
          {activeTab === 'recall' && (
            <motion.div
              key="recall"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="solis-preview-body solis-preview-body--center"
            >
              <div className="solis-interactive-card-wrapper">
                <div className="solis-card-deck-header">
                  <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    SPACED RETRIEVAL HORIZON • {recallCardsLeft} CARDS DUE TODAY
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-coral-400)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    SM-2 SUPERMEMO ALGORITHM
                  </span>
                </div>

                {/* 3D Flip Card */}
                <div
                  className={cn('solis-flashcard-3d', isCardFlipped && 'solis-flashcard-3d--flipped')}
                  onClick={() => setIsCardFlipped((prev) => !prev)}
                  role="button"
                  tabIndex={0}
                  aria-label="Click to flip flashcard"
                >
                  <div className="solis-flashcard-front">
                    <div className="solis-card-chip">QUESTION • TAP TO REVEAL INVARIANT</div>
                    <h4 className="solis-card-prompt">
                      What is the fundamental cycle invariant in Kahn’s topological sort algorithm?
                    </h4>
                    <div className="solis-card-hint">
                      Hint: Think about in-degree array and queue convergence vs total vertices |V|.
                    </div>
                  </div>

                  <div className="solis-flashcard-back">
                    <div className="solis-card-chip solis-card-chip--answer">VERIFIED CONCEPT</div>
                    <p className="solis-card-answer">
                      If the total number of dequeued vertices is strictly less than |V|, the directed graph
                      contains at least one directed cycle (no valid topological sequence exists).
                    </p>
                    <div className="solis-card-interval">
                      Calculated interval: <strong>4.2 days</strong> • Easiness Factor: <strong>2.5</strong>
                    </div>
                  </div>
                </div>

                {/* Interactive Rating Buttons */}
                <div className="solis-card-actions">
                  <button
                    type="button"
                    className="solis-rate-btn solis-rate-btn--again"
                    onClick={() => {
                      setIsCardFlipped(false);
                      setRecallCardsLeft((c) => Math.max(1, c));
                    }}
                  >
                    Again (1d)
                  </button>
                  <button
                    type="button"
                    className="solis-rate-btn solis-rate-btn--good"
                    onClick={() => {
                      setIsCardFlipped(false);
                      setRecallCardsLeft((c) => Math.max(0, c - 1));
                    }}
                  >
                    Good (4d)
                  </button>
                  <button
                    type="button"
                    className="solis-rate-btn solis-rate-btn--easy"
                    onClick={() => {
                      setIsCardFlipped(false);
                      setRecallCardsLeft((c) => Math.max(0, c - 1));
                    }}
                  >
                    Easy (9d)
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 3: Focus Sanctuary Simulator */}
          {activeTab === 'focus' && (
            <motion.div
              key="focus"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="solis-preview-body solis-preview-body--center"
            >
              <div className="solis-focus-pod-mock">
                <div className="solis-focus-pulse-ring">
                  <div className="solis-focus-circle">
                    <span className="solis-focus-time">24:48</span>
                    <span className="solis-focus-status">INTENTIONAL MOMENTUM</span>
                  </div>
                </div>

                <div style={{ textAlign: 'center', marginTop: '16px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', color: 'var(--text-primary)', fontWeight: 600 }}>
                    Raft Consensus Invariants & Safety Proofs
                  </h4>
                  <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    Distributed Systems • Pomodoro 1 of 4 • Ambient Audio Active
                  </span>
                </div>

                {/* Soundscape Pills */}
                <div className="solis-soundscape-selector">
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'inline-flex', alignItems: 'center', gap: '4px', fontFamily: 'var(--font-mono)' }}>
                    <Volume2 size={12} /> SOUNDSCAPE:
                  </span>
                  {['Rain on Skylight', 'Deep Space Orbit', 'Warm Vinyl Crackle', 'Binaural Theta 6Hz'].map((snd) => (
                    <button
                      key={snd}
                      type="button"
                      className={cn('solis-sound-pill', activeSoundscape === snd && 'solis-sound-pill--active')}
                      onClick={() => setActiveSoundscape(snd)}
                    >
                      {snd}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {/* Tab 4: Knowledge Graph Simulator */}
          {activeTab === 'graph' && (
            <motion.div
              key="graph"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
              className="solis-preview-body solis-preview-body--center"
            >
              <div className="solis-concept-graph-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', marginBottom: '12px' }}>
                  <span style={{ fontSize: '11.5px', fontFamily: 'var(--font-mono)', color: 'var(--text-muted)' }}>
                    BIDIRECTIONAL WIKILINK INDEX
                  </span>
                  <span style={{ fontSize: '11px', color: 'var(--color-lavender-400)', fontWeight: 600, fontFamily: 'var(--font-mono)' }}>
                    Active Note: [[{activeConcept}]]
                  </span>
                </div>

                {/* Interactive Vector Network */}
                <div className="solis-graph-nodes-grid">
                  {[
                    { name: 'Distributed Consensus', links: '4 linked references', color: 'coral' },
                    { name: 'Raft Invariants', links: 'Leader completeness, state machine safety', color: 'amber' },
                    { name: 'Leader Election', links: 'Randomized election timeouts, terms', color: 'lavender' },
                    { name: 'Paxos Protocol', links: 'Synod algorithm, multi-paxos quorum', color: 'sage' }
                  ].map((concept) => (
                    <div
                      key={concept.name}
                      className={cn('solis-graph-chip', activeConcept === concept.name && 'solis-graph-chip--active')}
                      onClick={() => setActiveConcept(concept.name)}
                      role="button"
                      tabIndex={0}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Layers size={13} color={`var(--color-${concept.color}-500)`} />
                        <strong style={{ fontSize: '12.5px', color: 'var(--text-primary)' }}>[[{concept.name}]]</strong>
                      </div>
                      <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                        {concept.links}
                      </span>
                    </div>
                  ))}
                </div>

                <div style={{ fontSize: '11px', color: 'var(--text-muted)', textAlign: 'center', marginTop: '12px', fontFamily: 'var(--font-mono)' }}>
                  Click concepts to reveal reciprocal backlinks without full-page reloads.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Interactive Bottom Hint */}
        <div className="solis-preview-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            <span className="solis-live-dot" />
            <span>Fully functional in Solis Workspace • Local IndexedDB + Supabase Postgres sync</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '11px', fontFamily: 'var(--font-mono)', color: 'var(--text-secondary)' }}>
              Press <kbd className="solis-kbd">Space</kbd> inside app for focus
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InteractiveCockpitPreview;
