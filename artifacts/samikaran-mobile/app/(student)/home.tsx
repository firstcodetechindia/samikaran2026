import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { StatCard } from "@/components/StatCard";
import { ExamCard } from "@/components/ExamCard";

const BADGES = [
  { icon: "flash", label: "Speed Solver", color: "#F5C518" },
  { icon: "star", label: "Top Scorer", color: "#8A2BE2" },
  { icon: "flame", label: "Streak Master", color: "#FF2FBF" },
];

export default function StudentHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 17) return "Good Afternoon";
    return "Good Evening";
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0D0A1E", "#1a1033", colors.background]}
        style={[styles.headerGrad, { paddingTop: topPad + 16 }]}
      >
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>
              {getGreeting()}
            </Text>
            <Text style={[styles.name, { color: "#fff", fontFamily: "Inter_700Bold" }]}>
              {user?.fullName?.split(" ")[0] ?? "Student"} 👋
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.avatarBtn, { backgroundColor: colors.primary + "30", borderColor: colors.primary }]}
            onPress={() => router.push("/(student)/profile")}
          >
            <Ionicons name="person" size={22} color={colors.primary} />
          </TouchableOpacity>
        </View>

        <View style={styles.xpRow}>
          <View style={styles.xpInfo}>
            <Text style={[styles.levelText, { color: "#FF2FBF", fontFamily: "Inter_700Bold" }]}>
              Level {user?.level ?? 1}
            </Text>
            <Text style={[styles.xpText, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
              {user?.xp?.toLocaleString() ?? 0} XP
            </Text>
          </View>
          <View style={[styles.streakBadge, { backgroundColor: "#FF2FBF20", borderColor: "#FF2FBF50" }]}>
            <Ionicons name="flame" size={14} color="#FF2FBF" />
            <Text style={[styles.streakText, { color: "#FF2FBF", fontFamily: "Inter_600SemiBold" }]}>
              {user?.streak ?? 0} day streak
            </Text>
          </View>
        </View>

        <View style={[styles.xpBar, { backgroundColor: "rgba(255,255,255,0.1)" }]}>
          <LinearGradient
            colors={["#8A2BE2", "#FF2FBF"]}
            style={[styles.xpFill, { width: `${Math.min(((user?.xp ?? 0) % 500) / 5, 100)}%` }]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          />
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 84) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <StatCard icon="trophy" value="#42" label="All India Rank" color={colors.primary} />
          <StatCard icon="star" value="87%" label="Avg Score" color="#F5C518" />
          <StatCard icon="checkmark-circle" value="12" label="Exams Done" color={colors.success} />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
              Upcoming Exams
            </Text>
            <TouchableOpacity onPress={() => router.push("/(student)/exams")}>
              <Text style={[styles.seeAll, { color: colors.primary, fontFamily: "Inter_500Medium" }]}>See all</Text>
            </TouchableOpacity>
          </View>

          <ExamCard
            title="Science Olympiad 2026"
            subject="Class 8 · Physics, Chemistry, Biology"
            date="Tomorrow, 10:00 AM"
            duration={90}
            status="upcoming"
            onPress={() => router.push("/(student)/exams")}
          />
          <ExamCard
            title="Mathematics Olympiad"
            subject="Class 8 · Algebra, Geometry"
            date="Dec 28, 2:00 PM"
            duration={60}
            status="registered"
            onPress={() => router.push("/(student)/exams")}
          />
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Recent Results
          </Text>
          <View style={{ marginTop: 12 }}>
            <ExamCard
              title="Computer Science Olympiad"
              subject="Class 8 · All Chapters"
              status="completed"
              score={92}
              rank={18}
              onPress={() => router.push("/(student)/results")}
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Your Badges
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginTop: 12 }}>
            <View style={styles.badgeRow}>
              {BADGES.map((b) => (
                <View key={b.label} style={[styles.badgeCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={[styles.badgeIcon, { backgroundColor: b.color + "20" }]}>
                    <Ionicons name={b.icon as any} size={24} color={b.color} />
                  </View>
                  <Text style={[styles.badgeLabel, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                    {b.label}
                  </Text>
                </View>
              ))}
              <View style={[styles.badgeCard, styles.badgeLocked, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                <View style={[styles.badgeIcon, { backgroundColor: colors.border }]}>
                  <Ionicons name="lock-closed" size={24} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.badgeLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                  Locked
                </Text>
              </View>
            </View>
          </ScrollView>
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
  name: { fontSize: 24 },
  avatarBtn: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center", borderWidth: 1.5 },
  xpRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  xpInfo: { gap: 2 },
  levelText: { fontSize: 18 },
  xpText: { fontSize: 13 },
  streakBadge: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1 },
  streakText: { fontSize: 13 },
  xpBar: { height: 6, borderRadius: 3, overflow: "hidden" },
  xpFill: { height: "100%", borderRadius: 3 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 24 },
  statsRow: { flexDirection: "row", gap: 10 },
  section: { gap: 0 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18 },
  seeAll: { fontSize: 14 },
  badgeRow: { flexDirection: "row", gap: 12, paddingRight: 16 },
  badgeCard: { alignItems: "center", padding: 16, borderRadius: 16, gap: 8, borderWidth: 1, width: 100 },
  badgeLocked: { opacity: 0.5 },
  badgeIcon: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  badgeLabel: { fontSize: 12, textAlign: "center" },
});
