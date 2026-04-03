// ============================================================
// Kazakh Durak Online — Socket.IO Server (v4)
// Fixes: attacker priority handoff, pickup-after-take mechanic,
// multi-attacker bito, bot transfer, ready+start,
// improved timer, edge-only add-cards, room cleanup
// ============================================================

import { Server as HttpServer } from 'http';
import { Server } from 'socket.io';
import { nanoid } from 'nanoid';
import {
  Room, RoomSettings, ServerToClientEvents, ClientToServerEvents,
  GameState,
} from '../shared/gameTypes';
import {
  createGame, toClientState, getAvailableActions,
  playAttackCard, playDefenseCard, transferAttack,
  showPassThrough, takeCards as engineTakeCards,
  finalizeTake as engineFinalizeTake,
  successfulDefense, shouldSkipTurn, getNextActivePlayer,
  endAttack as engineEndAttack, getBotAction, resetTurnTimer,
  canPlayerAddCards,
} from './gameEngine';

// In-memory store
const rooms = new Map<string, Room>();
const games = new Map<string, GameState>();
const playerSockets = new Map<string, string>(); // odId -> socketId
const socketPlayers = new Map<string, { odId: string; name: string }>(); // socketId -> player info
const turnTimers = new Map<string, NodeJS.Timeout>(); // roomId -> interval

const BOT_NAMES = ['Алтынбек', 'Жанибек', 'Айгерим', 'Дана', 'Ерлан', 'Мадина', 'Нурсултан', 'Камила', 'Бауыржан', 'Сауле'];

let io: Server<ClientToServerEvents, ServerToClientEvents>;

export function initSocketServer(httpServer: HttpServer) {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/api/socket.io',
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    const odId = socket.handshake.auth?.odId as string || socket.id;
    const name = socket.handshake.auth?.name as string || 'Гость';
    socketPlayers.set(socket.id, { odId, name });
    playerSockets.set(odId, socket.id);

    socket.emit('roomList', Array.from(rooms.values()).map(sanitizeRoom));

    // --- Room Management ---

    socket.on('createRoom', (data, cb) => {
      const roomId = nanoid(8);
      const settings: RoomSettings = {
        turnTimer: Math.min(Math.max(data.settings?.turnTimer || 30, 15), 60),
        withBots: data.settings?.withBots || false,
        botCount: data.settings?.botCount || 0,
      };
      const room: Room = {
        id: roomId,
        name: data.name || `Комната ${roomId}`,
        hostId: odId,
        maxPlayers: Math.min(Math.max(data.maxPlayers || 2, 2), 6),
        players: [{ id: odId, name, ready: false, isBot: false }],
        gameState: null,
        settings,
        createdAt: Date.now(),
      };

      // Add bots if requested
      if (settings.withBots && settings.botCount > 0) {
        const botCount = Math.min(settings.botCount, room.maxPlayers - 1);
        const shuffledNames = [...BOT_NAMES].sort(() => Math.random() - 0.5);
        for (let i = 0; i < botCount; i++) {
          room.players.push({
            id: `bot-${nanoid(6)}`,
            name: `🤖 ${shuffledNames[i % shuffledNames.length]}`,
            ready: true,
            isBot: true,
          });
        }
      }

      rooms.set(roomId, room);
      socket.join(roomId);
      broadcastRoomList();
      cb(sanitizeRoom(room));
    });

    socket.on('joinRoom', (roomId, cb) => {
      const room = rooms.get(roomId);
      if (!room) { cb(false); return; }
      if (room.players.length >= room.maxPlayers) { cb(false); return; }
      if (room.gameState) { cb(false); return; }
      if (room.players.find(p => p.id === odId)) {
        socket.join(roomId);
        cb(true, sanitizeRoom(room));
        return;
      }

      room.players.push({ id: odId, name, ready: false, isBot: false });
      socket.join(roomId);
      io.to(roomId).emit('roomUpdated', sanitizeRoom(room));
      io.to(roomId).emit('playerJoined', { id: odId, name });
      broadcastRoomList();
      cb(true, sanitizeRoom(room));
    });

    socket.on('leaveRoom', (roomId) => {
      handlePlayerLeaveRoom(odId, roomId);
    });

    socket.on('closeRoom', (roomId) => {
      const room = rooms.get(roomId);
      if (!room) return;
      if (room.hostId !== odId) return;
      closeRoom(roomId);
    });

    socket.on('toggleReady', (roomId) => {
      const room = rooms.get(roomId);
      if (!room) return;
      const player = room.players.find(p => p.id === odId);
      if (player && !player.isBot) {
        player.ready = !player.ready;
        io.to(roomId).emit('roomUpdated', sanitizeRoom(room));
      }
    });

    socket.on('startGame', (roomId) => {
      const room = rooms.get(roomId);
      if (!room) return;
      if (room.hostId !== odId) return;
      if (room.players.length < 2) return;

      const allReady = room.players.every(p => p.isBot || p.ready);
      if (!allReady) {
        socket.emit('error', 'Не все игроки готовы');
        return;
      }

      const playerInfos = room.players.map(p => ({
        id: p.id,
        odId: p.id,
        name: p.name,
        isBot: p.isBot,
      }));

      const gameState = createGame(roomId, playerInfos, room.settings);
      games.set(roomId, gameState);
      room.gameState = gameState;

      broadcastGameState(roomId, gameState);
      startTurnTimer(roomId);
      broadcastRoomList();

      scheduleBotAction(roomId);
    });

    // --- Game Actions ---

    socket.on('playCard', (data) => {
      const gameState = games.get(data.roomId);
      if (!gameState || gameState.gamePhase !== 'playing') return;

      const playerIdx = gameState.players.findIndex(p => p.id === odId);
      if (playerIdx === -1) return;

      const isDefender = playerIdx === gameState.currentDefenderIdx;
      let error: string | null = null;

      if (isDefender && gameState.turnPhase === 'defend' && !gameState.defenderTaking) {
        error = playDefenseCard(gameState, playerIdx, data.cardId, data.targetPairIdx);
      } else {
        error = playAttackCard(gameState, playerIdx, data.cardId);
      }

      if (error) { socket.emit('error', error); return; }

      resetTurnTimer(gameState);
      restartTurnTimer(data.roomId);
      broadcastGameState(data.roomId, gameState);
      scheduleBotAction(data.roomId);
    });

    socket.on('transferCard', (data) => {
      const gameState = games.get(data.roomId);
      if (!gameState) return;

      const playerIdx = gameState.players.findIndex(p => p.id === odId);
      const error = transferAttack(gameState, playerIdx, data.cardId);
      if (error) { socket.emit('error', error); return; }

      restartTurnTimer(data.roomId);
      broadcastGameState(data.roomId, gameState);
      scheduleBotAction(data.roomId);
    });

    socket.on('showPassThrough', (data) => {
      const gameState = games.get(data.roomId);
      if (!gameState) return;

      const playerIdx = gameState.players.findIndex(p => p.id === odId);
      const error = showPassThrough(gameState, playerIdx, data.cardId);
      if (error) { socket.emit('error', error); return; }

      restartTurnTimer(data.roomId);
      broadcastGameState(data.roomId, gameState);
      scheduleBotAction(data.roomId);
    });

    socket.on('takeCards', (roomId) => {
      const gameState = games.get(roomId);
      if (!gameState) return;

      const playerIdx = gameState.players.findIndex(p => p.id === odId);
      if (playerIdx !== gameState.currentDefenderIdx) return;
      if (gameState.defenderTaking) return; // Already taking

      engineTakeCards(gameState);
      restartTurnTimer(roomId);
      broadcastGameState(roomId, gameState);
      scheduleBotAction(roomId);
    });

    socket.on('endAttack', (roomId) => {
      const gameState = games.get(roomId);
      if (!gameState) return;

      const playerIdx = gameState.players.findIndex(p => p.id === odId);
      const error = engineEndAttack(gameState, playerIdx);
      if (error) { socket.emit('error', error); return; }

      restartTurnTimer(roomId);
      broadcastGameState(roomId, gameState);
      scheduleBotAction(roomId);
    });

    // Legacy passTurn — redirect to endAttack
    socket.on('passTurn', (roomId) => {
      const gameState = games.get(roomId);
      if (!gameState) return;

      const playerIdx = gameState.players.findIndex(p => p.id === odId);
      const error = engineEndAttack(gameState, playerIdx);
      if (error) { socket.emit('error', error); return; }

      restartTurnTimer(roomId);
      broadcastGameState(roomId, gameState);
      scheduleBotAction(roomId);
    });

    socket.on('skipTurn', (roomId) => {
      const gameState = games.get(roomId);
      if (!gameState) return;

      const playerIdx = gameState.players.findIndex(p => p.id === odId);
      if (!shouldSkipTurn(gameState, playerIdx)) return;

      const nextAttacker = getNextActivePlayer(gameState.players, playerIdx, gameState.direction);
      gameState.currentAttackerIdx = nextAttacker;
      gameState.currentDefenderIdx = getNextActivePlayer(gameState.players, nextAttacker, gameState.direction);

      restartTurnTimer(roomId);
      broadcastGameState(roomId, gameState);
      scheduleBotAction(roomId);
    });

    socket.on('sendChat', (data) => {
      io.to(data.roomId).emit('chatMessage', {
        from: name,
        text: data.text,
        ts: Date.now(),
      });
    });

    // Disconnect — remove from all rooms
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id}`);

      const allRoomIds = Array.from(rooms.keys());
      for (const rid of allRoomIds) {
        const r = rooms.get(rid);
        if (r && r.players.some((p: { id: string }) => p.id === odId)) {
          handlePlayerLeaveRoom(odId, rid);
        }
      }

      socketPlayers.delete(socket.id);
      playerSockets.delete(odId);
    });
  });

  return io;
}

// ---- Room helpers ----

function handlePlayerLeaveRoom(playerId: string, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  if (room.hostId === playerId) {
    closeRoom(roomId);
    return;
  }

  room.players = room.players.filter(p => p.id !== playerId);

  const sid = playerSockets.get(playerId);
  if (sid) {
    const s = io.sockets.sockets.get(sid);
    if (s) s.leave(roomId);
  }

  if (room.players.filter(p => !p.isBot).length === 0) {
    closeRoom(roomId);
    return;
  }

  io.to(roomId).emit('roomUpdated', sanitizeRoom(room));
  io.to(roomId).emit('playerLeft', playerId);
  broadcastRoomList();
}

function closeRoom(roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  stopTurnTimer(roomId);
  io.to(roomId).emit('roomClosed', roomId);

  for (const p of room.players) {
    if (!p.isBot) {
      const sid = playerSockets.get(p.id);
      if (sid) {
        const s = io.sockets.sockets.get(sid);
        if (s) s.leave(roomId);
      }
    }
  }

  rooms.delete(roomId);
  games.delete(roomId);
  broadcastRoomList();
}

// ---- Turn Timer ----

function startTurnTimer(roomId: string) {
  stopTurnTimer(roomId);
  const interval = setInterval(() => {
    const gameState = games.get(roomId);
    if (!gameState || gameState.gamePhase !== 'playing') {
      stopTurnTimer(roomId);
      return;
    }

    gameState.turnTimer--;

    for (const p of gameState.players) {
      if (!p.isBot) {
        const sid = playerSockets.get(p.id);
        if (sid) io.to(sid).emit('timerUpdate', gameState.turnTimer);
      }
    }

    if (gameState.turnTimer <= 0) {
      handleTimeUp(roomId, gameState);
    }
  }, 1000);

  turnTimers.set(roomId, interval);
}

function stopTurnTimer(roomId: string) {
  const timer = turnTimers.get(roomId);
  if (timer) {
    clearInterval(timer);
    turnTimers.delete(roomId);
  }
}

function restartTurnTimer(roomId: string) {
  const gameState = games.get(roomId);
  if (!gameState || gameState.gamePhase !== 'playing') return;
  startTurnTimer(roomId);
}

function handleTimeUp(roomId: string, gameState: GameState) {
  // In pickup mode — auto "бито" for current attacker
  if (gameState.defenderTaking) {
    const activeIdx = gameState.currentAttackerIdx;
    engineEndAttack(gameState, activeIdx);
  } else if (gameState.turnPhase === 'defend') {
    // Defender time's up — auto take (enters pickup mode)
    engineTakeCards(gameState);
  } else if (gameState.turnPhase === 'attack') {
    if (gameState.battleField.length > 0) {
      // Attacker time's up — auto "бито" / pass initiative
      const activeIdx = gameState.currentAttackerIdx;
      engineEndAttack(gameState, activeIdx);
    }
  }

  resetTurnTimer(gameState);
  restartTurnTimer(roomId);
  broadcastGameState(roomId, gameState);
  scheduleBotAction(roomId);
}

// ---- Bot AI ----

function scheduleBotAction(roomId: string) {
  const gameState = games.get(roomId);
  if (!gameState || gameState.gamePhase !== 'playing') return;

  // Determine active player based on phase
  let activeIdx: number;
  if (gameState.defenderTaking) {
    // In pickup mode, the current attacker is the active player
    activeIdx = gameState.currentAttackerIdx;
  } else if (gameState.turnPhase === 'defend') {
    activeIdx = gameState.currentDefenderIdx;
  } else {
    activeIdx = gameState.currentAttackerIdx;
  }

  const activePlayer = gameState.players[activeIdx];
  if (!activePlayer || !activePlayer.isBot) {
    // Also check if any edge bot can add cards
    scheduleEdgeBotActions(roomId);
    return;
  }

  // Delay bot action for realism
  setTimeout(() => {
    const gs = games.get(roomId);
    if (!gs || gs.gamePhase !== 'playing') return;

    const botAction = getBotAction(gs, activeIdx);
    if (!botAction) return;

    executeBotAction(gs, activeIdx, botAction);

    resetTurnTimer(gs);
    restartTurnTimer(roomId);
    broadcastGameState(roomId, gs);

    // Chain bot actions
    scheduleBotAction(roomId);
  }, 800 + Math.random() * 1200);
}

// Schedule edge bot players to add cards after a delay
function scheduleEdgeBotActions(roomId: string) {
  const gameState = games.get(roomId);
  if (!gameState || gameState.gamePhase !== 'playing') return;
  if (gameState.battleField.length === 0) return;
  if (gameState.attackerHasPriority) return;

  for (let i = 0; i < gameState.players.length; i++) {
    const p = gameState.players[i];
    if (!p.isBot || p.isOut) continue;
    if (i === gameState.currentDefenderIdx) continue;
    if (i === gameState.currentAttackerIdx) continue;
    if (!canPlayerAddCards(gameState, i)) continue;

    const actions = getAvailableActions(gameState, i);
    if (actions.length === 0) continue;

    setTimeout(() => {
      const gs = games.get(roomId);
      if (!gs || gs.gamePhase !== 'playing') return;

      const botAction = getBotAction(gs, i);
      if (!botAction) return;

      executeBotAction(gs, i, botAction);
      resetTurnTimer(gs);
      restartTurnTimer(roomId);
      broadcastGameState(roomId, gs);
      scheduleBotAction(roomId);
    }, 1500 + Math.random() * 2000);
  }
}

function executeBotAction(gs: GameState, botIdx: number, botAction: { action: string; cardId?: string; targetPairIdx?: number }) {
  switch (botAction.action) {
    case 'playAttack':
      if (botAction.cardId) {
        playAttackCard(gs, botIdx, botAction.cardId);
      }
      break;
    case 'playDefense':
      if (botAction.cardId) {
        playDefenseCard(gs, botIdx, botAction.cardId, botAction.targetPairIdx);
      }
      break;
    case 'transferCard':
      if (botAction.cardId) {
        transferAttack(gs, botIdx, botAction.cardId);
      }
      break;
    case 'takeCards':
      engineTakeCards(gs);
      break;
    case 'endAttack':
      engineEndAttack(gs, botIdx);
      break;
    case 'skipTurn': {
      const nextAttacker = getNextActivePlayer(gs.players, botIdx, gs.direction);
      gs.currentAttackerIdx = nextAttacker;
      gs.currentDefenderIdx = getNextActivePlayer(gs.players, nextAttacker, gs.direction);
      break;
    }
  }
}

// ---- Broadcast helpers ----

function broadcastGameState(roomId: string, gameState: GameState) {
  for (const p of gameState.players) {
    if (p.isBot) continue;
    const sid = playerSockets.get(p.id);
    if (sid) {
      const clientState = toClientState(gameState, p.id);
      io.to(sid).emit('gameStateUpdate', clientState);

      const actions = getAvailableActions(gameState, p.seatIndex);
      if (actions.length > 0) {
        io.to(sid).emit('yourTurn', actions);
      }
    }
  }

  if (gameState.gamePhase === 'finished') {
    stopTurnTimer(roomId);
    io.to(roomId).emit('gameOver', {
      winnersOrder: gameState.winnersOrder,
      loserId: gameState.loserId || '',
    });
  }
}

function broadcastRoomList() {
  io.emit('roomList', Array.from(rooms.values()).map(sanitizeRoom));
}

function sanitizeRoom(room: Room): Room {
  return { ...room, gameState: null };
}
