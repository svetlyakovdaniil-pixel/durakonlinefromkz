import React from 'react';

interface GoldenHordeAvatarProps {
  size?: number;
  className?: string;
}

/**
 * GoldenHordeAvatar — AI-generated photorealistic Golden Horde warrior.
 * CSS effects:
 *   - Fire animation around the sword blade (same technique as FireFrame:
 *     conic-gradient rotation + box-shadow pulse)
 *   - Golden rim pulse border
 * No Canvas, no JS loop — pure CSS @keyframes.
 */
export function GoldenHordeAvatar({ size = 48, className = '' }: GoldenHordeAvatarProps) {
  // Sword blade occupies roughly the upper-right quadrant of the circular avatar.
  // We position a thin rotated rectangle (~15% wide, ~55% tall) at ~55% left, ~8% top,
  // rotated ~-35deg to match the blade angle in the photo.
  const bladeW = Math.max(4, Math.round(size * 0.13));
  const bladeH = Math.max(14, Math.round(size * 0.55));
  const blurPx = Math.max(2, Math.round(size * 0.06));
  const blurPx2 = Math.max(1, Math.round(size * 0.04));

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        display: 'block',
        flexShrink: 0,
      }}
    >
      <style>{`
        /* ── Fire conic rotation (same as FireFrame) ── */
        @keyframes gh-fire-rotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gh-fire-rotate-rev {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }

        /* ── Fire pulse glow (same as FireFrame) ── */
        @keyframes gh-fire-pulse {
          0%, 100% {
            box-shadow:
              0 0 ${Math.max(3, blurPx)}px ${Math.max(1, blurPx / 2)}px rgba(255,100,0,0.8),
              0 0 ${Math.max(6, blurPx * 2)}px ${Math.max(2, blurPx)}px rgba(255,60,0,0.6),
              0 0 ${Math.max(10, blurPx * 3)}px ${Math.max(3, blurPx * 1.5)}px rgba(200,30,0,0.35);
          }
          33% {
            box-shadow:
              0 0 ${Math.max(4, blurPx * 1.2)}px ${Math.max(2, blurPx * 0.7)}px rgba(255,160,0,0.9),
              0 0 ${Math.max(8, blurPx * 2.5)}px ${Math.max(3, blurPx * 1.2)}px rgba(255,80,0,0.7),
              0 0 ${Math.max(14, blurPx * 4)}px ${Math.max(4, blurPx * 2)}px rgba(220,40,0,0.4);
          }
          66% {
            box-shadow:
              0 0 ${Math.max(2, blurPx * 0.8)}px ${Math.max(1, blurPx * 0.4)}px rgba(255,50,0,0.85),
              0 0 ${Math.max(5, blurPx * 1.8)}px ${Math.max(2, blurPx * 0.8)}px rgba(200,20,0,0.65),
              0 0 ${Math.max(9, blurPx * 2.8)}px ${Math.max(3, blurPx * 1.3)}px rgba(150,10,0,0.35);
          }
        }

        /* ── Golden rim pulse ── */
        @keyframes gh-rim-pulse {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1.0; }
        }
      `}</style>

      {/* Base photorealistic image — static */}
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/golden_horde_warrior_avatar-oJWWxe5DCcpxB9nbWMET8o.webp"
        alt="Воин Золотой Орды"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 10%',
          display: 'block',
        }}
        draggable={false}
      />

      {/* ── Fire around sword blade ──
          The blade runs from ~(60%, 8%) to ~(72%, 62%) in avatar coords,
          angled at ~-35deg. We use a thin rotated rectangle with:
            - outer glow ring (fire-pulse box-shadow)
            - two conic-gradient layers rotating around the blade center
      */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          // Center of blade: ~66% from left, ~35% from top
          left: `${size * 0.60}px`,
          top: `${size * 0.06}px`,
          width: bladeW,
          height: bladeH,
          transform: 'rotate(-35deg)',
          transformOrigin: '50% 50%',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      >
        {/* Glow pulse ring */}
        <div
          style={{
            position: 'absolute',
            inset: -Math.round(bladeW * 0.5),
            borderRadius: `${bladeW}px`,
            animation: `gh-fire-pulse 1.4s ease-in-out infinite`,
          }}
        />

        {/* Conic fire layer 1 — rotates around blade */}
        <div
          style={{
            position: 'absolute',
            inset: -Math.round(bladeW * 0.9),
            borderRadius: `${bladeW * 1.5}px`,
            background: `conic-gradient(
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
            )`,
            animation: `gh-fire-rotate 2.2s linear infinite`,
            filter: `blur(${blurPx}px)`,
          }}
        />

        {/* Conic fire layer 2 — counter-rotates */}
        <div
          style={{
            position: 'absolute',
            inset: -Math.round(bladeW * 0.6),
            borderRadius: `${bladeW * 1.2}px`,
            background: `conic-gradient(
              rgba(255,80,0,0.0) 0deg,
              rgba(255,200,50,0.8) 60deg,
              rgba(255,100,0,0.9) 120deg,
              rgba(200,30,0,0.6) 180deg,
              rgba(255,160,0,0.85) 240deg,
              rgba(255,50,0,0.7) 300deg,
              rgba(255,80,0,0.0) 360deg
            )`,
            animation: `gh-fire-rotate-rev 1.7s linear infinite`,
            filter: `blur(${blurPx2}px)`,
          }}
        />

        {/* Blade core — thin bright line to show fire is "on" the blade */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: `${bladeW}px`,
            background: 'linear-gradient(180deg, rgba(255,240,200,0.6) 0%, rgba(255,160,50,0.4) 60%, rgba(255,80,0,0.2) 100%)',
          }}
        />
      </div>

      {/* ── Dark vignette ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
          zIndex: 3,
        }}
      />

      {/* ── Golden rim border pulse ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `${Math.max(1.5, size * 0.035)}px solid rgba(218,165,32,0.85)`,
          animation: 'gh-rim-pulse 1.8s ease-in-out infinite',
          pointerEvents: 'none',
          boxSizing: 'border-box',
          zIndex: 4,
        }}
      />
    </div>
  );
}

export default GoldenHordeAvatar;
