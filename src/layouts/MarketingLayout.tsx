import React, { useState, useEffect } from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/Button/Button';
import { Logo } from '../components/ui/Logo/Logo';
import { Container } from '../components/layout/Container/Container';
import { AtmosphereCanvas } from '../components/layout/AtmosphereCanvas/AtmosphereCanvas';
import { APP_CONFIG } from '../config/app.config';
import { MARKETING_NAVIGATION } from '../constants/navigation';
import { cn } from '../utils/classNames';
import './MarketingLayout.css';

export const MarketingLayout: React.FC = () => {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 24) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    handleScroll();
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="solis-marketing-layout">
      <AtmosphereCanvas intensity="subtle" />

      {/* Context-Aware Floating Header with Scroll Transformation */}
      <header
        className={cn(
          'solis-marketing-nav',
          isScrolled && 'solis-marketing-nav--scrolled'
        )}
      >
        <Container className="solis-marketing-nav__container">
          <Logo
            to="/"
            variant={isScrolled ? 'auto' : 'hero'}
            size="md"
          />

          <nav className="solis-marketing-links" aria-label="Marketing Navigation">
            {MARKETING_NAVIGATION.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className={cn(
                  'solis-marketing-link',
                  !isScrolled && 'solis-marketing-link--hero'
                )}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="solis-marketing-actions">
            <Link to="/auth/login">
              <Button
                variant="ghost"
                size="sm"
                className={cn(!isScrolled && 'solis-marketing-btn--hero-ghost')}
              >
                Sign In
              </Button>
            </Link>
            <Link to="/app/dashboard">
              <Button variant="accent" size="sm" rightIcon={<ArrowRight size={14} />}>
                Launch App
              </Button>
            </Link>
          </div>
        </Container>
      </header>

      {/* Main Page Slot */}
      <main className="solis-marketing-main">
        <Outlet />
      </main>

      {/* Editorial Calm Multi-Column Footer */}
      <footer className="solis-marketing-footer">
        <Container>
          <div className="solis-marketing-footer__top">
            <div className="solis-marketing-footer__brand">
              <Logo variant="auto" size="md" />
              <p className="solis-marketing-footer__copy" style={{ maxWidth: '300px', marginTop: '8px' }}>
                The Personal Study & Productivity Operating System for lifelong scholars, researchers, and builders.
              </p>
              <div className="solis-footer-status">
                <span className="solis-status-dot" />
                <span>Local Subsystems Active • Sub-ms IndexedDB</span>
              </div>
            </div>

            <div className="solis-marketing-footer__nav-cols">
              <div className="solis-footer-col">
                <h4 className="solis-footer-col-title">Engines</h4>
                <ul className="solis-footer-col-list">
                  <li><a href="/#experience">Curriculum Architecture</a></li>
                  <li><a href="/#experience">SM-2 Spaced Retrieval</a></li>
                  <li><a href="/#experience">Focus Sanctuary Pods</a></li>
                  <li><a href="/#experience">Deterministic Realism</a></li>
                </ul>
              </div>

              <div className="solis-footer-col">
                <h4 className="solis-footer-col-title">Principles</h4>
                <ul className="solis-footer-col-list">
                  <li><a href="/#philosophy">Circadian Chronobiology</a></li>
                  <li><a href="/#philosophy">Ebbinghaus Retention</a></li>
                  <li><a href="/#manifesto">Calm Cognition Manifesto</a></li>
                  <li><a href="/#sanctuary">Local-First Sovereignty</a></li>
                </ul>
              </div>

              <div className="solis-footer-col">
                <h4 className="solis-footer-col-title">Workspace</h4>
                <ul className="solis-footer-col-list">
                  <li><Link to="/app/dashboard">Enter Dashboard</Link></li>
                  <li><Link to="/auth/login">Scholar Sign In</Link></li>
                  <li><Link to="/auth/signup">Create Sanctuary</Link></li>
                  <li><a href="/#sanctuary">Technical FAQ</a></li>
                </ul>
              </div>
            </div>
          </div>

          <div className="solis-marketing-footer__bottom">
            <p className="solis-marketing-footer__copy">
              © {new Date().getFullYear()} {APP_CONFIG.name}. Built with deliberate precision for calm cognition.
            </p>
            <div className="solis-footer-bottom-badges">
              <span className="solis-badge-tiny">Zero Trackers</span>
              <span className="solis-badge-tiny">Local-First</span>
              <span className="solis-badge-tiny">MIT/Apache</span>
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};
