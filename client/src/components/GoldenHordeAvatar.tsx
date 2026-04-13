import React from 'react';

interface GoldenHordeAvatarProps {
  size?: number;
  className?: string;
}

/**
 * GoldenHordeAvatar — AI-generated photorealistic Golden Horde warrior.
 * CSS effects:
 *   - Large red/crimson spark particles burst from blade area and fade
 *   - Golden rim pulse border
 * No Canvas, no JS loop — pure CSS @keyframes.
 */
export function GoldenHordeAvatar({ size = 48, className = '' }: GoldenHordeAvatarProps) {
  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        position: 'relative',
        display: 'block',
        flexShrink: 0,
      }}
    >
      <style>{`
        /* ── Sparks: large red/crimson dots burst from blade area ── */
        @keyframes gh-spark-a {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          6%   { opacity: 1; }
          100% { transform: translate(22px, -28px) scale(0.08); opacity: 0; }
        }
        @keyframes gh-spark-b {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          6%   { opacity: 0.9; }
          100% { transform: translate(-18px, -24px) scale(0.08); opacity: 0; }
        }
        @keyframes gh-spark-c {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          6%   { opacity: 0.85; }
          100% { transform: translate(28px, -10px) scale(0.08); opacity: 0; }
        }
        @keyframes gh-spark-d {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          6%   { opacity: 0.8; }
          100% { transform: translate(-12px, -32px) scale(0.08); opacity: 0; }
        }
        @keyframes gh-spark-e {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          6%   { opacity: 0.75; }
          100% { transform: translate(10px, -36px) scale(0.08); opacity: 0; }
        }
        @keyframes gh-spark-f {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          6%   { opacity: 0.7; }
          100% { transform: translate(-26px, -16px) scale(0.08); opacity: 0; }
        }
        @keyframes gh-spark-g {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          6%   { opacity: 0.65; }
          100% { transform: translate(16px, -20px) scale(0.08); opacity: 0; }
        }
        @keyframes gh-spark-h {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          6%   { opacity: 0.6; }
          100% { transform: translate(-8px, -38px) scale(0.08); opacity: 0; }
        }

        /* ── Golden rim pulse ── */
        @keyframes gh-rim-pulse {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1.0; }
        }

        /* ── Red ambient glow ── */
        @keyframes gh-glow {
          0%, 100% { opacity: 0.0; }
          20%, 80%  { opacity: 0.2; }
        }
      `}</style>

      {/* Base photorealistic image — static, no tremor */}
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/golden_horde_warrior_avatar-oJWWxe5DCcpxB9nbWMET8o.webp"
        alt="Воин Золотой Орды"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 10%',
          display: 'block',
        }}
        draggable={false}
      />

      {/* ── Spark particles — positioned at blade tip (upper-right area) ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '28%',
          left: '62%',
          width: 0,
          height: 0,
          pointerEvents: 'none',
        }}
      >
        {/* Spark A — large bright red */}
        <div style={{
          position: 'absolute',
          width: Math.max(6, size * 0.13),
          height: Math.max(6, size * 0.13),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,60,20,1) 0%, rgba(180,0,0,0.85) 40%, rgba(120,0,0,0.3) 70%, transparent 100%)',
          animation: 'gh-spark-a 1.3s ease-out infinite',
          animationDelay: '0s',
        }} />
        {/* Spark B — crimson */}
        <div style={{
          position: 'absolute',
          width: Math.max(5, size * 0.11),
          height: Math.max(5, size * 0.11),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220,20,60,1) 0%, rgba(160,0,30,0.8) 40%, rgba(100,0,20,0.3) 70%, transparent 100%)',
          animation: 'gh-spark-b 1.3s ease-out infinite',
          animationDelay: '0.14s',
        }} />
        {/* Spark C — orange-red */}
        <div style={{
          position: 'absolute',
          width: Math.max(5, size * 0.10),
          height: Math.max(5, size * 0.10),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,80,0,1) 0%, rgba(200,20,0,0.8) 40%, rgba(130,0,0,0.25) 70%, transparent 100%)',
          animation: 'gh-spark-c 1.3s ease-out infinite',
          animationDelay: '0.07s',
        }} />
        {/* Spark D — dark crimson */}
        <div style={{
          position: 'absolute',
          width: Math.max(4, size * 0.09),
          height: Math.max(4, size * 0.09),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,0,40,1) 0%, rgba(140,0,20,0.75) 40%, rgba(80,0,10,0.25) 70%, transparent 100%)',
          animation: 'gh-spark-d 1.3s ease-out infinite',
          animationDelay: '0.22s',
        }} />
        {/* Spark E — bright red */}
        <div style={{
          position: 'absolute',
          width: Math.max(4, size * 0.085),
          height: Math.max(4, size * 0.085),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,40,10,0.95) 0%, rgba(190,0,0,0.7) 40%, rgba(110,0,0,0.2) 70%, transparent 100%)',
          animation: 'gh-spark-e 1.3s ease-out infinite',
          animationDelay: '0.30s',
        }} />
        {/* Spark F — deep crimson */}
        <div style={{
          position: 'absolute',
          width: Math.max(4, size * 0.08),
          height: Math.max(4, size * 0.08),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(180,0,50,0.9) 0%, rgba(120,0,30,0.65) 40%, rgba(70,0,15,0.2) 70%, transparent 100%)',
          animation: 'gh-spark-f 1.3s ease-out infinite',
          animationDelay: '0.38s',
        }} />
        {/* Spark G — medium red */}
        <div style={{
          position: 'absolute',
          width: Math.max(3, size * 0.07),
          height: Math.max(3, size * 0.07),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(240,30,30,0.85) 0%, rgba(170,0,0,0.6) 40%, transparent 100%)',
          animation: 'gh-spark-g 1.3s ease-out infinite',
          animationDelay: '0.10s',
        }} />
        {/* Spark H — small bright core */}
        <div style={{
          position: 'absolute',
          width: Math.max(3, size * 0.065),
          height: Math.max(3, size * 0.065),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,100,50,0.9) 0%, rgba(200,20,0,0.55) 40%, transparent 100%)',
          animation: 'gh-spark-h 1.3s ease-out infinite',
          animationDelay: '0.45s',
        }} />
      </div>

      {/* ── Red ambient glow at blade area ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          top: '15%',
          right: '10%',
          width: '40%',
          height: '40%',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(200,0,0,0.35) 0%, rgba(150,0,0,0.15) 50%, transparent 100%)',
          animation: 'gh-glow 1.3s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* ── Dark vignette ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.5) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* ── Golden rim border pulse ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: `${Math.max(1.5, size * 0.035)}px solid rgba(218,165,32,0.85)`,
          animation: 'gh-rim-pulse 1.8s ease-in-out infinite',
          pointerEvents: 'none',
          boxSizing: 'border-box',
        }}
      />
    </div>
  );
}

export default GoldenHordeAvatar;
