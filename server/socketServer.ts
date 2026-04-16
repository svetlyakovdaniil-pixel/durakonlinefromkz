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
  showPassThrough, showMultiplePassThroughs, takeCards as engineTakeCards,
  finalizeTake as engineFinalizeTake,
  successfulDefense, shouldSkipTurn, getNextActivePlayer,
  endAttack as engineEndAttack, getBotAction, resetTurnTimer,
  canPlayerAddCards, forfeitPlayer, transferMultipleCards, checkGameOver,
} from './gameEngine';
import { recordGameResult, recordForfeitLoss, checkShanyrakBalance, deductShanyrakBet, creditShanyrakPrize, getProfileByUserId, getUserByOpenId, checkAndAutoUnban } from './db';
import {
  initGameTracking, cleanupGameTracking,
  trackTrumpDefense, trackThrow, trackTransfer, trackCardsTaken, track10Transfer,
  trackTrumpAceUsed, getTrumpAceUsed, trackSuccessfulRound,
  getTrumpDefMap, getTotalDefMap, getThrowMap, getTransferMap, getCardsTakenMap,
  trackPassCardShown, trackAttack, trackCardsInOneTurn, trackBeatSameRankSuit,
  trackThrew6ToNonNeighbor, trackStartedTurnWith10, trackWinWhenOpponentHas1Card,
  getPassCardsShownMap, getAttacksMap, getMaxCardsInOneTurnMap, getBeatSameRankSuitMap,
  getThrew6ToNonNeighborMap, getStartedTurnWith10Map, getWinWhenOpponentHas1CardMap,
  processGameEndAchievements, processDefenseAchievement, processAttackAchievement,
  processLucky777Achievement, processSpidermanMemeAchievement,
  processFirstBerkutAchievement, processLittleHeroAchievement,
  trackBerkutHandSize, getBerkutHandSize,
} from './achievementsTriggers';
import { incrementDailyQuestProgress, setDailyQuestProgress, processDailyQuestsAfterGame } from './dailyQuestsDb';
import { ACHIEVEMENT_MAP } from '../shared/achievements';
import { DAILY_QUEST_MAP, getMoscowDayStart } from '../shared/dailyQuests';
import { TABLE_STYLES } from '../shared/cardAssets';
import { getDb } from './db';
import { playerProfiles } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

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
const playerProfileIds = new Map<string, number>(); // odId -> profileId (playerProfiles.id) for achievement tracking
const playerAvatarIds = new Map<string, string>(); // odId -> avatarId (for in-game display)
const playerEquippedFrames = new Map<string, string>(); // odId -> equippedFrame (for in-game frame display)
const playerIsPremium = new Map<string, boolean>(); // odId -> isPremium status
const playerDisplayNames = new Map<string, string>(); // odId -> custom display name from settings
const playerSeasonRatings = new Map<string, number>(); // odId -> current season rating
// Room freeze system — when a player disconnects during a game, freeze the room for 30 seconds
const FREEZE_TIMEOUT_MS = 30_000; // 30 seconds to reconnect
const frozenRooms = new Map<string, { roomId: string; disconnectedOdId: string; disconnectedName: string; timer: NodeJS.Timeout; tickInterval: NodeJS.Timeout; secondsLeft: number }>(); // roomId -> freeze info

const BOT_NAMES = ['Алтынбек', 'Жанибек', 'Айгерим', 'Дана', 'Ерлан', 'Мадина', 'Нурсултан', 'Камила', 'Бауыржан', 'Сауле'];
const BOT_NAMES_EN = ['Altynbek', 'Zhanibek', 'Aigerim', 'Dana', 'Yerlan', 'Madina', 'Nursultan', 'Kamila', 'Baurzhan', 'Saule'];

// Verbose logging only in development
const isDev = process.env.NODE_ENV !== 'production';
const dbg = (...args: unknown[]) => { if (isDev) console.log(...args); };

let io: Server<ClientToServerEvents, ServerToClientEvents>;

/** Admin: Get online monitoring stats */
export function getAdminOnlineStats() {
  const activeRooms = Array.from(rooms.entries())
    .filter(([_, r]) => r.gameState !== null || r.players.length > 0)
    .map(([id, r]) => ({
      roomId: id,
      hostId: r.hostId,
      playerCount: r.players.length,
      maxPlayers: r.maxPlayers,
      players: r.players.map(p => ({ id: p.id, name: p.name, isBot: p.isBot })),
      betAmount: r.settings.betAmount || 0,
      isTutorial: r.settings.isTutorial || false,
      withBots: r.settings.withBots || false,
      hasActiveGame: r.gameState !== null,
    }));
  return {
    onlinePlayerCount: playerSockets.size,
    activeRoomCount: activeRooms.length,
    rooms: activeRooms,
  };
}

/** Admin: Kick a player by disconnecting their socket */
export function adminKickPlayer(odId: string) {
  const sid = playerSockets.get(odId);
  if (sid) {
    const socket = io?.sockets.sockets.get(sid);
    if (socket) {
      socket.emit('error', 'Вы были отключены администратором');
      socket.disconnect(true);
      return true;
    }
  }
  return false;
}

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

/** Update a player's display name in the in-memory maps (called from tRPC when name changes) */
export function updatePlayerDisplayName(odId: string, newName: string) {
  playerDisplayNames.set(odId, newName);
  // Update socketPlayers entry if player is connected
  const sid = playerSockets.get(odId);
  if (sid) {
    socketPlayers.set(sid, { odId, name: newName });
  }
  // Update name in all rooms this player is in
  const roomSet = playerRooms.get(odId);
  if (roomSet) {
    for (const rid of Array.from(roomSet)) {
      const room = rooms.get(rid);
      if (room) {
        const player = room.players.find(p => p.id === odId);
        if (player) {
          player.name = newName;
        }
        // Broadcast updated room list to all clients
        if (io) broadcastRoomList();
      }
      // Also update name in active game state
      const gameState = games.get(rid);
      if (gameState) {
        const gamePlayer = gameState.players.find(p => p.id === odId);
        if (gamePlayer) {
          gamePlayer.name = newName;
        }
      }
    }
  }
}

export function initSocketServer(httpServer: HttpServer) {
  io = new Server<ClientToServerEvents, ServerToClientEvents>(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] },
    path: '/api/socket.io',
    pingTimeout: 60000,     // 60s before considering connection dead — generous for mobile/unstable networks
    pingInterval: 25000,    // ping every 25s — standard interval, not too aggressive
    connectTimeout: 45000,  // 45s connection timeout
    maxHttpBufferSize: 1e6, // 1MB buffer
    transports: ['websocket', 'polling'], // Allow both transports
    allowUpgrades: true,
    // Compress WebSocket frames to reduce bandwidth
    perMessageDeflate: {
      threshold: 1024, // only compress messages > 1KB
    },
    // NOTE: connectionStateRecovery is intentionally disabled.
    // We have our own custom reconnect logic in io.on('connection') that handles
    // room re-joining, freeze timers, and game state restoration. Socket.IO's built-in
    // recovery would conflict with this logic and cause double-execution of reconnect handlers.
  });

  io.on('connection', (socket) => {
    dbg(`[Socket] Connected: ${socket.id}`);

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
      dbg(`[Socket] Player ${odId} reconnected — grace timer cancelled`);
    }

    // Unfreeze any rooms frozen for this player
    for (const [frozenRoomId, freezeInfo] of Array.from(frozenRooms.entries())) {
      if (freezeInfo.disconnectedOdId === odId) {
        clearTimeout(freezeInfo.timer);
        clearInterval(freezeInfo.tickInterval);
        frozenRooms.delete(frozenRoomId);
        dbg(`[Socket] Unfreezing room ${frozenRoomId} — player ${odId} reconnected`);

        // Notify all players in the room that the game is unfrozen
        io.to(frozenRoomId).emit('roomUnfrozen', {
          roomId: frozenRoomId,
          reconnectedPlayerName: name,
        });

        // Restart the turn timer and watchdog
        // CRITICAL FIX: Delay watchdog start by 500ms to ensure socket.join(roomId)
        // happens first (it occurs in the Rejoin section below). Without this delay,
        // watchdog could fire before the player is in the Socket.IO room, causing false forfeit.
        const gameState = games.get(frozenRoomId);
        if (gameState && gameState.gamePhase === 'playing') {
          restartTurnTimer(frozenRoomId);
          setTimeout(() => {
            // Only start watchdog if game is still playing
            const gs = games.get(frozenRoomId);
            if (gs && gs.gamePhase === 'playing') {
              startWatchdog(frozenRoomId);
            }
          }, 500);
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
          dbg(`[Socket] Skipping auto-rejoin for ${odId} in room ${roomId} (forfeited)`);
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
            room.players.push({ id: odId, name: playerDisplayNames.get(odId) || name, ready: true, isBot: false });
            dbg(`[Socket] Re-added ${odId} to room.players during auto-rejoin`);
          }
          // CRITICAL FIX: Always call socket.join(roomId) even if room object is missing.
          // Without this, watchdog sees player not in Socket.IO room and forfeits them.
          socket.join(roomId);
          if (room) {
            // Send current room state
            socket.emit('roomUpdated', sanitizeRoom(room));
            // If game is in progress, send game state
            if (gameState && gameState.gamePhase === 'playing') {
              const clientState = toClientState(gameState, odId, playerGameIds, playerAvatarIds, playerEquippedFrames, room?.settings.betAmount || 0, room?.settings.isTutorial || false, playerSeasonRatings);
              socket.emit('gameStateUpdate', clientState);
              const playerIdx = gameState.players.findIndex(p => p.id === odId);
              // Always send actions — even empty to clear stale client state
              const actions = playerIdx !== -1 ? getAvailableActions(gameState, playerIdx) : [];
              socket.emit('yourTurn', actions);
            }
          } else if (isInGame && gameState && gameState.gamePhase === 'playing') {
            // Room object missing but game is in progress — still send game state
            console.warn(`[Socket] Room ${roomId} not in rooms Map but game exists — sending game state only`);
            const clientState = toClientState(gameState, odId, playerGameIds, playerAvatarIds, playerEquippedFrames, 0, false, playerSeasonRatings);
            socket.emit('gameStateUpdate', clientState);
            const playerIdx = gameState.players.findIndex(p => p.id === odId);
            const actions = playerIdx !== -1 ? getAvailableActions(gameState, playerIdx) : [];
            socket.emit('yourTurn', actions);
          }
          dbg(`[Socket] Player ${odId} auto-rejoined room ${roomId}`);
        }
      }
    }

    socket.emit('roomList', Array.from(rooms.values()).filter(r => !r.settings.isTutorial).map(sanitizeRoom));

    // --- ping_check: client sends this to verify connection is alive (e.g. after tab becomes visible) ---
    socket.on('ping_check' as any, () => {
      // Just receiving this means the connection is alive — no response needed
      // But we can send back a pong to confirm
      socket.emit('pong_check' as any);
    });

    // --- requestRoomList: client explicitly requests a fresh room list ---
    socket.on('requestRoomList', () => {
      socket.emit('roomList', Array.from(rooms.values()).filter(r => !r.settings.isTutorial).map(sanitizeRoom));
    });

    // --- rejoinRoom: client explicitly requests to rejoin after reconnect ---
    socket.on('rejoinRoom', (roomId, cb) => {
      // Block rejoin if player intentionally forfeited from this room
      // NOTE: Do NOT delete from forfeitedFromRoom — keep the block permanent
      if (forfeitedFromRoom.has(`${odId}:${roomId}`)) {
        dbg(`[Socket] Blocking rejoin for ${odId} in room ${roomId} (forfeited)`);
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
        room.players.push({ id: odId, name: playerDisplayNames.get(odId) || name, ready: true, isBot: false });
        dbg(`[Socket] Re-added ${odId} to room.players during rejoin`);
      }

      // Cancel any pending grace period timer for this player
      const graceTimer = disconnectTimers.get(odId);
      if (graceTimer) {
        clearTimeout(graceTimer);
        disconnectTimers.delete(odId);
        dbg(`[Socket] Cancelled grace period for ${odId} — player reconnected`);
      }

      // Update socket mapping
      playerSockets.set(odId, socket.id);

      socket.join(roomId);
      trackPlayerRoom(odId, roomId);

      // Send current room state
      socket.emit('roomUpdated', sanitizeRoom(room));

      // If game is in progress, send full game state (reuse gameState from above)
      if (gameState && gameState.gamePhase === 'playing') {
        const clientState = toClientState(gameState, odId, playerGameIds, playerAvatarIds, playerEquippedFrames, room.settings.betAmount || 0, room.settings.isTutorial || false, playerSeasonRatings);
        socket.emit('gameStateUpdate', clientState);
        const playerIdx = gameState.players.findIndex(p => p.id === odId);
        // Always send actions — even empty to clear stale client state
        const actions = playerIdx !== -1 ? getAvailableActions(gameState, playerIdx) : [];
        socket.emit('yourTurn', actions);
      }

      cb(true, sanitizeRoom(room));
    });

    // --- Room Management ---

    socket.on('createRoom', async (data, cb) => {
      // Check if player is banned
      const user = await getUserByOpenId(odId);
      if (user) {
        const profile = await getProfileByUserId(user.id);
        if (profile?.isBanned) {
          // Check if temp ban has expired
          const stillBanned = await checkAndAutoUnban(profile.id);
          if (stillBanned) {
            const banMsg = profile.bannedUntil
              ? `Ваш аккаунт заблокирован до ${new Date(profile.bannedUntil).toLocaleString('ru-RU')}. Причина: ${profile.banReason || 'Не указана'}`
              : `Ваш аккаунт заблокирован. Причина: ${profile.banReason || 'Не указана'}`;
            socket.emit('error', banMsg);
            cb(false as any);
            return;
          }
        }
      }
      const roomId = nanoid(8);
      const rawBet = data.settings?.betAmount || 100;
      const validBets = [100, 200, 500, 1000, 3000, 5000, 10000, 25000, 50000, 100000, 250000, 500000, 1000000, 2000000, 5000000, 10000000];
      const betAmount = validBets.includes(rawBet) ? rawBet : 100;
      const settings: RoomSettings = {
        turnTimer: Math.min(Math.max(data.settings?.turnTimer || 30, 15), 60),
        withBots: data.settings?.withBots || false,
        botCount: data.settings?.botCount || 0,
        deckStyle: data.settings?.deckStyle === 'custom' ? 'custom' : 'classic',
        tableStyle: (data.settings?.tableStyle && Object.keys(TABLE_STYLES).includes(data.settings.tableStyle)) ? data.settings.tableStyle as import('../shared/cardAssets').TableStyle : 'classic',
        betAmount,
        password: data.settings?.password || undefined,
        isPrivate: data.settings?.isPrivate || false,
        isTutorial: data.settings?.isTutorial || false,
        playlistId: typeof data.settings?.playlistId === 'number' ? data.settings.playlistId : null,
        locale: typeof data.settings?.locale === 'string' ? data.settings.locale : undefined,
      };
      const room: Room = {
        id: roomId,
        name: data.name || `${settings.locale === 'kk' ? 'Бөлме' : settings.locale === 'en' ? 'Room' : 'Комната'} ${roomId}`,
        hostId: odId,
        maxPlayers: Math.min(Math.max(data.maxPlayers || 2, 2), 8),
        players: [{ id: odId, name: playerDisplayNames.get(odId) || name, ready: false, isBot: false }],
        gameState: null,
        settings,
        createdAt: Date.now(),
      };

      // Add bots if requested
      if (settings.withBots && settings.botCount > 0) {
        const botCount = Math.min(settings.botCount, room.maxPlayers - 1);
        const botNameList = settings.locale === 'en' ? BOT_NAMES_EN : BOT_NAMES;
        const shuffledNames = [...botNameList].sort(() => Math.random() - 0.5);
        for (let i = 0; i < botCount; i++) {
          room.players.push({
            id: `bot-${nanoid(6)}`,
            name: `🤖 ${shuffledNames[i % shuffledNames.length]}`,
            ready: true,
            isBot: true,
            avatarId: 'bot', // Bots always use the bot avatar
          });
        }
      }

      rooms.set(roomId, room);
      socket.join(roomId);
      trackPlayerRoom(odId, roomId);
      dbg(`[Socket] Room created: ${roomId}, password=${settings.password ? '***(' + settings.password.length + ' chars)' : 'none'}, isPrivate=${settings.isPrivate}`);
      broadcastRoomList();
      cb(sanitizeRoom(room));
    });

    socket.on('joinRoom', async (data, cb) => {
      // Check if player is banned
      const banUser = await getUserByOpenId(odId);
      if (banUser) {
        const banProfile = await getProfileByUserId(banUser.id);
        if (banProfile?.isBanned) {
          // Check if temp ban has expired
          const stillBanned = await checkAndAutoUnban(banProfile.id);
          if (stillBanned) {
            const banMsg = banProfile.bannedUntil
              ? `Ваш аккаунт заблокирован до ${new Date(banProfile.bannedUntil).toLocaleString('ru-RU')}. Причина: ${banProfile.banReason || 'Не указана'}`
              : `Ваш аккаунт заблокирован. Причина: ${banProfile.banReason || 'Не указана'}`;
            socket.emit('error', banMsg);
            cb(false);
            return;
          }
        }
      }
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
        dbg(`[Socket] Player ${odId} rejoining active game in room ${roomId} via joinRoom`);
        
        // Cancel any pending grace period timer
        const graceTimer = disconnectTimers.get(odId);
        if (graceTimer) {
          clearTimeout(graceTimer);
          disconnectTimers.delete(odId);
          dbg(`[Socket] Cancelled grace period for ${odId} — player reconnected via joinRoom`);
        }

        // Re-add to room.players if not there
        if (!room.players.some(p => p.id === odId)) {
          room.players.push({ id: odId, name: playerDisplayNames.get(odId) || name, ready: true, isBot: false });
        }

        playerSockets.set(odId, socket.id);
        socket.join(roomId);
        trackPlayerRoom(odId, roomId);

        // Send room state
        socket.emit('roomUpdated', sanitizeRoom(room));

        // Send game state
        const clientState = toClientState(gameState, odId, playerGameIds, playerAvatarIds, playerEquippedFrames, room.settings.betAmount || 0, room.settings.isTutorial || false, playerSeasonRatings);
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
      dbg(`[Socket] joinRoom password check: roomHasPassword=${roomHasPassword}, isInvited=${isInvited}, isHost=${room.hostId === odId}, providedPassword=${password ? '***' : 'none'}`);
      if (roomHasPassword && !isInvited && room.hostId !== odId) {
        if (!password || password.trim() !== room.settings.password!.trim()) {
          dbg(`[Socket] joinRoom: password mismatch for room ${roomId}`);
          socket.emit('error', 'Неверный пароль');
          cb(false);
          return;
        }
        dbg(`[Socket] joinRoom: password correct for room ${roomId}`);
      }

      // Skip balance check for tutorial rooms
      if (room.settings.isTutorial) {
        room.players.push({ id: odId, name: playerDisplayNames.get(odId) || name, ready: false, isBot: false });
        socket.join(roomId);
        trackPlayerRoom(odId, roomId);
        io.to(roomId).emit('roomUpdated', sanitizeRoom(room));
        io.to(roomId).emit('playerJoined', { id: odId, name });
        broadcastRoomList();
        cb(true, sanitizeRoom(room));
        return;
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

        room.players.push({ id: odId, name: playerDisplayNames.get(odId) || name, ready: false, isBot: false });
        socket.join(roomId);
        trackPlayerRoom(odId, roomId);
        io.to(roomId).emit('roomUpdated', sanitizeRoom(room));
        io.to(roomId).emit('playerJoined', { id: odId, name });
        broadcastRoomList();
        cb(true, sanitizeRoom(room));
      }).catch(err => {
        console.error('[Socket] Balance check error:', err);
        // Allow join on DB error (graceful degradation)
        room.players.push({ id: odId, name: playerDisplayNames.get(odId) || name, ready: false, isBot: false });
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
        avatarId: p.avatarId,
      }));

      const betAmount = room.settings.betAmount || 100;
      const totalPool = betAmount * room.players.length; // bots also contribute to pool

      // Create game FIRST (deal cards), then deduct shanyraks
      const gameState = createGame(roomId, playerInfos, room.settings);
      gameState.prizePool = totalPool;
      games.set(roomId, gameState);
      room.gameState = gameState;

      // Record game start time for duration calculation
      room.gameStartedAt = Date.now();
      // Initialize achievement tracking for this game
      initGameTracking(roomId);

      // Initialize trump tracking for change detection
      lastTrumpPhase.set(roomId, gameState.trumpInfo.phase);
      lastTrumpSuit.set(roomId, gameState.trumpInfo.currentTrump);

      // Broadcast game state immediately so players see cards dealt
      broadcastGameState(roomId, gameState);
      startTurnTimer(roomId);
      startWatchdog(roomId);
      broadcastRoomList();
      scheduleBotAction(roomId);

      // Skip bet deduction for tutorial rooms
      if (room.settings.isTutorial) {
        dbg(`[Socket] Tutorial room ${roomId} - skipping bet deduction`);
        return;
      }

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

      // Capture pre-play state for achievement tracking
      const prePlayCard = gameState.players[playerIdx]?.hand.find(c => c.id === data.cardId);
      const prePlayBattlefield = [...gameState.battleField];
      const prePlayDirection = gameState.direction;
      const prePlayBattlefieldLength = gameState.battleField.length;
      // Track hand size before this card is played (for first_berkut: finish with 1 card)
      const prePlayHandSize = gameState.players[playerIdx]?.hand.length ?? 0;
      trackBerkutHandSize(data.roomId, odId, prePlayHandSize);

      if (isDefender && gameState.turnPhase === 'defend' && !gameState.defenderTaking) {
        error = playDefenseCard(gameState, playerIdx, data.cardId, data.targetPairIdx);
      } else {
        error = playAttackCard(gameState, playerIdx, data.cardId);
      }

      if (error) {
        socket.emit('error', error);
        // Re-send current available actions so client UI stays in sync
        // (prevents stale state where client thinks card is still playable after reconnect)
        const actions = getAvailableActions(gameState, playerIdx);
        socket.emit('yourTurn', actions);
        return;
      }

      // --- Achievement tracking ---
      const botCount = gameState.players.filter(p => p.isBot).length;
      const totalPlayersInRoom = gameState.players.length;
      if (prePlayCard) {
        const gameId = playerGameIds.get(odId);
        if (gameId) {
          // Track defense events
          if (isDefender && prePlayCard) {
            const targetPair = prePlayBattlefield.find(p => !p.defense);
            const attackCard = targetPair?.attack;
            if (attackCard) {
              const currentTrump = gameState.trumpInfo.currentTrump;
              const isTrumpDefense = prePlayCard.suit === currentTrump && attackCard.suit !== currentTrump;
              trackTrumpDefense(data.roomId, odId, isTrumpDefense);
              // Track trump ace usage (defender plays trump ace)
              if (prePlayCard.rank === 'A' && prePlayCard.suit === currentTrump) {
                trackTrumpAceUsed(data.roomId, odId);
              }
              // Async achievement checks
              getDb().then(async db => {
                if (!db) return;
                const rows = await db.select({ id: playerProfiles.id, gamesPlayed: playerProfiles.gamesPlayed }).from(playerProfiles).where(eq(playerProfiles.gameId, gameId)).limit(1);
                const profileId = rows[0]?.id;
                if (!profileId) return;
                const isFirstGame = (rows[0]?.gamesPlayed ?? 1) === 0;
                const attackIsKingOfSpades = attackCard.rank === 'K' && attackCard.suit === 'spades';
                const attackIsTrumpAce = attackCard.rank === 'A' && attackCard.suit === currentTrump;
                const attackIs777 = attackCard.rank === '777';
                const defenseIs777 = prePlayCard.rank === '777';
                const defenseIsKingOfSpades = prePlayCard.rank === 'K' && prePlayCard.suit === 'spades';
                const defenseIsAceOfSpades = prePlayCard.rank === 'A' && prePlayCard.suit === 'spades';
                processDefenseAchievement({
                  profileId, botCount, totalPlayersInRoom,
                  isTrumpDefense, attackIsKingOfSpades, defenseIs777,
                  attackIsTrumpAce, defenseIsKingOfSpades, attackIs777,
                  isFirstGame, roomId: data.roomId, odId,
                }).catch(() => {});
                processLittleHeroAchievement({
                  profileId, botCount, totalPlayersInRoom,
                  attackIsKingOfSpades, defenseIsAceOfSpades,
                }).catch(() => {});
              }).catch(() => {});
            }
          }
          // Track attack (any card played as attacker)
          if (!isDefender && prePlayCard) {
            trackAttack(data.roomId, odId);
            // Track started-turn-with-10 (10 played as first card of attack)
            if (prePlayBattlefieldLength === 0 && prePlayCard.rank === '10') {
              trackStartedTurnWith10(data.roomId, odId);
            }
            // Track threw-6-to-non-neighbor: 6 played when battlefield has cards (adding to existing attack)
            // Non-neighbor check: attacker is not the direct neighbor of defender
            if (prePlayCard.rank === '6' && prePlayBattlefieldLength > 0) {
              const defIdx = gameState.currentDefenderIdx;
              const nPlayers = gameState.players.length;
              const leftNeighborIdx = (defIdx - 1 + nPlayers) % nPlayers;
              const rightNeighborIdx = (defIdx + 1) % nPlayers;
              if (playerIdx !== leftNeighborIdx && playerIdx !== rightNeighborIdx) {
                trackThrew6ToNonNeighbor(data.roomId, odId);
              }
            }
            // Track cards in one turn (count cards on battlefield after play)
            const cardsOnBattlefield = gameState.battleField.filter(p => !p.defense).length;
            trackCardsInOneTurn(data.roomId, odId, cardsOnBattlefield);
          }
          // Track beat-same-rank-suit defense
          if (isDefender && prePlayCard) {
            const targetPair = prePlayBattlefield.find(p => !p.defense);
            const attackCard = targetPair?.attack;
            if (attackCard && (prePlayCard.rank === attackCard.rank || prePlayCard.suit === attackCard.suit)) {
              trackBeatSameRankSuit(data.roomId, odId);
            }
          }
          // Track attack events (10 as lead card = direction reversal)
          if (!isDefender && prePlayCard && prePlayBattlefieldLength === 0 && prePlayCard.rank === '10') {
            // 10 was played as lead card — direction changed
            getDb().then(db => {
              if (!db) return;
              db.select({ id: playerProfiles.id }).from(playerProfiles).where(eq(playerProfiles.gameId, gameId)).limit(1).then((rows: { id: number }[]) => {
                const profileId = rows[0]?.id;
                if (!profileId) return;
                processAttackAchievement({
                  profileId, botCount, totalPlayersInRoom,
                  played10AsLead: true, roomId: data.roomId, odId,
                }).catch(() => {});
              }).catch(() => {});
            }).catch(() => {});
          }
          // Track 777 skip turn (lucky sevens — only 777 in hand at start of attack)
          if (!isDefender && prePlayBattlefieldLength === 0 && prePlayCard.rank === '777') {
            getDb().then(db => {
              if (!db) return;
              db.select({ id: playerProfiles.id }).from(playerProfiles).where(eq(playerProfiles.gameId, gameId)).limit(1).then((rows: { id: number }[]) => {
                const profileId = rows[0]?.id;
                if (!profileId) return;
                processLucky777Achievement({ profileId, botCount, totalPlayersInRoom }).catch(() => {});
              }).catch(() => {});
            }).catch(() => {});
          }
        }
      }

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
          // Track fully-defended round for achievement
          const defOdId = gs.players[gs.currentDefenderIdx]?.id;
          if (defOdId) trackSuccessfulRound(data.roomId, defOdId);
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
        const defOdId2 = gameState.players[gameState.currentDefenderIdx]?.id;
        if (defOdId2) trackSuccessfulRound(data.roomId, defOdId2);
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
      // Capture pre-transfer state for achievement tracking
      const preTransferCard = gameState.players[playerIdx]?.hand.find(c => c.id === data.cardId);
      const preTransferAttackerOdId = gameState.players[gameState.currentAttackerIdx]?.id;
      const error = transferAttack(gameState, playerIdx, data.cardId);
      if (error) {
        socket.emit('error', error);
        socket.emit('yourTurn', getAvailableActions(gameState, playerIdx));
        return;
      }

      // Reset consecutive timeout counter — player took action
      if (gameState.consecutiveTimeouts[odId]) {
        gameState.consecutiveTimeouts[odId] = 0;
      }

      // Achievement tracking for transfers
      trackTransfer(data.roomId, odId);
      if (preTransferCard?.rank === '10' && preTransferAttackerOdId) {
        const spiderman = track10Transfer(data.roomId, odId, preTransferAttackerOdId);
        if (spiderman) {
          const gameId = playerGameIds.get(odId);
          if (gameId) {
            const botCount = gameState.players.filter(p => p.isBot).length;
            const totalPlayersInRoom = gameState.players.length;
            getDb().then(db => {
              if (!db) return;
              db.select({ id: playerProfiles.id }).from(playerProfiles).where(eq(playerProfiles.gameId, gameId)).limit(1).then((rows: { id: number }[]) => {
                const profileId = rows[0]?.id;
                if (!profileId) return;
                processSpidermanMemeAchievement({ profileId, botCount, totalPlayersInRoom }).catch(() => {});
              }).catch(() => {});
            }).catch(() => {});
          }
        }
      }

      markProgress(data.roomId);
      restartTurnTimer(data.roomId);
      broadcastGameState(data.roomId, gameState);
      scheduleBotAction(data.roomId);
    });

    // Multi-card transfer: transfer all selected cards at once
    socket.on('transferCards', (data: { roomId: string; cardIds: string[] }) => {
      const gameState = games.get(data.roomId);
      if (!gameState) return;

      const playerIdx = gameState.players.findIndex(p => p.id === odId);
      const error = transferMultipleCards(gameState, playerIdx, data.cardIds);
      if (error) {
        socket.emit('error', error);
        socket.emit('yourTurn', getAvailableActions(gameState, playerIdx));
        return;
      }

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
      if (error) {
        socket.emit('error', error);
        socket.emit('yourTurn', getAvailableActions(gameState, playerIdx));
        return;
      }
      // Track pass card shown
      trackPassCardShown(data.roomId, odId);
      // Reset consecutive timeout counter — player took action
      if (gameState.consecutiveTimeouts[odId]) {
        gameState.consecutiveTimeouts[odId] = 0;
      }
      markProgress(data.roomId);
      restartTurnTimer(data.roomId);
      broadcastGameState(data.roomId, gameState);
      scheduleBotAction(data.roomId);
    });
    // Multi-card pass-through: show multiple pass-through cards at once
    socket.on('showPassThroughs', (data: { roomId: string; cardIds: string[] }) => {
      const gameState = games.get(data.roomId);
      if (!gameState) return;

      const playerIdx = gameState.players.findIndex(p => p.id === odId);
      const error = showMultiplePassThroughs(gameState, playerIdx, data.cardIds);
      if (error) {
        socket.emit('error', error);
        socket.emit('yourTurn', getAvailableActions(gameState, playerIdx));
        return;
      }

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
      if (error) {
        socket.emit('error', error);
        socket.emit('yourTurn', getAvailableActions(gameState, playerIdx));
        return;
      }

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
      if (error) {
        socket.emit('error', error);
        socket.emit('yourTurn', getAvailableActions(gameState, playerIdx));
        return;
      }

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

      // Счастливые семёрки — player skips turn because only 777 in hand
      {
        const botCount = gameState.players.filter(p => p.isBot).length;
        const totalPlayersInRoom = gameState.players.length;
        const gameId = playerGameIds.get(odId);
        if (gameId) {
          getDb().then(db => {
            if (!db) return;
            db.select({ id: playerProfiles.id }).from(playerProfiles).where(eq(playerProfiles.gameId, gameId)).limit(1).then((rows: { id: number }[]) => {
              const profileId = rows[0]?.id;
              if (!profileId) return;
              processLucky777Achievement({ profileId, botCount, totalPlayersInRoom }).catch(() => {});
            }).catch(() => {});
          }).catch(() => {});
        }
      }

      // Skip turn for 777-only hand:
      // - If defender is taking: finalize the take (cards go to defender)
      // - If cards on table but not in pickup mode: use engineEndAttack so the
      //   engine properly handles the battlefield (successful defense or pass to next attacker)
      // - No cards on table: just advance the turn
      if (gameState.defenderTaking) {
        trackAndFinalizeTake(roomId, gameState);
      } else if (gameState.battleField.length > 0) {
        // Use engineEndAttack so the battlefield is handled correctly
        engineEndAttack(gameState, playerIdx);
      } else {
        // No cards on table — just advance the turn
        const nextAttacker = getNextActivePlayer(gameState.players, playerIdx, gameState.direction);
        gameState.currentAttackerIdx = nextAttacker;
        gameState.currentDefenderIdx = getNextActivePlayer(gameState.players, nextAttacker, gameState.direction);
      }

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

      // Record forfeit as a loss in player stats
      const forfeitGameId = playerGameIds.get(odId);
      if (forfeitGameId) {
        const hasBots = gameState.players.some(p => p.isBot);
        const botCount = gameState.players.filter(p => p.isBot).length;
        const totalPlayersInRoom = gameState.players.length;
        const botRatio = totalPlayersInRoom > 0 ? botCount / totalPlayersInRoom : 0;
        const isBotGame = botRatio > 0.334;
        const forfeitRoom = rooms.get(roomId);
        const isTutorial = forfeitRoom?.settings.isTutorial || false;
        if (!isTutorial) {
          recordForfeitLoss(forfeitGameId, isBotGame)
            .catch((err: Error) => console.error('[DB] Failed to record forfeit loss:', err));
        }
      }

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
      dbg(`[Socket] inviteFriend called by ${odId} for room ${data.roomId}, targetGameId: ${data.targetGameId}`);
      const room = rooms.get(data.roomId);
      if (!room) {
        dbg(`[Socket] inviteFriend: room ${data.roomId} not found`);
        return;
      }
      // Only room host or players in the room can invite
      if (!room.players.some(p => p.id === odId)) {
        dbg(`[Socket] inviteFriend: player ${odId} not in room`);
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
        dbg(`[Socket] inviteFriend: target gameId ${targetGameId} not found. socketPlayers size: ${socketPlayers.size}, playerGameIds:`, Array.from(playerGameIds.entries()));
        socket.emit('error', 'Игрок не найден или не в сети');
        return;
      }
      dbg(`[Socket] inviteFriend: found target ${targetOdId} with sid ${targetSid}`);

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
      dbg(`[Socket] ${name} (gameId: ${senderGameId}) invited gameId: ${targetGameId} to room ${data.roomId}`);
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
        dbg(`[Socket] ${name} declined invite to room ${data.roomId} from gameId ${inviterGameId}`);
      }
    });

    // --- Register player profile (store gameId mapping) ---
    socket.on('registerProfile', (data, cb) => {
      if (data.gameId && data.gameId > 0) {
        playerGameIds.set(odId, data.gameId);
        if (data.avatarId) {
          playerAvatarIds.set(odId, data.avatarId);
        }
        if (data.equippedFrame) {
          playerEquippedFrames.set(odId, data.equippedFrame);
        } else {
          playerEquippedFrames.delete(odId);
        }
        // Track premium status
        if (data.isPremium) {
          playerIsPremium.set(odId, true);
        } else {
          playerIsPremium.delete(odId);
        }
        // Track season rating
        if (typeof data.seasonRating === 'number') {
          playerSeasonRatings.set(odId, data.seasonRating);
        }
        // Store custom display name for reconnect scenarios
        if (data.displayName) {
          playerDisplayNames.set(odId, data.displayName);
          // Update the local name variable and socketPlayers entry
          name = data.displayName;
          socketPlayers.set(socket.id, { odId, name: data.displayName });
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
        dbg(`[Socket] Registered gameId ${data.gameId} for ${odId} (${data.displayName})`);
        // Resolve and cache profileId (playerProfiles.id) for achievement tracking
        getDb().then(db => {
          if (!db) return;
          db.select({ id: playerProfiles.id })
            .from(playerProfiles)
            .where(eq(playerProfiles.gameId, data.gameId))
            .limit(1)
            .then((rows: { id: number }[]) => {
              if (rows[0]?.id) playerProfileIds.set(odId, rows[0].id);
            })
            .catch(() => {});
        }).catch(() => {});
        // Broadcast online status to friends
        broadcastOnlineFriends(odId);
      }
      if (typeof cb === 'function') cb(true);
    });

    // Disconnect — start grace period instead of immediate removal
    socket.on('disconnect', (reason) => {
      // Detailed disconnect logging for diagnostics
      const disconnectReasons: Record<string, string> = {
        'server namespace disconnect': 'Server explicitly disconnected the client',
        'client namespace disconnect': 'Client called socket.disconnect()',
        'ping timeout': 'Client did not respond to ping within pingTimeout',
        'transport close': 'Connection was closed (network issue, proxy timeout, etc)',
        'transport error': 'Transport encountered an error',
        'parse error': 'Received invalid packet',
        'forced close': 'Server called socket.disconnect(true)',
        'forced server close': 'Server shut down',
      };
      const reasonDesc = disconnectReasons[reason] || 'Unknown reason';
      dbg(`[Socket] Disconnected: ${socket.id} (odId: ${odId}) reason: ${reason} (${reasonDesc})`);

      socketPlayers.delete(socket.id);
      // Broadcast offline status to friends
      broadcastOnlineFriends(odId);
      // Don't delete from playerSockets yet — wait for grace period

      // Use the latest display name (custom name from settings)
      const disconnectName = playerDisplayNames.get(odId) || name;

      // Check if this player is in any active game rooms
      const roomSet = playerRooms.get(odId);
      const isInActiveGame = roomSet && Array.from(roomSet).some(rid => {
        const gs = games.get(rid);
        return gs && gs.gamePhase === 'playing';
      });

      if (isInActiveGame) {
        // Start grace period — give player time to reconnect
        dbg(`[Socket] Starting ${FREEZE_TIMEOUT_MS / 1000}s freeze period for ${odId}`);

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
            disconnectedName: disconnectName,
            secondsLeft: Math.floor(FREEZE_TIMEOUT_MS / 1000),
            timer: null as any,
            tickInterval: null as any,
          };

          // Notify other players in the room
          io.to(rid).emit('roomFrozen', {
            roomId: rid,
            disconnectedPlayerName: disconnectName,
            timeoutSeconds: freezeInfo.secondsLeft,
          });

          // Tick every second
          freezeInfo.tickInterval = setInterval(() => {
            freezeInfo.secondsLeft--;
            io.to(rid).emit('frozenTimerTick', { roomId: rid, secondsLeft: freezeInfo.secondsLeft });
          }, 1000);

          // After timeout, forfeit the player
          freezeInfo.timer = setTimeout(() => {
            dbg(`[Socket] Freeze expired for ${odId} in room ${rid} — forfeiting`);
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
                // STABILITY: Check if game should end after forfeit
                checkGameOver(gameState);
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
        // Not in active game — but still give a grace period for waiting rooms
        // This prevents rooms from closing when the host has a brief connection drop
        const roomSet2 = playerRooms.get(odId);
        const isInWaitingRoom = roomSet2 && Array.from(roomSet2).some(rid => {
          const r = rooms.get(rid);
          return r && r.players.some((p: { id: string }) => p.id === odId);
        });

        if (isInWaitingRoom) {
          // Grace period for waiting rooms — don't remove immediately
          dbg(`[Socket] Starting ${DISCONNECT_GRACE_MS / 1000}s grace period for ${odId} (waiting room)`);
          const timer = setTimeout(() => {
            disconnectTimers.delete(odId);
            // Check if player reconnected (has a new socket)
            if (playerSockets.get(odId)) {
              dbg(`[Socket] Grace period expired but ${odId} already reconnected — skipping removal`);
              return;
            }
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
          }, DISCONNECT_GRACE_MS);
          disconnectTimers.set(odId, timer);
        } else {
          // Not in any room — clean up immediately
          playerSockets.delete(odId);
          playerRooms.delete(odId);
          // Clean up display name / profile caches to prevent memory leak
          playerDisplayNames.delete(odId);
          playerGameIds.delete(odId);
          playerAvatarIds.delete(odId);
          playerEquippedFrames.delete(odId);
        }
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

  // Don't run turn timer for tutorial rooms
  const room = rooms.get(roomId);
  if (room?.settings.isTutorial) return;

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
  // Skip watchdog for tutorial rooms
  const watchdogRoom = rooms.get(roomId);
  if (watchdogRoom?.settings.isTutorial) return;

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
        // CRITICAL FIX: Do NOT forfeit if there is an active freeze timer for this player
        // The freeze timer means the player disconnected and has 30s to reconnect
        // Watchdog runs every 10s so it would fire BEFORE the freeze expires — causing false forfeit
        const freezeInfo = frozenRooms.get(roomId);
        if (freezeInfo && freezeInfo.disconnectedOdId === p.id) {
          dbg(`[Watchdog] Player ${p.name} (${p.id}) not in socket room but has active freeze timer (${freezeInfo.secondsLeft}s left) — skipping forfeit`);
          continue; // Let the freeze timer handle it
        }

        // Also skip if there is a pending disconnect grace timer for this player
        if (disconnectTimers.has(p.id)) {
          dbg(`[Watchdog] Player ${p.name} (${p.id}) not in socket room but has active grace timer — skipping forfeit`);
          continue; // Let the grace timer handle it
        }

        const playerIdx = gs.players.indexOf(p);
        console.warn(`[Watchdog] Player ${p.name} (${p.id}) has no socket connection to room ${roomId} and no grace/freeze timer. Auto-forfeiting.`);
        forfeitedFromRoom.add(`${p.id}:${roomId}`);
        untrackPlayerRoom(p.id, roomId);
        forfeitPlayer(gs, playerIdx);
        // STABILITY: Check if game should end after forfeit
        checkGameOver(gs);
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
          trackAndFinalizeTake(roomId, gs);
        } else {
          const defOdIdForce = gs.players[gs.currentDefenderIdx]?.id;
          if (defOdIdForce) trackSuccessfulRound(roomId, defOdIdForce);
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
  dbg(`[Timer] ${player.name} forfeited due to 2 consecutive timeouts`);
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
  dbg(`[Timer] Time up. Phase: ${gameState.turnPhase}, taking: ${gameState.defenderTaking}, bf: ${gameState.battleField.length}, attacker: ${gameState.players[gameState.currentAttackerIdx]?.name}, defender: ${gameState.players[gameState.currentDefenderIdx]?.name}`);
  // Keep warn for unexpected states
  if (!gameState.players[gameState.currentAttackerIdx] || !gameState.players[gameState.currentDefenderIdx]) {
    console.warn('[Timer] handleTimeUp: missing attacker or defender — possible stale game state');
  }

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
    dbg(`[Timer] Player ${gameState.players[timeoutPlayerIdx]?.name} timeout #${prevCount + 1}`);

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
    trackAndFinalizeTake(roomId, gameState);
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
          trackAndFinalizeTake(roomId, gameState);
        } else {
          // If no one can act and defender is NOT taking, this means
          // all cards are defended and no one can add more — successful defense
          const defOdIdDeadlock = gameState.players[gameState.currentDefenderIdx]?.id;
          if (defOdIdDeadlock) trackSuccessfulRound(roomId, defOdIdDeadlock);
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

  // Stop all bot actions during tutorial
  const room = rooms.get(roomId);
  if (room?.settings.isTutorial) return;

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
      forceResolveStuckState(roomId, gs, activeIdx);
      botFailCounts.delete(roomId);
      resetTurnTimer(gs);
      restartTurnTimer(roomId);
      broadcastGameState(roomId, gs);
      scheduleBotAction(roomId);
      return;
    }

    const success = executeBotAction(roomId, gs, activeIdx, botAction);
    
    if (!success) {
      // Bot action FAILED — this is the main freeze cause
      const fails = (botFailCounts.get(roomId) || 0) + 1;
      botFailCounts.set(roomId, fails);
      console.warn(`[Bot] Action failed (attempt ${fails}/${MAX_BOT_FAILS}). Bot: ${activePlayer.name}, action: ${botAction.action}`);
      
      if (fails >= MAX_BOT_FAILS) {
        // Too many failures — force-resolve
        console.error(`[Bot] Max failures reached. Force-resolving stuck state.`);
        forceResolveStuckState(roomId, gs, activeIdx);
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
        const defOdIdBot = gs2.players[gs2.currentDefenderIdx]?.id;
        if (defOdIdBot) trackSuccessfulRound(roomId, defOdIdBot);
        successfulDefense(gs2);
        broadcastGameState(roomId, gs2);
        restartTurnTimer(roomId);
        scheduleBotAction(roomId);
      }, 3000);
      return;
    }

    if (gs._autoCompleteDefense) {
      gs._autoCompleteDefense = false;
      const defOdIdBotAuto = gs.players[gs.currentDefenderIdx]?.id;
      if (defOdIdBotAuto) trackSuccessfulRound(roomId, defOdIdBotAuto);
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
function forceResolveStuckState(roomId: string, gs: GameState, botIdx: number) {
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
        trackAndFinalizeTake(roomId, gs);
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
    trackAndFinalizeTake(roomId, gs);
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

// Helper: track cards taken by defender then finalize take
function trackAndFinalizeTake(roomId: string, gs: GameState): void {
  const defenderOdId = gs.players[gs.currentDefenderIdx]?.id;
  if (defenderOdId && !gs.players[gs.currentDefenderIdx]?.isBot) {
    // Count all cards on battlefield that will go to defender's hand
    let cardCount = 0;
    for (const pair of gs.battleField) {
      cardCount++; // attack card
      if (pair.defense) cardCount++; // defense card
    }
    if (cardCount > 0) trackCardsTaken(roomId, defenderOdId, cardCount);
  }
  engineFinalizeTake(gs);
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

      const success = executeBotAction(roomId, gs, i, botAction);
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

function executeBotAction(roomId: string, gs: GameState, botIdx: number, botAction: { action: string; cardId?: string; targetPairIdx?: number }): boolean {
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
      if (gs.defenderTaking) {
        trackAndFinalizeTake(roomId, gs);
      } else if (gs.battleField.length > 0) {
        error = engineEndAttack(gs, botIdx);
      } else {
        const nextAttacker = getNextActivePlayer(gs.players, botIdx, gs.direction);
        gs.currentAttackerIdx = nextAttacker;
        gs.currentDefenderIdx = getNextActivePlayer(gs.players, nextAttacker, gs.direction);
      }
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
    dbg(`[Game] Trump changed in room ${roomId}: phase ${prevPhase}→${currentPhase}, suit ${prevSuit}→${currentSuit}`);
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
        dbg(`[Prize] Credited ${prize.amount} shanyraks to ${prize.playerId} (place ${prize.place}) in room ${roomId}`);
      }
    }
  }

  const room = rooms.get(roomId);

  // If game is finished, send gameOver FIRST to avoid race condition
  // where client sees a stale gameStateUpdate (wrong attacker) before gameOver
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
      dbg(`[Prize] Final distribution emitted for room ${roomId}: pool=${gameState.prizePool}, winners=${gameState.playerPrizes.length}`);
    }
    
    // Clean up credited prizes tracking
    const creditedKey = `credited_${roomId}`;
    delete (broadcastGameState as any)[creditedKey];

    // Record game result in database (async, non-blocking)
    // Skip stats only for tutorial rooms
    const finishedRoom = rooms.get(roomId);
    const hasBots = gameState.players.some(p => p.isBot);
    const botCount = gameState.players.filter(p => p.isBot).length;
    const totalPlayersInRoom = gameState.players.length; // humans + bots
    const isTutorial = finishedRoom?.settings.isTutorial || false;
    if (isTutorial) {
      dbg(`[Stats] Skipping stats for room ${roomId} (tutorial)`);
    }
    // Exclude forfeited human players — their stats were already recorded on forfeit
    const humanPlayers = gameState.players.filter(p => !p.isBot && !p.leftGame);
    if (humanPlayers.length > 0 && !isTutorial) {
      // Sort players by their finish place so ratingTable[idx] maps correctly:
      // place 1 (winner) = idx 0 => +25, place null (loser/durak) = last => -25
      const sortedHumanPlayers = [...humanPlayers].sort((a, b) => {
        const pa = a.winPlace ?? Number.MAX_SAFE_INTEGER;
        const pb = b.winPlace ?? Number.MAX_SAFE_INTEGER;
        return pa - pb;
      });
      // Look up profile IDs from playerGameIds map (odId -> gameId)
      const allPlayerProfileIds = sortedHumanPlayers
        .map(p => playerGameIds.get(p.id))
        .filter((id): id is number => id !== undefined && id > 0);
      const winnerOdId = gameState.winnersOrder[0] || null;
      const loserOdId = gameState.loserId || null;
      const winnerProfileId = winnerOdId ? (playerGameIds.get(winnerOdId) ?? null) : null;
      const loserProfileId = loserOdId ? (playerGameIds.get(loserOdId) ?? null) : null;
      // Track win-when-opponent-has-1-card: for each winner, check if any opponent had 1 card
      for (const winner of sortedHumanPlayers.filter(p => p.winPlace !== null && p.winPlace !== undefined)) {
        const opponents = humanPlayers.filter(p => p.id !== winner.id);
        const anyOpponentHas1Card = opponents.some(p => p.hand.length === 1);
        if (anyOpponentHas1Card) {
          trackWinWhenOpponentHas1Card(roomId, winner.id);
        }
      }
      if (allPlayerProfileIds.length > 0) {
        // Collect premium gameIds for rating bonus
        const premiumGameIds = sortedHumanPlayers
          .filter(p => playerIsPremium.get(p.id) === true)
          .map(p => playerGameIds.get(p.id))
          .filter((id): id is number => id !== undefined && id > 0);

        const durationSeconds = room?.gameStartedAt ? Math.round((Date.now() - room.gameStartedAt) / 1000) : 0;
        recordGameResult({
          roomId,
          playerCount: humanPlayers.length,
          winnerProfileId,
          loserProfileId,
          allPlayerProfileIds,
          durationSeconds,
          hasBots,
          botCount,
          totalPlayersInRoom,
          premiumGameIds,
        }).catch(err => console.error('[DB] Failed to record game result:', err));

        // Process achievements for all human players
        // winnerTookNoCards: winner took 0 cards during the game (tracked via trackCardsTaken)
        const cardsTakenMap = getCardsTakenMap(roomId);
        const winnerTookNoCards = winnerOdId ? (cardsTakenMap.get(winnerOdId) ?? 0) === 0 : false;
        const allHumanOdIds = humanPlayers.map(p => p.id);

        // Process achievements + daily quests, then send toast notifications
        const notifyAfterGame = async () => {
          try {
            // Snapshot achievement state before processing
            const db = await getDb();
            const { userAchievements: userAchievementsTable, userDailyQuests: userDailyQuestsTable } = await import('../drizzle/schema');
            const { and: drizzleAnd, eq: drizzleEq, isNull } = await import('drizzle-orm');

            // For each human player, record which achievements/quests were already unlocked
            const preAchievements = new Map<string, Set<string>>(); // odId -> Set<achievementKey>
            const preQuests = new Map<string, Set<string>>(); // odId -> Set<questKey>

            if (db) {
              const dayStart = getMoscowDayStart();
              for (const odId of allHumanOdIds) {
                const profileId = playerProfileIds.get(odId);
                if (!profileId) continue;
                const achRows = await db.select({ achievementKey: userAchievementsTable.achievementKey })
                  .from(userAchievementsTable)
                  .where(drizzleEq(userAchievementsTable.profileId, profileId));
                preAchievements.set(odId, new Set(achRows.map((r: { achievementKey: string }) => r.achievementKey)));
                const questRows = await db.select({ questKey: userDailyQuestsTable.questKey })
                  .from(userDailyQuestsTable)
                  .where(drizzleAnd(
                    drizzleEq(userDailyQuestsTable.profileId, profileId),
                    drizzleEq(userDailyQuestsTable.dayStartTs, dayStart),
                  ));
                preQuests.set(odId, new Set(questRows.map((r: { questKey: string }) => r.questKey)));
              }
            }

            const room = rooms.get(roomId);
            const gameDurationSeconds = room?.gameStartedAt ? Math.round((Date.now() - room.gameStartedAt) / 1000) : 0;
            await processGameEndAchievements({
              roomId,
              playerGameIds,
              winnersOrder: gameState.winnersOrder,
              loserId: gameState.loserId,
              allHumanOdIds,
              botCount,
              totalPlayersInRoom,
              durationSeconds: gameDurationSeconds,
              winnerTookNoCards,
              trumpDefenseCounts: new Map(),
              totalDefenseCounts: new Map(),
              throwCounts: new Map(),
              consecutiveWinStreaks: new Map(),
              transferCounts: new Map(),
            });

            // Process first_berkut achievement: finish with exactly 1 card in hand
            const botRatioCheck = totalPlayersInRoom > 0 ? botCount / totalPlayersInRoom : 0;
            if (botRatioCheck < 0.334) {
              for (const odId of allHumanOdIds) {
                const playerState = gameState.players.find(p => p.id === odId);
                if (!playerState) continue;
                const profileId = playerProfileIds.get(odId);
                if (!profileId) continue;
                // first_berkut: player finished with exactly 1 card in hand before playing their last card
                // We use getBerkutHandSize which was tracked before the last card was played
                if (playerState.isOut && playerState.winPlace !== null) {
                  const handSizeBeforeLastCard = getBerkutHandSize(roomId, odId);
                  processFirstBerkutAchievement({
                    profileId, handSize: handSizeBeforeLastCard,
                    botCount, totalPlayersInRoom,
                  }).catch(() => {});
                }
              }
            }

            // Build perPlayerStats from in-memory tracking maps
            const trumpDefMap = getTrumpDefMap(roomId);
            const totalDefMap = getTotalDefMap(roomId);
            const throwMap = getThrowMap(roomId);
            const transferMap = getTransferMap(roomId);
            const cardsTakenMap = getCardsTakenMap(roomId);
            const trumpAceMap = getTrumpAceUsed(roomId);
            const passCardsShownMap = getPassCardsShownMap(roomId);
            const attacksMap = getAttacksMap(roomId);
            const maxCardsInOneTurnMap = getMaxCardsInOneTurnMap(roomId);
            const beatSameRankSuitMap = getBeatSameRankSuitMap(roomId);
            const threw6ToNonNeighborMap = getThrew6ToNonNeighborMap(roomId);
            const startedTurnWith10Map = getStartedTurnWith10Map(roomId);
            const winWhenOpponentHas1CardMap = getWinWhenOpponentHas1CardMap(roomId);
            const perPlayerStats = new Map<string, {
              cardsTaken: number; trumpDefenses: number; defenses: number;
              cardsThrown: number; attacks: number; trumpBeats: number;
              trumpAceUsed: number; transfers: number; passCardsShown: number;
              startedTurnWith10: number; defended777: number; threw6ToNonNeighbor: number;
              beatSameRankSuit: number; spadeKingBeatsTrumpAce: number;
              kingBeatsTrump: number; cardsInOneTurn: number; trumpAceInOneGame: number;
              winWhenOpponentHas1Card: number;
            }>();
            for (const odId of allHumanOdIds) {
              const trumpAceCount = trumpAceMap.get(odId) ?? 0;
              perPlayerStats.set(odId, {
                cardsTaken: cardsTakenMap.get(odId) ?? 0,
                trumpDefenses: trumpDefMap.get(odId) ?? 0,
                defenses: totalDefMap.get(odId) ?? 0,
                cardsThrown: throwMap.get(odId) ?? 0,
                attacks: attacksMap.get(odId) ?? 0,
                trumpBeats: trumpDefMap.get(odId) ?? 0,
                trumpAceUsed: trumpAceCount,
                transfers: transferMap.get(odId) ?? 0,
                passCardsShown: passCardsShownMap.get(odId) ?? 0,
                startedTurnWith10: startedTurnWith10Map.get(odId) ?? 0,
                defended777: 0, // tracked via processDefenseAchievement
                threw6ToNonNeighbor: threw6ToNonNeighborMap.get(odId) ?? 0,
                beatSameRankSuit: beatSameRankSuitMap.get(odId) ?? 0,
                spadeKingBeatsTrumpAce: 0, // tracked via processDefenseAchievement
                kingBeatsTrump: 0, // tracked via processDefenseAchievement
                cardsInOneTurn: maxCardsInOneTurnMap.get(odId) ?? 0,
                trumpAceInOneGame: trumpAceCount,
                winWhenOpponentHas1Card: winWhenOpponentHas1CardMap.get(odId) ?? 0,
              });
            }

            const finalRoom = rooms.get(roomId);
            const finalDurationSeconds = finalRoom?.gameStartedAt ? Math.round((Date.now() - finalRoom.gameStartedAt) / 1000) : 0;
            await processDailyQuestsAfterGame({
              roomId,
              playerGameIds,
              winnersOrder: gameState.winnersOrder,
              loserId: gameState.loserId,
              allHumanOdIds,
              botCount,
              totalPlayersInRoom,
              durationSeconds: finalDurationSeconds,
              perPlayerStats,
            });

            // Send toast notifications for newly unlocked achievements/quests
            if (db) {
              const dayStart = getMoscowDayStart();
              for (const odId of allHumanOdIds) {
                const profileId = playerProfileIds.get(odId);
                if (!profileId) continue;
                const sid = playerSockets.get(odId);
                if (!sid) continue;

                // Check new achievements
                const preAch = preAchievements.get(odId) ?? new Set<string>();
                const achRows = await db.select()
                  .from(userAchievementsTable)
                  .where(drizzleEq(userAchievementsTable.profileId, profileId));
                for (const row of achRows) {
                  if ((row as any).unlocked && !preAch.has(row.achievementKey)) {
                    const def = ACHIEVEMENT_MAP[row.achievementKey];
                    if (def) {
                      io.to(sid).emit('achievementUnlocked', {
                        key: row.achievementKey,
                        nameRu: def.nameRu,
                        nameKk: def.nameKk,
                        nameEn: def.nameEn,
                        shanyrakReward: def.reward?.shanyrak ?? 0,
                      });
                    }
                  }
                }

                // Check new completed quests
                const preQ = preQuests.get(odId) ?? new Set<string>();
                const questRows = await db.select()
                  .from(userDailyQuestsTable)
                  .where(drizzleAnd(
                    drizzleEq(userDailyQuestsTable.profileId, profileId),
                    drizzleEq(userDailyQuestsTable.dayStartTs, dayStart),
                  ));
                for (const row of questRows) {
                  if ((row as any).completed && !preQ.has(row.questKey)) {
                    const def = DAILY_QUEST_MAP[row.questKey];
                    if (def) {
                      io.to(sid).emit('questCompleted', {
                        key: row.questKey,
                        titleRu: def.nameRu,
                        titleKk: def.nameKk,
                        titleEn: def.nameEn,
                        shanyrakReward: def.reward?.shanyrak ?? 0,
                      });
                    }
                  }
                }
              }
            }
          } catch (err) {
            console.error('[Notify] Failed to process game end notifications:', err);
          } finally {
            cleanupGameTracking(roomId);
          }
        };
        notifyAfterGame();
      }
    }
    // After gameOver, also send final gameStateUpdate so client shows correct final state
    for (const p of gameState.players) {
      if (p.isBot) continue;
      const sid = playerSockets.get(p.id);
      if (sid) {
        const clientState = toClientState(gameState, p.id, playerGameIds, playerAvatarIds, playerEquippedFrames, finishedRoom?.settings.betAmount || 0, isTutorial, playerSeasonRatings);
        io.to(sid).emit('gameStateUpdate', clientState);
        io.to(sid).emit('yourTurn', []);
      }
    }
    return;
  }

  // Game still in progress — send gameStateUpdate and yourTurn to each player
  for (const p of gameState.players) {
    if (p.isBot) continue;
    const sid = playerSockets.get(p.id);
    if (sid) {
      const clientState = toClientState(gameState, p.id, playerGameIds, playerAvatarIds, playerEquippedFrames, room?.settings.betAmount || 0, room?.settings.isTutorial || false, playerSeasonRatings);
      io.to(sid).emit('gameStateUpdate', clientState);

      // Always send actions — even empty array to clear stale client state
      const playerIdx = gameState.players.findIndex(pl => pl.id === p.id);
      const actions = playerIdx !== -1 ? getAvailableActions(gameState, playerIdx) : [];
      io.to(sid).emit('yourTurn', actions);
    }
  }
}

function broadcastRoomList() {
  io.emit('roomList', Array.from(rooms.values()).filter(r => !r.settings.isTutorial).map(sanitizeRoom));
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
  // Add premium host flag
  const isPremiumHost = playerIsPremium.get(room.hostId) === true;
  // Inject season ratings into players
  const playersWithRank = room.players.map(p => ({
    ...p,
    seasonRating: p.isBot ? 0 : (playerSeasonRatings.get(p.id) ?? 0),
  }));
  return { ...room, players: playersWithRank, gameState: null, hasActiveGame, activeGamePlayerIds, hasPassword, isPremiumHost, settings: sanitizedSettings };
}
