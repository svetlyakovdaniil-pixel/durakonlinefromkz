import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Gift, Copy, Check, Loader2, ChevronLeft } from 'lucide-react';
import { useTranslation } from '@/i18n';

const SHANYRAK_ICON = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png';
const TENGE_ICON = 'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/tenge_9aefd1b7.png';

// Milestones: count, level, shanyrak, tenge
const MILESTONES = [
  { count: 1,  level: 1, shanyraks: 5000,   tenge: 5   },
  { count: 5,  level: 2, shanyraks: 20000,  tenge: 15  },
  { count: 15, level: 3, shanyraks: 40000,  tenge: 50  },
  { count: 50, level: 4, shanyraks: 200000, tenge: 100 },
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
  above: boolean; // alternating: 0,2 above; 1,3 below
}

function MilestoneNode({ milestone, index, totalReferrals, rewardLevel, above }: MilestoneNodeProps) {
  const claimed = rewardLevel >= milestone.level;
  const reached = totalReferrals >= milestone.count;

  return (
    <div className="flex flex-col items-center relative" style={{ flex: 1 }}>
      {/* Label above */}
      {above && (
        <div className="flex flex-col items-center mb-1 min-h-[48px] justify-end">
          <div className={`text-xs font-bold mb-0.5 ${claimed ? 'text-amber-300' : reached ? 'text-amber-200' : 'text-amber-200/50'}`}>
            {milestone.count}
          </div>
          <div className="flex items-center gap-0.5">
            <span className={`text-[10px] font-semibold ${claimed ? 'text-amber-300' : 'text-amber-200/60'}`}>
              {formatNum(milestone.shanyraks)}
            </span>
            <img src={SHANYRAK_ICON} alt="" className="w-3 h-3 object-contain" />
          </div>
          <div className="flex items-center gap-0.5">
            <span className={`text-[10px] font-semibold ${claimed ? 'text-emerald-400' : 'text-amber-200/60'}`}>
              {milestone.tenge}
            </span>
            <img src={TENGE_ICON} alt="" className="w-3 h-3 object-contain" />
          </div>
        </div>
      )}

      {/* Dot */}
      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center z-10 relative
        ${claimed
          ? 'bg-amber-400 border-amber-300 shadow-[0_0_8px_2px_rgba(251,191,36,0.6)]'
          : reached
          ? 'bg-amber-700/60 border-amber-500/70'
          : 'bg-[#0f2035] border-amber-700/30'
        }`}>
        {claimed && <Check className="w-2.5 h-2.5 text-[#0f2035]" />}
      </div>

      {/* Label below */}
      {!above && (
        <div className="flex flex-col items-center mt-1 min-h-[48px]">
          <div className={`text-xs font-bold mb-0.5 ${claimed ? 'text-amber-300' : reached ? 'text-amber-200' : 'text-amber-200/50'}`}>
            {milestone.count}
          </div>
          <div className="flex items-center gap-0.5">
            <span className={`text-[10px] font-semibold ${claimed ? 'text-amber-300' : 'text-amber-200/60'}`}>
              {formatNum(milestone.shanyraks)}
            </span>
            <img src={SHANYRAK_ICON} alt="" className="w-3 h-3 object-contain" />
          </div>
          <div className="flex items-center gap-0.5">
            <span className={`text-[10px] font-semibold ${claimed ? 'text-emerald-400' : 'text-amber-200/60'}`}>
              {milestone.tenge}
            </span>
            <img src={TENGE_ICON} alt="" className="w-3 h-3 object-contain" />
          </div>
        </div>
      )}
    </div>
  );
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

        {/* Alternating milestone nodes with progress bar */}
        <div className="relative flex items-center px-2">
          {/* Track */}
          <div className="absolute left-2 right-2 top-1/2 -translate-y-1/2 h-1.5 bg-amber-900/40 rounded-full overflow-hidden" style={{ zIndex: 0 }}>
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
              above={index % 2 === 0} // 0,2 above; 1,3 below
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
          <span className="text-amber-300 font-semibold"> 10 000 </span>
          <img src={SHANYRAK_ICON} alt="" className="w-3 h-3 object-contain inline-block mx-0.5" />
          + <span className="text-emerald-400 font-semibold">25 </span>
          <img src={TENGE_ICON} alt="" className="w-3 h-3 object-contain inline-block mx-0.5" />
        </div>
      </div>
    </div>
  );
}
