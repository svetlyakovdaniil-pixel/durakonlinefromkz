import React from 'react';

interface NeonPawAvatarProps {
  size?: number;
  className?: string;
}

/**
 * NeonPawAvatar — Neon paw with pulsing glow.
 * Season: Неоновая эра (Season 7) | Rank: Циркон
 *
 * The orbital arcs are intentionally removed from this component —
 * they are now rendered by ZirconNeonFrame so they appear OUTSIDE
 * the avatar circle and never overlap the frame.
 *
 * This component renders only the paw image + inner glow overlay,
 * strictly within its own bounding box (no overflow).
 */
export function NeonPawAvatar({ size = 48, className = '' }: NeonPawAvatarProps) {
  const uid = React.useId().replace(/:/g, '');

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: 'relative',
        display: 'inline-block',
        flexShrink: 0,
        borderRadius: '50%',
        overflow: 'hidden',
      }}
    >
      <style>{`
        /* Pulsing cyan glow overlay */
        @keyframes npaw-glow-${uid} {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.55; }
        }
      `}</style>

      {/* Paw image */}
      <img
        src="/assets/static/neon_paw_v2-J7ntbHJYh3mwfqGttW7nfX.webp"
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

      {/* Cyan glow overlay — stays inside overflow:hidden */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(0,200,255,0.35) 0%, rgba(0,100,200,0.15) 50%, transparent 80%)',
          animation: `npaw-glow-${uid} 2.8s ease-in-out infinite`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default NeonPawAvatar;
