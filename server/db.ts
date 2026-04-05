import { eq, and, or, sql, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, playerProfiles, friendships, gameHistory } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
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

// ============================================================
// FRIENDS helpers
// ============================================================

/**
 * Send a friend request from senderProfileId to receiverProfileId.
 * Returns 'sent' | 'already_friends' | 'already_pending' | 'not_found'
 */
export async function sendFriendRequest(senderProfileId: number, receiverProfileId: number): Promise<string> {
  const db = await getDb();
  if (!db) return 'not_found';

  if (senderProfileId === receiverProfileId) return 'not_found';

  // Check if friendship already exists in either direction
  const existing = await db.select().from(friendships).where(
    or(
      and(eq(friendships.senderId, senderProfileId), eq(friendships.receiverId, receiverProfileId)),
      and(eq(friendships.senderId, receiverProfileId), eq(friendships.receiverId, senderProfileId))
    )
  ).limit(1);

  if (existing.length > 0) {
    if (existing[0].status === 'accepted') return 'already_friends';
    if (existing[0].status === 'pending') return 'already_pending';
    // If rejected, allow re-sending by updating
    await db.update(friendships).set({ status: 'pending', senderId: senderProfileId, receiverId: receiverProfileId }).where(eq(friendships.id, existing[0].id));
    return 'sent';
  }

  await db.insert(friendships).values({
    senderId: senderProfileId,
    receiverId: receiverProfileId,
    status: 'pending',
  });

  return 'sent';
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
}) {
  const db = await getDb();
  if (!db) return;

  // Insert game history
  await db.insert(gameHistory).values({
    roomId: data.roomId,
    playerCount: data.playerCount,
    winnerId: data.winnerProfileId,
    loserId: data.loserProfileId,
    playersJson: JSON.stringify(data.allPlayerProfileIds),
    durationSeconds: data.durationSeconds,
  });

  // Update stats for all participants
  for (const profileId of data.allPlayerProfileIds) {
    const isWinner = profileId === data.winnerProfileId;
    const isLoser = profileId === data.loserProfileId;

    // ELO-like rating change
    let ratingChange = 0;
    if (isWinner) ratingChange = 25;
    else if (isLoser) ratingChange = -25;
    else ratingChange = 0; // middle finishers get no change

    await db.update(playerProfiles).set({
      gamesPlayed: sql`${playerProfiles.gamesPlayed} + 1`,
      wins: isWinner ? sql`${playerProfiles.wins} + 1` : sql`${playerProfiles.wins}`,
      losses: isLoser ? sql`${playerProfiles.losses} + 1` : sql`${playerProfiles.losses}`,
      rating: sql`GREATEST(0, ${playerProfiles.rating} + ${ratingChange})`,
    }).where(eq(playerProfiles.id, profileId));
  }
}

/**
 * Get top players by rating.
 */
export async function getLeaderboard(limit = 50) {
  const db = await getDb();
  if (!db) return [];

  return db.select({
    gameId: playerProfiles.gameId,
    displayName: playerProfiles.displayName,
    rating: playerProfiles.rating,
    gamesPlayed: playerProfiles.gamesPlayed,
    wins: playerProfiles.wins,
    losses: playerProfiles.losses,
  }).from(playerProfiles).orderBy(desc(playerProfiles.rating)).limit(limit);
}

/**
 * Get recent game history for a player.
 */
export async function getPlayerGameHistory(profileId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];

  return db.select().from(gameHistory).where(
    sql`JSON_CONTAINS(${gameHistory.playersJson}, CAST(${profileId} AS JSON))`
  ).orderBy(desc(gameHistory.createdAt)).limit(limit);
}
