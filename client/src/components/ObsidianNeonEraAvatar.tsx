import React from 'react';
import { getAssetUrl } from '@/lib/assetUrl';
interface Props { size?: number; className?: string; }
/**
 * ObsidianNeonEraAvatar — Neon vortex obsidian deity.
 * Season: Неоновая эра (Season 7) | Rank: Обсидиан (highest rank)
 * Animation: electric pulse + triple spin rings + color shift + lightning flicker + scan line + 4 orbiting dots
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function ObsidianNeonEraAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  const r = size / 2;
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes ona-pulse-${uid} {
          0%   { box-shadow: 0 0 12px 5px rgba(139,92,246,1), 0 0 28px 12px rgba(109,40,217,0.7), 0 0 55px 22px rgba(76,29,149,0.4), 0 0 90px 36px rgba(0,200,255,0.15); transform: scale(1); }
          20%  { box-shadow: 0 0 30px 13px rgba(192,132,252,1), 0 0 58px 24px rgba(139,92,246,0.9), 0 0 95px 38px rgba(109,40,217,0.6), 0 0 140px 56px rgba(0,200,255,0.25); transform: scale(1.05); }
          40%  { box-shadow: 0 0 12px 5px rgba(0,200,255,0.9), 0 0 28px 12px rgba(0,150,255,0.6), 0 0 55px 22px rgba(139,92,246,0.4), 0 0 90px 36px rgba(192,132,252,0.2); transform: scale(1); }
          60%  { box-shadow: 0 0 25px 11px rgba(180,100,255,1), 0 0 50px 21px rgba(139,92,246,0.8), 0 0 85px 34px rgba(0,200,255,0.5), 0 0 125px 50px rgba(76,29,149,0.25); transform: scale(1.04); }
          80%  { box-shadow: 0 0 12px 5px rgba(139,92,246,1), 0 0 28px 12px rgba(109,40,217,0.7), 0 0 55px 22px rgba(76,29,149,0.4), 0 0 90px 36px rgba(0,200,255,0.15); transform: scale(1); }
          100% { box-shadow: 0 0 12px 5px rgba(139,92,246,1), 0 0 28px 12px rgba(109,40,217,0.7), 0 0 55px 22px rgba(76,29,149,0.4), 0 0 90px 36px rgba(0,200,255,0.15); transform: scale(1); }
        }
        @keyframes ona-spin1-${uid} { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        @keyframes ona-spin2-${uid} { from { transform: rotate(0deg); } to { transform: rotate(-360deg); } }
        @keyframes ona-spin3-${uid} { from { transform: rotate(30deg); } to { transform: rotate(390deg); } }
        @keyframes ona-wave-${uid} {
          0%   { transform: scale(1); opacity: 0.9; }
          100% { transform: scale(2.8); opacity: 0; }
        }
        @keyframes ona-scan-${uid} {
          0%   { transform: translateY(-${size}px); opacity: 0.5; }
          100% { transform: translateY(${size}px); opacity: 0; }
        }
        @keyframes ona-lightning-${uid} {
          0%, 70%, 100% { opacity: 0; }
          73%            { opacity: 1; }
          76%            { opacity: 0.2; }
          79%            { opacity: 0.8; }
          82%            { opacity: 0; }
        }
        @keyframes ona-lightning2-${uid} {
          0%, 40%, 100% { opacity: 0; }
          43%            { opacity: 0.9; }
          46%            { opacity: 0.1; }
          49%            { opacity: 0.7; }
          52%            { opacity: 0; }
        }
        @keyframes ona-orbit-dot-${uid} {
          from { transform: rotate(0deg) translateX(${r * 0.6}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${r * 0.6}px) rotate(-360deg); }
        }
        @keyframes ona-orbit-dot2-${uid} {
          from { transform: rotate(180deg) translateX(${r * 0.6}px) rotate(-180deg); }
          to   { transform: rotate(540deg) translateX(${r * 0.6}px) rotate(-540deg); }
        }
        @keyframes ona-orbit-dot3-${uid} {
          from { transform: rotate(90deg) translateX(${r * 0.45}px) rotate(-90deg); }
          to   { transform: rotate(450deg) translateX(${r * 0.45}px) rotate(-450deg); }
        }
        @keyframes ona-orbit-dot4-${uid} {
          from { transform: rotate(270deg) translateX(${r * 0.45}px) rotate(-270deg); }
          to   { transform: rotate(630deg) translateX(${r * 0.45}px) rotate(-630deg); }
        }
      `}</style>

      {/* Outer orbit ring 1 — slow CW purple-cyan */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(3, size * 0.08),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.025)}px solid transparent`,
        borderTopColor: 'rgba(192,132,252,0.95)',
        borderRightColor: 'rgba(0,200,255,0.6)',
        borderBottomColor: 'rgba(139,92,246,0.8)',
        borderLeftColor: 'rgba(0,150,255,0.4)',
        animation: `ona-spin1-${uid} 4s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Orbit ring 2 — CCW cyan-purple */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(1, size * 0.03),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.02)}px solid transparent`,
        borderTopColor: 'rgba(0,200,255,0.8)',
        borderRightColor: 'rgba(139,92,246,0.7)',
        borderBottomColor: 'rgba(0,200,255,0.5)',
        borderLeftColor: 'rgba(192,132,252,0.6)',
        animation: `ona-spin2-${uid} 2.5s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Orbit ring 3 — fast inner */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: Math.max(1, size * 0.07),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.015)}px solid transparent`,
        borderTopColor: 'rgba(180,100,255,0.9)',
        borderBottomColor: 'rgba(0,220,255,0.6)',
        animation: `ona-spin3-${uid} 1.5s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Expanding wave rings — 5 staggered */}
      {[0, 0.4, 0.8, 1.2, 1.6].map((delay, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `${Math.max(1, size * 0.01)}px solid ${i % 2 === 0 ? 'rgba(139,92,246,0.7)' : 'rgba(0,200,255,0.6)'}`,
          animation: `ona-wave-${uid} 2s ease-out ${delay}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* 4 orbiting neon dots */}
      {[
        { anim: `ona-orbit-dot-${uid}`, dur: '1.8s', color: 'rgba(192,132,252,1)', shadow: 'rgba(139,92,246,0.9)' },
        { anim: `ona-orbit-dot2-${uid}`, dur: '1.8s', color: 'rgba(0,220,255,1)', shadow: 'rgba(0,200,255,0.9)' },
        { anim: `ona-orbit-dot3-${uid}`, dur: '1.2s', color: 'rgba(255,100,255,1)', shadow: 'rgba(200,50,255,0.9)' },
        { anim: `ona-orbit-dot4-${uid}`, dur: '1.2s', color: 'rgba(100,200,255,1)', shadow: 'rgba(0,150,255,0.9)' },
      ].map((d, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', top: '50%', left: '50%',
          width: Math.max(3, size * 0.07), height: Math.max(3, size * 0.07),
          marginTop: -Math.max(1.5, size * 0.035), marginLeft: -Math.max(1.5, size * 0.035),
          borderRadius: '50%',
          background: d.color,
          boxShadow: `0 0 ${size * 0.07}px ${size * 0.04}px ${d.shadow}`,
          animation: `${d.anim} ${d.dur} linear infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `ona-pulse-${uid} 2s ease-in-out infinite`,
      }}>
        <img
          src={getAssetUrl("/assets/static/obsidian_neon_era_v2-adGE4hKxxPSNzmcWxb3qZE.webp")}
          alt="Обсидиан Неоновая эра"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, display: 'block' }}
          draggable={false}
        />
        {/* Scan line */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, right: 0, top: 0,
          height: Math.max(2, size * 0.04),
          background: 'linear-gradient(transparent, rgba(139,92,246,0.6), transparent)',
          animation: `ona-scan-${uid} 1.5s linear infinite`,
        }} />
        {/* Lightning flash 1 */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 70% 25%, rgba(200,150,255,0.8), transparent 55%)',
          animation: `ona-lightning-${uid} 3s ease-in-out infinite`,
        }} />
        {/* Lightning flash 2 */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 30% 70%, rgba(0,220,255,0.7), transparent 50%)',
          animation: `ona-lightning2-${uid} 2.5s ease-in-out infinite`,
        }} />
        {/* Void vignette */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 50%, transparent 20%, rgba(20,0,50,0.45) 100%)',
        }} />
      </div>
    </div>
  );
}
