import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubyNorseAvatar — Viking warrior with glowing runes and aurora.
 * Season: Скандинавские боги (Season 4) | Rank: Рубин
 * Animation: blue rune glow + aurora shimmer
 */
export function RubyNorseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes rna-halo-${uid} {
          0%, 100% { box-shadow: 0 0 8px 3px rgba(148,163,184,0.4), 0 0 18px 5px rgba(56,189,248,0.2); }
          50%       { box-shadow: 0 0 18px 7px rgba(186,230,253,0.6), 0 0 36px 12px rgba(56,189,248,0.4); }
        }
        @keyframes rna-aurora-${uid} {
          0%   { opacity: 0.1; transform: translateY(0) scaleX(1); }
          50%  { opacity: 0.3; transform: translateY(-${Math.round(size * 0.05)}px) scaleX(1.05); }
          100% { opacity: 0.1; transform: translateY(0) scaleX(1); }
        }
        @keyframes rna-flicker-${uid} {
          0%, 100% { filter: brightness(1) saturate(1.1); }
          50%       { filter: brightness(1.2) saturate(1.3) hue-rotate(-5deg); }
        }
      `}</style>
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative', animation: `rna-halo-${uid} 3s ease-in-out infinite` }}>
        <img
          src="/assets/static/ruby_norse_gods_0fa3c331.png"
          alt="Рубин"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', animation: `rna-flicker-${uid} 4s ease-in-out infinite` }}
          draggable={false}
        />
        {/* Aurora shimmer overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'linear-gradient(180deg, rgba(52,211,153,0.15) 0%, rgba(56,189,248,0.1) 50%, transparent 100%)',
          animation: `rna-aurora-${uid} 3.5s ease-in-out infinite`,
        }} />
      </div>
    </div>
  );
}
