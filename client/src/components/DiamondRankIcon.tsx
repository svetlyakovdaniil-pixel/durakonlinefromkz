import React from 'react';
import { getSeasonRank } from '../../../shared/seasons';
import { useSettings } from '@/contexts/SettingsContext';

interface DiamondRankIconProps {
  seasonRating: number;
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Diamond-shaped rank icon that changes color based on the player's season rating.
 * The "Великий хан" rank (black diamond) has an animated gold shimmer via CSS.
 */
export function DiamondRankIcon({ seasonRating, size = 14, className = '', showTooltip = false }: DiamondRankIconProps) {
  const rank = getSeasonRank(seasonRating);
  const isGreatKhan = rank.key === 'great_khan';
  const { settings } = useSettings();
  const animationsEnabled = settings.animationsEnabled;

  const diamondStyle: React.CSSProperties = {
    width: size,
    height: size,
    display: 'inline-block',
    flexShrink: 0,
    position: 'relative',
  };

  const svgContent = isGreatKhan ? (
    <>
      <style>{`
        @keyframes gk-shimmer {
          0%   { transform: translateX(-120%); }
          100% { transform: translateX(220%); }
        }
        @keyframes gk-border-pulse {
          0%, 100% { opacity: 0.7; }
          50%       { opacity: 1; }
        }
        .gk-diamond-shimmer {
          animation: ${animationsEnabled ? 'gk-shimmer 2s linear infinite' : 'none'};
        }
        .gk-diamond-border {
          animation: ${animationsEnabled ? 'gk-border-pulse 2s ease-in-out infinite' : 'none'};
        }
      `}</style>
      <svg
        width={size}
        height={size}
        viewBox="0 0 16 16"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{ display: 'block', overflow: 'visible' }}
        className={`season-diamond-great-khan ${className}`}
      >
        <defs>
          <clipPath id="gk-diamond-clip">
            <polygon points="8,1 15,8 8,15 1,8" />
          </clipPath>
        </defs>

        {/* Dark base fill */}
        <polygon
          points="8,1 15,8 8,15 1,8"
          fill="#111827"
        />

        {/* Shimmer overlay — a bright diagonal band that slides across */}
        <g clipPath="url(#gk-diamond-clip)">
          <rect
            className="gk-diamond-shimmer"
            x="-6" y="-2"
            width="8" height="20"
            fill="rgba(234,179,8,0.55)"
            style={{ transform: 'rotate(-20deg)', transformOrigin: '8px 8px' }}
          />
        </g>

        {/* Animated gold border */}
        <polygon
          className="gk-diamond-border"
          points="8,1 15,8 8,15 1,8"
          fill="none"
          stroke="url(#gk-border-grad)"
          strokeWidth="1.2"
        />
        <defs>
          <linearGradient id="gk-border-grad" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#92400e" />
            <stop offset="50%" stopColor="#fbbf24" />
            <stop offset="100%" stopColor="#92400e" />
          </linearGradient>
        </defs>

        {/* Inner highlight facet */}
        <polygon
          points="8,3 13,8 8,13 3,8"
          fill="none"
          stroke="rgba(234,179,8,0.18)"
          strokeWidth="0.5"
        />
      </svg>
    </>
  ) : (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
      className={className}
    >
      <polygon
        points="8,1 15,8 8,15 1,8"
        fill={rank.color}
        stroke={rank.color}
        strokeWidth="0.5"
        opacity="0.9"
      />
      {/* Inner lighter highlight */}
      <polygon
        points="8,4 12,8 8,12 4,8"
        fill="rgba(255,255,255,0.15)"
      />
      {/* Top-left facet highlight */}
      <polygon
        points="8,1 4,8 8,4"
        fill="rgba(255,255,255,0.25)"
      />
    </svg>
  );

  if (showTooltip) {
    return (
      <span
        style={diamondStyle}
        title={rank.nameRu}
        className="cursor-help"
      >
        {svgContent}
      </span>
    );
  }

  return (
    <span style={diamondStyle}>
      {svgContent}
    </span>
  );
}

/** Lightweight version for use in game/room player lists */
export function PlayerRankBadge({ seasonRating, size = 12 }: { seasonRating: number; size?: number }) {
  return <DiamondRankIcon seasonRating={seasonRating} size={size} showTooltip />;
}
