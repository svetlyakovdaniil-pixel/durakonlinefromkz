import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { toast } from 'sonner';
import {
  Users, UserPlus, UserCheck, UserX,
  Clock, Check, X, Loader2,
  Eye, ArrowLeft, Send, Gift,
} from 'lucide-react';
import { useTranslation } from '@/i18n';
import { PlayerAvatar } from './PlayerAvatar';
import { TrendingUp, Swords, Crown, Shield, Hash, Trophy, Star } from 'lucide-react';
import ReferralPanel from './ReferralPanel';
import { DiamondRankIcon } from './DiamondRankIcon';

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
  const seasonQuery = trpc.profile.seasonRatingByGameId.useQuery({ gameId }, { staleTime: 30_000 });
  const achievementsQuery = trpc.profile.achievementsByGameId.useQuery({ gameId }, { staleTime: 30_000 });
  const profile = profileQuery.data;
  const { t, locale } = useTranslation();
  const [activeTab, setActiveTab] = useState<'stats' | 'achievements'>('stats');

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
          <ArrowLeft className="w-4 h-4 mr-1" /> {t('common.back')}
        </Button>
        <div className="text-center py-8 text-amber-200/30 text-sm">
          {t('profile.playerNotFound')}
        </div>
      </div>
    );
  }

  const winRate = profile.gamesPlayed > 0
    ? ((profile.wins / profile.gamesPlayed) * 100).toFixed(1)
    : '0.0';

  const seasonData = seasonQuery.data;
  const achievements = achievementsQuery.data ?? [];

  const tabLabels = {
    stats: ({ ru: 'Статистика', kk: 'Статистика', en: 'Stats', uk: 'Статистика', ka: 'სტატისტიკა', az: 'Statistika', uz: 'Statistika', pl: 'Statystyki' } as Record<string,string>)[locale] ?? 'Статистика',
    achievements: ({ ru: 'Достижения', kk: 'Жетістіктер', en: 'Achievements', uk: 'Досягнення', ka: 'მიღწევები', az: 'Nailiyyətlər', uz: 'Yutuqlar', pl: 'Osiągnięcia' } as Record<string,string>)[locale] ?? 'Достижения',
  };

  const rankName = seasonData?.rank
    ? (locale === 'kk' ? seasonData.rank.nameKk : locale === 'en' ? seasonData.rank.nameEn : locale === 'uk' ? (seasonData.rank as any).nameUk ?? seasonData.rank.nameRu : locale === 'ka' ? (seasonData.rank as any).nameKa ?? seasonData.rank.nameRu : locale === 'az' ? (seasonData.rank as any).nameAz ?? seasonData.rank.nameRu : locale === 'uz' ? (seasonData.rank as any).nameUz ?? seasonData.rank.nameRu : locale === 'pl' ? (seasonData.rank as any).namePl ?? seasonData.rank.nameRu : seasonData.rank.nameRu)
    : null;

  const getAchName = (a: typeof achievements[0]) =>
    locale === 'kk' ? a.nameKk : locale === 'en' ? a.nameEn : locale === 'uk' ? (a as any).nameUk ?? a.nameRu : locale === 'ka' ? (a as any).nameKa ?? a.nameRu : locale === 'az' ? (a as any).nameAz ?? a.nameRu : locale === 'uz' ? (a as any).nameUz ?? a.nameRu : locale === 'pl' ? (a as any).namePl ?? a.nameRu : a.nameRu;
  const getAchDesc = (a: typeof achievements[0]) =>
    locale === 'kk' ? a.descKk : locale === 'en' ? a.descEn : locale === 'uk' ? (a as any).descUk ?? a.descRu : locale === 'ka' ? (a as any).descKa ?? a.descRu : locale === 'az' ? (a as any).descAz ?? a.descRu : locale === 'uz' ? (a as any).descUz ?? a.descRu : locale === 'pl' ? (a as any).descPl ?? a.descRu : a.descRu;

  return (
    <div className="space-y-4 mt-3">
      <Button variant="ghost" size="sm" className="text-amber-200/70 hover:text-amber-100" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-1" /> {t('common.back')}
      </Button>

      {/* Avatar + Name */}
      <div className="bg-gradient-to-r from-amber-700/30 to-amber-600/20 border border-amber-600/30 rounded-xl p-4 text-center">
        <div className="flex justify-center mb-3">
          <PlayerAvatar avatarId={profile.avatarId} frameId={(profile as any).equippedFrame} size={64} alt="Avatar" />
        </div>
        <div className="text-amber-100 font-bold text-lg">{profile.displayName || t('profile.player')}</div>
        <div className="flex items-center justify-center gap-1 mt-1">
          <Hash className="w-3.5 h-3.5 text-amber-200/40" />
          <span className="text-amber-200/40 text-xs">{profile.gameId}</span>
          <span className={`ml-2 text-xs font-medium ${isOnline ? 'text-green-400' : 'text-gray-500'}`}>
            {isOnline ? t('profile.online') : t('profile.offline')}
          </span>
        </div>
        {/* Season rank badge */}
        {seasonData && rankName && (
          <div className="flex items-center justify-center gap-1.5 mt-2">
            <DiamondRankIcon seasonRating={seasonData.seasonRating} size={14} />
            <span className="text-xs font-medium" style={{ color: seasonData.rank.color }}>
              {rankName}
            </span>
            <span className="text-amber-200/40 text-xs">·</span>
            <span className="text-amber-200/60 text-xs">{seasonData.seasonRating} {{ ru: 'очков', kk: 'ұпай', en: 'pts', uk: 'очків', ka: 'ქულა', az: 'xal', uz: 'ball', pl: 'pkt' }[locale as string]}</span>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-lg overflow-hidden border border-amber-700/30">
        {(['stats', 'achievements'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-2 text-xs font-medium transition-colors ${
              activeTab === tab
                ? 'bg-amber-700/40 text-amber-100'
                : 'bg-[#1a2d45]/40 text-amber-200/50 hover:text-amber-200/80'
            }`}
          >
            {tab === 'stats' ? <span className="flex items-center justify-center gap-1"><TrendingUp className="w-3 h-3" />{tabLabels.stats}</span>
              : <span className="flex items-center justify-center gap-1"><Trophy className="w-3 h-3" />{tabLabels.achievements} {achievements.length > 0 && <span className="bg-amber-600/60 text-amber-100 rounded-full px-1 text-[10px]">{achievements.length}</span>}</span>}
          </button>
        ))}
      </div>

      {/* Tab: Stats */}
      {activeTab === 'stats' && (
        <div className="space-y-2">
          {/* Season rating card */}
          {seasonData && (
            <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3 flex items-center gap-2">
              <DiamondRankIcon seasonRating={seasonData.seasonRating} size={18} />
              <div className="flex-1">
                <div className="text-amber-200/60 text-[10px]">
                  {({ ru: 'Сезонный рейтинг', kk: 'Маусымдық рейтинг', en: 'Season rating', uk: 'Сезонний рейтинг', ka: 'სეზონური რეიტინგი', az: 'Mövsüm reytinqi', uz: 'Mavsum reytingi', pl: 'Ranking sezonowy' } as Record<string,string>)[locale] ?? 'Сезонный рейтинг'}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-bold" style={{ color: seasonData.rank.color }}>{seasonData.seasonRating}</span>
                  {rankName && <span className="text-xs text-amber-200/50">· {rankName}</span>}
                </div>
              </div>
            </div>
          )}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-amber-200/60 text-[10px]">{t('profile.rating')}</div>
                <div className="text-amber-300 font-bold">{profile.rating}</div>
              </div>
            </div>
            <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3 flex items-center gap-2">
              <Swords className="w-4 h-4 text-blue-400 shrink-0" />
              <div>
                <div className="text-amber-200/60 text-[10px]">{t('profile.gamesPlayed')}</div>
                <div className="text-amber-100 font-bold">{profile.gamesPlayed}</div>
              </div>
            </div>
            <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3 flex items-center gap-2">
              <Crown className="w-4 h-4 text-green-400 shrink-0" />
              <div>
                <div className="text-amber-200/60 text-[10px]">{t('profile.wins')}</div>
                <div className="text-green-400 font-bold">{profile.wins}</div>
              </div>
            </div>
            <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3 flex items-center gap-2">
              <Shield className="w-4 h-4 text-amber-400 shrink-0" />
              <div>
                <div className="text-amber-200/60 text-[10px]">{t('profile.winRate')}</div>
                <div className="text-amber-300 font-bold">{winRate}%</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab: Achievements */}
      {activeTab === 'achievements' && (
        <div className="space-y-2">
          {achievementsQuery.isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-amber-400" />
            </div>
          ) : achievements.length === 0 ? (
            <div className="text-center py-8 text-amber-200/30 text-sm">
              {({ ru: 'Нет выполненных достижений', kk: 'Жетістіктер жоқ', en: 'No achievements yet', uk: 'Немає досягнень', ka: 'მიღწევები არ არის', az: 'Nailiyyət yoxdur', uz: 'Yutuqlar yo\'q', pl: 'Brak osiągnięć' } as Record<string,string>)[locale] ?? 'Нет выполненных достижений'}
            </div>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
              {achievements.map(a => (
                <div
                  key={a.key}
                  className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-2.5 flex items-center gap-2.5"
                >
                  <span className="text-xl shrink-0">{a.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-amber-100 text-xs font-semibold truncate">{getAchName(a)}</div>
                    <div className="text-amber-200/50 text-[10px] truncate">{getAchDesc(a)}</div>
                  </div>
                  <Star className="w-3 h-3 text-amber-400 shrink-0" />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Invite button */}
      {inRoom && isOnline && onInviteFriend && (
        <Button
          className="w-full bg-amber-600 hover:bg-amber-500 text-white"
          onClick={() => onInviteFriend(gameId)}
        >
          <Send className="w-4 h-4 mr-2" />
          {t('profile.invite')}
        </Button>
      )}
    </div>
  );
}

// ============================================================
// Friends content (list + add + requests)
// ============================================================
function FriendsContent({
  onlineFriendIds,
  onInviteFriend,
  inRoom,
}: {
  onlineFriendIds: number[];
  onInviteFriend?: (targetGameId: number) => void;
  inRoom?: boolean;
}) {
  const [addGameId, setAddGameId] = useState('');
  const [viewingFriendGameId, setViewingFriendGameId] = useState<number | null>(null);
  const [showReferral, setShowReferral] = useState(false);
  // Track which accept requests are in-flight to prevent duplicates
  const [acceptingIds, setAcceptingIds] = useState<Set<number>>(new Set());
  // Confirm remove dialog state
  const [removeConfirm, setRemoveConfirm] = useState<{ profileId: number; name: string } | null>(null);
  const utils = trpc.useUtils();
  const { t } = useTranslation();

  const friendsQuery = trpc.friends.list.useQuery(undefined, { refetchInterval: 15_000 });
  const pendingQuery = trpc.friends.pendingRequests.useQuery(undefined, { refetchInterval: 10_000 });

  const sendRequest = trpc.friends.sendRequest.useMutation({
    onSuccess: (data) => {
      if (data.result === 'sent') {
        toast.success(t('profile.requestSent'));
        setAddGameId('');
      } else if (data.result === 'already_friends') {
        toast.info(t('profile.alreadyFriends'));
      } else if (data.result === 'already_pending') {
        toast.info(t('profile.alreadyPending'));
      } else {
        toast.error(t('profile.playerNotFound'));
      }
    },
    onError: () => toast.error(t('profile.requestError')),
  });

  const acceptRequest = trpc.friends.acceptRequest.useMutation({
    onSuccess: (_data, variables) => {
      toast.success(t('profile.requestAccepted'), { duration: 4000 });
      utils.friends.list.invalidate();
      utils.friends.pendingRequests.invalidate();
      setAcceptingIds(prev => {
        const next = new Set(prev);
        next.delete(variables.friendshipId);
        return next;
      });
    },
    onError: (_err, variables) => {
      setAcceptingIds(prev => {
        const next = new Set(prev);
        next.delete(variables.friendshipId);
        return next;
      });
    },
  });

  const rejectRequest = trpc.friends.rejectRequest.useMutation({
    onSuccess: () => {
      toast.info(t('profile.requestDeclined'));
      utils.friends.pendingRequests.invalidate();
    },
  });

  const removeFriend = trpc.friends.remove.useMutation({
    onSuccess: () => {
      toast.info(t('profile.friendRemoved'));
      utils.friends.list.invalidate();
      setRemoveConfirm(null);
    },
  });

  const handleSendRequest = () => {
    const id = parseInt(addGameId);
    if (!id || id <= 0) {
      toast.error(t('profile.invalidId'));
      return;
    }
    sendRequest.mutate({ targetGameId: id });
  };

  const handleAcceptRequest = (friendshipId: number) => {
    // Prevent duplicate submissions
    if (acceptingIds.has(friendshipId)) return;
    setAcceptingIds(prev => new Set(prev).add(friendshipId));
    acceptRequest.mutate({ friendshipId });
  };

  const friends = friendsQuery.data ?? [];
  const pending = pendingQuery.data ?? [];

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

  if (showReferral) {
    return <ReferralPanel onBack={() => setShowReferral(false)} />;
  }

  return (
    <div className="space-y-4 mt-3">
      {/* Invite friend button */}
      <button
        onClick={() => setShowReferral(true)}
        className="w-full flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-white
          bg-gradient-to-r from-red-700 to-red-500 hover:from-red-600 hover:to-red-400
          border border-red-400/40 shadow-[0_0_16px_2px_rgba(239,68,68,0.35)]
          transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]
          animate-pulse-slow relative overflow-hidden group"
        style={{ animationDuration: '2.5s' }}
      >
        {/* Shimmer */}
        <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
        <Gift className="w-5 h-5 text-red-200 shrink-0" />
        <span className="text-sm tracking-wide">{t('referral.inviteButton')}</span>
      </button>

      {/* Add friend */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3">
        <div className="text-amber-200/60 text-xs mb-2 flex items-center gap-1">
          <UserPlus className="w-3.5 h-3.5" /> {t('profile.addFriendById')}
        </div>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder={t('profile.playerIdPlaceholder')}
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
            <Clock className="w-3.5 h-3.5" /> {t('profile.incomingRequests')} ({pending.length})
          </div>
          <div className="space-y-1.5">
            {pending.map((req: (typeof pending)[number]) => {
              const isAccepting = acceptingIds.has(req.friendshipId);
              return (
                <div key={req.friendshipId} className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-lg p-2 flex items-center justify-between">
                  <div>
                    <span className="text-amber-100 text-sm font-medium">{req.senderName}</span>
                    <span className="text-amber-200/40 text-xs ml-1.5">#{req.senderGameId}</span>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      size="sm"
                      className="bg-green-700 hover:bg-green-600 text-white h-7 w-7 p-0"
                      onClick={() => handleAcceptRequest(req.friendshipId)}
                      disabled={isAccepting}
                    >
                      {isAccepting
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <Check className="w-3.5 h-3.5" />
                      }
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-700/40 text-red-300 hover:bg-red-900/30 h-7 w-7 p-0"
                      onClick={() => rejectRequest.mutate({ friendshipId: req.friendshipId })}
                      disabled={rejectRequest.isPending || isAccepting}
                    >
                      <X className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Friends list */}
      <div>
        <div className="text-amber-200/60 text-xs mb-2 flex items-center gap-1">
          <UserCheck className="w-3.5 h-3.5" /> {t('profile.friendsList')} ({friends.length})
        </div>
        {friends.length === 0 ? (
          <div className="text-center py-6 text-amber-200/30 text-sm">
            {t('profile.noFriends')}
          </div>
        ) : (
          <div className="space-y-1.5">
            {friends.map((friend: (typeof friends)[number]) => {
              const isOnline = onlineFriendIds.includes(friend.gameId);
              return (
                <div key={friend.profileId} className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-lg p-2 flex items-center justify-between">
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity flex-1 min-w-0"
                    onClick={() => setViewingFriendGameId(friend.gameId)}
                  >
                    <div className={`w-2 h-2 rounded-full shrink-0 ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
                    <div className="min-w-0">
                      <span className="text-amber-100 text-sm font-medium">{friend.displayName || t('profile.player')}</span>
                      <span className="text-amber-200/40 text-xs ml-1.5">#{friend.gameId}</span>
                    </div>
                    <Badge variant="outline" className="border-amber-700/20 text-amber-200/50 text-[10px] px-1.5 shrink-0">
                      {friend.rating}
                    </Badge>
                  </div>
                  <div className="flex gap-1 shrink-0 ml-1">
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-blue-700/40 text-blue-300 hover:bg-blue-900/30 h-7 w-7 p-0"
                      onClick={() => setViewingFriendGameId(friend.gameId)}
                      title={t('profile.viewProfile')}
                    >
                      <Eye className="w-3.5 h-3.5" />
                    </Button>
                    {inRoom && isOnline && onInviteFriend && (
                      <Button
                        size="sm"
                        className="bg-amber-600 hover:bg-amber-500 text-white h-7 px-2 text-[10px]"
                        onClick={() => onInviteFriend(friend.gameId)}
                      >
                        <Send className="w-3 h-3 mr-0.5" />
                        {t('profile.invite')}
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-700/40 text-red-300 hover:bg-red-900/30 h-7 w-7 p-0"
                      onClick={() => setRemoveConfirm({ profileId: friend.profileId, name: friend.displayName || `#${friend.gameId}` })}
                      disabled={removeFriend.isPending && removeConfirm?.profileId === friend.profileId}
                      title={t('profile.removeFriendTitle')}
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

      {/* Confirm remove friend dialog */}
      <AlertDialog open={removeConfirm !== null} onOpenChange={(open) => { if (!open) setRemoveConfirm(null); }}>
        <AlertDialogContent className="bg-[#0f2035] border-amber-700/30 text-amber-100">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-amber-100">
              {t('profile.removeFriendConfirmTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription className="text-amber-200/70">
              {removeConfirm
                ? t('profile.removeFriendConfirmText').replace('{name}', removeConfirm.name)
                : ''}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-transparent border-amber-700/30 text-amber-200 hover:bg-amber-900/30 hover:text-amber-100"
              onClick={() => setRemoveConfirm(null)}
            >
              {t('profile.removeFriendCancel')}
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-red-700 hover:bg-red-600 text-white border-0"
              onClick={() => {
                if (removeConfirm) {
                  removeFriend.mutate({ friendProfileId: removeConfirm.profileId });
                }
              }}
              disabled={removeFriend.isPending}
            >
              {removeFriend.isPending
                ? <Loader2 className="w-4 h-4 animate-spin mr-1" />
                : null}
              {t('profile.removeFriendConfirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

// ============================================================
// FriendsDrawer — main export
// ============================================================
interface FriendsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onlineFriendIds: number[];
  onInviteFriend?: (targetGameId: number) => void;
  inRoom?: boolean;
}

export default function FriendsDrawer({
  open,
  onOpenChange,
  onlineFriendIds,
  onInviteFriend,
  inRoom,
}: FriendsDrawerProps) {
  const { t } = useTranslation();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="bg-[#0f2035] border-amber-700/30 text-amber-100 w-full sm:w-[calc(100vw-2rem)] sm:max-w-[400px] p-0 overflow-hidden flex flex-col"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <SheetHeader className="px-4 pt-4 pb-2 shrink-0">
          <SheetTitle className="text-amber-100 flex items-center gap-2">
            <Users className="w-5 h-5 text-amber-400" />
            {t('profile.friends')}
          </SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-4 pb-4">
          <FriendsContent
            onlineFriendIds={onlineFriendIds}
            onInviteFriend={onInviteFriend}
            inRoom={inRoom}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}
