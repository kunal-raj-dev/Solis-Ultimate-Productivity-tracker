import React from 'react';

export const GridBackgroundSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    width="100%"
    height="100%"
    xmlns="http://www.w3.org/2000/svg"
    style={{ position: 'absolute', top: 0, left: 0, zIndex: -1, opacity: 0.25, pointerEvents: 'none' }}
  >
    <defs>
      <pattern id="solis-grid" width="48" height="48" patternUnits="userSpaceOnUse">
        <path d="M 48 0 L 0 0 0 48" fill="none" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.1" />
        <circle cx="48" cy="0" r="0.8" fill="currentColor" fillOpacity="0.15" />
      </pattern>
      <linearGradient id="fade-mask" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="transparent" />
        <stop offset="12%" stopColor="white" stopOpacity="1" />
        <stop offset="85%" stopColor="white" stopOpacity="1" />
        <stop offset="100%" stopColor="transparent" />
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#solis-grid)" mask="url(#fade-mask)" />
  </svg>
);

export const CircadianClockSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 220 220"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: 'auto', maxWidth: '240px' }}
  >
    <defs>
      <linearGradient id="circadian-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#B58942" />
        <stop offset="50%" stopColor="#E05A3E" />
        <stop offset="100%" stopColor="#8F2F1B" />
      </linearGradient>
      <filter id="circadian-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="4" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>
    
    {/* Concentric orbital guides */}
    <circle cx="110" cy="110" r="88" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.08" strokeDasharray="3 3" />
    <circle cx="110" cy="110" r="68" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.12" />
    <circle cx="110" cy="110" r="44" fill="none" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.06" strokeDasharray="4 4" />
    
    {/* Solar Arc Path */}
    <path
      d="M 26 110 A 84 84 0 0 1 194 110"
      fill="none"
      stroke="url(#circadian-gradient)"
      strokeWidth="2.5"
      strokeLinecap="round"
      filter="url(#circadian-glow)"
      className="solis-svg-draw-anim"
    />

    {/* Horizon line */}
    <line x1="22" y1="110" x2="198" y2="110" stroke="currentColor" strokeWidth="0.8" strokeOpacity="0.15" strokeDasharray="2 3" />

    {/* Cardinal Solar Markers */}
    <circle cx="26" cy="110" r="3" fill="#B58942" />
    <circle cx="110" cy="26" r="4.5" fill="#E05A3E" />
    <circle cx="194" cy="110" r="3" fill="#8F2F1B" />
    
    {/* Current Time Orbiting Marker */}
    <circle cx="166" cy="52" r="4.5" fill="#B58942" />

    {/* Solar Zenith text indicator */}
    <text x="110" y="50" fill="var(--text-muted)" fontSize="8.5" fontFamily="var(--font-mono)" textAnchor="middle" letterSpacing="0.1em">
      ZENITH 13:30
    </text>

    {/* Core Center Pivot */}
    <circle cx="110" cy="110" r="3" fill="#E05A3E" opacity="0.8" />
    <line x1="110" y1="110" x2="166" y2="52" stroke="#E05A3E" strokeWidth="1" strokeOpacity="0.5" strokeDasharray="2 2" />
  </svg>
);

export const SynapseNetworkSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 380 220"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: 'auto' }}
  >
    <defs>
      <linearGradient id="synapse-link-1" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#7F8BB4" stopOpacity="0.2" />
        <stop offset="50%" stopColor="#E05A3E" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#7F8BB4" stopOpacity="0.2" />
      </linearGradient>
      <linearGradient id="synapse-link-2" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#B58942" stopOpacity="0.2" />
        <stop offset="50%" stopColor="#E05A3E" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#7F8BB4" stopOpacity="0.2" />
      </linearGradient>
      <filter id="synapse-glow" x="-20%" y="-20%" width="140%" height="140%">
        <feGaussianBlur stdDeviation="3" result="blur" />
        <feComposite in="SourceGraphic" in2="blur" operator="over" />
      </filter>
    </defs>

    {/* Subtle Background Field Grid */}
    <g stroke="currentColor" strokeWidth="0.6" strokeOpacity="0.08" fill="none">
      <circle cx="60" cy="50" r="30" strokeDasharray="3 3" />
      <circle cx="320" cy="65" r="35" strokeDasharray="3 3" />
      <circle cx="80" cy="170" r="28" strokeDasharray="3 3" />
      <circle cx="300" cy="170" r="35" strokeDasharray="3 3" />
    </g>

    {/* Active Synaptic Links */}
    <g stroke="url(#synapse-link-1)" strokeWidth="1.6" fill="none" filter="url(#synapse-glow)">
      <path d="M 70 110 Q 190 35 310 110" className="solis-svg-dash-anim" />
      <path d="M 70 110 Q 190 185 310 110" className="solis-svg-dash-anim" style={{ animationDelay: '0.8s' }} />
      <path d="M 190 35 L 190 185" className="solis-svg-dash-anim" style={{ animationDelay: '0.4s' }} />
    </g>

    {/* Knowledge Nodes */}
    <circle cx="70" cy="110" r="5" fill="#7F8BB4" />
    <circle cx="310" cy="110" r="5" fill="#E05A3E" />
    <circle cx="190" cy="35" r="4.5" fill="#B58942" />
    <circle cx="190" cy="185" r="4.5" fill="#4D8F63" />

    {/* Concept Labels */}
    <text x="70" y="132" fill="var(--text-secondary)" fontSize="8.5" fontFamily="var(--font-mono)" textAnchor="middle">Syllabus Node</text>
    <text x="190" y="22" fill="var(--text-secondary)" fontSize="8.5" fontFamily="var(--font-mono)" textAnchor="middle">Active Recall</text>
    <text x="310" y="132" fill="var(--text-secondary)" fontSize="8.5" fontFamily="var(--font-mono)" textAnchor="middle">Exam Horizon</text>
    <text x="190" y="205" fill="var(--text-secondary)" fontSize="8.5" fontFamily="var(--font-mono)" textAnchor="middle">Mastery (85%)</text>
  </svg>
);

export const AudioVisualizerSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 260 50"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: 'auto', maxWidth: '260px' }}
  >
    <defs>
      <linearGradient id="audio-wave-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#E05A3E" stopOpacity="0.4" />
        <stop offset="50%" stopColor="#B58942" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#E05A3E" stopOpacity="0.4" />
      </linearGradient>
    </defs>

    {[
      { x: 15, h: 20, delay: '0.1s' },
      { x: 30, h: 32, delay: '0.3s' },
      { x: 45, h: 16, delay: '0.5s' },
      { x: 60, h: 38, delay: '0.2s' },
      { x: 75, h: 24, delay: '0.6s' },
      { x: 90, h: 42, delay: '0.1s' },
      { x: 105, h: 28, delay: '0.4s' },
      { x: 120, h: 46, delay: '0.2s' },
      { x: 135, h: 34, delay: '0.5s' },
      { x: 150, h: 40, delay: '0.3s' },
      { x: 165, h: 22, delay: '0.7s' },
      { x: 180, h: 38, delay: '0.15s' },
      { x: 195, h: 26, delay: '0.45s' },
      { x: 210, h: 34, delay: '0.25s' },
      { x: 225, h: 18, delay: '0.6s' },
      { x: 240, h: 30, delay: '0.35s' },
    ].map((bar, idx) => (
      <rect
        key={idx}
        x={bar.x}
        y={(50 - bar.h) / 2}
        width="3.5"
        height={bar.h}
        rx="1.5"
        fill="url(#audio-wave-grad)"
        style={{
          transformOrigin: `${bar.x + 1.75}px 25px`,
          animation: `audioWave 1.4s ease-in-out infinite alternate`,
          animationDelay: bar.delay
        }}
      />
    ))}
  </svg>
);

export const TelemetryRealismGaugeSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 180 110"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: 'auto', maxWidth: '200px' }}
  >
    <defs>
      <linearGradient id="gauge-arc-grad" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#B58942" />
        <stop offset="70%" stopColor="#5D9570" />
        <stop offset="100%" stopColor="#3E7250" />
      </linearGradient>
    </defs>

    {/* Background Arc */}
    <path
      d="M 25 95 A 65 65 0 0 1 155 95"
      fill="none"
      stroke="currentColor"
      strokeOpacity="0.08"
      strokeWidth="8"
      strokeLinecap="round"
    />

    {/* Active Calibrated Arc */}
    <path
      d="M 25 95 A 65 65 0 0 1 148 78"
      fill="none"
      stroke="url(#gauge-arc-grad)"
      strokeWidth="8"
      strokeLinecap="round"
    />

    {/* Center Value */}
    <text x="90" y="80" fill="var(--text-primary)" fontSize="24" fontFamily="var(--font-mono)" fontWeight="700" textAnchor="middle">
      0.94
    </text>
    <text x="90" y="98" fill="var(--color-sage-500)" fontSize="9" fontFamily="var(--font-mono)" fontWeight="600" textAnchor="middle" letterSpacing="0.08em">
      OPTIMAL VELOCITY
    </text>
  </svg>
);

export const ArchivalDossierSvg: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    className={className}
    viewBox="0 0 880 340"
    xmlns="http://www.w3.org/2000/svg"
    style={{ width: '100%', height: 'auto', overflow: 'hidden' }}
  >
    <defs>
      <pattern id="dossier-grid" width="32" height="32" patternUnits="userSpaceOnUse">
        <path d="M 32 0 L 0 0 0 32" fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.8" />
        <path d="M 0 0 L 3 0 M 0 0 L 0 3" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" fill="none" />
      </pattern>
      <linearGradient id="horizon-glow" x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#B58942" stopOpacity="0.1" />
        <stop offset="50%" stopColor="#E05A3E" stopOpacity="0.8" />
        <stop offset="100%" stopColor="#3E7250" stopOpacity="0.1" />
      </linearGradient>
    </defs>

    {/* Outer Milled Instrument Frame */}
    <rect x="1" y="1" width="878" height="338" rx="8" fill="#141210" stroke="rgba(255,255,255,0.08)" strokeWidth="1.2" />
    <rect x="2" y="2" width="876" height="336" fill="url(#dossier-grid)" />

    {/* Header Instrument Rail */}
    <rect x="1" y="1" width="878" height="36" fill="#181614" />
    <line x1="1" y1="36" x2="879" y2="36" stroke="rgba(255,255,255,0.08)" strokeWidth="1" />

    {/* Header Indicators */}
    <circle cx="20" cy="18" r="4" fill="#E05A3E" opacity="0.85" />
    <text x="32" y="22" fill="#E8E2D8" fontSize="10.5" fontFamily="var(--font-mono)" letterSpacing="0.12em">
      INSTRUMENT DOSSIER // PROTOCOL ARCHIVAL CADENCE
    </text>
    <text x="785" y="22" fill="#78726A" fontSize="9" fontFamily="var(--font-mono)" textAnchor="end">
      ROW LEVEL SECURITY • LOCAL DEMO STORAGE
    </text>
    <rect x="795" y="11" width="64" height="15" rx="2" fill="rgba(62,114,80,0.2)" stroke="rgba(62,114,80,0.4)" />
    <text x="827" y="22" fill="#4D8F63" fontSize="8.5" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="600">
      VERIFIED
    </text>

    {/* Column 1: Celestial Chronometer (x: 20 to 280) */}
    <g transform="translate(24, 52)">
      <text x="0" y="12" fill="#A8A196" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.08em">
        01 • CIRCADIAN ZENITH CALIBRATION
      </text>
      <rect x="0" y="24" width="250" height="236" rx="4" fill="#181614" stroke="rgba(255,255,255,0.06)" />
      
      {/* Concentric solar arcs */}
      <circle cx="125" cy="142" r="80" fill="none" stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
      <circle cx="125" cy="142" r="55" fill="none" stroke="rgba(255,255,255,0.08)" />
      
      {/* Active Solar Path */}
      <path d="M 45 142 A 80 80 0 0 1 205 142" fill="none" stroke="url(#horizon-glow)" strokeWidth="2.5" strokeLinecap="round" />
      <line x1="35" y1="142" x2="215" y2="142" stroke="rgba(255,255,255,0.12)" strokeDasharray="2 3" />
      
      {/* Current Position */}
      <circle cx="125" cy="62" r="5" fill="#E05A3E" />
      <text x="125" y="80" fill="#E8E2D8" fontSize="10" fontFamily="var(--font-mono)" textAnchor="middle" fontWeight="600">
        13:30 SOLAR PEAK
      </text>
      <text x="125" y="96" fill="#78726A" fontSize="9" fontFamily="var(--font-interface)" textAnchor="middle">
        Optimal Cognitive Velocity
      </text>

      <text x="45" y="160" fill="#78726A" fontSize="8" fontFamily="var(--font-mono)">DAWN 07:15</text>
      <text x="175" y="160" fill="#78726A" fontSize="8" fontFamily="var(--font-mono)">DUSK 18:45</text>

      <rect x="16" y="185" width="218" height="56" rx="3" fill="#141210" stroke="rgba(255,255,255,0.05)" />
      <text x="26" y="204" fill="#A8A196" fontSize="9" fontFamily="var(--font-mono)">CAPACITY LIMIT ENFORCED</text>
      <text x="26" y="222" fill="#E8E2D8" fontSize="11" fontFamily="var(--font-mono)" fontWeight="600">5.5h Max Deep Work Allocated</text>
    </g>

    {/* Column 2: SM-2 Spaced Retrieval Derivation (x: 300 to 570) */}
    <g transform="translate(300, 52)">
      <text x="0" y="12" fill="#A8A196" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.08em">
        02 • EBBINGHAUS RETENTION HALF-LIFE
      </text>
      <rect x="0" y="24" width="260" height="236" rx="4" fill="#181614" stroke="rgba(255,255,255,0.06)" />

      {/* Retention Grid */}
      <line x1="20" y1="50" x2="240" y2="50" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 2" />
      <line x1="20" y1="95" x2="240" y2="95" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 2" />
      <line x1="20" y1="140" x2="240" y2="140" stroke="rgba(255,255,255,0.05)" strokeDasharray="2 2" />
      <line x1="20" y1="175" x2="240" y2="175" stroke="rgba(255,255,255,0.1)" />

      {/* Axis text */}
      <text x="14" y="53" fill="#78726A" fontSize="7.5" fontFamily="var(--font-mono)" textAnchor="end">100%</text>
      <text x="14" y="98" fill="#78726A" fontSize="7.5" fontFamily="var(--font-mono)" textAnchor="end">85%</text>
      <text x="14" y="143" fill="#78726A" fontSize="7.5" fontFamily="var(--font-mono)" textAnchor="end">50%</text>

      {/* Passive forgetting curve (collapse) */}
      <path d="M 25 50 Q 60 150 235 170" fill="none" stroke="#78726A" strokeWidth="1.2" strokeDasharray="3 3" opacity="0.6" />
      <text x="180" y="162" fill="#78726A" fontSize="7.5" fontFamily="var(--font-mono)">Passive Decay</text>

      {/* Solis SM-2 Active retrieval boosts */}
      <path
        d="M 25 50 Q 55 95 85 96 L 85 52 Q 130 90 160 92 L 160 52 Q 200 70 235 72"
        fill="none"
        stroke="#E05A3E"
        strokeWidth="2"
      />
      <circle cx="85" cy="52" r="3" fill="#B58942" />
      <circle cx="160" cy="52" r="3" fill="#B58942" />
      <circle cx="235" cy="72" r="3" fill="#4D8F63" />

      <text x="25" y="195" fill="#E8E2D8" fontSize="9.5" fontFamily="var(--font-mono)">
        FORMULA: R(t) = e^(-t/S) • EF=2.50
      </text>
      <text x="25" y="212" fill="#4D8F63" fontSize="9" fontFamily="var(--font-mono)">
        ✓ 94.2% RETENTION ACROSS 42 CHAPTERS
      </text>
      <text x="25" y="228" fill="#78726A" fontSize="8.5" fontFamily="var(--font-interface)">
        Resurfaces flashcards at 85% threshold
      </text>
    </g>

    {/* Column 3: Deterministic Planning Realism (x: 585 to 855) */}
    <g transform="translate(585, 52)">
      <text x="0" y="12" fill="#A8A196" fontSize="10" fontFamily="var(--font-mono)" letterSpacing="0.08em">
        03 • PLANNING REALISM RATIO
      </text>
      <rect x="0" y="24" width="270" height="236" rx="4" fill="#181614" stroke="rgba(255,255,255,0.06)" />

      {/* Progress Telemetry */}
      <g transform="translate(18, 40)">
        <text x="0" y="0" fill="#A8A196" fontSize="9" fontFamily="var(--font-mono)">TOPIC // CS 440 DISTRIBUTED SYSTEMS</text>
        <text x="0" y="18" fill="#E8E2D8" fontSize="11" fontFamily="var(--font-mono)" fontWeight="600">Raft Consensus Proofs</text>
        
        {/* Realism meter */}
        <rect x="0" y="30" width="234" height="6" rx="3" fill="#221F1D" />
        <rect x="0" y="30" width="220" height="6" rx="3" fill="#E05A3E" />
        <text x="0" y="52" fill="#78726A" fontSize="8.5" fontFamily="var(--font-mono)">5.2h / 5.5h Scheduled (94.5%)</text>
      </g>

      <g transform="translate(18, 115)">
        <text x="0" y="0" fill="#A8A196" fontSize="9" fontFamily="var(--font-mono)">SUBJECT // ADVANCED ALGORITHMS</text>
        <text x="0" y="18" fill="#E8E2D8" fontSize="11" fontFamily="var(--font-mono)" fontWeight="600">Topological DAG Analysis</text>
        
        <rect x="0" y="30" width="234" height="6" rx="3" fill="#221F1D" />
        <rect x="0" y="30" width="190" height="6" rx="3" fill="#B58942" />
        <text x="0" y="52" fill="#78726A" fontSize="8.5" fontFamily="var(--font-mono)">3.8h / 4.0h Scheduled (95.0%)</text>
      </g>

      {/* Aggregate Score */}
      <rect x="18" y="195" width="234" height="48" rx="3" fill="#141210" stroke="rgba(255,255,255,0.06)" />
      <text x="28" y="214" fill="#A8A196" fontSize="8.5" fontFamily="var(--font-mono)">WEEKLY REALISM VELOCITY</text>
      <text x="28" y="232" fill="#4D8F63" fontSize="14" fontFamily="var(--font-mono)" fontWeight="700">0.94 • ZERO SCHEDULE DRIFT</text>
    </g>

    {/* Footer Marginalia */}
    <line x1="1" y1="312" x2="879" y2="312" stroke="rgba(255,255,255,0.06)" />
    <text x="24" y="328" fill="#78726A" fontSize="9" fontFamily="var(--font-mono)">
      CALM COGNITIVE SANCTUARY PROTOCOL • V4.0.0
    </text>
    <text x="856" y="328" fill="#78726A" fontSize="9" fontFamily="var(--font-mono)" textAnchor="end">
      ZERO TRACKING • FULL DATA EXPORT
    </text>
  </svg>
);
