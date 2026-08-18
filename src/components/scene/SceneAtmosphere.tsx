import React from 'react';
import { AtmosphericOrb } from '../parallax/AtmosphericOrb';
import './SceneContainer.css';

export interface SceneAtmosphereProps {
  glowPrimary?: 'coral' | 'amber' | 'lavender' | 'sage' | 'rose';
  glowSecondary?: 'coral' | 'amber' | 'lavender' | 'sage' | 'rose';
  intensity?: 'subtle' | 'vibrant' | 'minimal';
}

export const SceneAtmosphere: React.FC<SceneAtmosphereProps> = ({
  glowPrimary = 'coral',
  glowSecondary = 'amber',
  intensity = 'subtle'
}) => {
  const opacityPrimary = intensity === 'vibrant' ? 0.45 : intensity === 'subtle' ? 0.28 : 0.15;
  const opacitySecondary = intensity === 'vibrant' ? 0.35 : intensity === 'subtle' ? 0.2 : 0.1;

  return (
    <div className="solis-scene-atmosphere" aria-hidden="true" style={{ position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none', zIndex: 0 }}>
      <AtmosphericOrb color={glowPrimary} sizePx={380} top="-15%" right="-10%" opacity={opacityPrimary} />
      <AtmosphericOrb color={glowSecondary} sizePx={300} bottom="-20%" left="5%" opacity={opacitySecondary} />
    </div>
  );
};
