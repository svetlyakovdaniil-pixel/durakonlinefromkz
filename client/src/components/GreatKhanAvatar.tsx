import React from 'react';
import { getAssetUrl } from '@/lib/assetUrl';

interface GreatKhanAvatarProps {
  size?: number;
  className?: string;
}

/**
 * GreatKhanAvatar — AI-generated photorealistic Kazakh Khan
 * with CSS animated gold shimmer overlay (no Canvas, no JS loop).
 *
 * Animation: two diagonal light-sweep passes over the armor,
 * simulating sunlight glinting off gold metal.
 */
export function GreatKhanAvatar({ size = 48, className = '' }: GreatKhanAvatarProps) {
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
        @keyframes gk-shimmer-a {
          0%   { transform: translateX(-160%) skewX(-20deg); opacity: 0; }
          8%   { opacity: 0.6; }
          42%  { opacity: 0.6; }
          55%  { transform: translateX(260%) skewX(-20deg); opacity: 0; }
          100% { transform: translateX(260%) skewX(-20deg); opacity: 0; }
        }
        @keyframes gk-shimmer-b {
          0%   { transform: translateX(-160%) skewX(-20deg); opacity: 0; }
          8%   { opacity: 0.38; }
          42%  { opacity: 0.38; }
          55%  { transform: translateX(260%) skewX(-20deg); opacity: 0; }
          100% { transform: translateX(260%) skewX(-20deg); opacity: 0; }
        }
        @keyframes gk-ambient {
          0%, 100% { opacity: 0; }
          50%       { opacity: 0.14; }
        }
      `}</style>

      {/* Base photorealistic image */}
      <img
        src={getAssetUrl("/assets/static/great_khan_avatar-N9ykdAF9YU7urTnqCdUiJa.webp")}
        alt="Обсидиан"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          objectPosition: 'center top',
          display: 'block',
        }}
        draggable={false}
      />

      {/* Gold shimmer sweep A — wide bright streak */}
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
            width: '32%',
            height: '140%',
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,210,60,0.65) 38%, rgba(255,245,170,0.95) 50%, rgba(255,210,60,0.65) 62%, transparent 100%)',
            animation: 'gk-shimmer-a 3.8s ease-in-out infinite',
            animationDelay: '0.5s',
          }}
        />
      </div>

      {/* Gold shimmer sweep B — narrower trailing streak */}
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
            background:
              'linear-gradient(90deg, transparent 0%, rgba(255,225,100,0.45) 42%, rgba(255,255,210,0.7) 50%, rgba(255,225,100,0.45) 58%, transparent 100%)',
            animation: 'gk-shimmer-b 3.8s ease-in-out infinite',
            animationDelay: '0.85s',
          }}
        />
      </div>

      {/* Ambient golden glow pulse */}
      <div
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background:
            'radial-gradient(ellipse at 50% 38%, rgba(255,195,40,0.22) 0%, transparent 65%)',
          animation: 'gk-ambient 4.5s ease-in-out infinite',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
