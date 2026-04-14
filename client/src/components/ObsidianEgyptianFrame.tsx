import React from 'react';

interface FrameProps {
  size: number;
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ObsidianEgyptianFrame({ size, active = true, className = '', children }: FrameProps) {
  if (!active) return <div className={className}>{children}</div>;

  const padding = Math.round(size * 0.24);
  const outerSize = size + padding * 2;
  const uid = `obs-eg-${size}`;
  const bw = Math.max(2, Math.round(size * 0.048));
  const r = outerSize / 2;

  // Eye of Horus positions around ring
  const symbols = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <>
      <style>{`
        @keyframes ${uid}-glow {
          0%, 100% {
            box-shadow:
              0 0 ${size * 0.12}px ${size * 0.04}px rgba(200,160,0,0.55),
              0 0 ${size * 0.28}px ${size * 0.08}px rgba(120,60,0,0.35),
              0 0 ${size * 0.50}px ${size * 0.14}px rgba(60,20,0,0.20);
          }
          50% {
            box-shadow:
              0 0 ${size * 0.18}px ${size * 0.06}px rgba(255,200,0,0.70),
              0 0 ${size * 0.38}px ${size * 0.12}px rgba(180,100,0,0.45),
              0 0 ${size * 0.60}px ${size * 0.18}px rgba(80,30,0,0.25);
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
          0%, 100% { border-color: rgba(200,160,0,0.90); box-shadow: 0 0 ${bw*2}px rgba(200,160,0,0.65), inset 0 0 ${bw}px rgba(200,160,0,0.25); }
          40%       { border-color: rgba(255,220,60,1.00); box-shadow: 0 0 ${bw*6}px rgba(255,220,60,0.95), inset 0 0 ${bw*2}px rgba(255,220,60,0.45); }
          80%       { border-color: rgba(140,100,0,0.75); box-shadow: 0 0 ${bw*1.5}px rgba(140,100,0,0.50), inset 0 0 ${bw*0.8}px rgba(140,100,0,0.18); }
        }
        @keyframes ${uid}-inner-pulse {
          0%, 100% { border-color: rgba(80,20,0,0.85); box-shadow: 0 0 ${bw*2}px rgba(80,20,0,0.55), inset 0 0 ${bw}px rgba(80,20,0,0.2); }
          35%       { border-color: rgba(180,80,0,0.95); box-shadow: 0 0 ${bw*4}px rgba(180,80,0,0.85), inset 0 0 ${bw*1.5}px rgba(180,80,0,0.35); }
          75%       { border-color: rgba(50,10,0,0.70); box-shadow: 0 0 ${bw*1.2}px rgba(50,10,0,0.45), inset 0 0 ${bw*0.7}px rgba(50,10,0,0.15); }
        }
        @keyframes ${uid}-symbol {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1.0; transform: scale(1.2); }
        }
        @keyframes ${uid}-eye {
          0%, 100% { opacity: 0.6; filter: drop-shadow(0 0 ${size*0.04}px rgba(255,200,0,0.7)); }
          50%       { opacity: 1.0; filter: drop-shadow(0 0 ${size*0.10}px rgba(255,220,60,1.0)); }
        }
        @keyframes ${uid}-scarab {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Deep gold glow */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.08),
          borderRadius: '50%',
          animation: `${uid}-glow 3.0s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
        }} />

        {/* Outer ring — gold, clockwise, dashed hieroglyph pattern */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11),
          borderRadius: '50%',
          border: `${bw}px solid rgba(200,160,0,0.90)`,
          borderTopColor: 'rgba(255,220,60,1)',
          borderRightColor: 'rgba(180,120,0,0.6)',
          animation: `${uid}-ring-cw 6s linear infinite, ${uid}-outer-pulse 2.8s ease-in-out infinite`,
          zIndex: 1,
          pointerEvents: 'none',
        }} />

        {/* Inner ring — dark obsidian, counter-clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11) + Math.round(size * 0.07),
          borderRadius: '50%',
          border: `${bw}px solid rgba(80,20,0,0.85)`,
          borderBottomColor: 'rgba(180,80,0,0.95)',
          borderLeftColor: 'rgba(50,10,0,0.5)',
          animation: `${uid}-ring-ccw 4s linear infinite, ${uid}-inner-pulse 2.8s ease-in-out infinite 0.4s`,
          zIndex: 2,
          pointerEvents: 'none',
        }} />

        {/* Hieroglyph dots around ring */}
        {symbols.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const dotR = outerSize * 0.44;
          const x = r + Math.cos(rad) * dotR - 3;
          const y = r + Math.sin(rad) * dotR - 3;
          const dSize = Math.max(3, Math.round(size * 0.05));
          const delay = i * 0.35;
          return (
            <div key={i} aria-hidden="true" style={{
              position: 'absolute',
              left: x,
              top: y,
              width: dSize,
              height: dSize,
              borderRadius: i % 2 === 0 ? '50%' : '2px',
              background: i % 3 === 0
                ? 'rgba(255,220,60,0.95)'
                : i % 3 === 1
                  ? 'rgba(200,120,0,0.85)'
                  : 'rgba(255,180,0,0.75)',
              boxShadow: `0 0 ${dSize * 2}px rgba(255,200,0,0.8)`,
              animation: `${uid}-symbol 2s ease-in-out ${delay}s infinite`,
              zIndex: 3,
              pointerEvents: 'none',
              transform: i % 2 === 0 ? 'rotate(0deg)' : `rotate(${angle}deg)`,
            }} />
          );
        })}

        {/* SVG: Eye of Horus + scarab arcs */}
        <svg
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: outerSize,
            height: outerSize,
            zIndex: 4,
            pointerEvents: 'none',
          }}
          viewBox={`0 0 ${outerSize} ${outerSize}`}
        >
          {/* Scarab orbit arcs */}
          {[0, 90, 180, 270].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const arcR = outerSize * 0.40;
            const x1 = r + Math.cos(rad) * arcR;
            const y1 = r + Math.sin(rad) * arcR;
            const x2 = r + Math.cos(rad + Math.PI / 2) * arcR;
            const y2 = r + Math.sin(rad + Math.PI / 2) * arcR;
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} A ${arcR} ${arcR} 0 0 1 ${x2} ${y2}`}
                stroke={`rgba(${180 + i*15},${120 + i*10},0,0.50)`}
                strokeWidth={Math.max(1, bw * 0.5)}
                fill="none"
                strokeDasharray={`${size * 0.08} ${size * 0.04}`}
              />
            );
          })}
          {/* Eye of Horus at top */}
          <g transform={`translate(${r - size*0.12}, ${padding * 0.3})`} style={{ animation: `${uid}-eye 2.5s ease-in-out infinite` }}>
            <ellipse cx={size*0.12} cy={size*0.06} rx={size*0.10} ry={size*0.055} fill="none" stroke="rgba(255,210,0,0.9)" strokeWidth={Math.max(1, bw*0.6)} />
            <circle cx={size*0.12} cy={size*0.06} r={size*0.025} fill="rgba(255,180,0,0.95)" />
            <path d={`M ${size*0.04} ${size*0.09} Q ${size*0.12} ${size*0.13} ${size*0.20} ${size*0.09}`} stroke="rgba(200,140,0,0.8)" strokeWidth={Math.max(1, bw*0.5)} fill="none" />
          </g>
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

export default ObsidianEgyptianFrame;
