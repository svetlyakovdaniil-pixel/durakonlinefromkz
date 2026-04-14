import React from 'react';

interface NeonCrownAvatarProps {
  size?: number;
  className?: string;
  /** Horizontal offset in percent (-50 to 50) */
  offsetX?: number;
  /** Vertical offset in percent (-50 to 50) */
  offsetY?: number;
  /** Scale multiplier (0.5 to 2.0) */
  imgScale?: number;
}

/**
 * NeonCrownAvatar — Cyan neon crown with diamond tips.
 * Season: Неоновая эра (Season 7) | Rank: Обсидиан (Obsidian)
 *
 * Animation:
 *   - The crown image slowly cycles through colours via CSS hue-rotate.
 *   - A matching outer glow pulses on the outer wrapper (not on img),
 *     so it stays OUTSIDE the overflow:hidden clip and never overlaps the frame.
 */
export function NeonCrownAvatar({ size = 48, className = '', offsetX = 0, offsetY = 0, imgScale = 1 }: NeonCrownAvatarProps) {
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
      }}
    >
      <style>{`
        /* Colour cycle for the crown image — filter only, no box-shadow here */
        @keyframes ncrown-img-${uid} {
          0%   { filter: brightness(1.2) saturate(1.3) hue-rotate(0deg); }
          25%  { filter: brightness(1.25) saturate(1.4) hue-rotate(-80deg); }
          50%  { filter: brightness(1.2) saturate(1.3) hue-rotate(-160deg); }
          75%  { filter: brightness(1.25) saturate(1.4) hue-rotate(60deg); }
          100% { filter: brightness(1.2) saturate(1.3) hue-rotate(0deg); }
        }
        /* Outer glow on the wrapper div — stays OUTSIDE overflow:hidden clip */
        @keyframes ncrown-glow-${uid} {
          0%   {
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.05}px rgba(0,220,255,0.55),
              0 0 ${size * 0.30}px ${size * 0.10}px rgba(0,180,255,0.30);
          }
          25%  {
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.05}px rgba(255,60,120,0.55),
              0 0 ${size * 0.30}px ${size * 0.10}px rgba(200,0,80,0.30);
          }
          50%  {
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.05}px rgba(255,0,80,0.55),
              0 0 ${size * 0.30}px ${size * 0.10}px rgba(200,0,60,0.30);
          }
          75%  {
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.05}px rgba(40,80,255,0.55),
              0 0 ${size * 0.30}px ${size * 0.10}px rgba(20,40,220,0.30);
          }
          100% {
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.05}px rgba(0,220,255,0.55),
              0 0 ${size * 0.30}px ${size * 0.10}px rgba(0,180,255,0.30);
          }
        }
      `}</style>

      {/* Outer glow wrapper — NOT overflow:hidden so box-shadow is visible but stays BEHIND frame */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          animation: `ncrown-glow-${uid} 4s ease-in-out infinite`,
          zIndex: 0,
          pointerEvents: 'none',
        }}
      />

      {/* Circle clip — overflow:hidden clips the image only */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          overflow: 'hidden',
          zIndex: 1,
        }}
      >
        {/* Dark background */}
        <div style={{ position: 'absolute', inset: 0, background: '#050a14' }} />
        {/* Crown image — colour cycle via filter only */}
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/neon_crown_no_ring-k2gijZGF223aiMcs6ZohLm.webp"
          alt="Обсидиан"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            display: 'block',
            transform: `translate(calc(-50% + ${offsetX}%), calc(-50% + ${offsetY}%)) scale(${imgScale})`,
            transformOrigin: 'center center',
            animation: `ncrown-img-${uid} 4s ease-in-out infinite`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

export default NeonCrownAvatar;
