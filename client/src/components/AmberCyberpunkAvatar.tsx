import React from 'react';
interface Props { size?: number; className?: string; }
/**
 * AmberCyberpunkAvatar — Street hacker with golden cybernetic implants.
 * Season: Киберпанк (Season 10) | Rank: Янтарь
 * Animation: circuit pulse + neon flicker + scan line + data rain + eye glow
 * offsetX: -2.5%, offsetY: -2.5%
 */
export function AmberCyberpunkAvatar({ size = 48, className = '' }: Props) {
  const uid = React.useId().replace(/:/g, '');
  // offsetX=-2.5%, offsetY=-2.5% applied via objectPosition
  const posX = 50 + (-2.5);
  const posY = 50 + (-2.5);
  return (
    <div className={className} style={{ width: size, height: size, position: 'relative', display: 'inline-block', flexShrink: 0 }}>
      <style>{`
        @keyframes acv4-circuit-${uid} {
          0%   { box-shadow: 0 0 6px 2px rgba(245,158,11,0.7), 0 0 14px 5px rgba(245,158,11,0.35), 0 0 26px 10px rgba(251,191,36,0.15); }
          25%  { box-shadow: 0 0 12px 5px rgba(245,158,11,1), 0 0 22px 9px rgba(245,158,11,0.55), 0 0 40px 16px rgba(251,191,36,0.3); }
          50%  { box-shadow: 0 0 8px 3px rgba(245,158,11,0.8), 0 0 18px 7px rgba(245,158,11,0.4), 0 0 32px 13px rgba(251,191,36,0.2); }
          75%  { box-shadow: 0 0 16px 7px rgba(255,200,0,0.9), 0 0 28px 12px rgba(245,158,11,0.6), 0 0 48px 20px rgba(251,191,36,0.35); }
          100% { box-shadow: 0 0 6px 2px rgba(245,158,11,0.7), 0 0 14px 5px rgba(245,158,11,0.35), 0 0 26px 10px rgba(251,191,36,0.15); }
        }
        @keyframes acv4-flicker-${uid} {
          0%, 100% { opacity: 1; }
          88%       { opacity: 1; }
          89%       { opacity: 0.3; }
          90%       { opacity: 1; }
          93%       { opacity: 0.7; }
          94%       { opacity: 1; }
          97%       { opacity: 0.5; }
          98%       { opacity: 1; }
        }
        @keyframes acv4-scan-${uid} {
          0%   { transform: translateY(-${size * 1.2}px); opacity: 0.6; }
          80%  { opacity: 0.6; }
          100% { transform: translateY(${size * 1.2}px); opacity: 0; }
        }
        @keyframes acv4-eye-${uid} {
          0%, 100% { opacity: 0.4; transform: scale(1); }
          50%       { opacity: 1; transform: scale(1.3); }
        }
        @keyframes acv4-rain-${uid} {
          0%   { transform: translateY(-${size * 0.3}px); opacity: 0.8; }
          100% { transform: translateY(${size * 0.5}px); opacity: 0; }
        }
      `}</style>

      <div style={{
        width: size, height: size, borderRadius: '50%', overflow: 'hidden', position: 'relative',
        animation: `acv4-circuit-${uid} 2s ease-in-out infinite, acv4-flicker-${uid} 6s ease-in-out infinite`,
      }}>
        <img
          src="/assets/static/amber_cyberpunk_v4-52jR9jKRMgjhsCZXjNstx8.webp"
          alt="Янтарь Киберпанк"
          style={{
            width: '100%', height: '100%',
            objectFit: 'cover',
            objectPosition: `${posX}% ${posY}%`,
            display: 'block',
          }}
          draggable={false}
        />

        {/* Amber scan line sweeping top to bottom */}
        <div aria-hidden="true" style={{
          position: 'absolute', left: 0, right: 0,
          height: size * 0.12,
          background: 'linear-gradient(to bottom, transparent, rgba(245,158,11,0.35), transparent)',
          animation: `acv4-scan-${uid} 2.2s linear infinite`,
        }} />

        {/* Circuit overlay — amber glow from bottom-left */}
        <div aria-hidden="true" style={{
          position: 'absolute', inset: 0, borderRadius: '50%',
          background: 'radial-gradient(circle at 20% 80%, rgba(245,158,11,0.18) 0%, transparent 55%)',
        }} />

        {/* Eye glow dot — positioned at character's cybernetic eye */}
        <div aria-hidden="true" style={{
          position: 'absolute',
          top: '38%', left: '54%',
          width: size * 0.1, height: size * 0.1,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,220,0,0.95), rgba(245,158,11,0.5))',
          boxShadow: `0 0 ${size * 0.08}px ${size * 0.05}px rgba(255,200,0,0.8)`,
          animation: `acv4-eye-${uid} 1.8s ease-in-out infinite`,
        }} />
      </div>

      {/* Data rain particles */}
      {[
        { left: '15%', delay: '0s', dur: '1.4s' },
        { left: '40%', delay: '0.5s', dur: '1.8s' },
        { left: '70%', delay: '0.9s', dur: '1.2s' },
        { left: '85%', delay: '0.3s', dur: '1.6s' },
      ].map((p, i) => (
        <div key={i} aria-hidden="true" style={{
          position: 'absolute', top: '2%',
          left: p.left,
          width: Math.max(1, size * 0.025),
          height: size * 0.18,
          background: 'linear-gradient(to bottom, rgba(245,158,11,0.9), transparent)',
          borderRadius: 2,
          animation: `acv4-rain-${uid} ${p.dur} linear ${p.delay} infinite`,
        }} />
      ))}
    </div>
  );
}
