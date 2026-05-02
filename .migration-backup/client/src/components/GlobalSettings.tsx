import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Globe, Mail, MessageSquare, Bell, HardDrive, Puzzle, Languages as LanguagesIcon, 
  Image, Save, Plus, Trash2, Edit, Check, X, Search, Upload, Eye, EyeOff,
  Send, Settings, FileText, Palette, RefreshCw, Shield, Power, Share2, ExternalLink, Clock,
  Brain, Zap, TestTube2, Database, Download, FileJson, Table2, CheckCircle, Loader2,
  CreditCard, Building2, Receipt, IndianRupee, DollarSign, AlertCircle,
  ChevronDown, ChevronRight, Folder, FileCode, Trophy, Server, Cloud
} from "lucide-react";
import { SiFacebook, SiInstagram, SiX, SiLinkedin, SiYoutube, SiWhatsapp } from "react-icons/si";
import { motion } from "framer-motion";
import { CertificatePreviewSection } from "./CertificatePreviewSection";
import EmailTemplateManager from "./admin/EmailTemplateManager";

type SettingsSubSection = "meta" | "push" | "email" | "sms" | "storage" | "plugins" | "languages" | "logos" | "data_export" | "data_import" | "platform" | "social" | "ai" | "payments" | "code_export" | "certificates" | "future_plans";

interface SocialMediaLink {
  id: number;
  platformCode: string;
  platformName: string;
  pageUrl: string | null;
  isActive: boolean;
  displayOrder: number;
}

interface SiteSetting {
  id: number;
  key: string;
  value: string;
  category: string;
}

interface EmailTemplate {
  id: number;
  name: string;
  slug: string;
  subject: string;
  body: string;
  isActive: boolean;
}

interface SmsTemplate {
  id: number;
  name: string;
  body: string;
  variables: string;
  channel: string;
  msg91SmsTemplateId: string;
  msg91WhatsappTemplateName: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

interface PushTemplate {
  id: number;
  name: string;
  slug: string;
  title: string;
  body: string;
  isActive: boolean;
}

interface Language {
  id: number;
  code: string;
  name: string;
  nativeName: string;
  isActive: boolean;
  isDefault: boolean;
}

interface AiProvider {
  id: number;
  providerName: string;
  providerCode: string;
  category: string;
  apiKey: string | null;
  modelName: string | null;
  baseUrl: string | null;
  config: any;
  isActive: boolean;
  testStatus: string | null;
  lastTestedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

const AI_CATEGORIES = [
  { value: "content", label: "Content Generation", description: "For question generation, text content" },
  { value: "image", label: "Image Generation", description: "For generating images and diagrams" },
  { value: "research", label: "Research & Analysis", description: "For web search and research tasks" },
  { value: "speech_to_text", label: "Speech-to-Text", description: "For voice answer transcription and audio processing" },
  { value: "text_to_speech", label: "Text-to-Speech", description: "For voice synthesis, TARA AI responses, and audio generation" },
  { value: "face_detection", label: "Face Detection", description: "For exam proctoring and identity verification" },
  { value: "vision", label: "Vision AI", description: "For image analysis, OCR, and visual content processing" },
];

const AI_PROVIDERS = [
  { code: "openai", name: "OpenAI", categories: ["content", "image", "speech_to_text", "text_to_speech", "vision"] },
  { code: "gemini", name: "Google Gemini", categories: ["content", "vision"] },
  { code: "claude", name: "Claude (Anthropic)", categories: ["content", "vision"] },
  { code: "perplexity", name: "Perplexity", categories: ["research"] },
  { code: "stability", name: "Stability AI", categories: ["image"] },
  { code: "elevenlabs", name: "ElevenLabs", categories: ["text_to_speech"] },
  { code: "google_cloud", name: "Google Cloud AI", categories: ["speech_to_text", "text_to_speech", "face_detection", "vision"] },
  { code: "aws", name: "AWS AI Services", categories: ["speech_to_text", "text_to_speech", "face_detection", "vision"] },
  { code: "azure", name: "Azure Cognitive Services", categories: ["speech_to_text", "text_to_speech", "face_detection", "vision"] },
  { code: "deepgram", name: "Deepgram", categories: ["speech_to_text"] },
  { code: "assembly_ai", name: "AssemblyAI", categories: ["speech_to_text"] },
  { code: "custom", name: "Custom Provider", categories: ["content", "image", "research", "speech_to_text", "text_to_speech", "face_detection", "vision"] },
];

interface DatabaseTable {
  name: string;
  displayName: string;
  rowCount: number;
}

interface FileNode {
  name: string;
  path: string;
  type: "file" | "directory";
  size?: number;
  children?: FileNode[];
}

interface DocVersion {
  name: string;
  version: string;
  majorVersion: number;
  minorVersion: number;
  lastModified: string;
  changelog: Array<{ version: string; date: string; changes: string }>;
}

interface DocsVersions {
  lastUpdated: string;
  documents: Record<string, DocVersion>;
}

function PresentationsSection({ 
  isRefreshingPresentations, 
  setIsRefreshingPresentations,
  toast 
}: { 
  isRefreshingPresentations: boolean;
  setIsRefreshingPresentations: (v: boolean) => void;
  toast: (opts: { title: string; description: string; variant?: "default" | "destructive" }) => void;
}) {
  const [versions, setVersions] = useState<DocsVersions | null>(null);
  const [isLoading, setIsLoading] = useState(true);

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

  const getLastModified = (docKey: string) => {
    const doc = versions?.documents[docKey];
    if (!doc?.lastModified) return 'Unknown';
    return new Date(doc.lastModified).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long', day: 'numeric' 
    });
  };

  const getLatestChange = () => {
    if (!versions?.documents) return 'Auto-versioning system active';
    const allChanges = Object.values(versions.documents)
      .flatMap(doc => doc.changelog || [])
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    if (allChanges.length === 0) return 'Auto-versioning system active';
    return allChanges[0].changes;
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
          <FileText className="w-5 h-5 text-violet-500" />
          Platform Presentations
        </h3>
        <p className="text-sm text-muted-foreground mt-1">
          View and update platform feature and security documentation presentations
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/features-presentation.html', '_blank')}
              className="flex-1"
              data-testid="button-view-features-presentation"
            >
              <Eye className="w-4 h-4 mr-1" /> View
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/features-presentation.html', '_blank')}
              className="flex-1"
              data-testid="button-print-features-presentation"
            >
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/security-presentation.html', '_blank')}
              className="flex-1"
              data-testid="button-view-security-presentation"
            >
              <Eye className="w-4 h-4 mr-1" /> View
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/security-presentation.html', '_blank')}
              className="flex-1"
              data-testid="button-print-security-presentation"
            >
              <Download className="w-4 h-4 mr-1" /> Print PDF
            </Button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                <Trophy className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">Results & Ranking</h4>
                <p className="text-xs text-gray-500">Dual ranking mechanisms</p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700">v{getVersion('results-presentation')}</Badge>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/results-presentation.html', '_blank')}
              className="flex-1"
              data-testid="button-view-results-presentation"
            >
              <Eye className="w-4 h-4 mr-1" /> View
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/results-presentation.html', '_blank')}
              className="flex-1"
              data-testid="button-print-results-presentation"
            >
              <Download className="w-4 h-4 mr-1" /> Print PDF
            </Button>
          </div>
        </div>

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
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/guides/portal-guide.html', '_blank')}
              className="flex-1"
              data-testid="button-view-portal-guide"
            >
              <Eye className="w-4 h-4 mr-1" /> View
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/guides/portal-guide.html', '_blank')}
              className="flex-1"
              data-testid="button-print-portal-guide"
            >
              <Download className="w-4 h-4 mr-1" /> Print PDF
            </Button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-orange-50 to-red-50 border border-orange-200/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center text-white">
                <Cloud className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">AWS Deployment Guide</h4>
                <p className="text-xs text-gray-500">Complete cloud deployment manual</p>
              </div>
            </div>
            <Badge className="bg-orange-100 text-orange-700">v{getVersion('aws-deployment-guide')}</Badge>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/aws-deployment-guide.html', '_blank')}
              className="flex-1"
              data-testid="button-view-aws-deployment-guide"
            >
              <Eye className="w-4 h-4 mr-1" /> View
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/aws-deployment-guide.html', '_blank')}
              className="flex-1"
              data-testid="button-print-aws-deployment-guide"
            >
              <Download className="w-4 h-4 mr-1" /> Print PDF
            </Button>
          </div>
        </div>

        <div className="p-4 rounded-lg bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200/50">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center text-white">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-semibold text-gray-800">System Audit Report</h4>
                <p className="text-xs text-gray-500">Transparent health & methodology</p>
              </div>
            </div>
            <Badge className="bg-emerald-100 text-emerald-700">v{getVersion('system-audit-report')}</Badge>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/system-audit-report.html', '_blank')}
              className="flex-1"
              data-testid="button-view-system-audit-report"
            >
              <Eye className="w-4 h-4 mr-1" /> View
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.open('/system-audit-report.html', '_blank')}
              className="flex-1"
              data-testid="button-print-system-audit-report"
            >
              <Download className="w-4 h-4 mr-1" /> Print PDF
            </Button>
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
                disabled={isRefreshingPresentations}
                onClick={async () => {
                  setIsRefreshingPresentations(true);
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
                      title: "Presentations Refreshed",
                      description: "Latest versions loaded successfully",
                    });
                  } catch (error) {
                    toast({
                      title: "Refresh Failed",
                      description: "Could not refresh presentations",
                      variant: "destructive",
                    });
                  } finally {
                    setIsRefreshingPresentations(false);
                  }
                }}
                className="bg-blue-100 border-blue-300 text-blue-700 hover:bg-blue-200"
                data-testid="button-refresh-presentations"
              >
                {isRefreshingPresentations ? (
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3 mr-1" />
                )}
                {isRefreshingPresentations ? "Refreshing..." : "Refresh"}
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
    </div>
  );
}

function CodeExportSection() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [fileStructure, setFileStructure] = useState<FileNode[]>([]);
  const [expandedDirs, setExpandedDirs] = useState<Set<string>>(new Set());

  const fetchFileStructure = async () => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/sysctrl/code/structure");
      if (!response.ok) throw new Error("Failed to fetch file structure");
      const data = await response.json();
      setFileStructure(data);
    } catch (error) {
      toast({ title: "Error", description: "Failed to load file structure", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFileStructure();
  }, []);

  const toggleDir = (path: string) => {
    setExpandedDirs(prev => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  };

  const handleDownloadZip = async () => {
    setIsDownloading(true);
    try {
      const response = await fetch("/api/sysctrl/code/download-zip");
      if (!response.ok) throw new Error("Failed to download");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "project-code.zip";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      toast({ title: "Success", description: "Code downloaded successfully" });
    } catch (error) {
      toast({ title: "Error", description: "Failed to download code", variant: "destructive" });
    } finally {
      setIsDownloading(false);
    }
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const renderTree = (nodes: FileNode[], level = 0) => {
    return nodes.map((node) => (
      <div key={node.path} style={{ marginLeft: level * 16 }}>
        {node.type === "directory" ? (
          <>
            <div 
              className="flex items-center gap-2 py-1 px-2 hover:bg-muted rounded cursor-pointer"
              onClick={() => toggleDir(node.path)}
            >
              {expandedDirs.has(node.path) ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )}
              <Folder className="h-4 w-4 text-blue-500" />
              <span className="text-sm font-medium">{node.name}</span>
            </div>
            {expandedDirs.has(node.path) && node.children && (
              <div>{renderTree(node.children, level + 1)}</div>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 py-1 px-2 hover:bg-muted rounded ml-6">
            <FileCode className="h-4 w-4 text-gray-500" />
            <span className="text-sm">{node.name}</span>
            {node.size && (
              <span className="text-xs text-muted-foreground ml-auto">{formatSize(node.size)}</span>
            )}
          </div>
        )}
      </div>
    ));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Code Export
          </CardTitle>
          <CardDescription>
            View your project structure and download the complete codebase as a ZIP file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <Button variant="outline" onClick={fetchFileStructure} disabled={isLoading}>
              <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? "animate-spin" : ""}`} />
              Refresh Structure
            </Button>
            <Button onClick={handleDownloadZip} disabled={isDownloading} data-testid="button-download-code-zip">
              {isDownloading ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Download className="h-4 w-4 mr-2" />
              )}
              Download as ZIP
            </Button>
          </div>

          <Separator />

          <div className="border rounded-lg p-4 max-h-[500px] overflow-y-auto bg-muted/30">
            <div className="text-sm font-medium mb-2 flex items-center gap-2">
              <Folder className="h-4 w-4" />
              Project Structure
            </div>
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : fileStructure.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">No files found</p>
            ) : (
              renderTree(fileStructure)
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function DataExportSection() {
  const { toast } = useToast();
  const [selectedTables, setSelectedTables] = useState<Set<string>>(new Set());
  const [exportFormat, setExportFormat] = useState<"sql" | "json" | "csv" | "dbf">("json");
  const [exportType, setExportType] = useState<"full" | "schema-only">("full");
  const [isExporting, setIsExporting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [exportProgress, setExportProgress] = useState<string>("");
  const [includeSchema, setIncludeSchema] = useState(true);

  // Fetch tables dynamically from database with no cache
  const { data: tables = [], isLoading: tablesLoading, refetch } = useQuery<DatabaseTable[]>({
    queryKey: ["/api/sysctrl/database/tables"],
    staleTime: 0, // Always fetch fresh data
    gcTime: 0, // Don't cache
  });

  // Calculate total rows
  const totalRows = tables.reduce((sum, t) => sum + t.rowCount, 0);
  const selectedRows = tables.filter(t => selectedTables.has(t.name)).reduce((sum, t) => sum + t.rowCount, 0);

  // Auto-select all tables when loaded
  useEffect(() => {
    if (tables.length > 0 && selectedTables.size === 0) {
      setSelectedTables(new Set(tables.map(t => t.name)));
    }
  }, [tables]);

  // Initialize database from schema code file
  const [isInitializing, setIsInitializing] = useState(false);
  
  const handleInitializeSchema = async () => {
    setIsInitializing(true);
    try {
      const response = await apiRequest("POST", "/api/sysctrl/database/initialize-from-schema", {});
      const result = await response.json();
      
      if (result.success) {
        toast({
          title: "Schema Initialized",
          description: `${result.tablesCreated} new tables created. Total: ${result.totalTables} tables.`
        });
        await refetch(); // Refresh table list
      } else {
        throw new Error(result.message || "Failed to initialize schema");
      }
    } catch (error: any) {
      toast({
        title: "Initialization failed",
        description: error.message || "Could not initialize database schema",
        variant: "destructive"
      });
    } finally {
      setIsInitializing(false);
    }
  };

  // Sync database - force refresh
  const handleSync = async () => {
    setIsSyncing(true);
    try {
      await refetch();
      toast({
        title: "Database synced",
        description: `Found ${tables.length} tables with fresh row counts`
      });
    } catch (error) {
      toast({
        title: "Sync failed",
        description: "Could not refresh database info",
        variant: "destructive"
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const toggleTable = (tableId: string) => {
    setSelectedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableId)) {
        newSet.delete(tableId);
      } else {
        newSet.add(tableId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    setSelectedTables(new Set(tables.map(t => t.name)));
  };

  const deselectAll = () => {
    setSelectedTables(new Set());
  };

  const handleExport = async () => {
    if (selectedTables.size === 0) {
      toast({
        title: "No tables selected",
        description: "Please select at least one table to export",
        variant: "destructive"
      });
      return;
    }

    setIsExporting(true);
    setExportProgress("Preparing export...");

    try {
      const response = await fetch("/api/sysctrl/database/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tables: Array.from(selectedTables),
          format: exportFormat,
          includeSchema: true,
          schemaOnly: exportType === "schema-only"
        })
      });

      if (!response.ok) {
        throw new Error("Export failed");
      }

      const blob = await response.blob();
      const filename = `samikaran_export_${new Date().toISOString().split('T')[0]}.${exportFormat}`;
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: "Export successful",
        description: `Database exported as ${filename}`
      });
    } catch (error) {
      toast({
        title: "Export failed",
        description: "Failed to export database. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsExporting(false);
      setExportProgress("");
    }
  };

  return (
    <Card className="bg-white/80 backdrop-blur border-gray-200/50">
      <CardHeader>
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <Database className="w-5 h-5 text-violet-500" />
          Database Export
        </CardTitle>
        <CardDescription>
          Export your development database data to import into production. Select the tables and format you need.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 rounded-lg bg-gradient-to-r from-violet-50 to-fuchsia-50 border border-violet-200">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center shrink-0">
                <Database className="w-5 h-5 text-white" />
              </div>
              <div>
                <h4 className="font-medium text-gray-800">Database Summary</h4>
                <p className="text-sm text-gray-600">
                  {tables.length} tables • {totalRows.toLocaleString()} total rows
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={handleSync}
                disabled={isSyncing || tablesLoading}
                className="border-violet-300 hover:bg-violet-50"
                data-testid="button-sync-database"
              >
                {isSyncing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Syncing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Refresh
                  </>
                )}
              </Button>
              <Button
                onClick={handleInitializeSchema}
                disabled={isInitializing}
                className="bg-gradient-to-r from-emerald-500 to-green-500 text-white shadow-md"
                data-testid="button-initialize-schema"
              >
                {isInitializing ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Creating Tables...
                  </>
                ) : (
                  <>
                    <Database className="w-4 h-4 mr-2" />
                    Initialize Schema
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-medium">Export Type</Label>
          <div className="grid gap-3 md:grid-cols-2">
            <Card 
              className={`cursor-pointer transition-all hover-elevate ${exportType === 'full' ? 'ring-2 ring-violet-500 bg-violet-50' : ''}`}
              onClick={() => setExportType('full')}
              data-testid="export-type-full"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${exportType === 'full' ? 'bg-violet-500' : 'bg-gray-100'}`}>
                    <Database className={`w-5 h-5 ${exportType === 'full' ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Full Export</p>
                    <p className="text-xs text-gray-500">Schema + All Data</p>
                  </div>
                  {exportType === 'full' && <CheckCircle className="w-5 h-5 text-violet-500" />}
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Export complete database backup including table structures and all row data. Use for backups and migrations.
                </p>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover-elevate ${exportType === 'schema-only' ? 'ring-2 ring-violet-500 bg-violet-50' : ''}`}
              onClick={() => setExportType('schema-only')}
              data-testid="export-type-schema"
            >
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${exportType === 'schema-only' ? 'bg-violet-500' : 'bg-gray-100'}`}>
                    <FileJson className={`w-5 h-5 ${exportType === 'schema-only' ? 'text-white' : 'text-gray-600'}`} />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">Schema Only</p>
                    <p className="text-xs text-gray-500">Tables & Structure Only</p>
                  </div>
                  {exportType === 'schema-only' && <CheckCircle className="w-5 h-5 text-violet-500" />}
                </div>
                <p className="text-sm text-gray-600 mt-3">
                  Export only table structures (CREATE TABLE) without data. Use for recreating empty database structure.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Export Format</Label>
          </div>
          <div className="grid gap-3 md:grid-cols-4">
            <Card 
              className={`cursor-pointer transition-all hover-elevate ${exportFormat === 'json' ? 'ring-2 ring-violet-500 bg-violet-50' : ''}`}
              onClick={() => setExportFormat('json')}
              data-testid="format-json"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${exportFormat === 'json' ? 'bg-violet-500' : 'bg-gray-100'}`}>
                  <FileJson className={`w-5 h-5 ${exportFormat === 'json' ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className="font-medium">JSON</p>
                  <p className="text-xs text-gray-500">Universal format</p>
                </div>
                {exportFormat === 'json' && <CheckCircle className="w-5 h-5 text-violet-500 ml-auto" />}
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover-elevate ${exportFormat === 'sql' ? 'ring-2 ring-violet-500 bg-violet-50' : ''}`}
              onClick={() => setExportFormat('sql')}
              data-testid="format-sql"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${exportFormat === 'sql' ? 'bg-violet-500' : 'bg-gray-100'}`}>
                  <Database className={`w-5 h-5 ${exportFormat === 'sql' ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className="font-medium">SQL</p>
                  <p className="text-xs text-gray-500">INSERT statements</p>
                </div>
                {exportFormat === 'sql' && <CheckCircle className="w-5 h-5 text-violet-500 ml-auto" />}
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover-elevate ${exportFormat === 'csv' ? 'ring-2 ring-violet-500 bg-violet-50' : ''}`}
              onClick={() => setExportFormat('csv')}
              data-testid="format-csv"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${exportFormat === 'csv' ? 'bg-violet-500' : 'bg-gray-100'}`}>
                  <Table2 className={`w-5 h-5 ${exportFormat === 'csv' ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className="font-medium">CSV</p>
                  <p className="text-xs text-gray-500">Spreadsheet format</p>
                </div>
                {exportFormat === 'csv' && <CheckCircle className="w-5 h-5 text-violet-500 ml-auto" />}
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all hover-elevate ${exportFormat === 'dbf' ? 'ring-2 ring-violet-500 bg-violet-50' : ''}`}
              onClick={() => setExportFormat('dbf')}
              data-testid="format-dbf"
            >
              <CardContent className="p-4 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${exportFormat === 'dbf' ? 'bg-violet-500' : 'bg-gray-100'}`}>
                  <HardDrive className={`w-5 h-5 ${exportFormat === 'dbf' ? 'text-white' : 'text-gray-600'}`} />
                </div>
                <div>
                  <p className="font-medium">DBF</p>
                  <p className="text-xs text-gray-500">dBASE format</p>
                </div>
                {exportFormat === 'dbf' && <CheckCircle className="w-5 h-5 text-violet-500 ml-auto" />}
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-base font-medium">Select Tables to Export</Label>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={selectAll} data-testid="button-select-all">
                Select All
              </Button>
              <Button variant="ghost" size="sm" onClick={deselectAll} data-testid="button-deselect-all">
                Deselect All
              </Button>
            </div>
          </div>
          
          {tablesLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-violet-500" />
              <span className="ml-2 text-gray-500">Loading tables...</span>
            </div>
          ) : (
            <div className="max-h-80 overflow-y-auto border rounded-lg p-2 bg-gray-50/50">
              <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {tables.map(table => (
                  <div
                    key={table.name}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${
                      selectedTables.has(table.name) 
                        ? 'bg-violet-50 border-violet-200' 
                        : 'bg-white border-gray-200 hover:bg-gray-100'
                    }`}
                    onClick={() => toggleTable(table.name)}
                    data-testid={`table-${table.name}`}
                  >
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 ${
                      selectedTables.has(table.name) 
                        ? 'bg-violet-500 border-violet-500' 
                        : 'border-gray-300 bg-white'
                    }`}>
                      {selectedTables.has(table.name) && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{table.displayName}</p>
                      <p className="text-xs text-gray-500">{table.rowCount.toLocaleString()} rows</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="pt-4 border-t flex items-center justify-between gap-4 flex-wrap">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{selectedTables.size}</span> of {tables.length} tables selected
            <span className="mx-2">•</span>
            <span className="font-medium">{selectedRows.toLocaleString()}</span> rows to export
          </div>
          <Button 
            onClick={handleExport}
            disabled={isExporting || selectedTables.size === 0}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
            data-testid="button-export-database"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Exporting...
              </>
            ) : (
              <>
                <Download className="w-4 h-4 mr-2" />
                Export Database
              </>
            )}
          </Button>
        </div>

        {exportProgress && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
            {exportProgress}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function DataImportSection() {
  const { toast } = useToast();
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importData, setImportData] = useState<any>(null);
  const [importMode, setImportMode] = useState<"append" | "replace">("append");
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState<string>("");
  const [importResults, setImportResults] = useState<any>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast({
        title: "Invalid file format",
        description: "Please select a JSON file exported from this system",
        variant: "destructive"
      });
      return;
    }

    setImportFile(file);
    setImportResults(null);

    try {
      const text = await file.text();
      const parsed = JSON.parse(text);
      
      if (!parsed.data || typeof parsed.data !== 'object') {
        throw new Error("Invalid export file structure");
      }
      
      setImportData(parsed);
      toast({
        title: "File loaded",
        description: `Found ${Object.keys(parsed.data).length} tables ready for import`
      });
    } catch (err) {
      toast({
        title: "Invalid file",
        description: "Could not parse the import file. Please use a valid export file.",
        variant: "destructive"
      });
      setImportFile(null);
      setImportData(null);
    }
  };

  // Helper to escape SQL values
  const escapeValue = (value: any): string => {
    if (value === null || value === undefined) return "NULL";
    if (typeof value === "number") return String(value);
    if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
    if (typeof value === "object") {
      return `'${JSON.stringify(value).replace(/'/g, "''")}'`;
    }
    return `'${String(value).replace(/'/g, "''")}'`;
  };

  const handleImport = async () => {
    if (!importData) {
      toast({
        title: "No file loaded",
        description: "Please select an import file first",
        variant: "destructive"
      });
      return;
    }

    setIsImporting(true);
    setImportProgress("Starting high-performance bulk import...");
    setImportResults(null);

    try {
      // Step 1: Create tables from schema (parallel batch)
      const schema = importData.schema as Record<string, string> | undefined;
      if (schema && Object.keys(schema).length > 0) {
        const schemaEntries = Object.entries(schema);
        setImportProgress(`Creating ${schemaEntries.length} tables...`);
        
        // Create tables in parallel batches of 5
        const SCHEMA_BATCH = 5;
        for (let i = 0; i < schemaEntries.length; i += SCHEMA_BATCH) {
          const batch = schemaEntries.slice(i, i + SCHEMA_BATCH);
          await Promise.all(batch.map(async ([tableName, createStatement]) => {
            try {
              await fetch("/api/sysctrl/database/execute-sql-import", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ sql: createStatement })
              });
            } catch (err) {
              console.log(`Schema creation for ${tableName} failed:`, err);
            }
          }));
        }
      }

      const tableEntries = Object.entries(importData.data);
      const totalTables = tableEntries.length;
      let completedTables = 0;
      let totalImported = 0;
      let totalSkipped = 0;
      const allTableResults: any[] = [];

      // Process tables in parallel batches of 3 for optimal speed
      const TABLE_BATCH = 3;
      
      for (let t = 0; t < tableEntries.length; t += TABLE_BATCH) {
        const tableBatch = tableEntries.slice(t, t + TABLE_BATCH);
        
        const batchResults = await Promise.all(tableBatch.map(async ([tableName, rows]) => {
          const rowArray = Array.isArray(rows) ? rows : [];
          
          if (rowArray.length === 0) {
            return { table: tableName, imported: 0, skipped: 0, errors: [] };
          }

          try {
            // Use high-performance bulk import endpoint
            const response = await fetch("/api/sysctrl/database/bulk-import", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                tableName,
                rows: rowArray,
                mode: importMode,
                clearTable: importMode === "replace"
              })
            });

            if (response.ok) {
              const result = await response.json();
              return {
                table: tableName,
                imported: result.imported || 0,
                skipped: result.skipped || 0,
                errors: result.errors || []
              };
            } else {
              const err = await response.json();
              return {
                table: tableName,
                imported: 0,
                skipped: rowArray.length,
                errors: [err.message || "Bulk import failed"]
              };
            }
          } catch (err: any) {
            return {
              table: tableName,
              imported: 0,
              skipped: rowArray.length,
              errors: [err.message || "Network error"]
            };
          }
        }));

        // Aggregate results
        for (const result of batchResults) {
          completedTables++;
          totalImported += result.imported;
          totalSkipped += result.skipped;
          allTableResults.push(result);
        }

        setImportProgress(`Imported ${completedTables}/${totalTables} tables (${totalImported} rows)`);
      }

      const finalResult = {
        success: true,
        message: `Import completed: ${totalImported} rows imported, ${totalSkipped} skipped`,
        totalImported,
        totalSkipped,
        tableResults: allTableResults,
        warnings: allTableResults.filter(r => r.errors.length > 0).length > 0 
          ? `${allTableResults.filter(r => r.errors.length > 0).length} tables had errors` 
          : undefined
      };

      setImportResults(finalResult);
      setImportProgress("");
      toast({
        title: "Import completed",
        description: finalResult.message
      });
    } catch (err: any) {
      toast({
        title: "Import failed",
        description: err.message,
        variant: "destructive"
      });
      setImportProgress("");
    } finally {
      setIsImporting(false);
    }
  };

  // For schema-only imports, use schema keys; otherwise use data keys
  const isSchemaOnly = importData?.exportInfo?.schemaOnly === true;
  const tableStats = isSchemaOnly && importData?.schema
    ? Object.keys(importData.schema).map(name => ({ name, rowCount: 0, isSchemaOnly: true }))
    : importData?.data 
      ? Object.entries(importData.data).map(([name, rows]: [string, any]) => ({
          name,
          rowCount: Array.isArray(rows) ? rows.length : 0,
          isSchemaOnly: false
        })) 
      : [];

  const totalRows = tableStats.reduce((sum, t) => sum + t.rowCount, 0);

  return (
    <Card className="bg-white/80 backdrop-blur border-gray-200/50">
      <CardHeader>
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <Upload className="w-5 h-5" />
          Data Import
        </CardTitle>
        <CardDescription>
          Import data from a JSON export file. Only tables that exist in the database will be imported.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-violet-400 transition-colors">
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            className="hidden"
            id="import-file-input"
            data-testid="input-import-file"
          />
          <label htmlFor="import-file-input" className="cursor-pointer">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-700">
              {importFile ? importFile.name : "Click to select import file"}
            </p>
            <p className="text-sm text-gray-500 mt-1">
              {importFile ? `${(importFile.size / 1024).toFixed(1)} KB` : "JSON files exported from this system"}
            </p>
          </label>
        </div>

        {importData && (
          <>
            <div className={`p-4 rounded-lg border ${isSchemaOnly ? 'bg-purple-50 border-purple-200' : 'bg-blue-50 border-blue-200'}`}>
              <div className="flex items-center gap-2 mb-2">
                <FileJson className={`w-5 h-5 ${isSchemaOnly ? 'text-purple-600' : 'text-blue-600'}`} />
                <span className={`font-medium ${isSchemaOnly ? 'text-purple-800' : 'text-blue-800'}`}>
                  File Analysis {isSchemaOnly && <span className="ml-2 px-2 py-0.5 text-xs bg-purple-200 text-purple-700 rounded">Schema Only</span>}
                </span>
              </div>
              <div className="grid grid-cols-3 gap-4 text-sm">
                <div>
                  <p className={isSchemaOnly ? 'text-purple-600' : 'text-blue-600'}>
                    {isSchemaOnly ? 'Tables to Create' : 'Tables'}
                  </p>
                  <p className={`font-bold ${isSchemaOnly ? 'text-purple-800' : 'text-blue-800'}`}>{tableStats.length}</p>
                </div>
                <div>
                  <p className={isSchemaOnly ? 'text-purple-600' : 'text-blue-600'}>
                    {isSchemaOnly ? 'Data Rows' : 'Total Rows'}
                  </p>
                  <p className={`font-bold ${isSchemaOnly ? 'text-purple-800' : 'text-blue-800'}`}>
                    {isSchemaOnly ? 'N/A (Schema Only)' : totalRows.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className={isSchemaOnly ? 'text-purple-600' : 'text-blue-600'}>Export Date</p>
                  <p className={`font-bold ${isSchemaOnly ? 'text-purple-800' : 'text-blue-800'}`}>
                    {importData.exportInfo?.generatedAt 
                      ? new Date(importData.exportInfo.generatedAt).toLocaleDateString() 
                      : "Unknown"}
                  </p>
                </div>
              </div>
              {isSchemaOnly && (
                <p className="mt-3 text-sm text-purple-700">
                  This will create {tableStats.length} empty tables in the database. No data will be imported.
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-base font-medium">Import Mode</Label>
              <div className="grid gap-3 md:grid-cols-2">
                <Card 
                  className={`cursor-pointer transition-all hover-elevate ${importMode === 'append' ? 'ring-2 ring-violet-500 bg-violet-50' : ''}`}
                  onClick={() => setImportMode('append')}
                  data-testid="mode-append"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${importMode === 'append' ? 'bg-violet-500' : 'bg-gray-100'}`}>
                        <Plus className={`w-5 h-5 ${importMode === 'append' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium">Append Data</p>
                        <p className="text-xs text-gray-500">Add new rows, skip duplicates</p>
                      </div>
                      {importMode === 'append' && <CheckCircle className="w-5 h-5 text-violet-500 ml-auto" />}
                    </div>
                  </CardContent>
                </Card>

                <Card 
                  className={`cursor-pointer transition-all hover-elevate ${importMode === 'replace' ? 'ring-2 ring-red-500 bg-red-50' : ''}`}
                  onClick={() => setImportMode('replace')}
                  data-testid="mode-replace"
                >
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${importMode === 'replace' ? 'bg-red-500' : 'bg-gray-100'}`}>
                        <RefreshCw className={`w-5 h-5 ${importMode === 'replace' ? 'text-white' : 'text-gray-600'}`} />
                      </div>
                      <div>
                        <p className="font-medium">Replace Data</p>
                        <p className="text-xs text-gray-500">Clear existing data first</p>
                      </div>
                      {importMode === 'replace' && <CheckCircle className="w-5 h-5 text-red-500 ml-auto" />}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {isSchemaOnly ? `Tables to Create (${tableStats.length})` : `Tables to Import (${tableStats.length})`}
              </Label>
              <div className="max-h-40 overflow-y-auto border rounded-lg p-2 bg-gray-50">
                {tableStats.map(table => (
                  <div key={table.name} className="flex items-center justify-between py-1 px-2 text-sm">
                    <span className="font-medium">{table.name}</span>
                    <Badge variant={isSchemaOnly ? "outline" : "secondary"}>
                      {isSchemaOnly ? "CREATE TABLE" : `${table.rowCount} rows`}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {importMode === 'replace' && importData && (
          <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-sm text-red-700">
            <strong>Warning:</strong> Replace mode will delete all existing data in the selected tables before importing.
          </div>
        )}

        <div className="pt-4 border-t flex items-center justify-between gap-4">
          <Button 
            onClick={handleImport}
            disabled={isImporting || !importData}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
            data-testid="button-import-database"
          >
            {isImporting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Import Data
              </>
            )}
          </Button>
        </div>

        {importProgress && (
          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
            {importProgress}
          </div>
        )}

        {importResults && (
          <div className="p-4 rounded-lg bg-green-50 border border-green-200 space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Import Results</span>
            </div>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-green-600">Rows Imported</p>
                <p className="font-bold text-green-800">{importResults.totalImported}</p>
              </div>
              <div>
                <p className="text-green-600">Rows Skipped</p>
                <p className="font-bold text-green-800">{importResults.totalSkipped}</p>
              </div>
            </div>
            {importResults.warnings && (
              <p className="text-sm text-amber-700">{importResults.warnings}</p>
            )}
            {importResults.tableResults && importResults.tableResults.filter((t: any) => t.errors.length > 0).length > 0 && (
              <div className="mt-3 max-h-48 overflow-y-auto space-y-1">
                <p className="text-xs font-medium text-gray-600 mb-2">Tables with errors:</p>
                {importResults.tableResults.filter((t: any) => t.errors.length > 0).map((t: any) => (
                  <div key={t.table} className="text-xs p-2 bg-red-50 rounded border border-red-200">
                    <span className="font-medium text-red-800">{t.table}:</span>{" "}
                    <span className="text-red-600">{t.errors[0]}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface PaymentSettingsData {
  id?: number;
  environmentMode: string;
  razorpayEnabled: boolean;
  razorpayKeyId: string;
  razorpayKeySecret: string;
  razorpayWebhookSecret: string;
  stripeEnabled: boolean;
  stripeSecretKey: string;
  stripePublishableKey: string;
  stripeWebhookSecret: string;
  defaultCountry: string;
  taxEnabled: boolean;
  taxName: string;
  taxRate: number;
  taxApplyIndiaOnly: boolean;
  businessName: string;
  gstin: string;
  businessAddress: string;
  businessStateCode: string;
  businessCity: string;
  businessPincode: string;
  autoGenerateInvoice: boolean;
  invoicePrefix: string;
  invoiceStartNumber: number;
  showTaxBreakdown: boolean;
  invoiceFooterNotes: string;
  invoiceLogoUrl: string;
  invoiceShowLogo: boolean;
  invoicePrimaryColor: string;
  invoiceSecondaryColor: string;
  invoiceAccentColor: string;
  invoiceCompanyTagline: string;
  invoiceTermsAndConditions: string;
  invoiceShowPaymentDetails: boolean;
  invoiceShowQRCode: boolean;
  invoiceLayout: string;
  invoiceDateFormat: string;
  invoiceCurrencyPosition: string;
  allowRetryOnFailure: boolean;
  maxRetryAttempts: number;
  autoUnlockExamAfterPayment: boolean;
}

const INDIAN_STATES = [
  { code: "01", name: "Jammu & Kashmir" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "03", name: "Punjab" },
  { code: "04", name: "Chandigarh" },
  { code: "05", name: "Uttarakhand" },
  { code: "06", name: "Haryana" },
  { code: "07", name: "Delhi" },
  { code: "08", name: "Rajasthan" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "10", name: "Bihar" },
  { code: "11", name: "Sikkim" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "13", name: "Nagaland" },
  { code: "14", name: "Manipur" },
  { code: "15", name: "Mizoram" },
  { code: "16", name: "Tripura" },
  { code: "17", name: "Meghalaya" },
  { code: "18", name: "Assam" },
  { code: "19", name: "West Bengal" },
  { code: "20", name: "Jharkhand" },
  { code: "21", name: "Odisha" },
  { code: "22", name: "Chhattisgarh" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "24", name: "Gujarat" },
  { code: "26", name: "Dadra & Nagar Haveli and Daman & Diu" },
  { code: "27", name: "Maharashtra" },
  { code: "29", name: "Karnataka" },
  { code: "30", name: "Goa" },
  { code: "31", name: "Lakshadweep" },
  { code: "32", name: "Kerala" },
  { code: "33", name: "Tamil Nadu" },
  { code: "34", name: "Puducherry" },
  { code: "35", name: "Andaman & Nicobar Islands" },
  { code: "36", name: "Telangana" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "38", name: "Ladakh" },
];

function PaymentsAndTaxSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("environment");
  const [showSecrets, setShowSecrets] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showInvoicePreview, setShowInvoicePreview] = useState(false);
  
  const [settings, setSettings] = useState<PaymentSettingsData>({
    environmentMode: "test",
    razorpayEnabled: false,
    razorpayKeyId: "",
    razorpayKeySecret: "",
    razorpayWebhookSecret: "",
    stripeEnabled: false,
    stripeSecretKey: "",
    stripePublishableKey: "",
    stripeWebhookSecret: "",
    defaultCountry: "IN",
    taxEnabled: true,
    taxName: "GST",
    taxRate: 18,
    taxApplyIndiaOnly: true,
    businessName: "",
    gstin: "",
    businessAddress: "",
    businessStateCode: "",
    businessCity: "",
    businessPincode: "",
    autoGenerateInvoice: true,
    invoicePrefix: "INV",
    invoiceStartNumber: 1000,
    showTaxBreakdown: true,
    invoiceFooterNotes: "",
    invoiceLogoUrl: "",
    invoiceShowLogo: true,
    invoicePrimaryColor: "#8A2BE2",
    invoiceSecondaryColor: "#333333",
    invoiceAccentColor: "#FF2FBF",
    invoiceCompanyTagline: "",
    invoiceTermsAndConditions: "",
    invoiceShowPaymentDetails: true,
    invoiceShowQRCode: false,
    invoiceLayout: "classic",
    invoiceDateFormat: "DD/MM/YYYY",
    invoiceCurrencyPosition: "before",
    allowRetryOnFailure: true,
    maxRetryAttempts: 3,
    autoUnlockExamAfterPayment: true,
  });

  const { data: savedSettings, isLoading } = useQuery<PaymentSettingsData | null>({
    queryKey: ["/api/sysctrl/payment-settings/full"],
  });

  useEffect(() => {
    if (savedSettings) {
      setSettings({
        ...settings,
        ...savedSettings,
        razorpayKeyId: savedSettings.razorpayKeyId || "",
        razorpayKeySecret: savedSettings.razorpayKeySecret || "",
        razorpayWebhookSecret: savedSettings.razorpayWebhookSecret || "",
        stripeSecretKey: savedSettings.stripeSecretKey || "",
        stripePublishableKey: savedSettings.stripePublishableKey || "",
        stripeWebhookSecret: savedSettings.stripeWebhookSecret || "",
        businessName: savedSettings.businessName || "",
        gstin: savedSettings.gstin || "",
        businessAddress: savedSettings.businessAddress || "",
        businessStateCode: savedSettings.businessStateCode || "",
        businessCity: savedSettings.businessCity || "",
        businessPincode: savedSettings.businessPincode || "",
        invoiceFooterNotes: savedSettings.invoiceFooterNotes || "",
      });
    }
  }, [savedSettings]);

  const toggleSecret = (key: string) => {
    setShowSecrets(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await apiRequest("POST", "/api/sysctrl/payment-settings", settings);
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/payment-settings"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/payment-settings/full"] });
      toast({
        title: "Settings saved",
        description: "Payment and tax settings have been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Failed to save",
        description: "Could not save payment settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  const tabs = [
    { id: "environment", label: "Environment", icon: Settings },
    { id: "gateways", label: "Payment Gateways", icon: CreditCard },
    { id: "tax", label: "Tax Configuration", icon: Receipt },
    { id: "business", label: "Business Identity", icon: Building2 },
    { id: "invoice", label: "Invoice Settings", icon: FileText },
    { id: "ux", label: "Payment UX", icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payments & Tax Configuration</h2>
          <p className="text-muted-foreground">Configure payment gateways, tax rules, and invoice settings</p>
        </div>
        <Button onClick={handleSave} disabled={isSaving} data-testid="button-save-payment-settings">
          {isSaving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
          Save All Settings
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-6 w-full">
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-2" data-testid={`tab-${tab.id}`}>
              <tab.icon className="h-4 w-4" />
              <span className="hidden sm:inline">{tab.label}</span>
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="environment" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Environment Mode
              </CardTitle>
              <CardDescription>
                Control whether payments use test or live credentials
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 rounded-lg border">
                <div className="space-y-1">
                  <Label className="text-base font-medium">Payment Environment</Label>
                  <p className="text-sm text-muted-foreground">
                    {settings.environmentMode === "test" 
                      ? "Test mode: No real money will be charged. Use test cards only."
                      : "Live mode: Real payments will be processed. Use with caution."}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Badge 
                    variant={settings.environmentMode === "test" ? "secondary" : "destructive"}
                    className="text-sm"
                  >
                    {settings.environmentMode === "test" ? "TEST MODE" : "LIVE MODE"}
                  </Badge>
                  <Select
                    value={settings.environmentMode}
                    onValueChange={(value) => setSettings({ ...settings, environmentMode: value })}
                  >
                    <SelectTrigger className="w-32" data-testid="select-environment-mode">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="test">Test</SelectItem>
                      <SelectItem value="live">Live</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              
              {settings.environmentMode === "live" && (
                <div className="flex items-center gap-2 p-4 rounded-lg bg-destructive/10 border border-destructive/20">
                  <AlertCircle className="h-5 w-5 text-destructive" />
                  <p className="text-sm text-destructive">
                    Live mode is enabled. Real payments will be processed. Make sure all gateway credentials are correct.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="gateways" className="mt-6 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <IndianRupee className="h-5 w-5" />
                Razorpay (India)
              </CardTitle>
              <CardDescription>
                Primary payment gateway for Indian students (INR payments)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="razorpay-enabled">Enable Razorpay</Label>
                <Switch
                  id="razorpay-enabled"
                  checked={settings.razorpayEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, razorpayEnabled: checked })}
                  data-testid="switch-razorpay-enabled"
                />
              </div>
              
              {settings.razorpayEnabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Razorpay Key ID</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.razorpayKeyId ? "text" : "password"}
                        value={settings.razorpayKeyId}
                        onChange={(e) => setSettings({ ...settings, razorpayKeyId: e.target.value })}
                        placeholder="rzp_test_xxxxxxxxxxxx"
                        data-testid="input-razorpay-key-id"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleSecret("razorpayKeyId")}
                      >
                        {showSecrets.razorpayKeyId ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Razorpay Key Secret</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.razorpayKeySecret ? "text" : "password"}
                        value={settings.razorpayKeySecret}
                        onChange={(e) => setSettings({ ...settings, razorpayKeySecret: e.target.value })}
                        placeholder="Enter Razorpay secret key"
                        data-testid="input-razorpay-key-secret"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleSecret("razorpayKeySecret")}
                      >
                        {showSecrets.razorpayKeySecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Razorpay Webhook Secret</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.razorpayWebhookSecret ? "text" : "password"}
                        value={settings.razorpayWebhookSecret}
                        onChange={(e) => setSettings({ ...settings, razorpayWebhookSecret: e.target.value })}
                        placeholder="Enter webhook secret for signature verification"
                        data-testid="input-razorpay-webhook-secret"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleSecret("razorpayWebhookSecret")}
                      >
                        {showSecrets.razorpayWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Stripe (International)
              </CardTitle>
              <CardDescription>
                Payment gateway for international students (USD and other currencies)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="stripe-enabled">Enable Stripe</Label>
                <Switch
                  id="stripe-enabled"
                  checked={settings.stripeEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, stripeEnabled: checked })}
                  data-testid="switch-stripe-enabled"
                />
              </div>
              
              {settings.stripeEnabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="space-y-2">
                    <Label>Stripe Publishable Key</Label>
                    <Input
                      value={settings.stripePublishableKey}
                      onChange={(e) => setSettings({ ...settings, stripePublishableKey: e.target.value })}
                      placeholder="pk_test_xxxxxxxxxxxx"
                      data-testid="input-stripe-publishable-key"
                    />
                    <p className="text-xs text-muted-foreground">This key is safe to expose to the frontend</p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Stripe Secret Key</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.stripeSecretKey ? "text" : "password"}
                        value={settings.stripeSecretKey}
                        onChange={(e) => setSettings({ ...settings, stripeSecretKey: e.target.value })}
                        placeholder="sk_test_xxxxxxxxxxxx"
                        data-testid="input-stripe-secret-key"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleSecret("stripeSecretKey")}
                      >
                        {showSecrets.stripeSecretKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Stripe Webhook Secret</Label>
                    <div className="flex gap-2">
                      <Input
                        type={showSecrets.stripeWebhookSecret ? "text" : "password"}
                        value={settings.stripeWebhookSecret}
                        onChange={(e) => setSettings({ ...settings, stripeWebhookSecret: e.target.value })}
                        placeholder="whsec_xxxxxxxxxxxx"
                        data-testid="input-stripe-webhook-secret"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={() => toggleSecret("stripeWebhookSecret")}
                      >
                        {showSecrets.stripeWebhookSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Smart Routing Rules</CardTitle>
              <CardDescription>
                Automatic gateway selection based on student's country
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Routing Logic (Automatic)</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>If student country = India → Razorpay (INR)</li>
                  <li>If student country = Other → Stripe (USD)</li>
                </ul>
              </div>
              <div className="space-y-2">
                <Label>Default Country</Label>
                <Select
                  value={settings.defaultCountry}
                  onValueChange={(value) => setSettings({ ...settings, defaultCountry: value })}
                >
                  <SelectTrigger data-testid="select-default-country">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="IN">India</SelectItem>
                    <SelectItem value="US">United States</SelectItem>
                    <SelectItem value="GB">United Kingdom</SelectItem>
                    <SelectItem value="OTHER">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tax" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5" />
                Tax Configuration
              </CardTitle>
              <CardDescription>
                Configure GST and tax rules for payments
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label htmlFor="tax-enabled">Enable Tax</Label>
                  <p className="text-sm text-muted-foreground">Apply tax to payments</p>
                </div>
                <Switch
                  id="tax-enabled"
                  checked={settings.taxEnabled}
                  onCheckedChange={(checked) => setSettings({ ...settings, taxEnabled: checked })}
                  data-testid="switch-tax-enabled"
                />
              </div>

              {settings.taxEnabled && (
                <div className="space-y-4 pt-4 border-t">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Tax Name</Label>
                      <Input
                        value={settings.taxName}
                        onChange={(e) => setSettings({ ...settings, taxName: e.target.value })}
                        placeholder="GST"
                        data-testid="input-tax-name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Tax Rate (%)</Label>
                      <Input
                        type="number"
                        value={settings.taxRate}
                        onChange={(e) => setSettings({ ...settings, taxRate: Number(e.target.value) })}
                        placeholder="18"
                        data-testid="input-tax-rate"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Apply Tax Only for India</Label>
                      <p className="text-sm text-muted-foreground">
                        International payments are treated as "Export of Service" (0% tax)
                      </p>
                    </div>
                    <Switch
                      checked={settings.taxApplyIndiaOnly}
                      onCheckedChange={(checked) => setSettings({ ...settings, taxApplyIndiaOnly: checked })}
                      data-testid="switch-tax-india-only"
                    />
                  </div>

                  <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                    <p className="text-sm font-medium">Tax Calculation Rules</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>Total = Base Amount + (Base Amount × {settings.taxRate}%)</li>
                      <li>India (Intra-state): CGST = {settings.taxRate/2}% + SGST = {settings.taxRate/2}%</li>
                      <li>India (Inter-state): IGST = {settings.taxRate}%</li>
                      <li>International: Export of Service (0% tax)</li>
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="business" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Business Identity
              </CardTitle>
              <CardDescription>
                Your business details for invoices and tax compliance
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Legal Business Name</Label>
                  <Input
                    value={settings.businessName}
                    onChange={(e) => setSettings({ ...settings, businessName: e.target.value })}
                    placeholder="Your Company Pvt. Ltd."
                    data-testid="input-business-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label>GSTIN / Tax ID</Label>
                  <Input
                    value={settings.gstin}
                    onChange={(e) => setSettings({ ...settings, gstin: e.target.value })}
                    placeholder="22AAAAA0000A1Z5"
                    data-testid="input-gstin"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Registered Address</Label>
                <Textarea
                  value={settings.businessAddress}
                  onChange={(e) => setSettings({ ...settings, businessAddress: e.target.value })}
                  placeholder="Enter your registered business address"
                  rows={2}
                  data-testid="input-business-address"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>State (for GST)</Label>
                  <Select
                    value={settings.businessStateCode}
                    onValueChange={(value) => setSettings({ ...settings, businessStateCode: value })}
                  >
                    <SelectTrigger data-testid="select-business-state">
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDIAN_STATES.map(state => (
                        <SelectItem key={state.code} value={state.code}>
                          {state.name} ({state.code})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>City</Label>
                  <Input
                    value={settings.businessCity}
                    onChange={(e) => setSettings({ ...settings, businessCity: e.target.value })}
                    placeholder="Mumbai"
                    data-testid="input-business-city"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input
                    value={settings.businessPincode}
                    onChange={(e) => setSettings({ ...settings, businessPincode: e.target.value })}
                    placeholder="400001"
                    data-testid="input-business-pincode"
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="invoice" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Invoice Settings
              </CardTitle>
              <CardDescription>
                Configure automatic invoice generation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto Generate Invoice</Label>
                  <p className="text-sm text-muted-foreground">Automatically generate invoice after successful payment</p>
                </div>
                <Switch
                  checked={settings.autoGenerateInvoice}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoGenerateInvoice: checked })}
                  data-testid="switch-auto-generate-invoice"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Invoice Prefix</Label>
                  <Input
                    value={settings.invoicePrefix}
                    onChange={(e) => setSettings({ ...settings, invoicePrefix: e.target.value })}
                    placeholder="INV"
                    data-testid="input-invoice-prefix"
                  />
                  <p className="text-xs text-muted-foreground">
                    Example: {settings.invoicePrefix}-2026-001234
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Starting Number</Label>
                  <Input
                    type="number"
                    value={settings.invoiceStartNumber}
                    onChange={(e) => setSettings({ ...settings, invoiceStartNumber: Number(e.target.value) })}
                    placeholder="1000"
                    data-testid="input-invoice-start-number"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Show Tax Breakdown</Label>
                  <p className="text-sm text-muted-foreground">Display CGST/SGST/IGST separately on invoice</p>
                </div>
                <Switch
                  checked={settings.showTaxBreakdown}
                  onCheckedChange={(checked) => setSettings({ ...settings, showTaxBreakdown: checked })}
                  data-testid="switch-show-tax-breakdown"
                />
              </div>

              <div className="space-y-2">
                <Label>Invoice Footer Notes</Label>
                <Textarea
                  value={settings.invoiceFooterNotes}
                  onChange={(e) => setSettings({ ...settings, invoiceFooterNotes: e.target.value })}
                  placeholder="Thank you for your payment. For queries, contact support@example.com"
                  rows={3}
                  data-testid="input-invoice-footer-notes"
                />
              </div>
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="h-5 w-5" />
                    Invoice Template Design
                  </CardTitle>
                  <CardDescription>
                    Customize the look and feel of your invoices
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  onClick={() => setShowInvoicePreview(true)}
                  data-testid="button-preview-invoice"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Preview Invoice
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label>Layout Style</Label>
                  <Select
                    value={settings.invoiceLayout || "classic"}
                    onValueChange={(value) => setSettings({ ...settings, invoiceLayout: value })}
                  >
                    <SelectTrigger data-testid="select-invoice-layout">
                      <SelectValue placeholder="Select layout" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="classic">Classic</SelectItem>
                      <SelectItem value="modern">Modern</SelectItem>
                      <SelectItem value="minimal">Minimal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Date Format</Label>
                  <Select
                    value={settings.invoiceDateFormat || "DD/MM/YYYY"}
                    onValueChange={(value) => setSettings({ ...settings, invoiceDateFormat: value })}
                  >
                    <SelectTrigger data-testid="select-date-format">
                      <SelectValue placeholder="Select format" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                      <SelectItem value="DD MMM YYYY">DD MMM YYYY</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency Position</Label>
                  <Select
                    value={settings.invoiceCurrencyPosition || "before"}
                    onValueChange={(value) => setSettings({ ...settings, invoiceCurrencyPosition: value })}
                  >
                    <SelectTrigger data-testid="select-currency-position">
                      <SelectValue placeholder="Select position" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="before">Before (₹100)</SelectItem>
                      <SelectItem value="after">After (100₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Brand Colors</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label>Primary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={settings.invoicePrimaryColor || "#8A2BE2"}
                        onChange={(e) => setSettings({ ...settings, invoicePrimaryColor: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                        data-testid="input-primary-color"
                      />
                      <Input
                        value={settings.invoicePrimaryColor || "#8A2BE2"}
                        onChange={(e) => setSettings({ ...settings, invoicePrimaryColor: e.target.value })}
                        placeholder="#8A2BE2"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Secondary Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={settings.invoiceSecondaryColor || "#333333"}
                        onChange={(e) => setSettings({ ...settings, invoiceSecondaryColor: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                        data-testid="input-secondary-color"
                      />
                      <Input
                        value={settings.invoiceSecondaryColor || "#333333"}
                        onChange={(e) => setSettings({ ...settings, invoiceSecondaryColor: e.target.value })}
                        placeholder="#333333"
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Accent Color</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="color"
                        value={settings.invoiceAccentColor || "#FF2FBF"}
                        onChange={(e) => setSettings({ ...settings, invoiceAccentColor: e.target.value })}
                        className="w-12 h-10 p-1 cursor-pointer"
                        data-testid="input-accent-color"
                      />
                      <Input
                        value={settings.invoiceAccentColor || "#FF2FBF"}
                        onChange={(e) => setSettings({ ...settings, invoiceAccentColor: e.target.value })}
                        placeholder="#FF2FBF"
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Logo & Branding</h4>
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label>Show Logo on Invoice</Label>
                    <p className="text-sm text-muted-foreground">Display your company logo at the top of invoices</p>
                  </div>
                  <Switch
                    checked={settings.invoiceShowLogo !== false}
                    onCheckedChange={(checked) => setSettings({ ...settings, invoiceShowLogo: checked })}
                    data-testid="switch-show-logo"
                  />
                </div>

                {settings.invoiceShowLogo !== false && (
                  <div className="space-y-2">
                    <Label>Logo URL</Label>
                    <Input
                      value={settings.invoiceLogoUrl || ""}
                      onChange={(e) => setSettings({ ...settings, invoiceLogoUrl: e.target.value })}
                      placeholder="https://example.com/logo.png"
                      data-testid="input-logo-url"
                    />
                    <p className="text-xs text-muted-foreground">
                      Recommended: PNG or SVG, max 200x100px
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Company Tagline</Label>
                  <Input
                    value={settings.invoiceCompanyTagline || ""}
                    onChange={(e) => setSettings({ ...settings, invoiceCompanyTagline: e.target.value })}
                    placeholder="Empowering Students Worldwide"
                    data-testid="input-company-tagline"
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <h4 className="font-medium">Content Options</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Show Payment Details</Label>
                      <p className="text-sm text-muted-foreground">Display gateway and transaction info</p>
                    </div>
                    <Switch
                      checked={settings.invoiceShowPaymentDetails !== false}
                      onCheckedChange={(checked) => setSettings({ ...settings, invoiceShowPaymentDetails: checked })}
                      data-testid="switch-show-payment-details"
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <Label>Show QR Code</Label>
                      <p className="text-sm text-muted-foreground">Add a QR code linking to payment verification</p>
                    </div>
                    <Switch
                      checked={settings.invoiceShowQRCode === true}
                      onCheckedChange={(checked) => setSettings({ ...settings, invoiceShowQRCode: checked })}
                      data-testid="switch-show-qr-code"
                    />
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Terms & Conditions</Label>
                <Textarea
                  value={settings.invoiceTermsAndConditions || ""}
                  onChange={(e) => setSettings({ ...settings, invoiceTermsAndConditions: e.target.value })}
                  placeholder="All payments are non-refundable unless otherwise stated in our refund policy..."
                  rows={4}
                  data-testid="input-terms-conditions"
                />
                <p className="text-xs text-muted-foreground">
                  This will appear at the bottom of the invoice
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Invoice Preview Dialog */}
          <Dialog open={showInvoicePreview} onOpenChange={setShowInvoicePreview}>
            <DialogContent className="max-w-4xl">
              <DialogHeader className="flex-shrink-0">
                <DialogTitle>Invoice Preview</DialogTitle>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div 
                className="border rounded-lg p-6 bg-white relative overflow-hidden"
                style={{ 
                  fontFamily: 'Arial, sans-serif',
                  color: '#333'
                }}
              >
                {/* Watermark Logo */}
                <div 
                  className="absolute inset-0 flex items-center justify-center pointer-events-none"
                  style={{ zIndex: 0 }}
                >
                  {settings.invoiceLogoUrl ? (
                    <img 
                      src={settings.invoiceLogoUrl} 
                      alt="Watermark" 
                      className="w-64 h-64 object-contain"
                      style={{ opacity: 0.06 }}
                    />
                  ) : (
                    <div 
                      className="text-center select-none"
                      style={{ 
                        opacity: 0.06,
                        color: settings.invoicePrimaryColor || "#8A2BE2"
                      }}
                    >
                      <div className="text-8xl font-bold tracking-wider">SAMIKARAN.</div>
                      <div className="text-4xl font-light">Olympiad</div>
                    </div>
                  )}
                </div>

                {/* Invoice Content */}
                <div className="relative" style={{ zIndex: 1 }}>
                {/* Invoice Header */}
                {settings.invoiceLayout === "modern" ? (
                  <div className="text-center mb-8 pb-6 border-b-4" style={{ borderColor: settings.invoicePrimaryColor || "#8A2BE2" }}>
                    {settings.invoiceShowLogo !== false && (
                      <div className="mb-4">
                        {settings.invoiceLogoUrl ? (
                          <img src={settings.invoiceLogoUrl} alt="Company Logo" className="h-16 mx-auto" />
                        ) : (
                          <div className="text-3xl font-bold" style={{ color: settings.invoicePrimaryColor || "#8A2BE2" }}>
                            SAMIKARAN.
                            <span className="block text-lg font-normal">Olympiad</span>
                          </div>
                        )}
                      </div>
                    )}
                    {settings.invoiceCompanyTagline && (
                      <p className="text-sm text-gray-500 italic">{settings.invoiceCompanyTagline}</p>
                    )}
                    <h1 className="text-2xl font-bold mt-4" style={{ color: settings.invoiceSecondaryColor || "#333333" }}>
                      TAX INVOICE
                    </h1>
                  </div>
                ) : settings.invoiceLayout === "minimal" ? (
                  <div className="flex justify-between items-start mb-6 pb-4 border-b">
                    <div>
                      {settings.invoiceShowLogo !== false && (
                        settings.invoiceLogoUrl ? (
                          <img src={settings.invoiceLogoUrl} alt="Company Logo" className="h-10" />
                        ) : (
                          <div className="text-xl font-bold" style={{ color: settings.invoicePrimaryColor || "#8A2BE2" }}>
                            SAMIKARAN.
                          </div>
                        )
                      )}
                    </div>
                    <div className="text-right">
                      <h1 className="text-lg font-semibold">INVOICE</h1>
                      <p className="text-sm text-gray-500">#{settings.invoicePrefix || "INV"}-2024-0001</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex justify-between items-start mb-8">
                    <div className="flex items-center gap-4">
                      {settings.invoiceShowLogo !== false && (
                        settings.invoiceLogoUrl ? (
                          <img src={settings.invoiceLogoUrl} alt="Company Logo" className="h-16" />
                        ) : (
                          <div 
                            className="w-16 h-16 rounded-lg flex items-center justify-center text-white font-bold text-2xl"
                            style={{ background: `linear-gradient(135deg, ${settings.invoicePrimaryColor || "#8A2BE2"}, ${settings.invoiceAccentColor || "#FF2FBF"})` }}
                          >
                            S
                          </div>
                        )
                      )}
                      <div>
                        <h2 className="text-xl font-bold" style={{ color: settings.invoicePrimaryColor || "#8A2BE2" }}>
                          {settings.businessName || "Samikaran Olympiad"}
                        </h2>
                        {settings.invoiceCompanyTagline && (
                          <p className="text-sm text-gray-500">{settings.invoiceCompanyTagline}</p>
                        )}
                      </div>
                    </div>
                    <div 
                      className="px-6 py-3 rounded-lg text-white font-bold text-lg"
                      style={{ backgroundColor: settings.invoicePrimaryColor || "#8A2BE2" }}
                    >
                      TAX INVOICE
                    </div>
                  </div>
                )}

                {/* Invoice Details */}
                <div className="grid grid-cols-2 gap-8 mb-8">
                  <div>
                    <h3 className="font-semibold mb-2" style={{ color: settings.invoiceSecondaryColor || "#333333" }}>Bill To:</h3>
                    <p className="font-medium">Sample Student</p>
                    <p className="text-sm text-gray-600">student@example.com</p>
                    <p className="text-sm text-gray-600">123 Sample Street</p>
                    <p className="text-sm text-gray-600">City, State 000000</p>
                  </div>
                  <div className="text-right">
                    <div className="space-y-1">
                      <p><span className="text-gray-500">Invoice No:</span> <span className="font-medium">{settings.invoicePrefix || "INV"}-2024-0001</span></p>
                      <p><span className="text-gray-500">Date:</span> <span className="font-medium">
                        {settings.invoiceDateFormat === "MM/DD/YYYY" ? "01/23/2024" :
                         settings.invoiceDateFormat === "YYYY-MM-DD" ? "2024-01-23" :
                         settings.invoiceDateFormat === "DD MMM YYYY" ? "23 Jan 2024" :
                         "23/01/2024"}
                      </span></p>
                      <p><span className="text-gray-500">Status:</span> <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full font-medium">PAID</span></p>
                    </div>
                  </div>
                </div>

                {/* Items Table */}
                <div className="mb-8">
                  <table className="w-full">
                    <thead>
                      <tr style={{ backgroundColor: settings.invoicePrimaryColor || "#8A2BE2" }} className="text-white">
                        <th className="text-left py-3 px-4 rounded-l-lg">Description</th>
                        <th className="text-center py-3 px-4">Qty</th>
                        <th className="text-right py-3 px-4">Rate</th>
                        <th className="text-right py-3 px-4 rounded-r-lg">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr className="border-b">
                        <td className="py-4 px-4">
                          <p className="font-medium">Math Olympiad 2024</p>
                          <p className="text-sm text-gray-500">Standard Tier Registration</p>
                        </td>
                        <td className="text-center py-4 px-4">1</td>
                        <td className="text-right py-4 px-4">
                          {settings.invoiceCurrencyPosition === "after" ? "500.00₹" : "₹500.00"}
                        </td>
                        <td className="text-right py-4 px-4 font-medium">
                          {settings.invoiceCurrencyPosition === "after" ? "500.00₹" : "₹500.00"}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-72">
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">Subtotal</span>
                      <span className="font-medium">{settings.invoiceCurrencyPosition === "after" ? "500.00₹" : "₹500.00"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">CGST (9%)</span>
                      <span>{settings.invoiceCurrencyPosition === "after" ? "45.00₹" : "₹45.00"}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b">
                      <span className="text-gray-600">SGST (9%)</span>
                      <span>{settings.invoiceCurrencyPosition === "after" ? "45.00₹" : "₹45.00"}</span>
                    </div>
                    <div 
                      className="flex justify-between py-3 mt-2 rounded-lg px-3 text-white font-bold"
                      style={{ backgroundColor: settings.invoicePrimaryColor || "#8A2BE2" }}
                    >
                      <span>Total</span>
                      <span>{settings.invoiceCurrencyPosition === "after" ? "590.00₹" : "₹590.00"}</span>
                    </div>
                  </div>
                </div>

                {/* Payment Details */}
                {settings.invoiceShowPaymentDetails !== false && (
                  <div className="bg-gray-50 rounded-lg p-4 mb-6">
                    <h4 className="font-semibold mb-2" style={{ color: settings.invoiceSecondaryColor || "#333333" }}>Payment Details</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Payment Gateway:</span>
                        <span className="ml-2 font-medium">Razorpay</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Transaction ID:</span>
                        <span className="ml-2 font-medium">pay_SAMPLE123456</span>
                      </div>
                      <div>
                        <span className="text-gray-500">Payment Date:</span>
                        <span className="ml-2 font-medium">
                          {settings.invoiceDateFormat === "MM/DD/YYYY" ? "01/23/2024" :
                           settings.invoiceDateFormat === "YYYY-MM-DD" ? "2024-01-23" :
                           settings.invoiceDateFormat === "DD MMM YYYY" ? "23 Jan 2024" :
                           "23/01/2024"}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Payment Method:</span>
                        <span className="ml-2 font-medium">UPI</span>
                      </div>
                    </div>
                  </div>
                )}

                {/* QR Code Placeholder */}
                {settings.invoiceShowQRCode && (
                  <div className="flex justify-center mb-6">
                    <div className="text-center">
                      <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center mb-2">
                        <span className="text-xs text-gray-500">QR Code</span>
                      </div>
                      <p className="text-xs text-gray-500">Scan to verify payment</p>
                    </div>
                  </div>
                )}

                {/* Terms & Conditions */}
                {settings.invoiceTermsAndConditions && (
                  <div className="border-t pt-4 mt-6">
                    <h4 className="font-semibold text-sm mb-2" style={{ color: settings.invoiceSecondaryColor || "#333333" }}>Terms & Conditions</h4>
                    <p className="text-xs text-gray-500 whitespace-pre-wrap">{settings.invoiceTermsAndConditions}</p>
                  </div>
                )}

                {/* Footer */}
                <div className="text-center mt-8 pt-4 border-t">
                  <p className="text-sm text-gray-500">
                    Thank you for choosing {settings.businessName || "Samikaran Olympiad"}!
                  </p>
                  {settings.invoiceFooterNotes && (
                    <p className="text-xs text-gray-400 mt-2">{settings.invoiceFooterNotes}</p>
                  )}
                </div>
                </div>
              </div>
              </div>
              <DialogFooter className="flex-shrink-0">
                <Button variant="outline" onClick={() => setShowInvoicePreview(false)}>
                  Close
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </TabsContent>

        <TabsContent value="ux" className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                Payment UX Rules
              </CardTitle>
              <CardDescription>
                Control payment retry behavior and exam unlock automation
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Allow Retry on Failure</Label>
                  <p className="text-sm text-muted-foreground">Let students retry failed payments</p>
                </div>
                <Switch
                  checked={settings.allowRetryOnFailure}
                  onCheckedChange={(checked) => setSettings({ ...settings, allowRetryOnFailure: checked })}
                  data-testid="switch-allow-retry"
                />
              </div>

              {settings.allowRetryOnFailure && (
                <div className="space-y-2">
                  <Label>Max Retry Attempts</Label>
                  <Input
                    type="number"
                    value={settings.maxRetryAttempts}
                    onChange={(e) => setSettings({ ...settings, maxRetryAttempts: Number(e.target.value) })}
                    min={1}
                    max={10}
                    data-testid="input-max-retry-attempts"
                  />
                </div>
              )}

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label>Auto Unlock Exam After Payment</Label>
                  <p className="text-sm text-muted-foreground">
                    Automatically grant exam access after successful payment
                  </p>
                </div>
                <Switch
                  checked={settings.autoUnlockExamAfterPayment}
                  onCheckedChange={(checked) => setSettings({ ...settings, autoUnlockExamAfterPayment: checked })}
                  data-testid="switch-auto-unlock-exam"
                />
              </div>

              <div className="p-4 rounded-lg bg-muted/50 space-y-2">
                <p className="text-sm font-medium">Payment Failure Handling</p>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>Failed payments keep exam registration locked</li>
                  <li>Clear error messages shown to students</li>
                  <li>Retry uses the same registration (no duplicates)</li>
                  <li>Webhooks ensure payment verification is server-side only</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

export function GlobalSettings() {
  const { toast } = useToast();
  const [activeSection, setActiveSection] = useState<SettingsSubSection>("meta");
  const [showTemplateDialog, setShowTemplateDialog] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<any>(null);
  
  // OTP Verification State - uses shared Platform Control session key
  const [otpVerified, setOtpVerified] = useState(() => {
    return sessionStorage.getItem("platformControlOtpVerified") === "true";
  });
  const [otpValue, setOtpValue] = useState("");
  const [otpError, setOtpError] = useState("");
  const [sendingOtp, setSendingOtp] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSmtpKey, setShowSmtpKey] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  
  const handleSendOtp = async () => {
    setSendingOtp(true);
    setOtpError("");
    try {
      await apiRequest("POST", "/sysctrl/api/platform-otp/send");
      setOtpSent(true);
      toast({ title: "OTP Sent", description: "A verification code has been sent to the super admin's registered email." });
    } catch (error: any) {
      setOtpError(error.message || "Failed to send OTP. Please try again.");
    } finally {
      setSendingOtp(false);
    }
  };
  
  const handleVerifyOtp = async () => {
    setOtpError("");
    try {
      await apiRequest("POST", "/sysctrl/api/platform-otp/verify", { otp: otpValue });
      setOtpVerified(true);
      sessionStorage.setItem("platformControlOtpVerified", "true");
      toast({ title: "Verified", description: "OTP verified successfully. You can now access Global Settings." });
    } catch (error: any) {
      setOtpError(error.message || "Invalid OTP. Please try again.");
    }
  };

  const { data: settings = [] } = useQuery<SiteSetting[]>({
    queryKey: ["/api/sysctrl/settings"],
  });

  const { data: emailTemplates = [] } = useQuery<EmailTemplate[]>({
    queryKey: ["/api/sysctrl/email-templates"],
  });

  const { data: smsTemplates = [] } = useQuery<SmsTemplate[]>({
    queryKey: ["/api/sysctrl/sms-templates"],
  });

  const { data: pushTemplates = [] } = useQuery<PushTemplate[]>({
    queryKey: ["/api/sysctrl/push-templates"],
  });

  const { data: languages = [] } = useQuery<Language[]>({
    queryKey: ["/api/sysctrl/languages"],
  });

  const { data: aiProviders = [], refetch: refetchAiProviders } = useQuery<AiProvider[]>({
    queryKey: ["/api/sysctrl/ai-providers"],
  });

  const { data: socialLinks = [], refetch: refetchSocialLinks, isLoading: socialLinksLoading } = useQuery<SocialMediaLink[]>({
    queryKey: ["/api/settings/social-links"],
  });

  const [socialFormValues, setSocialFormValues] = useState<Record<number, string>>({});
  const [initializingSocial, setInitializingSocial] = useState(false);

  const { data: smsStatus } = useQuery<{ ready: boolean; provider: string; senderId: string; hasAuthKey: boolean; hasWhatsappNumber: boolean; defaultChannel: string }>({
    queryKey: ["/api/sysctrl/sms-status"],
  });

  const [smsPreviewOpen, setSmsPreviewOpen] = useState(false);
  const [smsPreviewTemplate, setSmsPreviewTemplate] = useState<SmsTemplate | null>(null);
  const [smsPreviewRendered, setSmsPreviewRendered] = useState("");
  const [smsPreviewTab, setSmsPreviewTab] = useState<"sms" | "whatsapp">("sms");
  const [smsEditOpen, setSmsEditOpen] = useState(false);
  const [smsEditTemplate, setSmsEditTemplate] = useState<SmsTemplate | null>(null);
  const [smsEditName, setSmsEditName] = useState("");
  const [smsEditBody, setSmsEditBody] = useState("");
  const [smsEditVars, setSmsEditVars] = useState("");
  const [smsEditChannel, setSmsEditChannel] = useState("sms");
  const [smsEditSmsTemplateId, setSmsEditSmsTemplateId] = useState("");
  const [smsEditWaTemplateName, setSmsEditWaTemplateName] = useState("");
  const [smsEditActive, setSmsEditActive] = useState(true);
  const [smsEditSaving, setSmsEditSaving] = useState(false);
  const [smsTestOpen, setSmsTestOpen] = useState(false);
  const [smsTestTemplate, setSmsTestTemplate] = useState<SmsTemplate | null>(null);
  const [smsTestPhone, setSmsTestPhone] = useState("");
  const [smsTestSending, setSmsTestSending] = useState(false);
  const [smsAddOpen, setSmsAddOpen] = useState(false);
  const [smsAddName, setSmsAddName] = useState("");
  const [smsAddBody, setSmsAddBody] = useState("");
  const [smsAddVars, setSmsAddVars] = useState("");
  const [smsAddChannel, setSmsAddChannel] = useState("sms");
  const [smsAddSmsTemplateId, setSmsAddSmsTemplateId] = useState("");
  const [smsAddWaTemplateName, setSmsAddWaTemplateName] = useState("");
  const [smsAddSaving, setSmsAddSaving] = useState(false);
  const [showAiProviderDialog, setShowAiProviderDialog] = useState(false);
  const [editingAiProvider, setEditingAiProvider] = useState<AiProvider | null>(null);
  const [aiProviderForm, setAiProviderForm] = useState({
    providerName: "",
    providerCode: "openai",
    category: "content",
    apiKey: "",
    modelName: "",
    baseUrl: "",
    voiceId: "",
  });

  // Auto-initialize social links if none exist
  useEffect(() => {
    if (!socialLinksLoading && socialLinks.length === 0 && !initializingSocial) {
      setInitializingSocial(true);
      fetch("/api/settings/social-links/init", { method: "POST" })
        .then(() => {
          refetchSocialLinks();
        })
        .finally(() => {
          setInitializingSocial(false);
        });
    }
  }, [socialLinks, socialLinksLoading, initializingSocial, refetchSocialLinks]);

  const updateSocialLinkMutation = useMutation({
    mutationFn: async ({ id, pageUrl, isActive }: { id: number; pageUrl?: string; isActive?: boolean }) => {
      const response = await fetch(`/api/settings/social-links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageUrl, isActive }),
      });
      if (!response.ok) throw new Error("Failed to update");
      return response.json();
    },
    onSuccess: (_, variables) => {
      setSocialFormValues(prev => {
        const updated = { ...prev };
        delete updated[variables.id];
        return updated;
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings/social-links"] });
      toast({ title: "Social media link updated" });
    },
    onError: () => {
      toast({ title: "Failed to update social media link", variant: "destructive" });
    },
  });

  const toggleSocialLinkMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: number; isActive: boolean }) => {
      const response = await fetch(`/api/settings/social-links/${id}/toggle`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive }),
      });
      if (!response.ok) throw new Error("Failed to toggle");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings/social-links"] });
    },
    onError: () => {
      toast({ title: "Failed to toggle social media link", variant: "destructive" });
    },
  });

  const createAiProviderMutation = useMutation({
    mutationFn: async (data: typeof aiProviderForm) => {
      return apiRequest("POST", "/api/sysctrl/ai-providers", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/ai-providers"] });
      toast({ title: "Provider created" });
      setShowAiProviderDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to create provider", variant: "destructive" });
    },
  });

  const updateAiProviderMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<typeof aiProviderForm> }) => {
      return apiRequest("PUT", `/api/sysctrl/ai-providers/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/ai-providers"] });
      toast({ title: "Provider updated" });
      setShowAiProviderDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to update provider", variant: "destructive" });
    },
  });

  const deleteAiProviderMutation = useMutation({
    mutationFn: async (id: number) => {
      return apiRequest("DELETE", `/api/sysctrl/ai-providers/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/ai-providers"] });
      toast({ title: "Provider deleted" });
      setShowAiProviderDialog(false);
    },
    onError: () => {
      toast({ title: "Failed to delete provider", variant: "destructive" });
    },
  });

  const toggleAiProviderMutation = useMutation({
    mutationFn: async ({ id, activate }: { id: number; activate: boolean }) => {
      return apiRequest("POST", `/api/sysctrl/ai-providers/${id}/${activate ? 'activate' : 'deactivate'}`);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/ai-providers"] });
      toast({ title: `Provider ${variables.activate ? 'activated' : 'deactivated'}` });
    },
    onError: () => {
      toast({ title: "Failed to update provider", variant: "destructive" });
    },
  });

  const testAiProviderMutation = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`/api/sysctrl/ai-providers/${id}/test`, { method: "POST" });
      return res.json();
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/ai-providers"] });
      toast({
        title: data.success ? "Connection Successful" : "Connection Failed",
        description: data.message,
        variant: data.success ? "default" : "destructive"
      });
    },
    onError: () => {
      toast({ title: "Test failed", variant: "destructive" });
    },
  });

  const platformIcons: Record<string, any> = {
    facebook: SiFacebook,
    instagram: SiInstagram,
    x: SiX,
    linkedin: SiLinkedin,
    youtube: SiYoutube,
    whatsapp: SiWhatsapp,
  };

  const platformColors: Record<string, string> = {
    facebook: "bg-blue-500",
    instagram: "bg-gradient-to-br from-pink-500 to-purple-600",
    x: "bg-gray-800",
    linkedin: "bg-blue-600",
    youtube: "bg-red-600",
    whatsapp: "bg-green-500",
  };

  const saveSettingsMutation = useMutation({
    mutationFn: async (settingsData: { key: string; value: string; category: string }[]) => {
      return apiRequest("POST", "/api/sysctrl/settings/bulk", { settings: settingsData });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/settings"] });
      toast({ title: "Settings saved successfully" });
    },
    onError: () => {
      toast({ title: "Failed to save settings", variant: "destructive" });
    },
  });

  const getSettingValue = (key: string): string => {
    const setting = settings.find(s => s.key === key);
    return setting?.value || "";
  };

  const [formValues, setFormValues] = useState<Record<string, string>>({});

  const updateFormValue = (key: string, value: string) => {
    setFormValues(prev => ({ ...prev, [key]: value }));
  };

  const getFormValue = (key: string): string => {
    return formValues[key] !== undefined ? formValues[key] : getSettingValue(key);
  };

  const saveCategory = (category: string, keys: string[]) => {
    const settingsData = keys.map(key => ({
      key,
      value: getFormValue(key),
      category,
    }));
    saveSettingsMutation.mutate(settingsData);
  };

  const sections = [
    { id: "meta" as SettingsSubSection, label: "Site Meta & SEO", icon: Globe },
    { id: "platform" as SettingsSubSection, label: "Platform Control", icon: Shield },
    { id: "ai" as SettingsSubSection, label: "AI Management", icon: Brain },
    { id: "certificates" as SettingsSubSection, label: "Certificate Previews", icon: Trophy },
    { id: "social" as SettingsSubSection, label: "Social Media Links", icon: Share2 },
    { id: "push" as SettingsSubSection, label: "Push Notifications", icon: Bell },
    { id: "email" as SettingsSubSection, label: "Email", icon: Mail },
    { id: "sms" as SettingsSubSection, label: "SMS", icon: MessageSquare },
    { id: "storage" as SettingsSubSection, label: "Storage", icon: HardDrive },
    { id: "plugins" as SettingsSubSection, label: "Plugins", icon: Puzzle },
    { id: "languages" as SettingsSubSection, label: "Languages", icon: LanguagesIcon },
    { id: "logos" as SettingsSubSection, label: "Logos", icon: Image },
    { id: "payments" as SettingsSubSection, label: "Payments & Tax", icon: CreditCard },
    { id: "data_export" as SettingsSubSection, label: "Data Export", icon: Database },
    { id: "data_import" as SettingsSubSection, label: "Data Import", icon: Upload },
    { id: "code_export" as SettingsSubSection, label: "Code Export", icon: Download },
    { id: "future_plans" as SettingsSubSection, label: "Future Plans", icon: FileText },
  ];

  // Show OTP verification screen if not verified
  if (!otpVerified) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md bg-white/90 backdrop-blur shadow-xl">
          <CardHeader className="text-center space-y-2">
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-xl text-gray-800">Super Admin Verification</CardTitle>
            <CardDescription>
              Enter the OTP sent to super admin's registered email or mobile to access Global Settings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {!otpSent ? (
              <div className="text-center space-y-4">
                <p className="text-sm text-gray-600">
                  Click the button below to receive a verification code
                </p>
                <Button 
                  onClick={handleSendOtp} 
                  disabled={sendingOtp}
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  data-testid="button-send-otp"
                >
                  {sendingOtp ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending OTP...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send OTP
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="otp">Enter 6-digit OTP</Label>
                  <Input
                    id="otp"
                    type="text"
                    placeholder="Enter OTP"
                    value={otpValue}
                    onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    maxLength={6}
                    className={`text-center text-2xl tracking-widest font-mono ${otpError ? "border-destructive animate-shake" : ""}`}
                    data-testid="input-otp"
                  />
                  {otpError && (
                    <p className="text-sm text-destructive flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {otpError}
                    </p>
                  )}
                </div>
                <Button 
                  onClick={handleVerifyOtp} 
                  disabled={otpValue.length !== 6}
                  className="w-full bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  data-testid="button-verify-otp"
                >
                  <Check className="w-4 h-4 mr-2" />
                  Verify OTP
                </Button>
                <Button 
                  variant="ghost" 
                  onClick={handleSendOtp}
                  disabled={sendingOtp}
                  className="w-full text-violet-600"
                  data-testid="button-resend-otp"
                >
                  {sendingOtp ? "Sending..." : "Resend OTP"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 grid-cols-2 md:grid-cols-4">
        {sections.map((section) => (
          <Card 
            key={section.id}
            className={`cursor-pointer transition-all hover-elevate ${
              activeSection === section.id 
                ? "ring-2 ring-violet-500 bg-gradient-to-br from-violet-50 to-fuchsia-50" 
                : "bg-white/80 backdrop-blur border-gray-200/50"
            }`}
            onClick={() => setActiveSection(section.id)}
            data-testid={`settings-card-${section.id}`}
          >
            <CardContent className="p-4 text-center">
              <div className={`w-10 h-10 mx-auto rounded-lg flex items-center justify-center mb-2 ${
                activeSection === section.id 
                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" 
                  : "bg-gray-100"
              }`}>
                <section.icon className={`w-5 h-5 ${activeSection === section.id ? "text-white" : "text-gray-600"}`} />
              </div>
              <p className={`text-xs font-medium ${activeSection === section.id ? "text-violet-700" : "text-gray-600"}`}>
                {section.label}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <motion.div
        key={activeSection}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
      >
        {activeSection === "meta" && (
          <Card className="bg-white/80 backdrop-blur border-gray-200/50">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <Globe className="w-5 h-5 text-violet-500" />
                Site Meta & SEO Settings
              </CardTitle>
              <CardDescription>Configure site metadata for search engines and social sharing</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="site_name">Site Name</Label>
                  <Input 
                    id="site_name" 
                    placeholder="Samikaran Olympiad"
                    value={getFormValue("site_name")}
                    onChange={(e) => updateFormValue("site_name", e.target.value)}
                    data-testid="input-site-name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="site_tagline">Tagline</Label>
                  <Input 
                    id="site_tagline" 
                    placeholder="Empowering minds through competition"
                    value={getFormValue("site_tagline")}
                    onChange={(e) => updateFormValue("site_tagline", e.target.value)}
                    data-testid="input-site-tagline"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meta_description">Meta Description</Label>
                <Textarea 
                  id="meta_description" 
                  placeholder="SEO description for search engines (150-160 characters)"
                  className="min-h-[80px]"
                  value={getFormValue("meta_description")}
                  onChange={(e) => updateFormValue("meta_description", e.target.value)}
                  data-testid="input-meta-description"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="meta_keywords">Meta Keywords</Label>
                  <Input 
                    id="meta_keywords" 
                    placeholder="olympiad, education, math, science"
                    value={getFormValue("meta_keywords")}
                    onChange={(e) => updateFormValue("meta_keywords", e.target.value)}
                    data-testid="input-meta-keywords"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="og_image">OG Image URL</Label>
                  <Input 
                    id="og_image" 
                    placeholder="https://example.com/og-image.jpg"
                    value={getFormValue("og_image")}
                    onChange={(e) => updateFormValue("og_image", e.target.value)}
                    data-testid="input-og-image"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Contact Email</Label>
                <Input 
                  id="contact_email" 
                  placeholder="Enter your email"
                  value={getFormValue("contact_email")}
                  onChange={(e) => updateFormValue("contact_email", e.target.value)}
                  data-testid="input-contact-email"
                />
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={() => saveCategory("meta", [
                    "site_name", "site_tagline", "meta_description", "meta_keywords",
                    "og_image", "contact_email"
                  ])}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  disabled={saveSettingsMutation.isPending}
                  data-testid="button-save-meta"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save SEO Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === "platform" && (
          <Card className="bg-white/80 backdrop-blur border-gray-200/50">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <Shield className="w-5 h-5 text-violet-500" />
                Platform Control
              </CardTitle>
              <CardDescription>Manage platform-wide operational settings and maintenance controls</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-orange-200 bg-orange-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Power className="w-4 h-4 text-orange-600" />
                          <Label className="text-orange-800 font-semibold">Maintenance Mode</Label>
                        </div>
                        <p className="text-xs text-orange-600">
                          When enabled, the platform shows a maintenance page to all users except super admins
                        </p>
                      </div>
                      <Switch
                        checked={getFormValue("maintenance_mode") === "true"}
                        onCheckedChange={(checked) => updateFormValue("maintenance_mode", checked ? "true" : "false")}
                        data-testid="switch-maintenance-mode"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <RefreshCw className="w-4 h-4 text-blue-600" />
                          <Label className="text-blue-800 font-semibold">Live Updates</Label>
                        </div>
                        <p className="text-xs text-blue-600">
                          Enable real-time data updates via WebSocket connections across the platform
                        </p>
                      </div>
                      <Switch
                        checked={getFormValue("live_updates") === "true"}
                        onCheckedChange={(checked) => updateFormValue("live_updates", checked ? "true" : "false")}
                        data-testid="switch-live-updates"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <Card className="border-fuchsia-200 bg-fuchsia-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Clock className="w-4 h-4 text-fuchsia-600" />
                          <Label className="text-fuchsia-800 font-semibold">Coming Soon Page</Label>
                        </div>
                        <p className="text-xs text-fuchsia-600">
                          Show the Coming Soon page instead of the landing page to visitors
                        </p>
                      </div>
                      <Switch
                        checked={getFormValue("coming_soon_enabled") === "true"}
                        onCheckedChange={(checked) => updateFormValue("coming_soon_enabled", checked ? "true" : "false")}
                        data-testid="switch-coming-soon"
                      />
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-purple-200 bg-purple-50/50">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Eye className="w-4 h-4 text-purple-600" />
                          <Label className="text-purple-800 font-semibold">Public Leaderboard</Label>
                        </div>
                        <p className="text-xs text-purple-600">
                          Show the public leaderboard on the landing page
                        </p>
                      </div>
                      <Switch
                        checked={getFormValue("public_leaderboard") !== "false"}
                        onCheckedChange={(checked) => updateFormValue("public_leaderboard", checked ? "true" : "false")}
                        data-testid="switch-public-leaderboard"
                      />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maintenance_message">Maintenance Message</Label>
                <Textarea 
                  id="maintenance_message" 
                  placeholder="We're currently performing scheduled maintenance. Please check back soon!"
                  className="min-h-[80px]"
                  value={getFormValue("maintenance_message")}
                  onChange={(e) => updateFormValue("maintenance_message", e.target.value)}
                  data-testid="input-maintenance-message"
                />
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="support_email">Support Email</Label>
                  <Input 
                    id="support_email" 
                    placeholder="Enter your email"
                    value={getFormValue("support_email")}
                    onChange={(e) => updateFormValue("support_email", e.target.value)}
                    data-testid="input-support-email"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="support_phone">Support Phone</Label>
                  <Input 
                    id="support_phone" 
                    placeholder="+91 1234567890"
                    value={getFormValue("support_phone")}
                    onChange={(e) => updateFormValue("support_phone", e.target.value)}
                    data-testid="input-support-phone"
                  />
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={() => saveCategory("platform", [
                    "maintenance_mode", "live_updates", "coming_soon_enabled", "public_leaderboard",
                    "maintenance_message", "support_email", "support_phone"
                  ])}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  disabled={saveSettingsMutation.isPending}
                  data-testid="button-save-platform"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Platform Settings
                </Button>
              </div>

            </CardContent>
          </Card>
        )}

        {activeSection === "ai" && (
          <Card className="bg-white/80 backdrop-blur border-gray-200/50">
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div>
                  <CardTitle className="text-gray-800 flex items-center gap-2">
                    <Brain className="w-5 h-5 text-violet-500" />
                    AI Provider Management
                  </CardTitle>
                  <CardDescription>
                    Configure AI service providers for content generation, image creation, and research tasks
                  </CardDescription>
                </div>
                <Button 
                  onClick={() => {
                    setEditingAiProvider(null);
                    setAiProviderForm({
                      providerName: "",
                      providerCode: "openai",
                      category: "content",
                      apiKey: "",
                      modelName: "",
                      baseUrl: "",
                      voiceId: "",
                    });
                    setShowApiKey(false);
                    setShowAiProviderDialog(true);
                  }}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  data-testid="button-add-ai-provider"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Provider
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {AI_CATEGORIES.map((category) => {
                const categoryProviders = aiProviders.filter(p => p.category === category.value);
                const activeProvider = categoryProviders.find(p => p.isActive);
                
                return (
                  <div key={category.value} className="border rounded-lg p-4">
                    <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                      <div>
                        <h3 className="font-medium text-gray-800 flex items-center gap-2">
                          {category.value === "content" && <FileText className="w-4 h-4 text-blue-500" />}
                          {category.value === "image" && <Image className="w-4 h-4 text-purple-500" />}
                          {category.value === "research" && <Search className="w-4 h-4 text-green-500" />}
                          {category.label}
                        </h3>
                        <p className="text-sm text-gray-500">{category.description}</p>
                      </div>
                      {activeProvider && (
                        <Badge className="bg-emerald-100 text-emerald-700">
                          <Zap className="w-3 h-3 mr-1" />
                          {activeProvider.providerName} Active
                        </Badge>
                      )}
                    </div>
                    
                    {categoryProviders.length === 0 ? (
                      <div className="text-center py-6 bg-gray-50 rounded-lg">
                        <Brain className="w-10 h-10 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm text-gray-500">No providers configured for {category.label.toLowerCase()}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="mt-2"
                          onClick={() => {
                            setEditingAiProvider(null);
                            setAiProviderForm({
                              providerName: "",
                              providerCode: AI_PROVIDERS.find(p => p.categories.includes(category.value))?.code || "openai",
                              category: category.value,
                              apiKey: "",
                              modelName: "",
                              baseUrl: "",
                              voiceId: "",
                            });
                            setShowApiKey(false);
                            setShowAiProviderDialog(true);
                          }}
                          data-testid={`button-add-${category.value}-provider`}
                        >
                          <Plus className="w-3 h-3 mr-1" />
                          Add {category.label} Provider
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {categoryProviders.map((provider) => (
                          <div 
                            key={provider.id}
                            className={`flex items-center justify-between p-3 rounded-lg border ${
                              provider.isActive 
                                ? "bg-gradient-to-r from-violet-50 to-fuchsia-50 border-violet-200" 
                                : "bg-gray-50 border-gray-200"
                            }`}
                            data-testid={`ai-provider-${provider.id}`}
                          >
                            <div className="flex items-center gap-3">
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                provider.isActive 
                                  ? "bg-gradient-to-r from-violet-500 to-fuchsia-500" 
                                  : "bg-gray-200"
                              }`}>
                                <Brain className={`w-5 h-5 ${provider.isActive ? "text-white" : "text-gray-500"}`} />
                              </div>
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-medium text-gray-800">{provider.providerName}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {AI_PROVIDERS.find(p => p.code === provider.providerCode)?.name || provider.providerCode}
                                  </Badge>
                                  {provider.testStatus === "success" && (
                                    <Badge className="bg-emerald-100 text-emerald-700 text-xs">
                                      <Check className="w-3 h-3 mr-1" />
                                      Tested
                                    </Badge>
                                  )}
                                  {provider.testStatus === "failed" && (
                                    <Badge variant="destructive" className="text-xs">
                                      <X className="w-3 h-3 mr-1" />
                                      Failed
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-xs text-gray-500">
                                  {provider.modelName && `Model: ${provider.modelName}`}
                                  {provider.modelName && provider.apiKey && " • "}
                                  {provider.apiKey && "API Key: ••••••••"}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => testAiProviderMutation.mutate(provider.id)}
                                disabled={testAiProviderMutation.isPending}
                                data-testid={`button-test-provider-${provider.id}`}
                              >
                                {testAiProviderMutation.isPending ? (
                                  <RefreshCw className="w-4 h-4 animate-spin" />
                                ) : (
                                  <TestTube2 className="w-4 h-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setEditingAiProvider(provider);
                                  setAiProviderForm({
                                    providerName: provider.providerName,
                                    providerCode: provider.providerCode,
                                    category: provider.category,
                                    apiKey: provider.apiKey || "",
                                    modelName: provider.modelName || "",
                                    baseUrl: provider.baseUrl || "",
                                    voiceId: (provider.config as any)?.voiceId || "",
                                  });
                                  setShowApiKey(false);
                                  setShowAiProviderDialog(true);
                                }}
                                data-testid={`button-edit-provider-${provider.id}`}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <Switch
                                checked={provider.isActive}
                                onCheckedChange={(checked) => toggleAiProviderMutation.mutate({ id: provider.id, activate: checked })}
                                disabled={toggleAiProviderMutation.isPending}
                                data-testid={`switch-provider-${provider.id}`}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        )}

        <Dialog open={showAiProviderDialog} onOpenChange={setShowAiProviderDialog}>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-violet-500" />
                {editingAiProvider ? "Edit AI Provider" : "Add AI Provider"}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4 flex-1 overflow-y-auto">
              <div className="space-y-2">
                <Label>Provider Name</Label>
                <Input
                  placeholder="My OpenAI Provider"
                  value={aiProviderForm.providerName}
                  onChange={(e) => setAiProviderForm(prev => ({ ...prev, providerName: e.target.value }))}
                  data-testid="input-provider-name"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Provider Type</Label>
                  <Select 
                    value={aiProviderForm.providerCode} 
                    onValueChange={(value) => setAiProviderForm(prev => ({ ...prev, providerCode: value }))}
                  >
                    <SelectTrigger data-testid="select-provider-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_PROVIDERS.filter(p => p.categories.includes(aiProviderForm.category)).map((p) => (
                        <SelectItem key={p.code} value={p.code}>{p.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="space-y-2">
                  <Label>Category</Label>
                  <Select 
                    value={aiProviderForm.category} 
                    onValueChange={(value) => setAiProviderForm(prev => ({ ...prev, category: value }))}
                  >
                    <SelectTrigger data-testid="select-provider-category">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AI_CATEGORIES.map((c) => (
                        <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-2">
                <Label>API Key</Label>
                <div className="relative">
                  <Input
                    type={showApiKey ? "text" : "password"}
                    placeholder="sk-..."
                    value={aiProviderForm.apiKey}
                    onChange={(e) => setAiProviderForm(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="pr-10"
                    data-testid="input-api-key"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-0 top-0 h-full"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Model Name (Optional)</Label>
                <Input
                  placeholder="gpt-4o, gemini-pro, claude-3-opus..."
                  value={aiProviderForm.modelName}
                  onChange={(e) => setAiProviderForm(prev => ({ ...prev, modelName: e.target.value }))}
                  data-testid="input-model-name"
                />
              </div>

              {aiProviderForm.providerCode === "custom" && (
                <div className="space-y-2">
                  <Label>Base URL</Label>
                  <Input
                    placeholder="https://api.example.com/v1"
                    value={aiProviderForm.baseUrl}
                    onChange={(e) => setAiProviderForm(prev => ({ ...prev, baseUrl: e.target.value }))}
                    data-testid="input-base-url"
                  />
                </div>
              )}

              {aiProviderForm.providerCode === "elevenlabs" && (
                <div className="space-y-2">
                  <Label>Voice ID (Required for ElevenLabs)</Label>
                  <Input
                    placeholder="e.g., EXAVITQu4vr4xnSDxMaL"
                    value={aiProviderForm.voiceId}
                    onChange={(e) => setAiProviderForm(prev => ({ ...prev, voiceId: e.target.value }))}
                    data-testid="input-voice-id"
                  />
                  <p className="text-xs text-muted-foreground">
                    Get Voice ID from elevenlabs.io/app/voice-library. Recommended: Search for "Priya" or "Ananya" (Indian female voices)
                  </p>
                </div>
              )}
            </div>
            <DialogFooter className="gap-2 flex-shrink-0">
              {editingAiProvider && (
                <Button
                  variant="destructive"
                  onClick={() => deleteAiProviderMutation.mutate(editingAiProvider.id)}
                  disabled={deleteAiProviderMutation.isPending}
                  data-testid="button-delete-provider"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  {deleteAiProviderMutation.isPending ? "Deleting..." : "Delete"}
                </Button>
              )}
              <Button
                onClick={() => {
                  const payload: Record<string, any> = {
                    providerName: aiProviderForm.providerName,
                    providerCode: aiProviderForm.providerCode,
                    category: aiProviderForm.category,
                    modelName: aiProviderForm.modelName || null,
                    baseUrl: aiProviderForm.baseUrl || null,
                  };
                  
                  if (aiProviderForm.apiKey && aiProviderForm.apiKey.trim() !== "") {
                    payload.apiKey = aiProviderForm.apiKey;
                  }
                  
                  if (aiProviderForm.providerCode === "elevenlabs" && aiProviderForm.voiceId) {
                    payload.config = { voiceId: aiProviderForm.voiceId };
                  }
                  
                  if (editingAiProvider) {
                    updateAiProviderMutation.mutate({ id: editingAiProvider.id, data: payload });
                  } else {
                    if (!payload.apiKey) {
                      toast({ title: "API key is required for new providers", variant: "destructive" });
                      return;
                    }
                    createAiProviderMutation.mutate(payload as typeof aiProviderForm);
                  }
                }}
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                disabled={createAiProviderMutation.isPending || updateAiProviderMutation.isPending}
                data-testid="button-save-provider"
              >
                <Save className="w-4 h-4 mr-2" />
                {(createAiProviderMutation.isPending || updateAiProviderMutation.isPending) 
                  ? "Saving..." 
                  : editingAiProvider ? "Update Provider" : "Save Provider"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {activeSection === "social" && (
          <Card className="bg-white/80 backdrop-blur border-gray-200/50">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <Share2 className="w-5 h-5 text-violet-500" />
                Social Media Page Links
              </CardTitle>
              <CardDescription>
                Configure your social media page URLs. Active links will be displayed in the website footer and social buttons.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {socialLinks.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Share2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
                  <p>No social media links configured</p>
                  <p className="text-sm mb-4">Links will be initialized automatically</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {socialLinks.map((link) => {
                    const IconComponent = platformIcons[link.platformCode] || Share2;
                    const colorClass = platformColors[link.platformCode] || "bg-gray-500";
                    const currentUrl = socialFormValues[link.id] !== undefined ? socialFormValues[link.id] : (link.pageUrl || "");
                    
                    return (
                      <div 
                        key={link.id} 
                        className={`p-4 rounded-lg border ${link.isActive ? "bg-white border-gray-200" : "bg-gray-50 border-gray-100 opacity-60"}`}
                        data-testid={`social-link-${link.platformCode}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-lg ${colorClass} text-white flex items-center justify-center flex-shrink-0`}>
                            <IconComponent className="w-6 h-6" />
                          </div>
                          
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between gap-2 flex-wrap">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-gray-800">{link.platformName}</span>
                                <Badge variant={link.isActive ? "default" : "secondary"} className={link.isActive ? "bg-emerald-100 text-emerald-700" : ""}>
                                  {link.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </div>
                              <Switch
                                checked={link.isActive}
                                onCheckedChange={(checked) => toggleSocialLinkMutation.mutate({ id: link.id, isActive: checked })}
                                data-testid={`switch-social-${link.platformCode}`}
                              />
                            </div>
                            
                            <div className="flex gap-2">
                              <Input
                                placeholder={`https://${link.platformCode}.com/your-page`}
                                value={currentUrl}
                                onChange={(e) => setSocialFormValues(prev => ({ ...prev, [link.id]: e.target.value }))}
                                className="flex-1"
                                data-testid={`input-social-${link.platformCode}`}
                              />
                              <Button 
                                variant="outline" 
                                size="icon"
                                onClick={() => updateSocialLinkMutation.mutate({ id: link.id, pageUrl: currentUrl })}
                                disabled={updateSocialLinkMutation.isPending}
                                data-testid={`button-save-social-${link.platformCode}`}
                              >
                                <Save className="w-4 h-4" />
                              </Button>
                              {link.pageUrl && (
                                <Button 
                                  variant="outline" 
                                  size="icon"
                                  onClick={() => window.open(link.pageUrl || "", "_blank")}
                                  data-testid={`button-open-social-${link.platformCode}`}
                                >
                                  <ExternalLink className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-gray-500 mb-3">
                  Active social media links will be displayed on the website footer and used for social sharing buttons throughout the platform.
                </p>
                <div className="flex gap-2">
                  <Button 
                    variant="outline"
                    onClick={async () => {
                      if (socialLinks.length === 0) {
                        setInitializingSocial(true);
                        await fetch("/api/settings/social-links/init", { method: "POST" });
                        setInitializingSocial(false);
                      }
                      refetchSocialLinks();
                    }}
                    disabled={initializingSocial}
                    data-testid="button-refresh-social"
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${initializingSocial ? 'animate-spin' : ''}`} />
                    {initializingSocial ? 'Initializing...' : 'Refresh'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === "push" && (
          <Card className="bg-white/80 backdrop-blur border-gray-200/50">
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <Bell className="w-5 h-5 text-violet-500" />
                  Push Notification Templates
                </CardTitle>
                <CardDescription>Manage push notification templates for different events</CardDescription>
              </div>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                data-testid="button-add-push-template"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Template
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pushTemplates.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <Bell className="w-12 h-12 mx-auto mb-3 opacity-30" />
                    <p>No push notification templates yet</p>
                    <p className="text-sm">Click "Add Template" to create your first template</p>
                  </div>
                ) : (
                  pushTemplates.map((template) => (
                    <div key={template.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                          <Bell className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{template.name}</p>
                          <p className="text-sm text-gray-500">{template.slug}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={template.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}>
                          {template.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button size="icon" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button size="icon" variant="ghost">
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="mt-6 pt-6 border-t space-y-4">
                <h4 className="font-medium text-gray-800">Push Provider Settings</h4>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="firebase_server_key">Firebase Server Key</Label>
                    <Input 
                      id="firebase_server_key" 
                      type="password"
                      placeholder="Enter Firebase server key"
                      value={getFormValue("firebase_server_key")}
                      onChange={(e) => updateFormValue("firebase_server_key", e.target.value)}
                      data-testid="input-firebase-key"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="firebase_sender_id">Firebase Sender ID</Label>
                    <Input 
                      id="firebase_sender_id" 
                      placeholder="Enter Firebase sender ID"
                      value={getFormValue("firebase_sender_id")}
                      onChange={(e) => updateFormValue("firebase_sender_id", e.target.value)}
                      data-testid="input-firebase-sender"
                    />
                  </div>
                </div>
                <Button 
                  onClick={() => saveCategory("push", ["firebase_server_key", "firebase_sender_id"])}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  disabled={saveSettingsMutation.isPending}
                  data-testid="button-save-push"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Push Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === "email" && (
          <div className="space-y-6">
            <Card className="bg-white/80 backdrop-blur border-gray-200/50">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <Mail className="w-5 h-5 text-violet-500" />
                  Email Provider Configuration
                </CardTitle>
                <CardDescription>Configure your email service provider for sending transactional and marketing emails</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-3 rounded-lg bg-gradient-to-r from-violet-50 to-purple-50 border border-violet-200 mb-4">
                  <div className="flex items-center gap-2 text-sm">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="font-medium text-violet-800">
                      Active Provider: {
                        {
                          brevo: "Brevo (Sendinblue) — API",
                          sendgrid: "SendGrid — SMTP",
                          mailgun: "Mailgun — SMTP",
                          ses: "AWS SES — SMTP",
                          gmail: "Gmail — SMTP (App Password required)",
                          smtp: "Custom SMTP"
                        }[getFormValue("email_provider") || "brevo"] || "Not configured"
                      }
                    </span>
                  </div>
                  <p className="text-xs text-violet-600 mt-1">All emails will be sent using this provider. Make sure the credentials below are correct.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email_provider">Email Provider</Label>
                    <Select value={getFormValue("email_provider") || "brevo"} onValueChange={(v) => {
                      updateFormValue("email_provider", v);
                      if (v === "gmail") {
                        updateFormValue("smtp_host", "smtp.gmail.com");
                        updateFormValue("smtp_port", "587");
                        updateFormValue("smtp_encryption", "tls");
                      }
                    }}>
                      <SelectTrigger data-testid="select-email-provider">
                        <SelectValue placeholder="Select provider" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brevo">Brevo (Sendinblue)</SelectItem>
                        <SelectItem value="sendgrid">SendGrid</SelectItem>
                        <SelectItem value="mailgun">Mailgun</SelectItem>
                        <SelectItem value="ses">AWS SES</SelectItem>
                        <SelectItem value="gmail">Gmail (App Password)</SelectItem>
                        <SelectItem value="smtp">Custom SMTP</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email_from_name">From Name</Label>
                    <Input 
                      id="email_from_name" 
                      placeholder="Samikaran Olympiad"
                      value={getFormValue("email_from_name")}
                      onChange={(e) => updateFormValue("email_from_name", e.target.value)}
                      data-testid="input-email-from-name"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="email_from_address">From Email Address</Label>
                    <Input 
                      id="email_from_address" 
                      placeholder="Enter your email"
                      value={getFormValue("email_from_address")}
                      onChange={(e) => updateFormValue("email_from_address", e.target.value)}
                      data-testid="input-email-from-address"
                    />
                  </div>
                  {getFormValue("email_provider") !== "smtp" && getFormValue("email_provider") !== "gmail" && (
                    <div className="space-y-2">
                      <Label htmlFor="email_api_key">API Key</Label>
                      <div className="relative">
                        <Input 
                          id="email_api_key" 
                          type={showApiKey ? "text" : "password"}
                          placeholder="Enter API key"
                          value={getFormValue("email_api_key")}
                          onChange={(e) => updateFormValue("email_api_key", e.target.value)}
                          data-testid="input-email-api-key"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowApiKey(!showApiKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          data-testid="button-toggle-api-key"
                        >
                          {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                {getFormValue("email_provider") === "gmail" && (
                  <div className="p-4 rounded-lg bg-amber-50 border border-amber-200">
                    <h4 className="font-medium text-amber-800 mb-3 flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Gmail SMTP Settings
                    </h4>
                    <div className="p-3 mb-4 rounded bg-amber-100/50 border border-amber-300 text-xs text-amber-800">
                      <strong>Important:</strong> Gmail requires an <strong>App Password</strong>, not your regular Gmail password.
                      Go to <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener" className="underline font-medium text-violet-700">myaccount.google.com/apppasswords</a> to generate one (2-Step Verification must be enabled first).
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="smtp_username">Gmail Address</Label>
                        <Input
                          id="smtp_username"
                          placeholder="yourname@gmail.com"
                          value={getFormValue("smtp_username")}
                          onChange={(e) => updateFormValue("smtp_username", e.target.value)}
                          data-testid="input-gmail-address"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_password">App Password (16 chars)</Label>
                        <Input
                          id="smtp_password"
                          type="password"
                          placeholder="xxxx xxxx xxxx xxxx"
                          value={getFormValue("smtp_password")}
                          onChange={(e) => updateFormValue("smtp_password", e.target.value)}
                          data-testid="input-gmail-app-password"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {getFormValue("email_provider") === "smtp" && (
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <h4 className="font-medium text-blue-800 mb-3 flex items-center gap-2">
                      <Settings className="w-4 h-4" />
                      SMTP Server Settings
                    </h4>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="smtp_host">SMTP Host</Label>
                        <Input 
                          id="smtp_host" 
                          placeholder="smtp.example.com"
                          value={getFormValue("smtp_host")}
                          onChange={(e) => updateFormValue("smtp_host", e.target.value)}
                          data-testid="input-smtp-host"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_port">SMTP Port</Label>
                        <Input 
                          id="smtp_port" 
                          placeholder="587"
                          value={getFormValue("smtp_port")}
                          onChange={(e) => updateFormValue("smtp_port", e.target.value)}
                          data-testid="input-smtp-port"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_username">Username</Label>
                        <Input 
                          id="smtp_username" 
                          placeholder="your-username"
                          value={getFormValue("smtp_username")}
                          onChange={(e) => updateFormValue("smtp_username", e.target.value)}
                          data-testid="input-smtp-username"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_password">Password</Label>
                        <Input 
                          id="smtp_password" 
                          type="password"
                          placeholder="Enter password"
                          value={getFormValue("smtp_password")}
                          onChange={(e) => updateFormValue("smtp_password", e.target.value)}
                          data-testid="input-smtp-password"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="smtp_encryption">Encryption</Label>
                        <Select value={getFormValue("smtp_encryption") || "tls"} onValueChange={(v) => updateFormValue("smtp_encryption", v)}>
                          <SelectTrigger data-testid="select-smtp-encryption">
                            <SelectValue placeholder="Select encryption" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            <SelectItem value="tls">TLS</SelectItem>
                            <SelectItem value="ssl">SSL</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {getFormValue("email_provider") === "sendgrid" && (
                  <div className="p-3 rounded-lg bg-gray-50 border text-sm text-gray-600">
                    <strong>SendGrid:</strong> Get your API key from <a href="https://app.sendgrid.com/settings/api_keys" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">SendGrid Dashboard</a>. Ensure you have a verified sender identity.
                  </div>
                )}

                {getFormValue("email_provider") === "mailgun" && (
                  <div className="p-3 rounded-lg bg-gray-50 border text-sm text-gray-600">
                    <strong>Mailgun:</strong> Get your API key from <a href="https://app.mailgun.com/settings/api_security" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">Mailgun Dashboard</a>. Use your domain-specific sending API key.
                  </div>
                )}

                {getFormValue("email_provider") === "brevo" && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="smtp_username">SMTP Login</Label>
                      <Input 
                        id="smtp_username" 
                        placeholder="e.g. 7fecae001@smtp-brevo.com"
                        value={getFormValue("smtp_username")}
                        onChange={(e) => updateFormValue("smtp_username", e.target.value)}
                        data-testid="input-brevo-smtp-login"
                      />
                      <p className="text-xs text-gray-400">Brevo &gt; Settings &gt; SMTP &amp; API &gt; SMTP tab &gt; Login</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="smtp_password">SMTP Key (Master Password)</Label>
                      <div className="relative">
                        <Input 
                          id="smtp_password" 
                          type={showSmtpKey ? "text" : "password"}
                          placeholder="Your Brevo SMTP key from SMTP tab"
                          value={getFormValue("smtp_password")}
                          onChange={(e) => updateFormValue("smtp_password", e.target.value)}
                          data-testid="input-brevo-smtp-key"
                          className="pr-10"
                        />
                        <button
                          type="button"
                          onClick={() => setShowSmtpKey(!showSmtpKey)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                          data-testid="button-toggle-smtp-key"
                        >
                          {showSmtpKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <p className="text-xs text-gray-400">Brevo &gt; Settings &gt; SMTP &amp; API &gt; SMTP tab &gt; Your SMTP Keys &gt; Click eye icon to copy full key</p>
                    </div>
                    <div className="p-3 rounded-lg bg-blue-50 border border-blue-200 text-sm text-blue-700">
                      <strong>How Brevo email works:</strong>
                      <ul className="mt-1 list-disc list-inside space-y-1">
                        <li><strong>SMTP Login</strong> — Found in SMTP tab (e.g. 7fecae001@smtp-brevo.com)</li>
                        <li><strong>SMTP Key</strong> — Found in SMTP tab under "Your SMTP Keys" (click eye icon)</li>
                        <li><strong>API Key</strong> — Found in "API keys &amp; MCP" tab (starts with xkeysib-), used as backup</li>
                      </ul>
                    </div>
                  </div>
                )}

                {getFormValue("email_provider") === "ses" && (
                  <div className="p-3 rounded-lg bg-gray-50 border text-sm text-gray-600">
                    <strong>AWS SES:</strong> Create access keys in <a href="https://console.aws.amazon.com/iam/" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">AWS IAM Console</a>. Ensure SES is set up in your desired region and your domain/email is verified.
                  </div>
                )}

                <div className="pt-4 border-t">
                  <Button 
                    onClick={() => saveCategory("email", [
                      "email_provider", "email_from_name", "email_from_address", "email_api_key",
                      "smtp_host", "smtp_port", "smtp_username", "smtp_password", "smtp_encryption"
                    ])}
                    className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                    disabled={saveSettingsMutation.isPending}
                    data-testid="button-save-email"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    Save Provider Settings
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white/80 backdrop-blur border-gray-200/50">
              <CardHeader>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-violet-500" />
                  Email Templates & Assignments
                </CardTitle>
                <CardDescription>Manage email templates, assign them to system events, and track delivery</CardDescription>
              </CardHeader>
              <CardContent>
                <EmailTemplateManager />
              </CardContent>
            </Card>
          </div>
        )}

        {activeSection === "sms" && (
          <Card className="bg-white/80 backdrop-blur border-gray-200/50">
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-violet-500" />
                  SMS & WhatsApp Configuration
                </CardTitle>
                <CardDescription className="flex items-center gap-2">
                  Transactional SMS & WhatsApp via MSG91
                  {smsStatus && (
                    <Badge className={smsStatus.ready ? "bg-emerald-100 text-emerald-700 ml-2" : "bg-red-100 text-red-700 ml-2"}>
                      {smsStatus.ready ? "Connected" : "Not Configured"}
                    </Badge>
                  )}
                </CardDescription>
              </div>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                data-testid="button-add-sms-template"
                onClick={() => {
                  setSmsAddName("");
                  setSmsAddBody("");
                  setSmsAddVars("");
                  setSmsAddChannel("sms");
                  setSmsAddSmsTemplateId("");
                  setSmsAddWaTemplateName("");
                  setSmsAddOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Template
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-violet-50 border border-violet-200">
                <div className="flex items-center gap-2 mb-2">
                  <span className="font-semibold text-violet-900">MSG91 SMS & WhatsApp API</span>
                </div>
                <p className="text-xs text-violet-700 mb-3">Messages are sent via MSG91 SMS + WhatsApp APIs. Get your Auth Key from <a href="https://control.msg91.com/app/settings" target="_blank" rel="noopener noreferrer" className="underline font-medium">MSG91 Dashboard &gt; Settings</a>. Set up WhatsApp templates in <a href="https://control.msg91.com/app/whatsapp" target="_blank" rel="noopener noreferrer" className="underline font-medium">MSG91 WhatsApp</a>.</p>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="msg91_auth_key">MSG91 Auth Key</Label>
                  <Input 
                    id="msg91_auth_key" 
                    type="password"
                    placeholder="Enter MSG91 Auth Key"
                    value={getFormValue("msg91_auth_key")}
                    onChange={(e) => updateFormValue("msg91_auth_key", e.target.value)}
                    data-testid="input-msg91-auth-key"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="msg91_sender_id">SMS Sender ID</Label>
                  <Input 
                    id="msg91_sender_id" 
                    placeholder="SAMIKR (6 chars)"
                    maxLength={6}
                    value={getFormValue("msg91_sender_id")}
                    onChange={(e) => updateFormValue("msg91_sender_id", e.target.value)}
                    data-testid="input-msg91-sender-id"
                  />
                  <p className="text-xs text-gray-400">6-character DLT approved sender ID</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="msg91_whatsapp_number">WhatsApp Integrated Number</Label>
                  <Input 
                    id="msg91_whatsapp_number" 
                    placeholder="919876543210"
                    value={getFormValue("msg91_whatsapp_number")}
                    onChange={(e) => updateFormValue("msg91_whatsapp_number", e.target.value)}
                    data-testid="input-msg91-whatsapp-number"
                  />
                  <p className="text-xs text-gray-400">MSG91 WhatsApp integrated number (with country code)</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="msg91_default_channel">Default Channel</Label>
                  <Select value={getFormValue("msg91_default_channel") || "sms"} onValueChange={(v) => updateFormValue("msg91_default_channel", v)}>
                    <SelectTrigger data-testid="select-msg91-default-channel">
                      <SelectValue placeholder="Select default channel" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="sms">SMS Only</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
                      <SelectItem value="both">SMS + WhatsApp</SelectItem>
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">Default channel for templates without a specific channel set</p>
                </div>
              </div>

              {smsStatus && (
                <div className="space-y-2">
                  <div className={`p-3 rounded-lg border text-sm ${smsStatus.ready ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"}`}>
                    {smsStatus.ready ? (
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>MSG91 connected. Sender ID: <strong>{smsStatus.senderId}</strong></span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" />
                        <span>Enter your MSG91 Auth Key above and save to enable messaging.</span>
                      </div>
                    )}
                  </div>
                  {smsStatus.hasWhatsappNumber && (
                    <div className="p-3 rounded-lg border text-sm bg-green-50 border-green-200 text-green-800">
                      <div className="flex items-center gap-2">
                        <CheckCircle className="w-4 h-4" />
                        <span>WhatsApp channel configured</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div className="pt-4 border-t">
                <h4 className="font-medium text-gray-800 mb-4">Message Templates</h4>
                <p className="text-xs text-gray-500 mb-4">Templates use {"{{variable}}"} placeholders. Each template can be sent via SMS, WhatsApp, or both. Configure MSG91 template IDs in each template's edit dialog.</p>
                <div className="space-y-3">
                  {smsTemplates.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-30" />
                      <p>No SMS templates yet</p>
                    </div>
                  ) : (
                    smsTemplates.map((template) => (
                      <div key={template.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                        <div className="flex items-center gap-4 flex-1 min-w-0">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${template.channel === "whatsapp" ? "bg-green-100" : template.channel === "both" ? "bg-gradient-to-br from-violet-100 to-green-100" : "bg-violet-100"}`}>
                            <MessageSquare className={`w-5 h-5 ${template.channel === "whatsapp" ? "text-green-600" : "text-violet-600"}`} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                              <p className="font-medium text-gray-800">{template.name}</p>
                              <Badge className={
                                template.channel === "whatsapp" ? "bg-green-100 text-green-700 text-[10px] px-1.5 py-0" :
                                template.channel === "both" ? "bg-gradient-to-r from-violet-100 to-green-100 text-violet-700 text-[10px] px-1.5 py-0" :
                                "bg-violet-100 text-violet-700 text-[10px] px-1.5 py-0"
                              }>
                                {template.channel === "whatsapp" ? "WhatsApp" : template.channel === "both" ? "SMS + WA" : "SMS"}
                              </Badge>
                              <span className="text-[10px] text-gray-400">{template.body.length} chars</span>
                            </div>
                            <p className="text-sm text-gray-500 truncate max-w-[400px]">{template.body}</p>
                            {template.variables && (
                              <p className="text-[10px] text-gray-400 mt-1">Variables: {template.variables}</p>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-1 flex-shrink-0">
                          <Badge className={template.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}>
                            {template.isActive ? "Active" : "Inactive"}
                          </Badge>
                          <Button size="icon" variant="ghost" title="Preview"
                            data-testid={`button-preview-sms-${template.id}`}
                            onClick={() => {
                              setSmsPreviewTemplate(template);
                              setSmsPreviewOpen(true);
                              fetch(`/api/sysctrl/sms-templates/${template.id}/preview`, { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" })
                                .then(r => r.json()).then(d => setSmsPreviewRendered(d.rendered || template.body)).catch(() => {});
                            }}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Edit"
                            data-testid={`button-edit-sms-${template.id}`}
                            onClick={() => {
                              setSmsEditTemplate(template);
                              setSmsEditName(template.name);
                              setSmsEditBody(template.body);
                              setSmsEditVars(template.variables || "");
                              setSmsEditChannel(template.channel || "sms");
                              setSmsEditSmsTemplateId(template.msg91SmsTemplateId || "");
                              setSmsEditWaTemplateName(template.msg91WhatsappTemplateName || "");
                              setSmsEditActive(template.isActive);
                              setSmsEditOpen(true);
                            }}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Send Test"
                            data-testid={`button-test-sms-${template.id}`}
                            onClick={() => {
                              setSmsTestTemplate(template);
                              setSmsTestPhone("");
                              setSmsTestOpen(true);
                            }}>
                            <Send className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" title="Delete" className="text-red-500 hover:text-red-700"
                            data-testid={`button-delete-sms-${template.id}`}
                            onClick={async () => {
                              if (!confirm(`Delete template "${template.name}"?`)) return;
                              await apiRequest("DELETE", `/api/sysctrl/sms-templates/${template.id}`);
                              queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/sms-templates"] });
                              toast({ title: "Deleted", description: "Template deleted." });
                            }}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  onClick={() => saveCategory("sms", [
                    "msg91_auth_key", "msg91_sender_id", "msg91_whatsapp_number", "msg91_default_channel"
                  ])}
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  disabled={saveSettingsMutation.isPending}
                  data-testid="button-save-sms"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save MSG91 Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <Dialog open={smsPreviewOpen} onOpenChange={setSmsPreviewOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Eye className="w-5 h-5 text-violet-500" />
                Message Preview
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4">
              {smsPreviewTemplate && (
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-600">{smsPreviewTemplate.name}</span>
                    <Badge className={
                      smsPreviewTemplate.channel === "whatsapp" ? "bg-green-100 text-green-700" :
                      smsPreviewTemplate.channel === "both" ? "bg-gradient-to-r from-violet-100 to-green-100 text-violet-700" :
                      "bg-violet-100 text-violet-700"
                    }>
                      {smsPreviewTemplate.channel === "whatsapp" ? "WhatsApp" : smsPreviewTemplate.channel === "both" ? "SMS + WhatsApp" : "SMS"}
                    </Badge>
                  </div>
                  <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                    <button
                      className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${smsPreviewTab === "sms" ? "bg-white text-violet-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                      onClick={() => setSmsPreviewTab("sms")}
                      data-testid="tab-preview-sms"
                    >
                      SMS Preview
                    </button>
                    <button
                      className={`flex-1 py-1.5 px-3 rounded-md text-sm font-medium transition-colors ${smsPreviewTab === "whatsapp" ? "bg-white text-green-700 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
                      onClick={() => setSmsPreviewTab("whatsapp")}
                      data-testid="tab-preview-whatsapp"
                    >
                      WhatsApp Preview
                    </button>
                  </div>

                  {smsPreviewTab === "sms" ? (
                    <div className="space-y-3">
                      <div className="mx-auto w-[280px] rounded-2xl border-2 p-2 border-gray-300 bg-gray-100">
                        <div className="rounded-xl bg-white p-4 shadow-sm min-h-[120px]">
                          <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3" />
                            SAMIKR
                          </div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap">{smsPreviewRendered || smsPreviewTemplate.body}</p>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-gray-500">
                        <p><span className="font-medium">Characters:</span> {(smsPreviewRendered || smsPreviewTemplate.body).length}</p>
                        <p><span className="font-medium">Segments:</span> {Math.ceil((smsPreviewRendered || smsPreviewTemplate.body).length / 160)}</p>
                        {smsPreviewTemplate.msg91SmsTemplateId && (
                          <p><span className="font-medium">MSG91 Template ID:</span> {smsPreviewTemplate.msg91SmsTemplateId}</p>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="mx-auto w-[300px] rounded-2xl border-2 border-green-200 bg-[#e5ddd5] p-3">
                        <div className="flex items-center gap-2 mb-3 pb-2 border-b border-green-300/50">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white text-xs font-bold">SO</div>
                          <div>
                            <p className="text-sm font-medium text-gray-800">Samikaran Olympiad</p>
                            <p className="text-[10px] text-gray-500">Business Account</p>
                          </div>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm relative ml-0 mr-8 min-h-[80px]">
                          <div className="absolute -left-1 top-2 w-3 h-3 bg-white transform rotate-45"></div>
                          <p className="text-sm text-gray-800 whitespace-pre-wrap leading-relaxed">{smsPreviewRendered || smsPreviewTemplate.body}</p>
                          <div className="flex items-center justify-end gap-1 mt-2">
                            <span className="text-[10px] text-gray-400">10:30 AM</span>
                            <svg className="w-4 h-3 text-blue-400" viewBox="0 0 16 11" fill="none">
                              <path d="M11.071 0.929L4.5 7.5L1.929 4.929" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                              <path d="M14.071 0.929L7.5 7.5L6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      <div className="space-y-1 text-xs text-gray-500">
                        {smsPreviewTemplate.msg91WhatsappTemplateName && (
                          <p><span className="font-medium">MSG91 WA Template:</span> {smsPreviewTemplate.msg91WhatsappTemplateName}</p>
                        )}
                        {smsPreviewTemplate.variables && (
                          <p><span className="font-medium">Variables:</span> {smsPreviewTemplate.variables}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={smsEditOpen} onOpenChange={setSmsEditOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Edit className="w-5 h-5 text-violet-500" />
                Edit Template
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input value={smsEditName} onChange={(e) => setSmsEditName(e.target.value)} data-testid="input-sms-edit-name" />
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={smsEditChannel} onValueChange={setSmsEditChannel}>
                  <SelectTrigger data-testid="select-sms-edit-channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS Only</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
                    <SelectItem value="both">SMS + WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Message Body</Label>
                  <span className={`text-xs ${smsEditBody.length > 160 ? "text-amber-600" : "text-gray-400"}`}>
                    {smsEditBody.length}/160 chars ({Math.ceil(smsEditBody.length / 160)} segment{Math.ceil(smsEditBody.length / 160) !== 1 ? "s" : ""})
                  </span>
                </div>
                <Textarea
                  value={smsEditBody}
                  onChange={(e) => setSmsEditBody(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                  data-testid="input-sms-edit-body"
                />
                <p className="text-xs text-gray-400">{"Use {{variable}} placeholders. This body is used for display and SMS."}</p>
              </div>
              <div className="space-y-2">
                <Label>Variables (comma-separated)</Label>
                <Input
                  value={smsEditVars}
                  onChange={(e) => setSmsEditVars(e.target.value)}
                  placeholder="name,otp,validity_minutes"
                  data-testid="input-sms-edit-vars"
                />
              </div>
              {(smsEditChannel === "sms" || smsEditChannel === "both") && (
                <div className="space-y-2 p-3 rounded-lg border border-violet-200 bg-violet-50">
                  <Label className="text-violet-700">MSG91 SMS Template ID</Label>
                  <Input
                    value={smsEditSmsTemplateId}
                    onChange={(e) => setSmsEditSmsTemplateId(e.target.value)}
                    placeholder="e.g., 6123abc456def789"
                    data-testid="input-sms-edit-template-id"
                  />
                  <p className="text-[10px] text-violet-600">Get this from MSG91 Dashboard &gt; SMS &gt; Templates</p>
                </div>
              )}
              {(smsEditChannel === "whatsapp" || smsEditChannel === "both") && (
                <div className="space-y-2 p-3 rounded-lg border border-green-200 bg-green-50">
                  <Label className="text-green-700">MSG91 WhatsApp Template Name</Label>
                  <Input
                    value={smsEditWaTemplateName}
                    onChange={(e) => setSmsEditWaTemplateName(e.target.value)}
                    placeholder="e.g., otp_verification"
                    data-testid="input-sms-edit-wa-template"
                  />
                  <p className="text-[10px] text-green-600">Get this from MSG91 Dashboard &gt; WhatsApp &gt; Templates</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Switch checked={smsEditActive} onCheckedChange={setSmsEditActive} data-testid="switch-sms-edit-active" />
                <Label>Active</Label>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => setSmsEditOpen(false)}>Cancel</Button>
              <Button
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                disabled={smsEditSaving || !smsEditName || !smsEditBody}
                data-testid="button-sms-edit-save"
                onClick={async () => {
                  if (!smsEditTemplate) return;
                  setSmsEditSaving(true);
                  try {
                    await apiRequest("PUT", `/api/sysctrl/sms-templates/${smsEditTemplate.id}`, {
                      name: smsEditName,
                      body: smsEditBody,
                      variables: smsEditVars,
                      channel: smsEditChannel,
                      msg91SmsTemplateId: smsEditSmsTemplateId,
                      msg91WhatsappTemplateName: smsEditWaTemplateName,
                      isActive: smsEditActive,
                    });
                    queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/sms-templates"] });
                    toast({ title: "Saved", description: "Template updated." });
                    setSmsEditOpen(false);
                  } catch (err: any) {
                    toast({ title: "Error", description: err.message || "Failed to save", variant: "destructive" });
                  } finally {
                    setSmsEditSaving(false);
                  }
                }}
              >
                {smsEditSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={smsTestOpen} onOpenChange={setSmsTestOpen}>
          <DialogContent className="max-w-md max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Send className="w-5 h-5 text-violet-500" />
                Send Test SMS
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              {smsTestTemplate && (
                <div className="p-3 rounded-lg border bg-violet-50 border-violet-200">
                  <p className="text-sm font-medium mb-1">{smsTestTemplate.name}</p>
                  <p className="text-xs text-gray-600 line-clamp-2">{smsTestTemplate.body}</p>
                </div>
              )}
              <div className="space-y-2">
                <Label>Phone Number</Label>
                <Input
                  value={smsTestPhone}
                  onChange={(e) => setSmsTestPhone(e.target.value)}
                  placeholder="919876543210"
                  data-testid="input-sms-test-phone"
                />
                <p className="text-xs text-gray-400">With country code, no + (e.g., 919876543210)</p>
              </div>
            </div>
            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => setSmsTestOpen(false)}>Cancel</Button>
              <Button
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                disabled={smsTestSending || !smsTestPhone}
                data-testid="button-sms-test-send"
                onClick={async () => {
                  setSmsTestSending(true);
                  try {
                    const res = await apiRequest("POST", "/api/sysctrl/sms-test", {
                      to: smsTestPhone,
                      templateId: smsTestTemplate?.id,
                    });
                    const data = await res.json();
                    toast({ title: "Sent!", description: data.message || "Test message sent successfully." });
                    setSmsTestOpen(false);
                  } catch (err: any) {
                    toast({ title: "Failed", description: err.message || "Failed to send test message", variant: "destructive" });
                  } finally {
                    setSmsTestSending(false);
                  }
                }}
              >
                {smsTestSending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
                Send Test
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Dialog open={smsAddOpen} onOpenChange={setSmsAddOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] flex flex-col overflow-hidden">
            <DialogHeader className="flex-shrink-0">
              <DialogTitle className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-violet-500" />
                Add Template
              </DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto py-4 space-y-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={smsAddName}
                  onChange={(e) => setSmsAddName(e.target.value)}
                  placeholder="e.g., Exam Confirmation"
                  data-testid="input-sms-add-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Channel</Label>
                <Select value={smsAddChannel} onValueChange={setSmsAddChannel}>
                  <SelectTrigger data-testid="select-sms-add-channel">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sms">SMS Only</SelectItem>
                    <SelectItem value="whatsapp">WhatsApp Only</SelectItem>
                    <SelectItem value="both">SMS + WhatsApp</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Message Body</Label>
                  <span className={`text-xs ${smsAddBody.length > 160 ? "text-amber-600" : "text-gray-400"}`}>
                    {smsAddBody.length}/160 chars
                  </span>
                </div>
                <Textarea
                  value={smsAddBody}
                  onChange={(e) => setSmsAddBody(e.target.value)}
                  rows={4}
                  className="font-mono text-sm"
                  placeholder={"Dear {{name}}, your exam is confirmed for {{exam_date}}."}
                  data-testid="input-sms-add-body"
                />
              </div>
              <div className="space-y-2">
                <Label>Variables (comma-separated)</Label>
                <Input
                  value={smsAddVars}
                  onChange={(e) => setSmsAddVars(e.target.value)}
                  placeholder="name,exam_date"
                  data-testid="input-sms-add-vars"
                />
              </div>
              {(smsAddChannel === "sms" || smsAddChannel === "both") && (
                <div className="space-y-2 p-3 rounded-lg border border-violet-200 bg-violet-50">
                  <Label className="text-violet-700">MSG91 SMS Template ID</Label>
                  <Input
                    value={smsAddSmsTemplateId}
                    onChange={(e) => setSmsAddSmsTemplateId(e.target.value)}
                    placeholder="e.g., 6123abc456def789"
                    data-testid="input-sms-add-template-id"
                  />
                </div>
              )}
              {(smsAddChannel === "whatsapp" || smsAddChannel === "both") && (
                <div className="space-y-2 p-3 rounded-lg border border-green-200 bg-green-50">
                  <Label className="text-green-700">MSG91 WhatsApp Template Name</Label>
                  <Input
                    value={smsAddWaTemplateName}
                    onChange={(e) => setSmsAddWaTemplateName(e.target.value)}
                    placeholder="e.g., otp_verification"
                    data-testid="input-sms-add-wa-template"
                  />
                </div>
              )}
            </div>
            <DialogFooter className="flex-shrink-0">
              <Button variant="outline" onClick={() => setSmsAddOpen(false)}>Cancel</Button>
              <Button
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                disabled={smsAddSaving || !smsAddName || !smsAddBody}
                data-testid="button-sms-add-save"
                onClick={async () => {
                  setSmsAddSaving(true);
                  try {
                    await apiRequest("POST", "/api/sysctrl/sms-templates", {
                      name: smsAddName,
                      body: smsAddBody,
                      variables: smsAddVars,
                      channel: smsAddChannel,
                      msg91SmsTemplateId: smsAddSmsTemplateId,
                      msg91WhatsappTemplateName: smsAddWaTemplateName,
                      isActive: true,
                    });
                    queryClient.invalidateQueries({ queryKey: ["/api/sysctrl/sms-templates"] });
                    toast({ title: "Created", description: "Template created." });
                    setSmsAddOpen(false);
                  } catch (err: any) {
                    toast({ title: "Error", description: err.message || "Failed to create template", variant: "destructive" });
                  } finally {
                    setSmsAddSaving(false);
                  }
                }}
              >
                {smsAddSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Plus className="w-4 h-4 mr-2" />}
                Add Template
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {activeSection === "storage" && (
          <StorageSettingsSection
            getFormValue={getFormValue}
            updateFormValue={updateFormValue}
            saveCategory={saveCategory}
            saveSettingsMutation={saveSettingsMutation}
          />
        )}

        {activeSection === "plugins" && (
          <Card className="bg-white/80 backdrop-blur border-gray-200/50">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <Puzzle className="w-5 h-5 text-violet-500" />
                Plugins & Integrations
              </CardTitle>
              <CardDescription>Enable or disable platform integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center">
                    <Settings className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">AI Question Generation</p>
                    <p className="text-sm text-gray-500">Generate questions using OpenAI</p>
                  </div>
                </div>
                <Switch defaultChecked data-testid="switch-ai-generation" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-blue-500 flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Live Proctoring</p>
                    <p className="text-sm text-gray-500">Real-time exam monitoring with camera</p>
                  </div>
                </div>
                <Switch defaultChecked data-testid="switch-proctoring" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500 flex items-center justify-center">
                    <RefreshCw className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Referral System</p>
                    <p className="text-sm text-gray-500">Enable referral discounts for students</p>
                  </div>
                </div>
                <Switch defaultChecked data-testid="switch-referrals" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-amber-500 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Multi-Language Support</p>
                    <p className="text-sm text-gray-500">Enable content translation</p>
                  </div>
                </div>
                <Switch data-testid="switch-multilang" />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-red-500 flex items-center justify-center">
                    <Bell className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-800">Push Notifications</p>
                    <p className="text-sm text-gray-500">Send push notifications to users</p>
                  </div>
                </div>
                <Switch data-testid="switch-push" />
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === "languages" && (
          <Card className="bg-white/80 backdrop-blur border-gray-200/50">
            <CardHeader className="flex flex-row items-center justify-between gap-4 flex-wrap">
              <div>
                <CardTitle className="text-gray-800 flex items-center gap-2">
                  <LanguagesIcon className="w-5 h-5 text-violet-500" />
                  Language Management
                </CardTitle>
                <CardDescription>Manage supported languages and translations</CardDescription>
              </div>
              <Button 
                size="sm" 
                className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                data-testid="button-add-language"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Language
              </Button>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {languages.length === 0 ? (
                  <>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center text-lg">
                          🇺🇸
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">English</p>
                          <p className="text-sm text-gray-500">en - Default Language</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-violet-100 text-violet-700">Default</Badge>
                        <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                      </div>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-orange-100 flex items-center justify-center text-lg">
                          🇮🇳
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">Hindi</p>
                          <p className="text-sm text-gray-500">hi - हिन्दी</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className="bg-emerald-100 text-emerald-700">Active</Badge>
                        <Button size="icon" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </>
                ) : (
                  languages.map((lang) => (
                    <div key={lang.id} className="flex items-center justify-between p-4 rounded-lg bg-gray-50">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-violet-100 flex items-center justify-center">
                          <LanguagesIcon className="w-5 h-5 text-violet-600" />
                        </div>
                        <div>
                          <p className="font-medium text-gray-800">{lang.name}</p>
                          <p className="text-sm text-gray-500">{lang.code} - {lang.nativeName}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {lang.isDefault && <Badge className="bg-violet-100 text-violet-700">Default</Badge>}
                        <Badge className={lang.isActive ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-600"}>
                          {lang.isActive ? "Active" : "Inactive"}
                        </Badge>
                        <Button size="icon" variant="ghost">
                          <Edit className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === "logos" && (
          <Card className="bg-white/80 backdrop-blur border-gray-200/50">
            <CardHeader>
              <CardTitle className="text-gray-800 flex items-center gap-2">
                <Image className="w-5 h-5 text-violet-500" />
                Logo & Branding Assets
              </CardTitle>
              <CardDescription>Upload and manage platform logos and branding</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-4">
                  <Label>Primary Logo (Light Mode)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                    <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                    <p className="text-sm text-gray-500 mb-2">Drag and drop or click to upload</p>
                    <p className="text-xs text-gray-400">PNG, SVG up to 2MB (300x100 recommended)</p>
                    <Button variant="outline" size="sm" className="mt-4" data-testid="button-upload-logo-light">
                      Choose File
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Primary Logo (Dark Mode)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center bg-gray-900">
                    <Upload className="w-10 h-10 mx-auto mb-3 text-gray-500" />
                    <p className="text-sm text-gray-400 mb-2">Drag and drop or click to upload</p>
                    <p className="text-xs text-gray-500">PNG, SVG up to 2MB (300x100 recommended)</p>
                    <Button variant="outline" size="sm" className="mt-4" data-testid="button-upload-logo-dark">
                      Choose File
                    </Button>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-3">
                <div className="space-y-4">
                  <Label>Favicon</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-lg bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-2xl">
                      S
                    </div>
                    <Button variant="outline" size="sm" data-testid="button-upload-favicon">
                      Change
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>App Icon (iOS/Android)</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-3 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-2xl">
                      S
                    </div>
                    <Button variant="outline" size="sm" data-testid="button-upload-app-icon">
                      Change
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  <Label>Email Header Logo</Label>
                  <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                    <Mail className="w-16 h-16 mx-auto mb-3 text-gray-300" />
                    <Button variant="outline" size="sm" data-testid="button-upload-email-logo">
                      Upload
                    </Button>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-lg bg-gray-50 space-y-4">
                <h4 className="font-medium text-gray-800 flex items-center gap-2">
                  <Palette className="w-4 h-4" />
                  Brand Colors
                </h4>
                <div className="grid gap-4 md:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor="color_primary">Primary</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-violet-500" />
                      <Input 
                        id="color_primary" 
                        defaultValue="#8B5CF6"
                        className="font-mono"
                        data-testid="input-color-primary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color_secondary">Secondary</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-fuchsia-500" />
                      <Input 
                        id="color_secondary" 
                        defaultValue="#D946EF"
                        className="font-mono"
                        data-testid="input-color-secondary"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color_accent">Accent</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-amber-500" />
                      <Input 
                        id="color_accent" 
                        defaultValue="#F59E0B"
                        className="font-mono"
                        data-testid="input-color-accent"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="color_success">Success</Label>
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-lg bg-emerald-500" />
                      <Input 
                        id="color_success" 
                        defaultValue="#10B981"
                        className="font-mono"
                        data-testid="input-color-success"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t">
                <Button 
                  className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
                  data-testid="button-save-logos"
                >
                  <Save className="w-4 h-4 mr-2" />
                  Save Branding Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeSection === "payments" && (
          <div className="space-y-6">
            <PaymentsAndTaxSection />
          </div>
        )}

        {activeSection === "data_export" && (
          <div className="space-y-6">
            <DataExportSection />
          </div>
        )}

        {activeSection === "data_import" && (
          <div className="space-y-6">
            <DataImportSection />
          </div>
        )}

        {activeSection === "code_export" && (
          <div className="space-y-6">
            <CodeExportSection />
          </div>
        )}

        {activeSection === "certificates" && (
          <div className="space-y-6">
            <CertificatePreviewSection />
          </div>
        )}

        {activeSection === "future_plans" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  Future Development Plans
                </CardTitle>
                <CardDescription>
                  Planned features and architectural improvements for future implementation
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="border rounded-lg overflow-hidden">
                    <div className="bg-gradient-to-r from-purple-600 to-pink-600 px-4 py-3">
                      <div className="flex items-center justify-between">
                        <h3 className="text-white font-semibold flex items-center gap-2">
                          <Server className="w-5 h-5" />
                          Split Server Architecture (Auth + Exam Servers)
                        </h3>
                        <Badge className="bg-white/20 text-white border-white/30 text-xs">
                          v1.0 | Jan 2026
                        </Badge>
                      </div>
                    </div>
                    <div className="p-4 space-y-4">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                          <Clock className="w-3 h-3 mr-1" />
                          Planned
                        </Badge>
                        <span className="text-sm text-muted-foreground">Estimated: 5-7 hours</span>
                        <span className="text-xs text-muted-foreground ml-auto">Last updated: Jan 26, 2026</span>
                      </div>
                      
                      <p className="text-sm text-gray-600">
                        Enable running login/registration on one server and exam delivery on another server for better scalability and load distribution during peak exam times.
                      </p>

                      <div className="bg-gray-50 rounded-lg p-4 dark:bg-gray-800">
                        <h4 className="font-medium mb-3">Implementation Tasks:</h4>
                        <div className="space-y-2">
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">1. Add JWT Authentication</p>
                              <p className="text-xs text-muted-foreground">Implement JWT tokens alongside current sessions (2-3 hours)</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">2. Add EXAM_SERVER_URL Environment Variable</p>
                              <p className="text-xs text-muted-foreground">Configure external exam server URL (30 mins)</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">3. Modify "Start Exam" Redirect Logic</p>
                              <p className="text-xs text-muted-foreground">Redirect to external URL when configured (1 hour)</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">4. Exam APIs JWT Validation</p>
                              <p className="text-xs text-muted-foreground">Make exam APIs validate JWT tokens (1-2 hours)</p>
                            </div>
                          </div>
                          <div className="flex items-start gap-2">
                            <div className="w-5 h-5 rounded border-2 border-gray-300 flex-shrink-0 mt-0.5" />
                            <div>
                              <p className="text-sm font-medium">5. Testing & Documentation</p>
                              <p className="text-xs text-muted-foreground">End-to-end testing of split server flow (1 hour)</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 dark:bg-blue-950/20 dark:border-blue-800">
                        <h4 className="font-medium text-blue-800 dark:text-blue-400 mb-2">How It Will Work:</h4>
                        <ul className="text-sm text-blue-700 dark:text-blue-500 space-y-1">
                          <li>• <strong>Main Domain:</strong> samikaranolympiad.com - Login, Registration, Dashboard, Everything else</li>
                          <li>• <strong>Exam Subdomain:</strong> exam.samikaranolympiad.com - Exam delivery & Proctoring only</li>
                          <li>• Both servers share same PostgreSQL database</li>
                          <li>• JWT tokens enable seamless authentication across domains</li>
                          <li>• Leave EXAM_SERVER_URL empty = single server mode (current)</li>
                          <li>• <strong>After exam completion:</strong> Student returns to main domain automatically</li>
                        </ul>
                      </div>

                      <div className="bg-purple-50 border border-purple-200 rounded-lg p-4 dark:bg-purple-950/20 dark:border-purple-800">
                        <h4 className="font-medium text-purple-800 dark:text-purple-400 mb-2">When Do You Need Separate Exam Server?</h4>
                        <div className="text-sm text-purple-700 dark:text-purple-500 space-y-2">
                          <div className="grid grid-cols-2 gap-4 mt-2">
                            <div className="bg-white/50 dark:bg-black/20 rounded p-3">
                              <p className="font-semibold text-purple-900 dark:text-purple-300">Single Server OK</p>
                              <p className="text-xs mt-1">Up to 500 concurrent exam takers</p>
                            </div>
                            <div className="bg-white/50 dark:bg-black/20 rounded p-3">
                              <p className="font-semibold text-purple-900 dark:text-purple-300">Separate Server Recommended</p>
                              <p className="text-xs mt-1">500+ concurrent exam takers</p>
                            </div>
                          </div>
                          <p className="text-xs mt-2 italic">Note: "Concurrent" means students taking exam at the exact same time, not total registrations.</p>
                        </div>
                      </div>

                      <div className="bg-orange-50 border border-orange-200 rounded-lg p-4 dark:bg-orange-950/20 dark:border-orange-800">
                        <h4 className="font-medium text-orange-800 dark:text-orange-400 mb-2">AWS Server Recommendations:</h4>
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-orange-200 dark:border-orange-700">
                                <th className="text-left py-2 text-orange-900 dark:text-orange-300">Concurrent Students</th>
                                <th className="text-left py-2 text-orange-900 dark:text-orange-300">Main Server</th>
                                <th className="text-left py-2 text-orange-900 dark:text-orange-300">Exam Server</th>
                                <th className="text-left py-2 text-orange-900 dark:text-orange-300">Database (RDS)</th>
                              </tr>
                            </thead>
                            <tbody className="text-orange-700 dark:text-orange-400">
                              <tr className="border-b border-orange-100 dark:border-orange-800">
                                <td className="py-2">Up to 500</td>
                                <td className="py-2">t3.medium (2 vCPU, 4GB)</td>
                                <td className="py-2">Not needed</td>
                                <td className="py-2">db.t3.medium</td>
                              </tr>
                              <tr className="border-b border-orange-100 dark:border-orange-800">
                                <td className="py-2">500 - 2,000</td>
                                <td className="py-2">t3.large (2 vCPU, 8GB)</td>
                                <td className="py-2">t3.large (2 vCPU, 8GB)</td>
                                <td className="py-2">db.t3.large</td>
                              </tr>
                              <tr className="border-b border-orange-100 dark:border-orange-800">
                                <td className="py-2">2,000 - 5,000</td>
                                <td className="py-2">t3.xlarge (4 vCPU, 16GB)</td>
                                <td className="py-2">t3.xlarge (4 vCPU, 16GB)</td>
                                <td className="py-2">db.r5.large</td>
                              </tr>
                              <tr>
                                <td className="py-2">5,000+</td>
                                <td className="py-2">c5.2xlarge (8 vCPU, 16GB)</td>
                                <td className="py-2">Multiple c5.xlarge with Load Balancer</td>
                                <td className="py-2">db.r5.xlarge + Read Replicas</td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        <p className="text-xs mt-3 text-orange-600 dark:text-orange-500">
                          <strong>Tip:</strong> Start with smaller instances and scale up based on actual usage. Use AWS Auto Scaling for exam servers during peak times.
                        </p>
                      </div>

                      <div className="bg-green-50 border border-green-200 rounded-lg p-4 dark:bg-green-950/20 dark:border-green-800">
                        <h4 className="font-medium text-green-800 dark:text-green-400 mb-2">Benefits:</h4>
                        <ul className="text-sm text-green-700 dark:text-green-500 space-y-1">
                          <li>• Better load distribution during peak exam times</li>
                          <li>• Independent scaling of exam infrastructure</li>
                          <li>• Improved reliability - main server issues won't affect ongoing exams</li>
                          <li>• Can add multiple exam servers for horizontal scaling</li>
                          <li>• Cost-effective - scale exam servers only when needed</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

      </motion.div>
    </div>
  );
}

function StorageSettingsSection({ getFormValue, updateFormValue, saveCategory, saveSettingsMutation }: {
  getFormValue: (key: string) => string;
  updateFormValue: (key: string, value: string) => void;
  saveCategory: (category: string, keys: string[]) => void;
  saveSettingsMutation: any;
}) {
  const [showSecretKey, setShowSecretKey] = useState(false);
  const selectedProvider = getFormValue("storage_provider") || "local";
  const isS3 = selectedProvider === "s3";

  const { data: storageStats, isLoading: statsLoading } = useQuery<{
    provider: string; totalFiles: number; totalSizeBytes: number; connected: boolean; error?: string;
  }>({
    queryKey: ["/api/storage/stats"],
    refetchInterval: 30000,
  });

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB", "TB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  return (
    <Card className="bg-white/80 backdrop-blur border-gray-200/50">
      <CardHeader>
        <CardTitle className="text-gray-800 flex items-center gap-2">
          <HardDrive className="w-5 h-5 text-violet-500" />
          Storage Configuration
        </CardTitle>
        <CardDescription>Configure file storage providers for uploads</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="storage_provider">Storage Provider</Label>
            <Select value={selectedProvider} onValueChange={(v) => updateFormValue("storage_provider", v)}>
              <SelectTrigger data-testid="select-storage-provider">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="local">Local Disk Storage</SelectItem>
                <SelectItem value="s3">Amazon S3</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="storage_max_size">Max Upload Size (MB)</Label>
            <Input
              id="storage_max_size"
              type="number"
              placeholder="10"
              value={getFormValue("storage_max_size")}
              onChange={(e) => updateFormValue("storage_max_size", e.target.value)}
              data-testid="input-storage-max-size"
            />
          </div>
        </div>

        {isS3 && (
          <div className="space-y-4 p-4 rounded-lg border border-orange-200 bg-orange-50/50">
            <h4 className="font-semibold text-gray-800 flex items-center gap-2">
              <Cloud className="w-4 h-4 text-orange-500" />
              Amazon S3 Configuration
            </h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="storage_bucket">S3 Bucket Name</Label>
                <Input
                  id="storage_bucket"
                  placeholder="samikaran-uploads"
                  value={getFormValue("storage_bucket")}
                  onChange={(e) => updateFormValue("storage_bucket", e.target.value)}
                  data-testid="input-storage-bucket"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage_region">AWS Region</Label>
                <Select value={getFormValue("storage_region") || ""} onValueChange={(v) => updateFormValue("storage_region", v)}>
                  <SelectTrigger data-testid="select-storage-region">
                    <SelectValue placeholder="Select region" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ap-south-1">Asia Pacific (Mumbai) - ap-south-1</SelectItem>
                    <SelectItem value="ap-south-2">Asia Pacific (Hyderabad) - ap-south-2</SelectItem>
                    <SelectItem value="ap-southeast-1">Asia Pacific (Singapore) - ap-southeast-1</SelectItem>
                    <SelectItem value="us-east-1">US East (N. Virginia) - us-east-1</SelectItem>
                    <SelectItem value="us-west-2">US West (Oregon) - us-west-2</SelectItem>
                    <SelectItem value="eu-west-1">Europe (Ireland) - eu-west-1</SelectItem>
                    <SelectItem value="eu-central-1">Europe (Frankfurt) - eu-central-1</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage_access_key">AWS Access Key ID</Label>
                <Input
                  id="storage_access_key"
                  placeholder="AKIAIOSFODNN7EXAMPLE"
                  value={getFormValue("storage_access_key")}
                  onChange={(e) => updateFormValue("storage_access_key", e.target.value)}
                  className="font-mono text-sm"
                  data-testid="input-storage-access-key"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="storage_secret_key">AWS Secret Access Key</Label>
                <div className="relative">
                  <Input
                    id="storage_secret_key"
                    type={showSecretKey ? "text" : "password"}
                    placeholder="wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY"
                    value={getFormValue("storage_secret_key")}
                    onChange={(e) => updateFormValue("storage_secret_key", e.target.value)}
                    className="font-mono text-sm pr-10"
                    data-testid="input-storage-secret-key"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecretKey(!showSecretKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showSecretKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
            <p className="text-xs text-orange-600 mt-2">
              IAM user needs s3:PutObject, s3:GetObject, s3:ListBucket, s3:HeadBucket permissions on the bucket.
            </p>
          </div>
        )}

        <div className="p-4 rounded-lg bg-gray-50 space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-gray-800">Storage Statistics</h4>
            {storageStats && (
              <Badge variant="outline" className={storageStats.connected ? "text-green-600 border-green-300" : "text-red-500 border-red-300"}>
                {storageStats.connected ? `Connected (${storageStats.provider === "s3" ? "S3" : "Local"})` : "Disconnected"}
              </Badge>
            )}
          </div>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="p-3 rounded-lg bg-white border border-gray-200">
              <p className="text-2xl font-bold text-gray-800" data-testid="text-storage-used">
                {statsLoading ? "..." : storageStats ? formatBytes(storageStats.totalSizeBytes) : "—"}
              </p>
              <p className="text-sm text-gray-500">Total Used</p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-gray-200">
              <p className="text-2xl font-bold text-gray-800" data-testid="text-storage-files">
                {statsLoading ? "..." : storageStats ? storageStats.totalFiles.toLocaleString() : "—"}
              </p>
              <p className="text-sm text-gray-500">Total Files</p>
            </div>
            <div className="p-3 rounded-lg bg-white border border-gray-200">
              <p className="text-2xl font-bold text-gray-800" data-testid="text-storage-provider">
                {statsLoading ? "..." : storageStats?.provider === "s3" ? "Amazon S3" : storageStats?.provider === "local" ? "Local Disk" : "—"}
              </p>
              <p className="text-sm text-gray-500">Active Provider</p>
            </div>
          </div>
          {storageStats?.error && (
            <p className="text-xs text-red-500">{storageStats.error}</p>
          )}
          {storageStats?.folders && storageStats.folders.length > 0 && (
            <div className="mt-3 space-y-1.5">
              <p className="text-xs font-medium text-gray-600 uppercase tracking-wide">Folder Breakdown</p>
              {storageStats.folders.map((f: any) => (
                <div key={f.name}>
                  <div className="flex items-center justify-between px-3 py-2 rounded bg-white border border-gray-100 text-sm">
                    <div className="flex items-center gap-2">
                      <Folder className="w-3.5 h-3.5 text-gray-400" />
                      <span className="font-medium text-gray-700">{f.name}/</span>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{f.fileCount} files</span>
                      <span>{formatBytes(f.sizeBytes)}</span>
                    </div>
                  </div>
                  {f.subfolders && f.subfolders.length > 0 && (
                    <div className="ml-6 mt-1 space-y-1">
                      {f.subfolders.map((sub: any) => (
                        <div key={sub.name} className="flex items-center justify-between px-3 py-1.5 rounded bg-gray-50 border border-gray-100 text-sm">
                          <div className="flex items-center gap-2">
                            <Folder className="w-3 h-3 text-gray-300" />
                            <span className="text-gray-600 text-xs">{sub.name}/</span>
                          </div>
                          <div className="flex items-center gap-4 text-xs text-gray-400">
                            <span>{sub.fileCount} files</span>
                            <span>{formatBytes(sub.sizeBytes)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="pt-4 border-t">
          <Button
            onClick={() => saveCategory("storage", [
              "storage_provider", "storage_bucket", "storage_region", "storage_max_size",
              "storage_access_key", "storage_secret_key"
            ])}
            className="bg-gradient-to-r from-violet-500 to-fuchsia-500 text-white"
            disabled={saveSettingsMutation.isPending}
            data-testid="button-save-storage"
          >
            <Save className="w-4 h-4 mr-2" />
            Save Storage Settings
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
