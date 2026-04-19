import { eq } from "drizzle-orm";
import { getDb } from "./db";
import { playerProfiles, transactions } from "../drizzle/schema";

const PREMIUM_COST_TENGE = 1000;
const PREMIUM_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const MAX_DAILY_SWAPS = 3;

/** Get MSK date string YYYY-MM-DD */
function getMskDateString(): string {
  const now = new Date();
  const msk = new Date(now.getTime() + 3 * 60 * 60 * 1000);
  return msk.toISOString().slice(0, 10);
}

/**
 * Expire premium for a profile: set isPremium=false and, if the player
 * had the premium frame equipped, unequip it automatically.
 */
async function expirePremium(db: NonNullable<Awaited<ReturnType<typeof getDb>>>, profileId: number, currentEquippedFrame?: string | null): Promise<void> {
  const updates: Record<string, unknown> = { isPremium: false };
  // Auto-unequip premium frame when premium expires
  if (currentEquippedFrame === 'premium') {
    updates.equippedFrame = null;
  }
  await db.update(playerProfiles).set(updates as any).where(eq(playerProfiles.id, profileId));
}

/** Check and update premium status — expires if past expiry date */
export async function checkAndUpdatePremiumStatus(profileId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [profile] = await db
    .select({
      isPremium: playerProfiles.isPremium,
      premiumExpiresAt: playerProfiles.premiumExpiresAt,
      equippedFrame: playerProfiles.equippedFrame,
    })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);

  if (!profile) return false;

  if (profile.isPremium && profile.premiumExpiresAt && profile.premiumExpiresAt < new Date()) {
    await expirePremium(db, profileId, profile.equippedFrame);
    return false;
  }

  return profile.isPremium;
}

/** Get premium status for a profile */
export async function getPremiumStatus(profileId: number): Promise<{
  isPremium: boolean;
  premiumExpiresAt: Date | null;
  daysRemaining: number | null;
}> {
  const db = await getDb();
  if (!db) return { isPremium: false, premiumExpiresAt: null, daysRemaining: null };

  const [profile] = await db
    .select({
      isPremium: playerProfiles.isPremium,
      premiumExpiresAt: playerProfiles.premiumExpiresAt,
      equippedFrame: playerProfiles.equippedFrame,
    })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);

  if (!profile) return { isPremium: false, premiumExpiresAt: null, daysRemaining: null };

  if (profile.isPremium && profile.premiumExpiresAt && profile.premiumExpiresAt < new Date()) {
    await expirePremium(db, profileId, profile.equippedFrame);
    return { isPremium: false, premiumExpiresAt: null, daysRemaining: null };
  }

  const daysRemaining = profile.premiumExpiresAt
    ? Math.max(0, Math.ceil((profile.premiumExpiresAt.getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
    : null;

  return {
    isPremium: profile.isPremium,
    premiumExpiresAt: profile.premiumExpiresAt ?? null,
    daysRemaining,
  };
}

/** Buy premium subscription for 1000 tenge (stub) */
export async function buyPremium(profileId: number): Promise<{
  success: boolean;
  error?: string;
  newBalance?: number;
  expiresAt?: Date;
}> {
  const db = await getDb();
  if (!db) return { success: false, error: "db_unavailable" };

  const [profile] = await db
    .select({
      balanceTenge: playerProfiles.balanceTenge,
      isPremium: playerProfiles.isPremium,
      premiumExpiresAt: playerProfiles.premiumExpiresAt,
      premiumPurchaseCount: playerProfiles.premiumPurchaseCount,
      premiumConsecutiveMonths: playerProfiles.premiumConsecutiveMonths,
      lastPremiumPurchaseMonth: playerProfiles.lastPremiumPurchaseMonth,
    })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);

  if (!profile) return { success: false, error: "profile_not_found" };

  // Block purchase if premium is already active (not expired)
  const now = new Date();
  if (profile.isPremium && profile.premiumExpiresAt && profile.premiumExpiresAt > now) {
    return { success: false, error: "already_active" };
  }

  if (profile.balanceTenge < PREMIUM_COST_TENGE) {
    return { success: false, error: "insufficient_tenge" };
  }

  const newExpiry = new Date(now.getTime() + PREMIUM_DURATION_MS);
  const newBalance = profile.balanceTenge - PREMIUM_COST_TENGE;

  // Track consecutive months and total purchase count
  const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const lastMonth = profile.lastPremiumPurchaseMonth ?? null;
  // Consecutive if last purchase was in the immediately preceding month
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
  const newConsecutive = lastMonth === prevMonth ? (profile.premiumConsecutiveMonths ?? 0) + 1 : 1;
  const newPurchaseCount = (profile.premiumPurchaseCount ?? 0) + 1;

  await db
    .update(playerProfiles)
    .set({
      balanceTenge: newBalance,
      isPremium: true,
      premiumExpiresAt: newExpiry,
      premiumPurchaseCount: newPurchaseCount,
      premiumConsecutiveMonths: newConsecutive,
      lastPremiumPurchaseMonth: currentMonth,
    })
    .where(eq(playerProfiles.id, profileId));

  // Record transaction
  await db.insert(transactions).values({
    profileId,
    type: "premium_purchase" as any,
    amount: -PREMIUM_COST_TENGE,
    currency: "tenge",
    description: `Premium subscription (expires ${newExpiry.toISOString().slice(0, 10)})`,
  });

  return { success: true, newBalance, expiresAt: newExpiry };
}

/** Get premium purchase stats for achievement tracking */
export async function getPremiumStats(profileId: number): Promise<{ premiumPurchaseCount: number; premiumConsecutiveMonths: number } | null> {
  const db = await getDb();
  if (!db) return null;
  const [profile] = await db
    .select({
      premiumPurchaseCount: playerProfiles.premiumPurchaseCount,
      premiumConsecutiveMonths: playerProfiles.premiumConsecutiveMonths,
    })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);
  if (!profile) return null;
  return {
    premiumPurchaseCount: profile.premiumPurchaseCount ?? 0,
    premiumConsecutiveMonths: profile.premiumConsecutiveMonths ?? 0,
  };
}

/** Get remaining daily quest swaps for premium player */
export async function getDailyQuestSwapsRemaining(profileId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const [profile] = await db
    .select({
      isPremium: playerProfiles.isPremium,
      dailyQuestSwapsUsed: playerProfiles.dailyQuestSwapsUsed,
      lastQuestSwapDate: playerProfiles.lastQuestSwapDate,
    })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);

  if (!profile || !profile.isPremium) return 0;

  const today = getMskDateString();
  if (profile.lastQuestSwapDate !== today) {
    await db
      .update(playerProfiles)
      .set({ dailyQuestSwapsUsed: 0, lastQuestSwapDate: today })
      .where(eq(playerProfiles.id, profileId));
    return MAX_DAILY_SWAPS;
  }

  return Math.max(0, MAX_DAILY_SWAPS - (profile.dailyQuestSwapsUsed ?? 0));
}

/**
 * Activate premium subscription via IAP (no tenge deduction).
 * Called after a successful RevenueCat in-app purchase of 'premium_monthly'.
 * Handles consecutive month tracking and achievement triggers.
 * If premium is already active, extends by 30 days from current expiry.
 */
export async function activatePremiumIAP(profileId: number): Promise<{
  success: boolean;
  error?: string;
  expiresAt?: Date;
  purchaseCount?: number;
  consecutiveMonths?: number;
}> {
  const db = await getDb();
  if (!db) return { success: false, error: "db_unavailable" };

  const [profile] = await db
    .select({
      isPremium: playerProfiles.isPremium,
      premiumExpiresAt: playerProfiles.premiumExpiresAt,
      premiumPurchaseCount: playerProfiles.premiumPurchaseCount,
      premiumConsecutiveMonths: playerProfiles.premiumConsecutiveMonths,
      lastPremiumPurchaseMonth: playerProfiles.lastPremiumPurchaseMonth,
    })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);

  if (!profile) return { success: false, error: "profile_not_found" };

  const now = new Date();

  // If premium is already active, extend from current expiry; otherwise start from now
  const baseDate =
    profile.isPremium && profile.premiumExpiresAt && profile.premiumExpiresAt > now
      ? profile.premiumExpiresAt
      : now;

  const newExpiry = new Date(baseDate.getTime() + PREMIUM_DURATION_MS);

  // Track consecutive months and total purchase count
  const currentMonth = now.toISOString().slice(0, 7); // YYYY-MM
  const lastMonth = profile.lastPremiumPurchaseMonth ?? null;
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    .toISOString()
    .slice(0, 7);
  const newConsecutive =
    lastMonth === prevMonth ? (profile.premiumConsecutiveMonths ?? 0) + 1 : 1;
  const newPurchaseCount = (profile.premiumPurchaseCount ?? 0) + 1;

  await db
    .update(playerProfiles)
    .set({
      isPremium: true,
      premiumExpiresAt: newExpiry,
      premiumPurchaseCount: newPurchaseCount,
      premiumConsecutiveMonths: newConsecutive,
      lastPremiumPurchaseMonth: currentMonth,
    })
    .where(eq(playerProfiles.id, profileId));

  // Record transaction (no tenge change — IAP purchase)
  await db.insert(transactions).values({
    profileId,
    type: "premium_purchase" as any,
    amount: 0,
    currency: "tenge",
    description: `Premium IAP subscription (expires ${newExpiry.toISOString().slice(0, 10)})`,
  });

  return {
    success: true,
    expiresAt: newExpiry,
    purchaseCount: newPurchaseCount,
    consecutiveMonths: newConsecutive,
  };
}

/** Use one daily quest swap */
export async function useDailyQuestSwap(profileId: number): Promise<{ success: boolean; remaining: number }> {
  const remaining = await getDailyQuestSwapsRemaining(profileId);
  if (remaining <= 0) return { success: false, remaining: 0 };

  const db = await getDb();
  if (!db) return { success: false, remaining: 0 };

  const today = getMskDateString();
  const [profile] = await db
    .select({ dailyQuestSwapsUsed: playerProfiles.dailyQuestSwapsUsed })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);

  const newUsed = (profile?.dailyQuestSwapsUsed ?? 0) + 1;
  await db
    .update(playerProfiles)
    .set({ dailyQuestSwapsUsed: newUsed, lastQuestSwapDate: today })
    .where(eq(playerProfiles.id, profileId));

  return { success: true, remaining: MAX_DAILY_SWAPS - newUsed };
}
