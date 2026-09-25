import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowRight,
  BookOpen,
  Compass,
  Layers,
  ShieldCheck,
  Zap,
  ChevronDown,
  RefreshCw,
  Cpu,
  Lock,
  Sunset,
  Sun,
  Moon,
  Flame,
  Check,
  Minus
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Container } from '../../components/layout/Container/Container';
import { ScrollReveal } from '../../components/motion/ScrollReveal';
import { InteractiveCockpitPreview } from './components/InteractiveCockpitPreview';
import {
  GridBackgroundSvg,
  SynapseNetworkSvg,
  AudioVisualizerSvg,
  TelemetryRealismGaugeSvg,
  ArchivalDossierSvg
} from './components/CustomSvgs';
import { SolisBrandMark } from '../../assets/svg/SolisBrandMark';
import { CircadianSolarArc } from '../../assets/svg/CircadianSolarArc';
import { EbbinghausRetentionChart } from '../../assets/svg/EbbinghausRetentionChart';
import { CognitiveCapacityGauge } from '../../assets/svg/CognitiveCapacityGauge';
import { ArchivalLibraryEngraving } from '../../assets/svg/ArchivalLibraryEngraving';
import './LandingPage.css';

const getPhaseInfo = (hour: number) => {
  if (hour >= 6 && hour < 12) {
    return {
      title: 'Dawn Horizon • Morning Intentionality',
      coord: `HORIZON +${Math.round((hour - 6) * 10)}°`,
      advice: 'Optimal state for creative formulation, deep syllabus architecture, and calibrating your daily priority.'
    };
  } else if (hour >= 12 && hour < 18) {
    return {
      title: 'Solar Zenith • High-Focus Execution',
      coord: `ZENITH +${Math.round(Math.max(60, 90 - Math.abs(hour - 13.5) * 10))}°`,
      advice: 'Austere Pomodoro study sanctuary in full effect. Zero notification bleed; channel energy into core problem sets.'
    };
  } else if (hour >= 18 && hour < 22) {
    return {
      title: 'Dusk Consolidation • Spaced Retrieval Review',
      coord: `DUSK -${Math.round((hour - 18) * 8)}°`,
      advice: 'Ebbinghaus SM-2 flashcard recall cycle active. Review high-yield notes before bedtime memory consolidation.'
    };
  } else {
    return {
      title: 'Midnight Nadir • Rest & Memory Synthesis',
      coord: `NADIR -${Math.round((hour >= 22 ? hour - 22 : hour + 2) * 12)}°`,
      advice: 'Cognitive recovery protocol. Your logged sessions persist — locally in Demo Mode or synced to your account — while the workstation rests until dawn.'
    };
  }
};

const formatSolarTime = (h: number) => {
  const hours = Math.floor(h);
  const mins = Math.round((h - hours) * 60);
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')} SOLAR TIME`;
};

interface FAQItem {
  question: string;
  answer: string;
}

interface FieldNoteItem {
  code: string;
  quote: string;
  author: string;
  role: string;
  institution: string;
  isFeatured?: boolean;
}

const FAQ_DATA: FAQItem[] = [
  {
    question: 'How is Solis fundamentally different from Notion, Obsidian, or Linear?',
    answer:
      'Unlike generic note apps (Notion/Obsidian) that require endless manual setup, or issue trackers (Linear) designed for software sprint backlogs, Solis is an integrated cognitive operating system built specifically for academic and technical mastery. It directly couples your daily time blocking to active recall flashcards (SM-2 algorithm), syllabus mastery tracking, and deterministic planning realism.'
  },
  {
    question: 'What is "Circadian Daylight Architecture"?',
    answer:
      'Solis synchronizes with your real biological solar hour. Morning hours emphasize creative deep work and syllabus expansion; solar zenith drives focused execution; twilight encourages deliberate review; and evening nadir activates memory consolidation and rest rituals without harsh notification disruptions.'
  },
  {
    question: 'How does the SM-2 Spaced Retrieval engine protect my memory?',
    answer:
      'Based on the Ebbinghaus forgetting curve, human memory decays exponentially without retrieval. Solis models memory half-lives for every topic, automatically resurfacing flashcards and core concepts right as recall probability drops toward 85%, ensuring maximum retention with minimal review time.'
  },
  {
    question: 'Is my data private, offline-accessible, and locally owned?',
    answer:
      'Yes. In Demo Mode, Solis keeps all of your data in browser localStorage on your device, so it survives page reloads without any account. Sign in and your data syncs to Supabase PostgreSQL with row-level security, so only you can read your rows. Full JSON and CSV exports let you take complete ownership of your notes, flashcards, and study logs at any time.'
  }
];

const SCHOLAR_FIELDNOTES: FieldNoteItem[] = [
  {
    code: 'NOTE // 01 • CAMBRIDGE NEUROSCIENCE',
    quote:
      'Solis dissolved the chaotic friction of 12 Notion databases and Anki decks into a singular, quiet daily ritual. One workspace for planning, focus, and recall means far less cognitive fatigue. It feels less like software and more like a private library desk.',
    author: 'Dr. Aris Vance',
    role: 'Postdoctoral Fellow in Neuroscience',
    institution: 'Cambridge University',
    isFeatured: true
  },
  {
    code: 'NOTE // 02 • ETH ZÜRICH',
    quote:
      'The planning realism ratio is brutally honest. It prevented me from scheduling 14 hours of impossible work and burning out. For the first time, weekly momentum compounds.',
    author: 'Elena Rostova',
    role: 'Distributed Systems Architect & Maintainer',
    institution: 'ETH Zürich / Open Core'
  },
  {
    code: 'NOTE // 03 • STANFORD MEDICINE',
    quote:
      'The circadian daylight architecture keeps my energy aligned. Entering the Focus Pod during zenith locks me into deliberate flow. The most disciplined tool on my workstation.',
    author: 'Marcus Chen',
    role: 'MD Candidate (USMLE Step 1 Scholar)',
    institution: 'Stanford Medical'
  }
];

const CIRCADIAN_RITUAL_STEPS = [
  {
    phase: 'Dawn Horizon',
    time: '07:15 SOLAR TIME',
    solarCoordinate: 'HORIZON +12°',
    icon: Sunset,
    color: 'var(--color-coral-400)',
    title: '01 • Calibrate Intention',
    principle: 'Cognitive Capacity Ceiling',
    description:
      'Anchor one primary intellectual priority for the solar day. Solis enforces realistic cognitive capacity limits (5.5h max deep work) so you never plan for defeat.'
  },
  {
    phase: 'Solar Zenith',
    time: '13:30 SOLAR TIME',
    solarCoordinate: 'ZENITH +78°',
    icon: Sun,
    color: 'var(--color-amber-400)',
    title: '02 • Focus Sanctuary Pod',
    principle: 'Binaural Flow Isolation',
    description:
      'Enter an austere study pod with generative ambient soundscapes. Study sessions consolidate directly into academic curriculum hours with zero notification bleed.'
  },
  {
    phase: 'Dusk Consolidation',
    time: '21:00 SOLAR TIME',
    solarCoordinate: 'NADIR -24°',
    icon: Moon,
    color: 'var(--color-lavender-400)',
    title: '03 • Spaced Retrieval Review',
    principle: 'Ebbinghaus Decay Intercept',
    description:
      'Resurface high-yield SM-2 flashcards right as recall probability drops toward 85%. Inspect objective velocity telemetry with zero schedule drift.'
  }
];

const INSTITUTIONS = [
  { name: 'Cambridge', department: 'Cavendish Lab' },
  { name: 'Stanford', department: 'Medicine' },
  { name: 'Oxford', department: 'Mathematics' },
  { name: 'ETH Zürich', department: 'Distributed Systems' },
  { name: 'MIT', department: 'CSAIL' },
  { name: 'Caltech', department: 'Physics' }
];

export const LandingPage: React.FC = () => {
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(0);
  const [selectedSoundscape, setSelectedSoundscape] = useState<string>('Rain on Skylight');
  const [solarHour, setSolarHour] = useState<number>(13.5);

  const activePhase = getPhaseInfo(solarHour);

  const toggleFaq = (index: number) => {
    setOpenFaqIndex((prev) => (prev === index ? null : index));
  };

  // Card pointer-following spotlight effect handler
  const handleCardMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div className="solis-landing">
      {/* Subtle Perlin Noise Overlay — Removes sterile digital flatness */}
      <svg className="solis-sr-only" aria-hidden="true">
        <filter id="solis-perlin-noise">
          <feTurbulence type="fractalNoise" baseFrequency="0.75" numOctaves="3" stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 1   0 0 0 0 1   0 0 0 0 1  0 0 0 0.035 0" />
        </filter>
      </svg>
      <div className="solis-noise-overlay" aria-hidden="true" />

      {/* 01 // HERO ARRIVAL SECTION */}
      <section className="solis-landing-hero">
        <GridBackgroundSvg className="solis-hero-grid" />
        <div className="solis-hero-watermark" aria-hidden="true">
          SOLIS
        </div>

        <Container>
          <ScrollReveal delayMs={0}>
            <div className="solis-hero-badge-wrap" data-cursor="examine">
              <SolisBrandMark size={48} className="solis-hero-brandmark" />
            </div>
            <div className="solis-hero-eyebrow">
              <span className="solis-eyebrow-pip" aria-hidden="true" />
              <span>Living Circadian Operating System • Local Demo, Cloud Sync</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={30}>
            <h1 className="solis-hero-title">
              An operating system for serious scholars and builders{' '}
              <em>who cultivate lifelong mastery.</em>
            </h1>
          </ScrollReveal>

          <ScrollReveal delayMs={60}>
            <p className="solis-hero-lead">
              Synthesize deep knowledge, master complex disciplines, and maintain effortless daily
              momentum in a personal learning sanctuary — without notification clutter or productive procrastination.
            </p>
          </ScrollReveal>

          <ScrollReveal delayMs={90}>
            <div className="solis-hero-actions">
              <Link to="/app/dashboard" data-cursor="action">
                <Button variant="accent" size="lg" className="tactile-press" rightIcon={<ArrowRight size={16} />}>
                  Enter Solis Workspace
                  <span className="solis-keycap-hint">↵ Return</span>
                </Button>
              </Link>
              <Link to="/auth/signup" data-cursor="action">
                <Button variant="outline" size="lg" className="tactile-press">
                  Create Study Sanctuary
                </Button>
              </Link>
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={110}>
            <div className="solis-hero-proof">
              <span className="solis-proof-item">
                <ShieldCheck size={14} color="var(--color-coral-400)" />
                Local Demo Mode • Secure Cloud Sync
              </span>
              <span className="solis-proof-item">
                <Lock size={14} color="var(--color-amber-400)" />
                Zero Tracking or Ads
              </span>
              <span className="solis-proof-item">
                <Zap size={14} color="var(--color-sage-400)" />
                SM-2 SuperMemo Spaced Retrieval
              </span>
            </div>
          </ScrollReveal>

          {/* THE SHOWPIECE: LIVE INTERACTIVE COCKPIT SIMULATOR */}
          <ScrollReveal delayMs={130}>
            <div id="interactive-preview" data-cursor="examine">
              <InteractiveCockpitPreview />
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* 02 // INSTITUTIONAL GUILD MARKS */}
      <section className="solis-social-proof-strip">
        <Container>
          <div className="solis-proof-header">
            <span className="solis-proof-label">
              ARCHITECTED FOR SERIOUS RESEARCHERS & SCHOLARS
            </span>
          </div>
          <div className="solis-institution-row">
            {INSTITUTIONS.map((inst) => (
              <div key={inst.name} className="solis-institution-item">
                <span className="solis-inst-name">{inst.name}</span>
                <span className="solis-inst-dept">// {inst.department}</span>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* 03 // THE 3-PHASE CIRCADIAN RITUAL FLOW */}
      <section className="solis-ritual-section">
        <Container>
          <div className="solis-section-header">
            <span className="solis-section-eyebrow">Circadian Chronobiology</span>
            <h2 className="solis-section-title">
              How Solis harmonizes your intellectual day.
            </h2>
            <p className="solis-section-lead">
              Human cognition follows biological solar rhythms. Solis transforms time management
              from stressful artificial deadlines into calm, compounding flow.
            </p>
          </div>

          {/* THE LIVING CIRCADIAN INSTRUMENT: LIVE SOLAR SIMULATOR */}
          <ScrollReveal delayMs={30}>
            <div className="solis-circadian-live-instrument">
              <div className="solis-circadian-header">
                <div className="solis-circadian-title-group">
                  <span className="solis-circadian-live-badge">
                    <span className="solis-live-dot" /> LIVE SOLAR SIMULATOR
                  </span>
                  <h3 className="solis-circadian-active-phase">{activePhase.title}</h3>
                </div>
                <div className="solis-circadian-time-display">
                  <span className="solis-circadian-clock-val">{formatSolarTime(solarHour)}</span>
                  <span className="solis-circadian-coord-val">{activePhase.coord}</span>
                </div>
              </div>

              <div className="solis-circadian-viz-split">
                <div className="solis-circadian-arc-wrapper" data-cursor="examine">
                  <CircadianSolarArc currentHour={solarHour} />
                </div>
                <div className="solis-circadian-gauge-wrapper">
                  <CognitiveCapacityGauge
                    allocatedHours={Number((Math.min(5.5, Math.max(1.0, (solarHour - 6) * 0.45))).toFixed(1))}
                    maxHours={5.5}
                  />
                  <div className="solis-circadian-advice-pill">
                    <span className="solis-advice-label">COGNITIVE PROTOCOL:</span>
                    <span className="solis-advice-text">{activePhase.advice}</span>
                  </div>
                </div>
              </div>

              <div className="solis-circadian-slider-row">
                <span className="solis-slider-bound">06:00 DAWN</span>
                <input
                  type="range"
                  min={6}
                  max={23}
                  step={0.5}
                  value={solarHour}
                  onChange={(e) => setSolarHour(parseFloat(e.target.value))}
                  className="solis-solar-slider"
                  data-cursor="drag"
                  aria-label="Solar time simulator scrubber"
                />
                <span className="solis-slider-bound">23:00 NIGHT</span>
              </div>
            </div>
          </ScrollReveal>

          <div className="solis-ritual-timeline">
            {CIRCADIAN_RITUAL_STEPS.map((step, idx) => {
              const IconComp = step.icon;
              return (
                <ScrollReveal key={step.phase} delayMs={idx * 70}>
                  <div
                    className="solis-ritual-cell"
                    onMouseMove={handleCardMouseMove}
                  >
                    <div className="solis-ritual-meta">
                      <div className="solis-ritual-time-badge">
                        <IconComp size={13} color={step.color} />
                        <span>{step.time}</span>
                      </div>
                      <span className="solis-ritual-coord">{step.solarCoordinate}</span>
                    </div>

                    <h3 className="solis-ritual-cell-title">{step.title}</h3>
                    <div className="solis-ritual-principle">{step.principle}</div>
                    <p className="solis-ritual-cell-desc">{step.description}</p>
                  </div>
                </ScrollReveal>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 04 // THE COGNITIVE CONTRAST: SWISS DUAL-COLUMN LEDGER */}
      <section id="philosophy" className="solis-contrast-section">
        <Container>
          <div className="solis-section-header">
            <span className="solis-section-eyebrow">Forensic Comparison</span>
            <h2 className="solis-section-title">
              Why traditional productivity tools fracture your attention.
            </h2>
            <p className="solis-section-lead">
              Most modern software is engineered for corporate ticket triage, vanity streaks, and ad-driven engagement.
              Solis is handcrafted exclusively for deep study, long-term memory, and calm intellectual velocity.
            </p>
          </div>

          {/* Architectural Instrument Dossier Vector Diagram */}
          <ScrollReveal delayMs={80}>
            <div className="solis-dossier-wrapper">
              <ArchivalDossierSvg />
            </div>
          </ScrollReveal>

          {/* Swiss Dual-Column Ledger (Zero Generic Red/Green Clichés) */}
          <div className="solis-ledger-grid">
            {/* The Conventional Fragmentation */}
            <div className="solis-ledger-col solis-ledger-col--noise">
              <div className="solis-ledger-col-header">
                <span className="solis-ledger-badge solis-ledger-badge--noise">
                  CONVENTIONAL TOOL FRAGMENTATION
                </span>
                <span className="solis-ledger-subcode">// DEFECT_INVENTORY</span>
              </div>
              <h3 className="solis-ledger-title">The Attention Trap</h3>
              
              <div className="solis-ledger-rows">
                <div className="solis-ledger-row">
                  <span className="solis-ledger-marker solis-ledger-marker--noise">
                    <Minus size={13} />
                  </span>
                  <div>
                    <strong>Superficial Task Sprawl:</strong> 50 disconnected tasks with artificial urgency and red notification badges that trigger chronic dopamine spikes and guilt.
                  </div>
                </div>
                <div className="solis-ledger-row">
                  <span className="solis-ledger-marker solis-ledger-marker--noise">
                    <Minus size={13} />
                  </span>
                  <div>
                    <strong>Passive Note-Hoarding:</strong> Saving thousands of articles and bookmarks into a digital graveyard that are forgotten 48 hours later.
                  </div>
                </div>
                <div className="solis-ledger-row">
                  <span className="solis-ledger-marker solis-ledger-marker--noise">
                    <Minus size={13} />
                  </span>
                  <div>
                    <strong>Productive Procrastination:</strong> Spending hours tweaking databases, properties, and color palettes instead of doing the actual cognitive work.
                  </div>
                </div>
                <div className="solis-ledger-row">
                  <span className="solis-ledger-marker solis-ledger-marker--noise">
                    <Minus size={13} />
                  </span>
                  <div>
                    <strong>Uncalibrated Planning Fantasies:</strong> Scheduling 14 hours of impossible daily work without velocity calibration, leading to chronic burnout.
                  </div>
                </div>
              </div>
            </div>

            {/* The Solis Protocol */}
            <div className="solis-ledger-col solis-ledger-col--sanctuary">
              <div className="solis-ledger-col-header">
                <span className="solis-ledger-badge solis-ledger-badge--sanctuary">
                  THE SOLIS OPERATING SYSTEM
                </span>
                <span className="solis-ledger-subcode solis-ledger-subcode--accent">// VERIFIED_PROTOCOL</span>
              </div>
              <h3 className="solis-ledger-title">Calm Cognitive Sanctuary</h3>

              <div className="solis-ledger-rows">
                <div className="solis-ledger-row">
                  <span className="solis-ledger-marker solis-ledger-marker--sanctuary">
                    <Check size={13} />
                  </span>
                  <div>
                    <strong>Singular Daily Intention:</strong> Anchor one primary priority for the solar day with circadian daylight rhythm and enforced capacity limits.
                  </div>
                </div>
                <div className="solis-ledger-row">
                  <span className="solis-ledger-marker solis-ledger-marker--sanctuary">
                    <Check size={13} />
                  </span>
                  <div>
                    <strong>Active Recall & Ebbinghaus Defense:</strong> Automatic SM-2 flashcard scheduling computes memory half-life decay to prevent forgetting before it starts.
                  </div>
                </div>
                <div className="solis-ledger-row">
                  <span className="solis-ledger-marker solis-ledger-marker--sanctuary">
                    <Check size={13} />
                  </span>
                  <div>
                    <strong>Instant Focus Flow:</strong> Zero friction between finding what to study and entering a distraction-free Pomodoro sanctuary with ambient audio.
                  </div>
                </div>
                <div className="solis-ledger-row">
                  <span className="solis-ledger-marker solis-ledger-marker--sanctuary">
                    <Check size={13} />
                  </span>
                  <div>
                    <strong>Deterministic Realism:</strong> Objective velocity telemetry (T_actual / T_planned ratio) calibrates honest, compound weekly progress.
                  </div>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 05 // ASYMMETRICAL 4-ENGINE INSTRUMENT CONSOLE */}
      <section id="experience" className="solis-bento-section">
        <Container>
          <div className="solis-section-header">
            <span className="solis-section-eyebrow">Architectural Subsystems</span>
            <h2 className="solis-section-title">
              Four unified disciplines of deliberate study.
            </h2>
            <p className="solis-section-lead">
              Each subsystem is designed from cognitive science principles to turn high ambitions into compound intellectual capital.
            </p>
          </div>

          <div className="solis-console-grid">
            {/* Engine 01: HERO FEATURE (Dominant Span) */}
            <div
              className="solis-console-panel solis-console-panel--hero"
              onMouseMove={handleCardMouseMove}
            >
              <div className="solis-console-content">
                <span className="solis-console-tag">
                  <Layers size={13} /> ENGINE 01 • CURRICULUM ARCHITECTURE
                </span>
                <h3 className="solis-console-title">Knowledge Disciplines & Exam Horizons</h3>
                <p className="solis-console-desc">
                  Organize complex academic subjects into structured topic hierarchies. Solis dynamically tracks
                  mastery across weeks, balancing lecture synthesis, problem sets, and approaching exam deadlines
                  with deterministic completion milestones.
                </p>
                <div className="solis-console-stats">
                  <div className="solis-stat-chip">
                    <span className="solis-stat-val">42</span>
                    <span className="solis-stat-lbl">Syllabus Chapters</span>
                  </div>
                  <div className="solis-stat-chip">
                    <span className="solis-stat-val">94.2%</span>
                    <span className="solis-stat-lbl">Mastery Level</span>
                  </div>
                  <div className="solis-stat-chip">
                    <span className="solis-stat-val">JSON</span>
                    <span className="solis-stat-lbl">/ CSV Data Export</span>
                  </div>
                </div>
              </div>

              <div className="solis-console-display solis-console-display--wide">
                <SynapseNetworkSvg />
              </div>
            </div>

            {/* Engine 02: Retention Defense */}
            <div
              className="solis-console-panel"
              onMouseMove={handleCardMouseMove}
            >
              <div className="solis-console-content">
                <span className="solis-console-tag">
                  <RefreshCw size={13} /> ENGINE 02 • RETENTION DEFENSE
                </span>
                <h3 className="solis-console-title">SM-2 Spaced Retrieval & Active Recall</h3>
                <p className="solis-console-desc">
                  Never forget a derivation or system invariant again. Solis computes memory half-life decay
                  and prompts high-yield concept review right before forgetting occurs.
                </p>
              </div>

              <div className="solis-console-display" data-cursor="examine">
                <EbbinghausRetentionChart />
              </div>
            </div>

            {/* Engine 03: Cognitive Immersion */}
            <div
              className="solis-console-panel"
              onMouseMove={handleCardMouseMove}
            >
              <div className="solis-console-content">
                <span className="solis-console-tag">
                  <Flame size={13} /> ENGINE 03 • COGNITIVE IMMERSION
                </span>
                <h3 className="solis-console-title">The Focus Sanctuary Room</h3>
                <p className="solis-console-desc">
                  Step out of notifications and into a distraction-free Pomodoro study pod. Embedded ambient soundscapes
                  (Rain, Vinyl, Deep Space) cultivate flow, while sessions auto-log directly to your subject hours.
                </p>
              </div>

              <div className="solis-console-display solis-console-display--vertical">
                <div className="solis-display-header">
                  <span className="solis-display-status">POD STATUS // ACTIVE</span>
                  <span className="solis-display-timer">25:00</span>
                </div>
                <AudioVisualizerSvg />
                <div className="solis-soundscape-pills">
                  {['Rain on Skylight', 'Deep Space Orbit', 'Quiet Library'].map((sound) => (
                    <button
                      key={sound}
                      type="button"
                      className={`solis-soundscape-pill ${selectedSoundscape === sound ? 'solis-soundscape-pill--active' : ''}`}
                      onClick={() => setSelectedSoundscape(sound)}
                      data-cursor="action"
                    >
                      {sound}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Engine 04: Deterministic Realism */}
            <div
              className="solis-console-panel"
              onMouseMove={handleCardMouseMove}
            >
              <div className="solis-console-content">
                <span className="solis-console-tag">
                  <Cpu size={13} /> ENGINE 04 • PLANNING REALISM
                </span>
                <h3 className="solis-console-title">Deterministic Momentum & Review</h3>
                <p className="solis-console-desc">
                  No opaque AI black boxes. Solis derives daily velocity deterministically across 4 weighted pillars:
                  task velocity (30%), study volume (30%), deep focus (20%), and ritual consistency (20%).
                </p>
              </div>

              <div className="solis-console-display solis-console-display--vertical" data-cursor="examine">
                <TelemetryRealismGaugeSvg />
                <span className="solis-telemetry-caption">
                  5.2h logged / 5.5h scheduled • Zero Schedule Drift
                </span>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* 06 // ARCHIVAL FIELD NOTES (SCHOLAR TESTIMONIALS) */}
      <section className="solis-testimonials-section">
        <Container>
          <div className="solis-section-header">
            <span className="solis-section-eyebrow">Empirical Verification</span>
            <h2 className="solis-section-title">
              Tested by serious researchers and engineers.
            </h2>
            <p className="solis-section-lead">
              Field reports from graduate scholars, system engineers, and medical students compounding intellectual momentum.
            </p>
          </div>

          <div className="solis-fieldnotes-grid">
            {SCHOLAR_FIELDNOTES.map((t, idx) => (
              <ScrollReveal key={t.code} delayMs={idx * 80}>
                <div
                  className={`solis-fieldnote-cell ${t.isFeatured ? 'solis-fieldnote-cell--featured' : ''}`}
                  onMouseMove={handleCardMouseMove}
                  data-cursor="examine"
                >
                  <span className="solis-fieldnote-tag">{t.code}</span>
                  <blockquote className="solis-fieldnote-quote">“{t.quote}”</blockquote>
                  <div className="solis-fieldnote-author">
                    <div className="solis-fieldnote-name">{t.author}</div>
                    <div className="solis-fieldnote-role">{t.role}</div>
                    <div className="solis-fieldnote-inst">{t.institution}</div>
                  </div>
                </div>
              </ScrollReveal>
            ))}
          </div>
        </Container>
      </section>

      {/* 07 // THE SCHOLAR'S MANIFESTO */}
      <section id="manifesto" className="solis-manifesto-section">
        <Container>
          <div className="solis-manifesto-engraving-plate" data-cursor="examine">
            <ArchivalLibraryEngraving />
            <div className="solis-engraving-caption">
              <span>FIG. 04 // THE SCHOLAR'S COMMONPLACE WORKSTATION</span>
              <span>• SACRED INTELLECTUAL SANCTUARY</span>
            </div>
          </div>

          <blockquote className="solis-manifesto-quote">
            “Order is not pressure; it is the calm canvas upon which deep mastery is composed.”
          </blockquote>
          <span className="solis-manifesto-author">
            SOLIS OPERATING PHILOSOPHY — VOLUME I
          </span>

          <div className="solis-manifesto-triad">
            <div className="solis-triad-col">
              <h4 className="solis-triad-heading">
                <Compass size={15} color="var(--color-coral-400)" />
                01 • Calm Cognition
              </h4>
              <p className="solis-triad-text">
                Your workstation should be a quiet sanctuary, not an attention casino. Solis eliminates unread count badges,
                push urgency, and addictive algorithmic feeds.
              </p>
            </div>

            <div className="solis-triad-col">
              <h4 className="solis-triad-heading">
                <BookOpen size={15} color="var(--color-amber-400)" />
                02 • True Retention
              </h4>
              <p className="solis-triad-text">
                Reading without active retrieval is the illusion of competence. Every note in Solis connects
                seamlessly to flashcards, concept quizzes, and spaced resurfacing.
              </p>
            </div>

            <div className="solis-triad-col">
              <h4 className="solis-triad-heading">
                <Lock size={15} color="var(--color-sage-400)" />
                03 • Sovereign Knowledge
              </h4>
              <p className="solis-triad-text">
                Your intellectual work belongs to you. Data stays local in Demo Mode, syncs to your account with
                row-level security, and full JSON/CSV export means zero vendor lock-in.
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* 08 // ARCHITECTURAL TRANSPARENCY & FAQ */}
      <section id="sanctuary" className="solis-faq-section">
        <Container size="narrow">
          <div className="solis-section-header">
            <span className="solis-section-eyebrow">Technical Architecture</span>
            <h2 className="solis-section-title">
              Frequently Clarified Inquiries
            </h2>
          </div>

          <div className="solis-faq-list">
            {FAQ_DATA.map((item, idx) => {
              const isOpen = openFaqIndex === idx;
              return (
                <div key={item.question} className="solis-faq-item">
                  <button
                    type="button"
                    className="solis-faq-trigger"
                    onClick={() => toggleFaq(idx)}
                    aria-expanded={isOpen}
                    data-cursor="action"
                  >
                    <span>{item.question}</span>
                    <ChevronDown
                      size={16}
                      style={{
                        transform: isOpen ? 'rotate(180deg)' : 'none',
                        transition: 'transform 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
                        flexShrink: 0
                      }}
                    />
                  </button>
                  <AnimatePresence initial={false}>
                    {isOpen && (
                      <motion.div
                        key="content"
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                        className="solis-faq-answer-wrapper"
                      >
                        <div className="solis-faq-answer">
                          <p style={{ margin: 0 }}>{item.answer}</p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        </Container>
      </section>

      {/* 09 // HEROIC FINAL LAUNCH SANCTUARY */}
      <section className="solis-launch-sanctuary">
        <Container>
          <ScrollReveal delayMs={90} direction="up">
            <div className="solis-launch-box" onMouseMove={handleCardMouseMove}>
              <h2 className="solis-launch-title">
                Experience the Daily Flow.
              </h2>
              <p className="solis-launch-sub">
                Step into your personal study operating system and cultivate lifelong intellectual momentum.
              </p>
              <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/app/dashboard" data-cursor="action">
                  <Button variant="accent" size="lg" className="tactile-press" rightIcon={<Compass size={16} />}>
                    Enter Solis Workspace
                    <span className="solis-keycap-hint">↵ Return</span>
                  </Button>
                </Link>
                <Link to="/auth/signup" data-cursor="action">
                  <Button variant="outline" size="lg" className="tactile-press">
                    Create Study Sanctuary
                  </Button>
                </Link>
              </div>
            </div>
          </ScrollReveal>
        </Container>
      </section>
    </div>
  );
};

export default LandingPage;
