import { useState, useMemo, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { DiamondRankIcon } from '@/components/DiamondRankIcon';
import { getBaseAvatarId, getSeasonAvatarId, getAvatarDisplayName, isCanvasAvatar, getAvatarAccentColors } from '../../../shared/avatars';
import { SEASON_RANKS, SEASON_REWARD_DEFS, getSeasonRewardDefForSeason, type SeasonTheme } from '../../../shared/seasons';
import { useTranslation } from '@/i18n';
import { X, Flame, Trophy, Clock, Gift } from 'lucide-react';
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
import { AvatarDisplay } from '@/components/AvatarDisplay';
import { useState as useLocalState } from 'react';

interface SeasonPageProps {
  open: boolean;
  onClose: () => void;
}

function formatTimeLeft(endDate: Date, locale?: string): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  const days = Math.floor(Math.max(0, diff) / (1000 * 60 * 60 * 24));
  const hours = Math.floor((Math.max(0, diff) % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  if (locale === 'en') return diff <= 0 ? '0d 0h' : `${days}d ${hours}h`;
  if (locale === 'kk') return diff <= 0 ? '0к 0с' : `${days}к ${hours}с`;
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

  const rankName = locale === 'kk' ? rank.nameKk : locale === 'en' ? rank.nameEn : rank.nameRu;

  // Build per-season avatar ID for display
  const seasonAvatarId = reward.avatarId && seasonKey
    ? getSeasonAvatarId(reward.avatarId, seasonKey)
    : reward.avatarId;
  const baseAvatarId = seasonAvatarId ? getBaseAvatarId(seasonAvatarId) : null;
  const avatarDisplayName = seasonAvatarId
    ? getAvatarDisplayName(seasonAvatarId, locale as 'ru' | 'kk' | 'en', seasonNumber)
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
                {locale === 'kk' ? 'Маусым соңындағы сыйақы' : locale === 'en' ? 'End of season reward' : 'Награда в конце сезона'}
              </div>
            </div>
          </div>

          {/* Rewards list */}
          <div className="space-y-2">
            {/* Shanyraks */}
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: 'rgba(234,179,8,0.08)' }}>
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png" alt="" className="w-6 h-6 object-contain" />
              <span className="text-amber-200 font-semibold text-sm">
                +{reward.shanyraks.toLocaleString()} {locale === 'kk' ? 'шаңырақ' : locale === 'en' ? 'shanyraks' : 'шаныраков'}
              </span>
            </div>

            {/* Tenge */}
            {reward.tenge > 0 && (
              <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: 'rgba(139,92,246,0.10)' }}>
                <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/tenge_9aefd1b7.png" alt="" className="w-6 h-6 object-contain" />
                <span className="text-purple-300 font-semibold text-sm">
                  +{reward.tenge} {locale === 'kk' ? 'теңге' : locale === 'en' ? 'tenge' : 'тенге'}
                </span>
              </div>
            )}

            {/* Avatar - animated preview */}
            {seasonAvatarId && isAnimated && (
              <div
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5`}
                style={{ background: avatarAccent.bg }}
              >
                <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${avatarAccent.border} flex-shrink-0`}>
                  <AvatarDisplay avatarId={seasonAvatarId} size={48} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`${avatarAccent.text} font-semibold text-sm`}>
                    {locale === 'kk' ? 'Аватар' : locale === 'en' ? 'Avatar' : 'Аватарка'}: {avatarDisplayName}
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
                <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${avatarAccent.border} flex-shrink-0`}>
                  <AvatarDisplay avatarId={seasonAvatarId} size={48} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`${avatarAccent.text} font-semibold text-sm`}>
                    {locale === 'kk' ? 'Аватар' : locale === 'en' ? 'Avatar' : 'Аватарка'}: {avatarDisplayName}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Обсидиан' : locale === 'en' ? 'Obsidian' : 'Обсидиан'}{seasonNumber ? ` - Season ${seasonNumber}` : ''}
                  </div>
                  <div className="text-amber-200/50 text-xs mt-0.5">
                    {locale === 'kk' ? 'Анимациялық эксклюзивті жақтау' : locale === 'en' ? 'Exclusive animated frame' : 'Эксклюзивная анимированная рамка'}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Рубин' : locale === 'en' ? 'Ruby' : 'Рубин'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,80,160,0.50)' }}>
                    {locale === 'kk' ? 'Алқызыл жарқыл жақтауы' : locale === 'en' ? 'Exclusive crimson flash frame' : 'Эксклюзивная рамка с алой вспышкой'}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Янтар' : locale === 'en' ? 'Amber' : 'Янтарь'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(251,146,60,0.50)' }}>
                    {locale === 'kk' ? 'Күн жарқылы жақтауы' : locale === 'en' ? 'Exclusive solar flare frame' : 'Эксклюзивная рамка с солнечной вспышкой'}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Циркон' : locale === 'en' ? 'Zircon' : 'Циркон'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(168,85,247,0.50)' }}>
                    {locale === 'kk' ? 'Комета құйрығы жақтауы' : locale === 'en' ? 'Exclusive comet trail frame' : 'Эксклюзивная рамка с хвостом кометы'}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: Obsidian - Season 7
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(0,180,255,0.50)' }}>
                    {locale === 'kk' ? 'Қос орбиталы эксклюзивті жақтау' : locale === 'en' ? 'Exclusive dual-orbit animated frame' : 'Эксклюзивная рамка с двойной орбитой'}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Обсидиан' : locale === 'en' ? 'Obsidian' : 'Обсидиан'} - Season {seasonNumber ?? 9}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(200,80,0,0.50)' }}>
                    {locale === 'kk' ? 'Жапон Они жақтауы' : locale === 'en' ? 'Exclusive Japanese Oni frame' : 'Эксклюзивная японская рамка Они'}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Обсидиан' : locale === 'en' ? 'Obsidian' : 'Обсидиан'} - Season {seasonNumber ?? 8}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(255,80,0,0.50)' }}>
                    {locale === 'kk' ? 'Балқыған лава жақтауы' : locale === 'en' ? 'Exclusive molten lava frame' : 'Эксклюзивная рамка с расплавленной лавой'}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Обсидиан - Season 1' : locale === 'en' ? 'Obsidian - Season 1' : 'Обсидиан - Season 1'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(0,200,180,0.50)' }}>
                    {locale === 'kk' ? 'Мұхит түбі: биолюминесцентті жыланбалықтар' : locale === 'en' ? 'Ocean abyss: bioluminescent tentacles' : 'Бездна океана: биолюминесцентные щупальца'}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Обсидиан - Season 2' : locale === 'en' ? 'Obsidian - Season 2' : 'Обсидиан - Season 2'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(200,160,0,0.50)' }}>
                    {locale === 'kk' ? 'Фараондардың қара сиқыры' : locale === 'en' ? 'Dark pharaoh magic: golden hieroglyphs' : 'Тёмная магия фараонов: золотые иероглифы'}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Обсидиан - Season 3' : locale === 'en' ? 'Obsidian - Season 3' : 'Обсидиан - Season 3'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(100,150,255,0.50)' }}>
                    {locale === 'kk' ? 'Елес дауылы: найзағайлар мен бас сүйек' : locale === 'en' ? 'Ghost storm: lightning and skull' : 'Призрачный шторм: молнии и череп'}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Обсидиан - Season 4' : locale === 'en' ? 'Obsidian - Season 4' : 'Обсидиан - Season 4'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(140,60,220,0.50)' }}>
                    {locale === 'kk' ? 'Иггдрасиль рундары' : locale === 'en' ? 'Yggdrasil runes: aurora and Mjolnir' : 'Руны Иггдрасиля: аврора и молот Тора'}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Обсидиан - Season 5' : locale === 'en' ? 'Obsidian - Season 5' : 'Обсидиан - Season 5'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(100,0,200,0.50)' }}>
                    {locale === 'kk' ? 'Қара тесік: галактикалық спираль' : locale === 'en' ? 'Black hole: galactic spiral' : 'Чёрная дыра: галактическая спираль'}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Обсидиан - Season 10' : locale === 'en' ? 'Obsidian - Season 10' : 'Обсидиан - Season 10'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(0,255,180,0.50)' }}>
                    {locale === 'kk' ? 'Void circuit: неон глитч пен матрица' : locale === 'en' ? 'Void circuit: neon glitch and matrix rain' : 'Void circuit: неоновый глитч и матричный дождь'}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Обсидиан - Season 11' : locale === 'en' ? 'Obsidian - Season 11' : 'Обсидиан - Season 11'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(200,150,0,0.50)' }}>
                    {locale === 'kk' ? 'Алтын тізбек: винил ойықтары' : locale === 'en' ? 'Gold chain: vinyl grooves and beat wave' : 'Золотая цепь: виниловые бороздки и beat wave'}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Обсидиан - Season 12' : locale === 'en' ? 'Obsidian - Season 12' : 'Обсидиан - Season 12'}
                  </div>
                  <div className="text-xs mt-0.5" style={{ color: 'rgba(180,120,255,0.50)' }}>
                    {locale === 'kk' ? 'Қосарлылық: периште қанаттары мен тозақ оты' : locale === 'en' ? 'Duality: angel wings and hellfire' : 'Двойственность: крылья ангела и адский огонь'}
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
  const { locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<'info' | 'leaderboard' | 'ranks'>('info');
  const [rewardPopupKey, setRewardPopupKey] = useState<string | null>(null);

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
  const timeLeft = endDate ? formatTimeLeft(endDate, locale) : '-';

  const seasonInfo = seasonData?.seasonInfo;
  const seasonName = seasonInfo
    ? (locale === 'kk' ? seasonInfo.nameKk : locale === 'en' ? seasonInfo.nameEn : seasonInfo.nameRu)
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
                {locale === 'kk' ? 'Маусым' : locale === 'en' ? 'Season' : 'Сезон'}
              </span>
            </div>
            <button onClick={onClose} className="text-white/50 hover:text-white transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
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
                {locale === 'kk' ? 'Аяқталуға дейін:' : locale === 'en' ? 'Ends in:' : 'До конца:'} {timeLeft}
              </span>
            </div>
            {/* Premium note */}
            <div className="mt-2 text-xs italic" style={{ color: `${theme.accent}50` }}>
              {locale === 'kk'
                ? '★ Премиум сезондық рейтингке бонус бермейді'
                : locale === 'en'
                  ? '★ Premium does not grant bonuses to season rating'
                  : '★ Премиум не даёт бонус к сезонному рейтингу'}
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
                  ? (locale === 'kk' ? 'Менің рейтингім' : locale === 'en' ? 'My Rating' : 'Мой рейтинг')
                  : tab === 'leaderboard'
                    ? (locale === 'kk' ? 'Топ ойыншылар' : locale === 'en' ? 'Top Players' : 'Топ игроков')
                    : (locale === 'kk' ? 'Рангтар' : locale === 'en' ? 'Ranks' : 'Ранги')}
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
                        {locale === 'kk' ? 'Ағымдағы ранг' : locale === 'en' ? 'Current rank' : 'Текущий ранг'}
                      </div>
                      <div className="font-bold text-lg" style={{ color: currentRank.color }}>
                        {locale === 'kk' ? currentRank.nameKk : locale === 'en' ? currentRank.nameEn : currentRank.nameRu}
                      </div>
                      <div className="text-amber-100 font-mono text-sm mt-0.5">
                        {seasonData?.seasonRating ?? 0} {locale === 'kk' ? 'ұпай' : locale === 'en' ? 'pts' : 'очков'}
                      </div>
                    </div>
                  </div>
                )}

                {/* Progress to next rank */}
                {nextRank && currentRank && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-amber-200/60">
                      <span style={{ color: currentRank.color }}>{locale === 'kk' ? currentRank.nameKk : locale === 'en' ? currentRank.nameEn : currentRank.nameRu}</span>
                      <span style={{ color: nextRank.color }}>{locale === 'kk' ? nextRank.nameKk : locale === 'en' ? nextRank.nameEn : nextRank.nameRu}</span>
                    </div>
                    <ProgressBar
                      current={seasonData?.seasonRating ?? 0}
                      min={currentRank.minRating}
                      max={nextRank.minRating}
                      color={nextRank.color}
                    />
                    <div className="text-center text-xs text-amber-200/40">
                      {nextRank.minRating - (seasonData?.seasonRating ?? 0)} {locale === 'kk' ? 'ұпай қалды' : locale === 'en' ? 'pts to next rank' : 'очков до следующего ранга'}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: locale === 'kk' ? 'Ойындар' : locale === 'en' ? 'Games' : 'Игры', value: seasonData?.gamesPlayed ?? 0 },
                    { label: locale === 'kk' ? 'Жеңістер' : locale === 'en' ? 'Wins' : 'Победы', value: seasonData?.wins ?? 0 },
                    { label: locale === 'kk' ? 'Жеңілістер' : locale === 'en' ? 'Losses' : 'Поражения', value: seasonData?.losses ?? 0 },
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
                    <span>{locale === 'kk' ? 'Маусым соңындағы сыйақы' : locale === 'en' ? 'End of season reward' : 'Награда за сезон'}</span>
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
                      ? getAvatarDisplayName(seasonAvatarId, locale as 'ru' | 'kk' | 'en', seasonNumber ?? undefined)
                      : null;

                    const isAnimated = isCanvasAvatar(seasonAvatarId);

                    return (
                      <div className="text-amber-100 text-sm space-y-1.5">
                        {/* Shanyraks */}
                        <div className="flex items-center gap-2">
                          <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png" alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                          <span>+{rewardDef.shanyraks.toLocaleString()} {locale === 'kk' ? 'шаңырақ' : locale === 'en' ? 'shanyraks' : 'шаныраков'}</span>
                        </div>
                        {/* Tenge */}
                        {rewardDef.tenge > 0 && (
                          <div className="flex items-center gap-2">
                            <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/tenge_9aefd1b7.png" alt="" className="w-5 h-5 object-contain flex-shrink-0" />
                            <span>+{rewardDef.tenge} {locale === 'kk' ? 'теңге' : locale === 'en' ? 'tenge' : 'тенге'}</span>
                          </div>
                        )}
                        {/* Avatar - per-season */}
                        {seasonAvatarId && (() => {
                          return (
                            <div
                              className={`flex items-center gap-2 ${isAnimated ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                              onClick={isAnimated ? () => setRewardPopupKey(currentRank.key) : undefined}
                            >
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500/40 flex-shrink-0 bg-black/30">
                                {seasonAvatarId ? <AvatarDisplay avatarId={seasonAvatarId} size={32} /> : <div className="w-8 h-8 flex items-center justify-center text-lg">🖼</div>}
                              </div>
                              <span>
                                {locale === 'kk' ? 'Аватар' : locale === 'en' ? 'Avatar' : 'Аватарка'}: <span className="text-amber-300 font-medium">{avatarDisplayName}</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span className="text-yellow-300 font-medium">{locale === 'kk' ? 'Обсидиан' : locale === 'en' ? 'Obsidian' : 'Обсидиан'}{seasonNumber ? ` - Season ${seasonNumber}` : ''}</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span style={{ color: 'rgba(220,0,60,0.95)' }} className="font-medium">{locale === 'kk' ? 'Рубин' : locale === 'en' ? 'Ruby' : 'Рубин'}</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span style={{ color: 'rgba(245,158,11,0.95)' }} className="font-medium">{locale === 'kk' ? 'Янтар' : locale === 'en' ? 'Amber' : 'Янтарь'}</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span style={{ color: 'rgba(249,115,22,0.95)' }} className="font-medium">{locale === 'kk' ? 'Циркон' : locale === 'en' ? 'Zircon' : 'Циркон'}</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span style={{ color: 'rgba(0,212,255,0.95)' }} className="font-medium">Obsidian - Season 7</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span style={{ color: 'rgba(220,50,0,0.95)' }} className="font-medium">{locale === 'kk' ? 'Обсидиан' : locale === 'en' ? 'Obsidian' : 'Обсидиан'} - Season {seasonNumber ?? 9}</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span style={{ color: 'rgba(255,100,10,0.95)' }} className="font-medium">{locale === 'kk' ? 'Обсидиан' : locale === 'en' ? 'Obsidian' : 'Обсидиан'} - Season {seasonNumber ?? 8}</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span style={{ color: 'rgba(0,200,180,0.95)' }} className="font-medium">{locale === 'kk' ? 'Обсидиан - Season 1' : locale === 'en' ? 'Obsidian - Season 1' : 'Обсидиан - Season 1'}</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span style={{ color: 'rgba(200,160,0,0.95)' }} className="font-medium">{locale === 'kk' ? 'Обсидиан - Season 2' : locale === 'en' ? 'Obsidian - Season 2' : 'Обсидиан - Season 2'}</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span style={{ color: 'rgba(100,150,255,0.95)' }} className="font-medium">{locale === 'kk' ? 'Обсидиан - Season 3' : locale === 'en' ? 'Obsidian - Season 3' : 'Обсидиан - Season 3'}</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span style={{ color: 'rgba(140,60,220,0.95)' }} className="font-medium">{locale === 'kk' ? 'Обсидиан - Season 4' : locale === 'en' ? 'Obsidian - Season 4' : 'Обсидиан - Season 4'}</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span style={{ color: 'rgba(100,0,200,0.95)' }} className="font-medium">{locale === 'kk' ? 'Обсидиан - Season 5' : locale === 'en' ? 'Obsidian - Season 5' : 'Обсидиан - Season 5'}</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span style={{ color: 'rgba(0,255,180,0.95)' }} className="font-medium">{locale === 'kk' ? 'Обсидиан - Season 10' : locale === 'en' ? 'Obsidian - Season 10' : 'Обсидиан - Season 10'}</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span style={{ color: 'rgba(200,150,0,0.95)' }} className="font-medium">{locale === 'kk' ? 'Обсидиан - Season 11' : locale === 'en' ? 'Obsidian - Season 11' : 'Обсидиан - Season 11'}</span>
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span style={{ color: 'rgba(180,120,255,0.95)' }} className="font-medium">{locale === 'kk' ? 'Обсидиан - Season 12' : locale === 'en' ? 'Obsidian - Season 12' : 'Обсидиан - Season 12'}</span>
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
                    {locale === 'kk' ? 'Жүктелуде...' : locale === 'en' ? 'Loading...' : 'Загрузка...'}
                  </div>
                ) : leaderboardData.entries.length === 0 ? (
                  <div className="text-center text-amber-200/40 py-10">
                    {locale === 'kk' ? 'Ойыншылар жоқ' : locale === 'en' ? 'No players yet' : 'Пока нет игроков'}
                  </div>
                ) : (
                  <div className="space-y-1">
                    {leaderboardData.entries.map((entry, idx) => {
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
                          <div
                            className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0"
                            style={isTop3 ? { boxShadow: '0 0 6px rgba(234,179,8,0.5)' } : undefined}
                          >
                            <AvatarDisplay avatarId={entry.avatarId ?? 'wolf'} size={32} className="w-full h-full" />
                          </div>

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
                              {locale === 'kk' ? 'ұпай' : locale === 'en' ? 'pts' : 'очков'}
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
                            {locale === 'kk' ? rank.nameKk : locale === 'en' ? rank.nameEn : rank.nameRu}
                          </div>
                          {isCurrent ? (
                            <div className="text-[10px] text-amber-300 mt-0.5 font-medium">
                              ★ {locale === 'kk' ? 'Сіздің рангіңіз' : locale === 'en' ? 'Your rank' : 'Ваш ранг'}
                            </div>
                          ) : (
                            <div className="text-amber-200/40 text-xs mt-0.5">
                              {ratingRange} {locale === 'kk' ? 'ұпай' : locale === 'en' ? 'pts' : 'очков'}
                            </div>
                          )}
                          {isCurrent && (
                            <div className="text-amber-200/40 text-xs mt-0.5">
                              {ratingRange} {locale === 'kk' ? 'ұпай' : locale === 'en' ? 'pts' : 'очков'}
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
                          {locale === 'kk' ? 'Сыйақы' : locale === 'en' ? 'Reward' : 'Награда'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>{/* end scrollable content */}

          {/* Close button at bottom - always visible */}
          <div className="shrink-0 px-5 py-4 border-t border-amber-700/20">
            <button
              onClick={onClose}
              className="w-full py-3 rounded-xl font-semibold text-sm transition-all"
              style={{ background: 'rgba(251,191,36,0.12)', border: '1px solid rgba(251,191,36,0.3)', color: '#fbbf24' }}
            >
              {locale === 'kk' ? 'Жабу' : locale === 'en' ? 'Close' : 'Закрыть'}
            </button>
          </div>
        </div>
      </div>

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
