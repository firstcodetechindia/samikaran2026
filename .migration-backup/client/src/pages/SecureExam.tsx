import { Helmet } from "react-helmet-async";
import { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import type { Exam, Question } from "@shared/schema";
import { INDIAN_LANGUAGES, getLanguageByCode, DEFAULT_WARNING_LANGUAGES } from "@shared/constants";
import {
  Camera, Mic, Monitor, User, Users, CheckCircle2, XCircle, AlertTriangle,
  Loader2, Shield, Eye, Clock, ChevronRight, ChevronLeft,
  Maximize2, RefreshCw, Send, ArrowLeft, AlertCircle, Volume2, Wifi,
  Play, Square, X
} from "lucide-react";

type SystemCheckStatus = "pending" | "checking" | "passed" | "failed";
type ExamPhase = "system-check" | "rules" | "exam" | "review" | "submitted";
type QuestionStatus = "not-visited" | "visited" | "answered";

interface SystemCheck {
  id: string;
  name: string;
  description: string;
  icon: typeof Camera;
  status: SystemCheckStatus;
  required: boolean;
  errorMessage?: string;
}

interface Violation {
  id: number;
  type: string;
  message: string;
  time: string;
  severity: "low" | "medium" | "high" | "critical";
}

interface ProctoringWarningSettings {
  warningType: "voice" | "siren" | "both";
  countdownDuration: number;
  firstWarningTime: number;
  finalWarningTime: number;
  voiceLanguage: "english" | "hindi" | "both";
  voiceRate: number;
  voiceVolume: number;
  voicePitch: number;
  voiceRepeatInterval: number;
  fullscreenWarningEn: string;
  cameraWarningEn: string;
  multifaceWarningEn: string;
  autoSubmitWarningEn: string;
  finalWarningEn: string;
  fullscreenWarningHi: string;
  cameraWarningHi: string;
  multifaceWarningHi: string;
  autoSubmitWarningHi: string;
  finalWarningHi: string;
  fullscreenShortMsg: string;
  cameraShortMsg: string;
  multifaceShortMsg: string;
  sirenVolume: number;
  sirenFrequencyLow: number;
  sirenFrequencyHigh: number;
}

const defaultWarningSettings: ProctoringWarningSettings = {
  warningType: "voice",
  countdownDuration: 60,
  firstWarningTime: 20,
  finalWarningTime: 10,
  voiceLanguage: "both",
  voiceRate: 85,
  voiceVolume: 75,
  voicePitch: 100,
  voiceRepeatInterval: 15,
  fullscreenWarningEn: "Attention please. You have exited fullscreen mode. Please return to fullscreen immediately to continue your exam.",
  cameraWarningEn: "Attention please. Your face is not visible in camera. Please position yourself in front of the camera.",
  multifaceWarningEn: "Attention please. Multiple faces detected. Only one person is allowed during the exam.",
  autoSubmitWarningEn: "Warning. Your exam will be automatically submitted in {seconds} seconds. Please resolve the issue immediately.",
  finalWarningEn: "Final warning. {seconds} seconds remaining before auto submission.",
  fullscreenWarningHi: "Kripya dhyan dein. Aapne fullscreen mode se bahar nikle hain. Kripya turant fullscreen mein wapas aayein.",
  cameraWarningHi: "Kripya dhyan dein. Aapka chehra camera mein dikhai nahi de raha. Kripya camera ke saamne aayein.",
  multifaceWarningHi: "Kripya dhyan dein. Ek se zyada log dikhai de rahe hain. Exam ke dauran sirf ek vyakti allowed hai.",
  autoSubmitWarningHi: "Chetavani. Aapka exam {seconds} second mein automatically submit ho jayega. Kripya turant issue resolve karein.",
  finalWarningHi: "Antim chetavani. Auto submission mein {seconds} second bache hain.",
  fullscreenShortMsg: "Please return to fullscreen. Kripya fullscreen mein wapas aayein.",
  cameraShortMsg: "Please look at camera. Kripya camera ki taraf dekhein.",
  multifaceShortMsg: "Only one person allowed. Sirf ek vyakti allowed hai.",
  sirenVolume: 30,
  sirenFrequencyLow: 600,
  sirenFrequencyHigh: 800,
};

// Voice announcement system for critical violations - Indian Railway style
let voiceAnnouncementInterval: NodeJS.Timeout | null = null;
let currentUtterance: SpeechSynthesisUtterance | null = null;
let announcementPhase = 0;
let sirenOscillator: OscillatorNode | null = null;
let sirenContext: AudioContext | null = null;
let sirenInterval: NodeJS.Timeout | null = null;
let settingsRef: ProctoringWarningSettings = defaultWarningSettings;
let translationsRef: Record<string, any> = {}; // Store translations by language code

// Get warning messages from settings
const getWarningMessages = (warningType: "fullscreen" | "camera" | "multiface", settings: ProctoringWarningSettings = settingsRef) => {
  const messages = {
    fullscreen: {
      english: settings.fullscreenWarningEn || defaultWarningSettings.fullscreenWarningEn,
      hindi: settings.fullscreenWarningHi || defaultWarningSettings.fullscreenWarningHi,
      both: settings.fullscreenShortMsg || defaultWarningSettings.fullscreenShortMsg
    },
    camera: {
      english: settings.cameraWarningEn || defaultWarningSettings.cameraWarningEn,
      hindi: settings.cameraWarningHi || defaultWarningSettings.cameraWarningHi,
      both: settings.cameraShortMsg || defaultWarningSettings.cameraShortMsg
    },
    multiface: {
      english: settings.multifaceWarningEn || defaultWarningSettings.multifaceWarningEn,
      hindi: settings.multifaceWarningHi || defaultWarningSettings.multifaceWarningHi,
      both: settings.multifaceShortMsg || defaultWarningSettings.multifaceShortMsg
    }
  };
  return messages[warningType];
};

const speakWarning = (text: string, lang: string = "en-IN", settings: ProctoringWarningSettings = settingsRef) => {
  try {
    // Check if voice is enabled
    if (settings.warningType === "siren") return;
    
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = settings.voiceRate / 100;
      utterance.volume = settings.voiceVolume / 100;
      
      // Set pitch based on voice type selection
      // young_female: higher pitch (1.3), adult_female: normal (1.0), mature_female: lower (0.85)
      const voiceType = (settings as any).voiceType || "young_female";
      const pitchMap: Record<string, number> = {
        young_female: 1.3,
        adult_female: 1.0,
        mature_female: 0.85
      };
      utterance.pitch = pitchMap[voiceType] || 1.0;
      
      const voices = window.speechSynthesis.getVoices();
      const indianVoice = 
        voices.find(v => v.name.includes('Google हिन्दी') || v.name.includes('Google Hindi')) ||
        voices.find(v => v.name.includes('Heera') || v.name.includes('Hemant')) ||
        voices.find(v => v.lang === 'hi-IN') ||
        voices.find(v => v.lang === 'en-IN') ||
        voices.find(v => v.name.toLowerCase().includes('india')) ||
        voices.find(v => v.lang.includes('hi') || v.lang.includes('IN'));
      
      if (indianVoice) {
        utterance.voice = indianVoice;
        if (indianVoice.lang.includes('hi')) {
          utterance.lang = 'hi-IN';
        }
      }
      
      currentUtterance = utterance;
      window.speechSynthesis.speak(utterance);
    }
  } catch (e) {
    console.log("Speech synthesis not available");
  }
};

const startSiren = (settings: ProctoringWarningSettings = settingsRef) => {
  try {
    if (settings.warningType === "voice") return;
    stopSiren();
    
    sirenContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    sirenOscillator = sirenContext.createOscillator();
    const gainNode = sirenContext.createGain();
    
    sirenOscillator.connect(gainNode);
    gainNode.connect(sirenContext.destination);
    
    sirenOscillator.type = 'sawtooth';
    gainNode.gain.value = settings.sirenVolume / 100;
    sirenOscillator.frequency.value = settings.sirenFrequencyLow;
    sirenOscillator.start();
    
    let high = true;
    const freqLow = settings.sirenFrequencyLow;
    const freqHigh = settings.sirenFrequencyHigh;
    sirenInterval = setInterval(() => {
      if (sirenOscillator) {
        sirenOscillator.frequency.value = high ? freqHigh : freqLow;
        high = !high;
      }
    }, 300);
  } catch (e) {
    console.log("Siren not available");
  }
};

const stopSiren = () => {
  try {
    if (sirenInterval) {
      clearInterval(sirenInterval);
      sirenInterval = null;
    }
    if (sirenOscillator) {
      sirenOscillator.stop();
      sirenOscillator = null;
    }
    if (sirenContext) {
      sirenContext.close();
      sirenContext = null;
    }
  } catch (e) {
    // Ignore cleanup errors
  }
};

// Speak warning in a specific language using stored translations from database
const translateAndSpeak = async (warningType: "fullscreen" | "camera" | "multiface", langCode: string, settings: ProctoringWarningSettings) => {
  const lang = getLanguageByCode(langCode);
  if (!lang) {
    // Fallback to English
    const messages = getWarningMessages(warningType, settings);
    speakWarning(messages.english, "en-IN", settings);
    return;
  }
  
  // For English, just speak directly (English is the base language)
  if (langCode === "en") {
    const messages = getWarningMessages(warningType, settings);
    speakWarning(messages.english, "en-IN", settings);
    return;
  }
  
  // For other languages, use stored translations from database
  const translation = translationsRef[langCode];
  if (translation) {
    let textToSpeak = "";
    switch (warningType) {
      case "fullscreen":
        textToSpeak = translation.fullscreenWarning;
        break;
      case "camera":
        textToSpeak = translation.cameraWarning;
        break;
      case "multiface":
        textToSpeak = translation.multifaceWarning;
        break;
    }
    
    if (textToSpeak) {
      speakWarning(textToSpeak, lang.speechCode, settings);
      return;
    }
  }
  
  // Fallback to English if no translation available
  const messages = getWarningMessages(warningType, settings);
  speakWarning(messages.english, "en-IN", settings);
};

const startVoiceWarning = (
  warningType: "fullscreen" | "camera" | "multiface", 
  settings: ProctoringWarningSettings = settingsRef,
  examWarningLanguages: string[] = DEFAULT_WARNING_LANGUAGES
) => {
  try {
    stopVoiceWarning();
    
    // Start siren if enabled
    if (settings.warningType === "siren" || settings.warningType === "both") {
      startSiren(settings);
    }
    
    const messages = getWarningMessages(warningType, settings);
    announcementPhase = 0;
    
    // Determine which languages to use based on admin voiceLanguage setting
    let languages: string[];
    if (settings.voiceLanguage === "english") {
      // Admin set to English only
      languages = ["en"];
    } else if (settings.voiceLanguage === "hindi") {
      // Admin set to Hindi only
      languages = ["hi"];
    } else {
      // Admin set to "both" - use exam-specific languages if available
      languages = examWarningLanguages && examWarningLanguages.length > 0 
        ? examWarningLanguages 
        : DEFAULT_WARNING_LANGUAGES;
    }
    
    const totalLanguages = languages.length;
    
    // Speak first language immediately using database translations
    const firstLang = languages[0];
    if (firstLang === "en") {
      speakWarning(messages.english, "en-IN", settings);
    } else {
      // For all other languages, use stored translations from database
      translateAndSpeak(warningType, firstLang, settings);
    }
    
    // Repeat announcements cycling through all selected languages
    const repeatInterval = (settings.voiceRepeatInterval || 15) * 1000;
    voiceAnnouncementInterval = setInterval(() => {
      announcementPhase = (announcementPhase + 1) % totalLanguages;
      const currentLang = languages[announcementPhase];
      
      if (currentLang === "en") {
        speakWarning(messages.english, "en-IN", settings);
      } else {
        // For all other languages, use stored translations from database
        translateAndSpeak(warningType, currentLang, settings);
      }
    }, repeatInterval);
    
  } catch (e) {
    console.log("Voice warning not available");
  }
};

const stopVoiceWarning = () => {
  try {
    if (voiceAnnouncementInterval) {
      clearInterval(voiceAnnouncementInterval);
      voiceAnnouncementInterval = null;
    }
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    stopSiren();
    currentUtterance = null;
    announcementPhase = 0;
  } catch (e) {
    // Ignore errors during cleanup
  }
};

// Simple beep for minor warnings
const playViolationBeep = (type: "warning" | "critical" = "warning") => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    if (type === "critical") {
      // Urgent double beep for critical (tab switch)
      oscillator.frequency.value = 880;
      gainNode.gain.value = 0.3;
      oscillator.start();
      setTimeout(() => gainNode.gain.value = 0, 150);
      setTimeout(() => gainNode.gain.value = 0.3, 200);
      setTimeout(() => {
        gainNode.gain.value = 0;
        oscillator.stop();
        audioContext.close();
      }, 400);
    } else {
      // Single beep for warning
      oscillator.frequency.value = 660;
      gainNode.gain.value = 0.2;
      oscillator.start();
      setTimeout(() => {
        gainNode.gain.value = 0;
        oscillator.stop();
        audioContext.close();
      }, 200);
    }
  } catch (e) {
    console.log("Audio beep not available");
  }
};

export default function SecureExam() {
  const { examId, attemptId: urlAttemptId } = useParams<{ examId: string; attemptId: string }>();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeAttemptId, setActiveAttemptId] = useState<number | null>(urlAttemptId ? Number(urlAttemptId) : null);
  const [attemptReady, setAttemptReady] = useState(!!urlAttemptId);
  
  const [phase, setPhase] = useState<ExamPhase>("system-check");
  const [rulesAccepted, setRulesAccepted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [questionStatuses, setQuestionStatuses] = useState<Record<number, QuestionStatus>>({});
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [violations, setViolations] = useState<Violation[]>([]);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [submitConfirmText, setSubmitConfirmText] = useState("");
  const [checksCompleted, setChecksCompleted] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [showFullscreenWarning, setShowFullscreenWarning] = useState(false);
  const [showCameraWarning, setShowCameraWarning] = useState(false);
  const [examPaused, setExamPaused] = useState(false);
  const [cameraWarningMessage, setCameraWarningMessage] = useState("");
  const [retryingCamera, setRetryingCamera] = useState(false);
  const [showPermissionDialog, setShowPermissionDialog] = useState(false);
  const [permissionDialogResolved, setPermissionDialogResolved] = useState(false);
  const permissionResolveRef = useRef<(() => void) | null>(null);
  const [networkStatus, setNetworkStatus] = useState<{ speed: "slow" | "good" | "fast"; latency: number }>({ speed: "good", latency: 0 });
  const [cameraStatus, setCameraStatus] = useState<"ok" | "covered" | "frozen" | "no-face" | "multi-face">("ok");
  const [multiFaceWarning, setMultiFaceWarning] = useState(false);
  const [faceCount, setFaceCount] = useState(1);
  const [trustScore, setTrustScore] = useState(100);
  const [gazeWarning, setGazeWarning] = useState<string | null>(null);
  const [headPoseWarning, setHeadPoseWarning] = useState<string | null>(null);
  const [objectWarning, setObjectWarning] = useState<string | null>(null);
  const [warningCountdown, setWarningCountdown] = useState(60);
  const [criticalWarningActive, setCriticalWarningActive] = useState(false);
  const warningEndTimeRef = useRef<number>(0);
  const spokenWarningsRef = useRef<Set<number>>(new Set());
  const [warningSettings, setWarningSettings] = useState<ProctoringWarningSettings>(defaultWarningSettings);
  const lastCameraViolationRef = useRef(0);
  const lastObjectViolationRef = useRef(0);
  const lastMultiFaceViolationRef = useRef(0);
  const lastGazeViolationRef = useRef(0);
  const lastHeadTurnViolationRef = useRef(0);
  // Countdown timer is now managed by useEffect, no ref needed
  const autoSubmitTriggeredRef = useRef(false);
  const pausedTimeRef = useRef(0);
  const examPausedRef = useRef(false);
  const showCameraWarningRef = useRef(false);
  const examStartedRef = useRef(false);
  const currentExamIdRef = useRef<string | null>(null);
  const timeRemainingRef = useRef<number>(0);
  const trackCleanupRef = useRef<(() => void) | null>(null);
  const fallbackCountRef = useRef(0);
  const lastFallbackTimeRef = useRef(0);
  const snapshotCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const snapshotIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const examVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const checksRunRef = useRef(false);
  const violationCountRef = useRef(0);
  const lastLoudTimeRef = useRef(0);
  const lastSilentTimeRef = useRef(0);
  const lastFaceTimeRef = useRef(0);
  const lastViolationTimeByType = useRef<Record<string, number>>({});
  const VIOLATION_COOLDOWN_MS = 10000; // 10 seconds cooldown between same violation types
  
  // Face detection tolerance - allow brief head turns for reading
  const faceNotDetectedSinceRef = useRef<number | null>(null);
  const FACE_TOLERANCE_MS = 3000; // 3 seconds tolerance for brief head movements
  
  // Audio recording state for audio-type questions
  const [audioRecordings, setAudioRecordings] = useState<Record<number, { blob: Blob; url: string }>>({});
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioRecordingStreamRef = useRef<MediaStream | null>(null);
  
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([
    { id: "browser", name: "Browser Compatibility", description: "Checking browser support", icon: Monitor, status: "pending", required: true },
    { id: "security", name: "Security Check", description: "Checking for secure environment", icon: Shield, status: "pending", required: false },
    { id: "camera", name: "Camera Access", description: "Camera permission required", icon: Camera, status: "pending", required: true },
    { id: "microphone", name: "Microphone Access", description: "Microphone permission required", icon: Mic, status: "pending", required: true },
    { id: "face", name: "Face Detection", description: "Single face validation", icon: User, status: "pending", required: true },
  ]);

  const { data: exam, isLoading: examLoading } = useQuery<Exam>({
    queryKey: ["/api/exams", examId],
    enabled: !!examId,
  });

  const { data: questions = [] } = useQuery<Question[]>({
    queryKey: ["/api/exams", examId, "questions"],
    enabled: !!examId,
  });

  const createSessionMutation = useMutation({
    mutationFn: async (data: { attemptId: number; status: string }) => {
      const res = await apiRequest("POST", "/api/proctor/session", data);
      return res.json();
    },
    onSuccess: (data) => setSessionId(data.id),
  });

  const logEventMutation = useMutation({
    mutationFn: async (data: { sessionId: number; eventType: string; eventCode: string; severity: string; score: number; description: string }) => {
      return apiRequest("POST", "/api/proctor/event", data);
    },
  });

  const addViolation = useCallback((type: string, message: string, severity: Violation["severity"] = "medium") => {
    const now = Date.now();
    const lastTime = lastViolationTimeByType.current[type] || 0;
    
    // Smart deduplication: Skip if same violation type occurred within cooldown period
    if (now - lastTime < VIOLATION_COOLDOWN_MS) {
      return; // Silently skip duplicate violation
    }
    
    // Smart priority: When fullscreen warning is active, suppress face-related violations
    // Because if user is not in fullscreen, face detection violations are secondary
    const faceRelatedViolations = ["NO_FACE", "MULTI_FACE", "FACE_NOT_VISIBLE", "LOOKING_AWAY"];
    const fullscreenViolations = ["FULLSCREEN_EXIT", "FULLSCREEN_VIOLATION"];
    
    // Check if fullscreen violation happened recently (within 5 seconds)
    const lastFullscreenTime = Math.max(
      lastViolationTimeByType.current["FULLSCREEN_EXIT"] || 0,
      lastViolationTimeByType.current["FULLSCREEN_VIOLATION"] || 0
    );
    const isFullscreenActiveRecently = (now - lastFullscreenTime) < 5000;
    
    // If fullscreen issue is active and this is a face-related violation, skip it
    if (isFullscreenActiveRecently && faceRelatedViolations.includes(type)) {
      return; // Fullscreen takes priority - face violations suppressed
    }
    
    // Update last violation time for this type
    lastViolationTimeByType.current[type] = now;
    
    violationCountRef.current += 1;
    const newViolation: Violation = {
      id: now,
      type,
      message,
      time: new Date().toLocaleTimeString(),
      severity
    };
    setViolations(prev => [newViolation, ...prev]);
    
    if (sessionId) {
      const scoreMap = { low: 5, medium: 10, high: 15, critical: 25 };
      logEventMutation.mutate({
        sessionId,
        eventType: "violation",
        eventCode: type,
        severity,
        score: scoreMap[severity],
        description: message
      });
    }
  }, [sessionId, logEventMutation]);

  const warningSettingsRef = useRef(warningSettings);
  warningSettingsRef.current = warningSettings;
  const addViolationRef = useRef(addViolation);
  addViolationRef.current = addViolation;
  const criticalWarningActiveRef = useRef(false);
  const examRef = useRef(exam);
  examRef.current = exam;
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tickCountdown = useCallback(() => {
    if (!criticalWarningActiveRef.current || autoSubmitTriggeredRef.current) return;
    const remaining = Math.ceil((warningEndTimeRef.current - Date.now()) / 1000);
    const clamped = Math.max(0, remaining);
    setWarningCountdown(clamped);

    const currentWs = warningSettingsRef.current;
    const firstWarningTime = currentWs.firstWarningTime || 20;
    const finalWarningTime = currentWs.finalWarningTime || 10;

    if (clamped <= 0) {
      if (!autoSubmitTriggeredRef.current) {
        autoSubmitTriggeredRef.current = true;
        stopVoiceWarning();
        if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
        addViolationRef.current("AUTO_SUBMIT", "Exam auto-submitted due to unresolved critical violation", "critical");
        setPhase("submitted");
      }
      return;
    }

    if (clamped === firstWarningTime && !spokenWarningsRef.current.has(firstWarningTime)) {
      spokenWarningsRef.current.add(firstWarningTime);
      try {
        const msgEn = (currentWs.autoSubmitWarningEn || defaultWarningSettings.autoSubmitWarningEn).replace("{seconds}", String(firstWarningTime));
        const msgHi = (currentWs.autoSubmitWarningHi || defaultWarningSettings.autoSubmitWarningHi).replace("{seconds}", String(firstWarningTime));
        speakWarning(msgEn + " " + msgHi, "en-IN", currentWs);
      } catch (e) { /* ignore speech errors */ }
    }

    if (clamped === finalWarningTime && !spokenWarningsRef.current.has(finalWarningTime)) {
      spokenWarningsRef.current.add(finalWarningTime);
      try {
        const msgEn = (currentWs.finalWarningEn || defaultWarningSettings.finalWarningEn).replace("{seconds}", String(finalWarningTime));
        const msgHi = (currentWs.finalWarningHi || defaultWarningSettings.finalWarningHi).replace("{seconds}", String(finalWarningTime));
        speakWarning(msgEn + " " + msgHi, "en-IN", currentWs);
      } catch (e) { /* ignore speech errors */ }
    }
  }, []);

  const startCriticalWarning = useCallback((warningType: "fullscreen" | "camera" | "multiface") => {
    if (criticalWarningActiveRef.current || autoSubmitTriggeredRef.current) return;
    
    const ws = warningSettingsRef.current;
    const countdownDuration = ws.countdownDuration || 60;

    setCriticalWarningActive(true);
    criticalWarningActiveRef.current = true;
    warningEndTimeRef.current = Date.now() + countdownDuration * 1000;
    spokenWarningsRef.current.clear();
    setWarningCountdown(countdownDuration);

    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); }
    countdownIntervalRef.current = setInterval(tickCountdown, 500);

    const examLangs = (examRef.current?.warningLanguages as string[]) || DEFAULT_WARNING_LANGUAGES;
    try { startVoiceWarning(warningType, ws, examLangs); } catch (e) { /* ignore voice errors */ }
  }, [tickCountdown]);

  const stopCriticalWarning = useCallback(() => {
    stopVoiceWarning();
    setCriticalWarningActive(false);
    criticalWarningActiveRef.current = false;
    warningEndTimeRef.current = 0;
    if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    setWarningCountdown(warningSettingsRef.current.countdownDuration || 60);
  }, []);

  useEffect(() => {
    return () => {
      if (countdownIntervalRef.current) { clearInterval(countdownIntervalRef.current); countdownIntervalRef.current = null; }
    };
  }, []);

  const updateCheckStatus = useCallback((checkId: string, status: SystemCheckStatus, errorMessage?: string) => {
    setSystemChecks(prev => prev.map(check => 
      check.id === checkId ? { ...check, status, errorMessage } : check
    ));
  }, []);

  // Helper to bind track ended listeners with proper cleanup - defined before runSystemChecks
  const bindTrackListeners = useCallback((stream: MediaStream) => {
    // Clean up previous listeners
    if (trackCleanupRef.current) {
      trackCleanupRef.current();
      trackCleanupRef.current = null;
    }
    
    const videoTracks = stream.getVideoTracks();
    if (videoTracks.length === 0) return;
    
    const handleTrackEnded = () => {
      // Timer keeps running - camera revocation is a violation, not a pause reason
      showCameraWarningRef.current = true;
      setShowCameraWarning(true);
      setCameraWarningMessage("Camera access was revoked - please grant camera permission again");
      setCameraStatus("covered");
      setFaceDetected(false);
      addViolation("CAMERA_REVOKED", "Camera permission revoked during exam", "critical");
    };
    
    videoTracks.forEach(track => {
      track.addEventListener("ended", handleTrackEnded);
    });
    
    // Store cleanup function
    trackCleanupRef.current = () => {
      videoTracks.forEach(track => {
        track.removeEventListener("ended", handleTrackEnded);
      });
    };
  }, [addViolation]);

  const runSystemChecks = useCallback(async () => {
    setChecksCompleted(false);
    setSystemChecks(prev => prev.map(c => ({ ...c, status: "checking" as SystemCheckStatus, errorMessage: undefined })));
    
    await new Promise(r => setTimeout(r, 100));
    
    // Browser compatibility check - more lenient for PWA and mobile browsers
    const isPWA = window.matchMedia('(display-mode: standalone)').matches || 
                  (navigator as any).standalone === true ||
                  document.referrer.includes('android-app://');
    const hasMediaDevices = "mediaDevices" in navigator && "getUserMedia" in navigator.mediaDevices;
    const hasFullscreen = "requestFullscreen" in document.documentElement || 
                         "webkitRequestFullscreen" in document.documentElement ||
                         "mozRequestFullScreen" in document.documentElement;
    // For PWA, only require media devices; fullscreen is optional
    const browserOk = isPWA ? hasMediaDevices : (hasMediaDevices && hasFullscreen);
    updateCheckStatus("browser", browserOk ? "passed" : "failed", browserOk ? undefined : "Browser not supported");

    // Security check - detect VMs, screen recording, dev tools (warning only, not blocking)
    const securityWarnings: string[] = [];
    try {
      // Check for VM/emulator indicators - skip on mobile devices
      const nav = navigator as any;
      const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      const isVM = !isMobile && (
        /virtual|vmware|vbox|qemu|hyper-v/i.test(navigator.userAgent) ||
        (nav.hardwareConcurrency && nav.hardwareConcurrency < 2) ||
        (nav.deviceMemory && nav.deviceMemory < 2)
      );
      
      if (isVM) securityWarnings.push("Virtual machine detected");
      
      // Check for automation tools - ignore webdriver on mobile/PWA as it can be a false positive
      const hasAutomation = !isMobile && !isPWA && (
        (navigator as any).webdriver === true ||
        (window as any).callPhantom ||
        (window as any)._phantom ||
        (window as any).__nightmare
      );
      
      if (hasAutomation) securityWarnings.push("Automation tool detected");
      
      // Check for screen capture APIs being used
      const displayMediaSupport = 'getDisplayMedia' in navigator.mediaDevices;
      
      // Check canvas fingerprint blocking (privacy tools that might interfere)
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.fillText('test', 10, 10);
        const dataUrl = canvas.toDataURL();
        if (dataUrl === 'data:,') {
          securityWarnings.push("Canvas fingerprinting blocked");
        }
      }
      
      // Check for unusual window properties (screen sharing indicator)
      if (window.outerWidth - window.innerWidth > 200 || window.outerHeight - window.innerHeight > 200) {
        securityWarnings.push("Large browser chrome detected");
      }
      
      // Check battery API for virtualization hints (if available)
      if ('getBattery' in navigator) {
        try {
          const battery = await (navigator as any).getBattery();
          if (battery.charging && battery.level === 1 && battery.chargingTime === 0) {
            // Possibly VM or desktop with fake battery
          }
        } catch (e) {}
      }
      
      if (securityWarnings.length === 0) {
        updateCheckStatus("security", "passed");
      } else {
        // Pass with warning - don't block exam
        updateCheckStatus("security", "passed", `Note: ${securityWarnings[0]}`);
        console.log("Security warnings (non-blocking):", securityWarnings);
      }
    } catch (e) {
      updateCheckStatus("security", "passed"); // Don't block on error
    }

    let cameraOk = false;
    
    // Show branded permission dialog before browser request
    setShowPermissionDialog(true);
    await new Promise<void>((resolve) => {
      permissionResolveRef.current = resolve;
    });
    setShowPermissionDialog(false);
    
    try {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(t => t.stop());
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: true });
      streamRef.current = stream;
      
      // Bind track listeners for camera revocation detection
      bindTrackListeners(stream);
      
      setTimeout(() => {
        if (videoRef.current && streamRef.current) {
          videoRef.current.srcObject = streamRef.current;
          videoRef.current.play().catch(() => {});
        }
      }, 100);
      
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      analyser.fftSize = 256;
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      updateCheckStatus("camera", "passed");
      updateCheckStatus("microphone", "passed");
      cameraOk = true;
    } catch (err) {
      updateCheckStatus("camera", "failed", "Camera/Mic access denied");
      updateCheckStatus("microphone", "failed", "Microphone access denied");
    }

    if (cameraOk && videoRef.current) {
      // Wait for video to be ready
      await new Promise(r => setTimeout(r, 1500));
      
      // Capture frame and analyze for face detection
      const video = videoRef.current;
      if (video && video.readyState >= 2) {
        const canvas = document.createElement("canvas");
        canvas.width = 320;
        canvas.height = 240;
        const ctx = canvas.getContext("2d", { willReadFrequently: true });
        if (ctx) {
          ctx.drawImage(video, 0, 0, 320, 240);
          
          // First do client-side brightness check (critical - must pass first)
          const imgData = ctx.getImageData(0, 0, 320, 240);
          const data = imgData.data;
          let totalBrightness = 0;
          let colorVariance = 0;
          const samplePixels: number[] = [];
          
          for (let i = 0; i < data.length; i += 4) {
            const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
            totalBrightness += brightness;
            if (i % 16 === 0) {
              samplePixels.push(brightness);
            }
          }
          const avgBrightness = totalBrightness / (data.length / 4);
          
          // Calculate variance to detect uniform colors (covered camera)
          const mean = samplePixels.reduce((a, b) => a + b, 0) / samplePixels.length;
          colorVariance = samplePixels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samplePixels.length;
          
          // Check for covered camera (too dark or uniform color)
          if (avgBrightness < 40) {
            updateCheckStatus("face", "failed", "Camera appears to be covered - too dark");
            setFaceDetected(false);
          } else if (colorVariance < 150) {
            updateCheckStatus("face", "failed", "Camera shows uniform color - possible obstruction");
            setFaceDetected(false);
          } else {
            // Camera is not covered, now try face detection via proctoring service
            const imageDataUrl = canvas.toDataURL("image/jpeg", 0.8);
            
            try {
              const response = await fetch("/api/proctor/analyze-frame", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  image: imageDataUrl,
                  user_id: "system-check",
                  exam_id: examId || "unknown",
                  timestamp: new Date().toISOString(),
                  context: "system-check"
                })
              });
              
              if (response.ok) {
                const result = await response.json();
                
                // Check face_detected - fallback now also returns false
                if (result.face_detected) {
                  updateCheckStatus("face", "passed");
                  setFaceDetected(true);
                } else {
                  const isFallback = result.message && result.message.includes("fallback");
                  const errorMsg = isFallback 
                    ? "Proctoring service unavailable - please try again"
                    : "No face detected - please position your face in frame";
                  updateCheckStatus("face", "failed", errorMsg);
                  setFaceDetected(false);
                }
              } else {
                // API error - fail the check
                updateCheckStatus("face", "failed", "Proctoring service error - please try again");
                setFaceDetected(false);
              }
            } catch (e) {
              // Network error - fail the check
              updateCheckStatus("face", "failed", "Connection error - please check your network");
              setFaceDetected(false);
            }
          }
        } else {
          updateCheckStatus("face", "failed", "Failed to capture frame");
        }
      } else {
        updateCheckStatus("face", "failed", "Video not ready");
      }
    } else {
      updateCheckStatus("face", "failed", "Camera required for face detection");
    }
    
    setChecksCompleted(true);
  }, [updateCheckStatus, examId, bindTrackListeners]);

  useEffect(() => {
    if (phase !== "system-check" || checksRunRef.current) return;
    checksRunRef.current = true;
    runSystemChecks();
  }, [phase, runSystemChecks]);

  // Fetch admin-configured proctoring warning settings and translations
  useEffect(() => {
    const fetchWarningSettings = async () => {
      try {
        // Fetch settings and translations in parallel
        const [settingsRes, translationsRes] = await Promise.all([
          fetch("/api/proctoring-warning-settings"),
          fetch("/api/proctoring-warning-translations")
        ]);
        
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          // Merge with defaults to ensure all fields are present
          const mergedSettings: ProctoringWarningSettings = {
            ...defaultWarningSettings,
            ...data,
          };
          setWarningSettings(mergedSettings);
          settingsRef = mergedSettings;
          if (!criticalWarningActiveRef.current) {
            setWarningCountdown(mergedSettings.countdownDuration || 60);
          }
        } else {
          console.warn("Failed to fetch warning settings, using defaults");
          setWarningSettings(defaultWarningSettings);
          settingsRef = defaultWarningSettings;
        }
        
        // Store translations by language code
        if (translationsRes.ok) {
          const translationsData = await translationsRes.json();
          translationsRef = {};
          translationsData.forEach((t: any) => {
            translationsRef[t.languageCode] = t;
          });
        }
      } catch (e) {
        console.warn("Error fetching warning settings, using defaults:", e);
        setWarningSettings(defaultWarningSettings);
        settingsRef = defaultWarningSettings;
      }
    };
    fetchWarningSettings();
  }, []);

  const handleRetry = useCallback(() => {
    checksRunRef.current = false;
    runSystemChecks();
  }, [runSystemChecks]);

  // Audio monitoring and violation detection during exam
  // Smart voice detection - detects actual talking, ignores breathing and ambient noise
  useEffect(() => {
    if (phase !== "exam" || !analyserRef.current) return;
    
    let silentFrames = 0;
    let voiceDetectedFrames = 0; // Track consecutive frames with voice
    const SILENT_THRESHOLD = 5;
    const VOICE_LEVEL_THRESHOLD = 40; // Minimum voice frequency level
    const OVERALL_LEVEL_THRESHOLD = 25; // Minimum overall audio level (breathing is usually < 20)
    const VOICE_FRAMES_REQUIRED = 5; // Require ~500ms of sustained voice
    const VIOLATION_COOLDOWN = 20000; // 20 seconds between same type violations
    
    const updateAudio = () => {
      if (!analyserRef.current) return;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      // Overall average for display
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      const level = Math.min(100, avg * 2);
      setAudioLevel(level);
      
      // Voice frequency analysis - human speech has energy across multiple frequency bands
      // Bins 1-5: Low voice fundamentals (~170-860Hz)
      // Bins 5-15: Mid voice formants (~860-2580Hz) 
      // Bins 15-25: High voice harmonics (~2580-4300Hz)
      const lowVoiceBins = dataArray.slice(1, 5);
      const midVoiceBins = dataArray.slice(5, 15);
      const highVoiceBins = dataArray.slice(15, 25);
      
      const lowVoiceAvg = lowVoiceBins.reduce((a, b) => a + b, 0) / lowVoiceBins.length;
      const midVoiceAvg = midVoiceBins.reduce((a, b) => a + b, 0) / midVoiceBins.length;
      const highVoiceAvg = highVoiceBins.reduce((a, b) => a + b, 0) / highVoiceBins.length;
      
      // Voice has a characteristic pattern: strong mid frequencies with some low and high
      // Breathing is mostly low frequency only with very little mid/high
      const voiceScore = (midVoiceAvg * 2 + lowVoiceAvg + highVoiceAvg) / 4;
      const voiceLevel = Math.min(100, voiceScore);
      
      // Check for voice-like pattern: mid frequencies should be prominent
      // and overall level should be above breathing threshold
      const hasMidFrequencyContent = midVoiceAvg > 30;
      const isAboveBreathingLevel = level > OVERALL_LEVEL_THRESHOLD;
      const hasVoicePattern = voiceLevel > VOICE_LEVEL_THRESHOLD;
      
      const isVoiceLike = hasMidFrequencyContent && isAboveBreathingLevel && hasVoicePattern;
      
      const now = Date.now();
      
      if (isVoiceLike) {
        voiceDetectedFrames++;
        // Only trigger violation after sustained voice detection
        // Skip violation if student is recording an audio answer (voice is expected)
        const isOnAudioQuestion = currentQuestion?.type === "audio" || (currentQuestion as any)?.isVoiceEnabled;
        if (voiceDetectedFrames >= VOICE_FRAMES_REQUIRED && 
            now - lastLoudTimeRef.current > VIOLATION_COOLDOWN &&
            !(isOnAudioQuestion && isRecordingAudio)) {
          lastLoudTimeRef.current = now;
          voiceDetectedFrames = 0;
          addViolation("AUDIO_VIOLATION", "Audio violation detected - talking detected", "medium");
          toast({ title: "Warning", description: "Voice/talking detected", variant: "destructive" });
        }
      } else {
        // Gradually decrease counter when no voice detected
        if (voiceDetectedFrames > 0) {
          voiceDetectedFrames--;
        }
      }
      
      // Track silent frames (mic disconnected or muted)
      if (level < SILENT_THRESHOLD) {
        silentFrames++;
        if (silentFrames > 300 && now - lastSilentTimeRef.current > VIOLATION_COOLDOWN) {
          lastSilentTimeRef.current = now;
          silentFrames = 0;
          addViolation("MIC_SILENT", "Microphone appears muted or disconnected", "high");
          toast({ title: "Warning", description: "Microphone issue detected", variant: "destructive" });
        }
      } else {
        silentFrames = 0;
      }
    };
    
    const interval = setInterval(updateAudio, 100);
    return () => clearInterval(interval);
  }, [phase, addViolation, toast]);

  // Real-time camera monitoring during exam - runs continuously like other violation detectors
  const cameraCheckActiveRef = useRef<boolean>(false);
  
  useEffect(() => {
    if (phase !== "exam") {
      cameraCheckActiveRef.current = false;
      return;
    }
    
    const CAMERA_CHECK_INTERVAL = 2000; // Check every 2 seconds for real-time detection
    const VIOLATION_COOLDOWN = 10000; // 10 seconds between same violations
    cameraCheckActiveRef.current = true;
    
    const canvas = document.createElement("canvas");
    canvas.width = 320;
    canvas.height = 240;
    const ctx = canvas.getContext("2d");
    
    const checkCamera = async () => {
      if (!cameraCheckActiveRef.current) return;
      
      const video = examVideoRef.current;
      if (!video || !ctx || video.readyState < 2) {
        return;
      }
      
      // Capture frame
      ctx.drawImage(video, 0, 0, 320, 240);
      const imageDataObj = ctx.getImageData(0, 0, 320, 240);
      const data = imageDataObj.data;
      
      // Calculate brightness and variance for local detection
      let totalBrightness = 0;
      const samplePixels: number[] = [];
      
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
        if (i % 16 === 0) samplePixels.push(brightness);
      }
      
      const avgBrightness = totalBrightness / (data.length / 4);
      const mean = samplePixels.reduce((a, b) => a + b, 0) / samplePixels.length;
      const variance = samplePixels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samplePixels.length;
      
      const now = Date.now();
      const timeSinceLastCameraViolation = now - lastCameraViolationRef.current;
      const timeSinceLastMultiFaceViolation = now - lastMultiFaceViolationRef.current;
      
      // Camera covered detection (brightness < 40 or variance < 150)
      if (avgBrightness < 40 || variance < 150) {
        setCameraStatus("covered");
        setFaceDetected(false);
        setMultiFaceWarning(false);
        
        // Show warning immediately and persistently - timer keeps running
        const violationType = avgBrightness < 40 ? "Camera covered or blocked" : "Camera obstructed";
        showCameraWarningRef.current = true;
        setShowCameraWarning(true);
        setCameraWarningMessage(avgBrightness < 40 
          ? "Camera appears to be covered or blocked" 
          : "Camera shows uniform color - possible obstruction");
        
        // Log violation with cooldown
        if (timeSinceLastCameraViolation > VIOLATION_COOLDOWN) {
          lastCameraViolationRef.current = now;
          addViolation("CAMERA_BLOCKED", violationType, "critical");
          toast({ title: "Warning", description: violationType, variant: "destructive" });
        }
      } else {
        // Camera not covered - check for face/multi-face via proctoring service
        try {
          const imageData = canvas.toDataURL("image/jpeg", 0.7);
          const response = await fetch("/api/proctor/analyze-frame", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              image: imageData,
              user_id: urlAttemptId || "unknown",
              exam_id: examId || "unknown",
              timestamp: new Date().toISOString(),
              context: "exam"
            })
          });
          
          if (response.ok) {
            const result = await response.json();
            
            // Update trust score from AI proctoring
            if (result.trust_score !== undefined) {
              setTrustScore(Math.round(result.trust_score));
            }
            
            // Handle gaze tracking warnings — log violation with cooldown
            if (result.eye_gaze?.detected && !result.eye_gaze?.looking_at_screen) {
              const gazeDir = result.eye_gaze.direction || 'away';
              setGazeWarning(`Looking ${gazeDir}`);
              const GAZE_VIOLATION_COOLDOWN = 15000;
              const timeSinceLastGaze = now - (lastGazeViolationRef.current || 0);
              if (timeSinceLastGaze > GAZE_VIOLATION_COOLDOWN) {
                lastGazeViolationRef.current = now;
                addViolation("LOOKING_AWAY", `Eyes looking ${gazeDir}`, "medium");
              }
            } else {
              setGazeWarning(null);
            }
            
            // Handle head pose warnings — log violation with cooldown
            if (result.head_pose?.detected && !result.head_pose?.facing_camera) {
              const headDir = result.head_pose.direction || 'Head turned';
              setHeadPoseWarning(headDir);
              const HEAD_VIOLATION_COOLDOWN = 10000;
              const timeSinceLastHead = now - (lastHeadTurnViolationRef.current || 0);
              if (timeSinceLastHead > HEAD_VIOLATION_COOLDOWN) {
                lastHeadTurnViolationRef.current = now;
                addViolation("HEAD_TURN", `Head movement detected: ${headDir}`, "medium");
                toast({ title: "Head Movement Warning", description: "Please face the camera directly", variant: "destructive" });
              }
            } else {
              setHeadPoseWarning(null);
            }
            
            // Handle suspicious object detection (non-blocking, warning + violation log)
            const OBJECT_VIOLATION_COOLDOWN = 30000; // 30 second cooldown
            const timeSinceLastObjectViolation = now - lastObjectViolationRef.current;
            if (result.suspicious_objects && result.suspicious_objects.length > 0) {
              const detectedObjects = result.suspicious_objects.map((o: { object_type: string }) => o.object_type).join(', ');
              setObjectWarning(`Suspicious: ${detectedObjects}`);
              
              // Log violation with cooldown
              if (timeSinceLastObjectViolation > OBJECT_VIOLATION_COOLDOWN) {
                lastObjectViolationRef.current = now;
                addViolation("SUSPICIOUS_OBJECT", `Suspicious object detected: ${detectedObjects}`, "high");
                toast({ title: "Suspicious Object Detected", description: `Detected: ${detectedObjects}`, variant: "destructive" });
              }
            } else {
              setObjectWarning(null);
            }
            
            // Multi-face detection - show warning immediately, no cooldown for the warning itself
            if (result.has_multiple_faces || result.face_count > 1) {
              setCameraStatus("multi-face");
              setFaceDetected(true);
              setFaceCount(result.face_count || 2);
              setMultiFaceWarning(true);
              startCriticalWarning("multiface"); // Start voice warning for multi-face
              
              // Log violation with cooldown
              if (timeSinceLastMultiFaceViolation > VIOLATION_COOLDOWN) {
                lastMultiFaceViolationRef.current = now;
                addViolation("MULTIPLE_FACES", `Multiple faces detected (${result.face_count})`, "critical");
                toast({ title: "Multiple Faces Detected", description: "Only one person is allowed during the exam", variant: "destructive" });
              }
              
              // Dismiss camera covered warning, show multi-face instead
              if (showCameraWarningRef.current) {
                showCameraWarningRef.current = false;
                setShowCameraWarning(false);
                setCameraWarningMessage("");
              }
            } else if (!result.face_detected) {
              // No face detected - use tolerance for brief head turns (reading)
              
              // Start tracking when face first went missing
              if (faceNotDetectedSinceRef.current === null) {
                faceNotDetectedSinceRef.current = now;
              }
              
              const faceGoneDuration = now - faceNotDetectedSinceRef.current;
              
              // Only trigger warnings after tolerance period (3 seconds)
              // Brief head turns for reading are allowed
              if (faceGoneDuration >= FACE_TOLERANCE_MS) {
                setCameraStatus("no-face");
                setFaceDetected(false);
                setMultiFaceWarning(false);
                startCriticalWarning("camera"); // Start voice warning for no face
                
                showCameraWarningRef.current = true;
                setShowCameraWarning(true);
                setCameraWarningMessage("No face detected - please position yourself in front of the camera");
                
                if (timeSinceLastCameraViolation > VIOLATION_COOLDOWN) {
                  lastCameraViolationRef.current = now;
                  addViolation("NO_FACE", "No face detected in camera", "high");
                }
              }
              // Within tolerance - just show gentle reminder without violation
              else {
                setFaceDetected(false);
                setCameraStatus("warning");
                // Don't trigger critical warning or violation yet
              }
            } else {
              // Single face detected, everything OK
              setCameraStatus("ok");
              setFaceDetected(true);
              setFaceCount(1);
              setMultiFaceWarning(false);
              // Reset multi-face violation ref so future violations can be logged
              lastMultiFaceViolationRef.current = 0;
              
              // Reset face tolerance timer - face is back
              faceNotDetectedSinceRef.current = null;
              
              // Stop siren and auto-dismiss warnings when face detected - exam resumes automatically
              stopCriticalWarning();
              if (showCameraWarningRef.current) {
                showCameraWarningRef.current = false;
                setShowCameraWarning(false);
                setCameraWarningMessage("");
              }
            }
          }
        } catch {
          // Network error - keep existing warnings, don't silently dismiss
          // Local brightness/variance check already passed, so basic camera is working
          // Just don't make any changes - maintain current warning state
        }
      }
    };
    
    // Start immediately and run continuously
    const intervalId = setInterval(checkCamera, CAMERA_CHECK_INTERVAL);
    setTimeout(checkCamera, 500);
    
    return () => {
      cameraCheckActiveRef.current = false;
      clearInterval(intervalId);
    };
  }, [phase, addViolation, toast, urlAttemptId, examId]);

  // Network speed monitoring during exam
  useEffect(() => {
    if (phase !== "exam") return;
    
    const checkNetwork = async () => {
      try {
        const start = Date.now();
        await fetch("/api/health", { method: "GET", cache: "no-store" });
        const latency = Date.now() - start;
        
        let speed: "slow" | "good" | "fast" = "good";
        if (latency < 100) speed = "fast";
        else if (latency > 500) speed = "slow";
        
        setNetworkStatus({ speed, latency });
      } catch {
        setNetworkStatus({ speed: "slow", latency: 9999 });
      }
    };
    
    checkNetwork();
    const interval = setInterval(checkNetwork, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, [phase]);

  // Attach stream to exam video when entering exam phase
  useEffect(() => {
    if (phase === "exam" && streamRef.current) {
      const attachStream = () => {
        if (examVideoRef.current && streamRef.current) {
          examVideoRef.current.srcObject = streamRef.current;
          examVideoRef.current.onloadedmetadata = () => {
            examVideoRef.current?.play().catch(() => {});
          };
        }
      };
      // Try immediately and after a short delay
      attachStream();
      const timer = setTimeout(attachStream, 500);
      return () => clearTimeout(timer);
    }
  }, [phase]);

  // Monitor camera track for permission revocation during exam
  useEffect(() => {
    if (phase !== "exam" || !streamRef.current) return;
    
    bindTrackListeners(streamRef.current);
    
    return () => {
      if (trackCleanupRef.current) {
        trackCleanupRef.current();
        trackCleanupRef.current = null;
      }
    };
  }, [phase, bindTrackListeners]);

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach(t => t.stop());
      if (audioContextRef.current && audioContextRef.current.state !== "closed") {
        audioContextRef.current.close().catch(() => {});
      }
    };
  }, []);

  // Security handlers during exam with fullscreen re-enforcement
  useEffect(() => {
    if (phase !== "exam") return;

    const reenterFullscreen = async () => {
      try {
        if (!document.fullscreenElement) {
          await document.documentElement.requestFullscreen();
        }
      } catch (e) {
        // Fullscreen request denied
      }
    };
    
    const handlers = {
      fullscreen: () => {
        if (!document.fullscreenElement) {
          addViolation("FULLSCREEN_EXIT", "Exited full screen mode", "critical");
          setShowFullscreenWarning(true);
          startCriticalWarning("fullscreen"); // Start voice warning for fullscreen exit
        } else {
          setShowFullscreenWarning(false);
          stopCriticalWarning(); // Stop siren when fullscreen restored
        }
      },
      visibility: () => {
        if (document.hidden) {
          addViolation("TAB_SWITCH", "Switched browser tab", "high");
          toast({ title: "Warning", description: "Tab switch detected", variant: "destructive" });
          playViolationBeep("critical"); // Critical double beep for tab switch
        }
      },
      blur: () => {
        addViolation("WINDOW_BLUR", "Window focus lost", "medium");
        toast({ title: "Warning", description: "Window focus lost", variant: "destructive" });
        playViolationBeep("warning"); // Single beep for window blur
      },
      copy: (e: ClipboardEvent) => {
        e.preventDefault();
        addViolation("COPY_ATTEMPT", "Attempted to copy", "low");
      },
      paste: (e: ClipboardEvent) => {
        e.preventDefault();
        addViolation("PASTE_ATTEMPT", "Attempted to paste", "medium");
      },
      contextmenu: (e: MouseEvent) => {
        e.preventDefault();
        addViolation("RIGHT_CLICK", "Right-click blocked", "low");
      },
      keydown: (e: KeyboardEvent) => {
        // Block ESC completely
        if (e.key === "Escape") {
          e.preventDefault();
          e.stopPropagation();
          addViolation("ESC_BLOCKED", "ESC key blocked", "low");
          return false;
        }
        // Block view source (Ctrl+U)
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "u") {
          e.preventDefault();
          e.stopPropagation();
          addViolation("VIEW_SOURCE_BLOCKED", "View source attempt blocked", "medium");
          return false;
        }
        // Block dev tools (Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C, F12)
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && ["i", "j", "c"].includes(e.key.toLowerCase())) {
          e.preventDefault();
          e.stopPropagation();
          addViolation("DEVTOOLS_BLOCKED", "Developer tools attempt blocked", "high");
          return false;
        }
        if (e.key === "F12") {
          e.preventDefault();
          e.stopPropagation();
          addViolation("DEVTOOLS_BLOCKED", "Developer tools attempt blocked", "high");
          return false;
        }
        // Block common shortcuts
        if ((e.ctrlKey || e.metaKey) && ["c", "v", "a", "p", "s", "f"].includes(e.key.toLowerCase())) {
          e.preventDefault();
          addViolation("KEYBOARD_SHORTCUT", `Blocked: Ctrl+${e.key.toUpperCase()}`, "low");
        }
        // Block Alt+Tab simulation
        if (e.altKey && e.key === "Tab") {
          e.preventDefault();
          addViolation("ALT_TAB", "Alt+Tab blocked", "medium");
        }
      }
    };

    document.addEventListener("fullscreenchange", handlers.fullscreen);
    document.addEventListener("visibilitychange", handlers.visibility);
    window.addEventListener("blur", handlers.blur);
    document.addEventListener("copy", handlers.copy);
    document.addEventListener("paste", handlers.paste);
    document.addEventListener("contextmenu", handlers.contextmenu);
    document.addEventListener("keydown", handlers.keydown, true);

    return () => {
      document.removeEventListener("fullscreenchange", handlers.fullscreen);
      document.removeEventListener("visibilitychange", handlers.visibility);
      window.removeEventListener("blur", handlers.blur);
      document.removeEventListener("copy", handlers.copy);
      document.removeEventListener("paste", handlers.paste);
      document.removeEventListener("contextmenu", handlers.contextmenu);
      document.removeEventListener("keydown", handlers.keydown, true);
    };
  }, [phase, addViolation, toast, startCriticalWarning, stopCriticalWarning]);

  // Timer - use ref to track time and only init once per exam attempt
  useEffect(() => {
    if (phase !== "exam" || !exam) return;
    
    // Reset refs if this is a different exam
    if (currentExamIdRef.current !== examId) {
      examStartedRef.current = false;
      timeRemainingRef.current = 0;
      currentExamIdRef.current = examId || null;
    }
    
    // Only initialize time on first exam entry for this specific exam
    if (!examStartedRef.current) {
      const initialTime = exam.durationMinutes * 60;
      timeRemainingRef.current = initialTime;
      setTimeRemaining(initialTime);
      examStartedRef.current = true;
    } else {
      // Restore from ref on re-entry
      setTimeRemaining(timeRemainingRef.current);
    }
    
    const timer = setInterval(() => {
      // Timer NEVER pauses - violations are logged but don't stop the clock
      timeRemainingRef.current -= 1;
      const newTime = timeRemainingRef.current;
      
      if (newTime <= 0) {
        clearInterval(timer);
        setTimeRemaining(0);
        handleAutoSubmit();
        return;
      }
      
      setTimeRemaining(newTime);
    }, 1000);
    
    return () => {
      clearInterval(timer);
    };
  }, [phase, exam, examId]);

  const allRequiredChecksPassed = checksCompleted && systemChecks.filter(c => c.required).every(c => c.status === "passed");

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const getTimeStatus = () => {
    if (timeRemaining < 300) return { label: "Ending Soon", color: "bg-red-500" };
    if (timeRemaining < 600) return { label: "Running", color: "bg-amber-500" };
    return { label: "Running", color: "bg-green-500" };
  };

  // Camera retry handler - verify face before resuming exam
  const handleCameraRetry = async () => {
    if (!examVideoRef.current) return;
    setRetryingCamera(true);
    
    try {
      const video = examVideoRef.current;
      
      // Check if camera stream is still active
      if (!streamRef.current || streamRef.current.getVideoTracks().length === 0) {
        // Try to re-acquire camera
        try {
          const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
          streamRef.current = newStream;
          video.srcObject = newStream;
          
          // Re-bind track listeners using the helper (handles cleanup automatically)
          bindTrackListeners(newStream);
          
          await new Promise(r => setTimeout(r, 1500));
        } catch (e) {
          toast({ title: "Camera Error", description: "Could not access camera. Please check permissions.", variant: "destructive" });
          setRetryingCamera(false);
          return;
        }
      }
      
      // Wait for video to be ready
      await new Promise(r => setTimeout(r, 500));
      
      if (video.readyState < 2) {
        toast({ title: "Camera Error", description: "Camera not ready. Please try again.", variant: "destructive" });
        setRetryingCamera(false);
        return;
      }
      
      // Capture and analyze frame
      const canvas = document.createElement("canvas");
      canvas.width = 320;
      canvas.height = 240;
      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) {
        setRetryingCamera(false);
        return;
      }
      
      ctx.drawImage(video, 0, 0, 320, 240);
      
      // Client-side brightness check
      const imgData = ctx.getImageData(0, 0, 320, 240);
      const data = imgData.data;
      let totalBrightness = 0;
      const samplePixels: number[] = [];
      
      for (let i = 0; i < data.length; i += 4) {
        const brightness = (data[i] + data[i + 1] + data[i + 2]) / 3;
        totalBrightness += brightness;
        if (i % 16 === 0) samplePixels.push(brightness);
      }
      const avgBrightness = totalBrightness / (data.length / 4);
      const mean = samplePixels.reduce((a, b) => a + b, 0) / samplePixels.length;
      const variance = samplePixels.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / samplePixels.length;
      
      if (avgBrightness < 40) {
        toast({ title: "Camera Blocked", description: "Camera still appears to be covered", variant: "destructive" });
        setRetryingCamera(false);
        return;
      }
      
      if (variance < 150) {
        toast({ title: "Camera Issue", description: "Camera shows uniform color - please uncover it", variant: "destructive" });
        setRetryingCamera(false);
        return;
      }
      
      // Camera looks good, verify face via proctoring service
      const imageData = canvas.toDataURL("image/jpeg", 0.8);
      
      try {
        const response = await fetch("/api/proctor/analyze-frame", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            image: imageData,
            user_id: urlAttemptId || "unknown",
            exam_id: examId || "unknown",
            timestamp: new Date().toISOString(),
            context: "exam"
          })
        });
        
        if (response.ok) {
          const result = await response.json();
          const isFallback = result.message && result.message.includes("fallback");
          
          if (!result.face_detected) {
            const message = isFallback 
              ? "Proctoring service unavailable - please try again"
              : "Please position your face in front of the camera";
            toast({ title: "Face Not Detected", description: message, variant: "destructive" });
            setRetryingCamera(false);
            return;
          }
        }
      } catch (e) {
        // Network error - treat as failure
        toast({ title: "Connection Error", description: "Could not verify face - please try again", variant: "destructive" });
        setRetryingCamera(false);
        return;
      }
      
      // All checks passed - dismiss warning (timer never paused)
      setCameraStatus("ok");
      setFaceDetected(true);
      showCameraWarningRef.current = false;
      setShowCameraWarning(false);
      toast({ title: "Camera Verified", description: "Warning dismissed", variant: "default" });
      
    } finally {
      setRetryingCamera(false);
    }
  };

  const handleStartExam = async () => {
    const isPWAMode = window.matchMedia('(display-mode: standalone)').matches || 
                      (navigator as any).standalone === true ||
                      document.referrer.includes('android-app://');
    
    if (!isPWAMode) {
      try {
        await document.documentElement.requestFullscreen();
        setIsFullScreen(true);
      } catch {
        toast({ title: "Full-screen required", description: "Please allow full-screen mode", variant: "destructive" });
        return;
      }
    } else {
      setIsFullScreen(true);
    }
    
    try {
      const res = await apiRequest("POST", "/api/attempts/start", { examId: Number(examId) });
      const attempt = await res.json();
      setActiveAttemptId(attempt.id);
      setAttemptReady(true);

      createSessionMutation.mutate({ attemptId: attempt.id, status: "active" });

      await queryClient.invalidateQueries({ queryKey: ["/api/exams", examId, "questions"] });
      await queryClient.refetchQueries({ queryKey: ["/api/exams", examId, "questions"] });
    } catch (err: any) {
      if (err.message && !err.message.includes("already")) {
        toast({ title: "Failed to start exam", description: err.message, variant: "destructive" });
        return;
      }
      setAttemptReady(true);
      await queryClient.invalidateQueries({ queryKey: ["/api/exams", examId, "questions"] });
      await queryClient.refetchQueries({ queryKey: ["/api/exams", examId, "questions"] });
    }
    
    setPhase("exam");
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const warmup = new SpeechSynthesisUtterance("");
        warmup.volume = 0;
        window.speechSynthesis.speak(warmup);
        window.speechSynthesis.cancel();
      }
    } catch (e) {}
  };

  const handleSelectAnswer = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
    setQuestionStatuses(prev => ({ ...prev, [questionId]: "answered" }));
    if (activeAttemptId) {
      apiRequest("POST", `/api/attempts/${activeAttemptId}/answer`, {
        questionId,
        selectedOption: answer,
      }).catch(e => console.error("Save answer error:", e));
    }
  };

  // Audio recording functions for audio-type questions
  const getSupportedAudioMimeType = (): string => {
    const types = ['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg', ''];
    for (const type of types) {
      if (type === '' || MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startAudioRecording = async (questionId: number) => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      audioRecordingStreamRef.current = audioStream;
      
      const mimeType = getSupportedAudioMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(audioStream, options);
      const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
      
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioRecordings(prev => ({ ...prev, [questionId]: { blob: audioBlob, url: audioUrl } }));
        setAnswers(prev => ({ ...prev, [questionId]: `audio_recording_${Date.now()}` }));
        setQuestionStatuses(prev => ({ ...prev, [questionId]: "answered" }));
        toast({ title: "Answer Saved", description: "Audio recording saved" });
        audioStream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (error) {
      console.error("Recording error:", error);
      toast({ title: "Recording Failed", description: "Could not start recording", variant: "destructive" });
    }
  };

  const stopAudioRecording = () => {
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      setIsRecordingAudio(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const playAudioRecording = (questionId: number) => {
    const recording = audioRecordings[questionId];
    if (recording?.url) {
      const audio = new Audio(recording.url);
      audio.play();
    }
  };

  const clearAudioRecording = (questionId: number) => {
    const recording = audioRecordings[questionId];
    if (recording?.url) URL.revokeObjectURL(recording.url);
    setAudioRecordings(prev => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
    setAnswers(prev => {
      const updated = { ...prev };
      delete updated[questionId];
      return updated;
    });
    setQuestionStatuses(prev => ({ ...prev, [questionId]: "visited" }));
  };

  const formatRecordingTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const handleVisitQuestion = (index: number) => {
    const q = questions[index];
    if (q && !questionStatuses[q.id]) {
      setQuestionStatuses(prev => ({ ...prev, [q.id]: "visited" }));
    }
    setCurrentQuestionIndex(index);
  };

  const syncAllAnswersToServer = async () => {
    if (!activeAttemptId) return;
    const answerEntries = Object.entries(answers);
    await Promise.allSettled(
      answerEntries.map(([qId, selectedOption]) =>
        apiRequest("POST", `/api/attempts/${activeAttemptId}/answer`, {
          questionId: Number(qId),
          selectedOption,
        }).catch(e => console.error(`Sync answer ${qId} error:`, e))
      )
    );
  };

  const finishAttemptOnServer = async () => {
    if (!activeAttemptId) return;
    try {
      await syncAllAnswersToServer();
      await apiRequest("POST", `/api/attempts/${activeAttemptId}/finish`);
    } catch (e) {
      console.error("Finish attempt error:", e);
    }
  };

  const handleAutoSubmit = async () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    document.exitFullscreen?.();
    await finishAttemptOnServer();
    setPhase("submitted");
    toast({ title: "Time's Up!", description: "Your exam has been auto-submitted" });
  };

  const handleFinalSubmit = async () => {
    if (submitConfirmText.toUpperCase() !== "SUBMIT") return;
    streamRef.current?.getTracks().forEach(t => t.stop());
    document.exitFullscreen?.();
    await finishAttemptOnServer();
    setPhase("submitted");
    toast({ title: "Exam Submitted", description: "Your answers have been recorded" });
  };

  const getQuestionStatusColor = (questionId: number) => {
    const status = questionStatuses[questionId];
    switch (status) {
      case "answered": return "bg-green-500 text-white";
      case "visited": return "bg-blue-500 text-white";
      default: return "bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-300";
    }
  };

  const getStats = () => {
    const answered = Object.values(questionStatuses).filter(s => s === "answered").length;
    const visitedOnly = Object.values(questionStatuses).filter(s => s === "visited").length;
    const notVisited = questions.length - answered - visitedOnly;
    return { answered, visited: visitedOnly, notVisited };
  };

  const ttsAudioRef = useRef<HTMLAudioElement | null>(null);
  const ttsCacheRef = useRef<Record<string, string>>({});
  const ttsCallIdRef = useRef(0);

  const speakQuestionText = useCallback(async (text: string, lang?: string) => {
    if (!text) return;
    const callId = ++ttsCallIdRef.current;
    try {
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current.currentTime = 0;
        ttsAudioRef.current = null;
      }

      const langMap: Record<string, string> = { en: "en-IN", hi: "hi", pa: "pa" };
      const ttsLang = langMap[lang || "en"] || "en-IN";
      const cacheKey = `${ttsLang}:${text}`;

      let audioSrc = ttsCacheRef.current[cacheKey];
      if (!audioSrc) {
        const res = await fetch("/api/tts/speak", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, lang: ttsLang }),
        });
        if (callId !== ttsCallIdRef.current) return;
        if (!res.ok) throw new Error("TTS API failed");
        const data = await res.json();
        if (!data.audio) throw new Error("No audio data");
        audioSrc = data.audio;
        ttsCacheRef.current[cacheKey] = audioSrc;
      }

      if (callId !== ttsCallIdRef.current) return;
      const audio = new Audio(audioSrc);
      ttsAudioRef.current = audio;
      audio.play().catch(() => {});
    } catch (e) {
      if (callId !== ttsCallIdRef.current) return;
      console.warn("Server TTS failed, trying browser fallback:", e);
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = lang === "hi" ? "hi-IN" : lang === "pa" ? "pa-IN" : "en-IN";
        utterance.rate = 0.9;
        window.speechSynthesis.speak(utterance);
      }
    }
  }, []);

  useEffect(() => {
    if (phase === "exam" && questions.length > 0) {
      const firstQ = questions[0];
      if (firstQ && !questionStatuses[firstQ.id]) {
        setQuestionStatuses(prev => ({ ...prev, [firstQ.id]: "visited" }));
      }
    }
  }, [phase, questions]);

  useEffect(() => {
    if (phase !== "exam") return;
    const q = questions[currentQuestionIndex];
    if (!q) return;
    const isAudioQ = !!(q as any).isVoiceEnabled || q.type === "audio";
    if (!isAudioQ) return;
    const content = q.content as any;
    if (!content?.question) return;
    const qLang = content.language || "en";
    let cancelled = false;

    const t = setTimeout(() => {
      if (!cancelled) speakQuestionText(content.question, qLang);
    }, 400);

    return () => {
      cancelled = true;
      clearTimeout(t);
      if (ttsAudioRef.current) {
        ttsAudioRef.current.pause();
        ttsAudioRef.current = null;
      }
    };
  }, [currentQuestionIndex, phase, questions, speakQuestionText]);

  const isLastQuestion = currentQuestionIndex === questions.length - 1;
  const currentQuestion = questions[currentQuestionIndex];
  const questionContent = currentQuestion?.content as { question: string; options?: (string | { id?: string; text: string })[]; image?: string; questionImageUrl?: string; paragraph?: string } | undefined;
  const isAudioQuestion = !!(currentQuestion as any)?.isVoiceEnabled;

  if (examLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-gray-900 dark:to-gray-800">
        <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-violet-50 to-fuchsia-50 dark:from-gray-900 dark:to-gray-800">
      <Helmet>
        <title>Secure Exam | Samikaran Olympiad</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* Branded Permission Dialog */}
      <AnimatePresence>
        {showPermissionDialog && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              transition={{ type: "spring", duration: 0.5 }}
              className="w-full max-w-sm sm:max-w-md bg-white dark:bg-gray-900 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
            >
              <div className="bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 px-6 py-4 text-center">
                <div className="w-12 h-12 mx-auto mb-2 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                  <div className="flex items-center gap-1">
                    <Camera className="w-5 h-5 text-white" />
                    <Mic className="w-4 h-4 text-white/80" />
                  </div>
                </div>
                <h2 className="text-lg font-bold text-white">Samikaran Olympiad</h2>
                <p className="text-white/80 text-xs">Secure Exam Environment</p>
              </div>

              <div className="px-5 py-4 space-y-3">
                <div className="text-center">
                  <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-1">
                    Camera & Microphone Access Required
                  </h3>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    To ensure exam integrity, Samikaran Olympiad needs access to your camera and microphone for proctoring.
                  </p>
                </div>

                <div className="bg-violet-50 dark:bg-violet-900/20 rounded-xl p-3 space-y-2">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-violet-100 dark:bg-violet-800 flex items-center justify-center flex-shrink-0">
                      <Camera className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Camera Access</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">For identity verification and monitoring</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-fuchsia-100 dark:bg-fuchsia-800 flex items-center justify-center flex-shrink-0">
                      <Mic className="w-4 h-4 text-fuchsia-600 dark:text-fuchsia-400" />
                    </div>
                    <div>
                      <p className="font-medium text-sm text-gray-900 dark:text-white">Microphone Access</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">For audio monitoring during exam</p>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 rounded-lg p-2.5">
                  <Shield className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                  <p>Your privacy is protected. Recording is only used for exam verification and deleted after review.</p>
                </div>

                <div className="flex flex-col gap-2 pt-1">
                  <Button
                    onClick={() => {
                      if (permissionResolveRef.current) {
                        permissionResolveRef.current();
                        permissionResolveRef.current = null;
                      }
                    }}
                    className="w-full bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white h-11 text-sm font-semibold rounded-xl shadow-lg"
                    data-testid="button-allow-permissions"
                  >
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                    Allow Access & Continue
                  </Button>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setShowPermissionDialog(false);
                      window.location.href = "/dashboard";
                    }}
                    className="w-full text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-xs"
                    data-testid="button-cancel-permissions"
                  >
                    <X className="w-3.5 h-3.5 mr-1.5" />
                    Cancel & Go Back
                  </Button>
                </div>

                <p className="text-center text-[11px] text-gray-400">
                  A browser prompt will appear next. Please click "Allow" to proceed.
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence mode="wait">
        {phase === "system-check" && (
          <motion.div key="check" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="container mx-auto px-4 py-8 max-w-4xl">
            {/* Back button */}
            <div className="mb-4">
              <Button 
                variant="ghost" 
                onClick={() => window.location.href = "/dashboard"}
                className="gap-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                data-testid="button-back-to-dashboard"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
              </Button>
            </div>
            
            <div className="text-center mb-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 mb-4">
                <Shield className="w-5 h-5" />
                <span className="font-medium">Pre-Exam System Check</span>
              </div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{exam?.title}</h1>
              <p className="text-gray-600 dark:text-gray-400">Complete all system checks before starting</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-violet-600" />
                    System Requirements
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {systemChecks.map((check) => (
                    <div key={check.id} className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                      check.status === "passed" ? "bg-green-50 border-green-200 dark:bg-green-900/20" :
                      check.status === "failed" ? "bg-red-50 border-red-200 dark:bg-red-900/20" :
                      check.status === "checking" ? "bg-amber-50 border-amber-200 dark:bg-amber-900/20" :
                      "bg-gray-50 border-gray-200 dark:bg-gray-800"
                    }`}>
                      <div className="flex items-center gap-3">
                        <check.icon className={`w-5 h-5 ${
                          check.status === "passed" ? "text-green-600" :
                          check.status === "failed" ? "text-red-600" :
                          check.status === "checking" ? "text-amber-600" : "text-gray-400"
                        }`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-sm">{check.name}</span>
                            {check.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                          </div>
                          <p className="text-xs text-muted-foreground">{check.errorMessage || check.description}</p>
                        </div>
                      </div>
                      {check.status === "checking" && <Loader2 className="w-4 h-4 animate-spin text-amber-600" />}
                      {check.status === "passed" && <CheckCircle2 className="w-4 h-4 text-green-600" />}
                      {check.status === "failed" && <XCircle className="w-4 h-4 text-red-600" />}
                    </div>
                  ))}
                  
                  <div className="flex gap-3 pt-4">
                    <Button variant="outline" onClick={handleRetry} className="flex-1" data-testid="button-retry">
                      <RefreshCw className="w-4 h-4 mr-2" />Retry
                    </Button>
                    <Button onClick={() => setPhase("rules")} disabled={!allRequiredChecksPassed} className="flex-1 brand-button" data-testid="button-continue">
                      Continue<ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-xl">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Camera className="w-5 h-5 text-violet-600" />
                    Camera Preview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                    <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    {systemChecks.find(c => c.id === "camera")?.status !== "passed" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80">
                        <div className="text-center text-white">
                          <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Camera not available</p>
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800 dark:text-amber-300">Ensure good lighting and position your face clearly in the camera frame.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        )}

        {phase === "rules" && (
          <motion.div key="rules" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0 }} className="container mx-auto px-4 py-8 max-w-3xl">
            <Card className="border-0 shadow-xl">
              <CardHeader className="text-center border-b">
                <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-full bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 mb-4 mx-auto">
                  <Eye className="w-5 h-5" /><span className="font-medium">Exam Rules</span>
                </div>
                <CardTitle className="text-2xl">{exam?.title}</CardTitle>
                <p className="text-muted-foreground mt-2">Duration: {exam?.durationMinutes} minutes | Total Marks: {exam?.totalMarks} | Questions: {questions.length}</p>
              </CardHeader>
              <CardContent className="p-6 space-y-4">
                <div className="space-y-3">
                  <h3 className="font-semibold flex items-center gap-2"><Shield className="w-5 h-5 text-violet-600" />Exam Guidelines</h3>
                  <ul className="space-y-2 text-sm">
                    {[
                      "Exam runs in locked full-screen mode - exiting will be blocked",
                      "Camera and microphone must remain active throughout",
                      "Tab switching and window switching trigger violations",
                      "Copy, paste, and right-click are disabled",
                      "ESC key and browser back button are blocked",
                      "You can answer questions in any order",
                      "Click 'Review & Submit' on the last question to submit",
                      "Exam auto-submits when time expires",
                      "Audio and face monitoring is active - violations will be logged"
                    ].map((rule, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                        <span>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="border-t pt-4">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox checked={rulesAccepted} onCheckedChange={(c) => setRulesAccepted(!!c)} className="mt-0.5" data-testid="checkbox-accept" />
                    <span className="text-sm">I have read and understood all rules. I agree to follow these guidelines.</span>
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => setPhase("system-check")} data-testid="button-back">
                    <ArrowLeft className="w-4 h-4 mr-2" />Back
                  </Button>
                  <Button onClick={handleStartExam} disabled={!rulesAccepted} className="flex-1 brand-button" data-testid="button-start">
                    <Maximize2 className="w-4 h-4 mr-2" />Start Exam
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "exam" && (
          <motion.div key="exam" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex flex-col bg-white dark:bg-gray-900 relative">
            {/* Fullscreen Warning Overlay */}
            {showFullscreenWarning && (
              <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 20, stiffness: 300 }} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-sm w-[90%] p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-red-50/50 to-transparent dark:from-red-900/10 pointer-events-none" />
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-red-100 to-red-200 dark:from-red-900/40 dark:to-red-800/30 flex items-center justify-center shadow-lg shadow-red-200/50">
                      <Maximize2 className="w-9 h-9 text-red-500" />
                    </div>
                    <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-red-600 to-rose-600 bg-clip-text text-transparent">Fullscreen Required</h2>
                    <p className="text-xs text-muted-foreground mb-5">Re-enter fullscreen to continue</p>

                    <div className="relative w-28 h-28 mx-auto mb-5">
                      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-200 dark:text-gray-700" />
                        <circle cx="50" cy="50" r="44" stroke="url(#timerGradFS)" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 44}`} strokeDashoffset={`${2 * Math.PI * 44 * (1 - warningCountdown / (warningSettings.countdownDuration || 60))}`} className="transition-all duration-1000 ease-linear" />
                        <defs><linearGradient id="timerGradFS" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#ef4444" /><stop offset="100%" stopColor="#f97316" /></linearGradient></defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-red-600 tabular-nums">{warningCountdown}</span>
                        <span className="text-[9px] font-semibold text-red-400 uppercase tracking-widest">seconds</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                      You exited fullscreen mode. This has been logged as a violation. Re-enter now or your exam will be <span className="font-semibold text-red-500">auto-submitted</span>.
                    </p>
                    <Button
                      onClick={async () => {
                        try {
                          await document.documentElement.requestFullscreen();
                          setShowFullscreenWarning(false);
                          stopCriticalWarning();
                        } catch (e) {
                          toast({ title: "Error", description: "Could not enter fullscreen", variant: "destructive" });
                        }
                      }}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg shadow-violet-500/30 text-sm"
                      data-testid="button-reenter-fullscreen"
                    >
                      <Maximize2 className="w-4 h-4 mr-2" />
                      Re-enter Fullscreen
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Camera/Face Warning Overlay */}
            {showCameraWarning && (
              <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 20, stiffness: 300 }} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-sm w-[90%] p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-orange-50/50 to-transparent dark:from-orange-900/10 pointer-events-none" />
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-orange-100 to-red-200 dark:from-orange-900/40 dark:to-red-800/30 flex items-center justify-center shadow-lg shadow-orange-200/50">
                      <Camera className="w-9 h-9 text-orange-500" />
                    </div>
                    <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-orange-600 to-red-600 bg-clip-text text-transparent">Camera Warning</h2>
                    <p className="text-xs text-muted-foreground mb-5">Position yourself in front of the camera</p>

                    <div className="relative w-28 h-28 mx-auto mb-5">
                      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-200 dark:text-gray-700" />
                        <circle cx="50" cy="50" r="44" stroke="url(#timerGradCam)" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 44}`} strokeDashoffset={`${2 * Math.PI * 44 * (1 - warningCountdown / (warningSettings.countdownDuration || 60))}`} className="transition-all duration-1000 ease-linear" />
                        <defs><linearGradient id="timerGradCam" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#f97316" /><stop offset="100%" stopColor="#ef4444" /></linearGradient></defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-orange-600 tabular-nums">{warningCountdown}</span>
                        <span className="text-[9px] font-semibold text-orange-400 uppercase tracking-widest">seconds</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2 leading-relaxed">{cameraWarningMessage}</p>
                    <p className="text-xs text-muted-foreground mb-6">Fix this now or your exam will be <span className="font-semibold text-red-500">auto-submitted</span>.</p>
                    <Button
                      onClick={handleCameraRetry}
                      disabled={retryingCamera}
                      className="w-full h-12 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-semibold shadow-lg shadow-violet-500/30 text-sm"
                      data-testid="button-camera-retry"
                    >
                      {retryingCamera ? (
                        <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Verifying Camera...</>
                      ) : (
                        <><RefreshCw className="w-4 h-4 mr-2" />Check Camera</>
                      )}
                    </Button>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Multi-Face Warning */}
            {multiFaceWarning && (
              <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center">
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: "spring", damping: 20, stiffness: 300 }} className="bg-white dark:bg-gray-900 rounded-3xl shadow-2xl max-w-sm w-[90%] p-8 text-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-rose-50/50 to-transparent dark:from-rose-900/10 pointer-events-none" />
                  <div className="relative">
                    <div className="w-20 h-20 mx-auto mb-5 rounded-full bg-gradient-to-br from-rose-100 to-red-200 dark:from-rose-900/40 dark:to-red-800/30 flex items-center justify-center shadow-lg shadow-rose-200/50">
                      <Users className="w-9 h-9 text-rose-500" />
                    </div>
                    <h2 className="text-xl font-bold mb-1 bg-gradient-to-r from-rose-600 to-red-600 bg-clip-text text-transparent">Multiple Faces Detected!</h2>
                    <p className="text-xs text-muted-foreground mb-5">Only one person is allowed</p>

                    <div className="relative w-28 h-28 mx-auto mb-5">
                      <svg className="w-28 h-28 -rotate-90" viewBox="0 0 100 100">
                        <circle cx="50" cy="50" r="44" stroke="currentColor" strokeWidth="6" fill="none" className="text-gray-200 dark:text-gray-700" />
                        <circle cx="50" cy="50" r="44" stroke="url(#timerGradMF)" strokeWidth="6" fill="none" strokeLinecap="round" strokeDasharray={`${2 * Math.PI * 44}`} strokeDashoffset={`${2 * Math.PI * 44 * (1 - warningCountdown / (warningSettings.countdownDuration || 60))}`} className="transition-all duration-1000 ease-linear" />
                        <defs><linearGradient id="timerGradMF" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#e11d48" /><stop offset="100%" stopColor="#dc2626" /></linearGradient></defs>
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <span className="text-3xl font-black text-rose-600 tabular-nums">{warningCountdown}</span>
                        <span className="text-[9px] font-semibold text-rose-400 uppercase tracking-widest">seconds</span>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground mb-2 leading-relaxed">
                      <span className="font-bold text-red-500">{faceCount} faces</span> detected. Only one person is allowed during the exam.
                    </p>
                    <p className="text-xs text-muted-foreground">Remove extra person immediately or your exam will be <span className="font-semibold text-red-500">auto-submitted</span>.</p>
                  </div>
                </motion.div>
              </div>
            )}

            {/* Top Bar */}
            <header className="sticky top-0 z-50 bg-white dark:bg-gray-900 border-b shadow-sm px-4 h-12 flex items-center justify-between gap-2 flex-shrink-0">
              <div className="flex items-center gap-3 min-w-0">
                <span className="font-semibold text-sm truncate max-w-[180px] lg:max-w-[280px]">{exam?.title}</span>
                <Badge variant="outline" className="font-mono text-xs flex-shrink-0">Q {currentQuestionIndex + 1}/{questions.length}</Badge>
              </div>
              <div className="flex items-center gap-2 flex-shrink-0">
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full font-mono text-sm ${getTimeStatus().color} text-white`}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>{formatTime(timeRemaining)}</span>
                </div>
                <Badge variant={timeRemaining < 300 ? "destructive" : "secondary"} className="text-xs hidden sm:inline-flex">{getTimeStatus().label}</Badge>
                {violations.length > 0 && (
                  <Badge variant="destructive" className="gap-1 text-xs">
                    <AlertTriangle className="w-3 h-3" />{violations.length}
                  </Badge>
                )}
              </div>
            </header>

            <div className="flex-1 flex overflow-hidden" style={{ height: 'calc(100vh - 48px)' }}>

              {/* LEFT SIDEBAR — Question Numbers */}
              <div className="w-[140px] lg:w-[160px] border-r bg-gradient-to-b from-white to-gray-50/90 dark:from-gray-900 dark:to-gray-800/90 flex-shrink-0 flex flex-col overflow-hidden">
                <div className="p-2.5 border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[9px] font-medium text-muted-foreground">
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gradient-to-br from-emerald-400 to-green-600 inline-block shadow-sm shadow-green-500/30" />Answered</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 inline-block shadow-sm shadow-blue-500/30" />Visited</span>
                    <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-600 inline-block" />Not Visited</span>
                  </div>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-2 grid grid-cols-5 gap-1.5">
                    {questions.map((q, idx) => (
                      <button
                        key={q.id}
                        onClick={() => handleVisitQuestion(idx)}
                        className={`w-full aspect-square rounded-lg text-[11px] font-bold transition-all duration-200 hover:scale-105 ${
                          idx === currentQuestionIndex 
                            ? "ring-2 ring-violet-500 ring-offset-1 shadow-md shadow-violet-500/30 scale-110" 
                            : "hover:shadow-sm"
                        } ${
                          questionStatuses[q.id] === "answered" 
                            ? "bg-gradient-to-br from-emerald-400 to-green-600 text-white shadow-sm shadow-green-500/20" 
                            : questionStatuses[q.id] === "visited" 
                              ? "bg-gradient-to-br from-blue-400 to-indigo-600 text-white shadow-sm shadow-blue-500/20" 
                              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                        }`}
                        data-testid={`button-q-${idx + 1}`}
                      >
                        {idx + 1}
                      </button>
                    ))}
                  </div>
                </ScrollArea>
                <div className="p-2.5 border-t bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm">
                  <div className="grid grid-cols-2 gap-1.5">
                    <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-1.5 text-center">
                      <p className="text-[15px] font-bold">{questions.length}</p>
                      <p className="text-[8px] text-muted-foreground font-medium uppercase tracking-wider">Total</p>
                    </div>
                    <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-1.5 text-center">
                      <p className="text-[15px] font-bold text-emerald-600">{getStats().answered}</p>
                      <p className="text-[8px] text-emerald-600/70 font-medium uppercase tracking-wider">Done</p>
                    </div>
                    <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-1.5 text-center">
                      <p className="text-[15px] font-bold text-blue-600">{getStats().visited}</p>
                      <p className="text-[8px] text-blue-600/70 font-medium uppercase tracking-wider">Visited</p>
                    </div>
                    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-1.5 text-center">
                      <p className="text-[15px] font-bold text-gray-500">{getStats().notVisited}</p>
                      <p className="text-[8px] text-gray-500/70 font-medium uppercase tracking-wider">Left</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* CENTER — Question + Options */}
              <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                <div className="flex-1 overflow-y-auto p-4 lg:p-6">
                  {currentQuestion && questionContent && (
                    <div className="max-w-3xl mx-auto">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="text-xs font-medium text-muted-foreground">Q: {currentQuestionIndex + 1}</span>
                        {isAudioQuestion && (
                          <>
                            <Badge className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white border-0 text-[10px] px-2 py-0.5">
                              <Mic className="w-3 h-3 mr-1" />Audio
                            </Badge>
                            {(currentQuestion?.content as any)?.language && (currentQuestion?.content as any)?.language !== "en" && (
                              <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 border-violet-300 text-violet-600">
                                {(currentQuestion?.content as any)?.language === "hi" ? "हिंदी" : (currentQuestion?.content as any)?.language === "pa" ? "ਪੰਜਾਬੀ" : (currentQuestion?.content as any)?.language?.toUpperCase()}
                              </Badge>
                            )}
                          </>
                        )}
                      </div>

                      <div className="bg-white dark:bg-gray-900 rounded-xl border p-5 lg:p-6 mb-4 min-h-[120px]">
                        {questionContent.paragraph && (
                          <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg mb-4 text-sm border">
                            <p className="italic text-gray-600 dark:text-gray-400">{questionContent.paragraph}</p>
                          </div>
                        )}
                        <p className="text-base lg:text-lg font-medium leading-relaxed">{questionContent.question}</p>
                        {(questionContent.image || questionContent.questionImageUrl) && (
                          <div className="mt-4 rounded-lg border overflow-hidden bg-gray-50 dark:bg-gray-800 inline-block">
                            <img
                              src={questionContent.questionImageUrl || questionContent.image}
                              alt="Question illustration"
                              className="max-w-full max-h-56 object-contain"
                              crossOrigin="anonymous"
                              referrerPolicy="no-referrer"
                              onError={(e) => {
                                const img = e.currentTarget;
                                if (!img.dataset.retried) {
                                  img.dataset.retried = "1";
                                  img.src = `https://images.weserv.nl/?url=${encodeURIComponent(img.src)}&w=600`;
                                }
                              }}
                            />
                          </div>
                        )}
                      </div>

                      {isAudioQuestion ? (
                        <div className="space-y-3">
                          <div className="flex items-center justify-center gap-3">
                            <Button
                              variant="outline" size="sm"
                              onClick={() => speakQuestionText(questionContent?.question || "", (currentQuestion?.content as any)?.language || "en")}
                              className="gap-1.5 text-violet-700 border-violet-300"
                              data-testid="button-replay-question"
                            >
                              <Volume2 className="w-3.5 h-3.5" /> Replay Question
                            </Button>
                          </div>
                          <div className="bg-white dark:bg-gray-900 rounded-xl border-2 border-dashed border-violet-200 dark:border-violet-800 p-6 text-center">
                            {!audioRecordings[currentQuestion.id] ? (
                              <div className="space-y-3">
                                {isRecordingAudio && (
                                  <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-red-50 dark:bg-red-900/30 rounded-full text-red-600">
                                    <span className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                                    <span className="font-mono text-sm font-semibold">{formatRecordingTime(recordingTime)}</span>
                                  </div>
                                )}
                                <p className="text-gray-500 text-sm">{isRecordingAudio ? "Speaking... Click stop when done" : "Tap to record your answer"}</p>
                                <button
                                  onClick={() => isRecordingAudio ? stopAudioRecording() : startAudioRecording(currentQuestion.id)}
                                  className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg transition-all ${
                                    isRecordingAudio 
                                      ? "bg-red-500 hover:bg-red-600 animate-pulse ring-4 ring-red-100" 
                                      : "bg-gradient-to-br from-violet-500 to-fuchsia-500 hover:scale-105 ring-4 ring-violet-100"
                                  }`}
                                  data-testid="button-record"
                                >
                                  {isRecordingAudio ? <Square className="w-6 h-6 text-white" /> : <Mic className="w-7 h-7 text-white" />}
                                </button>
                              </div>
                            ) : (
                              <div className="space-y-3">
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 text-green-600 bg-green-50 rounded-full text-sm">
                                  <CheckCircle2 className="w-4 h-4" /><span className="font-medium">Recorded</span>
                                </div>
                                <div className="flex justify-center gap-2">
                                  <Button variant="outline" size="sm" onClick={() => playAudioRecording(currentQuestion.id)} className="gap-1.5" data-testid="button-play"><Play className="w-3.5 h-3.5" /> Play</Button>
                                  <Button variant="outline" size="sm" onClick={() => clearAudioRecording(currentQuestion.id)} className="gap-1.5" data-testid="button-rerecord"><RefreshCw className="w-3.5 h-3.5" /> Re-Record</Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ) : currentQuestion.type === "true_false" ? (
                        <div className="space-y-2">
                          {["True", "False"].map(val => (
                            <label key={val} className={`flex items-center gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-colors ${
                              answers[currentQuestion.id] === val
                                ? val === "True" ? "bg-green-50 border-green-400 dark:bg-green-900/20" : "bg-red-50 border-red-400 dark:bg-red-900/20"
                                : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                            }`}>
                              <input type="radio" name={`q-${currentQuestion.id}`} value={val} checked={answers[currentQuestion.id] === val} onChange={() => handleSelectAnswer(currentQuestion.id, val)} className="w-4 h-4" />
                              <span className="font-medium">{val}</span>
                            </label>
                          ))}
                        </div>
                      ) : questionContent.options ? (
                        <div className="space-y-2">
                          {questionContent.options.map((option, idx) => {
                            const optionText = typeof option === 'object' ? option.text : option;
                            const optionValue = typeof option === 'object' ? (option.id || option.text) : option;
                            return (
                              <label key={idx} className={`flex items-center gap-3 p-3.5 rounded-lg border-2 cursor-pointer transition-colors ${
                                answers[currentQuestion.id] === optionText
                                  ? "bg-violet-50 border-violet-400 dark:bg-violet-900/20 dark:border-violet-600"
                                  : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
                              }`}>
                                <input type="radio" name={`q-${currentQuestion.id}`} value={optionValue} checked={answers[currentQuestion.id] === optionText} onChange={() => handleSelectAnswer(currentQuestion.id, optionText)} className="w-4 h-4 accent-violet-600" />
                                <span className="font-medium text-gray-400 mr-1 text-sm">{String.fromCharCode(97 + idx)})</span>
                                <span className="text-sm lg:text-base">{optionText}</span>
                              </label>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  )}
                </div>

                {/* Bottom Navigation - Fixed */}
                <div className="flex-shrink-0 border-t bg-white dark:bg-gray-900 px-4 lg:px-6 py-2.5 flex items-center justify-between">
                  <Button variant="outline" size="sm" onClick={() => handleVisitQuestion(Math.max(0, currentQuestionIndex - 1))} disabled={currentQuestionIndex === 0} className="min-w-[100px]" data-testid="button-prev">
                    <ChevronLeft className="w-4 h-4 mr-1" />Previous
                  </Button>
                  {currentQuestion && answers[currentQuestion.id] && (
                    <span className="text-xs font-medium text-green-600 flex items-center gap-1"><CheckCircle2 className="w-3.5 h-3.5" />Answer Saved</span>
                  )}
                  {isLastQuestion ? (
                    <Button size="sm" onClick={() => setPhase("review")} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white min-w-[140px]" data-testid="button-review-submit">
                      <Send className="w-4 h-4 mr-1.5" />Review & Submit
                    </Button>
                  ) : (
                    <Button size="sm" onClick={() => handleVisitQuestion(currentQuestionIndex + 1)} className={`text-white min-w-[120px] ${currentQuestion && answers[currentQuestion.id] ? "bg-gradient-to-r from-emerald-500 to-green-500" : "bg-gradient-to-r from-violet-600 to-fuchsia-600"}`} data-testid="button-next">
                      {currentQuestion && answers[currentQuestion.id] ? "Save & Next" : "Next"}<ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  )}
                </div>
              </div>

              {/* RIGHT SIDEBAR — Camera + Overview + Violations */}
              <div className="w-[220px] lg:w-[260px] border-l bg-gray-50/80 dark:bg-gray-800/50 flex-shrink-0 flex flex-col overflow-hidden">
                <div className="p-2.5 border-b">
                  <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden relative">
                    <video ref={examVideoRef} autoPlay playsInline muted className="w-full h-full object-cover" />
                    <div className={`absolute bottom-0 left-0 right-0 ${faceDetected ? 'bg-green-500/90' : 'bg-red-500/90'} text-white text-[9px] text-center py-0.5 font-medium`}>
                      {faceDetected ? 'FACE DETECTED' : 'NO FACE'}
                    </div>
                    <div className={`absolute top-1 right-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                      trustScore >= 80 ? 'bg-green-500' : trustScore >= 60 ? 'bg-yellow-500' : 'bg-red-500'
                    } text-white`}>AI: {trustScore}%</div>
                  </div>
                </div>

                {(gazeWarning || headPoseWarning || objectWarning) && (
                  <div className="px-2.5 py-1.5 border-b space-y-0.5">
                    {gazeWarning && <div className="flex items-center gap-1 text-[9px] text-amber-600 bg-amber-50 rounded px-1.5 py-0.5"><Eye className="w-2.5 h-2.5" /><span className="truncate">{gazeWarning}</span></div>}
                    {headPoseWarning && <div className="flex items-center gap-1 text-[9px] text-amber-600 bg-amber-50 rounded px-1.5 py-0.5"><User className="w-2.5 h-2.5" /><span className="truncate">{headPoseWarning}</span></div>}
                    {objectWarning && <div className="flex items-center gap-1 text-[9px] text-red-600 bg-red-50 rounded px-1.5 py-0.5"><AlertTriangle className="w-2.5 h-2.5" /><span className="truncate">{objectWarning}</span></div>}
                  </div>
                )}

                <div className="px-2.5 py-2 border-b">
                  <div className="flex items-center gap-1.5 text-[10px] mb-1.5">
                    <Volume2 className={`w-3 h-3 ${audioLevel > 50 ? 'text-red-500' : 'text-green-500'}`} />
                    <div className="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full transition-all ${audioLevel > 50 ? 'bg-red-500' : 'bg-green-500'}`} style={{ width: `${audioLevel}%` }} />
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-[10px]">
                    <span className={`flex items-center gap-1 ${cameraStatus === 'ok' ? 'text-green-600' : 'text-red-600'}`}>
                      <Camera className="w-3 h-3" />{cameraStatus === 'ok' ? 'OK' : 'Issue'}
                    </span>
                    <span className="flex items-center gap-1 text-green-600"><Mic className="w-3 h-3" />Mic</span>
                    <span className={`flex items-center gap-1 capitalize ${networkStatus.speed === 'slow' ? 'text-red-600' : 'text-green-600'}`}>
                      <Wifi className="w-3 h-3" />{networkStatus.speed}
                    </span>
                  </div>
                </div>

                <div className="flex-1 flex flex-col overflow-hidden">
                  <div className="px-2.5 py-1.5 border-b flex items-center gap-1.5">
                    <AlertCircle className="w-3 h-3 text-red-500" />
                    <span className="text-[10px] font-semibold">Violations ({violations.length})</span>
                  </div>
                  <ScrollArea className="flex-1">
                    <div className="p-1.5 space-y-1">
                      {violations.length === 0 ? (
                        <p className="text-center text-muted-foreground text-[10px] py-3">No violations</p>
                      ) : (
                        violations.slice(0, 15).map(v => (
                          <div key={v.id} className={`px-2 py-1 rounded text-[10px] ${
                            v.severity === "critical" ? "bg-red-50 border-l-2 border-red-500" :
                            v.severity === "high" ? "bg-orange-50 border-l-2 border-orange-500" :
                            "bg-gray-50 border-l-2 border-gray-300"
                          }`}>
                            <div className="flex items-center justify-between gap-1">
                              <span className="font-medium truncate uppercase">{v.type.replace(/_/g, ' ')}</span>
                              <span className="text-muted-foreground text-[9px] flex-shrink-0">{v.time}</span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {phase === "review" && (
          <motion.div key="review" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="min-h-screen flex items-center justify-center p-4">
            <Card className="max-w-lg w-full border-0 shadow-xl">
              <CardHeader className="text-center border-b">
                <CardTitle>Review & Submit</CardTitle>
                <p className="text-muted-foreground text-sm mt-2">Review your answers before final submission</p>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-green-600">{getStats().answered}</p>
                    <p className="text-xs text-muted-foreground">Answered</p>
                  </div>
                  <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-2xl font-bold text-blue-600">{getStats().visited}</p>
                    <p className="text-xs text-muted-foreground">Visited</p>
                  </div>
                  <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-2xl font-bold text-gray-600">{getStats().notVisited}</p>
                    <p className="text-xs text-muted-foreground">Not Visited</p>
                  </div>
                </div>

                {violations.length > 0 && (
                  <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      {violations.length} violation(s) recorded during exam
                    </p>
                  </div>
                )}

                <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-800 dark:text-red-300 mb-3">
                    Type <span className="font-bold">SUBMIT</span> to confirm submission:
                  </p>
                  <Input
                    value={submitConfirmText}
                    onChange={(e) => setSubmitConfirmText(e.target.value)}
                    placeholder="Type SUBMIT"
                    className="text-center font-mono uppercase"
                    data-testid="input-submit-confirm"
                  />
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" onClick={() => setPhase("exam")} className="flex-1" data-testid="button-back-to-exam">
                    <ArrowLeft className="w-4 h-4 mr-2" />Back to Exam
                  </Button>
                  <Button
                    onClick={handleFinalSubmit}
                    disabled={submitConfirmText.toUpperCase() !== "SUBMIT"}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    data-testid="button-final-submit"
                  >
                    <Send className="w-4 h-4 mr-2" />Submit Exam
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {phase === "submitted" && (
          <motion.div key="submitted" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="min-h-screen flex items-center justify-center">
            <Card className="max-w-md border-0 shadow-xl text-center">
              <CardContent className="p-8">
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <h2 className="text-2xl font-bold mb-2">Exam Submitted</h2>
                <p className="text-muted-foreground mb-6">Your answers have been recorded successfully.</p>
                <div className="space-y-2 text-sm text-left mb-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex justify-between"><span>Total Questions</span><span className="font-medium">{questions.length}</span></div>
                  <div className="flex justify-between"><span>Answered</span><span className="font-medium text-green-600">{getStats().answered}</span></div>
                  <div className="flex justify-between"><span>Visited but Skipped</span><span className="font-medium text-blue-600">{getStats().visited}</span></div>
                  <div className="flex justify-between"><span>Not Visited</span><span className="font-medium text-gray-500">{getStats().notVisited}</span></div>
                  <div className="flex justify-between"><span>Violations Recorded</span><span className={violations.length > 0 ? "font-medium text-amber-600" : "font-medium text-green-600"}>{violations.length}</span></div>
                </div>
                <Button onClick={() => setLocation("/student-dashboard")} className="w-full" data-testid="button-home">Return to Dashboard</Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
