import React from 'react';

export interface AtmosphericOrbProps {
  color?: 'coral' | 'amber' | 'lavender' | 'sage' | 'rose';
  sizePx?: number;
  top?: string;
  left?: string;
  right?: string;
  bottom?: string;
  opacity?: number;
  className?: string;
}

const COLOR_MAP: Record<string, string> = {
  coral: 'radial-gradient(circle, rgba(230, 90, 65, 0.45) 0%, rgba(250, 248, 245, 0) 70%)',
  amber: 'radial-gradient(circle, rgba(229, 142, 38, 0.4) 0%, rgba(250, 248, 245, 0) 70%)',
  lavender: 'radial-gradient(circle, rgba(126, 105, 171, 0.4) 0%, rgba(250, 248, 245, 0) 70%)',
  sage: 'radial-gradient(circle, rgba(74, 124, 89, 0.35) 0%, rgba(250, 248, 245, 0) 70%)',
  rose: 'radial-gradient(circle, rgba(214, 69, 98, 0.35) 0%, rgba(250, 248, 245, 0) 70%)'
};

export const AtmosphericOrb: React.FC<AtmosphericOrbProps> = ({
  color = 'coral',
  sizePx = 300,
  top,
  left,
  right,
  bottom,
  opacity = 0.5,
  className = ''
}) => {
  return (
    <div
      className={`solis-atmospheric-orb ${className}`}
      style={{
        width: `${sizePx}px`,
        height: `${sizePx}px`,
        top,
        left,
        right,
        bottom,
        opacity,
        background: COLOR_MAP[color] || COLOR_MAP.coral
      }}
      aria-hidden="true"
    />
  );
};
