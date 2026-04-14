import React from 'react';

interface NuclearMushroomAvatarProps {
  size?: number;
  className?: string;
}

/**
 * NuclearMushroomAvatar — animated nuclear mushroom cloud avatar for Apocalypse Season, Obsidian rank.
 *
 * Animation layers (all CSS, no canvas):
 * 1. BASE DUST RING  — wide elliptical dust cloud at the bottom slowly expands & fades outward
 * 2. SHOCKWAVE RING  — thin bright ring pulses outward from the base every ~3s
 * 3. MUSHROOM CAP PULSE — the top cap brightens/dims with an orange-white glow
 * 4. INNER FIREBALL  — small intense white-hot core in the cap flickers rapidly
 * 5. OUTER FIRE HALO — large soft orange halo around the whole cap breathes slowly
 * 6. STEM HEAT SHIMMER — subtle vertical distortion on the stem column
 * 7. AMBIENT GLOW    — overall warm orange vignette that pulses with the explosion
 * 8. RADIATION SPARKS — 4 tiny bright particles that drift upward from the cap
 */
export function NuclearMushroomAvatar({ size = 48, className = '' }: NuclearMushroomAvatarProps) {
  const imgUrl =
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/nuclear_mushroom_avatar-XqWr3xsdoLrkX3ZZrjUQTm.webp';

  const s = size;

  return (
    <div
      className={className}
      style={{
        width: s,
        height: s,
        position: 'relative',
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <style>{`
        /* ── 1. Dust ring expands from base ── */
        @keyframes nma-dust {
          0%   { transform: translate(-50%, -50%) scale(0.7);  opacity: 0.55; }
          60%  { transform: translate(-50%, -50%) scale(1.35); opacity: 0.30; }
          100% { transform: translate(-50%, -50%) scale(1.70); opacity: 0; }
        }
        /* ── 2. Shockwave ring ── */
        @keyframes nma-shockwave {
          0%   { transform: translate(-50%, -50%) scale(0.4); opacity: 0.80; border-width: 3px; }
          70%  { transform: translate(-50%, -50%) scale(1.6); opacity: 0.20; border-width: 1px; }
          100% { transform: translate(-50%, -50%) scale(2.0); opacity: 0;    border-width: 0px; }
        }
        /* ── 3. Cap pulse (orange-white glow) ── */
        @keyframes nma-cap-pulse {
          0%,100% { opacity: 0.45; transform: translate(-50%, -50%) scale(1.00); }
          25%     { opacity: 0.75; transform: translate(-50%, -50%) scale(1.08); }
          55%     { opacity: 0.35; transform: translate(-50%, -50%) scale(0.96); }
          80%     { opacity: 0.65; transform: translate(-50%, -50%) scale(1.05); }
        }
        /* ── 4. Inner fireball flicker ── */
        @keyframes nma-fireball {
          0%,100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1.0); }
          10%     { opacity: 0.90; transform: translate(-50%, -50%) scale(1.15); }
          20%     { opacity: 0.50; transform: translate(-50%, -50%) scale(0.95); }
          35%     { opacity: 0.95; transform: translate(-50%, -50%) scale(1.20); }
          50%     { opacity: 0.45; transform: translate(-50%, -50%) scale(0.90); }
          70%     { opacity: 0.85; transform: translate(-50%, -50%) scale(1.12); }
          85%     { opacity: 0.40; transform: translate(-50%, -50%) scale(0.92); }
        }
        /* ── 5. Outer fire halo breathes ── */
        @keyframes nma-halo {
          0%,100% { opacity: 0.20; transform: translate(-50%, -50%) scale(1.00); }
          40%     { opacity: 0.45; transform: translate(-50%, -50%) scale(1.10); }
          70%     { opacity: 0.15; transform: translate(-50%, -50%) scale(0.95); }
        }
        /* ── 6. Ambient warm vignette ── */
        @keyframes nma-ambient {
          0%,100% { opacity: 0.18; }
          35%     { opacity: 0.38; }
          65%     { opacity: 0.12; }
        }
        /* ── 7. Radiation spark drift ── */
        @keyframes nma-spark-a {
          0%   { transform: translate(0px, 0px);   opacity: 0.9; }
          100% { transform: translate(-8px, -18px); opacity: 0; }
        }
        @keyframes nma-spark-b {
          0%   { transform: translate(0px, 0px);   opacity: 0.8; }
          100% { transform: translate(10px, -22px); opacity: 0; }
        }
        @keyframes nma-spark-c {
          0%   { transform: translate(0px, 0px);   opacity: 0.7; }
          100% { transform: translate(-4px, -20px); opacity: 0; }
        }
        @keyframes nma-spark-d {
          0%   { transform: translate(0px, 0px);   opacity: 0.85; }
          100% { transform: translate(6px, -16px);  opacity: 0; }
        }
        /* ── 8. Stem shimmer ── */
        @keyframes nma-stem {
          0%,100% { opacity: 0.08; }
          50%     { opacity: 0.22; }
        }
      `}</style>

      {/* ── Base image ── */}
      <img
        src={imgUrl}
        alt="Nuclear Mushroom"
        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '50%', display: 'block' }}
      />

      {/* ── Layer 1: Dust ring at base (~80% from top) ── */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '82%',
          width: '90%',
          height: '18%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at center, rgba(180,100,20,0.55) 0%, rgba(120,60,10,0.30) 50%, transparent 75%)',
          animation: 'nma-dust 2.8s ease-out infinite',
          pointerEvents: 'none',
          mixBlendMode: 'screen',
        }}
      />

      {/* ── Layer 2: Shockwave ring ── */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '82%',
          width: '70%',
          height: '12%',
          borderRadius: '50%',
          border: '3px solid rgba(255,160,40,0.85)',
          background: 'transparent',
          animation: 'nma-shockwave 2.8s ease-out infinite 0.4s',
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 3: Cap orange-white glow ── */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '28%',
          width: '72%',
          height: '46%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 55%, rgba(255,200,60,0.70) 0%, rgba(255,100,10,0.45) 40%, rgba(200,40,0,0.20) 65%, transparent 80%)',
          animation: 'nma-cap-pulse 2.4s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 4: Inner fireball (white-hot core) ── */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '24%',
          width: '38%',
          height: '28%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(255,255,220,0.95) 0%, rgba(255,230,100,0.70) 35%, rgba(255,140,20,0.40) 60%, transparent 80%)',
          animation: 'nma-fireball 1.6s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 5: Outer fire halo ── */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '22%',
          width: '90%',
          height: '58%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,120,20,0.35) 0%, rgba(200,60,0,0.18) 50%, transparent 75%)',
          animation: 'nma-halo 3.6s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 6: Stem heat shimmer ── */}
      <div
        style={{
          position: 'absolute',
          left: '38%',
          top: '45%',
          width: '24%',
          height: '36%',
          borderRadius: '40%',
          background: 'linear-gradient(to bottom, rgba(255,120,20,0.18) 0%, rgba(180,60,10,0.10) 60%, transparent 100%)',
          animation: 'nma-stem 2.2s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 7: Ambient warm vignette ── */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse 80% 60% at 50% 40%, rgba(255,100,20,0.25) 0%, transparent 65%)',
          animation: 'nma-ambient 3.0s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* ── Layer 8: Radiation sparks (4 particles drifting up from cap) ── */}
      {[
        { left: '38%', top: '18%', anim: 'nma-spark-a', delay: '0s',    color: 'rgba(255,240,120,0.9)', r: 2.5 },
        { left: '58%', top: '16%', anim: 'nma-spark-b', delay: '0.7s',  color: 'rgba(255,200,80,0.85)', r: 2 },
        { left: '46%', top: '14%', anim: 'nma-spark-c', delay: '1.3s',  color: 'rgba(255,255,180,0.8)', r: 1.8 },
        { left: '52%', top: '20%', anim: 'nma-spark-d', delay: '1.9s',  color: 'rgba(255,180,60,0.9)',  r: 2.2 },
      ].map((sp, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: sp.left,
            top: sp.top,
            width: `${sp.r * 2}px`,
            height: `${sp.r * 2}px`,
            borderRadius: '50%',
            background: sp.color,
            boxShadow: `0 0 ${sp.r * 3}px ${sp.color}`,
            animation: `${sp.anim} 2.0s ease-out infinite ${sp.delay}`,
            pointerEvents: 'none',
          }}
        />
      ))}
    </div>
  );
}
