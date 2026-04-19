/**
 * IAP server-side verification via RevenueCat REST API.
 *
 * This module provides a REST endpoint /api/iap/verify that:
 * 1. Receives a transaction ID and product ID from the client
 * 2. Optionally verifies the transaction with RevenueCat REST API
 * 3. Credits tenge to the player via creditTengeIAP()
 *
 * HOW TO ACTIVATE REVENUECAT SERVER-SIDE VERIFICATION:
 * 1. Get your RevenueCat Secret API Key from:
 *    https://app.revenuecat.com → Project → API Keys → Secret keys
 * 2. Add REVENUECAT_SECRET_KEY to your environment secrets
 * 3. The endpoint will then verify each transaction with RevenueCat before crediting
 *
 * Without REVENUECAT_SECRET_KEY, the endpoint still works but skips server-side
 * verification (relies on client-side RevenueCat SDK validation instead).
 */
import { type Express, type Request, type Response } from "express";
import { creditTengeIAP, getProfileByUserId } from "./db";
import { activatePremiumIAP, getPremiumStats } from "./premiumDb";
import { incrementAchievementProgress } from "./achievementsDb";
import { sdk } from "./_core/sdk";

const PRODUCT_TENGE: Record<string, number> = {
  durak_tenge_100: 100,
  durak_tenge_500: 500,
  durak_tenge_1000: 1000,
  durak_tenge_5000: 5000,
};

/**
 * Verify a transaction with RevenueCat REST API.
 * Returns true if the transaction is valid, false otherwise.
 * If REVENUECAT_SECRET_KEY is not set, always returns true (skip verification).
 */
async function verifyWithRevenueCat(
  transactionId: string,
  productId: string,
  platform: "ios" | "android",
): Promise<boolean> {
  const secretKey = process.env.REVENUECAT_SECRET_KEY;
  if (!secretKey) {
    // No secret key — skip server-side verification
    // Client-side RevenueCat SDK already validated the purchase
    return true;
  }

  try {
    // RevenueCat REST API: Get subscriber info
    // The transactionId for iOS is the original_transaction_id
    // For Android it's the purchaseToken
    const url = `https://api.revenuecat.com/v1/receipts`;
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${secretKey}`,
        "Content-Type": "application/json",
        "X-Platform": platform,
      },
      body: JSON.stringify({
        fetch_token: transactionId,
        product_id: productId,
        is_restore: false,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      console.error(`[IAP] RevenueCat verification failed: ${response.status} ${body}`);
      return false;
    }

    return true;
  } catch (err) {
    console.error("[IAP] RevenueCat verification error:", err);
    // On network error, allow the purchase to proceed
    // (better to credit than to lose a legitimate purchase)
    return true;
  }
}

/**
 * Register IAP REST routes on the Express app.
 * Call this in server/_core/index.ts.
 */
export function registerIAPRoutes(app: Express): void {
  /**
   * POST /api/iap/verify
   * Body: { productId, transactionId, platform }
   * Headers: Cookie with JWT session
   *
   * Verifies and credits tenge after a successful in-app purchase.
   */
  app.post("/api/iap/verify", async (req: Request, res: Response) => {
    try {
      // Authenticate user via session cookie (same as tRPC context)
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { productId, transactionId, platform } = req.body as {
        productId?: string;
        transactionId?: string;
        platform?: string;
      };

      // Validate input
      if (!productId || !PRODUCT_TENGE[productId]) {
        res.status(400).json({ error: "Invalid productId" });
        return;
      }
      if (!transactionId || typeof transactionId !== "string" || transactionId.length > 255) {
        res.status(400).json({ error: "Invalid transactionId" });
        return;
      }
      if (platform !== "ios" && platform !== "android") {
        res.status(400).json({ error: "Invalid platform" });
        return;
      }

      // Verify with RevenueCat (if secret key is configured)
      const isValid = await verifyWithRevenueCat(transactionId, productId, platform);
      if (!isValid) {
        res.status(400).json({ error: "Transaction verification failed" });
        return;
      }

      // Credit tenge to the player
      const result = await creditTengeIAP(user.id, productId, transactionId, platform);

      if (!result.success) {
        if (result.reason === "duplicate") {
          // Idempotent — already credited
          const profile = await getProfileByUserId(user.id);
          res.json({ credited: 0, alreadyCredited: true, newBalance: profile?.balanceTenge ?? 0 });
          return;
        }
        res.status(400).json({ error: result.reason ?? "iap_failed" });
        return;
      }

      res.json({
        credited: result.credited,
        newBalance: result.newBalance,
        alreadyCredited: false,
      });
    } catch (err) {
      console.error("[IAP] /api/iap/verify error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  /**
   * POST /api/iap/verify-premium
   * Body: { transactionId, platform }
   * Headers: Cookie with JWT session
   *
   * Verifies a 'premium_monthly' subscription purchase via RevenueCat
   * and activates premium for the user (no tenge deduction).
   */
  app.post("/api/iap/verify-premium", async (req: Request, res: Response) => {
    try {
      // Authenticate user via session cookie
      let user;
      try {
        user = await sdk.authenticateRequest(req);
      } catch {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }
      if (!user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const { transactionId, platform } = req.body as {
        transactionId?: string;
        platform?: string;
      };

      if (!transactionId || typeof transactionId !== "string" || transactionId.length > 255) {
        res.status(400).json({ error: "Invalid transactionId" });
        return;
      }
      if (platform !== "ios" && platform !== "android") {
        res.status(400).json({ error: "Invalid platform" });
        return;
      }

      // Verify with RevenueCat (if secret key is configured)
      const isValid = await verifyWithRevenueCat(transactionId, "premium_monthly", platform);
      if (!isValid) {
        res.status(400).json({ error: "Transaction verification failed" });
        return;
      }

      // Get player profile
      const profile = await getProfileByUserId(user.id);
      if (!profile) {
        res.status(404).json({ error: "Profile not found" });
        return;
      }

      // Activate premium (no tenge deduction)
      const result = await activatePremiumIAP(profile.id);
      if (!result.success) {
        res.status(400).json({ error: result.error ?? "activation_failed" });
        return;
      }

      // Trigger premium achievements
      const premiumStats = await getPremiumStats(profile.id);
      if (premiumStats) {
        const count = premiumStats.premiumPurchaseCount;
        const streak = premiumStats.premiumConsecutiveMonths;
        await incrementAchievementProgress(profile.id, 'premium_player', 0, 1).catch(() => {});
        await incrementAchievementProgress(profile.id, 'legendary_player', 0, Math.min(streak, 2)).catch(() => {});
        await incrementAchievementProgress(profile.id, 'admin_pryanik', 0, Math.min(streak, 3)).catch(() => {});
        await incrementAchievementProgress(profile.id, 'kazakhstan_pride', 0, Math.min(streak, 6)).catch(() => {});
        await incrementAchievementProgress(profile.id, 'elbasy', 0, Math.min(count, 10)).catch(() => {});
      }

      res.json({
        success: true,
        expiresAt: result.expiresAt,
        purchaseCount: result.purchaseCount,
        consecutiveMonths: result.consecutiveMonths,
      });
    } catch (err) {
      console.error("[IAP] /api/iap/verify-premium error:", err);
      res.status(500).json({ error: "Internal server error" });
    }
  });
}
