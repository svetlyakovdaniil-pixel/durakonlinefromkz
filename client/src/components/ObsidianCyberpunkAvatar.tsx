import React from 'react';
import { getAssetUrl } from '@/lib/assetUrl';
interface Props { size?: number; className?: string; }
/**
 * ObsidianCyberpunkAvatar — Ultimate obsidian netrunner overlord of the digital void.
 * Season: Киберпанк (Season 10) | Rank: Обсидиан (highest rank)
 * Animation: void data corruption + matrix rain + galaxy eye pulse + system collapse flicker
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function ObsidianCyberpunkAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes oca-void-${uid} {
          0%   { box-shadow: 0 0 10px 4px rgba(139,92,246,0.9), 0 0 22px 9px rgba(109,40,217,0.6), 0 0 44px 18px rgba(76,29,149,0.35); }
          30%  { box-shadow: 0 0 20px 9px rgba(167,139,250,1), 0 0 40px 18px rgba(139,92,246,0.8), 0 0 70px 30px rgba(109,40,217,0.5); }
          60%  { box-shadow: 0 0 6px 2px rgba(109,40,217,0.7), 0 0 16px 6px rgba(76,29,149,0.5), 0 0 36px 14px rgba(139,92,246,0.3); }
          100% { box-shadow: 0 0 10px 4px rgba(139,92,246,0.9), 0 0 22px 9px rgba(109,40,217,0.6), 0 0 44px 18px rgba(76,29,149,0.35); }
        }
        @keyframes oca-corrupt-${uid} {
          0%, 100% { opacity: 0; }
          10%       { opacity: 1; clip-path: inset(20% 0 70% 0); }
          11%       { opacity: 0; }
          35%       { opacity: 0; }
          36%       { opacity: 0.8; clip-path: inset(50% 0 10% 0); }
          37%       { opacity: 0; }
          65%       { opacity: 0; }
          66%       { opacity: 0.6; clip-path: inset(5% 0 80% 0); }
          67%       { opacity: 0; }
        }
        @keyframes oca-rain-${uid} {
          0%   { transform: translateY(-${size * 0.4}px); opacity: 0.9; }
          100% { transform: translateY(${size * 0.6}px); opacity: 0; }
        }
        @keyframes oca-eye-${uid} {
          0%, 100% { opacity: 0.5; transform: scale(1); filter: blur(0px); }
          50%       { opacity: 1; transform: scale(1.6); filter: blur(1.5px); }
        }
        @keyframes oca-rotate-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes oca-scan-${uid} {
          0%   { transform: translateY(-${size * 1.2}px); opacity: 0.7; }
          100% { transform: translateY(${size * 1.2}px); opacity: 0; }
        }
      `}</style>

      {/* Rotating void ring */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(2, size * 0.05),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.025)}px solid transparent`,
        borderTopColor: 'rgba(139,92,246,0.9)',
        borderRightColor: 'rgba(76,29,149,0.5)',
        borderBottomColor: 'rgba(167,139,250,0.8)',
        borderLeftColor: 'rgba(109,40,217,0.4)',
        animation: `oca-rotate-${uid} 2s linear infinite`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `oca-void-${uid} 2.2s ease-in-out infinite`,
      }}>
        <img
          src={getAssetUrl("/assets/static/obsidian_cyberpunk-F42HmWbza98ZbqBggYVNNt.webp")}
          alt="Обсидиан Киберпанк"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, display: 'block' }}
          draggable={false}
        />
        {/* Data corruption glitch */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(139,92,246,0.7)',
          animation: `oca-corrupt-${uid} 3s ease-in-out infinite`,
        }} />
        {/* Scan line */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, right: 0,
          height: size * 0.1,
          background: 'linear-gradient(to bottom, transparent, rgba(139,92,246,0.4), transparent)',
          animation: `oca-scan-${uid} 1.8s linear infinite`,
        }} />
        {/* Void vignette */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 45%, transparent 25%, rgba(76,29,149,0.4) 100%)',
        }} />
        {/* Galaxy eye glow */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '35%', left: '40%',
          width: size * 0.14, height: size * 0.14, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,180,255,1), rgba(139,92,246,0.4))',
          boxShadow: `0 0 ${size * 0.12}px ${size * 0.08}px rgba(139,92,246,0.95)`,
          animation: `oca-eye-${uid} 1.6s ease-in-out infinite`,
        }} />
      </div>

      {/* Matrix data rain */}
      {[
        { left: '12%', delay: '0s', dur: '1.3s' },
        { left: '30%', delay: '0.6s', dur: '1.7s' },
        { left: '55%', delay: '0.2s', dur: '1.1s' },
        { left: '72%', delay: '0.9s', dur: '1.5s' },
        { left: '88%', delay: '0.4s', dur: '1.9s' },
      ].map((p, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', top: '2%', left: p.left,
          width: Math.max(1, size * 0.022),
          height: size * 0.2,
          background: 'linear-gradient(to bottom, rgba(167,139,250,0.95), rgba(139,92,246,0.5), transparent)',
          borderRadius: 2,
          animation: `oca-rain-${uid} ${p.dur} linear ${p.delay} infinite`,
        }} />
      ))}
    </div>
  );
}
