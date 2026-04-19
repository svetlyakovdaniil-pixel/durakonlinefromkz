/**
 * Test to validate RevenueCat secret key configuration.
 * This test verifies that REVENUECAT_SECRET_KEY is set and can reach the RevenueCat API.
 */
import { describe, it, expect } from "vitest";

describe("RevenueCat configuration", () => {
  it("should have REVENUECAT_SECRET_KEY set in environment", () => {
    const secretKey = process.env.REVENUECAT_SECRET_KEY;
    expect(secretKey).toBeDefined();
    expect(secretKey).not.toBe("");
    // RevenueCat secret keys start with 'sk_'
    expect(secretKey).toMatch(/^sk_/);
  });

  it("should have REVENUECAT_ANDROID_API_KEY set in environment", () => {
    const androidKey = process.env.REVENUECAT_ANDROID_API_KEY;
    expect(androidKey).toBeDefined();
    expect(androidKey).not.toBe("");
    // Android keys start with 'goog_'
    expect(androidKey).toMatch(/^goog_/);
  });

  it("should have REVENUECAT_IOS_API_KEY set in environment", () => {
    const iosKey = process.env.REVENUECAT_IOS_API_KEY;
    expect(iosKey).toBeDefined();
    expect(iosKey).not.toBe("");
  });

  it("should have VITE_REVENUECAT_IOS_KEY set in environment", () => {
    const iosKey = process.env.VITE_REVENUECAT_IOS_KEY;
    expect(iosKey).toBeDefined();
    expect(iosKey).not.toBe("");
  });

  it("should have VITE_REVENUECAT_ANDROID_KEY set in environment", () => {
    const androidKey = process.env.VITE_REVENUECAT_ANDROID_KEY;
    expect(androidKey).toBeDefined();
    expect(androidKey).not.toBe("");
    // Android keys start with 'goog_'
    expect(androidKey).toMatch(/^goog_/);
  });

  it("should be able to reach RevenueCat API with the secret key", { timeout: 15000 }, async () => {
    const secretKey = process.env.REVENUECAT_SECRET_KEY;
    if (!secretKey) {
      // Skip if not configured
      return;
    }

    // Test by hitting the RevenueCat subscribers endpoint
    const response = await fetch("https://api.revenuecat.com/v1/subscribers/test_user_check", {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        "X-Platform": "android",
      },
    });

    // RevenueCat returns 200 (subscriber exists), 404 (not found), or 403 (forbidden) for valid keys
    // 401 means invalid key
    expect(response.status).not.toBe(401);
    expect([200, 404, 403]).toContain(response.status);
  });
});
