import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubyEgyptianAvatar — Horus the falcon god with golden radiance.
 * Season: Египетские боги (Season 2) | Rank: Рубин
 * Animation: golden sun rays rotating + warm amber glow pulse
 */
export function RubyEgyptianAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes reg-halo-${uid} {
          0%, 100% { box-shadow: 0 0 8px 3px rgba(245,158,11,0.5), 0 0 20px 6px rgba(217,119,6,0.3); }
          50%       { box-shadow: 0 0 20px 8px rgba(251,191,36,0.8), 0 0 40px 14px rgba(245,158,11,0.5); }
        }
        @keyframes reg-rotate-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes reg-flicker-${uid} {
          0%, 100% { filter: brightness(1) saturate(1.1); }
          50%       { filter: brightness(1.25) saturate(1.5); }
        }
      `}</style>
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative', animation: `reg-halo-${uid} 2.5s ease-in-out infinite` }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_egyptian_gods_52ceb9b8.png"
          alt="Рубин"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', animation: `reg-flicker-${uid} 3s ease-in-out infinite` }}
          draggable={false}
        />
        {/* Golden shimmer overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(251,191,36,0.15) 25%, transparent 50%, rgba(245,158,11,0.1) 75%, transparent 100%)',
          animation: `reg-rotate-${uid} 4s linear infinite`,
        }} />
      </div>
    </div>
  );
}
