import { useState, useMemo } from 'react';
import { useAvatarOffsets } from '@/hooks/useAvatarOffsets';
import {
  AVATAR_OPTIONS,
  getAvatarUrl,
  getBaseAvatarId,
  isSeasonSuffixedAvatar,
  getAvatarDisplayName,
} from '../../../shared/avatars';
import { getSeasonInfo, getCurrentSeasonNumber } from '../../../shared/seasons';
import { Button } from '@/components/ui/button';
import { Check, X, Lock, Trophy } from 'lucide-react';
import { useTranslation } from '@/i18n';
import { trpc } from '@/lib/trpc';
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

interface AvatarPickerProps {
  currentAvatarId: string | null | undefined;
  onSelect: (avatarId: string) => void;
  onClose: () => void;
  loading?: boolean;
}

/** Render animated avatar component by base ID — reads neon_crown offsets from DB */
function AnimatedAvatar({ baseId, size }: { baseId: string; size: number }) {
  const { getOffsets } = useAvatarOffsets();
  if (baseId === 'khan') return <KhanAvatar size={size} />;
  if (baseId === 'golden_horde') return <GoldenHordeAvatar size={size} />;
  if (baseId === 'diving_eagle' || baseId === 'sky_eagle') return <DivingEagleAvatar size={size} />;
  if (baseId === 'great_khan') return <GreatKhanAvatar size={size} />;
  if (baseId === 'neon_paw') return <NeonPawAvatar size={size} />;
  if (baseId === 'neon_dino') return <NeonDinoAvatar size={size} />;
  if (baseId === 'neon_cat') return <NeonCatAvatar size={size} />;
  if (baseId === 'neon_crown') {
    const { offsetX, offsetY, imgScale } = getOffsets('neon_crown');
    return <NeonCrownAvatar size={size} offsetX={offsetX} offsetY={offsetY} imgScale={imgScale} />;
  }
  if (baseId === 'toxic_storm') return <ToxicStormAvatar size={size} />;
  if (baseId === 'gasmask_amber') return <GasMaskAvatar size={size} />;
  if (baseId === 'nuclear_mushroom') return <NuclearMushroomAvatar size={size} />;
  if (baseId === 'amaterasu_ruby') return <AmaterasuAvatar size={size} />;
  if (baseId === 'samurai_amber') return <SamuraiAvatar size={size} />;
  if (baseId === 'oni_mask_obsidian') return <OniMaskAvatar size={size} />;
  // Season 6–9 Ruby
  if (baseId === 'ruby_kazakh') return <RubyKazakhAvatar size={size} />;
  if (baseId === 'ruby_neon_era') return <RubyNeonEraAvatar size={size} />;
  if (baseId === 'ruby_apocalypse') return <RubyApocalypseAvatar size={size} />;
  if (baseId === 'ruby_japanese') return <RubyJapaneseNewAvatar size={size} />;
  // Season 6–9 Amber
  if (baseId === 'amber_kazakh') return <AmberKazakhAvatar size={size} />;
  if (baseId === 'amber_neon_era') return <AmberNeonEraAvatar size={size} />;
  if (baseId === 'amber_apocalypse') return <AmberApocalypseAvatar size={size} />;
  if (baseId === 'amber_japanese') return <AmberJapaneseAvatar size={size} />;
  // Season 6–9 Obsidian
  if (baseId === 'obsidian_kazakh') return <ObsidianKazakhAvatar size={size} />;
  if (baseId === 'obsidian_neon_era') return <ObsidianNeonEraAvatar size={size} />;
  if (baseId === 'obsidian_apocalypse') return <ObsidianApocalypseAvatar size={size} />;
  if (baseId === 'obsidian_japanese') return <ObsidianJapaneseAvatar size={size} />;
  return null;
}

/** Get season number from a suffixed avatar ID (e.g. 'neon_paw_2026Q3' → 7) */
function getSeasonNumberFromAvatarId(avatarId: string): number | undefined {
  const match = avatarId.match(/_(\d{4})Q([1-4])$/);
  if (!match) return undefined;
  const year = parseInt(match[1], 10);
  const quarter = parseInt(match[2], 10);
  const seasonKey = `${year}-Q${quarter}`;
  return getSeasonInfo(seasonKey)?.seasonNumber;
}

export default function AvatarPicker({ currentAvatarId, onSelect, onClose, loading }: AvatarPickerProps) {
  const { t, locale } = useTranslation();
  const [selected, setSelected] = useState(currentAvatarId || 'wolf');
  const { data: ownedAvatars = [] } = trpc.shop.ownedAvatars.useQuery();

  // ── Obsolete base IDs replaced by newer season-specific avatars ─────────────
  // These old IDs (khan=S6 Ruby, golden_horde=S6 Amber, great_khan=S6 Obsidian)
  // were replaced by ruby_kazakh, amber_kazakh, obsidian_kazakh respectively.
  // They should never appear in the picker — only owned seasonal variants should.
  const OBSOLETE_BASE_IDS = new Set(['khan', 'golden_horde', 'great_khan']);

  // ── Build the full list of avatars to show in the grid ──────────────────────
  // Rules:
  // 1. Non-season-reward avatars (wolf, eagle, bear, fox, snow-leopard, premium shop): always show
  // 2. Season reward avatars (base IDs): only show if owned (ownedAvatars includes the base ID)
  // 3. Per-season suffixed avatars (e.g. 'diving_eagle_2026Q2'): only show if owned
  // 4. Obsolete base IDs (khan, golden_horde, great_khan): never show
  // 5. Bot avatar: never show
  const allAvatarItems = useMemo(() => {
    // Static catalog items — only show if player owns them (for season rewards)
    // or if they are free/premium-purchased non-season avatars
    const staticItems = AVATAR_OPTIONS.filter(a => {
      if (a.id === 'bot') return false;
      // Never show obsolete base IDs replaced by newer season-specific avatars
      if (OBSOLETE_BASE_IDS.has(a.id)) return false;
      // Season reward avatars: only show if player owns this base ID
      if (a.seasonReward) {
        // If player has a seasonal suffixed variant, the suffixed item will be shown instead
        // Only show base ID if it's directly owned (not via suffix)
        return ownedAvatars.includes(a.id);
      }
      // Premium shop avatars: show always (locked if not purchased)
      // Free avatars (wolf, eagle, bear, fox, snow-leopard): always show
      return true;
    }).map(a => ({
      id: a.id,
      name: a.name,
      baseId: a.id,
      isSeasonal: false,
      isAnimated: !!a.animated,
      isPremium: !!a.premium,
      isSeasonReward: !!a.seasonReward,
      previewUrl: a.previewUrl,
      url: a.url,
      displayName: locale === 'kk' ? (a.nameKk ?? a.name) : locale === 'en' ? (a.nameEn ?? a.name) : a.name,
    }));

    // Per-season owned avatars (suffixed IDs like 'neon_paw_2026Q2')
    const seasonalItems = ownedAvatars
      .filter(id => isSeasonSuffixedAvatar(id))
      .map(id => {
        const baseId = getBaseAvatarId(id);
        const baseOption = AVATAR_OPTIONS.find(a => a.id === baseId);
        const seasonNumber = getSeasonNumberFromAvatarId(id);
        const displayName = getAvatarDisplayName(id, locale as 'ru' | 'kk' | 'en', seasonNumber);
        return {
          id,
          name: displayName,
          baseId,
          isSeasonal: true,
          isAnimated: !!baseOption?.animated,
          isPremium: false,
          isSeasonReward: true,
          previewUrl: baseOption?.previewUrl,
          url: baseOption?.url ?? '',
          displayName,
        };
      });

    // Merge: static items first, then seasonal items
    return [...staticItems, ...seasonalItems];
  }, [ownedAvatars, locale]);

  const canSelectAvatar = (avatarId: string) => {
    // Per-season suffixed IDs: must be in ownedAvatars
    if (isSeasonSuffixedAvatar(avatarId)) {
      return ownedAvatars.includes(avatarId);
    }
    const avatar = AVATAR_OPTIONS.find(a => a.id === avatarId);
    if (!avatar) return false;
    // Season reward avatars (base IDs): unlocked via ownedAvatars
    if (avatar.seasonReward) return ownedAvatars.includes(avatarId);
    // Premium shop avatars: must be purchased
    if (avatar.premium) return ownedAvatars.includes(avatarId);
    return true;
  };

  const isLocked = (avatarId: string) => !canSelectAvatar(avatarId);

  const selectedBaseId = getBaseAvatarId(selected);
  const isSelectedAnimated = ['diving_eagle', 'sky_eagle', 'neon_paw', 'neon_dino', 'neon_cat', 'neon_crown', 'toxic_storm', 'gasmask_amber', 'nuclear_mushroom', 'amaterasu_ruby', 'samurai_amber', 'oni_mask_obsidian', 'ruby_kazakh', 'ruby_neon_era', 'ruby_apocalypse', 'ruby_japanese', 'amber_kazakh', 'amber_neon_era', 'amber_apocalypse', 'amber_japanese', 'obsidian_kazakh', 'obsidian_neon_era', 'obsidian_apocalypse', 'obsidian_japanese'].includes(selectedBaseId);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-[#1a2d45] border border-amber-700/40 rounded-2xl p-4 sm:p-6 max-w-md w-full space-y-4 max-h-[90dvh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-amber-100">{t('avatarPicker.title')}</h3>
          <button onClick={onClose} className="text-amber-200/50 hover:text-amber-200 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current avatar preview */}
        <div className="flex flex-col items-center gap-2">
          <div className="w-24 h-24 rounded-full overflow-hidden border-3 border-amber-500 shadow-lg shadow-amber-500/20">
            {isSelectedAnimated ? (
              <AnimatedAvatar baseId={selectedBaseId} size={96} />
            ) : (
              <img
                src={getAvatarUrl(selected)}
                alt="Selected avatar"
                className="w-full h-full object-cover"
              />
            )}
          </div>
          {/* Show name of selected avatar */}
          {(() => {
            const item = allAvatarItems.find(a => a.id === selected);
            if (!item) return null;
            return (
              <div className="text-amber-200/70 text-xs font-medium text-center">{item.displayName}</div>
            );
          })()}
        </div>

        {/* Avatar grid */}
        <div className="grid grid-cols-5 gap-2 sm:gap-3">
          {allAvatarItems.map((item) => {
            const locked = isLocked(item.id);
            const isSelected = selected === item.id;
            const isAnimated = item.isAnimated;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (!locked) setSelected(item.id);
                }}
                title={item.displayName}
                className={`relative rounded-xl overflow-hidden border-2 transition-all duration-200 aspect-square ${
                  locked
                    ? 'border-gray-600/50 opacity-60 cursor-not-allowed'
                    : isSelected
                      ? 'border-amber-500 shadow-lg shadow-amber-500/30 scale-105'
                      : 'border-amber-700/30 hover:border-amber-600/50 hover:scale-102'
                }`}
              >
                {isAnimated && item.previewUrl ? (
                  // For animated avatars with a static preview image, use the image in the grid
                  // (saves performance — full animation only shown in the large preview above)
                  <img
                    src={item.previewUrl}
                    alt={item.displayName}
                    className={`w-full h-full object-cover ${locked ? 'grayscale opacity-60' : ''}`}
                    loading="lazy"
                  />
                ) : isAnimated ? (
                  <div className={`w-full h-full ${locked ? 'grayscale opacity-60' : ''}`}>
                    <AnimatedAvatar baseId={item.baseId} size={60} />
                  </div>
                ) : (
                  <img
                    src={item.previewUrl ?? item.url}
                    alt={item.displayName}
                    className={`w-full h-full object-cover ${locked ? 'grayscale' : ''}`}
                    loading="lazy"
                  />
                )}

                {/* Selected checkmark */}
                {isSelected && !locked && (
                  <div className="absolute inset-0 bg-amber-500/20 flex items-center justify-center">
                    <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center">
                      <Check className="w-4 h-4 text-white" />
                    </div>
                  </div>
                )}

                {/* Lock overlay */}
                {locked && (
                  <div className="absolute inset-0 bg-black/50 flex flex-col items-center justify-center gap-0.5">
                    {item.isSeasonReward ? (
                      <Trophy className="w-3.5 h-3.5 text-amber-400" />
                    ) : (
                      <Lock className="w-4 h-4 text-gray-300" />
                    )}
                  </div>
                )}

                {/* PRO badge */}
                {item.isPremium && !locked && !item.isSeasonReward && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-cyan-500 to-purple-500 text-white text-[7px] font-bold px-1 py-0.5 rounded-bl-md">
                    PRO
                  </div>
                )}

                {/* Season reward badge (owned) */}
                {item.isSeasonReward && !locked && (
                  <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-yellow-400 text-white text-[7px] font-bold px-1 py-0.5 rounded-bl-md">
                    🏆
                  </div>
                )}

                {/* Seasonal label (small season number) */}
                {item.isSeasonal && !locked && (() => {
                  const sn = getSeasonNumberFromAvatarId(item.id);
                  if (!sn) return null;
                  return (
                    <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-amber-300 text-[7px] font-bold text-center py-0.5">
                      S{sn}
                    </div>
                  );
                })()}
              </button>
            );
          })}
        </div>

        {/* Season reward hint */}
        {ownedAvatars.filter(id => isSeasonSuffixedAvatar(id)).length === 0 &&
          AVATAR_OPTIONS.filter(a => a.seasonReward && !ownedAvatars.includes(a.id) && (!a.seasonNumber || a.seasonNumber <= getCurrentSeasonNumber())).length > 0 && (
          <p className="text-xs text-amber-400/70 text-center">
            🏆 {t('avatarPicker.seasonRewardHint')}
          </p>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            className="flex-1 bg-gray-700 hover:bg-gray-600 text-white text-sm"
            onClick={onClose}
          >
            {t('avatarPicker.cancel')}
          </Button>
          <Button
            className="flex-1 bg-amber-700 hover:bg-amber-600 text-white text-sm"
            onClick={() => onSelect(selected)}
            disabled={loading || selected === currentAvatarId || !canSelectAvatar(selected)}
          >
            {loading ? t('avatarPicker.saving') : t('avatarPicker.save')}
          </Button>
        </div>
      </div>
    </div>
  );
}
