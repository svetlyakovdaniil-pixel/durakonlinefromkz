import { eq, and, or, like, sql, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import { InsertUser, users, playerProfiles, friendships, gameHistory, notifications, transactions, adminAuditLog, massNotifications, shopPriceOverrides, playerComplaints, InsertPlayerComplaint, musicPlaylists, userCredentials, InsertUserCredential, contactMessages, InsertContactMessage, iapTransactions, userAchievements, avatarOffsets, AvatarOffset, seasonTestState, SeasonTestState, seasonRewards, userDailyQuests, seasonRatings } from "../drizzle/schema";
import { ACHIEVEMENTS, ACHIEVEMENT_MAP } from '../shared/achievements';
import { ENV } from './_core/env';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _db: any | null = null;
let _pool: mysql.Pool | null = null;

// Lazily create the drizzle instance with a connection pool so local tooling can run without a DB.
// Using a pool (not a single connection) prevents ECONNRESET errors when the DB closes idle connections.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _pool = mysql.createPool({
        uri: process.env.DATABASE_URL,
        waitForConnections: true,
        connectionLimit: 10,
        queueLimit: 0,
        enableKeepAlive: true,
        keepAliveInitialDelay: 30000,
      });
      _db = drizzle(_pool);
      console.log("[Database] Connection pool created");
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
      _pool = null;
    }
  }
  return _db;
}

// ============================================================
// USER helpers
// ============================================================

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ============================================================
// PLAYER PROFILE helpers
// ============================================================

/**
 * Get or create a player profile for a user.
 * On first call, assigns a unique sequential gameId (1, 2, 3...).
 */
export async function getOrCreateProfile(userId: number, displayName?: string | null) {
  const db = await getDb();
  if (!db) return null;

  // Check if profile already exists
  const existing = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  if (existing.length > 0) return existing[0];

  // Compute next gameId atomically
  const [maxRow] = await db.select({ maxId: sql<number>`COALESCE(MAX(${playerProfiles.gameId}), 0)` }).from(playerProfiles);
  const nextGameId = (maxRow?.maxId ?? 0) + 1;

  await db.insert(playerProfiles).values({
    userId,
    gameId: nextGameId,
    displayName: displayName ?? null,
    rating: 1000,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
    balanceTenge: 25,
    balanceShanyrak: 5000,
  });

  const [created] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  return created ?? null;
}

export async function getProfileByUserId(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  return row ?? null;
}

export async function getProfileByGameId(gameId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(playerProfiles).where(eq(playerProfiles.gameId, gameId)).limit(1);
  return row ?? null;
}

export async function updateProfileDisplayName(userId: number, displayName: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(playerProfiles).set({ displayName }).where(eq(playerProfiles.userId, userId));
}

export async function updateProfileAvatar(userId: number, avatarId: string) {
  const db = await getDb();
  if (!db) return;
  await db.update(playerProfiles).set({ avatarId }).where(eq(playerProfiles.userId, userId));
}

// ============================================================
// FRIENDS helpers
// ============================================================

/**
 * Send a friend request from senderProfileId to receiverProfileId.
 * Returns 'sent' | 'already_friends' | 'already_pending' | 'not_found'
 */
export async function sendFriendRequest(senderProfileId: number, receiverProfileId: number): Promise<{ result: string; friendshipId?: number }> {
  const db = await getDb();
  if (!db) return { result: 'not_found' };

  if (senderProfileId === receiverProfileId) return { result: 'not_found' };

  // Check if friendship already exists in either direction
  const existing = await db.select().from(friendships).where(
    or(
      and(eq(friendships.senderId, senderProfileId), eq(friendships.receiverId, receiverProfileId)),
      and(eq(friendships.senderId, receiverProfileId), eq(friendships.receiverId, senderProfileId))
    )
  ).limit(1);

  if (existing.length > 0) {
    if (existing[0].status === 'accepted') return { result: 'already_friends' };
    if (existing[0].status === 'pending') return { result: 'already_pending' };
    // If rejected, allow re-sending by updating
    await db.update(friendships).set({ status: 'pending', senderId: senderProfileId, receiverId: receiverProfileId }).where(eq(friendships.id, existing[0].id));
    return { result: 'sent', friendshipId: existing[0].id };
  }

  const [inserted] = await db.insert(friendships).values({
    senderId: senderProfileId,
    receiverId: receiverProfileId,
    status: 'pending',
  }).$returningId();

  return { result: 'sent', friendshipId: inserted?.id };
}

/**
 * Accept a friend request.
 */
export async function acceptFriendRequest(friendshipId: number, receiverProfileId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const result = await db.update(friendships).set({ status: 'accepted' }).where(
    and(eq(friendships.id, friendshipId), eq(friendships.receiverId, receiverProfileId), eq(friendships.status, 'pending'))
  );

  return true;
}

/**
 * Reject a friend request.
 */
export async function rejectFriendRequest(friendshipId: number, receiverProfileId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.update(friendships).set({ status: 'rejected' }).where(
    and(eq(friendships.id, friendshipId), eq(friendships.receiverId, receiverProfileId), eq(friendships.status, 'pending'))
  );

  return true;
}

/**
 * Remove a friend (delete the friendship record).
 */
export async function removeFriend(profileId: number, friendProfileId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.delete(friendships).where(
    or(
      and(eq(friendships.senderId, profileId), eq(friendships.receiverId, friendProfileId)),
      and(eq(friendships.senderId, friendProfileId), eq(friendships.receiverId, profileId))
    )
  );

  return true;
}

/**
 * Get all accepted friends for a profile.
 */
export async function getFriends(profileId: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select().from(friendships).where(
    and(
      eq(friendships.status, 'accepted'),
      or(eq(friendships.senderId, profileId), eq(friendships.receiverId, profileId))
    )
  );

  // Get the friend profile IDs
  const friendProfileIds = rows.map(r => r.senderId === profileId ? r.receiverId : r.senderId);
  if (friendProfileIds.length === 0) return [];

  // Fetch friend profiles
  const profiles = await db.select().from(playerProfiles).where(
    sql`${playerProfiles.id} IN (${sql.join(friendProfileIds.map(id => sql`${id}`), sql`, `)})`
  );

  return profiles.map(p => ({
    friendshipId: rows.find(r => r.senderId === p.id || r.receiverId === p.id)?.id ?? 0,
    profileId: p.id,
    gameId: p.gameId,
    displayName: p.displayName,
    rating: p.rating,
  }));
}

/**
 * Get pending friend requests received by a profile.
 */
export async function getPendingRequests(profileId: number) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select().from(friendships).where(
    and(eq(friendships.receiverId, profileId), eq(friendships.status, 'pending'))
  );

  if (rows.length === 0) return [];

  const senderIds = rows.map(r => r.senderId);
  const profiles = await db.select().from(playerProfiles).where(
    sql`${playerProfiles.id} IN (${sql.join(senderIds.map(id => sql`${id}`), sql`, `)})`
  );

  return rows.map(r => {
    const sender = profiles.find(p => p.id === r.senderId);
    return {
      friendshipId: r.id,
      senderProfileId: r.senderId,
      senderGameId: sender?.gameId ?? 0,
      senderName: sender?.displayName ?? 'Unknown',
      createdAt: r.createdAt,
    };
  });
}

// ============================================================
// GAME STATS helpers
// ============================================================

/**
 * Record a completed game and update player stats + ratings.
 */
export async function recordGameResult(data: {
  roomId: string;
  playerCount: number;
  winnerProfileId: number | null;
  loserProfileId: number | null;
  allPlayerProfileIds: number[];
  durationSeconds: number;
  hasBots?: boolean;
  botCount?: number;
  totalPlayersInRoom?: number;
  premiumGameIds?: number[]; // gameIds of premium players in this room
}) {
  const db = await getDb();
  if (!db) return;

  const hasBots = data.hasBots ?? false;
  const botCount = data.botCount ?? 0;
  const totalPlayersInRoom = data.totalPlayersInRoom ?? data.playerCount;

  // Determine if this counts as a "bot game" for stats/rating purposes
  // Rule: if bots make up more than 33.4% of total players, it's a bot game
  const botRatio = totalPlayersInRoom > 0 ? botCount / totalPlayersInRoom : 0;
  const isBotGame = botRatio > 0.334;

  // Insert game history
  await db.insert(gameHistory).values({
    roomId: data.roomId,
    playerCount: data.playerCount,
    winnerId: data.winnerProfileId,
    loserId: data.loserProfileId,
    playersJson: JSON.stringify(data.allPlayerProfileIds),
    durationSeconds: data.durationSeconds,
    hasBots,
    botCount,
    totalPlayersInRoom,
  });

  // === HUMAN rating table (<=33.4% bots) ===
  // Last place (дурак) always gets -25
  const humanRatingByPlace: Record<number, number[]> = {
    2: [25, -25],
    3: [25, 15, -25],
    4: [25, 20, 15, -25],
    5: [25, 20, 15, 10, -25],
    6: [25, 20, 15, 10, 5, -25],
    7: [25, 20, 15, 10, 5, 0, -25],
    8: [25, 20, 15, 10, 5, 0, 0, -25],
  };

  // === BOT rating table (>33.4% bots) ===
  // Mapping: +25→+10, +20→+5, +15→0, +10→-5, +5→-10, 0→-10, -25→-10
  const botRatingByPlace: Record<number, number[]> = {
    2: [10, -10],
    3: [10, 0, -10],
    4: [10, 5, 0, -10],
    5: [10, 5, 0, -5, -10],
    6: [10, 5, 0, -5, -10, -10],
    7: [10, 5, 0, -5, -10, -10, -10],
    8: [10, 5, 0, -5, -10, -10, -10, -10],
  };

  // Select the appropriate rating table
  const ratingByPlace = isBotGame ? botRatingByPlace : humanRatingByPlace;
  const ratingTable = ratingByPlace[data.playerCount] || ratingByPlace[2];

  // Premium bonus logic:
  // - Premium player themselves: +100% to their own ratingChange (only positive changes)
  // - Other players at the table: +50% if at least one premium player is present (capped at +50% regardless of count)
  const premiumGameIds = new Set(data.premiumGameIds ?? []);
  const hasPremiumAtTable = premiumGameIds.size > 0;

  // Update stats for all participants
  // NOTE: allPlayerProfileIds actually contains gameId values (not profileId/id)
  // because playerGameIds map stores odId -> gameId

  // First pass: compute all ratingChanges and collect profileIds for ratingChangesJson
  const ratingChangesMap: Record<number, number> = {}; // profileId -> ratingChange

  for (let idx = 0; idx < data.allPlayerProfileIds.length; idx++) {
    const gameId = data.allPlayerProfileIds[idx];
    const isLoser = gameId === data.loserProfileId;
    // "Win" = any place except last (loser). Only the last-place player gets a loss.
    const isWinner = !isLoser;

    // Get rating change from table (place = idx, 0-indexed)
    let ratingChange = ratingTable[idx] ?? ratingTable[ratingTable.length - 1];

    // Apply premium bonuses (only for positive rating changes)
    if (ratingChange > 0) {
      const isOwnPremium = premiumGameIds.has(gameId);
      if (isOwnPremium) {
        // +100% to own rating
        ratingChange = Math.round(ratingChange * 2);
      } else if (hasPremiumAtTable) {
        // +50% from another premium player at the table
        ratingChange = Math.round(ratingChange * 1.5);
      }
    }

    // Look up the actual profileId (playerProfiles.id) from gameId
    const [profileRow] = await db.select({ id: playerProfiles.id })
      .from(playerProfiles)
      .where(eq(playerProfiles.gameId, gameId))
      .limit(1);
    if (profileRow) {
      ratingChangesMap[profileRow.id] = ratingChange;
      // Apply season rating change only for human games (<=33.4% bots)
      // Bot games do NOT count towards seasonal rating
      if (!isBotGame) {
        const baseRatingChange = ratingTable[idx] ?? ratingTable[ratingTable.length - 1];
        try {
          const { applySeasonRatingChange } = await import('./db.season');
          await applySeasonRatingChange(profileRow.id, baseRatingChange, isWinner, isLoser);
        } catch (e) {
          console.error('[Season] Failed to apply season rating change:', e);
        }
      }
    }

    if (isBotGame) {
      // Bot games (>33.4% bots): update bot stats + bot rating
      await db.update(playerProfiles).set({
        botGamesPlayed: sql`${playerProfiles.botGamesPlayed} + 1`,
        botWins: isWinner ? sql`${playerProfiles.botWins} + 1` : sql`${playerProfiles.botWins}`,
        botLosses: isLoser ? sql`${playerProfiles.botLosses} + 1` : sql`${playerProfiles.botLosses}`,
        rating: sql`GREATEST(0, ${playerProfiles.rating} + ${ratingChange})`,
      }).where(eq(playerProfiles.gameId, gameId));
      // Trigger bot game achievements
      try {
        const [updatedProfile] = await db.select({ id: playerProfiles.id, botGamesPlayed: playerProfiles.botGamesPlayed })
          .from(playerProfiles).where(eq(playerProfiles.gameId, gameId)).limit(1);
        if (updatedProfile) {
          const { processBotGameAchievements } = await import('./achievementsTriggers');
          processBotGameAchievements(updatedProfile.id, (updatedProfile.botGamesPlayed ?? 0) + 1).catch(() => {});
        }
      } catch (e) { /* non-blocking */ }
    } else {
      // Human games (<=33.4% bots): update human stats + human rating
      await db.update(playerProfiles).set({
        gamesPlayed: sql`${playerProfiles.gamesPlayed} + 1`,
        wins: isWinner ? sql`${playerProfiles.wins} + 1` : sql`${playerProfiles.wins}`,
        losses: isLoser ? sql`${playerProfiles.losses} + 1` : sql`${playerProfiles.losses}`,
        rating: sql`GREATEST(0, ${playerProfiles.rating} + ${ratingChange})`,
      }).where(eq(playerProfiles.gameId, gameId));
      // Trigger rating_gained daily quest (only for positive rating changes in human games)
      if (ratingChange > 0 && profileRow) {
        try {
          const { incrementDailyQuestProgress } = await import('./dailyQuestsDb');
          await incrementDailyQuestProgress(profileRow.id, 'rating_gained', ratingChange);
        } catch (e) { /* non-blocking */ }
      }
    }
  }

  // Update game history record with actual rating changes
  if (Object.keys(ratingChangesMap).length > 0) {
    await db.update(gameHistory)
      .set({ ratingChangesJson: JSON.stringify(ratingChangesMap) })
      .where(eq(gameHistory.roomId, data.roomId));
  }
}

/**
 * Record a forfeit (leave game) as a loss for the player.
 * Called immediately when a player leaves mid-game.
 * @param gameId - The player's gameId (from playerProfiles)
 * @param isBotGame - Whether this counts as a bot game (>33.4% bots)
 */
export async function recordForfeitLoss(gameId: number, isBotGame: boolean) {
  const db = await getDb();
  if (!db) return;

  if (isBotGame) {
    // Bot game: update bot stats + rating penalty (-10 for bot game loser)
    await db.update(playerProfiles).set({
      botGamesPlayed: sql`${playerProfiles.botGamesPlayed} + 1`,
      botLosses: sql`${playerProfiles.botLosses} + 1`,
      rating: sql`GREATEST(0, ${playerProfiles.rating} - 10)`,
    }).where(eq(playerProfiles.gameId, gameId));
  } else {
    // Human game: update human stats + rating penalty (-25 for loss)
    await db.update(playerProfiles).set({
      gamesPlayed: sql`${playerProfiles.gamesPlayed} + 1`,
      losses: sql`${playerProfiles.losses} + 1`,
      rating: sql`GREATEST(0, ${playerProfiles.rating} - 25)`,
    }).where(eq(playerProfiles.gameId, gameId));
  }
}

/**
 * Get top players by rating.
 */
export async function getLeaderboard(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    id: playerProfiles.id,
    gameId: playerProfiles.gameId,
    displayName: playerProfiles.displayName,
    rating: playerProfiles.rating,
    gamesPlayed: playerProfiles.gamesPlayed,
    wins: playerProfiles.wins,
    losses: playerProfiles.losses,
  }).from(playerProfiles).orderBy(desc(playerProfiles.rating)).limit(limit);
}

/**
 * Get top players by wins (human games only, <33.4% bots).
 * Returns wins, losses, gamesPlayed, and winrate.
 */
export async function getWinsLeaderboard(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select({
    gameId: playerProfiles.gameId,
    displayName: playerProfiles.displayName,
    gamesPlayed: playerProfiles.gamesPlayed,
    wins: playerProfiles.wins,
    losses: playerProfiles.losses,
  }).from(playerProfiles)
    .where(sql`${playerProfiles.gamesPlayed} > 0`)
    .orderBy(desc(playerProfiles.wins), desc(playerProfiles.gamesPlayed))
    .limit(limit);

  return rows.map(r => ({
    ...r,
    winrate: r.gamesPlayed > 0 ? Math.round((r.wins / r.gamesPlayed) * 100) : 0,
  }));
}

/**
 * Get top players by shanyrak balance.
 */
export async function getShanyraqLeaderboard(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    gameId: playerProfiles.gameId,
    displayName: playerProfiles.displayName,
    balanceShanyrak: playerProfiles.balanceShanyrak,
    rating: playerProfiles.rating,
  }).from(playerProfiles)
    .where(sql`${playerProfiles.balanceShanyrak} > 0`)
    .orderBy(desc(playerProfiles.balanceShanyrak))
    .limit(limit);
}

/**
 * Get recent game history for a player with place and rating delta.
 */
export async function getPlayerGameHistory(profileId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  // playersJson stores gameId values, not profileId.
  // First, look up the gameId for this profileId.
  const [profileRow] = await db.select({ gameId: playerProfiles.gameId })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);
  const playerGameId = profileRow?.gameId ?? -1;

  const records = await db.select().from(gameHistory).where(
    sql`JSON_CONTAINS(${gameHistory.playersJson}, CAST(${playerGameId} AS JSON))`
  ).orderBy(desc(gameHistory.createdAt)).limit(limit);

  // Enrich each record with place and rating delta
  return records.map(record => {
    // playerIds contains gameId values (sorted by finish place)
    const playerIds = JSON.parse(record.playersJson || '[]') as number[];
    const place = playerIds.indexOf(playerGameId) + 1;
    // loserId in gameHistory stores gameId value
    const isLoser = playerGameId === record.loserId;

    // Use 33.4% bot threshold to determine which table to use
    const botRatio = record.totalPlayersInRoom > 0 ? record.botCount / record.totalPlayersInRoom : 0;
    const isBotGame = botRatio > 0.334;

    // Prefer stored ratingChangesJson (includes premium bonuses) over recalculation
    let ratingDelta: number;
    if (record.ratingChangesJson) {
      const changesMap = JSON.parse(record.ratingChangesJson) as Record<string, number>;
      ratingDelta = changesMap[String(profileId)] ?? 0;
    } else {
      // Fallback: recalculate from table (no premium bonus info available for old records)
      const humanRatingByPlace: Record<number, number[]> = {
        2: [25, -25],
        3: [25, 15, -25],
        4: [25, 20, 15, -25],
        5: [25, 20, 15, 10, -25],
        6: [25, 20, 15, 10, 5, -25],
        7: [25, 20, 15, 10, 5, 0, -25],
        8: [25, 20, 15, 10, 5, 0, 0, -25],
      };
      const botRatingByPlace: Record<number, number[]> = {
        2: [10, -10],
        3: [10, 0, -10],
        4: [10, 5, 0, -10],
        5: [10, 5, 0, -5, -10],
        6: [10, 5, 0, -5, -10, -10],
        7: [10, 5, 0, -5, -10, -10, -10],
        8: [10, 5, 0, -5, -10, -10, -10, -10],
      };
      const ratingByPlace = isBotGame ? botRatingByPlace : humanRatingByPlace;
      const ratingTable = ratingByPlace[record.playerCount] || ratingByPlace[2];
      ratingDelta = ratingTable[place - 1] ?? ratingTable[ratingTable.length - 1];
    }

    return {
      ...record,
      place,
      ratingDelta,
      isLoser,
      isBotGame,
    };
  });
}

// ============================================================
// NOTIFICATION helpers
// ============================================================

/**
 * Create a notification for a player.
 */
export async function createNotification(profileId: number, type: 'friend_request' | 'friend_accepted' | 'balance_topup' | 'cooldown_expired' | 'admin_announcement' | 'account_banned', data: Record<string, unknown>) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(notifications).values({
    profileId,
    type,
    data: JSON.stringify(data),
    isRead: false,
  }).$returningId();

  return result?.id ?? null;
}

/**
 * Get notifications for a player (newest first).
 */
export async function getNotifications(profileId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(notifications)
    .where(eq(notifications.profileId, profileId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}

/**
 * Count unread notifications for a player.
 */
export async function getUnreadNotificationCount(profileId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const [row] = await db.select({ count: sql<number>`COUNT(*)` }).from(notifications)
    .where(and(eq(notifications.profileId, profileId), eq(notifications.isRead, false)));

  return row?.count ?? 0;
}

/**
 * Mark all notifications as read for a player.
 */
export async function markNotificationsRead(profileId: number) {
  const db = await getDb();
  if (!db) return;

  await db.update(notifications).set({ isRead: true })
    .where(and(eq(notifications.profileId, profileId), eq(notifications.isRead, false)));
}

/**
 * Delete a specific notification.
 */
export async function deleteNotification(notificationId: number, profileId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(notifications).where(
    and(eq(notifications.id, notificationId), eq(notifications.profileId, profileId))
  );
  return true;
}

/**
 * Delete all notifications for a profile.
 */
export async function deleteAllNotifications(profileId: number) {
  const db = await getDb();
  if (!db) return false;

  await db.delete(notifications).where(eq(notifications.profileId, profileId));
  return true;
}

/**
 * Get a friendship record by ID.
 */
export async function getFriendshipById(friendshipId: number) {
  const db = await getDb();
  if (!db) return null;
  const [row] = await db.select().from(friendships).where(eq(friendships.id, friendshipId)).limit(1);
  return row ?? null;
}

// ============================================================
// BALANCE helpers
// ============================================================

/**
 * Free top-up: set shanyrak balance to 2000 if below, with 12h cooldown.
 * Returns { success, added, newBalance, cooldownUntil } or { success: false, reason }
 */
export async function freeShanyrakTopup(userId: number): Promise<{
  success: boolean;
  added?: number;
  newBalance?: number;
  cooldownUntil?: Date;
  reason?: string;
}> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'db_unavailable' };

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  if (!profile) return { success: false, reason: 'not_found' };

  // Check 12h cooldown using server time
  const now = new Date();
  if (profile.lastFreeTopup) {
    const cooldownEnd = new Date(profile.lastFreeTopup.getTime() + 12 * 60 * 60 * 1000);
    if (now < cooldownEnd) {
      return { success: false, reason: 'cooldown', cooldownUntil: cooldownEnd };
    }
  }

  // Give +2000 shanyraks regardless of current balance
  const added = 2000;
  const newBalance = profile.balanceShanyrak + 2000;

  await db.update(playerProfiles).set({
    balanceShanyrak: newBalance,
    lastFreeTopup: now,
  }).where(eq(playerProfiles.userId, userId));

  return { success: true, added, newBalance };
}

/**
 * Buy shanyrak with tenge. Returns { success, newShanyrak, newTenge } or { success: false, reason }
 */
export async function buyShanyrakWithTenge(
  userId: number,
  shanyrakAmount: number,
  tengeCost: number
): Promise<{
  success: boolean;
  newShanyrak?: number;
  newTenge?: number;
  reason?: string;
}> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'db_unavailable' };

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  if (!profile) return { success: false, reason: 'not_found' };

  if (profile.balanceTenge < tengeCost) {
    return { success: false, reason: 'insufficient_tenge' };
  }

  const newTenge = profile.balanceTenge - tengeCost;
  const newShanyrak = profile.balanceShanyrak + shanyrakAmount;

  await db.update(playerProfiles).set({
    balanceTenge: newTenge,
    balanceShanyrak: newShanyrak,
  }).where(eq(playerProfiles.userId, userId));

  return { success: true, newShanyrak, newTenge };
}

/**
 * Get the free topup cooldown status for a player.
 */
export async function getFreeTopupStatus(userId: number): Promise<{
  available: boolean;
  cooldownUntil?: Date;
  currentBalance: number;
}> {
  const db = await getDb();
  if (!db) return { available: false, currentBalance: 0 };

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  if (!profile) return { available: false, currentBalance: 0 };

  const now = new Date();
  if (profile.lastFreeTopup) {
    const cooldownEnd = new Date(profile.lastFreeTopup.getTime() + 12 * 60 * 60 * 1000);
    if (now < cooldownEnd) {
      return { available: false, cooldownUntil: cooldownEnd, currentBalance: profile.balanceShanyrak };
    }
  }

  return { available: true, currentBalance: profile.balanceShanyrak };
}

// ============================================================
// TRANSACTION helpers
// ============================================================

/**
 * Record a transaction in the history.
 */
export async function recordTransaction(data: {
  profileId: number;
  type: 'free_topup' | 'buy_shanyrak' | 'buy_tenge' | 'game_reward' | 'game_entry' | 'shop_purchase' | 'tutorial_reward';
  amount: number;
  currency: 'tenge' | 'shanyrak';
  description: string;
  balanceAfter: number;
}) {
  const db = await getDb();
  if (!db) return null;

  const [result] = await db.insert(transactions).values({
    profileId: data.profileId,
    type: data.type,
    amount: data.amount,
    currency: data.currency,
    description: data.description,
    balanceAfter: data.balanceAfter,
  }).$returningId();

  return result?.id ?? null;
}

/**
 * Get transaction history for a player (newest first).
 * Only the player themselves should call this.
 */
export async function getMyTransactions(profileId: number, limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(transactions)
    .where(eq(transactions.profileId, profileId))
    .orderBy(desc(transactions.createdAt))
    .limit(limit);
}

// ============================================================
// SHOP / DECK OWNERSHIP helpers
// ============================================================

/**
 * Get owned deck IDs for a player profile.
 */
export async function getOwnedDecks(profileId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const [profile] = await db.select({ ownedDecks: playerProfiles.ownedDecks })
    .from(playerProfiles).where(eq(playerProfiles.id, profileId)).limit(1);
  if (!profile || !profile.ownedDecks) return [];
  try {
    return JSON.parse(profile.ownedDecks) as string[];
  } catch {
    return [];
  }
}

/**
 * Purchase a deck for a player. Deducts tenge and adds deck to ownedDecks.
 * Returns { success, newTenge } or { success: false, reason }.
 */
export async function purchaseDeck(
  userId: number,
  deckId: string,
  tengeCost: number
): Promise<{ success: boolean; newTenge?: number; reason?: string }> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'db_unavailable' };

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  if (!profile) return { success: false, reason: 'not_found' };

  // Check if already owned
  const owned: string[] = profile.ownedDecks ? JSON.parse(profile.ownedDecks) : [];
  if (owned.includes(deckId)) {
    return { success: false, reason: 'already_owned' };
  }

  // Check balance
  if (profile.balanceTenge < tengeCost) {
    return { success: false, reason: 'insufficient_tenge' };
  }

  // Deduct and add deck
  const newTenge = profile.balanceTenge - tengeCost;
  owned.push(deckId);

  await db.update(playerProfiles).set({
    balanceTenge: newTenge,
    ownedDecks: JSON.stringify(owned),
  }).where(eq(playerProfiles.id, profile.id));

  // Record transaction
  await recordTransaction({
    profileId: profile.id,
    type: 'shop_purchase',
    amount: -tengeCost,
    currency: 'tenge',
    description: `Покупка колоды: ${deckId}`,
    balanceAfter: newTenge,
  });

  return { success: true, newTenge };
}

/**
 * Get owned table style IDs for a player profile.
 */
export async function getOwnedTables(profileId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const [profile] = await db.select({ ownedTables: playerProfiles.ownedTables })
    .from(playerProfiles).where(eq(playerProfiles.id, profileId)).limit(1);
  if (!profile || !profile.ownedTables) return [];
  try {
    return JSON.parse(profile.ownedTables) as string[];
  } catch {
    return [];
  }
}

/**
 * Purchase a table style for a player. Deducts tenge and adds table to ownedTables.
 */
export async function purchaseTable(
  userId: number,
  tableId: string,
  tengeCost: number
): Promise<{ success: boolean; newTenge?: number; reason?: string }> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'db_unavailable' };

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  if (!profile) return { success: false, reason: 'not_found' };

  const owned: string[] = profile.ownedTables ? JSON.parse(profile.ownedTables) : [];
  if (owned.includes(tableId)) {
    return { success: false, reason: 'already_owned' };
  }

  if (profile.balanceTenge < tengeCost) {
    return { success: false, reason: 'insufficient_tenge' };
  }

  const newTenge = profile.balanceTenge - tengeCost;
  owned.push(tableId);

  await db.update(playerProfiles).set({
    balanceTenge: newTenge,
    ownedTables: JSON.stringify(owned),
  }).where(eq(playerProfiles.id, profile.id));

  await recordTransaction({
    profileId: profile.id,
    type: 'shop_purchase',
    amount: -tengeCost,
    currency: 'tenge',
    description: `Покупка стола: ${tableId}`,
    balanceAfter: newTenge,
  });

  return { success: true, newTenge };
}

/**
 * Get player profile with friendship status relative to another player.
 */
export async function getPlayerProfileWithFriendStatus(targetGameId: number, myProfileId: number) {
  const db = await getDb();
  if (!db) return null;

  const [target] = await db.select().from(playerProfiles).where(eq(playerProfiles.gameId, targetGameId)).limit(1);
  if (!target) return null;

  // Check friendship status
  let friendStatus: 'none' | 'pending_sent' | 'pending_received' | 'friends' = 'none';
  let friendshipId: number | null = null;

  if (target.id !== myProfileId) {
    const [friendship] = await db.select().from(friendships).where(
      or(
        and(eq(friendships.senderId, myProfileId), eq(friendships.receiverId, target.id)),
        and(eq(friendships.senderId, target.id), eq(friendships.receiverId, myProfileId))
      )
    ).limit(1);

    if (friendship) {
      friendshipId = friendship.id;
      if (friendship.status === 'accepted') {
        friendStatus = 'friends';
      } else if (friendship.status === 'pending') {
        friendStatus = friendship.senderId === myProfileId ? 'pending_sent' : 'pending_received';
      }
    }
  }

  return {
    profileId: target.id,
    gameId: target.gameId,
    displayName: target.displayName,
    avatarId: target.avatarId,
    equippedFrame: target.equippedFrame,
    rating: target.rating,
    gamesPlayed: target.gamesPlayed,
    wins: target.wins,
    losses: target.losses,
    friendStatus,
    friendshipId,
    isSelf: target.id === myProfileId,
  };
}

// ============================================================
// GAME ECONOMY helpers
// ============================================================

/**
 * Check if a player (by openId) has enough shanyraks for a bet.
 * Returns { canAfford, balance, profileId, userId } or null if not found.
 */
export async function checkShanyrakBalance(openId: string): Promise<{
  canAfford: (amount: number) => boolean;
  balance: number;
  profileId: number;
  userId: number;
} | null> {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  if (!user) return null;

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, user.id)).limit(1);
  if (!profile) return null;

  return {
    canAfford: (amount: number) => profile.balanceShanyrak >= amount,
    balance: profile.balanceShanyrak,
    profileId: profile.id,
    userId: user.id,
  };
}

/**
 * Deduct shanyraks from a player's balance for game entry.
 * Returns new balance or null on failure.
 */
export async function deductShanyrakBet(openId: string, amount: number, roomId: string): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  if (!user) return null;

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, user.id)).limit(1);
  if (!profile || profile.balanceShanyrak < amount) return null;

  const newBalance = profile.balanceShanyrak - amount;
  await db.update(playerProfiles).set({ balanceShanyrak: newBalance }).where(eq(playerProfiles.id, profile.id));

  // Record transaction
  await recordTransaction({
    profileId: profile.id,
    type: 'game_entry',
    amount: -amount,
    currency: 'shanyrak',
    description: `Ставка на игру (комната ${roomId})`,
    balanceAfter: newBalance,
  });

  return newBalance;
}

/**
 * Credit shanyraks to a player's balance as game reward.
 * Returns new balance or null on failure.
 */
export async function creditShanyrakPrize(openId: string, amount: number, roomId: string, place: number): Promise<number | null> {
  const db = await getDb();
  if (!db) return null;

  const [user] = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  if (!user) return null;

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, user.id)).limit(1);
  if (!profile) return null;

  const newBalance = profile.balanceShanyrak + amount;
  await db.update(playerProfiles).set({ balanceShanyrak: newBalance }).where(eq(playerProfiles.id, profile.id));

  // Record transaction
  await recordTransaction({
    profileId: profile.id,
    type: 'game_reward',
    amount,
    currency: 'shanyrak',
    description: `Награда за ${place}-е место (комната ${roomId})`,
    balanceAfter: newBalance,
  });
  // Trigger shanyrak_won_today daily quest
  try {
    const { incrementDailyQuestProgress } = await import('./dailyQuestsDb');
    await incrementDailyQuestProgress(profile.id, 'shanyrak_won_today', amount);
  } catch (e) { /* non-blocking */ }
  return newBalance;
}

/**
 * [TEST] Add 10000 shanyraks to a player's balance.
 */
export async function testAddShanyrak(userId: number): Promise<{ success: boolean; newBalance?: number }> {
  const db = await getDb();
  if (!db) return { success: false };

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  if (!profile) return { success: false };

  const newBalance = profile.balanceShanyrak + 10000;
  await db.update(playerProfiles).set({ balanceShanyrak: newBalance }).where(eq(playerProfiles.id, profile.id));

  await recordTransaction({
    profileId: profile.id,
    type: 'free_topup',
    amount: 10000,
    currency: 'shanyrak',
    description: '[ТЕСТ] +10 000 шаныраков',
    balanceAfter: newBalance,
  });

  return { success: true, newBalance };
}

/**
 * [TEST] Add 10000 tenge to a player's balance.
 */
export async function testAddTenge(userId: number): Promise<{ success: boolean; newBalance?: number }> {
  const db = await getDb();
  if (!db) return { success: false };

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  if (!profile) return { success: false };

  const newBalance = profile.balanceTenge + 10000;
  await db.update(playerProfiles).set({ balanceTenge: newBalance }).where(eq(playerProfiles.id, profile.id));

  await recordTransaction({
    profileId: profile.id,
    type: 'free_topup',
    amount: 10000,
    currency: 'tenge',
    description: '[ТЕСТ] +10 000 тенге',
    balanceAfter: newBalance,
  });

  return { success: true, newBalance };
}

// ============================================================
// AVATAR FRAMES helpers
// ============================================================

/**
 * Get owned frame IDs for a player profile.
 */
export async function getOwnedFrames(profileId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const [profile] = await db.select({ ownedFrames: playerProfiles.ownedFrames })
    .from(playerProfiles).where(eq(playerProfiles.id, profileId)).limit(1);
  if (!profile || !profile.ownedFrames) return [];
  try {
    return JSON.parse(profile.ownedFrames) as string[];
  } catch {
    return [];
  }
}

/**
 * Get currently equipped frame ID for a player profile.
 */
export async function getEquippedFrame(profileId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  const [profile] = await db.select({ equippedFrame: playerProfiles.equippedFrame })
    .from(playerProfiles).where(eq(playerProfiles.id, profileId)).limit(1);
  return profile?.equippedFrame ?? null;
}

/**
 * Purchase a frame for a player. Deducts tenge and adds frame to ownedFrames.
 */
export async function purchaseFrame(
  userId: number,
  frameId: string,
  tengeCost: number
): Promise<{ success: boolean; newTenge?: number; reason?: string }> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'db_unavailable' };

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  if (!profile) return { success: false, reason: 'not_found' };

  const owned: string[] = profile.ownedFrames ? JSON.parse(profile.ownedFrames) : [];
  if (owned.includes(frameId)) {
    return { success: false, reason: 'already_owned' };
  }

  if (profile.balanceTenge < tengeCost) {
    return { success: false, reason: 'insufficient_tenge' };
  }

  const newTenge = profile.balanceTenge - tengeCost;
  owned.push(frameId);

  await db.update(playerProfiles).set({
    balanceTenge: newTenge,
    ownedFrames: JSON.stringify(owned),
  }).where(eq(playerProfiles.id, profile.id));

  await recordTransaction({
    profileId: profile.id,
    type: 'shop_purchase',
    amount: -tengeCost,
    currency: 'tenge',
    description: `Покупка рамки: ${frameId}`,
    balanceAfter: newTenge,
  });

  return { success: true, newTenge };
}

/**
 * Equip or unequip a frame for a player.
 * frameId = null means unequip.
 */
export async function equipFrame(
  userId: number,
  frameId: string | null
): Promise<{ success: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'db_unavailable' };

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  if (!profile) return { success: false, reason: 'not_found' };

  // If equipping, check ownership
  if (frameId) {
    // Premium frame is unlocked by active premium subscription, not by shop purchase
    if (frameId === 'premium') {
      const now = new Date();
      const hasPremium = profile.isPremium && profile.premiumExpiresAt && profile.premiumExpiresAt > now;
      if (!hasPremium) {
        return { success: false, reason: 'premium_required' };
      }
    } else {
      const owned: string[] = profile.ownedFrames ? JSON.parse(profile.ownedFrames) : [];
      if (!owned.includes(frameId)) {
        return { success: false, reason: 'not_owned' };
      }
    }
  }

  await db.update(playerProfiles).set({
    equippedFrame: frameId,
  }).where(eq(playerProfiles.id, profile.id));

  return { success: true };
}

/**
 * Complete tutorial for a player: mark tutorialCompleted=true and credit 2000 shanyraks.
 * Only awards once — if already completed, returns { success: false, reason: 'already_completed' }.
 */
export async function completeTutorial(userId: number): Promise<{ success: boolean; reason?: string; newBalance?: number }> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'db_error' };

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  if (!profile) return { success: false, reason: 'not_found' };

  if (profile.tutorialCompleted) {
    return { success: false, reason: 'already_completed' };
  }

  const reward = 2000;
  const newBalance = profile.balanceShanyrak + reward;

  await db.update(playerProfiles).set({
    tutorialCompleted: true,
    balanceShanyrak: newBalance,
  }).where(eq(playerProfiles.id, profile.id));

  await recordTransaction({
    profileId: profile.id,
    type: 'tutorial_reward',
    amount: reward,
    currency: 'shanyrak',
    description: 'Награда за прохождение обучения (+2000 шаныраков)',
    balanceAfter: newBalance,
  });

  return { success: true, newBalance };
}

// ============================================================
// ADMIN helpers
// ============================================================

/**
 * Admin: Get all players with search/pagination.
 */
export async function adminGetPlayers(opts: {
  search?: string;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { players: [], total: 0 };

  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;

  // Build where condition
  let whereCondition = undefined;
  if (opts.search) {
    const searchTerm = `%${opts.search}%`;
    const numericSearch = parseInt(opts.search);
    if (!isNaN(numericSearch)) {
      whereCondition = or(
        like(playerProfiles.displayName, searchTerm),
        eq(playerProfiles.gameId, numericSearch)
      );
    } else {
      whereCondition = like(playerProfiles.displayName, searchTerm);
    }
  }

  // Get total count (with filter)
  const countQuery = whereCondition
    ? db.select({ count: sql<number>`COUNT(*)` }).from(playerProfiles).where(whereCondition)
    : db.select({ count: sql<number>`COUNT(*)` }).from(playerProfiles);
  const countResult = await countQuery;
  const total = countResult[0]?.count ?? 0;

  const baseQuery = db.select({
    id: playerProfiles.id,
    userId: playerProfiles.userId,
    gameId: playerProfiles.gameId,
    displayName: playerProfiles.displayName,
    avatarId: playerProfiles.avatarId,
    equippedFrame: playerProfiles.equippedFrame,
    rating: playerProfiles.rating,
    gamesPlayed: playerProfiles.gamesPlayed,
    wins: playerProfiles.wins,
    losses: playerProfiles.losses,
    balanceTenge: playerProfiles.balanceTenge,
    balanceShanyrak: playerProfiles.balanceShanyrak,
    isBanned: playerProfiles.isBanned,
    banReason: playerProfiles.banReason,
    bannedAt: playerProfiles.bannedAt,
    tutorialCompleted: playerProfiles.tutorialCompleted,
    createdAt: playerProfiles.createdAt,
    updatedAt: playerProfiles.updatedAt,
  }).from(playerProfiles);

  const players = whereCondition
    ? await baseQuery.where(whereCondition).orderBy(desc(playerProfiles.createdAt)).limit(limit).offset(offset)
    : await baseQuery.orderBy(desc(playerProfiles.createdAt)).limit(limit).offset(offset);

  return { players, total };
}

/**
 * Admin: Update a player's balance.
 */
export async function adminUpdateBalance(
  profileId: number,
  currency: 'tenge' | 'shanyrak',
  amount: number,
  description: string
) {
  const db = await getDb();
  if (!db) return { success: false };

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.id, profileId)).limit(1);
  if (!profile) return { success: false };

  const currentBalance = currency === 'tenge' ? profile.balanceTenge : profile.balanceShanyrak;
  const newBalance = Math.max(0, currentBalance + amount);

  if (currency === 'tenge') {
    await db.update(playerProfiles).set({ balanceTenge: newBalance }).where(eq(playerProfiles.id, profileId));
  } else {
    await db.update(playerProfiles).set({ balanceShanyrak: newBalance }).where(eq(playerProfiles.id, profileId));
  }

  await recordTransaction({
    profileId,
    type: 'free_topup', // reuse type for admin adjustments
    amount,
    currency,
    description: `[Админ] ${description}`,
    balanceAfter: newBalance,
  });

  return { success: true, newBalance };
}

/**
 * Admin: Ban a player.
 */
export async function adminBanPlayer(profileId: number, reason: string) {
  const db = await getDb();
  if (!db) return { success: false };

  await db.update(playerProfiles).set({
    isBanned: true,
    banReason: reason,
    bannedAt: new Date(),
  }).where(eq(playerProfiles.id, profileId));

  return { success: true };
}

/**
 * Admin: Unban a player.
 */
export async function adminUnbanPlayer(profileId: number) {
  const db = await getDb();
  if (!db) return { success: false };

  await db.update(playerProfiles).set({
    isBanned: false,
    banReason: null,
    bannedAt: null,
  }).where(eq(playerProfiles.id, profileId));

  return { success: true };
}

/**
 * Admin: Reset a player's stats.
 */
export async function adminResetStats(profileId: number) {
  const db = await getDb();
  if (!db) return { success: false };

  await db.update(playerProfiles).set({
    rating: 1000,
    gamesPlayed: 0,
    wins: 0,
    losses: 0,
  }).where(eq(playerProfiles.id, profileId));

  return { success: true };
}

/**
 * Admin: Get all transactions with optional filters.
 */
export async function adminGetTransactions(opts: {
  profileId?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { transactions: [], total: 0 };

  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  let whereClause = undefined;
  if (opts.profileId) {
    whereClause = eq(transactions.profileId, opts.profileId);
  }

  const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(transactions);
  const total = countResult[0]?.count ?? 0;

  const rows = await db.select({
    id: transactions.id,
    profileId: transactions.profileId,
    type: transactions.type,
    amount: transactions.amount,
    currency: transactions.currency,
    description: transactions.description,
    balanceAfter: transactions.balanceAfter,
    createdAt: transactions.createdAt,
    gameId: playerProfiles.gameId,
    displayName: playerProfiles.displayName,
  }).from(transactions)
    .leftJoin(playerProfiles, eq(transactions.profileId, playerProfiles.id))
    .where(whereClause)
    .orderBy(desc(transactions.createdAt))
    .limit(limit)
    .offset(offset);

  return { transactions: rows, total };
}

/**
 * Admin: Get global stats summary.
 */
export async function adminGetGlobalStats() {
  const db = await getDb();
  if (!db) return null;

  const [playerStats] = await db.select({
    totalPlayers: sql<number>`COUNT(*)`,
    totalShanyrak: sql<number>`SUM(${playerProfiles.balanceShanyrak})`,
    totalTenge: sql<number>`SUM(${playerProfiles.balanceTenge})`,
    bannedCount: sql<number>`SUM(CASE WHEN ${playerProfiles.isBanned} = true THEN 1 ELSE 0 END)`,
    avgRating: sql<number>`AVG(${playerProfiles.rating})`,
  }).from(playerProfiles);

  const [gameStats] = await db.select({
    totalGames: sql<number>`COUNT(*)`,
  }).from(gameHistory);

  // Calculate admin deductions from transactions to subtract from circulation
  const [adminDeductions] = await db.select({
    deductedShanyrak: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.currency} = 'shanyrak' AND ${transactions.type} = 'admin_deduct' THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
    deductedTenge: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.currency} = 'tenge' AND ${transactions.type} = 'admin_deduct' THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
    addedShanyrak: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.currency} = 'shanyrak' AND ${transactions.type} = 'admin_add' THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
    addedTenge: sql<number>`COALESCE(SUM(CASE WHEN ${transactions.currency} = 'tenge' AND ${transactions.type} = 'admin_add' THEN ABS(${transactions.amount}) ELSE 0 END), 0)`,
  }).from(transactions);

  return {
    totalPlayers: playerStats?.totalPlayers ?? 0,
    totalShanyrak: playerStats?.totalShanyrak ?? 0,
    totalTenge: playerStats?.totalTenge ?? 0,
    bannedCount: playerStats?.bannedCount ?? 0,
    avgRating: Math.round(playerStats?.avgRating ?? 1000),
    totalGames: gameStats?.totalGames ?? 0,
    adminDeductedShanyrak: adminDeductions?.deductedShanyrak ?? 0,
    adminDeductedTenge: adminDeductions?.deductedTenge ?? 0,
    adminAddedShanyrak: adminDeductions?.addedShanyrak ?? 0,
    adminAddedTenge: adminDeductions?.addedTenge ?? 0,
  };
}

/**
 * Admin: Get full player detail (profile + user info including role).
 */
export async function adminGetPlayerDetail(profileId: number) {
  const db = await getDb();
  if (!db) return null;

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.id, profileId)).limit(1);
  if (!profile) return null;

  const [user] = await db.select().from(users).where(eq(users.id, profile.userId)).limit(1);

  return {
    ...profile,
    openId: user?.openId ?? null,
    email: user?.email ?? null,
    role: user?.role ?? 'user',
    lastSignedIn: user?.lastSignedIn ?? null,
    userCreatedAt: user?.createdAt ?? null,
  };
}

/**
 * Admin: Update a player's role (admin/user).
 */
export async function adminUpdateRole(profileId: number, role: 'admin' | 'user' | 'gm') {
  const db = await getDb();
  if (!db) return { success: false };

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.id, profileId)).limit(1);
  if (!profile) return { success: false };

  await db.update(users).set({ role }).where(eq(users.id, profile.userId));
  return { success: true };
}

/**
 * Admin: Get player transactions with sorting by amount.
 */
export async function adminGetPlayerTransactions(opts: {
  profileId: number;
  limit?: number;
  offset?: number;
  sortBy?: 'date' | 'amount';
  sortDir?: 'asc' | 'desc';
}) {
  const db = await getDb();
  if (!db) return { transactions: [], total: 0 };

  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;
  const sortBy = opts.sortBy ?? 'date';
  const sortDir = opts.sortDir ?? 'desc';

  const countResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(transactions)
    .where(eq(transactions.profileId, opts.profileId));
  const total = countResult[0]?.count ?? 0;

  const orderColumn = sortBy === 'amount' ? transactions.amount : transactions.createdAt;
  const orderFn = sortDir === 'asc' ? asc : desc;

  const rows = await db.select()
    .from(transactions)
    .where(eq(transactions.profileId, opts.profileId))
    .orderBy(orderFn(orderColumn))
    .limit(limit)
    .offset(offset);

  return { transactions: rows, total };
}

/**
 * Admin: Get player game history with pagination.
 */
export async function adminGetPlayerGameHistory(opts: {
  profileId: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { games: [], total: 0 };

  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;

  const whereClause = sql`JSON_CONTAINS(${gameHistory.playersJson}, CAST(${opts.profileId} AS JSON))`;

  const countResult = await db.select({ count: sql<number>`COUNT(*)` })
    .from(gameHistory)
    .where(whereClause);
  const total = countResult[0]?.count ?? 0;

  const records = await db.select()
    .from(gameHistory)
    .where(whereClause)
    .orderBy(desc(gameHistory.createdAt))
    .limit(limit)
    .offset(offset);

  // Enrich with place and rating delta
  const ratingByPlace: Record<number, number[]> = {
    2: [25, -25],
    3: [25, 15, -25],
    4: [25, 20, 15, -25],
    5: [25, 20, 15, 10, -25],
    6: [25, 20, 15, 10, 5, -25],
    7: [25, 20, 15, 10, 5, 5, -25],
    8: [25, 20, 15, 10, 5, 5, 5, -25],
  };

  const games = records.map(record => {
    const playerIds = JSON.parse(record.playersJson || '[]') as number[];
    const place = playerIds.indexOf(opts.profileId) + 1;
    const isLoser = opts.profileId === record.loserId;
    const ratingTable = ratingByPlace[record.playerCount] || ratingByPlace[2];
    const ratingDelta = ratingTable[place - 1] ?? ratingTable[ratingTable.length - 1];
    return { ...record, place, ratingDelta, isLoser };
  });

  return { games, total };
}

// ============================================================
// ADMIN AUDIT LOG helpers
// ============================================================

/**
 * Log an admin action to the audit log.
 */
export async function logAdminAction(data: {
  adminId: number;
  adminName: string | null;
  action: 'ban' | 'unban' | 'temp_ban' | 'update_balance' | 'reset_stats' | 'change_role' | 'kick' | 'update_shop_item' | 'create_shop_item' | 'toggle_shop_item' | 'mass_notify' | 'revoke_purchase' | 'update_avatar_offsets' | 'remove_item' | 'reset_account';
  targetProfileId?: number | null;
  details?: Record<string, unknown>;
}) {
  const db = await getDb();
  if (!db) return;

  await db.insert(adminAuditLog).values({
    adminId: data.adminId,
    adminName: data.adminName ?? 'Unknown',
    action: data.action,
    targetProfileId: data.targetProfileId ?? null,
    details: data.details ? JSON.stringify(data.details) : null,
  });
}

/**
 * Get audit log entries with filters and pagination.
 */
export async function getAuditLog(opts: {
  actionFilter?: string;
  adminId?: number;
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { entries: [], total: 0 };

  const limit = opts.limit ?? 50;
  const offset = opts.offset ?? 0;

  const conditions: ReturnType<typeof eq>[] = [];
  if (opts.actionFilter) {
    conditions.push(eq(adminAuditLog.action, opts.actionFilter as any));
  }
  if (opts.adminId) {
    conditions.push(eq(adminAuditLog.adminId, opts.adminId));
  }

  const whereClause = conditions.length > 0
    ? conditions.length === 1 ? conditions[0] : and(...conditions)
    : undefined;

  const countResult = whereClause
    ? await db.select({ count: sql<number>`COUNT(*)` }).from(adminAuditLog).where(whereClause)
    : await db.select({ count: sql<number>`COUNT(*)` }).from(adminAuditLog);
  const total = countResult[0]?.count ?? 0;

  const baseQuery = db.select({
    id: adminAuditLog.id,
    adminId: adminAuditLog.adminId,
    adminName: adminAuditLog.adminName,
    action: adminAuditLog.action,
    targetProfileId: adminAuditLog.targetProfileId,
    details: adminAuditLog.details,
    createdAt: adminAuditLog.createdAt,
    targetGameId: playerProfiles.gameId,
    targetName: playerProfiles.displayName,
  }).from(adminAuditLog)
    .leftJoin(playerProfiles, eq(adminAuditLog.targetProfileId, playerProfiles.id));

  const entries = whereClause
    ? await baseQuery.where(whereClause).orderBy(desc(adminAuditLog.createdAt)).limit(limit).offset(offset)
    : await baseQuery.orderBy(desc(adminAuditLog.createdAt)).limit(limit).offset(offset);

  return { entries, total };
}

// ============================================================
// TEMPORARY BAN helpers
// ============================================================

/**
 * Admin: Ban a player with optional duration.
 * duration: null = permanent, otherwise milliseconds.
 */
export async function adminBanPlayerWithDuration(
  profileId: number,
  reason: string,
  durationMs: number | null
) {
  const db = await getDb();
  if (!db) return { success: false };

  const bannedUntil = durationMs ? new Date(Date.now() + durationMs) : null;

  await db.update(playerProfiles).set({
    isBanned: true,
    banReason: reason,
    bannedAt: new Date(),
    bannedUntil,
  }).where(eq(playerProfiles.id, profileId));

  return { success: true, bannedUntil };
}

/**
 * Check if a player's temporary ban has expired and auto-unban if so.
 * Returns true if the player is currently banned, false if not (or was auto-unbanned).
 */
export async function checkAndAutoUnban(profileId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [profile] = await db.select({
    isBanned: playerProfiles.isBanned,
    bannedUntil: playerProfiles.bannedUntil,
  }).from(playerProfiles).where(eq(playerProfiles.id, profileId)).limit(1);

  if (!profile) return false;
  if (!profile.isBanned) return false;

  // If bannedUntil is set and has passed, auto-unban
  if (profile.bannedUntil && new Date() >= profile.bannedUntil) {
    await db.update(playerProfiles).set({
      isBanned: false,
      banReason: null,
      bannedAt: null,
      bannedUntil: null,
    }).where(eq(playerProfiles.id, profileId));
    return false; // no longer banned
  }

  return true; // still banned
}

// ============================================================
// ANTI-FRAUD helpers
// ============================================================

/**
 * Detect players with abnormally high win rates (>80% with 20+ games).
 */
export async function detectAbnormalWinRate(minGames: number = 20, minWinRate: number = 80) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select({
    id: playerProfiles.id,
    gameId: playerProfiles.gameId,
    displayName: playerProfiles.displayName,
    gamesPlayed: playerProfiles.gamesPlayed,
    wins: playerProfiles.wins,
    losses: playerProfiles.losses,
    rating: playerProfiles.rating,
    isBanned: playerProfiles.isBanned,
    winRate: sql<number>`ROUND(${playerProfiles.wins} * 100.0 / GREATEST(${playerProfiles.gamesPlayed}, 1), 1)`,
  }).from(playerProfiles)
    .where(
      and(
        sql`${playerProfiles.gamesPlayed} >= ${minGames}`,
        sql`(${playerProfiles.wins} * 100.0 / GREATEST(${playerProfiles.gamesPlayed}, 1)) >= ${minWinRate}`
      )
    )
    .orderBy(sql`(${playerProfiles.wins} * 100.0 / GREATEST(${playerProfiles.gamesPlayed}, 1)) DESC`)
    .limit(50);

  return rows;
}

/**
 * Detect suspiciously large transactions (top outliers).
 */
export async function detectSuspiciousTransactions(minAmount: number = 10000) {
  const db = await getDb();
  if (!db) return [];

  const rows = await db.select({
    id: transactions.id,
    profileId: transactions.profileId,
    type: transactions.type,
    amount: transactions.amount,
    currency: transactions.currency,
    description: transactions.description,
    balanceAfter: transactions.balanceAfter,
    createdAt: transactions.createdAt,
  }).from(transactions)
    .where(sql`ABS(${transactions.amount}) >= ${minAmount}`)
    .orderBy(sql`ABS(${transactions.amount}) DESC`)
    .limit(50);

  // Enrich with player info
  const profileIds = Array.from(new Set(rows.map(r => r.profileId)));
  if (profileIds.length === 0) return rows.map(r => ({ ...r, gameId: null, displayName: null }));

  const profiles = await db.select({
    id: playerProfiles.id,
    gameId: playerProfiles.gameId,
    displayName: playerProfiles.displayName,
  }).from(playerProfiles).where(
    sql`${playerProfiles.id} IN (${sql.join(profileIds.map(id => sql`${id}`), sql`, `)})`
  );

  const profileMap = new Map(profiles.map(p => [p.id, p]));

  return rows.map(r => ({
    ...r,
    gameId: profileMap.get(r.profileId)?.gameId ?? null,
    displayName: profileMap.get(r.profileId)?.displayName ?? null,
  }));
}

/**
 * Detect players with rapid balance growth (gained > threshold in last 24h).
 */
export async function detectRapidBalanceGrowth(thresholdShanyrak: number = 50000) {
  const db = await getDb();
  if (!db) return [];

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const rows = await db.select({
    profileId: transactions.profileId,
    totalGained: sql<number>`SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END)`,
    txCount: sql<number>`COUNT(*)`,
  }).from(transactions)
    .where(
      and(
        sql`${transactions.createdAt} >= ${oneDayAgo}`,
        eq(transactions.currency, 'shanyrak')
      )
    )
    .groupBy(transactions.profileId)
    .having(sql`SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END) >= ${thresholdShanyrak}`)
    .orderBy(sql`SUM(CASE WHEN ${transactions.amount} > 0 THEN ${transactions.amount} ELSE 0 END) DESC`)
    .limit(50);

  if (rows.length === 0) return [];

  const profileIds = rows.map(r => r.profileId);
  const profiles = await db.select({
    id: playerProfiles.id,
    gameId: playerProfiles.gameId,
    displayName: playerProfiles.displayName,
    balanceShanyrak: playerProfiles.balanceShanyrak,
    isBanned: playerProfiles.isBanned,
  }).from(playerProfiles).where(
    sql`${playerProfiles.id} IN (${sql.join(profileIds.map(id => sql`${id}`), sql`, `)})`
  );

  const profileMap = new Map(profiles.map(p => [p.id, p]));

  return rows.map(r => ({
    ...r,
    gameId: profileMap.get(r.profileId)?.gameId ?? null,
    displayName: profileMap.get(r.profileId)?.displayName ?? null,
    balanceShanyrak: profileMap.get(r.profileId)?.balanceShanyrak ?? 0,
    isBanned: profileMap.get(r.profileId)?.isBanned ?? false,
  }));
}

// ============================================================
// MASS NOTIFICATION helpers
// ============================================================

/**
 * Send a mass notification to a segment of players.
 * Returns the number of notifications created.
 */
export async function sendMassNotification(data: {
  adminId: number;
  adminName: string | null;
  title: string;
  content: string;
  segment: 'all' | 'inactive_7d' | 'top_100' | 'newbies';
}): Promise<{ sentCount: number; campaignId: number }> {
  const db = await getDb();
  if (!db) return { sentCount: 0, campaignId: 0 };

  // Get target profile IDs based on segment
  let profileIds: number[] = [];

  switch (data.segment) {
    case 'all': {
      const rows = await db.select({ id: playerProfiles.id }).from(playerProfiles);
      profileIds = rows.map(r => r.id);
      break;
    }
    case 'inactive_7d': {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const rows = await db.select({ id: playerProfiles.id, userId: playerProfiles.userId })
        .from(playerProfiles);
      // Get users who haven't signed in for 7+ days
      const userIds = rows.map(r => r.userId);
      if (userIds.length === 0) break;
      const inactiveUsers = await db.select({ id: users.id })
        .from(users)
        .where(
          and(
            sql`${users.id} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`,
            sql`${users.lastSignedIn} < ${sevenDaysAgo}`
          )
        );
      const inactiveUserIds = new Set(inactiveUsers.map(u => u.id));
      profileIds = rows.filter(r => inactiveUserIds.has(r.userId)).map(r => r.id);
      break;
    }
    case 'top_100': {
      const rows = await db.select({ id: playerProfiles.id })
        .from(playerProfiles)
        .orderBy(desc(playerProfiles.rating))
        .limit(100);
      profileIds = rows.map(r => r.id);
      break;
    }
    case 'newbies': {
      const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const rows = await db.select({ id: playerProfiles.id })
        .from(playerProfiles)
        .where(sql`${playerProfiles.createdAt} >= ${sevenDaysAgo}`);
      profileIds = rows.map(r => r.id);
      break;
    }
  }

  // Create notifications in batches
  const batchSize = 100;
  for (let i = 0; i < profileIds.length; i += batchSize) {
    const batch = profileIds.slice(i, i + batchSize);
    const values = batch.map(profileId => ({
      profileId,
      type: 'admin_announcement' as const,
      data: JSON.stringify({ title: data.title, content: data.content }),
      isRead: false,
    }));
    if (values.length > 0) {
      await db.insert(notifications).values(values);
    }
  }

  // Record the campaign
  const [campaign] = await db.insert(massNotifications).values({
    adminId: data.adminId,
    adminName: data.adminName,
    title: data.title,
    content: data.content,
    segment: data.segment,
    sentCount: profileIds.length,
  }).$returningId();

  return { sentCount: profileIds.length, campaignId: campaign?.id ?? 0 };
}

/**
 * Get mass notification campaign history.
 */
export async function getMassNotificationHistory(opts: {
  limit?: number;
  offset?: number;
}) {
  const db = await getDb();
  if (!db) return { campaigns: [], total: 0 };

  const limit = opts.limit ?? 20;
  const offset = opts.offset ?? 0;

  const countResult = await db.select({ count: sql<number>`COUNT(*)` }).from(massNotifications);
  const total = countResult[0]?.count ?? 0;

  const campaigns = await db.select()
    .from(massNotifications)
    .orderBy(desc(massNotifications.createdAt))
    .limit(limit)
    .offset(offset);

  return { campaigns, total };
}


// ============================================================
// SHOP PRICE OVERRIDES
// ============================================================

/**
 * Get all shop price overrides.
 */
export async function getShopPriceOverrides() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(shopPriceOverrides);
}

/**
 * Upsert a shop price override. If an override for this itemType+itemId exists, update it; otherwise insert.
 */
export async function upsertShopPriceOverride(data: {
  itemType: 'deck' | 'table' | 'frame' | 'avatar';
  itemId: string;
  priceTenge: number | null;
  isAvailable: boolean;
  updatedBy: number;
}) {
  const db = await getDb();
  if (!db) return { success: false };

  // Check if override exists
  const [existing] = await db.select()
    .from(shopPriceOverrides)
    .where(and(
      eq(shopPriceOverrides.itemType, data.itemType),
      eq(shopPriceOverrides.itemId, data.itemId),
    ))
    .limit(1);

  if (existing) {
    await db.update(shopPriceOverrides).set({
      priceTenge: data.priceTenge,
      isAvailable: data.isAvailable,
      updatedBy: data.updatedBy,
    }).where(eq(shopPriceOverrides.id, existing.id));
  } else {
    await db.insert(shopPriceOverrides).values({
      itemType: data.itemType,
      itemId: data.itemId,
      priceTenge: data.priceTenge,
      isAvailable: data.isAvailable,
      updatedBy: data.updatedBy,
    });
  }

  return { success: true };
}

/**
 * Get the effective price for a shop item. Returns override price if exists, otherwise null (use default).
 */
export async function getShopItemPrice(itemType: 'deck' | 'table' | 'frame', itemId: string): Promise<{ priceTenge: number | null; isAvailable: boolean }> {
  const db = await getDb();
  if (!db) return { priceTenge: null, isAvailable: true };

  const [override] = await db.select()
    .from(shopPriceOverrides)
    .where(and(
      eq(shopPriceOverrides.itemType, itemType),
      eq(shopPriceOverrides.itemId, itemId),
    ))
    .limit(1);

  if (override) {
    return { priceTenge: override.priceTenge, isAvailable: override.isAvailable };
  }
  return { priceTenge: null, isAvailable: true };
}


/**
 * Purchase a premium avatar for a player.
 */
export async function purchaseAvatar(
  userId: number,
  avatarId: string,
  tengeCost: number
): Promise<{ success: boolean; newTenge?: number; reason?: string }> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'db_unavailable' };

  const [profile] = await db.select().from(playerProfiles).where(eq(playerProfiles.userId, userId)).limit(1);
  if (!profile) return { success: false, reason: 'not_found' };

  const owned: string[] = profile.ownedAvatars ? JSON.parse(profile.ownedAvatars) : [];
  if (owned.includes(avatarId)) {
    return { success: false, reason: 'already_owned' };
  }

  if (profile.balanceTenge < tengeCost) {
    return { success: false, reason: 'insufficient_tenge' };
  }

  const newTenge = profile.balanceTenge - tengeCost;
  owned.push(avatarId);

  await db.update(playerProfiles).set({
    balanceTenge: newTenge,
    ownedAvatars: JSON.stringify(owned),
  }).where(eq(playerProfiles.id, profile.id));

  await recordTransaction({
    profileId: profile.id,
    type: 'shop_purchase',
    amount: -tengeCost,
    currency: 'tenge',
    description: `Покупка аватара: ${avatarId}`,
    balanceAfter: newTenge,
  });

  return { success: true, newTenge };
}

/**
 * Get list of owned premium avatar IDs for a player.
 */
export async function getOwnedAvatars(userId: number): Promise<string[]> {
  const db = await getDb();
  if (!db) return [];

  const [profile] = await db.select({ ownedAvatars: playerProfiles.ownedAvatars })
    .from(playerProfiles)
    .where(eq(playerProfiles.userId, userId))
    .limit(1);

  if (!profile || !profile.ownedAvatars) return [];
  return JSON.parse(profile.ownedAvatars);
}

// ============================================================
// COMPLAINT helpers
// ============================================================

/**
 * Create a new player complaint.
 */
export async function createComplaint(data: InsertPlayerComplaint): Promise<{ success: boolean; id?: number; reason?: string }> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'db_unavailable' };

  // Check for duplicate complaint from same reporter to same target within 24h
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const existing = await db.select({ id: playerComplaints.id })
    .from(playerComplaints)
    .where(and(
      eq(playerComplaints.reporterProfileId, data.reporterProfileId),
      eq(playerComplaints.targetProfileId, data.targetProfileId),
      sql`${playerComplaints.createdAt} > ${oneDayAgo}`,
    ))
    .limit(1);

  if (existing.length > 0) {
    return { success: false, reason: 'duplicate_complaint' };
  }

  const [result] = await db.insert(playerComplaints).values(data).$returningId();
  return { success: true, id: result.id };
}

/**
 * Get complaints list for admin moderation panel.
 */
export async function getComplaints(opts: {
  status?: string;
  page?: number;
  limit?: number;
}): Promise<{ complaints: any[]; total: number }> {
  const db = await getDb();
  if (!db) return { complaints: [], total: 0 };

  const page = opts.page || 1;
  const limit = opts.limit || 20;
  const offset = (page - 1) * limit;

  let whereClause = undefined;
  if (opts.status && opts.status !== 'all') {
    whereClause = eq(playerComplaints.status, opts.status as any);
  }

  const [countResult] = await db.select({ count: sql<number>`count(*)` })
    .from(playerComplaints)
    .where(whereClause);

  const complaints = await db.select({
    id: playerComplaints.id,
    reporterProfileId: playerComplaints.reporterProfileId,
    targetProfileId: playerComplaints.targetProfileId,
    reason: playerComplaints.reason,
    description: playerComplaints.description,
    status: playerComplaints.status,
    reviewedBy: playerComplaints.reviewedBy,
    adminNote: playerComplaints.adminNote,
    actionTaken: playerComplaints.actionTaken,
    createdAt: playerComplaints.createdAt,
    updatedAt: playerComplaints.updatedAt,
  })
    .from(playerComplaints)
    .where(whereClause)
    .orderBy(desc(playerComplaints.createdAt))
    .limit(limit)
    .offset(offset);

  return { complaints, total: Number(countResult.count) };
}

/**
 * Get a single complaint by ID.
 */
export async function getComplaintById(id: number) {
  const db = await getDb();
  if (!db) return null;

  const [complaint] = await db.select()
    .from(playerComplaints)
    .where(eq(playerComplaints.id, id))
    .limit(1);

  return complaint || null;
}

/**
 * Update complaint status (admin action).
 */
export async function updateComplaintStatus(
  id: number,
  data: {
    status: 'reviewed' | 'resolved' | 'dismissed';
    reviewedBy: number;
    adminNote?: string;
    actionTaken?: 'none' | 'warning' | 'temp_ban' | 'permanent_ban';
  }
): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  await db.update(playerComplaints).set({
    status: data.status,
    reviewedBy: data.reviewedBy,
    adminNote: data.adminNote || null,
    actionTaken: data.actionTaken || 'none',
  }).where(eq(playerComplaints.id, id));

  return true;
}

/**
 * Get complaint count by status for dashboard stats.
 */
export async function getComplaintStats(): Promise<{ pending: number; reviewed: number; resolved: number; dismissed: number; total: number }> {
  const db = await getDb();
  if (!db) return { pending: 0, reviewed: 0, resolved: 0, dismissed: 0, total: 0 };

  const results = await db.select({
    status: playerComplaints.status,
    count: sql<number>`count(*)`,
  })
    .from(playerComplaints)
    .groupBy(playerComplaints.status);

  const stats = { pending: 0, reviewed: 0, resolved: 0, dismissed: 0, total: 0 };
  for (const r of results) {
    const s = r.status as keyof typeof stats;
    if (s in stats) stats[s] = Number(r.count);
    stats.total += Number(r.count);
  }
  return stats;
}

// ============================================================
// MUSIC PLAYLIST helpers
// ============================================================

/** Get all available playlists */
export async function getAllPlaylists() {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select().from(musicPlaylists).where(eq(musicPlaylists.isAvailable, true));
  return rows.map(r => ({
    ...r,
    tracks: JSON.parse(r.tracksJson || '[]') as string[],
  }));
}

/** Get a single playlist by ID */
export async function getPlaylistById(id: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(musicPlaylists).where(eq(musicPlaylists.id, id));
  if (rows.length === 0) return null;
  return {
    ...rows[0],
    tracks: JSON.parse(rows[0].tracksJson || '[]') as string[],
  };
}

/** Get owned playlist IDs for a player */
export async function getOwnedPlaylistIds(profileId: number): Promise<number[]> {
  const db = await getDb();
  if (!db) return [];
  const rows = await db.select({ ownedPlaylists: playerProfiles.ownedPlaylists })
    .from(playerProfiles).where(eq(playerProfiles.id, profileId));
  if (rows.length === 0) return [];
  try {
    return JSON.parse(rows[0].ownedPlaylists || '[]') as number[];
  } catch {
    return [];
  }
}

/** Purchase a playlist for a player */
export async function purchasePlaylist(profileId: number, playlistId: number, priceShanyrak: number) {
  const db = await getDb();
  if (!db) return { success: false, reason: 'no_db' };

  // Get current profile
  const profiles = await db.select().from(playerProfiles).where(eq(playerProfiles.id, profileId));
  if (profiles.length === 0) return { success: false, reason: 'not_found' };
  const profile = profiles[0];

  // Check if already owned
  const owned: number[] = JSON.parse(profile.ownedPlaylists || '[]');
  if (owned.includes(playlistId)) return { success: false, reason: 'already_owned' };

  // Check balance
  if (profile.balanceShanyrak < priceShanyrak) return { success: false, reason: 'insufficient_shanyrak' };

  // Deduct and add
  const newOwned = [...owned, playlistId];
  await db.update(playerProfiles)
    .set({
      balanceShanyrak: sql`${playerProfiles.balanceShanyrak} - ${priceShanyrak}`,
      ownedPlaylists: JSON.stringify(newOwned),
    })
    .where(eq(playerProfiles.id, profileId));

  // Record transaction
  await db.insert(transactions).values({
    profileId,
    type: 'shop_purchase',
    amount: -priceShanyrak,
    currency: 'shanyrak',
    description: `Purchased playlist #${playlistId}`,
    balanceAfter: profile.balanceShanyrak - priceShanyrak,
  });

  return { success: true };
}

/** Set active playlist for a player */
export async function setActivePlaylist(profileId: number, playlistId: number | null) {
  const db = await getDb();
  if (!db) return;
  await db.update(playerProfiles)
    .set({ activePlaylistId: playlistId })
    .where(eq(playerProfiles.id, profileId));
}

/** Get active playlist for a player (returns tracks or null for default) */
export async function getActivePlaylistTracks(profileId: number): Promise<string[] | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select({ activePlaylistId: playerProfiles.activePlaylistId })
    .from(playerProfiles).where(eq(playerProfiles.id, profileId));
  if (rows.length === 0 || !rows[0].activePlaylistId) return null;
  const playlist = await getPlaylistById(rows[0].activePlaylistId);
  return playlist ? playlist.tracks : null;
}

/** Seed the "Chinese chill+hiphop motives" playlist if it doesn't exist */
export async function seedChinesePlaylist() {
  const db = await getDb();
  if (!db) return;

  // Check if Chinese playlist already exists by name
  const existing = await db.select().from(musicPlaylists).where(eq(musicPlaylists.name, 'Chinese chill+hiphop motives'));
  if (existing.length > 0) return;

  const chineseTracks = [
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/Chinesechill%2Bhiphopmotives1_de29af93.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/Chinesechill%2Bhiphopmotives2_f4033f03.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/Chinesechill%2Bhiphopmotives3_a0d85a28.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/Chinesechill%2Bhiphopmotives4_888af5a4.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/Chinesechill%2Bhiphopmotives5_dcef8e36.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/Chinesechill%2Bhiphopmotives6_34e4a5fa.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/Chinesechill%2Bhiphopmotives7_69ba9d28.mp3',
  ];

  await db.insert(musicPlaylists).values({
    name: 'Chinese chill+hiphop motives',
    nameKk: 'Chinese chill+hiphop motives',
    nameEn: 'Chinese Chill+HipHop Vibes',
    tracksJson: JSON.stringify(chineseTracks),
    priceShanyrak: 100000,
    isDefault: false,
    isAvailable: true,
    volumeMultiplier: 0.8,
    description: 'Чилл и хип-хоп мотивы в китайском стиле — 7 треков',
    descriptionKk: 'Қытай стиліндегі чилл және хип-хоп мотивтері — 7 трек',
    descriptionEn: 'Chinese-style chill and hip-hop vibes — 7 tracks',
  });

  // Also update existing Chinese playlist to have volumeMultiplier 0.8
  await db.update(musicPlaylists)
    .set({ volumeMultiplier: 0.8 })
    .where(eq(musicPlaylists.name, 'Chinese chill+hiphop motives'));
}

/** Fix Chinese playlist URLs (replace + with %2B for CloudFront) */
export async function fixChinesePlaylistUrls() {
  const db = await getDb();
  if (!db) return;
  const rows = await db.select().from(musicPlaylists).where(eq(musicPlaylists.name, 'Chinese chill+hiphop motives'));
  for (const row of rows) {
    const tracks = JSON.parse(row.tracksJson || '[]') as string[];
    const needsFix = tracks.some(t => t.includes('chill+hiphop'));
    if (needsFix) {
      const fixedTracks = tracks.map(t => t.replace('chill+hiphop', 'chill%2Bhiphop'));
      await db.update(musicPlaylists).set({ tracksJson: JSON.stringify(fixedTracks) }).where(eq(musicPlaylists.id, row.id));
    }
  }
}

/** Remove old/duplicate playlists from DB */
export async function cleanupOldPlaylists() {
  const db = await getDb();
  if (!db) return;
  // Delete any playlist named 'Rules house' (legacy)
  await db.delete(musicPlaylists).where(eq(musicPlaylists.name, 'Rules house'));
  // Rename Стандартный → Классический (migration)
  const oldStandard = await db.select().from(musicPlaylists).where(eq(musicPlaylists.name, 'Стандартный'));
  for (const p of oldStandard) {
    await db.update(musicPlaylists)
      .set({ name: 'Классический', nameKk: 'Классикалық', nameEn: 'Classic', description: 'Классическая фоновая музыка — 7 треков', descriptionKk: 'Классикалық фондық музыка — 7 трек', descriptionEn: 'Classic background music — 7 tracks' })
      .where(eq(musicPlaylists.id, p.id));
  }
  // Update Классический playlist with English translations
  await db.update(musicPlaylists)
    .set({ nameEn: 'Classic', descriptionEn: 'Classic background music — 7 tracks' })
    .where(eq(musicPlaylists.name, 'Классический'));
  // Update Chinese playlist with English translations
  await db.update(musicPlaylists)
    .set({ nameEn: 'Chinese Chill+HipHop Vibes', descriptionEn: 'Chinese-style chill and hip-hop vibes — 7 tracks' })
    .where(eq(musicPlaylists.name, 'Chinese chill+hiphop motives'));
  // Remove duplicate Классический playlists — keep only the one with isDefault=true
  const defaults = await db.select().from(musicPlaylists).where(eq(musicPlaylists.name, 'Классический'));
  if (defaults.length > 1) {
    // Keep the one with isDefault=true, or the first one if none has isDefault
    const keep = defaults.find(d => d.isDefault) || defaults[0];
    const toDelete = defaults.filter(d => d.id !== keep.id);
    for (const dup of toDelete) {
      await db.delete(musicPlaylists).where(eq(musicPlaylists.id, dup.id));
    }
  }
}

/** Seed the default "Standard" playlist if it doesn't exist */
export async function seedDefaultPlaylist() {
  const db = await getDb();
  if (!db) return;

  // Check if default playlist already exists (by isDefault flag OR by name)
  const existingByDefault = await db.select().from(musicPlaylists).where(eq(musicPlaylists.isDefault, true));
  if (existingByDefault.length > 0) return;
  const existingByName = await db.select().from(musicPlaylists).where(eq(musicPlaylists.name, 'Классический'));
  if (existingByName.length > 0) return;

  const standardTracks = [
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№1_fd1382d6.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№2_97b3c0a9.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№3_9c1cf3b0.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№4_3882b329.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№5_79e63061.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№6_2a64f936.mp3',
    'https://d2xsxph8kpxj0f.cloudfront.net/310519663508367403/gxeBaGYcbqtwBaadFUobUt/№7_48c4f68c.mp3',
  ];

  await db.insert(musicPlaylists).values({
    name: 'Классический',
    nameKk: 'Классикалық',
    nameEn: 'Classic',
    tracksJson: JSON.stringify(standardTracks),
    priceShanyrak: 0,
    isDefault: true,
    isAvailable: true,
    description: 'Классическая фоновая музыка — 7 треков',
    descriptionKk: 'Классикалық фондық музыка — 7 трек',
    descriptionEn: 'Classic background music — 7 tracks',
  });
}


// ============================================================
// EMAIL/PASSWORD CREDENTIALS
// ============================================================

export async function createUserCredential(data: InsertUserCredential): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.insert(userCredentials).values(data);
}

export async function getCredentialByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(userCredentials).where(eq(userCredentials.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.email, email)).limit(1);
  return rows[0] ?? null;
}

export async function getUserById(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return rows[0] ?? null;
}

/**
 * Create a contact message from a player to the administration.
 */
export async function createContactMessage(data: InsertContactMessage) {
  const db = await getDb();
  if (!db) return null;
  const [result] = await db.insert(contactMessages).values(data).$returningId();
  return result ?? null;
}

/**
 * Get contact messages for admin panel.
 */
export async function getContactMessages(opts: {
  status?: string;
  limit?: number;
  offset?: number;
}): Promise<{ messages: any[]; total: number }> {
  const db = await getDb();
  if (!db) return { messages: [], total: 0 };
  const { eq, desc, sql } = await import('drizzle-orm');
  let whereClause: any = undefined;
  if (opts.status && opts.status !== 'all') {
    whereClause = eq(contactMessages.status, opts.status as any);
  }
  const [totalRow] = await db.select({ count: sql<number>`COUNT(*)` })
    .from(contactMessages)
    .where(whereClause);
  const messages = await db.select()
    .from(contactMessages)
    .where(whereClause)
    .orderBy(desc(contactMessages.createdAt))
    .limit(opts.limit ?? 50)
    .offset(opts.offset ?? 0);
  return { messages, total: Number(totalRow?.count ?? 0) };
}

/**
 * Update contact message status (admin action).
 */
export async function updateContactMessageStatus(id: number, status: 'new' | 'read' | 'replied', adminNote?: string) {
  const db = await getDb();
  if (!db) return false;
  const { eq } = await import('drizzle-orm');
  await db.update(contactMessages)
    .set({ status, adminNote: adminNote ?? undefined })
    .where(eq(contactMessages.id, id));
  return true;
}

// ============================================================
// IAP (In-App Purchase) helpers
// ============================================================

/**
 * Credit tenge to a player after a successful IAP purchase.
 * Idempotent: if transactionId already exists, returns { success: false, reason: 'duplicate' }.
 *
 * Product → tenge mapping:
 *   durak_tenge_100   → 100 tenge
 *   durak_tenge_500   → 500 tenge
 *   durak_tenge_1000  → 1000 tenge
 *   durak_tenge_5000  → 5000 tenge
 */
export async function creditTengeIAP(
  userId: number,
  productId: string,
  transactionId: string,
  platform: 'ios' | 'android',
): Promise<{ success: boolean; reason?: string; credited?: number; newBalance?: number }> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'db_unavailable' };

  const PRODUCT_TENGE: Record<string, number> = {
    durak_tenge_100: 100,
    durak_tenge_500: 500,
    durak_tenge_1000: 1000,
    durak_tenge_5000: 5000,
  };

  const tengeCredited = PRODUCT_TENGE[productId];
  if (!tengeCredited) return { success: false, reason: 'unknown_product' };

  // Check for duplicate transaction
  const [existing] = await db.select({ id: iapTransactions.id })
    .from(iapTransactions)
    .where(eq(iapTransactions.transactionId, transactionId))
    .limit(1);
  if (existing) return { success: false, reason: 'duplicate' };

  // Get player profile
  const [profile] = await db.select()
    .from(playerProfiles)
    .where(eq(playerProfiles.userId, userId))
    .limit(1);
  if (!profile) return { success: false, reason: 'profile_not_found' };

  const newBalance = profile.balanceTenge + tengeCredited;

  // Update balance
  await db.update(playerProfiles)
    .set({ balanceTenge: newBalance })
    .where(eq(playerProfiles.id, profile.id));

  // Record IAP transaction (for deduplication)
  await db.insert(iapTransactions).values({
    profileId: profile.id,
    transactionId,
    productId,
    platform,
    tengeCredited,
  });

  // Record in transaction history
  await recordTransaction({
    profileId: profile.id,
    type: 'buy_tenge',
    amount: tengeCredited,
    currency: 'tenge',
    description: `IAP: +${tengeCredited} тенге (${platform})`,
    balanceAfter: newBalance,
  });

  return { success: true, credited: tengeCredited, newBalance };
}

/**
 * Admin: Revoke a specific shop purchase from a player.
 * Removes the item from the player's owned items and refunds the cost.
 * Works for: decks, tables, frames, avatars, playlists, premium.
 */
export async function adminRevokePlayerPurchase(opts: {
  profileId: number;
  transactionId: number;
  adminId: number;
}): Promise<{ success: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'db_unavailable' };

  // Get the transaction
  const [txn] = await db.select().from(transactions)
    .where(and(
      eq(transactions.id, opts.transactionId),
      eq(transactions.profileId, opts.profileId),
    ))
    .limit(1);

  if (!txn) return { success: false, reason: 'transaction_not_found' };
  if (txn.type !== 'shop_purchase' && txn.type !== ('premium_purchase' as any)) {
    return { success: false, reason: 'not_a_purchase' };
  }

  // Get player profile
  const [profile] = await db.select().from(playerProfiles)
    .where(eq(playerProfiles.id, opts.profileId))
    .limit(1);
  if (!profile) return { success: false, reason: 'profile_not_found' };

  const desc = txn.description ?? '';
  const refundAmount = Math.abs(txn.amount); // amount was negative when purchased

  // Determine item type and remove from owned list
  const updates: Partial<typeof playerProfiles.$inferInsert> = {};

  if (desc.startsWith('Покупка колоды:')) {
    const deckId = desc.replace('Покупка колоды: ', '').trim();
    const owned: string[] = JSON.parse(profile.ownedDecks || '[]');
    updates.ownedDecks = JSON.stringify(owned.filter(id => id !== deckId));
  } else if (desc.startsWith('Покупка стола:')) {
    const tableId = desc.replace('Покупка стола: ', '').trim();
    const owned: string[] = JSON.parse(profile.ownedTables || '[]');
    updates.ownedTables = JSON.stringify(owned.filter(id => id !== tableId));
  } else if (desc.startsWith('Покупка рамки:')) {
    const frameId = desc.replace('Покупка рамки: ', '').trim();
    const owned: string[] = JSON.parse(profile.ownedFrames || '[]');
    updates.ownedFrames = JSON.stringify(owned.filter(id => id !== frameId));
    // Unequip if currently equipped
    if (profile.equippedFrame === frameId) {
      updates.equippedFrame = null;
    }
  } else if (desc.startsWith('Покупка аватара:')) {
    const avatarId = desc.replace('Покупка аватара: ', '').trim();
    const owned: string[] = JSON.parse(profile.ownedAvatars || '[]');
    updates.ownedAvatars = JSON.stringify(owned.filter(id => id !== avatarId));
  } else if (desc.startsWith('Purchased playlist #')) {
    const playlistId = parseInt(desc.replace('Purchased playlist #', '').trim(), 10);
    const owned: number[] = JSON.parse(profile.ownedPlaylists || '[]');
    updates.ownedPlaylists = JSON.stringify(owned.filter(id => id !== playlistId));
    // Reset active playlist if it was this one
    if (profile.activePlaylistId === playlistId) {
      updates.activePlaylistId = null;
    }
  } else if (desc.startsWith('Premium subscription')) {
    // Revoke premium
    updates.isPremium = false;
    updates.premiumExpiresAt = null;
    // Auto-unequip premium frame if it was equipped
    if (profile.equippedFrame === 'premium') {
      updates.equippedFrame = null;
    }
  } else {
    return { success: false, reason: 'unknown_item_type' };
  }

  // Refund balance
  if (txn.currency === 'tenge') {
    const newBalance = profile.balanceTenge + refundAmount;
    updates.balanceTenge = newBalance;
    await db.update(playerProfiles).set(updates).where(eq(playerProfiles.id, opts.profileId));
    // Record refund transaction
    await db.insert(transactions).values({
      profileId: opts.profileId,
      type: 'shop_purchase',
      amount: refundAmount,
      currency: 'tenge',
      description: `[ADMIN REFUND] ${desc}`,
      balanceAfter: newBalance,
    });
  } else {
    const newBalance = profile.balanceShanyrak + refundAmount;
    updates.balanceShanyrak = newBalance;
    await db.update(playerProfiles).set(updates).where(eq(playerProfiles.id, opts.profileId));
    await db.insert(transactions).values({
      profileId: opts.profileId,
      type: 'shop_purchase',
      amount: refundAmount,
      currency: 'shanyrak',
      description: `[ADMIN REFUND] ${desc}`,
      balanceAfter: newBalance,
    });
  }

  // Log admin action
  await db.insert(adminAuditLog).values({
    adminId: opts.adminId,
    action: 'revoke_purchase',
    targetProfileId: opts.profileId,
    details: `Revoked transaction #${opts.transactionId}: ${desc}`,
  });

  return { success: true };
}

/**
 * Admin: Get all shop purchases for a player (shop_purchase + premium_purchase transactions).
 * Excludes purchases that have already been refunded by an admin.
 */
export async function adminGetPlayerPurchases(profileId: number) {
  const db = await getDb();
  if (!db) return [];
  // Return only real purchases (shop items and premium subscriptions)
  // Excludes game rewards, daily quests, top-ups, etc.
  const rows = await db.select().from(transactions)
    .where(and(
      eq(transactions.profileId, profileId),
      sql`${transactions.type} IN ('shop_purchase', 'premium_purchase')`,
    ))
    .orderBy(desc(transactions.createdAt));
  return rows;
}

/**
 * Get total tenge spent by a profile (for Donator achievement).
 * Sums all negative tenge transactions of type shop_purchase or premium_purchase.
 */
export async function getTotalTengeSpentByProfile(profileId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;
  const [row] = await db.select({
    total: sql<number>`COALESCE(SUM(ABS(${transactions.amount})), 0)`,
  })
    .from(transactions)
    .where(and(
      eq(transactions.profileId, profileId),
      sql`${transactions.currency} = 'tenge'`,
      sql`${transactions.amount} < 0`,
      sql`${transactions.type} IN ('shop_purchase', 'premium_purchase')`,
    ));
  return Number(row?.total ?? 0);
}

// ============================================================
// AVATAR OFFSETS helpers
// ============================================================

/** Get all avatar offset overrides from DB */
export async function getAllAvatarOffsets(): Promise<AvatarOffset[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(avatarOffsets);
}

/** Upsert avatar offset override for a specific avatar */
export async function upsertAvatarOffset(
  avatarId: string,
  offsetX: number,
  offsetY: number,
  imgScale: number,
): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(avatarOffsets)
    .values({ avatarId, offsetX, offsetY, imgScale })
    .onDuplicateKeyUpdate({ set: { offsetX, offsetY, imgScale } });
}

// ─── Season Test State ───────────────────────────────────────────────────────────────────────────────────

/** Get the current season test state (singleton row id=1) */
export async function getSeasonTestState(): Promise<SeasonTestState | null> {
  const db = await getDb();
  if (!db) return null;
  const rows = await db.select().from(seasonTestState).where(eq(seasonTestState.id, 1)).limit(1);
  return rows[0] ?? null;
}

/** Upsert the season test state singleton */
export async function upsertSeasonTestState(data: {
  seasonKey: string;
  step: string;
  isActive: boolean;
}): Promise<void> {
  const db = await getDb();
  if (!db) return;
  await db.insert(seasonTestState)
    .values({ id: 1, ...data })
    .onDuplicateKeyUpdate({ set: data });
}

/**
 * Admin: Remove a specific item (avatar or frame) from a player's inventory.
 * Does NOT refund currency — this is a forced removal for admin/testing purposes.
 */
export async function adminRemovePlayerItem(opts: {
  profileId: number;
  itemType: 'avatar' | 'frame';
  itemId: string;
}): Promise<{ success: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'db_unavailable' };

  const [profile] = await db
    .select({
      ownedAvatars: playerProfiles.ownedAvatars,
      ownedFrames: playerProfiles.ownedFrames,
      equippedFrame: playerProfiles.equippedFrame,
      avatarId: playerProfiles.avatarId,
    })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, opts.profileId))
    .limit(1);

  if (!profile) return { success: false, reason: 'player_not_found' };

  const updates: Partial<typeof playerProfiles.$inferInsert> = {};

  if (opts.itemType === 'avatar') {
    const owned: string[] = profile.ownedAvatars ? JSON.parse(profile.ownedAvatars) : [];
    if (!owned.includes(opts.itemId)) return { success: false, reason: 'item_not_owned' };
    updates.ownedAvatars = JSON.stringify(owned.filter((id: string) => id !== opts.itemId));
    if (profile.avatarId === opts.itemId) {
      updates.avatarId = 'wolf'; // reset to default
    }
  } else if (opts.itemType === 'frame') {
    const owned: string[] = profile.ownedFrames ? JSON.parse(profile.ownedFrames) : [];
    if (!owned.includes(opts.itemId)) return { success: false, reason: 'item_not_owned' };
    updates.ownedFrames = JSON.stringify(owned.filter((id: string) => id !== opts.itemId));
    if (profile.equippedFrame === opts.itemId) {
      updates.equippedFrame = null;
    }
  } else {
    return { success: false, reason: 'unknown_item_type' };
  }

  await db.update(playerProfiles).set(updates).where(eq(playerProfiles.id, opts.profileId));
  return { success: true };
}

/**
 * Admin: Get all items (avatars + frames) owned by a player.
 * Includes items from ownedAvatars/ownedFrames AND pending season rewards (not yet claimed).
 */
export async function adminGetPlayerItems(profileId: number): Promise<{
  avatars: string[];
  frames: string[];
  equippedAvatar: string | null;
  equippedFrame: string | null;
  pendingSeasonRewards: Array<{ seasonKey: string; rankKey: string; avatarId: string | null; frameId: string | null; claimed: boolean }>;
}> {
  const db = await getDb();
  if (!db) return { avatars: [], frames: [], equippedAvatar: null, equippedFrame: null, pendingSeasonRewards: [] };
  const [profile] = await db
    .select({
      ownedAvatars: playerProfiles.ownedAvatars,
      ownedFrames: playerProfiles.ownedFrames,
      avatarId: playerProfiles.avatarId,
      equippedFrame: playerProfiles.equippedFrame,
    })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);
  if (!profile) return { avatars: [], frames: [], equippedAvatar: null, equippedFrame: null, pendingSeasonRewards: [] };

  // Also get season rewards (to show items from unclaimed rewards)
  const { getSeasonAvatarId, AVATAR_OPTIONS } = await import('../shared/avatars');
  const { getSeasonInfo, getSeasonRewardDefForSeason, getSeasonRewardDef } = await import('../shared/seasons');
  const allSeasonRewards = await db
    .select()
    .from(seasonRewards)
    .where(eq(seasonRewards.profileId, profileId));

  const pendingSeasonRewards: Array<{ seasonKey: string; rankKey: string; avatarId: string | null; frameId: string | null; claimed: boolean }> = allSeasonRewards.map(r => {
    const seasonInfo = getSeasonInfo(r.seasonKey);
    const rewardDef = seasonInfo
      ? getSeasonRewardDefForSeason(r.rankKey, seasonInfo)
      : getSeasonRewardDef(r.rankKey);
    const avatarId = rewardDef.avatarId ? getSeasonAvatarId(rewardDef.avatarId, r.seasonKey) : null;
    const frameId = rewardDef.frameId ? getSeasonAvatarId(rewardDef.frameId, r.seasonKey) : null;
    return { seasonKey: r.seasonKey, rankKey: r.rankKey, avatarId, frameId, claimed: r.claimed };
  });

  // Also scan ownedAvatars/ownedFrames for season-suffixed items not covered by seasonRewards records.
  // This handles cases where items were granted without a seasonRewards DB record (e.g. manual grants, old code).
  const ownedAvatarsList: string[] = profile.ownedAvatars ? JSON.parse(profile.ownedAvatars) : [];
  const ownedFramesList: string[] = profile.ownedFrames ? JSON.parse(profile.ownedFrames) : [];

  // Build sets of avatarIds/frameIds already covered by seasonRewards
  const coveredAvatarIds = new Set<string>(pendingSeasonRewards.map(r => r.avatarId ?? '').filter(Boolean));
  const coveredFrameIds = new Set<string>(pendingSeasonRewards.map(r => r.frameId ?? '').filter(Boolean));

  // Season suffix pattern: _YYYYQN (e.g. _2026Q2)
  const SEASON_SUFFIX_RE = /^(.+)_(\d{4}Q[1-4])$/;

  for (const avatarId of ownedAvatarsList) {
    if (coveredAvatarIds.has(avatarId)) continue;
    const match = avatarId.match(SEASON_SUFFIX_RE);
    if (!match) continue;
    const baseId = match[1];
    const seasonSuffix = match[2];
    // Only include if it's a known season reward avatar
    const avatarDef = AVATAR_OPTIONS.find(a => a.id === baseId);
    if (!avatarDef?.seasonReward) continue;
    // Reconstruct seasonKey from suffix (e.g. '2026Q2' → '2026-Q2')
    const seasonKey = seasonSuffix.replace(/(\d{4})(Q[1-4])/, '$1-$2');
    pendingSeasonRewards.push({
      seasonKey,
      rankKey: avatarDef.seasonRankRequired ?? 'unknown',
      avatarId,
      frameId: null,
      claimed: true,
    });
    coveredAvatarIds.add(avatarId);
  }

  for (const frameId of ownedFramesList) {
    if (coveredFrameIds.has(frameId)) continue;
    const match = frameId.match(SEASON_SUFFIX_RE);
    if (!match) continue;
    const seasonSuffix = match[2];
    const seasonKey = seasonSuffix.replace(/(\d{4})(Q[1-4])/, '$1-$2');
    pendingSeasonRewards.push({
      seasonKey,
      rankKey: 'unknown',
      avatarId: null,
      frameId,
      claimed: true,
    });
    coveredFrameIds.add(frameId);
  }

  return {
    avatars: ownedAvatarsList,
    frames: ownedFramesList,
    equippedAvatar: profile.avatarId ?? null,
    equippedFrame: profile.equippedFrame ?? null,
    pendingSeasonRewards,
  };
}

/**
 * Admin: Fully reset a player's account to the state of a freshly registered user.
 *
 * What gets reset on player_profiles:
 *   - avatarId → 'wolf'
 *   - rating → 1000
 *   - gamesPlayed, wins, losses, botGamesPlayed, botWins, botLosses → 0
 *   - balanceTenge, balanceShanyrak → 0
 *   - lastFreeTopup → null
 *   - ownedDecks, ownedTables, ownedFrames, ownedAvatars, ownedPlaylists → null (empty)
 *   - activePlaylistId → null
 *   - equippedFrame → null
 *   - tutorialCompleted → false
 *   - tutorialCompletedCount → 0
 *   - premiumPurchaseCount, premiumConsecutiveMonths → 0
 *   - lastPremiumPurchaseMonth → null
 *   - dailyQuestsCompleted → 0
 *   - isPremium → false
 *   - premiumExpiresAt → null
 *   - dailyQuestSwapsUsed → 0
 *   - lastQuestSwapDate → null
 *   - isBanned → false (unban as part of full reset)
 *   - banReason, bannedAt, bannedUntil → null
 *
 * Related tables cleared:
 *   - transactions (all)
 *   - notifications (all)
 *   - user_achievements (all)
 *   - user_daily_quests (all)
 *   - season_rewards (all)
 *   - season_ratings (all)
 *
 * NOT touched: users table (auth identity), game_history (historical record),
 *   friendships, player_complaints, admin_audit_log.
 */
export async function adminResetPlayerAccount(profileId: number): Promise<{ success: boolean; reason?: string }> {
  const db = await getDb();
  if (!db) return { success: false, reason: 'Database not available' };

  const [profile] = await db.select({ id: playerProfiles.id })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);
  if (!profile) return { success: false, reason: 'Player not found' };

  // Reset the profile row to fresh-registration defaults
  await db.update(playerProfiles)
    .set({
      avatarId: 'wolf',
      rating: 1000,
      gamesPlayed: 0,
      wins: 0,
      losses: 0,
      botGamesPlayed: 0,
      botWins: 0,
      botLosses: 0,
      balanceTenge: 0,
      balanceShanyrak: 0,
      lastFreeTopup: null,
      ownedDecks: null,
      ownedTables: null,
      ownedFrames: null,
      ownedAvatars: null,
      ownedPlaylists: null,
      activePlaylistId: null,
      equippedFrame: null,
      tutorialCompleted: false,
      tutorialCompletedCount: 0,
      premiumPurchaseCount: 0,
      premiumConsecutiveMonths: 0,
      lastPremiumPurchaseMonth: null,
      dailyQuestsCompleted: 0,
      isPremium: false,
      premiumExpiresAt: null,
      dailyQuestSwapsUsed: 0,
      lastQuestSwapDate: null,
      isBanned: false,
      banReason: null,
      bannedAt: null,
      bannedUntil: null,
    })
    .where(eq(playerProfiles.id, profileId));

  // Clear related tables
  await db.delete(transactions).where(eq(transactions.profileId, profileId));
  await db.delete(notifications).where(eq(notifications.profileId, profileId));
  await db.delete(userAchievements).where(eq(userAchievements.profileId, profileId));
  await db.delete(userDailyQuests).where(eq(userDailyQuests.profileId, profileId));
  await db.delete(seasonRewards).where(eq(seasonRewards.profileId, profileId));
  await db.delete(seasonRatings).where(eq(seasonRatings.profileId, profileId));

  return { success: true };
}
