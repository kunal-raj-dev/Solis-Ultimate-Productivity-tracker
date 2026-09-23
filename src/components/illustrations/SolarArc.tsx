import React from 'react';

export interface SolarArcProps {
  currentDate?: Date;
  className?: string;
}

/**
 * SolarArc — Handcrafted astronomical solar horizon SVG.
 * Computes the sun's trajectory across the sky based on 24h solar time,
 * displaying celestial coordinates, astronomical milestones (Dawn, Solar Noon, Dusk),
 * and a living solar beacon with ambient radiance.
 */
export const SolarArc: React.FC<SolarArcProps> = ({
  currentDate = new Date(),
  className
}) => {
  const hours = currentDate.getHours();
  const minutes = currentDate.getMinutes();
  const timeDecimal = hours + minutes / 60; // 0.0 to 24.0

  // Horizon arc span: 6:00 (Dawn) to 20:00 (Dusk) = 14 hours diurnal span
  // If outside 6-20, night mode nadir calculations apply.
  const isDaytime = timeDecimal >= 6 && timeDecimal <= 20;
  
  // Normalized position along the primary visible arc [0 to 1]
  // Clamped for smooth rendering:
  const dayProgress = Math.min(1, Math.max(0, (timeDecimal - 6) / 14));

  // Elliptical arc coordinates: width=320, height=84
  // Path: starts at (20, 72) -> peak at (160, 14) -> ends at (300, 72)
  // Quadratic bezier: M 20 72 Q 160 -10 300 72
  // Evaluating B(t) where t = dayProgress:
  // x(t) = (1-t)^2 * 20 + 2*(1-t)*t * 160 + t^2 * 300
  // y(t) = (1-t)^2 * 72 + 2*(1-t)*t * (-10) + t^2 * 72
  const t = isDaytime ? dayProgress : (timeDecimal > 20 ? 1 : 0);
  const sunX = Math.round((1 - t) * (1 - t) * 20 + 2 * (1 - t) * t * 160 + t * t * 300);
  const sunY = Math.round((1 - t) * (1 - t) * 72 + 2 * (1 - t) * t * (-10) + t * t * 72);

  // Solar phase label & astronomical altitude
  let phaseName = 'Solar Noon';
  let phaseColor = 'var(--color-amber-500)';
  if (timeDecimal >= 5 && timeDecimal < 8) {
    phaseName = 'Dawn Horizon';
    phaseColor = 'var(--color-rose-500)';
  } else if (timeDecimal >= 8 && timeDecimal < 12) {
    phaseName = 'Morning Flow';
    phaseColor = 'var(--color-amber-400)';
  } else if (timeDecimal >= 12 && timeDecimal < 16) {
    phaseName = 'Solar Zenith';
    phaseColor = 'var(--color-coral-500)';
  } else if (timeDecimal >= 16 && timeDecimal < 19) {
    phaseName = 'Golden Hour';
    phaseColor = 'var(--color-amber-500)';
  } else if (timeDecimal >= 19 && timeDecimal < 21) {
    phaseName = 'Amber Dusk';
    phaseColor = 'var(--color-coral-600)';
  } else {
    phaseName = 'Celestial Nadir';
    phaseColor = 'var(--color-lavender-400)';
  }

  const formattedTime = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;

  return (
    <div
      className={className}
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '340px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        userSelect: 'none'
      }}
      aria-label={`Circadian Solar Status: ${phaseName} at ${formattedTime}`}
    >
      <svg
        viewBox="0 0 320 84"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="solisArcGradient" x1="20" y1="72" x2="300" y2="72" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--color-rose-400)" stopOpacity="0.3" />
            <stop offset="50%" stopColor="var(--color-amber-400)" stopOpacity="0.75" />
            <stop offset="100%" stopColor="var(--color-coral-500)" stopOpacity="0.3" />
          </linearGradient>

          <radialGradient id="solisSunGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="var(--color-amber-400)" stopOpacity="0.6" />
            <stop offset="60%" stopColor="var(--color-coral-500)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>
        </defs>

        {/* Horizon Baseline */}
        <line
          x1="12"
          y1="72"
          x2="308"
          y2="72"
          stroke="var(--border-subtle)"
          strokeWidth="1"
          strokeDasharray="2 3"
        />

        {/* Diurnal Solar Arc Path */}
        <path
          d="M 20 72 Q 160 -10 300 72"
          stroke="url(#solisArcGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={isDaytime ? 'none' : '4 4'}
          opacity={isDaytime ? 0.9 : 0.45}
        />

        {/* Milestone Marks: Dawn (06:00), Noon (13:00), Dusk (20:00) */}
        <circle cx="20" cy="72" r="2.5" fill="var(--color-rose-400)" opacity="0.7" />
        <circle cx="160" cy="11" r="2.5" fill="var(--color-amber-400)" opacity="0.8" />
        <circle cx="300" cy="72" r="2.5" fill="var(--color-coral-500)" opacity="0.7" />

        {/* Milestone Labels */}
        <text x="20" y="82" fill="var(--text-muted)" fontSize="8.5" fontFamily="var(--font-interface)" textAnchor="middle">06h</text>
        <text x="160" y="4" fill="var(--text-muted)" fontSize="8.5" fontFamily="var(--font-interface)" textAnchor="middle">13h</text>
        <text x="300" y="82" fill="var(--text-muted)" fontSize="8.5" fontFamily="var(--font-interface)" textAnchor="middle">20h</text>

        {/* Living Sun Beacon */}
        {isDaytime ? (
          <g transform={`translate(${sunX}, ${sunY})`}>
            {/* Ambient Pulsing Halo */}
            <circle cx="0" cy="0" r="14" fill="url(#solisSunGlow)" />
            {/* Core Sun Disc */}
            <circle
              cx="0"
              cy="0"
              r="5"
              fill="var(--color-amber-400)"
              stroke="var(--bg-canvas)"
              strokeWidth="2"
            />
            {/* Concentric Flare Ring */}
            <circle
              cx="0"
              cy="0"
              r="8"
              fill="none"
              stroke="var(--color-amber-500)"
              strokeWidth="1"
              strokeDasharray="2 2"
              opacity="0.6"
            />
          </g>
        ) : (
          /* Night Celestial Beacon anchored below horizon */
          <g transform="translate(160, 72)">
            <circle cx="0" cy="0" r="5" fill="var(--color-lavender-400)" stroke="var(--bg-canvas)" strokeWidth="1.5" />
            <circle cx="0" cy="0" r="9" fill="none" stroke="var(--color-lavender-500)" strokeWidth="1" strokeDasharray="1 3" opacity="0.5" />
          </g>
        )}
      </svg>

      {/* Astronomical Telemetry Strip */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          marginTop: '-4px',
          padding: '0 8px',
          fontSize: '11px',
          fontFamily: 'var(--font-mono, monospace)',
          color: 'var(--text-secondary)'
        }}
      >
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <span
            style={{
              width: '6px',
              height: '6px',
              borderRadius: '50%',
              backgroundColor: phaseColor,
              display: 'inline-block',
              boxShadow: `0 0 6px ${phaseColor}`
            }}
          />
          <strong style={{ fontWeight: 600, color: 'var(--text-primary)' }}>{phaseName}</strong>
        </span>

        <span style={{ color: 'var(--text-muted)', letterSpacing: '0.04em' }}>
          SOLAR {formattedTime}
        </span>
      </div>
    </div>
  );
};
