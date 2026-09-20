import React from 'react';
import './illustrations.css';

interface IllustrationProps {
  className?: string;
  width?: number | string;
  height?: number | string;
  animate?: boolean;
}

export const TasksEmptyIllustration: React.FC<IllustrationProps> = ({
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
      aria-label="Empty Tasks Horizon Illustration"
    >
      <defs>
        <radialGradient id="solis-task-dawn" cx="120" cy="115" r="70" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--color-amber-400, #E5983A)" stopOpacity="0.25" />
          <stop offset="50%" stopColor="var(--color-coral-400, #F0705A)" stopOpacity="0.08" />
          <stop offset="100%" stopColor="transparent" />
        </radialGradient>
        <linearGradient id="solis-task-sun" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="var(--color-amber-400, #E5983A)" />
          <stop offset="100%" stopColor="var(--color-coral-500, #E65A41)" />
        </linearGradient>
      </defs>

      {/* Dawn glow */}
      <circle cx="120" cy="115" r="65" fill="url(#solis-task-dawn)" />

      {/* The Rising Sun of Accomplishment */}
      <g transform="translate(120, 115)">
        <path
          d="M -30 0 A 30 30 0 0 1 30 0 Z"
          fill="url(#solis-task-sun)"
        />
        {/* Sun rays */}
        <g stroke="var(--color-amber-400, #E5983A)" strokeWidth="1.2" strokeLinecap="round" opacity="0.8">
          <line x1="0" y1="-34" x2="0" y2="-42" />
          <line x1="-24" y1="-24" x2="-30" y2="-30" />
          <line x1="24" y1="-24" x2="30" y2="-30" />
          <line x1="-36" y1="-10" x2="-44" y2="-12" />
          <line x1="36" y1="-10" x2="44" y2="-12" />
        </g>
      </g>

      {/* Horizon baseline */}
      <line
        x1="35"
        y1="115"
        x2="205"
        y2="115"
        stroke="var(--border-subtle, rgba(0,0,0,0.15))"
        strokeWidth="1.5"
        strokeLinecap="round"
      />

      {/* Minimalist Check & Harmony Arch */}
      <g transform="translate(120, 65)" className="solis-illustration--pulsing">
        <circle cx="0" cy="0" r="16" fill="var(--color-sage-500, #4A7C59)" opacity="0.12" />
        <circle cx="0" cy="0" r="12" stroke="var(--color-sage-500, #4A7C59)" strokeWidth="1.5" />
        <path
          d="M -4 0 L -1 3 L 4 -3"
          stroke="var(--color-sage-500, #4A7C59)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* Subtle alignment markers on horizon */}
      <g stroke="var(--text-muted, #9E988F)" strokeWidth="0.8" opacity="0.4">
        <line x1="60" y1="115" x2="60" y2="122" />
        <line x1="85" y1="115" x2="85" y2="125" />
        <line x1="155" y1="115" x2="155" y2="125" />
        <line x1="180" y1="115" x2="180" y2="122" />
      </g>
    </svg>
  );
};
