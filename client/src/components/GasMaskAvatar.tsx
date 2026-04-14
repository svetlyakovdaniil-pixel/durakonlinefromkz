import React from 'react';

interface GasMaskAvatarProps {
  size?: number;
  className?: string;
}

/**
 * GasMaskAvatar — animated gas mask survivor avatar for Apocalypse Season, Amber rank.
 * Features:
 * - Base image: realistic gas mask survivor in post-apocalyptic wasteland
 * - Animation: pulsing fire/explosion reflection in the goggle lenses
 * - Left lens and right lens animate independently with offset timing
 * - Subtle overall amber glow to enhance the apocalyptic atmosphere
 *
 * Lens positions (approximate, based on the generated image):
 *   Left lens:  center ~33% from left, ~34% from top, ~22% wide, ~18% tall
 *   Right lens: center ~62% from left, ~34% from top, ~22% wide, ~18% tall
 */
export function GasMaskAvatar({ size = 48, className = '' }: GasMaskAvatarProps) {
  const imgUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/gasmask_avatar-QspMaqo2ZQTvwEek5U4B35.png';

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        position: 'relative',
        borderRadius: '50%',
        overflow: 'hidden',
        flexShrink: 0,
      }}
    >
      <style>{`
        @keyframes gasmask-lens-left {
          0%   { opacity: 0.55; transform: scale(1); }
          15%  { opacity: 0.90; transform: scale(1.08); }
          30%  { opacity: 0.60; transform: scale(1.02); }
          50%  { opacity: 0.95; transform: scale(1.12); }
          65%  { opacity: 0.50; transform: scale(0.98); }
          80%  { opacity: 0.85; transform: scale(1.06); }
          100% { opacity: 0.55; transform: scale(1); }
        }
        @keyframes gasmask-lens-right {
          0%   { opacity: 0.50; transform: scale(1); }
          20%  { opacity: 0.88; transform: scale(1.10); }
          38%  { opacity: 0.55; transform: scale(1.00); }
          55%  { opacity: 0.92; transform: scale(1.14); }
          70%  { opacity: 0.48; transform: scale(0.97); }
          88%  { opacity: 0.80; transform: scale(1.07); }
          100% { opacity: 0.50; transform: scale(1); }
        }
        @keyframes gasmask-ambient-glow {
          0%, 100% { opacity: 0.12; }
          40%       { opacity: 0.28; }
          70%       { opacity: 0.18; }
        }
        @keyframes gasmask-flare {
          0%, 100% { opacity: 0; }
          8%, 10%  { opacity: 0.7; }
          9%       { opacity: 0.3; }
          11%      { opacity: 0; }
          52%, 54% { opacity: 0.6; }
          53%      { opacity: 0.2; }
          55%      { opacity: 0; }
        }
      `}</style>

      {/* Base image */}
      <img
        src={imgUrl}
        alt="Gas Mask"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '50%',
          display: 'block',
        }}
      />

      {/* Left lens reflection — fire/explosion glow */}
      <div
        style={{
          position: 'absolute',
          left: '21%',
          top: '27%',
          width: '24%',
          height: '20%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(255,180,30,0.95) 0%, rgba(255,100,10,0.80) 35%, rgba(220,60,0,0.50) 60%, transparent 80%)',
          animation: 'gasmask-lens-left 2.6s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* Right lens reflection — fire/explosion glow */}
      <div
        style={{
          position: 'absolute',
          left: '54%',
          top: '27%',
          width: '24%',
          height: '20%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 60%, rgba(255,180,30,0.95) 0%, rgba(255,100,10,0.80) 35%, rgba(220,60,0,0.50) 60%, transparent 80%)',
          animation: 'gasmask-lens-right 2.6s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* Bright lens flare — occasional sharp flash */}
      <div
        style={{
          position: 'absolute',
          left: '21%',
          top: '27%',
          width: '57%',
          height: '20%',
          borderRadius: '50%',
          background: 'radial-gradient(ellipse at 50% 50%, rgba(255,230,100,0.90) 0%, rgba(255,160,20,0.50) 40%, transparent 70%)',
          animation: 'gasmask-flare 4.2s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* Ambient amber glow over whole avatar */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse 70% 50% at 50% 38%, rgba(255,140,20,0.22) 0%, transparent 65%)',
          animation: 'gasmask-ambient-glow 3.2s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
