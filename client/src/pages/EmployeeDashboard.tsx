import { Helmet } from "react-helmet-async";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useLocation } from "wouter";
import { useQuery } from "@tanstack/react-query";
import {
  Activity, Users, BookOpen, IndianRupee, Megaphone, Settings, LogOut,
  BarChart3, GraduationCap, Shield, Award, Globe, Mail, Zap, Layout, FileText,
  ImageIcon, Server, TrendingUp, Handshake, ChevronDown, ChevronUp, Menu,
  Eye, MousePointer, Share2, Heart, MessageCircle, Calendar, Plus, HelpCircle
} from "lucide-react";
import HelpChatPanel from "@/components/HelpChatPanel";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { HelpGuideFAB } from "@/components/HelpGuideButton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

import { GlobalSettings } from "@/components/GlobalSettings";
import { ContentCMSTab } from "@/components/admin/ContentCMSTab";
import { BlogAdminTab } from "@/components/admin/BlogAdminTab";
import { MediaLibraryTab } from "@/components/admin/MediaLibraryTab";
import { PaymentsManagementTab } from "@/components/admin/PaymentsManagementTab";
import { PartnerManagementTab } from "@/components/admin/PartnerManagementTab";
import EmailMarketingTab from "@/components/admin/EmailMarketingTab";
import ChatbotTab from "@/components/admin/ChatbotTab";
import ResultManagementTab from "@/components/admin/ResultManagementTab";

type EmployeeTab = "analytics" | "exams" | "results" | "proctoring" | "finance" | "partners" | "marketing" | "email" | "chatbot" | "cms" | "blog" | "media" | "health" | "settings";

const EMPLOYEE_TAB_KEY = "employeeActiveTab";

function AnalyticsDashboard() {
  const { data: stats } = useQuery<{ totalStudents: number; totalExams: number; totalAttempts: number; activeExams: number }>({
    queryKey: ["/sysctrl/api/stats"],
  });

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalStudents?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">Registered on platform</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Exams</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalExams?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">Olympiads created</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Exams</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeExams?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">Currently running</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exam Attempts</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalAttempts?.toLocaleString() || "0"}</div>
            <p className="text-xs text-muted-foreground">Total submissions</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Platform Overview</CardTitle>
          <CardDescription>View detailed analytics and performance metrics</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Analytics charts and graphs will appear here</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ExamControlPanel() {
  const { data: exams } = useQuery<any[]>({
    queryKey: ["/api/public/olympiads"],
  });

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Olympiads</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams?.length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active</CardTitle>
            <Activity className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams?.filter(e => e.status === 'published').length || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft</CardTitle>
            <FileText className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{exams?.filter(e => e.status === 'draft').length || 0}</div>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Recent Olympiads</CardTitle>
          <CardDescription>Manage exam settings and scheduling</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {exams?.slice(0, 5).map((exam: any) => (
              <div key={exam.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="font-medium">{exam.title}</p>
                  <p className="text-sm text-muted-foreground">{exam.subject} | {exam.totalQuestions} questions</p>
                </div>
                <span className={`px-2 py-1 text-xs rounded-full ${exam.status === 'published' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
                  {exam.status}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProctoringPanel() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Live Sessions</CardTitle>
            <Eye className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Currently monitoring</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnings Issued</CardTitle>
            <Shield className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Today</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Terminated</CardTitle>
            <Shield className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">This week</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Rate</CardTitle>
            <Award className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">100%</div>
            <p className="text-xs text-muted-foreground">No violations</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Live Proctoring Monitor</CardTitle>
          <CardDescription>Real-time exam session monitoring</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            <div className="text-center">
              <Eye className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No active proctoring sessions</p>
              <p className="text-sm">Sessions will appear here when exams are live</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SocialMediaDashboard() {
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [postContent, setPostContent] = useState("");
  const [postPlatforms, setPostPlatforms] = useState<string[]>([]);
  const [scheduledDate, setScheduledDate] = useState("");
  const { toast } = useToast();

  const handleCreatePost = () => {
    if (!postContent.trim()) {
      toast({ title: "Error", description: "Please enter post content", variant: "destructive" });
      return;
    }
    if (postPlatforms.length === 0) {
      toast({ title: "Error", description: "Please select at least one platform", variant: "destructive" });
      return;
    }
    toast({ title: "Post Scheduled", description: `Your post will be published to ${postPlatforms.join(", ")}` });
    setShowCreatePost(false);
    setPostContent("");
    setPostPlatforms([]);
    setScheduledDate("");
  };

  const togglePlatform = (platform: string) => {
    setPostPlatforms(prev => 
      prev.includes(platform) ? prev.filter(p => p !== platform) : [...prev, platform]
    );
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Social Media Management</h2>
          <p className="text-muted-foreground">Create and schedule posts across platforms</p>
        </div>
        <Button onClick={() => setShowCreatePost(!showCreatePost)} className="bg-gradient-to-r from-purple-600 to-pink-600">
          <Plus className="w-4 h-4 mr-2" />
          Create Post
        </Button>
      </div>

      {showCreatePost && (
        <Card className="border-purple-200 dark:border-purple-800">
          <CardHeader>
            <CardTitle>Create New Post</CardTitle>
            <CardDescription>Write your content and select platforms</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Post Content</label>
              <textarea 
                value={postContent}
                onChange={(e) => setPostContent(e.target.value)}
                placeholder="What would you like to share?"
                className="w-full min-h-[120px] p-3 border rounded-lg resize-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Select Platforms</label>
              <div className="flex gap-3">
                {["Facebook", "Instagram", "Twitter", "LinkedIn"].map((platform) => (
                  <button
                    key={platform}
                    onClick={() => togglePlatform(platform)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      postPlatforms.includes(platform)
                        ? "bg-purple-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
                    }`}
                  >
                    {platform}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Schedule (Optional)</label>
              <input 
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="p-2 border rounded-lg"
              />
            </div>
            <div className="flex gap-3">
              <Button onClick={handleCreatePost} className="bg-gradient-to-r from-purple-600 to-pink-600">
                {scheduledDate ? "Schedule Post" : "Post Now"}
              </Button>
              <Button variant="outline" onClick={() => setShowCreatePost(false)}>Cancel</Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Reach</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12.5K</div>
            <p className="text-xs text-green-600">+15% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Engagement</CardTitle>
            <Heart className="h-4 w-4 text-pink-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.8K</div>
            <p className="text-xs text-green-600">+8% from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Shares</CardTitle>
            <Share2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">456</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Comments</CardTitle>
            <MessageCircle className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">189</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Scheduled Posts</CardTitle>
            <CardDescription>Upcoming social media content</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <Calendar className="h-5 w-5 text-blue-600" />
                <div>
                  <p className="font-medium text-sm">Spring Olympiad Announcement</p>
                  <p className="text-xs text-muted-foreground">Scheduled for tomorrow, 10:00 AM</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                <Calendar className="h-5 w-5 text-purple-600" />
                <div>
                  <p className="font-medium text-sm">Registration Open Reminder</p>
                  <p className="text-xs text-muted-foreground">Scheduled for Jan 28, 2:00 PM</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Platform Stats</CardTitle>
            <CardDescription>Social media performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                    <Globe className="h-4 w-4 text-blue-600" />
                  </div>
                  <span className="text-sm font-medium">Facebook</span>
                </div>
                <span className="text-sm text-muted-foreground">5.2K followers</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-pink-100 rounded-full flex items-center justify-center">
                    <Heart className="h-4 w-4 text-pink-600" />
                  </div>
                  <span className="text-sm font-medium">Instagram</span>
                </div>
                <span className="text-sm text-muted-foreground">3.8K followers</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-sky-100 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-4 w-4 text-sky-600" />
                  </div>
                  <span className="text-sm font-medium">Twitter</span>
                </div>
                <span className="text-sm text-muted-foreground">1.9K followers</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function SystemHealthPanel() {
  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Server Status</CardTitle>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">All systems operational</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Uptime</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">99.9%</div>
            <p className="text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Response Time</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">45ms</div>
            <p className="text-xs text-muted-foreground">Average</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Database</CardTitle>
            <Server className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Healthy</div>
            <p className="text-xs text-muted-foreground">PostgreSQL</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>System Services</CardTitle>
          <CardDescription>Status of all platform services</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {["API Server", "Database", "Redis Cache", "CDN", "Email Service"].map((service) => (
              <div key={service} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="font-medium">{service}</span>
                </div>
                <span className="text-sm text-green-600">Operational</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function EmployeeDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [helpChatOpen, setHelpChatOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<EmployeeTab>(() => {
    const saved = localStorage.getItem(EMPLOYEE_TAB_KEY);
    return (saved as EmployeeTab) || "analytics";
  });
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getStoredEmployee = () => {
    const stored = localStorage.getItem("employeeAuth");
    return stored ? JSON.parse(stored) : null;
  };

  const employee = getStoredEmployee();

  const { data: sidebarPermissions } = useQuery<{
    dashboard: { visible: boolean; items: Record<string, boolean> };
    examManagement: { visible: boolean; items: Record<string, boolean> };
    proctoring: { visible: boolean; items: Record<string, boolean> };
    results: { visible: boolean; items: Record<string, boolean> };
    finance: { visible: boolean; items: Record<string, boolean> };
    marketing: { visible: boolean; items: Record<string, boolean> };
    content: { visible: boolean; items: Record<string, boolean> };
    partners: { visible: boolean; items: Record<string, boolean> };
    support: { visible: boolean; items: Record<string, boolean> };
    settings: { visible: boolean; items: Record<string, boolean> };
    isSuperAdmin: boolean;
  }>({
    queryKey: ["/api/rbac/sidebar-config"],
    enabled: !!employee,
  });

  const hasTabAccess = useCallback((tabId: EmployeeTab): boolean => {
    if (!sidebarPermissions) return false;
    if (sidebarPermissions.isSuperAdmin) return true;
    
    const tabPermissionMap: Record<EmployeeTab, () => boolean> = {
      analytics: () => sidebarPermissions.dashboard?.items?.analytics ?? false,
      health: () => sidebarPermissions.dashboard?.items?.systemHealth ?? false,
      exams: () => sidebarPermissions.examManagement?.visible ?? false,
      proctoring: () => sidebarPermissions.proctoring?.visible ?? false,
      results: () => sidebarPermissions.results?.visible ?? false,
      finance: () => sidebarPermissions.finance?.visible ?? false,
      partners: () => sidebarPermissions.partners?.visible ?? false,
      marketing: () => sidebarPermissions.marketing?.visible ?? false,
      email: () => sidebarPermissions.marketing?.items?.emailCampaigns ?? false,
      chatbot: () => sidebarPermissions.support?.visible ?? false,
      cms: () => sidebarPermissions.content?.items?.cms ?? false,
      blog: () => sidebarPermissions.content?.items?.blog ?? false,
      media: () => sidebarPermissions.content?.items?.mediaLibrary ?? false,
      settings: () => sidebarPermissions.settings?.visible ?? false,
    };
    
    return tabPermissionMap[tabId]?.() ?? false;
  }, [sidebarPermissions]);

  useEffect(() => {
    if (!employee) {
      setLocation("/employee/login");
    }
  }, [employee, setLocation]);

  const menuGroups = useMemo(() => [
    {
      id: "dashboard",
      label: "Dashboard & Insights",
      icon: Activity,
      items: [
        { id: "analytics" as EmployeeTab, label: "Analytics", icon: BarChart3 },
        { id: "health" as EmployeeTab, label: "System Health", icon: Server },
      ],
    },
    {
      id: "exam",
      label: "Exam Management",
      icon: GraduationCap,
      items: [
        { id: "exams" as EmployeeTab, label: "Exam Control", icon: BookOpen },
        { id: "proctoring" as EmployeeTab, label: "Proctoring", icon: Shield },
        { id: "results" as EmployeeTab, label: "Results", icon: Award },
      ],
    },
    {
      id: "business",
      label: "Business & Operations",
      icon: TrendingUp,
      items: [
        { id: "finance" as EmployeeTab, label: "Finance", icon: IndianRupee },
        { id: "partners" as EmployeeTab, label: "Partners", icon: Handshake },
      ],
    },
    {
      id: "marketing",
      label: "Marketing & Outreach",
      icon: Megaphone,
      items: [
        { id: "marketing" as EmployeeTab, label: "Social Media", icon: Globe },
        { id: "email" as EmployeeTab, label: "Email Marketing", icon: Mail },
        { id: "chatbot" as EmployeeTab, label: "AI Chatbot", icon: Zap },
      ],
    },
    {
      id: "content",
      label: "Content Management",
      icon: Layout,
      items: [
        { id: "cms" as EmployeeTab, label: "Content CMS", icon: FileText },
        { id: "blog" as EmployeeTab, label: "Blog", icon: FileText },
        { id: "media" as EmployeeTab, label: "Media Library", icon: ImageIcon },
      ],
    },
    {
      id: "platform",
      label: "Settings",
      icon: Settings,
      items: [
        { id: "settings" as EmployeeTab, label: "Settings", icon: Settings },
      ],
    },
  ], []);

  const filteredMenuGroups = useMemo(() => menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => hasTabAccess(item.id))
    }))
    .filter(group => group.items.length > 0), [menuGroups, hasTabAccess]);

  useEffect(() => {
    if (sidebarPermissions && !hasTabAccess(activeTab)) {
      const firstAvailableTab = filteredMenuGroups[0]?.items[0]?.id;
      if (firstAvailableTab) {
        setActiveTab(firstAvailableTab);
        localStorage.setItem(EMPLOYEE_TAB_KEY, firstAvailableTab);
      }
    }
  }, [sidebarPermissions, activeTab, hasTabAccess, filteredMenuGroups]);

  useEffect(() => {
    if (hasTabAccess(activeTab)) {
      localStorage.setItem(EMPLOYEE_TAB_KEY, activeTab);
    }
  }, [activeTab, hasTabAccess]);

  const [expandedGroups, setExpandedGroups] = useState<string[]>(["dashboard", "business"]);

  useEffect(() => {
    const activeGroup = filteredMenuGroups.find(g => g.items.some(item => item.id === activeTab));
    if (activeGroup && !expandedGroups.includes(activeGroup.id)) {
      setExpandedGroups(prev => [...prev, activeGroup.id]);
    }
  }, [activeTab, filteredMenuGroups]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => 
      prev.includes(groupId) 
        ? prev.filter(id => id !== groupId)
        : [...prev, groupId]
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("employeeAuth");
    localStorage.removeItem(EMPLOYEE_TAB_KEY);
    toast({ title: "Logged out", description: "You have been logged out successfully" });
    setLocation("/employee/login");
  };

  if (!employee) return null;

  const renderContent = () => {
    if (!hasTabAccess(activeTab)) {
      return (
        <div className="flex items-center justify-center h-full p-6">
          <div className="text-center">
            <Shield className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-600 mb-2">Access Restricted</h2>
            <p className="text-muted-foreground">You don't have permission to view this section.</p>
          </div>
        </div>
      );
    }
    
    switch (activeTab) {
      case "analytics":
        return <AnalyticsDashboard />;
      case "exams":
        return <ExamControlPanel />;
      case "proctoring":
        return <ProctoringPanel />;
      case "results":
        return <ResultManagementTab />;
      case "finance":
        return <PaymentsManagementTab toast={toast} />;
      case "partners":
        return <PartnerManagementTab />;
      case "marketing":
        return <SocialMediaDashboard />;
      case "email":
        return <EmailMarketingTab />;
      case "chatbot":
        return <ChatbotTab />;
      case "cms":
        return <ContentCMSTab toast={toast} />;
      case "blog":
        return <BlogAdminTab toast={toast} />;
      case "media":
        return <MediaLibraryTab toast={toast} />;
      case "health":
        return <SystemHealthPanel />;
      case "settings":
        return <GlobalSettings />;
      default:
        return null;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      <Helmet>
        <title>Employee Dashboard | Samikaran Olympiad</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <aside className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300`}>
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="font-bold text-gray-900 dark:text-white">Employee Portal</h1>
                <p className="text-xs text-gray-500">{employee?.roleName || "Staff"}</p>
              </div>
            )}
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-2 overflow-auto">
          {filteredMenuGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.id);
            const hasActiveItem = group.items.some(item => item.id === activeTab);
            
            return (
              <Collapsible key={group.id} open={isExpanded} onOpenChange={() => toggleGroup(group.id)}>
                <CollapsibleTrigger asChild>
                  <button
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                      hasActiveItem 
                        ? "bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300" 
                        : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                    data-testid={`button-group-${group.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <group.icon className="w-4 h-4" />
                      {sidebarOpen && <span>{group.label}</span>}
                    </div>
                    {sidebarOpen && (isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
                  </button>
                </CollapsibleTrigger>
                <CollapsibleContent className="mt-1 ml-4 space-y-1">
                  {group.items.map((item) => (
                    <button
                      key={item.id}
                      onClick={() => setActiveTab(item.id)}
                      className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
                        activeTab === item.id
                          ? "bg-indigo-100 dark:bg-indigo-800 text-indigo-700 dark:text-indigo-200 font-medium"
                          : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                      }`}
                      data-testid={`button-tab-${item.id}`}
                    >
                      <item.icon className="w-4 h-4" />
                      {sidebarOpen && <span>{item.label}</span>}
                    </button>
                  ))}
                </CollapsibleContent>
              </Collapsible>
            );
          })}
        </nav>

        <div className="p-3 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-900 rounded-full flex items-center justify-center">
              <span className="text-sm font-medium text-indigo-700 dark:text-indigo-300">
                {employee?.firstName?.[0]}{employee?.lastName?.[0]}
              </span>
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {employee?.firstName} {employee?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{employee?.email}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50"
            onClick={handleLogout}
            data-testid="button-employee-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            {sidebarOpen && "Logout"}
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="button-toggle-sidebar"
              >
                <Menu className="w-5 h-5" />
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                  {filteredMenuGroups.flatMap(g => g.items).find(i => i.id === activeTab)?.label || "Dashboard"}
                </h1>
                <p className="text-sm text-gray-500">
                  Welcome back, {employee?.firstName}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => setHelpChatOpen(true)} data-testid="button-need-help">
              <HelpCircle className="w-4 h-4" />
              <span className="hidden sm:inline text-xs font-medium">Need Help</span>
            </Button>
          </div>
        </header>

        <div className="p-0">
          {renderContent()}
        </div>
      </main>
      <HelpGuideFAB role="admin" />
      <HelpChatPanel isOpen={helpChatOpen} onClose={() => setHelpChatOpen(false)} profileType="admin" userName={employee?.firstName || ""} />
    </div>
  );
}
