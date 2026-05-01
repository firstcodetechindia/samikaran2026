import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { 
  Play, Clock, CheckCircle, AlertTriangle, XCircle, 
  Activity, Shield, Zap, Database, RefreshCw, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, Minus, FileText, ArrowRight, Wrench,
  Bell, Calendar, Heart, Mail, Phone, Settings, Timer, LineChart
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { motion, AnimatePresence } from "framer-motion";

interface AuditTest {
  name: string;
  status: "passed" | "warning" | "failed";
  message?: string;
  severity?: "low" | "medium" | "high" | "critical";
}

interface ModuleResult {
  moduleName: string;
  status: "passed" | "warning" | "failed";
  score: number;
  issuesCount: number;
  tests: AuditTest[];
}

interface SecurityFinding {
  type: string;
  severity: "low" | "medium" | "high" | "critical";
  module: string;
  description: string;
  fixed: boolean;
  fixApplied?: string;
}

interface PerformanceMetrics {
  apiResponseTimes: Record<string, number>;
  dbQueryTimes: Record<string, number>;
  memoryUsage: number;
  suggestions: string[];
}

interface DatabaseHealth {
  tableCount: number;
  totalRecords: number;
  indexHealth: "good" | "needs_optimization" | "poor";
  missingIndexes: string[];
  slowQueries: string[];
  suggestions: string[];
}

interface ComparisonData {
  previousRunId: string;
  scoreChange: number;
  improved: string[];
  degraded: string[];
  unchanged: string[];
}

interface SystemAudit {
  id: number;
  runId: string;
  status: string;
  startedAt: string;
  completedAt?: string;
  runBy?: number;
  overallScore?: number;
  securityScore?: number;
  performanceScore?: number;
  databaseScore?: number;
  moduleResults?: ModuleResult[];
  securityFindings?: SecurityFinding[];
  performanceMetrics?: PerformanceMetrics;
  databaseHealth?: DatabaseHealth;
  totalTests?: number;
  passedTests?: number;
  warningTests?: number;
  failedTests?: number;
  comparisonWithPrevious?: ComparisonData;
}

interface HealthCheckStatus {
  id: number;
  endpoint: string;
  method: string;
  name: string;
  description?: string;
  is_enabled: boolean;
  expected_status: number;
  timeout_ms: number;
  last_checked_at?: string;
  last_status?: "healthy" | "degraded" | "down";
  last_response_time?: number;
  last_error?: string;
}

interface AlertConfig {
  id?: number;
  is_enabled?: boolean;
  email_enabled?: boolean;
  email_recipients?: string[];
  smtp_host?: string;
  smtp_port?: number;
  smtp_user?: string;
  smtp_from_email?: string;
  sms_enabled?: boolean;
  sms_recipients?: string[];
  twilio_phone_number?: string;
  alert_on_critical?: boolean;
  alert_on_high?: boolean;
  alert_on_medium?: boolean;
  alert_on_score_drop?: boolean;
  score_drop_threshold?: number;
}

interface ScheduleConfig {
  id?: number;
  is_enabled?: boolean;
  interval_hours?: number;
  last_run_at?: string;
  next_run_at?: string;
  auto_fix_enabled?: boolean;
}

interface AuditTrends {
  audits: { date: string; score: number; issues: number }[];
  averageScore: number;
  trend: "improving" | "stable" | "declining";
  scoreChange: number;
}

export function SystemAuditSection() {
  const { toast } = useToast();
  const [expandedModules, setExpandedModules] = useState<string[]>([]);
  const [selectedAuditId, setSelectedAuditId] = useState<string | null>(null);

  const { data: latestAudit, isLoading: loadingLatest } = useQuery<SystemAudit | null>({
    queryKey: ["/api/admin/system-audit/latest"],
  });

  const { data: auditHistory = [], isLoading: loadingHistory } = useQuery<SystemAudit[]>({
    queryKey: ["/api/admin/system-audit/history"],
  });

  const { data: selectedAudit } = useQuery<SystemAudit>({
    queryKey: [`/api/admin/system-audit/${selectedAuditId}`],
    enabled: !!selectedAuditId,
  });

  const runAuditMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/system-audit/run");
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Audit Completed",
        description: "System audit has been completed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-audit/latest"] });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-audit/history"] });
    },
    onError: (error: any) => {
      toast({
        title: "Audit Failed",
        description: error.message || "Failed to run system audit",
        variant: "destructive",
      });
    },
  });

  const autoFixMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/system-audit/auto-fix");
      return res.json();
    },
    onSuccess: (data: { fixesApplied: { name: string; count: number; description: string }[]; totalFixed: number }) => {
      if (data.totalFixed > 0) {
        toast({
          title: "Auto-Fix Applied",
          description: `Fixed ${data.totalFixed} issues: ${data.fixesApplied.map(f => f.name).join(", ")}`,
        });
      } else {
        toast({
          title: "No Issues to Fix",
          description: "All auto-fixable issues have already been resolved.",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-audit/latest"] });
    },
    onError: (error: any) => {
      toast({
        title: "Auto-Fix Failed",
        description: error.message || "Failed to apply auto-fixes",
        variant: "destructive",
      });
    },
  });

  const { data: healthStatus = [] } = useQuery<HealthCheckStatus[]>({
    queryKey: ["/api/admin/system-audit/health-status"],
  });

  const { data: alertConfig } = useQuery<AlertConfig>({
    queryKey: ["/api/admin/system-audit/alerts/config"],
  });

  const { data: scheduleConfig } = useQuery<ScheduleConfig>({
    queryKey: ["/api/admin/system-audit/schedule/config"],
  });

  const { data: auditTrends } = useQuery<AuditTrends>({
    queryKey: ["/api/admin/system-audit/trends"],
  });

  const runHealthChecksMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", "/api/admin/system-audit/health-checks");
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Health Checks Complete", description: "All API endpoints have been tested." });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-audit/health-status"] });
    },
    onError: (error: any) => {
      toast({ title: "Health Check Failed", description: error.message, variant: "destructive" });
    },
  });

  const updateAlertConfigMutation = useMutation({
    mutationFn: async (config: Partial<AlertConfig>) => {
      const res = await apiRequest("POST", "/api/admin/system-audit/alerts/config", config);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Alert Configuration Saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-audit/alerts/config"] });
    },
    onError: (error: any) => {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    },
  });

  const updateScheduleConfigMutation = useMutation({
    mutationFn: async (config: Partial<ScheduleConfig>) => {
      const res = await apiRequest("POST", "/api/admin/system-audit/schedule/config", config);
      return res.json();
    },
    onSuccess: () => {
      toast({ title: "Schedule Configuration Saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-audit/schedule/config"] });
    },
    onError: (error: any) => {
      toast({ title: "Save Failed", description: error.message, variant: "destructive" });
    },
  });

  const toggleScheduleMutation = useMutation({
    mutationFn: async (enable: boolean) => {
      const endpoint = enable ? "/api/admin/system-audit/schedule/start" : "/api/admin/system-audit/schedule/stop";
      const res = await apiRequest("POST", endpoint);
      return res.json();
    },
    onSuccess: (_, enable) => {
      toast({ title: enable ? "Scheduled Audits Started" : "Scheduled Audits Stopped" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/system-audit/schedule/config"] });
    },
    onError: (error: any) => {
      toast({ title: "Action Failed", description: error.message, variant: "destructive" });
    },
  });

  const currentAudit = selectedAudit || latestAudit;

  const toggleModule = (moduleName: string) => {
    setExpandedModules(prev => 
      prev.includes(moduleName) 
        ? prev.filter(m => m !== moduleName)
        : [...prev, moduleName]
    );
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "passed": return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "warning": return <AlertTriangle className="w-4 h-4 text-amber-500" />;
      case "failed": return <XCircle className="w-4 h-4 text-red-500" />;
      default: return <Activity className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "passed": return <Badge className="bg-green-100 text-green-700 border-green-200">Passed</Badge>;
      case "warning": return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Warning</Badge>;
      case "failed": return <Badge className="bg-red-100 text-red-700 border-red-200">Failed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical": return <Badge className="bg-red-600 text-white">Critical</Badge>;
      case "high": return <Badge className="bg-red-100 text-red-700">High</Badge>;
      case "medium": return <Badge className="bg-amber-100 text-amber-700">Medium</Badge>;
      case "low": return <Badge className="bg-blue-100 text-blue-700">Low</Badge>;
      default: return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) return "text-green-600";
    if (score >= 70) return "text-amber-600";
    return "text-red-600";
  };

  const getProgressColor = (score: number) => {
    if (score >= 90) return "bg-green-500";
    if (score >= 70) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">System Audit & Health Report</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Comprehensive system health monitoring, security analysis, and performance metrics
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={() => autoFixMutation.mutate()}
            disabled={autoFixMutation.isPending || runAuditMutation.isPending}
            variant="outline"
            className="border-amber-500 text-amber-600 hover:bg-amber-50"
            data-testid="button-auto-fix"
          >
            {autoFixMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Fixing...
              </>
            ) : (
              <>
                <Wrench className="w-4 h-4 mr-2" />
                Auto-Fix Issues
              </>
            )}
          </Button>
          <Button
            onClick={() => runAuditMutation.mutate()}
            disabled={runAuditMutation.isPending}
            className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
            data-testid="button-run-audit"
          >
            {runAuditMutation.isPending ? (
              <>
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                Running Audit...
              </>
            ) : (
              <>
                <Play className="w-4 h-4 mr-2" />
                Run System Audit
              </>
            )}
          </Button>
        </div>
      </div>

      {currentAudit ? (
        <div className="space-y-6">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              Last Run: {currentAudit.completedAt ? new Date(currentAudit.completedAt).toLocaleString() : "In Progress"}
            </span>
            <span>Run ID: {currentAudit.runId}</span>
            {currentAudit.status === "running" && (
              <Badge className="bg-blue-100 text-blue-700 animate-pulse">Running...</Badge>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-purple-50 to-white border-purple-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Overall Score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(currentAudit.overallScore || 0)}`}>
                      {currentAudit.overallScore || 0}%
                    </p>
                  </div>
                  <Activity className="w-10 h-10 text-purple-500 opacity-50" />
                </div>
                <Progress 
                  value={currentAudit.overallScore || 0} 
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-50 to-white border-green-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Security Score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(currentAudit.securityScore || 0)}`}>
                      {currentAudit.securityScore || 0}%
                    </p>
                  </div>
                  <Shield className="w-10 h-10 text-green-500 opacity-50" />
                </div>
                <Progress 
                  value={currentAudit.securityScore || 0} 
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-50 to-white border-blue-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Performance Score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(currentAudit.performanceScore || 0)}`}>
                      {currentAudit.performanceScore || 0}%
                    </p>
                  </div>
                  <Zap className="w-10 h-10 text-blue-500 opacity-50" />
                </div>
                <Progress 
                  value={currentAudit.performanceScore || 0} 
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-amber-50 to-white border-amber-100">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Database Score</p>
                    <p className={`text-3xl font-bold ${getScoreColor(currentAudit.databaseScore || 0)}`}>
                      {currentAudit.databaseScore || 0}%
                    </p>
                  </div>
                  <Database className="w-10 h-10 text-amber-500 opacity-50" />
                </div>
                <Progress 
                  value={currentAudit.databaseScore || 0} 
                  className="mt-3 h-2"
                />
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-gray-900">{currentAudit.totalTests || 0}</p>
                <p className="text-sm text-muted-foreground">Total Tests</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-green-600">{currentAudit.passedTests || 0}</p>
                <p className="text-sm text-muted-foreground">Passed</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-amber-600">{currentAudit.warningTests || 0}</p>
                <p className="text-sm text-muted-foreground">Warnings</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-red-600">{currentAudit.failedTests || 0}</p>
                <p className="text-sm text-muted-foreground">Failed</p>
              </CardContent>
            </Card>
          </div>

          {currentAudit.comparisonWithPrevious && (
            <Card className="border-purple-200 bg-purple-50/50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  Comparison with Previous Run
                </CardTitle>
                <CardDescription>
                  Comparing with run: {currentAudit.comparisonWithPrevious.previousRunId}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-2">
                    {currentAudit.comparisonWithPrevious.scoreChange > 0 ? (
                      <TrendingUp className="w-5 h-5 text-green-500" />
                    ) : currentAudit.comparisonWithPrevious.scoreChange < 0 ? (
                      <TrendingDown className="w-5 h-5 text-red-500" />
                    ) : (
                      <Minus className="w-5 h-5 text-gray-500" />
                    )}
                    <span className={`font-semibold ${
                      currentAudit.comparisonWithPrevious.scoreChange > 0 ? "text-green-600" :
                      currentAudit.comparisonWithPrevious.scoreChange < 0 ? "text-red-600" : "text-gray-600"
                    }`}>
                      {currentAudit.comparisonWithPrevious.scoreChange > 0 ? "+" : ""}
                      {currentAudit.comparisonWithPrevious.scoreChange}% Score Change
                    </span>
                  </div>
                  <Separator orientation="vertical" className="h-8" />
                  <div className="flex gap-4">
                    {currentAudit.comparisonWithPrevious.improved.length > 0 && (
                      <div className="flex items-center gap-1 text-green-600">
                        <TrendingUp className="w-4 h-4" />
                        <span className="text-sm">{currentAudit.comparisonWithPrevious.improved.length} Improved</span>
                      </div>
                    )}
                    {currentAudit.comparisonWithPrevious.degraded.length > 0 && (
                      <div className="flex items-center gap-1 text-red-600">
                        <TrendingDown className="w-4 h-4" />
                        <span className="text-sm">{currentAudit.comparisonWithPrevious.degraded.length} Degraded</span>
                      </div>
                    )}
                    {currentAudit.comparisonWithPrevious.unchanged.length > 0 && (
                      <div className="flex items-center gap-1 text-gray-600">
                        <Minus className="w-4 h-4" />
                        <span className="text-sm">{currentAudit.comparisonWithPrevious.unchanged.length} Unchanged</span>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Tabs defaultValue="modules" className="space-y-4">
            <TabsList className="flex-wrap h-auto gap-1">
              <TabsTrigger value="modules" data-testid="tab-modules">Module Status</TabsTrigger>
              <TabsTrigger value="security" data-testid="tab-security">Security</TabsTrigger>
              <TabsTrigger value="performance" data-testid="tab-performance">Performance</TabsTrigger>
              <TabsTrigger value="database" data-testid="tab-database">Database</TabsTrigger>
              <TabsTrigger value="health" data-testid="tab-health">Health Checks</TabsTrigger>
              <TabsTrigger value="schedule" data-testid="tab-schedule">Schedule</TabsTrigger>
              <TabsTrigger value="alerts" data-testid="tab-alerts">Alerts</TabsTrigger>
              <TabsTrigger value="trends" data-testid="tab-trends">Trends</TabsTrigger>
              <TabsTrigger value="history" data-testid="tab-history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="modules" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Module-wise Audit Results</CardTitle>
                  <CardDescription>Detailed status of each system module</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {currentAudit.moduleResults?.map((module, idx) => (
                      <div key={idx} className="border rounded-lg overflow-hidden">
                        <button
                          onClick={() => toggleModule(module.moduleName)}
                          className="w-full flex items-center justify-between p-4 hover:bg-gray-50 transition-colors"
                          data-testid={`module-${module.moduleName.toLowerCase().replace(/\s+/g, '-')}`}
                        >
                          <div className="flex items-center gap-3">
                            {getStatusIcon(module.status)}
                            <span className="font-medium">{module.moduleName}</span>
                            {getStatusBadge(module.status)}
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-right">
                              <span className={`font-semibold ${getScoreColor(module.score)}`}>
                                {module.score}%
                              </span>
                              {module.issuesCount > 0 && (
                                <span className="text-sm text-muted-foreground ml-2">
                                  ({module.issuesCount} issue{module.issuesCount !== 1 ? 's' : ''})
                                </span>
                              )}
                            </div>
                            {expandedModules.includes(module.moduleName) ? (
                              <ChevronUp className="w-5 h-5 text-gray-400" />
                            ) : (
                              <ChevronDown className="w-5 h-5 text-gray-400" />
                            )}
                          </div>
                        </button>
                        <AnimatePresence>
                          {expandedModules.includes(module.moduleName) && (
                            <motion.div
                              initial={{ height: 0, opacity: 0 }}
                              animate={{ height: "auto", opacity: 1 }}
                              exit={{ height: 0, opacity: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden"
                            >
                              <div className="p-4 pt-0 space-y-2 bg-gray-50/50">
                                {module.tests.map((test, testIdx) => (
                                  <div 
                                    key={testIdx} 
                                    className="flex items-center justify-between p-3 bg-white rounded border"
                                  >
                                    <div className="flex items-center gap-2">
                                      {getStatusIcon(test.status)}
                                      <span className="text-sm">{test.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                      {test.severity && getSeverityBadge(test.severity)}
                                      <span className="text-xs text-muted-foreground max-w-xs truncate">
                                        {test.message}
                                      </span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5 text-green-500" />
                    Security Analysis
                  </CardTitle>
                  <CardDescription>Security vulnerabilities and findings</CardDescription>
                </CardHeader>
                <CardContent>
                  {currentAudit.securityFindings && currentAudit.securityFindings.length > 0 ? (
                    <div className="space-y-3">
                      {currentAudit.securityFindings.map((finding, idx) => (
                        <div 
                          key={idx}
                          className={`p-4 rounded-lg border ${finding.fixed ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}
                        >
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-2">
                              {getSeverityBadge(finding.severity)}
                              <span className="font-medium">{finding.type}</span>
                            </div>
                            <Badge variant="outline">{finding.module}</Badge>
                          </div>
                          <p className="text-sm text-gray-600">{finding.description}</p>
                          {finding.fixed && finding.fixApplied && (
                            <p className="text-sm text-green-600 mt-2">
                              <CheckCircle className="w-4 h-4 inline mr-1" />
                              Fixed: {finding.fixApplied}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Shield className="w-12 h-12 mx-auto mb-3 text-green-500 opacity-50" />
                      <p className="font-medium text-green-600">No Security Vulnerabilities Found</p>
                      <p className="text-sm">All security checks passed successfully</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="performance">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-500" />
                    Performance Metrics
                  </CardTitle>
                  <CardDescription>API and database performance analysis</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentAudit.performanceMetrics && (
                    <>
                      <div>
                        <h4 className="font-medium mb-3">Memory Usage</h4>
                        <div className="flex items-center gap-4">
                          <Progress 
                            value={Math.min((currentAudit.performanceMetrics.memoryUsage / 1024) * 100, 100)} 
                            className="flex-1 h-3"
                          />
                          <span className="font-medium">{currentAudit.performanceMetrics.memoryUsage} MB</span>
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-3">Database Query Times</h4>
                        <div className="space-y-2">
                          {Object.entries(currentAudit.performanceMetrics.dbQueryTimes).map(([query, time]) => (
                            <div key={query} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <span className="text-sm">{query}</span>
                              <Badge variant={time < 100 ? "default" : time < 500 ? "secondary" : "destructive"}>
                                {time}ms
                              </Badge>
                            </div>
                          ))}
                        </div>
                      </div>

                      {currentAudit.performanceMetrics.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Optimization Suggestions</h4>
                          <div className="space-y-2">
                            {currentAudit.performanceMetrics.suggestions.map((suggestion, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-3 bg-amber-50 rounded border border-amber-200">
                                <AlertTriangle className="w-4 h-4 text-amber-500 mt-0.5" />
                                <span className="text-sm">{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="database">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="w-5 h-5 text-amber-500" />
                    Database Health
                  </CardTitle>
                  <CardDescription>Database statistics and optimization status</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {currentAudit.databaseHealth && (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-gray-900">
                            {currentAudit.databaseHealth.tableCount}
                          </p>
                          <p className="text-sm text-muted-foreground">Tables</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                          <p className="text-2xl font-bold text-gray-900">
                            {currentAudit.databaseHealth.totalRecords.toLocaleString()}
                          </p>
                          <p className="text-sm text-muted-foreground">Total Records</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg text-center">
                          <Badge 
                            className={
                              currentAudit.databaseHealth.indexHealth === "good" ? "bg-green-100 text-green-700" :
                              currentAudit.databaseHealth.indexHealth === "needs_optimization" ? "bg-amber-100 text-amber-700" :
                              "bg-red-100 text-red-700"
                            }
                          >
                            {currentAudit.databaseHealth.indexHealth === "good" ? "Good" : 
                             currentAudit.databaseHealth.indexHealth === "needs_optimization" ? "Needs Work" : "Poor"}
                          </Badge>
                          <p className="text-sm text-muted-foreground mt-1">Index Health</p>
                        </div>
                      </div>

                      {currentAudit.databaseHealth.suggestions.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-3">Suggestions</h4>
                          <div className="space-y-2">
                            {currentAudit.databaseHealth.suggestions.map((suggestion, idx) => (
                              <div key={idx} className="flex items-start gap-2 p-3 bg-blue-50 rounded border border-blue-200">
                                <ArrowRight className="w-4 h-4 text-blue-500 mt-0.5" />
                                <span className="text-sm">{suggestion}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="history">
              <Card>
                <CardHeader>
                  <CardTitle>Audit History</CardTitle>
                  <CardDescription>Previous audit runs and their results</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-2">
                      {auditHistory.map((audit) => (
                        <button
                          key={audit.runId}
                          onClick={() => setSelectedAuditId(audit.runId)}
                          className={`w-full flex items-center justify-between p-4 rounded-lg border transition-colors ${
                            selectedAuditId === audit.runId ? 'bg-purple-50 border-purple-200' : 'hover:bg-gray-50'
                          }`}
                          data-testid={`audit-history-${audit.runId}`}
                        >
                          <div className="flex items-center gap-3">
                            {audit.status === "completed" ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : audit.status === "failed" ? (
                              <XCircle className="w-5 h-5 text-red-500" />
                            ) : (
                              <RefreshCw className="w-5 h-5 text-blue-500 animate-spin" />
                            )}
                            <div className="text-left">
                              <p className="font-medium text-sm">{audit.runId}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(audit.startedAt).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {audit.overallScore !== null && audit.overallScore !== undefined && (
                              <span className={`font-semibold ${getScoreColor(audit.overallScore)}`}>
                                {audit.overallScore}%
                              </span>
                            )}
                            <Badge variant="outline">{audit.status}</Badge>
                          </div>
                        </button>
                      ))}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="health">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Heart className="w-5 h-5 text-red-500" />
                    API Health Checks
                  </CardTitle>
                  <CardDescription>Monitor the health of critical API endpoints</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-end mb-4">
                    <Button
                      onClick={() => runHealthChecksMutation.mutate()}
                      disabled={runHealthChecksMutation.isPending}
                      variant="outline"
                      data-testid="button-run-health-checks"
                    >
                      {runHealthChecksMutation.isPending ? (
                        <><RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Running...</>
                      ) : (
                        <><Heart className="w-4 h-4 mr-2" /> Run Health Checks</>
                      )}
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {healthStatus.map((check) => (
                      <div key={check.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div className="flex items-center gap-3">
                          {check.last_status === "healthy" ? (
                            <CheckCircle className="w-5 h-5 text-green-500" />
                          ) : check.last_status === "degraded" ? (
                            <AlertTriangle className="w-5 h-5 text-amber-500" />
                          ) : (
                            <XCircle className="w-5 h-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">{check.name}</p>
                            <p className="text-sm text-muted-foreground">{check.method} {check.endpoint}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm">
                          {check.last_response_time && (
                            <span className="text-muted-foreground">{check.last_response_time}ms</span>
                          )}
                          <Badge variant={
                            check.last_status === "healthy" ? "default" : 
                            check.last_status === "degraded" ? "secondary" : "destructive"
                          }>
                            {check.last_status || "Not Checked"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                    {healthStatus.length === 0 && (
                      <p className="text-center text-muted-foreground py-8">No health checks configured</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="schedule">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-blue-500" />
                    Scheduled Audits
                  </CardTitle>
                  <CardDescription>Configure automatic system audits</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Timer className="w-5 h-5 text-blue-500" />
                      <div>
                        <p className="font-medium">Automatic Audits</p>
                        <p className="text-sm text-muted-foreground">Run system audit every 24 hours</p>
                      </div>
                    </div>
                    <Switch
                      checked={scheduleConfig?.is_enabled || false}
                      onCheckedChange={(enabled) => toggleScheduleMutation.mutate(enabled)}
                      data-testid="switch-scheduled-audits"
                    />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium mb-1">Last Run</p>
                      <p className="text-muted-foreground">
                        {scheduleConfig?.last_run_at 
                          ? new Date(scheduleConfig.last_run_at).toLocaleString()
                          : "Never"}
                      </p>
                    </div>
                    <div className="p-4 border rounded-lg">
                      <p className="text-sm font-medium mb-1">Next Run</p>
                      <p className="text-muted-foreground">
                        {scheduleConfig?.next_run_at 
                          ? new Date(scheduleConfig.next_run_at).toLocaleString()
                          : "Not scheduled"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Wrench className="w-5 h-5 text-green-500" />
                      <div>
                        <p className="font-medium">Auto-Fix on Scheduled Runs</p>
                        <p className="text-sm text-muted-foreground">Automatically apply fixes during scheduled audits</p>
                      </div>
                    </div>
                    <Switch
                      checked={scheduleConfig?.auto_fix_enabled || false}
                      onCheckedChange={(enabled) => updateScheduleConfigMutation.mutate({ autoFixEnabled: enabled })}
                      data-testid="switch-auto-fix"
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="alerts">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Bell className="w-5 h-5 text-amber-500" />
                    Alert Configuration
                  </CardTitle>
                  <CardDescription>Configure email and SMS alerts for critical issues</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Bell className="w-5 h-5 text-amber-500" />
                      <div>
                        <p className="font-medium">Enable Alerts</p>
                        <p className="text-sm text-muted-foreground">Send notifications on critical issues</p>
                      </div>
                    </div>
                    <Switch
                      checked={alertConfig?.is_enabled || false}
                      onCheckedChange={(enabled) => updateAlertConfigMutation.mutate({ isEnabled: enabled })}
                      data-testid="switch-alerts-enabled"
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      <h4 className="font-medium">Email Notifications</h4>
                    </div>
                    <div className="flex items-center justify-between pl-6">
                      <span className="text-sm">Enable Email Alerts</span>
                      <Switch
                        checked={alertConfig?.email_enabled || false}
                        onCheckedChange={(enabled) => updateAlertConfigMutation.mutate({ emailEnabled: enabled })}
                        data-testid="switch-email-enabled"
                      />
                    </div>
                    <div className="pl-6 space-y-2">
                      <Label>Email Recipients (comma-separated)</Label>
                      <Input
                        placeholder="admin@example.com, support@example.com"
                        defaultValue={alertConfig?.email_recipients?.join(", ") || ""}
                        onBlur={(e) => {
                          const emails = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                          updateAlertConfigMutation.mutate({ emailRecipients: emails });
                        }}
                        data-testid="input-email-recipients"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4" />
                      <h4 className="font-medium">SMS Notifications</h4>
                    </div>
                    <div className="flex items-center justify-between pl-6">
                      <span className="text-sm">Enable SMS Alerts</span>
                      <Switch
                        checked={alertConfig?.sms_enabled || false}
                        onCheckedChange={(enabled) => updateAlertConfigMutation.mutate({ smsEnabled: enabled })}
                        data-testid="switch-sms-enabled"
                      />
                    </div>
                    <div className="pl-6 space-y-2">
                      <Label>Phone Numbers (comma-separated)</Label>
                      <Input
                        placeholder="+919876543210, +919876543211"
                        defaultValue={alertConfig?.sms_recipients?.join(", ") || ""}
                        onBlur={(e) => {
                          const phones = e.target.value.split(",").map(s => s.trim()).filter(Boolean);
                          updateAlertConfigMutation.mutate({ smsRecipients: phones });
                        }}
                        data-testid="input-sms-recipients"
                      />
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium">Alert Triggers</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Critical Issues</span>
                        <Switch
                          checked={alertConfig?.alert_on_critical ?? true}
                          onCheckedChange={(enabled) => updateAlertConfigMutation.mutate({ alertOnCritical: enabled })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">High Severity</span>
                        <Switch
                          checked={alertConfig?.alert_on_high ?? true}
                          onCheckedChange={(enabled) => updateAlertConfigMutation.mutate({ alertOnHigh: enabled })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Medium Severity</span>
                        <Switch
                          checked={alertConfig?.alert_on_medium || false}
                          onCheckedChange={(enabled) => updateAlertConfigMutation.mutate({ alertOnMedium: enabled })}
                        />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm">Score Drop Alert</span>
                        <Switch
                          checked={alertConfig?.alert_on_score_drop ?? true}
                          onCheckedChange={(enabled) => updateAlertConfigMutation.mutate({ alertOnScoreDrop: enabled })}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="trends">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <LineChart className="w-5 h-5 text-purple-500" />
                    Audit Trends
                  </CardTitle>
                  <CardDescription>Historical performance and score trends</CardDescription>
                </CardHeader>
                <CardContent>
                  {auditTrends && (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-4 border rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Average Score</p>
                          <p className={`text-3xl font-bold ${getScoreColor(auditTrends.averageScore)}`}>
                            {auditTrends.averageScore}%
                          </p>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Trend</p>
                          <div className="flex items-center justify-center gap-2 text-2xl font-bold">
                            {auditTrends.trend === "improving" ? (
                              <><TrendingUp className="w-6 h-6 text-green-500" /> <span className="text-green-600">Improving</span></>
                            ) : auditTrends.trend === "declining" ? (
                              <><TrendingDown className="w-6 h-6 text-red-500" /> <span className="text-red-600">Declining</span></>
                            ) : (
                              <><Minus className="w-6 h-6 text-gray-500" /> <span className="text-gray-600">Stable</span></>
                            )}
                          </div>
                        </div>
                        <div className="p-4 border rounded-lg text-center">
                          <p className="text-sm text-muted-foreground">Score Change</p>
                          <p className={`text-3xl font-bold ${
                            auditTrends.scoreChange > 0 ? "text-green-600" : 
                            auditTrends.scoreChange < 0 ? "text-red-600" : "text-gray-600"
                          }`}>
                            {auditTrends.scoreChange > 0 ? "+" : ""}{auditTrends.scoreChange}%
                          </p>
                        </div>
                      </div>

                      <div className="border rounded-lg p-4">
                        <h4 className="font-medium mb-4">Recent Audit Scores</h4>
                        <div className="space-y-2">
                          {auditTrends.audits.slice(-10).reverse().map((audit, idx) => (
                            <div key={idx} className="flex items-center justify-between py-2 border-b last:border-0">
                              <span className="text-sm text-muted-foreground">{audit.date}</span>
                              <div className="flex items-center gap-4">
                                <span className="text-sm text-muted-foreground">{audit.issues} issues</span>
                                <span className={`font-semibold ${getScoreColor(audit.score)}`}>{audit.score}%</span>
                              </div>
                            </div>
                          ))}
                          {auditTrends.audits.length === 0 && (
                            <p className="text-center text-muted-foreground py-4">No audit history available</p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      ) : loadingLatest ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-500" />
          <span className="ml-3 text-muted-foreground">Loading audit data...</span>
        </div>
      ) : (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Activity className="w-16 h-16 text-purple-500 opacity-50 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Audit Data Available</h3>
            <p className="text-muted-foreground text-center mb-6">
              Run your first system audit to see health reports, security analysis, and performance metrics.
            </p>
            <Button
              onClick={() => runAuditMutation.mutate()}
              disabled={runAuditMutation.isPending}
              className="bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              data-testid="button-run-first-audit"
            >
              {runAuditMutation.isPending ? (
                <>
                  <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                  Running...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run First Audit
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
