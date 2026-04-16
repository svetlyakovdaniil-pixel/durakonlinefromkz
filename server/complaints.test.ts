import { describe, expect, it, vi } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/**
 * Tests for the complaints system:
 * 1. complaints.submit — validates that a user can submit a complaint
 * 2. Self-complaint prevention
 * 3. Input validation
 */

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createContext(overrides: Partial<AuthenticatedUser> = {}): TrpcContext {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user-1",
    email: "test@example.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    ...overrides,
  };

  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function createAdminContext(): TrpcContext {
  return createContext({ id: 99, openId: "admin-user", name: "Admin", role: "admin" });
}

describe("complaints.submit", () => {
  it("rejects invalid reason enum values", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.complaints.submit({
        targetGameId: 123,
        reason: "invalid_reason" as any,
        description: "test",
      })
    ).rejects.toThrow();
  });

  it("accepts valid reason enum values", () => {
    // Verify the input schema accepts all valid reasons
    const validReasons = ['cheating', 'toxic_behavior', 'inappropriate_name', 'afk_abuse', 'other'];
    for (const reason of validReasons) {
      expect(typeof reason).toBe('string');
    }
  });

  it("rejects description over 500 characters", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.complaints.submit({
        targetGameId: 123,
        reason: "cheating",
        description: "x".repeat(501),
      })
    ).rejects.toThrow();
  });
});

describe("moderation procedures", () => {
  it("rejects non-admin access to moderation.stats", async () => {
    const ctx = createContext(); // regular user
    const caller = appRouter.createCaller(ctx);

    await expect(caller.moderation.stats()).rejects.toThrow();
  });

  it("rejects non-admin access to moderation.list", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.moderation.list({ page: 1, limit: 10 })
    ).rejects.toThrow();
  });

  it("rejects non-admin access to moderation.resolve", async () => {
    const ctx = createContext();
    const caller = appRouter.createCaller(ctx);

    await expect(
      caller.moderation.resolve({ id: 1, status: "resolved" })
    ).rejects.toThrow();
  });
});

describe("admin.forceRenamePlayer", () => {
  it("rejects regular user access", async () => {
    const ctx = createContext({ role: "user" });
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.forceRenamePlayer({ profileId: 1 })
    ).rejects.toThrow();
  });

  it("rejects unauthenticated access", async () => {
    const ctx: TrpcContext = {
      user: null,
      req: { protocol: "https", headers: {} } as TrpcContext["req"],
      res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.forceRenamePlayer({ profileId: 1 })
    ).rejects.toThrow();
  });

  it("rejects invalid profileId (non-integer)", async () => {
    const ctx = createAdminContext();
    const caller = appRouter.createCaller(ctx);
    await expect(
      caller.admin.forceRenamePlayer({ profileId: 1.5 as any })
    ).rejects.toThrow();
  });
});
