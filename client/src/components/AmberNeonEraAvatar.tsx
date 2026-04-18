import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * AmberNeonEraAvatar — Pure neon light art, amber neon tubes.
 * Season: Неоновая эра (Season 7) | Rank: Янтарь
 * Animation: multicolor neon flicker + electric sparks + neon scan + color shift
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function AmberNeonEraAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes ane-neon-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(245,158,11,0.9), 0 0 20px 8px rgba(245,158,11,0.5), 0 0 40px 15px rgba(251,191,36,0.25); }
          25%  { box-shadow: 0 0 12px 5px rgba(255,120,0,1), 0 0 28px 11px rgba(255,120,0,0.6), 0 0 55px 20px rgba(255,120,0,0.3); }
          50%  { box-shadow: 0 0 16px 7px rgba(251,191,36,1), 0 0 35px 14px rgba(251,191,36,0.7), 0 0 65px 25px rgba(251,191,36,0.35); }
          75%  { box-shadow: 0 0 10px 4px rgba(255,160,0,0.9), 0 0 24px 10px rgba(255,160,0,0.55), 0 0 48px 18px rgba(255,160,0,0.28); }
          100% { box-shadow: 0 0 8px 3px rgba(245,158,11,0.9), 0 0 20px 8px rgba(245,158,11,0.5), 0 0 40px 15px rgba(251,191,36,0.25); }
        }
        @keyframes ane-flicker-${uid} {
          0%, 100% { opacity: 1; }
          85%       { opacity: 1; }
          86%       { opacity: 0.2; }
          87%       { opacity: 1; }
          91%       { opacity: 0.8; }
          92%       { opacity: 1; }
          96%       { opacity: 0.4; }
          97%       { opacity: 1; }
        }
        @keyframes ane-scan-${uid} {
          0%   { transform: translateY(-${size * 1.1}px); opacity: 0.7; }
          85%  { opacity: 0.7; }
          100% { transform: translateY(${size * 1.1}px); opacity: 0; }
        }
        @keyframes ane-spark-${uid} {
          0%, 100% { opacity: 0; transform: scale(0.3) rotate(0deg); }
          40%       { opacity: 1; transform: scale(1.4) rotate(180deg); }
          70%       { opacity: 0.6; transform: scale(0.8) rotate(270deg); }
        }
        @keyframes ane-border-${uid} {
          0%   { border-color: rgba(245,158,11,0.9); }
          33%  { border-color: rgba(255,120,0,0.9); }
          66%  { border-color: rgba(251,191,36,1); }
          100% { border-color: rgba(245,158,11,0.9); }
        }
      `}</style>

      {/* Neon border ring */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(1, size * 0.04),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.04)}px solid rgba(245,158,11,0.9)`,
        boxShadow: `0 0 ${size * 0.08}px rgba(245,158,11,0.6)`,
        animation: `ane-border-${uid} 2s ease-in-out infinite`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `ane-neon-${uid} 2s ease-in-out infinite, ane-flicker-${uid} 5s ease-in-out infinite`,
      }}>
        <img
          src="/assets/static/amber_neon_era_s7_v2_434a2768.png"
          alt="Янтарь Неоновая эра"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: `${posX}% ${posY}%`,
            display: 'block',
          }}
          draggable={false}
        />

        {/* Neon scan line */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, right: 0,
          height: size * 0.1,
          background: 'linear-gradient(to bottom, transparent, rgba(245,158,11,0.4), transparent)',
          animation: `ane-scan-${uid} 1.8s linear infinite`,
          pointerEvents: 'none',
        }} />

        {/* Neon glow overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.08) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Electric spark particles */}
      {[
        { top: '6%',  left: '22%', delay: '0s',   dur: '1.6s' },
        { top: '12%', left: '72%', delay: '0.5s', dur: '2s' },
        { top: '76%', left: '10%', delay: '1s',   dur: '1.4s' },
        { top: '80%', left: '72%', delay: '0.3s', dur: '1.8s' },
        { top: '45%', left: '92%', delay: '1.3s', dur: '1.6s' },
      ].map((p, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute',
          top: p.top, left: p.left,
          width: Math.max(2, size * 0.06),
          height: Math.max(2, size * 0.06),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,220,0,1), rgba(245,158,11,0.5))',
          boxShadow: `0 0 ${size * 0.07}px rgba(255,200,0,1)`,
          animation: `ane-spark-${uid} ${p.dur} ease-in-out ${p.delay} infinite`,
          pointerEvents: 'none',
        }} />
      ))}
    </div>
  );
}
