import React from 'react';
import './illustrations.css';

interface IllustrationProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  animate?: boolean;
}

export const ScholarObservatoryIllustration: React.FC<IllustrationProps> = ({
  className = '',
  width = 440,
  height = 280,
  animate = true
}) => {
  return (
    <svg
      viewBox="0 0 480 320"
      width={width}
      height={height}
      className={`solis-illustration ${animate ? 'solis-illustration--floating' : ''} ${className}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      role="img"
      aria-label="Solis Scholar Observatory — A quiet sanctuary for ambitious minds"
    >
      <defs>
        {/* Warm Ambient Radial Glow */}
        <radialGradient id="solis-obs-lamp-glow" cx="240" cy="140" r="160" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-amber-400, #E5983A)" stopOpacity="0.25" />
          <stop offset="50%" stopColor="var(--color-coral-400, #F0705A)" stopOpacity="0.1" />
          <stop offset="100%" stopColor="var(--color-amber-500, #D9822B)" stopOpacity="0" />
        </radialGradient>

        <linearGradient id="solis-obs-parchment" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--bg-surface-primary, #FFFFFF)" />
          <stop offset="100%" stopColor="var(--bg-surface-secondary, #F5F2ED)" />
        </linearGradient>

        <linearGradient id="solis-obs-brass" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-amber-400, #E5983A)" />
          <stop offset="100%" stopColor="var(--color-amber-600, #B86214)" />
        </linearGradient>

        <linearGradient id="solis-obs-coral" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--color-coral-400, #F0705A)" />
          <stop offset="100%" stopColor="var(--color-coral-600, #C23E26)" />
        </linearGradient>

        <radialGradient id="solis-obs-star-glow" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="#FFF" stopOpacity="0.9" />
          <stop offset="100%" stopColor="var(--color-amber-300, #F8C37D)" stopOpacity="0" />
        </radialGradient>
      </defs>

      {/* Atmospheric Background Glow */}
      <circle cx="240" cy="140" r="150" fill="url(#solis-obs-lamp-glow)" />

      {/* Constellation & Celestial Grid Arc */}
      <g opacity="0.35" stroke="var(--color-amber-500, #D9822B)" strokeWidth="0.75" strokeDasharray="3 4">
        <circle cx="240" cy="130" r="110" />
        <circle cx="240" cy="130" r="70" />
        <line x1="130" y1="130" x2="350" y2="130" />
        <line x1="240" y1="20" x2="240" y2="240" />
        <path d="M 160 50 A 110 110 0 0 1 320 50" />
      </g>

      {/* Subtle Star Dots */}
      <g opacity="0.6">
        <circle cx="160" cy="65" r="2" fill="url(#solis-obs-brass)" />
        <circle cx="310" cy="55" r="1.5" fill="url(#solis-obs-coral)" />
        <circle cx="190" cy="40" r="1" fill="var(--color-amber-400, #E5983A)" />
        <circle cx="280" cy="85" r="2.5" fill="url(#solis-obs-brass)" />
        <circle cx="140" cy="110" r="1.5" fill="var(--color-coral-400, #F0705A)" />
        <circle cx="340" cy="115" r="1.5" fill="var(--color-amber-300, #F8C37D)" />
      </g>

      {/* The Scholar's Desk Horizon */}
      <path
        d="M 60 250 L 420 250"
        stroke="var(--border-subtle, rgba(0,0,0,0.1))"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <rect
        x="80"
        y="250"
        width="320"
        height="10"
        rx="3"
        fill="var(--bg-surface-tertiary, #EDE8E1)"
        opacity="0.6"
      />

      {/* Leather-Bound Codex / Open Book */}
      <g transform="translate(160, 180)">
        {/* Book shadow */}
        <ellipse cx="80" cy="65" rx="75" ry="8" fill="var(--color-charcoal-900, #1A1817)" opacity="0.08" />

        {/* Book Covers */}
        <path
          d="M 10 55 Q 80 62 150 55 L 158 50 Q 80 57 2 50 Z"
          fill="url(#solis-obs-brass)"
          opacity="0.7"
        />

        {/* Book Pages Left */}
        <path
          d="M 12 50 Q 75 42 78 18 L 8 26 Q 72 38 12 50 Z"
          fill="url(#solis-obs-parchment)"
          stroke="var(--border-subtle, rgba(0,0,0,0.12))"
          strokeWidth="0.75"
        />
        {/* Book Pages Right */}
        <path
          d="M 148 50 Q 85 42 82 18 L 152 26 Q 88 38 148 50 Z"
          fill="url(#solis-obs-parchment)"
          stroke="var(--border-subtle, rgba(0,0,0,0.12))"
          strokeWidth="0.75"
        />

        {/* Center Spine Crease */}
        <line x1="80" y1="18" x2="80" y2="58" stroke="var(--color-amber-600, #B86214)" strokeWidth="1" opacity="0.5" />

        {/* Text Lines Simulation */}
        <g stroke="var(--text-muted, #9E988F)" strokeWidth="0.75" strokeLinecap="round" opacity="0.4">
          <line x1="22" y1="32" x2="68" y2="28" />
          <line x1="22" y1="38" x2="65" y2="34" />
          <line x1="22" y1="44" x2="58" y2="40" />

          <line x1="92" y1="28" x2="138" y2="32" />
          <line x1="95" y1="34" x2="138" y2="38" />
          <line x1="102" y1="40" x2="138" y2="44" />
        </g>

        {/* Coral Ribbon Bookmark */}
        <path
          d="M 80 18 Q 84 40 88 68 L 84 66 L 80 68 Z"
          fill="url(#solis-obs-coral)"
        />
      </g>

      {/* Astrolabe / Celestial Armillary Sphere (Right of book) */}
      <g transform="translate(320, 140)">
        {/* Stand base */}
        <ellipse cx="35" cy="105" rx="20" ry="4" fill="url(#solis-obs-brass)" opacity="0.8" />
        <path d="M 32 105 L 34 85 L 36 85 L 38 105 Z" fill="url(#solis-obs-brass)" />

        {/* Outer meridian ring */}
        <circle cx="35" cy="55" r="30" stroke="url(#solis-obs-brass)" strokeWidth="1.75" />
        {/* Equatorial ring ellipse */}
        <ellipse cx="35" cy="55" rx="30" ry="10" stroke="url(#solis-obs-brass)" strokeWidth="1" strokeDasharray="3 2" />
        {/* Solstice ring inclined */}
        <ellipse
          cx="35"
          cy="55"
          rx="30"
          ry="14"
          transform="rotate(35 35 55)"
          stroke="url(#solis-obs-coral)"
          strokeWidth="1"
          opacity="0.85"
        />
        {/* Central Sun sphere */}
        <circle cx="35" cy="55" r="5" fill="url(#solis-obs-brass)" />
        <circle cx="35" cy="55" r="9" stroke="var(--color-amber-400, #E5983A)" strokeWidth="0.5" opacity="0.6" />
      </g>

      {/* Classical Drafting Compass & Inkwell (Left of book) */}
      <g transform="translate(100, 175)">
        {/* Inkwell Glass Jar */}
        <rect x="15" y="55" width="22" height="18" rx="3" fill="var(--color-charcoal-800, #2E2926)" opacity="0.85" />
        <rect x="18" y="50" width="16" height="5" rx="1.5" fill="url(#solis-obs-brass)" />
        {/* Quill Feather */}
        <path
          d="M 26 50 Q 22 25 10 10 Q 24 15 28 50 Z"
          fill="url(#solis-obs-parchment)"
          stroke="var(--border-subtle, rgba(0,0,0,0.15))"
          strokeWidth="0.75"
        />
        <line x1="26" y1="50" x2="10" y2="10" stroke="url(#solis-obs-brass)" strokeWidth="0.75" opacity="0.7" />

        {/* Drafting Compass */}
        <g transform="translate(45, 20)">
          <circle cx="12" cy="12" r="3" fill="url(#solis-obs-brass)" />
          {/* Compass legs */}
          <line x1="12" y1="12" x2="3" y2="52" stroke="url(#solis-obs-brass)" strokeWidth="1.5" strokeLinecap="round" />
          <line x1="12" y1="12" x2="22" y2="52" stroke="url(#solis-obs-brass)" strokeWidth="1.5" strokeLinecap="round" />
          {/* Arc limiter */}
          <path d="M 6 35 Q 12 38 18 35" stroke="url(#solis-obs-brass)" strokeWidth="1" />
        </g>
      </g>

      {/* Central Solis Brand Crest — Radiant Star Motif */}
      <g transform="translate(240, 95)" className="solis-illustration--pulsing">
        <circle cx="0" cy="0" r="16" fill="url(#solis-obs-coral)" opacity="0.15" />
        <circle cx="0" cy="0" r="7" fill="url(#solis-obs-coral)" />
        {/* 8 radiant solar rays */}
        <g stroke="url(#solis-obs-brass)" strokeWidth="1.25" strokeLinecap="round">
          <line x1="0" y1="-12" x2="0" y2="-18" />
          <line x1="0" y1="12" x2="0" y2="18" />
          <line x1="-12" y1="0" x2="-18" y2="0" />
          <line x1="12" y1="0" x2="18" y2="0" />
          <line x1="-8.5" y1="-8.5" x2="-13" y2="-13" />
          <line x1="8.5" y1="-8.5" x2="13" y2="-13" />
          <line x1="-8.5" y1="8.5" x2="-13" y2="13" />
          <line x1="8.5" y1="8.5" x2="13" y2="13" />
        </g>
      </g>
    </svg>
  );
};
