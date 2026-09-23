import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

export const DeepWorkSanctuaryScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Entrance: Decelerate (fast start, gentle land)
  const cardScale = interpolate(frame, [0, 1.0 * fps], [0.92, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.05, 0.7, 0.1, 1),
    output: 'perceptual-scale'
  });

  const cardTranslateY = interpolate(frame, [0, 1.0 * fps], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.05, 0.7, 0.1, 1)
  });

  const cardOpacity = interpolate(frame, [0, 0.6 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.05, 0.7, 0.1, 1)
  });

  // Simulated focus chronometer: 25:00 counting down to 21:15
  const elapsedSeconds = Math.round(
    interpolate(frame, [0, 2.5 * fps], [0, 225], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp'
    })
  );
  const remainingTotalSeconds = Math.max(0, 25 * 60 - elapsedSeconds);
  const minutes = Math.floor(remainingTotalSeconds / 60);
  const seconds = remainingTotalSeconds % 60;
  const timeFormatted = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;

  // Circular progress stroke dash offset
  const progressRatio = elapsedSeconds / (25 * 60);
  const circumference = 2 * Math.PI * 90;
  const strokeDashoffset = circumference * (1 - progressRatio);

  // Ambient: Sine wave breathing indicator
  const breathSine = Math.sin((frame / fps) * Math.PI * 1.2);
  const breathGlow = interpolate(breathSine, [-1, 1], [0.2, 0.6]);

  // Scene Exit: Accelerate
  const exitOpacity = interpolate(frame, [2.1 * fps, 2.5 * fps], [1, 0], {
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
        opacity: exitOpacity
      }}
    >
      {/* Primary: Deep Work Focus Sanctuary Card */}
      <div
        style={{
          width: 580,
          backgroundColor: '#1C1917',
          border: '1px solid rgba(246, 244, 240, 0.12)',
          borderRadius: 16,
          padding: '48px 40px',
          boxShadow: '0 24px 64px rgba(0, 0, 0, 0.45)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          opacity: cardOpacity,
          scale: cardScale,
          translate: `0px ${cardTranslateY}px`
        }}
      >
        <div
          style={{
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 14,
            letterSpacing: '0.2em',
            color: '#A8A196',
            textTransform: 'uppercase',
            marginBottom: 20
          }}
        >
          MONASTIC DEEP WORK SANCTUARY
        </div>

        {/* Circular Focus Dial */}
        <div style={{ position: 'relative', width: 220, height: 220, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width={220} height={220} style={{ transform: 'rotate(-90deg)', position: 'absolute' }}>
            <circle
              cx={110}
              cy={110}
              r={90}
              stroke="rgba(246, 244, 240, 0.08)"
              strokeWidth={8}
              fill="none"
            />
            <circle
              cx={110}
              cy={110}
              r={90}
              stroke="#E65A41"
              strokeWidth={8}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="none"
            />
          </svg>

          {/* Center Digital Telemetry */}
          <div style={{ textAlign: 'center' }}>
            <div
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 48,
                fontWeight: 600,
                color: '#F6F4F0',
                letterSpacing: '-0.03em'
              }}
            >
              {timeFormatted}
            </div>
            <div
              style={{
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontSize: 12,
                color: '#3E7250',
                fontWeight: 600,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                marginTop: 4
              }}
            >
              FLOW ACTIVE
            </div>
          </div>
        </div>

        {/* Task Label & Meta */}
        <div style={{ marginTop: 28, textAlign: 'center' }}>
          <h2
            style={{
              fontFamily: 'Newsreader, EB Garamond, Georgia, serif',
              fontSize: 26,
              fontWeight: 400,
              color: '#F6F4F0',
              margin: '0 0 8px 0'
            }}
          >
            Distributed Consensus & Raft Invariants
          </h2>
          <div
            style={{
              display: 'flex',
              gap: 16,
              justifyContent: 'center',
              fontFamily: 'JetBrains Mono, monospace',
              fontSize: 13,
              color: '#A8A196'
            }}
          >
            <span>CYCLE 1 OF 4</span>
            <span>•</span>
            <span style={{ color: `rgba(230, 90, 65, ${breathGlow + 0.4})` }}>
              RESPIRATORY CENTERING
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
