import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * AmberAngelsDemonsAvatar — Half-angel half-demon with amber divine energy.
 * Season: Ангелы и Демоны (Season 12) | Rank: Янтарь
 * Animation: dual aura pulse (gold+dark) + wing shimmer + divine flame
 */
export function AmberAngelsDemonsAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes ad-dual-${uid} {
          0%   { box-shadow: -${size*0.15}px 0 ${size*0.25}px rgba(245,158,11,0.7), ${size*0.15}px 0 ${size*0.25}px rgba(127,29,29,0.6); }
          50%  { box-shadow: -${size*0.2}px 0 ${size*0.35}px rgba(245,158,11,0.9), ${size*0.2}px 0 ${size*0.35}px rgba(127,29,29,0.8); }
          100% { box-shadow: -${size*0.15}px 0 ${size*0.25}px rgba(245,158,11,0.7), ${size*0.15}px 0 ${size*0.25}px rgba(127,29,29,0.6); }
        }
        @keyframes ad-wing-${uid} {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes ad-breathe-${uid} {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.04); }
        }
        @keyframes ad-flame-${uid} {
          0%, 100% { opacity: 0.3; transform: scaleY(1); }
          50%       { opacity: 0.6; transform: scaleY(1.15); }
        }
      `}</style>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `ad-dual-${uid} 2.5s ease-in-out infinite, ad-breathe-${uid} 4s ease-in-out infinite`,
      }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amber_angels_demons_v2_b882b3bd.png"
          alt="Янтарь"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          draggable={false}
        />
        {/* Dual tone overlay — left gold, right dark */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'linear-gradient(90deg, rgba(245,158,11,0.15) 0%, transparent 50%, rgba(127,29,29,0.15) 100%)',
          backgroundSize: '200% 200%',
          animation: `ad-wing-${uid} 5s ease infinite`,
        }} />
        {/* Bottom flame */}
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: 0, left: '20%', right: '20%', height: '30%',
          background: 'linear-gradient(to top, rgba(245,158,11,0.5), transparent)',
          borderRadius: '0 0 50% 50%',
          animation: `ad-flame-${uid} 1.5s ease-in-out infinite`,
        }} />
      </div>
    </div>
  );
}
