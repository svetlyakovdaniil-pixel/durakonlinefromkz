import React from 'react';
import { getSeasonRank } from '../../../shared/seasons';

interface DiamondRankIconProps {
  seasonRating: number;
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Diamond-shaped rank icon that changes color based on the player's season rating.
 * The "Великий хан" rank (black diamond) has an animated gold shimmer via SVG SMIL.
 */
export function DiamondRankIcon({ seasonRating, size = 14, className = '', showTooltip = false }: DiamondRankIconProps) {
  const rank = getSeasonRank(seasonRating);
  const isGreatKhan = rank.key === 'great_khan';

  const diamondStyle: React.CSSProperties = {
    width: size,
    height: size,
    display: 'inline-block',
    flexShrink: 0,
    position: 'relative',
  };

  const svgContent = isGreatKhan ? (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
      className={`season-diamond-great-khan ${className}`}
    >
      <defs>
        <linearGradient id="greatKhanGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#1a1a2e" />
          <stop offset="40%" stopColor="#111827" />
          <stop offset="60%" stopColor="#1f2937" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
        <linearGradient id="greatKhanShimmer" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="rgba(234,179,8,0)" />
          <stop offset="40%" stopColor="rgba(234,179,8,0)" />
          <stop offset="50%" stopColor="rgba(234,179,8,0.7)" />
          <stop offset="60%" stopColor="rgba(234,179,8,0)" />
          <stop offset="100%" stopColor="rgba(234,179,8,0)" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="-1 0"
            to="2 0"
            dur="2s"
            repeatCount="indefinite"
          />
        </linearGradient>
        <linearGradient id="greatKhanBorder" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#92400e" />
          <animateTransform
            attributeName="gradientTransform"
            type="translate"
            from="-1 0"
            to="2 0"
            dur="2s"
            repeatCount="indefinite"
          />
        </linearGradient>
      </defs>
      {/* Diamond shape: top point, right, bottom, left */}
      <polygon
        points="8,1 15,8 8,15 1,8"
        fill="url(#greatKhanGradient)"
        stroke="url(#greatKhanBorder)"
        strokeWidth="1"
      />
      {/* Shimmer overlay */}
      <polygon
        points="8,1 15,8 8,15 1,8"
        fill="url(#greatKhanShimmer)"
        opacity="0.8"
      />
      {/* Inner highlight */}
      <polygon
        points="8,3 13,8 8,13 3,8"
        fill="none"
        stroke="rgba(234,179,8,0.2)"
        strokeWidth="0.5"
      />
    </svg>
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
        {diamondContent(diamondStyle, svgContent)}
      </span>
    );
  }

  return (
    <span style={diamondStyle}>
      {svgContent}
    </span>
  );
}

function diamondContent(_style: React.CSSProperties, content: React.ReactNode) {
  return content;
}

/** Lightweight version for use in game/room player lists */
export function PlayerRankBadge({ seasonRating, size = 12 }: { seasonRating: number; size?: number }) {
  return <DiamondRankIcon seasonRating={seasonRating} size={size} showTooltip />;
}
