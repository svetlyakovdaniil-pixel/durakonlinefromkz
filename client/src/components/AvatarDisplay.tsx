import { KhanAvatar } from './KhanAvatar';
import { GoldenHordeAvatar } from './GoldenHordeAvatar';
import { DivingEagleAvatar } from './DivingEagleAvatar';
import { GreatKhanAvatar } from './GreatKhanAvatar';
import { NeonPawAvatar } from './NeonPawAvatar';
import { NeonDinoAvatar } from './NeonDinoAvatar';
import { NeonCatAvatar } from './NeonCatAvatar';
import { NeonCrownAvatar } from './NeonCrownAvatar';
import { ToxicStormAvatar } from './ToxicStormAvatar';
import { GasMaskAvatar } from './GasMaskAvatar';
import { NuclearMushroomAvatar } from './NuclearMushroomAvatar';
import { getAvatarUrl, getBaseAvatarId } from '../../../shared/avatars';
import { useAvatarOffsets } from '@/hooks/useAvatarOffsets';

interface AvatarDisplayProps {
  avatarId?: string | null;
  size?: number;
  className?: string;
  alt?: string;
}

/**
 * Universal avatar renderer.
 *
 * Architecture:
 * - Strips season suffix (e.g. 'neon_paw_2026Q3' → 'neon_paw') via getBaseAvatarId
 * - Reads offsetX/offsetY/imgScale from DB for ANY avatarId (admin-controlled globally)
 * - Wraps all avatar content in a clipping container + inner transform div
 * - neon_crown uses its own internal offset system (passed as props) for backwards compat
 *
 * This means: admin changes in AvatarEditorTab propagate to ALL places that use AvatarDisplay:
 * lobby, profile, game table, season rewards, avatar picker preview.
 */
export function AvatarDisplay({ avatarId, size = 48, className = '', alt = 'Avatar' }: AvatarDisplayProps) {
  const baseId = getBaseAvatarId(avatarId);
  const { getOffsets } = useAvatarOffsets();

  // For neon_crown: use its own internal offset system (legacy, keeps existing behaviour)
  if (baseId === 'neon_crown') {
    const { offsetX, offsetY, imgScale } = getOffsets('neon_crown');
    return <NeonCrownAvatar size={size} className={className} offsetX={offsetX} offsetY={offsetY} imgScale={imgScale} />;
  }

  // Read offsets from DB for this avatar (falls back to static defaults if not set)
  const { offsetX, offsetY, imgScale } = getOffsets(baseId ?? '');

  // Convert percentage offsets to pixel values
  const translateX = (offsetX / 100) * size;
  const translateY = (offsetY / 100) * size;

  // Render the raw avatar content (no clipping, no transform yet)
  function renderContent() {
    // Backwards compatibility: old sky_eagle users see the new diving_eagle avatar
    if (baseId === 'sky_eagle') {
      return <DivingEagleAvatar size={size} />;
    }
    if (baseId === 'khan') {
      return <KhanAvatar size={size} />;
    }
    if (baseId === 'golden_horde') {
      return <GoldenHordeAvatar size={size} />;
    }
    if (baseId === 'diving_eagle') {
      return <DivingEagleAvatar size={size} />;
    }
    if (baseId === 'great_khan') {
      return <GreatKhanAvatar size={size} />;
    }
    if (baseId === 'neon_paw') {
      return <NeonPawAvatar size={size} />;
    }
    if (baseId === 'neon_dino') {
      return <NeonDinoAvatar size={size} />;
    }
    if (baseId === 'neon_cat') {
      return <NeonCatAvatar size={size} />;
    }
    if (baseId === 'toxic_storm') {
      return <ToxicStormAvatar size={size} />;
    }
    if (baseId === 'gasmask_amber') {
      return <GasMaskAvatar size={size} />;
    }
    if (baseId === 'nuclear_mushroom') {
      return <NuclearMushroomAvatar size={size} />;
    }
    // Image-based avatar
    return (
      <img
        src={getAvatarUrl(avatarId)}
        alt={alt}
        width={size}
        height={size}
        style={{ width: size, height: size, objectFit: 'cover', display: 'block' }}
      />
    );
  }

  // If no transform needed (all defaults), skip the wrapper for performance
  const hasTransform = offsetX !== 0 || offsetY !== 0 || imgScale !== 1;

  if (!hasTransform) {
    return (
      <div
        className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
        style={{ width: size, height: size }}
      >
        {renderContent()}
      </div>
    );
  }

  return (
    <div
      className={`rounded-full overflow-hidden flex-shrink-0 ${className}`}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <div
        style={{
          transform: `translate(${translateX}px, ${translateY}px) scale(${imgScale})`,
          transformOrigin: 'center center',
          width: '100%',
          height: '100%',
        }}
      >
        {renderContent()}
      </div>
    </div>
  );
}
