import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { ExamCard } from "@/components/ExamCard";

const RESULTS = [
  { id: 1, title: "Computer Science Olympiad", subject: "Class 8", status: "completed" as const, score: 92, rank: 18, correct: 46, wrong: 2, skipped: 2 },
  { id: 2, title: "English Language Olympiad", subject: "Class 8", status: "completed" as const, score: 78, rank: 67, correct: 39, wrong: 8, skipped: 3 },
  { id: 3, title: "Mathematics Challenge", subject: "Class 8", status: "completed" as const, score: 85, rank: 34, correct: 42, wrong: 5, skipped: 3 },
];

export default function ResultsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<(typeof RESULTS)[0] | null>(null);
  // examId / attemptId from push notification deep link
  const { examId, attemptId } = useLocalSearchParams<{ examId?: string; attemptId?: string }>();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const avgScore = Math.round(RESULTS.reduce((s, r) => s + r.score, 0) / RESULTS.length);

  // Auto-open the detail card for the notified result
  useEffect(() => {
    if (!examId && !attemptId) return;
    const id = examId ? Number(examId) : Number(attemptId);
    const match = RESULTS.find((r) => r.id === id);
    if (match) setSelected(match);
  }, [examId, attemptId]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>My Results</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 84) }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.summaryRow}>
          {[
            { label: "Avg Score", value: `${avgScore}%`, icon: "star", color: "#F5C518" },
            { label: "Best Rank", value: `#18`, icon: "trophy", color: colors.primary },
            { label: "Exams", value: `${RESULTS.length}`, icon: "checkmark-circle", color: colors.success },
          ].map((s) => (
            <View key={s.label} style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={s.icon as any} size={20} color={s.color} />
              <Text style={[styles.summaryValue, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>{s.value}</Text>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {selected && (
          <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.detailHeader}>
              <Text style={[styles.detailTitle, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>
                {selected.title}
              </Text>
              <TouchableOpacity onPress={() => setSelected(null)}>
                <Ionicons name="close" size={20} color={colors.mutedForeground} />
              </TouchableOpacity>
            </View>
            <View style={styles.scoreCircleRow}>
              <View style={[styles.scoreCircle, { borderColor: colors.primary }]}>
                <Text style={[styles.scoreNum, { color: colors.primary, fontFamily: "Roboto_700Bold" }]}>{selected.score}%</Text>
                <Text style={[styles.scoreLabel, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>Score</Text>
              </View>
              <View style={styles.detailStats}>
                {[
                  { label: "Correct", value: selected.correct, color: colors.success },
                  { label: "Wrong", value: selected.wrong, color: colors.destructive },
                  { label: "Skipped", value: selected.skipped, color: colors.mutedForeground },
                  { label: "AI Rank", value: `#${selected.rank}`, color: colors.primary },
                ].map((s) => (
                  <View key={s.label} style={styles.detailStat}>
                    <Text style={[styles.detailStatVal, { color: s.color, fontFamily: "Roboto_700Bold" }]}>{s.value}</Text>
                    <Text style={[styles.detailStatLabel, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>{s.label}</Text>
                  </View>
                ))}
              </View>
            </View>
            <TouchableOpacity
              style={[styles.certBtn, { backgroundColor: colors.primary + "15", borderColor: colors.primary }]}
            >
              <Ionicons name="ribbon" size={16} color={colors.primary} />
              <Text style={[styles.certBtnText, { color: colors.primary, fontFamily: "Roboto_700Bold" }]}>
                Download Certificate
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>
          All Results
        </Text>
        {RESULTS.map((r) => (
          <ExamCard
            key={r.id}
            {...r}
            onPress={() => setSelected(r)}
          />
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 28 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 20 },
  summaryRow: { flexDirection: "row", gap: 10 },
  summaryCard: { flex: 1, alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, gap: 4 },
  summaryValue: { fontSize: 20 },
  summaryLabel: { fontSize: 11, textAlign: "center" },
  detailCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 16 },
  detailHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  detailTitle: { fontSize: 16, flex: 1, marginRight: 8 },
  scoreCircleRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  scoreCircle: { width: 90, height: 90, borderRadius: 45, borderWidth: 3, alignItems: "center", justifyContent: "center" },
  scoreNum: { fontSize: 22 },
  scoreLabel: { fontSize: 11 },
  detailStats: { flex: 1, flexDirection: "row", flexWrap: "wrap", gap: 12 },
  detailStat: { minWidth: "40%" },
  detailStatVal: { fontSize: 18 },
  detailStatLabel: { fontSize: 12 },
  certBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  certBtnText: { fontSize: 14 },
  sectionTitle: { fontSize: 18 },
});
