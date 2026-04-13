import { useState, useMemo } from 'react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { DiamondRankIcon } from '@/components/DiamondRankIcon';
import { getAvatarUrl } from '../../../shared/avatars';
import { SEASON_RANKS, SEASON_REWARD_DEFS } from '../../../shared/seasons';
import { useTranslation } from '@/i18n';
import { X, Flame, Trophy, Clock, Gift } from 'lucide-react';

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

/** Reward popup for a single rank */
function RewardPopup({
  rankKey,
  locale,
  onClose,
}: {
  rankKey: string;
  locale: string;
  onClose: () => void;
}) {
  const rank = SEASON_RANKS.find(r => r.key === rankKey);
  const reward = SEASON_REWARD_DEFS.find(r => r.rankKey === rankKey);
  if (!rank || !reward) return null;

  const rankName = locale === 'kk' ? rank.nameKk : locale === 'en' ? rank.nameEn : rank.nameRu;

  return (
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
            <span className="text-lg">⊛</span>
            <span className="text-amber-200 font-semibold text-sm">
              +{reward.shanyraks.toLocaleString()} {locale === 'kk' ? 'шаңырақ' : locale === 'en' ? 'shanyraks' : 'шаныраков'}
            </span>
          </div>

          {/* Tenge */}
          {reward.tenge > 0 && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: 'rgba(139,92,246,0.10)' }}>
              <span className="text-lg">💎</span>
              <span className="text-purple-300 font-semibold text-sm">
                +{reward.tenge} {locale === 'kk' ? 'теңге' : locale === 'en' ? 'tenge' : 'тенге'}
              </span>
            </div>
          )}

          {/* Avatar */}
          {reward.avatarId && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: 'rgba(251,191,36,0.06)' }}>
              <span className="text-lg">🖼</span>
              <div>
                <div className="text-amber-300 font-semibold text-sm">
                  {locale === 'kk' ? 'Аватар' : locale === 'en' ? 'Avatar' : 'Аватарка'}: <span className="italic opacity-70">{reward.avatarId}</span>
                </div>
                <div className="text-amber-200/40 text-xs">
                  {locale === 'kk' ? '(жақында қосылады)' : locale === 'en' ? '(coming soon)' : '(будет добавлена позже)'}
                </div>
              </div>
            </div>
          )}

          {/* Frame */}
          {reward.frameId && (
            <div className="flex items-center gap-2 rounded-lg px-3 py-2.5" style={{ background: 'rgba(251,191,36,0.06)' }}>
              <span className="text-lg">✨</span>
              <div>
                <div className="text-amber-300 font-semibold text-sm">
                  {locale === 'kk' ? 'Жақтау' : locale === 'en' ? 'Frame' : 'Рамка'}: <span className="italic opacity-70">{reward.frameId}</span>
                </div>
                <div className="text-amber-200/40 text-xs">
                  {locale === 'kk' ? '(жақында қосылады)' : locale === 'en' ? '(coming soon)' : '(будет добавлена позже)'}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SeasonPage({ open, onClose }: SeasonPageProps) {
  const { user } = useAuth();
  const { locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<'info' | 'leaderboard' | 'ranks'>('info');
  const [rewardPopupKey, setRewardPopupKey] = useState<string | null>(null);

  const { data: seasonData } = trpc.season.current.useQuery(undefined, {
    enabled: !!user && open,
    refetchInterval: 60000,
  });

  const { data: leaderboardData } = trpc.season.leaderboard.useQuery(
    { seasonKey: undefined },
    { enabled: open && activeTab === 'leaderboard', refetchInterval: 30000 }
  );

  const endDate = seasonData?.endDate ? new Date(seasonData.endDate) : null;
  const timeLeft = endDate ? formatTimeLeft(endDate) : '—';

  const seasonName = seasonData?.seasonInfo
    ? (locale === 'kk' ? seasonData.seasonInfo.nameKk : locale === 'en' ? seasonData.seasonInfo.nameEn : seasonData.seasonInfo.nameRu)
    : '—';

  const currentRank = seasonData?.rank;
  const nextRank = currentRank
    ? SEASON_RANKS.find(r => r.minRating > (seasonData?.seasonRating ?? 0))
    : null;

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

        {/* Panel */}
        <div className="relative w-full sm:max-w-lg max-h-[92dvh] flex flex-col rounded-t-2xl sm:rounded-2xl overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #0d1b2a 0%, #0a1628 50%, #0d1b2a 100%)', border: '1px solid rgba(251,191,36,0.2)' }}>

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-4 border-b border-amber-700/20">
            <div className="flex items-center gap-2">
              <Flame className="w-5 h-5 text-orange-400" />
              <span className="font-bold text-amber-100 text-lg">
                {locale === 'kk' ? 'Маусым' : locale === 'en' ? 'Season' : 'Сезон'}
              </span>
            </div>
            <button onClick={onClose} className="text-amber-200/50 hover:text-amber-100 transition-colors p-1">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Season name + timer */}
          <div className="px-5 py-4 text-center border-b border-amber-700/10">
            <div className="text-amber-400 font-bold text-xl mb-1">{seasonName}</div>
            <div className="flex items-center justify-center gap-2 text-amber-200/60 text-sm">
              <Clock className="w-4 h-4" />
              <span>
                {locale === 'kk' ? 'Аяқталуға дейін:' : locale === 'en' ? 'Ends in:' : 'До конца:'} {timeLeft}
              </span>
            </div>
            {/* Premium note */}
            <div className="mt-2 text-xs text-amber-200/40 italic">
              {locale === 'kk'
                ? '★ Премиум сезондық рейтингке бонус бермейді'
                : locale === 'en'
                  ? '★ Premium does not grant bonuses to season rating'
                  : '★ Премиум не даёт бонус к сезонному рейтингу'}
            </div>
          </div>

          {/* Tabs */}
          <div className="flex border-b border-amber-700/20">
            {(['info', 'leaderboard', 'ranks'] as const).map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2.5 text-sm font-medium transition-colors ${activeTab === tab ? 'text-amber-300 border-b-2 border-amber-400' : 'text-amber-200/50 hover:text-amber-200'}`}
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

                {/* Season end reward preview */}
                <div className="rounded-xl p-4 space-y-2" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.15)' }}>
                  <div className="flex items-center gap-2 text-amber-300 font-semibold text-sm">
                    <Trophy className="w-4 h-4" />
                    <span>{locale === 'kk' ? 'Маусым соңындағы сыйақы' : locale === 'en' ? 'End of season reward' : 'Награда за сезон'}</span>
                  </div>
                  {currentRank && (() => {
                    const rewardDef = SEASON_REWARD_DEFS.find(r => r.rankKey === currentRank.key);
                    if (!rewardDef) return null;
                    return (
                      <div className="text-amber-100 text-sm space-y-1">
                        <div>⊛ {rewardDef.shanyraks.toLocaleString()} {locale === 'kk' ? 'шаңырақ' : 'шаныраков'}</div>
                        {rewardDef.tenge > 0 && <div>💎 {rewardDef.tenge} {locale === 'kk' ? 'теңге' : locale === 'en' ? 'tenge' : 'тенге'}</div>}
                        {rewardDef.avatarId && <div>🖼 {locale === 'kk' ? 'Аватар' : locale === 'en' ? 'Avatar' : 'Аватарка'}: {rewardDef.avatarId}</div>}
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
                          <img
                            src={entry.avatarUrl || getAvatarUrl(entry.avatarId ?? 'wolf')}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover flex-shrink-0"
                            style={isTop3 ? { boxShadow: '0 0 6px rgba(234,179,8,0.5)' } : undefined}
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
          </div>
        </div>
      </div>

      {/* Reward popup */}
      {rewardPopupKey && (
        <RewardPopup
          rankKey={rewardPopupKey}
          locale={locale}
          onClose={() => setRewardPopupKey(null)}
        />
      )}
    </>
  );
}
