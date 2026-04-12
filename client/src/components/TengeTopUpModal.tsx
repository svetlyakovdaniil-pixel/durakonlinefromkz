import { useState, useEffect, useMemo } from "react";
import { X, ShoppingCart, AlertTriangle, RefreshCw, Smartphone } from "lucide-react";
import { formatBalance } from "@shared/formatBalance";
import { trpc } from "@/lib/trpc";
import { useTranslation } from "@/i18n";
import { toast } from "sonner";
import { Capacitor } from "@capacitor/core";
import {
  fetchTengeProducts,
  purchaseTenge,
  restorePurchases,
  isIAPAvailable,
  type IAPProduct,
  type TengeProductId,
} from "@/lib/iap";

const TENGE_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/tenge_9aefd1b7.png";

interface TengeTopUpModalProps {
  open: boolean;
  onClose: () => void;
  currentTenge: number;
}

/** Fallback USD base prices when IAP is not available (web preview) */
const FALLBACK_TIERS = [
  { id: 1, productId: "durak_tenge_100" as TengeProductId, tenge: 100, usd: 0.99 },
  { id: 2, productId: "durak_tenge_500" as TengeProductId, tenge: 500, usd: 4.99 },
  { id: 3, productId: "durak_tenge_1000" as TengeProductId, tenge: 1000, usd: 9.99 },
  { id: 4, productId: "durak_tenge_5000" as TengeProductId, tenge: 5000, usd: 49.99 },
];

function detectCurrency(): { code: string; locale: string } {
  const lang = navigator.language || "en-US";
  const region = lang.split("-")[1]?.toUpperCase() || "";
  const regionToCurrency: Record<string, string> = {
    RU: "RUB", KZ: "KZT", UA: "UAH", BY: "BYN", UZ: "UZS", KG: "KGS",
    TJ: "TJS", TM: "TMT", AZ: "AZN", GE: "GEL", AM: "AMD", TR: "TRY",
    GB: "GBP", DE: "EUR", FR: "EUR", IT: "EUR", ES: "EUR", PT: "EUR",
    NL: "EUR", BE: "EUR", AT: "EUR", FI: "EUR", IE: "EUR", GR: "EUR",
    JP: "JPY", CN: "CNY", KR: "KRW", IN: "INR", BR: "BRL", MX: "MXN",
    CA: "CAD", AU: "AUD", US: "USD",
  };
  const code = regionToCurrency[region] || "USD";
  return { code, locale: lang };
}

const USD_RATES: Record<string, number> = {
  USD: 1, RUB: 92, KZT: 460, UAH: 41, BYN: 3.3, UZS: 12700, KGS: 89,
  TJS: 11, TMT: 3.5, AZN: 1.7, GEL: 2.7, AMD: 390, TRY: 32, GBP: 0.79,
  EUR: 0.92, JPY: 150, CNY: 7.25, KRW: 1340, INR: 83, BRL: 5, MXN: 17.2,
  CAD: 1.36, AUD: 1.53,
};

function formatLocalPrice(usd: number, currencyCode: string, locale: string): string {
  const rate = USD_RATES[currencyCode] ?? 1;
  let localAmount = usd * rate;
  if (localAmount >= 100) localAmount = Math.round(localAmount);
  else if (localAmount >= 10) localAmount = Math.round(localAmount * 10) / 10;
  else localAmount = Math.round(localAmount * 100) / 100;
  try {
    return new Intl.NumberFormat(locale, {
      style: "currency",
      currency: currencyCode,
      minimumFractionDigits: localAmount % 1 === 0 ? 0 : 2,
      maximumFractionDigits: 2,
    }).format(localAmount);
  } catch {
    return `$${usd.toFixed(2)}`;
  }
}

export function TengeTopUpModal({ open, onClose, currentTenge }: TengeTopUpModalProps) {
  const { t, locale } = useTranslation();
  const [selectedProductId, setSelectedProductId] = useState<TengeProductId | null>(null);
  const [selectedTengeAmount, setSelectedTengeAmount] = useState<number>(0);
  const [selectedPriceString, setSelectedPriceString] = useState<string>("");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"buy" | "history">("buy");
  const [iapProducts, setIapProducts] = useState<IAPProduct[]>([]);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const utils = trpc.useUtils();

  const isNative = Capacitor.isNativePlatform();
  const iapReady = isIAPAvailable();

  const transactionsQuery = trpc.balance.myTransactions.useQuery(
    { currency: "tenge", limit: 50 },
    { enabled: open && activeTab === "history" }
  );

  const creditTengeMutation = trpc.balance.creditTengeIAP.useMutation({
    onSuccess: (data) => {
      void utils.balance.myBalance.invalidate();
      void utils.balance.myTransactions.invalidate();
      const msg = locale === "kk"
        ? `+${formatBalance(data.credited)} тенге есептелді!`
        : locale === "en"
        ? `+${formatBalance(data.credited)} tenge credited!`
        : `+${formatBalance(data.credited)} тенге зачислено!`;
      setSuccessMessage(msg);
      setTimeout(() => setSuccessMessage(null), 4000);
    },
    onError: (err) => {
      toast.error(err.message);
    },
  });

  const { code: currencyCode, locale: browserLocale } = useMemo(() => detectCurrency(), []);

  // Load IAP products when modal opens on native
  useEffect(() => {
    if (!open) {
      setSelectedProductId(null);
      setSuccessMessage(null);
      return;
    }
    if (iapReady) {
      fetchTengeProducts().then(setIapProducts).catch(console.error);
    }
  }, [open, iapReady]);

  const handleSelectTier = (productId: TengeProductId, tenge: number, priceString: string) => {
    setSelectedProductId(productId);
    setSelectedTengeAmount(tenge);
    setSelectedPriceString(priceString);
  };

  const handleConfirmPurchase = async () => {
    if (!selectedProductId) return;
    setIsPurchasing(true);
    try {
      const transactionId = await purchaseTenge(selectedProductId);
      if (transactionId) {
        // Credit tenge on server after successful IAP
        await creditTengeMutation.mutateAsync({
          productId: selectedProductId,
          transactionId,
          platform: Capacitor.getPlatform() as "ios" | "android",
        });
      }
    } catch (err) {
      const msg = locale === "kk" ? "Сатып алу қатесі" : locale === "en" ? "Purchase failed" : "Ошибка покупки";
      toast.error(msg);
    } finally {
      setIsPurchasing(false);
      setSelectedProductId(null);
    }
  };

  const handleRestore = async () => {
    setIsRestoring(true);
    try {
      await restorePurchases();
      const msg = locale === "kk" ? "Сатып алулар қалпына келтірілді" : locale === "en" ? "Purchases restored" : "Покупки восстановлены";
      toast.success(msg);
    } catch {
      const msg = locale === "kk" ? "Қалпына келтіру қатесі" : locale === "en" ? "Restore failed" : "Ошибка восстановления";
      toast.error(msg);
    } finally {
      setIsRestoring(false);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
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
            <img src={TENGE_ICON} alt="" className="h-8 w-8 rounded-full object-contain" />
            <h2 className="text-lg font-bold text-amber-100">{t("topUp.tengeTitle")}</h2>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab("buy")}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === "buy"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-700/50 text-amber-200 hover:bg-slate-600/50"
              }`}
            >
              {t("topUp.buyBtn") || "Купить"}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`flex-1 py-2 px-3 rounded-lg font-semibold text-sm transition-colors ${
                activeTab === "history"
                  ? "bg-amber-600 text-white"
                  : "bg-slate-700/50 text-amber-200 hover:bg-slate-600/50"
              }`}
            >
<<<<<<< Updated upstream
              {t("topUp.historyTab") || "История"}
=======
              {t('profile.history')}
>>>>>>> Stashed changes
            </button>
          </div>
        </div>

        {activeTab === "buy" && (
          <>
            {/* Current balance */}
            <div className="flex items-center gap-2 mb-5 bg-slate-700/40 rounded-xl p-3">
              <img src={TENGE_ICON} alt="" className="h-5 w-5 rounded-full object-contain" />
              <span className="text-amber-300/60 font-bold text-sm">{t("topUp.currentBalance")}:</span>
              <span className="text-amber-300 font-bold text-sm">{formatBalance(currentTenge)}</span>
            </div>

            {/* Success message */}
            {successMessage && (
              <div className="mb-4 bg-green-900/40 border border-green-600/40 rounded-xl p-3 text-center text-green-300 font-semibold text-sm animate-pulse">
                {successMessage}
              </div>
            )}

            {/* Web-only notice */}
            {!isNative && (
              <div className="mb-4 bg-blue-900/30 border border-blue-600/30 rounded-xl p-3 flex items-start gap-2">
                <Smartphone className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" />
                <p className="text-blue-300 text-xs">
                  {locale === "kk"
                    ? "Тенге сатып алу тек мобильді қосымшада қолжетімді (iOS/Android)."
                    : locale === "en"
                    ? "Tenge purchases are only available in the mobile app (iOS/Android)."
                    : "Покупка тенге доступна только в мобильном приложении (iOS/Android)."}
                </p>
              </div>
            )}

            {/* Tiers */}
            <div className="space-y-2 mb-3">
              {iapReady && iapProducts.length > 0
                ? // Native + IAP ready: show real store prices
                  iapProducts.map((product) => {
                    const tengeAmount = parseInt(product.productId.replace("durak_tenge_", ""), 10);
                    return (
                      <button
                        key={product.productId}
                        className="w-full rounded-xl p-3.5 flex items-center justify-between font-semibold text-sm transition-all bg-amber-900/30 hover:bg-amber-800/40 text-amber-100 border border-amber-600/30 active:scale-[0.98]"
                        onClick={() => handleSelectTier(product.productId, tengeAmount, product.priceString)}
                      >
                        <div className="flex items-center gap-2">
                          <img src={TENGE_ICON} alt="" className="h-[30px] w-[30px] rounded-full object-contain" />
                          <span className="text-amber-200 font-bold text-[17px] leading-tight">
                            {formatBalance(tengeAmount)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShoppingCart className="w-3.5 h-3.5 text-amber-400/60" />
                          <span className="text-amber-400">{product.priceString}</span>
                        </div>
                      </button>
                    );
                  })
                : // Fallback: show estimated prices
                  FALLBACK_TIERS.map((tier) => {
                    const localPrice = formatLocalPrice(tier.usd, currencyCode, browserLocale);
                    return (
                      <button
                        key={tier.id}
                        disabled={!isNative}
                        className={`w-full rounded-xl p-3.5 flex items-center justify-between font-semibold text-sm transition-all border ${
                          isNative
                            ? "bg-amber-900/30 hover:bg-amber-800/40 text-amber-100 border-amber-600/30 active:scale-[0.98]"
                            : "bg-slate-800/50 text-amber-100/40 border-slate-600/20 cursor-not-allowed"
                        }`}
                        onClick={() =>
                          isNative ? handleSelectTier(tier.productId, tier.tenge, localPrice) : undefined
                        }
                      >
                        <div className="flex items-center gap-2">
                          <img
                            src={TENGE_ICON}
                            alt=""
                            className={`h-[30px] w-[30px] rounded-full object-contain ${!isNative ? "opacity-40" : ""}`}
                          />
                          <span className={`font-bold text-[17px] leading-tight ${isNative ? "text-amber-200" : "text-amber-200/40"}`}>
                            {formatBalance(tier.tenge)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                          <ShoppingCart className={`w-3.5 h-3.5 ${isNative ? "text-amber-400/60" : "text-amber-400/20"}`} />
                          <span className={isNative ? "text-amber-400" : "text-amber-400/40"}>{localPrice}</span>
                        </div>
                      </button>
                    );
                  })}
            </div>

            <p className="text-[10px] text-gray-500 text-center mb-3">
              {t("topUp.priceDisclaimer").replace("{currency}", currencyCode)}
            </p>

            {/* Restore purchases button (iOS requirement) */}
            {isNative && (
              <button
                onClick={handleRestore}
                disabled={isRestoring}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs text-amber-300/50 hover:text-amber-300/80 transition-colors"
              >
                <RefreshCw className={`w-3 h-3 ${isRestoring ? "animate-spin" : ""}`} />
                {locale === "kk"
                  ? "Сатып алуларды қалпына келтіру"
                  : locale === "en"
                  ? "Restore purchases"
                  : "Восстановить покупки"}
              </button>
            )}
          </>
        )}

        {activeTab === "history" && (
          <div className="space-y-2">
            {transactionsQuery.isLoading && (
<<<<<<< Updated upstream
              <div className="text-center text-amber-300/60 py-4">{t("common.loading") || "Загрузка..."}</div>
            )}
            {transactionsQuery.data && transactionsQuery.data.length === 0 && (
              <div className="text-center text-amber-300/60 py-4">{t("topUp.historyEmpty") || "История пуста"}</div>
            )}
            {transactionsQuery.data &&
              transactionsQuery.data.map(
                (tx: {
                  id: number;
                  description: string | null;
                  amount: number;
                  createdAt: Date;
                  balanceAfter?: number | null;
                }) => (
                  <div key={tx.id} className="bg-slate-700/40 rounded-xl p-3 border border-slate-600/30">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-amber-200 font-semibold text-sm">{tx.description}</span>
                      <span className={`font-bold text-sm ${tx.amount > 0 ? "text-green-400" : "text-red-400"}`}>
                        {tx.amount > 0 ? "+" : ""}
                        {formatBalance(tx.amount)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-amber-300/60 text-xs">
                        {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                      </span>
                      <span className="text-amber-300/60 text-xs">
                        {t("topUp.balance") || "Баланс"}: {formatBalance(tx.balanceAfter || 0)}
                      </span>
                    </div>
                  </div>
                )
              )}
=======
              <div className="text-center text-amber-300/60 py-4">{t('common.loading')}</div>
            )}
            {transactionsQuery.data && transactionsQuery.data.length === 0 && (
              <div className="text-center text-amber-300/60 py-4">{t('lobby.historyEmpty')}</div>
            )}
            {transactionsQuery.data && transactionsQuery.data.map((tx: any) => (
              <div key={tx.id} className="bg-slate-700/40 rounded-xl p-3 border border-slate-600/30">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-amber-200 font-semibold text-sm">{tx.description}</span>
                  <span className={`font-bold text-sm ${
                    tx.amount > 0 ? 'text-green-400' : 'text-red-400'
                  }`}>
                    {tx.amount > 0 ? '+' : ''}{formatBalance(tx.amount)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-amber-300/60 text-xs">
                    {new Date(tx.createdAt).toLocaleDateString()} {new Date(tx.createdAt).toLocaleTimeString()}
                  </span>
                  <span className="text-amber-300/60 text-xs">{t('shop.balance')}: {formatBalance(tx.balanceAfter || 0)}</span>
                </div>
              </div>
            ))}
>>>>>>> Stashed changes
          </div>
        )}

        {/* Confirm purchase dialog */}
        {selectedProductId !== null && (
          <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50"
            onClick={() => setSelectedProductId(null)}
          >
            <div
              className="bg-slate-800 border border-amber-600/40 rounded-2xl p-5 max-w-xs w-[90vw] shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-amber-100 font-bold">{t("topUp.confirmTitle")}</h3>
              </div>
              <div className="text-center mb-4">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <img src={TENGE_ICON} alt="" className="h-6 w-6 rounded-full object-contain" />
                  <span className="text-amber-300 font-bold text-xl">{formatBalance(selectedTengeAmount)}</span>
                  <span className="text-amber-200/50 text-sm">{t("topUp.tengeUnit")}</span>
                </div>
                <div className="text-gray-300 text-sm">
                  {t("topUp.for")} <span className="text-amber-400 font-bold">{selectedPriceString}</span>
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold text-sm transition-colors"
                  onClick={() => setSelectedProductId(null)}
                  disabled={isPurchasing}
                >
                  {t("common.no")}
                </button>
                <button
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors disabled:opacity-60"
                  onClick={handleConfirmPurchase}
                  disabled={isPurchasing}
                >
                  {isPurchasing
                    ? locale === "kk"
                      ? "Жіберілуде..."
                      : locale === "en"
                      ? "Processing..."
                      : "Обработка..."
                    : t("topUp.buyBtn")}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
