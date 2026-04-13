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
 *   - Base: Crown glows steadily with cyan/blue neon light + pulsing halo
 *   - Electric Surge: A bright spark travels along the crown outline
 *     from bottom-left corner → up left side → over all three peaks → down right side → bottom-right corner
 *     This repeats every ~4 seconds.
 *   - Diamonds at tips flash when the spark passes through them
 *
 * The spark is simulated using a pseudo-element / overlay gradient that sweeps
 * from left to right across the crown using CSS clip-path + translateX animation.
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
              0 0 12px 5px rgba(0,240,255,0.7),
              0 0 24px 9px rgba(0,200,255,0.45),
              0 0 40px 14px rgba(0,140,255,0.25);
          }
        }

        /* Image brightness pulse — steady glow */
        @keyframes neon-crown-body-${uid} {
          0%, 100% { filter: brightness(1.0) saturate(1.1); }
          50%       { filter: brightness(1.25) saturate(1.3); }
        }

        /* Electric surge spark — sweeps left to right across the crown */
        /* Uses a narrow bright band moving from -20% to 120% of width */
        @keyframes neon-crown-spark-${uid} {
          0%   { transform: translateX(-120%); opacity: 0; }
          5%   { opacity: 1; }
          85%  { opacity: 1; }
          100% { transform: translateX(120%);  opacity: 0; }
        }

        /* The spark animation fires once every 4s, active for ~1.6s of that */
        @keyframes neon-crown-spark-trigger-${uid} {
          0%    { opacity: 1; }
          40%   { opacity: 1; }
          40.1% { opacity: 0; }
          100%  { opacity: 0; }
        }

        /* Diamond flash at tips — triggered in sync with spark */
        @keyframes neon-crown-diamond-${uid} {
          0%    { opacity: 0.6; filter: brightness(1); }
          20%   { opacity: 0.6; filter: brightness(1); }
          30%   { opacity: 1;   filter: brightness(2.5) drop-shadow(0 0 4px rgba(0,240,255,1)); }
          50%   { opacity: 1;   filter: brightness(2.5) drop-shadow(0 0 4px rgba(0,240,255,1)); }
          70%   { opacity: 0.6; filter: brightness(1); }
          100%  { opacity: 0.6; filter: brightness(1); }
        }
      `}</style>

      {/* ── Halo wrapper ── */}
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
        {/* ── Base crown image ── */}
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

        {/* ── Electric spark overlay ──
            A thin vertical bright band sweeps left→right.
            Clipped to the crown area (roughly 15%–85% horizontally, 10%–90% vertically).
            The trigger animation controls visibility (fires every 4s, active for 40% = 1.6s).
        ── */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            overflow: 'hidden',
            borderRadius: '50%',
            pointerEvents: 'none',
            /* trigger: visible for first 40% of 4s = 1.6s, then hidden */
            animation: `neon-crown-spark-trigger-${uid} 4s linear infinite`,
          }}
        >
          {/* The moving spark band */}
          <div
            style={{
              position: 'absolute',
              top: '8%',
              left: 0,
              width: '30%',
              height: '84%',
              background: `linear-gradient(
                to right,
                transparent 0%,
                rgba(0,240,255,0.0) 20%,
                rgba(0,240,255,0.9) 45%,
                rgba(180,255,255,1.0) 50%,
                rgba(0,240,255,0.9) 55%,
                rgba(0,240,255,0.0) 80%,
                transparent 100%
              )`,
              filter: `blur(${Math.max(1, size * 0.025)}px)`,
              animation: `neon-crown-spark-${uid} 1.6s ease-in-out infinite`,
              mixBlendMode: 'screen',
            }}
          />
        </div>

        {/* ── Diamond flash overlay at the three tips ──
            Left tip ~20% left, 28% top
            Center tip ~50% left, 8% top
            Right tip ~80% left, 28% top
        ── */}
        {[
          { left: '16%', top: '24%' },
          { left: '47%', top: '4%'  },
          { left: '78%', top: '24%' },
        ].map((pos, i) => (
          <div
            key={i}
            aria-hidden="true"
            style={{
              position: 'absolute',
              left: pos.left,
              top: pos.top,
              width: `${size * 0.12}px`,
              height: `${size * 0.12}px`,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(180,255,255,0.9) 0%, rgba(0,220,255,0.4) 50%, transparent 70%)',
              animation: `neon-crown-diamond-${uid} 4s ease-in-out infinite ${i * 0.15}s`,
              pointerEvents: 'none',
            }}
          />
        ))}

        {/* Ambient cyan tint */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse at 50% 50%, rgba(0,180,255,0.06) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />
      </div>
    </div>
  );
}

export default NeonCrownAvatar;
