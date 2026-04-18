import React from 'react';

interface KhanAvatarProps {
  size?: number;
  className?: string;
}

/**
 * KhanAvatar — AI-generated photorealistic Kazakh khan on horseback in the steppe.
 * CSS animation: steppe dust clouds rise from the bottom and drift upward,
 * evoking a galloping horse kicking up dry earth.
 * No Canvas, no JS loop — pure CSS @keyframes.
 */
export function KhanAvatar({ size = 48, className = '' }: KhanAvatarProps) {
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
        /* Dust cloud rises from bottom, drifts up and fades — boosted opacity & speed */
        @keyframes khan-dust-1 {
          0%   { transform: translate(-50%, 0%) scale(0.8); opacity: 0; }
          10%  { opacity: 1.0; }
          50%  { opacity: 0.85; transform: translate(-50%, -55%) scale(1.8); }
          100% { transform: translate(-50%, -100%) scale(2.5); opacity: 0; }
        }
        @keyframes khan-dust-2 {
          0%   { transform: translate(-50%, 0%) scale(0.7); opacity: 0; }
          10%  { opacity: 0.92; }
          50%  { opacity: 0.75; transform: translate(-50%, -50%) scale(1.7); }
          100% { transform: translate(-50%, -95%) scale(2.3); opacity: 0; }
        }
        @keyframes khan-dust-3 {
          0%   { transform: translate(-50%, 0%) scale(0.65); opacity: 0; }
          10%  { opacity: 0.85; }
          50%  { opacity: 0.68; transform: translate(-50%, -48%) scale(1.6); }
          100% { transform: translate(-50%, -90%) scale(2.2); opacity: 0; }
        }
        @keyframes khan-dust-4 {
          0%   { transform: translate(-50%, 0%) scale(0.55); opacity: 0; }
          10%  { opacity: 0.78; }
          50%  { opacity: 0.58; transform: translate(-50%, -42%) scale(1.5); }
          100% { transform: translate(-50%, -85%) scale(2.0); opacity: 0; }
        }
        /* Warm steppe glow — golden horizon light */
        @keyframes khan-glow {
          0%, 100% { opacity: 0.15; }
          40%, 60%  { opacity: 0.65; }
        }
        /* Vignette pulse — subtle darkening of edges */
        @keyframes khan-vignette {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 0.75; }
        }
      `}</style>

      {/* Base photorealistic image */}
      <img
        src="/assets/static/khan_steppe_avatar-72rsBrDvaNJLS7y5xKmfwa.webp"
        alt="Рубин"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 20%',
          display: 'block',
        }}
        draggable={false}
      />

      {/* ── Dust cloud 1 — large, central, slowest ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-12%',
          left: '50%',
          width: '90%',
          height: '55%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(200,160,90,0.92) 0%, rgba(175,135,65,0.68) 35%, rgba(150,110,55,0.35) 65%, transparent 100%)',
          filter: 'blur(5px)',
          animation: 'khan-dust-1 2.4s ease-out infinite',
          animationDelay: '0s',
          pointerEvents: 'none',
        }}
      />

      {/* ── Dust cloud 2 — medium, shifted left ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-10%',
          left: '35%',
          width: '70%',
          height: '46%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(215,175,100,0.85) 0%, rgba(185,145,72,0.58) 40%, rgba(155,115,55,0.28) 70%, transparent 100%)',
          filter: 'blur(4px)',
          animation: 'khan-dust-2 2.4s ease-out infinite',
          animationDelay: '0.45s',
          pointerEvents: 'none',
        }}
      />

      {/* ── Dust cloud 3 — smaller, shifted right ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-8%',
          left: '60%',
          width: '58%',
          height: '40%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(205,165,88,0.78) 0%, rgba(172,132,65,0.50) 40%, rgba(140,100,48,0.22) 70%, transparent 100%)',
          filter: 'blur(4px)',
          animation: 'khan-dust-3 2.4s ease-out infinite',
          animationDelay: '0.9s',
          pointerEvents: 'none',
        }}
      />

      {/* ── Dust cloud 4 — thin wisp, far left ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-6%',
          left: '20%',
          width: '48%',
          height: '33%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(220,180,100,0.70) 0%, rgba(185,145,72,0.42) 40%, rgba(148,110,52,0.18) 70%, transparent 100%)',
          filter: 'blur(4px)',
          animation: 'khan-dust-4 2.4s ease-out infinite',
          animationDelay: '1.4s',
          pointerEvents: 'none',
        }}
      />

      {/* ── Warm steppe glow — golden horizon light from below ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 100%, rgba(220,170,70,0.45) 0%, rgba(195,140,45,0.25) 40%, transparent 70%)',
          animation: 'khan-glow 2.4s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* ── Vignette — subtle dark edge ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(30,20,5,0.55) 100%)',
          animation: 'khan-vignette 2.4s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default KhanAvatar;
