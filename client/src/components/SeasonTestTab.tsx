/**
 * SeasonTestTab — Admin tool for testing season reward mechanics.
 * Allows selecting any season (2025-Q1 … 2027-Q4), setting test ratings,
 * simulating season end, and rolling back.
 */
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import {
  FlaskConical, Trophy, RotateCcw, Play, ChevronRight,
  CheckCircle2, AlertCircle, Users, Star, Coins, RefreshCw, Calendar,
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

  const [selectedSeasonKey, setSelectedSeasonKey] = useState<string>(currentKey);
  const [customRating, setCustomRating] = useState<string>("15000");
  const [step, setStep] = useState<"idle" | "rated" | "simulated" | "rolled_back">("idle");

  // Reset step when season changes
  const handleSeasonChange = (key: string) => {
    setSelectedSeasonKey(key);
    setStep("idle");
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
      refetch();
    },
    onError: (e) => toast.error(`Ошибка: ${e.message}`),
  });

  const rollback = trpc.season.testRollbackSeason.useMutation({
    onSuccess: (res) => {
      toast.success(`✓ Откат выполнен: сброшено ${res.rolledBack} наград (${res.seasonKey})`);
      setStep("rolled_back");
      refetch();
    },
    onError: (e) => toast.error(`Ошибка: ${e.message}`),
  });

  const isBusy = setRatings.isPending || simulate.isPending || rollback.isPending;

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
                  <th className="text-center py-2 px-2 text-gray-500 font-medium">Награда</th>
                </tr>
              </thead>
              <tbody>
                {data.profiles.map((p) => {
                  const rank = getSeasonRank(p.seasonRating);
                  return (
                    <tr key={p.profileId} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                      <td className="py-2 px-2 text-gray-200 font-medium">{p.displayName ?? `#${p.gameId}`}</td>
                      <td className="py-2 px-2">
                        <span className={`px-1.5 py-0.5 rounded text-xs font-medium ${
                          p.role === "admin" ? "bg-red-900/40 text-red-300" : "bg-blue-900/40 text-blue-300"
                        }`}>{p.role}</span>
                      </td>
                      <td className="py-2 px-2 text-right font-mono text-amber-300">{formatNum(p.seasonRating)}</td>
                      <td className="py-2 px-2">
                        <span className="font-medium" style={{ color: rank.color }}>{rank.nameRu}</span>
                      </td>
                      <td className="py-2 px-2 text-right text-purple-300">{formatNum(p.balanceShanyrak)}</td>
                      <td className="py-2 px-2 text-right text-yellow-300">{formatNum(p.balanceTenge)}</td>
                      <td className="py-2 px-2 text-center">
                        {p.hasReward ? (
                          <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs ${
                            p.rewardClaimed ? "bg-green-900/30 text-green-400" : "bg-amber-900/30 text-amber-400"
                          }`}>
                            <CheckCircle2 className="w-3 h-3" />
                            {p.rewardClaimed ? "Получена" : "Ожидает"}
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

      {/* Step 1: Set rating */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-amber-900/40 border border-amber-700/40 flex items-center justify-center text-xs font-bold text-amber-400">1</div>
          <span className="text-sm font-semibold text-gray-200">Установить рейтинг сезона</span>
        </div>
        <p className="text-xs text-gray-400">
          Установит указанный рейтинг всем admin/gm игрокам в сезоне <strong className="text-amber-400">{selectedSeasonKey}</strong>. Это позволит протестировать конкретный ранг и его награды.
        </p>

        {/* Rank presets */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {RANK_PRESETS.map(preset => {
            const reward = preset.rewardDef;
            return (
              <button
                key={preset.key}
                onClick={() => handleSetRating(preset.rating)}
                disabled={isBusy}
                className="text-left p-2.5 rounded-lg border border-gray-700/60 hover:border-gray-600 bg-gray-800/40 hover:bg-gray-800/70 transition-all disabled:opacity-50 group"
              >
                <div className="font-medium text-xs mb-1 truncate" style={{ color: preset.color }}>
                  {preset.nameRu}
                </div>
                <div className="text-xs text-gray-400 font-mono">{formatNum(preset.rating)} очков</div>
                {reward && (
                  <div className="text-xs text-gray-500 mt-1">
                    {formatNum(reward.shanyraks)} ш.
                    {reward.tenge > 0 && ` + ${reward.tenge}₸`}
                    {reward.avatarId && <span className="text-amber-600"> + 🎭</span>}
                  </div>
                )}
              </button>
            );
          })}
        </div>

        {/* Custom rating input */}
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="number"
              min={0}
              max={99999}
              value={customRating}
              onChange={e => setCustomRating(e.target.value)}
              placeholder="Произвольный рейтинг"
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:border-amber-600 font-mono"
            />
            {customRating && !isNaN(parseInt(customRating)) && (
              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium" style={{ color: getSeasonRank(parseInt(customRating)).color }}>
                {getSeasonRank(parseInt(customRating)).nameRu}
              </div>
            )}
          </div>
          <Button
            onClick={handleCustomRating}
            disabled={isBusy}
            className="bg-amber-700 hover:bg-amber-600 text-white shrink-0"
          >
            {setRatings.isPending ? <RefreshCw className="w-4 h-4 animate-spin" /> : "Установить"}
          </Button>
        </div>
      </div>

      {/* Step 2: Simulate season end */}
      <div className={`bg-gray-900/60 border rounded-xl p-4 space-y-3 transition-colors ${
        step === "idle" ? "border-gray-800 opacity-60" : "border-gray-700"
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-amber-900/40 border border-amber-700/40 flex items-center justify-center text-xs font-bold text-amber-400">2</div>
          <span className="text-sm font-semibold text-gray-200">Симулировать конец сезона</span>
        </div>
        <p className="text-xs text-gray-400">
          Запустит <code className="bg-gray-800 px-1 rounded text-amber-300">processSeasonEnd</code> для сезона <strong className="text-amber-400">{selectedSeasonKey}</strong>:
          создаст записи наград, зачислит шаныраки/тенге на балансы и отправит уведомления.
          После этого зайдите в игру и проверьте уведомление в колоколе.
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => simulate.mutate({ seasonKey: selectedSeasonKey })}
            disabled={isBusy || step === "idle"}
            className="bg-green-800 hover:bg-green-700 text-white gap-2"
          >
            {simulate.isPending
              ? <><RefreshCw className="w-4 h-4 animate-spin" /> Обработка...</>
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
        step !== "simulated" ? "border-gray-800 opacity-60" : "border-red-900/50"
      }`}>
        <div className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 rounded-full bg-red-900/40 border border-red-700/40 flex items-center justify-center text-xs font-bold text-red-400">3</div>
          <span className="text-sm font-semibold text-gray-200">Откатить тестовые данные</span>
        </div>
        <p className="text-xs text-gray-400">
          Удалит season_rewards и season_ratings за сезон <strong className="text-amber-400">{selectedSeasonKey}</strong> для всех admin/gm игроков,
          вернёт зачисленные балансы и удалит уведомления о наградах.
        </p>
        <div className="flex items-center gap-3">
          <Button
            onClick={() => rollback.mutate({ seasonKey: selectedSeasonKey })}
            disabled={isBusy || step !== "simulated"}
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
        <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold">Как тестировать:</div>
          <ol className="list-decimal list-inside space-y-1 text-blue-400">
            <li>Выберите нужный сезон из выпадающего списка выше</li>
            <li>Выберите ранг или введите произвольный рейтинг → нажмите «Установить»</li>
            <li>Откройте игру в другой вкладке и убедитесь, что ранг отображается корректно в разделе «Сезон»</li>
            <li>Вернитесь сюда → нажмите «Запустить конец сезона»</li>
            <li>В игре откройте уведомления (колокол) — должно появиться уведомление о награде</li>
            <li>Проверьте popup с наградой, аватарку, баланс шаныраков</li>
            <li>После тестирования нажмите «Откатить всё»</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
