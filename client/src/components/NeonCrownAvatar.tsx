import React from 'react';

interface NeonCrownAvatarProps {
  size?: number;
  className?: string;
}

/**
 * NeonCrownAvatar — Cyan neon crown with diamond tips.
 * Season: Неоновая эра (Season 7) | Rank: Обсидиан (Obsidian)
 *
 * Animation:
 *   - Crown image pulses with cyan/blue neon glow (brightness + halo)
 *   - Electric ring runs along the INNER border of the avatar circle:
 *       two conic-gradient layers rotate in opposite directions (same technique as LightningFrame)
 *       plus a border-flash ring that flickers like a real neon tube
 *   - All layers stay inside overflow:hidden so nothing bleeds outside the circle
 */
export function NeonCrownAvatar({ size = 48, className = '' }: NeonCrownAvatarProps) {
  const uid = React.useId().replace(/:/g, '');

  // Ring thickness as fraction of size — thinner at small sizes, slightly thicker at large
  const ringThickness = Math.max(2, Math.round(size * 0.06));
  // Blur radius for the conic layers
  const blur1 = Math.max(1, Math.round(size * 0.05));
  const blur2 = Math.max(1, Math.round(size * 0.03));

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-block',
        flexShrink: 0,
      }}
    >
      <style>{`
        /* Outer halo pulse */
        @keyframes ncrown-halo-${uid} {
          0%, 100% {
            box-shadow:
              0 0 ${size * 0.16}px ${size * 0.06}px rgba(0,220,255,0.50),
              0 0 ${size * 0.36}px ${size * 0.12}px rgba(0,180,255,0.28),
              0 0 ${size * 0.60}px ${size * 0.20}px rgba(0,120,255,0.12);
          }
          50% {
            box-shadow:
              0 0 ${size * 0.24}px ${size * 0.10}px rgba(0,240,255,0.80),
              0 0 ${size * 0.50}px ${size * 0.18}px rgba(0,200,255,0.50),
              0 0 ${size * 0.80}px ${size * 0.28}px rgba(0,140,255,0.25);
          }
        }

        /* Crown image brightness pulse */
        @keyframes ncrown-body-${uid} {
          0%, 100% { filter: brightness(1.0) saturate(1.1); }
          50%       { filter: brightness(1.35) saturate(1.4); }
        }

        /* Conic ring layer 1 — clockwise */
        @keyframes ncrown-ring1-${uid} {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        /* Conic ring layer 2 — counter-clockwise, faster */
        @keyframes ncrown-ring2-${uid} {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }

        /* Border flash — like a real neon tube flickering */
        @keyframes ncrown-border-${uid} {
          0%, 100% {
            border-color: rgba(0,200,255,0.80);
            box-shadow: 0 0 ${ringThickness * 1.5}px ${ringThickness * 0.5}px rgba(0,200,255,0.55);
          }
          8% {
            border-color: rgba(255,255,255,0.98);
            box-shadow: 0 0 ${ringThickness * 3}px ${ringThickness}px rgba(255,255,255,0.90);
          }
          12% {
            border-color: rgba(0,180,255,0.65);
            box-shadow: 0 0 ${ringThickness}px ${ringThickness * 0.3}px rgba(0,180,255,0.40);
          }
          55% {
            border-color: rgba(200,240,255,0.95);
            box-shadow: 0 0 ${ringThickness * 3.5}px ${ringThickness * 1.2}px rgba(200,240,255,0.85);
          }
          60% {
            border-color: rgba(0,180,255,0.65);
            box-shadow: 0 0 ${ringThickness}px ${ringThickness * 0.3}px rgba(0,180,255,0.40);
          }
        }
      `}</style>

      {/* Outer halo (outside the circle, just glow) */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          animation: `ncrown-halo-${uid} 2.5s ease-in-out infinite`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Main circle — clips everything inside */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Base crown image */}
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/neon_crown_obsidian-3s7gu4bnxW94srxC2sGYmd.webp"
          alt="Обсидиан"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            animation: `ncrown-body-${uid} 2.5s ease-in-out infinite`,
          }}
          draggable={false}
        />

        {/* Ambient cyan overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(0,180,255,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
            zIndex: 1,
          }}
        />

        {/* ── Electric ring layer 1 — rotating conic, clockwise ── */}
        {/* Positioned so only the outer rim is visible (inner area is transparent) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -ringThickness,
            borderRadius: '50%',
            background: `conic-gradient(
              rgba(0,200,255,0)    0deg,
              rgba(255,255,255,0.9) 20deg,
              rgba(0,220,255,0.75) 40deg,
              rgba(0,140,220,0.40) 80deg,
              rgba(255,255,255,0.85) 130deg,
              rgba(0,200,255,0.60) 170deg,
              rgba(0,100,200,0.30) 210deg,
              rgba(255,255,255,0.90) 250deg,
              rgba(0,200,255,0.70) 290deg,
              rgba(0,140,220,0.40) 330deg,
              rgba(0,200,255,0)    360deg
            )`,
            animation: `ncrown-ring1-${uid} 1.4s linear infinite`,
            filter: `blur(${blur1}px)`,
            zIndex: 2,
            pointerEvents: 'none',
          }}
        />

        {/* ── Electric ring layer 2 — counter-clockwise, faster ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: -Math.round(ringThickness * 0.5),
            borderRadius: '50%',
            background: `conic-gradient(
              rgba(255,255,255,0)   0deg,
              rgba(180,240,255,0.6) 60deg,
              rgba(255,255,255,0.8) 120deg,
              rgba(0,200,255,0.50)  180deg,
              rgba(255,255,255,0.7) 240deg,
              rgba(0,180,255,0.50)  300deg,
              rgba(255,255,255,0)   360deg
            )`,
            animation: `ncrown-ring2-${uid} 0.9s linear infinite`,
            filter: `blur(${blur2}px)`,
            zIndex: 3,
            pointerEvents: 'none',
          }}
        />

        {/* ── Border flash ring — sharp neon tube edge ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: `${Math.max(1, Math.round(ringThickness * 0.5))}px solid rgba(0,200,255,0.80)`,
            animation: `ncrown-border-${uid} 1.8s ease-in-out infinite`,
            zIndex: 4,
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default NeonCrownAvatar;
