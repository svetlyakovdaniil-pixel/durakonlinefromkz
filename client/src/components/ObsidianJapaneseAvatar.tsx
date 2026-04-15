import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ObsidianJapaneseAvatar — Purple void sakura with spirit dragon.
 * Season: Японские мотивы (Season 9) | Rank: Обсидиан
 * Animation: void pulse + spirit bloom + triple orbit + petal burst
 */
export function ObsidianJapaneseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  const r = size / 2;
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes ojp-void-${uid} {
          0%   { box-shadow: 0 0 10px 4px rgba(168,85,247,0.8), 0 0 24px 9px rgba(139,92,246,0.5), 0 0 44px 16px rgba(109,40,217,0.3), 0 0 70px 26px rgba(88,28,135,0.15); }
          33%  { box-shadow: 0 0 28px 12px rgba(192,132,252,1), 0 0 52px 20px rgba(168,85,247,0.75), 0 0 80px 30px rgba(139,92,246,0.45), 0 0 110px 40px rgba(109,40,217,0.2); }
          66%  { box-shadow: 0 0 16px 7px rgba(139,92,246,0.9), 0 0 36px 14px rgba(168,85,247,0.6), 0 0 60px 22px rgba(192,132,252,0.35), 0 0 90px 33px rgba(109,40,217,0.18); }
          100% { box-shadow: 0 0 10px 4px rgba(168,85,247,0.8), 0 0 24px 9px rgba(139,92,246,0.5), 0 0 44px 16px rgba(109,40,217,0.3), 0 0 70px 26px rgba(88,28,135,0.15); }
        }
        @keyframes ojp-spin-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ojp-spin-rev-${uid} { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes ojp-spin-fast-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ojp-float-${uid} {
          0%, 100% { transform: scale(1) rotate(0deg); }
          50%       { transform: scale(1.04) rotate(1.5deg); }
        }
        @keyframes ojp-orbit-${uid} {
          from { transform: rotate(0deg) translateX(${r * 0.7}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${r * 0.7}px) rotate(-360deg); }
        }
        @keyframes ojp-orbit2-${uid} {
          from { transform: rotate(120deg) translateX(${r * 0.7}px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(${r * 0.7}px) rotate(-480deg); }
        }
        @keyframes ojp-orbit3-${uid} {
          from { transform: rotate(240deg) translateX(${r * 0.7}px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(${r * 0.7}px) rotate(-600deg); }
        }
        @keyframes ojp-eye-${uid} {
          0%, 100% { opacity: 0.75; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.18); filter: drop-shadow(0 0 6px rgba(192,132,252,1)); }
        }
        @keyframes ojp-petal-${uid} {
          0%   { transform: translateY(0) rotate(0deg) scale(1); opacity: 0.9; }
          100% { transform: translateY(-${size * 0.9}px) rotate(270deg) scale(0.3); opacity: 0; }
        }
      `}</style>
      <div style={{ width: size, height: size, position: 'relative', animation: `ojp-void-${uid} 1.8s ease-in-out infinite`, borderRadius: '50%' }}>
        <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'absolute', top: 0, left: 0 }}>
          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_japanese_v2-DZqDWBFJmxUJHJJJBdnvqv.webp"
            alt="Обсидиан Японские мотивы"
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, display: 'block' }}
            draggable={false}
          />
          {/* Ghost shimmer sweep */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'linear-gradient(125deg, transparent 30%, rgba(192,132,252,0.3) 45%, rgba(139,92,246,0.5) 55%, transparent 70%)', animation: `ojp-float-${uid} 3s ease-in-out infinite` }} />
          {/* Void vignette */}
          <div aria-hidden="true" style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'radial-gradient(circle at 50% 50%, transparent 22%, rgba(20,0,50,0.5) 100%)' }} />
        </div>

        {/* Outer conic */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(168,85,247,0.38) 18%, rgba(192,132,252,0.3) 36%, transparent 55%, rgba(139,92,246,0.32) 72%, transparent 90%)',
          animation: `ojp-spin-${uid} 2.5s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Middle reverse */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '12%', borderRadius: '50%',
          background: 'conic-gradient(from 60deg, transparent 0%, rgba(192,132,252,0.45) 25%, transparent 50%, rgba(168,85,247,0.38) 75%, transparent 100%)',
          animation: `ojp-spin-rev-${uid} 1.8s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Inner fast */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: '28%', borderRadius: '50%',
          background: 'conic-gradient(from 120deg, transparent 0%, rgba(233,213,255,0.55) 20%, transparent 40%, rgba(192,132,252,0.45) 60%, transparent 80%)',
          animation: `ojp-spin-fast-${uid} 1s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* 3 orbital particles */}
        {[`ojp-orbit-${uid}`, `ojp-orbit2-${uid}`, `ojp-orbit3-${uid}`].map((anim, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', top: '50%', left: '50%',
            width: Math.max(3, size * 0.08), height: Math.max(3, size * 0.08),
            marginTop: -Math.max(1.5, size * 0.04), marginLeft: -Math.max(1.5, size * 0.04),
            borderRadius: '50%',
            background: i === 0 ? '#a855f7' : i === 1 ? '#c084fc' : '#e9d5ff',
            boxShadow: `0 0 6px 3px rgba(168,85,247,0.9)`,
            animation: `${anim} 1.5s linear infinite`,
          }} />
        ))}
        {/* Falling purple petals */}
        {[0.2, 0.45, 0.7, 0.35, 0.6].map((x, i) => (
          <div key={i} aria-hidden="true" style={{
            position: 'absolute', bottom: '5%',
            left: `${x * 100}%`,
            width: Math.max(2, size * 0.06), height: Math.max(2, size * 0.04),
            borderRadius: '50%',
            background: i % 2 === 0 ? 'rgba(168,85,247,0.85)' : 'rgba(192,132,252,0.8)',
            animation: `ojp-petal-${uid} ${2 + i * 0.5}s ease-out ${i * 0.4}s infinite`,
          }} />
        ))}
      </div>
    </div>
  );
}
