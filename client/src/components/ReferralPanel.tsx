import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Gift, Copy, Check, Loader2, ChevronLeft } from 'lucide-react';
import { useTranslation } from '@/i18n';

const SHANYRAK_ICON = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png';
const TENGE_ICON = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/tenge_9aefd1b7.png';

// Milestones: count, level, shanyrak, tenge
// above=true → цифра в кружке снизу линии, награда сверху линии
// above=false → цифра в кружке сверху линии, награда снизу линии
const MILESTONES = [
  { count: 1,  level: 1, shanyraks: 5000,   tenge: 5,   above: true  }, // кружок снизу, награда сверху
  { count: 5,  level: 2, shanyraks: 20000,  tenge: 15,  above: false }, // кружок сверху, награда снизу
  { count: 15, level: 3, shanyraks: 40000,  tenge: 50,  above: true  }, // кружок снизу, награда сверху
  { count: 50, level: 4, shanyraks: 200000, tenge: 100, above: false }, // кружок сверху, награда снизу
];

function formatNum(n: number): string {
  if (n >= 1000) return `${n / 1000}К`;
  return String(n);
}

interface MilestoneNodeProps {
  milestone: typeof MILESTONES[number];
  index: number;
  totalReferrals: number;
  rewardLevel: number;
}

function MilestoneNode({ milestone, totalReferrals, rewardLevel }: MilestoneNodeProps) {
  const claimed = rewardLevel >= milestone.level;
  const reached = totalReferrals >= milestone.count;
  const above = milestone.above; // true = кружок снизу, награда сверху

  const rewardBlock = (
    <div className="flex flex-col items-center gap-0.5">
      <div className="flex items-center gap-0.5">
        <span className={`text-[10px] font-semibold ${claimed ? 'text-green-400' : 'text-amber-200/60'}`}>
          {formatNum(milestone.shanyraks)}
        </span>
        <img src={SHANYRAK_ICON} alt="" className="w-3 h-3 object-contain" />
      </div>
      <div className="flex items-center gap-0.5">
        <span className={`text-[10px] font-semibold ${claimed ? 'text-yellow-400' : 'text-amber-200/60'}`}>
          {milestone.tenge}
        </span>
        <img src={TENGE_ICON} alt="" className="w-3 h-3 object-contain" />
      </div>
    </div>
  );

  const dot = (
    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 relative shrink-0
      ${claimed
        ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]'
        : reached
        ? 'bg-amber-700/60 border-amber-500/70'
        : 'bg-[#0f2035] border-amber-700/30'
      }`}>
      {claimed
        ? <Check className="w-2.5 h-2.5 text-[#0f2035]" />
        : <span className={`text-[9px] font-bold leading-none ${reached ? 'text-amber-200' : 'text-amber-200/50'}`}>
            {milestone.count}
          </span>
      }
    </div>
  );

  if (above) {
    // кружок снизу линии → награда сверху линии (mb-0 чтобы не заезжать на линию)
    return (
      <div className="flex flex-col items-center" style={{ flex: 1 }}>
        {/* Награда сверху — не заезжает на линию */}
        <div className="flex flex-col items-center mb-1" style={{ minHeight: 44 }}>
          {rewardBlock}
        </div>
        {/* Кружок — будет ниже линии (линия проходит через середину flex-контейнера) */}
        {dot}
        {/* Пустое место снизу для выравнивания */}
        <div style={{ minHeight: 44 }} />
      </div>
    );
  } else {
    // кружок сверху линии → награда снизу линии
    return (
      <div className="flex flex-col items-center" style={{ flex: 1 }}>
        {/* Пустое место сверху для выравнивания */}
        <div style={{ minHeight: 44 }} />
        {/* Кружок — будет выше линии */}
        {dot}
        {/* Награда снизу — не заезжает на линию */}
        <div className="flex flex-col items-center mt-1" style={{ minHeight: 44 }}>
          {rewardBlock}
        </div>
      </div>
    );
  }
}

interface ReferralPanelProps {
  onBack: () => void;
}

export default function ReferralPanel({ onBack }: ReferralPanelProps) {
  const { t } = useTranslation();
  const [copied, setCopied] = useState(false);

  const { data, isLoading } = trpc.referral.myCode.useQuery(undefined, {
    staleTime: 30_000,
  });

  const handleCopy = () => {
    if (!data?.code) return;
    navigator.clipboard.writeText(data.code).then(() => {
      setCopied(true);
      toast.success(t('referral.codeCopied'));
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const totalReferrals = data?.totalReferrals ?? 0;
  const rewardLevel = data?.rewardLevel ?? 0;

  // Progress: fraction along the bar (0..1)
  const maxCount = MILESTONES[MILESTONES.length - 1].count;
  const progressFraction = Math.min(totalReferrals / maxCount, 1);

  return (
    <div className="space-y-4 mt-3">
      {/* Back */}
      <Button
        variant="ghost"
        size="sm"
        className="text-amber-200/70 hover:text-amber-100 -ml-1"
        onClick={onBack}
      >
        <ChevronLeft className="w-4 h-4 mr-1" />
        {t('common.back')}
      </Button>

      {/* Header */}
      <div className="bg-gradient-to-r from-red-900/40 to-red-800/20 border border-red-600/30 rounded-xl p-4 text-center">
        <div className="flex justify-center mb-2">
          <div className="w-12 h-12 rounded-full bg-red-600/20 border border-red-500/40 flex items-center justify-center">
            <Gift className="w-6 h-6 text-red-400" />
          </div>
        </div>
        <h3 className="text-amber-100 font-bold text-base mb-1">{t('referral.title')}</h3>
        <p className="text-amber-200/60 text-xs leading-relaxed">{t('referral.description')}</p>
      </div>

      {/* Reward progress bar */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-4">
        <div className="text-amber-200/60 text-xs mb-3 text-center">
          {t('referral.progressTitle')} — {totalReferrals} {t('referral.invited')}
        </div>

        {/*
          Layout: каждый MilestoneNode занимает flex:1 и имеет 3 зоны:
          - верхняя (44px): награда или пусто
          - середина: кружок (6px)
          - нижняя (44px): награда или пусто
          Линия прогресса проходит через середину (top: 44px + 3px = ~47px от верха контейнера)
        */}
        <div className="relative flex items-stretch px-1">
          {/* Track — позиционируем точно по центру кружков */}
          <div
            className="absolute left-4 right-4 h-1.5 bg-amber-900/40 rounded-full overflow-hidden"
            style={{ top: 'calc(44px + 9px)', zIndex: 0 }}
          >
            <div
              className="h-full bg-gradient-to-r from-amber-600 to-amber-400 rounded-full transition-all duration-700"
              style={{ width: `${progressFraction * 100}%` }}
            />
          </div>

          {/* Milestone nodes */}
          {MILESTONES.map((milestone, index) => (
            <MilestoneNode
              key={milestone.level}
              milestone={milestone}
              index={index}
              totalReferrals={totalReferrals}
              rewardLevel={rewardLevel}
            />
          ))}
        </div>
      </div>

      {/* Referral code */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-4">
        <div className="text-amber-200/60 text-xs mb-2 text-center">{t('referral.yourCode')}</div>
        {isLoading ? (
          <div className="flex justify-center py-3">
            <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
          </div>
        ) : (
          <div className="flex items-center gap-2">
            <div className="flex-1 bg-[#0f2035] border border-amber-600/40 rounded-lg px-4 py-2.5 text-center">
              <span className="text-amber-300 font-mono text-xl font-bold tracking-[0.2em]">
                {data?.code ?? '--------'}
              </span>
            </div>
            <Button
              size="sm"
              className="bg-amber-600 hover:bg-amber-500 text-white h-10 w-10 p-0 shrink-0"
              onClick={handleCopy}
              disabled={!data?.code}
            >
              {copied
                ? <Check className="w-4 h-4" />
                : <Copy className="w-4 h-4" />
              }
            </Button>
          </div>
        )}
      </div>

      {/* New player reward info */}
      <div className="bg-[#1a2d45]/40 border border-amber-700/10 rounded-xl p-3">
        <div className="text-amber-200/50 text-xs text-center leading-relaxed">
          {t('referral.newPlayerBonus')}
        </div>
        <div className="flex items-center justify-center gap-1.5 mt-1.5">
          <span className="text-green-400 font-bold text-sm">10 000</span>
          <img src={SHANYRAK_ICON} alt="" className="w-3.5 h-3.5 object-contain" />
          <span className="text-amber-200/40 text-xs">+</span>
          <span className="text-yellow-400 font-bold text-sm">25</span>
          <img src={TENGE_ICON} alt="" className="w-3.5 h-3.5 object-contain" />
        </div>
      </div>
    </div>
  );
}
