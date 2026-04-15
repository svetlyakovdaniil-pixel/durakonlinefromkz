import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubyNeonEraAvatar — Neon city night with electric signs.
 * Season: Неоновая эра (Season 7) | Rank: Рубин
 * Animation: multi-color neon halo flicker (red/cyan/magenta/yellow) + electric spark + color shift
 */
export function RubyNeonEraAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes rneon-halo-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(239,68,68,0.8), 0 0 20px 7px rgba(239,68,68,0.35); }
          25%  { box-shadow: 0 0 10px 4px rgba(6,182,212,0.8), 0 0 22px 8px rgba(6,182,212,0.35); }
          50%  { box-shadow: 0 0 12px 5px rgba(217,70,239,0.8), 0 0 26px 10px rgba(217,70,239,0.35); }
          75%  { box-shadow: 0 0 10px 4px rgba(234,179,8,0.8), 0 0 22px 8px rgba(234,179,8,0.35); }
          100% { box-shadow: 0 0 8px 3px rgba(239,68,68,0.8), 0 0 20px 7px rgba(239,68,68,0.35); }
        }
        @keyframes rneon-flicker-${uid} {
          0%, 100% { filter: brightness(1) saturate(1.2); }
          8%        { filter: brightness(1.4) saturate(1.6) hue-rotate(20deg); }
          10%       { filter: brightness(0.9) saturate(1.1); }
          12%       { filter: brightness(1.3) saturate(1.5) hue-rotate(-15deg); }
          14%       { filter: brightness(1) saturate(1.2); }
          60%       { filter: brightness(1.15) saturate(1.3) hue-rotate(10deg); }
          62%       { filter: brightness(0.95) saturate(1.1); }
        }
        @keyframes rneon-spark-${uid} {
          0%, 80%, 100% { opacity: 0; }
          83%            { opacity: 0.55; }
          86%            { opacity: 0.15; }
          89%            { opacity: 0.65; }
          92%            { opacity: 0; }
        }
        @keyframes rneon-scan-${uid} {
          0%   { top: 110%; opacity: 0; }
          5%   { opacity: 0.45; }
          90%  { opacity: 0.35; }
          100% { top: -20%; opacity: 0; }
        }
      `}</style>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        position: 'relative',
        animation: `rneon-halo-${uid} 2s linear infinite`,
      }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_neon_era_v3_42502a8f.png"
          alt="Рубин"
          style={{
            width: '105%', height: '105%',
            objectFit: 'cover', objectPosition: 'center',
            display: 'block',
            marginLeft: '-2.5%', marginTop: '-2.5%',
            animation: `rneon-flicker-${uid} 3s ease-in-out infinite`,
          }}
          draggable={false}
        />
        {/* Horizontal neon scan line */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, right: 0,
          height: Math.max(2, size * 0.05),
          background: 'linear-gradient(180deg, transparent, rgba(239,68,68,0.55), transparent)',
          animation: `rneon-scan-${uid} 2s ease-in infinite`,
          pointerEvents: 'none',
        }} />
        {/* Electric spark burst overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'radial-gradient(circle at 50% 50%, rgba(6,182,212,0.28) 0%, transparent 65%)',
          animation: `rneon-spark-${uid} 2.5s ease-in-out infinite`,
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
