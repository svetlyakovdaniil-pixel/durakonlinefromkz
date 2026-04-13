import React from 'react';

interface GoldenHordeAvatarProps {
  size?: number;
  className?: string;
}

/**
 * GoldenHordeAvatar — AI-generated photorealistic Golden Horde warrior.
 * CSS effects:
 *   - Fire background BEHIND the warrior photo (same conic-gradient technique as FireFrame)
 *   - Warrior image sits on top with mix-blend-mode to stay fully visible
 *   - Golden rim pulse border
 * No Canvas, no JS loop — pure CSS @keyframes.
 */
export function GoldenHordeAvatar({ size = 48, className = '' }: GoldenHordeAvatarProps) {
  const blurPx = Math.max(3, Math.round(size * 0.07));
  const blurPx2 = Math.max(2, Math.round(size * 0.045));

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
        // Dark base so fire colours pop
        background: '#0a0000',
      }}
    >
      <style>{`
        @keyframes gh-fire-rotate {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes gh-fire-rotate-rev {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes gh-fire-pulse {
          0%, 100% {
            box-shadow:
              0 0 ${Math.max(4, blurPx)}px ${Math.max(2, blurPx / 2)}px rgba(255,100,0,0.9),
              0 0 ${Math.max(10, blurPx * 2.5)}px ${Math.max(4, blurPx)}px rgba(255,60,0,0.7),
              0 0 ${Math.max(18, blurPx * 4)}px ${Math.max(6, blurPx * 2)}px rgba(200,30,0,0.45);
          }
          33% {
            box-shadow:
              0 0 ${Math.max(6, blurPx * 1.4)}px ${Math.max(3, blurPx * 0.8)}px rgba(255,180,0,1.0),
              0 0 ${Math.max(14, blurPx * 3)}px ${Math.max(5, blurPx * 1.5)}px rgba(255,90,0,0.8),
              0 0 ${Math.max(24, blurPx * 5)}px ${Math.max(8, blurPx * 2.5)}px rgba(220,40,0,0.5);
          }
          66% {
            box-shadow:
              0 0 ${Math.max(3, blurPx * 0.9)}px ${Math.max(1, blurPx * 0.5)}px rgba(255,50,0,0.95),
              0 0 ${Math.max(8, blurPx * 2)}px ${Math.max(3, blurPx)}px rgba(200,20,0,0.75),
              0 0 ${Math.max(14, blurPx * 3.2)}px ${Math.max(5, blurPx * 1.6)}px rgba(150,10,0,0.45);
          }
        }
        @keyframes gh-rim-pulse {
          0%, 100% { opacity: 0.75; }
          50%       { opacity: 1.0; }
        }
      `}</style>

      {/* ── Fire background layer 1 — large conic fills the whole circle ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -Math.round(size * 0.15),
          borderRadius: '50%',
          background: `conic-gradient(
            rgba(255,200,0,0.0) 0deg,
            rgba(255,120,0,0.95) 40deg,
            rgba(255,60,0,1.0)  80deg,
            rgba(200,20,0,0.85) 120deg,
            rgba(255,80,0,0.65) 160deg,
            rgba(255,180,0,0.95) 200deg,
            rgba(255,60,0,1.0)  240deg,
            rgba(180,10,0,0.75) 280deg,
            rgba(255,140,0,0.85) 320deg,
            rgba(255,200,0,0.0) 360deg
          )`,
          animation: 'gh-fire-rotate 2.2s linear infinite',
          filter: `blur(${blurPx}px)`,
          zIndex: 0,
        }}
      />

      {/* ── Fire background layer 2 — counter-rotate, slightly smaller ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -Math.round(size * 0.08),
          borderRadius: '50%',
          background: `conic-gradient(
            rgba(255,80,0,0.0)   0deg,
            rgba(255,200,50,0.85) 60deg,
            rgba(255,100,0,0.95) 120deg,
            rgba(200,30,0,0.65)  180deg,
            rgba(255,160,0,0.9)  240deg,
            rgba(255,50,0,0.75)  300deg,
            rgba(255,80,0,0.0)   360deg
          )`,
          animation: 'gh-fire-rotate-rev 1.7s linear infinite',
          filter: `blur(${blurPx2}px)`,
          zIndex: 1,
        }}
      />

      {/* ── Outer glow pulse ring ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: Math.round(size * 0.05),
          borderRadius: '50%',
          animation: 'gh-fire-pulse 1.4s ease-in-out infinite',
          zIndex: 2,
        }}
      />

      {/* ── Dark radial overlay to dim fire in center so warrior stays visible ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 55%, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.45) 50%, rgba(0,0,0,0.0) 100%)',
          zIndex: 3,
          pointerEvents: 'none',
        }}
      />

      {/* ── Warrior photo on top — fully visible ── */}
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/golden_horde_warrior_avatar-oJWWxe5DCcpxB9nbWMET8o.webp"
        alt="Воин Золотой Орды"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 10%',
          display: 'block',
          zIndex: 4,
          // mix-blend-mode: lighten keeps the warrior visible while letting fire
          // show through the dark background areas of the photo
          mixBlendMode: 'lighten',
        }}
        draggable={false}
      />

      {/* ── Dark vignette on top of everything ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.55) 100%)',
          pointerEvents: 'none',
          zIndex: 5,
        }}
      />

      {/* ── Golden rim border pulse ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `${Math.max(1.5, size * 0.035)}px solid rgba(218,165,32,0.9)`,
          animation: 'gh-rim-pulse 1.8s ease-in-out infinite',
          pointerEvents: 'none',
          boxSizing: 'border-box',
          zIndex: 6,
        }}
      />
    </div>
  );
}

export default GoldenHordeAvatar;
