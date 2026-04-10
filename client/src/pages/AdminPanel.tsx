import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";
import {
  Users, Activity, ArrowLeftRight, Shield, Search,
  ChevronLeft, ChevronRight, Ban, CheckCircle, Trash2,
  DollarSign, ArrowLeft, RefreshCw, LogOut as KickIcon,
  Eye, ArrowUpDown, Crown, Clock, Gamepad2, Trophy,
  ChevronDown, ChevronUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type Tab = "players" | "monitoring" | "transactions";

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

/* ================================================================
   ADMIN PANEL
   ================================================================ */
export default function AdminPanel() {
  const { user, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [tab, setTab] = useState<Tab>("players");

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 flex items-center justify-center">
        <div className="text-amber-100 text-lg animate-pulse">Загрузка...</div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
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

  const tabs: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "players", label: "Игроки", icon: Users },
    { id: "monitoring", label: "Мониторинг", icon: Activity },
    { id: "transactions", label: "Транзакции", icon: ArrowLeftRight },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-950 to-gray-900 text-gray-100">
      {/* Header */}
      <div className="border-b border-gray-800 bg-gray-950/80 backdrop-blur sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={() => setLocation("/")} className="text-gray-400 hover:text-amber-100">
              <ArrowLeft className="w-4 h-4 mr-1" /> Лобби
            </Button>
            <div className="h-6 w-px bg-gray-700" />
            <Shield className="w-5 h-5 text-amber-500" />
            <span className="font-bold text-amber-100">Админ-панель</span>
          </div>
          <span className="text-sm text-gray-500">{user.name}</span>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 flex gap-1">
          {tabs.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
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

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {tab === "players" && <PlayersTab />}
        {tab === "monitoring" && <MonitoringTab />}
        {tab === "transactions" && <TransactionsTab />}
      </div>
    </div>
  );
}

/* ================================================================
   PLAYERS TAB
   ================================================================ */
function PlayersTab() {
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
  const [balanceCurrency, setBalanceCurrency] = useState<"tenge" | "shanyrak">("shanyrak");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [balanceDescription, setBalanceDescription] = useState("");

  const utils = trpc.useUtils();

  const banMutation = trpc.admin.banPlayer.useMutation({
    onSuccess: () => {
      toast.success("Игрок заблокирован");
      setShowBanDialog(false);
      setBanReason("");
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
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* Search */}
      <div className="flex gap-3 items-center">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <Input
            placeholder="Поиск по имени или Game ID..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(0); }}
            className="pl-10 bg-gray-900 border-gray-700 text-gray-100 placeholder:text-gray-500"
          />
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-700 text-gray-300">
          <RefreshCw className="w-4 h-4" />
        </Button>
        <span className="text-sm text-gray-500">Всего: {formatNumber(data?.total)}</span>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/50">
            <tr className="text-left text-gray-400">
              <th className="px-4 py-3 font-medium">ID</th>
              <th className="px-4 py-3 font-medium">Имя</th>
              <th className="px-4 py-3 font-medium">Рейтинг</th>
              <th className="px-4 py-3 font-medium">Игры</th>
              <th className="px-4 py-3 font-medium">W/L</th>
              <th className="px-4 py-3 font-medium">Тенге</th>
              <th className="px-4 py-3 font-medium">Шаныраки</th>
              <th className="px-4 py-3 font-medium">Статус</th>
              <th className="px-4 py-3 font-medium">Действия</th>
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
                  <td className="px-4 py-3 font-medium text-amber-100">{p.displayName || "—"}</td>
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
                    <div className="flex gap-1">
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 px-2 text-xs text-blue-400 hover:text-blue-300"
                        onClick={() => setProfilePlayerId(p.id)}
                      >
                        <Eye className="w-3 h-3 mr-1" /> Профиль
                      </Button>
                      <Button
                        variant="ghost" size="sm"
                        className="h-7 px-2 text-xs text-amber-400 hover:text-amber-300"
                        onClick={() => { setSelectedPlayer(p); setShowBalanceDialog(true); }}
                      >
                        <DollarSign className="w-3 h-3 mr-1" /> Баланс
                      </Button>
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
                          onClick={() => { setSelectedPlayer(p); setShowBanDialog(true); }}
                        >
                          <Ban className="w-3 h-3 mr-1" /> Бан
                        </Button>
                      )}
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

      {/* Ban Dialog */}
      <Dialog open={showBanDialog} onOpenChange={setShowBanDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle>Заблокировать {selectedPlayer?.displayName}</DialogTitle>
            <DialogDescription className="text-gray-400">Укажите причину блокировки</DialogDescription>
          </DialogHeader>
          <Input
            placeholder="Причина бана..."
            value={banReason}
            onChange={e => setBanReason(e.target.value)}
            className="bg-gray-800 border-gray-700 text-gray-100"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBanDialog(false)} className="border-gray-700 text-gray-300">
              Отмена
            </Button>
            <Button
              variant="destructive"
              disabled={!banReason.trim() || banMutation.isPending}
              onClick={() => selectedPlayer && banMutation.mutate({ profileId: selectedPlayer.id, reason: banReason })}
            >
              Заблокировать
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
function PlayerProfileView({ profileId, onBack }: { profileId: number; onBack: () => void }) {
  const [profileTab, setProfileTab] = useState<"info" | "transactions" | "games">("info");

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
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="text-gray-400 hover:text-amber-100">
            <ArrowLeft className="w-4 h-4 mr-1" /> Назад к списку
          </Button>
          <div className="h-6 w-px bg-gray-700" />
          <h2 className="text-lg font-bold text-amber-100">
            {detail.displayName || "Без имени"} <span className="text-gray-500 font-normal text-sm">#{detail.gameId}</span>
          </h2>
          {detail.role === "admin" && (
            <span className="text-xs bg-amber-900/50 text-amber-300 px-2 py-0.5 rounded flex items-center gap-1">
              <Crown className="w-3 h-3" /> Админ
            </span>
          )}
          {detail.isBanned && (
            <span className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded flex items-center gap-1">
              <Ban className="w-3 h-3" /> Забанен
            </span>
          )}
        </div>
        <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-700 text-gray-300">
          <RefreshCw className="w-4 h-4" />
        </Button>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-1 border-b border-gray-800">
        {profileTabs.map(t => (
          <button
            key={t.id}
            onClick={() => setProfileTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
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
        />
      )}
      {profileTab === "transactions" && <ProfileTransactionsSection profileId={profileId} />}
      {profileTab === "games" && <ProfileGamesSection profileId={profileId} />}
    </div>
  );
}

/* ─── Profile Info Section ─── */
function ProfileInfoSection({
  detail,
  onUpdateRole,
  isUpdatingRole,
}: {
  detail: any;
  onUpdateRole: (role: "admin" | "user") => void;
  isUpdatingRole: boolean;
}) {
  const [showRoleDialog, setShowRoleDialog] = useState(false);
  const newRole = detail.role === "admin" ? "user" : "admin";

  return (
    <div className="space-y-6">
      {/* Info cards grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="Рейтинг" value={formatNumber(detail.rating)} icon={Trophy} color="text-amber-400" />
        <InfoCard label="Игры" value={formatNumber(detail.gamesPlayed)} icon={Gamepad2} color="text-blue-400" />
        <InfoCard label="Победы" value={formatNumber(detail.wins)} icon={Trophy} color="text-green-400" />
        <InfoCard label="Поражения" value={formatNumber(detail.losses)} icon={Ban} color="text-red-400" />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <InfoCard label="Тенге" value={formatNumber(detail.balanceTenge)} icon={DollarSign} color="text-emerald-400" />
        <InfoCard label="Шаныраки" value={formatNumber(detail.balanceShanyrak)} icon={DollarSign} color="text-yellow-400" />
        <InfoCard label="Обучение" value={detail.tutorialCompleted ? "Пройдено" : "Нет"} icon={CheckCircle} color={detail.tutorialCompleted ? "text-green-400" : "text-gray-500"} />
        <InfoCard label="Роль" value={detail.role === "admin" ? "Админ" : "Игрок"} icon={Crown} color={detail.role === "admin" ? "text-amber-400" : "text-gray-400"} />
      </div>

      {/* Details table */}
      <div className="border border-gray-800 rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <tbody className="divide-y divide-gray-800">
            <DetailRow label="Profile ID" value={`#${detail.id}`} />
            <DetailRow label="Game ID" value={`#${detail.gameId}`} />
            <DetailRow label="Open ID" value={detail.openId || "—"} mono />
            <DetailRow label="Email" value={detail.email || "—"} />
            <DetailRow label="Аватар" value={detail.avatarId || "wolf"} />
            <DetailRow label="Рамка" value={detail.equippedFrame || "Нет"} />
            <DetailRow label="Последний вход" value={formatDate(detail.lastSignedIn)} />
            <DetailRow label="Регистрация (user)" value={formatDate(detail.userCreatedAt)} />
            <DetailRow label="Регистрация (profile)" value={formatDate(detail.createdAt)} />
            {detail.isBanned && (
              <>
                <DetailRow label="Причина бана" value={detail.banReason || "—"} highlight="red" />
                <DetailRow label="Дата бана" value={formatDate(detail.bannedAt)} highlight="red" />
              </>
            )}
          </tbody>
        </table>
      </div>

      {/* Role change button */}
      <div className="flex gap-3">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowRoleDialog(true)}
          className="border-gray-700 text-gray-300"
        >
          <Crown className="w-4 h-4 mr-2" />
          Сменить роль на {newRole === "admin" ? "Админ" : "Игрок"}
        </Button>
      </div>

      {/* Role change dialog */}
      <Dialog open={showRoleDialog} onOpenChange={setShowRoleDialog}>
        <DialogContent className="bg-gray-900 border-gray-700 text-gray-100">
          <DialogHeader>
            <DialogTitle>Смена роли</DialogTitle>
            <DialogDescription className="text-gray-400">
              Вы уверены, что хотите изменить роль игрока <strong className="text-amber-100">{detail.displayName}</strong> с{" "}
              <strong className="text-amber-100">{detail.role}</strong> на{" "}
              <strong className="text-amber-100">{newRole}</strong>?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowRoleDialog(false)} className="border-gray-700 text-gray-300">
              Отмена
            </Button>
            <Button
              disabled={isUpdatingRole}
              onClick={() => {
                onUpdateRole(newRole);
                setShowRoleDialog(false);
              }}
              className="bg-amber-600 hover:bg-amber-700"
            >
              Подтвердить
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function InfoCard({ label, value, icon: Icon, color }: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/30">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="text-xl font-bold text-gray-100">{value}</div>
    </div>
  );
}

function DetailRow({ label, value, mono, highlight }: { label: string; value: string; mono?: boolean; highlight?: "red" }) {
  return (
    <tr className="hover:bg-gray-900/30">
      <td className="px-4 py-2.5 text-gray-500 text-sm w-48">{label}</td>
      <td className={`px-4 py-2.5 text-sm ${
        highlight === "red" ? "text-red-400" : "text-gray-100"
      } ${mono ? "font-mono text-xs" : ""}`}>
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

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/50">
            <tr className="text-left text-gray-400">
              <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("date")}>
                <span className="flex items-center">Дата <SortIcon col="date" /></span>
              </th>
              <th className="px-4 py-3 font-medium">Тип</th>
              <th className="px-4 py-3 font-medium cursor-pointer select-none" onClick={() => toggleSort("amount")}>
                <span className="flex items-center">Сумма <SortIcon col="amount" /></span>
              </th>
              <th className="px-4 py-3 font-medium">Валюта</th>
              <th className="px-4 py-3 font-medium">Баланс после</th>
              <th className="px-4 py-3 font-medium">Описание</th>
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
        <div className="flex items-center justify-between">
          <Button
            variant="outline" size="sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="border-gray-700 text-gray-300"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Назад
          </Button>
          <span className="text-sm text-gray-500">Страница {page + 1} из {totalPages}</span>
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

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/50">
            <tr className="text-left text-gray-400">
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 font-medium">Игроков</th>
              <th className="px-4 py-3 font-medium">Место</th>
              <th className="px-4 py-3 font-medium">Результат</th>
              <th className="px-4 py-3 font-medium">Рейтинг</th>
              <th className="px-4 py-3 font-medium">Длительность</th>
              <th className="px-4 py-3 font-medium">Комната</th>
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
        <div className="flex items-center justify-between">
          <Button
            variant="outline" size="sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="border-gray-700 text-gray-300"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Назад
          </Button>
          <span className="text-sm text-gray-500">Страница {page + 1} из {totalPages}</span>
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

  return (
    <div className="space-y-6">
      {/* Stats cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Игроков онлайн" value={data?.onlinePlayerCount ?? 0} icon={Users} color="text-green-400" />
        <StatCard label="Активных комнат" value={data?.activeRoomCount ?? 0} icon={Activity} color="text-blue-400" />
        <StatCard label="Всего игроков" value={globalStats.data?.totalPlayers ?? 0} icon={Users} color="text-amber-400" />
        <StatCard label="Всего игр" value={globalStats.data?.totalGames ?? 0} icon={ArrowLeftRight} color="text-purple-400" />
      </div>

      {/* Global economy */}
      {globalStats.data && (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <StatCard label="Шаныраков в обороте" value={globalStats.data.totalShanyrak ?? 0} icon={DollarSign} color="text-yellow-400" />
          <StatCard label="Тенге в обороте" value={globalStats.data.totalTenge ?? 0} icon={DollarSign} color="text-emerald-400" />
          <StatCard label="Забаненных" value={globalStats.data.bannedCount ?? 0} icon={Ban} color="text-red-400" />
        </div>
      )}

      {/* Active rooms */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-semibold text-amber-100">Активные комнаты</h3>
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-700 text-gray-300">
            <RefreshCw className="w-4 h-4" />
          </Button>
        </div>

        {isLoading ? (
          <div className="text-gray-500 text-center py-8">Загрузка...</div>
        ) : !data?.rooms?.length ? (
          <div className="text-gray-500 text-center py-8 border border-gray-800 rounded-lg">Нет активных комнат</div>
        ) : (
          <div className="space-y-3">
            {data.rooms.map((room: any) => (
              <div key={room.roomId} className="border border-gray-800 rounded-lg p-4 bg-gray-900/30">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-3">
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
    <div className="border border-gray-800 rounded-lg p-4 bg-gray-900/30">
      <div className="flex items-center gap-2 mb-1">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-xs text-gray-500">{label}</span>
      </div>
      <div className="text-2xl font-bold text-gray-100">{formatNumber(value)}</div>
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
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-amber-100">История транзакций</h3>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => refetch()} className="border-gray-700 text-gray-300">
            <RefreshCw className="w-4 h-4" />
          </Button>
          <span className="text-sm text-gray-500">Всего: {formatNumber(data?.total)}</span>
        </div>
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-900/50">
            <tr className="text-left text-gray-400">
              <th className="px-4 py-3 font-medium">Дата</th>
              <th className="px-4 py-3 font-medium">Игрок</th>
              <th className="px-4 py-3 font-medium">Тип</th>
              <th className="px-4 py-3 font-medium">Сумма</th>
              <th className="px-4 py-3 font-medium">Описание</th>
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
                  <td className="px-4 py-3 text-amber-100">{t.displayName || `Profile #${t.profileId}`}</td>
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
        <div className="flex items-center justify-between">
          <Button
            variant="outline" size="sm"
            disabled={page === 0}
            onClick={() => setPage(p => p - 1)}
            className="border-gray-700 text-gray-300"
          >
            <ChevronLeft className="w-4 h-4 mr-1" /> Назад
          </Button>
          <span className="text-sm text-gray-500">Страница {page + 1} из {totalPages}</span>
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
    </div>
  );
}
