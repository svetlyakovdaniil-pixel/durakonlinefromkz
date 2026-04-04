// ============================================================
// Kazakh Durak Online — Socket.IO Server (v5)
// Fixes: reconnect grace period, attacker priority handoff,
// pickup-after-take mechanic, multi-attacker bito, bot transfer,
// ready+start, improved timer, edge-only add-cards, room cleanup
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
  canPlayerAddCards, forfeitPlayer,
} from './gameEngine';

// In-memory store
const rooms = new Map<string, Room>();
const games = new Map<string, GameState>();
const playerSockets = new Map<string, string>(); // odId -> socketId
const socketPlayers = new Map<string, { odId: string; name: string }>(); // socketId -> player info
const turnTimers = new Map<string, NodeJS.Timeout>(); // roomId -> interval
const botTimeouts = new Map<string, NodeJS.Timeout[]>(); // roomId -> pending bot timeouts
const watchdogTimers = new Map<string, NodeJS.Timeout>(); // roomId -> watchdog interval
const lastProgressTimestamps = new Map<string, number>(); // roomId -> last time game state changed

// Disconnect grace period — track disconnected players before removing them
const DISCONNECT_GRACE_MS = 30_000; // 30 seconds grace period
const disconnectTimers = new Map<string, NodeJS.Timeout>(); // odId -> timeout
const playerRooms = new Map<string, Set<string>>(); // odId -> set of roomIds
// Players who intentionally left a game — prevent auto-rejoin for these room+player combos
const forfeitedFromRoom = new Set<string>(); // "odId:roomId" entries

const BOT_NAMES = ['Алтынбек', 'Жанибек', 'Айгерим', 'Дана', 'Ерлан', 'Мадина', 'Нурсултан', 'Камила', 'Бауыржан', 'Сауле'];

let io: Server<ClientToServerEvents, ServerToClientEvents>;

export function initSocketServer(httpServer: HttpServer) {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/api/socket.io',
    pingTimeout: 60000,     // 60s before considering connection dead
    pingInterval: 25000,    // ping every 25s
    connectTimeout: 45000,  // 45s connection timeout
    maxHttpBufferSize: 1e6, // 1MB buffer
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    const odId = socket.handshake.auth?.odId as string || socket.id;
    const name = socket.handshake.auth?.name as string || 'Гость';
    socketPlayers.set(socket.id, { odId, name });
    playerSockets.set(odId, socket.id);

    // Cancel any pending disconnect grace timer for this player
    const pendingTimer = disconnectTimers.get(odId);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      disconnectTimers.delete(odId);
      console.log(`[Socket] Player ${odId} reconnected — grace timer cancelled`);
    }

    // Rejoin all rooms this player was in (skip rooms they forfeited from)
    const roomSet = playerRooms.get(odId);
    if (roomSet) {
      for (const roomId of Array.from(roomSet)) {
        // Skip if player intentionally left this room
        // NOTE: Do NOT delete from forfeitedFromRoom — keep the block permanent
        if (forfeitedFromRoom.has(`${odId}:${roomId}`)) {
          console.log(`[Socket] Skipping auto-rejoin for ${odId} in room ${roomId} (forfeited)`);
          untrackPlayerRoom(odId, roomId);
          continue;
        }
        const room = rooms.get(roomId);
        const gameState = games.get(roomId);
        // Check both room.players AND gameState.players for reconnect
        const isInRoom = room && room.players.some(p => p.id === odId);
        const isInGame = gameState && gameState.players.some(p => p.id === odId && !p.leftGame);
        if (isInRoom || isInGame) {
          // If player is in game but not in room.players, re-add them
          if (!isInRoom && isInGame && room) {
            room.players.push({ id: odId, name, ready: true, isBot: false });
            console.log(`[Socket] Re-added ${odId} to room.players during auto-rejoin`);
          }
          if (room) {
            socket.join(roomId);
            // Send current room state
            socket.emit('roomUpdated', sanitizeRoom(room));
            // If game is in progress, send game state
            if (gameState && gameState.gamePhase === 'playing') {
              const clientState = toClientState(gameState, odId);
              socket.emit('gameStateUpdate', clientState);
              const playerIdx = gameState.players.findIndex(p => p.id === odId);
              // Always send actions — even empty to clear stale client state
              const actions = playerIdx !== -1 ? getAvailableActions(gameState, playerIdx) : [];
              socket.emit('yourTurn', actions);
            }
            console.log(`[Socket] Player ${odId} auto-rejoined room ${roomId}`);
          }
        }
      }
    }

    socket.emit('roomList', Array.from(rooms.values()).map(sanitizeRoom));

    // --- rejoinRoom: client explicitly requests to rejoin after reconnect ---
    socket.on('rejoinRoom', (roomId, cb) => {
      // Block rejoin if player intentionally forfeited from this room
      // NOTE: Do NOT delete from forfeitedFromRoom — keep the block permanent
      if (forfeitedFromRoom.has(`${odId}:${roomId}`)) {
        console.log(`[Socket] Blocking rejoin for ${odId} in room ${roomId} (forfeited)`);
        untrackPlayerRoom(odId, roomId);
        cb(false);
        return;
      }

      const room = rooms.get(roomId);
      if (!room) { cb(false); return; }

      // Check both room.players AND gameState.players — the player might be in the game
      // but removed from room.players due to a race condition
      const isInRoom = room.players.some(p => p.id === odId);
      const gameState = games.get(roomId);
      const isInGame = gameState && gameState.players.some(p => p.id === odId && !p.leftGame);
      if (!isInRoom && !isInGame) { cb(false); return; }

      // If player is in game but not in room.players, re-add them
      if (!isInRoom && isInGame) {
        room.players.push({ id: odId, name, ready: true, isBot: false });
        console.log(`[Socket] Re-added ${odId} to room.players during rejoin`);
      }

      // Cancel any pending grace period timer for this player
      const graceTimer = disconnectTimers.get(odId);
      if (graceTimer) {
        clearTimeout(graceTimer);
        disconnectTimers.delete(odId);
        console.log(`[Socket] Cancelled grace period for ${odId} — player reconnected`);
      }

      // Update socket mapping
      playerSockets.set(odId, socket.id);

      socket.join(roomId);
      trackPlayerRoom(odId, roomId);

      // Send current room state
      socket.emit('roomUpdated', sanitizeRoom(room));

      // If game is in progress, send full game state (reuse gameState from above)
      if (gameState && gameState.gamePhase === 'playing') {
        const clientState = toClientState(gameState, odId);
        socket.emit('gameStateUpdate', clientState);
        const playerIdx = gameState.players.findIndex(p => p.id === odId);
        // Always send actions — even empty to clear stale client state
        const actions = playerIdx !== -1 ? getAvailableActions(gameState, playerIdx) : [];
        socket.emit('yourTurn', actions);
      }

      cb(true, sanitizeRoom(room));
    });

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
      trackPlayerRoom(odId, roomId);
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
        trackPlayerRoom(odId, roomId);
        cb(true, sanitizeRoom(room));
        return;
      }

      room.players.push({ id: odId, name, ready: false, isBot: false });
      socket.join(roomId);
      trackPlayerRoom(odId, roomId);
      io.to(roomId).emit('roomUpdated', sanitizeRoom(room));
      io.to(roomId).emit('playerJoined', { id: odId, name });
      broadcastRoomList();
      cb(true, sanitizeRoom(room));
    });

    socket.on('leaveRoom', (roomId) => {
      // Explicit leave — no grace period
      untrackPlayerRoom(odId, roomId);
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
      startWatchdog(roomId);
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

      markProgress(data.roomId);
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

      markProgress(data.roomId);
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

      markProgress(data.roomId);
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
      markProgress(roomId);
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

      markProgress(roomId);
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

      markProgress(roomId);
      restartTurnTimer(roomId);
      broadcastGameState(roomId, gameState);
      scheduleBotAction(roomId);
    });

    // --- Leave game (forfeit) ---
    socket.on('leaveGame', (roomId, ack) => {
      const gameState = games.get(roomId);
      if (!gameState || gameState.gamePhase !== 'playing') {
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }

      const playerIdx = gameState.players.findIndex(p => p.id === odId);
      if (playerIdx === -1) {
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }
      if (gameState.players[playerIdx].isOut) {
        if (typeof ack === 'function') ack({ ok: false });
        return;
      }

      forfeitPlayer(gameState, playerIdx);
      markProgress(roomId);
      resetTurnTimer(gameState);
      restartTurnTimer(roomId);

      // Acknowledge FIRST so client can clean up before receiving further updates
      if (typeof ack === 'function') ack({ ok: true });

      // Remove the player from the socket.io room so they don't receive further updates
      socket.leave(roomId);

      // Mark as intentionally forfeited — prevents auto-rejoin on reconnect (PERMANENT)
      forfeitedFromRoom.add(`${odId}:${roomId}`);

      // Clean up player mappings so reconnect won't rejoin this room
      untrackPlayerRoom(odId, roomId);

      // Also cancel any pending disconnect grace timer
      const graceTimer = disconnectTimers.get(odId);
      if (graceTimer) {
        clearTimeout(graceTimer);
        disconnectTimers.delete(odId);
      }

      // Remove the player from the room's player list entirely
      // This prevents auto-rejoin loop from finding them in room.players
      const room = rooms.get(roomId);
      if (room) {
        room.players = room.players.filter(p => p.id !== odId);
        // If no human players left, close the room
        if (room.players.filter(p => !p.isBot).length === 0) {
          closeRoom(roomId);
          return; // closeRoom handles cleanup and broadcast
        }
        // Transfer host if needed
        if (room.hostId === odId) {
          const nextHost = room.players.find(p => !p.isBot);
          if (nextHost) room.hostId = nextHost.id;
        }
        io.to(roomId).emit('roomUpdated', sanitizeRoom(room));
      }

      broadcastGameState(roomId, gameState);

      // If game is not over, schedule bot actions
      if (gameState.gamePhase === 'playing') {
        scheduleBotAction(roomId);
      }
    });

    socket.on('sendChat', (data) => {
      io.to(data.roomId).emit('chatMessage', {
        from: name,
        text: data.text,
        ts: Date.now(),
      });
    });

    // Disconnect — start grace period instead of immediate removal
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id} (odId: ${odId})`);

      socketPlayers.delete(socket.id);
      // Don't delete from playerSockets yet — wait for grace period

      // Check if this player is in any active game rooms
      const roomSet = playerRooms.get(odId);
      const isInActiveGame = roomSet && Array.from(roomSet).some(rid => {
        const gs = games.get(rid);
        return gs && gs.gamePhase === 'playing';
      });

      if (isInActiveGame) {
        // Start grace period — give player time to reconnect
        console.log(`[Socket] Starting ${DISCONNECT_GRACE_MS / 1000}s grace period for ${odId}`);
        const timer = setTimeout(() => {
          console.log(`[Socket] Grace period expired for ${odId} — forfeiting from active games`);
          disconnectTimers.delete(odId);
          playerSockets.delete(odId);

          const allRoomIds = playerRooms.get(odId);
          if (allRoomIds) {
            for (const rid of Array.from(allRoomIds)) {
              // Mark as forfeited so reconnect won't rejoin
              forfeitedFromRoom.add(`${odId}:${rid}`);

              // If player is in an active game, forfeit them (auto-lose)
              const gameState = games.get(rid);
              if (gameState && gameState.gamePhase === 'playing') {
                const playerIdx = gameState.players.findIndex(p => p.id === odId);
                if (playerIdx !== -1 && !gameState.players[playerIdx].isOut) {
                  forfeitPlayer(gameState, playerIdx);
                  markProgress(rid);
                  resetTurnTimer(gameState);
                  restartTurnTimer(rid);
                  broadcastGameState(rid, gameState);
                  if (gameState.gamePhase === 'playing') {
                    scheduleBotAction(rid);
                  }
                  console.log(`[Socket] Player ${odId} forfeited from game in room ${rid} (grace expired)`);
                }
              }
              // Also clean up room membership
              const r = rooms.get(rid);
              if (r && r.players.some((p: { id: string }) => p.id === odId)) {
                handlePlayerLeaveRoom(odId, rid);
              }
            }
          }
          playerRooms.delete(odId);

          // Send forcedToLobby to the player if they reconnect later
          // We emit to the specific socket if it exists, or it will be handled on next connect
          const playerSocketId = playerSockets.get(odId);
          if (playerSocketId) {
            io.to(playerSocketId).emit('forcedToLobby', { reason: 'disconnect_timeout' });
          }
        }, DISCONNECT_GRACE_MS);

        disconnectTimers.set(odId, timer);
      } else {
        // Not in active game — remove immediately
        playerSockets.delete(odId);
        const allRoomIds = playerRooms.get(odId);
        if (allRoomIds) {
          for (const rid of Array.from(allRoomIds)) {
            const r = rooms.get(rid);
            if (r && r.players.some((p: { id: string }) => p.id === odId)) {
              handlePlayerLeaveRoom(odId, rid);
            }
          }
        }
        playerRooms.delete(odId);
      }
    });
  });

  return io;
}

// ---- Player-Room tracking ----

function trackPlayerRoom(odId: string, roomId: string) {
  let set = playerRooms.get(odId);
  if (!set) {
    set = new Set();
    playerRooms.set(odId, set);
  }
  set.add(roomId);
}

function untrackPlayerRoom(odId: string, roomId: string) {
  const set = playerRooms.get(odId);
  if (set) {
    set.delete(roomId);
    if (set.size === 0) playerRooms.delete(odId);
  }
}

// ---- Room helpers ----

function handlePlayerLeaveRoom(playerId: string, roomId: string) {
  const room = rooms.get(roomId);
  if (!room) return;

  if (room.hostId === playerId) {
    // Transfer host to next human player if possible
    const nextHost = room.players.find(p => p.id !== playerId && !p.isBot);
    if (nextHost) {
      room.hostId = nextHost.id;
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
    } else {
      closeRoom(roomId);
    }
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
  stopWatchdog(roomId);
  cancelBotTimeouts(roomId);
  botFailCounts.delete(roomId);
  io.to(roomId).emit('roomClosed', roomId);

  for (const p of room.players) {
    if (!p.isBot) {
      const sid = playerSockets.get(p.id);
      if (sid) {
        const s = io.sockets.sockets.get(sid);
        if (s) s.leave(roomId);
      }
      untrackPlayerRoom(p.id, roomId);
    }
  }

  rooms.delete(roomId);
  games.delete(roomId);
  broadcastRoomList();
}

// ---- Turn Timer ----

function startTurnTimer(roomId: string) {
  stopTurnTimer(roomId);
  lastProgressTimestamps.set(roomId, Date.now()); // Track progress
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

// Watchdog: independent timer that detects stuck games
function startWatchdog(roomId: string) {
  stopWatchdog(roomId);
  lastProgressTimestamps.set(roomId, Date.now());
  const WATCHDOG_INTERVAL = 10_000; // Check every 10 seconds
  const MAX_STALE_MS = 30_000; // If no progress for 30 seconds, force-resolve

  const interval = setInterval(() => {
    const gs = games.get(roomId);
    if (!gs || gs.gamePhase !== 'playing') {
      stopWatchdog(roomId);
      return;
    }

    const lastProgress = lastProgressTimestamps.get(roomId) || Date.now();
    const staleDuration = Date.now() - lastProgress;

    if (staleDuration > MAX_STALE_MS) {
      console.error(`[Watchdog] Room ${roomId} stale for ${Math.round(staleDuration / 1000)}s. Force-resolving.`);
      
      // Force-resolve the current state
      if (gs.battleField.length > 0) {
        if (gs.defenderTaking) {
          // Force finalize take
          for (const p of gs.players) {
            if (!p.isOut && p.id !== gs.players[gs.currentDefenderIdx].id) {
              if (!gs.passedAttackers.includes(p.id)) {
                gs.passedAttackers.push(p.id);
              }
            }
          }
          engineFinalizeTake(gs);
        } else {
          successfulDefense(gs);
        }
      } else {
        // No cards on table — advance turn
        const nextAttacker = getNextActivePlayer(gs.players, gs.currentAttackerIdx, gs.direction);
        gs.currentAttackerIdx = nextAttacker;
        gs.currentDefenderIdx = getNextActivePlayer(gs.players, nextAttacker, gs.direction);
        gs.turnPhase = 'attack';
        gs.passedAttackers = [];
        gs.attackerHasPriority = true;
      }

      lastProgressTimestamps.set(roomId, Date.now());
      resetTurnTimer(gs);
      restartTurnTimer(roomId);
      broadcastGameState(roomId, gs);
      scheduleBotAction(roomId);
    }
  }, WATCHDOG_INTERVAL);

  watchdogTimers.set(roomId, interval);
}

function stopWatchdog(roomId: string) {
  const timer = watchdogTimers.get(roomId);
  if (timer) {
    clearInterval(timer);
    watchdogTimers.delete(roomId);
  }
  lastProgressTimestamps.delete(roomId);
}

function markProgress(roomId: string) {
  lastProgressTimestamps.set(roomId, Date.now());
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
  console.log(`[Timer] Time up. Phase: ${gameState.turnPhase}, taking: ${gameState.defenderTaking}, bf: ${gameState.battleField.length}, attacker: ${gameState.players[gameState.currentAttackerIdx]?.name}, defender: ${gameState.players[gameState.currentDefenderIdx]?.name}`);

  if (gameState.defenderTaking) {
    // Pickup mode — force-pass all unpassed attackers and finalize
    for (const p of gameState.players) {
      if (!p.isOut && p.id !== gameState.players[gameState.currentDefenderIdx].id) {
        if (!gameState.passedAttackers.includes(p.id)) {
          gameState.passedAttackers.push(p.id);
        }
      }
    }
    engineFinalizeTake(gameState);
  } else if (gameState.turnPhase === 'defend') {
    // Defender time's up — auto take and immediately finalize
    engineTakeCards(gameState);
    // Pass all attackers to finalize immediately
    for (const p of gameState.players) {
      if (!p.isOut && p.id !== gameState.players[gameState.currentDefenderIdx].id) {
        if (!gameState.passedAttackers.includes(p.id)) {
          gameState.passedAttackers.push(p.id);
        }
      }
    }
    engineFinalizeTake(gameState);
  } else if (gameState.turnPhase === 'attack') {
    if (gameState.battleField.length > 0) {
      // Attacker time's up — auto "бито"
      const activeIdx = gameState.currentAttackerIdx;
      engineEndAttack(gameState, activeIdx);
    }
  }

  // Deadlock safeguard: if game is still playing and no one has actions
  if (gameState.gamePhase === 'playing') {
    const activePlayers = gameState.players.filter(p => !p.isOut);
    const anyoneHasActions = activePlayers.some(p => {
      const realIdx = gameState.players.indexOf(p);
      return getAvailableActions(gameState, realIdx).length > 0;
    });
    if (!anyoneHasActions) {
      console.warn(`[Deadlock] No player has actions after timeUp. Force-resolving.`);
      if (gameState.battleField.length > 0) {
        if (gameState.defenderTaking) {
          engineFinalizeTake(gameState);
        } else {
          successfulDefense(gameState);
        }
      } else {
        // No cards on table, no actions — advance turn
        const nextAttacker = getNextActivePlayer(gameState.players, gameState.currentAttackerIdx, gameState.direction);
        gameState.currentAttackerIdx = nextAttacker;
        gameState.currentDefenderIdx = getNextActivePlayer(gameState.players, nextAttacker, gameState.direction);
        gameState.turnPhase = 'attack';
        gameState.passedAttackers = [];
        gameState.attackerHasPriority = true;
      }
    }
  }

  resetTurnTimer(gameState);
  restartTurnTimer(roomId);
  broadcastGameState(roomId, gameState);
  scheduleBotAction(roomId);
}

// ---- Bot AI ----

function cancelBotTimeouts(roomId: string) {
  const timeouts = botTimeouts.get(roomId);
  if (timeouts) {
    for (const t of timeouts) clearTimeout(t);
    botTimeouts.delete(roomId);
  }
}

function trackBotTimeout(roomId: string, timeout: NodeJS.Timeout) {
  let arr = botTimeouts.get(roomId);
  if (!arr) {
    arr = [];
    botTimeouts.set(roomId, arr);
  }
  arr.push(timeout);
}

// Track consecutive bot failures per room to detect stuck loops
const botFailCounts = new Map<string, number>();
const MAX_BOT_FAILS = 3;

function scheduleBotAction(roomId: string) {
  // Cancel any pending bot timeouts to prevent race conditions
  cancelBotTimeouts(roomId);

  const gameState = games.get(roomId);
  if (!gameState || gameState.gamePhase !== 'playing') return;

  // Determine active player based on phase
  let activeIdx: number;
  if (gameState.defenderTaking) {
    activeIdx = gameState.currentAttackerIdx;
  } else if (gameState.turnPhase === 'defend') {
    activeIdx = gameState.currentDefenderIdx;
  } else {
    activeIdx = gameState.currentAttackerIdx;
  }

  const activePlayer = gameState.players[activeIdx];
  if (!activePlayer || !activePlayer.isBot) {
    // Human player's turn — check if edge bots can act
    scheduleEdgeBotActions(roomId);
    return;
  }

  // Delay bot action for realism
  const timeout = setTimeout(() => {
    const gs = games.get(roomId);
    if (!gs || gs.gamePhase !== 'playing') return;

    const botAction = getBotAction(gs, activeIdx);
    
    if (!botAction) {
      // Bot has no action — force-resolve to prevent freeze
      console.warn(`[Bot] No action for bot ${activeIdx} (${activePlayer.name}). Phase: ${gs.turnPhase}, taking: ${gs.defenderTaking}, bf: ${gs.battleField.length}`);
      forceResolveStuckState(gs, activeIdx);
      botFailCounts.delete(roomId);
      resetTurnTimer(gs);
      restartTurnTimer(roomId);
      broadcastGameState(roomId, gs);
      scheduleBotAction(roomId);
      return;
    }

    const success = executeBotAction(gs, activeIdx, botAction);
    
    if (!success) {
      // Bot action FAILED — this is the main freeze cause
      const fails = (botFailCounts.get(roomId) || 0) + 1;
      botFailCounts.set(roomId, fails);
      console.warn(`[Bot] Action failed (attempt ${fails}/${MAX_BOT_FAILS}). Bot: ${activePlayer.name}, action: ${botAction.action}`);
      
      if (fails >= MAX_BOT_FAILS) {
        // Too many failures — force-resolve
        console.error(`[Bot] Max failures reached. Force-resolving stuck state.`);
        forceResolveStuckState(gs, activeIdx);
        botFailCounts.delete(roomId);
        resetTurnTimer(gs);
        restartTurnTimer(roomId);
        broadcastGameState(roomId, gs);
        scheduleBotAction(roomId);
      } else {
        // Retry after a delay — DON'T reset timer (prevents timer freeze)
        scheduleBotAction(roomId);
      }
      return;
    }

    // Success — reset fail counter
    botFailCounts.delete(roomId);
    markProgress(roomId);
    resetTurnTimer(gs);
    restartTurnTimer(roomId);
    broadcastGameState(roomId, gs);
    scheduleBotAction(roomId);
  }, 800 + Math.random() * 1200);

  trackBotTimeout(roomId, timeout);
}

// Force-resolve a stuck game state
function forceResolveStuckState(gs: GameState, botIdx: number) {
  const isAttacker = botIdx === gs.currentAttackerIdx;
  const isDefender = botIdx === gs.currentDefenderIdx;

  if (gs.defenderTaking) {
    // Pickup mode — force end attack
    if (isAttacker) {
      engineEndAttack(gs, botIdx);
    } else {
      // Edge bot — auto-pass
      if (!gs.passedAttackers.includes(gs.players[botIdx].id)) {
        gs.passedAttackers.push(gs.players[botIdx].id);
      }
      if (checkAllAttackersPassed_safe(gs)) {
        engineFinalizeTake(gs);
      }
    }
  } else if (isDefender && gs.turnPhase === 'defend') {
    // Defender can't defend — take cards
    engineTakeCards(gs);
    // Auto-pass all attackers to finalize immediately
    for (const p of gs.players) {
      if (!p.isOut && p.id !== gs.players[gs.currentDefenderIdx].id) {
        if (!gs.passedAttackers.includes(p.id)) {
          gs.passedAttackers.push(p.id);
        }
      }
    }
    engineFinalizeTake(gs);
  } else if (isAttacker && gs.battleField.length > 0) {
    // Attacker with cards on table — end attack
    engineEndAttack(gs, botIdx);
  } else if (isAttacker && gs.battleField.length === 0) {
    // Attacker with no cards on table and no action — skip turn
    const nextAttacker = getNextActivePlayer(gs.players, botIdx, gs.direction);
    gs.currentAttackerIdx = nextAttacker;
    gs.currentDefenderIdx = getNextActivePlayer(gs.players, nextAttacker, gs.direction);
  } else {
    // Unknown stuck state — force clear battlefield
    console.error(`[Bot] Unknown stuck state. Clearing battlefield.`);
    if (gs.battleField.length > 0) {
      successfulDefense(gs);
    }
  }
}

// Safe version of checkAllAttackersPassed that matches engine logic
function checkAllAttackersPassed_safe(gs: GameState): boolean {
  for (let i = 0; i < gs.players.length; i++) {
    if (i === gs.currentDefenderIdx) continue;
    if (gs.players[i].isOut) continue;
    // Skip players who can't add cards and aren't the current attacker
    if (!canPlayerAddCards(gs, i) && i !== gs.currentAttackerIdx) continue;
    if (!gs.passedAttackers.includes(gs.players[i].id)) return false;
  }
  return true;
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

    const timeout = setTimeout(() => {
      const gs = games.get(roomId);
      if (!gs || gs.gamePhase !== 'playing') return;

      const botAction = getBotAction(gs, i);
      if (!botAction) {
        // Edge bot has no action — auto-pass
        if (!gs.passedAttackers.includes(gs.players[i].id)) {
          gs.passedAttackers.push(gs.players[i].id);
        }
        broadcastGameState(roomId, gs);
        return;
      }

      const success = executeBotAction(gs, i, botAction);
      if (!success) {
        // Edge bot action failed — auto-pass instead of getting stuck
        if (!gs.passedAttackers.includes(gs.players[i].id)) {
          gs.passedAttackers.push(gs.players[i].id);
        }
        broadcastGameState(roomId, gs);
        return;
      }

      markProgress(roomId);
      resetTurnTimer(gs);
      restartTurnTimer(roomId);
      broadcastGameState(roomId, gs);
      scheduleBotAction(roomId);
    }, 1500 + Math.random() * 2000);

    trackBotTimeout(roomId, timeout);
  }
}

function executeBotAction(gs: GameState, botIdx: number, botAction: { action: string; cardId?: string; targetPairIdx?: number }): boolean {
  let error: string | null = null;
  switch (botAction.action) {
    case 'playAttack':
      if (botAction.cardId) {
        error = playAttackCard(gs, botIdx, botAction.cardId);
      } else {
        error = 'No cardId for playAttack';
      }
      break;
    case 'playDefense':
      if (botAction.cardId) {
        error = playDefenseCard(gs, botIdx, botAction.cardId, botAction.targetPairIdx);
      } else {
        error = 'No cardId for playDefense';
      }
      break;
    case 'transferCard':
      if (botAction.cardId) {
        error = transferAttack(gs, botIdx, botAction.cardId);
      } else {
        error = 'No cardId for transferCard';
      }
      break;
    case 'takeCards':
      engineTakeCards(gs);
      break;
    case 'endAttack':
      error = engineEndAttack(gs, botIdx);
      break;
    case 'skipTurn': {
      const nextAttacker = getNextActivePlayer(gs.players, botIdx, gs.direction);
      gs.currentAttackerIdx = nextAttacker;
      gs.currentDefenderIdx = getNextActivePlayer(gs.players, nextAttacker, gs.direction);
      break;
    }
    default:
      error = `Unknown bot action: ${botAction.action}`;
  }
  if (error) {
    console.warn(`[Bot] Action failed for bot ${botIdx} (${gs.players[botIdx]?.name}): ${botAction.action} -> ${error}`);
    return false;
  }
  return true;
}

// ---- Broadcast helpers ----

function broadcastGameState(roomId: string, gameState: GameState) {
  for (const p of gameState.players) {
    if (p.isBot) continue;
    const sid = playerSockets.get(p.id);
    if (sid) {
      const clientState = toClientState(gameState, p.id);
      io.to(sid).emit('gameStateUpdate', clientState);

      // Always send actions — even empty array to clear stale client state
      const playerIdx = gameState.players.findIndex(pl => pl.id === p.id);
      const actions = playerIdx !== -1 ? getAvailableActions(gameState, playerIdx) : [];
      io.to(sid).emit('yourTurn', actions);
    }
  }

  if (gameState.gamePhase === 'finished') {
    stopTurnTimer(roomId);
    stopWatchdog(roomId);
    cancelBotTimeouts(roomId);
    botFailCounts.delete(roomId);
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
