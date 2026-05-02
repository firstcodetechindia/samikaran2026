import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import taraAvatarImage from "@/assets/images/mira-avatar.webp";

type AvatarState = "idle" | "listening" | "thinking" | "speaking" | "error" | "greeting";

interface TaraAvatarProps {
  state: AvatarState;
  size?: "sm" | "md" | "lg" | "xl";
  showGreeting?: boolean;
  studentName?: string;
  language?: "hi" | "en";
  onGreetingComplete?: () => void;
}

export function TaraAvatar({ 
  state, 
  size = "lg", 
  showGreeting = false,
  studentName = "",
  language = "hi",
  onGreetingComplete
}: TaraAvatarProps) {
  const sizeClasses = {
    sm: "w-16 h-16",
    md: "w-24 h-24",
    lg: "w-32 h-32",
    xl: "w-48 h-48",
  };

  const imageSizes = {
    sm: "w-12 h-12",
    md: "w-20 h-20",
    lg: "w-28 h-28",
    xl: "w-44 h-44",
  };

  const pulseColors = {
    idle: "from-purple-500/30 to-pink-500/30",
    listening: "from-blue-500/50 to-cyan-500/50",
    thinking: "from-purple-600/50 to-pink-600/50",
    speaking: "from-emerald-500/50 to-green-500/50",
    error: "from-red-500/50 to-orange-500/50",
    greeting: "from-purple-500/40 to-pink-500/40",
  };

  return (
    <div className={`relative ${sizeClasses[size]} flex items-center justify-center`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={state}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.3 }}
        >
          <motion.div
            className={`absolute inset-0 rounded-full bg-gradient-to-br ${pulseColors[state]}`}
            animate={state === "idle" || state === "greeting" ? {
              scale: [1, 1.08, 1],
              opacity: [0.4, 0.2, 0.4],
            } : state === "listening" ? {
              scale: [1, 1.2, 1],
              opacity: [0.5, 0.2, 0.5],
            } : state === "thinking" ? {
              scale: [1, 1.1, 1.05, 1.15, 1],
              opacity: [0.3, 0.5, 0.2, 0.4, 0.3],
            } : state === "speaking" ? {
              scale: [1, 1.15, 1.05, 1.2, 1],
              opacity: [0.4, 0.6, 0.3, 0.5, 0.4],
            } : {
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.7, 0.5],
            }}
            transition={{
              duration: state === "listening" ? 0.8 : state === "speaking" ? 0.6 : 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />

          <motion.div
            className="absolute inset-1 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-100 shadow-2xl p-1"
            animate={state === "speaking" ? {
              scale: [1, 1.02, 1],
            } : {}}
            transition={{
              duration: 0.3,
              repeat: state === "speaking" ? Infinity : 0,
            }}
          >
            <motion.img
              src={taraAvatarImage}
              alt="TARA"
              className={`${imageSizes[size]} object-cover rounded-full mx-auto mt-1`}
              animate={showGreeting ? {
                scale: [0.9, 1, 1.02, 1],
              } : state === "speaking" ? {
                y: [0, -1, 0, 1, 0],
              } : {}}
              transition={showGreeting ? {
                duration: 0.8,
                ease: "easeOut",
              } : {
                duration: 0.4,
                repeat: state === "speaking" ? Infinity : 0,
              }}
            />
          </motion.div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export const MiraAvatar = TaraAvatar;

interface TaraGreetingProps {
  studentName: string;
  language: "hi" | "en";
  onComplete: () => void;
}

export function TaraGreeting({ studentName, language, onComplete }: TaraGreetingProps) {
  const firstName = studentName.split(" ")[0] || "Student";
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [audioReady, setAudioReady] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hasStartedRef = useRef(false);
  
  const greetingText = language === "hi" 
    ? `नमस्ते ${firstName}! मैं TARA हूं। आज मैं आपको क्या पढ़ाऊं?`
    : `Hello ${firstName}! I'm TARA. How may I help you today?`;

  useEffect(() => {
    if (hasStartedRef.current) return;
    hasStartedRef.current = true;
    
    const loadAndPlayGreeting = async () => {
      try {
        const userStr = localStorage.getItem("samikaran_user");
        const sessionToken = localStorage.getItem("samikaran_session_token");
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            if (user?.id) headers["X-User-Id"] = String(user.id);
          } catch {}
        }
        if (sessionToken) headers["X-Session-Token"] = sessionToken;

        const response = await fetch("/api/guruji/tts", {
          method: "POST",
          headers,
          body: JSON.stringify({ text: greetingText, language }),
        });

        if (response.ok) {
          const audioBlob = await response.blob();
          const audioUrl = URL.createObjectURL(audioBlob);
          const audio = new Audio(audioUrl);
          audioRef.current = audio;
          
          audio.oncanplaythrough = () => {
            setIsLoading(false);
            setAudioReady(true);
            setIsSpeaking(true);
            audio.play().catch(() => {
              setIsSpeaking(false);
            });
          };
          
          audio.onended = () => {
            setIsSpeaking(false);
            URL.revokeObjectURL(audioUrl);
          };
          
          audio.onerror = () => {
            setIsLoading(false);
            setIsSpeaking(false);
          };
          
          audio.load();
        } else {
          setIsLoading(false);
        }
      } catch (error) {
        console.error("TTS error:", error);
        setIsLoading(false);
      }
    };

    loadAndPlayGreeting();
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    };
  }, [greetingText, language]);

  return (
    <motion.div 
      className="flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
    >
      <motion.div
        initial={{ scale: 0.9 }}
        animate={{ scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <TaraAvatar 
          state={isSpeaking ? "speaking" : (isLoading ? "thinking" : "idle")} 
          size="xl" 
          showGreeting={false}
          studentName={firstName}
          language={language}
        />
      </motion.div>

      <motion.div
        className="mt-6 text-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.3 }}
      >
        <motion.h3 
          className="text-xl font-bold text-white mb-2"
          animate={isSpeaking ? { scale: [1, 1.05, 1] } : {}}
          transition={{ duration: 0.4, repeat: isSpeaking ? Infinity : 0 }}
        >
          TARA
        </motion.h3>
        
        <motion.p 
          className="text-white/90 text-lg max-w-xs"
          animate={isSpeaking ? { opacity: [0.8, 1, 0.8] } : { opacity: 1 }}
          transition={{ duration: 0.6, repeat: isSpeaking ? Infinity : 0 }}
        >
          {isLoading ? (language === "hi" ? "तैयार हो रही हूं..." : "Getting ready...") : greetingText}
        </motion.p>
        
        {(isSpeaking || isLoading) && (
          <motion.div 
            className="flex justify-center gap-1 mt-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            {[0, 1, 2, 3, 4].map((i) => (
              <motion.div
                key={i}
                className="w-2 h-6 bg-gradient-to-t from-purple-400 to-pink-400 rounded-full"
                animate={{ 
                  scaleY: isSpeaking ? [0.3, 1, 0.3] : [0.5, 0.8, 0.5],
                  opacity: isSpeaking ? 1 : 0.6
                }}
                transition={{ 
                  duration: isSpeaking ? 0.4 : 0.8, 
                  repeat: Infinity, 
                  delay: i * 0.08 
                }}
              />
            ))}
          </motion.div>
        )}
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: audioReady && !isSpeaking ? 1 : 0.5 }}
        transition={{ duration: 0.3 }}
        className="mt-6"
      >
        <Button
          onClick={onComplete}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-medium shadow-lg rounded-full px-6"
          size="lg"
          disabled={isLoading}
          data-testid="button-start-chat-tara"
        >
          {isLoading 
            ? (language === "hi" ? "रुकिए..." : "Please wait...") 
            : (language === "hi" ? "बातचीत शुरू करें" : "Start Chatting")
          }
        </Button>
      </motion.div>
    </motion.div>
  );
}

export const MiraGreeting = TaraGreeting;
