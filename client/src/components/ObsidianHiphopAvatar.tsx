import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ObsidianHiphopAvatar — Supernatural hip-hop deity of the underground.
 * Season: Хип-хоп 90-х (Season 11) | Rank: Обсидиан (highest rank)
 * Animation: beat pulse + shadow energy waves + void mic glow + crowd shadow flicker
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function ObsidianHiphopAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes oha-beat-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(139,92,246,0.8), 0 0 18px 7px rgba(109,40,217,0.5), 0 0 36px 14px rgba(76,29,149,0.3); transform: scale(1); }
          10%  { box-shadow: 0 0 20px 9px rgba(167,139,250,1), 0 0 38px 16px rgba(139,92,246,0.8), 0 0 65px 27px rgba(109,40,217,0.5); transform: scale(1.04); }
          20%  { box-shadow: 0 0 8px 3px rgba(139,92,246,0.7), 0 0 18px 7px rgba(109,40,217,0.4), 0 0 36px 14px rgba(76,29,149,0.25); transform: scale(1); }
          35%  { box-shadow: 0 0 16px 7px rgba(180,150,255,0.95), 0 0 32px 14px rgba(139,92,246,0.7), 0 0 56px 23px rgba(109,40,217,0.45); transform: scale(1.03); }
          50%  { box-shadow: 0 0 8px 3px rgba(139,92,246,0.8), 0 0 18px 7px rgba(109,40,217,0.5), 0 0 36px 14px rgba(76,29,149,0.3); transform: scale(1); }
          100% { box-shadow: 0 0 8px 3px rgba(139,92,246,0.8), 0 0 18px 7px rgba(109,40,217,0.5), 0 0 36px 14px rgba(76,29,149,0.3); transform: scale(1); }
        }
        @keyframes oha-wave-${uid} {
          0%   { transform: scale(1); opacity: 0.7; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes oha-shimmer-${uid} {
          0%   { opacity: 0; transform: translateX(-120%) skewX(-15deg); }
          40%  { opacity: 0.5; }
          60%  { opacity: 0.5; }
          100% { opacity: 0; transform: translateX(220%) skewX(-15deg); }
        }
        @keyframes oha-rotate-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes oha-eye-${uid} {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.4); }
        }
      `}</style>

      {/* Rotating ring */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(2, size * 0.05),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.025)}px solid transparent`,
        borderTopColor: 'rgba(167,139,250,0.9)',
        borderRightColor: 'rgba(109,40,217,0.5)',
        borderBottomColor: 'rgba(139,92,246,0.7)',
        borderLeftColor: 'rgba(76,29,149,0.4)',
        animation: `oha-rotate-${uid} 4s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Beat wave rings */}
      {[0, 0.4, 0.8].map((delay, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `${Math.max(1, size * 0.015)}px solid rgba(139,92,246,0.5)`,
          animation: `oha-wave-${uid} 1.6s ease-out ${delay}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `oha-beat-${uid} 0.8s ease-in-out infinite`,
      }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_hiphop_90s-Rx5QAgMC5akbKfSPh2UYkY.webp"
          alt="Обсидиан Хип-хоп"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, display: 'block' }}
          draggable={false}
        />
        {/* Void shimmer */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'linear-gradient(110deg, transparent 35%, rgba(167,139,250,0.4) 50%, transparent 65%)',
          animation: `oha-shimmer-${uid} 2.5s ease-in-out infinite`,
        }} />
        {/* Vignette */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 45%, transparent 30%, rgba(76,29,149,0.4) 100%)',
        }} />
        {/* Eye glow */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '34%', left: '42%',
          width: size * 0.11, height: size * 0.11, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(180,150,255,1), rgba(139,92,246,0.4))',
          boxShadow: `0 0 ${size * 0.1}px ${size * 0.06}px rgba(139,92,246,0.9)`,
          animation: `oha-eye-${uid} 1.8s ease-in-out infinite`,
        }} />
      </div>
    </div>
  );
}
