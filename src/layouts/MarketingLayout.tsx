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

      {/* Editorial Calm Footer */}
      <footer className="solis-marketing-footer">
        <Container>
          <div className="solis-marketing-footer__grid">
            <div className="solis-marketing-footer__brand">
              <Logo variant="auto" size="md" />
              <p className="solis-marketing-footer__copy">
                The Personal Study & Productivity Operating System.
              </p>
            </div>

            <div className="solis-marketing-footer__copy">
              Built with deliberate precision for calm cognition. {APP_CONFIG.name} Architecture.
            </div>
          </div>
        </Container>
      </footer>
    </div>
  );
};
