import React from 'react';

interface ToxicStormAvatarProps {
  size?: number;
  className?: string;
}

/**
 * ToxicStormAvatar — animated toxic storm cloud avatar for Apocalypse Season, Ruby rank.
 * Features:
 * - Base image: toxic storm cloud with green lightning and rain
 * - Animation: random lightning flashes appearing at different positions inside the cloud
 * - Green glow pulses radiating from within the cloud
 * - Rain streaks animated falling down
 */
export function ToxicStormAvatar({ size = 48, className = '' }: ToxicStormAvatarProps) {
  const imgUrl = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/toxic_storm_avatar-cR6SmN4ZtMUEBVktcpwyo9.png';

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
        @keyframes toxic-flash-1 {
          0%, 100% { opacity: 0; }
          5%, 7% { opacity: 1; }
          6% { opacity: 0.3; }
          8% { opacity: 0; }
        }
        @keyframes toxic-flash-2 {
          0%, 100% { opacity: 0; }
          20%, 22% { opacity: 1; }
          21% { opacity: 0.2; }
          23% { opacity: 0; }
        }
        @keyframes toxic-flash-3 {
          0%, 100% { opacity: 0; }
          40%, 43% { opacity: 0.9; }
          41% { opacity: 0.1; }
          44% { opacity: 0; }
        }
        @keyframes toxic-flash-4 {
          0%, 100% { opacity: 0; }
          60%, 62% { opacity: 1; }
          61% { opacity: 0.4; }
          63% { opacity: 0; }
        }
        @keyframes toxic-flash-5 {
          0%, 100% { opacity: 0; }
          78%, 80% { opacity: 0.8; }
          79% { opacity: 0.2; }
          81% { opacity: 0; }
        }
        @keyframes toxic-glow-pulse {
          0%, 100% { opacity: 0.15; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.05); }
        }
        @keyframes toxic-rain-fall {
          0% { transform: translateY(-8%); opacity: 0.7; }
          100% { transform: translateY(8%); opacity: 0.9; }
        }
      `}</style>

      {/* Base cloud image */}
      <img
        src={imgUrl}
        alt="Toxic Storm"
        style={{
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          borderRadius: '50%',
          display: 'block',
        }}
      />

      {/* Ambient green glow pulse behind cloud */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'radial-gradient(ellipse 60% 40% at 50% 42%, rgba(57,255,20,0.35) 0%, transparent 70%)',
          animation: 'toxic-glow-pulse 2.8s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* Lightning flash 1 — left side of cloud */}
      <div
        style={{
          position: 'absolute',
          left: '18%',
          top: '22%',
          width: '28%',
          height: '30%',
          background: 'radial-gradient(ellipse at center, rgba(100,255,50,0.95) 0%, rgba(57,255,20,0.5) 40%, transparent 70%)',
          borderRadius: '50%',
          animation: 'toxic-flash-1 3.4s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* Lightning flash 2 — right side of cloud */}
      <div
        style={{
          position: 'absolute',
          right: '14%',
          top: '18%',
          width: '24%',
          height: '26%',
          background: 'radial-gradient(ellipse at center, rgba(150,255,80,0.9) 0%, rgba(57,255,20,0.4) 45%, transparent 70%)',
          borderRadius: '50%',
          animation: 'toxic-flash-2 3.4s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* Lightning flash 3 — center-top of cloud */}
      <div
        style={{
          position: 'absolute',
          left: '35%',
          top: '12%',
          width: '30%',
          height: '28%',
          background: 'radial-gradient(ellipse at center, rgba(200,255,100,0.95) 0%, rgba(57,255,20,0.6) 35%, transparent 65%)',
          borderRadius: '50%',
          animation: 'toxic-flash-3 3.4s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* Lightning flash 4 — lower-left cloud belly */}
      <div
        style={{
          position: 'absolute',
          left: '12%',
          top: '38%',
          width: '22%',
          height: '22%',
          background: 'radial-gradient(ellipse at center, rgba(80,255,40,0.85) 0%, rgba(57,255,20,0.35) 50%, transparent 75%)',
          borderRadius: '50%',
          animation: 'toxic-flash-4 3.4s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* Lightning flash 5 — right belly */}
      <div
        style={{
          position: 'absolute',
          right: '10%',
          top: '35%',
          width: '26%',
          height: '24%',
          background: 'radial-gradient(ellipse at center, rgba(120,255,60,0.9) 0%, rgba(57,255,20,0.4) 45%, transparent 70%)',
          borderRadius: '50%',
          animation: 'toxic-flash-5 3.4s ease-in-out infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />

      {/* Rain animation overlay — subtle vertical shift */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          background: 'repeating-linear-gradient(170deg, transparent 0px, transparent 6px, rgba(57,255,20,0.07) 6px, rgba(57,255,20,0.07) 7px)',
          animation: 'toxic-rain-fall 0.6s linear infinite',
          mixBlendMode: 'screen',
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
