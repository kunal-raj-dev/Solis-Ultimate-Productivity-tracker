import React from 'react';
import './illustrations.css';

interface IllustrationProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  animate?: boolean;
}

export const StudySanctuaryEmptyIllustration: React.FC<IllustrationProps> = ({
  className = '',
  width = 240,
  height = 180,
  animate = true
}) => {
  return (
    <svg
      viewBox="0 0 240 180"
      width={width}
      height={height}
      className={`solis-illustration ${animate ? 'solis-illustration--floating' : ''} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Empty Study Syllabus Illustration"
    >
      <defs>
        <radialGradient id="solis-study-aura" cx="120" cy="90" r="80" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-amber-400, #E5983A)" stopOpacity="0.2" />
          <stop offset="60%" stopColor="var(--color-coral-500, #E65A41)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="solis-study-folio-1" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--color-amber-600, #B86214)" />
          <stop offset="100%" stopColor="var(--color-amber-400, #E5983A)" />
        </linearGradient>
        <linearGradient id="solis-study-folio-2" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="var(--color-coral-600, #C23E26)" />
          <stop offset="100%" stopColor="var(--color-coral-400, #F0705A)" />
        </linearGradient>
      </defs>

      {/* Ambient background aura */}
      <circle cx="120" cy="90" r="75" fill="url(#solis-study-aura)" />

      {/* Orbiting Syllabus Concept Nodes */}
      <g stroke="var(--color-amber-500, #D9822B)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.4">
        <circle cx="120" cy="85" r="55" />
      </g>
      <g opacity="0.7">
        <circle cx="65" cy="85" r="4" fill="var(--color-coral-500, #E65A41)" />
        <circle cx="175" cy="85" r="4" fill="var(--color-amber-500, #D9822B)" />
        <circle cx="120" cy="30" r="5" fill="var(--color-sage-500, #4A7C59)" />
        <line x1="65" y1="85" x2="120" y2="30" stroke="var(--color-coral-400, #F0705A)" strokeWidth="0.6" opacity="0.4" />
        <line x1="175" y1="85" x2="120" y2="30" stroke="var(--color-amber-400, #E5983A)" strokeWidth="0.6" opacity="0.4" />
      </g>

      {/* Stacked Classical Folios & Syllabus Scroll */}
      <g transform="translate(60, 85)">
        {/* Book 1 (Base) */}
        <rect x="15" y="45" width="90" height="14" rx="2" fill="url(#solis-study-folio-1)" />
        <rect x="19" y="48" width="82" height="8" rx="1" fill="var(--bg-surface-primary, #FFF)" opacity="0.85" />

        {/* Book 2 (Middle, angled slightly) */}
        <g transform="rotate(-3 55 35)">
          <rect x="22" y="30" width="76" height="13" rx="2" fill="url(#solis-study-folio-2)" />
          <rect x="26" y="33" width="68" height="7" rx="1" fill="var(--bg-surface-primary, #FFF)" opacity="0.85" />
          <line x1="28" y1="36" x2="48" y2="36" stroke="var(--color-coral-600, #C23E26)" strokeWidth="0.8" />
        </g>

        {/* Book 3 (Top open book or scroll) */}
        <g transform="translate(25, 0)">
          {/* Open pages */}
          <path
            d="M 5 26 Q 35 18 35 3 L 5 8 Q 30 20 5 26 Z"
            fill="var(--bg-surface-primary, #FFF)"
            stroke="var(--border-subtle, rgba(0,0,0,0.15))"
            strokeWidth="0.7"
          />
          <path
            d="M 65 26 Q 35 18 35 3 L 65 8 Q 40 20 65 26 Z"
            fill="var(--bg-surface-primary, #FFF)"
            stroke="var(--border-subtle, rgba(0,0,0,0.15))"
            strokeWidth="0.7"
          />
          <line x1="35" y1="3" x2="35" y2="28" stroke="var(--color-amber-600, #B86214)" strokeWidth="1" opacity="0.5" />
          {/* Subtle text lines */}
          <line x1="12" y1="13" x2="30" y2="10" stroke="var(--text-muted, #9E988F)" strokeWidth="0.7" opacity="0.4" />
          <line x1="12" y1="17" x2="28" y2="14" stroke="var(--text-muted, #9E988F)" strokeWidth="0.7" opacity="0.4" />
          <line x1="40" y1="10" x2="58" y2="13" stroke="var(--text-muted, #9E988F)" strokeWidth="0.7" opacity="0.4" />
          <line x1="42" y1="14" x2="58" y2="17" stroke="var(--text-muted, #9E988F)" strokeWidth="0.7" opacity="0.4" />
        </g>
      </g>

      {/* Floating Solis Sparkle */}
      <g transform="translate(120, 28)" className="solis-illustration--pulsing">
        <circle cx="0" cy="0" r="3" fill="var(--color-amber-400, #E5983A)" />
        <line x1="0" y1="-6" x2="0" y2="6" stroke="var(--color-amber-400, #E5983A)" strokeWidth="0.8" />
        <line x1="-6" y1="0" x2="6" y2="0" stroke="var(--color-amber-400, #E5983A)" strokeWidth="0.8" />
      </g>
    </svg>
  );
};
