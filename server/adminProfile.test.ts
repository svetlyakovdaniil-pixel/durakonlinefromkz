import { describe, expect, it, vi, beforeEach } from "vitest";

/**
 * Unit tests for admin player profile procedures:
 * - admin.playerDetail
 * - admin.updateRole
 * - admin.playerTransactions
 * - admin.playerGameHistory
 *
 * These test the tRPC router layer by mocking the db functions.
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
  adminBanPlayerWithDuration: vi.fn(),
  checkAndAutoUnban: vi.fn(),
  detectAbnormalWinRate: vi.fn(),
  detectSuspiciousTransactions: vi.fn(),
  detectRapidBalanceGrowth: vi.fn(),
  sendMassNotification: vi.fn(),
  getMassNotificationHistory: vi.fn(),
  // Stubs for other imports
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
}));

// Mock socketServer
vi.mock("./socketServer", () => ({
  emitNotificationToProfile: vi.fn(),
  getAdminOnlineStats: vi.fn().mockReturnValue({ onlinePlayerCount: 0, activeRoomCount: 0, rooms: [] }),
  adminKickPlayer: vi.fn(),
}));

import {
  adminGetPlayerDetail,
  adminUpdateRole,
  adminGetPlayerTransactions,
  adminGetPlayerGameHistory,
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

function createGMContext(): TrpcContext {
  return {
    user: {
      id: 3,
      openId: "gm-user",
      email: "gm@example.com",
      name: "GameMaster",
      loginMethod: "manus",
      role: "gm",
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

describe("admin.playerDetail", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns player detail for admin", async () => {
    const mockDetail = {
      id: 5,
      gameId: 5,
      displayName: "TestPlayer",
      rating: 1200,
      gamesPlayed: 50,
      wins: 30,
      losses: 10,
      balanceTenge: 5000,
      balanceShanyrak: 3000,
      isBanned: false,
      banReason: null,
      bannedAt: null,
      tutorialCompleted: true,
      avatarId: "eagle",
      equippedFrame: null,
      openId: "test-open-id",
      email: "test@example.com",
      role: "user",
      lastSignedIn: new Date(),
      userCreatedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    vi.mocked(adminGetPlayerDetail).mockResolvedValue(mockDetail);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.playerDetail({ profileId: 5 });

    expect(result).toEqual(mockDetail);
    expect(adminGetPlayerDetail).toHaveBeenCalledWith(5);
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.playerDetail({ profileId: 5 })).rejects.toThrow();
  });

  it("allows GM to view player detail but hides email", async () => {
    const mockDetail = {
      id: 5, gameId: 5, displayName: "TestPlayer", rating: 1200,
      gamesPlayed: 50, wins: 30, losses: 10, balanceTenge: 5000,
      balanceShanyrak: 3000, isBanned: false, banReason: null,
      bannedAt: null, tutorialCompleted: true, avatarId: "eagle",
      equippedFrame: null, openId: "test-open-id",
      email: "test@example.com", role: "user",
      lastSignedIn: new Date(), userCreatedAt: new Date(),
      createdAt: new Date(), updatedAt: new Date(),
    };
    vi.mocked(adminGetPlayerDetail).mockResolvedValue(mockDetail);

    const caller = appRouter.createCaller(createGMContext());
    const result = await caller.admin.playerDetail({ profileId: 5 });

    expect(result?.email).toBeNull();
    expect(result?.displayName).toBe("TestPlayer");
  });
});

describe("admin.updateRole", () => {
  beforeEach(() => vi.clearAllMocks());

  it("updates role for admin", async () => {
    vi.mocked(adminUpdateRole).mockResolvedValue({ success: true });

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.updateRole({ profileId: 5, role: "admin" });

    expect(result).toEqual({ success: true });
    expect(adminUpdateRole).toHaveBeenCalledWith(5, "admin");
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.updateRole({ profileId: 5, role: "admin" })).rejects.toThrow();
  });

  it("supports gm role value", async () => {
    vi.mocked(adminUpdateRole).mockResolvedValue({ success: true });

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.updateRole({ profileId: 5, role: "gm" });

    expect(result).toEqual({ success: true });
    expect(adminUpdateRole).toHaveBeenCalledWith(5, "gm");
  });

  it("rejects GM from changing roles", async () => {
    const caller = appRouter.createCaller(createGMContext());
    await expect(caller.admin.updateRole({ profileId: 5, role: "user" })).rejects.toThrow();
  });
});

describe("admin.playerTransactions", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns player transactions with sorting", async () => {
    const mockData = {
      transactions: [
        { id: 1, profileId: 5, type: "free_topup", amount: 500, currency: "shanyrak", description: "Free topup", balanceAfter: 500, createdAt: new Date() },
        { id: 2, profileId: 5, type: "game_entry", amount: -100, currency: "shanyrak", description: "Game bet", balanceAfter: 400, createdAt: new Date() },
      ],
      total: 2,
    };
    vi.mocked(adminGetPlayerTransactions).mockResolvedValue(mockData);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.playerTransactions({
      profileId: 5,
      sortBy: "amount",
      sortDir: "desc",
    });

    expect(result.transactions).toHaveLength(2);
    expect(result.total).toBe(2);
    expect(adminGetPlayerTransactions).toHaveBeenCalledWith({
      profileId: 5,
      sortBy: "amount",
      sortDir: "desc",
    });
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.playerTransactions({ profileId: 5 })).rejects.toThrow();
  });

  it("allows GM to view player transactions", async () => {
    const mockData = { transactions: [], total: 0 };
    vi.mocked(adminGetPlayerTransactions).mockResolvedValue(mockData);

    const caller = appRouter.createCaller(createGMContext());
    const result = await caller.admin.playerTransactions({ profileId: 5 });
    expect(result.total).toBe(0);
  });
});

describe("admin.playerGameHistory", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns player game history", async () => {
    const mockData = {
      games: [
        { id: 1, roomId: "room1", playerCount: 2, winnerId: 5, loserId: 6, playersJson: "[5,6]", durationSeconds: 120, createdAt: new Date(), place: 1, ratingDelta: 25, isLoser: false },
      ],
      total: 1,
    };
    vi.mocked(adminGetPlayerGameHistory).mockResolvedValue(mockData);

    const caller = appRouter.createCaller(createAdminContext());
    const result = await caller.admin.playerGameHistory({
      profileId: 5,
      limit: 20,
      offset: 0,
    });

    expect(result.games).toHaveLength(1);
    expect(result.total).toBe(1);
    expect(adminGetPlayerGameHistory).toHaveBeenCalledWith({
      profileId: 5,
      limit: 20,
      offset: 0,
    });
  });

  it("rejects non-admin users", async () => {
    const caller = appRouter.createCaller(createUserContext());
    await expect(caller.admin.playerGameHistory({ profileId: 5 })).rejects.toThrow();
  });

  it("allows GM to view player game history", async () => {
    const mockData = { games: [], total: 0 };
    vi.mocked(adminGetPlayerGameHistory).mockResolvedValue(mockData);

    const caller = appRouter.createCaller(createGMContext());
    const result = await caller.admin.playerGameHistory({ profileId: 5 });
    expect(result.total).toBe(0);
  });
});
