import React, { useState, useRef, useCallback } from "react";
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
  Dimensions,
  KeyboardAvoidingView,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth, type UserRole } from "@/context/AuthContext";

const { width, height } = Dimensions.get("window");
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

type RoleKey = NonNullable<UserRole>;
type Screen =
  | "login-role"
  | "login-creds"
  | "login-otp"
  | "reg-contact"
  | "reg-otp"
  | "reg-role"
  | "reg-details"
  | "forgot-email"
  | "forgot-otp"
  | "forgot-reset"
  | "forgot-done";

const ROLES: {
  role: RoleKey;
  label: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  bg: string;
}[] = [
  { role: "student", label: "Student", subtitle: "Take exams & track progress", icon: "school-outline", color: "#8A2BE2", bg: "#f3e8ff" },
  { role: "school",  label: "School",  subtitle: "Manage students & olympiads", icon: "business-outline", color: "#0284c7", bg: "#e0f2fe" },
  { role: "parent",  label: "Parent",  subtitle: "Monitor your child's growth", icon: "people-outline", color: "#059669", bg: "#d1fae5" },
  { role: "partner", label: "Partner", subtitle: "Referrals & earn commission", icon: "briefcase-outline", color: "#b45309", bg: "#fef9c3" },
];

const TOP_H = height * 0.36;

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();

  const [screen, setScreen] = useState<Screen>("login-role");
  const [selectedRole, setSelectedRole] = useState<RoleKey>("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  // OTP
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const [otpToken, setOtpToken] = useState("");
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Register
  const [regContact, setRegContact] = useState("");
  const [regVerifyToken, setRegVerifyToken] = useState("");
  const [regName, setRegName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regShowPass, setRegShowPass] = useState(false);

  // Forgot
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotResetToken, setForgotResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  const activeRole = ROLES.find((r) => r.role === selectedRole)!;
  const otpStr = otp.join("");

  const startResendTimer = useCallback(() => {
    setResendTimer(59);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => {
        if (t <= 1) { clearInterval(timerRef.current!); return 0; }
        return t - 1;
      });
    }, 1000);
  }, []);

  const go = (s: Screen) => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setScreen(s); };

  // ── LOGIN ──────────────────────────────────────────────
  const handleLoginPassword = async () => {
    if (!identifier.trim() || !password.trim()) return Alert.alert("Missing Fields", "Enter your credentials.");
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ identifier: identifier.trim(), password, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");
      await login({ id: data.id, username: data.username, fullName: data.fullName ?? data.username, role: selectedRole, email: data.email, xp: data.xp ?? 0, level: data.level ?? 1, streak: data.streak ?? 0, grade: data.grade });
      switch (selectedRole) {
        case "student": router.replace("/(student)/home"); break;
        case "school":  router.replace("/(school)/home");  break;
        case "parent":  router.replace("/(parent)/home");  break;
        case "partner": router.replace("/(partner)/home"); break;
      }
    } catch (err: any) {
      Alert.alert("Login Failed", err.message);
    } finally { setLoading(false); }
  };

  const handleSendLoginOtp = async () => {
    if (!identifier.trim()) return Alert.alert("Missing", "Enter your Student ID, Email or Phone.");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login-otp/send`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setOtp(["", "", "", "", "", ""]);
      startResendTimer();
      go("login-otp");
    } catch (err: any) { Alert.alert("Error", err.message); }
    finally { setLoading(false); }
  };

  const handleVerifyLoginOtp = async () => {
    if (otpStr.length < 6) return Alert.alert("Incomplete", "Enter the 6-digit OTP.");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login-otp/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ identifier: identifier.trim(), otp: otpStr, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");
      await login({ id: data.id, username: data.username, fullName: data.fullName ?? data.username, role: selectedRole, email: data.email, xp: data.xp ?? 0, level: data.level ?? 1, streak: data.streak ?? 0, grade: data.grade });
      switch (selectedRole) {
        case "student": router.replace("/(student)/home"); break;
        case "school":  router.replace("/(school)/home");  break;
        case "parent":  router.replace("/(parent)/home");  break;
        case "partner": router.replace("/(partner)/home"); break;
      }
    } catch (err: any) { Alert.alert("Error", err.message); }
    finally { setLoading(false); }
  };

  // ── REGISTER ───────────────────────────────────────────
  const handleCheckContact = async () => {
    if (!regContact.trim()) return Alert.alert("Missing", "Enter your email or phone number.");
    setLoading(true);
    try {
      const checkRes = await fetch(`${BASE_URL}/api/auth/check-contact`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: regContact.trim() }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.message || "Contact already registered");
      const otpRes = await fetch(`${BASE_URL}/api/otp/send`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: regContact.trim() }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) throw new Error(otpData.message || "Failed to send OTP");
      setOtp(["", "", "", "", "", ""]);
      startResendTimer();
      go("reg-otp");
    } catch (err: any) { Alert.alert("Error", err.message); }
    finally { setLoading(false); }
  };

  const handleVerifyRegOtp = async () => {
    if (otpStr.length < 6) return Alert.alert("Incomplete", "Enter the 6-digit OTP.");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/otp/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: regContact.trim(), otp: otpStr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");
      setRegVerifyToken(data.verificationToken || "");
      go("reg-role");
    } catch (err: any) { Alert.alert("Error", err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    if (!regName.trim() || !regPassword.trim()) return Alert.alert("Missing", "Fill all fields.");
    setLoading(true);
    try {
      const endpoint =
        selectedRole === "student" ? "/api/registration/student"
        : selectedRole === "school" ? "/api/registration/school"
        : "/api/registration/supervisor";
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: regContact.trim(), fullName: regName.trim(), password: regPassword, verificationToken: regVerifyToken, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed");
      Alert.alert("Account Created!", "You can now log in.", [{ text: "Login", onPress: () => { setScreen("login-role"); setIdentifier(""); setPassword(""); } }]);
    } catch (err: any) { Alert.alert("Registration Failed", err.message); }
    finally { setLoading(false); }
  };

  // ── FORGOT PASSWORD ────────────────────────────────────
  const handleForgotSend = async () => {
    if (!forgotEmail.trim()) return Alert.alert("Missing", "Enter your email address.");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      setOtp(["", "", "", "", "", ""]);
      startResendTimer();
      go("forgot-otp");
    } catch (err: any) { Alert.alert("Error", err.message); }
    finally { setLoading(false); }
  };

  const handleForgotOtp = async () => {
    if (otpStr.length < 6) return Alert.alert("Incomplete", "Enter the 6-digit OTP.");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify-reset-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), otp: otpStr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid OTP");
      setForgotResetToken(data.resetToken || "");
      go("forgot-reset");
    } catch (err: any) { Alert.alert("Error", err.message); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim() || newPassword.length < 8) return Alert.alert("Weak Password", "Password must be at least 8 characters.");
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken: forgotResetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed");
      go("forgot-done");
    } catch (err: any) { Alert.alert("Error", err.message); }
    finally { setLoading(false); }
  };

  // ── OTP INPUT ──────────────────────────────────────────
  const handleOtpChange = (val: string, idx: number) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[idx] = d; setOtp(next);
    if (d && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!d && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  // ── HEADER ─────────────────────────────────────────────
  const isLoginFlow = screen.startsWith("login");
  const isRegFlow = screen.startsWith("reg");
  const isForgotFlow = screen.startsWith("forgot");

  const headerTitle = () => {
    if (screen === "login-role") return "Welcome Back";
    if (screen === "login-creds") return "Sign In";
    if (screen === "login-otp") return "Verify OTP";
    if (screen === "reg-contact") return "Create Account";
    if (screen === "reg-otp") return "Verify Contact";
    if (screen === "reg-role") return "I Am A...";
    if (screen === "reg-details") return "Almost Done";
    if (screen === "forgot-email") return "Reset Password";
    if (screen === "forgot-otp") return "Check Your Email";
    if (screen === "forgot-reset") return "New Password";
    if (screen === "forgot-done") return "All Set!";
    return "";
  };

  const headerSub = () => {
    if (screen === "login-role") return "Select your role to continue";
    if (screen === "login-creds") return `Logging in as ${activeRole.label}`;
    if (screen === "login-otp") return `OTP sent to ${identifier}`;
    if (screen === "reg-contact") return "Enter your email or phone to get started";
    if (screen === "reg-otp") return `We sent a code to ${regContact}`;
    if (screen === "reg-role") return "Tell us who you are";
    if (screen === "reg-details") return "Fill in your details";
    if (screen === "forgot-email") return "Enter your registered email";
    if (screen === "forgot-otp") return `A 6-digit code was sent to ${forgotEmail}`;
    if (screen === "forgot-reset") return "Choose a strong new password";
    if (screen === "forgot-done") return "Your password has been updated";
    return "";
  };

  const canGoBack = screen !== "login-role";
  const handleBack = () => {
    if (screen === "login-creds") go("login-role");
    else if (screen === "login-otp") go("login-creds");
    else if (screen === "reg-contact") go("login-role");
    else if (screen === "reg-otp") go("reg-contact");
    else if (screen === "reg-role") go("reg-otp");
    else if (screen === "reg-details") go("reg-role");
    else if (screen === "forgot-email") go("login-creds");
    else if (screen === "forgot-otp") go("forgot-email");
    else if (screen === "forgot-reset") go("forgot-otp");
    else if (screen === "forgot-done") go("login-role");
    else go("login-role");
  };

  return (
    <View style={styles.root}>
      {/* ── TOP GRADIENT ILLUSTRATION ── */}
      <LinearGradient
        colors={["#110826", "#2D1065", "#4C1D95"]}
        style={[styles.topArea, { height: TOP_H + insets.top }]}
        start={{ x: 0.1, y: 0 }} end={{ x: 0.9, y: 1 }}
      >
        {/* Glow blobs */}
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        {/* Back button */}
        {canGoBack && (
          <TouchableOpacity
            style={[styles.backBtn, { top: insets.top + 12 }]}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={20} color="#fff" />
          </TouchableOpacity>
        )}

        {/* Logo row */}
        <View style={[styles.topContent, { paddingTop: insets.top + 16 }]}>
          <View style={styles.logoWrap}>
            <Image source={require("../assets/images/icon_nobg.png")} style={styles.logoImg} resizeMode="contain" />
          </View>
          <Text style={[styles.appName, { fontFamily: "Roboto_700Bold" }]}>
            SAMIKARAN<Text style={{ color: "#FF2FBF" }}>.</Text>
          </Text>
          <Text style={[styles.appTagline, { fontFamily: "Roboto_400Regular" }]}>OLYMPIAD PLATFORM</Text>
        </View>

        {/* Icon for special screens */}
        {(screen === "login-otp" || screen === "reg-otp" || screen === "forgot-otp") && (
          <View style={styles.screenIcon}>
            <LinearGradient colors={["#8A2BE2", "#FF2FBF"]} style={styles.screenIconGrad}>
              <Ionicons name="mail-outline" size={28} color="#fff" />
            </LinearGradient>
          </View>
        )}
        {screen === "forgot-done" && (
          <View style={styles.screenIcon}>
            <LinearGradient colors={["#059669", "#10b981"]} style={styles.screenIconGrad}>
              <Ionicons name="checkmark-circle" size={28} color="#fff" />
            </LinearGradient>
          </View>
        )}
      </LinearGradient>

      {/* ── WHITE CARD ── */}
      <KeyboardAvoidingView
        style={styles.cardKav}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={styles.card}>
          {/* Pill handle */}
          <View style={styles.handle} />

          <Text style={[styles.cardTitle, { fontFamily: "Roboto_700Bold" }]}>{headerTitle()}</Text>
          <Text style={[styles.cardSub, { fontFamily: "Roboto_400Regular" }]}>{headerSub()}</Text>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{ paddingBottom: insets.bottom + 24, gap: 12 }}
          >
            {/* ── ROLE SELECTION (Login) ── */}
            {screen === "login-role" && (
              <>
                {ROLES.map((r) => {
                  const sel = selectedRole === r.role;
                  return (
                    <TouchableOpacity
                      key={r.role}
                      style={[styles.roleCard, { backgroundColor: sel ? r.bg : "#fafafa", borderColor: sel ? r.color : "#e5e7eb", borderWidth: sel ? 2 : 1 }]}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedRole(r.role); }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.roleIconBox, { backgroundColor: sel ? r.color : "#f3f4f6" }]}>
                        <Ionicons name={r.icon} size={22} color={sel ? "#fff" : "#9ca3af"} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.roleLabel, { fontFamily: "Roboto_700Bold", color: sel ? r.color : "#111827" }]}>{r.label}</Text>
                        <Text style={[styles.roleSub, { fontFamily: "Roboto_400Regular" }]} numberOfLines={1}>{r.subtitle}</Text>
                      </View>
                      {sel && <Ionicons name="checkmark-circle" size={20} color={r.color} />}
                    </TouchableOpacity>
                  );
                })}
                <GradBtn label="Continue" loading={false} onPress={() => go("login-creds")} />
                <TouchableOpacity style={styles.switchRow} onPress={() => go("reg-contact")}>
                  <Text style={[styles.switchTxt, { fontFamily: "Roboto_400Regular" }]}>Don't have an account? </Text>
                  <Text style={[styles.switchLink, { fontFamily: "Roboto_700Bold" }]}>Register</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── LOGIN CREDENTIALS ── */}
            {screen === "login-creds" && (
              <>
                <InputField
                  icon="person-outline"
                  placeholder={selectedRole === "student" ? "Student ID / Email / Phone" : "Email / Username"}
                  value={identifier}
                  onChangeText={setIdentifier}
                  autoCapitalize="none"
                />
                <InputField
                  icon="lock-closed-outline"
                  placeholder="Password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPass}
                  rightIcon={showPass ? "eye-off-outline" : "eye-outline"}
                  onRightPress={() => setShowPass((v) => !v)}
                />
                <TouchableOpacity style={styles.forgotRow} onPress={() => go("forgot-email")}>
                  <Text style={[styles.forgotTxt, { fontFamily: "Roboto_500Medium", color: activeRole.color }]}>Forgot Password?</Text>
                </TouchableOpacity>
                <GradBtn label="Sign In" loading={loading} onPress={handleLoginPassword} />
                <Divider />
                <OutlineBtn icon="phone-portrait-outline" label="Login with OTP" onPress={handleSendLoginOtp} loading={loading} />
              </>
            )}

            {/* ── OTP SCREEN (shared by login, reg, forgot) ── */}
            {(screen === "login-otp" || screen === "reg-otp" || screen === "forgot-otp") && (
              <>
                <OtpRow otp={otp} refs={otpRefs} onChange={handleOtpChange} />
                <GradBtn
                  label="Verify Code"
                  loading={loading}
                  onPress={
                    screen === "login-otp" ? handleVerifyLoginOtp
                    : screen === "reg-otp" ? handleVerifyRegOtp
                    : handleForgotOtp
                  }
                />
                <View style={styles.resendRow}>
                  {resendTimer > 0 ? (
                    <Text style={[styles.resendTxt, { fontFamily: "Roboto_400Regular" }]}>
                      Resend in <Text style={{ color: "#8A2BE2", fontFamily: "Roboto_700Bold" }}>00:{resendTimer.toString().padStart(2, "0")}</Text>
                    </Text>
                  ) : (
                    <TouchableOpacity onPress={screen === "login-otp" ? handleSendLoginOtp : screen === "reg-otp" ? handleCheckContact : handleForgotSend}>
                      <Text style={[styles.resendLink, { fontFamily: "Roboto_700Bold" }]}>Didn't receive it? Resend</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            )}

            {/* ── REGISTER CONTACT ── */}
            {screen === "reg-contact" && (
              <>
                <InputField icon="mail-outline" placeholder="Email or Phone Number" value={regContact} onChangeText={setRegContact} autoCapitalize="none" keyboardType="email-address" />
                <GradBtn label="Send Verification Code" loading={loading} onPress={handleCheckContact} />
                <TouchableOpacity style={styles.switchRow} onPress={() => go("login-role")}>
                  <Text style={[styles.switchTxt, { fontFamily: "Roboto_400Regular" }]}>Already have an account? </Text>
                  <Text style={[styles.switchLink, { fontFamily: "Roboto_700Bold" }]}>Sign In</Text>
                </TouchableOpacity>
              </>
            )}

            {/* ── REGISTER ROLE SELECTION ── */}
            {screen === "reg-role" && (
              <>
                {ROLES.map((r) => {
                  const sel = selectedRole === r.role;
                  return (
                    <TouchableOpacity
                      key={r.role}
                      style={[styles.roleCard, { backgroundColor: sel ? r.bg : "#fafafa", borderColor: sel ? r.color : "#e5e7eb", borderWidth: sel ? 2 : 1 }]}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedRole(r.role); }}
                      activeOpacity={0.75}
                    >
                      <View style={[styles.roleIconBox, { backgroundColor: sel ? r.color : "#f3f4f6" }]}>
                        <Ionicons name={r.icon} size={22} color={sel ? "#fff" : "#9ca3af"} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.roleLabel, { fontFamily: "Roboto_700Bold", color: sel ? r.color : "#111827" }]}>{r.label}</Text>
                        <Text style={[styles.roleSub, { fontFamily: "Roboto_400Regular" }]} numberOfLines={1}>{r.subtitle}</Text>
                      </View>
                      {sel && <Ionicons name="checkmark-circle" size={20} color={r.color} />}
                    </TouchableOpacity>
                  );
                })}
                <GradBtn label="Continue" loading={false} onPress={() => go("reg-details")} />
              </>
            )}

            {/* ── REGISTER DETAILS ── */}
            {screen === "reg-details" && (
              <>
                <InputField icon="person-outline" placeholder="Full Name" value={regName} onChangeText={setRegName} />
                <InputField
                  icon="lock-closed-outline"
                  placeholder="Create Password"
                  value={regPassword}
                  onChangeText={setRegPassword}
                  secureTextEntry={!regShowPass}
                  rightIcon={regShowPass ? "eye-off-outline" : "eye-outline"}
                  onRightPress={() => setRegShowPass((v) => !v)}
                />
                <Text style={[styles.passHint, { fontFamily: "Roboto_400Regular" }]}>
                  Min 8 chars · Uppercase · Number · Special character
                </Text>
                <GradBtn label="Create My Account" loading={loading} onPress={handleRegister} />
              </>
            )}

            {/* ── FORGOT EMAIL ── */}
            {screen === "forgot-email" && (
              <>
                <InputField icon="mail-outline" placeholder="Registered Email Address" value={forgotEmail} onChangeText={setForgotEmail} autoCapitalize="none" keyboardType="email-address" />
                <GradBtn label="Send Reset Code" loading={loading} onPress={handleForgotSend} />
              </>
            )}

            {/* ── FORGOT RESET ── */}
            {screen === "forgot-reset" && (
              <>
                <InputField
                  icon="lock-closed-outline"
                  placeholder="New Password"
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPass}
                  rightIcon={showNewPass ? "eye-off-outline" : "eye-outline"}
                  onRightPress={() => setShowNewPass((v) => !v)}
                />
                <Text style={[styles.passHint, { fontFamily: "Roboto_400Regular" }]}>
                  Min 8 chars · Uppercase · Number · Special character
                </Text>
                <GradBtn label="Update Password" loading={loading} onPress={handleResetPassword} />
              </>
            )}

            {/* ── FORGOT DONE ── */}
            {screen === "forgot-done" && (
              <>
                <Text style={[styles.doneText, { fontFamily: "Roboto_400Regular" }]}>
                  Your password has been successfully updated. You can now sign in with your new password.
                </Text>
                <GradBtn label="Back to Sign In" loading={false} onPress={() => { setScreen("login-creds"); setForgotEmail(""); setNewPassword(""); }} />
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── REUSABLE COMPONENTS ──────────────────────────────────

function InputField({
  icon, placeholder, value, onChangeText, secureTextEntry, rightIcon, onRightPress, autoCapitalize, keyboardType,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  placeholder: string;
  value: string;
  onChangeText: (v: string) => void;
  secureTextEntry?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void;
  autoCapitalize?: "none" | "sentences" | "words" | "characters";
  keyboardType?: any;
}) {
  return (
    <View style={styles.inputWrap}>
      <Ionicons name={icon} size={18} color="#a78bfa" style={{ marginRight: 10 }} />
      <TextInput
        style={[styles.inputField, { fontFamily: "Roboto_400Regular" }]}
        placeholder={placeholder}
        placeholderTextColor="#b0b7c3"
        value={value}
        onChangeText={onChangeText}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize ?? "sentences"}
        autoCorrect={false}
        keyboardType={keyboardType}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Ionicons name={rightIcon} size={18} color="#b0b7c3" />
        </TouchableOpacity>
      )}
    </View>
  );
}

function GradBtn({ label, loading, onPress }: { label: string; loading: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.ctaWrap, { opacity: loading ? 0.75 : 1 }]} onPress={onPress} disabled={loading} activeOpacity={0.88}>
      <LinearGradient colors={["#8A2BE2", "#c026d3", "#FF2FBF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={[styles.ctaTxt, { fontFamily: "Roboto_700Bold" }]}>{label}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function OutlineBtn({ icon, label, onPress, loading }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; loading: boolean }) {
  return (
    <TouchableOpacity style={styles.outlineBtn} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      <Ionicons name={icon} size={18} color="#8A2BE2" style={{ marginRight: 8 }} />
      <Text style={[styles.outlineBtnTxt, { fontFamily: "Roboto_600SemiBold" ?? "Roboto_700Bold" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return (
    <View style={styles.divider}>
      <View style={styles.dividerLine} />
      <Text style={[styles.dividerTxt, { fontFamily: "Roboto_400Regular" }]}>or</Text>
      <View style={styles.dividerLine} />
    </View>
  );
}

function OtpRow({ otp, refs, onChange }: { otp: string[]; refs: React.MutableRefObject<(TextInput | null)[]>; onChange: (v: string, i: number) => void }) {
  return (
    <View style={styles.otpRow}>
      {otp.map((v, i) => (
        <TextInput
          key={i}
          ref={(r) => { refs.current[i] = r; }}
          style={[styles.otpBox, v ? styles.otpBoxFilled : {}]}
          value={v}
          onChangeText={(t) => onChange(t, i)}
          keyboardType="number-pad"
          maxLength={1}
          textAlign="center"
          selectTextOnFocus
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#4C1D95" },

  // Top area
  topArea: { alignItems: "center", justifyContent: "flex-end", paddingBottom: 0, overflow: "hidden" },
  blob1: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "#8A2BE2", opacity: 0.18, top: -40, left: -40 },
  blob2: { position: "absolute", width: 180, height: 180, borderRadius: 90, backgroundColor: "#FF2FBF", opacity: 0.1, top: 20, right: -30 },
  backBtn: { position: "absolute", left: 20, width: 38, height: 38, borderRadius: 19, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", zIndex: 10 },
  topContent: { alignItems: "center", gap: 4, paddingBottom: 24 },
  logoWrap: { width: 64, height: 64, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.15)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.25)", marginBottom: 6 },
  logoImg: { width: 48, height: 48 },
  appName: { fontSize: 24, color: "#fff", letterSpacing: 2.5 },
  appTagline: { fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: 4 },
  screenIcon: { position: "absolute", bottom: -24, alignSelf: "center", zIndex: 20 },
  screenIconGrad: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center", shadowColor: "#8A2BE2", shadowOpacity: 0.4, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 8 },

  // Card
  cardKav: { flex: 1 },
  card: { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 24, paddingTop: 16, marginTop: -2 },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 20 },
  cardTitle: { fontSize: 24, color: "#111827", marginBottom: 4 },
  cardSub: { fontSize: 13, color: "#9ca3af", marginBottom: 20 },

  // Role cards
  roleCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, gap: 12 },
  roleIconBox: { width: 46, height: 46, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  roleLabel: { fontSize: 15, marginBottom: 2 },
  roleSub: { fontSize: 12, color: "#9ca3af" },

  // Input
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "#f7f8fc", borderWidth: 1.5, borderColor: "#ede9fe", borderRadius: 14, paddingHorizontal: 16, paddingVertical: 14 },
  inputField: { flex: 1, fontSize: 14, color: "#111827" },

  // Forgot
  forgotRow: { alignSelf: "flex-end", marginTop: -4 },
  forgotTxt: { fontSize: 13, color: "#8A2BE2" },

  // CTA
  ctaWrap: { borderRadius: 16, overflow: "hidden" },
  cta: { paddingVertical: 16, alignItems: "center" },
  ctaTxt: { color: "#fff", fontSize: 16, letterSpacing: 0.3 },

  // Outline btn
  outlineBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#ede9fe", borderRadius: 16, paddingVertical: 14, backgroundColor: "#faf5ff" },
  outlineBtnTxt: { fontSize: 14, color: "#8A2BE2" },

  // Divider
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#f3f4f6" },
  dividerTxt: { fontSize: 12, color: "#d1d5db" },

  // OTP
  otpRow: { flexDirection: "row", justifyContent: "space-between", gap: 8, marginVertical: 4 },
  otpBox: { flex: 1, height: 54, borderRadius: 14, borderWidth: 1.5, borderColor: "#e5e7eb", fontSize: 22, color: "#111827", backgroundColor: "#f9fafb", fontFamily: "Roboto_700Bold" },
  otpBoxFilled: { borderColor: "#8A2BE2", backgroundColor: "#faf5ff" },

  // Resend
  resendRow: { alignItems: "center" },
  resendTxt: { fontSize: 13, color: "#9ca3af" },
  resendLink: { fontSize: 13, color: "#8A2BE2" },

  // Switch
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  switchTxt: { fontSize: 13, color: "#6b7280" },
  switchLink: { fontSize: 13, color: "#8A2BE2" },

  // Pass hint
  passHint: { fontSize: 11, color: "#9ca3af", lineHeight: 16, marginTop: -4 },

  // Done
  doneText: { fontSize: 14, color: "#6b7280", lineHeight: 22, textAlign: "center" },
});
