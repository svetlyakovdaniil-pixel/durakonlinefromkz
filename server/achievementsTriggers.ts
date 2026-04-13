/**
 * Achievement triggers for Казахский Дурак Онлайн.
 *
 * This module is called from socketServer.ts after game events.
 * All functions are async and non-blocking (fire-and-forget via .catch()).
 *
 * Bot ratio rule: achievements only count when bots < 33.4% of total players.
 */

import { getDb } from './db';
import { playerProfiles } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { incrementAchievementProgress } from './achievementsDb';
import { MAX_BOT_RATIO } from '../shared/achievements';

// ============================================================
// Types
// ============================================================

export interface GameEndContext {
  roomId: string;
  /** All human players (odId -> gameId) */
  playerGameIds: Map<string, number>;
  /** odId of the winner (1st place) */
  winnersOrder: string[];
  /** odId of the loser (durak) */
  loserId: string | null;
  /** All human odIds in finish order (index 0 = 1st place) */
  allHumanOdIds: string[];
  /** Number of bots in the game */
  botCount: number;
  /** Total players (humans + bots) */
  totalPlayersInRoom: number;
  /** Game duration in seconds */
  durationSeconds: number;
  /** Whether the winner took 0 cards (clean win) */
  winnerTookNoCards: boolean;
  /** Per-player trump defense counts this game */
  trumpDefenseCounts: Map<string, number>;
  /** Per-player total defense counts this game */
  totalDefenseCounts: Map<string, number>;
  /** Per-player cards thrown counts this game */
  throwCounts: Map<string, number>;
  /** Per-player consecutive 1st place wins (streak) */
  consecutiveWinStreaks: Map<string, number>;
  /** Per-player transfer counts this game */
  transferCounts: Map<string, number>;
}

export interface CardPlayContext {
  roomId: string;
  odId: string;
  gameId: number;
  profileId: number;
  botCount: number;
  totalPlayersInRoom: number;
  /** The card that was just played as defense */
  defenseCard?: { rank: string; suit: string | null };
  /** The attack card that was beaten */
  attackCard?: { rank: string; suit: string | null };
  /** Whether this defense used a trump card */
  isTrumpDefense?: boolean;
  /** Whether the attack was a King of Spades */
  attackIsKingOfSpades?: boolean;
  /** Whether the defense card is 777 */
  defenseIs777?: boolean;
  /** Whether the attack card is a trump Ace */
  attackIsTrumpAce?: boolean;
  /** Whether the defense is King of Spades */
  defenseIsKingOfSpades?: boolean;
  /** Whether the attack is 777 */
  attackIs777?: boolean;
  /** Whether a 10 was played as lead card (reversing direction) */
  played10AsLead?: boolean;
  /** Number of cards thrown in this attack turn */
  cardsThrown?: number;
}

// ============================================================
// Per-game in-memory state (reset on game start)
// ============================================================

/** Per-game tracking of trump defenses: roomId -> { odId -> count } */
const gameTrumpDefenses = new Map<string, Map<string, number>>();
/** Per-game tracking of total defenses: roomId -> { odId -> count } */
const gameTotalDefenses = new Map<string, Map<string, number>>();
/** Per-game tracking of cards thrown: roomId -> { odId -> count } */
const gameThrowCounts = new Map<string, Map<string, number>>();
/** Per-game tracking of transfer counts: roomId -> { odId -> count } */
const gameTransferCounts = new Map<string, Map<string, number>>();
/** Per-game tracking of cards taken by winner: roomId -> { odId -> count } */
const gameCardsTaken = new Map<string, Map<string, number>>();
/** Per-game tracking of 10-transfers: roomId -> { odId -> { targetOdId -> count } } */
const game10Transfers = new Map<string, Map<string, { lastTarget: string; streak: number }>>();
/** Consecutive win streaks: odId -> streak count (persists across games in memory) */
const consecutiveWinStreaks = new Map<string, number>();
/** Per-game tracking of trump ace usage: roomId -> { odId -> count } */
const gameTrumpAceUsed = new Map<string, Map<string, number>>();
/** Per-game tracking of fully-defended rounds (whole table cleared by defender): roomId -> { odId -> count } */
const gameSuccessfulRounds = new Map<string, Map<string, number>>();

export function initGameTracking(roomId: string): void {
  gameTrumpDefenses.set(roomId, new Map());
  gameTotalDefenses.set(roomId, new Map());
  gameThrowCounts.set(roomId, new Map());
  gameTransferCounts.set(roomId, new Map());
  gameCardsTaken.set(roomId, new Map());
  game10Transfers.set(roomId, new Map());
  gameTrumpAceUsed.set(roomId, new Map());
  gameSuccessfulRounds.set(roomId, new Map());
}

export function cleanupGameTracking(roomId: string): void {
  gameTrumpDefenses.delete(roomId);
  gameTotalDefenses.delete(roomId);
  gameThrowCounts.delete(roomId);
  gameTransferCounts.delete(roomId);
  gameCardsTaken.delete(roomId);
  game10Transfers.delete(roomId);
  gameTrumpAceUsed.delete(roomId);
  gameSuccessfulRounds.delete(roomId);
}

function incMap(map: Map<string, number>, key: string, by = 1): number {
  const v = (map.get(key) ?? 0) + by;
  map.set(key, v);
  return v;
}

// ============================================================
// In-game event trackers (called from socketServer event handlers)
// ============================================================

export function trackTrumpDefense(roomId: string, odId: string, isTrump: boolean): void {
  const defMap = gameTotalDefenses.get(roomId);
  if (defMap) incMap(defMap, odId);
  if (isTrump) {
    const trumpMap = gameTrumpDefenses.get(roomId);
    if (trumpMap) incMap(trumpMap, odId);
  }
}

export function trackThrow(roomId: string, odId: string, cardCount: number): void {
  const throwMap = gameThrowCounts.get(roomId);
  if (throwMap) incMap(throwMap, odId, cardCount);
}

export function trackTransfer(roomId: string, odId: string): void {
  const transferMap = gameTransferCounts.get(roomId);
  if (transferMap) incMap(transferMap, odId);
}

export function trackCardsTaken(roomId: string, odId: string, count: number): void {
  const takenMap = gameCardsTaken.get(roomId);
  if (takenMap) incMap(takenMap, odId, count);
}

/**
 * Track a fully-defended round: the defender successfully beat the whole table
 * (all cards defended, attack goes to discard). Call once per successfulDefense event.
 */
export function trackSuccessfulRound(roomId: string, defenderOdId: string): void {
  const map = gameSuccessfulRounds.get(roomId);
  if (map) incMap(map, defenderOdId);
}

/** Get successful rounds map for a game */
export function getSuccessfulRoundsMap(roomId: string): Map<string, number> {
  return gameSuccessfulRounds.get(roomId) ?? new Map();
}

/** Track trump ace usage (played as defender to beat an attack) */
export function trackTrumpAceUsed(roomId: string, odId: string): void {
  const aceMap = gameTrumpAceUsed.get(roomId);
  if (aceMap) incMap(aceMap, odId);
}

/** Get trump ace usage count for a player in a game */
export function getTrumpAceUsed(roomId: string): Map<string, number> {
  return gameTrumpAceUsed.get(roomId) ?? new Map();
}

/** Get trump defenses map for a game */
export function getTrumpDefMap(roomId: string): Map<string, number> {
  return gameTrumpDefenses.get(roomId) ?? new Map();
}

/** Get total defenses map for a game */
export function getTotalDefMap(roomId: string): Map<string, number> {
  return gameTotalDefenses.get(roomId) ?? new Map();
}

/** Get throw counts map for a game */
export function getThrowMap(roomId: string): Map<string, number> {
  return gameThrowCounts.get(roomId) ?? new Map();
}

/** Get transfer counts map for a game */
export function getTransferMap(roomId: string): Map<string, number> {
  return gameTransferCounts.get(roomId) ?? new Map();
}

/** Get cards taken map for a game */
export function getCardsTakenMap(roomId: string): Map<string, number> {
  return gameCardsTaken.get(roomId) ?? new Map();
}

/** Track 10-transfer chains: returns true if the spiderman meme condition is met */
export function track10Transfer(roomId: string, defenderOdId: string, attackerOdId: string): boolean {
  const map = game10Transfers.get(roomId);
  if (!map) return false;
  const entry = map.get(defenderOdId);
  if (entry && entry.lastTarget === attackerOdId) {
    entry.streak++;
    if (entry.streak >= 3) return true;
  } else {
    map.set(defenderOdId, { lastTarget: attackerOdId, streak: 1 });
  }
  return false;
}

// ============================================================
// Profile lookup helper
// ============================================================

async function getProfileIdByGameId(gameId: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select({ id: playerProfiles.id })
    .from(playerProfiles)
    .where(eq(playerProfiles.gameId, gameId))
    .limit(1);
  return row?.id ?? null;
}

async function getProfileIdByOdId(odId: string, playerGameIds: Map<string, number>): Promise<number | null> {
  const gameId = playerGameIds.get(odId);
  if (!gameId) return null;
  return getProfileIdByGameId(gameId);
}

// ============================================================
// Main: process all achievements at game end
// ============================================================

export async function processGameEndAchievements(ctx: GameEndContext): Promise<void> {
  const { botCount, totalPlayersInRoom, playerGameIds, winnersOrder, loserId, allHumanOdIds, durationSeconds } = ctx;

  // Check bot ratio — achievements only count for human-majority games
  const botRatio = totalPlayersInRoom > 0 ? botCount / totalPlayersInRoom : 0;
  const isHumanGame = botRatio < MAX_BOT_RATIO;

  const trumpDefMap = gameTrumpDefenses.get(ctx.roomId) ?? new Map<string, number>();
  const totalDefMap = gameTotalDefenses.get(ctx.roomId) ?? new Map<string, number>();
  const throwMap = gameThrowCounts.get(ctx.roomId) ?? new Map<string, number>();
  const transferMap = gameTransferCounts.get(ctx.roomId) ?? new Map<string, number>();
  const takenMap = gameCardsTaken.get(ctx.roomId) ?? new Map<string, number>();
  const successfulRoundsMap = gameSuccessfulRounds.get(ctx.roomId) ?? new Map<string, number>();

  const winner1stOdId = winnersOrder[0] ?? null;
  const secondLastOdId = allHumanOdIds.length >= 2 ? allHumanOdIds[allHumanOdIds.length - 2] : null;

  for (const odId of allHumanOdIds) {
    const profileId = await getProfileIdByOdId(odId, playerGameIds);
    if (!profileId) continue;

    const isWinner = odId === winner1stOdId;
    const isLoser = odId === loserId;
    const isSecondLast = odId === secondLastOdId && !isLoser;

    // ---- Achievements that require human-majority games ----
    if (isHumanGame) {
      // Первый шаг — first game
      await incrementAchievementProgress(profileId, 'first_game', 1);

      // Степной ученик — 10 games
      await incrementAchievementProgress(profileId, 'steppe_student', 1);

      // Степной дебют — 50 games
      await incrementAchievementProgress(profileId, 'steppe_debut', 1);

      // Степной воин — 100 games
      await incrementAchievementProgress(profileId, 'steppe_warrior', 1);

      // Золотой старт — 200 rating points (check current rating)
      const db = await getDb();
      if (db) {
        const [profile] = await db.select({ rating: playerProfiles.rating })
          .from(playerProfiles)
          .where(eq(playerProfiles.id, profileId))
          .limit(1);
        if (profile && profile.rating >= 1200) {
          await incrementAchievementProgress(profileId, 'golden_start', 0, profile.rating);
        }
      }

      // Заяц в кустах — second-to-last place
      if (isSecondLast) {
        await incrementAchievementProgress(profileId, 'bush_rabbit', 1);
      }

      // Быстрый старт — 5 consecutive 1st place wins
      if (isWinner) {
        const streak = (consecutiveWinStreaks.get(odId) ?? 0) + 1;
        consecutiveWinStreaks.set(odId, streak);
        await incrementAchievementProgress(profileId, 'quick_start', 0, streak);
      } else {
        consecutiveWinStreaks.set(odId, 0);
      }

      // Быстрая победа — win in under 10 minutes
      if (isWinner && durationSeconds > 0 && durationSeconds < 600) {
        await incrementAchievementProgress(profileId, 'quick_win', 1);
      }

      // Чистая победа — win without taking any cards
      if (isWinner && ctx.winnerTookNoCards) {
        await incrementAchievementProgress(profileId, 'clean_win', 1);
      }

      // Батыр-новобранец — successfully defend 10 full rounds in one game
      // (a "round" = the entire table was beaten and attack went to discard)
      const successfulRounds = successfulRoundsMap.get(odId) ?? 0;
      if (successfulRounds >= 10) {
        await incrementAchievementProgress(profileId, 'batyr_recruit', 1);
      }

      // Козырной новичок — beat 20 cards with trump in one game
      const trumpCount = trumpDefMap.get(odId) ?? 0;
      if (trumpCount >= 20) {
        await incrementAchievementProgress(profileId, 'trump_rookie', 1);
      }

      // Первый подкид — throw 5 cards in one turn (tracked separately)
      const thrown = throwMap.get(odId) ?? 0;
      if (thrown >= 5) {
        await incrementAchievementProgress(profileId, 'first_throw', 1);
      }

      // Три подкида — transfer 10 times in one game
      const transfers = transferMap.get(odId) ?? 0;
      if (transfers >= 10) {
        await incrementAchievementProgress(profileId, 'three_throws', 1);
      }

      // Первый беркут — finish with exactly 1 card in hand
      // (tracked via player.hand.length at game end — handled in socketServer)
    }

    // Первый миллионер — 1,000,000 shanyrak (not restricted to human games)
    const db2 = await getDb();
    if (db2) {
      const [profile2] = await db2.select({ balanceShanyrak: playerProfiles.balanceShanyrak })
        .from(playerProfiles)
        .where(eq(playerProfiles.id, profileId))
        .limit(1);
      if (profile2 && profile2.balanceShanyrak >= 1000000) {
        await incrementAchievementProgress(profileId, 'first_millionaire', 0, 1000000);
      }
    }
  }
}

// ============================================================
// Special card event achievements (called from socketServer)
// ============================================================

export async function processDefenseAchievement(ctx: {
  profileId: number;
  botCount: number;
  totalPlayersInRoom: number;
  isTrumpDefense: boolean;
  attackIsKingOfSpades: boolean;
  defenseIs777: boolean;
  attackIsTrumpAce: boolean;
  defenseIsKingOfSpades: boolean;
  attackIs777: boolean;
  isFirstGame: boolean;
  roomId: string;
  odId: string;
}): Promise<void> {
  const botRatio = ctx.totalPlayersInRoom > 0 ? ctx.botCount / ctx.totalPlayersInRoom : 0;
  const isHumanGame = botRatio < MAX_BOT_RATIO;
  if (!isHumanGame) return;

  // Первый козырь — beat with trump in first game
  if (ctx.isTrumpDefense && ctx.isFirstGame) {
    await incrementAchievementProgress(ctx.profileId, 'first_trump', 1);
  }

  // Маленький герой — beat King of Spades with Ace of Spades
  if (ctx.attackIsKingOfSpades && !ctx.defenseIs777) {
    // Actually: beat King of Spades with Ace of Spades
    // canBeat: KingOfSpades is beaten by AceOfSpades or 777
    // We check if defenseCard is Ace of Spades
  }

  // Король пики — beat trump ace with King of Spades
  if (ctx.defenseIsKingOfSpades && ctx.attackIsTrumpAce) {
    await incrementAchievementProgress(ctx.profileId, 'spade_king', 1);
  }

  // Король пики vs 777 — beat King of Spades with 777
  if (ctx.defenseIs777 && ctx.attackIsKingOfSpades) {
    await incrementAchievementProgress(ctx.profileId, 'king_vs_777', 1);
  }
}

export async function processAttackAchievement(ctx: {
  profileId: number;
  botCount: number;
  totalPlayersInRoom: number;
  played10AsLead: boolean;
  roomId: string;
  odId: string;
}): Promise<void> {
  const botRatio = ctx.totalPlayersInRoom > 0 ? ctx.botCount / ctx.totalPlayersInRoom : 0;
  const isHumanGame = botRatio < MAX_BOT_RATIO;
  if (!isHumanGame) return;

  // Что происходит? — play a 10 as lead card (reversing direction)
  if (ctx.played10AsLead) {
    await incrementAchievementProgress(ctx.profileId, 'what_is_happening', 1);
  }
}

export async function processLucky777Achievement(ctx: {
  profileId: number;
  botCount: number;
  totalPlayersInRoom: number;
}): Promise<void> {
  const botRatio = ctx.totalPlayersInRoom > 0 ? ctx.botCount / ctx.totalPlayersInRoom : 0;
  const isHumanGame = botRatio < MAX_BOT_RATIO;
  if (!isHumanGame) return;

  // Счастливые семёрки — start a turn with only 777 in hand
  await incrementAchievementProgress(ctx.profileId, 'lucky_sevens', 1);
}

export async function processSpidermanMemeAchievement(ctx: {
  profileId: number;
  botCount: number;
  totalPlayersInRoom: number;
}): Promise<void> {
  const botRatio = ctx.totalPlayersInRoom > 0 ? ctx.botCount / ctx.totalPlayersInRoom : 0;
  const isHumanGame = botRatio < MAX_BOT_RATIO;
  if (!isHumanGame) return;

  // Мем с человеком-пауком — transfer 10 back to the same player 3 times in a row
  await incrementAchievementProgress(ctx.profileId, 'spiderman_meme', 1);
}

export async function processFirstBerkutAchievement(ctx: {
  profileId: number;
  handSize: number;
  botCount: number;
  totalPlayersInRoom: number;
}): Promise<void> {
  const botRatio = ctx.totalPlayersInRoom > 0 ? ctx.botCount / ctx.totalPlayersInRoom : 0;
  const isHumanGame = botRatio < MAX_BOT_RATIO;
  if (!isHumanGame) return;

  // Первый беркут — finish with exactly 1 card in hand
  if (ctx.handSize === 1) {
    await incrementAchievementProgress(ctx.profileId, 'first_berkut', 1);
  }
}

export async function processLittleHeroAchievement(ctx: {
  profileId: number;
  attackIsKingOfSpades: boolean;
  defenseIsAceOfSpades: boolean;
  botCount: number;
  totalPlayersInRoom: number;
}): Promise<void> {
  const botRatio = ctx.totalPlayersInRoom > 0 ? ctx.botCount / ctx.totalPlayersInRoom : 0;
  const isHumanGame = botRatio < MAX_BOT_RATIO;
  if (!isHumanGame) return;

  // Маленький герой — beat King of Spades with Ace of Spades
  if (ctx.attackIsKingOfSpades && ctx.defenseIsAceOfSpades) {
    await incrementAchievementProgress(ctx.profileId, 'little_hero', 1);
  }
}

export async function processDonatorAchievement(profileId: number, totalTengeSpent: number): Promise<void> {
  // Донатор — spend more than 100 tenge in shop (no bot restriction)
  if (totalTengeSpent > 100) {
    await incrementAchievementProgress(profileId, 'donator', 0, totalTengeSpent);
  }
}
