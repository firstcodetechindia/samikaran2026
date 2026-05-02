import React from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";

const TRANSACTIONS = [
  { id: 1, student: "Arjun Sharma", date: "Dec 20, 2025", amount: 150, status: "paid" },
  { id: 2, student: "Priya Singh", date: "Dec 18, 2025", amount: 150, status: "paid" },
  { id: 3, student: "Rahul Gupta", date: "Dec 15, 2025", amount: 150, status: "pending" },
  { id: 4, student: "Ananya Mehta", date: "Dec 12, 2025", amount: 150, status: "paid" },
  { id: 5, student: "Dev Patel", date: "Dec 10, 2025", amount: 150, status: "pending" },
];

export default function EarningsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topPad + 16, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <Text style={[styles.title, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>Earnings</Text>
      </View>
      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 84) }]} showsVerticalScrollIndicator={false}>
        {TRANSACTIONS.map((t) => (
          <View key={t.id} style={[styles.txCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.txAvatar, { backgroundColor: colors.primary + "20" }]}>
              <Text style={[styles.txAvatarText, { color: colors.primary, fontFamily: "Inter_700Bold" }]}>{t.student.charAt(0)}</Text>
            </View>
            <View style={styles.txInfo}>
              <Text style={[styles.txName, { color: colors.foreground, fontFamily: "Inter_600SemiBold" }]}>{t.student}</Text>
              <Text style={[styles.txDate, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>{t.date}</Text>
            </View>
            <View style={styles.txRight}>
              <Text style={[styles.txAmount, { color: colors.foreground, fontFamily: "Inter_700Bold" }]}>₹{t.amount}</Text>
              <View style={[styles.txStatus, { backgroundColor: t.status === "paid" ? colors.success + "20" : colors.muted }]}>
                <Text style={[styles.txStatusText, { color: t.status === "paid" ? colors.success : colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
                  {t.status}
                </Text>
              </View>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, borderBottomWidth: 1 },
  title: { fontSize: 28 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 0 },
  txCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 14, borderWidth: 1, marginBottom: 10, gap: 12 },
  txAvatar: { width: 42, height: 42, borderRadius: 21, alignItems: "center", justifyContent: "center" },
  txAvatarText: { fontSize: 16 },
  txInfo: { flex: 1 },
  txName: { fontSize: 14 },
  txDate: { fontSize: 12, marginTop: 2 },
  txRight: { alignItems: "flex-end", gap: 4 },
  txAmount: { fontSize: 16 },
  txStatus: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  txStatusText: { fontSize: 11, textTransform: "capitalize" },
});
