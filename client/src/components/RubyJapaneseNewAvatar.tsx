import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * RubyJapaneseNewAvatar — Samurai warrior with cherry blossoms and torii gates.
 * Season: Японские мотивы (Season 9) | Rank: Рубин
 * Animation: crimson-gold pulse halo + falling petal shimmer + slow conic spin
 */
export function RubyJapaneseNewAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes rjpn-halo-${uid} {
          0%   { box-shadow: 0 0 8px 3px rgba(190,18,60,0.6), 0 0 18px 6px rgba(220,38,38,0.25); }
          50%  { box-shadow: 0 0 16px 6px rgba(220,38,38,0.85), 0 0 30px 11px rgba(251,191,36,0.3); }
          100% { box-shadow: 0 0 8px 3px rgba(190,18,60,0.6), 0 0 18px 6px rgba(220,38,38,0.25); }
        }
        @keyframes rjpn-flicker-${uid} {
          0%, 100% { filter: brightness(1) saturate(1.1); }
          40%       { filter: brightness(1.12) saturate(1.25); }
          70%       { filter: brightness(1.06) saturate(1.15); }
        }
        @keyframes rjpn-petal-${uid} {
          0%   { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(1); }
          20%  { opacity: 0.7; }
          100% { opacity: 0; transform: translate(15%, 50%) rotate(180deg) scale(0.4); }
        }
        @keyframes rjpn-petal2-${uid} {
          0%   { opacity: 0; transform: translate(0, 0) rotate(0deg) scale(1); }
          20%  { opacity: 0.6; }
          100% { opacity: 0; transform: translate(-20%, 45%) rotate(-120deg) scale(0.3); }
        }
        @keyframes rjpn-spin-${uid} {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
      `}</style>
      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden',
        position: 'relative',
        animation: `rjpn-halo-${uid} 3s ease-in-out infinite`,
      }}>
        <img
          src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/ruby_japanese_v2_ed9fc656.png"
          alt="Рубин"
          style={{
            width: '105%', height: '105%',
            objectFit: 'cover', objectPosition: 'center',
            display: 'block',
            marginLeft: '-2.5%', marginTop: '-2.5%',
            animation: `rjpn-flicker-${uid} 4s ease-in-out infinite`,
          }}
          draggable={false}
        />
        {/* Slow conic shimmer — crimson/gold */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0,
          background: 'conic-gradient(from 0deg, transparent 0%, rgba(190,18,60,0.1) 20%, transparent 40%, rgba(251,191,36,0.08) 60%, transparent 80%, rgba(190,18,60,0.1) 100%)',
          animation: `rjpn-spin-${uid} 7s linear infinite`,
          pointerEvents: 'none',
        }} />
        {/* Petal 1 */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '15%', left: '20%',
          width: Math.max(3, size * 0.07), height: Math.max(2, size * 0.04),
          borderRadius: '50% 50% 50% 0',
          background: 'rgba(251,207,232,0.85)',
          animation: `rjpn-petal-${uid} 3s ease-in infinite`,
          pointerEvents: 'none',
        }} />
        {/* Petal 2 */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '10%', left: '65%',
          width: Math.max(2.5, size * 0.06), height: Math.max(1.5, size * 0.035),
          borderRadius: '50% 50% 50% 0',
          background: 'rgba(251,207,232,0.75)',
          animation: `rjpn-petal2-${uid} 3.8s ease-in 0.8s infinite`,
          pointerEvents: 'none',
        }} />
        {/* Petal 3 */}
        <div aria-hidden="true" style={{
          position: 'absolute', top: '5%', left: '45%',
          width: Math.max(2, size * 0.05), height: Math.max(1.5, size * 0.03),
          borderRadius: '50% 50% 50% 0',
          background: 'rgba(253,164,175,0.8)',
          animation: `rjpn-petal-${uid} 4.2s ease-in 1.5s infinite`,
          pointerEvents: 'none',
        }} />
      </div>
    </div>
  );
}
