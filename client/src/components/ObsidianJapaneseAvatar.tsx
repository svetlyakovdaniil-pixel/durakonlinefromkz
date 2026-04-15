import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ObsidianJapaneseAvatar — Purple void sakura with spirit dragon.
 * Season: Японские мотивы (Season 9) | Rank: Обсидиан
 * Animation: void pulse + spirit bloom + triple orbit + petal burst
 */
export function ObsidianJapaneseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes ojp-void-${uid} {
          0%   { box-shadow: 0 0 10px 4px rgba(168,85,247,0.8), 0 0 24px 9px rgba(139,92,246,0.5), 0 0 44px 16px rgba(109,40,217,0.3), 0 0 70px 26px rgba(88,28,135,0.15); }
          33%  { box-shadow: 0 0 28px 12px rgba(192,132,252,1), 0 0 52px 20px rgba(168,85,247,0.75), 0 0 80px 30px rgba(139,92,246,0.45), 0 0 110px 40px rgba(109,40,217,0.2); }
          66%  { box-shadow: 0 0 16px 7px rgba(139,92,246,0.9), 0 0 36px 14px rgba(168,85,247,0.6), 0 0 60px 22px rgba(192,132,252,0.35), 0 0 90px 33px rgba(109,40,217,0.18); }
          100% { box-shadow: 0 0 10px 4px rgba(168,85,247,0.8), 0 0 24px 9px rgba(139,92,246,0.5), 0 0 44px 16px rgba(109,40,217,0.3), 0 0 70px 26px rgba(88,28,135,0.15); }
        }
        @keyframes ojp-spin-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ojp-spin-rev-${uid} { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes ojp-spin-fast-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ojp-float-${uid} {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50%       { transform: scale(1.04) rotate(1.5deg); }
        }
        @keyframes ojp-orbit-${uid} {
          from { transform: rotate(0deg) translateX(${r * 0.7}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${r * 0.7}px) rotate(-360deg); }
        }
        @keyframes ojp-orbit2-${uid} {
          from { transform: rotate(120deg) translateX(${r * 0.7}px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(${r * 0.7}px) rotate(-480deg); }
        }
        @keyframes ojp-orbit3-${uid} {
          from { transform: rotate(240deg) translateX(${r * 0.7}px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(${r * 0.7}px) rotate(-600deg); }
        }
        @keyframes ojp-eye-${uid} {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.18); filter: drop-shadow(0 0 6px rgba(192,132,252,1)); }
        }
        @keyframes ojp-petal-${uid} {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.9; }
          100% { transform: translateY(-${size * 0.9}px) rotate(270deg) scale(0.3); opacity: 0; }
        }
      `}</style>
      <div style={{ width: size, height: size, position: 'relative', animation: `ojp-void-${uid} 1.8s ease-in-out infinite`, borderRadius: '50%' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden', position: 'absolute', top: 0, left: 0, animation: `ojp-float-${uid} 4s ease-in-out infinite` }}>
          <defs>
            <clipPath id={`ojp-clip-${uid}`}>
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
            <radialGradient id={`ojp-bg-${uid}`} cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#1a0830" />
              <stop offset="55%" stopColor="#0c0418" />
              <stop offset="100%" stopColor="#030108" />
            </radialGradient>
            <radialGradient id={`ojp-eye-grad-${uid}`} cx="40%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#f3e8ff" />
              <stop offset="40%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6d28d9" />
            </radialGradient>
          </defs>
          <g clipPath={`url(#ojp-clip-${uid})`}>
            <circle cx={cx} cy={cy} r={r} fill={`url(#ojp-bg-${uid})`} />

            {/* Moon */}
            <circle cx={cx * 0.6} cy={cy * 0.5} r={r * 0.2} fill="rgba(168,85,247,0.15)" />
            <circle cx={cx * 0.6} cy={cy * 0.5} r={r * 0.13} fill="rgba(192,132,252,0.12)" />

            {/* Torii in purple */}
            {(() => {
              const gw = size * 0.38;
              const gh = size * 0.28;
              const gx = cx - gw / 2;
              const gy = cy * 0.65;
              const bw = size * 0.05;
              return (
                <g fill="rgba(168,85,247,0.55)">
                  <rect x={gx - size * 0.025} y={gy} width={gw + size * 0.05} height={bw * 0.5} rx={bw * 0.1} />
                  <rect x={gx} y={gy + bw * 0.75} width={gw} height={bw * 0.3} rx={bw * 0.1} />
                  <rect x={gx + size * 0.035} y={gy + bw * 0.75} width={bw} height={gh} rx={bw * 0.2} />
                  <rect x={gx + gw - size * 0.035 - bw} y={gy + bw * 0.75} width={bw} height={gh} rx={bw * 0.2} />
                </g>
              );
            })()}

            {/* Purple sakura petals */}
            {[
              { x: cx * 0.35, y: cy * 0.35 },
              { x: cx * 1.6, y: cy * 0.45 },
              { x: cx * 0.28, y: cy * 1.15 },
              { x: cx * 1.65, y: cy * 1.2 },
              { x: cx * 0.85, y: cy * 0.22 },
              { x: cx * 1.18, y: cy * 0.2 },
            ].map((p, i) => {
              const ps = size * 0.05;
              return (
                <g key={i} transform={`translate(${p.x},${p.y}) rotate(${i * 30})`}>
                  {Array.from({ length: 5 }).map((_, j) => {
                    const a = (j * 72 * Math.PI) / 180;
                    return <ellipse key={j} cx={Math.cos(a) * ps * 0.42} cy={Math.sin(a) * ps * 0.42} rx={ps * 0.3} ry={ps * 0.16} fill="#a855f7" opacity="0.65" transform={`rotate(${j * 72})`} />;
                  })}
                  <circle cx={0} cy={0} r={ps * 0.09} fill="#f3e8ff" opacity="0.9" />
                </g>
              );
            })}

            {/* Concentric rings */}
            {[0.38, 0.6].map((s, i) => (
              <circle key={i} cx={cx} cy={cy} r={r * s} fill="none" stroke="#a855f7" strokeWidth={Math.max(0.5, size * 0.012)} opacity={0.5 - i * 0.1} />
            ))}

            {/* Center eye */}
            <circle cx={cx} cy={cy} r={r * 0.2} fill={`url(#ojp-eye-grad-${uid})`} style={{ animation: `ojp-eye-${uid} 2s ease-in-out infinite` }} />
            <ellipse cx={cx} cy={cy} rx={r * 0.11} ry={r * 0.08} fill="#0c0418" opacity="0.9" />
            <circle cx={cx} cy={cy} r={r * 0.055} fill="#f3e8ff" opacity="0.95" />

            {/* Outer border */}
            <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#a855f7" strokeWidth={Math.max(1.5, size * 0.035)} opacity="0.9" />
            <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#e9d5ff" strokeWidth={Math.max(0.5, size * 0.01)} opacity="0.5" strokeDasharray={`${size * 0.04} ${size * 0.04}`} />

            {/* Vignette */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={size * 0.07} />
          </g>
        </svg>

        {/* Outer conic */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(168,85,247,0.38) 18%, rgba(192,132,252,0.3) 36%, transparent 55%, rgba(139,92,246,0.32) 72%, transparent 90%)',
          animation: `ojp-spin-${uid} 2.5s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Middle reverse */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '12%', borderRadius: '50%',
          background: 'conic-gradient(from 60deg, transparent 0%, rgba(192,132,252,0.45) 25%, transparent 50%, rgba(168,85,247,0.38) 75%, transparent 100%)',
          animation: `ojp-spin-rev-${uid} 1.8s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Inner fast */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '28%', borderRadius: '50%',
          background: 'conic-gradient(from 120deg, transparent 0%, rgba(233,213,255,0.55) 20%, transparent 40%, rgba(192,132,252,0.45) 60%, transparent 80%)',
          animation: `ojp-spin-fast-${uid} 1s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* 3 orbital particles */}
        {[`ojp-orbit-${uid}`, `ojp-orbit2-${uid}`, `ojp-orbit3-${uid}`].map((anim, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', top: '50%', left: '50%',
            width: Math.max(3, size * 0.08), height: Math.max(3, size * 0.08),
            marginTop: -Math.max(1.5, size * 0.04), marginLeft: -Math.max(1.5, size * 0.04),
            borderRadius: '50%',
            background: i === 0 ? '#a855f7' : i === 1 ? '#c084fc' : '#e9d5ff',
            boxShadow: `0 0 6px 3px rgba(168,85,247,0.9)`,
            animation: `${anim} 1.5s linear infinite`,
          }} />
        ))}
        {/* Falling purple petals */}
        {[0.2, 0.45, 0.7, 0.35, 0.6].map((x, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', bottom: '5%',
            left: `${x * 100}%`,
            width: Math.max(2, size * 0.06), height: Math.max(2, size * 0.04),
            borderRadius: '50%',
            background: i % 2 === 0 ? 'rgba(168,85,247,0.85)' : 'rgba(192,132,252,0.8)',
            animation: `ojp-petal-${uid} ${2 + i * 0.5}s ease-out ${i * 0.4}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
