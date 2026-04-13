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
 *   - Crown pulses steadily with cyan/blue neon glow (halo + brightness)
 *   - Three diamond flash points appear exactly over the three crown tip diamonds:
 *       Left diamond:   ~9% from left,  ~28% from top  (in the circle frame)
 *       Center diamond: ~48% from left, ~6%  from top
 *       Right diamond:  ~83% from left, ~28% from top
 *     Each point flashes bright → then disappears completely (opacity 0)
 *     so the real diamond in the image is visible between flashes.
 *
 * Image analysis (2048×2048, objectFit:cover in circle):
 *   The crown occupies roughly 15%–85% horizontally, 10%–92% vertically.
 *   Diamond positions in the full image:
 *     Left:   center ~9%  left, ~28% top  (outside left edge of crown)
 *     Center: center ~48% left, ~6%  top  (top center peak)
 *     Right:  center ~83% left, ~28% top  (outside right edge of crown)
 */
export function NeonCrownAvatar({ size = 48, className = '' }: NeonCrownAvatarProps) {
  const uid = React.useId().replace(/:/g, '');

  // Diamond positions as % of avatar size
  // Measured from the image: left ~9%, center ~48%, right ~83% horizontally
  // Vertically: left/right ~28%, center ~6%
  const diamonds = [
    { leftPct: 0.09, topPct: 0.26 },  // left diamond
    { leftPct: 0.46, topPct: 0.04 },  // center diamond (top peak)
    { leftPct: 0.80, topPct: 0.26 },  // right diamond
  ];

  const dotSize = Math.max(4, size * 0.14);

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
        /* Outer halo — steady cyan pulse */
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

        /* Image brightness pulse */
        @keyframes neon-crown-body-${uid} {
          0%, 100% { filter: brightness(1.0) saturate(1.1); }
          50%       { filter: brightness(1.3) saturate(1.35); }
        }

        /*
         * Diamond flash:
         *   0–10%:   invisible (opacity 0) — real diamond visible
         *   10–25%:  fade in to full brightness
         *   25–45%:  hold bright flash
         *   45–60%:  fade out to invisible
         *   60–100%: invisible — real diamond visible
         * Cycle: 3.5s, so flash lasts ~0.7s, gap ~2.1s
         */
        @keyframes neon-crown-gem-${uid} {
          0%    { opacity: 0;   transform: scale(0.6); }
          10%   { opacity: 0;   transform: scale(0.6); }
          25%   { opacity: 1;   transform: scale(1.0); }
          45%   { opacity: 1;   transform: scale(1.0); }
          60%   { opacity: 0;   transform: scale(0.6); }
          100%  { opacity: 0;   transform: scale(0.6); }
        }
      `}</style>

      {/* ── Halo + image wrapper ── */}
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          position: 'relative',
          animation: `neon-crown-halo-${uid} 2.5s ease-in-out infinite`,
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

        {/* Ambient cyan overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 50% 40%, rgba(0,180,255,0.07) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* ── Diamond flash points — rendered OUTSIDE the overflow:hidden wrapper ── */}
      {diamonds.map((d, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            left: d.leftPct * size - dotSize / 2,
            top:  d.topPct  * size - dotSize / 2,
            width: dotSize,
            height: dotSize,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(140,240,255,0.9) 30%, rgba(0,200,255,0.5) 60%, transparent 80%)',
            boxShadow: `0 0 ${dotSize * 0.6}px ${dotSize * 0.3}px rgba(0,220,255,0.9), 0 0 ${dotSize * 1.2}px ${dotSize * 0.5}px rgba(0,180,255,0.5)`,
            pointerEvents: 'none',
            animation: `neon-crown-gem-${uid} 3.5s ease-in-out infinite ${i * 0.12}s`,
          }}
        />
      ))}
    </div>
  );
}

export default NeonCrownAvatar;
