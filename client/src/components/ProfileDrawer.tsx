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
import { AvatarDisplay } from './AvatarDisplay';
import AvatarPicker from './AvatarPicker';
import { useTranslation } from '@/i18n';
import { FrameWrapper, FrameIcon } from './AvatarWithFrame';
import { AVATAR_FRAMES } from './ShopModal';
import { getCurrentSeasonNumber } from '../../../shared/seasons';

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
  /** Initial tab to open */
  initialTab?: 'profile' | 'friends' | 'leaderboard' | 'history';
  /** Controlled open state (optional) */
  open?: boolean;
  /** Controlled open change handler (optional) */
  onOpenChange?: (open: boolean) => void;
}

export default function ProfileDrawer({
  profile, onlineFriendIds, children, onInviteFriend, inRoom, initialTab, open: controlledOpen, onOpenChange: controlledOnOpenChange,
}: ProfileDrawerProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const { t } = useTranslation();
  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange ?? setInternalOpen;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{children}</SheetTrigger>
      <SheetContent side="right" className="bg-[#0f2035] border-amber-700/30 text-amber-100 w-[calc(100vw-2rem)] max-w-[400px] p-0 overflow-hidden">
        <SheetHeader className="px-4 pt-4 pb-2">
          <SheetTitle className="text-amber-100">{t('profile.title')}</SheetTitle>
        </SheetHeader>
        <Tabs defaultValue={initialTab === 'history' ? 'history' : 'profile'} className="flex flex-col h-[calc(100%-60px)]">
          <TabsList className="mx-2 sm:mx-4 bg-[#1a2d45] border border-amber-700/20 w-auto">
            <TabsTrigger value="profile" className="text-amber-200/70 data-[state=active]:text-amber-100 data-[state=active]:bg-amber-700/30 text-[10px] sm:text-[11px] px-2 sm:px-2.5">
              <User className="w-3.5 h-3.5 sm:mr-1" /> <span className="hidden sm:inline">{t('profile.title')}</span>
            </TabsTrigger>
            <TabsTrigger value="history" className="text-amber-200/70 data-[state=active]:text-amber-100 data-[state=active]:bg-amber-700/30 text-[10px] sm:text-[11px] px-2 sm:px-2.5">
              <History className="w-3.5 h-3.5 sm:mr-1" /> <span className="hidden sm:inline">{t('profile.history')}</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="flex-1 overflow-y-auto px-4 pb-4">
            <ProfileTab profile={profile} />
          </TabsContent>


          <TabsContent value="history" className="flex-1 overflow-y-auto px-4 pb-4">
            <MatchHistoryTab />
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
  const [showFramePicker, setShowFramePicker] = useState(false);
  const utils = trpc.useUtils();
  const { t, locale } = useTranslation();
  const { data: ownedFrames = [] } = trpc.shop.ownedFrames.useQuery();
  const { data: myProfile } = trpc.profile.me.useQuery();
  const { data: premiumStatus } = trpc.premium.status.useQuery();
  const isPremium = premiumStatus?.isPremium ?? false;
  const equippedFrame = (myProfile as any)?.equippedFrame ?? null;

  const equipFrameMutation = trpc.shop.equipFrame.useMutation({
    onSuccess: () => {
      toast.success(locale === 'kk' ? 'Жақтау жаңартылды!' : 'Рамка обновлена!');
      utils.profile.me.invalidate();
      setShowFramePicker(false);
    },
    onError: () => toast.error(t('common.error')),
  });

  const updateAvatar = trpc.profile.updateAvatar.useMutation({
    onSuccess: () => {
      toast.success(t('profile.avatarUpdated'));
      utils.profile.me.invalidate();
      setShowAvatarPicker(false);
    },
    onError: () => toast.error(t('profile.avatarError')),
  });

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  const mp = myProfile as any;
  const botGamesPlayed = mp?.botGamesPlayed ?? 0;
  const botWins = mp?.botWins ?? 0;
  const botLosses = mp?.botLosses ?? 0;

  const humanWinRate = profile.gamesPlayed > 0
    ? ((profile.wins / profile.gamesPlayed) * 100).toFixed(1)
    : '0.0';
  const botWinRate = botGamesPlayed > 0
    ? ((botWins / botGamesPlayed) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4 mt-3">
      {/* Avatar + Game ID card */}
      <div className="bg-gradient-to-r from-amber-700/30 to-amber-600/20 border border-amber-600/30 rounded-xl p-4 text-center">
        {/* Avatar */}
        <div className="flex justify-center mb-3">
          <div className="relative group">
            <div className="w-20 h-20 rounded-full overflow-hidden border-3 border-amber-500 shadow-lg shadow-amber-500/20">
              <AvatarDisplay avatarId={profile.avatarId} size={80} className="w-full h-full" />
            </div>
            <button
              onClick={() => setShowAvatarPicker(true)}
              className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-amber-600 hover:bg-amber-500 border-2 border-[#0f2035] flex items-center justify-center transition-colors shadow-md z-10"
              title={t('profile.changeAvatar')}
            >
              <Camera className="w-3.5 h-3.5 text-white" />
            </button>
          </div>
        </div>

        <div className="text-amber-200/60 text-xs mb-1">{t('profile.yourId')}</div>
        <div className="text-4xl font-bold text-amber-300 flex items-center justify-center gap-2">
          <Hash className="w-7 h-7" />
          {profile.gameId}
        </div>
        <div className="text-amber-200/50 text-xs mt-1">{t('profile.shareIdHint')}</div>
      </div>

      {/* Display name */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3">
        <div className="text-amber-200/60 text-xs mb-1">{t('profile.name')}</div>
        <div className="text-amber-100 font-medium">{profile.displayName || t('profile.player')}</div>
      </div>

      {/* Frame Selection — moved here, between name and rating */}
      {(ownedFrames.length > 0 || isPremium) && (
        <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-amber-200/60 text-xs">{locale === 'kk' ? 'Аватар жақтауы' : locale === 'en' ? 'Avatar Frame' : 'Рамка аватарки'}</div>
            <button
              onClick={() => setShowFramePicker(!showFramePicker)}
              className="text-amber-400 text-xs hover:text-amber-300 transition-colors"
            >
              {locale === 'kk' ? 'Өзгерту' : locale === 'en' ? 'Change' : 'Изменить'}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <FrameWrapper frameId={equippedFrame} size={48}>
              <div className="w-[48px] h-[48px] rounded-full overflow-hidden border-2 border-amber-500/60">
                <AvatarDisplay avatarId={profile.avatarId} size={48} className="w-full h-full" />
              </div>
            </FrameWrapper>
            <div className="text-amber-100 text-sm">
              {equippedFrame
                ? (() => { const baseId = equippedFrame?.replace(/_\d{4}Q[1-4]$/, ''); const f = AVATAR_FRAMES.find(f => f.id === equippedFrame || f.id === baseId); return (locale === 'kk' ? (f as any)?.nameKk : locale === 'en' ? (f as any)?.nameEn : f?.name) || equippedFrame; })()
                : (locale === 'kk' ? 'Жақтау жоқ' : locale === 'en' ? 'No frame' : 'Без рамки')}
            </div>
          </div>

          {showFramePicker && (
            <div className="mt-3 space-y-2 border-t border-amber-700/20 pt-3">
              <button
                onClick={() => equipFrameMutation.mutate({ frameId: null })}
                className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                  !equippedFrame ? 'bg-amber-700/30 border border-amber-500/40' : 'bg-[#0f2035]/60 hover:bg-[#0f2035]/80 border border-transparent'
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#1a2d45] border-2 border-amber-700/30 flex items-center justify-center">
                  <X className="w-5 h-5 text-amber-200/40" />
                </div>
                <span className="text-amber-200/70 text-sm">{locale === 'kk' ? 'Жақтаусыз' : locale === 'en' ? 'No frame' : 'Без рамки'}</span>
                {!equippedFrame && <Check className="w-4 h-4 text-green-400 ml-auto" />}
              </button>
              {/* Regular owned frames (excludes premiumOnly and seasonOnly) */}
              {AVATAR_FRAMES.filter(f => ownedFrames.includes(f.id) && !(f as any).premiumOnly && !(f as any).seasonOnly).map(frame => (
                <button
                  key={frame.id}
                  onClick={() => equipFrameMutation.mutate({ frameId: frame.id })}
                  className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                    equippedFrame === frame.id ? 'bg-amber-700/30 border border-amber-500/40' : 'bg-[#0f2035]/60 hover:bg-[#0f2035]/80 border border-transparent'
                  }`}
                >
                  <FrameWrapper frameId={frame.id} size={40}>
                    <div className="w-[40px] h-[40px] rounded-full overflow-hidden border-2 border-amber-500/60">
                      <div className={`w-full h-full bg-gradient-to-br ${frame.bgGradient} flex items-center justify-center`}>
                        <FrameIcon frameId={frame.id} />
                      </div>
                    </div>
                  </FrameWrapper>
                  <span className="text-amber-100 text-sm">{locale === 'kk' ? (frame as any).nameKk : locale === 'en' ? (frame as any).nameEn || frame.name : frame.name}</span>
                  {equippedFrame === frame.id && <Check className="w-4 h-4 text-green-400 ml-auto" />}
                </button>
              ))}
              {/* Premium frame — always shown, locked without premium */}
              {AVATAR_FRAMES.filter(f => (f as any).premiumOnly).map(frame => (
                isPremium ? (
                  <button
                    key={frame.id}
                    onClick={() => equipFrameMutation.mutate({ frameId: frame.id })}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      equippedFrame === frame.id ? 'bg-yellow-700/30 border border-yellow-500/40' : 'bg-[#0f2035]/60 hover:bg-[#0f2035]/80 border border-yellow-700/20'
                    }`}
                  >
                    <FrameWrapper frameId={frame.id} size={40}>
                      <div className="w-[40px] h-[40px] rounded-full overflow-hidden border-2 border-yellow-500/60">
                        <div className={`w-full h-full bg-gradient-to-br ${frame.bgGradient} flex items-center justify-center`}>
                          <FrameIcon frameId={frame.id} />
                        </div>
                      </div>
                    </FrameWrapper>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-yellow-300 text-sm font-semibold">{locale === 'kk' ? (frame as any).nameKk : locale === 'en' ? (frame as any).nameEn || frame.name : frame.name}</span>
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">PREMIUM</span>
                      </div>
                    </div>
                    {equippedFrame === frame.id && <Check className="w-4 h-4 text-yellow-400 ml-auto" />}
                  </button>
                ) : (
                  <div
                    key={frame.id}
                    className="w-full flex items-center gap-3 p-2 rounded-lg border border-yellow-700/20 opacity-60 cursor-not-allowed"
                  >
                    <FrameWrapper frameId={frame.id} size={40}>
                      <div className="w-[40px] h-[40px] rounded-full overflow-hidden border-2 border-yellow-700/40">
                        <div className={`w-full h-full bg-gradient-to-br ${frame.bgGradient} flex items-center justify-center`}>
                          <FrameIcon frameId={frame.id} />
                        </div>
                      </div>
                    </FrameWrapper>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-200/50 text-sm">{locale === 'kk' ? (frame as any).nameKk : locale === 'en' ? (frame as any).nameEn || frame.name : frame.name}</span>
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">PREMIUM</span>
                      </div>
                      <span className="text-amber-200/40 text-[10px]">{locale === 'kk' ? 'Premium қажет' : locale === 'en' ? 'Requires Premium' : 'Требуется Premium'}</span>
                    </div>
                    <Crown className="w-4 h-4 text-yellow-600/50 ml-auto" />
                  </div>
                )
              ))}
              {/* Season-only frames — only show if player owns them */}
              {AVATAR_FRAMES.filter(f => {
                if (!(f as any).seasonOnly) return false;
                // Only show if player already owns it
                return ownedFrames.some(id => id === f.id || id.replace(/_\d{4}Q[1-4]$/, '') === f.id);
              }).map(frame => {
                // Find owned ID: exact match OR season-suffixed match (e.g. 'obsidian_neon_2026Q3')
                const ownedId = ownedFrames.find(id => id === frame.id || id.replace(/_\d{4}Q[1-4]$/, '') === frame.id);
                const isOwned = !!ownedId;
                // Use the actual owned ID (with suffix) for equip, fallback to base ID
                const equipId = ownedId ?? frame.id;
                const isEquipped = equippedFrame === equipId || (equippedFrame && equippedFrame.replace(/_\d{4}Q[1-4]$/, '') === frame.id);
                // Only owned frames are shown (filter above ensures isOwned is always true here)
                return (
                  <button
                    key={frame.id}
                    onClick={() => equipFrameMutation.mutate({ frameId: equipId })}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isEquipped ? 'bg-yellow-700/30 border border-yellow-500/40' : 'bg-[#0f2035]/60 hover:bg-[#0f2035]/80 border border-yellow-600/25'
                    }`}
                  >
                    <FrameWrapper frameId={frame.id} size={40}>
                      <div className="w-[40px] h-[40px] rounded-full overflow-hidden border-2 border-yellow-500/60">
                        <div className={`w-full h-full bg-gradient-to-br ${frame.bgGradient} flex items-center justify-center`}>
                          <FrameIcon frameId={frame.id} />
                        </div>
                      </div>
                    </FrameWrapper>
                    <div className="flex-1">
                      <div className="flex items-center gap-1.5">
                        <span className="text-yellow-300 text-sm font-semibold">{locale === 'kk' ? (frame as any).nameKk : locale === 'en' ? (frame as any).nameEn || frame.name : frame.name}</span>
                        <span className="text-[9px] font-bold px-1 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">{locale === 'kk' ? 'МАУСЫМ' : locale === 'en' ? 'SEASON' : 'СЕЗОН'}</span>
                      </div>
                    </div>
                    {isEquipped && <Check className="w-4 h-4 text-yellow-400 ml-auto" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rating */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3 flex items-center gap-3">
        <TrendingUp className="w-5 h-5 text-amber-400" />
        <div>
          <div className="text-amber-200/60 text-xs">{t('profile.rating')}</div>
          <div className="text-xl font-bold text-amber-300">{profile.rating}</div>
        </div>
      </div>

      {/* Human stats section */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-blue-400" />
          <div className="text-amber-200/80 text-xs font-semibold">{t('profile.vsHumans')}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label={t('profile.gamesPlayed')} value={profile.gamesPlayed} />
          <MiniStat label={t('profile.wins')} value={profile.wins} color="text-green-400" />
          <MiniStat label={t('profile.losses')} value={profile.losses} color="text-red-400" />
          <MiniStat label={t('profile.winRate')} value={`${humanWinRate}%`} color="text-amber-300" />
        </div>
      </div>

      {/* Bot stats section */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Swords className="w-4 h-4 text-purple-400" />
          <div className="text-amber-200/80 text-xs font-semibold">{t('profile.vsBots')}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label={t('profile.botGamesPlayed')} value={botGamesPlayed} />
          <MiniStat label={t('profile.botWins')} value={botWins} color="text-green-400" />
          <MiniStat label={t('profile.botLosses')} value={botLosses} color="text-red-400" />
          <MiniStat label={t('profile.botWinRate')} value={`${botWinRate}%`} color="text-amber-300" />
        </div>
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

function MiniStat({ label, value, color }: { label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-black/20 rounded-lg px-2 py-1.5 text-center">
      <div className="text-amber-200/50 text-[10px]">{label}</div>
      <div className={`font-bold text-sm ${color || 'text-amber-100'}`}>{value}</div>
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
  const { t } = useTranslation();

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
          {t('profile.profileNotFound')}
        </div>
      </div>
    );
  }

  const friendBotGamesPlayed = (profile as any).botGamesPlayed ?? 0;
  const friendBotWins = (profile as any).botWins ?? 0;
  const friendBotLosses = (profile as any).botLosses ?? 0;

  const friendHumanWinRate = profile.gamesPlayed > 0
    ? ((profile.wins / profile.gamesPlayed) * 100).toFixed(1)
    : '0.0';
  const friendBotWinRate = friendBotGamesPlayed > 0
    ? ((friendBotWins / friendBotGamesPlayed) * 100).toFixed(1)
    : '0.0';

  return (
    <div className="space-y-4 mt-3">
      <Button variant="ghost" size="sm" className="text-amber-200/70 hover:text-amber-100" onClick={onBack}>
        <ArrowLeft className="w-4 h-4 mr-1" /> {t('profile.backToFriends')}
      </Button>

      {/* Friend's Avatar + Game ID */}
      <div className="bg-gradient-to-r from-blue-700/30 to-blue-600/20 border border-blue-600/30 rounded-xl p-4 text-center">
        {/* Avatar */}
        <div className="flex justify-center mb-2">
          <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-blue-400/50 shadow-lg">
            <AvatarDisplay avatarId={(profile as any).avatarId} size={64} className="w-full h-full" />
          </div>
        </div>
        <div className="flex items-center justify-center gap-2 mb-1">
          <div className={`w-2.5 h-2.5 rounded-full ${isOnline ? 'bg-green-400' : 'bg-gray-500'}`} />
          <span className="text-blue-200/60 text-xs">{isOnline ? t('profile.online') : t('profile.offline')}</span>
        </div>
        <div className="text-amber-100 font-medium text-lg mb-1">{profile.displayName || t('profile.player')}</div>
        <div className="text-3xl font-bold text-blue-300 flex items-center justify-center gap-2">
          <Hash className="w-6 h-6" />
          {profile.gameId}
        </div>
      </div>

      {/* Rating */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3 flex items-center gap-3">
        <TrendingUp className="w-5 h-5 text-amber-400" />
        <div>
          <div className="text-amber-200/60 text-xs">{t('profile.rating')}</div>
          <div className="text-xl font-bold text-amber-300">{profile.rating}</div>
        </div>
      </div>

      {/* Human stats */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Users className="w-4 h-4 text-blue-400" />
          <div className="text-amber-200/80 text-xs font-semibold">{t('profile.vsHumans')}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label={t('profile.gamesPlayed')} value={profile.gamesPlayed} />
          <MiniStat label={t('profile.wins')} value={profile.wins} color="text-green-400" />
          <MiniStat label={t('profile.losses')} value={profile.losses} color="text-red-400" />
          <MiniStat label={t('profile.winRate')} value={`${friendHumanWinRate}%`} color="text-amber-300" />
        </div>
      </div>

      {/* Bot stats */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3">
        <div className="flex items-center gap-2 mb-2">
          <Swords className="w-4 h-4 text-purple-400" />
          <div className="text-amber-200/80 text-xs font-semibold">{t('profile.vsBots')}</div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <MiniStat label={t('profile.botGamesPlayed')} value={friendBotGamesPlayed} />
          <MiniStat label={t('profile.botWins')} value={friendBotWins} color="text-green-400" />
          <MiniStat label={t('profile.botLosses')} value={friendBotLosses} color="text-red-400" />
          <MiniStat label={t('profile.botWinRate')} value={`${friendBotWinRate}%`} color="text-amber-300" />
        </div>
      </div>

      {/* Invite button */}
      {inRoom && isOnline && onInviteFriend && (
        <Button
          className="w-full bg-amber-600 hover:bg-amber-500 text-white"
          onClick={() => {
            onInviteFriend(profile.gameId);
            toast.success(t('profile.inviteSent').replace('{name}', profile.displayName || t('profile.player')));
          }}
        >
          <Send className="w-4 h-4 mr-2" />
          {t('profile.inviteToRoom')}
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
  const { t } = useTranslation();

  const friendsQuery = trpc.friends.list.useQuery(undefined, {
    refetchInterval: 15_000,
  });
  const pendingQuery = trpc.friends.pendingRequests.useQuery(undefined, {
    refetchInterval: 10_000,
  });

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
    onSuccess: () => {
      toast.success(t('profile.requestAccepted'));
      utils.friends.list.invalidate();
      utils.friends.pendingRequests.invalidate();
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
          <UserCheck className="w-3.5 h-3.5" /> {t('profile.friendsList')} ({friends.length})
        </div>
        {friends.length === 0 ? (
          <div className="text-center py-6 text-amber-200/30 text-sm">
            {t('profile.noFriends')}
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
                      <span className="text-amber-100 text-sm font-medium">{friend.displayName || t('profile.player')}</span>
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
                      title={t('profile.viewProfile')}
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
                        {t('profile.invite')}
                      </Button>
                    )}
                    {/* Remove friend */}
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-red-700/40 text-red-300 hover:bg-red-900/30 h-7 w-7 p-0"
                      onClick={() => removeFriend.mutate({ friendProfileId: friend.profileId })}
                      disabled={removeFriend.isPending}
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
  const { t } = useTranslation();

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
        {t('profile.noTransactions')}
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
        const currencyLabel = tx.currency === 'tenge' ? t('profile.tenge') : t('profile.shanyrak');

        const date = new Date(tx.createdAt);
        const timeStr = date.toLocaleString(undefined, {
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
                  {tx.description || t('profile.operation')}
                </span>
              </div>
              <span className={`text-xs font-bold ${amountColor} flex items-center gap-0.5`}>
                {amountPrefix}{tx.amount.toLocaleString()} {currencyIcon}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-200/30 text-[10px]">{timeStr}</span>
              {tx.balanceAfter !== null && (
                <span className="text-amber-200/40 text-[10px]">
                  {t('profile.balanceAfter')}: {tx.balanceAfter.toLocaleString()} {currencyLabel}
                </span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// Match History Tab (private - only own match history)
// ============================================================
function MatchHistoryTab() {
  const historyQuery = trpc.gameHistory.myHistory.useQuery(undefined, {
    staleTime: 10_000,
  });
  const { t } = useTranslation();

  const data = historyQuery.data ?? [];

  if (historyQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="mt-3 text-center py-8 text-amber-200/30 text-sm">
        {t('profile.noMatches') || 'No matches yet'}
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-1.5">
      {data.map((game: any) => {
        const date = new Date(game.createdAt);
        const timeStr = date.toLocaleString(undefined, {
          day: '2-digit', month: '2-digit', year: '2-digit',
          hour: '2-digit', minute: '2-digit',
        });

        const ratingColor = game.ratingDelta > 0 ? 'text-green-400' : game.ratingDelta < 0 ? 'text-red-400' : 'text-amber-300';
        const ratingPrefix = game.ratingDelta > 0 ? '+' : '';
        const placeLabel = game.place === 1
          ? t('profile.historyPlace1')
          : game.place === 2
          ? t('profile.historyPlace2')
          : game.place === 3
          ? t('profile.historyPlace3')
          : (t('profile.historyPlaceN') || '{n}-е место').replace('{n}', String(game.place));
        const isDurak = game.isLoser;
        const vsLabel = game.isBotGame ? t('profile.historyVsBot') : t('profile.historyVsHuman');
        const minLabel = t('profile.historyMin') || 'min';
        const secLabel = t('profile.historySec') || 'sec';
        const playersLabel = t('profile.historyPlayers') || 'players';

        return (
          <div key={game.id} className={`bg-[#1a2d45]/60 border rounded-lg p-2.5 ${
            isDurak ? 'border-red-700/30' : game.place === 1 ? 'border-yellow-600/30' : 'border-amber-700/20'
          }`}>
            <div className="flex items-center justify-between mb-1">
              <div className="flex items-center gap-1.5">
                {isDurak ? (
                  <Shield className="w-3.5 h-3.5 text-red-400" />
                ) : game.place === 1 ? (
                  <Crown className="w-3.5 h-3.5 text-yellow-400" />
                ) : (
                  <Trophy className="w-3.5 h-3.5 text-amber-400" />
                )}
                <span className={`text-xs font-medium ${isDurak ? 'text-red-300' : game.place === 1 ? 'text-yellow-300' : 'text-amber-100'}`}>
                  {isDurak ? t('profile.historyDurak') : placeLabel} • {game.playerCount} {playersLabel}
                </span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                  game.isBotGame ? 'bg-orange-900/40 text-orange-300 border border-orange-700/30' : 'bg-blue-900/40 text-blue-300 border border-blue-700/30'
                }`}>
                  {game.isBotGame ? '🤖' : '👤'} {vsLabel}
                </span>
              </div>
              <span className={`text-xs font-bold ${ratingColor}`}>
                {ratingPrefix}{game.ratingDelta}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-amber-200/30 text-[10px]">{timeStr}</span>
              <span className="text-amber-200/40 text-[10px]">
                {Math.floor(game.durationSeconds / 60)}{minLabel} {game.durationSeconds % 60}{secLabel}
              </span>
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
  const { t } = useTranslation();

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
                  {player.displayName || t('profile.player')}
                </span>
                <span className="text-amber-200/30 text-[10px]">#{player.gameId}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-amber-200/50 text-[10px]">{player.wins}{t('profile.wins').charAt(0)}/{player.losses}{t('profile.losses').charAt(0)}</span>
                <Badge variant="outline" className="border-amber-700/20 text-amber-300 text-xs px-1.5">
                  {player.rating}
                </Badge>
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div className="text-center py-8 text-amber-200/30 text-sm">
            {t('profile.noLeaderboard')}
          </div>
        )}
      </div>
    </div>
  );
}
