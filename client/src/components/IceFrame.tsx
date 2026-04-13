import React from "react";

interface IceFrameProps {
  size: number;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * IceFrame — CSS-only animated ice/frost effect around a circular avatar.
 * Uses conic-gradient + box-shadow pulsing for GPU-accelerated 60fps animation.
 * No Canvas, no JS animation loop.
 */
export function IceFrame({ size, children, active = true, className = "" }: IceFrameProps) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  const padding = Math.round(size * 0.22);
  const outerSize = size + padding * 2;
  const uniqueId = `ice-${size}`;

  return (
    <>
      <style>{`
        @keyframes ice-rotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes ice-rotate-slow {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes ice-pulse {
          0%, 100% {
            box-shadow:
              0 0 6px 2px rgba(150,210,255,0.7),
              0 0 14px 5px rgba(100,180,255,0.45),
              0 0 26px 8px rgba(80,150,255,0.25);
          }
          50% {
            box-shadow:
              0 0 10px 4px rgba(180,230,255,0.85),
              0 0 20px 7px rgba(130,200,255,0.55),
              0 0 36px 12px rgba(100,170,255,0.3);
          }
        }
        @keyframes ice-border-shimmer {
          0%, 100% { border-color: rgba(150,210,255,0.85); box-shadow: 0 0 6px 1px rgba(150,210,255,0.5); }
          50%       { border-color: rgba(200,240,255,0.95); box-shadow: 0 0 10px 3px rgba(200,240,255,0.7); }
        }
        .${uniqueId}-glow {
          border-radius: 50%;
          animation: ice-pulse 2.2s ease-in-out infinite;
        }
        .${uniqueId}-conic1 {
          border-radius: 50%;
          background: conic-gradient(
            rgba(150,210,255,0) 0deg,
            rgba(200,240,255,0.8) 30deg,
            rgba(100,180,255,0.6) 60deg,
            rgba(220,245,255,0.9) 90deg,
            rgba(150,210,255,0.5) 120deg,
            rgba(200,235,255,0.8) 150deg,
            rgba(100,170,255,0.6) 180deg,
            rgba(210,240,255,0.9) 210deg,
            rgba(150,200,255,0.5) 240deg,
            rgba(190,230,255,0.8) 270deg,
            rgba(120,190,255,0.6) 300deg,
            rgba(200,240,255,0.85) 330deg,
            rgba(150,210,255,0) 360deg
          );
          animation: ice-rotate 8s linear infinite;
          filter: blur(${Math.round(size * 0.05)}px);
        }
        .${uniqueId}-conic2 {
          border-radius: 50%;
          background: conic-gradient(
            rgba(200,240,255,0) 0deg,
            rgba(150,220,255,0.5) 45deg,
            rgba(220,245,255,0.7) 90deg,
            rgba(100,180,255,0.4) 135deg,
            rgba(200,240,255,0.6) 180deg,
            rgba(150,210,255,0.5) 225deg,
            rgba(220,245,255,0.7) 270deg,
            rgba(100,180,255,0.4) 315deg,
            rgba(200,240,255,0) 360deg
          );
          animation: ice-rotate-slow 12s linear infinite;
          filter: blur(${Math.round(size * 0.03)}px);
        }
        .${uniqueId}-border {
          border-radius: 50%;
          border: 2.5px solid rgba(150,210,255,0.85);
          animation: ice-border-shimmer 2.2s ease-in-out infinite;
        }
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Outer glow */}
        <div
          className={`${uniqueId}-glow`}
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.08),
            zIndex: 0,
          }}
        />

        {/* Rotating ice conic layer 1 */}
        <div
          className={`${uniqueId}-conic1`}
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.12),
            zIndex: 1,
          }}
        />

        {/* Rotating ice conic layer 2 */}
        <div
          className={`${uniqueId}-conic2`}
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.08),
            zIndex: 2,
          }}
        />

        {/* Ice border ring */}
        <div
          className={`${uniqueId}-border`}
          style={{
            position: "absolute",
            inset: padding - 2,
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

export default IceFrame;
