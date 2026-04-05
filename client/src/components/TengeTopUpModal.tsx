import { useState, useEffect, useMemo } from "react";
import { X, ShoppingCart, AlertTriangle } from "lucide-react";
import { formatBalance } from "@shared/formatBalance";

const TENGE_ICON = "https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/tenge_9aefd1b7.png";

interface TengeTopUpModalProps {
  open: boolean;
  onClose: () => void;
  currentTenge: number;
}

/** USD base prices for each tier */
const TIERS = [
  { id: 1, tenge: 50, usd: 1 },
  { id: 2, tenge: 150, usd: 2.75 },
  { id: 3, tenge: 500, usd: 9 },
  { id: 4, tenge: 1000, usd: 16 },
  { id: 5, tenge: 1500, usd: 23 },
  { id: 6, tenge: 5000, usd: 60 },
];

/**
 * Detect user's local currency from browser locale.
 * Maps common locales to currency codes.
 * Falls back to USD.
 */
function detectCurrency(): { code: string; locale: string } {
  const lang = navigator.language || "en-US";
  const region = lang.split("-")[1]?.toUpperCase() || "";

  const regionToCurrency: Record<string, string> = {
    RU: "RUB",
    KZ: "KZT",
    UA: "UAH",
    BY: "BYN",
    UZ: "UZS",
    KG: "KGS",
    TJ: "TJS",
    TM: "TMT",
    AZ: "AZN",
    GE: "GEL",
    AM: "AMD",
    TR: "TRY",
    GB: "GBP",
    DE: "EUR",
    FR: "EUR",
    IT: "EUR",
    ES: "EUR",
    PT: "EUR",
    NL: "EUR",
    BE: "EUR",
    AT: "EUR",
    FI: "EUR",
    IE: "EUR",
    GR: "EUR",
    JP: "JPY",
    CN: "CNY",
    KR: "KRW",
    IN: "INR",
    BR: "BRL",
    MX: "MXN",
    CA: "CAD",
    AU: "AUD",
    US: "USD",
  };

  const code = regionToCurrency[region] || "USD";
  return { code, locale: lang };
}

/**
 * Approximate exchange rates from USD.
 * In production, these would come from a real-time API.
 * For now, we use reasonable approximate rates.
 */
const USD_RATES: Record<string, number> = {
  USD: 1,
  RUB: 92,
  KZT: 460,
  UAH: 41,
  BYN: 3.3,
  UZS: 12700,
  KGS: 89,
  TJS: 11,
  TMT: 3.5,
  AZN: 1.7,
  GEL: 2.7,
  AMD: 390,
  TRY: 32,
  GBP: 0.79,
  EUR: 0.92,
  JPY: 150,
  CNY: 7.25,
  KRW: 1340,
  INR: 83,
  BRL: 5,
  MXN: 17.2,
  CAD: 1.36,
  AUD: 1.53,
};

function formatLocalPrice(usd: number, currencyCode: string, locale: string): string {
  const rate = USD_RATES[currencyCode] ?? 1;
  let localAmount = usd * rate;

  // Round nicely
  if (localAmount >= 100) {
    localAmount = Math.round(localAmount);
  } else if (localAmount >= 10) {
    localAmount = Math.round(localAmount * 10) / 10;
  } else {
    localAmount = Math.round(localAmount * 100) / 100;
  }

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
  const [selectedTier, setSelectedTier] = useState<number | null>(null);

  const { code: currencyCode, locale } = useMemo(() => detectCurrency(), []);

  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setSelectedTier(null);
    }
  }, [open]);

  if (!open) return null;

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
          <img src={TENGE_ICON} alt="Тенге" className="h-8 w-8 rounded-full object-contain" />
          <h2 className="text-lg font-bold text-amber-100">Купить тенге</h2>
        </div>

        {/* Current balance */}
        <div className="flex items-center gap-2 mb-5 bg-slate-700/40 rounded-xl p-3">
          <img src={TENGE_ICON} alt="" className="h-5 w-5 rounded-full object-contain" />
          <span className="text-amber-300/60 font-bold text-sm">Текущий баланс:</span>
          <span className="text-amber-300 font-bold text-sm">{formatBalance(currentTenge)}</span>
        </div>

        {/* Tiers */}
        <div className="space-y-2 mb-3">
          {TIERS.map((tier) => {
            const localPrice = formatLocalPrice(tier.usd, currencyCode, locale);
            return (
              <button
                key={tier.id}
                className="w-full rounded-xl p-3.5 flex items-center justify-between font-semibold text-sm transition-all bg-amber-900/30 hover:bg-amber-800/40 text-amber-100 border border-amber-600/30 active:scale-[0.98]"
                onClick={() => setSelectedTier(tier.id)}
              >
                <div className="flex items-center gap-2">
                  <img src={TENGE_ICON} alt="" className="h-[30px] w-[30px] rounded-full object-contain" />
                  <span className="text-amber-200 font-bold text-[17px] leading-tight">{formatBalance(tier.tenge)}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <ShoppingCart className="w-3.5 h-3.5 text-amber-400/60" />
                  <span className="text-amber-400">{localPrice}</span>
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-[10px] text-gray-500 text-center">
          Цены указаны в {currencyCode}. Окончательная сумма может отличаться в зависимости от платёжной системы.
        </p>

        {/* Confirm purchase dialog */}
        {selectedTier !== null && (
          <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/50" onClick={() => setSelectedTier(null)}>
            <div className="bg-slate-800 border border-amber-600/40 rounded-2xl p-5 max-w-xs w-[90vw] shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
                <h3 className="text-amber-100 font-bold">Подтвердите покупку</h3>
              </div>
              {(() => {
                const tier = TIERS.find(t => t.id === selectedTier);
                if (!tier) return null;
                const localPrice = formatLocalPrice(tier.usd, currencyCode, locale);
                return (
                  <div className="text-center mb-4">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <img src={TENGE_ICON} alt="" className="h-6 w-6 rounded-full object-contain" />
                      <span className="text-amber-300 font-bold text-xl">{formatBalance(tier.tenge)}</span>
                      <span className="text-amber-200/50 text-sm">тенге</span>
                    </div>
                    <div className="text-gray-300 text-sm">
                      за <span className="text-amber-400 font-bold">{localPrice}</span>
                    </div>
                  </div>
                );
              })()}
              <div className="flex gap-3">
                <button
                  className="flex-1 py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-gray-300 font-semibold text-sm transition-colors"
                  onClick={() => setSelectedTier(null)}
                >
                  Нет
                </button>
                <button
                  className="flex-1 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-semibold text-sm transition-colors"
                  onClick={() => {
                    // TODO: integrate real payment (App Store / Google Play / Stripe)
                    setSelectedTier(null);
                    // For now, show a placeholder toast
                    alert("Функция покупки за реальную валюту будет добавлена позже. Следите за обновлениями!");
                  }}
                >
                  Купить
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
