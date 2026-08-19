import React from 'react';
import { Link } from 'react-router-dom';
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Flame,
  Target,
  Compass,
  Layers,
  ShieldCheck,
  Zap
} from 'lucide-react';
import { Button } from '../../components/ui/Button/Button';
import { Badge } from '../../components/ui/Badge/Badge';
import { Container } from '../../components/layout/Container/Container';
import { ScrollReveal } from '../../components/motion/ScrollReveal';
import { ParallaxLayer } from '../../components/parallax/ParallaxLayer';
import { Progress } from '../../components/ui/Progress/Progress';
import './LandingPage.css';

export const LandingPage: React.FC = () => {
  return (
    <div className="solis-landing">
      {/* Hero Section */}
      <section className="solis-landing-hero">
        <Container>
          <ScrollReveal delayMs={50}>
            <div className="solis-landing-tag">
              <Sparkles size={14} color="var(--color-coral-500)" />
              <span>Solis OS • Personal Study & Knowledge Sanctuary</span>
            </div>
          </ScrollReveal>

          <ScrollReveal delayMs={150}>
            <h1 className="solis-landing-title">
              A quiet room for <em>ambitious minds</em>.
            </h1>
          </ScrollReveal>

          <ScrollReveal delayMs={250}>
            <p className="solis-landing-lead">
              Synthesize deep knowledge, master complex disciplines, and maintain effortless daily
              momentum in a personal learning sanctuary.
            </p>
          </ScrollReveal>

          <ScrollReveal delayMs={350}>
            <div className="solis-landing-ctas">
              <Link to="/app/dashboard">
                <Button variant="accent" size="lg" rightIcon={<ArrowRight size={16} />}>
                  Enter Solis Workspace
                </Button>
              </Link>
              <Link to="/auth/signup">
                <Button variant="outline" size="lg">
                  Create Study Sanctuary
                </Button>
              </Link>
            </div>
          </ScrollReveal>

          {/* Interactive Atmospheric Preview Card */}
          <ScrollReveal delayMs={450}>
            <div className="solis-landing-preview-wrapper">
              <ParallaxLayer speed={0.03}>
                <div className="solis-landing-preview-card">
                  <div className="solis-landing-preview-glow" />

                  <div className="solis-landing-preview-inner">
                    {/* Left preview pane: Context & Flow */}
                    <div style={{ textAlign: 'left' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                        <Badge variant="coral" showDot>
                          Morning Flow State
                        </Badge>
                        <span style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>
                          84% Momentum
                        </span>
                      </div>
                      <h3
                        style={{
                          fontFamily: 'var(--font-display)',
                          fontSize: 'var(--text-heading-2)',
                          marginBottom: '8px',
                          color: 'var(--text-primary)'
                        }}
                      >
                        Distributed Systems & Consensus
                      </h3>
                      <p
                        style={{
                          fontSize: 'var(--text-body-sm)',
                          color: 'var(--text-secondary)',
                          marginBottom: '20px',
                          lineHeight: '1.6'
                        }}
                      >
                        Deep focus session queued: Raft consensus invariants, leader election, and active recall.
                      </p>

                      <div style={{ marginBottom: '16px' }}>
                        <Progress value={68} variant="momentum" label="Weekly Target (8.5 / 12 hrs)" showValueText />
                      </div>

                      <div style={{ display: 'flex', gap: '8px' }}>
                        <Link to="/app/focus">
                          <Button variant="primary" size="sm" leftIcon={<Flame size={14} />}>
                            Begin 25m Pomodoro
                          </Button>
                        </Link>
                        <Link to="/app/tasks">
                          <Button variant="subtle" size="sm">
                            Inspect 3 Tasks
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {/* Right preview pane: Calm Metrics */}
                    <div
                      style={{
                        backgroundColor: 'var(--bg-surface-secondary)',
                        borderRadius: 'var(--radius-md)',
                        padding: 'var(--space-md)',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        border: '1px solid var(--border-subtle)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontSize: 'var(--text-caption)', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          TODAY’S CONSTELLATION
                        </span>
                        <Badge variant="sage">On Track</Badge>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '12px', margin: '16px 0' }}>
                        <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>Focus Time</div>
                          <div style={{ fontSize: 'var(--text-heading-3)', fontWeight: 700, color: 'var(--text-primary)' }}>3.4 hrs</div>
                        </div>
                        <div style={{ background: '#fff', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-subtle)' }}>
                          <div style={{ fontSize: 'var(--text-caption)', color: 'var(--text-muted)' }}>Habit Streak</div>
                          <div style={{ fontSize: 'var(--text-heading-3)', fontWeight: 700, color: 'var(--color-coral-500)' }}>12 Days</div>
                        </div>
                      </div>

                      <div style={{ fontSize: 'var(--text-micro)', color: 'var(--text-muted)', textAlign: 'center' }}>
                        Designed with zero notification clutter
                      </div>
                    </div>
                  </div>
                </div>
              </ParallaxLayer>
            </div>
          </ScrollReveal>
        </Container>
      </section>

      {/* Four Pillars Section */}
      <section id="philosophy" className="solis-landing-section">
        <Container>
          <div className="solis-landing-section-header">
            <Badge variant="neutral" style={{ marginBottom: '8px' }}>
              Four Pillars
            </Badge>
            <h2
              style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-heading-1)',
                color: 'var(--text-primary)',
                marginBottom: '8px'
              }}
            >
              The Architecture of Calm Cognition
            </h2>
            <p style={{ color: 'var(--text-secondary)', fontSize: 'var(--text-body-sm)' }}>
              Built from first principles to sustain deep intellectual work without mental fatigue.
            </p>
          </div>

          <div className="solis-pillars-grid">
            <ScrollReveal delayMs={100}>
              <div className="solis-pillar-card">
                <div className="solis-pillar-icon solis-pillar-icon--coral">
                  <CheckCircle2 size={20} />
                </div>
                <h3 className="solis-pillar-title">Task Sanctuary</h3>
                <p className="solis-pillar-desc">
                  Prioritize what matters today. Minimalist, uncluttered task queues with intentional sub-task breakdown.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delayMs={200}>
              <div className="solis-pillar-card">
                <div className="solis-pillar-icon solis-pillar-icon--amber">
                  <BookOpen size={20} />
                </div>
                <h3 className="solis-pillar-title">Study Sessions</h3>
                <p className="solis-pillar-desc">
                  Subject-based time allocation, active recall scheduling, and continuous retention tracking.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delayMs={300}>
              <div className="solis-pillar-card">
                <div className="solis-pillar-icon solis-pillar-icon--lavender">
                  <Flame size={20} />
                </div>
                <h3 className="solis-pillar-title">Deep Flow Pods</h3>
                <p className="solis-pillar-desc">
                  Immersive Pomodoro and custom timer environments designed with atmospheric light to minimize distraction.
                </p>
              </div>
            </ScrollReveal>

            <ScrollReveal delayMs={400}>
              <div className="solis-pillar-card">
                <div className="solis-pillar-icon solis-pillar-icon--sage">
                  <Target size={20} />
                </div>
                <h3 className="solis-pillar-title">Long-term Horizons</h3>
                <p className="solis-pillar-desc">
                  Connect daily micro-efforts directly to semester milestones and multi-year intellectual aspirations.
                </p>
              </div>
            </ScrollReveal>
          </div>
        </Container>
      </section>

      {/* Engineering Philosophy Banner */}
      <section id="architecture" className="solis-landing-section">
        <Container>
          <div className="solis-philosophy-banner">
            <div className="solis-philosophy-glow" />

            <div style={{ maxWidth: '680px', position: 'relative', zIndex: 1 }}>
              <Badge variant="charcoal" style={{ backgroundColor: 'rgba(255,255,255,0.1)', color: '#fff', marginBottom: '16px' }}>
                Engineering Rigor
              </Badge>
              <h2
                style={{
                  fontFamily: 'var(--font-display)',
                  fontSize: 'var(--text-heading-1)',
                  color: 'var(--color-ivory-50)',
                  marginBottom: '16px'
                }}
              >
                Not a generic SaaS dashboard with cards everywhere.
              </h2>
              <p
                style={{
                  fontFamily: 'var(--font-interface)',
                  fontSize: 'var(--text-body)',
                  color: 'var(--color-charcoal-300)',
                  lineHeight: '1.7',
                  marginBottom: '24px'
                }}
              >
                Every token, surface, and component in Solis is designed with deliberate visual hierarchy.
                Warm ivory canvas, deep charcoal typography, and subtle coral momentum glows compose a sanctuary where your mind can focus without sensory overload.
              </p>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ivory-50)', fontSize: 'var(--text-body-sm)' }}>
                  <ShieldCheck size={16} color="var(--color-coral-500)" />
                  <span>Accessible WCAG AA contrast</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ivory-50)', fontSize: 'var(--text-body-sm)' }}>
                  <Zap size={16} color="var(--color-amber-500)" />
                  <span>Sub-millisecond local state</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--color-ivory-50)', fontSize: 'var(--text-body-sm)' }}>
                  <Layers size={16} color="var(--color-lavender-500)" />
                  <span>Layered Data Abstraction</span>
                </div>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* CTA Section */}
      <section id="roadmap" className="solis-landing-section" style={{ textAlign: 'center', paddingBottom: 'var(--space-4xl)' }}>
        <Container size="narrow">
          <h2
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 'var(--text-heading-1)',
              color: 'var(--text-primary)',
              marginBottom: '12px'
            }}
          >
            Experience the Daily Flow.
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', fontSize: 'var(--text-body)' }}>
            Enter the Phase 1 interactive foundation and explore the architectural shell.
          </p>
          <Link to="/app/dashboard">
            <Button variant="primary" size="lg" rightIcon={<Compass size={18} />}>
              Open Daily Overview
            </Button>
          </Link>
        </Container>
      </section>
    </div>
  );
};
