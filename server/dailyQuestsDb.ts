/**
 * Database helpers for the daily quests system.
 *
 * Quest pool: 43 quests defined in shared/dailyQuests.ts
 * Each player gets 4 random quests per Moscow day.
 * Resets at 00:00 Moscow time (UTC+3).
 */
import { getDb, recordTransaction } from "./db";
import { userDailyQuests, playerProfiles, transactions, type UserDailyQuest } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import {
  DAILY_QUESTS,
  DAILY_QUEST_MAP,
  DAILY_QUEST_COUNT,
  getMoscowDayStart,
  type DailyQuestTrackType,
} from "../shared/dailyQuests";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function pickRandom<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

/** Get or create today's 4 quests for a player */
export async function getOrAssignDailyQuests(profileId: number) {
  const dayStart = getMoscowDayStart();

  const db = await getDb();
  if (!db) return [];

  // Check if quests already assigned for today
  const existing = await db
    .select()
    .from(userDailyQuests)
    .where(
      and(
        eq(userDailyQuests.profileId, profileId),
        eq(userDailyQuests.dayStartTs, dayStart),
      )
    );

  if (existing.length > 0) {
    return existing;
  }

  // Assign 4 random quests (exclude meta quest from random pool — it's always included separately)
  const nonMeta = DAILY_QUESTS.filter(q => !q.isMeta);
  const metaQuests = DAILY_QUESTS.filter(q => q.isMeta);

  // Pick 3 non-meta + always include 1 meta (king_of_steppe) if available
  let selected = pickRandom(nonMeta, DAILY_QUEST_COUNT - metaQuests.length);
  selected = [...selected, ...metaQuests.slice(0, DAILY_QUEST_COUNT - selected.length)];

  // If no meta quests, just pick 4 non-meta
  if (metaQuests.length === 0) {
    selected = pickRandom(nonMeta, DAILY_QUEST_COUNT);
  }

  const db2 = await getDb();
  if (!db2) return [];

  const rows = selected.map(q => ({
    profileId,
    questKey: q.key,
    dayStartTs: dayStart,
    progress: 0,
    completed: false,
    claimed: false,
  }));

  await db2.insert(userDailyQuests).values(rows);

  return db2
    .select()
    .from(userDailyQuests)
    .where(
      and(
        eq(userDailyQuests.profileId, profileId),
        eq(userDailyQuests.dayStartTs, dayStart),
      )
    );
}

/** Get today's quests with definitions merged */
export async function getTodayQuestsWithDefs(profileId: number) {
  const rows = await getOrAssignDailyQuests(profileId);
  return rows.map(row => {
    const def = DAILY_QUEST_MAP[row.questKey];
    return { ...row, def };
  }).filter(r => !!r.def);
}

/** Increment progress for a specific trackType for a player today */
export async function incrementDailyQuestProgress(
  profileId: number,
  trackType: DailyQuestTrackType,
  amount: number = 1,
): Promise<{ completedKeys: string[] }> {
  const dayStart = getMoscowDayStart();
  const completedKeys: string[] = [];

  // Get today's quests matching this trackType
  const db = await getDb();
  if (!db) return { completedKeys: [] };

  const todayRows = await db
    .select()
    .from(userDailyQuests)
    .where(
      and(
        eq(userDailyQuests.profileId, profileId),
        eq(userDailyQuests.dayStartTs, dayStart),
      )
    );

  for (const row of todayRows) {
    if (row.completed) continue;
    const def = DAILY_QUEST_MAP[row.questKey];
    if (!def || def.trackType !== trackType || def.isMeta === true) continue;

    const newProgress = Math.min(row.progress + amount, def.target);
    const nowCompleted = newProgress >= def.target;

    await db
      .update(userDailyQuests)
      .set({
        progress: newProgress,
        completed: nowCompleted,
        completedAt: nowCompleted ? new Date() : undefined,
      })
      .where(eq(userDailyQuests.id, row.id));

    if (nowCompleted) {
      completedKeys.push(row.questKey);
    }
  }

  // Check meta quest (king_of_steppe) — count completed non-meta quests
  if (completedKeys.length > 0) {
    await checkMetaQuest(profileId, dayStart);
  }

  return { completedKeys };
}

/** Set progress to exact value (for "in one game" type quests — reset each game) */
export async function setDailyQuestProgress(
  profileId: number,
  trackType: DailyQuestTrackType,
  value: number,
): Promise<{ completedKeys: string[] }> {
  const dayStart = getMoscowDayStart();
  const completedKeys: string[] = [];

  const db = await getDb();
  if (!db) return { completedKeys: [] };

  const todayRows = await db
    .select()
    .from(userDailyQuests)
    .where(
      and(
        eq(userDailyQuests.profileId, profileId),
        eq(userDailyQuests.dayStartTs, dayStart),
      )
    );

  for (const row of todayRows) {
    if (row.completed) continue;
    const def = DAILY_QUEST_MAP[row.questKey];
    if (!def || def.trackType !== trackType || def.isMeta === true) continue;

    // For "in one game" quests, only update if new value is higher
    const newProgress = Math.max(row.progress, Math.min(value, def.target));
    const nowCompleted = newProgress >= def.target;

    await db
      .update(userDailyQuests)
      .set({
        progress: newProgress,
        completed: nowCompleted,
        completedAt: nowCompleted ? new Date() : undefined,
      })
      .where(eq(userDailyQuests.id, row.id));

    if (nowCompleted) {
      completedKeys.push(row.questKey);
    }
  }

  if (completedKeys.length > 0) {
    await checkMetaQuest(profileId, dayStart);
  }

  return { completedKeys };
}

/** Check and update the meta quest (king_of_steppe) */
async function checkMetaQuest(profileId: number, dayStart: number) {
  const db = await getDb();
  if (!db) return;

  const todayRows = await db
    .select()
    .from(userDailyQuests)
    .where(
      and(
        eq(userDailyQuests.profileId, profileId),
        eq(userDailyQuests.dayStartTs, dayStart),
      )
    );

  const metaRow = todayRows.find((r: UserDailyQuest) => {
    const def = DAILY_QUEST_MAP[r.questKey];
    return def?.isMeta === true;
  });
  if (!metaRow || metaRow.completed) return;

  const metaDef = DAILY_QUEST_MAP[metaRow.questKey];
  if (!metaDef) return;

  const completedNonMeta = todayRows.filter((r: UserDailyQuest) => {
    const def = DAILY_QUEST_MAP[r.questKey];
    return def && def.isMeta !== true && r.completed;
  }).length;

  const newProgress = Math.min(completedNonMeta, metaDef.target);
  const nowCompleted = newProgress >= metaDef.target;

  await db
    .update(userDailyQuests)
    .set({
      progress: newProgress,
      completed: nowCompleted,
      completedAt: nowCompleted ? new Date() : undefined,
    })
    .where(eq(userDailyQuests.id, metaRow.id));
}

/** Claim reward for a completed quest */
export async function claimDailyQuestReward(
  profileId: number,
  questKey: string,
): Promise<{ shanyrakAwarded: number }> {
  const dayStart = getMoscowDayStart();

  const dbInst = await getDb();
  if (!dbInst) throw new Error("Database unavailable");

  const [row] = await dbInst
    .select()
    .from(userDailyQuests)
    .where(
      and(
        eq(userDailyQuests.profileId, profileId),
        eq(userDailyQuests.questKey, questKey),
        eq(userDailyQuests.dayStartTs, dayStart),
      )
    )
    .limit(1);

  if (!row) throw new Error("Quest not found for today");
  if (!row.completed) throw new Error("Quest not completed yet");
  if (row.claimed) throw new Error("Reward already claimed");

  const def = DAILY_QUEST_MAP[questKey];
  if (!def) throw new Error("Unknown quest key");

  const shanyrak = def.reward.shanyrak;

  // Mark as claimed
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  await db
    .update(userDailyQuests)
    .set({ claimed: true, claimedAt: new Date() })
    .where(eq(userDailyQuests.id, row.id));

  // Award shanyrak
  await db
    .update(playerProfiles)
    .set({ balanceShanyrak: sql`balanceShanyrak + ${shanyrak}` })
    .where(eq(playerProfiles.id, profileId));

  // Record transaction
  await db.insert(transactions).values({
    profileId,
    type: "daily_quest_reward",
    amount: shanyrak,
    currency: "shanyrak",
    description: `Daily quest reward: ${questKey}`,
  });

  return { shanyrakAwarded: shanyrak };
}

/** Count unclaimed completed quests for today */
export async function getUnclaimedDailyQuestCount(profileId: number): Promise<number> {
  const dayStart = getMoscowDayStart();
  const db = await getDb();
  if (!db) return 0;

  const rows = await db
    .select()
    .from(userDailyQuests)
    .where(
      and(
        eq(userDailyQuests.profileId, profileId),
        eq(userDailyQuests.dayStartTs, dayStart),
      )
    );
  return rows.filter((r: UserDailyQuest) => r.completed && !r.claimed).length;
}

/**
 * Process daily quest progress after a game ends.
 * Called from socketServer.ts after each finished game.
 * Handles all trackTypes that are measured per-game or per-day.
 */
export async function processDailyQuestsAfterGame(params: {
  roomId: string;
  playerGameIds: Map<string, number>;
  winnersOrder: string[];
  loserId: string | null | undefined;
  allHumanOdIds: string[];
  botCount: number;
  totalPlayersInRoom: number;
  durationSeconds: number;
  /** Per-player game stats collected during the game */
  perPlayerStats?: Map<string, {
    cardsTaken: number;
    trumpDefenses: number;
    defenses: number;
    cardsThrown: number;
    attacks: number;
    trumpBeats: number;
    trumpAceUsed: number;
    transfers: number;
    passCardsShown: number;
    startedTurnWith10: number;
    defended777: number;
    threw6ToNonNeighbor: number;
    beatSameRankSuit: number;
    spadeKingBeatsTrumpAce: number;
    kingBeatsTrump: number;
    cardsInOneTurn: number;
    trumpAceInOneGame: number;
  }>;
}): Promise<void> {
  const {
    playerGameIds, winnersOrder, loserId, allHumanOdIds,
    botCount, totalPlayersInRoom, durationSeconds, perPlayerStats,
  } = params;

  // Check bot ratio — quests only count if bots < 33.4% of players
  const botRatio = totalPlayersInRoom > 0 ? botCount / totalPlayersInRoom : 0;
  const qualifies = botRatio < 0.334;
  if (!qualifies) return;

  // Build odId -> profileId map by looking up gameId -> profileId in DB
  // playerGameIds stores odId -> gameId (NOT profileId)
  const db = await getDb();
  if (!db) return;
  const odIdToProfileId = new Map<string, number>();
  for (const odId of allHumanOdIds) {
    const gameId = playerGameIds.get(odId);
    if (!gameId) continue;
    const [row] = await db.select({ id: playerProfiles.id })
      .from(playerProfiles)
      .where(eq(playerProfiles.gameId, gameId))
      .limit(1);
    if (row?.id) odIdToProfileId.set(odId, row.id);
  }

  const winner1OdId = winnersOrder[0] || null;
  const winner2OdId = winnersOrder[1] || null;
  const winner3OdId = winnersOrder[2] || null;

  for (const odId of allHumanOdIds) {
    const profileId = odIdToProfileId.get(odId);
    if (!profileId) continue;

    // Ensure today's quests are assigned
    await getOrAssignDailyQuests(profileId);

    const isWinner = winnersOrder.includes(odId);
    const isFirst = winner1OdId === odId;
    const isDurak = loserId === odId;
    const stats = perPlayerStats?.get(odId);

    // ── games_played ──────────────────────────────────────────────────────────
    await incrementDailyQuestProgress(profileId, 'games_played', 1);

    // ── games_won ─────────────────────────────────────────────────────────────
    if (isWinner) {
      await incrementDailyQuestProgress(profileId, 'games_won', 1);
    }

    // ── first_place_today ─────────────────────────────────────────────────────
    if (isFirst) {
      await incrementDailyQuestProgress(profileId, 'first_place_today', 1);
    }

    // ── wins_today ────────────────────────────────────────────────────────────
    if (isWinner) {
      await incrementDailyQuestProgress(profileId, 'wins_today', 1);
    }

    // ── became_durak ──────────────────────────────────────────────────────────
    if (isDurak) {
      await incrementDailyQuestProgress(profileId, 'became_durak', 1);
      await incrementDailyQuestProgress(profileId, 'became_durak_count', 1);
    }

    // ── game_finished_under_15min ─────────────────────────────────────────────
    if (durationSeconds > 0 && durationSeconds < 15 * 60) {
      await incrementDailyQuestProgress(profileId, 'game_finished_under_15min', 1);
    }

    // ── wins_in_a_row — handled separately via consecutive win tracking ────────
    // (not tracked here — needs persistent consecutive win counter)

    // ── Per-game stats (if available) ─────────────────────────────────────────
    if (stats) {
      // cards_taken_in_game — set (not increment) because it's per-game
      if (stats.cardsTaken > 0) {
        await setDailyQuestProgress(profileId, 'cards_taken_in_game', stats.cardsTaken);
      }

      // trump_defenses_total
      if (stats.trumpDefenses > 0) {
        await incrementDailyQuestProgress(profileId, 'trump_defenses_total', stats.trumpDefenses);
      }

      // defenses_total
      if (stats.defenses > 0) {
        await incrementDailyQuestProgress(profileId, 'defenses_total', stats.defenses);
      }

      // cards_thrown_total
      if (stats.cardsThrown > 0) {
        await incrementDailyQuestProgress(profileId, 'cards_thrown_total', stats.cardsThrown);
      }

      // attacks_total
      if (stats.attacks > 0) {
        await incrementDailyQuestProgress(profileId, 'attacks_total', stats.attacks);
      }

      // trump_beats_in_one_game — set (per-game)
      if (stats.trumpBeats > 0) {
        await setDailyQuestProgress(profileId, 'trump_beats_in_one_game', stats.trumpBeats);
      }

      // trump_ace_used_total
      if (stats.trumpAceUsed > 0) {
        await incrementDailyQuestProgress(profileId, 'trump_ace_used_total', stats.trumpAceUsed);
      }

      // trump_ace_in_one_game — set (per-game)
      if (stats.trumpAceInOneGame > 0) {
        await setDailyQuestProgress(profileId, 'trump_ace_in_one_game', stats.trumpAceInOneGame);
      }

      // attack_transfers_total
      if (stats.transfers > 0) {
        await incrementDailyQuestProgress(profileId, 'attack_transfers_total', stats.transfers);
      }

      // pass_card_shown
      if (stats.passCardsShown > 0) {
        await incrementDailyQuestProgress(profileId, 'pass_card_shown', stats.passCardsShown);
      }

      // started_turn_with_10
      if (stats.startedTurnWith10 > 0) {
        await incrementDailyQuestProgress(profileId, 'started_turn_with_10', stats.startedTurnWith10);
      }

      // defended_with_777
      if (stats.defended777 > 0) {
        await incrementDailyQuestProgress(profileId, 'defended_with_777', stats.defended777);
      }

      // threw_6_to_non_neighbor
      if (stats.threw6ToNonNeighbor > 0) {
        await incrementDailyQuestProgress(profileId, 'threw_6_to_non_neighbor', stats.threw6ToNonNeighbor);
      }

      // beat_same_rank_suit_15
      if (stats.beatSameRankSuit > 0) {
        await incrementDailyQuestProgress(profileId, 'beat_same_rank_suit_15', stats.beatSameRankSuit);
      }

      // spade_king_beats_trump_ace (3 times)
      if (stats.spadeKingBeatsTrumpAce > 0) {
        await incrementDailyQuestProgress(profileId, 'spade_king_beats_trump_ace_3', stats.spadeKingBeatsTrumpAce);
      }

      // king_beats_trump_total
      if (stats.kingBeatsTrump > 0) {
        await incrementDailyQuestProgress(profileId, 'king_beats_trump_total', stats.kingBeatsTrump);
      }

      // cards_thrown_in_one_turn — set (per-game, max in one turn)
      if (stats.cardsInOneTurn > 0) {
        await setDailyQuestProgress(profileId, 'cards_thrown_in_one_turn', stats.cardsInOneTurn);
      }

      // perfect_defense_games — if winner took no cards
      if (isWinner && stats.cardsTaken === 0) {
        await incrementDailyQuestProgress(profileId, 'perfect_defense_games', 1);
      }
    }
  }
}

/** Swap a specific daily quest with a new random one (premium feature, max 3/day) */
export async function swapDailyQuest(profileId: number, questKey: string) {
  const dayStart = getMoscowDayStart();
  const db = await getDb();
  if (!db) return [];

  // Get today's quests
  const existing = await db
    .select()
    .from(userDailyQuests)
    .where(
      and(
        eq(userDailyQuests.profileId, profileId),
        eq(userDailyQuests.dayStartTs, dayStart),
      )
    );

  if (existing.length === 0) return [];

  // Find the quest to swap
  const questToSwap = existing.find((q: UserDailyQuest) => q.questKey === questKey);
  if (!questToSwap) return getTodayQuestsWithDefs(profileId);

  // Don't swap completed quests
  if (questToSwap.completed) return getTodayQuestsWithDefs(profileId);

  // Get all quest keys currently assigned today
  const currentKeys = existing.map((q: UserDailyQuest) => q.questKey);

  // Pick a new quest not currently assigned
  const available = DAILY_QUESTS.filter(q => !currentKeys.includes(q.key));
  if (available.length === 0) return getTodayQuestsWithDefs(profileId);

  const newQuest = available[Math.floor(Math.random() * available.length)];

  // Delete the old quest and insert the new one
  await db
    .delete(userDailyQuests)
    .where(
      and(
        eq(userDailyQuests.profileId, profileId),
        eq(userDailyQuests.questKey, questKey),
        eq(userDailyQuests.dayStartTs, dayStart),
      )
    );

  await db.insert(userDailyQuests).values({
    profileId,
    questKey: newQuest.key,
    dayStartTs: dayStart,
    progress: 0,
    completed: false,
    claimed: false,
  });

  return getTodayQuestsWithDefs(profileId);
}
