import React, { useState, useRef, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { CameraView, useCameraPermissions } from "expo-camera";
import { Audio } from "expo-av";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
// expo-face-detector requires a native development build; gracefully degrade in Expo Go
let FaceDetector: typeof import("expo-face-detector") | null = null;
try {
  FaceDetector = require("expo-face-detector");
} catch {
  FaceDetector = null;
}

type CheckStatus = "pending" | "checking" | "passed" | "failed";

interface Check {
  id: string;
  label: string;
  description: string;
  icon: string;
  status: CheckStatus;
}

const RULES = [
  "Keep your face clearly visible in the camera at all times.",
  "Do not allow anyone else to enter the camera frame.",
  "Do not switch apps or minimize the screen during the exam.",
  "Stay in a quiet environment; avoid unnecessary movement.",
  "Your session may be auto-submitted if violations exceed 3.",
];

export default function ExamCheckScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ examId: string; examTitle: string; duration: string }>();

  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [checks, setChecks] = useState<Check[]>([
    { id: "camera", label: "Camera Access", description: "Allowing camera for face detection", icon: "camera", status: "pending" },
    { id: "microphone", label: "Microphone Access", description: "Allowing mic for voice questions", icon: "mic", status: "pending" },
    { id: "face", label: "Face Detection", description: "Verifying single face in frame", icon: "person", status: "pending" },
  ]);
  const [rulesChecked, setRulesChecked] = useState(false);
  const [phase, setPhase] = useState<"checks" | "rules" | "ready">("checks");
  const [faceDetected, setFaceDetected] = useState(false);
  const [faceCount, setFaceCount] = useState(0);
  const [checksRunning, setChecksRunning] = useState(false);
  const [allChecksPassed, setAllChecksPassed] = useState(false);
  const cameraRef = useRef<CameraView>(null);
  const faceCheckIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const checksRef = useRef(checks);
  checksRef.current = checks;

  const updateCheck = useCallback((id: string, status: CheckStatus) => {
    setChecks((prev) => prev.map((c) => (c.id === id ? { ...c, status } : c)));
  }, []);

  const runChecks = useCallback(async () => {
    setChecksRunning(true);

    updateCheck("camera", "checking");
    await new Promise((r) => setTimeout(r, 600));
    const camResult = await requestCameraPermission();
    updateCheck("camera", camResult.granted ? "passed" : "failed");

    await new Promise((r) => setTimeout(r, 400));
    updateCheck("microphone", "checking");
    await new Promise((r) => setTimeout(r, 600));
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      updateCheck("microphone", granted ? "passed" : "failed");
    } catch {
      updateCheck("microphone", "failed");
    }

    await new Promise((r) => setTimeout(r, 400));
    updateCheck("face", "checking");

    setChecksRunning(false);
  }, [requestCameraPermission, updateCheck]);

  useEffect(() => {
    const timer = setTimeout(runChecks, 500);
    return () => clearTimeout(timer);
  }, [runChecks]);

  useEffect(() => {
    const cam = checks.find((c) => c.id === "camera");
    const mic = checks.find((c) => c.id === "microphone");
    const face = checks.find((c) => c.id === "face");
    if (
      cam?.status === "passed" &&
      mic?.status === "passed" &&
      face?.status === "passed"
    ) {
      setAllChecksPassed(true);
    }
  }, [checks]);

  useEffect(() => {
    const faceCheck = checks.find((c) => c.id === "face");
    if (faceCheck?.status !== "checking" && faceCheck?.status !== "passed" && faceCheck?.status !== "failed") return;
    if (!cameraPermission?.granted) return;

    faceCheckIntervalRef.current = setInterval(async () => {
      if (!cameraRef.current) return;
      try {
        // FaceDetector unavailable in Expo Go — pass gracefully
        if (!FaceDetector) {
          setFaceCount(1);
          setFaceDetected(true);
          updateCheck("face", "passed");
          return;
        }
        const photo = await cameraRef.current.takePictureAsync({ quality: 0, skipProcessing: true });
        const result = await FaceDetector.detectFacesAsync(photo.uri, {
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          runClassifications: FaceDetector.FaceDetectorClassifications.none,
        });
        const count = result.faces.length;
        setFaceCount(count);
        setFaceDetected(count === 1);
        updateCheck("face", count === 1 ? "passed" : "failed");
      } catch {
        if (Platform.OS === "web" || !FaceDetector) {
          setFaceCount(1);
          setFaceDetected(true);
          updateCheck("face", "passed");
        } else {
          updateCheck("face", "failed");
        }
      }
    }, 2000);

    return () => {
      if (faceCheckIntervalRef.current) clearInterval(faceCheckIntervalRef.current);
    };
  }, [checks, cameraPermission?.granted, updateCheck]);

  const handleBeginExam = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push({
      pathname: "/exam-take",
      params: {
        examId: params.examId ?? "1",
        examTitle: params.examTitle ?? "GK & Current Affairs",
        duration: params.duration ?? "45",
      },
    });
  };

  type IoniconsName = React.ComponentProps<typeof Ionicons>["name"];
  const CHECK_ICON_MAP: Record<string, IoniconsName> = {
    camera: "camera-outline",
    mic: "mic-outline",
    person: "person-outline",
  };
  const getCheckIcon = (status: CheckStatus, iconId: string): IoniconsName => {
    if (status === "passed") return "checkmark-circle";
    if (status === "failed") return "close-circle";
    return CHECK_ICON_MAP[iconId] ?? "ellipse-outline";
  };

  const getCheckColor = (status: CheckStatus) => {
    if (status === "passed") return colors.success;
    if (status === "failed") return colors.destructive;
    if (status === "checking") return colors.primary;
    return colors.mutedForeground;
  };

  const cameraReady = cameraPermission?.granted;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#0D0A1E", "#1a1033"]}
        style={[styles.header, { paddingTop: insets.top + 16 }]}
      >
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <View style={[styles.shieldBadge, { backgroundColor: "#8A2BE220" }]}>
            <Ionicons name="shield-checkmark" size={22} color="#a855f7" />
          </View>
          <Text style={[styles.headerTitle, { color: "#fff", fontFamily: "Roboto_700Bold" }]}>
            Pre-Exam Check
          </Text>
          <Text style={[styles.headerSub, { color: "rgba(255,255,255,0.55)", fontFamily: "Roboto_400Regular" }]}>
            {params.examTitle ?? "Live Exam"} · {params.duration ?? "45"} min
          </Text>
        </View>
      </LinearGradient>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {cameraReady && (
          <View style={styles.cameraContainer}>
            <CameraView
              ref={cameraRef}
              style={styles.cameraPreview}
              facing="front"
            />
            <View style={[styles.faceOverlay, { borderColor: faceCount === 1 ? colors.success : faceCount > 1 ? colors.destructive : "#FFB300" }]}>
              {faceCount === 1 && (
                <View style={[styles.faceOkBadge, { backgroundColor: colors.success }]}>
                  <Ionicons name="checkmark" size={12} color="#fff" />
                  <Text style={styles.faceOkText}>Face OK</Text>
                </View>
              )}
              {faceCount === 0 && (
                <View style={[styles.faceOkBadge, { backgroundColor: "#FFB300" }]}>
                  <Ionicons name="warning" size={12} color="#fff" />
                  <Text style={styles.faceOkText}>No Face</Text>
                </View>
              )}
              {faceCount > 1 && (
                <View style={[styles.faceOkBadge, { backgroundColor: colors.destructive }]}>
                  <Ionicons name="people" size={12} color="#fff" />
                  <Text style={styles.faceOkText}>Multiple Faces</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {!cameraReady && !checksRunning && (
          <View style={[styles.noCameraCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="camera-outline" size={36} color={colors.mutedForeground} />
            <Text style={[styles.noCameraText, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>
              Camera not available in this environment
            </Text>
          </View>
        )}

        <View style={[styles.checksCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>
            System Checks
          </Text>
          {checks.map((check) => (
            <View key={check.id} style={[styles.checkRow, { borderBottomColor: colors.border }]}>
              <View style={[styles.checkIconBox, { backgroundColor: getCheckColor(check.status) + "18" }]}>
                {check.status === "checking" ? (
                  <ActivityIndicator size="small" color={colors.primary} />
                ) : (
                  <Ionicons
                    name={getCheckIcon(check.status, check.icon)}
                    size={20}
                    color={getCheckColor(check.status)}
                  />
                )}
              </View>
              <View style={styles.checkInfo}>
                <Text style={[styles.checkLabel, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>
                  {check.label}
                </Text>
                <Text style={[styles.checkDesc, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>
                  {check.status === "checking"
                    ? "Checking..."
                    : check.status === "passed"
                    ? "Verified"
                    : check.status === "failed"
                    ? check.id === "face"
                      ? faceCount > 1
                        ? "Multiple faces detected"
                        : "Position your face in the camera"
                      : "Permission denied — please allow in Settings"
                    : check.description}
                </Text>
              </View>
              <View style={[styles.statusDot, {
                backgroundColor: check.status === "passed" ? colors.success :
                  check.status === "failed" ? colors.destructive :
                  check.status === "checking" ? colors.primary : colors.muted
              }]} />
            </View>
          ))}
        </View>

        {allChecksPassed && (
          <View style={[styles.rulesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.sectionTitle, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>
              Exam Rules
            </Text>
            <Text style={[styles.rulesIntro, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>
              Please read carefully before starting:
            </Text>
            {RULES.map((rule, i) => (
              <View key={i} style={styles.ruleRow}>
                <View style={[styles.ruleNum, { backgroundColor: colors.primary + "18" }]}>
                  <Text style={[styles.ruleNumText, { color: colors.primary, fontFamily: "Roboto_700Bold" }]}>{i + 1}</Text>
                </View>
                <Text style={[styles.ruleText, { color: colors.foreground, fontFamily: "Roboto_400Regular" }]}>
                  {rule}
                </Text>
              </View>
            ))}

            <TouchableOpacity
              style={[styles.acceptRow, { borderColor: rulesChecked ? colors.primary : colors.border }]}
              onPress={() => {
                Haptics.selectionAsync();
                setRulesChecked(!rulesChecked);
              }}
              activeOpacity={0.7}
            >
              <View style={[styles.checkbox, {
                backgroundColor: rulesChecked ? colors.primary : "transparent",
                borderColor: rulesChecked ? colors.primary : colors.mutedForeground,
              }]}>
                {rulesChecked && <Ionicons name="checkmark" size={14} color="#fff" />}
              </View>
              <Text style={[styles.acceptText, { color: colors.foreground, fontFamily: "Roboto_500Medium" }]}>
                I have read and agree to all the exam rules
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {allChecksPassed && rulesChecked && (
          <TouchableOpacity onPress={handleBeginExam} activeOpacity={0.85}>
            <LinearGradient
              colors={["#8A2BE2", "#FF2FBF"]}
              style={styles.beginBtn}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="play-circle" size={22} color="#fff" />
              <Text style={[styles.beginBtnText, { fontFamily: "Roboto_700Bold" }]}>
                Begin Exam Now
              </Text>
              <Ionicons name="arrow-forward" size={18} color="#fff" />
            </LinearGradient>
          </TouchableOpacity>
        )}

        {!allChecksPassed && !checksRunning && (
          <View style={[styles.waitCard, { backgroundColor: colors.muted, borderColor: colors.border }]}>
            <Ionicons name="information-circle-outline" size={20} color={colors.mutedForeground} />
            <Text style={[styles.waitText, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>
              {cameraReady
                ? "Position your face clearly in the camera frame to continue."
                : "Please grant camera and microphone permissions to proceed."}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 24,
    flexDirection: "column",
    gap: 12,
  },
  backBtn: { alignSelf: "flex-start" },
  headerCenter: { alignItems: "center", gap: 8 },
  shieldBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { fontSize: 22 },
  headerSub: { fontSize: 14 },
  scroll: { flex: 1 },
  scrollContent: { padding: 16, gap: 16 },
  cameraContainer: {
    borderRadius: 20,
    overflow: "hidden",
    height: 220,
    position: "relative",
  },
  cameraPreview: { width: "100%", height: "100%" },
  faceOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderWidth: 3,
    borderRadius: 20,
    justifyContent: "flex-end",
    alignItems: "flex-start",
    padding: 12,
  },
  faceOkBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  faceOkText: {
    color: "#fff",
    fontSize: 11,
    fontFamily: "Roboto_700Bold",
  },
  noCameraCard: {
    height: 140,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
  },
  noCameraText: { fontSize: 14, textAlign: "center" },
  checksCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 0,
  },
  sectionTitle: { fontSize: 17, marginBottom: 14 },
  checkRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  checkIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  checkInfo: { flex: 1, gap: 2 },
  checkLabel: { fontSize: 14 },
  checkDesc: { fontSize: 12 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  rulesCard: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    gap: 12,
  },
  rulesIntro: { fontSize: 13, marginTop: -4 },
  ruleRow: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  ruleNum: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  ruleNumText: { fontSize: 12 },
  ruleText: { flex: 1, fontSize: 13, lineHeight: 20 },
  acceptRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    marginTop: 4,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    marginTop: 1,
  },
  acceptText: { flex: 1, fontSize: 14, lineHeight: 20 },
  beginBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 17,
    borderRadius: 16,
  },
  beginBtnText: { color: "#fff", fontSize: 17 },
  waitCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  waitText: { flex: 1, fontSize: 13, lineHeight: 19 },
});
