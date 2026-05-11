import React from 'react';
import { getAssetUrl } from '@/lib/assetUrl';
interface Props { size?: number; className?: string; }
/**
 * ObsidianUnderwaterAvatar — Abyssal deep-sea god of absolute darkness.
 * Season: Подводный мир (Season 1) | Rank: Обсидиан (highest rank)
 * Animation: void pulse + shadow tentacles + bioluminescent particles + eldritch shimmer
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function ObsidianUnderwaterAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes oua-void-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(139,92,246,0.8), 0 0 20px 8px rgba(109,40,217,0.5), 0 0 40px 16px rgba(76,29,149,0.3); }
          33%  { box-shadow: 0 0 16px 7px rgba(167,139,250,1), 0 0 32px 14px rgba(139,92,246,0.7), 0 0 60px 25px rgba(109,40,217,0.4); }
          66%  { box-shadow: 0 0 6px 2px rgba(139,92,246,0.6), 0 0 18px 7px rgba(109,40,217,0.4), 0 0 50px 20px rgba(76,29,149,0.35); }
          100% { box-shadow: 0 0 8px 3px rgba(139,92,246,0.8), 0 0 20px 8px rgba(109,40,217,0.5), 0 0 40px 16px rgba(76,29,149,0.3); }
        }
        @keyframes oua-shimmer-${uid} {
          0%   { opacity: 0; transform: translateX(-120%) skewX(-15deg); }
          45%  { opacity: 0.5; }
          55%  { opacity: 0.5; }
          100% { opacity: 0; transform: translateX(220%) skewX(-15deg); }
        }
        @keyframes oua-particle-${uid} {
          0%   { transform: translateY(0) scale(0.5); opacity: 0.9; }
          100% { transform: translateY(-${size * 1.1}px) scale(1.4); opacity: 0; }
        }
        @keyframes oua-eye-${uid} {
          0%, 100% { opacity: 0.5; transform: scale(1); filter: blur(0px); }
          50%       { opacity: 1; transform: scale(1.5); filter: blur(1px); }
        }
        @keyframes oua-rotate-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* Rotating outer void ring */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(2, size * 0.05),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.025)}px solid transparent`,
        borderTopColor: 'rgba(139,92,246,0.9)',
        borderRightColor: 'rgba(109,40,217,0.6)',
        borderBottomColor: 'rgba(167,139,250,0.8)',
        borderLeftColor: 'rgba(76,29,149,0.4)',
        animation: `oua-rotate-${uid} 3s linear infinite`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `oua-void-${uid} 2.5s ease-in-out infinite`,
      }}>
        <img
          src={getAssetUrl("/assets/static/obsidian_underwater_world-CrTo39hHA3GNH6kCigzNr8.webp")}
          alt="Обсидиан Подводный мир"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, display: 'block' }}
          draggable={false}
        />
        {/* Violet shimmer sweep */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'linear-gradient(110deg, transparent 35%, rgba(167,139,250,0.45) 50%, transparent 65%)',
          animation: `oua-shimmer-${uid} 3.5s ease-in-out infinite`,
        }} />
        {/* Abyss overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, transparent 40%, rgba(76,29,149,0.35) 100%)',
        }} />
        {/* Eye glow */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '35%', left: '42%',
          width: size * 0.12, height: size * 0.12, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,1), rgba(139,92,246,0.4))',
          boxShadow: `0 0 ${size * 0.1}px ${size * 0.06}px rgba(139,92,246,0.9)`,
          animation: `oua-eye-${uid} 2s ease-in-out infinite`,
        }} />
      </div>

      {/* Bioluminescent particles */}
      {[
        { left: '10%', delay: '0s', dur: '1.6s', size: 0.07 },
        { left: '35%', delay: '0.7s', dur: '2s', size: 0.05 },
        { left: '65%', delay: '0.3s', dur: '1.4s', size: 0.06 },
        { left: '85%', delay: '1.1s', dur: '1.8s', size: 0.04 },
        { left: '50%', delay: '0.5s', dur: '2.2s', size: 0.05 },
      ].map((p, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', bottom: '8%', left: p.left,
          width: size * p.size, height: size * p.size, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,0.95), rgba(109,40,217,0.5))',
          boxShadow: `0 0 ${size * 0.04}px rgba(139,92,246,0.8)`,
          animation: `oua-particle-${uid} ${p.dur} ease-out ${p.delay} infinite`,
        }} />
      ))}
    </div>
  );
}
