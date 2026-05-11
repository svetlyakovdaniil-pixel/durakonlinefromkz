import React from 'react';
import { getAssetUrl } from '@/lib/assetUrl';
interface Props { size?: number; className?: string; }
/**
 * AmberApocalypseAvatar — Survivor in hazmat suit, nuclear explosion.
 * Season: Апокалипсис (Season 8) | Rank: Янтарь
 * Animation: lava pulse + radiation flicker + ember particles + crack glow
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function AmberApocalypseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes aap-lava-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(245,158,11,0.8), 0 0 18px 7px rgba(249,115,22,0.5), 0 0 32px 12px rgba(234,179,8,0.25); }
          33%  { box-shadow: 0 0 22px 10px rgba(249,115,22,1), 0 0 42px 17px rgba(245,158,11,0.7), 0 0 62px 24px rgba(234,179,8,0.4); }
          66%  { box-shadow: 0 0 14px 6px rgba(234,179,8,0.9), 0 0 28px 11px rgba(245,158,11,0.6), 0 0 48px 18px rgba(249,115,22,0.3); }
          100% { box-shadow: 0 0 8px 3px rgba(245,158,11,0.8), 0 0 18px 7px rgba(249,115,22,0.5), 0 0 32px 12px rgba(234,179,8,0.25); }
        }
        @keyframes aap-flicker-${uid} {
          0%, 100% { opacity: 1; }
          82%       { opacity: 1; }
          83%       { opacity: 0.5; }
          84%       { opacity: 1; }
          90%       { opacity: 0.7; }
          91%       { opacity: 1; }
        }
        @keyframes aap-ember-${uid} {
          0%   { transform: translateY(0) translateX(0) scale(1); opacity: 0.9; }
          100% { transform: translateY(-${size * 0.7}px) translateX(${size * 0.15}px) scale(0.2); opacity: 0; }
        }
        @keyframes aap-crack-${uid} {
          0%, 100% { opacity: 0.6; }
          50%       { opacity: 1; }
        }
        @keyframes aap-scan-${uid} {
          0%   { transform: translateY(-${size * 1.1}px); opacity: 0.5; }
          100% { transform: translateY(${size * 1.1}px); opacity: 0; }
        }
      `}</style>

      {/* Lava crack border */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(1, size * 0.04),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.04)}px solid transparent`,
        borderTopColor: 'rgba(249,115,22,0.85)',
        borderRightColor: 'rgba(245,158,11,0.5)',
        borderBottomColor: 'rgba(249,115,22,0.85)',
        borderLeftColor: 'rgba(234,179,8,0.5)',
        boxShadow: `0 0 ${size * 0.06}px rgba(249,115,22,0.5)`,
        animation: `aap-crack-${uid} 1.5s ease-in-out infinite`,
        pointerEvents: 'none',
      }} />

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `aap-lava-${uid} 1.6s ease-in-out infinite, aap-flicker-${uid} 4s ease-in-out infinite`,
      }}>
        <img
          src={getAssetUrl("/assets/static/amber_apocalypse_s8_96da3687.png")}
          alt="Янтарь Апокалипсис"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: `${posX}% ${posY}%`,
            display: 'block',
          }}
          draggable={false}
        />

        {/* Heat scan line */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, right: 0,
          height: size * 0.08,
          background: 'linear-gradient(to bottom, transparent, rgba(249,115,22,0.35), transparent)',
          animation: `aap-scan-${uid} 2s linear infinite`,
          pointerEvents: 'none',
        }} />

        {/* Lava overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 80%, rgba(249,115,22,0.12) 0%, transparent 55%)',
          pointerEvents: 'none',
        }} />
      </div>

      {/* Ember particles rising */}
      {[
        { bottom: '5%',  left: '20%', delay: '0s',   dur: '1.4s', size: 0.05 },
        { bottom: '8%',  left: '50%', delay: '0.5s', dur: '1.8s', size: 0.04 },
        { bottom: '5%',  left: '75%', delay: '1s',   dur: '1.2s', size: 0.055 },
        { bottom: '10%', left: '35%', delay: '0.7s', dur: '1.6s', size: 0.035 },
      ].map((p, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute',
          bottom: p.bottom, left: p.left,
          width: Math.max(2, size * p.size),
          height: Math.max(2, size * p.size),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,200,0,1), rgba(249,115,22,0.7))',
          boxShadow: `0 0 ${size * 0.06}px rgba(249,115,22,0.9)`,
          animation: `aap-ember-${uid} ${p.dur} ease-out ${p.delay} infinite`,
          pointerEvents: 'none',
        }} />
      ))}
    </div>
  );
}
