import React from "react";

interface NeonFrameProps {
  size: number;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * NeonFrame — CSS-only animated neon glow effect around a circular avatar.
 * Uses conic-gradient rotation + box-shadow color cycling for GPU-accelerated 60fps animation.
 * No Canvas, no JS animation loop.
 */
export function NeonFrame({ size, children, active = true, className = "" }: NeonFrameProps) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  const padding = Math.round(size * 0.22);
  const outerSize = size + padding * 2;
  const uniqueId = `neon-${size}`;

  return (
    <>
      <style>{`
        @keyframes neon-rotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes neon-rotate-reverse {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes neon-glow-cycle {
          0% {
            box-shadow:
              0 0 6px 2px rgba(0,255,255,0.8),
              0 0 14px 4px rgba(0,255,255,0.5),
              0 0 28px 8px rgba(0,200,255,0.3);
          }
          33% {
            box-shadow:
              0 0 6px 2px rgba(255,0,255,0.8),
              0 0 14px 4px rgba(255,0,255,0.5),
              0 0 28px 8px rgba(200,0,255,0.3);
          }
          66% {
            box-shadow:
              0 0 6px 2px rgba(100,100,255,0.8),
              0 0 14px 4px rgba(100,100,255,0.5),
              0 0 28px 8px rgba(50,50,255,0.3);
          }
          100% {
            box-shadow:
              0 0 6px 2px rgba(0,255,255,0.8),
              0 0 14px 4px rgba(0,255,255,0.5),
              0 0 28px 8px rgba(0,200,255,0.3);
          }
        }
        @keyframes neon-border-cycle {
          0%   { border-color: rgba(0,255,255,0.95); box-shadow: 0 0 8px 2px rgba(0,255,255,0.7), inset 0 0 4px rgba(0,255,255,0.2); }
          33%  { border-color: rgba(255,0,255,0.95); box-shadow: 0 0 8px 2px rgba(255,0,255,0.7), inset 0 0 4px rgba(255,0,255,0.2); }
          66%  { border-color: rgba(100,100,255,0.95); box-shadow: 0 0 8px 2px rgba(100,100,255,0.7), inset 0 0 4px rgba(100,100,255,0.2); }
          100% { border-color: rgba(0,255,255,0.95); box-shadow: 0 0 8px 2px rgba(0,255,255,0.7), inset 0 0 4px rgba(0,255,255,0.2); }
        }
        .${uniqueId}-glow {
          border-radius: 50%;
          animation: neon-glow-cycle 2.4s linear infinite;
        }
        .${uniqueId}-conic1 {
          border-radius: 50%;
          background: conic-gradient(
            rgba(0,255,255,0) 0deg,
            rgba(0,255,255,0.8) 60deg,
            rgba(255,0,255,0.9) 120deg,
            rgba(100,100,255,0.7) 180deg,
            rgba(0,255,255,0.8) 240deg,
            rgba(255,0,255,0.6) 300deg,
            rgba(0,255,255,0) 360deg
          );
          animation: neon-rotate 3s linear infinite;
          filter: blur(${Math.round(size * 0.05)}px);
        }
        .${uniqueId}-conic2 {
          border-radius: 50%;
          background: conic-gradient(
            rgba(255,0,255,0) 0deg,
            rgba(100,100,255,0.7) 90deg,
            rgba(0,255,255,0.8) 180deg,
            rgba(255,0,255,0.6) 270deg,
            rgba(255,0,255,0) 360deg
          );
          animation: neon-rotate-reverse 2s linear infinite;
          filter: blur(${Math.round(size * 0.035)}px);
        }
        .${uniqueId}-border {
          border-radius: 50%;
          border: 2.5px solid rgba(0,255,255,0.95);
          animation: neon-border-cycle 2.4s linear infinite;
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

        {/* Rotating conic layer 1 */}
        <div
          className={`${uniqueId}-conic1`}
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.12),
            zIndex: 1,
          }}
        />

        {/* Rotating conic layer 2 */}
        <div
          className={`${uniqueId}-conic2`}
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.08),
            zIndex: 2,
          }}
        />

        {/* Neon border ring */}
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

export default NeonFrame;
