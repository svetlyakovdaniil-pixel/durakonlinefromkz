import { useEffect, useState } from "react";
import { useTranslation } from "@/i18n";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Wrench } from "lucide-react";

/**
 * MaintenancePage — shown to all non-admin users when maintenance mode is active.
 * Polls the server every 30 seconds and auto-redirects when maintenance ends.
 */
export default function MaintenancePage() {
  const { t } = useTranslation();
  const { data: status, refetch } = trpc.maintenance.status.useQuery(undefined, {
    refetchInterval: 30_000,
  });

  const [timeLeft, setTimeLeft] = useState<string | null>(null);

  // Countdown timer
  useEffect(() => {
    if (!status?.endTime) {
      setTimeLeft(null);
      return;
    }
    const end = new Date(status.endTime).getTime();

    const tick = () => {
      const now = Date.now();
      const diff = end - now;
      if (diff <= 0) {
        setTimeLeft(null);
        refetch();
        return;
      }
      const h = Math.floor(diff / 3_600_000);
      const m = Math.floor((diff % 3_600_000) / 60_000);
      const s = Math.floor((diff % 60_000) / 1_000);
      setTimeLeft(
        h > 0
          ? `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
          : `${m}:${String(s).padStart(2, "0")}`
      );
    };

    tick();
    const interval = setInterval(tick, 1_000);
    return () => clearInterval(interval);
  }, [status?.endTime, refetch]);

  // Auto-redirect when maintenance ends
  useEffect(() => {
    if (status && !status.enabled) {
      window.location.reload();
    }
  }, [status?.enabled]);

  return (
    <div className="min-h-screen bg-[#0a1628] flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-amber-600/20 border border-amber-600/40 flex items-center justify-center">
            <Wrench className="w-10 h-10 text-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-amber-100 mb-2">
            {t("maintenance.title")}
          </h1>
          <p className="text-amber-200/70 text-lg">
            {t("maintenance.subtitle")}
          </p>
        </div>

        {/* Custom admin message */}
        {status?.message && (
          <div className="bg-amber-900/20 border border-amber-700/40 rounded-xl p-4">
            <p className="text-xs text-amber-400 uppercase tracking-wide mb-1">
              {t("maintenance.customMessage")}
            </p>
            <p className="text-amber-100 text-sm">{status.message}</p>
          </div>
        )}

        {/* Default description */}
        {!status?.message && (
          <p className="text-gray-400 text-sm leading-relaxed">
            {t("maintenance.description")}
          </p>
        )}

        {/* Timer */}
        <div className="bg-[#0f2035] border border-gray-700/50 rounded-xl p-5">
          <p className="text-xs text-gray-500 uppercase tracking-wide mb-2">
            {t("maintenance.estimatedEnd")}
          </p>
          {timeLeft ? (
            <p className="text-4xl font-mono font-bold text-amber-300 tabular-nums">
              {timeLeft}
            </p>
          ) : (
            <p className="text-gray-500 text-sm italic">
              {t("maintenance.noEstimate")}
            </p>
          )}
        </div>

        {/* Retry button */}
        <Button
          variant="outline"
          className="border-amber-700/40 text-amber-200 bg-transparent hover:bg-amber-900/20 w-full"
          onClick={() => refetch()}
        >
          {t("maintenance.retry")}
        </Button>
      </div>
    </div>
  );
}
