import React from "react";

interface GreatKhanFrameProps {
  size: number;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * GreatKhanFrame — CSS-only animated frame for the Great Khan seasonal rank.
 * Design: dark gold + black metallic conic-gradient rotating ring,
 * with 8 ornamental diamond gems around the border, pulsing golden glow,
 * and a slow counter-rotating inner shimmer layer.
 * No Canvas, no JS animation loop. GPU-accelerated 60fps.
 */
export function GreatKhanFrame({ size, children, active = true, className = "" }: GreatKhanFrameProps) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  const padding = Math.round(size * 0.24);
  const outerSize = size + padding * 2;
  const uniqueId = `gk-frame-${size}`;

  // 8 ornamental gems around the ring
  const gems = [
    { angle: 0,    delay: "0s",    dur: "3.2s" },
    { angle: 45,   delay: "0.4s",  dur: "3.6s" },
    { angle: 90,   delay: "0.8s",  dur: "3.0s" },
    { angle: 135,  delay: "1.2s",  dur: "3.4s" },
    { angle: 180,  delay: "0.2s",  dur: "3.8s" },
    { angle: 225,  delay: "0.6s",  dur: "3.2s" },
    { angle: 270,  delay: "1.0s",  dur: "3.6s" },
    { angle: 315,  delay: "1.4s",  dur: "3.0s" },
  ];

  const ringRadius = (outerSize / 2) - (padding * 0.35);
  const gemSize = Math.max(4, Math.round(size * 0.09));

  return (
    <>
      <style>{`
        @keyframes ${uniqueId}-rotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ${uniqueId}-rotate-rev {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes ${uniqueId}-glow-pulse {
          0%, 100% {
            box-shadow:
              0 0 10px 4px rgba(218,165,32,0.65),
              0 0 22px 8px rgba(180,130,10,0.40),
              0 0 40px 14px rgba(120,80,0,0.20);
          }
          50% {
            box-shadow:
              0 0 16px 6px rgba(255,215,80,0.85),
              0 0 32px 12px rgba(218,165,32,0.55),
              0 0 56px 20px rgba(160,110,0,0.30);
          }
        }
        @keyframes ${uniqueId}-border-pulse {
          0%, 100% { border-color: rgba(218,165,32,0.85); box-shadow: 0 0 5px 1px rgba(218,165,32,0.5); }
          33%       { border-color: rgba(255,240,100,0.95); box-shadow: 0 0 9px 3px rgba(255,240,100,0.7); }
          66%       { border-color: rgba(180,130,10,0.90); box-shadow: 0 0 7px 2px rgba(180,130,10,0.55); }
        }
        @keyframes ${uniqueId}-gem-pulse {
          0%, 100% { opacity: 0.65; transform: scale(0.85); }
          50%       { opacity: 1.0;  transform: scale(1.15); }
        }
        @keyframes ${uniqueId}-inner-glow {
          0%, 100% { opacity: 0.0; }
          40%, 60%  { opacity: 0.35; }
        }
        ${gems.map((g, i) => {
          const rad = (g.angle * Math.PI) / 180;
          const cx = outerSize / 2 + ringRadius * Math.cos(rad - Math.PI / 2) - gemSize / 2;
          const cy = outerSize / 2 + ringRadius * Math.sin(rad - Math.PI / 2) - gemSize / 2;
          return `
          .${uniqueId}-gem-${i} {
            position: absolute;
            left: ${cx.toFixed(1)}px;
            top: ${cy.toFixed(1)}px;
            width: ${gemSize}px;
            height: ${gemSize}px;
            border-radius: ${Math.round(gemSize * 0.3)}px;
            background: radial-gradient(circle at 30% 30%, #fffde0, #ffd700 45%, #b8860b 75%, #6b4c00);
            box-shadow: 0 0 ${Math.round(gemSize * 0.8)}px ${Math.round(gemSize * 0.4)}px rgba(255,215,0,0.7);
            animation: ${uniqueId}-gem-pulse ${g.dur} ${g.delay} ease-in-out infinite;
            z-index: 4;
            pointer-events: none;
          }`;
        }).join("")}
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Outer golden glow ring */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.10),
            borderRadius: "50%",
            animation: `${uniqueId}-glow-pulse 2.8s ease-in-out infinite`,
            zIndex: 0,
          }}
        />

        {/* Rotating dark-gold conic layer 1 — main ring */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.14),
            borderRadius: "50%",
            background: `conic-gradient(
              rgba(20,12,0,0.0)     0deg,
              rgba(218,165,32,0.95) 18deg,
              rgba(255,215,80,1.0)  36deg,
              rgba(180,130,10,0.85) 60deg,
              rgba(100,70,0,0.6)    90deg,
              rgba(218,165,32,0.9)  120deg,
              rgba(255,240,100,1.0) 140deg,
              rgba(180,130,10,0.8)  165deg,
              rgba(60,40,0,0.5)     195deg,
              rgba(218,165,32,0.95) 220deg,
              rgba(255,215,80,1.0)  240deg,
              rgba(180,130,10,0.85) 265deg,
              rgba(100,70,0,0.6)    295deg,
              rgba(218,165,32,0.9)  320deg,
              rgba(255,240,100,1.0) 340deg,
              rgba(20,12,0,0.0)     360deg
            )`,
            animation: `${uniqueId}-rotate 5s linear infinite`,
            filter: `blur(${Math.round(size * 0.055)}px)`,
            zIndex: 1,
          }}
        />

        {/* Counter-rotating shimmer layer 2 */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.09),
            borderRadius: "50%",
            background: `conic-gradient(
              rgba(255,240,100,0)    0deg,
              rgba(255,215,80,0.55)  40deg,
              rgba(218,165,32,0.35)  80deg,
              rgba(255,240,100,0.65) 120deg,
              rgba(150,100,0,0.25)   160deg,
              rgba(255,215,80,0.55)  200deg,
              rgba(218,165,32,0.35)  240deg,
              rgba(255,240,100,0.65) 280deg,
              rgba(150,100,0,0.25)   320deg,
              rgba(255,240,100,0)    360deg
            )`,
            animation: `${uniqueId}-rotate-rev 3.5s linear infinite`,
            filter: `blur(${Math.round(size * 0.03)}px)`,
            zIndex: 2,
          }}
        />

        {/* Inner ambient glow — subtle dark gold halo inside the ring */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.04),
            borderRadius: "50%",
            background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(218,165,32,0.28) 80%, transparent 100%)",
            animation: `${uniqueId}-inner-glow 2.8s ease-in-out infinite`,
            zIndex: 3,
            pointerEvents: "none",
          }}
        />

        {/* 8 ornamental diamond gems */}
        {gems.map((_, i) => (
          <div key={i} className={`${uniqueId}-gem-${i}`} />
        ))}

        {/* Gold border ring */}
        <div
          style={{
            position: "absolute",
            inset: padding - 2,
            borderRadius: "50%",
            border: `${Math.max(2, Math.round(size * 0.04))}px solid rgba(218,165,32,0.9)`,
            animation: `${uniqueId}-border-pulse 2.8s ease-in-out infinite`,
            zIndex: 5,
          }}
        />

        {/* Avatar content */}
        <div
          style={{
            position: "absolute",
            inset: padding,
            borderRadius: "50%",
            overflow: "hidden",
            zIndex: 6,
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

export default GreatKhanFrame;
