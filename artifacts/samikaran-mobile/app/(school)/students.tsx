import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const MOCK_STUDENTS = [
  { id: 1, name: "Arjun Sharma", class: "8A", roll: "SO2026001", score: 92 },
  { id: 2, name: "Priya Singh", class: "8B", roll: "SO2026002", score: 87 },
  { id: 3, name: "Rahul Gupta", class: "7A", roll: "SO2026003", score: 74 },
  { id: 4, name: "Ananya Mehta", class: "9A", roll: "SO2026004", score: 95 },
  { id: 5, name: "Dev Patel", class: "7B", roll: "SO2026005", score: 81 },
];

export default function StudentsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState("");
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const filtered = MOCK_STUDENTS.filter(
    (s) => s.name.toLowerCase().includes(search.toLowerCase()) || s.roll.includes(search)
  );

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <View style={styles.headerRow}>
          <Text style={[styles.title, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>Students</Text>
          <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]}>
            <Ionicons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
        <View style={[styles.searchBar, { backgroundColor: colors.muted, borderColor: colors.border }]}>
          <Ionicons name="search-outline" size={18} color={colors.mutedForeground} />
          <TextInput
            style={[styles.searchInput, { color: colors.foreground, fontFamily: "Roboto_400Regular" }]}
            placeholder="Search by name or roll number"
            placeholderTextColor={colors.mutedForeground}
            value={search}
            onChangeText={setSearch}
          />
        </View>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 84) }]}
        showsVerticalScrollIndicator={false}
      >
        {filtered.map((student) => (
          <TouchableOpacity
            key={student.id}
            style={[styles.studentCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            activeOpacity={0.8}
          >
            <View style={[styles.avatar, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.avatarText, { color: colors.primary, fontFamily: "Roboto_700Bold" }]}>
                {student.name.charAt(0)}
              </Text>
            </View>
            <View style={styles.studentInfo}>
              <Text style={[styles.studentName, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>{student.name}</Text>
              <Text style={[styles.studentMeta, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>
                Class {student.class} · {student.roll}
              </Text>
            </View>
            <View style={[styles.scoreBadge, { backgroundColor: student.score >= 85 ? colors.success + "20" : colors.muted }]}>
              <Text style={[styles.scoreText, { color: student.score >= 85 ? colors.success : colors.mutedForeground, fontFamily: "Roboto_700Bold" }]}>
                {student.score}%
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1, gap: 12 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontSize: 28 },
  addBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  searchBar: { flexDirection: "row", alignItems: "center", gap: 10, borderRadius: 12, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 0 },
  studentCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 18 },
  studentInfo: { flex: 1 },
  studentName: { fontSize: 15 },
  studentMeta: { fontSize: 12, marginTop: 2 },
  scoreBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 },
  scoreText: { fontSize: 14 },
});
