import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { MessageCircle, X, Send, Loader2, User, Minimize2, Maximize2, Mic, MicOff, Volume2, GraduationCap, Building, Users, Handshake } from "lucide-react";

type UserProfileType = "student" | "school" | "partner" | "group" | "admin" | "guest";

interface ProfileContext {
  type: UserProfileType;
  label: string;
  icon: React.ReactNode;
  color: string;
  greeting: string;
}

const PROFILE_CONTEXTS: Record<UserProfileType, ProfileContext> = {
  student: {
    type: "student",
    label: "Student",
    icon: <GraduationCap className="w-3 h-3" />,
    color: "bg-violet-100 text-violet-700",
    greeting: "How can I help you with your olympiad journey today?",
  },
  school: {
    type: "school",
    label: "School",
    icon: <Building className="w-3 h-3" />,
    color: "bg-emerald-100 text-emerald-700",
    greeting: "How can I assist with managing your school's olympiad participation?",
  },
  partner: {
    type: "partner",
    label: "Partner",
    icon: <Handshake className="w-3 h-3" />,
    color: "bg-purple-100 text-purple-700",
    greeting: "How can I help you grow your partner business today?",
  },
  group: {
    type: "group",
    label: "Group",
    icon: <Users className="w-3 h-3" />,
    color: "bg-blue-100 text-blue-700",
    greeting: "How can I assist with managing your educational group today?",
  },
  admin: {
    type: "admin",
    label: "Admin",
    icon: <User className="w-3 h-3" />,
    color: "bg-amber-100 text-amber-700",
    greeting: "How can I assist you with platform administration?",
  },
  guest: {
    type: "guest",
    label: "Guest",
    icon: <User className="w-3 h-3" />,
    color: "bg-gray-100 text-gray-700",
    greeting: "How may I help you today?",
  },
};

import avatar1 from "@/assets/avatars/avatar-1.webp";
import avatar2 from "@/assets/avatars/avatar-2.webp";
import avatar3 from "@/assets/avatars/avatar-3.webp";
import avatar4 from "@/assets/avatars/avatar-4.webp";
import avatar5 from "@/assets/avatars/avatar-5.webp";
import avatar6 from "@/assets/avatars/avatar-6.webp";
import avatar7 from "@/assets/avatars/avatar-7.webp";
import avatar8 from "@/assets/avatars/avatar-8.webp";
import avatarBot from "@/assets/avatars/avatar-bot.webp";

const AVATAR_MAP: Record<string, string> = {
  "avatar-1": avatar1,
  "avatar-2": avatar2,
  "avatar-3": avatar3,
  "avatar-4": avatar4,
  "avatar-5": avatar5,
  "avatar-6": avatar6,
  "avatar-7": avatar7,
  "avatar-8": avatar8,
  "avatar-bot": avatarBot,
};

const defaultAvatars = [avatar1, avatar2, avatar3, avatar4, avatar5, avatar6, avatar7, avatar8];

interface Message {
  id: string;
  sender: "user" | "agent" | "system";
  message: string;
  timestamp: Date;
  confidence?: number;
}

interface Agent {
  id: number;
  name: string;
  gender: string;
  tone: string;
  avatarUrl: string | null;
  languages: string[];
  isActive: boolean;
}

interface FlowNode {
  id: string;
  type: string;
  label: string;
  config: Record<string, unknown> | null;
  position: { x: number; y: number } | null;
}

interface FlowEdge {
  id: string;
  source: string;
  target: string;
  optionId: string | null;
  label: string | null;
}

interface GreetingFlowData {
  flow: { id: number; name: string } | null;
  nodes: FlowNode[];
  edges: FlowEdge[];
}

function getAgentAvatar(agent: Agent | undefined): string {
  if (!agent) return defaultAvatars[0];
  
  if (agent.avatarUrl && AVATAR_MAP[agent.avatarUrl]) {
    return AVATAR_MAP[agent.avatarUrl];
  }
  
  const index = agent.id % defaultAvatars.length;
  return defaultAvatars[index];
}

export default function ChatWidget() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [isAgentTyping, setIsAgentTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceStatus, setVoiceStatus] = useState<"idle" | "listening" | "processing" | "speaking">("idle");
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [voiceReplyMode, setVoiceReplyMode] = useState<"text" | "voice" | "both">("text");
  const [menuOptions, setMenuOptions] = useState<string[]>([]);
  const [currentFlowNodeId, setCurrentFlowNodeId] = useState<string | null>(null);
  const [lastInputWasVoice, setLastInputWasVoice] = useState(false);
  const [showEscalationPrompt, setShowEscalationPrompt] = useState(false);
  const [isEscalated, setIsEscalated] = useState(false);
  const sessionRetryCountRef = useRef(0);
  const [humanAgentName, setHumanAgentName] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const autoSendTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastTranscriptRef = useRef<string>("");
  const recognitionRef = useRef<unknown>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  const flowDataRef = useRef<GreetingFlowData | null>(null);

  const userProfile = useMemo<ProfileContext>(() => {
    const path = location.toLowerCase();
    // Student routes: /dashboard, /student-dashboard, /student/*
    if (path === "/dashboard" || path.startsWith("/dashboard/") || path.startsWith("/student")) return PROFILE_CONTEXTS.student;
    // School routes: /school, /school/*
    if (path.startsWith("/school")) return PROFILE_CONTEXTS.school;
    // Partner routes: /partner, /partner/*
    if (path.startsWith("/partner")) return PROFILE_CONTEXTS.partner;
    // Group routes: /group, /group/*
    if (path.startsWith("/group")) return PROFILE_CONTEXTS.group;
    // Admin routes: /admin, /super-admin, /sysctrl, /employee
    if (path.startsWith("/admin") || path.startsWith("/super-admin") || path.startsWith("/sysctrl") || path.startsWith("/employee")) return PROFILE_CONTEXTS.admin;
    return PROFILE_CONTEXTS.guest;
  }, [location]);

  const { data: agent, isLoading: agentLoading } = useQuery<Agent>({
    queryKey: ["/api/chatbot/agent"],
    enabled: isOpen,
  });

  const { data: voiceSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/chatbot/settings"],
    enabled: isOpen,
  });

  const { data: greetingFlow } = useQuery<GreetingFlowData>({
    queryKey: ["/api/chatbot/greeting-flow"],
    enabled: isOpen,
  });

  useEffect(() => {
    if (voiceSettings) {
      setVoiceEnabled(voiceSettings.voice_enabled === "true");
      setVoiceReplyMode((voiceSettings.voice_reply_mode as "text" | "voice" | "both") || "text");
    }
  }, [voiceSettings]);

  // Initialize speech synthesis and unlock audio on iOS
  const unlockSpeechSynthesis = () => {
    if ("speechSynthesis" in window) {
      // Cancel any existing speech
      window.speechSynthesis.cancel();
      
      // Speak empty string to unlock audio on iOS
      const silentUtterance = new SpeechSynthesisUtterance("");
      silentUtterance.volume = 0;
      window.speechSynthesis.speak(silentUtterance);
      
      // Load voices
      window.speechSynthesis.getVoices();
    }
  };

  useEffect(() => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.getVoices();
      window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
      };
    }
  }, []);
  
  // Unlock audio when chat opens
  useEffect(() => {
    if (isOpen) {
      unlockSpeechSynthesis();
    }
  }, [isOpen]);

  const handleAutoSend = (transcript: string) => {
    if (!transcript.trim() || !sessionToken || sendMessageMutation.isPending) return;
    
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    
    if (recognitionRef.current) {
      (recognitionRef.current as { stop: () => void }).stop();
    }
    
    setLastInputWasVoice(true);
    
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      sender: "user",
      message: transcript.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(transcript.trim());
    setInputValue("");
    lastTranscriptRef.current = "";
    setIsListening(false);
    setVoiceStatus("idle");
  };

  const initSpeechRecognition = () => {
    const win = window as unknown as Record<string, unknown>;
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      return null;
    }
    
    const SpeechRecognitionConstructor = (win.SpeechRecognition || win.webkitSpeechRecognition) as { new(): unknown } | undefined;
    if (!SpeechRecognitionConstructor) return null;
    
    const recognition = new SpeechRecognitionConstructor() as {
      continuous: boolean;
      interimResults: boolean;
      lang: string;
      onresult: (event: { results: ArrayLike<{ 0: { transcript: string }; isFinal?: boolean }> }) => void;
      onend: () => void;
      onerror: () => void;
      onspeechstart: () => void;
      onspeechend: () => void;
      start: () => void;
      stop: () => void;
    };
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = voiceSettings?.voice_accent || "hi-IN";
    
    recognition.onspeechstart = () => {
      setVoiceStatus("listening");
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
        autoSendTimerRef.current = null;
      }
    };
    
    recognition.onspeechend = () => {
      setVoiceStatus("processing");
    };
    
    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map(result => result[0].transcript)
        .join("");
      setInputValue(transcript);
      lastTranscriptRef.current = transcript;
      
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
      }
      
      const autoSendTimeout = parseInt(voiceSettings?.voice_auto_send_timeout || "5", 10);
      if (autoSendTimeout > 0 && transcript.trim()) {
        autoSendTimerRef.current = setTimeout(() => {
          if (lastTranscriptRef.current.trim()) {
            handleAutoSend(lastTranscriptRef.current);
          }
        }, autoSendTimeout * 1000);
      }
    };
    
    recognition.onend = () => {
      setIsListening(false);
      setVoiceStatus("idle");
    };
    
    recognition.onerror = () => {
      setIsListening(false);
      setVoiceStatus("idle");
      if (autoSendTimerRef.current) {
        clearTimeout(autoSendTimerRef.current);
        autoSendTimerRef.current = null;
      }
    };
    
    return recognition;
  };

  const startListening = () => {
    if (!recognitionRef.current) {
      recognitionRef.current = initSpeechRecognition();
    }
    
    if (recognitionRef.current) {
      setIsListening(true);
      setVoiceStatus("listening");
      (recognitionRef.current as { start: () => void }).start();
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      (recognitionRef.current as { stop: () => void }).stop();
      setIsListening(false);
      setVoiceStatus("idle");
    }
  };

  const stripMarkdown = (text: string): string => {
    return text
      .replace(/#{1,6}\s*/g, '')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .replace(/__([^_]+)__/g, '$1')
      .replace(/_([^_]+)_/g, '$1')
      .replace(/~~([^~]+)~~/g, '$1')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/```[\s\S]*?```/g, '')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/^[-*+]\s+/gm, '• ')
      .replace(/^\d+\.\s+/gm, '')
      .replace(/^>\s+/gm, '')
      .replace(/---+/g, '')
      .trim();
  };

  const stripForSpeech = (text: string): string => {
    const emojiRegex = /(\u00a9|\u00ae|[\u2000-\u3300]|\ud83c[\ud000-\udfff]|\ud83d[\ud000-\udfff]|\ud83e[\ud000-\udfff])/g;
    return stripMarkdown(text)
      .replace(emojiRegex, '')
      .replace(/\s+/g, ' ')
      .trim();
  };

  // Audio elements for seamless playback
  const audioElementsRef = useRef<HTMLAudioElement[]>([]);
  const currentAudioIndexRef = useRef(0);
  
  // Split text into chunks (max 180 chars, at sentence boundaries)
  const splitTextForTTS = (text: string): string[] => {
    const chunks: string[] = [];
    const sentences = text.split(/(?<=[।.!?])\s+/);
    let currentChunk = "";
    
    for (const sentence of sentences) {
      if ((currentChunk + " " + sentence).length <= 180) {
        currentChunk = currentChunk ? currentChunk + " " + sentence : sentence;
      } else {
        if (currentChunk) chunks.push(currentChunk.trim());
        if (sentence.length > 180) {
          const words = sentence.split(" ");
          currentChunk = "";
          for (const word of words) {
            if ((currentChunk + " " + word).length <= 180) {
              currentChunk = currentChunk ? currentChunk + " " + word : word;
            } else {
              if (currentChunk) chunks.push(currentChunk.trim());
              currentChunk = word;
            }
          }
        } else {
          currentChunk = sentence;
        }
      }
    }
    if (currentChunk) chunks.push(currentChunk.trim());
    return chunks.filter(c => c.length > 0);
  };
  
  // Fetch TTS audio for a chunk
  const fetchTTSAudio = async (text: string): Promise<string | null> => {
    try {
      const response = await fetch("/api/tts/speak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, lang: "en-IN" })
      });
      if (!response.ok) return null;
      const data = await response.json();
      return data.audio || null;
    } catch {
      return null;
    }
  };
  
  // Play next audio in queue
  const playNextAudio = () => {
    const index = currentAudioIndexRef.current;
    const audios = audioElementsRef.current;
    
    if (index >= audios.length) {
      setVoiceStatus("idle");
      setIsSpeaking(false);
      audioElementsRef.current = [];
      currentAudioIndexRef.current = 0;
      return;
    }
    
    const audio = audios[index];
    audio.onended = () => {
      currentAudioIndexRef.current++;
      playNextAudio();
    };
    audio.onerror = () => {
      currentAudioIndexRef.current++;
      playNextAudio();
    };
    audio.play().catch(() => {
      currentAudioIndexRef.current++;
      playNextAudio();
    });
  };
  
  const speakText = async (text: string) => {
    const cleanText = stripForSpeech(text);
    if (!cleanText) {
      setVoiceStatus("idle");
      setIsSpeaking(false);
      return;
    }
    
    // Stop any ongoing audio
    audioElementsRef.current.forEach(a => { a.pause(); a.src = ""; });
    audioElementsRef.current = [];
    currentAudioIndexRef.current = 0;
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
    
    setVoiceStatus("speaking");
    setIsSpeaking(true);
    
    // Split text and fetch all audio in parallel
    const chunks = splitTextForTTS(cleanText);
    const speed = parseFloat(voiceSettings?.voice_speed || "1.0");
    
    // Fetch all chunks in parallel for seamless playback
    const audioPromises = chunks.map(chunk => fetchTTSAudio(chunk));
    const audioUrls = await Promise.all(audioPromises);
    
    // Create audio elements
    const audios: HTMLAudioElement[] = [];
    for (const url of audioUrls) {
      if (url) {
        const audio = new Audio(url);
        audio.playbackRate = speed;
        audios.push(audio);
      }
    }
    
    if (audios.length === 0) {
      setVoiceStatus("idle");
      setIsSpeaking(false);
      return;
    }
    
    audioElementsRef.current = audios;
    currentAudioIndexRef.current = 0;
    
    // Start seamless playback
    playNextAudio();
  };

  const agentAvatar = getAgentAvatar(agent);
  const isOnline = agent?.isActive ?? true;

  const processFlowNode = (nodeId: string) => {
    const flowData = flowDataRef.current;
    if (!flowData || !flowData.nodes.length) return;

    const node = flowData.nodes.find(n => n.id === nodeId);
    if (!node) return;

    setCurrentFlowNodeId(nodeId);

    switch (node.type) {
      case "start": {
        const outEdge = flowData.edges.find(e => e.source === nodeId);
        if (outEdge) {
          processFlowNode(outEdge.target);
        }
        break;
      }
      case "message": {
        const messageText = (node.config?.message as string) || node.label;
        setMessages(prev => [...prev, {
          id: `msg_${Date.now()}`,
          sender: "agent",
          message: messageText,
          timestamp: new Date(),
        }]);
        const outEdge = flowData.edges.find(e => e.source === nodeId);
        if (outEdge) {
          setTimeout(() => processFlowNode(outEdge.target), 500);
        }
        break;
      }
      case "options": {
        const optionsConfig = node.config?.options;
        if (Array.isArray(optionsConfig)) {
          const optionLabels = optionsConfig.map(opt => 
            typeof opt === 'string' ? opt : (opt as { label?: string })?.label || ''
          ).filter(Boolean);
          setMenuOptions(optionLabels);
        }
        break;
      }
      case "ai_response": {
        setMenuOptions([]);
        break;
      }
      case "end": {
        setMenuOptions([]);
        setCurrentFlowNodeId(null);
        break;
      }
      default:
        break;
    }
  };

  const handleMenuOptionClick = (option: string) => {
    setMessages(prev => [...prev, {
      id: `msg_${Date.now()}`,
      sender: "user",
      message: option,
      timestamp: new Date(),
    }]);
    setMenuOptions([]);

    const flowData = flowDataRef.current;
    if (flowData && currentFlowNodeId) {
      const currentNode = flowData.nodes.find(n => n.id === currentFlowNodeId);
      if (currentNode?.type === "options") {
        const optionsConfig = currentNode.config?.options;
        if (Array.isArray(optionsConfig)) {
          const selectedOption = optionsConfig.find(opt => {
            const label = typeof opt === 'string' ? opt : (opt as { label?: string })?.label;
            return label === option;
          });
          
          const optionId = typeof selectedOption === 'object' && selectedOption !== null 
            ? (selectedOption as { id?: string })?.id 
            : undefined;
          
          const outEdge = flowData.edges.find(e => 
            e.source === currentFlowNodeId && e.optionId === optionId
          );
          
          if (outEdge) {
            setTimeout(() => processFlowNode(outEdge.target), 300);
          } else {
            sendMessageMutation.mutate(option);
          }
        } else {
          sendMessageMutation.mutate(option);
        }
      }
    } else {
      sendMessageMutation.mutate(option);
    }
  };

  const createSessionMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/chatbot/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          agentId: agent?.id, 
          language: "en",
          profileType: userProfile.type,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Session creation failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      if (data.sessionToken) {
        setSessionToken(data.sessionToken);
      } else {
        setSessionToken(`local_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`);
      }
      
      if (greetingFlow?.flow && greetingFlow.nodes.length > 0) {
        flowDataRef.current = greetingFlow;
        const startNode = greetingFlow.nodes.find(n => n.type === "start");
        if (startNode) {
          const greeting = `Hello! I'm ${agent?.name || "your assistant"} from Samikaran Olympiad. ${userProfile.greeting}`;
          setMessages([{
            id: `msg_${Date.now()}`,
            sender: "agent",
            message: greeting,
            timestamp: new Date(),
          }]);
          setTimeout(() => processFlowNode(startNode.id), 500);
          return;
        }
      }
      
      const greeting = `Hello! I'm ${agent?.name || "your assistant"} from Samikaran Olympiad. ${userProfile.greeting}`;
      setMessages([{
        id: `msg_${Date.now()}`,
        sender: "agent",
        message: greeting,
        timestamp: new Date(),
      }]);
    },
    onError: () => {
      setSessionToken(`local_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`);
      const greeting = `Hello! I'm ${agent?.name || "your assistant"} from Samikaran Olympiad. ${userProfile.greeting}`;
      setMessages([{
        id: `msg_${Date.now()}`,
        sender: "agent",
        message: greeting,
        timestamp: new Date(),
      }]);
    },
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      setIsAgentTyping(true);
      const res = await fetch("/api/chatbot/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          sessionToken, 
          message,
          profileType: userProfile.type,
        }),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(`Message send failed: ${res.status}`);
      }
      return res.json();
    },
    onSuccess: (data) => {
      setIsAgentTyping(false);
      
      if (data.newSessionToken) {
        setSessionToken(data.newSessionToken);
      }
      
      // Handle escalated status
      if (data.status === "escalated_to_human") {
        setIsEscalated(true);
        return;
      }
      
      // Normal response
      const responseText = data.response || data.message || "I received your message. Let me help you with that.";
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}`,
        sender: "agent",
        message: responseText,
        timestamp: new Date(),
        confidence: data.confidence,
      }]);
      if (lastInputWasVoice && voiceEnabled && (voiceReplyMode === "voice" || voiceReplyMode === "both")) {
        speakText(responseText);
      }
      
      // Show escalation prompt if needed
      if (data.shouldOfferEscalation) {
        setShowEscalationPrompt(true);
      }
    },
    onError: () => {
      setIsAgentTyping(false);
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}`,
        sender: "agent",
        message: "Thank you for reaching out! I can help you with exam registration, results, certificates, and account issues.\n\nPlease try asking your question again, or contact our support team at **+91 98765 43210**.",
        timestamp: new Date(),
      }]);
    },
  });

  const escalateMutation = useMutation({
    mutationFn: async (reason: string) => {
      const res = await fetch("/api/chatbot/escalate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken, reason }),
        credentials: "include",
      });
      return res.json();
    },
    onSuccess: (data) => {
      setIsEscalated(true);
      setShowEscalationPrompt(false);
      if (data.agentName) {
        setHumanAgentName(data.agentName);
      }
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}`,
        sender: "system",
        message: data.message,
        timestamp: new Date(),
      }]);
    },
  });

  const handleEscalationResponse = (wantsHuman: boolean) => {
    setShowEscalationPrompt(false);
    if (wantsHuman) {
      escalateMutation.mutate("User requested human agent");
    } else {
      setMessages(prev => [...prev, {
        id: `msg_${Date.now()}`,
        sender: "agent",
        message: "No problem! I'll continue to help you. What else can I assist you with?",
        timestamp: new Date(),
      }]);
    }
  };

  useEffect(() => {
    if (isOpen && !sessionToken && agent && !createSessionMutation.isPending) {
      sessionRetryCountRef.current = 0;
      createSessionMutation.mutate();
    }
  }, [isOpen, agent]);

  useEffect(() => {
    if (isOpen && !sessionToken && createSessionMutation.isError && agent && sessionRetryCountRef.current < 3) {
      const delay = Math.min(2000 * Math.pow(2, sessionRetryCountRef.current), 8000);
      const timer = setTimeout(() => {
        sessionRetryCountRef.current += 1;
        createSessionMutation.mutate();
      }, delay);
      return () => clearTimeout(timer);
    }
  }, [isOpen, sessionToken, agent, createSessionMutation.isError]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAgentTyping]);

  useEffect(() => {
    if (isOpen && !isMinimized) {
      inputRef.current?.focus();
    }
  }, [isOpen, isMinimized]);

  const handleSend = () => {
    if (!inputValue.trim() || !sessionToken || sendMessageMutation.isPending) return;
    
    if (autoSendTimerRef.current) {
      clearTimeout(autoSendTimerRef.current);
      autoSendTimerRef.current = null;
    }
    lastTranscriptRef.current = "";
    setLastInputWasVoice(false);
    
    const userMessage: Message = {
      id: `msg_${Date.now()}`,
      sender: "user",
      message: inputValue.trim(),
      timestamp: new Date(),
    };
    
    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate(inputValue.trim());
    setInputValue("");
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (agentLoading && isOpen) {
    return (
      <div className="fixed bottom-[78px] lg:bottom-6 right-4 lg:right-6 z-[60] print:hidden">
        <div className="w-14 h-14 md:w-16 md:h-16 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center shadow-lg">
          <Loader2 className="w-5 h-5 md:w-6 md:h-6 text-white animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="fixed bottom-[78px] lg:bottom-6 right-4 lg:right-6 z-[60] print:hidden" data-testid="chat-widget">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ duration: 0.2 }}
            className="mb-4"
          >
            <Card className={`w-[calc(100vw-2rem)] max-w-[380px] shadow-2xl ${isMinimized ? "h-auto" : "h-[380px] md:h-[520px]"} flex flex-col`}>
              <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/30">
                      <img 
                        src={agentAvatar} 
                        alt={agent?.name || "Support Agent"} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${
                      isOnline ? "bg-green-500" : "bg-gray-400"
                    }`} />
                  </div>
                  <div className="text-white">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-lg">{agent?.name || "Support"}</p>
                      {userProfile.type !== "guest" && (
                        <Badge className={`${userProfile.color} text-[10px] px-1.5 py-0.5 flex items-center gap-1`}>
                          {userProfile.icon}
                          {userProfile.label}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className={`w-2 h-2 rounded-full ${isOnline ? "bg-green-400 animate-pulse" : "bg-gray-400"}`} />
                      <p className="text-xs text-white/90">
                        {isAgentTyping ? "typing..." : isOnline ? "Online" : "Away"}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setIsMinimized(!isMinimized)}
                    data-testid="button-minimize-chat"
                  >
                    {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    className="h-8 w-8 text-white hover:bg-white/20"
                    onClick={() => setIsOpen(false)}
                    data-testid="button-close-chat"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              {!isMinimized && (
                <>
                  <ScrollArea className="flex-1 min-h-0 p-4">
                    <div className="space-y-4">
                      {messages.map((msg) => (
                        <motion.div
                          key={msg.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                        >
                          <div className={`flex items-end gap-2 max-w-[85%] ${msg.sender === "user" ? "flex-row-reverse" : ""}`}>
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                              {msg.sender === "user" ? (
                                <div className="w-full h-full bg-primary flex items-center justify-center">
                                  <User className="w-4 h-4 text-primary-foreground" />
                                </div>
                              ) : (
                                <img 
                                  src={agentAvatar} 
                                  alt={agent?.name || "Agent"} 
                                  className="w-full h-full object-cover"
                                />
                              )}
                            </div>
                            <div className={`rounded-2xl px-4 py-2.5 ${
                              msg.sender === "user"
                                ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white rounded-br-sm"
                                : "bg-muted rounded-bl-sm"
                            }`}>
                              <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.sender === "agent" ? stripMarkdown(msg.message) : msg.message}</p>
                              <p className={`text-xs mt-1 ${
                                msg.sender === "user" ? "text-white/70" : "text-muted-foreground"
                              }`}>
                                {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                      
                      {isAgentTyping && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex justify-start"
                        >
                          <div className="flex items-end gap-2">
                            <div className="w-8 h-8 rounded-full overflow-hidden shrink-0">
                              <img 
                                src={agentAvatar} 
                                alt={agent?.name || "Agent"} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                            <div className="bg-muted rounded-2xl rounded-bl-sm px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                <motion.div 
                                  className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                                  animate={{ y: [0, -4, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                />
                                <motion.div 
                                  className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                                  animate={{ y: [0, -4, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.15 }}
                                />
                                <motion.div 
                                  className="w-2 h-2 bg-muted-foreground/60 rounded-full"
                                  animate={{ y: [0, -4, 0] }}
                                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.3 }}
                                />
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      )}

                      {showEscalationPrompt && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-muted/50 border rounded-xl p-4 mx-2"
                        >
                          <p className="text-sm mb-3">
                            I'm sorry if this hasn't fully helped. Would you like to talk to a real representative?
                          </p>
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              onClick={() => handleEscalationResponse(true)}
                              disabled={escalateMutation.isPending}
                              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                              data-testid="button-connect-human"
                            >
                              Yes, connect me
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEscalationResponse(false)}
                              disabled={escalateMutation.isPending}
                              className="flex-1"
                              data-testid="button-continue-ai"
                            >
                              No, continue with AI
                            </Button>
                          </div>
                        </motion.div>
                      )}

                      {isEscalated && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-purple-500/10 border border-purple-500/30 rounded-xl p-3 mx-2 text-center"
                        >
                          <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">
                            {humanAgentName 
                              ? `Connected with ${humanAgentName}`
                              : "Waiting for a representative..."}
                          </p>
                        </motion.div>
                      )}

                      {menuOptions.length > 0 && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="flex flex-col gap-2 ml-10"
                        >
                          <p className="text-xs text-muted-foreground mb-1">Quick options:</p>
                          <div className="flex flex-wrap gap-2">
                            {menuOptions.map((option, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => handleMenuOptionClick(option)}
                                className="text-xs hover-elevate"
                                data-testid={`button-menu-option-${idx}`}
                              >
                                {option}
                              </Button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>
                  
                  <div className="p-4 border-t bg-background">
                    <div className="flex items-center gap-2">
                      <Input
                        ref={inputRef}
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        onKeyPress={handleKeyPress}
                        placeholder="Type your message..."
                        className="flex-1 rounded-full px-4"
                        disabled={sendMessageMutation.isPending || !sessionToken}
                        data-testid="input-chat-message"
                      />
                      {voiceEnabled && (
                        <div className="relative">
                          <Button
                            size="icon"
                            variant={isListening ? "destructive" : isSpeaking ? "secondary" : "outline"}
                            onClick={isListening ? stopListening : startListening}
                            disabled={sendMessageMutation.isPending || !sessionToken || isSpeaking}
                            className={`rounded-full transition-all ${isListening ? "" : ""}`}
                            data-testid="button-voice-input"
                          >
                            {isListening ? (
                              <div className="relative flex items-center justify-center">
                                <MicOff className="w-4 h-4" />
                                <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                              </div>
                            ) : isSpeaking ? (
                              <div className="flex items-center gap-0.5">
                                <span className="w-0.5 h-2 bg-current animate-pulse rounded-full" style={{animationDelay: "0ms"}}></span>
                                <span className="w-0.5 h-3 bg-current animate-pulse rounded-full" style={{animationDelay: "150ms"}}></span>
                                <span className="w-0.5 h-2 bg-current animate-pulse rounded-full" style={{animationDelay: "300ms"}}></span>
                              </div>
                            ) : (
                              <Mic className="w-4 h-4" />
                            )}
                          </Button>
                          {voiceStatus !== "idle" && (
                            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs text-muted-foreground whitespace-nowrap bg-background/80 px-1.5 py-0.5 rounded">
                              {voiceStatus === "listening" && "Listening..."}
                              {voiceStatus === "processing" && "Processing..."}
                              {voiceStatus === "speaking" && "Speaking..."}
                            </span>
                          )}
                        </div>
                      )}
                      <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!inputValue.trim() || sendMessageMutation.isPending || !sessionToken}
                        className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600"
                        data-testid="button-send-message"
                      >
                        {sendMessageMutation.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                </>
              )}
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="relative group"
        data-testid="button-toggle-chat"
      >
        <div className={`flex items-center gap-3 bg-gradient-to-r from-purple-600 to-pink-500 rounded-full shadow-lg hover:shadow-xl transition-all ${
          isOpen ? "px-4 py-3" : "pl-4 pr-5 py-3"
        }`}>
          <div className="relative">
            {isOpen ? (
              <X className="w-6 h-6 text-white" />
            ) : (
              <>
                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/30">
                  <img 
                    src={agentAvatar} 
                    alt="Chat Support" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-purple-600 bg-green-500" />
              </>
            )}
          </div>
          {!isOpen && (
            <div className="text-white text-left">
              <p className="font-semibold text-sm">Chat with us</p>
              <p className="text-xs text-white/80">We're online</p>
            </div>
          )}
          {isOpen && userProfile.type !== "guest" && (
            <Badge className={`${userProfile.color} text-xs flex items-center gap-1`}>
              {userProfile.icon}
              {userProfile.label}
            </Badge>
          )}
        </div>
        
      </motion.button>
    </div>
  );
}
