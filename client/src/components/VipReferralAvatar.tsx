import React from 'react';

interface VipReferralAvatarProps {
  size?: number;
  className?: string;
}

const VIP_AVATAR_URL =
  '/assets/static/avatar_vip-5gYQDzq92heL65Hxbz4iAY.webp';

/**
 * VipReferralAvatar — Referral reward VIP avatar
 * Animations:
 *  - Gold shimmer sweep (diagonal light streak)
 *  - Rotating rainbow/gold border glow
 *  - Sparkle particles (4 small stars)
 *  - Pulsing gold ambient overlay
 */
export function VipReferralAvatar({ size = 48, className = '' }: VipReferralAvatarProps) {
  const sparkles = [
    { top: '8%',  left: '12%', delay: '0s',    dur: '2.4s', scale: 0.7 },
    { top: '10%', left: '78%', delay: '0.6s',  dur: '2.1s', scale: 0.9 },
    { top: '72%', left: '8%',  delay: '1.2s',  dur: '2.6s', scale: 0.6 },
    { top: '75%', left: '80%', delay: '1.8s',  dur: '2.3s', scale: 0.8 },
  ];

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        position: 'relative',
        display: 'block',
        flexShrink: 0,
      }}
    >
      <style>{`
        /* Gold shimmer sweep */
        @keyframes vip-shimmer {
          0%   { transform: translateX(-180%) skewX(-22deg); opacity: 0; }
          6%   { opacity: 0.7; }
          44%  { opacity: 0.7; }
          56%  { transform: translateX(280%) skewX(-22deg); opacity: 0; }
          100% { transform: translateX(280%) skewX(-22deg); opacity: 0; }
        }
        @keyframes vip-shimmer-b {
          0%   { transform: translateX(-180%) skewX(-22deg); opacity: 0; }
          6%   { opacity: 0.35; }
          44%  { opacity: 0.35; }
          56%  { transform: translateX(280%) skewX(-22deg); opacity: 0; }
          100% { transform: translateX(280%) skewX(-22deg); opacity: 0; }
        }
        /* Rotating conic gradient border glow */
        @keyframes vip-border-spin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        /* Pulsing ambient gold overlay */
        @keyframes vip-ambient {
          0%, 100% { opacity: 0; }
          50%       { opacity: 0.18; }
        }
        /* Sparkle twinkle */
        @keyframes vip-sparkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          30%, 70% { opacity: 1; transform: scale(1) rotate(45deg); }
        }
        /* Outer ring pulse */
        @keyframes vip-ring-pulse {
          0%, 100% { box-shadow: 0 0 0 2px rgba(251,191,36,0.5), 0 0 8px 3px rgba(251,191,36,0.25); }
          50%       { box-shadow: 0 0 0 3px rgba(251,191,36,0.9), 0 0 18px 6px rgba(251,191,36,0.5); }
        }
      `}</style>

      {/* Rotating conic gradient border */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: -2,
          borderRadius: '50%',
          overflow: 'hidden',
          zIndex: 0,
          pointerEvents: 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'conic-gradient(from 0deg, #fbbf24, #f59e0b, #d97706, #fcd34d, #fbbf24, #b45309, #fbbf24)',
            animation: 'vip-border-spin 3s linear infinite',
            borderRadius: '50%',
          }}
        />
        {/* Inner mask to show only the border ring */}
        <div
          style={{
            position: 'absolute',
            inset: 2,
            background: '#000',
            borderRadius: '50%',
          }}
        />
      </div>

      {/* Main image */}
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          borderRadius: '50%',
          overflow: 'hidden',
          zIndex: 1,
          animation: 'vip-ring-pulse 2s ease-in-out infinite',
        }}
      >
        <img
          src={VIP_AVATAR_URL}
          alt="VIP"
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center',
            display: 'block',
          }}
          draggable={false}
        />

        {/* Gold shimmer sweep A */}
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
              top: '-20%',
              left: 0,
              width: '30%',
              height: '140%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,215,0,0.55) 50%, transparent 100%)',
              animation: 'vip-shimmer 3.2s ease-in-out infinite',
              animationDelay: '0s',
            }}
          />
        </div>

        {/* Gold shimmer sweep B (offset) */}
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
              top: '-20%',
              left: 0,
              width: '18%',
              height: '140%',
              background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,200,0.4) 50%, transparent 100%)',
              animation: 'vip-shimmer-b 3.2s ease-in-out infinite',
              animationDelay: '0.4s',
            }}
          />
        </div>

        {/* Pulsing gold ambient overlay */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            background: 'radial-gradient(circle at 50% 40%, rgba(255,215,0,0.22) 0%, transparent 70%)',
            animation: 'vip-ambient 2.5s ease-in-out infinite',
            pointerEvents: 'none',
          }}
        />
      </div>

      {/* Sparkle particles (outside overflow:hidden) */}
      {sparkles.map((s, i) => (
        <div
          key={i}
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: s.top,
            left: s.left,
            width: 6 * s.scale,
            height: 6 * s.scale,
            pointerEvents: 'none',
            zIndex: 3,
            animation: `vip-sparkle ${s.dur} ease-in-out infinite`,
            animationDelay: s.delay,
          }}
        >
          {/* 4-pointed star */}
          <svg viewBox="0 0 10 10" style={{ width: '100%', height: '100%' }}>
            <polygon
              points="5,0 6,4 10,5 6,6 5,10 4,6 0,5 4,4"
              fill="#fcd34d"
              opacity="0.9"
            />
          </svg>
        </div>
      ))}
    </div>
  );
}
