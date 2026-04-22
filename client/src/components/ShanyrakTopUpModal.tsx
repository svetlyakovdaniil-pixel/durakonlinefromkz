import { useState, useCallback, useEffect } from "react";
import { X, Clock, Play } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatBalance } from "@shared/formatBalance";
import { useTranslation } from "@/i18n";
import { translateTxDescription } from "./TengeTopUpModal";
import { showRewardedAd, isAdMobAvailable } from "@/lib/admob";

const TENGE_ICON = "/assets/static/tenge_9aefd1b7.png";
const SHANYRAK_ICON = "/assets/static/shanyrak_96e91a49.png";

interface ShanyrakTopUpModalProps {
  open: boolean;
  onClose: () => void;
  currentShanyrak: number;
  currentTenge: number;
  onBalanceUpdated: () => void;
}



function formatTime(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ShanyrakTopUpModal({ open, onClose, currentShanyrak, currentTenge, onBalanceUpdated }: ShanyrakTopUpModalProps) {
  const { t, locale } = useTranslation();
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'buy' | 'history'>('buy');

  const utils = trpc.useUtils();

  const freeTopupStatus = trpc.balance.freeTopupStatus.useQuery(undefined, {
    enabled: open,
    refetchInterval: open ? 10000 : false,
  });

  const transactionsQuery = trpc.balance.myTransactions.useQuery({ currency: 'shanyrak', limit: 50 });

  const freeTopupMutation = trpc.balance.freeShanyrakTopup.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSuccessMessage(`+${formatBalance(data.added ?? 0)} ${t('topUp.shanyrakUnit')}!`);
        onBalanceUpdated();
        utils.balance.freeTopupStatus.invalidate();
        utils.profile.me.invalidate();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    },
  });

  const testShanyrakMutation = trpc.balance.testAddShanyrak.useMutation();

  const [adCooldownRemaining, setAdCooldownRemaining] = useState<number>(0);
  const [adWatching, setAdWatching] = useState(false);

  const adWatchTopupMutation = trpc.balance.adWatchTopup.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSuccessMessage(`+${formatBalance(data.added ?? 0)} ${t('topUp.shanyrakUnit')}!`);
        onBalanceUpdated();
        utils.profile.me.invalidate();
        // Start 1h cooldown locally
        const cooldownEnd = Date.now() + 60 * 60 * 1000;
        const tick = () => {
          const remaining = cooldownEnd - Date.now();
          setAdCooldownRemaining(remaining > 0 ? remaining : 0);
        };
        tick();
        const interval = setInterval(() => {
          const remaining = cooldownEnd - Date.now();
          setAdCooldownRemaining(remaining > 0 ? remaining : 0);
          if (remaining <= 0) clearInterval(interval);
        }, 1000);
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    },
  });

  const handleWatchAd = useCallback(async () => {
    if (adWatching || adCooldownRemaining > 0) return;
    setAdWatching(true);
    try {
      const rewarded = await showRewardedAd();
      if (rewarded) {
        adWatchTopupMutation.mutate();
      }
    } finally {
      setAdWatching(false);
    }
  }, [adWatching, adCooldownRemaining, adWatchTopupMutation]);



  // Cooldown timer
  useEffect(() => {
    if (!freeTopupStatus.data?.cooldownUntil) {
      setCooldownRemaining(0);
      return;
    }
    const cooldownEnd = new Date(freeTopupStatus.data.cooldownUntil).getTime();

    const tick = () => {
      const remaining = cooldownEnd - Date.now();
      setCooldownRemaining(remaining > 0 ? remaining : 0);
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [freeTopupStatus.data?.cooldownUntil]);

  const handleFreeTopup = useCallback(() => {
    freeTopupMutation.mutate();
  }, [freeTopupMutation]);



  if (!open) return null;

  const isFreeAvailable = freeTopupStatus.data?.available ?? false;
  const isCooldown = !isFreeAvailable && cooldownRemaining > 0;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-[95vw] max-w-md bg-gradient-to-b from-slate-800 to-slate-900 border border-amber-600/30 rounded-2xl shadow-2xl p-5 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          className="absolute top-3 right-3 text-gray-400 hover:text-white transition-colors"
          onClick={onClose}
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title and tabs */}
        <div className="mb-4">
          <div className="flex items-center gap-2 mb-3">
            <img src={SHANYRAK_ICON} alt="" className="h-8 object-contain" />
            <h2 className="text-lg font-bold text-amber-100">{t('topUp.shanyrakTitle')}</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('buy')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === 'buy'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700/50 text-green-200 hover:bg-slate-600/50'
              }`}
            >
              {t('topUp.buyBtn') || 'Купить'}
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === 'history'
                  ? 'bg-green-600 text-white'
                  : 'bg-slate-700/50 text-green-200 hover:bg-slate-600/50'
              }`}
            >
              {t('topUp.historyTab') || t('profile.history')}
            </button>
          </div>
        </div>

        {activeTab === 'buy' && (
          <>
            {/* Current balance */}
            <div className="flex items-center gap-3 mb-5 bg-slate-700/40 rounded-xl p-3">
              <div className="flex items-center gap-1.5">
                <img src={SHANYRAK_ICON} alt="" className="h-5 object-contain" />
                <span className="text-green-400 font-bold text-sm">{formatBalance(currentShanyrak)}</span>
              </div>
              <div className="w-px h-5 bg-slate-600" />
              <div className="flex items-center gap-1.5">
                <img src={TENGE_ICON} alt="" className="h-5 w-5 rounded-full object-contain" />
                <span className="text-amber-300/60 font-bold text-sm">{formatBalance(currentTenge)}</span>
              </div>
            </div>

            {/* Success message */}
            {successMessage && (
              <div className="mb-4 bg-green-900/40 border border-green-600/40 rounded-xl p-3 text-center text-green-300 font-semibold text-sm animate-pulse">
                {successMessage}
              </div>
            )}


            {/* Option 1: Free top-up to 2000 */}
            <div className="mb-3">
              <button
                className={`w-full rounded-xl p-3 flex items-center justify-center gap-2 font-semibold text-sm transition-all ${
                  isFreeAvailable
                    ? 'bg-green-700/50 hover:bg-green-600/60 text-green-100 border border-green-500/30'
                    : 'bg-slate-700/30 text-gray-500 border border-slate-600/20 cursor-not-allowed'
                }`}
                onClick={handleFreeTopup}
                disabled={!isFreeAvailable || freeTopupMutation.isPending}
              >
                {freeTopupMutation.isPending ? (
                  <span>{t('topUp.crediting')}</span>
                ) : isCooldown ? (
                  <>
                    <Clock className="w-4 h-4" />
                    <span>{t('topUp.alreadyMax')} {formatTime(cooldownRemaining)}</span>
                  </>
                ) : (
                  <>
                    <span>{t('topUp.freeTopup')}</span>
                    <img src={SHANYRAK_ICON} alt="" className="h-4 object-contain" />
                  </>
                )}
              </button>
              <p className="text-[10px] text-gray-500 text-center mt-1">{t('topUp.freeNote')}</p>
            </div>

            {/* Option 2: Watch ad */}
            <div className="mb-4">
              <button
                className={`w-full rounded-xl p-3 flex items-center justify-between font-semibold text-sm transition-all ${
                  adCooldownRemaining > 0 || adWatching || !isAdMobAvailable()
                    ? 'bg-slate-700/30 text-gray-500 border border-slate-600/20 cursor-not-allowed'
                    : 'bg-green-900/30 hover:bg-green-800/40 text-green-100 border border-green-600/30'
                }`}
                disabled={adCooldownRemaining > 0 || adWatching || !isAdMobAvailable()}
                onClick={handleWatchAd}
              >
                <div className="flex items-center gap-2">
                  {adWatching ? (
                    <span className="w-4 h-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Play className="w-4 h-4" />
                  )}
                  <span>{adCooldownRemaining > 0 ? formatTime(adCooldownRemaining) : t('topUp.watchAd')}</span>
                </div>
                <div className="flex items-center gap-1">
                  <span className={adCooldownRemaining > 0 ? 'text-green-400/50' : 'text-green-400'}>+1000</span>
                  <img src={SHANYRAK_ICON} alt="" className={`h-4 object-contain ${adCooldownRemaining > 0 ? 'opacity-50' : ''}`} />
                </div>
              </button>
              <p className="text-[10px] text-gray-500 text-center mt-1">
                {!isAdMobAvailable() ? t('topUp.comingSoon') : adCooldownRemaining > 0 ? t('topUp.adCooldown') : t('topUp.adNote')}
              </p>
            </div>


          </>
        )}

        {activeTab === 'history' && (
          <div className="space-y-2">
            {transactionsQuery.isLoading && (
              <div className="text-center text-green-300/60 py-4">{t('common.loading')}</div>
            )}
            {transactionsQuery.data && transactionsQuery.data.length === 0 && (
              <div className="text-center text-green-300/60 py-4">{t('lobby.historyEmpty')}</div>
            )}
            {transactionsQuery.data && transactionsQuery.data.map((tx: any) => (
              <div key={tx.id} className="bg-slate-700/40 rounded-xl p-3 border border-slate-600/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-green-200 font-semibold text-sm">{translateTxDescription(tx, locale)}</span>
                  <span className={`font-bold text-sm ${
                    tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{formatBalance(tx.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-green-300/60 text-xs">
                    {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="text-green-300/60 text-xs">{t('shop.balance')}: {formatBalance(tx.balanceAfter || 0)}</span>
                </div>
              </div>
            ))}
          </div>
        )}


      </div>
    </div>
  );
}
