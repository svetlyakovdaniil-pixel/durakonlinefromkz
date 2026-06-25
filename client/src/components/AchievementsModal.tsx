/**
 * AchievementsModal — full-screen modal showing all achievements with progress,
 * unlock status, and claim buttons.
 *
 * Sort order: claimable (unlocked & unclaimed) → locked → claimed
 */
import { useState } from 'react';
import { X, Trophy, Lock, CheckCircle, Gift } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useTranslation } from '@/i18n';
import { toast } from 'sonner';
import { getAssetUrl } from '@/lib/assetUrl';

const SHANYRAK_ICON = getAssetUrl('/assets/static/shanyrak_96e91a49.png');
const TENGE_ICON = getAssetUrl('/assets/static/tenge_9aefd1b7.png');

interface AchievementsModalProps {
  open: boolean;
  onClose: () => void;
  onRewardClaimed?: () => void;
}

export default function AchievementsModal({ open, onClose, onRewardClaimed }: AchievementsModalProps) {
  const { locale, t } = useTranslation();
  const [claimingKey, setClaimingKey] = useState<string | null>(null);

  const { data: achievements = [], refetch } = trpc.achievements.list.useQuery(undefined, {
    enabled: open,
    refetchOnWindowFocus: false,
  });

  const claimMutation = trpc.achievements.claim.useMutation({
    onSuccess: (result) => {
      const msgs = {
        ru: `Получено: ${result.shanyrakAwarded ? `+${result.shanyrakAwarded.toLocaleString()} шаныраков` : ''}${result.tengeAwarded ? ` +${result.tengeAwarded} тенге` : ''}`,
        kk: `Алынды: ${result.shanyrakAwarded ? `+${result.shanyrakAwarded.toLocaleString()} шаңырақ` : ''}${result.tengeAwarded ? ` +${result.tengeAwarded} теңге` : ''}`,
        en: `Claimed: ${result.shanyrakAwarded ? `+${result.shanyrakAwarded.toLocaleString()} shanyrak` : ''}${result.tengeAwarded ? ` +${result.tengeAwarded} tenge` : ''}`,
        uk: `Отримано: ${result.shanyrakAwarded ? `+${result.shanyrakAwarded.toLocaleString()} шаніраків` : ''}${result.tengeAwarded ? ` +${result.tengeAwarded} тенге` : ''}`,
        ka: `მიღებულია: ${result.shanyrakAwarded ? `+${result.shanyrakAwarded.toLocaleString()} შანირაკი` : ''}${result.tengeAwarded ? ` +${result.tengeAwarded} თენგე` : ''}`,
        az: `Alındı: ${result.shanyrakAwarded ? `+${result.shanyrakAwarded.toLocaleString()} şanyrak` : ''}${result.tengeAwarded ? ` +${result.tengeAwarded} tenge` : ''}`,
        uz: `Olindi: ${result.shanyrakAwarded ? `+${result.shanyrakAwarded.toLocaleString()} shanyrak` : ''}${result.tengeAwarded ? ` +${result.tengeAwarded} tenge` : ''}`,
        pl: `Odebrano: ${result.shanyrakAwarded ? `+${result.shanyrakAwarded.toLocaleString()} szaniraków` : ''}${result.tengeAwarded ? ` +${result.tengeAwarded} tenge` : ''}`,
      };
      toast.success(msgs[locale as keyof typeof msgs] ?? msgs.ru);
      refetch();
      onRewardClaimed?.();
      setClaimingKey(null);
    },
    onError: () => {
      const msgs = { ru: 'Ошибка при получении награды', kk: 'Сыйлық алу қатесі', en: 'Failed to claim reward', uk: 'Помилка при отриманні нагороди', ka: 'ჯილდოს მიღების შეცდომა', az: 'Mükafat alınmasında xəta', uz: 'Mukofot olishda xato', pl: 'Błąd przy odbieraniu nagrody' };
      toast.error(msgs[locale as keyof typeof msgs] ?? msgs.ru);
      setClaimingKey(null);
    },
  });

  if (!open) return null;

  const getName = (a: typeof achievements[0]) =>
    locale === 'kk' ? a.nameKk : locale === 'en' ? a.nameEn : locale === 'uk' ? (a.nameUk ?? a.nameRu) : locale === 'ka' ? (a.nameKa ?? a.nameRu) : locale === 'az' ? (a.nameAz ?? a.nameRu) : locale === 'uz' ? (a.nameUz ?? a.nameRu) : locale === 'pl' ? ((a as any).namePl ?? a.nameRu) : a.nameRu;
  const getDesc = (a: typeof achievements[0]) =>
    locale === 'kk' ? a.descKk : locale === 'en' ? a.descEn : locale === 'uk' ? (a.descUk ?? a.descRu) : locale === 'ka' ? (a.descKa ?? a.descRu) : locale === 'az' ? (a.descAz ?? a.descRu) : locale === 'uz' ? (a.descUz ?? a.descRu) : locale === 'pl' ? ((a as any).descPl ?? a.descRu) : a.descRu;

  // Sort: claimable first (unlocked & not claimed), then locked, then claimed
  const sorted = [...achievements].sort((a, b) => {
    const rank = (x: typeof achievements[0]) => {
      if (x.unlocked && !x.claimed) return 0; // claimable
      if (!x.unlocked) return 1;              // locked
      return 2;                               // claimed
    };
    return rank(a) - rank(b);
  });

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const unclaimedCount = achievements.filter(a => a.unlocked && !a.claimed).length;

  const titleLabel = ({ ru: 'Достижения', kk: 'Жетістіктер', en: 'Achievements', uk: 'Досягнення', ka: 'მიღწევები', az: 'Nailiyyətlər', uz: 'Yutuqlar', pl: 'Osiągnięcia' } as Record<string,string>)[locale] ?? 'Достижения';
  const progressLabel = ({
    ru: `${unlockedCount}/${totalCount} открыто`,
    kk: `${unlockedCount}/${totalCount} ашылды`,
    en: `${unlockedCount}/${totalCount} unlocked`,
    uk: `${unlockedCount}/${totalCount} відкрито`,
    ka: `${unlockedCount}/${totalCount} გახსნილი`,
    az: `${unlockedCount}/${totalCount} açıldı`,
    uz: `${unlockedCount}/${totalCount} ochildi`,
    pl: `${unlockedCount}/${totalCount} odblokowano`,
  } as Record<string,string>)[locale] ?? `${unlockedCount}/${totalCount}`;
  const claimLabel = ({ ru: 'Получить', kk: 'Алу', en: 'Claim', uk: 'Отримати', ka: 'მიღება', az: 'Al', uz: 'Olish', pl: 'Odbierz' } as Record<string,string>)[locale] ?? 'Получить';
  const claimedLabel = ({ ru: 'Получено', kk: 'Алынды', en: 'Claimed', uk: 'Отримано', ka: 'მიღებულია', az: 'Alındı', uz: 'Olindi', pl: 'Odebrano' } as Record<string,string>)[locale] ?? 'Получено';
  const lockedLabel = ({ ru: 'Заблокировано', kk: 'Жабық', en: 'Locked', uk: 'Заблоковано', ka: 'დაბლოკილი', az: 'Kilidli', uz: 'Qulflangan', pl: 'Zablokowane' } as Record<string,string>)[locale] ?? 'Заблокировано';
  const humanOnlyLabel = ({
    ru: 'Засчитывается только в играх с реальными людьми (менее 33.4% ботов)',
    kk: 'Тек нақты адамдармен ойындарда есептеледі (33.4%-дан аз бот)',
    en: 'Only counts in games with real people (less than 33.4% bots)',
    uk: 'Зараховується лише в іграх з реальними людьми (менше 33.4% ботів)',
    ka: 'ითვლება მხოლოდ რეალურ ადამიანებთან თამაშებში (33.4%-ზე ნაკლები ბოტი)',
    az: 'Yalnız real insanlarla oyunlarda sayılır (33.4%-dən az bot)',
    uz: 'Faqat haqiqiy odamlar bilan o\'yinlarda hisoblanadi (33.4% dan kam bot)',
    pl: 'Liczy się tylko w grach z prawdziwymi ludźmi (mniej niż 33.4% botów)',
  } as Record<string,string>)[locale] ?? '';
  const unclaimedLabel = ({
    ru: `${unclaimedCount} награды ожидают получения`,
    kk: `${unclaimedCount} сыйлық күтуде`,
    en: `${unclaimedCount} rewards pending`,
    uk: `${unclaimedCount} нагород очікують отримання`,
    ka: `${unclaimedCount} ჯილდობა ლოდის მიღება`,
    az: `${unclaimedCount} mükəfat gözləyir`,
    uz: `${unclaimedCount} mukofot kutilmoqda`,
    pl: `${unclaimedCount} nagród czeka`,
  } as Record<string,string>)[locale] ?? '';

  const handleClaim = (key: string) => {
    setClaimingKey(key);
    claimMutation.mutate({ achievementKey: key });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.75)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="relative w-full sm:max-w-lg sm:mx-4 flex flex-col h-[92dvh] sm:h-auto sm:max-h-[90vh] rounded-t-2xl sm:rounded-2xl"
        style={{
          background: 'linear-gradient(180deg, #0e1e36 0%, #060e1a 100%)',
          border: '1px solid rgba(201,168,76,0.25)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3 shrink-0"
          style={{ borderBottom: '1px solid rgba(201,168,76,0.15)' }}
        >
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5" style={{ color: '#c9a84c' }} />
            <span className="font-bold text-base" style={{ color: '#c9a84c' }}>{titleLabel}</span>
            <span className="text-xs text-amber-100/50 ml-1">{progressLabel}</span>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors bg-amber-900/40 border border-amber-600/30 hover:bg-amber-800/60"
            style={{ color: 'rgba(201,168,76,0.9)' }}
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Unclaimed banner */}
        {unclaimedCount > 0 && (
          <div
            className="mx-4 mt-3 px-3 py-2 rounded-lg flex items-center gap-2 shrink-0"
            style={{ background: 'rgba(201,168,76,0.12)', border: '1px solid rgba(201,168,76,0.3)' }}
          >
            <Gift className="w-4 h-4 shrink-0" style={{ color: '#c9a84c' }} />
            <span className="text-xs font-semibold" style={{ color: '#c9a84c' }}>{unclaimedLabel}</span>
          </div>
        )}

        {/* Human-only notice */}
        <div
          className="mx-4 mt-2 px-3 py-1.5 rounded-lg shrink-0"
          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
        >
          <span className="text-[11px] text-amber-100/40 leading-tight">{humanOnlyLabel}</span>
        </div>

        {/* Achievement list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2 pb-4">
          {sorted.map(ach => {
            const isUnlocked = ach.unlocked;
            const isClaimed = ach.claimed;
            const progress = ach.progress ?? 0;
            const maxProg = ach.maxProgress;
            const progressPct = maxProg > 1 ? Math.min(100, Math.round((progress / maxProg) * 100)) : (isUnlocked ? 100 : 0);

            return (
              <div
                key={ach.key}
                className="rounded-xl p-3 flex items-start gap-3"
                style={{
                  background: isUnlocked
                    ? 'linear-gradient(135deg, rgba(201,168,76,0.12) 0%, rgba(201,168,76,0.04) 100%)'
                    : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${isUnlocked ? 'rgba(201,168,76,0.3)' : 'rgba(255,255,255,0.07)'}`,
                  opacity: isClaimed ? 0.6 : 1,
                }}
              >
                {/* Icon */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: isUnlocked ? 'rgba(201,168,76,0.15)' : 'rgba(255,255,255,0.05)',
                    fontSize: '20px',
                  }}
                >
                  {isUnlocked ? ach.icon : <Lock className="w-4 h-4" style={{ color: 'rgba(255,255,255,0.3)' }} />}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span
                      className="font-bold text-sm leading-tight"
                      style={{ color: isUnlocked ? '#c9a84c' : 'rgba(255,255,255,0.75)' }}
                    >
                      {getName(ach)}
                    </span>
                    {isClaimed && <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#4ade80' }} />}
                  </div>
                  <p className="text-xs leading-tight mb-2" style={{ color: isUnlocked ? 'rgba(201,168,76,0.65)' : 'rgba(255,255,255,0.45)' }}>
                    {getDesc(ach)}
                  </p>

                  {/* Progress bar (only for multi-step achievements) */}
                  {maxProg > 1 && (
                    <div className="mb-2">
                      <div
                        className="w-full h-1.5 rounded-full overflow-hidden"
                        style={{ background: 'rgba(255,255,255,0.08)' }}
                      >
                        <div
                          className="h-full rounded-full transition-all"
                          style={{
                            width: `${progressPct}%`,
                            background: isUnlocked
                              ? 'linear-gradient(90deg, #c9a84c, #f0d060)'
                              : 'rgba(201,168,76,0.4)',
                          }}
                        />
                      </div>
                      <span className="text-[10px] mt-0.5 block" style={{ color: 'rgba(201,168,76,0.4)' }}>
                        {progress.toLocaleString()} / {maxProg.toLocaleString()}
                      </span>
                    </div>
                  )}

                  {/* Reward + claim */}
                  <div className="flex items-center justify-between gap-2">
                    {/* Shanyrak reward — green with icon */}
                    <div className="flex items-center gap-1">
                      {ach.reward.shanyrak ? (
                        <>
                          <img src={SHANYRAK_ICON} alt="" className="w-4 h-4 object-contain" />
                          <span className="text-xs font-semibold text-green-400">
                            +{ach.reward.shanyrak.toLocaleString()}
                          </span>
                        </>
                      ) : null}
                      {ach.reward.tenge ? (
                        <span className="flex items-center gap-0.5 ml-1">
                          <span className="text-xs font-semibold" style={{ color: '#f0d060' }}>+{ach.reward.tenge}</span>
                          <img src={TENGE_ICON} alt="тенге" className="w-4 h-4 object-contain" />
                        </span>
                      ) : null}
                    </div>

                    {isUnlocked && !isClaimed && (
                      <button
                        onClick={() => handleClaim(ach.key)}
                        disabled={claimingKey === ach.key}
                        className="px-3 py-1 rounded-full text-xs font-bold transition-all active:scale-95"
                        style={{
                          background: 'linear-gradient(135deg, #c9a84c 0%, #f0d060 100%)',
                          color: '#0a1628',
                          opacity: claimingKey === ach.key ? 0.6 : 1,
                        }}
                      >
                        {claimingKey === ach.key ? '...' : claimLabel}
                      </button>
                    )}
                    {isClaimed && (
                      <span className="text-xs font-semibold" style={{ color: '#4ade80' }}>
                        {claimedLabel}
                      </span>
                    )}
                    {!isUnlocked && (
                      <span className="text-xs" style={{ color: 'rgba(255,255,255,0.2)' }}>
                        {lockedLabel}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Fixed close button at bottom */}
        <div
          className="px-4 py-3 shrink-0"
          style={{
            borderTop: '1px solid rgba(201,168,76,0.15)',
            paddingBottom: 'max(24px, calc(env(safe-area-inset-bottom, 0px) + 16px))',
          }}
        >
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-sm"
            style={{
              background: 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(201,168,76,0.08) 100%)',
              border: '1px solid rgba(201,168,76,0.35)',
              color: '#c9a84c',
            }}
          >
            {t('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
