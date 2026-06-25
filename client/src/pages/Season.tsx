import { useState, useMemo, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { DiamondRankIcon } from '@/components/DiamondRankIcon';
import { getBaseAvatarId, getSeasonAvatarId, getAvatarDisplayName, isCanvasAvatar, getAvatarAccentColors } from '../../../shared/avatars';
import { SEASON_RANKS, SEASON_REWARD_DEFS, getSeasonRewardDefForSeason, type SeasonTheme } from '../../../shared/seasons';
import { useTranslation } from '@/i18n';
import { X, Flame, Trophy, Clock, Gift, HelpCircle } from 'lucide-react';
import { GreatKhanFrame } from '@/components/GreatKhanFrame';
import { ObsidianNeonFrame } from '@/components/ObsidianNeonFrame';
import { RubyNeonFrame } from '@/components/RubyNeonFrame';
import { AmberNeonFrame } from '@/components/AmberNeonFrame';
import { ZirconNeonFrame } from '@/components/ZirconNeonFrame';
import { MoltenLavaFrame } from '@/components/MoltenLavaFrame';
import { OniJapaneseFrame } from '@/components/OniJapaneseFrame';
import { ObsidianUnderwaterFrame } from '@/components/ObsidianUnderwaterFrame';
import { ObsidianEgyptianFrame } from '@/components/ObsidianEgyptianFrame';
import { ObsidianPirateFrame } from '@/components/ObsidianPirateFrame';
import { ObsidianNorseFrame } from '@/components/ObsidianNorseFrame';
import { ObsidianSpaceFrame } from '@/components/ObsidianSpaceFrame';
import { ObsidianCyberpunkFrame } from '@/components/ObsidianCyberpunkFrame';
import { ObsidianHiphopFrame } from '@/components/ObsidianHiphopFrame';
import { ObsidianAngelsDemonsFrame } from '@/components/ObsidianAngelsDemonsFrame';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { useState as useLocalState } from 'react';
import { getAssetUrl } from '@/lib/assetUrl';

interface SeasonPageProps {
  open: boolean;
  onClose: () => void;
}

function formatTimeLeft(endDate: Date, locale?: string, t?: (key: string) => string): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  const days = Math.floor(Math.max(0, diff) / (1000 * 60 * 60 * 24));
  const hours = Math.floor((Math.max(0, diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (t) {
    if (diff <= 0) return t('season.timeLeftZero');
    return t('season.timeLeftFormat').replace('{d}', String(days)).replace('{h}', String(hours));
  }
  if (locale === 'en') return diff <= 0 ? '0d 0h' : `${days}d ${hours}h`;
  if (locale === 'kk') return diff <= 0 ? '0 күн 0 сағ' : `${days} күн ${hours} сағ`;
  return diff <= 0 ? '0д 0ч' : `${days}д ${hours}ч`;
}

function ProgressBar({ current, min, max, color }: { current: number; min: number; max: number; color: string }) {
  const pct = max === Infinity
    ? 100
    : Math.min(100, Math.max(0, ((current - min) / (max - min)) * 100));
  return (
    <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
      <div
        className="h-full rounded-full transition-all duration-500"
        style={{ width: `${pct}%`, background: color }}
      />
    </div>
  );
}

/** Reward popup for a single rank - uses per-season avatarId */
function RewardPopup({
  rankKey,
  seasonKey,
  seasonNumber,
  locale,
  onClose,
}: {
  rankKey: string;
  seasonKey?: string;
  seasonNumber?: number;
  locale: string;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const rank = SEASON_RANKS.find(r => r.key === rankKey);

  if (!rank) return null;

  // Use per-season reward def if seasonInfo is available
  const { data: seasonData } = trpc.season.current.useQuery(
    { seasonKey },
    { enabled: !!seasonKey }
  );
  const seasonInfo = seasonData?.seasonInfo;
  const reward = seasonInfo
    ? getSeasonRewardDefForSeason(rankKey, seasonInfo)
    : SEASON_REWARD_DEFS.find(r => r.rankKey === rankKey);

  if (!reward) return null;

  const rankName = locale === 'kk' ? rank.nameKk : locale === 'en' ? rank.nameEn : locale === 'uk' ? (rank as any).nameUk ?? rank.nameRu : locale === 'ka' ? (rank as any).nameKa ?? rank.nameRu : locale === 'az' ? (rank as any).nameAz ?? rank.nameRu : locale === 'uz' ? (rank as any).nameUz ?? rank.nameRu : locale === 'pl' ? (rank as any).namePl ?? rank.nameRu : rank.nameRu;

  // Build per-season avatar ID for display
  const seasonAvatarId = reward.avatarId && seasonKey
    ? getSeasonAvatarId(reward.avatarId, seasonKey)
    : reward.avatarId;
  const baseAvatarId = seasonAvatarId ? getBaseAvatarId(seasonAvatarId) : null;
  const avatarDisplayName = seasonAvatarId
    ? getAvatarDisplayName(seasonAvatarId, locale, seasonNumber)
    : null;

  const isAnimated = isCanvasAvatar(seasonAvatarId);

  // Avatar accent color
  const _ac = getAvatarAccentColors(seasonAvatarId);
  const avatarAccent = { bg: _ac.bgClass, border: _ac.borderClass, text: _ac.textClass, hover: _ac.hoverClass };

  return (
    <>

      <div className="fixed inset-0 z-[60] flex items-center justify-center">
        <div className="absolute inset-0 bg-black/60" onClick={onClose} />
        <div
          className="relative w-[min(340px,90vw)] rounded-2xl p-5 flex flex-col gap-4"
          style={{
            background: 'linear-gradient(160deg, #0d1b2a 0%, #0a1628 100%)',
            border: `1px solid ${rank.color}50`,
            boxShadow: `0 0 24px ${rank.color}20`,
          }}
        >
          {/* Close */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-amber-200/40 hover:text-amber-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Rank header */}
          <div className="flex items-center gap-3">
            <DiamondRankIcon seasonRating={rank.minRating} size={36} />
            <div>
              <div className="font-bold text-base" style={{ color: rank.color }}>{rankName}</div>
              <div className="text-amber-200/50 text-xs mt-0.5">
                {t('lobby.endOfSeasonReward')}
              </div>
            </div>
          </div>

          {/* Rewards list */}
          <div className="space-y-2">
            {/* Shanyraks */}
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: 'rgba(234,179,8,0.08)' }}>
              <img src={getAssetUrl("/assets/static/shanyrak_96e91a49.png")} alt="" className="w-6 h-6 object-contain" />
              <span className="text-amber-200 font-semibold text-sm">
                +{reward.shanyraks.toLocaleString()} {t('lobby.shanyraksUnit')}
              </span>
            </div>

            {/* Tenge */}
            {reward.tenge > 0 && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: 'rgba(139,92,246,0.10)' }}>
                <img src={getAssetUrl("/assets/static/tenge_9aefd1b7.png")} alt="" className="w-6 h-6 object-contain" />
                <span className="text-purple-300 font-semibold text-sm">
                  +{reward.tenge} {t('lobby.tengeUnit')}
                </span>
              </div>
            )}

            {/* Avatar - animated preview */}
            {seasonAvatarId && isAnimated && (
              <div
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5`}
                style={{ background: avatarAccent.bg }}
              >
                <PlayerAvatar avatarId={seasonAvatarId} size={48} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className={`${avatarAccent.text} font-semibold text-sm`}>
                    {t('lobby.avatarLabel')}: {avatarDisplayName}
                  </div>
                </div>
              </div>
            )}
            {/* Avatar - static (non-animated) preview */}
            {seasonAvatarId && !isAnimated && (
              <div
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5`}
                style={{ background: avatarAccent.bg }}
              >
                <PlayerAvatar avatarId={seasonAvatarId} size={48} className="flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <div className={`${avatarAccent.text} font-semibold text-sm`}>
                    {t('lobby.avatarLabel')}: {avatarDisplayName}
                  </div>

                </div>
              </div>
            )}

            {/* Frame - great_khan (legacy) */}
            {reward.frameId === 'great_khan' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(218,165,32,0.08)', border: '1px solid rgba(218,165,32,0.20)' }}
              >
                <div className="flex-shrink-0">
                  <GreatKhanFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-gradient-to-br from-yellow-900 to-amber-950 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-yellow-400">
                        <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" fill="rgba(218,165,32,0.3)" stroke="rgba(218,165,32,0.9)" />
                        <circle cx="12" cy="12" r="2" fill="rgba(255,215,0,0.8)" />
                      </svg>
                    </div>
                  </GreatKhanFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-yellow-300 font-semibold text-sm">
                    {t('lobby.frameLabel')}: {t('lobby.frameObsidian')}{seasonNumber ? ` - Season ${seasonNumber}` : ''}
                  </div>
                  <div className="text-amber-200/50 text-xs mt-0.5">
                    {t('lobby.frameExclusiveAnimated')}
                  </div>
                </div>
              </div>
            )}
            {/* Frame - ruby_neon (Crimson Flash, Season 7) */}
            {reward.frameId === 'ruby_neon' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(220,0,60,0.08)', border: '1px solid rgba(220,0,60,0.25)' }}
              >
                <div className="flex-shrink-0">
                  <RubyNeonFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-gradient-to-br from-red-900 to-rose-950 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-red-400">
                        <circle cx="12" cy="12" r="7" stroke="rgba(220,0,60,0.9)" />
                        <circle cx="12" cy="12" r="4" stroke="rgba(255,80,160,0.75)" strokeDasharray="3 2" />
                      </svg>
                    </div>
                  </RubyNeonFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'rgba(220,0,60,0.95)' }}>
                    {t('lobby.frameLabel')}: {t('lobby.frameRuby')}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,80,160,0.50)' }}>
                    {t('lobby.frameCrimsonFlash')}
                  </div>
                </div>
              </div>
            )}
            {/* Frame - amber_neon (Solar Flare, Season 7) */}
            {reward.frameId === 'amber_neon' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.25)' }}
              >
                <div className="flex-shrink-0">
                  <AmberNeonFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-gradient-to-br from-amber-900 to-orange-950 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-amber-400">
                        <circle cx="12" cy="12" r="7" stroke="rgba(245,158,11,0.9)" />
                        <circle cx="12" cy="12" r="4" stroke="rgba(251,146,60,0.8)" />
                      </svg>
                    </div>
                  </AmberNeonFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'rgba(245,158,11,0.95)' }}>
                    {t('lobby.frameLabel')}: {t('lobby.frameAmber')}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(251,146,60,0.50)' }}>
                    {t('lobby.frameSolarFlare')}
                  </div>
                </div>
              </div>
            )}
            {/* Frame - zircon_neon (Comet Trail, Season 7) */}
            {reward.frameId === 'zircon_neon' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(168,85,247,0.25)' }}
              >
                <div className="flex-shrink-0">
                  <ZirconNeonFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-gradient-to-br from-orange-900 to-purple-950 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-orange-400">
                        <circle cx="12" cy="12" r="7" stroke="rgba(249,115,22,0.9)" />
                        <circle cx="12" cy="12" r="4" stroke="rgba(168,85,247,0.85)" />
                      </svg>
                    </div>
                  </ZirconNeonFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'rgba(249,115,22,0.95)' }}>
                    {t('lobby.frameLabel')}: {t('lobby.frameZircon')}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(168,85,247,0.50)' }}>
                    {t('lobby.frameCometTrail')}
                  </div>
                </div>
              </div>
            )}
            {/* Frame - obsidian_neon (Dual Orbit, Season 7) */}
            {reward.frameId === 'obsidian_neon' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(0,80,255,0.08)', border: '1px solid rgba(0,212,255,0.25)' }}
              >
                <div className="flex-shrink-0">
                  <ObsidianNeonFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-gradient-to-br from-cyan-900 to-blue-950 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5 text-cyan-400">
                        <circle cx="12" cy="12" r="7" stroke="rgba(0,212,255,0.9)" />
                        <circle cx="12" cy="12" r="4" stroke="rgba(0,80,255,0.85)" />
                      </svg>
                    </div>
                  </ObsidianNeonFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'rgba(0,212,255,0.95)' }}>
                    {t('lobby.frameLabel')}: Obsidian - Season 7
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(0,180,255,0.50)' }}>
                    {t('lobby.frameDualOrbit')}
                  </div>
                </div>
              </div>
            )}
            {/* Frame - oni_japanese (Oni Mask, Season 9 Japanese Motifs) */}
            {reward.frameId === 'oni_japanese' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(180,0,0,0.08)', border: '1px solid rgba(200,30,0,0.35)' }}
              >
                <div className="flex-shrink-0">
                  <OniJapaneseFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-black flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5">
                        <circle cx="12" cy="12" r="8" fill="rgba(180,0,0,0.6)" />
                        <circle cx="9" cy="11" r="1.5" fill="rgba(255,80,0,0.9)" />
                        <circle cx="15" cy="11" r="1.5" fill="rgba(255,80,0,0.9)" />
                      </svg>
                    </div>
                  </OniJapaneseFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'rgba(220,50,0,0.95)' }}>
                    {t('lobby.frameLabel')}: {t('lobby.frameObsidian')} - Season {seasonNumber ?? 9}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(200,80,0,0.50)' }}>
                    {t('lobby.frameJapaneseOni')}
                  </div>
                </div>
              </div>
            )}
            {/* Frame - molten_lava (Molten Obsidian, Season 8 Apocalypse) */}
            {reward.frameId === 'molten_lava' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(200,40,0,0.08)', border: '1px solid rgba(255,80,0,0.30)' }}
              >
                <div className="flex-shrink-0">
                  <MoltenLavaFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden bg-gradient-to-br from-red-950 to-orange-950 flex items-center justify-center">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5 text-orange-500">
                        <circle cx="12" cy="12" r="7" stroke="rgba(30,10,5,0.9)" fill="rgba(10,5,5,0.8)" />
                        <path d="M7 10 Q9 8 11 11 Q13 14 15 10 Q17 7 19 9" stroke="rgba(255,100,10,0.9)" strokeWidth="1.5" fill="none" />
                      </svg>
                    </div>
                  </MoltenLavaFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'rgba(255,100,10,0.95)' }}>
                    {t('lobby.frameLabel')}: {t('lobby.frameObsidian')} - Season {seasonNumber ?? 8}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,80,0,0.50)' }}>
                    {t('lobby.frameMoltenLava')}
                  </div>
                </div>
              </div>
            )}

            {/* Frame - obsidian_underwater */}
            {reward.frameId === 'obsidian_underwater' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(0,200,180,0.08)', border: '1px solid rgba(0,200,180,0.30)' }}
              >
                <div className="flex-shrink-0">
                  <ObsidianUnderwaterFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="12" r="8" fill="rgba(0,30,40,0.9)" stroke="rgba(0,200,180,0.8)" strokeWidth="1.5"/><path d="M6 12 Q9 8 12 12 Q15 16 18 12" stroke="rgba(0,255,220,0.9)" strokeWidth="1.2" fill="none"/></svg>
                    </div>
                  </ObsidianUnderwaterFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'rgba(0,200,180,0.95)' }}>
                    {t('lobby.frameLabel')}: {t('lobby.frameObsidian')} - Season 1
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(0,200,180,0.50)' }}>
                    {t('lobby.frameOceanAbyss')}
                  </div>
                </div>
              </div>
            )}
            {/* Frame - obsidian_egyptian */}
            {reward.frameId === 'obsidian_egyptian' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(200,160,0,0.08)', border: '1px solid rgba(200,160,0,0.30)' }}
              >
                <div className="flex-shrink-0">
                  <ObsidianEgyptianFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="12" r="8" fill="rgba(20,10,0,0.9)" stroke="rgba(200,160,0,0.8)" strokeWidth="1.5"/><ellipse cx="12" cy="10" rx="4" ry="2.5" fill="none" stroke="rgba(255,200,0,0.85)" strokeWidth="1"/><circle cx="12" cy="10" r="1.2" fill="rgba(255,180,0,0.95)"/></svg>
                    </div>
                  </ObsidianEgyptianFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'rgba(200,160,0,0.95)' }}>
                    {t('lobby.frameLabel')}: {t('lobby.frameObsidian')} - Season 2
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(200,160,0,0.50)' }}>
                    {t('lobby.frameEgyptianMagic')}
                  </div>
                </div>
              </div>
            )}
            {/* Frame - obsidian_pirate */}
            {reward.frameId === 'obsidian_pirate' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(100,150,255,0.08)', border: '1px solid rgba(100,150,255,0.30)' }}
              >
                <div className="flex-shrink-0">
                  <ObsidianPirateFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="12" r="8" fill="rgba(0,5,20,0.9)" stroke="rgba(100,150,255,0.8)" strokeWidth="1.5"/><circle cx="12" cy="10" r="3" fill="none" stroke="rgba(180,220,255,0.85)" strokeWidth="1"/><circle cx="10" cy="9.5" r="0.8" fill="rgba(180,220,255,0.9)"/><circle cx="14" cy="9.5" r="0.8" fill="rgba(180,220,255,0.9)"/></svg>
                    </div>
                  </ObsidianPirateFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'rgba(100,150,255,0.95)' }}>
                    {t('lobby.frameLabel')}: {t('lobby.frameObsidian')} - Season 3
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(100,150,255,0.50)' }}>
                    {t('lobby.framePirateStorm')}
                  </div>
                </div>
              </div>
            )}
            {/* Frame - obsidian_norse */}
            {reward.frameId === 'obsidian_norse' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(140,60,220,0.08)', border: '1px solid rgba(140,60,220,0.30)' }}
              >
                <div className="flex-shrink-0">
                  <ObsidianNorseFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="12" r="8" fill="rgba(10,0,20,0.9)" stroke="rgba(140,60,220,0.8)" strokeWidth="1.5"/><rect x="9" y="5" width="6" height="5" rx="1" fill="rgba(180,100,255,0.85)"/><rect x="11" y="10" width="2" height="7" rx="0.5" fill="rgba(140,80,220,0.8)"/></svg>
                    </div>
                  </ObsidianNorseFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'rgba(140,60,220,0.95)' }}>
                    {t('lobby.frameLabel')}: {t('lobby.frameObsidian')} - Season 4
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(140,60,220,0.50)' }}>
                    {t('lobby.frameNorseRunes')}
                  </div>
                </div>
              </div>
            )}
            {/* Frame - obsidian_space */}
            {reward.frameId === 'obsidian_space' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(100,0,200,0.08)', border: '1px solid rgba(100,0,200,0.30)' }}
              >
                <div className="flex-shrink-0">
                  <ObsidianSpaceFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="12" r="8" fill="rgba(5,0,15,0.9)" stroke="rgba(100,0,200,0.8)" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" fill="rgba(60,0,120,0.9)" stroke="rgba(200,100,255,0.8)" strokeWidth="0.8"/></svg>
                    </div>
                  </ObsidianSpaceFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'rgba(100,0,200,0.95)' }}>
                    {t('lobby.frameLabel')}: {t('lobby.frameObsidian')} - Season 5
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(100,0,200,0.50)' }}>
                    {t('lobby.frameSpaceGalaxy')}
                  </div>
                </div>
              </div>
            )}
            {/* Frame - obsidian_cyberpunk */}
            {reward.frameId === 'obsidian_cyberpunk' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(0,255,180,0.08)', border: '1px solid rgba(0,255,180,0.30)' }}
              >
                <div className="flex-shrink-0">
                  <ObsidianCyberpunkFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="12" r="8" fill="rgba(0,10,8,0.9)" stroke="rgba(0,255,180,0.8)" strokeWidth="1.5"/><rect x="8" y="8" width="8" height="8" rx="1" fill="none" stroke="rgba(0,255,180,0.7)" strokeWidth="0.8"/><rect x="10" y="10" width="4" height="4" rx="0.5" fill="rgba(255,0,180,0.6)" stroke="rgba(255,0,180,0.8)" strokeWidth="0.5"/></svg>
                    </div>
                  </ObsidianCyberpunkFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'rgba(0,255,180,0.95)' }}>
                    {t('lobby.frameLabel')}: {t('lobby.frameObsidian')} - Season 10
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(0,255,180,0.50)' }}>
                    {t('lobby.frameCyberpunkVoid')}
                  </div>
                </div>
              </div>
            )}
            {/* Frame - obsidian_hiphop */}
            {reward.frameId === 'obsidian_hiphop' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(200,150,0,0.08)', border: '1px solid rgba(200,150,0,0.30)' }}
              >
                <div className="flex-shrink-0">
                  <ObsidianHiphopFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="12" r="8" fill="rgba(10,5,0,0.9)" stroke="rgba(200,150,0,0.8)" strokeWidth="1.5"/><circle cx="12" cy="12" r="4" fill="none" stroke="rgba(255,200,0,0.7)" strokeWidth="0.8" strokeDasharray="2 1"/><circle cx="12" cy="12" r="1.5" fill="rgba(255,220,0,0.9)"/></svg>
                    </div>
                  </ObsidianHiphopFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'rgba(200,150,0,0.95)' }}>
                    {t('lobby.frameLabel')}: {t('lobby.frameObsidian')} - Season 11
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(200,150,0,0.50)' }}>
                    {t('lobby.frameHiphopGold')}
                  </div>
                </div>
              </div>
            )}
            {/* Frame - obsidian_angels_demons */}
            {reward.frameId === 'obsidian_angels_demons' && (
              <div
                className="flex items-center gap-3 rounded-lg px-3 py-2.5"
                style={{ background: 'rgba(180,120,255,0.08)', border: '1px solid rgba(180,120,255,0.30)' }}
              >
                <div className="flex-shrink-0">
                  <ObsidianAngelsDemonsFrame size={40} active={true}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                      <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5"><circle cx="12" cy="12" r="8" fill="rgba(10,0,15,0.9)" stroke="rgba(180,120,255,0.8)" strokeWidth="1.5"/><path d="M12 4 Q8 7 6 12" stroke="rgba(255,220,100,0.8)" strokeWidth="1" fill="none"/><path d="M12 4 Q16 7 18 12" stroke="rgba(220,0,60,0.8)" strokeWidth="1" fill="none"/></svg>
                    </div>
                  </ObsidianAngelsDemonsFrame>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm" style={{ color: 'rgba(180,120,255,0.95)' }}>
                    {t('lobby.frameLabel')}: {t('lobby.frameObsidian')} - Season 12
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(180,120,255,0.50)' }}>
                    {t('lobby.frameAngelsDuality')}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

export default function SeasonPage({ open, onClose }: SeasonPageProps) {
  const { user } = useAuth();
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<'info' | 'leaderboard' | 'ranks'>('info');
  const [rewardPopupKey, setRewardPopupKey] = useState<string | null>(null);
  const [showRulesDialog, setShowRulesDialog] = useState(false);

  // Support admin test season: read from DB (season_test_state) - works across page reloads and devices
  const { data: testStateData } = trpc.season.activeTestKey.useQuery(undefined, {
    refetchInterval: open ? 5000 : false, // poll every 5s while open
    enabled: open,
  });
  // Also support URL param override for direct linking
  const urlTestKey = typeof window !== 'undefined'
    ? (new URLSearchParams(window.location.search).get('testSeason') ?? undefined)
    : undefined;
  const testSeasonKey: string | undefined = urlTestKey ?? (testStateData?.testSeasonKey ?? undefined);

  const { data: seasonData } = trpc.season.current.useQuery(
    { seasonKey: testSeasonKey },
    {
      enabled: !!user && open,
      refetchInterval: 60000,
    }
  );

  const { data: leaderboardData } = trpc.season.leaderboard.useQuery(
    { seasonKey: testSeasonKey },
    { enabled: open && activeTab === 'leaderboard', refetchInterval: 30000 }
  );

  const endDate = seasonData?.endDate ? new Date(seasonData.endDate) : null;
  const startDate = seasonData?.startDate ? new Date(seasonData.startDate) : null;
  const timeLeft = endDate ? formatTimeLeft(endDate, locale, t) : '-';

  const seasonInfo = seasonData?.seasonInfo;
  const seasonName = seasonInfo
    ? (locale === 'kk' ? seasonInfo.nameKk : locale === 'en' ? seasonInfo.nameEn : locale === 'uk' ? (seasonInfo as any).nameUk ?? seasonInfo.nameRu : locale === 'ka' ? (seasonInfo as any).nameKa ?? seasonInfo.nameRu : locale === 'az' ? (seasonInfo as any).nameAz ?? seasonInfo.nameRu : locale === 'uz' ? (seasonInfo as any).nameUz ?? seasonInfo.nameRu : locale === 'pl' ? (seasonInfo as any).namePl ?? seasonInfo.nameRu : seasonInfo.nameRu)
    : '-';
  const seasonNumber = seasonInfo?.seasonNumber ?? null;
  const theme: SeasonTheme = seasonInfo?.theme ?? {
    accent: '#f59e0b',
    accentSecondary: '#d97706',
    bgFrom: '#0d1b2a',
    bgTo: '#0a1628',
    border: 'rgba(251,191,36,0.2)',
    tabActive: '#f59e0b',
    iconClass: 'text-amber-400',
    emoji: '🎴',
  };

  const currentRank = seasonData?.rank;
  const nextRank = currentRank
    ? SEASON_RANKS.find(r => r.minRating > (seasonData?.seasonRating ?? 0))
    : null;

  // Active season key (test or real)
  const activeSeasonKey = testSeasonKey ?? seasonData?.seasonKey;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Panel - full screen on mobile, modal on sm+ */}
        <div className="relative w-full sm:max-w-lg h-[100dvh] sm:h-auto sm:max-h-[92dvh] flex flex-col sm:rounded-2xl overflow-hidden"
          style={{ background: `linear-gradient(160deg, ${theme.bgFrom} 0%, ${theme.bgTo} 50%, ${theme.bgFrom} 100%)`, border: `1px solid ${theme.border}` }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{theme.emoji}</span>
              <span className="font-bold text-white text-lg">
                {t('season.seasonLabel')}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setShowRulesDialog(true)}
                className="text-white/50 hover:text-white transition-colors p-1"
                title={t('season.rulesButton')}
              >
                <HelpCircle className="w-5 h-5" />
              </button>
              <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Season name + timer */}
          <div className="px-5 py-4 text-center" style={{ borderBottom: `1px solid ${theme.border}40` }}>
            {seasonNumber && (
              <div className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: `${theme.accent}80` }}>
                Season {seasonNumber}
              </div>
            )}
            <div className="font-bold text-xl mb-1" style={{ color: theme.accent }}>{seasonName}</div>
            <div className="flex items-center justify-center gap-2 text-sm" style={{ color: `${theme.accent}80` }}>
              <Clock className="w-4 h-4" />
              <span>
                {t('season.endsIn')} {timeLeft}
              </span>
            </div>
            {/* Premium note */}
            <div className="mt-2 text-xs italic" style={{ color: `${theme.accent}50` }}>
            {t('season.premiumNote')}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex" style={{ borderBottom: `1px solid ${theme.border}` }}>
            {(['info', 'leaderboard', 'ranks'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className="flex-1 py-2.5 text-sm font-medium transition-colors"
                style={activeTab === tab
                  ? { color: theme.tabActive, borderBottom: `2px solid ${theme.tabActive}` }
                  : { color: 'rgba(255,255,255,0.4)' }
                }
              >
                {tab === 'info'
                  ? t('season.myRating')
                  : tab === 'leaderboard'
                    ? t('season.topPlayers')
                    : t('season.ranksTab')}
              </button>
            ))}
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* ── MY RATING TAB ── */}
            {activeTab === 'info' && (
              <div className="p-5 space-y-5">
                {/* Current rank card */}
                {currentRank && (
                  <div className="rounded-xl p-4 flex items-center gap-4"
                    style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${currentRank.color}40` }}>
                    <div className="flex-shrink-0">
                      <DiamondRankIcon seasonRating={seasonData?.seasonRating ?? 0} size={48} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs text-amber-200/50 mb-0.5">
                        {t('season.currentRank')}
                      </div>
                      <div className="font-bold text-lg" style={{ color: currentRank.color }}>
                        {locale === 'kk' ? currentRank.nameKk : locale === 'en' ? currentRank.nameEn : locale === 'uk' ? (currentRank as any).nameUk ?? currentRank.nameRu : locale === 'ka' ? (currentRank as any).nameKa ?? currentRank.nameRu : locale === 'az' ? (currentRank as any).nameAz ?? currentRank.nameRu : locale === 'uz' ? (currentRank as any).nameUz ?? currentRank.nameRu : locale === 'pl' ? (currentRank as any).namePl ?? currentRank.nameRu : currentRank.nameRu}
                      </div>
                      <div className="text-amber-100 font-mono text-sm mt-0.5">
                        {seasonData?.seasonRating ?? 0} {t('season.ptsAbbr')}
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress to next rank */}
                {nextRank && currentRank && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-amber-200/60">
                      <span style={{ color: currentRank.color }}>{locale === 'kk' ? currentRank.nameKk : locale === 'en' ? currentRank.nameEn : locale === 'uk' ? (currentRank as any).nameUk ?? currentRank.nameRu : locale === 'ka' ? (currentRank as any).nameKa ?? currentRank.nameRu : locale === 'az' ? (currentRank as any).nameAz ?? currentRank.nameRu : locale === 'uz' ? (currentRank as any).nameUz ?? currentRank.nameRu : locale === 'pl' ? (currentRank as any).namePl ?? currentRank.nameRu : currentRank.nameRu}</span>
                      <span style={{ color: nextRank.color }}>{locale === 'kk' ? nextRank.nameKk : locale === 'en' ? nextRank.nameEn : locale === 'uk' ? (nextRank as any).nameUk ?? nextRank.nameRu : locale === 'ka' ? (nextRank as any).nameKa ?? nextRank.nameRu : locale === 'az' ? (nextRank as any).nameAz ?? nextRank.nameRu : locale === 'uz' ? (nextRank as any).nameUz ?? nextRank.nameRu : locale === 'pl' ? (nextRank as any).namePl ?? nextRank.nameRu : nextRank.nameRu}</span>
                    </div>
                    <ProgressBar
                      current={seasonData?.seasonRating ?? 0}
                      min={currentRank.minRating}
                      max={nextRank.minRating}
                      color={nextRank.color}
                    />
                    <div className="text-center text-xs text-amber-200/40">
                      {nextRank.minRating - (seasonData?.seasonRating ?? 0)} {t('season.ptsToNextRank')}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: t('season.gamesLabel'), value: seasonData?.gamesPlayed ?? 0 },
                    { label: t('season.winsLabel'), value: seasonData?.wins ?? 0 },
                    { label: t('season.lossesLabel'), value: seasonData?.losses ?? 0 },
                  ].map(stat => (
                    <div key={stat.label} className="rounded-lg p-3 text-center" style={{ background: 'rgba(255,255,255,0.04)' }}>
                      <div className="text-amber-100 font-bold text-xl">{stat.value}</div>
                      <div className="text-amber-200/50 text-xs mt-0.5">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* Season end reward preview - uses per-season avatarId */}
                <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)' }}>
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                    <Trophy className="w-4 h-4" />
                    <span>{t('season.endOfSeasonRewardPreview')}</span>
                  </div>
                  {currentRank && (() => {
                    // Use per-season reward def
                    const rewardDef = seasonInfo
                      ? getSeasonRewardDefForSeason(currentRank.key, seasonInfo)
                      : SEASON_REWARD_DEFS.find(r => r.rankKey === currentRank.key);
                    if (!rewardDef) return null;

                    // Build per-season avatar ID
                    const seasonAvatarId = rewardDef.avatarId && activeSeasonKey
                      ? getSeasonAvatarId(rewardDef.avatarId, activeSeasonKey)
                      : rewardDef.avatarId;
                    const baseAvatarId = seasonAvatarId ? getBaseAvatarId(seasonAvatarId) : null;
                    const avatarDisplayName = seasonAvatarId
                      ? getAvatarDisplayName(seasonAvatarId, locale, seasonNumber ?? undefined)
                      : null;

                    const isAnimated = isCanvasAvatar(seasonAvatarId);

                    return (
                      <div className="text-amber-100 text-sm space-y-1.5">
                        {/* Shanyraks */}
                        <div className="flex items-center gap-2">
                          <img src={getAssetUrl("/assets/static/shanyrak_96e91a49.png")} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                          <span>+{rewardDef.shanyraks.toLocaleString()} {t('lobby.shanyraksUnit')}</span>
                        </div>
                        {/* Tenge */}
                        {rewardDef.tenge > 0 && (
                          <div className="flex items-center gap-2">
                            <img src={getAssetUrl("/assets/static/tenge_9aefd1b7.png")} alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                            <span>+{rewardDef.tenge} {t('lobby.tengeUnit')}</span>
                          </div>
                        )}
                        {/* Avatar - per-season */}
                        {seasonAvatarId && (() => {
                          return (
                            <div
                              className={`flex items-center gap-2 ${isAnimated ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                              onClick={isAnimated ? () => setRewardPopupKey(currentRank.key) : undefined}
                            >
                              <div className="flex-shrink-0">
                                {seasonAvatarId ? <PlayerAvatar avatarId={seasonAvatarId} size={32} /> : <div className="w-8 h-8 flex items-center justify-center text-lg">🖼</div>}
                              </div>
                              <span>
                                {t('lobby.avatarLabel')}: <span className="text-amber-300 font-medium">{avatarDisplayName}</span>
                              </span>

                            </div>
                          );
                        })()}
                        {/* Frame reward - great_khan (legacy) */}
                        {rewardDef.frameId === 'great_khan' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <GreatKhanFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden bg-gradient-to-br from-yellow-900 to-amber-950 flex items-center justify-center">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-yellow-400">
                                    <polygon points="12,2 15,9 22,9 16.5,14 18.5,21 12,17 5.5,21 7.5,14 2,9 9,9" fill="rgba(218,165,32,0.3)" stroke="rgba(218,165,32,0.9)" />
                                  </svg>
                                </div>
                              </GreatKhanFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span className="text-yellow-300 font-medium">{t('lobby.frameObsidian')}{seasonNumber ? ` - Season ${seasonNumber}` : ''}</span>
                            </span>
                          </div>
                        )}
                        {/* Frame reward - ruby_neon (Crimson Flash, Season 7) */}
                        {rewardDef.frameId === 'ruby_neon' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <RubyNeonFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden bg-gradient-to-br from-red-900 to-rose-950 flex items-center justify-center">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-red-400">
                                    <circle cx="12" cy="12" r="7" stroke="rgba(220,0,60,0.9)" />
                                  </svg>
                                </div>
                              </RubyNeonFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span style={{ color: 'rgba(220,0,60,0.95)' }} className="font-medium">{t('lobby.frameRuby')}</span>
                            </span>
                          </div>
                        )}
                        {/* Frame reward - amber_neon (Solar Flare, Season 7) */}
                        {rewardDef.frameId === 'amber_neon' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <AmberNeonFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden bg-gradient-to-br from-amber-900 to-orange-950 flex items-center justify-center">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-amber-400">
                                    <circle cx="12" cy="12" r="7" stroke="rgba(245,158,11,0.9)" />
                                  </svg>
                                </div>
                              </AmberNeonFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span style={{ color: 'rgba(245,158,11,0.95)' }} className="font-medium">{t('lobby.frameAmber')}</span>
                            </span>
                          </div>
                        )}
                        {/* Frame reward - zircon_neon (Comet Trail, Season 7) */}
                        {rewardDef.frameId === 'zircon_neon' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <ZirconNeonFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden bg-gradient-to-br from-orange-900 to-purple-950 flex items-center justify-center">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-orange-400">
                                    <circle cx="12" cy="12" r="7" stroke="rgba(249,115,22,0.9)" />
                                  </svg>
                                </div>
                              </ZirconNeonFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span style={{ color: 'rgba(249,115,22,0.95)' }} className="font-medium">{t('lobby.frameZircon')}</span>
                            </span>
                          </div>
                        )}
                        {/* Frame reward - obsidian_neon (Dual Orbit, Season 7) */}
                        {rewardDef.frameId === 'obsidian_neon' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <ObsidianNeonFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden bg-gradient-to-br from-cyan-900 to-blue-950 flex items-center justify-center">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5 text-cyan-400">
                                    <circle cx="12" cy="12" r="7" stroke="rgba(0,212,255,0.9)" />
                                    <circle cx="12" cy="12" r="4" stroke="rgba(0,80,255,0.85)" />
                                  </svg>
                                </div>
                              </ObsidianNeonFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span style={{ color: 'rgba(0,212,255,0.95)' }} className="font-medium">{t('lobby.frameObsidian')} - Season 7</span>
                            </span>
                          </div>
                        )}
                        {/* Frame reward - oni_japanese (Oni Mask, Season 9 Japanese Motifs) */}
                        {rewardDef.frameId === 'oni_japanese' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <OniJapaneseFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden bg-black flex items-center justify-center">
                                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5">
                                    <circle cx="12" cy="12" r="8" fill="rgba(180,0,0,0.6)" />
                                    <circle cx="9" cy="11" r="1.5" fill="rgba(255,80,0,0.9)" />
                                    <circle cx="15" cy="11" r="1.5" fill="rgba(255,80,0,0.9)" />
                                  </svg>
                                </div>
                              </OniJapaneseFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span style={{ color: 'rgba(220,50,0,0.95)' }} className="font-medium">{t('lobby.frameObsidian')} - Season {seasonNumber ?? 9}</span>
                            </span>
                          </div>
                        )}
                        {/* Frame reward - molten_lava (Molten Obsidian, Season 8 Apocalypse) */}
                        {rewardDef.frameId === 'molten_lava' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <MoltenLavaFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden bg-gradient-to-br from-red-950 to-orange-950 flex items-center justify-center">
                                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-3.5 h-3.5 text-orange-500">
                                    <circle cx="12" cy="12" r="7" stroke="rgba(30,10,5,0.9)" fill="rgba(10,5,5,0.8)" />
                                    <path d="M7 10 Q9 8 11 11 Q13 14 15 10 Q17 7 19 9" stroke="rgba(255,100,10,0.9)" strokeWidth="1.5" fill="none" />
                                  </svg>
                                </div>
                              </MoltenLavaFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span style={{ color: 'rgba(255,100,10,0.95)' }} className="font-medium">{t('lobby.frameObsidian')} - Season {seasonNumber ?? 8}</span>
                            </span>
                          </div>
                        )}

                        {/* Frame reward - obsidian_underwater */}
                        {rewardDef.frameId === 'obsidian_underwater' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <ObsidianUnderwaterFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="8" fill="rgba(0,200,180,0.3)" stroke="rgba(0,200,180,0.8)" strokeWidth="1.5"/></svg>
                                </div>
                              </ObsidianUnderwaterFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span style={{ color: 'rgba(0,200,180,0.95)' }} className="font-medium">{t('lobby.frameObsidian')} - Season 1</span>
                            </span>
                          </div>
                        )}
                        {/* Frame reward - obsidian_egyptian */}
                        {rewardDef.frameId === 'obsidian_egyptian' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <ObsidianEgyptianFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="8" fill="rgba(200,160,0,0.3)" stroke="rgba(200,160,0,0.8)" strokeWidth="1.5"/></svg>
                                </div>
                              </ObsidianEgyptianFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span style={{ color: 'rgba(200,160,0,0.95)' }} className="font-medium">{t('lobby.frameObsidian')} - Season 2</span>
                            </span>
                          </div>
                        )}
                        {/* Frame reward - obsidian_pirate */}
                        {rewardDef.frameId === 'obsidian_pirate' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <ObsidianPirateFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="8" fill="rgba(100,150,255,0.3)" stroke="rgba(100,150,255,0.8)" strokeWidth="1.5"/></svg>
                                </div>
                              </ObsidianPirateFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span style={{ color: 'rgba(100,150,255,0.95)' }} className="font-medium">{t('lobby.frameObsidian')} - Season 3</span>
                            </span>
                          </div>
                        )}
                        {/* Frame reward - obsidian_norse */}
                        {rewardDef.frameId === 'obsidian_norse' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <ObsidianNorseFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="8" fill="rgba(140,60,220,0.3)" stroke="rgba(140,60,220,0.8)" strokeWidth="1.5"/></svg>
                                </div>
                              </ObsidianNorseFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span style={{ color: 'rgba(140,60,220,0.95)' }} className="font-medium">{t('lobby.frameObsidian')} - Season 4</span>
                            </span>
                          </div>
                        )}
                        {/* Frame reward - obsidian_space */}
                        {rewardDef.frameId === 'obsidian_space' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <ObsidianSpaceFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="8" fill="rgba(100,0,200,0.3)" stroke="rgba(100,0,200,0.8)" strokeWidth="1.5"/></svg>
                                </div>
                              </ObsidianSpaceFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span style={{ color: 'rgba(100,0,200,0.95)' }} className="font-medium">{t('lobby.frameObsidian')} - Season 5</span>
                            </span>
                          </div>
                        )}
                        {/* Frame reward - obsidian_cyberpunk */}
                        {rewardDef.frameId === 'obsidian_cyberpunk' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <ObsidianCyberpunkFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="8" fill="rgba(0,255,180,0.3)" stroke="rgba(0,255,180,0.8)" strokeWidth="1.5"/></svg>
                                </div>
                              </ObsidianCyberpunkFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span style={{ color: 'rgba(0,255,180,0.95)' }} className="font-medium">{t('lobby.frameObsidian')} - Season 10</span>
                            </span>
                          </div>
                        )}
                        {/* Frame reward - obsidian_hiphop */}
                        {rewardDef.frameId === 'obsidian_hiphop' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <ObsidianHiphopFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="8" fill="rgba(200,150,0,0.3)" stroke="rgba(200,150,0,0.8)" strokeWidth="1.5"/></svg>
                                </div>
                              </ObsidianHiphopFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span style={{ color: 'rgba(200,150,0,0.95)' }} className="font-medium">{t('lobby.frameObsidian')} - Season 11</span>
                            </span>
                          </div>
                        )}
                        {/* Frame reward - obsidian_angels_demons */}
                        {rewardDef.frameId === 'obsidian_angels_demons' && (
                          <div className="flex items-center gap-2">
                            <div className="flex-shrink-0">
                              <ObsidianAngelsDemonsFrame size={28} active={true}>
                                <div className="w-[28px] h-[28px] rounded-full overflow-hidden flex items-center justify-center" style={{ background: 'rgba(5,5,15,0.9)' }}>
                                  <svg viewBox="0 0 24 24" fill="none" className="w-3.5 h-3.5"><circle cx="12" cy="12" r="8" fill="rgba(180,120,255,0.3)" stroke="rgba(180,120,255,0.8)" strokeWidth="1.5"/></svg>
                                </div>
                              </ObsidianAngelsDemonsFrame>
                            </div>
                            <span>
                              {t('lobby.frameLabel')}: <span style={{ color: 'rgba(180,120,255,0.95)' }} className="font-medium">{t('lobby.frameObsidian')} - Season 12</span>
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              </div>
            )}

            {/* ── LEADERBOARD TAB ── */}
            {activeTab === 'leaderboard' && (
              <div className="p-3">
                {!leaderboardData ? (
                  <div className="text-center text-amber-200/40 py-10">
                    {t('common.loading')}
                  </div>
                ) : leaderboardData.entries.length === 0 ? (
                  <div className="text-center text-amber-200/40 py-10">
                    {t('season.noPlayersYet')}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {leaderboardData.entries.map((entry: (typeof leaderboardData.entries)[number], idx: number) => {
                      const rank = idx + 1;
                      const isTop3 = rank <= 3;
                      const entryRank = SEASON_RANKS.slice().reverse().find(r => entry.seasonRating >= r.minRating) ?? SEASON_RANKS[0];
                      return (
                        <div
                          key={entry.profileId}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-lg"
                          style={{
                            background: isTop3 ? 'rgba(234,179,8,0.08)' : 'rgba(255,255,255,0.03)',
                            border: isTop3 ? '1px solid rgba(234,179,8,0.3)' : '1px solid transparent',
                          }}
                        >
                          <div className="w-6 text-center font-bold text-sm flex-shrink-0"
                            style={{ color: rank === 1 ? '#fbbf24' : rank === 2 ? '#9ca3af' : rank === 3 ? '#cd7f32' : '#6b7280' }}>
                            {rank}
                          </div>

                          {/* Avatar */}
                          <PlayerAvatar
                            avatarId={entry.avatarId ?? 'wolf'}
                            size={32}
                            className="flex-shrink-0"
                          />

                          {/* Name + diamond */}
                          <div className="flex-1 min-w-0 flex items-center gap-1.5">
                            <DiamondRankIcon seasonRating={entry.seasonRating} size={12} />
                            <span className="text-amber-100 text-sm font-medium truncate">
                              {entry.displayName ?? `#${entry.gameId}`}
                            </span>
                          </div>

                          {/* Season rating */}
                          <div className="text-right flex-shrink-0">
                            <div className="font-bold text-sm" style={{ color: entryRank.color }}>
                              {entry.seasonRating}
                            </div>
                            <div className="text-amber-200/40 text-xs">
                              {t('season.ptsAbbr')}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* ── RANKS TAB ── */}
            {activeTab === 'ranks' && (
              <div className="p-4 space-y-2">
                {SEASON_RANKS.map(rank => {
                  const isCurrent = currentRank?.key === rank.key;
                  const ratingRange = rank.maxRating === Infinity
                    ? `${rank.minRating}+`
                    : `${rank.minRating} – ${rank.maxRating}`;

                  return (
                    <div
                      key={rank.key}
                      className="px-3 py-3 rounded-xl"
                      style={{
                        background: isCurrent ? `${rank.color}18` : 'rgba(255,255,255,0.03)',
                        border: isCurrent ? `1px solid ${rank.color}60` : '1px solid rgba(255,255,255,0.06)',
                      }}
                    >
                      {/* Row: icon + name block + reward button */}
                      <div className="flex items-center gap-3">
                        <DiamondRankIcon seasonRating={rank.minRating} size={28} />

                        {/* Name + "Ваш ранг" below */}
                        <div className="flex-1 min-w-0">
                          <div className="font-semibold text-sm" style={{ color: rank.color }}>
                            {locale === 'kk' ? rank.nameKk : locale === 'en' ? rank.nameEn : locale === 'uk' ? (rank as any).nameUk ?? rank.nameRu : locale === 'ka' ? (rank as any).nameKa ?? rank.nameRu : locale === 'az' ? (rank as any).nameAz ?? rank.nameRu : locale === 'uz' ? (rank as any).nameUz ?? rank.nameRu : locale === 'pl' ? (rank as any).namePl ?? rank.nameRu : rank.nameRu}
                          </div>
                          {isCurrent ? (
                            <div className="text-[10px] text-amber-300 mt-0.5 font-medium">
                              ★ {t('season.yourRankLabel')}
                            </div>
                          ) : (
                            <div className="text-amber-200/40 text-xs mt-0.5">
                              {ratingRange} {t('season.ptsAbbr')}
                            </div>
                          )}
                          {isCurrent && (
                            <div className="text-amber-200/40 text-xs mt-0.5">
                              {ratingRange} {t('season.ptsAbbr')}
                            </div>
                          )}
                        </div>

                        {/* Reward button */}
                        <button
                          onClick={() => setRewardPopupKey(rank.key)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all shrink-0"
                          style={{
                            background: `${rank.color}18`,
                            border: `1px solid ${rank.color}40`,
                            color: rank.color === '#111827' ? '#fbbf24' : rank.color,
                          }}
                        >
                          <Gift className="w-3 h-3" />
                          {t('season.rewardLabel')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>{/* end scrollable content */}

          {/* Close button at bottom - always visible */}
          <div className="shrink-0 px-5 pt-4 border-t border-amber-700/20" style={{ paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))' }}>
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all active:scale-95"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}
            >
              {t('season.closeButton')}
            </button>
          </div>
        </div>
      </div>

      {/* Season Rules Dialog */}
      {showRulesDialog && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowRulesDialog(false)} />
          <div
            className="relative w-[min(480px,95vw)] max-h-[88dvh] rounded-2xl flex flex-col overflow-hidden"
            style={{
              background: 'linear-gradient(160deg, #0d1b2a 0%, #0a1628 100%)',
              border: `1px solid ${theme.border}`,
              boxShadow: `0 0 40px ${theme.accent}20`,
            }}
          >
            {/* Dialog Header */}
            <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: `1px solid ${theme.border}` }}>
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5" style={{ color: theme.accent }} />
                <span className="font-bold text-white text-base">
                  {t('season.rulesTitle')}
                </span>
              </div>
              <button onClick={() => setShowRulesDialog(false)} className="text-white/50 hover:text-white transition-colors p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dialog Content */}
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm text-amber-100/80">

              {/* Section 1: How the season works */}
              <div className="space-y-2">
                <h3 className="font-bold text-base" style={{ color: theme.accent }}>
                  {t('season.howSeasonWorks')}
                </h3>
                <p>
                  {t('season.rulesHowSeasonWorksText')}
                </p>
              </div>

              {/* Section 2: Season dates */}
              <div className="space-y-2">
                <h3 className="font-bold text-base" style={{ color: theme.accent }}>
                  {t('season.currentDates')}
                </h3>
                <div className="rounded-xl p-3 space-y-1" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.border}` }}>
                  {seasonNumber && (
                    <div className="font-semibold" style={{ color: theme.accent }}>Season {seasonNumber} — {seasonName}</div>
                  )}
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-amber-200/60">
                    <span>
                      {t('season.startLabel')}
                      {' '}{startDate ? startDate.toLocaleDateString(locale === 'kk' ? 'kk-KZ' : locale === 'en' ? 'en-US' : locale === 'uk' ? 'uk-UA' : locale === 'ka' ? 'ka-GE' : locale === 'az' ? 'az-AZ' : locale === 'uz' ? 'uz-UZ' : locale === 'pl' ? 'pl-PL' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </span>
                    <span>—</span>
                    <span>
                      {t('season.endLabel')}
                      {' '}{endDate ? endDate.toLocaleDateString(locale === 'kk' ? 'kk-KZ' : locale === 'en' ? 'en-US' : locale === 'uk' ? 'uk-UA' : locale === 'ka' ? 'ka-GE' : locale === 'az' ? 'az-AZ' : locale === 'uz' ? 'uz-UZ' : locale === 'pl' ? 'pl-PL' : 'ru-RU', { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-xs" style={{ color: `${theme.accent}80` }}>
                    <Clock className="w-3 h-3" />
                    <span>
                      {t('season.timeLeftLabel')} {timeLeft}
                    </span>
                  </div>
                </div>
              </div>

              {/* Section 3: Rewards */}
              <div className="space-y-2">
                <h3 className="font-bold text-base" style={{ color: theme.accent }}>
                  {t('season.howRewards')}
                </h3>
                <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.20)' }}>
                  <p>
                    {t('season.rulesRewardsText')}
                  </p>
                  <p className="text-amber-200/60 text-xs italic">
                    {t('season.rulesRewardsExample')}
                  </p>
                </div>
              </div>

              {/* Section 4: Premium note */}
              <div className="space-y-2">
                <h3 className="font-bold text-base" style={{ color: theme.accent }}>
                  {t('season.premiumAndSeason')}
                </h3>
                <div className="rounded-xl p-3" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.20)' }}>
                  <p>
                    {t('season.rulesPremiumText')}
                  </p>
                </div>
              </div>

              {/* Section 5: How to earn rating points */}
              <div className="space-y-2">
                <h3 className="font-bold text-base" style={{ color: theme.accent }}>
                  {t('season.howEarnPoints')}
                </h3>
                <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.border}` }}>
                  <div className="space-y-1.5">
                    {[
                      {
                        icon: '✅',
                        ru: 'Победа в партии — +очки (зависит от числа игроков)',
                        en: 'Win a game — +points (depends on number of players)',
                        kk: 'Ойында жеңу — +ұпай (ойыншылар санына байланысты)',
                        ka: 'გამარჯვება პარტიაში — +ქულები (მოთამაშეთა რაოდენობის მიხედვით)',
                        az: 'Oyunda qazanmaq — +xallar (oyunçu sayından asılı)',
                        uz: "O'yinda g'alaba — +ball (o'yinchilar soniga qarab)",
                        pl: 'Wygrana w grze — +punkty (zależy od liczby graczy)',
                        uk: 'Перемога в партії — +очки (залежить від кількості гравців)',
                      },
                      {
                        icon: '❌',
                        ru: 'Поражение — -очки (незначительно)',
                        en: 'Loss — -points (small penalty)',
                        kk: 'Жеңілу — -ұпай (незде)',
                        ka: 'წაგება — -ქულები (მცირე)',
                        az: 'Məğlubiyyət — -xallar (az)',
                        uz: "Mag'lubiyat — -ball (ozgina)",
                        pl: 'Przegrana — -punkty (nieznacznie)',
                        uk: 'Поразка — -очки (незначно)',
                      },
                      {
                        icon: '🤝',
                        ru: 'Партия против реальных игроков — очки засчитываются',
                        en: 'Games vs real players — points count',
                        kk: 'Нақты ойыншылармен ойын — ұпай есептеледі',
                        ka: 'პარტია რეალური მოთამაშეების წინააღმდეგ — ქულები ითვლება',
                        az: 'Real oyunçulara qarşı oyun — xallar sayılır',
                        uz: "Haqiqiy o'yinchilarga qarshi o'yin — ball hisoblanadi",
                        pl: 'Gra przeciwko prawdziwym graczom — punkty są liczone',
                        uk: 'Партія проти реальних гравців — очки зараховуються',
                      },
                      {
                        icon: '🤖',
                        ru: 'Партия против ботов — очки не засчитываются',
                        en: 'Games vs bots — points do NOT count',
                        kk: 'Боттармен ойын — ұпай есептелмейді',
                        ka: 'პარტია ბოტების წინააღმდეგ — ქულები არ ითვლება',
                        az: 'Botlara qarşı oyun — xallar sayılmır',
                        uz: "Botlarga qarshi o'yin — ball hisoblanmaydi",
                        pl: 'Gra przeciwko botom — punkty NIE są liczone',
                        uk: 'Партія проти ботів — очки не зараховуються',
                      },
                      {
                        icon: '🏆',
                        ru: 'Чем больше игроков в партии — тем больше очков за победу',
                        en: 'More players in a game — more points for winning',
                        kk: 'Ойында көп ойыншы — жеңуге көп ұпай',
                        ka: 'რაც მეტი მოთამაშე პარტიაში — მით მეტი ქულა გამარჯვებისთვის',
                        az: 'Oyunda nə qədər çox oyunçu — qazanmaq üçün bir o qədər çox xal',
                        uz: "O'yinda qancha ko'p o'yinchi — g'alaba uchun shuncha ko'p ball",
                        pl: 'Im więcej graczy w grze — tym więcej punktów za wygraną',
                        uk: 'Чим більше гравців у партії — тим більше очків за перемогу',
                      },
                    ].map((item, i) => (
                      <div key={i} className="flex items-start gap-2 text-sm">
                        <span className="text-base leading-5 flex-shrink-0">{item.icon}</span>
                        <span>{locale === 'kk' ? item.kk : locale === 'en' ? item.en : locale === 'uk' ? (item as any).uk ?? item.ru : locale === 'ka' ? (item as any).ka ?? item.ru : locale === 'az' ? (item as any).az ?? item.ru : locale === 'uz' ? (item as any).uz ?? item.ru : locale === 'pl' ? (item as any).pl ?? item.ru : item.ru}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Section 6: Ranks overview */}
              <div className="space-y-2">
                <h3 className="font-bold text-base" style={{ color: theme.accent }}>
                  {t('season.ranksSection')}
                </h3>
                <div className="space-y-1.5">
                  {SEASON_RANKS.map(rank => (
                    <div key={rank.key} className="flex items-center gap-2 rounded-lg px-3 py-2" style={{ background: 'rgba(255,255,255,0.03)', border: `1px solid ${rank.color}25` }}>
                      <DiamondRankIcon seasonRating={rank.minRating} size={24} />
                      <span className="font-semibold text-sm" style={{ color: rank.color }}>
                        {locale === 'kk' ? rank.nameKk : locale === 'en' ? rank.nameEn : locale === 'uk' ? (rank as any).nameUk ?? rank.nameRu : locale === 'ka' ? (rank as any).nameKa ?? rank.nameRu : locale === 'az' ? (rank as any).nameAz ?? rank.nameRu : locale === 'uz' ? (rank as any).nameUz ?? rank.nameRu : locale === 'pl' ? (rank as any).namePl ?? rank.nameRu : rank.nameRu}
                      </span>
                      <span className="text-xs text-amber-200/40 ml-auto">
                        {rank.minRating === 0
                          ? t('season.startingRank')
                          : `${rank.minRating.toLocaleString()}+ ${t('season.ptsAbbr')}`
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Dialog Footer */}
            <div className="shrink-0 px-5 py-4" style={{ borderTop: `1px solid ${theme.border}` }}>
              <button
                onClick={() => setShowRulesDialog(false)}
                className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
                style={{ background: `${theme.accent}18`, border: `1px solid ${theme.accent}40`, color: theme.accent }}
              >
                {t('season.closeButton')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reward popup */}
      {rewardPopupKey && (
        <RewardPopup
          rankKey={rewardPopupKey}
          seasonKey={activeSeasonKey}
          seasonNumber={seasonNumber ?? undefined}
          locale={locale}
          onClose={() => setRewardPopupKey(null)}
        />
      )}
    </>
  );
}
