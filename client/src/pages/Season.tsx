import { useState, useMemo, useEffect } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { DiamondRankIcon } from '@/components/DiamondRankIcon';
import { getBaseAvatarId, getSeasonAvatarId, getAvatarDisplayName } from '../../../shared/avatars';
import { SEASON_RANKS, SEASON_REWARD_DEFS, getSeasonRewardDefForSeason, type SeasonTheme } from '../../../shared/seasons';
import { useTranslation } from '@/i18n';
import { X, Flame, Trophy, Clock, Gift, ZoomIn } from 'lucide-react';
import { KhanAvatar } from '@/components/KhanAvatar';
import { GoldenHordeAvatar } from '@/components/GoldenHordeAvatar';
import { DivingEagleAvatar } from '@/components/DivingEagleAvatar';
import { GreatKhanAvatar } from '@/components/GreatKhanAvatar';
import { NeonPawAvatar } from '@/components/NeonPawAvatar';
import { GreatKhanFrame } from '@/components/GreatKhanFrame';
import { AvatarDisplay } from '@/components/AvatarDisplay';
import { useState as useLocalState } from 'react';

interface SeasonPageProps {
  open: boolean;
  onClose: () => void;
}

function formatTimeLeft(endDate: Date): string {
  const now = new Date();
  const diff = endDate.getTime() - now.getTime();
  if (diff <= 0) return '0д 0ч';
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  return `${days}д ${hours}ч`;
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

/** Render an animated avatar component by base ID */
function AnimatedAvatarComponent({ baseId, size }: { baseId: string; size: number }) {
  if (baseId === 'sky_eagle' || baseId === 'diving_eagle') return <DivingEagleAvatar size={size} />;
  if (baseId === 'khan') return <KhanAvatar size={size} />;
  if (baseId === 'golden_horde') return <GoldenHordeAvatar size={size} />;
  if (baseId === 'great_khan') return <GreatKhanAvatar size={size} />;
  if (baseId === 'neon_paw') return <NeonPawAvatar size={size} />;
  return null;
}

/** Full-screen avatar preview modal */
function AvatarPreviewModal({
  avatarId,
  locale,
  seasonNumber,
  onClose,
}: {
  avatarId: string;
  locale: string;
  seasonNumber?: number;
  onClose: () => void;
}) {
  const baseId = getBaseAvatarId(avatarId);
  const displayName = getAvatarDisplayName(avatarId, locale as 'ru' | 'kk' | 'en', seasonNumber);

  const borderColor =
    baseId === 'khan'         ? '#f97316' :
    baseId === 'golden_horde' ? '#eab308' :
    baseId === 'great_khan'   ? '#b8860b' :
    baseId === 'neon_paw'     ? '#a855f7' :
    '#f59e0b';
  const shadowColor =
    baseId === 'khan'         ? 'rgba(249,115,22,0.3)' :
    baseId === 'golden_horde' ? 'rgba(234,179,8,0.3)' :
    baseId === 'great_khan'   ? 'rgba(184,134,11,0.4)' :
    baseId === 'neon_paw'     ? 'rgba(168,85,247,0.4)' :
    'rgba(245,158,11,0.3)';

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex flex-col items-center gap-4">
        <div
          className="w-64 h-64 rounded-full overflow-hidden"
          style={{ border: `4px solid ${borderColor}`, boxShadow: `0 0 40px ${shadowColor}` }}
        >
          <AnimatedAvatarComponent baseId={baseId} size={256} />
        </div>
        <div className="font-bold text-lg" style={{ color: borderColor }}>{displayName}</div>
        <button
          onClick={onClose}
          className="mt-2 px-6 py-2 rounded-xl bg-amber-700/60 hover:bg-amber-600/80 text-amber-100 text-sm font-medium transition-colors"
        >
          <X className="w-4 h-4 inline mr-1" />{locale === 'kk' ? 'Жабу' : locale === 'en' ? 'Close' : 'Закрыть'}
        </button>
      </div>
    </div>
  );
}

/** Reward popup for a single rank — uses per-season avatarId */
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
  const [avatarPreview, setAvatarPreview] = useLocalState<string | null>(null);
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

  const isAnimated = baseAvatarId
    ? ['sky_eagle', 'diving_eagle', 'khan', 'golden_horde', 'great_khan', 'neon_paw'].includes(baseAvatarId)
    : false;

  // Avatar accent color
  const avatarAccent =
    baseAvatarId === 'khan'         ? { bg: 'rgba(251,146,60,0.06)', border: 'border-orange-500/50', text: 'text-orange-300', hover: 'hover:bg-orange-500/10' } :
    baseAvatarId === 'golden_horde' ? { bg: 'rgba(234,179,8,0.06)', border: 'border-yellow-500/50', text: 'text-yellow-300', hover: 'hover:bg-yellow-500/10' } :
    baseAvatarId === 'great_khan'   ? { bg: 'rgba(184,134,11,0.08)', border: 'border-yellow-600/60', text: 'text-yellow-300', hover: 'hover:bg-yellow-900/20' } :
    baseAvatarId === 'neon_paw'     ? { bg: 'rgba(168,85,247,0.08)', border: 'border-purple-500/50', text: 'text-purple-300', hover: 'hover:bg-purple-500/10' } :
    { bg: 'rgba(251,191,36,0.06)', border: 'border-amber-500/50', text: 'text-amber-300', hover: 'hover:bg-amber-500/10' };

  return (
    <>
      {avatarPreview && (
        <AvatarPreviewModal
          avatarId={avatarPreview}
          locale={locale}
          seasonNumber={seasonNumber}
          onClose={() => setAvatarPreview(null)}
        />
      )}
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

            {/* Avatar — animated preview */}
            {seasonAvatarId && isAnimated && (
              <div
                className={`flex items-center gap-3 rounded-lg px-3 py-2.5 cursor-pointer transition-colors ${avatarAccent.hover}`}
                style={{ background: avatarAccent.bg }}
                onClick={() => setAvatarPreview(seasonAvatarId)}
              >
                <div className={`w-12 h-12 rounded-full overflow-hidden border-2 ${avatarAccent.border} flex-shrink-0`}>
                  {baseAvatarId && <AnimatedAvatarComponent baseId={baseAvatarId} size={48} />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className={`${avatarAccent.text} font-semibold text-sm`}>
                    {locale === 'kk' ? 'Аватар' : locale === 'en' ? 'Avatar' : 'Аватарка'}: {avatarDisplayName}
                  </div>
                  <div className={`${avatarAccent.text} opacity-60 text-xs flex items-center gap-1 mt-0.5`}>
                    <ZoomIn className="w-3 h-3" />
                    {locale === 'kk' ? 'Үлкейту үшін басыңыз' : locale === 'en' ? 'Tap to preview' : 'Нажмите для просмотра'}
                  </div>
                </div>
              </div>
            )}

            {/* Frame */}
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
                    {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: {locale === 'kk' ? 'Обсидиан' : locale === 'en' ? 'Obsidian' : 'Обсидиан'}{seasonNumber ? ` Season ${seasonNumber}` : ''}
                  </div>
                  <div className="text-amber-200/50 text-xs mt-0.5">
                    {locale === 'kk' ? 'Анимациялық эксклюзивті жақтау' : locale === 'en' ? 'Exclusive animated frame' : 'Эксклюзивная анимированная рамка'}
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

  // Support admin test season: read from localStorage (set by SeasonTestTab) or URL param
  const getAdminTestSeason = () => {
    if (typeof window === 'undefined') return undefined;
    const urlParam = new URLSearchParams(window.location.search).get('testSeason');
    if (urlParam) return urlParam;
    try { return localStorage.getItem('admin_test_season') ?? undefined; } catch { return undefined; }
  };
  const [testSeasonKey, setTestSeasonKey] = useState<string | undefined>(getAdminTestSeason);

  // Listen for changes from SeasonTestTab (same tab via StorageEvent)
  useEffect(() => {
    const handler = (e: StorageEvent) => {
      if (e.key === 'admin_test_season') {
        setTestSeasonKey(e.newValue ?? undefined);
      }
    };
    window.addEventListener('storage', handler);
    return () => window.removeEventListener('storage', handler);
  }, []);

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
  const timeLeft = endDate ? formatTimeLeft(endDate) : '—';

  const seasonInfo = seasonData?.seasonInfo;
  const seasonName = seasonInfo
    ? (locale === 'kk' ? seasonInfo.nameKk : locale === 'en' ? seasonInfo.nameEn : seasonInfo.nameRu)
    : '—';
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

        {/* Panel — full screen on mobile, modal on sm+ */}
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

                {/* Season end reward preview — uses per-season avatarId */}
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

                    const isAnimated = baseAvatarId
                      ? ['sky_eagle', 'diving_eagle', 'khan', 'golden_horde', 'great_khan', 'neon_paw'].includes(baseAvatarId)
                      : false;

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
                        {/* Avatar — per-season */}
                        {seasonAvatarId && (() => {
                          return (
                            <div
                              className={`flex items-center gap-2 ${isAnimated ? 'cursor-pointer hover:opacity-80 transition-opacity' : ''}`}
                              onClick={isAnimated ? () => setRewardPopupKey(currentRank.key) : undefined}
                            >
                              <div className="w-8 h-8 rounded-full overflow-hidden border border-amber-500/40 flex-shrink-0 bg-black/30">
                                {baseAvatarId ? <AnimatedAvatarComponent baseId={baseAvatarId} size={32} /> : <div className="w-8 h-8 flex items-center justify-center text-lg">🖼</div>}
                              </div>
                              <span>
                                {locale === 'kk' ? 'Аватар' : locale === 'en' ? 'Avatar' : 'Аватарка'}: <span className="text-amber-300 font-medium">{avatarDisplayName}</span>
                              </span>
                              {isAnimated && <ZoomIn className="w-3 h-3 text-amber-400/60 flex-shrink-0" />}
                            </div>
                          );
                        })()}
                        {/* Frame reward */}
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
                              {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span className="text-yellow-300 font-medium">{locale === 'kk' ? 'Обсидиан' : locale === 'en' ? 'Obsidian' : 'Обсидиан'}{seasonNumber ? ` Season ${seasonNumber}` : ''}</span>
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

          {/* Close button at bottom — always visible */}
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
