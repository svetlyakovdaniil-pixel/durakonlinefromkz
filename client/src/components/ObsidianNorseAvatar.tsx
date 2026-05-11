import React from 'react';
import { getAssetUrl } from '@/lib/assetUrl';
interface Props { size?: number; className?: string; }
/**
 * ObsidianNorseAvatar — Odin reborn as obsidian god of cosmic darkness.
 * Season: Скандинавские боги (Season 4) | Rank: Обсидиан (highest rank)
 * Animation: rune lightning + aurora shimmer + raven shadow pulse + void eye
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function ObsidianNorseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes ona-pulse-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(139,92,246,0.8), 0 0 20px 8px rgba(59,130,246,0.4), 0 0 40px 16px rgba(109,40,217,0.3); }
          33%  { box-shadow: 0 0 18px 8px rgba(167,139,250,1), 0 0 35px 15px rgba(96,165,250,0.6), 0 0 60px 25px rgba(139,92,246,0.45); }
          66%  { box-shadow: 0 0 10px 4px rgba(109,40,217,0.9), 0 0 24px 10px rgba(59,130,246,0.35), 0 0 48px 20px rgba(76,29,149,0.35); }
          100% { box-shadow: 0 0 8px 3px rgba(139,92,246,0.8), 0 0 20px 8px rgba(59,130,246,0.4), 0 0 40px 16px rgba(109,40,217,0.3); }
        }
        @keyframes ona-rotate-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ona-aurora-${uid} {
          0%   { opacity: 0.2; transform: translateX(-30%) skewX(-10deg); }
          50%  { opacity: 0.5; transform: translateX(30%) skewX(10deg); }
          100% { opacity: 0.2; transform: translateX(-30%) skewX(-10deg); }
        }
        @keyframes ona-lightning-${uid} {
          0%, 100% { opacity: 0; }
          8%        { opacity: 1; }
          9%        { opacity: 0; }
          40%       { opacity: 0; }
          41%       { opacity: 0.7; }
          42%       { opacity: 0; }
          70%       { opacity: 0; }
          71%       { opacity: 0.9; }
          72%       { opacity: 0; }
        }
        @keyframes ona-eye-${uid} {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.5); }
        }
      `}</style>

      {/* Rotating rune ring */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(2, size * 0.05),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.025)}px solid transparent`,
        borderTopColor: 'rgba(96,165,250,0.8)',
        borderRightColor: 'rgba(139,92,246,0.9)',
        borderBottomColor: 'rgba(59,130,246,0.5)',
        borderLeftColor: 'rgba(167,139,250,0.7)',
        animation: `ona-rotate-${uid} 3.5s linear infinite`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `ona-pulse-${uid} 2.5s ease-in-out infinite`,
      }}>
        <img
          src={getAssetUrl("/assets/static/obsidian_norse_gods-cZ2YKE5bVYuvdXd4WuLkfw.webp")}
          alt="Обсидиан Скандинавские боги"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, display: 'block' }}
          draggable={false}
        />
        {/* Aurora shimmer */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'linear-gradient(120deg, rgba(96,165,250,0.2) 0%, rgba(139,92,246,0.35) 50%, rgba(52,211,153,0.15) 100%)',
          animation: `ona-aurora-${uid} 4s ease-in-out infinite`,
        }} />
        {/* Lightning flash */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(180,200,255,0.55)',
          animation: `ona-lightning-${uid} 5s ease-in-out infinite`,
        }} />
        {/* Void vignette */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 40%, transparent 30%, rgba(76,29,149,0.35) 100%)',
        }} />
        {/* Void eye glow */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '33%', left: '44%',
          width: size * 0.1, height: size * 0.1, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(167,139,250,1), rgba(139,92,246,0.3))',
          boxShadow: `0 0 ${size * 0.1}px ${size * 0.06}px rgba(139,92,246,0.9)`,
          animation: `ona-eye-${uid} 2.2s ease-in-out infinite`,
        }} />
      </div>
    </div>
  );
}
