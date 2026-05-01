import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Users, Search, CheckCircle, Clock, XCircle, Eye, IndianRupee, Wallet, TrendingUp,
  Mail, Phone, Building2, Globe, Calendar, BarChart3, FileText, Ban, RefreshCw, Handshake
} from "lucide-react";
import type { PartnerApplication, Partner, PartnerPayout } from "@shared/schema";

interface PartnerAnalytics {
  totalPartners: number;
  activePartners: number;
  totalStudents: number;
  totalEarnings: number;
  pendingPayouts: number;
  paidPayouts: number;
  pendingApplications: number;
  applicationsByStatus: {
    pending: number;
    approved: number;
    rejected: number;
  };
  partnersByType: {
    commission: number;
    school_institute: number;
    regional: number;
    saas_whitelabel: number;
  };
}

export function PartnerManagementTab() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("applications");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedApplication, setSelectedApplication] = useState<PartnerApplication | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [showReviewDialog, setShowReviewDialog] = useState(false);
  const [showPayoutDialog, setShowPayoutDialog] = useState(false);
  const [selectedPayout, setSelectedPayout] = useState<(PartnerPayout & { partnerName: string }) | null>(null);
  const [reviewNotes, setReviewNotes] = useState("");
  const [commissionRate, setCommissionRate] = useState("10");

  const { data: applications, isLoading: loadingApps } = useQuery<PartnerApplication[]>({
    queryKey: ["/api/admin/partner/applications", statusFilter],
  });

  const { data: partners, isLoading: loadingPartners } = useQuery<Partner[]>({
    queryKey: ["/api/admin/partners"],
  });

  const { data: payouts, isLoading: loadingPayouts } = useQuery<(PartnerPayout & { partnerName: string })[]>({
    queryKey: ["/api/admin/partner/payouts"],
  });

  const { data: analytics } = useQuery<PartnerAnalytics>({
    queryKey: ["/api/admin/partner/analytics"],
  });

  const reviewApplication = useMutation({
    mutationFn: async (data: { id: number; action: string; adminNotes: string; commissionRate?: number }) => {
      const res = await apiRequest("POST", `/api/admin/partner/applications/${data.id}/review`, {
        action: data.action,
        adminNotes: data.adminNotes,
        commissionRate: data.commissionRate,
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner/applications"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner/analytics"] });
      setShowReviewDialog(false);
      setSelectedApplication(null);
      setReviewNotes("");
      toast({
        title: "Application Reviewed",
        description: "The partner application has been processed.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Review Failed",
        description: error.message || "Failed to review application",
        variant: "destructive",
      });
    },
  });

  const processPayout = useMutation({
    mutationFn: async (data: { id: number; action: string; transactionId?: string; adminNotes?: string; rejectedReason?: string }) => {
      const res = await apiRequest("POST", `/api/admin/partner/payouts/${data.id}/process`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partner/payouts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/partners"] });
      setShowPayoutDialog(false);
      setSelectedPayout(null);
      toast({
        title: "Payout Processed",
        description: "The payout has been processed successfully.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Processing Failed",
        description: error.message || "Failed to process payout",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(amount / 100);
  };

  const getPartnerTypeLabel = (type: string) => {
    switch (type) {
      case "commission": return "Commission Partner";
      case "school_institute": return "School/Institute";
      case "regional": return "Regional Partner";
      case "saas_whitelabel": return "SaaS/White-Label";
      default: return type;
    }
  };

  const filteredApplications = applications?.filter(app => {
    const matchesSearch = app.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.organizationName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const filteredPartners = partners?.filter(partner => {
    return partner.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      partner.partnerCode.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="space-y-6">
      {/* Analytics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-violet-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Users className="w-5 h-5 text-violet-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analytics?.totalPartners || 0}</p>
            <p className="text-xs text-gray-500">Total Partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analytics?.activePartners || 0}</p>
            <p className="text-xs text-gray-500">Active Partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-orange-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Clock className="w-5 h-5 text-orange-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analytics?.pendingApplications || 0}</p>
            <p className="text-xs text-gray-500">Pending Apps</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{analytics?.totalStudents || 0}</p>
            <p className="text-xs text-gray-500">Students via Partners</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <IndianRupee className="w-5 h-5 text-emerald-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics?.totalEarnings || 0)}</p>
            <p className="text-xs text-gray-500">Total Commissions</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-2">
              <Wallet className="w-5 h-5 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{formatCurrency(analytics?.paidPayouts || 0)}</p>
            <p className="text-xs text-gray-500">Paid Out</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-gray-100/50">
          <TabsTrigger value="applications" className="data-[state=active]:bg-white">
            <Clock className="w-4 h-4 mr-2" />
            Applications
            {analytics?.pendingApplications ? (
              <Badge className="ml-2 bg-orange-500">{analytics.pendingApplications}</Badge>
            ) : null}
          </TabsTrigger>
          <TabsTrigger value="partners" className="data-[state=active]:bg-white">
            <Users className="w-4 h-4 mr-2" />
            Approved Partners
          </TabsTrigger>
          <TabsTrigger value="payouts" className="data-[state=active]:bg-white">
            <Wallet className="w-4 h-4 mr-2" />
            Payouts
          </TabsTrigger>
          <TabsTrigger value="analytics" className="data-[state=active]:bg-white">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        {/* Applications Tab */}
        <TabsContent value="applications" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle>Partner Applications</CardTitle>
                <CardDescription>Review and manage partner applications</CardDescription>
              </div>
              <div className="flex gap-2">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search applications..."
                    className="pl-9 w-64"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    data-testid="input-search-applications"
                  />
                </div>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-40" data-testid="select-status-filter">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="approved">Approved</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              {loadingApps ? (
                <div className="text-center py-8">Loading applications...</div>
              ) : filteredApplications && filteredApplications.length > 0 ? (
                <div className="space-y-4">
                  {filteredApplications.map((app) => (
                    <motion.div
                      key={app.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          app.status === "pending" ? "bg-orange-100" :
                          app.status === "approved" ? "bg-green-100" : "bg-red-100"
                        }`}>
                          {app.status === "pending" ? <Clock className="w-6 h-6 text-orange-600" /> :
                           app.status === "approved" ? <CheckCircle className="w-6 h-6 text-green-600" /> :
                           <XCircle className="w-6 h-6 text-red-600" />}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{app.fullName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <Mail className="w-3 h-3" />
                            {app.email}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {getPartnerTypeLabel(app.partnershipType)}
                            </Badge>
                            <span className="text-xs text-gray-400">
                              {app.organizationName || "Individual"}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={
                          app.status === "pending" ? "bg-orange-100 text-orange-700" :
                          app.status === "approved" ? "bg-green-100 text-green-700" :
                          "bg-red-100 text-red-700"
                        }>
                          {app.status}
                        </Badge>
                        <p className="text-sm text-gray-500">
                          {new Date(app.createdAt!).toLocaleDateString()}
                        </p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setSelectedApplication(app);
                            setShowReviewDialog(true);
                          }}
                          data-testid={`button-review-${app.id}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          {app.status === "pending" ? "Review" : "View"}
                        </Button>
                      </div>
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Handshake className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No applications found</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Partners Tab */}
        <TabsContent value="partners" className="mt-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4">
              <div>
                <CardTitle>Approved Partners</CardTitle>
                <CardDescription>Manage active partner accounts</CardDescription>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search partners..."
                  className="pl-9 w-64"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  data-testid="input-search-partners"
                />
              </div>
            </CardHeader>
            <CardContent>
              {loadingPartners ? (
                <div className="text-center py-8">Loading partners...</div>
              ) : filteredPartners && filteredPartners.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left text-sm text-gray-500">
                        <th className="pb-3 font-medium">Partner</th>
                        <th className="pb-3 font-medium">Code</th>
                        <th className="pb-3 font-medium">Type</th>
                        <th className="pb-3 font-medium">Commission</th>
                        <th className="pb-3 font-medium">Students</th>
                        <th className="pb-3 font-medium">Earnings</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {filteredPartners.map((partner) => (
                        <tr key={partner.id} className="hover:bg-gray-50">
                          <td className="py-4">
                            <div>
                              <p className="font-medium text-gray-900">{partner.fullName}</p>
                              <p className="text-sm text-gray-500">{partner.email}</p>
                            </div>
                          </td>
                          <td className="py-4">
                            <code className="bg-gray-100 px-2 py-1 rounded text-sm">{partner.partnerCode}</code>
                          </td>
                          <td className="py-4">
                            <Badge variant="outline">{getPartnerTypeLabel(partner.partnershipType)}</Badge>
                          </td>
                          <td className="py-4 font-medium text-green-600">{partner.commissionRate}%</td>
                          <td className="py-4">{partner.totalStudents || 0}</td>
                          <td className="py-4 font-medium">{formatCurrency(partner.totalEarnings || 0)}</td>
                          <td className="py-4">
                            <Badge className={
                              partner.status === "active" ? "bg-green-100 text-green-700" :
                              partner.status === "suspended" ? "bg-orange-100 text-orange-700" :
                              "bg-red-100 text-red-700"
                            }>
                              {partner.status}
                            </Badge>
                          </td>
                          <td className="py-4">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => setSelectedPartner(partner)}
                              data-testid={`button-view-partner-${partner.id}`}
                            >
                              <Eye className="w-4 h-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No approved partners yet</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payouts Tab */}
        <TabsContent value="payouts" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Partner Payouts</CardTitle>
              <CardDescription>Process and track partner payout requests</CardDescription>
            </CardHeader>
            <CardContent>
              {loadingPayouts ? (
                <div className="text-center py-8">Loading payouts...</div>
              ) : payouts && payouts.length > 0 ? (
                <div className="space-y-4">
                  {payouts.map((payout) => (
                    <div key={payout.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                          payout.status === "paid" ? "bg-green-100" :
                          payout.status === "pending" ? "bg-orange-100" :
                          payout.status === "approved" ? "bg-blue-100" : "bg-red-100"
                        }`}>
                          <Wallet className={`w-6 h-6 ${
                            payout.status === "paid" ? "text-green-600" :
                            payout.status === "pending" ? "text-orange-600" :
                            payout.status === "approved" ? "text-blue-600" : "text-red-600"
                          }`} />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{payout.partnerName}</p>
                          <p className="text-sm text-gray-500">
                            Requested: {new Date(payout.requestedAt!).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <p className="text-xl font-bold text-gray-900">{formatCurrency(payout.amount)}</p>
                        <Badge className={
                          payout.status === "paid" ? "bg-green-100 text-green-700" :
                          payout.status === "pending" ? "bg-orange-100 text-orange-700" :
                          payout.status === "approved" ? "bg-blue-100 text-blue-700" :
                          payout.status === "processing" ? "bg-purple-100 text-purple-700" :
                          "bg-red-100 text-red-700"
                        }>
                          {payout.status}
                        </Badge>
                        {(payout.status === "pending" || payout.status === "approved") && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setSelectedPayout(payout);
                              setShowPayoutDialog(true);
                            }}
                            data-testid={`button-process-payout-${payout.id}`}
                          >
                            Process
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>No payout requests</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Partners by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-violet-50 rounded-lg">
                    <span className="font-medium">Commission Partners</span>
                    <Badge className="bg-violet-500">{analytics?.partnersByType.commission || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <span className="font-medium">School/Institute Partners</span>
                    <Badge className="bg-blue-500">{analytics?.partnersByType.school_institute || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-emerald-50 rounded-lg">
                    <span className="font-medium">Regional Partners</span>
                    <Badge className="bg-emerald-500">{analytics?.partnersByType.regional || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">SaaS/White-Label Partners</span>
                    <Badge className="bg-orange-500">{analytics?.partnersByType.saas_whitelabel || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Applications by Status</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
                    <span className="font-medium">Pending</span>
                    <Badge className="bg-orange-500">{analytics?.applicationsByStatus.pending || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                    <span className="font-medium">Approved</span>
                    <Badge className="bg-green-500">{analytics?.applicationsByStatus.approved || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <span className="font-medium">Rejected</span>
                    <Badge className="bg-red-500">{analytics?.applicationsByStatus.rejected || 0}</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Revenue Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="text-center p-6 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl">
                    <IndianRupee className="w-10 h-10 text-emerald-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics?.totalEarnings || 0)}</p>
                    <p className="text-sm text-gray-600">Total Partner Commissions</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-purple-50 to-violet-50 rounded-xl">
                    <Wallet className="w-10 h-10 text-purple-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics?.pendingPayouts || 0)}</p>
                    <p className="text-sm text-gray-600">Pending Payouts</p>
                  </div>
                  <div className="text-center p-6 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl">
                    <CheckCircle className="w-10 h-10 text-blue-600 mx-auto mb-2" />
                    <p className="text-3xl font-bold text-gray-900">{formatCurrency(analytics?.paidPayouts || 0)}</p>
                    <p className="text-sm text-gray-600">Total Paid Out</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Review Application Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Review Partner Application</DialogTitle>
            <DialogDescription>Review the application details and take action</DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)]">
          {selectedApplication && (
            <div className="space-y-6 py-4">
              {/* Applicant Details */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Full Name</p>
                  <p className="text-gray-900">{selectedApplication.fullName}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-gray-900">{selectedApplication.email}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-gray-900">{selectedApplication.countryCode} {selectedApplication.phone}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Organization</p>
                  <p className="text-gray-900">{selectedApplication.organizationName || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Organization Type</p>
                  <p className="text-gray-900 capitalize">{selectedApplication.organizationType}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Partnership Type</p>
                  <p className="text-gray-900">{getPartnerTypeLabel(selectedApplication.partnershipType)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Expected Students/Month</p>
                  <p className="text-gray-900">{selectedApplication.expectedStudentsPerMonth || "N/A"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Target Geography</p>
                  <p className="text-gray-900">{selectedApplication.targetGeography || "N/A"}</p>
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Why they want to partner</p>
                <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedApplication.whyPartner}</p>
              </div>

              {selectedApplication.priorEdtechExperience && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Prior EdTech Experience</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedApplication.priorEdtechExperience}</p>
                </div>
              )}

              {selectedApplication.status === "pending" && (
                <>
                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Commission Rate (%)</p>
                    <Select value={commissionRate} onValueChange={setCommissionRate}>
                      <SelectTrigger data-testid="select-commission-rate">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="15">15%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="text-sm font-medium text-gray-500 mb-1">Admin Notes</p>
                    <Textarea
                      placeholder="Add notes about this application..."
                      value={reviewNotes}
                      onChange={(e) => setReviewNotes(e.target.value)}
                      rows={3}
                      data-testid="input-admin-notes"
                    />
                  </div>
                </>
              )}

              {selectedApplication.adminNotes && (
                <div>
                  <p className="text-sm font-medium text-gray-500 mb-1">Previous Admin Notes</p>
                  <p className="text-gray-900 bg-gray-50 p-3 rounded-lg">{selectedApplication.adminNotes}</p>
                </div>
              )}
            </div>
          )}
          </div>

          <DialogFooter className="flex-shrink-0 gap-2">
            <Button variant="outline" onClick={() => setShowReviewDialog(false)}>
              Close
            </Button>
            {selectedApplication?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => reviewApplication.mutate({
                    id: selectedApplication.id,
                    action: "reject",
                    adminNotes: reviewNotes,
                  })}
                  disabled={reviewApplication.isPending}
                  data-testid="button-reject-application"
                >
                  <XCircle className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => reviewApplication.mutate({
                    id: selectedApplication.id,
                    action: "approve",
                    adminNotes: reviewNotes,
                    commissionRate: parseInt(commissionRate),
                  })}
                  disabled={reviewApplication.isPending}
                  className="bg-green-600 hover:bg-green-700"
                  data-testid="button-approve-application"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  {reviewApplication.isPending ? "Processing..." : "Approve"}
                </Button>
              </>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Process Payout Dialog */}
      <Dialog open={showPayoutDialog} onOpenChange={setShowPayoutDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Payout</DialogTitle>
            <DialogDescription>Take action on this payout request</DialogDescription>
          </DialogHeader>
          
          {selectedPayout && (
            <div className="space-y-4 py-4">
              <div className="text-center p-6 bg-gray-50 rounded-xl">
                <p className="text-sm text-gray-500">Payout Amount</p>
                <p className="text-3xl font-bold text-gray-900">{formatCurrency(selectedPayout.amount)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Partner: <span className="text-gray-900">{selectedPayout.partnerName}</span></p>
                <p className="text-sm text-gray-500">Status: <span className="text-gray-900 capitalize">{selectedPayout.status}</span></p>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setShowPayoutDialog(false)}>
              Cancel
            </Button>
            {selectedPayout?.status === "pending" && (
              <>
                <Button
                  variant="destructive"
                  onClick={() => processPayout.mutate({
                    id: selectedPayout.id,
                    action: "reject",
                    rejectedReason: "Insufficient documentation",
                  })}
                  disabled={processPayout.isPending}
                >
                  <Ban className="w-4 h-4 mr-1" />
                  Reject
                </Button>
                <Button
                  onClick={() => processPayout.mutate({
                    id: selectedPayout.id,
                    action: "approve",
                  })}
                  disabled={processPayout.isPending}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Approve
                </Button>
              </>
            )}
            {selectedPayout?.status === "approved" && (
              <Button
                onClick={() => processPayout.mutate({
                  id: selectedPayout.id,
                  action: "pay",
                  transactionId: `TXN${Date.now()}`,
                })}
                disabled={processPayout.isPending}
                className="bg-green-600 hover:bg-green-700"
              >
                <IndianRupee className="w-4 h-4 mr-1" />
                {processPayout.isPending ? "Processing..." : "Mark as Paid"}
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
