import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useLocation, Link, useRoute } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter
} from "@/components/ui/sidebar";
import { BottomNavigation } from "@/components/mobile/BottomNavigation";
import { groupNavigationTabs } from "@/config/mobile-navigation";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { GlassCard, StatCard, SectionHeader, SkeletonCard, EmptyState } from "@/components/ui/glass-card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { NotificationBell } from "@/components/NotificationBell";
import { HelpGuideFAB } from "@/components/HelpGuideButton";
import { 
  Bell, Users, CreditCard, Award, Calendar, User, LogOut, Home,
  Clock, FileText, ChevronRight, Trophy, GraduationCap, Info,
  UserPlus, BarChart3, Settings, Search, Eye, Download, Upload,
  Sparkles, Target, TrendingUp, FileSpreadsheet, BookOpen, HelpCircle
} from "lucide-react";
import HelpChatPanel from "@/components/HelpChatPanel";
import { useCustomAuth, getStoredUser } from "@/hooks/use-custom-auth";
import { useAnnouncements, useCalendarEvents, useManagedStudents, usePayments, useCertificatesByManager, useProfile, useUpdateProfile, useManagerExamRegistrations } from "@/hooks/use-dashboard-data";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { StudentPerformanceDialog } from "@/components/StudentPerformanceDialog";

type DashboardTab = "overview" | "announcements" | "students" | "add-student" | "bulk-upload" | "results" | "certificates" | "calendar" | "profile";

const menuItems = [
  { id: "overview" as DashboardTab, title: "Dashboard", icon: TrendingUp },
  { id: "announcements" as DashboardTab, title: "Announcements", icon: Bell },
  { id: "students" as DashboardTab, title: "My Students", icon: Users },
  { id: "add-student" as DashboardTab, title: "Add Student", icon: UserPlus },
  { id: "bulk-upload" as DashboardTab, title: "Bulk Upload", icon: Upload },
  { id: "results" as DashboardTab, title: "Student Results", icon: BarChart3 },
  { id: "certificates" as DashboardTab, title: "Certificates", icon: Trophy },
  { id: "calendar" as DashboardTab, title: "Olympiad Calendar", icon: Calendar },
  { id: "profile" as DashboardTab, title: "My Profile", icon: User },
];


export default function GroupDashboard() {
  const [, setLocation] = useLocation();
  const [, routeParams] = useRoute("/group/:tab");
  const tabFromUrl = (routeParams?.tab || "overview") as DashboardTab;
  const validGroupTabs: DashboardTab[] = ["overview", "announcements", "students", "add-student", "bulk-upload", "results", "certificates", "calendar", "profile"];
  const [activeTab, setActiveTabState] = useState<DashboardTab>(validGroupTabs.includes(tabFromUrl) ? tabFromUrl : "overview");

  const setActiveTab = (tab: DashboardTab) => {
    setActiveTabState(tab);
    setLocation(tab === "overview" ? "/group" : `/group/${tab}`, { replace: tab === activeTab });
  };

  useEffect(() => {
    if (validGroupTabs.includes(tabFromUrl)) {
      if (tabFromUrl !== activeTab) setActiveTabState(tabFromUrl);
    } else if (tabFromUrl !== "overview") {
      setActiveTabState("overview");
      setLocation("/group", { replace: true });
    }
  }, [tabFromUrl]);
  const [searchQuery, setSearchQuery] = useState("");
  const [hasNewNotifications] = useState(true);
  const [helpChatOpen, setHelpChatOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<{id: number; name: string; grade?: string; school?: string} | null>(null);
  const [performanceDialogOpen, setPerformanceDialogOpen] = useState(false);
  const { logout, isLoading: authLoading } = useCustomAuth();
  
  // Get stored user from localStorage
  const storedUser = getStoredUser();
  
  // Redirect if not authenticated or wrong user type
  useEffect(() => {
    if (!authLoading && (!storedUser || storedUser.userType !== "group")) {
      setLocation("/login");
    }
  }, [authLoading, storedUser, setLocation]);
  
  // Fetch real data from backend
  const userId = storedUser?.id || 0;
  const { data: announcements = [], isLoading: announcementsLoading } = useAnnouncements("group");
  const { data: calendarEvents = [], isLoading: eventsLoading } = useCalendarEvents("group");
  const { data: managedStudents = [], isLoading: studentsLoading } = useManagedStudents(userId, "group");
  const { data: payments = [], isLoading: paymentsLoading } = usePayments(userId, "group");
  const { data: certificates = [], isLoading: certsLoading } = useCertificatesByManager(userId, "group");
  const { data: profile, isLoading: profileLoading } = useProfile(userId, "group");
  const { data: examRegistrations = [], isLoading: examRegLoading } = useManagerExamRegistrations(userId, "group");
  const updateProfileMutation = useUpdateProfile();
  const { toast } = useToast();
  
  // Fetch available olympiads
  const { data: availableOlympiads = [], isLoading: olympiadsLoading } = useQuery<any[]>({
    queryKey: ["/api/public/olympiads"],
    queryFn: async () => {
      const res = await fetch("/api/public/olympiads");
      if (!res.ok) throw new Error("Failed to fetch olympiads");
      return res.json();
    },
  });
  
  // Profile edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    department: "",
  });
  
  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
        department: profile.department || "",
      });
    }
  }, [profile]);
  
  const handleUpdateProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        userId,
        userType: "group",
        updates: editForm
      });
      toast({ title: "Profile Updated", description: "Your profile has been updated successfully." });
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({ title: "Update Failed", description: "Failed to update profile. Please try again.", variant: "destructive" });
    }
  };

  const groupData = {
    firstName: profile?.firstName || storedUser?.firstName || "Group Admin",
    lastName: profile?.lastName || storedUser?.lastName || "",
    email: profile?.email || storedUser?.email || "",
    phone: profile?.phone || storedUser?.phone || "",
    schoolName: profile?.schoolName || storedUser?.schoolName || "",
    department: profile?.department || "",
    groupId: profile?.groupId || "",
    assignedGrades: profile?.assignedGrades || ""
  };

  const stats = {
    totalStudents: managedStudents.length,
    totalExams: examRegistrations.length,
    avgScore: certificates.length > 0 
      ? Math.round(certificates.reduce((sum, c) => sum + (c.score || 0), 0) / certificates.length) 
      : 0,
    certificates: certificates.length
  };

  const sidebarStyle: Record<string, string> = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3.5rem",
  };

  const handleLogout = () => {
    logout();
  };

  const renderOverviewTab = () => {
    // Get the first upcoming olympiad or announcement for the banner
    const upcomingOlympiad = availableOlympiads.find(o => {
      const startDate = o.startTime ? new Date(o.startTime) : null;
      return startDate && startDate > new Date();
    });
    
    const bannerId = announcements.find(a => a.important)?.id || upcomingOlympiad?.id;
    const showBanner = !!announcements.find(a => a.important) || (availableOlympiads.length > 0);
    
    return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Dynamic Announcement/Olympiad Banner or Empty State */}
      {showBanner ? (
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-purple-600 via-violet-600 to-pink-600 p-[1px] animate-fade-in">
          <div className="relative flex items-center justify-between gap-4 rounded-2xl bg-gradient-to-r from-purple-600/95 via-violet-600/95 to-pink-600/95 backdrop-blur-xl px-5 py-4">
            <div className="flex items-center gap-4 flex-1 min-w-0">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg flex-shrink-0">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-white text-lg truncate">
                  {announcements.find(a => a.important)?.title || upcomingOlympiad?.title || "New Event"}
                </p>
                <p className="text-white/80 text-sm truncate">
                  {announcements.find(a => a.important)?.content || upcomingOlympiad?.subject || "Check for updates"}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="text-white border border-white/30 backdrop-blur-sm shrink-0" onClick={() => setActiveTab(announcements.find(a => a.important) ? "announcements" : "calendar")} data-testid="button-learn-more-banner">
              View <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      ) : null}

      {/* Info Alert */}
      <Card className="border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center">
              <Info className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <p className="font-semibold text-purple-800 dark:text-purple-200">Managing {groupData.assignedGrades}</p>
              <p className="text-sm text-purple-600 dark:text-purple-400">{groupData.department} Department - {groupData.schoolName}</p>
            </div>
          </div>
          <Button size="sm" className="bg-purple-500 text-white" onClick={() => setActiveTab("students")} data-testid="button-view-students-alert">
            View Students
          </Button>
        </CardContent>
      </Card>

      {/* Welcome Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black">Welcome back, {groupData.firstName}!</h2>
          <p className="text-muted-foreground">Manage your assigned students and track their olympiad journey</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-medium">Group ID: {groupData.groupId}</Badge>
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
          <span className="truncate">My Students</span>
        </Button>
        <Button 
          size="sm"
          className="bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-md text-xs sm:text-sm" 
          onClick={() => setActiveTab("add-student")} 
          data-testid="button-quick-add"
        >
          <UserPlus className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="truncate">Add Student</span>
        </Button>
        <Button 
          size="sm"
          className="bg-gradient-to-r from-violet-500 to-purple-500 text-white shadow-md text-xs sm:text-sm" 
          onClick={() => setActiveTab("bulk-upload")} 
          data-testid="button-quick-bulk"
        >
          <Upload className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="truncate">Bulk Upload</span>
        </Button>
        <Button 
          size="sm"
          className="bg-gradient-to-r from-pink-500 to-rose-500 text-white shadow-md text-xs sm:text-sm" 
          onClick={() => setActiveTab("results")} 
          data-testid="button-quick-results"
        >
          <Award className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="truncate">View Results</span>
        </Button>
        <Button 
          size="sm"
          className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-md text-xs sm:text-sm col-span-2 sm:col-span-1" 
          onClick={() => setActiveTab("certificates")} 
          data-testid="button-quick-certificates"
        >
          <Trophy className="w-4 h-4 mr-1.5 sm:mr-2 flex-shrink-0" />
          <span className="truncate">Certificates</span>
        </Button>
      </div>

      {/* Stats Grid - Premium Glass Cards */}
      <div className="grid gap-4 sm:gap-5 grid-cols-2 md:grid-cols-4">
        <StatCard
          title="My Students"
          value={stats.totalStudents}
          subtitle="Assigned to you"
          icon={<Users className="w-5 h-5" />}
          iconGradient="purple"
          delay={1}
        />
        <StatCard
          title="Total Exams"
          value={stats.totalExams}
          subtitle="Registered"
          icon={<GraduationCap className="w-5 h-5" />}
          iconGradient="blue"
          delay={2}
        />
        <StatCard
          title="Average Score"
          value={`${stats.avgScore}%`}
          subtitle="Student performance"
          icon={<Target className="w-5 h-5" />}
          iconGradient="green"
          delay={3}
        />
        <StatCard
          title="Certificates"
          value={stats.certificates}
          subtitle="Earned by students"
          icon={<Trophy className="w-5 h-5" />}
          iconGradient="amber"
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
    </motion.div>
    );
  };

  const renderAnnouncementsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-lg">Latest Announcements</h2>
      </div>
      
      {announcementsLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-lg animate-pulse">
              <CardContent className="p-5">
                <div className="h-4 bg-muted rounded w-1/4 mb-3"></div>
                <div className="h-5 bg-muted rounded w-3/4"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="font-semibold text-lg mb-1">No Announcements</p>
            <p className="text-muted-foreground text-sm">There are no announcements at this time. Check back later.</p>
          </CardContent>
        </Card>
      ) : (
        announcements.map((announcement, index) => (
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
                      <span className="text-xs text-muted-foreground font-medium">
                        {announcement.createdAt ? format(new Date(announcement.createdAt), "MMM dd, yyyy") : ""}
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

  const renderStudentsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search students..." 
            className="pl-10 bg-background shadow-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            data-testid="input-search-students"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" className="shadow-sm" disabled data-testid="button-export-students">
            <Download className="w-4 h-4 mr-2" /> Export
          </Button>
          <Button className="bg-green-500 text-white shadow-lg" onClick={() => setActiveTab("add-student")} data-testid="button-add-student">
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
            <CardTitle className="text-lg font-bold">Students in {groupData.assignedGrades}</CardTitle>
            <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white border-0">{managedStudents.length} students</Badge>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {studentsLoading ? (
            <div className="divide-y">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-muted"></div>
                    <div>
                      <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-24"></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="h-6 bg-muted rounded w-16"></div>
                    <div className="h-6 bg-muted rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : managedStudents.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold text-lg mb-1">No Students Yet</p>
              <p className="text-muted-foreground text-sm mb-4">You haven't added any students yet. Add students to get started.</p>
              <Button className="bg-green-500 text-white" onClick={() => setActiveTab("add-student")} data-testid="button-add-first-student">
                <UserPlus className="w-4 h-4 mr-2" /> Add Your First Student
              </Button>
            </div>
          ) : (
            <div className="divide-y">
              {managedStudents.filter(s => {
                const studentName = `${s.student?.firstName || ""} ${s.student?.lastName || ""}`.toLowerCase();
                return studentName.includes(searchQuery.toLowerCase());
              }).map((ms) => {
                const student = ms.student;
                const studentName = `${student?.firstName || ""} ${student?.lastName || ""}`.trim();
                const initials = studentName.split(" ").map(n => n[0] || "").join("").toUpperCase();
                return (
                  <div key={ms.id} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold">
                          {initials || "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{studentName || "Unknown Student"}</p>
                        <p className="text-sm text-muted-foreground">
                          {student?.gradeLevel ? `Class ${student.gradeLevel}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge className={student?.profileStatus === "approved" ? "bg-green-500/10 text-green-600 border-0" : "bg-amber-500/10 text-amber-600 border-0"}>
                        {student?.profileStatus || "pending"}
                      </Badge>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setSelectedStudent({ id: student?.id || ms.studentId, name: studentName, grade: student?.gradeLevel ? `Class ${student.gradeLevel}` : undefined });
                          setPerformanceDialogOpen(true);
                        }}
                        data-testid={`button-view-student-${ms.id}`}
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

  const renderAddStudentTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-500/5 to-pink-500/5">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Add New Student
          </CardTitle>
          <CardDescription>Register a student for Samikaran Olympiad (assigned to {groupData.assignedGrades})</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="font-semibold">First Name *</Label>
              <Input placeholder="Enter first name" className="shadow-sm" data-testid="input-student-firstname" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Last Name *</Label>
              <Input placeholder="Enter last name" className="shadow-sm" data-testid="input-student-lastname" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Date of Birth *</Label>
              <Input type="date" className="shadow-sm" data-testid="input-student-dob" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Gender *</Label>
              <Select data-testid="select-student-gender">
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
              <Input type="email" placeholder="student@email.com" className="shadow-sm" data-testid="input-student-email" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Phone Number</Label>
              <Input placeholder="+91 XXXXXXXXXX" className="shadow-sm" data-testid="input-student-phone" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Grade Level *</Label>
              <Select data-testid="select-student-grade">
                <SelectTrigger className="shadow-sm" data-testid="select-student-grade">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 12 }, (_, i) => (
                    <SelectItem key={i + 1} value={`Grade ${i + 1}`}>Grade {i + 1}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Section / Division *</Label>
              <Select data-testid="select-student-section">
                <SelectTrigger className="shadow-sm" data-testid="select-student-section">
                  <SelectValue placeholder="Select section" />
                </SelectTrigger>
                <SelectContent>
                  {["A", "B", "C", "D", "E", "F", "G", "H"].map(s => (
                    <SelectItem key={s} value={s}>Section {s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Parent/Guardian Name *</Label>
              <Input placeholder="Enter parent name" className="shadow-sm" data-testid="input-student-parent" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Parent Phone *</Label>
              <Input placeholder="+91 XXXXXXXXXX" className="shadow-sm" data-testid="input-student-parent-phone" />
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setActiveTab("students")} data-testid="button-cancel-student">
              Cancel
            </Button>
            <Button className="brand-button shadow-lg" onClick={() => { toast({ title: "Student Registered", description: "New student has been registered successfully." }); setActiveTab("students"); }} data-testid="button-submit-student">
              <UserPlus className="w-4 h-4 mr-2" /> Register Student
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderBulkUploadTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-purple-500/5 to-pink-500/5">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Upload className="w-5 h-5 text-primary" />
            Bulk Student Registration
          </CardTitle>
          <CardDescription>Upload multiple students at once using our Excel template (for {groupData.assignedGrades})</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <motion.div 
            className="border-2 border-dashed border-primary/30 rounded-xl p-10 text-center bg-gradient-to-br from-purple-500/5 to-pink-500/5"
            whileHover={{ scale: 1.01 }}
            transition={{ type: "spring", stiffness: 300 }}
          >
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-xl">
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
              <li>Students must be in {groupData.assignedGrades}</li>
              <li>Upload the file and review before confirming</li>
              <li>Maximum 100 students per upload</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderResultsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            Student Results
          </CardTitle>
        </CardHeader>
        <CardContent className="p-8 text-center">
          <BarChart3 className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
          <p className="font-semibold text-lg mb-1">No Results Available</p>
          <p className="text-muted-foreground text-sm">Student results will appear here once olympiad exams are completed and graded.</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderCertificatesTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Trophy className="w-5 h-5 text-primary" />
            Student Certificates
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {certsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="border shadow-sm animate-pulse">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-muted"></div>
                    <div className="flex-1">
                      <div className="h-4 bg-muted rounded w-32 mb-2"></div>
                      <div className="h-3 bg-muted rounded w-48"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : certificates.length === 0 ? (
            <div className="p-8 text-center">
              <Trophy className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold text-lg mb-1">No Certificates Yet</p>
              <p className="text-muted-foreground text-sm">Certificates will appear here once students complete olympiad exams and earn them.</p>
            </div>
          ) : (
            certificates.map((cert) => {
              const studentName = cert.student ? `${cert.student.firstName || ""} ${cert.student.lastName || ""}`.trim() : "Student";
              const examTitle = cert.exam?.title || "Olympiad Exam";
              return (
                <Card key={cert.id} className="border shadow-sm">
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg">
                        <Trophy className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold">{studentName}</p>
                        <p className="text-sm text-muted-foreground">{examTitle}</p>
                        <Badge className="mt-1 bg-amber-500/10 text-amber-600 border-0">{cert.type || "Participation"}</Badge>
                      </div>
                    </div>
                    {cert.certificateUrl ? (
                      <a href={cert.certificateUrl} target="_blank" rel="noopener noreferrer">
                        <Button variant="outline" size="sm" data-testid={`button-download-cert-${cert.id}`}>
                          <Download className="w-4 h-4 mr-2" /> Download
                        </Button>
                      </a>
                    ) : (
                      <Button variant="outline" size="sm" disabled data-testid={`button-download-cert-${cert.id}`}>
                        <Download className="w-4 h-4 mr-2" /> Pending
                      </Button>
                    )}
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderCalendarTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Upcoming Events
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {eventsLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 animate-pulse">
                  <div className="w-12 h-12 rounded-xl bg-muted"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-muted rounded w-40 mb-2"></div>
                    <div className="h-5 bg-muted rounded w-16"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : calendarEvents.length === 0 ? (
            <div className="p-8 text-center">
              <Calendar className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="font-semibold text-lg mb-1">No Upcoming Events</p>
              <p className="text-muted-foreground text-sm">There are no scheduled events at this time. Check back later.</p>
            </div>
          ) : (
            calendarEvents.map((event) => {
              const eventDate = event.eventDate ? new Date(event.eventDate) : null;
              return (
                <div key={event.id} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex flex-col items-center justify-center text-white">
                    {eventDate ? (
                      <>
                        <span className="text-xs font-bold">{format(eventDate, "MMM")}</span>
                        <span className="text-sm font-black">{format(eventDate, "dd")}</span>
                      </>
                    ) : (
                      <Calendar className="w-5 h-5" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold">{event.title}</p>
                    <Badge variant="secondary" className="mt-1">{event.eventType || "Event"}</Badge>
                  </div>
                </div>
              );
            })
          )}
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderProfileTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold">Group Profile</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Name</Label>
              <p className="font-semibold mt-1">{groupData.firstName} {groupData.lastName}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Group ID</Label>
              <p className="font-semibold mt-1">{groupData.groupId}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Email</Label>
              <p className="font-semibold mt-1">{groupData.email}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Phone</Label>
              <p className="font-semibold mt-1">{groupData.phone}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">School</Label>
              <p className="font-semibold mt-1">{groupData.schoolName}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Department</Label>
              <p className="font-semibold mt-1">{groupData.department}</p>
            </div>
            <div className="p-3 rounded-lg bg-muted/30 md:col-span-2">
              <Label className="text-muted-foreground text-xs uppercase tracking-wide">Assigned Grades</Label>
              <p className="font-semibold mt-1">{groupData.assignedGrades}</p>
            </div>
          </div>
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
                <Label htmlFor="department">Department</Label>
                <Input 
                  id="department" 
                  value={editForm.department}
                  onChange={(e) => setEditForm(prev => ({ ...prev, department: e.target.value }))}
                  data-testid="input-department"
                />
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
      case "students": return renderStudentsTab();
      case "add-student": return renderAddStudentTab();
      case "bulk-upload": return renderBulkUploadTab();
      case "results": return renderResultsTab();
      case "certificates": return renderCertificatesTab();
      case "calendar": return renderCalendarTab();
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
      "schools": "students",
      "olympiads": "calendar",
      "reports": "results",
      "settings": "profile"
    };
    setActiveTab(tabMapping[tabId] || "overview");
  };

  const getMobileActiveTab = (): string => {
    const reverseMapping: Record<DashboardTab, string> = {
      "overview": "home",
      "announcements": "home",
      "students": "schools",
      "add-student": "schools",
      "bulk-upload": "schools",
      "results": "reports",
      "certificates": "reports",
      "calendar": "olympiads",
      "profile": "settings"
    };
    return reverseMapping[activeTab] || "home";
  };

  return (
    <>
    <Helmet>
      <title>Group Dashboard | Samikaran Olympiad</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r bg-gradient-to-b from-slate-50 to-purple-50/50 dark:from-slate-900 dark:to-purple-950/30">
          <SidebarHeader className="p-4 border-b border-purple-200/50 dark:border-purple-800/30">
            <Link href="/" className="flex items-center gap-2" data-testid="link-home-logo">
              <div className="w-10 h-10 flex items-center justify-center">
                <svg viewBox="0 0 100 100" width="40" height="40" className="drop-shadow-lg">
                  <defs>
                    <linearGradient id="groupLogoUp" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9333EA" />
                      <stop offset="50%" stopColor="#C026D3" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id="groupLogoDown" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#F472B6" />
                    </linearGradient>
                  </defs>
                  <polygon points="50,12 85,72 15,72" fill="rgba(0,0,0,0.12)" transform="translate(2, 4)" />
                  <polygon points="50,88 15,28 85,28" fill="rgba(0,0,0,0.1)" transform="translate(2, 4)" />
                  <polygon points="50,10 88,75 12,75" fill="url(#groupLogoUp)" />
                  <polygon points="50,10 69,42.5 31,42.5" fill="rgba(255,255,255,0.18)" />
                  <polygon points="50,90 12,25 88,25" fill="url(#groupLogoDown)" opacity="0.88" />
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

          <SidebarFooter className="p-4 border-t border-purple-200/50 dark:border-purple-800/30 bg-purple-50/50 dark:bg-purple-950/20">
            <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-gradient-to-r from-purple-100 to-pink-100 dark:from-purple-900/50 dark:to-pink-900/50">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-sm font-bold">
                  {groupData.firstName.split(" ").map((n: string) => n[0]).join("")}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{groupData.firstName}</p>
                <p className="text-xs text-muted-foreground truncate">Group</p>
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
              <div className="flex items-center gap-2">
                <Badge className="bg-green-500/10 text-green-600 border-0 flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Active
                </Badge>
                <Badge variant="outline" className="font-medium">{groupData.department}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" className="gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => setHelpChatOpen(true)} data-testid="button-need-help">
                <HelpCircle className="w-4 h-4" />
                <span className="hidden sm:inline text-xs font-medium">Need Help</span>
              </Button>
              <NotificationBell hasNewNotifications={hasNewNotifications} />
              <div className="flex items-center gap-2 pl-4 border-l">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xs font-bold">
                    {groupData.firstName.split(" ").map((n: string) => n[0]).join("")}
                  </AvatarFallback>
                </Avatar>
                <div className="hidden sm:block">
                  <p className="text-sm font-semibold">{groupData.firstName}</p>
                  <p className="text-xs text-muted-foreground">Group</p>
                </div>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-auto p-3 sm:p-6 pb-20 md:pb-6 bg-muted/30 scroll-optimized">
            {renderContent()}
          </main>
        </div>
      </div>
    </SidebarProvider>

      <BottomNavigation
        tabs={groupNavigationTabs}
        activeTab={getMobileActiveTab()}
        onTabChange={handleMobileTabChange}
      />

      <StudentPerformanceDialog
        open={performanceDialogOpen}
        onOpenChange={setPerformanceDialogOpen}
        student={selectedStudent}
      />

      <HelpGuideFAB role="group" />
      <HelpChatPanel isOpen={helpChatOpen} onClose={() => setHelpChatOpen(false)} profileType="group" userName={groupData.firstName} />
    </>
  );
}
