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
  Animated,
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
  | "login-role" | "login-creds" | "login-otp"
  | "reg-contact" | "reg-otp" | "reg-role" | "reg-details"
  | "forgot-email" | "forgot-otp" | "forgot-reset" | "forgot-done";

const ROLES: { role: RoleKey; label: string; subtitle: string; icon: keyof typeof Ionicons.glyphMap; color: string; bg: string }[] = [
  { role: "student", label: "Student",  subtitle: "Take exams & track progress",    icon: "school-outline",    color: "#8A2BE2", bg: "#f3e8ff" },
  { role: "school",  label: "School",   subtitle: "Manage students & olympiads",   icon: "business-outline",  color: "#0284c7", bg: "#e0f2fe" },
  { role: "parent",  label: "Parent",   subtitle: "Monitor your child's growth",   icon: "people-outline",    color: "#059669", bg: "#d1fae5" },
  { role: "partner", label: "Partner",  subtitle: "Referrals & earn commission",   icon: "briefcase-outline", color: "#b45309", bg: "#fef9c3" },
];

const TOP_H = height * 0.34;

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

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const [resendTimer, setResendTimer] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [regContact, setRegContact] = useState("");
  const [regVerifyToken, setRegVerifyToken] = useState("");
  const [regName, setRegName] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regShowPass, setRegShowPass] = useState(false);

  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotResetToken, setForgotResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);

  const [errors, setErrors] = useState<Record<string, string>>({});

  const activeRole = ROLES.find((r) => r.role === selectedRole)!;
  const otpStr = otp.join("");

  const setErr = (key: string, msg: string) => setErrors((e) => ({ ...e, [key]: msg }));
  const clearErr = (key: string) => setErrors((e) => { const n = { ...e }; delete n[key]; return n; });
  const clearAllErrors = () => setErrors({});

  const startResendTimer = useCallback(() => {
    setResendTimer(59);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; });
    }, 1000);
  }, []);

  const go = useCallback((s: Screen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    clearAllErrors();
    setScreen(s);
  }, []);

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

  // ── LOGIN ─────────────────────────────────────────────
  const handleLoginPassword = async () => {
    let valid = true;
    if (!identifier.trim()) { setErr("identifier", "Please enter your ID, email or phone."); valid = false; }
    if (!password.trim()) { setErr("password", "Password cannot be empty."); valid = false; }
    if (!valid) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ identifier: identifier.trim(), password, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed. Please check your credentials.");
      await login({ id: data.id, username: data.username, fullName: data.fullName ?? data.username, role: selectedRole, email: data.email, xp: data.xp ?? 0, level: data.level ?? 1, streak: data.streak ?? 0, grade: data.grade });
      switch (selectedRole) {
        case "student": router.replace("/(student)/home"); break;
        case "school":  router.replace("/(school)/home");  break;
        case "parent":  router.replace("/(parent)/home");  break;
        case "partner": router.replace("/(partner)/home"); break;
      }
    } catch (err: any) {
      setErr("login", err.message);
    } finally { setLoading(false); }
  };

  const handleSendLoginOtp = async () => {
    if (!identifier.trim()) { setErr("identifier", "Enter your Student ID, email or phone."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login-otp/send`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP");
      setOtp(["", "", "", "", "", ""]); startResendTimer(); go("login-otp");
    } catch (err: any) { setErr("identifier", err.message); }
    finally { setLoading(false); }
  };

  const handleVerifyLoginOtp = async () => {
    if (otpStr.length < 6) { setErr("otp", "Enter the complete 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login-otp/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ identifier: identifier.trim(), otp: otpStr, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid or expired OTP.");
      await login({ id: data.id, username: data.username, fullName: data.fullName ?? data.username, role: selectedRole, email: data.email, xp: data.xp ?? 0, level: data.level ?? 1, streak: data.streak ?? 0, grade: data.grade });
      switch (selectedRole) {
        case "student": router.replace("/(student)/home"); break;
        case "school":  router.replace("/(school)/home");  break;
        case "parent":  router.replace("/(parent)/home");  break;
        case "partner": router.replace("/(partner)/home"); break;
      }
    } catch (err: any) { setErr("otp", err.message); }
    finally { setLoading(false); }
  };

  // ── REGISTER ─────────────────────────────────────────
  const handleCheckContact = async () => {
    if (!regContact.trim()) { setErr("regContact", "Enter your email or phone number."); return; }
    setLoading(true);
    try {
      const checkRes = await fetch(`${BASE_URL}/api/auth/check-contact`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: regContact.trim() }),
      });
      const checkData = await checkRes.json();
      if (!checkRes.ok) throw new Error(checkData.message || "This contact is already registered.");
      const otpRes = await fetch(`${BASE_URL}/api/otp/send`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: regContact.trim() }),
      });
      const otpData = await otpRes.json();
      if (!otpRes.ok) throw new Error(otpData.message || "Failed to send OTP.");
      setOtp(["", "", "", "", "", ""]); startResendTimer(); go("reg-otp");
    } catch (err: any) { setErr("regContact", err.message); }
    finally { setLoading(false); }
  };

  const handleVerifyRegOtp = async () => {
    if (otpStr.length < 6) { setErr("otp", "Enter the complete 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/otp/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: regContact.trim(), otp: otpStr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid or expired OTP.");
      setRegVerifyToken(data.verificationToken || ""); go("reg-role");
    } catch (err: any) { setErr("otp", err.message); }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    let valid = true;
    if (!regName.trim()) { setErr("regName", "Full name is required."); valid = false; }
    if (!regPassword.trim()) { setErr("regPassword", "Please set a password."); valid = false; }
    else if (regPassword.length < 8) { setErr("regPassword", "Password must be at least 8 characters."); valid = false; }
    if (!valid) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setLoading(true);
    try {
      const endpoint = selectedRole === "student" ? "/api/registration/student" : selectedRole === "school" ? "/api/registration/school" : "/api/registration/supervisor";
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: regContact.trim(), fullName: regName.trim(), password: regPassword, verificationToken: regVerifyToken, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed.");
      Alert.alert("🎉 Account Created!", "You can now sign in.", [{ text: "Sign In", onPress: () => { go("login-role"); setIdentifier(""); setPassword(""); } }]);
    } catch (err: any) { setErr("regName", err.message); }
    finally { setLoading(false); }
  };

  // ── FORGOT PASSWORD ───────────────────────────────────
  const handleForgotSend = async () => {
    if (!forgotEmail.trim()) { setErr("forgotEmail", "Enter your registered email address."); return; }
    if (!forgotEmail.includes("@")) { setErr("forgotEmail", "Enter a valid email address."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reset code.");
      setOtp(["", "", "", "", "", ""]); startResendTimer(); go("forgot-otp");
    } catch (err: any) { setErr("forgotEmail", err.message); }
    finally { setLoading(false); }
  };

  const handleForgotOtp = async () => {
    if (otpStr.length < 6) { setErr("otp", "Enter the complete 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify-reset-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), otp: otpStr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid or expired code.");
      setForgotResetToken(data.resetToken || ""); go("forgot-reset");
    } catch (err: any) { setErr("otp", err.message); }
    finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) { setErr("newPassword", "Enter a new password."); return; }
    if (newPassword.length < 8) { setErr("newPassword", "Password must be at least 8 characters."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resetToken: forgotResetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password.");
      go("forgot-done");
    } catch (err: any) { setErr("newPassword", err.message); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (val: string, idx: number) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[idx] = d; setOtp(next);
    clearErr("otp");
    if (d && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!d && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const headerInfo: Record<Screen, { title: string; sub: string }> = {
    "login-role":   { title: "Welcome Back", sub: "Select your role to continue" },
    "login-creds":  { title: "Sign In", sub: `Logging in as ${activeRole.label}` },
    "login-otp":    { title: "Enter Code", sub: `OTP sent to ${identifier}` },
    "reg-contact":  { title: "Create Account", sub: "Enter your email or phone to start" },
    "reg-otp":      { title: "Verify Contact", sub: `Code sent to ${regContact}` },
    "reg-role":     { title: "I Am A...", sub: "Choose your role on Samikaran" },
    "reg-details":  { title: "Almost Done", sub: "Fill in your account details" },
    "forgot-email": { title: "Reset Password", sub: "Enter your registered email" },
    "forgot-otp":   { title: "Check Email", sub: `Code sent to ${forgotEmail}` },
    "forgot-reset": { title: "New Password", sub: "Choose a strong new password" },
    "forgot-done":  { title: "All Set!", sub: "Your password has been updated" },
  };

  const showOtpIcon = screen === "login-otp" || screen === "reg-otp" || screen === "forgot-otp";
  const showDoneIcon = screen === "forgot-done";
  const canGoBack = screen !== "login-role";

  return (
    <View style={styles.root}>
      {/* ── GRADIENT TOP ── */}
      <LinearGradient
        colors={["#110826", "#2D1065", "#5b21b6"]}
        style={[styles.topArea, { height: TOP_H + insets.top }]}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
      >
        <View style={styles.blob1} />
        <View style={styles.blob2} />

        <View style={[styles.topContent, { paddingTop: insets.top + 20 }]}>
          {showOtpIcon ? (
            <LinearGradient colors={["#8A2BE2", "#FF2FBF"]} style={styles.otpIcon}>
              <Ionicons name="mail-outline" size={30} color="#fff" />
            </LinearGradient>
          ) : showDoneIcon ? (
            <LinearGradient colors={["#059669", "#10b981"]} style={styles.otpIcon}>
              <Ionicons name="checkmark-circle" size={30} color="#fff" />
            </LinearGradient>
          ) : (
            <View style={styles.logoWrap}>
              <Image source={require("../assets/images/icon_nobg.png")} style={styles.logoImg} resizeMode="contain" />
            </View>
          )}
          <Text style={[styles.appName, { fontFamily: "Roboto_700Bold" }]}>
            SAMIKARAN<Text style={{ color: "#FF2FBF" }}>.</Text>
          </Text>
          <Text style={[styles.appTagline, { fontFamily: "Roboto_400Regular" }]}>OLYMPIAD PLATFORM</Text>
        </View>
      </LinearGradient>

      {/* ── WHITE CARD ── */}
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
        <View style={styles.card}>
          <View style={styles.handle} />

          {/* Back + Title Row */}
          <View style={styles.titleRow}>
            {canGoBack ? (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-back" size={22} color="#8A2BE2" />
              </TouchableOpacity>
            ) : (
              <View style={styles.backPlaceholder} />
            )}
            <View style={styles.titleBlock}>
              <Text style={[styles.cardTitle, { fontFamily: "Roboto_700Bold" }]}>{headerInfo[screen].title}</Text>
              <Text style={[styles.cardSub, { fontFamily: "Roboto_400Regular" }]}>{headerInfo[screen].sub}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}>

            {/* ── LOGIN ROLE SELECT ── */}
            {screen === "login-role" && <>
              {ROLES.map((r) => {
                const sel = selectedRole === r.role;
                return (
                  <TouchableOpacity key={r.role} style={[styles.roleCard, sel && { borderColor: r.color, backgroundColor: r.bg }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedRole(r.role); }} activeOpacity={0.75}>
                    <View style={[styles.roleIconBox, { backgroundColor: sel ? r.color : "#f3f4f6" }]}>
                      <Ionicons name={r.icon} size={20} color={sel ? "#fff" : "#9ca3af"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleLabel, { fontFamily: "Roboto_700Bold", color: sel ? r.color : "#1c1c1e" }]}>{r.label}</Text>
                      <Text style={[styles.roleSub, { fontFamily: "Roboto_400Regular" }]}>{r.subtitle}</Text>
                    </View>
                    {sel && <Ionicons name="checkmark-circle" size={20} color={r.color} />}
                  </TouchableOpacity>
                );
              })}
              <GradBtn label="Continue" loading={false} onPress={() => go("login-creds")} />
              <SwitchRow question="Don't have an account?" linkText="Register" onPress={() => go("reg-contact")} />
            </>}

            {/* ── LOGIN CREDS ── */}
            {screen === "login-creds" && <>
              <AppleInput
                icon="person-outline" label={selectedRole === "student" ? "Student ID / Email / Phone" : "Email / Username"}
                value={identifier} onChangeText={(v) => { setIdentifier(v); clearErr("identifier"); clearErr("login"); }}
                autoCapitalize="none" error={errors.identifier}
              />
              <AppleInput
                icon="lock-closed-outline" label="Password"
                value={password} onChangeText={(v) => { setPassword(v); clearErr("password"); clearErr("login"); }}
                secureTextEntry={!showPass} rightIcon={showPass ? "eye-off-outline" : "eye-outline"} onRightPress={() => setShowPass(v => !v)}
                error={errors.password}
              />
              {errors.login && <ErrorBanner message={errors.login} />}
              <TouchableOpacity onPress={() => go("forgot-email")} style={styles.forgotBtn}>
                <Text style={[styles.forgotTxt, { fontFamily: "Roboto_500Medium", color: activeRole.color }]}>Forgot Password?</Text>
              </TouchableOpacity>
              <GradBtn label="Sign In" loading={loading} onPress={handleLoginPassword} />
              <Divider />
              <OutlineBtn icon="phone-portrait-outline" label="Login with OTP instead" onPress={handleSendLoginOtp} loading={loading} color="#8A2BE2" />
            </>}

            {/* ── OTP ── */}
            {(screen === "login-otp" || screen === "reg-otp" || screen === "forgot-otp") && <>
              <OtpRow otp={otp} refs={otpRefs} onChange={handleOtpChange} />
              {errors.otp && <ErrorBanner message={errors.otp} />}
              <GradBtn
                label="Verify Code" loading={loading}
                onPress={screen === "login-otp" ? handleVerifyLoginOtp : screen === "reg-otp" ? handleVerifyRegOtp : handleForgotOtp}
              />
              <ResendRow timer={resendTimer} onResend={screen === "login-otp" ? handleSendLoginOtp : screen === "reg-otp" ? handleCheckContact : handleForgotSend} />
            </>}

            {/* ── REG CONTACT ── */}
            {screen === "reg-contact" && <>
              <AppleInput icon="mail-outline" label="Email or Phone Number" value={regContact}
                onChangeText={(v) => { setRegContact(v); clearErr("regContact"); }} autoCapitalize="none"
                keyboardType="email-address" error={errors.regContact} />
              <GradBtn label="Send Verification Code" loading={loading} onPress={handleCheckContact} />
              <SwitchRow question="Already have an account?" linkText="Sign In" onPress={() => go("login-role")} />
            </>}

            {/* ── REG ROLE ── */}
            {screen === "reg-role" && <>
              {ROLES.map((r) => {
                const sel = selectedRole === r.role;
                return (
                  <TouchableOpacity key={r.role} style={[styles.roleCard, sel && { borderColor: r.color, backgroundColor: r.bg }]}
                    onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedRole(r.role); }} activeOpacity={0.75}>
                    <View style={[styles.roleIconBox, { backgroundColor: sel ? r.color : "#f3f4f6" }]}>
                      <Ionicons name={r.icon} size={20} color={sel ? "#fff" : "#9ca3af"} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.roleLabel, { fontFamily: "Roboto_700Bold", color: sel ? r.color : "#1c1c1e" }]}>{r.label}</Text>
                      <Text style={[styles.roleSub, { fontFamily: "Roboto_400Regular" }]}>{r.subtitle}</Text>
                    </View>
                    {sel && <Ionicons name="checkmark-circle" size={20} color={r.color} />}
                  </TouchableOpacity>
                );
              })}
              <GradBtn label="Continue" loading={false} onPress={() => go("reg-details")} />
            </>}

            {/* ── REG DETAILS ── */}
            {screen === "reg-details" && <>
              <AppleInput icon="person-outline" label="Full Name" value={regName}
                onChangeText={(v) => { setRegName(v); clearErr("regName"); }} error={errors.regName} />
              <AppleInput icon="lock-closed-outline" label="Create Password" value={regPassword}
                onChangeText={(v) => { setRegPassword(v); clearErr("regPassword"); }}
                secureTextEntry={!regShowPass} rightIcon={regShowPass ? "eye-off-outline" : "eye-outline"}
                onRightPress={() => setRegShowPass(v => !v)} error={errors.regPassword} />
              <Text style={[styles.passHint, { fontFamily: "Roboto_400Regular" }]}>
                Min 8 chars · uppercase · number · special character
              </Text>
              <GradBtn label="Create My Account" loading={loading} onPress={handleRegister} />
            </>}

            {/* ── FORGOT EMAIL ── */}
            {screen === "forgot-email" && <>
              <AppleInput icon="mail-outline" label="Registered Email Address" value={forgotEmail}
                onChangeText={(v) => { setForgotEmail(v); clearErr("forgotEmail"); }}
                autoCapitalize="none" keyboardType="email-address" error={errors.forgotEmail} />
              <GradBtn label="Send Reset Code" loading={loading} onPress={handleForgotSend} />
            </>}

            {/* ── FORGOT RESET ── */}
            {screen === "forgot-reset" && <>
              <AppleInput icon="lock-closed-outline" label="New Password" value={newPassword}
                onChangeText={(v) => { setNewPassword(v); clearErr("newPassword"); }}
                secureTextEntry={!showNewPass} rightIcon={showNewPass ? "eye-off-outline" : "eye-outline"}
                onRightPress={() => setShowNewPass(v => !v)} error={errors.newPassword} />
              <Text style={[styles.passHint, { fontFamily: "Roboto_400Regular" }]}>
                Min 8 chars · uppercase · number · special character
              </Text>
              <GradBtn label="Update Password" loading={loading} onPress={handleResetPassword} />
            </>}

            {/* ── FORGOT DONE ── */}
            {screen === "forgot-done" && <>
              <Text style={[styles.doneText, { fontFamily: "Roboto_400Regular" }]}>
                Your password has been successfully updated. You can now sign in with your new credentials.
              </Text>
              <GradBtn label="Back to Sign In" loading={false} onPress={() => { go("login-creds"); setForgotEmail(""); setNewPassword(""); }} />
            </>}

          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

// ── APPLE-STYLE INPUT ──────────────────────────────────
function AppleInput({ icon, label, value, onChangeText, secureTextEntry, rightIcon, onRightPress, autoCapitalize, keyboardType, error }: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string; value: string; onChangeText: (v: string) => void;
  secureTextEntry?: boolean; rightIcon?: keyof typeof Ionicons.glyphMap;
  onRightPress?: () => void; autoCapitalize?: any; keyboardType?: any; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const labelAnim = useRef(new Animated.Value(value ? 1 : 0)).current;

  const onFocus = () => {
    setFocused(true);
    Animated.timing(labelAnim, { toValue: 1, duration: 180, useNativeDriver: false }).start();
  };
  const onBlur = () => {
    setFocused(false);
    if (!value) Animated.timing(labelAnim, { toValue: 0, duration: 180, useNativeDriver: false }).start();
  };

  const labelTop = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [17, 6] });
  const labelSize = labelAnim.interpolate({ inputRange: [0, 1], outputRange: [15, 11] });
  const labelColor = labelAnim.interpolate({ inputRange: [0, 1], outputRange: ["#b0b7c3", error ? "#ef4444" : focused ? "#8A2BE2" : "#8e8e93"] });

  return (
    <View style={{ marginBottom: 4 }}>
      <View style={[styles.appleInput, focused && styles.appleInputFocused, !!error && styles.appleInputError]}>
        <Ionicons name={icon} size={18} color={error ? "#ef4444" : focused ? "#8A2BE2" : "#b0b7c3"} style={styles.appleIcon} />
        <View style={{ flex: 1 }}>
          <Animated.Text style={[styles.floatLabel, { top: labelTop, fontSize: labelSize, color: labelColor }]} pointerEvents="none">
            {label}
          </Animated.Text>
          <TextInput
            style={[styles.appleField, { fontFamily: "Roboto_400Regular" }]}
            value={value}
            onChangeText={onChangeText}
            onFocus={onFocus}
            onBlur={onBlur}
            secureTextEntry={secureTextEntry}
            autoCapitalize={autoCapitalize ?? "sentences"}
            autoCorrect={false}
            keyboardType={keyboardType}
          />
        </View>
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={rightIcon} size={18} color="#b0b7c3" />
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <View style={styles.errRow}>
          <Ionicons name="alert-circle" size={13} color="#ef4444" />
          <Text style={[styles.errTxt, { fontFamily: "Roboto_400Regular" }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ErrorBanner({ message }: { message: string }) {
  return (
    <View style={styles.errorBanner}>
      <Ionicons name="alert-circle-outline" size={16} color="#ef4444" />
      <Text style={[styles.errorBannerTxt, { fontFamily: "Roboto_500Medium" }]}>{message}</Text>
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

function OutlineBtn({ icon, label, onPress, loading, color }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; loading: boolean; color: string }) {
  return (
    <TouchableOpacity style={[styles.outlineBtn, { borderColor: color + "33" }]} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      <Ionicons name={icon} size={17} color={color} style={{ marginRight: 8 }} />
      <Text style={[styles.outlineBtnTxt, { fontFamily: "Roboto_700Bold", color }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function Divider() {
  return (
    <View style={styles.divider}>
      <View style={styles.divLine} />
      <Text style={[styles.divTxt, { fontFamily: "Roboto_400Regular" }]}>or</Text>
      <View style={styles.divLine} />
    </View>
  );
}

function OtpRow({ otp, refs, onChange }: { otp: string[]; refs: React.MutableRefObject<(TextInput | null)[]>; onChange: (v: string, i: number) => void }) {
  return (
    <View style={styles.otpRow}>
      {otp.map((v, i) => (
        <TextInput
          key={i} ref={(r) => { refs.current[i] = r; }}
          style={[styles.otpBox, v ? styles.otpFilled : undefined]}
          value={v} onChangeText={(t) => onChange(t, i)}
          keyboardType="number-pad" maxLength={1} textAlign="center" selectTextOnFocus
        />
      ))}
    </View>
  );
}

function SwitchRow({ question, linkText, onPress }: { question: string; linkText: string; onPress: () => void }) {
  return (
    <View style={styles.switchRow}>
      <Text style={[styles.switchTxt, { fontFamily: "Roboto_400Regular" }]}>{question} </Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={[styles.switchLink, { fontFamily: "Roboto_700Bold" }]}>{linkText}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ResendRow({ timer, onResend }: { timer: number; onResend: () => void }) {
  return (
    <View style={styles.resendRow}>
      {timer > 0 ? (
        <Text style={[styles.resendTxt, { fontFamily: "Roboto_400Regular" }]}>
          Resend in <Text style={{ color: "#8A2BE2", fontFamily: "Roboto_700Bold" }}>00:{timer.toString().padStart(2, "0")}</Text>
        </Text>
      ) : (
        <TouchableOpacity onPress={onResend}>
          <Text style={[styles.resendLink, { fontFamily: "Roboto_700Bold" }]}>Didn't receive it? Resend</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#110826" },
  flex1: { flex: 1 },

  // Top
  topArea: { alignItems: "center", justifyContent: "flex-end", overflow: "hidden" },
  blob1: { position: "absolute", width: 260, height: 260, borderRadius: 130, backgroundColor: "#8A2BE2", opacity: 0.2, top: -60, left: -50 },
  blob2: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "#FF2FBF", opacity: 0.1, top: 10, right: -40 },
  topContent: { alignItems: "center", gap: 4, paddingBottom: 28 },
  logoWrap: { width: 68, height: 68, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.12)", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)", marginBottom: 8 },
  logoImg: { width: 50, height: 50 },
  otpIcon: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 8, elevation: 8, shadowColor: "#8A2BE2", shadowOpacity: 0.4, shadowRadius: 16, shadowOffset: { width: 0, height: 4 } },
  appName: { fontSize: 22, color: "#fff", letterSpacing: 2.5 },
  appTagline: { fontSize: 10, color: "rgba(255,255,255,0.45)", letterSpacing: 4 },

  // Card
  card: { flex: 1, backgroundColor: "#fff", borderTopLeftRadius: 30, borderTopRightRadius: 30, paddingTop: 12, paddingHorizontal: 24 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 16 },

  // Title row with back
  titleRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20, gap: 8 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f5f3ff", alignItems: "center", justifyContent: "center", marginTop: 2 },
  backPlaceholder: { width: 36 },
  titleBlock: { flex: 1 },
  cardTitle: { fontSize: 26, color: "#1c1c1e", lineHeight: 32 },
  cardSub: { fontSize: 13, color: "#8e8e93", marginTop: 2 },

  scrollContent: { gap: 12 },

  // Role cards
  roleCard: { flexDirection: "row", alignItems: "center", padding: 14, borderRadius: 16, gap: 12, backgroundColor: "#fafafa", borderWidth: 1.5, borderColor: "#e5e7eb" },
  roleIconBox: { width: 44, height: 44, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  roleLabel: { fontSize: 15, marginBottom: 2 },
  roleSub: { fontSize: 11, color: "#8e8e93" },

  // Apple input
  appleInput: { flexDirection: "row", alignItems: "center", backgroundColor: "#f2f2f7", borderRadius: 14, borderWidth: 1.5, borderColor: "#e5e7eb", paddingHorizontal: 14, paddingTop: 22, paddingBottom: 10, minHeight: 62 },
  appleInputFocused: { borderColor: "#8A2BE2", backgroundColor: "#faf5ff" },
  appleInputError: { borderColor: "#ef4444", backgroundColor: "#fff5f5" },
  appleIcon: { marginRight: 10, marginTop: -4 },
  floatLabel: { position: "absolute", left: 0, fontFamily: "Roboto_400Regular" },
  appleField: { fontSize: 15, color: "#1c1c1e", paddingTop: 2 },

  // Error
  errRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, marginLeft: 4 },
  errTxt: { fontSize: 12, color: "#ef4444" },
  errorBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, padding: 12 },
  errorBannerTxt: { flex: 1, fontSize: 13, color: "#ef4444" },

  // Forgot
  forgotBtn: { alignSelf: "flex-end", marginTop: -4 },
  forgotTxt: { fontSize: 13 },

  // CTA
  ctaWrap: { borderRadius: 16, overflow: "hidden" },
  cta: { paddingVertical: 17, alignItems: "center" },
  ctaTxt: { color: "#fff", fontSize: 16, letterSpacing: 0.3 },

  // Outline
  outlineBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderRadius: 16, paddingVertical: 15, backgroundColor: "#fff" },
  outlineBtnTxt: { fontSize: 14 },

  // Divider
  divider: { flexDirection: "row", alignItems: "center", gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: "#f3f4f6" },
  divTxt: { fontSize: 12, color: "#c7c7cc" },

  // OTP
  otpRow: { flexDirection: "row", justifyContent: "space-between", gap: 8 },
  otpBox: { flex: 1, height: 58, borderRadius: 14, borderWidth: 1.5, borderColor: "#e5e7eb", fontSize: 24, color: "#1c1c1e", backgroundColor: "#f2f2f7", fontFamily: "Roboto_700Bold", textAlign: "center" },
  otpFilled: { borderColor: "#8A2BE2", backgroundColor: "#faf5ff" },

  // Switch / Resend
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  switchTxt: { fontSize: 13, color: "#6b7280" },
  switchLink: { fontSize: 13, color: "#8A2BE2" },
  resendRow: { alignItems: "center" },
  resendTxt: { fontSize: 13, color: "#8e8e93" },
  resendLink: { fontSize: 13, color: "#8A2BE2" },

  // Pass hint / Done
  passHint: { fontSize: 11, color: "#8e8e93", lineHeight: 16, marginTop: -4 },
  doneText: { fontSize: 14, color: "#6b7280", lineHeight: 22, textAlign: "center", paddingVertical: 8 },
});
