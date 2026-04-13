import React from 'react';

interface GoldenHordeAvatarProps {
  size?: number;
  className?: string;
}

/**
 * GoldenHordeAvatar — AI-generated photorealistic Golden Horde warrior.
 * CSS effects:
 *   1. Metal shimmer — narrow bright streak slides across helmet/blade area
 *   2. Spark particles — small bright dots burst from blade position and fade
 *   3. Tremor — subtle shake of the whole avatar, like a warrior tensing for battle
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
        /* ── Tremor: subtle shake of the whole image ── */
        @keyframes gh-tremor {
          0%,  100% { transform: translate(0, 0) rotate(0deg); }
          10%        { transform: translate(-0.8px, 0.4px) rotate(-0.15deg); }
          20%        { transform: translate(0.9px, -0.5px) rotate(0.2deg); }
          30%        { transform: translate(-0.6px, 0.7px) rotate(-0.1deg); }
          40%        { transform: translate(0.7px, -0.3px) rotate(0.15deg); }
          50%        { transform: translate(-0.5px, 0.6px) rotate(-0.2deg); }
          60%        { transform: translate(0.8px, 0.4px) rotate(0.1deg); }
          70%        { transform: translate(-0.7px, -0.5px) rotate(-0.15deg); }
          80%        { transform: translate(0.5px, 0.3px) rotate(0.1deg); }
          90%        { transform: translate(-0.4px, -0.4px) rotate(-0.1deg); }
        }

        /* ── Metal shimmer: bright narrow streak across upper-right (helmet + blade) ── */
        @keyframes gh-shimmer {
          0%   { transform: translate(-200%, -200%) rotate(-35deg); opacity: 0; }
          8%   { opacity: 1; }
          60%  { opacity: 0.9; }
          100% { transform: translate(200%, 200%) rotate(-35deg); opacity: 0; }
        }
        @keyframes gh-shimmer-2 {
          0%   { transform: translate(-200%, -200%) rotate(-35deg); opacity: 0; }
          8%   { opacity: 0.55; }
          60%  { opacity: 0.45; }
          100% { transform: translate(200%, 200%) rotate(-35deg); opacity: 0; }
        }

        /* ── Sparks: small bright dots burst from blade area ── */
        @keyframes gh-spark-a {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          5%   { opacity: 1; }
          100% { transform: translate(18px, -22px) scale(0.05); opacity: 0; }
        }
        @keyframes gh-spark-b {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          5%   { opacity: 0.85; }
          100% { transform: translate(-14px, -18px) scale(0.05); opacity: 0; }
        }
        @keyframes gh-spark-c {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          5%   { opacity: 0.75; }
          100% { transform: translate(22px, -8px) scale(0.05); opacity: 0; }
        }
        @keyframes gh-spark-d {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          5%   { opacity: 0.7; }
          100% { transform: translate(-10px, -26px) scale(0.05); opacity: 0; }
        }
        @keyframes gh-spark-e {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          5%   { opacity: 0.6; }
          100% { transform: translate(8px, -30px) scale(0.05); opacity: 0; }
        }
        @keyframes gh-spark-f {
          0%   { transform: translate(0, 0) scale(1); opacity: 0; }
          5%   { opacity: 0.5; }
          100% { transform: translate(-20px, -12px) scale(0.05); opacity: 0; }
        }

        /* ── Golden rim pulse ── */
        @keyframes gh-rim-pulse {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1.0; }
        }

        /* ── Dark vignette sync with tremor ── */
        @keyframes gh-vignette {
          0%, 100% { opacity: 0.55; }
          40%, 60%  { opacity: 0.7; }
        }
      `}</style>

      {/* Base photorealistic image — tremor animation */}
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/golden_horde_warrior_avatar-oJWWxe5DCcpxB9nbWMET8o.webp"
        alt="Воин Золотой Орды"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 10%',
          display: 'block',
          animation: 'gh-tremor 0.45s ease-in-out infinite',
        }}
        draggable={false}
      />

      {/* ── Metal shimmer 1 — bright narrow streak (helmet/blade zone) ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '200%',
            height: '6%',
            marginLeft: '-100%',
            marginTop: '-45%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.0) 15%, rgba(255,240,180,0.95) 45%, rgba(255,255,255,1.0) 50%, rgba(255,240,180,0.95) 55%, rgba(255,255,255,0.0) 85%, transparent 100%)',
            animation: 'gh-shimmer 2.2s ease-in-out infinite',
            animationDelay: '0s',
          }}
        />
      </div>

      {/* ── Metal shimmer 2 — softer secondary streak ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          overflow: 'hidden',
          borderRadius: '50%',
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            width: '200%',
            height: '3.5%',
            marginLeft: '-100%',
            marginTop: '-38%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.0) 15%, rgba(255,230,140,0.65) 45%, rgba(255,255,220,0.8) 50%, rgba(255,230,140,0.65) 55%, rgba(255,255,255,0.0) 85%, transparent 100%)',
            animation: 'gh-shimmer-2 2.2s ease-in-out infinite',
            animationDelay: '0.22s',
          }}
        />
      </div>

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
        <div style={{
          position: 'absolute',
          width: Math.max(3, size * 0.065),
          height: Math.max(3, size * 0.065),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,220,100,0.8) 50%, transparent 100%)',
          animation: 'gh-spark-a 1.1s ease-out infinite',
          animationDelay: '0s',
        }} />
        <div style={{
          position: 'absolute',
          width: Math.max(2, size * 0.05),
          height: Math.max(2, size * 0.05),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,200,1) 0%, rgba(255,180,50,0.7) 50%, transparent 100%)',
          animation: 'gh-spark-b 1.1s ease-out infinite',
          animationDelay: '0.12s',
        }} />
        <div style={{
          position: 'absolute',
          width: Math.max(2, size * 0.045),
          height: Math.max(2, size * 0.045),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,240,180,1) 0%, rgba(255,160,30,0.6) 50%, transparent 100%)',
          animation: 'gh-spark-c 1.1s ease-out infinite',
          animationDelay: '0.06s',
        }} />
        <div style={{
          position: 'absolute',
          width: Math.max(2, size * 0.04),
          height: Math.max(2, size * 0.04),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, rgba(200,200,255,0.5) 50%, transparent 100%)',
          animation: 'gh-spark-d 1.1s ease-out infinite',
          animationDelay: '0.2s',
        }} />
        <div style={{
          position: 'absolute',
          width: Math.max(1.5, size * 0.035),
          height: Math.max(1.5, size * 0.035),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,255,220,0.85) 0%, rgba(255,200,80,0.5) 50%, transparent 100%)',
          animation: 'gh-spark-e 1.1s ease-out infinite',
          animationDelay: '0.28s',
        }} />
        <div style={{
          position: 'absolute',
          width: Math.max(1.5, size * 0.03),
          height: Math.max(1.5, size * 0.03),
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,240,160,0.8) 0%, rgba(255,140,20,0.4) 50%, transparent 100%)',
          animation: 'gh-spark-f 1.1s ease-out infinite',
          animationDelay: '0.35s',
        }} />
      </div>

      {/* ── Dark vignette ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 100%)',
          animation: 'gh-vignette 0.45s ease-in-out infinite',
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
