import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * AmberApocalypseAvatar — Radioactive amber with lava cracks.
 * Season: Апокалипсис (Season 8) | Rank: Янтарь
 * Animation: lava pulse + crack glow + triple orbit + "AMBER RANK" text
 */
export function AmberApocalypseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const textR = r * 0.88;
  const fontSize = Math.max(4, size * 0.085);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes aap-lava-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(245,158,11,0.8), 0 0 18px 7px rgba(249,115,22,0.5), 0 0 32px 12px rgba(234,179,8,0.25); }
          33%  { box-shadow: 0 0 24px 11px rgba(249,115,22,1), 0 0 44px 18px rgba(245,158,11,0.7), 0 0 64px 24px rgba(234,179,8,0.4); }
          66%  { box-shadow: 0 0 14px 6px rgba(234,179,8,0.9), 0 0 28px 11px rgba(245,158,11,0.6), 0 0 48px 18px rgba(249,115,22,0.3); }
          100% { box-shadow: 0 0 8px 3px rgba(245,158,11,0.8), 0 0 18px 7px rgba(249,115,22,0.5), 0 0 32px 12px rgba(234,179,8,0.25); }
        }
        @keyframes aap-spin-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes aap-spin-rev-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes aap-crack-${uid} {
          0%, 100% { filter: brightness(1) drop-shadow(0 0 2px rgba(249,115,22,0.6)); }
          50%       { filter: brightness(1.5) drop-shadow(0 0 6px rgba(249,115,22,1)); }
        }
        @keyframes aap-orbit-${uid} {
          from { transform: rotate(0deg) translateX(${r * 0.68}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${r * 0.68}px) rotate(-360deg); }
        }
        @keyframes aap-orbit2-${uid} {
          from { transform: rotate(120deg) translateX(${r * 0.68}px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(${r * 0.68}px) rotate(-480deg); }
        }
        @keyframes aap-orbit3-${uid} {
          from { transform: rotate(240deg) translateX(${r * 0.68}px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(${r * 0.68}px) rotate(-600deg); }
        }
      `}</style>
      <div style={{ width: size, height: size, position: 'relative', animation: `aap-lava-${uid} 1.6s ease-in-out infinite`, borderRadius: '50%' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden', position: 'absolute', top: 0, left: 0, animation: `aap-crack-${uid} 2.5s ease-in-out infinite` }}>
          <defs>
            <clipPath id={`aap-clip-${uid}`}>
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
            <radialGradient id={`aap-bg-${uid}`} cx="50%" cy="55%" r="65%">
              <stop offset="0%" stopColor="#4a2000" />
              <stop offset="45%" stopColor="#2a0e00" />
              <stop offset="100%" stopColor="#0a0300" />
            </radialGradient>
            <radialGradient id={`aap-gem-${uid}`} cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="40%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#f97316" />
            </radialGradient>
            <path id={`aap-textpath-${uid}`} d={`M ${cx - textR},${cy} a ${textR},${textR} 0 1,1 0.01,0`} />
          </defs>
          <g clipPath={`url(#aap-clip-${uid})`}>
            <circle cx={cx} cy={cy} r={r} fill={`url(#aap-bg-${uid})`} />

            {/* Lava cracks */}
            {[
              `M ${cx} ${cy} L ${cx - r * 0.3} ${cy - r * 0.5} L ${cx - r * 0.45} ${cy - r * 0.7}`,
              `M ${cx} ${cy} L ${cx + r * 0.35} ${cy - r * 0.4} L ${cx + r * 0.5} ${cy - r * 0.65}`,
              `M ${cx} ${cy} L ${cx + r * 0.2} ${cy + r * 0.5} L ${cx + r * 0.35} ${cy + r * 0.7}`,
              `M ${cx} ${cy} L ${cx - r * 0.4} ${cy + r * 0.35} L ${cx - r * 0.6} ${cy + r * 0.55}`,
            ].map((d, i) => (
              <path key={i} d={d} fill="none" stroke="#f97316" strokeWidth={Math.max(0.5, size * 0.015)} opacity="0.7" />
            ))}

            {/* Radiation rings */}
            {[0.3, 0.5, 0.7].map((s, i) => (
              <circle key={i} cx={cx} cy={cy} r={r * s} fill="none" stroke="#f59e0b" strokeWidth={Math.max(0.5, size * 0.01)} opacity={0.7 - i * 0.15} strokeDasharray={`${size * 0.04} ${size * 0.03}`} />
            ))}

            {/* Center gem */}
            <circle cx={cx} cy={cy} r={r * 0.18} fill={`url(#aap-gem-${uid})`} opacity="0.95" />
            <circle cx={cx} cy={cy} r={r * 0.1} fill="#fef3c7" opacity="0.9" />
            <circle cx={cx} cy={cy} r={r * 0.05} fill="white" opacity="0.95" />

            {/* Outer border */}
            <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#f59e0b" strokeWidth={Math.max(1, size * 0.03)} opacity="0.85" />

            {/* "AMBER RANK" text */}
            <text fontSize={fontSize} fill="#fef3c7" fontFamily="'Arial', sans-serif" fontWeight="bold" letterSpacing={Math.max(0.5, size * 0.01)}>
              <textPath href={`#aap-textpath-${uid}`} startOffset="0%">
                AMBER RANK • AMBER RANK •{' '}
              </textPath>
            </text>

            {/* Vignette */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={size * 0.06} />
          </g>
        </svg>

        {/* Outer conic */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(249,115,22,0.3) 20%, rgba(245,158,11,0.25) 40%, transparent 60%, rgba(234,179,8,0.2) 80%, transparent 100%)',
          animation: `aap-spin-${uid} 2s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Inner reverse conic */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '18%', borderRadius: '50%',
          background: 'conic-gradient(from 45deg, transparent 0%, rgba(251,191,36,0.4) 30%, transparent 60%, rgba(249,115,22,0.3) 90%, transparent 100%)',
          animation: `aap-spin-rev-${uid} 1.5s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* 3 orbital particles */}
        {[`aap-orbit-${uid}`, `aap-orbit2-${uid}`, `aap-orbit3-${uid}`].map((anim, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', top: '50%', left: '50%',
            width: Math.max(3, size * 0.07), height: Math.max(3, size * 0.07),
            marginTop: -Math.max(1.5, size * 0.035), marginLeft: -Math.max(1.5, size * 0.035),
            borderRadius: '50%',
            background: i === 0 ? '#fbbf24' : i === 1 ? '#f97316' : '#fef3c7',
            boxShadow: `0 0 4px 2px rgba(251,191,36,0.8)`,
            animation: `${anim} 1.8s linear infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
