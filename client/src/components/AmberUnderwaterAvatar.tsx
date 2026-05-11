import React from 'react';
import { getAssetUrl } from '@/lib/assetUrl';
interface Props { size?: number; className?: string; }
/**
 * AmberUnderwaterAvatar — Golden Poseidon sea god with amber crown.
 * Season: Подводный мир (Season 1) | Rank: Янтарь
 * Animation: golden water ripple pulse + floating bubbles + amber shimmer
 */
export function AmberUnderwaterAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes aw-ripple-${uid} {
          0%   { box-shadow: 0 0 0 0 rgba(245,158,11,0.6), 0 0 12px 5px rgba(245,158,11,0.4), 0 0 24px 10px rgba(6,182,212,0.2); }
          50%  { box-shadow: 0 0 0 6px rgba(245,158,11,0), 0 0 18px 8px rgba(245,158,11,0.5), 0 0 36px 16px rgba(6,182,212,0.3); }
          100% { box-shadow: 0 0 0 0 rgba(245,158,11,0.6), 0 0 12px 5px rgba(245,158,11,0.4), 0 0 24px 10px rgba(6,182,212,0.2); }
        }
        @keyframes aw-float-${uid} {
          0%, 100% { transform: translateY(0px) scale(1); }
          33%       { transform: translateY(-3px) scale(1.02); }
          66%       { transform: translateY(2px) scale(0.99); }
        }
        @keyframes aw-shimmer-${uid} {
          0%   { opacity: 0; transform: translateX(-100%) skewX(-20deg); }
          40%  { opacity: 0.35; }
          60%  { opacity: 0.35; }
          100% { opacity: 0; transform: translateX(200%) skewX(-20deg); }
        }
        @keyframes aw-bubble-${uid} {
          0%   { transform: translateY(0) scale(0.6); opacity: 0.7; }
          100% { transform: translateY(-${size * 0.9}px) scale(1.2); opacity: 0; }
        }
      `}</style>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `aw-ripple-${uid} 2.5s ease-in-out infinite, aw-float-${uid} 4s ease-in-out infinite`,
      }}>
        <img
          src={getAssetUrl("/assets/static/amber_underwater_world_v2_0c6b5664.png")}
          alt="Янтарь"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          draggable={false}
        />
        {/* Shimmer sweep */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'linear-gradient(105deg, transparent 40%, rgba(255,215,0,0.5) 50%, transparent 60%)',
          animation: `aw-shimmer-${uid} 3s ease-in-out infinite`,
        }} />
        {/* Teal overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 70%, rgba(6,182,212,0.15) 0%, transparent 60%)',
        }} />
      </div>
      {/* Floating bubbles */}
      {[0.15, 0.5, 0.75].map((x, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', bottom: '5%',
          left: `${x * 100}%`,
          width: size * 0.08, height: size * 0.08,
          borderRadius: '50%',
          background: 'rgba(245,158,11,0.6)',
          animation: `aw-bubble-${uid} ${1.8 + i * 0.7}s ease-in ${i * 0.6}s infinite`,
        }} />
      ))}
    </div>
  );
}
