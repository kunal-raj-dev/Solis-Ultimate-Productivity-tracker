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

export const AtmosphericOrb: React.FC<AtmosphericOrbProps> = () => {
  return null;
};
