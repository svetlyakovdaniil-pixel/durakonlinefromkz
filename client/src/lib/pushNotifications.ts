/**
 * Firebase Cloud Messaging integration for native platforms.
 *
 * The generic Capacitor push plugin returns an APNs token on iOS. The server
 * sends through Firebase Admin, so this module must register and persist an
 * actual FCM token instead.
 */

import { Capacitor } from "@capacitor/core";
import { FirebaseMessaging } from "@capacitor-firebase/messaging";

export function isNativePlatform(): boolean {
  return Capacitor.isNativePlatform();
}

type TokenCallback = (token: string, platform: "ios" | "android") => void;
type NotificationCallback = (notification: any) => void;
type NotificationActionCallback = (action: any) => void;

let _tokenCallback: TokenCallback | null = null;
let _notificationCallback: NotificationCallback | null = null;
let _actionCallback: NotificationActionCallback | null = null;
let _initialized = false;

export async function initPushNotifications(
  onToken?: TokenCallback,
  onNotification?: NotificationCallback,
  onAction?: NotificationActionCallback,
): Promise<void> {
  if (!isNativePlatform() || _initialized) return;

  _tokenCallback = onToken ?? null;
  _notificationCallback = onNotification ?? null;
  _actionCallback = onAction ?? null;

  const permission = await FirebaseMessaging.requestPermissions();
  if (permission.receive !== "granted") {
    console.log("[Push] Permission not granted:", permission.receive);
    return;
  }

  // Register listeners before asking Firebase for a token so refresh events
  // cannot be missed during native startup.
  await FirebaseMessaging.addListener("tokenReceived", ({ token }) => {
    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    console.log("[Push] FCM token received:", token.substring(0, 20) + "...");
    _tokenCallback?.(token, platform);
  });
  await FirebaseMessaging.addListener("notificationReceived", ({ notification }) => {
    console.log("[Push] Foreground notification:", notification.title);
    _notificationCallback?.(notification);
  });
  await FirebaseMessaging.addListener("notificationActionPerformed", (action) => {
    console.log("[Push] Notification tapped:", action.notification.title);
    _actionCallback?.(action);
  });

  try {
    const { token } = await FirebaseMessaging.getToken();
    const platform = Capacitor.getPlatform() === "ios" ? "ios" : "android";
    _tokenCallback?.(token, platform);
    _initialized = true;
  } catch (error) {
    console.error("[Push] FCM registration error:", error);
  }
}

export async function getCurrentPushToken(): Promise<string | null> {
  if (!isNativePlatform()) return null;
  try {
    const { token } = await FirebaseMessaging.getToken();
    return token;
  } catch {
    return null;
  }
}

export async function clearDeliveredNotifications(): Promise<void> {
  if (!isNativePlatform()) return;
  try {
    await FirebaseMessaging.removeAllDeliveredNotifications();
  } catch {
    // Ignore notification-center cleanup failures.
  }
}
