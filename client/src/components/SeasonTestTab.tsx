/**
 * SeasonTestTab — Admin tool for testing season reward mechanics.
 * Allows selecting any season (2025-Q1 … 2027-Q4), setting test ratings,
 * simulating season end, and rolling back.
 *
 * State is persisted in DB (season_test_state) so it survives page reloads.
 * "Откатить всё" button is active whenever isActive=true in DB.
 */
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FlaskConical, Trophy, RotateCcw, Play, ChevronRight,
  CheckCircle2, AlertCircle, Users, Star, Coins, RefreshCw, Calendar,
  ShieldAlert,
} from "lucide-react";
import { SEASON_BASE_YEAR, SEASON_RANKS, SEASON_REWARD_DEFS, SEASONS, getSeasonInfo, getSeasonBounds, getSeasonRank, getCurrentSeasonKey } from "@shared/seasons";

// ─── helpers ─────────────────────────────────────────────────────────────────
function formatNum(n: number | null | undefined) {
  if (n == null) return "0";
  return n.toLocaleString("ru-RU");
}

const RANK_PRESETS = SEASON_RANKS.map(r => ({
  key: r.key,
  nameRu: r.nameRu,
  color: r.color,
  rating: r.minRating === 0 ? 0 : r.minRating + 50,
  rewardDef: SEASON_REWARD_DEFS.find(d => d.rankKey === r.key),
}));

/** Build the list of all 36 season keys: 2025-Q1 … 2027-Q4 */
function buildAllSeasonKeys(): { key: string; label: string; isCurrent: boolean }[] {
  const current = getCurrentSeasonKey();
  const keys: { key: string; label: string; isCurrent: boolean }[] = [];
  for (let year = SEASON_BASE_YEAR; year < SEASON_BASE_YEAR + 3; year++) {
    for (let q = 1; q <= 4; q++) {
      const key = `${year}-Q${q}`;
      const info = getSeasonInfo(key);
      const bounds = getSeasonBounds(key);
      const startStr = bounds.start.toLocaleDateString("ru-RU", { day: "numeric", month: "short" });
      const endStr = bounds.end.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" });
      keys.push({
        key,
        label: `${key} — ${info.nameRu} (${startStr} – ${endStr})`,
        isCurrent: key === current,
      });
    }
  }
  return keys;
}

// ─── component ───────────────────────────────────────────────────────────────
export function SeasonTestTab() {
  const allSeasonKeys = useMemo(() => buildAllSeasonKeys(), []);
  const currentKey = useMemo(() => getCurrentSeasonKey(), []);
  const utils = trpc.useUtils();

  // Load persisted state from DB
  const { data: dbState, isLoading: dbStateLoading } = trpc.season.testGetState.useQuery(undefined, {
    refetchOnWindowFocus: false,
  });

  const [selectedSeasonKey, setSelectedSeasonKey] = useState<string>(currentKey);
  const [customRating, setCustomRating] = useState<string>("15000");
  const [step, setStep] = useState<"idle" | "rated" | "simulated" | "rolled_back">("idle");

  // Sync local state from DB on load
  useEffect(() => {
    if (dbState) {
      setSelectedSeasonKey(dbState.seasonKey);
      setStep(dbState.step as "idle" | "rated" | "simulated" | "rolled_back");
    }
  }, [dbState]);

  // Reset step when season changes
  const handleSeasonChange = (key: string) => {
    setSelectedSeasonKey(key);
    // Only reset step if no active test is running
    if (!dbState?.isActive) {
      setStep("idle");
    }
  };

  const { data, refetch, isLoading } = trpc.season.testGetAdminProfiles.useQuery(
    { seasonKey: selectedSeasonKey },
    { refetchOnWindowFocus: false },
  );

  const setRatings = trpc.season.testSetAdminRatings.useMutation({
    onSuccess: (res) => {
      toast.success(`✓ Рейтинг ${formatNum(res.rating)} установлен для ${res.updated} игроков (сезон ${res.seasonKey})`);
      setStep("rated");
      refetch();
    },
    onError: (e) => toast.error(`Ошибка: ${e.message}`),
  });

  const simulate = trpc.season.testSimulateSeasonEnd.useMutation({
    onSuccess: (res) => {
      toast.success(`✓ Конец сезона симулирован: обработано ${res.processed} игроков (${res.seasonKey})`);
      setStep("simulated");
      utils.season.testGetState.invalidate();
      refetch();
    },
    onError: (e) => toast.error(`Ошибка: ${e.message}`),
  });

  const rollback = trpc.season.testRollbackSeason.useMutation({
    onSuccess: (res) => {
      toast.success(`✓ Откат выполнен: сброшено ${res.rolledBack} наград (${res.seasonKey})`);
      setStep("rolled_back");
      utils.season.testGetState.invalidate();
      refetch();
    },
    onError: (e) => toast.error(`Ошибка: ${e.message}`),
  });

  const isBusy = setRatings.isPending || simulate.isPending || rollback.isPending;

  // The rollback button is active if:
  // 1. DB says isActive=true (test was simulated and not yet rolled back), OR
  // 2. Local step is "simulated"
  const canRollback = (dbState?.isActive === true) || step === "simulated";

  const handleSetRating = (rating: number) => {
    setRatings.mutate({ rating, seasonKey: selectedSeasonKey });
  };

  const handleCustomRating = () => {
    const n = parseInt(customRating, 10);
    if (isNaN(n) || n < 0 || n > 99999) {
      toast.error("Введите число от 0 до 99999");
      return;
    }
    handleSetRating(n);
  };

  const selectedInfo = useMemo(() => getSeasonInfo(selectedSeasonKey), [selectedSeasonKey]);
  const selectedBounds = useMemo(() => getSeasonBounds(selectedSeasonKey), [selectedSeasonKey]);
  const isCurrentSeason = selectedSeasonKey === currentKey;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-amber-900/30 border border-amber-700/40 flex items-center justify-center">
          <FlaskConical className="w-5 h-5 text-amber-400" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-amber-100">Тест сезонных наград</h2>
          <p className="text-xs text-gray-400">
            Инструменты для тестирования механики сезона. Работает только с admin/gm аккаунтами.
          </p>
        </div>
      </div>

      {/* Active test warning banner */}
      {dbState?.isActive && (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-red-950/40 border border-red-800/50 text-sm text-red-300">
          <ShieldAlert className="w-5 h-5 shrink-0 text-red-400" />
          <div>
            <span className="font-semibold text-red-200">Тест активен</span>
            {" — "}сезон <strong className="text-amber-300">{dbState.seasonKey}</strong> был симулирован.
            Нажмите <strong>"Откатить всё"</strong> ниже, чтобы сбросить тестовые данные.
          </div>
        </div>
      )}

      {/* Season selector */}
      <div className="bg-gray-900/60 border border-amber-800/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2">
          <Calendar className="w-4 h-4 text-amber-400" />
          <span className="text-sm font-semibold text-amber-100">Выбор сезона</span>
          {isCurrentSeason && (
            <span className="px-2 py-0.5 rounded-full bg-green-900/40 border border-green-700/40 text-green-400 text-xs font-medium">
              Текущий
            </span>
          )}
        </div>

        <select
          value={selectedSeasonKey}
          onChange={e => handleSeasonChange(e.target.value)}
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2.5 text-sm text-gray-200 focus:outline-none focus:border-amber-600 cursor-pointer"
        >
          {allSeasonKeys.map(s => (
            <option key={s.key} value={s.key}>
              {s.isCurrent ? `★ ${s.label}` : s.label}
            </option>
          ))}
        </select>

        {/* Selected season info card */}
        <div className="grid grid-cols-3 gap-3 text-xs">
          <div className="bg-gray-800/60 rounded-lg p-2.5">
            <div className="text-gray-500 mb-1">Сезон</div>
            <div className="font-bold text-amber-300">{selectedSeasonKey}</div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-2.5">
            <div className="text-gray-500 mb-1">Название</div>
            <div className="font-medium text-gray-200 truncate">{selectedInfo.nameRu}</div>
          </div>
          <div className="bg-gray-800/60 rounded-lg p-2.5">
            <div className="text-gray-500 mb-1">Период</div>
            <div className="font-medium text-gray-300">
              {selectedBounds.start.toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
              {" – "}
              {selectedBounds.end.toLocaleDateString("ru-RU", { day: "numeric", month: "short", year: "numeric" })}
            </div>
          </div>
        </div>

        {!isCurrentSeason && (
          <div className="flex items-center gap-2 text-xs text-amber-400/80 bg-amber-900/20 border border-amber-800/30 rounded-lg px-3 py-2">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            Вы тестируете не текущий сезон. Все операции будут применены к сезону <strong>{selectedSeasonKey}</strong>.
          </div>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 text-xs">
        {[
          { id: "idle", label: "Начало" },
          { id: "rated", label: "Рейтинг установлен" },
          { id: "simulated", label: "Сезон завершён" },
          { id: "rolled_back", label: "Откат" },
        ].map((s, i, arr) => (
          <div key={s.id} className="flex items-center gap-2">
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium transition-colors ${
              step === s.id
                ? "bg-amber-900/40 border-amber-600 text-amber-300"
                : ["rated", "simulated", "rolled_back"].indexOf(step) > ["rated", "simulated", "rolled_back"].indexOf(s.id as any)
                  ? "bg-green-900/20 border-green-700/40 text-green-400"
                  : "bg-gray-900/40 border-gray-700/40 text-gray-500"
            }`}>
              {step !== s.id && ["rated", "simulated", "rolled_back"].indexOf(step) > ["rated", "simulated", "rolled_back"].indexOf(s.id as any)
                ? <CheckCircle2 className="w-3 h-3" />
                : <span className="w-3 h-3 flex items-center justify-center font-bold">{i + 1}</span>
              }
              {s.label}
            </div>
            {i < arr.length - 1 && <ChevronRight className="w-3 h-3 text-gray-600" />}
          </div>
        ))}
      </div>

      {/* Current season info */}
      {data && (
        <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400" />
              <span className="text-sm font-semibold text-amber-100">
                Данные сезона: <span className="text-amber-300">{data.seasonKey}</span>
                {" — "}<span className="text-gray-300">{selectedInfo.nameRu}</span>
              </span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => refetch()} disabled={isLoading} className="text-gray-400 h-7 px-2">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </Button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs">
              <thead>
                <tr className="border-b border-gray-800">
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Игрок</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Роль</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">Рейтинг</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Ранг</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">Шаныраки</th>
                  <th className="text-right py-2 px-2 text-gray-500 font-medium">Тенге</th>
                  <th className="text-left py-2 px-2 text-gray-500 font-medium">Награда</th>
                </tr>
              </thead>
              <tbody>
                {data.profiles.map((p: (typeof data.profiles)[number]) => {
                  const rank = getSeasonRank(p.seasonRating);
                  return (
                    <tr key={p.profileId} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2 px-2 text-gray-200 font-medium">{p.displayName ?? `#${p.gameId}`}</td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                          p.role === 'admin' ? 'bg-red-900/40 text-red-300' : 'bg-blue-900/40 text-blue-300'
                        }`}>{p.role}</span>
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-amber-300">{formatNum(p.seasonRating)}</td>
                      <td className="py-2 px-2">
                        <span className="font-medium" style={{ color: rank.color }}>{rank.nameRu}</span>
                      </td>
                      <td className="py-2 px-2 text-right text-cyan-300">{formatNum(p.balanceShanyrak)}</td>
                      <td className="py-2 px-2 text-right text-yellow-300">{formatNum(p.balanceTenge)}</td>
                      <td className="py-2 px-2">
                        {p.hasReward ? (
                          <span className="flex items-center gap-1 text-green-400">
                            <CheckCircle2 className="w-3 h-3" />
                            {p.rewardRankKey}
                            {p.rewardClaimed ? " (получена)" : " (не получена)"}
                          </span>
                        ) : (
                          <span className="text-gray-600">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Step 1: Set ratings */}
      <div className="bg-gray-900/60 border border-amber-800/40 rounded-xl p-4 space-y-3">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-amber-900/40 border border-amber-700/40 flex items-center justify-center text-xs font-bold text-amber-400">1</div>
          <span className="text-sm font-semibold text-gray-200">Установить тестовый рейтинг</span>
        </div>
        <p className="text-xs text-gray-400">
          Установит рейтинг сезона <strong className="text-amber-400">{selectedSeasonKey}</strong> для всех admin/gm игроков.
          Используйте пресеты рангов или введите своё значение.
        </p>

        {/* Rank presets */}
        <div className="flex flex-wrap gap-2">
          {RANK_PRESETS.map(r => (
            <button
              key={r.key}
              onClick={() => handleSetRating(r.rating)}
              disabled={isBusy}
              className="px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors hover:opacity-80 disabled:opacity-50"
              style={{ borderColor: r.color + '60', color: r.color, backgroundColor: r.color + '15' }}
            >
              {r.nameRu} ({formatNum(r.rating)})
            </button>
          ))}
        </div>

        {/* Custom rating */}
        <div className="flex gap-2">
          <input
            type="number"
            value={customRating}
            onChange={e => setCustomRating(e.target.value)}
            placeholder="Свой рейтинг"
            min={0}
            max={99999}
            className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 focus:outline-none focus:border-amber-600"
          />
          <Button
            onClick={handleCustomRating}
            disabled={isBusy}
            className="bg-amber-800 hover:bg-amber-700 text-white gap-2 text-sm"
          >
            {setRatings.isPending
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Установка...</>
              : <><Users className="w-4 h-4" /> Установить</>
            }
          </Button>
        </div>
      </div>

      {/* Step 2: Simulate season end */}
      <div className={`bg-gray-900/60 border rounded-xl p-4 space-y-3 transition-colors ${
        step === "idle" ? "border-gray-800 opacity-70" : "border-amber-800/40"
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-amber-900/40 border border-amber-700/40 flex items-center justify-center text-xs font-bold text-amber-400">2</div>
          <span className="text-sm font-semibold text-gray-200">Запустить конец сезона</span>
        </div>
        <p className="text-xs text-gray-400">
          Запустит <code className="bg-gray-800 px-1 rounded text-amber-300">processSeasonEnd</code> для сезона <strong className="text-amber-400">{selectedSeasonKey}</strong>:
          создаст season_rewards, начислит шаныраки/тенге, отправит уведомления.
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => simulate.mutate({ seasonKey: selectedSeasonKey })}
            disabled={isBusy || step === "idle"}
            className="bg-amber-700 hover:bg-amber-600 text-white gap-2"
          >
            {simulate.isPending
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Симуляция...</>
              : <><Play className="w-4 h-4" /> Запустить конец сезона</>
            }
          </Button>
          {step === "simulated" && (
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle2 className="w-4 h-4" /> Выполнено — проверьте уведомления в игре
            </span>
          )}
        </div>
      </div>

      {/* Step 3: Rollback */}
      <div className={`bg-gray-900/60 border rounded-xl p-4 space-y-3 transition-colors ${
        !canRollback ? "border-gray-800 opacity-60" : "border-red-900/50"
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-red-900/40 border border-red-700/40 flex items-center justify-center text-xs font-bold text-red-400">3</div>
          <span className="text-sm font-semibold text-gray-200">Откатить тестовые данные</span>
          {dbState?.isActive && (
            <span className="px-2 py-0.5 rounded-full bg-red-900/40 border border-red-700/40 text-red-300 text-xs font-bold animate-pulse">
              АКТИВЕН
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400">
          Удалит season_rewards и season_ratings за сезон <strong className="text-amber-400">{dbState?.isActive ? dbState.seasonKey : selectedSeasonKey}</strong> для всех admin/gm игроков,
          вернёт зачисленные балансы и удалит уведомления о наградах.
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => rollback.mutate({ seasonKey: dbState?.isActive ? dbState.seasonKey : selectedSeasonKey })}
            disabled={isBusy || !canRollback}
            variant="outline"
            className="border-red-800 text-red-400 hover:bg-red-900/20 hover:text-red-300 gap-2"
          >
            {rollback.isPending
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Откат...</>
              : <><RotateCcw className="w-4 h-4" /> Откатить всё</>
            }
          </Button>
          {step === "rolled_back" && (
            <span className="flex items-center gap-1.5 text-xs text-green-400">
              <CheckCircle2 className="w-4 h-4" /> Откат выполнен
            </span>
          )}
        </div>
      </div>

      {/* Info box */}
      <div className="flex gap-3 p-3 rounded-xl bg-blue-950/30 border border-blue-900/40 text-xs text-blue-300">
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-blue-400" />
        <div className="space-y-1">
          <p><strong className="text-blue-200">Состояние теста сохраняется в БД</strong> — кнопка "Откатить всё" остаётся активной после обновления страницы, пока тест не будет откатан.</p>
          <p>Все операции применяются только к игрокам с ролью <code className="bg-blue-900/30 px-1 rounded">admin</code> или <code className="bg-blue-900/30 px-1 rounded">gm</code>.</p>
        </div>
      </div>
    </div>
  );
}
