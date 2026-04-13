import React from 'react';

interface NeonCatAvatarProps {
  size?: number;
  className?: string;
}

/**
 * NeonCatAvatar — Cool neon cat with sunglasses, Glasses Glint animation.
 * Season: Неоновая эра (Season 7) | Rank: Янтарь (Amber)
 * Animation:
 *   - Glasses Glint: golden-white glint sweeps across the sunglasses every ~3s
 *   - Red neon outline pulses softly
 *   - Subtle amber/gold outer glow halo
 */
export function NeonCatAvatar({ size = 48, className = '' }: NeonCatAvatarProps) {
  const glintW = Math.max(8, size * 0.28);
  const glintH = Math.max(4, size * 0.12);

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
        /* Outer amber/red halo pulses */
        @keyframes neon-cat-halo {
          0%, 100% { box-shadow: 0 0 6px 2px rgba(255,80,0,0.35), 0 0 14px 4px rgba(255,180,0,0.2); }
          50%       { box-shadow: 0 0 18px 6px rgba(255,80,0,0.65), 0 0 30px 10px rgba(255,180,0,0.4); }
        }
        /* Glint sweeps left→right across the glasses area */
        @keyframes neon-cat-glint {
          0%   { left: -30%; opacity: 0; }
          8%   { opacity: 0; }
          12%  { opacity: 1; }
          45%  { opacity: 1; }
          55%  { opacity: 0; }
          100% { left: 115%; opacity: 0; }
        }
        /* Second glint — delayed, smaller */
        @keyframes neon-cat-glint2 {
          0%   { left: -30%; opacity: 0; }
          8%   { opacity: 0; }
          12%  { opacity: 0.7; }
          45%  { opacity: 0.7; }
          55%  { opacity: 0; }
          100% { left: 115%; opacity: 0; }
        }
        /* Subtle brightness flicker on the whole image */
        @keyframes neon-cat-flicker {
          0%, 100% { filter: brightness(1) saturate(1.1); }
          30%       { filter: brightness(1.12) saturate(1.25); }
          32%       { filter: brightness(0.94) saturate(1.0); }
          34%       { filter: brightness(1.12) saturate(1.25); }
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
          animation: 'neon-cat-halo 2.8s ease-in-out infinite',
        }}
      >
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/neon_cat_amber-3iaxam7C5jZmTr6VeA4aeA.webp"
          alt="Янтарь"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center top',
            display: 'block',
            animation: 'neon-cat-flicker 5s ease-in-out infinite',
          }}
          draggable={false}
        />

        {/* ── Glasses glint — main streak ── */}
        {/* Positioned at ~45-65% from top (where glasses are) */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '42%',
            width: `${glintW}px`,
            height: `${glintH}px`,
            background: 'linear-gradient(to right, transparent 0%, rgba(255,220,80,0.0) 10%, rgba(255,255,180,0.95) 40%, rgba(255,220,80,0.85) 60%, rgba(255,200,0,0.0) 90%, transparent 100%)',
            boxShadow: `0 0 ${size * 0.1}px ${size * 0.05}px rgba(255,200,0,0.6)`,
            borderRadius: '50%',
            transform: 'rotate(-8deg)',
            animation: 'neon-cat-glint 3.2s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />

        {/* ── Glasses glint — secondary smaller streak (delayed) ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: '50%',
            width: `${glintW * 0.6}px`,
            height: `${glintH * 0.6}px`,
            background: 'linear-gradient(to right, transparent 0%, rgba(255,240,120,0.0) 10%, rgba(255,255,200,0.8) 50%, rgba(255,220,80,0.0) 90%, transparent 100%)',
            borderRadius: '50%',
            transform: 'rotate(-6deg)',
            animation: 'neon-cat-glint2 3.2s ease-in-out infinite 0.15s',
            pointerEvents: 'none',
          }}
        />

        {/* Amber/red glow overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(255,80,0,0.12) 0%, rgba(255,160,0,0.08) 50%, transparent 80%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default NeonCatAvatar;
