import React from "react";

interface SkyEagleAvatarProps {
  size?: number;
  className?: string;
}

/**
 * SkyEagleAvatar — SVG+CSS animated avatar.
 * Golden eagle flies in a figure-8 path across a deep blue sky,
 * leaving a shimmering golden trail. No Canvas, no JS animation loop.
 * GPU-accelerated via CSS @keyframes + SVG animateMotion.
 */
export function SkyEagleAvatar({ size = 48, className = "" }: SkyEagleAvatarProps) {
  const id = `sky-eagle-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`rounded-full ${className}`}
      style={{ borderRadius: "50%", display: "block", overflow: "hidden" }}
    >
      <defs>
        {/* Sky background gradient */}
        <radialGradient id={`${id}-bg`} cx="50%" cy="45%" r="55%">
          <stop offset="0%" stopColor="#1a3a6e" />
          <stop offset="60%" stopColor="#0d1f42" />
          <stop offset="100%" stopColor="#060e20" />
        </radialGradient>

        {/* Golden shimmer gradient for eagle body */}
        <linearGradient id={`${id}-body`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="50%" stopColor="#ffb300" />
          <stop offset="100%" stopColor="#cc8800" />
        </linearGradient>

        {/* Wing gradient */}
        <linearGradient id={`${id}-wing`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#e6a800" />
          <stop offset="50%" stopColor="#ffd700" />
          <stop offset="100%" stopColor="#ffcc00" />
        </linearGradient>

        {/* Trail glow gradient */}
        <radialGradient id={`${id}-trail`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#ffd700" stopOpacity="0.9" />
          <stop offset="50%" stopColor="#ff8c00" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#ff4500" stopOpacity="0" />
        </radialGradient>

        {/* Clip to circle */}
        <clipPath id={`${id}-clip`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>

        {/* Figure-8 motion path for eagle */}
        <path id={`${id}-path`} d="M 50,50 C 75,35 85,30 78,50 C 71,70 60,72 50,50 C 40,28 29,30 22,50 C 15,70 25,65 50,50 Z" fill="none" />

        {/* Shimmer animation filter */}
        <filter id={`${id}-glow`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        <style>{`
          @keyframes ${id}-star-twinkle {
            0%, 100% { opacity: 0.4; }
            50%       { opacity: 1.0; }
          }
          @keyframes ${id}-border-pulse {
            0%, 100% { stroke-opacity: 0.7; }
            50%       { stroke-opacity: 1.0; }
          }
          @keyframes ${id}-wing-flap-up {
            0%   { d: path("M -3,-2 Q -20,-22 -30,-14 Q -20,-4 -3,2 Z"); }
            50%  { d: path("M -3,-2 Q -20,-10 -30,-2 Q -20,-4 -3,2 Z"); }
            100% { d: path("M -3,-2 Q -20,-22 -30,-14 Q -20,-4 -3,2 Z"); }
          }
          @keyframes ${id}-wing-flap-down {
            0%   { d: path("M -3,2 Q -20,12 -28,8 Q -18,5 -3,4 Z"); }
            50%  { d: path("M -3,2 Q -20,18 -28,16 Q -18,5 -3,4 Z"); }
            100% { d: path("M -3,2 Q -20,12 -28,8 Q -18,5 -3,4 Z"); }
          }
          @keyframes ${id}-shimmer-sweep {
            0%   { opacity: 0; transform: translateX(-120%); }
            30%  { opacity: 0.3; }
            70%  { opacity: 0.3; }
            100% { opacity: 0; transform: translateX(120%); }
          }
          @keyframes ${id}-trail-fade {
            0%   { opacity: 0.8; r: 3; }
            100% { opacity: 0; r: 0.5; }
          }
        `}</style>
      </defs>

      {/* Background */}
      <circle cx="50" cy="50" r="50" fill={`url(#${id}-bg)`} />

      <g clipPath={`url(#${id}-clip)`}>
        {/* Stars — scattered twinkles */}
        {[
          [15, 12, 0.0], [82, 8, 0.7], [65, 18, 1.4], [30, 22, 0.3],
          [90, 30, 1.1], [5, 40, 0.5], [75, 42, 1.8], [45, 8, 0.9],
          [55, 35, 0.2], [20, 55, 1.5], [88, 55, 0.6],
        ].map(([sx, sy, delay], i) => (
          <circle
            key={i}
            cx={sx}
            cy={sy}
            r="0.8"
            fill="rgba(255,240,180,0.7)"
            style={{
              animation: `${id}-star-twinkle ${2 + (i % 3) * 0.5}s ${delay}s ease-in-out infinite`,
            }}
          />
        ))}

        {/* Trail particles — 6 circles that follow the path with offset delays */}
        {[0, 0.08, 0.14, 0.20, 0.26, 0.32].map((offset, i) => (
          <circle
            key={`trail-${i}`}
            r={3 - i * 0.4}
            fill={`url(#${id}-trail)`}
            filter={`url(#${id}-glow)`}
            opacity={0.8 - i * 0.12}
          >
            <animateMotion
              dur="4.5s"
              repeatCount="indefinite"
              keyPoints={`${offset};1`}
              keyTimes="0;1"
              calcMode="linear"
            >
              <mpath href={`#${id}-path`} />
            </animateMotion>
          </circle>
        ))}

        {/* Eagle group — moves along figure-8 path */}
        <g filter={`url(#${id}-glow)`}>
          {/* Eagle body + wings as a group that follows the path */}
          <g>
            <animateMotion
              dur="4.5s"
              repeatCount="indefinite"
              rotate="auto"
            >
              <mpath href={`#${id}-path`} />
            </animateMotion>

            {/* Upper wing — flaps */}
            <path
              d="M -3,-2 Q -20,-22 -30,-14 Q -20,-4 -3,2 Z"
              fill={`url(#${id}-wing)`}
            >
              <animate
                attributeName="d"
                dur="0.5s"
                repeatCount="indefinite"
                values="M -3,-2 Q -20,-22 -30,-14 Q -20,-4 -3,2 Z;M -3,-2 Q -20,-10 -30,-2 Q -20,-4 -3,2 Z;M -3,-2 Q -20,-22 -30,-14 Q -20,-4 -3,2 Z"
                keyTimes="0;0.5;1"
                calcMode="spline"
                keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
              />
            </path>

            {/* Lower wing */}
            <path
              d="M -3,2 Q -20,12 -28,8 Q -18,5 -3,4 Z"
              fill="#cc8800"
            >
              <animate
                attributeName="d"
                dur="0.5s"
                repeatCount="indefinite"
                values="M -3,2 Q -20,12 -28,8 Q -18,5 -3,4 Z;M -3,2 Q -20,18 -28,16 Q -18,5 -3,4 Z;M -3,2 Q -20,12 -28,8 Q -18,5 -3,4 Z"
                keyTimes="0;0.5;1"
                calcMode="spline"
                keySplines="0.4 0 0.6 1;0.4 0 0.6 1"
              />
            </path>

            {/* Body */}
            <ellipse cx="0" cy="0" rx="9" ry="5" fill={`url(#${id}-body)`} />

            {/* Tail feathers */}
            <polygon points="7,-2 18,-5 16,0 18,5 7,2" fill="#e6a800" />

            {/* Head */}
            <circle cx="-7" cy="-3" r="5" fill="#fff8dc" />

            {/* Eye */}
            <circle cx="-9" cy="-4" r="1.5" fill="#1a0000" />

            {/* Beak */}
            <polygon points="-12,-3 -17,-1 -13,0" fill="#ff9900" />

            {/* Shimmer sweep */}
            <ellipse cx="0" cy="0" rx="30" ry="20" fill="rgba(255,255,200,0.18)" style={{ animation: `${id}-shimmer-sweep 2.2s ease-in-out infinite` }} />
          </g>
        </g>
      </g>

      {/* Golden border ring */}
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

export default SkyEagleAvatar;
