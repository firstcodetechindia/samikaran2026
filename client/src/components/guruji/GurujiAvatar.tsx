import { motion, AnimatePresence } from "framer-motion";

type AvatarState = "idle" | "listening" | "thinking" | "speaking" | "error";

interface GurujiAvatarProps {
  state: AvatarState;
  size?: "sm" | "md" | "lg";
}

export function GurujiAvatar({ state, size = "lg" }: GurujiAvatarProps) {
  const sizeClasses = {
    sm: "w-24 h-24",
    md: "w-40 h-40",
    lg: "w-64 h-64",
  };

  const pulseColors = {
    idle: "from-purple-500/30 to-pink-500/30",
    listening: "from-blue-500/50 to-cyan-500/50",
    thinking: "from-purple-600/50 to-pink-600/50",
    speaking: "from-emerald-500/50 to-green-500/50",
    error: "from-red-500/50 to-orange-500/50",
  };

  const innerColors = {
    idle: "from-purple-600 to-pink-600",
    listening: "from-blue-500 to-cyan-500",
    thinking: "from-purple-700 to-pink-700",
    speaking: "from-emerald-500 to-green-500",
    error: "from-red-500 to-orange-500",
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
            animate={state === "idle" ? {
              scale: [1, 1.1, 1],
              opacity: [0.5, 0.3, 0.5],
            } : state === "listening" ? {
              scale: [1, 1.3, 1],
              opacity: [0.6, 0.2, 0.6],
            } : state === "thinking" ? {
              scale: [1, 1.15, 1.05, 1.2, 1],
              opacity: [0.4, 0.6, 0.3, 0.5, 0.4],
            } : state === "speaking" ? {
              scale: [1, 1.2, 1.1, 1.25, 1],
              opacity: [0.5, 0.7, 0.4, 0.6, 0.5],
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
            className={`absolute inset-4 rounded-full bg-gradient-to-br ${pulseColors[state]}`}
            animate={state === "listening" ? {
              scale: [1, 1.2, 1],
              opacity: [0.4, 0.2, 0.4],
            } : state === "speaking" ? {
              scale: [1, 1.15, 1.05, 1.1, 1],
            } : {}}
            transition={{
              duration: state === "listening" ? 1 : 0.5,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 0.2,
            }}
          />

          <motion.div
            className={`absolute inset-8 rounded-full bg-gradient-to-br ${innerColors[state]} shadow-2xl flex items-center justify-center`}
            animate={state === "thinking" ? { rotate: 360 } : {}}
            transition={state === "thinking" ? {
              duration: 3,
              repeat: Infinity,
              ease: "linear",
            } : {}}
          >
            <motion.div 
              className="text-white text-center"
              animate={state === "speaking" ? {
                scale: [1, 1.1, 1],
              } : {}}
              transition={{
                duration: 0.3,
                repeat: state === "speaking" ? Infinity : 0,
              }}
            >
              <GurujiIcon state={state} />
            </motion.div>
          </motion.div>
        </motion.div>
      </AnimatePresence>

      <motion.div
        className="absolute inset-0 pointer-events-none"
        animate={{
          boxShadow: state === "listening" 
            ? ["0 0 60px rgba(59, 130, 246, 0.5)", "0 0 100px rgba(59, 130, 246, 0.3)"]
            : state === "speaking"
            ? ["0 0 60px rgba(16, 185, 129, 0.5)", "0 0 100px rgba(16, 185, 129, 0.3)"]
            : ["0 0 40px rgba(147, 51, 234, 0.3)", "0 0 60px rgba(147, 51, 234, 0.2)"],
        }}
        transition={{
          duration: 1.5,
          repeat: Infinity,
          repeatType: "reverse",
        }}
      />
    </div>
  );
}

function GurujiIcon({ state }: { state: AvatarState }) {
  const iconSize = "w-16 h-16";
  
  if (state === "listening") {
    return (
      <motion.svg
        className={iconSize}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <motion.path
          d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </motion.svg>
    );
  }

  if (state === "thinking") {
    return (
      <motion.div className="flex space-x-2">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-4 h-4 bg-white rounded-full"
            animate={{ y: [-5, 5, -5] }}
            transition={{
              duration: 0.6,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          />
        ))}
      </motion.div>
    );
  }

  if (state === "speaking") {
    return (
      <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <motion.path
          d="M15.54 8.46a5 5 0 0 1 0 7.07"
          animate={{ opacity: [1, 0.5, 1] }}
          transition={{ duration: 0.5, repeat: Infinity }}
        />
        <motion.path
          d="M19.07 4.93a10 10 0 0 1 0 14.14"
          animate={{ opacity: [1, 0.3, 1] }}
          transition={{ duration: 0.7, repeat: Infinity, delay: 0.2 }}
        />
      </svg>
    );
  }

  if (state === "error") {
    return (
      <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
    );
  }

  return (
    <svg className={iconSize} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}
