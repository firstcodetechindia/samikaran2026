import { Helmet } from "react-helmet-async";
import taraAvatarImg from "@assets/mira-avatar.webp";
import { useState, useEffect, useCallback } from "react";
import { useLocation, Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter, useSidebar
} from "@/components/ui/sidebar";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { studentNavigationTabs } from "@/config/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GlassCard, StatCard, ProgressRing, SectionHeader, SkeletonCard, EmptyState } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { NotificationBell } from "@/components/NotificationBell";
import { LockScreen, useLockScreen } from "@/components/LockScreen";
import { 
  Bell, BookOpen, CreditCard, Award, Calendar, User, LogOut, Home,
  Clock, FileText, ChevronRight, Trophy, GraduationCap, Info,
  Heart, Download, ExternalLink, Settings, CheckCircle2, Sparkles,
  Target, TrendingUp, Zap, Camera, Loader2, Copy, Gift, HelpCircle, Lock, Eye, EyeOff, UserCircle, CheckCircle, Library, MapPin
} from "lucide-react";
import HelpChatPanel from "@/components/HelpChatPanel";
import { useCustomAuth, getStoredUser } from "@/hooks/use-custom-auth";
import { useAnnouncements, useCalendarEvents, useExamRegistrations, useCertificates, usePayments, useProfile, useUpdateProfile, useReferralStats, useStudentResults } from "@/hooks/use-dashboard-data";
import { HelpGuideFAB } from "@/components/HelpGuideButton";
import { useUpload } from "@/hooks/use-upload";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { PerformanceAnalytics } from "@/components/student/PerformanceAnalytics";
import { GurujiInterface, AILibrary } from "@/components/guruji";
import { useStudentLevel, useStudentXP, useStudentStreak, usePerformanceRadar, useRankChange, useWeeklyStars } from "@/hooks/use-gamification";
import { ArenaHero } from "@/components/dashboard/arena/ArenaHero";
import { ArenaDailyChallenge } from "@/components/dashboard/arena/ArenaDailyChallenge";
import { ArenaRivalCard } from "@/components/dashboard/arena/ArenaRivalCard";
import { ArenaBattleMode } from "@/components/dashboard/arena/ArenaBattleMode";
import { ArenaPerformanceRadar } from "@/components/dashboard/arena/ArenaPerformanceRadar";
import { ArenaBadgeShowcase } from "@/components/dashboard/arena/ArenaBadgeShowcase";
import { ArenaRankWall } from "@/components/dashboard/arena/ArenaRankWall";
import { ArenaTopBar } from "@/components/dashboard/arena/ArenaTopBar";
import { AdventureHero } from "@/components/dashboard/adventure/AdventureHero";
import { AdventureMission } from "@/components/dashboard/adventure/AdventureMission";
import { AdventureGameCards } from "@/components/dashboard/adventure/AdventureGameCards";
import { AdventureBadgeWall } from "@/components/dashboard/adventure/AdventureBadgeWall";
import { AdventureStarTracker } from "@/components/dashboard/adventure/AdventureStarTracker";
import { AdventureRankDisplay } from "@/components/dashboard/adventure/AdventureRankDisplay";
import { AdventureCelebration } from "@/components/dashboard/adventure/AdventureCelebration";
import { AdventureTopBar } from "@/components/dashboard/adventure/AdventureTopBar";
import { ProfileImageCropper } from "@/components/ui/ProfileImageCropper";

type DashboardTab = "dashboard" | "exams" | "materials" | "payments" | "results" | "analytics" | "certificates" | "announcements" | "calendar" | "profile" | "library";

// Roman numeral class options (1st to 12th)
const classOptions = [
  { value: "Class I", label: "Class I" },
  { value: "Class II", label: "Class II" },
  { value: "Class III", label: "Class III" },
  { value: "Class IV", label: "Class IV" },
  { value: "Class V", label: "Class V" },
  { value: "Class VI", label: "Class VI" },
  { value: "Class VII", label: "Class VII" },
  { value: "Class VIII", label: "Class VIII" },
  { value: "Class IX", label: "Class IX" },
  { value: "Class X", label: "Class X" },
  { value: "Class XI", label: "Class XI" },
  { value: "Class XII", label: "Class XII" },
];

const menuItems = [
  { id: "dashboard" as DashboardTab, title: "Dashboard", icon: Home, iconColor: "text-purple-500" },
  { id: "exams" as DashboardTab, title: "Tests", icon: Target, iconColor: "text-rose-500" },
  { id: "results" as DashboardTab, title: "Results", icon: Award, iconColor: "text-amber-500" },
  { id: "materials" as DashboardTab, title: "Practice Tests", icon: BookOpen, iconColor: "text-blue-500" },
  { id: "analytics" as DashboardTab, title: "Performance", icon: TrendingUp, iconColor: "text-indigo-500" },
  { id: "profile" as DashboardTab, title: "Profile", icon: User, iconColor: "text-pink-500" },
];

const arenaMenuItems = [
  { id: "dashboard" as DashboardTab, title: "Dashboard", icon: Home, iconColor: "text-indigo-500" },
  { id: "exams" as DashboardTab, title: "Tests", icon: Target, iconColor: "text-rose-500" },
  { id: "results" as DashboardTab, title: "Results", icon: Award, iconColor: "text-amber-500" },
  { id: "materials" as DashboardTab, title: "Practice Tests", icon: BookOpen, iconColor: "text-blue-500" },
  { id: "analytics" as DashboardTab, title: "Performance", icon: TrendingUp, iconColor: "text-indigo-500" },
  { id: "profile" as DashboardTab, title: "Profile", icon: User, iconColor: "text-violet-500" },
];

const adventureMenuItems = [
  { id: "dashboard" as DashboardTab, title: "Home", icon: Home, iconColor: "text-orange-500" },
  { id: "exams" as DashboardTab, title: "My Tests", icon: Target, iconColor: "text-pink-500" },
  { id: "results" as DashboardTab, title: "My Results", icon: Award, iconColor: "text-yellow-500" },
  { id: "materials" as DashboardTab, title: "Practice", icon: BookOpen, iconColor: "text-blue-500" },
  { id: "profile" as DashboardTab, title: "Profile", icon: User, iconColor: "text-pink-500" },
];

export default function StudentDashboard() {
  const [location, setLocation] = useLocation();
  const [, routeParams1] = useRoute("/dashboard/:tab");
  const [, routeParams2] = useRoute("/student-dashboard/:tab");
  const urlTab = (routeParams1?.tab || routeParams2?.tab || "dashboard") as DashboardTab;
  const validStudentTabs: DashboardTab[] = ["dashboard", "exams", "materials", "payments", "results", "analytics", "certificates", "announcements", "calendar", "profile", "library"];
  const [activeTab, setActiveTabState] = useState<DashboardTab>(validStudentTabs.includes(urlTab) ? urlTab : "dashboard");

  const basePath = location.startsWith("/student-dashboard") ? "/student-dashboard" : "/dashboard";
  const setActiveTab = (tab: DashboardTab) => {
    setActiveTabState(tab);
    setLocation(tab === "dashboard" ? basePath : `${basePath}/${tab}`, { replace: tab === activeTab });
  };

  useEffect(() => {
    if (validStudentTabs.includes(urlTab)) {
      if (urlTab !== activeTab) setActiveTabState(urlTab);
    } else if (urlTab !== "dashboard") {
      setActiveTabState("dashboard");
      setLocation(basePath, { replace: true });
    }
  }, [urlTab]);
  
  const { logout, isLoading: authLoading } = useCustomAuth();
  
  // Get stored user from localStorage - this works immediately after login
  const storedUser = getStoredUser();
  
  // Redirect if not authenticated or wrong user type
  useEffect(() => {
    if (!authLoading && (!storedUser || storedUser.userType !== "student")) {
      setLocation("/login");
    }
  }, [authLoading, storedUser, setLocation]);
  
  // Session invalidation state for showing message before redirect
  const [sessionInvalidated, setSessionInvalidated] = useState(false);
  const [invalidationMessage, setInvalidationMessage] = useState("");
  
  // TARA AI Assistant state
  const [isGurujiOpen, setIsGurujiOpen] = useState(false);

  // Profile photo cropper state
  const [showCropper, setShowCropper] = useState(false);
  
  // Fast session validation - checks every 3 seconds for quick detection
  // When another device logs in with force logout, this session is detected and logged out
  useEffect(() => {
    if (!storedUser || storedUser.userType !== "student") return;
    if (sessionInvalidated) return; // Already invalidated, stop checking
    
    const sessionToken = localStorage.getItem("samikaran_session_token");
    if (!sessionToken) return;
    
    const checkSession = async () => {
      try {
        const response = await fetch("/api/auth/session/validate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: storedUser.id, sessionToken }),
        });
        const data = await response.json();
        
        if (!data.valid && data.reason === "session_invalidated") {
          const formattedTime = data.newLoginTime 
            ? new Date(data.newLoginTime).toLocaleString() 
            : 'just now';
          setInvalidationMessage(
            `You have been logged out because someone logged in from ${data.newLoginDevice} at ${formattedTime}.`
          );
          setSessionInvalidated(true);
          
          // Clear and redirect after showing message
          setTimeout(() => {
            localStorage.removeItem("samikaran_user");
            localStorage.removeItem("samikaran_session_token");
            localStorage.removeItem("lastVisitedRoute");
            setLocation("/login");
          }, 3000);
        }
      } catch (error) {
        console.error("Session check failed:", error);
      }
    };
    
    // Check immediately
    checkSession();
    
    // Then check every 3 seconds for fast detection
    const interval = setInterval(checkSession, 3000);
    
    return () => clearInterval(interval);
  }, [storedUser, setLocation, sessionInvalidated]);
  
  // Fetch real data from backend using storedUser.id (which is immediately available from localStorage)
  const userId = storedUser?.id || 0;
  const { data: announcements = [], isLoading: announcementsLoading } = useAnnouncements("student");
  const { data: calendarEvents = [], isLoading: eventsLoading } = useCalendarEvents("student");
  const { data: examRegistrations = [], isLoading: examsLoading } = useExamRegistrations(userId);
  const { data: certificates = [], isLoading: certsLoading } = useCertificates(userId);
  const { data: payments = [], isLoading: paymentsLoading } = usePayments(userId, "student");
  const { data: profile, isLoading: profileLoading } = useProfile(userId, "student");
  const { data: referralStats } = useReferralStats(userId);
  const { data: studentResultsData } = useStudentResults(userId);
  const studentResults = studentResultsData?.results || [];
  const studentRegion = studentResultsData?.studentRegion || null;
  const updateProfileMutation = useUpdateProfile();
  
  // Extract student's class number from gradeLevel (e.g., "Class V" -> 5)
  const getClassNumber = (gradeLevel: string | undefined) => {
    if (!gradeLevel) return null;
    const romanMap: Record<string, number> = { 'I': 1, 'II': 2, 'III': 3, 'IV': 4, 'V': 5, 'VI': 6, 'VII': 7, 'VIII': 8, 'IX': 9, 'X': 10, 'XI': 11, 'XII': 12 };
    const match = gradeLevel.match(/Class\s+(\w+)/i);
    if (match) {
      return romanMap[match[1]] || parseInt(match[1]) || null;
    }
    return null;
  };
  
  const studentClassNumber = getClassNumber(profile?.gradeLevel);
  
  // Fetch all available olympiads (filtered by student's class)
  const { data: allOlympiads = [], isLoading: olympiadsLoading } = useQuery<any[]>({
    queryKey: ["/api/public/olympiads"],
    queryFn: async () => {
      const res = await fetch("/api/public/olympiads");
      if (!res.ok) throw new Error("Failed to fetch olympiads");
      return res.json();
    },
    enabled: !!profile,
  });
  
  const filterByStudentClass = (olympiads: any[]) => {
    if (!studentClassNumber) return olympiads;
    return olympiads.filter((o: any) => {
      const minClass = Number(o.minClass) || 1;
      const maxClass = Number(o.maxClass) || 12;
      return studentClassNumber >= minClass && studentClassNumber <= maxClass;
    });
  };
  
  const availableOlympiads = filterByStudentClass(allOlympiads);
  const { toast } = useToast();
  
  const isAdventure = studentClassNumber !== null && studentClassNumber <= 5;
  const isArena = studentClassNumber !== null && studentClassNumber > 5;
  const gamificationLevel = useStudentLevel(studentResults, certificates, isAdventure);
  const studentXP = useStudentXP(studentResults, certificates);
  const studentStreak = useStudentStreak(examRegistrations);
  const performanceRadar = usePerformanceRadar(studentResults);
  const rankChange = useRankChange(studentResults);
  const weeklyStars = useWeeklyStars(studentResults);
  
  // Profile edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    schoolName: "",
    gradeLevel: "",
  });
  
  // Lock screen state
  const [lockPin, setLockPin] = useState("");
  const [lockPinEnabled, setLockPinEnabled] = useState(false);
  const [helpChatOpen, setHelpChatOpen] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState("");
  const [showProfileRequiredDialog, setShowProfileRequiredDialog] = useState(false);
  const [pendingExamId, setPendingExamId] = useState<number | null>(null);
  
  const isProfileComplete = () => {
    if (!profile) return false;
    const requiredFields = [
      profile.firstName,
      profile.lastName,
      profile.gradeLevel,
      profile.dateOfBirth,
      profile.gender,
      profile.phone
    ];
    return requiredFields.every(field => field && field.toString().trim() !== "");
  };

  const handleStartExam = (examId: number) => {
    if (!isProfileComplete()) {
      setPendingExamId(examId);
      setShowProfileRequiredDialog(true);
      return;
    }
    window.open(`/secure-exam/${examId}`, '_blank');
  };

  const handleOlympiadClick = (olympiadSlug: string) => {
    if (!isProfileComplete()) {
      setShowProfileRequiredDialog(true);
      return;
    }
    setLocation(`/olympiad/${olympiadSlug}`);
  };
  const { isLocked, lock, unlock } = useLockScreen(lockPin, lockPinEnabled, userId);
  
  // Profile picture upload
  const { uploadFile, isUploading: isUploadingPicture } = useUpload({
    folder: "studentsprofile",
    onSuccess: async (response) => {
      try {
        await updateProfileMutation.mutateAsync({
          userId,
          userType: "student",
          updates: { profilePhotoUrl: response.objectPath }
        });
        toast({ title: "Profile Picture Updated", description: "Your profile picture has been updated successfully." });
      } catch (error) {
        toast({ title: "Update Failed", description: "Failed to save profile picture. Please try again.", variant: "destructive" });
      }
    },
    onError: (error) => {
      toast({ title: "Upload Failed", description: error.message || "Failed to upload profile picture.", variant: "destructive" });
    }
  });
  
  const handleCropComplete = async (blob: Blob) => {
    const file = new File([blob], "profile-photo.jpg", { type: "image/jpeg" });
    await uploadFile(file);
    setShowCropper(false);
  };
  
  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        schoolName: profile.schoolName || "",
        gradeLevel: profile.gradeLevel || "",
      });
      // Load lock settings
      setLockPin((profile as any).lockPin || "");
      setLockPinEnabled((profile as any).lockPinEnabled || false);
    }
  }, [profile]);
  
  // Handle lock PIN save
  const handleSaveLockPin = useCallback(async () => {
    if (lockPin.length < 4 || lockPin.length > 6) {
      setPinError("PIN must be 4-6 digits");
      return;
    }
    if (!/^\d+$/.test(lockPin)) {
      setPinError("PIN must contain only numbers");
      return;
    }
    setPinError("");
    try {
      await updateProfileMutation.mutateAsync({
        userId,
        userType: "student",
        updates: { lockPin, lockPinEnabled }
      });
      toast({ title: "Lock Settings Saved", description: "Your screen lock PIN has been updated." });
    } catch (error) {
      toast({ title: "Failed to Save", description: "Could not save lock settings.", variant: "destructive" });
    }
  }, [lockPin, lockPinEnabled, userId, updateProfileMutation, toast]);
  
  const handleUpdateProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        userId,
        userType: "student",
        updates: editForm
      });
      toast({ title: "Profile Updated", description: "Your profile has been updated successfully." });
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({ title: "Update Failed", description: "Failed to update profile. Please try again.", variant: "destructive" });
    }
  };

  // All student data comes from database via profile API - no localStorage fallback
  const studentData = {
    firstName: profile?.firstName || "Student",
    lastName: profile?.lastName || "",
    email: profile?.email || "",
    phone: profile?.phone || "",
    schoolName: profile?.schoolName || "",
    gradeLevel: profile?.gradeLevel || "",
    studentId: profile?.studentId || "",
    dateOfBirth: profile?.dateOfBirth || "",
    gender: profile?.gender || "",
    profilePhotoUrl: profile?.profilePhotoUrl || "",
    myReferralCode: profile?.myReferralCode || "",
    usedReferralCode: profile?.usedReferralCode || ""
  };
  
  // Gender-based default avatar SVGs (school kids style)
  const maleStudentAvatar = `data:image/svg+xml,${encodeURIComponent(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="50" fill="#E8D5F0"/>
    <circle cx="50" cy="42" r="22" fill="#FFDAB9"/>
    <ellipse cx="50" cy="75" rx="28" ry="20" fill="#4169E1"/>
    <rect x="40" y="58" width="20" height="12" fill="white"/>
    <path d="M28 35 Q50 15 72 35 L70 28 Q50 10 30 28 Z" fill="#2C1B18"/>
    <circle cx="42" cy="40" r="3" fill="#2C1B18"/>
    <circle cx="58" cy="40" r="3" fill="#2C1B18"/>
    <path d="M45 50 Q50 54 55 50" stroke="#2C1B18" stroke-width="2" fill="none"/>
  </svg>`)}`;
  
  const femaleStudentAvatar = `data:image/svg+xml,${encodeURIComponent(`<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
    <circle cx="50" cy="50" r="50" fill="#FFE4EC"/>
    <circle cx="50" cy="42" r="22" fill="#FFDAB9"/>
    <ellipse cx="50" cy="75" rx="28" ry="20" fill="#FF69B4"/>
    <rect x="40" y="58" width="20" height="12" fill="white"/>
    <path d="M25 42 Q25 18 50 18 Q75 18 75 42 L72 50 Q50 45 28 50 Z" fill="#2C1B18"/>
    <path d="M25 42 L20 65" stroke="#2C1B18" stroke-width="4"/>
    <path d="M75 42 L80 65" stroke="#2C1B18" stroke-width="4"/>
    <circle cx="42" cy="40" r="3" fill="#2C1B18"/>
    <circle cx="58" cy="40" r="3" fill="#2C1B18"/>
    <path d="M45 50 Q50 54 55 50" stroke="#2C1B18" stroke-width="2" fill="none"/>
    <circle cx="20" cy="65" r="3" fill="#FF69B4"/>
    <circle cx="80" cy="65" r="3" fill="#FF69B4"/>
  </svg>`)}`;
  
  const getDefaultAvatar = (gender: string) => {
    if (gender?.toLowerCase() === "female") {
      return femaleStudentAvatar;
    }
    return maleStudentAvatar;
  };
  
  const avatarSrc = studentData.profilePhotoUrl || getDefaultAvatar(studentData.gender);
  const hasCustomProfilePicture = !!studentData.profilePhotoUrl;

  // Calculate stats from real data
  // Upcoming/Active exams: endTime is still in the future (exam not yet ended)
  const upcomingExams = examRegistrations.filter(r => r.exam && new Date(r.exam.endTime) > new Date());
  const completedExams = examRegistrations.filter(r => r.exam && new Date(r.exam.endTime) < new Date());
  
  const attemptedExamCount = examRegistrations.filter(r => {
    const s = (r as any).attemptStatus;
    return s === "submitted" || s === "completed";
  }).length;
  const stats = {
    upcomingExams: upcomingExams.length,
    completedExams: attemptedExamCount || completedExams.length,
    avgScore: certificates.length > 0 
      ? Math.round(certificates.reduce((sum, c) => sum + (c.score || 0), 0) / certificates.length) 
      : 0,
    certificates: certificates.length
  };

  const sidebarStyle: Record<string, string> = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  const handleLogout = async () => {
    const sessionToken = localStorage.getItem("samikaran_session_token");
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, userType: "student", sessionToken })
      });
    } catch (err) {
      console.error("Logout API error:", err);
    }
    localStorage.removeItem(`samikaran_lock_${userId}`);
    localStorage.removeItem("samikaran_session_token");
    logout();
  };

  const arenaProfile = {
    firstName: studentData.firstName,
    lastName: studentData.lastName,
    avatarUrl: avatarSrc,
    studentId: studentData.studentId,
  };

  const nextUpcomingExam = examRegistrations.find(r => r.exam && new Date(r.exam.endTime) > new Date()) || null;

  const renderArenaDashboard = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" data-testid="arena-dashboard">
      <ArenaHero
        profile={arenaProfile}
        level={gamificationLevel}
        xp={studentXP}
        streak={studentStreak}
        rankChange={rankChange}
        studentRegion={studentRegion}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ArenaDailyChallenge
          nextExam={nextUpcomingExam}
          onStartExam={() => setActiveTab("exams")}
          onOpenTara={() => setIsGurujiOpen(true)}
        />
        <ArenaRivalCard
          rankChange={rankChange}
          onBattle={() => setActiveTab("exams")}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ArenaPerformanceRadar radarData={performanceRadar} />
        <ArenaBattleMode
          level={gamificationLevel}
          totalExams={stats.completedExams}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ArenaBadgeShowcase certificates={certificates} />
        <ArenaRankWall
          rankChange={rankChange}
          profile={arenaProfile}
          results={studentResults}
        />
      </div>
    </motion.div>
  );

  const renderAdventureDashboard = () => (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6" data-testid="adventure-dashboard">
      <AdventureCelebration show={gamificationLevel.level > 1 && certificates.length > 0} message={`Level ${gamificationLevel.level} ${gamificationLevel.title}!`} />
      <AdventureHero
        studentName={studentData.firstName}
        level={gamificationLevel}
        streak={studentStreak}
        rankChange={rankChange}
      />
      <AdventureMission
        nextExamTitle={nextUpcomingExam?.exam?.title || null}
        nextExamDate={nextUpcomingExam?.exam?.startTime || null}
        xpReward={100}
        onStartMission={() => setActiveTab("exams")}
      />
      <AdventureGameCards
        exams={availableOlympiads.map(o => ({ id: o.id, title: o.title, subject: o.subject, startTime: o.startTime }))}
        onPlay={() => setActiveTab("exams")}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AdventureStarTracker weeklyStars={weeklyStars} />
        <AdventureRankDisplay
          rankChange={rankChange}
          cityName={studentRegion?.cityName}
          stateName={studentRegion?.stateName}
          schoolName={studentRegion?.schoolName}
          cityRank={studentResults[0]?.cityRank}
          stateRank={studentResults[0]?.stateRank}
          schoolRank={studentResults[0]?.schoolRank}
        />
      </div>
      <AdventureBadgeWall certificates={certificates} />
    </motion.div>
  );

  const renderDashboardTab = () => {
    if (isArena) return renderArenaDashboard();
    if (isAdventure) return renderAdventureDashboard();
    return renderArenaDashboard();
  };

  const renderAnnouncementsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <Bell className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-lg">All Announcements</h2>
      </div>
      
      {announcementsLoading ? (
        <Card className="p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </Card>
      ) : announcements.length === 0 ? (
        <Card className="p-6 text-center text-muted-foreground">
          No announcements available at this time.
        </Card>
      ) : announcements.map((announcement, index) => (
        <motion.div
          key={announcement.id}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: index * 0.1 }}
        >
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {announcement.important && (
                      <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 text-xs">
                        Important
                      </Badge>
                    )}
                    <span className="text-xs text-muted-foreground font-medium">{announcement.createdAt ? format(new Date(announcement.createdAt), "MMM dd, yyyy") : ""}</span>
                  </div>
                  <h3 className="font-bold text-base">{announcement.title}</h3>
                  {announcement.content && (
                    <p className="text-sm text-muted-foreground mt-2">{announcement.content}</p>
                  )}
                </div>
                <Button variant="outline" size="sm" className="shrink-0" data-testid={`button-announcement-${announcement.id}`}>
                  View <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </motion.div>
  );

  const renderExamsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50">
          <TabsTrigger value="upcoming" data-testid="tab-upcoming-exams">Upcoming Exams</TabsTrigger>
          <TabsTrigger value="past" data-testid="tab-past-exams">Past Exams</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upcoming" className="mt-6 space-y-4">
          {examsLoading ? (
            <Card className="border-0 shadow-lg p-6">
              <div className="animate-pulse space-y-3">
                <div className="h-4 bg-muted rounded w-3/4"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            </Card>
          ) : upcomingExams.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <Calendar className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">No upcoming exams scheduled</p>
              </CardContent>
            </Card>
          ) : (
            upcomingExams.map((reg, index) => (
              <motion.div
                key={reg.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex flex-col items-center justify-center text-white shadow-lg">
                          <span className="text-xs font-bold">{reg.exam ? format(new Date(reg.exam.startTime), "MMM").toUpperCase() : ""}</span>
                          <span className="text-lg font-black">{reg.exam ? format(new Date(reg.exam.startTime), "dd") : ""}</span>
                        </div>
                        <div>
                          <h3 className="font-bold text-lg">{reg.exam?.title || "Exam"}</h3>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Clock className="w-4 h-4" /> {reg.exam?.durationMinutes || 60} mins
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {(() => {
                          const now = new Date();
                          const examStart = reg.exam ? new Date(reg.exam.startTime) : null;
                          const examEnd = reg.exam?.endTime ? new Date(reg.exam.endTime) : null;
                          const isLive = examStart && examEnd && now >= examStart && now <= examEnd;
                          const isUpcoming = examStart && now < examStart;
                          const attemptStatus = (reg as any).attemptStatus;
                          const isSubmitted = attemptStatus === "submitted" || attemptStatus === "completed";
                          const isAttempted = attemptStatus === "in_progress";
                          const hasAttempted = !!attemptStatus;
                          const resultPublished = (reg as any).resultPublished;
                          
                          return (
                            <>
                              {isSubmitted ? (
                                <Badge className="bg-blue-500 text-white font-semibold">Submitted</Badge>
                              ) : isAttempted ? (
                                <Badge className="bg-orange-500 text-white font-semibold">Attempted</Badge>
                              ) : isLive ? (
                                <Badge className="bg-green-500 text-white font-semibold animate-pulse">Live Now</Badge>
                              ) : isUpcoming ? (
                                <Badge variant="outline" className="font-semibold border-amber-500 text-amber-600">Upcoming</Badge>
                              ) : (
                                <Badge variant="secondary" className="font-semibold">{reg.status || "registered"}</Badge>
                              )}
                              {isSubmitted ? (
                                (reg as any).hasResult ? (
                                  <Button
                                    className="bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md"
                                    data-testid={`button-result-${reg.examId}`}
                                    onClick={() => { setActiveTab("results"); }}
                                  >
                                    <Trophy className="w-4 h-4 mr-1" /> View Result
                                  </Button>
                                ) : (
                                  <Button
                                    disabled
                                    className="bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                                    data-testid={`button-result-${reg.examId}`}
                                  >
                                    <Clock className="w-4 h-4 mr-1" /> Result Awaited
                                  </Button>
                                )
                              ) : isAttempted && isLive ? (
                                <Button
                                  className="brand-button shadow-lg"
                                  data-testid={`button-exam-${reg.examId}`}
                                  onClick={() => handleStartExam(reg.examId)}
                                >
                                  Resume Exam <Zap className="w-4 h-4 ml-1" />
                                </Button>
                              ) : isAttempted ? (
                                <Button
                                  disabled
                                  className="bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"
                                  data-testid={`button-result-${reg.examId}`}
                                >
                                  <Clock className="w-4 h-4 mr-1" /> Result Awaited
                                </Button>
                              ) : (
                                <Button 
                                  className={isLive ? "brand-button shadow-lg" : "bg-gray-300 dark:bg-gray-700 text-gray-500 cursor-not-allowed"}
                                  data-testid={`button-exam-${reg.examId}`}
                                  onClick={() => isLive && handleStartExam(reg.examId)}
                                  disabled={!isLive}
                                >
                                  {isLive ? (
                                    <>Start Exam <Zap className="w-4 h-4 ml-1" /></>
                                  ) : isUpcoming ? (
                                    <>Starts {examStart ? format(examStart, "MMM dd, h:mm a") : "Soon"}</>
                                  ) : (
                                    <>Exam Window Closed</>
                                  )}
                                </Button>
                              )}
                            </>
                          );
                        })()}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="past" className="mt-6 space-y-4">
          {completedExams.length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-8 text-center">
                <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground font-medium">No completed exams yet</p>
              </CardContent>
            </Card>
          ) : completedExams.map((reg, index) => (
            <motion.div
              key={reg.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div>
                      <h3 className="font-bold text-lg">{reg.exam?.title || "Exam"}</h3>
                      <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                        <Calendar className="w-4 h-4" /> {reg.exam ? format(new Date(reg.exam.startTime), "MMM dd, yyyy") : ""}
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      {(reg as any).hasResult ? (
                        <>
                          <div className="text-center">
                            <p className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">{((reg as any).score || 0).toFixed(1)}%</p>
                            <p className="text-xs text-muted-foreground font-medium">Score</p>
                          </div>
                          <div className="text-center">
                            <p className="text-3xl font-black">#{(reg as any).rank || "-"}</p>
                            <p className="text-xs text-muted-foreground font-medium">Rank</p>
                          </div>
                        </>
                      ) : (
                        <Badge variant="outline" className="text-muted-foreground">
                          <Clock className="w-3 h-3 mr-1" />
                          {(reg as any).attemptStatus === "submitted" || (reg as any).attemptStatus === "completed" ? "Result Awaited" : "Not Attempted"}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </TabsContent>
      </Tabs>

    </motion.div>
  );

  const renderMaterialsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500/5 to-purple-500/5">
        <CardContent className="p-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center mb-6 shadow-xl">
            <BookOpen className="w-10 h-10 text-white" />
          </div>
          <h3 className="font-bold text-xl mb-2">Study Materials</h3>
          <p className="text-muted-foreground max-w-md mx-auto">Study materials will be available here once you register for an exam. Get ready to ace your olympiad!</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderPaymentsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Payment History</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentsLoading ? (
            <div className="animate-pulse space-y-3 p-4">
              <div className="h-4 bg-muted rounded w-3/4"></div>
              <div className="h-3 bg-muted rounded w-1/2"></div>
            </div>
          ) : payments.length === 0 ? (
            <div className="text-center py-10">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-6">
                <CreditCard className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-muted-foreground font-medium">No payment history available.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {payments.map((payment) => (
                <Card key={payment.id} className="border shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${payment.status === 'paid' ? 'bg-green-100 text-green-600' : 'bg-yellow-100 text-yellow-600'}`}>
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <p className="font-semibold">{payment.description || "Exam Registration Fee"}</p>
                        <p className="text-sm text-muted-foreground">{payment.createdAt ? format(new Date(payment.createdAt), "MMM dd, yyyy") : ""}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-lg">Rs. {payment.amount}</p>
                      <Badge className={payment.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}>
                        {payment.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderResultsTab = () => {
    const publishedResults = examRegistrations.filter(r => (r as any).hasResult && (r as any).resultPublished);
    return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {publishedResults.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground font-medium">No exam results available yet</p>
            <p className="text-xs text-muted-foreground mt-1">Results will appear here once they are published by the admin</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {publishedResults.map((reg, index) => (
            <motion.div
              key={reg.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base font-bold">{reg.exam?.title || "Exam"}</CardTitle>
                  <CardDescription>{reg.exam ? format(new Date(reg.exam.startTime), "MMM dd, yyyy") : ""}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-3xl font-black bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                          {`${((reg as any).score || 0).toFixed(1)}%`}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">Score</p>
                      </div>
                      <div className="text-center">
                        <p className="text-3xl font-black">
                          {(reg as any).rank ? `#${(reg as any).rank}` : "-"}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">Rank</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-emerald-600">
                          {(reg as any).correctAnswers ?? "-"}/{(reg as any).totalQuestions ?? "-"}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">Correct</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">
                          {(reg as any).marksObtained ?? "-"}/{(reg as any).totalMarks ?? "-"}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium">Marks</p>
                      </div>
                    </div>
                  </div>
                  {(reg as any).performanceRemark && (
                    <div className="mt-3 pt-3 border-t">
                      <Badge variant="outline" className="text-xs">
                        {(reg as any).performanceRemark}
                      </Badge>
                      {(reg as any).timeTakenSeconds && (
                        <span className="text-xs text-muted-foreground ml-2">
                          Time: {Math.floor((reg as any).timeTakenSeconds / 60)}m {(reg as any).timeTakenSeconds % 60}s
                        </span>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
    );
  };

  const getCertificateTypeStyles = (type: string) => {
    const cleanType = type.replace('merit_', '').toLowerCase();
    switch (cleanType) {
      case 'gold':
        return { bg: 'from-yellow-400 to-amber-500', icon: 'text-yellow-600', badge: 'bg-yellow-500 text-white' };
      case 'silver':
        return { bg: 'from-gray-300 to-gray-400', icon: 'text-gray-600', badge: 'bg-gray-400 text-white' };
      case 'bronze':
        return { bg: 'from-orange-400 to-amber-600', icon: 'text-orange-600', badge: 'bg-orange-500 text-white' };
      default:
        return { bg: 'from-emerald-400 to-green-500', icon: 'text-emerald-600', badge: 'bg-emerald-500 text-white' };
    }
  };

  const renderCertificatesTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      {certsLoading ? (
        <Card className="border-0 shadow-lg p-6">
          <div className="animate-pulse space-y-3">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-3 bg-muted rounded w-1/2"></div>
          </div>
        </Card>
      ) : certificates.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-10 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 flex items-center justify-center mb-6">
              <Trophy className="w-10 h-10 text-amber-600" />
            </div>
            <p className="text-muted-foreground font-medium">No certificates available yet.</p>
            <p className="text-sm text-muted-foreground mt-2">Complete an olympiad to earn your certificate!</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {certificates.map((cert, index) => {
            const styles = getCertificateTypeStyles(cert.type);
            const cleanType = cert.type.replace('merit_', '');
            return (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow overflow-hidden">
                  <CardContent className="p-0">
                    <div className={`h-2 bg-gradient-to-r ${styles.bg}`} />
                    <div className="p-5">
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${styles.bg} flex items-center justify-center shadow-lg flex-shrink-0`}>
                          <Trophy className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold truncate">{cert.examTitle || "Certificate"}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${styles.badge} capitalize`}>
                              {cleanType}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">{cert.examSubject || "General"}</p>
                          <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                            {cert.rank && <span>Rank: #{cert.rank}</span>}
                            {cert.score !== null && <span>Score: {cert.score}</span>}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">
                            Issued: {cert.issuedAt ? format(new Date(cert.issuedAt), "MMM dd, yyyy") : "N/A"}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2 mt-4">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="flex-1"
                          onClick={() => window.open(`/verify?cert=${cert.verificationCode || cert.id}`, '_blank')}
                          data-testid={`button-view-cert-${cert.id}`}
                        >
                          <FileText className="w-4 h-4 mr-2" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          className={`flex-1 bg-gradient-to-r ${styles.bg} text-white hover:opacity-90`}
                          data-testid={`button-download-cert-${cert.id}`}
                          onClick={() => {
                            const certCode = cert.verificationCode || cert.id;
                            window.open(`/certificate?cert=${certCode}&download=true`, '_blank');
                          }}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </motion.div>
  );

  const renderCalendarTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Olympiad Calendar 2026</h2>
          </div>
          <Badge variant="outline" className="text-xs">{availableOlympiads.length} olympiad{availableOlympiads.length !== 1 ? 's' : ''}</Badge>
        </div>
        
        {studentClassNumber && (
          <div className="flex items-center gap-2">
            <Badge className={`text-xs px-3 py-1 ${studentClassNumber <= 5 ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white border-0" : "bg-gradient-to-r from-purple-500 to-indigo-500 text-white border-0"}`}>
              {studentClassNumber <= 5 ? "Little Champs" : "Elite Seniors"} — {profile?.gradeLevel}
            </Badge>
          </div>
        )}
        
        {olympiadsLoading ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map(i => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-4">
                  <div className="h-4 bg-muted rounded w-3/4 mb-3"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : availableOlympiads.length === 0 ? (
          <Card className="border-0 shadow-lg">
            <CardContent className="p-8 text-center">
              <GraduationCap className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground font-medium">No olympiads available for your class at this time.</p>
              <p className="text-xs text-muted-foreground mt-2">Check back later or update your class in profile settings.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableOlympiads.map((olympiad) => {
              const startDate = olympiad.startTime ? new Date(olympiad.startTime) : null;
              const now = new Date();
              const isUpcoming = startDate && startDate > now;
              const isOngoing = startDate && olympiad.endTime && new Date(olympiad.endTime) > now && startDate <= now;
              const isRegistered = examRegistrations.some(r => r.examId === olympiad.id);
              
              return (
                <Card key={olympiad.id} className="border-0 shadow-lg hover:shadow-xl transition-all group" data-testid={`card-olympiad-${olympiad.id}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isOngoing && <Badge className="bg-green-500 text-white text-[10px]">Live</Badge>}
                        {isUpcoming && <Badge variant="outline" className="text-[10px]">Upcoming</Badge>}
                        {isRegistered && <Badge className="bg-blue-500 text-white text-[10px]">Registered</Badge>}
                      </div>
                    </div>
                    <h3 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-2">{olympiad.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{olympiad.subject}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{olympiad.durationMinutes} mins</span>
                      {startDate && (
                        <>
                          <span className="text-muted-foreground">•</span>
                          <span>{format(startDate, "MMM dd, yyyy")}</span>
                        </>
                      )}
                    </div>
                    <div className="mt-4">
                      {isRegistered ? (
                        <Button size="sm" className="w-full brand-button" onClick={() => setActiveTab("exams")} data-testid={`button-view-olympiad-${olympiad.id}`}>
                          View Details <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleOlympiadClick(olympiad.slug || olympiad.id)}
                          data-testid={`button-register-olympiad-${olympiad.id}`}
                        >
                          Register Now <ChevronRight className="w-3 h-3 ml-1" />
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );

  const renderProfileTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Profile Picture Reminder */}
      {!hasCustomProfilePicture && (
        <Card className="border-0 bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border-l-4 border-l-amber-500">
          <CardContent className="p-4 flex items-start gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-100 dark:bg-amber-900/50 flex items-center justify-center flex-shrink-0">
              <Camera className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <h4 className="font-semibold text-amber-800 dark:text-amber-200">Complete Your Profile</h4>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Upload your profile picture to personalize your account. Hover over the avatar below or click "Update Profile" to upload your photo.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
      
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col items-center">
              <div className="relative group">
                <Avatar className="w-20 h-20 border-4 border-purple-200 shadow-xl">
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback className="brand-gradient text-white text-2xl font-bold">
                    {studentData.firstName[0]}{studentData.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <button
                  onClick={() => setShowCropper(true)}
                  disabled={isUploadingPicture}
                  className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                  data-testid="button-open-photo-cropper"
                >
                  {isUploadingPicture ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </button>
              </div>
              <p className="text-xs text-muted-foreground mt-2 text-center">
                {hasCustomProfilePicture ? "Click to change photo" : "Click to upload photo"}
              </p>
              <p className="text-xs text-muted-foreground">Tap photo to crop &amp; upload</p>
            </div>
            <div>
              <h2 className="text-2xl font-black">{studentData.firstName} {studentData.lastName}</h2>
              <p className="text-muted-foreground font-medium">{studentData.studentId}</p>
              <Badge className="mt-1 brand-gradient text-white border-0">{studentData.gradeLevel}</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Full Name</Label>
              <p className="font-semibold mt-1">{studentData.firstName} {studentData.lastName}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Date of Birth</Label>
              <p className="font-semibold mt-1">{studentData.dateOfBirth}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Gender</Label>
              <p className="font-semibold mt-1">{studentData.gender}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Email</Label>
              <p className="font-semibold mt-1">{studentData.email}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Phone</Label>
              <p className="font-semibold mt-1">{studentData.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold">School Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">School Name</Label>
              <p className="font-semibold mt-1">{studentData.schoolName}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Class</Label>
              <p className="font-semibold mt-1">{studentData.gradeLevel}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg overflow-hidden">
        <div className="brand-gradient p-4">
          <div className="flex items-center gap-2 text-white">
            <Gift className="w-5 h-5" />
            <CardTitle className="text-lg font-bold text-white">Your Referral Code</CardTitle>
          </div>
          <p className="text-white/80 text-sm mt-1">Invite friends and both get 10% OFF!</p>
        </div>
        <CardContent className="pt-4 space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800">
            <div className="text-center sm:text-left">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Your Code</p>
              <p className="text-2xl font-black text-purple-600 dark:text-purple-400 tracking-widest" data-testid="text-referral-code">
                {studentData.myReferralCode || "Loading..."}
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  if (studentData.myReferralCode) {
                    navigator.clipboard.writeText(studentData.myReferralCode);
                    toast({
                      title: "Copied!",
                      description: "Referral code copied to clipboard",
                    });
                  }
                }}
                disabled={!studentData.myReferralCode}
                data-testid="button-copy-referral"
              >
                <Copy className="w-4 h-4" /> Copy
              </Button>
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="gap-2" data-testid="button-referral-info">
                    <HelpCircle className="w-4 h-4" /> How it works
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                      <Gift className="w-5 h-5 text-purple-500" /> Referral Program
                    </DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800">
                      <p className="text-center font-bold text-lg text-purple-600 dark:text-purple-400">
                        Invite a friend and BOTH get 10% OFF!
                      </p>
                    </div>
                    
                    <div className="space-y-3">
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">1</div>
                        <div>
                          <p className="font-semibold">Share your code</p>
                          <p className="text-sm text-muted-foreground">Copy your unique referral code and share it with friends</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">2</div>
                        <div>
                          <p className="font-semibold">Friend registers with your code</p>
                          <p className="text-sm text-muted-foreground">Your friend enters your code during registration or payment</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/50 flex items-center justify-center text-purple-600 dark:text-purple-400 font-bold">3</div>
                        <div>
                          <p className="font-semibold">Both get 10% discount</p>
                          <p className="text-sm text-muted-foreground">Your friend gets 10% off now. You get 10% off your next Olympiad!</p>
                        </div>
                      </div>
                    </div>
                    
                    <div className="p-3 rounded-lg bg-muted/50 border">
                      <p className="text-xs text-muted-foreground">
                        <strong>Note:</strong> Each referral code can be used by multiple friends, but each friend can only use it once. Your discount credit is applied automatically on your next Olympiad payment.
                      </p>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
          {studentData.usedReferralCode && (
            <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800">
              <p className="text-xs text-green-700 dark:text-green-400">You used referral code: <span className="font-bold">{studentData.usedReferralCode}</span></p>
            </div>
          )}
          
          {referralStats && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold text-purple-600 dark:text-purple-400" data-testid="text-total-referrals">{referralStats.totalReferrals}</p>
                <p className="text-xs text-muted-foreground">Friends Referred</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold text-green-600 dark:text-green-400" data-testid="text-earned-discounts">{referralStats.earnedDiscounts}</p>
                <p className="text-xs text-muted-foreground">Discounts Earned</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400" data-testid="text-pending-discounts">{referralStats.pendingDiscounts}</p>
                <p className="text-xs text-muted-foreground">Pending Discounts</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/50 text-center">
                <p className="text-2xl font-bold text-orange-600 dark:text-orange-400" data-testid="text-used-discounts">{referralStats.usedDiscounts}</p>
                <p className="text-xs text-muted-foreground">Used Discounts</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
              <Lock className="w-5 h-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-lg font-bold">Screen Lock</CardTitle>
              <CardDescription>Take a break without logging out</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label className="font-medium">Enable Screen Lock</Label>
              <p className="text-sm text-muted-foreground">Lock your screen with Ctrl+L when taking a break</p>
            </div>
            <Switch
              checked={lockPinEnabled}
              onCheckedChange={setLockPinEnabled}
              data-testid="switch-lock-enabled"
            />
          </div>
          
          {lockPinEnabled && (
            <div className="space-y-3 pt-3 border-t">
              <div className="space-y-2">
                <Label htmlFor="lockPin">Set Your PIN (4-6 digits)</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="lockPin"
                      type={showPin ? "text" : "password"}
                      value={lockPin}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, "").slice(0, 6);
                        setLockPin(val);
                        setPinError("");
                      }}
                      placeholder="Enter PIN"
                      maxLength={6}
                      className="pr-10"
                      data-testid="input-lock-pin"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPin(!showPin)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <Button onClick={handleSaveLockPin} data-testid="button-save-pin">
                    Save PIN
                  </Button>
                </div>
                {pinError && <p className="text-sm text-destructive">{pinError}</p>}
              </div>
              
              {lockPin.length >= 4 && (
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={lock}
                  data-testid="button-lock-now"
                >
                  <Lock className="w-4 h-4" />
                  Lock Screen Now
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button className="brand-button shadow-lg" data-testid="button-update-profile">
              <Settings className="w-4 h-4 mr-2" /> Update Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update Your Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              {/* Profile Picture Upload Section */}
              <div className="flex flex-col items-center gap-3 pb-4 border-b">
                <div className="relative group">
                  <Avatar className="w-24 h-24 border-4 border-purple-200 shadow-lg">
                    <AvatarImage src={avatarSrc} />
                    <AvatarFallback className="brand-gradient text-white text-2xl font-bold">
                      {studentData.firstName[0]}{studentData.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <button
                    onClick={() => setShowCropper(true)}
                    disabled={isUploadingPicture}
                    className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    data-testid="button-dialog-open-photo-cropper"
                  >
                    {isUploadingPicture ? (
                      <Loader2 className="w-6 h-6 text-white animate-spin" />
                    ) : (
                      <Camera className="w-6 h-6 text-white" />
                    )}
                  </button>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">
                    {hasCustomProfilePicture ? "Click photo to crop &amp; replace" : "Click photo to add your picture"}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">You can crop and resize after selecting</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    value={editForm.firstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, firstName: e.target.value }))}
                    data-testid="input-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    value={editForm.lastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, lastName: e.target.value }))}
                    data-testid="input-last-name"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input 
                  id="phone" 
                  value={editForm.phone}
                  onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                  data-testid="input-phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input 
                  id="schoolName" 
                  value={editForm.schoolName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, schoolName: e.target.value }))}
                  data-testid="input-school-name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="gradeLevel">Class</Label>
                <Select 
                  value={editForm.gradeLevel} 
                  onValueChange={(value) => setEditForm(prev => ({ ...prev, gradeLevel: value }))}
                >
                  <SelectTrigger data-testid="select-class">
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
              <Button 
                className="brand-button" 
                onClick={handleUpdateProfile}
                disabled={updateProfileMutation.isPending}
                data-testid="button-save-profile"
              >
                {updateProfileMutation.isPending ? "Saving..." : "Save Changes"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </motion.div>
  );

  const wrapWithTheme = (content: JSX.Element | null) => {
    if (isArena) {
      return <div className="arena-tab-content">{content}</div>;
    }
    if (isAdventure) {
      return <div className="adventure-tab-content">{content}</div>;
    }
    return <>{content}</>;
  };

  const renderContent = () => {
    switch (activeTab) {
      case "dashboard": return renderDashboardTab();
      case "exams": return wrapWithTheme(renderExamsTab());
      case "library": return wrapWithTheme(
        <AILibrary 
          studentId={storedUser?.id || 0} 
          mode="page"
          onLoadConversation={(convId: number) => {
            setIsGurujiOpen(true);
          }}
        />
      );
      case "materials": return wrapWithTheme(renderMaterialsTab());
      case "payments": return wrapWithTheme(renderPaymentsTab());
      case "results": return wrapWithTheme(renderResultsTab());
      case "analytics": return wrapWithTheme(<PerformanceAnalytics studentId={storedUser?.id || 0} />);
      case "certificates": return wrapWithTheme(renderCertificatesTab());
      case "announcements": return wrapWithTheme(renderAnnouncementsTab());
      case "calendar": return wrapWithTheme(renderCalendarTab());
      case "profile": return wrapWithTheme(renderProfileTab());
      default: return renderDashboardTab();
    }
  };

  const getTabTitle = () => {
    const item = menuItems.find(m => m.id === activeTab);
    return item?.title || "Dashboard";
  };

  const handleMobileTabChange = (tabId: string) => {
    const tabMapping: Record<string, DashboardTab> = {
      "home": "dashboard",
      "exams": "exams",
      "results": "results",
      "analytics": "analytics",
      "profile": "profile"
    };
    setActiveTab(tabMapping[tabId] || "dashboard");
  };

  const getMobileActiveTab = (): string => {
    const reverseMapping: Record<DashboardTab, string> = {
      "dashboard": "home",
      "exams": "exams",
      "library": "home",
      "materials": "home",
      "payments": "home",
      "results": "results",
      "analytics": "analytics",
      "certificates": "results",
      "announcements": "home",
      "calendar": "home",
      "profile": "profile"
    };
    return reverseMapping[activeTab] || "home";
  };

  return (
    <>
      <Helmet>
        <title>Student Dashboard | Samikaran Olympiad</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <LockScreen
        isLocked={isLocked}
        onUnlock={unlock}
        onLogout={() => {
          logout();
          setLocation("/login");
        }}
        userPin={lockPin}
        userName={`${studentData.firstName} ${studentData.lastName}`}
        userAvatar={studentData.profilePhotoUrl}
      />
      
      {/* Session Invalidation Overlay - Shown when another device logs in */}
      {sessionInvalidated && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-gradient-to-br from-amber-500 to-orange-600 rounded-2xl p-8 mx-4 max-w-md shadow-2xl text-white text-center"
          >
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-white/20 flex items-center justify-center">
              <LogOut className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-bold mb-2">Session Terminated</h2>
            <p className="text-white/90 mb-4">{invalidationMessage}</p>
            <p className="text-sm text-white/70">Redirecting to login page...</p>
            <div className="mt-4">
              <Loader2 className="w-6 h-6 mx-auto animate-spin" />
            </div>
          </motion.div>
        </div>
      )}
      
      <SidebarProvider style={sidebarStyle}>
        <div className={`flex h-screen w-full ${isAdventure ? "adventure-bg" : ""}`}>
        <Sidebar className={isArena
          ? "border-r border-indigo-100 !bg-white"
          : isAdventure
          ? "adventure-sidebar border-r"
          : "border-r border-purple-200/60 dark:border-purple-800/40 bg-white dark:bg-slate-950"
        }>
          <SidebarHeader className={`p-4 border-b ${
            isArena
              ? "border-indigo-100 bg-gradient-to-r from-indigo-600 to-violet-600"
              : isAdventure
              ? "border-orange-200/60 bg-gradient-to-r from-orange-400 to-pink-500"
              : "border-purple-200/50 dark:border-purple-800/30 bg-gradient-to-r from-purple-600 to-pink-500"
          }`}>
            <Link href="/student-dashboard" className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border bg-white/20 backdrop-blur-sm border-white/20">
                <svg viewBox="0 0 72 72" xmlns="http://www.w3.org/2000/svg" className="w-7 h-7">
                  <polygon points="36,7 64,54 8,54" fill="white" opacity="0.95"/>
                  <polygon points="36,65 8,18 64,18" fill="white" opacity="0.7"/>
                  <rect x="23" y="32" width="26" height="3.6" rx="1.8" fill={isArena ? "#6366f1" : "#9333EA"}/>
                  <rect x="23" y="38" width="26" height="3.6" rx="1.8" fill={isArena ? "#6366f1" : "#9333EA"}/>
                </svg>
              </div>
              <div className="flex flex-col items-start leading-none">
                <span className="font-black text-[14px] tracking-tight text-white">
                  SAMIKARAN<span className="text-yellow-300">.</span>
                </span>
                <span className="text-[10px] font-semibold uppercase tracking-[0.2em] text-white/70">
                  {isArena ? "Arena" : isAdventure ? "Adventure" : "Olympiad"}
                </span>
              </div>
            </Link>
          </SidebarHeader>
          
          <SidebarContent className="px-3 pt-4 pb-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className={isAdventure ? "space-y-1.5" : "space-y-1"}>
                  {(isArena ? arenaMenuItems : isAdventure ? adventureMenuItems : menuItems).map((item) => {
                    const isActive = activeTab === item.id;
                    const adventureItem = item as typeof item & { emoji?: string };
                    return (
                      <SidebarMenuItem key={item.id}>
                        <SidebarMenuButton
                          onClick={() => setActiveTab(item.id)}
                          isActive={isActive}
                          className={`transition-all duration-200 ${
                            isArena
                              ? `rounded-xl h-10 ${isActive
                                ? "!bg-indigo-50 !text-indigo-700 border border-indigo-200 font-semibold hover:!text-indigo-700"
                                : "!text-slate-600 hover:!bg-slate-50 hover:!text-indigo-600"}`
                              : isAdventure
                              ? `rounded-2xl h-11 ${isActive
                                ? "!bg-white !text-orange-600 shadow-md shadow-orange-200/50 font-bold hover:!text-orange-600 border-2 border-orange-200"
                                : "!text-gray-700 hover:!bg-white/60 hover:!text-orange-500"}`
                              : `rounded-xl h-10 ${isActive
                                ? "bg-gradient-to-r from-purple-600 to-pink-500 !text-white shadow-md shadow-purple-500/30 font-semibold hover:!text-white"
                                : "!text-gray-700 dark:!text-gray-200 hover:!bg-purple-50 dark:hover:!bg-purple-900/20 hover:!text-purple-700 dark:hover:!text-purple-300"}`
                          }`}
                          data-testid={`sidebar-${item.id}`}
                        >
                          {isAdventure && adventureItem.emoji ? (
                            <span className="text-lg flex-shrink-0 w-7 text-center">{adventureItem.emoji}</span>
                          ) : (
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                              isArena
                                ? isActive ? "bg-indigo-100" : "bg-slate-50"
                                : isActive ? "bg-white/20" : "bg-gray-50 dark:bg-slate-800 border border-gray-200 dark:border-slate-700"
                            }`}>
                              <item.icon className={`w-3.5 h-3.5 ${isActive ? (isArena ? "text-indigo-600" : "text-white") : item.iconColor}`} />
                            </div>
                          )}
                          <span className={`${isAdventure ? "text-[14px] font-bold" : "text-[13px] font-semibold"}`}>{item.title}</span>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    );
                  })}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className={`p-3 border-t ${
            isArena
              ? "border-indigo-100 bg-white"
              : isAdventure
              ? "border-orange-200/30"
              : "border-purple-200/50 dark:border-purple-800/30 bg-white/50 dark:bg-slate-900/50"
          }`}>
            <div className={`flex items-center gap-2.5 mb-2.5 p-2.5 border shadow-sm ${
              isArena
                ? "bg-indigo-50 border-indigo-100 rounded-xl"
                : isAdventure
                ? "bg-white/80 border-orange-200/40 rounded-2xl"
                : "bg-gradient-to-r from-purple-100/80 to-pink-100/80 dark:from-purple-950/50 dark:to-pink-950/50 border-purple-200/60 dark:border-purple-700/40 rounded-xl"
            }`}>
              <div className={isAdventure ? "relative" : ""}>
                <Avatar className={`${isAdventure ? "w-11 h-11" : "w-9 h-9"} ring-2 ${isArena ? "ring-indigo-200" : isAdventure ? "ring-orange-300 ring-offset-2 ring-offset-orange-100" : "ring-purple-300/50 dark:ring-purple-600/50"}`}>
                  <AvatarImage src={avatarSrc} />
                  <AvatarFallback className={`text-white text-xs font-bold ${isArena ? "bg-indigo-100 !text-indigo-700" : isAdventure ? "bg-gradient-to-br from-orange-400 to-pink-500" : "bg-gradient-to-br from-purple-600 to-pink-500"}`}>
                    {studentData.firstName[0]}{studentData.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                {isAdventure && (
                  <span className="absolute -top-1 -right-1 text-sm">⭐</span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-[13px] font-bold truncate ${isArena ? "text-indigo-700" : isAdventure ? "text-gray-800" : "text-slate-800 dark:text-white"}`}>
                  {studentData.firstName} {studentData.lastName}
                </p>
                <p className={`text-[11px] font-medium truncate ${isArena ? "text-indigo-400" : isAdventure ? "text-orange-500" : "text-purple-600/70 dark:text-purple-400/70"}`}>
                  {isArena ? "Arena Player" : isAdventure ? `${gamificationLevel.title} Lv.${gamificationLevel.level}` : "Student Account"}
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-xs font-medium transition-all border-slate-200 dark:border-slate-700 hover:bg-red-50 hover:text-red-600 hover:border-red-300"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-3.5 h-3.5 mr-1.5" /> Log Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className={`flex items-center justify-between gap-2 sm:gap-4 px-3 sm:px-6 py-2 sm:py-3 border-b sticky top-0 z-50 ${
            isArena
              ? "border-slate-200 bg-white/98 backdrop-blur-sm"
              : isAdventure
              ? "border-orange-200/40 bg-white/85 backdrop-blur-xl"
              : "border-purple-100/30 dark:border-purple-900/20 bg-white/70 dark:bg-slate-950/70 backdrop-blur-xl"
          }`}>
            <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              {!isArena && !isAdventure && (
                <Badge variant="outline" className="hidden sm:flex bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800 text-[11px]">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500 mr-1.5 animate-pulse" />
                  Active
                </Badge>
              )}
            </div>

            <div className="flex-1 min-w-0">
              {isArena && (
                <ArenaTopBar
                  level={gamificationLevel}
                  xp={studentXP}
                  streak={studentStreak}
                  rankChange={rankChange}
                  studentName={studentData.firstName}
                />
              )}
              {isAdventure && (
                <AdventureTopBar
                  level={gamificationLevel}
                  streak={studentStreak}
                  weeklyStars={weeklyStars}
                  studentName={studentData.firstName}
                />
              )}
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
              {lockPinEnabled && lockPin.length >= 4 && (
                <Button 
                  size="sm"
                  onClick={lock}
                  title="Lock Screen (Ctrl+L)"
                  data-testid="button-header-lock"
                  className="gap-1.5 px-2.5 h-8 bg-gradient-to-r from-red-500 to-rose-600 text-white border-0 rounded-lg text-xs"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Lock</span>
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 h-8 px-2.5 rounded-lg text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                onClick={() => setHelpChatOpen(true)}
                data-testid="button-need-help"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs font-medium">Need Help</span>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="gap-1.5 h-8 px-2.5 rounded-lg text-slate-600 hover:text-indigo-700 hover:bg-indigo-50"
                onClick={() => window.open("/guides/student-guide.html", "_blank")}
                data-testid="button-header-guide"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden sm:inline text-xs font-medium">Guide</span>
              </Button>
              <NotificationBell 
                hasNewNotifications={announcements.length > 0} 
                notificationCount={announcements.length}
                onClick={() => setActiveTab("announcements")}
              />
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg" onClick={() => setLocation("/")} data-testid="button-homepage">
                <Home className="w-3.5 h-3.5" />
              </Button>
              {!isArena && !isAdventure && (
                <div className="flex items-center gap-2 pl-2 sm:pl-3 border-l border-purple-100/50 dark:border-purple-800/30">
                  <div className="text-right hidden sm:block">
                    <p className="text-[13px] font-semibold">{studentData.firstName} {studentData.lastName}</p>
                    <p className="text-[11px] text-muted-foreground">Student Account</p>
                  </div>
                  <Avatar className="w-8 h-8">
                    {avatarSrc && <AvatarImage src={avatarSrc} alt={`${studentData.firstName} ${studentData.lastName}`} className="object-cover" />}
                    <AvatarFallback className="bg-gradient-to-br from-purple-600 to-pink-500 text-white text-xs font-bold">
                      {studentData.firstName[0]}{studentData.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                </div>
              )}
            </div>
          </header>

          <main className={`flex-1 overflow-y-auto p-3 sm:p-6 pb-20 md:pb-6 scroll-optimized ${
            isArena
              ? "bg-gradient-to-br from-slate-50 via-indigo-50/40 to-violet-50/20"
              : isAdventure
              ? "bg-gradient-to-br from-orange-50 via-pink-50/50 to-purple-50/30"
              : "bg-gradient-to-br from-slate-50/80 via-purple-50/30 to-pink-50/20 dark:from-slate-950 dark:via-purple-950/10 dark:to-slate-950"
          }`}>
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </main>
        </div>
      </div>
      </SidebarProvider>
      
      <BottomNavigation
        tabs={studentNavigationTabs}
        activeTab={getMobileActiveTab()}
        onTabChange={handleMobileTabChange}
      />

      <Dialog open={showProfileRequiredDialog} onOpenChange={setShowProfileRequiredDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex justify-center mb-4">
              <div className="p-4 rounded-full bg-gradient-to-br from-amber-100 to-orange-100 dark:from-amber-900/30 dark:to-orange-900/30">
                <UserCircle className="w-12 h-12 text-amber-600" />
              </div>
            </div>
            <DialogTitle className="text-center text-xl">Complete Your Profile First</DialogTitle>
            <DialogDescription className="text-center">
              To participate in olympiads, you need to complete your profile. This helps us verify your identity and ensures fair competition.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-3 py-4">
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${profile?.firstName && profile?.lastName ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                {profile?.firstName && profile?.lastName ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">1</span>}
              </div>
              <span className={profile?.firstName && profile?.lastName ? 'text-green-600 dark:text-green-400' : ''}>Full Name</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${profile?.dateOfBirth ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                {profile?.dateOfBirth ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">2</span>}
              </div>
              <span className={profile?.dateOfBirth ? 'text-green-600 dark:text-green-400' : ''}>Date of Birth</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${profile?.gender ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                {profile?.gender ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">3</span>}
              </div>
              <span className={profile?.gender ? 'text-green-600 dark:text-green-400' : ''}>Gender</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${profile?.gradeLevel ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                {profile?.gradeLevel ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">4</span>}
              </div>
              <span className={profile?.gradeLevel ? 'text-green-600 dark:text-green-400' : ''}>Class/Grade</span>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className={`w-6 h-6 rounded-full flex items-center justify-center ${profile?.phone ? 'bg-green-100 text-green-600 dark:bg-green-900/50 dark:text-green-400' : 'bg-gray-100 text-gray-400 dark:bg-gray-800'}`}>
                {profile?.phone ? <CheckCircle className="w-4 h-4" /> : <span className="text-xs font-bold">5</span>}
              </div>
              <span className={profile?.phone ? 'text-green-600 dark:text-green-400' : ''}>Phone Number</span>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={() => setShowProfileRequiredDialog(false)} className="w-full sm:w-auto">
              Cancel
            </Button>
            <Button 
              className="w-full sm:w-auto brand-button"
              onClick={() => {
                setShowProfileRequiredDialog(false);
                setActiveTab("profile");
              }}
              data-testid="button-complete-profile"
            >
              Complete Profile Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {isGurujiOpen ? null : <motion.button
        className="fixed bottom-6 right-4 md:right-6 z-[60] flex items-center gap-2.5 pl-1.5 pr-4 py-1.5 rounded-full bg-gradient-to-r from-purple-600 via-fuchsia-500 to-pink-500 shadow-lg shadow-purple-500/30 hover:shadow-xl hover:shadow-purple-500/40 transition-shadow ring-2 ring-white/40"
        onClick={() => setIsGurujiOpen(true)}
        whileHover={{ scale: 1.08, y: -3 }}
        whileTap={{ scale: 0.93 }}
        animate={{ y: [0, -4, 0] }}
        transition={{ y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" } }}
        data-testid="button-open-tara"
        title="TARA - AI Learning Companion"
      >
        <img src={taraAvatarImg} alt="TARA" className="w-9 h-9 rounded-full object-cover border-2 border-white/50" />
        <span className="text-white font-bold text-[13px] tracking-wide">Learn with TARA</span>
      </motion.button>}

      {/* TARA AI Interface */}
      {profile?.id && (
        <GurujiInterface
          isOpen={isGurujiOpen}
          onClose={() => setIsGurujiOpen(false)}
          studentId={profile.id}
          studentName={studentData.firstName || "Student"}
          gradeLevel={studentData.gradeLevel ? parseInt(String(studentData.gradeLevel).replace(/\D/g, '')) || undefined : undefined}
        />
      )}

      {/* Profile Photo Cropper */}
      {showCropper && (
        <ProfileImageCropper
          onCropComplete={handleCropComplete}
          onClose={() => setShowCropper(false)}
          isUploading={isUploadingPicture}
        />
      )}
      <HelpGuideFAB role="student" />
      <HelpChatPanel isOpen={helpChatOpen} onClose={() => setHelpChatOpen(false)} profileType="student" userName={`${studentData.firstName} ${studentData.lastName}`} />
    </>
  );
}