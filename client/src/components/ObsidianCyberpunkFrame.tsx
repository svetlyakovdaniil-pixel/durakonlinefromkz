import React from 'react';

interface FrameProps {
  size: number;
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ObsidianCyberpunkFrame({ size, active = true, className = '', children }: FrameProps) {
  if (!active) return <div className={className}>{children}</div>;

  const padding = Math.round(size * 0.24);
  const outerSize = size + padding * 2;
  const uid = `obs-cp-${size}`;
  const bw = Math.max(2, Math.round(size * 0.048));
  const r = outerSize / 2;

  const glitchNodes = [0, 45, 90, 135, 180, 225, 270, 315];

  return (
    <>
      <style>{`
        @keyframes ${uid}-glow {
          0%, 100% {
            box-shadow:
              0 0 ${size * 0.10}px ${size * 0.03}px rgba(0,255,180,0.50),
              0 0 ${size * 0.25}px ${size * 0.07}px rgba(0,100,80,0.35),
              0 0 ${size * 0.45}px ${size * 0.12}px rgba(0,40,30,0.20);
          }
          30% {
            box-shadow:
              0 0 ${size * 0.18}px ${size * 0.06}px rgba(255,0,180,0.65),
              0 0 ${size * 0.40}px ${size * 0.12}px rgba(180,0,120,0.42),
              0 0 ${size * 0.65}px ${size * 0.20}px rgba(80,0,60,0.25);
          }
          60% {
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.04}px rgba(0,200,255,0.60),
              0 0 ${size * 0.32}px ${size * 0.09}px rgba(0,80,180,0.38),
              0 0 ${size * 0.55}px ${size * 0.15}px rgba(0,20,80,0.22);
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
          0%, 100% { border-color: rgba(0,255,180,0.85); box-shadow: 0 0 ${bw*2}px rgba(0,255,180,0.6), inset 0 0 ${bw}px rgba(0,255,180,0.2); }
          30%       { border-color: rgba(255,0,180,1.00); box-shadow: 0 0 ${bw*6}px rgba(255,0,180,0.95), inset 0 0 ${bw*2}px rgba(255,0,180,0.45); }
          60%       { border-color: rgba(0,200,255,0.90); box-shadow: 0 0 ${bw*4}px rgba(0,200,255,0.80), inset 0 0 ${bw*1.5}px rgba(0,200,255,0.35); }
        }
        @keyframes ${uid}-inner-pulse {
          0%, 100% { border-color: rgba(0,60,40,0.80); box-shadow: 0 0 ${bw*2}px rgba(0,60,40,0.55); }
          40%       { border-color: rgba(0,255,180,0.95); box-shadow: 0 0 ${bw*4}px rgba(0,255,180,0.85); }
          80%       { border-color: rgba(100,0,80,0.85); box-shadow: 0 0 ${bw*3}px rgba(100,0,80,0.70); }
        }
        @keyframes ${uid}-glitch {
          0%, 90%, 100% { opacity: 0.4; transform: translateX(0) scaleX(1); }
          92%            { opacity: 1.0; transform: translateX(${size * 0.015}px) scaleX(1.05); }
          94%            { opacity: 0.8; transform: translateX(-${size * 0.01}px) scaleX(0.98); }
          96%            { opacity: 1.0; transform: translateX(0) scaleX(1); }
        }
        @keyframes ${uid}-node {
          0%, 100% { opacity: 0.3; transform: scale(0.7); }
          50%       { opacity: 1.0; transform: scale(1.2); }
        }
        @keyframes ${uid}-data-rain {
          0%   { transform: translateY(-${outerSize * 0.1}px); opacity: 0; }
          20%  { opacity: 0.8; }
          80%  { opacity: 0.6; }
          100% { transform: translateY(${outerSize * 0.1}px); opacity: 0; }
        }
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Void circuit glow */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.08),
          borderRadius: '50%',
          animation: `${uid}-glow 2.5s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
        }} />

        {/* Outer ring — neon green/pink glitch, clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11),
          borderRadius: '50%',
          border: `${bw}px solid rgba(0,255,180,0.85)`,
          borderTopColor: 'rgba(255,0,180,1)',
          borderRightColor: 'rgba(0,200,255,0.7)',
          animation: `${uid}-ring-cw 3.5s linear infinite, ${uid}-outer-pulse 2.5s ease-in-out infinite`,
          zIndex: 1,
          pointerEvents: 'none',
        }} />

        {/* Inner ring — dark void, counter-clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11) + Math.round(size * 0.07),
          borderRadius: '50%',
          border: `${bw}px solid rgba(0,60,40,0.80)`,
          borderBottomColor: 'rgba(0,255,180,0.95)',
          borderLeftColor: 'rgba(100,0,80,0.7)',
          animation: `${uid}-ring-ccw 2.5s linear infinite, ${uid}-inner-pulse 2.5s ease-in-out infinite 0.4s`,
          zIndex: 2,
          pointerEvents: 'none',
        }} />

        {/* Circuit nodes */}
        {glitchNodes.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const nodeR = outerSize * 0.44;
          const x = r + Math.cos(rad) * nodeR;
          const y = r + Math.sin(rad) * nodeR;
          const nSize = Math.max(3, Math.round(size * 0.048));
          const delay = i * 0.3;
          const colors = ['rgba(0,255,180,0.95)', 'rgba(255,0,180,0.90)', 'rgba(0,200,255,0.85)'];
          return (
            <svg key={i} aria-hidden="true" style={{
              position: 'absolute',
              left: x - nSize / 2,
              top: y - nSize / 2,
              width: nSize,
              height: nSize,
              zIndex: 3,
              pointerEvents: 'none',
              animation: `${uid}-node 1.8s ease-in-out ${delay}s infinite`,
            }} viewBox="0 0 10 10">
              <rect x="2" y="2" width="6" height="6" rx="1"
                fill="none"
                stroke={colors[i % 3]}
                strokeWidth="1.5"
              />
              <circle cx="5" cy="5" r="1.5" fill={colors[i % 3]} />
            </svg>
          );
        })}

        {/* Glitch overlay + circuit lines */}
        <svg aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          width: outerSize,
          height: outerSize,
          zIndex: 4,
          pointerEvents: 'none',
          animation: `${uid}-glitch 3s ease-in-out infinite`,
        }} viewBox={`0 0 ${outerSize} ${outerSize}`}>
          {/* Circuit arcs */}
          {[0, 60, 120, 180, 240, 300].map((angle, i) => {
            const rad = (angle * Math.PI) / 180;
            const arcR = outerSize * 0.39;
            const x1 = r + Math.cos(rad) * arcR;
            const y1 = r + Math.sin(rad) * arcR;
            const x2 = r + Math.cos(rad + Math.PI / 3) * arcR;
            const y2 = r + Math.sin(rad + Math.PI / 3) * arcR;
            const colors2 = ['rgba(0,255,180,0.5)', 'rgba(255,0,180,0.45)', 'rgba(0,200,255,0.4)'];
            return (
              <line key={i}
                x1={x1} y1={y1} x2={x2} y2={y2}
                stroke={colors2[i % 3]}
                strokeWidth={Math.max(1, bw * 0.45)}
                strokeDasharray={`${size * 0.06} ${size * 0.04}`}
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

export default ObsidianCyberpunkFrame;
