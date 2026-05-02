import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/StatCard";

export default function SchoolHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const quickActions = [
    { icon: "person-add", label: "Add Student", color: colors.primary },
    { icon: "cloud-upload", label: "Bulk Upload", color: "#FF2FBF" },
    { icon: "calendar", label: "Olympiad Calendar", color: "#F5C518" },
    { icon: "receipt", label: "Billing", color: colors.success },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0D0A1E", "#1a1033", colors.background]}
        style={[styles.headerGrad, { paddingTop: topPad + 16 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: "rgba(255,255,255,0.7)", fontFamily: "Roboto_400Regular" }]}>
              School Dashboard
            </Text>
            <Text style={[styles.name, { color: "#fff", fontFamily: "Roboto_700Bold" }]}>
              {user?.fullName ?? "School Admin"}
            </Text>
          </View>
          <TouchableOpacity style={[styles.iconBtn, { backgroundColor: "#fff20" }]} onPress={async () => { await logout(); router.replace("/login"); }}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 84) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <StatCard icon="people" value="1,240" label="Total Students" color={colors.primary} />
          <StatCard icon="school" value="48" label="Classes" color="#FF2FBF" />
          <StatCard icon="trophy" value="89%" label="Pass Rate" color={colors.success} />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>
            Quick Actions
          </Text>
          <View style={styles.actionsGrid}>
            {quickActions.map((action) => (
              <TouchableOpacity
                key={action.label}
                style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                activeOpacity={0.8}
              >
                <View style={[styles.actionIcon, { backgroundColor: action.color + "20" }]}>
                  <Ionicons name={action.icon as any} size={24} color={action.color} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.foreground, fontFamily: "Roboto_500Medium" }]}>
                  {action.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>
            Upcoming Olympiads
          </Text>
          {[
            { name: "Science Olympiad 2026", date: "Jan 15, 2026", registered: 120 },
            { name: "Mathematics Challenge", date: "Jan 28, 2026", registered: 98 },
          ].map((o) => (
            <View key={o.name} style={[styles.olympiadCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.olympiadDot, { backgroundColor: colors.primary }]} />
              <View style={styles.olympiadInfo}>
                <Text style={[styles.olympiadName, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>{o.name}</Text>
                <Text style={[styles.olympiadDate, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>{o.date}</Text>
              </View>
              <View style={[styles.olympiadCount, { backgroundColor: colors.primary + "20" }]}>
                <Text style={[styles.olympiadCountText, { color: colors.primary, fontFamily: "Roboto_700Bold" }]}>
                  {o.registered}
                </Text>
                <Text style={[styles.olympiadCountLabel, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>
                  registered
                </Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 24, gap: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontSize: 14 },
  name: { fontSize: 22 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 24 },
  statsRow: { flexDirection: "row", gap: 10 },
  section: { gap: 12 },
  sectionTitle: { fontSize: 18 },
  actionsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  actionCard: { width: "47%", alignItems: "center", padding: 16, borderRadius: 14, borderWidth: 1, gap: 10 },
  actionIcon: { width: 52, height: 52, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 13, textAlign: "center" },
  olympiadCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 12 },
  olympiadDot: { width: 8, height: 8, borderRadius: 4 },
  olympiadInfo: { flex: 1 },
  olympiadName: { fontSize: 14 },
  olympiadDate: { fontSize: 12, marginTop: 2 },
  olympiadCount: { alignItems: "center", padding: 8, borderRadius: 10 },
  olympiadCountText: { fontSize: 18 },
  olympiadCountLabel: { fontSize: 10 },
});
