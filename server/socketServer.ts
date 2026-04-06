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
import { recordGameResult, checkShanyrakBalance, deductShanyrakBet, creditShanyrakPrize, getProfileByUserId, getUserByOpenId } from './db';

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
const DISCONNECT_GRACE_MS = 60_000; // 60 seconds grace period (increased for unstable connections)
const disconnectTimers = new Map<string, NodeJS.Timeout>(); // odId -> timeout
const playerRooms = new Map<string, Set<string>>(); // odId -> set of roomIds
// Players who intentionally left a game — prevent auto-rejoin for these room+player combos
const forfeitedFromRoom = new Set<string>(); // "odId:roomId" entries
// Track trump phase per room to detect changes and emit trumpChanged event
const lastTrumpPhase = new Map<string, number>(); // roomId -> last known trump phase
const lastTrumpSuit = new Map<string, string>(); // roomId -> last known trump suit
const playerGameIds = new Map<string, number>(); // odId -> gameId (for friend invitations)
const playerAvatarIds = new Map<string, string>(); // odId -> avatarId (for in-game display)
const playerDisplayNames = new Map<string, string>(); // odId -> custom display name from settings
// Room freeze system — when a player disconnects during a game, freeze the room for 30 seconds
const FREEZE_TIMEOUT_MS = 30_000; // 30 seconds to reconnect
const frozenRooms = new Map<string, { roomId: string; disconnectedOdId: string; disconnectedName: string; timer: NodeJS.Timeout; tickInterval: NodeJS.Timeout; secondsLeft: number }>(); // roomId -> freeze info

const BOT_NAMES = ['Алтынбек', 'Жанибек', 'Айгерим', 'Дана', 'Ерлан', 'Мадина', 'Нурсултан', 'Камила', 'Бауыржан', 'Сауле'];

let io: Server<ClientToServerEvents, ServerToClientEvents>;

/** Emit balanceUpdated to a player by openId so their client refreshes the balance */
async function emitBalanceUpdated(odId: string) {
  const sid = playerSockets.get(odId);
  if (!sid) return;
  try {
    const user = await getUserByOpenId(odId);
    if (!user) return;
    const profile = await getProfileByUserId(user.id);
    if (!profile) return;
    io.to(sid).emit('balanceUpdated', {
      shanyrak: profile.balanceShanyrak,
      tenge: profile.balanceTenge,
    });
  } catch (err) {
    console.error('[Socket] Failed to emit balanceUpdated:', err);
  }
}

/**
 * Emit a newNotification event to a specific player by their profileId.
 * Called from routers.ts when a notification is created.
 */
export async function emitNotificationToProfile(profileId: number, type: string) {
  if (!io) return;
  try {
    const db = (await import('./db')).getDb;
    // We need to find the user's openId from profileId
    // Use a direct query approach
    const { getDb } = await import('./db');
    const database = await getDb();
    if (!database) return;
    const { playerProfiles } = await import('../drizzle/schema');
    const { users } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');
    const profile = await database.select({ userId: playerProfiles.userId })
      .from(playerProfiles)
      .where(eq(playerProfiles.id, profileId))
      .limit(1);
    if (!profile[0]) return;
    const user = await database.select({ openId: users.openId })
      .from(users)
      .where(eq(users.id, profile[0].userId))
      .limit(1);
    if (!user[0]) return;
    const sid = playerSockets.get(user[0].openId);
    if (!sid) return;
    // Get updated unread count
    const { getUnreadNotificationCount } = await import('./db');
    const count = await getUnreadNotificationCount(profileId);
    io.to(sid).emit('newNotification', { type, count });
  } catch (err) {
    console.error('[Socket] Failed to emit newNotification:', err);
  }
}

export function initSocketServer(httpServer: HttpServer) {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/api/socket.io',
    pingTimeout: 30000,     // 30s before considering connection dead (was 60s)
    pingInterval: 10000,    // ping every 10s for faster dead connection detection (was 25s)
    connectTimeout: 30000,  // 30s connection timeout (was 45s)
    maxHttpBufferSize: 1e6, // 1MB buffer
    transports: ['websocket', 'polling'], // Allow both transports
    allowUpgrades: true,
  });

  io.on('connection', (socket) => {
    console.log(`[Socket] Connected: ${socket.id}`);

    const odId = socket.handshake.auth?.odId as string || socket.id;
    // Use stored display name from registerProfile if available, fallback to auth name
    let name = playerDisplayNames.get(odId) || socket.handshake.auth?.name as string || 'Гость';
    socketPlayers.set(socket.id, { odId, name });
    playerSockets.set(odId, socket.id);

    // Cancel any pending disconnect grace timer for this player
    const pendingTimer = disconnectTimers.get(odId);
    if (pendingTimer) {
      clearTimeout(pendingTimer);
      disconnectTimers.delete(odId);
      console.log(`[Socket] Player ${odId} reconnected — grace timer cancelled`);
    }

    // Unfreeze any rooms frozen for this player
    for (const [frozenRoomId, freezeInfo] of Array.from(frozenRooms.entries())) {
      if (freezeInfo.disconnectedOdId === odId) {
        clearTimeout(freezeInfo.timer);
        clearInterval(freezeInfo.tickInterval);
        frozenRooms.delete(frozenRoomId);
        console.log(`[Socket] Unfreezing room ${frozenRoomId} — player ${odId} reconnected`);

        // Notify all players in the room that the game is unfrozen
        io.to(frozenRoomId).emit('roomUnfrozen', {
          roomId: frozenRoomId,
          reconnectedPlayerName: name,
        });

        // Restart the turn timer and watchdog
        const gameState = games.get(frozenRoomId);
        if (gameState && gameState.gamePhase === 'playing') {
          restartTurnTimer(frozenRoomId);
          startWatchdog(frozenRoomId);
        }
      }
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
              const clientState = toClientState(gameState, odId, playerGameIds, playerAvatarIds);
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
        const clientState = toClientState(gameState, odId, playerGameIds, playerAvatarIds);
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
      const rawBet = data.settings?.betAmount || 100;
      const validBets = [100, 200, 500, 1000, 3000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2000000, 5000000, 10000000];
      const betAmount = validBets.includes(rawBet) ? rawBet : 100;
      const settings: RoomSettings = {
        turnTimer: Math.min(Math.max(data.settings?.turnTimer || 30, 15), 60),
        withBots: data.settings?.withBots || false,
        botCount: data.settings?.botCount || 0,
        deckStyle: data.settings?.deckStyle === 'custom' ? 'custom' : 'classic',
        tableStyle: data.settings?.tableStyle === 'dark_kazakh' ? 'dark_kazakh' : 'classic',
        betAmount,
        password: data.settings?.password || undefined,
        isPrivate: data.settings?.isPrivate || false,
      };
      const room: Room = {
        id: roomId,
        name: data.name || `Комната ${roomId}`,
        hostId: odId,
        maxPlayers: Math.min(Math.max(data.maxPlayers || 2, 2), 8),
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
      console.log(`[Socket] Room created: ${roomId}, password=${settings.password ? '***(' + settings.password.length + ' chars)' : 'none'}, isPrivate=${settings.isPrivate}`);
      broadcastRoomList();
      cb(sanitizeRoom(room));
    });

    socket.on('joinRoom', (data, cb) => {
      const roomId = typeof data === 'string' ? data : data.roomId;
      const password = typeof data === 'string' ? undefined : data.password;
      const room = rooms.get(roomId);
      if (!room) { cb(false); return; }

      // Allow reconnecting player who is still in the game (within grace period)
      const gameState = games.get(roomId);
      const isInGame = gameState && gameState.gamePhase === 'playing' &&
        gameState.players.some(p => p.id === odId && !p.leftGame && !p.isOut);
      const isForfeited = forfeitedFromRoom.has(`${odId}:${roomId}`);

      if (isInGame && !isForfeited) {
        // Player is reconnecting to their active game via lobby
        console.log(`[Socket] Player ${odId} rejoining active game in room ${roomId} via joinRoom`);
        
        // Cancel any pending grace period timer
        const graceTimer = disconnectTimers.get(odId);
        if (graceTimer) {
          clearTimeout(graceTimer);
          disconnectTimers.delete(odId);
          console.log(`[Socket] Cancelled grace period for ${odId} — player reconnected via joinRoom`);
        }

        // Re-add to room.players if not there
        if (!room.players.some(p => p.id === odId)) {
          room.players.push({ id: odId, name, ready: true, isBot: false });
        }

        playerSockets.set(odId, socket.id);
        socket.join(roomId);
        trackPlayerRoom(odId, roomId);

        // Send room state
        socket.emit('roomUpdated', sanitizeRoom(room));

        // Send game state
        const clientState = toClientState(gameState, odId, playerGameIds, playerAvatarIds);
        socket.emit('gameStateUpdate', clientState);
        const playerIdx = gameState.players.findIndex(p => p.id === odId);
        const actions = playerIdx !== -1 ? getAvailableActions(gameState, playerIdx) : [];
        socket.emit('yourTurn', actions);

        cb(true, sanitizeRoom(room));
        return;
      }

      if (room.players.length >= room.maxPlayers) { cb(false); return; }
      if (room.gameState) { cb(false); return; }
      if (room.players.find(p => p.id === odId)) {
        socket.join(roomId);
        trackPlayerRoom(odId, roomId);
        cb(true, sanitizeRoom(room));
        return;
      }

      // Password check: skip if player is invited or is the host
      const isInvited = room.invitedPlayerIds?.includes(odId);
      const roomHasPassword = !!room.settings.password && room.settings.password.trim().length > 0;
      console.log(`[Socket] joinRoom password check: roomHasPassword=${roomHasPassword}, isInvited=${isInvited}, isHost=${room.hostId === odId}, providedPassword=${password ? '***' : 'none'}`);
      if (roomHasPassword && !isInvited && room.hostId !== odId) {
        if (!password || password.trim() !== room.settings.password!.trim()) {
          console.log(`[Socket] joinRoom: password mismatch for room ${roomId}`);
          socket.emit('error', 'Неверный пароль');
          cb(false);
          return;
        }
        console.log(`[Socket] joinRoom: password correct for room ${roomId}`);
      }

      // Balance check: player must have enough shanyraks for the bet
      const betAmount = room.settings.betAmount || 100;
      checkShanyrakBalance(odId).then(info => {
        if (!info || !info.canAfford(betAmount)) {
          const needed = betAmount;
          const has = info?.balance ?? 0;
          socket.emit('error', `Недостаточно шаныраков. Нужно: ${needed}, у вас: ${has}`);
          cb(false);
          return;
        }

        room.players.push({ id: odId, name, ready: false, isBot: false });
        socket.join(roomId);
        trackPlayerRoom(odId, roomId);
        io.to(roomId).emit('roomUpdated', sanitizeRoom(room));
        io.to(roomId).emit('playerJoined', { id: odId, name });
        broadcastRoomList();
        cb(true, sanitizeRoom(room));
      }).catch(err => {
        console.error('[Socket] Balance check error:', err);
        // Allow join on DB error (graceful degradation)
        room.players.push({ id: odId, name, ready: false, isBot: false });
        socket.join(roomId);
        trackPlayerRoom(odId, roomId);
        io.to(roomId).emit('roomUpdated', sanitizeRoom(room));
        io.to(roomId).emit('playerJoined', { id: odId, name });
        broadcastRoomList();
        cb(true, sanitizeRoom(room));
      });
      return; // async flow above handles the rest
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

      // Host clicking "Start" implies they are ready — only check non-host players
      const allReady = room.players.every(p => p.isBot || p.id === room.hostId || p.ready);
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

      const betAmount = room.settings.betAmount || 100;
      const totalPool = betAmount * room.players.length; // bots also contribute to pool

      // Create game FIRST (deal cards), then deduct shanyraks
      const gameState = createGame(roomId, playerInfos, room.settings);
      gameState.prizePool = totalPool;
      games.set(roomId, gameState);
      room.gameState = gameState;

      // Initialize trump tracking for change detection
      lastTrumpPhase.set(roomId, gameState.trumpInfo.phase);
      lastTrumpSuit.set(roomId, gameState.trumpInfo.currentTrump);

      // Broadcast game state immediately so players see cards dealt
      broadcastGameState(roomId, gameState);
      startTurnTimer(roomId);
      startWatchdog(roomId);
      broadcastRoomList();
      scheduleBotAction(roomId);

      // Deduct bets AFTER cards are dealt and game is visible
      const humanPlayers = room.players.filter(p => !p.isBot);
      const deductPromises = humanPlayers.map(p => deductShanyrakBet(p.id, betAmount, roomId));
      Promise.all(deductPromises).then(results => {
        const failedIdx = results.findIndex(r => r === null);
        if (failedIdx !== -1) {
          const failedPlayer = humanPlayers[failedIdx];
          console.error(`[Socket] Failed to deduct bet from ${failedPlayer.name} in room ${roomId}`);
          // Refund already deducted players
          for (let i = 0; i < failedIdx; i++) {
            if (results[i] !== null) {
              creditShanyrakPrize(humanPlayers[i].id, betAmount, roomId, 0).catch(e =>
                console.error('[Socket] Failed to refund bet:', e)
              );
            }
          }
        } else {
          // Notify all human players that their balance changed
          for (const hp of humanPlayers) {
            emitBalanceUpdated(hp.id);
          }
        }
      }).catch(err => {
        console.error('[Socket] Bet deduction error:', err);
      });
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

      // Reset consecutive timeout counter — player took action
      if (gameState.consecutiveTimeouts[odId]) {
        gameState.consecutiveTimeouts[odId] = 0;
      }

      markProgress(data.roomId);

      // Handle special flags set by the engine
      if (gameState._lastCardDefenseDelay) {
        // Defender played last card — broadcast current state, then auto-complete after 3s
        gameState._lastCardDefenseDelay = false;
        broadcastGameState(data.roomId, gameState);
        // Pause the turn timer during the 3s reveal
        stopTurnTimer(data.roomId);
        // Capture current trick count to guard against stale timeouts
        const savedTrickCount = gameState.trickCount;
        setTimeout(() => {
          const gs = games.get(data.roomId);
          if (!gs || gs.gamePhase === 'finished') return;
          // Guard: if a new trick already started, don't call successfulDefense
          if (gs.trickCount !== savedTrickCount) return;
          successfulDefense(gs);
          broadcastGameState(data.roomId, gs);
          restartTurnTimer(data.roomId);
          scheduleBotAction(data.roomId);
        }, 3000);
        return;
      }

      if (gameState._autoCompleteDefense) {
        // All attackers have no matching cards — auto-complete defense
        gameState._autoCompleteDefense = false;
        successfulDefense(gameState);
        broadcastGameState(data.roomId, gameState);
        restartTurnTimer(data.roomId);
        scheduleBotAction(data.roomId);
        return;
      }

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

      // Reset consecutive timeout counter — player took action
      if (gameState.consecutiveTimeouts[odId]) {
        gameState.consecutiveTimeouts[odId] = 0;
      }

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

      // Reset consecutive timeout counter — player took action
      if (gameState.consecutiveTimeouts[odId]) {
        gameState.consecutiveTimeouts[odId] = 0;
      }

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

      // Reset consecutive timeout counter — player took action (voluntary take)
      if (gameState.consecutiveTimeouts[odId]) {
        gameState.consecutiveTimeouts[odId] = 0;
      }

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

      // Reset consecutive timeout counter — player took action
      if (gameState.consecutiveTimeouts[odId]) {
        gameState.consecutiveTimeouts[odId] = 0;
      }

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

      // Reset consecutive timeout counter — player took action
      if (gameState.consecutiveTimeouts[odId]) {
        gameState.consecutiveTimeouts[odId] = 0;
      }

      restartTurnTimer(roomId);
      broadcastGameState(roomId, gameState);
      scheduleBotAction(roomId);
    });

    socket.on('skipTurn', (roomId) => {
      const gameState = games.get(roomId);
      if (!gameState) return;

      const playerIdx = gameState.players.findIndex(p => p.id === odId);
      if (!shouldSkipTurn(gameState, playerIdx)) return;

      // Reset consecutive timeout counter — player took action
      if (gameState.consecutiveTimeouts[odId]) {
        gameState.consecutiveTimeouts[odId] = 0;
      }

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

    // --- Invite friend to room ---
    socket.on('inviteFriend', (data) => {
      console.log(`[Socket] inviteFriend called by ${odId} for room ${data.roomId}, targetGameId: ${data.targetGameId}`);
      const room = rooms.get(data.roomId);
      if (!room) {
        console.log(`[Socket] inviteFriend: room ${data.roomId} not found`);
        return;
      }
      // Only room host or players in the room can invite
      if (!room.players.some(p => p.id === odId)) {
        console.log(`[Socket] inviteFriend: player ${odId} not in room`);
        return;
      }

      // Find the target player's socket by their gameId
      const targetGameId = data.targetGameId;
      let targetOdId: string | null = null;
      let targetSid: string | null = null;

      for (const [sid, info] of Array.from(socketPlayers.entries())) {
        const playerGameId = playerGameIds.get(info.odId);
        if (playerGameId === targetGameId) {
          targetOdId = info.odId;
          targetSid = sid;
          break;
        }
      }

      if (!targetOdId || !targetSid) {
        console.log(`[Socket] inviteFriend: target gameId ${targetGameId} not found. socketPlayers size: ${socketPlayers.size}, playerGameIds:`, Array.from(playerGameIds.entries()));
        socket.emit('error', 'Игрок не найден или не в сети');
        return;
      }
      console.log(`[Socket] inviteFriend: found target ${targetOdId} with sid ${targetSid}`);

      // Check if target is in lobby (not in any active game)
      const targetRoomSet = playerRooms.get(targetOdId);
      if (targetRoomSet && targetRoomSet.size > 0) {
        // Check if any of their rooms have an active game
        const isInActiveGame = Array.from(targetRoomSet).some(rid => {
          const gs = games.get(rid);
          return gs && gs.gamePhase === 'playing';
        });
        if (isInActiveGame) {
          socket.emit('error', 'Игрок сейчас в игре, приглашение невозможно');
          return;
        }
        // Also check if they're in a waiting room (they should be in lobby)
        const isInWaitingRoom = Array.from(targetRoomSet).some(rid => {
          const r = rooms.get(rid);
          return r && !r.hasActiveGame;
        });
        if (isInWaitingRoom) {
          socket.emit('error', 'Игрок уже в другой комнате');
          return;
        }
      }

      // Add to invited list
      if (!room.invitedPlayerIds) room.invitedPlayerIds = [];
      if (!room.invitedPlayerIds.includes(targetOdId)) {
        room.invitedPlayerIds.push(targetOdId);
      }

      // Send invitation to the target player
      const senderGameId = playerGameIds.get(odId) || 0;
      io.to(targetSid).emit('roomInvite', {
        roomId: data.roomId,
        roomName: room.name,
        fromName: name,
        fromGameId: senderGameId,
      });
      console.log(`[Socket] ${name} (gameId: ${senderGameId}) invited gameId: ${targetGameId} to room ${data.roomId}`);
    });

    // --- Decline room invitation ---
    socket.on('declineInvite', (data) => {
      // Find the inviter's socket by their gameId
      const inviterGameId = data.fromGameId;
      let inviterSid: string | null = null;
      for (const [sid, info] of Array.from(socketPlayers.entries())) {
        const gid = playerGameIds.get(info.odId);
        if (gid === inviterGameId) {
          inviterSid = sid;
          break;
        }
      }
      if (inviterSid) {
        const myGameId = playerGameIds.get(odId) || 0;
        io.to(inviterSid).emit('inviteDeclined', {
          roomId: data.roomId,
          declinedByName: name,
          declinedByGameId: myGameId,
        });
        console.log(`[Socket] ${name} declined invite to room ${data.roomId} from gameId ${inviterGameId}`);
      }
    });

    // --- Register player profile (store gameId mapping) ---
    socket.on('registerProfile', (data, cb) => {
      if (data.gameId && data.gameId > 0) {
        playerGameIds.set(odId, data.gameId);
        if (data.avatarId) {
          playerAvatarIds.set(odId, data.avatarId);
        }
        // Store custom display name for reconnect scenarios
        if (data.displayName) {
          playerDisplayNames.set(odId, data.displayName);
          // Update name in all rooms this player is in
          const roomSet = playerRooms.get(odId);
          if (roomSet) {
            for (const rid of Array.from(roomSet)) {
              const room = rooms.get(rid);
              if (room) {
                const player = room.players.find(p => p.id === odId);
                if (player) {
                  player.name = data.displayName;
                }
              }
              // Also update name in active game state
              const gameState = games.get(rid);
              if (gameState) {
                const gamePlayer = gameState.players.find(p => p.id === odId);
                if (gamePlayer) {
                  gamePlayer.name = data.displayName;
                }
              }
            }
          }
        }
        console.log(`[Socket] Registered gameId ${data.gameId} for ${odId} (${data.displayName})`);
        // Broadcast online status to friends
        broadcastOnlineFriends(odId);
      }
      if (typeof cb === 'function') cb(true);
    });

    // Disconnect — start grace period instead of immediate removal
    socket.on('disconnect', () => {
      console.log(`[Socket] Disconnected: ${socket.id} (odId: ${odId})`);

      socketPlayers.delete(socket.id);
      // Broadcast offline status to friends
      broadcastOnlineFriends(odId);
      // Don't delete from playerSockets yet — wait for grace period

      // Check if this player is in any active game rooms
      const roomSet = playerRooms.get(odId);
      const isInActiveGame = roomSet && Array.from(roomSet).some(rid => {
        const gs = games.get(rid);
        return gs && gs.gamePhase === 'playing';
      });

      if (isInActiveGame) {
        // Start grace period — give player time to reconnect
        console.log(`[Socket] Starting ${FREEZE_TIMEOUT_MS / 1000}s freeze period for ${odId}`);

        // Freeze all active game rooms this player is in
        const activeRoomIds = roomSet ? Array.from(roomSet).filter(rid => {
          const gs = games.get(rid);
          return gs && gs.gamePhase === 'playing' && gs.players.some(p => p.id === odId && !p.isOut && !p.leftGame);
        }) : [];

        for (const rid of activeRoomIds) {
          // Stop the turn timer to freeze the game
          stopTurnTimer(rid);
          stopWatchdog(rid);

          // Set up freeze countdown
          const freezeInfo = {
            roomId: rid,
            disconnectedOdId: odId,
            disconnectedName: name,
            secondsLeft: Math.floor(FREEZE_TIMEOUT_MS / 1000),
            timer: null as any,
            tickInterval: null as any,
          };

          // Notify other players in the room
          io.to(rid).emit('roomFrozen', {
            roomId: rid,
            disconnectedPlayerName: name,
            timeoutSeconds: freezeInfo.secondsLeft,
          });

          // Tick every second
          freezeInfo.tickInterval = setInterval(() => {
            freezeInfo.secondsLeft--;
            io.to(rid).emit('frozenTimerTick', { roomId: rid, secondsLeft: freezeInfo.secondsLeft });
          }, 1000);

          // After timeout, forfeit the player
          freezeInfo.timer = setTimeout(() => {
            console.log(`[Socket] Freeze expired for ${odId} in room ${rid} — forfeiting`);
            clearInterval(freezeInfo.tickInterval);
            frozenRooms.delete(rid);
            disconnectTimers.delete(odId);
            playerSockets.delete(odId);

            forfeitedFromRoom.add(`${odId}:${rid}`);
            const gameState = games.get(rid);
            if (gameState && gameState.gamePhase === 'playing') {
              const playerIdx = gameState.players.findIndex(p => p.id === odId);
              if (playerIdx !== -1 && !gameState.players[playerIdx].isOut) {
                forfeitPlayer(gameState, playerIdx);
                markProgress(rid);
                resetTurnTimer(gameState);
                restartTurnTimer(rid);
                startWatchdog(rid);
                broadcastGameState(rid, gameState);
                if (gameState.gamePhase === 'playing') {
                  scheduleBotAction(rid);
                }
              }
            }
            const r = rooms.get(rid);
            if (r && r.players.some((p: { id: string }) => p.id === odId)) {
              handlePlayerLeaveRoom(odId, rid);
            }
            // Send forcedToLobby to the disconnected player if they reconnect later
            const reconnectedSid = playerSockets.get(odId);
            if (reconnectedSid) {
              io.to(reconnectedSid).emit('forcedToLobby', { reason: 'disconnect_timeout' });
            }
          }, FREEZE_TIMEOUT_MS);

          frozenRooms.set(rid, freezeInfo);
        }

        // Also set the old disconnect timer as a fallback
        const timer = setTimeout(() => {
          disconnectTimers.delete(odId);
          // Cleanup any rooms not handled by freeze
          const allRoomIds = playerRooms.get(odId);
          if (allRoomIds) {
            for (const rid of Array.from(allRoomIds)) {
              if (!frozenRooms.has(rid)) {
                const r = rooms.get(rid);
                if (r && r.players.some((p: { id: string }) => p.id === odId)) {
                  handlePlayerLeaveRoom(odId, rid);
                }
              }
            }
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

  // ---- Online friends broadcasting ----
  // When a player connects/disconnects, notify all their friends about online status
  function broadcastOnlineFriends(changedOdId: string) {
    // Get the gameId of the changed player
    const changedGameId = playerGameIds.get(changedOdId);
    if (!changedGameId) return;

    // Find all connected players and check mutual friendship via gameId matching
    // For each connected player, compute which of their friends are online
    // This is a simple approach: iterate all connected players with registered gameIds
    const allOnlineGameIds = new Set<number>();
    for (const [, gid] of Array.from(playerGameIds.entries())) {
      // Check if this player is actually connected (has an active socket)
      const odIdForGameId = findOdIdByGameId(gid);
      if (odIdForGameId && playerSockets.has(odIdForGameId)) {
        allOnlineGameIds.add(gid);
      }
    }

    // Notify all connected players who have registered gameIds
    // Each player gets their own filtered list based on their friends
    // Since we don't have friend lists in memory, we broadcast the full online set
    // and let the client filter based on their friend list
    for (const [sid, info] of Array.from(socketPlayers.entries())) {
      const gid = playerGameIds.get(info.odId);
      if (gid) {
        io.to(sid).emit('onlineFriendsUpdate', {
          onlineGameIds: Array.from(allOnlineGameIds).filter(id => id !== gid),
        });
      }
    }
  }

  // Helper: find odId by gameId
  function findOdIdByGameId(gameId: number): string | null {
    for (const [oid, gid] of Array.from(playerGameIds.entries())) {
      if (gid === gameId) return oid;
    }
    return null;
  }

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
  lastTrumpPhase.delete(roomId);
  lastTrumpSuit.delete(roomId);
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

    // Check for disconnected human players who are still in the game
    // This catches the edge case where a player reconnects to socket.io
    // (cancelling grace timer) but fails to rejoin the room
    for (const p of gs.players) {
      if (p.isBot || p.isOut || p.leftGame) continue;
      const sid = playerSockets.get(p.id);
      const playerSocket = sid ? io.sockets.sockets.get(sid) : null;
      const isInSocketRoom = playerSocket ? playerSocket.rooms.has(roomId) : false;
      
      if (!isInSocketRoom) {
        // Player has no active socket connection to this room
        const playerIdx = gs.players.indexOf(p);
        console.warn(`[Watchdog] Player ${p.name} (${p.id}) has no socket connection to room ${roomId}. Auto-forfeiting.`);
        forfeitedFromRoom.add(`${p.id}:${roomId}`);
        untrackPlayerRoom(p.id, roomId);
        forfeitPlayer(gs, playerIdx);
        markProgress(roomId);
        resetTurnTimer(gs);
        restartTurnTimer(roomId);
        broadcastGameState(roomId, gs);
        
        // Remove from room.players
        const room = rooms.get(roomId);
        if (room) {
          room.players = room.players.filter(rp => rp.id !== p.id);
          if (room.players.filter(rp => !rp.isBot).length === 0) {
            closeRoom(roomId);
            return;
          }
          if (room.hostId === p.id) {
            const nextHost = room.players.find(rp => !rp.isBot);
            if (nextHost) room.hostId = nextHost.id;
          }
          io.to(roomId).emit('roomUpdated', sanitizeRoom(room));
        }
        
        // Send forcedToLobby if they have a socket
        if (sid) {
          io.to(sid).emit('forcedToLobby', { reason: 'disconnect_timeout' });
        }
        
        if (gs.gamePhase === 'playing') {
          scheduleBotAction(roomId);
        }
        return; // Re-check on next watchdog tick
      }
    }

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

// Helper: kick a player due to consecutive timeouts (reused for any phase)
function kickPlayerForTimeouts(roomId: string, gameState: GameState, playerIdx: number) {
  const player = gameState.players[playerIdx];
  console.log(`[Timer] ${player.name} forfeited due to 2 consecutive timeouts`);
  forfeitPlayer(gameState, playerIdx);
  forfeitedFromRoom.add(`${player.id}:${roomId}`);
  untrackPlayerRoom(player.id, roomId);
  const room = rooms.get(roomId);
  if (room) {
    room.players = room.players.filter(rp => rp.id !== player.id);
    if (room.players.filter(rp => !rp.isBot).length === 0) {
      closeRoom(roomId);
      return;
    }
    if (room.hostId === player.id) {
      const nextHost = room.players.find(rp => !rp.isBot);
      if (nextHost) room.hostId = nextHost.id;
    }
    io.to(roomId).emit('roomUpdated', sanitizeRoom(room));
  }
  const sid = playerSockets.get(player.id);
  if (sid) {
    const s = io.sockets.sockets.get(sid);
    if (s) s.leave(roomId);
    io.to(sid).emit('forcedToLobby', { reason: 'kicked' });
  }
  resetTurnTimer(gameState);
  restartTurnTimer(roomId);
  broadcastGameState(roomId, gameState);
  if (gameState.gamePhase === 'playing') scheduleBotAction(roomId);
}

function handleTimeUp(roomId: string, gameState: GameState) {
  console.log(`[Timer] Time up. Phase: ${gameState.turnPhase}, taking: ${gameState.defenderTaking}, bf: ${gameState.battleField.length}, attacker: ${gameState.players[gameState.currentAttackerIdx]?.name}, defender: ${gameState.players[gameState.currentDefenderIdx]?.name}`);

  // ── Determine which player "owns" this timeout ──
  let timeoutPlayerId: string | null = null;
  let timeoutPlayerIdx = -1;

  if (gameState.defenderTaking) {
    // In pickup mode, the timer is on the attackers (they can add cards)
    // The current attacker is the one who timed out
    const attacker = gameState.players[gameState.currentAttackerIdx];
    if (attacker && !attacker.isBot && !attacker.isOut) {
      timeoutPlayerId = attacker.id;
      timeoutPlayerIdx = gameState.currentAttackerIdx;
    }
  } else if (gameState.turnPhase === 'defend') {
    const defender = gameState.players[gameState.currentDefenderIdx];
    if (defender && !defender.isBot && !defender.isOut) {
      timeoutPlayerId = defender.id;
      timeoutPlayerIdx = gameState.currentDefenderIdx;
    }
  } else if (gameState.turnPhase === 'attack') {
    const attacker = gameState.players[gameState.currentAttackerIdx];
    if (attacker && !attacker.isBot && !attacker.isOut) {
      timeoutPlayerId = attacker.id;
      timeoutPlayerIdx = gameState.currentAttackerIdx;
    }
  }

  // ── Track consecutive timeouts for this player ──
  if (timeoutPlayerId) {
    const prevCount = gameState.consecutiveTimeouts[timeoutPlayerId] || 0;
    gameState.consecutiveTimeouts[timeoutPlayerId] = prevCount + 1;
    console.log(`[Timer] Player ${gameState.players[timeoutPlayerIdx]?.name} timeout #${prevCount + 1}`);

    // 2 consecutive timeouts = auto-forfeit
    if (prevCount + 1 >= 2) {
      kickPlayerForTimeouts(roomId, gameState, timeoutPlayerIdx);
      return;
    }
  }

  // ── Handle the actual timeout action ──
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
    // Defender timed out — defender TAKES cards into hand, attackers can add more
    engineTakeCards(gameState);
    // Do NOT finalize immediately — let attackers add cards
  } else if (gameState.turnPhase === 'attack') {
    if (gameState.battleField.length > 0) {
      // Attacker timed out — auto "бито"
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
          // If no one can act and defender is NOT taking, this means
          // all cards are defended and no one can add more — successful defense
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

    // Handle special flags set by the engine (same as human playCard handler)
    if (gs._lastCardDefenseDelay) {
      gs._lastCardDefenseDelay = false;
      broadcastGameState(roomId, gs);
      stopTurnTimer(roomId);
      const savedTrickCount = gs.trickCount;
      setTimeout(() => {
        const gs2 = games.get(roomId);
        if (!gs2 || gs2.gamePhase === 'finished') return;
        if (gs2.trickCount !== savedTrickCount) return;
        successfulDefense(gs2);
        broadcastGameState(roomId, gs2);
        restartTurnTimer(roomId);
        scheduleBotAction(roomId);
      }, 3000);
      return;
    }

    if (gs._autoCompleteDefense) {
      gs._autoCompleteDefense = false;
      successfulDefense(gs);
      broadcastGameState(roomId, gs);
      restartTurnTimer(roomId);
      scheduleBotAction(roomId);
      return;
    }

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
  // Detect trump phase/suit changes and emit trumpChanged event
  const prevPhase = lastTrumpPhase.get(roomId);
  const prevSuit = lastTrumpSuit.get(roomId);
  const currentPhase = gameState.trumpInfo.phase;
  const currentSuit = gameState.trumpInfo.currentTrump;
  
  if (prevPhase !== undefined && prevSuit !== undefined &&
      (prevPhase !== currentPhase || prevSuit !== currentSuit)) {
    // Trump has changed! Notify all players in the room
    io.to(roomId).emit('trumpChanged', {
      newTrump: currentSuit,
      phase: currentPhase,
    });
    console.log(`[Game] Trump changed in room ${roomId}: phase ${prevPhase}→${currentPhase}, suit ${prevSuit}→${currentSuit}`);
  }
  
  // Update tracking
  lastTrumpPhase.set(roomId, currentPhase);
  lastTrumpSuit.set(roomId, currentSuit);

  // Credit prizes immediately when a player wins (before broadcasting state)
  // Track which prizes have been credited to avoid double-crediting
  const creditedKey = `credited_${roomId}`;
  const creditedSet = (broadcastGameState as any)[creditedKey] as Set<string> || new Set<string>();
  (broadcastGameState as any)[creditedKey] = creditedSet;
  
  for (const prize of gameState.playerPrizes) {
    const prizeKey = `${prize.playerId}_${prize.place}`;
    if (!creditedSet.has(prizeKey) && prize.amount > 0) {
      creditedSet.add(prizeKey);
      const player = gameState.players.find(p => p.id === prize.playerId);
      if (player && !player.isBot) {
        creditShanyrakPrize(prize.playerId, prize.amount, roomId, prize.place)
          .then(() => emitBalanceUpdated(prize.playerId))
          .catch(err =>
            console.error(`[Prize] Failed to credit ${prize.amount} to ${prize.playerId}:`, err)
          );
        console.log(`[Prize] Credited ${prize.amount} shanyraks to ${prize.playerId} (place ${prize.place}) in room ${roomId}`);
      }
    }
  }

  for (const p of gameState.players) {
    if (p.isBot) continue;
    const sid = playerSockets.get(p.id);
    if (sid) {
      const clientState = toClientState(gameState, p.id, playerGameIds, playerAvatarIds);
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

    // --- Prize pool distribution (prizes already credited during game via broadcastGameState) ---
    // Emit final prizeDistributed event with all prizes for the game-over screen
    if (gameState.prizePool > 0 && gameState.playerPrizes.length > 0) {
      io.to(roomId).emit('prizeDistributed', {
        pool: gameState.prizePool,
        prizes: gameState.playerPrizes,
      });
      console.log(`[Prize] Final distribution emitted for room ${roomId}: pool=${gameState.prizePool}, winners=${gameState.playerPrizes.length}`);
    }
    
    // Clean up credited prizes tracking
    const creditedKey = `credited_${roomId}`;
    delete (broadcastGameState as any)[creditedKey];

    // Record game result in database (async, non-blocking)
    const humanPlayers = gameState.players.filter(p => !p.isBot);
    if (humanPlayers.length > 0) {
      // Look up profile IDs from playerGameIds map (odId -> gameId)
      const allPlayerProfileIds = humanPlayers
        .map(p => playerGameIds.get(p.id))
        .filter((id): id is number => id !== undefined && id > 0);
      const winnerOdId = gameState.winnersOrder[0] || null;
      const loserOdId = gameState.loserId || null;
      const winnerProfileId = winnerOdId ? (playerGameIds.get(winnerOdId) ?? null) : null;
      const loserProfileId = loserOdId ? (playerGameIds.get(loserOdId) ?? null) : null;
      if (allPlayerProfileIds.length > 0) {
        recordGameResult({
          roomId,
          playerCount: humanPlayers.length,
          winnerProfileId,
          loserProfileId,
          allPlayerProfileIds,
          durationSeconds: 0,
        }).catch(err => console.error('[DB] Failed to record game result:', err));
      }
    }
  }
}

function broadcastRoomList() {
  io.emit('roomList', Array.from(rooms.values()).map(sanitizeRoom));
}

function sanitizeRoom(room: Room): Room {
  // Keep gameState null for security, but mark if game is active
  // so lobby can show 'Вернуться в игру' for reconnecting players
  const hasActiveGame = !!(room.gameState && room.gameState.gamePhase === 'playing');
  const activeGamePlayerIds = hasActiveGame && room.gameState
    ? room.gameState.players.filter(p => !p.leftGame && !p.isOut && !p.isBot).map(p => p.id)
    : [];
  const hasPassword = !!room.settings.password;
  // Strip password from settings before sending to clients
  const sanitizedSettings = { ...room.settings, password: undefined };
  return { ...room, gameState: null, hasActiveGame, activeGamePlayerIds, hasPassword, settings: sanitizedSettings };
}
