import React from 'react';
import { Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { APP_CONFIG } from '../../../config/app.config';
import { cn } from '../../../utils/classNames';
import './Logo.css';

export interface LogoProps {
  variant?: 'auto' | 'light' | 'dark' | 'hero';
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  showBadge?: boolean;
  badgeText?: string;
  to?: string;
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'auto',
  size = 'md',
  showWordmark = true,
  showBadge = false,
  badgeText = 'Solis OS',
  to,
  className
}) => {
  const iconSize = size === 'sm' ? 12 : size === 'md' ? 14 : 18;

  const content = (
    <>
      <div className="solis-brand-logo__mark" aria-hidden="true">
        <Sparkles size={iconSize} color="#FFFFFF" />
      </div>
      {showWordmark && (
        <span className="solis-brand-logo__wordmark">
          {APP_CONFIG.name}
        </span>
      )}
      {showBadge && (
        <span className="solis-brand-logo__badge">
          {badgeText}
        </span>
      )}
    </>
  );

  const combinedClass = cn(
    'solis-brand-logo',
    `solis-brand-logo--${size}`,
    `solis-brand-logo--${variant}`,
    className
  );

  if (to) {
    return (
      <Link to={to} className={combinedClass} aria-label={`${APP_CONFIG.name} Home`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={combinedClass} aria-label={APP_CONFIG.name}>
      {content}
    </div>
  );
};
