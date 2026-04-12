/**
 * AchievementsModal — full-screen modal showing all achievements with progress,
 * unlock status, and claim buttons.
 *
 * Design matches the existing ShopModal pattern:
 * - Fixed full-screen overlay with dark backdrop
 * - Bordered gradient panel
 * - Tab bar for categories
 * - Cards with progress bars and claim buttons
 */
import { useState } from 'react';
import { X, Trophy, Lock, CheckCircle, Gift } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useTranslation } from '@/i18n';
import { toast } from 'sonner';
import type { AchievementDef } from '../../../shared/achievements';

interface AchievementsModalProps {
  open: boolean;
  onClose: () => void;
  onRewardClaimed?: () => void;
}

type Category = 'all' | 'beginner' | 'combat' | 'special' | 'grind' | 'collector';

const CATEGORY_LABELS: Record<Category, { ru: string; kk: string; en: string }> = {
  all:       { ru: 'Все',         kk: 'Барлығы',       en: 'All' },
  beginner:  { ru: 'Начало',      kk: 'Бастама',        en: 'Start' },
  combat:    { ru: 'Бой',         kk: 'Шайқас',         en: 'Combat' },
  special:   { ru: 'Особые',      kk: 'Ерекше',         en: 'Special' },
  grind:     { ru: 'Прогресс',    kk: 'Прогресс',       en: 'Progress' },
  collector: { ru: 'Коллекция',   kk: 'Коллекция',      en: 'Collection' },
};

export default function AchievementsModal({ open, onClose, onRewardClaimed }: AchievementsModalProps) {
  const { locale } = useTranslation();
  const [activeCategory, setActiveCategory] = useState<Category>('all');
  const [claimingKey, setClaimingKey] = useState<string | null>(null);

  const { data: achievements = [], refetch } = trpc.achievements.list.useQuery(undefined, {
    enabled: open,
    refetchOnWindowFocus: false,
  });

  const claimMutation = trpc.achievements.claim.useMutation({
    onSuccess: (result, variables) => {
      const msgs = {
        ru: `Получено: ${result.shanyrakAwarded ? `+${result.shanyrakAwarded?.toLocaleString()} ₸` : ''}${result.tengeAwarded ? ` +${result.tengeAwarded} тенге` : ''}`,
        kk: `Алынды: ${result.shanyrakAwarded ? `+${result.shanyrakAwarded?.toLocaleString()} ₸` : ''}${result.tengeAwarded ? ` +${result.tengeAwarded} теңге` : ''}`,
        en: `Claimed: ${result.shanyrakAwarded ? `+${result.shanyrakAwarded?.toLocaleString()} ₸` : ''}${result.tengeAwarded ? ` +${result.tengeAwarded} tenge` : ''}`,
      };
      toast.success(msgs[locale as keyof typeof msgs] ?? msgs.ru);
      refetch();
      onRewardClaimed?.();
      setClaimingKey(null);
    },
    onError: () => {
      const msgs = { ru: 'Ошибка при получении награды', kk: 'Сыйлық алу қатесі', en: 'Failed to claim reward' };
      toast.error(msgs[locale as keyof typeof msgs] ?? msgs.ru);
      setClaimingKey(null);
    },
  });

  if (!open) return null;

  const getName = (a: typeof achievements[0]) =>
    locale === 'kk' ? a.nameKk : locale === 'en' ? a.nameEn : a.nameRu;
  const getDesc = (a: typeof achievements[0]) =>
    locale === 'kk' ? a.descKk : locale === 'en' ? a.descEn : a.descRu;

  const filtered = activeCategory === 'all'
    ? achievements
    : achievements.filter(a => a.category === activeCategory);

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;
  const unclaimedCount = achievements.filter(a => a.unlocked && !a.claimed).length;

  const titleLabel = { ru: 'Достижения', kk: 'Жетістіктер', en: 'Achievements' }[locale as string] ?? 'Достижения';
  const progressLabel = { ru: `${unlockedCount}/${totalCount} открыто`, kk: `${unlockedCount}/${totalCount} ашылды`, en: `${unlockedCount}/${totalCount} unlocked` }[locale as string] ?? `${unlockedCount}/${totalCount}`;
  const claimLabel = { ru: 'Получить', kk: 'Алу', en: 'Claim' }[locale as string] ?? 'Получить';
  const claimedLabel = { ru: 'Получено', kk: 'Алынды', en: 'Claimed' }[locale as string] ?? 'Получено';
  const lockedLabel = { ru: 'Заблокировано', kk: 'Жабық', en: 'Locked' }[locale as string] ?? 'Заблокировано';
  const humanOnlyLabel = {
    ru: 'Засчитывается только в играх с реальными людьми (менее 33% ботов)',
    kk: 'Тек нақты адамдармен ойындарда есептеледі (33%-дан аз бот)',
    en: 'Only counts in games with real people (less than 33% bots)',
  }[locale as string] ?? '';
  const unclaimedLabel = {
    ru: `${unclaimedCount} награды ожидают получения`,
    kk: `${unclaimedCount} сыйлық күтуде`,
    en: `${unclaimedCount} rewards pending`,
  }[locale as string] ?? '';

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
        className="relative w-full sm:max-w-lg sm:mx-4 flex flex-col"
        style={{
          background: 'linear-gradient(180deg, #0e1e36 0%, #060e1a 100%)',
          border: '1px solid rgba(201,168,76,0.25)',
          borderRadius: '16px 16px 0 0',
          maxHeight: '90vh',
          height: '90vh',
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
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors"
            style={{ color: 'rgba(201,168,76,0.6)' }}
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

        {/* Category tabs */}
        <div
          className="flex gap-1 px-4 py-2 overflow-x-auto shrink-0"
          style={{ borderBottom: '1px solid rgba(201,168,76,0.1)' }}
        >
          {(Object.keys(CATEGORY_LABELS) as Category[]).map(cat => {
            const label = CATEGORY_LABELS[cat];
            const catLabel = locale === 'kk' ? label.kk : locale === 'en' ? label.en : label.ru;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className="px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-all"
                style={{
                  background: isActive ? 'rgba(201,168,76,0.2)' : 'rgba(255,255,255,0.04)',
                  border: `1px solid ${isActive ? 'rgba(201,168,76,0.5)' : 'rgba(255,255,255,0.08)'}`,
                  color: isActive ? '#c9a84c' : 'rgba(201,168,76,0.5)',
                }}
              >
                {catLabel}
              </button>
            );
          })}
        </div>

        {/* Achievement list */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-2">
          {filtered.map(ach => {
            const isUnlocked = ach.unlocked;
            const isClaimed = ach.claimed;
            const progress = ach.progress ?? 0;
            const maxProg = ach.maxProgress;
            const progressPct = maxProg > 1 ? Math.min(100, Math.round((progress / maxProg) * 100)) : (isUnlocked ? 100 : 0);
            const rewardText = [
              ach.reward.shanyrak ? `+${ach.reward.shanyrak.toLocaleString()} ₸` : '',
              ach.reward.tenge ? `+${ach.reward.tenge} тенге` : '',
            ].filter(Boolean).join(' ');

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
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
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
                      style={{ color: isUnlocked ? '#c9a84c' : 'rgba(201,168,76,0.5)' }}
                    >
                      {getName(ach)}
                    </span>
                    {isClaimed && <CheckCircle className="w-3.5 h-3.5 shrink-0" style={{ color: '#4ade80' }} />}
                  </div>
                  <p className="text-xs leading-tight mb-2" style={{ color: 'rgba(201,168,76,0.45)' }}>
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
                    <span className="text-xs font-semibold" style={{ color: '#f0d060' }}>
                      {rewardText}
                    </span>
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
      </div>
    </div>
  );
}
