import React from 'react';

interface FrameProps {
  size: number;
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ObsidianAngelsDemonsFrame({ size, active = true, className = '', children }: FrameProps) {
  if (!active) return <div className={className}>{children}</div>;

  const padding = Math.round(size * 0.24);
  const outerSize = size + padding * 2;
  const uid = `obs-ad-${size}`;
  const bw = Math.max(2, Math.round(size * 0.048));
  const r = outerSize / 2;

  return (
    <>
      <style>{`
        @keyframes ${uid}-glow {
          0%, 100% {
            box-shadow:
              0 0 ${size * 0.10}px ${size * 0.03}px rgba(180,120,255,0.50),
              0 0 ${size * 0.25}px ${size * 0.07}px rgba(200,0,0,0.30),
              0 0 ${size * 0.45}px ${size * 0.12}px rgba(60,0,80,0.20);
          }
          33% {
            box-shadow:
              0 0 ${size * 0.18}px ${size * 0.06}px rgba(255,220,100,0.70),
              0 0 ${size * 0.40}px ${size * 0.12}px rgba(180,140,0,0.45),
              0 0 ${size * 0.65}px ${size * 0.20}px rgba(80,60,0,0.28);
          }
          66% {
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.04}px rgba(220,0,60,0.65),
              0 0 ${size * 0.32}px ${size * 0.09}px rgba(140,0,0,0.42),
              0 0 ${size * 0.55}px ${size * 0.15}px rgba(60,0,0,0.25);
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
          0%, 100% { border-color: rgba(180,120,255,0.85); box-shadow: 0 0 ${bw*2}px rgba(180,120,255,0.6), inset 0 0 ${bw}px rgba(180,120,255,0.2); }
          33%       { border-color: rgba(255,220,100,1.00); box-shadow: 0 0 ${bw*6}px rgba(255,220,100,0.95), inset 0 0 ${bw*2}px rgba(255,220,100,0.45); }
          66%       { border-color: rgba(220,0,60,0.95); box-shadow: 0 0 ${bw*5}px rgba(220,0,60,0.90), inset 0 0 ${bw*1.8}px rgba(220,0,60,0.40); }
        }
        @keyframes ${uid}-inner-pulse {
          0%, 100% { border-color: rgba(60,0,80,0.80); box-shadow: 0 0 ${bw*2}px rgba(60,0,80,0.55); }
          50%       { border-color: rgba(180,0,0,0.95); box-shadow: 0 0 ${bw*4}px rgba(180,0,0,0.85); }
        }
        @keyframes ${uid}-divine {
          0%, 100% { opacity: 0.4; transform: scale(0.9) rotate(0deg); }
          50%       { opacity: 1.0; transform: scale(1.1) rotate(10deg); }
        }
        @keyframes ${uid}-infernal {
          0%, 100% { opacity: 0.4; transform: scale(0.9) rotate(0deg); }
          50%       { opacity: 1.0; transform: scale(1.1) rotate(-10deg); }
        }
        @keyframes ${uid}-halo {
          0%, 100% { opacity: 0.5; box-shadow: 0 0 ${bw*3}px rgba(255,220,100,0.6); }
          50%       { opacity: 1.0; box-shadow: 0 0 ${bw*7}px rgba(255,240,180,1.0); }
        }
        @keyframes ${uid}-hellfire {
          0%, 100% { opacity: 0.4; transform: scaleY(1); }
          50%       { opacity: 0.9; transform: scaleY(1.2); }
        }
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Duality glow */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.08),
          borderRadius: '50%',
          animation: `${uid}-glow 3.5s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
        }} />

        {/* Outer ring — divine purple/gold/infernal, clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11),
          borderRadius: '50%',
          border: `${bw}px solid rgba(180,120,255,0.85)`,
          borderTopColor: 'rgba(255,220,100,1)',
          borderRightColor: 'rgba(220,0,60,0.8)',
          borderBottomColor: 'rgba(60,0,80,0.6)',
          animation: `${uid}-ring-cw 5s linear infinite, ${uid}-outer-pulse 3.5s ease-in-out infinite`,
          zIndex: 1,
          pointerEvents: 'none',
        }} />

        {/* Inner ring — dark, counter-clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11) + Math.round(size * 0.07),
          borderRadius: '50%',
          border: `${bw}px solid rgba(60,0,80,0.80)`,
          borderBottomColor: 'rgba(180,0,0,0.95)',
          borderTopColor: 'rgba(180,120,255,0.7)',
          animation: `${uid}-ring-ccw 3.5s linear infinite, ${uid}-inner-pulse 3.5s ease-in-out infinite 0.5s`,
          zIndex: 2,
          pointerEvents: 'none',
        }} />

        {/* SVG: Wings + halo + hellfire */}
        <svg aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          width: outerSize,
          height: outerSize,
          zIndex: 3,
          pointerEvents: 'none',
        }} viewBox={`0 0 ${outerSize} ${outerSize}`}>
          {/* Divine wing (top-left arc) */}
          <g style={{ animation: `${uid}-divine 3s ease-in-out infinite` }}>
            <path
              d={`M ${r} ${r - outerSize*0.38} Q ${r - outerSize*0.25} ${r - outerSize*0.48} ${r - outerSize*0.38} ${r - outerSize*0.20}`}
              stroke="rgba(255,220,100,0.70)"
              strokeWidth={Math.max(1, bw * 0.6)}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M ${r} ${r - outerSize*0.38} Q ${r - outerSize*0.18} ${r - outerSize*0.45} ${r - outerSize*0.32} ${r - outerSize*0.15}`}
              stroke="rgba(255,240,180,0.55)"
              strokeWidth={Math.max(1, bw * 0.4)}
              fill="none"
              strokeLinecap="round"
            />
          </g>
          {/* Infernal wing (top-right arc) */}
          <g style={{ animation: `${uid}-infernal 3s ease-in-out infinite 0.5s` }}>
            <path
              d={`M ${r} ${r - outerSize*0.38} Q ${r + outerSize*0.25} ${r - outerSize*0.48} ${r + outerSize*0.38} ${r - outerSize*0.20}`}
              stroke="rgba(220,0,60,0.70)"
              strokeWidth={Math.max(1, bw * 0.6)}
              fill="none"
              strokeLinecap="round"
            />
            <path
              d={`M ${r} ${r - outerSize*0.38} Q ${r + outerSize*0.18} ${r - outerSize*0.45} ${r + outerSize*0.32} ${r - outerSize*0.15}`}
              stroke="rgba(255,60,60,0.50)"
              strokeWidth={Math.max(1, bw * 0.4)}
              fill="none"
              strokeLinecap="round"
            />
          </g>
          {/* Hellfire at bottom */}
          {[0, 1, 2, 3, 4].map((i) => {
            const fx = r - outerSize * 0.15 + i * outerSize * 0.075;
            const fy = r + outerSize * 0.36;
            const fh = outerSize * (0.06 + (i % 3) * 0.025);
            return (
              <path key={i}
                d={`M ${fx} ${fy} Q ${fx - outerSize*0.02} ${fy - fh*0.6} ${fx} ${fy - fh} Q ${fx + outerSize*0.02} ${fy - fh*0.6} ${fx} ${fy}`}
                fill={`rgba(${180 + i*15},${i*20},0,0.65)`}
                style={{ animation: `${uid}-hellfire 1.5s ease-in-out ${i * 0.2}s infinite` }}
              />
            );
          })}
          {/* Duality divider line */}
          <line
            x1={r} y1={r - outerSize * 0.42}
            x2={r} y2={r + outerSize * 0.42}
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={Math.max(0.5, bw * 0.25)}
            strokeDasharray={`${size * 0.04} ${size * 0.03}`}
          />
        </svg>

        {/* Halo (top) */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          left: r - size * 0.18,
          top: padding * 0.15,
          width: size * 0.36,
          height: size * 0.12,
          borderRadius: '50%',
          border: `${Math.max(1, bw * 0.5)}px solid rgba(255,220,100,0.85)`,
          animation: `${uid}-halo 2.5s ease-in-out infinite`,
          zIndex: 4,
          pointerEvents: 'none',
        }} />

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

export default ObsidianAngelsDemonsFrame;
