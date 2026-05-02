import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function ProfileScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const handleLogout = () => {
    Alert.alert("Logout", "Are you sure you want to logout?", [
      { text: "Cancel", style: "cancel" },
      { text: "Logout", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } },
    ]);
  };

  const menuItems = [
    { icon: "school-outline", label: "My Exams", onPress: () => router.push("/(student)/exams") },
    { icon: "bar-chart-outline", label: "Performance Analytics", onPress: () => router.push("/(student)/results") },
    { icon: "ribbon-outline", label: "My Certificates", onPress: () => {} },
    { icon: "book-outline", label: "Study Library", onPress: () => {} },
    { icon: "chatbubble-ellipses-outline", label: "TARA AI Assistant", onPress: () => {} },
    { icon: "notifications-outline", label: "Notifications", onPress: () => {} },
    { icon: "shield-outline", label: "Privacy & Security", onPress: () => {} },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0D0A1E", "#1a1033", colors.background]}
        style={[styles.headerGrad, { paddingTop: topPad + 16 }]}
      >
        <View style={[styles.avatar, { backgroundColor: colors.primary + "30", borderColor: colors.primary }]}>
          <Text style={[styles.avatarText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
            {(user?.fullName ?? "S").charAt(0).toUpperCase()}
          </Text>
        </View>
        <Text style={[styles.name, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
          {user?.fullName ?? "Student"}
        </Text>
        <Text style={[styles.username, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
          @{user?.username ?? "student"} · Class {user?.grade ?? "—"}
        </Text>
        <View style={styles.statsRow}>
          {[
            { label: "Level", value: user?.level ?? 1 },
            { label: "XP", value: user?.xp?.toLocaleString() ?? 0 },
            { label: "Streak", value: `${user?.streak ?? 0}d` },
          ].map((s) => (
            <View key={s.label} style={styles.statItem}>
              <Text style={[styles.statValue, { color: "#fff", fontFamily: "Inter_700Bold" }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>{s.label}</Text>
            </View>
          ))}
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 84) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.menuCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {menuItems.map((item, idx) => (
            <TouchableOpacity
              key={item.label}
              style={[
                styles.menuItem,
                idx < menuItems.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: colors.muted }]}>
                <Ionicons name={item.icon as any} size={18} color={colors.primary} />
              </View>
              <Text style={[styles.menuLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                {item.label}
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.mutedForeground} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive }]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive, fontFamily: "Inter_600SemiBold" }]}>
            Logout
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { alignItems: "center", paddingBottom: 24, paddingHorizontal: 20, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  avatarText: { fontSize: 32 },
  name: { fontSize: 22 },
  username: { fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 32, marginTop: 8 },
  statItem: { alignItems: "center", gap: 2 },
  statValue: { fontSize: 20 },
  statLabel: { fontSize: 12 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  menuCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  menuItem: { flexDirection: "row", alignItems: "center", padding: 16, gap: 12 },
  menuIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  menuLabel: { flex: 1, fontSize: 15 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 14, borderWidth: 1 },
  logoutText: { fontSize: 15 },
});
