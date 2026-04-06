import type { Room } from '../../../shared/gameTypes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, Timer, Bot, Crown, Check, X, Gamepad2, Layers, Lock, Hash, UserPlus } from 'lucide-react';
import ProfileDrawer from '@/components/ProfileDrawer';
import { formatBalance } from '../../../shared/formatBalance';

interface WaitingRoomProps {
  room: Room;
  userId: string;
  onToggleReady: () => void;
  onStartGame: () => void;
  onLeave: () => void;
  onCloseRoom: () => void;
  profile?: {
    gameId: number;
    displayName: string | null;
    rating: number;
    gamesPlayed: number;
    wins: number;
    losses: number;
  } | null;
  onlineFriendIds?: number[];
  onInviteFriend?: (targetGameId: number) => void;
}

export default function WaitingRoom({
  room, userId, onToggleReady, onStartGame, onLeave, onCloseRoom,
  profile, onlineFriendIds = [], onInviteFriend,
}: WaitingRoomProps) {
  const isHost = room.hostId === userId;
  const myPlayer = room.players.find(p => p.id === userId);
  const allReady = room.players.length >= 2 && room.players.every(p => p.isBot || p.ready);

  return (
    <div className="min-h-[100dvh] bg-gradient-to-br from-[#0a1628] via-[#0f2035] to-[#0a1628] flex items-center justify-center p-3 sm:p-4">
      <div className="bg-[#1a2d45]/80 border border-amber-700/30 rounded-2xl p-4 sm:p-6 max-w-md w-full">
        <div className="text-center mb-4 sm:mb-6">
          <Gamepad2 className="w-8 h-8 sm:w-10 sm:h-10 text-amber-400 mx-auto mb-1.5 sm:mb-2" />
          <h2 className="text-xl sm:text-2xl font-bold text-amber-100">{room.name}</h2>
          <div className="flex items-center justify-center gap-2 sm:gap-3 mt-2 flex-wrap">
            <Badge variant="outline" className="border-amber-700/30 text-amber-200/60 text-[10px] sm:text-xs">
              <Users className="w-3 h-3 mr-0.5 sm:mr-1" /> {room.players.length}/{room.maxPlayers}
            </Badge>
            <Badge variant="outline" className="border-amber-700/30 text-amber-200/60 text-[10px] sm:text-xs">
              <Timer className="w-3 h-3 mr-0.5 sm:mr-1" /> {room.settings.turnTimer}с
            </Badge>
            {room.settings.withBots && (
              <Badge variant="outline" className="border-amber-700/30 text-amber-200/60 text-[10px] sm:text-xs">
                <Bot className="w-3 h-3 mr-0.5 sm:mr-1" /> {room.settings.botCount}
              </Badge>
            )}
            <Badge variant="outline" className="border-amber-700/30 text-amber-200/60 text-[10px] sm:text-xs">
              <Layers className="w-3 h-3 mr-0.5 sm:mr-1" /> {room.settings.deckStyle === 'custom' ? 'Колода №2' : 'Колода №1'}
            </Badge>
            <Badge variant="outline" className="border-amber-500/30 text-amber-300/70 text-[10px] sm:text-xs">
              <img src="https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/shanyrak_96e91a49.png" alt="" className="w-3 h-3 mr-0.5 sm:mr-1" />
              {formatBalance(room.settings.betAmount || 100)}
            </Badge>
            {room.hasPassword && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px] sm:text-xs">
                <Lock className="w-3 h-3 mr-0.5 sm:mr-1" /> Закрытая
              </Badge>
            )}
          </div>
        </div>

        <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
          {room.players.map(p => (
            <div
              key={p.id}
              className={`flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 rounded-xl border transition-all ${
                p.ready || p.isBot
                  ? 'bg-green-900/20 border-green-700/20'
                  : 'bg-[#0f2035]/50 border-amber-700/10'
              }`}
            >
              <div className="flex items-center gap-1.5 sm:gap-2">
                {p.id === room.hostId && <Crown className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-400" />}
                {p.isBot && <Bot className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-400" />}
                <span className="text-amber-100 font-medium text-sm sm:text-base truncate max-w-32 sm:max-w-none">{p.name}</span>
                {p.gameId && (
                  <span className="text-amber-200/30 text-[10px]">#{p.gameId}</span>
                )}
              </div>
              {p.isBot ? (
                <Badge className="bg-green-900/40 text-green-300 border-green-700/30 text-[10px] sm:text-xs">Готов</Badge>
              ) : p.ready ? (
                <Badge className="bg-green-900/40 text-green-300 border-green-700/30 text-[10px] sm:text-xs">
                  <Check className="w-3 h-3 mr-0.5 sm:mr-1" /> Готов
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-700/30 text-amber-200/50 text-[10px] sm:text-xs">
                  <X className="w-3 h-3 mr-0.5 sm:mr-1" /> Не готов
                </Badge>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-dashed border-amber-700/15 text-amber-200/20 text-xs sm:text-sm">
              Ожидание игрока...
            </div>
          ))}
        </div>

        {/* Invite friends button (host only, when room has space) */}
        {isHost && room.players.length < room.maxPlayers && (
          <div className="mb-3">
            <ProfileDrawer
              profile={profile ?? null}
              onlineFriendIds={onlineFriendIds}
              inRoom={true}
              onInviteFriend={onInviteFriend}
            >
              <Button
                variant="outline"
                className="w-full border-amber-700/30 text-amber-200 hover:bg-amber-900/20 text-sm h-8 sm:h-9"
              >
                <UserPlus className="w-4 h-4 mr-1.5" /> Пригласить друзей
              </Button>
            </ProfileDrawer>
          </div>
        )}

        {/* My ID display */}
        {profile && (
          <div className="mb-3 text-center">
            <Badge variant="outline" className="border-amber-600/30 text-amber-300 text-xs px-2 py-0.5">
              <Hash className="w-3 h-3 mr-0.5" /> Ваш ID: {profile.gameId}
            </Badge>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-2">
          {isHost ? (
            <>
              <Button
                variant="outline"
                className="border-red-700/40 text-red-300 hover:bg-red-900/30 text-sm h-9 sm:h-10 order-3 sm:order-1"
                onClick={onCloseRoom}
              >
                Закрыть
              </Button>
              <Button
                className={`flex-1 ${myPlayer?.ready ? 'bg-green-700 hover:bg-green-600' : 'bg-amber-600 hover:bg-amber-500'} text-white text-sm h-9 sm:h-10 order-2`}
                onClick={onToggleReady}
              >
                {myPlayer?.ready ? 'Не готов' : 'Готов'}
              </Button>
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 text-sm h-9 sm:h-10 order-1 sm:order-3"
                disabled={!allReady}
                onClick={onStartGame}
              >
                Начать игру
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1 border-amber-700/40 text-amber-200 hover:bg-amber-900/30 text-sm h-9 sm:h-10"
                onClick={onLeave}
              >
                Выйти
              </Button>
              <Button
                className={`flex-1 ${myPlayer?.ready ? 'bg-green-700 hover:bg-green-600' : 'bg-amber-600 hover:bg-amber-500'} text-white text-sm h-9 sm:h-10`}
                onClick={onToggleReady}
              >
                {myPlayer?.ready ? 'Не готов' : 'Готов'}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
