import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Mail, Send, Users, FileText, Zap, BarChart3, Settings,
  Plus, Search, Eye, Edit, Trash2, Copy,
  CheckCircle, Clock, AlertCircle, TrendingUp,
  MousePointerClick, Sparkles,
  Target, RefreshCw, Upload, Loader2
} from "lucide-react";
import type { EmailTemplate, EmailCampaign, EmailSegment, EmailAutomation } from "@shared/schema";

type SubTab = "dashboard" | "templates" | "campaigns" | "segments" | "automations" | "settings";

interface EmailStats {
  totalSent: number;
  delivered: number;
  opened: number;
  clicked: number;
  bounced: number;
  unsubscribed: number;
  openRate: number;
  clickRate: number;
  bounceRate: number;
}

export default function EmailMarketingTab() {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  
  // Dialog states
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [showCampaignDialog, setShowCampaignDialog] = useState(false);
  const [showSegmentDialog, setShowSegmentDialog] = useState(false);
  const [showAutomationDialog, setShowAutomationDialog] = useState(false);
  
  // Form states
  const [templateForm, setTemplateForm] = useState({
    name: "",
    slug: "",
    subject: "",
    category: "marketing",
    type: "marketing" as "transactional" | "marketing",
    htmlBody: "",
    textBody: "",
    variables: [] as string[],
  });
  
  const [campaignForm, setCampaignForm] = useState({
    name: "",
    subject: "",
    type: "one-time" as "one-time" | "recurring" | "triggered",
    templateId: null as number | null,
    segmentId: null as number | null,
  });
  
  const [segmentForm, setSegmentForm] = useState({
    name: "",
    description: "",
    type: "dynamic" as "dynamic" | "static",
    audienceType: "students" as "students" | "schools" | "partners" | "all",
    filterRules: {},
  });
  
  const [automationForm, setAutomationForm] = useState({
    name: "",
    description: "",
    triggerType: "registration" as string,
    triggerConfig: {},
  });

  // Queries
  const { data: templates = [], isLoading: templatesLoading } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/admin/email/templates"],
  });

  const { data: campaigns = [], isLoading: campaignsLoading } = useQuery<EmailCampaign[]>({
    queryKey: ["/api/admin/email/campaigns"],
  });

  const { data: segments = [], isLoading: segmentsLoading } = useQuery<EmailSegment[]>({
    queryKey: ["/api/admin/email/segments"],
  });

  const { data: automations = [], isLoading: automationsLoading } = useQuery<EmailAutomation[]>({
    queryKey: ["/api/admin/email/automations"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<EmailStats>({
    queryKey: ["/api/admin/email/stats"],
  });

  // Mutations
  const createTemplateMutation = useMutation({
    mutationFn: async (data: typeof templateForm) => {
      return apiRequest("POST", "/api/admin/email/templates", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/templates"] });
      setShowTemplateDialog(false);
      setTemplateForm({ name: "", slug: "", subject: "", category: "marketing", type: "marketing", htmlBody: "", textBody: "", variables: [] });
      toast({ title: "Template created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create template", variant: "destructive" });
    },
  });

  const deleteTemplateMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/email/templates/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/templates"] });
      toast({ title: "Template deleted" });
    },
  });

  const createCampaignMutation = useMutation({
    mutationFn: async (data: typeof campaignForm) => {
      return apiRequest("POST", "/api/admin/email/campaigns", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/campaigns"] });
      setShowCampaignDialog(false);
      setCampaignForm({ name: "", subject: "", type: "one-time", templateId: null, segmentId: null });
      toast({ title: "Campaign created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create campaign", variant: "destructive" });
    },
  });

  const deleteCampaignMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/email/campaigns/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/campaigns"] });
      toast({ title: "Campaign deleted" });
    },
  });

  const createSegmentMutation = useMutation({
    mutationFn: async (data: typeof segmentForm) => {
      return apiRequest("POST", "/api/admin/email/segments", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/segments"] });
      setShowSegmentDialog(false);
      setSegmentForm({ name: "", description: "", type: "dynamic", audienceType: "students", filterRules: {} });
      toast({ title: "Segment created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create segment", variant: "destructive" });
    },
  });

  const deleteSegmentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/email/segments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/segments"] });
      toast({ title: "Segment deleted" });
    },
  });

  const createAutomationMutation = useMutation({
    mutationFn: async (data: typeof automationForm) => {
      return apiRequest("POST", "/api/admin/email/automations", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/automations"] });
      setShowAutomationDialog(false);
      setAutomationForm({ name: "", description: "", triggerType: "registration", triggerConfig: {} });
      toast({ title: "Automation created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create automation", variant: "destructive" });
    },
  });

  const toggleAutomationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/admin/email/automations/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/automations"] });
      toast({ title: "Automation status updated" });
    },
  });

  const deleteAutomationMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/email/automations/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/email/automations"] });
      toast({ title: "Automation deleted" });
    },
  });

  const subTabs = [
    { id: "dashboard" as SubTab, label: "Dashboard", icon: BarChart3 },
    { id: "templates" as SubTab, label: "Templates", icon: FileText },
    { id: "campaigns" as SubTab, label: "Campaigns", icon: Send },
    { id: "segments" as SubTab, label: "Audiences", icon: Users },
    { id: "automations" as SubTab, label: "Automations", icon: Zap },
    { id: "settings" as SubTab, label: "Settings", icon: Settings },
  ];

  const renderDashboard = () => (
    <div className="space-y-6">
      {statsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Sent</p>
                    <p className="text-2xl font-bold" data-testid="text-total-sent">{stats?.totalSent?.toLocaleString() || 0}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <Send className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Open Rate</p>
                    <p className="text-2xl font-bold" data-testid="text-open-rate">{stats?.openRate?.toFixed(1) || 0}%</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                    <Eye className="w-5 h-5 text-green-600" />
                  </div>
                </div>
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <TrendingUp className="w-4 h-4 mr-1" />
                  Industry avg: 21.5%
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Click Rate</p>
                    <p className="text-2xl font-bold" data-testid="text-click-rate">{stats?.clickRate?.toFixed(1) || 0}%</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                    <MousePointerClick className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Bounce Rate</p>
                    <p className="text-2xl font-bold" data-testid="text-bounce-rate">{stats?.bounceRate?.toFixed(1) || 0}%</p>
                  </div>
                  <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/20">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Send className="w-5 h-5" />
                  Recent Campaigns
                </CardTitle>
              </CardHeader>
              <CardContent>
                {campaigns.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Mail className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No campaigns yet</p>
                    <Button className="mt-4" onClick={() => setActiveSubTab("campaigns")} data-testid="button-goto-campaigns">
                      Create Campaign
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {campaigns.slice(0, 5).map((campaign) => (
                      <div key={campaign.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid={`campaign-item-${campaign.id}`}>
                        <div>
                          <p className="font-medium">{campaign.name}</p>
                          <p className="text-sm text-muted-foreground">{campaign.type}</p>
                        </div>
                        <Badge variant={
                          campaign.status === "sent" ? "default" :
                          campaign.status === "sending" ? "secondary" :
                          campaign.status === "scheduled" ? "outline" : "secondary"
                        }>
                          {campaign.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="w-5 h-5" />
                  Active Automations
                </CardTitle>
              </CardHeader>
              <CardContent>
                {automations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Zap className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No automations configured</p>
                    <Button className="mt-4" onClick={() => setActiveSubTab("automations")} data-testid="button-goto-automations">
                      Create Automation
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {automations.slice(0, 5).map((automation) => (
                      <div key={automation.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid={`automation-item-${automation.id}`}>
                        <div>
                          <p className="font-medium">{automation.name}</p>
                          <p className="text-sm text-muted-foreground">Trigger: {automation.triggerType}</p>
                        </div>
                        <Badge variant={automation.isActive ? "default" : "secondary"}>
                          {automation.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-purple-500" />
                AI Insights
              </CardTitle>
              <CardDescription>AI-powered recommendations to improve your email performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Best Send Time
                  </h4>
                  <p className="text-2xl font-bold mt-2">10:00 AM</p>
                  <p className="text-sm text-muted-foreground">Tuesday & Thursday</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Target className="w-4 h-4" />
                    Top Performing Subject
                  </h4>
                  <p className="text-sm mt-2 font-medium">"Last chance to register!"</p>
                  <p className="text-sm text-muted-foreground">45% open rate</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Users className="w-4 h-4" />
                    Most Engaged Segment
                  </h4>
                  <p className="text-sm mt-2 font-medium">Class 10 Students</p>
                  <p className="text-sm text-muted-foreground">38% click rate</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const renderTemplates = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-templates"
          />
        </div>
        <Button onClick={() => setShowTemplateDialog(true)} data-testid="button-create-template">
          <Plus className="w-4 h-4 mr-2" />
          Create Template
        </Button>
      </div>

      {templatesLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : templates.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <FileText className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No templates yet</h3>
            <p className="text-muted-foreground mb-4">Create your first email template to get started</p>
            <Button onClick={() => setShowTemplateDialog(true)} data-testid="button-create-template-empty">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates
            .filter(t => t.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((template) => (
              <Card key={template.id} className="hover-elevate" data-testid={`template-card-${template.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base">{template.name}</CardTitle>
                      <CardDescription className="text-xs mt-1">{template.category}</CardDescription>
                    </div>
                    <Badge variant={template.type === "transactional" ? "default" : "secondary"}>
                      {template.type}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">{template.subject}</p>
                  <div className="flex items-center gap-2 mt-4">
                    <Button size="sm" variant="ghost" data-testid={`button-preview-template-${template.id}`}>
                      <Eye className="w-4 h-4 mr-1" />
                      Preview
                    </Button>
                    <Button size="sm" variant="ghost" data-testid={`button-edit-template-${template.id}`}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => deleteTemplateMutation.mutate(template.id)}
                      data-testid={`button-delete-template-${template.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );

  const renderCampaigns = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search campaigns..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
              data-testid="input-search-campaigns"
            />
          </div>
          <Select defaultValue="all">
            <SelectTrigger className="w-40" data-testid="select-campaign-status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="scheduled">Scheduled</SelectItem>
              <SelectItem value="sending">Sending</SelectItem>
              <SelectItem value="sent">Sent</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button onClick={() => setShowCampaignDialog(true)} data-testid="button-create-campaign">
          <Plus className="w-4 h-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {campaignsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : campaigns.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Send className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
            <p className="text-muted-foreground mb-4">Create your first email campaign to reach your audience</p>
            <Button onClick={() => setShowCampaignDialog(true)} data-testid="button-create-campaign-empty">
              <Plus className="w-4 h-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {campaigns
            .filter(c => c.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((campaign) => (
              <Card key={campaign.id} data-testid={`campaign-card-${campaign.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`p-2 rounded-lg ${
                        campaign.status === "sent" ? "bg-green-100 dark:bg-green-900/20" :
                        campaign.status === "sending" ? "bg-blue-100 dark:bg-blue-900/20" :
                        campaign.status === "scheduled" ? "bg-yellow-100 dark:bg-yellow-900/20" :
                        "bg-gray-100 dark:bg-gray-900/20"
                      }`}>
                        <Mail className={`w-5 h-5 ${
                          campaign.status === "sent" ? "text-green-600" :
                          campaign.status === "sending" ? "text-blue-600" :
                          campaign.status === "scheduled" ? "text-yellow-600" :
                          "text-gray-600"
                        }`} />
                      </div>
                      <div>
                        <h4 className="font-semibold">{campaign.name}</h4>
                        <p className="text-sm text-muted-foreground">{campaign.subject || "No subject"}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-lg font-bold">{campaign.totalRecipients || 0}</p>
                        <p className="text-xs text-muted-foreground">Recipients</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{campaign.openedCount || 0}</p>
                        <p className="text-xs text-muted-foreground">Opens</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold">{campaign.clickedCount || 0}</p>
                        <p className="text-xs text-muted-foreground">Clicks</p>
                      </div>
                      <Badge variant={
                        campaign.status === "sent" ? "default" :
                        campaign.status === "sending" ? "secondary" :
                        campaign.status === "scheduled" ? "outline" : "secondary"
                      }>
                        {campaign.status}
                      </Badge>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        onClick={() => deleteCampaignMutation.mutate(campaign.id)}
                        data-testid={`button-delete-campaign-${campaign.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );

  const renderSegments = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search segments..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-segments"
          />
        </div>
        <div className="flex gap-2">
          <Button variant="outline" data-testid="button-import-csv">
            <Upload className="w-4 h-4 mr-2" />
            Import CSV
          </Button>
          <Button onClick={() => setShowSegmentDialog(true)} data-testid="button-create-segment">
            <Plus className="w-4 h-4 mr-2" />
            Create Segment
          </Button>
        </div>
      </div>

      {segmentsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <Card className="border-dashed border-2 hover-elevate cursor-pointer" onClick={() => setShowSegmentDialog(true)} data-testid="button-create-segment-card">
            <CardContent className="py-8 text-center">
              <div className="p-3 rounded-full bg-primary/10 w-fit mx-auto mb-3">
                <Plus className="w-6 h-6 text-primary" />
              </div>
              <h4 className="font-semibold">Create New Segment</h4>
              <p className="text-sm text-muted-foreground mt-1">Build a custom audience</p>
            </CardContent>
          </Card>

          {segments
            .filter(s => s.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((segment) => (
              <Card key={segment.id} className="hover-elevate" data-testid={`segment-card-${segment.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <CardTitle className="text-base">{segment.name}</CardTitle>
                    <Badge variant="outline">{segment.type}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <span className="text-2xl font-bold">{(segment.estimatedCount || 0).toLocaleString()}</span>
                    </div>
                    <Badge variant="secondary">{segment.audienceType}</Badge>
                  </div>
                  <div className="flex items-center gap-2 mt-4">
                    <Button size="sm" variant="ghost" data-testid={`button-edit-segment-${segment.id}`}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" data-testid={`button-refresh-segment-${segment.id}`}>
                      <RefreshCw className="w-4 h-4 mr-1" />
                      Refresh
                    </Button>
                    <Button 
                      size="sm" 
                      variant="ghost"
                      onClick={() => deleteSegmentMutation.mutate(segment.id)}
                      data-testid={`button-delete-segment-${segment.id}`}
                    >
                      <Trash2 className="w-4 h-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );

  const renderAutomations = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search automations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-automations"
          />
        </div>
        <Button onClick={() => setShowAutomationDialog(true)} data-testid="button-create-automation">
          <Plus className="w-4 h-4 mr-2" />
          Create Automation
        </Button>
      </div>

      {automationsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : automations.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No automations yet</h3>
            <p className="text-muted-foreground mb-4">Create automated email workflows to engage your audience</p>
            <Button onClick={() => setShowAutomationDialog(true)} data-testid="button-create-automation-empty">
              <Plus className="w-4 h-4 mr-2" />
              Create Automation
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {automations
            .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((automation) => (
              <Card key={automation.id} data-testid={`automation-card-${automation.id}`}>
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-base flex items-center gap-2">
                        <Zap className={`w-4 h-4 ${automation.isActive ? "text-green-500" : "text-gray-400"}`} />
                        {automation.name}
                      </CardTitle>
                      <CardDescription>Trigger: {automation.triggerType}</CardDescription>
                    </div>
                    <Switch 
                      checked={automation.isActive || false} 
                      onCheckedChange={() => toggleAutomationMutation.mutate(automation.id)}
                      data-testid={`switch-automation-${automation.id}`}
                    />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-muted-foreground">{automation.description || "No description"}</p>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline" data-testid={`button-edit-automation-${automation.id}`}>
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost"
                        onClick={() => deleteAutomationMutation.mutate(automation.id)}
                        data-testid={`button-delete-automation-${automation.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Automation Templates</CardTitle>
          <CardDescription>Quick-start with pre-built automation workflows</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: "Welcome Series", desc: "3-email series for new registrations", trigger: "registration" },
              { name: "Exam Reminder Flow", desc: "Multi-touch reminders before exam", trigger: "exam-scheduled" },
              { name: "Post-Exam Follow-up", desc: "Results and certificate delivery", trigger: "exam-attempted" },
              { name: "Re-engagement", desc: "Win back inactive users", trigger: "manual" },
              { name: "Partner Onboarding", desc: "Welcome new partners", trigger: "partner-onboarding" },
              { name: "Birthday Wishes", desc: "Personalized birthday emails", trigger: "manual" },
            ].map((template, idx) => (
              <div 
                key={idx} 
                className="p-4 rounded-lg border hover-elevate cursor-pointer"
                onClick={() => {
                  setAutomationForm({
                    name: template.name,
                    description: template.desc,
                    triggerType: template.trigger,
                    triggerConfig: {},
                  });
                  setShowAutomationDialog(true);
                }}
                data-testid={`automation-template-${idx}`}
              >
                <h4 className="font-semibold">{template.name}</h4>
                <p className="text-sm text-muted-foreground mt-1">{template.desc}</p>
                <Badge variant="outline" className="mt-2">{template.trigger}</Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <Card className="bg-muted/50">
        <CardContent className="py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Settings className="w-5 h-5 text-muted-foreground" />
              <div>
                <p className="font-medium">Email Provider Configuration</p>
                <p className="text-sm text-muted-foreground">
                  Email providers (AWS SES, SendGrid, Mailgun) are configured in Global Settings
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sender Identity</CardTitle>
          <CardDescription>Configure your default sender information</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>From Name</Label>
              <Input defaultValue="Samikaran Olympiad" className="mt-1" data-testid="input-from-name" />
            </div>
            <div>
              <Label>From Email</Label>
              <Input defaultValue="noreply@samikaran.in" className="mt-1" data-testid="input-from-email" />
            </div>
            <div>
              <Label>Reply-To Email</Label>
              <Input defaultValue="support@samikaran.in" className="mt-1" data-testid="input-reply-to" />
            </div>
            <div>
              <Label>Company Address</Label>
              <Input defaultValue="Mumbai, Maharashtra, India" className="mt-1" data-testid="input-company-address" />
            </div>
          </div>
          <Button data-testid="button-save-sender-settings">
            <CheckCircle className="w-4 h-4 mr-2" />
            Save Settings
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Sending Limits & Throttling</CardTitle>
          <CardDescription>Control email sending rates to maintain deliverability</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Emails per Hour</Label>
              <Input type="number" defaultValue="1000" className="mt-1" data-testid="input-emails-per-hour" />
            </div>
            <div>
              <Label>Daily Limit</Label>
              <Input type="number" defaultValue="50000" className="mt-1" data-testid="input-daily-limit" />
            </div>
            <div>
              <Label>Warm-up Mode</Label>
              <Select defaultValue="off">
                <SelectTrigger className="mt-1" data-testid="select-warmup-mode">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="off">Off</SelectItem>
                  <SelectItem value="slow">Slow (500/day)</SelectItem>
                  <SelectItem value="medium">Medium (2000/day)</SelectItem>
                  <SelectItem value="fast">Fast (5000/day)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button data-testid="button-save-limits">
            <CheckCircle className="w-4 h-4 mr-2" />
            Save Limits
          </Button>
        </CardContent>
      </Card>
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2">
            <Mail className="w-6 h-6" />
            Email Marketing
          </h2>
          <p className="text-muted-foreground">Manage campaigns, automations, and email analytics</p>
        </div>
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {subTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeSubTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveSubTab(tab.id)}
            className="flex items-center gap-2"
            data-testid={`tab-email-${tab.id}`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </Button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={activeSubTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeSubTab === "dashboard" && renderDashboard()}
          {activeSubTab === "templates" && renderTemplates()}
          {activeSubTab === "campaigns" && renderCampaigns()}
          {activeSubTab === "segments" && renderSegments()}
          {activeSubTab === "automations" && renderAutomations()}
          {activeSubTab === "settings" && renderSettings()}
        </motion.div>
      </AnimatePresence>

      {/* Create Template Dialog */}
      <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Create Email Template</DialogTitle>
            <DialogDescription>Create a reusable email template for your campaigns</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template Name</Label>
                <Input
                  value={templateForm.name}
                  onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="e.g., Welcome Email"
                  className="mt-1"
                  data-testid="input-template-name"
                />
              </div>
              <div>
                <Label>Slug</Label>
                <Input
                  value={templateForm.slug}
                  onChange={(e) => setTemplateForm({ ...templateForm, slug: e.target.value })}
                  placeholder="e.g., welcome-email"
                  className="mt-1"
                  data-testid="input-template-slug"
                />
              </div>
            </div>
            <div>
              <Label>Subject Line</Label>
              <Input
                value={templateForm.subject}
                onChange={(e) => setTemplateForm({ ...templateForm, subject: e.target.value })}
                placeholder="e.g., Welcome to Samikaran Olympiad!"
                className="mt-1"
                data-testid="input-template-subject"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Category</Label>
                <Select value={templateForm.category} onValueChange={(v) => setTemplateForm({ ...templateForm, category: v })}>
                  <SelectTrigger className="mt-1" data-testid="select-template-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                    <SelectItem value="notification">Notification</SelectItem>
                    <SelectItem value="system">System</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Type</Label>
                <Select value={templateForm.type} onValueChange={(v: "transactional" | "marketing") => setTemplateForm({ ...templateForm, type: v })}>
                  <SelectTrigger className="mt-1" data-testid="select-template-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="marketing">Marketing</SelectItem>
                    <SelectItem value="transactional">Transactional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>HTML Body</Label>
              <Textarea
                value={templateForm.htmlBody}
                onChange={(e) => setTemplateForm({ ...templateForm, htmlBody: e.target.value })}
                placeholder="<html>...</html>"
                className="mt-1 min-h-[150px] font-mono text-sm"
                data-testid="textarea-template-html"
              />
            </div>
          </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setShowTemplateDialog(false)} data-testid="button-cancel-template">
              Cancel
            </Button>
            <Button 
              onClick={() => createTemplateMutation.mutate(templateForm)}
              disabled={createTemplateMutation.isPending || !templateForm.name || !templateForm.subject}
              data-testid="button-save-template"
            >
              {createTemplateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Template
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Campaign Dialog */}
      <Dialog open={showCampaignDialog} onOpenChange={setShowCampaignDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Email Campaign</DialogTitle>
            <DialogDescription>Set up a new email campaign to reach your audience</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Campaign Name</Label>
              <Input
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
                placeholder="e.g., March Newsletter"
                className="mt-1"
                data-testid="input-campaign-name"
              />
            </div>
            <div>
              <Label>Subject Line</Label>
              <Input
                value={campaignForm.subject}
                onChange={(e) => setCampaignForm({ ...campaignForm, subject: e.target.value })}
                placeholder="e.g., Important updates for March"
                className="mt-1"
                data-testid="input-campaign-subject"
              />
            </div>
            <div>
              <Label>Campaign Type</Label>
              <Select value={campaignForm.type} onValueChange={(v: "one-time" | "recurring" | "triggered") => setCampaignForm({ ...campaignForm, type: v })}>
                <SelectTrigger className="mt-1" data-testid="select-campaign-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="one-time">One-time</SelectItem>
                  <SelectItem value="recurring">Recurring</SelectItem>
                  <SelectItem value="triggered">Triggered</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {templates.length > 0 && (
              <div>
                <Label>Template (Optional)</Label>
                <Select 
                  value={campaignForm.templateId?.toString() || ""} 
                  onValueChange={(v) => setCampaignForm({ ...campaignForm, templateId: v ? parseInt(v) : null })}
                >
                  <SelectTrigger className="mt-1" data-testid="select-campaign-template">
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t) => (
                      <SelectItem key={t.id} value={t.id.toString()}>{t.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCampaignDialog(false)} data-testid="button-cancel-campaign">
              Cancel
            </Button>
            <Button 
              onClick={() => createCampaignMutation.mutate(campaignForm)}
              disabled={createCampaignMutation.isPending || !campaignForm.name}
              data-testid="button-save-campaign"
            >
              {createCampaignMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Campaign
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Segment Dialog */}
      <Dialog open={showSegmentDialog} onOpenChange={setShowSegmentDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Audience Segment</DialogTitle>
            <DialogDescription>Define a segment to target specific audiences</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Segment Name</Label>
              <Input
                value={segmentForm.name}
                onChange={(e) => setSegmentForm({ ...segmentForm, name: e.target.value })}
                placeholder="e.g., Class 10 Students"
                className="mt-1"
                data-testid="input-segment-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={segmentForm.description}
                onChange={(e) => setSegmentForm({ ...segmentForm, description: e.target.value })}
                placeholder="Describe this segment..."
                className="mt-1"
                data-testid="textarea-segment-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Segment Type</Label>
                <Select value={segmentForm.type} onValueChange={(v: "dynamic" | "static") => setSegmentForm({ ...segmentForm, type: v })}>
                  <SelectTrigger className="mt-1" data-testid="select-segment-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dynamic">Dynamic</SelectItem>
                    <SelectItem value="static">Static</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Audience Type</Label>
                <Select value={segmentForm.audienceType} onValueChange={(v: "students" | "schools" | "partners" | "all") => setSegmentForm({ ...segmentForm, audienceType: v })}>
                  <SelectTrigger className="mt-1" data-testid="select-segment-audience">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="students">Students</SelectItem>
                    <SelectItem value="schools">Schools</SelectItem>
                    <SelectItem value="partners">Partners</SelectItem>
                    <SelectItem value="all">All</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowSegmentDialog(false)} data-testid="button-cancel-segment">
              Cancel
            </Button>
            <Button 
              onClick={() => createSegmentMutation.mutate(segmentForm)}
              disabled={createSegmentMutation.isPending || !segmentForm.name}
              data-testid="button-save-segment"
            >
              {createSegmentMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Segment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Automation Dialog */}
      <Dialog open={showAutomationDialog} onOpenChange={setShowAutomationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Email Automation</DialogTitle>
            <DialogDescription>Set up an automated email workflow</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Automation Name</Label>
              <Input
                value={automationForm.name}
                onChange={(e) => setAutomationForm({ ...automationForm, name: e.target.value })}
                placeholder="e.g., Welcome Series"
                className="mt-1"
                data-testid="input-automation-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={automationForm.description}
                onChange={(e) => setAutomationForm({ ...automationForm, description: e.target.value })}
                placeholder="Describe this automation..."
                className="mt-1"
                data-testid="textarea-automation-description"
              />
            </div>
            <div>
              <Label>Trigger Type</Label>
              <Select value={automationForm.triggerType} onValueChange={(v) => setAutomationForm({ ...automationForm, triggerType: v })}>
                <SelectTrigger className="mt-1" data-testid="select-automation-trigger">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="registration">Registration</SelectItem>
                  <SelectItem value="exam-scheduled">Exam Scheduled</SelectItem>
                  <SelectItem value="exam-attempted">Exam Attempted</SelectItem>
                  <SelectItem value="result-published">Result Published</SelectItem>
                  <SelectItem value="certificate-issued">Certificate Issued</SelectItem>
                  <SelectItem value="partner-onboarding">Partner Onboarding</SelectItem>
                  <SelectItem value="manual">Manual Trigger</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAutomationDialog(false)} data-testid="button-cancel-automation">
              Cancel
            </Button>
            <Button 
              onClick={() => createAutomationMutation.mutate(automationForm)}
              disabled={createAutomationMutation.isPending || !automationForm.name}
              data-testid="button-save-automation"
            >
              {createAutomationMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Automation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
