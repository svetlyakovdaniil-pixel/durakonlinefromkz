import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubySpaceAvatar — Space explorer with red energy vortex.
 * Season: Космическая одиссея (Season 5) | Rank: Рубин
 * Animation: rotating red energy ring + star twinkle
 */
export function RubySpaceAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes rsa-halo-${uid} {
          0%, 100% { box-shadow: 0 0 8px 3px rgba(239,68,68,0.4), 0 0 20px 6px rgba(99,102,241,0.25); }
          50%       { box-shadow: 0 0 20px 8px rgba(239,68,68,0.7), 0 0 40px 14px rgba(99,102,241,0.5); }
        }
        @keyframes rsa-ring-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes rsa-flicker-${uid} {
          0%, 100% { filter: brightness(1) saturate(1.1); }
          50%       { filter: brightness(1.2) saturate(1.4); }
        }
      `}</style>
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative', animation: `rsa-halo-${uid} 2.5s ease-in-out infinite` }}>
        <img
          src="/assets/static/ruby_space_odyssey_f080fce1.png"
          alt="Рубин"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', animation: `rsa-flicker-${uid} 3.5s ease-in-out infinite` }}
          draggable={false}
        />
        {/* Rotating energy ring */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, rgba(239,68,68,0.2) 0%, transparent 30%, rgba(99,102,241,0.15) 60%, transparent 80%, rgba(239,68,68,0.2) 100%)',
          animation: `rsa-ring-${uid} 5s linear infinite`,
        }} />
      </div>
    </div>
  );
}
