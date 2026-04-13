import React from "react";

interface PremiumFrameProps {
  size: number;
  active?: boolean;
  children: React.ReactNode;
  className?: string;
}

/**
 * PremiumFrame — CSS-only animated gold/premium effect around a circular avatar.
 * Uses conic-gradient rotation + box-shadow pulsing + falling coin pseudo-elements.
 * No Canvas, no JS animation loop. GPU-accelerated 60fps.
 */
export function PremiumFrame({ size, children, active = true, className = "" }: PremiumFrameProps) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  const padding = Math.round(size * 0.22);
  const outerSize = size + padding * 2;
  const uniqueId = `premium-${size}`;

  // Generate coin positions for CSS pseudo-elements
  const coins = [
    { delay: "0s",    dur: "2.4s", left: "18%",  size: "6px" },
    { delay: "0.3s",  dur: "2.8s", left: "35%",  size: "5px" },
    { delay: "0.7s",  dur: "2.2s", left: "55%",  size: "7px" },
    { delay: "1.1s",  dur: "3.0s", left: "72%",  size: "5px" },
    { delay: "1.5s",  dur: "2.6s", left: "85%",  size: "6px" },
    { delay: "0.5s",  dur: "2.9s", left: "10%",  size: "5px" },
    { delay: "1.8s",  dur: "2.3s", left: "45%",  size: "6px" },
    { delay: "2.1s",  dur: "2.7s", left: "62%",  size: "5px" },
  ];

  return (
    <>
      <style>{`
        @keyframes ${uniqueId}-rotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ${uniqueId}-rotate-reverse {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes ${uniqueId}-glow-pulse {
          0%, 100% {
            box-shadow:
              0 0 8px 3px rgba(218,165,32,0.7),
              0 0 18px 6px rgba(255,200,50,0.45),
              0 0 32px 10px rgba(200,150,20,0.25);
          }
          50% {
            box-shadow:
              0 0 12px 5px rgba(255,215,80,0.85),
              0 0 26px 9px rgba(255,200,50,0.6),
              0 0 44px 14px rgba(218,165,32,0.35);
          }
        }
        @keyframes ${uniqueId}-border-shimmer {
          0%, 100% { border-color: rgba(218,165,32,0.9); box-shadow: 0 0 6px 1px rgba(218,165,32,0.6); }
          25%       { border-color: rgba(255,240,100,0.95); box-shadow: 0 0 10px 3px rgba(255,240,100,0.75); }
          50%       { border-color: rgba(255,215,80,0.9); box-shadow: 0 0 8px 2px rgba(255,215,80,0.65); }
          75%       { border-color: rgba(240,200,60,0.95); box-shadow: 0 0 10px 3px rgba(240,200,60,0.75); }
        }
        @keyframes ${uniqueId}-coin-fall {
          0%   { transform: translateY(-8px) rotate(0deg) scaleX(1); opacity: 0; }
          10%  { opacity: 1; }
          40%  { transform: translateY(30%) rotate(180deg) scaleX(0.3); }
          60%  { transform: translateY(55%) rotate(300deg) scaleX(0.9); }
          80%  { transform: translateY(75%) rotate(420deg) scaleX(0.4); opacity: 0.8; }
          100% { transform: translateY(100%) rotate(540deg) scaleX(1); opacity: 0; }
        }
        ${coins.map((c, i) => `
          .${uniqueId}-coin-${i} {
            position: absolute;
            top: 0;
            left: ${c.left};
            width: ${c.size};
            height: ${c.size};
            border-radius: 50%;
            background: radial-gradient(circle at 35% 35%, #fff9a0, #ffd700 40%, #b8860b 80%, #8b6914);
            box-shadow: 0 0 3px 1px rgba(255,215,0,0.6);
            animation: ${uniqueId}-coin-fall ${c.dur} ${c.delay} ease-in infinite;
            z-index: 3;
            pointer-events: none;
          }
        `).join("")}
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Outer golden glow */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.08),
            borderRadius: "50%",
            animation: `${uniqueId}-glow-pulse 2.4s ease-in-out infinite`,
            zIndex: 0,
          }}
        />

        {/* Rotating golden conic layer 1 */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.12),
            borderRadius: "50%",
            background: `conic-gradient(
              rgba(218,165,32,0) 0deg,
              rgba(255,240,100,0.9) 30deg,
              rgba(218,165,32,0.7) 60deg,
              rgba(255,215,80,0.85) 90deg,
              rgba(180,130,20,0.5) 130deg,
              rgba(255,240,100,0.9) 170deg,
              rgba(218,165,32,0.7) 210deg,
              rgba(255,215,80,0.85) 250deg,
              rgba(180,130,20,0.5) 290deg,
              rgba(255,240,100,0.9) 330deg,
              rgba(218,165,32,0) 360deg
            )`,
            animation: `${uniqueId}-rotate 4s linear infinite`,
            filter: `blur(${Math.round(size * 0.05)}px)`,
            zIndex: 1,
          }}
        />

        {/* Rotating golden conic layer 2 — counter-rotate for sparkle */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.08),
            borderRadius: "50%",
            background: `conic-gradient(
              rgba(255,240,100,0) 0deg,
              rgba(255,215,80,0.6) 45deg,
              rgba(218,165,32,0.4) 90deg,
              rgba(255,240,100,0.7) 135deg,
              rgba(180,130,20,0.3) 180deg,
              rgba(255,215,80,0.6) 225deg,
              rgba(218,165,32,0.4) 270deg,
              rgba(255,240,100,0.7) 315deg,
              rgba(255,240,100,0) 360deg
            )`,
            animation: `${uniqueId}-rotate-reverse 3s linear infinite`,
            filter: `blur(${Math.round(size * 0.03)}px)`,
            zIndex: 2,
          }}
        />

        {/* Falling coins */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.05),
            borderRadius: "50%",
            overflow: "hidden",
            zIndex: 3,
            pointerEvents: "none",
          }}
        >
          {coins.map((_, i) => (
            <div key={i} className={`${uniqueId}-coin-${i}`} />
          ))}
        </div>

        {/* Gold border ring */}
        <div
          style={{
            position: "absolute",
            inset: padding - 2,
            borderRadius: "50%",
            border: "2.5px solid rgba(218,165,32,0.9)",
            animation: `${uniqueId}-border-shimmer 2.4s ease-in-out infinite`,
            zIndex: 4,
          }}
        />

        {/* Avatar content */}
        <div
          style={{
            position: "absolute",
            inset: padding,
            borderRadius: "50%",
            overflow: "hidden",
            zIndex: 5,
          }}
        >
          {children}
        </div>
      </div>
    </>
  );
}

export default PremiumFrame;
