import { describe, expect, it, vi, beforeEach } from "vitest";

// ============================================================
// emailAuth.ts — unit tests for email/password auth routes
// Tests cover: input validation, duplicate email, successful register,
// login with valid/invalid credentials, and error handling.
// ============================================================

// We test the route handlers by mocking Express req/res and the db/sdk modules.

// Mock db module
const mockGetCredentialByEmail = vi.fn();
const mockUpsertUser = vi.fn();
const mockGetUserByOpenId = vi.fn();
const mockCreateUserCredential = vi.fn();
const mockGetUserById = vi.fn();
const mockGetOrCreateProfile = vi.fn().mockResolvedValue({ id: 'profile-1', userId: 'user-1' });

const mockCreateEmailVerificationCode = vi.fn().mockResolvedValue(undefined);
const mockGetEmailVerificationCode = vi.fn();
const mockDeleteEmailVerificationCode = vi.fn().mockResolvedValue(undefined);
const mockIncrementVerificationAttempts = vi.fn().mockResolvedValue(undefined);
vi.mock("./db", () => ({
  getCredentialByEmail: (...args: any[]) => mockGetCredentialByEmail(...args),
  upsertUser: (...args: any[]) => mockUpsertUser(...args),
  getUserByOpenId: (...args: any[]) => mockGetUserByOpenId(...args),
  createUserCredential: (...args: any[]) => mockCreateUserCredential(...args),
  getUserById: (...args: any[]) => mockGetUserById(...args),
  getOrCreateProfile: (...args: any[]) => mockGetOrCreateProfile(...args),
  createEmailVerificationCode: (...args: any[]) => mockCreateEmailVerificationCode(...args),
  getEmailVerificationCode: (...args: any[]) => mockGetEmailVerificationCode(...args),
  deleteEmailVerificationCode: (...args: any[]) => mockDeleteEmailVerificationCode(...args),
  incrementVerificationAttempts: (...args: any[]) => mockIncrementVerificationAttempts(...args),
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

// Mock bcryptjs
vi.mock("bcryptjs", () => ({
  default: {
    hash: vi.fn().mockResolvedValue("$2a$10$hashedpassword"),
    compare: vi.fn(),
  },
}));

// Mock brevoEmail
const mockSendVerificationEmail = vi.fn().mockResolvedValue(true);
vi.mock("./brevoEmail", () => ({
  sendVerificationEmail: (...args: any[]) => mockSendVerificationEmail(...args),
}));
// Mock profanityFilter
vi.mock("../shared/profanityFilter", () => ({
  containsProfanity: vi.fn().mockReturnValue(false),
  PROFANITY_ERR_MSG: "Profanity not allowed",
}));
import bcrypt from "bcryptjs";

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
  const { registerEmailAuthRoutes } = await import("./emailAuth");

  const routes: Record<string, Function> = {};
  const mockApp = {
    post: (path: string, handler: Function) => {
      routes[path] = handler;
    },
  };

  registerEmailAuthRoutes(mockApp as any);
  return routes;
}

describe("Email Auth - Registration", () => {
  let routes: Record<string, Function>;

  beforeEach(async () => {
    vi.clearAllMocks();
    routes = await getRouteHandlers();
  });

  it("rejects registration with missing email", async () => {
    const { req, res } = createMockReqRes({ password: "123456", name: "Test" });
    await routes["/api/auth/register/send-code"](req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "invalid_email" })
    );
  });

  it("rejects registration with invalid email format", async () => {
    const { req, res } = createMockReqRes({ email: "not-an-email", password: "123456", name: "Test" });
    await routes["/api/auth/register/send-code"](req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "invalid_email" })
    );
  });

  it("rejects registration with short password", async () => {
    const { req, res } = createMockReqRes({ email: "test@example.com", password: "12345", name: "Test" });
    await routes["/api/auth/register/send-code"](req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "password_too_short" })
    );
  });

  it("rejects registration with missing password", async () => {
    const { req, res } = createMockReqRes({ email: "test@example.com", name: "Test" });
    await routes["/api/auth/register/send-code"](req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "invalid_password" })
    );
  });

  it("rejects registration with empty name", async () => {
    const { req, res } = createMockReqRes({ email: "test@example.com", password: "123456", name: "" });
    await routes["/api/auth/register/send-code"](req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "invalid_name" })
    );
  });

  it("rejects registration with name longer than 12 chars", async () => {
    const { req, res } = createMockReqRes({ email: "test@example.com", password: "123456", name: "VeryLongNameHere" });
    await routes["/api/auth/register/send-code"](req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "invalid_name" })
    );
  });

  it("rejects registration when email already exists", async () => {
    mockGetCredentialByEmail.mockResolvedValue({ id: 1, email: "test@example.com" });
    const { req, res } = createMockReqRes({ email: "test@example.com", password: "123456", name: "Test" });
    await routes["/api/auth/register/send-code"](req, res);
    expect(res.status).toHaveBeenCalledWith(409);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "email_exists" })
    );
  });

  it("successfully sends OTP code for new user registration", async () => {
    mockGetCredentialByEmail.mockResolvedValue(null);
    mockCreateEmailVerificationCode.mockResolvedValue(undefined);
    mockSendVerificationEmail.mockResolvedValue(true);

    const { req, res } = createMockReqRes({ email: "new@example.com", password: "securepass", name: "NewUser" });
    await routes["/api/auth/register/send-code"](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true })
    );
    expect(mockCreateEmailVerificationCode).toHaveBeenCalled();
    expect(mockSendVerificationEmail).toHaveBeenCalledWith("new@example.com", expect.stringMatching(/^\d{6}$/));
  });

  it("returns 500 when email sending fails", async () => {
    mockGetCredentialByEmail.mockResolvedValue(null);
    mockCreateEmailVerificationCode.mockResolvedValue(undefined);
    mockSendVerificationEmail.mockResolvedValue(false);

    const { req, res } = createMockReqRes({ email: "fail@example.com", password: "123456", name: "Fail" });
    await routes["/api/auth/register/send-code"](req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "email_send_failed" })
    );
  });
});

describe("Email Auth - Login", () => {
  let routes: Record<string, Function>;

  beforeEach(async () => {
    vi.clearAllMocks();
    routes = await getRouteHandlers();
  });

  it("rejects login with missing email", async () => {
    const { req, res } = createMockReqRes({ password: "123456" });
    await routes["/api/auth/login"](req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "invalid_email" })
    );
  });

  it("rejects login with missing password", async () => {
    const { req, res } = createMockReqRes({ email: "test@example.com" });
    await routes["/api/auth/login"](req, res);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "invalid_password" })
    );
  });

  it("rejects login when email not found", async () => {
    mockGetCredentialByEmail.mockResolvedValue(null);
    const { req, res } = createMockReqRes({ email: "unknown@example.com", password: "123456" });
    await routes["/api/auth/login"](req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "invalid_credentials" })
    );
  });

  it("rejects login with wrong password", async () => {
    mockGetCredentialByEmail.mockResolvedValue({
      id: 1,
      userId: 42,
      email: "test@example.com",
      passwordHash: "$2a$10$hashed",
    });
    (bcrypt.compare as any).mockResolvedValue(false);

    const { req, res } = createMockReqRes({ email: "test@example.com", password: "wrongpass" });
    await routes["/api/auth/login"](req, res);
    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "invalid_credentials" })
    );
  });

  it("successfully logs in with correct credentials", async () => {
    mockGetCredentialByEmail.mockResolvedValue({
      id: 1,
      userId: 42,
      email: "test@example.com",
      passwordHash: "$2a$10$hashed",
    });
    (bcrypt.compare as any).mockResolvedValue(true);
    mockGetUserById.mockResolvedValue({
      id: 42,
      openId: "email_test-uuid",
      name: "TestUser",
    });
    mockUpsertUser.mockResolvedValue(undefined);

    const { req, res, cookies } = createMockReqRes({ email: "test@example.com", password: "correctpass" });
    await routes["/api/auth/login"](req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: true, openId: "email_test-uuid" })
    );
    expect(mockCreateSessionToken).toHaveBeenCalledWith("email_test-uuid", expect.any(Object));
    expect(cookies.length).toBe(1);
  });

  it("returns 401 when user not found in DB after credential check", async () => {
    mockGetCredentialByEmail.mockResolvedValue({
      id: 1,
      userId: 999,
      email: "ghost@example.com",
      passwordHash: "$2a$10$hashed",
    });
    (bcrypt.compare as any).mockResolvedValue(true);
    mockGetUserById.mockResolvedValue(null);

    const { req, res } = createMockReqRes({ email: "ghost@example.com", password: "correctpass" });
    await routes["/api/auth/login"](req, res);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ error: "user_not_found" })
    );
  });

  it("normalizes email to lowercase", async () => {
    mockGetCredentialByEmail.mockResolvedValue(null);
    const { req, res } = createMockReqRes({ email: "  Test@EXAMPLE.com  ", password: "123456" });
    await routes["/api/auth/login"](req, res);

    expect(mockGetCredentialByEmail).toHaveBeenCalledWith("test@example.com");
  });
});
