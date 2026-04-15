import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubyKazakhAvatar — Berkut eagle soaring with Kazakh ornaments.
 * Season: Казахский колорит (Season 6) | Rank: Рубин
 * Animation: golden-red pulse halo + wing-beat brightness + gold shimmer sweep
 */
export function RubyKazakhAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes rkaz-halo-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(251,191,36,0.55), 0 0 18px 6px rgba(239,68,68,0.25); }
          50%  { box-shadow: 0 0 18px 7px rgba(251,191,36,0.85), 0 0 32px 12px rgba(239,68,68,0.45); }
          100% { box-shadow: 0 0 8px 3px rgba(251,191,36,0.55), 0 0 18px 6px rgba(239,68,68,0.25); }
        }
        @keyframes rkaz-wing-${uid} {
          0%, 100% { filter: brightness(1) saturate(1.1); transform: scale(1); }
          30%       { filter: brightness(1.18) saturate(1.3); transform: scale(1.015); }
          60%       { filter: brightness(1.05) saturate(1.15); transform: scale(1.005); }
        }
        @keyframes rkaz-shimmer-${uid} {
          0%   { opacity: 0; transform: translateX(-60%) skewX(-20deg); }
          40%  { opacity: 0.35; }
          100% { opacity: 0; transform: translateX(160%) skewX(-20deg); }
        }
        @keyframes rkaz-spin-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        position: 'relative',
        animation: `rkaz-halo-${uid} 2.8s ease-in-out infinite`,
      }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_kazakh_v3_49409013.png"
          alt="Рубин"
          style={{
            width: '105%', height: '105%',
            objectFit: 'cover', objectPosition: 'center',
            display: 'block',
            marginLeft: '-2.5%', marginTop: '-2.5%',
            animation: `rkaz-wing-${uid} 3.2s ease-in-out infinite`,
          }}
          draggable={false}
        />
        {/* Rotating conic overlay — golden warmth */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(251,191,36,0.1) 20%, transparent 40%, rgba(239,68,68,0.08) 60%, transparent 80%, rgba(251,191,36,0.1) 100%)',
          animation: `rkaz-spin-${uid} 7s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Gold shimmer sweep */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, transparent 30%, rgba(251,191,36,0.42) 50%, transparent 70%)',
          animation: `rkaz-shimmer-${uid} 4.5s ease-in-out infinite`,
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
