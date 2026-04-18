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
import { Loader2, Swords, Shield, Crown, Star, Users, Zap, RotateCcw, X } from "lucide-react";
import { useMusicContext } from '@/contexts/MusicContext';
import { useSettings } from '@/contexts/SettingsContext';
import MusicChoiceDialog from "@/components/MusicChoiceDialog";
import { TutorialModal } from '@/components/TutorialModal';
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
    requestRoomList, updateRoom, sendEmotion, playerEmotions,
    RECONNECT_WINDOW_MS, getStorageKeys, persistActiveRoom,
  } = useSocket(
    isAuthenticated ? user?.openId || null : null,
    isAuthenticated ? user?.name || t('landing.guest') : null
  );

  // ─── Reconnect banner: detect if player was in a game before page reload ──────────────────
  const [reconnectRoomId, setReconnectRoomId] = useState<string | null>(null);
  const [reconnectSecondsLeft, setReconnectSecondsLeft] = useState(0);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const reconnectIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Check localStorage on mount (after userId is known)
  useEffect(() => {
    if (!user?.openId) return;
    if (currentRoom || gameState) return; // already in game, no banner needed
    const { room: roomKey, ts: tsKey } = getStorageKeys();
    const storedRoomId = localStorage.getItem(roomKey);
    const storedTs = parseInt(localStorage.getItem(tsKey) || '0', 10);
    if (!storedRoomId) return;
    const elapsed = Date.now() - storedTs;
    const remaining = Math.ceil((RECONNECT_WINDOW_MS - elapsed) / 1000);
    if (remaining > 0) {
      setReconnectRoomId(storedRoomId);
      setReconnectSecondsLeft(remaining);
    } else {
      localStorage.removeItem(roomKey);
      localStorage.removeItem(tsKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.openId]);

  // Countdown timer for reconnect banner
  useEffect(() => {
    if (!reconnectRoomId || reconnectSecondsLeft <= 0) return;
    const interval = setInterval(() => {
      setReconnectSecondsLeft(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          const { room: roomKey, ts: tsKey } = getStorageKeys();
          localStorage.removeItem(roomKey);
          localStorage.removeItem(tsKey);
          setReconnectRoomId(null);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    reconnectIntervalRef.current = interval;
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reconnectRoomId]);

  // Dismiss banner once player enters a room
  useEffect(() => {
    if (currentRoom || gameState) {
      setReconnectRoomId(null);
      if (reconnectIntervalRef.current) clearInterval(reconnectIntervalRef.current);
    }
  }, [currentRoom, gameState]);

  const handleReconnectBanner = useCallback(async () => {
    if (!reconnectRoomId || isReconnecting) return;
    setIsReconnecting(true);
    persistActiveRoom(null, true);
    const roomIdToJoin = reconnectRoomId;
    setReconnectRoomId(null);
    if (reconnectIntervalRef.current) clearInterval(reconnectIntervalRef.current);
    try {
      const ok = await joinRoom(roomIdToJoin);
      if (!ok) {
        toast.error(t('socket.reconnectFailed'), { duration: 5000 });
      }
    } catch {
      toast.error(t('socket.reconnectFailed'), { duration: 5000 });
    } finally {
      setIsReconnecting(false);
    }
  }, [reconnectRoomId, isReconnecting, joinRoom, persistActiveRoom, t]);

  const handleDismissReconnect = useCallback(() => {
    persistActiveRoom(null, true);
    setReconnectRoomId(null);
    if (reconnectIntervalRef.current) clearInterval(reconnectIntervalRef.current);
  }, [persistActiveRoom]);
  // ────────────────────────────────────────────────────────────────────────────

  const music = useMusicContext();
  const { setMusicEnabled } = useSettings();
  const registeredRef = useRef(false);

  // Active test season key (null if no test active) — poll frequently so rank icon updates quickly
  const { data: activeTestData } = trpc.season.activeTestKey.useQuery(undefined, {
    refetchInterval: 10000, // 10s — fast enough to pick up AdminPanel changes
  });
  const activeTestSeasonKey = activeTestData?.testSeasonKey ?? null;

  // Season rating for rank icon in room — use test season key if active
  const { data: homeSeasonData } = trpc.season.current.useQuery(
    { seasonKey: activeTestSeasonKey ?? undefined },
    {
      enabled: !!profile,
      refetchInterval: 15000, // 15s — re-fetch when test season changes
    }
  );
  const homeSeasonRating = homeSeasonData?.seasonRating ?? 0;

  // Track last registered season rating to re-register when it changes
  const lastRegisteredRatingRef = useRef<number | null>(null);

  // Register profile with socket when profile loads, or when seasonRating changes
  useEffect(() => {
    if (!profile || !connected) return;
    const needsRegister = !registeredRef.current || lastRegisteredRatingRef.current !== homeSeasonRating;
    if (needsRegister) {
      registerProfile(profile.gameId, profile.displayName || t('landing.player'), profile.avatarId || undefined, (profile as any).equippedFrame || null, (profile as any).isPremium === true, homeSeasonRating);
      registeredRef.current = true;
      lastRegisteredRatingRef.current = homeSeasonRating;
    }
  }, [profile, connected, registerProfile, homeSeasonRating]);

  // Reset registration flag on disconnect
  useEffect(() => {
    if (!connected) {
      registeredRef.current = false;
      lastRegisteredRatingRef.current = null;
    }
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

  // --- Forced tutorial state ---
  // Shown after music choice for players who haven't completed the tutorial yet
  const [showForcedTutorial, setShowForcedTutorial] = useState(false);
  const [forcedTutorialLoading, setForcedTutorialLoading] = useState(false);
  // Track if we've already triggered the forced tutorial check this session
  const forcedTutorialCheckedRef = useRef(false);

  // Once music choice is made AND profile is loaded, check if tutorial is needed
  useEffect(() => {
    if (!music.choiceMade) return;
    if (!profile) return;
    if (forcedTutorialCheckedRef.current) return;
    // If tutorial not completed yet, show forced tutorial
    if (!(profile as any).tutorialCompleted) {
      forcedTutorialCheckedRef.current = true;
      setShowForcedTutorial(true);
    } else {
      forcedTutorialCheckedRef.current = true;
    }
  }, [music.choiceMade, profile]);

  const handleForcedTutorialStart = useCallback(async () => {
    setForcedTutorialLoading(true);
    try {
      const tutorialRoomName = locale === 'kk' ? '🎓 Оқыту' : locale === 'en' ? '🎓 Tutorial' : '🎓 Обучение';
      await createRoom(
        tutorialRoomName,
        2,
        {
          withBots: true,
          botCount: 1,
          turnTimer: 60,
          deckStyle: 'classic',
          tableStyle: 'classic',
          betAmountIdx: 0,
          isTutorial: true,
          locale,
        } as any
      );
      setShowForcedTutorial(false);
    } catch (error) {
      console.error('Failed to start forced tutorial:', error);
      toast.error(locale === 'kk' ? 'Оқытуды бастау сәтсіз аяқталды' : locale === 'en' ? 'Failed to start tutorial' : 'Не удалось запустить обучение');
    } finally {
      setForcedTutorialLoading(false);
    }
  }, [createRoom, locale]);

  const handleForcedTutorialSkip = useCallback(() => {
    // Allow skipping — mark tutorial as "seen" so it won't show again this session
    setShowForcedTutorial(false);
    // Also call completeTutorial on server so it won't show again on next login
    completeTutorialMutation.mutate();
  }, [completeTutorialMutation]);

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

  // Music choice dialog — shown once on first visit (session-only)
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
        sendEmotion={sendEmotion}
        playerEmotions={playerEmotions}
        activeEmotionPackId={(profile as any)?.activeEmotionPack || 'hamster'}
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
        onUpdateRoom={(data) => updateRoom({ roomId: currentRoom.id, ...data })}
      />
    );
  }

  // Lobby — with forced tutorial overlay for new players
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
      {/* Forced tutorial for new players — shown after music choice */}
      <TutorialModal
        open={showForcedTutorial}
        onClose={() => {}} // no-op: cannot close by clicking outside
        onStartTutorial={handleForcedTutorialStart}
        isLoading={forcedTutorialLoading}
        isMandatory={true}
        onSkip={handleForcedTutorialSkip}
      />
      {/* Reconnect banner — shown when player was in a game before page reload */}
      {reconnectRoomId && (
        <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-[200] w-[calc(100%-2rem)] max-w-sm">
          <div
            className="relative flex flex-col gap-2 rounded-2xl px-4 py-3 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, #0f2035 0%, #1a3a5c 100%)',
              border: '1.5px solid rgba(201,168,76,0.5)',
              boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(201,168,76,0.15)',
            }}
          >
            {/* Dismiss button */}
            <button
              onClick={handleDismissReconnect}
              className="absolute top-2 right-2 text-amber-300/50 hover:text-amber-300 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2 pr-4">
              <div className="w-8 h-8 rounded-full bg-amber-500/20 flex items-center justify-center shrink-0">
                <RotateCcw className="w-4 h-4 text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-amber-100 font-semibold text-sm leading-tight">
                  {t('socket.rejoinBannerTitle')}
                </p>
                <p className="text-amber-300/70 text-xs mt-0.5">
                  {t('socket.rejoinBannerDesc', { sec: String(reconnectSecondsLeft) })}
                </p>
              </div>
            </div>
            {/* Progress bar */}
            <div className="h-1 rounded-full bg-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-amber-400 transition-all duration-1000 ease-linear"
                style={{ width: `${(reconnectSecondsLeft / (RECONNECT_WINDOW_MS / 1000)) * 100}%` }}
              />
            </div>
            <button
              onClick={handleReconnectBanner}
              disabled={isReconnecting}
              className="w-full rounded-xl py-2 text-sm font-bold text-black transition-all active:scale-[0.98] disabled:opacity-60"
              style={{
                background: isReconnecting
                  ? 'rgba(201,168,76,0.5)'
                  : 'linear-gradient(90deg, #c9a84c 0%, #f0c040 100%)',
              }}
            >
              {isReconnecting ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t('lobby.rejoining')}
                </span>
              ) : (
                t('socket.rejoinBannerBtn')
              )}
            </button>
          </div>
        </div>
      )}
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
                  <Swords className="w-3 h-3 mr-1" /> {t('landing.feature1')}
                </Badge>
                <Badge variant="outline" className="border-amber-700/40 text-amber-200/70 px-3 py-1">
                  <Shield className="w-3 h-3 mr-1" /> {t('landing.feature2')}
                </Badge>
                <Badge variant="outline" className="border-amber-700/40 text-amber-200/70 px-3 py-1">
                  <Zap className="w-3 h-3 mr-1" /> {t('landing.feature3')}
                </Badge>
              </div>
              <a href={getLoginUrl()}>
                <Button size="lg" className="bg-amber-600 hover:bg-amber-500 text-white px-8 py-4 text-lg font-bold rounded-xl shadow-lg shadow-amber-900/30">
                  <Crown className="w-5 h-5 mr-2" /> {t('landing.play')}
                </Button>
              </a>
            </div>
            <div className="hidden lg:flex justify-center items-center">
              <div className="relative">
                <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-3xl scale-150" />
                <div className="relative flex gap-3 flex-wrap justify-center max-w-xs">
                  {faceCards.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt=""
                      className="w-20 h-28 rounded-lg shadow-2xl shadow-black/50"
                      style={{ transform: `rotate(${(i - 2) * 8}deg) translateY(${Math.abs(i - 2) * 5}px)` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
