import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubyAngelsDemonsAvatar — Half-angel half-demon with divine/infernal aura.
 * Season: Ангелы и Демоны (Season 12) | Rank: Рубин
 * Animation: dual aura alternating gold/red + fire flicker
 */
export function RubyAngelsDemonsAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes rad-halo-${uid} {
          0%   { box-shadow: 0 0 10px 4px rgba(251,191,36,0.6), 0 0 22px 7px rgba(251,191,36,0.3); }
          50%  { box-shadow: 0 0 10px 4px rgba(239,68,68,0.6), 0 0 22px 7px rgba(239,68,68,0.3); }
          100% { box-shadow: 0 0 10px 4px rgba(251,191,36,0.6), 0 0 22px 7px rgba(251,191,36,0.3); }
        }
        @keyframes rad-flicker-${uid} {
          0%, 100% { filter: brightness(1) saturate(1.1); }
          25%       { filter: brightness(1.2) saturate(1.3) hue-rotate(15deg); }
          75%       { filter: brightness(1.15) saturate(1.25) hue-rotate(-15deg); }
        }
        @keyframes rad-split-${uid} {
          0%   { opacity: 0.15; }
          50%  { opacity: 0.3; }
          100% { opacity: 0.15; }
        }
      `}</style>
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative', animation: `rad-halo-${uid} 3s ease-in-out infinite` }}>
        <img
          src="/assets/static/ruby_angels_demons_dc4a2a91.png"
          alt="Рубин"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', animation: `rad-flicker-${uid} 4s ease-in-out infinite` }}
          draggable={false}
        />
        {/* Dual-tone split overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'linear-gradient(90deg, rgba(251,191,36,0.12) 0%, transparent 50%, rgba(239,68,68,0.12) 100%)',
          animation: `rad-split-${uid} 3s ease-in-out infinite`,
        }} />
      </div>
    </div>
  );
}
