import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Platform, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";
import { ExamCard } from "@/components/ExamCard";

const CHILDREN = [
  { id: 1, name: "Arjun Sharma", class: "8A", rank: 42, score: 87, streak: 14 },
  { id: 2, name: "Neha Sharma", class: "5B", rank: 12, score: 93, streak: 21 },
];

export default function ParentHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const [selectedChild, setSelectedChild] = useState(CHILDREN[0]);
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#0D0A1E", "#1a1033", colors.background]} style={[styles.headerGrad, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: "rgba(255,255,255,0.7)", fontFamily: "Inter_400Regular" }]}>Parent Dashboard</Text>
            <Text style={[styles.name, { color: "#fff", fontFamily: "Inter_700Bold" }]}>{user?.fullName ?? "Parent"}</Text>
          </View>
          <TouchableOpacity style={[styles.iconBtn]} onPress={async () => { await logout(); router.replace("/login"); }}>
            <Ionicons name="log-out-outline" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.childLabel, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_500Medium" }]}>Select Child</Text>
        <View style={styles.childRow}>
          {CHILDREN.map((child) => (
            <TouchableOpacity
              key={child.id}
              style={[styles.childBtn, { backgroundColor: selectedChild.id === child.id ? colors.primary : "rgba(255,255,255,0.1)", borderColor: selectedChild.id === child.id ? colors.primary : "rgba(255,255,255,0.2)" }]}
              onPress={() => setSelectedChild(child)}
            >
              <Text style={[styles.childBtnText, { color: "#fff", fontFamily: selectedChild.id === child.id ? "Inter_600SemiBold" : "Inter_400Regular" }]}>
                {child.name.split(" ")[0]}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 84) }]}>
        <View style={[styles.childCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.childAvatar, { backgroundColor: colors.primary + "20" }]}>
            <Text style={[styles.childAvatarText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>
              {selectedChild.name.charAt(0)}
            </Text>
          </View>
          <View style={styles.childInfo}>
            <Text style={[styles.childName, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>{selectedChild.name}</Text>
            <Text style={[styles.childClass, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Class {selectedChild.class}</Text>
          </View>
          <View style={styles.childStats}>
            <View style={styles.childStat}>
              <Text style={[styles.childStatVal, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>#{selectedChild.rank}</Text>
              <Text style={[styles.childStatLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>AI Rank</Text>
            </View>
            <View style={styles.childStat}>
              <Text style={[styles.childStatVal, { color: "#F5C518", fontFamily: "Inter_700Bold" }]}>{selectedChild.score}%</Text>
              <Text style={[styles.childStatLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Avg</Text>
            </View>
            <View style={styles.childStat}>
              <Text style={[styles.childStatVal, { color: "#FF2FBF", fontFamily: "Inter_700Bold" }]}>{selectedChild.streak}d</Text>
              <Text style={[styles.childStatLabel, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>Streak</Text>
            </View>
          </View>
        </View>

        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Upcoming Exams</Text>
        <ExamCard title="Science Olympiad 2026" subject="Class 8 · Physics, Chemistry" date="Tomorrow" duration={90} status="upcoming" />
        <ExamCard title="Computer Science Olympiad" subject="Class 8" status="completed" score={92} rank={18} />

        <TouchableOpacity style={[styles.certBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}>
          <Ionicons name="ribbon-outline" size={18} color={colors.primary} />
          <Text style={[styles.certBtnText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>Download Certificates</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerGrad: { paddingHorizontal: 20, paddingBottom: 20, gap: 10 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  greeting: { fontSize: 14 },
  name: { fontSize: 22 },
  iconBtn: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  childLabel: { fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  childRow: { flexDirection: "row", gap: 10 },
  childBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1 },
  childBtnText: { fontSize: 14 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  childCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  childAvatar: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },
  childAvatarText: { fontSize: 22 },
  childInfo: { flex: 0 },
  childName: { fontSize: 17 },
  childClass: { fontSize: 13, marginTop: 2 },
  childStats: { flexDirection: "row", gap: 20, marginTop: 4 },
  childStat: { alignItems: "center" },
  childStatVal: { fontSize: 18 },
  childStatLabel: { fontSize: 11 },
  sectionTitle: { fontSize: 18 },
  certBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  certBtnText: { fontSize: 14 },
});
