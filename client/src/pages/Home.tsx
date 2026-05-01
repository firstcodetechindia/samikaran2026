import { useQuery } from "@tanstack/react-query";
import { Link, useLocation } from "wouter";
import { Helmet } from "react-helmet-async";
import { buildOrganizationSchema, buildWebSiteSchema, buildEducationalOrgSchema, buildFaqSchema } from "@/utils/seo";
import { Button } from "@/components/ui/button";
import type { Exam, BlogPost, OlympiadCategory } from "@shared/schema";
import { Trophy, BookOpen, ArrowRight, Star, Shield, Award, Users, Globe, CheckCircle2, Download, GraduationCap, Brain, Target, BarChart3, Quote, Calculator, Atom, BookText, IndianRupee, FileText, Share2, Calendar, Clock, Sparkles, Code, Puzzle, Monitor, FlaskConical, Languages, Landmark, TrendingUp, Briefcase, Heart, Rocket, Cpu, Dna, Map, Wrench, Car, ShoppingCart, ChevronRight, Lightbulb, ClipboardCheck, Laptop, Zap, School, UserPlus, CreditCard, Building2, HelpCircle, ChevronDown } from "lucide-react";
import { useState, useEffect, useRef } from "react";
import { motion, useInView, useScroll, useTransform } from "framer-motion";
import { PublicLayout } from "@/components/PublicLayout";

function AnimatedCounter({ target, suffix = "", prefix = "" }: { target: number; suffix?: string; prefix?: string }) {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 2000;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [inView, target]);

  return <span ref={ref}>{prefix}{count.toLocaleString()}{suffix}</span>;
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } }
};

const staggerContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1 } }
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: { duration: 0.5, ease: "easeOut" } }
};

function HeroParticles() {
  const symbols = [
    '∑', 'π', '∞', '√', '⚛', '∫', 'Δ', '≈', 'λ', '⊕',
    'μ', 'σ', '∂', 'θ', 'α', 'β', 'φ', 'ω', 'ψ', 'ℏ',
    '∇', '∈', '∧', '∨', '⊂', '≠', 'χ', 'η', 'ξ', '★',
    '♪', '✦', '◈', '⌬', '⊗', '∮',
  ];
  const particles = Array.from({ length: 36 }, (_, i) => ({
    id: i,
    symbol: symbols[i % symbols.length],
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: 7 + Math.random() * 9,
    duration: 18 + Math.random() * 22,
    delay: Math.random() * 12,
    dx: (Math.random() - 0.5) * 120,
    dy: (Math.random() - 0.5) * 120,
  }));
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
      {particles.map(p => (
        <motion.span
          key={p.id}
          className="absolute font-bold select-none"
          style={{ left: `${p.x}%`, top: `${p.y}%`, fontSize: p.size, color: 'white', opacity: 0 }}
          animate={{ x: [0, p.dx, 0], y: [0, p.dy, 0], opacity: [0, 0.16, 0.16, 0.16, 0] }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
        >
          {p.symbol}
        </motion.span>
      ))}
    </div>
  );
}

function OlympiadIllustration() {
  const subjects = [
    { name: 'Maths', icon: '∑', sub: 'π²', color: '#f472b6', border: '#ec4899', bg: '#2d0f30' },
    { name: 'Science', icon: '⚛', sub: '', color: '#a78bfa', border: '#7c3aed', bg: '#1a0d35' },
    { name: 'English', icon: 'ABC', sub: 'abc', color: '#34d399', border: '#059669', bg: '#0d2420' },
    { name: 'Reasoning', icon: '♟', sub: 'Logic', color: '#fbbf24', border: '#d97706', bg: '#2d1a00' },
    { name: 'Computers', icon: '</>', sub: 'Code', color: '#38bdf8', border: '#0284c7', bg: '#001a2d' },
  ];
  const innerSubjects = [
    { name: 'GK', icon: '★', color: '#fde68a', border: '#f59e0b', bg: '#2a1a00' },
    { name: 'Hindi', icon: 'अ', color: '#fb923c', border: '#ea580c', bg: '#2a0e00' },
    { name: 'EVS', icon: '♻', color: '#4ade80', border: '#16a34a', bg: '#002a14' },
    { name: 'Social', icon: '⊕', color: '#c084fc', border: '#9333ea', bg: '#1a0030' },
  ];
  const [dims, setDims] = useState({ R: 165, iconSize: 68, height: 520 });
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      if (w < 480) setDims({ R: 108, iconSize: 50, height: 360 });
      else if (w < 768) setDims({ R: 130, iconSize: 58, height: 420 });
      else if (w < 1024) setDims({ R: 148, iconSize: 62, height: 460 });
      else setDims({ R: 165, iconSize: 68, height: 520 });
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  const { R, iconSize, height } = dims;
  const R2 = Math.round(R * 0.62);
  const is2 = Math.round(iconSize * 0.50);
  const dur = 22;
  return (
    <div className="relative w-full flex items-center justify-center select-none overflow-hidden" style={{ height }}>
      {/* Ambient glow */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="rounded-full bg-purple-600/10 blur-[70px]" style={{ width: R * 2.2, height: R * 2.2 }} />
      </div>
      {/* Outer orbit ring */}
      <div className="absolute rounded-full border border-dashed border-purple-400/20 pointer-events-none"
        style={{ width: R * 2, height: R * 2, left: '50%', top: '50%', marginLeft: -R, marginTop: -R }} />
      {/* Inner orbit ring */}
      <div className="absolute rounded-full border border-dashed border-cyan-400/15 pointer-events-none"
        style={{ width: R2 * 2, height: R2 * 2, left: '50%', top: '50%', marginLeft: -R2, marginTop: -R2 }} />

      {/* Inner rotating orbit — GK, Hindi, EVS, Social */}
      <motion.div
        className="absolute"
        style={{ width: R2 * 2, height: R2 * 2, left: '50%', top: '50%', marginLeft: -R2, marginTop: -R2 }}
        animate={{ rotate: -360 }}
        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
      >
        {innerSubjects.map((s, i) => {
          const angleDeg = i * (360 / innerSubjects.length) - 45;
          const angleRad = angleDeg * (Math.PI / 180);
          const cx = R2 + R2 * Math.cos(angleRad) - is2 / 2;
          const cy = R2 + R2 * Math.sin(angleRad) - is2 / 2;
          return (
            <motion.div
              key={s.name}
              className="absolute flex flex-col items-center gap-[2px]"
              style={{ left: cx, top: cy, width: is2 }}
              animate={{ rotate: 360 }}
              transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
            >
              <div className="flex items-center justify-center rounded-full"
                style={{
                  width: is2, height: is2,
                  background: s.bg,
                  border: `2px solid ${s.border}`,
                  boxShadow: `0 0 10px ${s.border}66`,
                }}
              >
                <span style={{ color: s.color, fontSize: is2 * 0.42, fontWeight: 800, lineHeight: 1 }}>{s.icon}</span>
              </div>
              <span style={{ color: s.color, fontSize: 9, fontWeight: 700, letterSpacing: 0.2, whiteSpace: 'nowrap' }}>{s.name}</span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Rotating outer orbit wrapper — explicitly centered */}
      <motion.div
        className="absolute"
        style={{ width: R * 2, height: R * 2, left: '50%', top: '50%', marginLeft: -R, marginTop: -R }}
        animate={{ rotate: 360 }}
        transition={{ duration: dur, repeat: Infinity, ease: 'linear' }}
      >
        {subjects.map((s, i) => {
          const angleDeg = i * (360 / subjects.length) - 90;
          const angleRad = angleDeg * (Math.PI / 180);
          const cx = R + R * Math.cos(angleRad) - iconSize / 2;
          const cy = R + R * Math.sin(angleRad) - iconSize / 2;
          return (
            <motion.div
              key={s.name}
              className="absolute flex flex-col items-center gap-[3px]"
              style={{ left: cx, top: cy, width: iconSize }}
              animate={{ rotate: -360 }}
              transition={{ duration: dur, repeat: Infinity, ease: 'linear' }}
            >
              <div
                className="flex flex-col items-center justify-center rounded-full shadow-lg"
                style={{
                  width: iconSize, height: iconSize,
                  background: s.bg,
                  border: `2px solid ${s.border}`,
                  boxShadow: `0 0 16px ${s.border}55`,
                }}
              >
                <span style={{ color: s.color, fontSize: s.icon === '⚛' || s.icon === '♟' ? 24 : s.icon === '</>' ? 13 : 17, fontWeight: 800, lineHeight: 1 }}>{s.icon}</span>
                {s.sub && <span style={{ color: s.color, fontSize: 10, lineHeight: 1, marginTop: 2 }}>{s.sub}</span>}
              </div>
              <span style={{ color: s.color, fontSize: 11, fontWeight: 700, letterSpacing: 0.3, whiteSpace: 'nowrap' }}>{s.name}</span>
            </motion.div>
          );
        })}
      </motion.div>

      {/* Central Trophy SVG — with animated shine */}
      <motion.div
        className="absolute z-10 flex items-center justify-center"
        style={{ marginTop: -20 }}
        animate={{
          filter: [
            'drop-shadow(0 0 8px rgba(245,158,11,0.45))',
            'drop-shadow(0 0 28px rgba(253,230,138,0.95)) drop-shadow(0 0 55px rgba(253,230,138,0.55))',
            'drop-shadow(0 0 8px rgba(245,158,11,0.45))',
          ],
        }}
        transition={{ duration: 1.8, repeat: Infinity, repeatDelay: 3.2, ease: 'easeInOut' }}
      >
        <svg viewBox="0 0 180 220" width="clamp(150px, 18vw, 210px)" height="clamp(180px, 22vw, 250px)" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <radialGradient id="tg2" cx="50%" cy="30%" r="70%">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="50%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#b45309" />
            </radialGradient>
            <radialGradient id="gs2" cx="35%" cy="25%" r="60%">
              <stop offset="0%" stopColor="#fef3c7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#d97706" stopOpacity="0" />
            </radialGradient>
            <radialGradient id="flare2" cx="50%" cy="30%" r="55%">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.55" />
              <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
            </radialGradient>
            <filter id="tglow">
              <feGaussianBlur stdDeviation="7" result="coloredBlur"/>
              <feMerge><feMergeNode in="coloredBlur"/><feMergeNode in="SourceGraphic"/></feMerge>
            </filter>
          </defs>
          <ellipse cx="90" cy="195" rx="44" ry="9" fill="#f59e0b" fillOpacity="0.18" />
          <path d="M48 28 L48 118 Q48 140 90 140 Q132 140 132 118 L132 28 Z" fill="url(#tg2)" filter="url(#tglow)" />
          <path d="M48 28 L48 118 Q48 140 90 140 Q132 140 132 118 L132 28 Z" fill="url(#gs2)" />
          {/* Shine overlay — animates in sync with outer glow (5s total cycle) */}
          <path d="M48 28 L48 118 Q48 140 90 140 Q132 140 132 118 L132 28 Z" fill="url(#flare2)">
            <animate attributeName="opacity" values="0;0.7;0;0" dur="5s" begin="0s" repeatCount="indefinite" keyTimes="0;0.18;0.36;1" />
          </path>
          <path d="M48 52 Q18 52 18 82 Q18 112 48 112" fill="none" stroke="#f59e0b" strokeWidth="9" strokeLinecap="round"/>
          <path d="M132 52 Q162 52 162 82 Q162 112 132 112" fill="none" stroke="#f59e0b" strokeWidth="9" strokeLinecap="round"/>
          <rect x="76" y="140" width="28" height="28" fill="#d97706" rx="2"/>
          <rect x="58" y="166" width="64" height="12" fill="#b45309" rx="4"/>
          <rect x="65" y="177" width="50" height="8" fill="#92400e" rx="3"/>
          <polygon points="90,42 95,58 111,58 98,68 103,84 90,74 77,84 82,68 69,58 85,58" fill="#fef3c7" opacity="0.96"/>
          <ellipse cx="68" cy="66" rx="6" ry="11" fill="white" fillOpacity="0.15" transform="rotate(-20 68 66)"/>
          {/* Star sparkle flare on top highlight */}
          <circle cx="70" cy="58" r="3" fill="white" opacity="0">
            <animate attributeName="opacity" values="0;0.9;0;0" dur="5s" begin="0s" repeatCount="indefinite" keyTimes="0;0.18;0.36;1" />
            <animate attributeName="r" values="2;9;2;2" dur="5s" begin="0s" repeatCount="indefinite" keyTimes="0;0.18;0.36;1" />
          </circle>
        </svg>
      </motion.div>

      {/* Repeating ring-pulse behind trophy */}
      <motion.div
        className="absolute z-0 rounded-full pointer-events-none"
        style={{ width: 160, height: 160, marginTop: -20, background: 'radial-gradient(circle, rgba(253,230,138,0.18) 0%, transparent 70%)' }}
        animate={{ scale: [1, 1.55, 1], opacity: [0.6, 0, 0.6] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      />

      {/* Badges */}
      <div className="absolute flex items-center gap-3 z-20" style={{ bottom: 'clamp(12px, 3vw, 24px)' }}>
        <div className="px-4 py-1.5 rounded-full backdrop-blur-sm" style={{ background: 'rgba(124,58,237,0.85)' }}>
          <span className="text-white text-sm font-black tracking-widest">2026</span>
        </div>
        <div className="px-4 py-1.5 rounded-full backdrop-blur-sm" style={{ background: 'rgba(236,72,153,0.85)' }}>
          <span className="text-white text-xs font-bold">₹5L Scholarship</span>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const [, navigate] = useLocation();
  const [ageTab, setAgeTab] = useState<"little" | "elite">("little");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const heroRef = useRef<HTMLElement>(null);
  const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)')?.matches;
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroY = useTransform(scrollYProgress, [0, 1], [0, 50]);
  const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0.3]);

  const { data: olympiads } = useQuery<Exam[]>({ queryKey: ["/api/public/olympiads"] });
  const { data: categories } = useQuery<OlympiadCategory[]>({ queryKey: ["/api/public/olympiad-categories"] });
  const { data: blogPosts } = useQuery<BlogPost[]>({ queryKey: ["/api/public/blog/posts"] });

  const getRegistrationStatus = (exam: Exam) => {
    const now = new Date();
    const regOpenDate = exam.registrationOpenDate ? new Date(exam.registrationOpenDate) : null;
    const regCloseDate = exam.registrationCloseDate ? new Date(exam.registrationCloseDate) : null;
    const startTime = new Date(exam.startTime);
    if (now > startTime) return { status: 'closed', label: 'Closed', color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400' };
    if (regCloseDate && now > regCloseDate) return { status: 'closed', label: 'Closed', color: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' };
    if (regOpenDate && now < regOpenDate) return { status: 'upcoming', label: 'Upcoming', color: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400' };
    return { status: 'open', label: 'Open', color: 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' };
  };

  const subjectIcons: Record<string, any> = {
    'Science': FlaskConical, 'Physics': Atom, 'Chemistry': FlaskConical, 'Biology': Dna,
    'Mathematics': Calculator, 'English': BookText, 'Hindi': Languages,
    'Reasoning': Brain, 'Logical Reasoning': Puzzle, 'Mental Ability': Brain,
    'Computer Science': Monitor, 'Coding': Code, 'Cyber Security': Shield,
    'AI': Cpu, 'GK': Globe, 'General Knowledge': Globe, 'Social Science': Landmark,
    'Geography': Map, 'Economics': TrendingUp, 'Commerce': Briefcase,
    'Entrepreneurship': Rocket, 'Financial Literacy': IndianRupee, 'default': Lightbulb
  };

  const subjectColors: Record<string, string> = {
    'Mathematics': 'from-purple-500 to-pink-500', 'Science': 'from-blue-500 to-cyan-500',
    'English': 'from-emerald-500 to-teal-500', 'Computer Science': 'from-indigo-500 to-blue-500',
    'Reasoning': 'from-orange-500 to-red-500', 'General Knowledge': 'from-green-500 to-emerald-500',
    'default': 'from-purple-500 to-pink-500'
  };

  const { data: siteSettings } = useQuery<Record<string, string>>({
    queryKey: ["/api/public/settings"],
  });

  const testimonials: { name: string; role: string; quote: string; avatar: string }[] = (() => {
    try {
      const parsed = JSON.parse(siteSettings?.testimonials || "[]");
      return Array.isArray(parsed) ? parsed : [];
    } catch { return []; }
  })();


  return (
    <PublicLayout>
      <Helmet>
        <title>Samikaran Olympiad | India's #1 Online Olympiad Platform for Class 1-12</title>
        <meta name="description" content="Secure AI-proctored online olympiad exams for school students (Class 1-12). Math, Science, English, Reasoning & more. Instant results, national rankings, certificates & scholarships. Join 5000+ participants." />
        <meta name="keywords" content="school olympiad india, online olympiad exam, class 1-12 olympiad, national olympiad india, math olympiad, science olympiad, english olympiad, AI proctored exam, scholarship exam students, samikaran olympiad, olympiad registration, student olympiad 2026, CBSE olympiad, ICSE olympiad" />
        <meta name="robots" content="index, follow" />
        <link rel="canonical" href="https://www.samikaranolympiad.com" />
        <meta property="og:title" content="Samikaran Olympiad | India's #1 Online Olympiad Platform for Class 1-12" />
        <meta property="og:description" content="Secure AI-proctored online olympiad exams for school students (Class 1-12). Instant results, national rankings & certificates. Join 5000+ participants." />
        <meta property="og:type" content="website" />
        <meta property="og:url" content="https://www.samikaranolympiad.com" />
        <meta property="og:image" content="https://www.samikaranolympiad.com/og-image.png" />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:site_name" content="Samikaran Olympiad" />
        <meta property="og:locale" content="en_IN" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@SamikaranOlympiad" />
        <meta name="twitter:title" content="Samikaran Olympiad | India's #1 Online Olympiad Platform for Class 1-12" />
        <meta name="twitter:description" content="Secure AI-proctored online olympiad exams for school students (Class 1-12). Instant results, national rankings & certificates." />
        <meta name="twitter:image" content="https://www.samikaranolympiad.com/og-image.png" />
        <script type="application/ld+json">{JSON.stringify(buildOrganizationSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(buildWebSiteSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(buildEducationalOrgSchema())}</script>
        <script type="application/ld+json">{JSON.stringify(buildFaqSchema([
          { q: "Who can participate in Samikaran Olympiad?", a: "Students from Class 1 to Class 12 enrolled in any recognized school in India can participate. CBSE, ICSE, State Board and international curriculum students are all welcome." },
          { q: "What subjects are available for olympiad exams?", a: "We offer olympiads in Mathematics, Science, English, Reasoning, General Knowledge, Hindi Sahitya, Cyber Science, and more across all classes." },
          { q: "How does AI proctoring work?", a: "Our AI proctoring system uses webcam monitoring, face detection, and activity tracking to ensure exam integrity. It flags suspicious behavior and generates a detailed proctoring report." },
          { q: "When will exam results be available?", a: "Results are available instantly after exam submission. Detailed scorecards, rank cards, and digital certificates are generated within 24-48 hours." },
          { q: "What awards and prizes can students win?", a: "Winners receive Gold, Silver, and Bronze medals, certificates of excellence, letters of recommendation, cash prizes, and scholarships. Every participant receives a participation certificate." },
          { q: "How do I register for an olympiad exam?", a: "Create a free student account, complete your profile, browse available olympiads, pay the registration fee online, and appear for the exam during the scheduled window from any device." }
        ]))}</script>
      </Helmet>

      {/* ═══════════ HERO SECTION ═══════════ */}
      <section ref={heroRef} className="relative min-h-[92vh] flex items-center overflow-hidden bg-gradient-to-br from-[#0f0a1e] via-[#1a1035] to-[#0f0a1e]" aria-label="Hero Section">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[-20%] right-[-10%] w-[600px] h-[600px] bg-pink-600/8 rounded-full blur-[120px]" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-violet-500/5 rounded-full blur-[100px]" />
          <div className="absolute inset-0 opacity-[0.02]" style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }} />
        </div>
        <HeroParticles />

        <motion.div style={{ y: heroY, opacity: heroOpacity }} className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 pt-12 pb-16 lg:pt-20 lg:pb-24">
          <div className="flex flex-col lg:flex-row gap-12 lg:gap-16 items-center">
            <div className="w-full lg:w-[55%] text-center lg:text-left">
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.5 }} className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 backdrop-blur-sm border border-white/10 mb-8">
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
                <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-purple-300">2026 Registrations Open</span>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3, duration: 0.7, ease: "easeOut" }} className="text-3xl sm:text-4xl md:text-5xl lg:text-[3.5rem] xl:text-6xl font-black tracking-tight mb-6 leading-[1.12]" style={{ letterSpacing: '-0.01em' }} data-testid="text-hero-heading">
                <span className="text-white">Where Potential</span><br />
                <span className="brand-text">Becomes Legacy.</span><br />
                <span className="text-white">Compete. Shine. Inspire</span>
                <span className="text-pink-500">.</span>
              </motion.h1>

              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.6 }} className="text-base sm:text-lg text-gray-400 mb-8 max-w-xl mx-auto lg:mx-0 leading-relaxed">
                India's most prestigious national Olympiad — empowering students from <strong className="text-white font-semibold">Class 1–12</strong> to compete, earn scholarships, and claim national recognition.
              </motion.p>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65, duration: 0.5 }} className="flex flex-col sm:flex-row gap-4 items-center justify-center lg:justify-start">
                <Link href="/olympiads">
                  <Button size="lg" className="brand-button rounded-full px-7 h-14 text-sm font-bold shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 transition-shadow group" data-testid="button-explore-olympiads">
                    <GraduationCap className="mr-2 w-5 h-5" />
                    Explore Olympiads
                    <ArrowRight className="ml-2 w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/register">
                  <Button variant="outline" size="lg" className="rounded-full px-7 h-14 text-sm font-bold border-white/20 text-white hover:bg-white/10 bg-transparent group" data-testid="button-register-now">
                    <UserPlus className="mr-2 w-5 h-5" />
                    Register Free
                  </Button>
                </Link>
              </motion.div>

              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.85, duration: 0.6 }} className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-10 justify-center lg:justify-start text-sm text-gray-500">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400">AI-Proctored Exams</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400">10+ Olympiad Subjects</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-green-400" />
                  <span className="text-gray-400">Instant Results & Certificates</span>
                </div>
              </motion.div>
            </div>

            <div className="w-full lg:w-[45%] relative">
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }} className="relative">
                <OlympiadIllustration />
              </motion.div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════ STATS SECTION ═══════════ */}
      <section className="py-12 sm:py-14 bg-white dark:bg-background relative">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10 sm:mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-3" style={{ letterSpacing: '0.02em' }}>
              Our <span className="brand-text">Impact</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-lg mx-auto">Numbers that speak for themselves</p>
          </motion.div>
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-80px" }} className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-8">
            {[
              { icon: Users, label: "Participants", value: 5000, suffix: "+", color: "from-purple-500 to-pink-500", desc: "Registered students nationwide" },
              { icon: Globe, label: "States", value: 10, suffix: "+", color: "from-blue-500 to-cyan-500", desc: "Nationwide coverage" },
              { icon: Shield, label: "Proctored", value: 100, suffix: "%", color: "from-green-500 to-emerald-500", desc: "AI-secured exams" },
              { icon: Trophy, label: "Scholarships", value: 50, prefix: "₹", suffix: "L+", color: "from-orange-500 to-red-500", desc: "Total prize pool" }
            ].map((item, i) => (
              <motion.div key={i} variants={fadeUp} className="group relative p-6 sm:p-8 rounded-3xl bg-white dark:bg-card border border-gray-100 dark:border-border/50 shadow-sm hover:shadow-xl transition-all duration-500 overflow-hidden">
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br from-purple-50 via-transparent to-pink-50 dark:from-purple-900/10 dark:to-pink-900/10 pointer-events-none" />
                <div className="relative z-10">
                  <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-4 sm:mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                    <item.icon className="w-6 h-6 sm:w-7 sm:h-7 text-white" />
                  </div>
                  <div className="text-3xl sm:text-4xl font-black mb-1 brand-text">
                    <AnimatedCounter target={item.value} suffix={item.suffix} prefix={item.prefix || ""} />
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 dark:text-foreground/60 mb-0.5">{item.label}</div>
                  <p className="text-xs text-gray-400 dark:text-muted-foreground mt-2 hidden sm:block">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ WHY SAMIKARAN ═══════════ */}
      <section className="py-12 sm:py-16 bg-gradient-to-b from-violet-50 via-purple-50/50 to-fuchsia-50/30 dark:from-purple-950/20 dark:via-background dark:to-purple-950/10 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-[-10%] left-[-5%] w-[400px] h-[400px] bg-purple-300/15 dark:bg-purple-500/5 rounded-full blur-[100px]" />
          <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-pink-300/10 dark:bg-pink-500/5 rounded-full blur-[100px]" />
        </div>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center max-w-2xl mx-auto mb-14 sm:mb-20">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/80 dark:bg-purple-900/30 border border-purple-200/60 dark:border-purple-700/30 text-xs font-bold uppercase tracking-widest text-purple-700 dark:text-purple-300 mb-5">
              <Sparkles className="w-3.5 h-3.5" /> Why Choose Us
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase mb-5" style={{ letterSpacing: '0.03em' }}>Why <span className="brand-text">Samikaran?</span></h2>
            <p className="text-base sm:text-lg text-muted-foreground italic">"Building the foundation for tomorrow's leaders today."</p>
          </motion.div>

          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true, margin: "-50px" }} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {[
              { title: "Cash Prizes", desc: "Win exciting cash prizes and scholarships for top performers in every olympiad.", icon: IndianRupee, color: "from-yellow-500 to-orange-500", accent: "bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200/60 dark:border-yellow-700/30" },
              { title: "AI Proctored", desc: "Advanced facial recognition and tab-detection for 100% exam integrity.", icon: Shield, color: "from-blue-500 to-cyan-500", accent: "bg-blue-50 dark:bg-blue-900/10 border-blue-200/60 dark:border-blue-700/30" },
              { title: "Global Rank", desc: "Compare your performance against thousands of students nationwide.", icon: Globe, color: "from-purple-500 to-pink-500", accent: "bg-purple-50 dark:bg-purple-900/10 border-purple-200/60 dark:border-purple-700/30" },
              { title: "Certificates", desc: "Gold, Silver and Bronze certificates for outstanding achievements.", icon: Award, color: "from-emerald-500 to-green-500", accent: "bg-emerald-50 dark:bg-emerald-900/10 border-emerald-200/60 dark:border-emerald-700/30" },
              { title: "Recommendations", desc: "Get Letters of Recommendation for top-performing students.", icon: FileText, color: "from-orange-500 to-red-500", accent: "bg-orange-50 dark:bg-orange-900/10 border-orange-200/60 dark:border-orange-700/30" },
              { title: "Share Results", desc: "Shareable links to celebrate achievements with family and friends.", icon: Share2, color: "from-pink-500 to-rose-500", accent: "bg-pink-50 dark:bg-pink-900/10 border-pink-200/60 dark:border-pink-700/30" },
              { title: "Adaptive AI", desc: "Questions powered by AI that grow with your understanding.", icon: Brain, color: "from-violet-500 to-purple-500", accent: "bg-violet-50 dark:bg-violet-900/10 border-violet-200/60 dark:border-violet-700/30" },
              { title: "Instant Analytics", desc: "Deep performance insights within seconds of exam submission.", icon: BarChart3, color: "from-green-500 to-teal-500", accent: "bg-green-50 dark:bg-green-900/10 border-green-200/60 dark:border-green-700/30" }
            ].map((feature, i) => (
              <motion.div key={i} variants={fadeUp} className={`group p-6 sm:p-7 rounded-2xl bg-white/80 dark:bg-card backdrop-blur-sm border ${feature.accent} hover:shadow-xl hover:-translate-y-2 transition-all duration-300 relative overflow-hidden`}>
                <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${feature.color} opacity-[0.04] rounded-full blur-2xl -translate-y-1/2 translate-x-1/2 group-hover:opacity-[0.08] transition-opacity`} />
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-5 shadow-lg group-hover:scale-110 group-hover:rotate-3 transition-all duration-300`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-base font-black uppercase mb-2.5 text-foreground" style={{ letterSpacing: '0.04em' }}>{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-[1.75] tracking-normal">{feature.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══════════ EXPLORE OLYMPIADS ═══════════ */}
      <section id="olympiads" className="py-12 sm:py-16 relative overflow-hidden bg-gray-50 dark:bg-gray-950/50">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/20 dark:bg-purple-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-pink-300/15 dark:bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10 sm:mb-14">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200/50 dark:border-purple-500/20 text-xs font-bold uppercase tracking-widest text-purple-700 dark:text-purple-300 mb-5">
              <Sparkles className="w-4 h-4" /> Explore & Register
            </span>
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black mb-4" style={{ letterSpacing: '0.02em' }}>
              Explore <span className="brand-text">Olympiads</span>
            </h2>
            <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
              World-class olympiad examinations designed to challenge brilliant minds across multiple disciplines.
            </p>
          </motion.div>

          <div className="flex justify-center mb-10">
            <div className="inline-flex rounded-2xl bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-white/50 dark:border-gray-700/50 p-1.5 shadow-xl">
              <button
                onClick={() => setAgeTab("little")}
                className={`relative px-6 sm:px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                  ageTab === "little" ? "bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
                data-testid="button-tab-little-champs"
              >
                <Rocket className="w-4 h-4" />
                <span className="hidden sm:inline">Little Champs</span>
                <span className="sm:hidden">Little</span>
                <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${ageTab === "little" ? "bg-white/25" : "bg-gray-200 dark:bg-gray-700"}`}>1-5</span>
              </button>
              <button
                onClick={() => setAgeTab("elite")}
                className={`relative px-6 sm:px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-widest transition-all duration-300 flex items-center gap-2 ${
                  ageTab === "elite" ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25" : "text-gray-500 dark:text-gray-400 hover:text-gray-700"
                }`}
                data-testid="button-tab-elite-seniors"
              >
                <GraduationCap className="w-4 h-4" />
                <span className="hidden sm:inline">Elite Seniors</span>
                <span className="sm:hidden">Elite</span>
                <span className={`ml-1 text-[10px] px-2 py-0.5 rounded-full ${ageTab === "elite" ? "bg-white/25" : "bg-gray-200 dark:bg-gray-700"}`}>6-12</span>
              </button>
            </div>
          </div>

          <div className="text-center mb-8">
            <p className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
              {ageTab === "little" ? "Little Champs — Class 1 to 5" : "Elite Seniors — Class 6 to 12"}
            </p>
          </div>

          <motion.div key={ageTab} variants={staggerContainer} initial="hidden" animate="visible" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-6">
            {(olympiads || [])
              .filter(exam => {
                const minCl = exam.minClass || 1;
                const maxCl = exam.maxClass || 12;
                if (maxCl <= 5) return ageTab === "little";
                if (minCl >= 6) return ageTab === "elite";
                const mid = (minCl + maxCl) / 2;
                return ageTab === "little" ? mid < 6 : mid >= 6;
              })
              .map((exam) => {
                const IconComponent = subjectIcons[exam.subject || 'default'] || subjectIcons['default'];
                const colorClass = subjectColors[exam.subject || 'default'] || subjectColors['default'];
                const regStatus = getRegistrationStatus(exam);
                return (
                  <motion.div key={exam.id} variants={scaleIn} onClick={() => navigate(`/olympiad/${exam.id}`)} className="group cursor-pointer" data-testid={`card-olympiad-${exam.id}`}>
                    <div className="relative h-full rounded-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border border-white/60 dark:border-gray-700/50 shadow-md hover:shadow-2xl transition-all duration-500 hover:-translate-y-1 overflow-hidden">
                      <div className={`relative h-32 sm:h-36 bg-gradient-to-br ${colorClass} overflow-hidden`}>
                        <div className="absolute inset-0 opacity-10" style={{backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='40' height='40' viewBox='0 0 40 40' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='%23ffffff' fill-opacity='0.3' fill-rule='evenodd'%3E%3Cpath d='M0 40L40 0H20L0 20M40 40V20L20 40'/%3E%3C/g%3E%3C/svg%3E\")"}} />
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shadow-2xl group-hover:scale-110 transition-transform duration-500">
                            <IconComponent className="w-7 h-7 text-white" />
                          </div>
                        </div>
                        <div className="absolute top-3 left-3">
                          <span className={`px-2.5 py-1 rounded-full ${regStatus.color} text-[9px] font-bold uppercase tracking-widest`}>{regStatus.label}</span>
                        </div>
                        <div className="absolute top-3 right-3">
                          <span className="px-2.5 py-1 rounded-full bg-white/90 dark:bg-gray-900/90 backdrop-blur-sm text-[9px] font-bold uppercase tracking-widest text-foreground shadow-sm">
                            Class {exam.classCategory || `${exam.minClass || 1}-${exam.maxClass || 12}`}
                          </span>
                        </div>
                      </div>
                      <div className="p-4 sm:p-5">
                        <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-2">{exam.subject}</div>
                        <h3 className="text-base font-bold tracking-tight group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors line-clamp-2 mb-3 text-foreground">{exam.title}</h3>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground mb-4">
                          <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{exam.durationMinutes}m</span>
                          <span className="flex items-center gap-1"><Target className="w-3.5 h-3.5" />{exam.totalMarks} marks</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-medium text-muted-foreground">{new Date(exam.startTime).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-500 flex items-center gap-1">Details <ChevronRight className="w-3 h-3" /></span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            {(olympiads || []).filter(exam => {
              const minCl = exam.minClass || 1;
              const maxCl = exam.maxClass || 12;
              if (maxCl <= 5) return ageTab === "little";
              if (minCl >= 6) return ageTab === "elite";
              const mid = (minCl + maxCl) / 2;
              return ageTab === "little" ? mid < 6 : mid >= 6;
            }).length === 0 && (
              <div className="col-span-full text-center py-16">
                <div className="w-20 h-20 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center mx-auto mb-6">
                  <BookOpen className="w-10 h-10 text-purple-400" />
                </div>
                <h3 className="text-xl font-black uppercase mb-2 text-foreground">No Olympiads Available</h3>
                <p className="text-sm text-muted-foreground">{ageTab === "little" ? "Little Champs (Class 1-5)" : "Elite Seniors (Class 6-12)"} olympiads will be announced soon.</p>
              </div>
            )}
          </motion.div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mt-12">
            <Link href="/olympiads">
              <Button variant="outline" className="px-8 py-3 h-auto rounded-xl font-bold text-xs uppercase tracking-widest border-purple-300 dark:border-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/20" data-testid="button-view-all-olympiads">
                View All Olympiads <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── SEO Section 1: What is Samikaran Olympiad? ─────────────── */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-gradient-to-br from-[#0f0a1e] via-[#1a1035] to-[#0f0a1e]" aria-label="About Samikaran Olympiad">
        {/* Bg orbs */}
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-violet-700/20 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-fuchsia-700/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* Left: content */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-violet-400 mb-4 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20">About Us</span>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white mb-6">
                What is Samikaran Olympiad?{" "}
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">India's Premier Online Olympiad</span>{" "}
                Examination Platform
              </h2>
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed text-justify mb-6">
                Samikaran Olympiad is India's most trusted online olympiad examination platform designed for students from Class 1 to Class 12. We conduct AI-powered competitive exams in over 20 subjects including Mathematics Olympiad, Science Olympiad, English Olympiad, Computer Science Olympiad, Reasoning Olympiad, and more. Our platform combines cutting-edge artificial intelligence with secure proctoring technology to deliver a fair, transparent, and world-class examination experience.
              </p>
              <h3 className="text-xl font-semibold leading-snug tracking-normal text-white mb-4">Why Choose Online Olympiad Exams?</h3>
              <p className="text-base sm:text-lg text-gray-300 leading-relaxed text-justify">
                Online olympiad exams offer unparalleled convenience and accessibility for students across India. Whether you're in a metro city or a remote village, Samikaran brings competitive examinations to your doorstep. Our AI-proctored online exams ensure 100% exam integrity with facial recognition technology and tab-detection systems, making cheating impossible while allowing students to take exams from the comfort of their homes.
              </p>
            </motion.div>

            {/* Right: glassmorphism feature card */}
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={{ hidden: { opacity: 0, x: 40 }, visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: "easeOut" } } }}>
              <div className="rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
                <p className="text-sm font-bold uppercase tracking-widest text-violet-300 mb-6">Platform Highlights</p>
                <div className="grid grid-cols-2 gap-5">
                  {[
                    { icon: BookOpen, label: "20+ Subjects", sub: "Math, Science, English & more", color: "from-violet-500 to-purple-600" },
                    { icon: Sparkles, label: "AI-Powered", sub: "Smart proctoring & analytics", color: "from-fuchsia-500 to-pink-600" },
                    { icon: GraduationCap, label: "Class 1–12", sub: "All boards — CBSE, ICSE, State", color: "from-blue-500 to-indigo-600" },
                    { icon: Shield, label: "100% Secure", sub: "Facial recognition & monitoring", color: "from-emerald-500 to-teal-600" },
                  ].map(({ icon: Icon, label, sub, color }) => (
                    <div key={label} className="flex flex-col gap-3 p-5 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm">{label}</p>
                        <p className="text-xs text-white/50 mt-0.5 leading-relaxed">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SEO Section 2: Olympiad Subjects ───────────────────────── */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-gray-50 dark:bg-gray-950/40" aria-label="Olympiad Subjects">
        {/* subtle dot pattern */}
        <div className="absolute inset-0 opacity-30 dark:opacity-10" style={{ backgroundImage: "radial-gradient(#7C3AED 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

        <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-foreground mb-4">
              Olympiad Subjects We Offer —{" "}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Class 1 to 12</span>
            </h2>
            <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
            <p className="mt-5 text-base text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl mx-auto">Expert-crafted questions aligned with NCERT, CBSE, ICSE &amp; State Board curricula across every major discipline.</p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { icon: Calculator, title: "Mathematics Olympiad", color: "from-violet-500 to-purple-600", desc: "Tests logical reasoning, problem-solving, and mathematical aptitude for Class 1–12. Prepares students for IMO (International Mathematical Olympiad) with NCERT-aligned questions.", tag: "Most Popular" },
              { icon: FlaskConical, title: "Science Olympiad", color: "from-blue-500 to-indigo-600", desc: "Covers Physics, Chemistry, and Biology with real-world applications and scientific reasoning challenges that develop analytical thinking in young minds.", tag: "Physics · Chemistry · Biology" },
              { icon: BookOpen, title: "English Olympiad", color: "from-emerald-500 to-teal-600", desc: "Focuses on grammar, vocabulary, comprehension, and creative writing skills to improve English proficiency through competitive assessment for Class 1–12.", tag: "Language Skills" },
              { icon: Code, title: "Computer Science & Coding", color: "from-orange-500 to-amber-600", desc: "Introduces programming logic, algorithms, and computational thinking — from basic computer fundamentals to advanced coding challenges for senior classes.", tag: "Future-Ready" },
              { icon: Brain, title: "General Knowledge & Reasoning", color: "from-fuchsia-500 to-pink-600", desc: "Tests current affairs awareness, logical reasoning, and critical thinking abilities essential for holistic development and all competitive exam preparation.", tag: "Aptitude & GK" },
            ].map(({ icon: Icon, title, color, desc, tag }, i) => (
              <motion.div
                key={title}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.08 } } }}
                className="group relative bg-white dark:bg-card rounded-3xl p-7 shadow-sm border border-gray-100 dark:border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-default overflow-hidden"
              >
                {/* hover gradient border */}
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${color} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
                <div className={`absolute bottom-0 left-0 right-0 h-[3px] bg-gradient-to-r ${color} scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left rounded-b-3xl`} />

                <div className={`w-13 h-13 mb-5 rounded-2xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg w-12 h-12`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full bg-gradient-to-r ${color} text-white mb-3 inline-block`}>{tag}</span>
                <h3 className="text-lg font-semibold leading-snug tracking-normal text-foreground mb-2 mt-2">{title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 leading-[1.8] tracking-normal text-justify">{desc}</p>
                <Link href="/olympiads" className="inline-flex items-center gap-1 mt-5 text-xs font-bold text-violet-600 dark:text-violet-400 hover:gap-2 transition-all">Learn More <ArrowRight className="w-3 h-3" /></Link>
              </motion.div>
            ))}

            {/* CTA card */}
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: 0.4 } } }}
              className="bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-3xl p-7 flex flex-col justify-between shadow-xl"
            >
              <div>
                <Trophy className="w-10 h-10 text-white/80 mb-5" />
                <h3 className="text-xl font-black text-white mb-2">Ready to Compete?</h3>
                <p className="text-sm text-white/80 leading-relaxed">Register today and join thousands of students competing at national level.</p>
              </div>
              <Link href="/olympiads" className="mt-8">
                <Button className="w-full bg-white text-violet-700 hover:bg-white/90 font-bold rounded-xl h-11" data-testid="button-seo-explore-subjects">
                  Explore All Subjects <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── SEO Section 3: Benefits ─────────────────────────────────── */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-gradient-to-br from-[#1e1040] via-[#2d1b69] to-[#1a0f3c]" aria-label="Benefits of Samikaran Olympiad">
        {/* Decorative orbs */}
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-violet-600/20 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-fuchsia-600/15 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 max-w-7xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white mb-4">
              Benefits of Participating in{" "}
              <span className="bg-gradient-to-r from-violet-300 to-fuchsia-300 bg-clip-text text-transparent">Samikaran Olympiad</span>
            </h2>
            <p className="text-base text-gray-300 leading-[1.8] tracking-normal max-w-xl mx-auto">Designed to give every participant a meaningful competitive edge — students, schools, and parents alike.</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                label: "For Students",
                accent: "from-violet-400 to-purple-500",
                benefits: [
                  "National & State-level Rankings across India",
                  "Instant Results & AI Performance Analytics",
                  "Certificates of Excellence (Gold, Silver, Bronze)",
                  "Cash Prizes & Scholarships worth lakhs",
                  "Letters of Recommendation for top scorers",
                  "Preparation for JEE, NEET, NDA, NTSE",
                ]
              },
              {
                icon: Building2,
                label: "For Schools",
                accent: "from-fuchsia-400 to-pink-500",
                benefits: [
                  "Zero infrastructure cost for online exams",
                  "Dedicated School Dashboard & analytics",
                  "Bulk registration for entire classes",
                  "School-wise rankings & performance reports",
                  "Partnership benefits & revenue sharing",
                ]
              },
              {
                icon: Heart,
                label: "For Parents",
                accent: "from-blue-400 to-indigo-500",
                benefits: [
                  "Safe, AI-proctored exams from home",
                  "Real-time performance tracking & insights",
                  "Affordable fees with high-value outcomes",
                  "Healthy competitive exposure without stress",
                ]
              }
            ].map(({ icon: Icon, label, accent, benefits }, i) => (
              <motion.div
                key={label}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0, transition: { duration: 0.55, delay: i * 0.12 } } }}
                className="group relative rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 hover:bg-white/10 hover:scale-[1.02] transition-all duration-300 cursor-default overflow-hidden"
              >
                <div className={`absolute inset-0 rounded-3xl bg-gradient-to-br ${accent} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${accent} flex items-center justify-center shadow-lg mb-5`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="text-xl font-semibold leading-snug tracking-normal text-white mb-5">{label}</h3>
                <ul className="space-y-2">
                  {benefits.map((b) => (
                    <li key={b} className="flex gap-3 text-sm text-gray-200 leading-[1.75] tracking-normal">
                      <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#10b981" }} />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SEO Section 4: How It Works ─────────────────────────────── */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-gradient-to-br from-[#0f0a1e] via-[#1a1035] to-[#0f0a1e]" aria-label="How to Participate in Samikaran Olympiad">
        <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-violet-700/15 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-fuchsia-700/10 rounded-full blur-[100px] pointer-events-none" />

        <div className="container mx-auto px-4 sm:px-6 max-w-5xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-white mb-4">
              How to Participate in{" "}
              <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Samikaran Olympiad</span>{" "}
              Online Exams
            </h2>
            <p className="text-base text-gray-300 leading-[1.8] tracking-normal max-w-xl mx-auto">From registration to receiving your certificate — 5 simple steps.</p>
          </motion.div>

          <ol className="relative space-y-0">
            {/* vertical dotted line */}
            <div className="absolute left-7 sm:left-1/2 top-8 bottom-8 w-px border-l-2 border-dashed border-violet-500/30 -translate-x-px hidden sm:block" />

            {[
              { step: "01", icon: UserPlus, title: "Register on Samikaran Olympiad Platform", desc: "Create your free student account on www.samikaranolympiad.com in under 2 minutes. Students, schools, and parents can register independently. Fill in basic details like name, class, school, city, and contact information." },
              { step: "02", icon: Calendar, title: "Choose Your Olympiad Subject and Date", desc: "Browse our olympiad calendar and select the subjects you want to participate in — Mathematics, Science, English, Computer Science, or others. Choose a convenient exam date and time slot. We offer flexible scheduling to accommodate students across different time zones." },
              { step: "03", icon: CreditCard, title: "Make Payment & Confirm Registration", desc: "Pay the nominal exam fee online through secure payment gateways (UPI, Credit Card, Debit Card, Net Banking). Receive instant confirmation via email and SMS with exam instructions and admit card." },
              { step: "04", icon: Monitor, title: "Take AI-Proctored Exam from Home", desc: "On exam day, login to your Samikaran dashboard 15 minutes before the scheduled time. Our AI proctoring system will verify your identity using facial recognition. Take the exam on your laptop or desktop with a stable internet connection." },
              { step: "05", icon: Award, title: "Get Instant Results & Certificates", desc: "Receive your results within seconds of exam submission. View detailed performance analytics including subject-wise breakdown, time management insights, and improvement suggestions. Download your digital certificate immediately." },
            ].map(({ step, icon: Icon, title, desc }, i) => {
              const isRight = i % 2 !== 0;
              return (
                <motion.li
                  key={step}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={{ hidden: { opacity: 0, y: 30 }, visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.1 } } }}
                  className={`relative flex flex-col sm:flex-row gap-6 sm:gap-0 pb-12 last:pb-0 ${isRight ? "sm:flex-row-reverse" : ""}`}
                >
                  {/* Step node (center on lg) */}
                  <div className="sm:absolute sm:left-1/2 sm:-translate-x-1/2 flex items-center justify-center z-10 shrink-0">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center shadow-xl shadow-violet-500/30 border-2 border-violet-400/30">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>

                  {/* Card */}
                  <div className={`group sm:w-[calc(50%-4rem)] ${isRight ? "sm:mr-auto sm:pr-0 sm:pl-0" : "sm:ml-auto"}`}>
                    <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6 hover:bg-white/10 hover:-translate-y-1 transition-all duration-300 shadow-xl">
                      <div className="flex items-center gap-3 mb-3">
                        <span className="text-xs font-black text-violet-400 tracking-widest">STEP {step}</span>
                      </div>
                      <h3 className="text-base sm:text-lg font-semibold leading-snug tracking-normal text-white mb-3">{title}</h3>
                      <p className="text-sm text-gray-300 leading-[1.8] tracking-normal text-justify">{desc}</p>
                    </div>
                  </div>
                </motion.li>
              );
            })}
          </ol>
        </div>
      </section>

      {/* ── SEO Section 5: FAQs ─────────────────────────────────────── */}
      <section className="relative py-20 sm:py-28 overflow-hidden bg-gray-50 dark:bg-gray-950/40" aria-label="Frequently Asked Questions">
        {/* Floating dots */}
        <div className="absolute top-10 left-10 w-3 h-3 rounded-full bg-violet-400/30 animate-pulse" />
        <div className="absolute top-1/3 right-16 w-2 h-2 rounded-full bg-fuchsia-400/40 animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-20 left-1/4 w-4 h-4 rounded-full bg-purple-400/20 animate-pulse" style={{ animationDelay: "0.5s" }} />

        <div className="container mx-auto px-4 sm:px-6 max-w-3xl relative z-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold leading-tight tracking-tight text-foreground mb-4">
              Frequently Asked Questions About{" "}
              <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Samikaran Olympiad</span>
            </h2>
            <div className="mx-auto mt-4 h-1 w-24 rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500" />
          </motion.div>

          <div className="space-y-3">
            {[
              { q: "Who can participate in Samikaran Olympiad exams?", a: "Students from Class 1 to Class 12 studying in any school across India (CBSE, ICSE, State Board, IGCSE) can participate in our olympiad exams." },
              { q: "What is the exam fee for olympiad exams?", a: "Exam fees vary by subject and class level, typically ranging from ₹100 to ₹500 per olympiad. Bulk discounts are available for schools registering multiple students." },
              { q: "Are the exams AI-proctored and secure?", a: "Yes, all Samikaran olympiad exams use advanced AI proctoring with facial recognition, tab-detection, and real-time monitoring to ensure 100% exam integrity." },
              { q: "When will I receive my results and certificates?", a: "Results are generated instantly upon exam submission. Certificates are available for download within 24 hours of the exam." },
            ].map((faq, i) => (
              <motion.div
                key={i}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
                variants={{ hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4, delay: i * 0.08 } } }}
                className={`group rounded-2xl border bg-white dark:bg-card shadow-sm hover:border-violet-400 dark:hover:border-violet-500 transition-colors duration-300 overflow-hidden ${openFaq === i ? "border-violet-400 dark:border-violet-500" : "border-gray-100 dark:border-border/50"}`}
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center gap-4 p-5 sm:p-6 text-left"
                  aria-expanded={openFaq === i}
                  data-testid={`button-faq-${i}`}
                >
                  <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${openFaq === i ? "bg-gradient-to-br from-violet-500 to-fuchsia-600" : "bg-violet-50 dark:bg-violet-900/20"}`}>
                    <HelpCircle className={`w-4 h-4 transition-colors ${openFaq === i ? "text-white" : "text-violet-600 dark:text-violet-400"}`} />
                  </div>
                  <h3 className="flex-1 text-sm sm:text-base font-semibold leading-normal tracking-normal text-foreground">{faq.q}</h3>
                  <ChevronDown className={`shrink-0 w-5 h-5 text-muted-foreground transition-transform duration-300 ${openFaq === i ? "rotate-180 text-violet-600" : ""}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40 pb-5" : "max-h-0"}`}>
                  <p className="px-5 sm:px-6 text-sm text-gray-600 dark:text-gray-400 leading-[1.8] tracking-normal text-justify">{faq.a}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-10 text-center">
            <Link href="/faq">
              <Button className="px-8 py-4 h-auto rounded-2xl font-bold text-sm brand-gradient text-white shadow-lg shadow-violet-500/30 hover:opacity-90 transition-opacity" data-testid="button-view-all-faqs">
                View All FAQs <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {testimonials.length > 0 && (
        <section className="py-12 sm:py-16 bg-white dark:bg-background overflow-hidden">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10 sm:mb-12">
              <h2 className="text-3xl sm:text-4xl font-black mb-3" style={{ letterSpacing: '0.02em' }}>
                Scholars' <span className="brand-text">Voice</span>
              </h2>
              <p className="text-base text-muted-foreground">What our community says about us</p>
            </motion.div>

            <div className="relative">
              <div className="flex gap-5 sm:gap-6 animate-scroll">
                {[...testimonials, ...testimonials].map((t, i) => (
                  <div key={i} className="min-w-[300px] sm:min-w-[380px] p-6 sm:p-8 rounded-2xl bg-gray-50 dark:bg-card border border-gray-100 dark:border-border/50 relative flex-shrink-0 hover:shadow-lg transition-shadow">
                    <Quote className="absolute top-6 right-6 w-8 h-8 text-purple-100 dark:text-purple-900/30" />
                    <div className="flex items-center gap-3 mb-5">
                      <div className="w-11 h-11 rounded-full brand-gradient flex items-center justify-center text-white font-bold text-sm shadow-lg">{t.avatar}</div>
                      <div>
                        <div className="font-bold text-sm text-foreground">{t.name}</div>
                        <div className="text-[10px] text-purple-500 font-medium uppercase tracking-widest">{t.role}</div>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed italic relative z-10">"{t.quote}"</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════ CTA BANNER ═══════════ */}
      <section className="py-10 sm:py-14 mx-3 sm:mx-4 lg:mx-6">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={scaleIn} className="brand-gradient rounded-3xl sm:rounded-[2rem] p-8 sm:p-12 lg:p-16 relative overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-50%] right-[-20%] w-[500px] h-[500px] bg-white/5 rounded-full blur-3xl" />
            <div className="absolute bottom-[-50%] left-[-20%] w-[400px] h-[400px] bg-white/5 rounded-full blur-3xl" />
          </div>
          <div className="relative z-10 text-center max-w-2xl mx-auto">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white mb-4" style={{ letterSpacing: '0.02em' }}>
              Ready to Compete?
            </h2>
            <p className="text-base sm:text-lg text-white/80 mb-8 leading-relaxed">
              Join thousands of students across India in the most advanced olympiad platform. Registration is free and takes under 2 minutes.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-white text-purple-700 hover:bg-white/90 rounded-full px-8 h-14 text-sm font-bold shadow-xl" data-testid="button-cta-register">
                  Register Now — It's Free <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/register?role=school">
                <Button size="lg" variant="outline" className="border-white/30 text-white hover:bg-white/10 bg-transparent rounded-full px-8 h-14 text-sm font-bold" data-testid="button-cta-school">
                  <GraduationCap className="mr-2 w-5 h-5" /> School Registration
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ═══════════ NEWS & UPDATES ═══════════ */}
      <section className="py-12 bg-gradient-to-br from-[#0f0a1e] via-[#1a1035] to-[#0f0a1e] text-white rounded-2xl sm:rounded-[3rem] mx-3 sm:mx-4 lg:mx-6 relative overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -right-32 w-[400px] h-[400px] bg-violet-600/10 rounded-full blur-[100px]" />
          <div className="absolute -bottom-32 -left-32 w-[400px] h-[400px] bg-fuchsia-600/10 rounded-full blur-[100px]" />
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-10 relative z-10">
          {/* ── Header ── */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <div>
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-purple-500/20 border border-purple-500/30 text-[10px] font-bold uppercase tracking-widest text-purple-300 mb-3">
                <Zap className="w-3 h-3" /> Latest Updates
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold leading-tight tracking-tight text-white">
                News &amp; <span className="brand-text">Updates</span>
              </h2>
            </div>
            <Link href="/blog">
              <Button variant="ghost" className="border border-white/15 text-white/70 hover:text-white hover:bg-white/10 rounded-full text-xs font-bold uppercase tracking-widest px-5 h-9 shrink-0" data-testid="link-view-all-news">
                View All <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
            </Link>
          </motion.div>

          {/* ── News Cards Grid ── */}
          <motion.div variants={staggerContainer} initial="hidden" whileInView="visible" viewport={{ once: true }} className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
            {blogPosts && blogPosts.length > 0 ? (
              blogPosts.slice(0, 4).map((post, i) => {
                const postDate = post.publishedAt ? new Date(post.publishedAt) : (post.createdAt ? new Date(post.createdAt) : new Date());
                const formattedDate = postDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' });
                const icons = [Rocket, BookOpen, Trophy, FileText];
                const accents = ["from-violet-500 to-purple-600", "from-fuchsia-500 to-pink-600", "from-amber-500 to-orange-500", "from-cyan-500 to-blue-600"];
                const tags = ["Announcement", "Resources", "Results", "News"];
                const TagIcon = icons[i % icons.length];
                return (
                  <motion.div key={post.id} variants={fadeUp}>
                    <Link href={`/blog/${post.slug}`}>
                      <div className="group relative h-full cursor-pointer rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:border-purple-500/40 hover:bg-white/8 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] transition-all duration-300">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${accents[i % accents.length]} text-[9px] font-black uppercase tracking-widest text-white shadow-sm`}>
                            <TagIcon className="w-2.5 h-2.5" /> {tags[i % tags.length]}
                          </span>
                          <span className="flex items-center gap-1 text-[10px] text-white/40 shrink-0">
                            <Calendar className="w-3 h-3" /> {formattedDate}
                          </span>
                        </div>
                        <h4 className="text-base font-semibold leading-snug text-white line-clamp-2 mb-3">{post.title}</h4>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-purple-400 group-hover:text-purple-300 transition-colors">
                          Read More <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
                        </div>
                      </div>
                    </Link>
                  </motion.div>
                );
              })
            ) : (
              <>
                {[
                  { icon: UserPlus, tag: "Registration", accent: "from-violet-500 to-purple-600", badge: "Open Now", badgeColor: "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30", title: "2026 Olympiad Registrations Now Open for All Subjects Nationwide" },
                  { icon: Zap, tag: "Announcement", accent: "from-fuchsia-500 to-pink-600", badge: "New", badgeColor: "bg-fuchsia-500/20 text-fuchsia-300 border border-fuchsia-500/30", title: "AI-Powered Proctoring Technology Now Active for All Online Exams" },
                  { icon: FileText, tag: "Resources", accent: "from-cyan-500 to-blue-600", badge: "Available", badgeColor: "bg-cyan-500/20 text-cyan-300 border border-cyan-500/30", title: "Sample Papers for Class 1–12 Now Available — Download Free" },
                  { icon: Trophy, tag: "Results", accent: "from-amber-500 to-orange-500", badge: "Coming Soon", badgeColor: "bg-amber-500/20 text-amber-300 border border-amber-500/30", title: "Scholarship Results & Merit Lists to Be Announced Shortly" },
                ].map((news, i) => {
                  const NewsIcon = news.icon;
                  return (
                    <motion.div key={i} variants={fadeUp}>
                      <div className="group relative h-full rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5 hover:border-purple-500/40 hover:bg-white/8 hover:-translate-y-0.5 hover:shadow-[0_8px_30px_rgba(139,92,246,0.15)] transition-all duration-300">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gradient-to-r ${news.accent} text-[9px] font-black uppercase tracking-widest text-white shadow-sm`}>
                            <NewsIcon className="w-2.5 h-2.5" /> {news.tag}
                          </span>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${news.badgeColor}`}>{news.badge}</span>
                        </div>
                        <h4 className="text-base font-semibold leading-snug text-white line-clamp-2">{news.title}</h4>
                      </div>
                    </motion.div>
                  );
                })}
              </>
            )}
          </motion.div>

          {/* ── Downloads + School CTA Row ── */}
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Downloads 2×2 grid */}
            <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-sm p-5">
              <h3 className="text-sm font-bold uppercase tracking-widest text-white/70 flex items-center gap-2 mb-4">
                <Download className="w-4 h-4 text-purple-400" /> Downloads
              </h3>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { label: "2026 Academic Calendar", icon: Calendar },
                  { label: "Sample Question Papers", icon: FileText },
                  { label: "Previous Year Papers", icon: BookOpen },
                  { label: "Certification Rules", icon: Award },
                ].map((item) => {
                  const DlIcon = item.icon;
                  return (
                    <button key={item.label} className="group flex flex-col items-start gap-2 p-3.5 rounded-xl border border-white/10 bg-white/5 hover:bg-purple-600 hover:border-purple-500 text-left transition-all duration-200" data-testid={`button-download-${item.label.toLowerCase().replace(/\s+/g, '-')}`}>
                      <DlIcon className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors" />
                      <span className="text-[10px] font-bold uppercase tracking-wider text-white/70 group-hover:text-white leading-tight transition-colors">{item.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* School CTA */}
            <div className="brand-gradient rounded-2xl p-5 relative overflow-hidden flex flex-col justify-between">
              <GraduationCap className="absolute -bottom-5 -right-5 w-32 h-32 opacity-10 text-white" />
              <div className="relative z-10">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 border border-white/20 text-[9px] font-black uppercase tracking-widest text-white mb-3">
                  <School className="w-2.5 h-2.5" /> For Schools
                </span>
                <h3 className="text-lg font-bold leading-snug tracking-tight text-white mb-2">Register Your School for Samikaran 2026</h3>
                <p className="text-sm text-white/75 leading-relaxed mb-4">Enrol your students in bulk. Get dedicated coordinator support &amp; performance reports.</p>
              </div>
              <Link href="/register?role=school" className="relative z-10">
                <Button className="w-full h-10 rounded-xl font-bold text-xs tracking-widest uppercase bg-white text-purple-700 hover:bg-white/90 shadow-lg" data-testid="button-school-register">
                  Register Now <ArrowRight className="ml-2 w-3.5 h-3.5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
    </PublicLayout>
  );
}
