import React from 'react';

interface EbbinghausRetentionChartProps {
  className?: string;
  retentionPercent?: number; // e.g. 92
}

export const EbbinghausRetentionChart: React.FC<EbbinghausRetentionChartProps> = ({
  className = '',
  retentionPercent = 94
}) => {
  return (
    <div className={`solis-ebbinghaus-chart ${className}`} style={{ width: '100%', maxWidth: '420px' }}>
      <svg
        viewBox="0 0 360 160"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', display: 'block' }}
        aria-label="Ebbinghaus Memory Retention Decay Curve"
      >
        {/* Y Axis Grid & Ticks */}
        <line x1="45" y1="20" x2="340" y2="20" stroke="var(--border-hairline, rgba(255, 255, 255, 0.08))" strokeWidth="1" strokeDasharray="2 2" />
        <text x="38" y="24" textAnchor="end" fill="var(--text-muted, #78726A)" fontSize="9" fontFamily="var(--font-mono, monospace)">100%</text>

        <line x1="45" y1="70" x2="340" y2="70" stroke="var(--border-hairline, rgba(255, 255, 255, 0.08))" strokeWidth="1" strokeDasharray="2 2" />
        <text x="38" y="74" textAnchor="end" fill="var(--text-muted, #78726A)" fontSize="9" fontFamily="var(--font-mono, monospace)">85%</text>

        <line x1="45" y1="125" x2="340" y2="125" stroke="var(--border-hairline, rgba(255, 255, 255, 0.08))" strokeWidth="1" strokeDasharray="2 2" />
        <text x="38" y="129" textAnchor="end" fill="var(--text-muted, #78726A)" fontSize="9" fontFamily="var(--font-mono, monospace)">50%</text>

        {/* X Axis Baseline */}
        <line x1="45" y1="140" x2="340" y2="140" stroke="var(--border-hairline, rgba(255, 255, 255, 0.15))" strokeWidth="1" />
        <text x="50" y="154" fill="var(--text-muted, #78726A)" fontSize="9" fontFamily="var(--font-mono, monospace)">DAY 1</text>
        <text x="145" y="154" fill="var(--text-muted, #78726A)" fontSize="9" fontFamily="var(--font-mono, monospace)">DAY 3</text>
        <text x="240" y="154" fill="var(--text-muted, #78726A)" fontSize="9" fontFamily="var(--font-mono, monospace)">DAY 7</text>
        <text x="330" y="154" textAnchor="end" fill="var(--text-muted, #78726A)" fontSize="9" fontFamily="var(--font-mono, monospace)">DAY 14</text>

        {/* Passive Decay Curve (Uncalibrated Cramming / Passive Reading) */}
        <path
          d="M 50 20 Q 95 110 330 135"
          stroke="var(--text-muted, #78726A)"
          strokeWidth="1.2"
          strokeDasharray="3 3"
          opacity="0.45"
          fill="none"
        />
        <text x="280" y="125" fill="var(--text-muted, #78726A)" fontSize="8" fontFamily="var(--font-mono, monospace)" opacity="0.6">
          Passive Decay
        </text>

        {/* Spaced Retrieval Reset Spikes (Solis SM-2 Protocol) */}
        {/* Cycle 1 */}
        <path
          d="M 50 20 Q 95 65 140 72"
          stroke="var(--accent-primary, #E65A41)"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        {/* Review 1 Reset Impulse */}
        <line x1="140" y1="72" x2="140" y2="28" stroke="var(--color-amber-400, #D9A042)" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="140" cy="28" r="3" fill="var(--color-amber-400, #D9A042)" />

        {/* Cycle 2 */}
        <path
          d="M 140 28 Q 185 58 235 68"
          stroke="var(--accent-primary, #E65A41)"
          strokeWidth="1.8"
          fill="none"
          strokeLinecap="round"
        />
        {/* Review 2 Reset Impulse */}
        <line x1="235" y1="68" x2="235" y2="24" stroke="var(--color-amber-400, #D9A042)" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="235" cy="24" r="3" fill="var(--color-amber-400, #D9A042)" />

        {/* Cycle 3 (Compounding Retention Plateau) */}
        <path
          d="M 235 24 Q 285 36 330 42"
          stroke="var(--accent-primary, #E65A41)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />
        <circle cx="330" cy="42" r="3.5" fill="var(--color-sage-400, #5D9570)" />

        {/* Retention Formula Annotation */}
        <text x="50" y="96" fill="var(--text-primary, #FAF8F5)" fontSize="9" fontFamily="var(--font-mono, monospace)" fontWeight="600">
          R(t) = e^(-t/S) • EF=2.50
        </text>
        <text x="50" y="108" fill="var(--color-sage-400, #5D9570)" fontSize="9" fontFamily="var(--font-mono, monospace)">
          ✓ {retentionPercent}% RETENTION ACROSS ACTIVE TOPICS
        </text>
      </svg>
    </div>
  );
};
