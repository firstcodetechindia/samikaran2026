import React, {
  useState,
  useRef,
  useEffect,
  useCallback,
  useMemo,
} from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  AppState,
  AppStateStatus,
  Animated,
  Modal,
  Platform,
  Dimensions,
  Pressable,
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter, useLocalSearchParams } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { CameraView } from "expo-camera";
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

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");

const VIOLATION_THRESHOLD = 3;
const FACE_CHECK_INTERVAL_MS = 2000;
const SIREN_URL = "https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3";
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? "";
if (!BASE_URL) {
  console.warn(
    "[exam-take] EXPO_PUBLIC_API_URL is not set. Voice uploads and playback " +
    "will fail on native builds. Set this variable to your API server URL."
  );
}

type QuestionType = "mcq" | "truefalse" | "image" | "voice";
type QuestionStatus = "unanswered" | "answered" | "skipped";

interface Question {
  id: number;
  type: QuestionType;
  text: string;
  imageUrl?: string;
  options?: string[];
  correctAnswer?: string;
  marks: number;
}

const MOCK_QUESTIONS: Question[] = [
  { id: 1, type: "mcq", text: "Which planet is known as the Red Planet?", options: ["Venus", "Mars", "Jupiter", "Saturn"], correctAnswer: "Mars", marks: 2 },
  { id: 2, type: "truefalse", text: "The speed of light in vacuum is approximately 3 × 10⁸ m/s.", options: ["True", "False"], correctAnswer: "True", marks: 1 },
  { id: 3, type: "mcq", text: "What is the chemical formula of water?", options: ["H₂O", "CO₂", "NaCl", "O₂"], correctAnswer: "H₂O", marks: 2 },
  { id: 4, type: "image", text: "Identify the type of circuit shown in the diagram:", imageUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e9/First_air_circuit_breaker.jpg/320px-First_air_circuit_breaker.jpg", options: ["Series Circuit", "Parallel Circuit", "Short Circuit", "Open Circuit"], correctAnswer: "Series Circuit", marks: 3 },
  { id: 5, type: "truefalse", text: "Photosynthesis occurs in the mitochondria of plant cells.", options: ["True", "False"], correctAnswer: "False", marks: 1 },
  { id: 6, type: "mcq", text: "Which of the following is NOT a primary color of light?", options: ["Red", "Green", "Yellow", "Blue"], correctAnswer: "Yellow", marks: 2 },
  { id: 7, type: "voice", text: "Briefly explain the process of osmosis in your own words.", marks: 5 },
  { id: 8, type: "mcq", text: "Who is credited with discovering the law of gravitation?", options: ["Albert Einstein", "Isaac Newton", "Nikola Tesla", "Galileo Galilei"], correctAnswer: "Isaac Newton", marks: 2 },
  { id: 9, type: "truefalse", text: "Sound travels faster in water than in air.", options: ["True", "False"], correctAnswer: "True", marks: 1 },
  { id: 10, type: "mcq", text: "What is the powerhouse of the cell?", options: ["Nucleus", "Ribosome", "Mitochondria", "Golgi body"], correctAnswer: "Mitochondria", marks: 2 },
];

function WaveformBar({ isActive, index }: { isActive: boolean; index: number }) {
  const anim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    if (isActive) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 0.2 + Math.random() * 0.8, duration: 100 + index * 40, useNativeDriver: false }),
          Animated.timing(anim, { toValue: 0.1 + Math.random() * 0.4, duration: 150 + index * 30, useNativeDriver: false }),
        ])
      );
      loop.start();
      return () => loop.stop();
    } else {
      Animated.timing(anim, { toValue: 0.3, duration: 200, useNativeDriver: false }).start();
    }
  }, [isActive]);

  return (
    <Animated.View
      style={{
        width: 4,
        borderRadius: 2,
        backgroundColor: "#8A2BE2",
        height: anim.interpolate({ inputRange: [0, 1], outputRange: [4, 40] }),
      }}
    />
  );
}

function QuestionImage({ uri, borderColor, mutedColor }: { uri: string; borderColor: string; mutedColor: string }) {
  const [errored, setErrored] = useState(false);
  return (
    <View style={[styles.imageContainer, { borderColor }]}>
      {errored ? (
        <>
          <Ionicons name="image-outline" size={40} color={mutedColor} />
          <Text style={[styles.imagePlaceholder, { color: mutedColor }]}>Image unavailable</Text>
        </>
      ) : (
        <Image
          source={{ uri }}
          style={styles.questionImage}
          resizeMode="contain"
          onError={() => setErrored(true)}
        />
      )}
    </View>
  );
}

export default function ExamTakeScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const params = useLocalSearchParams<{ examId: string; examTitle: string; duration: string }>();

  const examTitle = params.examTitle ?? "GK & Current Affairs";
  const durationMinutes = parseInt(params.duration ?? "45", 10);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<number, QuestionStatus>>({});
  const [timeLeft, setTimeLeft] = useState(durationMinutes * 60);
  const [violations, setViolations] = useState(0);
  const [showPalette, setShowPalette] = useState(false);
  const [examSubmitted, setExamSubmitted] = useState(false);
  const [warningVisible, setWarningVisible] = useState(false);
  const [warningMessage, setWarningMessage] = useState("");
  const [warningType, setWarningType] = useState<"tab" | "face" | "multiface">("tab");

  const [isRecording, setIsRecording] = useState(false);
  // voiceAnswers holds ONLY permanent server URLs — never local device URIs
  const [voiceAnswers, setVoiceAnswers] = useState<Record<number, string>>({});
  // voiceLocalUris holds temp device URIs while uploading (also kept for retry on failure)
  const [voiceLocalUris, setVoiceLocalUris] = useState<Record<number, string>>({});
  const [uploadingVoice, setUploadingVoice] = useState<Set<number>>(new Set());
  const [voiceUploadErrors, setVoiceUploadErrors] = useState<Set<number>>(new Set());
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [playingQuestionId, setPlayingQuestionId] = useState<number | null>(null);
  const [playbackSeconds, setPlaybackSeconds] = useState<Record<number, number>>({});
  const playbackSoundRef = useRef<Audio.Sound | null>(null);
  const playbackTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [faceCount, setFaceCount] = useState(1);
  const [cameraError, setCameraError] = useState(false);

  const paletteAnim = useRef(new Animated.Value(0)).current;
  const warningAnim = useRef(new Animated.Value(0)).current;
  const soundRef = useRef<Audio.Sound | null>(null);
  const recordingRef = useRef<Audio.Recording | null>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const faceCheckTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const cameraRef = useRef<CameraView>(null);
  const lastFaceCountRef = useRef(1);
  const consecutiveFaceFailuresRef = useRef(0);
  const violationsRef = useRef(0);
  const submittedRef = useRef(false);
  const appStateRef = useRef(AppState.currentState);
  // Ref mirrors — kept in sync via useEffect so submitExam reads fresh values
  const uploadingVoiceRef = useRef<Set<number>>(new Set());
  const voiceAnswersRef = useRef<Record<number, string>>({});

  useEffect(() => { uploadingVoiceRef.current = uploadingVoice; }, [uploadingVoice]);
  useEffect(() => { voiceAnswersRef.current = voiceAnswers; }, [voiceAnswers]);

  const currentQuestion = MOCK_QUESTIONS[currentIndex];

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? "0" : ""}${s}`;
  };

  const answeredCount = Object.keys(answers).length + Object.keys(voiceAnswers).length;

  const loadAndPlaySiren = useCallback(async () => {
    try {
      await Audio.setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: false });
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
      const { sound } = await Audio.Sound.createAsync(
        { uri: SIREN_URL },
        { shouldPlay: true, volume: 0.8 }
      );
      soundRef.current = sound;
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          sound.unloadAsync();
          soundRef.current = null;
        }
      });
    } catch {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      } catch {}
    }
  }, []);

  const stopSiren = useCallback(async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch {}
      soundRef.current = null;
    }
  }, []);

  const submitExam = useCallback(
    async (reason: "manual" | "time" | "violations") => {
      if (submittedRef.current) return;
      submittedRef.current = true;
      setExamSubmitted(true);
      stopSiren();

      // For forced auto-submits wait up to 30 s for any in-flight voice uploads
      // so server URLs replace local URIs before the payload is finalised.
      // 30 s gives a reasonable window even on poor networks.
      if (uploadingVoiceRef.current.size > 0) {
        await new Promise<void>((resolve) => {
          let poll: ReturnType<typeof setInterval>;
          const maxWait = setTimeout(() => {
            clearInterval(poll);
            resolve();
          }, 30_000);
          poll = setInterval(() => {
            if (uploadingVoiceRef.current.size === 0) {
              clearInterval(poll);
              clearTimeout(maxWait);
              resolve();
            }
          }, 300);
        });
      }

      const totalQuestions = MOCK_QUESTIONS.length;
      const answered = Object.keys(answers).length + Object.keys(voiceAnswersRef.current).length;
      const skipped = totalQuestions - answered;

      const reasonText =
        reason === "time"
          ? "Time's up!"
          : reason === "violations"
          ? "Auto-submitted due to violations."
          : "Exam submitted successfully.";

      Alert.alert(
        "Exam Submitted",
        `${reasonText}\n\nAnswered: ${answered}/${totalQuestions}\nSkipped: ${skipped}`,
        [{ text: "View Results", onPress: () => router.replace("/(student)/results") }],
        { cancelable: false }
      );
    },
    [answers, router, stopSiren]
  );

  const triggerViolation = useCallback(
    (type: "tab" | "face" | "multiface", message: string) => {
      if (submittedRef.current) return;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      loadAndPlaySiren();

      violationsRef.current += 1;
      const newCount = violationsRef.current;
      setViolations(newCount);

      setWarningType(type);
      setWarningMessage(message);
      setWarningVisible(true);

      Animated.spring(warningAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 120,
        friction: 8,
      }).start();

      if (newCount >= VIOLATION_THRESHOLD) {
        setTimeout(() => {
          submitExam("violations");
        }, 2500);
      }
    },
    [loadAndPlaySiren, submitExam, warningAnim]
  );

  const dismissWarning = useCallback(() => {
    Animated.timing(warningAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => setWarningVisible(false));
    stopSiren();
  }, [warningAnim, stopSiren]);

  useEffect(() => {
    if (timeLeft <= 0) {
      submitExam("time");
      return;
    }
    const timer = setInterval(() => setTimeLeft((t) => t - 1), 1000);
    return () => clearInterval(timer);
  }, [timeLeft, submitExam]);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
      if (
        appStateRef.current === "active" &&
        (nextState === "background" || nextState === "inactive")
      ) {
        triggerViolation(
          "tab",
          `Violation ${violationsRef.current + 1}/3: You left the exam app. This has been recorded.`
        );
      }
      appStateRef.current = nextState;
    });
    return () => subscription.remove();
  }, [triggerViolation]);

  useEffect(() => {
    faceCheckTimerRef.current = setInterval(async () => {
      if (submittedRef.current) return;
      if (!cameraRef.current || cameraError) return;

      try {
        // FaceDetector unavailable in Expo Go — skip face check silently
        if (!FaceDetector) return;
        const photo = await cameraRef.current.takePictureAsync({ quality: 0, skipProcessing: true });
        const result = await FaceDetector.detectFacesAsync(photo.uri, {
          mode: FaceDetector.FaceDetectorMode.fast,
          detectLandmarks: FaceDetector.FaceDetectorLandmarks.none,
          runClassifications: FaceDetector.FaceDetectorClassifications.none,
        });
        const count = result.faces.length;
        consecutiveFaceFailuresRef.current = 0;
        lastFaceCountRef.current = count;
        setFaceCount(count);

        if (count === 0) {
          triggerViolation("face", `Violation ${violationsRef.current + 1}/3: Face not detected. Please look at the camera.`);
        } else if (count > 1) {
          triggerViolation("multiface", `Violation ${violationsRef.current + 1}/3: Multiple faces detected. Only one person is allowed.`);
        }
      } catch {
        if (Platform.OS === "web" || !FaceDetector) {
          // Face detection unavailable — skip silently
          return;
        }
        consecutiveFaceFailuresRef.current += 1;
        // After 3 consecutive native failures the camera is likely inaccessible —
        // treat it as a proctoring violation rather than silently ignoring.
        if (consecutiveFaceFailuresRef.current >= 3) {
          consecutiveFaceFailuresRef.current = 0;
          triggerViolation("face", `Violation ${violationsRef.current + 1}/3: Camera unavailable. Please ensure camera access is granted.`);
        }
      }
    }, FACE_CHECK_INTERVAL_MS);

    return () => {
      if (faceCheckTimerRef.current) clearInterval(faceCheckTimerRef.current);
    };
  }, [triggerViolation, cameraError]);

  const handleSelectAnswer = (option: string) => {
    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: option }));
    setQuestionStatuses((prev) => ({ ...prev, [currentQuestion.id]: "answered" }));
  };

  const handleNext = () => {
    if (currentIndex < MOCK_QUESTIONS.length - 1) {
      setCurrentIndex(currentIndex + 1);
    }
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  const handleSkip = () => {
    setQuestionStatuses((prev) => ({ ...prev, [currentQuestion.id]: "skipped" }));
    handleNext();
  };

  const openPalette = () => {
    setShowPalette(true);
    Animated.spring(paletteAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 100,
      friction: 10,
    }).start();
  };

  const closePalette = () => {
    Animated.timing(paletteAnim, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(() => setShowPalette(false));
  };

  const uploadVoiceRecording = async (localUri: string, questionId: number): Promise<string> => {
    const ext = localUri.split(".").pop() ?? "m4a";
    const filename = `voice_q${questionId}_${Date.now()}.${ext}`;
    const AUDIO_MIME: Record<string, string> = {
      m4a: "audio/m4a", mp4: "audio/mp4", webm: "audio/webm",
      ogg: "audio/ogg", wav: "audio/wav", aac: "audio/aac",
      "3gp": "audio/3gpp", "3gpp": "audio/3gpp", amr: "audio/amr",
    };
    const mimeType = AUDIO_MIME[ext] ?? "audio/mpeg";

    if (!BASE_URL) {
      throw new Error("EXPO_PUBLIC_API_URL is not configured — cannot upload voice recording.");
    }

    const formData = new FormData();
    formData.append("file", { uri: localUri, name: filename, type: mimeType } as unknown as Blob);
    formData.append("folder", "uploads");

    const res = await fetch(`${BASE_URL}/api/uploads/direct`, {
      method: "POST",
      body: formData,
      credentials: "include",
    });
    if (!res.ok) throw new Error(`Upload failed: ${res.status}`);
    const data = (await res.json()) as { objectPath: string };
    return data.objectPath;
  };

  const startVoiceRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      recordingRef.current = recording;
      setIsRecording(true);
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => {
        setRecordingSeconds((s) => s + 1);
      }, 1000);
    } catch {
      Alert.alert("Error", "Could not start recording. Check microphone permissions.");
    }
  };

  const stopVoiceRecording = async () => {
    if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    setIsRecording(false);
    const qId = currentQuestion.id;
    try {
      if (recordingRef.current) {
        await recordingRef.current.stopAndUnloadAsync();
        const localUri = recordingRef.current.getURI();
        recordingRef.current = null;
        if (!localUri) return;

        // Store local URI for playback during upload / retry (never goes into voiceAnswers)
        setVoiceLocalUris((prev) => ({ ...prev, [qId]: localUri }));
        setUploadingVoice((prev) => new Set(prev).add(qId));
        setVoiceUploadErrors((prev) => { const n = new Set(prev); n.delete(qId); return n; });
        setQuestionStatuses((prev) => ({ ...prev, [qId]: "answered" }));

        try {
          const objectPath = await uploadVoiceRecording(localUri, qId);
          // Success — store permanent server URL; clear temp local URI
          const playbackUrl = objectPath.startsWith("http") ? objectPath : `${BASE_URL}${objectPath}`;
          setVoiceAnswers((prev) => ({ ...prev, [qId]: playbackUrl }));
          setVoiceLocalUris((prev) => { const n = { ...prev }; delete n[qId]; return n; });
        } catch {
          // Upload failed — revert to unanswered; keep localUri for retry
          setVoiceUploadErrors((prev) => new Set(prev).add(qId));
          setQuestionStatuses((prev) => ({ ...prev, [qId]: "unanswered" }));
        } finally {
          setUploadingVoice((prev) => {
            const next = new Set(prev);
            next.delete(qId);
            return next;
          });
        }
      }
    } catch {}
  };

  const retryVoiceUpload = async (qId: number) => {
    const localUri = voiceLocalUris[qId];
    if (!localUri) return;
    setVoiceUploadErrors((prev) => { const n = new Set(prev); n.delete(qId); return n; });
    setUploadingVoice((prev) => new Set(prev).add(qId));
    setQuestionStatuses((prev) => ({ ...prev, [qId]: "answered" }));
    try {
      const objectPath = await uploadVoiceRecording(localUri, qId);
      const playbackUrl = objectPath.startsWith("http") ? objectPath : `${BASE_URL}${objectPath}`;
      setVoiceAnswers((prev) => ({ ...prev, [qId]: playbackUrl }));
      setVoiceLocalUris((prev) => { const n = { ...prev }; delete n[qId]; return n; });
    } catch {
      setVoiceUploadErrors((prev) => new Set(prev).add(qId));
      setQuestionStatuses((prev) => ({ ...prev, [qId]: "unanswered" }));
    } finally {
      setUploadingVoice((prev) => { const n = new Set(prev); n.delete(qId); return n; });
    }
  };

  const stopVoicePlayback = useCallback(async () => {
    if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    playbackTimerRef.current = null;
    setPlayingQuestionId(null);
    if (playbackSoundRef.current) {
      try {
        await playbackSoundRef.current.stopAsync();
        await playbackSoundRef.current.unloadAsync();
      } catch {}
      playbackSoundRef.current = null;
    }
  }, []);

  const toggleVoicePlayback = useCallback(async (questionId: number, uri: string) => {
    if (playingQuestionId === questionId) {
      await stopVoicePlayback();
      return;
    }
    await stopVoicePlayback();
    try {
      const { sound } = await Audio.Sound.createAsync({ uri });
      playbackSoundRef.current = sound;
      setPlayingQuestionId(questionId);
      setPlaybackSeconds((p) => ({ ...p, [questionId]: 0 }));
      let secs = 0;
      playbackTimerRef.current = setInterval(() => {
        secs += 1;
        setPlaybackSeconds((p) => ({ ...p, [questionId]: secs }));
      }, 1000);
      await sound.playAsync();
      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          stopVoicePlayback();
        }
      });
    } catch {}
  }, [playingQuestionId, stopVoicePlayback]);

  useEffect(() => {
    return () => {
      stopSiren();
      stopVoicePlayback();
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
      if (faceCheckTimerRef.current) clearInterval(faceCheckTimerRef.current);
      recordingRef.current?.stopAndUnloadAsync().catch(() => {});
    };
  }, [stopSiren, stopVoicePlayback]);

  const paletteTranslateY = paletteAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [SCREEN_HEIGHT, 0],
  });

  const timerDanger = timeLeft < 300;

  const violationColor =
    violations === 0
      ? colors.success
      : violations === 1
      ? "#FFB300"
      : violations === 2
      ? "#FF6B00"
      : colors.destructive;

  const warningBg =
    warningType === "multiface"
      ? "#ef4444"
      : warningType === "face"
      ? "#FF6B00"
      : "#8A2BE2";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={timerDanger ? ["#7f1d1d", "#1a0000"] : ["#0D0A1E", "#1a1033"]}
        style={[styles.header, { paddingTop: insets.top + 8 }]}
      >
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Text
              style={[styles.examTitle, { color: "#fff", fontFamily: "Roboto_700Bold" }]}
              numberOfLines={1}
            >
              {examTitle}
            </Text>
            <Text style={[styles.examSub, { color: "rgba(255,255,255,0.55)", fontFamily: "Roboto_400Regular" }]}>
              Q {currentIndex + 1} / {MOCK_QUESTIONS.length} · {answeredCount} answered
            </Text>
          </View>

          <View style={styles.headerRight}>
            <View style={[styles.timerBadge, { backgroundColor: timerDanger ? "#ef444430" : "#ffffff18", borderColor: timerDanger ? "#ef4444" : "#ffffff30" }]}>
              <Ionicons name="time" size={14} color={timerDanger ? "#ef4444" : "#fff"} />
              <Text style={[styles.timerText, { color: timerDanger ? "#ef4444" : "#fff", fontFamily: "Roboto_700Bold" }]}>
                {formatTime(timeLeft)}
              </Text>
            </View>

            <View style={[styles.violationBadge, { backgroundColor: violationColor + "25", borderColor: violationColor }]}>
              <Ionicons name="warning" size={13} color={violationColor} />
              <Text style={[styles.violationText, { color: violationColor, fontFamily: "Roboto_700Bold" }]}>
                {violations}/{VIOLATION_THRESHOLD}
              </Text>
            </View>
          </View>
        </View>

        <View style={[styles.progressBar, { backgroundColor: "rgba(255,255,255,0.12)" }]}>
          <Animated.View
            style={[
              styles.progressFill,
              {
                width: `${((currentIndex + 1) / MOCK_QUESTIONS.length) * 100}%`,
                backgroundColor: timerDanger ? "#ef4444" : "#a855f7",
              },
            ]}
          />
        </View>
      </LinearGradient>

      <View style={styles.mainContent}>
        <ScrollView
          style={styles.questionScroll}
          contentContainerStyle={[styles.questionContent, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.questionCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.questionMeta}>
              <View style={[styles.qTypeBadge, { backgroundColor: colors.primary + "18" }]}>
                <Text style={[styles.qTypeText, { color: colors.primary, fontFamily: "Roboto_700Bold" }]}>
                  {currentQuestion.type === "mcq" ? "MCQ" :
                    currentQuestion.type === "truefalse" ? "True / False" :
                    currentQuestion.type === "image" ? "Image Based" : "Voice Answer"}
                </Text>
              </View>
              <Text style={[styles.marksText, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>
                {currentQuestion.marks} {currentQuestion.marks === 1 ? "mark" : "marks"}
              </Text>
            </View>

            <Text style={[styles.questionText, { color: colors.foreground, fontFamily: "Roboto_500Medium" }]}>
              {currentQuestion.text}
            </Text>

            {currentQuestion.type === "image" && currentQuestion.imageUrl && (
              <QuestionImage uri={currentQuestion.imageUrl} borderColor={colors.border} mutedColor={colors.mutedForeground} />
            )}

            {(currentQuestion.type === "mcq" || currentQuestion.type === "truefalse" || currentQuestion.type === "image") &&
              currentQuestion.options?.map((option, idx) => {
                const isSelected = answers[currentQuestion.id] === option;
                return (
                  <TouchableOpacity
                    key={idx}
                    style={[
                      styles.optionBtn,
                      {
                        backgroundColor: isSelected ? colors.primary + "15" : colors.background,
                        borderColor: isSelected ? colors.primary : colors.border,
                      },
                    ]}
                    onPress={() => handleSelectAnswer(option)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.optionCircle, {
                      backgroundColor: isSelected ? colors.primary : "transparent",
                      borderColor: isSelected ? colors.primary : colors.mutedForeground,
                    }]}>
                      {isSelected && <View style={styles.optionDot} />}
                    </View>
                    <Text
                      style={[
                        styles.optionText,
                        {
                          color: isSelected ? colors.primary : colors.foreground,
                          fontFamily: isSelected ? "Roboto_700Bold" : "Roboto_400Regular",
                        },
                      ]}
                    >
                      {option}
                    </Text>
                    {currentQuestion.type === "truefalse" && (
                      <Ionicons
                        name={option === "True" ? "checkmark-circle-outline" : "close-circle-outline"}
                        size={20}
                        color={isSelected ? colors.primary : colors.mutedForeground}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}

            {currentQuestion.type === "voice" && (
              <View style={styles.voiceSection}>
                {uploadingVoice.has(currentQuestion.id) ? (
                  // Uploading state — amber, no submit yet
                  <View style={[styles.voiceRecorded, { backgroundColor: "#fffbeb", borderColor: "#fbbf24" }]}>
                    <Ionicons name="cloud-upload-outline" size={22} color="#f59e0b" />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.voiceRecordedTitle, { color: "#d97706", fontFamily: "Roboto_700Bold" }]}>
                        Uploading…
                      </Text>
                      <Text style={[styles.voiceRecordedSub, { color: colors.mutedForeground }]}>
                        Saving your recording to server
                      </Text>
                    </View>
                  </View>
                ) : voiceUploadErrors.has(currentQuestion.id) ? (
                  // Error state — red, retry button
                  <View style={[styles.voiceRecorded, { backgroundColor: "#fef2f2", borderColor: "#fca5a5" }]}>
                    <Ionicons name="cloud-offline-outline" size={22} color={colors.destructive} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.voiceRecordedTitle, { color: colors.destructive, fontFamily: "Roboto_700Bold" }]}>
                        Upload Failed
                      </Text>
                      <Text style={[styles.voiceRecordedSub, { color: colors.mutedForeground }]}>
                        Tap Retry to resend your recording
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.reRecordBtn, { backgroundColor: colors.destructive + "20" }]}
                      onPress={() => retryVoiceUpload(currentQuestion.id)}
                    >
                      <Ionicons name="reload" size={16} color={colors.destructive} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.reRecordBtn, { backgroundColor: colors.muted, marginLeft: 6 }]}
                      onPress={() => {
                        stopVoicePlayback();
                        setVoiceUploadErrors((p) => { const n = new Set(p); n.delete(currentQuestion.id); return n; });
                        setVoiceLocalUris((p) => { const n = { ...p }; delete n[currentQuestion.id]; return n; });
                        setQuestionStatuses((p) => { const n = { ...p }; delete n[currentQuestion.id]; return n; });
                      }}
                    >
                      <Ionicons name="refresh" size={16} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  </View>
                ) : voiceAnswers[currentQuestion.id] ? (
                  // Success state — server URL confirmed
                  <View style={[styles.voiceRecorded, { backgroundColor: colors.success + "15", borderColor: colors.success }]}>
                    <Ionicons name="checkmark-circle" size={22} color={colors.success} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.voiceRecordedTitle, { color: colors.success, fontFamily: "Roboto_700Bold" }]}>
                        Answer Recorded
                      </Text>
                      <Text style={[styles.voiceRecordedSub, { color: colors.mutedForeground }]}>
                        {playingQuestionId === currentQuestion.id
                          ? `Playing — ${formatTime(playbackSeconds[currentQuestion.id] ?? 0)}`
                          : "Tap play to review • Tap refresh to re-record"}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.reRecordBtn, { backgroundColor: colors.primary + "25" }]}
                      onPress={() => toggleVoicePlayback(currentQuestion.id, voiceAnswers[currentQuestion.id])}
                    >
                      <Ionicons
                        name={playingQuestionId === currentQuestion.id ? "pause" : "play"}
                        size={16}
                        color={colors.primary}
                      />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.reRecordBtn, { backgroundColor: colors.success + "20", marginLeft: 6 }]}
                      onPress={() => {
                        stopVoicePlayback();
                        setVoiceAnswers((p) => { const n = { ...p }; delete n[currentQuestion.id]; return n; });
                        setVoiceLocalUris((p) => { const n = { ...p }; delete n[currentQuestion.id]; return n; });
                        setQuestionStatuses((p) => { const n = { ...p }; delete n[currentQuestion.id]; return n; });
                      }}
                    >
                      <Ionicons name="refresh" size={16} color={colors.success} />
                    </TouchableOpacity>
                  </View>
                ) : (
                  <View style={[styles.voiceRecorder, { backgroundColor: colors.muted, borderColor: colors.border }]}>
                    <View style={styles.waveform}>
                      {Array.from({ length: 24 }).map((_, i) => (
                        <WaveformBar key={i} isActive={isRecording} index={i} />
                      ))}
                    </View>

                    {isRecording && (
                      <Text style={[styles.recordingTime, { color: colors.primary, fontFamily: "Roboto_700Bold" }]}>
                        {formatTime(recordingSeconds)}
                      </Text>
                    )}

                    <TouchableOpacity
                      style={[styles.recordBtn, { backgroundColor: isRecording ? colors.destructive : colors.primary }]}
                      onPress={isRecording ? stopVoiceRecording : startVoiceRecording}
                      activeOpacity={0.8}
                    >
                      <Ionicons
                        name={isRecording ? "stop" : "mic"}
                        size={22}
                        color="#fff"
                      />
                      <Text style={[styles.recordBtnText, { fontFamily: "Roboto_700Bold" }]}>
                        {isRecording ? "Stop Recording" : "Tap to Record Answer"}
                      </Text>
                    </TouchableOpacity>

                    <Text style={[styles.voiceHint, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>
                      Max 60 seconds
                    </Text>
                  </View>
                )}
              </View>
            )}
          </View>
        </ScrollView>

        <View style={[styles.cameraOverlay, { borderColor: faceCount === 1 ? colors.success : faceCount > 1 ? colors.destructive : "#FFB300" }]}>
          {!cameraError ? (
            <CameraView
              ref={cameraRef}
              style={styles.miniCamera}
              facing="front"
              onMountError={() => setCameraError(true)}
            />
          ) : (
            <View style={[styles.miniCamera, { backgroundColor: "#1a1033", alignItems: "center", justifyContent: "center" }]}>
              <Ionicons name="camera-outline" size={20} color="#7a6e99" />
            </View>
          )}
          <View style={[styles.cameraStatusDot, { backgroundColor: faceCount === 1 ? colors.success : faceCount > 1 ? colors.destructive : "#FFB300" }]} />
        </View>
      </View>

      <View style={[styles.navBar, { backgroundColor: colors.card, borderTopColor: colors.border, paddingBottom: insets.bottom + 8 }]}>
        <TouchableOpacity
          style={[styles.navBtn, { borderColor: colors.border }]}
          onPress={handlePrev}
          disabled={currentIndex === 0}
        >
          <Ionicons name="chevron-back" size={20} color={currentIndex === 0 ? colors.mutedForeground : colors.foreground} />
          <Text style={[styles.navBtnText, { color: currentIndex === 0 ? colors.mutedForeground : colors.foreground, fontFamily: "Roboto_500Medium" }]}>Prev</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.paletteBtn, { backgroundColor: colors.secondary, borderColor: colors.primary + "40" }]}
          onPress={openPalette}
        >
          <Ionicons name="grid" size={17} color={colors.primary} />
          <Text style={[styles.paletteBtnText, { color: colors.primary, fontFamily: "Roboto_700Bold" }]}>
            {answeredCount}/{MOCK_QUESTIONS.length}
          </Text>
        </TouchableOpacity>

        {currentIndex < MOCK_QUESTIONS.length - 1 ? (
          <TouchableOpacity
            style={[styles.navBtn, { borderColor: colors.primary, backgroundColor: colors.primary + "12" }]}
            onPress={handleNext}
          >
            <Text style={[styles.navBtnText, { color: colors.primary, fontFamily: "Roboto_700Bold" }]}>Next</Text>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.navBtn, { borderColor: colors.success, backgroundColor: colors.success + "15" }]}
            onPress={() => {
              const pendingUploads = uploadingVoice.size;
              const uploadNote = pendingUploads > 0
                ? `\n\n⚠️ ${pendingUploads} voice answer${pendingUploads > 1 ? "s are" : " is"} still uploading. Please wait a moment.`
                : "";
              Alert.alert(
                "Submit Exam",
                `You have answered ${answeredCount} of ${MOCK_QUESTIONS.length} questions.\n\nAre you sure you want to submit?${uploadNote}`,
                [
                  { text: "Cancel", style: "cancel" },
                  ...(pendingUploads === 0 ? [{ text: "Submit", style: "destructive" as const, onPress: () => submitExam("manual") }] : []),
                ]
              );
            }}
          >
            <Text style={[styles.navBtnText, { color: colors.success, fontFamily: "Roboto_700Bold" }]}>Submit</Text>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
          </TouchableOpacity>
        )}
      </View>

      {showPalette && (
        <Modal
          transparent
          animationType="none"
          visible={showPalette}
          onRequestClose={closePalette}
          statusBarTranslucent
        >
          <Pressable style={styles.paletteBackdrop} onPress={closePalette}>
            <Animated.View
              style={[
                styles.paletteSheet,
                { backgroundColor: colors.card, transform: [{ translateY: paletteTranslateY }] },
              ]}
            >
              <Pressable>
                <View style={styles.paletteHandle} />
                <View style={styles.paletteHeader}>
                  <Text style={[styles.paletteTitle, { color: colors.foreground, fontFamily: "Roboto_700Bold" }]}>
                    Question Palette
                  </Text>
                  <TouchableOpacity onPress={closePalette} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
                    <Ionicons name="close" size={22} color={colors.mutedForeground} />
                  </TouchableOpacity>
                </View>

                <View style={styles.paletteLegend}>
                  {[
                    { color: colors.primary, label: "Answered" },
                    { color: "#FFB300", label: "Skipped" },
                    { color: colors.muted, label: "Not Visited" },
                    { color: colors.primary, label: "Current", outline: true },
                  ].map((item) => (
                    <View key={item.label} style={styles.legendItem}>
                      <View style={[
                        styles.legendDot,
                        {
                          backgroundColor: item.outline ? "transparent" : item.color,
                          borderColor: item.color,
                          borderWidth: item.outline ? 2 : 0,
                        }
                      ]} />
                      <Text style={[styles.legendText, { color: colors.mutedForeground, fontFamily: "Roboto_400Regular" }]}>
                        {item.label}
                      </Text>
                    </View>
                  ))}
                </View>

                <ScrollView style={styles.paletteGrid} contentContainerStyle={styles.paletteGridContent}>
                  <View style={styles.paletteButtons}>
                    {MOCK_QUESTIONS.map((q, idx) => {
                      const answered = answers[q.id] !== undefined || voiceAnswers[q.id] !== undefined;
                      const skipped = questionStatuses[q.id] === "skipped" && !answered;
                      const isCurrent = idx === currentIndex;

                      return (
                        <TouchableOpacity
                          key={q.id}
                          style={[
                            styles.paletteBtn2,
                            {
                              backgroundColor: answered
                                ? colors.primary
                                : skipped
                                ? "#FFB300"
                                : isCurrent
                                ? colors.secondary
                                : colors.muted,
                              borderColor: isCurrent ? colors.primary : "transparent",
                              borderWidth: isCurrent ? 2 : 0,
                            },
                          ]}
                          onPress={() => {
                            setCurrentIndex(idx);
                            closePalette();
                          }}
                        >
                          <Text style={[
                            styles.paletteNum,
                            {
                              color: answered ? "#fff" : skipped ? "#fff" : isCurrent ? colors.primary : colors.mutedForeground,
                              fontFamily: answered || isCurrent ? "Roboto_700Bold" : "Roboto_400Regular",
                            }
                          ]}>
                            {idx + 1}
                          </Text>
                          {q.type === "voice" && (
                            <View style={styles.voiceIndicator}>
                              <Ionicons name="mic" size={8} color={answered ? "#fff" : colors.primary} />
                            </View>
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </ScrollView>

                <View style={{ paddingHorizontal: 16, paddingBottom: insets.bottom + 8, paddingTop: 8 }}>
                  <TouchableOpacity
                    style={[styles.submitFromPalette, { backgroundColor: colors.success }]}
                    onPress={() => {
                      closePalette();
                      setTimeout(() => {
                        const pendingUploads = uploadingVoice.size;
                        const uploadNote = pendingUploads > 0
                          ? `\n\n⚠️ ${pendingUploads} voice answer${pendingUploads > 1 ? "s are" : " is"} still uploading. Please wait a moment.`
                          : "";
                        Alert.alert(
                          "Submit Exam",
                          `You have answered ${answeredCount} of ${MOCK_QUESTIONS.length} questions.\n\nAre you sure you want to submit?${uploadNote}`,
                          [
                            { text: "Cancel", style: "cancel" },
                            ...(pendingUploads === 0 ? [{ text: "Submit", style: "destructive" as const, onPress: () => submitExam("manual") }] : []),
                          ]
                        );
                      }, 400);
                    }}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#fff" />
                    <Text style={[styles.submitFromPaletteText, { fontFamily: "Roboto_700Bold" }]}>
                      Submit Exam
                    </Text>
                  </TouchableOpacity>
                </View>
              </Pressable>
            </Animated.View>
          </Pressable>
        </Modal>
      )}

      {warningVisible && (
        <Modal transparent animationType="none" visible={warningVisible} statusBarTranslucent>
          <Animated.View
            style={[
              styles.warningOverlay,
              {
                opacity: warningAnim,
                transform: [{ scale: warningAnim.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1] }) }],
              },
            ]}
          >
            <View style={[styles.warningCard, { backgroundColor: warningBg + "F0" }]}>
              <View style={styles.warningIconRow}>
                <View style={[styles.warningIconCircle, { backgroundColor: "rgba(255,255,255,0.2)" }]}>
                  <Ionicons name="warning" size={32} color="#fff" />
                </View>
              </View>

              <Text style={[styles.warningTitle, { fontFamily: "Roboto_700Bold" }]}>
                {warningType === "tab" ? "Tab Switch Detected!" :
                 warningType === "face" ? "Face Not Detected!" :
                 "Multiple Faces Detected!"}
              </Text>

              <Text style={[styles.warningMsg, { fontFamily: "Roboto_400Regular" }]}>
                {warningMessage}
              </Text>

              <View style={styles.violationDotsRow}>
                {Array.from({ length: VIOLATION_THRESHOLD }).map((_, i) => (
                  <View
                    key={i}
                    style={[
                      styles.violationDot,
                      { backgroundColor: i < violations ? "#fff" : "rgba(255,255,255,0.3)" },
                    ]}
                  />
                ))}
              </View>

              <Text style={[styles.violationCount, { fontFamily: "Roboto_700Bold" }]}>
                Violation {violations} of {VIOLATION_THRESHOLD}
              </Text>

              {violations < VIOLATION_THRESHOLD ? (
                <TouchableOpacity
                  style={styles.warningDismissBtn}
                  onPress={dismissWarning}
                  activeOpacity={0.85}
                >
                  <Text style={[styles.warningDismissText, { fontFamily: "Roboto_700Bold" }]}>
                    I Understand — Continue Exam
                  </Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.autoSubmitNote}>
                  <ActivityIndicatorSmall />
                  <Text style={[styles.autoSubmitText, { fontFamily: "Roboto_700Bold" }]}>
                    Auto-submitting exam...
                  </Text>
                </View>
              )}
            </View>
          </Animated.View>
        </Modal>
      )}
    </View>
  );
}

function ActivityIndicatorSmall() {
  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    Animated.loop(Animated.timing(anim, { toValue: 1, duration: 800, useNativeDriver: true })).start();
  }, []);
  return (
    <Animated.View style={{ opacity: anim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.3, 1, 0.3] }) }}>
      <Ionicons name="sync" size={18} color="#fff" />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingBottom: 10, gap: 10 },
  headerRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  headerLeft: { flex: 1, gap: 2 },
  examTitle: { fontSize: 15 },
  examSub: { fontSize: 12 },
  headerRight: { flexDirection: "row", gap: 8, alignItems: "center" },
  timerBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  timerText: { fontSize: 14 },
  violationBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
  },
  violationText: { fontSize: 13 },
  progressBar: { height: 4, borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 2 },

  mainContent: { flex: 1, position: "relative" },
  questionScroll: { flex: 1 },
  questionContent: { padding: 16, gap: 0 },
  questionCard: {
    borderRadius: 20,
    borderWidth: 1,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  questionMeta: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  qTypeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  qTypeText: { fontSize: 11, textTransform: "uppercase" },
  marksText: { fontSize: 12 },
  questionText: { fontSize: 18, lineHeight: 28 },
  imageContainer: {
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    overflow: "hidden",
  },
  questionImage: {
    width: "100%",
    height: "100%",
    borderRadius: 12,
  },
  imagePlaceholder: { fontSize: 13 },
  optionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  optionCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
  },
  optionDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#fff" },
  optionText: { flex: 1, fontSize: 15, lineHeight: 22 },
  voiceSection: { gap: 0 },
  voiceRecorder: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 16,
  },
  waveform: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    height: 44,
  },
  recordingTime: { fontSize: 20 },
  recordBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
  },
  recordBtnText: { color: "#fff", fontSize: 15 },
  voiceHint: { fontSize: 12 },
  voiceRecorded: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  voiceRecordedTitle: { fontSize: 14 },
  voiceRecordedSub: { fontSize: 12, marginTop: 2 },
  reRecordBtn: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },

  cameraOverlay: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 100,
    height: 80,
    borderRadius: 12,
    borderWidth: 2,
    overflow: "hidden",
  },
  miniCamera: { width: "100%", height: "100%" },
  cameraStatusDot: {
    position: "absolute",
    bottom: 6,
    right: 6,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  navBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  navBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1.5,
    flex: 1,
    justifyContent: "center",
  },
  navBtnText: { fontSize: 14 },
  paletteBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  paletteBtnText: { fontSize: 14 },

  paletteBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  paletteSheet: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
    maxHeight: SCREEN_HEIGHT * 0.7,
  },
  paletteHandle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#ddd", alignSelf: "center", marginTop: 12 },
  paletteHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, paddingTop: 12 },
  paletteTitle: { fontSize: 17 },
  paletteLegend: { flexDirection: "row", flexWrap: "wrap", gap: 12, paddingHorizontal: 16, paddingBottom: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 12, height: 12, borderRadius: 4 },
  legendText: { fontSize: 12 },
  paletteGrid: { maxHeight: 200 },
  paletteGridContent: { padding: 16, paddingTop: 0 },
  paletteButtons: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  paletteBtn2: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  paletteNum: { fontSize: 15 },
  voiceIndicator: { position: "absolute", top: 2, right: 2, backgroundColor: "#8A2BE2", borderRadius: 4, padding: 1 },
  submitFromPalette: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
  },
  submitFromPaletteText: { color: "#fff", fontSize: 15 },

  warningOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  warningCard: {
    width: "100%",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    gap: 16,
  },
  warningIconRow: { alignItems: "center" },
  warningIconCircle: { width: 72, height: 72, borderRadius: 36, alignItems: "center", justifyContent: "center" },
  warningTitle: { color: "#fff", fontSize: 20, textAlign: "center" },
  warningMsg: { color: "rgba(255,255,255,0.85)", fontSize: 14, textAlign: "center", lineHeight: 22 },
  violationDotsRow: { flexDirection: "row", gap: 10 },
  violationDot: { width: 12, height: 12, borderRadius: 6 },
  violationCount: { color: "#fff", fontSize: 13 },
  warningDismissBtn: {
    backgroundColor: "rgba(255,255,255,0.2)",
    paddingHorizontal: 24,
    paddingVertical: 13,
    borderRadius: 14,
    marginTop: 4,
  },
  warningDismissText: { color: "#fff", fontSize: 15 },
  autoSubmitNote: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 4 },
  autoSubmitText: { color: "#fff", fontSize: 15 },
});
