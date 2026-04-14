import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubyHiphopAvatar — 90s hip-hop legend with golden glow.
 * Season: Хип-хоп 90-х (Season 11) | Rank: Рубин
 * Animation: warm orange/gold pulse + vinyl spin overlay
 */
export function RubyHiphopAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes rhh-halo-${uid} {
          0%, 100% { box-shadow: 0 0 8px 3px rgba(251,146,60,0.5), 0 0 18px 5px rgba(234,179,8,0.3); }
          50%       { box-shadow: 0 0 20px 8px rgba(251,146,60,0.8), 0 0 38px 12px rgba(234,179,8,0.55); }
        }
        @keyframes rhh-spin-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes rhh-flicker-${uid} {
          0%, 100% { filter: brightness(1) saturate(1.1); }
          50%       { filter: brightness(1.2) saturate(1.4); }
        }
      `}</style>
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative', animation: `rhh-halo-${uid} 2.8s ease-in-out infinite` }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_hiphop_90s_bde0fc3c.png"
          alt="Рубин"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', animation: `rhh-flicker-${uid} 3s ease-in-out infinite` }}
          draggable={false}
        />
        {/* Vinyl spin overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, rgba(251,146,60,0.15) 0%, transparent 25%, rgba(234,179,8,0.12) 50%, transparent 75%, rgba(251,146,60,0.15) 100%)',
          animation: `rhh-spin-${uid} 3s linear infinite`,
        }} />
      </div>
    </div>
  );
}
