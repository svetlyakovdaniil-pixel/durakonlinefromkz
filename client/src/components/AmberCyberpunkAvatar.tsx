import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * AmberCyberpunkAvatar — Elite cyber warrior with amber circuit glow.
 * Season: Киберпанк (Season 10) | Rank: Янтарь
 * Animation: circuit pulse + amber neon flicker + data stream
 */
export function AmberCyberpunkAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes ac-circuit-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(245,158,11,0.8), 0 0 18px 7px rgba(245,158,11,0.4), 0 0 30px 12px rgba(251,191,36,0.2); }
          50%  { box-shadow: 0 0 14px 6px rgba(245,158,11,1), 0 0 28px 12px rgba(245,158,11,0.6), 0 0 45px 18px rgba(251,191,36,0.35); }
          100% { box-shadow: 0 0 8px 3px rgba(245,158,11,0.8), 0 0 18px 7px rgba(245,158,11,0.4), 0 0 30px 12px rgba(251,191,36,0.2); }
        }
        @keyframes ac-flicker-${uid} {
          0%, 100% { opacity: 1; }
          92%       { opacity: 1; }
          93%       { opacity: 0.4; }
          94%       { opacity: 1; }
          96%       { opacity: 0.6; }
          97%       { opacity: 1; }
        }
        @keyframes ac-scan-${uid} {
          0%   { transform: translateY(-100%); opacity: 0.5; }
          100% { transform: translateY(200%); opacity: 0; }
        }
      `}</style>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `ac-circuit-${uid} 1.8s ease-in-out infinite, ac-flicker-${uid} 5s ease-in-out infinite`,
      }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/amber_cyberpunk_v2_d0c053f1.png"
          alt="Янтарь"
          style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'center top', display: 'block' }}
          draggable={false}
        />
        {/* Scan line */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, right: 0, height: '20%',
          background: 'linear-gradient(to bottom, transparent, rgba(245,158,11,0.3), transparent)',
          animation: `ac-scan-${uid} 2.5s linear infinite`,
        }} />
        {/* Circuit overlay */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 70% 30%, rgba(245,158,11,0.12) 0%, transparent 50%)',
        }} />
      </div>
    </div>
  );
}
