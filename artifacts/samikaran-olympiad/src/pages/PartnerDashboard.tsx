import { Helmet } from "react-helmet-async";
import { useState, useEffect } from "react";
import { useLocation, useRoute } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { StatCard, GlassCard } from "@/components/ui/glass-card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  LayoutDashboard, Users, CreditCard, Wallet, TrendingUp,
  Copy, QrCode, Share2, ExternalLink, LogOut, Settings, HelpCircle,
  GraduationCap, Calendar, CheckCircle, Clock, ArrowUpRight, Download,
  ChevronRight, BarChart3, PieChart, LineChart, Handshake, Star, Search,
  User, Phone, Mail, MapPin, Building, Save, Eye, FileText, MessageCircle,
  Award, Target, Percent, IndianRupee, Filter, ChevronDown
} from "lucide-react";
import HelpChatPanel from "@/components/HelpChatPanel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { format } from "date-fns";
import type { Partner, PartnerEarning, PartnerPayout } from "@shared/schema";
import { HelpGuideFAB } from "@/components/HelpGuideButton";

interface DashboardStats {
  totalStudents: number;
  totalEarnings: number;
  pendingPayout: number;
  thisMonthEarnings: number;
  conversionRate: number;
  avgRevenuePerStudent: number;
}


export default function PartnerDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [, routeParams] = useRoute("/partner/dashboard/:tab");
  const tabFromUrl = routeParams?.tab || "dashboard";
  const validPartnerTabs = ["dashboard", "students", "earnings", "transactions", "payouts", "marketing", "analytics", "profile", "support"];
  const [activeTab, setActiveTabState] = useState(validPartnerTabs.includes(tabFromUrl) ? tabFromUrl : "dashboard");

  const setActiveTab = (tab: string) => {
    setActiveTabState(tab);
    setLocation(tab === "dashboard" ? "/partner/dashboard" : `/partner/dashboard/${tab}`, { replace: tab === activeTab });
  };

  useEffect(() => {
    if (validPartnerTabs.includes(tabFromUrl)) {
      if (tabFromUrl !== activeTab) setActiveTabState(tabFromUrl);
    } else if (tabFromUrl !== "dashboard") {
      setActiveTabState("dashboard");
      setLocation("/partner/dashboard", { replace: true });
    }
  }, [tabFromUrl]);
  const [helpChatOpen, setHelpChatOpen] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutNotes, setPayoutNotes] = useState("");

  const { data: partner, isLoading: partnerLoading } = useQuery<Partner>({
    queryKey: ["/api/partner/me"],
  });

  const { data: stats } = useQuery<DashboardStats>({
    queryKey: ["/api/partner/stats"],
    enabled: !!partner,
  });

  const { data: earnings } = useQuery<PartnerEarning[]>({
    queryKey: ["/api/partner/earnings"],
    enabled: !!partner,
  });

  const { data: payouts } = useQuery<PartnerPayout[]>({
    queryKey: ["/api/partner/payouts"],
    enabled: !!partner,
  });

  const requestPayout = useMutation({
    mutationFn: async (data: { amount: number; notes: string }) => {
      const res = await apiRequest("POST", "/api/partner/payouts/request", data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/partner/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/partner/stats"] });
      setShowPayoutDialog(false);
      setPayoutAmount("");
      setPayoutNotes("");
      toast({
        title: "Payout Requested",
        description: "Your payout request has been submitted for review.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Request Failed",
        description: error.message || "Failed to request payout",
        variant: "destructive",
      });
    },
  });

  const copyReferralLink = () => {
    if (partner?.referralLink) {
      navigator.clipboard.writeText(partner.referralLink);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  const copyReferralCode = () => {
    if (partner?.partnerCode) {
      navigator.clipboard.writeText(partner.partnerCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const logout = async () => {
    await apiRequest("POST", "/api/partner/logout", {});
    setLocation("/partner/login");
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  if (partnerLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600"></div>
      </div>
    );
  }

  if (!partner) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-8 text-center">
            <Handshake className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 mb-2">Not Logged In</h2>
            <p className="text-gray-600 mb-6">Please login to access your partner dashboard</p>
            <Button onClick={() => setLocation("/partner/login")} className="w-full">
              Go to Login
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const sidebarItems = [
    { id: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { id: "students", label: "Students", icon: Users },
    { id: "earnings", label: "Earnings", icon: IndianRupee },
    { id: "transactions", label: "Transactions", icon: CreditCard },
    { id: "payouts", label: "Payouts", icon: Wallet },
    { id: "marketing", label: "Marketing Tools", icon: Share2 },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
    { id: "profile", label: "Profile", icon: Settings },
    { id: "support", label: "Support", icon: HelpCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <Helmet>
        <title>Partner Dashboard | Samikaran Olympiad</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        <div className="p-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-fuchsia-500 rounded-xl flex items-center justify-center">
              <Handshake className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="font-bold text-sm text-gray-900">Partner Portal</p>
              <p className="text-xs text-gray-500">{partner.fullName}</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 p-2 space-y-1">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                activeTab === item.id
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              }`}
              data-testid={`nav-${item.id}`}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-gray-100">
          <Button
            variant="ghost"
            className="w-full justify-start text-gray-600"
            onClick={logout}
            data-testid="button-partner-logout"
          >
            <LogOut className="w-5 h-5 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto scroll-optimized">
        <header className="sticky top-0 z-10 bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">{sidebarItems.find(i => i.id === activeTab)?.label || "Dashboard"}</h1>
          </div>
          <Button variant="ghost" size="sm" className="gap-1.5 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50" onClick={() => setHelpChatOpen(true)} data-testid="button-need-help">
            <HelpCircle className="w-4 h-4" />
            <span className="hidden sm:inline text-xs font-medium">Need Help</span>
          </Button>
        </header>
        <div className="p-6">
        {activeTab === "dashboard" && (
          <div className="space-y-6">
            {/* Welcome Header */}
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Welcome back, {partner.fullName}!</h1>
                <p className="text-gray-600">Here's an overview of your partner performance</p>
              </div>
              <Badge className="bg-green-100 text-green-700">
                <Star className="w-3 h-3 mr-1" />
                {partner.partnershipType === "commission" ? "Commission Partner" :
                 partner.partnershipType === "school_institute" ? "School Partner" :
                 partner.partnershipType === "regional" ? "Regional Partner" : "SaaS Partner"}
              </Badge>
            </div>

            {/* Stats Cards - Premium Glass */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              <StatCard
                title="Total Students"
                value={stats?.totalStudents || 0}
                subtitle="Referred students"
                icon={<Users className="w-5 h-5" />}
                iconGradient="blue"
                delay={1}
              />
              <StatCard
                title="Total Earnings"
                value={formatCurrency(stats?.totalEarnings || 0)}
                subtitle="Lifetime earnings"
                icon={<IndianRupee className="w-5 h-5" />}
                iconGradient="green"
                delay={2}
              />
              <StatCard
                title="Pending Payout"
                value={formatCurrency(stats?.pendingPayout || 0)}
                subtitle="Available to withdraw"
                icon={<Wallet className="w-5 h-5" />}
                iconGradient="amber"
                delay={3}
              />
              <StatCard
                title="This Month"
                value={formatCurrency(stats?.thisMonthEarnings || 0)}
                subtitle="Current month earnings"
                icon={<TrendingUp className="w-5 h-5" />}
                iconGradient="purple"
                delay={4}
              />
            </div>

            {/* Quick Actions */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Referral Tools */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Your Referral Tools</CardTitle>
                  <CardDescription>Share these to earn commissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700">Referral Link</label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={partner.referralLink || `${window.location.origin}/register?ref=${partner.partnerCode}`}
                        readOnly
                        className="flex-1 bg-gray-50"
                      />
                      <Button variant="outline" onClick={copyReferralLink} data-testid="button-copy-link">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700">Referral Code</label>
                    <div className="flex gap-2 mt-1">
                      <Input 
                        value={partner.partnerCode}
                        readOnly
                        className="flex-1 bg-gray-50 font-mono text-lg"
                      />
                      <Button variant="outline" onClick={copyReferralCode} data-testid="button-copy-code">
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm text-gray-600">
                    <p>Commission Rate: <span className="font-semibold text-green-600">{partner.commissionRate}%</span></p>
                  </div>
                </CardContent>
              </Card>

              {/* Payout Card */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Request Payout</CardTitle>
                  <CardDescription>Withdraw your available earnings</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-4">
                    <p className="text-sm text-gray-500 mb-2">Available Balance</p>
                    <p className="text-4xl font-bold text-gray-900">{formatCurrency(stats?.pendingPayout || 0)}</p>
                    <p className="text-sm text-gray-500 mt-2">Minimum payout: {formatCurrency(100000)}</p>
                  </div>
                  <Button 
                    className="w-full mt-4"
                    disabled={(stats?.pendingPayout || 0) < 100000}
                    onClick={() => setShowPayoutDialog(true)}
                    data-testid="button-request-payout"
                  >
                    Request Payout
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Recent Earnings</CardTitle>
              </CardHeader>
              <CardContent>
                {earnings && earnings.length > 0 ? (
                  <div className="space-y-3">
                    {earnings.slice(0, 5).map((earning) => (
                      <div key={earning.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">Student Registration</p>
                            <p className="text-sm text-gray-500">
                              {new Date(earning.createdAt!).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">+{formatCurrency(earning.commissionAmount)}</p>
                          <p className="text-sm text-gray-500">{earning.commissionRate}% of {formatCurrency(earning.paymentAmount)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <IndianRupee className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No earnings yet. Start sharing your referral link!</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "marketing" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Marketing Tools</h1>
              <p className="text-gray-600">Resources to help you promote and earn</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Referral Link</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <code className="text-sm break-all">
                      {partner.referralLink || `${window.location.origin}/register?ref=${partner.partnerCode}`}
                    </code>
                  </div>
                  <Button className="w-full" onClick={copyReferralLink}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Link
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Referral Code</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-3xl font-bold font-mono tracking-wider">{partner.partnerCode}</p>
                  </div>
                  <Button className="w-full" onClick={copyReferralCode}>
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Code
                  </Button>
                </CardContent>
              </Card>

              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Promotional Text</CardTitle>
                  <CardDescription>Copy and share this message</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-gray-700">
                      Participate in the Samikaran Olympiad - a global platform for students to excel in competitive exams! 
                      Register now using my referral code <strong>{partner.partnerCode}</strong> or visit: 
                      {partner.referralLink || `${window.location.origin}/register?ref=${partner.partnerCode}`}
                    </p>
                  </div>
                  <Button 
                    className="mt-4" 
                    variant="outline"
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `Participate in the Samikaran Olympiad - a global platform for students to excel in competitive exams! Register now using my referral code ${partner.partnerCode} or visit: ${partner.referralLink || `${window.location.origin}/register?ref=${partner.partnerCode}`}`
                      );
                      toast({ title: "Copied!", description: "Promotional text copied" });
                    }}
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Copy Text
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "payouts" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Payouts</h1>
                <p className="text-gray-600">Track your payout requests and history</p>
              </div>
              <Button 
                onClick={() => setShowPayoutDialog(true)}
                disabled={(stats?.pendingPayout || 0) < 100000}
                data-testid="button-request-payout-header"
              >
                <Wallet className="w-4 h-4 mr-2" />
                Request Payout
              </Button>
            </div>

            <Card>
              <CardContent className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                  <div>
                    <p className="text-sm text-gray-500">Available Balance</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(stats?.pendingPayout || 0)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Minimum Threshold</p>
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(100000)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Paid Out</p>
                    <p className="text-3xl font-bold text-green-600">
                      {formatCurrency(payouts?.filter(p => p.status === "paid").reduce((sum, p) => sum + p.amount, 0) || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Payout History</CardTitle>
              </CardHeader>
              <CardContent>
                {payouts && payouts.length > 0 ? (
                  <div className="space-y-3">
                    {payouts.map((payout) => (
                      <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                            payout.status === "paid" ? "bg-green-100" :
                            payout.status === "approved" ? "bg-blue-100" :
                            payout.status === "rejected" ? "bg-red-100" : "bg-orange-100"
                          }`}>
                            {payout.status === "paid" ? <CheckCircle className="w-5 h-5 text-green-600" /> :
                             payout.status === "rejected" ? <Clock className="w-5 h-5 text-red-600" /> :
                             <Clock className="w-5 h-5 text-orange-600" />}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{formatCurrency(payout.amount)}</p>
                            <p className="text-sm text-gray-500">
                              Requested: {new Date(payout.requestedAt!).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge className={
                          payout.status === "paid" ? "bg-green-100 text-green-700" :
                          payout.status === "approved" ? "bg-blue-100 text-blue-700" :
                          payout.status === "rejected" ? "bg-red-100 text-red-700" :
                          payout.status === "processing" ? "bg-purple-100 text-purple-700" :
                          "bg-orange-100 text-orange-700"
                        }>
                          {payout.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                    <p>No payout requests yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Students Tab */}
        {activeTab === "students" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Referred Students</h1>
                <p className="text-gray-600">Students registered through your referral link</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-total-students">{stats?.totalStudents || 0}</p>
                    <p className="text-xs text-gray-500">Total Students</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-total-commissions">{earnings?.length || 0}</p>
                    <p className="text-xs text-gray-500">Total Commissions</p>
                  </div>
                </div>
              </Card>
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                    <IndianRupee className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold" data-testid="text-avg-commission">{formatCurrency(stats?.avgRevenuePerStudent || 0)}</p>
                    <p className="text-xs text-gray-500">Avg. per Student</p>
                  </div>
                </div>
              </Card>
            </div>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Recent Referred Registrations</CardTitle>
              </CardHeader>
              <CardContent>
                {!earnings ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg animate-pulse">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-200 rounded-full" />
                          <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-200 rounded" />
                            <div className="h-3 w-24 bg-gray-200 rounded" />
                          </div>
                        </div>
                        <div className="h-4 w-20 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                ) : earnings.length > 0 ? (
                  <div className="space-y-3">
                    {earnings.map((earning) => (
                      <div key={earning.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg" data-testid={`row-student-${earning.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                            <GraduationCap className="w-5 h-5 text-green-600" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">Student ID: {earning.studentId}</p>
                            <p className="text-xs text-gray-500">
                              {format(new Date(earning.createdAt!), "dd MMM yyyy")}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-green-600">+{formatCurrency(earning.commissionAmount)}</p>
                          <Badge variant="outline" className="text-xs text-green-600">
                            {earning.commissionRate}% commission
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-12 text-gray-500">
                    <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className="font-medium">No referred students yet</p>
                    <p className="text-sm mt-1">Share your referral link to start earning commissions</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Earnings Tab */}
        {activeTab === "earnings" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Earnings Overview</h1>
                <p className="text-gray-600">Track your commissions and bonuses</p>
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Filter" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Time</SelectItem>
                  <SelectItem value="month">This Month</SelectItem>
                  <SelectItem value="week">This Week</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <GlassCard className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <IndianRupee className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Total Earnings</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats?.totalEarnings || 8750000)}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center gap-2 text-sm text-green-600">
                  <TrendingUp className="w-4 h-4" />
                  <span>+12.5% from last month</span>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                    <Percent className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Commission Rate</p>
                    <p className="text-2xl font-bold">18%</p>
                  </div>
                </div>
                <div className="mt-4">
                  <p className="text-xs text-gray-500">Tier: Gold Partner</p>
                  <Progress value={72} className="h-1.5 mt-1" />
                  <p className="text-xs text-gray-500 mt-1">28 more students to Platinum</p>
                </div>
              </GlassCard>

              <GlassCard className="p-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
                    <Target className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">This Month Target</p>
                    <p className="text-2xl font-bold">{formatCurrency(stats?.thisMonthEarnings || 2500000)}</p>
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Progress</span>
                    <span>65%</span>
                  </div>
                  <Progress value={65} className="h-1.5" />
                </div>
              </GlassCard>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Earnings Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {earnings?.slice(0, 10).map((earning) => (
                    <div key={earning.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                          <IndianRupee className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="font-medium text-sm">Commission Earned</p>
                          <p className="text-xs text-gray-500">Student ID: {earning.studentId}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-green-600">+{formatCurrency(earning.commissionAmount)}</p>
                        <p className="text-xs text-gray-500">{earning.createdAt ? format(new Date(earning.createdAt), "dd MMM yyyy") : ""}</p>
                      </div>
                    </div>
                  )) || (
                    <div className="text-center py-8 text-gray-500">
                      <IndianRupee className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No earnings recorded yet</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Transactions Tab */}
        {activeTab === "transactions" && (
          <div className="space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-3">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
                <p className="text-gray-600">All your earnings and payouts</p>
              </div>
            </div>

            <Card>
              <CardContent className="p-0">
                {!earnings && !payouts ? (
                  <div className="divide-y">
                    {[1, 2, 3, 4].map((i) => (
                      <div key={i} className="flex items-center justify-between p-4 animate-pulse">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 bg-gray-200 rounded-full" />
                          <div className="space-y-2">
                            <div className="h-4 w-40 bg-gray-200 rounded" />
                            <div className="h-3 w-24 bg-gray-200 rounded" />
                          </div>
                        </div>
                        <div className="h-4 w-20 bg-gray-200 rounded" />
                      </div>
                    ))}
                  </div>
                ) : (() => {
                  const transactions: { id: string; type: "earning" | "payout"; amount: number; description: string; date: Date; status: string }[] = [];
                  earnings?.forEach((e) => {
                    transactions.push({
                      id: `earning-${e.id}`,
                      type: "earning",
                      amount: e.commissionAmount,
                      description: `Commission earned (${e.commissionRate}% of ${formatCurrency(e.paymentAmount)})`,
                      date: e.createdAt ? new Date(e.createdAt) : new Date(),
                      status: "completed",
                    });
                  });
                  payouts?.forEach((p) => {
                    transactions.push({
                      id: `payout-${p.id}`,
                      type: "payout",
                      amount: p.amount,
                      description: `Payout request`,
                      date: p.requestedAt ? new Date(p.requestedAt) : new Date(),
                      status: p.status || "pending",
                    });
                  });
                  transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

                  if (transactions.length === 0) {
                    return (
                      <div className="text-center py-12 text-gray-500">
                        <CreditCard className="w-12 h-12 mx-auto mb-3 opacity-50" />
                        <p className="font-medium">No transactions yet</p>
                        <p className="text-sm mt-1">Your earnings and payouts will appear here</p>
                      </div>
                    );
                  }

                  return (
                    <div className="divide-y">
                      {transactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 hover:bg-gray-50" data-testid={`row-transaction-${tx.id}`}>
                          <div className="flex items-center gap-4">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                              tx.type === "earning" ? "bg-green-100" : "bg-red-100"
                            }`}>
                              {tx.type === "earning" ? <ArrowUpRight className="w-5 h-5 text-green-600" /> :
                               <Wallet className="w-5 h-5 text-red-600" />}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{tx.description}</p>
                              <p className="text-xs text-gray-500">{format(tx.date, "dd MMM yyyy")}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`font-bold ${tx.type === "earning" ? "text-green-600" : "text-red-600"}`}>
                              {tx.type === "earning" ? "+" : "-"}{formatCurrency(tx.amount)}
                            </p>
                            <Badge variant="outline" className={
                              tx.status === "completed" || tx.status === "paid" ? "text-green-600" :
                              tx.status === "pending" || tx.status === "processing" ? "text-amber-600" : "text-red-600"
                            }>
                              {tx.status}
                            </Badge>
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Analytics Tab */}
        {activeTab === "analytics" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Performance Analytics</h1>
              <p className="text-gray-600">Insights into your referral performance</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Total Students</p>
                  <TrendingUp className="w-4 h-4 text-green-500" />
                </div>
                <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                <p className="text-xs text-gray-500">Referred students</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Total Earnings</p>
                  <IndianRupee className="w-4 h-4 text-blue-500" />
                </div>
                <p className="text-2xl font-bold">{formatCurrency(stats?.totalEarnings || 0)}</p>
                <p className="text-xs text-gray-500">Lifetime earnings</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">This Month</p>
                  <Building className="w-4 h-4 text-purple-500" />
                </div>
                <p className="text-2xl font-bold">{formatCurrency(stats?.thisMonthEarnings || 0)}</p>
                <p className="text-xs text-gray-500">Monthly earnings</p>
              </Card>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-gray-500">Pending Payout</p>
                  <ExternalLink className="w-4 h-4 text-amber-500" />
                </div>
                <p className="text-2xl font-bold">{formatCurrency(stats?.pendingPayout || 0)}</p>
                <p className="text-xs text-gray-500">Available to withdraw</p>
              </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Recent Earnings</CardTitle>
                </CardHeader>
                <CardContent>
                  {earnings && earnings.length > 0 ? (
                    <div className="space-y-3">
                      {earnings.slice(0, 6).map((earning) => (
                        <div key={earning.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div>
                            <p className="font-medium text-sm">Student Registration</p>
                            <p className="text-xs text-gray-500">{earning.createdAt ? new Date(earning.createdAt).toLocaleDateString() : ""}</p>
                          </div>
                          <p className="font-bold text-sm text-green-600">+{formatCurrency(earning.commissionAmount)}</p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BarChart3 className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No earnings data yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Payout History</CardTitle>
                </CardHeader>
                <CardContent>
                  {payouts && payouts.length > 0 ? (
                    <div className="space-y-3">
                      {payouts.slice(0, 5).map((payout, i) => (
                        <div key={payout.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-sm font-bold text-violet-600">
                              {i + 1}
                            </div>
                            <div>
                              <p className="font-medium text-sm">{formatCurrency(payout.amount)}</p>
                              <p className="text-xs text-gray-500">{payout.requestedAt ? new Date(payout.requestedAt).toLocaleDateString() : ""}</p>
                            </div>
                          </div>
                          <Badge className={
                            payout.status === "completed" ? "bg-green-100 text-green-700" :
                            payout.status === "pending" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"
                          }>
                            {payout.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No payouts yet</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {/* Profile Tab */}
        {activeTab === "profile" && (
          <div className="space-y-6 max-w-2xl">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
              <p className="text-gray-600">Manage your partner account details</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4 mb-6">
                  <Avatar className="w-20 h-20">
                    <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-2xl">
                      {partner.fullName?.split(" ").map(n => n[0]).join("") || "P"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-bold text-lg">{partner.fullName}</p>
                    <Badge className="bg-violet-100 text-violet-700">
                      {partner.partnershipType === "commission" ? "Commission Partner" :
                       partner.partnershipType === "school_institute" ? "School Partner" :
                       partner.partnershipType === "regional" ? "Regional Partner" : "SaaS Partner"}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Full Name</Label>
                    <Input value={partner.fullName || ""} className="mt-1" readOnly />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Email</Label>
                    <Input value={partner.email || ""} className="mt-1" readOnly />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Phone</Label>
                    <Input value={partner.phone || ""} className="mt-1" readOnly />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Partner Code</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={partner.partnerCode || ""} readOnly />
                      <Button variant="outline" size="icon" onClick={copyReferralCode}>
                        <Copy className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Bank Details</CardTitle>
                <CardDescription>For receiving payouts</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Account Holder Name</Label>
                    <Input placeholder="Enter account holder name" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Bank Name</Label>
                    <Input placeholder="Enter bank name" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">Account Number</Label>
                    <Input placeholder="Enter account number" className="mt-1" />
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-gray-700">IFSC Code</Label>
                    <Input placeholder="Enter IFSC code" className="mt-1" />
                  </div>
                </div>
                <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white gap-2">
                  <Save className="w-4 h-4" />
                  Save Bank Details
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Support Tab */}
        {activeTab === "support" && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Partner Support</h1>
              <p className="text-gray-600">Get help and access resources</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer" onClick={() => window.open("/guides/partner-guide.html", "_blank")}>
                <div className="w-14 h-14 rounded-full bg-violet-100 flex items-center justify-center mx-auto mb-4">
                  <FileText className="w-7 h-7 text-violet-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Partner Guide</h3>
                <p className="text-sm text-gray-500">Complete guide to using the partner portal</p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                  <MessageCircle className="w-7 h-7 text-green-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Live Chat</h3>
                <p className="text-sm text-gray-500">Chat with our support team</p>
              </Card>

              <Card className="p-6 text-center hover:shadow-lg transition-shadow cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mx-auto mb-4">
                  <Phone className="w-7 h-7 text-blue-600" />
                </div>
                <h3 className="font-bold text-lg mb-2">Call Support</h3>
                <p className="text-sm text-gray-500">+91 1800-XXX-XXXX</p>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Frequently Asked Questions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { q: "How do I track my referrals?", a: "Go to the Students tab to see all students who registered through your referral link." },
                  { q: "When do I receive my payouts?", a: "Payouts are processed every Friday for the previous week's confirmed earnings. Minimum payout is Rs. 500." },
                  { q: "How can I increase my commission rate?", a: "Refer more students to move up to higher tiers. 200+ students gets you the maximum 25% commission rate." },
                  { q: "Can I refer schools?", a: "Yes! School partnerships are highly encouraged. When a school registers, all their students count toward your referrals." },
                ].map((faq, i) => (
                  <div key={i} className="p-4 bg-gray-50 rounded-lg">
                    <p className="font-medium text-sm text-violet-700 mb-1">{faq.q}</p>
                    <p className="text-sm text-gray-600">{faq.a}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        )}
        </div>
      </main>

      {/* Payout Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request Payout</DialogTitle>
            <DialogDescription>
              Enter the amount you want to withdraw from your available balance
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium">Amount ({formatCurrency(stats?.pendingPayout || 0)} available)</label>
              <Input
                type="number"
                placeholder="Enter amount in paise"
                value={payoutAmount}
                onChange={(e) => setPayoutAmount(e.target.value)}
                className="mt-1"
                data-testid="input-payout-amount"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Any additional notes..."
                value={payoutNotes}
                onChange={(e) => setPayoutNotes(e.target.value)}
                className="mt-1"
                rows={2}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>Cancel</Button>
            <Button
              onClick={() => requestPayout.mutate({ amount: parseInt(payoutAmount), notes: payoutNotes })}
              disabled={requestPayout.isPending || !payoutAmount}
              data-testid="button-confirm-payout"
            >
              {requestPayout.isPending ? "Processing..." : "Request Payout"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <HelpGuideFAB role="partner" />
      <HelpChatPanel isOpen={helpChatOpen} onClose={() => setHelpChatOpen(false)} profileType="partner" userName={partner.fullName} />
    </div>
  );
}
