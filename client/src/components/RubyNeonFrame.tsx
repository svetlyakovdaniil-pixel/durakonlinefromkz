import React from "react";

interface RubyNeonFrameProps {
  size: number;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * RubyNeonFrame — Scan Pulse CSS-only animated frame.
 * Season: Неоновая эра (Season 7) | Rank: Рубин (Ruby)
 *
 * Effect: a bright crimson/pink ring pulses with a "charging" animation —
 * the border flashes from deep red → hot pink → white-pink → back,
 * like a neon tube powering up. A rotating dashed arc overlays the ring
 * for extra dynamism.
 */
export function RubyNeonFrame({
  size,
  children,
  active = true,
  className = "",
}: RubyNeonFrameProps) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  const padding = Math.round(size * 0.22);
  const outerSize = size + padding * 2;
  const uid = `ruby-neon-${size}`;
  const borderW = Math.max(2, Math.round(size * 0.05));

  return (
    <>
      <style>{`
        /* Outer glow pulse — crimson ↔ hot pink */
        @keyframes ${uid}-glow {
          0%, 100% {
            box-shadow:
              0 0 ${size * 0.12}px ${size * 0.04}px rgba(220,0,60,0.65),
              0 0 ${size * 0.28}px ${size * 0.08}px rgba(255,0,100,0.35),
              0 0 ${size * 0.50}px ${size * 0.14}px rgba(180,0,80,0.18);
          }
          50% {
            box-shadow:
              0 0 ${size * 0.16}px ${size * 0.06}px rgba(255,60,140,0.80),
              0 0 ${size * 0.36}px ${size * 0.12}px rgba(255,0,120,0.50),
              0 0 ${size * 0.60}px ${size * 0.18}px rgba(200,0,100,0.25);
          }
        }
        /* Main ring — crimson charge flash */
        @keyframes ${uid}-ring {
          0%   {
            border-color: rgba(220,0,60,0.90);
            box-shadow:
              0 0 ${borderW * 2}px ${borderW * 0.5}px rgba(220,0,60,0.70),
              inset 0 0 ${borderW}px rgba(220,0,60,0.25);
          }
          30%  {
            border-color: rgba(255,80,160,1.00);
            box-shadow:
              0 0 ${borderW * 5}px ${borderW * 1.5}px rgba(255,80,160,0.95),
              inset 0 0 ${borderW * 2}px rgba(255,80,160,0.45);
          }
          60%  {
            border-color: rgba(255,200,220,1.00);
            box-shadow:
              0 0 ${borderW * 7}px ${borderW * 2}px rgba(255,200,220,0.90),
              inset 0 0 ${borderW * 2.5}px rgba(255,200,220,0.50);
          }
          100% {
            border-color: rgba(220,0,60,0.90);
            box-shadow:
              0 0 ${borderW * 2}px ${borderW * 0.5}px rgba(220,0,60,0.70),
              inset 0 0 ${borderW}px rgba(220,0,60,0.25);
          }
        }
        /* Rotating dashed arc — hot pink */
        @keyframes ${uid}-arc {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
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
            animation: `${uid}-glow 2.2s ease-in-out infinite`,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* Main ring — crimson charge */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.10),
            borderRadius: "50%",
            border: `${borderW}px solid rgba(220,0,60,0.90)`,
            animation: `${uid}-ring 1.8s ease-in-out infinite`,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* Rotating dashed arc — hot pink */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.10) + Math.round(size * 0.03),
            borderRadius: "50%",
            border: `${Math.max(1, Math.round(borderW * 0.7))}px dashed rgba(255,80,160,0.75)`,
            animation: `${uid}-arc 3.5s linear infinite`,
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

export default RubyNeonFrame;
