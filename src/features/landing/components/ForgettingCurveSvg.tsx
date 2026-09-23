import React from 'react';

export const ForgettingCurveSvg: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={className} style={{ width: '100%', maxWidth: '420px', userSelect: 'none' }}>
      <svg
        viewBox="0 0 400 200"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ width: '100%', height: 'auto', overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="curveSolis" x1="0" y1="0" x2="400" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--color-coral-400)" />
            <stop offset="50%" stopColor="var(--color-amber-400)" />
            <stop offset="100%" stopColor="var(--color-sage-400)" />
          </linearGradient>

          <linearGradient id="areaSolis" x1="0" y1="0" x2="0" y2="180" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="var(--color-coral-500)" stopOpacity="0.2" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        <line x1="40" y1="30" x2="380" y2="30" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
        <line x1="40" y1="80" x2="380" y2="80" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
        <line x1="40" y1="130" x2="380" y2="130" stroke="var(--border-subtle)" strokeWidth="1" strokeDasharray="3 3" opacity="0.4" />
        <line x1="40" y1="175" x2="380" y2="175" stroke="var(--border-default)" strokeWidth="1.2" />
        <line x1="40" y1="20" x2="40" y2="175" stroke="var(--border-default)" strokeWidth="1.2" />

        {/* Axis Labels */}
        <text x="32" y="34" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="end">100%</text>
        <text x="32" y="84" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="end">80%</text>
        <text x="32" y="134" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="end">50%</text>
        <text x="32" y="178" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)" textAnchor="end">20%</text>

        <text x="45" y="192" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">Day 1</text>
        <text x="135" y="192" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">Day 3</text>
        <text x="240" y="192" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">Day 7</text>
        <text x="345" y="192" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-mono)">Day 21</text>

        {/* The Passive Forgetting Curve (Steep Collapse to 20%) */}
        <path
          d="M 40 30 Q 80 150 380 170"
          stroke="var(--text-muted)"
          strokeWidth="1.5"
          strokeDasharray="4 4"
          fill="none"
          opacity="0.45"
        />
        <text x="382" y="166" fill="var(--text-muted)" fontSize="9" fontFamily="var(--font-interface)">Passive Study</text>

        {/* Shaded Area under Solis Recovery */}
        <path
          d="M 40 30 Q 75 75 110 80 L 110 32 Q 160 65 210 68 L 210 32 Q 280 50 380 52 L 380 175 L 40 175 Z"
          fill="url(#areaSolis)"
        />

        {/* Solis Active Spaced Retrieval Curve (SM-2 Boosts) */}
        <path
          d="M 40 30 Q 75 75 110 80"
          stroke="url(#curveSolis)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Intervention 1 */}
        <line x1="110" y1="80" x2="110" y2="34" stroke="var(--color-coral-500)" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="110" cy="80" r="3" fill="var(--color-coral-500)" />
        <circle cx="110" cy="34" r="3.5" fill="var(--color-amber-400)" />

        <path
          d="M 110 34 Q 160 65 210 68"
          stroke="url(#curveSolis)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        {/* Intervention 2 */}
        <line x1="210" y1="68" x2="210" y2="34" stroke="var(--color-coral-500)" strokeWidth="1.5" strokeDasharray="2 2" />
        <circle cx="210" cy="68" r="3" fill="var(--color-coral-500)" />
        <circle cx="210" cy="34" r="3.5" fill="var(--color-amber-400)" />

        <path
          d="M 210 34 Q 280 50 380 52"
          stroke="url(#curveSolis)"
          strokeWidth="2.5"
          strokeLinecap="round"
          fill="none"
        />
        <circle cx="380" cy="52" r="4" fill="var(--color-sage-400)" />

        {/* Callout Badge on Graph */}
        <g transform="translate(230, 20)">
          <rect width="145" height="22" rx="4" fill="var(--bg-surface-secondary)" stroke="var(--color-sage-500)" strokeWidth="1" />
          <text x="8" y="14" fill="var(--color-sage-400)" fontSize="9.5" fontWeight="600" fontFamily="var(--font-interface)">
            ✓ 92% Solis Active Retention
          </text>
        </g>
      </svg>
    </div>
  );
};
