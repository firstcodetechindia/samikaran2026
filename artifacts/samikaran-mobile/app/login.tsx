import React, { useState, useRef, useCallback } from "react";
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
import { BlurView } from "expo-blur";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, type Href } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";

const { width, height } = Dimensions.get("window");
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
const CARD_HEIGHT = height * 0.68;

interface ApiUser {
  id: number;
  username?: string;
  studentId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  xp?: number;
  level?: number;
  streak?: number;
  gradeLevel?: number;
  grade?: number;
}

interface LoginApiResponse {
  user?: ApiUser;
  id?: number;
  username?: string;
  studentId?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  xp?: number;
  level?: number;
  streak?: number;
  gradeLevel?: number;
  grade?: number;
  activeSessionDetected?: boolean;
  lastLoginDevice?: string;
  lastLoginAt?: string;
  message?: string;
  token?: string;
  verificationToken?: string;
  resetToken?: string;
  waitTime?: number;
}

type Screen =
  | "login-creds" | "login-otp"
  | "reg-contact" | "reg-otp" | "reg-details"
  | "forgot-email" | "forgot-otp" | "forgot-reset" | "forgot-done";

// ── TOAST ─────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState("");
  const [type, setType] = useState<"success" | "error" | "info">("info");
  const [vis, setVis] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const t = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(
    (message: string, kind: "success" | "error" | "info" = "info") => {
      if (t.current) clearTimeout(t.current);
      setMsg(message);
      setType(kind);
      setVis(true);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, speed: 24 }).start();
      t.current = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 250, useNativeDriver: true }).start(() =>
          setVis(false)
        );
      }, 3200);
    },
    [anim]
  );

  const El = vis ? (
    <Animated.View
      style={[
        styles.toast,
        type === "success" && { backgroundColor: "#14532d" },
        type === "error" && { backgroundColor: "#7f1d1d" },
        {
          opacity: anim,
          transform: [
            { translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) },
          ],
        },
      ]}
      pointerEvents="none"
    >
      <Ionicons
        name={
          type === "success"
            ? "checkmark-circle"
            : type === "error"
            ? "alert-circle"
            : "information-circle"
        }
        size={17}
        color="#fff"
      />
      <Text style={[styles.toastTxt, { fontFamily: "Roboto_500Medium" }]}>{msg}</Text>
    </Animated.View>
  ) : null;

  return { show, El };
}

// ── MAIN ──────────────────────────────────────────────────
export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const { show: toast, El: ToastEl } = useToast();

  const [screen, setScreen] = useState<Screen>("login-creds");
  const [loginMode, setLoginMode] = useState<"password" | "otp">("password");
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

  const [sessionModal, setSessionModal] = useState(false);
  const [sessionInfo, setSessionInfo] = useState<{ device: string; time: string } | null>(null);
  const [forceMode, setForceMode] = useState<"password" | "otp">("password");

  const otpStr = otp.join("");
  const setErr = (k: string, v: string) => setErrors((e) => ({ ...e, [k]: v }));
  const clrErr = (k: string) =>
    setErrors((e) => {
      const n = { ...e };
      delete n[k];
      return n;
    });

  const startTimer = useCallback((secs = 90) => {
    setResendTimer(secs);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const go = useCallback((s: Screen) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setErrors({});
    setScreen(s);
  }, []);

  const handleBack = () => {
    const map: Partial<Record<Screen, Screen>> = {
      "login-otp":    "login-creds",
      "reg-contact":  "login-creds",
      "reg-otp":      "reg-contact",
      "reg-details":  "reg-otp",
      "forgot-email": "login-creds",
      "forgot-otp":   "forgot-email",
      "forgot-reset": "forgot-otp",
      "forgot-done":  "login-creds",
    };
    go(map[screen] ?? "login-creds");
  };

  const doLogin = async (data: LoginApiResponse) => {
    const u: ApiUser = data.user ?? {
      id: data.id ?? 0,
      username: data.username,
      studentId: data.studentId,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      fullName: data.fullName,
      xp: data.xp,
      level: data.level,
      streak: data.streak,
      gradeLevel: data.gradeLevel,
      grade: data.grade,
    };
    const fn = u.firstName ?? "";
    const ln = u.lastName ?? "";
    const fullName = u.fullName ?? ((fn + " " + ln).trim() || (u.email ?? ""));
    await login({
      id: u.id,
      username: u.username ?? u.studentId ?? u.email ?? "",
      fullName,
      role: "student",
      email: u.email,
      xp: u.xp ?? 0,
      level: u.level ?? 1,
      streak: u.streak ?? 0,
      grade: u.gradeLevel ?? u.grade,
    });
    router.replace("/(student)/home" as Href);
  };

  const handleLoginPassword = async (forceLogout = false) => {
    if (!forceLogout) {
      let ok = true;
      if (!identifier.trim()) { setErr("id", "Enter your Student ID, email or phone."); ok = false; }
      if (!password.trim()) { setErr("pw", "Password cannot be empty."); ok = false; }
      if (!ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: identifier.trim(), password, userType: "student", forceLogout }),
      });
      const data = (await res.json()) as LoginApiResponse;
      if (res.status === 409 && data.activeSessionDetected) {
        setSessionInfo({ device: data.lastLoginDevice ?? "another device", time: data.lastLoginAt ?? "" });
        setForceMode("password");
        setSessionModal(true);
        return;
      }
      if (!res.ok) throw new Error(data.message ?? "Login failed. Check your credentials.");
      toast("Welcome back! 🎉", "success");
      await doLogin(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Login failed.";
      setErr("login", msg);
    } finally { setLoading(false); }
  };

  const handleSendLoginOtp = async () => {
    if (!identifier.trim()) { setErr("id", "Enter your Student ID, email or phone."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login-otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), userType: "student" }),
      });
      const data = (await res.json()) as LoginApiResponse;
      if (!res.ok) throw new Error(data.message ?? "Failed to send OTP.");
      setOtp(["", "", "", "", "", ""]);
      startTimer(data.waitTime ?? 90);
      go("login-otp");
      toast("OTP sent to your registered contact!", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send OTP.";
      setErr("id", msg);
    }
    finally { setLoading(false); }
  };

  const handleVerifyLoginOtp = async (forceLogout = false) => {
    if (otpStr.length < 6) { setErr("otp", "Enter the complete 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login-otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ identifier: identifier.trim(), code: otpStr, forceLogout }),
      });
      const data = (await res.json()) as LoginApiResponse;
      if (res.status === 409 && data.activeSessionDetected) {
        setSessionInfo({ device: data.lastLoginDevice ?? "another device", time: data.lastLoginAt ?? "" });
        setForceMode("otp");
        setSessionModal(true);
        return;
      }
      if (!res.ok) throw new Error(data.message ?? "Invalid or expired OTP.");
      toast("Logged in successfully! 🎉", "success");
      await doLogin(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid OTP.";
      setErr("otp", msg);
    }
    finally { setLoading(false); }
  };

  const handleCheckContact = async () => {
    if (!regContact.trim()) { setErr("rc", "Enter your email or phone number."); return; }
    setLoading(true);
    try {
      const isPhone = /^\d{10}$/.test(regContact.trim()) || regContact.startsWith("+");
      const res = await fetch(`${BASE_URL}/api/otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: regContact.trim(), type: isPhone ? "phone" : "email" }),
      });
      const data = (await res.json()) as LoginApiResponse;
      if (!res.ok) throw new Error(data.message ?? "This contact may already be registered.");
      setOtp(["", "", "", "", "", ""]);
      startTimer(data.waitTime ?? 90);
      go("reg-otp");
      toast("Verification code sent!", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send code.";
      setErr("rc", msg);
    }
    finally { setLoading(false); }
  };

  const handleVerifyRegOtp = async () => {
    if (otpStr.length < 6) { setErr("otp", "Enter the complete 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: regContact.trim(), code: otpStr }),
      });
      const data = (await res.json()) as LoginApiResponse;
      if (!res.ok) throw new Error(data.message ?? "Invalid or expired OTP.");
      setRegVerifyToken(data.token ?? data.verificationToken ?? "");
      go("reg-details");
      toast("Contact verified!", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid OTP.";
      setErr("otp", msg);
    }
    finally { setLoading(false); }
  };

  const handleRegister = async () => {
    let ok = true;
    if (!regName.trim()) { setErr("rn", "Full name is required."); ok = false; }
    if (!regPassword.trim()) { setErr("rp", "Please set a password."); ok = false; }
    else if (regPassword.length < 8) { setErr("rp", "Min 8 characters required."); ok = false; }
    if (!ok) { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/registration/student`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${regVerifyToken}` },
        body: JSON.stringify({ contact: regContact.trim(), fullName: regName.trim(), password: regPassword, role: "student" }),
      });
      const data = (await res.json()) as LoginApiResponse;
      if (!res.ok) throw new Error(data.message ?? "Registration failed.");
      toast("Account created! Sign in now. 🎉", "success");
      setTimeout(() => { go("login-creds"); setIdentifier(regContact); setPassword(""); }, 1200);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Registration failed.";
      setErr("rn", msg);
    }
    finally { setLoading(false); }
  };

  const handleForgotSend = async () => {
    if (!forgotEmail.trim()) { setErr("fe", "Enter your email address."); return; }
    if (!forgotEmail.includes("@")) { setErr("fe", "Enter a valid email address."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim() }),
      });
      const data = (await res.json()) as LoginApiResponse;
      if (!res.ok) throw new Error(data.message ?? "Email not found.");
      startTimer(data.waitTime ?? 90);
      setOtp(["", "", "", "", "", ""]);
      go("forgot-otp");
      toast("Reset code sent to your email!", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Email not found.";
      setErr("fe", msg);
    }
    finally { setLoading(false); }
  };

  const handleForgotOtp = async () => {
    if (otpStr.length < 6) { setErr("otp", "Enter the complete 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), code: otpStr }),
      });
      const data = (await res.json()) as LoginApiResponse;
      if (!res.ok) throw new Error(data.message ?? "Invalid or expired code.");
      setForgotResetToken(data.resetToken ?? "");
      go("forgot-reset");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Invalid code.";
      setErr("otp", msg);
    }
    finally { setLoading(false); }
  };

  const handleResetPassword = async () => {
    if (!newPassword.trim()) { setErr("np", "Enter a new password."); return; }
    if (newPassword.length < 8) { setErr("np", "Min 8 characters required."); return; }
    if (newPassword !== confirmPassword) { setErr("cp", "Passwords do not match."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), resetToken: forgotResetToken, newPassword }),
      });
      const data = (await res.json()) as LoginApiResponse;
      if (!res.ok) throw new Error(data.message ?? "Failed to reset password.");
      go("forgot-done");
      toast("Password updated successfully!", "success");
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to reset password.";
      setErr("np", msg);
    }
    finally { setLoading(false); }
  };

  const handleOtpChange = (val: string, idx: number) => {
    const d = val.replace(/\D/g, "").slice(-1);
    const next = [...otp]; next[idx] = d; setOtp(next);
    clrErr("otp");
    if (d && idx < 5) otpRefs.current[idx + 1]?.focus();
    if (!d && idx > 0) otpRefs.current[idx - 1]?.focus();
  };

  const isOtpScreen = screen === "login-otp" || screen === "reg-otp" || screen === "forgot-otp";
  const canGoBack = screen !== "login-creds";

  const meta: Record<Screen, { title: string; sub: string }> = {
    "login-creds":  { title: "Welcome Back",    sub: "Sign in to your student account" },
    "login-otp":    { title: "Enter OTP",        sub: `Code sent to ${identifier}` },
    "reg-contact":  { title: "Create Account",   sub: "Enter your email or phone to start" },
    "reg-otp":      { title: "Verify Contact",   sub: `Code sent to ${regContact}` },
    "reg-details":  { title: "Almost Done!",     sub: "Set up your account details" },
    "forgot-email": { title: "Forgot Password",  sub: "Enter your registered email" },
    "forgot-otp":   { title: "Check Email",      sub: `Code sent to ${forgotEmail}` },
    "forgot-reset": { title: "New Password",     sub: "Choose a strong new password" },
    "forgot-done":  { title: "All Done!",        sub: "Your password has been updated" },
  };

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Full-screen purple gradient */}
      <LinearGradient
        colors={["#150533", "#2d1065", "#5b21b6", "#2d1065", "#150533"]}
        locations={[0, 0.2, 0.5, 0.8, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.3, y: 0 }}
        end={{ x: 0.7, y: 1 }}
      />

      {/* Decorative blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      {/* Toast — sits just above the card, not in the status bar */}
      <View style={[styles.toastZone, { top: height * 0.30 - 60 }]} pointerEvents="none">
        {ToastEl}
      </View>

      {/* ── TOP: Logo (always visible, fixed area) ── */}
      <View style={[styles.topArea, { paddingTop: insets.top + 16 }]}>
        <View style={styles.logoRing}>
          <Image
            source={require("../assets/images/icon_nobg.png")}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.brandName, { fontFamily: "Roboto_900Black" }]}>
          SAMIKARAN<Text style={{ color: "#f472b6" }}>.</Text>
        </Text>
        <Text style={[styles.brandTagline, { fontFamily: "Roboto_400Regular" }]}>
          OLYMPIAD PLATFORM
        </Text>
      </View>

      {/* ── BOTTOM: Frosted glass card ── */}
      <KeyboardAvoidingView
        style={styles.kavWrap}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        {/* BlurView gives the frosted glass background */}
        <BlurView intensity={60} tint="light" style={styles.blurCard}>
          {/* White overlay on top of blur for glass feel */}
          <View style={styles.glassOverlay} />

          {/* Purple glow line at top of card */}
          <LinearGradient
            colors={["#7c3aed", "#ec4899", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.topGlow}
          />

          {/* Drag pill */}
          <View style={styles.pill} />

          {/* Header */}
          <View style={styles.cardHeader}>
            {canGoBack ? (
              <TouchableOpacity
                style={styles.backBtn}
                onPress={handleBack}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
              >
                <Ionicons name="arrow-back" size={18} color="#7c3aed" />
              </TouchableOpacity>
            ) : (
              <View style={styles.backPlaceholder} />
            )}
            <View style={{ flex: 1 }}>
              <Text style={[styles.cardTitle, { fontFamily: "Roboto_700Bold" }]}>
                {meta[screen].title}
              </Text>
              <Text style={[styles.cardSub, { fontFamily: "Roboto_400Regular" }]}>
                {meta[screen].sub}
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 16 }]}
          >
            {/* ── LOGIN CREDS ── */}
            {screen === "login-creds" && (
              <>
                {errors.login && <ErrBanner msg={errors.login} />}
                <Field
                  icon="person-outline"
                  label="Student ID / Email / Phone"
                  value={identifier}
                  onChangeText={(v) => { setIdentifier(v); clrErr("id"); clrErr("login"); }}
                  autoCapitalize="none"
                  error={errors.id}
                />
                {loginMode === "password" && (
                  <>
                    <Field
                      icon="lock-closed-outline"
                      label="Password"
                      value={password}
                      onChangeText={(v) => { setPassword(v); clrErr("pw"); clrErr("login"); }}
                      secure={!showPass}
                      eyeIcon={showPass ? "eye-off-outline" : "eye-outline"}
                      onEye={() => setShowPass((v) => !v)}
                      error={errors.pw}
                    />
                    <TouchableOpacity onPress={() => go("forgot-email")} style={styles.forgotRow}>
                      <Text style={[styles.forgotTxt, { fontFamily: "Roboto_500Medium" }]}>
                        Forgot Password?
                      </Text>
                    </TouchableOpacity>
                    <PrimaryBtn label="Sign In" loading={loading} onPress={() => handleLoginPassword(false)} />
                  </>
                )}
                {loginMode === "otp" && (
                  <PrimaryBtn label="Send OTP" loading={loading} onPress={handleSendLoginOtp} />
                )}
                <OrDivider />
                <SecondaryBtn
                  icon={loginMode === "password" ? "phone-portrait-outline" : "lock-closed-outline"}
                  label={loginMode === "password" ? "Login with OTP" : "Use Password Instead"}
                  onPress={() => {
                    setLoginMode((m) => m === "password" ? "otp" : "password");
                    clrErr("id"); clrErr("pw"); clrErr("login");
                  }}
                  loading={false}
                />
                <SwitchLink question="Don't have an account?" link="Create one" onPress={() => go("reg-contact")} />
              </>
            )}

            {/* ── OTP SCREEN ── */}
            {isOtpScreen && (
              <>
                <OtpBoxes otp={otp} refs={otpRefs} onChange={handleOtpChange} />
                {errors.otp && <ErrBanner msg={errors.otp} />}
                <PrimaryBtn
                  label="Verify Code"
                  loading={loading}
                  onPress={
                    screen === "login-otp"
                      ? () => handleVerifyLoginOtp(false)
                      : screen === "reg-otp"
                      ? handleVerifyRegOtp
                      : handleForgotOtp
                  }
                />
                <ResendTimer
                  timer={resendTimer}
                  onResend={
                    screen === "login-otp"
                      ? handleSendLoginOtp
                      : screen === "reg-otp"
                      ? handleCheckContact
                      : handleForgotSend
                  }
                />
              </>
            )}

            {/* ── REG CONTACT ── */}
            {screen === "reg-contact" && (
              <>
                <Field
                  icon="mail-outline"
                  label="Email or Phone Number"
                  value={regContact}
                  onChangeText={(v) => { setRegContact(v); clrErr("rc"); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  error={errors.rc}
                />
                <PrimaryBtn label="Send Verification Code" loading={loading} onPress={handleCheckContact} />
                <SwitchLink question="Already have an account?" link="Sign In" onPress={() => go("login-creds")} />
              </>
            )}

            {/* ── REG DETAILS ── */}
            {screen === "reg-details" && (
              <>
                <Field
                  icon="person-outline"
                  label="Full Name"
                  value={regName}
                  onChangeText={(v) => { setRegName(v); clrErr("rn"); }}
                  error={errors.rn}
                />
                <Field
                  icon="lock-closed-outline"
                  label="Create Password"
                  value={regPassword}
                  onChangeText={(v) => { setRegPassword(v); clrErr("rp"); }}
                  secure={!regShowPass}
                  eyeIcon={regShowPass ? "eye-off-outline" : "eye-outline"}
                  onEye={() => setRegShowPass((v) => !v)}
                  error={errors.rp}
                />
                <Text style={[styles.passHint, { fontFamily: "Roboto_400Regular" }]}>
                  Min 8 chars · uppercase · number · special character
                </Text>
                <PrimaryBtn label="Create My Account" loading={loading} onPress={handleRegister} />
              </>
            )}

            {/* ── FORGOT EMAIL ── */}
            {screen === "forgot-email" && (
              <>
                <Field
                  icon="mail-outline"
                  label="Registered Email Address"
                  value={forgotEmail}
                  onChangeText={(v) => { setForgotEmail(v); clrErr("fe"); }}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  error={errors.fe}
                />
                <PrimaryBtn label="Send Reset Code" loading={loading} onPress={handleForgotSend} />
              </>
            )}

            {/* ── FORGOT RESET ── */}
            {screen === "forgot-reset" && (
              <>
                <Field
                  icon="lock-closed-outline"
                  label="New Password"
                  value={newPassword}
                  onChangeText={(v) => { setNewPassword(v); clrErr("np"); }}
                  secure={!showNewPass}
                  eyeIcon={showNewPass ? "eye-off-outline" : "eye-outline"}
                  onEye={() => setShowNewPass((v) => !v)}
                  error={errors.np}
                />
                <Field
                  icon="lock-closed-outline"
                  label="Confirm New Password"
                  value={confirmPassword}
                  onChangeText={(v) => { setConfirmPassword(v); clrErr("cp"); }}
                  secure={!showConfirmPass}
                  eyeIcon={showConfirmPass ? "eye-off-outline" : "eye-outline"}
                  onEye={() => setShowConfirmPass((v) => !v)}
                  error={errors.cp}
                />
                <PrimaryBtn label="Update Password" loading={loading} onPress={handleResetPassword} />
              </>
            )}

            {/* ── FORGOT DONE ── */}
            {screen === "forgot-done" && (
              <>
                <View style={styles.doneBlock}>
                  <LinearGradient colors={["#059669", "#10b981"]} style={styles.doneCircle}>
                    <Ionicons name="checkmark-circle" size={40} color="#fff" />
                  </LinearGradient>
                  <Text style={[styles.doneTxt, { fontFamily: "Roboto_400Regular" }]}>
                    Your password has been successfully updated. You can now sign in.
                  </Text>
                </View>
                <PrimaryBtn
                  label="Back to Sign In"
                  loading={false}
                  onPress={() => { go("login-creds"); setForgotEmail(""); setNewPassword(""); setConfirmPassword(""); }}
                />
              </>
            )}
          </ScrollView>
        </BlurView>
      </KeyboardAvoidingView>

      {/* ── SESSION MODAL ── */}
      <Modal visible={sessionModal} transparent animationType="fade" onRequestClose={() => setSessionModal(false)}>
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <View style={styles.modalWarnIcon}>
              <Ionicons name="warning" size={28} color="#f59e0b" />
            </View>
            <Text style={[styles.modalTitle, { fontFamily: "Roboto_700Bold" }]}>Active Session Detected</Text>
            <Text style={[styles.modalBody, { fontFamily: "Roboto_400Regular" }]}>
              You are already signed in on{" "}
              <Text style={{ fontFamily: "Roboto_700Bold", color: "#7c3aed" }}>{sessionInfo?.device}</Text>
              {sessionInfo?.time ? `. Signed in ${sessionInfo.time}` : ""}.{"\n\n"}
              Do you want to sign out of that device and sign in here?
            </Text>
            <View style={styles.modalRow}>
              <TouchableOpacity style={styles.modalKeepBtn} onPress={() => setSessionModal(false)}>
                <Text style={[styles.modalKeepTxt, { fontFamily: "Roboto_700Bold" }]}>Keep Existing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSignInBtn}
                onPress={() => { setSessionModal(false); if (forceMode === "otp") handleVerifyLoginOtp(true); else handleLoginPassword(true); }}
              >
                <LinearGradient colors={["#7c3aed", "#ec4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.modalSignInGrad}>
                  <Text style={[styles.modalSignInTxt, { fontFamily: "Roboto_700Bold" }]}>Sign In Here</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ── FIELD ─────────────────────────────────────────────────
function Field({
  icon, label, value, onChangeText, secure, eyeIcon, onEye,
  autoCapitalize, keyboardType, error,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  value: string;
  onChangeText: (v: string) => void;
  secure?: boolean;
  eyeIcon?: keyof typeof Ionicons.glyphMap;
  onEye?: () => void;
  autoCapitalize?: any;
  keyboardType?: any;
  error?: string;
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;
  return (
    <View style={{ marginBottom: 4 }}>
      <Text style={[
        styles.fieldLabel,
        { fontFamily: "Roboto_500Medium", color: hasError ? "#dc2626" : focused ? "#7c3aed" : "#6b7280" },
      ]}>
        {label}
      </Text>
      <View style={[styles.fieldWrap, focused && styles.fieldFocused, hasError && styles.fieldError]}>
        <Ionicons
          name={icon}
          size={18}
          color={hasError ? "#dc2626" : focused ? "#7c3aed" : "#9ca3af"}
          style={{ marginRight: 10 }}
        />
        <TextInput
          style={[styles.fieldInput, { fontFamily: "Roboto_400Regular" }]}
          value={value}
          onChangeText={onChangeText}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          secureTextEntry={secure}
          autoCapitalize={autoCapitalize ?? "sentences"}
          autoCorrect={false}
          autoComplete="off"
          keyboardType={keyboardType}
          placeholderTextColor="#d1d5db"
        />
        {eyeIcon && (
          <TouchableOpacity onPress={onEye} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name={eyeIcon} size={18} color="#9ca3af" />
          </TouchableOpacity>
        )}
      </View>
      {hasError && (
        <View style={styles.fieldErrRow}>
          <Ionicons name="alert-circle" size={12} color="#dc2626" />
          <Text style={[styles.fieldErrTxt, { fontFamily: "Roboto_400Regular" }]}>{error}</Text>
        </View>
      )}
    </View>
  );
}

function ErrBanner({ msg }: { msg: string }) {
  return (
    <View style={styles.errBanner}>
      <Ionicons name="alert-circle-outline" size={15} color="#dc2626" />
      <Text style={[styles.errBannerTxt, { fontFamily: "Roboto_500Medium" }]}>{msg}</Text>
    </View>
  );
}

function PrimaryBtn({ label, loading, onPress }: { label: string; loading: boolean; onPress: () => void }) {
  return (
    <TouchableOpacity style={[styles.primaryWrap, { opacity: loading ? 0.75 : 1 }]} onPress={onPress} disabled={loading} activeOpacity={0.87}>
      <LinearGradient colors={["#7c3aed", "#a855f7", "#ec4899"]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={styles.primaryGrad}>
        {loading ? <ActivityIndicator color="#fff" size="small" /> : (
          <Text style={[styles.primaryTxt, { fontFamily: "Roboto_700Bold" }]}>{label}</Text>
        )}
      </LinearGradient>
    </TouchableOpacity>
  );
}

function SecondaryBtn({ icon, label, onPress, loading }: { icon: keyof typeof Ionicons.glyphMap; label: string; onPress: () => void; loading: boolean }) {
  return (
    <TouchableOpacity style={styles.secBtn} onPress={onPress} disabled={loading} activeOpacity={0.8}>
      <Ionicons name={icon} size={16} color="#7c3aed" style={{ marginRight: 8 }} />
      <Text style={[styles.secBtnTxt, { fontFamily: "Roboto_700Bold" }]}>{label}</Text>
    </TouchableOpacity>
  );
}

function OrDivider() {
  return (
    <View style={styles.orRow}>
      <View style={styles.orLine} />
      <Text style={[styles.orTxt, { fontFamily: "Roboto_400Regular" }]}>or</Text>
      <View style={styles.orLine} />
    </View>
  );
}

function OtpBoxes({ otp, refs, onChange }: {
  otp: string[];
  refs: React.MutableRefObject<(TextInput | null)[]>;
  onChange: (v: string, i: number) => void;
}) {
  return (
    <View style={styles.otpRow}>
      {otp.map((v, i) => (
        <TextInput
          key={i}
          ref={(r) => { refs.current[i] = r; }}
          style={[styles.otpBox, v ? styles.otpBoxFilled : undefined]}
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

function SwitchLink({ question, link, onPress }: { question: string; link: string; onPress: () => void }) {
  return (
    <View style={styles.switchRow}>
      <Text style={[styles.switchQ, { fontFamily: "Roboto_400Regular" }]}>{question} </Text>
      <TouchableOpacity onPress={onPress}>
        <Text style={[styles.switchLink, { fontFamily: "Roboto_700Bold" }]}>{link}</Text>
      </TouchableOpacity>
    </View>
  );
}

function ResendTimer({ timer, onResend }: { timer: number; onResend: () => void }) {
  const mm = Math.floor(timer / 60).toString().padStart(2, "0");
  const ss = (timer % 60).toString().padStart(2, "0");
  return (
    <View style={styles.resendRow}>
      {timer > 0 ? (
        <Text style={[styles.resendWait, { fontFamily: "Roboto_400Regular" }]}>
          Resend in <Text style={{ color: "#7c3aed", fontFamily: "Roboto_700Bold" }}>{mm}:{ss}</Text>
        </Text>
      ) : (
        <TouchableOpacity onPress={onResend}>
          <Text style={[styles.resendLink, { fontFamily: "Roboto_700Bold" }]}>Didn't receive it? Resend</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

// ── STYLES ────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#150533" },

  blob1: { position: "absolute", width: 300, height: 300, borderRadius: 150, backgroundColor: "#7c3aed", opacity: 0.3, top: -80, left: -80 },
  blob2: { position: "absolute", width: 240, height: 240, borderRadius: 120, backgroundColor: "#ec4899", opacity: 0.15, top: 40, right: -70 },
  blob3: { position: "absolute", width: 200, height: 200, borderRadius: 100, backgroundColor: "#6d28d9", opacity: 0.2, top: height * 0.15, left: width * 0.2 },

  toastZone: { position: "absolute", left: 16, right: 16, zIndex: 999 },
  toast: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  toastTxt: { flex: 1, fontSize: 13, color: "#fff" },

  // ── TOP LOGO AREA ── fixed height, always shows purple BG
  topArea: {
    height: height * 0.30,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    zIndex: 1,
  },
  logoRing: {
    width: 70,
    height: 70,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.12)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.25)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 6,
    shadowColor: "#a855f7",
    shadowOpacity: 0.6,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 0 },
  },
  logoImg: { width: 46, height: 46 },
  brandName: { fontSize: 22, color: "#fff", letterSpacing: 3 },
  brandTagline: { fontSize: 9, color: "rgba(255,255,255,0.4)", letterSpacing: 4.5 },

  // ── FROSTED GLASS CARD ──
  kavWrap: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: CARD_HEIGHT,
  },
  blurCard: {
    flex: 1,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    overflow: "hidden",
    paddingHorizontal: 24,
    paddingTop: 10,
  },
  // Semi-white overlay on blur = classic glassmorphism
  glassOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.82)",
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },
  // Thin gradient top border
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
  },

  pill: { width: 40, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 18, zIndex: 1 },

  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 20, gap: 10, zIndex: 1 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f5f3ff", borderWidth: 1, borderColor: "#ede9fe", alignItems: "center", justifyContent: "center" },
  backPlaceholder: { width: 36 },
  cardTitle: { fontSize: 24, color: "#111827", lineHeight: 30 },
  cardSub: { fontSize: 13, color: "#9ca3af", marginTop: 2 },

  scrollContent: { gap: 14, zIndex: 1 },

  // ── FIELD ──
  fieldLabel: { fontSize: 12, marginBottom: 6, marginLeft: 2 },
  fieldWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f9fafb",
    borderWidth: 1.5,
    borderColor: "#e5e7eb",
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  fieldFocused: { borderColor: "#7c3aed", backgroundColor: "#faf5ff" },
  fieldError: { borderColor: "#dc2626", backgroundColor: "#fff5f5" },
  fieldInput: { flex: 1, fontSize: 15, color: "#111827", minHeight: 22, paddingVertical: 0 },
  fieldErrRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, marginLeft: 2 },
  fieldErrTxt: { fontSize: 12, color: "#dc2626" },

  errBanner: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca", borderRadius: 12, padding: 12 },
  errBannerTxt: { flex: 1, fontSize: 13, color: "#dc2626" },

  forgotRow: { alignSelf: "flex-end", marginTop: -6 },
  forgotTxt: { fontSize: 13, color: "#7c3aed" },

  primaryWrap: { borderRadius: 16, overflow: "hidden" },
  primaryGrad: { paddingVertical: 16, alignItems: "center" },
  primaryTxt: { color: "#fff", fontSize: 16, letterSpacing: 0.3 },

  secBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#ede9fe", borderRadius: 16, paddingVertical: 14, backgroundColor: "#faf5ff" },
  secBtnTxt: { fontSize: 14, color: "#7c3aed" },

  orRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: "#e5e7eb" },
  orTxt: { fontSize: 12, color: "#d1d5db" },

  otpRow: { flexDirection: "row", gap: 8 },
  otpBox: { flex: 1, height: 58, borderRadius: 14, borderWidth: 1.5, borderColor: "#e5e7eb", fontSize: 24, color: "#111827", backgroundColor: "#f9fafb", textAlign: "center" },
  otpBoxFilled: { borderColor: "#7c3aed", backgroundColor: "#faf5ff" },

  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  switchQ: { fontSize: 13, color: "#6b7280" },
  switchLink: { fontSize: 13, color: "#7c3aed" },

  resendRow: { alignItems: "center" },
  resendWait: { fontSize: 13, color: "#9ca3af" },
  resendLink: { fontSize: 13, color: "#7c3aed" },

  passHint: { fontSize: 11, color: "#9ca3af", marginTop: -6 },

  doneBlock: { alignItems: "center", gap: 16, paddingVertical: 12 },
  doneCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  doneTxt: { fontSize: 14, color: "#6b7280", lineHeight: 22, textAlign: "center" },

  modalBg: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)", alignItems: "center", justifyContent: "center", padding: 24 },
  modalBox: { backgroundColor: "#fff", borderRadius: 24, padding: 24, width: "100%", gap: 12 },
  modalWarnIcon: { width: 56, height: 56, borderRadius: 28, backgroundColor: "#fef3c7", alignItems: "center", justifyContent: "center", alignSelf: "center" },
  modalTitle: { fontSize: 17, color: "#111827", textAlign: "center" },
  modalBody: { fontSize: 13, color: "#6b7280", lineHeight: 20, textAlign: "center" },
  modalRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalKeepBtn: { flex: 1, paddingVertical: 13, borderRadius: 14, borderWidth: 1.5, borderColor: "#e5e7eb", alignItems: "center" },
  modalKeepTxt: { fontSize: 14, color: "#6b7280" },
  modalSignInBtn: { flex: 1, borderRadius: 14, overflow: "hidden" },
  modalSignInGrad: { paddingVertical: 13, alignItems: "center" },
  modalSignInTxt: { fontSize: 14, color: "#fff" },
});
