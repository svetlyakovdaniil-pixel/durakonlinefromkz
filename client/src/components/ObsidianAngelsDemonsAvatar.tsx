import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ObsidianAngelsDemonsAvatar — Supreme obsidian arbiter beyond heaven and hell.
 * Season: Ангелы и Демоны (Season 12) | Rank: Обсидиан (highest rank)
 * Animation: divine-infernal duality pulse + wing shadow flicker + heaven-hell split shimmer
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function ObsidianAngelsDemonsAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes oada-duality-${uid} {
          0%   { box-shadow: 0 0 10px 4px rgba(139,92,246,0.9), 0 0 22px 9px rgba(109,40,217,0.6), 0 0 44px 18px rgba(76,29,149,0.35); }
          25%  { box-shadow: 0 0 18px 8px rgba(200,180,255,1), 0 0 36px 16px rgba(139,92,246,0.8), 0 0 65px 28px rgba(109,40,217,0.5); }
          50%  { box-shadow: 0 0 14px 6px rgba(220,80,80,0.7), 0 0 28px 12px rgba(180,40,40,0.5), 0 0 55px 22px rgba(139,92,246,0.4); }
          75%  { box-shadow: 0 0 22px 10px rgba(167,139,250,1), 0 0 44px 20px rgba(139,92,246,0.85), 0 0 75px 32px rgba(109,40,217,0.55); }
          100% { box-shadow: 0 0 10px 4px rgba(139,92,246,0.9), 0 0 22px 9px rgba(109,40,217,0.6), 0 0 44px 18px rgba(76,29,149,0.35); }
        }
        @keyframes oada-rotate-cw-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes oada-rotate-ccw-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes oada-split-${uid} {
          0%   { opacity: 0.3; background-position: 0% 50%; }
          50%  { opacity: 0.6; background-position: 100% 50%; }
          100% { opacity: 0.3; background-position: 0% 50%; }
        }
        @keyframes oada-eye-divine-${uid} {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.5); }
        }
        @keyframes oada-eye-infernal-${uid} {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 0.9; transform: scale(1.4); }
        }
      `}</style>

      {/* Outer divine ring (violet/white) */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(2, size * 0.055),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.025)}px solid transparent`,
        borderTopColor: 'rgba(200,180,255,0.95)',
        borderRightColor: 'rgba(139,92,246,0.5)',
        borderBottomColor: 'rgba(220,80,80,0.6)',
        borderLeftColor: 'rgba(109,40,217,0.7)',
        animation: `oada-rotate-cw-${uid} 3s linear infinite`,
        pointerEvents: 'none',
      }} />
      {/* Inner infernal ring (red/violet) */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(1, size * 0.02),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.015)}px solid transparent`,
        borderTopColor: 'rgba(220,80,80,0.7)',
        borderBottomColor: 'rgba(200,180,255,0.7)',
        animation: `oada-rotate-ccw-${uid} 2s linear infinite`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `oada-duality-${uid} 3s ease-in-out infinite`,
      }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/obsidian_angels_demons-Jb4TqRyJ4bRGFfWdknwUSR.webp"
          alt="Обсидиан Ангелы и Демоны"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, display: 'block' }}
          draggable={false}
        />
        {/* Heaven-hell split shimmer */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'linear-gradient(180deg, rgba(200,180,255,0.25) 0%, transparent 40%, transparent 60%, rgba(220,80,80,0.2) 100%)',
          backgroundSize: '200% 200%',
          animation: `oada-split-${uid} 4s ease-in-out infinite`,
        }} />
        {/* Void vignette */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 45%, transparent 25%, rgba(76,29,149,0.4) 100%)',
        }} />
        {/* Divine eye (left) */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '35%', left: '32%',
          width: size * 0.1, height: size * 0.1, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220,210,255,1), rgba(167,139,250,0.4))',
          boxShadow: `0 0 ${size * 0.1}px ${size * 0.06}px rgba(200,180,255,0.9)`,
          animation: `oada-eye-divine-${uid} 2s ease-in-out infinite`,
        }} />
        {/* Infernal eye (right) */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '35%', left: '56%',
          width: size * 0.1, height: size * 0.1, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,120,120,1), rgba(200,50,50,0.4))',
          boxShadow: `0 0 ${size * 0.1}px ${size * 0.06}px rgba(220,80,80,0.9)`,
          animation: `oada-eye-infernal-${uid} 2.3s ease-in-out 0.5s infinite`,
        }} />
      </div>
    </div>
  );
}
