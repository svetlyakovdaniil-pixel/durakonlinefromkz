import React from "react";

interface KhanAvatarProps {
  size?: number;
  className?: string;
}

/**
 * KhanAvatar — SVG+CSS animated avatar.
 * Steppe Khan warrior swings a sword with sparks flying.
 * Background: warm steppe sunset (orange/amber gradient).
 * No Canvas, no JS animation loop. GPU-accelerated via CSS @keyframes + SVG animate.
 */
export function KhanAvatar({ size = 48, className = "" }: KhanAvatarProps) {
  const id = `khan-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`rounded-full ${className}`}
      style={{ borderRadius: "50%", display: "block", overflow: "hidden" }}
    >
      <defs>
        {/* Sunset background gradient */}
        <linearGradient id={`${id}-bg`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a0a00" />
          <stop offset="35%" stopColor="#5c1a00" />
          <stop offset="65%" stopColor="#c45200" />
          <stop offset="100%" stopColor="#3d1000" />
        </linearGradient>

        {/* Horizon glow */}
        <radialGradient id={`${id}-horizon`} cx="50%" cy="72%" r="55%">
          <stop offset="0%" stopColor="rgba(255,140,0,0.4)" />
          <stop offset="50%" stopColor="rgba(255,80,0,0.15)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>

        {/* Warrior body gradient */}
        <linearGradient id={`${id}-armor`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b2500" />
          <stop offset="50%" stopColor="#cc3300" />
          <stop offset="100%" stopColor="#6b1a00" />
        </linearGradient>

        {/* Helmet gradient */}
        <linearGradient id={`${id}-helmet`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="50%" stopColor="#ffb300" />
          <stop offset="100%" stopColor="#cc8800" />
        </linearGradient>

        {/* Sword gradient */}
        <linearGradient id={`${id}-sword`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e8e8f0" />
          <stop offset="40%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#a0a0b0" />
        </linearGradient>

        {/* Spark glow */}
        <radialGradient id={`${id}-spark`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
          <stop offset="40%" stopColor="#ffcc00" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#ff6600" stopOpacity="0" />
        </radialGradient>

        <clipPath id={`${id}-clip`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>

        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        <filter id={`${id}-sword-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="2" result="blur" />
          <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
        </filter>

        <style>{`
          @keyframes ${id}-sword-swing {
            0%   { transform: rotate(-50deg); }
            35%  { transform: rotate(40deg); }
            55%  { transform: rotate(45deg); }
            75%  { transform: rotate(-55deg); }
            100% { transform: rotate(-50deg); }
          }
          @keyframes ${id}-spark-1 {
            0%   { opacity: 0; transform: translate(0,0) scale(1); }
            10%  { opacity: 1; }
            100% { opacity: 0; transform: translate(12px,-8px) scale(0.1); }
          }
          @keyframes ${id}-spark-2 {
            0%   { opacity: 0; transform: translate(0,0) scale(1); }
            15%  { opacity: 1; }
            100% { opacity: 0; transform: translate(-8px,-14px) scale(0.1); }
          }
          @keyframes ${id}-spark-3 {
            0%   { opacity: 0; transform: translate(0,0) scale(1); }
            20%  { opacity: 1; }
            100% { opacity: 0; transform: translate(16px,4px) scale(0.1); }
          }
          @keyframes ${id}-spark-4 {
            0%   { opacity: 0; transform: translate(0,0) scale(1); }
            12%  { opacity: 1; }
            100% { opacity: 0; transform: translate(-14px,6px) scale(0.1); }
          }
          @keyframes ${id}-spark-5 {
            0%   { opacity: 0; transform: translate(0,0) scale(1); }
            18%  { opacity: 1; }
            100% { opacity: 0; transform: translate(6px,-18px) scale(0.1); }
          }
          @keyframes ${id}-body-breathe {
            0%, 100% { transform: translateY(0); }
            50%       { transform: translateY(-1px); }
          }
          @keyframes ${id}-border-pulse {
            0%, 100% { stroke-opacity: 0.75; }
            50%       { stroke-opacity: 1.0; }
          }
          @keyframes ${id}-star-twinkle {
            0%, 100% { opacity: 0.3; }
            50%       { opacity: 0.9; }
          }
          @keyframes ${id}-horizon-pulse {
            0%, 100% { opacity: 0.7; }
            50%       { opacity: 1.0; }
          }
          .${id}-sword-arm {
            transform-origin: 50px 62px;
            animation: ${id}-sword-swing 1.8s ease-in-out infinite;
          }
          .${id}-body-group {
            animation: ${id}-body-breathe 2.4s ease-in-out infinite;
          }
        `}</style>
      </defs>

      {/* Background */}
      <circle cx="50" cy="50" r="50" fill={`url(#${id}-bg)`} />

      <g clipPath={`url(#${id}-clip)`}>
        {/* Horizon glow */}
        <ellipse
          cx="50" cy="72" rx="55" ry="35"
          fill={`url(#${id}-horizon)`}
          style={{ animation: `${id}-horizon-pulse 3s ease-in-out infinite` }}
        />

        {/* Stars */}
        {[
          [15, 10, 0.0], [80, 8, 0.8], [60, 15, 1.3], [35, 20, 0.4],
          [88, 25, 1.0], [8, 35, 0.6],
        ].map(([sx, sy, delay], i) => (
          <circle
            key={i}
            cx={sx}
            cy={sy}
            r="0.7"
            fill="rgba(255,220,150,0.7)"
            style={{
              animation: `${id}-star-twinkle ${2 + (i % 3) * 0.6}s ${delay}s ease-in-out infinite`,
            }}
          />
        ))}

        {/* Ground / horizon line */}
        <rect x="0" y="78" width="100" height="22" fill="#2a0800" opacity="0.7" />
        <line x1="0" y1="78" x2="100" y2="78" stroke="#ff6600" strokeWidth="0.8" strokeOpacity="0.5" />

        {/* Warrior body group (breathes slightly) */}
        <g className={`${id}-body-group`}>
          {/* Legs */}
          <rect x="43" y="74" width="6" height="12" rx="2" fill="#4a1500" />
          <rect x="51" y="74" width="6" height="12" rx="2" fill="#3d1000" />

          {/* Torso / armor */}
          <rect x="38" y="52" width="24" height="24" rx="4" fill={`url(#${id}-armor)`} />

          {/* Armor details */}
          <line x1="50" y1="52" x2="50" y2="76" stroke="#ff4400" strokeWidth="1" strokeOpacity="0.5" />
          <line x1="38" y1="62" x2="62" y2="62" stroke="#ff4400" strokeWidth="0.8" strokeOpacity="0.4" />

          {/* Shoulder pads */}
          <ellipse cx="38" cy="55" rx="5" ry="4" fill="#ffd700" />
          <ellipse cx="62" cy="55" rx="5" ry="4" fill="#ffd700" />

          {/* Left arm (static) */}
          <rect x="28" y="54" width="10" height="5" rx="2" fill="#cc3300" />

          {/* Shield on left arm */}
          <ellipse cx="24" cy="58" rx="7" ry="9" fill="#8b2500" stroke="#ffd700" strokeWidth="1.5" />
          <circle cx="24" cy="58" r="3" fill="#ffd700" opacity="0.7" />

          {/* Neck */}
          <rect x="46" y="44" width="8" height="10" rx="2" fill="#8b4513" />

          {/* Head */}
          <ellipse cx="50" cy="38" rx="12" ry="13" fill="#c68642" />

          {/* Helmet */}
          <path
            d="M 38,38 Q 38,22 50,20 Q 62,22 62,38 L 60,40 Q 50,36 40,40 Z"
            fill={`url(#${id}-helmet)`}
          />
          {/* Helmet crest */}
          <path
            d="M 50,20 Q 52,14 50,10 Q 48,14 50,20"
            fill="#ffd700" strokeWidth="0.5"
          />
          {/* Helmet visor */}
          <rect x="40" y="36" width="20" height="4" rx="1" fill="#cc8800" opacity="0.8" />

          {/* Face */}
          {/* Eyes */}
          <ellipse cx="45" cy="38" rx="2.5" ry="2" fill="#1a0a00" />
          <ellipse cx="55" cy="38" rx="2.5" ry="2" fill="#1a0a00" />
          <circle cx="44.5" cy="37.5" r="0.8" fill="rgba(255,255,255,0.4)" />
          <circle cx="54.5" cy="37.5" r="0.8" fill="rgba(255,255,255,0.4)" />

          {/* Mustache */}
          <path d="M 44,43 Q 47,45 50,43 Q 53,45 56,43" stroke="#3d1000" strokeWidth="1.5" fill="none" strokeLinecap="round" />
        </g>

        {/* Sword arm — rotates from shoulder */}
        <g className={`${id}-sword-arm`}>
          {/* Right arm */}
          <rect x="62" y="52" width="12" height="5" rx="2" fill="#cc3300" />

          {/* Sword handle */}
          <rect x="72" y="48" width="4" height="10" rx="1" fill="#8b4513" />
          {/* Guard */}
          <rect x="69" y="55" width="10" height="3" rx="1" fill="#ffd700" />
          {/* Blade */}
          <path
            d="M 74,48 L 76,48 L 92,20 L 90,18 Z"
            fill={`url(#${id}-sword)`}
            filter={`url(#${id}-sword-glow)`}
          />
          {/* Blade edge highlight */}
          <line x1="74" y1="48" x2="91" y2="19" stroke="rgba(255,255,255,0.6)" strokeWidth="0.8" />
        </g>

        {/* Sparks — appear at sword tip position during swing */}
        <g filter={`url(#${id}-glow)`}>
          {[
            { x: 72, y: 28, delay: "0s",    dur: "1.8s", anim: `${id}-spark-1` },
            { x: 68, y: 24, delay: "0.1s",  dur: "1.8s", anim: `${id}-spark-2` },
            { x: 76, y: 30, delay: "0.05s", dur: "1.8s", anim: `${id}-spark-3` },
            { x: 70, y: 32, delay: "0.15s", dur: "1.8s", anim: `${id}-spark-4` },
            { x: 74, y: 22, delay: "0.08s", dur: "1.8s", anim: `${id}-spark-5` },
          ].map((s, i) => (
            <circle
              key={i}
              cx={s.x}
              cy={s.y}
              r="2.5"
              fill={`url(#${id}-spark)`}
              style={{
                animation: `${s.anim} ${s.dur} ${s.delay} ease-out infinite`,
              }}
            />
          ))}
        </g>
      </g>

      {/* Golden border */}
      <circle
        cx="50" cy="50" r="48"
        fill="none"
        stroke="#ffd700"
        strokeWidth="2.5"
        strokeOpacity="0.8"
        style={{ animation: `${id}-border-pulse 2s ease-in-out infinite` }}
      />
    </svg>
  );
}

export default KhanAvatar;
