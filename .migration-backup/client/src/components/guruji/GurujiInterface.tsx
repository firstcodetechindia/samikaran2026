import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Mic, Send, Volume2, VolumeX, History, HelpCircle, Settings, Plus, Globe, AlertCircle, Coins, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { TaraAvatar, TaraGreeting } from "./TaraAvatar";
import { AILibrary } from "./AILibrary";
import taraAvatarImage from "@/assets/images/mira-avatar.webp";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { useQuery, useMutation } from "@tanstack/react-query";

type AvatarState = "idle" | "listening" | "thinking" | "speaking" | "error";

function getAuthHeaders(): Record<string, string> {
  const headers: Record<string, string> = {};
  
  const userStr = localStorage.getItem("samikaran_user");
  const sessionToken = localStorage.getItem("samikaran_session_token");
  
  if (userStr) {
    try {
      const user = JSON.parse(userStr);
      if (user?.id) headers["X-User-Id"] = String(user.id);
    } catch {}
  }
  
  if (sessionToken) {
    headers["X-Session-Token"] = sessionToken;
  }
  
  return headers;
}

async function gurujiApiRequest(method: string, url: string, body?: any) {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...getAuthHeaders(),
  };
  const res = await fetch(url, {
    method,
    headers,
    credentials: "include",
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: "Request failed" }));
    throw new Error(error.message || "Request failed");
  }
  return res;
}

interface Message {
  id: number;
  role: "student" | "guruji" | "mira";
  content: string;
  audioUrl?: string;
  imageUrl?: string;
  createdAt: string;
}

interface GurujiInterfaceProps {
  isOpen: boolean;
  onClose: () => void;
  studentId: number;
  studentName: string;
  gradeLevel?: number;
}

export function GurujiInterface({ 
  isOpen, 
  onClose, 
  studentId, 
  studentName,
  gradeLevel 
}: GurujiInterfaceProps) {
  const [avatarState, setAvatarState] = useState<AvatarState>("idle");
  const [inputText, setInputText] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [relatedQuestions, setRelatedQuestions] = useState<string[]>([]);
  const [currentAiProvider, setCurrentAiProvider] = useState<string>("");
  const [isMuted, setIsMuted] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTaraSpeaking, setIsTaraSpeaking] = useState(false);
  const [spokenLanguage, setSpokenLanguage] = useState<"hi" | "en" | null>(null);
  const currentAudioRef = useRef<HTMLAudioElement | null>(null);
  
  // Persistent AudioContext for reliable mobile playback
  const audioContextRef = useRef<AudioContext | null>(null);
  const audioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const [showTranscript, setShowTranscript] = useState(true);
  const [isLibraryOpen, setIsLibraryOpen] = useState(false);
  const [voiceLanguage, setVoiceLanguage] = useState<"hi" | "en">("en");
  const [showLanguageSelection, setShowLanguageSelection] = useState(true); // Always show language selection on open
  const [showTaraGreeting, setShowTaraGreeting] = useState(false);
  const [showInsufficientCreditsModal, setShowInsufficientCreditsModal] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const { toast } = useToast();

  const { data: credits } = useQuery({
    queryKey: ["/api/guruji/credits", studentId],
    queryFn: async () => {
      const res = await gurujiApiRequest("GET", `/api/guruji/credits/${studentId}`);
      return res.json();
    },
    enabled: isOpen && !!studentId,
  });

  // Track if we've already loaded the last conversation
  const [hasLoadedLastConversation, setHasLoadedLastConversation] = useState(false);

  // Auto-load most recent conversation on open
  const { data: recentConversations } = useQuery({
    queryKey: ["/api/guruji/conversations", studentId, "recent"],
    queryFn: async () => {
      const res = await gurujiApiRequest("GET", `/api/guruji/conversations/${studentId}?limit=1`);
      return res.json();
    },
    enabled: isOpen && !!studentId && !hasLoadedLastConversation,
  });

  // Load last conversation automatically when TARA opens
  useEffect(() => {
    if (isOpen && recentConversations && recentConversations.length > 0 && !hasLoadedLastConversation) {
      const lastConv = recentConversations[0];
      setHasLoadedLastConversation(true);
      // Fetch messages of the last conversation
      gurujiApiRequest("GET", `/api/guruji/conversation/${lastConv.id}`)
        .then(res => res.json())
        .then(data => {
          if (data.messages && data.messages.length > 0) {
            setConversationId(lastConv.id);
            setMessages(data.messages.map((m: any) => ({
              id: m.id,
              role: m.role,
              content: m.content,
              createdAt: m.createdAt
            })));
          }
        })
        .catch(err => console.error("Failed to load recent conversation:", err));
    }
  }, [isOpen, recentConversations, hasLoadedLastConversation]);

  const startConversation = useMutation({
    mutationFn: async () => {
      const res = await gurujiApiRequest("POST", "/api/guruji/conversations", {
        studentId,
        mode: isVoiceMode ? "voice" : "text",
        language: "en",
        gradeLevel,
      });
      return res.json();
    },
    onSuccess: (data) => {
      setConversationId(data.id);
      setMessages([]);
    },
  });

  const sendMessage = useMutation({
    mutationFn: async ({ message, isVoice }: { message: string; isVoice: boolean }) => {
      if (!conversationId) {
        const conv = await startConversation.mutateAsync();
        const res = await gurujiApiRequest("POST", "/api/guruji/chat", {
          conversationId: conv.id,
          studentId,
          message,
          isVoice,
          gradeLevel,
        });
        const data = await res.json();
        return { ...data, sentMessage: message, wasVoice: isVoice };
      }
      const res = await gurujiApiRequest("POST", "/api/guruji/chat", {
        conversationId,
        studentId,
        message,
        isVoice,
        gradeLevel,
      });
      const data = await res.json();
      return { ...data, sentMessage: message, wasVoice: isVoice };
    },
    onMutate: () => {
      setAvatarState("thinking");
    },
    onSuccess: async (data) => {
      if (!conversationId && data.conversationId) {
        setConversationId(data.conversationId);
      }
      
      // Use sentMessage from context to avoid stale inputText issue
      setMessages(prev => [
        ...prev,
        { id: Date.now(), role: "student", content: data.sentMessage, createdAt: new Date().toISOString() },
        { id: data.message.id, role: "guruji", content: data.response, imageUrl: data.imageUrl, createdAt: new Date().toISOString() },
      ]);
      setInputText("");
      
      // Store related questions and AI provider info
      if (data.relatedQuestions && data.relatedQuestions.length > 0) {
        setRelatedQuestions(data.relatedQuestions);
      } else {
        setRelatedQuestions([]);
      }
      if (data.aiProvider) {
        setCurrentAiProvider(`${data.aiProvider}:${data.aiModel}`);
      }
      
      queryClient.invalidateQueries({ queryKey: ["/api/guruji/credits", studentId] });

      // Use wasVoice from response (passed through mutation) to ensure correct mode
      console.log(`[TARA] Voice response check - wasVoice: ${data.wasVoice}, isMuted: ${isMuted}`);
      if (data.wasVoice && !isMuted) {
        console.log(`[TARA] Starting TTS for voice response...`);
        await speakResponse(data.response);
      } else {
        console.log(`[TARA] Skipping TTS - not voice mode or muted`);
        setAvatarState("idle");
      }
    },
    onError: (error: any) => {
      setAvatarState("error");
      // Check if it's an insufficient credits error
      if (error.message?.toLowerCase().includes("insufficient") || error.message?.toLowerCase().includes("credits")) {
        setShowInsufficientCreditsModal(true);
      } else {
        toast({
          title: "Error",
          description: error.message || "Failed to get response",
          variant: "destructive",
        });
      }
      setTimeout(() => setAvatarState("idle"), 2000);
    },
  });

  // Detect if text is primarily Hindi
  const detectLanguage = (text: string): string => {
    const hindiPattern = /[\u0900-\u097F]/;
    const hindiChars = (text.match(/[\u0900-\u097F]/g) || []).length;
    const totalChars = text.replace(/\s/g, '').length;
    return hindiChars / totalChars > 0.3 ? "hi" : "en";
  };

  // Track if audio is loading (generating TTS)
  const [isGeneratingAudio, setIsGeneratingAudio] = useState(false);

  const speakResponse = async (text: string, overrideLanguage?: "hi" | "en") => {
    try {
      // First show "Generating audio..." feedback
      setAvatarState("thinking");
      setIsGeneratingAudio(true);
      
      // Use spoken language if available, otherwise detect from text
      const language = overrideLanguage || spokenLanguage || detectLanguage(text);
      console.log(`[TARA TTS] Calling TTS API with language: ${language}, text length: ${text.length}`);
      
      const res = await fetch("/api/guruji/tts", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...getAuthHeaders() },
        credentials: "include",
        body: JSON.stringify({ text, language }),
      });
      
      if (!res.ok) {
        const errorData = await res.text();
        console.error(`[TARA TTS] API error - status: ${res.status}, body: ${errorData}`);
        throw new Error(`TTS failed: ${res.status}`);
      }
      
      const audioBlob = await res.blob();
      console.log(`[TARA TTS] Received audio blob, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
      
      // Use Web Audio API for more reliable playback on mobile
      const audioContext = getAudioContext();
      console.log(`[TARA TTS] AudioContext state: ${audioContext.state}`);
      
      // Ensure context is running
      if (audioContext.state === 'suspended') {
        await audioContext.resume();
        console.log(`[TARA TTS] AudioContext resumed, new state: ${audioContext.state}`);
      }
      
      // Decode audio data
      const arrayBuffer = await audioBlob.arrayBuffer();
      console.log(`[TARA TTS] Decoding ${arrayBuffer.byteLength} bytes...`);
      
      const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
      console.log(`[TARA TTS] Decoded audio: ${audioBuffer.duration.toFixed(2)}s, ${audioBuffer.numberOfChannels} channels`);
      
      // Stop any previous audio
      if (audioSourceRef.current) {
        try {
          audioSourceRef.current.stop();
        } catch (e) {}
      }
      
      // Create and play source
      const source = audioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(audioContext.destination);
      audioSourceRef.current = source;
      
      // Audio is ready, now switch to speaking state
      setIsGeneratingAudio(false);
      setAvatarState("speaking");
      setIsTaraSpeaking(true);
      
      source.onended = () => {
        console.log(`[TARA TTS] Audio playback completed`);
        setAvatarState("idle");
        setIsTaraSpeaking(false);
        setSpokenLanguage(null);
        audioSourceRef.current = null;
      };
      
      console.log(`[TARA TTS] Starting Web Audio playback...`);
      source.start(0);
      console.log(`[TARA TTS] Web Audio started successfully!`);
      
    } catch (error: any) {
      console.error("[TARA TTS] Error in speakResponse:", error);
      setIsGeneratingAudio(false);
      setAvatarState("idle");
      setIsTaraSpeaking(false);
      setSpokenLanguage(null);
      
      // Fallback to HTML5 Audio if Web Audio fails
      if (error.message?.includes('decodeAudioData') || error.name === 'EncodingError') {
        console.log("[TARA TTS] Web Audio failed, trying HTML5 Audio fallback...");
        try {
          const language = overrideLanguage || spokenLanguage || detectLanguage(text);
          const res = await fetch("/api/guruji/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json", ...getAuthHeaders() },
            credentials: "include",
            body: JSON.stringify({ text, language }),
          });
          const blob = await res.blob();
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          currentAudioRef.current = audio;
          setAvatarState("speaking");
          setIsTaraSpeaking(true);
          audio.onended = () => {
            setAvatarState("idle");
            setIsTaraSpeaking(false);
            URL.revokeObjectURL(url);
          };
          await audio.play();
          return;
        } catch (fallbackError) {
          console.error("[TARA TTS] HTML5 fallback also failed:", fallbackError);
        }
      }
      
      toast({
        title: "Voice Error",
        description: "Could not play voice response. Tap 'Play Response' button below the message.",
        variant: "destructive",
      });
    }
  };

  const recordingStartTime = useRef<number>(0);

  // Get or create persistent AudioContext (must be called during user gesture first time)
  const getAudioContext = (): AudioContext => {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass();
      console.log("[TARA] Created new persistent AudioContext");
    }
    
    // Always try to resume if suspended
    if (audioContextRef.current.state === 'suspended') {
      audioContextRef.current.resume();
      console.log("[TARA] Resumed AudioContext from suspended state");
    }
    
    return audioContextRef.current;
  };
  
  // Unlock audio playback for mobile browsers (must be called during user gesture)
  const unlockAudioPlayback = () => {
    try {
      // Get/create and unlock the persistent AudioContext
      const audioContext = getAudioContext();
      
      // Play silent oscillator to fully unlock the context
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = 0; // Silent
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      oscillator.start(0);
      oscillator.stop(0.01);
      
      console.log("[TARA] AudioContext unlocked, state:", audioContext.state);
    } catch (e) {
      console.log("[TARA] Audio unlock error (non-fatal):", e);
    }
  };

  const startRecording = async () => {
    try {
      // CRITICAL: Unlock audio during user gesture for mobile browsers
      unlockAudioPlayback();
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartTime.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const recordingDuration = Date.now() - recordingStartTime.current;
        stream.getTracks().forEach(track => track.stop());
        
        // Check minimum recording duration (1 second)
        if (recordingDuration < 1000) {
          toast({
            title: "Recording Too Short",
            description: "Please hold the button longer and speak clearly.",
            variant: "destructive",
          });
          setAvatarState("idle");
          return;
        }
        
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        await processAudio(audioBlob);
      };

      mediaRecorder.start();
      setIsRecording(true);
      setAvatarState("listening");
    } catch (error) {
      console.error("Failed to start recording:", error);
      toast({
        title: "Microphone Error",
        description: "Please allow microphone access to use voice mode.",
        variant: "destructive",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processAudio = async (audioBlob: Blob) => {
    try {
      setAvatarState("thinking");
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      
      reader.onloadend = async () => {
        const base64 = (reader.result as string).split(",")[1];
        
        const sttRes = await fetch("/api/guruji/stt", {
          method: "POST",
          headers: { "Content-Type": "application/json", ...getAuthHeaders() },
          credentials: "include",
          body: JSON.stringify({ audioBase64: base64, language: voiceLanguage }),
        });
        
        if (!sttRes.ok) {
          const errorData = await sttRes.json().catch(() => ({}));
          if (errorData.voiceUnavailable) {
            setIsVoiceMode(false);
            toast({
              title: "Voice Mode Unavailable",
              description: "Voice recognition is not available. Please type your question instead.",
              variant: "destructive",
            });
            setAvatarState("idle");
            return;
          }
          throw new Error(errorData.message || "Speech recognition failed");
        }
        
        const { transcript, detectedLanguage } = await sttRes.json();
        console.log(`[VOICE] Detected language: ${detectedLanguage}, Transcript: ${transcript}`);
        
        // Save detected language for TTS response (respond in the language student spoke)
        setSpokenLanguage(detectedLanguage as "hi" | "en");
        
        // Voice mode - send directly with isVoice: true
        // Don't show transcript in text box - direct voice flow
        sendMessage.mutate({ message: transcript, isVoice: true });
      };
    } catch (error: any) {
      console.error("Audio processing error:", error);
      setAvatarState("error");
      toast({
        title: "Voice Error",
        description: error.message || "Failed to process voice. Please type your question instead.",
        variant: "destructive",
      });
      setTimeout(() => setAvatarState("idle"), 2000);
    }
  };

  const handleSubmit = () => {
    if (!inputText.trim()) return;
    // Text mode - explicitly pass isVoice: false
    sendMessage.mutate({ message: inputText.trim(), isVoice: false });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const checkIfScrollNeeded = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const atBottom = scrollHeight - scrollTop - clientHeight < 80;
    if (!atBottom && scrollHeight > clientHeight) {
      setShowScrollButton(true);
    }
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    const t1 = setTimeout(checkIfScrollNeeded, 300);
    const t2 = setTimeout(checkIfScrollNeeded, 800);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [messages, checkIfScrollNeeded]);

  useEffect(() => {
    if (isOpen && messages.length > 0) {
      const t = setTimeout(checkIfScrollNeeded, 500);
      return () => clearTimeout(t);
    }
  }, [isOpen, messages.length, checkIfScrollNeeded]);

  const handleChatScroll = useCallback(() => {
    const container = chatContainerRef.current;
    if (!container) return;
    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 80;
    setShowScrollButton(!isNearBottom && scrollHeight > clientHeight);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
  };

  useEffect(() => {
    if (!isOpen) {
      setConversationId(null);
      setMessages([]);
      setAvatarState("idle");
    }
  }, [isOpen]);

  // Hide ChatWidget when TARA is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("tara-open");
    } else {
      document.body.classList.remove("tara-open");
    }
    return () => {
      document.body.classList.remove("tara-open");
    };
  }, [isOpen]);

  if (!isOpen) return null;

  // Language selection handler
  const handleLanguageSelect = (lang: "hi" | "en") => {
    setVoiceLanguage(lang);
    // Don't persist language - always show selection on open
    setShowLanguageSelection(false);
    setShowTaraGreeting(true); // Show TARA greeting after language selection
  };
  
  // Handle greeting completion
  const handleGreetingComplete = () => {
    setShowTaraGreeting(false);
  };

  return (
    <AnimatePresence>
      {/* Language Selection Screen - Shows first time */}
      {showLanguageSelection ? (
        <motion.div
          className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="tara-language-selection"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent" />
          
          <div className="relative h-full flex flex-col items-center justify-center p-6">
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              onClick={onClose}
              className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
              data-testid="button-close-language-selection"
            >
              <X className="w-5 h-5 text-white/80" />
            </motion.button>

            {/* TARA Avatar */}
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="w-32 h-32 sm:w-40 sm:h-40 rounded-full overflow-hidden shadow-2xl shadow-purple-500/40 mb-8 ring-4 ring-purple-400/30 bg-gradient-to-br from-purple-100 to-pink-100 p-2"
            >
              <img 
                src={taraAvatarImage} 
                alt="TARA" 
                className="w-full h-full object-contain rounded-full"
              />
            </motion.div>

            {/* Title */}
            <motion.h1 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-white text-2xl sm:text-3xl font-bold mb-2"
            >
              Welcome to TARA
            </motion.h1>
            
            <motion.p 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-white/60 text-center mb-8 max-w-md"
            >
              Choose your preferred language for voice interaction
            </motion.p>

            {/* Language Options */}
            <motion.div 
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 w-full max-w-md"
            >
              <button
                onClick={() => handleLanguageSelect("hi")}
                className="flex-1 p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-500/20 border-2 border-orange-500/40 hover:border-orange-400 hover:bg-orange-500/30 transition-all"
                data-testid="button-select-hindi"
              >
                <div className="text-4xl mb-3">🇮🇳</div>
                <div className="text-white text-xl font-bold mb-1">हिंदी</div>
                <div className="text-white/60 text-sm">Hindi</div>
              </button>

              <button
                onClick={() => handleLanguageSelect("en")}
                className="flex-1 p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 border-2 border-blue-500/40 hover:border-blue-400 hover:bg-blue-500/30 transition-all"
                data-testid="button-select-english"
              >
                <div className="text-4xl mb-3">🌐</div>
                <div className="text-white text-xl font-bold mb-1">English</div>
                <div className="text-white/60 text-sm">अंग्रेज़ी</div>
              </button>
            </motion.div>

            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-white/40 text-xs mt-6 text-center"
            >
              You can change this later from the header
            </motion.p>
          </div>
        </motion.div>
      ) : showTaraGreeting ? (
        <motion.div
          className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 overflow-hidden"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          data-testid="tara-greeting"
        >
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent" />
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            onClick={onClose}
            className="absolute top-4 right-4 sm:top-6 sm:right-6 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center hover:bg-white/20 transition-all"
            data-testid="button-close-greeting"
          >
            <X className="w-5 h-5 text-white/80" />
          </motion.button>
          <div className="relative h-full flex items-center justify-center">
            <TaraGreeting 
              studentName={studentName}
              language={voiceLanguage}
              onComplete={handleGreetingComplete}
            />
          </div>
        </motion.div>
      ) : (
      <motion.div
        className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900/90 to-slate-900 overflow-hidden"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        data-testid="tara-interface"
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/30 via-transparent to-transparent" />

        <div className="relative h-full flex flex-col">
          {/* Header - Mobile Responsive */}
          <header className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3 border-b border-white/10 bg-black/20 backdrop-blur-sm">
            <div className="flex items-center gap-2 sm:gap-3">
              <TaraAvatar state="idle" size="sm" />
              <div>
                <h1 className="text-white font-bold text-sm sm:text-lg tracking-wide">TARA</h1>
                <p className="text-white text-[10px] sm:text-xs hidden sm:block">Helping You Learn Better</p>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-3">
              {/* Credit Gauge Meter */}
              <div className="flex items-center gap-2 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full bg-black/30 border border-white/10">
                <div className="relative w-8 h-4 sm:w-10 sm:h-5">
                  <svg viewBox="0 0 100 50" className="w-full h-full">
                    {/* Background arc segments */}
                    <path d="M 10 45 A 40 40 0 0 1 36 12" fill="none" stroke="#ef4444" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                    <path d="M 38 11 A 40 40 0 0 1 62 11" fill="none" stroke="#eab308" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                    <path d="M 64 12 A 40 40 0 0 1 90 45" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinecap="round" opacity="0.3" />
                    {/* Active indicator based on credits */}
                    {(() => {
                      const totalCredits = credits?.totalCredits || 0;
                      // Calculate gauge position: 0-100 credits = red, 100-500 = yellow, 500+ = green
                      let needleAngle = -90; // Start at left
                      let needleColor = "#ef4444";
                      if (totalCredits >= 500) {
                        needleAngle = 45; // Green zone
                        needleColor = "#22c55e";
                      } else if (totalCredits >= 100) {
                        needleAngle = 0; // Yellow zone
                        needleColor = "#eab308";
                      } else if (totalCredits >= 50) {
                        needleAngle = -30; // Orange-red
                        needleColor = "#f97316";
                      } else {
                        needleAngle = -60; // Red zone
                        needleColor = "#ef4444";
                      }
                      const rad = (needleAngle * Math.PI) / 180;
                      const x2 = 50 + 30 * Math.cos(rad);
                      const y2 = 45 - 30 * Math.sin(rad);
                      return (
                        <>
                          <line x1="50" y1="45" x2={x2} y2={y2} stroke={needleColor} strokeWidth="3" strokeLinecap="round" />
                          <circle cx="50" cy="45" r="4" fill={needleColor} />
                        </>
                      );
                    })()}
                  </svg>
                </div>
                <span className={`text-xs sm:text-sm font-bold ${
                  (credits?.totalCredits || 0) >= 500 ? 'text-green-400' :
                  (credits?.totalCredits || 0) >= 100 ? 'text-yellow-400' :
                  'text-red-400'
                }`}>
                  {credits?.totalCredits || 0}
                </span>
              </div>
              <Button 
                variant="ghost" 
                size="icon" 
                onClick={() => {
                  setConversationId(null);
                  setMessages([]);
                  setRelatedQuestions([]);
                  setAvatarState("idle");
                  toast({ title: "New chat started", description: "Ask TARA anything!" });
                }} 
                className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 sm:h-9 sm:w-9" 
                data-testid="button-new-chat"
                title="New Chat"
              >
                <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsLibraryOpen(true)} className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 sm:h-9 sm:w-9" data-testid="button-open-library" title="Chat History">
                <History className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setIsMuted(!isMuted)} className="text-white/60 hover:text-white hover:bg-white/10 hidden sm:flex h-8 w-8 sm:h-9 sm:w-9" data-testid="button-mute">
                {isMuted ? <VolumeX className="w-4 h-4 sm:w-5 sm:h-5" /> : <Volume2 className="w-4 h-4 sm:w-5 sm:h-5" />}
              </Button>
              {/* Language Selector for Voice */}
              <Select 
                value={voiceLanguage} 
                onValueChange={(val: "hi" | "en") => {
                  setVoiceLanguage(val);
                  // Don't persist - session only
                }}
              >
                <SelectTrigger className="w-[70px] sm:w-[85px] h-8 sm:h-9 bg-white/10 border-white/20 text-white text-xs sm:text-sm" data-testid="select-voice-language">
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 mr-1 opacity-60" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="hi">हिंदी</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-white/60 hover:text-white hover:bg-white/10 h-8 w-8 sm:h-9 sm:w-9" data-testid="button-close-tara">
                <X className="w-4 h-4 sm:w-5 sm:h-5" />
              </Button>
            </div>
          </header>

          {/* Main Content - Responsive Layout */}
          <div className="flex-1 flex overflow-hidden">
            {/* Left Panel - Hidden on mobile, visible on md+ */}
            <div className="hidden md:flex w-1/5 min-w-[180px] max-w-[280px] border-r border-white/10 bg-black/20 backdrop-blur-sm flex-col items-center justify-center p-4 lg:p-6">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <TaraAvatar state={avatarState} size="lg" />
              </motion.div>

              <motion.p 
                className="mt-6 text-white/70 text-sm text-center"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {avatarState === "idle" && "Ready to help!"}
                {avatarState === "listening" && "Listening..."}
                {avatarState === "thinking" && (isGeneratingAudio ? "Generating audio..." : "Thinking...")}
                {avatarState === "speaking" && "Speaking..."}
                {avatarState === "error" && "Error occurred"}
              </motion.p>

              {/* Voice Button */}
              <motion.div className="mt-8 relative flex flex-col items-center" initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }}>
                {/* Pulsing rings when recording */}
                {isRecording && (
                  <>
                    <motion.div 
                      className="absolute w-16 h-16 rounded-full bg-red-500/30"
                      animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    />
                    <motion.div 
                      className="absolute w-16 h-16 rounded-full bg-red-500/20"
                      animate={{ scale: [1, 2], opacity: [0.4, 0] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.3 }}
                    />
                  </>
                )}
                <motion.button
                  className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all select-none ${
                    isRecording
                      ? "bg-red-500 shadow-xl shadow-red-500/60 ring-4 ring-red-400/60"
                      : "bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50"
                  }`}
                  style={{ touchAction: 'none', WebkitTouchCallout: 'none', WebkitUserSelect: 'none' } as React.CSSProperties}
                  whileTap={{ scale: 0.9 }}
                  animate={isRecording ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                  transition={isRecording ? { duration: 0.6, repeat: Infinity } : {}}
                  onMouseDown={startRecording}
                  onMouseUp={stopRecording}
                  onMouseLeave={stopRecording}
                  onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                  onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                  onContextMenu={(e) => e.preventDefault()}
                  disabled={sendMessage.isPending || isTaraSpeaking}
                  data-testid="button-record-voice"
                >
                  <Mic className={`w-7 h-7 text-white pointer-events-none ${isRecording ? "animate-pulse" : ""}`} />
                </motion.button>
                <p className={`text-xs text-center mt-2 select-none transition-all ${isRecording ? "text-red-400 font-semibold" : isTaraSpeaking ? "text-purple-400" : "text-white/40"}`}>
                  {isRecording ? "🎙️ Recording..." : isTaraSpeaking ? "TARA is speaking..." : "Hold to speak"}
                </p>
              </motion.div>
            </div>

            {/* Right Panel - 80% - Chat Area */}
            <div className="flex-1 flex flex-col bg-black/10 min-h-0 relative">
              {/* Messages Area - with padding bottom for input */}
              <div ref={chatContainerRef} onScroll={handleChatScroll} className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-6 pb-20 sm:pb-24">
                {messages.length === 0 ? (
                  <motion.div 
                    className="h-full flex flex-col items-center justify-center text-center px-2"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-r from-purple-600/20 to-pink-600/20 flex items-center justify-center mb-3 sm:mb-4">
                      <HelpCircle className="w-8 h-8 sm:w-10 sm:h-10 text-purple-400" />
                    </div>
                    <h2 className="text-white text-lg sm:text-xl font-semibold mb-2">
                      Namaste, {studentName}!
                    </h2>
                    <p className="text-white/60 max-w-md text-sm sm:text-base px-4">
                      I'm TARA, your AI learning companion. Ask me anything about your studies!
                    </p>
                    <div className="mt-4 sm:mt-6 flex flex-wrap gap-2 justify-center max-w-lg px-2">
                      {["What is photosynthesis?", "Explain equations", "Olympiad tips"].map((q) => (
                        <button
                          key={q}
                          onClick={() => { setInputText(q); }}
                          className="px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-white/5 border border-white/10 text-white/70 text-xs sm:text-sm hover:bg-white/10 hover:text-white transition-colors"
                        >
                          {q}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                ) : (
                  <div className="space-y-3 sm:space-y-4 max-w-3xl mx-auto">
                    {messages.map((msg) => (
                      <motion.div
                        key={msg.id}
                        className={`flex ${msg.role === "student" ? "justify-end" : "justify-start"}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className={`flex items-start gap-2 sm:gap-3 max-w-[90%] sm:max-w-[85%] ${msg.role === "student" ? "flex-row-reverse" : ""}`}>
                          {msg.role === "student" ? (
                            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center flex-shrink-0 bg-blue-600">
                              <span className="text-white text-[10px] sm:text-xs font-bold">
                                {studentName[0]}
                              </span>
                            </div>
                          ) : (
                            <img 
                              src={taraAvatarImage} 
                              alt="TARA" 
                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-full flex-shrink-0 object-cover"
                            />
                          )}
                          <div className={`rounded-xl sm:rounded-2xl px-3 sm:px-4 py-2 sm:py-3 ${
                            msg.role === "student"
                              ? "bg-blue-600/80 text-white"
                              : "bg-gradient-to-br from-purple-900/60 to-pink-900/40 text-white border border-purple-500/30 shadow-lg shadow-purple-500/10"
                          }`}>
                            {(() => {
                              // Extract all markdown images from content
                              const imgRegex = /!\[([^\]]*)\]\(([^)]+)\)/g;
                              const images: {alt: string, url: string}[] = [];
                              let match;
                              while ((match = imgRegex.exec(msg.content)) !== null) {
                                images.push({ alt: match[1], url: match[2] });
                              }
                              // Clean content - remove markdown image syntax
                              const cleanContent = msg.content.replace(/!\[[^\]]*\]\([^)]+\)/g, '').trim();
                              
                              return (
                                <>
                                  {/* Show imageUrl from API first */}
                                  {msg.imageUrl && (
                                    <div className="mb-3">
                                      <img 
                                        src={msg.imageUrl} 
                                        alt="TARA Image" 
                                        className="rounded-lg max-w-[280px] shadow-lg border border-white/20"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                      />
                                    </div>
                                  )}
                                  {/* Show images extracted from markdown */}
                                  {images.map((img, idx) => (
                                    <div key={idx} className="mb-3">
                                      <img 
                                        src={img.url} 
                                        alt={img.alt || "Image"} 
                                        className="rounded-lg max-w-[280px] shadow-lg border border-white/20"
                                        onError={(e) => (e.currentTarget.style.display = 'none')}
                                      />
                                    </div>
                                  ))}
                                  <p className="text-sm whitespace-pre-wrap leading-relaxed">{cleanContent}</p>
                                  {/* Play button for TARA messages in voice mode */}
                                  {msg.role === "guruji" && (
                                    <button
                                      onClick={() => speakResponse(msg.content)}
                                      className="mt-2 flex items-center gap-1 text-xs text-purple-300 hover:text-white transition-colors"
                                      data-testid={`button-play-response-${msg.id}`}
                                    >
                                      <Volume2 className="w-3 h-3" />
                                      <span>Play Response</span>
                                    </button>
                                  )}
                                </>
                              );
                            })()}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={messagesEndRef} />
                    
                    {/* Related Questions - Hidden while TARA is speaking */}
                    {relatedQuestions.length > 0 && !sendMessage.isPending && !isTaraSpeaking && (
                      <motion.div 
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-4 space-y-2"
                      >
                        <p className="text-xs text-white/50 mb-2">Related questions:</p>
                        <div className="flex flex-wrap gap-2">
                          {relatedQuestions.map((q, i) => (
                            <Button
                              key={i}
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setRelatedQuestions([]);
                                setInputText("");
                                // Related questions are clicked (text mode)
                                sendMessage.mutate({ message: q, isVoice: false });
                              }}
                              className="text-left text-sm bg-purple-500/20 text-purple-200 border-purple-500/30"
                              data-testid={`button-related-question-${i}`}
                            >
                              {q}
                            </Button>
                          ))}
                        </div>
                      </motion.div>
                    )}
                  </div>
                )}
              </div>

              {/* Scroll to Bottom Button */}
              <AnimatePresence>
                {showScrollButton && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.5, y: 20 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.5, y: 20 }}
                    transition={{ type: "spring", stiffness: 300, damping: 20 }}
                    onClick={scrollToBottom}
                    className="absolute bottom-20 sm:bottom-24 left-1/2 -translate-x-1/2 z-20 w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-gradient-to-br from-purple-600 to-fuchsia-500 border-2 border-white/30 shadow-xl shadow-purple-600/40 flex items-center justify-center hover:shadow-2xl hover:shadow-purple-500/50 hover:scale-110 transition-all cursor-pointer"
                    data-testid="button-scroll-to-bottom"
                    title="Scroll to latest"
                  >
                    <ArrowDown className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </motion.button>
                )}
              </AnimatePresence>

              {/* Input Area - Fixed at bottom - Mobile Responsive */}
              <div className="absolute bottom-0 left-0 right-0 p-2 sm:p-4 border-t border-white/10 bg-black/40 backdrop-blur-md z-10">
                <div className="max-w-3xl mx-auto flex gap-2 sm:gap-3 items-end">
                  {/* Mobile Voice Button with Recording Indicator */}
                  <div className="md:hidden relative flex-shrink-0 flex items-center justify-center" style={{ minWidth: '48px', minHeight: '48px' }}>
                    {/* Pulsing rings when recording - Mobile */}
                    {isRecording && (
                      <>
                        <motion.div 
                          className="absolute rounded-full bg-red-500/40"
                          style={{ width: '48px', height: '48px' }}
                          animate={{ scale: [1, 1.5], opacity: [0.7, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity }}
                        />
                        <motion.div 
                          className="absolute rounded-full bg-red-500/30"
                          style={{ width: '48px', height: '48px' }}
                          animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                        />
                      </>
                    )}
                    <motion.button
                      className={`relative rounded-full flex items-center justify-center transition-all select-none ${
                        isRecording
                          ? "bg-red-500 shadow-xl shadow-red-500/60 ring-4 ring-red-400/60"
                          : "bg-gradient-to-r from-purple-600 to-pink-600 shadow-lg shadow-purple-500/30"
                      }`}
                      style={{ 
                        width: '48px', 
                        height: '48px', 
                        touchAction: 'none', 
                        WebkitTouchCallout: 'none', 
                        WebkitUserSelect: 'none' 
                      } as React.CSSProperties}
                      whileTap={{ scale: 0.85 }}
                      animate={isRecording ? { scale: [1, 1.1, 1] } : { scale: 1 }}
                      transition={isRecording ? { duration: 0.5, repeat: Infinity } : {}}
                      onMouseDown={startRecording}
                      onMouseUp={stopRecording}
                      onMouseLeave={stopRecording}
                      onTouchStart={(e) => { e.preventDefault(); startRecording(); }}
                      onTouchEnd={(e) => { e.preventDefault(); stopRecording(); }}
                      onContextMenu={(e) => e.preventDefault()}
                      disabled={sendMessage.isPending || isTaraSpeaking}
                      data-testid="button-record-voice-mobile"
                    >
                      <Mic className={`w-6 h-6 text-white pointer-events-none ${isRecording ? "animate-pulse" : ""}`} />
                    </motion.button>
                  </div>
                  <Textarea
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isTaraSpeaking ? "Wait for TARA to finish speaking..." : "Ask TARA..."}
                    className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-white/40 resize-none min-h-[40px] sm:min-h-[48px] max-h-[100px] sm:max-h-[120px] text-sm sm:text-base"
                    rows={1}
                    disabled={sendMessage.isPending || isTaraSpeaking}
                    data-testid="input-tara-message"
                  />
                  <Button
                    onClick={handleSubmit}
                    disabled={!inputText.trim() || sendMessage.isPending || isTaraSpeaking}
                    className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 h-10 w-10 sm:h-12 sm:w-12 flex-shrink-0"
                    size="icon"
                    data-testid="button-send-message"
                  >
                    {sendMessage.isPending ? (
                      <div className="w-4 h-4 sm:w-5 sm:h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <Send className="w-4 h-4 sm:w-5 sm:h-5" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Library Modal */}
        <AILibrary
          isOpen={isLibraryOpen}
          onClose={() => setIsLibraryOpen(false)}
          studentId={studentId}
          onLoadConversation={(convId, msgs) => {
            setConversationId(convId);
            setMessages(msgs.map(m => ({
              id: m.id,
              role: m.role,
              content: m.content,
              createdAt: m.createdAt
            })));
          }}
        />

        {/* Insufficient Credits Modal */}
        <Dialog open={showInsufficientCreditsModal} onOpenChange={setShowInsufficientCreditsModal}>
          <DialogContent className="sm:max-w-md" data-testid="insufficient-credits-modal">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-3 text-xl">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <Coins className="w-6 h-6 text-red-600" />
                </div>
                Insufficient Credits
              </DialogTitle>
            </DialogHeader>
            <div className="py-4">
              <p className="text-muted-foreground text-center">
                You don't have enough credits to continue this conversation. 
                Please purchase more credits to keep learning with TARA.
              </p>
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    Current Balance: {credits?.totalCredits || 0} credits
                  </span>
                </div>
              </div>
            </div>
            <DialogFooter className="flex gap-2 sm:gap-2">
              <Button 
                variant="outline" 
                onClick={() => setShowInsufficientCreditsModal(false)}
                data-testid="button-cancel-credits"
              >
                Cancel
              </Button>
              <Button 
                className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white"
                onClick={() => {
                  setShowInsufficientCreditsModal(false);
                  onClose();
                  // Redirect to credits purchase page
                  window.location.href = "/student/credits";
                }}
                data-testid="button-buy-credits"
              >
                <Coins className="w-4 h-4 mr-2" />
                Buy Credits
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
