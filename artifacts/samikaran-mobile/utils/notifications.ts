import * as Notifications from "expo-notifications";
import { Platform } from "react-native";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

// Show alerts + play sound when notification arrives while app is foregrounded
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
  type?: NotificationType;
  screen?: string;
  examId?: string | number;
  attemptId?: string | number;
}

/**
 * Request permission to show notifications.
 * Returns true if granted, false otherwise (or on web).
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
 * Get the Expo push token for this device.
 * Returns null on web or if permission is denied.
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
 * Register this device's push token with the backend.
 * Non-critical — failures are silently ignored.
 */
export async function registerPushToken(
  token: string,
  authToken?: string
): Promise<void> {
  if (!BASE_URL || !authToken) return;
  try {
    await fetch(`${BASE_URL}/api/notifications/register-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${authToken}`,
      },
      credentials: "include",
      body: JSON.stringify({ token, platform: Platform.OS }),
    });
  } catch {
    // Non-critical, ignore
  }
}

/**
 * Map a notification type/data to the in-app route to open.
 */
export function resolveDeepLinkPath(data: NotificationData): string | null {
  switch (data.type) {
    case "exam_reminder":
      return "/(student)/exams";
    case "result_published":
    case "certificate_ready":
      return "/(student)/results";
    case "streak_broken":
      return "/(student)/home";
    default:
      if (data.screen) return data.screen;
      return null;
  }
}
