import { SkyEagleAvatar } from './SkyEagleAvatar';
import { getAvatarUrl } from '../../../shared/avatars';

interface AvatarDisplayProps {
  avatarId?: string | null;
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * Universal avatar renderer.
 * - For 'sky_eagle': renders the animated Canvas component
 * - For all others: renders a standard <img> tag
 */
export function AvatarDisplay({ avatarId, size = 48, className = '', alt = 'Avatar' }: AvatarDisplayProps) {
  if (avatarId === 'sky_eagle') {
    return (
      <SkyEagleAvatar
        size={size}
        className={className}
      />
    );
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
