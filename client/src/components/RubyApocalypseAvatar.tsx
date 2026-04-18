import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubyApocalypseAvatar — Post-apocalyptic survivor amid fire and ruins.
 * Season: Апокалипсис (Season 8) | Rank: Рубин
 * Animation: fire ember halo (red/orange) + heat shimmer + ember rise particles
 */
export function RubyApocalypseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes rapo-halo-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(220,38,38,0.6), 0 0 18px 6px rgba(234,88,12,0.3); }
          33%  { box-shadow: 0 0 14px 5px rgba(239,68,68,0.85), 0 0 28px 10px rgba(234,88,12,0.5); }
          66%  { box-shadow: 0 0 10px 4px rgba(251,146,60,0.7), 0 0 22px 8px rgba(220,38,38,0.35); }
          100% { box-shadow: 0 0 8px 3px rgba(220,38,38,0.6), 0 0 18px 6px rgba(234,88,12,0.3); }
        }
        @keyframes rapo-flicker-${uid} {
          0%, 100% { filter: brightness(1) saturate(1.1); }
          20%       { filter: brightness(1.2) saturate(1.35) hue-rotate(8deg); }
          40%       { filter: brightness(0.92) saturate(1.05); }
          70%       { filter: brightness(1.15) saturate(1.25) hue-rotate(-5deg); }
          85%       { filter: brightness(0.95) saturate(1.1); }
        }
        @keyframes rapo-ember-${uid} {
          0%   { opacity: 0; transform: translateY(0) scale(1); }
          30%  { opacity: 0.5; }
          100% { opacity: 0; transform: translateY(-40%) scale(0.5); }
        }
        @keyframes rapo-heat-${uid} {
          0%, 100% { opacity: 0.12; }
          50%       { opacity: 0.28; }
        }
      `}</style>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        position: 'relative',
        animation: `rapo-halo-${uid} 2.2s ease-in-out infinite`,
      }}>
        <img
          src="/assets/static/ruby_apocalypse_final_791c8b8e.png"
          alt="Рубин"
          style={{
            width: '105%', height: '105%',
            objectFit: 'cover', objectPosition: 'center',
            display: 'block',
            marginLeft: '-2.5%', marginTop: '-2.5%',
            animation: `rapo-flicker-${uid} 2.8s ease-in-out infinite`,
          }}
          draggable={false}
        />
        {/* Heat shimmer from bottom */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(ellipse at 50% 90%, rgba(239,68,68,0.3) 0%, rgba(234,88,12,0.15) 40%, transparent 70%)',
          animation: `rapo-heat-${uid} 1.5s ease-in-out infinite`,
          pointerEvents: 'none',
        }} />
        {/* Ember particles rising */}
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: '15%', left: '30%',
          width: Math.max(2, size * 0.04), height: Math.max(2, size * 0.04),
          borderRadius: '50%',
          background: 'rgba(251,146,60,0.9)',
          animation: `rapo-ember-${uid} 1.8s ease-out infinite`,
          pointerEvents: 'none',
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: '20%', left: '60%',
          width: Math.max(1.5, size * 0.03), height: Math.max(1.5, size * 0.03),
          borderRadius: '50%',
          background: 'rgba(239,68,68,0.85)',
          animation: `rapo-ember-${uid} 2.3s ease-out 0.6s infinite`,
          pointerEvents: 'none',
        }} />
        <div aria-hidden="true" style={{
          position: 'absolute', bottom: '10%', left: '50%',
          width: Math.max(1, size * 0.025), height: Math.max(1, size * 0.025),
          borderRadius: '50%',
          background: 'rgba(251,191,36,0.8)',
          animation: `rapo-ember-${uid} 2s ease-out 1.1s infinite`,
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
