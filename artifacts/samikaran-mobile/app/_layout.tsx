import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black,
  useFonts,
} from "@expo-google-fonts/roboto";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
import type { Href } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { KeyboardProvider } from "react-native-keyboard-controller";
import { SafeAreaProvider } from "react-native-safe-area-context";

import { ErrorBoundary } from "@/components/ErrorBoundary";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import {
  getExpoPushToken,
  registerPushToken,
  requestNotificationPermission,
  resolveNotificationHref,
} from "@/utils/notifications";
import type { NotificationData } from "@/utils/notifications";

SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="onboarding" />
      <Stack.Screen name="login" />
      <Stack.Screen name="(student)" />
      <Stack.Screen name="(school)" />
      <Stack.Screen name="(parent)" />
      <Stack.Screen name="(partner)" />
      <Stack.Screen
        name="exam-check"
        options={{ presentation: "card", animation: "slide_from_right" }}
      />
      <Stack.Screen
        name="exam-take"
        options={{
          presentation: "fullScreenModal",
          animation: "slide_from_bottom",
          gestureEnabled: false,
        }}
      />
    </Stack>
  );
}

/**
 * NotificationBootstrap handles all push notification lifecycle:
 *  1. Request permission on first render (before login — no auth needed)
 *  2. Register push token with backend once user is authenticated
 *  3. Set up foreground/tap listeners for in-app deep linking
 *  4. Handle cold-start tap (app opened from notification)
 */
function NotificationBootstrap({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  const tokenRegistered = useRef(false);
  const listenerSub = useRef<{ remove: () => void } | null>(null);
  const permissionRequested = useRef(false);

  // ── Step 1: Request permission on first launch (no login required) ───────
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (permissionRequested.current) return;
    permissionRequested.current = true;
    requestNotificationPermission();
  }, []);

  // ── Step 2 & 3: Register token + set up listeners once user is known ─────
  useEffect(() => {
    if (Platform.OS === "web") return;

    let Notifications: typeof import("expo-notifications") | null = null;

    const setup = async () => {
      try {
        Notifications = await import("expo-notifications");
      } catch {
        return;
      }

      // Register push token with backend once per session when user is logged in
      if (user && !tokenRegistered.current && user.token) {
        tokenRegistered.current = true;
        const pushToken = await getExpoPushToken();
        if (pushToken) {
          await registerPushToken(pushToken, user.id, user.token);
        }
      }

      // Foreground notification received — global handler already shows alert
      const receivedSub = Notifications.addNotificationReceivedListener(
        (_notification) => {
          // No additional action — the setNotificationHandler in notifications.ts handles display
        }
      );

      // Tap on a notification while app is foregrounded or backgrounded
      const responseSub =
        Notifications.addNotificationResponseReceivedListener((response) => {
          const raw = response.notification.request.content.data as NotificationData;
          const href: Href | null = resolveNotificationHref(raw);
          if (href) {
            router.push(href);
          }
        });

      listenerSub.current = {
        remove: () => {
          receivedSub.remove();
          responseSub.remove();
        },
      };

      // ── Step 4: Cold-start — app was opened by tapping a notification ──
      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) {
        const raw = last.notification.request.content.data as NotificationData;
        const href: Href | null = resolveNotificationHref(raw);
        if (href) {
          // Slight delay lets the navigator finish mounting before push
          setTimeout(() => router.push(href), 800);
        }
      }
    };

    setup();

    return () => {
      listenerSub.current?.remove();
      listenerSub.current = null;
    };
    // Depend on user.id so we re-run on login/logout
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  return <>{children}</>;
}

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Roboto_400Regular,
    Roboto_500Medium,
    Roboto_700Bold,
    Roboto_900Black,
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  if (!fontsLoaded && !fontError) return null;

  return (
    <SafeAreaProvider>
      <ErrorBoundary>
        <QueryClientProvider client={queryClient}>
          <GestureHandlerRootView style={{ flex: 1 }}>
            <KeyboardProvider>
              <AuthProvider>
                <NotificationBootstrap>
                  <RootLayoutNav />
                </NotificationBootstrap>
              </AuthProvider>
            </KeyboardProvider>
          </GestureHandlerRootView>
        </QueryClientProvider>
      </ErrorBoundary>
    </SafeAreaProvider>
  );
}
