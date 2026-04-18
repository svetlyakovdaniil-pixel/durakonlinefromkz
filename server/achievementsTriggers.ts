/**
 * Achievement triggers for Казахский Дурак Онлайн.
 *
 * This module is called from socketServer.ts after game events.
 * All functions are async and non-blocking (fire-and-forget via .catch()).
 *
 * Bot ratio rule: achievements only count when bots < 33.4% of total players.
 */

import { getDb } from './db';
import { sql } from 'drizzle-orm';
import { playerProfiles } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { incrementAchievementProgress } from './achievementsDb';
import { incrementDailyQuestProgress, setDailyQuestProgress } from './dailyQuestsDb';
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
// Stores last 3 transfers per room as [{from, to}] to detect A→B, B→A, A→B pattern
const game10Transfers = new Map<string, Array<{ from: string; to: string }>>();
/** Consecutive win streaks: odId -> streak count (persists across games in memory) */
const consecutiveWinStreaks = new Map<string, number>();
/** Per-game tracking of trump ace usage: roomId -> { odId -> count } */
const gameTrumpAceUsed = new Map<string, Map<string, number>>();
/** Per-game tracking of fully-defended rounds (whole table cleared by defender): roomId -> { odId -> count } */
const gameSuccessfulRounds = new Map<string, Map<string, number>>();
/** Per-game tracking of pass cards shown: roomId -> { odId -> count } */
const gamePassCardsShown = new Map<string, Map<string, number>>();
/** Per-game tracking of attacks: roomId -> { odId -> count } */
const gameAttacks = new Map<string, Map<string, number>>();
/** Per-game tracking of max cards in one turn: roomId -> { odId -> max } */
const gameMaxCardsInOneTurn = new Map<string, Map<string, number>>();
/** Per-game tracking of beat-same-rank-suit: roomId -> { odId -> count } */
const gameBeatSameRankSuit = new Map<string, Map<string, number>>();
/** Per-game tracking of threw-6-to-non-neighbor: roomId -> { odId -> count } */
const gameThrew6ToNonNeighbor = new Map<string, Map<string, number>>();
/** Per-game tracking of started-turn-with-10: roomId -> { odId -> count } */
const gameStartedTurnWith10 = new Map<string, Map<string, number>>();
/** Per-game tracking of win-when-opponent-has-1-card: roomId -> { odId -> count } */
const gameWinWhenOpponentHas1Card = new Map<string, Map<string, number>>();
/** Per-game tracking of hand size when player went out (before last card played): roomId -> { odId -> handSizeBeforeLastCard } */
const gameBerkutHandSizes = new Map<string, Map<string, number>>();

export function initGameTracking(roomId: string): void {
  gameTrumpDefenses.set(roomId, new Map());
  gameTotalDefenses.set(roomId, new Map());
  gameThrowCounts.set(roomId, new Map());
  gameTransferCounts.set(roomId, new Map());
  gameCardsTaken.set(roomId, new Map());
  game10Transfers.set(roomId, []);
  gameTrumpAceUsed.set(roomId, new Map());
  gameSuccessfulRounds.set(roomId, new Map());
  gamePassCardsShown.set(roomId, new Map());
  gameAttacks.set(roomId, new Map());
  gameMaxCardsInOneTurn.set(roomId, new Map());
  gameBeatSameRankSuit.set(roomId, new Map());
  gameThrew6ToNonNeighbor.set(roomId, new Map());
  gameStartedTurnWith10.set(roomId, new Map());
  gameWinWhenOpponentHas1Card.set(roomId, new Map());
  gameBerkutHandSizes.set(roomId, new Map());
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
  gamePassCardsShown.delete(roomId);
  gameAttacks.delete(roomId);
  gameMaxCardsInOneTurn.delete(roomId);
  gameBeatSameRankSuit.delete(roomId);
  gameThrew6ToNonNeighbor.delete(roomId);
  gameStartedTurnWith10.delete(roomId);
  gameWinWhenOpponentHas1Card.delete(roomId);
  gameBerkutHandSizes.delete(roomId);
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

/** Track hand size before a player plays their last card (for first_berkut achievement) */
export function trackBerkutHandSize(roomId: string, odId: string, handSizeBeforePlay: number): void {
  const map = gameBerkutHandSizes.get(roomId);
  if (map) map.set(odId, handSizeBeforePlay);
}

/** Get the tracked hand size before last card for a player */
export function getBerkutHandSize(roomId: string, odId: string): number {
  return gameBerkutHandSizes.get(roomId)?.get(odId) ?? 0;
}

/** Get cards taken map for a game */
export function getCardsTakenMap(roomId: string): Map<string, number> {
  return gameCardsTaken.get(roomId) ?? new Map();
}

/** Track 10-transfer chains: returns true if the spiderman meme condition is met.
 * Condition: A→B, B→A, A→B — three alternating transfers between the same two players.
 */
export function track10Transfer(roomId: string, defenderOdId: string, attackerOdId: string): boolean {
  const list = game10Transfers.get(roomId);
  if (!list) return false;

  // Append this transfer
  list.push({ from: defenderOdId, to: attackerOdId });
  // Keep only last 3
  if (list.length > 3) list.splice(0, list.length - 3);

  // Check if we have exactly 3 transfers matching the A→B, B→A, A→B pattern
  if (list.length < 3) return false;
  const [t1, t2, t3] = list;
  // Pattern: t1.from == t3.from, t1.to == t3.to == t2.from, t2.to == t1.from
  const isSpiderman =
    t1.from === t3.from &&
    t1.to === t3.to &&
    t2.from === t1.to &&
    t2.to === t1.from;
  if (isSpiderman) {
    // Reset to prevent repeated triggers
    list.length = 0;
    return true;
  }
  return false;
}

//** Track pass card shown */
export function trackPassCardShown(roomId: string, odId: string): void {
  const map = gamePassCardsShown.get(roomId);
  if (map) incMap(map, odId);
}
/** Track attack (lead card played) */
export function trackAttack(roomId: string, odId: string): void {
  const map = gameAttacks.get(roomId);
  if (map) incMap(map, odId);
}
/** Track max cards in one attack turn */
export function trackCardsInOneTurn(roomId: string, odId: string, count: number): void {
  const map = gameMaxCardsInOneTurn.get(roomId);
  if (!map) return;
  const current = map.get(odId) ?? 0;
  if (count > current) map.set(odId, count);
}
/** Track beat-same-rank-suit defense */
export function trackBeatSameRankSuit(roomId: string, odId: string): void {
  const map = gameBeatSameRankSuit.get(roomId);
  if (map) incMap(map, odId);
}
/** Track threw-6-to-non-neighbor */
export function trackThrew6ToNonNeighbor(roomId: string, odId: string): void {
  const map = gameThrew6ToNonNeighbor.get(roomId);
  if (map) incMap(map, odId);
}
/** Track started-turn-with-10 */
export function trackStartedTurnWith10(roomId: string, odId: string): void {
  const map = gameStartedTurnWith10.get(roomId);
  if (map) incMap(map, odId);
}
/** Track win-when-opponent-has-1-card */
export function trackWinWhenOpponentHas1Card(roomId: string, odId: string): void {
  const map = gameWinWhenOpponentHas1Card.get(roomId);
  if (map) incMap(map, odId);
}
/** Get pass cards shown map */
export function getPassCardsShownMap(roomId: string): Map<string, number> {
  return gamePassCardsShown.get(roomId) ?? new Map();
}
/** Get attacks map */
export function getAttacksMap(roomId: string): Map<string, number> {
  return gameAttacks.get(roomId) ?? new Map();
}
/** Get max cards in one turn map */
export function getMaxCardsInOneTurnMap(roomId: string): Map<string, number> {
  return gameMaxCardsInOneTurn.get(roomId) ?? new Map();
}
/** Get beat-same-rank-suit map */
export function getBeatSameRankSuitMap(roomId: string): Map<string, number> {
  return gameBeatSameRankSuit.get(roomId) ?? new Map();
}
/** Get threw-6-to-non-neighbor map */
export function getThrew6ToNonNeighborMap(roomId: string): Map<string, number> {
  return gameThrew6ToNonNeighbor.get(roomId) ?? new Map();
}
/** Get started-turn-with-10 map */
export function getStartedTurnWith10Map(roomId: string): Map<string, number> {
  return gameStartedTurnWith10.get(roomId) ?? new Map();
}
/** Get win-when-opponent-has-1-card map */
export function getWinWhenOpponentHas1CardMap(roomId: string): Map<string, number> {
  return gameWinWhenOpponentHas1Card.get(roomId) ?? new Map();
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
  const maxCardsInOneTurnMap = gameMaxCardsInOneTurn.get(ctx.roomId) ?? new Map<string, number>();

  const winner1stOdId = winnersOrder[0] ?? null;
  // secondLastOdId: предпоследний выбывший = winnersOrder[winnersOrder.length - 2]
  // winnersOrder[0] = 1st place, winnersOrder[last] = last winner before loser
  // allHumanOdIds = all humans; loserId = last place
  // Предпоследнее место: последний из winnersOrder (если есть), либо второй с конца allHumanOdIds без loserId
  const nonLoserHumans = allHumanOdIds.filter(id => id !== loserId);
  const secondLastOdId = nonLoserHumans.length >= 1 ? nonLoserHumans[nonLoserHumans.length - 1] : null;

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

      // Золотой старт — reach 1200 rating points (track progress always)
      const db = await getDb();
      if (db) {
        const [profile] = await db.select({ rating: playerProfiles.rating })
          .from(playerProfiles)
          .where(eq(playerProfiles.id, profileId))
          .limit(1);
        if (profile && profile.rating > 0) {
          await incrementAchievementProgress(profileId, 'golden_start', 0, Math.min(profile.rating, 1200));
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
        // Daily quest: wins_in_a_row
        await incrementDailyQuestProgress(profileId, 'wins_in_a_row', 1);
      } else {
        consecutiveWinStreaks.set(odId, 0);
        // Reset wins_in_a_row daily quest on loss
        await setDailyQuestProgress(profileId, 'wins_in_a_row', 0);
      }

      // Быстрая победа — win in under 10 minutes
      if (isWinner && durationSeconds > 0 && durationSeconds < 600) {
        await incrementAchievementProgress(profileId, 'quick_win', 1);
      }

      // Чистая победа — win without taking any cards
      if (isWinner && ctx.winnerTookNoCards) {
        await incrementAchievementProgress(profileId, 'clean_win', 1);
      }

      // Батыр-новобранец — успешно отбить 10 ходов за одну партию
      // (ход = отбившийся раунд: весь стол отбит и карты ушли в бито)
      const successfulRounds = successfulRoundsMap.get(odId) ?? 0;
      if (successfulRounds >= 10) {
        await incrementAchievementProgress(profileId, 'batyr_recruit', 1);
      }

      // Козырной новичок — beat 20 cards with trump in one game
      const trumpCount = trumpDefMap.get(odId) ?? 0;
      if (trumpCount >= 20) {
        await incrementAchievementProgress(profileId, 'trump_rookie', 1);
      }

      // Первый подкид — throw 5+ cards in one turn (tracked as max per turn)
      const maxInOneTurn = maxCardsInOneTurnMap.get(odId) ?? 0;
      if (maxInOneTurn >= 5) {
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

    // Первый миллионер — 1,000,000 shanyrak: прогресс привязан к текущему балансу
    const db2 = await getDb();
    if (db2) {
      const [profile2] = await db2.select({ balanceShanyrak: playerProfiles.balanceShanyrak })
        .from(playerProfiles)
        .where(eq(playerProfiles.id, profileId))
        .limit(1);
      if (profile2) {
        // Отслеживаем прогресс по текущему балансу (max 1_000_000)
        const currentBalance = profile2.balanceShanyrak ?? 0;
        await incrementAchievementProgress(profileId, 'first_millionaire', 0, Math.min(currentBalance, 1000000));
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
    // Daily quests: spade_king_beats_trump_ace, king_beats_trump_total
    await incrementDailyQuestProgress(ctx.profileId, 'spade_king_beats_trump_ace', 1);
    await incrementDailyQuestProgress(ctx.profileId, 'king_beats_trump_total', 1);
  }
  // Король пики vs 777 — beat King of Spades with 777
  if (ctx.defenseIs777 && ctx.attackIsKingOfSpades) {
    await incrementAchievementProgress(ctx.profileId, 'king_vs_777', 1);
  }
  // Daily quest: defended_with_777
  if (ctx.defenseIs777) {
    await incrementDailyQuestProgress(ctx.profileId, 'defended_with_777', 1);
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

  // Маленький герой — на защитника походили королём пики, и он отбил тузом пики
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

// ============================================================
// Achievement count achievements (9-12: Любитель, Эксперт, Мастер, Легенда)
// Called after any achievement is claimed
// ============================================================

export async function processAchievementCountAchievements(profileId: number): Promise<void> {
  const { getAchievementsForProfile } = await import('./achievementsDb');
  const achievements = await getAchievementsForProfile(profileId);
  // Count completed achievements (progress >= target)
  const completedCount = achievements.filter(a => a.unlocked).length;
  await incrementAchievementProgress(profileId, 'achievement_lover', 0, Math.min(completedCount, 10)).catch(() => {});
  await incrementAchievementProgress(profileId, 'achievement_expert', 0, Math.min(completedCount, 20)).catch(() => {});
  await incrementAchievementProgress(profileId, 'achievement_master', 0, Math.min(completedCount, 30)).catch(() => {});
  await incrementAchievementProgress(profileId, 'achievement_achiever', 0, Math.min(completedCount, 50)).catch(() => {});
}

// ============================================================
// Collector achievements (13-16: рамки, колоды, плейлисты, аватарки)
// Called after buying/equipping items in shop
// ============================================================

export async function processCollectorAchievements(profileId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;
  const [profile] = await db
    .select({
      ownedFrames: playerProfiles.ownedFrames,
      ownedDecks: playerProfiles.ownedDecks,
      ownedPlaylists: playerProfiles.ownedPlaylists,
      ownedAvatars: playerProfiles.ownedAvatars,
    })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);
  if (!profile) return;

  const frames = JSON.parse(profile.ownedFrames ?? '[]') as string[];
  const decks = JSON.parse(profile.ownedDecks ?? '[]') as string[];
  const playlists = JSON.parse(profile.ownedPlaylists ?? '[]') as number[];
  const avatars = JSON.parse(profile.ownedAvatars ?? '[]') as string[];

  // fashionista: own 3 frames
  await incrementAchievementProgress(profileId, 'fashionista', 0, Math.min(frames.length, 3)).catch(() => {});
  // croupier: own 3 decks
  await incrementAchievementProgress(profileId, 'croupier', 0, Math.min(decks.length, 3)).catch(() => {});
  // meloman: own 3 playlists
  await incrementAchievementProgress(profileId, 'meloman', 0, Math.min(playlists.length, 3)).catch(() => {});
  // many_faces: own at least 5 different avatars (excluding classic ones)
  const CLASSIC_AVATAR_IDS = ['wolf', 'eagle', 'bear', 'fox', 'snow-leopard', 'bot'];
  const nonClassicAvatars = avatars.filter((id: string) => !CLASSIC_AVATAR_IDS.includes(id));
  await incrementAchievementProgress(profileId, 'many_faces', 0, Math.min(nonClassicAvatars.length, 5)).catch(() => {});
}

// ============================================================
// Season rank achievements (17-24)
// Called at end of season when rank is determined
// ============================================================

export async function processSeasonRankAchievements(profileId: number, rankId: string): Promise<void> {
  // Real rank keys from SEASON_REWARD_DEFS in shared/seasons.ts
  const rankOrder = ['steppe_hare', 'mountain_ram', 'golden_falcon', 'winged_horse', 'sky_eagle', 'steppe_khan', 'golden_horde_warrior', 'great_khan'];
  const rankIndex = rankOrder.indexOf(rankId);
  if (rankIndex < 0) return;

  // Map real rankKey → achievement key (from shared/achievements.ts)
  const rankAchievementMap: Record<string, string> = {
    steppe_hare:          'season_steppe_hare',
    mountain_ram:         'season_mountain_ram',
    golden_falcon:        'season_golden_falcon',
    winged_horse:         'season_winged_horse',
    sky_eagle:            'season_sky_eagle',
    steppe_khan:          'season_steppe_khan',
    golden_horde_warrior: 'season_golden_horde',
    great_khan:           'season_great_khan',
  };

  // Award achievement for the exact rank reached
  const achievementId = rankAchievementMap[rankId];
  if (achievementId) {
    await incrementAchievementProgress(profileId, achievementId, 0, 1).catch(() => {});
  }
}

// ============================================================
// Bot game achievements (25-28)
// Called from recordGameResult when isBotGame is true
// ============================================================

export async function processBotGameAchievements(profileId: number, totalBotGames: number): Promise<void> {
  await incrementAchievementProgress(profileId, 'bot_lover', 0, Math.min(totalBotGames, 10)).catch(() => {});
  await incrementAchievementProgress(profileId, 'bot_terror', 0, Math.min(totalBotGames, 25)).catch(() => {});
  await incrementAchievementProgress(profileId, 'programmer', 0, Math.min(totalBotGames, 50)).catch(() => {});
  await incrementAchievementProgress(profileId, 'bot_hater', 0, Math.min(totalBotGames, 100)).catch(() => {});
}

// ============================================================
// Leaderboard achievements (29-31: №1, №2, №3)
// Called periodically when leaderboard is checked
// ============================================================

export async function processLeaderboardAchievements(profileId: number, leaderboardPosition: number): Promise<void> {
  if (leaderboardPosition === 1) {
    await incrementAchievementProgress(profileId, 'leaderboard_1', 0, 1).catch(() => {});
  } else if (leaderboardPosition === 2) {
    await incrementAchievementProgress(profileId, 'leaderboard_2', 0, 1).catch(() => {});
  } else if (leaderboardPosition === 3) {
    await incrementAchievementProgress(profileId, 'leaderboard_3', 0, 1).catch(() => {});
  }
}

// ============================================================
// Tutorial achievements (32-34)
// Called when player completes tutorial
// ============================================================

export async function processTutorialAchievements(profileId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Increment tutorial completed count
  await db
    .update(playerProfiles)
    .set({ tutorialCompletedCount: sql`${playerProfiles.tutorialCompletedCount} + 1` })
    .where(eq(playerProfiles.id, profileId));

  const [profile] = await db
    .select({ tutorialCompletedCount: playerProfiles.tutorialCompletedCount })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);
  if (!profile) return;

  const count = profile.tutorialCompletedCount ?? 1;
  await incrementAchievementProgress(profileId, 'tutorial_student', 0, Math.min(count, 1)).catch(() => {});
  await incrementAchievementProgress(profileId, 'tutorial_honor', 0, Math.min(count, 2)).catch(() => {});
  await incrementAchievementProgress(profileId, 'tutorial_grind', 0, Math.min(count, 5)).catch(() => {});
}
