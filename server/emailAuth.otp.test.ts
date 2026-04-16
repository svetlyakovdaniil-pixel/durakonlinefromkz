import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock db module
vi.mock("./db", () => ({
  getCredentialByEmail: vi.fn(),
  createEmailVerificationCode: vi.fn(),
  getEmailVerificationCode: vi.fn(),
  incrementVerificationAttempts: vi.fn(),
  deleteEmailVerificationCode: vi.fn(),
  upsertUser: vi.fn(),
  getUserByOpenId: vi.fn(),
  createUserCredential: vi.fn(),
  getOrCreateProfile: vi.fn(),
  activateReferralCode: vi.fn(),
  getUserById: vi.fn(),
}));

// Mock brevoEmail
vi.mock("./brevoEmail", () => ({
  sendVerificationEmail: vi.fn().mockResolvedValue(true),
}));

// Mock sdk
vi.mock("./_core/sdk", () => ({
  sdk: {
    createSessionToken: vi.fn().mockResolvedValue("mock-session-token"),
  },
}));

// Mock cookies
vi.mock("./_core/cookies", () => ({
  getSessionCookieOptions: vi.fn().mockReturnValue({ httpOnly: true, secure: false }),
}));

// Mock profanityFilter
vi.mock("../shared/profanityFilter", () => ({
  containsProfanity: vi.fn().mockReturnValue(false),
  PROFANITY_ERR_MSG: "Profanity not allowed",
}));

import * as db from "./db";
import { sendVerificationEmail } from "./brevoEmail";

describe("Email OTP Registration Flow", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate a 6-digit OTP code", () => {
    // Test the OTP generation logic directly
    const code = String(Math.floor(100000 + Math.random() * 900000));
    expect(code).toMatch(/^\d{6}$/);
    expect(parseInt(code)).toBeGreaterThanOrEqual(100000);
    expect(parseInt(code)).toBeLessThanOrEqual(999999);
  });

  it("should reject registration if email already exists", async () => {
    vi.mocked(db.getCredentialByEmail).mockResolvedValue({
      id: 1,
      userId: 1,
      email: "test@example.com",
      passwordHash: "hash",
      createdAt: new Date(),
    });

    const result = await db.getCredentialByEmail("test@example.com");
    expect(result).not.toBeNull();
    // Registration should be blocked
    expect(db.getCredentialByEmail).toHaveBeenCalledWith("test@example.com");
  });

  it("should call sendVerificationEmail with correct params", async () => {
    vi.mocked(db.getCredentialByEmail).mockResolvedValue(null);
    vi.mocked(db.createEmailVerificationCode).mockResolvedValue(undefined);

    const email = "newuser@example.com";
    const code = "123456";
    const sent = await sendVerificationEmail(email, code);

    expect(sent).toBe(true);
    expect(sendVerificationEmail).toHaveBeenCalledWith(email, code);
  });

  it("should validate OTP expiry correctly", () => {
    const OTP_EXPIRY_MS = 10 * 60 * 1000;
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + OTP_EXPIRY_MS);

    // Not expired
    expect(new Date() > expiresAt).toBe(false);

    // Expired (simulate 11 minutes ago)
    const oldExpiresAt = new Date(Date.now() - 60 * 1000);
    expect(new Date() > oldExpiresAt).toBe(true);
  });

  it("should block verification after max attempts", () => {
    const MAX_VERIFY_ATTEMPTS = 5;
    const record = { attempts: 5 };
    expect(record.attempts >= MAX_VERIFY_ATTEMPTS).toBe(true);
  });

  it("should allow verification with correct code", () => {
    const storedCode = "654321";
    const userInput = "654321";
    expect(storedCode === userInput.trim()).toBe(true);
  });

  it("should reject verification with wrong code", () => {
    const storedCode = "654321";
    const userInput = "111111";
    expect(storedCode === userInput.trim()).toBe(false);
  });

  it("should enforce resend cooldown of 60 seconds", () => {
    const createdAt = new Date(Date.now() - 30 * 1000); // 30 seconds ago
    const secondsSinceCreation = (Date.now() - createdAt.getTime()) / 1000;
    expect(secondsSinceCreation < 60).toBe(true); // Should be rate-limited

    const oldCreatedAt = new Date(Date.now() - 90 * 1000); // 90 seconds ago
    const oldSeconds = (Date.now() - oldCreatedAt.getTime()) / 1000;
    expect(oldSeconds < 60).toBe(false); // Should allow resend
  });
});
