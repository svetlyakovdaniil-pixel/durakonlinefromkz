import React from 'react';

interface DivingEagleAvatarProps {
  size?: number;
  className?: string;
}

/**
 * DivingEagleAvatar — AI-generated photorealistic golden eagle on a blue sky.
 * CSS animation: golden Simurgh effect — pulsing golden aura + golden sparks
 * fly outward from the eagle like a mythical bird of legend.
 * No Canvas, no JS loop — pure CSS @keyframes.
 */
export function DivingEagleAvatar({ size = 48, className = '' }: DivingEagleAvatarProps) {
  // Spark positions: angle (deg) and distance factor for each of 10 sparks
  const sparks = [
    { angle: 0,   dist: 0.38, delay: '0s',    dur: '2.4s', size: 0.055 },
    { angle: 36,  dist: 0.42, delay: '0.24s', dur: '2.1s', size: 0.045 },
    { angle: 72,  dist: 0.35, delay: '0.48s', dur: '2.6s', size: 0.06  },
    { angle: 108, dist: 0.40, delay: '0.72s', dur: '2.2s', size: 0.04  },
    { angle: 144, dist: 0.37, delay: '0.96s', dur: '2.5s', size: 0.05  },
    { angle: 180, dist: 0.43, delay: '1.2s',  dur: '2.3s', size: 0.048 },
    { angle: 216, dist: 0.36, delay: '1.44s', dur: '2.7s', size: 0.042 },
    { angle: 252, dist: 0.41, delay: '1.68s', dur: '2.0s', size: 0.058 },
    { angle: 288, dist: 0.39, delay: '1.92s', dur: '2.4s', size: 0.044 },
    { angle: 324, dist: 0.44, delay: '0.6s',  dur: '2.2s', size: 0.052 },
  ];

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
        /* Golden aura pulse — three layers at different speeds */
        @keyframes eagle-aura-1 {
          0%, 100% { opacity: 0.0; transform: scale(0.92); }
          40%, 60%  { opacity: 0.55; transform: scale(1.0); }
        }
        @keyframes eagle-aura-2 {
          0%, 100% { opacity: 0.0; transform: scale(0.88); }
          35%, 65%  { opacity: 0.38; transform: scale(1.0); }
        }
        @keyframes eagle-aura-3 {
          0%, 100% { opacity: 0.0; transform: scale(0.82); }
          30%, 70%  { opacity: 0.22; transform: scale(1.0); }
        }
        /* Spark fly-out: starts at center, moves outward, fades */
        @keyframes eagle-spark {
          0%   { transform: translate(-50%, -50%) scale(0.3); opacity: 0; }
          15%  { opacity: 1.0; transform: translate(-50%, -50%) scale(1.0); }
          60%  { opacity: 0.7; }
          100% { opacity: 0; transform: translate(
            calc(-50% + var(--dx)),
            calc(-50% + var(--dy))
          ) scale(0.2); }
        }
        /* Rim glow pulse */
        @keyframes eagle-rim {
          0%, 100% { opacity: 0.6; box-shadow: 0 0 0px 0px rgba(218,165,32,0); }
          50%       { opacity: 1.0; box-shadow: 0 0 8px 3px rgba(218,165,32,0.7); }
        }
      `}</style>

      {/* Base photorealistic image */}
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/diving_eagle_avatar-mETA3RPC2znnKVf6a8Nzyx.webp"
        alt="Небесный Орёл"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 30%',
          display: 'block',
          position: 'relative',
          zIndex: 1,
        }}
        draggable={false}
      />

      {/* ── Golden aura layer 1 — innermost, brightest ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.5) 0%, rgba(218,165,32,0.3) 35%, rgba(184,134,11,0.12) 60%, transparent 80%)',
          animation: 'eagle-aura-1 2.4s ease-in-out infinite',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* ── Golden aura layer 2 — mid ring ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -Math.round(size * 0.05),
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(255,200,0,0.28) 50%, rgba(218,165,32,0.18) 70%, transparent 90%)',
          animation: 'eagle-aura-2 2.4s ease-in-out infinite',
          animationDelay: '0.3s',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* ── Golden aura layer 3 — outer halo ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -Math.round(size * 0.1),
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(255,180,0,0.18) 70%, rgba(200,140,0,0.1) 85%, transparent 100%)',
          animation: 'eagle-aura-3 2.4s ease-in-out infinite',
          animationDelay: '0.6s',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

      {/* ── Golden sparks — fly outward from center ── */}
      {sparks.map((spark, i) => {
        const rad = (spark.angle * Math.PI) / 180;
        const dx = Math.round(Math.cos(rad) * spark.dist * size);
        const dy = Math.round(Math.sin(rad) * spark.dist * size);
        const sparkSize = Math.max(3, Math.round(spark.size * size));
        return (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: sparkSize,
              height: sparkSize,
              borderRadius: '50%',
              background: `radial-gradient(circle, rgba(255,240,100,1.0) 0%, rgba(255,200,0,0.8) 40%, rgba(218,165,32,0.4) 70%, transparent 100%)`,
              boxShadow: `0 0 ${Math.max(2, sparkSize)}px ${Math.max(1, Math.round(sparkSize * 0.6))}px rgba(255,215,0,0.9)`,
              // CSS custom properties for the fly-out direction
              ['--dx' as string]: `${dx}px`,
              ['--dy' as string]: `${dy}px`,
              animation: `eagle-spark ${spark.dur} ease-out infinite`,
              animationDelay: spark.delay,
              pointerEvents: 'none',
              zIndex: 3,
            }}
          />
        );
      })}

      {/* ── Vignette ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 40%, rgba(0,10,30,0.45) 100%)',
          pointerEvents: 'none',
          zIndex: 4,
        }}
      />

      {/* ── Golden rim border ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `${Math.max(1.5, size * 0.035)}px solid rgba(218,165,32,0.9)`,
          animation: 'eagle-rim 2.4s ease-in-out infinite',
          pointerEvents: 'none',
          boxSizing: 'border-box',
          zIndex: 5,
        }}
      />
    </div>
  );
}

export default DivingEagleAvatar;
