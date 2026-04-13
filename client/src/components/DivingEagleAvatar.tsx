import React from "react";

interface DivingEagleAvatarProps {
  size?: number;
  className?: string;
}

/**
 * DivingEagleAvatar — SVG+CSS animated avatar for rank "Небесный орёл".
 * A golden eagle dives steeply from top to bottom with wings folded back,
 * leaving a shimmering golden comet trail. Background: deep blue sky with stars.
 * No Canvas, no JS loop — pure SVG animate + CSS @keyframes.
 */
export function DivingEagleAvatar({ size = 48, className = "" }: DivingEagleAvatarProps) {
  const id = `diving-eagle-${size}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      className={`rounded-full ${className}`}
      style={{ borderRadius: "50%", display: "block", overflow: "hidden" }}
    >
      <defs>
        {/* Deep blue sky — darker at top, lighter at bottom */}
        <radialGradient id={`${id}-sky`} cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor="#0a1a3a" />
          <stop offset="50%" stopColor="#0d2255" />
          <stop offset="100%" stopColor="#061030" />
        </radialGradient>

        {/* Subtle horizon glow */}
        <radialGradient id={`${id}-horizon`} cx="50%" cy="85%" r="50%">
          <stop offset="0%" stopColor="#1a3a8a" stopOpacity="0.5" />
          <stop offset="100%" stopColor="#061030" stopOpacity="0" />
        </radialGradient>

        {/* Eagle body gradient — golden */}
        <linearGradient id={`${id}-body`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#ffd700" />
          <stop offset="40%" stopColor="#ffb300" />
          <stop offset="100%" stopColor="#cc8800" />
        </linearGradient>

        {/* Eagle head — white/cream */}
        <linearGradient id={`${id}-head`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#fff8dc" />
          <stop offset="100%" stopColor="#f0e0b0" />
        </linearGradient>

        {/* Trail gradient — comet tail fading out */}
        <linearGradient id={`${id}-trail`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="20%" stopColor="#ffd700" stopOpacity="0.8" />
          <stop offset="60%" stopColor="#ff8c00" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#ff4500" stopOpacity="0" />
        </linearGradient>

        {/* Trail glow filter */}
        <filter id={`${id}-trail-glow`} x="-100%" y="-20%" width="300%" height="140%">
          <feGaussianBlur stdDeviation="2.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Eagle glow */}
        <filter id={`${id}-eagle-glow`} x="-40%" y="-40%" width="180%" height="180%">
          <feGaussianBlur stdDeviation="1.5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>

        {/* Shimmer sweep for eagle */}
        <linearGradient id={`${id}-shimmer`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,200,0)" />
          <stop offset="50%" stopColor="rgba(255,255,200,0.35)" />
          <stop offset="100%" stopColor="rgba(255,255,200,0)" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="-1 0"
            to="1 0"
            dur="1.6s"
            repeatCount="indefinite"
          />
        </linearGradient>

        <clipPath id={`${id}-clip`}>
          <circle cx="50" cy="50" r="50" />
        </clipPath>

        {/* Motion path: steep diagonal dive from upper-right to lower-left, then loop back */}
        <path
          id={`${id}-dive-path`}
          d="M 75,8 C 70,20 60,35 50,50 C 40,65 30,78 20,90 C 30,95 50,98 70,90 C 90,80 95,60 90,40 C 85,20 80,10 75,8 Z"
          fill="none"
        />

        <style>{`
          @keyframes ${id}-star-twinkle {
            0%, 100% { opacity: 0.3; r: 0.7; }
            50%       { opacity: 1.0; r: 1.1; }
          }
          @keyframes ${id}-border-pulse {
            0%, 100% { stroke-opacity: 0.7; stroke-width: 2.5; }
            50%       { stroke-opacity: 1.0; stroke-width: 3; }
          }
          @keyframes ${id}-trail-pulse {
            0%, 100% { opacity: 0.7; }
            50%       { opacity: 1.0; }
          }
          @keyframes ${id}-spark-fly {
            0%   { opacity: 1; transform: translate(0, 0) scale(1); }
            100% { opacity: 0; transform: translate(var(--sx), var(--sy)) scale(0.1); }
          }
        `}</style>
      </defs>

      {/* Sky background */}
      <circle cx="50" cy="50" r="50" fill={`url(#${id}-sky)`} />

      <g clipPath={`url(#${id}-clip)`}>
        {/* Horizon glow */}
        <ellipse cx="50" cy="85" rx="55" ry="30" fill={`url(#${id}-horizon)`} />

        {/* Stars — scattered, twinkling */}
        {[
          [10, 8,  0.0, 2.1], [25, 5,  0.4, 1.8], [42, 10, 0.8, 2.4],
          [60, 6,  0.2, 1.9], [78, 12, 1.1, 2.2], [90, 7,  0.6, 1.7],
          [5,  22, 1.3, 2.0], [18, 30, 0.3, 2.3], [88, 25, 0.9, 1.8],
          [95, 40, 0.1, 2.1], [8,  45, 1.5, 1.9], [92, 55, 0.7, 2.0],
          [35, 15, 0.5, 2.2], [70, 20, 1.2, 1.7], [50, 25, 0.0, 2.4],
        ].map(([sx, sy, delay, dur], i) => (
          <circle
            key={i}
            cx={sx}
            cy={sy}
            r="0.8"
            fill="rgba(200,220,255,0.8)"
            style={{
              animation: `${id}-star-twinkle ${dur}s ${delay}s ease-in-out infinite`,
            }}
          />
        ))}

        {/* === TRAIL — comet tail following the eagle === */}
        {/* Multiple trail segments with staggered delays to create comet effect */}
        {[0, 0.06, 0.11, 0.16, 0.21, 0.26, 0.31, 0.36].map((offset, i) => {
          const opacity = 0.9 - i * 0.1;
          const width = 6 - i * 0.6;
          return (
            <ellipse
              key={`trail-${i}`}
              rx={width}
              ry={width * 0.5}
              fill={`url(#${id}-trail)`}
              filter={i < 3 ? `url(#${id}-trail-glow)` : undefined}
              opacity={opacity}
              style={{ animation: `${id}-trail-pulse 1.2s ease-in-out infinite` }}
            >
              <animateMotion
                dur="3.2s"
                repeatCount="indefinite"
                keyPoints={`${offset};1`}
                keyTimes="0;1"
                calcMode="linear"
                rotate="auto"
              >
                <mpath href={`#${id}-dive-path`} />
              </animateMotion>
            </ellipse>
          );
        })}

        {/* Spark particles trailing behind */}
        {[
          { offset: 0.18, r: 2.0, delay: "0s",    color: "#ffffff" },
          { offset: 0.22, r: 1.5, delay: "0.1s",  color: "#ffd700" },
          { offset: 0.26, r: 1.8, delay: "0.05s", color: "#ffcc00" },
          { offset: 0.30, r: 1.2, delay: "0.15s", color: "#ff8c00" },
          { offset: 0.34, r: 1.0, delay: "0.08s", color: "#ffd700" },
        ].map((s, i) => (
          <circle
            key={`spark-${i}`}
            r={s.r}
            fill={s.color}
            opacity="0.9"
            filter={`url(#${id}-trail-glow)`}
          >
            <animateMotion
              dur="3.2s"
              repeatCount="indefinite"
              keyPoints={`${s.offset};1`}
              keyTimes="0;1"
              calcMode="linear"
            >
              <mpath href={`#${id}-dive-path`} />
            </animateMotion>
          </circle>
        ))}

        {/* === EAGLE — dives along path with wings folded === */}
        <g filter={`url(#${id}-eagle-glow)`}>
          <g>
            <animateMotion
              dur="3.2s"
              repeatCount="indefinite"
              rotate="auto"
            >
              <mpath href={`#${id}-dive-path`} />
            </animateMotion>

            {/* Body — elongated teardrop, pointing forward (left) */}
            <ellipse cx="-2" cy="0" rx="12" ry="5" fill={`url(#${id}-body)`} />

            {/* Wings swept back tight — diving posture */}
            {/* Left wing — swept back along body */}
            <path
              d="M -4,-2 C -8,-10 -14,-14 -10,-4 C -8,-1 -4,1 -4,2 Z"
              fill="#e6a800"
            />
            {/* Right wing — symmetric */}
            <path
              d="M -4,2 C -8,10 -14,14 -10,4 C -8,1 -4,-1 -4,-2 Z"
              fill="#cc8800"
            />

            {/* Tail feathers — spread slightly */}
            <path
              d="M 8,-2 L 16,-4 L 14,0 L 16,4 L 8,2 Z"
              fill="#e6a800"
            />
            {/* Tail center feather */}
            <line x1="8" y1="0" x2="17" y2="0" stroke="#ffd700" strokeWidth="1" />

            {/* Head — white/cream, forward */}
            <circle cx="-11" cy="-1" r="5" fill={`url(#${id}-head)`} />

            {/* Eye — sharp, focused */}
            <circle cx="-13" cy="-2" r="1.5" fill="#1a0000" />
            <circle cx="-12.5" cy="-2.5" r="0.5" fill="rgba(255,255,255,0.5)" />

            {/* Beak — hooked, sharp */}
            <path d="M -16,-1 L -21,0 L -17,2 Z" fill="#ff9900" />

            {/* Shimmer overlay on body */}
            <ellipse cx="-2" cy="0" rx="12" ry="5" fill={`url(#${id}-shimmer)`} />
          </g>
        </g>
      </g>

      {/* Golden border */}
      <circle
        cx="50" cy="50" r="48"
        fill="none"
        stroke="#ffd700"
        strokeWidth="2.5"
        strokeOpacity="0.85"
        style={{ animation: `${id}-border-pulse 2.5s ease-in-out infinite` }}
      />
    </svg>
  );
}

export default DivingEagleAvatar;
