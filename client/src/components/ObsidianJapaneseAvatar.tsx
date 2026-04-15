import React from 'react';

interface Props { size?: number; className?: string; }

/**
 * ObsidianJapaneseAvatar — "Ink Dragon & Moonlit Sakura" v4
 * Season: Японские мотивы (Season 9) | Rank: Обсидиан
 *
 * Layer order (bottom → top):
 *   1. Moonlight aura glow (box-shadow on outer wrapper — behind everything)
 *   2. Outer dragon-scale ring (outside the avatar circle, overflow visible)
 *   3. Middle ring (outside the avatar circle)
 *   4. Dragon pearl orbs (orbiting outside the avatar circle)
 *   5. Sakura petals (rising from bottom, outside avatar circle)
 *   6. Avatar image (always on top, never covered)
 *   7. Subtle inner border glow on avatar edge (cosmetic only, no coverage)
 */
export function ObsidianJapaneseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const r = size / 2;
  // Outer canvas is larger than the avatar to hold rings/orbs outside
  const outerSize = Math.round(size * 1.32);
  const outerR = outerSize / 2;
  const offset = (outerSize - size) / 2; // how much the canvas extends beyond avatar

  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        /* ── Moonlight pulse aura ── */
        @keyframes ojpv4-moon-${uid} {
          0%, 100% {
            box-shadow:
              0 0 6px 2px rgba(148,163,184,0.7),
              0 0 16px 6px rgba(99,102,241,0.5),
              0 0 34px 12px rgba(30,27,75,0.6);
          }
          35% {
            box-shadow:
              0 0 10px 4px rgba(199,210,254,0.85),
              0 0 26px 10px rgba(129,140,248,0.65),
              0 0 52px 20px rgba(49,46,129,0.5);
          }
          68% {
            box-shadow:
              0 0 9px 3px rgba(251,191,36,0.8),
              0 0 22px 8px rgba(234,88,12,0.55),
              0 0 44px 16px rgba(30,27,75,0.55);
          }
        }

        /* ── Rings ── */
        @keyframes ojpv4-r1-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ojpv4-r2-${uid} { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }

        /* ── Dragon pearl orbits (around the avatar) ── */
        @keyframes ojpv4-orb1-${uid} {
          from { transform: rotate(0deg) translateX(${r * 1.18}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${r * 1.18}px) rotate(-360deg); }
        }
        @keyframes ojpv4-orb2-${uid} {
          from { transform: rotate(128deg) translateX(${r * 1.14}px) rotate(-128deg); }
          to   { transform: rotate(488deg) translateX(${r * 1.14}px) rotate(-488deg); }
        }
        @keyframes ojpv4-orb3-${uid} {
          from { transform: rotate(248deg) translateX(${r * 1.16}px) rotate(-248deg); }
          to   { transform: rotate(608deg) translateX(${r * 1.16}px) rotate(-608deg); }
        }

        /* ── Sakura petals: rise from bottom, stay outside avatar ── */
        @keyframes ojpv4-p0-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 0.9; }
          100% { transform: translateY(-${size * 1.4}px) translateX(${size * 0.2}px) rotate(340deg) scale(0.1); opacity: 0; }
        }
        @keyframes ojpv4-p1-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(60deg) scale(0.9); opacity: 0.85; }
          100% { transform: translateY(-${size * 1.2}px) translateX(-${size * 0.24}px) rotate(400deg) scale(0.12); opacity: 0; }
        }
        @keyframes ojpv4-p2-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(120deg) scale(1.1); opacity: 0.92; }
          100% { transform: translateY(-${size * 1.5}px) translateX(${size * 0.3}px) rotate(480deg) scale(0.08); opacity: 0; }
        }
        @keyframes ojpv4-p3-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(180deg) scale(0.85); opacity: 0.8; }
          100% { transform: translateY(-${size * 1.1}px) translateX(-${size * 0.14}px) rotate(520deg) scale(0.15); opacity: 0; }
        }
        @keyframes ojpv4-p4-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(240deg) scale(1.05); opacity: 0.88; }
          100% { transform: translateY(-${size * 1.6}px) translateX(${size * 0.34}px) rotate(620deg) scale(0.1); opacity: 0; }
        }
        @keyframes ojpv4-p5-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(300deg) scale(0.95); opacity: 0.86; }
          100% { transform: translateY(-${size * 1.3}px) translateX(-${size * 0.28}px) rotate(450deg) scale(0.13); opacity: 0; }
        }

        /* ── Avatar border glow pulse ── */
        @keyframes ojpv4-border-${uid} {
          0%, 100% { box-shadow: 0 0 0 ${Math.max(1.5, size * 0.03)}px rgba(99,102,241,0.7), 0 0 0 ${Math.max(2.5, size * 0.05)}px rgba(251,191,36,0.35); }
          50%       { box-shadow: 0 0 0 ${Math.max(2, size * 0.04)}px rgba(251,191,36,0.85), 0 0 0 ${Math.max(3.5, size * 0.07)}px rgba(99,102,241,0.4); }
        }
      `}</style>

      {/* ── Outer canvas: holds all animation layers, centered on avatar ── */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: -offset,
        left: -offset,
        width: outerSize,
        height: outerSize,
        pointerEvents: 'none',
        zIndex: 0,
      }}>

        {/* Moonlight aura glow (box-shadow on this element) */}
        <div style={{
          position: 'absolute',
          top: offset, left: offset,
          width: size, height: size,
          borderRadius: '50%',
          animation: `ojpv4-moon-${uid} 3.4s ease-in-out infinite`,
        }} />

        {/* Dragon-scale outer ring: dark teal + indigo, clockwise slow */}
        <div style={{
          position: 'absolute',
          top: offset - size * 0.06,
          left: offset - size * 0.06,
          width: size * 1.12,
          height: size * 1.12,
          borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(20,184,166,0.7) 10%, rgba(99,102,241,0.6) 22%, transparent 36%, rgba(20,184,166,0.65) 52%, rgba(139,92,246,0.55) 68%, transparent 80%, rgba(20,184,166,0.6) 94%, transparent 100%)',
          animation: `ojpv4-r1-${uid} 5s linear infinite`,
          // Mask out the center so only the ring border is visible
          WebkitMaskImage: `radial-gradient(circle, transparent ${42}%, black ${44}%, black ${50}%, transparent ${52}%)`,
          maskImage: `radial-gradient(circle, transparent ${42}%, black ${44}%, black ${50}%, transparent ${52}%)`,
        }} />

        {/* Middle ring: crimson + gold, counter-clockwise */}
        <div style={{
          position: 'absolute',
          top: offset - size * 0.1,
          left: offset - size * 0.1,
          width: size * 1.2,
          height: size * 1.2,
          borderRadius: '50%',
          background: 'conic-gradient(from 45deg, transparent 0%, rgba(220,38,38,0.65) 14%, rgba(251,191,36,0.6) 28%, transparent 42%, rgba(234,88,12,0.7) 62%, rgba(251,191,36,0.55) 78%, transparent 90%, rgba(220,38,38,0.6) 100%)',
          animation: `ojpv4-r2-${uid} 3.2s linear infinite`,
          WebkitMaskImage: `radial-gradient(circle, transparent ${40}%, black ${42}%, black ${50}%, transparent ${52}%)`,
          maskImage: `radial-gradient(circle, transparent ${40}%, black ${42}%, black ${50}%, transparent ${52}%)`,
        }} />

        {/* Dragon pearl orbs: gold / violet / rose — orbit outside avatar */}
        {[
          { anim: `ojpv4-orb1-${uid}`, color: '#fbbf24', shadow: 'rgba(251,191,36,1)',     dur: '2.0s', sz: Math.max(4, size * 0.085) },
          { anim: `ojpv4-orb2-${uid}`, color: '#a78bfa', shadow: 'rgba(167,139,250,0.95)', dur: '2.0s', sz: Math.max(3, size * 0.07) },
          { anim: `ojpv4-orb3-${uid}`, color: '#fb7185', shadow: 'rgba(251,113,133,0.95)', dur: '2.0s', sz: Math.max(3, size * 0.075) },
        ].map((p, i) => (
          <div key={i} style={{
            position: 'absolute',
            top: outerR,
            left: outerR,
            width: p.sz,
            height: p.sz,
            marginTop: -p.sz / 2,
            marginLeft: -p.sz / 2,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 5px 2px ${p.shadow}, 0 0 12px 5px ${p.shadow.replace('1)', '0.45)').replace('0.95)', '0.42)')}`,
            animation: `${p.anim} ${p.dur} linear infinite`,
          }} />
        ))}

        {/* Sakura petals: start from bottom edge of avatar, rise upward */}
        {[
          { x: offset + size * 0.18, delay: '0s',   dur: '2.7s', color: 'rgba(251,207,232,0.92)' },
          { x: offset + size * 0.32, delay: '0.5s', dur: '3.1s', color: 'rgba(255,255,255,0.85)' },
          { x: offset + size * 0.50, delay: '1.0s', dur: '2.4s', color: 'rgba(253,164,175,0.9)' },
          { x: offset + size * 0.66, delay: '1.5s', dur: '3.3s', color: 'rgba(251,207,232,0.88)' },
          { x: offset + size * 0.80, delay: '0.3s', dur: '2.9s', color: 'rgba(255,255,255,0.82)' },
          { x: offset + size * 0.44, delay: '1.8s', dur: '2.2s', color: 'rgba(253,164,175,0.85)' },
        ].map((p, i) => (
          <div key={i} style={{
            position: 'absolute',
            bottom: offset - size * 0.04,
            left: p.x,
            width: Math.max(3, size * 0.07),
            height: Math.max(3, size * 0.07),
            borderRadius: '50% 0 50% 0',
            background: p.color,
            boxShadow: `0 0 3px 1px rgba(253,164,175,0.55)`,
            animation: `ojpv4-p${i}-${uid} ${p.dur} ease-out ${p.delay} infinite`,
          }} />
        ))}
      </div>

      {/* ── Avatar image: always on top (zIndex: 1) ── */}
      <div style={{
        position: 'absolute', inset: 0,
        borderRadius: '50%',
        overflow: 'hidden',
        zIndex: 1,
        animation: `ojpv4-border-${uid} 2.6s ease-in-out infinite`,
      }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_japanese_v2_0098554b.png"
          alt="Обсидиан Японские мотивы"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover', objectPosition: '47.5% 47.5%',
            display: 'block',
          }}
          draggable={false}
        />
        {/* Very subtle inner vignette — does NOT cover the face */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, transparent 55%, rgba(15,10,40,0.35) 100%)',
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
