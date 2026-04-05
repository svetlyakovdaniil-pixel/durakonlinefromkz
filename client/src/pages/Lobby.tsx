import { useState } from 'react';
import type { Room, RoomSettings, DeckStyle } from '../../../shared/gameTypes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Users, Timer, Bot, Plus, Wifi, WifiOff, LogOut, Gamepad2, Layers, RotateCcw, Lock, User, Hash } from 'lucide-react';
import { getAvatarUrl } from '../../../shared/avatars';
import ProfileDrawer from '@/components/ProfileDrawer';
import PasswordDialog from '@/components/PasswordDialog';

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
  } | null;
  onlineFriendIds: number[];
  onInviteFriend: ((targetGameId: number) => void) | undefined;
}

export default function Lobby({ rooms, connected, userName, userId, onCreateRoom, onJoinRoom, onLogout, profile, onlineFriendIds }: LobbyProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [roomName, setRoomName] = useState('');
  const [maxPlayers, setMaxPlayers] = useState('4');
  const [withBots, setWithBots] = useState(true);
  const [botCount, setBotCount] = useState(3);
  const [turnTimer, setTurnTimer] = useState(30);
  const [deckStyle, setDeckStyle] = useState<DeckStyle>('classic');
  const [isPrivate, setIsPrivate] = useState(false);
  const [roomPassword, setRoomPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [rejoining, setRejoining] = useState<string | null>(null);
  const [passwordRoom, setPasswordRoom] = useState<Room | null>(null);

  const handleCreate = async () => {
    setLoading(true);
    const settings: RoomSettings = {
      turnTimer,
      withBots,
      botCount: withBots ? botCount : 0,
      deckStyle,
      ...(isPrivate && roomPassword ? { password: roomPassword, isPrivate: true } : {}),
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
        <div className="container py-3 sm:py-4">
          {/* === MOBILE LAYOUT (< sm) === */}
          <div className="sm:hidden">
            {/* Row 1: Title left + Avatar center + Logout right */}
            <div className="relative flex items-start justify-between">
              {/* Left: Title + Online — centered text */}
              <div className="flex flex-col items-center">
                <h1 className="text-xl font-bold text-amber-100 leading-tight text-center">Казахский<br/>Дурак</h1>
                <Badge variant="outline" className={`mt-1 text-xs px-2 py-0.5 ${connected ? 'border-green-600/40 text-green-400' : 'border-red-600/40 text-red-400'}`}>
                  {connected ? <><Wifi className="w-3.5 h-3.5 mr-1" />Онлайн</> : <><WifiOff className="w-3.5 h-3.5 mr-1" />Оффлайн</>}
                </Badge>
              </div>
              {/* Center: Avatar + Name/ID — absolutely centered on screen */}
              <div className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center">
                <ProfileDrawer
                  profile={profile}
                  onlineFriendIds={onlineFriendIds}
                  inRoom={false}
                >
                  <button className="hover:opacity-80 transition-opacity">
                    <div className="w-[72px] h-[72px] rounded-full overflow-hidden border-2 border-amber-500/60 shadow-lg shadow-amber-900/30">
                      <img src={getAvatarUrl(profile?.avatarId)} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  </button>
                </ProfileDrawer>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className="text-sm text-amber-200/80 font-semibold">{userName}</span>
                  {profile && (
                    <span className="text-xs text-amber-300/60">ID {profile.gameId}</span>
                  )}
                </div>
              </div>
              {/* Right: Logout */}
              <Button variant="ghost" size="sm" className="text-amber-200/50 hover:text-amber-100 p-1.5" onClick={onLogout}>
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </div>

          {/* === DESKTOP LAYOUT (≥ sm) === */}
          <div className="hidden sm:block">
            {/* Top row: title + user info */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Gamepad2 className="w-7 h-7 text-amber-400" />
                <h1 className="text-xl font-bold text-amber-100">Казахский Дурак</h1>
              </div>
              <div className="flex items-center gap-3">
                <Badge variant="outline" className={`text-sm px-2.5 py-0.5 ${connected ? 'border-green-600/40 text-green-400' : 'border-red-600/40 text-red-400'}`}>
                  {connected ? <><Wifi className="w-3.5 h-3.5 mr-1" />Онлайн</> : <><WifiOff className="w-3.5 h-3.5 mr-1" />Оффлайн</>}
                </Badge>
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
                  <button className="flex items-center gap-1.5 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-amber-500/50">
                      <img src={getAvatarUrl(profile?.avatarId)} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  </button>
                </ProfileDrawer>
                <span className="text-base text-amber-200/70 font-medium">{userName}</span>
                <Button variant="ghost" size="sm" className="text-amber-200/50 hover:text-amber-100 p-2" onClick={onLogout}>
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            </div>
            {/* Bottom row: Комнаты + Создать */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-amber-700/15">
              <h2 className="text-2xl font-bold text-amber-100">Комнаты</h2>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-600 hover:bg-amber-500 text-white text-base h-10 px-4">
                    <Plus className="w-4 h-4 mr-2" /> Создать комнату
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-[#1a2d45] border-amber-700/30 text-amber-100 max-w-[calc(100vw-2rem)] sm:max-w-lg mx-auto">
              <DialogHeader>
                <DialogTitle className="text-amber-100">Новая комната</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label className="text-amber-200/70 text-sm">Название</Label>
                  <Input
                    value={roomName}
                    onChange={e => setRoomName(e.target.value)}
                    placeholder={`Комната ${userName}`}
                    className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 sm:h-10"
                  />
                </div>
                <div>
                  <Label className="text-amber-200/70 text-sm">Макс. игроков</Label>
                  <Select value={maxPlayers} onValueChange={setMaxPlayers}>
                    <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                      {[2, 3, 4, 5, 6].map(n => (
                        <SelectItem key={n} value={String(n)} className="text-amber-100">{n} игроков</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-amber-200/70 text-sm">Таймер хода: {turnTimer}с</Label>
                  <Slider
                    value={[turnTimer]}
                    onValueChange={v => setTurnTimer(v[0])}
                    min={15}
                    max={60}
                    step={5}
                    className="mt-2"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label className="text-amber-200/70 text-sm">Добавить ботов</Label>
                  <Switch checked={withBots} onCheckedChange={setWithBots} />
                </div>
                <div>
                  <Label className="text-amber-200/70 text-sm">Колода карт</Label>
                  <Select value={deckStyle} onValueChange={(v) => setDeckStyle(v as DeckStyle)}>
                    <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 sm:h-10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                      <SelectItem value="classic" className="text-amber-100">Колода №1 (классическая)</SelectItem>
                      <SelectItem value="custom" className="text-amber-100">Колода №2 (кастомная)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {withBots && (
                  <div>
                    <Label className="text-amber-200/70 text-sm">Количество ботов: {botCount}</Label>
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
                {/* Private room toggle */}
                <div className="flex items-center justify-between">
                  <Label className="text-amber-200/70 text-sm flex items-center gap-1.5">
                    <Lock className="w-3.5 h-3.5" /> Закрытая комната
                  </Label>
                  <Switch checked={isPrivate} onCheckedChange={setIsPrivate} />
                </div>
                {isPrivate && (
                  <div>
                    <Label className="text-amber-200/70 text-sm">Пароль комнаты</Label>
                    <Input
                      type="password"
                      value={roomPassword}
                      onChange={e => setRoomPassword(e.target.value)}
                      placeholder="Введите пароль"
                      className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 sm:h-10"
                    />
                  </div>
                )}
                <Button
                  className="w-full bg-amber-600 hover:bg-amber-500 text-white"
                  onClick={handleCreate}
                  disabled={loading || (isPrivate && !roomPassword.trim())}
                >
                  {loading ? 'Создание...' : 'Создать'}
                </Button>
              </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile: Комнаты + Создать (below header, only on mobile) */}
      <div className="sm:hidden border-t border-amber-700/20 bg-black/20">
        <div className="container py-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-amber-100">Комнаты</h2>
            <Button className="bg-amber-600 hover:bg-amber-500 text-white text-sm h-9 px-4" onClick={() => setDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-1" /> Создать
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container py-4 sm:py-6">
        {rooms.length === 0 ? (
          <div className="text-center py-12 sm:py-20">
            <Gamepad2 className="w-12 h-12 sm:w-16 sm:h-16 text-amber-700/30 mx-auto mb-3 sm:mb-4" />
            <p className="text-amber-200/40 text-base sm:text-lg">Пока нет комнат</p>
            <p className="text-amber-200/30 text-xs sm:text-sm mt-1">Создайте первую комнату, чтобы начать игру</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {rooms.map(room => {
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
                          В игре
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
                      <Timer className="w-3 h-3 mr-0.5 sm:mr-1" /> {room.settings.turnTimer}с
                    </Badge>
                    {room.settings.withBots && (
                      <Badge variant="outline" className="border-amber-700/20 text-amber-200/50 text-[10px] sm:text-xs px-1.5 sm:px-2">
                        <Bot className="w-3 h-3 mr-0.5 sm:mr-1" /> {room.settings.botCount} бот
                      </Badge>
                    )}
                    <Badge variant="outline" className="border-amber-700/20 text-amber-200/50 text-[10px] sm:text-xs px-1.5 sm:px-2">
                      <Layers className="w-3 h-3 mr-0.5 sm:mr-1" /> {room.settings.deckStyle === 'custom' ? '№2' : '№1'}
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
                      {rejoining === room.id ? 'Возвращение...' : 'Вернуться в игру'}
                    </Button>
                  ) : (
                    <Button
                      className="w-full bg-amber-700/60 hover:bg-amber-600/60 text-amber-100 text-sm h-8 sm:h-10"
                      disabled={room.players.length >= room.maxPlayers || !!room.hasActiveGame}
                      onClick={() => handleJoinRoom(room)}
                    >
                      {room.hasActiveGame ? 'Идёт игра' : room.players.length >= room.maxPlayers ? 'Полная' : (
                        <span className="flex items-center gap-1">
                          {room.hasPassword && <Lock className="w-3.5 h-3.5" />}
                          Войти
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
    </div>
  );
}
