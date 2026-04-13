import React from 'react';

interface DivingEagleAvatarProps {
  size?: number;
  className?: string;
}

/**
 * DivingEagleAvatar — AI-generated photorealistic golden eagle in flight
 * with CSS animated air-trail streaks (no Canvas, no JS loop).
 *
 * Animation: diagonal white/cyan streaks sweep from upper-right to lower-left,
 * simulating displaced air as the eagle dives at high speed.
 */
export function DivingEagleAvatar({ size = 48, className = '' }: DivingEagleAvatarProps) {
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
        /* Air trail streaks — diagonal, sweeping top-right → bottom-left */
        @keyframes de-trail-1 {
          0%   { transform: translate(130%, -130%) rotate(-45deg); opacity: 0; }
          12%  { opacity: 0.75; }
          55%  { opacity: 0.6; }
          100% { transform: translate(-130%, 130%) rotate(-45deg); opacity: 0; }
        }
        @keyframes de-trail-2 {
          0%   { transform: translate(130%, -130%) rotate(-45deg); opacity: 0; }
          12%  { opacity: 0.5; }
          55%  { opacity: 0.38; }
          100% { transform: translate(-130%, 130%) rotate(-45deg); opacity: 0; }
        }
        @keyframes de-trail-3 {
          0%   { transform: translate(130%, -130%) rotate(-45deg); opacity: 0; }
          12%  { opacity: 0.35; }
          55%  { opacity: 0.22; }
          100% { transform: translate(-130%, 130%) rotate(-45deg); opacity: 0; }
        }
        @keyframes de-trail-4 {
          0%   { transform: translate(130%, -130%) rotate(-45deg); opacity: 0; }
          12%  { opacity: 0.28; }
          55%  { opacity: 0.15; }
          100% { transform: translate(-130%, 130%) rotate(-45deg); opacity: 0; }
        }
        /* Speed vignette — darkens edges during dive */
        @keyframes de-vignette {
          0%, 100% { opacity: 0.0; }
          25%, 75%  { opacity: 0.22; }
        }
        /* Golden shimmer on eagle */
        @keyframes de-gold-pulse {
          0%, 100% { opacity: 0; }
          50%       { opacity: 0.15; }
        }
      `}</style>

      {/* Base photorealistic image */}
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/diving_eagle_avatar-mETA3RPC2znnKVf6a8Nzyx.webp"
        alt="Небесный Орёл"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center center',
          display: 'block',
        }}
        draggable={false}
      />

      {/* ── Air trail streak 1 — widest, brightest ── */}
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
            width: '160%',
            height: '14%',
            marginLeft: '-80%',
            marginTop: '-7%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(200,235,255,0.0) 10%, rgba(220,245,255,0.85) 40%, rgba(255,255,255,1.0) 50%, rgba(220,245,255,0.85) 60%, rgba(200,235,255,0.0) 90%, transparent 100%)',
            animation: 'de-trail-1 1.2s ease-in-out infinite',
            animationDelay: '0s',
          }}
        />
      </div>

      {/* ── Air trail streak 2 — offset above ── */}
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
            width: '160%',
            height: '8%',
            marginLeft: '-80%',
            marginTop: '-22%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(180,220,255,0.0) 10%, rgba(200,240,255,0.65) 42%, rgba(240,250,255,0.8) 50%, rgba(200,240,255,0.65) 58%, rgba(180,220,255,0.0) 90%, transparent 100%)',
            animation: 'de-trail-2 1.2s ease-in-out infinite',
            animationDelay: '0.15s',
          }}
        />
      </div>

      {/* ── Air trail streak 3 — offset below ── */}
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
            width: '160%',
            height: '6%',
            marginLeft: '-80%',
            marginTop: '10%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(160,210,255,0.0) 10%, rgba(180,230,255,0.5) 42%, rgba(220,245,255,0.65) 50%, rgba(180,230,255,0.5) 58%, rgba(160,210,255,0.0) 90%, transparent 100%)',
            animation: 'de-trail-3 1.2s ease-in-out infinite',
            animationDelay: '0.28s',
          }}
        />
      </div>

      {/* ── Air trail streak 4 — thin far streak ── */}
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
            width: '160%',
            height: '4%',
            marginLeft: '-80%',
            marginTop: '-35%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(140,200,255,0.0) 10%, rgba(160,220,255,0.38) 42%, rgba(200,240,255,0.5) 50%, rgba(160,220,255,0.38) 58%, rgba(140,200,255,0.0) 90%, transparent 100%)',
            animation: 'de-trail-4 1.2s ease-in-out infinite',
            animationDelay: '0.42s',
          }}
        />
      </div>

      {/* ── Speed vignette ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(0,15,50,0.4) 100%)',
          animation: 'de-vignette 1.2s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* ── Golden shimmer on eagle feathers ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 52% 48%, rgba(255,200,40,0.25) 0%, transparent 55%)',
          animation: 'de-gold-pulse 2.4s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default DivingEagleAvatar;
