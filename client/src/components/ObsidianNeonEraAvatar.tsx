import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ObsidianNeonEraAvatar — Neon void obsidian with purple glitch matrix.
 * Season: Неоновая эра (Season 7) | Rank: Обсидиан
 * Animation: void pulse + glitch matrix + triple orbit + scan lines
 */
export function ObsidianNeonEraAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes one-void-${uid} {
          0%   { box-shadow: 0 0 10px 4px rgba(168,85,247,0.8), 0 0 24px 9px rgba(139,92,246,0.5), 0 0 44px 16px rgba(109,40,217,0.3), 0 0 70px 26px rgba(88,28,135,0.15); }
          33%  { box-shadow: 0 0 28px 12px rgba(192,132,252,1), 0 0 52px 20px rgba(168,85,247,0.75), 0 0 80px 30px rgba(139,92,246,0.45), 0 0 110px 40px rgba(109,40,217,0.2); }
          66%  { box-shadow: 0 0 16px 7px rgba(139,92,246,0.9), 0 0 36px 14px rgba(168,85,247,0.6), 0 0 60px 22px rgba(192,132,252,0.35), 0 0 90px 33px rgba(109,40,217,0.18); }
          100% { box-shadow: 0 0 10px 4px rgba(168,85,247,0.8), 0 0 24px 9px rgba(139,92,246,0.5), 0 0 44px 16px rgba(109,40,217,0.3), 0 0 70px 26px rgba(88,28,135,0.15); }
        }
        @keyframes one-spin-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes one-spin-rev-${uid} { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes one-spin-fast-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes one-glitch-${uid} {
          0%, 85%, 100% { filter: brightness(1) hue-rotate(0deg); transform: translate(0,0); }
          87%            { filter: brightness(2) hue-rotate(30deg); transform: translate(-2px, 1px); }
          89%            { filter: brightness(0.7) hue-rotate(-20deg); transform: translate(2px, -1px); }
          91%            { filter: brightness(1.5) hue-rotate(15deg); transform: translate(-1px, 2px); }
          93%            { filter: brightness(1) hue-rotate(0deg); transform: translate(0,0); }
        }
        @keyframes one-scan-${uid} {
          0%   { top: 0%; opacity: 0; }
          10%  { opacity: 0.6; }
          90%  { opacity: 0.6; }
          100% { top: 100%; opacity: 0; }
        }
        @keyframes one-orbit-${uid} {
          from { transform: rotate(0deg) translateX(${r * 0.7}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${r * 0.7}px) rotate(-360deg); }
        }
        @keyframes one-orbit2-${uid} {
          from { transform: rotate(120deg) translateX(${r * 0.7}px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(${r * 0.7}px) rotate(-480deg); }
        }
        @keyframes one-orbit3-${uid} {
          from { transform: rotate(240deg) translateX(${r * 0.7}px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(${r * 0.7}px) rotate(-600deg); }
        }
        @keyframes one-eye-${uid} {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.18); filter: drop-shadow(0 0 5px rgba(192,132,252,1)); }
        }
      `}</style>
      <div style={{ width: size, height: size, position: 'relative', animation: `one-void-${uid} 1.8s ease-in-out infinite`, borderRadius: '50%' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden', position: 'absolute', top: 0, left: 0, animation: `one-glitch-${uid} 4s ease-in-out infinite` }}>
          <defs>
            <clipPath id={`one-clip-${uid}`}>
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
            <radialGradient id={`one-bg-${uid}`} cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#1a0830" />
              <stop offset="50%" stopColor="#0c0418" />
              <stop offset="100%" stopColor="#030108" />
            </radialGradient>
            <radialGradient id={`one-eye-grad-${uid}`} cx="50%" cy="30%" r="60%">
              <stop offset="0%" stopColor="#f3e8ff" />
              <stop offset="40%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6d28d9" />
            </radialGradient>
          </defs>
          <g clipPath={`url(#one-clip-${uid})`}>
            <circle cx={cx} cy={cy} r={r} fill={`url(#one-bg-${uid})`} />

            {/* Matrix grid */}
            {Array.from({ length: 7 }).map((_, i) => {
              const y = (size / 8) * (i + 1);
              return <line key={`h${i}`} x1={0} y1={y} x2={size} y2={y} stroke="rgba(168,85,247,0.18)" strokeWidth={0.5} />;
            })}
            {Array.from({ length: 7 }).map((_, i) => {
              const x = (size / 8) * (i + 1);
              return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={size} stroke="rgba(168,85,247,0.18)" strokeWidth={0.5} />;
            })}

            {/* Hexagonal rings */}
            {[0.3, 0.5, 0.7].map((scale, ri) => {
              const s = r * scale;
              const pts = Array.from({ length: 6 }).map((_, i) => {
                const a = (i * 60 * Math.PI) / 180;
                return `${cx + Math.cos(a) * s},${cy + Math.sin(a) * s}`;
              }).join(' ');
              return <polygon key={ri} points={pts} fill="none" stroke="#a855f7" strokeWidth={Math.max(0.5, size * 0.012)} opacity={0.85 - ri * 0.2} />;
            })}

            {/* Circuit nodes */}
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i * 60 * Math.PI) / 180;
              return (
                <g key={i}>
                  <circle cx={cx + Math.cos(a) * r * 0.55} cy={cy + Math.sin(a) * r * 0.55} r={Math.max(2.5, size * 0.05)} fill="#a855f7" opacity="0.9" />
                  <circle cx={cx + Math.cos(a) * r * 0.55} cy={cy + Math.sin(a) * r * 0.55} r={Math.max(1, size * 0.025)} fill="#e9d5ff" opacity="0.9" />
                </g>
              );
            })}

            {/* Center eye */}
            <circle cx={cx} cy={cy} r={r * 0.2} fill={`url(#one-eye-grad-${uid})`} style={{ animation: `one-eye-${uid} 2s ease-in-out infinite` }} />
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
          animation: `one-spin-${uid} 2s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Middle reverse */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '12%', borderRadius: '50%',
          background: 'conic-gradient(from 60deg, transparent 0%, rgba(192,132,252,0.45) 25%, transparent 50%, rgba(168,85,247,0.38) 75%, transparent 100%)',
          animation: `one-spin-rev-${uid} 1.5s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Inner fast */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '28%', borderRadius: '50%',
          background: 'conic-gradient(from 120deg, transparent 0%, rgba(233,213,255,0.55) 20%, transparent 40%, rgba(192,132,252,0.45) 60%, transparent 80%)',
          animation: `one-spin-fast-${uid} 0.9s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Scan line */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, right: 0, height: Math.max(1, size * 0.02),
          background: 'linear-gradient(90deg, transparent, rgba(192,132,252,0.7), transparent)',
          animation: `one-scan-${uid} 1.8s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* 3 orbital particles */}
        {[`one-orbit-${uid}`, `one-orbit2-${uid}`, `one-orbit3-${uid}`].map((anim, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', top: '50%', left: '50%',
            width: Math.max(3, size * 0.08), height: Math.max(3, size * 0.08),
            marginTop: -Math.max(1.5, size * 0.04), marginLeft: -Math.max(1.5, size * 0.04),
            borderRadius: '50%',
            background: i === 0 ? '#a855f7' : i === 1 ? '#c084fc' : '#e9d5ff',
            boxShadow: `0 0 6px 3px rgba(168,85,247,0.9)`,
            animation: `${anim} 1.4s linear infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
