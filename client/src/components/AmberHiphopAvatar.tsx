import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * AmberHiphopAvatar — Legendary golden hip-hop icon.
 * Season: Хип-хоп 90-х (Season 11) | Rank: Янтарь
 * Animation: beat bounce + gold chain sparkle + vinyl spin glow
 */
export function AmberHiphopAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes ah-beat-${uid} {
          0%, 100% { transform: scale(1); box-shadow: 0 0 8px 3px rgba(245,158,11,0.6), 0 0 18px 7px rgba(245,158,11,0.3); }
          25%       { transform: scale(1.06); box-shadow: 0 0 16px 7px rgba(245,158,11,0.9), 0 0 30px 13px rgba(245,158,11,0.5); }
          50%       { transform: scale(1); box-shadow: 0 0 8px 3px rgba(245,158,11,0.6), 0 0 18px 7px rgba(245,158,11,0.3); }
          75%       { transform: scale(1.04); box-shadow: 0 0 14px 6px rgba(245,158,11,0.8), 0 0 26px 11px rgba(245,158,11,0.45); }
        }
        @keyframes ah-sparkle-${uid} {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          50%       { opacity: 1; transform: scale(1) rotate(180deg); }
        }
        @keyframes ah-gold-${uid} {
          0%   { filter: brightness(1) saturate(1.3); }
          50%  { filter: brightness(1.25) saturate(1.6) sepia(0.15); }
          100% { filter: brightness(1) saturate(1.3); }
        }
      `}</style>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `ah-beat-${uid} 0.6s ease-in-out infinite`,
      }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amber_hiphop_90s_v2_5310991c.png"
          alt="Янтарь"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block', animation: `ah-gold-${uid} 2s ease-in-out infinite` }}
          draggable={false}
        />
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 80%, rgba(245,158,11,0.15) 0%, transparent 50%)',
        }} />
      </div>
      {/* Sparkle stars */}
      {[
        { top: '5%', left: '80%', delay: '0s' },
        { top: '75%', left: '85%', delay: '0.3s' },
        { top: '10%', left: '15%', delay: '0.6s' },
      ].map((pos, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', top: pos.top, left: pos.left,
          width: size * 0.12, height: size * 0.12,
          background: 'rgba(251,191,36,0.9)',
          clipPath: 'polygon(50% 0%, 61% 35%, 98% 35%, 68% 57%, 79% 91%, 50% 70%, 21% 91%, 32% 57%, 2% 35%, 39% 35%)',
          animation: `ah-sparkle-${uid} 1.5s ease-in-out ${pos.delay} infinite`,
        }} />
      ))}
    </div>
  );
}
