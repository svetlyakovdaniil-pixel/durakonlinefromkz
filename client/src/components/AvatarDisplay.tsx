import { KhanAvatar } from './KhanAvatar';
import { GoldenHordeAvatar } from './GoldenHordeAvatar';
import { DivingEagleAvatar } from './DivingEagleAvatar';
import { GreatKhanAvatar } from './GreatKhanAvatar';
import { getAvatarUrl } from '../../../shared/avatars';

interface AvatarDisplayProps {
  avatarId?: string | null;
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * Universal avatar renderer.
 * - For animated avatars (khan, golden_horde, diving_eagle, great_khan): renders SVG+CSS component
 * - For all others: renders a standard <img> tag
 * Note: legacy 'sky_eagle' avatarId is treated as 'diving_eagle' for backwards compatibility
 */
export function AvatarDisplay({ avatarId, size = 48, className = '', alt = 'Avatar' }: AvatarDisplayProps) {
  // Backwards compatibility: old sky_eagle users see the new diving_eagle avatar
  if (avatarId === 'sky_eagle') {
    return <DivingEagleAvatar size={size} className={className} />;
  }

  if (avatarId === 'khan') {
    return <KhanAvatar size={size} className={className} />;
  }

  if (avatarId === 'golden_horde') {
    return <GoldenHordeAvatar size={size} className={className} />;
  }

  if (avatarId === 'diving_eagle') {
    return <DivingEagleAvatar size={size} className={className} />;
  }

  if (avatarId === 'great_khan') {
    return <GreatKhanAvatar size={size} className={className} />;
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
