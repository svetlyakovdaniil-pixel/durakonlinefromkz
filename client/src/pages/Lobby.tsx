import { useState, useMemo, useEffect, useRef } from 'react';
import type { Room, RoomSettings, DeckStyle } from '../../../shared/gameTypes';
import type { TableStyle } from '../../../shared/cardAssets';
import { BET_AMOUNTS } from '../../../shared/gameTypes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Users, Timer, Bot, Plus, Settings, Gamepad2, Layers, RotateCcw, Lock, User, Hash, Bell, X, UserPlus, Check, Trash2, ShoppingCart, HelpCircle, BookOpen, Shield, Filter, Search, RefreshCw, ShieldAlert, Music, UserCircle2, DoorOpen, KeyRound, PlusCircle, Play, Trophy, CalendarCheck, Flame, Medal, Home } from 'lucide-react';
import { getAvatarUrl, AVATAR_OPTIONS, getBaseAvatarId, getAvatarDisplayName } from '../../../shared/avatars';
import { SEASON_RANKS, SEASON_REWARD_DEFS, getSeasonRank, getSeasonInfo } from '../../../shared/seasons';
import PasswordDialog from '@/components/PasswordDialog';
import SettingsSheet from '@/components/SettingsSheet';
import { trpc } from '@/lib/trpc';
import { formatBalance } from '../../../shared/formatBalance';
import { ShanyrakTopUpModal } from '@/components/ShanyrakTopUpModal';
import { TengeTopUpModal } from '@/components/TengeTopUpModal';
import ShopModal, { AVATAR_FRAMES } from '@/components/ShopModal';
import RulesModal from '@/components/RulesModal';
import { TutorialModal } from '@/components/TutorialModal';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import TopPlayersMarquee from '@/components/TopPlayersMarquee';
import FriendsDrawer from '@/components/FriendsDrawer';
import LeaderboardDrawer from '@/components/LeaderboardDrawer';
import AchievementsModal from '@/components/AchievementsModal';
import DailyQuestsModal from '@/components/DailyQuestsModal';
import PremiumModal from '@/components/PremiumModal';
import SeasonPage from '@/pages/Season';
import { DiamondRankIcon } from '@/components/DiamondRankIcon';
import { toast } from 'sonner';
import { useIsLandscape } from '@/hooks/useOrientation';
import { getAssetUrl } from '@/lib/assetUrl';

interface LobbyProps {
  rooms: Room[];
  connected: boolean;
  userName: string;
  userId: string;
  onCreateRoom: (name: string, maxPlayers: number, settings: RoomSettings) => Promise<Room>;
  onJoinRoom: (roomId: string, password?: string) => Promise<boolean>;
  onLogout: () => void;
  profile: {
    gameId: number;
    displayName: string | null;
    rating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
    avatarId?: string | null;
    balanceTenge?: number;
    balanceShanyrak?: number;
  } | null;
  onlineFriendIds: number[];
  onInviteFriend: ((targetGameId: number) => void) | undefined;
  refetchProfile?: () => void;
  refreshRooms?: () => void;
}

export default function Lobby({ rooms, connected, userName, userId, onCreateRoom, onJoinRoom, onLogout, profile, onlineFriendIds, refetchProfile, refreshRooms }: LobbyProps) {
  const { t, locale } = useTranslation();
  const isLandscape = useIsLandscape();
  const { user: authUser } = useAuth();
  const [, setLocation] = useLocation();
  const isAdmin = authUser?.role === 'admin';
  const isGM = authUser?.role === 'gm';
  const hasAdminAccess = isAdmin || isGM;
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [withBots, setWithBots] = useState(false);
  const [botCount, setBotCount] = useState(3);
  const [turnTimer, setTurnTimer] = useState(30);
  const [deckStyle, setDeckStyle] = useState<DeckStyle>('custom'); // Товарищ Мырза — бесплатная по умолчанию
  const [tableStyle, setTableStyle] = useState<TableStyle>('classic');
  const [betAmountIdx, setBetAmountIdx] = useState(0); // index into BET_AMOUNTS
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [selectedPlaylistId, setSelectedPlaylistId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [rejoining, setRejoining] = useState<string | null>(null);
  const [passwordRoom, setPasswordRoom] = useState<Room | null>(null);
  const [notifOpen, setNotifOpen] = useState(false);
  const [showShanyrakTopUp, setShowShanyrakTopUp] = useState(false);
  const [showTengeTopUp, setShowTengeTopUp] = useState(false);
  const [showShop, setShowShop] = useState(false);
  const [showRules, setShowRules] = useState(false);
  const [showTutorial, setShowTutorial] = useState(false);
  const [tutorialLoading, setTutorialLoading] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [showFriends, setShowFriends] = useState(false);
  const [showAchievements, setShowAchievements] = useState(false);
  const [showDailyQuests, setShowDailyQuests] = useState(false);
  const [showPremium, setShowPremium] = useState(false);
  const [showSeason, setShowSeason] = useState(false);
  const [activeTab, setActiveTab] = useState<'lobby' | 'rooms'>('lobby');

  // Smart red dots — track which sections have been visited
  // Keys: 'season', 'shop', 'friends', 'achievements', 'dailyQuests'
  // We store the last-seen timestamp per section in localStorage.
  // A dot appears if the section has new content since last visit.
  // For static sections (season) we use a fixed "new content" date.
  // Shop dot: only shown if user has never visited (lastVisit === 0).
  const NEW_CONTENT_DATES: Record<string, number> = useMemo(() => ({
    season: new Date('2026-04-13').getTime(),
    friends: 0, // driven by onlineFriendsCount
  }), []);

  const getLastVisited = (key: string): number => {
    try { return parseInt(localStorage.getItem(`lobby_visited_${key}`) || '0', 10); } catch { return 0; }
  };
  const markVisited = (key: string) => {
    try { localStorage.setItem(`lobby_visited_${key}`, String(Date.now())); } catch {}
  };

  const [visitedKeys, setVisitedKeys] = useState<Record<string, number>>(() => ({
    season: getLastVisited('season'),
    shop: getLastVisited('shop'),
    friends: getLastVisited('friends'),
    achievements: getLastVisited('achievements'),
    dailyQuests: getLastVisited('dailyQuests'),
  }));

  const hasNewContent = (key: string): boolean => {
    const lastVisit = visitedKeys[key] ?? 0;
    if (key === 'season') {
      return lastVisit < (NEW_CONTENT_DATES[key] ?? 0);
    }
    if (key === 'shop') {
      // Show dot only if user has never visited the shop
      return lastVisit === 0;
    }
    if (key === 'friends') {
      // Show dot if there are online friends and user hasn't visited recently (within 10 min)
      return onlineFriendsCount > 0 && lastVisit < Date.now() - 10 * 60 * 1000;
    }
    return false;
  };

  const handleGridButtonClick = (key: string, action: (() => void) | null) => {
    if (action) action();
    if (key in visitedKeys) {
      markVisited(key);
      setVisitedKeys(prev => ({ ...prev, [key]: Date.now() }));
    }
  };

  // Room filter & search
  const [showFilter, setShowFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPlayers, setFilterPlayers] = useState<string>('any'); // 'any' | '2' | '3' | '4' | '5' | '6' | '7' | '8'
  const [filterBet, setFilterBet] = useState<string>('any'); // 'any' | bet amount index
  const [filterBots, setFilterBots] = useState<string>('any'); // 'any' | 'with' | 'without'
  const [filterPrivate, setFilterPrivate] = useState<string>('any'); // 'any' | 'private' | 'public'

  const hasActiveFilters = filterPlayers !== 'any' || filterBet !== 'any' || filterBots !== 'any' || filterPrivate !== 'any';

  const filteredRooms = useMemo(() => {
    let result = rooms;
    // Search by name
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(r => r.name.toLowerCase().includes(q));
    }
    // Filter by max players
    if (filterPlayers !== 'any') {
      const num = parseInt(filterPlayers);
      result = result.filter(r => r.maxPlayers === num);
    }
    // Filter by bet amount
    if (filterBet !== 'any') {
      const betIdx = parseInt(filterBet);
      const betVal = BET_AMOUNTS[betIdx];
      if (betVal !== undefined) {
        result = result.filter(r => (r.settings.betAmount || 100) === betVal);
      }
    }
    // Filter by bots
    if (filterBots === 'with') {
      result = result.filter(r => r.settings.withBots);
    } else if (filterBots === 'without') {
      result = result.filter(r => !r.settings.withBots);
    }
    // Filter by private/public
    if (filterPrivate === 'private') {
      result = result.filter(r => r.hasPassword);
    } else if (filterPrivate === 'public') {
      result = result.filter(r => !r.hasPassword);
    }
    // Sort: premium rooms first, then by creation time (newest first)
    result = [...result].sort((a, b) => {
      if (a.isPremiumHost && !b.isPremiumHost) return -1;
      if (!a.isPremiumHost && b.isPremiumHost) return 1;
      return b.createdAt - a.createdAt;
    });
    return result;
  }, [rooms, searchQuery, filterPlayers, filterBet, filterBots, filterPrivate]);

  // Notifications
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(undefined, { refetchInterval: 15000 });

  // Achievements unclaimed count
  const { data: unclaimedAchievements = 0, refetch: refetchUnclaimedAchievements } = trpc.achievements.unclaimedCount.useQuery(undefined, { refetchInterval: 30000 });

  // Daily quests unclaimed count
  const { data: unclaimedDailyQuests = 0 } = trpc.dailyQuests.unclaimedCount.useQuery(undefined, { refetchInterval: 30000 });

  // Premium status
  const { data: premiumStatus } = trpc.premium.status.useQuery(undefined, { refetchInterval: 60000 });
  const isPremium = premiumStatus?.isPremium ?? false;

  // Active test season key (null if no test active) — needed for correct rank icon
  const { data: activeTestData } = trpc.season.activeTestKey.useQuery(undefined, { refetchInterval: 10000 });
  const activeTestSeasonKey = activeTestData?.testSeasonKey ?? null;

  // Season rating for rank icon — use test season key if active
  const { data: seasonData } = trpc.season.current.useQuery(
    { seasonKey: activeTestSeasonKey ?? undefined },
    { refetchInterval: 15000 }
  );
  const mySeasonRating = seasonData?.seasonRating ?? 0;

  // Friends list — used to filter online players to only actual friends
  const { data: friendsList = [] } = trpc.friends.list.useQuery(undefined, { refetchInterval: 60000 });
  const friendGameIds = new Set(friendsList.map((f: { gameId: number }) => f.gameId));
  // Online friends count: intersection of online players and actual friends
  const onlineFriendsCount = onlineFriendIds.filter(id => friendGameIds.has(id)).length;
  const { data: notifList = [], refetch: refetchNotifs } = trpc.notifications.list.useQuery(undefined, { enabled: notifOpen });
  const markAllRead = trpc.notifications.markAllRead.useMutation();
  const deleteNotif = trpc.notifications.delete.useMutation();
  const deleteAllNotifs = trpc.notifications.deleteAll.useMutation();
  const claimSeasonReward = trpc.season.claimReward.useMutation();

  // Shop / Owned decks & tables
  const { data: ownedDecks = [] } = trpc.shop.ownedDecks.useQuery();
  // Товарищ Мырза ('custom') — бесплатная для всех
  // Батыры великой степи ('classic') — платная, нужно купить
  const isClassicDeckOwned = ownedDecks.includes('classic');
  const { data: ownedTables = [] } = trpc.shop.ownedTables.useQuery();
  const isDarkTableOwned = ownedTables.includes('dark_kazakh');
  const isNeonTableOwned = ownedTables.includes('neon');
  const isApocalypseTableOwned = ownedTables.includes('apocalypse');
  const isGalaxyTableOwned = ownedTables.includes('galaxy');
  const isSeaDepthsOwned = ownedTables.includes('sea_depths');
  const isStargazerOwned = ownedTables.includes('stargazer');
  const isBlackVelvetOwned = ownedTables.includes('black_velvet');
  const { data: lobbyPlaylists = [] } = trpc.playlists.list.useQuery();
  const { data: lobbyOwnedPlaylistIds = [] } = trpc.playlists.owned.useQuery();
  const acceptFriend = trpc.friends.acceptRequest.useMutation();
  const rejectFriend = trpc.friends.rejectRequest.useMutation();
  const [processingNotifIds, setProcessingNotifIds] = useState<Set<number>>(new Set());
  const utils = trpc.useUtils(); // used for cache invalidation

  // Auto-delete friend_accepted notifications when the panel is opened and data is loaded
  const autoDeletedRef = useRef<Set<number>>(new Set());
  useEffect(() => {
    if (!notifOpen || notifList.length === 0) return;
    const friendAcceptedNotifs = notifList.filter(
      (n: (typeof notifList)[number]) => n.type === 'friend_accepted' && !autoDeletedRef.current.has(n.id)
    );
    if (friendAcceptedNotifs.length === 0) return;
    // Mark them as processed to avoid duplicate calls
    friendAcceptedNotifs.forEach((n: (typeof notifList)[number]) => autoDeletedRef.current.add(n.id));
    // Delete them one by one in the background
    Promise.all(
      friendAcceptedNotifs.map((n: (typeof notifList)[number]) =>
        deleteNotif.mutateAsync({ notificationId: n.id }).catch(() => {})
      )
    ).then(() => {
      refetchNotifs();
      utils.notifications.unreadCount.invalidate();
    });
  }, [notifOpen, notifList]);

  const handleOpenNotifications = () => {
    setNotifOpen(!notifOpen);
    if (!notifOpen && unreadCount > 0) {
      markAllRead.mutateAsync().then(() => {
        utils.notifications.unreadCount.invalidate();
      });
    }
  };

   const handleStartTutorial = async () => {
    setTutorialLoading(true);
    try {
      // Create a tutorial room with specific name
      const tutorialRoomName = `🎓 ${t('lobby.tutorial')}`;
      const tutorialRoom = await onCreateRoom(
        tutorialRoomName,
        2,
        {
          withBots: true,
          botCount: 1,
          turnTimer: 60,
          deckStyle: 'classic',
          tableStyle: 'classic',
          betAmountIdx: 0,
          isTutorial: true, // Mark as tutorial room
          locale, // Pass locale so bot names are in the correct language
        } as any
      );
      // Join the tutorial room
      await onJoinRoom(tutorialRoom.id);
      setShowTutorial(false);
    } catch (error) {
      console.error('Failed to start tutorial:', error);
    } finally {
      setTutorialLoading(false);
    }
  };

  const handleAcceptFriend = async (friendshipId: number, notificationId: number) => {
    if (processingNotifIds.has(notificationId)) return; // Prevent double-click
    setProcessingNotifIds(prev => new Set(prev).add(notificationId));
    try {
      await acceptFriend.mutateAsync({ friendshipId });
      // Delete the notification after accepting
      await deleteNotif.mutateAsync({ notificationId });
      refetchNotifs();
      utils.notifications.unreadCount.invalidate();
      utils.friends.list.invalidate();
    } catch (err) {
      console.error('[Friend] Accept failed:', err);
    } finally {
      setProcessingNotifIds(prev => { const s = new Set(prev); s.delete(notificationId); return s; });
    }
  };
  const handleRejectFriend = async (friendshipId: number, notificationId: number) => {
    if (processingNotifIds.has(notificationId)) return; // Prevent double-click
    setProcessingNotifIds(prev => new Set(prev).add(notificationId));
    try {
      await rejectFriend.mutateAsync({ friendshipId });
      // Delete the notification after rejecting
      await deleteNotif.mutateAsync({ notificationId });
      refetchNotifs();
      utils.notifications.unreadCount.invalidate();
    } catch (err) {
      console.error('[Friend] Reject failed:', err);
    } finally {
      setProcessingNotifIds(prev => { const s = new Set(prev); s.delete(notificationId); return s; });
    }
  };

  const handleDeleteNotif = async (id: number) => {
    await deleteNotif.mutateAsync({ notificationId: id });
    refetchNotifs();
    utils.notifications.unreadCount.invalidate();
  };

  const handleDeleteAllNotifs = async (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    if (deleteAllNotifs.isPending) return;
    try {
      await deleteAllNotifs.mutateAsync();
      await refetchNotifs();
      utils.notifications.unreadCount.invalidate();
    } catch {
      toast.error(t('common.error'));
    }
  };

  const handleCloseNotifications = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setNotifOpen(false);
  };

  const handleCreate = async () => {
    setLoading(true);
    const settings: RoomSettings = {
      turnTimer,
      withBots,
      botCount: withBots ? botCount : 0,
      deckStyle,
      tableStyle,
      betAmount: BET_AMOUNTS[betAmountIdx],
      ...(isPrivate && roomPassword ? { password: roomPassword, isPrivate: true } : {}),
      playlistId: selectedPlaylistId,
      locale,
    };
    await onCreateRoom(roomName || `${t('lobby.roomPrefix')} ${userName}`, parseInt(maxPlayers), settings);
    setLoading(false);
    setDialogOpen(false);
    setRoomName('');
    setRoomPassword('');
    setIsPrivate(false);
  };

  const handleRejoin = async (roomId: string) => {
    setRejoining(roomId);
    await onJoinRoom(roomId);
    setRejoining(null);
  };

  const handleJoinRoom = async (room: Room) => {
    if (room.hasPassword) {
      setPasswordRoom(room);
    } else {
      await onJoinRoom(room.id);
    }
  };

  const handlePasswordSubmit = async (password: string): Promise<boolean> => {
    if (!passwordRoom) return false;
    const ok = await onJoinRoom(passwordRoom.id, password);
    if (ok) setPasswordRoom(null);
    return ok;
  };

  const [isQuickGameLoading, setIsQuickGameLoading] = useState(false);

  const handleQuickGame = async () => {
    // Find public rooms that are waiting (not in active game)
    const available = rooms.filter(r =>
      !r.hasPassword &&
      !r.hasActiveGame &&
      r.players.length < r.maxPlayers
    );
    if (available.length === 0) {
      toast.info(t('lobby.noRoomsAvailable') || 'Нет доступных комнат. Создайте свою!');
      return;
    }
    // Pick the room with the most players relative to max (most filled)
    const best = available.reduce((prev, curr) => {
      const prevFill = prev.players.length / prev.maxPlayers;
      const currFill = curr.players.length / curr.maxPlayers;
      return currFill > prevFill ? curr : prev;
    });
    setIsQuickGameLoading(true);
    try {
      await onJoinRoom(best.id);
    } finally {
      setIsQuickGameLoading(false);
    }
  };

  return (
    <div
      className="relative min-h-[100dvh] overflow-hidden bg-[#071321] sm:block flex flex-col"
      style={{
        backgroundImage: 'radial-gradient(circle at 12% 0%, rgba(201,168,76,0.12), transparent 28%), radial-gradient(circle at 88% 18%, rgba(46,119,164,0.13), transparent 32%), linear-gradient(145deg, #071321 0%, #0b1b2d 52%, #071321 100%)',
      }}
    >
      <div className="pointer-events-none absolute -left-32 top-24 h-72 w-72 rounded-full bg-amber-400/5 blur-3xl" />
      <div className="pointer-events-none absolute -right-40 bottom-16 h-96 w-96 rounded-full bg-cyan-400/5 blur-3xl" />
      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-[#081525]/75 shadow-[0_14px_40px_rgba(0,0,0,0.18)] backdrop-blur-xl safe-top">
        <div className="container py-3 sm:py-5" style={{ paddingBottom: isLandscape ? '5px' : '10px' }}>
          {/* === MOBILE LAYOUT (< sm) === */}
          <div className="sm:hidden">
            {/* Row 1: Title left + Avatar center + Right icons */}
            <div className="relative flex items-start justify-between" style={{ height: isLandscape ? '60px' : '210px' }}>
              {/* Left column: placeholder to maintain layout */}
              <div className="relative z-20 w-8" />
              {/* Brand block stays clear of the avatar and its decorative frame. */}
              <div className="absolute left-0 top-12 bottom-2 z-20 flex w-[120px] flex-col items-start">
                <h1 className="font-bold leading-[1.02] text-amber-50" style={{ fontSize: '1.15rem' }}>
                  {t('lobby.title').split(' ')[0]}
                  <br />
                  <span className="text-amber-400">{t('common.online').toLowerCase()}</span>
                  <br />
                  <span className="text-amber-400">from KZ</span>
                </h1>
                <span
                  className={`mt-2 h-2 w-2 rounded-full ${connected ? 'bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.9)]' : 'bg-red-400'}`}
                  title={connected ? t('common.online') : t('common.offline')}
                  aria-label={connected ? t('common.online') : t('common.offline')}
                />
                {/* Premium status animated button */}
                <button
                  onClick={() => setShowPremium(true)}
                  className="absolute bottom-6 left-0 overflow-hidden rounded-full px-2.5 py-1 text-[10px] font-bold tracking-[0.12em] cursor-pointer"
                  style={{
                    background: 'linear-gradient(90deg, #92400e 0%, #d97706 25%, #fbbf24 50%, #d97706 75%, #92400e 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'premiumShimmer 2.5s linear infinite, premiumPulse 2s ease-in-out infinite',
                    boxShadow: '0 0 8px 2px rgba(251,191,36,0.5), inset 0 1px 0 rgba(255,255,255,0.25)',
                    border: '1px solid rgba(251,191,36,0.6)',
                    color: '#fff8e1',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  <span className="relative z-10">
                    PREMIUM
                  </span>
                  {/* Shine sweep overlay */}
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.35) 50%, transparent 60%)',
                      backgroundSize: '200% 100%',
                      animation: 'premiumShine 2.5s linear infinite',
                    }}
                  />
                </button>
              </div>
              {/* Center: Avatar + Name/ID */}
              <div
                className="absolute flex -translate-x-1/2 flex-col items-center z-30"
                style={{
                  left: 'calc(50vw + 40px)',
                  top: isLandscape ? '4px' : '50%',
                  transform: isLandscape ? 'translateX(-50%)' : 'translate(-50%, -50%)',
                }}
              >
                <button className="rounded-full p-1 ring-1 ring-amber-300/20 transition-all hover:scale-105 hover:ring-amber-300/50" onClick={() => setLocation('/profile')}>
                  <PlayerAvatar avatarId={profile?.avatarId} frameId={(profile as any)?.equippedFrame} size={72} />
                </button>
                <div className="mt-2 flex max-w-[145px] items-center gap-1.5 rounded-full border border-white/10 bg-black/20 px-2.5 py-1">
                  <DiamondRankIcon seasonRating={mySeasonRating} size={14} showTooltip />
                  <span className="truncate text-xs font-semibold text-amber-100/85">{userName}</span>
                  {profile && (
                    <span className="text-[10px] text-amber-300/50">#{profile.gameId}</span>
                  )}
                </div>
              </div>
              {/* Admin button — absolute, between avatar and right column */}
              {hasAdminAccess && (
                <button
                  className="absolute z-40 text-amber-500 hover:text-amber-300 transition-colors p-1 rounded"
                   style={{ left: '8px', top: '10px' }}
                  onClick={() => setLocation('/admin')}
                  title={isGM ? 'GM-панель' : 'Админ-панель'}
                >
                  <Shield className="w-5 h-5" />
                </button>
              )}
              {/* Right column: Tenge top / Shanyrak bottom */}
               <div className="relative z-20 flex flex-col items-end gap-2 self-start pt-7">
                {/* Tenge */}
                <button
                   className="flex min-w-[42px] flex-col items-center rounded-xl border border-amber-300/10 bg-white/[0.035] px-1.5 py-1 transition-all hover:bg-white/[0.08] active:scale-95"
                  onClick={() => setShowTengeTopUp(true)}
                  title={t('lobby.topUpTenge')}
                >
                  <img src={getAssetUrl("/assets/static/tenge_9aefd1b7.png")} alt="Тенге" className="w-10 h-10 object-contain" />
                  <span className="text-xs text-amber-300/70 font-semibold leading-tight mt-0.5">{formatBalance(profile?.balanceTenge ?? 0)}</span>
                </button>
                {/* Shanyrak */}
                <button
                   className="flex min-w-[42px] flex-col items-center rounded-xl border border-emerald-300/10 bg-white/[0.035] px-1.5 py-1 transition-all hover:bg-white/[0.08] active:scale-95"
                  onClick={() => setShowShanyrakTopUp(true)}
                  title={t('lobby.topUpShanyrak')}
                >
                  <img src={getAssetUrl("/assets/static/shanyrak_96e91a49.png")} alt="Шаныраки" className="w-10 h-10 object-contain" />
                  <span className="text-xs text-green-400 font-semibold leading-tight mt-0.5">{formatBalance(profile?.balanceShanyrak ?? 0)}</span>
                </button>
              </div>
            </div>

          </div>

          {/* === DESKTOP LAYOUT (≥ sm) === */}
          <div className="hidden sm:block">
            {/* Top row: title + user info */}
            <div className="flex items-center justify-between gap-6">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl border border-amber-300/20 bg-amber-300/10 shadow-inner shadow-amber-200/10">
                  <Gamepad2 className="w-5 h-5 text-amber-300" />
                </div>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-amber-300/45">Durak online</p>
                  <h1 className="text-xl font-bold text-amber-50">{t('lobby.title').split(' ')[0]} <span className="text-amber-400">from KZ</span></h1>
                  <span className={`text-[10px] font-semibold uppercase tracking-[0.16em] ${connected ? 'text-emerald-300/80' : 'text-red-300/80'}`}>
                    {connected ? t('common.online').toLowerCase() : t('common.offline').toLowerCase()}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 lg:gap-3 flex-wrap justify-end">
                {/* Admin button (only for admins/GMs) */}
                {hasAdminAccess && (
                  <button
                    className="text-amber-500 hover:text-amber-300 transition-colors p-2 rounded"
                    onClick={() => setLocation('/admin')}
                    title={isGM ? 'GM-панель' : 'Админ-панель'}
                  >
                    <Shield className="w-5 h-5" />
                  </button>
                )}

                {/* === DESKTOP FEATURE BUTTONS === */}

                {/* Premium button (animated) */}
                <button
                  onClick={() => setShowPremium(true)}
                  className="relative overflow-hidden rounded-full px-3 py-1 text-xs font-bold tracking-wide cursor-pointer"
                  title="Premium"
                  style={{
                    background: 'linear-gradient(90deg, #92400e 0%, #d97706 25%, #fbbf24 50%, #d97706 75%, #92400e 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'premiumShimmer 2.5s linear infinite, premiumPulse 2s ease-in-out infinite',
                    boxShadow: '0 0 8px 2px rgba(251,191,36,0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
                    border: '1px solid rgba(251,191,36,0.5)',
                    color: '#fff8e1',
                    textShadow: '0 1px 2px rgba(0,0,0,0.5)',
                  }}
                >
                  <span className="relative z-10">★ PREMIUM</span>
                  <span
                    className="absolute inset-0 rounded-full"
                    style={{
                      background: 'linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.3) 50%, transparent 60%)',
                      backgroundSize: '200% 100%',
                      animation: 'premiumShine 2.5s linear infinite',
                    }}
                  />
                </button>

                {/* Daily Quests button */}
                <button
                  className="relative text-amber-200/60 hover:text-amber-100 transition-colors p-2 rounded"
                  onClick={() => setShowDailyQuests(true)}
                  title={t('lobby.dailyQuests')}
                >
                  <CalendarCheck className="w-5 h-5" />
                  {unclaimedDailyQuests > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unclaimedDailyQuests > 9 ? '9+' : unclaimedDailyQuests}
                    </span>
                  )}
                </button>

                {/* Season button */}
                <button
                  className="relative text-amber-200/60 hover:text-amber-100 transition-colors p-2 rounded"
                  onClick={() => setShowSeason(true)}
                  title={t('lobby.season')}
                >
                  <Flame className="w-5 h-5" />
                </button>

                {/* Achievements button */}
                <button
                  className="relative text-amber-200/60 hover:text-amber-100 transition-colors p-2 rounded"
                  onClick={() => setShowAchievements(true)}
                  title={t('lobby.achievements')}
                >
                  <Trophy className="w-5 h-5" />
                  {unclaimedAchievements > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-amber-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unclaimedAchievements > 9 ? '9+' : unclaimedAchievements}
                    </span>
                  )}
                </button>

                {/* Leaderboard button */}
                <button
                  className="relative text-amber-200/60 hover:text-amber-100 transition-colors p-2 rounded"
                  onClick={() => setShowLeaderboard(true)}
                  title={t('lobby.leaderboard')}
                >
                  <Medal className="w-5 h-5" />
                </button>

                {/* Friends button */}
                <button
                  className="relative text-amber-200/60 hover:text-amber-100 transition-colors p-2 rounded"
                  onClick={() => setShowFriends(true)}
                  title={t('lobby.friends')}
                >
                  <Users className="w-5 h-5" />
                  {onlineFriendsCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-green-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {onlineFriendsCount > 9 ? '9+' : onlineFriendsCount}
                    </span>
                  )}
                </button>

                {/* Divider */}
                <div className="w-px h-5 bg-amber-700/30" />

                {/* Tutorial button */}
                <button
                  className="text-amber-200/50 hover:text-amber-100 transition-colors p-2 rounded"
                  onClick={() => setShowTutorial(true)}
                  title="Обучение"
                >
                  <BookOpen className="w-5 h-5" />
                </button>
                {/* Rules button */}
                <button
                  className="text-amber-200/50 hover:text-amber-100 transition-colors p-2 rounded"
                  onClick={() => setShowRules(true)}
                  title={t('lobby.rules')}
                >
                  <HelpCircle className="w-5 h-5" />
                </button>
                {/* Currency: Tenge */}
                <div className="flex items-center gap-1">
                  <span className="text-xs text-amber-300/60 font-semibold">{formatBalance(profile?.balanceTenge ?? 0)}</span>
                  <div className="w-9 h-9 lg:w-[51px] lg:h-[51px] rounded-full overflow-hidden flex items-center justify-center">
                    <img src={getAssetUrl("/assets/static/tenge_9aefd1b7.png")} alt="Тенге" className="w-9 h-9 lg:w-[51px] lg:h-[51px] object-contain" />
                  </div>
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded bg-amber-700/40 hover:bg-amber-600/50 text-amber-200 text-lg font-bold transition-colors leading-none"
onClick={() => setShowTengeTopUp(true)}
                     title={t('lobby.topUpTenge')}
                  >
                    +
                  </button>
                </div>
                {/* Currency: Shanyrak */}
                <div className="flex items-center gap-1">
                  <div className="flex flex-col items-center">
                    <div className="h-9 lg:h-[42px] flex items-center justify-center">
                      <img src={getAssetUrl("/assets/static/shanyrak_96e91a49.png")} alt="Шаныраки" className="h-9 lg:h-[42px] object-contain" style={{marginTop: '6px'}} />
                    </div>
                    <span className="text-xs text-green-400 font-semibold -mt-1">{formatBalance(profile?.balanceShanyrak ?? 0)}</span>
                  </div>
                  <button
                    className="w-6 h-6 flex items-center justify-center rounded bg-green-700/40 hover:bg-green-600/50 text-green-200 text-lg font-bold transition-colors leading-none"
                    onClick={() => setShowShanyrakTopUp(true)}
                    title={t('lobby.topUpShanyrak')}
                  >
                    +
                  </button>
                </div>

                {profile && (
                  <Badge variant="outline" className="hidden lg:flex border-amber-600/30 text-amber-300 text-sm px-2.5 py-0.5">
                    ID {profile.gameId}
                  </Badge>
                )}
                <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity p-1 -m-1" onClick={() => setLocation('/profile')}>
                  <PlayerAvatar avatarId={profile?.avatarId} frameId={(profile as any)?.equippedFrame} size={36} />
                </button>
                <div className="hidden lg:flex items-center gap-1.5">
                  <DiamondRankIcon seasonRating={mySeasonRating} size={16} showTooltip />
                  <span className="text-base text-amber-200/70 font-medium">{userName}</span>
                </div>
                <SettingsSheet onLogout={onLogout} currentName={userName} onNameChanged={refetchProfile}>
                  <button className="text-amber-200/50 hover:text-amber-100 transition-colors p-2 rounded">
                    <Settings className="w-5 h-5" />
                  </button>
                </SettingsSheet>
                <button
                  className="relative text-amber-200/50 hover:text-amber-100 transition-colors p-2 rounded"
                  onClick={handleOpenNotifications}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                <button
                  className="text-amber-200/50 hover:text-amber-100 transition-colors p-2 rounded"
                  onClick={() => setShowShop(true)}
                  title="Магазин"
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            </div>
            {/* Top players marquee (desktop) */}
            <div className="mt-4 hidden overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025] sm:block">
              <TopPlayersMarquee onClick={() => setShowLeaderboard(true)} />
            </div>

            {/* Bottom row: Комнаты + Фильтр + Поиск + Создать */}
            <div className="mt-4 space-y-3 rounded-2xl border border-white/10 bg-black/10 px-3 pt-3 pb-1">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h2 className="text-2xl font-bold text-amber-100">{t('lobby.roomList')}</h2>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => refreshRooms?.()}
                    className="text-amber-400/70 hover:text-amber-200 hover:bg-amber-900/20 h-8 w-8 p-0"
                    title={t('lobby.refresh')}
                  >
                    <RefreshCw className="w-4 h-4" />
                  </Button>
                </div>
                <div className="flex items-center gap-2">
                  {/* Search input */}
                  <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-amber-400/50" />
                    <Input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder={t('lobby.searchPlaceholder')}
                      className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-10 pl-8 pr-3 w-48 text-sm"
                    />
                  </div>
                  {/* Filter button */}
                  <Button
                    variant="outline"
                    className={`h-10 px-3 border-amber-700/30 text-amber-200 bg-transparent hover:bg-amber-900/20 ${
                      hasActiveFilters ? 'border-amber-500 bg-amber-900/20' : ''
                    }`}
                    onClick={() => setShowFilter(!showFilter)}
                  >
                    <Filter className="w-4 h-4 mr-1.5" />
                    Фильтр
                    {hasActiveFilters && (
                      <span className="ml-1.5 w-2 h-2 rounded-full bg-amber-400 inline-block" />
                    )}
                  </Button>
                  {/* Quick Game button (desktop) */}
                  <Button
                    variant="outline"
                    className="h-10 px-4 border-amber-600/50 text-amber-200 bg-amber-900/20 hover:bg-amber-800/30 hover:text-amber-100 hover:border-amber-500"
                    onClick={handleQuickGame}
                    disabled={isQuickGameLoading}
                  >
                    <Play className="w-4 h-4 mr-2" fill="currentColor" />
                    {isQuickGameLoading ? t('lobby.joining') : t('tabBar.quickGame')}
                  </Button>

                  {/* Create room */}
                  <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-600 hover:bg-amber-500 text-white text-base h-10 px-4">
                    <Plus className="w-4 h-4 mr-2" /> {t('lobby.createRoom')}
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a2d45] border-amber-700/30 text-amber-100 max-w-[calc(100vw-2rem)] sm:max-w-lg mx-auto">
              <DialogHeader>
                <DialogTitle className="text-amber-100">{t('lobby.newRoom')}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label className="text-amber-200/70 text-sm">{t('lobby.roomName')}</Label>
                  <Input
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    placeholder={t('lobby.roomPlaceholder', { name: userName })}
                    className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 sm:h-10"
                  />
                </div>
                <div>
                  <Label className="text-amber-200/70 text-sm flex items-center gap-1.5">
                    <img src={getAssetUrl("/assets/static/shanyrak_96e91a49.png")} alt="" className="w-4 h-4" />
                    {t('lobby.bet')}: {formatBalance(BET_AMOUNTS[betAmountIdx])}
                  </Label>
                  <Slider
                    value={[betAmountIdx]}
                    onValueChange={v => setBetAmountIdx(v[0])}
                    min={0}
                    max={BET_AMOUNTS.length - 1}
                    step={1}
                    className="mt-2"
                  />
                  <div className="flex justify-between text-[10px] text-amber-200/40 mt-1">
                    <span>100</span>
                    <span>10КК</span>
                  </div>
                </div>
                <div>
                  <Label className="text-amber-200/70 text-sm">{t('lobby.maxPlayers')}</Label>
                  <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                    <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                      {[2, 3, 4, 5, 6, 7, 8].map(n => (
                        <SelectItem key={n} value={String(n)} className="text-amber-100">{t('lobby.nPlayers', { n })}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-amber-200/70 text-sm">{t('lobby.turnTimer')}: {turnTimer}{t('roomCreate.seconds')}</Label>
                  <Slider
                    value={[turnTimer]}
                    onValueChange={v => setTurnTimer(v[0])}
                    min={30}
                    max={60}
                    step={5}
                    className="mt-2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-amber-200/70 text-sm">{t('lobby.addBots')}</Label>
                  <Switch checked={withBots} onCheckedChange={setWithBots} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="min-w-0">
                    <Label className="text-amber-200/70 text-sm">{t('lobby.deckStyle')}</Label>
                    <Select value={deckStyle} onValueChange={(v) => {
                      if (v === 'classic' && !isClassicDeckOwned) return;
                      setDeckStyle(v as DeckStyle);
                    }}>
                      <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 sm:h-10 min-w-0 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                        <SelectItem value="custom" className="text-amber-100">{t('lobby.deckCustom')}</SelectItem>
                        <SelectItem
                          value="classic"
                          className={isClassicDeckOwned ? 'text-amber-100' : 'text-gray-500 opacity-50'}
                          disabled={!isClassicDeckOwned}
                        >
                          <span className="flex items-center gap-1.5">
                            {!isClassicDeckOwned && <Lock className="w-3 h-3" />}
                            {t('lobby.deckClassic')}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="min-w-0">
                    <Label className="text-amber-200/70 text-sm">{t('lobby.tableStyle')}</Label>
                    <Select value={tableStyle} onValueChange={(v) => {
                      if (v === 'dark_kazakh' && !isDarkTableOwned) return;
                      if (v === 'neon' && !isNeonTableOwned) return;
                      if (v === 'apocalypse' && !isApocalypseTableOwned) return;
      if (v === 'galaxy' && !isGalaxyTableOwned) return;
      if (v === 'sea_depths' && !isSeaDepthsOwned) return;
      if (v === 'stargazer' && !isStargazerOwned) return;
      if (v === 'black_velvet' && !isBlackVelvetOwned) return;
                      setTableStyle(v as TableStyle);
                    }}>
                      <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 sm:h-10 min-w-0 w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                        <SelectItem value="classic" className="text-amber-100">{t('lobby.tableClassic')}</SelectItem>
                        <SelectItem
                          value="dark_kazakh"
                          className={isDarkTableOwned ? 'text-amber-100' : 'text-gray-500 opacity-50'}
                          disabled={!isDarkTableOwned}
                        >
                          <span className="flex items-center gap-1.5">
                            {!isDarkTableOwned && <Lock className="w-3 h-3" />}
                            {t('lobby.tableDarkKazakh')}
                          </span>
                        </SelectItem>
                        <SelectItem
                          value="neon"
                          className={isNeonTableOwned ? 'text-amber-100' : 'text-gray-500 opacity-50'}
                          disabled={!isNeonTableOwned}
                        >
                          <span className="flex items-center gap-1.5">
                            {!isNeonTableOwned && <Lock className="w-3 h-3" />}
                            {t('lobby.tableNeon')}
                          </span>
                        </SelectItem>
                        <SelectItem
                          value="apocalypse"
                          className={isApocalypseTableOwned ? 'text-amber-100' : 'text-gray-500 opacity-50'}
                          disabled={!isApocalypseTableOwned}
                        >
                          <span className="flex items-center gap-1.5">
                            {!isApocalypseTableOwned && <Lock className="w-3 h-3" />}
                            {t('lobby.tableApocalypse')}
                          </span>
                        </SelectItem>
                        <SelectItem
                          value="galaxy"
                          className={isGalaxyTableOwned ? 'text-amber-100' : 'text-gray-500 opacity-50'}
                          disabled={!isGalaxyTableOwned}
                        >
                          <span className="flex items-center gap-1.5">
                            {!isGalaxyTableOwned && <Lock className="w-3 h-3" />}
                            {t('lobby.tableGalaxy')}
                          </span>
                        </SelectItem>
                        <SelectItem
                          value="sea_depths"
                          className={isSeaDepthsOwned ? 'text-amber-100' : 'text-gray-500 opacity-50'}
                          disabled={!isSeaDepthsOwned}
                        >
                          <span className="flex items-center gap-1.5">
                            {!isSeaDepthsOwned && <Lock className="w-3 h-3" />}
                            {t('lobby.tableSeaDepths')}
                          </span>
                        </SelectItem>
                        <SelectItem
                          value="stargazer"
                          className={isStargazerOwned ? 'text-amber-100' : 'text-gray-500 opacity-50'}
                          disabled={!isStargazerOwned}
                        >
                          <span className="flex items-center gap-1.5">
                            {!isStargazerOwned && <Lock className="w-3 h-3" />}
                            {t('lobby.tableStargazer')}
                          </span>
                        </SelectItem>
                        <SelectItem
                          value="black_velvet"
                          className={isBlackVelvetOwned ? 'text-amber-100' : 'text-gray-500 opacity-50'}
                          disabled={!isBlackVelvetOwned}
                        >
                          <span className="flex items-center gap-1.5">
                            {!isBlackVelvetOwned && <Lock className="w-3 h-3" />}
                            {t('lobby.tableBlackVelvet')}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {withBots && (
                  <div>
                    <Label className="text-amber-200/70 text-sm">{t('lobby.botCount', { n: botCount })}</Label>
                    <Slider
                      value={[botCount]}
                      onValueChange={v => setBotCount(v[0])}
                      min={1}
                      max={parseInt(maxPlayers) - 1}
                      step={1}
                      className="mt-2"
                    />
                  </div>
                )}
                {/* Playlist selector */}
                <div>
                  <Label className="text-amber-200/70 text-sm flex items-center gap-1.5">
                    <Music className="w-3.5 h-3.5" /> {t('shop.music')}
                  </Label>
                  <Select
                    value={selectedPlaylistId !== null ? String(selectedPlaylistId) : (lobbyPlaylists.filter((p: any) => lobbyOwnedPlaylistIds.includes(p.id))[0]?.id ? String(lobbyPlaylists.filter((p: any) => lobbyOwnedPlaylistIds.includes(p.id))[0].id) : '')}
                    onValueChange={(v) => setSelectedPlaylistId(parseInt(v))}
                  >
                    <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                      {lobbyPlaylists.filter((p: any) => lobbyOwnedPlaylistIds.includes(p.id)).map((p: any) => (
                        <SelectItem key={p.id} value={String(p.id)} className="text-amber-100">
                          {locale === 'kk' && p.nameKk ? p.nameKk : locale === 'en' && p.nameEn ? p.nameEn : locale === 'uk' && (p as any).nameUk ? (p as any).nameUk : locale === 'ka' && (p as any).nameKa ? (p as any).nameKa : locale === 'az' && (p as any).nameAz ? (p as any).nameAz : locale === 'uz' && (p as any).nameUz ? (p as any).nameUz : locale === 'pl' && (p as any).namePl ? (p as any).namePl : p.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {/* Private room toggle */}
                <div className="flex items-center justify-between">
                  <Label className="text-amber-200/70 text-sm flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> {t('lobby.privateRoom')}
                  </Label>
                  <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>
                {isPrivate && (
                  <div>
                    <Label className="text-amber-200/70 text-sm">{t('lobby.roomPassword')}</Label>
                    <Input
                      type="password"
                      value={roomPassword}
                      onChange={e => setRoomPassword(e.target.value)}
                      placeholder={t('lobby.enterPassword')}
                      className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 sm:h-10"
                    />
                  </div>
                )}
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white"
                  onClick={handleCreate}
                  disabled={loading || (isPrivate && !roomPassword.trim())}
                >
                  {loading ? t('lobby.creating') : t('roomCreate.create')}
                </Button>
              </div>
                </DialogContent>
              </Dialog>
                </div>
              </div>

              {/* Filter panel (collapsible) */}
              {showFilter && (
                <div className="bg-[#0f2035]/80 border border-amber-700/20 rounded-lg p-4 animate-in slide-in-from-top-2">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div>
                      <Label className="text-amber-200/70 text-xs mb-1 block">{t('lobby.filterPlayersLabel')}</Label>
                      <Select value={filterPlayers} onValueChange={setFilterPlayers}>
                        <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                          <SelectItem value="any">{t('lobby.filterAny')}</SelectItem>
                          {[2, 3, 4, 5, 6, 7, 8].map(n => (
                            <SelectItem key={n} value={String(n)}>{t('lobby.nPlayersOption').replace('{n}', String(n))}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-amber-200/70 text-xs mb-1 block">{t('lobby.filterBetLabel')}</Label>
                      <Select value={filterBet} onValueChange={setFilterBet}>
                        <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                          <SelectItem value="any">{t('lobby.filterAnyF')}</SelectItem>
                          {BET_AMOUNTS.map((bet, idx) => (
                            <SelectItem key={idx} value={String(idx)}>{formatBalance(bet)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-amber-200/70 text-xs mb-1 block">{t('lobby.filterBotsLabel')}</Label>
                      <Select value={filterBots} onValueChange={setFilterBots}>
                        <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                          <SelectItem value="any">{t('lobby.filterAny')}</SelectItem>
                          <SelectItem value="with">{t('lobby.filterWithBots')}</SelectItem>
                          <SelectItem value="without">{t('lobby.filterWithoutBots')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-amber-200/70 text-xs mb-1 block">{t('lobby.filterAccessLabel')}</Label>
                      <Select value={filterPrivate} onValueChange={setFilterPrivate}>
                        <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                          <SelectItem value="any">{t('lobby.filterAnyM')}</SelectItem>
                          <SelectItem value="public">{t('lobby.filterPublic')}</SelectItem>
                          <SelectItem value="private">{t('lobby.filterPrivate')}</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  {hasActiveFilters && (
                    <div className="mt-3 flex justify-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-7 text-xs border-amber-700/30 text-amber-300 bg-transparent hover:bg-amber-900/20"
                        onClick={() => { setFilterPlayers('any'); setFilterBet('any'); setFilterBots('any'); setFilterPrivate('any'); }}
                      >
                        <X className="w-3 h-3 mr-1" /> {t('lobby.filterReset')}
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Top players marquee */}
      <div className="relative z-20 -top-3 sm:hidden">
        <TopPlayersMarquee onClick={() => setShowLeaderboard(true)} />
      </div>

      {/* Mobile: Quick Game button + grid — visible on lobby tab only */}
      {activeTab === 'lobby' && (
           <div className="sm:hidden flex min-h-0 flex-col flex-1 overflow-hidden" style={{ paddingBottom: isLandscape ? 'calc(env(safe-area-inset-bottom, 0px) + 44px)' : 'calc(env(safe-area-inset-bottom, 0px) + 64px)' }}>
          {/* Quick Game full-width button */}
          <button
            className="mx-3 mt-3 w-[calc(100%-1.5rem)] flex flex-row items-center justify-between gap-3 rounded-2xl border border-amber-300/25 px-5 transition-all active:scale-[0.98] shrink-0"
            style={{
              background: 'linear-gradient(105deg, rgba(201,168,76,0.22) 0%, rgba(201,168,76,0.08) 58%, rgba(46,119,164,0.12) 100%)',
              boxShadow: '0 12px 30px rgba(0,0,0,0.16), inset 0 1px 0 rgba(255,255,255,0.12)',
              paddingTop: '3.5vw',
              paddingBottom: '3.5vw',
            }}
            onClick={handleQuickGame}
            disabled={isQuickGameLoading}
          >
            <span className="flex flex-col items-start">
              <span className="font-bold tracking-wide text-amber-50" style={{ fontSize: 'clamp(14px, 4.5vw, 20px)' }}>
                {isQuickGameLoading ? (t('lobby.joining') || 'Вхожу...') : t('tabBar.quickGame')}
              </span>
            </span>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-300/20 ring-1 ring-inset ring-amber-200/25">
              <Play className="ml-0.5 shrink-0" style={{ color: '#f5d77a', width: 'clamp(14px, 4vw, 20px)', height: 'clamp(14px, 4vw, 20px)' }} fill="#f5d77a" />
            </span>
          </button>

          {/* 2-column menu grid — fills remaining space */}
          <div className="grid min-h-0 grid-cols-2 flex-1 gap-2 px-3 pt-3 pb-2" style={{ gridTemplateRows: 'repeat(5, minmax(0, 1fr))' }}>
            {[
              { icon: CalendarCheck, key: 'dailyQuests', borderR: true, borderB: true, action: () => setShowDailyQuests(true) },
              { icon: Bell, key: 'notifications', borderR: false, borderB: true, action: handleOpenNotifications },
              { icon: Flame, key: 'season', borderR: true, borderB: true, action: () => setShowSeason(true) },
              { icon: ShoppingCart, key: 'shop', borderR: false, borderB: true, action: () => setShowShop(true) },
              { icon: Trophy, key: 'achievements', borderR: true, borderB: true, action: () => setShowAchievements(true) },
              { icon: Medal, key: 'leaderboard', borderR: false, borderB: true, action: () => setShowLeaderboard(true) },
              { icon: HelpCircle, key: 'rules', borderR: true, borderB: true, action: () => setShowRules(true) },
              { icon: BookOpen, key: 'tutorial', borderR: false, borderB: true, action: () => setShowTutorial(true) },
              { icon: Settings, key: 'settings', borderR: true, borderB: true, action: null },
              { icon: Users, key: 'friends', borderR: false, borderB: false, action: () => setShowFriends(true), badge: onlineFriendsCount > 0 ? onlineFriendsCount : null },
            ].map(({ icon: Icon, key, borderR, borderB, action, badge }: { icon: React.ElementType; key: string; borderR: boolean; borderB: boolean; action: (() => void) | null; badge?: number | null }) => (
              action === null ? (
                <SettingsSheet key={key} onLogout={onLogout} currentName={userName} onNameChanged={refetchProfile}>
                  <button
                    className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all hover:border-amber-300/25 hover:bg-white/[0.08] active:scale-[0.97]"
                    style={{
                      background: 'linear-gradient(180deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.02) 100%)',
                      borderRight: undefined,
                      borderBottom: undefined,
                      gap: 'clamp(2px, 1.2vw, 6px)',
                      width: '100%',
                      height: '100%',
                    }}
                  >
                    <Icon style={{ color: 'rgba(201,168,76,0.75)', width: 'clamp(22px, 7vw, 32px)', height: 'clamp(22px, 7vw, 32px)' }} />
                    <span
                      className="font-bold tracking-wide text-amber-100/80 text-center leading-tight px-1"
                      style={{ fontSize: 'clamp(12px, 3.8vw, 16px)' }}
                    >
                      {t(`lobby.${key}`)}
                    </span>
                  </button>
                </SettingsSheet>
              ) : (
              <button
                key={key}
                className="flex flex-col items-center justify-center rounded-2xl border border-white/10 bg-white/[0.045] shadow-[0_8px_20px_rgba(0,0,0,0.12)] transition-all hover:border-amber-300/25 hover:bg-white/[0.08] active:scale-[0.97]"
                style={{
                  background: 'linear-gradient(180deg, rgba(201,168,76,0.08) 0%, rgba(201,168,76,0.02) 100%)',
                  borderRight: undefined,
                  borderBottom: undefined,
                  gap: 'clamp(2px, 1.2vw, 6px)',
                }}
                onClick={() => handleGridButtonClick(key, action)}
              >
                <div className="relative">
                  <Icon style={{ color: 'rgba(201,168,76,0.75)', width: 'clamp(22px, 7vw, 32px)', height: 'clamp(22px, 7vw, 32px)' }} />
                  {/* Notifications badge */}
                  {key === 'notifications' && unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                  {/* Achievements unclaimed badge */}
                  {key === 'achievements' && unclaimedAchievements > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-amber-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {unclaimedAchievements > 9 ? '9+' : unclaimedAchievements}
                    </span>
                  )}
                  {/* Daily quests unclaimed badge */}
                  {key === 'dailyQuests' && unclaimedDailyQuests > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {unclaimedDailyQuests > 9 ? '9+' : unclaimedDailyQuests}
                    </span>
                  )}
                  {/* Smart red dot for sections with new content (tournaments, shop, friends) */}
                  {hasNewContent(key) && !(
                    (key === 'achievements' && unclaimedAchievements > 0) ||
                    (key === 'dailyQuests' && unclaimedDailyQuests > 0) ||
                    (key === 'notifications' && unreadCount > 0) ||
                    (key === 'friends' && badge != null && badge > 0)
                  ) && (
                    <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                  )}
                  {/* Friends online count badge */}
                  {key === 'friends' && badge != null && badge > 0 && (
                    <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-0.5 rounded-full bg-green-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {badge > 9 ? '9+' : badge}
                    </span>
                  )}
                </div>
                <span
                  className="font-bold tracking-wide text-amber-100/80 text-center leading-tight px-1"
                  style={{ fontSize: 'clamp(12px, 3.8vw, 16px)' }}
                >
                  {t(`lobby.${key}`)}
                </span>
              </button>
              )
            ))}
          </div>
        </div>
      )}

      {/* Mobile: Rooms tab view */}
      {activeTab === 'rooms' && (
      <>
      {/* Mobile: Комнаты + Фильтр + Поиск + Создать (below header, only on mobile) */}
      <div className="sm:hidden border-t border-amber-700/20 bg-black/20 relative z-10">
        <div className="container py-3 space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xl font-bold text-amber-100">{t('lobby.roomList')}</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => refreshRooms?.()}
                className="text-amber-400/70 hover:text-amber-200 hover:bg-amber-900/20 h-7 w-7 p-0"
                title={t('lobby.refresh')}
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </Button>
            </div>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className={`h-8 px-2 border-amber-700/30 text-amber-200 bg-transparent ${
                  hasActiveFilters ? 'border-amber-500 bg-amber-900/20' : ''
                }`}
                onClick={() => setShowFilter(!showFilter)}
              >
                <Filter className="w-3.5 h-3.5" />
                {hasActiveFilters && <span className="ml-1 w-1.5 h-1.5 rounded-full bg-amber-400 inline-block" />}
              </Button>

            </div>
          </div>
          {/* Mobile search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400/50" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={t('lobby.searchPlaceholder')}
              className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-8 pl-8 pr-3 text-sm"
            />
          </div>
          {/* Mobile filter panel */}
          {showFilter && (
            <div className="bg-[#0f2035]/80 border border-amber-700/20 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-amber-200/70 text-[10px] mb-0.5 block">{t('lobby.filterPlayersLabelShort')}</Label>
                  <Select value={filterPlayers} onValueChange={setFilterPlayers}>
                    <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                      <SelectItem value="any">{t('lobby.filterAny')}</SelectItem>
                      {[2, 3, 4, 5, 6, 7, 8].map(n => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-amber-200/70 text-[10px] mb-0.5 block">{t('lobby.filterBetLabel')}</Label>
                  <Select value={filterBet} onValueChange={setFilterBet}>
                    <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                      <SelectItem value="any">{t('lobby.filterAnyF')}</SelectItem>
                      {BET_AMOUNTS.map((bet, idx) => (
                        <SelectItem key={idx} value={String(idx)}>{formatBalance(bet)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-amber-200/70 text-[10px] mb-0.5 block">{t('lobby.filterBotsLabel')}</Label>
                  <Select value={filterBots} onValueChange={setFilterBots}>
                    <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                      <SelectItem value="any">{t('lobby.filterAny')}</SelectItem>
                      <SelectItem value="with">{t('lobby.filterWithBots')}</SelectItem>
                      <SelectItem value="without">{t('lobby.filterWithoutBots')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-amber-200/70 text-[10px] mb-0.5 block">{t('lobby.filterAccessLabel')}</Label>
                  <Select value={filterPrivate} onValueChange={setFilterPrivate}>
                    <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                      <SelectItem value="any">{t('lobby.filterAnyM')}</SelectItem>
                      <SelectItem value="public">{t('lobby.filterPublic')}</SelectItem>
                      <SelectItem value="private">{t('lobby.filterPrivate')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="outline"
                  size="sm"
                  className="h-6 text-[10px] w-full border-amber-700/30 text-amber-300 bg-transparent"
                  onClick={() => { setFilterPlayers('any'); setFilterBet('any'); setFilterBots('any'); setFilterPrivate('any'); }}
                >
                  <X className="w-3 h-3 mr-1" /> {t('lobby.filterResetAll')}
                </Button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="container py-4 sm:py-6">
        {filteredRooms.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <Gamepad2 className="w-12 h-12 sm:w-16 sm:h-16 text-amber-700/30 mx-auto mb-3 sm:mb-4" />
            {rooms.length > 0 && filteredRooms.length === 0 ? (
              <>
                <p className="text-amber-200/40 text-base sm:text-lg">Нет комнат по фильтру</p>
                <p className="text-amber-200/30 text-xs sm:text-sm mt-1">Попробуйте изменить параметры фильтра</p>
              </>
            ) : (
              <>
                <p className="text-amber-200/40 text-base sm:text-lg">{t('lobby.noRooms')}</p>
                <p className="text-amber-200/30 text-xs sm:text-sm mt-1">{t('lobby.noRoomsHint')}</p>
              </>
            )}
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3">
            {filteredRooms.map(room => {
              const canRejoin = room.hasActiveGame && room.activeGamePlayerIds?.includes(userId);

              return (
                <div
                  key={room.id}
                  className={`bg-[#1a2d45]/60 border rounded-xl p-3 sm:p-4 transition-colors ${
                    canRejoin
                      ? 'border-green-500/40 ring-1 ring-green-500/20 hover:border-green-500/60'
                      : room.isPremiumHost
                        ? 'border-yellow-500/60 ring-2 ring-yellow-400/30 hover:border-yellow-400/80 premium-room-glow'
                        : 'border-amber-700/20 hover:border-amber-500/30'
                  }`}
                  style={room.isPremiumHost ? { boxShadow: '0 0 12px 2px rgba(234,179,8,0.25), 0 0 4px 1px rgba(234,179,8,0.15)' } : undefined}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5">
                      {room.hasPassword && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
                      {room.isPremiumHost && (
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-300 border border-yellow-500/40 shrink-0 tracking-wide">★ PREMIUM</span>
                      )}
                      <h3 className="font-semibold text-amber-100 truncate text-sm sm:text-base">{room.name}</h3>
                    </div>
                    <div className="flex items-center gap-1 sm:gap-1.5 shrink-0 ml-2">
                      {room.hasActiveGame && (
                        <Badge className="bg-green-900/50 text-green-300 border-green-700/30 text-[10px] sm:text-xs animate-pulse px-1.5 sm:px-2">
                          {t('lobby.inGame')}
                        </Badge>
                      )}
                      <Badge variant="outline" className="border-amber-700/30 text-amber-200/60 text-[10px] sm:text-xs px-1.5 sm:px-2">
                        <Users className="w-3 h-3 mr-0.5 sm:mr-1" />
                        {room.players.length}/{room.maxPlayers}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 mb-2 sm:mb-3 flex-wrap">
                    <Badge variant="outline" className="border-amber-700/20 text-amber-200/50 text-[10px] sm:text-xs px-1.5 sm:px-2">
                      <Timer className="w-3 h-3 mr-0.5 sm:mr-1" /> {room.settings.turnTimer}{t('roomCreate.seconds')}
                    </Badge>
                    {room.settings.withBots && (
                      <Badge variant="outline" className="border-amber-700/20 text-amber-200/50 text-[10px] sm:text-xs px-1.5 sm:px-2">
                        <Bot className="w-3 h-3 mr-0.5 sm:mr-1" /> {room.settings.botCount} {t('lobby.nBot', { n: room.settings.botCount })}
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-amber-700/20 text-amber-200/50 text-[10px] sm:text-xs px-1.5 sm:px-2">
                      <Layers className="w-3 h-3 mr-0.5 sm:mr-1" /> {room.settings.deckStyle === 'custom' ? t('waitingRoom.deckN2') : t('waitingRoom.deckN1')}
                    </Badge>
                    <Badge variant="outline" className="border-amber-500/30 text-amber-300/70 text-[10px] sm:text-xs px-1.5 sm:px-2">
                      <img src={getAssetUrl("/assets/static/shanyrak_96e91a49.png")} alt="" className="w-3 h-3 mr-0.5 sm:mr-1" />
                      {formatBalance(room.settings.betAmount || 100)}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 mb-2 sm:mb-3 flex-wrap">
                    {room.players.map(p => (
                      <Badge key={p.id} className={`text-[10px] sm:text-xs ${p.isBot ? 'bg-purple-900/40 text-purple-300 border-purple-700/30' : p.ready ? 'bg-green-900/40 text-green-300 border-green-700/30' : 'bg-amber-900/40 text-amber-300 border-amber-700/30'}`}>
                        {p.isBot && <Bot className="w-2.5 h-2.5 mr-0.5" />}
                        <span className="truncate max-w-16 sm:max-w-none">{p.name}</span>
                      </Badge>
                    ))}
                  </div>
                  {canRejoin ? (
                    <Button
                      className="w-full bg-green-700 hover:bg-green-600 text-white text-sm h-8 sm:h-10"
                      onClick={() => handleRejoin(room.id)}
                      disabled={rejoining === room.id}
                    >
                      <RotateCcw className={`w-4 h-4 mr-1 sm:mr-2 ${rejoining === room.id ? 'animate-spin' : ''}`} />
                      {rejoining === room.id ? t('lobby.rejoining') : t('lobby.rejoin')}
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-amber-700/60 hover:bg-amber-600/60 text-amber-100 text-sm h-8 sm:h-10"
                      disabled={room.players.length >= room.maxPlayers || !!room.hasActiveGame}
                      onClick={() => handleJoinRoom(room)}
                    >
                      {room.hasActiveGame ? t('lobby.gameInProgress') : room.players.length >= room.maxPlayers ? t('lobby.full') : (
                        <span className="flex items-center gap-1">
                          {room.hasPassword && <Lock className="w-3.5 h-3.5" />}
                          {t('lobby.joinRoom')}
                        </span>
                      )}
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        )}
       </div>
      </>
      )}
      {/* Password dialog */}
      <PasswordDialog
        open={!!passwordRoom}
        onOpenChange={(open) => { if (!open) setPasswordRoom(null); }}
        roomName={passwordRoom?.name || ''}
        onSubmit={handlePasswordSubmit}
      />

      {/* Shanyrak Top-Up Modal */}
      <ShanyrakTopUpModal
        open={showShanyrakTopUp}
        onClose={() => setShowShanyrakTopUp(false)}
        currentShanyrak={profile?.balanceShanyrak ?? 0}
        currentTenge={profile?.balanceTenge ?? 0}
        onBalanceUpdated={() => refetchProfile?.()}
      />

      {/* Tenge Top-Up Modal */}
      <TengeTopUpModal
        open={showTengeTopUp}
        onClose={() => setShowTengeTopUp(false)}
        currentTenge={profile?.balanceTenge ?? 0}
      />

      {/* Shop Modal */}
      <ShopModal
        open={showShop}
        onClose={() => setShowShop(false)}
        currentTenge={profile?.balanceTenge ?? 0}
        currentShanyrak={profile?.balanceShanyrak ?? 0}
        isPremium={isPremium}
        onPurchased={() => {
          refetchProfile?.();
          utils.shop.ownedDecks.invalidate();
        }}
      />

      {/* Tutorial Modal */}
      <TutorialModal
        open={showTutorial}
        onClose={() => setShowTutorial(false)}
        onStartTutorial={handleStartTutorial}
        isLoading={tutorialLoading}
      />

      {/* Rules Modal */}
      <RulesModal
        open={showRules}
        onClose={() => setShowRules(false)}
      />

      {/* Notification Panel */}
      {notifOpen && (
        <div className="fixed inset-0 z-50" onClick={() => setNotifOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute top-14 right-2 sm:right-8 w-[320px] sm:w-[380px] max-h-[70vh] bg-gradient-to-b from-[#1a2d45] to-[#0f1923] border border-amber-700/40 rounded-xl shadow-2xl overflow-hidden"
            onClick={e => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-amber-700/20">
              <h3 className="text-amber-100 font-bold text-sm">{t('lobby.notifications')}</h3>
              <div className="flex items-center gap-1">
                {notifList.length > 0 && (
                  <button
                    type="button"
                    className="text-amber-200/40 hover:text-red-400 transition-colors p-1"
                    title={t('lobby.deleteAll')}
                    onClick={handleDeleteAllNotifs}
                    disabled={deleteAllNotifs.isPending}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button
                  type="button"
                  className="text-amber-200/50 hover:text-amber-100 p-1"
                  onClick={handleCloseNotifications}
                  aria-label={t('common.close')}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
            {/* List */}
            <div className="overflow-y-auto max-h-[calc(70vh-48px)] divide-y divide-amber-700/10">
              {notifList.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 text-amber-200/40">
                  <Bell className="w-8 h-8 mb-2 opacity-40" />
                  <span className="text-sm">{t('lobby.noNotifications')}</span>
                </div>
              ) : (
                notifList.map((n: (typeof notifList)[number]) => {
                  const isUnclaimedSeasonReward = n.type === 'season_reward' && !n.data?.claimed;
                  return (
                  <div key={n.id} className={`px-4 py-3 flex items-start gap-3 relative ${isUnclaimedSeasonReward ? 'bg-amber-900/20 border-l-2 border-red-500/60' : !n.isRead ? 'bg-amber-900/10' : ''}`}>
                    <div className="flex-1">
                      {n.type === 'friend_request' && (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <UserPlus className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="text-amber-100 text-sm font-medium">{t('lobby.friendRequest')}</span>
                          </div>
                          <p className="text-amber-200/60 text-xs mb-2">
                            <span className="font-semibold text-amber-200/80">{n.data?.senderName}</span> (ID {n.data?.senderGameId}) {t('lobby.friendWantsToAdd')}
                          </p>
                          <div className="flex gap-2">
                            <button
                              className="flex items-center gap-1 bg-green-700/60 hover:bg-green-600/60 text-green-200 text-xs px-3 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => n.data?.friendshipId && handleAcceptFriend(n.data.friendshipId, n.id)}
                              disabled={processingNotifIds.has(n.id)}
                            >
                              <Check className="w-3 h-3" /> {t('lobby.accept')}
                            </button>
                            <button
                              className="flex items-center gap-1 bg-red-900/40 hover:bg-red-800/40 text-red-300 text-xs px-3 py-1 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                              onClick={() => n.data?.friendshipId && handleRejectFriend(n.data.friendshipId, n.id)}
                              disabled={processingNotifIds.has(n.id)}
                            >
                              <X className="w-3 h-3" /> {t('lobby.decline')}
                            </button>
                          </div>
                        </>
                      )}
                      {n.type === 'friend_accepted' && (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <Check className="w-4 h-4 text-green-400 shrink-0" />
                            <span className="text-amber-100 text-sm font-medium">{t('lobby.friendAccepted')}</span>
                          </div>
                          <p className="text-amber-200/60 text-xs">
                            <span className="font-semibold text-amber-200/80">{n.data?.accepterName}</span> {t('lobby.acceptedFriendRequest')}
                          </p>
                        </>
                      )}
                      {n.type === 'balance_topup' && (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-amber-400 text-sm">₸</span>
                            <span className="text-amber-100 text-sm font-medium">{t('lobby.balanceTopUp')}</span>
                          </div>
                          <p className="text-amber-200/60 text-xs">
                            {t('lobby.balanceTopUpText', { amount: n.data?.amount || '', currency: n.data?.currency || '' })}
                          </p>
                        </>
                      )}
                      {n.type === 'cooldown_expired' && (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <Timer className="w-4 h-4 text-green-400 shrink-0" />
                            <span className="text-amber-100 text-sm font-medium">{t('lobby.cooldownExpired')}</span>
                          </div>
                          <p className="text-amber-200/60 text-xs">
                            {t('lobby.cooldownExpiredDefault')}
                          </p>
                        </>
                      )}
                      {n.type === 'admin_announcement' && (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <Bell className="w-4 h-4 text-blue-400 shrink-0" />
                            <span className="text-amber-100 text-sm font-medium">{n.data?.title || t('lobby.adminAnnouncement')}</span>
                          </div>
                          <p className="text-amber-200/60 text-xs whitespace-pre-wrap">
                            {n.data?.content || ''}
                          </p>
                        </>
                      )}
                      {n.type === 'account_banned' && (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
                            <span className="text-red-300 text-sm font-medium">
                            {t('lobby.accountBanned')}
                          </span>
                          </div>
                          <p className="text-red-200/70 text-xs">
                            {t('lobby.banDuration')}: {n.data?.duration || t('lobby.notSpecified')}
                          </p>
                          <p className="text-red-200/70 text-xs">
                            {t('lobby.banReason')}: {n.data?.reason || t('lobby.notSpecified')}
                          </p>
                        </>
                      )}
                      {n.type === 'season_reward' && (() => {
                        const seasonKey = n.data?.seasonKey as string | undefined;
                        const rankKey = n.data?.rankKey as string | undefined;
                        const rank = rankKey ? SEASON_RANKS.find(r => r.key === rankKey) : null;
                        const rewardDef = rankKey ? SEASON_REWARD_DEFS.find(r => r.rankKey === rankKey) : null;
                        const isClaimed = !!(n.data?.claimed);
                        const seasonNumber = seasonKey ? getSeasonInfo(seasonKey)?.seasonNumber : undefined;
                        const seasonLabel = seasonNumber ? ` Season ${seasonNumber}` : '';
                        // Per-season avatarId stored in notification.data (already suffixed, e.g. 'neon_paw_2026Q3')
                        const notifAvatarId = (n.data?.avatarId as string | undefined) ?? rewardDef?.avatarId;
                        const notifFrameId = (n.data?.frameId as string | undefined) ?? rewardDef?.frameId;
                        return (
                          <>
                            {/* Header */}
                            <div className="flex items-center gap-2 mb-2">
                              <Trophy className="w-4 h-4 text-amber-400 shrink-0" />
                              <span className="text-amber-100 text-sm font-semibold">
                                {t('lobby.seasonEnded')}
                              </span>
                            </div>
                            {/* Rank */}
                            {rank && (
                              <div className="mb-1.5">
                                <span className="text-amber-200/60 text-xs">
                                  {t('lobby.yourRank')}: 
                                </span>
                                <span className="text-sm font-bold" style={{ color: rank.color }}>
                                  {locale === 'kk' ? rank.nameKk : locale === 'en' ? rank.nameEn : locale === 'uk' ? (rank as any).nameUk ?? rank.nameRu : locale === 'ka' ? (rank as any).nameKa ?? rank.nameRu : locale === 'az' ? (rank as any).nameAz ?? rank.nameRu : locale === 'uz' ? (rank as any).nameUz ?? rank.nameRu : locale === 'pl' ? (rank as any).namePl ?? rank.nameRu : rank.nameRu}
                                </span>
                              </div>
                            )}
                            {/* Rating */}
                            {n.data?.seasonRating !== undefined && (
                              <div className="text-amber-200/60 text-xs mb-1.5">
                                {t('lobby.seasonRatingLabel')}: 
                                <span className="text-amber-200/90 font-mono">{n.data.seasonRating}</span>
                              </div>
                            )}
                            {/* Rewards */}
                            {rewardDef && (
                              <div className="space-y-1 mb-2.5 rounded-lg p-2" style={{ background: 'rgba(234,179,8,0.07)', border: '1px solid rgba(234,179,8,0.15)' }}>
                                <div className="text-amber-300/80 text-xs font-medium mb-1">
                                  {t('lobby.seasonRewardsLabel')}:
                                </div>
                                <div className="flex items-center gap-1.5 text-xs text-amber-100">
                                  <img src={getAssetUrl("/assets/static/shanyrak_96e91a49.png")} alt="" className="w-4 h-4 object-contain" />
                                  +{rewardDef.shanyraks.toLocaleString()} {t('lobby.shanyraksUnit')}
                                </div>
                                {rewardDef.tenge > 0 && (
                                  <div className="flex items-center gap-1.5 text-xs text-amber-100">
                                    <img src={getAssetUrl("/assets/static/tenge_9aefd1b7.png")} alt="" className="w-4 h-4 object-contain" />
                                    +{rewardDef.tenge} {t('lobby.tengeUnit')}
                                  </div>
                                )}
                                {notifAvatarId && (() => {
                                  // Use per-season avatarId from notification (already suffixed, e.g. 'neon_paw_2026Q3')
                                  const avatarName = getAvatarDisplayName(notifAvatarId, locale, seasonNumber);
                                  return (
                                    <div className="flex items-center gap-1.5 text-xs text-amber-100">
                                      <PlayerAvatar avatarId={notifAvatarId} size={16} />
                                      {t('lobby.avatarLabel')}: <span className="text-amber-300">{avatarName}</span>
                                    </div>
                                  );
                                })()}
                                {notifFrameId && (() => {
                                  const frameOpt = AVATAR_FRAMES.find(f => f.id === notifFrameId || notifFrameId?.startsWith(f.id + '_'));
                                  const frameName = frameOpt
                                    ? (locale === 'kk' ? (frameOpt as any).nameKk ?? frameOpt.name : locale === 'en' ? (frameOpt as any).nameEn ?? frameOpt.name : locale === 'uk' ? (frameOpt as any).nameUk ?? frameOpt.name : locale === 'ka' ? (frameOpt as any).nameKa ?? frameOpt.name : locale === 'az' ? (frameOpt as any).nameAz ?? frameOpt.name : locale === 'uz' ? (frameOpt as any).nameUz ?? frameOpt.name : locale === 'pl' ? (frameOpt as any).namePl ?? frameOpt.name : frameOpt.name)
                                    : notifFrameId;
                                  return (
                                    <div className="flex items-center gap-1.5 text-xs text-amber-100">
                                      <span className="text-amber-400">🛡️</span>
                                      {t('lobby.frameLabel')}: <span className="text-amber-300">{frameName}{seasonLabel}</span>
                                    </div>
                                  );
                                })()}
                              </div>
                            )}
                            {/* Claim button */}
                            {!isClaimed && seasonKey && (
                              <button
                                disabled={claimSeasonReward.isPending}
                                onClick={async () => {
                                  try {
                                    await claimSeasonReward.mutateAsync({ seasonKey });
                                    // Mark as claimed in local data
                                    if (n.data) n.data.claimed = true;
                                    await refetchNotifs();
                                    utils.notifications.unreadCount.invalidate();
                                    utils.season.unclaimedRewards.invalidate();
                                    toast.success(t('lobby.rewardsClaimed'));
                                  } catch {
                                    toast.error(t('lobby.errorClaimingRewards'));
                                  }
                                }}
                                className="w-full py-1.5 rounded-lg text-xs font-semibold transition-all"
                                style={{ background: 'linear-gradient(90deg, #b8860b, #fbbf24, #b8860b)', color: '#1a0a00' }}
                              >
                                {claimSeasonReward.isPending ? t('lobby.claimingRewards') : t('lobby.claimRewards')}
                              </button>
                            )}
                            {isClaimed && (
                              <div className="text-green-400/80 text-xs flex items-center gap-1">
                                <Check className="w-3 h-3" />
                                {t('lobby.rewardsClaimedAlready')}
                              </div>
                            )}
                          </>
                        );
                      })()}
                      <span className="text-amber-200/30 text-[10px] mt-1 block">
                        {new Date(n.createdAt).toLocaleString(locale === 'kk' ? 'kk-KZ' : locale === 'en' ? 'en-US' : locale === 'uk' ? 'uk-UA' : locale === 'ka' ? 'ka-GE' : locale === 'az' ? 'az-AZ' : locale === 'uz' ? 'uz-UZ' : locale === 'pl' ? 'pl-PL' : 'ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    {/* Hide delete button for unclaimed season rewards */}
                    {!isUnclaimedSeasonReward && (
                      <button
                        className="text-amber-200/30 hover:text-red-400 transition-colors p-1 shrink-0"
                        onClick={() => handleDeleteNotif(n.id)}
                      >
                        <X className="w-3 h-3" />
                      </button>
                    )}
                    {isUnclaimedSeasonReward && (
                      <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shrink-0 mt-1" />
                    )}
                  </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}
      {/* Leaderboard Drawer triggered from marquee click or grid button */}
      <LeaderboardDrawer
        open={showLeaderboard}
        onOpenChange={setShowLeaderboard}
        myGameId={profile?.gameId}
      />

      {/* Achievements Modal */}
      <AchievementsModal
        open={showAchievements}
        onClose={() => setShowAchievements(false)}
        onRewardClaimed={() => {
          refetchUnclaimedAchievements();
          refetchProfile?.();
        }}
      />

      {/* Daily Quests Modal */}
      <DailyQuestsModal
        open={showDailyQuests}
        onClose={() => setShowDailyQuests(false)}
        onRewardClaimed={() => {
          refetchProfile?.();
        }}
      />

      {/* Premium Modal */}
      <PremiumModal
        open={showPremium}
        onClose={() => setShowPremium(false)}
      />

      {/* Season Page */}
      <SeasonPage open={showSeason} onClose={() => setShowSeason(false)} />

      {/* Friends Drawer triggered from grid button */}
      <FriendsDrawer
        open={showFriends}
        onOpenChange={setShowFriends}
        onlineFriendIds={onlineFriendIds}
      />

      {/* ===== BOTTOM TAB BAR ===== */}
      <div
        className="fixed bottom-0 left-0 right-0 z-40 sm:hidden"
        style={{
          background: 'linear-gradient(to top, #060e1a 0%, #0a1628 85%, #0a162800 100%)',
          borderTop: '1px solid rgba(180,130,30,0.18)',
          paddingBottom: isLandscape ? '0px' : 'env(safe-area-inset-bottom, 0px)',
        }}
      >
        <div className={`flex items-center justify-between ${isLandscape ? 'px-4 pt-1 pb-1' : 'px-6 pt-2 pb-3'}`}>

          {/* Profile — left */}
          <button
            className="flex flex-col items-center justify-center gap-1 w-20 transition-all active:scale-95"
            style={{ opacity: activeTab === 'lobby' ? 1 : 0.45 }}
            onClick={() => setActiveTab('lobby')}
          >
            <Home className="w-6 h-6" style={{ color: '#c9a84c' }} />
            <span className="text-[10px] font-semibold tracking-wide" style={{ color: '#c9a84c' }}>
              {t('tabBar.profile')}
            </span>
            {activeTab === 'lobby' && (
              <span className="w-4 h-0.5 rounded-full mt-0.5" style={{ background: '#c9a84c' }} />
            )}
          </button>

          {/* Create game — center */}
          <button
            className="flex flex-col items-center justify-center gap-1 w-20 transition-all active:scale-95"
            style={{ opacity: 0.75 }}
            onClick={() => setDialogOpen(true)}
          >
            <div
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background: 'linear-gradient(135deg, #c9a84c 0%, #f0d060 50%, #a07830 100%)',
                boxShadow: '0 2px 8px rgba(201,168,76,0.4)',
              }}
            >
              <Plus className="w-4 h-4 text-[#0a1628]" strokeWidth={2.5} />
            </div>
            <span className="text-[10px] font-semibold tracking-wide" style={{ color: '#c9a84c' }}>
              {t('tabBar.create')}
            </span>
          </button>

          {/* Rooms — right */}
          <button
            className="flex flex-col items-center justify-center gap-1 w-20 transition-all active:scale-95"
            style={{ opacity: activeTab === 'rooms' ? 1 : 0.45 }}
            onClick={() => setActiveTab('rooms')}
          >
            <DoorOpen className="w-6 h-6" style={{ color: '#c9a84c' }} />
            <span className="text-[10px] font-semibold tracking-wide" style={{ color: '#c9a84c' }}>
              {t('tabBar.rooms')}
            </span>
            {activeTab === 'rooms' && (
              <span className="w-4 h-0.5 rounded-full mt-0.5" style={{ background: '#c9a84c' }} />
            )}
          </button>

        </div>
      </div>

      {/* Spacer so content doesn't hide behind tab bar on mobile (rooms tab only) */}
      {activeTab !== 'lobby' && <div className="sm:hidden" style={{ height: 'calc(64px + env(safe-area-inset-bottom, 0px))' }} />}
    </div>
  );
}
