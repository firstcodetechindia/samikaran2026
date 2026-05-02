import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRoute, useLocation, Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { 
  ArrowLeft, Calendar, Clock, Award, BookOpen, 
  CheckCircle, AlertCircle, GraduationCap,
  FileText, Loader2, UserCircle,
  Trophy, Target, Lightbulb, ArrowRight,
  Home, Brain, Globe, TrendingUp,
  Sparkles, Star, Zap, Crown, Rocket,
  CreditCard, Eye, ChevronRight
} from "lucide-react";
import { format } from "date-fns";
import { getOlympiadTheme } from "@/lib/olympiadThemes";
import SubjectSVG from "@/components/olympiad/SubjectSVG";
import { PublicLayout } from "@/components/PublicLayout";

interface Olympiad {
  id: number;
  title: string;
  slug: string;
  description: string | null;
  subject: string;
  durationMinutes: number;
  startTime: string;
  endTime: string;
  registrationOpenDate: string;
  registrationCloseDate: string;
  totalMarks: number;
  maxQuestions: number;
  negativeMarking: boolean;
  negativeMarkingWrongCount: number;
  negativeMarkingDeduction: number;
  proctoring: boolean;
  participationFee: number;
  minClass: number;
  maxClass: number;
  difficultyLevel: string;
  totalQuestions: number;
  status: string;
  categoryId?: number;
  syllabusData?: Record<string, string>;
  examPattern?: { sections: Array<{ name: string; questions: number; marks: number }> };
  sampleQuestions?: Record<string, Array<{ question: string; options: string[]; answer: number }>>;
  preparationTips?: string;
  mcqCount?: number;
  trueFalseCount?: number;
  imageBasedCount?: number;
}

const FloatingOrb = ({ delay = 0, size = 300, x = 0, y = 0, color = "from-purple-500/30 to-pink-500/30" }: { delay?: number; size?: number; x?: number; y?: number; color?: string }) => (
  <motion.div
    className={`absolute rounded-full bg-gradient-to-br ${color} blur-3xl`}
    style={{ width: size, height: size, left: `${x}%`, top: `${y}%` }}
    animate={{
      x: [0, 30, -20, 0],
      y: [0, -40, 20, 0],
      scale: [1, 1.1, 0.9, 1],
    }}
    transition={{
      duration: 15 + delay * 2,
      repeat: Infinity,
      delay,
      ease: "easeInOut"
    }}
  />
);

const PARTICLE_POSITIONS = Array.from({ length: 20 }, (_, i) => ({
  left: `${(i * 5 + Math.sin(i) * 10 + 50) % 100}%`,
  top: `${(i * 7 + Math.cos(i) * 15 + 50) % 100}%`,
  duration: 3 + (i % 3)
}));

const GlowingParticle = ({ index, reducedMotion }: { index: number; reducedMotion: boolean }) => {
  const pos = PARTICLE_POSITIONS[index % PARTICLE_POSITIONS.length];
  if (reducedMotion) return null;
  return (
    <motion.div
      className="absolute w-1 h-1 rounded-full bg-white"
      style={{ left: pos.left, top: pos.top }}
      animate={{ opacity: [0, 1, 0], scale: [0, 1.5, 0], y: [0, -100] }}
      transition={{ duration: pos.duration, repeat: Infinity, delay: index * 0.3, ease: "easeOut" }}
    />
  );
};

const PremiumBadge = ({ children, className = "", ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    whileTap={{ scale: 0.95 }}
    className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold backdrop-blur-md bg-white/15 border border-white/20 text-white shadow-lg ${className}`}
    {...props}
  >
    {children}
  </motion.div>
);

export default function OlympiadDetail() {
  const [, params] = useRoute("/olympiad/:slug");
  const [, navigate] = useLocation();
  const slug = params?.slug;
  const prefersReducedMotion = useReducedMotion();
  const [selectedClassTab, setSelectedClassTab] = useState<number | null>(null);

  const handleBack = () => {
    if (window.history.length > 1) {
      window.history.back();
    } else {
      navigate("/");
    }
  };

  const { data: olympiads = [], isLoading } = useQuery<Olympiad[]>({
    queryKey: ["/api/public/olympiads"],
  });

  const olympiad = olympiads.find((o: Olympiad) => o.slug === slug || o.id.toString() === slug);
  const theme = olympiad ? getOlympiadTheme(olympiad.subject) : getOlympiadTheme("");

  interface PageContent {
    seoTitle?: string;
    seoDescription?: string;
    seoKeywords?: string;
    overviewContent?: string;
    faqContent?: { question: string; answer: string }[];
  }

  const { data: pageContent } = useQuery<PageContent | null>({
    queryKey: [`/api/public/olympiad-page-content/${olympiad?.categoryId}`],
    enabled: !!olympiad?.categoryId,
  });

  const [showProfileDialog, setShowProfileDialog] = useState(false);

  const { data: registrations = [] } = useQuery<{examId: number}[]>({
    queryKey: ["/api/exam-registrations"],
  });

  interface StudentProfile {
    id: number;
    firstName?: string;
    lastName?: string;
    gradeLevel?: string;
    dateOfBirth?: string;
    gender?: string;
    phone?: string;
  }

  const { data: profile } = useQuery<StudentProfile>({
    queryKey: ["/api/profile"],
  });

  const isRegistered = olympiad ? registrations.some(r => r.examId === olympiad.id) : false;

  const isProfileComplete = () => {
    if (!profile) return false;
    const requiredFields = [profile.firstName, profile.lastName, profile.gradeLevel, profile.dateOfBirth, profile.gender, profile.phone];
    return requiredFields.every(field => field && field.toString().trim() !== "");
  };

  const handleRegisterClick = () => {
    if (!profile) {
      navigate('/login');
      return;
    }
    if (!isProfileComplete()) {
      setShowProfileDialog(true);
      return;
    }
    if (olympiad) {
      navigate(`/olympiad/${olympiad.id}/register`);
    }
  };

  const handleStartExamClick = () => {
    if (!profile) {
      navigate('/login');
      return;
    }
    if (!isProfileComplete()) {
      setShowProfileDialog(true);
      return;
    }
    navigate(`/secure-exam/${olympiad?.id}`);
  };

  useEffect(() => {
    if (olympiad) {
      setSelectedClassTab(olympiad.minClass || 1);
    }
  }, [olympiad]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center gap-6">
          <Loader2 className="w-12 h-12 text-white animate-spin" />
          <p className="text-white/80 text-lg font-medium">Loading olympiad...</p>
        </motion.div>
      </div>
    );
  }

  if (!olympiad) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900 px-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-md backdrop-blur-xl bg-white/10 rounded-3xl p-8 text-center border border-white/20">
          <AlertCircle className="w-16 h-16 mx-auto text-pink-400 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-3">Olympiad Not Found</h2>
          <p className="text-white/70 mb-6">The olympiad you're looking for doesn't exist or has been removed.</p>
          <Link href="/">
            <Button className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 gap-2">
              <Home className="w-4 h-4" />
              Go to Homepage
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  const now = new Date();
  const startDate = new Date(olympiad.startTime);
  const endDate = new Date(olympiad.endTime);
  const regOpenDate = new Date(olympiad.registrationOpenDate);
  const regCloseDate = new Date(olympiad.registrationCloseDate);

  const isUpcoming = startDate > now;
  const isOngoing = startDate <= now && endDate > now;
  const isEnded = endDate <= now;

  const getStatusInfo = () => {
    if (isEnded) return { label: "Completed", icon: CheckCircle, color: "from-gray-400 to-gray-600" };
    if (isOngoing) return { label: "Live Now", icon: Zap, color: "from-green-400 to-emerald-600" };
    return { label: "Upcoming", icon: Rocket, color: "from-blue-400 to-indigo-600" };
  };

  const getDifficultyInfo = (level: string) => {
    switch (level?.toLowerCase()) {
      case "easy": return { label: "Beginner", icon: Star };
      case "medium": return { label: "Intermediate", icon: Sparkles };
      case "hard": return { label: "Advanced", icon: Crown };
      default: return { label: level || "Standard", icon: Target };
    }
  };

  const statusInfo = getStatusInfo();
  const difficultyInfo = getDifficultyInfo(olympiad.difficultyLevel);
  const feeInRupees = olympiad.participationFee / 100;
  const minClass = olympiad.minClass || 1;
  const maxClass = olympiad.maxClass || 12;
  const classRange = Array.from({ length: maxClass - minClass + 1 }, (_, i) => minClass + i);

  const seoTitle = pageContent?.seoTitle || `${olympiad.title} | ${olympiad.subject} Olympiad - Samikaran`;
  const seoDescription = pageContent?.seoDescription || `Join the ${olympiad.title} for Class ${minClass}-${maxClass}. ${olympiad.totalQuestions} questions, ${olympiad.durationMinutes} minutes. Register now!`;
  const seoKeywords = pageContent?.seoKeywords || `${olympiad.subject} olympiad, ${olympiad.title}, class ${minClass}-${maxClass} olympiad, samikaran olympiad`;
  const aboutOlympiad = pageContent?.overviewContent || olympiad.description || `The ${olympiad.title} is a prestigious national-level ${olympiad.subject.toLowerCase()} competition for students from Class ${minClass} to Class ${maxClass}, organized by Samikaran Olympiad.`;

  const syllabusForClass = selectedClassTab ? (olympiad.syllabusData as Record<string, string>)?.[`class_${selectedClassTab}`] : null;
  const sampleQsForClass = selectedClassTab ? (olympiad.sampleQuestions as Record<string, any[]>)?.[`class_${selectedClassTab}`] : null;
  const examPatternSections = (olympiad.examPattern as any)?.sections || [];

  const defaultFaqs = [
    { q: `What is the ${olympiad.title}?`, a: `A national-level ${olympiad.subject.toLowerCase()} competition for Class ${minClass} to ${maxClass} students organized by Samikaran Olympiad.` },
    { q: "Who can participate?", a: `Students from Class ${minClass} to Class ${maxClass} from any recognized school in India.` },
    { q: "What is the exam format?", a: `${olympiad.totalQuestions || olympiad.maxQuestions} questions, ${olympiad.totalMarks} marks, ${olympiad.durationMinutes} minutes. No negative marking.` },
    { q: "Can I take the exam from home?", a: olympiad.proctoring ? "Yes, it's an online proctored exam with webcam monitoring." : "Yes, it's an online exam you can take from home." },
    { q: "When will results be announced?", a: "Results are typically published within 7-10 days after the exam. You'll be notified via email." },
  ];

  const faqs = pageContent?.faqContent?.length ? pageContent.faqContent.map(f => ({ q: f.question, a: f.answer })) : defaultFaqs;

  const importantDates = [
    { label: "Registration Opens", date: regOpenDate, icon: Calendar },
    { label: "Registration Closes", date: regCloseDate, icon: Calendar },
    { label: "Exam Start", date: startDate, icon: Clock },
    { label: "Exam End", date: endDate, icon: Clock },
  ];

  return (
    <>
      <Helmet>
        <title>{seoTitle}</title>
        <meta name="description" content={seoDescription} />
        <meta name="keywords" content={seoKeywords} />
        <meta name="robots" content="index, follow" />
        <meta property="og:title" content={seoTitle} />
        <meta property="og:description" content={seoDescription} />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="Samikaran Olympiad" />
        <meta property="og:url" content={`https://www.samikaranolympiad.com/olympiad/${olympiad.slug}`} />
        <meta property="og:image" content="https://www.samikaranolympiad.com/logo.png" />
        <link rel="canonical" href={`https://www.samikaranolympiad.com/olympiad/${olympiad.slug}`} />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={seoTitle} />
        <meta name="twitter:description" content={seoDescription} />
        <meta name="twitter:image" content="https://www.samikaranolympiad.com/logo.png" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Event",
            "name": olympiad.title,
            "description": seoDescription,
            "startDate": olympiad.startTime,
            "endDate": olympiad.endTime,
            "eventAttendanceMode": "https://schema.org/OnlineEventAttendanceMode",
            "organizer": { "@type": "Organization", "name": "Samikaran Olympiad" },
            "offers": { "@type": "Offer", "price": feeInRupees, "priceCurrency": "INR" }
          })}
        </script>
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            "mainEntity": faqs.map(faq => ({ "@type": "Question", "name": faq.q, "acceptedAnswer": { "@type": "Answer", "text": faq.a } }))
          })}
        </script>
      </Helmet>

      <PublicLayout>
        {/* Hero Section */}
        <section className="relative min-h-[70vh] flex items-center overflow-hidden py-16 lg:py-20">
          <div className="absolute inset-0 bg-gradient-to-br from-purple-900 via-indigo-900 to-pink-900">
            <FloatingOrb delay={0} size={400} x={-5} y={10} color="from-purple-500/40 to-pink-500/40" />
            <FloatingOrb delay={2} size={300} x={70} y={5} color="from-blue-500/30 to-cyan-500/30" />
            <FloatingOrb delay={4} size={350} x={50} y={60} color="from-pink-500/30 to-rose-500/30" />
            {!prefersReducedMotion && [...Array(8)].map((_, i) => (
              <GlowingParticle key={i} index={i} reducedMotion={!!prefersReducedMotion} />
            ))}
            <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
          </div>

          <div className="relative max-w-6xl mx-auto px-4 sm:px-6 w-full">
            <div className="grid lg:grid-cols-5 gap-10 items-center">
              <motion.div 
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.7 }}
                className="lg:col-span-3 text-white"
              >
                <div className="flex flex-wrap items-center gap-3 mb-5">
                  <PremiumBadge data-testid="badge-subject">
                    <BookOpen className="w-3.5 h-3.5" />
                    {olympiad.subject}
                  </PremiumBadge>
                  <PremiumBadge data-testid="badge-difficulty">
                    <difficultyInfo.icon className="w-3.5 h-3.5" />
                    {difficultyInfo.label}
                  </PremiumBadge>
                  <PremiumBadge data-testid="badge-status" className={`bg-gradient-to-r ${statusInfo.color} border-0`}>
                    <statusInfo.icon className="w-3.5 h-3.5" />
                    {statusInfo.label}
                  </PremiumBadge>
                </div>

                <h1 
                  className="text-3xl sm:text-4xl lg:text-5xl font-black mb-5 bg-gradient-to-r from-white via-white to-purple-200 bg-clip-text text-transparent"
                  style={{ lineHeight: '1.25' }}
                  data-testid="olympiad-title"
                >
                  {olympiad.title}
                </h1>

                <p className="text-base lg:text-lg text-white/80 mb-6 max-w-2xl leading-relaxed" data-testid="olympiad-description">
                  {olympiad.description || `A prestigious ${olympiad.subject.toLowerCase()} competition for Class ${minClass}-${maxClass} students.`}
                </p>

                <div className="flex flex-wrap gap-3 mb-8">
                  {[
                    { icon: GraduationCap, label: `Class ${minClass}-${maxClass}`, testId: "stat-class" },
                    { icon: Clock, label: `${olympiad.durationMinutes} mins`, testId: "stat-duration" },
                    { icon: FileText, label: `${olympiad.totalQuestions || olympiad.maxQuestions} Questions`, testId: "stat-questions" },
                    { icon: Award, label: `${olympiad.totalMarks} Marks`, testId: "stat-marks" },
                  ].map((stat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 backdrop-blur-md bg-white/10 border border-white/20 rounded-xl px-3.5 py-2"
                      data-testid={stat.testId}
                    >
                      <stat.icon className="w-4 h-4 text-white/80" />
                      <span className="text-sm font-medium">{stat.label}</span>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-4">
                  {!isEnded && !isRegistered && (
                    <Button 
                      onClick={handleRegisterClick}
                      size="lg"
                      className="bg-white text-gray-900 hover:bg-gray-100 font-bold px-7 py-5 text-base gap-2 shadow-2xl"
                      data-testid="button-register-hero"
                    >
                      <Sparkles className="w-5 h-5" />
                      Register Now {feeInRupees > 0 ? `for ₹${feeInRupees}` : ''}
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  )}
                  
                  {isRegistered && !isEnded && isOngoing && (
                    <Button 
                      onClick={handleStartExamClick}
                      size="lg"
                      className="bg-gradient-to-r from-green-400 to-emerald-500 text-white font-bold px-7 py-5 text-base gap-2 border-0"
                      data-testid="button-start-exam"
                    >
                      <Zap className="w-5 h-5" />
                      Start Exam
                      <ArrowRight className="w-5 h-5" />
                    </Button>
                  )}
                  
                  {isRegistered && (
                    <div className="flex items-center gap-2 backdrop-blur-md bg-green-500/20 border border-green-400/30 rounded-full px-4 py-2" data-testid="badge-registered">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-300 font-semibold text-sm">Registered</span>
                    </div>
                  )}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, scale: 0.6 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3, duration: 0.7 }}
                className="hidden lg:flex lg:col-span-2 justify-center items-center"
              >
                <div className="relative">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 rounded-full blur-3xl scale-150"
                  />
                  <motion.div animate={{ y: [0, -12, 0] }} transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}>
                    <SubjectSVG subject={olympiad.subject} className="text-white/95 drop-shadow-2xl" size={250} />
                  </motion.div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* About Section */}
        <section className="py-12 bg-white dark:bg-gray-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="section-about">About This Olympiad</h2>
              </div>
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-base">{aboutOlympiad}</p>
            </motion.div>
          </div>
        </section>

        {/* Key Highlights */}
        <section className="py-12 bg-gray-50 dark:bg-gray-900 border-y border-gray-100 dark:border-gray-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center" data-testid="section-highlights">Why Participate?</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { icon: Trophy, title: "National Recognition", desc: "Compete with students across India", color: "from-amber-500 to-yellow-500" },
                  { icon: Brain, title: "Skill Development", desc: "Enhance critical thinking abilities", color: "from-blue-500 to-cyan-500" },
                  { icon: TrendingUp, title: "Academic Growth", desc: "Boost school exam performance", color: "from-green-500 to-emerald-500" },
                  { icon: Award, title: "Certificates & Medals", desc: "Win prestigious awards", color: "from-purple-500 to-pink-500" },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 text-center"
                  >
                    <div className={`w-12 h-12 mx-auto rounded-xl bg-gradient-to-br ${item.color} flex items-center justify-center mb-3`}>
                      <item.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Main Content: Syllabus & Exam Pattern with Class Tabs */}
        <section className="py-12 bg-white dark:bg-gray-950">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <div className="grid lg:grid-cols-3 gap-10">
              {/* Left: Syllabus & Sample Questions */}
              <div className="lg:col-span-2 space-y-8">
                {/* Class Tabs */}
                <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-white" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="section-syllabus">Syllabus & Exam Pattern</h2>
                  </div>

                  {/* Class Tab Switcher */}
                  <div className="flex flex-wrap gap-2 mb-6">
                    {classRange.map(cls => (
                      <button
                        key={cls}
                        onClick={() => setSelectedClassTab(cls)}
                        className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                          selectedClassTab === cls
                            ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                        }`}
                        data-testid={`tab-class-${cls}`}
                      >
                        Class {cls}
                      </button>
                    ))}
                  </div>

                  {/* Syllabus Content */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 mb-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-purple-500" />
                      Syllabus — Class {selectedClassTab}
                    </h3>
                    {syllabusForClass ? (
                      <div className="space-y-2">
                        {syllabusForClass.split(';').map((topic, idx) => topic.trim()).filter(Boolean).map((topic, idx) => (
                          <div key={idx} className="flex items-start gap-3">
                            <div className="w-6 h-6 rounded-md bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center text-xs font-bold text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5">
                              {idx + 1}
                            </div>
                            <span className="text-gray-700 dark:text-gray-300 text-sm">{topic}</span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-400 dark:text-gray-500 text-sm italic">Syllabus for Class {selectedClassTab} will be updated soon. Please check back later.</p>
                    )}
                  </div>

                  {/* Exam Pattern / Marking Scheme */}
                  {examPatternSections.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 mb-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-500" />
                        Marking Scheme
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-200 dark:border-gray-700">
                              <th className="text-left py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Section</th>
                              <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Questions</th>
                              <th className="text-center py-2 px-3 font-semibold text-gray-700 dark:text-gray-300">Marks</th>
                            </tr>
                          </thead>
                          <tbody>
                            {examPatternSections.map((section: any, idx: number) => (
                              <tr key={idx} className="border-b border-gray-100 dark:border-gray-800">
                                <td className="py-2.5 px-3 text-gray-800 dark:text-gray-200">{section.name}</td>
                                <td className="py-2.5 px-3 text-center text-gray-600 dark:text-gray-400">{section.questions}</td>
                                <td className="py-2.5 px-3 text-center text-gray-600 dark:text-gray-400">{section.marks}</td>
                              </tr>
                            ))}
                            <tr className="bg-purple-50 dark:bg-purple-900/20">
                              <td className="py-2.5 px-3 font-bold text-gray-900 dark:text-white">Total</td>
                              <td className="py-2.5 px-3 text-center font-bold text-gray-900 dark:text-white">{examPatternSections.reduce((s: number, sec: any) => s + (sec.questions || 0), 0)}</td>
                              <td className="py-2.5 px-3 text-center font-bold text-gray-900 dark:text-white">{examPatternSections.reduce((s: number, sec: any) => s + (sec.marks || 0), 0)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-4 space-y-1.5">
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                          1 mark for every correct answer
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500" /> No negative marking
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                          <Clock className="w-3.5 h-3.5 text-blue-500" />
                          {olympiad.durationMinutes} minutes to complete
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Exam Quick Info (when no pattern from DB) */}
                  {examPatternSections.length === 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 mb-6">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Target className="w-5 h-5 text-indigo-500" />
                        Exam Details
                      </h3>
                      <div className="grid grid-cols-2 gap-4">
                        {[
                          { label: "Exam Mode", value: "Online", icon: Globe },
                          { label: "Questions", value: `${olympiad.totalQuestions || olympiad.maxQuestions}`, icon: FileText },
                          { label: "Total Marks", value: `${olympiad.totalMarks}`, icon: Award },
                          { label: "Duration", value: `${olympiad.durationMinutes} min`, icon: Clock },
                          { label: "Negative Marking", value: "No", icon: CheckCircle },
                          { label: "Proctoring", value: olympiad.proctoring ? "AI-Powered" : "Standard", icon: Eye },
                        ].map((item, idx) => (
                          <div key={idx} className="flex items-center gap-3">
                            <item.icon className="w-4 h-4 text-gray-400" />
                            <div>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                              <p className="text-sm font-semibold text-gray-900 dark:text-white">{item.value}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Sample Questions */}
                  {sampleQsForClass && sampleQsForClass.length > 0 && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                        <Lightbulb className="w-5 h-5 text-amber-500" />
                        Sample Questions — Class {selectedClassTab}
                      </h3>
                      <div className="space-y-5">
                        {sampleQsForClass.map((q: any, idx: number) => (
                          <div key={idx} className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                            <p className="font-medium text-gray-900 dark:text-white mb-3 text-sm">
                              <span className="text-purple-500 font-bold">Q{idx + 1}.</span> {q.question}
                            </p>
                            <div className="grid grid-cols-2 gap-2">
                              {q.options.map((opt: string, oIdx: number) => (
                                <div
                                  key={oIdx}
                                  className={`flex items-center gap-2 rounded-lg px-3 py-2 text-xs ${
                                    q.answer === oIdx
                                      ? "bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 text-green-700 dark:text-green-300"
                                      : "bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300"
                                  }`}
                                >
                                  <span className="font-bold">{String.fromCharCode(65 + oIdx)}.</span>
                                  <span>{opt}</span>
                                  {q.answer === oIdx && <CheckCircle className="w-3.5 h-3.5 text-green-500 ml-auto" />}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* No sample questions message */}
                  {(!sampleQsForClass || sampleQsForClass.length === 0) && (
                    <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800 text-center">
                      <Lightbulb className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                      <p className="text-sm text-gray-400 dark:text-gray-500">Sample questions for Class {selectedClassTab} will be available soon.</p>
                    </div>
                  )}
                </motion.div>
              </div>

              {/* Right Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-28 space-y-5">
                  {/* Important Dates */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2" data-testid="sidebar-dates">
                      <Calendar className="w-4 h-4 text-purple-500" />
                      Important Dates
                    </h3>
                    <div className="space-y-3">
                      {importantDates.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                            <item.icon className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.label}</p>
                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{format(item.date, "dd MMM yyyy")}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Eligibility */}
                  <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-5 border border-gray-200 dark:border-gray-800">
                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                      <UserCircle className="w-4 h-4 text-green-500" />
                      Eligibility
                    </h3>
                    <div className="space-y-2">
                      {[
                        `Class ${minClass} to Class ${maxClass}`,
                        "Any recognized school in India",
                        "All educational boards welcome",
                      ].map((item, idx) => (
                        <div key={idx} className="flex items-center gap-2">
                          <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0" />
                          <span className="text-sm text-gray-600 dark:text-gray-400">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Card */}
                  {!isEnded && !isRegistered && (
                    <div className="relative rounded-xl overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-600 to-pink-600" />
                      <div className="relative p-5 text-white text-center">
                        <Sparkles className="w-10 h-10 mx-auto mb-3" />
                        <h3 className="text-lg font-bold mb-1">Ready to Excel?</h3>
                        <p className="text-white/80 text-xs mb-4">Join thousands of students</p>
                        {feeInRupees > 0 && (
                          <p className="text-2xl font-black mb-4">₹{feeInRupees} <span className="text-sm font-normal text-white/70">only</span></p>
                        )}
                        <Button 
                          onClick={handleRegisterClick}
                          className="w-full bg-white text-purple-600 hover:bg-gray-100 font-bold py-5 text-base gap-2"
                          data-testid="button-register-sidebar"
                        >
                          Register Now
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* How to Register */}
        <section className="py-12 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-5xl mx-auto px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center" data-testid="section-how-to-register">How to Register</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { step: 1, title: "Create Account", desc: "Sign up with email or phone", icon: UserCircle },
                  { step: 2, title: "Complete Profile", desc: "Fill in your details & class", icon: FileText },
                  { step: 3, title: "Select Olympiad", desc: "Choose your subject", icon: Target },
                  { step: 4, title: "Pay & Confirm", desc: `Pay ₹${feeInRupees} securely`, icon: CreditCard },
                ].map((item, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: idx * 0.1 }}
                    className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 text-center relative"
                  >
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-7 h-7 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold shadow-md">
                      {item.step}
                    </div>
                    <item.icon className="w-8 h-8 text-purple-500 mx-auto mb-2 mt-2" />
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm mb-1">{item.title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{item.desc}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Preparation Tips (from DB) */}
        {olympiad.preparationTips && (
          <section className="py-12 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
            <div className="max-w-5xl mx-auto px-4 sm:px-6">
              <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
                    <Lightbulb className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white" data-testid="section-preparation">Preparation Tips</h2>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900 rounded-xl p-6 border border-gray-200 dark:border-gray-800">
                  <div className="space-y-3">
                    {olympiad.preparationTips.split('\n').filter(Boolean).map((tip, idx) => (
                      <div key={idx} className="flex items-start gap-3">
                        <div className="w-6 h-6 rounded-full bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <CheckCircle className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        </div>
                        <span className="text-gray-700 dark:text-gray-300 text-sm">{tip}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </section>
        )}

        {/* FAQs */}
        <section className="py-12 bg-gray-50 dark:bg-gray-900 border-t border-gray-100 dark:border-gray-800">
          <div className="max-w-4xl mx-auto px-4 sm:px-6">
            <motion.div initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 text-center" data-testid="section-faq">Frequently Asked Questions</h2>
              <Accordion type="single" collapsible className="space-y-3">
                {faqs.map((faq, idx) => (
                  <AccordionItem 
                    key={idx}
                    value={`faq-${idx}`}
                    className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden"
                  >
                    <AccordionTrigger className="px-5 py-4 text-left font-semibold text-gray-900 dark:text-white hover:no-underline text-sm" data-testid={`faq-trigger-${idx}`}>
                      {faq.q}
                    </AccordionTrigger>
                    <AccordionContent className="px-5 pb-4 text-gray-600 dark:text-gray-400 text-sm leading-relaxed">
                      {faq.a}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>

              {!isEnded && !isRegistered && (
                <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="mt-10 text-center">
                  <Button 
                    onClick={handleRegisterClick}
                    size="lg"
                    className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0 px-8 py-5 text-base font-bold shadow-lg"
                    data-testid="button-register-final"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Register Now {feeInRupees > 0 ? `for ₹${feeInRupees}` : ''}
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>
        </section>
      </PublicLayout>

      <Dialog open={showProfileDialog} onOpenChange={setShowProfileDialog}>
        <DialogContent className="backdrop-blur-2xl bg-white/95 dark:bg-gray-900/95 border-gray-200/50 dark:border-white/10">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <UserCircle className="w-5 h-5 text-purple-500" />
              Complete Your Profile
            </DialogTitle>
            <DialogDescription>
              Please complete your profile before registering for the olympiad.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowProfileDialog(false)}>Cancel</Button>
            <Button onClick={() => navigate("/settings/profile")} className="bg-gradient-to-r from-purple-600 to-pink-600 text-white border-0">
              Complete Profile
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
