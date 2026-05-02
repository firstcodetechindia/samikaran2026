import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  Image,
  Dimensions,
  KeyboardAvoidingView,
  Modal,
  Animated,
  StatusBar,
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
  { role: "student", label: "Student",  subtitle: "Exams, results & rank",          icon: "school-outline",    color: "#a855f7", bg: "rgba(168,85,247,0.15)" },
  { role: "school",  label: "School",   subtitle: "Manage students & olympiads",    icon: "business-outline",  color: "#38bdf8", bg: "rgba(56,189,248,0.15)" },
  { role: "parent",  label: "Parent",   subtitle: "Track your child's progress",    icon: "people-outline",    color: "#34d399", bg: "rgba(52,211,153,0.15)" },
  { role: "partner", label: "Partner",  subtitle: "Referrals & commissions",        icon: "briefcase-outline", color: "#fbbf24", bg: "rgba(251,191,36,0.15)" },
];

// ── TOAST ────────────────────────────────────────────────
type ToastType = "success" | "error" | "info";
interface ToastState { visible: boolean; message: string; type: ToastType }

function useToast() {
  const [toast, setToast] = useState<ToastState>({ visible: false, message: "", type: "info" });
  const anim = useRef(new Animated.Value(0)).current;
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback((message: string, type: ToastType = "info") => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setToast({ visible: true, message, type });
    Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 20 }).start();
    timerRef.current = setTimeout(() => {
      Animated.timing(anim, { toValue: 0, duration: 300, useNativeDriver: true }).start(() =>
        setToast((t) => ({ ...t, visible: false }))
      );
    }, 3200);
  }, [anim]);

  const ToastComponent = toast.visible ? (
    <Animated.View
      style={[
        styles.toast,
        { opacity: anim, transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-20, 0] }) }] },
        toast.type === "success" && styles.toastSuccess,
        toast.type === "error" && styles.toastError,
      ]}
      pointerEvents="none"
    >
      <Ionicons
        name={toast.type === "success" ? "checkmark-circle" : toast.type === "error" ? "alert-circle" : "information-circle"}
        size={18} color="#fff" />
      <Text style={[styles.toastTxt, { fontFamily: "Roboto_500Medium" }]}>{toast.message}</Text>
    </Animated.View>
  ) : null;

  return { show, ToastComponent };
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const { show: toast, ToastComponent } = useToast();

  const [screen, setScreen] = useState<Screen>("login-role");
  const [selectedRole, setSelectedRole] = useState<RoleKey>("student");
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // Active session modal
  const [sessionModal, setSessionModal] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ device: string; time: string } | null>(null);
  const [forceLogoutMode, setForceLogoutMode] = useState<"password" | "otp">("password");

  const otpStr = otp.join("");
  const setErr = (k: string, v: string) => setErrors((e) => ({ ...e, [k]: v }));
  const clrErr = (k: string) => setErrors((e) => { const n = { ...e }; delete n[k]; return n; });

  const startTimer = useCallback((secs = 90) => {
    setResendTimer(secs);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((t) => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; });
    }, 1000);
  }, []);

  const go = useCallback((s: Screen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrors({});
    setScreen(s);
  }, []);

  const handleBack = () => {
    const map: Partial<Record<Screen, Screen>> = {
      "login-creds": "login-role", "login-otp": "login-creds",
      "reg-contact": "login-role", "reg-otp": "reg-contact", "reg-role": "reg-otp", "reg-details": "reg-role",
      "forgot-email": "login-creds", "forgot-otp": "forgot-email", "forgot-reset": "forgot-otp", "forgot-done": "login-role",
    };
    go(map[screen] ?? "login-role");
  };

  const doLogin = async (userData: any, role: RoleKey) => {
    const u = userData.user ?? userData;
    const firstName = u.firstName || "";
    const lastName = u.lastName || "";
    const fullName = userData.fullName || (firstName + " " + lastName).trim() || u.email || "";
    await login({
      id: u.id,
      username: u.username || u.email,
      fullName,
      role,
      email: u.email,
      xp: u.xp || 0,
      level: u.level || 1,
      streak: u.streak || 0,
      grade: u.gradeLevel || u.grade,
    });
    const routes: Record<RoleKey, string> = {
      student: "/(student)/home",
      school: "/(school)/home",
      parent: "/(parent)/home",
      partner: "/(partner)/home",
    };
    router.replace(routes[role] as any);
  };

  // ── LOGIN PASSWORD ────────────────────────────────────
  const handleLoginPassword = async (forceLogout = false) => {
    if (!forceLogout) {
      let ok = true;
      if (!identifier.trim()) { setErr("id", "Enter your Student ID, email or phone."); ok = false; }
      if (!password.trim())   { setErr("pw", "Password cannot be empty."); ok = false; }
      if (!ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login-password`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ email: identifier.trim(), password, userType: selectedRole, forceLogout }),
      });
      const data = await res.json();
      if (res.status === 409 && data.activeSessionDetected) {
        setSessionInfo({ device: data.lastLoginDevice || "another device", time: data.lastLoginAt || "recently" });
        setForceLogoutMode("password");
        setSessionModal(true);
        return;
      }
      if (!res.ok) throw new Error(data.message || "Login failed. Check your credentials.");
      toast("Welcome back!", "success");
      await doLogin(data, selectedRole);
    } catch (err: any) {
      setErr("login", err.message);
      toast(err.message, "error");
    } finally { setLoading(false); }
  };

  // ── LOGIN OTP SEND ────────────────────────────────────
  const handleSendLoginOtp = async () => {
    if (!identifier.trim()) { setErr("id", "Enter your Student ID, email or phone."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login-otp/send`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), userType: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP.");
      setOtp(["", "", "", "", "", ""]); startTimer(data.waitTime || 90);
      go("login-otp");
      toast(`Code sent to your registered ${data.contactType || "contact"}`, "success");
    } catch (err: any) { setErr("id", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  // ── LOGIN OTP VERIFY ──────────────────────────────────
  const handleVerifyLoginOtp = async (forceLogout = false) => {
    if (otpStr.length < 6) { setErr("otp", "Enter the complete 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login-otp/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ identifier: identifier.trim(), code: otpStr, forceLogout }),
      });
      const data = await res.json();
      if (res.status === 409 && data.activeSessionDetected) {
        setSessionInfo({ device: data.lastLoginDevice || "another device", time: data.lastLoginAt || "recently" });
        setForceLogoutMode("otp");
        setSessionModal(true);
        return;
      }
      if (!res.ok) throw new Error(data.message || "Invalid or expired OTP.");
      toast("Logged in successfully!", "success");
      await doLogin(data, selectedRole);
    } catch (err: any) { setErr("otp", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  // ── REGISTER: SEND OTP ───────────────────────────────
  const handleCheckContact = async () => {
    if (!regContact.trim()) { setErr("rc", "Enter your email or phone number."); return; }
    setLoading(true);
    try {
      const isPhone = /^\d{10}$/.test(regContact.trim()) || regContact.startsWith("+");
      const res = await fetch(`${BASE_URL}/api/otp/send`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: regContact.trim(), type: isPhone ? "phone" : "email" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "This contact may already be registered.");
      setOtp(["", "", "", "", "", ""]); startTimer(data.waitTime || 90);
      go("reg-otp");
      toast("Verification code sent!", "success");
    } catch (err: any) { setErr("rc", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  // ── REGISTER: VERIFY OTP ─────────────────────────────
  const handleVerifyRegOtp = async () => {
    if (otpStr.length < 6) { setErr("otp", "Enter the complete 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/otp/verify`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: regContact.trim(), code: otpStr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid or expired OTP.");
      setRegVerifyToken(data.token || data.verificationToken || "");
      go("reg-role");
      toast("Contact verified!", "success");
    } catch (err: any) { setErr("otp", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  // ── REGISTER: SUBMIT ─────────────────────────────────
  const handleRegister = async () => {
    let ok = true;
    if (!regName.trim()) { setErr("rn", "Full name is required."); ok = false; }
    if (!regPassword.trim()) { setErr("rp", "Please set a password."); ok = false; }
    else if (regPassword.length < 8) { setErr("rp", "Min 8 characters required."); ok = false; }
    if (!ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setLoading(true);
    try {
      const endpoint = selectedRole === "student" ? "/api/registration/student" : selectedRole === "school" ? "/api/registration/school" : "/api/registration/supervisor";
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${regVerifyToken}` },
        body: JSON.stringify({ contact: regContact.trim(), fullName: regName.trim(), password: regPassword, role: selectedRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed.");
      toast("Account created! Sign in now.", "success");
      setTimeout(() => { go("login-creds"); setIdentifier(regContact); setPassword(""); }, 1200);
    } catch (err: any) { setErr("rn", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  // ── FORGOT: SEND ─────────────────────────────────────
  const handleForgotSend = async () => {
    if (!forgotEmail.trim()) { setErr("fe", "Enter your email address."); return; }
    if (!forgotEmail.includes("@")) { setErr("fe", "Enter a valid email address."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Email not found.");
      startTimer(data.waitTime || 90);
      setOtp(["", "", "", "", "", ""]); go("forgot-otp");
      toast("Reset code sent to your email!", "success");
    } catch (err: any) { setErr("fe", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  // ── FORGOT: VERIFY OTP ───────────────────────────────
  const handleForgotOtp = async () => {
    if (otpStr.length < 6) { setErr("otp", "Enter the complete 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify-reset-otp`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), code: otpStr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid or expired code.");
      setForgotResetToken(data.resetToken || "");
      go("forgot-reset");
    } catch (err: any) { setErr("otp", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  // ── FORGOT: RESET PASSWORD ───────────────────────────
  const handleResetPassword = async () => {
    if (!newPassword.trim()) { setErr("np", "Enter a new password."); return; }
    if (newPassword.length < 8) { setErr("np", "Min 8 characters required."); return; }
    if (newPassword !== confirmPassword) { setErr("cp", "Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), resetToken: forgotResetToken, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password.");
      go("forgot-done"); toast("Password updated successfully!", "success");
    } catch (err: any) { setErr("np", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  const handleOtpChange = (val: string, idx: number) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[idx] = d; setOtp(next);
    clrErr("otp");
    if (d && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!d && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const canGoBack = screen !== "login-role";
  const activeRole = ROLES.find((r) => r.role === selectedRole)!;

  const screenMeta: Record<Screen, { title: string; sub: string }> = {
    "login-role":   { title: "Welcome Back 👋", sub: "Select your role to continue" },
    "login-creds":  { title: "Sign In",          sub: `Signing in as ${activeRole.label}` },
    "login-otp":    { title: "Enter OTP",         sub: `Code sent to ${identifier}` },
    "reg-contact":  { title: "Create Account",    sub: "Enter your email or phone" },
    "reg-otp":      { title: "Verify Contact",    sub: `Code sent to ${regContact}` },
    "reg-role":     { title: "Who Are You?",      sub: "Choose your role on Samikaran" },
    "reg-details":  { title: "Almost Done!",      sub: "Set up your account details" },
    "forgot-email": { title: "Reset Password",    sub: "Enter your registered email" },
    "forgot-otp":   { title: "Check Your Email",  sub: `Code sent to ${forgotEmail}` },
    "forgot-reset": { title: "New Password",      sub: "Choose a strong new password" },
    "forgot-done":  { title: "All Set! 🎉",       sub: "Your password has been updated" },
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Full-screen gradient BG */}
      <LinearGradient
        colors={["#0c0220", "#1a0650", "#2d1085", "#1a0650", "#0c0220"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }} end={{ x: 0.7, y: 1 }}
      />

      {/* Decorative glows */}
      <View style={styles.glow1} />
      <View style={styles.glow2} />
      <View style={styles.glow3} />

      {/* Toast */}
      <View style={[styles.toastWrap, { top: insets.top + 12 }]} pointerEvents="none">
        {ToastComponent}
      </View>

      {/* Top branding area */}
      <View style={[styles.topArea, { paddingTop: insets.top + 16 }]}>
        <View style={styles.logoRow}>
          <View style={styles.logoWrap}>
            <Image source={require("../assets/images/icon_nobg.png")} style={styles.logoImg} resizeMode="contain" />
          </View>
          <View>
            <Text style={[styles.appName, { fontFamily: "Roboto_700Bold" }]}>
              SAMIKARAN<Text style={{ color: "#FF2FBF" }}>.</Text>
            </Text>
            <Text style={[styles.appSub, { fontFamily: "Roboto_400Regular" }]}>OLYMPIAD PLATFORM</Text>
          </View>
        </View>
      </View>

      {/* Glassmorphism card */}
      <KeyboardAvoidingView style={styles.flex1} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={0}>
        <View style={[styles.glass, { paddingBottom: insets.bottom + 16 }]}>
          {/* Drag handle */}
          <View style={styles.handle} />

          {/* Header row */}
          <View style={styles.hdrRow}>
            {canGoBack ? (
              <TouchableOpacity style={styles.backBtn} onPress={handleBack} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                <Ionicons name="chevron-back" size={20} color="#8A2BE2" />
              </TouchableOpacity>
            ) : <View style={{ width: 36 }} />}
            <View style={{ flex: 1, marginLeft: 8 }}>
              <Text style={[styles.hdrTitle, { fontFamily: "Roboto_700Bold" }]}>{screenMeta[screen].title}</Text>
              <Text style={[styles.hdrSub, { fontFamily: "Roboto_400Regular" }]}>{screenMeta[screen].sub}</Text>
            </View>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scroll}>

            {/* ── ROLE SELECT (Login) ── */}
            {screen === "login-role" && <>
              <View style={styles.roleGrid}>
                {ROLES.map((r) => {
                  const sel = selectedRole === r.role;
                  return (
                    <TouchableOpacity key={r.role}
                      style={[styles.roleCard, { borderColor: sel ? r.color : "rgba(255,255,255,0.08)", backgroundColor: sel ? r.bg : "rgba(255,255,255,0.04)" }]}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedRole(r.role); }} activeOpacity={0.75}>
                      <View style={[styles.roleIcon, { backgroundColor: sel ? r.color : "rgba(255,255,255,0.08)" }]}>
                        <Ionicons name={r.icon} size={20} color={sel ? "#fff" : "rgba(255,255,255,0.5)"} />
                      </View>
                      <Text style={[styles.roleLabel, { fontFamily: "Roboto_700Bold", color: sel ? r.color : "rgba(255,255,255,0.85)" }]}>{r.label}</Text>
                      <Text style={[styles.roleSub, { fontFamily: "Roboto_400Regular" }]} numberOfLines={2}>{r.subtitle}</Text>
                      {sel && <View style={[styles.roleCheck, { backgroundColor: r.color }]}>
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <GradBtn label="Continue" loading={false} onPress={() => go("login-creds")} />
              <SwitchRow q="Don't have an account?" link="Register" onPress={() => go("reg-contact")} />
            </>}

            {/* ── LOGIN CREDS ── */}
            {screen === "login-creds" && <>
              {errors.login && <ErrBanner msg={errors.login} />}
              <GlassInput icon="person-outline" placeholder={selectedRole === "student" ? "Student ID / Email / Phone" : "Email / Username"}
                value={identifier} onChangeText={(v) => { setIdentifier(v); clrErr("id"); clrErr("login"); }}
                autoCapitalize="none" error={errors.id} />
              <GlassInput icon="lock-closed-outline" placeholder="Password" value={password}
                onChangeText={(v) => { setPassword(v); clrErr("pw"); clrErr("login"); }}
                secureTextEntry={!showPass} rightIcon={showPass ? "eye-off-outline" : "eye-outline"} onRightPress={() => setShowPass(v => !v)}
                error={errors.pw} />
              <TouchableOpacity style={styles.forgotBtn} onPress={() => go("forgot-email")}>
                <Text style={[styles.forgotTxt, { fontFamily: "Roboto_500Medium", color: activeRole.color }]}>Forgot Password?</Text>
              </TouchableOpacity>
              <GradBtn label="Sign In" loading={loading} onPress={() => handleLoginPassword(false)} />
              <GlassDivider />
              <OutlineBtn icon="phone-portrait-outline" label="Login with OTP" onPress={handleSendLoginOtp} loading={loading} />
            </>}

            {/* ── OTP SCREEN ── */}
            {(screen === "login-otp" || screen === "reg-otp" || screen === "forgot-otp") && <>
              <OtpRow otp={otp} refs={otpRefs} onChange={handleOtpChange} />
              {errors.otp && <ErrBanner msg={errors.otp} />}
              <GradBtn label="Verify Code" loading={loading}
                onPress={screen === "login-otp" ? () => handleVerifyLoginOtp(false) : screen === "reg-otp" ? handleVerifyRegOtp : handleForgotOtp} />
              <ResendRow timer={resendTimer}
                onResend={screen === "login-otp" ? handleSendLoginOtp : screen === "reg-otp" ? handleCheckContact : handleForgotSend} />
            </>}

            {/* ── REG CONTACT ── */}
            {screen === "reg-contact" && <>
              <GlassInput icon="mail-outline" placeholder="Email or Phone Number" value={regContact}
                onChangeText={(v) => { setRegContact(v); clrErr("rc"); }} autoCapitalize="none" keyboardType="email-address" error={errors.rc} />
              <GradBtn label="Send Verification Code" loading={loading} onPress={handleCheckContact} />
              <SwitchRow q="Already have an account?" link="Sign In" onPress={() => go("login-role")} />
            </>}

            {/* ── REG ROLE ── */}
            {screen === "reg-role" && <>
              <View style={styles.roleGrid}>
                {ROLES.map((r) => {
                  const sel = selectedRole === r.role;
                  return (
                    <TouchableOpacity key={r.role}
                      style={[styles.roleCard, { borderColor: sel ? r.color : "rgba(255,255,255,0.08)", backgroundColor: sel ? r.bg : "rgba(255,255,255,0.04)" }]}
                      onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setSelectedRole(r.role); }} activeOpacity={0.75}>
                      <View style={[styles.roleIcon, { backgroundColor: sel ? r.color : "rgba(255,255,255,0.08)" }]}>
                        <Ionicons name={r.icon} size={20} color={sel ? "#fff" : "rgba(255,255,255,0.5)"} />
                      </View>
                      <Text style={[styles.roleLabel, { fontFamily: "Roboto_700Bold", color: sel ? r.color : "rgba(255,255,255,0.85)" }]}>{r.label}</Text>
                      <Text style={[styles.roleSub, { fontFamily: "Roboto_400Regular" }]} numberOfLines={2}>{r.subtitle}</Text>
                      {sel && <View style={[styles.roleCheck, { backgroundColor: r.color }]}>
                        <Ionicons name="checkmark" size={10} color="#fff" />
                      </View>}
                    </TouchableOpacity>
                  );
                })}
              </View>
              <GradBtn label="Continue" loading={false} onPress={() => go("reg-details")} />
            </>}

            {/* ── REG DETAILS ── */}
            {screen === "reg-details" && <>
              <GlassInput icon="person-outline" placeholder="Full Name" value={regName}
                onChangeText={(v) => { setRegName(v); clrErr("rn"); }} error={errors.rn} />
              <GlassInput icon="lock-closed-outline" placeholder="Create Password" value={regPassword}
                onChangeText={(v) => { setRegPassword(v); clrErr("rp"); }}
                secureTextEntry={!regShowPass} rightIcon={regShowPass ? "eye-off-outline" : "eye-outline"}
                onRightPress={() => setRegShowPass(v => !v)} error={errors.rp} />
              <Text style={[styles.passHint, { fontFamily: "Roboto_400Regular" }]}>
                Min 8 chars · uppercase · number · special char
              </Text>
              <GradBtn label="Create My Account" loading={loading} onPress={handleRegister} />
            </>}

            {/* ── FORGOT EMAIL ── */}
            {screen === "forgot-email" && <>
              <GlassInput icon="mail-outline" placeholder="Registered Email Address" value={forgotEmail}
                onChangeText={(v) => { setForgotEmail(v); clrErr("fe"); }} autoCapitalize="none" keyboardType="email-address" error={errors.fe} />
              <GradBtn label="Send Reset Code" loading={loading} onPress={handleForgotSend} />
            </>}

            {/* ── FORGOT RESET ── */}
            {screen === "forgot-reset" && <>
              <GlassInput icon="lock-closed-outline" placeholder="New Password" value={newPassword}
                onChangeText={(v) => { setNewPassword(v); clrErr("np"); }}
                secureTextEntry={!showNewPass} rightIcon={showNewPass ? "eye-off-outline" : "eye-outline"}
                onRightPress={() => setShowNewPass(v => !v)} error={errors.np} />
              <GlassInput icon="lock-closed-outline" placeholder="Confirm New Password" value={confirmPassword}
                onChangeText={(v) => { setConfirmPassword(v); clrErr("cp"); }}
                secureTextEntry={!showConfirmPass} rightIcon={showConfirmPass ? "eye-off-outline" : "eye-outline"}
                onRightPress={() => setShowConfirmPass(v => !v)} error={errors.cp} />
              <GradBtn label="Update Password" loading={loading} onPress={handleResetPassword} />
            </>}

            {/* ── FORGOT DONE ── */}
            {screen === "forgot-done" && <>
              <View style={styles.doneWrap}>
                <LinearGradient colors={["#059669", "#10b981"]} style={styles.doneIcon}>
                  <Ionicons name="checkmark-circle" size={36} color="#fff" />
                </LinearGradient>
                <Text style={[styles.doneTxt, { fontFamily: "Roboto_400Regular" }]}>
                  Password updated successfully. You can now sign in with your new credentials.
                </Text>
              </View>
              <GradBtn label="Back to Sign In" loading={false} onPress={() => { go("login-creds"); setForgotEmail(""); setNewPassword(""); setConfirmPassword(""); }} />
            </>}

          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* ── ACTIVE SESSION MODAL ── */}
      <Modal visible={sessionModal} transparent animationType="fade" onRequestClose={() => setSessionModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalIcon}>
              <Ionicons name="alert-triangle" size={28} color="#f59e0b" />
            </View>
            <Text style={[styles.modalTitle, { fontFamily: "Roboto_700Bold" }]}>Active Session Detected</Text>
            <Text style={[styles.modalBody, { fontFamily: "Roboto_400Regular" }]}>
              You're already logged in on <Text style={{ fontFamily: "Roboto_700Bold", color: "#8A2BE2" }}>{sessionInfo?.device}</Text>
              {sessionInfo?.time ? ` since ${sessionInfo.time}` : ""}.{"\n\n"}Do you want to sign out of that device and continue here?
            </Text>
            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.modalCancel} onPress={() => setSessionModal(false)}>
                <Text style={[styles.modalCancelTxt, { fontFamily: "Roboto_700Bold" }]}>Keep Existing</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalConfirm} onPress={() => {
                setSessionModal(false);
                if (forceLogoutMode === "otp") handleVerifyLoginOtp(true);
                else handleLoginPassword(true);
              }}>
                <LinearGradient colors={["#8A2BE2", "#FF2FBF"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalConfirmGrad}>
                  <Text style={[styles.modalConfirmTxt, { fontFamily: "Roboto_700Bold" }]}>Sign In Here</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── COMPONENTS ───────────────────────────────────────────

function GlassInput({ icon, placeholder, value, onChangeText, secureTextEntry, rightIcon, onRightPress, autoCapitalize, keyboardType, error }: {
  icon: keyof typeof Ionicons.glyphMap; placeholder: string; value: string;
  onChangeText: (v: string) => void; secureTextEntry?: boolean;
  rightIcon?: keyof typeof Ionicons.glyphMap; onRightPress?: () => void;
  autoCapitalize?: any; keyboardType?: any; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      <View style={[
        styles.inputWrap,
        focused && styles.inputFocused,
        !!error && styles.inputError,
      ]}>
        <Ionicons name={icon} size={18} color={error ? "#ef4444" : focused ? "#a855f7" : "rgba(255,255,255,0.35)"} style={styles.inputIcon} />
        <TextInput
          style={[styles.inputField, { fontFamily: "Roboto_400Regular" }]}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secureTextEntry}
          autoCapitalize={autoCapitalize ?? "sentences"}
          autoCorrect={false}
          keyboardType={keyboardType}
        />
        {rightIcon && (
          <TouchableOpacity onPress={onRightPress} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Ionicons name={rightIcon} size={18} color="rgba(255,255,255,0.3)" />
          </TouchableOpacity>
        )}
      </View>
      {error ? (
        <View style={styles.errRow}>
          <Ionicons name="alert-circle" size={12} color="#f87171" />
          <Text style={[styles.errTxt, { fontFamily: "Roboto_400Regular" }]}>{error}</Text>
        </View>
      ) : null}
    </View>
  );
}

function ErrBanner({ msg }: { msg: string }) {
  return (
    <View style={styles.errBanner}>
      <Ionicons name="alert-circle-outline" size={16} color="#f87171" />
      <Text style={[styles.errBannerTxt, { fontFamily: "Roboto_500Medium" }]}>{msg}</Text>
    </View>
  );
}

function GradBtn({ label, loading, onPress }: { label: string; loading: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.ctaWrap, { opacity: loading ? 0.7 : 1 }]} onPress={onPress} disabled={loading} activeOpacity={0.85}>
      <LinearGradient colors={["#7c3aed", "#a855f7", "#ec4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.cta}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : <Text style={[styles.ctaTxt, { fontFamily: "Roboto_700Bold" }]}>{label}</Text>}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function OutlineBtn({ icon, label, onPress, loading }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; loading: boolean }) {
  return (
    <TouchableOpacity style={styles.outBtn} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      <Ionicons name={icon} size={17} color="#a855f7" style={{ marginRight: 8 }} />
      <Text style={[styles.outBtnTxt, { fontFamily: "Roboto_700Bold" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function GlassDivider() {
  return (
    <View style={styles.divRow}>
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
        <TextInput key={i} ref={(r) => { refs.current[i] = r; }}
          style={[styles.otpBox, v ? styles.otpFilled : undefined]}
          value={v} onChangeText={(t) => onChange(t, i)}
          keyboardType="number-pad" maxLength={1} textAlign="center" selectTextOnFocus
        />
      ))}
    </View>
  );
}

function SwitchRow({ q, link, onPress }: { q: string; link: string; onPress: () => void }) {
  return (
    <View style={styles.switchRow}>
      <Text style={[styles.switchTxt, { fontFamily: "Roboto_400Regular" }]}>{q} </Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={[styles.switchLink, { fontFamily: "Roboto_700Bold" }]}>{link}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ResendRow({ timer, onResend }: { timer: number; onResend: () => void }) {
  return (
    <View style={styles.resendRow}>
      {timer > 0 ? (
        <Text style={[styles.resendTxt, { fontFamily: "Roboto_400Regular" }]}>
          Resend in <Text style={{ color: "#a855f7", fontFamily: "Roboto_700Bold" }}>
            {Math.floor(timer / 60).toString().padStart(2, "0")}:{(timer % 60).toString().padStart(2, "0")}
          </Text>
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
  root: { flex: 1 },
  flex1: { flex: 1 },

  // Glows
  glow1: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "#7c3aed", opacity: 0.18, top: -80, left: -60 },
  glow2: { position: "absolute", width: 250, height: 250, borderRadius: 125, backgroundColor: "#ec4899", opacity: 0.10, top: 40, right: -70 },
  glow3: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "#7c3aed", opacity: 0.12, bottom: 200, left: -40 },

  // Toast
  toastWrap: { position: "absolute", left: 16, right: 16, zIndex: 999 },
  toast: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#334155", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  toastSuccess: { backgroundColor: "#065f46" },
  toastError: { backgroundColor: "#7f1d1d" },
  toastTxt: { color: "#fff", fontSize: 13, flex: 1 },

  // Top
  topArea: { paddingHorizontal: 24, paddingBottom: 20 },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoWrap: { width: 52, height: 52, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.1)", borderWidth: 1, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center" },
  logoImg: { width: 38, height: 38 },
  appName: { fontSize: 18, color: "#fff", letterSpacing: 2 },
  appSub: { fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 3 },

  // Glass card
  glass: { flex: 1, backgroundColor: "rgba(255,255,255,0.06)", borderTopLeftRadius: 32, borderTopRightRadius: 32, borderWidth: 1, borderColor: "rgba(255,255,255,0.12)", paddingTop: 12, paddingHorizontal: 22 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "rgba(255,255,255,0.2)", alignSelf: "center", marginBottom: 20 },

  // Header
  hdrRow: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(168,85,247,0.15)", borderWidth: 1, borderColor: "rgba(168,85,247,0.3)", alignItems: "center", justifyContent: "center" },
  hdrTitle: { fontSize: 24, color: "#fff" },
  hdrSub: { fontSize: 13, color: "rgba(255,255,255,0.45)", marginTop: 2 },

  scroll: { gap: 12, paddingBottom: 8 },

  // Role grid
  roleGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  roleCard: { width: (width - 44 - 10) / 2, borderRadius: 16, borderWidth: 1.5, padding: 14, gap: 6, position: "relative" },
  roleIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  roleLabel: { fontSize: 15 },
  roleSub: { fontSize: 11, color: "rgba(255,255,255,0.4)", lineHeight: 15 },
  roleCheck: { position: "absolute", top: 10, right: 10, width: 18, height: 18, borderRadius: 9, alignItems: "center", justifyContent: "center" },

  // Glass input
  inputWrap: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.07)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.1)", borderRadius: 14, paddingHorizontal: 14, paddingVertical: 14 },
  inputFocused: { borderColor: "rgba(168,85,247,0.7)", backgroundColor: "rgba(168,85,247,0.08)" },
  inputError: { borderColor: "rgba(239,68,68,0.7)", backgroundColor: "rgba(239,68,68,0.05)" },
  inputIcon: { marginRight: 10 },
  inputField: { flex: 1, fontSize: 15, color: "#fff" },

  errRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, marginLeft: 4 },
  errTxt: { fontSize: 12, color: "#f87171" },
  errBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(127,29,29,0.5)", borderWidth: 1, borderColor: "rgba(239,68,68,0.3)", borderRadius: 12, padding: 12 },
  errBannerTxt: { flex: 1, fontSize: 13, color: "#f87171" },

  forgotBtn: { alignSelf: "flex-end", marginTop: -4 },
  forgotTxt: { fontSize: 13 },

  // CTA
  ctaWrap: { borderRadius: 16, overflow: "hidden" },
  cta: { paddingVertical: 16, alignItems: "center" },
  ctaTxt: { color: "#fff", fontSize: 16, letterSpacing: 0.3 },

  outBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "rgba(168,85,247,0.35)", borderRadius: 16, paddingVertical: 14, backgroundColor: "rgba(168,85,247,0.08)" },
  outBtnTxt: { fontSize: 14, color: "#a855f7" },

  divRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  divLine: { flex: 1, height: 1, backgroundColor: "rgba(255,255,255,0.1)" },
  divTxt: { fontSize: 12, color: "rgba(255,255,255,0.25)" },

  otpRow: { flexDirection: "row", gap: 8 },
  otpBox: { flex: 1, height: 58, borderRadius: 14, borderWidth: 1.5, borderColor: "rgba(255,255,255,0.12)", fontSize: 22, color: "#fff", backgroundColor: "rgba(255,255,255,0.07)", textAlign: "center", fontFamily: "Roboto_700Bold" },
  otpFilled: { borderColor: "#a855f7", backgroundColor: "rgba(168,85,247,0.15)" },

  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  switchTxt: { fontSize: 13, color: "rgba(255,255,255,0.45)" },
  switchLink: { fontSize: 13, color: "#a855f7" },

  resendRow: { alignItems: "center" },
  resendTxt: { fontSize: 13, color: "rgba(255,255,255,0.4)" },
  resendLink: { fontSize: 13, color: "#a855f7" },

  passHint: { fontSize: 11, color: "rgba(255,255,255,0.3)", marginTop: -4 },

  doneWrap: { alignItems: "center", gap: 16, paddingVertical: 16 },
  doneIcon: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  doneTxt: { fontSize: 14, color: "rgba(255,255,255,0.55)", lineHeight: 22, textAlign: "center" },

  // Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.7)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalBox: { backgroundColor: "#1a1040", borderWidth: 1, borderColor: "rgba(168,85,247,0.3)", borderRadius: 24, padding: 24, width: "100%", gap: 12 },
  modalIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "rgba(245,158,11,0.15)", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  modalTitle: { fontSize: 18, color: "#fff", textAlign: "center" },
  modalBody: { fontSize: 13, color: "rgba(255,255,255,0.55)", textAlign: "center", lineHeight: 20 },
  modalBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalCancel: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.15)", alignItems: "center" },
  modalCancelTxt: { color: "rgba(255,255,255,0.6)", fontSize: 14 },
  modalConfirm: { flex: 1, borderRadius: 14, overflow: "hidden" },
  modalConfirmGrad: { paddingVertical: 13, alignItems: "center" },
  modalConfirmTxt: { color: "#fff", fontSize: 14 },
});
