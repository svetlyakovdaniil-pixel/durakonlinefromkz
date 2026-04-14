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
 * Effect: two orbital arcs rotate in opposite directions around the avatar
 * (magenta/purple clockwise + cyan counter-clockwise), plus an outer glow
 * that pulses between orange and purple.
 *
 * The orbital arcs live HERE (not in NeonPawAvatar) so they are always
 * rendered OUTSIDE the avatar circle and never overlap the avatar image.
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

  const uid = React.useId().replace(/:/g, '');
  const padding = Math.round(size * 0.22);
  const outerSize = size + padding * 2;
  const borderW = Math.max(2, Math.round(size * 0.05));
  const ringGap = Math.max(2, Math.round(size * 0.055));

  // Orbital arc sizing — slightly larger than the avatar+padding area
  const arcSize = size + padding * 1.6;
  const arcOffset = (outerSize - arcSize) / 2;
  const arcBorderW = Math.max(2, size * 0.04);

  return (
    <>
      <style>{`
        /* Outer glow pulse — orange ↔ purple */
        @keyframes zf-glow-${uid} {
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
        @keyframes zf-arc-cw-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        /* Inner ring — counter-clockwise, purple */
        @keyframes zf-arc-ccw-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        /* Outer ring flash — orange */
        @keyframes zf-ring-outer-${uid} {
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
        @keyframes zf-ring-inner-${uid} {
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
        /* Orbital arc 1 — clockwise, magenta */
        @keyframes zf-orbit-cw-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        /* Orbital arc 2 — counter-clockwise, cyan */
        @keyframes zf-orbit-ccw-${uid} {
          from { transform: rotate(180deg); }
          to   { transform: rotate(-180deg); }
        }
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* Outer glow pulse — zIndex 0, behind everything */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.08),
            borderRadius: "50%",
            animation: `zf-glow-${uid} 3s ease-in-out infinite`,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* Outer ring — orange, clockwise — zIndex 1 */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.10),
            borderRadius: "50%",
            border: `${borderW}px solid rgba(249,115,22,0.90)`,
            animation: `zf-arc-cw-${uid} 4s linear infinite, zf-ring-outer-${uid} 2.6s ease-in-out infinite`,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* Inner ring — purple, counter-clockwise — zIndex 2 */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.10) + ringGap,
            borderRadius: "50%",
            border: `${borderW}px solid rgba(168,85,247,0.85)`,
            animation: `zf-arc-ccw-${uid} 2.8s linear infinite, zf-ring-inner-${uid} 2.6s ease-in-out infinite 0.5s`,
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* Avatar content — zIndex 5, above rings */}
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

        {/* Orbital arc 1 — magenta, clockwise — zIndex 6, above avatar */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: arcOffset,
            left: arcOffset,
            width: arcSize,
            height: arcSize,
            borderRadius: "50%",
            border: `${arcBorderW}px solid transparent`,
            borderTop: `${arcBorderW}px solid rgba(210,0,255,0.9)`,
            borderRight: `${arcBorderW}px solid rgba(210,0,255,0.5)`,
            boxShadow: `0 0 ${size * 0.12}px rgba(210,0,255,0.7), 0 0 ${size * 0.22}px rgba(210,0,255,0.35)`,
            animation: `zf-orbit-cw-${uid} 3.2s linear infinite`,
            zIndex: 6,
            pointerEvents: "none",
          }}
        />

        {/* Orbital arc 2 — cyan, counter-clockwise — zIndex 6, above avatar */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            top: arcOffset,
            left: arcOffset,
            width: arcSize,
            height: arcSize,
            borderRadius: "50%",
            border: `${arcBorderW}px solid transparent`,
            borderBottom: `${arcBorderW}px solid rgba(0,200,255,0.9)`,
            borderLeft: `${arcBorderW}px solid rgba(0,200,255,0.45)`,
            boxShadow: `0 0 ${size * 0.1}px rgba(0,200,255,0.65), 0 0 ${size * 0.2}px rgba(0,200,255,0.3)`,
            animation: `zf-orbit-ccw-${uid} 2.4s linear infinite`,
            zIndex: 6,
            pointerEvents: "none",
          }}
        />
      </div>
    </>
  );
}

export default ZirconNeonFrame;
