import React from 'react';
import { getAssetUrl } from '@/lib/assetUrl';
interface Props { size?: number; className?: string; }
/**
 * RubyCyberpunkAvatar — Cyborg hacker with red glitch effect.
 * Season: Киберпанк (Season 10) | Rank: Рубин
 * Animation: digital glitch scan + red/green neon pulse
 */
export function RubyCyberpunkAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes rca-halo-${uid} {
          0%, 100% { box-shadow: 0 0 6px 2px rgba(239,68,68,0.5), 0 0 14px 4px rgba(34,197,94,0.2); }
          50%       { box-shadow: 0 0 16px 6px rgba(239,68,68,0.8), 0 0 28px 10px rgba(34,197,94,0.4); }
        }
        @keyframes rca-scan-${uid} {
          0%   { top: 110%; opacity: 0; }
          5%   { opacity: 0.7; }
          90%  { opacity: 0.5; }
          100% { top: -20%; opacity: 0; }
        }
        @keyframes rca-glitch-${uid} {
          0%, 90%, 100% { transform: translateX(0); filter: brightness(1); }
          92%            { transform: translateX(-2px); filter: brightness(1.3) hue-rotate(90deg); }
          94%            { transform: translateX(2px); filter: brightness(0.8) hue-rotate(-90deg); }
          96%            { transform: translateX(0); filter: brightness(1); }
        }
      `}</style>
      <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative', animation: `rca-halo-${uid} 2s ease-in-out infinite` }}>
        <img
          src={getAssetUrl("/assets/static/ruby_cyberpunk_ee56c332.png")}
          alt="Рубин"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center', display: 'block', animation: `rca-glitch-${uid} 4s ease-in-out infinite` }}
          draggable={false}
        />
        {/* Scan line */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, right: 0, height: Math.max(2, size * 0.06),
          background: 'linear-gradient(180deg, transparent, rgba(34,197,94,0.6), transparent)',
          animation: `rca-scan-${uid} 2.5s ease-in infinite`,
        }} />
      </div>
    </div>
  );
}
