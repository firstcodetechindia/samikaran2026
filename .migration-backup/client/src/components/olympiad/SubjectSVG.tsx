import { motion } from "framer-motion";

interface SubjectSVGProps {
  subject: string;
  className?: string;
  size?: number;
}

const floatAnimation = {
  y: [0, -10, 0],
  transition: {
    duration: 3,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const pulseAnimation = {
  scale: [1, 1.05, 1],
  transition: {
    duration: 2,
    repeat: Infinity,
    ease: "easeInOut"
  }
};

const rotateAnimation = {
  rotate: [0, 360],
  transition: {
    duration: 20,
    repeat: Infinity,
    ease: "linear"
  }
};

export function MathsSVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={floatAnimation}
    >
      <motion.circle cx="100" cy="100" r="80" fill="url(#mathGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.g animate={{ rotate: [0, 5, -5, 0], transition: { duration: 4, repeat: Infinity } }}>
        <text x="50" y="80" fontSize="32" fontWeight="bold" fill="currentColor" opacity="0.9">π</text>
        <text x="120" y="70" fontSize="24" fontWeight="bold" fill="currentColor" opacity="0.7">∞</text>
        <text x="70" y="130" fontSize="28" fontWeight="bold" fill="currentColor" opacity="0.8">∑</text>
        <text x="130" y="120" fontSize="22" fontWeight="bold" fill="currentColor" opacity="0.6">√</text>
      </motion.g>
      <motion.path
        d="M40 150 L60 110 L80 140 L100 100 L120 130 L140 90 L160 120"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }}
      />
      <motion.rect x="35" y="35" width="30" height="30" rx="4" stroke="currentColor" strokeWidth="2" fill="none" animate={rotateAnimation} style={{ transformOrigin: "50px 50px" }} />
      <defs>
        <linearGradient id="mathGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#3B82F6" />
          <stop offset="100%" stopColor="#1D4ED8" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

export function ScienceSVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={floatAnimation}
    >
      <motion.circle cx="100" cy="100" r="80" fill="url(#sciGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.circle cx="100" cy="100" r="12" fill="currentColor" opacity="0.9" />
      <motion.ellipse cx="100" cy="100" rx="50" ry="20" stroke="currentColor" strokeWidth="2" fill="none" animate={rotateAnimation} style={{ transformOrigin: "100px 100px" }} />
      <motion.ellipse cx="100" cy="100" rx="50" ry="20" stroke="currentColor" strokeWidth="2" fill="none" transform="rotate(60 100 100)" animate={rotateAnimation} style={{ transformOrigin: "100px 100px" }} />
      <motion.ellipse cx="100" cy="100" rx="50" ry="20" stroke="currentColor" strokeWidth="2" fill="none" transform="rotate(120 100 100)" animate={rotateAnimation} style={{ transformOrigin: "100px 100px" }} />
      <motion.circle 
        r="6" 
        fill="currentColor" 
        opacity="0.7" 
        initial={{ cx: 150, cy: 100 }}
        animate={{ cx: [150, 100, 50, 100, 150], cy: [100, 80, 100, 120, 100] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      <motion.circle 
        r="6" 
        fill="currentColor" 
        opacity="0.7" 
        initial={{ cx: 50, cy: 100 }}
        animate={{ cx: [50, 100, 150, 100, 50], cy: [100, 120, 100, 80, 100] }}
        transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
      />
      <defs>
        <linearGradient id="sciGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#10B981" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

export function EnglishSVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={floatAnimation}
    >
      <motion.circle cx="100" cy="100" r="80" fill="url(#engGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.rect x="50" y="40" width="100" height="120" rx="8" stroke="currentColor" strokeWidth="2" fill="none" />
      <motion.rect x="55" y="45" width="90" height="110" rx="6" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
      <motion.g initial={{ opacity: 0 }} animate={{ opacity: [0, 1, 1, 0], transition: { duration: 3, repeat: Infinity } }}>
        <rect x="65" y="60" width="70" height="4" rx="2" fill="currentColor" opacity="0.6" />
        <rect x="65" y="75" width="55" height="4" rx="2" fill="currentColor" opacity="0.5" />
        <rect x="65" y="90" width="65" height="4" rx="2" fill="currentColor" opacity="0.6" />
        <rect x="65" y="105" width="45" height="4" rx="2" fill="currentColor" opacity="0.5" />
        <rect x="65" y="120" width="60" height="4" rx="2" fill="currentColor" opacity="0.6" />
        <rect x="65" y="135" width="50" height="4" rx="2" fill="currentColor" opacity="0.5" />
      </motion.g>
      <motion.text x="140" y="175" fontSize="36" fontWeight="bold" fill="currentColor" opacity="0.8" animate={{ y: [175, 165, 175], transition: { duration: 2, repeat: Infinity } }}>A</motion.text>
      <defs>
        <linearGradient id="engGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

export function GKSVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={floatAnimation}
    >
      <motion.circle cx="100" cy="100" r="80" fill="url(#gkGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.circle cx="100" cy="100" r="55" stroke="currentColor" strokeWidth="3" fill="none" animate={rotateAnimation} style={{ transformOrigin: "100px 100px" }} />
      <motion.path d="M100 45 L100 155" stroke="currentColor" strokeWidth="2" />
      <motion.path d="M45 100 L155 100" stroke="currentColor" strokeWidth="2" />
      <motion.ellipse cx="100" cy="100" rx="55" ry="25" stroke="currentColor" strokeWidth="2" fill="none" />
      <motion.circle cx="100" cy="45" r="8" fill="currentColor" opacity="0.8" animate={{ scale: [1, 1.2, 1], transition: { duration: 2, repeat: Infinity } }} />
      <motion.circle cx="155" cy="100" r="6" fill="currentColor" opacity="0.6" animate={{ scale: [1, 1.3, 1], transition: { duration: 2.5, repeat: Infinity } }} />
      <motion.circle cx="70" cy="130" r="5" fill="currentColor" opacity="0.5" animate={{ scale: [1, 1.4, 1], transition: { duration: 3, repeat: Infinity } }} />
      <defs>
        <linearGradient id="gkGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#F59E0B" />
          <stop offset="100%" stopColor="#D97706" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

export function ReasoningSVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={floatAnimation}
    >
      <motion.circle cx="100" cy="100" r="80" fill="url(#reasonGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.path
        d="M100 40 C60 40 40 70 40 100 C40 130 60 160 100 160 C140 160 160 130 160 100 C160 70 140 40 100 40"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
      <motion.path
        d="M70 80 Q100 60 130 80"
        stroke="currentColor"
        strokeWidth="2"
        fill="none"
        animate={{ d: ["M70 80 Q100 60 130 80", "M70 80 Q100 50 130 80", "M70 80 Q100 60 130 80"], transition: { duration: 2, repeat: Infinity } }}
      />
      <motion.circle cx="100" cy="100" r="8" fill="currentColor" opacity="0.8" animate={{ scale: [1, 1.2, 1], transition: { duration: 1.5, repeat: Infinity } }} />
      <motion.path d="M80 120 Q100 140 120 120" stroke="currentColor" strokeWidth="2" fill="none" />
      <motion.g animate={{ opacity: [0.3, 1, 0.3], transition: { duration: 2, repeat: Infinity } }}>
        <circle cx="60" cy="60" r="4" fill="currentColor" />
        <circle cx="140" cy="60" r="4" fill="currentColor" />
        <circle cx="60" cy="140" r="4" fill="currentColor" />
        <circle cx="140" cy="140" r="4" fill="currentColor" />
      </motion.g>
      <motion.path d="M60 60 L100 100 L140 60" stroke="currentColor" strokeWidth="1" fill="none" strokeDasharray="4" animate={{ strokeDashoffset: [0, 20], transition: { duration: 2, repeat: Infinity } }} />
      <defs>
        <linearGradient id="reasonGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EF4444" />
          <stop offset="100%" stopColor="#DC2626" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

export function ComputerSVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={floatAnimation}
    >
      <motion.circle cx="100" cy="100" r="80" fill="url(#compGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.rect x="40" y="50" width="120" height="80" rx="8" stroke="currentColor" strokeWidth="3" fill="none" />
      <motion.rect x="48" y="58" width="104" height="64" rx="4" stroke="currentColor" strokeWidth="1" fill="none" opacity="0.5" />
      <motion.rect x="80" y="130" width="40" height="8" rx="2" fill="currentColor" opacity="0.5" />
      <motion.rect x="60" y="138" width="80" height="6" rx="3" fill="currentColor" opacity="0.4" />
      <motion.g animate={{ opacity: [0, 1, 1, 0], x: [0, 5, 0], transition: { duration: 3, repeat: Infinity } }}>
        <text x="55" y="85" fontSize="12" fontFamily="monospace" fill="currentColor" opacity="0.7">&lt;code&gt;</text>
        <text x="60" y="100" fontSize="10" fontFamily="monospace" fill="currentColor" opacity="0.6">01001010</text>
        <text x="55" y="115" fontSize="12" fontFamily="monospace" fill="currentColor" opacity="0.7">&lt;/code&gt;</text>
      </motion.g>
      <motion.circle cx="145" cy="60" r="3" fill="#10B981" animate={{ opacity: [1, 0.3, 1], transition: { duration: 1, repeat: Infinity } }} />
      <defs>
        <linearGradient id="compGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#06B6D4" />
          <stop offset="100%" stopColor="#0891B2" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

export function HindiSVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={floatAnimation}
    >
      <motion.circle cx="100" cy="100" r="80" fill="url(#hindiGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.text x="60" y="110" fontSize="48" fontWeight="bold" fill="currentColor" opacity="0.9" animate={{ y: [110, 105, 110], transition: { duration: 2, repeat: Infinity } }}>अ</motion.text>
      <motion.text x="110" y="100" fontSize="36" fontWeight="bold" fill="currentColor" opacity="0.7" animate={{ y: [100, 95, 100], transition: { duration: 2.5, repeat: Infinity } }}>आ</motion.text>
      <motion.path d="M50 140 L150 140" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <motion.path d="M50 60 L150 60" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.5" />
      <defs>
        <linearGradient id="hindiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#EC4899" />
          <stop offset="100%" stopColor="#DB2777" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

export function PhysicsSVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} animate={floatAnimation}>
      <motion.circle cx="100" cy="100" r="80" fill="url(#physGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.path d="M100 40 L100 160" stroke="currentColor" strokeWidth="2" opacity="0.4" />
      <motion.circle cx="100" cy="60" r="10" fill="currentColor" opacity="0.8" />
      <motion.path d="M90 60 L100 130" stroke="currentColor" strokeWidth="2" fill="none" animate={{ d: ["M90 60 L100 130", "M110 60 L100 130", "M90 60 L100 130"], transition: { duration: 2, repeat: Infinity } }} />
      <motion.circle cx="100" cy="130" r="6" fill="currentColor" opacity="0.5" />
      <motion.g animate={{ rotate: [0, 10, -10, 0], transition: { duration: 3, repeat: Infinity } }} style={{ transformOrigin: "100px 100px" }}>
        <text x="130" y="80" fontSize="20" fontWeight="bold" fill="currentColor" opacity="0.7">F=ma</text>
      </motion.g>
      <motion.path d="M50 160 Q75 140 100 160 Q125 180 150 160" stroke="currentColor" strokeWidth="2" fill="none" animate={{ d: ["M50 160 Q75 140 100 160 Q125 180 150 160", "M50 160 Q75 180 100 160 Q125 140 150 160", "M50 160 Q75 140 100 160 Q125 180 150 160"], transition: { duration: 2.5, repeat: Infinity } }} />
      <defs><linearGradient id="physGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#6366F1" /><stop offset="100%" stopColor="#4F46E5" /></linearGradient></defs>
    </motion.svg>
  );
}

export function ChemistrySVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} animate={floatAnimation}>
      <motion.circle cx="100" cy="100" r="80" fill="url(#chemGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.path d="M80 40 L80 90 L50 150 Q50 170 70 170 L130 170 Q150 170 150 150 L120 90 L120 40" stroke="currentColor" strokeWidth="3" fill="none" />
      <motion.path d="M75 40 L125 40" stroke="currentColor" strokeWidth="2" />
      <motion.rect x="80" y="120" width="40" height="30" rx="4" fill="currentColor" opacity="0.15" animate={{ opacity: [0.1, 0.25, 0.1], transition: { duration: 2, repeat: Infinity } }} />
      <motion.g animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5], transition: { duration: 1.5, repeat: Infinity } }}>
        <circle cx="90" cy="115" r="4" fill="currentColor" opacity="0.6" />
        <circle cx="105" cy="110" r="3" fill="currentColor" opacity="0.5" />
        <circle cx="98" cy="105" r="3.5" fill="currentColor" opacity="0.4" />
      </motion.g>
      <defs><linearGradient id="chemGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#14B8A6" /><stop offset="100%" stopColor="#0D9488" /></linearGradient></defs>
    </motion.svg>
  );
}

export function BiologySVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} animate={floatAnimation}>
      <motion.circle cx="100" cy="100" r="80" fill="url(#bioGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.path d="M100 160 L100 100" stroke="currentColor" strokeWidth="3" fill="none" />
      <motion.path d="M100 100 Q70 80 80 50 Q90 30 100 50" stroke="currentColor" strokeWidth="2.5" fill="none" animate={{ d: ["M100 100 Q70 80 80 50 Q90 30 100 50", "M100 100 Q65 85 80 50 Q90 25 100 50", "M100 100 Q70 80 80 50 Q90 30 100 50"], transition: { duration: 3, repeat: Infinity } }} />
      <motion.path d="M100 100 Q130 80 120 50 Q110 30 100 50" stroke="currentColor" strokeWidth="2.5" fill="none" animate={{ d: ["M100 100 Q130 80 120 50 Q110 30 100 50", "M100 100 Q135 85 120 50 Q110 25 100 50", "M100 100 Q130 80 120 50 Q110 30 100 50"], transition: { duration: 3.5, repeat: Infinity } }} />
      <motion.path d="M100 120 Q70 110 65 130 Q60 150 80 145" stroke="currentColor" strokeWidth="2" fill="none" />
      <motion.path d="M100 120 Q130 110 135 130 Q140 150 120 145" stroke="currentColor" strokeWidth="2" fill="none" />
      <motion.circle cx="100" cy="50" r="6" fill="currentColor" opacity="0.6" animate={{ scale: [1, 1.2, 1], transition: { duration: 2, repeat: Infinity } }} />
      <defs><linearGradient id="bioGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#22C55E" /><stop offset="100%" stopColor="#16A34A" /></linearGradient></defs>
    </motion.svg>
  );
}

export function HistorySVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} animate={floatAnimation}>
      <motion.circle cx="100" cy="100" r="80" fill="url(#histGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.circle cx="100" cy="100" r="50" stroke="currentColor" strokeWidth="3" fill="none" />
      <motion.circle cx="100" cy="100" r="4" fill="currentColor" opacity="0.9" />
      <motion.path d="M100 55 L100 100" stroke="currentColor" strokeWidth="3" strokeLinecap="round" animate={{ rotate: [0, 360], transition: { duration: 10, repeat: Infinity, ease: "linear" } }} style={{ transformOrigin: "100px 100px" }} />
      <motion.path d="M100 65 L100 100" stroke="currentColor" strokeWidth="2" strokeLinecap="round" animate={{ rotate: [0, 360], transition: { duration: 60, repeat: Infinity, ease: "linear" } }} style={{ transformOrigin: "100px 100px" }} />
      {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map((angle, i) => (
        <motion.line key={i} x1="100" y1="52" x2="100" y2={i % 3 === 0 ? "58" : "55"} stroke="currentColor" strokeWidth={i % 3 === 0 ? "2" : "1"} opacity="0.6" transform={`rotate(${angle} 100 100)`} />
      ))}
      <motion.path d="M100 45 L105 35 L95 35 Z" fill="currentColor" opacity="0.7" />
      <defs><linearGradient id="histGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F59E0B" /><stop offset="100%" stopColor="#B45309" /></linearGradient></defs>
    </motion.svg>
  );
}

export function GeographySVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} animate={floatAnimation}>
      <motion.circle cx="100" cy="100" r="80" fill="url(#geoGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.circle cx="100" cy="90" r="50" stroke="currentColor" strokeWidth="3" fill="none" animate={rotateAnimation} style={{ transformOrigin: "100px 90px" }} />
      <motion.path d="M50 90 L150 90" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <motion.path d="M100 40 L100 140" stroke="currentColor" strokeWidth="1.5" opacity="0.5" />
      <motion.ellipse cx="100" cy="90" rx="50" ry="20" stroke="currentColor" strokeWidth="1.5" fill="none" opacity="0.5" />
      <motion.path d="M80 60 Q90 70 85 85 Q80 100 90 110 Q95 120 85 130" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.7" />
      <motion.path d="M110 55 Q120 65 115 80 Q110 95 120 105" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.7" />
      <motion.circle cx="120" cy="150" r="8" stroke="currentColor" strokeWidth="2" fill="none" />
      <motion.path d="M120 142 L120 135 L125 138" stroke="currentColor" strokeWidth="1.5" fill="none" />
      <defs><linearGradient id="geoGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#0EA5E9" /><stop offset="100%" stopColor="#0284C7" /></linearGradient></defs>
    </motion.svg>
  );
}

export function EconomicsSVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} animate={floatAnimation}>
      <motion.circle cx="100" cy="100" r="80" fill="url(#econGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.text x="75" y="115" fontSize="52" fontWeight="bold" fill="currentColor" opacity="0.8" animate={{ y: [115, 110, 115], transition: { duration: 2, repeat: Infinity } }}>₹</motion.text>
      <motion.path d="M50 150 L70 130 L90 140 L110 110 L130 120 L150 90" stroke="currentColor" strokeWidth="3" fill="none" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, repeat: Infinity, repeatType: "reverse" }} />
      <motion.path d="M145 85 L150 90 L155 85" stroke="currentColor" strokeWidth="2" fill="none" />
      <defs><linearGradient id="econGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#10B981" /><stop offset="100%" stopColor="#047857" /></linearGradient></defs>
    </motion.svg>
  );
}

export function PsychologySVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} animate={floatAnimation}>
      <motion.circle cx="100" cy="100" r="80" fill="url(#psyGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.text x="70" y="120" fontSize="56" fontWeight="bold" fill="currentColor" opacity="0.8" animate={{ scale: [1, 1.05, 1], transition: { duration: 3, repeat: Infinity } }}>Ψ</motion.text>
      <motion.circle cx="100" cy="55" r="20" stroke="currentColor" strokeWidth="2" fill="none" opacity="0.5" />
      <motion.g animate={{ opacity: [0.3, 0.8, 0.3], transition: { duration: 2.5, repeat: Infinity } }}>
        <circle cx="65" cy="75" r="3" fill="currentColor" />
        <circle cx="135" cy="75" r="3" fill="currentColor" />
        <circle cx="70" cy="130" r="2.5" fill="currentColor" />
        <circle cx="130" cy="130" r="2.5" fill="currentColor" />
      </motion.g>
      <defs><linearGradient id="psyGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#A855F7" /><stop offset="100%" stopColor="#7C3AED" /></linearGradient></defs>
    </motion.svg>
  );
}

export function CyberSVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} animate={floatAnimation}>
      <motion.circle cx="100" cy="100" r="80" fill="url(#cyberGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.path d="M100 45 L140 65 L140 110 L100 155 L60 110 L60 65 Z" stroke="currentColor" strokeWidth="3" fill="none" animate={{ scale: [1, 1.02, 1], transition: { duration: 2, repeat: Infinity } }} style={{ transformOrigin: "100px 100px" }} />
      <motion.path d="M100 75 L100 110" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
      <motion.circle cx="100" cy="120" r="4" fill="currentColor" opacity="0.8" />
      <motion.g animate={{ opacity: [0.3, 0.7, 0.3], transition: { duration: 1.5, repeat: Infinity } }}>
        <circle cx="75" cy="80" r="2" fill="currentColor" />
        <circle cx="125" cy="80" r="2" fill="currentColor" />
        <circle cx="70" cy="100" r="2" fill="currentColor" />
        <circle cx="130" cy="100" r="2" fill="currentColor" />
      </motion.g>
      <defs><linearGradient id="cyberGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#F43F5E" /><stop offset="100%" stopColor="#BE123C" /></linearGradient></defs>
    </motion.svg>
  );
}

export function BusinessSVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg width={size} height={size} viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} animate={floatAnimation}>
      <motion.circle cx="100" cy="100" r="80" fill="url(#bizGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.rect x="55" y="50" width="90" height="70" rx="6" stroke="currentColor" strokeWidth="3" fill="none" />
      <motion.path d="M80 50 L80 40 Q80 35 85 35 L115 35 Q120 35 120 40 L120 50" stroke="currentColor" strokeWidth="2" fill="none" />
      <motion.path d="M55 70 L145 70" stroke="currentColor" strokeWidth="2" opacity="0.5" />
      <motion.rect x="90" y="62" width="20" height="16" rx="3" fill="currentColor" opacity="0.3" />
      <motion.g animate={{ y: [0, -3, 0], transition: { duration: 2, repeat: Infinity } }}>
        <rect x="70" y="135" width="15" height="25" rx="2" fill="currentColor" opacity="0.4" />
        <rect x="92" y="130" width="15" height="30" rx="2" fill="currentColor" opacity="0.5" />
        <rect x="114" y="125" width="15" height="35" rx="2" fill="currentColor" opacity="0.6" />
      </motion.g>
      <defs><linearGradient id="bizGrad" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stopColor="#8B5CF6" /><stop offset="100%" stopColor="#6D28D9" /></linearGradient></defs>
    </motion.svg>
  );
}

export function DefaultSVG({ className = "", size = 200 }: { className?: string; size?: number }) {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      animate={floatAnimation}
    >
      <motion.circle cx="100" cy="100" r="80" fill="url(#defaultGrad)" fillOpacity="0.1" animate={pulseAnimation} />
      <motion.path d="M60 50 L60 150 L140 150 L140 70 L120 50 L60 50" stroke="currentColor" strokeWidth="3" fill="none" />
      <motion.path d="M120 50 L120 70 L140 70" stroke="currentColor" strokeWidth="2" fill="none" />
      <motion.g animate={{ opacity: [0.4, 1, 0.4], transition: { duration: 2, repeat: Infinity } }}>
        <rect x="75" y="75" width="50" height="4" rx="2" fill="currentColor" opacity="0.6" />
        <rect x="75" y="90" width="40" height="4" rx="2" fill="currentColor" opacity="0.5" />
        <rect x="75" y="105" width="45" height="4" rx="2" fill="currentColor" opacity="0.6" />
        <rect x="75" y="120" width="35" height="4" rx="2" fill="currentColor" opacity="0.5" />
      </motion.g>
      <defs>
        <linearGradient id="defaultGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#8B5CF6" />
          <stop offset="100%" stopColor="#7C3AED" />
        </linearGradient>
      </defs>
    </motion.svg>
  );
}

export default function SubjectSVG({ subject, className = "", size = 200 }: SubjectSVGProps) {
  const normalizedSubject = subject?.toLowerCase().trim() || "";
  
  if (normalizedSubject.includes("math")) return <MathsSVG className={className} size={size} />;
  if (normalizedSubject.includes("physics")) return <PhysicsSVG className={className} size={size} />;
  if (normalizedSubject.includes("chemistry")) return <ChemistrySVG className={className} size={size} />;
  if (normalizedSubject.includes("biology")) return <BiologySVG className={className} size={size} />;
  if (normalizedSubject.includes("science") || normalizedSubject.includes("evs")) return <ScienceSVG className={className} size={size} />;
  if (normalizedSubject.includes("english") || normalizedSubject.includes("language")) return <EnglishSVG className={className} size={size} />;
  if (normalizedSubject.includes("history")) return <HistorySVG className={className} size={size} />;
  if (normalizedSubject.includes("geography")) return <GeographySVG className={className} size={size} />;
  if (normalizedSubject.includes("economic")) return <EconomicsSVG className={className} size={size} />;
  if (normalizedSubject.includes("business")) return <BusinessSVG className={className} size={size} />;
  if (normalizedSubject.includes("psychology")) return <PsychologySVG className={className} size={size} />;
  if (normalizedSubject.includes("cyber") || normalizedSubject.includes("safety")) return <CyberSVG className={className} size={size} />;
  if (normalizedSubject.includes("gk") || normalizedSubject.includes("general") || normalizedSubject.includes("knowledge") || normalizedSubject.includes("social")) return <GKSVG className={className} size={size} />;
  if (normalizedSubject.includes("reasoning") || normalizedSubject.includes("logic") || normalizedSubject.includes("mental") || normalizedSubject.includes("aptitude")) return <ReasoningSVG className={className} size={size} />;
  if (normalizedSubject.includes("computer") || normalizedSubject.includes("coding")) return <ComputerSVG className={className} size={size} />;
  if (normalizedSubject.includes("hindi") || normalizedSubject.includes("sanskrit")) return <HindiSVG className={className} size={size} />;
  
  return <DefaultSVG className={className} size={size} />;
}
