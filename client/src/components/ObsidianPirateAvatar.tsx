import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ObsidianPirateAvatar — Legendary obsidian ghost fleet admiral.
 * Season: Пиратские острова (Season 3) | Rank: Обсидиан (highest rank)
 * Animation: purple ghost fire + lightning flash + skull eye glow + storm pulse
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function ObsidianPirateAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes opa-storm-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(139,92,246,0.8), 0 0 20px 8px rgba(109,40,217,0.5), 0 0 40px 16px rgba(76,29,149,0.3); }
          20%  { box-shadow: 0 0 20px 9px rgba(167,139,250,1), 0 0 40px 18px rgba(139,92,246,0.8), 0 0 70px 30px rgba(109,40,217,0.5); }
          40%  { box-shadow: 0 0 8px 3px rgba(139,92,246,0.7), 0 0 18px 7px rgba(109,40,217,0.4), 0 0 35px 14px rgba(76,29,149,0.25); }
          60%  { box-shadow: 0 0 24px 11px rgba(180,100,255,1), 0 0 45px 20px rgba(139,92,246,0.9), 0 0 75px 32px rgba(109,40,217,0.55); }
          80%  { box-shadow: 0 0 10px 4px rgba(139,92,246,0.75), 0 0 22px 9px rgba(109,40,217,0.45), 0 0 42px 17px rgba(76,29,149,0.3); }
          100% { box-shadow: 0 0 8px 3px rgba(139,92,246,0.8), 0 0 20px 8px rgba(109,40,217,0.5), 0 0 40px 16px rgba(76,29,149,0.3); }
        }
        @keyframes opa-lightning-${uid} {
          0%, 100% { opacity: 0; }
          5%        { opacity: 1; }
          6%        { opacity: 0; }
          15%       { opacity: 0; }
          16%       { opacity: 0.8; }
          17%       { opacity: 0; }
          55%       { opacity: 0; }
          56%       { opacity: 1; }
          57%       { opacity: 0; }
        }
        @keyframes opa-fire-${uid} {
          0%   { transform: translateY(0) scaleX(1); opacity: 0.8; }
          50%  { transform: translateY(-${size * 0.15}px) scaleX(1.2); opacity: 0.6; }
          100% { transform: translateY(-${size * 0.3}px) scaleX(0.8); opacity: 0; }
        }
        @keyframes opa-eye-${uid} {
          0%, 100% { opacity: 0.5; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.4); }
        }
        @keyframes opa-rotate-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>

      {/* Rotating storm ring */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(2, size * 0.05),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.025)}px solid transparent`,
        borderTopColor: 'rgba(167,139,250,0.9)',
        borderRightColor: 'rgba(109,40,217,0.4)',
        borderBottomColor: 'rgba(139,92,246,0.7)',
        borderLeftColor: 'rgba(76,29,149,0.5)',
        animation: `opa-rotate-${uid} 2.5s linear infinite`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `opa-storm-${uid} 2s ease-in-out infinite`,
      }}>
        <img
          src="/assets/static/obsidian_pirate_islands-m7mqMLNNUB3WiggJMsPgQ7.webp"
          alt="Обсидиан Пираты"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, display: 'block' }}
          draggable={false}
        />
        {/* Lightning flash overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(200,180,255,0.6)',
          animation: `opa-lightning-${uid} 4s ease-in-out infinite`,
        }} />
        {/* Dark vignette */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 45%, transparent 30%, rgba(76,29,149,0.4) 100%)',
        }} />
        {/* Skull eye glow */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '32%', left: '40%',
          width: size * 0.14, height: size * 0.1, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,150,255,1), rgba(139,92,246,0.4))',
          boxShadow: `0 0 ${size * 0.1}px ${size * 0.06}px rgba(139,92,246,0.9)`,
          animation: `opa-eye-${uid} 1.5s ease-in-out infinite`,
        }} />
      </div>

      {/* Ghost fire particles */}
      {[
        { left: '20%', delay: '0s', dur: '1.2s' },
        { left: '50%', delay: '0.4s', dur: '1.5s' },
        { left: '75%', delay: '0.8s', dur: '1.1s' },
      ].map((p, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', bottom: '5%', left: p.left,
          width: size * 0.08, height: size * 0.14,
          background: 'linear-gradient(to top, rgba(139,92,246,0.9), rgba(167,139,250,0.5), transparent)',
          borderRadius: '50% 50% 30% 30%',
          animation: `opa-fire-${uid} ${p.dur} ease-out ${p.delay} infinite`,
        }} />
      ))}
    </div>
  );
}
