import React from "react";

interface OniJapaneseFrameProps {
  size: number;
  children: React.ReactNode;
  active?: boolean;
  className?: string;
}

/**
 * OniJapaneseFrame — Japanese Oni-style animated frame.
 * Season: Японские мотивы (Season 9) | Rank: Обсидиан
 *
 * Design:
 *  - Outer ring: deep black with golden-red rotating kanji/ornament dashes
 *  - Inner ring: pulsing crimson glow
 *  - 4 corner "oni horn" SVG ornaments that pulse
 *  - Hell-fire ambient glow (red-gold)
 *  - Rotating outer arc segments (like broken torii gate rings)
 */
export function OniJapaneseFrame({
  size,
  children,
  active = true,
  className = "",
}: OniJapaneseFrameProps) {
  if (!active) {
    return <div className={className}>{children}</div>;
  }

  const padding = Math.round(size * 0.26);
  const outerSize = size + padding * 2;
  const uid = `oni-jp-${size}`;
  const borderW = Math.max(2, Math.round(size * 0.05));
  const ringGap = Math.max(2, Math.round(size * 0.055));

  // Ornament size (the 4 corner horns)
  const ornSize = Math.round(size * 0.28);

  return (
    <>
      <style>{`
        /* ── Outer ring: slow clockwise rotation ── */
        @keyframes ${uid}-cw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        /* ── Inner ring: fast counter-clockwise ── */
        @keyframes ${uid}-ccw {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        /* ── Hell glow pulse: deep red ↔ gold ── */
        @keyframes ${uid}-glow {
          0%, 100% {
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.05}px rgba(180,0,0,0.70),
              0 0 ${size * 0.30}px ${size * 0.10}px rgba(120,0,0,0.45),
              0 0 ${size * 0.55}px ${size * 0.18}px rgba(60,0,0,0.22);
          }
          50% {
            box-shadow:
              0 0 ${size * 0.16}px ${size * 0.06}px rgba(212,140,0,0.65),
              0 0 ${size * 0.34}px ${size * 0.12}px rgba(160,60,0,0.40),
              0 0 ${size * 0.60}px ${size * 0.20}px rgba(80,10,0,0.20);
          }
        }
        /* ── Outer ring flash: dark red ↔ gold ── */
        @keyframes ${uid}-outer {
          0%, 100% {
            border-color: rgba(180,20,0,0.90);
            box-shadow:
              0 0 ${borderW * 2.5}px ${borderW * 0.6}px rgba(180,20,0,0.75),
              inset 0 0 ${borderW}px rgba(180,20,0,0.30);
          }
          45% {
            border-color: rgba(212,160,0,1.00);
            box-shadow:
              0 0 ${borderW * 5}px ${borderW * 1.5}px rgba(212,160,0,0.90),
              inset 0 0 ${borderW * 1.5}px rgba(212,160,0,0.40);
          }
          80% {
            border-color: rgba(140,10,0,0.80);
            box-shadow:
              0 0 ${borderW * 1.5}px ${borderW * 0.3}px rgba(140,10,0,0.55),
              inset 0 0 ${borderW * 0.8}px rgba(140,10,0,0.20);
          }
        }
        /* ── Inner ring flash: crimson ── */
        @keyframes ${uid}-inner {
          0%, 100% {
            border-color: rgba(200,0,0,0.85);
            box-shadow:
              0 0 ${borderW * 2}px ${borderW * 0.5}px rgba(200,0,0,0.65),
              inset 0 0 ${borderW}px rgba(200,0,0,0.22);
          }
          40% {
            border-color: rgba(255,60,0,1.00);
            box-shadow:
              0 0 ${borderW * 4}px ${borderW * 1.2}px rgba(255,60,0,0.88),
              inset 0 0 ${borderW * 1.5}px rgba(255,60,0,0.38);
          }
          75% {
            border-color: rgba(150,0,0,0.75);
            box-shadow:
              0 0 ${borderW * 1.5}px ${borderW * 0.3}px rgba(150,0,0,0.50),
              inset 0 0 ${borderW * 0.8}px rgba(150,0,0,0.18);
          }
        }
        /* ── Corner ornament pulse ── */
        @keyframes ${uid}-orn {
          0%, 100% { opacity: 0.75; transform: scale(1.0); }
          50%       { opacity: 1.00; transform: scale(1.08); }
        }
        /* ── Outer arc segments (dashed ring) rotation ── */
        @keyframes ${uid}-arc {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      <div
        className={`relative flex items-center justify-center ${className}`}
        style={{ width: outerSize, height: outerSize }}
      >
        {/* ── Hell glow pulse ── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.09),
            borderRadius: "50%",
            animation: `${uid}-glow 3.2s ease-in-out infinite`,
            zIndex: 0,
            pointerEvents: "none",
          }}
        />

        {/* ── Outer dashed arc ring (rotating, gold-red) ── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.12),
            borderRadius: "50%",
            border: `${borderW}px dashed rgba(212,140,0,0.80)`,
            animation: `${uid}-arc 8s linear infinite`,
            zIndex: 1,
            pointerEvents: "none",
          }}
        />

        {/* ── Outer solid ring (slow CW, dark red → gold flash) ── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.10),
            borderRadius: "50%",
            border: `${borderW}px solid rgba(180,20,0,0.90)`,
            animation: `${uid}-cw 6s linear infinite, ${uid}-outer 3.0s ease-in-out infinite`,
            zIndex: 2,
            pointerEvents: "none",
          }}
        />

        {/* ── Inner solid ring (fast CCW, crimson flash) ── */}
        <div
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: padding - Math.round(size * 0.10) + ringGap,
            borderRadius: "50%",
            border: `${borderW}px solid rgba(200,0,0,0.85)`,
            animation: `${uid}-ccw 3s linear infinite, ${uid}-inner 3.0s ease-in-out infinite 0.5s`,
            zIndex: 3,
            pointerEvents: "none",
          }}
        />

        {/* ── 4 Corner Oni-horn SVG ornaments ── */}
        {/* Top-left */}
        <svg
          aria-hidden="true"
          width={ornSize}
          height={ornSize}
          viewBox="0 0 40 40"
          style={{
            position: "absolute",
            top: padding - Math.round(ornSize * 0.55),
            left: padding - Math.round(ornSize * 0.55),
            animation: `${uid}-orn 2.8s ease-in-out infinite`,
            zIndex: 4,
            pointerEvents: "none",
            filter: `drop-shadow(0 0 ${Math.round(size * 0.04)}px rgba(212,140,0,0.9))`,
          }}
        >
          {/* Oni horn shape pointing top-left */}
          <path d="M20 20 Q8 14 4 4 Q14 8 20 20Z" fill="rgba(212,140,0,0.85)" />
          <path d="M20 20 Q14 8 4 4 Q6 12 20 20Z" fill="rgba(180,20,0,0.70)" />
          {/* Small decorative dot */}
          <circle cx="6" cy="6" r="2" fill="rgba(255,200,0,0.9)" />
          {/* Curved line ornament */}
          <path d="M20 20 Q12 16 8 10" stroke="rgba(212,140,0,0.6)" strokeWidth="0.8" fill="none" />
        </svg>

        {/* Top-right */}
        <svg
          aria-hidden="true"
          width={ornSize}
          height={ornSize}
          viewBox="0 0 40 40"
          style={{
            position: "absolute",
            top: padding - Math.round(ornSize * 0.55),
            right: padding - Math.round(ornSize * 0.55),
            animation: `${uid}-orn 2.8s ease-in-out infinite 0.7s`,
            zIndex: 4,
            pointerEvents: "none",
            filter: `drop-shadow(0 0 ${Math.round(size * 0.04)}px rgba(212,140,0,0.9))`,
            transform: "scaleX(-1)",
          }}
        >
          <path d="M20 20 Q8 14 4 4 Q14 8 20 20Z" fill="rgba(212,140,0,0.85)" />
          <path d="M20 20 Q14 8 4 4 Q6 12 20 20Z" fill="rgba(180,20,0,0.70)" />
          <circle cx="6" cy="6" r="2" fill="rgba(255,200,0,0.9)" />
          <path d="M20 20 Q12 16 8 10" stroke="rgba(212,140,0,0.6)" strokeWidth="0.8" fill="none" />
        </svg>

        {/* Bottom-left */}
        <svg
          aria-hidden="true"
          width={ornSize}
          height={ornSize}
          viewBox="0 0 40 40"
          style={{
            position: "absolute",
            bottom: padding - Math.round(ornSize * 0.55),
            left: padding - Math.round(ornSize * 0.55),
            animation: `${uid}-orn 2.8s ease-in-out infinite 1.4s`,
            zIndex: 4,
            pointerEvents: "none",
            filter: `drop-shadow(0 0 ${Math.round(size * 0.04)}px rgba(212,140,0,0.9))`,
            transform: "scaleY(-1)",
          }}
        >
          <path d="M20 20 Q8 14 4 4 Q14 8 20 20Z" fill="rgba(212,140,0,0.85)" />
          <path d="M20 20 Q14 8 4 4 Q6 12 20 20Z" fill="rgba(180,20,0,0.70)" />
          <circle cx="6" cy="6" r="2" fill="rgba(255,200,0,0.9)" />
          <path d="M20 20 Q12 16 8 10" stroke="rgba(212,140,0,0.6)" strokeWidth="0.8" fill="none" />
        </svg>

        {/* Bottom-right */}
        <svg
          aria-hidden="true"
          width={ornSize}
          height={ornSize}
          viewBox="0 0 40 40"
          style={{
            position: "absolute",
            bottom: padding - Math.round(ornSize * 0.55),
            right: padding - Math.round(ornSize * 0.55),
            animation: `${uid}-orn 2.8s ease-in-out infinite 2.1s`,
            zIndex: 4,
            pointerEvents: "none",
            filter: `drop-shadow(0 0 ${Math.round(size * 0.04)}px rgba(212,140,0,0.9))`,
            transform: "scale(-1,-1)",
          }}
        >
          <path d="M20 20 Q8 14 4 4 Q14 8 20 20Z" fill="rgba(212,140,0,0.85)" />
          <path d="M20 20 Q14 8 4 4 Q6 12 20 20Z" fill="rgba(180,20,0,0.70)" />
          <circle cx="6" cy="6" r="2" fill="rgba(255,200,0,0.9)" />
          <path d="M20 20 Q12 16 8 10" stroke="rgba(212,140,0,0.6)" strokeWidth="0.8" fill="none" />
        </svg>

        {/* ── Avatar content ── */}
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

export default OniJapaneseFrame;
