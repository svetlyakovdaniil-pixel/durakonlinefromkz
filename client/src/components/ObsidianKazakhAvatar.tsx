import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ObsidianKazakhAvatar — Kazakh ornament with void obsidian purple.
 * Season: Казахский колорит (Season 6) | Rank: Обсидиан
 * Animation: void pulse + triple orbit + rotating rings + particle burst
 */
export function ObsidianKazakhAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes okz-void-${uid} {
          0%   { box-shadow: 0 0 10px 4px rgba(168,85,247,0.8), 0 0 24px 9px rgba(139,92,246,0.5), 0 0 44px 16px rgba(109,40,217,0.3), 0 0 70px 26px rgba(88,28,135,0.15); }
          33%  { box-shadow: 0 0 28px 12px rgba(192,132,252,1), 0 0 52px 20px rgba(168,85,247,0.75), 0 0 80px 30px rgba(139,92,246,0.45), 0 0 110px 40px rgba(109,40,217,0.2); }
          66%  { box-shadow: 0 0 16px 7px rgba(139,92,246,0.9), 0 0 36px 14px rgba(168,85,247,0.6), 0 0 60px 22px rgba(192,132,252,0.35), 0 0 90px 33px rgba(109,40,217,0.18); }
          100% { box-shadow: 0 0 10px 4px rgba(168,85,247,0.8), 0 0 24px 9px rgba(139,92,246,0.5), 0 0 44px 16px rgba(109,40,217,0.3), 0 0 70px 26px rgba(88,28,135,0.15); }
        }
        @keyframes okz-spin-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes okz-spin-rev-${uid} { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes okz-spin-fast-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes okz-orbit-${uid} {
          from { transform: rotate(0deg) translateX(${r * 0.7}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${r * 0.7}px) rotate(-360deg); }
        }
        @keyframes okz-orbit2-${uid} {
          from { transform: rotate(120deg) translateX(${r * 0.7}px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(${r * 0.7}px) rotate(-480deg); }
        }
        @keyframes okz-orbit3-${uid} {
          from { transform: rotate(240deg) translateX(${r * 0.7}px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(${r * 0.7}px) rotate(-600deg); }
        }
        @keyframes okz-eye-${uid} {
          0%, 100% { opacity: 0.7; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.15); filter: drop-shadow(0 0 4px rgba(192,132,252,1)); }
        }
        @keyframes okz-ring-pulse-${uid} {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 0.9; }
        }
      `}</style>
      <div style={{ width: size, height: size, position: 'relative', animation: `okz-void-${uid} 1.8s ease-in-out infinite`, borderRadius: '50%' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden', position: 'absolute', top: 0, left: 0 }}>
          <defs>
            <clipPath id={`okz-clip-${uid}`}>
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
            <radialGradient id={`okz-bg-${uid}`} cx="50%" cy="40%" r="65%">
              <stop offset="0%" stopColor="#1e0a3c" />
              <stop offset="50%" stopColor="#0f0520" />
              <stop offset="100%" stopColor="#03010a" />
            </radialGradient>
            <radialGradient id={`okz-eye-grad-${uid}`} cx="50%" cy="35%" r="60%">
              <stop offset="0%" stopColor="#e9d5ff" />
              <stop offset="40%" stopColor="#a855f7" />
              <stop offset="100%" stopColor="#6d28d9" />
            </radialGradient>
          </defs>
          <g clipPath={`url(#okz-clip-${uid})`}>
            <circle cx={cx} cy={cy} r={r} fill={`url(#okz-bg-${uid})`} />

            {/* Kazakh ornament spokes */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              return <line key={i} x1={cx + Math.cos(angle) * r * 0.12} y1={cy + Math.sin(angle) * r * 0.12} x2={cx + Math.cos(angle) * r * 0.52} y2={cy + Math.sin(angle) * r * 0.52} stroke="#a855f7" strokeWidth={Math.max(1, size * 0.022)} strokeLinecap="round" opacity="0.85" />;
            })}

            {/* Diamond ornaments */}
            {Array.from({ length: 8 }).map((_, i) => {
              const angle = (i * 45 * Math.PI) / 180;
              const dx = cx + Math.cos(angle) * r * 0.6;
              const dy = cy + Math.sin(angle) * r * 0.6;
              const s = size * 0.055;
              return (
                <g key={i} transform={`translate(${dx},${dy}) rotate(${i * 45})`}>
                  <polygon points={`0,${-s} ${s * 0.6},0 0,${s} ${-s * 0.6},0`} fill="#a855f7" opacity="0.9" />
                  <polygon points={`0,${-s * 0.5} ${s * 0.3},0 0,${s * 0.5} ${-s * 0.3},0`} fill="#e9d5ff" opacity="0.7" />
                </g>
              );
            })}

            {/* Concentric rings */}
            {[0.35, 0.55, 0.72].map((s, i) => (
              <circle key={i} cx={cx} cy={cy} r={r * s} fill="none" stroke="#a855f7" strokeWidth={Math.max(0.5, size * 0.012)} opacity={0.7 - i * 0.15} style={{ animation: `okz-ring-pulse-${uid} ${1.5 + i * 0.4}s ease-in-out ${i * 0.3}s infinite` }} />
            ))}

            {/* Center eye */}
            <circle cx={cx} cy={cy} r={r * 0.18} fill={`url(#okz-eye-grad-${uid})`} style={{ animation: `okz-eye-${uid} 2s ease-in-out infinite` }} />
            <ellipse cx={cx} cy={cy} rx={r * 0.1} ry={r * 0.07} fill="#1e0a3c" opacity="0.9" />
            <circle cx={cx} cy={cy} r={r * 0.05} fill="#e9d5ff" opacity="0.95" />

            {/* Outer border */}
            <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#a855f7" strokeWidth={Math.max(1.5, size * 0.035)} opacity="0.9" />
            <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#e9d5ff" strokeWidth={Math.max(0.5, size * 0.01)} opacity="0.5" strokeDasharray={`${size * 0.05} ${size * 0.05}`} />

            {/* Vignette */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.5)" strokeWidth={size * 0.07} />
          </g>
        </svg>

        {/* Outer rotating conic */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(168,85,247,0.35) 18%, rgba(192,132,252,0.28) 36%, transparent 55%, rgba(139,92,246,0.3) 72%, transparent 90%)',
          animation: `okz-spin-${uid} 2s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Middle reverse conic */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '12%', borderRadius: '50%',
          background: 'conic-gradient(from 60deg, transparent 0%, rgba(192,132,252,0.4) 25%, transparent 50%, rgba(168,85,247,0.35) 75%, transparent 100%)',
          animation: `okz-spin-rev-${uid} 1.5s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Inner fast conic */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '28%', borderRadius: '50%',
          background: 'conic-gradient(from 120deg, transparent 0%, rgba(233,213,255,0.5) 20%, transparent 40%, rgba(192,132,252,0.4) 60%, transparent 80%)',
          animation: `okz-spin-fast-${uid} 1s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* 3 orbital particles */}
        {[`okz-orbit-${uid}`, `okz-orbit2-${uid}`, `okz-orbit3-${uid}`].map((anim, i) => (
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
      </div>
    </div>
  );
}
