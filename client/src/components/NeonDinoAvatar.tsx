import React from 'react';

interface NeonDinoAvatarProps {
  size?: number;
  className?: string;
}

/**
 * NeonDinoAvatar — Neon dinosaur with Scan Line animation.
 * Season: Неоновая эра (Season 7) | Rank: Рубин (ruby)
 * Animation: a bright light band sweeps from bottom to top across the avatar
 * every ~3 seconds, like a neon tube charging up. Plus a subtle pink/purple glow halo.
 */
export function NeonDinoAvatar({ size = 48, className = '' }: NeonDinoAvatarProps) {
  const id = `neon-dino-${size}`; // unique enough for same-page usage

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
        /* Scan line sweeps from bottom (100%) to top (-20%) */
        @keyframes neon-dino-scan {
          0%   { top: 110%; opacity: 0; }
          5%   { opacity: 1; }
          80%  { opacity: 0.85; }
          100% { top: -20%; opacity: 0; }
        }
        /* Outer halo pulses pink/purple */
        @keyframes neon-dino-halo {
          0%, 100% { box-shadow: 0 0 6px 2px rgba(255,0,200,0.35), 0 0 14px 4px rgba(160,0,255,0.2); }
          50%       { box-shadow: 0 0 16px 5px rgba(255,0,200,0.65), 0 0 28px 10px rgba(160,0,255,0.4); }
        }
        /* Subtle image brightness flicker */
        @keyframes neon-dino-flicker {
          0%, 100% { filter: brightness(1) saturate(1.1); }
          48%       { filter: brightness(1.15) saturate(1.3); }
          50%       { filter: brightness(0.92) saturate(1.0); }
          52%       { filter: brightness(1.15) saturate(1.3); }
        }
      `}</style>

      {/* ── Base image with halo ── */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          animation: 'neon-dino-halo 2.5s ease-in-out infinite',
        }}
      >
        <img
          src="/assets/static/neon_dino_ruby-e5c5vvCmCmU37AgnHKyEXM.webp"
          alt="Рубин"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            animation: 'neon-dino-flicker 4.5s ease-in-out infinite',
          }}
          draggable={false}
        />

        {/* ── Scan line ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            height: `${Math.max(4, size * 0.18)}px`,
            background: 'linear-gradient(to bottom, transparent 0%, rgba(255,100,255,0.7) 40%, rgba(255,255,255,0.55) 50%, rgba(255,100,255,0.7) 60%, transparent 100%)',
            boxShadow: `0 0 ${size * 0.15}px ${size * 0.08}px rgba(255,80,255,0.5)`,
            animation: 'neon-dino-scan 3s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* Pink glow overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(255,0,200,0.18) 0%, rgba(120,0,255,0.1) 55%, transparent 80%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default NeonDinoAvatar;
