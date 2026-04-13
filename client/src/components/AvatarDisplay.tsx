import { KhanAvatar } from './KhanAvatar';
import { GoldenHordeAvatar } from './GoldenHordeAvatar';
import { DivingEagleAvatar } from './DivingEagleAvatar';
import { GreatKhanAvatar } from './GreatKhanAvatar';
import { NeonPawAvatar } from './NeonPawAvatar';
import { NeonDinoAvatar } from './NeonDinoAvatar';
import { NeonCatAvatar } from './NeonCatAvatar';
import { NeonCrownAvatar } from './NeonCrownAvatar';
import { getAvatarUrl, getBaseAvatarId } from '../../../shared/avatars';

interface AvatarDisplayProps {
  avatarId?: string | null;
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * Universal avatar renderer.
 * - Supports season-suffixed IDs (e.g. 'neon_paw_2026Q3', 'diving_eagle_2026Q2')
 *   by stripping the suffix and rendering the base animated component.
 * - For animated avatars (khan, golden_horde, diving_eagle, great_khan, neon_paw): renders SVG+CSS component
 * - For all others: renders a standard <img> tag
 * Note: legacy 'sky_eagle' avatarId is treated as 'diving_eagle' for backwards compatibility
 */
export function AvatarDisplay({ avatarId, size = 48, className = '', alt = 'Avatar' }: AvatarDisplayProps) {
  // Strip season suffix to get the base component ID
  const baseId = getBaseAvatarId(avatarId);

  // Backwards compatibility: old sky_eagle users see the new diving_eagle avatar
  if (baseId === 'sky_eagle') {
    return <DivingEagleAvatar size={size} className={className} />;
  }

  if (baseId === 'khan') {
    return <KhanAvatar size={size} className={className} />;
  }

  if (baseId === 'golden_horde') {
    return <GoldenHordeAvatar size={size} className={className} />;
  }

  if (baseId === 'diving_eagle') {
    return <DivingEagleAvatar size={size} className={className} />;
  }

  if (baseId === 'great_khan') {
    return <GreatKhanAvatar size={size} className={className} />;
  }

  if (baseId === 'neon_paw') {
    return <NeonPawAvatar size={size} className={className} />;
  }

  if (baseId === 'neon_dino') {
    return <NeonDinoAvatar size={size} className={className} />;
  }

  if (baseId === 'neon_cat') {
    return <NeonCatAvatar size={size} className={className} />;
  }

  if (baseId === 'neon_crown') {
    return <NeonCrownAvatar size={size} className={className} />;
  }

  return (
    <img
      src={getAvatarUrl(avatarId)}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full object-cover ${className}`}
      style={{ width: size, height: size }}
    />
  );
}
