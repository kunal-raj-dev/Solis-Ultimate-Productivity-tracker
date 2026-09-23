import React from 'react';

export interface SolarDialProps {
  score: number; // 0 to 100
  size?: number; // default 120
  strokeWidth?: number; // default 8
  className?: string;
  onClick?: () => void;
}

/**
 * SolarDial — Precision horological momentum gauge.
 * Inspired by astronomical dials and tactile hardware instruments (Teenage Engineering).
 * Renders dual concentric tracks, precision radian tick marks, and clean metric readout.
 */
export const SolarDial: React.FC<SolarDialProps> = ({
  score = 0,
  size = 110,
  strokeWidth = 7,
  className,
  onClick
}) => {
  const normalizedScore = Math.min(100, Math.max(0, Math.round(score)));
  const radius = (size - strokeWidth * 2) / 2;
  const circumference = 2 * Math.PI * radius;
  // We use a 270 degree arc (3/4 circle), opening downwards:
  const arcFraction = 0.75;
  const totalArcLength = circumference * arcFraction;
  const strokeDashoffset = totalArcLength - (normalizedScore / 100) * totalArcLength;

  // Center coordinate
  const center = size / 2;

  // Determine accent shade based on score tier
  let accentColor = 'var(--color-coral-500)';
  if (normalizedScore >= 80) {
    accentColor = 'var(--color-amber-500)';
  } else if (normalizedScore >= 50) {
    accentColor = 'var(--color-coral-500)';
  } else if (normalizedScore > 0) {
    accentColor = 'var(--color-coral-400)';
  } else {
    accentColor = 'var(--text-muted)';
  }

  // Generate 12 radial tick markers around the arc (every 22.5 deg from 135 deg to 405 deg)
  const ticks = [];
  const startAngle = 135; // degrees
  const sweepAngle = 270;
  const numTicks = 13;
  for (let i = 0; i < numTicks; i++) {
    const angle = ((startAngle + (i / (numTicks - 1)) * sweepAngle) * Math.PI) / 180;
    const rInner = radius - 8;
    const rOuter = radius - 5;
    const x1 = center + rInner * Math.cos(angle);
    const y1 = center + rInner * Math.sin(angle);
    const x2 = center + rOuter * Math.cos(angle);
    const y2 = center + rOuter * Math.sin(angle);
    const isMajor = i === 0 || i === 6 || i === 12;
    ticks.push({ x1, y1, x2, y2, isMajor, key: i });
  }

  return (
    <div
      className={className}
      onClick={onClick}
      style={{
        position: 'relative',
        width: size,
        height: size,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: onClick ? 'pointer' : 'default',
        userSelect: 'none'
      }}
      title="Deterministic Momentum Gauge (Click to view breakdown)"
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        style={{ transform: 'rotate(135deg)', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="solarDialGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="var(--color-amber-400)" />
            <stop offset="60%" stopColor="var(--color-coral-500)" />
            <stop offset="100%" stopColor="var(--color-rose-500)" />
          </linearGradient>
        </defs>

        {/* Background Track */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="var(--bg-surface-secondary)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${totalArcLength} ${circumference}`}
          strokeLinecap="round"
        />

        {/* Active Momentum Arc */}
        <circle
          cx={center}
          cy={center}
          r={radius}
          fill="none"
          stroke="url(#solarDialGradient)"
          strokeWidth={strokeWidth}
          strokeDasharray={`${totalArcLength} ${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            transition: 'stroke-dashoffset 0.6s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        />

        {/* Radial Precision Instrument Ticks */}
        {ticks.map((t) => (
          <line
            key={t.key}
            x1={t.x1}
            y1={t.y1}
            x2={t.x2}
            y2={t.y2}
            stroke="var(--border-subtle)"
            strokeWidth={t.isMajor ? 1.5 : 0.8}
            opacity={t.isMajor ? 0.9 : 0.5}
          />
        ))}
      </svg>

      {/* Center Numeric Telemetry */}
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          marginTop: '-4px'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1px' }}>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '26px',
              fontWeight: 700,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: 'var(--text-primary)'
            }}
          >
            {normalizedScore}
          </span>
          <span
            style={{
              fontFamily: 'var(--font-mono, monospace)',
              fontSize: '13px',
              fontWeight: 600,
              color: accentColor
            }}
          >
            %
          </span>
        </div>
        <span
          style={{
            fontFamily: 'var(--font-interface)',
            fontSize: '9.5px',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            fontWeight: 600,
            color: 'var(--text-muted)',
            marginTop: '3px'
          }}
        >
          VELOCITY
        </span>
      </div>
    </div>
  );
};
