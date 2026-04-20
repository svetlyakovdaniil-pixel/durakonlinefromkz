/**
 * Ghost Player System — Simulates real human players for cold-start.
 *
 * Ghost players:
 * - Connect via socket.io-client to the local server (same process)
 * - Are NOT marked as isBot — they look identical to real players
 * - Are NOT counted in botCount statistics
 * - Have unique personalities: skill level, play speed, temperament
 * - Create rooms, join rooms, play games, use emotions, sometimes leave early
 * - Have diverse cosmetic profiles (avatars, frames, emotion packs)
 */

import { io as ioClient, Socket } from 'socket.io-client';
import type { ServerToClientEvents, ClientToServerEvents, Room, AvailableAction, ClientGameState } from '../shared/gameTypes';
import { getAvailableRooms } from './socketServer';

// ─── Types ──────────────────────────────────────────────────────────────────

type GhostState = 'idle' | 'browsing' | 'in_lobby' | 'in_game' | 'disconnected';

type Temperament = 'aggressive' | 'passive' | 'balanced' | 'troll' | 'friendly';

interface GhostPersonality {
  nick: string;
  /** 0.0 = very weak, 1.0 = expert */
  skill: number;
  /** ms range for thinking before playing a card */
  thinkMinMs: number;
  thinkMaxMs: number;
  /** Extra long think probability (0–1) — "AFK moment" */
  longThinkProb: number;
  /** Probability of leaving mid-game (0–1) */
  ragequitProb: number;
  /** Probability of leaving lobby before game starts (0–1) */
  lobbyLeaveProb: number;
  /** Probability of sending an emotion per turn (0–1) */
  emotionProb: number;
  temperament: Temperament;
  avatarId: string;
  equippedFrame?: string;
  emotionPack: string;
  /** Preferred bet range [min, max] in shanyraks */
  betRange: [number, number];
  /** Preferred player count range */
  playerCountRange: [number, number];
}

interface GhostPlayer {
  id: string; // ghost-XXXX — used as odId
  personality: GhostPersonality;
  state: GhostState;
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  currentRoomId: string | null;
  isHosting: boolean;
  gameState: ClientGameState | null;
  myActions: AvailableAction[];
  actionTimer: NodeJS.Timeout | null;
  idleTimer: NodeJS.Timeout | null;
  lobbyTimer: NodeJS.Timeout | null;
  reconnectAttempts: number;
}

// ─── Nicknames ───────────────────────────────────────────────────────────────

const GHOST_NICKS: string[] = [
  // Russian/Ukrainian
  'dimon1997', 'Ветерок', 'katya_kyiv98', '4elovek', 'nikita_pro',
  'Roma90', '_andruha', 'igorOK', 'алёна_м', 'MAX_power',
  'zheka_d', 'Юра77', 'slavik', 'tolian', 'misha_ru',
  'olegdn', 'Vitalik', 'danchik', 'rus_34', 'Женёк',
  // Kazakh
  'Айдос', 'nurs_alive', 'Әлібек', 'erlan88', 'bekzat',
  'aru_05', 'daniyar', 'zhandos', 'askar90', 'nomad_kz',
  // Uzbek/Central Asian
  'Aziz_94', 'dilshodlive', 'sardor', 'nodirbek', 'jasur_aka',
  'akmal98', 'farrux', 'ulugbek', 'bek_uz', 'rustam',
  // Azerbaijani
  'elvin', 'Rəşad', 'orxan', 'kamran', 'murad',
  'anar', 'samir', 'ilqar', 'tural', 'emin',
  // Georgian
  'გიორგი', 'nika', 'ლაშა', 'irakli', 'saba',
  'ბექა', 'ზურა', 'temuri', 'vakho', 'gio',
  // Polish
  'Paweł', 'marek', 'Łukasz', 'krzysztof', 'tomek',
  'bartek', 'piotr', 'adrian', 'janek', 'michał',
  // English/International
  'John', 'mike', 'Alex', 'chill_dude', 'noah',
  'david', 'justin', 'player1', 'randomUser', 'realgamer',
  // Female names
  'Катя', 'Алина', 'Даша', 'Милана', 'Аня',
  'Дана', 'Сабина', 'Зарина', 'Мадина', 'Яна',
  // Generic
  'qwerty', 'asdfg', 'zxcvbn', '123abc', 'helloThere',
  'shadow', 'nightowl', 'luckyone', 'fasthand', 'lastmove',
];

// ─── Cosmetics ───────────────────────────────────────────────────────────────

// Free avatars (no premium/season requirement)
const FREE_AVATARS = [
  'wolf', 'eagle', 'bear', 'fox', 'snow-leopard',
  'khan', 'golden_horde', 'diving_eagle', 'neon_paw', 'great_khan',
  'neon_dino', 'neon_cat', 'apocalypse_city', 'toxic_storm', 'nuclear_mushroom',
  'gasmask_amber', 'samurai_amber', 'oni_mask_obsidian', 'amaterasu_ruby',
  'japanese_motifs_zircon', 'underwater_jellyfish', 'anubis_god', 'pirate_captain',
  'norse_warrior', 'space_explorer', 'cyberpunk_warrior', 'hiphop_legend', 'angel_demon',
];

// Shop avatars (premium — only a few ghosts use these)
const SHOP_AVATARS = [
  'nexus_bunny', 'goose_animated', 'kitsune_emerald', 'dragon_ryu_sapphire',
  'fox_smug', 'bear_angry', 'owl_wise', 'cat_lazy', 'wolf_fierce',
  'tiger_proud', 'panda_happy', 'eagle_determined', 'snow_leopard_calm', 'raccoon_mischievous',
];

// All frames available
const ALL_FRAMES = [
  'fire', 'neon', 'lightning', 'ice', 'premium',
  'great_khan', 'obsidian_neon', 'ruby_neon', 'amber_neon', 'zircon_neon',
  'molten_lava', 'oni_japanese',
];

// Emotion packs
const EMOTION_PACKS = ['khan', 'hamster', 'monkey', 'devil', 'raccoon'];

// ─── Personality factory ─────────────────────────────────────────────────────

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function rand(min: number, max: number): number {
  return min + Math.random() * (max - min);
}

function buildPersonality(nick: string, index: number): GhostPersonality {
  // Distribute skill: 60% weak/medium, 30% decent, 10% strong
  const skillRoll = Math.random();
  let skill: number;
  if (skillRoll < 0.3) skill = rand(0.1, 0.35);       // weak
  else if (skillRoll < 0.7) skill = rand(0.35, 0.65); // medium
  else if (skillRoll < 0.9) skill = rand(0.65, 0.82); // decent
  else skill = rand(0.82, 0.97);                        // strong

  // Speed profile
  const speedRoll = Math.random();
  let thinkMinMs: number, thinkMaxMs: number, longThinkProb: number;
  if (speedRoll < 0.25) {
    // Fast player
    thinkMinMs = 400; thinkMaxMs = 1500; longThinkProb = 0.02;
  } else if (speedRoll < 0.65) {
    // Normal player
    thinkMinMs = 1000; thinkMaxMs = 3500; longThinkProb = 0.06;
  } else if (speedRoll < 0.88) {
    // Slow player
    thinkMinMs = 2500; thinkMaxMs = 7000; longThinkProb = 0.12;
  } else {
    // Very slow / AFK-prone
    thinkMinMs = 4000; thinkMaxMs = 10000; longThinkProb = 0.22;
  }

  const temperaments: Temperament[] = ['aggressive', 'passive', 'balanced', 'troll', 'friendly'];
  const temperament = pickRandom(temperaments);

  // Cosmetics: 70% use free avatar only, 20% use shop avatar, 10% use shop avatar + frame
  const cosmeticRoll = Math.random();
  let avatarId: string;
  let equippedFrame: string | undefined;
  let emotionPack: string;

  if (cosmeticRoll < 0.70) {
    avatarId = pickRandom(FREE_AVATARS);
    equippedFrame = undefined;
    emotionPack = 'khan'; // default pack
  } else if (cosmeticRoll < 0.90) {
    avatarId = pickRandom([...FREE_AVATARS, ...SHOP_AVATARS]);
    equippedFrame = undefined;
    emotionPack = pickRandom(EMOTION_PACKS);
  } else {
    avatarId = pickRandom(SHOP_AVATARS);
    equippedFrame = pickRandom(ALL_FRAMES);
    emotionPack = pickRandom(EMOTION_PACKS);
  }

  // Bet preferences — lower bets more common
  const betRoll = Math.random();
  let betRange: [number, number];
  if (betRoll < 0.40) betRange = [100, 500];
  else if (betRoll < 0.70) betRange = [200, 1000];
  else if (betRoll < 0.85) betRange = [500, 3000];
  else betRange = [1000, 10000];

  // Player count preferences
  const pcRoll = Math.random();
  let playerCountRange: [number, number];
  if (pcRoll < 0.35) playerCountRange = [2, 3];
  else if (pcRoll < 0.70) playerCountRange = [3, 5];
  else playerCountRange = [4, 6];

  return {
    nick,
    skill,
    thinkMinMs,
    thinkMaxMs,
    longThinkProb,
    ragequitProb: rand(0.01, 0.06),
    lobbyLeaveProb: rand(0.05, 0.20),
    emotionProb: rand(0.05, 0.30),
    temperament,
    avatarId,
    equippedFrame,
    emotionPack,
    betRange,
    playerCountRange,
  };
}

// ─── Ghost Player Action Logic ───────────────────────────────────────────────

const VALID_EMOTIONS = ['laugh', 'cool', 'angry', 'sad', 'think', 'wow', 'heart', 'hurry', 'win', 'sleep'];

/** Pick an emotion based on temperament */
function pickEmotion(temperament: Temperament): string {
  const emotionsByTemperament: Record<Temperament, string[]> = {
    aggressive: ['angry', 'cool', 'hurry', 'wow'],
    passive: ['sad', 'think', 'sleep', 'heart'],
    balanced: VALID_EMOTIONS,
    troll: ['laugh', 'cool', 'wow', 'win'],
    friendly: ['heart', 'laugh', 'wow', 'cool'],
  };
  return pickRandom(emotionsByTemperament[temperament] || VALID_EMOTIONS);
}

/**
 * Ghost skill-based action selection.
 * skill=1.0 → always optimal play
 * skill=0.0 → random/suboptimal play
 */
function pickGhostAction(
  actions: AvailableAction[],
  skill: number,
  temperament: Temperament,
  gameState: ClientGameState,
): { event: string; data?: unknown } | null {
  if (actions.length === 0) return null;

  // Check what types of actions are available
  const playCard = actions.find(a => a.type === 'playCard');
  const transferCard = actions.find(a => a.type === 'transferCard');
  const showPassThrough = actions.find(a => a.type === 'showPassThrough');
  const takeCards = actions.find(a => a.type === 'takeCards');
  const endAttack = actions.find(a => a.type === 'endAttack');
  const passTurn = actions.find(a => a.type === 'passTurn');
  const skipTurn = actions.find(a => a.type === 'skipTurn');

  const roomId = gameState.roomId;

  // Skip turn (non-active player)
  if (skipTurn) return { event: 'skipTurn', data: roomId };

  // Pass turn (non-active edge player)
  if (passTurn && !playCard && !endAttack) return { event: 'passTurn', data: roomId };

  // Defender logic
  if (takeCards && !playCard && !transferCard && !showPassThrough) {
    // Only option is to take
    return { event: 'takeCards', data: roomId };
  }

  if (takeCards && playCard) {
    // Can defend or take — skill determines whether to try defending
    const shouldDefend = Math.random() < (0.4 + skill * 0.55); // weak=40%, strong=95%
    if (shouldDefend && playCard.type === 'playCard' && playCard.cardIds.length > 0) {
      const cardId = pickRandom(playCard.cardIds);
      // Find a valid target pair
      const undefendedIdx = gameState.battleField.findIndex(p => !p.defense);
      if (undefendedIdx >= 0) {
        return { event: 'playCard', data: { roomId, cardId, targetPairIdx: undefendedIdx } };
      }
    }
    return { event: 'takeCards', data: roomId };
  }

  // Transfer (proezdnoy / pass-through)
  if (showPassThrough && showPassThrough.type === 'showPassThrough' && showPassThrough.cardIds.length > 0) {
    // Use pass-through based on skill: skilled players use it more
    if (Math.random() < (0.3 + skill * 0.5)) {
      return { event: 'showPassThrough', data: { roomId, cardId: pickRandom(showPassThrough.cardIds) } };
    }
  }

  if (transferCard && transferCard.type === 'transferCard' && transferCard.cardIds.length > 0) {
    // Transfer based on skill and temperament
    const transferChance = temperament === 'aggressive' ? 0.7 : (0.3 + skill * 0.4);
    if (Math.random() < transferChance) {
      return { event: 'transferCard', data: { roomId, cardId: pickRandom(transferCard.cardIds) } };
    }
  }

  // Play a card (attack)
  if (playCard && playCard.type === 'playCard' && playCard.cardIds.length > 0) {
    // Skilled players play strategically (lowest value card), weak players play randomly
    const cardId = Math.random() < skill
      ? playCard.cardIds[0] // server already provides sorted options
      : pickRandom(playCard.cardIds);

    const undefendedIdx = gameState.battleField.findIndex(p => !p.defense);
    if (undefendedIdx >= 0) {
      return { event: 'playCard', data: { roomId, cardId, targetPairIdx: undefendedIdx } };
    }
    return { event: 'playCard', data: { roomId, cardId } };
  }

  // End attack
  if (endAttack) {
    // Aggressive players add more cards before ending
    if (playCard && playCard.type === 'playCard' && playCard.cardIds.length > 0 && temperament === 'aggressive') {
      if (Math.random() < 0.6) {
        const cardId = pickRandom(playCard.cardIds);
        return { event: 'playCard', data: { roomId, cardId } };
      }
    }
    return { event: 'endAttack', data: roomId };
  }

  // Pass turn fallback
  if (passTurn) return { event: 'passTurn', data: roomId };

  return null;
}

// ─── GhostPlayerManager ──────────────────────────────────────────────────────

let serverPort = 3000;
let ghostsEnabled = false;
const ghosts = new Map<string, GhostPlayer>();
let managerInterval: NodeJS.Timeout | null = null;
let ghostIdCounter = 1000;

/** Call this after the HTTP server starts listening */
export function initGhostPlayers(port: number, count: number = 15): void {
  serverPort = port;
  ghostsEnabled = true;

  console.log(`[Ghost] Initializing ${count} ghost players on port ${port}`);

  // Shuffle nicks and create ghost players
  const shuffledNicks = [...GHOST_NICKS].sort(() => Math.random() - 0.5);
  const selectedNicks = shuffledNicks.slice(0, Math.min(count, shuffledNicks.length));

  for (let i = 0; i < selectedNicks.length; i++) {
    const nick = selectedNicks[i];
    const id = `ghost-${ghostIdCounter++}`;
    const personality = buildPersonality(nick, i);
    const ghost: GhostPlayer = {
      id,
      personality,
      state: 'idle',
      socket: null,
      currentRoomId: null,
      isHosting: false,
      gameState: null,
      myActions: [],
      actionTimer: null,
      idleTimer: null,
      lobbyTimer: null,
      reconnectAttempts: 0,
    };
    ghosts.set(id, ghost);
  }

  // Stagger initial connections to avoid thundering herd
  let delay = 0;
  for (const ghost of Array.from(ghosts.values())) {
    setTimeout(() => {
      if (ghostsEnabled) connectGhost(ghost);
    }, delay);
    delay += rand(800, 3000);
  }

  // Manager loop: every 30s check ghost health and lifecycle
  managerInterval = setInterval(() => {
    if (!ghostsEnabled) return;
    for (const ghost of Array.from(ghosts.values())) {
      maintainGhost(ghost);
    }
  }, 30_000);
}

export function stopGhostPlayers(): void {
  ghostsEnabled = false;
  if (managerInterval) { clearInterval(managerInterval); managerInterval = null; }
  for (const ghost of Array.from(ghosts.values())) {
    disconnectGhost(ghost);
  }
  ghosts.clear();
}

export function getGhostStats(): { total: number; connected: number; inGame: number; inLobby: number } {
  let connected = 0, inGame = 0, inLobby = 0;
  for (const g of Array.from(ghosts.values())) {
    if (g.socket?.connected) connected++;
    if (g.state === 'in_game') inGame++;
    if (g.state === 'in_lobby') inLobby++;
  }
  return { total: ghosts.size, connected, inGame, inLobby };
}

// ─── Ghost Lifecycle ─────────────────────────────────────────────────────────

function connectGhost(ghost: GhostPlayer): void {
  if (ghost.socket?.connected) return;

  const url = `http://localhost:${serverPort}`;
  const socket: Socket<ServerToClientEvents, ClientToServerEvents> = ioClient(url, {
    path: '/api/socket.io',
    transports: ['websocket'],
    reconnection: false, // we manage reconnect ourselves
    auth: {
      odId: ghost.id,
      name: ghost.personality.nick,
    },
  });

  ghost.socket = socket;
  ghost.state = 'idle';

  socket.on('connect', () => {
    ghost.reconnectAttempts = 0;
    ghost.state = 'browsing';
    // Register profile (no gameId — ghost players have no DB profile)
    socket.emit('registerProfile', {
      gameId: 0,
      displayName: ghost.personality.nick,
      avatarId: ghost.personality.avatarId,
      equippedFrame: ghost.personality.equippedFrame ?? null,
      isPremium: false,
      seasonRating: Math.floor(rand(800, 2200)),
    });
    // Start browsing after a short delay
    scheduleIdleAction(ghost, rand(2000, 8000));
  });

  socket.on('disconnect', () => {
    ghost.state = 'disconnected';
    clearGhostTimers(ghost);
    ghost.currentRoomId = null;
    ghost.isHosting = false;
    ghost.gameState = null;
    ghost.myActions = [];
    // Reconnect with backoff
    if (ghostsEnabled && ghost.reconnectAttempts < 5) {
      ghost.reconnectAttempts++;
      const backoff = Math.min(5000 * ghost.reconnectAttempts, 30000);
      setTimeout(() => {
        if (ghostsEnabled) connectGhost(ghost);
      }, backoff + rand(0, 3000));
    }
  });

  socket.on('roomList', (rooms) => {
    // Store room list for decision making (only if browsing)
    if (ghost.state === 'browsing') {
      ghost.state = 'browsing'; // no-op, just ensure we process it
    }
  });

  socket.on('roomUpdated', (room) => {
    if (ghost.currentRoomId === room.id) {
      // Room was updated — check if game started
      if (room.hasActiveGame && ghost.state === 'in_lobby') {
        // Game started — transition handled by gameStarted event
      }
    }
  });

  socket.on('roomClosed', (roomId) => {
    if (ghost.currentRoomId === roomId) {
      ghost.currentRoomId = null;
      ghost.isHosting = false;
      ghost.state = 'browsing';
      clearGhostTimers(ghost);
      scheduleIdleAction(ghost, rand(3000, 10000));
    }
  });

  socket.on('gameStarted', (state) => {
    if (ghost.currentRoomId === state.roomId) {
      ghost.state = 'in_game';
      ghost.gameState = state;
      ghost.myActions = state.availableActions || [];
      clearGhostTimers(ghost);
      // Schedule first action if it's our turn
      if (ghost.myActions.length > 0) {
        scheduleGameAction(ghost);
      }
    }
  });

  socket.on('gameStateUpdate', (state) => {
    if (ghost.currentRoomId !== state.roomId) return;
    ghost.gameState = state;
    const prevActions = ghost.myActions;
    ghost.myActions = state.availableActions || [];

    if (state.gamePhase === 'finished') {
      // Game over — go back to lobby after a delay
      ghost.state = 'browsing';
      ghost.gameState = null;
      ghost.myActions = [];
      clearGhostTimers(ghost);
      // Leave the room after seeing results
      setTimeout(() => {
        if (ghost.socket?.connected && ghost.currentRoomId) {
          ghost.socket.emit('leaveRoom', ghost.currentRoomId);
          ghost.currentRoomId = null;
          ghost.isHosting = false;
        }
        scheduleIdleAction(ghost, rand(5000, 20000));
      }, rand(3000, 8000));
      return;
    }

    // If we now have actions and didn't before, schedule action
    if (ghost.myActions.length > 0 && prevActions.length === 0) {
      clearGhostTimers(ghost);
      scheduleGameAction(ghost);
    }
  });

  socket.on('yourTurn', (actions) => {
    if (ghost.state !== 'in_game') return;
    ghost.myActions = actions;
    if (actions.length > 0) {
      clearGhostTimers(ghost);
      scheduleGameAction(ghost);
    }
  });

  socket.on('gameOver', () => {
    // Handled via gameStateUpdate with phase=finished
  });

  socket.on('error', (msg) => {
    // Silently handle errors — ghost players don't crash on server errors
    console.debug(`[Ghost:${ghost.personality.nick}] Server error: ${msg}`);
  });
}

function disconnectGhost(ghost: GhostPlayer): void {
  clearGhostTimers(ghost);
  if (ghost.socket) {
    ghost.socket.removeAllListeners();
    ghost.socket.disconnect();
    ghost.socket = null;
  }
  ghost.state = 'disconnected';
  ghost.currentRoomId = null;
  ghost.isHosting = false;
  ghost.gameState = null;
  ghost.myActions = [];
}

function clearGhostTimers(ghost: GhostPlayer): void {
  if (ghost.actionTimer) { clearTimeout(ghost.actionTimer); ghost.actionTimer = null; }
  if (ghost.idleTimer) { clearTimeout(ghost.idleTimer); ghost.idleTimer = null; }
  if (ghost.lobbyTimer) { clearTimeout(ghost.lobbyTimer); ghost.lobbyTimer = null; }
}

/** Periodic health check — reconnect dead ghosts, nudge stuck ones */
function maintainGhost(ghost: GhostPlayer): void {
  if (!ghostsEnabled) return;
  if (!ghost.socket?.connected) {
    if (ghost.state !== 'disconnected' || ghost.reconnectAttempts < 5) {
      connectGhost(ghost);
    }
    return;
  }
  // If ghost is stuck in browsing with no timer, nudge it
  if (ghost.state === 'browsing' && !ghost.idleTimer && !ghost.actionTimer) {
    scheduleIdleAction(ghost, rand(1000, 5000));
  }
}

// ─── Idle / Lobby Actions ────────────────────────────────────────────────────

function scheduleIdleAction(ghost: GhostPlayer, delayMs: number): void {
  if (!ghostsEnabled) return;
  ghost.idleTimer = setTimeout(() => {
    ghost.idleTimer = null;
    if (!ghost.socket?.connected) return;
    if (ghost.state === 'in_game' || ghost.state === 'in_lobby') return;
    performIdleAction(ghost);
  }, delayMs);
}

function performIdleAction(ghost: GhostPlayer): void {
  if (!ghost.socket?.connected) return;
  const p = ghost.personality;

  // Decide: create room (30%) or join existing room (70%)
  const shouldCreate = Math.random() < 0.30;

  if (shouldCreate) {
    createGhostRoom(ghost);
  } else {
    // Request room list and try to join
    ghost.socket.emit('requestRoomList');
    // Give server a moment to respond, then try joining
    ghost.idleTimer = setTimeout(() => {
      ghost.idleTimer = null;
      if (!ghost.socket?.connected) return;
      tryJoinRoom(ghost);
    }, rand(500, 1500));
  }
}

function createGhostRoom(ghost: GhostPlayer): void {
  if (!ghost.socket?.connected) return;
  const p = ghost.personality;

  const maxPlayers = Math.floor(rand(p.playerCountRange[0], p.playerCountRange[1] + 1));
  const betAmounts = [100, 200, 500, 1000, 3000, 5000];
  const validBets = betAmounts.filter(b => b >= p.betRange[0] && b <= p.betRange[1]);
  const betAmount = validBets.length > 0 ? pickRandom(validBets) : 100;

  const roomName = generateRoomName(p.nick);

  ghost.socket.emit('createRoom', {
    name: roomName,
    maxPlayers,
    settings: {
      turnTimer: pickRandom([20, 25, 30, 40]),
      withBots: false,
      botCount: 0,
      deckStyle: Math.random() < 0.85 ? 'classic' : 'custom',
      tableStyle: pickRandom(['classic', 'classic', 'classic', 'dark_kazakh', 'neon', 'apocalypse']),
      betAmount,
      isPrivate: false,
    },
  }, (room) => {
    if (!room) {
      // Failed to create — try browsing instead
      scheduleIdleAction(ghost, rand(5000, 15000));
      return;
    }
    ghost.currentRoomId = room.id;
    ghost.isHosting = true;
    ghost.state = 'in_lobby';

    // Wait for players to join, then start or leave
    scheduleLobbyAction(ghost);
  });
}

function tryJoinRoom(ghost: GhostPlayer): void {
  if (!ghost.socket?.connected) return;
  const p = ghost.personality;

  // Get available rooms from socketServer
  const openRooms = getAvailableRooms();

  // Filter: not private, no password, not full, not active game, not tutorial
  const joinable = openRooms.filter(r =>
    !r.settings.isPrivate &&
    !r.settings.password &&
    !r.hasActiveGame &&
    !r.settings.isTutorial &&
    r.players.length < r.maxPlayers &&
    // Don't join rooms where we're already a player
    !r.players.some(rp => rp.id === ghost.id) &&
    // Prefer rooms with bet in our range
    (r.settings.betAmount || 100) >= p.betRange[0] * 0.5 &&
    (r.settings.betAmount || 100) <= p.betRange[1] * 2,
  );

  if (joinable.length === 0) {
    // No rooms to join — create one or wait
    if (Math.random() < 0.5) {
      createGhostRoom(ghost);
    } else {
      scheduleIdleAction(ghost, rand(8000, 20000));
    }
    return;
  }

  const room = pickRandom(joinable);

  ghost.socket.emit('joinRoom', { roomId: room.id }, (ok, joinedRoom) => {
    if (!ok || !joinedRoom) {
      scheduleIdleAction(ghost, rand(3000, 10000));
      return;
    }
    ghost.currentRoomId = room.id;
    ghost.isHosting = false;
    ghost.state = 'in_lobby';

    // Maybe leave lobby early
    if (Math.random() < p.lobbyLeaveProb) {
      const leaveDelay = rand(3000, 15000);
      ghost.lobbyTimer = setTimeout(() => {
        ghost.lobbyTimer = null;
        if (ghost.state === 'in_lobby' && ghost.socket?.connected && ghost.currentRoomId) {
          ghost.socket.emit('leaveRoom', ghost.currentRoomId);
          ghost.currentRoomId = null;
          ghost.state = 'browsing';
          scheduleIdleAction(ghost, rand(5000, 20000));
        }
      }, leaveDelay);
    } else {
      // Toggle ready
      setTimeout(() => {
        if (ghost.state === 'in_lobby' && ghost.socket?.connected && ghost.currentRoomId) {
          ghost.socket.emit('toggleReady', ghost.currentRoomId);
        }
      }, rand(1000, 4000));
    }
  });
}

function scheduleLobbyAction(ghost: GhostPlayer): void {
  if (!ghostsEnabled) return;
  // Host waits for players, then starts game or closes room
  const waitTime = rand(15000, 45000); // wait 15–45s for players
  ghost.lobbyTimer = setTimeout(() => {
    ghost.lobbyTimer = null;
    if (!ghost.socket?.connected || ghost.state !== 'in_lobby') return;

    const openRooms = getAvailableRooms();
    const myRoom = openRooms.find(r => r.id === ghost.currentRoomId);

    if (!myRoom) {
      ghost.currentRoomId = null;
      ghost.isHosting = false;
      ghost.state = 'browsing';
      scheduleIdleAction(ghost, rand(5000, 15000));
      return;
    }

    const humanCount = myRoom.players.filter(p => !p.id.startsWith('ghost-') && !p.id.startsWith('bot-')).length;
    const totalCount = myRoom.players.length;

    if (totalCount >= 2) {
      // Start the game
      ghost.socket!.emit('startGame', ghost.currentRoomId!);
    } else {
      // No one joined — close room and try again
      ghost.socket!.emit('closeRoom', ghost.currentRoomId!);
      ghost.currentRoomId = null;
      ghost.isHosting = false;
      ghost.state = 'browsing';
      scheduleIdleAction(ghost, rand(10000, 30000));
    }
  }, waitTime);
}

// ─── In-Game Actions ─────────────────────────────────────────────────────────

function scheduleGameAction(ghost: GhostPlayer): void {
  if (!ghostsEnabled || !ghost.socket?.connected) return;
  if (ghost.myActions.length === 0) return;

  const p = ghost.personality;

  // Calculate think time
  let thinkMs = rand(p.thinkMinMs, p.thinkMaxMs);

  // Long think (AFK moment)
  if (Math.random() < p.longThinkProb) {
    thinkMs += rand(8000, 18000);
  }

  ghost.actionTimer = setTimeout(() => {
    ghost.actionTimer = null;
    if (!ghost.socket?.connected || ghost.state !== 'in_game') return;
    if (ghost.myActions.length === 0) return;

    // Maybe ragequit
    if (Math.random() < p.ragequitProb && ghost.currentRoomId) {
      ghost.socket.emit('leaveGame', ghost.currentRoomId, () => {
        ghost.currentRoomId = null;
        ghost.isHosting = false;
        ghost.state = 'browsing';
        ghost.gameState = null;
        ghost.myActions = [];
        scheduleIdleAction(ghost, rand(10000, 40000));
      });
      return;
    }

    // Maybe send emotion before playing
    if (ghost.gameState && Math.random() < p.emotionProb && ghost.currentRoomId) {
      const emotionId = pickEmotion(p.temperament);
      ghost.socket.emit('sendEmotion', { roomId: ghost.currentRoomId, emotionId });
    }

    // Pick and execute action
    if (!ghost.gameState) return;
    const action = pickGhostAction(ghost.myActions, p.skill, p.temperament, ghost.gameState);
    if (!action) return;

    executeGhostAction(ghost, action);
  }, thinkMs);
}

function executeGhostAction(ghost: GhostPlayer, action: { event: string; data?: unknown }): void {
  if (!ghost.socket?.connected) return;

  const s = ghost.socket as any;
  try {
    if (action.data !== undefined) {
      s.emit(action.event, action.data);
    } else {
      s.emit(action.event);
    }
  } catch (e) {
    console.debug(`[Ghost:${ghost.personality.nick}] Action error: ${e}`);
  }
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function generateRoomName(nick: string): string {
  const templates = [
    `Комната ${nick}`,
    `Игра ${nick}`,
    `${nick} играет`,
    `Заходите!`,
    `Дурак онлайн`,
    `Быстрая игра`,
    `Для всех`,
    `Новая игра`,
    `Присоединяйтесь`,
    `${nick}'s room`,
  ];
  return pickRandom(templates);
}
