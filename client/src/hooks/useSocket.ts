import { useEffect, useRef, useState, useCallback } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import type {
  ServerToClientEvents, ClientToServerEvents,
  Room, ClientGameState, AvailableAction, RoomSettings,
} from '../../../shared/gameTypes';
import { SUIT_SYMBOLS } from '../../../shared/cardAssets';

type TypedSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export function useSocket(userId: string | null, userName: string | null) {
  const socketRef = useRef<TypedSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [currentRoom, setCurrentRoom] = useState<Room | null>(null);
  const [gameState, setGameState] = useState<ClientGameState | null>(null);
  const [availableActions, setAvailableActions] = useState<AvailableAction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<{ from: string; text: string; ts: number }[]>([]);
  const [turnTimer, setTurnTimer] = useState(0);
  const [gameOverData, setGameOverData] = useState<{ winnersOrder: string[]; loserId: string | null } | null>(null);

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
      reconnectionDelay: 500,
      reconnectionDelayMax: 5000,
      timeout: 45000,
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      setConnected(true);
      // On reconnect, try to rejoin the room we were in
      // But NOT if we intentionally left the game
      const roomId = currentRoomIdRef.current;
      if (roomId && !leavingRef.current && !blockedRoomIdsRef.current.has(roomId)) {
        console.log(`[Socket] Reconnected — attempting to rejoin room ${roomId}`);
        
        // Wait a short moment for server auto-rejoin to kick in first
        setTimeout(() => {
          if (currentRoomIdRef.current !== roomId) return; // Already handled
          
          // Retry rejoin up to 5 times with increasing delay
          const attemptRejoin = (attempt: number) => {
            if (currentRoomIdRef.current !== roomId) return; // Room changed, abort
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
                toast.error('Не удалось вернуться в комнату. Вы можете вернуться через лобби.', { duration: 6000 });
                currentRoomIdRef.current = null;
                setCurrentRoom(null);
                setGameState(null);
                setAvailableActions([]);
              }
            });
          };
          
          attemptRejoin(1);
        }, 300); // Small delay to let server auto-rejoin fire first
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
      // Ignore room updates if we're leaving or room is blocked
      if (leavingRef.current) return;
      if (r && r.id && blockedRoomIdsRef.current.has(r.id)) {
        console.log(`[Socket] Ignoring roomUpdated for blocked room ${r.id}`);
        return;
      }
      setCurrentRoom(r);
      // Track the room ID for future reconnects — but ONLY if we explicitly
      // joined this room (currentRoomIdRef is set in joinRoom/createRoom/rejoinRoom).
      // Do NOT auto-set it from server-pushed roomUpdated to prevent ghost rejoin.
    });
    socket.on('roomClosed', () => {
      currentRoomIdRef.current = null;
      setCurrentRoom(null);
      setGameState(null);
      setAvailableActions([]);
      setChatMessages([]);
      setGameOverData(null);
    });
    socket.on('gameStarted', (s) => {
      if (leavingRef.current) return;
      // Block game started for blocked rooms
      if (s && s.roomId && blockedRoomIdsRef.current.has(s.roomId)) {
        console.log(`[Socket] Ignoring gameStarted for blocked room`);
        return;
      }
      setGameState(s);
      setAvailableActions([]);
      setTurnTimer(s.turnTimerMax);
      setGameOverData(null);
    });
    socket.on('gameStateUpdate', (s) => {
      // Ignore updates if we're in the process of leaving
      if (leavingRef.current) return;
      // Block game state updates for rooms we intentionally left
      if (s && s.roomId && blockedRoomIdsRef.current.has(s.roomId)) {
        console.log(`[Socket] Ignoring gameStateUpdate for blocked room`);
        return;
      }
      // Extra safety: if we have no currentRoomIdRef, don't accept game state updates
      // (this means we're in the lobby and shouldn't be pulled back into a game)
      if (!currentRoomIdRef.current) {
        console.log(`[Socket] Ignoring gameStateUpdate — no current room (in lobby)`);
        return;
      }
      setGameState(s);
      setTurnTimer(s.turnTimer);
      // Clear stale actions — fresh ones arrive via yourTurn immediately after
      setAvailableActions([]);
    });
    socket.on('yourTurn', (a) => {
      if (leavingRef.current) return;
      // Don't accept turn actions if we're in the lobby
      if (!currentRoomIdRef.current) return;
      setAvailableActions(a);
    });
    socket.on('error', (msg) => setError(msg));
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
      if (data.reason === 'disconnect_timeout') {
        toast.error('Вы были удалены из игры из-за долгого отсутствия соединения', { duration: 6000 });
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, userName]);

  const createRoom = useCallback((name: string, maxPlayers: number, settings: RoomSettings): Promise<Room> => {
    return new Promise((resolve) => {
      // Reset leaving flag when creating a new room
      leavingRef.current = false;
      socketRef.current?.emit('createRoom', { name, maxPlayers, settings }, (room) => {
        setCurrentRoom(room);
        currentRoomIdRef.current = room.id;
        resolve(room);
      });
    });
  }, []);

  const joinRoom = useCallback((roomId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      // Reset leaving flag when joining/rejoining a room
      leavingRef.current = false;
      // Remove from blocked list so game state updates are accepted
      blockedRoomIdsRef.current.delete(roomId);
      socketRef.current?.emit('joinRoom', roomId, (ok, room) => {
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
  }, []);

  const leaveGame = useCallback((roomId: string) => {
    // Set leaving flag IMMEDIATELY to block any incoming gameStateUpdate
    leavingRef.current = true;
    // Permanently block this room from auto-rejoin
    blockedRoomIdsRef.current.add(roomId);

    const doReturnToLobby = () => {
      currentRoomIdRef.current = null;
      setCurrentRoom(null);
      setGameState(null);
      setAvailableActions([]);
      setChatMessages([]);
      setGameOverData(null);
      // Reset leaving flag after state is cleared — keep it long enough
      // to block any delayed server updates (roomUpdated, gameStateUpdate)
      setTimeout(() => { leavingRef.current = false; }, 10000);
    };

    socketRef.current?.emit('leaveGame', roomId, (result: { ok: boolean }) => {
      // Server acknowledged — return to lobby
      doReturnToLobby();
    });

    // Fallback: if server doesn't respond within 2s, return to lobby anyway
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

  const returnToLobby = useCallback(() => {
    currentRoomIdRef.current = null;
    setCurrentRoom(null);
    setGameState(null);
    setAvailableActions([]);
    setChatMessages([]);
    setGameOverData(null);
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
    returnToLobby,
    clearError: () => setError(null),
  };
}
