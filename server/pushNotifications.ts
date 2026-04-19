/**
 * Push Notifications — Firebase Cloud Messaging (FCM)
 *
 * Sends push notifications to iOS/Android devices via FCM.
 * Requires FIREBASE_SERVICE_ACCOUNT_KEY env var (JSON string of the service account).
 *
 * All public functions are safe to call even if FCM is not configured —
 * they will log a warning and return without throwing.
 */

import { getDb } from "./db";
import { pushTokens, pushNotificationSettings } from "../drizzle/schema";
import { eq, and, inArray } from "drizzle-orm";

/** Convenience wrapper — always use this instead of bare db */
async function db() { return getDb(); }

// ─── Types ────────────────────────────────────────────────────────────────────

export type PushNotifType =
  | "your_turn"
  | "friend_request"
  | "shanyrak_refill"
  | "room_invite"
  | "daily_quest"
  | "season_ending"
  | "reward_received"
  | "new_update";

interface PushPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  /** Badge count for iOS (optional) */
  badge?: number;
}

// ─── FCM initialisation (lazy) ────────────────────────────────────────────────

let _app: import("firebase-admin/app").App | null = null;
let _messaging: import("firebase-admin/messaging").Messaging | null = null;
let _initAttempted = false;

function getMessaging(): import("firebase-admin/messaging").Messaging | null {
  if (_initAttempted) return _messaging;
  _initAttempted = true;

  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  if (!raw) {
    console.warn("[Push] FIREBASE_SERVICE_ACCOUNT_KEY not set — push notifications disabled");
    return null;
  }

  try {
    const { initializeApp, cert, getApps } = require("firebase-admin/app");
    const { getMessaging: _getMsg } = require("firebase-admin/messaging");

    if (getApps().length === 0) {
      _app = initializeApp({ credential: cert(JSON.parse(raw)) });
    } else {
      _app = getApps()[0];
    }
    _messaging = _getMsg(_app);
    console.log("[Push] Firebase Admin SDK initialised");
    return _messaging;
  } catch (err) {
    console.error("[Push] Failed to initialise Firebase Admin SDK:", err);
    return null;
  }
}

// ─── DB helpers ───────────────────────────────────────────────────────────────

/** Get all FCM tokens for a player (may be multiple devices) */
export async function getTokensForProfile(profileId: number): Promise<string[]> {
  const d = await db();
  const rows = await d.select({ token: pushTokens.token })
    .from(pushTokens)
    .where(eq(pushTokens.profileId, profileId));
  return rows.map((r: { token: string }) => r.token);
}

/** Get all FCM tokens for multiple players */
export async function getTokensForProfiles(profileIds: number[]): Promise<Map<number, string[]>> {
  if (profileIds.length === 0) return new Map();
  const d = await db();
  const rows = await d.select({ profileId: pushTokens.profileId, token: pushTokens.token })
    .from(pushTokens)
    .where(inArray(pushTokens.profileId, profileIds));
  const map = new Map<number, string[]>();
  for (const row of rows) {
    if (!map.has(row.profileId)) map.set(row.profileId, []);
    map.get(row.profileId)!.push(row.token);
  }
  return map;
}

/** Check if a player has a specific notification type enabled (default: true if no row) */
export async function isPushEnabled(profileId: number, type: PushNotifType): Promise<boolean> {
  const d = await db();
  const rows = await d.select({ enabled: pushNotificationSettings.enabled })
    .from(pushNotificationSettings)
    .where(and(
      eq(pushNotificationSettings.profileId, profileId),
      eq(pushNotificationSettings.notifType, type),
    ))
    .limit(1);
  if (rows.length === 0) return true; // default: enabled
  return rows[0].enabled;
}

/** Register or update a push token for a player */
export async function upsertPushToken(
  profileId: number,
  token: string,
  platform: "ios" | "android" | "web",
  appVersion?: string,
): Promise<void> {
  // Check if token already exists
  const d = await db();
  const existing = await d.select({ id: pushTokens.id })
    .from(pushTokens)
    .where(and(eq(pushTokens.profileId, profileId), eq(pushTokens.token, token)))
    .limit(1);

  if (existing.length > 0) {
    // Update updatedAt and appVersion
    await d.update(pushTokens)
      .set({ updatedAt: new Date(), appVersion: appVersion ?? null })
      .where(eq(pushTokens.id, existing[0].id));
  } else {
    await d.insert(pushTokens).values({
      profileId,
      token,
      platform,
      appVersion: appVersion ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }
}

/** Remove a push token (on logout or token refresh) */
export async function removePushToken(profileId: number, token: string): Promise<void> {
  const d = await db();
  await d.delete(pushTokens)
    .where(and(eq(pushTokens.profileId, profileId), eq(pushTokens.token, token)));
}

/** Remove all push tokens for a player (on account delete) */
export async function removeAllPushTokens(profileId: number): Promise<void> {
  const d = await db();
  await d.delete(pushTokens).where(eq(pushTokens.profileId, profileId));
}

/** Get push notification settings for a player (returns map of type -> enabled) */
export async function getPushSettings(profileId: number): Promise<Record<PushNotifType, boolean>> {
  const d = await db();
  const rows = await d.select()
    .from(pushNotificationSettings)
    .where(eq(pushNotificationSettings.profileId, profileId));

  const defaults: Record<PushNotifType, boolean> = {
    your_turn: true,
    friend_request: true,
    shanyrak_refill: true,
    room_invite: true,
    daily_quest: true,
    season_ending: true,
    reward_received: true,
    new_update: true,
  };

  for (const row of rows) {
    if (row.notifType in defaults) {
      (defaults as any)[row.notifType] = row.enabled;
    }
  }
  return defaults;
}

/** Update a single push notification setting for a player */
export async function updatePushSetting(
  profileId: number,
  notifType: PushNotifType,
  enabled: boolean,
): Promise<void> {
  const d = await db();
  const existing = await d.select({ id: pushNotificationSettings.id })
    .from(pushNotificationSettings)
    .where(and(
      eq(pushNotificationSettings.profileId, profileId),
      eq(pushNotificationSettings.notifType, notifType),
    ))
    .limit(1);

  if (existing.length > 0) {
    await d.update(pushNotificationSettings)
      .set({ enabled, updatedAt: new Date() })
      .where(eq(pushNotificationSettings.id, existing[0].id));
  } else {
    await d.insert(pushNotificationSettings).values({
      profileId,
      notifType,
      enabled,
      updatedAt: new Date(),
    });
  }
}

// ─── Core send function ───────────────────────────────────────────────────────

/**
 * Send a push notification to a list of FCM tokens.
 * Automatically removes invalid/expired tokens from the DB.
 */
async function sendToTokens(
  tokens: string[],
  payload: PushPayload,
  profileId?: number,
): Promise<void> {
  if (tokens.length === 0) return;
  const messaging = getMessaging();
  if (!messaging) return;

  const { title, body, data = {}, badge } = payload;

  try {
    const response = await messaging.sendEachForMulticast({
      tokens,
      notification: { title, body },
      data,
      apns: {
        payload: {
          aps: {
            badge,
            sound: "default",
          },
        },
      },
      android: {
        notification: {
          sound: "default",
          priority: "high",
        },
        priority: "high",
      },
    });

    // Remove invalid tokens
    if (response.failureCount > 0 && profileId !== undefined) {
      const invalidTokens: string[] = [];
      response.responses.forEach((resp, idx) => {
        if (!resp.success) {
          const code = resp.error?.code;
          if (
            code === "messaging/invalid-registration-token" ||
            code === "messaging/registration-token-not-registered"
          ) {
            invalidTokens.push(tokens[idx]);
          }
        }
      });
      for (const token of invalidTokens) {
        await removePushToken(profileId, token).catch(() => {});
      }
    }
  } catch (err) {
    console.error("[Push] sendToTokens error:", err);
  }
}

// ─── High-level notification functions ────────────────────────────────────────

/**
 * Send "Your turn" push notification to a player.
 * Only sent if the player is not currently connected (checked by caller).
 */
export async function sendYourTurnPush(profileId: number, roomName?: string): Promise<void> {
  if (!(await isPushEnabled(profileId, "your_turn"))) return;
  const tokens = await getTokensForProfile(profileId);
  await sendToTokens(tokens, {
    title: "Ваш ход! 🃏",
    body: roomName ? `Ждём вас в комнате «${roomName}»` : "Сейчас ваша очередь ходить",
    data: { type: "your_turn" },
    badge: 1,
  }, profileId);
}

/**
 * Send "New friend request" push notification.
 */
export async function sendFriendRequestPush(
  profileId: number,
  senderName: string,
): Promise<void> {
  if (!(await isPushEnabled(profileId, "friend_request"))) return;
  const tokens = await getTokensForProfile(profileId);
  await sendToTokens(tokens, {
    title: "Новая заявка в друзья 👥",
    body: `${senderName} хочет добавить вас в друзья`,
    data: { type: "friend_request" },
    badge: 1,
  }, profileId);
}

/**
 * Send "Shanyraks refilled" push notification.
 */
export async function sendShanyrakRefillPush(profileId: number): Promise<void> {
  if (!(await isPushEnabled(profileId, "shanyrak_refill"))) return;
  const tokens = await getTokensForProfile(profileId);
  await sendToTokens(tokens, {
    title: "Шаныраки готовы! 🌟",
    body: "Ваши ежедневные шаныраки снова доступны — заберите их!",
    data: { type: "shanyrak_refill" },
    badge: 1,
  }, profileId);
}

/**
 * Send "Room invite" push notification.
 */
export async function sendRoomInvitePush(
  profileId: number,
  inviterName: string,
  roomName: string,
): Promise<void> {
  if (!(await isPushEnabled(profileId, "room_invite"))) return;
  const tokens = await getTokensForProfile(profileId);
  await sendToTokens(tokens, {
    title: "Приглашение в игру 🎮",
    body: `${inviterName} приглашает вас в комнату «${roomName}»`,
    data: { type: "room_invite" },
    badge: 1,
  }, profileId);
}

/**
 * Send "New daily quest" push notification to all players with tokens.
 * Called by cron job daily.
 */
export async function sendDailyQuestPushToAll(): Promise<void> {
  // Get all distinct profileIds that have tokens
  const d = await db();
  const allTokenRows = await d.select({
    profileId: pushTokens.profileId,
    token: pushTokens.token,
  }).from(pushTokens);

  // Group by profileId
  const byProfile = new Map<number, string[]>();
  for (const row of allTokenRows) {
    if (!byProfile.has(row.profileId)) byProfile.set(row.profileId, []);
    byProfile.get(row.profileId)!.push(row.token);
  }

  // Check settings and send
  for (const [profileId, tokens] of Array.from(byProfile.entries())) {
    if (!(await isPushEnabled(profileId, "daily_quest"))) continue;
    await sendToTokens(tokens, {
      title: "Новые задания! 📋",
      body: "Ежедневные задания обновились — выполняйте и получайте награды",
      data: { type: "daily_quest" },
    }, profileId);
  }
}

/**
 * Send "Season ending soon" push notification to all players with tokens.
 * Called by cron job 3 days before season end.
 */
export async function sendSeasonEndingPushToAll(daysLeft: number): Promise<void> {
  const d2 = await db();
  const allTokenRows = await d2.select({
    profileId: pushTokens.profileId,
    token: pushTokens.token,
  }).from(pushTokens);

  const byProfile = new Map<number, string[]>();
  for (const row of allTokenRows) {
    if (!byProfile.has(row.profileId)) byProfile.set(row.profileId, []);
    byProfile.get(row.profileId)!.push(row.token);
  }

  for (const [profileId, tokens] of Array.from(byProfile.entries())) {
    if (!(await isPushEnabled(profileId, "season_ending"))) continue;
    await sendToTokens(tokens, {
      title: `Сезон заканчивается через ${daysLeft} дн. ⏰`,
      body: "Успейте улучшить свой рейтинг до сброса сезона!",
      data: { type: "season_ending", daysLeft: String(daysLeft) },
    }, profileId);
  }
}

/**
 * Send "Reward received" push notification.
 */
export async function sendRewardReceivedPush(
  profileId: number,
  rewardDescription: string,
): Promise<void> {
  if (!(await isPushEnabled(profileId, "reward_received"))) return;
  const tokens = await getTokensForProfile(profileId);
  await sendToTokens(tokens, {
    title: "Вы получили награду! 🏆",
    body: rewardDescription,
    data: { type: "reward_received" },
    badge: 1,
  }, profileId);
}

/**
 * Send "New update available" push notification to all players with tokens.
 * Called manually by admin via tRPC mutation.
 */
export async function sendNewUpdatePushToAll(version: string, description: string): Promise<void> {
  const d3 = await db();
  const allTokenRows = await d3.select({
    profileId: pushTokens.profileId,
    token: pushTokens.token,
  }).from(pushTokens);

  const byProfile = new Map<number, string[]>();
  for (const row of allTokenRows) {
    if (!byProfile.has(row.profileId)) byProfile.set(row.profileId, []);
    byProfile.get(row.profileId)!.push(row.token);
  }

  for (const [profileId, tokens] of Array.from(byProfile.entries())) {
    if (!(await isPushEnabled(profileId, "new_update"))) continue;
    await sendToTokens(tokens, {
      title: `Обновление ${version} 🚀`,
      body: description,
      data: { type: "new_update", version },
    }, profileId);
  }
}

/**
 * Send shanyrak refill push to all players whose cooldown has expired.
 * Called by cron job every hour to catch players whose 12h cooldown just ended.
 */
export async function sendShanyrakRefillPushToEligible(): Promise<void> {
  // Find players whose lastFreeTopup was ~12h ago (between 12h and 13h ago)
  const now = new Date();
  const twelveHoursAgo = new Date(now.getTime() - 12 * 60 * 60 * 1000);
  const thirteenHoursAgo = new Date(now.getTime() - 13 * 60 * 60 * 1000);

  // Get all token holders
  const d4 = await db();
  const allTokenRows = await d4.select({
    profileId: pushTokens.profileId,
    token: pushTokens.token,
  }).from(pushTokens);

  if (allTokenRows.length === 0) return;

  const byProfile = new Map<number, string[]>();
  for (const row of allTokenRows) {
    if (!byProfile.has(row.profileId)) byProfile.set(row.profileId, []);
    byProfile.get(row.profileId)!.push(row.token);
  }

  // Get profiles with lastFreeTopup in the window
  const { playerProfiles } = await import("../drizzle/schema");
  const profileIds = Array.from(byProfile.keys());
  if (profileIds.length === 0) return;

  const d5 = await db();
  const profiles = await d5.select({
    id: playerProfiles.id,
    lastFreeTopup: playerProfiles.lastFreeTopup,
  }).from(playerProfiles)
    .where(inArray(playerProfiles.id, profileIds));

  for (const profile of profiles) {
    if (!profile.lastFreeTopup) continue;
    const topupTime = new Date(profile.lastFreeTopup).getTime();
    if (topupTime >= thirteenHoursAgo.getTime() && topupTime <= twelveHoursAgo.getTime()) {
      const tokens = byProfile.get(profile.id);
      if (!tokens) continue;
      if (!(await isPushEnabled(profile.id, "shanyrak_refill"))) continue;
      await sendToTokens(tokens, {
        title: "Шаныраки готовы! 🌟",
        body: "Ваши ежедневные шаныраки снова доступны — заберите их!",
        data: { type: "shanyrak_refill" },
        badge: 1,
      }, profile.id);
    }
  }
}
