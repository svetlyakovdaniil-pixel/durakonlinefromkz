import React, { useId } from 'react';
import { getSeasonRank } from '../../../shared/seasons';

interface DiamondRankIconProps {
  seasonRating: number;
  size?: number;
  className?: string;
  showTooltip?: boolean;
}

/**
 * Diamond-shaped rank icon that changes color based on the player's season rating.
 * The "Великий хан" rank has an animated gold shimmer via CSS animation.
 */
export function DiamondRankIcon({ seasonRating, size = 14, className = '', showTooltip = false }: DiamondRankIconProps) {
  const rank = getSeasonRank(seasonRating);
  const isGreatKhan = rank.key === 'great_khan';
  // Unique IDs per instance to avoid gradient conflicts when multiple icons exist
  const uid = useId().replace(/:/g, '');

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
      style={{ display: 'block', overflow: 'visible' }}
      className={className}
    >
      <defs>
        {/* Static dark-gold base gradient */}
        <linearGradient id={`gkBase-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#2a1a00" />
          <stop offset="40%" stopColor="#1a1000" />
          <stop offset="70%" stopColor="#3d2800" />
          <stop offset="100%" stopColor="#0f0a00" />
        </linearGradient>
        {/* Gold border gradient */}
        <linearGradient id={`gkBorder-${uid}`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#92400e" />
          <stop offset="50%" stopColor="#fbbf24" />
          <stop offset="100%" stopColor="#92400e" />
        </linearGradient>
        {/* Shimmer overlay — animated via CSS on the <polygon> */}
        <linearGradient id={`gkShimmer-${uid}`} x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor="rgba(255,255,255,0)" />
          <stop offset="35%" stopColor="rgba(255,255,255,0)" />
          <stop offset="45%" stopColor="rgba(255,220,80,0.9)" />
          <stop offset="50%" stopColor="rgba(255,255,200,1)" />
          <stop offset="55%" stopColor="rgba(255,220,80,0.9)" />
          <stop offset="65%" stopColor="rgba(255,255,255,0)" />
          <stop offset="100%" stopColor="rgba(255,255,255,0)" />
        </linearGradient>
      </defs>

      {/* Base diamond */}
      <polygon
        points="8,1 15,8 8,15 1,8"
        fill={`url(#gkBase-${uid})`}
        stroke={`url(#gkBorder-${uid})`}
        strokeWidth="1"
      />

      {/* Pulsing outer glow ring */}
      <polygon
        points="8,0 16,8 8,16 0,8"
        fill="none"
        stroke="rgba(251,191,36,0.5)"
        strokeWidth="1"
        className="great-khan-glow"
      />

      {/* Shimmer overlay — animated via CSS on the <polygon> */}
      <polygon
        points="8,1 15,8 8,15 1,8"
        fill={`url(#gkShimmer-${uid})`}
        opacity="1"
        className="great-khan-shimmer"
      />

      {/* Inner gold outline */}
      <polygon
        points="8,3 13,8 8,13 3,8"
        fill="none"
        stroke="rgba(251,191,36,0.5)"
        strokeWidth="0.8"
      /> </svg>
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
