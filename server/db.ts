import { eq, and, or, sql, desc, asc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, playerProfiles, friendships, gameHistory, notifications, transactions } from "../drizzle/schema";
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
  // NOTE: allPlayerProfileIds actually contains gameId values (not profileId/id)
  // because playerGameIds map stores odId -> gameId
  for (const gameId of data.allPlayerProfileIds) {
    const isWinner = gameId === data.winnerProfileId;
    const isLoser = gameId === data.loserProfileId;

    // Rating change: +15 for win, -10 for loss
    let ratingChange = 0;
    if (isWinner) ratingChange = 15;
    else if (isLoser) ratingChange = -10;
    else ratingChange = 0; // middle finishers get no change

    await db.update(playerProfiles).set({
      gamesPlayed: sql`${playerProfiles.gamesPlayed} + 1`,
      wins: isWinner ? sql`${playerProfiles.wins} + 1` : sql`${playerProfiles.wins}`,
      losses: isLoser ? sql`${playerProfiles.losses} + 1` : sql`${playerProfiles.losses}`,
      rating: sql`GREATEST(0, ${playerProfiles.rating} + ${ratingChange})`,
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

// ============================================================
// NOTIFICATION helpers
// ============================================================

/**
 * Create a notification for a player.
 */
export async function createNotification(profileId: number, type: 'friend_request' | 'friend_accepted' | 'balance_topup' | 'cooldown_expired', data: Record<string, unknown>) {
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

  // Already at or above 2000
  if (profile.balanceShanyrak >= 2000) {
    return { success: false, reason: 'already_max' };
  }

  const added = 2000 - profile.balanceShanyrak;
  const newBalance = 2000;

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

  return { available: profile.balanceShanyrak < 2000, currentBalance: profile.balanceShanyrak };
}

// ============================================================
// TRANSACTION helpers
// ============================================================

/**
 * Record a transaction in the history.
 */
export async function recordTransaction(data: {
  profileId: number;
  type: 'free_topup' | 'buy_shanyrak' | 'buy_tenge' | 'game_reward' | 'game_entry' | 'shop_purchase';
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
    rating: target.rating,
    gamesPlayed: target.gamesPlayed,
    wins: target.wins,
    losses: target.losses,
    friendStatus,
    friendshipId,
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
    const owned: string[] = profile.ownedFrames ? JSON.parse(profile.ownedFrames) : [];
    if (!owned.includes(frameId)) {
      return { success: false, reason: 'not_owned' };
    }
  }

  await db.update(playerProfiles).set({
    equippedFrame: frameId,
  }).where(eq(playerProfiles.id, profile.id));

  return { success: true };
}
