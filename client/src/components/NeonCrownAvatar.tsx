import React from 'react';

interface NeonCrownAvatarProps {
  size?: number;
  className?: string;
}

/**
 * NeonCrownAvatar — Cyan neon crown with diamond tips.
 * Season: Неоновая эра (Season 7) | Rank: Обсидиан (Obsidian)
 *
 * Animation:
 *   - The cyan ring-contour that's already part of the image slowly cycles
 *     through colours: cyan → red → blue → cyan via CSS hue-rotate.
 *   - The crown itself stays bright and clearly visible.
 *   - A matching outer glow pulses in sync with the colour shift.
 */
export function NeonCrownAvatar({ size = 48, className = '' }: NeonCrownAvatarProps) {
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
        /*
         * Colour cycle for the ring-contour already in the image:
         *   0%   → cyan   (hue-rotate 0deg)   — original colour
         *   33%  → red    (hue-rotate -160deg) — shift toward red/magenta
         *   66%  → blue   (hue-rotate 60deg)   — shift toward deep blue
         *   100% → cyan   (hue-rotate 0deg)    — back to original
         *
         * brightness stays high so the crown remains vivid.
         */
        @keyframes ncrown-color-${uid} {
          0%   {
            filter: brightness(1.2) saturate(1.3) hue-rotate(0deg);
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.05}px rgba(0,220,255,0.55),
              0 0 ${size * 0.30}px ${size * 0.10}px rgba(0,180,255,0.30);
          }
          25%  {
            filter: brightness(1.25) saturate(1.4) hue-rotate(-80deg);
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.05}px rgba(255,60,120,0.55),
              0 0 ${size * 0.30}px ${size * 0.10}px rgba(200,0,80,0.30);
          }
          50%  {
            filter: brightness(1.2) saturate(1.3) hue-rotate(-160deg);
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.05}px rgba(255,0,80,0.55),
              0 0 ${size * 0.30}px ${size * 0.10}px rgba(200,0,60,0.30);
          }
          75%  {
            filter: brightness(1.25) saturate(1.4) hue-rotate(60deg);
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.05}px rgba(40,80,255,0.55),
              0 0 ${size * 0.30}px ${size * 0.10}px rgba(20,40,220,0.30);
          }
          100% {
            filter: brightness(1.2) saturate(1.3) hue-rotate(0deg);
            box-shadow:
              0 0 ${size * 0.14}px ${size * 0.05}px rgba(0,220,255,0.55),
              0 0 ${size * 0.30}px ${size * 0.10}px rgba(0,180,255,0.30);
          }
        }
      `}</style>

      {/* Circle clip */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          overflow: 'hidden',
        }}
      >
        {/* Dark background so contain mode looks clean */}
        <div style={{ position: 'absolute', inset: 0, background: '#050a14' }} />
        {/* Crown image — colour cycle applied directly so the ring-contour shifts colour */}
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_crown_v3-UvXc57KMFSS6FvzqskeRJC.webp"
          alt="Обсидиан"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'contain',
            objectPosition: 'center',
            display: 'block',
            animation: `ncrown-color-${uid} 4s ease-in-out infinite`,
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}

export default NeonCrownAvatar;
