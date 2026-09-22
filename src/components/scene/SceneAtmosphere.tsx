import React from 'react';
import './SceneContainer.css';

export interface SceneAtmosphereProps {
  glowPrimary?: 'coral' | 'amber' | 'lavender' | 'sage' | 'rose';
  glowSecondary?: 'coral' | 'amber' | 'lavender' | 'sage' | 'rose';
  intensity?: 'subtle' | 'vibrant' | 'minimal';
}

export const SceneAtmosphere: React.FC<SceneAtmosphereProps> = () => {
  return (
    <div
      className="solis-scene-atmosphere"
      aria-hidden="true"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}
    />
  );
};
