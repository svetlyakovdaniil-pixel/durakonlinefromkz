import React from 'react';
import { getAssetUrl } from '@/lib/assetUrl';
interface Props { size?: number; className?: string; }
/**
 * AmberEgyptianAvatar — Ra/Horus with golden amber divine aura.
 * Season: Египетские боги (Season 2) | Rank: Янтарь
 * Animation: solar pulse + golden sand particles + eye of Ra glow
 */
export function AmberEgyptianAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes ae-solar-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(251,191,36,0.7), 0 0 20px 8px rgba(251,191,36,0.4), 0 0 40px 16px rgba(239,68,68,0.2); }
          50%  { box-shadow: 0 0 14px 6px rgba(251,191,36,0.9), 0 0 30px 14px rgba(251,191,36,0.6), 0 0 55px 22px rgba(239,68,68,0.35); }
          100% { box-shadow: 0 0 8px 3px rgba(251,191,36,0.7), 0 0 20px 8px rgba(251,191,36,0.4), 0 0 40px 16px rgba(239,68,68,0.2); }
        }
        @keyframes ae-rotate-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes ae-sand-${uid} {
          0%   { opacity: 0; transform: translateY(0) translateX(0) scale(0.5); }
          50%  { opacity: 0.8; }
          100% { opacity: 0; transform: translateY(-${size * 0.7}px) translateX(${size * 0.2}px) scale(1.3); }
        }
        @keyframes ae-pulse-${uid} {
          0%, 100% { filter: brightness(1) saturate(1.2); }
          50%       { filter: brightness(1.3) saturate(1.5) sepia(0.2); }
        }
      `}</style>
      {/* Rotating sun rays ring */}
      <div aria-hidden="true" style={{
        position: 'absolute', inset: -size * 0.12, borderRadius: '50%',
        border: `${Math.max(1, size * 0.04)}px dashed rgba(251,191,36,0.5)`,
        animation: `ae-rotate-${uid} 8s linear infinite`,
      }} />
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `ae-solar-${uid} 2s ease-in-out infinite`,
      }}>
        <img
          src={getAssetUrl("/assets/static/amber_egyptian_gods_v2_43e04e99.png")}
          alt="Янтарь"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block', animation: `ae-pulse-${uid} 3s ease-in-out infinite` }}
          draggable={false}
        />
        {/* Golden overlay shimmer */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 50% 20%, rgba(251,191,36,0.2) 0%, transparent 60%)',
        }} />
      </div>
      {/* Sand particles */}
      {[0.2, 0.6, 0.85].map((x, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', bottom: '8%',
          left: `${x * 100}%`,
          width: size * 0.06, height: size * 0.06,
          borderRadius: '50%',
          background: 'rgba(251,191,36,0.7)',
          animation: `ae-sand-${uid} ${2 + i * 0.5}s ease-out ${i * 0.8}s infinite`,
        }} />
      ))}
    </div>
  );
}
