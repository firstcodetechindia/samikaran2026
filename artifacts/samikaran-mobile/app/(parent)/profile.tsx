import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Platform, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function ParentProfile() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#0D0A1E", "#1a1033", colors.background]} style={[styles.header, { paddingTop: topPad + 16 }]}>
        <View style={[styles.avatar, { backgroundColor: colors.primary + "30", borderColor: colors.primary }]}>
          <Ionicons name="people" size={36} color={colors.primary} />
        </View>
        <Text style={[styles.name, { color: "#fff", fontFamily: "Inter_700Bold" }]}>{user?.fullName ?? "Parent"}</Text>
        <Text style={[styles.sub, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>Parent Account</Text>
      </LinearGradient>
      <View style={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) }]}>
        <TouchableOpacity
          style={[styles.logoutBtn, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive }]}
          onPress={() => Alert.alert("Logout", "Sure?", [{ text: "Cancel", style: "cancel" }, { text: "Logout", style: "destructive", onPress: async () => { await logout(); router.replace("/login"); } }])}
        >
          <Ionicons name="log-out-outline" size={18} color={colors.destructive} />
          <Text style={[styles.logoutText, { color: colors.destructive, fontFamily: "Inter_600SemiBold" }]}>Logout</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { alignItems: "center", paddingBottom: 24, paddingHorizontal: 20, gap: 8 },
  avatar: { width: 80, height: 80, borderRadius: 40, alignItems: "center", justifyContent: "center", borderWidth: 2 },
  name: { fontSize: 22 },
  sub: { fontSize: 14 },
  content: { padding: 16 },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 14, borderWidth: 1 },
  logoutText: { fontSize: 15 },
});
