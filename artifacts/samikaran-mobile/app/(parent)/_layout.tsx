import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import { useColors } from "@/hooks/useColors";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function ParentLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";
  const insets = useSafeAreaInsets();

  if (isLiquidGlassAvailable()) {
    return (
      <NativeTabs>
        <NativeTabs.Trigger name="home"><Icon sf={{ default: "house", selected: "house.fill" }} /><Label>Home</Label></NativeTabs.Trigger>
        <NativeTabs.Trigger name="profile"><Icon sf={{ default: "person", selected: "person.fill" }} /><Label>Profile</Label></NativeTabs.Trigger>
      </NativeTabs>
    );
  }

  return (
    <Tabs screenOptions={{ headerShown: false, tabBarActiveTintColor: colors.primary, tabBarInactiveTintColor: colors.mutedForeground, tabBarStyle: { position: "absolute", backgroundColor: isIOS ? "transparent" : colors.card, borderTopWidth: 1, borderTopColor: colors.border, elevation: 0, height: isWeb ? 84 : 60 + insets.bottom, paddingBottom: isWeb ? 34 : insets.bottom }, tabBarBackground: () => isIOS ? <BlurView intensity={100} tint={isDark ? "dark" : "light"} style={StyleSheet.absoluteFill} /> : isWeb ? <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} /> : null }}>
      <Tabs.Screen name="home" options={{ title: "Home", tabBarIcon: ({ color }) => <Ionicons name="home" size={22} color={color} /> }} />
      <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <Ionicons name="person" size={22} color={color} /> }} />
    </Tabs>
  );
}
