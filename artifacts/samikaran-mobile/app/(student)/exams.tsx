import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { LinearGradient } from "expo-linear-gradient";
import { useColors } from "@/hooks/useColors";
import { ExamCard } from "@/components/ExamCard";

const TABS = ["All", "Upcoming", "Live", "Completed"] as const;
type Tab = (typeof TABS)[number];

const MOCK_EXAMS = [
  { id: 1, title: "Science Olympiad 2026", subject: "Class 8 · Physics, Chemistry, Biology", date: "Tomorrow, 10:00 AM", duration: 90, status: "upcoming" as const },
  { id: 2, title: "Mathematics Olympiad", subject: "Class 8 · Algebra, Geometry", date: "Dec 28, 2:00 PM", duration: 60, status: "registered" as const },
  { id: 3, title: "GK & Current Affairs", subject: "Class 8 · National & International", date: "Live Now", duration: 45, status: "live" as const },
  { id: 4, title: "Computer Science Olympiad", subject: "Class 8 · All Chapters", status: "completed" as const, score: 92, rank: 18 },
  { id: 5, title: "English Language Olympiad", subject: "Class 8 · Grammar, Comprehension", status: "completed" as const, score: 78, rank: 67 },
];

export default function ExamsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<Tab>("All");
  // examId from push notification deep link
  const { examId } = useLocalSearchParams<{ examId?: string }>();

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  // When opened via a notification deep link, switch to the tab containing the exam
  // and highlight it so the student immediately sees the relevant card.
  const [highlightedExamId, setHighlightedExamId] = useState<number | null>(null);

  useEffect(() => {
    if (!examId) return;
    const id = Number(examId);
    const exam = MOCK_EXAMS.find((e) => e.id === id);
    if (!exam) return;

    setHighlightedExamId(id);
    if (exam.status === "live") {
      setActiveTab("Live");
    } else if (exam.status === "upcoming" || exam.status === "registered") {
      setActiveTab("Upcoming");
    } else if (exam.status === "completed") {
      setActiveTab("Completed");
    }
    // Clear highlight after 4 seconds
    const t = setTimeout(() => setHighlightedExamId(null), 4000);
    return () => clearTimeout(t);
  }, [examId]);

  const filtered = MOCK_EXAMS.filter((e) => {
    if (activeTab === "All") return true;
    if (activeTab === "Live") return e.status === "live";
    if (activeTab === "Upcoming") return e.status === "upcoming" || e.status === "registered";
    if (activeTab === "Completed") return e.status === "completed";
    return true;
  });

  const handleExamPress = (exam: (typeof MOCK_EXAMS)[0]) => {
    if (exam.status === "live") {
      Alert.alert(
        "Start Exam",
        `Ready to start "${exam.title}"?\n\nMake sure you have:\n• Stable internet connection\n• Camera enabled and face visible\n• Quiet environment\n• Mic access for voice questions`,
        [
          { text: "Cancel", style: "cancel" },
          {
            text: "Continue to Check",
            style: "default",
            onPress: () =>
              router.push({
                pathname: "/exam-check",
                params: {
                  examId: String(exam.id),
                  examTitle: exam.title,
                  duration: String(exam.duration ?? 45),
                },
              }),
          },
        ]
      );
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View
        style={[
          styles.header,
          { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border },
        ]}
      >
        <Text style={[styles.headerTitle, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>My Exams</Text>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabsScroll}>
          <View style={styles.tabs}>
            {TABS.map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[
                  styles.tab,
                  activeTab === tab && { backgroundColor: colors.primary },
                ]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === tab ? "#fff" : colors.mutedForeground,
                      fontFamily: activeTab === tab ? "Roboto_700Bold" : "Roboto_400Regular",
                    },
                  ]}
                >
                  {tab}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </ScrollView>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 84) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === "Live" && filtered.length > 0 && (
          <LinearGradient
            colors={["#ef4444", "#dc2626"]}
            style={styles.liveBanner}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="radio" size={20} color="#fff" />
            <Text style={[styles.liveBannerText, { fontFamily: "Roboto_700Bold" }]}>
              {filtered.length} exam{filtered.length > 1 ? "s" : ""} happening right now!
            </Text>
          </LinearGradient>
        )}

        {filtered.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="document-text-outline" size={48} color={colors.mutedForeground} />
            <Text style={[styles.emptyText, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>
              No {activeTab.toLowerCase()} exams
            </Text>
          </View>
        ) : (
          filtered.map((exam) => (
            <View
              key={exam.id}
              style={
                highlightedExamId === exam.id
                  ? [styles.highlight, { borderColor: colors.primary }]
                  : undefined
              }
            >
              <ExamCard
                {...exam}
                onPress={() => handleExamPress(exam)}
              />
            </View>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 16,
  },
  headerTitle: { fontSize: 28 },
  tabsScroll: { marginHorizontal: -20 },
  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 20, paddingRight: 32 },
  tab: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20 },
  tabText: { fontSize: 14 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 0 },
  liveBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    marginBottom: 16,
  },
  liveBannerText: { color: "#fff", fontSize: 14 },
  empty: { alignItems: "center", justifyContent: "center", paddingTop: 80, gap: 12 },
  emptyText: { fontSize: 16 },
  highlight: { borderRadius: 16, borderWidth: 2 },
});
