import React from 'react';

interface CognitiveCapacityGaugeProps {
  allocatedHours?: number; // e.g. 3.75
  maxHours?: number; // default 5.5
  className?: string;
}

export const CognitiveCapacityGauge: React.FC<CognitiveCapacityGaugeProps> = ({
  allocatedHours = 3.75,
  maxHours = 5.5,
  className = ''
}) => {
  const percent = Math.min(100, Math.round((allocatedHours / maxHours) * 100));
  const isOverloaded = allocatedHours > maxHours;

  return (
    <div className={`solis-capacity-gauge ${className}`} style={{ width: '100%', fontFamily: 'var(--font-mono, monospace)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '6px' }}>
        <span style={{ fontSize: '0.6875rem', letterSpacing: '0.04em', color: 'var(--text-muted, #78726A)', textTransform: 'uppercase' }}>
          Daily Cognitive Ceiling (Max 5.5h)
        </span>
        <span style={{ fontSize: '0.8125rem', color: isOverloaded ? 'var(--status-error, #BA1A1A)' : 'var(--text-primary, #FAF8F5)', fontWeight: 600 }}>
          {allocatedHours}h / {maxHours}h ({percent}%)
        </span>
      </div>

      {/* Segmented Architectural Meter Bar */}
      <div
        style={{
          display: 'flex',
          height: '6px',
          width: '100%',
          backgroundColor: 'var(--bg-surface-secondary, rgba(255, 255, 255, 0.06))',
          borderRadius: 'var(--radius-xs, 2px)',
          overflow: 'hidden',
          gap: '2px'
        }}
      >
        {Array.from({ length: 11 }).map((_, i) => {
          const segmentVal = (i + 1) * 0.5; // each segment is 30 mins
          const isFilled = allocatedHours >= segmentVal;
          const isOptimalZone = segmentVal <= 4.5;

          return (
            <div
              key={i}
              style={{
                flex: 1,
                height: '100%',
                backgroundColor: isFilled
                  ? isOptimalZone
                    ? 'var(--accent-primary, #E65A41)'
                    : 'var(--color-amber-400, #D9A042)'
                  : 'transparent',
                transition: 'background-color 200ms ease'
              }}
            />
          );
        })}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.6875rem', color: 'var(--text-secondary, #A8A196)' }}>
        <span>0h Dawn</span>
        <span style={{ color: 'var(--color-sage-400, #5D9570)' }}>● Optimal Horizon (4-5h)</span>
        <span>5.5h Ceiling</span>
      </div>
    </div>
  );
};
