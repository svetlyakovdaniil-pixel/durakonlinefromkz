import React from "react";

interface AmberNeonFrameProps {
  size: number;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * AmberNeonFrame — Solar Flare CSS-only animated frame.
 * Season: Неоновая эра (Season 7) | Rank: Янтарь (Amber)
 *
 * Effect: a warm golden/amber ring with a "solar flare" animation —
 * two arcs rotate in the same direction at different speeds,
 * creating a layered molten-gold look. The glow pulses between
 * deep amber and bright orange-gold.
 */
export function AmberNeonFrame({
  size,
  children,
  active = true,
  className = "",
}: AmberNeonFrameProps) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  const padding = Math.round(size * 0.22);
  const outerSize = size + padding * 2;
  const uid = `amber-neon-${size}`;
  const borderW = Math.max(2, Math.round(size * 0.05));
  const ringGap = Math.max(2, Math.round(size * 0.055));

  return (
    <>
      <style>{`
        /* Outer glow pulse — amber ↔ orange-gold */
        @keyframes ${uid}-glow {
          0%, 100% {
            box-shadow:
              0 0 ${size * 0.12}px ${size * 0.04}px rgba(245,158,11,0.65),
              0 0 ${size * 0.28}px ${size * 0.08}px rgba(251,146,60,0.35),
              0 0 ${size * 0.50}px ${size * 0.14}px rgba(180,80,0,0.18);
          }
          50% {
            box-shadow:
              0 0 ${size * 0.16}px ${size * 0.06}px rgba(255,200,50,0.80),
              0 0 ${size * 0.36}px ${size * 0.12}px rgba(255,140,0,0.50),
              0 0 ${size * 0.60}px ${size * 0.18}px rgba(200,80,0,0.25);
          }
        }
        /* Outer ring — clockwise, amber */
        @keyframes ${uid}-arc-outer {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        /* Inner ring — clockwise faster, orange */
        @keyframes ${uid}-arc-inner {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        /* Ring border flash — amber charge */
        @keyframes ${uid}-ring-flash {
          0%, 100% {
            border-color: rgba(245,158,11,0.90);
            box-shadow:
              0 0 ${borderW * 2}px ${borderW * 0.5}px rgba(245,158,11,0.70),
              inset 0 0 ${borderW}px rgba(245,158,11,0.25);
          }
          40% {
            border-color: rgba(255,210,80,1.00);
            box-shadow:
              0 0 ${borderW * 5}px ${borderW * 1.5}px rgba(255,210,80,0.95),
              inset 0 0 ${borderW * 2}px rgba(255,210,80,0.45);
          }
          70% {
            border-color: rgba(251,146,60,0.85);
            box-shadow:
              0 0 ${borderW * 3}px ${borderW * 0.8}px rgba(251,146,60,0.75),
              inset 0 0 ${borderW * 1.2}px rgba(251,146,60,0.30);
          }
        }
        /* Inner ring border flash — orange */
        @keyframes ${uid}-ring-inner {
          0%, 100% {
            border-color: rgba(251,146,60,0.80);
            box-shadow:
              0 0 ${borderW * 1.5}px ${borderW * 0.4}px rgba(251,146,60,0.60),
              inset 0 0 ${borderW * 0.8}px rgba(251,146,60,0.20);
          }
          35% {
            border-color: rgba(255,180,50,1.00);
            box-shadow:
              0 0 ${borderW * 4}px ${borderW * 1.2}px rgba(255,180,50,0.90),
              inset 0 0 ${borderW * 1.8}px rgba(255,180,50,0.40);
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
            animation: `${uid}-glow 2.8s ease-in-out infinite`,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* Outer ring — amber, clockwise slow */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.10),
            borderRadius: "50%",
            border: `${borderW}px solid rgba(245,158,11,0.90)`,
            animation: `${uid}-arc-outer 5s linear infinite, ${uid}-ring-flash 2.4s ease-in-out infinite`,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* Inner ring — orange, clockwise fast */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.10) + ringGap,
            borderRadius: "50%",
            border: `${borderW}px solid rgba(251,146,60,0.80)`,
            animation: `${uid}-arc-inner 2.8s linear infinite, ${uid}-ring-inner 2.4s ease-in-out infinite 0.6s`,
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

export default AmberNeonFrame;
