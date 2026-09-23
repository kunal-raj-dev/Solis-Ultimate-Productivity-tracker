import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

export const CircadianMomentumScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Momentum score count-up: 0 to 94%
  const momentumScore = Math.round(
    interpolate(frame, [0.2 * fps, 1.6 * fps], [0, 94], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.05, 0.7, 0.1, 1)
    })
  );

  const containerScale = interpolate(frame, [0, 1.0 * fps], [0.94, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.05, 0.7, 0.1, 1),
    output: 'perceptual-scale'
  });

  const metricsOpacity = interpolate(frame, [0.6 * fps, 1.4 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  const quoteOpacity = interpolate(frame, [1.4 * fps, 2.2 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1)
  });

  const quoteTranslateY = interpolate(frame, [1.4 * fps, 2.2 * fps], [16, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.05, 0.7, 0.1, 1)
  });

  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        scale: containerScale,
        padding: '0 40px'
      }}
    >
      {/* Brandmark Header */}
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 15,
          letterSpacing: '0.3em',
          color: '#E65A41',
          textTransform: 'uppercase',
          marginBottom: 16
        }}
      >
        SOLIS OS • ARCHIVAL VELOCITY
      </div>

      {/* Kinetic Big Stat Counter */}
      <div
        style={{
          fontFamily: 'Newsreader, EB Garamond, Georgia, serif',
          fontSize: 110,
          fontWeight: 400,
          lineHeight: 1,
          color: '#F6F4F0',
          letterSpacing: '-0.04em',
          marginBottom: 8
        }}
      >
        {momentumScore}%
      </div>

      <div
        style={{
          fontFamily: 'Plus Jakarta Sans, sans-serif',
          fontSize: 18,
          color: '#A8A196',
          textTransform: 'uppercase',
          letterSpacing: '0.12em',
          marginBottom: 36
        }}
      >
        Circadian Momentum Index
      </div>

      {/* 4 Architectural Metrics */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(4, 1fr)',
          gap: 24,
          maxWidth: 780,
          width: '100%',
          opacity: metricsOpacity,
          marginBottom: 44
        }}
      >
        <div style={{ backgroundColor: '#1C1917', border: '1px solid rgba(246, 244, 240, 0.08)', borderRadius: 12, padding: '18px 12px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 600, color: '#F6F4F0' }}>4.8h</div>
          <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: '#A8A196', marginTop: 4 }}>Deep Work</div>
        </div>
        <div style={{ backgroundColor: '#1C1917', border: '1px solid rgba(246, 244, 240, 0.08)', borderRadius: 12, padding: '18px 12px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 600, color: '#E65A41' }}>100%</div>
          <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: '#A8A196', marginTop: 4 }}>Task Velocity</div>
        </div>
        <div style={{ backgroundColor: '#1C1917', border: '1px solid rgba(246, 244, 240, 0.08)', borderRadius: 12, padding: '18px 12px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 600, color: '#74B886' }}>98%</div>
          <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: '#A8A196', marginTop: 4 }}>Memory Retained</div>
        </div>
        <div style={{ backgroundColor: '#1C1917', border: '1px solid rgba(246, 244, 240, 0.08)', borderRadius: 12, padding: '18px 12px' }}>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 24, fontWeight: 600, color: '#C28224' }}>12 Days</div>
          <div style={{ fontFamily: 'Plus Jakarta Sans, sans-serif', fontSize: 12, color: '#A8A196', marginTop: 4 }}>Ritual Streak</div>
        </div>
      </div>

      {/* Editorial Manifesto Quote */}
      <div
        style={{
          opacity: quoteOpacity,
          translate: `0px ${quoteTranslateY}px`,
          maxWidth: 680
        }}
      >
        <p
          style={{
            fontFamily: 'Newsreader, EB Garamond, Georgia, serif',
            fontStyle: 'italic',
            fontSize: 22,
            lineHeight: 1.5,
            color: '#FAF8F5',
            margin: 0
          }}
        >
          “Order is not pressure; it is the calm canvas upon which deep mastery is composed.”
        </p>
      </div>
    </div>
  );
};
