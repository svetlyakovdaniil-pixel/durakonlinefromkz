import React from "react";

interface LightningFrameProps {
  size: number;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * LightningFrame — CSS-only animated lightning effect around a circular avatar.
 * Uses conic-gradient rotation + rapid box-shadow flicker for GPU-accelerated 60fps animation.
 * No Canvas, no JS animation loop.
 */
export function LightningFrame({ size, children, active = true, className = "" }: LightningFrameProps) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  const padding = Math.round(size * 0.22);
  const outerSize = size + padding * 2;
  const uniqueId = `lightning-${size}`;

  return (
    <>
      <style>{`
        @keyframes ${uniqueId}-rotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ${uniqueId}-rotate-fast {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes ${uniqueId}-flicker {
          0%   {
            box-shadow:
              0 0 6px 2px rgba(180,180,255,0.6),
              0 0 14px 4px rgba(120,120,255,0.4),
              0 0 26px 8px rgba(80,80,200,0.2);
          }
          8%   {
            box-shadow:
              0 0 12px 5px rgba(255,255,255,0.95),
              0 0 24px 8px rgba(200,200,255,0.8),
              0 0 40px 14px rgba(150,150,255,0.5);
          }
          12%  {
            box-shadow:
              0 0 4px 1px rgba(150,150,255,0.5),
              0 0 10px 3px rgba(100,100,200,0.3),
              0 0 18px 5px rgba(60,60,180,0.15);
          }
          20%  {
            box-shadow:
              0 0 10px 4px rgba(220,220,255,0.85),
              0 0 20px 7px rgba(180,180,255,0.6),
              0 0 34px 11px rgba(120,120,255,0.35);
          }
          25%  {
            box-shadow:
              0 0 5px 2px rgba(160,160,255,0.55),
              0 0 12px 4px rgba(110,110,220,0.35),
              0 0 20px 6px rgba(70,70,200,0.18);
          }
          55%  {
            box-shadow:
              0 0 14px 6px rgba(255,255,255,0.9),
              0 0 28px 10px rgba(210,210,255,0.7),
              0 0 44px 15px rgba(160,160,255,0.45);
          }
          60%  {
            box-shadow:
              0 0 5px 2px rgba(150,150,255,0.5),
              0 0 11px 3px rgba(100,100,210,0.3),
              0 0 19px 5px rgba(60,60,180,0.15);
          }
          80%  {
            box-shadow:
              0 0 8px 3px rgba(200,200,255,0.7),
              0 0 18px 6px rgba(150,150,255,0.5),
              0 0 30px 10px rgba(100,100,220,0.28);
          }
          100% {
            box-shadow:
              0 0 6px 2px rgba(180,180,255,0.6),
              0 0 14px 4px rgba(120,120,255,0.4),
              0 0 26px 8px rgba(80,80,200,0.2);
          }
        }
        @keyframes ${uniqueId}-border-flash {
          0%, 100% { border-color: rgba(160,160,255,0.8); box-shadow: 0 0 5px 1px rgba(160,160,255,0.5); }
          8%        { border-color: rgba(255,255,255,0.98); box-shadow: 0 0 12px 3px rgba(255,255,255,0.9); }
          12%       { border-color: rgba(140,140,255,0.7); box-shadow: 0 0 4px 1px rgba(140,140,255,0.4); }
          55%       { border-color: rgba(255,255,255,0.95); box-shadow: 0 0 14px 4px rgba(255,255,255,0.85); }
          60%       { border-color: rgba(140,140,255,0.7); box-shadow: 0 0 4px 1px rgba(140,140,255,0.4); }
        }
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Outer glow / flicker */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.08),
            borderRadius: "50%",
            animation: `${uniqueId}-flicker 1.8s ease-in-out infinite`,
            zIndex: 0,
          }}
        />

        {/* Rotating lightning conic layer 1 */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.12),
            borderRadius: "50%",
            background: `conic-gradient(
              rgba(180,180,255,0) 0deg,
              rgba(255,255,255,0.9) 20deg,
              rgba(180,180,255,0.7) 40deg,
              rgba(100,100,220,0.4) 80deg,
              rgba(255,255,255,0.85) 120deg,
              rgba(160,160,255,0.6) 160deg,
              rgba(80,80,200,0.3) 200deg,
              rgba(255,255,255,0.9) 240deg,
              rgba(180,180,255,0.7) 280deg,
              rgba(100,100,220,0.4) 320deg,
              rgba(180,180,255,0) 360deg
            )`,
            animation: `${uniqueId}-rotate 1.2s linear infinite`,
            filter: `blur(${Math.round(size * 0.045)}px)`,
            zIndex: 1,
          }}
        />

        {/* Rotating lightning conic layer 2 */}
        <div
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.08),
            borderRadius: "50%",
            background: `conic-gradient(
              rgba(255,255,255,0) 0deg,
              rgba(200,200,255,0.6) 60deg,
              rgba(255,255,255,0.8) 120deg,
              rgba(150,150,255,0.5) 180deg,
              rgba(255,255,255,0.7) 240deg,
              rgba(180,180,255,0.5) 300deg,
              rgba(255,255,255,0) 360deg
            )`,
            animation: `${uniqueId}-rotate-fast 0.8s linear infinite`,
            filter: `blur(${Math.round(size * 0.03)}px)`,
            zIndex: 2,
          }}
        />

        {/* Lightning border ring */}
        <div
          style={{
            position: "absolute",
            inset: padding - 2,
            borderRadius: "50%",
            border: "2.5px solid rgba(160,160,255,0.85)",
            animation: `${uniqueId}-border-flash 1.8s ease-in-out infinite`,
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

export default LightningFrame;
