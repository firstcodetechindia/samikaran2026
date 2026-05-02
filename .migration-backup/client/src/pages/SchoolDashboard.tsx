import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useLocation, Link, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter
} from "@/components/ui/sidebar";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { schoolNavigationTabs } from "@/config/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GlassCard, StatCard, SectionHeader, SkeletonCard, EmptyState } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { NotificationBell } from "@/components/NotificationBell";
import { HelpGuideFAB } from "@/components/HelpGuideButton";
import { 
  Bell, Users, CreditCard, Award, Calendar, Building2, LogOut, Home,
  Clock, ChevronRight, Trophy, UserPlus, BarChart3, FileSpreadsheet,
  Settings, Search, Eye, Download, Upload, TrendingUp, GraduationCap,
  UserCog, Percent, Target, Medal, Sparkles, Zap, BookOpen, HelpCircle
} from "lucide-react";
import HelpChatPanel from "@/components/HelpChatPanel";
import { useCustomAuth, getStoredUser } from "@/hooks/use-custom-auth";
import { useAnnouncements, useCalendarEvents, usePayments, useProfile, useUpdateProfile } from "@/hooks/use-dashboard-data";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { StudentPerformanceDialog } from "@/components/StudentPerformanceDialog";
import AcademicStructure from "@/components/school/AcademicStructure";

import { apiRequest, queryClient } from "@/lib/queryClient";
import { Copy, Check } from "lucide-react";

interface SchoolClassItem { id: number; name: string; gradeNumber: number; section: string; }

function AddStudentForm({ onDone, toast }: { onDone: () => void; toast: any }) {
  const [form, setForm] = useState({
    firstName: "", lastName: "", dateOfBirth: "", gender: "", email: "", phone: "",
    classId: "", section: "A", parentName: "", parentPhone: "",
  });
  const [credentials, setCredentials] = useState<{ loginId: string; password: string; studentId: string; name: string } | null>(null);
  const [copied, setCopied] = useState("");

  const { data: schoolClasses = [] } = useQuery<SchoolClassItem[]>({
    queryKey: ["/api/school/my-school/classes"],
  });

  const sections = (() => {
    if (!form.classId) return [];
    const cls = schoolClasses.find(c => String(c.id) === form.classId);
    return cls?.section ? cls.section.split(",").map(s => s.trim()) : ["A"];
  })();

  const registerMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/school/my-school/students/register", data);
      return res.json();
    },
    onSuccess: (data: any) => {
      setCredentials({ loginId: data.credentials.loginId, password: data.credentials.password, studentId: data.credentials.studentId, name: data.student.name });
      queryClient.invalidateQueries({ queryKey: ["/api/school/my-school/students"] });
      toast({ title: "Student Registered!", description: data.message });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  function handleSubmit() {
    if (!form.firstName || !form.lastName || !form.dateOfBirth || !form.gender) {
      toast({ title: "Missing Fields", description: "Please fill all required fields", variant: "destructive" });
      return;
    }
    registerMutation.mutate(form);
  }

  function copyText(text: string, field: string) {
    navigator.clipboard.writeText(text);
    setCopied(field);
    setTimeout(() => setCopied(""), 2000);
  }

  if (credentials) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b bg-gradient-to-r from-green-500/10 to-emerald-500/10">
            <CardTitle className="text-xl font-bold flex items-center gap-2 text-green-700">
              <Check className="w-6 h-6" /> Student Registered Successfully!
            </CardTitle>
            <CardDescription>Share these login credentials with the student/parent</CardDescription>
          </CardHeader>
          <CardContent className="p-6 space-y-5">
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 border-2 border-primary/20 rounded-xl p-6 space-y-4">
              <h3 className="font-bold text-lg text-center">{credentials.name}</h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg p-3 border">
                  <div><p className="text-xs text-muted-foreground">Student ID</p><p className="font-mono font-bold" data-testid="text-student-id">{credentials.studentId}</p></div>
                  <Button variant="ghost" size="icon" onClick={() => copyText(credentials.studentId, "sid")} data-testid="button-copy-student-id">
                    {copied === "sid" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg p-3 border">
                  <div><p className="text-xs text-muted-foreground">Login Email</p><p className="font-mono font-bold" data-testid="text-login-email">{credentials.loginId}</p></div>
                  <Button variant="ghost" size="icon" onClick={() => copyText(credentials.loginId, "email")} data-testid="button-copy-login-email">
                    {copied === "email" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <div className="flex items-center justify-between bg-white dark:bg-gray-900 rounded-lg p-3 border">
                  <div><p className="text-xs text-muted-foreground">Password</p><p className="font-mono font-bold text-lg" data-testid="text-password">{credentials.password}</p></div>
                  <Button variant="ghost" size="icon" onClick={() => copyText(credentials.password, "pass")} data-testid="button-copy-password">
                    {copied === "pass" ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
              <p className="text-xs text-center text-muted-foreground">Student can login at samikaranolympiad.com using these credentials</p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" onClick={() => { setCredentials(null); setForm({ firstName: "", lastName: "", dateOfBirth: "", gender: "", email: "", phone: "", classId: "", section: "A", parentName: "", parentPhone: "" }); }} data-testid="button-register-another">
                Register Another Student
              </Button>
              <Button className="brand-button" onClick={onDone} data-testid="button-done-registration">
                Done
              </Button>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-teal-500/5 to-cyan-500/5">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add New Student
          </CardTitle>
          <CardDescription>Register a student — login credentials will be auto-generated</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-semibold">First Name *</Label>
              <Input value={form.firstName} onChange={e => setForm(p => ({ ...p, firstName: e.target.value }))} placeholder="Enter first name" className="shadow-sm" data-testid="input-student-firstname" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Last Name *</Label>
              <Input value={form.lastName} onChange={e => setForm(p => ({ ...p, lastName: e.target.value }))} placeholder="Enter last name" className="shadow-sm" data-testid="input-student-lastname" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Date of Birth *</Label>
              <Input type="date" value={form.dateOfBirth} onChange={e => setForm(p => ({ ...p, dateOfBirth: e.target.value }))} className="shadow-sm" data-testid="input-student-dob" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Gender *</Label>
              <Select value={form.gender} onValueChange={v => setForm(p => ({ ...p, gender: v }))}>
                <SelectTrigger className="shadow-sm" data-testid="select-student-gender">
                  <SelectValue placeholder="Select gender" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Male">Male</SelectItem>
                  <SelectItem value="Female">Female</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Email Address</Label>
              <Input type="email" value={form.email} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} placeholder="student@email.com (optional)" className="shadow-sm" data-testid="input-student-email" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Phone Number</Label>
              <Input value={form.phone} onChange={e => setForm(p => ({ ...p, phone: e.target.value }))} placeholder="+91 XXXXXXXXXX" className="shadow-sm" data-testid="input-student-phone" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Grade Level *</Label>
              <Select value={form.classId} onValueChange={v => setForm(p => ({ ...p, classId: v, section: "A" }))}>
                <SelectTrigger className="shadow-sm" data-testid="select-student-grade">
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {schoolClasses.map(c => (
                    <SelectItem key={c.id} value={String(c.id)}>{c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Section / Division</Label>
              <Select value={form.section} onValueChange={v => setForm(p => ({ ...p, section: v }))}>
                <SelectTrigger className="shadow-sm" data-testid="select-student-section">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {(sections.length > 0 ? sections : ["A"]).map(s => (
                    <SelectItem key={s} value={s}>Section {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Parent/Guardian Name *</Label>
              <Input value={form.parentName} onChange={e => setForm(p => ({ ...p, parentName: e.target.value }))} placeholder="Enter parent name" className="shadow-sm" data-testid="input-student-parent" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Parent Phone *</Label>
              <Input value={form.parentPhone} onChange={e => setForm(p => ({ ...p, parentPhone: e.target.value }))} placeholder="+91 XXXXXXXXXX" className="shadow-sm" data-testid="input-student-parent-phone" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={onDone} data-testid="button-cancel-student">
              Cancel
            </Button>
            <Button className="brand-button shadow-lg" disabled={registerMutation.isPending} onClick={handleSubmit} data-testid="button-submit-student">
              {registerMutation.isPending ? "Registering..." : <><UserPlus className="w-4 h-4 mr-2" /> Register Student</>}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

type DashboardTab = "overview" | "announcements" | "coordinators" | "add-coordinator" | "students" | "add-student" | "bulk-upload" | "olympiads" | "billing" | "profile";

const menuItems = [
  { id: "overview" as DashboardTab, title: "Dashboard", icon: TrendingUp },
  { id: "announcements" as DashboardTab, title: "Announcements", icon: Bell },
  { id: "coordinators" as DashboardTab, title: "Coordinators", icon: UserCog },
  { id: "students" as DashboardTab, title: "All Students", icon: Users },
  { id: "bulk-upload" as DashboardTab, title: "Bulk Upload", icon: Upload },
  { id: "olympiads" as DashboardTab, title: "Olympiad Calendar", icon: GraduationCap },
  { id: "billing" as DashboardTab, title: "Billing & Invoices", icon: CreditCard },
  { id: "profile" as DashboardTab, title: "School Profile", icon: Building2 },
];

const gradeColors: Record<string, string> = {
  "1": "from-pink-500 to-rose-500", "2": "from-purple-500 to-violet-500",
  "3": "from-indigo-500 to-blue-500", "4": "from-blue-500 to-cyan-500",
  "5": "from-teal-500 to-green-500", "6": "from-green-500 to-emerald-500",
  "7": "from-amber-500 to-orange-500", "8": "from-pink-500 to-rose-500",
  "9": "from-purple-500 to-violet-500", "10": "from-indigo-500 to-blue-500",
  "11": "from-blue-500 to-cyan-500", "12": "from-teal-500 to-green-500",
};

export default function SchoolDashboard() {
  const [, setLocation] = useLocation();
  const [, routeParams] = useRoute("/school/:tab");
  const tabFromUrl = (routeParams?.tab || "overview") as DashboardTab;
  const validTabs: DashboardTab[] = ["overview", "announcements", "coordinators", "add-coordinator", "students", "add-student", "bulk-upload", "olympiads", "billing", "profile"];
  const [activeTab, setActiveTabState] = useState<DashboardTab>(validTabs.includes(tabFromUrl) ? tabFromUrl : "overview");

  const setActiveTab = (tab: DashboardTab) => {
    setActiveTabState(tab);
    setLocation(tab === "overview" ? "/school" : `/school/${tab}`, { replace: tab === activeTab });
  };

  useEffect(() => {
    if (validTabs.includes(tabFromUrl)) {
      if (tabFromUrl !== activeTab) setActiveTabState(tabFromUrl);
    } else if (tabFromUrl !== "overview") {
      setActiveTabState("overview");
      setLocation("/school", { replace: true });
    }
  }, [tabFromUrl]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<{id: number; name: string; grade?: string; school?: string} | null>(null);
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
  const [hasNewNotifications] = useState(true);
  const [helpChatOpen, setHelpChatOpen] = useState(false);
  const { logout, isLoading: authLoading } = useCustomAuth();
  
  // Get stored user from localStorage
  const storedUser = getStoredUser();
  
  // Redirect if not authenticated or wrong user type
  useEffect(() => {
    if (!authLoading && (!storedUser || storedUser.userType !== "school")) {
      setLocation("/login");
    }
  }, [authLoading, storedUser, setLocation]);
  
  // Fetch real data from backend
  const userId = storedUser?.id || 0;
  const { data: announcements = [], isLoading: announcementsLoading } = useAnnouncements("school");
  const { data: calendarEvents = [], isLoading: eventsLoading } = useCalendarEvents("school");
  const { data: allStudents = [], isLoading: studentsLoading } = useQuery<any[]>({
    queryKey: ["/api/school/my-school/students"],
  });
  const { data: payments = [], isLoading: paymentsLoading } = usePayments(userId, "school");
  const { data: profile, isLoading: profileLoading } = useProfile(userId, "school");
  const { data: coordinators = [], isLoading: coordinatorsLoading } = useQuery<any[]>({
    queryKey: [`/api/coordinators?schoolId=${userId}`],
  });
  const updateProfileMutation = useUpdateProfile();
  
  // Fetch available olympiads for school
  const { data: availableOlympiads = [], isLoading: olympiadsLoading } = useQuery<any[]>({
    queryKey: ["/api/public/olympiads"],
    queryFn: async () => {
      const res = await fetch("/api/public/olympiads");
      if (!res.ok) throw new Error("Failed to fetch olympiads");
      return res.json();
    },
  });
  const { toast } = useToast();
  
  // Profile edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    schoolName: "",
    schoolCity: "",
    country: "",
    teacherFirstName: "",
    teacherLastName: "",
  });
  
  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        schoolName: profile.schoolName || "",
        schoolCity: profile.schoolCity || "",
        country: profile.country || "",
        teacherFirstName: profile.teacherFirstName || "",
        teacherLastName: profile.teacherLastName || "",
      });
    }
  }, [profile]);

  const schoolData = {
    name: profile?.schoolName || storedUser?.schoolName || "School",
    city: profile?.schoolCity || "",
    country: profile?.country || "",
    contactPerson: profile?.teacherFirstName 
      ? `${profile.teacherFirstName} ${profile.teacherLastName || ""}`.trim() 
      : storedUser?.firstName 
        ? `${storedUser.firstName} ${storedUser.lastName || ""}`.trim() 
        : "Admin",
    email: profile?.email || storedUser?.email || "",
    phone: profile?.phone || storedUser?.phone || "",
    schoolId: profile?.schoolId || `SCH2026${String(storedUser?.id || 0).padStart(3, '0')}`,
    partnerSince: profile?.createdAt ? new Date(profile.createdAt).getFullYear().toString() : new Date().getFullYear().toString(),
    tier: profile?.tier || storedUser?.tier || ""
  };
  
  const handleUpdateProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        userId,
        userType: "school",
        updates: editForm
      });
      toast({ title: "Profile Updated", description: "Your school profile has been updated successfully." });
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({ title: "Update Failed", description: "Failed to update profile. Please try again.", variant: "destructive" });
    }
  };

  const upcomingExamsList = availableOlympiads.filter((o: any) => {
    const start = o.startTime ? new Date(o.startTime) : null;
    return start && start > new Date();
  });
  
  const stats = {
    totalStudents: allStudents.length,
    activeExams: availableOlympiads.filter((o: any) => o.status === "active" || o.status === "published").length,
    avgScore: allStudents.length > 0 
      ? Math.round(allStudents.reduce((sum: number, s: any) => sum + (s.averageScore || 0), 0) / allStudents.length) 
      : 0,
    totalCoordinators: coordinators.length,
    certificatesEarned: allStudents.reduce((sum: number, s: any) => sum + (s.certificatesCount || 0), 0),
    upcomingExams: upcomingExamsList.length
  };
  
  const studentsByGrade = allStudents.reduce((acc: Record<string, number>, s: any) => {
    const grade = s.class_name || s.grade_level || s.gradeLevel || "Unknown";
    acc[grade] = (acc[grade] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const sidebarStyle: Record<string, string> = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  const handleLogout = () => {
    logout();
  };

  const renderOverviewTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {availableOlympiads.length > 0 && (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-teal-600 via-cyan-600 to-emerald-600 p-[1px] animate-fade-in">
          <div className="relative flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-teal-600/95 via-cyan-600/95 to-emerald-600/95 backdrop-blur-xl px-5 py-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="font-semibold text-white text-lg">{availableOlympiads[0]?.title || availableOlympiads[0]?.name || "Samikaran Olympiad"}</p>
                <p className="text-white/80 text-sm">Register your students for the upcoming olympiad!</p>
              </div>
            </div>
            <Link href={`/olympiad/${availableOlympiads[0]?.slug || availableOlympiads[0]?.id}`}>
              <Button variant="ghost" size="sm" className="text-white border border-white/30 backdrop-blur-sm">
                Learn More <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* School Info Alert */}
      <Card className="border border-teal-200 bg-teal-50 dark:border-teal-800 dark:bg-teal-950/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-teal-500/20 flex items-center justify-center">
              <Building2 className="w-5 h-5 text-teal-600" />
            </div>
            <div>
              <p className="font-semibold text-teal-800 dark:text-teal-200">{schoolData.name}</p>
              <p className="text-sm text-teal-600 dark:text-teal-400">{[schoolData.city, schoolData.country].filter(Boolean).join(", ")}{schoolData.tier ? ` - ${schoolData.tier}` : ""}</p>
            </div>
          </div>
          <Button size="sm" className="bg-teal-500 text-white" onClick={() => setActiveTab("profile")}>
            View Profile
          </Button>
        </CardContent>
      </Card>

      {/* Welcome Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black">Welcome back, {schoolData.contactPerson}!</h2>
          <p className="text-muted-foreground">Manage your school's olympiad participation</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-medium">School ID: {schoolData.schoolId}</Badge>
          <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0">{schoolData.tier}</Badge>
        </div>
      </div>

      {/* Quick Action Buttons - Grid on mobile, horizontal wrap on desktop */}
      <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 sm:gap-3 animate-slide-up stagger-1" style={{ animationFillMode: 'forwards', opacity: 0 }}>
        <Button 
          size="sm"
          className="bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md text-xs sm:text-sm" 
          onClick={() => setActiveTab("students")} 
          data-testid="button-quick-students"
        >
          <Users className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="truncate">View Students</span>
        </Button>
        <Button 
          size="sm"
          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md text-xs sm:text-sm" 
          onClick={() => setActiveTab("bulk-upload")} 
          data-testid="button-quick-upload"
        >
          <Upload className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="truncate">Bulk Upload</span>
        </Button>
        <Button 
          size="sm"
          className="bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md text-xs sm:text-sm" 
          onClick={() => setActiveTab("coordinators")} 
          data-testid="button-quick-coordinators"
        >
          <UserPlus className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="truncate">Coordinators</span>
        </Button>
        <Button 
          size="sm"
          className="bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md text-xs sm:text-sm" 
          onClick={() => setActiveTab("olympiads")} 
          data-testid="button-quick-olympiads"
        >
          <Award className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="truncate">Olympiad Calendar</span>
        </Button>
      </div>

      {/* Stats Grid - Premium Glass Cards */}
      <div className="grid gap-4 sm:gap-5 grid-cols-2 md:grid-cols-4">
        <StatCard
          title="Total Students"
          value={stats.totalStudents}
          subtitle="Registered"
          icon={<Users className="w-5 h-5" />}
          iconGradient="cyan"
          delay={1}
        />
        <StatCard
          title="Average Score"
          value={`${stats.avgScore}%`}
          subtitle="School performance"
          icon={<Target className="w-5 h-5" />}
          iconGradient="green"
          delay={2}
        />
        <StatCard
          title="Certificates"
          value={stats.certificatesEarned}
          subtitle="Earned by students"
          icon={<Trophy className="w-5 h-5" />}
          iconGradient="amber"
          delay={3}
        />
        <StatCard
          title="Upcoming Exams"
          value={stats.upcomingExams}
          subtitle="Scheduled"
          icon={<Calendar className="w-5 h-5" />}
          iconGradient="purple"
          delay={4}
        />
      </div>

      {/* Available Olympiads Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-primary" />
            <h2 className="font-bold text-lg">Available Olympiads</h2>
          </div>
          <Badge variant="outline" className="text-xs">{availableOlympiads.length} olympiad{availableOlympiads.length !== 1 ? 's' : ''}</Badge>
        </div>
        
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
            <CardContent className="p-6 text-center">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No olympiads available at this time.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {availableOlympiads.slice(0, 6).map((olympiad) => {
              const startDate = olympiad.startTime ? new Date(olympiad.startTime) : null;
              const now = new Date();
              const isUpcoming = startDate && startDate > now;
              const isOngoing = startDate && olympiad.endTime && new Date(olympiad.endTime) > now && startDate <= now;
              
              return (
                <Card key={olympiad.id} className="border-0 shadow-lg hover:shadow-xl transition-all group">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-5 h-5 text-white" />
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        {isOngoing && <Badge className="bg-green-500 text-white text-[10px]">Live</Badge>}
                        {isUpcoming && <Badge variant="outline" className="text-[10px]">Upcoming</Badge>}
                      </div>
                    </div>
                    <h3 className="font-bold text-sm group-hover:text-primary transition-colors line-clamp-2">{olympiad.title}</h3>
                    <p className="text-xs text-muted-foreground mt-1">{olympiad.subject}</p>
                    <div className="flex items-center justify-between mt-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" />
                        <span>{olympiad.durationMinutes} mins</span>
                      </div>
                      <Badge variant="secondary" className="text-[10px]">
                        Class {olympiad.minClass}-{olympiad.maxClass}
                      </Badge>
                    </div>
                    {startDate && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {format(startDate, "MMM dd, yyyy")}
                      </p>
                    )}
                    <Link href={`/olympiad/${olympiad.slug || olympiad.id}`}>
                      <Button size="sm" variant="outline" className="w-full mt-3">
                        View Details <ChevronRight className="w-3 h-3 ml-1" />
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <GraduationCap className="w-5 h-5 text-primary" />
              Students by Grade
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {Object.keys(studentsByGrade).length === 0 ? (
              <div className="text-center py-6">
                <Users className="w-10 h-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">No students registered yet</p>
              </div>
            ) : (
              Object.entries(studentsByGrade)
                .sort(([a], [b]) => (parseInt(a) || 0) - (parseInt(b) || 0))
                .map(([grade, count]) => (
                  <div key={grade} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="font-semibold">Grade {grade}</span>
                      <span className="text-muted-foreground">{count} student{count !== 1 ? 's' : ''}</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <motion.div 
                        className={`h-full rounded-full bg-gradient-to-r ${gradeColors[grade] || "from-teal-500 to-cyan-500"}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min((count / Math.max(allStudents.length, 1)) * 100 * 5, 100)}%` }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                      />
                    </div>
                  </div>
                ))
            )}
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("bulk-upload")} data-testid="button-quick-bulk-upload">
              <Upload className="w-4 h-4 mr-3 text-blue-500" /> Bulk Upload Students
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("coordinators")} data-testid="button-quick-add-coordinator">
              <UserPlus className="w-4 h-4 mr-3 text-purple-500" /> Add Coordinator
            </Button>
            <Button className="w-full justify-start" variant="outline" onClick={() => setActiveTab("olympiads")} data-testid="button-quick-view-olympiads">
              <GraduationCap className="w-4 h-4 mr-3 text-green-500" /> Olympiad Calendar
            </Button>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );

  const renderAnnouncementsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-lg">Latest Announcements</h2>
      </div>
      
      {announcementsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse border-0 shadow-lg">
              <CardContent className="p-5">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-10 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No announcements yet</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for updates from Samikaran Olympiad</p>
          </CardContent>
        </Card>
      ) : (
        announcements.map((announcement: any, index: number) => (
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
                      {announcement.priority === "high" && (
                        <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 text-xs">
                          Important
                        </Badge>
                      )}
                      <span className="text-xs text-muted-foreground font-medium">
                        {announcement.createdAt ? format(new Date(announcement.createdAt), "MMM d, yyyy") : ""}
                      </span>
                    </div>
                    <h3 className="font-bold text-base">{announcement.title}</h3>
                    {announcement.content && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{announcement.content}</p>
                    )}
                  </div>
                  <Button variant="outline" size="sm" className="shrink-0" onClick={() => toast({ title: announcement.title, description: announcement.content || "" })} data-testid={`button-announcement-${announcement.id}`}>
                    View <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))
      )}
    </motion.div>
  );

  const renderCoordinatorsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search coordinators..." 
            className="pl-10 bg-background shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-coordinators"
          />
        </div>
        <Button className="brand-button shadow-lg" onClick={() => setActiveTab("add-coordinator")} data-testid="button-add-coordinator">
          <UserPlus className="w-4 h-4 mr-2" /> Add Coordinator
        </Button>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-teal-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
            <UserCog className="w-10 h-10 text-teal-600" />
          </div>
          <h3 className="font-bold text-lg mb-2">No Coordinators Yet</h3>
          <p className="text-muted-foreground mb-4">Add coordinators to help manage student registrations for specific grades or departments.</p>
          <Button className="brand-button shadow-lg" onClick={() => setActiveTab("add-coordinator")} data-testid="button-add-first-coordinator">
            <UserPlus className="w-4 h-4 mr-2" /> Add Your First Coordinator
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderAddCoordinatorTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-teal-500/5 to-cyan-500/5">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add New Coordinator
          </CardTitle>
          <CardDescription>Create a coordinator account to help manage students for specific grades or departments</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Card className="border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <UserCog className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-semibold text-blue-800 dark:text-blue-200">What is a Coordinator?</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 mt-1">
                    Coordinators are school staff members who help manage student registrations for specific grades or departments. 
                    They can register students, track exam participation, view results, and download certificates for their assigned students.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-semibold">First Name *</Label>
              <Input placeholder="Enter first name" className="shadow-sm" data-testid="input-coordinator-firstname" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Last Name *</Label>
              <Input placeholder="Enter last name" className="shadow-sm" data-testid="input-coordinator-lastname" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Email Address *</Label>
              <Input type="email" placeholder="coordinator@school.edu" className="shadow-sm" data-testid="input-coordinator-email" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Phone Number *</Label>
              <Input placeholder="+91 XXXXXXXXXX" className="shadow-sm" data-testid="input-coordinator-phone" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Department / Subject *</Label>
              <Input placeholder="e.g., Science, Mathematics" className="shadow-sm" data-testid="input-coordinator-department" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Assigned Grades *</Label>
              <Input placeholder="e.g., Grade 6-8 or Grade 9-10" className="shadow-sm" data-testid="input-coordinator-grades" />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label className="font-semibold">Designation / Role</Label>
              <Input placeholder="e.g., Head of Science Department" className="shadow-sm" data-testid="input-coordinator-designation" />
            </div>
          </div>

          <Card className="border border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950/30">
            <CardContent className="p-4">
              <p className="text-sm text-amber-700 dark:text-amber-300">
                <strong>Note:</strong> The coordinator will receive an email with login credentials. They can then access their own dashboard to manage students assigned to them.
              </p>
            </CardContent>
          </Card>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setActiveTab("coordinators")} data-testid="button-cancel-coordinator">
              Cancel
            </Button>
            <Button className="brand-button shadow-lg" onClick={() => { toast({ title: "Coordinator Added", description: "New coordinator has been added successfully." }); setActiveTab("coordinators"); }} data-testid="button-submit-coordinator">
              <UserPlus className="w-4 h-4 mr-2" /> Add Coordinator
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderStudentsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search students..." className="pl-10 bg-background shadow-sm" data-testid="input-search-students" />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="shadow-sm" disabled data-testid="button-export-students">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button className="bg-green-500 text-white shadow-lg" onClick={() => setActiveTab("add-student")} data-testid="button-add-single-student">
            <UserPlus className="w-4 h-4 mr-2" /> Add Student
          </Button>
          <Button className="brand-button shadow-lg" onClick={() => setActiveTab("bulk-upload")} data-testid="button-bulk-upload">
            <Upload className="w-4 h-4 mr-2" /> Bulk Upload
          </Button>
        </div>
      </div>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b">
          <div className="flex items-center justify-between gap-4">
            <CardTitle className="text-lg font-bold">All Registered Students</CardTitle>
            <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0">{stats.totalStudents} students</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {studentsLoading ? (
            <div className="divide-y">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-3 p-4 animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-muted" />
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-1/3 mb-2" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : allStudents.length === 0 ? (
            <div className="p-10 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground font-medium">No students registered yet</p>
              <p className="text-sm text-muted-foreground mt-1">Add students individually or use bulk upload</p>
              <div className="flex justify-center gap-3 mt-4">
                <Button size="sm" className="bg-green-500 text-white" onClick={() => setActiveTab("add-student")} data-testid="button-add-first-student">
                  <UserPlus className="w-4 h-4 mr-2" /> Add Student
                </Button>
                <Button size="sm" variant="outline" onClick={() => setActiveTab("bulk-upload")} data-testid="button-first-bulk-upload">
                  <Upload className="w-4 h-4 mr-2" /> Bulk Upload
                </Button>
              </div>
            </div>
          ) : (
            <div className="divide-y">
              {allStudents
                .filter((s: any) => {
                  if (!searchQuery) return true;
                  const name = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
                  return name.includes(searchQuery.toLowerCase()) || (s.email || "").toLowerCase().includes(searchQuery.toLowerCase()) || (s.student_id || "").toLowerCase().includes(searchQuery.toLowerCase());
                })
                .map((student: any) => {
                  const studentName = `${student.first_name || ""} ${student.last_name || ""}`.trim();
                  const initials = studentName.split(" ").map((n: string) => n[0]).filter(Boolean).join("").toUpperCase();
                  const grade = student.class_name || student.grade_level || "";
                  return (
                    <div key={student.link_id || student.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors" data-testid={`row-student-${student.id}`}>
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10">
                          <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white text-sm font-bold">
                            {initials || "?"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-semibold">{studentName || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">
                            {student.student_id ? <span className="font-mono mr-2">{student.student_id}</span> : ""}
                            {grade ? `${grade} ${student.section ? `- Section ${student.section}` : ""} · ` : ""}{student.email || ""}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={student.profile_status === "active" ? "bg-green-500/10 text-green-600 border-0" : "bg-amber-500/10 text-amber-600 border-0"}>
                          {student.profile_status === "active" ? "Active" : student.profile_status || "Pending"}
                        </Badge>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          onClick={() => {
                            setSelectedStudent({ id: student.id, name: studentName, grade: grade ? grade : undefined, school: schoolData.name });
                            setPerformanceDialogOpen(true);
                          }}
                          data-testid={`button-view-student-${student.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" /> Performance
                        </Button>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderAddStudentTab = () => <AddStudentForm onDone={() => setActiveTab("students")} toast={toast} />;

  const renderBulkUploadTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-teal-500/5 to-cyan-500/5">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Bulk Student Registration
          </CardTitle>
          <CardDescription>Upload multiple students at once using our Excel template</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <motion.div 
            className="border-2 border-dashed border-primary/30 rounded-xl p-10 text-center bg-gradient-to-br from-teal-500/5 to-cyan-500/5"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center mb-6 shadow-xl">
              <Upload className="w-8 h-8 text-white" />
            </div>
            <h3 className="font-bold text-lg mb-2">Drag and drop your file here</h3>
            <p className="text-sm text-muted-foreground mb-6">Supports Excel (.xlsx) and CSV files</p>
            <Button variant="outline" className="shadow-sm" disabled data-testid="button-browse-files">
              Browse Files
            </Button>
          </motion.div>

          <Card className="border-0 shadow-md bg-gradient-to-r from-green-500/5 to-emerald-500/5">
            <CardContent className="p-4 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                <FileSpreadsheet className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-bold">Download Template</h4>
                <p className="text-sm text-muted-foreground">Use our standard template for error-free uploads</p>
              </div>
              <Button variant="outline" className="shadow-sm" disabled data-testid="button-download-template">
                <Download className="w-4 h-4 mr-2" /> Download
              </Button>
            </CardContent>
          </Card>

          <div className="space-y-2">
            <h4 className="font-bold">Instructions:</h4>
            <ul className="text-sm text-muted-foreground space-y-2 list-disc list-inside">
              <li>Download the template and fill in student details</li>
              <li>Ensure all mandatory fields are completed</li>
              <li>Upload the file and review before confirming</li>
              <li>Maximum 500 students per upload</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderOlympiadsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <h2 className="text-xl font-black flex items-center gap-2">
        <GraduationCap className="w-6 h-6 text-primary" />
        Olympiad Calendar
      </h2>
      {olympiadsLoading ? (
        <div className="space-y-4">
          {[1, 2].map(i => (
            <Card key={i} className="animate-pulse border-0 shadow-lg">
              <CardContent className="p-5"><div className="h-4 bg-muted rounded w-1/2 mb-2" /><div className="h-3 bg-muted rounded w-1/3" /></CardContent>
            </Card>
          ))}
        </div>
      ) : upcomingExamsList.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-10 text-center">
            <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground font-medium">No upcoming olympiads</p>
            <p className="text-sm text-muted-foreground mt-1">Check back later for upcoming olympiad events</p>
          </CardContent>
        </Card>
      ) : (
        upcomingExamsList.map((exam: any, idx: number) => {
          const startDate = new Date(exam.startTime);
          return (
            <motion.div key={exam.id || idx} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
              <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between gap-4 flex-wrap">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex flex-col items-center justify-center text-white shadow-lg">
                        <span className="text-xs font-bold">{format(startDate, "MMM").toUpperCase()}</span>
                        <span className="text-lg font-black">{format(startDate, "d")}</span>
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">{exam.title || exam.name}</h3>
                        <p className="text-sm text-muted-foreground">{exam.subject || "Olympiad"} • {exam.gradeRange || "All Grades"}</p>
                      </div>
                    </div>
                    <Badge className="bg-blue-500/10 text-blue-600 border-0">
                      {exam.status === "published" ? "Upcoming" : exam.status}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );



  const renderBillingTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50">
          <TabsTrigger value="pending" data-testid="tab-pending-invoices">Pending</TabsTrigger>
          <TabsTrigger value="paid" data-testid="tab-paid-invoices">Paid</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-6">
          {paymentsLoading ? (
            <Card className="animate-pulse border-0 shadow-lg">
              <CardContent className="p-5"><div className="h-4 bg-muted rounded w-1/2 mb-2" /><div className="h-3 bg-muted rounded w-1/3" /></CardContent>
            </Card>
          ) : payments.filter((p: any) => p.status === "pending").length === 0 ? (
            <Card className="border-0 shadow-lg">
              <CardContent className="p-10 text-center">
                <CreditCard className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
                <p className="text-muted-foreground font-medium">No pending invoices</p>
                <p className="text-sm text-muted-foreground mt-1">All payments are up to date</p>
              </CardContent>
            </Card>
          ) : (
            payments.filter((p: any) => p.status === "pending").map((payment: any) => (
              <motion.div key={payment.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
                <Card className="border-0 shadow-lg">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div>
                        <h3 className="font-bold text-lg">{payment.description || `Invoice #${payment.id}`}</h3>
                        <p className="text-sm text-muted-foreground">{payment.examTitle || "Olympiad Registration"}</p>
                        {payment.dueDate && <Badge variant="destructive" className="mt-2">Due: {format(new Date(payment.dueDate), "MMM d, yyyy")}</Badge>}
                      </div>
                      <div className="text-right">
                        <p className="text-3xl font-black">₹{payment.amount || 0}</p>
                        <Button className="mt-3 brand-button shadow-lg" size="sm" disabled data-testid={`button-pay-invoice-${payment.id}`}>
                          Pay Now
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </TabsContent>
        
        <TabsContent value="paid" className="mt-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-6">
                <CreditCard className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-muted-foreground font-medium">No paid invoices yet.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );

  const renderProfileTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 border-4 border-teal-200 flex items-center justify-center shadow-xl">
              <Building2 className="w-10 h-10 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-black">{schoolData.name}</h2>
              <p className="text-muted-foreground font-medium">{[schoolData.city, schoolData.country].filter(Boolean).join(", ")}</p>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {schoolData.tier && <Badge className="bg-gradient-to-r from-teal-500 to-cyan-500 text-white border-0">{schoolData.tier}</Badge>}
                <Badge variant="secondary">Partner since {schoolData.partnerSince}</Badge>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Contact Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Contact Person</Label>
              <p className="font-semibold mt-1">{schoolData.contactPerson}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">School ID</Label>
              <p className="font-semibold mt-1">{schoolData.schoolId}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Email</Label>
              <p className="font-semibold mt-1">{schoolData.email}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Phone</Label>
              <p className="font-semibold mt-1">{schoolData.phone}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <AcademicStructure />

      <div className="flex justify-end">
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogTrigger asChild>
            <Button className="brand-button shadow-lg" data-testid="button-update-profile">
              <Settings className="w-4 h-4 mr-2" /> Update School Profile
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Update School Profile</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="schoolName">School Name</Label>
                <Input 
                  id="schoolName" 
                  value={editForm.schoolName}
                  onChange={(e) => setEditForm(prev => ({ ...prev, schoolName: e.target.value }))}
                  data-testid="input-school-name"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="schoolCity">City</Label>
                  <Input 
                    id="schoolCity" 
                    value={editForm.schoolCity}
                    onChange={(e) => setEditForm(prev => ({ ...prev, schoolCity: e.target.value }))}
                    data-testid="input-school-city"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="country">Country</Label>
                  <Input 
                    id="country" 
                    value={editForm.country}
                    onChange={(e) => setEditForm(prev => ({ ...prev, country: e.target.value }))}
                    data-testid="input-country"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="teacherFirstName">Contact First Name</Label>
                  <Input 
                    id="teacherFirstName" 
                    value={editForm.teacherFirstName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, teacherFirstName: e.target.value }))}
                    data-testid="input-contact-first-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="teacherLastName">Contact Last Name</Label>
                  <Input 
                    id="teacherLastName" 
                    value={editForm.teacherLastName}
                    onChange={(e) => setEditForm(prev => ({ ...prev, teacherLastName: e.target.value }))}
                    data-testid="input-contact-last-name"
                  />
                </div>
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

  const renderContent = () => {
    switch (activeTab) {
      case "overview": return renderOverviewTab();
      case "announcements": return renderAnnouncementsTab();
      case "coordinators": return renderCoordinatorsTab();
      case "add-coordinator": return renderAddCoordinatorTab();
      case "students": return renderStudentsTab();
      case "add-student": return renderAddStudentTab();
      case "bulk-upload": return renderBulkUploadTab();
      case "olympiads": return renderOlympiadsTab();
      case "billing": return renderBillingTab();
      case "profile": return renderProfileTab();
      default: return renderOverviewTab();
    }
  };

  const getTabTitle = () => {
    const item = menuItems.find(m => m.id === activeTab);
    return item?.title || "Dashboard";
  };

  const handleMobileTabChange = (tabId: string) => {
    const tabMapping: Record<string, DashboardTab> = {
      "home": "overview",
      "students": "students",
      "olympiads": "olympiads",
      "settings": "profile"
    };
    setActiveTab(tabMapping[tabId] || "overview");
  };

  const getMobileActiveTab = (): string => {
    const reverseMapping: Record<DashboardTab, string> = {
      "overview": "home",
      "announcements": "home",
      "coordinators": "home",
      "add-coordinator": "home",
      "students": "students",
      "add-student": "students",
      "bulk-upload": "students",
      "olympiads": "olympiads",
      "billing": "settings",
      "profile": "settings"
    };
    return reverseMapping[activeTab] || "home";
  };

  return (
    <>
    <Helmet>
      <title>School Dashboard | Samikaran Olympiad</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r bg-gradient-to-b from-slate-50 to-teal-50/50 dark:from-slate-900 dark:to-teal-950/30">
          <SidebarHeader className="p-4 border-b border-teal-200/50 dark:border-teal-800/30">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center">
                <svg viewBox="0 0 100 100" width="40" height="40" className="drop-shadow-lg">
                  <defs>
                    <linearGradient id="schoolLogoUp" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9333EA" />
                      <stop offset="50%" stopColor="#C026D3" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id="schoolLogoDown" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#F472B6" />
                    </linearGradient>
                  </defs>
                  <polygon points="50,12 85,72 15,72" fill="rgba(0,0,0,0.12)" transform="translate(2, 4)" />
                  <polygon points="50,88 15,28 85,28" fill="rgba(0,0,0,0.1)" transform="translate(2, 4)" />
                  <polygon points="50,10 88,75 12,75" fill="url(#schoolLogoUp)" />
                  <polygon points="50,10 69,42.5 31,42.5" fill="rgba(255,255,255,0.18)" />
                  <polygon points="50,90 12,25 88,25" fill="url(#schoolLogoDown)" opacity="0.88" />
                  <polygon points="50,90 31,57.5 69,57.5" fill="rgba(255,255,255,0.12)" />
                  <rect x="32" y="44" width="36" height="5" rx="2.5" fill="white" />
                  <rect x="32" y="53" width="36" height="5" rx="2.5" fill="white" />
                </svg>
              </div>
              <div className="flex flex-col items-start">
                <span className="font-bold text-sm tracking-tight">SAMIKARAN<span className="brand-accent">.</span></span>
                <span className="text-xs font-bold uppercase text-muted-foreground">OLYMPIAD</span>
              </div>
            </Link>
          </SidebarHeader>
          
          <SidebarContent className="px-2 pt-2">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-0">
                  {menuItems.map((item, index) => (
                    <SidebarMenuItem key={item.id} className={index < menuItems.length - 1 ? "border-b border-gray-200 dark:border-gray-700" : ""}>
                      <SidebarMenuButton
                        onClick={() => setActiveTab(item.id)}
                        isActive={activeTab === item.id}
                        className={`transition-all duration-200 rounded-lg my-1 ${activeTab === item.id 
                          ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md font-medium" 
                          : "text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-gray-800"}`}
                        data-testid={`sidebar-${item.id}`}
                      >
                        <item.icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t border-teal-200/50 dark:border-teal-800/30 bg-teal-50/50 dark:bg-teal-950/20">
            <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-gradient-to-r from-teal-100 to-cyan-100 dark:from-teal-900/50 dark:to-cyan-900/50">
              <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md">
                <Building2 className="w-5 h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{schoolData.name}</p>
                <p className="text-xs text-muted-foreground truncate">School Account</p>
              </div>
            </div>
            <Button
              variant="outline"
              className="w-full"
              onClick={handleLogout}
              data-testid="button-logout"
            >
              <LogOut className="w-4 h-4 mr-2" /> Log Out
            </Button>
          </SidebarFooter>
        </Sidebar>

        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between gap-4 px-6 py-3 border-b bg-background sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <SidebarTrigger data-testid="button-sidebar-toggle" />
              <Badge variant="outline" className="bg-green-50 text-green-600 border-green-200 dark:bg-green-950 dark:text-green-400 dark:border-green-800">
                <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse" />
                Active
              </Badge>
              {schoolData.tier && <Badge variant="outline" className="hidden md:flex font-semibold">{schoolData.tier}</Badge>}
            </div>
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="sm" className="gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => setHelpChatOpen(true)} data-testid="button-need-help">
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">Need Help</span>
              </Button>
              <NotificationBell 
                hasNewNotifications={hasNewNotifications} 
                notificationCount={3}
                onClick={() => setActiveTab("announcements")}
              />
              <Button variant="ghost" size="icon" onClick={() => setLocation("/")} data-testid="button-homepage">
                <Home className="w-4 h-4" />
              </Button>
              <div className="flex items-center gap-2 pl-3 border-l">
                <div className="text-right">
                  <p className="text-sm font-semibold">{schoolData.name}</p>
                  <p className="text-xs text-muted-foreground">School Account</p>
                </div>
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow-md">
                  <Building2 className="w-5 h-5 text-white" />
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-3 sm:p-6 pb-20 md:pb-6 bg-muted/30 scroll-optimized">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>

      <BottomNavigation
        tabs={schoolNavigationTabs}
        activeTab={getMobileActiveTab()}
        onTabChange={handleMobileTabChange}
      />

      <StudentPerformanceDialog
        open={performanceDialogOpen}
        onOpenChange={setPerformanceDialogOpen}
        student={selectedStudent}
      />

      <HelpGuideFAB role="school" />
      <HelpChatPanel isOpen={helpChatOpen} onClose={() => setHelpChatOpen(false)} profileType="school" userName={schoolData.name} />
    </>
  );
}