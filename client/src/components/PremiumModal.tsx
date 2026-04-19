/**
 * PremiumModal — full-screen modal showing Premium subscription benefits.
 * On native (iOS/Android): uses RevenueCat IAP to purchase 'premium_monthly' ($4.99/mo).
 * On web: shows a "available in mobile app" message.
 */
import { useState } from 'react';
import { X, Crown, Star, Zap, RefreshCw, Percent, Shield, Sparkles, Smartphone } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useTranslation } from '@/i18n';
import { toast } from 'sonner';
import { PremiumFrame } from './PremiumFrame';
import { isIAPAvailable, purchasePremium, restorePurchases } from '@/lib/iap';
import { Capacitor } from '@capacitor/core';
const TENGE_ICON = '/assets/static/tenge_9aefd1b7.png';

interface PremiumModalProps {
  open: boolean;
  onClose: () => void;
}

const TEXTS = {
  ru: {
    title: 'PREMIUM',
    subtitle: 'Стань лучшим игроком степи',
    active: 'Активен',
    expires: 'Истекает',
    days: 'дн.',
    buyBtn: 'Купить за $4.99',
    buyBtnWeb: 'Доступно в мобильном приложении',
    insufficientFunds: 'Недостаточно тенге',
    alreadyActive: 'Премиум уже активен',
    buySuccess: 'Премиум активирован! Приятной игры 🎉',
    buyError: 'Ошибка покупки. Попробуйте ещё раз',
    webOnlyHint: 'Для покупки Premium скачайте мобильное приложение',
    benefits: [
      {
        icon: 'star',
        title: '+100% к рейтингу',
        desc: 'Вы получаете вдвое больше очков рейтинга за каждую игру',
      },
      {
        icon: 'percent',
        title: '+50% рейтинга для всех за столом',
        desc: 'Все игроки за вашим столом получают +50% к рейтингу (не суммируется с несколькими премиум-игроками)',
      },
      {
        icon: 'refresh',
        title: '3 замены заданий в день',
        desc: 'Не нравится задание? Замените его на другое — до 3 раз в день',
      },
      {
        icon: 'shield',
        title: 'Скидки в магазине',
        desc: 'Специальные цены на все товары в магазине для премиум-игроков',
      },
      {
        icon: 'sparkles',
        title: 'Золотая комната',
        desc: 'Ваши комнаты подсвечиваются золотым и всегда отображаются вверху списка',
      },
      {
        icon: 'crown',
        title: 'Уникальная рамка PREMIUM',
        desc: 'Эксклюзивная анимированная рамка профиля с золотыми монетами — недоступна в магазине',
      },
    ],
    frameTitle: 'Рамка профиля PREMIUM',
    frameDesc: 'Эксклюзивно для подписчиков',
    botRule: 'Бонус к рейтингу засчитывается только в играх с менее чем 33.4% ботов',
    perMonth: '/ месяц',
    restoreBtn: 'Восстановить покупки',
    restoreSuccess: 'Покупки восстановлены! Премиум активирован 🎉',
    restoreNone: 'Активных подписок не найдено',
    restoreError: 'Ошибка восстановления. Попробуйте ещё раз',
  },
  kk: {
    title: 'PREMIUM',
    subtitle: 'Дала ойыншысының үздігі бол',
    active: 'Белсенді',
    expires: 'Аяқталады',
    days: 'күн',
    buyBtn: '$4.99-ға сатып ал',
    buyBtnWeb: 'Мобильді қосымшада қол жетімді',
    insufficientFunds: 'Теңге жеткіліксіз',
    alreadyActive: 'Премиум белсенді',
    buySuccess: 'Премиум белсендірілді! Жақсы ойын 🎉',
    buyError: 'Сатып алу қатесі. Қайталап көріңіз',
    webOnlyHint: 'Premium сатып алу үшін мобильді қосымшаны жүктеп алыңыз',
    benefits: [
      {
        icon: 'star',
        title: 'Рейтингке +100%',
        desc: 'Әр ойын үшін рейтинг ұпайларын екі есе аласыз',
      },
      {
        icon: 'percent',
        title: 'Үстелдегі барлығына +50% рейтинг',
        desc: 'Үстелдегі барлық ойыншылар рейтингке +50% алады',
      },
      {
        icon: 'refresh',
        title: 'Күніне 3 тапсырма ауыстыру',
        desc: 'Тапсырма ұнамаса? Күніне 3 рет ауыстырыңыз',
      },
      {
        icon: 'shield',
        title: 'Дүкенде жеңілдіктер',
        desc: 'Премиум ойыншыларға арнайы бағалар',
      },
      {
        icon: 'sparkles',
        title: 'Алтын бөлме',
        desc: 'Бөлмелеріңіз алтынмен жарқырайды және тізімнің жоғарысында тұрады',
      },
      {
        icon: 'crown',
        title: 'PREMIUM ерекше жақтауы',
        desc: 'Алтын тиындармен эксклюзивті анимациялық профиль жақтауы',
      },
    ],
    frameTitle: 'PREMIUM профиль жақтауы',
    frameDesc: 'Жазылушыларға ғана',
    botRule: 'Рейтинг бонусы тек 33.4%-дан аз бот бар ойындарда есептеледі',
    perMonth: '/ ай',
    restoreBtn: 'Сатып алуларды қалпына келтіру',
    restoreSuccess: 'Сатып алулар қалпына келтірілді! Премиум белсенді 🎉',
    restoreNone: 'Белсенді жазылым табылмады',
    restoreError: 'Қалпына келтіру қатесі. Қайталап көріңіз',
  },
  en: {
    title: 'PREMIUM',
    subtitle: 'Become the best player of the steppe',
    active: 'Active',
    expires: 'Expires',
    days: 'd.',
    buyBtn: 'Buy for $4.99',
    buyBtnWeb: 'Available in mobile app',
    insufficientFunds: 'Insufficient tenge',
    alreadyActive: 'Premium is already active',
    buySuccess: 'Premium activated! Enjoy the game 🎉',
    buyError: 'Purchase failed. Please try again',
    webOnlyHint: 'Download the mobile app to purchase Premium',
    benefits: [
      {
        icon: 'star',
        title: '+100% Rating',
        desc: 'You earn twice as many rating points for every game',
      },
      {
        icon: 'percent',
        title: '+50% Rating for everyone at the table',
        desc: 'All players at your table get +50% rating (does not stack with multiple premium players)',
      },
      {
        icon: 'refresh',
        title: '3 quest swaps per day',
        desc: "Don't like a quest? Swap it for another — up to 3 times per day",
      },
      {
        icon: 'shield',
        title: 'Shop discounts',
        desc: 'Special prices on all shop items for premium players',
      },
      {
        icon: 'sparkles',
        title: 'Golden room',
        desc: 'Your rooms glow gold and always appear at the top of the list',
      },
      {
        icon: 'crown',
        title: 'Exclusive PREMIUM frame',
        desc: 'Exclusive animated profile frame with gold coins — unavailable in the shop',
      },
    ],
    frameTitle: 'PREMIUM Profile Frame',
    frameDesc: 'Exclusive to subscribers',
    botRule: 'Rating bonus only counts in games with less than 33.4% bots',
    perMonth: '/ month',
    restoreBtn: 'Restore Purchases',
    restoreSuccess: 'Purchases restored! Premium activated 🎉',
    restoreNone: 'No active subscriptions found',
    restoreError: 'Restore failed. Please try again',
  },
};

function BenefitIcon({ type }: { type: string }) {
  const cls = 'w-5 h-5 text-yellow-400';
  switch (type) {
    case 'star': return <Star className={cls} />;
    case 'percent': return <Percent className={cls} />;
    case 'refresh': return <RefreshCw className={cls} />;
    case 'shield': return <Shield className={cls} />;
    case 'sparkles': return <Sparkles className={cls} />;
    case 'crown': return <Crown className={cls} />;
    default: return <Zap className={cls} />;
  }
}

export default function PremiumModal({ open, onClose }: PremiumModalProps) {
  const { locale, t: tI18n } = useTranslation();
  const t = TEXTS[locale as keyof typeof TEXTS] ?? TEXTS.ru;
  const [buying, setBuying] = useState(false);
  const [restoring, setRestoring] = useState(false);

  const { data: status, refetch: refetchStatus } = trpc.premium.status.useQuery(undefined, {
    enabled: open,
    refetchOnWindowFocus: false,
  });

  if (!open) return null;

  const isNative = Capacitor.isNativePlatform();
  const iapReady = isIAPAvailable();

  const handleBuy = async () => {
    if (!isNative || !iapReady) return;
    setBuying(true);
    try {
      const result = await purchasePremium();
      if (!result) {
        // User cancelled
        setBuying(false);
        return;
      }
      // Verify with server and activate premium
      const response = await fetch('/api/iap/verify-premium', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          transactionId: result.transactionId,
          platform: result.platform,
        }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error((data as { error?: string }).error ?? 'verification_failed');
      }
      toast.success(t.buySuccess);
      refetchStatus();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      if (msg === 'already_active') {
        toast.error(t.alreadyActive);
        refetchStatus();
      } else {
        console.error('[PremiumModal] IAP error:', err);
        toast.error(t.buyError);
      }
    } finally {
      setBuying(false);
    }
  };

  const handleRestore = async () => {
    if (!isNative || !iapReady) return;
    setRestoring(true);
    try {
      const hasActive = await restorePurchases();
      if (hasActive) {
        toast.success(t.restoreSuccess);
        refetchStatus();
      } else {
        toast.info(t.restoreNone);
      }
    } catch {
      toast.error(t.restoreError);
    } finally {
      setRestoring(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal wrapper — mobile: full-height sheet, desktop: centered dialog */}
      <div
        className="relative w-full sm:max-w-lg flex flex-col rounded-t-2xl sm:rounded-2xl bg-gradient-to-b from-[#1a1200] via-[#1c1500] to-[#0d0d0d] border border-yellow-600/40 shadow-2xl shadow-yellow-900/30 h-[100dvh] sm:h-auto sm:max-h-[90vh]"
      >

        {/* Sticky close button row — always visible at top */}
        <div className="flex-shrink-0 flex justify-end px-3 pt-3 pb-1">
          <button
            onClick={onClose}
            className="p-2.5 rounded-full bg-yellow-900/60 border border-yellow-600/40 text-yellow-200 hover:text-white hover:bg-yellow-800/80 transition-colors"
            aria-label="Закрыть"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

        {/* Header */}
        <div className="relative pt-8 pb-4 px-6 text-center overflow-hidden">
          {/* Glow background */}
          <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 to-transparent pointer-events-none" />

          <div className="relative">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Crown className="w-7 h-7 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
              <h1 className="text-3xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-b from-yellow-200 to-yellow-500">
                {t.title}
              </h1>
              <Crown className="w-7 h-7 text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.8)]" />
            </div>
            <p className="text-sm text-yellow-200/60">{t.subtitle}</p>

            {/* Status badge */}
            {status?.isPremium && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/40">
                <div className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
                <span className="text-xs font-semibold text-yellow-300">
                  {t.active}
                  {status.daysRemaining != null && ` · ${t.expires} ${status.daysRemaining} ${t.days}`}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Premium Frame Preview */}
        <div className="px-6 mb-4">
          <div className="relative rounded-xl overflow-hidden bg-gradient-to-b from-yellow-900/20 to-black/40 border border-yellow-600/20 p-4 flex items-center gap-4">
            <div className="relative flex-shrink-0 flex items-center justify-center">
              <PremiumFrame size={64} active={true}>
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #1a1200 0%, #2d2000 100%)', border: '2px solid rgba(250,204,21,0.3)' }}
                >
                  <Crown className="w-8 h-8 text-yellow-400" />
                </div>
              </PremiumFrame>
            </div>
            <div>
              <div className="text-sm font-bold text-yellow-300">{t.frameTitle}</div>
              <div className="text-xs text-yellow-200/50 mt-0.5">{t.frameDesc}</div>
            </div>
          </div>
        </div>

        {/* Benefits list */}
        <div className="px-6 space-y-2 mb-4">
          {t.benefits.map((b, i) => (
            <div
              key={i}
              className="flex items-start gap-3 p-3 rounded-xl bg-yellow-900/10 border border-yellow-700/20"
            >
              <div className="mt-0.5 flex-shrink-0 w-8 h-8 rounded-full bg-yellow-500/15 flex items-center justify-center">
                <BenefitIcon type={b.icon} />
              </div>
              <div>
                <div className="text-sm font-semibold text-yellow-200">{b.title}</div>
                <div className="text-xs text-gray-400 mt-0.5 leading-relaxed">{b.desc}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Bot rule notice */}
        <div className="mx-6 mb-4 px-3 py-2 rounded-lg bg-blue-900/20 border border-blue-700/30">
          <p className="text-xs text-blue-300/70 text-center">{t.botRule}</p>
        </div>

        {/* Buy button — hidden when premium is already active */}
        {status?.isPremium ? (
          /* Premium active: show info block instead of buy button */
          <div className="px-6 pb-6">
            <div
              className="w-full py-4 rounded-xl flex flex-col items-center justify-center gap-1"
              style={{
                background: 'linear-gradient(135deg, rgba(250,204,21,0.10) 0%, rgba(250,204,21,0.04) 100%)',
                border: '1px solid rgba(250,204,21,0.35)',
              }}
            >
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="font-bold text-yellow-300 text-base">
                  {t.active}
                </span>
              </div>
              {status.daysRemaining != null && (
                <span className="text-xs text-yellow-200/60">
                  {t.expires}: {status.daysRemaining} {t.days}
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Premium not active: show buy button or web-only hint */
          <div className="px-6 pb-6">
            {isNative && iapReady ? (
              /* Native: real IAP purchase button */
              <button
                onClick={handleBuy}
                disabled={buying}
                className="w-full py-4 rounded-xl font-black text-lg tracking-wide text-black bg-gradient-to-r from-yellow-400 via-yellow-300 to-yellow-500 hover:from-yellow-300 hover:to-yellow-400 active:scale-95 transition-all duration-150 shadow-lg shadow-yellow-500/30 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {buying ? (
                  <span className="animate-spin w-5 h-5 border-2 border-black/30 border-t-black rounded-full" />
                ) : (
                  <>
                    <Crown className="w-5 h-5" />
                    <span>{t.buyBtn}</span>
                    <span className="text-sm font-medium opacity-70">{t.perMonth}</span>
                  </>
                )}
              </button>
            ) : (
              /* Web: show mobile-only hint */
              <div
                className="w-full py-4 rounded-xl flex flex-col items-center justify-center gap-2"
                style={{
                  background: 'linear-gradient(135deg, rgba(250,204,21,0.08) 0%, rgba(250,204,21,0.03) 100%)',
                  border: '1px solid rgba(250,204,21,0.25)',
                }}
              >
                <div className="flex items-center gap-2">
                  <Smartphone className="w-5 h-5 text-yellow-400/70" />
                  <span className="font-semibold text-yellow-200/80 text-sm">
                    {t.buyBtnWeb}
                  </span>
                </div>
                <span className="text-xs text-yellow-200/40 text-center px-4">
                  {t.webOnlyHint}
                </span>
              </div>
            )}
          </div>
        )}

        </div>{/* end scrollable content */}

        {/* Fixed bottom actions */}
        <div
          className="flex-shrink-0 px-6 py-3 flex flex-col gap-2"
          style={{
            borderTop: '1px solid rgba(250,204,21,0.15)',
            paddingBottom: 'max(16px, env(safe-area-inset-bottom, 16px))',
          }}
        >
          {/* Restore Purchases — required by App Store Guidelines (only on native) */}
          {isNative && iapReady && !status?.isPremium && (
            <button
              onClick={handleRestore}
              disabled={restoring}
              className="w-full py-2 rounded-xl font-medium text-xs transition-all active:scale-95 disabled:opacity-50"
              style={{ color: 'rgba(250,204,21,0.5)' }}
            >
              {restoring ? (
                <span className="flex items-center justify-center gap-1">
                  <span className="animate-spin w-3 h-3 border border-yellow-400/30 border-t-yellow-400/70 rounded-full" />
                  {t.restoreBtn}
                </span>
              ) : t.restoreBtn}
            </button>
          )}
          <button
            onClick={onClose}
            className="w-full py-3 rounded-xl font-bold text-sm transition-all active:scale-95"
            style={{
              background: 'linear-gradient(135deg, rgba(250,204,21,0.12) 0%, rgba(250,204,21,0.06) 100%)',
              border: '1px solid rgba(250,204,21,0.3)',
              color: '#fbbf24',
            }}
          >
            {tI18n('common.close')}
          </button>
        </div>
      </div>
    </div>
  );
}
