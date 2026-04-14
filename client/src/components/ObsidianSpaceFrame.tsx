import React from 'react';

interface FrameProps {
  size: number;
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ObsidianSpaceFrame({ size, active = true, className = '', children }: FrameProps) {
  if (!active) return <div className={className}>{children}</div>;

  const padding = Math.round(size * 0.24);
  const outerSize = size + padding * 2;
  const uid = `obs-sp-${size}`;
  const bw = Math.max(2, Math.round(size * 0.048));
  const r = outerSize / 2;

  const stars = Array.from({ length: 12 }, (_, i) => ({
    angle: i * 30,
    delay: i * 0.25,
    dur: 2.0 + (i % 3) * 0.5,
    dist: 0.40 + (i % 3) * 0.025,
  }));

  return (
    <>
      <style>{`
        @keyframes ${uid}-glow {
          0%, 100% {
            box-shadow:
              0 0 ${size * 0.12}px ${size * 0.04}px rgba(60,0,120,0.55),
              0 0 ${size * 0.28}px ${size * 0.08}px rgba(20,0,80,0.38),
              0 0 ${size * 0.50}px ${size * 0.14}px rgba(0,0,40,0.22);
          }
          50% {
            box-shadow:
              0 0 ${size * 0.20}px ${size * 0.07}px rgba(140,0,255,0.70),
              0 0 ${size * 0.45}px ${size * 0.14}px rgba(60,0,180,0.48),
              0 0 ${size * 0.75}px ${size * 0.22}px rgba(20,0,80,0.28);
          }
        }
        @keyframes ${uid}-galaxy-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ${uid}-galaxy-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes ${uid}-outer-pulse {
          0%, 100% { border-color: rgba(100,0,200,0.85); box-shadow: 0 0 ${bw*2}px rgba(100,0,200,0.6), inset 0 0 ${bw}px rgba(100,0,200,0.2); }
          50%       { border-color: rgba(200,100,255,1.00); box-shadow: 0 0 ${bw*6}px rgba(200,100,255,0.95), inset 0 0 ${bw*2}px rgba(200,100,255,0.45); }
        }
        @keyframes ${uid}-inner-pulse {
          0%, 100% { border-color: rgba(0,20,80,0.80); box-shadow: 0 0 ${bw*2}px rgba(0,20,80,0.55); }
          50%       { border-color: rgba(0,80,200,0.95); box-shadow: 0 0 ${bw*4}px rgba(0,80,200,0.85); }
        }
        @keyframes ${uid}-star {
          0%, 100% { opacity: 0.2; transform: scale(0.6); }
          50%       { opacity: 1.0; transform: scale(1.3); }
        }
        @keyframes ${uid}-supernova {
          0%, 80%, 100% { opacity: 0; transform: scale(0.5); }
          85%            { opacity: 0.9; transform: scale(1.4); }
          95%            { opacity: 0.4; transform: scale(1.1); }
        }
        @keyframes ${uid}-spiral {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Black hole glow */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.08),
          borderRadius: '50%',
          animation: `${uid}-glow 4s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
        }} />

        {/* Galaxy spiral (SVG, slow rotation) */}
        <svg aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          width: outerSize,
          height: outerSize,
          zIndex: 0,
          pointerEvents: 'none',
          animation: `${uid}-spiral 12s linear infinite`,
        }} viewBox={`0 0 ${outerSize} ${outerSize}`}>
          <defs>
            <linearGradient id={`${uid}-spiral-grad`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="rgba(140,0,255,0.0)" />
              <stop offset="40%" stopColor="rgba(100,0,200,0.5)" />
              <stop offset="70%" stopColor="rgba(0,60,180,0.4)" />
              <stop offset="100%" stopColor="rgba(140,0,255,0.0)" />
            </linearGradient>
          </defs>
          <circle cx={r} cy={r} r={outerSize * 0.41}
            fill="none"
            stroke={`url(#${uid}-spiral-grad)`}
            strokeWidth={Math.max(4, bw * 2)}
            strokeDasharray={`${outerSize * 0.5} ${outerSize * 0.8}`}
          />
          <circle cx={r} cy={r} r={outerSize * 0.36}
            fill="none"
            stroke="rgba(0,60,180,0.35)"
            strokeWidth={Math.max(2, bw * 0.8)}
            strokeDasharray={`${outerSize * 0.3} ${outerSize * 0.5}`}
          />
        </svg>

        {/* Outer ring — deep purple, clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11),
          borderRadius: '50%',
          border: `${bw}px solid rgba(100,0,200,0.85)`,
          borderTopColor: 'rgba(200,100,255,1)',
          borderRightColor: 'rgba(60,0,140,0.5)',
          animation: `${uid}-galaxy-cw 7s linear infinite, ${uid}-outer-pulse 4s ease-in-out infinite`,
          zIndex: 1,
          pointerEvents: 'none',
        }} />

        {/* Inner ring — dark blue, counter-clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11) + Math.round(size * 0.07),
          borderRadius: '50%',
          border: `${bw}px solid rgba(0,20,80,0.80)`,
          borderBottomColor: 'rgba(0,80,200,0.95)',
          animation: `${uid}-galaxy-ccw 4.5s linear infinite, ${uid}-inner-pulse 4s ease-in-out infinite 0.5s`,
          zIndex: 2,
          pointerEvents: 'none',
        }} />

        {/* Stars */}
        {stars.map((s, i) => {
          const rad = (s.angle * Math.PI) / 180;
          const x = r + Math.cos(rad) * (outerSize * s.dist) - 2;
          const y = r + Math.sin(rad) * (outerSize * s.dist) - 2;
          const sSize = Math.max(2, Math.round(size * (0.03 + (i % 3) * 0.01)));
          return (
            <div key={i} aria-hidden="true" style={{
              position: 'absolute',
              left: x,
              top: y,
              width: sSize,
              height: sSize,
              borderRadius: '50%',
              background: i % 3 === 0
                ? 'rgba(200,150,255,0.95)'
                : i % 3 === 1
                  ? 'rgba(150,200,255,0.90)'
                  : 'rgba(255,255,255,0.85)',
              boxShadow: `0 0 ${sSize * 2}px rgba(180,100,255,0.8)`,
              animation: `${uid}-star ${s.dur}s ease-in-out ${s.delay}s infinite`,
              zIndex: 3,
              pointerEvents: 'none',
            }} />
          );
        })}

        {/* Supernova flash */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          left: r - size * 0.08,
          top: padding * 0.25,
          width: size * 0.16,
          height: size * 0.16,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.95) 0%, rgba(200,100,255,0.7) 40%, transparent 100%)',
          boxShadow: `0 0 ${size * 0.12}px rgba(200,100,255,0.9)`,
          animation: `${uid}-supernova 3.5s ease-in-out 0.8s infinite`,
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

export default ObsidianSpaceFrame;
