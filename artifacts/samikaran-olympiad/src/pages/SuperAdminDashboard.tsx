import { Helmet } from "react-helmet-async";
import { useState, useEffect, useCallback, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { LockScreen, useLockScreen } from "@/components/LockScreen";
import {
  Users, BookOpen, CreditCard, Megaphone, Calendar, BarChart3, Settings, LogOut,
  Search, Plus, Trash2, Edit, Eye, RefreshCw, AlertCircle, CheckCircle, Clock,
  GraduationCap, UserCheck, Building2, UsersRound, TrendingUp, IndianRupee, Activity,
  Globe, Shield, Zap, Bell, MapPin, Server, Cpu, MemoryStick, Wifi, AlertTriangle,
  Radio, Target, Award, FileText, Lock, Unlock, Power, ChevronRight, ChevronLeft, Play, Pause,
  Layout, FileEdit, Send, Mail, ExternalLink, GripVertical, ChevronDown, ChevronUp, Upload, X, Menu, ImageIcon, Handshake,
  Volume2, Save, Eye as EyeIcon, EyeOff, Smartphone, TestTube2, Loader2, ClipboardCheck, Download, Bot, TerminalSquare,
  Sparkles, UserPlus, UserMinus, RotateCcw,
  Tag, MessageSquare, Trophy, LifeBuoy, Award as AwardIcon, Phone, MessageCircle
} from "lucide-react";
import UserManagementTab from "@/components/admin/UserManagementTab";
import CouponManagementTab from "@/components/admin/CouponManagementTab";
import WhatsAppTab from "@/components/admin/WhatsAppTab";
import LeaderboardTab from "@/components/admin/LeaderboardTab";
import ParentManagementTab from "@/components/admin/ParentManagementTab";
import SupportTicketTab from "@/components/admin/SupportTicketTab";
import ReportsAnalyticsTab from "@/components/admin/ReportsAnalyticsTab";
import CertificateDesignerTab from "@/components/admin/CertificateDesignerTab";
import { NotificationBell, NotificationHistoryTab } from "@/components/admin/NotificationCenter";
import { GlobalSettings } from "@/components/GlobalSettings";
import { ContentCMSTab } from "@/components/admin/ContentCMSTab";
import { BlogAdminTab } from "@/components/admin/BlogAdminTab";
import SecureTerminal from "@/components/admin/SecureTerminal";
import { MediaLibraryTab } from "@/components/admin/MediaLibraryTab";
import { PaymentsManagementTab } from "@/components/admin/PaymentsManagementTab";
import { PartnerManagementTab } from "@/components/admin/PartnerManagementTab";
import EmailMarketingTab from "@/components/admin/EmailMarketingTab";
import ChatbotTab from "@/components/admin/ChatbotTab";
import PWAManagementTab from "@/components/admin/PWAManagementTab";
import ResultManagementTab from "@/components/admin/ResultManagementTab";
import OlympiadManagementTab from "@/components/admin/OlympiadManagementTab";
import RBACManagementTab from "@/components/admin/RBACManagementTab";
import CertificateDistributionPanel from "@/components/admin/CertificateDistributionPanel";
import { SystemAuditSection } from "@/components/SystemAuditSection";
import QATestingSection from "@/components/QATestingSection";
import DatabaseSyncTab from "@/components/admin/DatabaseSyncTab";
import { GurujiAdminSettings } from "@/components/guruji";
import { PlatformControlOTPWrapper } from "@/components/PlatformControlOTPWrapper";
import CreateOlympiadModal from "@/components/CreateOlympiadModal";
import AIQuestionGeneratorModal from "@/components/AIQuestionGeneratorModal";
import BulkQuestionUpload from "@/components/BulkQuestionUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, Legend } from "recharts";
import { SiFacebook, SiInstagram, SiX } from "react-icons/si";
import { FaLinkedin } from "react-icons/fa";
import { ComposableMap, Geographies, Geography, ZoomableGroup } from "react-simple-maps";

const WORLD_GEO_URL = "https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json";

type AdminTab = "live" | "analytics" | "exams" | "olympiads" | "results" | "proctoring" | "demoexam" | "finance" | "partners" | "marketing" | "email" | "chatbot" | "guruji" | "cms" | "blog" | "media" | "health" | "docs" | "pwa" | "rbac" | "settings" | "systemaudit" | "qa" | "dbsync" | "terminal" | "manage-students" | "manage-supervisors" | "manage-schools" | "manage-coordinators" | "manage-partners" | "coupons" | "whatsapp" | "leaderboards" | "parents" | "notifications" | "support" | "reports" | "certificates";

interface GeoLocation {
  country: string;
  state: string;
  city: string;
  activeUsers: number;
  registrations: number;
  revenue: number;
}

interface PlatformMetrics {
  activeStudents: number;
  activeExams: number;
  liveSubmissions: number;
  totalRevenue: number;
  todayRegistrations: number;
  serverHealth: {
    cpu: number;
    memory: number;
    latency: number;
  };
  regionActivity: {
    region: string;
    state: string;
    activeUsers: number;
    percentage: number;
  }[];
  geoDistribution: GeoLocation[];
  recentActivity: {
    type: string;
    message: string;
    timestamp: string;
    severity: "info" | "warning" | "alert";
  }[];
}

interface SystemStats {
  students: number;
  supervisors: number;
  groups: number;
  schools: number;
  exams: number;
  totalPayments: number;
}

const CHART_COLORS = ["#8B5CF6", "#EC4899", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];

const indianRegions = [
  { name: "North", states: ["Delhi", "Uttar Pradesh", "Punjab", "Haryana"], color: "#8B5CF6" },
  { name: "South", states: ["Karnataka", "Tamil Nadu", "Kerala", "Andhra Pradesh"], color: "#EC4899" },
  { name: "West", states: ["Maharashtra", "Gujarat", "Rajasthan", "Goa"], color: "#06B6D4" },
  { name: "East", states: ["West Bengal", "Bihar", "Odisha", "Jharkhand"], color: "#10B981" },
  { name: "Central", states: ["Madhya Pradesh", "Chhattisgarh"], color: "#F59E0B" },
  { name: "Northeast", states: ["Assam", "Meghalaya", "Tripura"], color: "#EF4444" },
];

interface SocialPlatformData {
  id: number;
  name: string;
  code: string;
  isEnabled: boolean;
  apiKeyConfigured: boolean;
}

interface MarketingContentData {
  id: number;
  platformCode: string;
  contentType: string;
  tone: string;
  title: string | null;
  body: string;
  hashtags: string[] | null;
  callToAction: string | null;
  status: string;
  scheduledFor: string | null;
  publishedAt: string | null;
  createdAt: string;
}

interface MarketingStats {
  totalPlatforms: number;
  enabledPlatforms: number;
  pendingApprovals: number;
  totalContent: number;
  publishedContent: number;
  scheduledContent: number;
  draftContent: number;
  platformStats: { code: string; name: string; isEnabled: boolean; contentCount: number }[];
}

const platformIcons: Record<string, any> = {
  facebook: SiFacebook,
  instagram: SiInstagram,
  x: SiX,
  linkedin: FaLinkedin,
};

const platformColors: Record<string, string> = {
  facebook: "from-blue-500 to-blue-600",
  instagram: "from-pink-500 to-purple-600",
  x: "from-gray-700 to-gray-900",
  linkedin: "from-blue-600 to-blue-700",
};

const platformBgColors: Record<string, string> = {
  facebook: "bg-blue-100 text-blue-700",
  instagram: "bg-pink-100 text-pink-700",
  x: "bg-gray-200 text-gray-800",
  linkedin: "bg-blue-200 text-blue-700",
};

import { INDIAN_LANGUAGES, getLanguageByCode } from "@shared/constants";

// Proctoring Warning Settings Card Component
function ProctoringWarningSettingsCard({ toast }: { toast: any }) {
  const queryClient = useQueryClient();
  const [isEditing, setIsEditing] = useState(false);
  const [showTestVoice, setShowTestVoice] = useState(false);
  const [isTranslating, setIsTranslating] = useState(false);
  const [translatedText, setTranslatedText] = useState("");
  const [testLanguage, setTestLanguage] = useState("hi");
  const [selectedLangForEdit, setSelectedLangForEdit] = useState<string | null>(null);
  const [editingTranslation, setEditingTranslation] = useState<any>(null);

  const { data: settings, isLoading } = useQuery<{
    warningType?: string;
    countdownDuration?: number;
    firstWarningTime?: number;
    finalWarningTime?: number;
    voiceLanguage?: string;
    voiceType?: string;
    voiceRate?: number;
    voiceVolume?: number;
    voicePitch?: number;
    voiceRepeatInterval?: number;
    fullscreenWarningEn?: string;
    cameraWarningEn?: string;
    multifaceWarningEn?: string;
    autoSubmitWarningEn?: string;
    finalWarningEn?: string;
    fullscreenWarningHi?: string;
    cameraWarningHi?: string;
    multifaceWarningHi?: string;
    autoSubmitWarningHi?: string;
    finalWarningHi?: string;
    fullscreenShortMsg?: string;
    cameraShortMsg?: string;
    multifaceShortMsg?: string;
    sirenVolume?: number;
    sirenFrequencyLow?: number;
    sirenFrequencyHigh?: number;
  }>({
    queryKey: ["/api/proctoring-warning-settings"],
  });

  const { data: translations = [], refetch: refetchTranslations } = useQuery<any[]>({
    queryKey: ["/api/proctoring-warning-translations"],
  });

  const saveTranslationMutation = useMutation({
    mutationFn: async ({ langCode, data }: { langCode: string, data: any }) => {
      const response = await fetch(`/api/admin/proctoring-warning-translations/${langCode}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to save translation");
      return response.json();
    },
    onSuccess: () => {
      refetchTranslations();
      setSelectedLangForEdit(null);
      setEditingTranslation(null);
      toast({ title: "Translation saved", description: "Warning messages have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save translation", variant: "destructive" });
    },
  });

  const [formData, setFormData] = useState({
    warningType: "voice",
    countdownDuration: 60,
    firstWarningTime: 20,
    finalWarningTime: 10,
    voiceLanguage: "both",
    voiceType: "young_female",
    voiceRate: 85,
    voiceVolume: 75,
    voicePitch: 100,
    voiceRepeatInterval: 15,
    fullscreenWarningEn: "",
    cameraWarningEn: "",
    multifaceWarningEn: "",
    autoSubmitWarningEn: "",
    finalWarningEn: "",
    fullscreenWarningHi: "",
    cameraWarningHi: "",
    multifaceWarningHi: "",
    autoSubmitWarningHi: "",
    finalWarningHi: "",
    fullscreenShortMsg: "",
    cameraShortMsg: "",
    multifaceShortMsg: "",
    sirenVolume: 30,
    sirenFrequencyLow: 600,
    sirenFrequencyHigh: 800,
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        warningType: settings.warningType || "voice",
        countdownDuration: settings.countdownDuration || 60,
        firstWarningTime: settings.firstWarningTime || 20,
        finalWarningTime: settings.finalWarningTime || 10,
        voiceLanguage: settings.voiceLanguage || "both",
        voiceType: settings.voiceType || "young_female",
        voiceRate: settings.voiceRate || 85,
        voiceVolume: settings.voiceVolume || 75,
        voicePitch: settings.voicePitch || 100,
        voiceRepeatInterval: settings.voiceRepeatInterval || 15,
        fullscreenWarningEn: settings.fullscreenWarningEn || "",
        cameraWarningEn: settings.cameraWarningEn || "",
        multifaceWarningEn: settings.multifaceWarningEn || "",
        autoSubmitWarningEn: settings.autoSubmitWarningEn || "",
        finalWarningEn: settings.finalWarningEn || "",
        fullscreenWarningHi: settings.fullscreenWarningHi || "",
        cameraWarningHi: settings.cameraWarningHi || "",
        multifaceWarningHi: settings.multifaceWarningHi || "",
        autoSubmitWarningHi: settings.autoSubmitWarningHi || "",
        finalWarningHi: settings.finalWarningHi || "",
        fullscreenShortMsg: settings.fullscreenShortMsg || "",
        cameraShortMsg: settings.cameraShortMsg || "",
        multifaceShortMsg: settings.multifaceShortMsg || "",
        sirenVolume: settings.sirenVolume || 30,
        sirenFrequencyLow: settings.sirenFrequencyLow || 600,
        sirenFrequencyHigh: settings.sirenFrequencyHigh || 800,
      });
    }
  }, [settings]);

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch("/api/admin/proctoring-warning-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to save settings");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/proctoring-warning-settings"] });
      setIsEditing(false);
      toast({ title: "Settings saved successfully", description: "Proctoring warning settings have been updated." });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to save settings", variant: "destructive" });
    },
  });

  const testVoice = (text: string, lang: string = "en-IN") => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = formData.voiceRate / 100;
      utterance.volume = formData.voiceVolume / 100;
      
      const voices = window.speechSynthesis.getVoices();
      
      // Find Indian female voice - prefer Google voices (best quality)
      const indianFemaleVoice = 
        voices.find(v => v.name.includes('Google') && v.lang === 'hi-IN') ||
        voices.find(v => v.name.includes('Google') && v.lang === 'en-IN') ||
        voices.find(v => v.lang === 'hi-IN') ||
        voices.find(v => v.lang === 'en-IN') ||
        voices.find(v => v.lang.startsWith('en'));
      
      if (indianFemaleVoice) {
        utterance.voice = indianFemaleVoice;
      }
      
      // Set pitch based on voice type selection
      // young_female: higher pitch (1.3), adult_female: normal (1.0), mature_female: lower (0.85)
      const pitchMap: Record<string, number> = {
        young_female: 1.3,
        adult_female: 1.0,
        mature_female: 0.85
      };
      utterance.pitch = pitchMap[formData.voiceType] || 1.0;
      
      window.speechSynthesis.speak(utterance);
    }
  };

  const testSiren = () => {
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.type = 'sawtooth';
      gainNode.gain.value = formData.sirenVolume / 100;
      oscillator.frequency.value = formData.sirenFrequencyLow;
      oscillator.start();
      
      let high = true;
      const interval = setInterval(() => {
        oscillator.frequency.value = high ? formData.sirenFrequencyHigh : formData.sirenFrequencyLow;
        high = !high;
      }, 300);
      
      setTimeout(() => {
        clearInterval(interval);
        oscillator.stop();
        audioContext.close();
      }, 3000);
    } catch (e) {
      console.log("Siren test failed");
    }
  };

  const testLanguageVoice = async (langCode: string, warningType: string) => {
    const lang = getLanguageByCode(langCode);
    if (!lang) return;
    
    // Get translation from database
    const langTranslation = translations.find((t: any) => t.languageCode === langCode);
    
    if (!langTranslation) {
      toast({ title: "No translation", description: `Please add ${lang.name} translation first`, variant: "destructive" });
      return;
    }
    
    // Get the appropriate warning message based on type
    let textToSpeak = "";
    switch (warningType) {
      case "fullscreen":
        textToSpeak = langTranslation.fullscreenWarning;
        break;
      case "camera":
        textToSpeak = langTranslation.cameraWarning;
        break;
      case "multiface":
        textToSpeak = langTranslation.multifaceWarning;
        break;
      case "autosubmit":
        textToSpeak = langTranslation.autoSubmitWarning?.replace("{seconds}", "20") || "";
        break;
      case "final":
        textToSpeak = langTranslation.finalWarning?.replace("{seconds}", "10") || "";
        break;
      default:
        textToSpeak = langTranslation.fullscreenWarning;
    }
    
    if (!textToSpeak) {
      toast({ title: "No translation", description: `${lang.name} ${warningType} warning not translated yet`, variant: "destructive" });
      return;
    }
    
    setTranslatedText(textToSpeak);
    testVoice(textToSpeak, lang.speechCode);
  };

  if (isLoading) {
    return (
      <Card className="bg-white/80 backdrop-blur border-gray-200/50">
        <CardContent className="p-8 text-center">
          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
          <p>Loading warning settings...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white/80 backdrop-blur border-gray-200/50">
      <CardHeader>
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Volume2 className="w-5 h-5 text-amber-500" />
            Warning Settings
          </CardTitle>
          {!isEditing ? (
            <Button size="sm" onClick={() => setIsEditing(true)} data-testid="button-edit-warning-settings">
              <Settings className="w-4 h-4 mr-2" />
              Edit Settings
            </Button>
          ) : (
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={() => setIsEditing(false)}>
                Cancel
              </Button>
              <Button 
                size="sm" 
                onClick={() => saveMutation.mutate(formData)}
                disabled={saveMutation.isPending}
                data-testid="button-save-warning-settings"
              >
                {saveMutation.isPending ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                Save Settings
              </Button>
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Warning Type & Timing
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label>Warning Type</Label>
                <Select 
                  value={formData.warningType} 
                  onValueChange={(v) => setFormData({...formData, warningType: v})}
                  disabled={!isEditing}
                >
                  <SelectTrigger data-testid="select-warning-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="voice">Voice Only (Indian Railway Style)</SelectItem>
                    <SelectItem value="siren">Siren Only</SelectItem>
                    <SelectItem value="both">Voice + Siren</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Countdown Duration (seconds before auto-submit)</Label>
                <Input 
                  type="number" 
                  value={formData.countdownDuration} 
                  onChange={(e) => setFormData({...formData, countdownDuration: parseInt(e.target.value) || 60})}
                  disabled={!isEditing}
                  data-testid="input-countdown-duration"
                />
              </div>
              
              <div>
                <Label>First Urgent Warning (seconds before auto-submit)</Label>
                <Input 
                  type="number" 
                  value={formData.firstWarningTime} 
                  onChange={(e) => setFormData({...formData, firstWarningTime: parseInt(e.target.value) || 20})}
                  disabled={!isEditing}
                  data-testid="input-first-warning"
                />
              </div>
              
              <div>
                <Label>Final Warning (seconds before auto-submit)</Label>
                <Input 
                  type="number" 
                  value={formData.finalWarningTime} 
                  onChange={(e) => setFormData({...formData, finalWarningTime: parseInt(e.target.value) || 10})}
                  disabled={!isEditing}
                  data-testid="input-final-warning"
                />
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Voice Settings
            </h3>
            
            <div className="space-y-3">
              <div>
                <Label>Voice Language</Label>
                <Select 
                  value={formData.voiceLanguage} 
                  onValueChange={(v) => setFormData({...formData, voiceLanguage: v})}
                  disabled={!isEditing}
                >
                  <SelectTrigger data-testid="select-voice-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English Only</SelectItem>
                    <SelectItem value="hindi">Hindi Only</SelectItem>
                    <SelectItem value="both">Both (English → Hindi → Combined)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>Voice Type (Female)</Label>
                <Select 
                  value={formData.voiceType} 
                  onValueChange={(v) => setFormData({...formData, voiceType: v})}
                  disabled={!isEditing}
                >
                  <SelectTrigger data-testid="select-voice-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="young_female">Young Female (18-22 years)</SelectItem>
                    <SelectItem value="adult_female">Adult Female (25-35 years)</SelectItem>
                    <SelectItem value="mature_female">Mature Female (40+ years)</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground mt-1">Controls voice pitch to simulate different age characteristics</p>
              </div>
              
              <div>
                <Label>Voice Speed ({formData.voiceRate}%)</Label>
                <Slider
                  value={[formData.voiceRate]}
                  onValueChange={([v]) => setFormData({...formData, voiceRate: v})}
                  min={50}
                  max={150}
                  step={5}
                  disabled={!isEditing}
                  data-testid="slider-voice-rate"
                />
              </div>
              
              <div>
                <Label>Voice Volume ({formData.voiceVolume}%)</Label>
                <Slider
                  value={[formData.voiceVolume]}
                  onValueChange={([v]) => setFormData({...formData, voiceVolume: v})}
                  min={10}
                  max={100}
                  step={5}
                  disabled={!isEditing}
                  data-testid="slider-voice-volume"
                />
              </div>
              
              <div>
                <Label>Voice Repeat Interval (seconds)</Label>
                <Input 
                  type="number" 
                  value={formData.voiceRepeatInterval} 
                  onChange={(e) => setFormData({...formData, voiceRepeatInterval: parseInt(e.target.value) || 15})}
                  disabled={!isEditing}
                  data-testid="input-repeat-interval"
                />
              </div>
              
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => testVoice("Attention please. This is a test of the proctoring voice warning system.")}
                data-testid="button-test-voice"
              >
                <Volume2 className="w-4 h-4 mr-2" />
                Test Voice
              </Button>
            </div>
          </div>
        </div>

        {(formData.warningType === "siren" || formData.warningType === "both") && (
          <div className="border-t pt-4">
            <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4 text-red-500" />
              Siren Settings
            </h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div>
                <Label>Siren Volume ({formData.sirenVolume}%)</Label>
                <Slider
                  value={[formData.sirenVolume]}
                  onValueChange={([v]) => setFormData({...formData, sirenVolume: v})}
                  min={10}
                  max={100}
                  step={5}
                  disabled={!isEditing}
                  data-testid="slider-siren-volume"
                />
              </div>
              <div>
                <Label>Low Frequency (Hz)</Label>
                <Input 
                  type="number" 
                  value={formData.sirenFrequencyLow} 
                  onChange={(e) => setFormData({...formData, sirenFrequencyLow: parseInt(e.target.value) || 600})}
                  disabled={!isEditing}
                  data-testid="input-siren-low"
                />
              </div>
              <div>
                <Label>High Frequency (Hz)</Label>
                <Input 
                  type="number" 
                  value={formData.sirenFrequencyHigh} 
                  onChange={(e) => setFormData({...formData, sirenFrequencyHigh: parseInt(e.target.value) || 800})}
                  disabled={!isEditing}
                  data-testid="input-siren-high"
                />
              </div>
            </div>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-3"
              onClick={testSiren}
              data-testid="button-test-siren"
            >
              <AlertTriangle className="w-4 h-4 mr-2" />
              Test Siren (3 seconds)
            </Button>
          </div>
        )}

        <Collapsible>
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between">
              <span className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Warning Messages (Click to expand)
              </span>
              <ChevronDown className="w-4 h-4" />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-4 pt-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                <strong>How it works:</strong> Edit messages in English below. The system will automatically translate them to Hindi and all other Indian languages when needed.
              </p>
            </div>
            
            <div className="space-y-4">
              <h4 className="font-medium text-gray-700 flex items-center gap-2">
                English Base Messages (Edit Here)
              </h4>
              
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label>Fullscreen Warning (English)</Label>
                  <Textarea 
                    value={formData.fullscreenWarningEn}
                    onChange={(e) => setFormData({...formData, fullscreenWarningEn: e.target.value})}
                    disabled={!isEditing}
                    rows={2}
                    data-testid="textarea-fullscreen-en"
                  />
                </div>
                <div>
                  <Label>Camera Warning (English)</Label>
                  <Textarea 
                    value={formData.cameraWarningEn}
                    onChange={(e) => setFormData({...formData, cameraWarningEn: e.target.value})}
                    disabled={!isEditing}
                    rows={2}
                    data-testid="textarea-camera-en"
                  />
                </div>
                <div>
                  <Label>Multiple Faces Warning (English)</Label>
                  <Textarea 
                    value={formData.multifaceWarningEn}
                    onChange={(e) => setFormData({...formData, multifaceWarningEn: e.target.value})}
                    disabled={!isEditing}
                    rows={2}
                    data-testid="textarea-multiface-en"
                  />
                </div>
                <div>
                  <Label>Auto-Submit Warning (English) - use {"{seconds}"}</Label>
                  <Textarea 
                    value={formData.autoSubmitWarningEn}
                    onChange={(e) => setFormData({...formData, autoSubmitWarningEn: e.target.value})}
                    disabled={!isEditing}
                    rows={2}
                    data-testid="textarea-autosubmit-en"
                  />
                </div>
                <div>
                  <Label>Final Warning (English) - use {"{seconds}"}</Label>
                  <Textarea 
                    value={formData.finalWarningEn}
                    onChange={(e) => setFormData({...formData, finalWarningEn: e.target.value})}
                    disabled={!isEditing}
                    rows={2}
                    data-testid="textarea-final-en"
                  />
                </div>
                <div>
                  <Label>Short Combined Message</Label>
                  <Textarea 
                    value={formData.fullscreenShortMsg}
                    onChange={(e) => setFormData({...formData, fullscreenShortMsg: e.target.value})}
                    disabled={!isEditing}
                    rows={2}
                    data-testid="textarea-short-msg"
                  />
                </div>
              </div>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-700 mb-3 flex items-center gap-2">
                <Volume2 className="w-4 h-4" />
                Test Warning in Different Languages
              </h4>
              <p className="text-sm text-gray-500 mb-3">
                Select a language and message type to hear how it sounds. English messages will be auto-translated to the selected language.
              </p>
              
              <div className="flex flex-wrap gap-2 mb-4">
                <Select value={testLanguage} onValueChange={setTestLanguage}>
                  <SelectTrigger className="w-48" data-testid="select-test-language">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {INDIAN_LANGUAGES.map((lang) => (
                      <SelectItem key={lang.code} value={lang.code}>
                        {lang.name} ({lang.nativeName})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => testLanguageVoice(testLanguage, "fullscreen")}
                  data-testid="button-test-fullscreen"
                >
                  Fullscreen
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => testLanguageVoice(testLanguage, "camera")}
                  data-testid="button-test-camera"
                >
                  Camera
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => testLanguageVoice(testLanguage, "multiface")}
                  data-testid="button-test-multiface"
                >
                  Multi-Face
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => testLanguageVoice(testLanguage, "autosubmit")}
                  data-testid="button-test-autosubmit"
                >
                  Auto-Submit
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => testLanguageVoice(testLanguage, "final")}
                  data-testid="button-test-final"
                >
                  Final Warning
                </Button>
              </div>
              
              {translatedText && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    <strong>Last Translation ({getLanguageByCode(testLanguage)?.name}):</strong>
                  </p>
                  <p className="text-sm text-gray-800 mt-1">{translatedText}</p>
                </div>
              )}
            </div>

            <div className="border-t pt-4">
              <h4 className="font-medium text-gray-600 mb-3">Quick Language Test Buttons</h4>
              <p className="text-sm text-gray-500 mb-3">Click any language button to hear the fullscreen warning in that language:</p>
              <div className="flex flex-wrap gap-2">
                {INDIAN_LANGUAGES.map((lang) => {
                  const langTranslation = translations.find((t: any) => t.languageCode === lang.code);
                  const hasTranslation = langTranslation && langTranslation.fullscreenWarning && langTranslation.fullscreenWarning.length > 0;
                  return (
                    <Button
                      key={lang.code}
                      variant={hasTranslation ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (hasTranslation) {
                          testVoice(langTranslation.fullscreenWarning, lang.speechCode);
                        } else {
                          toast({ title: "No translation", description: `Please add ${lang.name} translation first`, variant: "destructive" });
                        }
                      }}
                      className="text-xs"
                      data-testid={`button-test-${lang.code}`}
                    >
                      {lang.nativeName}
                    </Button>
                  );
                })}
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h4 className="font-medium text-gray-600 mb-3">Language Translations (Stored in Database)</h4>
              <p className="text-sm text-gray-500 mb-3">Click a language to edit its warning messages. English is the base language.</p>
              
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 mb-4">
                {INDIAN_LANGUAGES.map((lang) => {
                  const langTranslation = translations.find((t: any) => t.languageCode === lang.code);
                  const hasTranslation = langTranslation && langTranslation.fullscreenWarning && langTranslation.fullscreenWarning.length > 0;
                  return (
                    <Button
                      key={lang.code}
                      variant={selectedLangForEdit === lang.code ? "default" : "outline"}
                      size="sm"
                      onClick={() => {
                        setSelectedLangForEdit(lang.code);
                        setEditingTranslation(langTranslation || {
                          languageCode: lang.code,
                          fullscreenWarning: "",
                          cameraWarning: "",
                          multifaceWarning: "",
                          autoSubmitWarning: "",
                          finalWarning: "",
                        });
                      }}
                      className={`text-xs justify-start ${hasTranslation ? 'border-green-500' : 'border-orange-400'}`}
                      data-testid={`button-edit-${lang.code}`}
                    >
                      <span className={`w-2 h-2 rounded-full mr-2 ${hasTranslation ? 'bg-green-500' : 'bg-orange-400'}`} />
                      {lang.name} ({lang.nativeName})
                    </Button>
                  );
                })}
              </div>

              {selectedLangForEdit && editingTranslation && (
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <h5 className="font-medium">
                      Editing: {INDIAN_LANGUAGES.find(l => l.code === selectedLangForEdit)?.name} ({INDIAN_LANGUAGES.find(l => l.code === selectedLangForEdit)?.nativeName})
                    </h5>
                    <Button variant="ghost" size="sm" onClick={() => { setSelectedLangForEdit(null); setEditingTranslation(null); }}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium">Fullscreen Warning</Label>
                      <Textarea
                        value={editingTranslation.fullscreenWarning || ""}
                        onChange={(e) => setEditingTranslation({ ...editingTranslation, fullscreenWarning: e.target.value })}
                        placeholder="Enter fullscreen warning message..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Camera Warning</Label>
                      <Textarea
                        value={editingTranslation.cameraWarning || ""}
                        onChange={(e) => setEditingTranslation({ ...editingTranslation, cameraWarning: e.target.value })}
                        placeholder="Enter camera warning message..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Multiple Faces Warning</Label>
                      <Textarea
                        value={editingTranslation.multifaceWarning || ""}
                        onChange={(e) => setEditingTranslation({ ...editingTranslation, multifaceWarning: e.target.value })}
                        placeholder="Enter multiple faces warning message..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Auto-Submit Warning (use {"{seconds}"} for countdown)</Label>
                      <Textarea
                        value={editingTranslation.autoSubmitWarning || ""}
                        onChange={(e) => setEditingTranslation({ ...editingTranslation, autoSubmitWarning: e.target.value })}
                        placeholder="Enter auto-submit warning message..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Final Warning (use {"{seconds}"} for countdown)</Label>
                      <Textarea
                        value={editingTranslation.finalWarning || ""}
                        onChange={(e) => setEditingTranslation({ ...editingTranslation, finalWarning: e.target.value })}
                        placeholder="Enter final warning message..."
                        className="mt-1"
                        rows={2}
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Button
                      onClick={() => {
                        if (editingTranslation.fullscreenWarning) {
                          const lang = INDIAN_LANGUAGES.find(l => l.code === selectedLangForEdit);
                          testVoice(editingTranslation.fullscreenWarning, lang?.speechCode || "en-IN");
                        }
                      }}
                      variant="outline"
                      size="sm"
                    >
                      <Volume2 className="h-4 w-4 mr-2" /> Test Voice
                    </Button>
                    <Button
                      onClick={() => saveTranslationMutation.mutate({ langCode: selectedLangForEdit, data: editingTranslation })}
                      disabled={saveTranslationMutation.isPending}
                      size="sm"
                    >
                      <Save className="h-4 w-4 mr-2" /> Save Translation
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  );
}

function MarketingControlTab({ toast }: { toast: any }) {
  const [eventType, setEventType] = useState("olympiad_announced");
  const [contentTitle, setContentTitle] = useState("");
  const [contentDescription, setContentDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedContent, setSelectedContent] = useState<MarketingContentData | null>(null);
  const [showContentDialog, setShowContentDialog] = useState(false);

  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [showScheduleDialog, setShowScheduleDialog] = useState(false);
  const [scheduleContentId, setScheduleContentId] = useState<number | null>(null);
  const [scheduleDate, setScheduleDate] = useState<Date | null>(null);
  const [platformsInitialized, setPlatformsInitialized] = useState(false);

  const { data: platforms = [], refetch: refetchPlatforms, isSuccess: platformsLoaded } = useQuery<SocialPlatformData[]>({
    queryKey: ["/api/marketing/platforms"],
  });

  const { data: stats, refetch: refetchStats } = useQuery<MarketingStats>({
    queryKey: ["/api/marketing/stats"],
  });

  const { data: pendingApprovals = [], refetch: refetchApprovals } = useQuery<MarketingContentData[]>({
    queryKey: ["/api/marketing/approvals"],
  });

  const { data: allContent = [], refetch: refetchContent } = useQuery<MarketingContentData[]>({
    queryKey: ["/api/marketing/content"],
  });

  const calendarStart = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1);
  const calendarEnd = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0);
  
  const { data: calendarEntries = [], refetch: refetchCalendar } = useQuery<any[]>({
    queryKey: ["/api/marketing/calendar", { start: calendarStart.toISOString(), end: calendarEnd.toISOString() }],
    queryFn: async () => {
      const response = await fetch(`/api/marketing/calendar?start=${calendarStart.toISOString()}&end=${calendarEnd.toISOString()}`);
      if (!response.ok) return [];
      return response.json();
    },
  });

  const initPlatformsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/marketing/platforms/init", { method: "POST" });
      if (!response.ok) throw new Error("Failed to initialize platforms");
      return response.json();
    },
    onSuccess: () => {
      refetchPlatforms();
      refetchStats();
      setPlatformsInitialized(true);
      toast({ title: "Platforms Initialized", description: "Default social platforms have been set up." });
    },
  });

  const scheduleContentMutation = useMutation({
    mutationFn: async ({ contentId, scheduledDate }: { contentId: number; scheduledDate: Date }) => {
      const response = await fetch("/api/marketing/calendar/schedule", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contentId, scheduledDate: scheduledDate.toISOString(), timeSlot: "morning" }),
      });
      if (!response.ok) throw new Error("Failed to schedule content");
      return response.json();
    },
    onSuccess: () => {
      refetchCalendar();
      refetchContent();
      refetchStats();
      setShowScheduleDialog(false);
      setScheduleContentId(null);
      setScheduleDate(null);
      toast({ title: "Content Scheduled", description: "Post has been scheduled for publishing." });
    },
  });

  const unscheduleContentMutation = useMutation({
    mutationFn: async (contentId: number) => {
      const response = await fetch(`/api/marketing/calendar/unschedule/${contentId}`, { method: "DELETE" });
      if (!response.ok) throw new Error("Failed to unschedule content");
      return response.json();
    },
    onSuccess: () => {
      refetchCalendar();
      refetchContent();
      refetchStats();
      toast({ title: "Content Unscheduled", description: "Post has been removed from schedule." });
    },
  });

  const togglePlatformMutation = useMutation({
    mutationFn: async ({ id, isEnabled }: { id: number; isEnabled: boolean }) => {
      const response = await fetch(`/api/marketing/platforms/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isEnabled }),
      });
      if (!response.ok) throw new Error("Failed to update platform");
      return response.json();
    },
    onSuccess: () => {
      refetchPlatforms();
      refetchStats();
    },
  });

  const generateContentMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/marketing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          eventType,
          title: contentTitle || eventType.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase()),
          description: contentDescription,
          platforms: ["facebook", "instagram", "x", "linkedin"],
        }),
      });
      if (!response.ok) throw new Error("Failed to generate content");
      return response.json();
    },
    onSuccess: (data) => {
      refetchContent();
      refetchApprovals();
      refetchStats();
      setContentTitle("");
      setContentDescription("");
      toast({ title: "Content Generated", description: `${data.content?.length || 0} posts created and pending approval.` });
    },
    onError: (error: any) => {
      toast({ title: "Generation Failed", description: error.message, variant: "destructive" });
    },
  });

  const approveContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/marketing/content/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ approvedBy: "admin" }),
      });
      if (!response.ok) throw new Error("Failed to approve content");
      return response.json();
    },
    onSuccess: () => {
      refetchApprovals();
      refetchContent();
      refetchStats();
      setShowContentDialog(false);
      toast({ title: "Content Approved", description: "Post has been approved for publishing." });
    },
  });

  const rejectContentMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/marketing/content/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: "Rejected by admin" }),
      });
      if (!response.ok) throw new Error("Failed to reject content");
      return response.json();
    },
    onSuccess: () => {
      refetchApprovals();
      refetchContent();
      refetchStats();
      setShowContentDialog(false);
      toast({ title: "Content Rejected", description: "Post has been rejected." });
    },
  });

  useEffect(() => {
    if (platformsLoaded && platforms.length === 0 && !platformsInitialized) {
      initPlatformsMutation.mutate();
    }
  }, [platformsLoaded, platforms.length, platformsInitialized]);

  const handleGenerate = async () => {
    setIsGenerating(true);
    try {
      await generateContentMutation.mutateAsync();
    } finally {
      setIsGenerating(false);
    }
  };

  const enabledCount = platforms.filter(p => p.isEnabled).length;

  return (
    <motion.div
      key="marketing"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Marketing Control</h2>
          <p className="text-gray-500">AI-powered social media automation & content calendar</p>
        </div>
        <div className="flex items-center gap-3">
          {enabledCount > 0 ? (
            <Badge variant="outline" className="text-emerald-600 border-emerald-300" data-testid="badge-api-status">
              <CheckCircle className="w-3 h-3 mr-1" />
              {enabledCount} Platform{enabledCount > 1 ? "s" : ""} Active
            </Badge>
          ) : (
            <Badge variant="outline" className="text-amber-600 border-amber-300" data-testid="badge-api-status">
              <AlertCircle className="w-3 h-3 mr-1" />
              No Platforms Active
            </Badge>
          )}
          <Button variant="outline" className="gap-2" data-testid="button-refresh-stats" onClick={() => { refetchStats(); refetchPlatforms(); refetchContent(); }}>
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        {platforms.map((platform) => {
          const IconComponent = platformIcons[platform.code] || SiFacebook;
          const colorClass = platformColors[platform.code] || "from-gray-500 to-gray-600";
          return (
            <Card key={platform.id} className="bg-white/80 backdrop-blur border-gray-200/50" data-testid={`card-platform-${platform.code}`}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${colorClass} text-white flex items-center justify-center`}>
                    <IconComponent className="w-5 h-5" />
                  </div>
                  <Switch
                    checked={platform.isEnabled}
                    onCheckedChange={(checked) => togglePlatformMutation.mutate({ id: platform.id, isEnabled: checked })}
                    data-testid={`switch-platform-${platform.code}`}
                  />
                </div>
                <h3 className="font-semibold text-gray-800">{platform.name}</h3>
                <p className="text-xs text-gray-500" data-testid={`text-platform-status-${platform.code}`}>
                  {platform.isEnabled ? "Active" : "Disabled"} | {stats?.platformStats?.find(s => s.code === platform.code)?.contentCount || 0} posts
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-0">
          <CardContent className="p-4">
            <FileText className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{stats?.totalContent || 0}</p>
            <p className="text-sm opacity-80">Total Content</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0">
          <CardContent className="p-4">
            <Clock className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{stats?.pendingApprovals || 0}</p>
            <p className="text-sm opacity-80">Pending Approval</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-emerald-500 to-green-500 text-white border-0">
          <CardContent className="p-4">
            <CheckCircle className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{stats?.publishedContent || 0}</p>
            <p className="text-sm opacity-80">Published</p>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-blue-500 to-cyan-500 text-white border-0">
          <CardContent className="p-4">
            <Calendar className="w-5 h-5 mb-2 opacity-80" />
            <p className="text-3xl font-bold">{stats?.scheduledContent || 0}</p>
            <p className="text-sm opacity-80">Scheduled</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="bg-white/80 backdrop-blur border-gray-200/50">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <Zap className="w-5 h-5 text-amber-500" />
              AI Content Generator
            </CardTitle>
            <CardDescription>Generate platform-specific content using AI</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="p-4 bg-gradient-to-br from-violet-50 to-fuchsia-50 rounded-lg border border-violet-100">
              <div className="space-y-3">
                <div>
                  <Label className="text-sm text-gray-600">Event Type</Label>
                  <Select value={eventType} onValueChange={setEventType}>
                    <SelectTrigger className="bg-white mt-1" data-testid="select-event-type">
                      <SelectValue placeholder="Select event type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="olympiad_announced">Olympiad Announced</SelectItem>
                      <SelectItem value="registration_open">Registration Open</SelectItem>
                      <SelectItem value="registration_reminder">Registration Reminder</SelectItem>
                      <SelectItem value="results_declared">Results Declared</SelectItem>
                      <SelectItem value="blog_published">Blog Published</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Title (optional)</Label>
                  <Input
                    value={contentTitle}
                    onChange={(e) => setContentTitle(e.target.value)}
                    placeholder="e.g., Math Olympiad 2025"
                    className="bg-white mt-1"
                    data-testid="input-content-title"
                  />
                </div>
                <div>
                  <Label className="text-sm text-gray-600">Description (optional)</Label>
                  <Textarea
                    value={contentDescription}
                    onChange={(e) => setContentDescription(e.target.value)}
                    placeholder="Additional details for AI to include..."
                    className="bg-white mt-1"
                    rows={2}
                    data-testid="input-content-description"
                  />
                </div>
                <Button
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  data-testid="button-generate-ai-content"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="w-4 h-4 mr-2" />
                      Generate AI Content
                    </>
                  )}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-white/80 backdrop-blur border-gray-200/50">
          <CardHeader>
            <CardTitle className="text-gray-800 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-emerald-500" />
              Approval Queue ({pendingApprovals.length})
            </CardTitle>
            <CardDescription>Review and approve AI-generated content</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingApprovals.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                  <FileText className="w-8 h-8 text-gray-400" />
                </div>
                <p className="font-medium">No pending approvals</p>
                <p className="text-sm">Generate content to see it here</p>
              </div>
            ) : (
              <ScrollArea className="h-[200px]">
                <div className="space-y-2">
                  {pendingApprovals.map((content) => {
                    const bgColor = platformBgColors[content.platformCode] || "bg-gray-100 text-gray-700";
                    return (
                      <div
                        key={content.id}
                        className="p-3 border rounded-lg hover-elevate cursor-pointer"
                        onClick={() => { setSelectedContent(content); setShowContentDialog(true); }}
                        data-testid={`approval-item-${content.id}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Badge className={bgColor}>{content.platformCode}</Badge>
                            <span className="text-sm font-medium truncate max-w-[150px]">{content.title || "Untitled"}</span>
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-emerald-600" onClick={(e) => { e.stopPropagation(); approveContentMutation.mutate(content.id); }}>
                              <CheckCircle className="w-4 h-4" />
                            </Button>
                            <Button size="sm" variant="ghost" className="h-7 w-7 p-0 text-red-600" onClick={(e) => { e.stopPropagation(); rejectContentMutation.mutate(content.id); }}>
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </ScrollArea>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="bg-white/80 backdrop-blur border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-500" />
            Content Calendar
          </CardTitle>
          <CardDescription>Schedule and manage your content publishing dates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="icon" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))} data-testid="button-calendar-prev">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <h3 className="font-semibold text-gray-800 min-w-[150px] text-center">
                {format(calendarMonth, "MMMM yyyy")}
              </h3>
              <Button variant="outline" size="icon" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))} data-testid="button-calendar-next">
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button variant="outline" onClick={() => setCalendarMonth(new Date())} data-testid="button-calendar-today">
              Today
            </Button>
          </div>
          <div className="grid grid-cols-7 gap-1 mb-2">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
              <div key={day} className="text-center text-xs font-medium text-gray-500 py-2">{day}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {(() => {
              const firstDay = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), 1).getDay();
              const daysInMonth = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 0).getDate();
              const days = [];
              for (let i = 0; i < firstDay; i++) {
                days.push(<div key={`empty-${i}`} className="h-20 bg-gray-50 rounded-lg" />);
              }
              for (let day = 1; day <= daysInMonth; day++) {
                const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
                const dateStr = format(date, "yyyy-MM-dd");
                const dayEntries = calendarEntries.filter(e => format(new Date(e.scheduledDate), "yyyy-MM-dd") === dateStr);
                const isToday = format(new Date(), "yyyy-MM-dd") === dateStr;
                days.push(
                  <div key={day} className={`h-20 p-1 rounded-lg border ${isToday ? "border-violet-400 bg-violet-50" : "border-gray-200 bg-white"} hover-elevate cursor-pointer overflow-hidden`} data-testid={`calendar-day-${dateStr}`}>
                    <div className="text-xs font-medium text-gray-700 mb-1">{day}</div>
                    <div className="space-y-1">
                      {dayEntries.slice(0, 2).map((entry: any) => (
                        <div key={entry.id} className={`text-xs px-1 py-0.5 rounded truncate ${platformBgColors[entry.content?.platformCode] || "bg-gray-100"}`} title={entry.content?.title}>
                          {entry.content?.title || "Post"}
                        </div>
                      ))}
                      {dayEntries.length > 2 && (
                        <div className="text-xs text-gray-500">+{dayEntries.length - 2} more</div>
                      )}
                    </div>
                  </div>
                );
              }
              return days;
            })()}
          </div>
          {allContent.filter(c => c.status === "approved").length > 0 && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Schedule Approved Content</h4>
              <div className="flex flex-wrap gap-2">
                {allContent.filter(c => c.status === "approved").slice(0, 6).map((content) => (
                  <Button
                    key={content.id}
                    variant="outline"
                    size="sm"
                    className="gap-1"
                    onClick={() => { setScheduleContentId(content.id); setShowScheduleDialog(true); }}
                    data-testid={`button-schedule-${content.id}`}
                  >
                    <Badge className={platformBgColors[content.platformCode] || ""} variant="secondary">{content.platformCode}</Badge>
                    <span className="truncate max-w-[100px]">{content.title || "Untitled"}</span>
                    <Plus className="w-3 h-3" />
                  </Button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showScheduleDialog} onOpenChange={setShowScheduleDialog}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Content</DialogTitle>
            <DialogDescription>
              Select a date to schedule this content for publishing.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Scheduled Date</Label>
              <Input
                type="date"
                value={scheduleDate ? format(scheduleDate, "yyyy-MM-dd") : ""}
                onChange={(e) => setScheduleDate(e.target.value ? new Date(e.target.value) : null)}
                min={format(new Date(), "yyyy-MM-dd")}
                className="mt-1"
                data-testid="input-schedule-date"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowScheduleDialog(false)}>Cancel</Button>
            <Button
              onClick={() => {
                if (scheduleContentId && scheduleDate) {
                  scheduleContentMutation.mutate({ contentId: scheduleContentId, scheduledDate: scheduleDate });
                }
              }}
              disabled={!scheduleDate || scheduleContentMutation.isPending}
              className="bg-gradient-to-r from-violet-500 to-fuchsia-500"
              data-testid="button-confirm-schedule"
            >
              {scheduleContentMutation.isPending ? "Scheduling..." : "Schedule"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Card className="bg-white/80 backdrop-blur border-gray-200/50">
        <CardHeader>
          <CardTitle className="text-gray-800 flex items-center gap-2">
            <Activity className="w-5 h-5 text-violet-500" />
            All Content ({allContent.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allContent.length === 0 ? (
            <div className="text-center py-6 text-gray-500">
              <p>No content yet</p>
              <p className="text-sm">Use the AI generator to create posts</p>
            </div>
          ) : (
            <ScrollArea className="h-[300px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Platform</TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allContent.slice(0, 20).map((content) => {
                    const bgColor = platformBgColors[content.platformCode] || "bg-gray-100 text-gray-700";
                    return (
                      <TableRow key={content.id}>
                        <TableCell><Badge className={bgColor}>{content.platformCode}</Badge></TableCell>
                        <TableCell className="max-w-[200px] truncate">{content.title || "Untitled"}</TableCell>
                        <TableCell>
                          <Badge variant={content.status === "approved" ? "default" : content.status === "pending_approval" ? "secondary" : "outline"}>
                            {content.status.replace(/_/g, " ")}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-gray-500">{format(new Date(content.createdAt), "MMM d, HH:mm")}</TableCell>
                        <TableCell>
                          <Button size="sm" variant="ghost" onClick={() => { setSelectedContent(content); setShowContentDialog(true); }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      <Dialog open={showContentDialog} onOpenChange={setShowContentDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Badge className={platformBgColors[selectedContent?.platformCode || ""] || ""}>{selectedContent?.platformCode}</Badge>
              {selectedContent?.title || "Content Preview"}
            </DialogTitle>
            <DialogDescription>
              Status: {selectedContent?.status?.replace(/_/g, " ")} | Tone: {selectedContent?.tone}
            </DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)] space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <p className="whitespace-pre-wrap text-sm">{selectedContent?.body}</p>
            </div>
            {selectedContent?.hashtags && selectedContent.hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1">
                {selectedContent.hashtags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">#{tag}</Badge>
                ))}
              </div>
            )}
          </div>
          <DialogFooter className="flex-shrink-0">
            {selectedContent?.status === "pending_approval" && (
              <>
                <Button variant="outline" onClick={() => rejectContentMutation.mutate(selectedContent.id)}>
                  Reject
                </Button>
                <Button onClick={() => approveContentMutation.mutate(selectedContent.id)} className="bg-gradient-to-r from-violet-500 to-fuchsia-500">
                  Approve
                </Button>
              </>
            )}
            {selectedContent?.status !== "pending_approval" && (
              <Button variant="outline" onClick={() => setShowContentDialog(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

const ADMIN_TAB_KEY = "superadmin_active_tab";

function getAdminHeaders(json = false): Record<string, string> {
  const headers: Record<string, string> = {};
  try {
    const authData = localStorage.getItem("superAdminAuth");
    if (authData) {
      const parsed = JSON.parse(authData);
      if (parsed.sessionToken) headers["Authorization"] = `Bearer ${parsed.sessionToken}`;
    }
  } catch {}
  if (json) headers["Content-Type"] = "application/json";
  return headers;
}

function DemoExamTab() {
  const { toast } = useToast();
  const [isCreating, setIsCreating] = useState(false);
  const [isTogglingProctoring, setIsTogglingProctoring] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const { data: demoStatus, refetch: refetchStatus, isLoading: statusLoading } = useQuery<any>({
    queryKey: ["/api/admin/demo-exam/status"],
    staleTime: 0,
    retry: 1,
  });

  const searchStudents = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); return; }
    setIsSearching(true);
    try {
      const res = await fetch(`/api/admin/demo-exam/search-students?q=${encodeURIComponent(q)}`, { credentials: "include", headers: getAdminHeaders() });
      const data = await res.json();
      setSearchResults(data);
    } catch { setSearchResults([]); }
    finally { setIsSearching(false); }
  };

  const createDemoExam = async () => {
    setIsCreating(true);
    try {
      const res = await fetch("/api/admin/demo-exam/create", { method: "POST", credentials: "include", headers: getAdminHeaders() });
      const data = await res.json();
      if (data.success) {
        toast({ title: data.alreadyExists ? "Demo Exam Already Exists" : "Demo Exam Created!", description: `GK Olympiad with ${data.questionCount} questions is ready.` });
        await queryClient.invalidateQueries({ queryKey: ["/api/admin/demo-exam/status"] });
        await refetchStatus();
      } else {
        toast({ title: "Error", description: data.message || "Failed to create demo exam", variant: "destructive" });
      }
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setIsCreating(false); }
  };

  const toggleProctoring = async () => {
    setIsTogglingProctoring(true);
    try {
      const res = await fetch("/api/admin/demo-exam/toggle-proctoring", { method: "POST", credentials: "include", headers: getAdminHeaders() });
      const data = await res.json();
      if (data.success) {
        toast({ title: data.proctoring ? "Proctoring Activated" : "Proctoring Deactivated", description: data.proctoring ? "AI proctoring is now active for this exam." : "Proctoring has been turned off." });
        await queryClient.invalidateQueries({ queryKey: ["/api/admin/demo-exam/status"] });
        await refetchStatus();
      } else {
        toast({ title: "Error", description: data.message || "Failed to toggle proctoring", variant: "destructive" });
      }
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
    finally { setIsTogglingProctoring(false); }
  };

  const assignStudent = async (studentId: number) => {
    try {
      const res = await fetch("/api/admin/demo-exam/assign", { method: "POST", headers: getAdminHeaders(true), credentials: "include", body: JSON.stringify({ studentId }) });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Student Assigned!", description: `${data.studentName} can now take the demo exam.` });
        refetchStatus();
        setSearchQuery("");
        setSearchResults([]);
      } else { toast({ title: "Error", description: data.message, variant: "destructive" }); }
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const resetStudent = async (studentId: number) => {
    try {
      const res = await fetch("/api/admin/demo-exam/reset", { method: "POST", headers: getAdminHeaders(true), credentials: "include", body: JSON.stringify({ studentId }) });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Exam Reset!", description: "Student can retake the demo exam now." });
        refetchStatus();
      }
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const unassignStudent = async (studentId: number) => {
    try {
      const res = await fetch("/api/admin/demo-exam/unassign", { method: "POST", headers: getAdminHeaders(true), credentials: "include", body: JSON.stringify({ studentId }) });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Student Removed", description: "Student has been unassigned from the demo exam." });
        refetchStatus();
      }
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const deleteDemoExam = async () => {
    if (!confirm("Are you sure you want to delete the demo exam? This will remove all assignments, attempts, and questions.")) return;
    try {
      const res = await fetch("/api/admin/demo-exam", { method: "DELETE", credentials: "include", headers: getAdminHeaders() });
      const data = await res.json();
      if (data.success) {
        toast({ title: "Demo Exam Deleted", description: data.message });
        refetchStatus();
      }
    } catch (err: any) { toast({ title: "Error", description: err.message, variant: "destructive" }); }
  };

  const assignedStudentIds = new Set((demoStatus?.assignedStudents || []).map((s: any) => s.studentId));
  const breakdown = demoStatus?.breakdown || { mcq: 0, trueFalse: 0, imageBased: 0, audio: 0 };

  if (statusLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
        <span className="ml-3 text-muted-foreground">Loading demo exam status...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {!demoStatus?.exists ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-purple-500" />
              Create Demo Exam
            </CardTitle>
            <CardDescription>
              Create a General Knowledge Olympiad with 30 mixed questions for demo and testing purposes. This exam will have question and option shuffling enabled — every student gets a different order.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6 dark:bg-blue-950/20 dark:border-blue-800">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-800 dark:text-blue-400">What will be created</p>
                  <ul className="text-sm text-blue-700 dark:text-blue-500 mt-1 space-y-1">
                    <li>1 GK Olympiad — 30 mixed questions (English + Hindi + Punjabi)</li>
                    <li>Question & option shuffle enabled per student</li>
                    <li>45 minutes duration, 4 marks each, 120 total marks</li>
                    <li>Class 1-12, no negative marking, proctoring OFF (toggle anytime)</li>
                    <li>Exam will NOT be visible on public pages</li>
                  </ul>
                  <div className="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                    <p className="font-medium text-blue-800 dark:text-blue-400 mb-2">Question Breakdown</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <div className="bg-white/60 dark:bg-blue-900/30 rounded-md p-2 text-center">
                        <p className="text-lg font-bold text-purple-600">12</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">MCQ</p>
                        <p className="text-[9px] text-blue-500">8 EN + 4 HI</p>
                      </div>
                      <div className="bg-white/60 dark:bg-blue-900/30 rounded-md p-2 text-center">
                        <p className="text-lg font-bold text-emerald-600">5</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">True/False</p>
                        <p className="text-[9px] text-blue-500">English</p>
                      </div>
                      <div className="bg-white/60 dark:bg-blue-900/30 rounded-md p-2 text-center">
                        <p className="text-lg font-bold text-orange-600">5</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">Image-Based</p>
                        <p className="text-[9px] text-blue-500">English</p>
                      </div>
                      <div className="bg-white/60 dark:bg-blue-900/30 rounded-md p-2 text-center">
                        <p className="text-lg font-bold text-rose-600">8</p>
                        <p className="text-xs text-blue-700 dark:text-blue-400">Audio Answer</p>
                        <p className="text-[9px] text-blue-500">3 EN + 3 HI + 2 PA</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <Button onClick={createDemoExam} disabled={isCreating} size="lg" className="bg-gradient-to-r from-purple-600 to-pink-600 text-white" data-testid="button-create-demo-exam">
              {isCreating ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Creating...</>) : (<><Sparkles className="w-5 h-5 mr-2" />CREATE DEMO EXAM</>)}
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    {demoStatus.exam?.title?.replace("DEMO_GK_", "") || "Demo GK Olympiad"}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {demoStatus.questionCount} questions • {demoStatus.exam?.durationMinutes} min • {demoStatus.exam?.totalMarks} marks • Shuffle ON
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" className="text-red-600 border-red-200 hover:bg-red-50" onClick={deleteDemoExam} data-testid="button-delete-demo-exam">
                    <Trash2 className="w-4 h-4 mr-1" /> Delete Exam
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className="rounded-lg bg-purple-50 dark:bg-purple-950/20 p-3 text-center">
                  <p className="text-2xl font-bold text-purple-600">{demoStatus.questionCount}</p>
                  <p className="text-xs text-purple-700 dark:text-purple-400">Total Questions</p>
                </div>
                <div className="rounded-lg bg-blue-50 dark:bg-blue-950/20 p-3 text-center">
                  <p className="text-2xl font-bold text-blue-600">{demoStatus.assignedStudents?.length || 0}</p>
                  <p className="text-xs text-blue-700 dark:text-blue-400">Assigned</p>
                </div>
                <div className="rounded-lg bg-green-50 dark:bg-green-950/20 p-3 text-center">
                  <p className="text-2xl font-bold text-green-600">{demoStatus.assignedStudents?.filter((s: any) => s.hasAttempted)?.length || 0}</p>
                  <p className="text-xs text-green-700 dark:text-green-400">Attempted</p>
                </div>
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/20 p-3 text-center">
                  <p className="text-2xl font-bold text-amber-600">{demoStatus.exam?.durationMinutes} min</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400">Duration</p>
                </div>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                <div className="rounded-md border border-purple-200 bg-purple-50/50 dark:bg-purple-950/10 p-2 text-center">
                  <p className="text-lg font-bold text-purple-600">{breakdown.mcq}</p>
                  <p className="text-xs text-muted-foreground">MCQ</p>
                  {(demoStatus as any)?.languageBreakdown?.mcq && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">{(demoStatus as any).languageBreakdown.mcq.en || 0} EN + {(demoStatus as any).languageBreakdown.mcq.hi || 0} HI</p>
                  )}
                </div>
                <div className="rounded-md border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-950/10 p-2 text-center">
                  <p className="text-lg font-bold text-emerald-600">{breakdown.trueFalse}</p>
                  <p className="text-xs text-muted-foreground">True/False</p>
                </div>
                <div className="rounded-md border border-orange-200 bg-orange-50/50 dark:bg-orange-950/10 p-2 text-center">
                  <p className="text-lg font-bold text-orange-600">{breakdown.imageBased}</p>
                  <p className="text-xs text-muted-foreground">Image-Based</p>
                </div>
                <div className="rounded-md border border-rose-200 bg-rose-50/50 dark:bg-rose-950/10 p-2 text-center">
                  <p className="text-lg font-bold text-rose-600">{breakdown.audio}</p>
                  <p className="text-xs text-muted-foreground">Audio Answer</p>
                  {(demoStatus as any)?.languageBreakdown?.audio && (
                    <p className="text-[9px] text-muted-foreground mt-0.5">{(demoStatus as any).languageBreakdown.audio.en || 0} EN + {(demoStatus as any).languageBreakdown.audio.hi || 0} HI + {(demoStatus as any).languageBreakdown.audio.pa || 0} PA</p>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-3">
                <div className="flex items-center gap-3">
                  <Shield className={`w-5 h-5 ${demoStatus.exam?.proctoring ? "text-green-500" : "text-gray-400"}`} />
                  <div>
                    <p className="text-sm font-medium">AI Proctoring</p>
                    <p className="text-xs text-muted-foreground">
                      {demoStatus.exam?.proctoring ? "Active — Camera & behavior monitoring enabled" : "Disabled — No proctoring during exam"}
                    </p>
                  </div>
                </div>
                <Button
                  variant="default"
                  size="sm"
                  onClick={toggleProctoring}
                  disabled={isTogglingProctoring}
                  className={demoStatus.exam?.proctoring ? "bg-red-600 hover:bg-red-700 text-white" : "bg-green-600 hover:bg-green-700 text-white"}
                  data-testid="button-toggle-proctoring"
                >
                  {isTogglingProctoring ? <Loader2 className="w-4 h-4 animate-spin" /> : demoStatus.exam?.proctoring ? "Deactivate" : "Activate"}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <UserPlus className="w-5 h-5 text-blue-500" />
                Assign Student
              </CardTitle>
              <CardDescription>Search by name, email, or Student ID to assign the demo exam</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input placeholder="Search student by name, email, or ID..." value={searchQuery} onChange={(e) => searchStudents(e.target.value)} className="pl-10" data-testid="input-search-demo-student" />
                {isSearching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />}
              </div>
              {searchResults.length > 0 && (
                <div className="mt-3 border rounded-lg divide-y max-h-64 overflow-y-auto">
                  {searchResults.map((student: any) => (
                    <div key={student.id} className="flex items-center justify-between p-3 hover:bg-muted/50">
                      <div>
                        <p className="font-medium text-sm">{student.firstName} {student.lastName}</p>
                        <p className="text-xs text-muted-foreground">{student.studentId} • {student.email} • {student.gradeLevel}</p>
                      </div>
                      {assignedStudentIds.has(student.id) ? (
                        <Badge variant="secondary" className="text-xs">Already Assigned</Badge>
                      ) : (
                        <Button size="sm" variant="outline" onClick={() => assignStudent(student.id)} data-testid={`button-assign-${student.id}`}>
                          <UserPlus className="w-3.5 h-3.5 mr-1" /> Assign
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {demoStatus.assignedStudents && demoStatus.assignedStudents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Users className="w-5 h-5 text-green-500" />
                  Assigned Students ({demoStatus.assignedStudents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Student</TableHead>
                        <TableHead>Student ID</TableHead>
                        <TableHead>Class</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Score</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {demoStatus.assignedStudents.map((student: any) => (
                        <TableRow key={student.regId} data-testid={`row-demo-student-${student.studentId}`}>
                          <TableCell>
                            <div>
                              <p className="font-medium text-sm">{student.studentName}</p>
                              <p className="text-xs text-muted-foreground">{student.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{student.studentIdCode}</TableCell>
                          <TableCell className="text-sm">{student.gradeLevel}</TableCell>
                          <TableCell>
                            {student.hasAttempted ? (
                              <Badge className={student.attemptStatus === "completed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}>
                                {student.attemptStatus === "completed" ? "Completed" : "In Progress"}
                              </Badge>
                            ) : (
                              <Badge variant="secondary">Not Started</Badge>
                            )}
                          </TableCell>
                          <TableCell className="font-semibold">
                            {student.hasAttempted && student.attemptScore !== null ? `${student.attemptScore}/${demoStatus.exam?.totalMarks}` : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center gap-2 justify-end">
                              {student.hasAttempted && (
                                <Button size="sm" variant="outline" className="text-amber-600 border-amber-200 hover:bg-amber-50" onClick={() => resetStudent(student.studentId)} data-testid={`button-reset-${student.studentId}`}>
                                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Reset
                                </Button>
                              )}
                              <Button size="sm" variant="outline" className="text-red-600 border-red-200 hover:bg-red-50" onClick={() => unassignStudent(student.studentId)} data-testid={`button-unassign-${student.studentId}`}>
                                <UserMinus className="w-3.5 h-3.5 mr-1" /> Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

interface DocsVersions {
  lastUpdated: string;
  documents: Record<string, { version: string; lastModified: string; changelog?: { date: string; version: string; changes: string }[] }>;
}

function DocumentationSection({ toast }: { toast: (opts: { title: string; description: string; variant?: "default" | "destructive" }) => void }) {
  const [versions, setVersions] = useState<DocsVersions | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const loadVersions = async () => {
    try {
      const res = await fetch('/docs-versions.json?t=' + Date.now());
      const data = await res.json();
      setVersions(data);
    } catch (e) {
      console.error('Failed to load versions:', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadVersions();
  }, []);

  const getVersion = (docKey: string) => {
    return versions?.documents[docKey]?.version || '1.0';
  };

  const getLatestChange = () => {
    if (!versions?.documents) return 'Auto-versioning system active';
    const allChanges = Object.values(versions.documents)
      .flatMap(doc => doc.changelog || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (allChanges.length === 0) return 'Auto-versioning system active';
    return allChanges[0].changes;
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      const timestamp = Date.now();
      await Promise.all([
        fetch(`/features-presentation.html?v=${timestamp}`, { cache: 'reload' }),
        fetch(`/security-presentation.html?v=${timestamp}`, { cache: 'reload' }),
        fetch(`/results-presentation.html?v=${timestamp}`, { cache: 'reload' }),
        fetch(`/guides/portal-guide.html?v=${timestamp}`, { cache: 'reload' }),
        fetch(`/aws-deployment-guide.html?v=${timestamp}`, { cache: 'reload' }),
        fetch(`/system-audit-report.html?v=${timestamp}`, { cache: 'reload' }),
        fetch(`/docs-versions.json?v=${timestamp}`, { cache: 'reload' })
      ]);
      await loadVersions();
      toast({
        title: "Documentation Refreshed",
        description: "Latest versions loaded successfully",
      });
    } catch (error) {
      toast({
        title: "Refresh Failed",
        description: "Could not refresh documentation",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  return (
    <>
      <Card className="bg-white/80 backdrop-blur border-gray-200/50">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-gray-800">
                <FileText className="w-5 h-5 text-violet-500" />
                Platform Documentation
              </CardTitle>
              <CardDescription>
                View and access all platform documentation with automatic versioning
              </CardDescription>
            </div>
            <Badge variant="outline" className="text-violet-600 border-violet-300">
              Super Admin Only
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-violet-200">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
                <Layout className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-gray-800">Platform Presentations</h3>
              <Badge variant="outline" className="text-violet-600 border-violet-300 text-xs">For Clients & Partners</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-gradient-to-br from-violet-50 to-fuchsia-50 border border-violet-200/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white">
                      <FileText className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Features Presentation</h4>
                      <p className="text-xs text-gray-500">Platform capabilities overview</p>
                    </div>
                  </div>
                  <Badge className="bg-violet-100 text-violet-700">v{getVersion('features-presentation')}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('/features-presentation.html', '_blank')} className="flex-1" data-testid="button-view-features">
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('/features-presentation.html', '_blank')} className="flex-1">
                    <Download className="w-4 h-4 mr-1" /> Print PDF
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-red-50 to-orange-50 border border-red-200/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Security Presentation</h4>
                      <p className="text-xs text-gray-500">Proctoring & security features</p>
                    </div>
                  </div>
                  <Badge className="bg-red-100 text-red-700">v{getVersion('security-presentation')}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('/security-presentation.html', '_blank')} className="flex-1" data-testid="button-view-security">
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('/security-presentation.html', '_blank')} className="flex-1">
                    <Download className="w-4 h-4 mr-1" /> Print PDF
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Results & Ranking</h4>
                      <p className="text-xs text-gray-500">Dual ranking mechanisms</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">v{getVersion('results-presentation')}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('/results-presentation.html', '_blank')} className="flex-1" data-testid="button-view-results">
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('/results-presentation.html', '_blank')} className="flex-1">
                    <Download className="w-4 h-4 mr-1" /> Print PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-amber-200">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                <Server className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-gray-800">Technical Documentation</h3>
              <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">For Developers & Admins</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white">
                      <Globe className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Full Portal Guide</h4>
                      <p className="text-xs text-gray-500">Complete A-Z documentation</p>
                    </div>
                  </div>
                  <Badge className="bg-amber-100 text-amber-700">v{getVersion('portal-guide')}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('/guides/portal-guide.html', '_blank')} className="flex-1" data-testid="button-view-portal">
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('/guides/portal-guide.html', '_blank')} className="flex-1">
                    <Download className="w-4 h-4 mr-1" /> Print PDF
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
                      <Server className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">AWS Deployment Guide</h4>
                      <p className="text-xs text-gray-500">Complete cloud deployment manual</p>
                    </div>
                  </div>
                  <Badge className="bg-orange-100 text-orange-700">v{getVersion('aws-deployment-guide')}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('/aws-deployment-guide.html', '_blank')} className="flex-1" data-testid="button-view-aws">
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('/aws-deployment-guide.html', '_blank')} className="flex-1">
                    <Download className="w-4 h-4 mr-1" /> Print PDF
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-teal-50 to-cyan-50 border border-teal-200/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">System Audit Report</h4>
                      <p className="text-xs text-gray-500">Transparent health & methodology</p>
                    </div>
                  </div>
                  <Badge className="bg-teal-100 text-teal-700">v{getVersion('system-audit-report')}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('/system-audit-report.html', '_blank')} className="flex-1" data-testid="button-view-audit">
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('/system-audit-report.html', '_blank')} className="flex-1">
                    <Download className="w-4 h-4 mr-1" /> Print PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-pink-200">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white">
                <TrendingUp className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-gray-800">Business Documentation</h3>
              <Badge variant="outline" className="text-pink-600 border-pink-300 text-xs">Confidential</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="p-4 rounded-lg bg-gradient-to-br from-pink-50 to-purple-50 border border-pink-200/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center text-white">
                      <TrendingUp className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Business & Revenue Model</h4>
                      <p className="text-xs text-gray-500">Revenue streams & credit system</p>
                    </div>
                  </div>
                  <Badge className="bg-pink-100 text-pink-700">v1.0</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('/business-revenue-model.html', '_blank')} className="flex-1" data-testid="button-view-revenue">
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('/business-revenue-model.html', '_blank')} className="flex-1">
                    <Download className="w-4 h-4 mr-1" /> Print PDF
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-pink-50 to-fuchsia-50 border border-pink-200/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-pink-500 flex items-center justify-center text-white">
                      <svg viewBox="0 0 100 100" className="w-5 h-5">
                        <polygon points="50,10 88,75 12,75" fill="white" />
                        <polygon points="50,90 12,25 88,25" fill="white" opacity="0.7" />
                      </svg>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">Brand Assets (HD)</h4>
                      <p className="text-xs text-gray-500">Logo, icon & visual identity</p>
                    </div>
                  </div>
                  <Badge className="bg-pink-100 text-pink-700">v1.0</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('/brand/assets', '_blank')} className="flex-1" data-testid="button-view-brand-assets">
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('/brand/assets', '_blank')} className="flex-1" data-testid="button-download-brand-assets">
                    <Download className="w-4 h-4 mr-1" /> Download
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-emerald-200">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center text-white">
                <ClipboardCheck className="w-4 h-4" />
              </div>
              <h3 className="font-semibold text-gray-800">QA & Testing Guides</h3>
              <Badge variant="outline" className="text-emerald-600 border-emerald-300 text-xs">For QA Team</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-green-50 border border-emerald-200/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white">
                      <ClipboardCheck className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">QA Tester Guide</h4>
                      <p className="text-xs text-gray-500">Test cases, runs & defects</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-100 text-emerald-700">v1.0</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('/guides/qa-tester-guide.html', '_blank')} className="flex-1" data-testid="button-view-qa-tester">
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('/guides/qa-tester-guide.html', '_blank')} className="flex-1">
                    <Download className="w-4 h-4 mr-1" /> Print PDF
                  </Button>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gradient-to-br from-violet-50 to-purple-50 border border-violet-200/50">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-800">QA Admin Guide</h4>
                      <p className="text-xs text-gray-500">Release governance & decisions</p>
                    </div>
                  </div>
                  <Badge className="bg-violet-100 text-violet-700">v1.0</Badge>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => window.open('/guides/qa-admin-guide.html', '_blank')} className="flex-1" data-testid="button-view-qa-admin">
                    <Eye className="w-4 h-4 mr-1" /> View
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => window.open('/guides/qa-admin-guide.html', '_blank')} className="flex-1">
                    <Download className="w-4 h-4 mr-1" /> Print PDF
                  </Button>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 rounded-lg bg-blue-50 border border-blue-200/50">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                <RefreshCw className="w-4 h-4 text-blue-600" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="font-semibold text-blue-800">Automatic Versioning System</h4>
                  <Button 
                    variant="outline" 
                    size="sm"
                    disabled={isRefreshing}
                    onClick={handleRefresh}
                    className="bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
                    data-testid="button-refresh-docs"
                  >
                    {isRefreshing ? (
                      <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    ) : (
                      <RefreshCw className="w-3 h-3 mr-1" />
                    )}
                    {isRefreshing ? "Refreshing..." : "Refresh"}
                  </Button>
                </div>
                <p className="text-sm text-blue-600 mt-1">
                  All documentation is automatically versioned. Version numbers are tracked in a central registry 
                  and updated when changes are made. This applies to all current and future documents.
                </p>
                <p className="text-xs text-blue-500 mt-2">
                  Latest update: {getLatestChange()}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-white/80 backdrop-blur border-gray-200/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-gray-800">
            <Volume2 className="w-5 h-5 text-fuchsia-500" />
            Audio Olympiad Demo
          </CardTitle>
          <CardDescription>
            Test the voice-based examination system where students answer questions via voice recording.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <a href="/audio-olympiad-demo" target="_blank" rel="noopener noreferrer" data-testid="link-audio-demo">
            <Button variant="default">
              <Play className="w-4 h-4 mr-2" />
              Launch Demo
            </Button>
          </a>
        </CardContent>
      </Card>
    </>
  );
}

function OlympiadEditContent({ olympiad, onClose }: { olympiad: any; onClose: () => void }) {
  const { toast } = useToast();
  const minCl = olympiad.minClass || 1;
  const maxCl = olympiad.maxClass || 12;
  const classRange = Array.from({ length: maxCl - minCl + 1 }, (_, i) => minCl + i);
  const [editTab, setEditTab] = useState<string>("basic");
  const [syllabusData, setSyllabusData] = useState<Record<string, string>>(() => {
    const existing = olympiad.syllabusData as Record<string, string> | null;
    return existing || {};
  });
  const [examPatternData, setExamPatternData] = useState<{ sections: Array<{ name: string; questions: number; marks: number }> }>(() => {
    const existing = olympiad.examPattern as any;
    return existing || { sections: [] };
  });
  const [sampleQuestionsData, setSampleQuestionsData] = useState<Record<string, Array<{ question: string; options: string[]; answer: number }>>>(() => {
    const existing = olympiad.sampleQuestions as Record<string, any[]> | null;
    return existing || {};
  });
  const [prepTips, setPrepTips] = useState<string>(olympiad.preparationTips || "");
  const categoryLabel = minCl <= 5 ? "Little Champs" : "Elite Seniors";
  const [selectedClasses, setSelectedClasses] = useState<number[]>(() => {
    return classRange;
  });

  const toggleClass = (cls: number) => {
    setSelectedClasses(prev => 
      prev.includes(cls) ? prev.filter(c => c !== cls) : [...prev, cls].sort((a, b) => a - b)
    );
  };

  return (
    <>
      <div className="flex gap-1 border-b mb-4 overflow-x-auto">
        {[
          { key: "basic", label: "Basic Info" },
          { key: "syllabus", label: "Syllabus" },
          { key: "pattern", label: "Exam Pattern" },
          { key: "samples", label: "Sample Questions" },
          { key: "tips", label: "Prep Tips" },
        ].map(tab => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setEditTab(tab.key)}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${editTab === tab.key ? "border-purple-500 text-purple-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="max-h-[60vh] overflow-y-auto">
      {editTab === "basic" && (
      <form id="olympiad-edit-form" onSubmit={async (e) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        try {
          await apiRequest("PATCH", `/sysctrl/api/exams/${olympiad.id}`, {
              title: formData.get("title"),
              description: formData.get("description"),
              durationMinutes: parseInt(formData.get("durationMinutes") as string),
              totalMarks: parseInt(formData.get("totalMarks") as string),
              participationFee: parseInt(formData.get("participationFee") as string) * 100,
              isVisible: formData.get("isVisible") === "on",
              proctoring: formData.get("proctoring") === "on",
              status: formData.get("status"),
              minClass: selectedClasses.length > 0 ? Math.min(...selectedClasses) : minCl,
              maxClass: selectedClasses.length > 0 ? Math.max(...selectedClasses) : maxCl,
            });
          toast({ title: "Success", description: "Olympiad updated successfully" });
          queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/exams"] });
          onClose();
        } catch (err) {
          toast({ title: "Error", description: "Failed to update olympiad", variant: "destructive" });
        }
      }}>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" name="title" defaultValue={olympiad.title} />
            </div>
            <div>
              <Label htmlFor="durationMinutes">Duration (minutes)</Label>
              <Input id="durationMinutes" name="durationMinutes" type="number" defaultValue={olympiad.durationMinutes} />
            </div>
            <div>
              <Label htmlFor="totalMarks">Total Marks</Label>
              <Input id="totalMarks" name="totalMarks" type="number" defaultValue={olympiad.totalMarks} />
            </div>
            <div>
              <Label htmlFor="participationFee">Fee (₹)</Label>
              <Input id="participationFee" name="participationFee" type="number" defaultValue={olympiad.participationFee / 100} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
              <Select name="status" defaultValue={olympiad.status}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="isVisible" name="isVisible" defaultChecked={olympiad.isVisible} />
              <Label htmlFor="isVisible">Visible</Label>
            </div>
            <div className="flex items-center gap-2">
              <Switch id="proctoring" name="proctoring" defaultChecked={olympiad.proctoring} />
              <Label htmlFor="proctoring">Proctoring</Label>
            </div>
            <div className="col-span-2">
              <Label className="mb-2 block">Category</Label>
              <Badge className={minCl <= 5 ? "bg-amber-100 text-amber-700 text-sm px-3 py-1" : "bg-blue-100 text-blue-700 text-sm px-3 py-1"}>
                {categoryLabel} (Class {minCl}-{maxCl})
              </Badge>
            </div>
            <div className="col-span-2">
              <Label className="mb-2 block">Applicable Classes</Label>
              <div className="flex flex-wrap gap-2">
                {classRange.map(cls => (
                  <label key={cls} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border cursor-pointer transition-colors text-sm ${selectedClasses.includes(cls) ? "bg-purple-50 border-purple-300 text-purple-700" : "bg-gray-50 border-gray-200 text-gray-500"}`}>
                    <input
                      type="checkbox"
                      checked={selectedClasses.includes(cls)}
                      onChange={() => toggleClass(cls)}
                      className="w-3.5 h-3.5 accent-purple-600"
                    />
                    Class {cls}
                  </label>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <button type="button" onClick={() => setSelectedClasses([...classRange])} className="text-xs text-purple-600 hover:underline">Select All</button>
                <button type="button" onClick={() => setSelectedClasses([])} className="text-xs text-gray-500 hover:underline">Deselect All</button>
              </div>
            </div>
            <div className="col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" name="description" defaultValue={olympiad.description} rows={3} />
            </div>
          </div>
        </div>
        <DialogFooter className="mt-4">
          <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
          <Button type="submit">Save Changes</Button>
        </DialogFooter>
      </form>
      )}

      {editTab === "syllabus" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Add syllabus content for each class (Class {minCl} to {maxCl})</p>
          {classRange.map(cls => (
            <div key={cls}>
              <Label>Class {cls} Syllabus</Label>
              <Textarea
                value={syllabusData[`class_${cls}`] || ""}
                onChange={(e) => setSyllabusData(prev => ({ ...prev, [`class_${cls}`]: e.target.value }))}
                placeholder={`Enter syllabus topics for Class ${cls}. Use semicolons to separate topics.`}
                rows={3}
              />
            </div>
          ))}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={async () => {
              try {
                await apiRequest("PATCH", `/sysctrl/api/exams/${olympiad.id}`, { syllabusData });
                toast({ title: "Success", description: "Syllabus saved successfully" });
                queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/exams"] });
              } catch (err) {
                toast({ title: "Error", description: "Failed to save syllabus", variant: "destructive" });
              }
            }}>Save Syllabus</Button>
          </DialogFooter>
        </div>
      )}

      {editTab === "pattern" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Define exam sections with question count and marks</p>
          {examPatternData.sections.map((section, idx) => (
            <div key={idx} className="flex gap-2 items-end">
              <div className="flex-1">
                <Label>Section Name</Label>
                <Input
                  value={section.name}
                  onChange={(e) => {
                    const updated = [...examPatternData.sections];
                    updated[idx] = { ...updated[idx], name: e.target.value };
                    setExamPatternData({ sections: updated });
                  }}
                  placeholder="e.g. Basic Mathematics"
                />
              </div>
              <div className="w-24">
                <Label>Questions</Label>
                <Input
                  type="number"
                  value={section.questions}
                  onChange={(e) => {
                    const updated = [...examPatternData.sections];
                    updated[idx] = { ...updated[idx], questions: parseInt(e.target.value) || 0 };
                    setExamPatternData({ sections: updated });
                  }}
                />
              </div>
              <div className="w-24">
                <Label>Marks</Label>
                <Input
                  type="number"
                  value={section.marks}
                  onChange={(e) => {
                    const updated = [...examPatternData.sections];
                    updated[idx] = { ...updated[idx], marks: parseInt(e.target.value) || 0 };
                    setExamPatternData({ sections: updated });
                  }}
                />
              </div>
              <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => {
                setExamPatternData({ sections: examPatternData.sections.filter((_, i) => i !== idx) });
              }}>✕</Button>
            </div>
          ))}
          <Button type="button" variant="outline" size="sm" onClick={() => {
            setExamPatternData({ sections: [...examPatternData.sections, { name: "", questions: 0, marks: 0 }] });
          }}>+ Add Section</Button>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={async () => {
              try {
                await apiRequest("PATCH", `/sysctrl/api/exams/${olympiad.id}`, { examPattern: examPatternData });
                toast({ title: "Success", description: "Exam pattern saved successfully" });
                queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/exams"] });
              } catch (err) {
                toast({ title: "Error", description: "Failed to save exam pattern", variant: "destructive" });
              }
            }}>Save Exam Pattern</Button>
          </DialogFooter>
        </div>
      )}

      {editTab === "samples" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Add sample questions for each class (Class {minCl} to {maxCl})</p>
          {classRange.map(cls => {
            const classKey = `class_${cls}`;
            const questions = sampleQuestionsData[classKey] || [];
            return (
              <div key={cls} className="border rounded-lg p-4 space-y-3">
                <div className="flex justify-between items-center">
                  <Label className="text-base font-semibold">Class {cls}</Label>
                  <Button type="button" variant="outline" size="sm" onClick={() => {
                    setSampleQuestionsData(prev => ({
                      ...prev,
                      [classKey]: [...(prev[classKey] || []), { question: "", options: ["", "", "", ""], answer: 0 }]
                    }));
                  }}>+ Add Question</Button>
                </div>
                {questions.map((q, qIdx) => (
                  <div key={qIdx} className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-2">
                    <div className="flex gap-2 items-start">
                      <span className="text-sm font-medium text-gray-500 mt-2">Q{qIdx + 1}.</span>
                      <div className="flex-1">
                        <Input
                          value={q.question}
                          onChange={(e) => {
                            const updated = { ...sampleQuestionsData };
                            updated[classKey] = [...(updated[classKey] || [])];
                            updated[classKey][qIdx] = { ...updated[classKey][qIdx], question: e.target.value };
                            setSampleQuestionsData(updated);
                          }}
                          placeholder="Enter question"
                        />
                      </div>
                      <Button type="button" variant="ghost" size="sm" className="text-red-500" onClick={() => {
                        setSampleQuestionsData(prev => ({
                          ...prev,
                          [classKey]: prev[classKey].filter((_, i) => i !== qIdx)
                        }));
                      }}>✕</Button>
                    </div>
                    <div className="ml-8 grid grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => (
                        <div key={oIdx} className="flex items-center gap-1">
                          <input
                            type="radio"
                            name={`answer-${cls}-${qIdx}`}
                            checked={q.answer === oIdx}
                            onChange={() => {
                              const updated = { ...sampleQuestionsData };
                              updated[classKey] = [...(updated[classKey] || [])];
                              updated[classKey][qIdx] = { ...updated[classKey][qIdx], answer: oIdx };
                              setSampleQuestionsData(updated);
                            }}
                            className="w-3 h-3"
                          />
                          <Input
                            value={opt}
                            onChange={(e) => {
                              const updated = { ...sampleQuestionsData };
                              updated[classKey] = [...(updated[classKey] || [])];
                              const opts = [...updated[classKey][qIdx].options];
                              opts[oIdx] = e.target.value;
                              updated[classKey][qIdx] = { ...updated[classKey][qIdx], options: opts };
                              setSampleQuestionsData(updated);
                            }}
                            placeholder={`Option ${String.fromCharCode(65 + oIdx)}`}
                            className="h-8 text-sm"
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
                {questions.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-2">No sample questions for Class {cls} yet</p>
                )}
              </div>
            );
          })}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={async () => {
              try {
                await apiRequest("PATCH", `/sysctrl/api/exams/${olympiad.id}`, { sampleQuestions: sampleQuestionsData });
                toast({ title: "Success", description: "Sample questions saved successfully" });
                queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/exams"] });
              } catch (err) {
                toast({ title: "Error", description: "Failed to save sample questions", variant: "destructive" });
              }
            }}>Save Sample Questions</Button>
          </DialogFooter>
        </div>
      )}

      {editTab === "tips" && (
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Add preparation tips for students (one per line)</p>
          <Textarea
            value={prepTips}
            onChange={(e) => setPrepTips(e.target.value)}
            placeholder="Enter preparation tips, one per line..."
            rows={10}
          />
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="button" onClick={async () => {
              try {
                await apiRequest("PATCH", `/sysctrl/api/exams/${olympiad.id}`, { preparationTips: prepTips });
                toast({ title: "Success", description: "Preparation tips saved successfully" });
                queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/exams"] });
              } catch (err) {
                toast({ title: "Error", description: "Failed to save preparation tips", variant: "destructive" });
              }
            }}>Save Tips</Button>
          </DialogFooter>
        </div>
      )}
      </div>
    </>
  );
}

export default function SuperAdminDashboard() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<AdminTab>(() => {
    // Check for hash in URL first (e.g., #docs)
    const hash = window.location.hash.replace('#', '');
    const validTabs: AdminTab[] = ["live", "analytics", "exams", "olympiads", "proctoring", "demoexam", "finance", "partners", "marketing", "email", "chatbot", "guruji", "cms", "blog", "media", "health", "docs", "pwa", "rbac", "settings", "systemaudit", "qa", "dbsync", "terminal", "coupons", "whatsapp", "leaderboards", "parents", "notifications", "support", "reports", "certificates"];
    if (hash && validTabs.includes(hash as AdminTab)) {
      return hash as AdminTab;
    }
    const savedTab = localStorage.getItem(ADMIN_TAB_KEY);
    return (savedTab as AdminTab) || "live";
  });
  
  useEffect(() => {
    localStorage.setItem(ADMIN_TAB_KEY, activeTab);
    // Update URL hash when tab changes
    window.history.replaceState(null, '', `#${activeTab}`);
  }, [activeTab]);
  const [searchQuery, setSearchQuery] = useState("");
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [liveUpdates, setLiveUpdates] = useState(true);
  const [isCreateOlympiadOpen, setIsCreateOlympiadOpen] = useState(false);
  const [isAIGeneratorOpen, setIsAIGeneratorOpen] = useState(false);
  const [isBulkUploadOpen, setIsBulkUploadOpen] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  
  // Lock screen state
  const [lockPin, setLockPin] = useState("");
  const [lockPinEnabled, setLockPinEnabled] = useState(false);
  const [showPin, setShowPin] = useState(false);
  const [pinError, setPinError] = useState("");
  const { isLocked, lock, unlock } = useLockScreen(lockPin, lockPinEnabled, "super-admin");
  
  // Infrastructure health state
  const [isLogsDialogOpen, setIsLogsDialogOpen] = useState(false);
  const [systemLogs, setSystemLogs] = useState<{timestamp: number; level: string; message: string}[]>([]);
  
  // Geo filter state
  const [selectedCountry, setSelectedCountry] = useState<string>("all");
  const [selectedState, setSelectedState] = useState<string>("all");
  const [selectedCity, setSelectedCity] = useState<string>("all");
  
  // Olympiad management state
  const [selectedOlympiad, setSelectedOlympiad] = useState<any>(null);
  const [isOlympiadViewOpen, setIsOlympiadViewOpen] = useState(false);
  const [isOlympiadEditOpen, setIsOlympiadEditOpen] = useState(false);
  const [olympiadDeleteConfirm, setOlympiadDeleteConfirm] = useState<number | null>(null);
  const [olympiadCategoryFilter, setOlympiadCategoryFilter] = useState<string>("all");
  
  // Live exam heatmap state
  const [selectedHeatmapExam, setSelectedHeatmapExam] = useState<string>("all");

  const getStoredAdmin = () => {
    const stored = localStorage.getItem("superAdminAuth");
    return stored ? JSON.parse(stored) : null;
  };

  const admin = getStoredAdmin();

  // Fetch RBAC sidebar permissions
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
    enabled: !!admin,
  });

  // Check if user has access to a specific tab based on RBAC
  const hasTabAccess = useCallback((tabId: AdminTab): boolean => {
    if (!sidebarPermissions) return true; // Show all while loading
    if (sidebarPermissions.isSuperAdmin) return true; // Super admin sees all
    
    const tabPermissionMap: Record<AdminTab, () => boolean> = {
      live: () => sidebarPermissions.dashboard?.visible ?? false,
      analytics: () => sidebarPermissions.dashboard?.items?.analytics ?? false,
      health: () => sidebarPermissions.dashboard?.items?.systemHealth ?? false,
      exams: () => sidebarPermissions.examManagement?.visible ?? false,
      olympiads: () => sidebarPermissions.examManagement?.visible ?? false,
      proctoring: () => sidebarPermissions.proctoring?.visible ?? false,
      results: () => sidebarPermissions.results?.visible ?? false,
      demoexam: () => true, // Always visible, API enforces superadmin-only access
      finance: () => sidebarPermissions.finance?.visible ?? false,
      partners: () => sidebarPermissions.partners?.visible ?? false,
      marketing: () => sidebarPermissions.marketing?.visible ?? false,
      email: () => sidebarPermissions.marketing?.items?.emailCampaigns ?? false,
      chatbot: () => sidebarPermissions.support?.visible ?? false,
      guruji: () => sidebarPermissions.support?.visible ?? true,
      cms: () => sidebarPermissions.content?.items?.cms ?? false,
      blog: () => sidebarPermissions.content?.items?.blog ?? false,
      media: () => sidebarPermissions.content?.items?.mediaLibrary ?? false,
      docs: () => true, // Always visible
      pwa: () => sidebarPermissions.settings?.visible ?? false,
      rbac: () => sidebarPermissions.isSuperAdmin ?? false, // Only super admins
      dbsync: () => sidebarPermissions.isSuperAdmin ?? false, // Only super admins
      settings: () => sidebarPermissions.settings?.visible ?? false,
      systemaudit: () => sidebarPermissions.isSuperAdmin ?? false, // Only super admins
      qa: () => sidebarPermissions.isSuperAdmin ?? false, // Only super admins
      terminal: () => sidebarPermissions.isSuperAdmin ?? false, // Only super admins
      "manage-students": () => true,
      "manage-supervisors": () => true,
      "manage-schools": () => true,
      "manage-coordinators": () => true,
      "manage-partners": () => true,
      coupons: () => sidebarPermissions.isSuperAdmin ?? true,
      whatsapp: () => sidebarPermissions.isSuperAdmin ?? true,
      leaderboards: () => true,
      parents: () => true,
      notifications: () => true,
      support: () => true,
      reports: () => sidebarPermissions.isSuperAdmin ?? true,
      certificates: () => true,
    };
    
    return tabPermissionMap[tabId]?.() ?? false;
  }, [sidebarPermissions]);

  useEffect(() => {
    if (!admin) {
      setLocation("/sysctrl/login");
    }
  }, [admin, setLocation]);

  const liveUpdatesRef = useRef(liveUpdates);
  const shouldReconnectRef = useRef(true);
  
  useEffect(() => {
    liveUpdatesRef.current = liveUpdates;
  }, [liveUpdates]);

  useEffect(() => {
    if (!admin) return;

    shouldReconnectRef.current = true;

    const connect = () => {
      if (wsRef.current?.readyState === WebSocket.OPEN) return;
      if (!shouldReconnectRef.current) return;

      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const ws = new WebSocket(`${protocol}//${window.location.host}/sysctrl/ws`);

      ws.onopen = () => {
        console.log("WebSocket connected");
        setIsConnected(true);
        ws.send(JSON.stringify({ type: "admin:auth", adminId: admin?.id }));
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "metrics:update" && liveUpdatesRef.current) {
            setMetrics(message.data);
          }
        } catch (err) {
          console.error("WebSocket message parse error:", err);
        }
      };

      ws.onclose = () => {
        console.log("WebSocket disconnected");
        setIsConnected(false);
        if (shouldReconnectRef.current) {
          reconnectTimeoutRef.current = setTimeout(connect, 5000);
        }
      };

      ws.onerror = (err) => {
        console.error("WebSocket error:", err);
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      shouldReconnectRef.current = false;
      if (wsRef.current) {
        wsRef.current.close();
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
    };
  }, [admin?.id]);

  const { data: stats } = useQuery<SystemStats>({
    queryKey: ["/sysctrl/api/stats"],
    enabled: !!admin,
    refetchInterval: 30000
  });

  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/exams"],
    enabled: !!admin
  });

  const { data: payments = [] } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/payments"],
    enabled: !!admin
  });

  // Live exam heatmap data
  const { data: heatmapData } = useQuery<{
    activeExams: { id: number; title: string }[];
    totalLiveStudents: number;
    byState: { state: string; stateCode: string | null; country: string; countryCode: string | null; count: number }[];
    byCountry: { country: string; countryCode: string | null; count: number }[];
  }>({
    queryKey: ["/api/admin/live-exam-heatmap", selectedHeatmapExam],
    queryFn: async () => {
      const params = selectedHeatmapExam !== "all" ? `?examId=${selectedHeatmapExam}` : "";
      const res = await fetch(`/api/admin/live-exam-heatmap${params}`);
      if (!res.ok) throw new Error("Failed to fetch heatmap data");
      return res.json();
    },
    enabled: !!admin,
    refetchInterval: 10000, // Refresh every 10 seconds for live data
  });

  // Infrastructure health queries using TanStack Query
  const { data: apiHealthData, isError: apiError, isLoading: apiLoading } = useQuery<{status: string; timestamp: number}>({
    queryKey: ["/api/health"],
    enabled: !!admin,
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 1,
  });

  const { data: dbHealthData, isError: dbError, isLoading: dbLoading } = useQuery<{status: string; latency: number; database: string; timestamp: number}>({
    queryKey: ["/sysctrl/api/health/database"],
    enabled: !!admin,
    refetchInterval: 10000, // Refresh every 10 seconds
    retry: 1,
  });

  const { data: systemHealthData, refetch: refetchSystemHealth } = useQuery<{
    healthy: boolean;
    services: {
      api: {status: string; port: number; latency: number};
      websocket: {status: string; endpoint: string};
      database: {status: string; latency: number};
    };
    timestamp: number;
  }>({
    queryKey: ["/sysctrl/api/health/system"],
    enabled: !!admin,
    refetchInterval: 30000, // Refresh every 30 seconds
    retry: 1,
  });

  // Proctoring data queries
  const { 
    data: activeProctoringSessionsData = [], 
    refetch: refetchProctoringData,
    isLoading: proctoringLoading,
    isError: proctoringError
  } = useQuery<any[]>({
    queryKey: ["/api/proctor/sessions/active"],
    enabled: !!admin,
    refetchInterval: 5000, // Real-time monitoring - refresh every 5 seconds
    retry: 2,
  });

  const { 
    data: violationRulesData = [],
    isLoading: rulesLoading,
    isError: rulesError
  } = useQuery<any[]>({
    queryKey: ["/api/proctor/rules"],
    enabled: !!admin,
    retry: 2,
  });

  // Calculate proctoring stats from real session data
  // - flaggedSessions: Sessions with high violation scores (>=60 based on schema's flagThreshold)
  // - totalWarnings: Sum of all warning counts across sessions
  // - faceIssues: Sessions where face is not detected during active monitoring
  // - activeSessions: Currently active proctoring sessions
  const proctoringStats = {
    flaggedSessions: activeProctoringSessionsData.filter((s: any) => (s.violationScore || 0) >= 60).length,
    totalWarnings: activeProctoringSessionsData.reduce((sum: number, s: any) => sum + (s.warningCount || 0), 0),
    faceIssues: activeProctoringSessionsData.filter((s: any) => !s.faceDetected && s.status === "active").length,
    activeSessions: activeProctoringSessionsData.filter((s: any) => s.status === "active").length,
  };

  // Derive status from query data with proper error handling
  const derivedApiStatus: "running" | "down" | "checking" = apiError ? "down" : apiLoading ? "checking" : apiHealthData?.status === "ok" ? "running" : "down";
  const derivedDbStatus: "connected" | "disconnected" | "checking" = dbError ? "disconnected" : dbLoading ? "checking" : dbHealthData?.status === "connected" ? "connected" : "disconnected";
  const derivedDbLatency = dbHealthData?.latency || 0;
  // WebSocket status from both client connection AND backend health
  const derivedWsStatus = isConnected && (systemHealthData?.services?.websocket?.status === "running" || !systemHealthData);

  // Infrastructure control mutations using TanStack Query
  const restartMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/sysctrl/api/infrastructure/restart");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Restart Initiated", description: data.message });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to restart services", variant: "destructive" });
    },
  });

  const clearCacheMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/sysctrl/api/infrastructure/clear-cache");
      return res.json();
    },
    onSuccess: (data) => {
      toast({ title: "Cache Cleared", description: data.message });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to clear cache", variant: "destructive" });
    },
  });

  const logsMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/sysctrl/api/infrastructure/logs");
      return res.json();
    },
    onSuccess: (data) => {
      setSystemLogs(data.logs || []);
      setIsLogsDialogOpen(true);
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to fetch logs", variant: "destructive" });
    },
  });

  const healthCheckMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("GET", "/sysctrl/api/health/system");
      return res.json();
    },
    onSuccess: (data) => {
      if (data.healthy) {
        toast({ title: "System Healthy", description: "All services are running normally" });
      } else {
        toast({ title: "System Issues", description: "Some services may be experiencing issues", variant: "destructive" });
      }
      queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/health/system"] });
      queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/health/database"] });
      queryClient.invalidateQueries({ queryKey: ["/api/health"] });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to perform health check", variant: "destructive" });
    },
  });

  const handleRestartServices = () => restartMutation.mutate();
  const handleClearCache = () => clearCacheMutation.mutate();
  const handleViewLogs = () => logsMutation.mutate();
  const handleHealthCheck = () => healthCheckMutation.mutate();

  const handleLogout = () => {
    localStorage.removeItem("superAdminAuth");
    // Clear OTP verification when logging out
    sessionStorage.removeItem("superAdminOtpVerified");
    if (wsRef.current) {
      wsRef.current.close();
    }
    setLocation("/sysctrl/login");
  };

  if (!admin) return null;

  // Grouped menu structure for accordion sidebar
  const menuGroups = [
    {
      id: "dashboard",
      label: "Dashboard & Insights",
      icon: Activity,
      items: [
        { id: "live" as AdminTab, label: "Live Dashboard", icon: Radio },
        { id: "analytics" as AdminTab, label: "Analytics", icon: BarChart3 },
        { id: "health" as AdminTab, label: "System Health", icon: Server },
        { id: "reports" as AdminTab, label: "Reports", icon: BarChart3 },
        { id: "notifications" as AdminTab, label: "Notifications", icon: Bell },
      ],
    },
    {
      id: "users",
      label: "User Management",
      icon: Users,
      items: [
        { id: "manage-students" as AdminTab, label: "Students", icon: GraduationCap },
        { id: "manage-supervisors" as AdminTab, label: "Supervisors", icon: UserCheck },
        { id: "manage-schools" as AdminTab, label: "Schools", icon: Building2 },
        { id: "manage-coordinators" as AdminTab, label: "Coordinators", icon: UsersRound },
        { id: "manage-partners" as AdminTab, label: "Partners", icon: Handshake },
        { id: "parents" as AdminTab, label: "Parents", icon: Users },
      ],
    },
    {
      id: "exam",
      label: "Exam Management",
      icon: GraduationCap,
      items: [
        { id: "exams" as AdminTab, label: "Exam Control", icon: BookOpen },
        { id: "olympiads" as AdminTab, label: "Olympiad Pages", icon: Globe },
        { id: "proctoring" as AdminTab, label: "Proctoring", icon: Shield },
        { id: "results" as AdminTab, label: "Results", icon: Award },
        { id: "demoexam" as AdminTab, label: "Demo Exam", icon: Sparkles },
        { id: "leaderboards" as AdminTab, label: "Leaderboards", icon: Trophy },
        { id: "certificates" as AdminTab, label: "Certificates", icon: AwardIcon },
      ],
    },
    {
      id: "business",
      label: "Business & Operations",
      icon: TrendingUp,
      items: [
        { id: "finance" as AdminTab, label: "Finance", icon: IndianRupee },
        { id: "partners" as AdminTab, label: "Partners", icon: Handshake },
        { id: "coupons" as AdminTab, label: "Coupons & Discounts", icon: Tag },
      ],
    },
    {
      id: "marketing",
      label: "Marketing & Outreach",
      icon: Megaphone,
      items: [
        { id: "marketing" as AdminTab, label: "Social Media", icon: Globe },
        { id: "email" as AdminTab, label: "Email Marketing", icon: Mail },
        { id: "whatsapp" as AdminTab, label: "WhatsApp", icon: MessageSquare },
      ],
    },
    {
      id: "ai",
      label: "AI & Intelligence",
      icon: Zap,
      items: [
        { id: "chatbot" as AdminTab, label: "AI Chatbot", icon: Bot },
        { id: "guruji" as AdminTab, label: "TARA AI", icon: GraduationCap },
      ],
    },
    {
      id: "content",
      label: "Content Management",
      icon: Layout,
      items: [
        { id: "cms" as AdminTab, label: "Content CMS", icon: FileEdit },
        { id: "blog" as AdminTab, label: "Blog", icon: FileText },
        { id: "media" as AdminTab, label: "Media Library", icon: ImageIcon },
      ],
    },
    {
      id: "platform",
      label: "Platform Control",
      icon: Settings,
      items: [
        { id: "systemaudit" as AdminTab, label: "System Audit", icon: Activity },
        { id: "qa" as AdminTab, label: "QA & Testing", icon: ClipboardCheck },
        { id: "docs" as AdminTab, label: "Documentation", icon: FileText },
        { id: "rbac" as AdminTab, label: "Roles & Access", icon: Shield },
        { id: "pwa" as AdminTab, label: "PWA Settings", icon: Smartphone },
        { id: "dbsync" as AdminTab, label: "Database Sync", icon: Server },
        { id: "terminal" as AdminTab, label: "Server Terminal", icon: TerminalSquare },
        { id: "settings" as AdminTab, label: "Global Settings", icon: Settings },
        { id: "support" as AdminTab, label: "Support Tickets", icon: LifeBuoy },
      ],
    },
  ];

  // Filter menu groups based on RBAC permissions
  const filteredMenuGroups = menuGroups
    .map(group => ({
      ...group,
      items: group.items.filter(item => hasTabAccess(item.id))
    }))
    .filter(group => group.items.length > 0);

  // State for expanded menu groups - load from localStorage safely
  const [expandedGroups, setExpandedGroups] = useState<string[]>([]);

  // Clear any stale localStorage and auto-expand only active group
  useEffect(() => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("adminSidebarExpandedGroups");
    }
  }, []);

  // Auto-expand only the group containing the active tab (accordion)
  useEffect(() => {
    const activeGroup = filteredMenuGroups.find(g => g.items.some(item => item.id === activeTab));
    if (activeGroup) {
      setExpandedGroups([activeGroup.id]);
    }
  }, [activeTab]);

  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev =>
      prev.includes(groupId) ? [] : [groupId]
    );
  };

  const regionData = metrics?.regionActivity.reduce((acc, item) => {
    const existing = acc.find(r => r.region === item.region);
    if (existing) {
      existing.activeUsers += item.activeUsers;
    } else {
      acc.push({ region: item.region, activeUsers: item.activeUsers });
    }
    return acc;
  }, [] as { region: string; activeUsers: number }[]) || [];

  // Fetch real hourly analytics data
  const { data: hourlyData = [] } = useQuery<{ hour: string; students: number; submissions: number; revenue: number }[]>({
    queryKey: ["/sysctrl/api/analytics/hourly"],
    enabled: !!admin,
    refetchInterval: 60000
  });

  // Fetch real subject performance data
  const { data: subjectPerformance = [] } = useQuery<{ subject: string; avgScore: number; participation: number; examsCount: number }[]>({
    queryKey: ["/sysctrl/api/analytics/subject-performance"],
    enabled: !!admin,
    refetchInterval: 60000
  });

  // Fetch revenue analytics
  const { data: revenueAnalytics = [] } = useQuery<{ date: string; revenue: number; transactions: number }[]>({
    queryKey: ["/sysctrl/api/analytics/revenue"],
    enabled: !!admin,
    refetchInterval: 60000
  });

  // Fetch registration trends
  const { data: registrationTrends = [] } = useQuery<{ date: string; students: number; schools: number; teachers: number }[]>({
    queryKey: ["/sysctrl/api/analytics/registrations"],
    enabled: !!admin,
    refetchInterval: 60000
  });

  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <LockScreen isLocked={isLocked} onUnlock={unlock} userName="Super Admin">
      <Helmet>
        <title>Super Admin Dashboard | Samikaran Olympiad</title>
        <meta name="robots" content="noindex, nofollow" />
      </Helmet>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-violet-50/30 to-fuchsia-50/30 flex">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden" 
          onClick={() => setSidebarOpen(false)}
        />
      )}
      
      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-72 bg-white/90 backdrop-blur-xl border-r border-gray-200/50 flex flex-col shadow-xl transform transition-transform duration-300 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-4 sm:p-5 border-b border-gray-200/50">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-11 sm:h-11 flex items-center justify-center">
                <svg viewBox="0 0 100 100" width="44" height="44" className="drop-shadow-lg">
                  <defs>
                    <linearGradient id="adminLogoUp" x1="0%" y1="100%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#9333EA" />
                      <stop offset="50%" stopColor="#C026D3" />
                      <stop offset="100%" stopColor="#EC4899" />
                    </linearGradient>
                    <linearGradient id="adminLogoDown" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#A855F7" />
                      <stop offset="100%" stopColor="#F472B6" />
                    </linearGradient>
                  </defs>
                  <polygon points="50,12 85,72 15,72" fill="rgba(0,0,0,0.12)" transform="translate(2, 4)" />
                  <polygon points="50,88 15,28 85,28" fill="rgba(0,0,0,0.1)" transform="translate(2, 4)" />
                  <polygon points="50,10 88,75 12,75" fill="url(#adminLogoUp)" />
                  <polygon points="50,10 69,42.5 31,42.5" fill="rgba(255,255,255,0.18)" />
                  <polygon points="50,90 12,25 88,25" fill="url(#adminLogoDown)" opacity="0.88" />
                  <polygon points="50,90 31,57.5 69,57.5" fill="rgba(255,255,255,0.12)" />
                  <rect x="32" y="44" width="36" height="5" rx="2.5" fill="white" />
                  <rect x="32" y="53" width="36" height="5" rx="2.5" fill="white" />
                </svg>
              </div>
              <div className="flex flex-col items-start">
                <span className="text-base sm:text-lg font-bold tracking-tight uppercase leading-none bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">
                  SAMIKARAN<span className="text-fuchsia-500">.</span>
                </span>
                <span className="text-xs sm:text-sm font-bold uppercase text-gray-500">OLYMPIAD</span>
              </div>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="lg:hidden" 
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </Button>
          </div>
          <div className="mt-4 flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? "bg-emerald-500 animate-pulse" : "bg-red-500"}`} />
            <span className="text-xs text-gray-500">
              {isConnected ? "Live Connected" : "Reconnecting..."}
            </span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-2 overflow-auto scroll-optimized">
          {filteredMenuGroups.map((group) => {
            const isExpanded = expandedGroups.includes(group.id);
            const hasActiveItem = group.items.some(item => item.id === activeTab);
            
            return (
              <div key={group.id} className="space-y-1">
                <button
                  onClick={() => toggleGroup(group.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    hasActiveItem && !isExpanded
                      ? "bg-violet-100 text-violet-700"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                  data-testid={`nav-group-${group.id}`}
                >
                  <group.icon className={`w-5 h-5 ${hasActiveItem ? "text-violet-600" : ""}`} />
                  <span className="font-semibold text-sm flex-1 text-left">{group.label}</span>
                  <ChevronDown 
                    className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`} 
                  />
                </button>
                
                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="overflow-hidden"
                    >
                      <div className="ml-4 pl-4 border-l-2 border-gray-200 space-y-1 pt-1">
                        {group.items.map((item) => (
                          <button
                            key={item.id}
                            onClick={() => setActiveTab(item.id)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-150 ${
                              activeTab === item.id
                                ? "bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white shadow-md shadow-violet-500/20"
                                : "text-gray-600 hover:bg-violet-50 hover:text-violet-700"
                            }`}
                            data-testid={`nav-${item.id}`}
                          >
                            <item.icon className="w-4 h-4" />
                            <span className="text-sm font-medium">{item.label}</span>
                            {item.id === "live" && metrics && (
                              <span className="ml-auto flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </nav>

        <div className="p-4 border-t border-gray-200/50">
          <div className="flex items-center gap-3 px-3 py-2 mb-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <span className="text-white font-semibold text-sm">
                {admin.firstName?.[0] || "A"}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-800 truncate">{admin.firstName} {admin.lastName}</p>
              <p className="text-xs text-gray-500 truncate">Super Admin</p>
            </div>
          </div>
          <Button
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleLogout}
            data-testid="button-logout"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto lg:ml-0 scroll-optimized">
        <header className="bg-white/70 backdrop-blur-xl border-b border-gray-200/50 px-4 sm:px-6 py-3 sm:py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3 sm:gap-4 flex-wrap">
            <div className="flex items-center gap-3 sm:gap-4">
              <Button 
                variant="ghost" 
                size="icon" 
                className="lg:hidden shrink-0" 
                onClick={() => setSidebarOpen(true)}
                data-testid="button-mobile-menu"
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
              <h2 className="text-lg sm:text-2xl font-bold text-gray-800 truncate">
                {menuGroups.flatMap(g => g.items).find(m => m.id === activeTab)?.label}
              </h2>
              {activeTab === "live" && (
                <Badge className="bg-emerald-100 text-emerald-700 animate-pulse">
                  <Radio className="w-3 h-3 mr-1" />
                  Real-time
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 mr-4">
                <span className="text-sm text-gray-500">Live Updates</span>
                <Switch checked={liveUpdates} onCheckedChange={setLiveUpdates} />
              </div>
              {lockPinEnabled && lockPin.length >= 4 && (
                <Button 
                  size="sm"
                  onClick={lock}
                  title="Lock Screen (Ctrl+L)"
                  data-testid="button-header-lock"
                  className="gap-1.5 px-3 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white border-0"
                >
                  <Lock className="w-4 h-4" />
                  <span className="text-xs hidden sm:inline font-medium">Ctrl+L</span>
                </Button>
              )}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-64 bg-white border-gray-200"
                  data-testid="input-search"
                />
              </div>
              <NotificationBell />
              <Button
                size="icon"
                variant="outline"
                className="border-gray-200 text-gray-600 hover:bg-violet-50"
                onClick={() => {
                  queryClient.invalidateQueries();
                  if (wsRef.current?.readyState === WebSocket.OPEN) {
                    wsRef.current.send(JSON.stringify({ type: "request:metrics" }));
                  }
                  toast({ title: "Refreshed", description: "Data updated" });
                }}
                data-testid="button-refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </header>

        <div className="p-6">
          <AnimatePresence mode="wait">
            {activeTab === "live" && (
              <motion.div
                key="live"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                  <Card className="bg-gradient-to-br from-violet-500 to-violet-600 text-white border-0 shadow-lg shadow-violet-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Users className="w-5 h-5 opacity-80" />
                        <Badge className="bg-white/20 text-white text-xs">Live</Badge>
                      </div>
                      <p className="text-3xl font-bold">{metrics?.activeStudents?.toLocaleString() || "---"}</p>
                      <p className="text-sm opacity-80">Active Students</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-fuchsia-500 to-fuchsia-600 text-white border-0 shadow-lg shadow-fuchsia-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <BookOpen className="w-5 h-5 opacity-80" />
                        <Badge className="bg-white/20 text-white text-xs">Running</Badge>
                      </div>
                      <p className="text-3xl font-bold">{metrics?.activeExams || "---"}</p>
                      <p className="text-sm opacity-80">Active Exams</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-cyan-500 to-cyan-600 text-white border-0 shadow-lg shadow-cyan-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Zap className="w-5 h-5 opacity-80" />
                        <span className="w-2 h-2 bg-white rounded-full animate-ping" />
                      </div>
                      <p className="text-3xl font-bold">{metrics?.liveSubmissions || "---"}</p>
                      <p className="text-sm opacity-80">Live Submissions</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-0 shadow-lg shadow-emerald-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <IndianRupee className="w-5 h-5 opacity-80" />
                        <TrendingUp className="w-4 h-4 opacity-80" />
                      </div>
                      <p className="text-3xl font-bold">₹{((metrics?.totalRevenue || 0) / 100).toLocaleString()}</p>
                      <p className="text-sm opacity-80">Total Revenue</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-amber-500 to-orange-500 text-white border-0 shadow-lg shadow-amber-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <UserCheck className="w-5 h-5 opacity-80" />
                        <Badge className="bg-white/20 text-white text-xs">Today</Badge>
                      </div>
                      <p className="text-3xl font-bold">{metrics?.todayRegistrations || "---"}</p>
                      <p className="text-sm opacity-80">New Registrations</p>
                    </CardContent>
                  </Card>

                  <Card className="bg-gradient-to-br from-pink-500 to-rose-500 text-white border-0 shadow-lg shadow-pink-500/20">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Building2 className="w-5 h-5 opacity-80" />
                      </div>
                      <p className="text-3xl font-bold">{stats?.schools || 0}</p>
                      <p className="text-sm opacity-80">Partner Schools</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="bg-white/80 backdrop-blur border-gray-200/50 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-gray-800 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-violet-500" />
                        Regional Distribution
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      {regionData.length > 0 ? (
                        <>
                          <div className="h-48">
                            <ResponsiveContainer width="100%" height="100%">
                              <PieChart>
                                <Pie
                                  data={regionData}
                                  cx="50%"
                                  cy="50%"
                                  innerRadius={40}
                                  outerRadius={70}
                                  paddingAngle={2}
                                  dataKey="activeUsers"
                                  nameKey="region"
                                >
                                  {regionData.map((_, index) => (
                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                  ))}
                                </Pie>
                                <Tooltip />
                              </PieChart>
                            </ResponsiveContainer>
                          </div>
                          <div className="grid grid-cols-2 gap-2 mt-2">
                            {regionData.map((r, i) => (
                              <div key={r.region} className="flex items-center gap-2 text-xs">
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: CHART_COLORS[i] }} />
                                <span className="text-gray-600">{r.region}</span>
                                <span className="ml-auto font-medium text-gray-800">{r.activeUsers}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      ) : (
                        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">
                          <div className="text-center">
                            <Globe className="w-8 h-8 mx-auto mb-2 opacity-30" />
                            <p>No regional data yet</p>
                            <p className="text-xs mt-1">Data will appear as students register</p>
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>

                {/* Live Exam Heat Map - Compact version for Live Dashboard */}
                <Card className="bg-white/80 backdrop-blur border-gray-200/50 shadow-sm">
                  <CardHeader className="pb-2">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-gray-800 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-rose-500" />
                          Live Exam Heat Map
                        </CardTitle>
                        {heatmapData && (
                          <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                            <Radio className="w-3 h-3 mr-1 animate-pulse" />
                            {heatmapData.totalLiveStudents} Live
                          </Badge>
                        )}
                      </div>
                      <Select value={selectedHeatmapExam} onValueChange={setSelectedHeatmapExam}>
                        <SelectTrigger className="w-48" data-testid="select-live-heatmap-exam">
                          <SelectValue placeholder="All Olympiads" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Ongoing Olympiads</SelectItem>
                          {heatmapData?.activeExams?.map(exam => (
                            <SelectItem key={exam.id} value={exam.id.toString()}>{exam.title}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                      {/* World Map */}
                      <div className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-3 border border-blue-100">
                        <ComposableMap
                          projection="geoMercator"
                          projectionConfig={{
                            scale: 100,
                            center: [0, 20]
                          }}
                          style={{ width: "100%", height: "280px" }}
                        >
                          <ZoomableGroup>
                            <Geographies geography={WORLD_GEO_URL}>
                              {({ geographies }) =>
                                geographies.map((geo) => {
                                  const countryName = geo.properties.name;
                                  const countryData = heatmapData?.byCountry?.find(
                                    c => c.country === countryName || 
                                        c.countryCode?.toUpperCase() === geo.properties.ISO_A2?.toUpperCase()
                                  );
                                  const count = countryData?.count || 0;
                                  
                                  let fillColor = "#E5E7EB";
                                  if (count > 0) {
                                    if (count >= 100) fillColor = "#DC2626";
                                    else if (count >= 50) fillColor = "#EA580C";
                                    else if (count >= 20) fillColor = "#F59E0B";
                                    else if (count >= 10) fillColor = "#84CC16";
                                    else fillColor = "#22C55E";
                                  }
                                  
                                  return (
                                    <Geography
                                      key={geo.rsmKey}
                                      geography={geo}
                                      fill={fillColor}
                                      stroke="#FFFFFF"
                                      strokeWidth={0.5}
                                      style={{
                                        default: { outline: "none" },
                                        hover: { fill: "#8B5CF6", outline: "none" },
                                        pressed: { outline: "none" },
                                      }}
                                    />
                                  );
                                })
                              }
                            </Geographies>
                          </ZoomableGroup>
                        </ComposableMap>
                        {/* Compact Legend */}
                        <div className="flex items-center justify-center gap-3 mt-2 flex-wrap">
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#22C55E" }}></div>
                            <span>1-9</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#F59E0B" }}></div>
                            <span>20+</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs text-gray-500">
                            <div className="w-3 h-3 rounded" style={{ backgroundColor: "#DC2626" }}></div>
                            <span>100+</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Top Regions Sidebar */}
                      <div className="space-y-3">
                        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-lg p-3 border border-violet-100">
                          <h4 className="font-medium text-gray-800 mb-2 text-sm flex items-center gap-1">
                            <Globe className="w-3 h-3 text-violet-500" />
                            Top Countries
                          </h4>
                          <div className="space-y-1.5">
                            {heatmapData?.byCountry?.slice(0, 4).map((country, idx) => (
                              <div key={country.country} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 truncate">{country.country}</span>
                                <Badge className="bg-violet-100 text-violet-700 text-xs h-5">{country.count}</Badge>
                              </div>
                            ))}
                            {(!heatmapData?.byCountry || heatmapData.byCountry.length === 0) && (
                              <p className="text-xs text-gray-400 text-center py-2">No live students</p>
                            )}
                          </div>
                        </div>
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-lg p-3 border border-emerald-100">
                          <h4 className="font-medium text-gray-800 mb-2 text-sm flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-emerald-500" />
                            Top States
                          </h4>
                          <div className="space-y-1.5">
                            {heatmapData?.byState?.slice(0, 4).map((state) => (
                              <div key={`${state.country}-${state.state}`} className="flex items-center justify-between text-xs">
                                <span className="text-gray-600 truncate">{state.state}</span>
                                <Badge className="bg-emerald-100 text-emerald-700 text-xs h-5">{state.count}</Badge>
                              </div>
                            ))}
                            {(!heatmapData?.byState || heatmapData.byState.length === 0) && (
                              <p className="text-xs text-gray-400 text-center py-2">No live students</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="bg-white/80 backdrop-blur border-gray-200/50 shadow-sm">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-gray-800">State-wise Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {metrics?.regionActivity?.map((state, i) => (
                            <div key={state.state} className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-100 to-fuchsia-100 flex items-center justify-center">
                                <MapPin className="w-4 h-4 text-violet-600" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium text-gray-800">{state.state}</span>
                                  <span className="text-sm text-gray-500">{state.activeUsers} users</span>
                                </div>
                                <Progress value={state.percentage} className="h-1.5" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur border-gray-200/50 shadow-sm">
                    <CardHeader className="pb-2">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-gray-800 flex items-center gap-2">
                          <Activity className="w-5 h-5 text-violet-500" />
                          Live Activity Feed
                        </CardTitle>
                        <span className="flex items-center gap-1 text-xs text-gray-500">
                          <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                          Live
                        </span>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <ScrollArea className="h-64">
                        <div className="space-y-3">
                          {metrics?.recentActivity?.map((activity, i) => (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.05 }}
                              className={`flex items-start gap-3 p-3 rounded-lg ${
                                activity.severity === "alert" ? "bg-red-50 border border-red-100" :
                                activity.severity === "warning" ? "bg-amber-50 border border-amber-100" :
                                "bg-gray-50"
                              }`}
                            >
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                                activity.severity === "alert" ? "bg-red-100" :
                                activity.severity === "warning" ? "bg-amber-100" :
                                "bg-violet-100"
                              }`}>
                                {activity.severity === "alert" ? <AlertTriangle className="w-4 h-4 text-red-600" /> :
                                 activity.severity === "warning" ? <AlertCircle className="w-4 h-4 text-amber-600" /> :
                                 <CheckCircle className="w-4 h-4 text-violet-600" />}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-800">{activity.message}</p>
                                <p className="text-xs text-gray-500 mt-1">
                                  {activity.timestamp ? format(new Date(activity.timestamp), "HH:mm:ss") : ""}
                                </p>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </ScrollArea>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/80 backdrop-blur border-gray-200/50 shadow-sm">
                  <CardHeader>
                    <CardTitle className="text-gray-800">24-Hour Activity Overview</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={hourlyData}>
                          <defs>
                            <linearGradient id="colorStudents" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSubmissions" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#EC4899" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="#EC4899" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                          <XAxis dataKey="hour" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                          <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                          <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }} />
                          <Legend />
                          <Area type="monotone" dataKey="students" stroke="#8B5CF6" fill="url(#colorStudents)" strokeWidth={2} name="Active Students" />
                          <Area type="monotone" dataKey="submissions" stroke="#EC4899" fill="url(#colorSubmissions)" strokeWidth={2} name="Submissions" />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "analytics" && (
              <motion.div
                key="analytics"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <GraduationCap className="w-5 h-5 text-violet-500" />
                        <TrendingUp className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{stats?.students || 0}</p>
                      <p className="text-sm text-gray-500">Total Students</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <UserCheck className="w-5 h-5 text-fuchsia-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{stats?.supervisors || 0}</p>
                      <p className="text-sm text-gray-500">Supervisors</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <UsersRound className="w-5 h-5 text-cyan-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{stats?.groups || 0}</p>
                      <p className="text-sm text-gray-500">Groups</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <Building2 className="w-5 h-5 text-amber-500" />
                      </div>
                      <p className="text-2xl font-bold text-gray-800">{stats?.schools || 0}</p>
                      <p className="text-sm text-gray-500">Schools</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                    <CardHeader>
                      <CardTitle className="text-gray-800">Subject Performance</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={subjectPerformance} layout="vertical">
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis type="number" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                            <YAxis type="category" dataKey="subject" tick={{ fontSize: 12 }} stroke="#9CA3AF" width={100} />
                            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }} />
                            <Bar dataKey="avgScore" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Avg Score %" />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                    <CardHeader>
                      <CardTitle className="text-gray-800">Participation by Subject</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={subjectPerformance}
                              cx="50%"
                              cy="50%"
                              outerRadius={100}
                              dataKey="participation"
                              nameKey="subject"
                              label={({ subject, percent }) => `${subject}: ${(percent * 100).toFixed(0)}%`}
                              labelLine={false}
                            >
                              {subjectPerformance.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                  <CardHeader>
                    <CardTitle className="text-gray-800">Revenue Trend (Last 7 Days)</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-72">
                      {!revenueAnalytics.length && !registrationTrends.length ? (
                        <div className="flex items-center justify-center h-full text-muted-foreground">
                          <p>No revenue data available yet</p>
                        </div>
                      ) : (
                        <ResponsiveContainer width="100%" height="100%">
                          <LineChart data={(() => {
                            const last7Days = revenueAnalytics.slice(-7);
                            const reg7Days = registrationTrends.slice(-7);
                            
                            return last7Days.map((rev, idx) => ({
                              date: format(new Date(rev.date), "MMM dd"),
                              revenue: rev.revenue,
                              registrations: reg7Days[idx]?.students || 0
                            }));
                          })()}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                            <XAxis dataKey="date" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                            <YAxis yAxisId="left" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
                            <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }} />
                            <Legend />
                            <Line yAxisId="left" type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={2} dot={{ r: 4 }} name="Revenue (₹)" />
                            <Line yAxisId="right" type="monotone" dataKey="registrations" stroke="#EC4899" strokeWidth={2} dot={{ r: 4 }} name="Registrations" />
                          </LineChart>
                        </ResponsiveContainer>
                      )}
                    </div>
                  </CardContent>
                </Card>

                {/* Regional Distribution Section */}
                <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <CardTitle className="text-gray-800 flex items-center gap-2">
                        <Globe className="w-5 h-5 text-violet-500" />
                        Regional Distribution
                      </CardTitle>
                      <div className="flex items-center gap-3 flex-wrap">
                        <Select value={selectedCountry} onValueChange={(v) => { setSelectedCountry(v); setSelectedState("all"); setSelectedCity("all"); }}>
                          <SelectTrigger className="w-40" data-testid="select-country">
                            <SelectValue placeholder="All Countries" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Countries</SelectItem>
                            {Array.from(new Set(metrics?.geoDistribution?.map(g => g.country) || [])).map(country => (
                              <SelectItem key={country} value={country}>{country}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={selectedState} onValueChange={(v) => { setSelectedState(v); setSelectedCity("all"); }} disabled={selectedCountry === "all"}>
                          <SelectTrigger className="w-44" data-testid="select-state">
                            <SelectValue placeholder="All States" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All States</SelectItem>
                            {Array.from(new Set((metrics?.geoDistribution?.filter(g => selectedCountry === "all" || g.country === selectedCountry) || []).map(g => g.state))).map(state => (
                              <SelectItem key={state} value={state}>{state}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Select value={selectedCity} onValueChange={setSelectedCity} disabled={selectedState === "all"}>
                          <SelectTrigger className="w-44" data-testid="select-city">
                            <SelectValue placeholder="All Cities" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Cities</SelectItem>
                            {(metrics?.geoDistribution?.filter(g => (selectedCountry === "all" || g.country === selectedCountry) && (selectedState === "all" || g.state === selectedState)) || []).map(g => (
                              <SelectItem key={g.city} value={g.city}>{g.city}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <Button variant="outline" size="sm" onClick={() => { setSelectedCountry("all"); setSelectedState("all"); setSelectedCity("all"); }}>
                          Reset
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {(() => {
                      const filteredGeo = metrics?.geoDistribution?.filter(g => 
                        (selectedCountry === "all" || g.country === selectedCountry) &&
                        (selectedState === "all" || g.state === selectedState) &&
                        (selectedCity === "all" || g.city === selectedCity)
                      ) || [];
                      
                      const totalUsers = filteredGeo.reduce((sum, g) => sum + g.activeUsers, 0);
                      const totalRegistrations = filteredGeo.reduce((sum, g) => sum + g.registrations, 0);
                      const totalRevenue = filteredGeo.reduce((sum, g) => sum + g.revenue, 0);

                      const countryData = Array.from(new Set(filteredGeo.map(g => g.country))).map(country => ({
                        name: country,
                        users: filteredGeo.filter(g => g.country === country).reduce((s, g) => s + g.activeUsers, 0),
                        registrations: filteredGeo.filter(g => g.country === country).reduce((s, g) => s + g.registrations, 0),
                        revenue: filteredGeo.filter(g => g.country === country).reduce((s, g) => s + g.revenue, 0),
                      }));

                      const stateData = Array.from(new Set(filteredGeo.map(g => g.state))).map(state => ({
                        name: state,
                        users: filteredGeo.filter(g => g.state === state).reduce((s, g) => s + g.activeUsers, 0),
                        registrations: filteredGeo.filter(g => g.state === state).reduce((s, g) => s + g.registrations, 0),
                        revenue: filteredGeo.filter(g => g.state === state).reduce((s, g) => s + g.revenue, 0),
                      }));

                      const cityData = filteredGeo.map(g => ({
                        name: g.city,
                        users: g.activeUsers,
                        registrations: g.registrations,
                        revenue: g.revenue,
                      }));

                      return (
                        <>
                          <div className="grid gap-4 md:grid-cols-3">
                            <Card className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-0">
                              <CardContent className="p-4">
                                <p className="text-sm opacity-80">Active Users</p>
                                <p className="text-3xl font-bold">{totalUsers.toLocaleString()}</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-cyan-500 to-blue-500 text-white border-0">
                              <CardContent className="p-4">
                                <p className="text-sm opacity-80">Registrations</p>
                                <p className="text-3xl font-bold">{totalRegistrations.toLocaleString()}</p>
                              </CardContent>
                            </Card>
                            <Card className="bg-gradient-to-br from-emerald-500 to-teal-500 text-white border-0">
                              <CardContent className="p-4">
                                <p className="text-sm opacity-80">Revenue</p>
                                <p className="text-3xl font-bold">₹{(totalRevenue / 100).toLocaleString()}</p>
                              </CardContent>
                            </Card>
                          </div>

                          <div className="grid gap-6 lg:grid-cols-2">
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">By Country</h4>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={countryData.slice(0, 8)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" width={80} />
                                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }} />
                                    <Bar dataKey="users" fill="#8B5CF6" radius={[0, 4, 4, 0]} name="Active Users" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                            <div>
                              <h4 className="text-sm font-semibold text-gray-700 mb-3">By State</h4>
                              <div className="h-64">
                                <ResponsiveContainer width="100%" height="100%">
                                  <BarChart data={stateData.slice(0, 8)} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                    <XAxis type="number" tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                                    <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} stroke="#9CA3AF" width={100} />
                                    <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }} />
                                    <Bar dataKey="users" fill="#EC4899" radius={[0, 4, 4, 0]} name="Active Users" />
                                  </BarChart>
                                </ResponsiveContainer>
                              </div>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">By City</h4>
                            <div className="h-72">
                              <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={cityData.slice(0, 12)}>
                                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                                  <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="#9CA3AF" height={80} interval={0} />
                                  <YAxis tick={{ fontSize: 11 }} stroke="#9CA3AF" />
                                  <Tooltip contentStyle={{ borderRadius: 8, border: "1px solid #E5E7EB" }} />
                                  <Legend />
                                  <Bar dataKey="users" fill="#8B5CF6" radius={[4, 4, 0, 0]} name="Active Users" />
                                  <Bar dataKey="registrations" fill="#06B6D4" radius={[4, 4, 0, 0]} name="Registrations" />
                                </BarChart>
                              </ResponsiveContainer>
                            </div>
                          </div>

                          <div>
                            <h4 className="text-sm font-semibold text-gray-700 mb-3">Detailed Breakdown</h4>
                            <div className="max-h-64 overflow-auto">
                              <Table>
                                <TableHeader>
                                  <TableRow className="border-gray-200">
                                    <TableHead className="text-gray-600">Country</TableHead>
                                    <TableHead className="text-gray-600">State</TableHead>
                                    <TableHead className="text-gray-600">City</TableHead>
                                    <TableHead className="text-gray-600 text-right">Users</TableHead>
                                    <TableHead className="text-gray-600 text-right">Registrations</TableHead>
                                    <TableHead className="text-gray-600 text-right">Revenue</TableHead>
                                  </TableRow>
                                </TableHeader>
                                <TableBody>
                                  {filteredGeo.slice(0, 15).map((geo, idx) => (
                                    <TableRow key={idx} className="border-gray-200">
                                      <TableCell className="text-gray-800">{geo.country}</TableCell>
                                      <TableCell className="text-gray-600">{geo.state}</TableCell>
                                      <TableCell className="text-gray-600">{geo.city}</TableCell>
                                      <TableCell className="text-right font-medium text-gray-800">{geo.activeUsers.toLocaleString()}</TableCell>
                                      <TableCell className="text-right text-gray-600">{geo.registrations}</TableCell>
                                      <TableCell className="text-right text-emerald-600 font-medium">₹{(geo.revenue / 100).toLocaleString()}</TableCell>
                                    </TableRow>
                                  ))}
                                </TableBody>
                              </Table>
                            </div>
                          </div>
                        </>
                      );
                    })()}
                  </CardContent>
                </Card>

                {/* Live Exam Heat Map Section */}
                <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3">
                        <CardTitle className="text-gray-800 flex items-center gap-2">
                          <MapPin className="w-5 h-5 text-rose-500" />
                          Live Exam Heat Map
                        </CardTitle>
                        {heatmapData && (
                          <Badge variant="secondary" className="bg-rose-100 text-rose-700">
                            <Radio className="w-3 h-3 mr-1 animate-pulse" />
                            {heatmapData.totalLiveStudents} Live Students
                          </Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-3">
                        <Select value={selectedHeatmapExam} onValueChange={setSelectedHeatmapExam}>
                          <SelectTrigger className="w-56" data-testid="select-heatmap-exam">
                            <SelectValue placeholder="All Ongoing Olympiads" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All Ongoing Olympiads</SelectItem>
                            {heatmapData?.activeExams?.map(exam => (
                              <SelectItem key={exam.id} value={exam.id.toString()}>{exam.title}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <CardDescription>
                      Real-time visualization of students currently taking exams across regions
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* World Map */}
                      <div className="lg:col-span-2 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 border border-blue-100">
                        <ComposableMap
                          projection="geoMercator"
                          projectionConfig={{
                            scale: 120,
                            center: [0, 20]
                          }}
                          style={{ width: "100%", height: "400px" }}
                        >
                          <ZoomableGroup>
                            <Geographies geography={WORLD_GEO_URL}>
                              {({ geographies }) =>
                                geographies.map((geo) => {
                                  const countryName = geo.properties.name;
                                  const countryData = heatmapData?.byCountry?.find(
                                    c => c.country === countryName || 
                                        c.countryCode?.toUpperCase() === geo.properties.ISO_A2?.toUpperCase()
                                  );
                                  const count = countryData?.count || 0;
                                  
                                  // Color intensity based on student count
                                  let fillColor = "#E5E7EB"; // Default gray
                                  if (count > 0) {
                                    if (count >= 100) fillColor = "#DC2626"; // red-600
                                    else if (count >= 50) fillColor = "#EA580C"; // orange-600
                                    else if (count >= 20) fillColor = "#F59E0B"; // amber-500
                                    else if (count >= 10) fillColor = "#84CC16"; // lime-500
                                    else fillColor = "#22C55E"; // green-500
                                  }
                                  
                                  return (
                                    <Geography
                                      key={geo.rsmKey}
                                      geography={geo}
                                      fill={fillColor}
                                      stroke="#FFFFFF"
                                      strokeWidth={0.5}
                                      style={{
                                        default: { outline: "none" },
                                        hover: { fill: "#8B5CF6", outline: "none" },
                                        pressed: { outline: "none" },
                                      }}
                                    />
                                  );
                                })
                              }
                            </Geographies>
                          </ZoomableGroup>
                        </ComposableMap>
                        
                        {/* Legend */}
                        <div className="flex items-center justify-center gap-4 mt-4 flex-wrap">
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#22C55E" }}></div>
                            <span>1-9</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#84CC16" }}></div>
                            <span>10-19</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#F59E0B" }}></div>
                            <span>20-49</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#EA580C" }}></div>
                            <span>50-99</span>
                          </div>
                          <div className="flex items-center gap-1 text-xs">
                            <div className="w-4 h-4 rounded" style={{ backgroundColor: "#DC2626" }}></div>
                            <span>100+</span>
                          </div>
                        </div>
                      </div>
                      
                      {/* Stats Sidebar */}
                      <div className="space-y-4">
                        {/* Top Countries */}
                        <div className="bg-gradient-to-br from-violet-50 to-purple-50 rounded-xl p-4 border border-violet-100">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <Globe className="w-4 h-4 text-violet-500" />
                            Top Countries
                          </h4>
                          <div className="space-y-2">
                            {heatmapData?.byCountry?.slice(0, 5).map((country, idx) => (
                              <div key={country.country} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-violet-600 w-5">{idx + 1}.</span>
                                  <span className="text-sm text-gray-700">{country.country}</span>
                                </div>
                                <Badge className="bg-violet-100 text-violet-700">{country.count}</Badge>
                              </div>
                            ))}
                            {(!heatmapData?.byCountry || heatmapData.byCountry.length === 0) && (
                              <p className="text-sm text-gray-500 text-center py-4">No live students currently</p>
                            )}
                          </div>
                        </div>
                        
                        {/* Top States */}
                        <div className="bg-gradient-to-br from-emerald-50 to-teal-50 rounded-xl p-4 border border-emerald-100">
                          <h4 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-emerald-500" />
                            Top States/Regions
                          </h4>
                          <div className="space-y-2">
                            {heatmapData?.byState?.slice(0, 5).map((state, idx) => (
                              <div key={`${state.country}-${state.state}`} className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <span className="text-xs font-medium text-emerald-600 w-5">{idx + 1}.</span>
                                  <div className="flex flex-col">
                                    <span className="text-sm text-gray-700">{state.state}</span>
                                    <span className="text-xs text-gray-400">{state.country}</span>
                                  </div>
                                </div>
                                <Badge className="bg-emerald-100 text-emerald-700">{state.count}</Badge>
                              </div>
                            ))}
                            {(!heatmapData?.byState || heatmapData.byState.length === 0) && (
                              <p className="text-sm text-gray-500 text-center py-4">No live students currently</p>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "exams" && (
              <motion.div
                key="exams"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <Tabs defaultValue="olympiads" className="w-full">
                  <TabsList className="bg-gray-100/80 mb-4">
                    <TabsTrigger value="olympiads" className="data-[state=active]:bg-white" data-testid="tab-olympiads">
                      <BookOpen className="w-4 h-4 mr-2" />
                      Olympiads
                    </TabsTrigger>
                    <TabsTrigger value="certificates" className="data-[state=active]:bg-white" data-testid="tab-certificates">
                      <Award className="w-4 h-4 mr-2" />
                      Certificates
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="olympiads" className="space-y-6 mt-0">
                    <div className="flex items-center justify-between gap-4 flex-wrap">
                      <div className="flex items-center gap-3 flex-wrap">
                        <Button className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white" data-testid="button-create-olympiad" onClick={() => setIsCreateOlympiadOpen(true)}>
                          <Plus className="w-4 h-4 mr-2" />
                          Create Olympiad
                        </Button>
                        <Button variant="outline" data-testid="button-manual-questions" onClick={() => setLocation("/sysctrl/questions/create")}>
                          <Edit className="w-4 h-4 mr-2" />
                          Manual Questions
                        </Button>
                        <Button variant="outline" data-testid="button-ai-generate-questions" onClick={() => setIsAIGeneratorOpen(true)}>
                          <FileText className="w-4 h-4 mr-2" />
                          AI Questions
                        </Button>
                        <Button variant="outline" className="bg-gradient-to-r from-pink-500 to-rose-500 text-white border-0" data-testid="button-bulk-upload" onClick={() => setIsBulkUploadOpen(true)}>
                          <Upload className="w-4 h-4 mr-2" />
                          Bulk Upload
                        </Button>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-amber-600 border-amber-200 hover:bg-amber-50"
                          data-testid="button-pause-all"
                          onClick={async () => {
                            const activeExams = exams.filter((e: any) => e.status === "published" || e.status === "active");
                            if (activeExams.length === 0) {
                              toast({ title: "No active olympiads to pause", variant: "destructive" });
                              return;
                            }
                            try {
                              await apiRequest("PATCH", "/api/sysctrl/olympiads/bulk-status", {
                                status: "paused",
                                ids: activeExams.map((e: any) => e.id)
                              });
                              queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/exams"] });
                              toast({ title: `Paused ${activeExams.length} olympiad(s)` });
                            } catch (err) {
                              toast({ title: "Failed to pause olympiads", variant: "destructive" });
                            }
                          }}
                        >
                          <Pause className="w-4 h-4 mr-1" />
                          Pause All
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                          data-testid="button-resume-all"
                          onClick={async () => {
                            const pausedExams = exams.filter((e: any) => e.status === "paused");
                            if (pausedExams.length === 0) {
                              toast({ title: "No paused olympiads to resume", variant: "destructive" });
                              return;
                            }
                            try {
                              await apiRequest("PATCH", "/api/sysctrl/olympiads/bulk-status", {
                                status: "published",
                                ids: pausedExams.map((e: any) => e.id)
                              });
                              queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/exams"] });
                              toast({ title: `Resumed ${pausedExams.length} olympiad(s)` });
                            } catch (err) {
                              toast({ title: "Failed to resume olympiads", variant: "destructive" });
                            }
                          }}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          Resume All
                        </Button>
                      </div>
                    </div>

                    <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                      <CardHeader>
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-gray-800">All Olympiads ({exams.length})</CardTitle>
                          <div className="flex gap-1 bg-gray-100 rounded-lg p-1">
                            {[
                              { key: "all", label: "All" },
                              { key: "young", label: "Little Champs (1-5)" },
                              { key: "master", label: "Elite Seniors (6-12)" },
                            ].map(f => (
                              <button
                                key={f.key}
                                type="button"
                                data-testid={`filter-category-${f.key}`}
                                onClick={() => setOlympiadCategoryFilter(f.key)}
                                className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors ${olympiadCategoryFilter === f.key ? "bg-white text-purple-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                              >
                                {f.label}
                              </button>
                            ))}
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <Table>
                          <TableHeader>
                            <TableRow className="border-gray-200">
                              <TableHead className="text-gray-600">Olympiad</TableHead>
                              <TableHead className="text-gray-600">Subject</TableHead>
                              <TableHead className="text-gray-600">Category</TableHead>
                              <TableHead className="text-gray-600">Classes</TableHead>
                              <TableHead className="text-gray-600">Duration</TableHead>
                              <TableHead className="text-gray-600">Questions</TableHead>
                              <TableHead className="text-gray-600">Status</TableHead>
                              <TableHead className="text-gray-600">Visibility</TableHead>
                              <TableHead className="text-gray-600">Actions</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {exams
                              .filter((exam: any) => {
                                if (olympiadCategoryFilter === "young" || olympiadCategoryFilter === "master") {
                                  const min = exam.minClass || 1, max = exam.maxClass || 12;
                                  let isLittle: boolean;
                                  if (max <= 5) isLittle = true;
                                  else if (min >= 6) isLittle = false;
                                  else isLittle = (min + max) / 2 < 6;
                                  if (olympiadCategoryFilter === "young") return isLittle;
                                  return !isLittle;
                                }
                                return true;
                              })
                              .map((exam: any) => (
                              <TableRow key={exam.id} className="border-gray-200" data-testid={`row-olympiad-${exam.id}`}>
                                <TableCell className="font-medium text-gray-800">{exam.title}</TableCell>
                                <TableCell className="text-gray-600">{exam.subject}</TableCell>
                                <TableCell>
                                  <Badge className={(() => { const min = exam.minClass || 1, max = exam.maxClass || 12; if (max <= 5) return true; if (min >= 6) return false; return (min + max) / 2 < 6; })() ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}>
                                    {(() => { const min = exam.minClass || 1, max = exam.maxClass || 12; if (max <= 5) return true; if (min >= 6) return false; return (min + max) / 2 < 6; })() ? "Little Champs" : "Elite Seniors"}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-gray-600 text-xs">{exam.minClass || 1} - {exam.maxClass || 12}</TableCell>
                                <TableCell className="text-gray-600">{exam.durationMinutes} min</TableCell>
                                <TableCell className="text-gray-600">{exam.totalQuestions || 0}</TableCell>
                                <TableCell>
                                  <Badge className={
                                    exam.lifecycleStatus === "LIVE" ? "bg-red-100 text-red-700 animate-pulse" :
                                    exam.lifecycleStatus === "REGISTRATION_OPEN" ? "bg-emerald-100 text-emerald-700" :
                                    exam.lifecycleStatus === "REGISTRATION_CLOSED" ? "bg-amber-100 text-amber-700" :
                                    exam.lifecycleStatus === "COMPLETED" ? "bg-blue-100 text-blue-700" :
                                    exam.lifecycleStatus === "RESULT_PUBLISHED" ? "bg-purple-100 text-purple-700" :
                                    exam.lifecycleStatus === "UPCOMING" ? "bg-slate-100 text-slate-700" :
                                    exam.status === "published" ? "bg-emerald-100 text-emerald-700" :
                                    "bg-slate-100 text-slate-700"
                                  }>
                                    {exam.lifecycleLabel || exam.status || "draft"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className={exam.isVisible ? "border-emerald-300 text-emerald-600" : "border-gray-300 text-gray-500"}>
                                    {exam.isVisible ? "Visible" : "Hidden"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex items-center gap-1">
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className="text-gray-500 hover:text-violet-600" 
                                      data-testid={`button-view-olympiad-${exam.id}`}
                                      onClick={() => {
                                        setSelectedOlympiad(exam);
                                        setIsOlympiadViewOpen(true);
                                      }}
                                    >
                                      <Eye className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className={exam.canEditDates ? "text-gray-500 hover:text-amber-600" : "text-gray-300 cursor-not-allowed"}
                                      data-testid={`button-edit-olympiad-${exam.id}`}
                                      disabled={!exam.canEditDates}
                                      title={exam.canEditDates ? "Edit olympiad" : "Cannot edit after exam goes live"}
                                      onClick={() => {
                                        if (exam.canEditDates) {
                                          setSelectedOlympiad(exam);
                                          setIsOlympiadEditOpen(true);
                                        }
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button 
                                      size="icon" 
                                      variant="ghost" 
                                      className={exam.canEditDates ? "text-gray-500 hover:text-red-600" : "text-gray-300 cursor-not-allowed"}
                                      data-testid={`button-delete-olympiad-${exam.id}`}
                                      disabled={!exam.canEditDates}
                                      title={exam.canEditDates ? "Delete olympiad" : "Cannot delete after exam goes live"}
                                      onClick={() => {
                                        if (exam.canEditDates) {
                                          setOlympiadDeleteConfirm(exam.id);
                                        }
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </CardContent>
                    </Card>
                  </TabsContent>


                  <TabsContent value="certificates" className="mt-0">
                    <CertificateDistributionPanel exams={exams} />
                  </TabsContent>
                </Tabs>
              </motion.div>
            )}

            {activeTab === "results" && (
              <motion.div
                key="results"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ResultManagementTab />
              </motion.div>
            )}

            {activeTab === "demoexam" && (
              <motion.div
                key="demoexam"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <DemoExamTab />
              </motion.div>
            )}

            {activeTab === "olympiads" && (
              <motion.div
                key="olympiads"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <OlympiadManagementTab />
              </motion.div>
            )}

            {activeTab === "proctoring" && (
              <motion.div
                key="proctoring"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold text-gray-800">Live Proctoring Monitor</h2>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => refetchProctoringData()}
                    className="gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                  </Button>
                </div>

                {proctoringError && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="font-medium text-red-800">Failed to load proctoring data</p>
                      <p className="text-sm text-red-600">Please check your connection and try refreshing</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => refetchProctoringData()} className="ml-auto">
                      Retry
                    </Button>
                  </div>
                )}

                {proctoringLoading && (
                  <div className="flex items-center justify-center py-8 gap-3 text-gray-500">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span>Loading proctoring data...</span>
                  </div>
                )}

                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="bg-red-50 border-red-100">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                          <AlertTriangle className="w-5 h-5 text-red-600" />
                        </div>
                        <div title="Sessions with violation score >= 60 (flag threshold from proctoring settings)">
                          <p className="text-2xl font-bold text-red-700" data-testid="text-flagged-sessions">{proctoringStats.flaggedSessions}</p>
                          <p className="text-sm text-red-600">Flagged Sessions</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-amber-50 border-amber-100">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center">
                          <AlertCircle className="w-5 h-5 text-amber-600" />
                        </div>
                        <div title="Sum of all warning counts across active proctoring sessions">
                          <p className="text-2xl font-bold text-amber-700" data-testid="text-total-warnings">{proctoringStats.totalWarnings}</p>
                          <p className="text-sm text-amber-600">Total Warnings</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-violet-50 border-violet-100">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                          <Users className="w-5 h-5 text-violet-600" />
                        </div>
                        <div title="Active sessions where face is not currently detected by the proctoring camera">
                          <p className="text-2xl font-bold text-violet-700" data-testid="text-face-issues">{proctoringStats.faceIssues}</p>
                          <p className="text-sm text-violet-600">Face Detection Issues</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-cyan-50 border-cyan-100">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-cyan-100 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-cyan-600" />
                        </div>
                        <div title="Currently active proctoring sessions being monitored in real-time">
                          <p className="text-2xl font-bold text-cyan-700" data-testid="text-active-sessions">{proctoringStats.activeSessions}</p>
                          <p className="text-sm text-cyan-600">Active Sessions</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <CardTitle className="text-gray-800 flex items-center gap-2">
                        <Shield className="w-5 h-5 text-red-500" />
                        Active Proctoring Sessions
                      </CardTitle>
                      <Badge className={`${proctoringStats.activeSessions > 0 ? "bg-red-100 text-red-700 animate-pulse" : "bg-gray-100 text-gray-600"}`}>
                        <Radio className="w-3 h-3 mr-1" />
                        {proctoringStats.activeSessions > 0 ? "Live Monitoring" : "No Active Sessions"}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-96">
                      {activeProctoringSessionsData.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                          <Shield className="w-12 h-12 mb-4 opacity-50" />
                          <p className="text-lg font-medium">No Active Proctoring Sessions</p>
                          <p className="text-sm">Sessions will appear here when students start proctored exams</p>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          {activeProctoringSessionsData.map((session: any) => {
                            const severity = session.violationScore >= 60 ? "critical" :
                                           session.violationScore >= 30 ? "warning" : "ok";
                            return (
                              <div
                                key={session.id}
                                data-testid={`session-row-${session.id}`}
                                className={`flex items-center justify-between p-4 rounded-lg ${
                                  severity === "critical" ? "bg-red-50 border border-red-100" :
                                  severity === "warning" ? "bg-amber-50 border border-amber-100" :
                                  "bg-green-50 border border-green-100"
                                }`}
                              >
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                                    severity === "critical" ? "bg-red-100" :
                                    severity === "warning" ? "bg-amber-100" :
                                    "bg-green-100"
                                  }`}>
                                    {severity === "critical" ? <AlertTriangle className="w-5 h-5 text-red-600" /> :
                                     severity === "warning" ? <AlertCircle className="w-5 h-5 text-amber-600" /> :
                                     <CheckCircle className="w-5 h-5 text-green-600" />}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-800">
                                      Session #{session.id}
                                      <span className="text-gray-500 ml-2">Attempt #{session.attemptId}</span>
                                    </p>
                                    <div className="flex items-center gap-3 text-sm text-gray-600">
                                      <span className="flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Score: {session.violationScore || 0}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        <AlertCircle className="w-3 h-3" />
                                        Warnings: {session.warningCount || 0}
                                      </span>
                                      <span className="flex items-center gap-1">
                                        {session.faceDetected ? (
                                          <><CheckCircle className="w-3 h-3 text-green-500" /> Face OK</>
                                        ) : (
                                          <><X className="w-3 h-3 text-red-500" /> No Face</>
                                        )}
                                      </span>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                      Status: {session.status} | Camera: {session.cameraEnabled ? "On" : "Off"} | Fullscreen: {session.fullScreenActive ? "Yes" : "No"}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge className={
                                    session.status === "active" ? "bg-green-100 text-green-700" :
                                    session.status === "paused" ? "bg-amber-100 text-amber-700" :
                                    session.status === "terminated" ? "bg-red-100 text-red-700" :
                                    "bg-gray-100 text-gray-700"
                                  }>
                                    {session.status}
                                  </Badge>
                                  <Button size="sm" variant="outline" className="text-amber-600 border-amber-200" data-testid={`button-warn-${session.id}`}>
                                    Warn
                                  </Button>
                                  <Button size="sm" variant="outline" className="text-red-600 border-red-200" data-testid={`button-terminate-${session.id}`}>
                                    Terminate
                                  </Button>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>

                <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                  <CardHeader>
                    <CardTitle className="text-gray-800 flex items-center gap-2">
                      <FileText className="w-5 h-5 text-violet-500" />
                      Violation Rules
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rulesError && (
                      <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-600" />
                        <div>
                          <p className="font-medium text-red-800">Failed to load violation rules</p>
                          <p className="text-sm text-red-600">Please check your connection and try again</p>
                        </div>
                        <Button size="sm" variant="outline" onClick={() => queryClient.invalidateQueries({ queryKey: ["/api/proctor/rules"] })} className="ml-auto">
                          Retry
                        </Button>
                      </div>
                    )}
                    {rulesLoading && (
                      <div className="flex items-center justify-center py-8 gap-3 text-gray-500">
                        <RefreshCw className="w-5 h-5 animate-spin" />
                        <span>Loading violation rules...</span>
                      </div>
                    )}
                    {!rulesLoading && !rulesError && violationRulesData.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        <p>No violation rules configured. Default rules will be used.</p>
                      </div>
                    ) : !rulesLoading && !rulesError && (
                      <Table>
                        <TableHeader>
                          <TableRow className="border-gray-200">
                            <TableHead className="text-gray-600">Code</TableHead>
                            <TableHead className="text-gray-600">Name</TableHead>
                            <TableHead className="text-gray-600">Category</TableHead>
                            <TableHead className="text-gray-600">Severity</TableHead>
                            <TableHead className="text-gray-600">Score</TableHead>
                            <TableHead className="text-gray-600">Action</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {violationRulesData.map((rule: any) => (
                            <TableRow key={rule.id} className="border-gray-200">
                              <TableCell className="font-mono text-sm">{rule.code}</TableCell>
                              <TableCell className="font-medium text-gray-800">{rule.name}</TableCell>
                              <TableCell>
                                <Badge variant="outline">{rule.category}</Badge>
                              </TableCell>
                              <TableCell>
                                <Badge className={
                                  rule.severity === "critical" ? "bg-red-100 text-red-700" :
                                  rule.severity === "high" ? "bg-orange-100 text-orange-700" :
                                  rule.severity === "medium" ? "bg-amber-100 text-amber-700" :
                                  "bg-gray-100 text-gray-700"
                                }>
                                  {rule.severity}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-semibold">{rule.score}</TableCell>
                              <TableCell className="capitalize">{rule.action}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    )}
                  </CardContent>
                </Card>

                <ProctoringWarningSettingsCard toast={toast} />
              </motion.div>
            )}

            {activeTab === "finance" && (
              <motion.div
                key="finance"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <PaymentsManagementTab toast={toast} />
              </motion.div>
            )}

            {activeTab === "partners" && (
              <motion.div
                key="partners"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <PartnerManagementTab />
              </motion.div>
            )}

            {activeTab === "manage-students" && (
              <motion.div key="manage-students" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <UserManagementTab userType="students" />
              </motion.div>
            )}

            {activeTab === "manage-supervisors" && (
              <motion.div key="manage-supervisors" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <UserManagementTab userType="supervisors" />
              </motion.div>
            )}

            {activeTab === "manage-schools" && (
              <motion.div key="manage-schools" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <UserManagementTab userType="schools" />
              </motion.div>
            )}

            {activeTab === "manage-coordinators" && (
              <motion.div key="manage-coordinators" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <UserManagementTab userType="coordinators" />
              </motion.div>
            )}

            {activeTab === "manage-partners" && (
              <motion.div key="manage-partners" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}>
                <UserManagementTab userType="partners" />
              </motion.div>
            )}

            {activeTab === "marketing" && (
              <MarketingControlTab toast={toast} />
            )}

            {activeTab === "email" && (
              <motion.div
                key="email"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <EmailMarketingTab />
              </motion.div>
            )}

            {activeTab === "chatbot" && (
              <motion.div
                key="chatbot"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <ChatbotTab />
              </motion.div>
            )}

            {activeTab === "guruji" && (
              <motion.div
                key="guruji"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <GurujiAdminSettings />
              </motion.div>
            )}

            {activeTab === "cms" && (
              <ContentCMSTab toast={toast} />
            )}

            {activeTab === "blog" && (
              <BlogAdminTab toast={toast} />
            )}

            {activeTab === "media" && (
              <MediaLibraryTab toast={toast} />
            )}

            {activeTab === "docs" && (
              <motion.div
                key="docs"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <DocumentationSection toast={toast} />
              </motion.div>
            )}

            {activeTab === "rbac" && (
              <motion.div
                key="rbac"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <PlatformControlOTPWrapper sectionName="Roles & Access" sectionIcon={<Shield className="w-8 h-8 text-white" />}>
                  <RBACManagementTab toast={toast} />
                </PlatformControlOTPWrapper>
              </motion.div>
            )}

            {activeTab === "systemaudit" && (
              <motion.div
                key="systemaudit"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <PlatformControlOTPWrapper sectionName="System Audit" sectionIcon={<Activity className="w-8 h-8 text-white" />}>
                  <SystemAuditSection />
                </PlatformControlOTPWrapper>
              </motion.div>
            )}

            {activeTab === "qa" && (
              <motion.div
                key="qa"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <PlatformControlOTPWrapper sectionName="QA & Testing" sectionIcon={<ClipboardCheck className="w-8 h-8 text-white" />}>
                  <QATestingSection />
                </PlatformControlOTPWrapper>
              </motion.div>
            )}

            {activeTab === "pwa" && (
              <motion.div
                key="pwa"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <PlatformControlOTPWrapper sectionName="PWA Settings" sectionIcon={<Smartphone className="w-8 h-8 text-white" />}>
                  <PWAManagementTab />
                </PlatformControlOTPWrapper>
              </motion.div>
            )}

            {activeTab === "dbsync" && (
              <motion.div
                key="dbsync"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <PlatformControlOTPWrapper sectionName="Database Sync" sectionIcon={<Server className="w-8 h-8 text-white" />}>
                  <DatabaseSyncTab />
                </PlatformControlOTPWrapper>
              </motion.div>
            )}

            {activeTab === "terminal" && (
              <motion.div
                key="terminal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="h-[calc(100vh-120px)]"
              >
                <SecureTerminal />
              </motion.div>
            )}

            {activeTab === "coupons" && (
              <motion.div
                key="coupons"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <CouponManagementTab />
              </motion.div>
            )}

            {activeTab === "whatsapp" && (
              <motion.div
                key="whatsapp"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <WhatsAppTab />
              </motion.div>
            )}

            {activeTab === "leaderboards" && (
              <motion.div
                key="leaderboards"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <LeaderboardTab />
              </motion.div>
            )}

            {activeTab === "parents" && (
              <motion.div
                key="parents"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <ParentManagementTab />
              </motion.div>
            )}

            {activeTab === "notifications" && (
              <motion.div
                key="notifications"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <NotificationHistoryTab />
              </motion.div>
            )}

            {activeTab === "support" && (
              <motion.div
                key="support"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <SupportTicketTab />
              </motion.div>
            )}

            {activeTab === "reports" && (
              <motion.div
                key="reports"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <ReportsAnalyticsTab />
              </motion.div>
            )}

            {activeTab === "certificates" && (
              <motion.div
                key="certificates"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <CertificateDesignerTab />
              </motion.div>
            )}

            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                {/* Screen Lock Settings */}
                <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-gray-800">
                      <Lock className="w-5 h-5 text-red-500" />
                      Screen Lock Settings
                    </CardTitle>
                    <CardDescription>
                      Protect your dashboard with a PIN code. Press Ctrl+L to lock when enabled.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="font-medium">Enable Screen Lock</Label>
                        <p className="text-sm text-muted-foreground">Require PIN to unlock dashboard</p>
                      </div>
                      <Switch 
                        checked={lockPinEnabled} 
                        onCheckedChange={setLockPinEnabled}
                        data-testid="switch-lock-enabled"
                      />
                    </div>
                    
                    {lockPinEnabled && (
                      <div className="space-y-3 pt-2 border-t">
                        <Label>Set PIN Code (4-6 digits)</Label>
                        <div className="flex gap-2">
                          <div className="relative flex-1">
                            <Input
                              type={showPin ? "text" : "password"}
                              value={lockPin}
                              onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, "").slice(0, 6);
                                setLockPin(value);
                                setPinError("");
                              }}
                              placeholder="Enter 4-6 digit PIN"
                              className="pr-10"
                              data-testid="input-lock-pin"
                            />
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                              onClick={() => setShowPin(!showPin)}
                            >
                              {showPin ? <EyeOff className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
                            </Button>
                          </div>
                          <Button
                            onClick={() => {
                              if (lockPin.length < 4) {
                                setPinError("PIN must be at least 4 digits");
                                return;
                              }
                              localStorage.setItem("super-admin-lock-pin", lockPin);
                              localStorage.setItem("super-admin-lock-enabled", "true");
                              toast({ title: "Lock PIN Saved", description: "Your screen lock PIN has been set. Press Ctrl+L to lock." });
                            }}
                            disabled={lockPin.length < 4}
                            data-testid="button-save-pin"
                          >
                            <Save className="w-4 h-4 mr-2" />
                            Save PIN
                          </Button>
                        </div>
                        {pinError && <p className="text-sm text-red-500">{pinError}</p>}
                        {lockPin.length >= 4 && (
                          <p className="text-sm text-emerald-600 flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Lock button will appear in header. Use Ctrl+L to lock anytime.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
                
                <GlobalSettings />
              </motion.div>
            )}

            {activeTab === "health" && (
              <motion.div
                key="health"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-6"
              >
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className={`border-0 shadow-lg ${metrics?.serverHealth?.cpu && metrics.serverHealth.cpu < 50 ? "bg-gradient-to-br from-emerald-500 to-emerald-600" : metrics?.serverHealth?.cpu && metrics.serverHealth.cpu < 80 ? "bg-gradient-to-br from-amber-500 to-amber-600" : "bg-gradient-to-br from-red-500 to-red-600"} text-white`}>
                    <CardContent className="p-4">
                      <Cpu className="w-5 h-5 mb-2 opacity-80" />
                      <p className="text-3xl font-bold">{metrics?.serverHealth?.cpu || 0}%</p>
                      <p className="text-sm opacity-80">CPU Usage</p>
                    </CardContent>
                  </Card>
                  <Card className={`border-0 shadow-lg ${metrics?.serverHealth?.memory && metrics.serverHealth.memory < 50 ? "bg-gradient-to-br from-emerald-500 to-emerald-600" : metrics?.serverHealth?.memory && metrics.serverHealth.memory < 80 ? "bg-gradient-to-br from-amber-500 to-amber-600" : "bg-gradient-to-br from-red-500 to-red-600"} text-white`}>
                    <CardContent className="p-4">
                      <MemoryStick className="w-5 h-5 mb-2 opacity-80" />
                      <p className="text-3xl font-bold">{metrics?.serverHealth?.memory || 0}%</p>
                      <p className="text-sm opacity-80">Memory Usage</p>
                    </CardContent>
                  </Card>
                  <Card className={`border-0 shadow-lg ${metrics?.serverHealth?.latency && metrics.serverHealth.latency < 50 ? "bg-gradient-to-br from-emerald-500 to-emerald-600" : metrics?.serverHealth?.latency && metrics.serverHealth.latency < 100 ? "bg-gradient-to-br from-amber-500 to-amber-600" : "bg-gradient-to-br from-red-500 to-red-600"} text-white`}>
                    <CardContent className="p-4">
                      <Wifi className="w-5 h-5 mb-2 opacity-80" />
                      <p className="text-3xl font-bold">{metrics?.serverHealth?.latency || 0}ms</p>
                      <p className="text-sm opacity-80">Latency</p>
                    </CardContent>
                  </Card>
                  <Card className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white border-0 shadow-lg">
                    <CardContent className="p-4">
                      <Activity className="w-5 h-5 mb-2 opacity-80" />
                      <p className="text-3xl font-bold">{isConnected ? "Online" : "Offline"}</p>
                      <p className="text-sm opacity-80">WebSocket Status</p>
                    </CardContent>
                  </Card>
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-gray-800 flex items-center gap-2">
                          <Server className="w-5 h-5 text-violet-500" />
                          Server Metrics
                        </CardTitle>
                        <Badge variant="outline" className={`${metrics?.serverHealth?.cpu && metrics.serverHealth.cpu < 70 ? "text-emerald-600 border-emerald-300" : "text-amber-600 border-amber-300"}`}>
                          {metrics?.serverHealth?.cpu && metrics.serverHealth.cpu < 70 ? "Healthy" : "High Load"}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-2"><Cpu className="w-4 h-4" /> CPU Usage</span>
                          <span className="font-semibold text-gray-800">{metrics?.serverHealth?.cpu || 0}%</span>
                        </div>
                        <Progress value={metrics?.serverHealth?.cpu || 0} className="h-3" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-2"><MemoryStick className="w-4 h-4" /> Memory Usage</span>
                          <span className="font-semibold text-gray-800">{metrics?.serverHealth?.memory || 0}%</span>
                        </div>
                        <Progress value={metrics?.serverHealth?.memory || 0} className="h-3" />
                      </div>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-gray-500 flex items-center gap-2"><Wifi className="w-4 h-4" /> Network Latency</span>
                          <span className="font-semibold text-gray-800">{metrics?.serverHealth?.latency || 0}ms</span>
                        </div>
                        <Progress value={Math.min((metrics?.serverHealth?.latency || 0) / 2, 100)} className="h-3" />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                    <CardHeader>
                      <CardTitle className="text-gray-800 flex items-center gap-2">
                        <Activity className="w-5 h-5 text-fuchsia-500" />
                        System Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Server className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">API Server</p>
                            <p className="text-xs text-gray-500">Express.js on port 5000</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700">Running</Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Radio className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">WebSocket Server</p>
                            <p className="text-xs text-gray-500">/sysctrl/ws endpoint</p>
                          </div>
                        </div>
                        <Badge className={isConnected ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}>
                          {isConnected ? "Connected" : "Disconnected"}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                            <Globe className="w-5 h-5 text-emerald-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-800">Database</p>
                            <p className="text-xs text-gray-500">PostgreSQL</p>
                          </div>
                        </div>
                        <Badge className="bg-emerald-100 text-emerald-700">Connected</Badge>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/80 backdrop-blur border-gray-200/50">
                  <CardHeader>
                    <CardTitle className="text-gray-800">Infrastructure Controls</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-4 flex-wrap">
                      <Button 
                        variant="outline" 
                        className="border-amber-200 text-amber-600"
                        onClick={handleRestartServices}
                        disabled={restartMutation.isPending}
                        data-testid="button-restart-services"
                      >
                        <RefreshCw className={`w-4 h-4 mr-2 ${restartMutation.isPending ? "animate-spin" : ""}`} />
                        {restartMutation.isPending ? "Restarting..." : "Restart Services"}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleClearCache}
                        disabled={clearCacheMutation.isPending}
                        data-testid="button-clear-cache"
                      >
                        {clearCacheMutation.isPending ? "Clearing..." : "Clear Cache"}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleViewLogs}
                        disabled={logsMutation.isPending}
                        data-testid="button-view-logs"
                      >
                        {logsMutation.isPending ? "Loading..." : "View Logs"}
                      </Button>
                      <Button 
                        variant="outline"
                        onClick={handleHealthCheck}
                        disabled={healthCheckMutation.isPending}
                        data-testid="button-health-check"
                      >
                        {healthCheckMutation.isPending ? "Checking..." : "Health Check"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      <CreateOlympiadModal
        open={isCreateOlympiadOpen}
        onOpenChange={setIsCreateOlympiadOpen}
      />

      <AIQuestionGeneratorModal
        open={isAIGeneratorOpen}
        onOpenChange={setIsAIGeneratorOpen}
      />

      <BulkQuestionUpload
        open={isBulkUploadOpen}
        onOpenChange={setIsBulkUploadOpen}
      />

      {/* System Logs Dialog */}
      <Dialog open={isLogsDialogOpen} onOpenChange={setIsLogsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>System Logs</DialogTitle>
            <DialogDescription>Recent system activity and events</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-140px)] pr-2">
            <div className="space-y-3">
              {systemLogs.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No logs available</p>
              ) : (
                systemLogs.map((log, index) => (
                  <div 
                    key={index} 
                    className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 border border-gray-100"
                    data-testid={`log-entry-${index}`}
                  >
                    <div className={`w-2 h-2 rounded-full mt-2 ${
                      log.level === "error" ? "bg-red-500" : 
                      log.level === "warning" ? "bg-amber-500" : 
                      "bg-emerald-500"
                    }`} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-800">{log.message}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(log.timestamp), "MMM d, yyyy HH:mm:ss")}
                      </p>
                    </div>
                    <Badge 
                      variant="outline" 
                      className={`text-xs ${
                        log.level === "error" ? "border-red-200 text-red-600" :
                        log.level === "warning" ? "border-amber-200 text-amber-600" :
                        "border-emerald-200 text-emerald-600"
                      }`}
                    >
                      {log.level}
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setIsLogsDialogOpen(false)} data-testid="button-close-logs">
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Olympiad View Dialog */}
      <Dialog open={isOlympiadViewOpen} onOpenChange={setIsOlympiadViewOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Olympiad Details</DialogTitle>
            <DialogDescription>View complete details of this olympiad</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)]">
            {selectedOlympiad && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label className="text-muted-foreground text-xs">Title</Label>
                    <p className="font-medium">{selectedOlympiad.title}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Subject</Label>
                    <p className="font-medium">{selectedOlympiad.subject}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Duration</Label>
                    <p className="font-medium">{selectedOlympiad.durationMinutes} minutes</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Total Questions</Label>
                    <p className="font-medium">{selectedOlympiad.totalQuestions}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Status</Label>
                    <Badge variant={selectedOlympiad.status === "active" ? "default" : "secondary"}>
                      {selectedOlympiad.status}
                    </Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Visibility</Label>
                    <Badge variant="outline">{selectedOlympiad.isVisible ? "Visible" : "Hidden"}</Badge>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Participation Fee</Label>
                    <p className="font-medium">₹{(selectedOlympiad.participationFee / 100).toFixed(2)}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Total Marks</Label>
                    <p className="font-medium">{selectedOlympiad.totalMarks}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Negative Marking</Label>
                    <p className="font-medium">No</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Proctoring</Label>
                    <p className="font-medium">{selectedOlympiad.proctoring ? "Enabled" : "Disabled"}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Class Range</Label>
                    <p className="font-medium">Class {selectedOlympiad.minClass} - {selectedOlympiad.maxClass}</p>
                  </div>
                  <div>
                    <Label className="text-muted-foreground text-xs">Registration Period</Label>
                    <p className="font-medium text-sm">
                      {selectedOlympiad.registrationOpenDate && format(new Date(selectedOlympiad.registrationOpenDate), "MMM d, yyyy")} - 
                      {selectedOlympiad.registrationCloseDate && format(new Date(selectedOlympiad.registrationCloseDate), "MMM d, yyyy")}
                    </p>
                  </div>
                </div>
                <div>
                  <Label className="text-muted-foreground text-xs">Description</Label>
                  <p className="text-sm mt-1">{selectedOlympiad.description}</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="flex-shrink-0">
            <Button variant="outline" onClick={() => setIsOlympiadViewOpen(false)}>Close</Button>
            <Button onClick={() => { setIsOlympiadViewOpen(false); setIsOlympiadEditOpen(true); }}>
              <Edit className="w-4 h-4 mr-2" />
              Edit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Olympiad Edit Dialog */}
      <Dialog open={isOlympiadEditOpen} onOpenChange={setIsOlympiadEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader className="flex-shrink-0">
            <DialogTitle>Edit Olympiad</DialogTitle>
            <DialogDescription>Update olympiad details and content</DialogDescription>
          </DialogHeader>
          {selectedOlympiad && (
            <OlympiadEditContent
              olympiad={selectedOlympiad}
              onClose={() => setIsOlympiadEditOpen(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Olympiad Delete Confirmation */}
      <Dialog open={olympiadDeleteConfirm !== null} onOpenChange={() => setOlympiadDeleteConfirm(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Olympiad</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this olympiad? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOlympiadDeleteConfirm(null)}>Cancel</Button>
            <Button 
              variant="destructive" 
              onClick={async () => {
                if (olympiadDeleteConfirm) {
                  try {
                    await apiRequest("DELETE", `/api/exams/${olympiadDeleteConfirm}`);
                    toast({ title: "Success", description: "Olympiad deleted successfully" });
                    queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/exams"] });
                  } catch (err) {
                    toast({ title: "Error", description: "Failed to delete olympiad", variant: "destructive" });
                  }
                  setOlympiadDeleteConfirm(null);
                }
              }}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      </div>
    </LockScreen>
  );
}
