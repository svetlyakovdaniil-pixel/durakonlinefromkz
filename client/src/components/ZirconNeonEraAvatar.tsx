import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ZirconNeonEraAvatar — Neon city grid (no animation).
 * Season: Неоновая эра (Season 7) | Rank: Циркон
 * Style: Cyberpunk grid / neon circuit pattern on dark purple background
 */
export function ZirconNeonEraAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden' }}>
        <defs>
          <clipPath id={`zne-clip-${uid}`}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
          <radialGradient id={`zne-bg-${uid}`} cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#2d0060" />
            <stop offset="60%" stopColor="#1a0040" />
            <stop offset="100%" stopColor="#0a0020" />
          </radialGradient>
        </defs>
        <g clipPath={`url(#zne-clip-${uid})`}>
          {/* Background */}
          <circle cx={cx} cy={cy} r={r} fill={`url(#zne-bg-${uid})`} />

          {/* Grid lines — horizontal */}
          {Array.from({ length: 7 }).map((_, i) => {
            const y = (size / 8) * (i + 1);
            return <line key={`h${i}`} x1={0} y1={y} x2={size} y2={y} stroke="rgba(168,85,247,0.25)" strokeWidth={0.5} />;
          })}
          {/* Grid lines — vertical */}
          {Array.from({ length: 7 }).map((_, i) => {
            const x = (size / 8) * (i + 1);
            return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={size} stroke="rgba(168,85,247,0.25)" strokeWidth={0.5} />;
          })}

          {/* Circuit traces */}
          <polyline points={`${cx * 0.3},${cy} ${cx * 0.3},${cy * 0.5} ${cx},${cy * 0.5}`} fill="none" stroke="rgba(168,85,247,0.6)" strokeWidth={Math.max(1, size * 0.02)} />
          <polyline points={`${cx * 1.7},${cy} ${cx * 1.7},${cy * 1.5} ${cx},${cy * 1.5}`} fill="none" stroke="rgba(236,72,153,0.6)" strokeWidth={Math.max(1, size * 0.02)} />
          <polyline points={`${cx},${cy * 0.3} ${cx * 1.4},${cy * 0.3} ${cx * 1.4},${cy}`} fill="none" stroke="rgba(99,102,241,0.5)" strokeWidth={Math.max(0.8, size * 0.015)} />

          {/* Circuit nodes */}
          {[
            { x: cx * 0.3, y: cy * 0.5, c: '#a855f7' },
            { x: cx, y: cy * 0.5, c: '#a855f7' },
            { x: cx * 1.7, y: cy * 1.5, c: '#ec4899' },
            { x: cx, y: cy * 1.5, c: '#ec4899' },
            { x: cx * 1.4, y: cy * 0.3, c: '#818cf8' },
            { x: cx * 1.4, y: cy, c: '#818cf8' },
          ].map((n, i) => (
            <circle key={i} cx={n.x} cy={n.y} r={Math.max(2, size * 0.04)} fill={n.c} opacity="0.9" />
          ))}

          {/* Central hexagon */}
          {(() => {
            const s = r * 0.3;
            const pts = Array.from({ length: 6 }).map((_, i) => {
              const a = (i * 60 * Math.PI) / 180;
              return `${cx + Math.cos(a) * s},${cy + Math.sin(a) * s}`;
            }).join(' ');
            return <polygon points={pts} fill="none" stroke="#a855f7" strokeWidth={Math.max(1, size * 0.025)} opacity="0.9" />;
          })()}
          <circle cx={cx} cy={cy} r={r * 0.12} fill="#a855f7" opacity="0.95" />
          <circle cx={cx} cy={cy} r={r * 0.07} fill="#e9d5ff" opacity="0.9" />

          {/* Outer ring */}
          <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#a855f7" strokeWidth={Math.max(1, size * 0.03)} opacity="0.7" />
          <circle cx={cx} cy={cy} r={r * 0.82} fill="none" stroke="#ec4899" strokeWidth={Math.max(0.5, size * 0.015)} opacity="0.4" />

          {/* Corner accent dots */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            return <circle key={i} cx={cx + Math.cos(angle) * r * 0.75} cy={cy + Math.sin(angle) * r * 0.75} r={Math.max(1, size * 0.02)} fill={i % 3 === 0 ? '#a855f7' : i % 3 === 1 ? '#ec4899' : '#818cf8'} opacity="0.7" />;
          })}

          {/* Vignette */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={size * 0.07} />
        </g>
        <circle cx={cx} cy={cy} r={r - 1} fill="none" stroke="rgba(168,85,247,0.6)" strokeWidth={Math.max(1, size * 0.025)} />
      </svg>
    </div>
  );
}
