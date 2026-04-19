/**
 * Achievement database helpers for Казахский Дурак Онлайн.
 */
import { eq, and, sql, desc } from "drizzle-orm";
import { getDb, recordTransaction } from "./db";
import { userAchievements, playerProfiles, transactions, referrals, seasonRewards } from "../drizzle/schema";
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
      nameUk: def.nameUk,
      descRu: def.descRu,
      descKk: def.descKk,
      descEn: def.descEn,
      descUk: def.descUk,
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

  // Track first_millionaire progress after any shanyrak award
  if (shanyrakAward > 0 && newShanyrak > 0) {
    try {
      await incrementAchievementProgress(profileId, 'first_millionaire', 0, Math.min(newShanyrak, 1000000));
    } catch (e) { /* non-blocking */ }
  }

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

// ============================================================
// RETROACTIVE RECALCULATION
// ============================================================

/**
 * Retroactively recalculate all static-data achievements for a single player.
 * Only recalculates achievements that can be derived from current DB state.
 * Does NOT touch achievements that require real-time game data
 * (first_trump, batyr_recruit, bush_rabbit, first_throw, quick_win, clean_win,
 *  quick_start, first_berkut, little_hero, three_throws, trump_rookie,
 *  spade_king, lucky_sevens, king_vs_777, what_is_happening, spiderman_meme).
 */
export async function retroactiveRecalcForProfile(profileId: number): Promise<{
  profileId: number;
  recalculated: string[];
  newlyUnlocked: string[];
}> {
  const db = await getDb();
  if (!db) return { profileId, recalculated: [], newlyUnlocked: [] };

  // Fetch all needed profile data in one query
  const [profile] = await db.select({
    id: playerProfiles.id,
    gamesPlayed: playerProfiles.gamesPlayed,
    botGamesPlayed: playerProfiles.botGamesPlayed,
    rating: playerProfiles.rating,
    balanceShanyrak: playerProfiles.balanceShanyrak,
    ownedFrames: playerProfiles.ownedFrames,
    ownedDecks: playerProfiles.ownedDecks,
    ownedPlaylists: playerProfiles.ownedPlaylists,
    ownedAvatars: playerProfiles.ownedAvatars,
    premiumPurchaseCount: playerProfiles.premiumPurchaseCount,
    premiumConsecutiveMonths: playerProfiles.premiumConsecutiveMonths,
    tutorialCompletedCount: playerProfiles.tutorialCompletedCount,
    dailyQuestsCompleted: playerProfiles.dailyQuestsCompleted,
  }).from(playerProfiles).where(eq(playerProfiles.id, profileId)).limit(1);

  if (!profile) return { profileId, recalculated: [], newlyUnlocked: [] };

  const recalculated: string[] = [];
  const newlyUnlocked: string[] = [];

  // Helper: set progress and track result (only moves forward, never backward)
  async function setProgress(key: string, value: number) {
    const def = ACHIEVEMENT_MAP[key];
    if (!def) return;
    const [existing] = await db!.select().from(userAchievements)
      .where(and(eq(userAchievements.profileId, profileId), eq(userAchievements.achievementKey, key)))
      .limit(1);
    if (existing?.unlocked) return; // already done, skip
    const newProgress = Math.min(value, def.maxProgress);
    const justUnlocked = newProgress >= def.maxProgress;
    if (!existing) {
      if (newProgress > 0) {
        await db!.insert(userAchievements).values({
          profileId,
          achievementKey: key,
          progress: newProgress,
          unlocked: justUnlocked,
          unlockedAt: justUnlocked ? new Date() : undefined,
        });
        recalculated.push(key);
        if (justUnlocked) newlyUnlocked.push(key);
      }
    } else if (newProgress > existing.progress) {
      await db!.update(userAchievements)
        .set({
          progress: newProgress,
          unlocked: justUnlocked,
          unlockedAt: justUnlocked && !existing.unlockedAt ? new Date() : existing.unlockedAt,
        })
        .where(eq(userAchievements.id, existing.id));
      recalculated.push(key);
      if (justUnlocked) newlyUnlocked.push(key);
    }
  }

  // 1. Games played achievements
  const gp = profile.gamesPlayed ?? 0;
  await setProgress('first_game', Math.min(gp, 1));
  await setProgress('steppe_student', Math.min(gp, 10));
  await setProgress('steppe_debut', Math.min(gp, 50));
  await setProgress('steppe_warrior', Math.min(gp, 100));

  // 2. Rating achievement
  const rating = profile.rating ?? 0;
  if (rating > 0) await setProgress('golden_start', Math.min(rating, 1200));

  // 3. Shanyrak millionaire
  const shanyrak = profile.balanceShanyrak ?? 0;
  if (shanyrak >= 1000000) await setProgress('first_millionaire', 1000000);

  // 4. Bot game achievements
  const botGames = profile.botGamesPlayed ?? 0;
  await setProgress('bot_lover', Math.min(botGames, 10));
  await setProgress('bot_terror', Math.min(botGames, 25));
  await setProgress('programmer', Math.min(botGames, 50));
  await setProgress('bot_hater', Math.min(botGames, 100));

  // 5. Collector achievements
  const CLASSIC_AVATAR_IDS = ['wolf', 'eagle', 'bear', 'fox', 'snow-leopard', 'bot'];
  const frames = JSON.parse(profile.ownedFrames ?? '[]') as string[];
  const decks = JSON.parse(profile.ownedDecks ?? '[]') as string[];
  const playlists = JSON.parse(profile.ownedPlaylists ?? '[]') as number[];
  const avatars = JSON.parse(profile.ownedAvatars ?? '[]') as string[];
  const nonClassicAvatars = avatars.filter((id: string) => !CLASSIC_AVATAR_IDS.includes(id));
  await setProgress('fashionista', Math.min(frames.length, 3));
  await setProgress('croupier', Math.min(decks.length, 3));
  await setProgress('meloman', Math.min(playlists.length, 3));
  await setProgress('many_faces', Math.min(nonClassicAvatars.length, 5));

  // 6. Donator achievement (from tenge transactions)
  const [tengeRow] = await db.select({
    total: sql<number>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
  }).from(transactions).where(and(
    eq(transactions.profileId, profileId),
    sql`${transactions.currency} = 'tenge'`,
    sql`${transactions.amount} < 0`,
    sql`${transactions.type} IN ('shop_purchase', 'premium_purchase')`,
  ));
  const totalTengeSpent = Number(tengeRow?.total ?? 0);
  if (totalTengeSpent > 0) await setProgress('donator', Math.min(totalTengeSpent, 100));

  // 7. Premium achievements
  const premiumCount = profile.premiumPurchaseCount ?? 0;
  const premiumStreak = profile.premiumConsecutiveMonths ?? 0;
  if (premiumCount >= 1) await setProgress('premium_player', 1);
  await setProgress('legendary_player', Math.min(premiumStreak, 2));
  await setProgress('admin_pryanik', Math.min(premiumStreak, 3));
  await setProgress('kazakhstan_pride', Math.min(premiumStreak, 6));
  await setProgress('elbasy', Math.min(premiumCount, 10));

  // 8. Tutorial achievements
  const tutorialCount = profile.tutorialCompletedCount ?? 0;
  await setProgress('tutorial_student', Math.min(tutorialCount, 1));
  await setProgress('tutorial_honor', Math.min(tutorialCount, 2));
  await setProgress('tutorial_grind', Math.min(tutorialCount, 5));

  // 9. Daily quest achievements
  const dailyCompleted = profile.dailyQuestsCompleted ?? 0;
  await setProgress('daily_diary', Math.min(dailyCompleted, 30));
  await setProgress('daily_calendar', Math.min(dailyCompleted, 60));
  await setProgress('daily_regular', Math.min(dailyCompleted, 120));

  // 10. Referral achievements
  const [refCountRow] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(referrals).where(eq(referrals.referrerId, profileId));
  const totalReferrals = Number(refCountRow?.count ?? 0);
  await setProgress('referral_1', Math.min(totalReferrals, 1));
  await setProgress('referral_5', Math.min(totalReferrals, 5));
  await setProgress('referral_15', Math.min(totalReferrals, 15));
  await setProgress('referral_50', Math.min(totalReferrals, 50));

  // 11. Season rank achievements (from seasonRewards table)
  const seasonRewardRows = await db.select({ rankKey: seasonRewards.rankKey })
    .from(seasonRewards).where(eq(seasonRewards.profileId, profileId));
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
  for (const row of seasonRewardRows) {
    const achKey = rankAchievementMap[row.rankKey];
    if (achKey) await setProgress(achKey, 1);
  }

  // 12. Leaderboard achievements (check current position in top-3)
  const leaderboard = await db.select({ id: playerProfiles.id })
    .from(playerProfiles).orderBy(desc(playerProfiles.rating)).limit(3);
  const position = leaderboard.findIndex((p: { id: number }) => p.id === profileId) + 1;
  if (position === 1) await setProgress('leaderboard_1', 1);
  else if (position === 2) await setProgress('leaderboard_2', 1);
  else if (position === 3) await setProgress('leaderboard_3', 1);

  // 13. first_shanyrak — if any achievement was just unlocked
  if (newlyUnlocked.length > 0) {
    await setProgress('first_shanyrak', 1);
  }

  // 14. Achievement count achievements (after all others)
  const allAchievements = await db.select({ unlocked: userAchievements.unlocked })
    .from(userAchievements).where(eq(userAchievements.profileId, profileId));
  const unlockedCount = allAchievements.filter((a: { unlocked: boolean }) => a.unlocked).length;
  await setProgress('achievement_lover', Math.min(unlockedCount, 10));
  await setProgress('achievement_expert', Math.min(unlockedCount, 20));
  await setProgress('achievement_master', Math.min(unlockedCount, 30));
  await setProgress('achievement_achiever', Math.min(unlockedCount, 50));

  return { profileId, recalculated, newlyUnlocked };
}

/**
 * Retroactively recalculate all static-data achievements for ALL players.
 * Processes players in batches of 20 to avoid memory/DB overload.
 * Returns a summary of what was done.
 */
export async function retroactiveRecalcAllAchievements(): Promise<{
  totalPlayers: number;
  processedPlayers: number;
  totalRecalculated: number;
  totalNewlyUnlocked: number;
  errors: number;
}> {
  const db = await getDb();
  if (!db) return { totalPlayers: 0, processedPlayers: 0, totalRecalculated: 0, totalNewlyUnlocked: 0, errors: 0 };

  // Get all player IDs
  const allProfiles = await db.select({ id: playerProfiles.id }).from(playerProfiles);
  const totalPlayers = allProfiles.length;
  let processedPlayers = 0;
  let totalRecalculated = 0;
  let totalNewlyUnlocked = 0;
  let errors = 0;

  // Process in batches of 20 to avoid overwhelming the DB
  const BATCH_SIZE = 20;
  for (let i = 0; i < allProfiles.length; i += BATCH_SIZE) {
    const batch = allProfiles.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map((p: { id: number }) => retroactiveRecalcForProfile(p.id))
    );
    for (const result of results) {
      if (result.status === 'fulfilled') {
        totalRecalculated += result.value.recalculated.length;
        totalNewlyUnlocked += result.value.newlyUnlocked.length;
        processedPlayers++;
      } else {
        errors++;
      }
    }
  }

  return { totalPlayers, processedPlayers, totalRecalculated, totalNewlyUnlocked, errors };
}
