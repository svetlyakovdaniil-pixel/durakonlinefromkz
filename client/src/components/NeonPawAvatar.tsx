import React from 'react';

interface NeonPawAvatarProps {
  size?: number;
  className?: string;
}

/**
 * NeonPawAvatar — Neon paw with rotating orbital arcs.
 * Season: Неоновая эра (Season 7) | Rank: Циркон
 * Animation: two orbital arcs rotate in opposite directions around the paw,
 * plus a pulsing cyan glow overlay. Pure CSS @keyframes, no JS loop.
 */
export function NeonPawAvatar({ size = 48, className = '' }: NeonPawAvatarProps) {
  const arcSize = size * 1.32; // orbital ring is larger than avatar
  const offset = (arcSize - size) / 2;

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
        /* Orbital ring 1 — clockwise */
        @keyframes neon-orbit-1 {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        /* Orbital ring 2 — counter-clockwise, offset phase */
        @keyframes neon-orbit-2 {
          from { transform: rotate(180deg); }
          to   { transform: rotate(-180deg); }
        }
        /* Pulsing cyan glow on the image */
        @keyframes neon-glow-pulse {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.55; }
        }
        /* Outer halo flicker */
        @keyframes neon-halo {
          0%, 100% { opacity: 0.25; box-shadow: 0 0 8px 2px rgba(0,200,255,0.4); }
          40%, 60%  { opacity: 0.55; box-shadow: 0 0 18px 6px rgba(0,200,255,0.75), 0 0 32px 10px rgba(180,0,255,0.35); }
        }
      `}</style>

      {/* ── Base image ── */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          animation: 'neon-halo 2.8s ease-in-out infinite',
        }}
      >
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/neon_paw_v2-J7ntbHJYh3mwfqGttW7nfX.webp"
          alt="Циркон"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
          draggable={false}
        />

        {/* Cyan glow overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(0,200,255,0.35) 0%, rgba(0,100,200,0.15) 50%, transparent 80%)',
            animation: 'neon-glow-pulse 2.8s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Orbital arc 1 — clockwise, magenta/purple ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -offset,
          left: -offset,
          width: arcSize,
          height: arcSize,
          borderRadius: '50%',
          border: `${Math.max(2, size * 0.04)}px solid transparent`,
          borderTop: `${Math.max(2, size * 0.04)}px solid rgba(210,0,255,0.9)`,
          borderRight: `${Math.max(2, size * 0.04)}px solid rgba(210,0,255,0.5)`,
          boxShadow: `0 0 ${size * 0.12}px rgba(210,0,255,0.7), 0 0 ${size * 0.22}px rgba(210,0,255,0.35)`,
          animation: 'neon-orbit-1 3.2s linear infinite',
          pointerEvents: 'none',
        }}
      />

      {/* ── Orbital arc 2 — counter-clockwise, cyan ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: -offset,
          left: -offset,
          width: arcSize,
          height: arcSize,
          borderRadius: '50%',
          border: `${Math.max(2, size * 0.035)}px solid transparent`,
          borderBottom: `${Math.max(2, size * 0.035)}px solid rgba(0,200,255,0.9)`,
          borderLeft: `${Math.max(2, size * 0.035)}px solid rgba(0,200,255,0.45)`,
          boxShadow: `0 0 ${size * 0.1}px rgba(0,200,255,0.65), 0 0 ${size * 0.2}px rgba(0,200,255,0.3)`,
          animation: 'neon-orbit-2 2.4s linear infinite',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default NeonPawAvatar;
