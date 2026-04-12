import { useState, useMemo } from 'react';
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
import { Users, Timer, Bot, Plus, Settings, Gamepad2, Layers, RotateCcw, Lock, User, Hash, Bell, X, UserPlus, Check, Trash2, ShoppingCart, HelpCircle, BookOpen, Shield, Filter, Search, RefreshCw, ShieldAlert, Music } from 'lucide-react';
import { getAvatarUrl } from '../../../shared/avatars';
import ProfileDrawer from '@/components/ProfileDrawer';
import PasswordDialog from '@/components/PasswordDialog';
import SettingsSheet from '@/components/SettingsSheet';
import { trpc } from '@/lib/trpc';
import { formatBalance } from '../../../shared/formatBalance';
import { ShanyrakTopUpModal } from '@/components/ShanyrakTopUpModal';
import { TengeTopUpModal } from '@/components/TengeTopUpModal';
import ShopModal from '@/components/ShopModal';
import RulesModal from '@/components/RulesModal';
import { TutorialModal } from '@/components/TutorialModal';
import { useTranslation } from '@/i18n';
import { useAuth } from '@/_core/hooks/useAuth';
import { useLocation } from 'wouter';
import { FrameWrapper } from '@/components/AvatarWithFrame';
import TopPlayersMarquee from '@/components/TopPlayersMarquee';

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
  const [deckStyle, setDeckStyle] = useState<DeckStyle>('custom');
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
    return result;
  }, [rooms, searchQuery, filterPlayers, filterBet, filterBots, filterPrivate]);

  // Notifications
  const { data: unreadCount = 0 } = trpc.notifications.unreadCount.useQuery(undefined, { refetchInterval: 15000 });
  const { data: notifList = [], refetch: refetchNotifs } = trpc.notifications.list.useQuery(undefined, { enabled: notifOpen });
  const markAllRead = trpc.notifications.markAllRead.useMutation();
  const deleteNotif = trpc.notifications.delete.useMutation();
  const deleteAllNotifs = trpc.notifications.deleteAll.useMutation();

  // Shop / Owned decks & tables
  const { data: ownedDecks = [] } = trpc.shop.ownedDecks.useQuery();
  const isCustomDeckOwned = ownedDecks.includes('custom');
  const { data: ownedTables = [] } = trpc.shop.ownedTables.useQuery();
  const isDarkTableOwned = ownedTables.includes('dark_kazakh');
  const isNeonTableOwned = ownedTables.includes('neon');
  const { data: lobbyPlaylists = [] } = trpc.playlists.list.useQuery();
  const { data: lobbyOwnedPlaylistIds = [] } = trpc.playlists.owned.useQuery();
  const acceptFriend = trpc.friends.acceptRequest.useMutation();
  const rejectFriend = trpc.friends.rejectRequest.useMutation();
  const utils = trpc.useUtils();

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
      const tutorialRoom = await onCreateRoom(
        '🎓 Обучение',
        2,
        {
          withBots: true,
          botCount: 1,
          turnTimer: 60,
          deckStyle: 'classic',
          tableStyle: 'classic',
          betAmountIdx: 0,
          isTutorial: true, // Mark as tutorial room
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
    try {
      await acceptFriend.mutateAsync({ friendshipId });
      // Delete the notification after accepting
      await deleteNotif.mutateAsync({ notificationId });
      refetchNotifs();
      utils.notifications.unreadCount.invalidate();
      utils.friends.list.invalidate();
    } catch (err) {
      console.error('[Friend] Accept failed:', err);
    }
  };
  const handleRejectFriend = async (friendshipId: number, notificationId: number) => {
    try {
      await rejectFriend.mutateAsync({ friendshipId });
      // Delete the notification after rejecting
      await deleteNotif.mutateAsync({ notificationId });
      refetchNotifs();
      utils.notifications.unreadCount.invalidate();
    } catch (err) {
      console.error('[Friend] Reject failed:', err);
    }
  };

  const handleDeleteNotif = async (id: number) => {
    await deleteNotif.mutateAsync({ notificationId: id });
    refetchNotifs();
    utils.notifications.unreadCount.invalidate();
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
    };
    await onCreateRoom(roomName || `Комната ${userName}`, parseInt(maxPlayers), settings);
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

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#0a1628] via-[#0f2035] to-[#0a1628]">
      {/* Header */}
      <div className="border-b border-amber-700/20 bg-black/30 backdrop-blur-sm">
        <div className="container py-3 sm:py-5" style={{paddingBottom: '5px', marginBottom: '12px'}}>
          {/* === MOBILE LAYOUT (< sm) === */}
          <div className="sm:hidden">
            {/* Row 1: Title left + Avatar center + Right icons */}
            <div className="relative flex items-start justify-between" style={{minHeight: (profile as any)?.equippedFrame ? '120px' : '90px'}}>
              {/* Left column: Settings / Bell / Rules — spread top/center/bottom */}
              <div className="flex flex-col items-start justify-between relative z-20 self-stretch" style={{marginLeft: '-4px'}}>
                {/* Row 0: Admin (only for admins/GMs) */}
                {hasAdminAccess && (
                  <button
                    className="text-amber-500 hover:text-amber-300 transition-colors p-1 rounded"
                    onClick={() => setLocation('/admin')}
                    title={isGM ? 'GM-панель' : 'Админ-панель'}
                  >
                    <Shield className="w-5 h-5" />
                  </button>
                )}
                {/* Row 1: Settings */}
                <SettingsSheet onLogout={onLogout} currentName={userName} onNameChanged={refetchProfile}>
                  <button className="text-amber-200/50 hover:text-amber-100 transition-colors p-1 rounded">
                    <Settings className="w-5 h-5" />
                  </button>
                </SettingsSheet>
                {/* Row 2: Bell (notifications) */}
                <button
                  className="relative text-amber-200/50 hover:text-amber-100 transition-colors p-1 rounded"
                  onClick={handleOpenNotifications}
                >
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-[9px] font-bold rounded-full w-4 h-4 flex items-center justify-center">
                      {unreadCount > 9 ? '9+' : unreadCount}
                    </span>
                  )}
                </button>
                {/* Row 3: Rules + Tutorial on same line */}
                <div className="flex items-center gap-1">
                  <button
                    className="text-amber-200/50 hover:text-amber-100 transition-colors p-1 rounded"
                    onClick={() => setShowRules(true)}
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                  <button
                    className="text-amber-200/50 hover:text-amber-100 transition-colors p-1 rounded"
                    onClick={() => setShowTutorial(true)}
                    title="Обучение"
                  >
                    <BookOpen className="w-5 h-5" />
                  </button>
                </div>
              </div>
              {/* Title — shifted right toward avatar */}
              <div className="flex flex-col relative z-20" style={{marginLeft: '-20px'}}>
                <h1 className="text-base font-bold text-amber-100 leading-tight text-center" style={{marginRight: '155px'}}>
                  Дурак
                  <br/>
                  <span className={connected ? 'text-green-400' : 'text-red-400'}>{connected ? 'онлайн' : 'оффлайн'}</span>
                  <br/>
                  <span>from KZ</span>
                </h1>

              </div>
              {/* Center: Avatar + Name/ID */}
              <div
                className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-30"
                style={{
                  top: (profile as any)?.equippedFrame ? '-12px' : '8px',
                }}
              >
                <ProfileDrawer
                  profile={profile}
                  onlineFriendIds={onlineFriendIds}
                  inRoom={false}
                >
                  <button className="hover:opacity-80 transition-opacity">
                    <FrameWrapper frameId={(profile as any)?.equippedFrame} size={72}>
                      <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-amber-500/60 shadow-lg shadow-amber-900/30">
                        <img src={getAvatarUrl(profile?.avatarId)} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                    </FrameWrapper>
                  </button>
                </ProfileDrawer>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-sm text-amber-200/80 font-semibold">{userName}</span>
                  {profile && (
                    <span className="text-xs text-amber-300/60">ID {profile.gameId}</span>
                  )}
                </div>
              </div>
              {/* Right column: +Tenge / +Shanyrak / Shop — spread top/center/bottom */}
              <div className="flex flex-col items-end justify-between relative z-20 self-stretch" style={{marginRight: '-4px'}}>
                {/* Row 1: Tenge + button (aligned with Settings) */}
                <div className="flex items-center gap-0.5">
                  <span className="text-sm text-amber-300/60 font-semibold min-w-[24px] text-right">{formatBalance(profile?.balanceTenge ?? 0)}</span>
                  <div className="w-[28px] h-[28px] rounded-full overflow-hidden flex items-center justify-center">
                    <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/tenge_9aefd1b7.png" alt="Тенге" className="w-[28px] h-[28px] object-contain" />
                  </div>
                  <button
                    className="w-5 h-5 flex items-center justify-center rounded bg-amber-700/40 hover:bg-amber-600/50 text-amber-200 text-sm font-bold transition-colors leading-none"
                    onClick={() => setShowTengeTopUp(true)}
                  >
                    +
                  </button>
                </div>
                {/* Row 2: Shanyrak + button (aligned with Bell) */}
                <div className="flex items-center gap-0.5">
                  <span className="text-sm text-green-400 font-semibold min-w-[24px] text-right">{formatBalance(profile?.balanceShanyrak ?? 0)}</span>
                  <div className="flex items-center justify-center" style={{width: '28px', height: '28px'}}>
                    <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png" alt="Шаныраки" style={{width: '28px', height: '28px'}} className="object-contain" />
                  </div>
                  <button
                    className="flex items-center justify-center rounded bg-green-700/40 hover:bg-green-600/50 text-green-200 text-sm font-bold transition-colors leading-none"
                    style={{width: '20px', height: '20px'}}
                    onClick={() => setShowShanyrakTopUp(true)}
                  >
                    +
                  </button>
                </div>
                {/* Row 3: Shop (aligned with Rules) */}
                <button
                  className="text-amber-200/50 hover:text-amber-100 transition-colors p-1 rounded self-end"
                  onClick={() => setShowShop(true)} style={{marginRight: '-3px'}}
                >
                  <ShoppingCart className="w-5 h-5" />
                </button>
              </div>
            </div>

          </div>

          {/* === DESKTOP LAYOUT (≥ sm) === */}
          <div className="hidden sm:block">
            {/* Top row: title + user info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-7 h-7 text-amber-400" />
                <h1 className="text-xl font-bold text-amber-100">Дурак <span className={connected ? 'text-green-400' : 'text-red-400'}>{connected ? 'онлайн' : 'оффлайн'}</span> from KZ</h1>
              </div>
              <div className="flex items-center gap-3">
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
                  <div className="w-[51px] h-[51px] rounded-full overflow-hidden flex items-center justify-center">
                    <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/tenge_9aefd1b7.png" alt="Тенге" className="w-[51px] h-[51px] object-contain" />
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
                    <div className="h-[42px] flex items-center justify-center">
                      <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png" alt="Шаныраки" className="h-[42px] object-contain" style={{marginTop: '12px'}} />
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
                  <Badge variant="outline" className="border-amber-600/30 text-amber-300 text-sm px-2.5 py-0.5">
                    ID {profile.gameId}
                  </Badge>
                )}
                <ProfileDrawer
                  profile={profile}
                  onlineFriendIds={onlineFriendIds}
                  inRoom={false}
                >
                  <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity p-2 -m-2">
                    <FrameWrapper frameId={(profile as any)?.equippedFrame} size={40}>
                      <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500/50">
                        <img src={getAvatarUrl(profile?.avatarId)} alt="Avatar" className="w-full h-full object-cover" />
                      </div>
                    </FrameWrapper>
                  </button>
                </ProfileDrawer>
                <span className="text-base text-amber-200/70 font-medium">{userName}</span>
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
            <div className="mt-4 hidden sm:block">
              <TopPlayersMarquee onClick={() => setShowLeaderboard(true)} />
            </div>

            {/* Bottom row: Комнаты + Фильтр + Поиск + Создать */}
            <div className="mt-4 pt-3 pb-1 border-t border-amber-700/15 space-y-3">
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
                      placeholder="Поиск комнаты..."
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
                    <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png" alt="" className="w-4 h-4" />
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
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-amber-200/70 text-sm">{t('lobby.deckStyle')}</Label>
                    <Select value={deckStyle} onValueChange={(v) => {
                      if (v === 'custom' && !isCustomDeckOwned) return;
                      setDeckStyle(v as DeckStyle);
                    }}>
                      <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 sm:h-10">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                        <SelectItem value="classic" className="text-amber-100">{t('lobby.deckClassic')}</SelectItem>
                        <SelectItem
                          value="custom"
                          className={isCustomDeckOwned ? 'text-amber-100' : 'text-gray-500 opacity-50'}
                          disabled={!isCustomDeckOwned}
                        >
                          <span className="flex items-center gap-1.5">
                            {!isCustomDeckOwned && <Lock className="w-3 h-3" />}
                            {t('lobby.deckCustom')}
                          </span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label className="text-amber-200/70 text-sm">{t('lobby.tableStyle')}</Label>
                    <Select value={tableStyle} onValueChange={(v) => {
                      if (v === 'dark_kazakh' && !isDarkTableOwned) return;
                      if (v === 'neon' && !isNeonTableOwned) return;
                      setTableStyle(v as TableStyle);
                    }}>
                      <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 sm:h-10">
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
                    <Music className="w-3.5 h-3.5" /> {locale === 'kk' ? 'Плейлист' : 'Плейлист'}
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
                          {locale === 'kk' && p.nameKk ? p.nameKk : p.name}
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
                      <Label className="text-amber-200/70 text-xs mb-1 block">Игроков за столом</Label>
                      <Select value={filterPlayers} onValueChange={setFilterPlayers}>
                        <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                          <SelectItem value="any">Любое</SelectItem>
                          {[2, 3, 4, 5, 6, 7, 8].map(n => (
                            <SelectItem key={n} value={String(n)}>{n} игроков</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-amber-200/70 text-xs mb-1 block">Ставка</Label>
                      <Select value={filterBet} onValueChange={setFilterBet}>
                        <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                          <SelectItem value="any">Любая</SelectItem>
                          {BET_AMOUNTS.map((bet, idx) => (
                            <SelectItem key={idx} value={String(idx)}>{formatBalance(bet)}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-amber-200/70 text-xs mb-1 block">Боты</Label>
                      <Select value={filterBots} onValueChange={setFilterBots}>
                        <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                          <SelectItem value="any">Любые</SelectItem>
                          <SelectItem value="with">С ботами</SelectItem>
                          <SelectItem value="without">Без ботов</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-amber-200/70 text-xs mb-1 block">Доступ</Label>
                      <Select value={filterPrivate} onValueChange={setFilterPrivate}>
                        <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                          <SelectItem value="any">Любой</SelectItem>
                          <SelectItem value="public">Открытые</SelectItem>
                          <SelectItem value="private">Закрытые</SelectItem>
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
                        <X className="w-3 h-3 mr-1" /> Сбросить
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
      <div className="sm:hidden">
        <TopPlayersMarquee onClick={() => setShowLeaderboard(true)} />
      </div>

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
              <Button className="bg-amber-600 hover:bg-amber-500 text-white text-sm font-bold h-8 px-3 touch-manipulation" onClick={() => setDialogOpen(true)}>
                <Plus className="w-3.5 h-3.5 mr-0.5" />{t('lobby.createRoomShort')}
              </Button>
            </div>
          </div>
          {/* Mobile search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-amber-400/50" />
            <Input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Поиск комнаты..."
              className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-8 pl-8 pr-3 text-sm"
            />
          </div>
          {/* Mobile filter panel */}
          {showFilter && (
            <div className="bg-[#0f2035]/80 border border-amber-700/20 rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label className="text-amber-200/70 text-[10px] mb-0.5 block">Игроки</Label>
                  <Select value={filterPlayers} onValueChange={setFilterPlayers}>
                    <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                      <SelectItem value="any">Любое</SelectItem>
                      {[2, 3, 4, 5, 6, 7, 8].map(n => (
                        <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-amber-200/70 text-[10px] mb-0.5 block">Ставка</Label>
                  <Select value={filterBet} onValueChange={setFilterBet}>
                    <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                      <SelectItem value="any">Любая</SelectItem>
                      {BET_AMOUNTS.map((bet, idx) => (
                        <SelectItem key={idx} value={String(idx)}>{formatBalance(bet)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-amber-200/70 text-[10px] mb-0.5 block">Боты</Label>
                  <Select value={filterBots} onValueChange={setFilterBots}>
                    <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                      <SelectItem value="any">Любые</SelectItem>
                      <SelectItem value="with">С ботами</SelectItem>
                      <SelectItem value="without">Без ботов</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-amber-200/70 text-[10px] mb-0.5 block">Доступ</Label>
                  <Select value={filterPrivate} onValueChange={setFilterPrivate}>
                    <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-8 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                      <SelectItem value="any">Любой</SelectItem>
                      <SelectItem value="public">Открытые</SelectItem>
                      <SelectItem value="private">Закрытые</SelectItem>
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
                  <X className="w-3 h-3 mr-1" /> Сбросить фильтры
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
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredRooms.map(room => {
              const canRejoin = room.hasActiveGame && room.activeGamePlayerIds?.includes(userId);

              return (
                <div
                  key={room.id}
                  className={`bg-[#1a2d45]/60 border rounded-xl p-3 sm:p-4 hover:border-amber-500/30 transition-colors ${
                    canRejoin ? 'border-green-500/40 ring-1 ring-green-500/20' : 'border-amber-700/20'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2 sm:mb-3">
                    <div className="flex items-center gap-1.5">
                      {room.hasPassword && <Lock className="w-3.5 h-3.5 text-amber-400 shrink-0" />}
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
                      <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png" alt="" className="w-3 h-3 mr-0.5 sm:mr-1" />
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
                    className="text-amber-200/40 hover:text-red-400 transition-colors p-1"
                    title={t('lobby.deleteAll')}
                    onClick={async () => {
                      await deleteAllNotifs.mutateAsync();
                      refetchNotifs();
                      utils.notifications.unreadCount.invalidate();
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <button className="text-amber-200/50 hover:text-amber-100 p-1" onClick={() => setNotifOpen(false)}>
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
                notifList.map(n => (
                  <div key={n.id} className={`px-4 py-3 flex items-start gap-3 ${!n.isRead ? 'bg-amber-900/10' : ''}`}>
                    <div className="flex-1">
                      {n.type === 'friend_request' && (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <UserPlus className="w-4 h-4 text-amber-400 shrink-0" />
                            <span className="text-amber-100 text-sm font-medium">{t('lobby.friendRequest')}</span>
                          </div>
                          <p className="text-amber-200/60 text-xs mb-2">
                            <span className="font-semibold text-amber-200/80">{n.data?.senderName}</span> (ID {n.data?.senderGameId}) {t('lobby.friendRequestText', { name: '', id: '' }).split('(ID )')[0] ? '' : ''}{locale === 'kk' ? 'сізді достарға қосқысы келеді' : 'хочет добавить вас в друзья'}
                          </p>
                          <div className="flex gap-2">
                            <button
                              className="flex items-center gap-1 bg-green-700/60 hover:bg-green-600/60 text-green-200 text-xs px-3 py-1 rounded-md transition-colors"
                              onClick={() => n.data?.friendshipId && handleAcceptFriend(n.data.friendshipId, n.id)}
                            >
                              <Check className="w-3 h-3" /> {t('lobby.accept')}
                            </button>
                            <button
                              className="flex items-center gap-1 bg-red-900/40 hover:bg-red-800/40 text-red-300 text-xs px-3 py-1 rounded-md transition-colors"
                              onClick={() => n.data?.friendshipId && handleRejectFriend(n.data.friendshipId, n.id)}
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
                            <span className="font-semibold text-amber-200/80">{n.data?.accepterName}</span> {locale === 'kk' ? 'достық сұрауыңызды қабылдады' : 'принял(а) ваш запрос в друзья'}
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
                            {n.data?.message || t('lobby.cooldownExpiredDefault')}
                          </p>
                        </>
                      )}
                      {n.type === 'admin_announcement' && (
                        <>
                          <div className="flex items-center gap-2 mb-1">
                            <Bell className="w-4 h-4 text-blue-400 shrink-0" />
                            <span className="text-amber-100 text-sm font-medium">{n.data?.title || 'Объявление'}</span>
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
                            <span className="text-red-300 text-sm font-medium">Ваш аккаунт заблокирован</span>
                          </div>
                          <p className="text-red-200/70 text-xs">
                            Срок: {n.data?.duration || 'не указан'}
                          </p>
                          <p className="text-red-200/70 text-xs">
                            Причина: {n.data?.reason || 'не указана'}
                          </p>
                        </>
                      )}
                      <span className="text-amber-200/30 text-[10px] mt-1 block">
                        {new Date(n.createdAt).toLocaleString(locale === 'kk' ? 'kk-KZ' : 'ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <button
                      className="text-amber-200/30 hover:text-red-400 transition-colors p-1 shrink-0"
                      onClick={() => handleDeleteNotif(n.id)}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
      {/* Leaderboard ProfileDrawer triggered from marquee click */}
      <ProfileDrawer
        profile={profile}
        onlineFriendIds={onlineFriendIds}
        inRoom={false}
        initialTab="leaderboard"
        open={showLeaderboard}
        onOpenChange={setShowLeaderboard}
      >
        <span style={{ display: 'none' }} />
      </ProfileDrawer>
    </div>
  );
}
