import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * AmberPirateAvatar — Legendary golden pirate captain.
 * Season: Пиратские острова (Season 3) | Rank: Янтарь
 * Animation: coin orbit + lightning flash + golden storm glow
 */
export function AmberPirateAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes ap-storm-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(245,158,11,0.6), 0 0 18px 7px rgba(245,158,11,0.3); }
          30%  { box-shadow: 0 0 16px 7px rgba(255,255,255,0.8), 0 0 28px 12px rgba(245,158,11,0.5); }
          35%  { box-shadow: 0 0 8px 3px rgba(245,158,11,0.6), 0 0 18px 7px rgba(245,158,11,0.3); }
          70%  { box-shadow: 0 0 20px 9px rgba(255,255,255,0.7), 0 0 35px 15px rgba(245,158,11,0.6); }
          75%  { box-shadow: 0 0 8px 3px rgba(245,158,11,0.6), 0 0 18px 7px rgba(245,158,11,0.3); }
          100% { box-shadow: 0 0 8px 3px rgba(245,158,11,0.6), 0 0 18px 7px rgba(245,158,11,0.3); }
        }
        @keyframes ap-orbit-${uid} {
          from { transform: rotate(0deg) translateX(${size * 0.55}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${size * 0.55}px) rotate(-360deg); }
        }
        @keyframes ap-sway-${uid} {
          0%, 100% { transform: rotate(-2deg); }
          50%       { transform: rotate(2deg); }
        }
      `}</style>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `ap-storm-${uid} 3s ease-in-out infinite, ap-sway-${uid} 4s ease-in-out infinite`,
      }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amber_pirate_islands-CyCZP2XLoQQwXGY2AsYqyj.webp"
          alt="Янтарь"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          draggable={false}
        />
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, rgba(245,158,11,0.1) 0%, transparent 70%)',
        }} />
      </div>
      {/* Orbiting coin */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        top: '50%', left: '50%',
        marginTop: -size * 0.07, marginLeft: -size * 0.07,
        width: size * 0.14, height: size * 0.14,
        borderRadius: '50%',
        background: 'radial-gradient(circle, #fde68a, #d97706)',
        boxShadow: '0 0 4px 2px rgba(245,158,11,0.8)',
        animation: `ap-orbit-${uid} 3s linear infinite`,
      }} />
    </div>
  );
}
