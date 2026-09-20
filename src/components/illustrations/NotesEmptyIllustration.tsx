import React from 'react';
import './illustrations.css';

interface IllustrationProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  animate?: boolean;
}

export const NotesEmptyIllustration: React.FC<IllustrationProps> = ({
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
      aria-label="Empty Knowledge Notes Illustration"
    >
      <defs>
        <radialGradient id="solis-notes-glow" cx="120" cy="85" r="75" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-coral-400, #F0705A)" stopOpacity="0.18" />
          <stop offset="60%" stopColor="var(--color-amber-400, #E5983A)" stopOpacity="0.06" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="solis-notes-pen" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-amber-400, #E5983A)" />
          <stop offset="100%" stopColor="var(--color-coral-600, #C23E26)" />
        </linearGradient>
      </defs>

      {/* Atmospheric Radial Glow */}
      <circle cx="120" cy="85" r="75" fill="url(#solis-notes-glow)" />

      {/* Thinking Canvas Parchment Tablet */}
      <g transform="translate(68, 38)">
        {/* Parchment background */}
        <rect
          x="0"
          y="0"
          width="104"
          height="110"
          rx="6"
          fill="var(--bg-surface-primary, #FFF)"
          stroke="var(--border-subtle, rgba(0,0,0,0.12))"
          strokeWidth="1.2"
        />
        {/* Subtle corner fold */}
        <path d="M 88 0 L 104 16 L 88 16 Z" fill="var(--bg-surface-tertiary, #EDE8E1)" />
        <path d="M 88 0 L 88 16 L 104 16" stroke="var(--border-subtle, rgba(0,0,0,0.15))" strokeWidth="0.8" />

        {/* Conceptual Heading Line */}
        <line x1="14" y1="22" x2="65" y2="22" stroke="var(--color-coral-500, #E65A41)" strokeWidth="2.5" strokeLinecap="round" />

        {/* Synthesized Thought Grid Lines */}
        <g stroke="var(--text-muted, #9E988F)" strokeWidth="1" strokeLinecap="round" opacity="0.35">
          <line x1="14" y1="36" x2="88" y2="36" />
          <line x1="14" y1="48" x2="84" y2="48" />
          <line x1="14" y1="60" x2="72" y2="60" />
          <line x1="14" y1="72" x2="86" y2="72" />
          <line x1="14" y1="84" x2="60" y2="84" />
        </g>

        {/* Small Illuminated Badge / Concept Tag */}
        <rect x="14" y="92" width="32" height="9" rx="3" fill="var(--color-amber-500, #D9822B)" opacity="0.18" />
        <line x1="18" y1="96.5" x2="38" y2="96.5" stroke="var(--color-amber-600, #B86214)" strokeWidth="1" strokeLinecap="round" />
      </g>

      {/* Fountain Pen Drawing Golden Thought Thread */}
      <g transform="translate(142, 60) rotate(-28)">
        {/* Pen Barrel */}
        <rect x="0" y="0" width="7" height="60" rx="3" fill="url(#solis-notes-pen)" />
        <rect x="1" y="58" width="5" height="12" fill="var(--color-amber-300, #F8C37D)" />
        {/* Nib */}
        <path d="M 1 70 L 3.5 82 L 6 70 Z" fill="url(#solis-notes-pen)" />
        <line x1="3.5" y1="70" x2="3.5" y2="78" stroke="var(--bg-surface-primary, #FFF)" strokeWidth="0.6" />
      </g>

      {/* Radiating Concept Sparkles */}
      <g transform="translate(185, 35)" className="solis-illustration--pulsing">
        <circle cx="0" cy="0" r="2.5" fill="var(--color-coral-400, #F0705A)" />
        <circle cx="20" cy="18" r="1.5" fill="var(--color-amber-400, #E5983A)" />
      </g>
      <g transform="translate(48, 55)" className="solis-illustration--pulsing">
        <circle cx="0" cy="0" r="2" fill="var(--color-amber-400, #E5983A)" />
      </g>
    </svg>
  );
};
