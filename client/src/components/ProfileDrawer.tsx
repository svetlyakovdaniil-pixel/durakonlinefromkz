import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  User, Users, Trophy, UserPlus, UserCheck, UserX, Crown,
  Swords, Shield, TrendingUp, Hash, Clock, Check, X, Loader2,
  Eye, ArrowLeft, Send, Camera, History, ArrowUpCircle, ArrowDownCircle,
  Coins, Banknote,
} from 'lucide-react';
import { getAvatarUrl } from '../../../shared/avatars';
import AvatarPicker from './AvatarPicker';

interface ProfileDrawerProps {
  /** Current user's profile data */
  profile: {
    gameId: number;
    displayName: string | null;
    rating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    avatarId?: string | null;
  } | null;
  /** Online friend gameIds from socket */
  onlineFriendIds: number[];
  /** Trigger element */
  children: React.ReactNode;
  /** Callback to invite a friend to the current room */
  onInviteFriend?: (targetGameId: number) => void;
  /** Whether we're in a room (show invite buttons) */
  inRoom?: boolean;
}

export default function ProfileDrawer({
  profile, onlineFriendIds, children, onInviteFriend, inRoom,
}: ProfileDrawerProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="bg-[#0f2035] border-amber-700/30 text-amber-100 w-[340px] sm:w-[400px] p-0 overflow-hidden">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-amber-100">Профиль</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue={inRoom ? 'friends' : 'profile'} className="flex flex-col h-[calc(100%-60px)]">
          <TabsList className="mx-4 bg-[#1a2d45] border border-amber-700/20">
            <TabsTrigger value="profile" className="text-amber-200/70 data-[state=active]:text-amber-100 data-[state=active]:bg-amber-700/30 text-xs">
              <User className="w-3.5 h-3.5 mr-1" /> Профиль
            </TabsTrigger>
            <TabsTrigger value="friends" className="text-amber-200/70 data-[state=active]:text-amber-100 data-[state=active]:bg-amber-700/30 text-xs">
              <Users className="w-3.5 h-3.5 mr-1" /> Друзья
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="text-amber-200/70 data-[state=active]:text-amber-100 data-[state=active]:bg-amber-700/30 text-xs">
              <Trophy className="w-3.5 h-3.5 mr-1" /> Рейтинг
            </TabsTrigger>
            <TabsTrigger value="history" className="text-amber-200/70 data-[state=active]:text-amber-100 data-[state=active]:bg-amber-700/30 text-xs">
              <History className="w-3.5 h-3.5 mr-1" /> История
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="flex-1 overflow-y-auto px-4 pb-4">
            <ProfileTab profile={profile} />
          </TabsContent>
          <TabsContent value="friends" className="flex-1 overflow-y-auto px-4 pb-4">
            <FriendsTab
              onlineFriendIds={onlineFriendIds}
              onInviteFriend={onInviteFriend}
              inRoom={inRoom}
            />
          </TabsContent>
          <TabsContent value="leaderboard" className="flex-1 overflow-y-auto px-4 pb-4">
            <LeaderboardTab myGameId={profile?.gameId} />
          </TabsContent>
          <TabsContent value="history" className="flex-1 overflow-y-auto px-4 pb-4">
            <TransactionHistoryTab />
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// Profile Tab
// ============================================================
function ProfileTab({ profile }: { profile: ProfileDrawerProps['profile'] }) {
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const utils = trpc.useUtils();

  const updateAvatar = trpc.profile.updateAvatar.useMutation({
    onSuccess: () => {
      toast.success('Аватар обновлён!');
      utils.profile.me.invalidate();
      setShowAvatarPicker(false);
    },
    onError: () => toast.error('Ошибка при обновлении аватара'),
  });

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  const winRate = profile.gamesPlayed > 0
    ? ((profile.wins / profile.gamesPlayed) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4 mt-3">
      {/* Avatar + Game ID card */}
      <div className="bg-gradient-to-r from-amber-700/30 to-amber-600/20 border border-amber-600/30 rounded-xl p-4 text-center">
        {/* Avatar */}
        <div className="flex justify-center mb-3">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-amber-500 shadow-lg shadow-amber-500/20">
              <img
                src={getAvatarUrl(profile.avatarId)}
                alt="Avatar"
                className="w-full h-full object-cover"
              />
            </div>
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-600 hover:bg-amber-500 border-2 border-[#0f2035] flex items-center justify-center transition-colors shadow-md"
              title="Сменить аватар"
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        <div className="text-amber-200/60 text-xs mb-1">Ваш ID</div>
        <div className="text-4xl font-bold text-amber-300 flex items-center justify-center gap-2">
          <Hash className="w-7 h-7" />
          {profile.gameId}
        </div>
        <div className="text-amber-200/50 text-xs mt-1">Дайте друзьям этот ID, чтобы они добавили вас</div>
      </div>

      {/* Display name */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3">
        <div className="text-amber-200/60 text-xs mb-1">Имя</div>
        <div className="text-amber-100 font-medium">{profile.displayName || 'Игрок'}</div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={<TrendingUp className="w-4 h-4 text-amber-400" />} label="Рейтинг" value={String(profile.rating)} />
        <StatCard icon={<Swords className="w-4 h-4 text-blue-400" />} label="Игры" value={String(profile.gamesPlayed)} />
        <StatCard icon={<Crown className="w-4 h-4 text-green-400" />} label="Победы" value={String(profile.wins)} />
        <StatCard icon={<Shield className="w-4 h-4 text-red-400" />} label="Поражения" value={String(profile.losses)} />
      </div>

      {/* Win rate */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3 text-center">
        <div className="text-amber-200/60 text-xs mb-1">Винрейт</div>
        <div className="text-2xl font-bold text-amber-300">{winRate}%</div>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <AvatarPicker
          currentAvatarId={profile.avatarId}
          onSelect={(avatarId) => updateAvatar.mutate({ avatarId })}
          onClose={() => setShowAvatarPicker(false)}
          loading={updateAvatar.isPending}
        />
      )}
    </div>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3 text-center">
      <div className="flex items-center justify-center mb-1">{icon}</div>
      <div className="text-lg font-bold text-amber-100">{value}</div>
      <div className="text-amber-200/50 text-[10px]">{label}</div>
    </div>
  );
}

// ============================================================
// Friend Profile View (inline, replaces friends list)
// ============================================================
function FriendProfileView({
  gameId,
  onBack,
  onInviteFriend,
  inRoom,
  isOnline,
}: {
  gameId: number;
  onBack: () => void;
  onInviteFriend?: (targetGameId: number) => void;
  inRoom?: boolean;
  isOnline: boolean;
}) {
  const profileQuery = trpc.profile.byGameId.useQuery({ gameId }, { staleTime: 10_000 });
  const profile = profileQuery.data;

  if (profileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-4 mt-3">
        <Button variant="ghost" size="sm" className="text-amber-200/70 hover:text-amber-100" onClick={onBack}>
          <ArrowLeft className="w-4 h-4 mr-1" /> Назад
        </Button>
        <div className="text-center py-8 text-amber-200/30 text-sm">
          Профиль не найден
        </div>
      </div>
    );
  }

  const winRate = profile.gamesPlayed > 0
    ? ((profile.wins / profile.gamesPlayed) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4 mt-3">
      <Button variant="ghost" size="sm" className="text-amber-200/70 hover:text-amber-100" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-1" /> Назад к друзьям
      </Button>

      {/* Friend's Avatar + Game ID */}
      <div className="bg-gradient-to-r from-blue-700/30 to-blue-600/20 border border-blue-600/30 rounded-xl p-4 text-center">
        {/* Avatar */}
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-400/50 shadow-lg">
            <img
              src={getAvatarUrl((profile as any).avatarId)}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
          <span className="text-blue-200/60 text-xs">{isOnline ? 'В сети' : 'Не в сети'}</span>
        </div>
        <div className="text-amber-100 font-medium text-lg mb-1">{profile.displayName || 'Игрок'}</div>
        <div className="text-3xl font-bold text-blue-300 flex items-center justify-center gap-2">
          <Hash className="w-6 h-6" />
          {profile.gameId}
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-2">
        <StatCard icon={<TrendingUp className="w-4 h-4 text-amber-400" />} label="Рейтинг" value={String(profile.rating)} />
        <StatCard icon={<Swords className="w-4 h-4 text-blue-400" />} label="Игры" value={String(profile.gamesPlayed)} />
        <StatCard icon={<Crown className="w-4 h-4 text-green-400" />} label="Победы" value={String(profile.wins)} />
        <StatCard icon={<Shield className="w-4 h-4 text-red-400" />} label="Поражения" value={String(profile.losses)} />
      </div>

      {/* Win rate */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3 text-center">
        <div className="text-amber-200/60 text-xs mb-1">Винрейт</div>
        <div className="text-2xl font-bold text-amber-300">{winRate}%</div>
      </div>

      {/* Invite button */}
      {inRoom && isOnline && onInviteFriend && (
        <Button
          className="w-full bg-amber-600 hover:bg-amber-500 text-white"
          onClick={() => {
            onInviteFriend(profile.gameId);
            toast.success(`Приглашение отправлено игроку ${profile.displayName || 'Игрок'}!`);
          }}
        >
          <Send className="w-4 h-4 mr-2" />
          Пригласить в комнату
        </Button>
      )}
    </div>
  );
}

// ============================================================
// Friends Tab
// ============================================================
function FriendsTab({
  onlineFriendIds, onInviteFriend, inRoom,
}: {
  onlineFriendIds: number[];
  onInviteFriend?: (targetGameId: number) => void;
  inRoom?: boolean;
}) {
  const [addGameId, setAddGameId] = useState('');
  const [viewingFriendGameId, setViewingFriendGameId] = useState<number | null>(null);
  const utils = trpc.useUtils();

  const friendsQuery = trpc.friends.list.useQuery(undefined, {
    refetchInterval: 15_000,
  });
  const pendingQuery = trpc.friends.pendingRequests.useQuery(undefined, {
    refetchInterval: 10_000,
  });

  const sendRequest = trpc.friends.sendRequest.useMutation({
    onSuccess: (data) => {
      if (data.result === 'sent') {
        toast.success('Заявка отправлена!');
        setAddGameId('');
      } else if (data.result === 'already_friends') {
        toast.info('Вы уже друзья!');
      } else if (data.result === 'already_pending') {
        toast.info('Заявка уже отправлена');
      } else {
        toast.error('Игрок не найден');
      }
    },
    onError: () => toast.error('Ошибка при отправке заявки'),
  });

  const acceptRequest = trpc.friends.acceptRequest.useMutation({
    onSuccess: () => {
      toast.success('Заявка принята!');
      utils.friends.list.invalidate();
      utils.friends.pendingRequests.invalidate();
    },
  });

  const rejectRequest = trpc.friends.rejectRequest.useMutation({
    onSuccess: () => {
      toast.info('Заявка отклонена');
      utils.friends.pendingRequests.invalidate();
    },
  });

  const removeFriend = trpc.friends.remove.useMutation({
    onSuccess: () => {
      toast.info('Друг удалён');
      utils.friends.list.invalidate();
    },
  });

  const handleSendRequest = () => {
    const id = parseInt(addGameId);
    if (!id || id <= 0) {
      toast.error('Введите корректный ID игрока');
      return;
    }
    sendRequest.mutate({ targetGameId: id });
  };

  const friends = friendsQuery.data ?? [];
  const pending = pendingQuery.data ?? [];

  // If viewing a friend's profile, show that instead
  if (viewingFriendGameId !== null) {
    const isOnline = onlineFriendIds.includes(viewingFriendGameId);
    return (
      <FriendProfileView
        gameId={viewingFriendGameId}
        onBack={() => setViewingFriendGameId(null)}
        onInviteFriend={onInviteFriend}
        inRoom={inRoom}
        isOnline={isOnline}
      />
    );
  }

  return (
    <div className="space-y-4 mt-3">
      {/* Add friend */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3">
        <div className="text-amber-200/60 text-xs mb-2 flex items-center gap-1">
          <UserPlus className="w-3.5 h-3.5" /> Добавить друга по ID
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="ID игрока"
            value={addGameId}
            onChange={e => setAddGameId(e.target.value)}
            className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-8 text-sm"
            onKeyDown={e => e.key === 'Enter' && handleSendRequest()}
          />
          <Button
            size="sm"
            className="bg-amber-600 hover:bg-amber-500 text-white h-8 px-3"
            onClick={handleSendRequest}
            disabled={sendRequest.isPending}
          >
            {sendRequest.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
          </Button>
        </div>
      </div>

      {/* Pending requests */}
      {pending.length > 0 && (
        <div>
          <div className="text-amber-200/60 text-xs mb-2 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" /> Входящие заявки ({pending.length})
          </div>
          <div className="space-y-1.5">
            {pending.map(req => (
              <div key={req.friendshipId} className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-lg p-2 flex items-center justify-between">
                <div>
                  <span className="text-amber-100 text-sm font-medium">{req.senderName}</span>
                  <span className="text-amber-200/40 text-xs ml-1.5">#{req.senderGameId}</span>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    className="bg-green-700 hover:bg-green-600 text-white h-7 w-7 p-0"
                    onClick={() => acceptRequest.mutate({ friendshipId: req.friendshipId })}
                    disabled={acceptRequest.isPending}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-700/40 text-red-300 hover:bg-red-900/30 h-7 w-7 p-0"
                    onClick={() => rejectRequest.mutate({ friendshipId: req.friendshipId })}
                    disabled={rejectRequest.isPending}
                  >
                    <X className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div>
        <div className="text-amber-200/60 text-xs mb-2 flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5" /> Друзья ({friends.length})
        </div>
        {friends.length === 0 ? (
          <div className="text-center py-6 text-amber-200/30 text-sm">
            Пока нет друзей. Добавьте по ID!
          </div>
        ) : (
          <div className="space-y-1.5">
            {friends.map(friend => {
              const isOnline = onlineFriendIds.includes(friend.gameId);
              return (
                <div key={friend.profileId} className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-lg p-2 flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0"
                    onClick={() => setViewingFriendGameId(friend.gameId)}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
                    <div className="min-w-0">
                      <span className="text-amber-100 text-sm font-medium">{friend.displayName || 'Игрок'}</span>
                      <span className="text-amber-200/40 text-xs ml-1.5">#{friend.gameId}</span>
                    </div>
                    <Badge variant="outline" className="border-amber-700/20 text-amber-200/50 text-[10px] px-1.5 shrink-0">
                      {friend.rating}
                    </Badge>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-1">
                    {/* View profile */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-700/40 text-blue-300 hover:bg-blue-900/30 h-7 w-7 p-0"
                      onClick={() => setViewingFriendGameId(friend.gameId)}
                      title="Посмотреть профиль"
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    {/* Invite button (only in room, only if friend is online) */}
                    {inRoom && isOnline && onInviteFriend && (
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-500 text-white h-7 px-2 text-[10px]"
                        onClick={() => onInviteFriend(friend.gameId)}
                      >
                        <Send className="w-3 h-3 mr-0.5" />
                        Пригласить
                      </Button>
                    )}
                    {/* Remove friend */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-700/40 text-red-300 hover:bg-red-900/30 h-7 w-7 p-0"
                      onClick={() => removeFriend.mutate({ friendProfileId: friend.profileId })}
                      disabled={removeFriend.isPending}
                      title="Удалить друга"
                    >
                      <UserX className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// Leaderboard Tab
// ============================================================
// ============================================================
// Transaction History Tab (private - only own transactions)
// ============================================================
function TransactionHistoryTab() {
  const txQuery = trpc.balance.myTransactions.useQuery(undefined, {
    staleTime: 10_000,
  });

  const data = txQuery.data ?? [];

  if (txQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="mt-3 text-center py-8 text-amber-200/30 text-sm">
        Пока нет транзакций
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-1.5">
      {data.map((tx) => {
        const isPositive = tx.amount > 0;
        const currencyIcon = tx.currency === 'tenge' ? (
          <Coins className="w-3.5 h-3.5 text-amber-400" />
        ) : (
          <Banknote className="w-3.5 h-3.5 text-green-400" />
        );
        const amountColor = isPositive ? 'text-green-400' : 'text-red-400';
        const amountPrefix = isPositive ? '+' : '';
        const currencyLabel = tx.currency === 'tenge' ? 'тенге' : 'шаныраков';

        const date = new Date(tx.createdAt);
        const timeStr = date.toLocaleString('ru-RU', {
          day: '2-digit', month: '2-digit', year: '2-digit',
          hour: '2-digit', minute: '2-digit',
        });

        return (
          <div key={tx.id} className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-lg p-2.5">
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                {isPositive ? (
                  <ArrowUpCircle className="w-3.5 h-3.5 text-green-400" />
                ) : (
                  <ArrowDownCircle className="w-3.5 h-3.5 text-red-400" />
                )}
                <span className="text-amber-100 text-xs font-medium truncate max-w-[180px]">
                  {tx.description || 'Операция'}
                </span>
              </div>
              <span className={`text-xs font-bold ${amountColor} flex items-center gap-0.5`}>
                {amountPrefix}{tx.amount.toLocaleString('ru-RU')} {currencyIcon}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-200/30 text-[10px]">{timeStr}</span>
              {tx.balanceAfter !== null && (
                <span className="text-amber-200/40 text-[10px]">
                  Баланс: {tx.balanceAfter.toLocaleString('ru-RU')} {currencyLabel}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ============================================================
// Leaderboard Tab
// ============================================================
function LeaderboardTab({ myGameId }: { myGameId?: number }) {
  const leaderboardQuery = trpc.stats.leaderboard.useQuery({ limit: 50 }, {
    staleTime: 30_000,
  });

  const data = leaderboardQuery.data ?? [];

  if (leaderboardQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  return (
    <div className="mt-3">
      <div className="space-y-1">
        {data.map((player, idx) => {
          const isMe = player.gameId === myGameId;
          const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : null;
          return (
            <div
              key={player.gameId}
              className={`flex items-center justify-between px-3 py-2 rounded-lg ${
                isMe ? 'bg-amber-700/20 border border-amber-600/30' : 'bg-[#1a2d45]/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-amber-200/50 text-xs w-6 text-right">
                  {medal || `${idx + 1}.`}
                </span>
                <span className={`text-sm font-medium ${isMe ? 'text-amber-300' : 'text-amber-100'}`}>
                  {player.displayName || 'Игрок'}
                </span>
                <span className="text-amber-200/30 text-[10px]">#{player.gameId}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-200/50 text-[10px]">{player.wins}W/{player.losses}L</span>
                <Badge variant="outline" className="border-amber-700/20 text-amber-300 text-xs px-1.5">
                  {player.rating}
                </Badge>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div className="text-center py-8 text-amber-200/30 text-sm">
            Пока нет данных рейтинга
          </div>
        )}
      </div>
    </div>
  );
}
