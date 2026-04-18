import React from 'react';

interface GoldenHordeAvatarProps {
  size?: number;
  className?: string;
}

/**
 * GoldenHordeAvatar — AI-generated photorealistic Golden Horde warrior.
 * CSS effects:
 *   - Blood-red fire animation fills the background (where the photo is dark/black)
 *   - Warrior photo sits on top with mix-blend-mode: multiply so the warrior
 *     himself is unaffected — only the dark background areas show the fire
 *   - Golden rim pulse border
 *
 * Technique: the photo background is originally dark grey/black.
 * mix-blend-mode: multiply on the photo means:
 *   - Dark pixels (background) → become transparent → fire shows through
 *   - Light pixels (warrior face, armour) → stay fully opaque and unaffected
 * No Canvas, no JS loop — pure CSS @keyframes.
 */
export function GoldenHordeAvatar({ size = 48, className = '' }: GoldenHordeAvatarProps) {
  const blurPx  = Math.max(3, Math.round(size * 0.08));
  const blurPx2 = Math.max(2, Math.round(size * 0.05));

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
        // White base — multiply blend needs a bright base to show photo correctly
        background: '#ffffff',
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
              0 0 ${Math.max(4, blurPx)}px ${Math.max(2, blurPx / 2)}px rgba(218,165,32,0.9),
              0 0 ${Math.max(10, blurPx * 2.5)}px ${Math.max(4, blurPx)}px rgba(184,134,11,0.7),
              0 0 ${Math.max(18, blurPx * 4)}px ${Math.max(6, blurPx * 2)}px rgba(150,100,0,0.45);
          }
          33% {
            box-shadow:
              0 0 ${Math.max(6, blurPx * 1.4)}px ${Math.max(3, blurPx * 0.8)}px rgba(255,215,0,1.0),
              0 0 ${Math.max(14, blurPx * 3)}px ${Math.max(5, blurPx * 1.5)}px rgba(218,165,32,0.8),
              0 0 ${Math.max(24, blurPx * 5)}px ${Math.max(8, blurPx * 2.5)}px rgba(180,120,0,0.5);
          }
          66% {
            box-shadow:
              0 0 ${Math.max(3, blurPx * 0.9)}px ${Math.max(1, blurPx * 0.5)}px rgba(200,150,0,0.95),
              0 0 ${Math.max(8, blurPx * 2)}px ${Math.max(3, blurPx)}px rgba(170,120,0,0.75),
              0 0 ${Math.max(14, blurPx * 3.2)}px ${Math.max(5, blurPx * 1.6)}px rgba(130,90,0,0.45);
          }
        }
        @keyframes gh-rim-pulse {
          0%, 100% { opacity: 0.75; }
          50%       { opacity: 1.0; }
        }
      `}</style>

      {/* ── Fire background layer 1 — large golden conic ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -Math.round(size * 0.15),
          borderRadius: '50%',
          background: `conic-gradient(
            rgba(80,50,0,0.0)    0deg,
            rgba(218,165,32,0.95) 40deg,
            rgba(255,215,0,1.0)   80deg,
            rgba(184,134,11,0.85) 120deg,
            rgba(240,190,0,0.7)   160deg,
            rgba(200,150,0,0.95)  200deg,
            rgba(255,200,0,1.0)   240deg,
            rgba(170,120,0,0.8)   280deg,
            rgba(218,165,32,0.9)  320deg,
            rgba(80,50,0,0.0)     360deg
          )`,
          animation: 'gh-fire-rotate 2.2s linear infinite',
          filter: `blur(${blurPx}px)`,
          zIndex: 0,
        }}
      />

      {/* ── Fire background layer 2 — counter-rotate, amber/dark gold ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -Math.round(size * 0.08),
          borderRadius: '50%',
          background: `conic-gradient(
            rgba(60,40,0,0.0)    0deg,
            rgba(210,160,0,0.9)  60deg,
            rgba(170,120,0,0.95) 120deg,
            rgba(100,70,0,0.65)  180deg,
            rgba(200,150,0,0.9)  240deg,
            rgba(150,100,0,0.75) 300deg,
            rgba(60,40,0,0.0)    360deg
          )`,
          animation: 'gh-fire-rotate-rev 1.7s linear infinite',
          filter: `blur(${blurPx2}px)`,
          zIndex: 1,
        }}
      />

      {/* ── Glow pulse ring ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: Math.round(size * 0.05),
          borderRadius: '50%',
          animation: 'gh-fire-pulse 1.4s ease-in-out infinite',
          zIndex: 2,
          pointerEvents: 'none',
        }}
      />

      {/* ── Warrior photo — multiply blend: dark bg becomes transparent, warrior stays ── */}
      <img
        src="/assets/static/golden_horde_warrior_avatar-oJWWxe5DCcpxB9nbWMET8o.webp"
        alt="Воин Золотой Орды"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 10%',
          display: 'block',
          zIndex: 3,
          mixBlendMode: 'multiply',
        }}
        draggable={false}
      />

      {/* ── Dark vignette ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
          zIndex: 4,
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
          zIndex: 5,
        }}
      />
    </div>
  );
}

export default GoldenHordeAvatar;
