import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ObsidianApocalypseAvatar — Nuclear void obsidian with purple apocalypse.
 * Season: Апокалипсис (Season 8) | Rank: Обсидиан
 *
 * Design: same pattern as other Obsidian avatars (Space, Egyptian, Norse):
 *   - Avatar image is PRIMARY — fully visible inside circular clip with overflow:hidden
 *   - Two thin counter-rotating rings OUTSIDE (subtle, like other obsidians)
 *   - Pulsing box-shadow glow on the avatar circle
 *   - Inside overlays (low opacity, image shows through):
 *       1. Conic lava-crack shimmer (rotating, dark purple/crimson)
 *       2. Radial edge vignette with ember glow at rim
 *       3. Occasional nuclear flash (brief bright pulse)
 *       4. Ash particles drifting upward inside the circle
 */
export function ObsidianApocalypseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50;
  const posY = 50;
  const ashDx = [size * 0.08, size * 0.1, size * 0.05, size * 0.07, size * 0.09];
  const ashDy = [size * 0.18, size * 0.20, size * 0.22, size * 0.15, size * 0.19];

  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes oap-glow-${uid} {
          0%,100% {
            box-shadow:
              0 0 0 1.5px rgba(192,132,252,0.85),
              0 0 8px 3px rgba(168,85,247,0.9),
              0 0 18px 7px rgba(139,92,246,0.5),
              0 0 34px 13px rgba(109,40,217,0.25);
          }
          35% {
            box-shadow:
              0 0 0 2px rgba(233,213,255,1),
              0 0 14px 6px rgba(192,132,252,1),
              0 0 30px 12px rgba(168,85,247,0.7),
              0 0 56px 22px rgba(139,92,246,0.35);
          }
          70% {
            box-shadow:
              0 0 0 1.5px rgba(168,85,247,0.9),
              0 0 10px 4px rgba(147,51,234,0.8),
              0 0 22px 8px rgba(126,34,206,0.45),
              0 0 42px 15px rgba(109,40,217,0.2);
          }
        }
        @keyframes oap-cw-${uid}  { from { transform: rotate(0deg); }   to { transform: rotate(360deg); } }
        @keyframes oap-ccw-${uid} { from { transform: rotate(0deg); }   to { transform: rotate(-360deg); } }
        @keyframes oap-lava-${uid} {
          0%   { opacity: 0.12; transform: rotate(0deg); }
          50%  { opacity: 0.22; transform: rotate(180deg); }
          100% { opacity: 0.12; transform: rotate(360deg); }
        }
        @keyframes oap-flash-${uid} {
          0%,3%   { opacity: 0.55; }
          4%,100% { opacity: 0; }
        }
        @keyframes oap-ember-${uid} {
          0%,100% { opacity: 0.18; }
          50%     { opacity: 0.38; }
        }
        @keyframes oap-ash0-${uid} {
          0%   { transform: translate(0px,0px) scale(1); opacity: 0.7; }
          100% { transform: translate(-${ashDx[0].toFixed(1)}px,-${ashDy[0].toFixed(1)}px) scale(0.3); opacity: 0; }
        }
        @keyframes oap-ash1-${uid} {
          0%   { transform: translate(0px,0px) scale(1); opacity: 0.6; }
          100% { transform: translate(${ashDx[1].toFixed(1)}px,-${ashDy[1].toFixed(1)}px) scale(0.2); opacity: 0; }
        }
        @keyframes oap-ash2-${uid} {
          0%   { transform: translate(0px,0px) scale(1); opacity: 0.75; }
          100% { transform: translate(${ashDx[2].toFixed(1)}px,-${ashDy[2].toFixed(1)}px) scale(0.25); opacity: 0; }
        }
        @keyframes oap-ash3-${uid} {
          0%   { transform: translate(0px,0px) scale(1); opacity: 0.65; }
          100% { transform: translate(-${ashDx[3].toFixed(1)}px,-${ashDy[3].toFixed(1)}px) scale(0.4); opacity: 0; }
        }
        @keyframes oap-ash4-${uid} {
          0%   { transform: translate(0px,0px) scale(1); opacity: 0.8; }
          100% { transform: translate(${ashDx[4].toFixed(1)}px,-${ashDy[4].toFixed(1)}px) scale(0.15); opacity: 0; }
        }
      `}</style>

      {/* ── Outer rotating ring — violet/crimson ── */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(2, size * 0.05),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.025)}px solid transparent`,
        borderTopColor: 'rgba(192,132,252,0.9)',
        borderRightColor: 'rgba(220,38,38,0.6)',
        borderBottomColor: 'rgba(168,85,247,0.5)',
        borderLeftColor: 'rgba(147,51,234,0.8)',
        animation: `oap-cw-${uid} 3.5s linear infinite`,
        pointerEvents: 'none',
      }} />
      {/* ── Inner counter-rotating ring ── */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(1, size * 0.02),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.015)}px solid transparent`,
        borderTopColor: 'rgba(147,51,234,0.6)',
        borderBottomColor: 'rgba(220,38,38,0.5)',
        animation: `oap-ccw-${uid} 2.2s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* ── Avatar circle (PRIMARY) ── */}
      <div style={{
        width: size, height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        animation: `oap-glow-${uid} 2.8s ease-in-out infinite`,
      }}>
        <img
          src="/assets/static/obsidian_apocalypse_v2_464c2e3e.png"
          alt="Обсидиан Апокалипсис"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, display: 'block' }}
          draggable={false}
        />
        {/* Lava crack conic shimmer — subtle, rotates slowly */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, rgba(147,51,234,0.18), rgba(220,38,38,0.12), rgba(192,132,252,0.22), rgba(109,40,217,0.1), rgba(185,28,28,0.15), rgba(147,51,234,0.18))',
          animation: `oap-lava-${uid} 7s linear infinite`,
          mixBlendMode: 'screen',
        }} />
        {/* Edge ember vignette — dark red/purple at rim */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(147,51,234,0.28) 75%, rgba(185,28,28,0.35) 100%)',
          animation: `oap-ember-${uid} 2.4s ease-in-out infinite`,
        }} />
        {/* Nuclear flash 1 */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 45%, rgba(233,213,255,0.45) 0%, rgba(192,132,252,0.25) 40%, transparent 70%)',
          opacity: 0,
          animation: `oap-flash-${uid} 4s ease-in-out 0s infinite`,
        }} />
        {/* Nuclear flash 2 (offset) */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 45%, rgba(233,213,255,0.4) 0%, rgba(192,132,252,0.2) 40%, transparent 70%)',
          opacity: 0,
          animation: `oap-flash-${uid} 4s ease-in-out 2.1s infinite`,
        }} />
        {/* Ash particles drifting upward */}
        {[
          { left: '22%', top: '72%', delay: '0s',   dur: '2.2s', color: 'rgba(192,132,252,0.9)' },
          { left: '45%', top: '80%', delay: '0.5s', dur: '1.9s', color: 'rgba(220,38,38,0.8)' },
          { left: '63%', top: '68%', delay: '1.0s', dur: '2.5s', color: 'rgba(233,213,255,0.85)' },
          { left: '35%', top: '76%', delay: '1.5s', dur: '2.0s', color: 'rgba(168,85,247,0.9)' },
          { left: '75%', top: '74%', delay: '0.8s', dur: '2.3s', color: 'rgba(192,132,252,0.75)' },
        ].map((p, i) => {
          const ps = Math.max(1.5, size * 0.045);
          return (
            <div key={i} aria-hidden="true" style={{
              position: 'absolute',
              left: p.left, top: p.top,
              width: ps, height: ps,
              borderRadius: '50%',
              background: p.color,
              boxShadow: `0 0 ${(ps * 1.5).toFixed(1)}px ${p.color}`,
              animation: `oap-ash${i}-${uid} ${p.dur} ease-out ${p.delay} infinite`,
              pointerEvents: 'none',
            }} />
          );
        })}
      </div>
    </div>
  );
}
