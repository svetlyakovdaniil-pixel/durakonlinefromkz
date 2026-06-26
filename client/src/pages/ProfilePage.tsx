/**
 * ProfilePage — полноэкранная страница профиля.
 * Открывается как отдельный route /profile.
 * Рендерится как обычная страница — без Sheet, без Portal.
 * Кнопка X с paddingTop: safe-area-inset-top.
 */
import { useState } from 'react';
import { useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  User, Hash, Clock, Check, X, Loader2,
  Camera, History, ArrowUpCircle, ArrowDownCircle,
  Coins, Banknote, Trophy, TrendingUp,
} from 'lucide-react';
import AvatarPicker from '@/components/AvatarPicker';
import { useTranslation } from '@/i18n';
import { localizeTransactionDescription } from '@/lib/localizeTransaction';
import { PlayerAvatar } from '@/components/PlayerAvatar';
import { AVATAR_FRAMES } from '@/components/ShopModal';
import { getCurrentSeasonNumber } from '../../../shared/seasons';

// ── ProfileTab ────────────────────────────────────────────────
function ProfileTab() {
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
      toast.success(t('profile.frameUpdated'));
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

  if (!myProfile) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  const mp = myProfile as any;
  const gamesPlayed = mp?.gamesPlayed ?? 0;
  const wins = mp?.wins ?? 0;
  const losses = mp?.losses ?? 0;
  const botGamesPlayed = mp?.botGamesPlayed ?? 0;
  const botWins = mp?.botWins ?? 0;
  const botLosses = mp?.botLosses ?? 0;
  const humanWinRate = gamesPlayed > 0 ? ((wins / gamesPlayed) * 100).toFixed(1) : '0.0';
  const botWinRate = botGamesPlayed > 0 ? ((botWins / botGamesPlayed) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-4 mt-3">
      {/* Avatar + Game ID card */}
      <div className="bg-gradient-to-r from-amber-700/30 to-amber-600/20 border border-amber-600/30 rounded-xl p-4 text-center">
        <div className="flex justify-center mb-3">
          <div className="relative group">
            <PlayerAvatar avatarId={mp?.avatarId} size={80} />
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
          {mp?.gameId}
        </div>
        <div className="text-amber-200/50 text-xs mt-1">{t('profile.shareIdHint')}</div>
      </div>

      {/* Display name */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3">
        <div className="text-amber-200/60 text-xs mb-1">{t('profile.name')}</div>
        <div className="text-amber-100 font-medium">{mp?.displayName || t('profile.player')}</div>
      </div>

      {/* Frame Selection */}
      {(ownedFrames.length > 0 || isPremium) && (
        <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-amber-200/60 text-xs">{t('profile.avatarFrameLabel')}</div>
            <button
              onClick={() => setShowFramePicker(!showFramePicker)}
              className="text-amber-400 text-xs hover:text-amber-300 transition-colors"
            >
              {t('profile.changeFrame')}
            </button>
          </div>
          <div className="flex items-center gap-3">
            <PlayerAvatar avatarId={mp?.avatarId} frameId={equippedFrame} size={48} />
            <div className="text-amber-100 text-sm">
              {equippedFrame
                ? (() => {
                    const baseId = equippedFrame?.replace(/_\d{4}Q[1-4]$/, '');
                    const f = AVATAR_FRAMES.find((f: any) => f.id === equippedFrame || f.id === baseId);
                    return (locale === 'kk' ? (f as any)?.nameKk : locale === 'en' ? (f as any)?.nameEn : locale === 'uk' ? ((f as any)?.nameUk || (f as any)?.name) : locale === 'ka' ? ((f as any)?.nameKa || (f as any)?.name) : locale === 'az' ? ((f as any)?.nameAz || (f as any)?.name) : locale === 'uz' ? ((f as any)?.nameUz || (f as any)?.name) : locale === 'pl' ? ((f as any)?.namePl || (f as any)?.name) : (f as any)?.name) || equippedFrame;
                  })()
                : t('profile.noFrame')}
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
                <div className="w-10 h-10 rounded-full bg-[#1a2d45] border border-amber-700/30 flex items-center justify-center">
                  <User className="w-5 h-5 text-amber-400/50" />
                </div>
                <span className="text-amber-100 text-sm">{t('profile.noFrame')}</span>
                {!equippedFrame && <Check className="w-4 h-4 text-amber-400 ml-auto" />}
              </button>
              {ownedFrames.map((frameId: string) => {
                const baseId = frameId?.replace(/_\d{4}Q[1-4]$/, '');
                const f = AVATAR_FRAMES.find((f: any) => f.id === frameId || f.id === baseId);
                const frameName = (locale === 'kk' ? (f as any)?.nameKk : locale === 'en' ? (f as any)?.nameEn : locale === 'uk' ? ((f as any)?.nameUk || (f as any)?.name) : (f as any)?.name) || frameId;
                const isEquipped = equippedFrame === frameId;
                return (
                  <button
                    key={frameId}
                    onClick={() => equipFrameMutation.mutate({ frameId })}
                    className={`w-full flex items-center gap-3 p-2 rounded-lg transition-colors ${
                      isEquipped ? 'bg-amber-700/30 border border-amber-500/40' : 'bg-[#0f2035]/60 hover:bg-[#0f2035]/80 border border-transparent'
                    }`}
                  >
                    <PlayerAvatar avatarId={mp?.avatarId} frameId={frameId} size={40} />
                    <span className="text-amber-100 text-sm">{frameName}</span>
                    {isEquipped && <Check className="w-4 h-4 text-amber-400 ml-auto" />}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Rating */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3">
        <div className="text-amber-200/60 text-xs mb-1 flex items-center gap-1">
          <TrendingUp className="w-3 h-3" /> {t('profile.rating')}
        </div>
        <div className="text-2xl font-bold text-amber-300">{mp?.rating ?? 0}</div>
      </div>

      {/* Human stats */}
      <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-3">
        <div className="flex items-center gap-1.5 mb-3">
          <User className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-amber-200/70 text-xs font-medium">{t('profile.humanGames')}</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-[#0f2035]/60 rounded-lg p-2 text-center">
            <div className="text-amber-200/50 text-[10px] mb-1">{t('profile.games')}</div>
            <div className="text-amber-100 font-bold text-lg">{gamesPlayed}</div>
          </div>
          <div className="bg-[#0f2035]/60 rounded-lg p-2 text-center">
            <div className="text-amber-200/50 text-[10px] mb-1">{t('profile.wins')}</div>
            <div className="text-green-400 font-bold text-lg">{wins}</div>
          </div>
          <div className="bg-[#0f2035]/60 rounded-lg p-2 text-center">
            <div className="text-amber-200/50 text-[10px] mb-1">{t('profile.losses')}</div>
            <div className="text-red-400 font-bold text-lg">{losses}</div>
          </div>
          <div className="bg-[#0f2035]/60 rounded-lg p-2 text-center">
            <div className="text-amber-200/50 text-[10px] mb-1">{t('profile.winRate')}</div>
            <div className="text-amber-300 font-bold text-lg">{humanWinRate}%</div>
          </div>
        </div>
      </div>

      {/* AvatarPicker modal */}
      {showAvatarPicker && (
        <AvatarPicker
          currentAvatarId={mp?.avatarId}
          onSelect={(avatarId: string) => updateAvatar.mutate({ avatarId })}
          onClose={() => setShowAvatarPicker(false)}
          loading={updateAvatar.isPending}
        />
      )}
    </div>
  );
}

// ── MatchHistoryTab ───────────────────────────────────────────
function MatchHistoryTab() {
  const { t } = useTranslation();
  const { data: history = [], isLoading } = trpc.gameHistory.myHistory.useQuery({ limit: 50 });

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-amber-400" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-amber-200/40">
        <History className="w-12 h-12 mb-3" />
        <p className="text-sm">{t('profile.noHistory')}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-3">
      {(history as any[]).map((match: any) => (
        <div
          key={match.id}
          className={`flex items-center gap-3 p-3 rounded-xl border ${
            match.result === 'win'
              ? 'bg-green-900/20 border-green-700/30'
              : match.result === 'loss'
              ? 'bg-red-900/20 border-red-700/30'
              : 'bg-[#1a2d45]/60 border-amber-700/20'
          }`}
        >
          <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
            match.result === 'win' ? 'bg-green-700/40' : match.result === 'loss' ? 'bg-red-700/40' : 'bg-amber-700/40'
          }`}>
            {match.result === 'win' ? (
              <ArrowUpCircle className="w-5 h-5 text-green-400" />
            ) : match.result === 'loss' ? (
              <ArrowDownCircle className="w-5 h-5 text-red-400" />
            ) : (
              <Clock className="w-5 h-5 text-amber-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-amber-100 text-sm font-medium truncate">
              {match.result === 'win' ? t('profile.win') : match.result === 'loss' ? t('profile.loss') : t('profile.draw')}
              {match.ratingChange != null && (
                <span className={`ml-2 text-xs ${match.ratingChange > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {match.ratingChange > 0 ? '+' : ''}{match.ratingChange}
                </span>
              )}
            </div>
            <div className="text-amber-200/40 text-xs">
              {match.createdAt ? new Date(match.createdAt).toLocaleDateString() : ''}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── ProfilePage ───────────────────────────────────────────────
export default function ProfilePage() {
  const [, navigate] = useLocation();
  const { t } = useTranslation();

  return (
    <div
      className="bg-[#0f2035] text-amber-100"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 50,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Header with safe-area-inset-top */}
      <div
        className="flex items-center justify-between px-4 pb-3 border-b border-amber-700/30 bg-[#0f2035] flex-shrink-0"
        style={{ paddingTop: 'calc(env(safe-area-inset-top, 0px) + 12px)' }}
      >
        <h1 className="text-lg font-semibold text-amber-100">{t('profile.title')}</h1>
        <button
          onClick={() => navigate('/')}
          className="w-8 h-8 rounded-full bg-[#1a2d45] hover:bg-[#243d5a] flex items-center justify-center transition-colors"
          aria-label="Закрыть"
        >
          <X className="w-4 h-4 text-amber-200" />
        </button>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="profile" className="flex flex-col flex-1 overflow-hidden">
        <TabsList className="mx-4 mt-3 bg-[#1a2d45] border border-amber-700/20 flex-shrink-0">
          <TabsTrigger
            value="profile"
            className="flex-1 text-amber-200/70 data-[state=active]:text-amber-100 data-[state=active]:bg-amber-700/30 text-sm"
          >
            <User className="w-4 h-4 mr-1.5" />
            {t('profile.title')}
          </TabsTrigger>
          <TabsTrigger
            value="history"
            className="flex-1 text-amber-200/70 data-[state=active]:text-amber-100 data-[state=active]:bg-amber-700/30 text-sm"
          >
            <History className="w-4 h-4 mr-1.5" />
            {t('profile.history')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="flex-1 overflow-y-auto px-4 pb-6">
          <ProfileTab />
        </TabsContent>
        <TabsContent value="history" className="flex-1 overflow-y-auto px-4 pb-6">
          <MatchHistoryTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
