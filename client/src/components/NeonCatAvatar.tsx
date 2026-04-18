import React from 'react';

interface NeonCatAvatarProps {
  size?: number;
  className?: string;
}

/**
 * NeonCatAvatar — Sitting neon cat with round sunglasses.
 * Season: Неоновая эра (Season 7) | Rank: Янтарь (Amber)
 *
 * Animation cycle (~5s loop):
 *   Phase 1 (0–40%):  Full cat glows brightly — orange/red body + golden glasses
 *   Phase 2 (40–60%): Cat body fades out, glasses remain lit
 *   Phase 3 (60–85%): Only glasses glow (golden), cat body is dim/dark
 *   Phase 4 (85–100%): Cat body fades back in → loop
 *
 * Image analysis (2048×2048 source, cropped to circle):
 *   The cat occupies roughly the center 75% of the image.
 *   Glasses area in the source image:
 *     - Left lens center:  ~38% from left, ~38% from top
 *     - Right lens center: ~62% from left, ~38% from top
 *     - Each lens diameter: ~18% of image width
 *   After objectFit:cover in a circle, the image is scaled so the cat fills the circle.
 *   The cat body starts at ~10% from top and ends at ~95% from top.
 *   Glasses sit at roughly 32–48% from top of the visible circle.
 */
export function NeonCatAvatar({ size = 48, className = '' }: NeonCatAvatarProps) {
  // Lens dimensions in % of the avatar size
  // Left lens: center at ~38% left, ~38% top; diameter ~18%
  // Right lens: center at ~62% left, ~38% top; diameter ~18%
  const lensDiameter = size * 0.19;
  const lensTop = size * 0.30;        // top edge of lens = center(38%) - radius(9%) = 29%
  const leftLensLeft = size * 0.285;  // left edge = center(38%) - radius(9%) = 29%
  const rightLensLeft = size * 0.525; // left edge = center(62%) - radius(9%) = 53%
  const borderW = Math.max(1.5, size * 0.035);

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
        /* Outer halo: full orange glow → dims → amber glow (glasses only phase) → back */
        @keyframes neon-cat-halo {
          0%   { box-shadow: 0 0 10px 3px rgba(255,80,0,0.55),  0 0 22px 7px rgba(255,160,0,0.3); }
          35%  { box-shadow: 0 0 14px 5px rgba(255,80,0,0.65),  0 0 28px 9px rgba(255,160,0,0.4); }
          55%  { box-shadow: 0 0  4px 1px rgba(255,80,0,0.1),   0 0  8px 2px rgba(255,160,0,0.08); }
          75%  { box-shadow: 0 0  8px 3px rgba(255,200,0,0.4),  0 0 18px 6px rgba(255,220,0,0.2); }
          90%  { box-shadow: 0 0  4px 1px rgba(255,80,0,0.1),   0 0  8px 2px rgba(255,160,0,0.08); }
          100% { box-shadow: 0 0 10px 3px rgba(255,80,0,0.55),  0 0 22px 7px rgba(255,160,0,0.3); }
        }

        /* Cat body brightness: full → fade out → dark → fade in */
        @keyframes neon-cat-body {
          0%   { opacity: 1;    filter: brightness(1.15) saturate(1.2); }
          35%  { opacity: 1;    filter: brightness(1.2)  saturate(1.3); }
          55%  { opacity: 0.15; filter: brightness(0.4)  saturate(0.4); }
          75%  { opacity: 0.1;  filter: brightness(0.3)  saturate(0.3); }
          90%  { opacity: 0.15; filter: brightness(0.4)  saturate(0.4); }
          100% { opacity: 1;    filter: brightness(1.15) saturate(1.2); }
        }

        /* Glasses overlay visibility */
        @keyframes neon-cat-glasses {
          0%   { opacity: 0; }
          35%  { opacity: 0; }
          50%  { opacity: 1; }
          80%  { opacity: 1; }
          92%  { opacity: 0; }
          100% { opacity: 0; }
        }

        /* Glasses pulse while cat is dark */
        @keyframes neon-cat-lens-pulse {
          0%, 100% { box-shadow: 0 0 4px 2px rgba(255,210,0,0.7), inset 0 0 4px rgba(255,220,0,0.2); }
          50%       { box-shadow: 0 0 8px 4px rgba(255,230,0,1.0), inset 0 0 6px rgba(255,240,0,0.4); }
        }
      `}</style>

      {/* ── Halo wrapper ── */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          animation: 'neon-cat-halo 5s ease-in-out infinite',
        }}
      >
        {/* ── Base image — fades during glasses-only phase ── */}
        <img
          src="/assets/static/neon_cat_amber_v2-G4HW9sWsBNkEHaW35YPvxs.webp"
          alt="Янтарь"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            animation: 'neon-cat-body 5s ease-in-out infinite',
          }}
          draggable={false}
        />

        {/* ── Glasses overlay — two circles exactly over the glasses on the image ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            animation: 'neon-cat-glasses 5s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        >
          {/* Left lens */}
          <div
            style={{
              position: 'absolute',
              left: leftLensLeft,
              top: lensTop,
              width: lensDiameter,
              height: lensDiameter,
              borderRadius: '50%',
              border: `${borderW}px solid rgba(255,210,0,0.95)`,
              animation: 'neon-cat-lens-pulse 1.1s ease-in-out infinite',
            }}
          />
          {/* Right lens */}
          <div
            style={{
              position: 'absolute',
              left: rightLensLeft,
              top: lensTop,
              width: lensDiameter,
              height: lensDiameter,
              borderRadius: '50%',
              border: `${borderW}px solid rgba(255,210,0,0.95)`,
              animation: 'neon-cat-lens-pulse 1.1s ease-in-out infinite 0.1s',
            }}
          />
          {/* Bridge between lenses */}
          <div
            style={{
              position: 'absolute',
              left: leftLensLeft + lensDiameter,
              top: lensTop + lensDiameter * 0.42,
              width: rightLensLeft - (leftLensLeft + lensDiameter),
              height: Math.max(1.5, size * 0.025),
              background: 'rgba(255,210,0,0.85)',
              boxShadow: `0 0 ${size * 0.04}px rgba(255,200,0,0.6)`,
            }}
          />
        </div>

        {/* Ambient overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 50% 40%, rgba(255,100,0,0.08) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default NeonCatAvatar;
