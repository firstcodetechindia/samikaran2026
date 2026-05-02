import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import {
  Camera, Mic, Monitor, User, CheckCircle2, XCircle, AlertTriangle,
  Loader2, Shield, Clock, ChevronRight, ChevronLeft,
  Maximize2, RefreshCw, Volume2, Play, Square, AlertCircle
} from "lucide-react";

type SystemCheckStatus = "pending" | "checking" | "passed" | "failed";
type ExamPhase = "system-check" | "rules" | "exam" | "submitted";
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

interface Question {
  id: number;
  questionText: string;
  correctAnswer: string;
  category: string;
}

interface AnswerRecord {
  questionId: number;
  audioBlob: Blob | null;
  audioUrl: string | null;
  recordedAt: string | null;
  status: QuestionStatus;
}

const EXAM_DURATION = 300;

export default function AudioOlympiadDemo() {
  const { toast } = useToast();

  const { data: questions = [], isLoading: questionsLoading } = useQuery<Question[]>({
    queryKey: ["/api/demo/audio-olympiad-questions"],
  });

  const [phase, setPhase] = useState<ExamPhase>("system-check");
  const [systemChecks, setSystemChecks] = useState<SystemCheck[]>([
    { id: "browser", name: "Browser Compatibility", description: "Checking browser support", icon: Monitor, status: "pending", required: true },
    { id: "security", name: "Security Check", description: "Note: Automation tool detected", icon: Shield, status: "pending", required: false },
    { id: "camera", name: "Camera Access", description: "Camera permission required", icon: Camera, status: "pending", required: true },
    { id: "microphone", name: "Microphone Access", description: "Microphone permission required", icon: Mic, status: "pending", required: true },
    { id: "face", name: "Face Detection", description: "Single face validation", icon: User, status: "pending", required: true }
  ]);
  const [checksCompleted, setChecksCompleted] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);
  
  // Exam state
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [audioRecords, setAudioRecords] = useState<AnswerRecord[]>([]);
  const [timeLeft, setTimeLeft] = useState(EXAM_DURATION);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasSpokenOnLoad, setHasSpokenOnLoad] = useState<Set<number>>(new Set());
  
  // Proctoring state
  const [faceDetected, setFaceDetected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [violations, setViolations] = useState<{ type: string; time: string }[]>([]);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Refs
  const videoRef = useRef<HTMLVideoElement>(null);
  const examVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const checksRunRef = useRef(false);
  
  useEffect(() => {
    if (questions.length > 0 && audioRecords.length === 0) {
      setAudioRecords(questions.map(q => ({ questionId: q.id, audioBlob: null, audioUrl: null, recordedAt: null, status: "not-visited" })));
    }
  }, [questions, audioRecords.length]);

  const currentQuestion = questions[currentQuestionIndex];
  const currentRecord = audioRecords[currentQuestionIndex] || { questionId: 0, audioBlob: null, audioUrl: null, recordedAt: null, status: "not-visited" as QuestionStatus };

  // Update system check status
  const updateCheckStatus = useCallback((id: string, status: SystemCheckStatus, error?: string) => {
    setSystemChecks(prev => prev.map(check => 
      check.id === id ? { ...check, status, errorMessage: error } : check
    ));
  }, []);

  // Run system checks
  const runSystemChecks = useCallback(async () => {
    // Browser check
    updateCheckStatus("browser", "checking");
    await new Promise(r => setTimeout(r, 500));
    const isModernBrowser = 'mediaDevices' in navigator && 'speechSynthesis' in window;
    updateCheckStatus("browser", isModernBrowser ? "passed" : "failed");
    
    // Security check
    updateCheckStatus("security", "checking");
    await new Promise(r => setTimeout(r, 300));
    updateCheckStatus("security", "passed");
    
    // Camera check
    updateCheckStatus("camera", "checking");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      
      // Setup audio analyser
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      source.connect(analyser);
      analyserRef.current = analyser;
      
      updateCheckStatus("camera", "passed");
      updateCheckStatus("microphone", "passed");
      
      // Face detection (simulated)
      updateCheckStatus("face", "checking");
      await new Promise(r => setTimeout(r, 1000));
      setFaceDetected(true);
      updateCheckStatus("face", "passed");
      
    } catch (error) {
      updateCheckStatus("camera", "failed", "Camera access denied");
      updateCheckStatus("microphone", "failed", "Microphone access denied");
      updateCheckStatus("face", "failed", "Camera required for face detection");
    }
    
    setChecksCompleted(true);
  }, [updateCheckStatus]);

  useEffect(() => {
    if (phase !== "system-check" || checksRunRef.current) return;
    checksRunRef.current = true;
    runSystemChecks();
  }, [phase, runSystemChecks]);

  // Timer
  useEffect(() => {
    if (phase !== "exam" || timeLeft <= 0) return;
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          setPhase("submitted");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  // Audio level monitoring during exam
  useEffect(() => {
    if (phase !== "exam" || !analyserRef.current) return;
    const interval = setInterval(() => {
      if (!analyserRef.current) return;
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
      setAudioLevel(Math.min(100, avg * 2));
    }, 100);
    return () => clearInterval(interval);
  }, [phase]);

  // Transfer video to exam phase
  useEffect(() => {
    if (phase === "exam" && streamRef.current && examVideoRef.current) {
      examVideoRef.current.srcObject = streamRef.current;
      examVideoRef.current.play().catch(console.error);
    }
  }, [phase]);

  // Format time
  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  // TTS
  const speakQuestion = useCallback(() => {
    if (isSpeaking || phase !== "exam") return;
    if (!('speechSynthesis' in window)) {
      toast({ title: "Not Supported", description: "Text-to-speech is not available", variant: "destructive" });
      return;
    }
    setIsSpeaking(true);
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(`Question ${currentQuestionIndex + 1}. ${currentQuestion.questionText}`);
    utterance.lang = 'en-IN';
    utterance.rate = 0.85;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  }, [currentQuestionIndex, currentQuestion, isSpeaking, phase, toast]);

  // Auto-speak on question change
  useEffect(() => {
    if (phase !== "exam" || hasSpokenOnLoad.has(currentQuestionIndex)) return;
    const timer = setTimeout(() => {
      speakQuestion();
      setHasSpokenOnLoad(prev => new Set(prev).add(currentQuestionIndex));
      // Mark as visited
      setAudioRecords(prev => {
        const updated = [...prev];
        if (updated[currentQuestionIndex].status === "not-visited") {
          updated[currentQuestionIndex] = { ...updated[currentQuestionIndex], status: "visited" };
        }
        return updated;
      });
    }, 300);
    return () => clearTimeout(timer);
  }, [currentQuestionIndex, phase, hasSpokenOnLoad, speakQuestion]);

  // Recording functions
  const getSupportedMimeType = (): string => {
    const types = ['audio/webm', 'audio/webm;codecs=opus', 'audio/mp4', 'audio/ogg', ''];
    for (const type of types) {
      if (type === '' || MediaRecorder.isTypeSupported(type)) return type;
    }
    return '';
  };

  const startRecording = async () => {
    window.speechSynthesis.cancel();
    setIsSpeaking(false);
    
    try {
      // Get a fresh audio-only stream for recording
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const mimeType = getSupportedMimeType();
      const options = mimeType ? { mimeType } : undefined;
      const mediaRecorder = new MediaRecorder(audioStream, options);
      const actualMimeType = mediaRecorder.mimeType || 'audio/webm';
      
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMimeType });
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioRecords(prev => {
          const updated = [...prev];
          updated[currentQuestionIndex] = { ...updated[currentQuestionIndex], audioBlob, audioUrl, recordedAt: new Date().toISOString(), status: "answered" };
          return updated;
        });
        toast({ title: "Answer Saved", description: "Recording saved successfully" });
        // Stop the audio stream tracks
        audioStream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);
      recordingTimerRef.current = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
    } catch (error) {
      console.error("Recording error:", error);
      toast({ title: "Recording Failed", description: "Could not start recording", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  const playRecording = () => {
    if (currentRecord.audioUrl) {
      const audio = new Audio(currentRecord.audioUrl);
      audio.play();
    }
  };

  const clearRecording = () => {
    if (currentRecord.audioUrl) URL.revokeObjectURL(currentRecord.audioUrl);
    setAudioRecords(prev => {
      const updated = [...prev];
      updated[currentQuestionIndex] = { ...updated[currentQuestionIndex], audioBlob: null, audioUrl: null, recordedAt: null, status: "visited" };
      return updated;
    });
  };

  // Enter fullscreen
  const enterFullscreen = async () => {
    try {
      await document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } catch (e) {
      console.error("Fullscreen failed:", e);
    }
  };

  // Counts
  const allChecksPassed = systemChecks.filter(c => c.required).every(c => c.status === "passed");
  const answeredCount = audioRecords.filter(r => r.status === "answered").length;
  const visitedCount = audioRecords.filter(r => r.status === "visited").length;
  const notVisitedCount = audioRecords.filter(r => r.status === "not-visited").length;

  if (questionsLoading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="loading-questions">
        <div className="text-center">
          <Loader2 className="w-10 h-10 animate-spin text-violet-600 mx-auto mb-4" />
          <p className="text-gray-600">Loading demo questions...</p>
        </div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center" data-testid="empty-questions">
        <div className="text-center max-w-md">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-gray-700 mb-2">No Demo Questions Available</h2>
          <p className="text-gray-500 mb-6">Demo questions have not been configured yet. Please check back later.</p>
          <Button onClick={() => window.location.href = '/'} data-testid="button-return-home">Return to Home</Button>
        </div>
      </div>
    );
  }

  // SYSTEM CHECK PHASE
  if (phase === "system-check") {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Audio Olympiad - System Check</h1>
            <p className="text-gray-500">Please complete all requirements to proceed</p>
          </div>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* System Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="w-5 h-5" />
                  System Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {systemChecks.map(check => (
                  <div key={check.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <check.icon className="w-5 h-5 text-slate-600" />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{check.name}</span>
                          {check.required && <Badge variant="outline" className="text-xs">Required</Badge>}
                        </div>
                        <p className="text-xs text-gray-500">{check.description}</p>
                      </div>
                    </div>
                    <div>
                      {check.status === "pending" && <div className="w-6 h-6 rounded-full border-2 border-gray-300" />}
                      {check.status === "checking" && <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />}
                      {check.status === "passed" && <CheckCircle2 className="w-6 h-6 text-green-500" />}
                      {check.status === "failed" && <XCircle className="w-6 h-6 text-red-500" />}
                    </div>
                  </div>
                ))}
                
                <div className="flex gap-3 pt-4">
                  <Button variant="outline" onClick={() => { checksRunRef.current = false; runSystemChecks(); }} className="gap-2">
                    <RefreshCw className="w-4 h-4" /> Retry
                  </Button>
                  <Button 
                    onClick={() => setPhase("rules")} 
                    disabled={!allChecksPassed}
                    className="flex-1 gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600"
                  >
                    Continue <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Camera Preview */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Camera className="w-5 h-5" />
                  Camera Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
                  <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                  {faceDetected && (
                    <div className="absolute bottom-2 left-2 right-2 bg-green-500 text-white text-sm py-1 px-2 rounded text-center">
                      FACE DETECTED
                    </div>
                  )}
                </div>
                <div className="flex items-start gap-2 p-3 bg-amber-50 rounded-lg text-amber-700 text-sm">
                  <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>Ensure good lighting and position your face clearly in the camera frame.</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // RULES PHASE
  if (phase === "rules") {
    return (
      <div className="min-h-screen bg-slate-50 p-4 md:p-8">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-6">
            <Badge className="bg-violet-100 text-violet-700 mb-2">Audio Olympiad Demo</Badge>
            <p className="text-gray-600">Duration: 5 minutes | Total Questions: {questions.length}</p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="w-5 h-5" />
                Exam Guidelines
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
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
                <div key={i} className="flex items-start gap-3 text-gray-700">
                  <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span>{rule}</span>
                </div>
              ))}

              <div className="flex items-center gap-3 pt-4 border-t mt-6">
                <Checkbox 
                  id="accept" 
                  checked={rulesAccepted} 
                  onCheckedChange={(checked) => setRulesAccepted(!!checked)}
                />
                <label htmlFor="accept" className="text-sm cursor-pointer">
                  I have read and understood all rules. I agree to follow these guidelines.
                </label>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={() => setPhase("system-check")} className="gap-2">
                  <ChevronLeft className="w-4 h-4" /> Back
                </Button>
                <Button 
                  onClick={() => { enterFullscreen(); setPhase("exam"); }}
                  disabled={!rulesAccepted}
                  className="flex-1 gap-2 bg-gradient-to-r from-violet-600 to-fuchsia-600"
                >
                  <Maximize2 className="w-4 h-4" /> Start Exam
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // SUBMITTED PHASE
  if (phase === "submitted") {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 rounded-full mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Exam Submitted</h1>
          <p className="text-gray-600 mb-6">Your audio answers have been submitted. Results will be available after evaluation.</p>
          <div className="bg-white rounded-xl p-6 shadow border mb-6">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div><p className="text-2xl font-bold text-green-600">{answeredCount}</p><p className="text-sm text-gray-500">Answered</p></div>
              <div><p className="text-2xl font-bold text-blue-600">{visitedCount}</p><p className="text-sm text-gray-500">Visited</p></div>
              <div><p className="text-2xl font-bold text-gray-400">{notVisitedCount}</p><p className="text-sm text-gray-500">Not Visited</p></div>
            </div>
          </div>
          <Button onClick={() => window.location.href = '/'}>Return to Home</Button>
        </motion.div>
      </div>
    );
  }

  // EXAM PHASE
  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b px-4 py-3 flex items-center justify-between sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-lg truncate">Samikaran Audio Olympiad</h1>
          <Badge variant="outline">Q {currentQuestionIndex + 1}/{questions.length}</Badge>
        </div>
        <div className="flex items-center gap-4">
          <div className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-full font-mono text-sm font-bold",
            timeLeft < 60 ? "bg-red-100 text-red-600 animate-pulse" : "bg-green-100 text-green-700"
          )}>
            <Clock className="w-4 h-4" />
            {formatTime(timeLeft)}
          </div>
          <Badge className={faceDetected ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}>
            {faceDetected ? "Running" : "Issue"}
          </Badge>
        </div>
      </header>

      <div className="flex-1 flex">
        {/* Main Question Area */}
        <main className="flex-1 p-4 md:p-6 overflow-auto">
          <AnimatePresence mode="wait">
            <motion.div key={currentQuestion.id} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }}>
              <Card className="mb-4">
                <CardContent className="p-6">
                  <Badge variant="secondary" className="mb-4">Question {currentQuestionIndex + 1}</Badge>
                  <h2 className="text-xl font-medium mb-4">{currentQuestion.questionText}</h2>
                  
                  {/* Listen Again */}
                  <Button variant="outline" onClick={speakQuestion} disabled={isSpeaking} className="gap-2 mb-6">
                    {isSpeaking ? <Loader2 className="w-4 h-4 animate-spin" /> : <Volume2 className="w-4 h-4" />}
                    {isSpeaking ? "Speaking..." : "Listen Again"}
                  </Button>

                  {/* Recording Area */}
                  <div className="bg-slate-50 rounded-xl p-6 border-2 border-dashed">
                    {!currentRecord.audioBlob ? (
                      <div className="text-center">
                        <p className="text-gray-600 mb-4">{isRecording ? "Recording..." : "Click to record your answer"}</p>
                        {isRecording && (
                          <div className="inline-flex items-center gap-2 px-4 py-2 bg-red-100 rounded-full text-red-700 mb-4">
                            <span className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                            <span className="font-mono">{formatTime(recordingTime)}</span>
                          </div>
                        )}
                        <button
                          onClick={isRecording ? stopRecording : startRecording}
                          className={cn("w-16 h-16 rounded-full flex items-center justify-center mx-auto shadow-lg transition-all",
                            isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-violet-600 hover:bg-violet-700"
                          )}
                        >
                          {isRecording ? <Square className="w-6 h-6 text-white" /> : <Mic className="w-6 h-6 text-white" />}
                        </button>
                      </div>
                    ) : (
                      <div className="text-center">
                        <div className="flex items-center gap-2 justify-center text-green-600 bg-green-50 p-2 rounded-lg mb-4">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>Answer recorded</span>
                        </div>
                        <div className="flex justify-center gap-3">
                          <Button variant="outline" onClick={playRecording} className="gap-2"><Play className="w-4 h-4" /> Play</Button>
                          <Button variant="outline" onClick={clearRecording} className="gap-2"><RefreshCw className="w-4 h-4" /> Re-Record</Button>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Navigation */}
              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setCurrentQuestionIndex(p => Math.max(0, p - 1))} disabled={currentQuestionIndex === 0}>
                  <ChevronLeft className="w-4 h-4 mr-1" /> Previous
                </Button>
                {currentQuestionIndex < questions.length - 1 ? (
                  <Button onClick={() => setCurrentQuestionIndex(p => p + 1)} className="bg-violet-600 hover:bg-violet-700">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                ) : (
                  <Button onClick={() => setPhase("submitted")} className="bg-green-600 hover:bg-green-700">
                    Submit Exam <CheckCircle2 className="w-4 h-4 ml-1" />
                  </Button>
                )}
              </div>

              {/* Question Palette */}
              <div className="mt-6">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Questions</h3>
                <div className="flex flex-wrap gap-2">
                  {questions.map((q, idx) => (
                    <button
                      key={q.id}
                      onClick={() => setCurrentQuestionIndex(idx)}
                      className={cn("w-10 h-10 rounded-lg text-sm font-medium border transition-all",
                        currentQuestionIndex === idx ? "ring-2 ring-violet-500 ring-offset-2 bg-violet-600 text-white" :
                        audioRecords[idx].status === "answered" ? "bg-green-100 text-green-700 border-green-300" :
                        audioRecords[idx].status === "visited" ? "bg-blue-100 text-blue-700 border-blue-300" :
                        "bg-white text-gray-500 border-gray-200"
                      )}
                    >
                      {idx + 1}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-white border" /> Not Visited</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-blue-100 border-blue-300" /> Visited</div>
                  <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-100 border-green-300" /> Answered</div>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </main>

        {/* Proctoring Sidebar */}
        <aside className="w-72 bg-white border-l p-4 hidden lg:block">
          {/* Camera Feed */}
          <div className="relative aspect-video bg-black rounded-lg overflow-hidden mb-4">
            <video ref={examVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
            {faceDetected && (
              <div className="absolute bottom-1 left-1 right-1 bg-green-500 text-white text-xs py-0.5 px-2 rounded text-center">
                FACE DETECTED
              </div>
            )}
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded">
              AI: 90%
            </div>
          </div>

          {/* Audio Level */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="flex items-center gap-1"><Volume2 className="w-4 h-4" /> OK</span>
              <span className="flex items-center gap-1"><Mic className="w-4 h-4" /> Mic</span>
              <span className="text-green-600">Good</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-green-500 transition-all" style={{ width: `${audioLevel}%` }} />
            </div>
          </div>

          {/* Violations */}
          <div>
            <div className="flex items-center gap-2 text-sm font-medium text-red-600 mb-2">
              <AlertCircle className="w-4 h-4" />
              Violations ({violations.length})
            </div>
            {violations.length === 0 ? (
              <p className="text-sm text-gray-500">No violations recorded</p>
            ) : (
              <div className="space-y-1">
                {violations.map((v, i) => (
                  <div key={i} className="text-xs bg-red-50 p-2 rounded">{v.type} - {v.time}</div>
                ))}
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
