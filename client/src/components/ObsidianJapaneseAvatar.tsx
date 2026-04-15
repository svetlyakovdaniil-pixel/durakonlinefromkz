import React from 'react';

interface Props { size?: number; className?: string; }

/**
 * ObsidianJapaneseAvatar — "Ink Dragon & Moonlit Sakura" v3
 * Season: Японские мотивы (Season 9) | Rank: Обсидиан
 *
 * New animation concept (premium, thematic):
 *   - Moonlight pulse aura: silver-blue → indigo → gold cycling glow
 *   - Portrait: gentle float + ink-wash shimmer sweep (indigo/gold)
 *   - Deep obsidian vignette with torii gate silhouette at top
 *   - Outer dragon-scale ring: dark teal + indigo (clockwise, slow)
 *   - Middle ring: crimson + gold (counter-clockwise)
 *   - Inner ring: indigo + gold (fast clockwise)
 *   - 3 orbital orbs: gold / violet / rose — representing dragon pearls
 *   - 6 sakura petals: soft pink/white, rising and fading
 */
export function ObsidianJapaneseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const r = size / 2;

  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        /* ── Moonlight pulse aura: silver-blue → indigo → gold ── */
        @keyframes ojpv3-moon-${uid} {
          0%, 100% {
            box-shadow:
              0 0 6px 2px rgba(148,163,184,0.75),
              0 0 18px 7px rgba(99,102,241,0.55),
              0 0 38px 14px rgba(30,27,75,0.65),
              0 0 65px 26px rgba(99,102,241,0.22);
          }
          35% {
            box-shadow:
              0 0 12px 5px rgba(199,210,254,0.9),
              0 0 30px 12px rgba(129,140,248,0.7),
              0 0 60px 24px rgba(49,46,129,0.55),
              0 0 95px 38px rgba(99,102,241,0.28);
          }
          68% {
            box-shadow:
              0 0 10px 4px rgba(251,191,36,0.85),
              0 0 24px 10px rgba(234,88,12,0.6),
              0 0 50px 20px rgba(30,27,75,0.6),
              0 0 82px 33px rgba(251,191,36,0.22);
          }
        }

        /* ── Portrait: gentle float ── */
        @keyframes ojpv3-float-${uid} {
          0%, 100% { transform: scale(1) translateY(0px) rotate(-0.3deg); }
          30%       { transform: scale(1.02) translateY(-2px) rotate(0.2deg); }
          65%       { transform: scale(1.015) translateY(-1px) rotate(-0.1deg); }
        }

        /* ── Ink-wash shimmer sweep ── */
        @keyframes ojpv3-ink-${uid} {
          0%   { background-position: 220% 50%; opacity: 0.5; }
          50%  { background-position: -220% 50%; opacity: 0.72; }
          100% { background-position: 220% 50%; opacity: 0.5; }
        }

        /* ── Rings ── */
        @keyframes ojpv3-r1-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ojpv3-r2-${uid} { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes ojpv3-r3-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

        /* ── Dragon pearl orbits ── */
        @keyframes ojpv3-orb1-${uid} {
          from { transform: rotate(0deg) translateX(${r * 0.78}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${r * 0.78}px) rotate(-360deg); }
        }
        @keyframes ojpv3-orb2-${uid} {
          from { transform: rotate(128deg) translateX(${r * 0.75}px) rotate(-128deg); }
          to   { transform: rotate(488deg) translateX(${r * 0.75}px) rotate(-488deg); }
        }
        @keyframes ojpv3-orb3-${uid} {
          from { transform: rotate(248deg) translateX(${r * 0.72}px) rotate(-248deg); }
          to   { transform: rotate(608deg) translateX(${r * 0.72}px) rotate(-608deg); }
        }

        /* ── Sakura petals ── */
        @keyframes ojpv3-p0-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 0.92; }
          100% { transform: translateY(-${size * 1.15}px) translateX(${size * 0.18}px) rotate(340deg) scale(0.1); opacity: 0; }
        }
        @keyframes ojpv3-p1-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(60deg) scale(0.9); opacity: 0.85; }
          100% { transform: translateY(-${size * 0.95}px) translateX(-${size * 0.22}px) rotate(400deg) scale(0.12); opacity: 0; }
        }
        @keyframes ojpv3-p2-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(120deg) scale(1.1); opacity: 0.95; }
          100% { transform: translateY(-${size * 1.25}px) translateX(${size * 0.28}px) rotate(480deg) scale(0.08); opacity: 0; }
        }
        @keyframes ojpv3-p3-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(180deg) scale(0.85); opacity: 0.8; }
          100% { transform: translateY(-${size * 0.85}px) translateX(-${size * 0.12}px) rotate(520deg) scale(0.15); opacity: 0; }
        }
        @keyframes ojpv3-p4-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(240deg) scale(1.05); opacity: 0.9; }
          100% { transform: translateY(-${size * 1.35}px) translateX(${size * 0.32}px) rotate(620deg) scale(0.1); opacity: 0; }
        }
        @keyframes ojpv3-p5-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(300deg) scale(0.95); opacity: 0.88; }
          100% { transform: translateY(-${size * 1.05}px) translateX(-${size * 0.27}px) rotate(450deg) scale(0.13); opacity: 0; }
        }

        /* ── Torii gate silhouette pulse ── */
        @keyframes ojpv3-torii-${uid} {
          0%, 100% { opacity: 0.18; }
          50%       { opacity: 0.38; }
        }
      `}</style>

      {/* Outer moonlight aura container */}
      <div style={{
        width: size, height: size, position: 'relative',
        borderRadius: '50%',
        animation: `ojpv3-moon-${uid} 3.4s ease-in-out infinite`,
      }}>

        {/* Portrait image */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', overflow: 'hidden', zIndex: 2 }}>
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_japanese_v2_0098554b.png"
            alt="Обсидиан Японские мотивы"
            style={{
              width: '100%', height: '100%', objectFit: 'cover', objectPosition: '47.5% 47.5%',
              display: 'block',
              animation: `ojpv3-float-${uid} 4.2s ease-in-out infinite`,
            }}
            draggable={false}
          />

          {/* Ink-wash shimmer overlay (indigo/gold diagonal) */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'linear-gradient(115deg, transparent 15%, rgba(99,102,241,0.22) 35%, rgba(251,191,36,0.3) 50%, rgba(99,102,241,0.18) 65%, transparent 85%)',
            backgroundSize: '320% 100%',
            animation: `ojpv3-ink-${uid} 3.8s ease-in-out infinite`,
          }} />

          {/* Deep obsidian vignette */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 50%, transparent 28%, rgba(15,10,40,0.58) 100%)',
          }} />

          {/* Torii gate silhouette — decorative crimson arc at top */}
          <div aria-hidden="true" style={{
            position: 'absolute', top: '6%', left: '18%', right: '18%', height: '16%',
            borderTop: `${Math.max(2, size * 0.025)}px solid rgba(220,38,38,0.6)`,
            borderLeft: `${Math.max(2, size * 0.025)}px solid rgba(220,38,38,0.45)`,
            borderRight: `${Math.max(2, size * 0.025)}px solid rgba(220,38,38,0.45)`,
            borderRadius: '50% 50% 0 0',
            animation: `ojpv3-torii-${uid} 2.8s ease-in-out infinite`,
          }} />
        </div>

        {/* Dragon-scale outer ring: dark teal + indigo, clockwise slow */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '-4%', borderRadius: '50%', zIndex: 3,
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(20,184,166,0.65) 12%, rgba(99,102,241,0.55) 26%, transparent 40%, rgba(20,184,166,0.6) 56%, rgba(139,92,246,0.5) 72%, transparent 84%, rgba(20,184,166,0.55) 96%, transparent 100%)',
          animation: `ojpv3-r1-${uid} 5s linear infinite`,
          pointerEvents: 'none',
        }} />

        {/* Middle ring: crimson + gold, counter-clockwise */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '8%', borderRadius: '50%', zIndex: 3,
          background: 'conic-gradient(from 45deg, transparent 0%, rgba(220,38,38,0.62) 16%, rgba(251,191,36,0.58) 32%, transparent 46%, rgba(234,88,12,0.68) 66%, rgba(251,191,36,0.52) 82%, transparent 93%, rgba(220,38,38,0.58) 100%)',
          animation: `ojpv3-r2-${uid} 3s linear infinite`,
          pointerEvents: 'none',
        }} />

        {/* Innermost fast ring: indigo + gold */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '22%', borderRadius: '50%', zIndex: 3,
          background: 'conic-gradient(from 90deg, transparent 0%, rgba(251,191,36,0.72) 18%, rgba(99,102,241,0.62) 36%, transparent 50%, rgba(251,191,36,0.68) 68%, rgba(139,92,246,0.58) 85%, transparent 100%)',
          animation: `ojpv3-r3-${uid} 1.8s linear infinite`,
          pointerEvents: 'none',
        }} />

        {/* Dragon pearl orbs: gold / violet / rose */}
        {[
          { anim: `ojpv3-orb1-${uid}`, color: '#fbbf24', shadow: 'rgba(251,191,36,1)',    dur: '2.0s', sz: Math.max(4, size * 0.088) },
          { anim: `ojpv3-orb2-${uid}`, color: '#a78bfa', shadow: 'rgba(167,139,250,0.95)', dur: '2.0s', sz: Math.max(3, size * 0.072) },
          { anim: `ojpv3-orb3-${uid}`, color: '#fb7185', shadow: 'rgba(251,113,133,0.95)', dur: '2.0s', sz: Math.max(3, size * 0.078) },
        ].map((p, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', top: '50%', left: '50%',
            width: p.sz, height: p.sz,
            marginTop: -p.sz / 2, marginLeft: -p.sz / 2,
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 6px 3px ${p.shadow}, 0 0 14px 6px ${p.shadow.replace('1)', '0.48)').replace('0.95)', '0.44)')}`,
            animation: `${p.anim} ${p.dur} linear infinite`,
            zIndex: 4,
          }} />
        ))}

        {/* Sakura petals: soft pink / white, rising */}
        {[
          { x: '18%', delay: '0s',    dur: '2.7s', color: 'rgba(251,207,232,0.92)' },
          { x: '32%', delay: '0.5s',  dur: '3.1s', color: 'rgba(255,255,255,0.85)' },
          { x: '50%', delay: '1.0s',  dur: '2.4s', color: 'rgba(253,164,175,0.9)' },
          { x: '66%', delay: '1.5s',  dur: '3.3s', color: 'rgba(251,207,232,0.88)' },
          { x: '80%', delay: '0.3s',  dur: '2.9s', color: 'rgba(255,255,255,0.82)' },
          { x: '44%', delay: '1.8s',  dur: '2.2s', color: 'rgba(253,164,175,0.85)' },
        ].map((p, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute',
            bottom: '6%',
            left: p.x,
            width: Math.max(3, size * 0.075),
            height: Math.max(3, size * 0.075),
            borderRadius: '50% 0 50% 0',
            background: p.color,
            boxShadow: `0 0 4px 2px rgba(253,164,175,0.6)`,
            animation: `ojpv3-p${i}-${uid} ${p.dur} ease-out ${p.delay} infinite`,
            zIndex: 5,
          }} />
        ))}
      </div>
    </div>
  );
}
