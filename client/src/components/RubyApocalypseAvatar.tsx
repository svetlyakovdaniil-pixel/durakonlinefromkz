import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubyApocalypseAvatar — Fire and ash ruby with ember particles.
 * Season: Апокалипсис (Season 8) | Rank: Рубин
 * Animation: fire pulse + ember float + rotating conic + "RUBY RANK" text
 */
export function RubyApocalypseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const textR = r * 0.88;
  const fontSize = Math.max(4, size * 0.085);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes rap-fire-${uid} {
          0%, 100% { box-shadow: 0 0 8px 3px rgba(239,68,68,0.7), 0 0 18px 6px rgba(249,115,22,0.4); }
          33%       { box-shadow: 0 0 20px 9px rgba(249,115,22,0.9), 0 0 36px 14px rgba(239,68,68,0.5); }
          66%       { box-shadow: 0 0 12px 5px rgba(239,68,68,0.8), 0 0 24px 9px rgba(234,179,8,0.3); }
        }
        @keyframes rap-spin-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes rap-ember-${uid} {
          0%   { transform: translateY(0) scale(0.8); opacity: 0.9; }
          100% { transform: translateY(-${size * 0.9}px) scale(0.3); opacity: 0; }
        }
        @keyframes rap-flicker-${uid} {
          0%, 100% { filter: brightness(1); }
          25%       { filter: brightness(1.3) saturate(1.4); }
          75%       { filter: brightness(0.9); }
        }
      `}</style>
      <div style={{ width: size, height: size, position: 'relative', animation: `rap-fire-${uid} 1.8s ease-in-out infinite`, borderRadius: '50%' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden', position: 'absolute', top: 0, left: 0, animation: `rap-flicker-${uid} 2.5s ease-in-out infinite` }}>
          <defs>
            <clipPath id={`rap-clip-${uid}`}>
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
            <radialGradient id={`rap-bg-${uid}`} cx="50%" cy="60%" r="70%">
              <stop offset="0%" stopColor="#5a1000" />
              <stop offset="40%" stopColor="#3a0800" />
              <stop offset="100%" stopColor="#0f0200" />
            </radialGradient>
            <radialGradient id={`rap-glow-${uid}`} cx="50%" cy="70%" r="50%">
              <stop offset="0%" stopColor="rgba(249,115,22,0.3)" />
              <stop offset="100%" stopColor="rgba(249,115,22,0)" />
            </radialGradient>
            <path id={`rap-textpath-${uid}`} d={`M ${cx - textR},${cy} a ${textR},${textR} 0 1,1 0.01,0`} />
          </defs>
          <g clipPath={`url(#rap-clip-${uid})`}>
            <circle cx={cx} cy={cy} r={r} fill={`url(#rap-bg-${uid})`} />
            <circle cx={cx} cy={cy * 1.3} r={r * 0.7} fill={`url(#rap-glow-${uid})`} />

            {/* Flame shapes */}
            {[
              { x: cx, baseY: cy * 1.6, h: r * 0.6, w: r * 0.25, c: '#ef4444' },
              { x: cx * 0.7, baseY: cy * 1.7, h: r * 0.45, w: r * 0.18, c: '#f97316' },
              { x: cx * 1.3, baseY: cy * 1.7, h: r * 0.45, w: r * 0.18, c: '#f97316' },
            ].map((fl, i) => (
              <ellipse key={i} cx={fl.x} cy={fl.baseY - fl.h / 2} rx={fl.w} ry={fl.h / 2} fill={fl.c} opacity="0.7" />
            ))}

            {/* Radiation / target symbol */}
            {Array.from({ length: 3 }).map((_, i) => {
              const startAngle = (i * 120 - 30) * Math.PI / 180;
              const endAngle = (i * 120 + 30) * Math.PI / 180;
              const rOuter = r * 0.38;
              const rInner = r * 0.14;
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
                  fill="#ef4444" opacity="0.85"
                />
              );
            })}

            {/* Center */}
            <circle cx={cx} cy={cy} r={r * 0.1} fill="#ef4444" opacity="0.95" />
            <circle cx={cx} cy={cy} r={r * 0.06} fill="#fed7aa" opacity="0.9" />

            {/* Outer border */}
            <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#ef4444" strokeWidth={Math.max(1, size * 0.03)} opacity="0.8" />

            {/* "RUBY RANK" text */}
            <text fontSize={fontSize} fill="#fca5a5" fontFamily="'Arial', sans-serif" fontWeight="bold" letterSpacing={Math.max(0.5, size * 0.01)}>
              <textPath href={`#rap-textpath-${uid}`} startOffset="0%">
                RUBY RANK • RUBY RANK •{' '}
              </textPath>
            </text>

            {/* Vignette */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.45)" strokeWidth={size * 0.06} />
          </g>
        </svg>
        {/* Rotating fire conic */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(239,68,68,0.3) 15%, rgba(249,115,22,0.2) 30%, transparent 50%, rgba(239,68,68,0.25) 70%, transparent 90%)',
          animation: `rap-spin-${uid} 2.5s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Ember particles */}
        {[0.2, 0.5, 0.75, 0.35, 0.65].map((x, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', bottom: '10%',
            left: `${x * 100}%`,
            width: Math.max(2, size * 0.05), height: Math.max(2, size * 0.05),
            borderRadius: '50%',
            background: i % 2 === 0 ? 'rgba(239,68,68,0.9)' : 'rgba(249,115,22,0.8)',
            animation: `rap-ember-${uid} ${1.5 + i * 0.4}s ease-out ${i * 0.3}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
