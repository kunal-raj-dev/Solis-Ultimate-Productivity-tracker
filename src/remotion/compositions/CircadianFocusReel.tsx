import React from 'react';
import { AbsoluteFill, Sequence } from 'remotion';
import { CelestialDawnScene } from '../scenes/CelestialDawnScene';
import { DeepWorkSanctuaryScene } from '../scenes/DeepWorkSanctuaryScene';
import { KnowledgeCompoundingScene } from '../scenes/KnowledgeCompoundingScene';
import { CircadianMomentumScene } from '../scenes/CircadianMomentumScene';

export interface CircadianFocusReelProps {
  title?: string;
}

export const CircadianFocusReel: React.FC<CircadianFocusReelProps> = ({
  title = 'Solis — The Archival Circadian Monograph'
}) => {
  return (
    <AbsoluteFill
      style={{
        backgroundColor: '#141210',
        color: '#F6F4F0',
        overflow: 'hidden',
        position: 'relative'
      }}
    >
      {/* Archival Grid & Celestial Atmosphere Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `
            radial-gradient(circle at 50% 30%, rgba(230, 90, 65, 0.08) 0%, transparent 65%),
            linear-gradient(rgba(246, 244, 240, 0.03) 1px, transparent 1px),
            linear-gradient(90deg, rgba(246, 244, 240, 0.03) 1px, transparent 1px)
          `,
          backgroundSize: '100% 100%, 80px 80px, 80px 80px',
          pointerEvents: 'none'
        }}
      />

      {/* Persistent Outer Archival Framing Hairline */}
      <div
        style={{
          position: 'absolute',
          inset: 32,
          border: '1px solid rgba(246, 244, 240, 0.12)',
          borderRadius: 8,
          pointerEvents: 'none',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          padding: 20
        }}
      >
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            letterSpacing: '0.2em',
            color: 'rgba(246, 244, 240, 0.4)',
            textTransform: 'uppercase'
          }}
        >
          {title}
        </span>
        <span
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 12,
            letterSpacing: '0.2em',
            color: 'rgba(246, 244, 240, 0.4)'
          }}
        >
          SEC. IV • 1080P 30FPS
        </span>
      </div>

      {/* Multi-Scene Sequencing */}
      <Sequence from={0} durationInFrames={75} layout="absolute-fill">
        <CelestialDawnScene />
      </Sequence>

      <Sequence from={75} durationInFrames={75} layout="absolute-fill">
        <DeepWorkSanctuaryScene />
      </Sequence>

      <Sequence from={150} durationInFrames={75} layout="absolute-fill">
        <KnowledgeCompoundingScene />
      </Sequence>

      <Sequence from={225} durationInFrames={75} layout="absolute-fill">
        <CircadianMomentumScene />
      </Sequence>
    </AbsoluteFill>
  );
};
