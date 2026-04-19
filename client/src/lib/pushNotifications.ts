/**
 * Push Notifications — Capacitor client-side integration
 *
 * Handles:
 * 1. Requesting push notification permissions (iOS/Android)
 * 2. Registering the FCM/APNs token with the server
 * 3. Handling foreground/background notification events
 *
 * Only active on native platforms (iOS/Android).
 * On web, this module is a no-op.
 */

import { Capacitor } from "@capacitor/core";
import { PushNotifications } from "@capacitor/push-notifications";
import type { Token, PushNotificationSchema, ActionPerformed } from "@capacitor/push-notifications";

/** Returns true if running on a native platform (iOS or Android) */
export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

/** Callback type for when a token is received */
type TokenCallback = (token: string, platform: "ios" | "android") => void;

/** Callback type for when a notification is received in foreground */
type NotificationCallback = (notification: PushNotificationSchema) => void;

/** Callback type for when user taps a notification */
type NotificationActionCallback = (action: ActionPerformed) => void;

let _tokenCallback: TokenCallback | null = null;
let _notificationCallback: NotificationCallback | null = null;
let _actionCallback: NotificationActionCallback | null = null;
let _initialized = false;

/**
 * Initialize push notifications on native platforms.
 * Call this once at app startup (e.g., in App.tsx useEffect).
 *
 * @param onToken - Called when a push token is received/refreshed
 * @param onNotification - Called when a notification arrives in foreground
 * @param onAction - Called when user taps a notification
 */
export async function initPushNotifications(
  onToken?: TokenCallback,
  onNotification?: NotificationCallback,
  onAction?: NotificationActionCallback,
): Promise<void> {
  if (!isNativePlatform()) return;
  if (_initialized) return;
  _initialized = true;

  _tokenCallback = onToken ?? null;
  _notificationCallback = onNotification ?? null;
  _actionCallback = onAction ?? null;

  // Request permission
  const permStatus = await PushNotifications.requestPermissions();
  if (permStatus.receive !== "granted") {
    console.log("[Push] Permission not granted:", permStatus.receive);
    return;
  }

  // Register with FCM/APNs
  await PushNotifications.register();

  // Listen for token
  PushNotifications.addListener("registration", (token: Token) => {
    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    console.log("[Push] Token received:", token.value.substring(0, 20) + "...");
    _tokenCallback?.(token.value, platform);
  });

  // Listen for registration errors
  PushNotifications.addListener("registrationError", (error: unknown) => {
    console.error("[Push] Registration error:", error);
  });

  // Listen for foreground notifications
  PushNotifications.addListener(
    "pushNotificationReceived",
    (notification: PushNotificationSchema) => {
      console.log("[Push] Foreground notification:", notification.title);
      _notificationCallback?.(notification);
    },
  );

  // Listen for notification tap (background/killed)
  PushNotifications.addListener(
    "pushNotificationActionPerformed",
    (action: ActionPerformed) => {
      console.log("[Push] Notification tapped:", action.notification.title);
      _actionCallback?.(action);
    },
  );
}

/**
 * Get the current push token (if available).
 * Returns null on web or if not yet registered.
 */
export async function getCurrentPushToken(): Promise<string | null> {
  if (!isNativePlatform()) return null;
  try {
    // Re-register to get the current token
    await PushNotifications.register();
    return null; // Token is returned via the 'registration' listener
  } catch {
    return null;
  }
}

/**
 * Remove all delivered notifications from the notification center.
 */
export async function clearDeliveredNotifications(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await PushNotifications.removeAllDeliveredNotifications();
  } catch {
    // Ignore errors
  }
}
