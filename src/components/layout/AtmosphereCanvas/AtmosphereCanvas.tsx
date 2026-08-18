import React from 'react';
import { cn } from '../../../utils/classNames';
import './AtmosphereCanvas.css';

export interface AtmosphereCanvasProps {
  intensity?: 'subtle' | 'vibrant' | 'minimal';
  className?: string;
}

export const AtmosphereCanvas: React.FC<AtmosphereCanvasProps> = ({
  intensity = 'subtle',
  className
}) => {
  return (
    <div
      className={cn('solis-atmosphere', `solis-atmosphere--${intensity}`, className)}
      aria-hidden="true"
    >
      <div className="solis-atmosphere-orb solis-atmosphere-orb--primary" />
      <div className="solis-atmosphere-orb solis-atmosphere-orb--secondary" />
      <div className="solis-atmosphere-orb solis-atmosphere-orb--tertiary" />
    </div>
  );
};
