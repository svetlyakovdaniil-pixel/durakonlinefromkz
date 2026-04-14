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
import { AmaterasuAvatar } from './avatars/AmaterasuAvatar';
import { SamuraiAvatar } from './avatars/SamuraiAvatar';
import { OniMaskAvatar } from './avatars/OniMaskAvatar';
import { RubyUnderwaterAvatar } from './RubyUnderwaterAvatar';
import { RubyEgyptianAvatar } from './RubyEgyptianAvatar';
import { RubyPirateAvatar } from './RubyPirateAvatar';
import { RubyNorseAvatar } from './RubyNorseAvatar';
import { RubySpaceAvatar } from './RubySpaceAvatar';
import { RubyCyberpunkAvatar } from './RubyCyberpunkAvatar';
import { RubyHiphopAvatar } from './RubyHiphopAvatar';
import { RubyAngelsDemonsAvatar } from './RubyAngelsDemonsAvatar';
import { AmberUnderwaterAvatar } from './AmberUnderwaterAvatar';
import { AmberEgyptianAvatar } from './AmberEgyptianAvatar';
import { AmberPirateAvatar } from './AmberPirateAvatar';
import { AmberNorseAvatar } from './AmberNorseAvatar';
import { AmberSpaceAvatar } from './AmberSpaceAvatar';
import { AmberCyberpunkAvatar } from './AmberCyberpunkAvatar';
import { AmberHiphopAvatar } from './AmberHiphopAvatar';
import { AmberAngelsDemonsAvatar } from './AmberAngelsDemonsAvatar';
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
    if (baseId === 'amaterasu_ruby') {
      return <AmaterasuAvatar size={size} />;
    }
    if (baseId === 'samurai_amber') {
      return <SamuraiAvatar size={size} />;
    }
    if (baseId === 'oni_mask_obsidian') {
      return <OniMaskAvatar size={size} />;
    }
    if (baseId === 'ruby_underwater_world') {
      return <RubyUnderwaterAvatar size={size} />;
    }
    if (baseId === 'ruby_egyptian_gods') {
      return <RubyEgyptianAvatar size={size} />;
    }
    if (baseId === 'ruby_pirate_islands') {
      return <RubyPirateAvatar size={size} />;
    }
    if (baseId === 'ruby_norse_gods') {
      return <RubyNorseAvatar size={size} />;
    }
    if (baseId === 'ruby_space_odyssey') {
      return <RubySpaceAvatar size={size} />;
    }
    if (baseId === 'ruby_cyberpunk') {
      return <RubyCyberpunkAvatar size={size} />;
    }
    if (baseId === 'ruby_hiphop_90s') {
      return <RubyHiphopAvatar size={size} />;
    }
    if (baseId === 'ruby_angels_demons') {
      return <RubyAngelsDemonsAvatar size={size} />;
    }
    if (baseId === 'amber_underwater_world') {
      return <AmberUnderwaterAvatar size={size} />;
    }
    if (baseId === 'amber_egyptian_gods') {
      return <AmberEgyptianAvatar size={size} />;
    }
    if (baseId === 'amber_pirate_islands') {
      return <AmberPirateAvatar size={size} />;
    }
    if (baseId === 'amber_norse_gods') {
      return <AmberNorseAvatar size={size} />;
    }
    if (baseId === 'amber_space_odyssey') {
      return <AmberSpaceAvatar size={size} />;
    }
    if (baseId === 'amber_cyberpunk') {
      return <AmberCyberpunkAvatar size={size} />;
    }
    if (baseId === 'amber_hiphop_90s') {
      return <AmberHiphopAvatar size={size} />;
    }
    if (baseId === 'amber_angels_demons') {
      return <AmberAngelsDemonsAvatar size={size} />;
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
