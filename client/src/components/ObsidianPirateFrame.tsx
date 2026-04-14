import React from 'react';

interface FrameProps {
  size: number;
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ObsidianPirateFrame({ size, active = true, className = '', children }: FrameProps) {
  if (!active) return <div className={className}>{children}</div>;

  const padding = Math.round(size * 0.24);
  const outerSize = size + padding * 2;
  const uid = `obs-pi-${size}`;
  const bw = Math.max(2, Math.round(size * 0.048));
  const r = outerSize / 2;

  const lightningPoints = [30, 80, 150, 210, 260, 330];

  return (
    <>
      <style>{`
        @keyframes ${uid}-glow {
          0%, 100% {
            box-shadow:
              0 0 ${size * 0.10}px ${size * 0.03}px rgba(0,80,200,0.50),
              0 0 ${size * 0.25}px ${size * 0.07}px rgba(0,40,120,0.35),
              0 0 ${size * 0.45}px ${size * 0.12}px rgba(0,10,60,0.20);
          }
          30% {
            box-shadow:
              0 0 ${size * 0.20}px ${size * 0.08}px rgba(180,220,255,0.80),
              0 0 ${size * 0.45}px ${size * 0.15}px rgba(80,160,255,0.55),
              0 0 ${size * 0.70}px ${size * 0.22}px rgba(20,60,180,0.30);
          }
          60% {
            box-shadow:
              0 0 ${size * 0.08}px ${size * 0.02}px rgba(0,60,160,0.40),
              0 0 ${size * 0.20}px ${size * 0.05}px rgba(0,30,100,0.28),
              0 0 ${size * 0.38}px ${size * 0.10}px rgba(0,8,50,0.15);
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
          0%, 100% { border-color: rgba(0,80,200,0.85); box-shadow: 0 0 ${bw*2}px rgba(0,80,200,0.6), inset 0 0 ${bw}px rgba(0,80,200,0.2); }
          30%       { border-color: rgba(180,220,255,1.00); box-shadow: 0 0 ${bw*7}px rgba(180,220,255,1.0), inset 0 0 ${bw*2}px rgba(180,220,255,0.5); }
          65%       { border-color: rgba(0,50,140,0.70); box-shadow: 0 0 ${bw*1.2}px rgba(0,50,140,0.45), inset 0 0 ${bw*0.7}px rgba(0,50,140,0.15); }
        }
        @keyframes ${uid}-inner-pulse {
          0%, 100% { border-color: rgba(60,0,80,0.80); box-shadow: 0 0 ${bw*2}px rgba(60,0,80,0.55); }
          35%       { border-color: rgba(140,0,180,0.95); box-shadow: 0 0 ${bw*4}px rgba(140,0,180,0.85); }
          70%       { border-color: rgba(30,0,50,0.65); box-shadow: 0 0 ${bw*1.2}px rgba(30,0,50,0.40); }
        }
        @keyframes ${uid}-lightning {
          0%, 85%, 100% { opacity: 0; }
          88%, 92%      { opacity: 1; }
          95%           { opacity: 0.3; }
        }
        @keyframes ${uid}-ghost-fire {
          0%, 100% { opacity: 0.4; transform: scaleY(1) translateY(0); }
          50%       { opacity: 0.8; transform: scaleY(1.15) translateY(-2px); }
        }
        @keyframes ${uid}-skull {
          0%, 100% { opacity: 0.5; filter: drop-shadow(0 0 ${size*0.03}px rgba(100,180,255,0.6)); }
          50%       { opacity: 1.0; filter: drop-shadow(0 0 ${size*0.08}px rgba(180,220,255,1.0)); }
        }
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Storm glow */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.08),
          borderRadius: '50%',
          animation: `${uid}-glow 2.2s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
        }} />

        {/* Outer ring — storm blue, clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11),
          borderRadius: '50%',
          border: `${bw}px solid rgba(0,80,200,0.85)`,
          borderTopColor: 'rgba(180,220,255,1)',
          borderRightColor: 'rgba(0,60,160,0.5)',
          animation: `${uid}-ring-cw 4s linear infinite, ${uid}-outer-pulse 2.2s ease-in-out infinite`,
          zIndex: 1,
          pointerEvents: 'none',
        }} />

        {/* Inner ring — dark purple ghost, counter-clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11) + Math.round(size * 0.07),
          borderRadius: '50%',
          border: `${bw}px solid rgba(60,0,80,0.80)`,
          borderBottomColor: 'rgba(140,0,180,0.95)',
          animation: `${uid}-ring-ccw 3s linear infinite, ${uid}-inner-pulse 2.2s ease-in-out infinite 0.3s`,
          zIndex: 2,
          pointerEvents: 'none',
        }} />

        {/* Lightning bolts */}
        {lightningPoints.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const lR = outerSize * 0.43;
          const x = r + Math.cos(rad) * lR;
          const y = r + Math.sin(rad) * lR;
          const delay = i * 0.4;
          const lSize = Math.max(4, Math.round(size * 0.06));
          return (
            <svg key={i} aria-hidden="true" style={{
              position: 'absolute',
              left: x - lSize / 2,
              top: y - lSize / 2,
              width: lSize,
              height: lSize,
              zIndex: 3,
              pointerEvents: 'none',
              animation: `${uid}-lightning 1.8s ease-in-out ${delay}s infinite`,
            }} viewBox="0 0 10 10">
              <path d="M 6 0 L 3 5 L 5.5 5 L 4 10 L 7 4 L 4.5 4 Z"
                fill="rgba(200,230,255,0.95)"
                stroke="rgba(100,180,255,0.8)"
                strokeWidth="0.3"
              />
            </svg>
          );
        })}

        {/* Ghost fire arcs */}
        <svg aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          width: outerSize,
          height: outerSize,
          zIndex: 4,
          pointerEvents: 'none',
          animation: `${uid}-ghost-fire 2.5s ease-in-out infinite`,
        }} viewBox={`0 0 ${outerSize} ${outerSize}`}>
          {[0, 72, 144, 216, 288].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const fR = outerSize * 0.38;
            const x1 = r + Math.cos(rad) * fR;
            const y1 = r + Math.sin(rad) * fR;
            const x2 = r + Math.cos(rad + 0.5) * (fR + size * 0.08);
            const y2 = r + Math.sin(rad + 0.5) * (fR + size * 0.08);
            const cx = r + Math.cos(rad + 0.25) * (fR + size * 0.12);
            const cy = r + Math.sin(rad + 0.25) * (fR + size * 0.12);
            return (
              <path key={i}
                d={`M ${x1} ${y1} Q ${cx} ${cy} ${x2} ${y2}`}
                stroke={`rgba(${60 + i*20},${0 + i*10},${180 - i*20},0.60)`}
                strokeWidth={Math.max(1, bw * 0.55)}
                fill="none"
                strokeLinecap="round"
              />
            );
          })}
          {/* Skull at top */}
          <g transform={`translate(${r - size*0.10}, ${padding * 0.25})`} style={{ animation: `${uid}-skull 3s ease-in-out infinite` }}>
            <circle cx={size*0.10} cy={size*0.07} r={size*0.065} fill="none" stroke="rgba(180,220,255,0.85)" strokeWidth={Math.max(1, bw*0.55)} />
            <circle cx={size*0.07} cy={size*0.065} r={size*0.015} fill="rgba(180,220,255,0.9)" />
            <circle cx={size*0.13} cy={size*0.065} r={size*0.015} fill="rgba(180,220,255,0.9)" />
            <path d={`M ${size*0.065} ${size*0.105} L ${size*0.065} ${size*0.12} M ${size*0.10} ${size*0.105} L ${size*0.10} ${size*0.12} M ${size*0.135} ${size*0.105} L ${size*0.135} ${size*0.12}`}
              stroke="rgba(180,220,255,0.8)" strokeWidth={Math.max(1, bw*0.4)} strokeLinecap="round" />
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

export default ObsidianPirateFrame;
