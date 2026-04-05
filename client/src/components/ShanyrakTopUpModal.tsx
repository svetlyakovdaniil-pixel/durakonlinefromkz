import { useState, useEffect, useCallback } from "react";
import { X, Clock, Play, ArrowRightLeft, AlertTriangle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { formatBalance } from "@shared/formatBalance";

const TENGE_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/tenge_9aefd1b7.png";
const SHANYRAK_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_f75026a5.png";

interface ShanyrakTopUpModalProps {
  open: boolean;
  onClose: () => void;
  currentShanyrak: number;
  currentTenge: number;
  onBalanceUpdated: () => void;
}

const TIERS = [
  { id: '10k' as const, shanyrak: 10000, tenge: 50 },
  { id: '50k' as const, shanyrak: 50000, tenge: 220 },
  { id: '100k' as const, shanyrak: 100000, tenge: 400 },
  { id: '500k' as const, shanyrak: 500000, tenge: 1500 },
];

function formatTime(ms: number): string {
  if (ms <= 0) return "00:00:00";
  const totalSeconds = Math.floor(ms / 1000);
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  const s = totalSeconds % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function ShanyrakTopUpModal({ open, onClose, currentShanyrak, currentTenge, onBalanceUpdated }: ShanyrakTopUpModalProps) {
  const [confirmTier, setConfirmTier] = useState<string | null>(null);
  const [showInsufficientTenge, setShowInsufficientTenge] = useState(false);
  const [cooldownRemaining, setCooldownRemaining] = useState<number>(0);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const utils = trpc.useUtils();

  const freeTopupStatus = trpc.balance.freeTopupStatus.useQuery(undefined, {
    enabled: open,
    refetchInterval: open ? 10000 : false,
  });

  const freeTopupMutation = trpc.balance.freeShanyrakTopup.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setSuccessMessage(`+${formatBalance(data.added ?? 0)} шаныраков!`);
        onBalanceUpdated();
        utils.balance.freeTopupStatus.invalidate();
        utils.profile.me.invalidate();
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    },
  });

  const buyShanyrakMutation = trpc.balance.buyShanyrak.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        const tier = TIERS.find(t => t.id === confirmTier);
        setSuccessMessage(`+${formatBalance(tier?.shanyrak ?? 0)} шаныраков!`);
        setConfirmTier(null);
        onBalanceUpdated();
        utils.profile.me.invalidate();
        setTimeout(() => setSuccessMessage(null), 3000);
      } else if (data.reason === 'insufficient_tenge') {
        setConfirmTier(null);
        setShowInsufficientTenge(true);
      }
    },
  });

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

  const handleBuyConfirm = useCallback(() => {
    if (!confirmTier) return;
    buyShanyrakMutation.mutate({ tier: confirmTier as '10k' | '50k' | '100k' | '500k' });
  }, [confirmTier, buyShanyrakMutation]);

  const handleBuyClick = useCallback((tierId: string, tengeCost: number) => {
    if (currentTenge < tengeCost) {
      setShowInsufficientTenge(true);
      return;
    }
    setConfirmTier(tierId);
  }, [currentTenge]);

  if (!open) return null;

  const isFreeAvailable = freeTopupStatus.data?.available ?? false;
  const isCooldown = !isFreeAvailable && cooldownRemaining > 0;
  const isAlreadyMax = !isFreeAvailable && cooldownRemaining <= 0 && currentShanyrak >= 2000;

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

        {/* Title */}
        <div className="flex items-center gap-2 mb-4">
          <img src={SHANYRAK_ICON} alt="Шаныраки" className="h-8 object-contain" />
          <h2 className="text-lg font-bold text-amber-100">Пополнить шаныраки</h2>
        </div>

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
              isFreeAvailable && !isAlreadyMax
                ? 'bg-green-700/50 hover:bg-green-600/60 text-green-100 border border-green-500/30'
                : 'bg-slate-700/30 text-gray-500 border border-slate-600/20 cursor-not-allowed'
            }`}
            onClick={handleFreeTopup}
            disabled={!isFreeAvailable || isAlreadyMax || freeTopupMutation.isPending}
          >
            {freeTopupMutation.isPending ? (
              <span>Пополняем...</span>
            ) : isCooldown ? (
              <>
                <Clock className="w-4 h-4" />
                <span>{formatTime(cooldownRemaining)}</span>
              </>
            ) : isAlreadyMax ? (
              <span>Баланс уже 2000+</span>
            ) : (
              <>
                <span>Добить баланс до 2000</span>
                <img src={SHANYRAK_ICON} alt="" className="h-4 object-contain" />
              </>
            )}
          </button>
          <p className="text-[10px] text-gray-500 text-center mt-1">Бесплатно раз в 12 часов</p>
        </div>

        {/* Option 2: Watch ad */}
        <div className="mb-4">
          <button
            className="w-full rounded-xl p-3 flex items-center justify-between font-semibold text-sm bg-slate-700/30 text-gray-500 border border-slate-600/20 cursor-not-allowed"
            disabled
          >
            <div className="flex items-center gap-2">
              <Play className="w-4 h-4" />
              <span>Посмотреть рекламу</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-green-400/50">+1000</span>
              <img src={SHANYRAK_ICON} alt="" className="h-4 object-contain opacity-50" />
            </div>
          </button>
          <p className="text-[10px] text-gray-500 text-center mt-1">Скоро будет доступно</p>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 h-px bg-slate-600/50" />
          <div className="flex items-center gap-1 text-xs text-gray-400">
            <ArrowRightLeft className="w-3 h-3" />
            <span>Обмен тенге на шаныраки</span>
          </div>
          <div className="flex-1 h-px bg-slate-600/50" />
        </div>

        {/* Options 3-6: Buy with tenge */}
        <div className="space-y-2 mb-2">
          {TIERS.map((tier) => {
            const canAfford = currentTenge >= tier.tenge;
            return (
              <button
                key={tier.id}
                className={`w-full rounded-xl p-3 flex items-center justify-between font-semibold text-sm transition-all ${
                  canAfford
                    ? 'bg-amber-900/30 hover:bg-amber-800/40 text-amber-100 border border-amber-600/30'
                    : 'bg-slate-700/30 hover:bg-slate-700/40 text-gray-400 border border-slate-600/20'
                }`}
                onClick={() => handleBuyClick(tier.id, tier.tenge)}
              >
                <div className="flex items-center gap-1.5">
                  <span>{formatBalance(tier.shanyrak)}</span>
                  <img src={SHANYRAK_ICON} alt="" className="h-4 object-contain" />
                </div>
                <div className="flex items-center gap-1.5">
                  <span>за {formatBalance(tier.tenge)}</span>
                  <img src={TENGE_ICON} alt="" className="h-4 w-4 rounded-full object-contain" />
                </div>
              </button>
            );
          })}
        </div>

        {/* Confirm purchase dialog */}
        {confirmTier && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50" onClick={() => setConfirmTier(null)}>
            <div className="bg-slate-800 border border-amber-600/40 rounded-2xl p-5 max-w-xs w-[90vw] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <h3 className="text-amber-100 font-bold text-center mb-3">Подтвердите покупку</h3>
              {(() => {
                const tier = TIERS.find(t => t.id === confirmTier);
                if (!tier) return null;
                return (
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-1.5 mb-2">
                      <span className="text-green-400 font-bold">{formatBalance(tier.shanyrak)}</span>
                      <img src={SHANYRAK_ICON} alt="" className="h-5 object-contain" />
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-sm text-gray-300">
                      <span>за</span>
                      <span className="text-amber-300 font-bold">{formatBalance(tier.tenge)}</span>
                      <img src={TENGE_ICON} alt="" className="h-4 w-4 rounded-full object-contain" />
                    </div>
                  </div>
                );
              })()}
              <div className="flex gap-3">
                <button
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold text-sm transition-colors"
                  onClick={() => setConfirmTier(null)}
                >
                  Нет
                </button>
                <button
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors"
                  onClick={handleBuyConfirm}
                  disabled={buyShanyrakMutation.isPending}
                >
                  {buyShanyrakMutation.isPending ? '...' : 'Да'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Insufficient tenge dialog */}
        {showInsufficientTenge && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50" onClick={() => setShowInsufficientTenge(false)}>
            <div className="bg-slate-800 border border-red-600/40 rounded-2xl p-5 max-w-xs w-[90vw] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-red-400" />
                <h3 className="text-red-300 font-bold">Недостаточно тенге</h3>
              </div>
              <p className="text-gray-400 text-sm text-center mb-4">
                У вас не хватает тенге для этой покупки. Пополните баланс тенге, чтобы продолжить.
              </p>
              <button
                className="w-full py-2.5 rounded-xl bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 font-semibold text-sm transition-colors border border-amber-600/30 mb-2"
                onClick={() => {
                  setShowInsufficientTenge(false);
                  // TODO: open tenge purchase flow
                }}
              >
                Купить тенге (скоро)
              </button>
              <button
                className="w-full py-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold text-sm transition-colors"
                onClick={() => setShowInsufficientTenge(false)}
              >
                Закрыть
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
