import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubyNeonEraAvatar — Neon circuit ruby with glitch animation.
 * Season: Неоновая эра (Season 7) | Rank: Рубин
 * Animation: neon red pulse + glitch flicker + rotating conic + "RUBY RANK" text
 */
export function RubyNeonEraAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const cx = size / 2;
  const cy = size / 2;
  const r = size / 2;
  const textR = r * 0.88;
  const fontSize = Math.max(4, size * 0.085);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes rne-pulse-${uid} {
          0%, 100% { box-shadow: 0 0 6px 2px rgba(239,68,68,0.7), 0 0 14px 5px rgba(168,85,247,0.3); }
          50%       { box-shadow: 0 0 18px 8px rgba(239,68,68,1), 0 0 32px 14px rgba(168,85,247,0.5); }
        }
        @keyframes rne-spin-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes rne-glitch-${uid} {
          0%, 90%, 100% { filter: brightness(1) hue-rotate(0deg); }
          92%           { filter: brightness(1.5) hue-rotate(20deg); }
          94%           { filter: brightness(0.8) hue-rotate(-10deg); }
          96%           { filter: brightness(1.3) hue-rotate(15deg); }
        }
      `}</style>
      <div style={{ width: size, height: size, position: 'relative', animation: `rne-pulse-${uid} 2s ease-in-out infinite`, borderRadius: '50%' }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ display: 'block', borderRadius: '50%', overflow: 'hidden', position: 'absolute', top: 0, left: 0, animation: `rne-glitch-${uid} 4s ease-in-out infinite` }}>
          <defs>
            <clipPath id={`rne-clip-${uid}`}>
              <circle cx={cx} cy={cy} r={r} />
            </clipPath>
            <radialGradient id={`rne-bg-${uid}`} cx="50%" cy="40%" r="60%">
              <stop offset="0%" stopColor="#3d0020" />
              <stop offset="50%" stopColor="#200010" />
              <stop offset="100%" stopColor="#0a0008" />
            </radialGradient>
            <path id={`rne-textpath-${uid}`} d={`M ${cx - textR},${cy} a ${textR},${textR} 0 1,1 0.01,0`} />
          </defs>
          <g clipPath={`url(#rne-clip-${uid})`}>
            <circle cx={cx} cy={cy} r={r} fill={`url(#rne-bg-${uid})`} />

            {/* Grid lines */}
            {Array.from({ length: 5 }).map((_, i) => {
              const y = (size / 6) * (i + 1);
              return <line key={`h${i}`} x1={0} y1={y} x2={size} y2={y} stroke="rgba(239,68,68,0.2)" strokeWidth={0.5} />;
            })}
            {Array.from({ length: 5 }).map((_, i) => {
              const x = (size / 6) * (i + 1);
              return <line key={`v${i}`} x1={x} y1={0} x2={x} y2={size} stroke="rgba(239,68,68,0.2)" strokeWidth={0.5} />;
            })}

            {/* Central hexagon */}
            {(() => {
              const s = r * 0.32;
              const pts = Array.from({ length: 6 }).map((_, i) => {
                const a = (i * 60 * Math.PI) / 180;
                return `${cx + Math.cos(a) * s},${cy + Math.sin(a) * s}`;
              }).join(' ');
              return <polygon points={pts} fill="none" stroke="#ef4444" strokeWidth={Math.max(1, size * 0.025)} opacity="0.9" />;
            })()}

            {/* Inner hex */}
            {(() => {
              const s = r * 0.18;
              const pts = Array.from({ length: 6 }).map((_, i) => {
                const a = (i * 60 * Math.PI) / 180;
                return `${cx + Math.cos(a) * s},${cy + Math.sin(a) * s}`;
              }).join(' ');
              return <polygon points={pts} fill="rgba(239,68,68,0.2)" stroke="#ef4444" strokeWidth={Math.max(0.5, size * 0.015)} opacity="0.8" />;
            })()}

            {/* Center */}
            <circle cx={cx} cy={cy} r={r * 0.1} fill="#ef4444" opacity="0.95" />
            <circle cx={cx} cy={cy} r={r * 0.06} fill="#fca5a5" opacity="0.9" />

            {/* Circuit nodes */}
            {Array.from({ length: 6 }).map((_, i) => {
              const a = (i * 60 * Math.PI) / 180;
              return <circle key={i} cx={cx + Math.cos(a) * r * 0.55} cy={cy + Math.sin(a) * r * 0.55} r={Math.max(1.5, size * 0.03)} fill="#ef4444" opacity="0.85" />;
            })}

            {/* Outer border */}
            <circle cx={cx} cy={cy} r={r * 0.92} fill="none" stroke="#ef4444" strokeWidth={Math.max(1, size * 0.03)} opacity="0.8" />

            {/* "RUBY RANK" text */}
            <text fontSize={fontSize} fill="#fca5a5" fontFamily="'Arial', sans-serif" fontWeight="bold" letterSpacing={Math.max(0.5, size * 0.01)}>
              <textPath href={`#rne-textpath-${uid}`} startOffset="0%">
                RUBY RANK • RUBY RANK •{' '}
              </textPath>
            </text>

            {/* Vignette */}
            <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(0,0,0,0.4)" strokeWidth={size * 0.06} />
          </g>
        </svg>
        {/* Rotating conic */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(239,68,68,0.25) 20%, transparent 40%, rgba(168,85,247,0.15) 60%, transparent 80%)',
          animation: `rne-spin-${uid} 3s linear infinite`,
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
