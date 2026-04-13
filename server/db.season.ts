import { getDb } from './db';
import { seasonRatings, seasonRewards, playerProfiles, notifications } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { getCurrentSeasonKey, getSeasonRank, getSeasonRewardDef, getSeasonRewardDefForSeason, getSeasonInfo } from "../shared/seasons";
import { getSeasonAvatarId } from "../shared/avatars";

// ─── Season Rating Helpers ────────────────────────────────────────────────────

/** Get or create a season rating record for a player in the current season */
export async function getOrCreateSeasonRating(profileId: number, seasonKey?: string) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  const key = seasonKey ?? getCurrentSeasonKey();
  const existing = await db
    .select()
    .from(seasonRatings)
    .where(and(eq(seasonRatings.profileId, profileId), eq(seasonRatings.seasonKey, key)))
    .limit(1);

  if (existing.length > 0) return existing[0];

  await db.insert(seasonRatings).values({
    profileId,
    seasonKey: key,
    seasonRating: 0,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
  });

  const created = await db
    .select()
    .from(seasonRatings)
    .where(and(eq(seasonRatings.profileId, profileId), eq(seasonRatings.seasonKey, key)))
    .limit(1);

  return created[0];
}

/** Apply a season rating change (no premium bonus, floored at 0) */
export async function applySeasonRatingChange(
  profileId: number,
  delta: number,
  isWin: boolean,
  isLoss: boolean,
  seasonKey?: string,
) {
  const db = await getDb();
  if (!db) return;
  const key = seasonKey ?? getCurrentSeasonKey();
  await getOrCreateSeasonRating(profileId, key);

  await db
    .update(seasonRatings)
    .set({
      seasonRating: sql`GREATEST(0, ${seasonRatings.seasonRating} + ${delta})`,
      gamesPlayed: sql`${seasonRatings.gamesPlayed} + 1`,
      wins: isWin ? sql`${seasonRatings.wins} + 1` : sql`${seasonRatings.wins}`,
      losses: isLoss ? sql`${seasonRatings.losses} + 1` : sql`${seasonRatings.losses}`,
    })
    .where(and(eq(seasonRatings.profileId, profileId), eq(seasonRatings.seasonKey, key)));
}

/** Get season leaderboard for a given season key (all players, including those with 0 rating) */
export async function getSeasonLeaderboard(seasonKey: string, limit = 100) {
  const db = await getDb();
  if (!db) return [];

  // LEFT JOIN: all registered players, with season rating defaulting to 0 if no record
  const rows = await db
    .select({
      profileId: playerProfiles.id,
      seasonRating: sql<number>`COALESCE(${seasonRatings.seasonRating}, 0)`,
      gamesPlayed: sql<number>`COALESCE(${seasonRatings.gamesPlayed}, 0)`,
      wins: sql<number>`COALESCE(${seasonRatings.wins}, 0)`,
      losses: sql<number>`COALESCE(${seasonRatings.losses}, 0)`,
      displayName: playerProfiles.displayName,
      gameId: playerProfiles.gameId,
      avatarId: playerProfiles.avatarId,
      avatarUrl: playerProfiles.avatarUrl,
      equippedFrame: playerProfiles.equippedFrame,
    })
    .from(playerProfiles)
    .leftJoin(
      seasonRatings,
      and(
        eq(seasonRatings.profileId, playerProfiles.id),
        eq(seasonRatings.seasonKey, seasonKey),
      ),
    )
    .orderBy(desc(sql`COALESCE(${seasonRatings.seasonRating}, 0)`), playerProfiles.gameId)
    .limit(limit);

  return rows;
}

/** Get a player's season rating for the current season */
export async function getPlayerSeasonRating(profileId: number, seasonKey?: string) {
  const db = await getDb();
  if (!db) return null;
  const key = seasonKey ?? getCurrentSeasonKey();
  const rows = await db
    .select()
    .from(seasonRatings)
    .where(and(eq(seasonRatings.profileId, profileId), eq(seasonRatings.seasonKey, key)))
    .limit(1);
  return rows[0] ?? null;
}

// ─── Season End Processing ────────────────────────────────────────────────────

/**
 * Process end-of-season rewards for all players who participated.
 * Called by the cron job at the end of each month.
 *
 * Per-season avatar IDs: avatarId is stored with a season suffix (e.g. 'diving_eagle_2026Q2')
 * so each season's reward is a distinct item in the player's collection.
 */
export async function processSeasonEnd(seasonKey: string) {
  const db = await getDb();
  if (!db) return { processed: 0 };

  // Get all players who participated in this season
  const participants = await db
    .select()
    .from(seasonRatings)
    .where(eq(seasonRatings.seasonKey, seasonKey));

  let processed = 0;
  const seasonInfo = getSeasonInfo(seasonKey);

  for (const participant of participants) {
    const rank = getSeasonRank(participant.seasonRating);
    const rewardDef = seasonInfo
      ? getSeasonRewardDefForSeason(rank.key, seasonInfo)
      : getSeasonRewardDef(rank.key);

    // Build per-season avatar/frame IDs (suffixed with season key)
    const seasonAvatarId = rewardDef.avatarId
      ? getSeasonAvatarId(rewardDef.avatarId, seasonKey)
      : null;
    const seasonFrameId = rewardDef.frameId
      ? getSeasonAvatarId(rewardDef.frameId, seasonKey)
      : null;

    // Check if reward already processed
    const existing = await db
      .select()
      .from(seasonRewards)
      .where(and(
        eq(seasonRewards.profileId, participant.profileId),
        eq(seasonRewards.seasonKey, seasonKey),
      ))
      .limit(1);

    if (existing.length > 0) continue;

    // Create reward record
    await db.insert(seasonRewards).values({
      profileId: participant.profileId,
      seasonKey,
      finalRating: participant.seasonRating,
      rankKey: rank.key,
      shanyraksAwarded: rewardDef.shanyraks,
      tengeAwarded: rewardDef.tenge,
      claimed: false,
    });

    // Credit shanyrak balance
    if (rewardDef.shanyraks > 0) {
      await db
        .update(playerProfiles)
        .set({
          balanceShanyrak: sql`${playerProfiles.balanceShanyrak} + ${rewardDef.shanyraks}`,
        })
        .where(eq(playerProfiles.id, participant.profileId));
    }

    // Credit tenge balance
    if (rewardDef.tenge > 0) {
      await db
        .update(playerProfiles)
        .set({
          balanceTenge: sql`${playerProfiles.balanceTenge} + ${rewardDef.tenge}`,
        })
        .where(eq(playerProfiles.id, participant.profileId));
    }

    // Trigger season rank achievements
    try {
      const { processSeasonRankAchievements } = await import('./achievementsTriggers');
      await processSeasonRankAchievements(participant.profileId, rank.key);
    } catch (e) { /* non-blocking */ }

    // Send in-app notification — avatarId is the per-season suffixed ID
    await db.insert(notifications).values({
      profileId: participant.profileId,
      type: 'season_reward',
      data: JSON.stringify({
        seasonKey,
        rankKey: rank.key,
        rankNameRu: rank.nameRu,
        rankNameKk: rank.nameKk,
        rankNameEn: rank.nameEn,
        seasonRating: participant.seasonRating,
        shanyraks: rewardDef.shanyraks,
        tenge: rewardDef.tenge,
        // Per-season suffixed IDs (e.g. 'diving_eagle_2026Q2', 'neon_paw_2026Q3')
        avatarId: seasonAvatarId,
        frameId: seasonFrameId,
        claimed: false,
      }),
      isRead: false,
    });

    processed++;
  }

  return { processed };
}

/** Get unclaimed season rewards for a player */
export async function getUnclaimedSeasonRewards(profileId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(seasonRewards)
    .where(and(
      eq(seasonRewards.profileId, profileId),
      eq(seasonRewards.claimed, false),
    ))
    .orderBy(desc(seasonRewards.createdAt));
}

/**
 * Claim a season reward: mark as claimed, grant avatar/frame ownership, delete the notification.
 * Returns { success, reason? }
 *
 * The avatar/frame IDs granted are per-season suffixed (e.g. 'diving_eagle_2026Q2')
 * so each season's reward is a distinct item in the player's collection.
 */
export async function claimSeasonReward(
  profileId: number,
  seasonKey: string,
): Promise<{ success: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'db_unavailable' };

  // Find unclaimed reward
  const [reward] = await db
    .select()
    .from(seasonRewards)
    .where(and(
      eq(seasonRewards.profileId, profileId),
      eq(seasonRewards.seasonKey, seasonKey),
      eq(seasonRewards.claimed, false),
    ))
    .limit(1);

  if (!reward) return { success: false, reason: 'not_found' };

  // Get the season-specific reward definition (applies rankRewardOverrides)
  const seasonInfo = getSeasonInfo(seasonKey);
  const rewardDef = seasonInfo
    ? getSeasonRewardDefForSeason(reward.rankKey, seasonInfo)
    : getSeasonRewardDef(reward.rankKey);

  // Build per-season avatar/frame IDs
  const seasonAvatarId = rewardDef.avatarId
    ? getSeasonAvatarId(rewardDef.avatarId, seasonKey)
    : null;
  const seasonFrameId = rewardDef.frameId
    ? getSeasonAvatarId(rewardDef.frameId, seasonKey)
    : null;

  // Mark as claimed
  await db.update(seasonRewards)
    .set({ claimed: true })
    .where(eq(seasonRewards.id, reward.id));

  // Grant per-season avatar ownership (if any)
  if (seasonAvatarId) {
    const [profile] = await db
      .select({ ownedAvatars: playerProfiles.ownedAvatars })
      .from(playerProfiles)
      .where(eq(playerProfiles.id, profileId))
      .limit(1);
    if (profile) {
      const owned: string[] = profile.ownedAvatars ? JSON.parse(profile.ownedAvatars) : [];
      if (!owned.includes(seasonAvatarId)) {
        owned.push(seasonAvatarId);
        await db.update(playerProfiles)
          .set({ ownedAvatars: JSON.stringify(owned) })
          .where(eq(playerProfiles.id, profileId));
      }
    }
  }

  // Grant per-season frame ownership (if any)
  if (seasonFrameId) {
    const [profile] = await db
      .select({ ownedFrames: playerProfiles.ownedFrames })
      .from(playerProfiles)
      .where(eq(playerProfiles.id, profileId))
      .limit(1);
    if (profile) {
      const owned: string[] = profile.ownedFrames ? JSON.parse(profile.ownedFrames) : [];
      if (!owned.includes(seasonFrameId)) {
        owned.push(seasonFrameId);
        await db.update(playerProfiles)
          .set({ ownedFrames: JSON.stringify(owned) })
          .where(eq(playerProfiles.id, profileId));
      }
    }
  }

  // Trigger collector achievements if avatar/frame was granted
  if (seasonAvatarId || seasonFrameId) {
    try {
      const { processCollectorAchievements } = await import('./achievementsTriggers');
      await processCollectorAchievements(profileId);
    } catch (_) {}
  }

  // Delete the season_reward notification so it disappears after claiming
  await db.delete(notifications).where(and(
    eq(notifications.profileId, profileId),
    eq(notifications.type, 'season_reward'),
    sql`JSON_UNQUOTE(JSON_EXTRACT(${notifications.data}, '$.seasonKey')) = ${seasonKey}`,
  ));

  return { success: true };
}
