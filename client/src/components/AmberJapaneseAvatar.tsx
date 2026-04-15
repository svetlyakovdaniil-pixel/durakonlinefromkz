import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * AmberJapaneseAvatar — Golden sakura with koi fish swirl.
 * Season: Японские мотивы (Season 9) | Rank: Янтарь
 * Animation: golden shimmer + petal orbit + double conic + "AMBER RANK" text
 */
export function AmberJapaneseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const textR = r * 0.88;
  const fontSize = Math.max(4, size * 0.085);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes ajp-aura-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(245,158,11,0.7), 0 0 18px 7px rgba(251,191,36,0.4), 0 0 32px 12px rgba(253,224,71,0.2); }
          50%  { box-shadow: 0 0 22px 10px rgba(251,191,36,0.95), 0 0 40px 16px rgba(245,158,11,0.65), 0 0 58px 22px rgba(253,224,71,0.35); }
          100% { box-shadow: 0 0 8px 3px rgba(245,158,11,0.7), 0 0 18px 7px rgba(251,191,36,0.4), 0 0 32px 12px rgba(253,224,71,0.2); }
        }
        @keyframes ajp-spin-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ajp-spin-rev-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes ajp-petal-orbit-${uid} {
          from { transform: rotate(0deg) translateX(${r * 0.65}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${r * 0.65}px) rotate(-360deg); }
        }
        @keyframes ajp-petal-orbit2-${uid} {
          from { transform: rotate(180deg) translateX(${r * 0.65}px) rotate(-180deg); }
          to   { transform: rotate(540deg) translateX(${r * 0.65}px) rotate(-540deg); }
        }
        @keyframes ajp-float-${uid} {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50%       { transform: scale(1.03) rotate(1deg); }
        }
      `}</style>
      <div style={{ width: size, height: size, position: 'relative', animation: `ajp-aura-${uid} 2.2s ease-in-out infinite`, borderRadius: '50%' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden', position: 'absolute', top: 0, left: 0, animation: `ajp-float-${uid} 4s ease-in-out infinite` }}>
          <defs>
            <clipPath id={`ajp-clip-${uid}`}>
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
            <radialGradient id={`ajp-bg-${uid}`} cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#3a2500" />
              <stop offset="55%" stopColor="#1e1200" />
              <stop offset="100%" stopColor="#080500" />
            </radialGradient>
            <radialGradient id={`ajp-gem-${uid}`} cx="40%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#fef9c3" />
              <stop offset="50%" stopColor="#fbbf24" />
              <stop offset="100%" stopColor="#d97706" />
            </radialGradient>
            <path id={`ajp-textpath-${uid}`} d={`M ${cx - textR},${cy} a ${textR},${textR} 0 1,1 0.01,0`} />
          </defs>
          <g clipPath={`url(#ajp-clip-${uid})`}>
            <circle cx={cx} cy={cy} r={r} fill={`url(#ajp-bg-${uid})`} />

            {/* Moon */}
            <circle cx={cx * 0.6} cy={cy * 0.55} r={r * 0.2} fill="rgba(253,224,71,0.12)" />

            {/* Torii in gold */}
            {(() => {
              const gw = size * 0.38;
              const gh = size * 0.28;
              const gx = cx - gw / 2;
              const gy = cy * 0.65;
              const bw = size * 0.05;
              return (
                <g fill="rgba(251,191,36,0.55)">
                  <rect x={gx - size * 0.025} y={gy} width={gw + size * 0.05} height={bw * 0.5} rx={bw * 0.1} />
                  <rect x={gx} y={gy + bw * 0.75} width={gw} height={bw * 0.3} rx={bw * 0.1} />
                  <rect x={gx + size * 0.035} y={gy + bw * 0.75} width={bw} height={gh} rx={bw * 0.2} />
                  <rect x={gx + gw - size * 0.035 - bw} y={gy + bw * 0.75} width={bw} height={gh} rx={bw * 0.2} />
                </g>
              );
            })()}

            {/* Sakura petals */}
            {[
              { x: cx * 0.35, y: cy * 0.35 },
              { x: cx * 1.6, y: cy * 0.45 },
              { x: cx * 0.25, y: cy * 1.15 },
              { x: cx * 1.65, y: cy * 1.2 },
              { x: cx * 0.85, y: cy * 0.2 },
              { x: cx * 1.15, y: cy * 0.22 },
            ].map((p, i) => {
              const ps = size * 0.05;
              return (
                <g key={i} transform={`translate(${p.x},${p.y}) rotate(${i * 30})`}>
                  {Array.from({ length: 5 }).map((_, j) => {
                    const a = (j * 72 * Math.PI) / 180;
                    return <ellipse key={j} cx={Math.cos(a) * ps * 0.42} cy={Math.sin(a) * ps * 0.42} rx={ps * 0.3} ry={ps * 0.16} fill="#fbbf24" opacity="0.65" transform={`rotate(${j * 72})`} />;
                  })}
                  <circle cx={0} cy={0} r={ps * 0.09} fill="#fef9c3" opacity="0.9" />
                </g>
              );
            })}

            {/* Concentric rings */}
            {[0.4, 0.62].map((s, i) => (
              <circle key={i} cx={cx} cy={cy} r={r * s} fill="none" stroke="#fbbf24" strokeWidth={Math.max(0.5, size * 0.012)} opacity={0.5 - i * 0.1} />
            ))}

            {/* Center gem */}
            <circle cx={cx} cy={cy} r={r * 0.16} fill={`url(#ajp-gem-${uid})`} opacity="0.95" />
            <circle cx={cx} cy={cy} r={r * 0.09} fill="#fef9c3" opacity="0.9" />
            <circle cx={cx} cy={cy} r={r * 0.045} fill="white" opacity="0.95" />

            {/* Outer border */}
            <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#f59e0b" strokeWidth={Math.max(1, size * 0.03)} opacity="0.85" />

            {/* "AMBER RANK" text */}
            <text fontSize={fontSize} fill="#fef9c3" fontFamily="'Arial', sans-serif" fontWeight="bold" letterSpacing={Math.max(0.5, size * 0.01)}>
              <textPath href={`#ajp-textpath-${uid}`} startOffset="0%">
                AMBER RANK • AMBER RANK •{' '}
              </textPath>
            </text>

            {/* Vignette */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={size * 0.06} />
          </g>
        </svg>

        {/* Outer conic */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(251,191,36,0.28) 20%, rgba(245,158,11,0.22) 40%, transparent 60%, rgba(253,224,71,0.2) 80%, transparent 100%)',
          animation: `ajp-spin-${uid} 3.5s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Inner reverse conic */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '18%', borderRadius: '50%',
          background: 'conic-gradient(from 30deg, transparent 0%, rgba(251,191,36,0.38) 30%, transparent 60%, rgba(245,158,11,0.3) 90%, transparent 100%)',
          animation: `ajp-spin-rev-${uid} 2.5s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Orbital petal particles */}
        {[`ajp-petal-orbit-${uid}`, `ajp-petal-orbit2-${uid}`].map((anim, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', top: '50%', left: '50%',
            width: Math.max(4, size * 0.09), height: Math.max(3, size * 0.06),
            marginTop: -Math.max(2, size * 0.045), marginLeft: -Math.max(2, size * 0.03),
            borderRadius: '50%',
            background: i === 0 ? 'rgba(251,191,36,0.9)' : 'rgba(253,224,71,0.85)',
            boxShadow: `0 0 4px 2px rgba(251,191,36,0.7)`,
            animation: `${anim} 2.5s linear infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
