import { useEffect, useRef } from 'react';
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
import { useMusicContext } from "@/contexts/MusicContext";
import MusicChoiceDialog from "@/components/MusicChoiceDialog";
import { toast } from 'sonner';

export default function Home() {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { profile, profileLoading } = useProfile(isAuthenticated);

  const {
    connected, rooms, currentRoom, gameState, availableActions, error, turnTimer,
    gameOverData, onlineFriendIds, pendingInvite, setPendingInvite,
    createRoom, joinRoom, leaveRoom, leaveGame, closeRoom, toggleReady, startGame,
    playCard, transferCard, showPassThrough, takeCards, passTurn, endAttack, skipTurn,
    returnToLobby, clearError, inviteFriend, registerProfile, sendChat,
  } = useSocket(
    isAuthenticated ? user?.openId || null : null,
    isAuthenticated ? user?.name || 'Гость' : null
  );

  const music = useMusicContext();
  const registeredRef = useRef(false);

  // Register profile with socket when profile loads
  useEffect(() => {
    if (profile && connected && !registeredRef.current) {
      registerProfile(profile.gameId, profile.displayName || 'Игрок');
      registeredRef.current = true;
    }
  }, [profile, connected, registerProfile]);

  // Reset registration flag on disconnect
  useEffect(() => {
    if (!connected) registeredRef.current = false;
  }, [connected]);

  // Handle pending invites
  useEffect(() => {
    if (!pendingInvite) return;
    const invite = pendingInvite;
    
    toast(
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-amber-400 shrink-0" />
          <div>
            <div className="text-sm font-medium">Приглашение в комнату</div>
            <div className="text-xs text-muted-foreground">
              <span className="font-medium">{invite.fromName}</span>
              <span className="opacity-60"> (#{invite.fromGameId})</span>
              {' '}приглашает вас в «{invite.roomName}»
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button
            size="sm"
            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white h-7 text-xs"
            onClick={() => {
              joinRoom(invite.roomId);
              toast.dismiss();
            }}
          >
            Принять
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-7 text-xs"
            onClick={() => toast.dismiss()}
          >
            Отклонить
          </Button>
        </div>
      </div>,
      {
        duration: 15000,
        style: {
          background: '#1a2d45',
          border: '1px solid rgba(217, 119, 6, 0.3)',
          color: '#fde68a',
        },
      }
    );
    setPendingInvite(null);
  }, [pendingInvite, joinRoom, setPendingInvite]);

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
        <MusicChoiceDialog onChoice={music.makeChoice} />
      </div>
    );
  }

  // In game
  if (gameState && (gameState.gamePhase === 'playing' || gameState.gamePhase === 'finished')) {
    return (
      <GameTable
        gameState={gameState}
        availableActions={availableActions}
        turnTimer={turnTimer}
        gameOverData={gameOverData}
        onPlayCard={(cardId, targetPairIdx) => playCard(gameState.roomId, cardId, targetPairIdx)}
        onTransferCard={(cardId) => transferCard(gameState.roomId, cardId)}
        onTakeCards={() => takeCards(gameState.roomId)}
        onPassTurn={() => passTurn(gameState.roomId)}
        onEndAttack={() => endAttack(gameState.roomId)}
        onSkipTurn={() => skipTurn(gameState.roomId)}
        onShowPassThrough={(cardId) => showPassThrough(gameState.roomId, cardId)}
        onLeaveGame={() => leaveGame(gameState.roomId)}
        onReturnToLobby={returnToLobby}
        musicEnabled={music.enabled}
        onToggleMusic={music.toggle}
      />
    );
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
    <Lobby
      rooms={rooms}
      connected={connected}
      userName={user?.name || 'Гость'}
      userId={user?.openId || ''}
      onCreateRoom={createRoom}
      onJoinRoom={joinRoom}
      onLogout={logout}
      profile={profile}
      onlineFriendIds={onlineFriendIds}
      onInviteFriend={undefined}
    />
  );
}

function LandingPage() {
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
                <Star className="w-3 h-3 mr-1" /> Новая карточная игра
              </Badge>
              <h1 className="text-5xl lg:text-6xl font-bold text-amber-100 mb-4 leading-tight">
                Казахский<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-600">
                  Дурак Онлайн
                </span>
              </h1>
              <p className="text-amber-200/60 text-lg mb-8 max-w-lg">
                Классическая карточная игра с уникальными казахскими правилами. 145 карт, 3 козыря,
                легендарный Король Пик и мистическая карта 777.
              </p>

              <div className="flex flex-wrap gap-3 mb-8">
                <Badge variant="outline" className="border-amber-700/40 text-amber-200/70 px-3 py-1">
                  <Users className="w-3 h-3 mr-1" /> 2-6 игроков
                </Badge>
                <Badge variant="outline" className="border-amber-700/40 text-amber-200/70 px-3 py-1">
                  <Swords className="w-3 h-3 mr-1" /> 145 карт
                </Badge>
                <Badge variant="outline" className="border-amber-700/40 text-amber-200/70 px-3 py-1">
                  <Crown className="w-3 h-3 mr-1" /> 3 козыря
                </Badge>
                <Badge variant="outline" className="border-amber-700/40 text-amber-200/70 px-3 py-1">
                  <Zap className="w-3 h-3 mr-1" /> Реальное время
                </Badge>
              </div>

              <Button
                asChild
                size="lg"
                className="bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-white shadow-lg shadow-amber-900/40 text-lg px-8"
              >
                <a href={getLoginUrl()}>
                  Войти и играть
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
            <h2 className="text-3xl font-bold text-amber-100 text-center mb-12">Уникальные правила</h2>
            <div className="grid md:grid-cols-3 gap-8">
              <FeatureCard
                icon={<Crown className="w-8 h-8 text-amber-400" />}
                title="Король Пик"
                desc="Бьёт любую карту, кроме себя и 777. Его может остановить только Туз Пик или легендарная 777."
              />
              <FeatureCard
                icon={<Zap className="w-8 h-8 text-amber-400" />}
                title="Три козыря"
                desc="Основной козырь и два потайных. Когда одна колода заканчивается — открывается новый козырь!"
              />
              <FeatureCard
                icon={<Shield className="w-8 h-8 text-amber-400" />}
                title="Карта 777"
                desc="Единственная в колоде. Бьёт всё, но с неё нельзя ходить. Если осталась последней — ловушка!"
              />
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 text-center">
          <p className="text-amber-200/30 text-sm">
            Казахский Дурак Онлайн — карточная игра с национальным колоритом
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
