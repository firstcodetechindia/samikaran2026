import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { StatCard } from "@/components/StatCard";

const SUBJECT_DATA = [
  { subject: "Science", avg: 82, color: "#8A2BE2" },
  { subject: "Maths", avg: 76, color: "#FF2FBF" },
  { subject: "English", avg: 88, color: "#22c55e" },
  { subject: "Computer", avg: 91, color: "#F5C518" },
  { subject: "GK", avg: 70, color: "#3b82f6" },
];

export default function AnalyticsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Analytics</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 84) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.statsRow}>
          <StatCard icon="trophy" value="89%" label="Overall Pass Rate" color={colors.primary} />
          <StatCard icon="people" value="1,240" label="Students" color="#FF2FBF" />
        </View>

        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.cardTitle, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>
            Subject-wise Performance
          </Text>
          {SUBJECT_DATA.map((s) => (
            <View key={s.subject} style={styles.subjectRow}>
              <Text style={[styles.subjectName, { color: colors.foreground, fontFamily: "Inter_500Medium", width: 80 }]}>
                {s.subject}
              </Text>
              <View style={[styles.barTrack, { backgroundColor: colors.muted }]}>
                <View style={[styles.barFill, { width: `${s.avg}%`, backgroundColor: s.color }]} />
              </View>
              <Text style={[styles.barValue, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
                {s.avg}%
              </Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 28 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 20 },
  statsRow: { flexDirection: "row", gap: 10 },
  card: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 14 },
  cardTitle: { fontSize: 16 },
  subjectRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  subjectName: { fontSize: 13 },
  barTrack: { flex: 1, height: 10, borderRadius: 5, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 5 },
  barValue: { fontSize: 13, width: 38, textAlign: "right" },
});
