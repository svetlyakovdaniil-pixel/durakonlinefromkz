import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * AmberJapaneseAvatar — Kitsune fox spirit in golden kimono.
 * Season: Японские мотивы (Season 9) | Rank: Янтарь
 * Animation: golden aura + falling sakura petals + slow conic spin + shimmer
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function AmberJapaneseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes ajp-aura-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(245,158,11,0.7), 0 0 18px 7px rgba(251,191,36,0.4), 0 0 32px 12px rgba(253,224,71,0.2); }
          50%  { box-shadow: 0 0 20px 9px rgba(251,191,36,0.95), 0 0 38px 15px rgba(245,158,11,0.65), 0 0 56px 22px rgba(253,224,71,0.35); }
          100% { box-shadow: 0 0 8px 3px rgba(245,158,11,0.7), 0 0 18px 7px rgba(251,191,36,0.4), 0 0 32px 12px rgba(253,224,71,0.2); }
        }
        @keyframes ajp-spin-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ajp-petal-${uid} {
          0%   { transform: translateY(-${size * 0.1}px) translateX(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.9; }
          90%  { opacity: 0.7; }
          100% { transform: translateY(${size * 0.9}px) translateX(${size * 0.2}px) rotate(180deg); opacity: 0; }
        }
        @keyframes ajp-petal2-${uid} {
          0%   { transform: translateY(-${size * 0.1}px) translateX(0) rotate(0deg); opacity: 0; }
          10%  { opacity: 0.85; }
          90%  { opacity: 0.6; }
          100% { transform: translateY(${size * 0.9}px) translateX(-${size * 0.15}px) rotate(-150deg); opacity: 0; }
        }
        @keyframes ajp-shimmer-${uid} {
          0%   { transform: translateX(-${size * 1.5}px) rotate(15deg); opacity: 0; }
          25%  { opacity: 0.4; }
          75%  { opacity: 0.4; }
          100% { transform: translateX(${size * 1.5}px) rotate(15deg); opacity: 0; }
        }
      `}</style>

      {/* Slow rotating golden ring */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(1, size * 0.04),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.03)}px solid transparent`,
        borderTopColor: 'rgba(251,191,36,0.8)',
        borderRightColor: 'rgba(253,224,71,0.4)',
        borderBottomColor: 'rgba(251,191,36,0.8)',
        borderLeftColor: 'rgba(253,224,71,0.4)',
        animation: `ajp-spin-${uid} 5s linear infinite`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `ajp-aura-${uid} 2.2s ease-in-out infinite`,
      }}>
        <img
          src="/assets/static/amber_japanese_s9_11a4e751.png"
          alt="Янтарь Японские мотивы"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: `${posX}% ${posY}%`,
            display: 'block',
          }}
          draggable={false}
        />

        {/* Golden shimmer sweep */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,210,50,0.25) 50%, transparent 70%)',
          animation: `ajp-shimmer-${uid} 3.5s ease-in-out infinite`,
          pointerEvents: 'none',
        }} />

        {/* Warm golden overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 25%, rgba(251,191,36,0.1) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Falling sakura petal particles */}
      {[
        { left: '15%', delay: '0s',   dur: '2.2s', anim: `ajp-petal-${uid}` },
        { left: '40%', delay: '0.8s', dur: '2.6s', anim: `ajp-petal2-${uid}` },
        { left: '65%', delay: '1.4s', dur: '2s',   anim: `ajp-petal-${uid}` },
        { left: '80%', delay: '0.4s', dur: '2.4s', anim: `ajp-petal2-${uid}` },
      ].map((p, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute',
          top: '0%', left: p.left,
          width: Math.max(3, size * 0.07),
          height: Math.max(2, size * 0.05),
          borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(251,191,36,0.95), rgba(253,224,71,0.5))',
          boxShadow: `0 0 ${size * 0.04}px rgba(251,191,36,0.7)`,
          animation: `${p.anim} ${p.dur} ease-in ${p.delay} infinite`,
          pointerEvents: 'none',
        }} />
      ))}
    </div>
  );
}
