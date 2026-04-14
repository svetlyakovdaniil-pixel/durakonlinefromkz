import React from 'react';

interface FrameProps {
  size: number;
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ObsidianUnderwaterFrame({ size, active = true, className = '', children }: FrameProps) {
  if (!active) return <div className={className}>{children}</div>;

  const padding = Math.round(size * 0.24);
  const outerSize = size + padding * 2;
  const uid = `obs-uw-${size}`;
  const bw = Math.max(2, Math.round(size * 0.048));

  // Generate bubble positions
  const bubbles = [
    { angle: 0,   delay: 0,    dur: 3.2 },
    { angle: 45,  delay: 0.6,  dur: 2.8 },
    { angle: 90,  delay: 1.1,  dur: 3.5 },
    { angle: 135, delay: 0.3,  dur: 2.6 },
    { angle: 180, delay: 0.9,  dur: 3.0 },
    { angle: 225, delay: 1.5,  dur: 2.9 },
    { angle: 270, delay: 0.4,  dur: 3.3 },
    { angle: 315, delay: 1.2,  dur: 2.7 },
  ];

  const r = outerSize / 2;

  return (
    <>
      <style>{`
        @keyframes ${uid}-glow {
          0%, 100% {
            box-shadow:
              0 0 ${size * 0.10}px ${size * 0.03}px rgba(0,180,160,0.55),
              0 0 ${size * 0.25}px ${size * 0.07}px rgba(0,100,120,0.35),
              0 0 ${size * 0.45}px ${size * 0.12}px rgba(0,40,80,0.20);
          }
          50% {
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.05}px rgba(0,220,200,0.65),
              0 0 ${size * 0.32}px ${size * 0.10}px rgba(0,150,160,0.42),
              0 0 ${size * 0.55}px ${size * 0.16}px rgba(0,60,100,0.25);
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
          0%, 100% { border-color: rgba(0,200,180,0.85); box-shadow: 0 0 ${bw*2}px rgba(0,200,180,0.6), inset 0 0 ${bw}px rgba(0,200,180,0.2); }
          40%       { border-color: rgba(100,255,240,1.00); box-shadow: 0 0 ${bw*5}px rgba(100,255,240,0.9), inset 0 0 ${bw*2}px rgba(100,255,240,0.4); }
          80%       { border-color: rgba(0,140,140,0.75); box-shadow: 0 0 ${bw*1.5}px rgba(0,140,140,0.5), inset 0 0 ${bw*0.8}px rgba(0,140,140,0.18); }
        }
        @keyframes ${uid}-inner-pulse {
          0%, 100% { border-color: rgba(0,100,160,0.80); box-shadow: 0 0 ${bw*2}px rgba(0,100,160,0.55), inset 0 0 ${bw}px rgba(0,100,160,0.2); }
          35%       { border-color: rgba(0,180,220,0.95); box-shadow: 0 0 ${bw*4}px rgba(0,180,220,0.85), inset 0 0 ${bw*1.5}px rgba(0,180,220,0.35); }
          75%       { border-color: rgba(0,60,120,0.70); box-shadow: 0 0 ${bw*1.2}px rgba(0,60,120,0.45), inset 0 0 ${bw*0.7}px rgba(0,60,120,0.15); }
        }
        @keyframes ${uid}-bubble {
          0%   { opacity: 0; transform: scale(0.3); }
          20%  { opacity: 0.9; transform: scale(1.0); }
          60%  { opacity: 0.7; transform: scale(0.85); }
          100% { opacity: 0; transform: scale(0.2); }
        }
        @keyframes ${uid}-tentacle {
          0%, 100% { transform: rotate(0deg) scaleX(1); opacity: 0.5; }
          25%       { transform: rotate(8deg) scaleX(1.1); opacity: 0.8; }
          75%       { transform: rotate(-6deg) scaleX(0.9); opacity: 0.6; }
        }
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Deep glow */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.08),
          borderRadius: '50%',
          animation: `${uid}-glow 3.5s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
        }} />

        {/* Outer ring — teal, clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11),
          borderRadius: '50%',
          border: `${bw}px solid rgba(0,200,180,0.85)`,
          borderTopColor: 'rgba(100,255,240,1)',
          borderRightColor: 'rgba(0,200,180,0.5)',
          animation: `${uid}-ring-cw 5s linear infinite, ${uid}-outer-pulse 3.2s ease-in-out infinite`,
          zIndex: 1,
          pointerEvents: 'none',
        }} />

        {/* Inner ring — deep blue, counter-clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11) + Math.round(size * 0.07),
          borderRadius: '50%',
          border: `${bw}px solid rgba(0,100,160,0.80)`,
          borderBottomColor: 'rgba(0,180,220,0.95)',
          borderLeftColor: 'rgba(0,60,120,0.5)',
          animation: `${uid}-ring-ccw 3.5s linear infinite, ${uid}-inner-pulse 3.2s ease-in-out infinite 0.5s`,
          zIndex: 2,
          pointerEvents: 'none',
        }} />

        {/* Bioluminescent bubbles */}
        {bubbles.map((b, i) => {
          const rad = (b.angle * Math.PI) / 180;
          const bR = outerSize * 0.44;
          const x = r + Math.cos(rad) * bR - 3;
          const y = r + Math.sin(rad) * bR - 3;
          const bSize = Math.max(3, Math.round(size * 0.055));
          return (
            <div key={i} aria-hidden="true" style={{
              position: 'absolute',
              left: x,
              top: y,
              width: bSize,
              height: bSize,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(100,255,240,0.95) 0%, rgba(0,180,160,0.6) 60%, transparent 100%)`,
              boxShadow: `0 0 ${bSize * 1.5}px rgba(100,255,240,0.8)`,
              animation: `${uid}-bubble ${b.dur}s ease-in-out ${b.delay}s infinite`,
              zIndex: 3,
              pointerEvents: 'none',
            }} />
          );
        })}

        {/* Tentacle arcs (SVG overlay) */}
        <svg
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            width: outerSize,
            height: outerSize,
            zIndex: 4,
            pointerEvents: 'none',
            animation: `${uid}-tentacle 4s ease-in-out infinite`,
          }}
          viewBox={`0 0 ${outerSize} ${outerSize}`}
        >
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const innerR = outerSize * 0.36;
            const outerR2 = outerSize * 0.48;
            const x1 = r + Math.cos(rad) * innerR;
            const y1 = r + Math.sin(rad) * innerR;
            const x2 = r + Math.cos(rad + 0.4) * outerR2;
            const y2 = r + Math.sin(rad + 0.4) * outerR2;
            const cx1 = r + Math.cos(rad + 0.2) * (innerR + outerR2) / 2;
            const cy1 = r + Math.sin(rad + 0.2) * (innerR + outerR2) / 2;
            return (
              <path
                key={i}
                d={`M ${x1} ${y1} Q ${cx1} ${cy1} ${x2} ${y2}`}
                stroke={`rgba(0,${150 + i * 15},${140 + i * 10},0.55)`}
                strokeWidth={Math.max(1, bw * 0.6)}
                fill="none"
                strokeLinecap="round"
              />
            );
          })}
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

export default ObsidianUnderwaterFrame;
