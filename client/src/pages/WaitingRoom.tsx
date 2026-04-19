import { useState, useCallback } from 'react';
import type { Room, RoomSettings, DeckStyle } from '../../../shared/gameTypes';
import { BET_AMOUNTS } from '../../../shared/gameTypes';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Users, Timer, Bot, Crown, Check, X, Gamepad2, Layers, Lock, Hash, UserPlus, Music, Settings } from 'lucide-react';
import ProfileDrawer from '@/components/ProfileDrawer';
import FriendsDrawer from '@/components/FriendsDrawer';
import { formatBalance } from '../../../shared/formatBalance';
import { useTranslation } from '@/i18n';
import { DiamondRankIcon } from '@/components/DiamondRankIcon';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

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
  onUpdateRoom?: (data: { name?: string; maxPlayers?: number; settings?: Partial<RoomSettings> }) => Promise<boolean>;
}

export default function WaitingRoom({
  room, userId, onToggleReady, onStartGame, onLeave, onCloseRoom,
  profile, onlineFriendIds = [], onInviteFriend, onUpdateRoom,
}: WaitingRoomProps) {
  const { t, locale } = useTranslation();
  const isHost = room.hostId === userId;
  const myPlayer = room.players.find(p => p.id === userId);
  const [friendsDrawerOpen, setFriendsDrawerOpen] = useState(false);
  // Host clicking "Start" implies they are ready — only check non-host players
  const allReady = room.players.length >= 2 && room.players.every(p => p.isBot || p.id === room.hostId || p.ready);

  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Editable settings state — initialized from current room when modal opens
  const [editName, setEditName] = useState(room.name);
  const [editMaxPlayers, setEditMaxPlayers] = useState(String(room.maxPlayers));
  const [editBetAmountIdx, setEditBetAmountIdx] = useState(() => {
    const idx = BET_AMOUNTS.indexOf(room.settings.betAmount as typeof BET_AMOUNTS[number]);
    return idx >= 0 ? idx : 0;
  });
  const [editTurnTimer, setEditTurnTimer] = useState(room.settings.turnTimer);
  const [editWithBots, setEditWithBots] = useState(room.settings.withBots);
  const [editBotCount, setEditBotCount] = useState(room.settings.botCount || 1);
  const [editDeckStyle, setEditDeckStyle] = useState<DeckStyle>(room.settings.deckStyle);
  const [editIsPrivate, setEditIsPrivate] = useState(room.settings.isPrivate ?? false);
  const [editPassword, setEditPassword] = useState('');

  // Owned decks/playlists
  const { data: ownedDecks = [] } = trpc.shop.ownedDecks.useQuery();
  const isClassicDeckOwned = ownedDecks.includes('classic');

  const openSettings = useCallback(() => {
    // Reset to current room values each time
    setEditName(room.name);
    setEditMaxPlayers(String(room.maxPlayers));
    const idx = BET_AMOUNTS.indexOf(room.settings.betAmount as typeof BET_AMOUNTS[number]);
    setEditBetAmountIdx(idx >= 0 ? idx : 0);
    setEditTurnTimer(room.settings.turnTimer);
    setEditWithBots(room.settings.withBots);
    setEditBotCount(room.settings.botCount || 1);
    setEditDeckStyle(room.settings.deckStyle);
    setEditIsPrivate(room.settings.isPrivate ?? false);
    setEditPassword('');
    setSettingsOpen(true);
  }, [room]);

  const handleSave = useCallback(async () => {
    if (!onUpdateRoom) return;
    setSaving(true);
    try {
      const newSettings: Partial<RoomSettings> = {
        turnTimer: editTurnTimer,
        withBots: editWithBots,
        botCount: editWithBots ? editBotCount : 0,
        deckStyle: editDeckStyle,
        betAmount: BET_AMOUNTS[editBetAmountIdx],
        isPrivate: editIsPrivate,
      };
      // Only update password if user typed something
      if (editIsPrivate && editPassword.trim()) {
        newSettings.password = editPassword.trim();
      } else if (!editIsPrivate) {
        newSettings.password = undefined;
      }
      const ok = await onUpdateRoom({
        name: editName.trim() || room.name,
        maxPlayers: parseInt(editMaxPlayers),
        settings: newSettings,
      });
      if (ok) {
        toast.success(t('waitingRoom.settingsSaved'));
        setSettingsOpen(false);
      } else {
        toast.error(t('waitingRoom.settingsError'));
      }
    } catch {
      toast.error(t('waitingRoom.settingsError'));
    } finally {
      setSaving(false);
    }
  }, [onUpdateRoom, editName, editMaxPlayers, editBetAmountIdx, editTurnTimer, editWithBots, editBotCount, editDeckStyle, editIsPrivate, editPassword, room.name, t]);

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
              <Timer className="w-3 h-3 mr-0.5 sm:mr-1" /> {room.settings.turnTimer}{t('game.sec')}
            </Badge>
            {room.settings.withBots && (
              <Badge variant="outline" className="border-amber-700/30 text-amber-200/60 text-[10px] sm:text-xs">
                <Bot className="w-3 h-3 mr-0.5 sm:mr-1" /> {room.settings.botCount}
              </Badge>
            )}
            <Badge variant="outline" className="border-amber-700/30 text-amber-200/60 text-[10px] sm:text-xs">
              <Layers className="w-3 h-3 mr-0.5 sm:mr-1" /> {room.settings.deckStyle === 'custom' ? t('waitingRoom.deckN2') : t('waitingRoom.deckN1')}
            </Badge>
            <Badge variant="outline" className="border-amber-500/30 text-amber-300/70 text-[10px] sm:text-xs">
              <img src="/assets/static/shanyrak_96e91a49.png" alt="" className="w-3 h-3 mr-0.5 sm:mr-1" />
              {formatBalance(room.settings.betAmount || 100)}
            </Badge>
            {room.settings.playlistId && (
              <Badge variant="outline" className="border-purple-500/30 text-purple-300/70 text-[10px] sm:text-xs">
                <Music className="w-3 h-3 mr-0.5 sm:mr-1" /> {t('settings.playlist')}
              </Badge>
            )}
            {room.hasPassword && (
              <Badge variant="outline" className="border-amber-500/30 text-amber-400 text-[10px] sm:text-xs">
                <Lock className="w-3 h-3 mr-0.5 sm:mr-1" /> {t('waitingRoom.withPassword')}
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
                {!p.isBot && <DiamondRankIcon seasonRating={p.seasonRating ?? 0} size={13} showTooltip />}
                <span className="text-amber-100 font-medium text-sm sm:text-base truncate max-w-32 sm:max-w-none">{p.name}</span>
                {p.gameId && (
                  <span className="text-amber-200/30 text-[10px]">#{p.gameId}</span>
                )}
              </div>
              {p.isBot ? (
                <Badge className="bg-green-900/40 text-green-300 border-green-700/30 text-[10px] sm:text-xs">{t('waitingRoom.ready')}</Badge>
              ) : p.ready ? (
                <Badge className="bg-green-900/40 text-green-300 border-green-700/30 text-[10px] sm:text-xs">
                  <Check className="w-3 h-3 mr-0.5 sm:mr-1" /> {t('waitingRoom.ready')}
                </Badge>
              ) : (
                <Badge variant="outline" className="border-amber-700/30 text-amber-200/50 text-[10px] sm:text-xs">
                  <X className="w-3 h-3 mr-0.5 sm:mr-1" /> {t('waitingRoom.notReady')}
                </Badge>
              )}
            </div>
          ))}

          {/* Empty slots */}
          {Array.from({ length: room.maxPlayers - room.players.length }).map((_, i) => (
            <div key={`empty-${i}`} className="flex items-center justify-center px-3 sm:px-4 py-2 sm:py-3 rounded-xl border border-dashed border-amber-700/15 text-amber-200/20 text-xs sm:text-sm">
              {t('waitingRoom.waitingPlayers')}
            </div>
          ))}
        </div>

        {/* Invite friends button (host only, when room has space) */}
        {isHost && room.players.length < room.maxPlayers && (
          <div className="mb-3">
            <Button
              variant="outline"
              className="w-full border-amber-700/30 text-amber-200 hover:bg-amber-900/20 text-sm h-8 sm:h-9"
              onClick={() => setFriendsDrawerOpen(true)}
            >
              <UserPlus className="w-4 h-4 mr-1.5" /> {t('waitingRoom.inviteFriends')}
            </Button>
            <FriendsDrawer
              open={friendsDrawerOpen}
              onOpenChange={setFriendsDrawerOpen}
              onlineFriendIds={onlineFriendIds}
              onInviteFriend={onInviteFriend}
              inRoom={true}
            />
          </div>
        )}

        {/* Settings button — host only */}
        {isHost && onUpdateRoom && (
          <div className="mb-3">
            <Button
              variant="outline"
              className="w-full border-amber-700/30 text-amber-200 hover:bg-amber-900/20 text-sm h-8 sm:h-9"
              onClick={openSettings}
            >
              <Settings className="w-4 h-4 mr-1.5" /> {t('waitingRoom.settingsTitle')}
            </Button>
          </div>
        )}

        {/* My ID display */}
        {profile && (
          <div className="mb-3 text-center">
            <Badge variant="outline" className="border-amber-600/30 text-amber-300 text-xs px-2 py-0.5">
              <Hash className="w-3 h-3 mr-0.5" /> {t('waitingRoom.yourId')}: {profile.gameId}
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
                {t('waitingRoom.closeRoom')}
              </Button>
              <Button
                className={`flex-1 ${myPlayer?.ready ? 'bg-green-700 hover:bg-green-600' : 'bg-amber-600 hover:bg-amber-500'} text-white text-sm h-9 sm:h-10 order-2`}
                onClick={onToggleReady}
              >
                {myPlayer?.ready ? t('waitingRoom.notReadyBtn') : t('waitingRoom.readyBtn')}
              </Button>
              <Button
                className="flex-1 bg-amber-600 hover:bg-amber-500 text-white disabled:opacity-50 text-sm h-9 sm:h-10 order-1 sm:order-3"
                disabled={!allReady}
                onClick={onStartGame}
              >
                {t('waitingRoom.start')}
              </Button>
            </>
          ) : (
            <>
              <Button
                variant="outline"
                className="flex-1 border-amber-700/40 text-amber-200 hover:bg-amber-900/30 text-sm h-9 sm:h-10"
                onClick={onLeave}
              >
                {t('waitingRoom.leave')}
              </Button>
              <Button
                className={`flex-1 ${myPlayer?.ready ? 'bg-green-700 hover:bg-green-600' : 'bg-amber-600 hover:bg-amber-500'} text-white text-sm h-9 sm:h-10`}
                onClick={onToggleReady}
              >
                {myPlayer?.ready ? t('waitingRoom.notReadyBtn') : t('waitingRoom.readyBtn')}
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Room Settings Modal */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="bg-[#1a2d45] border-amber-700/30 text-amber-100 max-w-sm sm:max-w-md max-h-[90dvh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-amber-100">{t('waitingRoom.settingsTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {/* Room name */}
            <div>
              <Label className="text-amber-200/70 text-sm">{t('lobby.roomName')}</Label>
              <Input
                value={editName}
                onChange={e => setEditName(e.target.value)}
                className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 mt-1"
              />
            </div>

            {/* Max players */}
            <div>
              <Label className="text-amber-200/70 text-sm">{t('lobby.maxPlayers')}</Label>
              <Select value={editMaxPlayers} onValueChange={setEditMaxPlayers}>
                <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                  {[2, 3, 4, 5, 6, 7, 8].map(n => (
                    <SelectItem key={n} value={String(n)} className="text-amber-100">
                      {t('lobby.nPlayers', { n })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bet amount */}
            <div>
              <Label className="text-amber-200/70 text-sm flex items-center gap-1.5">
                <img src="/assets/static/shanyrak_96e91a49.png" alt="" className="w-4 h-4" />
                {t('lobby.bet')}: {formatBalance(BET_AMOUNTS[editBetAmountIdx])}
              </Label>
              <Slider
                value={[editBetAmountIdx]}
                onValueChange={v => setEditBetAmountIdx(v[0])}
                min={0}
                max={BET_AMOUNTS.length - 1}
                step={1}
                className="mt-2"
              />
              <div className="flex justify-between text-[10px] text-amber-200/40 mt-1">
                <span>{formatBalance(BET_AMOUNTS[0])}</span>
                <span>{formatBalance(BET_AMOUNTS[BET_AMOUNTS.length - 1])}</span>
              </div>
            </div>

            {/* Turn timer */}
            <div>
              <Label className="text-amber-200/70 text-sm">
                {t('lobby.turnTimer')}: {editTurnTimer}{t('roomCreate.seconds')}
              </Label>
              <Slider
                value={[editTurnTimer]}
                onValueChange={v => setEditTurnTimer(v[0])}
                min={30}
                max={60}
                step={5}
                className="mt-2"
              />
            </div>

            {/* Add bots */}
            <div className="flex items-center justify-between">
              <Label className="text-amber-200/70 text-sm">{t('lobby.addBots')}</Label>
              <Switch checked={editWithBots} onCheckedChange={setEditWithBots} />
            </div>

            {/* Bot count */}
            {editWithBots && (
              <div>
                <Label className="text-amber-200/70 text-sm">{t('lobby.botCount', { n: editBotCount })}</Label>
                <Slider
                  value={[editBotCount]}
                  onValueChange={v => setEditBotCount(v[0])}
                  min={1}
                  max={parseInt(editMaxPlayers) - 1}
                  step={1}
                  className="mt-2"
                />
              </div>
            )}

            {/* Deck style */}
            <div>
              <Label className="text-amber-200/70 text-sm">{t('lobby.deckStyle')}</Label>
              <Select
                value={editDeckStyle}
                onValueChange={(v) => {
                  if (v === 'classic' && !isClassicDeckOwned) return;
                  setEditDeckStyle(v as DeckStyle);
                }}
              >
                <SelectTrigger className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[#1a2d45] border-amber-700/30">
                  <SelectItem value="custom" className="text-amber-100">
                    {t('lobby.deckCustom')}
                  </SelectItem>
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

            {/* Private room */}
            <div className="flex items-center justify-between">
              <Label className="text-amber-200/70 text-sm flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" /> {t('lobby.privateRoom')}
              </Label>
              <Switch checked={editIsPrivate} onCheckedChange={setEditIsPrivate} />
            </div>

            {/* Password */}
            {editIsPrivate && (
              <div>
                <Label className="text-amber-200/70 text-sm">{t('lobby.roomPassword')}</Label>
                <Input
                  type="password"
                  value={editPassword}
                  onChange={e => setEditPassword(e.target.value)}
                  placeholder={room.hasPassword
                    ? t('waitingRoom.newPasswordPlaceholder')
                    : t('lobby.enterPassword')
                  }
                  className="bg-[#0f2035] border-amber-700/30 text-amber-100 h-9 mt-1"
                />
              </div>
            )}
          </div>
          <DialogFooter className="gap-2 flex-col sm:flex-row">
            <Button
              variant="outline"
              className="border-amber-700/30 text-amber-200 hover:bg-amber-900/20"
              onClick={() => setSettingsOpen(false)}
              disabled={saving}
            >
              {t('common.cancel')}
            </Button>
            <Button
              className="bg-amber-600 hover:bg-amber-500 text-white"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? t('waitingRoom.saving') : t('common.save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
