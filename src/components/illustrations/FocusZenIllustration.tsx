import React from 'react';
import './illustrations.css';

interface IllustrationProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  animate?: boolean;
}

export const FocusZenIllustration: React.FC<IllustrationProps> = ({
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
      aria-label="Focus Zen Sanctuary Flow Illustration"
    >
      <defs>
        <radialGradient id="solis-zen-glow" cx="120" cy="90" r="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-coral-400, #F0705A)" stopOpacity="0.25" />
          <stop offset="60%" stopColor="var(--color-amber-500, #D9822B)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
      </defs>

      <circle cx="120" cy="90" r="70" fill="url(#solis-zen-glow)" />

      {/* Concentric Flow Rings (Cymatics) */}
      <g stroke="var(--color-coral-400, #F0705A)" strokeWidth="1" opacity="0.35">
        <circle cx="120" cy="90" r="55" strokeDasharray="4 4" />
        <circle cx="120" cy="90" r="42" />
        <circle cx="120" cy="90" r="28" strokeDasharray="2 3" />
      </g>

      {/* Radiant Focal Core */}
      <g transform="translate(120, 90)" className="solis-illustration--pulsing">
        <circle cx="0" cy="0" r="16" fill="var(--color-coral-500, #E65A41)" opacity="0.15" />
        <circle cx="0" cy="0" r="10" fill="var(--color-coral-500, #E65A41)" opacity="0.3" />
        <circle cx="0" cy="0" r="5" fill="var(--color-coral-500, #E65A41)" />

        {/* 4 Cardinal Harmony Points */}
        <circle cx="0" cy="-28" r="2" fill="var(--color-amber-400, #E5983A)" />
        <circle cx="0" cy="28" r="2" fill="var(--color-amber-400, #E5983A)" />
        <circle cx="-28" cy="0" r="2" fill="var(--color-amber-400, #E5983A)" />
        <circle cx="28" cy="0" r="2" fill="var(--color-amber-400, #E5983A)" />
      </g>

      {/* Calming Horizontal Breath Horizon */}
      <line
        x1="50"
        y1="140"
        x2="190"
        y2="140"
        stroke="var(--border-subtle, rgba(0,0,0,0.12))"
        strokeWidth="1"
        strokeLinecap="round"
      />
    </svg>
  );
};
