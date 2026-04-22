import { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import type {
  ServerToClientEvents, ClientToServerEvents,
  Room, ClientGameState, AvailableAction, RoomSettings,
} from '../../../shared/gameTypes';
import { SUIT_SYMBOLS } from '../../../shared/cardAssets';
import { useTranslation } from '@/i18n';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(userId: string | null, userName: string | null) {
  const socketRef = useRef<TypedSocket | null>(null);
  const trpcUtils = trpc.useUtils();
  const { t } = useTranslation();
  const tRef = useRef(t);
  tRef.current = t;
  const trpcUtilsRef = useRef(trpcUtils);
  trpcUtilsRef.current = trpcUtils;
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [availableActions, setAvailableActions] = useState<AvailableAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string; ts: number }[]>([]);
  const [turnTimer, setTurnTimer] = useState(0);
  const [gameOverData, setGameOverData] = useState<{ winnersOrder: string[]; loserId: string | null } | null>(null);
  const [prizeData, setPrizeData] = useState<{ pool: number; prizes: { playerId: string; place: number; amount: number }[] } | null>(null);
  const [onlineFriendIds, setOnlineFriendIds] = useState<number[]>([]);
  const [pendingInvite, setPendingInvite] = useState<{
    roomId: string; roomName: string; fromName: string; fromGameId: number;
  } | null>(null);
  const [frozenInfo, setFrozenInfo] = useState<{
    disconnectedPlayerName: string; secondsLeft: number;
  } | null>(null);
  // Active emotions: playerId -> { emotionId, emotionPackId, expiresAt }
  const [playerEmotions, setPlayerEmotions] = useState<Record<string, { emotionId: string; emotionPackId?: string; expiresAt: number }>>({});

  // Track the room ID we're currently in for reconnect
  const currentRoomIdRef = useRef<string | null>(null);
  // Flag to prevent game state updates after leaving (temporary)
  const leavingRef = useRef(false);
  // Persistent set of room IDs we intentionally left — blocks rejoin/updates permanently
  const blockedRoomIdsRef = useRef<Set<string>>(new Set());

  // ─── localStorage helpers for cross-page-reload reconnect ─────────────────────────────
  // When the page is closed/refreshed (e.g. Safari on iPhone kills the tab),
  // currentRoomIdRef is lost. We persist it to localStorage so the lobby can
  // show a "return to game" banner within the 30-second grace period.
  const RECONNECT_WINDOW_MS = 30_000;
  const getStorageKeys = () => ({
    room: `durak_active_room_${userId || 'anon'}`,
    ts: `durak_active_room_ts_${userId || 'anon'}`,
  });
  const persistActiveRoom = useCallback((roomId: string | null, intentional = false) => {
    const { room: roomKey, ts: tsKey } = getStorageKeys();
    if (roomId && !intentional) {
      localStorage.setItem(roomKey, roomId);
      localStorage.setItem(tsKey, Date.now().toString());
    } else {
      localStorage.removeItem(roomKey);
      localStorage.removeItem(tsKey);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);
  // ────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!userId) return;

    const socket: TypedSocket = io({
      path: '/api/socket.io',
      auth: { odId: userId, name: userName || tRef.current('socket.guest') },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 500,       // start with 500ms delay
      reconnectionDelayMax: 5000,    // max 5s between reconnect attempts
      randomizationFactor: 0.5,      // more jitter to avoid thundering herd
      timeout: 45000,                // 45s connection timeout (match server)
      // Force new connection on reconnect to avoid stale transport
      forceNew: false,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // Clear the send buffer to prevent stale game actions (e.g. playCard) from being
      // re-sent after reconnect. The server will send the authoritative game state via
      // auto-rejoin, so replaying buffered actions would cause 'Card not in hand' errors.
      if ((socket as any).sendBuffer && Array.isArray((socket as any).sendBuffer)) {
        const staleGameEvents = ['playCard', 'transferCard', 'transferCards', 'showPassThrough', 'showPassThroughs', 'endAttack', 'passTurn', 'takeCards'];
        const before = (socket as any).sendBuffer.length;
        (socket as any).sendBuffer = (socket as any).sendBuffer.filter(
          (item: any) => !staleGameEvents.includes(item[0])
        );
        const cleared = before - (socket as any).sendBuffer.length;
        if (cleared > 0) console.log(`[Socket] Cleared ${cleared} stale game action(s) from sendBuffer on reconnect`);
      }
      // On reconnect, try to rejoin the room we were in
      const roomId = currentRoomIdRef.current;
      if (roomId && !leavingRef.current && !blockedRoomIdsRef.current.has(roomId)) {
        console.log(`[Socket] Reconnected — attempting to rejoin room ${roomId}`);
        
        setTimeout(() => {
          if (currentRoomIdRef.current !== roomId) return;
          
          const attemptRejoin = (attempt: number) => {
            if (currentRoomIdRef.current !== roomId) return;
            if (leavingRef.current || blockedRoomIdsRef.current.has(roomId)) return;
            
            socket.emit('rejoinRoom', roomId, (ok: boolean, room: any) => {
              if (ok && room) {
                setCurrentRoom(room);
                toast.success(tRef.current('socket.reconnectSuccess'), { duration: 3000 });
              } else if (attempt < 2) {
                // Only retry once more — server may still be starting up
                // Stop immediately if another room was joined in the meantime
                if (currentRoomIdRef.current !== roomId) return;
                const delay = 800;
                console.log(`[Socket] Rejoin attempt ${attempt} failed, retrying in ${delay}ms...`);
                setTimeout(() => attemptRejoin(attempt + 1), delay);
              } else {
                // Room no longer exists (server restarted or room expired) — clear state
                // immediately so the player can freely join a new room without conflicts
                console.log(`[Socket] Room ${roomId} not found — server may have restarted, clearing state`);
                if (currentRoomIdRef.current === roomId) {
                  currentRoomIdRef.current = null;
                  persistActiveRoom(null, true); // clear localStorage too
                  setCurrentRoom(null);
                  setGameState(null);
                  setAvailableActions([]);
                  blockedRoomIdsRef.current.add(roomId); // block stale events for this room
                }
              }
            });
          };
          
          attemptRejoin(1);
        }, 300);
      }
    });

    socket.on('disconnect', (reason) => {
      setConnected(false);
      console.log(`[Socket] Disconnected: ${reason}`);
      
      // Only show toast if in a room (not for normal page navigation)
      if (currentRoomIdRef.current && !leavingRef.current) {
        toast.warning(tRef.current('socket.connectionLost'), { duration: 5000 });
      }

      // CRITICAL FIX: Freeze the turn timer on disconnect.
      // Without this the timer display freezes on the last received value, which is
      // confusing — it looks like the timer is still running but nothing responds.
      // We set it to a high value so the player doesn't feel urgency while reconnecting.
      // The server will send the authoritative value via gameStateUpdate on reconnect.
      if (currentRoomIdRef.current && !leavingRef.current) {
        setTurnTimer(99); // Show "--" / frozen state via GameTable
      }

      // If server disconnected us (not transport issue), force reconnect
      if (reason === 'io server disconnect') {
        // Server explicitly disconnected us — reconnect manually
        socket.connect();
      }
      // 'transport close' and 'ping timeout' are handled automatically by reconnection: true
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`[Socket] Reconnect attempt ${attempt}`);
    });

    socket.io.on('reconnect', (attempt) => {
      console.log(`[Socket] Reconnected after ${attempt} attempts`);
    });

    socket.io.on('reconnect_error', (error) => {
      console.log(`[Socket] Reconnect error:`, error.message);
    });

    socket.io.on('reconnect_failed', () => {
      toast.error(tRef.current('socket.reconnectPageFailed'), { duration: 10000 });
    });

    // Handle connection errors (e.g., network offline)
    socket.on('connect_error', (error) => {
      console.log(`[Socket] Connection error: ${error.message}`);
    });

    socket.on('roomList', (r) => setRooms(r));
    socket.on('roomUpdated', (r) => {
      if (leavingRef.current) return;
      if (r && r.id && blockedRoomIdsRef.current.has(r.id)) {
        console.log(`[Socket] Ignoring roomUpdated for blocked room ${r.id}`);
        return;
      }
      setCurrentRoom(r);
    });
    socket.on('roomClosed', () => {
      currentRoomIdRef.current = null;
      setCurrentRoom(null);
      setGameState(null);
      setAvailableActions([]);
      setChatMessages([]);
      setGameOverData(null);
      setPrizeData(null);
    });
    socket.on('gameStarted', (s) => {
      if (leavingRef.current) return;
      if (s && s.roomId && blockedRoomIdsRef.current.has(s.roomId)) {
        console.log(`[Socket] Ignoring gameStarted for blocked room`);
        return;
      }
      setGameState(s);
      setAvailableActions(s.availableActions || []);
      setTurnTimer(s.turnTimerMax);
      setGameOverData(null);
      setPrizeData(null);
    });
    socket.on('gameStateUpdate', (s) => {
      if (leavingRef.current) return;
      if (s && s.roomId && blockedRoomIdsRef.current.has(s.roomId)) {
        console.log(`[Socket] Ignoring gameStateUpdate for blocked room`);
        return;
      }
      if (!currentRoomIdRef.current) {
        console.log(`[Socket] Ignoring gameStateUpdate — no current room (in lobby)`);
        return;
      }
      setGameState(s);
      setTurnTimer(s.turnTimer);
      setAvailableActions(s.availableActions || []);
    });
    socket.on('yourTurn', (a) => {
      if (leavingRef.current) return;
      if (!currentRoomIdRef.current) return;
      setAvailableActions(a);
    });
    socket.on('error', (msg) => {
      setError(msg);
      toast.error(msg, { duration: 4000 });
    });
    socket.on('chatMessage', (msg) => setChatMessages(prev => [...prev.slice(-99), msg]));
    socket.on('timerUpdate', (seconds) => {
      if (leavingRef.current) return;
      if (!currentRoomIdRef.current) return;
      setTurnTimer(seconds);
    });

    socket.on('playerJoined', (player) => {
      console.log(`Player joined: ${player.name}`);
    });
    socket.on('playerLeft', (playerId) => {
      console.log(`Player left: ${playerId}`);
    });
    socket.on('trumpChanged', (info) => {
      const sym = SUIT_SYMBOLS[info.newTrump] || info.newTrump;
      const suitKeyMap: Record<string, string> = {
        spades: 'game.suitSpades', hearts: 'game.suitHearts', diamonds: 'game.suitDiamonds', clubs: 'game.suitClubs',
      };
      const suitName = tRef.current(suitKeyMap[info.newTrump] || info.newTrump);
      toast.warning(tRef.current('socket.trumpChanged', { sym, suit: suitName, phase: String(info.phase) }), {
        duration: 6000,
        style: {
          fontSize: '16px',
          fontWeight: 'bold',
          background: '#1a2d45',
          border: '2px solid #d97706',
          color: '#fde68a',
        },
      });
    });
    socket.on('directionChanged', (dir) => {
      const arrow = dir === 'cw' ? '➡️' : '⬅️';
      toast.info(tRef.current('socket.directionChanged', { arrow }), { duration: 3000 });
    });
    socket.on('gameOver', (data) => {
      if (leavingRef.current) return;
      if (!currentRoomIdRef.current) return;
      setGameOverData(data);
    });
    socket.on('prizeDistributed', (data) => {
      setPrizeData(data);
    });
    socket.on('transferChoice', () => {
      // Transfer choice is handled via gameStateUpdate
    });

    // Server forces us back to lobby (e.g. disconnect timeout expired)
    socket.on('forcedToLobby', (data) => {
      console.log(`[Socket] Forced to lobby: ${data.reason}`);
      // NOTE: do NOT call persistActiveRoom(null) here — we keep the stored roomId
      // so the lobby can show the "return to game" banner for 30 seconds.
      // The timestamp was already set when we joined; it will expire naturally.
      currentRoomIdRef.current = null;
      setCurrentRoom(null);
      setGameState(null);
      setAvailableActions([]);
      setChatMessages([]);
      setGameOverData(null);
      setPrizeData(null);
      if (data.reason === 'disconnect_timeout') {
        toast.error(tRef.current('socket.forcedToLobby'), { duration: 6000 });
      }
    });

    // Achievement unlocked — show in-game toast
    socket.on('achievementUnlocked', (data) => {
      const locale = (document.documentElement.lang || 'ru') as string;
      const name = locale === 'kk' ? data.nameKk : locale === 'en' ? data.nameEn : locale === 'uk' ? (data as any).nameUk ?? data.nameRu : locale === 'ka' ? (data as any).nameKa ?? data.nameRu : locale === 'az' ? (data as any).nameAz ?? data.nameRu : locale === 'uz' ? (data as any).nameUz ?? data.nameRu : locale === 'pl' ? (data as any).namePl ?? data.nameRu : data.nameRu;
      const shanyrakText = data.shanyrakReward > 0 ? ` +${data.shanyrakReward} ш.` : '';
      toast.success(`🏆 ${name}${shanyrakText}`, {
        description: locale === 'kk' ? 'Жетістік ашылды!' : locale === 'en' ? 'Achievement unlocked!' : locale === 'uk' ? 'Досягнення розблоковано!' : locale === 'ka' ? 'მიღწევა განბლოკილია!' : locale === 'az' ? 'Nailiyyət açıldı!' : locale === 'uz' ? 'Yutuq ochildi!' : locale === 'pl' ? 'Osiągnięcie odblokowane!' : 'Достижение разблокировано!',
        duration: 5000,
      });
      // Invalidate achievements so badge updates
      if (trpcUtilsRef.current) {
        trpcUtilsRef.current.achievements.unclaimedCount.invalidate();
      }
    });

    // Daily quest completed — show in-game toast
    socket.on('questCompleted', (data) => {
      const locale = (document.documentElement.lang || 'ru') as string;
      const title = locale === 'kk' ? data.titleKk : locale === 'en' ? data.titleEn : locale === 'uk' ? (data as any).titleUk ?? data.titleRu : locale === 'ka' ? (data as any).titleKa ?? data.titleRu : locale === 'az' ? (data as any).titleAz ?? data.titleRu : locale === 'uz' ? (data as any).titleUz ?? data.titleRu : locale === 'pl' ? (data as any).titlePl ?? data.titleRu : data.titleRu;
      const shanyrakText = data.shanyrakReward > 0 ? ` +${data.shanyrakReward} ш.` : '';
      toast.success(`✅ ${title}${shanyrakText}`, {
        description: locale === 'kk' ? 'Күнделікті тапсырма орындалды!' : locale === 'en' ? 'Daily quest completed!' : locale === 'uk' ? 'Щоденне завдання виконано!' : locale === 'ka' ? 'ყოველდღიური დავალება შესრულდა!' : locale === 'az' ? 'Gündəlik tapşırıq tamamlandı!' : locale === 'uz' ? 'Kunlik topshiriq bajarildi!' : locale === 'pl' ? 'Dzienne zadanie ukończone!' : 'Ежедневное задание выполнено!',
        duration: 5000,
      });
      // Invalidate daily quests so badge updates
      if (trpcUtilsRef.current) {
        trpcUtilsRef.current.dailyQuests.unclaimedCount.invalidate();
      }
    });

    // Balance updated in real-time
    socket.on('balanceUpdated', () => {
      // Invalidate profile query so balance refreshes everywhere
      if (trpcUtilsRef.current) {
        trpcUtilsRef.current.profile.me.invalidate();
      }
    });

    // New notification received in real-time
    socket.on('newNotification', () => {
      if (trpcUtilsRef.current) {
        trpcUtilsRef.current.notifications.unreadCount.invalidate();
        trpcUtilsRef.current.notifications.list.invalidate();
      }
    });

    // Room invitation from a friend
    socket.on('roomInvite', (data) => {
      console.log('[Socket] Received roomInvite:', data);
      setPendingInvite(data);
    });

    // Invite was declined by the target player
    socket.on('inviteDeclined', (data) => {
      toast.error(tRef.current('socket.inviteDeclined', { name: data.declinedByName, id: String(data.declinedByGameId) }), { duration: 5000 });
    });

    // Online friends update
    socket.on('onlineFriendsUpdate', (data) => {
      setOnlineFriendIds(data.onlineGameIds);
    });

    // Player emotion reactions
    socket.on('playerEmotion', (data) => {
      const expiresAt = Date.now() + 3500; // show for 3.5 seconds
      setPlayerEmotions(prev => ({ ...prev, [data.playerId]: { emotionId: data.emotionId, emotionPackId: data.emotionPackId, expiresAt } }));
      setTimeout(() => {
        setPlayerEmotions(prev => {
          const next = { ...prev };
          if (next[data.playerId]?.expiresAt === expiresAt) delete next[data.playerId];
          return next;
        });
      }, 3500);
    });

    // Room freeze/unfreeze events
    socket.on('roomFrozen', (data) => {
      console.log(`[Socket] Room ${data.roomId} frozen — ${data.disconnectedPlayerName} disconnected`);
      setFrozenInfo({
        disconnectedPlayerName: data.disconnectedPlayerName,
        secondsLeft: data.timeoutSeconds,
      });
    });
    socket.on('frozenTimerTick', (data) => {
      setFrozenInfo(prev => prev ? { ...prev, secondsLeft: data.secondsLeft } : null);
    });
    socket.on('roomUnfrozen', (data) => {
      console.log(`[Socket] Room ${data.roomId} unfrozen — ${data.reconnectedPlayerName} reconnected`);
      setFrozenInfo(null);
      toast.success(tRef.current('socket.playerReconnected', { name: data.reconnectedPlayerName }), { duration: 3000 });
    });

    // Handle page visibility changes (critical for mobile — OS suspends WebSocket when app goes to background)
    let lastVisibleTime = Date.now();
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const hiddenDuration = Date.now() - lastVisibleTime;
        console.log(`[Socket] Page became visible after ${Math.round(hiddenDuration / 1000)}s`);
        
        if (socket.disconnected) {
          console.log('[Socket] Socket disconnected — forcing reconnect');
          socket.connect();
        } else if (hiddenDuration > 120000) {
          // If hidden for >2 minutes, the WebSocket transport is likely stale
          // Force a disconnect+reconnect to get a fresh connection
          console.log('[Socket] Hidden for >2min — forcing fresh reconnect to avoid stale transport');
          socket.disconnect();
          setTimeout(() => socket.connect(), 100);
        } else if (hiddenDuration > 10000) {
          // Medium background (10s-2min) — verify connection without forcing reconnect
          console.log('[Socket] Medium background — verifying connection with ping');
          // CRITICAL FIX: Use regular emit (not volatile) so the ping is NOT dropped
          // if the connection is slightly unstable. Volatile emits are silently discarded
          // when the socket is not in a connected/ready state, causing false "no pong" timeouts.
          socket.emit('ping_check' as any);
          socket.emit('requestRoomList');
          // If no pong received within 8s (increased from 5s), force reconnect
          const pongTimeout = setTimeout(() => {
            if (socket.connected) {
              console.log('[Socket] No pong after 8s — connection may be stale, forcing reconnect');
              socket.disconnect();
              setTimeout(() => socket.connect(), 100);
            }
          }, 8000);
          socket.once('pong_check' as any, () => {
            clearTimeout(pongTimeout);
            console.log('[Socket] Pong received — connection is alive');
          });
        } else {
          // Short background — just verify connection is alive
          console.log('[Socket] Short background — verifying connection');
          socket.volatile.emit('ping_check' as any);
          // Also request fresh room list in case we missed updates
          socket.emit('requestRoomList');
        }
      } else {
        lastVisibleTime = Date.now();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    // Also handle online/offline events
    const handleOnline = () => {
      console.log('[Socket] Network came online');
      if (socket.disconnected) {
        socket.connect();
      } else {
        // Network restored but socket thinks it's connected — verify
        socket.volatile.emit('ping_check' as any);
      }
    };
    window.addEventListener('online', handleOnline);

    // Application-level heartbeat: verify connection is alive every 20s
    // This catches "zombie" connections where Socket.IO thinks it's connected but data isn't flowing
    const heartbeatInterval = setInterval(() => {
      if (socket.connected && currentRoomIdRef.current) {
        socket.volatile.emit('ping_check' as any);
      }
    }, 20000);

    return () => {
      clearInterval(heartbeatInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('online', handleOnline);
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, userName]);

  // Register profile with socket server (called from Home when profile loads)
  const registerProfile = useCallback((gameId: number, displayName: string, avatarId?: string, equippedFrame?: string | null, isPremium?: boolean, seasonRating?: number) => {
    socketRef.current?.emit('registerProfile', { gameId, displayName, avatarId, equippedFrame, isPremium, seasonRating }, (ok: boolean) => {
      if (ok) console.log(`[Socket] Profile registered: gameId=${gameId}`);
    });
  }, []);

  const createRoom = useCallback((name: string, maxPlayers: number, settings: RoomSettings): Promise<Room> => {
    return new Promise((resolve) => {
      leavingRef.current = false;
      socketRef.current?.emit('createRoom', { name, maxPlayers, settings }, (room) => {
        setCurrentRoom(room);
        currentRoomIdRef.current = room.id;
        persistActiveRoom(room.id);
        resolve(room);
      });
    });
  }, [persistActiveRoom]);

  const joinRoom = useCallback((roomId: string, password?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      leavingRef.current = false;
      // If we were trying to rejoin a different room (e.g. after server restart),
      // block that old room so stale events from it don't interfere with the new room.
      const prevRoomId = currentRoomIdRef.current;
      if (prevRoomId && prevRoomId !== roomId) {
        console.log(`[Socket] joinRoom: blocking stale room ${prevRoomId} before joining ${roomId}`);
        blockedRoomIdsRef.current.add(prevRoomId);
        currentRoomIdRef.current = null;
        persistActiveRoom(null, true);
      }
      blockedRoomIdsRef.current.delete(roomId);
      socketRef.current?.emit('joinRoom', { roomId, password }, (ok, room) => {
        if (ok && room) {
          setCurrentRoom(room);
          currentRoomIdRef.current = room.id;
          persistActiveRoom(room.id);
        }
        resolve(ok);
      });
    });
  }, [persistActiveRoom]);

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('leaveRoom', roomId);
    currentRoomIdRef.current = null;
    persistActiveRoom(null, true); // intentional leave
    setCurrentRoom(null);
    setGameState(null);
    setAvailableActions([]);
    setChatMessages([]);
    setGameOverData(null);
    setPrizeData(null);
  }, [persistActiveRoom]);

  const leaveGame = useCallback((roomId: string) => {
    leavingRef.current = true;
    blockedRoomIdsRef.current.add(roomId);
    persistActiveRoom(null, true); // intentional leave

    const doReturnToLobby = () => {
      currentRoomIdRef.current = null;
      setCurrentRoom(null);
      setGameState(null);
      setAvailableActions([]);
      setChatMessages([]);
      setGameOverData(null);
      setPrizeData(null);
      setTimeout(() => { leavingRef.current = false; }, 10000);
    };

    socketRef.current?.emit('leaveGame', roomId, (result: { ok: boolean }) => {
      doReturnToLobby();
    });

    setTimeout(() => {
      if (leavingRef.current) {
        doReturnToLobby();
      }
    }, 2000);
  }, [persistActiveRoom]);

  const closeRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('closeRoom', roomId);
    currentRoomIdRef.current = null;
    persistActiveRoom(null, true); // intentional close
    setCurrentRoom(null);
    setGameState(null);
    setAvailableActions([]);
    setChatMessages([]);
    setGameOverData(null);
    setPrizeData(null);
  }, [persistActiveRoom]);

  const toggleReady = useCallback((roomId: string) => {
    socketRef.current?.emit('toggleReady', roomId);
  }, []);

  const startGame = useCallback((roomId: string) => {
    socketRef.current?.emit('startGame', roomId);
  }, []);

  const playCard = useCallback((roomId: string, cardId: string, targetPairIdx?: number) => {
    socketRef.current?.emit('playCard', { roomId, cardId, targetPairIdx });
  }, []);

  const transferCard = useCallback((roomId: string, cardId: string) => {
    socketRef.current?.emit('transferCard', { roomId, cardId });
  }, []);

  const transferCards = useCallback((roomId: string, cardIds: string[]) => {
    socketRef.current?.emit('transferCards', { roomId, cardIds });
  }, []);

  const showPassThrough = useCallback((roomId: string, cardId: string) => {
    socketRef.current?.emit('showPassThrough', { roomId, cardId });
  }, []);

  const showPassThroughs = useCallback((roomId: string, cardIds: string[]) => {
    socketRef.current?.emit('showPassThroughs', { roomId, cardIds });
  }, []);

  const takeCardsAction = useCallback((roomId: string) => {
    socketRef.current?.emit('takeCards', roomId);
  }, []);

  const passTurn = useCallback((roomId: string) => {
    socketRef.current?.emit('passTurn', roomId);
  }, []);

  const endAttack = useCallback((roomId: string) => {
    socketRef.current?.emit('endAttack', roomId);
  }, []);

  const skipTurn = useCallback((roomId: string) => {
    socketRef.current?.emit('skipTurn', roomId);
  }, []);

  const sendChat = useCallback((roomId: string, text: string) => {
    socketRef.current?.emit('sendChat', { roomId, text });
  }, []);

  const sendEmotion = useCallback((roomId: string, emotionId: string) => {
    socketRef.current?.emit('sendEmotion', { roomId, emotionId });
  }, []);

  const inviteFriend = useCallback((roomId: string, targetGameId: number) => {
    socketRef.current?.emit('inviteFriend', { roomId, targetGameId });
    toast.success(tRef.current('socket.inviteSent'), { duration: 3000 });
  }, []);

  const declineInvite = useCallback((roomId: string, fromGameId: number) => {
    socketRef.current?.emit('declineInvite', { roomId, fromGameId });
  }, []);

  const returnToLobby = useCallback(() => {
    // Also notify server so the room gets cleaned up when all players leave
    const roomId = currentRoomIdRef.current;
    if (roomId) {
      socketRef.current?.emit('leaveRoom', roomId);
    }
    currentRoomIdRef.current = null;
    persistActiveRoom(null, true); // intentional return
    setCurrentRoom(null);
    setGameState(null);
    setAvailableActions([]);
    setChatMessages([]);
    setGameOverData(null);
    setPrizeData(null);
  }, [persistActiveRoom]);

  const requestRoomList = useCallback(() => {
    socketRef.current?.emit('requestRoomList');
  }, []);

  const updateRoom = useCallback((data: { roomId: string; name?: string; maxPlayers?: number; settings?: Partial<RoomSettings> }): Promise<boolean> => {
    return new Promise((resolve) => {
      if (!socketRef.current) { resolve(false); return; }
      socketRef.current.emit('updateRoom', data, (ok, room) => {
        if (ok && room) {
          setCurrentRoom(room);
        }
        resolve(ok);
      });
    });
  }, []);

  return {
    connected,
    rooms,
    currentRoom,
    gameState,
    availableActions,
    error,
    chatMessages,
    turnTimer,
    gameOverData,
    prizeData,
    onlineFriendIds,
    pendingInvite,
    setPendingInvite,
    frozenInfo,
    createRoom,
    joinRoom,
    leaveRoom,
    leaveGame,
    closeRoom,
    toggleReady,
    startGame,
    playCard,
    transferCard,
    transferCards,
    showPassThrough,
    showPassThroughs,
    takeCards: takeCardsAction,
    passTurn,
    endAttack,
    skipTurn,
    sendChat,
    inviteFriend,
    declineInvite,
    registerProfile,
    returnToLobby,
    requestRoomList,
    updateRoom,
    clearError: () => setError(null),
    playerEmotions,
    sendEmotion,
    // Exposed for lobby reconnect banner
    RECONNECT_WINDOW_MS,
    getStorageKeys,
    persistActiveRoom,
  };
}
