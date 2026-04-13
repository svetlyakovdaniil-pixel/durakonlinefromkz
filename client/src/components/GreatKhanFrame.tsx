import React from "react";

interface GreatKhanFrameProps {
  size: number;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * GreatKhanFrame — CSS-only animated frame for the Great Khan seasonal rank.
 * Design: copper (#B87333 / #CD7F32) dominant with deep black accents.
 * Rotating conic-gradient ring, 8 ornamental gems, pulsing glow.
 * No Canvas, no JS animation loop. GPU-accelerated 60fps.
 *
 * Copper palette:
 *   #CD7F32 — classic copper
 *   #B87333 — darker copper
 *   #E8956A — lighter copper highlight
 *   #8B4513 — deep dark copper / saddle brown
 *   #0A0A0A — deep black
 *   #1A0800 — very dark copper-tinted black
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
              0 0 10px 4px rgba(205,127,50,0.70),
              0 0 22px 8px rgba(184,115,51,0.45),
              0 0 40px 14px rgba(10,10,10,0.55);
          }
          50% {
            box-shadow:
              0 0 18px 7px rgba(232,149,106,0.85),
              0 0 34px 13px rgba(205,127,50,0.60),
              0 0 58px 22px rgba(10,10,10,0.40);
          }
        }
        @keyframes ${uniqueId}-border-pulse {
          0%, 100% { border-color: rgba(205,127,50,0.90); box-shadow: 0 0 5px 1px rgba(205,127,50,0.55); }
          33%       { border-color: rgba(232,149,106,0.98); box-shadow: 0 0 9px 3px rgba(232,149,106,0.70); }
          66%       { border-color: rgba(10,10,10,0.95);    box-shadow: 0 0 4px 1px rgba(205,127,50,0.30); }
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
            background: radial-gradient(circle at 30% 30%, #f0b080, #cd7f32 40%, #b87333 65%, #0a0a0a);
            box-shadow: 0 0 ${Math.round(gemSize * 0.8)}px ${Math.round(gemSize * 0.4)}px rgba(205,127,50,0.75);
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
        {/* Outer glow ring — copper + black depth */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.10),
            borderRadius: "50%",
            animation: `${uniqueId}-glow-pulse 2.8s ease-in-out infinite`,
            zIndex: 0,
          }}
        />

        {/* Rotating conic layer 1 — copper dominant, black accents */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.14),
            borderRadius: "50%",
            background: `conic-gradient(
              rgba(10,10,10,0.95)     0deg,
              rgba(205,127,50,0.90)   14deg,
              rgba(232,149,106,1.0)   30deg,
              rgba(205,127,50,0.95)   50deg,
              rgba(184,115,51,0.85)   72deg,
              rgba(26,8,0,0.85)       90deg,
              rgba(205,127,50,0.92)   108deg,
              rgba(232,149,106,1.0)   126deg,
              rgba(205,127,50,0.90)   148deg,
              rgba(184,115,51,0.80)   170deg,
              rgba(10,10,10,0.92)     188deg,
              rgba(205,127,50,0.92)   206deg,
              rgba(232,149,106,1.0)   224deg,
              rgba(205,127,50,0.90)   246deg,
              rgba(184,115,51,0.85)   268deg,
              rgba(26,8,0,0.85)       288deg,
              rgba(205,127,50,0.92)   306deg,
              rgba(232,149,106,1.0)   324deg,
              rgba(205,127,50,0.88)   346deg,
              rgba(10,10,10,0.95)     360deg
            )`,
            animation: `${uniqueId}-rotate 5s linear infinite`,
            filter: `blur(${Math.round(size * 0.055)}px)`,
            zIndex: 1,
          }}
        />

        {/* Counter-rotating shimmer layer 2 — lighter copper highlights */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.09),
            borderRadius: "50%",
            background: `conic-gradient(
              rgba(10,10,10,0.0)       0deg,
              rgba(232,149,106,0.60)   35deg,
              rgba(205,127,50,0.40)    70deg,
              rgba(232,149,106,0.70)   110deg,
              rgba(10,10,10,0.60)      145deg,
              rgba(205,127,50,0.50)    180deg,
              rgba(232,149,106,0.65)   215deg,
              rgba(205,127,50,0.40)    255deg,
              rgba(10,10,10,0.55)      295deg,
              rgba(232,149,106,0.60)   330deg,
              rgba(10,10,10,0.0)       360deg
            )`,
            animation: `${uniqueId}-rotate-rev 3.5s linear infinite`,
            filter: `blur(${Math.round(size * 0.03)}px)`,
            zIndex: 2,
          }}
        />

        {/* Inner ambient glow — copper halo */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.04),
            borderRadius: "50%",
            background: "radial-gradient(ellipse at 50% 50%, transparent 55%, rgba(205,127,50,0.30) 80%, transparent 100%)",
            animation: `${uniqueId}-inner-glow 2.8s ease-in-out infinite`,
            zIndex: 3,
            pointerEvents: "none",
          }}
        />

        {/* 8 ornamental diamond gems */}
        {gems.map((_, i) => (
          <div key={i} className={`${uniqueId}-gem-${i}`} />
        ))}

        {/* Copper + black alternating border ring */}
        <div
          style={{
            position: "absolute",
            inset: padding - 2,
            borderRadius: "50%",
            border: `${Math.max(2, Math.round(size * 0.04))}px solid rgba(205,127,50,0.92)`,
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
