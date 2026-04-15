/**
 * Achievement database helpers for Казахский Дурак Онлайн.
 */
import { eq, and } from "drizzle-orm";
import { getDb, recordTransaction } from "./db";
import { userAchievements, playerProfiles } from "../drizzle/schema";
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from "../shared/achievements";

/**
 * Get all achievement progress rows for a player.
 * Returns merged list: all defined achievements with progress from DB (0 if not started).
 */
export async function getAchievementsForProfile(profileId: number) {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(userAchievements)
    .where(eq(userAchievements.profileId, profileId));
  const rowMap: Record<string, typeof rows[0]> = {};
  for (const r of rows) rowMap[r.achievementKey] = r;
  return ACHIEVEMENTS.map(def => {
    const row = rowMap[def.key];
    return {
      key: def.key,
      nameRu: def.nameRu,
      nameKk: def.nameKk,
      nameEn: def.nameEn,
      descRu: def.descRu,
      descKk: def.descKk,
      descEn: def.descEn,
      reward: def.reward,
      maxProgress: def.maxProgress,
      category: def.category,
      icon: def.icon,
      progress: row?.progress ?? 0,
      unlocked: row?.unlocked ?? false,
      claimed: row?.claimed ?? false,
      unlockedAt: row?.unlockedAt ?? null,
      claimedAt: row?.claimedAt ?? null,
    };
  });
}

/**
 * Increment progress for an achievement. If target is reached, mark as unlocked.
 * Returns { justUnlocked: boolean, key: string } so caller can trigger reward notification.
 */
export async function incrementAchievementProgress(
  profileId: number,
  achievementKey: string,
  incrementBy = 1,
  setTo?: number,
): Promise<{ justUnlocked: boolean }> {
  const db = await getDb();
  if (!db) return { justUnlocked: false };
  const def = ACHIEVEMENT_MAP[achievementKey];
  if (!def) return { justUnlocked: false };

  const [existing] = await db.select().from(userAchievements)
    .where(and(
      eq(userAchievements.profileId, profileId),
      eq(userAchievements.achievementKey, achievementKey),
    ))
    .limit(1);

  if (existing?.unlocked) return { justUnlocked: false }; // already done

  const currentProgress = existing?.progress ?? 0;
  const newProgress = setTo !== undefined ? setTo : Math.min(currentProgress + incrementBy, def.maxProgress);
  const justUnlocked = newProgress >= def.maxProgress;

  if (!existing) {
    await db.insert(userAchievements).values({
      profileId,
      achievementKey,
      progress: newProgress,
      unlocked: justUnlocked,
      unlockedAt: justUnlocked ? new Date() : undefined,
    });
  } else {
    await db.update(userAchievements)
      .set({
        progress: newProgress,
        unlocked: justUnlocked,
        unlockedAt: justUnlocked && !existing.unlockedAt ? new Date() : existing.unlockedAt,
      })
      .where(eq(userAchievements.id, existing.id));
  }

  // If this is the first achievement unlocked, also unlock 'first_shanyrak'
  if (justUnlocked && achievementKey !== 'first_shanyrak') {
    const [fs] = await db.select().from(userAchievements)
      .where(and(
        eq(userAchievements.profileId, profileId),
        eq(userAchievements.achievementKey, 'first_shanyrak'),
      ))
      .limit(1);
    if (!fs || !fs.unlocked) {
      await incrementAchievementProgress(profileId, 'first_shanyrak', 1);
    }
  }

  return { justUnlocked };
}

/**
 * Claim the reward for an unlocked achievement.
 * Credits shanyrak/tenge to the player's balance.
 */
export async function claimAchievementReward(
  profileId: number,
  achievementKey: string,
): Promise<{ success: boolean; reason?: string; shanyrakAwarded?: number; tengeAwarded?: number }> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'db_unavailable' };
  const def = ACHIEVEMENT_MAP[achievementKey];
  if (!def) return { success: false, reason: 'unknown_achievement' };

  const [row] = await db.select().from(userAchievements)
    .where(and(
      eq(userAchievements.profileId, profileId),
      eq(userAchievements.achievementKey, achievementKey),
    ))
    .limit(1);

  if (!row || !row.unlocked) return { success: false, reason: 'not_unlocked' };
  if (row.claimed) return { success: false, reason: 'already_claimed' };

  const [profile] = await db.select().from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);
  if (!profile) return { success: false, reason: 'profile_not_found' };

  const shanyrakAward = def.reward.shanyrak ?? 0;
  const tengeAward = def.reward.tenge ?? 0;
  const newShanyrak = profile.balanceShanyrak + shanyrakAward;
  const newTenge = profile.balanceTenge + tengeAward;

  await db.update(playerProfiles)
    .set({
      balanceShanyrak: newShanyrak,
      ...(tengeAward > 0 ? { balanceTenge: newTenge } : {}),
    })
    .where(eq(playerProfiles.id, profileId));

  await db.update(userAchievements)
    .set({ claimed: true, claimedAt: new Date() })
    .where(eq(userAchievements.id, row.id));

  if (shanyrakAward > 0) {
    await recordTransaction({
      profileId,
      type: 'game_reward',
      amount: shanyrakAward,
      currency: 'shanyrak',
      description: `Достижение: ${def.nameRu}`,
      balanceAfter: newShanyrak,
    });
  }
  if (tengeAward > 0) {
    await recordTransaction({
      profileId,
      type: 'game_reward',
      amount: tengeAward,
      currency: 'tenge',
      description: `Достижение: ${def.nameRu}`,
      balanceAfter: newTenge,
    });
  }

  // Trigger achievement count achievements (9-12)
  try {
    const { processAchievementCountAchievements } = await import('./achievementsTriggers');
    processAchievementCountAchievements(profileId).catch(() => {});
  } catch (e) { /* non-blocking */ }

  return { success: true, shanyrakAwarded: shanyrakAward, tengeAwarded: tengeAward };
}

/**
 * Get count of unclaimed (unlocked but not yet claimed) achievements for a player.
 */
export async function getUnclaimedAchievementCount(profileId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const rows = await db.select({ id: userAchievements.id })
    .from(userAchievements)
    .where(and(
      eq(userAchievements.profileId, profileId),
      eq(userAchievements.unlocked, true),
      eq(userAchievements.claimed, false),
    ));
  return rows.length;
}

/**
 * Force-recalculate the many_faces achievement for a player.
 * Unlike incrementAchievementProgress, this bypasses the "already unlocked" guard
 * and directly updates the progress/unlocked state based on current owned avatars.
 * Used by admins to fix players who had the achievement key bug (avatar_collector → many_faces).
 */
export async function forceRecalculateManyFaces(profileId: number): Promise<{ progress: number; unlocked: boolean; justUnlocked: boolean }> {
  const db = await getDb();
  if (!db) return { progress: 0, unlocked: false, justUnlocked: false };

  const [profile] = await db.select({ ownedAvatars: playerProfiles.ownedAvatars })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);
  if (!profile) return { progress: 0, unlocked: false, justUnlocked: false };

  const avatars = JSON.parse(profile.ownedAvatars ?? '[]') as string[];
  const CLASSIC_AVATAR_IDS = ['wolf', 'eagle', 'bear', 'fox', 'snow-leopard', 'bot'];
  const nonClassicAvatars = avatars.filter((id: string) => !CLASSIC_AVATAR_IDS.includes(id));
  const newProgress = Math.min(nonClassicAvatars.length, 5);
  const newUnlocked = newProgress >= 5;

  const [existing] = await db.select().from(userAchievements)
    .where(and(
      eq(userAchievements.profileId, profileId),
      eq(userAchievements.achievementKey, 'many_faces'),
    ))
    .limit(1);

  const wasUnlocked = existing?.unlocked ?? false;
  const justUnlocked = newUnlocked && !wasUnlocked;

  if (!existing) {
    await db.insert(userAchievements).values({
      profileId,
      achievementKey: 'many_faces',
      progress: newProgress,
      unlocked: newUnlocked,
      unlockedAt: newUnlocked ? new Date() : undefined,
    });
  } else {
    await db.update(userAchievements)
      .set({
        progress: newProgress,
        unlocked: newUnlocked,
        unlockedAt: newUnlocked && !existing.unlockedAt ? new Date() : existing.unlockedAt,
      })
      .where(eq(userAchievements.id, existing.id));
  }

  return { progress: newProgress, unlocked: newUnlocked, justUnlocked };
}
