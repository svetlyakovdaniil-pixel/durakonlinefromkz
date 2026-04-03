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

  useEffect(() => {
    if (!userId) return;

    const socket: TypedSocket = io({
      path: '/api/socket.io',
      auth: { odId: userId, name: userName || 'Гость' },
      transports: ['websocket', 'polling'],
    });

    socketRef.current = socket;

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));
    socket.on('roomList', (r) => setRooms(r));
    socket.on('roomUpdated', (r) => setCurrentRoom(r));
    socket.on('roomClosed', () => {
      setCurrentRoom(null);
      setGameState(null);
      setAvailableActions([]);
      setChatMessages([]);
      setGameOverData(null);
    });
    socket.on('gameStarted', (s) => {
      setGameState(s);
      setAvailableActions([]);
      setTurnTimer(s.turnTimerMax);
      setGameOverData(null);
    });
    socket.on('gameStateUpdate', (s) => {
      setGameState(s);
      setTurnTimer(s.turnTimer);
    });
    socket.on('yourTurn', (a) => setAvailableActions(a));
    socket.on('error', (msg) => setError(msg));
    socket.on('chatMessage', (msg) => setChatMessages(prev => [...prev.slice(-99), msg]));
    socket.on('timerUpdate', (seconds) => setTurnTimer(seconds));

    socket.on('playerJoined', (player) => {
      console.log(`Player joined: ${player.name}`);
    });
    socket.on('playerLeft', (playerId) => {
      console.log(`Player left: ${playerId}`);
    });
    socket.on('trumpChanged', (info) => {
      const sym = SUIT_SYMBOLS[info.newTrump] || info.newTrump;
      toast.info(`Новый козырь: ${sym} (Фаза ${info.phase}/3)`, { duration: 4000 });
    });
    socket.on('directionChanged', (dir) => {
      const arrow = dir === 'cw' ? '➡️' : '⬅️';
      toast.info(`Направление изменилось ${arrow}`, { duration: 3000 });
    });
    socket.on('gameOver', (data) => {
      setGameOverData(data);
    });
    socket.on('transferChoice', () => {
      // Transfer choice is handled via gameStateUpdate
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [userId, userName]);

  const createRoom = useCallback((name: string, maxPlayers: number, settings: RoomSettings): Promise<Room> => {
    return new Promise((resolve) => {
      socketRef.current?.emit('createRoom', { name, maxPlayers, settings }, (room) => {
        setCurrentRoom(room);
        resolve(room);
      });
    });
  }, []);

  const joinRoom = useCallback((roomId: string): Promise<boolean> => {
    return new Promise((resolve) => {
      socketRef.current?.emit('joinRoom', roomId, (ok, room) => {
        if (ok && room) setCurrentRoom(room);
        resolve(ok);
      });
    });
  }, []);

  const leaveRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('leaveRoom', roomId);
    setCurrentRoom(null);
    setGameState(null);
    setAvailableActions([]);
    setChatMessages([]);
    setGameOverData(null);
  }, []);

  const closeRoom = useCallback((roomId: string) => {
    socketRef.current?.emit('closeRoom', roomId);
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
