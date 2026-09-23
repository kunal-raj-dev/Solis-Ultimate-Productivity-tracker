import React from 'react';

interface ArchivalLibraryEngravingProps {
  className?: string;
  width?: number | string;
  height?: number | string;
}

export const ArchivalLibraryEngraving: React.FC<ArchivalLibraryEngravingProps> = ({
  className = '',
  width = '100%',
  height = 'auto'
}) => {
  return (
    <svg
      viewBox="0 0 480 240"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`solis-engraving ${className}`}
      style={{ width, height, maxWidth: '480px', display: 'block' }}
      aria-hidden="true"
    >
      {/* Background Architectural Grid Lines */}
      <line x1="40" y1="20" x2="40" y2="220" stroke="var(--border-hairline, rgba(255, 255, 255, 0.06))" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="440" y1="20" x2="440" y2="220" stroke="var(--border-hairline, rgba(255, 255, 255, 0.06))" strokeWidth="1" strokeDasharray="4 4" />
      <line x1="20" y1="200" x2="460" y2="200" stroke="var(--border-hairline, rgba(255, 255, 255, 0.12))" strokeWidth="1.2" />

      {/* Desk Horizon & Book Geometry */}
      {/* Open Commonplace Book / Ledger */}
      <path
        d="M 180 185 C 210 183 235 186 240 190 C 245 186 270 183 300 185 L 305 145 C 275 143 250 146 240 150 C 230 146 205 143 175 145 Z"
        stroke="var(--text-secondary, #A8A196)"
        strokeWidth="1.2"
        fill="var(--bg-surface-secondary, rgba(255, 255, 255, 0.02))"
      />
      {/* Book Spine */}
      <line x1="240" y1="150" x2="240" y2="190" stroke="var(--accent-primary, #E65A41)" strokeWidth="1.2" />

      {/* Rulings on Open Pages */}
      <line x1="190" y1="156" x2="230" y2="157" stroke="var(--border-hairline, rgba(255, 255, 255, 0.2))" strokeWidth="0.8" />
      <line x1="190" y1="165" x2="230" y2="166" stroke="var(--border-hairline, rgba(255, 255, 255, 0.2))" strokeWidth="0.8" />
      <line x1="190" y1="174" x2="225" y2="175" stroke="var(--border-hairline, rgba(255, 255, 255, 0.2))" strokeWidth="0.8" />

      <line x1="250" y1="157" x2="290" y2="156" stroke="var(--border-hairline, rgba(255, 255, 255, 0.2))" strokeWidth="0.8" />
      <line x1="250" y1="166" x2="290" y2="165" stroke="var(--border-hairline, rgba(255, 255, 255, 0.2))" strokeWidth="0.8" />
      <line x1="255" y1="175" x2="290" y2="174" stroke="var(--border-hairline, rgba(255, 255, 255, 0.2))" strokeWidth="0.8" />

      {/* Architectural Compass / Divider */}
      <line x1="130" y1="195" x2="145" y2="155" stroke="var(--accent-primary, #E65A41)" strokeWidth="1" strokeLinecap="round" />
      <line x1="160" y1="195" x2="145" y2="155" stroke="var(--accent-primary, #E65A41)" strokeWidth="1" strokeLinecap="round" />
      <circle cx="145" cy="155" r="2" fill="var(--accent-primary, #E65A41)" />
      <path d="M 136 178 Q 145 174 154 178" stroke="var(--border-hairline, rgba(255, 255, 255, 0.3))" strokeWidth="0.8" fill="none" />

      {/* Celestial Armillary / Astrolabe Rings on Left */}
      <circle cx="90" cy="110" r="32" stroke="var(--border-hairline, rgba(255, 255, 255, 0.15))" strokeWidth="1" strokeDasharray="3 3" />
      <ellipse cx="90" cy="110" rx="32" ry="12" stroke="var(--text-muted, #78726A)" strokeWidth="1" />
      <ellipse cx="90" cy="110" rx="12" ry="32" stroke="var(--text-muted, #78726A)" strokeWidth="1" />
      <line x1="90" y1="70" x2="90" y2="150" stroke="var(--border-hairline, rgba(255, 255, 255, 0.2))" strokeWidth="1" />
      <circle cx="90" cy="110" r="3" fill="var(--accent-primary, #E65A41)" />

      {/* Hourglass / Circadian Horizon on Right */}
      <path
        d="M 360 145 L 390 145 L 375 168 L 390 190 L 360 190 L 375 168 Z"
        stroke="var(--text-secondary, #A8A196)"
        strokeWidth="1.2"
        fill="none"
      />
      <circle cx="375" cy="178" r="1.5" fill="var(--accent-primary, #E65A41)" />

      {/* Inscription Plate */}
      <text
        x="240"
        y="218"
        textAnchor="middle"
        fill="var(--text-muted, #78726A)"
        fontSize="9"
        fontFamily="var(--font-mono, monospace)"
        letterSpacing="0.1em"
      >
        EX ORDINE SCIENTIA • SOLIS ACADEMIC OS
      </text>
    </svg>
  );
};
