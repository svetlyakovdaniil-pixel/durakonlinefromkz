import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * AmberSpaceAvatar — Golden cosmic warrior in amber space armor.
 * Season: Космическая одиссея (Season 5) | Rank: Янтарь
 * Animation: nebula pulse + orbiting stardust + cosmic shimmer
 */
export function AmberSpaceAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes as-nebula-${uid} {
          0%   { box-shadow: 0 0 10px 4px rgba(245,158,11,0.7), 0 0 22px 9px rgba(245,158,11,0.4), 0 0 40px 16px rgba(139,92,246,0.2); }
          50%  { box-shadow: 0 0 16px 7px rgba(245,158,11,0.9), 0 0 32px 14px rgba(245,158,11,0.6), 0 0 60px 24px rgba(139,92,246,0.4); }
          100% { box-shadow: 0 0 10px 4px rgba(245,158,11,0.7), 0 0 22px 9px rgba(245,158,11,0.4), 0 0 40px 16px rgba(139,92,246,0.2); }
        }
        @keyframes as-orbit1-${uid} {
          from { transform: rotate(0deg) translateX(${size * 0.52}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${size * 0.52}px) rotate(-360deg); }
        }
        @keyframes as-orbit2-${uid} {
          from { transform: rotate(180deg) translateX(${size * 0.58}px) rotate(-180deg); }
          to   { transform: rotate(540deg) translateX(${size * 0.58}px) rotate(-540deg); }
        }
        @keyframes as-cosmic-${uid} {
          0%   { filter: brightness(1) saturate(1.2) hue-rotate(0deg); }
          50%  { filter: brightness(1.2) saturate(1.5) hue-rotate(20deg); }
          100% { filter: brightness(1) saturate(1.2) hue-rotate(0deg); }
        }
      `}</style>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `as-nebula-${uid} 2.8s ease-in-out infinite`,
      }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amber_space_odyssey-BnfKGYugMhFJy652kVVFqN.webp"
          alt="Янтарь"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block', animation: `as-cosmic-${uid} 5s ease-in-out infinite` }}
          draggable={false}
        />
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 30%, rgba(139,92,246,0.15) 0%, transparent 60%)',
        }} />
      </div>
      {/* Orbiting stardust particles */}
      <div aria-hidden="true" style={{
        position: 'absolute', top: '50%', left: '50%',
        marginTop: -size * 0.06, marginLeft: -size * 0.06,
        width: size * 0.12, height: size * 0.12,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #fde68a, #f59e0b)',
        boxShadow: '0 0 6px 3px rgba(245,158,11,0.9)',
        animation: `as-orbit1-${uid} 4s linear infinite`,
      }} />
      <div aria-hidden="true" style={{
        position: 'absolute', top: '50%', left: '50%',
        marginTop: -size * 0.05, marginLeft: -size * 0.05,
        width: size * 0.1, height: size * 0.1,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #ddd6fe, #8b5cf6)',
        boxShadow: '0 0 4px 2px rgba(139,92,246,0.8)',
        animation: `as-orbit2-${uid} 6s linear infinite`,
      }} />
    </div>
  );
}
