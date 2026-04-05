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
  /** ELO rating — starts at 1000 */
  rating: int("rating").default(1000).notNull(),
  /** Total games played */
  gamesPlayed: int("gamesPlayed").default(0).notNull(),
  /** Total wins (first place) */
  wins: int("wins").default(0).notNull(),
  /** Total losses (last place / durak) */
  losses: int("losses").default(0).notNull(),
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
