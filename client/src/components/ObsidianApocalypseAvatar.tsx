import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ObsidianApocalypseAvatar — Nuclear void obsidian with purple apocalypse.
 * Season: Апокалипсис (Season 8) | Rank: Обсидиан
 * Animation: rotating outer ring + orbital particles + ember sparks + glow pulse
 * Avatar is fully visible — all animation is OUTSIDE the image boundary.
 */
export function ObsidianApocalypseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const r = size / 2;
  // Outer ring is 14% larger than avatar on each side
  const ringSize = size * 1.28;
  const ringOffset = -(ringSize - size) / 2;
  // Orbital radius: distance from center to particle center
  const orbitR = ringSize * 0.5 - 2;

  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        /* Glow pulse on the avatar border */
        @keyframes oap-glow-${uid} {
          0%,100% { box-shadow: 0 0 6px 3px rgba(168,85,247,0.7), 0 0 14px 6px rgba(139,92,246,0.4), 0 0 28px 10px rgba(109,40,217,0.2); }
          50%     { box-shadow: 0 0 14px 6px rgba(192,132,252,1),   0 0 28px 12px rgba(168,85,247,0.65), 0 0 50px 18px rgba(139,92,246,0.3); }
        }
        /* Outer ring spin */
        @keyframes oap-ring-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        /* Reverse ring */
        @keyframes oap-ring-rev-${uid} { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        /* Orbital particles */
        @keyframes oap-orb1-${uid} {
          from { transform: rotate(0deg)    translateX(${orbitR}px) rotate(0deg); }
          to   { transform: rotate(360deg)  translateX(${orbitR}px) rotate(-360deg); }
        }
        @keyframes oap-orb2-${uid} {
          from { transform: rotate(120deg)  translateX(${orbitR}px) rotate(-120deg); }
          to   { transform: rotate(480deg)  translateX(${orbitR}px) rotate(-480deg); }
        }
        @keyframes oap-orb3-${uid} {
          from { transform: rotate(240deg)  translateX(${orbitR}px) rotate(-240deg); }
          to   { transform: rotate(600deg)  translateX(${orbitR}px) rotate(-600deg); }
        }
        /* Rising embers outside the avatar */
        @keyframes oap-ember-${uid} {
          0%   { transform: translateY(0) scale(1);   opacity: 0.9; }
          100% { transform: translateY(-${size * 0.9}px) scale(0.15); opacity: 0; }
        }
        /* Subtle shimmer on avatar (very light, doesn't obscure) */
        @keyframes oap-shimmer-${uid} {
          0%,100% { opacity: 0; }
          50%     { opacity: 0.18; }
        }
      `}</style>

      {/* === OUTER ANIMATION LAYER (positioned outside avatar bounds) === */}
      {/* Rotating outer conic ring */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: ringOffset, left: ringOffset,
        width: ringSize, height: ringSize,
        borderRadius: '50%',
        background: 'conic-gradient(from 0deg, transparent 0%, rgba(168,85,247,0.55) 15%, rgba(192,132,252,0.45) 30%, transparent 50%, rgba(139,92,246,0.5) 70%, rgba(192,132,252,0.4) 85%, transparent 100%)',
        animation: `oap-ring-${uid} 2s linear infinite`,
        pointerEvents: 'none',
        // Mask the inner part so only the ring border shows (not over avatar)
        WebkitMaskImage: `radial-gradient(circle, transparent ${(r / (ringSize / 2)) * 100 - 2}%, black ${(r / (ringSize / 2)) * 100 + 2}%)`,
        maskImage: `radial-gradient(circle, transparent ${(r / (ringSize / 2)) * 100 - 2}%, black ${(r / (ringSize / 2)) * 100 + 2}%)`,
      }} />

      {/* Counter-rotating inner ring (slightly smaller) */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: ringOffset * 0.6, left: ringOffset * 0.6,
        width: size * 1.12, height: size * 1.12,
        borderRadius: '50%',
        background: 'conic-gradient(from 60deg, transparent 0%, rgba(233,213,255,0.4) 20%, transparent 40%, rgba(168,85,247,0.35) 60%, transparent 80%)',
        animation: `oap-ring-rev-${uid} 1.4s linear infinite`,
        pointerEvents: 'none',
        WebkitMaskImage: `radial-gradient(circle, transparent ${(r / (size * 1.12 / 2)) * 100 - 2}%, black ${(r / (size * 1.12 / 2)) * 100 + 2}%)`,
        maskImage: `radial-gradient(circle, transparent ${(r / (size * 1.12 / 2)) * 100 - 2}%, black ${(r / (size * 1.12 / 2)) * 100 + 2}%)`,
      }} />

      {/* 3 orbital particles around the avatar */}
      {([`oap-orb1-${uid}`, `oap-orb2-${uid}`, `oap-orb3-${uid}`] as const).map((anim, i) => {
        const pSize = Math.max(3, size * 0.09);
        return (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute',
            top: '50%', left: '50%',
            width: pSize, height: pSize,
            marginTop: -pSize / 2, marginLeft: -pSize / 2,
            borderRadius: '50%',
            background: i === 0 ? '#a855f7' : i === 1 ? '#c084fc' : '#e9d5ff',
            boxShadow: `0 0 5px 3px rgba(168,85,247,0.85)`,
            animation: `${anim} 1.6s linear infinite`,
            pointerEvents: 'none',
          }} />
        );
      })}

      {/* Rising void embers (positioned at bottom, rise upward outside avatar) */}
      {[0.15, 0.35, 0.5, 0.65, 0.85].map((x, i) => {
        const eSize = Math.max(2, size * 0.055);
        return (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute',
            bottom: `-${eSize}px`,
            left: `${x * 100}%`,
            width: eSize, height: eSize,
            borderRadius: '50%',
            background: i % 2 === 0 ? 'rgba(168,85,247,0.9)' : 'rgba(192,132,252,0.8)',
            animation: `oap-ember-${uid} ${1.5 + i * 0.3}s ease-out ${i * 0.28}s infinite`,
            pointerEvents: 'none',
          }} />
        );
      })}

      {/* === AVATAR (clean, fully visible) === */}
      <div style={{
        width: size, height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'absolute', top: 0, left: 0,
        animation: `oap-glow-${uid} 2s ease-in-out infinite`,
        border: '1.5px solid rgba(192,132,252,0.7)',
      }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_apocalypse_v2_464c2e3e.png"
          alt="Обсидиан Апокалипсис"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          draggable={false}
        />
        {/* Very subtle shimmer — barely visible, just a hint of magic */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(192,132,252,0.12) 0%, transparent 50%, rgba(168,85,247,0.08) 100%)',
          animation: `oap-shimmer-${uid} 3s ease-in-out infinite`,
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
