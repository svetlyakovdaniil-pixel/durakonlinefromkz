/**
 * SeasonRulesPage — полноэкранная страница правил сезона.
 * Открывается как route /season-rules. Кнопка «Назад» возвращает на /season.
 */
import { useLocation } from 'wouter';
import { ArrowLeft, HelpCircle, Clock } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { useAuth } from '@/_core/hooks/useAuth';
import { useTranslation } from '@/i18n';
import { SEASON_RANKS, type SeasonTheme } from '../../../shared/seasons';
import { DiamondRankIcon } from '@/components/DiamondRankIcon';

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

export default function SeasonRulesPage({ backPath = '/season' }: { backPath?: string }) {
  const [, navigate] = useLocation();
  const { t, locale } = useTranslation();
  const { user } = useAuth();

  const { data: seasonData } = trpc.season.current.useQuery(
    { seasonKey: undefined },
    { enabled: !!user }
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

  const dateLocale = locale === 'kk' ? 'kk-KZ' : locale === 'en' ? 'en-US' : locale === 'uk' ? 'uk-UA' : locale === 'ka' ? 'ka-GE' : locale === 'az' ? 'az-AZ' : locale === 'uz' ? 'uz-UZ' : locale === 'pl' ? 'pl-PL' : 'ru-RU';

  const pointItems = [
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
  ];

  return (
    <div
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        background: `linear-gradient(160deg, ${theme.bgFrom} 0%, ${theme.bgTo} 100%)`,
        color: '#fef3c7',
      }}
    >
      {/* Header */}
      <div
        className="flex items-center gap-3 px-4 pb-3 flex-shrink-0"
        style={{
          paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          borderBottom: `1px solid ${theme.border}`,
          background: `${theme.bgFrom}`,
        }}
      >
        <button
          onClick={() => navigate(backPath)}
          className="w-8 h-8 rounded-full flex items-center justify-center transition-colors flex-shrink-0"
          style={{ background: 'rgba(255,255,255,0.08)' }}
          aria-label="Назад"
        >
          <ArrowLeft className="w-4 h-4 text-white" />
        </button>
        <HelpCircle className="w-5 h-5 flex-shrink-0" style={{ color: theme.accent }} />
        <h1 className="text-lg font-bold text-white">
          {t('season.rulesTitle')}
        </h1>
      </div>

      {/* Scrollable content */}
      <div
        className="flex-1 overflow-y-auto px-5 py-4 space-y-5 text-sm text-amber-100/80"
        style={{ paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)' }}
      >
        {/* Section 1: How the season works */}
        <div className="space-y-2">
          <h3 className="font-bold text-base" style={{ color: theme.accent }}>
            {t('season.howSeasonWorks')}
          </h3>
          <p>{t('season.rulesHowSeasonWorksText')}</p>
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
                {t('season.startLabel')}{' '}
                {startDate ? startDate.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </span>
              <span>—</span>
              <span>
                {t('season.endLabel')}{' '}
                {endDate ? endDate.toLocaleDateString(dateLocale, { day: 'numeric', month: 'long', year: 'numeric' }) : '—'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-xs" style={{ color: `${theme.accent}80` }}>
              <Clock className="w-3 h-3" />
              <span>{t('season.timeLeftLabel')} {timeLeft}</span>
            </div>
          </div>
        </div>

        {/* Section 3: Rewards */}
        <div className="space-y-2">
          <h3 className="font-bold text-base" style={{ color: theme.accent }}>
            {t('season.howRewards')}
          </h3>
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(234,179,8,0.06)', border: '1px solid rgba(234,179,8,0.20)' }}>
            <p>{t('season.rulesRewardsText')}</p>
            <p className="text-amber-200/60 text-xs italic">{t('season.rulesRewardsExample')}</p>
          </div>
        </div>

        {/* Section 4: Premium note */}
        <div className="space-y-2">
          <h3 className="font-bold text-base" style={{ color: theme.accent }}>
            {t('season.premiumAndSeason')}
          </h3>
          <div className="rounded-xl p-3" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.20)' }}>
            <p>{t('season.rulesPremiumText')}</p>
          </div>
        </div>

        {/* Section 5: How to earn rating points */}
        <div className="space-y-2">
          <h3 className="font-bold text-base" style={{ color: theme.accent }}>
            {t('season.howEarnPoints')}
          </h3>
          <div className="rounded-xl p-3 space-y-2" style={{ background: 'rgba(255,255,255,0.04)', border: `1px solid ${theme.border}` }}>
            <div className="space-y-1.5">
              {pointItems.map((item, i) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <span className="text-base leading-5 flex-shrink-0">{item.icon}</span>
                  <span>
                    {locale === 'kk' ? item.kk
                      : locale === 'en' ? item.en
                      : locale === 'uk' ? item.uk ?? item.ru
                      : locale === 'ka' ? item.ka ?? item.ru
                      : locale === 'az' ? item.az ?? item.ru
                      : locale === 'uz' ? item.uz ?? item.ru
                      : locale === 'pl' ? item.pl ?? item.ru
                      : item.ru}
                  </span>
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
                  {locale === 'kk' ? rank.nameKk
                    : locale === 'en' ? rank.nameEn
                    : locale === 'uk' ? (rank as any).nameUk ?? rank.nameRu
                    : locale === 'ka' ? (rank as any).nameKa ?? rank.nameRu
                    : locale === 'az' ? (rank as any).nameAz ?? rank.nameRu
                    : locale === 'uz' ? (rank as any).nameUz ?? rank.nameRu
                    : locale === 'pl' ? (rank as any).namePl ?? rank.nameRu
                    : rank.nameRu}
                </span>
                <span className="text-xs text-amber-200/40 ml-auto">
                  {rank.minRating === 0
                    ? t('season.startingRank')
                    : `${rank.minRating.toLocaleString()}+ ${t('season.ptsAbbr')}`}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
