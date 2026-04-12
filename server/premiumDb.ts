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

/** Check and update premium status — expires if past expiry date */
export async function checkAndUpdatePremiumStatus(profileId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const [profile] = await db
    .select({ isPremium: playerProfiles.isPremium, premiumExpiresAt: playerProfiles.premiumExpiresAt })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);

  if (!profile) return false;

  if (profile.isPremium && profile.premiumExpiresAt && profile.premiumExpiresAt < new Date()) {
    await db.update(playerProfiles).set({ isPremium: false }).where(eq(playerProfiles.id, profileId));
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
    .select({ isPremium: playerProfiles.isPremium, premiumExpiresAt: playerProfiles.premiumExpiresAt })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);

  if (!profile) return { isPremium: false, premiumExpiresAt: null, daysRemaining: null };

  if (profile.isPremium && profile.premiumExpiresAt && profile.premiumExpiresAt < new Date()) {
    await db.update(playerProfiles).set({ isPremium: false }).where(eq(playerProfiles.id, profileId));
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
    })
    .from(playerProfiles)
    .where(eq(playerProfiles.id, profileId))
    .limit(1);

  if (!profile) return { success: false, error: "profile_not_found" };

  if (profile.balanceTenge < PREMIUM_COST_TENGE) {
    return { success: false, error: "insufficient_tenge" };
  }

  const now = new Date();
  const currentExpiry =
    profile.isPremium && profile.premiumExpiresAt && profile.premiumExpiresAt > now
      ? profile.premiumExpiresAt
      : now;
  const newExpiry = new Date(currentExpiry.getTime() + PREMIUM_DURATION_MS);
  const newBalance = profile.balanceTenge - PREMIUM_COST_TENGE;

  await db
    .update(playerProfiles)
    .set({ balanceTenge: newBalance, isPremium: true, premiumExpiresAt: newExpiry })
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
