import React from 'react';

interface FrameProps {
  size: number;
  active?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function ObsidianHiphopFrame({ size, active = true, className = '', children }: FrameProps) {
  if (!active) return <div className={className}>{children}</div>;

  const padding = Math.round(size * 0.24);
  const outerSize = size + padding * 2;
  const uid = `obs-hh-${size}`;
  const bw = Math.max(2, Math.round(size * 0.048));
  const r = outerSize / 2;

  const beatNodes = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

  return (
    <>
      <style>{`
        @keyframes ${uid}-glow {
          0%, 100% {
            box-shadow:
              0 0 ${size * 0.10}px ${size * 0.03}px rgba(200,150,0,0.50),
              0 0 ${size * 0.25}px ${size * 0.07}px rgba(100,60,0,0.35),
              0 0 ${size * 0.45}px ${size * 0.12}px rgba(40,20,0,0.20);
          }
          50% {
            box-shadow:
              0 0 ${size * 0.18}px ${size * 0.06}px rgba(255,200,0,0.70),
              0 0 ${size * 0.40}px ${size * 0.12}px rgba(200,100,0,0.45),
              0 0 ${size * 0.65}px ${size * 0.20}px rgba(80,30,0,0.28);
          }
        }
        @keyframes ${uid}-vinyl-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ${uid}-vinyl-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes ${uid}-outer-pulse {
          0%, 100% { border-color: rgba(200,150,0,0.85); box-shadow: 0 0 ${bw*2}px rgba(200,150,0,0.6), inset 0 0 ${bw}px rgba(200,150,0,0.2); }
          50%       { border-color: rgba(255,220,0,1.00); box-shadow: 0 0 ${bw*6}px rgba(255,220,0,0.95), inset 0 0 ${bw*2}px rgba(255,220,0,0.45); }
        }
        @keyframes ${uid}-inner-pulse {
          0%, 100% { border-color: rgba(40,0,60,0.80); box-shadow: 0 0 ${bw*2}px rgba(40,0,60,0.55); }
          50%       { border-color: rgba(120,0,180,0.95); box-shadow: 0 0 ${bw*4}px rgba(120,0,180,0.85); }
        }
        @keyframes ${uid}-beat {
          0%, 100% { transform: scaleY(0.4); opacity: 0.3; }
          50%       { transform: scaleY(1.0); opacity: 1.0; }
        }
        @keyframes ${uid}-spark {
          0%, 100% { opacity: 0.2; transform: scale(0.6) rotate(0deg); }
          50%       { opacity: 0.9; transform: scale(1.3) rotate(180deg); }
        }
        @keyframes ${uid}-chain {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Gold glow */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.08),
          borderRadius: '50%',
          animation: `${uid}-glow 2.8s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
        }} />

        {/* Vinyl groove ring (SVG, slow spin) */}
        <svg aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          width: outerSize,
          height: outerSize,
          zIndex: 0,
          pointerEvents: 'none',
          animation: `${uid}-vinyl-cw 6s linear infinite`,
        }} viewBox={`0 0 ${outerSize} ${outerSize}`}>
          {[0.42, 0.39, 0.36].map((rFrac, i) => (
            <circle key={i} cx={r} cy={r} r={outerSize * rFrac}
              fill="none"
              stroke={`rgba(${180 - i*30},${130 - i*20},0,${0.4 - i*0.08})`}
              strokeWidth={Math.max(1, bw * 0.4)}
              strokeDasharray={`${size * 0.05} ${size * 0.03}`}
            />
          ))}
        </svg>

        {/* Outer ring — gold, clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11),
          borderRadius: '50%',
          border: `${bw}px solid rgba(200,150,0,0.85)`,
          borderTopColor: 'rgba(255,220,0,1)',
          borderRightColor: 'rgba(160,100,0,0.5)',
          animation: `${uid}-vinyl-cw 4s linear infinite, ${uid}-outer-pulse 2.8s ease-in-out infinite`,
          zIndex: 1,
          pointerEvents: 'none',
        }} />

        {/* Inner ring — dark purple, counter-clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          inset: padding - Math.round(size * 0.11) + Math.round(size * 0.07),
          borderRadius: '50%',
          border: `${bw}px solid rgba(40,0,60,0.80)`,
          borderBottomColor: 'rgba(120,0,180,0.95)',
          animation: `${uid}-vinyl-ccw 3s linear infinite, ${uid}-inner-pulse 2.8s ease-in-out infinite 0.4s`,
          zIndex: 2,
          pointerEvents: 'none',
        }} />

        {/* Beat wave nodes */}
        {beatNodes.map((angle, i) => {
          const rad = (angle * Math.PI) / 180;
          const nodeR = outerSize * 0.44;
          const x = r + Math.cos(rad) * nodeR;
          const y = r + Math.sin(rad) * nodeR;
          const nW = Math.max(2, Math.round(size * 0.025));
          const nH = Math.max(4, Math.round(size * (0.04 + (i % 4) * 0.015)));
          const delay = i * 0.15;
          const colors = ['rgba(255,220,0,0.95)', 'rgba(200,100,0,0.85)', 'rgba(120,0,180,0.80)'];
          return (
            <div key={i} aria-hidden="true" style={{
              position: 'absolute',
              left: x - nW / 2,
              top: y - nH / 2,
              width: nW,
              height: nH,
              borderRadius: '1px',
              background: colors[i % 3],
              boxShadow: `0 0 ${nW * 2}px ${colors[i % 3]}`,
              transformOrigin: 'center',
              animation: `${uid}-beat 0.6s ease-in-out ${delay}s infinite`,
              zIndex: 3,
              pointerEvents: 'none',
              transform: `rotate(${angle}deg)`,
            }} />
          );
        })}

        {/* Gold chain (SVG, counter-clockwise) */}
        <svg aria-hidden="true" style={{
          position: 'absolute',
          inset: 0,
          width: outerSize,
          height: outerSize,
          zIndex: 4,
          pointerEvents: 'none',
          animation: `${uid}-chain 10s linear infinite reverse`,
        }} viewBox={`0 0 ${outerSize} ${outerSize}`}>
          {Array.from({ length: 16 }, (_, i) => {
            const angle = (i / 16) * Math.PI * 2;
            const chainR = outerSize * 0.40;
            const cx2 = r + Math.cos(angle) * chainR;
            const cy2 = r + Math.sin(angle) * chainR;
            return (
              <ellipse key={i}
                cx={cx2} cy={cy2}
                rx={Math.max(2, size * 0.025)} ry={Math.max(1.5, size * 0.018)}
                fill="none"
                stroke={`rgba(${200 + (i%3)*18},${150 + (i%3)*15},0,0.75)`}
                strokeWidth={Math.max(0.8, bw * 0.35)}
                transform={`rotate(${(angle * 180) / Math.PI}, ${cx2}, ${cy2})`}
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

export default ObsidianHiphopFrame;
