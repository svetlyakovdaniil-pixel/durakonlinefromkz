import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * AmberKazakhAvatar — Kazakh golden ornament with amber glow.
 * Season: Казахский колорит (Season 6) | Rank: Янтарь
 * Animation: dual aura pulse + orbital particles + rotating conic + "AMBER RANK" text
 */
export function AmberKazakhAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const textR = r * 0.88;
  const fontSize = Math.max(4, size * 0.085);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes aka-aura-${uid} {
          0%   { box-shadow: 0 0 6px 2px rgba(245,158,11,0.7), 0 0 14px 5px rgba(217,119,6,0.4), 0 0 28px 10px rgba(251,191,36,0.2); }
          33%  { box-shadow: 0 0 20px 9px rgba(251,191,36,0.9), 0 0 36px 14px rgba(245,158,11,0.6), 0 0 52px 20px rgba(217,119,6,0.3); }
          66%  { box-shadow: 0 0 10px 4px rgba(217,119,6,0.8), 0 0 22px 8px rgba(245,158,11,0.5), 0 0 40px 15px rgba(251,191,36,0.25); }
          100% { box-shadow: 0 0 6px 2px rgba(245,158,11,0.7), 0 0 14px 5px rgba(217,119,6,0.4), 0 0 28px 10px rgba(251,191,36,0.2); }
        }
        @keyframes aka-spin-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes aka-spin-rev-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes aka-orbit-${uid} {
          from { transform: rotate(0deg) translateX(${r * 0.72}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${r * 0.72}px) rotate(-360deg); }
        }
        @keyframes aka-orbit2-${uid} {
          from { transform: rotate(180deg) translateX(${r * 0.72}px) rotate(-180deg); }
          to   { transform: rotate(540deg) translateX(${r * 0.72}px) rotate(-540deg); }
        }
        @keyframes aka-float-${uid} {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.03); }
        }
      `}</style>
      <div style={{ width: size, height: size, position: 'relative', animation: `aka-aura-${uid} 2s ease-in-out infinite`, borderRadius: '50%' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden', position: 'absolute', top: 0, left: 0, animation: `aka-float-${uid} 3s ease-in-out infinite` }}>
          <defs>
            <clipPath id={`aka-clip-${uid}`}>
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
            <radialGradient id={`aka-bg-${uid}`} cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#5a3000" />
              <stop offset="50%" stopColor="#3a1800" />
              <stop offset="100%" stopColor="#1a0800" />
            </radialGradient>
            <radialGradient id={`aka-center-${uid}`} cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fbbf24" />
              <stop offset="60%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
            <path id={`aka-textpath-${uid}`} d={`M ${cx - textR},${cy} a ${textR},${textR} 0 1,1 0.01,0`} />
          </defs>
          <g clipPath={`url(#aka-clip-${uid})`}>
            <circle cx={cx} cy={cy} r={r} fill={`url(#aka-bg-${uid})`} />

            {/* Outer ring */}
            <circle cx={cx} cy={cy} r={r * 0.78} fill="none" stroke="#f59e0b" strokeWidth={Math.max(0.5, size * 0.012)} opacity="0.4" strokeDasharray={`${size * 0.06} ${size * 0.04}`} />

            {/* Kazakh ornament — 8 spokes */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              return <line key={i} x1={cx + Math.cos(angle) * r * 0.12} y1={cy + Math.sin(angle) * r * 0.12} x2={cx + Math.cos(angle) * r * 0.5} y2={cy + Math.sin(angle) * r * 0.5} stroke="#f59e0b" strokeWidth={Math.max(1, size * 0.022)} strokeLinecap="round" opacity="0.9" />;
            })}

            {/* Diamond ornaments */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              const dx = cx + Math.cos(angle) * r * 0.58;
              const dy = cy + Math.sin(angle) * r * 0.58;
              const s = size * 0.05;
              return (
                <g key={i} transform={`translate(${dx},${dy}) rotate(${i * 45})`}>
                  <polygon points={`0,${-s} ${s * 0.6},0 0,${s} ${-s * 0.6},0`} fill="#fbbf24" opacity="0.9" />
                </g>
              );
            })}

            {/* Inner ring */}
            <circle cx={cx} cy={cy} r={r * 0.62} fill="none" stroke="#fbbf24" strokeWidth={Math.max(0.5, size * 0.015)} opacity="0.5" />

            {/* Center gem */}
            <circle cx={cx} cy={cy} r={r * 0.16} fill={`url(#aka-center-${uid})`} opacity="0.95" />
            <circle cx={cx} cy={cy} r={r * 0.09} fill="#fef3c7" opacity="0.9" />

            {/* Outer border */}
            <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#f59e0b" strokeWidth={Math.max(1, size * 0.03)} opacity="0.85" />

            {/* "AMBER RANK" text */}
            <text fontSize={fontSize} fill="#fef3c7" fontFamily="'Arial', sans-serif" fontWeight="bold" letterSpacing={Math.max(0.5, size * 0.01)}>
              <textPath href={`#aka-textpath-${uid}`} startOffset="0%">
                AMBER RANK • AMBER RANK •{' '}
              </textPath>
            </text>

            {/* Vignette */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={size * 0.06} />
          </g>
        </svg>

        {/* Rotating conic — outer */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(251,191,36,0.25) 18%, rgba(245,158,11,0.2) 36%, transparent 55%, rgba(251,191,36,0.2) 72%, transparent 90%)',
          animation: `aka-spin-${uid} 3s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Rotating conic — inner (reverse) */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '20%', borderRadius: '50%',
          background: 'conic-gradient(from 90deg, transparent 0%, rgba(251,191,36,0.3) 25%, transparent 50%, rgba(245,158,11,0.25) 75%, transparent 100%)',
          animation: `aka-spin-rev-${uid} 2s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Orbital particles */}
        {[0, 1].map((i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', top: '50%', left: '50%',
            width: Math.max(3, size * 0.07), height: Math.max(3, size * 0.07),
            marginTop: -Math.max(1.5, size * 0.035), marginLeft: -Math.max(1.5, size * 0.035),
            borderRadius: '50%',
            background: 'radial-gradient(circle, #fbbf24 0%, #f59e0b 100%)',
            boxShadow: '0 0 4px 2px rgba(251,191,36,0.8)',
            animation: i === 0 ? `aka-orbit-${uid} 2s linear infinite` : `aka-orbit2-${uid} 2s linear infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
