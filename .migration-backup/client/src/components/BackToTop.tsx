import { useState, useEffect } from "react";
import { ArrowUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function BackToTop() {
  const [isVisible, setIsVisible] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
      
      setScrollProgress(progress);
      setIsVisible(scrollTop > 300);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const circumference = 2 * Math.PI * 22;
  const strokeDashoffset = circumference - (scrollProgress / 100) * circumference;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.button
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={scrollToTop}
          className="fixed bottom-[148px] right-4 lg:bottom-24 lg:right-6 z-50 w-14 h-14 flex items-center justify-center cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 rounded-full"
          data-testid="button-back-to-top"
          aria-label="Back to top"
        >
          {/* Outer glow effect */}
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/20 to-pink-500/20 blur-md"
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Orbiting particles */}
          <motion.div
            className="absolute inset-[-4px]"
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-violet-400 shadow-lg shadow-violet-400/50" />
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-pink-400 shadow-lg shadow-pink-400/50" />
          </motion.div>
          
          {/* Second orbit layer - counter rotation */}
          <motion.div
            className="absolute inset-[-8px]"
            animate={{ rotate: -360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
          >
            <div className="absolute top-1/2 left-0 -translate-y-1/2 w-1 h-1 rounded-full bg-fuchsia-400 shadow-lg shadow-fuchsia-400/50" />
            <div className="absolute top-1/2 right-0 -translate-y-1/2 w-0.5 h-0.5 rounded-full bg-violet-300" />
          </motion.div>
          
          {/* Progress ring */}
          <svg
            className="absolute w-14 h-14 -rotate-90"
            viewBox="0 0 56 56"
          >
            {/* Background ring */}
            <circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="rgba(139, 92, 246, 0.15)"
              strokeWidth="2.5"
            />
            {/* Animated progress ring */}
            <motion.circle
              cx="28"
              cy="28"
              r="22"
              fill="none"
              stroke="url(#backToTopGradient)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset }}
              transition={{ duration: 0.15 }}
            />
            <defs>
              <linearGradient id="backToTopGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8B5CF6" />
                <stop offset="50%" stopColor="#D946EF" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center button with floating animation */}
          <motion.div
            className="relative w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 via-fuchsia-500 to-pink-500 flex items-center justify-center shadow-lg"
            animate={{ y: [0, -2, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            whileHover={{ boxShadow: "0 0 25px rgba(139, 92, 246, 0.6)" }}
            style={{ boxShadow: "0 4px 20px rgba(139, 92, 246, 0.4)" }}
          >
            {/* Inner highlight */}
            <div className="absolute inset-0.5 rounded-full bg-gradient-to-br from-white/20 to-transparent" />
            
            {/* Arrow icon with bounce */}
            <motion.div
              animate={{ y: [0, -3, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            >
              <ArrowUp className="w-5 h-5 text-white drop-shadow-sm" strokeWidth={2.5} />
            </motion.div>
          </motion.div>
        </motion.button>
      )}
    </AnimatePresence>
  );
}
