import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, boolean } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Player profile — extends users with game-specific data.
 * gameId is the unique sequential player ID (1, 2, 3...) shown to players.
 */
export const playerProfiles = mysqlTable("player_profiles", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to users.id */
  userId: int("userId").notNull().unique(),
  /** The unique sequential game ID visible to players (1, 2, 3...) — computed as MAX(gameId)+1 on insert */
  gameId: int("gameId").unique().notNull(),
  /** Display name (synced from OAuth, can be changed later) */
  displayName: varchar("displayName", { length: 100 }),
  /** Avatar URL */
  avatarUrl: text("avatarUrl"),
  /** Avatar preset ID (wolf, eagle, bear, fox, snow-leopard) */
  avatarId: varchar("avatarId", { length: 32 }).default("wolf"),
  /** ELO rating — starts at 1000 */
  rating: int("rating").default(1000).notNull(),
  /** Total games played */
  gamesPlayed: int("gamesPlayed").default(0).notNull(),
  /** Total wins (first place) */
  wins: int("wins").default(0).notNull(),
  /** Total losses (last place / durak) */
  losses: int("losses").default(0).notNull(),
  /** Tenge balance (in-game currency) */
  balanceTenge: int("balanceTenge").default(0).notNull(),
  /** Shanyrak balance (premium currency) */
  balanceShanyrak: int("balanceShanyrak").default(0).notNull(),
  /** Last time the player used the free shanyrak top-up (for 12h cooldown) */
  lastFreeTopup: timestamp("lastFreeTopup"),
  /** JSON array of owned deck IDs, e.g. ["custom"] */
  ownedDecks: text("ownedDecks"),
  /** JSON array of owned table style IDs, e.g. ["dark_kazakh"] */
  ownedTables: text("ownedTables"),
  /** JSON array of owned avatar frame IDs, e.g. ["fire"] */
  ownedFrames: text("ownedFrames"),
  /** Currently equipped avatar frame ID (null = no frame) */
  equippedFrame: varchar("equippedFrame", { length: 32 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerProfile = typeof playerProfiles.$inferSelect;
export type InsertPlayerProfile = typeof playerProfiles.$inferInsert;

/**
 * Friendships between players.
 * status: pending (request sent), accepted (friends), rejected
 */
export const friendships = mysqlTable("friendships", {
  id: int("id").autoincrement().primaryKey(),
  /** The player who sent the friend request (playerProfiles.id) */
  senderId: int("senderId").notNull(),
  /** The player who received the friend request (playerProfiles.id) */
  receiverId: int("receiverId").notNull(),
  /** Friendship status */
  status: mysqlEnum("status", ["pending", "accepted", "rejected"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = typeof friendships.$inferInsert;

/**
 * Game history — records each completed game for stats tracking.
 */
export const gameHistory = mysqlTable("game_history", {
  id: int("id").autoincrement().primaryKey(),
  /** Room ID where the game was played */
  roomId: varchar("roomId", { length: 32 }).notNull(),
  /** Number of players in the game */
  playerCount: int("playerCount").notNull(),
  /** ID of the winner (playerProfiles.id), null if no winner */
  winnerId: int("winnerId"),
  /** ID of the loser/durak (playerProfiles.id), null if no loser */
  loserId: int("loserId"),
  /** JSON array of all player IDs in order of finish */
  playersJson: text("playersJson"),
  /** Game duration in seconds */
  durationSeconds: int("durationSeconds"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type GameHistoryRecord = typeof gameHistory.$inferSelect;
export type InsertGameHistory = typeof gameHistory.$inferInsert;

/**
 * Notifications for players.
 * type: 'friend_request' | 'friend_accepted' | 'balance_topup'
 * data: JSON string with extra info (e.g. { friendshipId, senderName, senderGameId } or { amount, currency })
 */
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  /** The player who receives this notification (playerProfiles.id) */
  profileId: int("profileId").notNull(),
  /** Notification type */
  type: mysqlEnum("type", ["friend_request", "friend_accepted", "balance_topup", "cooldown_expired"]).notNull(),
  /** JSON data with extra info */
  data: text("data"),
  /** Whether the notification has been read */
  isRead: boolean("isRead").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;

/**
 * Transaction history — records all balance operations for a player.
 * type: 'free_topup' | 'buy_shanyrak' | 'buy_tenge' | 'game_reward'
 */
export const transactions = mysqlTable("transactions", {
  id: int("id").autoincrement().primaryKey(),
  /** The player who performed this transaction (playerProfiles.id) */
  profileId: int("profileId").notNull(),
  /** Transaction type */
  type: mysqlEnum("type", ["free_topup", "buy_shanyrak", "buy_tenge", "game_reward", "game_entry", "shop_purchase"]).notNull(),
  /** Amount changed (positive = gained, negative = spent) */
  amount: int("amount").notNull(),
  /** Currency affected: 'tenge' or 'shanyrak' */
  currency: mysqlEnum("currency", ["tenge", "shanyrak"]).notNull(),
  /** Human-readable description */
  description: text("description"),
  /** Balance after this transaction */
  balanceAfter: int("balanceAfter"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = typeof transactions.$inferInsert;

/**
 * Music playlists — predefined collections of background music tracks.
 * isDefault: true for "Rules house" (free, always owned)
 * price: 0 for free, or shanyrak cost for purchasable playlists
 * tracksJson: JSON array of CDN URLs in order
 */
export const musicPlaylists = mysqlTable("music_playlists", {
  id: int("id").autoincrement().primaryKey(),
  /** Playlist name (e.g., "Rules house", "Chinese chill+hiphop motives") */
  name: varchar("name", { length: 100 }).notNull(),
  /** Price in shanyrak (0 = free/default) */
  price: int("price").default(0).notNull(),
  /** Whether this is the default free playlist */
  isDefault: boolean("isDefault").default(false).notNull(),
  /** JSON array of track CDN URLs in order */
  tracksJson: text("tracksJson").notNull(),
  /** Preview track URL (first track, for 30-sec preview) */
  previewTrackUrl: text("previewTrackUrl"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MusicPlaylist = typeof musicPlaylists.$inferSelect;
export type InsertMusicPlaylist = typeof musicPlaylists.$inferInsert;

/**
 * Owned music playlists — tracks which playlists each player owns.
 * Players automatically own the default "Rules house" playlist.
 */
export const ownedMusicPlaylists = mysqlTable("owned_music_playlists", {
  id: int("id").autoincrement().primaryKey(),
  /** Player who owns this playlist (playerProfiles.id) */
  profileId: int("profileId").notNull(),
  /** The playlist (musicPlaylists.id) */
  playlistId: int("playlistId").notNull(),
  /** When the player acquired this playlist */
  acquiredAt: timestamp("acquiredAt").defaultNow().notNull(),
});

export type OwnedMusicPlaylist = typeof ownedMusicPlaylists.$inferSelect;
export type InsertOwnedMusicPlaylist = typeof ownedMusicPlaylists.$inferInsert;
