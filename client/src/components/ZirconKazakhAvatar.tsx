import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ZirconKazakhAvatar — Kazakh ornamental pattern (no animation).
 * Season: Казахский колорит (Season 6) | Rank: Циркон
 * Style: Traditional Kazakh geometric ornament on deep amber/brown background
 */
export function ZirconKazakhAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden' }}>
        <defs>
          <clipPath id={`zk-clip-${uid}`}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
          <radialGradient id={`zk-bg-${uid}`} cx="50%" cy="40%" r="60%">
            <stop offset="0%" stopColor="#7c3a00" />
            <stop offset="50%" stopColor="#4a1e00" />
            <stop offset="100%" stopColor="#1a0800" />
          </radialGradient>
          <radialGradient id={`zk-glow-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(245,158,11,0.15)" />
            <stop offset="100%" stopColor="rgba(245,158,11,0)" />
          </radialGradient>
        </defs>
        <g clipPath={`url(#zk-clip-${uid})`}>
          {/* Background */}
          <circle cx={cx} cy={cy} r={r} fill={`url(#zk-bg-${uid})`} />
          {/* Subtle center glow */}
          <circle cx={cx} cy={cy} r={r * 0.8} fill={`url(#zk-glow-${uid})`} />

          {/* Central 8-pointed star (Kazakh shanyrak motif) */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const x1 = cx + Math.cos(angle) * r * 0.08;
            const y1 = cy + Math.sin(angle) * r * 0.08;
            const x2 = cx + Math.cos(angle) * r * 0.42;
            const y2 = cy + Math.sin(angle) * r * 0.42;
            return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#f59e0b" strokeWidth={Math.max(1, size * 0.025)} strokeLinecap="round" opacity="0.9" />;
          })}

          {/* Central circle */}
          <circle cx={cx} cy={cy} r={r * 0.12} fill="#f59e0b" opacity="0.95" />
          <circle cx={cx} cy={cy} r={r * 0.07} fill="#fde68a" opacity="0.9" />

          {/* Inner ring of diamond ornaments */}
          {Array.from({ length: 8 }).map((_, i) => {
            const angle = (i * 45 * Math.PI) / 180;
            const dx = cx + Math.cos(angle) * r * 0.52;
            const dy = cy + Math.sin(angle) * r * 0.52;
            const s = size * 0.04;
            return (
              <g key={i} transform={`translate(${dx},${dy}) rotate(${i * 45})`}>
                <polygon points={`0,${-s} ${s * 0.6},0 0,${s} ${-s * 0.6},0`} fill="#f59e0b" opacity="0.85" />
              </g>
            );
          })}

          {/* Outer decorative ring — Kazakh pattern (alternating arcs) */}
          {Array.from({ length: 16 }).map((_, i) => {
            const angle = (i * 22.5 * Math.PI) / 180;
            const dx = cx + Math.cos(angle) * r * 0.75;
            const dy = cy + Math.sin(angle) * r * 0.75;
            return (
              <circle key={i} cx={dx} cy={dy} r={Math.max(1.5, size * 0.025)} fill={i % 2 === 0 ? '#f59e0b' : '#dc2626'} opacity="0.8" />
            );
          })}

          {/* Outer border ring */}
          <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#f59e0b" strokeWidth={Math.max(1, size * 0.03)} opacity="0.7" />
          <circle cx={cx} cy={cy} r={r * 0.82} fill="none" stroke="#dc2626" strokeWidth={Math.max(0.5, size * 0.015)} opacity="0.5" />

          {/* 4 corner ornaments (traditional Kazakh "tumar" shape) */}
          {[0, 90, 180, 270].map((deg, i) => {
            const angle = (deg * Math.PI) / 180;
            const dx = cx + Math.cos(angle) * r * 0.62;
            const dy = cy + Math.sin(angle) * r * 0.62;
            const s = size * 0.055;
            return (
              <g key={i} transform={`translate(${dx},${dy}) rotate(${deg})`}>
                <polygon points={`0,${-s} ${s * 0.5},${s * 0.3} 0,${s * 0.7} ${-s * 0.5},${s * 0.3}`} fill="#dc2626" opacity="0.9" />
              </g>
            );
          })}

          {/* Vignette */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={size * 0.06} />
        </g>
        {/* Outer glow border */}
        <circle cx={cx} cy={cy} r={r - 1} fill="none" stroke="rgba(245,158,11,0.5)" strokeWidth={Math.max(1, size * 0.025)} />
      </svg>
    </div>
  );
}
