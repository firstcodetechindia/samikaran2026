import * as Notifications from "expo-notifications";
import type { Href } from "expo-router";
import { Platform } from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

// Configure foreground notification display — call once at module load
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export type NotificationType =
  | "exam_reminder"
  | "result_published"
  | "certificate_ready"
  | "streak_broken";

export interface NotificationData {
  type?: string;
  screen?: string;
  examId?: string | number;
  attemptId?: string | number;
}

/**
 * Request push notification permission.
 * Returns true if granted; false on web or if denied.
 * Safe to call before login — no auth required.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (Platform.OS === "web") return false;
  try {
    const { status: existing } = await Notifications.getPermissionsAsync();
    if (existing === "granted") return true;
    const { status } = await Notifications.requestPermissionsAsync();
    return status === "granted";
  } catch {
    return false;
  }
}

/**
 * Get this device's Expo push token.
 * Returns null on web or if permission denied.
 */
export async function getExpoPushToken(): Promise<string | null> {
  if (Platform.OS === "web") return null;
  try {
    const granted = await requestNotificationPermission();
    if (!granted) return null;
    const tokenData = await Notifications.getExpoPushTokenAsync();
    return tokenData.data;
  } catch {
    return null;
  }
}

/**
 * Register this device's Expo push token with the backend.
 * Uses the student custom session (userId + sessionToken), NOT Replit OIDC.
 * Non-critical — failures are silently ignored.
 */
export async function registerPushToken(
  pushToken: string,
  userId: number,
  sessionToken: string
): Promise<void> {
  if (!BASE_URL || !userId || !sessionToken) return;
  try {
    await fetch(`${BASE_URL}/api/notifications/register-token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        pushToken,
        userId,
        sessionToken,
        platform: Platform.OS,
      }),
    });
  } catch {
    // Non-critical, ignore silently
  }
}

/**
 * Map notification data to an in-app Expo Router href.
 *
 * Destination contract:
 *   exam_reminder  → /(student)/exams   (upcoming exams list)
 *   result_published → /(student)/results
 *   certificate_ready → /(student)/results
 *   streak_broken  → /(student)/home
 *   fallback       → explicit screen field if provided, else null
 */
export function resolveNotificationHref(
  data: NotificationData
): Href | null {
  const type = data.type as NotificationType | undefined;

  switch (type) {
    case "exam_reminder":
      return "/(student)/exams" as Href;
    case "result_published":
    case "certificate_ready":
      return "/(student)/results" as Href;
    case "streak_broken":
      return "/(student)/home" as Href;
    default:
      if (data.screen) return data.screen as Href;
      return null;
  }
}
