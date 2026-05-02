import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useLocation, Link } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  SidebarHeader, SidebarFooter
} from "@/components/ui/sidebar";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { NotificationBell } from "@/components/NotificationBell";
import { 
  Bell, Users, CreditCard, Award, Calendar, User, LogOut, Home,
  Clock, FileText, ChevronRight, Trophy, GraduationCap, Info,
  UserPlus, BarChart3, BookOpen, Settings, Search, Eye, Download,
  Sparkles, Target, TrendingUp, Heart, HelpCircle
} from "lucide-react";
import HelpChatPanel from "@/components/HelpChatPanel";
import { useCustomAuth, getStoredUser } from "@/hooks/use-custom-auth";
import { useAnnouncements, useCalendarEvents, useManagedStudents, usePayments, useCertificatesByManager, useProfile, useUpdateProfile } from "@/hooks/use-dashboard-data";
import { HelpGuideFAB } from "@/components/HelpGuideButton";
import { format } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { StudentPerformanceDialog } from "@/components/StudentPerformanceDialog";

type DashboardTab = "announcements" | "students" | "register-student" | "payments" | "results" | "certificates" | "calendar" | "profile";

const menuItems = [
  { id: "announcements" as DashboardTab, title: "Dashboard", icon: Bell },
  { id: "students" as DashboardTab, title: "My Students", icon: Users },
  { id: "register-student" as DashboardTab, title: "Register Student", icon: UserPlus },
  { id: "payments" as DashboardTab, title: "Payments", icon: CreditCard },
  { id: "results" as DashboardTab, title: "Student Results", icon: BarChart3 },
  { id: "certificates" as DashboardTab, title: "Certificates", icon: Trophy },
  { id: "calendar" as DashboardTab, title: "Olympiad Calendar", icon: Calendar },
  { id: "profile" as DashboardTab, title: "My Profile", icon: User },
];


export default function SupervisorDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<DashboardTab>("announcements");
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
    if (!authLoading && (!storedUser || storedUser.userType !== "supervisor")) {
      setLocation("/login");
    }
  }, [authLoading, storedUser, setLocation]);
  
  // Fetch real data from backend
  const userId = storedUser?.id || 0;
  const { data: announcements = [], isLoading: announcementsLoading } = useAnnouncements("supervisor");
  const { data: calendarEvents = [], isLoading: eventsLoading } = useCalendarEvents("supervisor");
  const { data: managedStudents = [], isLoading: studentsLoading } = useManagedStudents(userId, "supervisor");
  const { data: payments = [], isLoading: paymentsLoading } = usePayments(userId, "supervisor");
  const { data: certificates = [], isLoading: certsLoading } = useCertificatesByManager(userId, "supervisor");
  const { data: profile, isLoading: profileLoading } = useProfile(userId, "supervisor");
  const updateProfileMutation = useUpdateProfile();
  const { toast } = useToast();
  
  // Profile edit state
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
  });
  
  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      setEditForm({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        phone: profile.phone || "",
      });
    }
  }, [profile]);
  
  const handleUpdateProfile = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        userId,
        userType: "supervisor",
        updates: editForm
      });
      toast({ title: "Profile Updated", description: "Your profile has been updated successfully." });
      setIsEditDialogOpen(false);
    } catch (error) {
      toast({ title: "Update Failed", description: "Failed to update profile. Please try again.", variant: "destructive" });
    }
  };

  const supervisorData = {
    firstName: profile?.firstName || storedUser?.firstName || "Supervisor",
    lastName: profile?.lastName || storedUser?.lastName || "",
    email: profile?.email || storedUser?.email || "",
    phone: profile?.phone || storedUser?.phone || "",
    schoolName: profile?.schoolName || storedUser?.schoolName || "",
    branch: profile?.branch || storedUser?.branch || "",
    supervisorId: profile?.supervisorId || `SUP2026${String(storedUser?.id || 0).padStart(3, '0')}`
  };

  const stats = {
    totalStudents: managedStudents.length,
    totalExams: 6,
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

  const renderAnnouncementsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      {/* Promotional Banner */}
      <Card className="border-0 bg-gradient-to-r from-indigo-600 to-purple-600 text-white overflow-hidden">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5" />
            </div>
            <p className="font-medium">6th STEM Olympiad 2026 - Register Your Students Now!</p>
          </div>
          <Button variant="ghost" size="sm" className="text-white hover:bg-white/20">
            Learn More <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </CardContent>
      </Card>

      {/* Security Alert */}
      <Card className="border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/30">
        <CardContent className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Info className="w-5 h-5 text-blue-600" />
            </div>
            <div>
              <p className="font-semibold text-blue-800 dark:text-blue-200">Track Your Students</p>
              <p className="text-sm text-blue-600 dark:text-blue-400">Monitor their progress and exam performance in real-time</p>
            </div>
          </div>
          <Button size="sm" className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setActiveTab("students")}>
            View Students
          </Button>
        </CardContent>
      </Card>

      {/* Welcome Section */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-black">Welcome back, {supervisorData.firstName}!</h2>
          <p className="text-muted-foreground">Manage your students and track their olympiad journey</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="font-medium">Supervisor ID: {supervisorData.supervisorId}</Badge>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Button className="bg-green-500 hover:bg-green-600 text-white" onClick={() => setActiveTab("students")} data-testid="button-quick-students">
          <Users className="w-4 h-4 mr-2" /> My Students
        </Button>
        <Button className="bg-orange-500 hover:bg-orange-600 text-white" onClick={() => setActiveTab("register-student")} data-testid="button-quick-register">
          <UserPlus className="w-4 h-4 mr-2" /> Register Student
        </Button>
        <Button className="bg-purple-500 hover:bg-purple-600 text-white" onClick={() => setActiveTab("payments")} data-testid="button-quick-payments">
          <CreditCard className="w-4 h-4 mr-2" /> Payments
        </Button>
        <Button className="bg-pink-500 hover:bg-pink-600 text-white" onClick={() => setActiveTab("results")} data-testid="button-quick-results">
          <Award className="w-4 h-4 mr-2" /> View Results
        </Button>
        <Button className="bg-blue-500 hover:bg-blue-600 text-white" onClick={() => setActiveTab("certificates")} data-testid="button-quick-certificates">
          <Trophy className="w-4 h-4 mr-2" /> Certificates
        </Button>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">My Students</p>
            <p className="text-3xl font-black text-indigo-600">{stats.totalStudents}</p>
            <p className="text-xs text-muted-foreground mt-1">Registered</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Total Exams</p>
            <p className="text-3xl font-black text-blue-600">{stats.totalExams}</p>
            <p className="text-xs text-muted-foreground mt-1">Available</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Average Score</p>
            <p className="text-3xl font-black text-green-600">{stats.avgScore}%</p>
            <p className="text-xs text-muted-foreground mt-1">Student performance</p>
          </CardContent>
        </Card>

        <Card className="border shadow-sm">
          <CardContent className="p-4">
            <p className="text-sm text-muted-foreground mb-1">Certificates</p>
            <p className="text-3xl font-black text-amber-600">{stats.certificates}</p>
            <p className="text-xs text-muted-foreground mt-1">Earned by students</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-lg">Latest Announcements</h2>
      </div>
      
      {announcementsLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-lg">
              <CardContent className="p-5">
                <div className="animate-pulse space-y-2">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-5 bg-muted rounded w-3/4" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : announcements.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-10 text-center">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-4">
              <Bell className="w-8 h-8 text-indigo-600" />
            </div>
            <h3 className="font-bold text-lg mb-1">No Announcements</h3>
            <p className="text-muted-foreground text-sm">There are no announcements at this time.</p>
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
                      <span className="text-xs text-muted-foreground font-medium">{announcement.createdAt ? format(new Date(announcement.createdAt), "yyyy-MM-dd") : ""}</span>
                    </div>
                    <h3 className="font-bold text-base">{announcement.title}</h3>
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
        <Button className="brand-button shadow-lg" onClick={() => setActiveTab("register-student")} data-testid="button-add-student">
          <UserPlus className="w-4 h-4 mr-2" /> Add Student
        </Button>
      </div>

      {studentsLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map(i => (
            <Card key={i} className="border-0 shadow-lg">
              <CardContent className="p-5">
                <div className="flex items-center gap-4 animate-pulse">
                  <div className="w-14 h-14 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-5 bg-muted rounded w-1/3" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : managedStudents.length === 0 ? (
        <Card className="border-0 shadow-lg">
          <CardContent className="p-10 text-center">
            <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center mb-6">
              <Users className="w-10 h-10 text-indigo-600" />
            </div>
            <h3 className="font-bold text-xl mb-2">No Students Registered</h3>
            <p className="text-muted-foreground mb-6">You haven't registered any students yet.</p>
            <Button className="brand-button shadow-lg" onClick={() => setActiveTab("register-student")}>
              <UserPlus className="w-4 h-4 mr-2" /> Register Your First Student
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {managedStudents
            .filter(ms => {
              const name = `${ms.student?.firstName || ""} ${ms.student?.lastName || ""}`.toLowerCase();
              return name.includes(searchQuery.toLowerCase());
            })
            .map((ms, index) => {
              const studentName = `${ms.student?.firstName || ""} ${ms.student?.lastName || ""}`.trim();
              const initials = studentName.split(" ").map(n => n[0] || "").join("");
              const grade = ms.student?.gradeLevel || "";
              const school = ms.student?.schoolName || "";
              return (
                <motion.div
                  key={ms.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all">
                    <CardContent className="p-5">
                      <div className="flex items-center justify-between gap-4 flex-wrap">
                        <div className="flex items-center gap-4">
                          <Avatar className="w-14 h-14 shadow-lg">
                            <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white font-bold">
                              {initials}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-bold text-lg">{studentName}</h3>
                            <p className="text-sm text-muted-foreground">{grade}{school ? ` | ${school}` : ""}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge className="bg-green-500/10 text-green-600 border-0 text-xs">active</Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => {
                              setSelectedStudent({ id: ms.studentId, name: studentName, grade, school });
                              setPerformanceDialogOpen(true);
                            }}
                            data-testid={`button-view-student-${ms.id}`}
                          >
                            <Eye className="w-4 h-4 mr-1" /> Performance
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

  const renderRegisterStudentTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-indigo-500/5 to-purple-500/5">
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-primary" />
            Register New Student
          </CardTitle>
          <CardDescription>Add a new student (your child/ward) to participate in Samikaran Olympiad</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-6">
          <Card className="border border-indigo-200 bg-indigo-50 dark:border-indigo-800 dark:bg-indigo-950/30">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                  <Info className="w-4 h-4 text-indigo-600" />
                </div>
                <div>
                  <p className="font-semibold text-indigo-800 dark:text-indigo-200">Supervisor Registration</p>
                  <p className="text-sm text-indigo-600 dark:text-indigo-400 mt-1">
                    As a supervisor (parent/guardian), you can register your children for Samikaran Olympiad exams. 
                    You'll be able to track their exam participation, view results, and download certificates.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

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
              <Label className="font-semibold">Email</Label>
              <Input type="email" placeholder="student@email.com" className="shadow-sm" data-testid="input-student-email" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">Phone</Label>
              <Input placeholder="+91 XXXXXXXXXX" className="shadow-sm" data-testid="input-student-phone" />
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">School Name *</Label>
              <Input placeholder="Enter school name" className="shadow-sm" data-testid="input-student-school" />
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
              <Label className="font-semibold">Relationship to Student *</Label>
              <Select data-testid="select-student-relationship">
                <SelectTrigger className="shadow-sm" data-testid="select-student-relationship">
                  <SelectValue placeholder="Select relationship" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Father">Father</SelectItem>
                  <SelectItem value="Mother">Mother</SelectItem>
                  <SelectItem value="Guardian">Guardian</SelectItem>
                  <SelectItem value="Sibling">Sibling</SelectItem>
                  <SelectItem value="Other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label className="font-semibold">City *</Label>
              <Input placeholder="Enter city" className="shadow-sm" data-testid="input-student-city" />
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => setActiveTab("students")} data-testid="button-cancel-register">
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

  const renderPaymentsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Tabs defaultValue="pending" className="w-full">
        <TabsList className="grid w-full grid-cols-2 max-w-md bg-muted/50">
          <TabsTrigger value="pending" data-testid="tab-pending-payments">Pending</TabsTrigger>
          <TabsTrigger value="history" data-testid="tab-payment-history">History</TabsTrigger>
        </TabsList>
        
        <TabsContent value="pending" className="mt-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-500/20 flex items-center justify-center mb-6">
                <CreditCard className="w-10 h-10 text-green-600" />
              </div>
              <p className="text-muted-foreground font-medium">No pending payments.</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="history" className="mt-6">
          <Card className="border-0 shadow-lg">
            <CardContent className="p-10 text-center">
              <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-blue-500/20 to-cyan-500/20 flex items-center justify-center mb-6">
                <CreditCard className="w-10 h-10 text-blue-600" />
              </div>
              <p className="text-muted-foreground font-medium">No payment history available.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </motion.div>
  );

  const renderResultsTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <div className="flex items-center gap-2">
        <BarChart3 className="w-5 h-5 text-primary" />
        <h2 className="font-bold text-lg">Student Results</h2>
      </div>

      <Card className="border-0 shadow-lg">
        <CardContent className="p-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 flex items-center justify-center mb-6">
            <BarChart3 className="w-10 h-10 text-purple-600" />
          </div>
          <h3 className="font-bold text-xl mb-2">No Results Available</h3>
          <p className="text-muted-foreground max-w-md mx-auto">Student results will appear here after exams are completed and scored.</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderCertificatesTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-500/5 to-orange-500/5">
        <CardContent className="p-10 text-center">
          <div className="w-20 h-20 mx-auto rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center mb-6 shadow-xl">
            <Trophy className="w-10 h-10 text-white" />
          </div>
          <h3 className="font-bold text-xl mb-2">Student Certificates</h3>
          <p className="text-muted-foreground max-w-md mx-auto">Certificates for your registered students will appear here after exam completion.</p>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderCalendarTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
      <Card className="border-0 shadow-lg">
        <CardHeader>
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-primary" />
            Olympiad Calendar 2026
          </CardTitle>
          <CardDescription>Important dates and exam schedules</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <motion.div 
              className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10"
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex flex-col items-center justify-center text-white shadow-lg">
                <span className="text-xs font-bold">FEB</span>
                <span className="text-lg font-black">15</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold">Mathematics Olympiad</h4>
                <p className="text-sm text-muted-foreground">Online Exam - 10:00 AM IST</p>
              </div>
              <Badge className="bg-indigo-500/10 text-indigo-600 border-0">2 students</Badge>
            </motion.div>
            <motion.div 
              className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-blue-500/10 to-cyan-500/10"
              whileHover={{ x: 5 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex flex-col items-center justify-center text-white shadow-lg">
                <span className="text-xs font-bold">MAR</span>
                <span className="text-lg font-black">01</span>
              </div>
              <div className="flex-1">
                <h4 className="font-bold">Science Challenge</h4>
                <p className="text-sm text-muted-foreground">Online Exam - 2:00 PM IST</p>
              </div>
              <Badge className="bg-blue-500/10 text-blue-600 border-0">1 student</Badge>
            </motion.div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );

  const renderProfileTab = () => (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="pb-4">
          <div className="flex items-center gap-4">
            <Avatar className="w-20 h-20 border-4 border-indigo-200 shadow-xl">
              <AvatarImage src="" />
              <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-2xl font-bold">
                {supervisorData.firstName[0]}{supervisorData.lastName[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-2xl font-black">{supervisorData.firstName} {supervisorData.lastName}</h2>
              <p className="text-muted-foreground font-medium">{supervisorData.supervisorId}</p>
              <Badge className="mt-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white border-0">Supervisor / Parent</Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="p-3 rounded-lg bg-muted/30">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Full Name</Label>
                <p className="font-semibold mt-1">{supervisorData.firstName} {supervisorData.lastName}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Email</Label>
                <p className="font-semibold mt-1">{supervisorData.email}</p>
              </div>
              <div className="p-3 rounded-lg bg-muted/30">
                <Label className="text-muted-foreground text-xs uppercase tracking-wide">Phone</Label>
                <p className="font-semibold mt-1">{supervisorData.phone}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg font-bold">Statistics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
                <p className="text-3xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">{managedStudents.length}</p>
                <p className="text-sm text-muted-foreground font-medium">Students Registered</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10">
                <p className="text-3xl font-black">6</p>
                <p className="text-sm text-muted-foreground font-medium">Total Exams</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-emerald-500/10">
                <p className="text-3xl font-black text-green-600">{stats.avgScore}%</p>
                <p className="text-sm text-muted-foreground font-medium">Avg. Score</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

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
      case "announcements": return renderAnnouncementsTab();
      case "students": return renderStudentsTab();
      case "register-student": return renderRegisterStudentTab();
      case "payments": return renderPaymentsTab();
      case "results": return renderResultsTab();
      case "certificates": return renderCertificatesTab();
      case "calendar": return renderCalendarTab();
      case "profile": return renderProfileTab();
      default: return renderAnnouncementsTab();
    }
  };

  const getTabTitle = () => {
    const item = menuItems.find(m => m.id === activeTab);
    return item?.title || "Dashboard";
  };

  return (
    <>
    <Helmet>
      <title>Supervisor Dashboard | Samikaran Olympiad</title>
      <meta name="robots" content="noindex, nofollow" />
    </Helmet>
    <SidebarProvider style={sidebarStyle}>
      <div className="flex h-screen w-full">
        <Sidebar className="border-r bg-gradient-to-b from-slate-50 to-indigo-50/50 dark:from-slate-900 dark:to-indigo-950/30">
          <SidebarHeader className="p-4 border-b border-indigo-200/50 dark:border-indigo-800/30">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 flex items-center justify-center">
                <svg viewBox="0 0 100 100" width="40" height="40" className="drop-shadow-lg">
                  <defs>
                    <linearGradient id="supervisorLogoUp" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9333EA" />
                      <stop offset="50%" stopColor="#C026D3" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id="supervisorLogoDown" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#F472B6" />
                    </linearGradient>
                  </defs>
                  <polygon points="50,12 85,72 15,72" fill="rgba(0,0,0,0.12)" transform="translate(2, 4)" />
                  <polygon points="50,88 15,28 85,28" fill="rgba(0,0,0,0.1)" transform="translate(2, 4)" />
                  <polygon points="50,10 88,75 12,75" fill="url(#supervisorLogoUp)" />
                  <polygon points="50,10 69,42.5 31,42.5" fill="rgba(255,255,255,0.18)" />
                  <polygon points="50,90 12,25 88,25" fill="url(#supervisorLogoDown)" opacity="0.88" />
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

          <SidebarFooter className="p-4 border-t border-indigo-200/50 dark:border-indigo-800/30 bg-indigo-50/50 dark:bg-indigo-950/20">
            <div className="flex items-center gap-3 mb-3 p-2 rounded-lg bg-gradient-to-r from-indigo-100 to-purple-100 dark:from-indigo-900/50 dark:to-purple-900/50">
              <Avatar className="w-9 h-9">
                <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-bold">
                  {supervisorData.firstName[0]}{supervisorData.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold truncate">{supervisorData.firstName} {supervisorData.lastName}</p>
                <p className="text-xs text-muted-foreground truncate">Supervisor Account</p>
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
                  <p className="text-sm font-semibold">{supervisorData.firstName} {supervisorData.lastName}</p>
                  <p className="text-xs text-muted-foreground">Supervisor Account</p>
                </div>
                <Avatar className="w-9 h-9">
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-500 text-white text-sm font-bold">
                    {supervisorData.firstName[0]}{supervisorData.lastName[0]}
                  </AvatarFallback>
                </Avatar>
              </div>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto p-6 bg-muted/30 scroll-optimized">
            <AnimatePresence mode="wait">
              {renderContent()}
            </AnimatePresence>
          </main>
        </div>
      </div>
    </SidebarProvider>

      <StudentPerformanceDialog
        open={performanceDialogOpen}
        onOpenChange={setPerformanceDialogOpen}
        student={selectedStudent}
      />
      <HelpGuideFAB role="supervisor" />
      <HelpChatPanel isOpen={helpChatOpen} onClose={() => setHelpChatOpen(false)} profileType="supervisor" userName={`${supervisorData.firstName} ${supervisorData.lastName}`} />
    </>
  );
}