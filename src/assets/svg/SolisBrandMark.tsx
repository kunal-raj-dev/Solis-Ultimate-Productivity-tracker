import React from 'react';

interface SolisBrandMarkProps {
  size?: number;
  className?: string;
  animate?: boolean;
}

export const SolisBrandMark: React.FC<SolisBrandMarkProps> = ({
  size = 28,
  className = '',
  animate = false
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`solis-brand-mark ${animate ? 'solis-brand-mark--animated' : ''} ${className}`}
      aria-hidden="true"
    >
      <circle
        cx="16"
        cy="16"
        r="14"
        stroke="var(--border-hairline, rgba(255, 255, 255, 0.15))"
        strokeWidth="1"
        strokeDasharray="2 2"
      />
      <circle
        cx="16"
        cy="16"
        r="9"
        stroke="var(--text-secondary, #A8A196)"
        strokeWidth="1.2"
        opacity="0.6"
      />
      {/* Central Solar Core */}
      <circle
        cx="16"
        cy="16"
        r="3.5"
        fill="var(--accent-primary, #E65A41)"
      />
      {/* Meridian Zenith Ray */}
      <line
        x1="16"
        y1="2"
        x2="16"
        y2="7"
        stroke="var(--accent-primary, #E65A41)"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      {/* Astrolabe Pointer */}
      <circle
        cx="22.5"
        cy="9.5"
        r="1.75"
        fill="var(--text-primary, #FAF8F5)"
      />
      <line
        x1="16"
        y1="16"
        x2="22.5"
        y2="9.5"
        stroke="var(--accent-primary, #E65A41)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.8"
      />
    </svg>
  );
};
