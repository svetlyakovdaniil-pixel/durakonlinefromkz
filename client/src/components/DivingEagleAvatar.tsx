import React from 'react';

interface DivingEagleAvatarProps {
  size?: number;
  className?: string;
}

/**
 * DivingEagleAvatar — AI-generated photorealistic golden eagle on a blue sky.
 * CSS animation: golden Simurgh aura — three pulsing golden halo layers
 * around the eagle like a mythical bird of legend.
 * No Canvas, no JS loop — pure CSS @keyframes.
 */
export function DivingEagleAvatar({ size = 48, className = '' }: DivingEagleAvatarProps) {
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
          40%, 60%  { opacity: 0.6; transform: scale(1.0); }
        }
        @keyframes eagle-aura-2 {
          0%, 100% { opacity: 0.0; transform: scale(0.88); }
          35%, 65%  { opacity: 0.45; transform: scale(1.0); }
        }
        @keyframes eagle-aura-3 {
          0%, 100% { opacity: 0.0; transform: scale(0.82); }
          30%, 70%  { opacity: 0.28; transform: scale(1.0); }
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
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,215,0,0.55) 0%, rgba(218,165,32,0.35) 35%, rgba(184,134,11,0.15) 60%, transparent 80%)',
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
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(255,200,0,0.32) 50%, rgba(218,165,32,0.22) 70%, transparent 90%)',
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
          background: 'radial-gradient(ellipse at 50% 50%, transparent 50%, rgba(255,180,0,0.22) 70%, rgba(200,140,0,0.12) 85%, transparent 100%)',
          animation: 'eagle-aura-3 2.4s ease-in-out infinite',
          animationDelay: '0.6s',
          pointerEvents: 'none',
          zIndex: 2,
        }}
      />

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
