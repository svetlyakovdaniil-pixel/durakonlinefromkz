import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ZirconApocalypseAvatar — Radioactive wasteland (no animation).
 * Season: Апокалипсис (Season 8) | Rank: Циркон
 * Style: Radiation symbol on cracked earth / dark red-orange wasteland
 */
export function ZirconApocalypseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden' }}>
        <defs>
          <clipPath id={`za-clip-${uid}`}>
            <circle cx={cx} cy={cy} r={r} />
          </clipPath>
          <radialGradient id={`za-bg-${uid}`} cx="50%" cy="40%" r="70%">
            <stop offset="0%" stopColor="#4a0a00" />
            <stop offset="50%" stopColor="#2a0500" />
            <stop offset="100%" stopColor="#0f0200" />
          </radialGradient>
          <radialGradient id={`za-glow-${uid}`} cx="50%" cy="50%" r="40%">
            <stop offset="0%" stopColor="rgba(239,68,68,0.2)" />
            <stop offset="100%" stopColor="rgba(239,68,68,0)" />
          </radialGradient>
        </defs>
        <g clipPath={`url(#za-clip-${uid})`}>
          {/* Background */}
          <circle cx={cx} cy={cy} r={r} fill={`url(#za-bg-${uid})`} />
          <circle cx={cx} cy={cy} r={r * 0.7} fill={`url(#za-glow-${uid})`} />

          {/* Cracked earth lines */}
          {[
            [[cx, cy * 0.2], [cx * 0.4, cy * 0.7], [cx * 0.2, cy * 1.1]],
            [[cx * 1.6, cy * 0.4], [cx * 1.2, cy * 0.9], [cx * 1.5, cy * 1.4]],
            [[cx * 0.3, cy * 1.3], [cx * 0.7, cy * 1.6], [cx * 1.1, cy * 1.8]],
            [[cx * 1.7, cy * 1.2], [cx * 1.3, cy * 1.5], [cx * 0.9, cy * 1.7]],
          ].map((pts, i) => (
            <polyline key={i} points={pts.map(p => p.join(',')).join(' ')} fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth={Math.max(0.5, size * 0.012)} />
          ))}

          {/* Radiation symbol */}
          {(() => {
            const rOuter = r * 0.35;
            const rInner = r * 0.13;
            const rCenter = r * 0.08;
            return Array.from({ length: 3 }).map((_, i) => {
              const startAngle = (i * 120 - 30) * Math.PI / 180;
              const endAngle = (i * 120 + 30) * Math.PI / 180;
              const x1o = cx + Math.cos(startAngle) * rOuter;
              const y1o = cy + Math.sin(startAngle) * rOuter;
              const x2o = cx + Math.cos(endAngle) * rOuter;
              const y2o = cy + Math.sin(endAngle) * rOuter;
              const x1i = cx + Math.cos(endAngle) * rInner;
              const y1i = cy + Math.sin(endAngle) * rInner;
              const x2i = cx + Math.cos(startAngle) * rInner;
              const y2i = cy + Math.sin(startAngle) * rInner;
              return (
                <path key={i}
                  d={`M ${x1o} ${y1o} A ${rOuter} ${rOuter} 0 0 1 ${x2o} ${y2o} L ${x1i} ${y1i} A ${rInner} ${rInner} 0 0 0 ${x2i} ${y2i} Z`}
                  fill="#ef4444" opacity="0.9"
                />
              );
            });
          })()}
          <circle cx={cx} cy={cy} r={r * 0.08} fill="#ef4444" opacity="0.95" />
          <circle cx={cx} cy={cy} r={r * 0.05} fill="#fca5a5" opacity="0.9" />

          {/* Outer rings */}
          <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#ef4444" strokeWidth={Math.max(1, size * 0.03)} opacity="0.7" />
          <circle cx={cx} cy={cy} r={r * 0.82} fill="none" stroke="#f97316" strokeWidth={Math.max(0.5, size * 0.015)} opacity="0.4" />

          {/* Warning dots */}
          {Array.from({ length: 12 }).map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            return <circle key={i} cx={cx + Math.cos(angle) * r * 0.75} cy={cy + Math.sin(angle) * r * 0.75} r={Math.max(1, size * 0.02)} fill={i % 2 === 0 ? '#ef4444' : '#f97316'} opacity="0.7" />;
          })}

          {/* Vignette */}
          <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={size * 0.07} />
        </g>
        <circle cx={cx} cy={cy} r={r - 1} fill="none" stroke="rgba(239,68,68,0.6)" strokeWidth={Math.max(1, size * 0.025)} />
      </svg>
    </div>
  );
}
