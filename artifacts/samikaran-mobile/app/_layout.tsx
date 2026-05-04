import {
  Roboto_400Regular,
  Roboto_500Medium,
  Roboto_700Bold,
  Roboto_900Black,
  useFonts,
} from "@expo-google-fonts/roboto";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack, useRouter } from "expo-router";
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
  resolveDeepLinkPath,
} from "@/utils/notifications";

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
  const tokenRegistered = useRef(false);
  const listenerSub = useRef<{ remove: () => void } | null>(null);

  useEffect(() => {
    if (Platform.OS === "web") return;

    let Notifications: typeof import("expo-notifications") | null = null;

    const setup = async () => {
      try {
        Notifications = await import("expo-notifications");
      } catch {
        return;
      }

      // Register token with backend once per session when user is logged in
      if (user && !tokenRegistered.current) {
        tokenRegistered.current = true;
        const token = await getExpoPushToken();
        if (token) {
          await registerPushToken(token, user.token);
        }
      }

      // Foreground notification received — just display it (handler already set)
      const receivedSub = Notifications.addNotificationReceivedListener(
        (_notification) => {
          // No-op: the global handler shows alert + plays sound
        }
      );

      // Tap on notification — navigate to the relevant screen
      const responseSub = Notifications.addNotificationResponseReceivedListener(
        (response) => {
          const data = response.notification.request.content.data as Record<
            string,
            unknown
          >;
          const path = resolveDeepLinkPath({
            type: data.type as any,
            screen: data.screen as string | undefined,
            examId: data.examId as string | undefined,
            attemptId: data.attemptId as string | undefined,
          });
          if (path) {
            router.push(path as any);
          }
        }
      );

      // Handle the notification that launched the app (cold start tap)
      const last =
        await Notifications.getLastNotificationResponseAsync();
      if (last) {
        const data = last.notification.request.content.data as Record<
          string,
          unknown
        >;
        const path = resolveDeepLinkPath({
          type: data.type as any,
          screen: data.screen as string | undefined,
          examId: data.examId as string | undefined,
          attemptId: data.attemptId as string | undefined,
        });
        if (path) {
          setTimeout(() => router.push(path as any), 800);
        }
      }

      listenerSub.current = {
        remove: () => {
          receivedSub.remove();
          responseSub.remove();
        },
      };
    };

    setup();

    return () => {
      listenerSub.current?.remove();
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
