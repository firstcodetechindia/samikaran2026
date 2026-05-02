import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface ExamCardProps {
  title: string;
  subject: string;
  date?: string;
  duration?: number;
  status: "upcoming" | "live" | "completed" | "registered";
  rank?: number;
  score?: number;
  onPress?: () => void;
}

const STATUS_CONFIG = {
  live: { label: "LIVE", color: "#ef4444", bg: "#fef2f2" },
  upcoming: { label: "UPCOMING", color: "#f59e0b", bg: "#fffbeb" },
  registered: { label: "REGISTERED", color: "#8A2BE2", bg: "#f5f0ff" },
  completed: { label: "COMPLETED", color: "#22c55e", bg: "#f0fdf4" },
};

export function ExamCard({
  title,
  subject,
  date,
  duration,
  status,
  rank,
  score,
  onPress,
}: ExamCardProps) {
  const colors = useColors();
  const cfg = STATUS_CONFIG[status];

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={onPress}
      activeOpacity={0.85}
    >
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text
            style={[styles.title, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}
            numberOfLines={1}
          >
            {title}
          </Text>
          <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
          </View>
        </View>
        <Text style={[styles.subject, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
          {subject}
        </Text>
      </View>

      <View style={styles.footer}>
        {date && (
          <View style={styles.metaItem}>
            <Ionicons name="calendar-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {date}
            </Text>
          </View>
        )}
        {duration && (
          <View style={styles.metaItem}>
            <Ionicons name="time-outline" size={13} color={colors.mutedForeground} />
            <Text style={[styles.metaText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              {duration} min
            </Text>
          </View>
        )}
        {score !== undefined && (
          <View style={styles.metaItem}>
            <Ionicons name="star" size={13} color="#F5C518" />
            <Text style={[styles.metaText, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>
              {score}%
            </Text>
          </View>
        )}
        {rank !== undefined && (
          <View style={styles.metaItem}>
            <Ionicons name="trophy" size={13} color={colors.primary} />
            <Text style={[styles.metaText, { color: colors.primary, fontFamily: "Inter_600SemiBold" }]}>
              Rank #{rank}
            </Text>
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 12,
    gap: 12,
  },
  header: { gap: 4 },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 8,
  },
  title: { fontSize: 15, flex: 1 },
  subject: { fontSize: 13 },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: { fontSize: 10, fontFamily: "Inter_600SemiBold" },
  footer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
  },
  metaItem: { flexDirection: "row", alignItems: "center", gap: 4 },
  metaText: { fontSize: 12 },
});
