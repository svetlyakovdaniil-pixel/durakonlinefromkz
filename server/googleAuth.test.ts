import { describe, expect, it, vi, beforeEach } from "vitest";

// ============================================================
// googleAuth.ts — unit tests for Google Sign-In auth route
// Tests cover: redirect init, callback handling, new user creation,
// existing user login, name truncation, and error handling.
// ============================================================

// Mock db module
const mockGetUserByOpenId = vi.fn();
const mockUpsertUser = vi.fn();
const mockGetOrCreateProfile = vi.fn().mockResolvedValue({ id: 1 });
const mockActivateReferralCode = vi.fn().mockResolvedValue(undefined);

vi.mock("./db", () => ({
  getUserByOpenId: (...args: any[]) => mockGetUserByOpenId(...args),
  upsertUser: (...args: any[]) => mockUpsertUser(...args),
  getOrCreateProfile: (...args: any[]) => mockGetOrCreateProfile(...args),
  activateReferralCode: (...args: any[]) => mockActivateReferralCode(...args),
}));

// Mock sdk
const mockCreateSessionToken = vi.fn().mockResolvedValue("mock-session-token");

vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: (...args: any[]) => mockCreateSessionToken(...args),
  },
}));

// Mock cookies
vi.mock("./_core/cookies", () => ({
  getSessionCookieOptions: () => ({
    httpOnly: true,
    path: "/",
    sameSite: "none" as const,
    secure: true,
  }),
}));

// Mock global fetch for Google OAuth endpoints
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Helper to create mock req/res for GET callback
function createMockCallbackReqRes(query: Record<string, string> = {}) {
  const cookies: { name: string; value: string; options: any }[] = [];
  let redirectUrl = "";
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn((name: string, value: string, options: any) => {
      cookies.push({ name, value, options });
    }),
    redirect: vi.fn((url: string) => {
      redirectUrl = url;
    }),
  };
  const req = {
    query,
    protocol: "https",
    headers: {},
  };
  return { req, res, cookies, getRedirectUrl: () => redirectUrl };
}

// Helper to create mock req/res for GET init
function createMockInitReqRes(query: Record<string, string> = {}) {
  let redirectUrl = "";
  const res = {
    redirect: vi.fn((url: string) => {
      redirectUrl = url;
    }),
  };
  const req = { query, protocol: "https", headers: {} };
  return { req, res, getRedirectUrl: () => redirectUrl };
}

// Helper to register routes and get handlers
async function getRouteHandlers() {
  const { registerGoogleAuthRoutes } = await import("./googleAuth");

  const routes: Record<string, { method: string; handler: Function }> = {};
  const mockApp = {
    get: (path: string, handler: Function) => {
      routes[path] = { method: "GET", handler };
    },
    post: (path: string, handler: Function) => {
      routes[path] = { method: "POST", handler };
    },
  };

  registerGoogleAuthRoutes(mockApp as any);
  return routes;
}

// Helper to mock successful token exchange + userinfo
function mockSuccessfulGoogleOAuth(overrides: Record<string, any> = {}) {
  mockFetch
    // First call: token exchange
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        access_token: "mock-access-token",
        id_token: "mock-id-token",
      }),
    })
    // Second call: userinfo
    .mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        sub: "google-uid-12345",
        email: "player@gmail.com",
        name: "Test Player",
        picture: "https://lh3.googleusercontent.com/photo.jpg",
        ...overrides,
      }),
    });
}

describe("Google Auth - Init Redirect", () => {
  let routes: Record<string, { method: string; handler: Function }>;

  beforeEach(async () => {
    vi.clearAllMocks();
    routes = await getRouteHandlers();
  });

  it("redirects to Google OAuth consent screen", async () => {
    const { req, res, getRedirectUrl } = createMockInitReqRes({
      origin: "https://durakonlinefromkz.vip",
    });
    routes["/api/auth/google/init"].handler(req, res);
    const url = getRedirectUrl();
    expect(url).toContain("accounts.google.com/o/oauth2/v2/auth");
    expect(url).toContain("response_type=code");
    expect(url).toContain("scope=openid+email+profile");
  });

  it("uses default origin when not provided", async () => {
    const { req, res, getRedirectUrl } = createMockInitReqRes({});
    routes["/api/auth/google/init"].handler(req, res);
    const url = getRedirectUrl();
    expect(url).toContain("accounts.google.com");
    expect(url).toContain("redirect_uri=");
  });
});

describe("Google Auth - Callback Error Handling", () => {
  let routes: Record<string, { method: string; handler: Function }>;

  beforeEach(async () => {
    vi.clearAllMocks();
    routes = await getRouteHandlers();
  });

  it("redirects to login with error when Google returns error", async () => {
    const { req, res, getRedirectUrl } = createMockCallbackReqRes({
      error: "access_denied",
      state: Buffer.from(JSON.stringify({ origin: "https://durakonlinefromkz.vip" })).toString("base64url"),
    });
    await routes["/api/auth/google/callback"].handler(req, res);
    expect(getRedirectUrl()).toContain("/login?error=google_cancelled");
  });

  it("redirects to login when no code provided", async () => {
    const { req, res, getRedirectUrl } = createMockCallbackReqRes({
      state: Buffer.from(JSON.stringify({ origin: "https://durakonlinefromkz.vip" })).toString("base64url"),
    });
    await routes["/api/auth/google/callback"].handler(req, res);
    expect(getRedirectUrl()).toContain("/login?error=google_no_code");
  });

  it("redirects to login on server error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));
    const state = Buffer.from(JSON.stringify({ origin: "https://durakonlinefromkz.vip" })).toString("base64url");
    const { req, res, getRedirectUrl } = createMockCallbackReqRes({ code: "auth-code", state });
    await routes["/api/auth/google/callback"].handler(req, res);
    expect(getRedirectUrl()).toContain("/login?error=google_server_error");
  });
});

describe("Google Auth - New User Registration via Callback", () => {
  let routes: Record<string, { method: string; handler: Function }>;

  beforeEach(async () => {
    vi.clearAllMocks();
    routes = await getRouteHandlers();
  });

  it("creates a new user on first Google sign-in", async () => {
    mockSuccessfulGoogleOAuth();
    mockGetUserByOpenId.mockResolvedValue(null);
    mockUpsertUser.mockResolvedValue(undefined);

    const state = Buffer.from(JSON.stringify({ origin: "https://durakonlinefromkz.vip" })).toString("base64url");
    const { req, res, cookies, getRedirectUrl } = createMockCallbackReqRes({ code: "auth-code", state });
    await routes["/api/auth/google/callback"].handler(req, res);

    expect(mockUpsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: "google_google-uid-12345",
        name: "Test Player",
        email: "player@gmail.com",
        loginMethod: "google",
      })
    );
    expect(cookies.length).toBe(1);
    expect(cookies[0].value).toBe("mock-session-token");
    expect(getRedirectUrl()).toBe("https://durakonlinefromkz.vip/");
  });

  it("truncates name to 12 characters for new users", async () => {
    mockSuccessfulGoogleOAuth({ name: "VeryLongGoogleName" });
    mockGetUserByOpenId.mockResolvedValue(null);
    mockUpsertUser.mockResolvedValue(undefined);

    const state = Buffer.from(JSON.stringify({ origin: "https://durakonlinefromkz.vip" })).toString("base64url");
    const { req, res } = createMockCallbackReqRes({ code: "auth-code", state });
    await routes["/api/auth/google/callback"].handler(req, res);

    expect(mockUpsertUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: "VeryLongGoog" })
    );
  });

  it("uses email prefix as name when name is null", async () => {
    mockSuccessfulGoogleOAuth({ name: null, email: "coolplayer@gmail.com" });
    mockGetUserByOpenId.mockResolvedValue(null);
    mockUpsertUser.mockResolvedValue(undefined);

    const state = Buffer.from(JSON.stringify({ origin: "https://durakonlinefromkz.vip" })).toString("base64url");
    const { req, res } = createMockCallbackReqRes({ code: "auth-code", state });
    await routes["/api/auth/google/callback"].handler(req, res);

    expect(mockUpsertUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: "coolplayer" })
    );
  });

  it("uses 'Player' as fallback name when both name and email are null", async () => {
    mockSuccessfulGoogleOAuth({ name: null, email: null });
    mockGetUserByOpenId.mockResolvedValue(null);
    mockUpsertUser.mockResolvedValue(undefined);

    const state = Buffer.from(JSON.stringify({ origin: "https://durakonlinefromkz.vip" })).toString("base64url");
    const { req, res } = createMockCallbackReqRes({ code: "auth-code", state });
    await routes["/api/auth/google/callback"].handler(req, res);

    expect(mockUpsertUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Player" })
    );
  });
});

describe("Google Auth - Existing User Login via Callback", () => {
  let routes: Record<string, { method: string; handler: Function }>;

  beforeEach(async () => {
    vi.clearAllMocks();
    routes = await getRouteHandlers();
  });

  it("logs in existing user and updates lastSignedIn", async () => {
    mockSuccessfulGoogleOAuth();
    mockGetUserByOpenId.mockResolvedValue({
      id: 42,
      openId: "google_google-uid-12345",
      name: "OldName",
    });
    mockUpsertUser.mockResolvedValue(undefined);

    const state = Buffer.from(JSON.stringify({ origin: "https://durakonlinefromkz.vip" })).toString("base64url");
    const { req, res, cookies, getRedirectUrl } = createMockCallbackReqRes({ code: "auth-code", state });
    await routes["/api/auth/google/callback"].handler(req, res);

    expect(mockUpsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: "google_google-uid-12345",
        lastSignedIn: expect.any(Date),
      })
    );
    expect(mockCreateSessionToken).toHaveBeenCalledWith(
      "google_google-uid-12345",
      expect.objectContaining({ name: "OldName" })
    );
    expect(cookies.length).toBe(1);
    expect(getRedirectUrl()).toBe("https://durakonlinefromkz.vip/");
  });

  it("uses Google name when existing user has no name", async () => {
    mockSuccessfulGoogleOAuth({ name: "GoogleName" });
    mockGetUserByOpenId.mockResolvedValue({
      id: 42,
      openId: "google_google-uid-12345",
      name: null,
    });
    mockUpsertUser.mockResolvedValue(undefined);

    const state = Buffer.from(JSON.stringify({ origin: "https://durakonlinefromkz.vip" })).toString("base64url");
    const { req, res } = createMockCallbackReqRes({ code: "auth-code", state });
    await routes["/api/auth/google/callback"].handler(req, res);

    expect(mockCreateSessionToken).toHaveBeenCalledWith(
      "google_google-uid-12345",
      expect.objectContaining({ name: "GoogleName" })
    );
  });
});
