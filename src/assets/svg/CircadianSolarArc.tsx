import React from 'react';

interface CircadianSolarArcProps {
  currentHour?: number; // 0 to 24 (e.g. 13.5 for 13:30)
  className?: string;
}

export const CircadianSolarArc: React.FC<CircadianSolarArcProps> = ({
  currentHour = 13.5,
  className = ''
}) => {
  // Normalize current hour across 24h
  const clampedHour = Math.max(0, Math.min(24, currentHour));

  // Determine sun angle and position on elliptical trajectory
  // Day phase is 06:00 to 20:00 (angles from PI to 0)
  const isDay = clampedHour >= 6 && clampedHour <= 20;
  const dayProgress = isDay ? (clampedHour - 6) / 14 : 0;
  
  // Calculate coordinates on the arc (width 360, height 120)
  const arcX = 40 + dayProgress * 280;
  // Parabolic arc: y = -4 * h * p * (1 - p) where apex is at p = 0.5
  const arcY = isDay ? 95 - 4 * 65 * dayProgress * (1 - dayProgress) : 95;

  return (
    <div className={`solis-circadian-arc-container ${className}`} style={{ position: 'relative', width: '100%', maxWidth: '380px' }}>
      <svg
        viewBox="0 0 360 120"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-label="Circadian Solar Trajectory Indicator"
      >
        {/* Celestial Horizon Baseline */}
        <line
          x1="20"
          y1="95"
          x2="340"
          y2="95"
          stroke="var(--border-hairline, rgba(255, 255, 255, 0.12))"
          strokeWidth="1"
          strokeDasharray="3 3"
        />

        {/* Day Solar Arc Path */}
        <path
          d="M 40 95 Q 180 -10 320 95"
          stroke="var(--border-hairline, rgba(255, 255, 255, 0.2))"
          strokeWidth="1.5"
          fill="none"
        />

        {/* Active Solar Path Gradient */}
        {isDay && (
          <path
            d={`M 40 95 Q ${40 + dayProgress * 140} ${95 - dayProgress * 70} ${arcX} ${arcY}`}
            stroke="var(--accent-primary, #E65A41)"
            strokeWidth="2"
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Dawn Horizon Marker (06:00) */}
        <circle cx="40" cy="95" r="3" fill="var(--text-muted, #78726A)" />
        <text x="40" y="112" textAnchor="middle" fill="var(--text-muted, #78726A)" fontSize="9" fontFamily="var(--font-mono, monospace)">
          06:00 DAWN
        </text>

        {/* Solar Zenith Meridian Marker (13:00) */}
        <line x1="180" y1="20" x2="180" y2="32" stroke="var(--accent-primary, #E65A41)" strokeWidth="1" strokeDasharray="2 2" />
        <circle cx="180" cy="27" r="2.5" fill="var(--accent-primary, #E65A41)" opacity="0.6" />
        <text x="180" y="14" textAnchor="middle" fill="var(--accent-primary, #E65A41)" fontSize="9" fontFamily="var(--font-mono, monospace)" fontWeight="600">
          13:00 ZENITH
        </text>

        {/* Dusk Horizon Marker (20:00) */}
        <circle cx="320" cy="95" r="3" fill="var(--text-muted, #78726A)" />
        <text x="320" y="112" textAnchor="middle" fill="var(--text-muted, #78726A)" fontSize="9" fontFamily="var(--font-mono, monospace)">
          20:00 DUSK
        </text>

        {/* Dynamic Sun Position Indicator */}
        {isDay ? (
          <g transform={`translate(${arcX}, ${arcY})`}>
            <circle cx="0" cy="0" r="9" fill="var(--accent-primary, #E65A41)" opacity="0.2" />
            <circle cx="0" cy="0" r="5" fill="var(--accent-primary, #E65A41)" />
            <circle cx="0" cy="0" r="2" fill="#FAF8F5" />
          </g>
        ) : (
          <g transform="translate(180, 95)">
            <circle cx="0" cy="0" r="4" fill="var(--color-charcoal-400, #78726A)" />
            <text x="0" y="112" textAnchor="middle" fill="var(--text-muted, #78726A)" fontSize="9" fontFamily="var(--font-mono, monospace)">
              NADIR • REST
            </text>
          </g>
        )}
      </svg>
    </div>
  );
};
