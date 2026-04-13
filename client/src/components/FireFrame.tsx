import React from "react";

interface FireFrameProps {
  size: number;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * FireFrame — CSS-only animated fire effect around a circular avatar.
 * Uses conic-gradient rotation + box-shadow pulsing for GPU-accelerated 60fps animation.
 * No Canvas, no JS animation loop.
 */
export function FireFrame({ size, children, active = true, className = "" }: FireFrameProps) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  const padding = Math.round(size * 0.22);
  const outerSize = size + padding * 2;
  const uniqueId = `fire-${size}`;

  return (
    <>
      <style>{`
        @keyframes fire-rotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes fire-rotate-reverse {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes fire-pulse {
          0%, 100% {
            box-shadow:
              0 0 6px 2px rgba(255,100,0,0.7),
              0 0 14px 4px rgba(255,60,0,0.5),
              0 0 26px 8px rgba(200,30,0,0.3);
          }
          33% {
            box-shadow:
              0 0 8px 3px rgba(255,160,0,0.8),
              0 0 18px 6px rgba(255,80,0,0.6),
              0 0 32px 10px rgba(220,40,0,0.35);
          }
          66% {
            box-shadow:
              0 0 5px 2px rgba(255,50,0,0.75),
              0 0 12px 4px rgba(200,20,0,0.55),
              0 0 22px 7px rgba(150,10,0,0.3);
          }
        }
        @keyframes fire-ember-orbit {
          0%   { transform: rotate(0deg) translateX(var(--ember-r)) rotate(0deg); opacity: 0; }
          10%  { opacity: 1; }
          80%  { opacity: 0.8; }
          100% { transform: rotate(360deg) translateX(var(--ember-r)) rotate(-360deg); opacity: 0; }
        }
        @keyframes fire-ember-flicker {
          0%, 100% { transform: scale(1); opacity: 0.9; }
          50%       { transform: scale(0.5); opacity: 0.4; }
        }
        .${uniqueId}-ring {
          border-radius: 50%;
          animation: fire-pulse 1.4s ease-in-out infinite;
        }
        .${uniqueId}-conic1 {
          border-radius: 50%;
          background: conic-gradient(
            rgba(255,200,0,0.0) 0deg,
            rgba(255,120,0,0.9) 40deg,
            rgba(255,60,0,1.0) 80deg,
            rgba(200,20,0,0.8) 120deg,
            rgba(255,80,0,0.6) 160deg,
            rgba(255,180,0,0.9) 200deg,
            rgba(255,60,0,1.0) 240deg,
            rgba(180,10,0,0.7) 280deg,
            rgba(255,140,0,0.8) 320deg,
            rgba(255,200,0,0.0) 360deg
          );
          animation: fire-rotate 2.2s linear infinite;
          filter: blur(${Math.round(size * 0.055)}px);
        }
        .${uniqueId}-conic2 {
          border-radius: 50%;
          background: conic-gradient(
            rgba(255,80,0,0.0) 0deg,
            rgba(255,200,50,0.8) 60deg,
            rgba(255,100,0,0.9) 120deg,
            rgba(200,30,0,0.6) 180deg,
            rgba(255,160,0,0.85) 240deg,
            rgba(255,50,0,0.7) 300deg,
            rgba(255,80,0,0.0) 360deg
          );
          animation: fire-rotate-reverse 1.7s linear infinite;
          filter: blur(${Math.round(size * 0.04)}px);
        }
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Outer glow ring */}
        <div
          className={`${uniqueId}-ring`}
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.08),
            zIndex: 0,
          }}
        />

        {/* Rotating fire conic layer 1 */}
        <div
          className={`${uniqueId}-conic1`}
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.12),
            zIndex: 1,
          }}
        />

        {/* Rotating fire conic layer 2 (counter-rotate) */}
        <div
          className={`${uniqueId}-conic2`}
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.08),
            zIndex: 2,
          }}
        />

        {/* Mask to clip fire to ring shape — inner cutout */}
        <div
          style={{
            position: "absolute",
            inset: padding,
            borderRadius: "50%",
            background: "transparent",
            boxShadow: `0 0 0 ${outerSize}px transparent`,
            zIndex: 3,
          }}
        />

        {/* Golden border ring */}
        <div
          style={{
            position: "absolute",
            inset: padding - 2,
            borderRadius: "50%",
            border: "2.5px solid rgba(218,165,32,0.85)",
            boxShadow: "0 0 6px 1px rgba(255,200,50,0.4)",
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

export default FireFrame;
