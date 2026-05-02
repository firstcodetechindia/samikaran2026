import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Share, Platform, Alert } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useColors } from "@/hooks/useColors";
import { useAuth } from "@/context/AuthContext";

export default function PartnerHome() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, logout } = useAuth();
  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);

  const referralCode = `SAM${user?.id ?? "2026"}`;
  const referralLink = `https://samikaranolympiad.com/register?ref=${referralCode}`;

  const handleShare = async () => {
    try {
      await Share.share({
        message: `Join Samikaran Olympiad — India's #1 Olympiad platform! Register using my referral link:\n${referralLink}`,
        url: referralLink,
      });
    } catch {}
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient colors={["#0D0A1E", "#1a1033", colors.background]} style={[styles.headerGrad, { paddingTop: topPad + 16 }]}>
        <View style={styles.headerRow}>
          <View>
            <Text style={[styles.greeting, { color: "rgba(255,255,255,0.7)", fontFamily: "Roboto_400Regular" }]}>Partner Dashboard</Text>
            <Text style={[styles.name, { color: "#fff", fontFamily: "Roboto_700Bold" }]}>{user?.fullName ?? "Partner"}</Text>
          </View>
          <TouchableOpacity onPress={async () => { await logout(); router.replace("/login"); }}>
            <Ionicons name="log-out-outline" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      <ScrollView style={styles.scroll} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 84) }]} showsVerticalScrollIndicator={false}>
        <View style={[styles.earningsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <LinearGradient colors={["#8A2BE220", "#FF2FBF10"]} style={styles.earningsGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
            <Text style={[styles.earningsLabel, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>Lifetime Earnings</Text>
            <Text style={[styles.earningsAmount, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>₹12,450</Text>
            <Text style={[styles.earningsMonth, { color: colors.success, fontFamily: "Roboto_500Medium" }]}>+₹2,100 this month</Text>
          </LinearGradient>
        </View>

        <View style={styles.statsRow}>
          {[
            { label: "Students Referred", value: "124", icon: "people", color: colors.primary },
            { label: "Conversion Rate", value: "68%", icon: "trending-up", color: colors.success },
            { label: "Pending Payout", value: "₹3,200", icon: "cash", color: "#F5C518" },
          ].map((s) => (
            <View key={s.label} style={[styles.statMini, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name={s.icon as any} size={18} color={s.color} />
              <Text style={[styles.statMiniVal, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>{s.value}</Text>
              <Text style={[styles.statMiniLabel, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        <View style={[styles.referralCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.referralTitle, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>Your Referral Code</Text>
          <View style={[styles.codeBox, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Text style={[styles.code, { color: colors.primary, fontFamily: "Roboto_700Bold" }]}>{referralCode}</Text>
          </View>
          <TouchableOpacity
            style={[styles.shareBtn]}
            onPress={handleShare}
            activeOpacity={0.85}
          >
            <LinearGradient colors={["#8A2BE2", "#FF2FBF"]} style={styles.shareBtnGrad} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <Ionicons name="share-social" size={18} color="#fff" />
              <Text style={[styles.shareBtnText, { fontFamily: "Roboto_700Bold" }]}>Share Referral Link</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={[styles.payoutBtn, { backgroundColor: colors.success + "15", borderColor: colors.success }]}
          onPress={() => Alert.alert("Payout Request", "Your payout request for ₹3,200 has been submitted. It will be processed in 3-5 business days.")}
        >
          <Ionicons name="wallet-outline" size={18} color={colors.success} />
          <Text style={[styles.payoutBtnText, { color: colors.success, fontFamily: "Roboto_700Bold" }]}>Request Payout</Text>
        </TouchableOpacity>
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
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  earningsCard: { borderRadius: 16, borderWidth: 1, overflow: "hidden" },
  earningsGrad: { padding: 24, gap: 4 },
  earningsLabel: { fontSize: 13 },
  earningsAmount: { fontSize: 36 },
  earningsMonth: { fontSize: 14 },
  statsRow: { flexDirection: "row", gap: 10 },
  statMini: { flex: 1, alignItems: "center", padding: 12, borderRadius: 14, borderWidth: 1, gap: 4 },
  statMiniVal: { fontSize: 16 },
  statMiniLabel: { fontSize: 10, textAlign: "center" },
  referralCard: { borderRadius: 16, borderWidth: 1, padding: 16, gap: 12 },
  referralTitle: { fontSize: 16 },
  codeBox: { alignItems: "center", padding: 14, borderRadius: 12, borderWidth: 1 },
  code: { fontSize: 28, letterSpacing: 4 },
  shareBtn: { borderRadius: 12, overflow: "hidden" },
  shareBtnGrad: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14 },
  shareBtnText: { color: "#fff", fontSize: 15 },
  payoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 16, borderRadius: 14, borderWidth: 1 },
  payoutBtnText: { fontSize: 15 },
});
