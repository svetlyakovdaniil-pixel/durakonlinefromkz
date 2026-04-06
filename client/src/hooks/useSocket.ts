import { useState, useRef, useEffect, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { trpc } from '@/lib/trpc';
import type {
  ServerToClientEvents, ClientToServerEvents,
  Room, ClientGameState, AvailableAction, RoomSettings,
} from '../../../shared/gameTypes';
import { SUIT_SYMBOLS } from '../../../shared/cardAssets';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(userId: string | null, userName: string | null) {
  const socketRef = useRef<TypedSocket | null>(null);
  const trpcUtils = trpc.useUtils();
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

  // Track the room ID we're currently in for reconnect
  const currentRoomIdRef = useRef<string | null>(null);
  // Flag to prevent game state updates after leaving (temporary)
  const leavingRef = useRef(false);
  // Persistent set of room IDs we intentionally left — blocks rejoin/updates permanently
  const blockedRoomIdsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId) return;

    const socket: TypedSocket = io({
      path: '/api/socket.io',
      auth: { odId: userId, name: userName || 'Гость' },
      transports: ['websocket', 'polling'],
      upgrade: true,
      rememberUpgrade: true,
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 300,
      reconnectionDelayMax: 3000,
      randomizationFactor: 0.3,
      timeout: 30000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
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
                toast.success('Переподключение успешно!', { duration: 3000 });
              } else if (attempt < 5) {
                const delay = Math.min(attempt * 800, 3000);
                console.log(`[Socket] Rejoin attempt ${attempt} failed, retrying in ${delay}ms...`);
                setTimeout(() => attemptRejoin(attempt + 1), delay);
              } else {
                console.log(`[Socket] Failed to rejoin room ${roomId} after ${attempt} attempts`);
                toast.error('Не удалось переподключиться к игре. Попробуйте найти комнату в лобби.', { duration: 6000 });
                currentRoomIdRef.current = null;
                setCurrentRoom(null);
                setGameState(null);
                setAvailableActions([]);
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
      if (currentRoomIdRef.current) {
        toast.warning('Соединение потеряно — переподключение...', { duration: 5000 });
      }
    });

    socket.io.on('reconnect_attempt', (attempt) => {
      console.log(`[Socket] Reconnect attempt ${attempt}`);
    });

    socket.io.on('reconnect_failed', () => {
      toast.error('Не удалось переподключиться. Обновите страницу.', { duration: 10000 });
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
      const suitNames: Record<string, string> = {
        spades: 'Пики', hearts: 'Черви', diamonds: 'Бубны', clubs: 'Трефы',
      };
      const suitName = suitNames[info.newTrump] || info.newTrump;
      toast.warning(`🃏 Козырь изменился! Новый козырь: ${sym} ${suitName} (Фаза ${info.phase}/3)`, {
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
      toast.info(`Направление изменилось ${arrow}`, { duration: 3000 });
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
      currentRoomIdRef.current = null;
      setCurrentRoom(null);
      setGameState(null);
      setAvailableActions([]);
      setChatMessages([]);
      setGameOverData(null);
      setPrizeData(null);
      if (data.reason === 'disconnect_timeout') {
        toast.error('Вы были удалены из игры из-за долгого отсутствия соединения', { duration: 6000 });
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
      toast.error(`${data.declinedByName} (# ${data.declinedByGameId}) отклонил приглашение в комнату`, { duration: 5000 });
    });

    // Online friends update
    socket.on('onlineFriendsUpdate', (data) => {
      setOnlineFriendIds(data.onlineGameIds);
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
      toast.success(`${data.reconnectedPlayerName} вернулся в игру!`, { duration: 3000 });
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, userName]);

  // Register profile with socket server (called from Home when profile loads)
  const registerProfile = useCallback((gameId: number, displayName: string, avatarId?: string) => {
    socketRef.current?.emit('registerProfile', { gameId, displayName, avatarId }, (ok: boolean) => {
      if (ok) console.log(`[Socket] Profile registered: gameId=${gameId}`);
    });
  }, []);

  const createRoom = useCallback((name: string, maxPlayers: number, settings: RoomSettings): Promise<Room> => {
    return new Promise((resolve) => {
      leavingRef.current = false;
      socketRef.current?.emit('createRoom', { name, maxPlayers, settings }, (room) => {
        setCurrentRoom(room);
        currentRoomIdRef.current = room.id;
        resolve(room);
      });
    });
  }, []);

  const joinRoom = useCallback((roomId: string, password?: string): Promise<boolean> => {
    return new Promise((resolve) => {
      leavingRef.current = false;
      blockedRoomIdsRef.current.delete(roomId);
      socketRef.current?.emit('joinRoom', { roomId, password }, (ok, room) => {
        if (ok && room) {
          setCurrentRoom(room);
          currentRoomIdRef.current = room.id;
        }
        resolve(ok);
      });
    });
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('leaveRoom', roomId);
    currentRoomIdRef.current = null;
    setCurrentRoom(null);
    setGameState(null);
    setAvailableActions([]);
    setChatMessages([]);
    setGameOverData(null);
    setPrizeData(null);
  }, []);

  const leaveGame = useCallback((roomId: string) => {
    leavingRef.current = true;
    blockedRoomIdsRef.current.add(roomId);

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
  }, []);

  const closeRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('closeRoom', roomId);
    currentRoomIdRef.current = null;
    setCurrentRoom(null);
    setGameState(null);
    setAvailableActions([]);
    setChatMessages([]);
    setGameOverData(null);
    setPrizeData(null);
  }, []);

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

  const showPassThrough = useCallback((roomId: string, cardId: string) => {
    socketRef.current?.emit('showPassThrough', { roomId, cardId });
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

  const inviteFriend = useCallback((roomId: string, targetGameId: number) => {
    socketRef.current?.emit('inviteFriend', { roomId, targetGameId });
    toast.success('Приглашение отправлено!', { duration: 3000 });
  }, []);

  const declineInvite = useCallback((roomId: string, fromGameId: number) => {
    socketRef.current?.emit('declineInvite', { roomId, fromGameId });
  }, []);

  const returnToLobby = useCallback(() => {
    currentRoomIdRef.current = null;
    setCurrentRoom(null);
    setGameState(null);
    setAvailableActions([]);
    setChatMessages([]);
    setGameOverData(null);
    setPrizeData(null);
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
    showPassThrough,
    takeCards: takeCardsAction,
    passTurn,
    endAttack,
    skipTurn,
    sendChat,
    inviteFriend,
    declineInvite,
    registerProfile,
    returnToLobby,
    clearError: () => setError(null),
  };
}
