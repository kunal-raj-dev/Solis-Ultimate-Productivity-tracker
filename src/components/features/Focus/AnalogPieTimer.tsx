import React from 'react';
import './AnalogPieTimer.css';

export interface AnalogPieTimerProps {
  /** Fraction of the session remaining: 1 = full pie, 0 = empty. Clamped internally. */
  remainingFraction: number;
  /** Formatted time label rendered in the pie's center. */
  label: string;
  /** Accessible description of the remaining time. */
  ariaLabel?: string;
  sizePx?: number;
}

/**
 * Visual Analog Pie Timer (plan §5.3, audit item #53)
 *
 * An SVG disc that physically sweeps down as minutes elapse, giving ADHD
 * scholars a non-symbolic perception of remaining time. Deterministic — the
 * sweep angle is a pure function of `remainingFraction`; no internal timers
 * (the parent renders it from the authoritative epoch-based countdown).
 */
export const AnalogPieTimer: React.FC<AnalogPieTimerProps> = ({
  remainingFraction,
  label,
  ariaLabel,
  sizePx = 260
}) => {
  const fraction = Math.max(0, Math.min(1, remainingFraction));
  const radius = 50; // viewBox is 0 0 120 120 with the pie centered at 60,60
  const center = 60;
  const sweepDegrees = fraction * 360;

  // Sector path starting at 12 o'clock, sweeping clockwise for the remaining time.
  const angleRad = ((sweepDegrees - 90) * Math.PI) / 180;
  const endX = center + radius * Math.cos(angleRad);
  const endY = center + radius * Math.sin(angleRad);
  const largeArcFlag = sweepDegrees > 180 ? 1 : 0;

  const sectorPath =
    fraction >= 0.9999
      ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 1 ${center - 0.01} ${center - radius} Z`
      : fraction <= 0.0001
      ? ''
      : `M ${center} ${center} L ${center} ${center - radius} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${endX.toFixed(3)} ${endY.toFixed(3)} Z`;

  return (
    <div
      className="solis-analog-pie-timer"
      style={{ width: sizePx, height: sizePx }}
      role="timer"
      aria-label={ariaLabel || `Time remaining: ${label}`}
    >
      <svg viewBox="0 0 120 120" width="100%" height="100%" aria-hidden="true" focusable="false">
        {/* Track ring — the full session envelope */}
        <circle
          cx={center}
          cy={center}
          r={radius + 5}
          fill="none"
          stroke="rgba(255, 255, 255, 0.14)"
          strokeWidth="1.5"
        />
        {/* Depleted portion of the disc (subtle ghost) */}
        <circle cx={center} cy={center} r={radius} fill="rgba(255, 255, 255, 0.05)" />
        {/* Remaining-time pie sweep */}
        {sectorPath && <path d={sectorPath} fill="var(--color-coral-500, #E05A47)" opacity={0.85} />}
        {/* Center hub */}
        <circle cx={center} cy={center} r={30} fill="rgba(13, 12, 11, 0.88)" />
      </svg>
      <span className="solis-analog-pie-timer__label">{label}</span>
    </div>
  );
};
