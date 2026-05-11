import React from 'react';
import { getAssetUrl } from '@/lib/assetUrl';
interface Props { size?: number; className?: string; }
/**
 * AmberKazakhAvatar — Kazakh tyubeteika, dombra, ornaments.
 * Season: Казахский колорит (Season 6) | Rank: Янтарь
 * Animation: golden pulse + rotating ornament ring + amber sparkles + warm shimmer
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function AmberKazakhAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes aka-pulse-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(245,158,11,0.8), 0 0 18px 7px rgba(245,158,11,0.4), 0 0 32px 12px rgba(251,191,36,0.2); }
          30%  { box-shadow: 0 0 14px 6px rgba(255,180,0,1), 0 0 28px 11px rgba(245,158,11,0.6), 0 0 50px 20px rgba(251,191,36,0.35); }
          60%  { box-shadow: 0 0 10px 4px rgba(245,158,11,0.85), 0 0 22px 9px rgba(245,158,11,0.45), 0 0 38px 15px rgba(251,191,36,0.25); }
          100% { box-shadow: 0 0 8px 3px rgba(245,158,11,0.8), 0 0 18px 7px rgba(245,158,11,0.4), 0 0 32px 12px rgba(251,191,36,0.2); }
        }
        @keyframes aka-spin-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes aka-shimmer-${uid} {
          0%   { transform: translateX(-${size * 1.5}px) rotate(15deg); opacity: 0; }
          20%  { opacity: 0.45; }
          80%  { opacity: 0.45; }
          100% { transform: translateX(${size * 1.5}px) rotate(15deg); opacity: 0; }
        }
        @keyframes aka-sparkle-${uid} {
          0%, 100% { opacity: 0; transform: scale(0.4); }
          50%       { opacity: 1; transform: scale(1.3); }
        }
      `}</style>

      {/* Rotating ornament ring */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(1, size * 0.05),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.035)}px solid transparent`,
        borderTopColor: 'rgba(245,158,11,0.75)',
        borderRightColor: 'rgba(251,191,36,0.35)',
        borderBottomColor: 'rgba(245,158,11,0.75)',
        borderLeftColor: 'rgba(251,191,36,0.35)',
        animation: `aka-spin-${uid} 4s linear infinite`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `aka-pulse-${uid} 2.5s ease-in-out infinite`,
      }}>
        <img
          src={getAssetUrl("/assets/static/amber_kazakh_s6_v2_675d657a.png")}
          alt="Янтарь Казахский колорит"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: `${posX}% ${posY}%`,
            display: 'block',
          }}
          draggable={false}
        />

        {/* Golden shimmer sweep */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(105deg, transparent 30%, rgba(255,200,50,0.28) 50%, transparent 70%)',
          animation: `aka-shimmer-${uid} 3.2s ease-in-out infinite`,
          pointerEvents: 'none',
        }} />

        {/* Warm radial overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 30%, rgba(255,180,0,0.1) 0%, transparent 60%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Amber sparkle particles */}
      {[
        { top: '4%',  left: '18%', delay: '0s',   dur: '2s' },
        { top: '8%',  left: '74%', delay: '0.7s', dur: '2.4s' },
        { top: '78%', left: '12%', delay: '1.2s', dur: '1.8s' },
        { top: '82%', left: '68%', delay: '0.4s', dur: '2.2s' },
        { top: '48%', left: '88%', delay: '1.5s', dur: '2s' },
      ].map((p, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute',
          top: p.top, left: p.left,
          width: Math.max(2, size * 0.055),
          height: Math.max(2, size * 0.055),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,210,0,1), rgba(245,158,11,0.6))',
          boxShadow: `0 0 ${size * 0.055}px rgba(255,200,0,0.9)`,
          animation: `aka-sparkle-${uid} ${p.dur} ease-in-out ${p.delay} infinite`,
          pointerEvents: 'none',
        }} />
      ))}
    </div>
  );
}
