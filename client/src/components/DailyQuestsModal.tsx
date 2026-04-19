/**
 * DailyQuestsModal — shows today's 4 daily quests with progress bars and claim buttons.
 * Quests reset at 00:00 Moscow time (UTC+3).
 * Premium players can swap any uncompleted quest (up to 3 times/day).
 */
import { useState } from 'react';
import { X, Calendar, CheckCircle, Lock, Gift, Clock, RefreshCw, Crown } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useTranslation } from '@/i18n';
import { toast } from 'sonner';

const SHANYRAK_ICON = '/assets/static/shanyrak_96e91a49.png';

interface DailyQuestsModalProps {
  open: boolean;
  onClose: () => void;
  onRewardClaimed?: () => void;
}

/** Returns time until next Moscow midnight (00:00 UTC+3) */
function getTimeUntilReset(): string {
  const now = new Date();
  const moscowOffset = 3 * 60; // UTC+3 in minutes
  const moscowNow = new Date(now.getTime() + (moscowOffset - now.getTimezoneOffset()) * 60000);
  const nextMidnight = new Date(moscowNow);
  nextMidnight.setHours(24, 0, 0, 0);
  const diffMs = nextMidnight.getTime() - moscowNow.getTime();
  const h = Math.floor(diffMs / 3600000);
  const m = Math.floor((diffMs % 3600000) / 60000);
  return `${h}ч ${m}м`;
}

export default function DailyQuestsModal({ open, onClose, onRewardClaimed }: DailyQuestsModalProps) {
  const { locale, t } = useTranslation();
  const [claimingKey, setClaimingKey] = useState<string | null>(null);
  const [swappingKey, setSwappingKey] = useState<string | null>(null);

  const { data: quests = [], refetch, isLoading } = trpc.dailyQuests.today.useQuery(undefined, {
    enabled: open,
    refetchOnWindowFocus: false,
  });

  // Fetch premium status to know if player has premium + swaps remaining
  const { data: premiumStatus } = trpc.premium.status.useQuery(undefined, {
    enabled: open,
    refetchOnWindowFocus: false,
  });

  const isPremium = premiumStatus?.isPremium ?? false;
  const swapsRemaining = premiumStatus?.swapsRemaining ?? 0;

  const claimMutation = trpc.dailyQuests.claim.useMutation({
    onSuccess: (result) => {
      const msgs = {
        ru: `Получено: +${result.shanyrakAwarded?.toLocaleString() ?? 0} шаныраков`,
        kk: `Алынды: +${result.shanyrakAwarded?.toLocaleString() ?? 0} шаңырақ`,
        en: `Claimed: +${result.shanyrakAwarded?.toLocaleString() ?? 0} shanyrak`,
        uk: `Отримано: +${result.shanyrakAwarded?.toLocaleString() ?? 0} шаніраків`,
      };
      toast.success(msgs[locale as keyof typeof msgs] ?? msgs.ru);
      refetch();
      onRewardClaimed?.();
      setClaimingKey(null);
    },
    onError: () => {
      const msgs = { ru: 'Ошибка при получении награды', kk: 'Сыйлық алу қатесі', en: 'Failed to claim reward', uk: 'Помилка при отриманні нагороди' };
      toast.error(msgs[locale as keyof typeof msgs] ?? msgs.ru);
      setClaimingKey(null);
    },
  });

  const swapMutation = trpc.premium.swapQuest.useMutation({
    onSuccess: (result) => {
      const msgs = {
        ru: `Задание заменено! Осталось замен сегодня: ${result.remaining}`,
        kk: `Тапсырма ауыстырылды! Бүгін қалды: ${result.remaining}`,
        en: `Quest swapped! Swaps remaining today: ${result.remaining}`,
        uk: `Завдання замінено! Залишилось замін сьогодні: ${result.remaining}`,
      };
      toast.success(msgs[locale as keyof typeof msgs] ?? msgs.ru);
      refetch();
      setSwappingKey(null);
    },
    onError: (err) => {
      const isNoSwaps = err.message?.includes('No swaps');
      const msgs = isNoSwaps
        ? { ru: 'Лимит замен на сегодня исчерпан (3/3)', kk: 'Бүгінгі ауыстыру лимиті таусылды (3/3)', en: 'Daily swap limit reached (3/3)', uk: 'Ліміт замін на сьогодні вичерпано (3/3)' }
        : { ru: 'Ошибка замены задания', kk: 'Тапсырманы ауыстыру қатесі', en: 'Failed to swap quest', uk: 'Помилка заміни завдання' };
      toast.error(msgs[locale as keyof typeof msgs] ?? msgs.ru);
      setSwappingKey(null);
    },
  });

  if (!open) return null;

  const L = {
    title: { ru: 'Ежедневные задания', kk: 'Күнделікті тапсырмалар', en: 'Daily Quests', uk: 'Щоденні завдання' }[locale as string] ?? 'Ежедневные задания',
    reset: { ru: `Сброс через ${getTimeUntilReset()}`, kk: `${getTimeUntilReset()} кейін жаңарады`, en: `Resets in ${getTimeUntilReset()}`, uk: `Скидання через ${getTimeUntilReset()}` }[locale as string] ?? `Resets in ${getTimeUntilReset()}`,
    claim: { ru: 'Получить', kk: 'Алу', en: 'Claim', uk: 'Отримати' }[locale as string] ?? 'Получить',
    claimed: { ru: 'Получено', kk: 'Алынды', en: 'Claimed', uk: 'Отримано' }[locale as string] ?? 'Получено',
    locked: { ru: 'В процессе', kk: 'Орындалуда', en: 'In Progress', uk: 'В процесі' }[locale as string] ?? 'В процессе',
    swap: { ru: 'Заменить', kk: 'Ауыстыру', en: 'Replace', uk: 'Замінити' }[locale as string] ?? 'Заменить',
    swapsLeft: { ru: `Замен: ${swapsRemaining}/3`, kk: `Ауыстыру: ${swapsRemaining}/3`, en: `Swaps: ${swapsRemaining}/3`, uk: `Замін: ${swapsRemaining}/3` }[locale as string] ?? `Замен: ${swapsRemaining}/3`,
    humanOnly: {
      ru: 'Засчитывается только в играх с реальными людьми (менее 33.4% ботов)',
      kk: 'Тек нақты адамдармен ойындарда есептеледі (33.4%-дан аз бот)',
      en: 'Only counts in games with real players (less than 33.4% bots)',
      uk: 'Зараховується тільки в іграх з реальними людьми (менше 33.4% ботів)',
    }[locale as string] ?? 'Засчитывается только в играх с реальными людьми (менее 33.4% ботов)',
    loading: { ru: 'Загрузка...', kk: 'Жүктелуде...', en: 'Loading...', uk: 'Завантаження...' }[locale as string] ?? 'Загрузка...',
    noQuests: { ru: 'Задания не назначены. Сыграйте партию, чтобы получить задания.', kk: 'Тапсырмалар берілмеген. Ойын ойнаңыз.', en: 'No quests assigned. Play a game to get quests.', uk: 'Завдання не призначені. Зіграйте партію, щоб отримати завдання.' }[locale as string] ?? 'Задания не назначены.',
    completed: { ru: 'Выполнено', kk: 'Орындалды', en: 'Completed', uk: 'Виконано' }[locale as string] ?? 'Выполнено',
  };

  const getName = (q: typeof quests[0]) =>
    locale === 'kk' ? q.def.nameKk : locale === 'en' ? q.def.nameEn : locale === 'uk' ? (q.def.nameUk ?? q.def.nameRu) : locale === 'ka' ? (q.def.nameKa ?? q.def.nameRu) : locale === 'az' ? ((q.def as any).nameAz ?? q.def.nameRu) : q.def.nameRu;
  const getDesc = (q: typeof quests[0]) =>
    locale === 'kk' ? q.def.descKk : locale === 'en' ? q.def.descEn : locale === 'uk' ? (q.def.descUk ?? q.def.descRu) : locale === 'ka' ? (q.def.descKa ?? q.def.descRu) : locale === 'az' ? ((q.def as any).descAz ?? q.def.descRu) : q.def.descRu;

  // Sort: claimable first, then in-progress, then claimed
  const sorted = [...quests].sort((a, b) => {
    const rank = (x: typeof quests[0]) => {
      if (x.completed && !x.claimed) return 0; // claimable
      if (!x.completed) return 1;              // in progress
      return 2;                                // claimed
    };
    return rank(a) - rank(b);
  });

  const completedCount = quests.filter((q: (typeof quests)[number]) => q.completed).length;
  const totalCount = quests.length;
  const unclaimedCount = quests.filter((q: (typeof quests)[number]) => q.completed && !q.claimed).length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full sm:max-w-lg bg-[#1a1a2e] border border-white/10 rounded-t-2xl sm:rounded-2xl shadow-2xl flex flex-col h-[100dvh] sm:h-auto sm:max-h-[90vh]"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-white font-bold text-lg leading-tight">{L.title}</h2>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Clock className="w-3 h-3 text-gray-400" />
                <span className="text-gray-400 text-xs">{L.reset}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {totalCount > 0 && (
              <span className="text-sm text-gray-400">
                {completedCount}/{totalCount}
              </span>
            )}
            {unclaimedCount > 0 && (
              <span className="bg-amber-500 text-black text-xs font-bold px-2 py-0.5 rounded-full">
                {unclaimedCount}
              </span>
            )}
            <button
              onClick={onClose}
              className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 border border-white/20 text-gray-300 hover:text-white hover:bg-white/20 transition-colors"
              aria-label="Закрыть"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Human-only notice */}
        <div className="mx-5 mt-4 mb-1 flex-shrink-0">
          <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl px-4 py-2.5 flex items-start gap-2">
            <span className="text-blue-400 text-xs mt-0.5">ℹ️</span>
            <p className="text-blue-300 text-xs leading-relaxed">{L.humanOnly}</p>
          </div>
        </div>

        {/* Premium swap counter — shown only to premium players */}
        {isPremium && (
          <div className="mx-5 mt-2 mb-1 flex-shrink-0">
            <div className="bg-amber-500/10 border border-amber-500/25 rounded-xl px-4 py-2 flex items-center gap-2">
              <Crown className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
              <p className="text-amber-300 text-xs">
                {L.swapsLeft}
              </p>
            </div>
          </div>
        )}

        {/* Quest list */}
        <div className="flex-1 overflow-y-auto px-5 py-3 space-y-3">
          {isLoading ? (
            <div className="text-center text-gray-400 py-8">{L.loading}</div>
          ) : sorted.length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">{L.noQuests}</div>
          ) : (
            sorted.map((quest) => {
              const isClaimable = quest.completed && !quest.claimed;
              const isClaimed = quest.claimed;
              const isInProgress = !quest.completed && !quest.claimed;
              const progress = quest.progress ?? 0;
              const target = quest.def?.target ?? 1;
              const pct = Math.min(100, Math.round((progress / target) * 100));
              const isClaiming = claimingKey === quest.questKey;
              const isSwapping = swappingKey === quest.questKey;
              // Swap button: only for premium, only for uncompleted quests, only if swaps remain
              const canSwap = isPremium && isInProgress && swapsRemaining > 0;

              return (
                <div
                  key={quest.questKey}
                  className={`rounded-xl border p-4 transition-all ${
                    isClaimable
                      ? 'border-amber-500/40 bg-amber-500/5'
                      : isClaimed
                      ? 'border-green-500/20 bg-green-500/5 opacity-60'
                      : 'border-white/8 bg-white/3'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      {/* Title row */}
                      <div className="flex items-center gap-2 mb-1">
                        {isClaimed ? (
                          <CheckCircle className="w-4 h-4 text-green-400 flex-shrink-0" />
                        ) : isClaimable ? (
                          <Gift className="w-4 h-4 text-amber-400 flex-shrink-0" />
                        ) : (
                          <Lock className="w-4 h-4 text-gray-500 flex-shrink-0" />
                        )}
                        <span className={`font-semibold text-sm truncate ${isClaimed ? 'text-green-300' : isClaimable ? 'text-amber-300' : 'text-white'}`}>
                          {getName(quest)}
                        </span>
                      </div>

                      {/* Description */}
                      <p className="text-gray-400 text-xs mb-3 leading-relaxed">{getDesc(quest)}</p>

                      {/* Progress bar */}
                      {!isClaimed && (
                        <div className="mb-2">
                          <div className="flex justify-between items-center mb-1">
                            <span className="text-xs text-gray-500">{progress}/{target}</span>
                            <span className="text-xs text-gray-500">{pct}%</span>
                          </div>
                          <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-500 ${
                                isClaimable ? 'bg-amber-400' : 'bg-blue-500'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      )}

                      {/* Reward */}
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-xs text-gray-500">
                          {t('common.reward')}:
                        </span>
                        <span className="text-green-400 text-xs font-semibold">+{quest.def?.reward?.shanyrak?.toLocaleString()}</span>
                        <img src={SHANYRAK_ICON} alt="shanyrak" className="w-3.5 h-3.5" />
                      </div>
                    </div>

                    {/* Action buttons column */}
                    <div className="flex-shrink-0 ml-2 flex flex-col items-end gap-2">
                      {/* Claim / status button */}
                      {isClaimed ? (
                        <span className="text-green-400 text-xs font-medium">{L.claimed}</span>
                      ) : isClaimable ? (
                        <button
                          onClick={() => {
                            setClaimingKey(quest.questKey);
                            claimMutation.mutate({ questKey: quest.questKey });
                          }}
                          disabled={isClaiming}
                          className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-3 py-1.5 rounded-lg transition-colors disabled:opacity-60 whitespace-nowrap"
                        >
                          {isClaiming ? '...' : L.claim}
                        </button>
                      ) : (
                        <span className="text-gray-500 text-xs">{L.locked}</span>
                      )}

                      {/* Swap button — premium only, in-progress quests only */}
                      {canSwap && (
                        <button
                          onClick={() => {
                            setSwappingKey(quest.questKey);
                            swapMutation.mutate({ questKey: quest.questKey });
                          }}
                          disabled={isSwapping}
                          title={L.swap}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-50 whitespace-nowrap"
                        >
                          <RefreshCw className={`w-3 h-3 ${isSwapping ? 'animate-spin' : ''}`} />
                          {isSwapping ? '...' : L.swap}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 border-t border-white/10 flex-shrink-0"
          style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))' }}
        >
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm font-semibold transition-colors border border-white/20"
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
