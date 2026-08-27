import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useMemo, useEffect } from "react";
import { useLocation } from "wouter";
import {
  Users, Activity, ArrowLeftRight, Shield, Search,
  ChevronLeft, ChevronRight, Ban, CheckCircle, Trash2,
  DollarSign, ArrowLeft, RefreshCw, LogOut as KickIcon,
  Eye, ArrowUpDown, Crown, Clock, Gamepad2, Trophy,
  ChevronDown, ChevronUp, ClipboardList, AlertTriangle,
  ShoppingCart, Bell, Send, Filter, Menu, X, Flag, Package,
  MessageSquare, AlertCircle, FlaskConical, RotateCcw, Wrench, CheckCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { TABLE_STYLES } from "@shared/cardAssets";
import { AVATAR_FRAMES } from "@/components/ShopModal";
import { AVATAR_OPTIONS } from "@shared/avatars";
import { EMOTION_PACKS } from "@shared/emotionPacks";
import { SeasonTestTab } from "@/components/SeasonTestTab";
import { ProfileItemsSection } from "@/components/ProfileItemsSection";

type Tab = "players" | "monitoring" | "transactions" | "audit" | "antifraud" | "shop" | "notifications" | "moderation" | "contact" | "season_test" | "tools";

/* ─── helpers ─── */
function formatDate(d: string | Date | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleString("ru-RU", { dateStyle: "short", timeStyle: "short" });
}
function formatNumber(n: number | null | undefined) {
  if (n == null) return "0";
  return n.toLocaleString("ru-RU");
}
function formatDuration(seconds: number | null | undefined) {
  if (!seconds) return "—";
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, "0")}`;
}
function formatTimeRemaining(dateStr: string | Date | null | undefined) {
  if (!dateStr) return "Перманентный";
  const until = new Date(dateStr).getTime();
  const now = Date.now();
  if (until <= now) return "Истёк";
  const diff = until - now;
  const hours = Math.floor(diff / 3600000);
  const mins = Math.floor((diff % 3600000) / 60000);
  if (hours >= 24) return `${Math.floor(hours / 24)}д ${hours % 24}ч`;
  return `${hours}ч ${mins}м`;
}

const ACTION_LABELS: Record<string, string> = {
  ban: "Бан", unban: "Разбан", temp_ban: "Временный бан",
  update_balance: "Изменение баланса", reset_stats: "Сброс статистики",
  change_role: "Смена роли", kick: "Кик",
  update_shop_item: "Обновление товара", create_shop_item: "Новый товар",
  toggle_shop_item: "Вкл/выкл товар", mass_notify: "Массовая рассылка",
};

const SEGMENT_LABELS: Record<string, string> = {
  all: "Все игроки",
  inactive_7d: "Неактивные 7+ дней",
  top_100: "Топ-100 по рейтингу",
  newbies: "Новички (< 7 дней)",
};

const BAN_DURATIONS = [
  { label: "1 час", ms: 3600000 },
  { label: "1 день", ms: 86400000 },
  { label: "7 дней", ms: 604800000 },
  { label: "30 дней", ms: 2592000000 },
  { label: "Навсегда", ms: null },
] as const;

/* ================================================================
   ADMIN PANEL
   ================================================================ */
export default function AdminPanel() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("players");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="text-amber-100 text-lg animate-pulse">Загрузка...</div>
      </div>
    );
  }

  const isAdmin = user?.role === "admin";
  const isGM = user?.role === "gm";

  if (!user || (!isAdmin && !isGM)) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-red-500 mx-auto" />
          <h1 className="text-2xl font-bold text-amber-100">Доступ запрещён</h1>
          <p className="text-gray-400">У вас нет прав администратора</p>
          <Button variant="outline" onClick={() => setLocation("/")}>
            <ArrowLeft className="w-4 h-4 mr-2" /> Вернуться в лобби
          </Button>
        </div>
      </div>
    );
  }

  const allTabs: { id: Tab; label: string; icon: React.ElementType; adminOnly?: boolean }[] = [
    { id: "players", label: "Игроки", icon: Users },
    { id: "monitoring", label: "Мониторинг", icon: Activity, adminOnly: true },
    { id: "transactions", label: "Транзакции", icon: ArrowLeftRight, adminOnly: true },
    { id: "audit", label: "Аудит", icon: ClipboardList, adminOnly: true },
    { id: "antifraud", label: "Антифрод", icon: AlertTriangle },
    { id: "shop", label: "Магазин", icon: ShoppingCart, adminOnly: true },
    { id: "notifications", label: "Рассылки", icon: Bell, adminOnly: true },
    { id: "moderation", label: "Модерация", icon: Flag },
    { id: "contact", label: "Сообщения", icon: MessageSquare, adminOnly: true },
    { id: "season_test", label: "Тест сезона", icon: FlaskConical, adminOnly: true },
    { id: "tools", label: "Инструменты", icon: Wrench, adminOnly: true },
  ];
  const tabs = isGM ? allTabs.filter(t => !t.adminOnly) : allTabs;

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-gray-100">
      {/* Header */}
      <div
        className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-40"
        style={{ paddingTop: "env(safe-area-inset-top)" }}
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 h-12 sm:h-14 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setLocation("/")}
              aria-label="Вернуться в лобби"
              className="text-gray-400 hover:text-amber-100 px-2 sm:px-3"
            >
              <ArrowLeft className="w-4 h-4 sm:mr-1" />
              <span className="hidden sm:inline">Лобби</span>
            </Button>
            <div className="h-5 sm:h-6 w-px bg-gray-700" />
            <Shield className="w-4 h-4 sm:w-5 sm:h-5 text-amber-500 shrink-0" />
            <span className="text-sm sm:text-base font-bold text-amber-100">{isGM ? "GM" : "Админ"}</span>
          </div>
          <span className="text-xs sm:text-sm text-gray-500 truncate max-w-[120px] sm:max-w-none">{user.name}</span>
        </div>
      </div>

      {/* Tab bar — desktop: horizontal tabs, mobile: dropdown */}
      <div className="border-b border-gray-800">
        {/* Desktop tabs */}
        <div className="hidden sm:block overflow-x-auto">
          <div className="max-w-7xl mx-auto px-4 flex gap-1">
            {tabs.map(t => (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                  tab === t.id
                    ? "border-amber-500 text-amber-100"
                    : "border-transparent text-gray-500 hover:text-gray-300"
                }`}
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </div>
        {/* Mobile tab selector */}
        <div className="sm:hidden">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="w-full flex items-center justify-between px-4 py-3 text-sm font-medium text-amber-100"
          >
            <div className="flex items-center gap-2">
              {(() => { const cur = tabs.find(t => t.id === tab); return cur ? <><cur.icon className="w-4 h-4" />{cur.label}</> : null; })()}
            </div>
            {mobileMenuOpen ? <X className="w-4 h-4 text-gray-400" /> : <Menu className="w-4 h-4 text-gray-400" />}
          </button>
          {mobileMenuOpen && (
            <div className="border-t border-gray-800 bg-gray-950/95 backdrop-blur">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => { setTab(t.id); setMobileMenuOpen(false); }}
                  className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                    tab === t.id
                      ? "bg-amber-900/20 text-amber-100 border-l-2 border-amber-500"
                      : "text-gray-400 hover:bg-gray-900/50 hover:text-gray-200 border-l-2 border-transparent"
                  }`}
                >
                  <t.icon className="w-4 h-4" />
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-6">
        {tab === "players" && <PlayersTab isGM={isGM} />}
        {tab === "monitoring" && isAdmin && <MonitoringTab />}
        {tab === "transactions" && isAdmin && <TransactionsTab />}
        {tab === "audit" && isAdmin && <AuditTab />}
        {tab === "antifraud" && <AntifraudTab />}
        {tab === "shop" && isAdmin && <ShopManagementTab />}
        {tab === "notifications" && isAdmin && <MassNotificationsTab />}
        {tab === "moderation" && (isAdmin || isGM) && <ModerationTab />}
        {tab === "contact" && isAdmin && <ContactMessagesTab />}
        {tab === "season_test" && isAdmin && <SeasonTestTab />}
        {tab === "tools" && isAdmin && <ToolsTab />}
      </div>
    </div>
  );
}

/* ================================================================
   PLAYERS TAB
   ================================================================ */
function PlayersTab({ isGM = false }: { isGM?: boolean }) {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [profilePlayerId, setProfilePlayerId] = useState<number | null>(null);
  const limit = 20;

  const stableSearch = useMemo(() => search, [search]);
  const { data, isLoading, refetch } = trpc.admin.players.useQuery(
    { search: stableSearch || undefined, limit, offset: page * limit },
  );

  const [selectedPlayer, setSelectedPlayer] = useState<any>(null);
  const [showBanDialog, setShowBanDialog] = useState(false);
  const [showBalanceDialog, setShowBalanceDialog] = useState(false);
  const [banReason, setBanReason] = useState("");
  const [banDuration, setBanDuration] = useState<number | null>(null);
  const [balanceCurrency, setBalanceCurrency] = useState<"tenge" | "shanyrak">("shanyrak");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceDescription, setBalanceDescription] = useState("");

  const utils = trpc.useUtils();

  const banMutation = trpc.admin.banPlayer.useMutation({
    onSuccess: () => {
      toast.success("Игрок заблокирован");
      setShowBanDialog(false);
      setBanReason("");
      setBanDuration(null);
      utils.admin.players.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const unbanMutation = trpc.admin.unbanPlayer.useMutation({
    onSuccess: () => {
      toast.success("Игрок разблокирован");
      utils.admin.players.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const resetStatsMutation = trpc.admin.resetStats.useMutation({
    onSuccess: () => {
      toast.success("Статистика сброшена");
      utils.admin.players.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const updateBalanceMutation = trpc.admin.updateBalance.useMutation({
    onSuccess: () => {
      toast.success("Баланс обновлён");
      setShowBalanceDialog(false);
      setBalanceAmount("");
      setBalanceDescription("");
      utils.admin.players.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  // If a profile is selected, show the profile sub-view
  if (profilePlayerId !== null) {
    return (
      <PlayerProfileView
        profileId={profilePlayerId}
        onBack={() => setProfilePlayerId(null)}
        isGM={isGM}
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Поиск по имени или Game ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-10 bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-500"
          />
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-700 text-gray-300">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500">Всего: {formatNumber(data?.total)}</span>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-800 -mx-4 sm:mx-0">
        <table className="w-full text-sm min-w-[800px]">
          <thead className="bg-gray-900/50">
            <tr className="text-left text-gray-400">
              <th className="px-3 sm:px-4 py-3 font-medium">ID</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Имя</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Рейтинг</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Игры</th>
              <th className="px-3 sm:px-4 py-3 font-medium">W/L</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Тенге</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Шаныраки</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Статус</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Действия</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Загрузка...</td></tr>
            ) : !data?.players?.length ? (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">Игроки не найдены</td></tr>
            ) : (
              data.players.map((p: any) => (
                <tr key={p.id} className="hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400">#{p.gameId}</td>
                  <td className="px-4 py-3 font-medium text-amber-100">
                    {p.displayName || p.userName || "—"}
                    {p.displayName && p.userName && p.displayName !== p.userName && (
                      <span className="ml-1 text-xs text-gray-500">({p.userName})</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{formatNumber(p.rating)}</td>
                  <td className="px-4 py-3">{formatNumber(p.gamesPlayed)}</td>
                  <td className="px-4 py-3">
                    <span className="text-green-400">{p.wins}</span>
                    {" / "}
                    <span className="text-red-400">{p.losses}</span>
                  </td>
                  <td className="px-4 py-3">{formatNumber(p.balanceTenge)}</td>
                  <td className="px-4 py-3">{formatNumber(p.balanceShanyrak)}</td>
                  <td className="px-4 py-3">
                    {p.isBanned ? (
                      <span className="inline-flex items-center gap-1 text-red-400 text-xs font-medium">
                        <Ban className="w-3 h-3" /> Бан
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-green-400 text-xs font-medium">
                        <CheckCircle className="w-3 h-3" /> Активен
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1 flex-wrap">
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300"
                        onClick={() => setProfilePlayerId(p.id)}
                      >
                        <Eye className="w-3 h-3 mr-1" /> Профиль
                      </Button>
                      {!isGM && (
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300"
                          onClick={() => { setSelectedPlayer(p); setShowBalanceDialog(true); }}
                        >
                          <DollarSign className="w-3 h-3 mr-1" /> Баланс
                        </Button>
                      )}
                      {p.isBanned ? (
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 px-2 text-xs text-green-400 hover:text-green-300"
                          onClick={() => unbanMutation.mutate({ profileId: p.id })}
                          disabled={unbanMutation.isPending}
                        >
                          <CheckCircle className="w-3 h-3 mr-1" /> Разбан
                        </Button>
                      ) : (
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 px-2 text-xs text-red-400 hover:text-red-300"
                          onClick={() => { setSelectedPlayer(p); setBanDuration(null); setShowBanDialog(true); }}
                        >
                          <Ban className="w-3 h-3 mr-1" /> Бан
                        </Button>
                      )}
                      {!isGM && (
                        <Button
                          variant="ghost" size="sm"
                          className="h-7 px-2 text-xs text-gray-400 hover:text-gray-300"
                          onClick={() => {
                            if (confirm(`Сбросить статистику ${p.displayName}?`)) {
                              resetStatsMutation.mutate({ profileId: p.id });
                            }
                          }}
                          disabled={resetStatsMutation.isPending}
                        >
                          <Trash2 className="w-3 h-3 mr-1" /> Сброс
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <Button
            variant="outline" size="sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="border-gray-700 text-gray-300"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Назад
          </Button>
          <span className="text-sm text-gray-500">
            Страница {page + 1} из {totalPages}
          </span>
          <Button
            variant="outline" size="sm"
            disabled={page >= totalPages - 1}
            onClick={() => setPage(p => p + 1)}
            className="border-gray-700 text-gray-300"
          >
            Далее <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}

      {/* Ban Dialog — with duration selection */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle>Заблокировать {selectedPlayer?.displayName}</DialogTitle>
            <DialogDescription className="text-gray-400">Укажите причину и длительность блокировки</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <Input
              placeholder="Причина бана..."
              value={banReason}
              onChange={e => setBanReason(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
            <div>
              <label className="text-xs text-gray-400 mb-2 block">Длительность</label>
              <div className="flex flex-wrap gap-2">
                {BAN_DURATIONS.map(d => (
                  <button
                    key={d.label}
                    onClick={() => setBanDuration(d.ms)}
                    className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                      banDuration === d.ms
                        ? "border-amber-500 bg-amber-900/30 text-amber-100"
                        : "border-gray-700 text-gray-400 hover:text-gray-200"
                    }`}
                  >
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)} className="border-gray-700 text-gray-300">
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={!banReason.trim() || banDuration === undefined || banMutation.isPending}
              onClick={() => selectedPlayer && banMutation.mutate({
                profileId: selectedPlayer.id,
                reason: banReason,
                durationMs: banDuration,
              })}
            >
              {banDuration === null ? "Заблокировать навсегда" : "Заблокировать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Balance Dialog */}
      <Dialog open={showBalanceDialog} onOpenChange={setShowBalanceDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle>Изменить баланс: {selectedPlayer?.displayName}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Текущий баланс: {formatNumber(selectedPlayer?.balanceTenge)} тенге, {formatNumber(selectedPlayer?.balanceShanyrak)} шаныраков
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="flex gap-2">
              <Button
                variant={balanceCurrency === "shanyrak" ? "default" : "outline"}
                size="sm"
                onClick={() => setBalanceCurrency("shanyrak")}
                className={balanceCurrency === "shanyrak" ? "bg-amber-600" : "border-gray-700 text-gray-300"}
              >
                Шаныраки
              </Button>
              <Button
                variant={balanceCurrency === "tenge" ? "default" : "outline"}
                size="sm"
                onClick={() => setBalanceCurrency("tenge")}
                className={balanceCurrency === "tenge" ? "bg-amber-600" : "border-gray-700 text-gray-300"}
              >
                Тенге
              </Button>
            </div>
            <Input
              type="number"
              placeholder="Сумма (+ начислить, - списать)"
              value={balanceAmount}
              onChange={e => setBalanceAmount(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
            <Input
              placeholder="Описание операции"
              value={balanceDescription}
              onChange={e => setBalanceDescription(e.target.value)}
              className="bg-gray-800 border-gray-700 text-gray-100"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBalanceDialog(false)} className="border-gray-700 text-gray-300">
              Отмена
            </Button>
            <Button
              disabled={!balanceAmount || !balanceDescription.trim() || updateBalanceMutation.isPending}
              onClick={() => selectedPlayer && updateBalanceMutation.mutate({
                profileId: selectedPlayer.id,
                currency: balanceCurrency,
                amount: parseInt(balanceAmount),
                description: balanceDescription,
              })}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Применить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================================================================
   PLAYER PROFILE VIEW (sub-view inside Players tab)
   ================================================================ */
function PlayerProfileView({ profileId, onBack, isGM = false }: { profileId: number; onBack: () => void; isGM?: boolean }) {
  const [profileTab, setProfileTab] = useState<"info" | "transactions" | "games" | "purchases" | "reset">("info");

  const { data: detail, isLoading, refetch } = trpc.admin.playerDetail.useQuery({ profileId });

  const utils = trpc.useUtils();

  const updateRoleMutation = trpc.admin.updateRole.useMutation({
    onSuccess: () => {
      toast.success("Роль обновлена");
      refetch();
      utils.admin.players.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="text-center py-12 text-gray-500 animate-pulse">Загрузка профиля...</div>
    );
  }

  if (!detail) {
    return (
      <div className="text-center py-12 space-y-4">
        <p className="text-gray-500">Профиль не найден</p>
        <Button variant="outline" onClick={onBack} className="border-gray-700 text-gray-300">
          <ArrowLeft className="w-4 h-4 mr-2" /> Назад
        </Button>
      </div>
    );
  }

  const profileTabs = [
    { id: "info" as const, label: "Информация", icon: Users },
    { id: "transactions" as const, label: "Транзакции", icon: ArrowLeftRight },
    { id: "games" as const, label: "История игр", icon: Gamepad2 },
    { id: "purchases" as const, label: "Покупки", icon: ShoppingCart },
    { id: "reset" as const, label: "Обнуление", icon: RotateCcw },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-400 hover:text-amber-100">
            <ArrowLeft className="w-4 h-4 mr-1" /> Назад
          </Button>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-700 text-gray-300">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-lg font-bold text-amber-100">
            {detail.displayName || "Без имени"} <span className="text-gray-500 font-normal text-sm">#{detail.gameId}</span>
          </h2>
          {detail.role === "admin" && (
            <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
              <Crown className="w-3 h-3" /> Админ
            </span>
          )}
          {detail.role === "gm" && (
            <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded flex items-center gap-1">
              <Crown className="w-3 h-3" /> GM
            </span>
          )}
          {detail.isBanned && (
            <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded flex items-center gap-1">
              <Ban className="w-3 h-3" /> Забанен
              {detail.bannedUntil && (
                <span className="ml-1 text-red-400">({formatTimeRemaining(detail.bannedUntil)})</span>
              )}
            </span>
          )}
        </div>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-800 overflow-x-auto">
        {profileTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setProfileTab(t.id)}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              profileTab === t.id
                ? "border-amber-500 text-amber-100"
                : "border-transparent text-gray-500 hover:text-gray-300"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Sub-tab content */}
      {profileTab === "info" && (
        <ProfileInfoSection
          detail={detail}
          onUpdateRole={(role) => updateRoleMutation.mutate({ profileId, role })}
          isUpdatingRole={updateRoleMutation.isPending}
          isGM={isGM}
        />
      )}
      {profileTab === "transactions" && <ProfileTransactionsSection profileId={profileId} />}
      {profileTab === "games" && <ProfileGamesSection profileId={profileId} />}
      {profileTab === "purchases" && <ProfilePurchasesSection profileId={profileId} />}
      {profileTab === "reset" && <ProfileResetSection profileId={profileId} playerName={detail.displayName || `#${detail.gameId}`} />}
    </div>
  );
}

/* ─── Profile Info Section ─── */
function ProfileInfoSection({
  detail,
  onUpdateRole,
  isUpdatingRole,
  isGM = false,
}: {
  detail: any;
  onUpdateRole: (role: "admin" | "user" | "gm") => void;
  isUpdatingRole: boolean;
  isGM?: boolean;
}) {
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"admin" | "user" | "gm">("user");
  const [showRenameDialog, setShowRenameDialog] = useState(false);
  const [newNameInput, setNewNameInput] = useState("");
  const utils = trpc.useUtils();
  const setPlayerNameMut = trpc.admin.setPlayerName.useMutation({
    onSuccess: (res) => {
      toast.success(`Имя изменено на: ${res.newName}`);
      setShowRenameDialog(false);
      setNewNameInput("");
      utils.admin.playerDetail.invalidate({ profileId: detail.id });
    },
    onError: (e) => toast.error(`Ошибка: ${e.message}`),
  });

  return (
    <div className="space-y-6">
      {/* Info cards grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <InfoCard label="Рейтинг" value={formatNumber(detail.rating)} icon={Trophy} color="text-amber-400" />
        <InfoCard label="Игры" value={formatNumber(detail.gamesPlayed)} icon={Gamepad2} color="text-blue-400" />
        <InfoCard label="Победы" value={formatNumber(detail.wins)} icon={Trophy} color="text-green-400" />
        <InfoCard label="Поражения" value={formatNumber(detail.losses)} icon={Ban} color="text-red-400" />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <InfoCard label="Тенге" value={formatNumber(detail.balanceTenge)} icon={DollarSign} color="text-emerald-400" />
        <InfoCard label="Шаныраки" value={formatNumber(detail.balanceShanyrak)} icon={DollarSign} color="text-yellow-400" />
        <InfoCard label="Обучение" value={detail.tutorialCompleted ? "Пройдено" : "Нет"} icon={CheckCircle} color={detail.tutorialCompleted ? "text-green-400" : "text-gray-500"} />
        <InfoCard label="Роль" value={detail.role === "admin" ? "Админ" : detail.role === "gm" ? "GM" : "Игрок"} icon={Crown} color={detail.role === "admin" ? "text-amber-400" : detail.role === "gm" ? "text-purple-400" : "text-gray-400"} />
      </div>

      {/* Details table */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-800">
            <DetailRow label="Profile ID" value={`#${detail.id}`} />
            <DetailRow label="Game ID" value={`#${detail.gameId}`} />
            <DetailRow label="Open ID" value={detail.openId || "—"} mono />
            {!isGM && <DetailRow label="Email" value={detail.email || "—"} />}
            <DetailRow label="Аватар" value={detail.avatarId || "wolf"} />
            <DetailRow label="Рамка" value={detail.equippedFrame || "Нет"} />
            <DetailRow label="Последний вход" value={formatDate(detail.lastSignedIn)} />
            <DetailRow label="Регистрация (user)" value={formatDate(detail.userCreatedAt)} />
            <DetailRow label="Регистрация (profile)" value={formatDate(detail.createdAt)} />
            {detail.isBanned && (
              <>
                <DetailRow label="Причина бана" value={detail.banReason || "—"} highlight="red" />
                <DetailRow label="Дата бана" value={formatDate(detail.bannedAt)} highlight="red" />
                <DetailRow label="Бан до" value={detail.bannedUntil ? `${formatDate(detail.bannedUntil)} (${formatTimeRemaining(detail.bannedUntil)})` : "Навсегда"} highlight="red" />
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Role change button (admin only) */}
      <div className="flex flex-wrap gap-3">
        {!isGM && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSelectedRole(detail.role === "admin" ? "user" : detail.role === "gm" ? "user" : "admin");
              setShowRoleDialog(true);
            }}
            className="border-gray-700 text-gray-300"
          >
            <Crown className="w-4 h-4 mr-2" />
            Сменить роль
          </Button>
        )}
        <Button
          variant="outline"
          size="sm"
          onClick={() => { setNewNameInput(detail.displayName || ""); setShowRenameDialog(true); }}
          className="border-orange-700/60 text-orange-300 hover:bg-orange-900/20"
        >
          ✏️ Принудительно переименовать
        </Button>
      </div>

      {/* Role change dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle>Смена роли</DialogTitle>
            <DialogDescription className="text-gray-400">
              Текущая роль: <strong className="text-amber-100">{detail.role === "admin" ? "Админ" : detail.role === "gm" ? "GM" : "Игрок"}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <label className="text-xs text-gray-400 block">Новая роль</label>
            <div className="flex gap-2">
              {(["admin", "gm", "user"] as const).map(r => (
                <button
                  key={r}
                  onClick={() => setSelectedRole(r)}
                  disabled={r === detail.role}
                  className={`px-4 py-2 text-sm rounded border transition-colors ${
                    selectedRole === r
                      ? "border-amber-500 bg-amber-900/30 text-amber-100"
                      : r === detail.role
                        ? "border-gray-800 text-gray-600 cursor-not-allowed"
                        : "border-gray-700 text-gray-400 hover:text-gray-200"
                  }`}
                >
                  {r === "admin" ? "Админ" : r === "gm" ? "GM" : "Игрок"}
                </button>
              ))}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)} className="border-gray-700 text-gray-300">
              Отмена
            </Button>
            <Button
              disabled={isUpdatingRole || selectedRole === detail.role}
              onClick={() => {
                onUpdateRole(selectedRole);
                setShowRoleDialog(false);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Force rename dialog */}
      <Dialog open={showRenameDialog} onOpenChange={setShowRenameDialog}>
        <DialogContent className="bg-gray-900 border-orange-800/60 text-gray-100">
          <DialogHeader>
            <DialogTitle className="text-orange-300">✉️ Принудительное переименование</DialogTitle>
            <DialogDescription className="text-gray-400">
              Игрок: <strong className="text-amber-100">{detail.displayName || `#${detail.gameId}`}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <label className="text-xs text-gray-400 block">Новое имя (1–32 символа)</label>
            <Input
              value={newNameInput}
              onChange={e => setNewNameInput(e.target.value)}
              placeholder="Введите новое имя..."
              maxLength={32}
              className="bg-gray-800 border-gray-700 text-amber-100"
              onKeyDown={e => { if (e.key === 'Enter' && newNameInput.trim()) setPlayerNameMut.mutate({ profileId: detail.id, newName: newNameInput.trim() }); }}
            />
            <p className="text-xs text-gray-500">Имя будет установлено без проверки фильтра матов.</p>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowRenameDialog(false)} className="border-gray-700 text-gray-300">
              Отмена
            </Button>
            <Button
              disabled={setPlayerNameMut.isPending || !newNameInput.trim()}
              onClick={() => setPlayerNameMut.mutate({ profileId: detail.id, newName: newNameInput.trim() })}
              className="bg-orange-700 hover:bg-orange-600 text-white"
            >
              {setPlayerNameMut.isPending ? 'Применяем...' : 'Применить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="border border-gray-800 rounded-lg p-3 sm:p-4 bg-gray-900/30">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${color}`} />
        <span className="text-[10px] sm:text-xs text-gray-500 leading-tight">{label}</span>
      </div>
      <div className="text-lg sm:text-xl font-bold text-gray-100 truncate">{value}</div>
    </div>
  );
}

function DetailRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: "red" }) {
  return (
    <tr className="hover:bg-gray-900/30">
      <td className="px-3 sm:px-4 py-2.5 text-gray-500 text-xs sm:text-sm w-28 sm:w-48">{label}</td>
      <td className={`px-3 sm:px-4 py-2.5 text-xs sm:text-sm break-all ${
        highlight === "red" ? "text-red-400" : "text-gray-100"
      } ${mono ? "font-mono" : ""}`}>
        {value}
      </td>
    </tr>
  );
}

/* ─── Profile Transactions Section ─── */
function ProfileTransactionsSection({ profileId }: { profileId: number }) {
  const [page, setPage] = useState(0);
  const [sortBy, setSortBy] = useState<"date" | "amount">("date");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const limit = 30;

  const { data, isLoading } = trpc.admin.playerTransactions.useQuery({
    profileId,
    limit,
    offset: page * limit,
    sortBy,
    sortDir,
  });

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  const toggleSort = (col: "date" | "amount") => {
    if (sortBy === col) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortBy(col);
      setSortDir("desc");
    }
    setPage(0);
  };

  const SortIcon = ({ col }: { col: "date" | "amount" }) => {
    if (sortBy !== col) return <ArrowUpDown className="w-3 h-3 ml-1 opacity-40" />;
    return sortDir === "asc"
      ? <ChevronUp className="w-3 h-3 ml-1 text-amber-400" />
      : <ChevronDown className="w-3 h-3 ml-1 text-amber-400" />;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Всего транзакций: {formatNumber(data?.total)}</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800 -mx-4 sm:mx-0">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-900/50">
            <tr className="text-left text-gray-400">
              <th className="px-3 sm:px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("date")}>
                <span className="flex items-center">Дата <SortIcon col="date" /></span>
              </th>
              <th className="px-3 sm:px-4 py-3 font-medium">Тип</th>
              <th className="px-3 sm:px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("amount")}>
                <span className="flex items-center">Сумма <SortIcon col="amount" /></span>
              </th>
              <th className="px-3 sm:px-4 py-3 font-medium">Валюта</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Баланс после</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Описание</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Загрузка...</td></tr>
            ) : !data?.transactions?.length ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Транзакций нет</td></tr>
            ) : (
              data.transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      t.type === 'game_entry' ? 'bg-red-900/50 text-red-300' :
                      t.type === 'game_reward' ? 'bg-green-900/50 text-green-300' :
                      t.type === 'tutorial_reward' ? 'bg-blue-900/50 text-blue-300' :
                      t.type === 'free_topup' ? 'bg-amber-900/50 text-amber-300' :
                      t.type === 'shop_purchase' ? 'bg-purple-900/50 text-purple-300' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={t.amount >= 0 ? "text-green-400" : "text-red-400"}>
                      {t.amount >= 0 ? "+" : ""}{formatNumber(t.amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{t.currency === "shanyrak" ? "🏠 Шаныраки" : "₸ Тенге"}</td>
                  <td className="px-4 py-3 text-gray-400">{t.balanceAfter != null ? formatNumber(t.balanceAfter) : "—"}</td>
                  <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{t.description || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-gray-700 text-gray-300">
            <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline ml-1">Назад</span>
          </Button>
          <span className="text-xs sm:text-sm text-gray-500">{page + 1}/{totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="border-gray-700 text-gray-300">
            <span className="hidden sm:inline mr-1">Далее</span><ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Profile Games Section ─── */
function ProfileGamesSection({ profileId }: { profileId: number }) {
  const [page, setPage] = useState(0);
  const limit = 20;

  const { data, isLoading } = trpc.admin.playerGameHistory.useQuery({
    profileId,
    limit,
    offset: page * limit,
  });

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Всего игр: {formatNumber(data?.total)}</span>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800 -mx-4 sm:mx-0">
        <table className="w-full text-sm min-w-[650px]">
          <thead className="bg-gray-900/50">
            <tr className="text-left text-gray-400">
              <th className="px-3 sm:px-4 py-3 font-medium">Дата</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Игроков</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Место</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Результат</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Рейтинг</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Длительность</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Комната</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Загрузка...</td></tr>
            ) : !data?.games?.length ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Игр не найдено</td></tr>
            ) : (
              data.games.map((g: any) => (
                <tr key={g.id} className="hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(g.createdAt)}</td>
                  <td className="px-4 py-3">{g.playerCount}</td>
                  <td className="px-4 py-3">
                    <span className={`font-medium ${
                      g.place === 1 ? "text-amber-400" :
                      g.isLoser ? "text-red-400" :
                      "text-gray-300"
                    }`}>
                      {g.place === 1 ? "🥇 1-е" :
                       g.place === 2 ? "🥈 2-е" :
                       g.place === 3 ? "🥉 3-е" :
                       `${g.place}-е`}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {g.isLoser ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-red-900/50 text-red-300">Дурак</span>
                    ) : g.place === 1 ? (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-green-900/50 text-green-300">Победа</span>
                    ) : (
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-gray-800 text-gray-400">Вышел</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={g.ratingDelta >= 0 ? "text-green-400" : "text-red-400"}>
                      {g.ratingDelta >= 0 ? "+" : ""}{g.ratingDelta}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400">{formatDuration(g.durationSeconds)}</td>
                  <td className="px-4 py-3 text-gray-500 font-mono text-xs">{g.roomId?.slice(0, 8) || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-gray-700 text-gray-300">
            <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline ml-1">Назад</span>
          </Button>
          <span className="text-xs sm:text-sm text-gray-500">{page + 1}/{totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="border-gray-700 text-gray-300">
            <span className="hidden sm:inline mr-1">Далее</span><ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ─── Profile Purchases Section ─── */
function ProfilePurchasesSection({ profileId }: { profileId: number }) {
  const utils = trpc.useUtils();
  const [confirmRevoke, setConfirmRevoke] = useState<{ id: number; desc: string } | null>(null);
  // Track revoked transaction IDs for optimistic UI (hide immediately after revoke)
  const [revokedIds, setRevokedIds] = useState<Set<number>>(new Set());

  const { data: purchases, isLoading, refetch } = trpc.admin.getPlayerPurchases.useQuery({ profileId });

  const revokeMutation = trpc.admin.revokePlayerPurchase.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success('Покупка отменена, средства возвращены');
        // Optimistically remove the revoked item from the list
        if (confirmRevoke) {
          setRevokedIds(prev => new Set(Array.from(prev).concat(confirmRevoke.id)));
        }
        refetch();
        utils.admin.playerDetail.invalidate({ profileId });
      } else {
        toast.error(`Ошибка: ${result.reason}`);
      }
      setConfirmRevoke(null);
    },
    onError: (e) => {
      toast.error(e.message);
      setConfirmRevoke(null);
    },
  });

  const getItemLabel = (desc: string, type?: string) => {
    if (desc.startsWith('Покупка колоды:')) return { icon: '🃏', label: desc.replace('Покупка колоды: ', '') };
    if (desc.startsWith('Покупка стола:')) return { icon: '🎯', label: desc.replace('Покупка стола: ', '') };
    if (desc.startsWith('Покупка рамки:')) return { icon: '🖼️', label: desc.replace('Покупка рамки: ', '') };
    if (desc.startsWith('Покупка аватара:')) return { icon: '👤', label: desc.replace('Покупка аватара: ', '') };
    if (desc.startsWith('Purchased playlist #')) return { icon: '🎵', label: `Плейлист #${desc.replace('Purchased playlist #', '')}` };
    if (desc.startsWith('Premium subscription')) return { icon: '👑', label: 'Premium подписка' };
    if (type === 'premium_purchase') return { icon: '👑', label: desc || 'Premium подписка' };
    return { icon: '🛒', label: desc || 'Покупка' };
  };

  const getTypeLabel = (type: string) => {
    const map: Record<string, string> = {
      shop_purchase: 'Магазин',
      premium_purchase: 'Premium',
    };
    return map[type] ?? type;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <span className="text-sm text-gray-500">Предметы, купленные в магазине (аватары, рамки, колоды, плейлисты, Premium)</span>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-700 text-gray-300">
          <RefreshCw className="w-3.5 h-3.5" />
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center py-8 text-gray-500 animate-pulse">Загрузка...</div>
      ) : !purchases?.length ? (
        <div className="text-center py-8 text-gray-500">
          <ShoppingCart className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p>Покупок нет — игрок ничего не покупал</p>
        </div>
      ) : (
        <div className="space-y-2">
          {purchases
            .filter((p: any) => !revokedIds.has(p.id))
            .map((p: any) => {
            const { icon, label } = getItemLabel(p.description ?? '', p.type);
            const isBeingRevoked = revokeMutation.isPending && confirmRevoke?.id === p.id;
            const canRevoke = p.type === 'shop_purchase' || p.type === 'premium_purchase';
            const amountColor = p.amount > 0 ? 'text-green-400' : 'text-red-400';
            return (
              <div key={p.id} className={`flex items-center justify-between p-3 rounded-lg bg-gray-900/40 border border-gray-800 hover:border-gray-700 transition-all ${isBeingRevoked ? 'opacity-50' : ''}`}>
                <div className="flex items-center gap-3 min-w-0">
                  <span className="text-xl shrink-0">{icon}</span>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-medium text-gray-200 truncate">{label}</div>
                      <span className="shrink-0 text-xs px-1.5 py-0.5 rounded bg-gray-800 text-gray-400">{getTypeLabel(p.type)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-0.5">
                      <span>{formatDate(p.createdAt)}</span>
                      <span>•</span>
                      <span className={p.currency === 'shanyrak' ? 'text-amber-400' : amountColor}>
                        {p.amount > 0 ? '+' : ''}{p.amount} {p.currency === 'shanyrak' ? '🏠 шаныраков' : '₸ тенге'}
                      </span>
                    </div>
                  </div>
                </div>
                {!isBeingRevoked && canRevoke && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setConfirmRevoke({ id: p.id, desc: p.description ?? '' })}
                    className="shrink-0 ml-2 border-red-800/50 text-red-400 hover:bg-red-900/20 hover:text-red-300 hover:border-red-700"
                  >
                    <Trash2 className="w-3.5 h-3.5 mr-1" /> Отменить
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Confirm dialog */}
      <Dialog open={!!confirmRevoke} onOpenChange={(o) => !o && setConfirmRevoke(null)}>
        <DialogContent className="bg-[#0f2035] border-gray-700 text-gray-100 max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-amber-100">Отменить покупку?</DialogTitle>
            <DialogDescription className="text-gray-400">
              Товар будет удалён из инвентаря игрока, а средства возвращены на баланс.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 px-1 rounded-lg bg-gray-900/50 border border-gray-800 text-sm text-gray-300">
            {confirmRevoke && getItemLabel(confirmRevoke.desc).label}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setConfirmRevoke(null)} className="border-gray-700 text-gray-300">
              Отмена
            </Button>
            <Button
              onClick={() => confirmRevoke && revokeMutation.mutate({ profileId, transactionId: confirmRevoke.id })}
              disabled={revokeMutation.isPending}
              className="bg-red-700 hover:bg-red-600 text-white"
            >
              {revokeMutation.isPending ? 'Отмена...' : 'Подтвердить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================================================================
   PROFILE RESET SECTION
   ================================================================ */
function ProfileResetSection({ profileId, playerName }: { profileId: number; playerName: string }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const utils = trpc.useUtils();

  const recalcManyFacesMutation = trpc.admin.recalculateManyFaces.useMutation({
    onSuccess: (result) => {
      toast.success(
        `Достижение "Многоликий" пересчитано: прогресс ${result.progress}/5${result.justUnlocked ? ' — РАЗБЛОКИРОВАНО!' : result.unlocked ? ' (уже было разблокировано)' : ''}`
      );
      utils.admin.playerDetail.invalidate({ profileId });
    },
    onError: (e) => toast.error(e.message),
  });

  const resetMutation = trpc.admin.resetPlayerAccount.useMutation({
    onSuccess: (result) => {
      if (result.success) {
        toast.success(`Аккаунт игрока успешно обнулён`);
        setShowConfirm(false);
        utils.admin.playerDetail.invalidate({ profileId });
      } else {
        toast.error(result.reason ?? 'Ошибка при обнулении');
      }
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Warning banner */}
      <div className="rounded-lg border border-red-800/60 bg-red-950/30 p-4 space-y-2">
        <div className="flex items-center gap-2 text-red-400 font-semibold">
          <AlertTriangle className="w-5 h-5" />
          <span>Опасное действие</span>
        </div>
        <p className="text-sm text-red-300/80">
          Полное обнуление аккаунта возвращает игрока к состоянию новой регистрации.
          Это действие необратимо.
        </p>
      </div>

      {/* What will be reset */}
      <div className="rounded-lg border border-gray-800 bg-gray-900/40 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-gray-300">Что будет сброшено:</h3>
        <ul className="text-sm text-gray-400 space-y-1.5">
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />Аватар → волк (wolf)</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />Рейтинг → 1000, статистика игр → 0</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />Баланс (тенге и шаныраки) → 0</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />Все предметы (аватары, рамки, колоды, столы, плейлисты) → удалены</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />Premium подписка → отключена</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />Все транзакции → удалены</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />Достижения и ежедневные задания → сброшены</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />Сезонный рейтинг и награды → удалены</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />Уведомления → удалены</li>
          <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-500 flex-shrink-0" />Бан → снят</li>
        </ul>
        <p className="text-xs text-gray-600 mt-2">Не трогается: авторизация (имя, email), история игр, друзья, жалобы.</p>
      </div>

      {/* Recalculate many_faces achievement */}
      <div className="rounded-lg border border-amber-800/40 bg-amber-950/20 p-4 space-y-3">
        <h3 className="text-sm font-semibold text-amber-300">Исправление достижений</h3>
        <p className="text-xs text-amber-200/70">
          Пересчитывает достижение «Многоликий» (владеть 5+ аватарками не считая классических).
          Используйте если игрок имеет 5+ аватарок, но достижение не засчитано.
        </p>
        <Button
          onClick={() => recalcManyFacesMutation.mutate({ profileId })}
          disabled={recalcManyFacesMutation.isPending}
          className="w-full bg-amber-700 hover:bg-amber-600 text-white font-semibold py-2"
        >
          {recalcManyFacesMutation.isPending ? (
            <><RotateCcw className="w-4 h-4 mr-2 animate-spin" /> Пересчитываем...</>
          ) : (
            <><RotateCcw className="w-4 h-4 mr-2" /> Пересчитать «Многоликий»</>
          )}
        </Button>
      </div>

      {/* Reset button */}
      <Button
        onClick={() => setShowConfirm(true)}
        className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold py-3 text-base"
      >
        <RotateCcw className="w-5 h-5 mr-2" />
        Обнулить аккаунт
      </Button>

      {/* Confirmation dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-gray-900 border-red-800 text-gray-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-red-400 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Подтвердите обнуление
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Вы собираетесь полностью сбросить аккаунт игрока{' '}
              <span className="font-semibold text-white">{playerName}</span>.
              Все данные будут удалены безвозвратно.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setShowConfirm(false)}
              disabled={resetMutation.isPending}
              className="border-gray-700 text-gray-300"
            >
              Отмена
            </Button>
            <Button
              onClick={() => resetMutation.mutate({ profileId })}
              disabled={resetMutation.isPending}
              className="bg-red-700 hover:bg-red-600 text-white"
            >
              {resetMutation.isPending ? (
                <><RotateCcw className="w-4 h-4 mr-2 animate-spin" /> Обнуляем...</>
              ) : (
                <><RotateCcw className="w-4 h-4 mr-2" /> Подтвердить обнуление</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================================================================
   MONITORING TAB
   ================================================================ */
function MonitoringTab() {
  const { data, isLoading, refetch } = trpc.admin.onlineStats.useQuery(undefined, {
    refetchInterval: 5000,
  });
  const globalStats = trpc.admin.globalStats.useQuery();

  const kickMutation = trpc.admin.kickPlayer.useMutation({
    onSuccess: () => { toast.success("Игрок отключён"); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  const closeAllRoomsMutation = trpc.admin.closeAllRooms.useMutation({
    onSuccess: (res) => { toast.success(`Закрыто комнат: ${res.count}`); refetch(); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4">
        <StatCard label="Игроков онлайн" value={data?.onlinePlayerCount ?? 0} icon={Users} color="text-green-400" />
        <StatCard label="Активных комнат" value={data?.activeRoomCount ?? 0} icon={Activity} color="text-blue-400" />
        <StatCard label="Всего игроков" value={globalStats.data?.totalPlayers ?? 0} icon={Users} color="text-amber-400" />
        <StatCard label="Всего игр" value={globalStats.data?.totalGames ?? 0} icon={ArrowLeftRight} color="text-purple-400" />
      </div>

      {/* Global economy */}
      {globalStats.data && (
        <div className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <StatCard label="Шаныраков в обороте" value={globalStats.data.totalShanyrak ?? 0} icon={DollarSign} color="text-yellow-400" />
            <StatCard label="Тенге в обороте" value={globalStats.data.totalTenge ?? 0} icon={DollarSign} color="text-emerald-400" />
            <StatCard label="Забаненных" value={globalStats.data.bannedCount ?? 0} icon={Ban} color="text-red-400" />
          </div>
          {/* Admin adjustments breakdown */}
          {((globalStats.data.adminDeductedShanyrak ?? 0) > 0 || (globalStats.data.adminDeductedTenge ?? 0) > 0 || (globalStats.data.adminAddedShanyrak ?? 0) > 0 || (globalStats.data.adminAddedTenge ?? 0) > 0) && (
            <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/20">
              <h4 className="text-sm font-medium text-gray-300 mb-3">Админ. корректировки балансов</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-3">
                  <div className="text-red-400 text-xs mb-1">Списано шаныраков</div>
                  <div className="text-red-300 font-bold">{formatNumber(globalStats.data.adminDeductedShanyrak ?? 0)}</div>
                </div>
                <div className="bg-red-900/20 border border-red-900/30 rounded-lg p-3">
                  <div className="text-red-400 text-xs mb-1">Списано тенге</div>
                  <div className="text-red-300 font-bold">{formatNumber(globalStats.data.adminDeductedTenge ?? 0)}</div>
                </div>
                <div className="bg-green-900/20 border border-green-900/30 rounded-lg p-3">
                  <div className="text-green-400 text-xs mb-1">Начислено шаныраков</div>
                  <div className="text-green-300 font-bold">{formatNumber(globalStats.data.adminAddedShanyrak ?? 0)}</div>
                </div>
                <div className="bg-green-900/20 border border-green-900/30 rounded-lg p-3">
                  <div className="text-green-400 text-xs mb-1">Начислено тенге</div>
                  <div className="text-green-300 font-bold">{formatNumber(globalStats.data.adminAddedTenge ?? 0)}</div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Active rooms */}
      <div>
        <div className="flex items-center justify-between mb-3 gap-2">
          <h3 className="text-base sm:text-lg font-semibold text-amber-100">Активные комнаты</h3>
          <div className="flex gap-2">
            <Button
              variant="outline" size="sm"
              onClick={() => {
                if (confirm('Закрыть ВСЕ активные комнаты? Все игры будут прерваны.')) {
                  closeAllRoomsMutation.mutate();
                }
              }}
              disabled={closeAllRoomsMutation.isPending}
              className="border-red-800 text-red-400 hover:bg-red-900/20 shrink-0"
            >
              Закрыть все
            </Button>
            <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-700 text-gray-300 shrink-0">
              <RefreshCw className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="text-gray-500 text-center py-8">Загрузка...</div>
        ) : !data?.rooms?.length ? (
          <div className="text-gray-500 text-center py-8 border border-gray-800 rounded-lg">Нет активных комнат</div>
        ) : (
          <div className="space-y-3">
            {data.rooms.map((room: any) => (
              <div key={room.roomId} className="border border-gray-800 rounded-lg p-4 bg-gray-900/30">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0 mb-2">
                  <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
                    <span className="text-xs text-gray-500 font-mono">{room.roomId.slice(0, 8)}</span>
                    {room.isTutorial && <span className="text-xs bg-blue-900/50 text-blue-300 px-2 py-0.5 rounded">Обучение</span>}
                    {room.withBots && <span className="text-xs bg-purple-900/50 text-purple-300 px-2 py-0.5 rounded">С ботами</span>}
                    {room.hasActiveGame && <span className="text-xs bg-green-900/50 text-green-300 px-2 py-0.5 rounded">В игре</span>}
                  </div>
                  <span className="text-sm text-gray-400">
                    {room.playerCount}/{room.maxPlayers} · Ставка: {formatNumber(room.betAmount)}
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {room.players.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 bg-gray-800/50 rounded px-3 py-1.5 text-sm">
                      <span className={p.isBot ? "text-gray-500" : "text-amber-100"}>{p.name}</span>
                      {p.isBot && <span className="text-xs text-gray-600">(бот)</span>}
                      {!p.isBot && (
                        <button
                          onClick={() => {
                            if (confirm(`Отключить ${p.name}?`)) {
                              kickMutation.mutate({ openId: p.id });
                            }
                          }}
                          className="text-red-500 hover:text-red-400 transition-colors"
                          title="Кикнуть"
                        >
                          <KickIcon className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, color }: { label: string; value: number; icon: React.ElementType; color: string }) {
  return (
    <div className="border border-gray-800 rounded-lg p-3 sm:p-4 bg-gray-900/30">
      <div className="flex items-center gap-1.5 sm:gap-2 mb-1">
        <Icon className={`w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0 ${color}`} />
        <span className="text-[10px] sm:text-xs text-gray-500 leading-tight">{label}</span>
      </div>
      <div className="text-xl sm:text-2xl font-bold text-gray-100 truncate">{formatNumber(value)}</div>
    </div>
  );
}

/* ================================================================
   TRANSACTIONS TAB
   ================================================================ */
function TransactionsTab() {
  const [page, setPage] = useState(0);
  const limit = 50;

  const { data, isLoading, refetch } = trpc.admin.transactions.useQuery(
    { limit, offset: page * limit },
  );

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-lg font-semibold text-amber-100">История транзакций</h3>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-700 text-gray-300">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500">Всего: {formatNumber(data?.total)}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800 -mx-4 sm:mx-0">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-900/50">
            <tr className="text-left text-gray-400">
              <th className="px-3 sm:px-4 py-3 font-medium">Дата</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Игрок</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Тип</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Сумма</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Описание</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Загрузка...</td></tr>
            ) : !data?.transactions?.length ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Транзакций нет</td></tr>
            ) : (
              data.transactions.map((t: any) => (
                <tr key={t.id} className="hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                  <td className="px-4 py-3 text-amber-100">{t.displayName || 'Игрок'} <span className="text-gray-500 text-xs">(ID {t.gameId ?? t.profileId})</span></td>
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      t.type === 'bet' ? 'bg-red-900/50 text-red-300' :
                      t.type === 'win' ? 'bg-green-900/50 text-green-300' :
                      t.type === 'reward' ? 'bg-amber-900/50 text-amber-300' :
                      t.type === 'admin' ? 'bg-purple-900/50 text-purple-300' :
                      t.type === 'purchase' ? 'bg-blue-900/50 text-blue-300' :
                      'bg-gray-800 text-gray-400'
                    }`}>
                      {t.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={t.amount >= 0 ? "text-green-400" : "text-red-400"}>
                      {t.amount >= 0 ? "+" : ""}{formatNumber(t.amount)} {t.currency === 'shanyrak' ? '🏠' : '₸'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{t.description || "—"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-gray-700 text-gray-300">
            <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline ml-1">Назад</span>
          </Button>
          <span className="text-xs sm:text-sm text-gray-500">{page + 1}/{totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="border-gray-700 text-gray-300">
            <span className="hidden sm:inline mr-1">Далее</span><ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   AUDIT TAB
   ================================================================ */
function AuditTab() {
  const [page, setPage] = useState(0);
  const [actionFilter, setActionFilter] = useState<string>("");
  const limit = 50;

  const { data, isLoading, refetch } = trpc.admin.auditLog.useQuery({
    actionFilter: actionFilter || undefined,
    limit,
    offset: page * limit,
  });

  const totalPages = Math.ceil((data?.total ?? 0) / limit);

  const actionTypes = [
    "", "ban", "unban", "temp_ban", "update_balance", "reset_stats",
    "change_role", "kick", "mass_notify",
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-amber-100">Лог действий</h3>
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={actionFilter}
              onChange={e => { setActionFilter(e.target.value); setPage(0); }}
              className="bg-gray-900 border border-gray-700 text-gray-100 text-sm rounded px-3 py-1.5"
            >
              <option value="">Все действия</option>
              {actionTypes.filter(Boolean).map(a => (
                <option key={a} value={a}>{ACTION_LABELS[a] || a}</option>
              ))}
            </select>
          </div>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-700 text-gray-300">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500">Всего: {formatNumber(data?.total)}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800 -mx-4 sm:mx-0">
        <table className="w-full text-sm min-w-[600px]">
          <thead className="bg-gray-900/50">
            <tr className="text-left text-gray-400">
              <th className="px-3 sm:px-4 py-3 font-medium">Дата</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Админ</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Действие</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Цель</th>
              <th className="px-3 sm:px-4 py-3 font-medium">Детали</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {isLoading ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Загрузка...</td></tr>
            ) : !data?.entries?.length ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Записей нет</td></tr>
            ) : (
              data.entries.map((entry: any) => {
                let details: Record<string, unknown> = {};
                try { details = entry.details ? JSON.parse(entry.details) : {}; } catch {}

                return (
                  <tr key={entry.id} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(entry.createdAt)}</td>
                    <td className="px-4 py-3 text-amber-100">{entry.adminName || `Admin #${entry.adminId}`}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                        entry.action === 'ban' || entry.action === 'temp_ban' ? 'bg-red-900/50 text-red-300' :
                        entry.action === 'unban' ? 'bg-green-900/50 text-green-300' :
                        entry.action === 'update_balance' ? 'bg-amber-900/50 text-amber-300' :
                        entry.action === 'change_role' ? 'bg-purple-900/50 text-purple-300' :
                        entry.action === 'mass_notify' ? 'bg-blue-900/50 text-blue-300' :
                        'bg-gray-800 text-gray-400'
                      }`}>
                        {ACTION_LABELS[entry.action] || entry.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">
                      {entry.targetProfileId
                        ? `${entry.targetName || 'Игрок'} (ID ${entry.targetGameId ?? entry.targetProfileId})`
                        : "—"}
                    </td>
                    <td className="px-4 py-3 text-gray-400 text-xs max-w-xs truncate">
                      {Object.entries(details).map(([k, v]) => `${k}: ${v}`).join(", ") || "—"}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-gray-700 text-gray-300">
            <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline ml-1">Назад</span>
          </Button>
          <span className="text-xs sm:text-sm text-gray-500">{page + 1}/{totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="border-gray-700 text-gray-300">
            <span className="hidden sm:inline mr-1">Далее</span><ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   ANTIFRAUD TAB
   ================================================================ */
function AntifraudTab() {
  const [section, setSection] = useState<"winrate" | "transactions" | "growth">("winrate");

  const winRateData = trpc.admin.antifraudWinRate.useQuery({}, { enabled: section === "winrate" });
  const txData = trpc.admin.antifraudTransactions.useQuery({}, { enabled: section === "transactions" });
  const growthData = trpc.admin.antifraudBalanceGrowth.useQuery({}, { enabled: section === "growth" });

  const sections = [
    { id: "winrate" as const, label: "Высокий винрейт", icon: Trophy },
    { id: "transactions" as const, label: "Крупные транзакции", icon: DollarSign },
    { id: "growth" as const, label: "Быстрый рост баланса", icon: ArrowUpDown },
  ];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-amber-100">Антифрод-мониторинг</h3>

      <div className="flex gap-2 flex-wrap">
        {sections.map(s => (
          <button
            key={s.id}
            onClick={() => setSection(s.id)}
            className={`flex items-center gap-2 px-4 py-2 text-sm rounded-lg border transition-colors ${
              section === s.id
                ? "border-amber-500 bg-amber-900/20 text-amber-100"
                : "border-gray-700 text-gray-400 hover:text-gray-200"
            }`}
          >
            <s.icon className="w-4 h-4" />
            {s.label}
          </button>
        ))}
      </div>

      {section === "winrate" && (
        <div className="overflow-x-auto rounded-lg border border-gray-800 -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-900/50">
              <tr className="text-left text-gray-400">
                <th className="px-3 sm:px-4 py-3 font-medium">ID</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Имя</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Игры</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Победы</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Винрейт</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Рейтинг</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {winRateData.isLoading ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Загрузка...</td></tr>
              ) : !winRateData.data?.length ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-500">Подозрительных игроков не найдено</td></tr>
              ) : (
                winRateData.data.map((p: any) => (
                  <tr key={p.id} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400">#{p.gameId}</td>
                    <td className="px-4 py-3 text-amber-100">{p.displayName || "—"} <span className="text-gray-500 text-xs">(ID {p.gameId})</span></td>
                    <td className="px-4 py-3">{formatNumber(p.gamesPlayed)}</td>
                    <td className="px-4 py-3 text-green-400">{formatNumber(p.wins)}</td>
                    <td className="px-4 py-3">
                      <span className="text-red-400 font-bold">{p.winRate}%</span>
                    </td>
                    <td className="px-4 py-3">{formatNumber(p.rating)}</td>
                    <td className="px-4 py-3">
                      {p.isBanned ? (
                        <span className="text-xs text-red-400">Забанен</span>
                      ) : (
                        <span className="text-xs text-yellow-400">Подозрительный</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {section === "transactions" && (
        <div className="overflow-x-auto rounded-lg border border-gray-800 -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-900/50">
              <tr className="text-left text-gray-400">
                <th className="px-3 sm:px-4 py-3 font-medium">Дата</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Игрок</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Тип</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Сумма</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Валюта</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Описание</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {txData.isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Загрузка...</td></tr>
              ) : !txData.data?.length ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Крупных транзакций не найдено</td></tr>
              ) : (
                txData.data.map((t: any) => (
                  <tr key={t.id} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(t.createdAt)}</td>
                    <td className="px-4 py-3 text-amber-100">{t.displayName || 'Игрок'} <span className="text-gray-500 text-xs">(ID {t.gameId})</span></td>
                    <td className="px-4 py-3 text-gray-400">{t.type}</td>
                    <td className="px-4 py-3">
                      <span className={t.amount >= 0 ? "text-green-400 font-bold" : "text-red-400 font-bold"}>
                        {t.amount >= 0 ? "+" : ""}{formatNumber(t.amount)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{t.currency === "shanyrak" ? "🏠" : "₸"}</td>
                    <td className="px-4 py-3 text-gray-400 max-w-xs truncate">{t.description || "—"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {section === "growth" && (
        <div className="overflow-x-auto rounded-lg border border-gray-800 -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[600px]">
            <thead className="bg-gray-900/50">
              <tr className="text-left text-gray-400">
                <th className="px-3 sm:px-4 py-3 font-medium">ID</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Имя</th>
                <th className="px-3 sm:px-4 py-3 font-medium">За 24ч</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Транзакций</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Баланс</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Статус</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {growthData.isLoading ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Загрузка...</td></tr>
              ) : !growthData.data?.length ? (
                <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-500">Аномалий не обнаружено</td></tr>
              ) : (
                growthData.data.map((p: any) => (
                  <tr key={p.profileId} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400">#{p.gameId}</td>
                    <td className="px-4 py-3 text-amber-100">{p.displayName || "—"} <span className="text-gray-500 text-xs">(ID {p.gameId})</span></td>
                    <td className="px-4 py-3">
                      <span className="text-red-400 font-bold">+{formatNumber(p.totalGained)} 🏠</span>
                    </td>
                    <td className="px-4 py-3">{formatNumber(p.txCount)}</td>
                    <td className="px-4 py-3">{formatNumber(p.balanceShanyrak)} 🏠</td>
                    <td className="px-4 py-3">
                      {p.isBanned ? (
                        <span className="text-xs text-red-400">Забанен</span>
                      ) : (
                        <span className="text-xs text-yellow-400">Подозрительный</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

/* ================================================================
   SHOP MANAGEMENT TAB
   ================================================================ */
function ShopManagementTab() {
  const utils = trpc.useUtils();
  const { data: overrides = [] } = trpc.admin.shopItems.useQuery();
  const { data: allPlaylists = [] } = trpc.playlists.list.useQuery();
  const updatePrice = trpc.admin.updateShopPrice.useMutation({
    onSuccess: () => {
      utils.admin.shopItems.invalidate();
      toast.success("Цена обновлена");
    },
    onError: () => toast.error("Ошибка обновления"),
  });

  // Build catalog dynamically from cardAssets + avatars + playlists
  const DEFAULT_ITEMS: { itemType: string; itemId: string; name: string; defaultPrice: number; category: string; currency: 'tenge' | 'shanyrak' }[] = [
    // Decks
    { itemType: "deck", itemId: "custom", name: "Казахская колода", defaultPrice: 60, category: "Колоды", currency: 'tenge' },
    // Tables (skip classic - it's free)
    ...Object.entries(TABLE_STYLES)
      .filter(([key]) => key !== 'classic')
      .map(([key, val]) => ({ itemType: "table", itemId: key, name: val.name, defaultPrice: val.price, category: "Столы", currency: 'tenge' as const })),
    // Frames
    ...AVATAR_FRAMES.map(f => ({ itemType: "frame", itemId: f.id, name: f.name, defaultPrice: f.price, category: "Рамки", currency: 'tenge' as const })),
    // Premium avatars
    ...AVATAR_OPTIONS.filter(a => a.premium && a.price).map(a => ({ itemType: "avatar", itemId: a.id, name: a.name, defaultPrice: a.price!, category: "Аватары", currency: 'tenge' as const })),
    // Playlists (from DB)
    ...allPlaylists
      .filter((p: any) => !p.isDefault)
      .map((p: any) => ({ itemType: "playlist", itemId: String(p.id), name: p.name, defaultPrice: p.priceShanyrak, category: "Плейлисты", currency: 'shanyrak' as const })),
    // Emotion packs (skip free packs - price 0)
    ...EMOTION_PACKS
      .filter(ep => ep.price > 0)
      .map(ep => ({ itemType: "emotionpack", itemId: ep.id, name: ep.name, defaultPrice: ep.price, category: "Эмоции", currency: 'tenge' as const })),
  ];

  // Merge defaults with overrides
  const items = DEFAULT_ITEMS.map(item => {
    const override = overrides.find((o: any) => o.itemType === item.itemType && o.itemId === item.itemId);
    return {
      ...item,
      currentPrice: override?.priceTenge ?? item.defaultPrice,
      isAvailable: override?.isAvailable ?? true,
      hasOverride: !!override,
      discountPercent: override?.discountPercent ?? null as number | null,
      discountExpiresAt: override?.discountExpiresAt ? new Date(override.discountExpiresAt) : null as Date | null,
    };
  });

  const [editItem, setEditItem] = useState<typeof items[0] | null>(null);
  const [editPrice, setEditPrice] = useState("");
  const [editAvailable, setEditAvailable] = useState(true);
  const [editDiscountPercent, setEditDiscountPercent] = useState("");
  const [editDiscountExpiresAt, setEditDiscountExpiresAt] = useState("");

  const openEdit = (item: typeof items[0]) => {
    setEditItem(item);
    setEditPrice(String(item.currentPrice));
    setEditAvailable(item.isAvailable);
    setEditDiscountPercent(item.discountPercent != null ? String(item.discountPercent) : "");
    setEditDiscountExpiresAt(item.discountExpiresAt ? item.discountExpiresAt.toISOString().slice(0, 16) : "");
  };

  const saveEdit = () => {
    if (!editItem) return;
    const price = parseInt(editPrice);
    if (isNaN(price) || price < 0) { toast.error("Некорректная цена"); return; }
    const discountPct = editDiscountPercent !== "" ? parseInt(editDiscountPercent) : null;
    if (discountPct !== null && (isNaN(discountPct) || discountPct < 0 || discountPct > 100)) {
      toast.error("Скидка должна быть от 0 до 100%"); return;
    }
    const discountExpiry = editDiscountExpiresAt ? new Date(editDiscountExpiresAt) : null;
    updatePrice.mutate({
      itemType: editItem.itemType as 'deck' | 'table' | 'frame' | 'avatar' | 'playlist' | 'emotionpack',
      itemId: editItem.itemId,
      priceTenge: price,
      isAvailable: editAvailable,
      discountPercent: discountPct,
      discountExpiresAt: discountExpiry,
    });
    setEditItem(null);
  };

  const resetToDefault = (item: typeof items[0]) => {
    updatePrice.mutate({
      itemType: item.itemType as 'deck' | 'table' | 'frame' | 'avatar' | 'playlist' | 'emotionpack',
      itemId: item.itemId,
      priceTenge: item.defaultPrice,
      isAvailable: true,
      discountPercent: null,
      discountExpiresAt: null,
    });
  };

  const EXCHANGE_TIERS = [
    { tier: "10k", shanyrak: 10000, tenge: 50 },
    { tier: "50k", shanyrak: 50000, tenge: 220 },
    { tier: "100k", shanyrak: 100000, tenge: 400 },
    { tier: "500k", shanyrak: 500000, tenge: 1500 },
  ];

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-amber-100">Управление магазином</h3>
      <p className="text-sm text-gray-400">
        Изменяйте цены и доступность товаров в реальном времени. Изменения применяются мгновенно.
      </p>

      {/* Shop items */}
      <div>
        <h4 className="text-md font-medium text-gray-200 mb-3">Товары магазина</h4>
        <div className="overflow-x-auto rounded-lg border border-gray-800 -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[650px]">
            <thead className="bg-gray-900/50">
              <tr className="text-left text-gray-400">
                <th className="px-3 sm:px-4 py-3 font-medium">Категория</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Название</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Базовая</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Текущая</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Статус</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Действия</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {items.map(item => (
                <tr key={`${item.itemType}-${item.itemId}`} className="hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${
                      item.category === "Колоды" ? "bg-blue-900/50 text-blue-300" :
                      item.category === "Столы" ? "bg-green-900/50 text-green-300" :
                      item.category === "Аватары" ? "bg-amber-900/50 text-amber-300" :
                      item.category === "Эмоции" ? "bg-pink-900/50 text-pink-300" :
                      "bg-purple-900/50 text-purple-300"
                    }`}>
                      {item.category}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-amber-100">{item.name}</td>
                  <td className="px-4 py-3 text-gray-400">
                    {formatNumber(item.defaultPrice)} {item.currency === 'shanyrak' ? '🏠' : '₸'}
                  </td>
                  <td className="px-4 py-3">
                    <div>
                      <span className={item.currentPrice !== item.defaultPrice ? "text-amber-300 font-bold" : "text-gray-200"}>
                        {formatNumber(item.currentPrice)} {item.currency === 'shanyrak' ? '🏠' : '₸'}
                      </span>
                      {item.currentPrice !== item.defaultPrice && (
                        <span className="text-xs text-amber-500 ml-1">(изменено)</span>
                      )}
                      {item.discountPercent != null && item.discountPercent > 0 && (
                        <div className="text-xs text-pink-400 mt-0.5">
                          −{item.discountPercent}% скидка
                          {item.discountExpiresAt && (
                            <span className="text-gray-500 ml-1">до {item.discountExpiresAt.toLocaleDateString('ru-RU')}</span>
                          )}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {item.isAvailable ? (
                      <span className="text-xs text-green-400 flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" /> Доступен
                      </span>
                    ) : (
                      <span className="text-xs text-red-400 flex items-center gap-1">
                        <Ban className="w-3 h-3" /> Скрыт
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs border-amber-700/40 text-amber-200 bg-transparent hover:bg-amber-900/20" onClick={() => openEdit(item)}>
                        Изменить
                      </Button>
                      {item.hasOverride && (
                        <Button size="sm" variant="outline" className="h-7 text-xs border-gray-700 text-gray-400 bg-transparent hover:bg-gray-900/30" onClick={() => resetToDefault(item)}>
                          Сброс
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Edit dialog */}
      <Dialog open={!!editItem} onOpenChange={o => { if (!o) setEditItem(null); }}>
        <DialogContent className="bg-[#1a2d45] border-amber-700/40 text-amber-100">
          <DialogHeader>
            <DialogTitle>Изменить цену: {editItem?.name}</DialogTitle>
            <DialogDescription className="text-gray-400">
              Цена по умолчанию: {editItem?.defaultPrice} ₸
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <label className="text-sm text-gray-300 mb-1 block">
                Новая цена ({editItem?.currency === 'shanyrak' ? 'шаныраки 🏠' : 'тенге ₸'})
              </label>
              <Input
                type="number"
                min={0}
                value={editPrice}
                onChange={e => setEditPrice(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-amber-100"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Скидка (%)</label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  placeholder="0"
                  value={editDiscountPercent}
                  onChange={e => setEditDiscountPercent(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-amber-100"
                />
              </div>
              <div>
                <label className="text-sm text-gray-300 mb-1 block">Скидка до</label>
                <Input
                  type="datetime-local"
                  value={editDiscountExpiresAt}
                  onChange={e => setEditDiscountExpiresAt(e.target.value)}
                  className="bg-gray-900/50 border-gray-700 text-amber-100"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <label className="text-sm text-gray-300">Доступен для покупки:</label>
              <button
                className={`w-12 h-6 rounded-full transition-colors relative ${
                  editAvailable ? "bg-green-600" : "bg-gray-600"
                }`}
                onClick={() => setEditAvailable(!editAvailable)}
              >
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white transition-transform ${
                  editAvailable ? "left-6" : "left-0.5"
                }`} />
              </button>
              <span className="text-sm">{editAvailable ? "Да" : "Нет"}</span>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" className="border-gray-700 text-gray-300 bg-transparent" onClick={() => setEditItem(null)}>Отмена</Button>
            <Button className="bg-amber-600 hover:bg-amber-500 text-white" onClick={saveEdit} disabled={updatePrice.isPending}>
              {updatePrice.isPending ? "..." : "Сохранить"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Exchange rates */}
      <div>
        <h4 className="text-md font-medium text-gray-200 mb-3">Курсы обмена (Тенге → Шаныраки)</h4>
        <div className="overflow-x-auto rounded-lg border border-gray-800 -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[400px]">
            <thead className="bg-gray-900/50">
              <tr className="text-left text-gray-400">
                <th className="px-3 sm:px-4 py-3 font-medium">Пакет</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Шаныраки</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Цена</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Курс</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {EXCHANGE_TIERS.map(t => (
                <tr key={t.tier} className="hover:bg-gray-900/30 transition-colors">
                  <td className="px-4 py-3 text-amber-100 font-medium">{t.tier}</td>
                  <td className="px-4 py-3">{formatNumber(t.shanyrak)} 🏠</td>
                  <td className="px-4 py-3">{formatNumber(t.tenge)} ₸</td>
                  <td className="px-4 py-3 text-gray-400">{Math.round(t.shanyrak / t.tenge)} 🏠/₸</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Economy settings */}
      <div>
        <h4 className="text-md font-medium text-gray-200 mb-3">Экономические параметры</h4>
        <div className="border border-gray-800 rounded-lg overflow-hidden -mx-4 sm:mx-0">
          <table className="w-full text-sm">
            <tbody className="divide-y divide-gray-800">
              <DetailRow label="Нач. баланс (тенге)" value="25" />
              <DetailRow label="Нач. баланс (шаныраки)" value="5 000" />
              <DetailRow label="Беспл. топап" value="2 000 шаныраков" />
              <DetailRow label="Кулдаун топапа" value="12 часов" />
              <DetailRow label="Награда за обучение" value="2 000 шаныраков" />
              <DetailRow label="Нач. рейтинг" value="1 000" />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ================================================================
   MASS NOTIFICATIONS TAB
   ================================================================ */
function MassNotificationsTab() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [segment, setSegment] = useState<"all" | "inactive_7d" | "top_100" | "newbies">("all");
  const [showConfirm, setShowConfirm] = useState(false);
  const [page, setPage] = useState(0);
  const limit = 20;

  const utils = trpc.useUtils();

  const sendMutation = trpc.admin.sendMassNotification.useMutation({
    onSuccess: (data) => {
      toast.success(`Рассылка отправлена: ${data.sentCount} уведомлений`);
      setTitle("");
      setContent("");
      setShowConfirm(false);
      utils.admin.massNotificationHistory.invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const { data: history, isLoading } = trpc.admin.massNotificationHistory.useQuery({
    limit,
    offset: page * limit,
  });

  const totalPages = Math.ceil((history?.total ?? 0) / limit);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-amber-100">Массовые рассылки</h3>

      {/* Send form */}
      <div className="border border-gray-800 rounded-lg p-4 sm:p-6 bg-gray-900/30 space-y-4">
        <h4 className="text-md font-medium text-gray-200">Новая рассылка</h4>

        <div>
          <label className="text-xs text-gray-400 mb-1 block">Сегмент</label>
          <div className="flex flex-wrap gap-2">
            {(Object.entries(SEGMENT_LABELS) as [string, string][]).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setSegment(key as any)}
                className={`px-3 py-1.5 text-xs rounded border transition-colors ${
                  segment === key
                    ? "border-amber-500 bg-amber-900/30 text-amber-100"
                    : "border-gray-700 text-gray-400 hover:text-gray-200"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <Input
          placeholder="Заголовок уведомления"
          value={title}
          onChange={e => setTitle(e.target.value)}
          maxLength={200}
          className="bg-gray-800 border-gray-700 text-gray-100"
        />

        <textarea
          placeholder="Текст уведомления..."
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={2000}
          rows={4}
          className="w-full bg-gray-800 border border-gray-700 text-gray-100 rounded-md px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-amber-500"
        />

        <div className="flex items-center justify-between gap-2">
          <span className="text-xs text-gray-500">{content.length}/2000</span>
          <Button
            disabled={!title.trim() || !content.trim() || sendMutation.isPending}
            onClick={() => setShowConfirm(true)}
            className="bg-amber-600 hover:bg-amber-700"
          >
            <Send className="w-4 h-4 sm:mr-2" />
            <span className="hidden sm:inline">Отправить</span>
          </Button>
        </div>
      </div>

      {/* Confirm dialog */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent className="bg-gray-900 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle>Подтверждение рассылки</DialogTitle>
            <DialogDescription className="text-gray-400">
              Вы отправляете уведомление сегменту <strong className="text-amber-100">{SEGMENT_LABELS[segment]}</strong>.
              Это действие нельзя отменить.
            </DialogDescription>
          </DialogHeader>
          <div className="border border-gray-800 rounded p-3 bg-gray-800/50 space-y-1">
            <div className="text-sm font-medium text-amber-100">{title}</div>
            <div className="text-sm text-gray-300">{content}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)} className="border-gray-700 text-gray-300">
              Отмена
            </Button>
            <Button
              disabled={sendMutation.isPending}
              onClick={() => sendMutation.mutate({ title, content, segment })}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {sendMutation.isPending ? "Отправка..." : "Подтвердить отправку"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* History */}
      <div>
        <h4 className="text-md font-medium text-gray-200 mb-3">История рассылок</h4>
        <div className="overflow-x-auto rounded-lg border border-gray-800 -mx-4 sm:mx-0">
          <table className="w-full text-sm min-w-[550px]">
            <thead className="bg-gray-900/50">
              <tr className="text-left text-gray-400">
                <th className="px-3 sm:px-4 py-3 font-medium">Дата</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Админ</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Заголовок</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Сегмент</th>
                <th className="px-3 sm:px-4 py-3 font-medium">Отпр.</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-800">
              {isLoading ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Загрузка...</td></tr>
              ) : !history?.campaigns?.length ? (
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-500">Рассылок пока нет</td></tr>
              ) : (
                history.campaigns.map((c: any) => (
                  <tr key={c.id} className="hover:bg-gray-900/30 transition-colors">
                    <td className="px-4 py-3 text-gray-400 whitespace-nowrap">{formatDate(c.createdAt)}</td>
                    <td className="px-4 py-3 text-amber-100">{c.adminName || `Admin #${c.adminId}`}</td>
                    <td className="px-4 py-3 text-gray-100 max-w-xs truncate">{c.title}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs font-medium px-2 py-0.5 rounded bg-blue-900/50 text-blue-300">
                        {SEGMENT_LABELS[c.segment] || c.segment}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{formatNumber(c.sentCount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between gap-2 mt-4">
            <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-gray-700 text-gray-300">
              <ChevronLeft className="w-4 h-4" /><span className="hidden sm:inline ml-1">Назад</span>
            </Button>
            <span className="text-xs sm:text-sm text-gray-500">{page + 1}/{totalPages}</span>
            <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="border-gray-700 text-gray-300">
              <span className="hidden sm:inline mr-1">Далее</span><ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ================================================================
   MODERATION TAB — Player Complaints
   ================================================================ */
const REASON_LABELS: Record<string, string> = {
  cheating: "Читерство",
  toxic_behavior: "Токсичное поведение",
  inappropriate_name: "Неприемлемое имя",
  afk_abuse: "AFK злоупотребление",
  other: "Другое",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Ожидает",
  reviewed: "Рассмотрена",
  resolved: "Решена",
  dismissed: "Отклонена",
};

const STATUS_COLORS: Record<string, string> = {
  pending: "bg-yellow-900/40 text-yellow-300 border-yellow-700/30",
  reviewed: "bg-blue-900/40 text-blue-300 border-blue-700/30",
  resolved: "bg-green-900/40 text-green-300 border-green-700/30",
  dismissed: "bg-gray-800/40 text-gray-400 border-gray-700/30",
};

const ACTION_TAKEN_LABELS: Record<string, string> = {
  none: "Нет",
  warning: "Предупреждение",
  temp_ban: "Временный бан",
  permanent_ban: "Перманентный бан",
};

function ModerationTab() {
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(0);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [resolveStatus, setResolveStatus] = useState<"reviewed" | "resolved" | "dismissed">("resolved");
  const [adminNote, setAdminNote] = useState("");
  const [actionTaken, setActionTaken] = useState<"none" | "warning" | "temp_ban" | "permanent_ban">("none");

  const stats = trpc.moderation.stats.useQuery();
  const complaints = trpc.moderation.list.useQuery({
    status: statusFilter === "all" ? undefined : statusFilter,
    page: page + 1,
    limit: 15,
  });
  const detail = trpc.moderation.detail.useQuery(
    { id: selectedId! },
    { enabled: selectedId !== null }
  );
  const resolveMut = trpc.moderation.resolve.useMutation();
  const forceRenameMut = trpc.admin.forceRenamePlayer.useMutation();
  const utils = trpc.useUtils();

  const handleForceRename = async (profileId: number) => {
    if (!window.confirm(`Сбросить имя игрока (профиль #${profileId}) на автоматически сгенерированное?`)) return;
    try {
      const result = await forceRenameMut.mutateAsync({ profileId });
      toast.success(`Имя сброшено: ${result.newName}`);
      utils.moderation.detail.invalidate({ id: selectedId! });
    } catch {
      toast.error("Ошибка при сбросе имени");
    }
  };

  const handleResolve = async () => {
    if (!selectedId) return;
    try {
      await resolveMut.mutateAsync({
        id: selectedId,
        status: resolveStatus,
        adminNote: adminNote || undefined,
        actionTaken,
      });
      toast.success("Жалоба обновлена");
      setSelectedId(null);
      setAdminNote("");
      setActionTaken("none");
      utils.moderation.list.invalidate();
      utils.moderation.stats.invalidate();
    } catch {
      toast.error("Ошибка при обновлении жалобы");
    }
  };

  const totalPages = complaints.data ? Math.ceil(complaints.data.total / 15) : 0;

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: "Всего", value: stats.data?.total ?? 0, color: "text-amber-100" },
          { label: "Ожидают", value: stats.data?.pending ?? 0, color: "text-yellow-300" },
          { label: "Рассмотрено", value: stats.data?.reviewed ?? 0, color: "text-blue-300" },
          { label: "Решено", value: stats.data?.resolved ?? 0, color: "text-green-300" },
          { label: "Отклонено", value: stats.data?.dismissed ?? 0, color: "text-gray-400" },
        ].map(s => (
          <div key={s.label} className="bg-gray-900/80 border border-gray-800 rounded-lg p-3 text-center">
            <div className="text-xs text-gray-500 mb-1">{s.label}</div>
            <div className={`text-xl font-bold ${s.color}`}>{s.value}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-gray-500" />
        {["all", "pending", "reviewed", "resolved", "dismissed"].map(s => (
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => { setStatusFilter(s); setPage(0); }}
            className={statusFilter === s ? "bg-amber-600 hover:bg-amber-700 text-white" : "border-gray-700 text-gray-400"}
          >
            {s === "all" ? "Все" : STATUS_LABELS[s]}
          </Button>
        ))}
      </div>

      {/* Complaints table */}
      <div className="bg-gray-900/60 border border-gray-800 rounded-lg overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-800 text-gray-500 text-xs">
              <th className="px-3 py-2 text-left">ID</th>
              <th className="px-3 py-2 text-left">Жалобщик</th>
              <th className="px-3 py-2 text-left">Нарушитель</th>
              <th className="px-3 py-2 text-left">Причина</th>
              <th className="px-3 py-2 text-left">Статус</th>
              <th className="px-3 py-2 text-left">Дата</th>
              <th className="px-3 py-2 text-left">Действие</th>
            </tr>
          </thead>
          <tbody>
            {complaints.isLoading ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">Загрузка...</td></tr>
            ) : complaints.data?.complaints.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-8 text-center text-gray-500">Нет жалоб</td></tr>
            ) : (
              complaints.data?.complaints.map((c: any) => (
                <tr key={c.id} className={`border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors ${c.reason === 'inappropriate_name' && c.status === 'pending' ? 'bg-orange-950/20' : ''}`}>
                  <td className="px-3 py-2 text-gray-400">#{c.id}</td>
                  <td className="px-3 py-2 text-amber-100">
                    <div className="font-medium">{c.reporterName || '—'}</div>
                    <div className="text-xs text-gray-400">ID {c.reporterGameId ?? c.reporterProfileId}</div>
                  </td>
                  <td className="px-3 py-2 text-amber-100">
                    <div className="font-medium">{c.targetName || '—'}</div>
                    <div className="text-xs text-gray-400">ID {c.targetGameId ?? c.targetProfileId}</div>
                  </td>
                  <td className="px-3 py-2">
                    <span className={c.reason === 'inappropriate_name' ? 'text-orange-300 font-semibold' : 'text-amber-200'}>
                      {c.reason === 'inappropriate_name' && <span className="mr-1">🏷️</span>}
                      {REASON_LABELS[c.reason] || c.reason}
                    </span>
                  </td>
                  <td className="px-3 py-2">
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[c.status] || ''}`}>
                      {STATUS_LABELS[c.status] || c.status}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-gray-400 text-xs">{formatDate(c.createdAt)}</td>
                  <td className="px-3 py-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="border-gray-700 text-gray-300 h-7 text-xs"
                      onClick={() => {
                        setSelectedId(c.id);
                        setResolveStatus(c.status === 'pending' ? 'resolved' : c.status);
                        setAdminNote(c.adminNote || '');
                        setActionTaken(c.actionTaken || 'none');
                      }}
                    >
                      <Eye className="w-3 h-3 mr-1" /> Детали
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3">
          <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)} className="border-gray-700 text-gray-300">
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-400">{page + 1} / {totalPages}</span>
          <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)} className="border-gray-700 text-gray-300">
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={selectedId !== null} onOpenChange={open => { if (!open) setSelectedId(null); }}>
        <DialogContent className="bg-gray-900 border-gray-700 text-gray-100 max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-amber-100 flex items-center gap-2">
              <Flag className="w-5 h-5 text-red-400" />
              Жалоба #{selectedId}
            </DialogTitle>
            <DialogDescription className="text-gray-400">
              Просмотр и обработка жалобы
            </DialogDescription>
          </DialogHeader>

          {detail.isLoading ? (
            <div className="py-8 text-center text-gray-500">Загрузка...</div>
          ) : detail.data ? (
            <div className="space-y-4">
              {/* Reporter & Target info */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Жалобщик</div>
                  <div className="text-amber-100 font-medium text-sm">
                    {detail.data.reporterProfile?.displayName || `ID ${detail.data.complaint.reporterProfileId}`}
                  </div>
                  {detail.data.reporterProfile && (
                    <div className="text-xs text-gray-400">
                      Рейтинг: {detail.data.reporterProfile.rating} | Игр: {detail.data.reporterProfile.gamesPlayed}
                    </div>
                  )}
                </div>
                <div className="bg-gray-800/50 rounded-lg p-3 border border-gray-700/50">
                  <div className="text-xs text-gray-500 mb-1">Нарушитель</div>
                  <div className="text-amber-100 font-medium text-sm">
                    {detail.data.targetProfile?.displayName || `ID ${detail.data.complaint.targetProfileId}`}
                  </div>
                  {detail.data.targetProfile && (
                    <div className="text-xs text-gray-400">
                      Рейтинг: {detail.data.targetProfile.rating} | Игр: {detail.data.targetProfile.gamesPlayed}
                      {detail.data.targetProfile.isBanned && <span className="text-red-400 ml-1">(Забанен)</span>}
                    </div>
                  )}
                </div>
              </div>

              {/* Complaint details */}
              <div className="bg-gray-800/30 rounded-lg p-3 border border-gray-700/30 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Причина</span>
                  <span className="text-amber-200 text-sm font-medium">{REASON_LABELS[detail.data.complaint.reason]}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Статус</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs border ${STATUS_COLORS[detail.data.complaint.status]}`}>
                    {STATUS_LABELS[detail.data.complaint.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500">Дата</span>
                  <span className="text-gray-300 text-xs">{formatDate(detail.data.complaint.createdAt)}</span>
                </div>
                {detail.data.complaint.description && (
                  <div>
                    <span className="text-xs text-gray-500 block mb-1">Описание</span>
                    <p className="text-gray-300 text-sm bg-gray-900/50 rounded p-2">{detail.data.complaint.description}</p>
                  </div>
                )}
                {detail.data.complaint.actionTaken && detail.data.complaint.actionTaken !== 'none' && (
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Принятые меры</span>
                    <span className="text-orange-300 text-xs">{ACTION_TAKEN_LABELS[detail.data.complaint.actionTaken]}</span>
                  </div>
                )}
              </div>

              {/* Quick action: force rename for inappropriate name complaints */}
              {detail.data.complaint.reason === 'inappropriate_name' && (
                <div className="bg-orange-950/30 border border-orange-700/40 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-orange-300 text-xs font-semibold">🏷️ Быстрое действие: неподобающее имя</span>
                  </div>
                  <p className="text-gray-400 text-xs mb-3">
                    Текущее имя нарушителя: <span className="text-orange-200 font-medium">{detail.data.targetProfile?.displayName || `ID ${detail.data.complaint.targetProfileId}`}</span>
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-orange-700/50 text-orange-300 hover:bg-orange-900/30 text-xs"
                    onClick={() => handleForceRename(detail.data!.complaint.targetProfileId)}
                    disabled={forceRenameMut.isPending}
                  >
                    {forceRenameMut.isPending ? 'Сброс...' : '🔄 Сбросить имя игрока'}
                  </Button>
                </div>
              )}

              {/* Resolution form */}
              <div className="space-y-3 border-t border-gray-700/50 pt-3">
                <h4 className="text-sm font-semibold text-amber-100">Решение</h4>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Статус</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    value={resolveStatus}
                    onChange={e => setResolveStatus(e.target.value as any)}
                  >
                    <option value="reviewed">Рассмотрена</option>
                    <option value="resolved">Решена</option>
                    <option value="dismissed">Отклонена</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Принятые меры</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-500/50"
                    value={actionTaken}
                    onChange={e => setActionTaken(e.target.value as any)}
                  >
                    <option value="none">Нет</option>
                    <option value="warning">Предупреждение</option>
                    <option value="temp_ban">Временный бан</option>
                    <option value="permanent_ban">Перманентный бан</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-gray-500 block mb-1">Заметка администратора</label>
                  <textarea
                    className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-100 focus:outline-none focus:ring-1 focus:ring-amber-500/50 resize-none"
                    rows={2}
                    maxLength={500}
                    placeholder="Комментарий к решению..."
                    value={adminNote}
                    onChange={e => setAdminNote(e.target.value)}
                  />
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-gray-500">Жалоба не найдена</div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedId(null)} className="border-gray-700 text-gray-300">
              Закрыть
            </Button>
            {detail.data && (
              <Button
                onClick={handleResolve}
                disabled={resolveMut.isPending}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {resolveMut.isPending ? "Сохранение..." : "Сохранить решение"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================================================================
   CONTACT MESSAGES TAB
   ================================================================ */
function ContactMessagesTab() {
  const [statusFilter, setStatusFilter] = useState<'all' | 'new' | 'read' | 'replied'>('all');
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adminNote, setAdminNote] = useState('');
  const [newStatus, setNewStatus] = useState<'new' | 'read' | 'replied'>('read');

  const { data, refetch, isLoading } = trpc.contact.adminList.useQuery(
    { status: statusFilter, limit: 50, offset: 0 },
    { refetchInterval: 30000 }
  );

  const updateMut = trpc.contact.adminUpdateStatus.useMutation({
    onSuccess: () => {
      toast.success('Статус обновлён');
      refetch();
      setSelectedId(null);
      setAdminNote('');
    },
    onError: (err) => toast.error(err.message),
  });

  const messages = data?.messages ?? [];
  const total = data?.total ?? 0;
  const selectedMsg = messages.find((m: any) => m.id === selectedId);

  const statusColors: Record<string, string> = {
    new: 'bg-red-900/40 text-red-300 border-red-700/40',
    read: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
    replied: 'bg-green-900/40 text-green-300 border-green-700/40',
  };
  const statusLabels: Record<string, string> = {
    new: 'Новое',
    read: 'Прочитано',
    replied: 'Отвечено',
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-lg font-bold text-amber-100 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-amber-400" />
            Сообщения от игроков
          </h2>
          <p className="text-sm text-gray-400 mt-0.5">Всего: {total}</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all', 'new', 'read', 'replied'] as const).map(s => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                statusFilter === s
                  ? 'bg-amber-600/80 text-white border-amber-500/60'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200'
              }`}
            >
              {s === 'all' ? 'Все' : statusLabels[s]}
            </button>
          ))}
          <button onClick={() => refetch()} className="px-3 py-1.5 rounded-lg text-xs font-medium border bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200">
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-gray-500">Загрузка...</div>
      ) : messages.length === 0 ? (
        <div className="py-12 text-center text-gray-500">Нет сообщений</div>
      ) : (
        <div className="space-y-2">
          {messages.map((msg: any) => (
            <div
              key={msg.id}
              onClick={() => { setSelectedId(msg.id); setAdminNote(msg.adminNote || ''); setNewStatus(msg.status); }}
              className="bg-gray-900/60 border border-gray-800 rounded-xl p-4 cursor-pointer hover:border-amber-700/40 transition-colors"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1 flex-wrap">
                    <span className="font-medium text-gray-200 text-sm">{msg.senderName}</span>
                    <span className="text-xs text-gray-500">{msg.replyEmail}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${statusColors[msg.status]}`}>
                      {statusLabels[msg.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400 line-clamp-2">{msg.message}</p>
                </div>
                <span className="text-xs text-gray-600 shrink-0">{formatDate(msg.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Detail dialog */}
      <Dialog open={selectedId !== null} onOpenChange={open => { if (!open) setSelectedId(null); }}>
        <DialogContent className="bg-gray-950 border border-gray-800 text-gray-100 max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-amber-100">Сообщение от игрока</DialogTitle>
          </DialogHeader>
          {selectedMsg && (
            <div className="space-y-4 mt-2">
              <div className="bg-gray-900/60 rounded-lg p-3 space-y-2">
                <div className="flex gap-2 text-sm">
                  <span className="text-gray-500 w-24 shrink-0">Игрок:</span>
                  <span className="text-gray-200">{selectedMsg.senderName}</span>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="text-gray-500 w-24 shrink-0">Email:</span>
                  <a href={`mailto:${selectedMsg.replyEmail}`} className="text-amber-400 hover:underline">{selectedMsg.replyEmail}</a>
                </div>
                <div className="flex gap-2 text-sm">
                  <span className="text-gray-500 w-24 shrink-0">Дата:</span>
                  <span className="text-gray-300">{formatDate(selectedMsg.createdAt)}</span>
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Сообщение:</p>
                <div className="bg-gray-900/60 rounded-lg p-3 text-sm text-gray-200 whitespace-pre-wrap">{selectedMsg.message}</div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Статус:</p>
                <div className="flex gap-2">
                  {(['new', 'read', 'replied'] as const).map(s => (
                    <button
                      key={s}
                      onClick={() => setNewStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                        newStatus === s
                          ? 'bg-amber-600/80 text-white border-amber-500/60'
                          : 'bg-gray-800 text-gray-400 border-gray-700 hover:text-gray-200'
                      }`}
                    >
                      {statusLabels[s]}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-gray-500 mb-1.5">Заметка администратора (не видна игроку):</p>
                <textarea
                  rows={3}
                  value={adminNote}
                  onChange={e => setAdminNote(e.target.value)}
                  placeholder="Заметка о решении..."
                  className="w-full bg-gray-900/60 border border-gray-700 rounded-lg p-3 text-sm text-gray-200 placeholder-gray-600 resize-none focus:outline-none focus:border-amber-600/50"
                />
              </div>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setSelectedId(null)} className="border-gray-700 text-gray-300">
              Закрыть
            </Button>
            <Button
              onClick={() => updateMut.mutate({ id: selectedId!, status: newStatus, adminNote: adminNote || undefined })}
              disabled={updateMut.isPending}
              className="bg-amber-600 hover:bg-amber-700 text-white"
            >
              {updateMut.isPending ? 'Сохранение...' : 'Сохранить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ================================================================
   TOOLS TAB — Admin instruments for maintenance tasks
   ================================================================ */
function ToolsTab() {
  const utils = trpc.useUtils();

  // ─── Maintenance mode ───
  const { data: maintenanceStatus } = trpc.maintenance.status.useQuery();
  const setMaintenance = trpc.maintenance.set.useMutation({
    onSuccess: () => {
      utils.maintenance.status.invalidate();
      toast.success('Режим тех.работ обновлён');
    },
    onError: (e) => toast.error(`Ошибка: ${e.message}`),
  });
  const [maintenanceEndTime, setMaintenanceEndTime] = useState('');
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  const enableMaintenance = () => {
    setMaintenance.mutate({
      enabled: true,
      endTime: maintenanceEndTime ? new Date(maintenanceEndTime).toISOString() : null,
      message: maintenanceMessage.trim() || null,
    });
  };

  const disableMaintenance = () => {
    setMaintenance.mutate({ enabled: false, endTime: null, message: null });
  };

  // Retroactive achievement recalculation
  const [recalcResult, setRecalcResult] = useState<{
    totalPlayers: number;
    processedPlayers: number;
    totalRecalculated: number;
    totalNewlyUnlocked: number;
    errors: number;
  } | null>(null);
  const [showRecalcConfirm, setShowRecalcConfirm] = useState(false);

  const retroactiveRecalcMutation = trpc.admin.retroactiveRecalcAll.useMutation({
    onSuccess: (result) => {
      setRecalcResult(result);
      setShowRecalcConfirm(false);
      toast.success(
        `Пересчёт завершён: ${result.processedPlayers}/${result.totalPlayers} игроков, ` +
        `${result.totalRecalculated} пересчитано, ${result.totalNewlyUnlocked} разблокировано` +
        (result.errors > 0 ? `, ${result.errors} ошибок` : '')
      );
      // Invalidate admin queries in case they show achievement counts
      utils.admin.players.invalidate();
    },
    onError: (e) => toast.error(`Ошибка: ${e.message}`),
  });

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-2">
        <Wrench className="w-6 h-6 text-amber-400" />
        <h2 className="text-xl font-bold text-amber-100">Инструменты администратора</h2>
      </div>
      <p className="text-sm text-gray-400">
        Служебные операции для исправления данных после обновлений логики.
        Используйте осторожно — операции могут занять время при большом количестве игроков.
      </p>

      {/* ─── Maintenance Mode ─── */}
      <div className={`rounded-xl border p-5 space-y-4 ${
        maintenanceStatus?.enabled
          ? 'border-red-700/60 bg-red-950/20'
          : 'border-gray-700/40 bg-gray-900/20'
      }`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Wrench className={`w-5 h-5 ${maintenanceStatus?.enabled ? 'text-red-400' : 'text-gray-400'}`} />
            <div>
              <h3 className="font-semibold text-amber-200">Режим технических работ</h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Закрывает доступ всем игрокам, кроме администраторов
              </p>
            </div>
          </div>
          <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
            maintenanceStatus?.enabled
              ? 'bg-red-900/50 text-red-300'
              : 'bg-green-900/50 text-green-300'
          }`}>
            {maintenanceStatus?.enabled ? 'ВКЛЮЧЕН' : 'ВЫКЛЮЧЕН'}
          </span>
        </div>

        {/* Current status info */}
        {maintenanceStatus?.enabled && (
          <div className="rounded-lg bg-red-950/30 border border-red-800/40 p-3 text-sm space-y-1">
            {maintenanceStatus.endTime && (
              <p className="text-red-200">
                Окончание: {new Date(maintenanceStatus.endTime).toLocaleString('ru-RU')}
              </p>
            )}
            {maintenanceStatus.message && (
              <p className="text-red-200/80 text-xs">Сообщение: {maintenanceStatus.message}</p>
            )}
          </div>
        )}

        {/* Enable form */}
        {!maintenanceStatus?.enabled && (
          <div className="space-y-3">
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Примерное время окончания (необязательно)</label>
              <Input
                type="datetime-local"
                value={maintenanceEndTime}
                onChange={e => setMaintenanceEndTime(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-amber-100 text-sm"
              />
            </div>
            <div>
              <label className="text-xs text-gray-400 mb-1 block">Сообщение игрокам (необязательно)</label>
              <Input
                placeholder="Например: Обновляем серверы..."
                value={maintenanceMessage}
                onChange={e => setMaintenanceMessage(e.target.value)}
                className="bg-gray-900/50 border-gray-700 text-amber-100 text-sm"
              />
            </div>
            <Button
              onClick={enableMaintenance}
              disabled={setMaintenance.isPending}
              className="w-full bg-red-700 hover:bg-red-600 text-white font-semibold"
            >
              <Wrench className="w-4 h-4 mr-2" />
              Включить режим тех.работ
            </Button>
          </div>
        )}

        {/* Disable button */}
        {maintenanceStatus?.enabled && (
          <Button
            onClick={disableMaintenance}
            disabled={setMaintenance.isPending}
            className="w-full bg-green-700 hover:bg-green-600 text-white font-semibold"
          >
            <CheckCircle className="w-4 h-4 mr-2" />
            Выключить режим тех.работ — открыть сервер
          </Button>
        )}
      </div>

      {/* Retroactive achievement recalculation */}
      <div className="rounded-xl border border-amber-800/40 bg-amber-950/20 p-5 space-y-4">
        <div className="flex items-start gap-3">
          <RotateCcw className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
          <div>
            <h3 className="font-semibold text-amber-200">Ретроактивный пересчёт достижений</h3>
            <p className="text-sm text-amber-200/70 mt-1">
              Пересчитывает все достижения, которые можно вычислить из текущих данных БД,
              для <strong>всех игроков</strong>. Полезно после исправления багов в логике достижений.
            </p>
            <div className="mt-2 text-xs text-gray-500 space-y-0.5">
              <p>✅ Пересчитываются: игры, рейтинг, боты, коллекции, донат, премиум, туториал, квесты, рефералы, сезоны, лидерборд</p>
              <p>⏭️ Пропускаются: уже разблокированные достижения (прогресс не уменьшается)</p>
              <p>❌ Не пересчитываются: достижения реального времени (first_trump, batyr_recruit, clean_win и т.д.)</p>
            </div>
          </div>
        </div>

        {/* Result display */}
        {recalcResult && (
          <div className="rounded-lg border border-green-800/40 bg-green-950/20 p-3 space-y-1">
            <div className="flex items-center gap-2 text-green-400 font-semibold text-sm">
              <CheckCheck className="w-4 h-4" />
              Пересчёт завершён
            </div>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-300 mt-1">
              <span className="text-gray-500">Игроков обработано:</span>
              <span>{recalcResult.processedPlayers} / {recalcResult.totalPlayers}</span>
              <span className="text-gray-500">Записей обновлено:</span>
              <span>{recalcResult.totalRecalculated}</span>
              <span className="text-gray-500">Новых разблокировок:</span>
              <span className={recalcResult.totalNewlyUnlocked > 0 ? "text-amber-300 font-semibold" : ""}>{recalcResult.totalNewlyUnlocked}</span>
              {recalcResult.errors > 0 && (
                <>
                  <span className="text-red-400">Ошибок:</span>
                  <span className="text-red-400">{recalcResult.errors}</span>
                </>
              )}
            </div>
          </div>
        )}

        <Button
          onClick={() => setShowRecalcConfirm(true)}
          disabled={retroactiveRecalcMutation.isPending}
          className="w-full bg-amber-700 hover:bg-amber-600 text-white font-semibold"
        >
          {retroactiveRecalcMutation.isPending ? (
            <><RotateCcw className="w-4 h-4 mr-2 animate-spin" /> Пересчитываем всех игроков...</>
          ) : (
            <><RotateCcw className="w-4 h-4 mr-2" /> Запустить ретроактивный пересчёт</>
          )}
        </Button>
      </div>

      {/* Confirmation dialog */}
      <Dialog open={showRecalcConfirm} onOpenChange={setShowRecalcConfirm}>
        <DialogContent className="bg-gray-900 border-amber-800 text-gray-100 max-w-md">
          <DialogHeader>
            <DialogTitle className="text-amber-400 flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              Подтвердите пересчёт
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <p className="text-sm text-gray-300">
              Будет запущен ретроактивный пересчёт достижений для <strong>всех игроков</strong>.
            </p>
            <div className="rounded-lg bg-amber-950/30 border border-amber-800/40 p-3 text-xs text-amber-200/80 space-y-1">
              <p>• Операция безопасна — прогресс только увеличивается, никогда не уменьшается</p>
              <p>• Уже разблокированные достижения не затрагиваются</p>
              <p>• При большом количестве игроков может занять 10–30 секунд</p>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowRecalcConfirm(false)}
              className="border-gray-700 text-gray-300"
            >
              Отмена
            </Button>
            <Button
              onClick={() => retroactiveRecalcMutation.mutate()}
              disabled={retroactiveRecalcMutation.isPending}
              className="bg-amber-700 hover:bg-amber-600 text-white"
            >
              {retroactiveRecalcMutation.isPending ? 'Выполняется...' : 'Запустить'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Custom Profanity Filter ─── */}
      <ProfanityFilterSection />
    </div>
  );
}

function ProfanityFilterSection() {
  const utils = trpc.useUtils();
  const { data: words = [], isLoading } = trpc.admin.getCustomProfanityWords.useQuery();
  const setWordsMut = trpc.admin.setCustomProfanityWords.useMutation({
    onSuccess: () => {
      utils.admin.getCustomProfanityWords.invalidate();
      toast.success('Фильтр обновлён');
    },
    onError: (e) => toast.error(`Ошибка: ${e.message}`),
  });
  const [newWord, setNewWord] = useState('');
  const [localWords, setLocalWords] = useState<string[]>([]);

  useEffect(() => {
    setLocalWords(words);
  }, [words]);

  const addWord = () => {
    const trimmed = newWord.trim().toLowerCase();
    if (!trimmed || localWords.includes(trimmed)) return;
    const updated = [...localWords, trimmed];
    setLocalWords(updated);
    setNewWord('');
    setWordsMut.mutate({ words: updated });
  };

  const removeWord = (word: string) => {
    const updated = localWords.filter(w => w !== word);
    setLocalWords(updated);
    setWordsMut.mutate({ words: updated });
  };

  return (
    <div className="rounded-xl border border-purple-700/40 bg-purple-950/10 p-5 space-y-4">
      <div className="flex items-center gap-3">
        <span className="text-purple-400 text-xl">🚫</span>
        <div>
          <h3 className="font-semibold text-amber-200">Фильтр имён (кастомные слова)</h3>
          <p className="text-xs text-gray-400 mt-0.5">Добавляйте слова, которые игроки не смогут использовать в никах</p>
        </div>
      </div>
      <div className="flex gap-2">
        <Input
          value={newWord}
          onChange={e => setNewWord(e.target.value)}
          placeholder="Добавить слово..."
          maxLength={64}
          className="bg-gray-800 border-gray-700 text-amber-100 flex-1"
          onKeyDown={e => { if (e.key === 'Enter') addWord(); }}
        />
        <Button
          onClick={addWord}
          disabled={!newWord.trim() || setWordsMut.isPending}
          className="bg-purple-700 hover:bg-purple-600 text-white shrink-0"
        >
          + Добавить
        </Button>
      </div>
      {isLoading ? (
        <p className="text-xs text-gray-500">Загрузка...</p>
      ) : localWords.length === 0 ? (
        <p className="text-xs text-gray-500 italic">Кастомных слов нет. Добавьте первое слово выше.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {localWords.map(word => (
            <span
              key={word}
              className="inline-flex items-center gap-1.5 bg-purple-900/40 border border-purple-700/50 text-purple-200 text-sm px-3 py-1 rounded-full"
            >
              {word}
              <button
                onClick={() => removeWord(word)}
                className="text-purple-400 hover:text-red-400 transition-colors ml-0.5"
                title="Удалить"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      )}
      <p className="text-xs text-gray-500">
        Слова хранятся в БД и проверяются при каждой смене имени игрока. Строчные буквы и регистр игнорируются.
      </p>
    </div>
  );
}
