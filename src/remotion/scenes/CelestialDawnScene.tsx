import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

export const CelestialDawnScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Primary: Astrolabe rotation & scale entrance
  const astrolabeScale = interpolate(frame, [0, 1.2 * fps], [0.85, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.05, 0.7, 0.1, 1),
    output: 'perceptual-scale'
  });

  const astrolabeRotate = interpolate(frame, [0, 2.5 * fps], [-15, 10], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1)
  });

  const astrolabeOpacity = interpolate(frame, [0, 0.8 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.05, 0.7, 0.1, 1)
  });

  // Secondary: Solar altitude text & heading entrance (staggered)
  const textTranslateY = interpolate(frame, [0.3 * fps, 1.2 * fps], [24, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.05, 0.7, 0.1, 1)
  });

  const textOpacity = interpolate(frame, [0.3 * fps, 1.0 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.05, 0.7, 0.1, 1)
  });

  // Simulated altitude calculation from -64° (nadir) to +12° (dawn emergence)
  const currentAltitude = Math.round(
    interpolate(frame, [0, 2.5 * fps], [-64, 12], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.4, 0, 0.2, 1)
    })
  );

  // Ambient: Subtle background halo pulse
  const haloOpacity = interpolate(frame, [0, 1.5 * fps, 2.5 * fps], [0.15, 0.35, 0.2], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.37, 0, 0.63, 1)
  });

  // Scene Exit: Soft accelerate away
  const sceneExitOpacity = interpolate(frame, [2.1 * fps, 2.5 * fps], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.3, 0, 1, 1)
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
        position: 'relative',
        opacity: sceneExitOpacity
      }}
    >
      {/* Ambient Celestial Halo */}
      <div
        style={{
          position: 'absolute',
          width: 700,
          height: 700,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(230, 90, 65, 0.18) 0%, rgba(200, 75, 49, 0.04) 50%, transparent 70%)',
          opacity: haloOpacity,
          pointerEvents: 'none'
        }}
      />

      {/* Primary: Astrolabe Solar Disc */}
      <div
        style={{
          width: 280,
          height: 280,
          borderRadius: '50%',
          border: '1.5px solid rgba(230, 90, 65, 0.4)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          opacity: astrolabeOpacity,
          scale: astrolabeScale,
          rotate: `${astrolabeRotate}deg`,
          boxShadow: '0 0 60px rgba(230, 90, 65, 0.15)'
        }}
      >
        {/* Inner Archival Dial Rings */}
        <div
          style={{
            width: 220,
            height: 220,
            borderRadius: '50%',
            border: '1px dashed rgba(246, 244, 240, 0.25)',
            position: 'absolute'
          }}
        />
        <div
          style={{
            width: 160,
            height: 160,
            borderRadius: '50%',
            border: '1px solid rgba(194, 130, 36, 0.35)',
            position: 'absolute'
          }}
        />
        {/* Center Celestial Sun */}
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            backgroundColor: '#E65A41',
            boxShadow: '0 0 20px #E65A41'
          }}
        />
      </div>

      {/* Secondary: Telemetry & Editorial Header */}
      <div
        style={{
          marginTop: 48,
          textAlign: 'center',
          opacity: textOpacity,
          translate: `0px ${textTranslateY}px`
        }}
      >
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 16,
            letterSpacing: '0.24em',
            color: '#E65A41',
            textTransform: 'uppercase',
            marginBottom: 12
          }}
        >
          SOLAR HORIZON • {currentAltitude > 0 ? `+${currentAltitude}°` : `${currentAltitude}°`} ALTITUDE
        </div>
        <h1
          style={{
            fontFamily: 'Newsreader, EB Garamond, Georgia, serif',
            fontSize: 54,
            fontWeight: 400,
            letterSpacing: '-0.02em',
            color: '#F6F4F0',
            margin: '0 0 12px 0'
          }}
        >
          Circadian Resonance Emergence
        </h1>
        <p
          style={{
            fontFamily: 'Plus Jakarta Sans, sans-serif',
            fontSize: 20,
            color: '#A8A196',
            maxWidth: 680,
            margin: '0 auto',
            lineHeight: 1.5
          }}
        >
          Aligning cognitive metabolic capacity directly with solar geometry.
        </p>
      </div>
    </div>
  );
};
