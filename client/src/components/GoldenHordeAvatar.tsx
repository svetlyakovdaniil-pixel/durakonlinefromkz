import React from "react";

interface GoldenHordeAvatarProps {
  size?: number;
  className?: string;
}

/**
 * GoldenHordeAvatar — SVG+CSS animated avatar.
 * Golden Horde cavalry charges from right to left in 4 parallax layers.
 * Background: golden steppe with dust clouds.
 * No Canvas, no JS animation loop. GPU-accelerated via CSS @keyframes.
 */
export function GoldenHordeAvatar({ size = 48, className = "" }: GoldenHordeAvatarProps) {
  const id = `golden-horde-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`rounded-full ${className}`}
      style={{ borderRadius: "50%", display: "block", overflow: "hidden" }}
    >
      <defs>
        {/* Sky gradient */}
        <linearGradient id={`${id}-sky`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#1a0a00" />
          <stop offset="40%" stopColor="#7a3500" />
          <stop offset="70%" stopColor="#e87000" />
          <stop offset="100%" stopColor="#c85000" />
        </linearGradient>

        {/* Ground gradient */}
        <linearGradient id={`${id}-ground`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#8b5e00" />
          <stop offset="100%" stopColor="#4a2e00" />
        </linearGradient>

        {/* Sun glow */}
        <radialGradient id={`${id}-sun`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffdd00" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#ff8800" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ff4400" stopOpacity="0" />
        </radialGradient>

        {/* Dust gradient */}
        <radialGradient id={`${id}-dust`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#c8960a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#c8960a" stopOpacity="0" />
        </radialGradient>

        <clipPath id={`${id}-clip`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>

        <filter id={`${id}-blur-sm`} x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="0.8" />
        </filter>

        <style>{`
          /* Rider scroll animations — 4 layers with different speeds */
          @keyframes ${id}-ride-1 {
            0%   { transform: translateX(120px); }
            100% { transform: translateX(-130px); }
          }
          @keyframes ${id}-ride-2 {
            0%   { transform: translateX(130px); }
            100% { transform: translateX(-140px); }
          }
          @keyframes ${id}-ride-3 {
            0%   { transform: translateX(140px); }
            100% { transform: translateX(-150px); }
          }
          @keyframes ${id}-ride-4 {
            0%   { transform: translateX(150px); }
            100% { transform: translateX(-160px); }
          }
          /* Horse leg gallop */
          @keyframes ${id}-leg-front {
            0%   { transform: rotate(-20deg); }
            50%  { transform: rotate(30deg); }
            100% { transform: rotate(-20deg); }
          }
          @keyframes ${id}-leg-back {
            0%   { transform: rotate(20deg); }
            50%  { transform: rotate(-25deg); }
            100% { transform: rotate(20deg); }
          }
          /* Dust puff */
          @keyframes ${id}-dust-puff {
            0%   { transform: translateX(0) scale(0.5); opacity: 0.6; }
            100% { transform: translateX(-20px) scale(2); opacity: 0; }
          }
          @keyframes ${id}-border-pulse {
            0%, 100% { stroke-opacity: 0.75; }
            50%       { stroke-opacity: 1.0; }
          }
          @keyframes ${id}-sun-pulse {
            0%, 100% { opacity: 0.7; }
            50%       { opacity: 1.0; }
          }
        `}</style>
      </defs>

      {/* Sky */}
      <circle cx="50" cy="50" r="50" fill={`url(#${id}-sky)`} />

      <g clipPath={`url(#${id}-clip)`}>
        {/* Sun */}
        <circle
          cx="50" cy="62" r="18"
          fill={`url(#${id}-sun)`}
          style={{ animation: `${id}-sun-pulse 3s ease-in-out infinite` }}
        />

        {/* Ground */}
        <rect x="0" y="72" width="100" height="28" fill={`url(#${id}-ground)`} />

        {/* Horizon line */}
        <line x1="0" y1="72" x2="100" y2="72" stroke="#ff8800" strokeWidth="0.6" strokeOpacity="0.6" />

        {/* === LAYER 1 — farthest, smallest, darkest === */}
        <g
          opacity="0.55"
          style={{ animation: `${id}-ride-1 5.5s linear infinite` }}
        >
          {/* Rider 1a */}
          <g transform="translate(20, 64) scale(0.42)">
            <RiderSVG id={id} color="#6b4a00" helmetColor="#8b6914" layer={1} />
          </g>
          {/* Rider 1b — offset */}
          <g transform="translate(55, 64) scale(0.42)">
            <RiderSVG id={id} color="#5a3d00" helmetColor="#7a5a10" layer={1} />
          </g>
          {/* Rider 1c */}
          <g transform="translate(90, 64) scale(0.42)">
            <RiderSVG id={id} color="#6b4a00" helmetColor="#8b6914" layer={1} />
          </g>
        </g>

        {/* === LAYER 2 === */}
        <g
          opacity="0.70"
          style={{ animation: `${id}-ride-2 4.5s linear infinite`, animationDelay: "-1.2s" }}
        >
          <g transform="translate(30, 67) scale(0.52)">
            <RiderSVG id={id} color="#8b6200" helmetColor="#a07820" layer={2} />
          </g>
          <g transform="translate(75, 67) scale(0.52)">
            <RiderSVG id={id} color="#7a5500" helmetColor="#906810" layer={2} />
          </g>
        </g>

        {/* === LAYER 3 === */}
        <g
          opacity="0.85"
          style={{ animation: `${id}-ride-3 3.8s linear infinite`, animationDelay: "-0.6s" }}
        >
          <g transform="translate(15, 70) scale(0.64)">
            <RiderSVG id={id} color="#c8960a" helmetColor="#e6b020" layer={3} />
          </g>
          <g transform="translate(65, 70) scale(0.64)">
            <RiderSVG id={id} color="#b08200" helmetColor="#d09a10" layer={3} />
          </g>
        </g>

        {/* === LAYER 4 — closest, largest, brightest === */}
        <g
          opacity="1.0"
          style={{ animation: `${id}-ride-4 3.0s linear infinite`, animationDelay: "-0.3s" }}
        >
          <g transform="translate(10, 73) scale(0.78)">
            <RiderSVG id={id} color="#e6a800" helmetColor="#ffd700" layer={4} />
          </g>
          <g transform="translate(70, 73) scale(0.78)">
            <RiderSVG id={id} color="#d09000" helmetColor="#f0c000" layer={4} />
          </g>
        </g>

        {/* Dust clouds at ground level */}
        {[0, 1, 2, 3].map((i) => (
          <ellipse
            key={i}
            cx={20 + i * 20}
            cy="76"
            rx="8"
            ry="4"
            fill={`url(#${id}-dust)`}
            filter={`url(#${id}-blur-sm)`}
            style={{
              animation: `${id}-dust-puff 1.5s ${i * 0.4}s ease-out infinite`,
            }}
          />
        ))}
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

/**
 * Inline SVG component for a single horse+rider.
 * Rendered at origin (0,0), scaled and positioned by parent <g>.
 */
function RiderSVG({ id, color, helmetColor, layer }: { id: string; color: string; helmetColor: string; layer: number }) {
  const legDur = `${0.35 - layer * 0.02}s`;
  const flagDur = `${0.6 + layer * 0.1}s`;

  return (
    <g>
      {/* Horse body */}
      <ellipse cx="0" cy="-8" rx="18" ry="9" fill={color} />

      {/* Horse neck */}
      <path d="M -12,-8 Q -18,-20 -14,-26 Q -10,-20 -8,-12 Z" fill={color} />

      {/* Horse head */}
      <ellipse cx="-16" cy="-28" rx="7" ry="5" fill={color} />

      {/* Horse ear */}
      <path d="M -20,-32 L -18,-38 L -14,-32 Z" fill={color} />

      {/* Horse eye */}
      <circle cx="-19" cy="-29" r="1.2" fill="#1a0a00" />

      {/* Horse mane */}
      <path d="M -12,-8 Q -15,-16 -14,-24" stroke={helmetColor} strokeWidth="2" fill="none" strokeOpacity="0.7" />

      {/* Horse tail */}
      <path d="M 18,-8 Q 26,-4 24,4 Q 20,0 18,-2" stroke={helmetColor} strokeWidth="2.5" fill="none" strokeLinecap="round" />

      {/* Front legs */}
      <line x1="-8" y1="-2" x2="-12" y2="10" stroke={color} strokeWidth="3" strokeLinecap="round"
        style={{ transformOrigin: "-8px -2px", animation: `${id}-leg-front ${legDur} ease-in-out infinite` }} />
      <line x1="-2" y1="-2" x2="-4" y2="10" stroke={color} strokeWidth="3" strokeLinecap="round"
        style={{ transformOrigin: "-2px -2px", animation: `${id}-leg-front ${legDur} 0.17s ease-in-out infinite` }} />

      {/* Back legs */}
      <line x1="8" y1="-2" x2="10" y2="10" stroke={color} strokeWidth="3" strokeLinecap="round"
        style={{ transformOrigin: "8px -2px", animation: `${id}-leg-back ${legDur} ease-in-out infinite` }} />
      <line x1="14" y1="-2" x2="18" y2="10" stroke={color} strokeWidth="3" strokeLinecap="round"
        style={{ transformOrigin: "14px -2px", animation: `${id}-leg-back ${legDur} 0.17s ease-in-out infinite` }} />

      {/* Rider body */}
      <ellipse cx="-4" cy="-22" rx="7" ry="9" fill="#8b2500" />

      {/* Rider head */}
      <circle cx="-4" cy="-34" r="6" fill="#c68642" />

      {/* Helmet */}
      <path d="M -10,-34 Q -10,-44 -4,-46 Q 2,-44 2,-34 Z" fill={helmetColor} />
      <rect x="-10" y="-36" width="12" height="3" rx="1" fill={helmetColor} opacity="0.8" />

      {/* Spear / lance */}
      <line x1="-4" y1="-22" x2="-4" y2="-60" stroke={helmetColor} strokeWidth="1.5" strokeLinecap="round" />

      {/* Flag on spear */}
      <path
        d="M -4,-60 L 10,-55 L -4,-50 Z"
        fill="#cc0000"
        style={{
          transformOrigin: "-4px -55px",
          animation: `${id}-leg-front ${flagDur} ease-in-out infinite`,
        }}
      />
    </g>
  );
}

export default GoldenHordeAvatar;
