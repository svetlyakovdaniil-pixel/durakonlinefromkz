import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * AmberNeonEraAvatar — Neon circuit amber with double orbit rings.
 * Season: Неоновая эра (Season 7) | Rank: Янтарь
 * Animation: triple aura + double orbit rings + scan line + "AMBER RANK" text
 */
export function AmberNeonEraAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const textR = r * 0.88;
  const fontSize = Math.max(4, size * 0.085);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes ane-aura-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(245,158,11,0.8), 0 0 18px 7px rgba(251,191,36,0.4), 0 0 35px 13px rgba(234,179,8,0.2); }
          50%  { box-shadow: 0 0 22px 10px rgba(251,191,36,1), 0 0 40px 16px rgba(245,158,11,0.7), 0 0 60px 22px rgba(234,179,8,0.35); }
          100% { box-shadow: 0 0 8px 3px rgba(245,158,11,0.8), 0 0 18px 7px rgba(251,191,36,0.4), 0 0 35px 13px rgba(234,179,8,0.2); }
        }
        @keyframes ane-spin-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ane-spin-rev-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes ane-scan-${uid} {
          0%   { top: 0%; opacity: 0; }
          10%  { opacity: 0.5; }
          90%  { opacity: 0.5; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes ane-pulse-${uid} {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.04); }
        }
      `}</style>
      <div style={{ width: size, height: size, position: 'relative', animation: `ane-aura-${uid} 1.8s ease-in-out infinite`, borderRadius: '50%' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden', position: 'absolute', top: 0, left: 0, animation: `ane-pulse-${uid} 3s ease-in-out infinite` }}>
          <defs>
            <clipPath id={`ane-clip-${uid}`}>
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
            <radialGradient id={`ane-bg-${uid}`} cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#3a2000" />
              <stop offset="50%" stopColor="#1e1000" />
              <stop offset="100%" stopColor="#080400" />
            </radialGradient>
            <radialGradient id={`ane-gem-${uid}`} cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
            <path id={`ane-textpath-${uid}`} d={`M ${cx - textR},${cy} a ${textR},${textR} 0 1,1 0.01,0`} />
          </defs>
          <g clipPath={`url(#ane-clip-${uid})`}>
            <circle cx={cx} cy={cy} r={r} fill={`url(#ane-bg-${uid})`} />

            {/* Grid */}
            {Array.from({ length: 6 }).map((_, i) => {
              const y = (size / 7) * (i + 1);
              return <line key={`h${i}`} x1={0} y1={y} x2={size} y2={y} stroke="rgba(245,158,11,0.15)" strokeWidth={0.5} />;
            })}
            {Array.from({ length: 6 }).map((_, i) => {
              const x = (size / 7) * (i + 1);
              return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={size} stroke="rgba(245,158,11,0.15)" strokeWidth={0.5} />;
            })}

            {/* Hexagonal rings */}
            {[0.35, 0.55, 0.75].map((scale, ri) => {
              const s = r * scale;
              const pts = Array.from({ length: 6 }).map((_, i) => {
                const a = (i * 60 * Math.PI) / 180;
                return `${cx + Math.cos(a) * s},${cy + Math.sin(a) * s}`;
              }).join(' ');
              return <polygon key={ri} points={pts} fill="none" stroke="#f59e0b" strokeWidth={Math.max(0.5, size * 0.012)} opacity={0.8 - ri * 0.2} />;
            })}

            {/* Circuit nodes */}
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i * 60 * Math.PI) / 180;
              return (
                <g key={i}>
                  <circle cx={cx + Math.cos(a) * r * 0.55} cy={cy + Math.sin(a) * r * 0.55} r={Math.max(2, size * 0.04)} fill="#f59e0b" opacity="0.9" />
                  <circle cx={cx + Math.cos(a) * r * 0.55} cy={cy + Math.sin(a) * r * 0.55} r={Math.max(1, size * 0.02)} fill="#fef3c7" opacity="0.9" />
                </g>
              );
            })}

            {/* Center gem */}
            <circle cx={cx} cy={cy} r={r * 0.18} fill={`url(#ane-gem-${uid})`} opacity="0.95" />
            <circle cx={cx} cy={cy} r={r * 0.1} fill="#fef3c7" opacity="0.9" />
            <circle cx={cx} cy={cy} r={r * 0.05} fill="white" opacity="0.95" />

            {/* Outer border */}
            <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#f59e0b" strokeWidth={Math.max(1, size * 0.03)} opacity="0.85" />

            {/* "AMBER RANK" text */}
            <text fontSize={fontSize} fill="#fef3c7" fontFamily="'Arial', sans-serif" fontWeight="bold" letterSpacing={Math.max(0.5, size * 0.01)}>
              <textPath href={`#ane-textpath-${uid}`} startOffset="0%">
                AMBER RANK • AMBER RANK •{' '}
              </textPath>
            </text>

            {/* Vignette */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={size * 0.06} />
          </g>
        </svg>

        {/* Outer rotating conic */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(251,191,36,0.3) 20%, rgba(245,158,11,0.25) 40%, transparent 60%, rgba(251,191,36,0.2) 80%, transparent 100%)',
          animation: `ane-spin-${uid} 2.5s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Inner reverse conic */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '15%', borderRadius: '50%',
          background: 'conic-gradient(from 60deg, transparent 0%, rgba(251,191,36,0.35) 25%, transparent 50%, rgba(245,158,11,0.3) 75%, transparent 100%)',
          animation: `ane-spin-rev-${uid} 1.8s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Scan line */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, right: 0, height: Math.max(1, size * 0.025),
          background: 'linear-gradient(90deg, transparent, rgba(251,191,36,0.6), transparent)',
          borderRadius: '50%',
          animation: `ane-scan-${uid} 2s linear infinite`,
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
