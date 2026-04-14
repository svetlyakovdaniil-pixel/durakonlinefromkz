import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubyPirateAvatar — Fearsome undead pirate with glowing red eyes.
 * Season: Пиратские острова (Season 3) | Rank: Рубин
 * Animation: red eye glow pulse + lightning flash
 */
export function RubyPirateAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes rpa-halo-${uid} {
          0%, 100% { box-shadow: 0 0 6px 2px rgba(220,38,38,0.4), 0 0 14px 4px rgba(120,0,0,0.3); }
          50%       { box-shadow: 0 0 16px 6px rgba(239,68,68,0.7), 0 0 30px 10px rgba(180,0,0,0.5); }
        }
        @keyframes rpa-lightning-${uid} {
          0%, 85%, 100% { opacity: 0; }
          87%            { opacity: 0.6; }
          89%            { opacity: 0; }
          91%            { opacity: 0.4; }
          93%            { opacity: 0; }
        }
        @keyframes rpa-flicker-${uid} {
          0%, 100% { filter: brightness(1) saturate(1.1); }
          50%       { filter: brightness(1.15) saturate(1.3); }
        }
      `}</style>
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative', animation: `rpa-halo-${uid} 2.2s ease-in-out infinite` }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_pirate_islands_acbbbc77.png"
          alt="Рубин"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', animation: `rpa-flicker-${uid} 4s ease-in-out infinite` }}
          draggable={false}
        />
        {/* Lightning flash overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(200,220,255,0.5)',
          animation: `rpa-lightning-${uid} 3.5s ease-in-out infinite`,
        }} />
      </div>
    </div>
  );
}
