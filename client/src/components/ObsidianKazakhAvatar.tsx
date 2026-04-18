import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * ObsidianKazakhAvatar — Kazakh Khan reborn as obsidian deity.
 * Season: Казахский колорит (Season 6) | Rank: Обсидиан (highest rank)
 * Animation: triple orbit rings + void pulse + lightning flicker + gold shimmer + floating particles
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function ObsidianKazakhAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  const r = size / 2;
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes oka-pulse-${uid} {
          0%   { box-shadow: 0 0 10px 4px rgba(139,92,246,0.9), 0 0 22px 9px rgba(109,40,217,0.6), 0 0 45px 18px rgba(76,29,149,0.35), 0 0 70px 28px rgba(180,130,20,0.15); transform: scale(1); }
          25%  { box-shadow: 0 0 25px 11px rgba(180,150,255,1), 0 0 48px 20px rgba(139,92,246,0.85), 0 0 80px 33px rgba(109,40,217,0.55), 0 0 110px 45px rgba(212,175,55,0.25); transform: scale(1.045); }
          50%  { box-shadow: 0 0 10px 4px rgba(139,92,246,0.9), 0 0 22px 9px rgba(109,40,217,0.6), 0 0 45px 18px rgba(76,29,149,0.35), 0 0 70px 28px rgba(180,130,20,0.15); transform: scale(1); }
          75%  { box-shadow: 0 0 20px 9px rgba(167,139,250,0.95), 0 0 40px 17px rgba(139,92,246,0.75), 0 0 68px 28px rgba(109,40,217,0.5), 0 0 95px 40px rgba(212,175,55,0.2); transform: scale(1.03); }
          100% { box-shadow: 0 0 10px 4px rgba(139,92,246,0.9), 0 0 22px 9px rgba(109,40,217,0.6), 0 0 45px 18px rgba(76,29,149,0.35), 0 0 70px 28px rgba(180,130,20,0.15); transform: scale(1); }
        }
        @keyframes oka-orbit1-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes oka-orbit2-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(-360deg); }
        }
        @keyframes oka-orbit3-${uid} {
          from { transform: rotate(45deg); }
          to   { transform: rotate(405deg); }
        }
        @keyframes oka-wave-${uid} {
          0%   { transform: scale(1); opacity: 0.8; }
          100% { transform: scale(2.6); opacity: 0; }
        }
        @keyframes oka-shimmer-${uid} {
          0%   { opacity: 0; transform: translateX(-130%) skewX(-20deg); }
          35%  { opacity: 0.6; }
          65%  { opacity: 0.6; }
          100% { opacity: 0; transform: translateX(230%) skewX(-20deg); }
        }
        @keyframes oka-lightning-${uid} {
          0%, 85%, 100% { opacity: 0; }
          88%            { opacity: 1; }
          91%            { opacity: 0.3; }
          94%            { opacity: 0.9; }
          97%            { opacity: 0; }
        }
        @keyframes oka-particle-${uid} {
          0%   { transform: translateY(0) scale(1); opacity: 1; }
          100% { transform: translateY(-${size * 0.6}px) scale(0); opacity: 0; }
        }
        @keyframes oka-crown-${uid} {
          0%, 100% { opacity: 0.6; transform: scale(1) translateY(0); }
          50%       { opacity: 1; transform: scale(1.2) translateY(-2px); }
        }
        @keyframes oka-orbit-dot-${uid} {
          from { transform: rotate(0deg) translateX(${r * 0.65}px) rotate(0deg); }
          to   { transform: rotate(360deg) translateX(${r * 0.65}px) rotate(-360deg); }
        }
        @keyframes oka-orbit-dot2-${uid} {
          from { transform: rotate(120deg) translateX(${r * 0.65}px) rotate(-120deg); }
          to   { transform: rotate(480deg) translateX(${r * 0.65}px) rotate(-480deg); }
        }
        @keyframes oka-orbit-dot3-${uid} {
          from { transform: rotate(240deg) translateX(${r * 0.65}px) rotate(-240deg); }
          to   { transform: rotate(600deg) translateX(${r * 0.65}px) rotate(-600deg); }
        }
      `}</style>

      {/* Outer orbit ring 1 — slow CW purple */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(3, size * 0.07),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.022)}px solid transparent`,
        borderTopColor: 'rgba(180,150,255,0.95)',
        borderRightColor: 'rgba(139,92,246,0.4)',
        borderBottomColor: 'rgba(109,40,217,0.7)',
        borderLeftColor: 'rgba(76,29,149,0.3)',
        animation: `oka-orbit1-${uid} 5s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Orbit ring 2 — medium CCW gold-violet */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: -Math.max(1, size * 0.03),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.018)}px solid transparent`,
        borderTopColor: 'rgba(212,175,55,0.7)',
        borderRightColor: 'rgba(139,92,246,0.6)',
        borderBottomColor: 'rgba(212,175,55,0.4)',
        borderLeftColor: 'rgba(109,40,217,0.5)',
        animation: `oka-orbit2-${uid} 3.5s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Orbit ring 3 — fast CW bright violet */}
      <div aria-hidden="true" style={{
        position: 'absolute',
        inset: Math.max(1, size * 0.06),
        borderRadius: '50%',
        border: `${Math.max(1, size * 0.015)}px solid transparent`,
        borderTopColor: 'rgba(167,139,250,0.8)',
        borderBottomColor: 'rgba(167,139,250,0.3)',
        animation: `oka-orbit3-${uid} 2s linear infinite`,
        pointerEvents: 'none',
      }} />

      {/* Expanding wave rings — 4 staggered */}
      {[0, 0.5, 1.0, 1.5].map((delay, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          border: `${Math.max(1, size * 0.012)}px solid rgba(139,92,246,${0.6 - i * 0.1})`,
          animation: `oka-wave-${uid} 2.2s ease-out ${delay}s infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* 3 orbiting dots */}
      {[`oka-orbit-dot-${uid}`, `oka-orbit-dot2-${uid}`, `oka-orbit-dot3-${uid}`].map((anim, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', top: '50%', left: '50%',
          width: Math.max(3, size * 0.07), height: Math.max(3, size * 0.07),
          marginTop: -Math.max(1.5, size * 0.035), marginLeft: -Math.max(1.5, size * 0.035),
          borderRadius: '50%',
          background: i === 0 ? 'rgba(212,175,55,0.95)' : i === 1 ? 'rgba(167,139,250,0.95)' : 'rgba(255,255,255,0.9)',
          boxShadow: `0 0 ${size * 0.06}px ${size * 0.04}px ${i === 0 ? 'rgba(212,175,55,0.8)' : 'rgba(139,92,246,0.8)'}`,
          animation: `${anim} 2s linear infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      {/* Floating gold particles */}
      {[
        { left: '20%', delay: '0s', dur: '2.2s' },
        { left: '50%', delay: '0.7s', dur: '1.8s' },
        { left: '75%', delay: '1.4s', dur: '2.5s' },
        { left: '35%', delay: '0.3s', dur: '2.0s' },
        { left: '62%', delay: '1.1s', dur: '1.6s' },
      ].map((p, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', bottom: '5%', left: p.left,
          width: Math.max(2, size * 0.04), height: Math.max(2, size * 0.04),
          borderRadius: '50%',
          background: i % 2 === 0 ? 'rgba(212,175,55,0.9)' : 'rgba(167,139,250,0.9)',
          boxShadow: `0 0 ${size * 0.05}px ${size * 0.03}px ${i % 2 === 0 ? 'rgba(212,175,55,0.7)' : 'rgba(139,92,246,0.7)'}`,
          animation: `oka-particle-${uid} ${p.dur} ease-out ${p.delay} infinite`,
          pointerEvents: 'none',
        }} />
      ))}

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `oka-pulse-${uid} 2.4s ease-in-out infinite`,
      }}>
        <img
          src="/assets/static/obsidian_kazakh_v2-CwSTTzwCooxU3Z7eSWybpy.webp"
          alt="Обсидиан Казахский хан"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: `${posX}% ${posY}%`, display: 'block' }}
          draggable={false}
        />
        {/* Gold-violet shimmer sweep */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'linear-gradient(115deg, transparent 30%, rgba(212,175,55,0.25) 45%, rgba(167,139,250,0.45) 55%, transparent 70%)',
          animation: `oka-shimmer-${uid} 3s ease-in-out infinite`,
        }} />
        {/* Lightning flash overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 60% 30%, rgba(200,180,255,0.7), transparent 60%)',
          animation: `oka-lightning-${uid} 4s ease-in-out infinite`,
        }} />
        {/* Deep void vignette */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 45%, transparent 25%, rgba(30,0,60,0.5) 100%)',
        }} />
        {/* Crown glow */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '5%', left: '30%',
          width: size * 0.4, height: size * 0.18, borderRadius: '50%',
          background: 'radial-gradient(ellipse, rgba(212,175,55,0.6), transparent 70%)',
          animation: `oka-crown-${uid} 2s ease-in-out infinite`,
        }} />
      </div>
    </div>
  );
}
