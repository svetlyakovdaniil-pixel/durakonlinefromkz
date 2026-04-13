import React from 'react';

interface KhanAvatarProps {
  size?: number;
  className?: string;
}

/**
 * KhanAvatar — AI-generated photorealistic Kazakh khan on horseback in the steppe.
 * CSS animation: diagonal red/crimson streaks sweep across the avatar,
 * evoking the speed of a charging warrior and the fire of battle.
 * No Canvas, no JS loop — pure CSS @keyframes.
 */
export function KhanAvatar({ size = 48, className = '' }: KhanAvatarProps) {
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
        /* Red/crimson diagonal streaks — sweep from upper-left to lower-right */
        @keyframes khan-streak-1 {
          0%   { transform: translate(-140%, -140%) rotate(45deg); opacity: 0; }
          12%  { opacity: 0.8; }
          55%  { opacity: 0.65; }
          100% { transform: translate(140%, 140%) rotate(45deg); opacity: 0; }
        }
        @keyframes khan-streak-2 {
          0%   { transform: translate(-140%, -140%) rotate(45deg); opacity: 0; }
          12%  { opacity: 0.55; }
          55%  { opacity: 0.4; }
          100% { transform: translate(140%, 140%) rotate(45deg); opacity: 0; }
        }
        @keyframes khan-streak-3 {
          0%   { transform: translate(-140%, -140%) rotate(45deg); opacity: 0; }
          12%  { opacity: 0.38; }
          55%  { opacity: 0.22; }
          100% { transform: translate(140%, 140%) rotate(45deg); opacity: 0; }
        }
        @keyframes khan-streak-4 {
          0%   { transform: translate(-140%, -140%) rotate(45deg); opacity: 0; }
          12%  { opacity: 0.28; }
          55%  { opacity: 0.14; }
          100% { transform: translate(140%, 140%) rotate(45deg); opacity: 0; }
        }
        /* Ember glow — warm red/orange radial pulse */
        @keyframes khan-ember {
          0%, 100% { opacity: 0.0; }
          30%, 70%  { opacity: 0.18; }
        }
        /* Red vignette — darkens edges during streak */
        @keyframes khan-vignette {
          0%, 100% { opacity: 0.0; }
          25%, 75%  { opacity: 0.25; }
        }
      `}</style>

      {/* Base photorealistic image */}
      <img
        src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/khan_steppe_avatar-72rsBrDvaNJLS7y5xKmfwa.webp"
        alt="Хан Степи"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center 20%',
          display: 'block',
        }}
        draggable={false}
      />

      {/* ── Red streak 1 — widest, brightest ── */}
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
            width: '170%',
            height: '14%',
            marginLeft: '-85%',
            marginTop: '-7%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(180,0,0,0.0) 8%, rgba(220,20,20,0.85) 38%, rgba(255,50,50,1.0) 50%, rgba(220,20,20,0.85) 62%, rgba(180,0,0,0.0) 92%, transparent 100%)',
            animation: 'khan-streak-1 1.4s ease-in-out infinite',
            animationDelay: '0s',
          }}
        />
      </div>

      {/* ── Red streak 2 — offset above ── */}
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
            width: '170%',
            height: '8%',
            marginLeft: '-85%',
            marginTop: '-22%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(160,0,0,0.0) 8%, rgba(200,10,10,0.65) 40%, rgba(240,40,40,0.82) 50%, rgba(200,10,10,0.65) 60%, rgba(160,0,0,0.0) 92%, transparent 100%)',
            animation: 'khan-streak-2 1.4s ease-in-out infinite',
            animationDelay: '0.18s',
          }}
        />
      </div>

      {/* ── Red streak 3 — offset below ── */}
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
            width: '170%',
            height: '6%',
            marginLeft: '-85%',
            marginTop: '12%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(140,0,0,0.0) 8%, rgba(180,5,5,0.5) 40%, rgba(220,30,30,0.65) 50%, rgba(180,5,5,0.5) 60%, rgba(140,0,0,0.0) 92%, transparent 100%)',
            animation: 'khan-streak-3 1.4s ease-in-out infinite',
            animationDelay: '0.32s',
          }}
        />
      </div>

      {/* ── Red streak 4 — thin far streak ── */}
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
            width: '170%',
            height: '4%',
            marginLeft: '-85%',
            marginTop: '-36%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(120,0,0,0.0) 8%, rgba(160,5,5,0.38) 40%, rgba(200,25,25,0.5) 50%, rgba(160,5,5,0.38) 60%, rgba(120,0,0,0.0) 92%, transparent 100%)',
            animation: 'khan-streak-4 1.4s ease-in-out infinite',
            animationDelay: '0.48s',
          }}
        />
      </div>

      {/* ── Ember glow — warm red/orange radial pulse ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 50%, rgba(200,30,0,0.3) 0%, rgba(180,10,0,0.15) 40%, transparent 70%)',
          animation: 'khan-ember 2.8s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />

      {/* ── Red vignette ── */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 50%, transparent 35%, rgba(80,0,0,0.45) 100%)',
          animation: 'khan-vignette 1.4s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}

export default KhanAvatar;
