import React from 'react';
import { getAssetUrl } from '@/lib/assetUrl';
interface Props { size?: number; className?: string; }
/**
 * AmberNorseAvatar — Thor/Odin with amber rune lightning.
 * Season: Скандинавские боги (Season 4) | Rank: Янтарь
 * Animation: rune glow pulse + lightning strike + amber aurora
 */
export function AmberNorseAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes an-rune-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(245,158,11,0.6), 0 0 20px 8px rgba(245,158,11,0.3), 0 0 35px 14px rgba(251,191,36,0.15); }
          50%  { box-shadow: 0 0 14px 6px rgba(245,158,11,0.9), 0 0 28px 12px rgba(245,158,11,0.5), 0 0 50px 20px rgba(251,191,36,0.3); }
          100% { box-shadow: 0 0 8px 3px rgba(245,158,11,0.6), 0 0 20px 8px rgba(245,158,11,0.3), 0 0 35px 14px rgba(251,191,36,0.15); }
        }
        @keyframes an-lightning-${uid} {
          0%, 90%, 100% { opacity: 0; }
          92%            { opacity: 1; }
          94%            { opacity: 0; }
          96%            { opacity: 0.8; }
          98%            { opacity: 0; }
        }
        @keyframes an-aurora-${uid} {
          0%   { background-position: 0% 50%; }
          50%  { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes an-breathe-${uid} {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.03); }
        }
      `}</style>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `an-rune-${uid} 2.5s ease-in-out infinite, an-breathe-${uid} 4s ease-in-out infinite`,
      }}>
        <img
          src={getAssetUrl("/assets/static/amber_norse_gods_v2_f21b55c1.png")}
          alt="Янтарь"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          draggable={false}
        />
        {/* Aurora overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(16,185,129,0.1), rgba(245,158,11,0.15))',
          backgroundSize: '200% 200%',
          animation: `an-aurora-${uid} 4s ease infinite`,
        }} />
        {/* Lightning flash */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'rgba(255,255,200,0.6)',
          animation: `an-lightning-${uid} 4s ease-in-out infinite`,
        }} />
      </div>
    </div>
  );
}
