import * as Notifications from "expo-notifications";
import type { Href } from "expo-router";
import { Platform } from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

// Show alerts and play sound when a notification arrives while the app is foregrounded.
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
  | "streak_broken"
  | "profile_update";

export interface NotificationData {
  type?: string;
  screen?: string;
  examId?: string | number;
  attemptId?: string | number;
}

// Request permission to show notifications. Safe to call before login.
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

// Get this device's Expo push token. Returns null on web or if permission denied.
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

// Register this device's push token with the backend using the student session.
// Non-critical — failures are silently ignored.
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
      body: JSON.stringify({ pushToken, userId, sessionToken, platform: Platform.OS }),
    });
  } catch {
    // ignore
  }
}

// Map a notification payload to the Expo Router Href for in-app deep linking.
//
// Destination mapping:
//   exam_reminder    → /(student)/exams   + examId param (screen switches to correct tab)
//   result_published → /(student)/results + examId/attemptId (auto-opens detail card)
//   certificate_ready → /(student)/results + examId (auto-opens result with cert button)
//   streak_broken    → /(student)/home
//   profile_update   → /(student)/profile
export function resolveNotificationHref(data: NotificationData): Href | null {
  const type = data.type as NotificationType | undefined;
  const examId = data.examId != null ? String(data.examId) : undefined;
  const attemptId = data.attemptId != null ? String(data.attemptId) : undefined;

  switch (type) {
    case "exam_reminder":
      return examId
        ? ({ pathname: "/(student)/exams", params: { examId } } as Href)
        : ("/(student)/exams" as Href);

    case "result_published":
    case "certificate_ready":
      return examId
        ? ({
            pathname: "/(student)/results",
            params: { examId, ...(attemptId ? { attemptId } : {}) },
          } as Href)
        : ("/(student)/results" as Href);

    case "streak_broken":
      return "/(student)/home" as Href;

    case "profile_update":
      return "/(student)/profile" as Href;

    default:
      if (data.screen) return data.screen as Href;
      return null;
  }
}
