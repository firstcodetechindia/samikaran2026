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
import { useAuth, type UserRole } from "@/context/AuthContext";

const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

type RoleKey = NonNullable<UserRole>;

const ROLES: {
  role: RoleKey;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}[] = [
  {
    role: "student",
    label: "Student",
    subtitle: "Take exams & track your progress",
    icon: "school-outline",
    color: "#8A2BE2",
    bg: "#f3e8ff",
  },
  {
    role: "school",
    label: "School",
    subtitle: "Manage students & registrations",
    icon: "business-outline",
    color: "#0284c7",
    bg: "#e0f2fe",
  },
  {
    role: "parent",
    label: "Parent",
    subtitle: "Monitor your child's performance",
    icon: "people-outline",
    color: "#059669",
    bg: "#d1fae5",
  },
  {
    role: "partner",
    label: "Partner",
    subtitle: "Referrals & commission earnings",
    icon: "briefcase-outline",
    color: "#b45309",
    bg: "#fef9c3",
  },
];

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [selectedRole, setSelectedRole] = useState<RoleKey>("student");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<"login" | "register">("login");

  const topPad = insets.top + (Platform.OS === "web" ? 67 : 0);
  const activeRole = ROLES.find((r) => r.role === selectedRole)!;

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Missing Fields", "Please enter your credentials to continue.");
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
      Alert.alert("Login Failed", err.message || "Please check your credentials and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* Dark header */}
      <LinearGradient
        colors={["#100820", "#1e0f3a", "#2d1060"]}
        style={[styles.header, { paddingTop: topPad + 20 }]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        {/* Decorative glow */}
        <View style={styles.headerGlow} />

        <View style={styles.logoBox}>
          <Image
            source={require("../assets/images/icon.png")}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.appName, { fontFamily: "Inter_700Bold" }]}>
          SAMIKARAN<Text style={{ color: "#FF2FBF" }}>.</Text>
        </Text>
        <Text style={[styles.appTagline, { fontFamily: "Inter_400Regular" }]}>
          OLYMPIAD PLATFORM
        </Text>
      </LinearGradient>

      {/* White body */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + (Platform.OS === "web" ? 40 : 24) },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Login / Register tabs */}
        <View style={styles.tabRow}>
          {(["login", "register"] as const).map((tab) => (
            <TouchableOpacity
              key={tab}
              style={[styles.tabItem, activeTab === tab && styles.tabItemActive]}
              onPress={() => setActiveTab(tab)}
            >
              <Text
                style={[
                  styles.tabLabel,
                  {
                    fontFamily: activeTab === tab ? "Inter_600SemiBold" : "Inter_400Regular",
                    color: activeTab === tab ? "#8A2BE2" : "#9ca3af",
                  },
                ]}
              >
                {tab === "login" ? "Login" : "Register"}
              </Text>
              {activeTab === tab && <View style={styles.tabUnderline} />}
            </TouchableOpacity>
          ))}
        </View>

        {/* Role selector */}
        <Text style={[styles.sectionLabel, { fontFamily: "Inter_500Medium" }]}>
          I AM A...
        </Text>

        <View style={styles.rolesGrid}>
          {ROLES.map((r) => {
            const sel = selectedRole === r.role;
            return (
              <TouchableOpacity
                key={r.role}
                style={[
                  styles.roleCard,
                  {
                    backgroundColor: sel ? r.bg : "#fafafa",
                    borderColor: sel ? r.color : "#e5e7eb",
                    borderWidth: sel ? 1.5 : 1,
                  },
                ]}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedRole(r.role);
                }}
                activeOpacity={0.75}
              >
                <View
                  style={[
                    styles.roleIconBox,
                    { backgroundColor: sel ? r.color : "#f3f4f6" },
                  ]}
                >
                  <Ionicons
                    name={r.icon}
                    size={20}
                    color={sel ? "#fff" : "#9ca3af"}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text
                    style={[
                      styles.roleLabel,
                      {
                        fontFamily: "Inter_600SemiBold",
                        color: sel ? r.color : "#111827",
                      },
                    ]}
                  >
                    {r.label}
                  </Text>
                  <Text
                    style={[styles.roleSub, { fontFamily: "Inter_400Regular" }]}
                    numberOfLines={1}
                  >
                    {r.subtitle}
                  </Text>
                </View>
                {sel && (
                  <Ionicons name="checkmark-circle" size={18} color={r.color} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Input fields */}
        <View style={styles.inputGroup}>
          <View style={styles.inputWrap}>
            <Ionicons name="person-outline" size={17} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={[styles.inputField, { fontFamily: "Inter_400Regular" }]}
              placeholder={
                selectedRole === "student" ? "Roll Number / Username" : "Email / Username"
              }
              placeholderTextColor="#9ca3af"
              value={username}
              onChangeText={setUsername}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputWrap}>
            <Ionicons name="lock-closed-outline" size={17} color="#9ca3af" style={styles.inputIcon} />
            <TextInput
              style={[styles.inputField, { fontFamily: "Inter_400Regular" }]}
              placeholder="Password"
              placeholderTextColor="#9ca3af"
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              onPress={() => setShowPassword((v) => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={showPassword ? "eye-off-outline" : "eye-outline"}
                size={17}
                color="#9ca3af"
              />
            </TouchableOpacity>
          </View>
        </View>

        {/* Forgot password */}
        <TouchableOpacity style={styles.forgotRow}>
          <Text style={[styles.forgotTxt, { fontFamily: "Inter_500Medium", color: activeRole.color }]}>
            Forgot Password?
          </Text>
        </TouchableOpacity>

        {/* CTA */}
        <TouchableOpacity
          style={[styles.ctaWrap, { opacity: loading ? 0.75 : 1 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.88}
        >
          <LinearGradient
            colors={["#8A2BE2", "#c026d3", "#FF2FBF"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.cta}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={[styles.ctaTxt, { fontFamily: "Inter_700Bold" }]}>
                {activeTab === "login" ? "Login" : "Create Account"}
              </Text>
            )}
          </LinearGradient>
        </TouchableOpacity>

        {/* Sign up / Sign in toggle */}
        <View style={styles.switchRow}>
          <Text style={[styles.switchTxt, { fontFamily: "Inter_400Regular" }]}>
            {activeTab === "login"
              ? "Don't have an account? "
              : "Already have an account? "}
          </Text>
          <TouchableOpacity
            onPress={() => setActiveTab(activeTab === "login" ? "register" : "login")}
          >
            <Text
              style={[styles.switchLink, { color: activeRole.color, fontFamily: "Inter_600SemiBold" }]}
            >
              {activeTab === "login" ? "Register" : "Sign In"}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#fff" },

  // Header
  header: {
    alignItems: "center",
    paddingBottom: 32,
    gap: 6,
    overflow: "hidden",
  },
  headerGlow: {
    position: "absolute",
    width: 280,
    height: 280,
    borderRadius: 140,
    backgroundColor: "#8A2BE2",
    opacity: 0.12,
    top: -60,
    alignSelf: "center",
  },
  logoBox: {
    width: 76,
    height: 76,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.1)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.15)",
    marginBottom: 4,
  },
  logoImg: { width: 52, height: 52 },
  appName: { fontSize: 26, color: "#fff", letterSpacing: 2.5 },
  appTagline: { fontSize: 11, color: "rgba(255,255,255,0.5)", letterSpacing: 4 },

  // Scroll
  scroll: { flex: 1, backgroundColor: "#fff" },
  scrollContent: { paddingHorizontal: 22, paddingTop: 24, gap: 0 },

  // Tabs
  tabRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#f3f4f6",
    marginBottom: 22,
  },
  tabItem: {
    flex: 1,
    alignItems: "center",
    paddingBottom: 12,
    position: "relative",
  },
  tabItemActive: {},
  tabLabel: { fontSize: 15 },
  tabUnderline: {
    position: "absolute",
    bottom: 0,
    left: "20%",
    right: "20%",
    height: 2,
    backgroundColor: "#8A2BE2",
    borderRadius: 1,
  },

  // Role selector
  sectionLabel: {
    fontSize: 11,
    color: "#9ca3af",
    letterSpacing: 1.5,
    marginBottom: 10,
  },
  rolesGrid: { gap: 8, marginBottom: 20 },
  roleCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 13,
    borderRadius: 14,
    gap: 12,
  },
  roleIconBox: {
    width: 42,
    height: 42,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  roleLabel: { fontSize: 14, marginBottom: 1 },
  roleSub: { fontSize: 11, color: "#9ca3af" },

  // Inputs
  inputGroup: { gap: 10, marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 10,
  },
  inputIcon: {},
  inputField: { flex: 1, fontSize: 14, color: "#111827" },

  // Forgot
  forgotRow: { alignSelf: "flex-end", marginBottom: 18 },
  forgotTxt: { fontSize: 13 },

  // CTA
  ctaWrap: { borderRadius: 16, overflow: "hidden", marginBottom: 18 },
  cta: { paddingVertical: 16, alignItems: "center" },
  ctaTxt: { color: "#fff", fontSize: 16, letterSpacing: 0.3 },

  // Switch row
  switchRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
  },
  switchTxt: { fontSize: 13, color: "#6b7280" },
  switchLink: { fontSize: 13 },
});
