import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ZirconJapaneseNewAvatar — Cherry blossom / torii gate (no animation).
 * Season: Японские мотивы (Season 9) | Rank: Циркон
 * Style: Pink sakura petals on dark gradient, torii silhouette
 */
export function ZirconJapaneseNewAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden' }}>
        <defs>
          <clipPath id={`zjn-clip-${uid}`}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
          <radialGradient id={`zjn-bg-${uid}`} cx="50%" cy="35%" r="65%">
            <stop offset="0%" stopColor="#3d0030" />
            <stop offset="55%" stopColor="#1f0018" />
            <stop offset="100%" stopColor="#0a0008" />
          </radialGradient>
          <radialGradient id={`zjn-moon-${uid}`} cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(244,114,182,0.25)" />
            <stop offset="100%" stopColor="rgba(244,114,182,0)" />
          </radialGradient>
        </defs>
        <g clipPath={`url(#zjn-clip-${uid})`}>
          {/* Background */}
          <circle cx={cx} cy={cy} r={r} fill={`url(#zjn-bg-${uid})`} />

          {/* Moon glow */}
          <circle cx={cx} cy={cy * 0.55} r={r * 0.28} fill="rgba(244,114,182,0.18)" />
          <circle cx={cx} cy={cy * 0.55} r={r * 0.18} fill="rgba(253,242,248,0.12)" />

          {/* Torii gate silhouette */}
          {(() => {
            const gw = size * 0.5;
            const gh = size * 0.38;
            const gx = cx - gw / 2;
            const gy = cy * 0.55;
            const bw = size * 0.06;
            return (
              <g fill="rgba(220,38,38,0.7)" stroke="rgba(220,38,38,0.4)" strokeWidth={0.5}>
                {/* Top beam */}
                <rect x={gx - size * 0.04} y={gy} width={gw + size * 0.08} height={bw * 0.6} rx={bw * 0.1} />
                {/* Second beam */}
                <rect x={gx} y={gy + bw * 0.9} width={gw} height={bw * 0.4} rx={bw * 0.1} />
                {/* Left pillar */}
                <rect x={gx + size * 0.04} y={gy + bw * 0.9} width={bw} height={gh} rx={bw * 0.2} />
                {/* Right pillar */}
                <rect x={gx + gw - size * 0.04 - bw} y={gy + bw * 0.9} width={bw} height={gh} rx={bw * 0.2} />
              </g>
            );
          })()}

          {/* Sakura petals */}
          {[
            { x: cx * 0.35, y: cy * 0.35, rot: 15 },
            { x: cx * 1.6, y: cy * 0.45, rot: -20 },
            { x: cx * 0.25, y: cy * 1.1, rot: 35 },
            { x: cx * 1.7, y: cy * 1.2, rot: -10 },
            { x: cx * 0.7, y: cy * 0.2, rot: 5 },
            { x: cx * 1.3, y: cy * 1.6, rot: 25 },
            { x: cx * 0.5, y: cy * 1.55, rot: -30 },
          ].map((p, i) => {
            const ps = size * 0.06;
            return (
              <g key={i} transform={`translate(${p.x},${p.y}) rotate(${p.rot})`}>
                {Array.from({ length: 5 }).map((_, j) => {
                  const a = (j * 72 * Math.PI) / 180;
                  return <ellipse key={j} cx={Math.cos(a) * ps * 0.5} cy={Math.sin(a) * ps * 0.5} rx={ps * 0.35} ry={ps * 0.2} fill="#f472b6" opacity="0.75" transform={`rotate(${j * 72})`} />;
                })}
                <circle cx={0} cy={0} r={ps * 0.12} fill="#fce7f3" opacity="0.9" />
              </g>
            );
          })}

          {/* Outer rings */}
          <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#f472b6" strokeWidth={Math.max(1, size * 0.03)} opacity="0.7" />
          <circle cx={cx} cy={cy} r={r * 0.82} fill="none" stroke="#ec4899" strokeWidth={Math.max(0.5, size * 0.015)} opacity="0.4" />

          {/* Decorative dots */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            return <circle key={i} cx={cx + Math.cos(angle) * r * 0.75} cy={cy + Math.sin(angle) * r * 0.75} r={Math.max(1, size * 0.02)} fill={i % 2 === 0 ? '#f472b6' : '#ec4899'} opacity="0.7" />;
          })}

          {/* Vignette */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={size * 0.07} />
        </g>
        <circle cx={cx} cy={cy} r={r - 1} fill="none" stroke="rgba(244,114,182,0.6)" strokeWidth={Math.max(1, size * 0.025)} />
      </svg>
    </div>
  );
}
