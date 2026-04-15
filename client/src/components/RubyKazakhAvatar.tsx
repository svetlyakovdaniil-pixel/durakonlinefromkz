import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubyKazakhAvatar — Kazakh ornamental pattern with ruby glow.
 * Season: Казахский колорит (Season 6) | Rank: Рубин
 * Animation: ruby red pulse + rotating conic shimmer + "RUBY RANK" text on border
 */
export function RubyKazakhAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const textR = r * 0.88;
  const fontSize = Math.max(4, size * 0.085);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes rka-pulse-${uid} {
          0%, 100% { box-shadow: 0 0 6px 2px rgba(220,38,38,0.6), 0 0 14px 5px rgba(185,28,28,0.3); }
          50%       { box-shadow: 0 0 16px 7px rgba(239,68,68,0.9), 0 0 30px 12px rgba(220,38,38,0.5); }
        }
        @keyframes rka-spin-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes rka-shimmer-${uid} {
          0%   { opacity: 0; transform: translateX(-100%) skewX(-15deg); }
          40%  { opacity: 0.3; }
          60%  { opacity: 0.3; }
          100% { opacity: 0; transform: translateX(200%) skewX(-15deg); }
        }
      `}</style>
      <div style={{ width: size, height: size, position: 'relative', animation: `rka-pulse-${uid} 2.5s ease-in-out infinite`, borderRadius: '50%' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden', position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <clipPath id={`rka-clip-${uid}`}>
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
            <radialGradient id={`rka-bg-${uid}`} cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#5a0000" />
              <stop offset="50%" stopColor="#3a0000" />
              <stop offset="100%" stopColor="#1a0000" />
            </radialGradient>
            <path id={`rka-textpath-${uid}`} d={`M ${cx - textR},${cy} a ${textR},${textR} 0 1,1 0.01,0`} />
          </defs>
          <g clipPath={`url(#rka-clip-${uid})`}>
            <circle cx={cx} cy={cy} r={r} fill={`url(#rka-bg-${uid})`} />

            {/* Kazakh ornament — 8 spokes */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              return <line key={i} x1={cx + Math.cos(angle) * r * 0.1} y1={cy + Math.sin(angle) * r * 0.1} x2={cx + Math.cos(angle) * r * 0.45} y2={cy + Math.sin(angle) * r * 0.45} stroke="#ef4444" strokeWidth={Math.max(1, size * 0.025)} strokeLinecap="round" opacity="0.9" />;
            })}

            {/* Diamond ornaments at mid-ring */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              const dx = cx + Math.cos(angle) * r * 0.55;
              const dy = cy + Math.sin(angle) * r * 0.55;
              const s = size * 0.045;
              return (
                <g key={i} transform={`translate(${dx},${dy}) rotate(${i * 45})`}>
                  <polygon points={`0,${-s} ${s * 0.6},0 0,${s} ${-s * 0.6},0`} fill="#ef4444" opacity="0.85" />
                </g>
              );
            })}

            {/* Center */}
            <circle cx={cx} cy={cy} r={r * 0.14} fill="#ef4444" opacity="0.95" />
            <circle cx={cx} cy={cy} r={r * 0.08} fill="#fca5a5" opacity="0.9" />

            {/* Inner ring */}
            <circle cx={cx} cy={cy} r={r * 0.6} fill="none" stroke="#ef4444" strokeWidth={Math.max(0.5, size * 0.015)} opacity="0.5" />

            {/* Shimmer overlay */}
            <rect x={0} y={0} width={size} height={size} fill="linear-gradient(105deg, transparent 40%, rgba(239,68,68,0.3) 50%, transparent 60%)" style={{ animation: `rka-shimmer-${uid} 3s ease-in-out infinite` }} />

            {/* Rotating conic overlay */}
            <circle cx={cx} cy={cy} r={r} fill="none" />

            {/* Outer border */}
            <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#ef4444" strokeWidth={Math.max(1, size * 0.03)} opacity="0.8" />

            {/* "RUBY RANK" text on circular path */}
            <text fontSize={fontSize} fill="#fca5a5" fontFamily="'Arial', sans-serif" fontWeight="bold" letterSpacing={Math.max(0.5, size * 0.01)}>
              <textPath href={`#rka-textpath-${uid}`} startOffset="0%">
                RUBY RANK • RUBY RANK •{' '}
              </textPath>
            </text>

            {/* Vignette */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={size * 0.06} />
          </g>
        </svg>
        {/* Rotating conic shimmer */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(239,68,68,0.2) 20%, transparent 40%, rgba(220,38,38,0.15) 60%, transparent 80%, rgba(239,68,68,0.2) 100%)',
          animation: `rka-spin-${uid} 4s linear infinite`,
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
