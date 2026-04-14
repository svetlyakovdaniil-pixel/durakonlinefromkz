import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ObsidianEgyptianAvatar — Anubis reborn as obsidian deity of death.
 * Season: Египетские боги (Season 2) | Rank: Обсидиан (highest rank)
 * Animation: death energy pulse + hieroglyph rotation + golden void + eye of ra glow
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function ObsidianEgyptianAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes oea-pulse-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(139,92,246,0.8), 0 0 18px 7px rgba(180,130,20,0.4), 0 0 36px 14px rgba(109,40,217,0.3); }
          50%  { box-shadow: 0 0 18px 8px rgba(167,139,250,1), 0 0 32px 13px rgba(212,175,55,0.6), 0 0 55px 22px rgba(139,92,246,0.45); }
          100% { box-shadow: 0 0 8px 3px rgba(139,92,246,0.8), 0 0 18px 7px rgba(180,130,20,0.4), 0 0 36px 14px rgba(109,40,217,0.3); }
        }
        @keyframes oea-rotate-cw-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes oea-rotate-ccw-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes oea-shimmer-${uid} {
          0%   { opacity: 0; transform: translateX(-120%) skewX(-15deg); }
          40%  { opacity: 0.55; }
          60%  { opacity: 0.55; }
          100% { opacity: 0; transform: translateX(220%) skewX(-15deg); }
        }
        @keyframes oea-eye-${uid} {
          0%, 100% { opacity: 0.6; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.6); }
        }
      `}</style>

      {/* Outer rotating ring — gold/violet */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(2, size * 0.05),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.025)}px solid transparent`,
        borderTopColor: 'rgba(212,175,55,0.9)',
        borderRightColor: 'rgba(139,92,246,0.7)',
        borderBottomColor: 'rgba(212,175,55,0.5)',
        borderLeftColor: 'rgba(109,40,217,0.8)',
        animation: `oea-rotate-cw-${uid} 4s linear infinite`,
        pointerEvents: 'none',
      }} />
      {/* Inner counter-rotating ring */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(1, size * 0.02),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.015)}px solid transparent`,
        borderTopColor: 'rgba(139,92,246,0.5)',
        borderBottomColor: 'rgba(212,175,55,0.6)',
        animation: `oea-rotate-ccw-${uid} 2.5s linear infinite`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `oea-pulse-${uid} 2.8s ease-in-out infinite`,
      }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_egyptian_gods-HwZuAJipid5wMPLwE9jfDN.webp"
          alt="Обсидиан Египетские боги"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, display: 'block' }}
          draggable={false}
        />
        {/* Gold-violet shimmer */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'linear-gradient(115deg, transparent 35%, rgba(212,175,55,0.3) 48%, rgba(139,92,246,0.3) 52%, transparent 65%)',
          animation: `oea-shimmer-${uid} 3s ease-in-out infinite`,
        }} />
        {/* Dark vignette */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 40%, transparent 35%, rgba(76,29,149,0.4) 100%)',
        }} />
        {/* Eye of Ra glow */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '28%', left: '48%',
          width: size * 0.11, height: size * 0.11, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,220,80,1), rgba(212,175,55,0.5))',
          boxShadow: `0 0 ${size * 0.12}px ${size * 0.07}px rgba(212,175,55,0.8)`,
          animation: `oea-eye-${uid} 1.8s ease-in-out infinite`,
        }} />
      </div>
    </div>
  );
}
