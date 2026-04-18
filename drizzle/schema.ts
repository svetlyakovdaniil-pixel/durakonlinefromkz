import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, bigint, boolean, json, float } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin", "gm"]).default("user").notNull(),
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
  /** Total games played (humans only) */
  gamesPlayed: int("gamesPlayed").default(0).notNull(),
  /** Total wins — humans only (first place) */
  wins: int("wins").default(0).notNull(),
  /** Total losses — humans only (last place / durak) */
  losses: int("losses").default(0).notNull(),
  /** Total games played with bots */
  botGamesPlayed: int("botGamesPlayed").default(0).notNull(),
  /** Total wins with bots */
  botWins: int("botWins").default(0).notNull(),
  /** Total losses with bots */
  botLosses: int("botLosses").default(0).notNull(),
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
  /** JSON array of owned premium avatar IDs, e.g. ["nexus_bunny"] */
  ownedAvatars: text("ownedAvatars"),
  /** JSON array of owned playlist IDs, e.g. [1, 2] */
  ownedPlaylists: text("ownedPlaylists"),
  /** Currently active playlist ID (music_playlists.id), null = default */
  activePlaylistId: int("activePlaylistId"),
  /** JSON array of owned emotion pack IDs, e.g. ["monkey"] */
  ownedEmotionPacks: text("ownedEmotionPacks"),
  /** Currently active emotion pack ID ("khan" by default) */
  activeEmotionPack: varchar("activeEmotionPack", { length: 32 }).default("khan"),
  /** Currently equipped avatar frame ID (null = no frame) */
  equippedFrame: varchar("equippedFrame", { length: 32 }),
  /** Whether the player has completed the tutorial */
  tutorialCompleted: boolean("tutorialCompleted").default(false).notNull(),
  /** How many times the player has completed the tutorial */
  tutorialCompletedCount: int("tutorialCompletedCount").default(0).notNull(),
  /** Total number of premium purchases (all time, not necessarily consecutive) */
  premiumPurchaseCount: int("premiumPurchaseCount").default(0).notNull(),
  /** How many consecutive months the player has purchased premium */
  premiumConsecutiveMonths: int("premiumConsecutiveMonths").default(0).notNull(),
  /** Month of last premium purchase (YYYY-MM) for consecutive tracking */
  lastPremiumPurchaseMonth: varchar("lastPremiumPurchaseMonth", { length: 7 }),
  /** Total number of daily quests completed (all time) */
  dailyQuestsCompleted: int("dailyQuestsCompleted").default(0).notNull(),
  /** Whether the player has an active premium subscription */
  isPremium: boolean("isPremium").default(false).notNull(),
  /** When the premium subscription expires (null = no premium) */
  premiumExpiresAt: timestamp("premiumExpiresAt"),
  /** How many daily quest swaps the player has used today (resets at 0:00 MSK) */
  dailyQuestSwapsUsed: int("dailyQuestSwapsUsed").default(0).notNull(),
  /** Date of last daily quest swap reset (YYYY-MM-DD in MSK) */
  lastQuestSwapDate: varchar("lastQuestSwapDate", { length: 10 }),
  /** Whether the player is banned */
  isBanned: boolean("isBanned").default(false).notNull(),
  /** Reason for ban (admin note) */
  banReason: text("banReason"),
  /** When the ban was applied */
  bannedAt: timestamp("bannedAt"),
  /** When the ban expires (null = permanent) */
  bannedUntil: timestamp("bannedUntil"),
  /** Unique 8-character referral code for this player */
  referralCode: varchar("referralCode", { length: 8 }).unique(),
  /** Level of referral rewards already claimed (0=none, 1=1 invite, 2=5 invites, 3=15 invites, 4=50 invites) */
  referralRewardLevel: int("referralRewardLevel").default(0).notNull(),
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
  /** Whether the game had any bots */
  hasBots: boolean("hasBots").default(false).notNull(),
  /** Number of bots in the game */
  botCount: int("botCount").default(0).notNull(),
  /** Total players (humans + bots) in the room when game started */
  totalPlayersInRoom: int("totalPlayersInRoom").default(0).notNull(),
  /** JSON object mapping profileId -> actualRatingChange (with premium bonuses applied) */
  ratingChangesJson: text("ratingChangesJson"),
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
  type: mysqlEnum("type", ["friend_request", "friend_accepted", "balance_topup", "cooldown_expired", "admin_announcement", "account_banned", "season_reward"]).notNull(),
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
  type: mysqlEnum("type", ["free_topup", "buy_shanyrak", "buy_tenge", "game_reward", "game_entry", "shop_purchase", "tutorial_reward", "daily_quest_reward", "achievement_reward", "premium_purchase"]).notNull(),
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
 * Admin audit log — records all admin actions for accountability.
 */
export const adminAuditLog = mysqlTable("admin_audit_log", {
  id: int("id").autoincrement().primaryKey(),
  /** Admin user ID (users.id) */
  adminId: int("adminId").notNull(),
  /** Admin display name (snapshot at time of action) */
  adminName: varchar("adminName", { length: 100 }),
  /** Action type */
  action: mysqlEnum("action", [
    "ban", "unban", "temp_ban",
    "update_balance", "reset_stats", "change_role",
    "kick", "update_shop_item", "create_shop_item",
    "toggle_shop_item", "mass_notify", "revoke_purchase",
    "update_avatar_offsets", "remove_item", "reset_account", "give_item",
    "force_rename",
  ]).notNull(),
  /** Target player profile ID (if applicable) */
  targetProfileId: int("targetProfileId"),
  /** JSON details about the action */
  details: text("details"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type AdminAuditLogEntry = typeof adminAuditLog.$inferSelect;
export type InsertAdminAuditLog = typeof adminAuditLog.$inferInsert;

/**
 * Mass notification campaigns sent by admins.
 */
export const massNotifications = mysqlTable("mass_notifications", {
  id: int("id").autoincrement().primaryKey(),
  /** Admin who sent this (users.id) */
  adminId: int("adminId").notNull(),
  /** Admin name snapshot */
  adminName: varchar("adminName", { length: 100 }),
  /** Notification title */
  title: varchar("title", { length: 200 }).notNull(),
  /** Notification content */
  content: text("content").notNull(),
  /** Target segment */
  segment: mysqlEnum("segment", ["all", "inactive_7d", "top_100", "newbies"]).notNull(),
  /** Number of notifications sent */
  sentCount: int("sentCount").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MassNotification = typeof massNotifications.$inferSelect;
export type InsertMassNotification = typeof massNotifications.$inferInsert;

/**
 * Shop price overrides — allows admins to change item prices in real-time.
 * If an override exists for an item, it takes precedence over hardcoded prices.
 */
export const shopPriceOverrides = mysqlTable("shop_price_overrides", {
  id: int("id").autoincrement().primaryKey(),
  /** Item type: deck, table, frame, avatar, playlist, emotionpack */
  itemType: mysqlEnum("itemType", ["deck", "table", "frame", "avatar", "playlist", "emotionpack"]).notNull(),
  /** Item ID (e.g., 'custom', 'dark_kazakh', 'fire') */
  itemId: varchar("itemId", { length: 64 }).notNull(),
  /** Overridden price in tenge (null = use default) */
  priceTenge: int("priceTenge"),
  /** Whether the item is available for purchase */
  isAvailable: boolean("isAvailable").default(true).notNull(),
  /** Discount percentage (0-100), null = no discount */
  discountPercent: int("discountPercent"),
  /** Discount expiry timestamp (null = no expiry) */
  discountExpiresAt: timestamp("discountExpiresAt"),
  /** Last updated by admin */
  updatedBy: int("updatedBy"),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ShopPriceOverride = typeof shopPriceOverrides.$inferSelect;
export type InsertShopPriceOverride = typeof shopPriceOverrides.$inferInsert;

/**
 * Player complaints — allows players to report other players.
 * Status flow: pending → reviewed → resolved / dismissed
 */
export const playerComplaints = mysqlTable("player_complaints", {
  id: int("id").autoincrement().primaryKey(),
  /** Reporter player profile ID (playerProfiles.id) */
  reporterProfileId: int("reporterProfileId").notNull(),
  /** Reported player profile ID (playerProfiles.id) */
  targetProfileId: int("targetProfileId").notNull(),
  /** Complaint reason category */
  reason: mysqlEnum("reason", [
    "cheating", "toxic_behavior", "inappropriate_name", "afk_abuse", "other",
  ]).notNull(),
  /** Free-text description from the reporter */
  description: text("description"),
  /** Complaint status */
  status: mysqlEnum("complaint_status", ["pending", "reviewed", "resolved", "dismissed"]).default("pending").notNull(),
  /** Admin who reviewed this complaint (users.id) */
  reviewedBy: int("reviewedBy"),
  /** Admin resolution note */
  adminNote: text("adminNote"),
  /** Action taken (if any) */
  actionTaken: mysqlEnum("action_taken", ["none", "warning", "temp_ban", "permanent_ban"]),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type PlayerComplaint = typeof playerComplaints.$inferSelect;
export type InsertPlayerComplaint = typeof playerComplaints.$inferInsert;

/**
 * Music playlists — background music playlists available in the shop.
 * Each playlist has a name, a JSON array of track URLs, a price, and flags.
 */
export const musicPlaylists = mysqlTable("music_playlists", {
  id: int("id").autoincrement().primaryKey(),
  /** Playlist name (displayed in shop and settings) */
  name: varchar("name", { length: 100 }).notNull(),
  /** Kazakh name */
  nameKk: varchar("nameKk", { length: 100 }),
  /** English name */
  nameEn: varchar("nameEn", { length: 100 }),
  /** JSON array of CDN track URLs in play order */
  tracksJson: text("tracksJson").notNull(),
  /** Price in shanyrak (0 = free) */
  priceShanyrak: int("priceShanyrak").default(0).notNull(),
  /** Whether this is the default playlist given to all players */
  isDefault: boolean("isDefault").default(false).notNull(),
  /** Whether this playlist is available for purchase */
  isAvailable: boolean("isAvailable").default(true).notNull(),
  /** Volume multiplier (1.0 = normal, 0.8 = 20% quieter) */
  volumeMultiplier: float("volumeMultiplier").default(1.0).notNull(),
  /** Short description */
  description: text("description"),
  /** Kazakh description */
  descriptionKk: text("descriptionKk"),
  /** English description */
  descriptionEn: text("descriptionEn"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type MusicPlaylist = typeof musicPlaylists.$inferSelect;
export type InsertMusicPlaylist = typeof musicPlaylists.$inferInsert;


/**
 * User credentials — stores email/password for local auth.
 * Links to users table via userId.
 */
export const userCredentials = mysqlTable("user_credentials", {
  id: int("id").autoincrement().primaryKey(),
  /** Foreign key to users.id */
  userId: int("userId").notNull().unique(),
  /** Email address (unique, used for login) */
  email: varchar("email", { length: 320 }).notNull().unique(),
  /** bcrypt hashed password */
  passwordHash: varchar("passwordHash", { length: 255 }).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserCredential = typeof userCredentials.$inferSelect;
export type InsertUserCredential = typeof userCredentials.$inferInsert;

/**
 * Contact messages — messages sent by players to the administration.
 * Accessible from Settings → "Связь с администрацией".
 */
export const contactMessages = mysqlTable("contact_messages", {
  id: int("id").autoincrement().primaryKey(),
  /** Profile ID of the sender (null if not authenticated) */
  profileId: int("profileId"),
  /** Player's display name at time of sending */
  senderName: varchar("senderName", { length: 100 }).notNull(),
  /** Reply-to email provided by the player */
  replyEmail: varchar("replyEmail", { length: 320 }).notNull(),
  /** Message text */
  message: text("message").notNull(),
  /** Admin status: 'new' | 'read' | 'replied' */
  status: mysqlEnum("contact_status", ["new", "read", "replied"]).default("new").notNull(),
  /** Optional admin note */
  adminNote: text("adminNote"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ContactMessage = typeof contactMessages.$inferSelect;
export type InsertContactMessage = typeof contactMessages.$inferInsert;

/**
 * IAP Transactions — records of In-App Purchases via RevenueCat.
 * Used for deduplication: each transactionId can only be credited once.
 */
export const iapTransactions = mysqlTable("iap_transactions", {
  id: int("id").autoincrement().primaryKey(),
  /** Profile ID of the purchaser */
  profileId: int("profileId").notNull(),
  /** RevenueCat / StoreKit / Google Play transaction identifier */
  transactionId: varchar("transactionId", { length: 255 }).notNull().unique(),
  /** Product ID purchased (e.g. durak_tenge_100) */
  productId: varchar("productId", { length: 100 }).notNull(),
  /** Platform: ios or android */
  platform: mysqlEnum("iap_platform", ["ios", "android"]).notNull(),
  /** Amount of tenge credited */
  tengeCredited: int("tengeCredited").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type IapTransaction = typeof iapTransactions.$inferSelect;
export type InsertIapTransaction = typeof iapTransactions.$inferInsert;

/**
 * User achievements — tracks which achievements each player has unlocked and claimed.
 * Achievement definitions are hardcoded in shared/achievements.ts.
 */
export const userAchievements = mysqlTable("user_achievements", {
  id: int("id").autoincrement().primaryKey(),
  /** Player profile ID (playerProfiles.id) */
  profileId: int("profileId").notNull(),
  /** Achievement key (e.g. 'first_game', 'steppe_student') */
  achievementKey: varchar("achievementKey", { length: 64 }).notNull(),
  /** Current progress value (e.g. games played count) */
  progress: int("progress").default(0).notNull(),
  /** Whether the achievement condition has been met (unlocked) */
  unlocked: boolean("unlocked").default(false).notNull(),
  /** Whether the reward has been claimed by the player */
  claimed: boolean("claimed").default(false).notNull(),
  /** When the achievement was unlocked */
  unlockedAt: timestamp("unlockedAt"),
  /** When the reward was claimed */
  claimedAt: timestamp("claimedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserAchievement = typeof userAchievements.$inferSelect;
export type InsertUserAchievement = typeof userAchievements.$inferInsert;

/**
 * User daily quests — tracks which 4 quests are assigned to each player today,
 * their progress, and whether the reward has been claimed.
 *
 * Quests reset at 00:00 Moscow time (UTC+3) each day.
 * Quest definitions are hardcoded in shared/dailyQuests.ts.
 */
export const userDailyQuests = mysqlTable("user_daily_quests", {
  id: int("id").autoincrement().primaryKey(),
  /** Player profile ID (playerProfiles.id) */
  profileId: int("profileId").notNull(),
  /** Quest key (e.g. 'steppe_start', 'first_koshkar') */
  questKey: varchar("questKey", { length: 64 }).notNull(),
  /** UTC timestamp (ms) of the Moscow-day start when this quest was assigned */
  dayStartTs: bigint("dayStartTs", { mode: "number" }).notNull(),
  /** Current progress value */
  progress: int("progress").default(0).notNull(),
  /** Whether the quest condition has been met */
  completed: boolean("completed").default(false).notNull(),
  /** Whether the reward has been claimed */
  claimed: boolean("claimed").default(false).notNull(),
  /** When the quest was completed */
  completedAt: timestamp("completedAt"),
  /** When the reward was claimed */
  claimedAt: timestamp("claimedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserDailyQuest = typeof userDailyQuests.$inferSelect;
export type InsertUserDailyQuest = typeof userDailyQuests.$inferInsert;

/**
 * Season ratings — tracks each player's seasonal rating per season.
 * seasonKey format: "YYYY-QN" (e.g. "2026-Q1" for Q1 Jan–Mar 2026)
 * Rating resets to 0 at the start of each new season.
 * No premium bonus applied to season rating changes.
 */
export const seasonRatings = mysqlTable("season_ratings", {
  id: int("id").autoincrement().primaryKey(),
  /** Player profile ID (playerProfiles.id) */
  profileId: int("profileId").notNull(),
  /** Season key in "YYYY-QN" format (e.g. "2026-Q1") */
  seasonKey: varchar("seasonKey", { length: 7 }).notNull(),
  /** Current season rating (starts at 0, can go negative but floored at 0) */
  seasonRating: int("seasonRating").default(0).notNull(),
  /** Total games played this season */
  gamesPlayed: int("gamesPlayed").default(0).notNull(),
  /** Total wins this season */
  wins: int("wins").default(0).notNull(),
  /** Total losses this season */
  losses: int("losses").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type SeasonRating = typeof seasonRatings.$inferSelect;
export type InsertSeasonRating = typeof seasonRatings.$inferInsert;

/**
 * Season rewards — tracks end-of-season reward claims per player per season.
 * Created when a season ends and rewards are distributed.
 */
export const seasonRewards = mysqlTable("season_rewards", {
  id: int("id").autoincrement().primaryKey(),
  /** Player profile ID (playerProfiles.id) */
  profileId: int("profileId").notNull(),
  /** Season key in "YYYY-QN" format (e.g. "2026-Q1") */
  seasonKey: varchar("seasonKey", { length: 7 }).notNull(),
  /** Final season rating at end of season */
  finalRating: int("finalRating").notNull(),
  /** Rank achieved (e.g. "steppe_hare", "great_khan") */
  rankKey: varchar("rankKey", { length: 32 }).notNull(),
  /** Shanyrak reward amount */
  shanyraksAwarded: int("shanyraksAwarded").default(0).notNull(),
  /** Tenge reward amount */
  tengeAwarded: int("tengeAwarded").default(0).notNull(),
  /** Whether reward has been claimed (notification sent) */
  claimed: boolean("claimed").default(false).notNull(),
  /** When the reward was claimed */
  claimedAt: timestamp("claimedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type SeasonReward = typeof seasonRewards.$inferSelect;
export type InsertSeasonReward = typeof seasonRewards.$inferInsert;

/**
 * Avatar offsets — admin-controlled per-avatar image position overrides.
 * Stored in DB so changes apply globally to all players without redeployment.
 */
export const avatarOffsets = mysqlTable("avatar_offsets", {
  id: int("id").autoincrement().primaryKey(),
  /** Avatar base ID (e.g. 'neon_crown') */
  avatarId: varchar("avatarId", { length: 64 }).notNull().unique(),
  /** Horizontal offset in percent (-50 to 50) */
  offsetX: float("offsetX").default(0).notNull(),
  /** Vertical offset in percent (-50 to 50) */
  offsetY: float("offsetY").default(0).notNull(),
  /** Image scale multiplier (0.5 to 2.0) */
  imgScale: float("imgScale").default(1).notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type AvatarOffset = typeof avatarOffsets.$inferSelect;
export type InsertAvatarOffset = typeof avatarOffsets.$inferInsert;

/**
 * Season test state — persists the admin’s active test season across page reloads.
 * Only one row exists (id = 1). isActive=true means a test is in progress.
 */
export const seasonTestState = mysqlTable("season_test_state", {
  id: int("id").primaryKey().default(1),
  /** The season key being tested, e.g. '2026-Q3' */
  seasonKey: varchar("seasonKey", { length: 16 }).notNull(),
  /** Current step in the test flow */
  step: varchar("step", { length: 32 }).notNull().default('idle'), // idle | rated | simulated | rolled_back
  /** Whether a test is currently active (simulate was run, rollback not yet done) */
  isActive: boolean("isActive").notNull().default(false),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SeasonTestState = typeof seasonTestState.$inferSelect;
export type InsertSeasonTestState = typeof seasonTestState.$inferInsert;

/**
 * Referrals — tracks who invited whom.
 * When a new player enters a referral code, a row is created here.
 */
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  /** The player who shared their code (playerProfiles.id) */
  referrerId: int("referrerId").notNull(),
  /** The new player who used the code (playerProfiles.id) */
  referredId: int("referredId").notNull().unique(),
  /** When the referral was activated */
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

/**
 * Email verification codes — temporary OTP codes sent during registration.
 * A code is valid for 10 minutes and can be used only once.
 */
export const emailVerificationCodes = mysqlTable("email_verification_codes", {
  id: int("id").autoincrement().primaryKey(),
  /** Email address being verified */
  email: varchar("email", { length: 320 }).notNull(),
  /** 6-digit numeric OTP code */
  code: varchar("code", { length: 6 }).notNull(),
  /** Pending registration data (name, passwordHash, referralCode) stored as JSON */
  pendingData: text("pendingData").notNull(),
  /** Number of failed verification attempts */
  attempts: int("attempts").default(0).notNull(),
  /** When the code expires (10 minutes from creation) */
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailVerificationCode = typeof emailVerificationCodes.$inferSelect;
export type InsertEmailVerificationCode = typeof emailVerificationCodes.$inferInsert;

/**
 * Server settings — key/value store for global server configuration.
 * Used for maintenance mode, feature flags, etc.
 */
export const serverSettings = mysqlTable("server_settings", {
  id: int("id").autoincrement().primaryKey(),
  /** Setting key (unique) */
  key: varchar("key", { length: 100 }).notNull().unique(),
  /** Setting value as JSON string */
  value: text("value").notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});
export type ServerSetting = typeof serverSettings.$inferSelect;
export type InsertServerSetting = typeof serverSettings.$inferInsert;
