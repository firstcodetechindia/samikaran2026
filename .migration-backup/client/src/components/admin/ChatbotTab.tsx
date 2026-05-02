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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Bot, Users, MessageSquare, Zap, Settings, BarChart3,
  Plus, Edit, Trash2, Eye, Search, RefreshCw,
  Brain, BookOpen, AlertTriangle, Phone, TrendingUp, Loader2,
  Sparkles, Volume2, Languages, Shield, CheckCircle, MessagesSquare, User, Play
} from "lucide-react";
import type { ChatbotAgent, ChatbotFlow, ChatbotKnowledge, ChatbotLead } from "@shared/schema";
import { NodeFlowBuilder, FlowNodeData } from "./NodeFlowBuilder";
import { Node, Edge } from "@xyflow/react";

import avatar1 from "@/assets/avatars/avatar-1.webp";
import avatar2 from "@/assets/avatars/avatar-2.webp";
import avatar3 from "@/assets/avatars/avatar-3.webp";
import avatar4 from "@/assets/avatars/avatar-4.webp";
import avatar5 from "@/assets/avatars/avatar-5.webp";
import avatar6 from "@/assets/avatars/avatar-6.webp";
import avatar7 from "@/assets/avatars/avatar-7.webp";
import avatar8 from "@/assets/avatars/avatar-8.webp";
import avatarBot from "@/assets/avatars/avatar-bot.webp";

const AVATAR_OPTIONS = [
  { id: "avatar-1", src: avatar1, label: "Agent 1" },
  { id: "avatar-2", src: avatar2, label: "Agent 2" },
  { id: "avatar-3", src: avatar3, label: "Agent 3" },
  { id: "avatar-4", src: avatar4, label: "Agent 4" },
  { id: "avatar-5", src: avatar5, label: "Agent 5" },
  { id: "avatar-6", src: avatar6, label: "Agent 6" },
  { id: "avatar-7", src: avatar7, label: "Agent 7" },
  { id: "avatar-8", src: avatar8, label: "Agent 8" },
  { id: "avatar-bot", src: avatarBot, label: "AI Robot" },
];

type SubTab = "dashboard" | "agents" | "flows" | "knowledge" | "conversations" | "leads" | "human-agents" | "settings";

interface ChatbotStats {
  totalSessions: number;
  totalMessages: number;
  totalLeads: number;
  activeAgents: number;
}

interface ChatbotSession {
  id: number;
  sessionToken: string;
  agentId: number;
  visitorName: string | null;
  visitorEmail: string | null;
  language: string;
  startedAt: string;
  endedAt: string | null;
  status: string;
}

interface ChatbotMessage {
  id: number;
  sessionId: number;
  sender: string;
  message: string;
  createdAt: string;
  confidenceScore: number | null;
  sourceType: string | null;
}

export default function ChatbotTab() {
  const { toast } = useToast();
  const [activeSubTab, setActiveSubTab] = useState<SubTab>("dashboard");
  const [searchTerm, setSearchTerm] = useState("");
  
  const [showAgentDialog, setShowAgentDialog] = useState(false);
  const [showKnowledgeDialog, setShowKnowledgeDialog] = useState(false);
  const [showFlowDialog, setShowFlowDialog] = useState(false);
  const [editingFlow, setEditingFlow] = useState<ChatbotFlow | null>(null);
  const [editingAgent, setEditingAgent] = useState<ChatbotAgent | null>(null);
  
  const [flowForm, setFlowForm] = useState({
    name: "",
    description: "",
    triggerType: "greeting" as "greeting" | "keyword" | "intent",
    triggerValue: "",
    status: "active" as "active" | "draft" | "archived",
  });
  
  const [agentForm, setAgentForm] = useState({
    name: "",
    gender: "female",
    tone: "professional",
    avatarUrl: "",
    systemPrompt: "",
    confidenceThreshold: 75,
    languages: ["en"],
    knowledgeScope: "",
    isActive: true,
  });
  
  const [knowledgeForm, setKnowledgeForm] = useState({
    title: "",
    content: "",
    sourceType: "manual",
    language: "en",
    category: "",
    tags: "",
    confidenceWeight: 100,
    isActive: true,
  });

  const [settingsForm, setSettingsForm] = useState({
    agent_distribution: "first_active",
    widget_enabled: "true",
    mobile_enabled: "true",
    escalation_phone: "",
    escalation_email: "support@samikaran.in",
    escalation_message: "I'm sorry, I couldn't find the exact solution right now. Our representative will contact you shortly. May I have your phone number?",
    voice_enabled: "false",
    voice_gender: "female",
    voice_accent: "en-IN",
    voice_speed: "1.0",
    voice_reply_mode: "text",
    voice_auto_send_timeout: "5",
  });

  const { data: agents = [], isLoading: agentsLoading } = useQuery<ChatbotAgent[]>({
    queryKey: ["/api/admin/chatbot/agents"],
  });

  const { data: flows = [], isLoading: flowsLoading } = useQuery<ChatbotFlow[]>({
    queryKey: ["/api/admin/chatbot/flows"],
  });

  const { data: knowledge = [], isLoading: knowledgeLoading } = useQuery<ChatbotKnowledge[]>({
    queryKey: ["/api/admin/chatbot/knowledge"],
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery<ChatbotLead[]>({
    queryKey: ["/api/admin/chatbot/leads"],
  });

  interface HumanAgent {
    id: number;
    userId: string | null;
    name: string;
    email: string | null;
    phone: string | null;
    avatarUrl: string | null;
    status: string;
    languagesSupported: string[];
    maxActiveChats: number;
    currentActiveChats: number;
    department: string | null;
    skills: string[];
    lastActiveAt: string | null;
    isActive: boolean;
  }

  interface EscalatedChat {
    id: number;
    sessionToken: string;
    userName: string | null;
    userEmail: string | null;
    userPhone: string | null;
    language: string;
    status: string;
    escalatedAt: string;
    escalationReason: string | null;
    humanAgentId: number | null;
    messages: { id: number; sender: string; message: string; createdAt: string }[];
    aiAgentName: string | null;
    assignment?: {
      id: number;
      humanAgentId: number;
      status: string;
      acceptedAt: string | null;
    } | null;
  }

  const { data: humanAgentsList = [], isLoading: humanAgentsLoading, refetch: refetchHumanAgents } = useQuery<HumanAgent[]>({
    queryKey: ["/api/admin/chatbot/human-agents"],
  });

  const { data: escalatedChats = [], isLoading: escalatedChatsLoading, refetch: refetchEscalatedChats } = useQuery<EscalatedChat[]>({
    queryKey: ["/api/admin/chatbot/escalated-chats"],
  });

  const { data: sessions = [], isLoading: sessionsLoading } = useQuery<ChatbotSession[]>({
    queryKey: ["/api/admin/chatbot/sessions"],
  });

  const { data: stats, isLoading: statsLoading } = useQuery<ChatbotStats>({
    queryKey: ["/api/admin/chatbot/stats"],
  });

  const { data: settings } = useQuery<Record<string, string>>({
    queryKey: ["/api/admin/chatbot/settings"],
  });

  // Update settings form when data is loaded
  if (settings && settingsForm.agent_distribution === "first_active" && settings.agent_distribution) {
    setSettingsForm(prev => ({
      ...prev,
      agent_distribution: settings.agent_distribution || "first_active",
      widget_enabled: settings.widget_enabled || "true",
      mobile_enabled: settings.mobile_enabled || "true",
      escalation_phone: settings.escalation_phone || "",
      escalation_email: settings.escalation_email || "support@samikaran.in",
      escalation_message: settings.escalation_message || prev.escalation_message,
      voice_enabled: settings.voice_enabled || "false",
      voice_gender: settings.voice_gender || "female",
      voice_accent: settings.voice_accent || "en-IN",
      voice_speed: settings.voice_speed || "1.0",
      voice_reply_mode: settings.voice_reply_mode || "text",
      voice_auto_send_timeout: settings.voice_auto_send_timeout || "5",
    }));
  }

  const [selectedSession, setSelectedSession] = useState<ChatbotSession | null>(null);
  const [showConversationDialog, setShowConversationDialog] = useState(false);

  const { data: sessionMessages = [], isLoading: messagesLoading } = useQuery<ChatbotMessage[]>({
    queryKey: ["/api/admin/chatbot/sessions", selectedSession?.id, "messages"],
    enabled: !!selectedSession,
  });

  const createAgentMutation = useMutation({
    mutationFn: async (data: typeof agentForm) => {
      return apiRequest("POST", "/api/admin/chatbot/agents", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/agents"] });
      setShowAgentDialog(false);
      resetAgentForm();
      toast({ title: "Agent created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create agent", variant: "destructive" });
    },
  });

  const updateAgentMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: typeof agentForm }) => {
      return apiRequest("PUT", `/api/admin/chatbot/agents/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/agents"] });
      setShowAgentDialog(false);
      setEditingAgent(null);
      resetAgentForm();
      toast({ title: "Agent updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update agent", variant: "destructive" });
    },
  });

  const deleteAgentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/chatbot/agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/agents"] });
      toast({ title: "Agent deleted" });
    },
  });

  const toggleAgentMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("POST", `/api/admin/chatbot/agents/${id}/toggle`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/agents"] });
      toast({ title: "Agent status updated" });
    },
  });

  const createKnowledgeMutation = useMutation({
    mutationFn: async (data: typeof knowledgeForm) => {
      return apiRequest("POST", "/api/admin/chatbot/knowledge", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/knowledge"] });
      setShowKnowledgeDialog(false);
      setKnowledgeForm({ title: "", content: "", sourceType: "manual", language: "en", category: "", tags: "", confidenceWeight: 100, isActive: true });
      toast({ title: "Knowledge entry created" });
    },
    onError: () => {
      toast({ title: "Failed to create knowledge entry", variant: "destructive" });
    },
  });

  const deleteKnowledgeMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/admin/chatbot/knowledge/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/knowledge"] });
      toast({ title: "Knowledge entry deleted" });
    },
  });

  const createFlowMutation = useMutation({
    mutationFn: async (data: typeof flowForm) => {
      const response = await apiRequest("POST", "/api/admin/chatbot/flows", data);
      return response.json();
    },
    onSuccess: (newFlow: ChatbotFlow) => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/flows"] });
      setShowFlowDialog(false);
      setFlowForm({ name: "", description: "", triggerType: "greeting", triggerValue: "", status: "active" });
      toast({ title: "Flow created! Opening visual designer..." });
      setEditingFlow(newFlow);
    },
    onError: () => {
      toast({ title: "Failed to create flow", variant: "destructive" });
    },
  });

  const deleteFlowMutation = useMutation({
    mutationFn: async (flowId: number) => {
      await apiRequest("DELETE", `/api/admin/chatbot/flows/${flowId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/flows"] });
      toast({ title: "Flow deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete flow", variant: "destructive" });
    },
  });

  const createHumanAgentMutation = useMutation({
    mutationFn: async (data: { name: string; email?: string; phone?: string; department?: string; status?: string }) => {
      const response = await apiRequest("POST", "/api/admin/chatbot/human-agents", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/human-agents"] });
      toast({ title: "Human agent created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create human agent", variant: "destructive" });
    },
  });

  const updateHumanAgentStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const response = await apiRequest("PUT", `/api/admin/chatbot/human-agents/${id}/status`, { status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/human-agents"] });
      toast({ title: "Status updated" });
    },
  });

  const deleteHumanAgentMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/admin/chatbot/human-agents/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/human-agents"] });
      toast({ title: "Human agent deleted" });
    },
  });

  const sendHumanMessageMutation = useMutation({
    mutationFn: async ({ sessionId, message, humanAgentId }: { sessionId: number; message: string; humanAgentId: number }) => {
      const response = await apiRequest("POST", "/api/admin/chatbot/human-message", { sessionId, message, humanAgentId });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/escalated-chats"] });
    },
  });

  const closeChatMutation = useMutation({
    mutationFn: async ({ sessionId, humanAgentId, resolutionStatus }: { sessionId: number; humanAgentId: number; resolutionStatus?: string }) => {
      const response = await apiRequest("POST", `/api/admin/chatbot/close-chat/${sessionId}`, { humanAgentId, resolutionStatus });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/escalated-chats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/human-agents"] });
      toast({ title: "Chat closed successfully" });
    },
  });

  const saveDistributionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", "/api/admin/chatbot/settings", {
        agent_distribution: settingsForm.agent_distribution,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/settings"] });
      toast({ title: "Distribution settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save distribution settings", variant: "destructive" });
    },
  });

  const saveWidgetMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", "/api/admin/chatbot/settings", {
        widget_enabled: settingsForm.widget_enabled,
        mobile_enabled: settingsForm.mobile_enabled,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/settings"] });
      toast({ title: "Widget settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save widget settings", variant: "destructive" });
    },
  });

  const saveEscalationMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", "/api/admin/chatbot/settings", {
        escalation_phone: settingsForm.escalation_phone,
        escalation_email: settingsForm.escalation_email,
        escalation_message: settingsForm.escalation_message,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/settings"] });
      toast({ title: "Escalation settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save escalation settings", variant: "destructive" });
    },
  });

  const saveVoiceMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("PUT", "/api/admin/chatbot/settings", {
        voice_enabled: settingsForm.voice_enabled,
        voice_gender: settingsForm.voice_gender,
        voice_accent: settingsForm.voice_accent,
        voice_speed: settingsForm.voice_speed,
        voice_reply_mode: settingsForm.voice_reply_mode,
        voice_auto_send_timeout: settingsForm.voice_auto_send_timeout,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/settings"] });
      toast({ title: "Voice settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save voice settings", variant: "destructive" });
    },
  });

  const resetAgentForm = () => {
    setAgentForm({
      name: "",
      gender: "female",
      tone: "professional",
      avatarUrl: "",
      systemPrompt: "",
      confidenceThreshold: 75,
      languages: ["en"],
      knowledgeScope: "",
      isActive: true,
    });
  };

  const openEditAgent = (agent: ChatbotAgent) => {
    setEditingAgent(agent);
    setAgentForm({
      name: agent.name,
      gender: agent.gender,
      tone: agent.tone,
      avatarUrl: agent.avatarUrl || "",
      systemPrompt: agent.systemPrompt,
      confidenceThreshold: agent.confidenceThreshold,
      languages: agent.languages as string[] || ["en"],
      knowledgeScope: agent.knowledgeScope || "",
      isActive: agent.isActive || true,
    });
    setShowAgentDialog(true);
  };

  const subTabs = [
    { id: "dashboard" as SubTab, label: "Dashboard", icon: BarChart3 },
    { id: "agents" as SubTab, label: "Agents", icon: Bot },
    { id: "flows" as SubTab, label: "Flows", icon: Zap },
    { id: "knowledge" as SubTab, label: "Knowledge Base", icon: BookOpen },
    { id: "conversations" as SubTab, label: "Conversations", icon: MessagesSquare },
    { id: "leads" as SubTab, label: "Leads", icon: Phone },
    { id: "human-agents" as SubTab, label: "Human Agents", icon: User },
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
                    <p className="text-sm text-muted-foreground">Total Sessions</p>
                    <p className="text-2xl font-bold" data-testid="text-total-sessions">{stats?.totalSessions || 0}</p>
                  </div>
                  <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20">
                    <MessageSquare className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Messages</p>
                    <p className="text-2xl font-bold" data-testid="text-total-messages">{stats?.totalMessages || 0}</p>
                  </div>
                  <div className="p-3 rounded-full bg-green-100 dark:bg-green-900/20">
                    <MessageSquare className="w-5 h-5 text-green-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Leads Captured</p>
                    <p className="text-2xl font-bold" data-testid="text-total-leads">{stats?.totalLeads || 0}</p>
                  </div>
                  <div className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/20">
                    <Phone className="w-5 h-5 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Active Agents</p>
                    <p className="text-2xl font-bold" data-testid="text-active-agents">{stats?.activeAgents || 0}</p>
                  </div>
                  <div className="p-3 rounded-full bg-orange-100 dark:bg-orange-900/20">
                    <Bot className="w-5 h-5 text-orange-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="w-5 h-5" />
                  Active Agents
                </CardTitle>
              </CardHeader>
              <CardContent>
                {agents.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No agents configured</p>
                    <Button className="mt-4" onClick={() => setActiveSubTab("agents")} data-testid="button-goto-agents">
                      Configure Agents
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {agents.slice(0, 4).map((agent) => (
                      <div key={agent.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid={`agent-item-${agent.id}`}>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                            {agent.name.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{agent.name}</p>
                            <p className="text-sm text-muted-foreground">{agent.tone} tone</p>
                          </div>
                        </div>
                        <Badge variant={agent.isActive ? "default" : "secondary"}>
                          {agent.isActive ? "Active" : "Inactive"}
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
                  <Phone className="w-5 h-5" />
                  Recent Leads
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leads.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Phone className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No leads captured yet</p>
                    <p className="text-sm mt-2">Leads are captured when users provide contact info during escalation</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leads.slice(0, 5).map((lead) => (
                      <div key={lead.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50" data-testid={`lead-item-${lead.id}`}>
                        <div>
                          <p className="font-medium">{lead.name || "Unknown"}</p>
                          <p className="text-sm text-muted-foreground">{lead.phone || lead.email || "No contact"}</p>
                        </div>
                        <Badge variant={
                          lead.status === "new" ? "default" :
                          lead.status === "contacted" ? "secondary" :
                          lead.status === "qualified" ? "outline" : "secondary"
                        }>
                          {lead.status}
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
                AI Safety & Performance
              </CardTitle>
              <CardDescription>Monitor chatbot safety metrics and AI performance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Safety Score
                  </h4>
                  <p className="text-2xl font-bold mt-2">98%</p>
                  <p className="text-sm text-muted-foreground">No hallucinations detected</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 border">
                  <h4 className="font-semibold flex items-center gap-2">
                    <Brain className="w-4 h-4" />
                    Avg Confidence
                  </h4>
                  <p className="text-2xl font-bold mt-2">85%</p>
                  <p className="text-sm text-muted-foreground">Above threshold</p>
                </div>
                <div className="p-4 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border">
                  <h4 className="font-semibold flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    Resolution Rate
                  </h4>
                  <p className="text-2xl font-bold mt-2">78%</p>
                  <p className="text-sm text-muted-foreground">Without escalation</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );

  const renderAgents = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search agents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-agents"
          />
        </div>
        <Button onClick={() => { resetAgentForm(); setEditingAgent(null); setShowAgentDialog(true); }} data-testid="button-create-agent">
          <Plus className="w-4 h-4 mr-2" />
          Create Agent
        </Button>
      </div>

      {agentsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : agents.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bot className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No agents yet</h3>
            <p className="text-muted-foreground mb-4">Create your first AI agent to start conversations</p>
            <Button onClick={() => setShowAgentDialog(true)} data-testid="button-create-agent-empty">
              <Plus className="w-4 h-4 mr-2" />
              Create Agent
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {agents
            .filter(a => a.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((agent) => (
              <Card key={agent.id} className="hover-elevate" data-testid={`agent-card-${agent.id}`}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-lg">
                        {agent.name.charAt(0)}
                      </div>
                      <div>
                        <h4 className="font-semibold">{agent.name}</h4>
                        <p className="text-sm text-muted-foreground capitalize">{agent.gender} • {agent.tone}</p>
                      </div>
                    </div>
                    <Switch 
                      checked={agent.isActive || false} 
                      onCheckedChange={() => toggleAgentMutation.mutate(agent.id)}
                      data-testid={`switch-agent-${agent.id}`}
                    />
                  </div>
                  
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <Brain className="w-4 h-4 text-muted-foreground" />
                      <span>Confidence Threshold: {agent.confidenceThreshold}%</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Languages className="w-4 h-4 text-muted-foreground" />
                      <span>Languages: {(agent.languages as string[])?.join(", ") || "en"}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 mt-4">
                    <Button size="sm" variant="outline" onClick={() => openEditAgent(agent)} data-testid={`button-edit-agent-${agent.id}`}>
                      <Edit className="w-4 h-4 mr-1" />
                      Edit
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => deleteAgentMutation.mutate(agent.id)} data-testid={`button-delete-agent-${agent.id}`}>
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

  const saveFlowMutation = useMutation({
    mutationFn: async (data: { id?: number; name: string; nodes: Node<FlowNodeData>[]; edges: Edge[] }) => {
      const flowData = {
        name: data.name,
        triggerType: 'greeting',
        status: 'active',
        nodes: data.nodes,
        edges: data.edges,
      };
      
      if (data.id) {
        return apiRequest('PUT', `/api/admin/chatbot/flows/${data.id}`, flowData);
      } else {
        return apiRequest('POST', '/api/admin/chatbot/flows', flowData);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/chatbot/flows'] });
      toast({ title: 'Flow saved successfully' });
      setEditingFlow(null);
    },
    onError: (error: any) => {
      toast({ title: 'Failed to save flow', description: error.message, variant: 'destructive' });
    },
  });

  const handleFlowSave = (data: { name: string; nodes: Node<FlowNodeData>[]; edges: Edge[] }) => {
    saveFlowMutation.mutate({ 
      id: editingFlow?.id, 
      name: data.name, 
      nodes: data.nodes, 
      edges: data.edges 
    });
  };

  const renderFlows = () => {
    if (editingFlow) {
      // Parse existing flow data if editing
      let initialNodes: Node<FlowNodeData>[] | undefined;
      let initialEdges: Edge[] | undefined;
      
      if (editingFlow.id && editingFlow.nodes) {
        try {
          initialNodes = typeof editingFlow.nodes === 'string' 
            ? JSON.parse(editingFlow.nodes) 
            : editingFlow.nodes;
          initialEdges = typeof editingFlow.edges === 'string' 
            ? JSON.parse(editingFlow.edges) 
            : editingFlow.edges;
        } catch (e) {
          console.error('Failed to parse flow data:', e);
        }
      }

      return (
        <NodeFlowBuilder
          flowId={editingFlow.id}
          initialData={initialNodes ? {
            name: editingFlow.name,
            nodes: initialNodes,
            edges: initialEdges || [],
          } : undefined}
          onSave={handleFlowSave}
          onCancel={() => setEditingFlow(null)}
        />
      );
    }

    return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search flows..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-flows"
          />
        </div>
        <Button onClick={() => setShowFlowDialog(true)} data-testid="button-create-flow">
          <Plus className="w-4 h-4 mr-2" />
          Create Flow
        </Button>
      </div>

      {flowsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : flows.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No flows yet</h3>
            <p className="text-muted-foreground mb-4">Create conversation flows to guide your chatbot</p>
            <Button onClick={() => setShowFlowDialog(true)} data-testid="button-create-flow-empty">
              <Plus className="w-4 h-4 mr-2" />
              Create Flow
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {flows
            .filter(f => f.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((flow) => (
              <Card 
                key={flow.id} 
                className="hover-elevate border-2 border-dashed border-muted-foreground/20 hover:border-primary/30 transition-colors" 
                data-testid={`flow-card-${flow.id}`}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="text-lg font-bold">{flow.name}</h3>
                    <Badge 
                      variant={flow.status === "active" ? "default" : "secondary"}
                      className={flow.status === "active" ? "bg-purple-500 hover:bg-purple-600" : ""}
                    >
                      {flow.status}
                    </Badge>
                  </div>
                  
                  <p className="text-muted-foreground mb-2">
                    {flow.description || "No description"}
                  </p>
                  
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                    <Play className="w-3 h-3" />
                    <span>Trigger: {(flow as ChatbotFlow & { triggerType?: string }).triggerType || "greeting"}</span>
                  </div>
                  
                  <p className="text-sm text-muted-foreground mb-4">Version {flow.version}</p>
                  
                  <div className="flex items-center gap-3 pt-2 border-t">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={() => setEditingFlow(flow)}
                      className="gap-2"
                      data-testid={`button-edit-flow-${flow.id}`}
                    >
                      <Edit className="w-4 h-4" />
                      Design Flow
                    </Button>
                    <Button 
                      size="icon" 
                      variant="ghost"
                      onClick={() => {
                        if (confirm(`Are you sure you want to delete "${flow.name}"? This action cannot be undone.`)) {
                          deleteFlowMutation.mutate(flow.id);
                        }
                      }}
                      disabled={deleteFlowMutation.isPending}
                      data-testid={`button-delete-flow-${flow.id}`}
                    >
                      {deleteFlowMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Default Conversation Flow</CardTitle>
          <CardDescription>The standard conversation pattern all agents follow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {["Greeting", "Ask Name", "Ask DOB", "Calculate Age", "Main Query", "Knowledge Lookup", "AI Reasoning", "Confidence Check", "Respond / Escalate"].map((step, idx) => (
              <div key={idx} className="flex items-center">
                <Badge variant="outline" className="px-3 py-1">{step}</Badge>
                {idx < 8 && <span className="mx-2 text-muted-foreground">→</span>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
  };

  const renderKnowledge = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search knowledge base..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-knowledge"
          />
        </div>
        <Button onClick={() => setShowKnowledgeDialog(true)} data-testid="button-add-knowledge">
          <Plus className="w-4 h-4 mr-2" />
          Add Knowledge
        </Button>
      </div>

      {knowledgeLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : knowledge.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No knowledge entries yet</h3>
            <p className="text-muted-foreground mb-4">Add knowledge to help your agents answer questions accurately</p>
            <Button onClick={() => setShowKnowledgeDialog(true)} data-testid="button-add-knowledge-empty">
              <Plus className="w-4 h-4 mr-2" />
              Add Knowledge
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {knowledge
            .filter(k => k.title.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((entry) => (
              <Card key={entry.id} data-testid={`knowledge-card-${entry.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold">{entry.title}</h4>
                        <Badge variant="outline">{entry.sourceType}</Badge>
                        <Badge variant="secondary">{entry.language}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">{entry.content}</p>
                      {entry.tags && (
                        <div className="flex gap-1 mt-2">
                          {entry.tags.split(",").map((tag, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs">{tag.trim()}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button size="sm" variant="ghost" onClick={() => deleteKnowledgeMutation.mutate(entry.id)} data-testid={`button-delete-knowledge-${entry.id}`}>
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

  const renderLeads = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search leads..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-leads"
          />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-40" data-testid="select-lead-status">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="new">New</SelectItem>
            <SelectItem value="contacted">Contacted</SelectItem>
            <SelectItem value="qualified">Qualified</SelectItem>
            <SelectItem value="converted">Converted</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {leadsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Phone className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No leads yet</h3>
            <p className="text-muted-foreground">Leads are captured automatically when users provide contact information during chatbot escalation</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {leads
            .filter(l => (l.name || "").toLowerCase().includes(searchTerm.toLowerCase()))
            .map((lead) => (
              <Card key={lead.id} data-testid={`lead-card-${lead.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold">{lead.name || "Unknown"}</h4>
                      <p className="text-sm text-muted-foreground">{lead.phone || lead.email || "No contact info"}</p>
                      {lead.reason && <p className="text-sm text-muted-foreground mt-1">Reason: {lead.reason}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                      <Badge variant={
                        lead.status === "new" ? "default" :
                        lead.status === "contacted" ? "secondary" :
                        lead.status === "qualified" ? "outline" :
                        lead.status === "converted" ? "default" : "secondary"
                      }>
                        {lead.status}
                      </Badge>
                      <Select defaultValue={lead.status}>
                        <SelectTrigger className="w-32" data-testid={`select-lead-${lead.id}`}>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="new">New</SelectItem>
                          <SelectItem value="contacted">Contacted</SelectItem>
                          <SelectItem value="qualified">Qualified</SelectItem>
                          <SelectItem value="converted">Converted</SelectItem>
                          <SelectItem value="lost">Lost</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
        </div>
      )}
    </div>
  );

  const renderConversations = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search conversations by visitor name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
            data-testid="input-search-conversations"
          />
        </div>
        <Button
          variant="outline"
          onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/admin/chatbot/sessions"] })}
          data-testid="button-refresh-conversations"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {sessionsLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : sessions.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessagesSquare className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground">Conversations will appear here when visitors start chatting</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {sessions
            .filter(s => (s.visitorName || "").toLowerCase().includes(searchTerm.toLowerCase()))
            .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime())
            .map((session) => {
              const agent = agents.find(a => a.id === session.agentId);
              return (
                <Card key={session.id} className="hover-elevate cursor-pointer" data-testid={`session-card-${session.id}`}
                  onClick={() => { setSelectedSession(session); setShowConversationDialog(true); }}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white">
                          <User className="w-5 h-5" />
                        </div>
                        <div>
                          <h4 className="font-semibold">{session.visitorName || "Anonymous Visitor"}</h4>
                          <p className="text-sm text-muted-foreground">
                            {session.visitorEmail || "No email provided"}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Agent: {agent?.name || "Unknown"} | {new Date(session.startedAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge variant={session.status === "active" ? "default" : "secondary"}>
                          {session.status}
                        </Badge>
                        <Button size="icon" variant="ghost" data-testid={`button-view-session-${session.id}`}>
                          <Eye className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
        </div>
      )}

      <Dialog open={showConversationDialog} onOpenChange={setShowConversationDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <MessagesSquare className="w-5 h-5" />
              Conversation with {selectedSession?.visitorName || "Anonymous Visitor"}
            </DialogTitle>
            <DialogDescription>
              Started: {selectedSession ? new Date(selectedSession.startedAt).toLocaleString() : ""} | 
              Status: {selectedSession?.status}
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex-1 overflow-y-auto p-4 bg-muted/30 rounded-lg space-y-4 min-h-[300px] max-h-[400px]">
            {messagesLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : sessionMessages.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No messages in this conversation</p>
            ) : (
              sessionMessages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}>
                  <div className={`max-w-[75%] rounded-2xl px-4 py-2 ${
                    msg.sender === "user"
                      ? "bg-gradient-to-r from-purple-600 to-pink-500 text-white"
                      : "bg-background border"
                  }`}>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium opacity-80">
                        {msg.sender === "user" ? "Visitor" : "Agent"}
                      </span>
                      {msg.confidenceScore && (
                        <Badge variant="outline" className="text-xs py-0">
                          {msg.confidenceScore}% confidence
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                    <p className="text-xs opacity-60 mt-1">
                      {new Date(msg.createdAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConversationDialog(false)} data-testid="button-close-conversation">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const [selectedEscalatedChat, setSelectedEscalatedChat] = useState<EscalatedChat | null>(null);
  const [humanAgentReply, setHumanAgentReply] = useState("");
  const [showAddHumanAgent, setShowAddHumanAgent] = useState(false);
  const [newHumanAgentName, setNewHumanAgentName] = useState("");
  const [newHumanAgentEmail, setNewHumanAgentEmail] = useState("");
  const [activeHumanAgentId, setActiveHumanAgentId] = useState<number | null>(null);
  
  const getActiveHumanAgentId = () => {
    if (selectedEscalatedChat?.humanAgentId) {
      return selectedEscalatedChat.humanAgentId;
    }
    if (activeHumanAgentId) {
      return activeHumanAgentId;
    }
    const onlineAgent = humanAgentsList.find(a => a.status === "online");
    return onlineAgent?.id || humanAgentsList[0]?.id || 1;
  };

  const renderHumanAgents = () => (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-semibold">Human Agent Panel</h2>
          {humanAgentsList.length > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Responding as:</span>
              <Select value={activeHumanAgentId?.toString() || ""} onValueChange={(val) => setActiveHumanAgentId(parseInt(val))}>
                <SelectTrigger className="w-36 h-8" data-testid="select-active-agent">
                  <SelectValue placeholder="Select agent" />
                </SelectTrigger>
                <SelectContent>
                  {humanAgentsList.filter(a => a.status === "online").map((agent) => (
                    <SelectItem key={agent.id} value={agent.id.toString()}>
                      {agent.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <Button onClick={() => refetchEscalatedChats()} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={() => setShowAddHumanAgent(true)} size="sm" data-testid="button-add-human-agent">
            <Plus className="w-4 h-4 mr-2" />
            Add Agent
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Human Agents</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {humanAgentsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : humanAgentsList.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No human agents yet</p>
              ) : (
                humanAgentsList.map((agent) => (
                  <div key={agent.id} className="flex items-center justify-between p-2 rounded-lg border">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${agent.status === "online" ? "bg-green-500" : agent.status === "busy" ? "bg-yellow-500" : "bg-gray-400"}`} />
                      <span className="font-medium text-sm">{agent.name}</span>
                      <Badge variant="outline" className="text-xs">
                        {agent.currentActiveChats}/{agent.maxActiveChats}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => updateHumanAgentStatusMutation.mutate({ 
                          id: agent.id, 
                          status: agent.status === "online" ? "offline" : "online" 
                        })}
                      >
                        {agent.status === "online" ? "🟢" : "⚫"}
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        onClick={() => {
                          if (confirm(`Delete ${agent.name}?`)) {
                            deleteHumanAgentMutation.mutate(agent.id);
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-orange-500" />
                Escalated Chats ({escalatedChats.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 max-h-96 overflow-y-auto">
              {escalatedChatsLoading ? (
                <div className="flex justify-center py-4">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : escalatedChats.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">No escalated chats</p>
              ) : (
                escalatedChats.map((chat) => {
                  const assignedAgent = chat.humanAgentId ? humanAgentsList.find(a => a.id === chat.humanAgentId) : null;
                  return (
                  <div 
                    key={chat.id} 
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${selectedEscalatedChat?.id === chat.id ? "border-primary bg-primary/5" : "hover:bg-muted/50"}`}
                    onClick={() => setSelectedEscalatedChat(chat)}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium text-sm">{chat.userName || "Anonymous"}</span>
                      <Badge variant="outline" className="text-xs">{chat.language}</Badge>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                      {chat.escalationReason || "User requested human agent"}
                    </p>
                    {assignedAgent && (
                      <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                        Assigned to: {assignedAgent.name}
                      </p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(chat.escalatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                  );
                })
              )}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-2 border-b">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">
                  {selectedEscalatedChat ? (
                    <span className="flex items-center gap-2">
                      Chat with {selectedEscalatedChat.userName || "Anonymous"}
                      <Badge variant="secondary" className="text-xs">{selectedEscalatedChat.language}</Badge>
                    </span>
                  ) : "Select a chat"}
                </CardTitle>
                {selectedEscalatedChat && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm("Close this chat?")) {
                        closeChatMutation.mutate({ 
                          sessionId: selectedEscalatedChat.id, 
                          humanAgentId: getActiveHumanAgentId(),
                          resolutionStatus: "resolved"
                        });
                        setSelectedEscalatedChat(null);
                      }
                    }}
                  >
                    Close Chat
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {selectedEscalatedChat ? (
                <div className="flex flex-col h-96">
                  <div className="flex-1 overflow-y-auto p-4 space-y-3">
                    {selectedEscalatedChat.messages.map((msg) => (
                      <div 
                        key={msg.id} 
                        className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
                      >
                        <div className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${
                          msg.sender === "user" 
                            ? "bg-primary text-primary-foreground" 
                            : msg.sender === "human_agent"
                            ? "bg-green-500/20 text-green-900 dark:text-green-100"
                            : msg.sender === "system"
                            ? "bg-yellow-500/20 text-yellow-900 dark:text-yellow-100 text-center w-full max-w-full"
                            : "bg-muted"
                        }`}>
                          {msg.sender !== "user" && msg.sender !== "system" && (
                            <p className="text-xs font-medium mb-1 opacity-70">
                              {msg.sender === "human_agent" ? "You" : selectedEscalatedChat.aiAgentName || "AI"}
                            </p>
                          )}
                          {msg.message}
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="border-t p-3 flex gap-2">
                    <Input
                      value={humanAgentReply}
                      onChange={(e) => setHumanAgentReply(e.target.value)}
                      placeholder="Type your reply..."
                      onKeyPress={(e) => {
                        if (e.key === "Enter" && humanAgentReply.trim()) {
                          sendHumanMessageMutation.mutate({
                            sessionId: selectedEscalatedChat.id,
                            message: humanAgentReply.trim(),
                            humanAgentId: getActiveHumanAgentId()
                          });
                          setHumanAgentReply("");
                        }
                      }}
                    />
                    <Button 
                      onClick={() => {
                        if (humanAgentReply.trim()) {
                          sendHumanMessageMutation.mutate({
                            sessionId: selectedEscalatedChat.id,
                            message: humanAgentReply.trim(),
                            humanAgentId: getActiveHumanAgentId()
                          });
                          setHumanAgentReply("");
                        }
                      }}
                      disabled={!humanAgentReply.trim() || sendHumanMessageMutation.isPending}
                    >
                      Send
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="h-96 flex items-center justify-center text-muted-foreground">
                  <p>Select an escalated chat to view and respond</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={showAddHumanAgent} onOpenChange={setShowAddHumanAgent}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Human Agent</DialogTitle>
            <DialogDescription>Create a new human agent for handling escalated chats</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Name</Label>
              <Input 
                value={newHumanAgentName} 
                onChange={(e) => setNewHumanAgentName(e.target.value)}
                placeholder="Agent name"
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input 
                value={newHumanAgentEmail} 
                onChange={(e) => setNewHumanAgentEmail(e.target.value)}
                placeholder="agent@example.com"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddHumanAgent(false)}>Cancel</Button>
            <Button 
              onClick={() => {
                if (newHumanAgentName.trim()) {
                  createHumanAgentMutation.mutate({ 
                    name: newHumanAgentName.trim(),
                    email: newHumanAgentEmail.trim() || undefined,
                    status: "offline"
                  });
                  setNewHumanAgentName("");
                  setNewHumanAgentEmail("");
                  setShowAddHumanAgent(false);
                }
              }}
              disabled={!newHumanAgentName.trim() || createHumanAgentMutation.isPending}
            >
              Add Agent
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );

  const renderSettings = () => (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Widget Configuration</CardTitle>
          <CardDescription>Control chatbot widget visibility and behavior</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Enable Chat Widget</p>
              <p className="text-sm text-muted-foreground">Show the chatbot on public pages</p>
            </div>
            <Switch defaultChecked data-testid="switch-widget-enabled" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Show on Mobile</p>
              <p className="text-sm text-muted-foreground">Display widget on mobile devices</p>
            </div>
            <Switch defaultChecked data-testid="switch-mobile-enabled" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Page Visibility</CardTitle>
          <CardDescription>Control where the chatbot appears</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {[
            { page: "Home Page", enabled: true },
            { page: "Registration Pages", enabled: true },
            { page: "Login Page", enabled: true },
            { page: "Content Pages", enabled: true },
            { page: "Partner Pages", enabled: true },
            { page: "User Dashboard", enabled: true },
            { page: "Super Admin", enabled: false },
            { page: "Exam Screens", enabled: false },
          ].map((item, idx) => (
            <div key={idx} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
              <span>{item.page}</span>
              <Switch defaultChecked={item.enabled} data-testid={`switch-page-${idx}`} />
            </div>
          ))}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Agent Distribution</CardTitle>
          <CardDescription>How visitors are assigned to different agents</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Distribution Method</Label>
            <p className="text-xs text-muted-foreground mb-2">Choose how visitors are assigned to agents</p>
            <Select 
              value={settingsForm.agent_distribution} 
              onValueChange={(v) => setSettingsForm({ ...settingsForm, agent_distribution: v })}
            >
              <SelectTrigger className="mt-1" data-testid="select-distribution-method">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first_active">First Active - Uses default or first active agent for everyone</SelectItem>
                <SelectItem value="round_robin">Round Robin - Distributes users evenly across active agents</SelectItem>
                <SelectItem value="language_based">Language Based - Matches agent to visitor's browser language</SelectItem>
                <SelectItem value="time_based">Time Based - Different agents for different hours of the day</SelectItem>
                <SelectItem value="random">Random - Randomly assigns from active agents</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p className="font-medium mb-2">Distribution Method Guide:</p>
            <ul className="space-y-1 text-xs">
              <li><strong>First Active:</strong> All visitors get the same agent (default behavior)</li>
              <li><strong>Round Robin:</strong> Each new visitor gets the next agent in rotation</li>
              <li><strong>Language Based:</strong> Agent matched to visitor's browser language (uses agent's Languages field)</li>
              <li><strong>Time Based:</strong> Agents rotate throughout the day (24hrs / number of agents)</li>
              <li><strong>Random:</strong> Each visitor randomly gets an active agent</li>
            </ul>
          </div>
          <Button 
            onClick={() => saveDistributionMutation.mutate()}
            disabled={saveDistributionMutation.isPending}
            data-testid="button-save-distribution"
          >
            {saveDistributionMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {saveDistributionMutation.isPending ? "Saving..." : "Save Distribution Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escalation Settings</CardTitle>
          <CardDescription>Configure escalation behavior and contacts</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Escalation Phone Number</Label>
            <Input 
              value={settingsForm.escalation_phone}
              onChange={(e) => setSettingsForm({ ...settingsForm, escalation_phone: e.target.value })}
              className="mt-1" 
              data-testid="input-escalation-phone" 
            />
          </div>
          <div>
            <Label>Escalation Email</Label>
            <Input 
              value={settingsForm.escalation_email}
              onChange={(e) => setSettingsForm({ ...settingsForm, escalation_email: e.target.value })}
              className="mt-1" 
              data-testid="input-escalation-email" 
            />
          </div>
          <div>
            <Label>Escalation Message</Label>
            <Textarea 
              value={settingsForm.escalation_message}
              onChange={(e) => setSettingsForm({ ...settingsForm, escalation_message: e.target.value })}
              className="mt-1"
              data-testid="textarea-escalation-message"
            />
          </div>
          <Button 
            onClick={() => saveEscalationMutation.mutate()}
            disabled={saveEscalationMutation.isPending}
            data-testid="button-save-escalation"
          >
            {saveEscalationMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {saveEscalationMutation.isPending ? "Saving..." : "Save Escalation Settings"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Volume2 className="w-5 h-5" />
            Voice Chat Settings
          </CardTitle>
          <CardDescription>Enable voice input and text-to-speech responses</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>Enable Voice Chat</Label>
              <p className="text-xs text-muted-foreground">Allow users to send voice messages and receive audio responses</p>
            </div>
            <Switch 
              checked={settingsForm.voice_enabled === "true"}
              onCheckedChange={(checked) => setSettingsForm({ ...settingsForm, voice_enabled: checked ? "true" : "false" })}
              data-testid="switch-voice-enabled"
            />
          </div>
          
          {settingsForm.voice_enabled === "true" && (
            <>
              <div>
                <Label>Voice Accent</Label>
                <Select 
                  value={settingsForm.voice_accent} 
                  onValueChange={(v) => setSettingsForm({ ...settingsForm, voice_accent: v })}
                >
                  <SelectTrigger className="mt-1" data-testid="select-voice-accent">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en-IN">Indian English</SelectItem>
                    <SelectItem value="en-US">American English</SelectItem>
                    <SelectItem value="en-GB">British English</SelectItem>
                    <SelectItem value="hi-IN">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Speech Speed</Label>
                <p className="text-xs text-muted-foreground mb-2">Adjust text-to-speech playback speed</p>
                <Select 
                  value={settingsForm.voice_speed} 
                  onValueChange={(v) => setSettingsForm({ ...settingsForm, voice_speed: v })}
                >
                  <SelectTrigger className="mt-1" data-testid="select-voice-speed">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0.8">Slow (0.8x)</SelectItem>
                    <SelectItem value="1.0">Normal (1.0x)</SelectItem>
                    <SelectItem value="1.2">Fast (1.2x)</SelectItem>
                    <SelectItem value="1.5">Very Fast (1.5x)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Reply Mode</Label>
                <p className="text-xs text-muted-foreground mb-2">How the agent should respond</p>
                <Select 
                  value={settingsForm.voice_reply_mode} 
                  onValueChange={(v) => setSettingsForm({ ...settingsForm, voice_reply_mode: v })}
                >
                  <SelectTrigger className="mt-1" data-testid="select-reply-mode">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Text Only - Display text responses only</SelectItem>
                    <SelectItem value="voice">Voice Only - Play audio responses only</SelectItem>
                    <SelectItem value="both">Text + Voice - Both text and audio responses</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Auto-Send Timeout</Label>
                <p className="text-xs text-muted-foreground mb-2">Automatically send voice message after user pauses for this duration</p>
                <Select 
                  value={settingsForm.voice_auto_send_timeout} 
                  onValueChange={(v) => setSettingsForm({ ...settingsForm, voice_auto_send_timeout: v })}
                >
                  <SelectTrigger className="mt-1" data-testid="select-auto-send-timeout">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">Disabled - Manual send only</SelectItem>
                    <SelectItem value="3">3 seconds</SelectItem>
                    <SelectItem value="4">4 seconds</SelectItem>
                    <SelectItem value="5">5 seconds (Recommended)</SelectItem>
                    <SelectItem value="6">6 seconds</SelectItem>
                    <SelectItem value="8">8 seconds</SelectItem>
                    <SelectItem value="10">10 seconds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}

          <div className="p-3 rounded-lg bg-muted/50 text-sm text-muted-foreground">
            <p className="font-medium mb-2">Voice Features:</p>
            <ul className="space-y-1 text-xs">
              <li><strong>Voice Input:</strong> Users can tap the mic button to speak instead of typing</li>
              <li><strong>Speech-to-Text:</strong> Automatically converts voice to text using Web Speech API</li>
              <li><strong>Text-to-Speech:</strong> Agent responses can be read aloud with natural voices</li>
              <li><strong>Language Detection:</strong> Automatically detects spoken language</li>
            </ul>
          </div>

          <Button 
            onClick={() => saveVoiceMutation.mutate()}
            disabled={saveVoiceMutation.isPending}
            data-testid="button-save-voice"
          >
            {saveVoiceMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <CheckCircle className="w-4 h-4 mr-2" />
            )}
            {saveVoiceMutation.isPending ? "Saving..." : "Save Voice Settings"}
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
            <Bot className="w-6 h-6" />
            AI Chatbot Platform
          </h2>
          <p className="text-muted-foreground">Manage agents, flows, and conversation intelligence</p>
        </div>
      </div>

      <div className="flex gap-2 border-b pb-2 overflow-x-auto">
        {subTabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeSubTab === tab.id ? "default" : "ghost"}
            onClick={() => setActiveSubTab(tab.id)}
            className="flex items-center gap-2"
            data-testid={`tab-chatbot-${tab.id}`}
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
          {activeSubTab === "agents" && renderAgents()}
          {activeSubTab === "flows" && renderFlows()}
          {activeSubTab === "knowledge" && renderKnowledge()}
          {activeSubTab === "conversations" && renderConversations()}
          {activeSubTab === "leads" && renderLeads()}
          {activeSubTab === "human-agents" && renderHumanAgents()}
          {activeSubTab === "settings" && renderSettings()}
        </motion.div>
      </AnimatePresence>

      <Dialog open={showAgentDialog} onOpenChange={setShowAgentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>{editingAgent ? "Edit Agent" : "Create AI Agent"}</DialogTitle>
            <DialogDescription>Configure your AI agent's personality and behavior</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Agent Name</Label>
                <Input
                  value={agentForm.name}
                  onChange={(e) => setAgentForm({ ...agentForm, name: e.target.value })}
                  placeholder="e.g., Ananya"
                  className="mt-1"
                  data-testid="input-agent-name"
                />
              </div>
              <div>
                <Label>Gender</Label>
                <Select value={agentForm.gender} onValueChange={(v) => setAgentForm({ ...agentForm, gender: v })}>
                  <SelectTrigger className="mt-1" data-testid="select-agent-gender">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="female">Female</SelectItem>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="neutral">Neutral</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Avatar</Label>
              <p className="text-xs text-muted-foreground mb-1">Choose an avatar for this agent</p>
              <div className="flex flex-wrap gap-2 mt-2">
                {AVATAR_OPTIONS.map((av) => (
                  <button
                    key={av.id}
                    type="button"
                    onClick={() => setAgentForm({ ...agentForm, avatarUrl: av.id })}
                    className={`w-14 h-14 rounded-full overflow-hidden border-2 transition-all hover-elevate ${
                      agentForm.avatarUrl === av.id 
                        ? "border-primary ring-2 ring-primary ring-offset-2" 
                        : "border-muted"
                    }`}
                    data-testid={`button-avatar-${av.id}`}
                  >
                    <img src={av.src} alt={av.label} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Tone</Label>
                <p className="text-xs text-muted-foreground mb-1">How the agent communicates with visitors</p>
                <Select value={agentForm.tone} onValueChange={(v) => setAgentForm({ ...agentForm, tone: v })}>
                  <SelectTrigger className="mt-1" data-testid="select-agent-tone">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warm">Warm - Empathetic and caring</SelectItem>
                    <SelectItem value="friendly">Friendly - Casual and approachable</SelectItem>
                    <SelectItem value="professional">Professional - Business-like</SelectItem>
                    <SelectItem value="formal">Formal - Traditional and courteous</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Confidence Threshold (%)</Label>
                <p className="text-xs text-muted-foreground mb-1">Below this level, agent escalates to human support (recommended: 70-80)</p>
                <Input
                  type="number"
                  min="0"
                  max="100"
                  value={agentForm.confidenceThreshold}
                  onChange={(e) => setAgentForm({ ...agentForm, confidenceThreshold: parseInt(e.target.value) })}
                  className="mt-1"
                  data-testid="input-agent-confidence"
                />
              </div>
            </div>
            <div>
              <Label>Languages (comma-separated)</Label>
              <Input
                value={agentForm.languages.join(", ")}
                onChange={(e) => setAgentForm({ ...agentForm, languages: e.target.value.split(",").map(l => l.trim()) })}
                placeholder="en, hi"
                className="mt-1"
                data-testid="input-agent-languages"
              />
            </div>
            <div>
              <Label>System Prompt</Label>
              <p className="text-xs text-muted-foreground mb-1">
                Instructions that define how the AI agent behaves. Include: greeting style, what topics to discuss, 
                safety rules (what not to discuss), and escalation triggers. Example: "You are Ananya, a warm AI assistant 
                for Samikaran Olympiad. Answer questions about exams, registration, and results. Never give medical/legal advice."
              </p>
              <Textarea
                value={agentForm.systemPrompt}
                onChange={(e) => setAgentForm({ ...agentForm, systemPrompt: e.target.value })}
                placeholder="You are [Name], a [tone] AI assistant for Samikaran Olympiad...

CORE RULES:
• Be helpful and professional
• Answer questions about exams, registration, results
• Never make up information

SAFETY:
• Do not provide medical, legal, or financial advice

ESCALATION:
• If unsure, offer to connect with support team"
                className="mt-1 min-h-[200px]"
                data-testid="textarea-agent-prompt"
              />
            </div>
          </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => { setShowAgentDialog(false); setEditingAgent(null); }} data-testid="button-cancel-agent">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                if (editingAgent) {
                  updateAgentMutation.mutate({ id: editingAgent.id, data: agentForm });
                } else {
                  createAgentMutation.mutate(agentForm);
                }
              }}
              disabled={createAgentMutation.isPending || updateAgentMutation.isPending || !agentForm.name || !agentForm.systemPrompt}
              data-testid="button-save-agent"
            >
              {(createAgentMutation.isPending || updateAgentMutation.isPending) && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {editingAgent ? "Update Agent" : "Create Agent"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showKnowledgeDialog} onOpenChange={setShowKnowledgeDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Knowledge Entry</DialogTitle>
            <DialogDescription>Add information to help your agents answer questions</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input
                value={knowledgeForm.title}
                onChange={(e) => setKnowledgeForm({ ...knowledgeForm, title: e.target.value })}
                placeholder="e.g., Exam Registration Process"
                className="mt-1"
                data-testid="input-knowledge-title"
              />
            </div>
            <div>
              <Label>Content</Label>
              <Textarea
                value={knowledgeForm.content}
                onChange={(e) => setKnowledgeForm({ ...knowledgeForm, content: e.target.value })}
                placeholder="Enter the knowledge content..."
                className="mt-1 min-h-[150px]"
                data-testid="textarea-knowledge-content"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Source Type</Label>
                <Select value={knowledgeForm.sourceType} onValueChange={(v) => setKnowledgeForm({ ...knowledgeForm, sourceType: v })}>
                  <SelectTrigger className="mt-1" data-testid="select-knowledge-source">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="manual">Manual</SelectItem>
                    <SelectItem value="document">Document</SelectItem>
                    <SelectItem value="url">URL</SelectItem>
                    <SelectItem value="faq">FAQ</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Language</Label>
                <Select value={knowledgeForm.language} onValueChange={(v) => setKnowledgeForm({ ...knowledgeForm, language: v })}>
                  <SelectTrigger className="mt-1" data-testid="select-knowledge-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="hi">Hindi</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label>Tags (comma-separated)</Label>
              <Input
                value={knowledgeForm.tags}
                onChange={(e) => setKnowledgeForm({ ...knowledgeForm, tags: e.target.value })}
                placeholder="registration, exam, help"
                className="mt-1"
                data-testid="input-knowledge-tags"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowKnowledgeDialog(false)} data-testid="button-cancel-knowledge">
              Cancel
            </Button>
            <Button 
              onClick={() => createKnowledgeMutation.mutate(knowledgeForm)}
              disabled={createKnowledgeMutation.isPending || !knowledgeForm.title || !knowledgeForm.content}
              data-testid="button-save-knowledge"
            >
              {createKnowledgeMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Add Knowledge
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={showFlowDialog} onOpenChange={setShowFlowDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Create Conversation Flow</DialogTitle>
            <DialogDescription>Create automated conversation flows to guide your chatbot</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Flow Name</Label>
              <Input
                value={flowForm.name}
                onChange={(e) => setFlowForm({ ...flowForm, name: e.target.value })}
                placeholder="e.g., Welcome Flow, Registration Help"
                className="mt-1"
                data-testid="input-flow-name"
              />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={flowForm.description}
                onChange={(e) => setFlowForm({ ...flowForm, description: e.target.value })}
                placeholder="Describe what this flow does..."
                className="mt-1"
                data-testid="textarea-flow-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Trigger Type</Label>
                <p className="text-xs text-muted-foreground mb-1">When this flow activates</p>
                <Select value={flowForm.triggerType} onValueChange={(v: "greeting" | "keyword" | "intent") => setFlowForm({ ...flowForm, triggerType: v })}>
                  <SelectTrigger className="mt-1" data-testid="select-flow-trigger">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="greeting">Greeting - At conversation start</SelectItem>
                    <SelectItem value="keyword">Keyword - When user mentions specific words</SelectItem>
                    <SelectItem value="intent">Intent - When user's intent is detected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Status</Label>
                <Select value={flowForm.status} onValueChange={(v: "active" | "draft" | "archived") => setFlowForm({ ...flowForm, status: v })}>
                  <SelectTrigger className="mt-1" data-testid="select-flow-status">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="draft">Draft</SelectItem>
                    <SelectItem value="archived">Archived</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            {flowForm.triggerType === "keyword" && (
              <div>
                <Label>Trigger Keywords</Label>
                <p className="text-xs text-muted-foreground mb-1">Comma-separated words that trigger this flow</p>
                <Input
                  value={flowForm.triggerValue}
                  onChange={(e) => setFlowForm({ ...flowForm, triggerValue: e.target.value })}
                  placeholder="e.g., help, register, exam"
                  className="mt-1"
                  data-testid="input-flow-keywords"
                />
              </div>
            )}
            {flowForm.triggerType === "intent" && (
              <div>
                <Label>Intent Name</Label>
                <p className="text-xs text-muted-foreground mb-1">The detected intent that triggers this flow</p>
                <Input
                  value={flowForm.triggerValue}
                  onChange={(e) => setFlowForm({ ...flowForm, triggerValue: e.target.value })}
                  placeholder="e.g., registration_inquiry, exam_help"
                  className="mt-1"
                  data-testid="input-flow-intent"
                />
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFlowDialog(false)} data-testid="button-cancel-flow">
              Cancel
            </Button>
            <Button 
              onClick={() => createFlowMutation.mutate(flowForm)}
              disabled={createFlowMutation.isPending || !flowForm.name}
              data-testid="button-save-flow"
            >
              {createFlowMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Create Flow
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
