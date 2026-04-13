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
 *   - Crown pulses steadily with cyan/blue neon glow
 *   - Three diamond flash points appear exactly over the three crown tip diamonds.
 *     After flashing they disappear completely (opacity 0) so the real diamonds are visible.
 *
 * Diamond positions (measured from the generated image, as % of full image size):
 *   The image is 1024×1024. The avatar circle clips it with objectFit:cover.
 *   Left diamond:   ~9%  left, ~28% top  → inside circle: ~9%  left, ~28% top
 *   Center diamond: ~48% left, ~6%  top  → inside circle: ~48% left, ~6%  top
 *   Right diamond:  ~83% left, ~28% top  → inside circle: ~83% left, ~28% top
 *
 * From the screenshot the dots appeared too high/outside. The fix:
 *   - Render dots INSIDE the overflow:hidden circle (not outside)
 *   - Use corrected % values that match the actual diamond positions in the image
 */
export function NeonCrownAvatar({ size = 48, className = '' }: NeonCrownAvatarProps) {
  const uid = React.useId().replace(/:/g, '');

  // Corrected diamond positions — measured carefully from the source image
  // The image crown occupies roughly the center 70% of the square.
  // Left/right diamonds are on the outer tips, center is the top peak.
  //
  // In the 1024×1024 source image:
  //   Left diamond center:   ~95px from left,  ~285px from top  → 9.3%,  27.8%
  //   Center diamond center: ~490px from left, ~60px  from top  → 47.9%, 5.9%
  //   Right diamond center:  ~855px from left, ~285px from top  → 83.5%, 27.8%
  //
  // BUT the avatar circle clips the image. The circle has radius = size/2.
  // The image is rendered as objectFit:cover inside the circle, so coordinates
  // map 1:1 from image % to container %. We just need to place dots at those %.
  const diamonds = [
    { leftPct: 0.093, topPct: 0.278 },  // left diamond
    { leftPct: 0.479, topPct: 0.059 },  // center diamond (top peak)
    { leftPct: 0.835, topPct: 0.278 },  // right diamond
  ];

  const dotSize = Math.max(3, size * 0.12);

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
        @keyframes neon-crown-halo-${uid} {
          0%, 100% {
            box-shadow:
              0 0 8px  3px rgba(0,220,255,0.5),
              0 0 18px 6px rgba(0,180,255,0.3),
              0 0 32px 10px rgba(0,120,255,0.15);
          }
          50% {
            box-shadow:
              0 0 14px 5px rgba(0,240,255,0.75),
              0 0 26px 9px rgba(0,200,255,0.5),
              0 0 44px 14px rgba(0,140,255,0.28);
          }
        }

        @keyframes neon-crown-body-${uid} {
          0%, 100% { filter: brightness(1.0) saturate(1.1); }
          50%       { filter: brightness(1.3) saturate(1.35); }
        }

        /*
         * Flash: invisible → bright → invisible
         * 0–15%:   opacity 0  (real diamond visible)
         * 15–30%:  fade in
         * 30–50%:  hold bright
         * 50–65%:  fade out
         * 65–100%: opacity 0  (real diamond visible)
         */
        @keyframes neon-crown-gem-${uid} {
          0%    { opacity: 0; transform: scale(0.5); }
          15%   { opacity: 0; transform: scale(0.5); }
          30%   { opacity: 1; transform: scale(1.0); }
          50%   { opacity: 1; transform: scale(1.0); }
          65%   { opacity: 0; transform: scale(0.5); }
          100%  { opacity: 0; transform: scale(0.5); }
        }
      `}</style>

      {/* Outer halo ring */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          animation: `neon-crown-halo-${uid} 2.5s ease-in-out infinite`,
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Circle clip — image + dots all inside */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          overflow: 'hidden',
        }}
      >
        {/* Base crown image */}
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/neon_crown_obsidian-3s7gu4bnxW94srxC2sGYmd.webp"
          alt="Обсидиан"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
            animation: `neon-crown-body-${uid} 2.5s ease-in-out infinite`,
          }}
          draggable={false}
        />

        {/* Ambient overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 50% 40%, rgba(0,180,255,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Diamond flash points — INSIDE the clipped circle */}
        {diamonds.map((d, i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: `calc(${d.leftPct * 100}% - ${dotSize / 2}px)`,
              top:  `calc(${d.topPct  * 100}% - ${dotSize / 2}px)`,
              width: dotSize,
              height: dotSize,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(140,240,255,0.9) 35%, rgba(0,200,255,0.5) 65%, transparent 85%)',
              boxShadow: `0 0 ${dotSize * 0.7}px ${dotSize * 0.35}px rgba(0,220,255,0.95), 0 0 ${dotSize * 1.4}px ${dotSize * 0.6}px rgba(0,180,255,0.55)`,
              pointerEvents: 'none',
              animation: `neon-crown-gem-${uid} 3.5s ease-in-out infinite ${i * 0.15}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

export default NeonCrownAvatar;
