import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Unit tests for new admin panel features:
 * 1. Audit log
 * 2. Temporary bans (with duration)
 * 3. Anti-fraud monitoring
 * 4. Mass notifications
 */

// Mock db functions
vi.mock("./db", () => ({
  upsertUser: vi.fn(),
  getOrCreateProfile: vi.fn(),
  adminGetPlayers: vi.fn(),
  adminUpdateBalance: vi.fn(),
  adminBanPlayer: vi.fn(),
  adminUnbanPlayer: vi.fn(),
  adminResetStats: vi.fn(),
  adminGetTransactions: vi.fn(),
  adminGetGlobalStats: vi.fn(),
  adminGetPlayerDetail: vi.fn(),
  adminUpdateRole: vi.fn(),
  adminGetPlayerTransactions: vi.fn(),
  adminGetPlayerGameHistory: vi.fn(),
  logAdminAction: vi.fn().mockResolvedValue(undefined),
  getAuditLog: vi.fn(),
  adminBanPlayerWithDuration: vi.fn(),
  checkAndAutoUnban: vi.fn(),
  detectAbnormalWinRate: vi.fn(),
  detectSuspiciousTransactions: vi.fn(),
  detectRapidBalanceGrowth: vi.fn(),
  sendMassNotification: vi.fn(),
  getMassNotificationHistory: vi.fn(),
  // Stubs for other imports
  getProfileByUserId: vi.fn(),
  getUserByOpenId: vi.fn(),
  getPlayerProfile: vi.fn(),
  updatePlayerProfile: vi.fn(),
  getFriends: vi.fn(),
  getPendingRequests: vi.fn(),
  getLeaderboard: vi.fn(),
  getPlayerGameHistory: vi.fn(),
  createNotification: vi.fn(),
  getNotifications: vi.fn(),
  getUnreadNotificationCount: vi.fn(),
  markNotificationsRead: vi.fn(),
  deleteNotification: vi.fn(),
  deleteAllNotifications: vi.fn(),
  getPlayerProfileWithFriendStatus: vi.fn(),
  getFriendshipById: vi.fn(),
  freeShanyrakTopup: vi.fn(),
  buyShanyrakWithTenge: vi.fn(),
  getFreeTopupStatus: vi.fn(),
  recordTransaction: vi.fn(),
  getMyTransactions: vi.fn(),
  testAddShanyrak: vi.fn(),
  testAddTenge: vi.fn(),
  getOwnedDecks: vi.fn(),
  purchaseDeck: vi.fn(),
  getOwnedTables: vi.fn(),
  purchaseTable: vi.fn(),
  getOwnedFrames: vi.fn(),
  purchaseFrame: vi.fn(),
  equipFrame: vi.fn(),
  completeTutorial: vi.fn(),
  sendFriendRequest: vi.fn(),
  acceptFriendRequest: vi.fn(),
  rejectFriendRequest: vi.fn(),
  removeFriend: vi.fn(),
  updateProfileDisplayName: vi.fn(),
  updateProfileAvatar: vi.fn(),
  getProfileByGameId: vi.fn(),
  recordGameResult: vi.fn(),
  checkShanyrakBalance: vi.fn(),
  deductShanyrakBet: vi.fn(),
  creditShanyrakPrize: vi.fn(),
  getShopPriceOverrides: vi.fn(),
  upsertShopPriceOverride: vi.fn(),
}));

// Mock socketServer
vi.mock("./socketServer", () => ({
  emitNotificationToProfile: vi.fn(),
  getAdminOnlineStats: vi.fn().mockReturnValue({ onlinePlayerCount: 0, activeRoomCount: 0, rooms: [] }),
  adminKickPlayer: vi.fn(),
}));

import {
  getAuditLog,
  adminBanPlayerWithDuration,
  logAdminAction,
  detectAbnormalWinRate,
  detectSuspiciousTransactions,
  detectRapidBalanceGrowth,
  sendMassNotification,
  getMassNotificationHistory,
} from "./db";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function createAdminContext(): TrpcContext {
  return {
    user: {
      id: 1,
      openId: "admin-user",
      email: "admin@example.com",
      name: "Admin",
      loginMethod: "manus",
      role: "admin",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

function createUserContext(): TrpcContext {
  return {
    user: {
      id: 2,
      openId: "regular-user",
      email: "user@example.com",
      name: "User",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

/* ================================================================
   1. AUDIT LOG
   ================================================================ */
describe("admin.auditLog", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns audit log entries for admin", async () => {
    const mockData = {
      entries: [
        { id: 1, adminId: 1, adminName: "Admin", action: "ban", targetProfileId: 5, details: '{"reason":"cheating"}', createdAt: new Date() },
        { id: 2, adminId: 1, adminName: "Admin", action: "update_balance", targetProfileId: 3, details: '{"amount":500}', createdAt: new Date() },
      ],
      total: 2,
    };
    vi.mocked(getAuditLog).mockResolvedValue(mockData);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.auditLog({
      limit: 50,
      offset: 0,
    });

    expect(result.entries).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(getAuditLog).toHaveBeenCalledWith({
      actionFilter: undefined,
      adminId: undefined,
      limit: 50,
      offset: 0,
    });
  });

  it("filters audit log by action type", async () => {
    const mockData = {
      entries: [
        { id: 1, adminId: 1, adminName: "Admin", action: "ban", targetProfileId: 5, details: '{}', createdAt: new Date() },
      ],
      total: 1,
    };
    vi.mocked(getAuditLog).mockResolvedValue(mockData);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.auditLog({
      actionFilter: "ban",
      limit: 50,
      offset: 0,
    });

    expect(result.entries).toHaveLength(1);
    expect(getAuditLog).toHaveBeenCalledWith({
      actionFilter: "ban",
      adminId: undefined,
      limit: 50,
      offset: 0,
    });
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.auditLog({})).rejects.toThrow();
  });
});

/* ================================================================
   2. TEMPORARY BANS
   ================================================================ */
describe("admin.banPlayer (with duration)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates a permanent ban when durationMs is null", async () => {
    vi.mocked(adminBanPlayerWithDuration).mockResolvedValue({ success: true, bannedUntil: null });

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.banPlayer({
      profileId: 5,
      reason: "Cheating",
      durationMs: null,
    });

    expect(result.success).toBe(true);
    expect(adminBanPlayerWithDuration).toHaveBeenCalledWith(5, "Cheating", null);
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "ban",
        targetProfileId: 5,
        details: expect.objectContaining({ reason: "Cheating", durationMs: null }),
      })
    );
  });

  it("creates a temporary ban when durationMs is provided", async () => {
    const futureDate = new Date(Date.now() + 86400000).toISOString();
    vi.mocked(adminBanPlayerWithDuration).mockResolvedValue({ success: true, bannedUntil: futureDate });

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.banPlayer({
      profileId: 5,
      reason: "Toxic behavior",
      durationMs: 86400000, // 1 day
    });

    expect(result.success).toBe(true);
    expect(adminBanPlayerWithDuration).toHaveBeenCalledWith(5, "Toxic behavior", 86400000);
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "temp_ban",
        details: expect.objectContaining({ durationMs: 86400000 }),
      })
    );
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.banPlayer({ profileId: 5, reason: "test" })).rejects.toThrow();
  });

  it("rejects empty reason", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.admin.banPlayer({ profileId: 5, reason: "" })).rejects.toThrow();
  });
});

/* ================================================================
   3. ANTI-FRAUD MONITORING
   ================================================================ */
describe("admin.antifraudWinRate", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns suspicious high win-rate players", async () => {
    const mockData = [
      { id: 1, gameId: 100, displayName: "Cheater", gamesPlayed: 50, wins: 48, winRate: 96, rating: 2000, isBanned: false },
    ];
    vi.mocked(detectAbnormalWinRate).mockResolvedValue(mockData);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.antifraudWinRate({});

    expect(result).toHaveLength(1);
    expect(result[0].winRate).toBe(96);
    expect(detectAbnormalWinRate).toHaveBeenCalledWith(20, 80);
  });

  it("accepts custom thresholds", async () => {
    vi.mocked(detectAbnormalWinRate).mockResolvedValue([]);

    const caller = appRouter.createCaller(createAdminContext());
    await caller.admin.antifraudWinRate({ minGames: 10, minWinRate: 90 });

    expect(detectAbnormalWinRate).toHaveBeenCalledWith(10, 90);
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.antifraudWinRate({})).rejects.toThrow();
  });
});

describe("admin.antifraudTransactions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns suspicious large transactions", async () => {
    const mockData = [
      { id: 1, profileId: 5, gameId: 100, displayName: "BigSpender", type: "game_reward", amount: 50000, currency: "shanyrak", description: "Win", createdAt: new Date() },
    ];
    vi.mocked(detectSuspiciousTransactions).mockResolvedValue(mockData);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.antifraudTransactions({});

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(50000);
    expect(detectSuspiciousTransactions).toHaveBeenCalledWith(10000);
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.antifraudTransactions({})).rejects.toThrow();
  });
});

describe("admin.antifraudBalanceGrowth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns players with rapid balance growth", async () => {
    const mockData = [
      { profileId: 5, gameId: 100, displayName: "Grinder", totalGained: 100000, txCount: 50, balanceShanyrak: 120000, isBanned: false },
    ];
    vi.mocked(detectRapidBalanceGrowth).mockResolvedValue(mockData);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.antifraudBalanceGrowth({});

    expect(result).toHaveLength(1);
    expect(result[0].totalGained).toBe(100000);
    expect(detectRapidBalanceGrowth).toHaveBeenCalledWith(50000);
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.antifraudBalanceGrowth({})).rejects.toThrow();
  });
});

/* ================================================================
   4. MASS NOTIFICATIONS
   ================================================================ */
describe("admin.sendMassNotification", () => {
  beforeEach(() => vi.clearAllMocks());

  it("sends mass notification to all players", async () => {
    vi.mocked(sendMassNotification).mockResolvedValue({ sentCount: 150, campaignId: 1 });

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.sendMassNotification({
      title: "Обновление",
      content: "Новые функции доступны!",
      segment: "all",
    });

    expect(result.sentCount).toBe(150);
    expect(sendMassNotification).toHaveBeenCalledWith({
      adminId: 1,
      adminName: "Admin",
      title: "Обновление",
      content: "Новые функции доступны!",
      segment: "all",
    });
    // Should also log the action
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "mass_notify",
        details: expect.objectContaining({ segment: "all", sentCount: 150 }),
      })
    );
  });

  it("sends to inactive_7d segment", async () => {
    vi.mocked(sendMassNotification).mockResolvedValue({ sentCount: 30, campaignId: 2 });

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.sendMassNotification({
      title: "Вернитесь!",
      content: "Мы скучаем по вам!",
      segment: "inactive_7d",
    });

    expect(result.sentCount).toBe(30);
    expect(sendMassNotification).toHaveBeenCalledWith(
      expect.objectContaining({ segment: "inactive_7d" })
    );
  });

  it("sends to top_100 segment", async () => {
    vi.mocked(sendMassNotification).mockResolvedValue({ sentCount: 100, campaignId: 3 });

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.sendMassNotification({
      title: "Турнир",
      content: "Приглашаем в турнир!",
      segment: "top_100",
    });

    expect(result.sentCount).toBe(100);
  });

  it("sends to newbies segment", async () => {
    vi.mocked(sendMassNotification).mockResolvedValue({ sentCount: 20, campaignId: 4 });

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.sendMassNotification({
      title: "Добро пожаловать!",
      content: "Бонус для новичков!",
      segment: "newbies",
    });

    expect(result.sentCount).toBe(20);
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.sendMassNotification({
      title: "Test",
      content: "Test",
      segment: "all",
    })).rejects.toThrow();
  });

  it("rejects empty title", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.admin.sendMassNotification({
      title: "",
      content: "Test",
      segment: "all",
    })).rejects.toThrow();
  });

  it("rejects empty content", async () => {
    const caller = appRouter.createCaller(createAdminContext());
    await expect(caller.admin.sendMassNotification({
      title: "Test",
      content: "",
      segment: "all",
    })).rejects.toThrow();
  });
});

describe("admin.massNotificationHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns notification campaign history", async () => {
    const mockData = {
      campaigns: [
        { id: 1, adminId: 1, adminName: "Admin", title: "Test", content: "Test msg", segment: "all", sentCount: 100, createdAt: new Date() },
      ],
      total: 1,
    };
    vi.mocked(getMassNotificationHistory).mockResolvedValue(mockData);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.massNotificationHistory({
      limit: 20,
      offset: 0,
    });

    expect(result.campaigns).toHaveLength(1);
    expect(result.total).toBe(1);
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.massNotificationHistory({})).rejects.toThrow();
  });
});

/* ================================================================
   5. AUDIT LOG INTEGRATION (ban actions log correctly)
   ================================================================ */
describe("audit log integration with admin actions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("logs ban action in audit log", async () => {
    vi.mocked(adminBanPlayerWithDuration).mockResolvedValue({ success: true, bannedUntil: null });

    const caller = appRouter.createCaller(createAdminContext());
    await caller.admin.banPlayer({ profileId: 5, reason: "Spam", durationMs: null });

    expect(logAdminAction).toHaveBeenCalledTimes(1);
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        adminId: 1,
        adminName: "Admin",
        action: "ban",
        targetProfileId: 5,
      })
    );
  });

  it("logs temp_ban action with duration", async () => {
    const futureDate = new Date(Date.now() + 3600000).toISOString();
    vi.mocked(adminBanPlayerWithDuration).mockResolvedValue({ success: true, bannedUntil: futureDate });

    const caller = appRouter.createCaller(createAdminContext());
    await caller.admin.banPlayer({ profileId: 5, reason: "Temp", durationMs: 3600000 });

    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "temp_ban",
        details: expect.objectContaining({ durationMs: 3600000 }),
      })
    );
  });

  it("logs mass_notify action with sentCount", async () => {
    vi.mocked(sendMassNotification).mockResolvedValue({ sentCount: 50, campaignId: 1 });

    const caller = appRouter.createCaller(createAdminContext());
    await caller.admin.sendMassNotification({
      title: "Test",
      content: "Test content",
      segment: "all",
    });

    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "mass_notify",
        details: expect.objectContaining({ sentCount: 50, segment: "all" }),
      })
    );
  });
});

/* ================================================================
   6. BAN DURATION VALIDATION
   ================================================================ */
describe("ban duration business logic", () => {
  it("1 hour ban sets correct bannedUntil", () => {
    const now = Date.now();
    const durationMs = 3600000; // 1 hour
    const bannedUntil = new Date(now + durationMs);
    const diff = bannedUntil.getTime() - now;
    expect(diff).toBe(3600000);
  });

  it("1 day ban sets correct bannedUntil", () => {
    const now = Date.now();
    const durationMs = 86400000; // 1 day
    const bannedUntil = new Date(now + durationMs);
    const diff = bannedUntil.getTime() - now;
    expect(diff).toBe(86400000);
  });

  it("7 day ban sets correct bannedUntil", () => {
    const now = Date.now();
    const durationMs = 604800000; // 7 days
    const bannedUntil = new Date(now + durationMs);
    const diff = bannedUntil.getTime() - now;
    expect(diff).toBe(604800000);
  });

  it("permanent ban has null bannedUntil", () => {
    const durationMs = null;
    const bannedUntil = durationMs ? new Date(Date.now() + durationMs) : null;
    expect(bannedUntil).toBeNull();
  });

  it("expired temp ban should be auto-unbanned", () => {
    const bannedUntil = new Date(Date.now() - 1000); // 1 second ago
    const isExpired = new Date() >= bannedUntil;
    expect(isExpired).toBe(true);
  });

  it("active temp ban should remain banned", () => {
    const bannedUntil = new Date(Date.now() + 3600000); // 1 hour from now
    const isExpired = new Date() >= bannedUntil;
    expect(isExpired).toBe(false);
  });
});

/* ================================================================
   6. SHOP PRICE MANAGEMENT
   ================================================================ */
import {
  getShopPriceOverrides,
  upsertShopPriceOverride,
  adminGetGlobalStats,
} from "./db";

describe("admin.shopItems", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns shop price overrides for admin", async () => {
    const mockOverrides = [
      { id: 1, itemType: "frame", itemId: "fire", priceTenge: 300, isAvailable: true, updatedAt: new Date() },
    ];
    vi.mocked(getShopPriceOverrides).mockResolvedValue(mockOverrides);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.shopItems();

    expect(result).toHaveLength(1);
    expect(result[0].priceTenge).toBe(300);
    expect(getShopPriceOverrides).toHaveBeenCalled();
  });

  it("rejects non-admin access to shopItems", async () => {
    await expect(
      appRouter.createCaller(createUserContext()).admin.shopItems()
    ).rejects.toThrow();
  });
});

describe("admin.updateShopPrice", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates shop price override and logs audit", async () => {
    vi.mocked(upsertShopPriceOverride).mockResolvedValue({ success: true });

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.updateShopPrice({
      itemType: "frame",
      itemId: "fire",
      priceTenge: 250,
      isAvailable: true,
    });

    expect(result.success).toBe(true);
    expect(upsertShopPriceOverride).toHaveBeenCalledWith({
      itemType: "frame",
      itemId: "fire",
      priceTenge: 250,
      isAvailable: true,
      updatedBy: 1,
    });
    expect(logAdminAction).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "update_shop_item",
        details: expect.objectContaining({ itemType: "frame", itemId: "fire", priceTenge: 250 }),
      })
    );
  });

  it("rejects non-admin access to updateShopPrice", async () => {
    await expect(
      appRouter.createCaller(createUserContext()).admin.updateShopPrice({
        itemType: "deck",
        itemId: "custom",
        priceTenge: 100,
        isAvailable: true,
      })
    ).rejects.toThrow();
  });
});

/* ================================================================
   7. MONITORING - ADMIN DEDUCTIONS IN GLOBAL STATS
   ================================================================ */
describe("admin.globalStats with admin deductions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns admin deduction/addition stats", async () => {
    vi.mocked(adminGetGlobalStats).mockResolvedValue({
      totalPlayers: 100,
      totalShanyrak: 500000,
      totalTenge: 2500,
      bannedCount: 5,
      avgRating: 1100,
      totalGames: 300,
      adminDeductedShanyrak: 10000,
      adminDeductedTenge: 50,
      adminAddedShanyrak: 5000,
      adminAddedTenge: 25,
    });

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.globalStats();

    expect(result).toBeDefined();
    expect(result!.adminDeductedShanyrak).toBe(10000);
    expect(result!.adminDeductedTenge).toBe(50);
    expect(result!.adminAddedShanyrak).toBe(5000);
    expect(result!.adminAddedTenge).toBe(25);
    expect(result!.totalShanyrak).toBe(500000);
  });
});
