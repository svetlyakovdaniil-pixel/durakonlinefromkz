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
        /* Dust cloud rises from bottom, drifts up and fades */
        @keyframes khan-dust-1 {
          0%   { transform: translate(-50%, 0%) scale(0.7); opacity: 0; }
          12%  { opacity: 0.82; }
          55%  { opacity: 0.62; transform: translate(-50%, -60%) scale(1.6); }
          100% { transform: translate(-50%, -100%) scale(2.1); opacity: 0; }
        }
        @keyframes khan-dust-2 {
          0%   { transform: translate(-50%, 0%) scale(0.6); opacity: 0; }
          12%  { opacity: 0.72; }
          55%  { opacity: 0.52; transform: translate(-50%, -55%) scale(1.5); }
          100% { transform: translate(-50%, -95%) scale(2.0); opacity: 0; }
        }
        @keyframes khan-dust-3 {
          0%   { transform: translate(-50%, 0%) scale(0.5); opacity: 0; }
          12%  { opacity: 0.62; }
          55%  { opacity: 0.42; transform: translate(-50%, -50%) scale(1.4); }
          100% { transform: translate(-50%, -90%) scale(1.9); opacity: 0; }
        }
        @keyframes khan-dust-4 {
          0%   { transform: translate(-50%, 0%) scale(0.45); opacity: 0; }
          12%  { opacity: 0.55; }
          55%  { opacity: 0.35; transform: translate(-50%, -45%) scale(1.3); }
          100% { transform: translate(-50%, -85%) scale(1.8); opacity: 0; }
        }
        /* Warm steppe glow — golden horizon light */
        @keyframes khan-glow {
          0%, 100% { opacity: 0.0; }
          40%, 60%  { opacity: 0.42; }
        }
        /* Vignette pulse — subtle darkening of edges */
        @keyframes khan-vignette {
          0%, 100% { opacity: 0.5; }
          50%       { opacity: 0.75; }
        }
      `}</style>

      {/* Base photorealistic image */}
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/khan_steppe_avatar-72rsBrDvaNJLS7y5xKmfwa.webp"
        alt="Хан Степи"
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
          bottom: '-10%',
          left: '50%',
          width: '80%',
          height: '45%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(180,140,80,0.7) 0%, rgba(160,120,60,0.45) 35%, rgba(140,100,50,0.2) 65%, transparent 100%)',
          filter: 'blur(6px)',
          animation: 'khan-dust-1 3.2s ease-out infinite',
          animationDelay: '0s',
          pointerEvents: 'none',
        }}
      />

      {/* ── Dust cloud 2 — medium, shifted left ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-8%',
          left: '35%',
          width: '60%',
          height: '38%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(200,160,90,0.6) 0%, rgba(170,130,65,0.38) 40%, rgba(140,105,50,0.15) 70%, transparent 100%)',
          filter: 'blur(5px)',
          animation: 'khan-dust-2 3.2s ease-out infinite',
          animationDelay: '0.55s',
          pointerEvents: 'none',
        }}
      />

      {/* ── Dust cloud 3 — smaller, shifted right ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-6%',
          left: '60%',
          width: '50%',
          height: '32%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(190,150,80,0.55) 0%, rgba(160,120,60,0.32) 40%, rgba(130,95,45,0.12) 70%, transparent 100%)',
          filter: 'blur(4px)',
          animation: 'khan-dust-3 3.2s ease-out infinite',
          animationDelay: '1.1s',
          pointerEvents: 'none',
        }}
      />

      {/* ── Dust cloud 4 — thin wisp, far left ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          bottom: '-5%',
          left: '20%',
          width: '40%',
          height: '26%',
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 80%, rgba(210,170,95,0.45) 0%, rgba(175,135,68,0.25) 40%, rgba(140,105,50,0.1) 70%, transparent 100%)',
          filter: 'blur(4px)',
          animation: 'khan-dust-4 3.2s ease-out infinite',
          animationDelay: '1.7s',
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
            'radial-gradient(ellipse at 50% 100%, rgba(210,160,60,0.28) 0%, rgba(190,130,40,0.14) 40%, transparent 70%)',
          animation: 'khan-glow 3.2s ease-in-out infinite',
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
          animation: 'khan-vignette 3.2s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default KhanAvatar;
