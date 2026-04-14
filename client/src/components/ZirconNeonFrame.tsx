import React from "react";

interface ZirconNeonFrameProps {
  size: number;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * ZirconNeonFrame — Comet Trail CSS-only animated frame.
 * Season: Неоновая эра (Season 7) | Rank: Циркон (Zircon)
 *
 * Effect: a vibrant orange ring with a counter-rotating purple arc —
 * like a comet trailing sparks. The orange outer ring rotates clockwise
 * while the purple inner arc spins counter-clockwise, creating a
 * dynamic "crossing orbits" effect. Glow pulses between orange and purple.
 */
export function ZirconNeonFrame({
  size,
  children,
  active = true,
  className = "",
}: ZirconNeonFrameProps) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  const padding = Math.round(size * 0.22);
  const outerSize = size + padding * 2;
  const uid = `zircon-neon-${size}`;
  const borderW = Math.max(2, Math.round(size * 0.05));
  const ringGap = Math.max(2, Math.round(size * 0.055));

  return (
    <>
      <style>{`
        /* Outer glow pulse — orange ↔ purple */
        @keyframes ${uid}-glow {
          0%, 100% {
            box-shadow:
              0 0 ${size * 0.12}px ${size * 0.04}px rgba(249,115,22,0.65),
              0 0 ${size * 0.28}px ${size * 0.08}px rgba(168,85,247,0.30),
              0 0 ${size * 0.50}px ${size * 0.14}px rgba(120,40,180,0.15);
          }
          50% {
            box-shadow:
              0 0 ${size * 0.16}px ${size * 0.06}px rgba(168,85,247,0.75),
              0 0 ${size * 0.36}px ${size * 0.12}px rgba(249,115,22,0.40),
              0 0 ${size * 0.60}px ${size * 0.18}px rgba(200,60,255,0.22);
          }
        }
        /* Outer ring — clockwise, orange */
        @keyframes ${uid}-arc-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        /* Inner ring — counter-clockwise, purple */
        @keyframes ${uid}-arc-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        /* Outer ring flash — orange */
        @keyframes ${uid}-ring-outer {
          0%, 100% {
            border-color: rgba(249,115,22,0.90);
            box-shadow:
              0 0 ${borderW * 2}px ${borderW * 0.5}px rgba(249,115,22,0.70),
              inset 0 0 ${borderW}px rgba(249,115,22,0.25);
          }
          45% {
            border-color: rgba(255,180,80,1.00);
            box-shadow:
              0 0 ${borderW * 5}px ${borderW * 1.5}px rgba(255,180,80,0.95),
              inset 0 0 ${borderW * 2}px rgba(255,180,80,0.45);
          }
        }
        /* Inner ring flash — purple */
        @keyframes ${uid}-ring-inner {
          0%, 100% {
            border-color: rgba(168,85,247,0.85);
            box-shadow:
              0 0 ${borderW * 2}px ${borderW * 0.5}px rgba(168,85,247,0.65),
              inset 0 0 ${borderW}px rgba(168,85,247,0.22);
          }
          35% {
            border-color: rgba(210,140,255,1.00);
            box-shadow:
              0 0 ${borderW * 4}px ${borderW * 1.2}px rgba(210,140,255,0.88),
              inset 0 0 ${borderW * 1.5}px rgba(210,140,255,0.38);
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

        {/* Outer ring — orange, clockwise */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.10),
            borderRadius: "50%",
            border: `${borderW}px solid rgba(249,115,22,0.90)`,
            animation: `${uid}-arc-cw 4s linear infinite, ${uid}-ring-outer 2.6s ease-in-out infinite`,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* Inner ring — purple, counter-clockwise */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.10) + ringGap,
            borderRadius: "50%",
            border: `${borderW}px solid rgba(168,85,247,0.85)`,
            animation: `${uid}-arc-ccw 2.8s linear infinite, ${uid}-ring-inner 2.6s ease-in-out infinite 0.5s`,
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

export default ZirconNeonFrame;
