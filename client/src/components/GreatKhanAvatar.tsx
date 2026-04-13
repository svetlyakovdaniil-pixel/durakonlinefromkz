import React from "react";

interface GreatKhanAvatarProps {
  size?: number;
  className?: string;
}

/**
 * GreatKhanAvatar — SVG+CSS animated avatar for rank "Великий хан".
 * A majestic Kazakh Khan sits still in full golden regalia with traditional
 * Kazakh ornamental patterns. The clothing shimmers and shines with a sweeping
 * golden light effect. Background: deep dark with subtle golden glow.
 * No Canvas, no JS loop — pure SVG + CSS @keyframes.
 */
export function GreatKhanAvatar({ size = 48, className = "" }: GreatKhanAvatarProps) {
  const id = `great-khan-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`rounded-full ${className}`}
      style={{ borderRadius: "50%", display: "block", overflow: "hidden" }}
    >
      <defs>
        {/* Dark royal background */}
        <radialGradient id={`${id}-bg`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#1a1000" />
          <stop offset="50%" stopColor="#0d0800" />
          <stop offset="100%" stopColor="#050300" />
        </radialGradient>

        {/* Throne glow behind khan */}
        <radialGradient id={`${id}-throne-glow`} cx="50%" cy="60%" r="55%">
          <stop offset="0%" stopColor="#7a5500" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#3d2a00" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0" />
        </radialGradient>

        {/* Main robe — deep crimson with gold */}
        <linearGradient id={`${id}-robe`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b0000" />
          <stop offset="30%" stopColor="#a00000" />
          <stop offset="60%" stopColor="#7a0000" />
          <stop offset="100%" stopColor="#5a0000" />
        </linearGradient>

        {/* Gold trim gradient */}
        <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="30%" stopColor="#ffcc00" />
          <stop offset="60%" stopColor="#e6a800" />
          <stop offset="100%" stopColor="#cc8800" />
        </linearGradient>

        {/* Animated shimmer sweep — moves across the robe */}
        <linearGradient id={`${id}-shimmer-robe`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(255,215,0,0)" />
          <stop offset="45%"  stopColor="rgba(255,215,0,0)" />
          <stop offset="50%"  stopColor="rgba(255,240,150,0.45)" />
          <stop offset="55%"  stopColor="rgba(255,215,0,0)" />
          <stop offset="100%" stopColor="rgba(255,215,0,0)" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="-1.2 0"
            to="1.2 0"
            dur="2.2s"
            repeatCount="indefinite"
          />
        </linearGradient>

        {/* Shimmer for helmet/crown */}
        <linearGradient id={`${id}-shimmer-crown`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%"   stopColor="rgba(255,255,200,0)" />
          <stop offset="45%"  stopColor="rgba(255,255,200,0)" />
          <stop offset="50%"  stopColor="rgba(255,255,255,0.6)" />
          <stop offset="55%"  stopColor="rgba(255,255,200,0)" />
          <stop offset="100%" stopColor="rgba(255,255,200,0)" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="-1.2 0"
            to="1.2 0"
            dur="2.2s"
            begin="0.4s"
            repeatCount="indefinite"
          />
        </linearGradient>

        {/* Skin tone */}
        <linearGradient id={`${id}-skin`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#c68642" />
          <stop offset="100%" stopColor="#a0622a" />
        </linearGradient>

        {/* Throne/seat gradient */}
        <linearGradient id={`${id}-throne`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8b6914" />
          <stop offset="50%" stopColor="#6b4a00" />
          <stop offset="100%" stopColor="#4a3000" />
        </linearGradient>

        <clipPath id={`${id}-clip`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>

        <filter id={`${id}-glow`} x="-30%" y="-30%" width="160%" height="160%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <filter id={`${id}-soft-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <style>{`
          @keyframes ${id}-border-pulse {
            0%, 100% { stroke-opacity: 0.8; }
            50%       { stroke-opacity: 1.0; }
          }
          @keyframes ${id}-crown-gem-pulse {
            0%, 100% { opacity: 0.7; r: 2; }
            50%       { opacity: 1.0; r: 2.5; }
          }
          @keyframes ${id}-aura-pulse {
            0%, 100% { opacity: 0.3; transform: scale(1); }
            50%       { opacity: 0.6; transform: scale(1.05); }
          }
          @keyframes ${id}-pattern-shimmer {
            0%, 100% { opacity: 0.5; }
            50%       { opacity: 1.0; }
          }
          @keyframes ${id}-eye-blink {
            0%, 90%, 100% { transform: scaleY(1); }
            95%            { transform: scaleY(0.1); }
          }
          @keyframes ${id}-feather-sway {
            0%, 100% { transform: rotate(-3deg); }
            50%       { transform: rotate(3deg); }
          }
        `}</style>
      </defs>

      {/* Background */}
      <circle cx="50" cy="50" r="50" fill={`url(#${id}-bg)`} />

      <g clipPath={`url(#${id}-clip)`}>
        {/* Throne glow aura */}
        <ellipse
          cx="50" cy="65" rx="40" ry="30"
          fill={`url(#${id}-throne-glow)`}
          style={{ animation: `${id}-aura-pulse 3s ease-in-out infinite` }}
        />

        {/* === THRONE === */}
        {/* Throne back */}
        <path
          d="M 22,85 L 22,45 Q 22,40 27,38 L 73,38 Q 78,40 78,45 L 78,85 Z"
          fill={`url(#${id}-throne)`}
          opacity="0.9"
        />
        {/* Throne top ornament */}
        <path
          d="M 27,38 Q 35,28 50,25 Q 65,28 73,38"
          fill="none"
          stroke={`url(#${id}-gold)`}
          strokeWidth="2.5"
        />
        {/* Throne top center jewel */}
        <circle cx="50" cy="25" r="4" fill="#ffd700" filter={`url(#${id}-glow)`} />
        <circle cx="50" cy="25" r="2" fill="#ffffff" opacity="0.7" />

        {/* Throne armrests */}
        <rect x="20" y="62" width="12" height="5" rx="2" fill={`url(#${id}-throne)`} />
        <rect x="68" y="62" width="12" height="5" rx="2" fill={`url(#${id}-throne)`} />
        {/* Armrest ornaments */}
        <circle cx="26" cy="62" r="3" fill="#ffd700" filter={`url(#${id}-glow)`} />
        <circle cx="74" cy="62" r="3" fill="#ffd700" filter={`url(#${id}-glow)`} />

        {/* Throne gold trim */}
        <rect x="22" y="43" width="56" height="2" rx="1" fill={`url(#${id}-gold)`} opacity="0.8" />
        <rect x="22" y="83" width="56" height="2" rx="1" fill={`url(#${id}-gold)`} opacity="0.8" />

        {/* === ROBE / BODY === */}
        {/* Main robe — wide, flowing */}
        <path
          d="M 28,90 L 25,65 Q 24,55 30,52 L 38,50 L 50,48 L 62,50 L 70,52 Q 76,55 75,65 L 72,90 Z"
          fill={`url(#${id}-robe)`}
        />

        {/* Robe shimmer overlay */}
        <path
          d="M 28,90 L 25,65 Q 24,55 30,52 L 38,50 L 50,48 L 62,50 L 70,52 Q 76,55 75,65 L 72,90 Z"
          fill={`url(#${id}-shimmer-robe)`}
        />

        {/* === KAZAKH ORNAMENTAL PATTERNS on robe === */}
        {/* Central vertical band */}
        <rect x="47" y="50" width="6" height="40" rx="1" fill={`url(#${id}-gold)`} opacity="0.8" />

        {/* Horizontal bands */}
        <rect x="28" y="58" width="44" height="2.5" rx="1" fill={`url(#${id}-gold)`} opacity="0.7" />
        <rect x="28" y="68" width="44" height="2.5" rx="1" fill={`url(#${id}-gold)`} opacity="0.7" />
        <rect x="28" y="78" width="44" height="2.5" rx="1" fill={`url(#${id}-gold)`} opacity="0.7" />

        {/* Kazakh "ram's horn" (қошқар мүйіз) pattern — left side */}
        <path
          d="M 35,54 C 32,56 31,60 33,62 C 35,64 37,62 36,60 C 35,58 33,58 34,56 Z"
          fill="#ffd700"
          opacity="0.8"
          style={{ animation: `${id}-pattern-shimmer 2.5s 0.0s ease-in-out infinite` }}
        />
        <path
          d="M 35,64 C 32,66 31,70 33,72 C 35,74 37,72 36,70 C 35,68 33,68 34,66 Z"
          fill="#ffd700"
          opacity="0.8"
          style={{ animation: `${id}-pattern-shimmer 2.5s 0.3s ease-in-out infinite` }}
        />
        <path
          d="M 35,74 C 32,76 31,80 33,82 C 35,84 37,82 36,80 C 35,78 33,78 34,76 Z"
          fill="#ffd700"
          opacity="0.8"
          style={{ animation: `${id}-pattern-shimmer 2.5s 0.6s ease-in-out infinite` }}
        />

        {/* Kazakh "ram's horn" pattern — right side (mirrored) */}
        <path
          d="M 65,54 C 68,56 69,60 67,62 C 65,64 63,62 64,60 C 65,58 67,58 66,56 Z"
          fill="#ffd700"
          opacity="0.8"
          style={{ animation: `${id}-pattern-shimmer 2.5s 0.15s ease-in-out infinite` }}
        />
        <path
          d="M 65,64 C 68,66 69,70 67,72 C 65,74 63,72 64,70 C 65,68 67,68 66,66 Z"
          fill="#ffd700"
          opacity="0.8"
          style={{ animation: `${id}-pattern-shimmer 2.5s 0.45s ease-in-out infinite` }}
        />
        <path
          d="M 65,74 C 68,76 69,80 67,82 C 65,84 63,82 64,80 C 65,78 67,78 66,76 Z"
          fill="#ffd700"
          opacity="0.8"
          style={{ animation: `${id}-pattern-shimmer 2.5s 0.75s ease-in-out infinite` }}
        />

        {/* Diamond ornaments between bands */}
        {[55, 63, 73].map((y, i) => (
          <g key={i} style={{ animation: `${id}-pattern-shimmer 2s ${i * 0.4}s ease-in-out infinite` }}>
            <polygon points={`50,${y-3} 53,${y} 50,${y+3} 47,${y}`} fill="#ffd700" />
            <polygon points={`40,${y-2} 42,${y} 40,${y+2} 38,${y}`} fill="#ffd700" opacity="0.7" />
            <polygon points={`60,${y-2} 62,${y} 60,${y+2} 58,${y}`} fill="#ffd700" opacity="0.7" />
          </g>
        ))}

        {/* === SHOULDERS / EPAULETTES === */}
        {/* Left shoulder */}
        <ellipse cx="28" cy="53" rx="8" ry="5" fill={`url(#${id}-gold)`} />
        <ellipse cx="28" cy="53" rx="5" ry="3" fill="#ffd700" opacity="0.8" />
        {/* Left shoulder fringe */}
        {[-2, 0, 2, 4].map((dx, i) => (
          <line key={i} x1={22 + dx} y1="56" x2={20 + dx} y2="64" stroke="#ffd700" strokeWidth="1.2" strokeOpacity="0.7" />
        ))}

        {/* Right shoulder */}
        <ellipse cx="72" cy="53" rx="8" ry="5" fill={`url(#${id}-gold)`} />
        <ellipse cx="72" cy="53" rx="5" ry="3" fill="#ffd700" opacity="0.8" />
        {/* Right shoulder fringe */}
        {[-2, 0, 2, 4].map((dx, i) => (
          <line key={i} x1={70 + dx} y1="56" x2={72 + dx} y2="64" stroke="#ffd700" strokeWidth="1.2" strokeOpacity="0.7" />
        ))}

        {/* === ARMS === */}
        {/* Left arm — resting on armrest */}
        <path d="M 28,53 Q 24,60 24,66" stroke={`url(#${id}-robe)`} strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M 28,53 Q 24,60 24,66" stroke={`url(#${id}-gold)`} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeOpacity="0.6" />
        {/* Left hand */}
        <ellipse cx="23" cy="67" rx="4" ry="3" fill={`url(#${id}-skin)`} />

        {/* Right arm — resting on armrest */}
        <path d="M 72,53 Q 76,60 76,66" stroke={`url(#${id}-robe)`} strokeWidth="8" fill="none" strokeLinecap="round" />
        <path d="M 72,53 Q 76,60 76,66" stroke={`url(#${id}-gold)`} strokeWidth="1.5" fill="none" strokeLinecap="round" strokeOpacity="0.6" />
        {/* Right hand — holding a staff/scepter */}
        <ellipse cx="77" cy="67" rx="4" ry="3" fill={`url(#${id}-skin)`} />
        {/* Scepter */}
        <line x1="77" y1="65" x2="77" y2="30" stroke={`url(#${id}-gold)`} strokeWidth="2" strokeLinecap="round" />
        <circle cx="77" cy="28" r="4" fill="#ffd700" filter={`url(#${id}-glow)`} />
        <circle cx="77" cy="28" r="2" fill="#ffffff" opacity="0.7" />

        {/* === NECK === */}
        <rect x="45" y="42" width="10" height="9" rx="2" fill={`url(#${id}-skin)`} />
        {/* Collar ornament */}
        <path d="M 38,50 Q 50,44 62,50" fill="none" stroke={`url(#${id}-gold)`} strokeWidth="2" />
        <path d="M 40,50 Q 50,46 60,50" fill="#8b0000" />
        <path d="M 40,50 Q 50,46 60,50" fill={`url(#${id}-shimmer-robe)`} />

        {/* === HEAD === */}
        {/* Face */}
        <ellipse cx="50" cy="34" rx="13" ry="14" fill={`url(#${id}-skin)`} />

        {/* Beard — dark, distinguished */}
        <path
          d="M 40,40 Q 42,48 50,50 Q 58,48 60,40 Q 55,44 50,44 Q 45,44 40,40 Z"
          fill="#2a1500"
          opacity="0.9"
        />
        {/* Mustache */}
        <path
          d="M 43,38 Q 47,40 50,39 Q 53,40 57,38"
          stroke="#1a0a00"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
        />

        {/* Eyes */}
        <g style={{ animation: `${id}-eye-blink 4s ease-in-out infinite` }}>
          <ellipse cx="44" cy="33" rx="3" ry="2.5" fill="#1a0800" />
          <ellipse cx="56" cy="33" rx="3" ry="2.5" fill="#1a0800" />
        </g>
        {/* Eye highlights */}
        <circle cx="43" cy="32" r="0.8" fill="rgba(255,255,255,0.5)" />
        <circle cx="55" cy="32" r="0.8" fill="rgba(255,255,255,0.5)" />

        {/* Eyebrows — strong, authoritative */}
        <path d="M 41,29 Q 44,27 47,29" stroke="#1a0800" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M 53,29 Q 56,27 59,29" stroke="#1a0800" strokeWidth="1.8" fill="none" strokeLinecap="round" />

        {/* Nose */}
        <path d="M 49,34 Q 48,38 50,39 Q 52,38 51,34" fill="#a05020" opacity="0.5" />

        {/* === CROWN / HELMET (Тымақ) === */}
        {/* Main crown body */}
        <path
          d="M 37,28 Q 36,16 50,12 Q 64,16 63,28 L 60,30 Q 50,26 40,30 Z"
          fill={`url(#${id}-gold)`}
        />
        {/* Crown shimmer */}
        <path
          d="M 37,28 Q 36,16 50,12 Q 64,16 63,28 L 60,30 Q 50,26 40,30 Z"
          fill={`url(#${id}-shimmer-crown)`}
        />

        {/* Crown band with Kazakh pattern */}
        <rect x="37" y="26" width="26" height="4" rx="1" fill="#8b0000" />
        <rect x="37" y="26" width="26" height="4" rx="1" fill={`url(#${id}-shimmer-robe)`} />
        {/* Pattern on band */}
        {[40, 44, 48, 52, 56, 60].map((x, i) => (
          <polygon
            key={i}
            points={`${x},26 ${x + 1.5},28 ${x},30 ${x - 1.5},28`}
            fill="#ffd700"
            opacity="0.8"
            style={{ animation: `${id}-pattern-shimmer 2s ${i * 0.2}s ease-in-out infinite` }}
          />
        ))}

        {/* Crown top jewel */}
        <circle
          cx="50" cy="12" r="3.5"
          fill="#ff0000"
          filter={`url(#${id}-soft-glow)`}
          style={{ animation: `${id}-crown-gem-pulse 1.8s ease-in-out infinite` }}
        />
        <circle cx="50" cy="12" r="1.5" fill="rgba(255,200,200,0.8)" />

        {/* Crown side jewels */}
        <circle cx="38" cy="22" r="2" fill="#0044ff" filter={`url(#${id}-glow)`} style={{ animation: `${id}-crown-gem-pulse 2.2s 0.3s ease-in-out infinite` }} />
        <circle cx="62" cy="22" r="2" fill="#0044ff" filter={`url(#${id}-glow)`} style={{ animation: `${id}-crown-gem-pulse 2.2s 0.6s ease-in-out infinite` }} />

        {/* Feather plume on crown */}
        <path
          d="M 50,12 Q 44,4 42,0"
          stroke="#ffffff"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          style={{ transformOrigin: "50px 12px", animation: `${id}-feather-sway 3s ease-in-out infinite` }}
        />
        <path
          d="M 50,12 Q 50,3 50,0"
          stroke="#ffd700"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          style={{ transformOrigin: "50px 12px", animation: `${id}-feather-sway 3s 0.5s ease-in-out infinite` }}
        />
        <path
          d="M 50,12 Q 56,4 58,0"
          stroke="#ffffff"
          strokeWidth="1.5"
          fill="none"
          strokeLinecap="round"
          style={{ transformOrigin: "50px 12px", animation: `${id}-feather-sway 3s 1s ease-in-out infinite` }}
        />

        {/* === GOLDEN AURA around entire figure === */}
        <ellipse
          cx="50" cy="60"
          rx="35" ry="40"
          fill="none"
          stroke="#ffd700"
          strokeWidth="1"
          strokeOpacity="0.2"
          filter={`url(#${id}-soft-glow)`}
          style={{ animation: `${id}-aura-pulse 3s ease-in-out infinite` }}
        />
      </g>

      {/* Outer golden border — double ring */}
      <circle
        cx="50" cy="50" r="47"
        fill="none"
        stroke="#ffd700"
        strokeWidth="1.5"
        strokeOpacity="0.5"
        style={{ animation: `${id}-border-pulse 2.5s 0.5s ease-in-out infinite` }}
      />
      <circle
        cx="50" cy="50" r="49"
        fill="none"
        stroke="#ffd700"
        strokeWidth="1"
        strokeOpacity="0.8"
        style={{ animation: `${id}-border-pulse 2.5s ease-in-out infinite` }}
      />
    </svg>
  );
}

export default GreatKhanAvatar;
