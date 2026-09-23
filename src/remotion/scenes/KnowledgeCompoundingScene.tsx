import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, Easing } from 'remotion';

export const KnowledgeCompoundingScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Primary: Flashcard 3D perspective flip (from prompt to answer)
  // Rotate from 0deg to 180deg around frame 30 to 50
  const flipRotation = interpolate(frame, [0.8 * fps, 1.5 * fps], [0, 180], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.4, 0, 0.2, 1)
  });

  const cardScale = interpolate(frame, [0, 0.8 * fps], [0.9, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.05, 0.7, 0.1, 1),
    output: 'perceptual-scale'
  });

  const cardOpacity = interpolate(frame, [0, 0.5 * fps], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp'
  });

  // Secondary: Memory retention forecast stat pop (from 82% to 98%)
  const retentionValue = Math.round(
    interpolate(frame, [1.4 * fps, 2.2 * fps], [82, 98], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.bezier(0.05, 0.7, 0.1, 1)
    })
  );

  const badgeScale = interpolate(frame, [1.5 * fps, 1.8 * fps], [0.8, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.05, 0.7, 0.1, 1),
    output: 'perceptual-scale'
  });

  // Scene Exit: Accelerate
  const exitOpacity = interpolate(frame, [2.1 * fps, 2.5 * fps], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.bezier(0.3, 0, 1, 1)
  });

  const isFlipped = flipRotation >= 90;

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
      {/* Category header */}
      <div
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 14,
          letterSpacing: '0.24em',
          color: '#C28224',
          textTransform: 'uppercase',
          marginBottom: 24
        }}
      >
        EBBINGHAUS SPHERICAL RETENTION ENGINE
      </div>

      {/* 3D Perspective Container */}
      <div
        style={{
          perspective: 1200,
          scale: cardScale,
          opacity: cardOpacity
        }}
      >
        <div
          style={{
            width: 620,
            height: 280,
            backgroundColor: '#1C1917',
            border: '1px solid rgba(194, 130, 36, 0.3)',
            borderRadius: 16,
            padding: '36px 40px',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.5)',
            transformStyle: 'preserve-3d',
            transform: `rotateY(${flipRotation}deg)`,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}
        >
          {!isFlipped ? (
            /* Front Prompt */
            <div style={{ transform: 'none' }}>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  color: '#A8A196',
                  letterSpacing: '0.12em',
                  marginBottom: 16
                }}
              >
                PROMPT • DISTRIBUTED SYSTEMS
              </div>
              <h3
                style={{
                  fontFamily: 'Newsreader, EB Garamond, Georgia, serif',
                  fontSize: 26,
                  fontWeight: 400,
                  color: '#F6F4F0',
                  lineHeight: 1.4,
                  margin: 0
                }}
              >
                What core invariant guarantees safety during Raft Leader Election?
              </h3>
            </div>
          ) : (
            /* Back Answer (mirrored so text reads forward) */
            <div style={{ transform: 'scaleX(-1)' }}>
              <div
                style={{
                  fontFamily: 'JetBrains Mono, monospace',
                  fontSize: 12,
                  color: '#3E7250',
                  fontWeight: 600,
                  letterSpacing: '0.12em',
                  marginBottom: 16
                }}
              >
                VERIFIED ACTIVE RECALL
              </div>
              <p
                style={{
                  fontFamily: 'Plus Jakarta Sans, sans-serif',
                  fontSize: 20,
                  color: '#FAF8F5',
                  lineHeight: 1.5,
                  margin: 0
                }}
              >
                The Candidate's log must be at least as up-to-date as any other log in the quorum.
              </p>
            </div>
          )}

          {/* Card Footer Bar */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderTop: '1px solid rgba(246, 244, 240, 0.08)',
              paddingTop: 16,
              transform: isFlipped ? 'scaleX(-1)' : 'none'
            }}
          >
            <span
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                color: '#A8A196'
              }}
            >
              INTERVAL: 4 DAYS • EASE: 2.50
            </span>

            {/* Retention Forecast Badge */}
            <div
              style={{
                backgroundColor: 'rgba(62, 114, 80, 0.2)',
                border: '1px solid #3E7250',
                borderRadius: 20,
                padding: '4px 14px',
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 13,
                fontWeight: 600,
                color: '#74B886',
                scale: badgeScale
              }}
            >
              RETENTION: {retentionValue}%
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
