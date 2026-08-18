import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { AtmosphereCanvas } from '../components/layout/AtmosphereCanvas/AtmosphereCanvas';
import { Logo } from '../components/ui/Logo/Logo';
import { APP_CONFIG } from '../config/app.config';
import './AuthLayout.css';

export const AuthLayout: React.FC = () => {
  return (
    <div className="solis-auth-layout">
      <AtmosphereCanvas intensity="subtle" />

      {/* Visual Editorial Left Panel */}
      <div className="solis-auth-panel-visual">
        <div className="solis-auth-visual-glow" />

        <Logo to="/" variant="hero" size="md" />

        <div>
          <blockquote className="solis-auth-visual-quote">
            “Order is not pressure; it is the calm canvas upon which deep mastery is composed.”
          </blockquote>
          <div className="solis-auth-visual-author">{APP_CONFIG.name} Focus Principles — Vol. I</div>
        </div>

        <div style={{ fontSize: 'var(--text-caption)', color: 'var(--color-charcoal-400)' }}>
          {APP_CONFIG.name} OS • A Quiet Room for Ambitious Minds
        </div>
      </div>

      {/* Form Right Panel */}
      <div className="solis-auth-panel-form">
        <div className="solis-auth-form-container">
          <div style={{ marginBottom: 'var(--space-lg)' }}>
            <Link
              to="/"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 'var(--space-2xs)',
                fontSize: 'var(--text-caption)',
                color: 'var(--text-secondary)',
                textDecoration: 'none'
              }}
            >
              <ArrowLeft size={14} /> Back to overview
            </Link>
          </div>
          <Outlet />
        </div>
      </div>
    </div>
  );
};
