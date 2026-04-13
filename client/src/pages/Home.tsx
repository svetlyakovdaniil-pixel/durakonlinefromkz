import { useEffect, useRef, useCallback, useState } from 'react';
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useSocket } from "@/hooks/useSocket";
import { useProfile } from "@/hooks/useProfile";
import Lobby from "./Lobby";
import WaitingRoom from "./WaitingRoom";
import GameTable from "@/components/GameTable";
import { CARD_IMAGES } from "../../../shared/cardAssets";
import { Loader2, Swords, Shield, Crown, Star, Users, Zap } from "lucide-react";
import { useMusicContext } from '@/contexts/MusicContext';
import { useSettings } from '@/contexts/SettingsContext';
import MusicChoiceDialog from "@/components/MusicChoiceDialog";
import { toast } from 'sonner';
import InviteModal from '@/components/InviteModal';
import { useTranslation } from '@/i18n';
import { trpc } from '@/lib/trpc';

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { profile, profileLoading, refetchProfile } = useProfile(isAuthenticated);
  const { t, locale } = useTranslation();

  const {
    connected, rooms, currentRoom, gameState, availableActions, error, turnTimer,
    gameOverData, prizeData, onlineFriendIds, pendingInvite, setPendingInvite, frozenInfo,
    createRoom, joinRoom, leaveRoom, leaveGame, closeRoom, toggleReady, startGame,
    playCard, transferCard, transferCards, showPassThrough, showPassThroughs, takeCards, passTurn, endAttack, skipTurn,
    returnToLobby, clearError, inviteFriend, declineInvite, registerProfile, sendChat,
    requestRoomList,
  } = useSocket(
    isAuthenticated ? user?.openId || null : null,
    isAuthenticated ? user?.name || t('landing.guest') : null
  );

  const music = useMusicContext();
  const { setMusicEnabled } = useSettings();
  const registeredRef = useRef(false);

  // Season rating for rank icon in room
  const { data: homeSeasonData } = trpc.season.current.useQuery({}, {
    enabled: !!profile,
    refetchInterval: 120000,
  });
  const homeSeasonRating = homeSeasonData?.seasonRating ?? 0;

  // Register profile with socket when profile loads
  useEffect(() => {
    if (profile && connected && !registeredRef.current) {
      registerProfile(profile.gameId, profile.displayName || t('landing.player'), profile.avatarId || undefined, (profile as any).equippedFrame || null, (profile as any).isPremium === true, homeSeasonRating);
      registeredRef.current = true;
    }
  }, [profile, connected, registerProfile, homeSeasonRating]);

  // Reset registration flag on disconnect
  useEffect(() => {
    if (!connected) registeredRef.current = false;
  }, [connected]);

  // --- Playlist switching: when entering a room with a playlistId, fetch tracks and switch music ---
  const roomPlaylistId = currentRoom?.settings?.playlistId ?? null;
  const { data: roomPlaylistData } = trpc.playlists.tracks.useQuery(
    { playlistId: roomPlaylistId! },
    { enabled: !!roomPlaylistId }
  );
  const prevPlaylistIdRef = useRef<number | null>(null);

  useEffect(() => {
    if (roomPlaylistId && roomPlaylistData?.tracks?.length) {
      if (prevPlaylistIdRef.current !== roomPlaylistId) {
        // tracks from backend are already string URLs
        music.setTracks(roomPlaylistData.tracks as string[]);
        prevPlaylistIdRef.current = roomPlaylistId;
      }
    } else if (!roomPlaylistId && prevPlaylistIdRef.current !== null) {
      // Reset to default tracks when leaving room or room has no playlist
      prevPlaylistIdRef.current = null;
    }
  }, [roomPlaylistId, roomPlaylistData, music]);

  // Tutorial congratulations dialog state
  const [showTutorialCongrats, setShowTutorialCongrats] = useState(false);
  const [tutorialRewardGiven, setTutorialRewardGiven] = useState(false);
  const completeTutorialMutation = trpc.balance.completeTutorial.useMutation({
    onSuccess: (data) => {
      if (data.success) {
        setTutorialRewardGiven(true);
      }
    },
  });

  // Invite modal state — shown when a friend invites us to a room
  const [activeInvite, setActiveInvite] = useState<{
    roomId: string; roomName: string; fromName: string; fromGameId: number;
  } | null>(null);

  // Handle pending invites — transfer to activeInvite for modal display
  useEffect(() => {
    if (!pendingInvite) return;
    // Don't show invite if player is already in a game or waiting room
    if (gameState || currentRoom) {
      setPendingInvite(null);
      return;
    }
    console.log('[Home] Setting activeInvite from pendingInvite:', pendingInvite);
    setActiveInvite(pendingInvite);
    setPendingInvite(null);
  }, [pendingInvite, setPendingInvite, gameState, currentRoom]);

  const handleAcceptInvite = useCallback(async (roomId: string) => {
    setActiveInvite(null);
    try {
      const ok = await joinRoom(roomId);
      if (!ok) {
        toast.error(t('invite.joinFailed') || 'Не удалось присоединиться к комнате');
      }
    } catch (err) {
      console.error('[Home] Failed to accept invite:', err);
      toast.error(t('invite.joinFailed') || 'Не удалось присоединиться к комнате');
    }
  }, [joinRoom, t]);

  const handleDeclineInvite = useCallback((roomId: string, fromGameId: number) => {
    declineInvite(roomId, fromGameId);
    setActiveInvite(null);
  }, [declineInvite]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2035] to-[#0a1628] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-amber-400" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LandingPage />;
  }

  // Music choice dialog — shown once on first visit
  if (isAuthenticated && !music.choiceMade) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2035] to-[#0a1628]">
        <MusicChoiceDialog onChoice={(enable) => {
          music.makeChoice(enable);
          // Sync with SettingsContext so the checkbox in settings reflects the choice
          setMusicEnabled(enable);
        }} />
      </div>
    );
  }

  // In game
  if (gameState && (gameState.gamePhase === 'playing' || gameState.gamePhase === 'finished')) {
    return (
      <>
      <GameTable
        gameState={gameState}
        availableActions={availableActions}
        turnTimer={turnTimer}
        gameOverData={gameOverData}
        prizeData={prizeData}
        onPlayCard={(cardId, targetPairIdx) => playCard(gameState.roomId, cardId, targetPairIdx)}
        onTransferCard={(cardId) => transferCard(gameState.roomId, cardId)}
        onTransferCards={(cardIds) => transferCards(gameState.roomId, cardIds)}
        onTakeCards={() => takeCards(gameState.roomId)}
        onPassTurn={() => passTurn(gameState.roomId)}
        onEndAttack={() => endAttack(gameState.roomId)}
        onSkipTurn={() => skipTurn(gameState.roomId)}
        onShowPassThrough={(cardId) => showPassThrough(gameState.roomId, cardId)}
        onShowPassThroughs={(cardIds) => showPassThroughs(gameState.roomId, cardIds)}
        onLeaveGame={() => leaveGame(gameState.roomId)}
        onReturnToLobby={returnToLobby}
        roomPenalty={gameState.betAmount || 0}
        musicEnabled={music.enabled}
        onToggleMusic={music.toggle}
        musicVolume={music.volume}
        onMusicVolumeChange={music.setVolume}
        frozenInfo={frozenInfo}
        isTutorial={gameState.isTutorial}
        onTutorialComplete={() => {
          // Credit tutorial reward (one-time)
          setTutorialRewardGiven(false);
          completeTutorialMutation.mutate(undefined, {
            onSuccess: (data) => {
              if (data.success) setTutorialRewardGiven(true);
              setShowTutorialCongrats(true);
            },
            onError: () => {
              setShowTutorialCongrats(true);
            },
          });
        }}
      />
      {showTutorialCongrats && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <div className="bg-gradient-to-b from-gray-800 to-gray-900 border border-yellow-500/40 rounded-2xl p-6 sm:p-8 max-w-md mx-4 text-center shadow-2xl shadow-yellow-500/10">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-2xl sm:text-3xl font-bold text-yellow-400 mb-3">
              {locale === 'kk' ? 'Құттықтаймыз! Оқыту аяқталды.' : locale === 'en' ? 'Congratulations! Tutorial completed.' : 'Поздравляем! Обучение пройдено.'}
            </h2>
            <p className="text-white text-sm sm:text-base mb-4">
              {locale === 'kk'
                ? 'Егер оқытуды қайталан өткіңіз келсе, лоббидегі "оқыту" түймесіне басуға болады.'
                : locale === 'en'
                ? 'If you want to take the tutorial again, you can click the "Tutorial" button in the lobby.'
                : 'Если вы захотите пройти обучение повторно, вы можете нажать на кнопку "обучение" в лобби.'}
            </p>
            {tutorialRewardGiven && (
              <>
                <p className="text-yellow-300 text-sm sm:text-base mb-1">
                  {locale === 'kk' ? 'Оқытуды сәтті аяқтағаныңыз үшін есептелді:' : locale === 'en' ? 'For successfully completing the tutorial, you have been credited:' : 'За успешное прохождение обучения, вам начислено:'}
                </p>
                <div className="flex items-center justify-center gap-2 mb-6">
                  <span className="text-3xl sm:text-4xl font-bold text-yellow-400">+2000</span>
                  <span className="text-lg text-yellow-300">{locale === 'kk' ? 'шаңырақ' : locale === 'en' ? 'shanyrak' : 'шаныраков'}</span>
                </div>
              </>
            )}
            {!tutorialRewardGiven && (
              <div className="mb-6" />
            )}
            <Button
              onClick={() => {
                setShowTutorialCongrats(false);
                leaveGame(gameState.roomId);
                returnToLobby();
                refetchProfile();
              }}
              className="bg-yellow-500 hover:bg-yellow-600 text-black font-bold px-8 py-3 text-base rounded-xl"
            >
              {locale === 'kk' ? 'Лоббиге өту' : locale === 'en' ? 'Go to Lobby' : 'Перейти в лобби'}
            </Button>
          </div>
        </div>
      )}
    </>
    );
    // eslint-disable-next-line
  }

  // In waiting room
  if (currentRoom) {
    return (
      <WaitingRoom
        room={currentRoom}
        userId={user?.openId || ''}
        onToggleReady={() => toggleReady(currentRoom.id)}
        onStartGame={() => startGame(currentRoom.id)}
        onLeave={() => leaveRoom(currentRoom.id)}
        onCloseRoom={() => closeRoom(currentRoom.id)}
        profile={profile}
        onlineFriendIds={onlineFriendIds}
        onInviteFriend={(targetGameId) => inviteFriend(currentRoom.id, targetGameId)}
      />
    );
  }

  // Lobby
  return (
    <>
      <Lobby
        rooms={rooms}
        connected={connected}
        userName={profile?.displayName || user?.name || t('landing.guest')}
        userId={user?.openId || ''}
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        onLogout={logout}
        profile={profile}
        onlineFriendIds={onlineFriendIds}
        onInviteFriend={undefined}
        refetchProfile={refetchProfile}
        refreshRooms={requestRoomList}
      />
      <InviteModal
        invite={activeInvite}
        onAccept={handleAcceptInvite}
        onDecline={handleDeclineInvite}
      />
    </>
  );
}

function LandingPage() {
  const { t } = useTranslation();
  const faceCards = [
    CARD_IMAGES['K-spades'], CARD_IMAGES['Q-hearts'],
    CARD_IMAGES['J-diamonds'], CARD_IMAGES['A-clubs'],
    CARD_IMAGES['777'],
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a1628] via-[#0f2035] to-[#0a1628] relative overflow-hidden">
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 rounded-full bg-amber-600/5 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 rounded-full bg-blue-600/5 blur-3xl" />
      </div>

      <div className="relative z-10">
        <div className="container mx-auto px-4 pt-12 pb-20 max-w-6xl">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <Badge className="bg-amber-900/50 text-amber-300 border-amber-700 mb-4">
                <Star className="w-3 h-3 mr-1" /> {t('landing.subtitle')}
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold text-amber-100 mb-4 leading-tight">
                {t('landing.title')}<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                  {t('lobby.subtitle')}
                </span>
              </h1>
              <p className="text-amber-200/60 text-lg mb-8 max-w-lg">
                {t('landing.feature2Desc')}
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Badge variant="outline" className="border-amber-700/40 text-amber-200/70 px-3 py-1">
                  <Users className="w-3 h-3 mr-1" /> 2-8
                </Badge>
                <Badge variant="outline" className="border-amber-700/40 text-amber-200/70 px-3 py-1">
                  <Swords className="w-3 h-3 mr-1" /> 145
                </Badge>
                <Badge variant="outline" className="border-amber-700/40 text-amber-200/70 px-3 py-1">
                  <Crown className="w-3 h-3 mr-1" /> 3
                </Badge>
                <Badge variant="outline" className="border-amber-700/40 text-amber-200/70 px-3 py-1">
                  <Zap className="w-3 h-3 mr-1" /> {t('landing.feature3Title')}
                </Badge>
              </div>

              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/40 text-lg px-8"
              >
                <a href="/login">
                  {t('landing.login')}
                </a>
              </Button>
            </div>

            <div className="flex justify-center items-center">
              <div className="relative">
                {faceCards.map((url, i) => (
                  <div
                    key={i}
                    className="absolute rounded-xl overflow-hidden shadow-2xl border-2 border-amber-700/40 w-32 h-48"
                    style={{
                      transform: `rotate(${(i - 2) * 12}deg) translateX(${(i - 2) * 40}px)`,
                      zIndex: i,
                      top: `${Math.abs(i - 2) * 15}px`,
                    }}
                  >
                    <img src={url} alt="" className="w-full h-full object-cover" loading="lazy" />
                  </div>
                ))}
                <div className="w-80 h-72" />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#0d1f33]/80 border-t border-b border-amber-700/10 py-16">
          <div className="container mx-auto px-4 max-w-5xl">
            <h2 className="text-3xl font-bold text-amber-100 text-center mb-12">{t('landing.feature1Title')}</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Crown className="w-8 h-8 text-amber-400" />}
                title={t('landing.feature1Title')}
                desc={t('landing.feature1Desc')}
              />
              <FeatureCard
                icon={<Zap className="w-8 h-8 text-amber-400" />}
                title={t('landing.feature2Title')}
                desc={t('landing.feature2Desc')}
              />
              <FeatureCard
                icon={<Shield className="w-8 h-8 text-amber-400" />}
                title={t('landing.feature3Title')}
                desc={t('landing.feature3Desc')}
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-amber-200/30 text-sm">
            {t('rules.footer')}
          </p>
        </div>
      </div>
    </div>
  );
}

function FeatureCard({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="bg-[#1a2d45]/60 border border-amber-700/20 rounded-xl p-6 text-center hover:border-amber-500/30 transition-colors">
      <div className="flex justify-center mb-4">{icon}</div>
      <h3 className="text-lg font-semibold text-amber-100 mb-2">{title}</h3>
      <p className="text-amber-200/50 text-sm">{desc}</p>
    </div>
  );
}
