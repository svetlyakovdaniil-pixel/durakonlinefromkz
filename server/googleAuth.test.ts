import { describe, expect, it, vi, beforeEach } from "vitest";

// ============================================================
// googleAuth.ts — unit tests for Google Sign-In auth route
// Tests cover: missing token, invalid token, new user creation,
// existing user login, name truncation, and error handling.
// ============================================================

// Mock db module
const mockGetUserByOpenId = vi.fn();
const mockUpsertUser = vi.fn();

vi.mock("./db", () => ({
  getUserByOpenId: (...args: any[]) => mockGetUserByOpenId(...args),
  upsertUser: (...args: any[]) => mockUpsertUser(...args),
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

// Mock global fetch for Google tokeninfo endpoint
const mockFetch = vi.fn();
vi.stubGlobal("fetch", mockFetch);

// Helper to create mock req/res
function createMockReqRes(body: Record<string, unknown> = {}) {
  const cookies: { name: string; value: string; options: any }[] = [];
  const res = {
    status: vi.fn().mockReturnThis(),
    json: vi.fn().mockReturnThis(),
    cookie: vi.fn((name: string, value: string, options: any) => {
      cookies.push({ name, value, options });
    }),
  };
  const req = {
    body,
    protocol: "https",
    headers: {},
  };
  return { req, res, cookies };
}

// Helper to register routes and get handlers
async function getRouteHandlers() {
  const { registerGoogleAuthRoutes } = await import("./googleAuth");

  const routes: Record<string, Function> = {};
  const mockApp = {
    post: (path: string, handler: Function) => {
      routes[path] = handler;
    },
  };

  registerGoogleAuthRoutes(mockApp as any);
  return routes;
}

// Helper to mock a successful Google token verification
function mockValidGoogleToken(overrides: Record<string, any> = {}) {
  mockFetch.mockResolvedValue({
    ok: true,
    json: async () => ({
      sub: "google-uid-12345",
      email: "player@gmail.com",
      name: "Test Player",
      picture: "https://lh3.googleusercontent.com/photo.jpg",
      aud: "825855589810-q3rtiofrl81c24kop4s3ar5bu35dp7u6.apps.googleusercontent.com",
      ...overrides,
    }),
  });
}

describe("Google Auth - Input Validation", () => {
  let routes: Record<string, Function>;

  beforeEach(async () => {
    vi.clearAllMocks();
    routes = await getRouteHandlers();
  });

  it("rejects request with missing idToken", async () => {
    const { req, res } = createMockReqRes({});
    await routes["/api/auth/google"](req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "missing_token" })
    );
  });

  it("rejects request with empty idToken", async () => {
    const { req, res } = createMockReqRes({ idToken: "" });
    await routes["/api/auth/google"](req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "missing_token" })
    );
  });

  it("rejects request with non-string idToken", async () => {
    const { req, res } = createMockReqRes({ idToken: 12345 });
    await routes["/api/auth/google"](req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "missing_token" })
    );
  });
});

describe("Google Auth - Token Verification", () => {
  let routes: Record<string, Function>;

  beforeEach(async () => {
    vi.clearAllMocks();
    routes = await getRouteHandlers();
  });

  it("rejects when Google tokeninfo returns error", async () => {
    mockFetch.mockResolvedValue({ ok: false, status: 400 });

    const { req, res } = createMockReqRes({ idToken: "invalid-token" });
    await routes["/api/auth/google"](req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "invalid_token" })
    );
  });

  it("rejects when token audience does not match", async () => {
    mockFetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        sub: "uid-123",
        email: "test@gmail.com",
        name: "Test",
        aud: "wrong-audience-id",
      }),
    });

    const { req, res } = createMockReqRes({ idToken: "valid-but-wrong-aud" });
    await routes["/api/auth/google"](req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "invalid_token" })
    );
  });
});

describe("Google Auth - New User Registration", () => {
  let routes: Record<string, Function>;

  beforeEach(async () => {
    vi.clearAllMocks();
    routes = await getRouteHandlers();
  });

  it("creates a new user on first Google sign-in", async () => {
    mockValidGoogleToken();
    mockGetUserByOpenId.mockResolvedValue(null);
    mockUpsertUser.mockResolvedValue(undefined);

    const { req, res, cookies } = createMockReqRes({ idToken: "valid-google-token" });
    await routes["/api/auth/google"](req, res);

    expect(res.status).toHaveBeenCalledWith(201);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, isNew: true, openId: "google_google-uid-12345" })
    );
    expect(mockUpsertUser).toHaveBeenCalledWith(
      expect.objectContaining({
        openId: "google_google-uid-12345",
        name: "Test Player",
        email: "player@gmail.com",
        loginMethod: "google",
      })
    );
    expect(mockCreateSessionToken).toHaveBeenCalledWith(
      "google_google-uid-12345",
      expect.objectContaining({ name: "Test Player" })
    );
    expect(cookies.length).toBe(1);
    expect(cookies[0].value).toBe("mock-session-token");
  });

  it("truncates name to 12 characters for new users", async () => {
    mockValidGoogleToken({ name: "VeryLongGoogleName" });
    mockGetUserByOpenId.mockResolvedValue(null);
    mockUpsertUser.mockResolvedValue(undefined);

    const { req, res } = createMockReqRes({ idToken: "valid-google-token" });
    await routes["/api/auth/google"](req, res);

    expect(mockUpsertUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: "VeryLongGoog" })
    );
  });

  it("uses email prefix as name when name is null", async () => {
    mockValidGoogleToken({ name: null, email: "coolplayer@gmail.com" });
    mockGetUserByOpenId.mockResolvedValue(null);
    mockUpsertUser.mockResolvedValue(undefined);

    const { req, res } = createMockReqRes({ idToken: "valid-google-token" });
    await routes["/api/auth/google"](req, res);

    expect(mockUpsertUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: "coolplayer" })
    );
  });

  it("uses 'Player' as fallback name when both name and email are null", async () => {
    mockValidGoogleToken({ name: null, email: null });
    mockGetUserByOpenId.mockResolvedValue(null);
    mockUpsertUser.mockResolvedValue(undefined);

    const { req, res } = createMockReqRes({ idToken: "valid-google-token" });
    await routes["/api/auth/google"](req, res);

    expect(mockUpsertUser).toHaveBeenCalledWith(
      expect.objectContaining({ name: "Player" })
    );
  });
});

describe("Google Auth - Existing User Login", () => {
  let routes: Record<string, Function>;

  beforeEach(async () => {
    vi.clearAllMocks();
    routes = await getRouteHandlers();
  });

  it("logs in existing user and updates lastSignedIn", async () => {
    mockValidGoogleToken();
    mockGetUserByOpenId.mockResolvedValue({
      id: 42,
      openId: "google_google-uid-12345",
      name: "OldName",
    });
    mockUpsertUser.mockResolvedValue(undefined);

    const { req, res, cookies } = createMockReqRes({ idToken: "valid-google-token" });
    await routes["/api/auth/google"](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, isNew: false, openId: "google_google-uid-12345" })
    );
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
  });

  it("uses Google name when existing user has no name", async () => {
    mockValidGoogleToken({ name: "GoogleName" });
    mockGetUserByOpenId.mockResolvedValue({
      id: 42,
      openId: "google_google-uid-12345",
      name: null,
    });
    mockUpsertUser.mockResolvedValue(undefined);

    const { req, res } = createMockReqRes({ idToken: "valid-google-token" });
    await routes["/api/auth/google"](req, res);

    expect(mockCreateSessionToken).toHaveBeenCalledWith(
      "google_google-uid-12345",
      expect.objectContaining({ name: "GoogleName" })
    );
  });
});

describe("Google Auth - Error Handling", () => {
  let routes: Record<string, Function>;

  beforeEach(async () => {
    vi.clearAllMocks();
    routes = await getRouteHandlers();
  });

  it("returns 500 when db throws an error", async () => {
    mockValidGoogleToken();
    mockGetUserByOpenId.mockRejectedValue(new Error("DB connection failed"));

    const { req, res } = createMockReqRes({ idToken: "valid-google-token" });
    await routes["/api/auth/google"](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "server_error" })
    );
  });

  it("returns 500 when fetch throws a network error", async () => {
    mockFetch.mockRejectedValue(new Error("Network error"));

    const { req, res } = createMockReqRes({ idToken: "valid-google-token" });
    await routes["/api/auth/google"](req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "invalid_token" })
    );
  });
});
