import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubyJapaneseNewAvatar — Sakura ruby with petal shower.
 * Season: Японские мотивы (Season 9) | Rank: Рубин
 * Animation: pink pulse + petal float + rotating shimmer + "RUBY RANK" text
 */
export function RubyJapaneseNewAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const textR = r * 0.88;
  const fontSize = Math.max(4, size * 0.085);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes rjn-pulse-${uid} {
          0%, 100% { box-shadow: 0 0 6px 2px rgba(244,114,182,0.6), 0 0 14px 5px rgba(236,72,153,0.3); }
          50%       { box-shadow: 0 0 18px 8px rgba(244,114,182,0.9), 0 0 32px 12px rgba(236,72,153,0.5); }
        }
        @keyframes rjn-spin-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes rjn-petal-${uid} {
          0%   { transform: translateY(0) rotate(0deg); opacity: 0.9; }
          100% { transform: translateY(-${size * 0.9}px) rotate(180deg); opacity: 0; }
        }
        @keyframes rjn-float-${uid} {
          0%, 100% { transform: translateY(0) scale(1); }
          50%       { transform: translateY(-${size * 0.04}px) scale(1.02); }
        }
      `}</style>
      <div style={{ width: size, height: size, position: 'relative', animation: `rjn-pulse-${uid} 2.5s ease-in-out infinite`, borderRadius: '50%' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden', position: 'absolute', top: 0, left: 0, animation: `rjn-float-${uid} 3.5s ease-in-out infinite` }}>
          <defs>
            <clipPath id={`rjn-clip-${uid}`}>
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
            <radialGradient id={`rjn-bg-${uid}`} cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#4a0030" />
              <stop offset="55%" stopColor="#280018" />
              <stop offset="100%" stopColor="#0a0008" />
            </radialGradient>
            <path id={`rjn-textpath-${uid}`} d={`M ${cx - textR},${cy} a ${textR},${textR} 0 1,1 0.01,0`} />
          </defs>
          <g clipPath={`url(#rjn-clip-${uid})`}>
            <circle cx={cx} cy={cy} r={r} fill={`url(#rjn-bg-${uid})`} />

            {/* Moon */}
            <circle cx={cx} cy={cy * 0.55} r={r * 0.22} fill="rgba(253,242,248,0.12)" />
            <circle cx={cx} cy={cy * 0.55} r={r * 0.15} fill="rgba(244,114,182,0.15)" />

            {/* Torii silhouette */}
            {(() => {
              const gw = size * 0.42;
              const gh = size * 0.32;
              const gx = cx - gw / 2;
              const gy = cy * 0.6;
              const bw = size * 0.055;
              return (
                <g fill="rgba(244,114,182,0.6)">
                  <rect x={gx - size * 0.03} y={gy} width={gw + size * 0.06} height={bw * 0.55} rx={bw * 0.1} />
                  <rect x={gx} y={gy + bw * 0.8} width={gw} height={bw * 0.35} rx={bw * 0.1} />
                  <rect x={gx + size * 0.04} y={gy + bw * 0.8} width={bw} height={gh} rx={bw * 0.2} />
                  <rect x={gx + gw - size * 0.04 - bw} y={gy + bw * 0.8} width={bw} height={gh} rx={bw * 0.2} />
                </g>
              );
            })()}

            {/* Sakura petals */}
            {[
              { x: cx * 0.4, y: cy * 0.4 },
              { x: cx * 1.55, y: cy * 0.5 },
              { x: cx * 0.3, y: cy * 1.1 },
              { x: cx * 1.6, y: cy * 1.15 },
              { x: cx * 0.8, y: cy * 0.25 },
            ].map((p, i) => {
              const ps = size * 0.055;
              return (
                <g key={i} transform={`translate(${p.x},${p.y}) rotate(${i * 37})`}>
                  {Array.from({ length: 5 }).map((_, j) => {
                    const a = (j * 72 * Math.PI) / 180;
                    return <ellipse key={j} cx={Math.cos(a) * ps * 0.45} cy={Math.sin(a) * ps * 0.45} rx={ps * 0.32} ry={ps * 0.18} fill="#f472b6" opacity="0.7" transform={`rotate(${j * 72})`} />;
                  })}
                  <circle cx={0} cy={0} r={ps * 0.1} fill="#fce7f3" opacity="0.9" />
                </g>
              );
            })}

            {/* Outer border */}
            <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#f472b6" strokeWidth={Math.max(1, size * 0.03)} opacity="0.8" />

            {/* "RUBY RANK" text */}
            <text fontSize={fontSize} fill="#fce7f3" fontFamily="'Arial', sans-serif" fontWeight="bold" letterSpacing={Math.max(0.5, size * 0.01)}>
              <textPath href={`#rjn-textpath-${uid}`} startOffset="0%">
                RUBY RANK • RUBY RANK •{' '}
              </textPath>
            </text>

            {/* Vignette */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={size * 0.06} />
          </g>
        </svg>
        {/* Rotating sakura shimmer */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(244,114,182,0.2) 20%, transparent 40%, rgba(236,72,153,0.15) 60%, transparent 80%)',
          animation: `rjn-spin-${uid} 4s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Falling petals */}
        {[0.2, 0.45, 0.7, 0.35, 0.6].map((x, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', bottom: '5%',
            left: `${x * 100}%`,
            width: Math.max(2, size * 0.06), height: Math.max(2, size * 0.04),
            borderRadius: '50%',
            background: 'rgba(244,114,182,0.8)',
            animation: `rjn-petal-${uid} ${2 + i * 0.5}s ease-out ${i * 0.4}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
