import React from 'react';

interface FrameProps {
  size: number;
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ObsidianNorseFrame({ size, active = true, className = '', children }: FrameProps) {
  if (!active) return <div className={className}>{children}</div>;

  const padding = Math.round(size * 0.24);
  const outerSize = size + padding * 2;
  const uid = `obs-no-${size}`;
  const bw = Math.max(2, Math.round(size * 0.048));
  const r = outerSize / 2;

  // Rune positions
  const runeAngles = [0, 40, 80, 120, 160, 200, 240, 280, 320];

  return (
    <>
      <style>{`
        @keyframes ${uid}-glow {
          0%, 100% {
            box-shadow:
              0 0 ${size * 0.10}px ${size * 0.03}px rgba(80,0,180,0.50),
              0 0 ${size * 0.25}px ${size * 0.07}px rgba(0,180,120,0.30),
              0 0 ${size * 0.45}px ${size * 0.12}px rgba(40,0,100,0.20);
          }
          33% {
            box-shadow:
              0 0 ${size * 0.16}px ${size * 0.05}px rgba(0,220,160,0.65),
              0 0 ${size * 0.35}px ${size * 0.10}px rgba(80,0,200,0.40),
              0 0 ${size * 0.55}px ${size * 0.16}px rgba(0,100,80,0.25);
          }
          66% {
            box-shadow:
              0 0 ${size * 0.18}px ${size * 0.06}px rgba(180,100,255,0.70),
              0 0 ${size * 0.40}px ${size * 0.12}px rgba(0,160,120,0.45),
              0 0 ${size * 0.65}px ${size * 0.20}px rgba(60,0,140,0.28);
          }
        }
        @keyframes ${uid}-ring-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ${uid}-ring-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes ${uid}-outer-pulse {
          0%, 100% { border-color: rgba(80,0,180,0.85); box-shadow: 0 0 ${bw*2}px rgba(80,0,180,0.6), inset 0 0 ${bw}px rgba(80,0,180,0.2); }
          33%       { border-color: rgba(0,220,160,1.00); box-shadow: 0 0 ${bw*5}px rgba(0,220,160,0.9), inset 0 0 ${bw*2}px rgba(0,220,160,0.4); }
          66%       { border-color: rgba(180,100,255,0.95); box-shadow: 0 0 ${bw*4}px rgba(180,100,255,0.85), inset 0 0 ${bw*1.5}px rgba(180,100,255,0.35); }
        }
        @keyframes ${uid}-inner-pulse {
          0%, 100% { border-color: rgba(0,140,100,0.80); box-shadow: 0 0 ${bw*2}px rgba(0,140,100,0.55); }
          50%       { border-color: rgba(140,60,220,0.95); box-shadow: 0 0 ${bw*4}px rgba(140,60,220,0.85); }
        }
        @keyframes ${uid}-rune {
          0%, 100% { opacity: 0.25; transform: scale(0.85); }
          50%       { opacity: 1.00; transform: scale(1.15); }
        }
        @keyframes ${uid}-aurora {
          0%   { transform: rotate(0deg); opacity: 0.4; }
          50%  { opacity: 0.75; }
          100% { transform: rotate(360deg); opacity: 0.4; }
        }
        @keyframes ${uid}-mjolnir {
          0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 ${size*0.03}px rgba(180,100,255,0.7)); }
          50%       { opacity: 1.0; filter: drop-shadow(0 0 ${size*0.09}px rgba(220,180,255,1.0)); }
        }
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Aurora glow */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.08),
          borderRadius: '50%',
          animation: `${uid}-glow 4s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
        }} />

        {/* Aurora rotating ring (SVG) */}
        <svg aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          width: outerSize,
          height: outerSize,
          zIndex: 0,
          pointerEvents: 'none',
          animation: `${uid}-aurora 8s linear infinite`,
        }} viewBox={`0 0 ${outerSize} ${outerSize}`}>
          <defs>
            <linearGradient id={`${uid}-aurora-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(0,220,160,0.0)" />
              <stop offset="25%" stopColor="rgba(0,220,160,0.5)" />
              <stop offset="50%" stopColor="rgba(180,100,255,0.6)" />
              <stop offset="75%" stopColor="rgba(0,180,120,0.4)" />
              <stop offset="100%" stopColor="rgba(0,220,160,0.0)" />
            </linearGradient>
          </defs>
          <circle cx={r} cy={r} r={outerSize * 0.42}
            fill="none"
            stroke={`url(#${uid}-aurora-grad)`}
            strokeWidth={Math.max(3, bw * 1.5)}
            strokeDasharray={`${outerSize * 0.6} ${outerSize * 0.7}`}
          />
        </svg>

        {/* Outer ring — purple, clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11),
          borderRadius: '50%',
          border: `${bw}px solid rgba(80,0,180,0.85)`,
          borderTopColor: 'rgba(180,100,255,1)',
          borderRightColor: 'rgba(60,0,140,0.5)',
          animation: `${uid}-ring-cw 5s linear infinite, ${uid}-outer-pulse 4s ease-in-out infinite`,
          zIndex: 1,
          pointerEvents: 'none',
        }} />

        {/* Inner ring — teal, counter-clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11) + Math.round(size * 0.07),
          borderRadius: '50%',
          border: `${bw}px solid rgba(0,140,100,0.80)`,
          borderBottomColor: 'rgba(0,220,160,0.95)',
          animation: `${uid}-ring-ccw 3.5s linear infinite, ${uid}-inner-pulse 4s ease-in-out infinite 0.5s`,
          zIndex: 2,
          pointerEvents: 'none',
        }} />

        {/* Rune dots */}
        {runeAngles.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const runeR = outerSize * 0.44;
          const x = r + Math.cos(rad) * runeR;
          const y = r + Math.sin(rad) * runeR;
          const rSize = Math.max(4, Math.round(size * 0.055));
          const delay = i * 0.4;
          const colors = [
            'rgba(180,100,255,0.95)',
            'rgba(0,220,160,0.90)',
            'rgba(100,60,220,0.85)',
          ];
          return (
            <svg key={i} aria-hidden="true" style={{
              position: 'absolute',
              left: x - rSize / 2,
              top: y - rSize / 2,
              width: rSize,
              height: rSize,
              zIndex: 3,
              pointerEvents: 'none',
              animation: `${uid}-rune 2.5s ease-in-out ${delay}s infinite`,
            }} viewBox="0 0 10 10">
              {/* Simple rune shape */}
              <line x1="5" y1="0" x2="5" y2="10" stroke={colors[i % 3]} strokeWidth="1.5" />
              <line x1="2" y1="3" x2="8" y2="3" stroke={colors[i % 3]} strokeWidth="1.5" />
              {i % 3 === 0 && <line x1="2" y1="7" x2="5" y2="5" stroke={colors[i % 3]} strokeWidth="1.2" />}
              {i % 3 === 1 && <line x1="5" y1="5" x2="8" y2="7" stroke={colors[i % 3]} strokeWidth="1.2" />}
              {i % 3 === 2 && <line x1="2" y1="7" x2="8" y2="7" stroke={colors[i % 3]} strokeWidth="1.2" />}
            </svg>
          );
        })}

        {/* Mjolnir at top */}
        <svg aria-hidden="true" style={{
          position: 'absolute',
          left: r - size * 0.10,
          top: padding * 0.20,
          width: size * 0.20,
          height: size * 0.20,
          zIndex: 4,
          pointerEvents: 'none',
          animation: `${uid}-mjolnir 2.5s ease-in-out infinite`,
        }} viewBox="0 0 20 20">
          <rect x="7" y="0" width="6" height="7" rx="1" fill="rgba(180,100,255,0.9)" stroke="rgba(220,180,255,0.8)" strokeWidth="0.5" />
          <rect x="9" y="7" width="2" height="9" rx="0.5" fill="rgba(140,80,220,0.85)" stroke="rgba(200,160,255,0.7)" strokeWidth="0.5" />
          <rect x="6" y="14" width="8" height="2" rx="0.5" fill="rgba(100,60,180,0.8)" stroke="rgba(180,140,255,0.6)" strokeWidth="0.5" />
        </svg>

        {/* Avatar */}
        <div style={{
          position: 'absolute',
          inset: padding,
          borderRadius: '50%',
          overflow: 'hidden',
          zIndex: 5,
        }}>
          {children}
        </div>
      </div>
    </>
  );
}

export default ObsidianNorseFrame;
