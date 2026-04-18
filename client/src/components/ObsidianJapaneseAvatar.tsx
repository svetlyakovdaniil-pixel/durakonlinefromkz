import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ObsidianJapaneseAvatar — "Sakura Void" v5
 * Season: Японские мотивы (Season 9) | Rank: Обсидиан (highest rank)
 *
 * Animation (same pattern as ObsidianKazakhAvatar — proven approach):
 *   - Outer orbit ring 1: slow CW indigo-gold (inset: -7%)
 *   - Orbit ring 2: medium CCW crimson-gold (inset: -3%)
 *   - Orbit ring 3: fast CW violet (inset: +6%, inside edge)
 *   - 4 expanding wave rings (staggered)
 *   - 3 orbiting pearl dots: gold / rose / violet
 *   - 6 rising sakura petal particles
 *   - Avatar: pulse aura (indigo-gold), shimmer sweep, lightning flash, vignette, torii glow
 */
export function ObsidianJapaneseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const r = size / 2;

  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        /* ── Moonlit aura pulse: indigo → gold → silver ── */
        @keyframes ojp5-pulse-${uid} {
          0%   { box-shadow: 0 0 10px 4px rgba(99,102,241,0.9), 0 0 22px 9px rgba(67,56,202,0.6), 0 0 45px 18px rgba(30,27,75,0.4), 0 0 70px 28px rgba(251,191,36,0.15); transform: scale(1); }
          25%  { box-shadow: 0 0 24px 10px rgba(199,210,254,1), 0 0 46px 19px rgba(129,140,248,0.85), 0 0 78px 32px rgba(67,56,202,0.55), 0 0 108px 44px rgba(251,191,36,0.28); transform: scale(1.045); }
          50%  { box-shadow: 0 0 10px 4px rgba(99,102,241,0.9), 0 0 22px 9px rgba(67,56,202,0.6), 0 0 45px 18px rgba(30,27,75,0.4), 0 0 70px 28px rgba(251,191,36,0.15); transform: scale(1); }
          75%  { box-shadow: 0 0 18px 8px rgba(251,191,36,0.9), 0 0 38px 16px rgba(234,88,12,0.65), 0 0 65px 27px rgba(30,27,75,0.5), 0 0 92px 38px rgba(99,102,241,0.22); transform: scale(1.03); }
          100% { box-shadow: 0 0 10px 4px rgba(99,102,241,0.9), 0 0 22px 9px rgba(67,56,202,0.6), 0 0 45px 18px rgba(30,27,75,0.4), 0 0 70px 28px rgba(251,191,36,0.15); transform: scale(1); }
        }

        /* ── Orbit rings ── */
        @keyframes ojp5-orbit1-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ojp5-orbit2-${uid} { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes ojp5-orbit3-${uid} { from { transform: rotate(30deg); } to { transform: rotate(390deg); } }

        /* ── Expanding wave rings ── */
        @keyframes ojp5-wave-${uid} {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.6); opacity: 0; }
        }

        /* ── Shimmer sweep ── */
        @keyframes ojp5-shimmer-${uid} {
          0%   { opacity: 0; transform: translateX(-130%) skewX(-20deg); }
          35%  { opacity: 0.55; }
          65%  { opacity: 0.55; }
          100% { opacity: 0; transform: translateX(230%) skewX(-20deg); }
        }

        /* ── Lightning flash ── */
        @keyframes ojp5-lightning-${uid} {
          0%, 82%, 100% { opacity: 0; }
          85%            { opacity: 1; }
          88%            { opacity: 0.25; }
          91%            { opacity: 0.85; }
          94%            { opacity: 0; }
        }

        /* ── Sakura petal particles ── */
        @keyframes ojp5-petal-${uid} {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-${size * 0.65}px) scale(0); opacity: 0; }
        }

        /* ── Torii gate glow ── */
        @keyframes ojp5-torii-${uid} {
          0%, 100% { opacity: 0.5; transform: scale(1) translateY(0); }
          50%       { opacity: 0.9; transform: scale(1.15) translateY(-1px); }
        }

        /* ── 3 orbiting pearl dots ── */
        @keyframes ojp5-dot1-${uid} {
          from { transform: rotate(0deg) translateX(${r * 0.65}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${r * 0.65}px) rotate(-360deg); }
        }
        @keyframes ojp5-dot2-${uid} {
          from { transform: rotate(120deg) translateX(${r * 0.65}px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(${r * 0.65}px) rotate(-480deg); }
        }
        @keyframes ojp5-dot3-${uid} {
          from { transform: rotate(240deg) translateX(${r * 0.65}px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(${r * 0.65}px) rotate(-600deg); }
        }
      `}</style>

      {/* ── Outer orbit ring 1: slow CW indigo-gold ── */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(3, size * 0.07),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.022)}px solid transparent`,
        borderTopColor: 'rgba(199,210,254,0.95)',
        borderRightColor: 'rgba(99,102,241,0.4)',
        borderBottomColor: 'rgba(251,191,36,0.75)',
        borderLeftColor: 'rgba(67,56,202,0.3)',
        animation: `ojp5-orbit1-${uid} 5s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* ── Orbit ring 2: medium CCW crimson-gold ── */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(1, size * 0.03),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.018)}px solid transparent`,
        borderTopColor: 'rgba(220,38,38,0.75)',
        borderRightColor: 'rgba(251,191,36,0.6)',
        borderBottomColor: 'rgba(220,38,38,0.45)',
        borderLeftColor: 'rgba(99,102,241,0.55)',
        animation: `ojp5-orbit2-${uid} 3.5s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* ── Orbit ring 3: fast CW bright violet (inner edge) ── */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: Math.max(1, size * 0.06),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.015)}px solid transparent`,
        borderTopColor: 'rgba(167,139,250,0.85)',
        borderBottomColor: 'rgba(251,191,36,0.4)',
        animation: `ojp5-orbit3-${uid} 2s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* ── 4 expanding wave rings (staggered) ── */}
      {[0, 0.5, 1.0, 1.5].map((delay, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `${Math.max(1, size * 0.012)}px solid rgba(99,102,241,${0.65 - i * 0.1})`,
          animation: `ojp5-wave-${uid} 2.2s ease-out ${delay}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* ── 3 orbiting pearl dots: gold / rose / violet ── */}
      {[
        { anim: `ojp5-dot1-${uid}`, color: 'rgba(251,191,36,0.95)',   shadow: 'rgba(251,191,36,0.8)' },
        { anim: `ojp5-dot2-${uid}`, color: 'rgba(251,113,133,0.95)',  shadow: 'rgba(251,113,133,0.75)' },
        { anim: `ojp5-dot3-${uid}`, color: 'rgba(167,139,250,0.95)',  shadow: 'rgba(167,139,250,0.75)' },
      ].map((p, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', top: '50%', left: '50%',
          width: Math.max(3, size * 0.07), height: Math.max(3, size * 0.07),
          marginTop: -Math.max(1.5, size * 0.035), marginLeft: -Math.max(1.5, size * 0.035),
          borderRadius: '50%',
          background: p.color,
          boxShadow: `0 0 ${size * 0.06}px ${size * 0.04}px ${p.shadow}`,
          animation: `${p.anim} 2s linear infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* ── Rising sakura petal particles ── */}
      {[
        { left: '18%', delay: '0s',   dur: '2.2s', color: 'rgba(251,207,232,0.95)' },
        { left: '50%', delay: '0.7s', dur: '1.8s', color: 'rgba(255,255,255,0.9)' },
        { left: '75%', delay: '1.4s', dur: '2.5s', color: 'rgba(253,164,175,0.95)' },
        { left: '35%', delay: '0.3s', dur: '2.0s', color: 'rgba(251,207,232,0.9)' },
        { left: '62%', delay: '1.1s', dur: '1.6s', color: 'rgba(255,255,255,0.85)' },
        { left: '28%', delay: '1.8s', dur: '2.3s', color: 'rgba(253,164,175,0.9)' },
      ].map((p, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', bottom: '5%', left: p.left,
          width: Math.max(2, size * 0.05), height: Math.max(2, size * 0.05),
          borderRadius: '50% 0 50% 0',
          background: p.color,
          boxShadow: `0 0 ${size * 0.04}px ${size * 0.025}px rgba(253,164,175,0.7)`,
          animation: `ojp5-petal-${uid} ${p.dur} ease-out ${p.delay} infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* ── Avatar container: pulse aura + overflow:hidden ── */}
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `ojp5-pulse-${uid} 2.4s ease-in-out infinite`,
      }}>
        <img
          src="/assets/static/obsidian_japanese_v2_0098554b.png"
          alt="Обсидиан Японские мотивы"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: '47.5% 47.5%', display: 'block' }}
          draggable={false}
        />

        {/* Indigo-gold shimmer sweep */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'linear-gradient(115deg, transparent 30%, rgba(99,102,241,0.22) 45%, rgba(251,191,36,0.38) 55%, transparent 70%)',
          animation: `ojp5-shimmer-${uid} 3s ease-in-out infinite`,
        }} />

        {/* Lightning flash (moonlight burst) */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 58% 28%, rgba(199,210,254,0.65), transparent 58%)',
          animation: `ojp5-lightning-${uid} 4.2s ease-in-out infinite`,
        }} />

        {/* Deep void vignette */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 45%, transparent 25%, rgba(15,10,40,0.52) 100%)',
        }} />

        {/* Torii gate glow at top */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '4%', left: '28%',
          width: size * 0.44, height: size * 0.2, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(220,38,38,0.55), transparent 70%)',
          animation: `ojp5-torii-${uid} 2.2s ease-in-out infinite`,
        }} />
      </div>
    </div>
  );
}
