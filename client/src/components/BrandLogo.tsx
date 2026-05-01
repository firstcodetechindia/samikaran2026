import { motion } from "framer-motion";
import { Link } from "wouter";

interface BrandLogoProps {
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  showText?: boolean;
  animated?: boolean;
  className?: string;
  linkTo?: string;
  variant?: "light" | "dark"; // light = for light backgrounds, dark = for dark backgrounds (footer)
}

const sizeConfig = {
  xs: { icon: 36, text: "text-sm", sub: "text-[8px]", gap: "gap-2" },
  sm: { icon: 48, text: "text-lg", sub: "text-[9px]", gap: "gap-2.5" },
  md: { icon: 56, text: "text-xl", sub: "text-[10px]", gap: "gap-3" },
  lg: { icon: 72, text: "text-2xl", sub: "text-xs", gap: "gap-3.5" },
  xl: { icon: 96, text: "text-3xl", sub: "text-sm", gap: "gap-4" },
};

export function BrandLogo({ 
  size = "md", 
  showText = true, 
  animated = true,
  className = "",
  linkTo = "/",
  variant = "light"
}: BrandLogoProps) {
  const config = sizeConfig[size];
  
  // Text colors based on variant (dark variant = for dark backgrounds like footer)
  const textColor = variant === "dark" ? "text-white" : "text-gray-900 dark:text-white";
  const subTextColor = variant === "dark" ? "text-white/70" : "text-gray-500 dark:text-gray-400";
  
  const LogoContent = (
    <div className={`flex items-center ${config.gap} ${className}`} data-testid="brand-logo">
      {/* Animated Hexagram Icon with Premium Effects */}
      <motion.div
        className="relative flex-shrink-0"
        whileHover={animated ? { scale: 1.08 } : {}}
        transition={{ type: "spring", stiffness: 400, damping: 17 }}
        style={{ width: config.icon, height: config.icon }}
      >
        {/* Pulsing glow behind logo */}
        {animated && (
          <motion.div
            className="absolute inset-0 rounded-full bg-gradient-to-r from-violet-500/30 to-pink-500/30 blur-lg"
            animate={{ scale: [1, 1.15, 1], opacity: [0.4, 0.7, 0.4] }}
            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        
        {/* Floating animation wrapper */}
        <motion.div
          animate={animated ? { y: [0, -3, 0] } : {}}
          transition={animated ? { duration: 3, repeat: Infinity, ease: "easeInOut" } : {}}
          className="relative"
        >
          <svg 
            viewBox="0 0 100 100" 
            width={config.icon} 
            height={config.icon}
            className="drop-shadow-lg relative z-10"
          >
            <defs>
              <linearGradient id={`logoGradUp-${size}`} x1="0%" y1="100%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#9333EA" />
                <stop offset="50%" stopColor="#C026D3" />
                <stop offset="100%" stopColor="#EC4899" />
              </linearGradient>
              <linearGradient id={`logoGradDown-${size}`} x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#A855F7" />
                <stop offset="100%" stopColor="#F472B6" />
              </linearGradient>
              <filter id={`logoShadow-${size}`} x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="3" stdDeviation="2" floodColor="#9333EA" floodOpacity="0.3"/>
              </filter>
            </defs>
            
            {/* Shadow layer */}
            <polygon 
              points="50,12 85,72 15,72" 
              fill="rgba(0,0,0,0.12)"
              transform="translate(2, 4)"
            />
            <polygon 
              points="50,88 15,28 85,28" 
              fill="rgba(0,0,0,0.1)"
              transform="translate(2, 4)"
            />
            
            {/* Upward triangle */}
            <motion.polygon 
              points="50,10 88,75 12,75" 
              fill={`url(#logoGradUp-${size})`}
              filter={`url(#logoShadow-${size})`}
              initial={animated ? { opacity: 0, y: -5 } : { opacity: 1 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            />
            {/* Highlight */}
            <polygon 
              points="50,10 69,42.5 31,42.5" 
              fill="rgba(255,255,255,0.18)"
            />
            
            {/* Downward triangle */}
            <motion.polygon 
              points="50,90 12,25 88,25" 
              fill={`url(#logoGradDown-${size})`}
              opacity="0.88"
              initial={animated ? { opacity: 0, y: 5 } : { opacity: 0.88 }}
              animate={{ opacity: 0.88, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            />
            {/* Highlight */}
            <polygon 
              points="50,90 31,57.5 69,57.5" 
              fill="rgba(255,255,255,0.12)"
            />
            
            {/* Equals sign */}
            <motion.g
              initial={animated ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.3, delay: 0.2 }}
            >
              <rect x="32" y="44" width="36" height="5" rx="2.5" fill="white" />
              <rect x="32" y="53" width="36" height="5" rx="2.5" fill="white" />
              {/* Shine */}
              <rect x="32" y="44" width="36" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
              <rect x="32" y="53" width="36" height="2" rx="1" fill="rgba(255,255,255,0.5)" />
            </motion.g>
          </svg>
        </motion.div>
        
        {/* Rotating ring (subtle) */}
        {animated && (
          <motion.div 
            className="absolute inset-[-4px] rounded-full border border-violet-500/20 pointer-events-none"
            animate={{ rotate: 360 }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
            style={{ borderStyle: "dashed" }}
          />
        )}
      </motion.div>
      
      {/* Brand Text */}
      {showText && (
        <motion.div 
          className="flex flex-col leading-none"
          initial={animated ? { opacity: 0, x: -10 } : { opacity: 1 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.4, delay: 0.15 }}
        >
          <span className={`${config.text} font-black ${textColor} tracking-tight`}>
            SAMIKARAN<span className="text-pink-500">.</span>
          </span>
          <span className={`${config.sub} font-semibold ${subTextColor} uppercase tracking-[0.2em]`}>
            Olympiad
          </span>
        </motion.div>
      )}
    </div>
  );

  if (linkTo) {
    return (
      <Link href={linkTo} className="no-underline">
        {LogoContent}
      </Link>
    );
  }

  return LogoContent;
}

export function BrandLogoIcon({ 
  size = 40, 
  animated = true,
  className = ""
}: { 
  size?: number; 
  animated?: boolean;
  className?: string;
}) {
  return (
    <motion.div
      className={`relative ${className}`}
      whileHover={animated ? { scale: 1.05, rotate: 5 } : {}}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <svg 
        viewBox="0 0 100 100" 
        width={size} 
        height={size}
        className="drop-shadow-lg"
      >
        <defs>
          <linearGradient id="iconGradUp" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9333EA" />
            <stop offset="50%" stopColor="#C026D3" />
            <stop offset="100%" stopColor="#EC4899" />
          </linearGradient>
          <linearGradient id="iconGradDown" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#A855F7" />
            <stop offset="100%" stopColor="#F472B6" />
          </linearGradient>
        </defs>
        
        {/* Shadow */}
        <polygon points="50,12 85,72 15,72" fill="rgba(0,0,0,0.1)" transform="translate(2, 3)" />
        <polygon points="50,88 15,28 85,28" fill="rgba(0,0,0,0.08)" transform="translate(2, 3)" />
        
        {/* Triangles */}
        <polygon points="50,10 88,75 12,75" fill="url(#iconGradUp)" />
        <polygon points="50,10 69,42.5 31,42.5" fill="rgba(255,255,255,0.15)" />
        <polygon points="50,90 12,25 88,25" fill="url(#iconGradDown)" opacity="0.85" />
        <polygon points="50,90 31,57.5 69,57.5" fill="rgba(255,255,255,0.1)" />
        
        {/* Equals */}
        <rect x="32" y="44" width="36" height="5" rx="2.5" fill="white" />
        <rect x="32" y="53" width="36" height="5" rx="2.5" fill="white" />
        <rect x="32" y="44" width="36" height="2" rx="1" fill="rgba(255,255,255,0.4)" />
        <rect x="32" y="53" width="36" height="2" rx="1" fill="rgba(255,255,255,0.4)" />
      </svg>
    </motion.div>
  );
}

export default BrandLogo;
