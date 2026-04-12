/**
 * PremiumModal — full-screen modal showing Premium subscription benefits
 * and a buy button (1000 tenge stub).
 */
import { useState } from 'react';
import { X, Crown, Star, Zap, RefreshCw, Percent, Shield, Sparkles } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useTranslation } from '@/i18n';
import { toast } from 'sonner';

const PREMIUM_FRAME_URL = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/premium-frame-v2_3b824022.png';
const TENGE_ICON = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/tenge_9aefd1b7.png';

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
    buyBtn: 'Купить за 1000',
    buyBtnActive: 'Продлить за 1000',
    insufficientFunds: 'Недостаточно тенге',
    buySuccess: 'Премиум активирован! Приятной игры 🎉',
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
  },
  kk: {
    title: 'PREMIUM',
    subtitle: 'Дала ойыншысының үздігі бол',
    active: 'Белсенді',
    expires: 'Аяқталады',
    days: 'күн',
    buyBtn: '1000-ға сатып ал',
    buyBtnActive: '1000-ға ұзарт',
    insufficientFunds: 'Теңге жеткіліксіз',
    buySuccess: 'Премиум белсендірілді! Жақсы ойын 🎉',
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
  },
  en: {
    title: 'PREMIUM',
    subtitle: 'Become the best player of the steppe',
    active: 'Active',
    expires: 'Expires',
    days: 'd.',
    buyBtn: 'Buy for 1000',
    buyBtnActive: 'Extend for 1000',
    insufficientFunds: 'Insufficient tenge',
    buySuccess: 'Premium activated! Enjoy the game 🎉',
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
  const { locale } = useTranslation();
  const t = TEXTS[locale as keyof typeof TEXTS] ?? TEXTS.ru;
  const [buying, setBuying] = useState(false);

  const { data: status, refetch: refetchStatus } = trpc.premium.status.useQuery(undefined, {
    enabled: open,
    refetchOnWindowFocus: false,
  });

  const buyMutation = trpc.premium.buy.useMutation({
    onSuccess: () => {
      toast.success(t.buySuccess);
      refetchStatus();
    },
    onError: (err) => {
      if (err.message === 'Недостаточно тенге') {
        toast.error(t.insufficientFunds);
      } else {
        toast.error(err.message);
      }
    },
    onSettled: () => setBuying(false),
  });

  if (!open) return null;

  const handleBuy = () => {
    setBuying(true);
    buyMutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg max-h-[95vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-gradient-to-b from-[#1a1200] via-[#1c1500] to-[#0d0d0d] border border-yellow-600/40 shadow-2xl shadow-yellow-900/30">

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/40 text-gray-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

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
            <div className="relative w-20 h-20 flex-shrink-0">
              <img
                src={PREMIUM_FRAME_URL}
                alt="PREMIUM frame"
                className="w-full h-full object-contain"
                style={{
                  filter: 'drop-shadow(0 0 12px rgba(250,204,21,0.6))',
                  animation: 'float 3s ease-in-out infinite',
                }}
              />
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

        {/* Buy button */}
        <div className="px-6 pb-6">
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
                <span>{status?.isPremium ? t.buyBtnActive : t.buyBtn}</span>
                <img src={TENGE_ICON} alt="₸" className="w-5 h-5" />
                <span className="text-sm font-medium opacity-70">{t.perMonth}</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Float animation */}
      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-6px); }
        }
      `}</style>
    </div>
  );
}
