import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { RoleCard } from "@/components/RoleCard";
import { useAuth, type UserRole } from "@/context/AuthContext";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

const ROLES: { role: NonNullable<UserRole>; label: string; subtitle: string; icon: string }[] = [
  { role: "student", label: "Student", subtitle: "Take exams & track your progress", icon: "school" },
  { role: "school",  label: "School",  subtitle: "Manage students & registrations", icon: "business" },
  { role: "parent",  label: "Parent",  subtitle: "Monitor your child's performance", icon: "people" },
  { role: "partner", label: "Partner", subtitle: "Referrals & commission earnings", icon: "handshake" },
];

export default function LoginScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<NonNullable<UserRole>>("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter your credentials");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username: username.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      await login({
        id: data.id,
        username: data.username,
        fullName: data.fullName ?? data.username,
        role: selectedRole,
        email: data.email,
        xp: data.xp ?? 0,
        level: data.level ?? 1,
        streak: data.streak ?? 0,
        grade: data.grade,
      });

      switch (selectedRole) {
        case "student": router.replace("/(student)/home"); break;
        case "school":  router.replace("/(school)/home");  break;
        case "parent":  router.replace("/(parent)/home");  break;
        case "partner": router.replace("/(partner)/home"); break;
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message || "Please check your credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async (role: NonNullable<UserRole>) => {
    setSelectedRole(role);
    await login({
      id: 1,
      username: `demo_${role}`,
      fullName: role === "student" ? "Arjun Sharma" : role === "school" ? "DPS Admin" : role === "parent" ? "Rajesh Kumar" : "Partner",
      role,
      xp: 2450,
      level: 12,
      streak: 14,
      grade: 8,
    });
    switch (role) {
      case "student": router.replace("/(student)/home"); break;
      case "school":  router.replace("/(school)/home");  break;
      case "parent":  router.replace("/(parent)/home");  break;
      case "partner": router.replace("/(partner)/home"); break;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <LinearGradient
        colors={["#0D0A1E", "#1a1033", colors.background]}
        style={[styles.header, { paddingTop: insets.top + (Platform.OS === "web" ? 67 : 16) }]}
      >
        <Image
          source={require("../assets/images/icon.png")}
          style={styles.logoImage}
          resizeMode="contain"
        />
        <Text style={[styles.logo, { fontFamily: "Inter_700Bold" }]}>
          SAMIKARAN<Text style={{ color: "#FF2FBF" }}>.</Text>
        </Text>
        <Text style={[styles.logoSub, { color: "rgba(255,255,255,0.6)", fontFamily: "Inter_400Regular" }]}>
          OLYMPIAD
        </Text>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + (Platform.OS === "web" ? 34 : 16) }]}
        keyboardShouldPersistTaps="handled"
      >
        <View style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.tabs, { backgroundColor: colors.muted }]}>
            {(["login", "register"] as const).map((tab) => (
              <TouchableOpacity
                key={tab}
                style={[styles.tab, activeTab === tab && { backgroundColor: colors.card }]}
                onPress={() => setActiveTab(tab)}
              >
                <Text
                  style={[
                    styles.tabText,
                    {
                      color: activeTab === tab ? colors.primary : colors.mutedForeground,
                      fontFamily: activeTab === tab ? "Inter_600SemiBold" : "Inter_400Regular",
                    },
                  ]}
                >
                  {tab === "login" ? "Login" : "Register"}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={[styles.sectionLabel, { color: colors.mutedForeground, fontFamily: "Inter_500Medium" }]}>
            I am a...
          </Text>
          {ROLES.map((r) => (
            <RoleCard
              key={r.role}
              {...r}
              selected={selectedRole === r.role}
              onPress={() => setSelectedRole(r.role)}
            />
          ))}

          <View style={styles.inputs}>
            <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Ionicons name="person-outline" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                placeholder={selectedRole === "student" ? "Roll Number / Username" : "Email / Username"}
                placeholderTextColor={colors.mutedForeground}
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>

            <View style={[styles.inputWrap, { backgroundColor: colors.muted, borderColor: colors.border }]}>
              <Ionicons name="lock-closed-outline" size={18} color={colors.mutedForeground} />
              <TextInput
                style={[styles.input, { color: colors.foreground, fontFamily: "Inter_400Regular" }]}
                placeholder="Password"
                placeholderTextColor={colors.mutedForeground}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? "eye-off-outline" : "eye-outline"}
                  size={18}
                  color={colors.mutedForeground}
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginBtn, { opacity: loading ? 0.7 : 1 }]}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={["#8A2BE2", "#FF2FBF"]}
              style={styles.loginGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={[styles.loginText, { fontFamily: "Inter_700Bold" }]}>
                  {activeTab === "login" ? "Login" : "Register"}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>

          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
            <Text style={[styles.dividerText, { color: colors.mutedForeground, fontFamily: "Inter_400Regular" }]}>
              or try demo
            </Text>
            <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
          </View>

          <View style={styles.demoRow}>
            {ROLES.slice(0, 2).map((r) => (
              <TouchableOpacity
                key={r.role}
                style={[styles.demoBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => handleDemoLogin(r.role)}
              >
                <Ionicons name={r.icon as any} size={16} color={colors.primary} />
                <Text style={[styles.demoBtnText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.demoRow}>
            {ROLES.slice(2).map((r) => (
              <TouchableOpacity
                key={r.role}
                style={[styles.demoBtn, { backgroundColor: colors.muted, borderColor: colors.border }]}
                onPress={() => handleDemoLogin(r.role)}
              >
                <Ionicons name={r.icon as any} size={16} color={colors.primary} />
                <Text style={[styles.demoBtnText, { color: colors.foreground, fontFamily: "Inter_500Medium" }]}>
                  {r.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: { alignItems: "center", paddingBottom: 24, gap: 4 },
  logoImage: { width: 72, height: 72, borderRadius: 16, marginBottom: 4 },
  logo: { fontSize: 28, color: "#fff", letterSpacing: 2 },
  logoSub: { fontSize: 12, letterSpacing: 4 },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
  },
  tabs: {
    flexDirection: "row",
    borderRadius: 10,
    padding: 4,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 10,
    borderRadius: 8,
  },
  tabText: { fontSize: 14 },
  sectionLabel: { fontSize: 12, letterSpacing: 1, textTransform: "uppercase" },
  inputs: { gap: 12 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15 },
  loginBtn: { borderRadius: 14, overflow: "hidden" },
  loginGradient: { alignItems: "center", paddingVertical: 16 },
  loginText: { color: "#fff", fontSize: 16 },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 12 },
  demoRow: { flexDirection: "row", gap: 10 },
  demoBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  demoBtnText: { fontSize: 13 },
});
