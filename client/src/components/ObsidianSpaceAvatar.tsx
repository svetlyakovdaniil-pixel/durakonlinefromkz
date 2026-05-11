import React from 'react';
import { getAssetUrl } from '@/lib/assetUrl';
interface Props { size?: number; className?: string; }
/**
 * ObsidianSpaceAvatar — Cosmic void emperor commanding black holes.
 * Season: Космическая одиссея (Season 5) | Rank: Обсидиан (highest rank)
 * Animation: black hole rotation + supernova pulse + galaxy swirl + event horizon glow
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function ObsidianSpaceAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes osa-supernova-${uid} {
          0%   { box-shadow: 0 0 10px 4px rgba(139,92,246,0.9), 0 0 24px 10px rgba(109,40,217,0.6), 0 0 48px 20px rgba(76,29,149,0.35); }
          25%  { box-shadow: 0 0 22px 10px rgba(200,180,255,1), 0 0 44px 20px rgba(139,92,246,0.8), 0 0 80px 35px rgba(109,40,217,0.55); }
          50%  { box-shadow: 0 0 8px 3px rgba(139,92,246,0.7), 0 0 20px 8px rgba(109,40,217,0.45), 0 0 42px 17px rgba(76,29,149,0.3); }
          75%  { box-shadow: 0 0 28px 13px rgba(220,200,255,1), 0 0 55px 25px rgba(167,139,250,0.9), 0 0 90px 40px rgba(139,92,246,0.6); }
          100% { box-shadow: 0 0 10px 4px rgba(139,92,246,0.9), 0 0 24px 10px rgba(109,40,217,0.6), 0 0 48px 20px rgba(76,29,149,0.35); }
        }
        @keyframes osa-rotate-cw-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes osa-rotate-ccw-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes osa-galaxy-${uid} {
          0%   { opacity: 0.25; transform: rotate(0deg) scale(1); }
          50%  { opacity: 0.5; transform: rotate(180deg) scale(1.05); }
          100% { opacity: 0.25; transform: rotate(360deg) scale(1); }
        }
        @keyframes osa-star-${uid} {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50%       { opacity: 1; transform: scale(1.5); }
        }
      `}</style>

      {/* Outer rotating accretion ring */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(3, size * 0.06),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.03)}px solid transparent`,
        borderTopColor: 'rgba(200,180,255,0.9)',
        borderRightColor: 'rgba(139,92,246,0.4)',
        borderBottomColor: 'rgba(167,139,250,0.7)',
        borderLeftColor: 'rgba(109,40,217,0.3)',
        animation: `osa-rotate-cw-${uid} 2s linear infinite`,
        pointerEvents: 'none',
      }} />
      {/* Inner counter-rotating ring */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(1, size * 0.02),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.015)}px solid transparent`,
        borderTopColor: 'rgba(109,40,217,0.7)',
        borderBottomColor: 'rgba(200,180,255,0.6)',
        animation: `osa-rotate-ccw-${uid} 3s linear infinite`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `osa-supernova-${uid} 3s ease-in-out infinite`,
      }}>
        <img
          src={getAssetUrl("/assets/static/obsidian_space_odyssey-7gENsHLXLmZaeUU6EcPbyv.webp")}
          alt="Обсидиан Космос"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, display: 'block' }}
          draggable={false}
        />
        {/* Galaxy swirl overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'conic-gradient(from 0deg, rgba(139,92,246,0.2), rgba(109,40,217,0.1), rgba(200,180,255,0.25), rgba(76,29,149,0.15), rgba(139,92,246,0.2))',
          animation: `osa-galaxy-${uid} 6s linear infinite`,
        }} />
        {/* Void vignette */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 45%, transparent 25%, rgba(76,29,149,0.4) 100%)',
        }} />
      </div>

      {/* Orbiting star particles */}
      {[0, 72, 144, 216, 288].map((deg, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute',
          top: '50%', left: '50%',
          width: size * 0.06, height: size * 0.06,
          marginTop: -(size * 0.03),
          marginLeft: -(size * 0.03),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220,200,255,1), rgba(139,92,246,0.5))',
          boxShadow: `0 0 ${size * 0.04}px rgba(167,139,250,0.9)`,
          transform: `rotate(${deg}deg) translateX(${size * 0.52}px)`,
          animation: `osa-star-${uid} ${1.5 + i * 0.3}s ease-in-out ${i * 0.3}s infinite`,
        }} />
      ))}
    </div>
  );
}
