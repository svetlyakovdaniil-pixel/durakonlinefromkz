import React from 'react';
import { KhanAvatar } from './KhanAvatar';
import { useSettings } from '@/contexts/SettingsContext';
import { GoldenHordeAvatar } from './GoldenHordeAvatar';
import { GreatKhanAvatar } from './GreatKhanAvatar';
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
import { ObsidianUnderwaterAvatar } from './ObsidianUnderwaterAvatar';
import { ObsidianEgyptianAvatar } from './ObsidianEgyptianAvatar';
import { ObsidianPirateAvatar } from './ObsidianPirateAvatar';
import { ObsidianNorseAvatar } from './ObsidianNorseAvatar';
import { ObsidianSpaceAvatar } from './ObsidianSpaceAvatar';
import { ObsidianCyberpunkAvatar } from './ObsidianCyberpunkAvatar';
import { ObsidianHiphopAvatar } from './ObsidianHiphopAvatar';
import { ObsidianAngelsDemonsAvatar } from './ObsidianAngelsDemonsAvatar';
import { RubyKazakhAvatar } from './RubyKazakhAvatar';
import { RubyNeonEraAvatar } from './RubyNeonEraAvatar';
import { RubyApocalypseAvatar } from './RubyApocalypseAvatar';
import { RubyJapaneseNewAvatar } from './RubyJapaneseNewAvatar';
import { AmberKazakhAvatar } from './AmberKazakhAvatar';
import { AmberNeonEraAvatar } from './AmberNeonEraAvatar';
import { AmberApocalypseAvatar } from './AmberApocalypseAvatar';
import { AmberJapaneseAvatar } from './AmberJapaneseAvatar';
import { ObsidianKazakhAvatar } from './ObsidianKazakhAvatar';
import { ObsidianNeonEraAvatar } from './ObsidianNeonEraAvatar';
import { ObsidianApocalypseAvatar } from './ObsidianApocalypseAvatar';
import { ObsidianJapaneseAvatar } from './ObsidianJapaneseAvatar';
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
  const { settings } = useSettings();
  const animationsEnabled = settings.animationsEnabled;

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
    if (baseId === 'khan') {
      return <KhanAvatar size={size} />;
    }
    if (baseId === 'golden_horde') {
      return <GoldenHordeAvatar size={size} />;
    }
    if (baseId === 'great_khan') {
      return <GreatKhanAvatar size={size} />;
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
    if (baseId === 'obsidian_underwater_world') {
      return <ObsidianUnderwaterAvatar size={size} />;
    }
    if (baseId === 'obsidian_egyptian_gods') {
      return <ObsidianEgyptianAvatar size={size} />;
    }
    if (baseId === 'obsidian_pirate_islands') {
      return <ObsidianPirateAvatar size={size} />;
    }
    if (baseId === 'obsidian_norse_gods') {
      return <ObsidianNorseAvatar size={size} />;
    }
    if (baseId === 'obsidian_space_odyssey') {
      return <ObsidianSpaceAvatar size={size} />;
    }
    if (baseId === 'obsidian_cyberpunk') {
      return <ObsidianCyberpunkAvatar size={size} />;
    }
    if (baseId === 'obsidian_hiphop_90s') {
      return <ObsidianHiphopAvatar size={size} />;
    }
    if (baseId === 'obsidian_angels_demons') {
      return <ObsidianAngelsDemonsAvatar size={size} />;
    }
    // Season 6–9 Ruby
    if (baseId === 'ruby_kazakh') {
      return <RubyKazakhAvatar size={size} />;
    }
    if (baseId === 'ruby_neon_era') {
      return <RubyNeonEraAvatar size={size} />;
    }
    if (baseId === 'ruby_apocalypse') {
      return <RubyApocalypseAvatar size={size} />;
    }
    if (baseId === 'ruby_japanese') {
      return <RubyJapaneseNewAvatar size={size} />;
    }
    // Season 6–9 Amber
    if (baseId === 'amber_kazakh') {
      return <AmberKazakhAvatar size={size} />;
    }
    if (baseId === 'amber_neon_era') {
      return <AmberNeonEraAvatar size={size} />;
    }
    if (baseId === 'amber_apocalypse') {
      return <AmberApocalypseAvatar size={size} />;
    }
    if (baseId === 'amber_japanese') {
      return <AmberJapaneseAvatar size={size} />;
    }
    // Season 6–9 Obsidian
    if (baseId === 'obsidian_kazakh') {
      return <ObsidianKazakhAvatar size={size} />;
    }
    if (baseId === 'obsidian_neon_era') {
      return <ObsidianNeonEraAvatar size={size} />;
    }
    if (baseId === 'obsidian_apocalypse') {
      return <ObsidianApocalypseAvatar size={size} />;
    }
    if (baseId === 'obsidian_japanese') {
      return <ObsidianJapaneseAvatar size={size} />;
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

  // Animated avatars handle their own clipping internally (rounded-full on inner img container)
  // They must NOT be wrapped in overflow:hidden as that clips box-shadow and orbital particles
  const ANIMATED_AVATAR_IDS = new Set([
    'khan', 'golden_horde', 'great_khan', 'neon_dino', 'neon_cat', 'neon_crown',
    'toxic_storm', 'gasmask_amber', 'nuclear_mushroom',
    'amaterasu_ruby', 'samurai_amber', 'oni_mask_obsidian',
    'ruby_underwater_world', 'ruby_egyptian_gods', 'ruby_pirate_islands', 'ruby_norse_gods',
    'ruby_space_odyssey', 'ruby_cyberpunk', 'ruby_hiphop_90s', 'ruby_angels_demons',
    'amber_underwater_world', 'amber_egyptian_gods', 'amber_pirate_islands', 'amber_norse_gods',
    'amber_space_odyssey', 'amber_cyberpunk', 'amber_hiphop_90s', 'amber_angels_demons',
    'obsidian_underwater_world', 'obsidian_egyptian_gods', 'obsidian_pirate_islands', 'obsidian_norse_gods',
    'obsidian_space_odyssey', 'obsidian_cyberpunk', 'obsidian_hiphop_90s', 'obsidian_angels_demons',
    'ruby_kazakh', 'ruby_neon_era', 'ruby_apocalypse', 'ruby_japanese',
    'amber_kazakh', 'amber_neon_era', 'amber_apocalypse', 'amber_japanese',
    'obsidian_kazakh', 'obsidian_neon_era', 'obsidian_apocalypse', 'obsidian_japanese',
  ]);
  const isAnimated = ANIMATED_AVATAR_IDS.has(baseId ?? '');

  // If no transform needed (all defaults), skip the wrapper for performance
  const hasTransform = offsetX !== 0 || offsetY !== 0 || imgScale !== 1;
  if (!hasTransform) {
    if (isAnimated) {
      // No overflow:hidden — let box-shadow and particles breathe
      return (
        <div
          className={`rounded-full flex-shrink-0 ${className}`}
          style={{ width: size, height: size, ...(!animationsEnabled ? { '--animations-disabled': '1' } as React.CSSProperties : {}) }}
        >
          {!animationsEnabled ? (
            <style>{`
              .avatar-anim-wrapper * { animation: none !important; transition: none !important; }
            `}</style>
          ) : null}
          <div className={!animationsEnabled ? 'avatar-anim-wrapper' : ''}>
            {renderContent()}
          </div>
        </div>
      );
    }
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
      className={`rounded-full ${isAnimated ? '' : 'overflow-hidden'} flex-shrink-0 ${className}`}
      style={{ width: size, height: size, position: 'relative' }}
    >
      {!animationsEnabled && isAnimated ? (
        <style>{`
          .avatar-anim-wrapper * { animation: none !important; transition: none !important; }
        `}</style>
      ) : null}
      <div
        className={!animationsEnabled && isAnimated ? 'avatar-anim-wrapper' : ''}
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
