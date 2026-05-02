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
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Haptics from "expo-haptics";
import { useAuth } from "@/context/AuthContext";

const { width, height } = Dimensions.get("window");
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";

type Screen =
  | "login-creds" | "login-otp"
  | "reg-contact" | "reg-otp" | "reg-details"
  | "forgot-email" | "forgot-otp" | "forgot-reset" | "forgot-done";

// ── TOAST ────────────────────────────────────────────────
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
          transform: [{ translateY: anim.interpolate({ inputRange: [0, 1], outputRange: [-16, 0] }) }],
        },
      ]}
      pointerEvents="none"
    >
      <Ionicons
        name={type === "success" ? "checkmark-circle" : type === "error" ? "alert-circle" : "information-circle"}
        size={17}
        color="#fff"
      />
      <Text style={[styles.toastTxt, { fontFamily: "Roboto_500Medium" }]}>{msg}</Text>
    </Animated.View>
  ) : null;

  return { show, El };
}

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const { show: toast, El: ToastEl } = useToast();

  const [screen, setScreen] = useState<Screen>("login-creds");
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
  const clrErr = (k: string) => setErrors((e) => { const n = { ...e }; delete n[k]; return n; });

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
      "login-otp": "login-creds",
      "reg-contact": "login-creds",
      "reg-otp": "reg-contact",
      "reg-details": "reg-otp",
      "forgot-email": "login-creds",
      "forgot-otp": "forgot-email",
      "forgot-reset": "forgot-otp",
      "forgot-done": "login-creds",
    };
    go(map[screen] ?? "login-creds");
  };

  const doLogin = async (data: any) => {
    const u = data.user ?? data;
    const firstName = u.firstName || "";
    const lastName = u.lastName || "";
    const fullName = data.fullName || (firstName + " " + lastName).trim() || u.email || "";
    await login({
      id: u.id,
      username: u.username || u.studentId || u.email,
      fullName,
      role: "student",
      email: u.email,
      xp: u.xp || 0,
      level: u.level || 1,
      streak: u.streak || 0,
      grade: u.gradeLevel || u.grade,
    });
    router.replace("/(student)/home" as any);
  };

  // ── LOGIN PASSWORD ────────────────────────────────────
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
      const data = await res.json();
      if (res.status === 409 && data.activeSessionDetected) {
        setSessionInfo({ device: data.lastLoginDevice || "another device", time: data.lastLoginAt || "" });
        setForceMode("password");
        setSessionModal(true);
        return;
      }
      if (!res.ok) throw new Error(data.message || "Login failed. Check your credentials.");
      toast("Welcome back! 🎉", "success");
      await doLogin(data);
    } catch (err: any) {
      setErr("login", err.message);
      toast(err.message, "error");
    } finally { setLoading(false); }
  };

  // ── SEND LOGIN OTP ────────────────────────────────────
  const handleSendLoginOtp = async () => {
    if (!identifier.trim()) { setErr("id", "Enter your Student ID, email or phone."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/login-otp/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: identifier.trim(), userType: "student" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send OTP.");
      setOtp(["", "", "", "", "", ""]);
      startTimer(data.waitTime || 90);
      go("login-otp");
      toast("OTP sent to your registered contact!", "success");
    } catch (err: any) { setErr("id", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  // ── VERIFY LOGIN OTP ─────────────────────────────────
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
      const data = await res.json();
      if (res.status === 409 && data.activeSessionDetected) {
        setSessionInfo({ device: data.lastLoginDevice || "another device", time: data.lastLoginAt || "" });
        setForceMode("otp");
        setSessionModal(true);
        return;
      }
      if (!res.ok) throw new Error(data.message || "Invalid or expired OTP.");
      toast("Logged in successfully! 🎉", "success");
      await doLogin(data);
    } catch (err: any) { setErr("otp", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  // ── REG: SEND OTP ─────────────────────────────────────
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "This contact may already be registered.");
      setOtp(["", "", "", "", "", ""]);
      startTimer(data.waitTime || 90);
      go("reg-otp");
      toast("Verification code sent!", "success");
    } catch (err: any) { setErr("rc", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  // ── REG: VERIFY OTP ───────────────────────────────────
  const handleVerifyRegOtp = async () => {
    if (otpStr.length < 6) { setErr("otp", "Enter the complete 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/otp/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contact: regContact.trim(), code: otpStr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid or expired OTP.");
      setRegVerifyToken(data.token || data.verificationToken || "");
      go("reg-details");
      toast("Contact verified!", "success");
    } catch (err: any) { setErr("otp", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  // ── REGISTER ──────────────────────────────────────────
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Registration failed.");
      toast("Account created! Sign in now. 🎉", "success");
      setTimeout(() => { go("login-creds"); setIdentifier(regContact); setPassword(""); }, 1200);
    } catch (err: any) { setErr("rn", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  // ── FORGOT: SEND ──────────────────────────────────────
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Email not found.");
      startTimer(data.waitTime || 90);
      setOtp(["", "", "", "", "", ""]);
      go("forgot-otp");
      toast("Reset code sent to your email!", "success");
    } catch (err: any) { setErr("fe", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  // ── FORGOT: VERIFY OTP ────────────────────────────────
  const handleForgotOtp = async () => {
    if (otpStr.length < 6) { setErr("otp", "Enter the complete 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch(`${BASE_URL}/api/auth/verify-reset-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail.trim(), code: otpStr }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Invalid or expired code.");
      setForgotResetToken(data.resetToken || "");
      go("forgot-reset");
    } catch (err: any) { setErr("otp", err.message); toast(err.message, "error"); }
    finally { setLoading(false); }
  };

  // ── FORGOT: RESET ────────────────────────────────────
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to reset password.");
      go("forgot-done");
      toast("Password updated successfully!", "success");
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

  const canGoBack = screen !== "login-creds";

  const meta: Record<Screen, { title: string; sub: string }> = {
    "login-creds":  { title: "Welcome Back", sub: "Sign in to your student account" },
    "login-otp":    { title: "Enter OTP",    sub: `Code sent to ${identifier}` },
    "reg-contact":  { title: "Create Account", sub: "Enter your email or phone to start" },
    "reg-otp":      { title: "Verify Contact", sub: `Code sent to ${regContact}` },
    "reg-details":  { title: "Almost Done!",  sub: "Set up your account details" },
    "forgot-email": { title: "Forgot Password", sub: "Enter your registered email" },
    "forgot-otp":   { title: "Check Email",  sub: `Code sent to ${forgotEmail}` },
    "forgot-reset": { title: "New Password", sub: "Choose a strong new password" },
    "forgot-done":  { title: "All Done!",    sub: "Your password has been updated" },
  };

  const isOtpScreen = screen === "login-otp" || screen === "reg-otp" || screen === "forgot-otp";

  return (
    <View style={styles.root}>
      <StatusBar barStyle="light-content" />

      {/* Full-screen purple gradient */}
      <LinearGradient
        colors={["#150533", "#2d1065", "#4c1d95", "#2d1065", "#150533"]}
        locations={[0, 0.25, 0.5, 0.75, 1]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0.2, y: 0 }}
        end={{ x: 0.8, y: 1 }}
      />

      {/* Decorative blobs */}
      <View style={styles.blob1} />
      <View style={styles.blob2} />
      <View style={styles.blob3} />

      {/* Toast */}
      <View style={[styles.toastZone, { top: insets.top + 10 }]} pointerEvents="none">
        {ToastEl}
      </View>

      {/* Logo area — top of screen */}
      <View style={[styles.topBrand, { paddingTop: insets.top + 20 }]}>
        <View style={styles.logoCircle}>
          <Image
            source={require("../assets/images/icon_nobg.png")}
            style={styles.logoImg}
            resizeMode="contain"
          />
        </View>
        <Text style={[styles.brandName, { fontFamily: "Roboto_700Bold" }]}>
          SAMIKARAN<Text style={{ color: "#FF2FBF" }}>.</Text>
        </Text>
        <Text style={[styles.brandSub, { fontFamily: "Roboto_400Regular" }]}>OLYMPIAD PLATFORM</Text>

        {isOtpScreen && (
          <View style={styles.otpBadge}>
            <LinearGradient colors={["#7c3aed", "#ec4899"]} style={styles.otpBadgeGrad}>
              <Ionicons name="mail-open-outline" size={22} color="#fff" />
            </LinearGradient>
          </View>
        )}
        {screen === "forgot-done" && (
          <View style={styles.otpBadge}>
            <LinearGradient colors={["#059669", "#10b981"]} style={styles.otpBadgeGrad}>
              <Ionicons name="checkmark-circle" size={22} color="#fff" />
            </LinearGradient>
          </View>
        )}
      </View>

      {/* White glassmorphism card */}
      <KeyboardAvoidingView
        style={styles.kavFlex}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={0}
      >
        <View style={[styles.card, { paddingBottom: insets.bottom + 20 }]}>
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
              <Text style={[styles.cardTitle, { fontFamily: "Roboto_700Bold" }]}>{meta[screen].title}</Text>
              <Text style={[styles.cardSub, { fontFamily: "Roboto_400Regular" }]}>{meta[screen].sub}</Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={styles.scrollContent}
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
                  <Text style={[styles.forgotTxt, { fontFamily: "Roboto_500Medium" }]}>Forgot Password?</Text>
                </TouchableOpacity>
                <PrimaryBtn label="Sign In" loading={loading} onPress={() => handleLoginPassword(false)} />
                <OrDivider />
                <SecondaryBtn icon="phone-portrait-outline" label="Login with OTP" onPress={handleSendLoginOtp} loading={loading} />
                <SwitchLink
                  question="Don't have an account?"
                  link="Create one"
                  onPress={() => go("reg-contact")}
                />
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
                <SwitchLink
                  question="Already have an account?"
                  link="Sign In"
                  onPress={() => go("login-creds")}
                />
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
                    Your password has been successfully updated. You can now sign in with your new credentials.
                  </Text>
                </View>
                <PrimaryBtn
                  label="Back to Sign In"
                  loading={false}
                  onPress={() => {
                    go("login-creds");
                    setForgotEmail("");
                    setNewPassword("");
                    setConfirmPassword("");
                  }}
                />
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>

      {/* ── SESSION CONFLICT MODAL ── */}
      <Modal
        visible={sessionModal}
        transparent
        animationType="fade"
        onRequestClose={() => setSessionModal(false)}
      >
        <View style={styles.modalBg}>
          <View style={styles.modalBox}>
            <View style={styles.modalWarnIcon}>
              <Ionicons name="warning" size={28} color="#f59e0b" />
            </View>
            <Text style={[styles.modalTitle, { fontFamily: "Roboto_700Bold" }]}>
              Active Session Detected
            </Text>
            <Text style={[styles.modalBody, { fontFamily: "Roboto_400Regular" }]}>
              You are already signed in on{" "}
              <Text style={{ fontFamily: "Roboto_700Bold", color: "#7c3aed" }}>
                {sessionInfo?.device}
              </Text>
              {sessionInfo?.time ? `. Signed in ${sessionInfo.time}` : ""}.
              {"\n\n"}
              Do you want to sign out of that device and sign in here?
            </Text>
            <View style={styles.modalRow}>
              <TouchableOpacity
                style={styles.modalKeepBtn}
                onPress={() => setSessionModal(false)}
              >
                <Text style={[styles.modalKeepTxt, { fontFamily: "Roboto_700Bold" }]}>Keep Existing</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.modalSignInBtn}
                onPress={() => {
                  setSessionModal(false);
                  if (forceMode === "otp") handleVerifyLoginOtp(true);
                  else handleLoginPassword(true);
                }}
              >
                <LinearGradient
                  colors={["#7c3aed", "#ec4899"]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.modalSignInGrad}
                >
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
      <Text style={[styles.fieldLabel, { fontFamily: "Roboto_500Medium", color: hasError ? "#dc2626" : focused ? "#7c3aed" : "#6b7280" }]}>
        {label}
      </Text>
      <View
        style={[
          styles.fieldWrap,
          focused && styles.fieldFocused,
          hasError && styles.fieldError,
        ]}
      >
        <Ionicons
          name={icon}
          size={17}
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
          <TouchableOpacity
            onPress={onEye}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name={eyeIcon} size={17} color="#9ca3af" />
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
    <TouchableOpacity
      style={[styles.primaryWrap, { opacity: loading ? 0.75 : 1 }]}
      onPress={onPress}
      disabled={loading}
      activeOpacity={0.87}
    >
      <LinearGradient
        colors={["#7c3aed", "#a855f7", "#ec4899"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={styles.primaryGrad}
      >
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
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

function OtpBoxes({ otp, refs, onChange }: { otp: string[]; refs: React.MutableRefObject<(TextInput | null)[]>; onChange: (v: string, i: number) => void }) {
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
          Resend in{" "}
          <Text style={{ color: "#7c3aed", fontFamily: "Roboto_700Bold" }}>
            {mm}:{ss}
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

// ── STYLES ────────────────────────────────────────────────
const styles = StyleSheet.create({
  root: { flex: 1 },
  kavFlex: { flex: 1 },

  // Decorative blobs behind gradient
  blob1: { position: "absolute", width: 280, height: 280, borderRadius: 140, backgroundColor: "#7c3aed", opacity: 0.25, top: -60, left: -60 },
  blob2: { position: "absolute", width: 220, height: 220, borderRadius: 110, backgroundColor: "#ec4899", opacity: 0.13, top: 30, right: -60 },
  blob3: { position: "absolute", width: 180, height: 180, borderRadius: 90,  backgroundColor: "#7c3aed", opacity: 0.15, bottom: height * 0.35, left: -30 },

  // Toast
  toastZone: { position: "absolute", left: 16, right: 16, zIndex: 999 },
  toast: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#1e293b", borderRadius: 14, paddingVertical: 12, paddingHorizontal: 16, shadowColor: "#000", shadowOpacity: 0.25, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 10 },
  toastTxt: { flex: 1, fontSize: 13, color: "#fff" },

  // Top branding
  topBrand: { alignItems: "center", gap: 6, paddingBottom: 24, paddingHorizontal: 20 },
  logoCircle: { width: 60, height: 60, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.12)", borderWidth: 1.5, borderColor: "rgba(255,255,255,0.2)", alignItems: "center", justifyContent: "center", marginBottom: 4 },
  logoImg: { width: 42, height: 42 },
  brandName: { fontSize: 20, color: "#fff", letterSpacing: 2.5 },
  brandSub: { fontSize: 9.5, color: "rgba(255,255,255,0.4)", letterSpacing: 4 },
  otpBadge: { marginTop: 8 },
  otpBadgeGrad: { width: 52, height: 52, borderRadius: 26, alignItems: "center", justifyContent: "center" },

  // ─── WHITE GLASSMORPHISM CARD ───────────────────────────
  card: {
    flex: 1,
    // White with frosted glass feel
    backgroundColor: "rgba(255,255,255,0.96)",
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.6)",
    // Soft glow shadow at top
    shadowColor: "#7c3aed",
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 16,
    paddingHorizontal: 24,
    paddingTop: 12,
  },
  pill: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#e5e7eb", alignSelf: "center", marginBottom: 20 },

  // Card header
  cardHeader: { flexDirection: "row", alignItems: "flex-start", marginBottom: 22, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: "#f5f3ff", borderWidth: 1, borderColor: "#ede9fe", alignItems: "center", justifyContent: "center" },
  backPlaceholder: { width: 36 },
  cardTitle: { fontSize: 24, color: "#111827", lineHeight: 30 },
  cardSub: { fontSize: 13, color: "#9ca3af", marginTop: 2 },

  scrollContent: { gap: 14, paddingBottom: 8 },

  // ─── FIELD ──────────────────────────────────────────────
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
  fieldInput: { flex: 1, fontSize: 15, color: "#111827" },
  fieldErrRow: { flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4, marginLeft: 2 },
  fieldErrTxt: { fontSize: 12, color: "#dc2626" },

  errBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: "#fef2f2", borderWidth: 1, borderColor: "#fecaca",
    borderRadius: 12, padding: 12,
  },
  errBannerTxt: { flex: 1, fontSize: 13, color: "#dc2626" },

  // Forgot
  forgotRow: { alignSelf: "flex-end", marginTop: -6 },
  forgotTxt: { fontSize: 13, color: "#7c3aed" },

  // Primary btn
  primaryWrap: { borderRadius: 16, overflow: "hidden" },
  primaryGrad: { paddingVertical: 16, alignItems: "center" },
  primaryTxt: { color: "#fff", fontSize: 16, letterSpacing: 0.3 },

  // Secondary btn
  secBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", borderWidth: 1.5, borderColor: "#ede9fe", borderRadius: 16, paddingVertical: 14, backgroundColor: "#faf5ff" },
  secBtnTxt: { fontSize: 14, color: "#7c3aed" },

  // Divider
  orRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  orLine: { flex: 1, height: 1, backgroundColor: "#f3f4f6" },
  orTxt: { fontSize: 12, color: "#d1d5db" },

  // OTP
  otpRow: { flexDirection: "row", gap: 8 },
  otpBox: { flex: 1, height: 58, borderRadius: 14, borderWidth: 1.5, borderColor: "#e5e7eb", fontSize: 24, color: "#111827", backgroundColor: "#f9fafb", textAlign: "center", fontFamily: "Roboto_700Bold" },
  otpBoxFilled: { borderColor: "#7c3aed", backgroundColor: "#faf5ff" },

  // Switch
  switchRow: { flexDirection: "row", justifyContent: "center", alignItems: "center" },
  switchQ: { fontSize: 13, color: "#6b7280" },
  switchLink: { fontSize: 13, color: "#7c3aed" },

  // Resend
  resendRow: { alignItems: "center" },
  resendWait: { fontSize: 13, color: "#9ca3af" },
  resendLink: { fontSize: 13, color: "#7c3aed" },

  passHint: { fontSize: 11, color: "#9ca3af", marginTop: -6 },

  // Done
  doneBlock: { alignItems: "center", gap: 16, paddingVertical: 12 },
  doneCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  doneTxt: { fontSize: 14, color: "#6b7280", lineHeight: 22, textAlign: "center" },

  // Modal
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
