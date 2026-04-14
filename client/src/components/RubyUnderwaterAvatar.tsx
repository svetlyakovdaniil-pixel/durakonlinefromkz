import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubyUnderwaterAvatar — Glowing anglerfish from the abyss.
 * Season: Подводный мир (Season 1) | Rank: Рубин
 * Animation: bioluminescent pulse + bubble particles rising
 */
export function RubyUnderwaterAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes ruw-halo-${uid} {
          0%, 100% { box-shadow: 0 0 8px 3px rgba(0,200,255,0.4), 0 0 20px 6px rgba(0,100,200,0.25); }
          50%       { box-shadow: 0 0 18px 7px rgba(0,220,255,0.7), 0 0 36px 12px rgba(0,150,255,0.45); }
        }
        @keyframes ruw-bubble1-${uid} {
          0%   { bottom: -10%; opacity: 0; transform: translateX(0); }
          20%  { opacity: 0.8; }
          80%  { opacity: 0.6; }
          100% { bottom: 110%; opacity: 0; transform: translateX(${Math.round(size * 0.1)}px); }
        }
        @keyframes ruw-bubble2-${uid} {
          0%   { bottom: -10%; opacity: 0; transform: translateX(0); }
          20%  { opacity: 0.7; }
          80%  { opacity: 0.5; }
          100% { bottom: 110%; opacity: 0; transform: translateX(-${Math.round(size * 0.08)}px); }
        }
        @keyframes ruw-flicker-${uid} {
          0%, 100% { filter: brightness(1) saturate(1.1); }
          45%       { filter: brightness(1.2) saturate(1.4) hue-rotate(10deg); }
          50%       { filter: brightness(0.9) saturate(1.0); }
          55%       { filter: brightness(1.2) saturate(1.4); }
        }
      `}</style>
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative', animation: `ruw-halo-${uid} 2.8s ease-in-out infinite` }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_underwater_world_83a8b445.png"
          alt="Рубин"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', animation: `ruw-flicker-${uid} 3.5s ease-in-out infinite` }}
          draggable={false}
        />
        {/* Bubble 1 */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: '30%', width: Math.max(3, size * 0.06), height: Math.max(3, size * 0.06),
          borderRadius: '50%', background: 'rgba(0,200,255,0.6)', border: '1px solid rgba(0,230,255,0.8)',
          animation: `ruw-bubble1-${uid} 2.4s ease-in infinite`,
        }} />
        {/* Bubble 2 */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: '60%', width: Math.max(2, size * 0.04), height: Math.max(2, size * 0.04),
          borderRadius: '50%', background: 'rgba(0,180,255,0.5)', border: '1px solid rgba(0,210,255,0.7)',
          animation: `ruw-bubble2-${uid} 3.1s ease-in infinite 0.8s`,
        }} />
      </div>
    </div>
  );
}
