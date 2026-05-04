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

function NotificationBootstrap({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const router = useRouter();
  // Track which user has registered to avoid duplicate registrations and support
  // account switching: a different userId triggers a fresh registration.
  const tokenRegisteredForUserId = useRef<number | null>(null);
  const listenerSub = useRef<{ remove: () => void } | null>(null);
  const permissionRequested = useRef(false);

  // Request permission on first render — no login required.
  useEffect(() => {
    if (Platform.OS === "web") return;
    if (permissionRequested.current) return;
    permissionRequested.current = true;
    requestNotificationPermission();
  }, []);

  // Register push token and set up notification listeners once user is known.
  useEffect(() => {
    if (Platform.OS === "web") return;

    let Notifications: typeof import("expo-notifications") | null = null;

    const setup = async () => {
      try {
        Notifications = await import("expo-notifications");
      } catch {
        return;
      }

      // Register this user's push token — re-runs on account switch.
      if (user && tokenRegisteredForUserId.current !== user.id && user.token) {
        tokenRegisteredForUserId.current = user.id;
        const pushToken = await getExpoPushToken();
        if (pushToken) {
          await registerPushToken(pushToken, user.id, user.token);
        }
      }

      const receivedSub = Notifications.addNotificationReceivedListener(
        (_notification) => {
          // Foreground display handled by setNotificationHandler in notifications.ts
        }
      );

      const responseSub = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data as NotificationData;
          const href: Href | null = resolveNotificationHref(data);
          if (href) router.push(href);
        }
      );

      listenerSub.current = {
        remove: () => {
          receivedSub.remove();
          responseSub.remove();
        },
      };

      // Handle notification that cold-started the app.
      const last = await Notifications.getLastNotificationResponseAsync();
      if (last) {
        const data = last.notification.request.content.data as NotificationData;
        const href: Href | null = resolveNotificationHref(data);
        if (href) {
          setTimeout(() => router.push(href), 800);
        }
      }
    };

    setup();

    return () => {
      listenerSub.current?.remove();
      listenerSub.current = null;
    };
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
