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
 */
export function NeonCatAvatar({ size = 48, className = '' }: NeonCatAvatarProps) {
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
          55%  { box-shadow: 0 0  4px 1px rgba(255,80,0,0.15),  0 0  8px 2px rgba(255,160,0,0.1); }
          75%  { box-shadow: 0 0  8px 3px rgba(255,200,0,0.45), 0 0 18px 6px rgba(255,220,0,0.25); }
          90%  { box-shadow: 0 0  4px 1px rgba(255,80,0,0.15),  0 0  8px 2px rgba(255,160,0,0.1); }
          100% { box-shadow: 0 0 10px 3px rgba(255,80,0,0.55),  0 0 22px 7px rgba(255,160,0,0.3); }
        }

        /* Cat body brightness: full → fade out → dark → fade in */
        @keyframes neon-cat-body {
          0%   { opacity: 1;    filter: brightness(1.15) saturate(1.2); }
          35%  { opacity: 1;    filter: brightness(1.2)  saturate(1.3); }
          55%  { opacity: 0.18; filter: brightness(0.5)  saturate(0.5); }
          75%  { opacity: 0.12; filter: brightness(0.4)  saturate(0.3); }
          90%  { opacity: 0.18; filter: brightness(0.5)  saturate(0.5); }
          100% { opacity: 1;    filter: brightness(1.15) saturate(1.2); }
        }

        /* Glasses overlay: hidden when cat is fully lit, glows when cat dims */
        @keyframes neon-cat-glasses {
          0%   { opacity: 0; }
          35%  { opacity: 0; }
          55%  { opacity: 1; }
          75%  { opacity: 1; }
          90%  { opacity: 0.6; }
          100% { opacity: 0; }
        }

        /* Glasses glow pulse while cat is dark */
        @keyframes neon-cat-glasses-pulse {
          0%, 100% { filter: brightness(1.2) drop-shadow(0 0 6px rgba(255,220,0,0.9)) drop-shadow(0 0 12px rgba(255,180,0,0.6)); }
          50%       { filter: brightness(1.5) drop-shadow(0 0 10px rgba(255,240,0,1.0)) drop-shadow(0 0 20px rgba(255,200,0,0.8)); }
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
        {/* ── Base image (full cat) — fades during glasses-only phase ── */}
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/neon_cat_amber_v2-G4HW9sWsBNkEHaW35YPvxs.webp"
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

        {/* ── Glasses-only overlay — golden glow, visible only when cat dims ── */}
        {/* Positioned to cover the glasses area (~30-55% from top) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: 'neon-cat-glasses 5s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        >
          {/* Glasses glow — two golden circles representing round sunglasses */}
          <div
            style={{
              position: 'absolute',
              top: '28%',
              left: '50%',
              transform: 'translateX(-50%)',
              width: `${size * 0.62}px`,
              height: `${size * 0.22}px`,
              animation: 'neon-cat-glasses-pulse 1.2s ease-in-out infinite',
            }}
          >
            {/* Left lens */}
            <div style={{
              position: 'absolute',
              left: '4%',
              top: '0',
              width: `${size * 0.26}px`,
              height: `${size * 0.22}px`,
              borderRadius: '50%',
              border: `${Math.max(2, size * 0.045)}px solid rgba(255,210,0,0.95)`,
              boxShadow: `0 0 ${size * 0.12}px ${size * 0.06}px rgba(255,200,0,0.8), inset 0 0 ${size * 0.08}px rgba(255,220,0,0.3)`,
            }} />
            {/* Right lens */}
            <div style={{
              position: 'absolute',
              right: '4%',
              top: '0',
              width: `${size * 0.26}px`,
              height: `${size * 0.22}px`,
              borderRadius: '50%',
              border: `${Math.max(2, size * 0.045)}px solid rgba(255,210,0,0.95)`,
              boxShadow: `0 0 ${size * 0.12}px ${size * 0.06}px rgba(255,200,0,0.8), inset 0 0 ${size * 0.08}px rgba(255,220,0,0.3)`,
            }} />
            {/* Bridge between lenses */}
            <div style={{
              position: 'absolute',
              left: '50%',
              top: '45%',
              transform: 'translateX(-50%)',
              width: `${size * 0.1}px`,
              height: `${Math.max(1, size * 0.025)}px`,
              background: 'rgba(255,210,0,0.8)',
              boxShadow: `0 0 ${size * 0.06}px rgba(255,200,0,0.6)`,
            }} />
          </div>
        </div>

        {/* Ambient overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 50% 40%, rgba(255,100,0,0.1) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default NeonCatAvatar;
