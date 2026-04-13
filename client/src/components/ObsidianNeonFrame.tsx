import React from "react";

interface ObsidianNeonFrameProps {
  size: number;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * ObsidianNeonFrame — Dual Orbit CSS-only animated frame.
 * Season: Неоновая эра (Season 7) | Rank: Обсидиан
 *
 * Two rings orbit in opposite directions:
 *   - Outer ring: cyan (#00d4ff), slower, clockwise
 *   - Inner ring: deep blue (#0055ff), faster, counter-clockwise
 *
 * Each ring is a solid border arc (dashed with large gap) so it looks like
 * a moving arc rather than a full circle. The arcs overlap and create a
 * sense of depth and rotation.
 *
 * Additionally a subtle outer glow pulses between cyan and blue.
 */
export function ObsidianNeonFrame({
  size,
  children,
  active = true,
  className = "",
}: ObsidianNeonFrameProps) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  const padding = Math.round(size * 0.22);
  const outerSize = size + padding * 2;
  const uid = `obs-neon-${size}`;

  // Ring border thickness scales with size
  const borderW = Math.max(2, Math.round(size * 0.045));
  // Gap between outer ring and inner ring
  const ringGap = Math.max(2, Math.round(size * 0.06));

  return (
    <>
      <style>{`
        /* Outer ring — clockwise, cyan */
        @keyframes ${uid}-orbit-cw {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        /* Inner ring — counter-clockwise, blue */
        @keyframes ${uid}-orbit-ccw {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        /* Outer glow pulse — cyan ↔ blue */
        @keyframes ${uid}-glow {
          0%, 100% {
            box-shadow:
              0 0 ${size * 0.12}px ${size * 0.04}px rgba(0,212,255,0.60),
              0 0 ${size * 0.28}px ${size * 0.08}px rgba(0,150,255,0.35),
              0 0 ${size * 0.50}px ${size * 0.14}px rgba(0,80,220,0.18);
          }
          50% {
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.05}px rgba(0,80,255,0.65),
              0 0 ${size * 0.32}px ${size * 0.10}px rgba(0,40,200,0.40),
              0 0 ${size * 0.55}px ${size * 0.16}px rgba(0,20,180,0.20);
          }
        }
        /* Outer ring border flash — cyan */
        @keyframes ${uid}-ring-outer {
          0%, 100% {
            border-color: rgba(0,212,255,0.90);
            box-shadow:
              0 0 ${borderW * 2}px ${borderW * 0.5}px rgba(0,212,255,0.70),
              inset 0 0 ${borderW}px rgba(0,212,255,0.25);
          }
          40% {
            border-color: rgba(180,240,255,1.00);
            box-shadow:
              0 0 ${borderW * 4}px ${borderW * 1.2}px rgba(180,240,255,0.90),
              inset 0 0 ${borderW * 1.5}px rgba(180,240,255,0.40);
          }
          80% {
            border-color: rgba(0,160,255,0.80);
            box-shadow:
              0 0 ${borderW * 1.5}px ${borderW * 0.3}px rgba(0,160,255,0.55),
              inset 0 0 ${borderW * 0.8}px rgba(0,160,255,0.20);
          }
        }
        /* Inner ring border flash — deep blue */
        @keyframes ${uid}-ring-inner {
          0%, 100% {
            border-color: rgba(0,80,255,0.85);
            box-shadow:
              0 0 ${borderW * 2}px ${borderW * 0.5}px rgba(0,80,255,0.65),
              inset 0 0 ${borderW}px rgba(0,80,255,0.22);
          }
          35% {
            border-color: rgba(80,140,255,1.00);
            box-shadow:
              0 0 ${borderW * 4}px ${borderW * 1.2}px rgba(80,140,255,0.88),
              inset 0 0 ${borderW * 1.5}px rgba(80,140,255,0.38);
          }
          75% {
            border-color: rgba(0,50,200,0.75);
            box-shadow:
              0 0 ${borderW * 1.5}px ${borderW * 0.3}px rgba(0,50,200,0.50),
              inset 0 0 ${borderW * 0.8}px rgba(0,50,200,0.18);
          }
        }
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Outer glow pulse */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.08),
            borderRadius: "50%",
            animation: `${uid}-glow 3s ease-in-out infinite`,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* Outer orbit ring — cyan, clockwise, slower */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.10),
            borderRadius: "50%",
            border: `${borderW}px solid rgba(0,212,255,0.90)`,
            animation: `${uid}-orbit-cw 4s linear infinite, ${uid}-ring-outer 2.8s ease-in-out infinite`,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* Inner orbit ring — deep blue, counter-clockwise, faster */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.10) + ringGap,
            borderRadius: "50%",
            border: `${borderW}px solid rgba(0,80,255,0.85)`,
            animation: `${uid}-orbit-ccw 2.5s linear infinite, ${uid}-ring-inner 2.8s ease-in-out infinite 0.4s`,
            zIndex: 2,
            pointerEvents: "none",
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

export default ObsidianNeonFrame;
