import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ObsidianJapaneseAvatar — Dark Kitsune Spirit with sakura & gold aura.
 * Season: Японские мотивы (Season 9) | Rank: Обсидиан
 * Animation: crimson-gold pulse + sakura petals + spirit fox fire rings + shimmer sweep
 */
export function ObsidianJapaneseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const r = size / 2;

  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        /* Crimson-gold kitsune aura pulse */
        @keyframes ojp-aura-${uid} {
          0%   { box-shadow:
            0 0 8px 3px rgba(220,38,38,0.9),
            0 0 20px 8px rgba(234,88,12,0.7),
            0 0 40px 15px rgba(251,191,36,0.4),
            0 0 65px 25px rgba(220,38,38,0.2); }
          25%  { box-shadow:
            0 0 22px 10px rgba(251,191,36,1),
            0 0 44px 18px rgba(234,88,12,0.85),
            0 0 70px 28px rgba(220,38,38,0.5),
            0 0 100px 40px rgba(251,191,36,0.25); }
          50%  { box-shadow:
            0 0 14px 6px rgba(234,88,12,0.95),
            0 0 32px 13px rgba(251,191,36,0.8),
            0 0 56px 22px rgba(220,38,38,0.45),
            0 0 85px 33px rgba(234,88,12,0.2); }
          75%  { box-shadow:
            0 0 26px 12px rgba(220,38,38,1),
            0 0 50px 20px rgba(251,191,36,0.75),
            0 0 80px 32px rgba(234,88,12,0.4),
            0 0 110px 45px rgba(220,38,38,0.18); }
          100% { box-shadow:
            0 0 8px 3px rgba(220,38,38,0.9),
            0 0 20px 8px rgba(234,88,12,0.7),
            0 0 40px 15px rgba(251,191,36,0.4),
            0 0 65px 25px rgba(220,38,38,0.2); }
        }
        /* Outer gold ring — clockwise */
        @keyframes ojp-ring1-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        /* Middle crimson ring — counter */
        @keyframes ojp-ring2-${uid} { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        /* Inner gold ring — fast clockwise */
        @keyframes ojp-ring3-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        /* Floating shimmer sweep */
        @keyframes ojp-shimmer-${uid} {
          0%   { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        /* Gentle image float */
        @keyframes ojp-float-${uid} {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50%       { transform: scale(1.035) rotate(0.8deg); }
        }
        /* Sakura petal fall */
        @keyframes ojp-petal0-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(0deg) scale(1); opacity: 1; }
          100% { transform: translateY(-${size * 1.1}px) translateX(${size * 0.15}px) rotate(300deg) scale(0.2); opacity: 0; }
        }
        @keyframes ojp-petal1-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(45deg) scale(1); opacity: 0.9; }
          100% { transform: translateY(-${size * 0.9}px) translateX(-${size * 0.2}px) rotate(380deg) scale(0.15); opacity: 0; }
        }
        @keyframes ojp-petal2-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(90deg) scale(1); opacity: 0.85; }
          100% { transform: translateY(-${size * 1.2}px) translateX(${size * 0.25}px) rotate(450deg) scale(0.1); opacity: 0; }
        }
        @keyframes ojp-petal3-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(135deg) scale(1); opacity: 0.95; }
          100% { transform: translateY(-${size * 0.8}px) translateX(-${size * 0.1}px) rotate(500deg) scale(0.25); opacity: 0; }
        }
        @keyframes ojp-petal4-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(180deg) scale(1); opacity: 0.8; }
          100% { transform: translateY(-${size * 1.3}px) translateX(${size * 0.3}px) rotate(600deg) scale(0.12); opacity: 0; }
        }
        @keyframes ojp-petal5-${uid} {
          0%   { transform: translateY(0) translateX(0) rotate(225deg) scale(1); opacity: 0.9; }
          100% { transform: translateY(-${size * 1.0}px) translateX(-${size * 0.25}px) rotate(420deg) scale(0.18); opacity: 0; }
        }
        /* Fox fire orbit */
        @keyframes ojp-foxfire-${uid} {
          from { transform: rotate(0deg) translateX(${r * 0.72}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${r * 0.72}px) rotate(-360deg); }
        }
        @keyframes ojp-foxfire2-${uid} {
          from { transform: rotate(120deg) translateX(${r * 0.72}px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(${r * 0.72}px) rotate(-480deg); }
        }
        @keyframes ojp-foxfire3-${uid} {
          from { transform: rotate(240deg) translateX(${r * 0.72}px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(${r * 0.72}px) rotate(-600deg); }
        }
        /* Kitsune eye glow */
        @keyframes ojp-eye-${uid} {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.15); filter: drop-shadow(0 0 8px rgba(251,191,36,1)) drop-shadow(0 0 16px rgba(220,38,38,0.8)); }
        }
      `}</style>

      {/* Main container with aura */}
      <div style={{
        width: size, height: size, position: 'relative',
        animation: `ojp-aura-${uid} 2.2s ease-in-out infinite`,
        borderRadius: '50%',
      }}>
        {/* Image layer */}
        <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'absolute', top: 0, left: 0 }}>
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_japanese_v2_0098554b.png"
            alt="Обсидиан Японские мотивы"
            style={{
              width: '100%', height: '100%', objectFit: 'cover', objectPosition: '47.5% 47.5%',
              display: 'block',
              animation: `ojp-float-${uid} 3.5s ease-in-out infinite`,
            }}
            draggable={false}
          />
          {/* Gold shimmer sweep */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'linear-gradient(105deg, transparent 20%, rgba(251,191,36,0.25) 38%, rgba(234,88,12,0.35) 50%, rgba(251,191,36,0.2) 62%, transparent 80%)',
            backgroundSize: '200% 100%',
            animation: `ojp-shimmer-${uid} 2.8s linear infinite`,
          }} />
          {/* Dark vignette */}
          <div aria-hidden="true" style={{
            position: 'absolute', inset: 0, borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(30,0,0,0.45) 100%)',
          }} />
        </div>

        {/* Outer gold conic ring */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(251,191,36,0.5) 15%, rgba(234,88,12,0.4) 30%, transparent 50%, rgba(251,191,36,0.45) 70%, rgba(220,38,38,0.35) 85%, transparent 100%)',
          animation: `ojp-ring1-${uid} 3s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Middle crimson conic ring */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '10%', borderRadius: '50%',
          background: 'conic-gradient(from 60deg, transparent 0%, rgba(220,38,38,0.55) 20%, rgba(251,191,36,0.45) 40%, transparent 55%, rgba(234,88,12,0.5) 75%, transparent 100%)',
          animation: `ojp-ring2-${uid} 2s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Inner fast gold ring */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '25%', borderRadius: '50%',
          background: 'conic-gradient(from 120deg, transparent 0%, rgba(251,191,36,0.65) 18%, rgba(234,88,12,0.55) 35%, transparent 50%, rgba(251,191,36,0.6) 68%, transparent 85%)',
          animation: `ojp-ring3-${uid} 1.2s linear infinite`,
          pointerEvents: 'none',
        }} />

        {/* 3 fox fire orbital particles */}
        {[
          { anim: `ojp-foxfire-${uid}`,  color: '#fbbf24', shadow: 'rgba(251,191,36,0.95)', dur: '1.6s' },
          { anim: `ojp-foxfire2-${uid}`, color: '#ef4444', shadow: 'rgba(220,38,38,0.95)', dur: '1.6s' },
          { anim: `ojp-foxfire3-${uid}`, color: '#fb923c', shadow: 'rgba(234,88,12,0.95)', dur: '1.6s' },
        ].map((p, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', top: '50%', left: '50%',
            width: Math.max(4, size * 0.09), height: Math.max(4, size * 0.09),
            marginTop: -Math.max(2, size * 0.045), marginLeft: -Math.max(2, size * 0.045),
            borderRadius: '50%',
            background: p.color,
            boxShadow: `0 0 8px 4px ${p.shadow}, 0 0 16px 6px ${p.shadow.replace('0.95', '0.5')}`,
            animation: `${p.anim} ${p.dur} linear infinite`,
          }} />
        ))}

        {/* Sakura petals — 6 petals rising from bottom */}
        {[
          { x: '20%', delay: '0s',    dur: '2.4s' },
          { x: '35%', delay: '0.4s',  dur: '2.8s' },
          { x: '50%', delay: '0.8s',  dur: '2.2s' },
          { x: '65%', delay: '1.2s',  dur: '3.0s' },
          { x: '80%', delay: '0.2s',  dur: '2.6s' },
          { x: '42%', delay: '1.6s',  dur: '2.0s' },
        ].map((p, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute',
            bottom: '8%',
            left: p.x,
            width: Math.max(3, size * 0.07),
            height: Math.max(3, size * 0.07),
            borderRadius: '50% 0 50% 0',
            background: i % 3 === 0
              ? 'rgba(251,191,36,0.9)'
              : i % 3 === 1
              ? 'rgba(220,38,38,0.85)'
              : 'rgba(253,224,71,0.8)',
            boxShadow: `0 0 4px 2px rgba(251,191,36,0.6)`,
            animation: `ojp-petal${i}-${uid} ${p.dur} ease-out ${p.delay} infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
