import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  ClipboardCheck, TestTube2, Bug, Rocket, Sparkles, 
  Plus, Play, CheckCircle, XCircle, AlertTriangle, 
  Clock, TrendingUp, Shield, RefreshCw, Eye, Trash2,
  FileText, Target, Zap, Brain, AlertOctagon
} from "lucide-react";

interface DashboardMetrics {
  testSuites: number;
  testCases: number;
  automatedCases: number;
  automationReadiness: number;
  openDefects: number;
  criticalDefects: number;
  averagePassRate: number;
  pendingSuggestions: number;
  releaseReadiness: number | null;
  releaseDecision: string | null;
  isReleaseBlocked: boolean;
  blockingIssues: number;
  recentRuns: Array<{ id: number; name: string; passRate: number; completedAt: string }>;
}

interface TestSuite {
  id: number;
  name: string;
  description: string;
  module: string;
  priority: string;
  isActive: boolean;
  totalCases: number;
  automatedCases: number;
  createdAt: string;
}

interface TestCase {
  id: number;
  testCaseId: string;
  suiteId: number;
  title: string;
  description: string;
  module: string;
  feature: string;
  priority: string;
  testType: string;
  preconditions: string;
  testSteps: Array<{ stepNumber: number; action: string; expectedResult: string; testData?: string }>;
  expectedResult: string;
  automationEligible: boolean;
  automationStatus: string;
  estimatedDuration: number;
  tags: string[];
  isActive: boolean;
  createdAt: string;
}

interface TestRun {
  id: number;
  runId: string;
  name: string;
  description: string;
  releaseVersion: string;
  environment: string;
  runType: string;
  status: string;
  startedAt: string;
  completedAt: string;
  passedCount: number;
  failedCount: number;
  blockedCount: number;
  skippedCount: number;
  passRate: number;
  totalCases: number;
  createdAt: string;
}

interface Defect {
  id: number;
  defectId: string;
  title: string;
  description: string;
  severity: string;
  priority: string;
  defectType: string;
  module: string;
  feature: string;
  status: string;
  isDeploymentBlocker: boolean;
  blockerReason: string;
  reportedAt: string;
  createdAt: string;
}

interface ReleaseReadiness {
  score: number;
  decision: 'GO' | 'NO_GO' | 'CONDITIONAL';
  confidence: number;
  isBlocked: boolean;
  blockingReasons: Array<{ reason: string; severity: string; module: string; defectId?: string }>;
  riskLevel: string;
  riskSummary: string;
  metrics: {
    testPassRate: number;
    criticalBugs: number;
    highBugs: number;
    mediumBugs: number;
    lowBugs: number;
    blockedTests: number;
    regressionCoverage: number;
  };
  moduleRisks: Array<{ module: string; riskLevel: string; issues: number; testCoverage: number }>;
}

interface CoverageSuggestion {
  id: number;
  suggestionId: string;
  title: string;
  description: string;
  suggestedTestCase: string;
  category: string;
  module: string;
  feature: string;
  priority: string;
  confidence: number;
  reasoning: string;
  status: string;
  createdAt: string;
}

export default function QATestingSection() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("dashboard");
  const [showSuiteDialog, setShowSuiteDialog] = useState(false);
  const [showCaseDialog, setShowCaseDialog] = useState(false);
  const [showRunDialog, setShowRunDialog] = useState(false);
  const [showDefectDialog, setShowDefectDialog] = useState(false);

  const { data: dashboard, isLoading: dashboardLoading } = useQuery<DashboardMetrics>({
    queryKey: ['/api/admin/qa/dashboard']
  });

  const { data: suites = [], isLoading: suitesLoading } = useQuery<TestSuite[]>({
    queryKey: ['/api/admin/qa/suites']
  });

  const { data: testCases = [], isLoading: casesLoading } = useQuery<TestCase[]>({
    queryKey: ['/api/admin/qa/cases']
  });

  const { data: runs = [], isLoading: runsLoading } = useQuery<TestRun[]>({
    queryKey: ['/api/admin/qa/runs']
  });

  const { data: defects = [], isLoading: defectsLoading } = useQuery<Defect[]>({
    queryKey: ['/api/admin/qa/defects']
  });

  const { data: readiness, isLoading: readinessLoading } = useQuery<ReleaseReadiness>({
    queryKey: ['/api/admin/qa/readiness']
  });

  const { data: suggestions = [], isLoading: suggestionsLoading } = useQuery<CoverageSuggestion[]>({
    queryKey: ['/api/admin/qa/suggestions']
  });

  const createSuiteMutation = useMutation({
    mutationFn: async (data: Partial<TestSuite>) => {
      return await apiRequest('POST', '/api/admin/qa/suites', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/qa/suites'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/qa/dashboard'] });
      setShowSuiteDialog(false);
      toast({ title: "Test suite created successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const createCaseMutation = useMutation({
    mutationFn: async (data: Partial<TestCase>) => {
      return await apiRequest('POST', '/api/admin/qa/cases', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/qa/cases'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/qa/dashboard'] });
      setShowCaseDialog(false);
      toast({ title: "Test case created successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const createRunMutation = useMutation({
    mutationFn: async (data: Partial<TestRun>) => {
      return await apiRequest('POST', '/api/admin/qa/runs', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/qa/runs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/qa/dashboard'] });
      setShowRunDialog(false);
      toast({ title: "Test run created successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const createDefectMutation = useMutation({
    mutationFn: async (data: Partial<Defect>) => {
      return await apiRequest('POST', '/api/admin/qa/defects', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/qa/defects'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/qa/dashboard'] });
      setShowDefectDialog(false);
      toast({ title: "Defect reported successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const generateSuggestionsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest('POST', '/api/admin/qa/suggestions/generate');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/qa/suggestions'] });
      toast({ title: "AI suggestions generated successfully" });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    }
  });

  const reviewSuggestionMutation = useMutation({
    mutationFn: async ({ id, action }: { id: number; action: 'accept' | 'dismiss' }) => {
      return await apiRequest('POST', `/api/admin/qa/suggestions/${id}/review`, { action });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/qa/suggestions'] });
      toast({ title: "Suggestion reviewed" });
    }
  });

  const evaluateReadinessMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/admin/qa/readiness');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/qa/readiness'] });
      toast({ title: "Release readiness evaluated" });
    }
  });

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500 text-white';
      case 'high': return 'bg-orange-500 text-white';
      case 'medium': return 'bg-yellow-500 text-black';
      case 'low': return 'bg-blue-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'passed': case 'completed': case 'verified': case 'closed': return 'bg-green-500 text-white';
      case 'failed': case 'open': case 'critical': return 'bg-red-500 text-white';
      case 'in_progress': case 'pending': return 'bg-blue-500 text-white';
      case 'blocked': case 'reopened': return 'bg-orange-500 text-white';
      case 'skipped': case 'wont_fix': return 'bg-gray-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getDecisionColor = (decision: string) => {
    switch (decision) {
      case 'GO': return 'bg-green-500 text-white';
      case 'NO_GO': return 'bg-red-500 text-white';
      case 'CONDITIONAL': return 'bg-yellow-500 text-black';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">QA & Release Governance</h2>
          <p className="text-muted-foreground">Enterprise-grade quality assurance and release control system</p>
        </div>
        {dashboard?.isReleaseBlocked && (
          <div className="flex items-center gap-2 px-4 py-2 bg-red-500/10 border border-red-500 rounded-lg">
            <AlertOctagon className="h-5 w-5 text-red-500" />
            <span className="font-semibold text-red-500">DEPLOYMENT BLOCKED</span>
            <Badge variant="destructive">{dashboard.blockingIssues} Issue(s)</Badge>
          </div>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="dashboard" className="flex items-center gap-2" data-testid="tab-qa-dashboard">
            <TrendingUp className="h-4 w-4" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="cases" className="flex items-center gap-2" data-testid="tab-test-cases">
            <ClipboardCheck className="h-4 w-4" />
            Test Cases
          </TabsTrigger>
          <TabsTrigger value="runs" className="flex items-center gap-2" data-testid="tab-test-runs">
            <TestTube2 className="h-4 w-4" />
            Test Runs
          </TabsTrigger>
          <TabsTrigger value="defects" className="flex items-center gap-2" data-testid="tab-defects">
            <Bug className="h-4 w-4" />
            Defects
          </TabsTrigger>
          <TabsTrigger value="release" className="flex items-center gap-2" data-testid="tab-release">
            <Rocket className="h-4 w-4" />
            Release
          </TabsTrigger>
          <TabsTrigger value="ai" className="flex items-center gap-2" data-testid="tab-ai-coverage">
            <Sparkles className="h-4 w-4" />
            AI Coverage
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-6">
          {dashboardLoading ? (
            <div className="grid grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-24 bg-muted" />
                </Card>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Test Cases</p>
                        <p className="text-3xl font-bold">{dashboard?.testCases || 0}</p>
                      </div>
                      <ClipboardCheck className="h-10 w-10 text-blue-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Automation Ready</p>
                        <p className="text-3xl font-bold">{dashboard?.automationReadiness || 0}%</p>
                      </div>
                      <Zap className="h-10 w-10 text-yellow-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Open Defects</p>
                        <p className="text-3xl font-bold">{dashboard?.openDefects || 0}</p>
                      </div>
                      <Bug className="h-10 w-10 text-red-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Pass Rate</p>
                        <p className="text-3xl font-bold">{dashboard?.averagePassRate || 0}%</p>
                      </div>
                      <Target className="h-10 w-10 text-green-500 opacity-50" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Release Readiness</CardTitle>
                    <CardDescription>Current release decision status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center gap-6">
                      <div className="flex flex-col items-center">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                          dashboard?.releaseDecision === 'GO' ? 'bg-green-500/20' :
                          dashboard?.releaseDecision === 'NO_GO' ? 'bg-red-500/20' :
                          'bg-yellow-500/20'
                        }`}>
                          <span className="text-4xl font-bold">{dashboard?.releaseReadiness || '-'}</span>
                        </div>
                        <Badge className={`mt-2 ${getDecisionColor(dashboard?.releaseDecision || '')}`}>
                          {dashboard?.releaseDecision || 'NOT EVALUATED'}
                        </Badge>
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Critical Bugs</span>
                          <Badge variant={dashboard?.criticalDefects ? "destructive" : "secondary"}>
                            {dashboard?.criticalDefects || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">Blocking Issues</span>
                          <Badge variant={dashboard?.blockingIssues ? "destructive" : "secondary"}>
                            {dashboard?.blockingIssues || 0}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-sm text-muted-foreground">AI Suggestions</span>
                          <Badge variant="outline">{dashboard?.pendingSuggestions || 0} pending</Badge>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Recent Test Runs</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {dashboard?.recentRuns?.length ? (
                      <div className="space-y-3">
                        {dashboard.recentRuns.map((run) => (
                          <div key={run.id} className="flex items-center justify-between p-2 rounded bg-muted/50">
                            <span className="text-sm truncate max-w-[120px]">{run.name}</span>
                            <Badge variant={run.passRate >= 95 ? "default" : run.passRate >= 80 ? "secondary" : "destructive"}>
                              {run.passRate?.toFixed(0)}%
                            </Badge>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No recent test runs</p>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="cases" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="flex gap-2">
              <Button onClick={() => setShowSuiteDialog(true)} variant="outline" data-testid="button-create-suite">
                <Plus className="h-4 w-4 mr-2" />
                New Suite
              </Button>
              <Button onClick={() => setShowCaseDialog(true)} data-testid="button-create-case">
                <Plus className="h-4 w-4 mr-2" />
                New Test Case
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4">
            <Card className="col-span-1">
              <CardHeader>
                <CardTitle className="text-lg">Test Suites</CardTitle>
              </CardHeader>
              <CardContent className="p-2">
                {suitesLoading ? (
                  <div className="space-y-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className="h-12 bg-muted animate-pulse rounded" />
                    ))}
                  </div>
                ) : suites.length === 0 ? (
                  <p className="text-sm text-muted-foreground p-2">No test suites yet</p>
                ) : (
                  <div className="space-y-1">
                    {suites.map((suite) => (
                      <div key={suite.id} className="p-2 rounded hover-elevate cursor-pointer border" data-testid={`suite-${suite.id}`}>
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{suite.name}</span>
                          <Badge variant="outline" className="text-xs">{suite.totalCases}</Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{suite.module}</p>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="col-span-3 space-y-4">
              {casesLoading ? (
                <div className="space-y-2">
                  {[...Array(5)].map((_, i) => (
                    <Card key={i} className="animate-pulse">
                      <CardContent className="h-20 bg-muted" />
                    </Card>
                  ))}
                </div>
              ) : testCases.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <ClipboardCheck className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No test cases yet. Create your first test case.</p>
                  </CardContent>
                </Card>
              ) : (
                testCases.map((tc) => (
                  <Card key={tc.id} data-testid={`test-case-${tc.id}`}>
                    <CardContent className="py-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="font-mono text-xs">{tc.testCaseId}</Badge>
                            <Badge className={getSeverityColor(tc.priority)}>{tc.priority}</Badge>
                            <Badge variant="secondary">{tc.testType}</Badge>
                            {tc.automationStatus === 'automated' && (
                              <Badge className="bg-purple-500 text-white">Automated</Badge>
                            )}
                          </div>
                          <h4 className="font-medium mt-2">{tc.title}</h4>
                          <p className="text-sm text-muted-foreground mt-1">{tc.description}</p>
                          <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                            <span>Module: {tc.module}</span>
                            {tc.feature && <span>Feature: {tc.feature}</span>}
                            {tc.estimatedDuration && <span>Est: {tc.estimatedDuration} min</span>}
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" data-testid={`view-case-${tc.id}`}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="runs" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Test Runs</h3>
            <Button onClick={() => setShowRunDialog(true)} data-testid="button-create-run">
              <Plus className="h-4 w-4 mr-2" />
              New Test Run
            </Button>
          </div>

          {runsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-24 bg-muted" />
                </Card>
              ))}
            </div>
          ) : runs.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TestTube2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No test runs yet. Start a new test run.</p>
              </CardContent>
            </Card>
          ) : (
            runs.map((run) => (
              <Card key={run.id} data-testid={`test-run-${run.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{run.runId}</Badge>
                        <Badge className={getStatusColor(run.status)}>{run.status}</Badge>
                        <Badge variant="secondary">{run.environment}</Badge>
                        <Badge variant="outline">{run.runType}</Badge>
                      </div>
                      <h4 className="font-medium mt-2">{run.name}</h4>
                      {run.releaseVersion && (
                        <p className="text-sm text-muted-foreground">Version: {run.releaseVersion}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <p className="text-2xl font-bold text-green-500">{run.passedCount}</p>
                        <p className="text-xs text-muted-foreground">Passed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-red-500">{run.failedCount}</p>
                        <p className="text-xs text-muted-foreground">Failed</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold text-orange-500">{run.blockedCount}</p>
                        <p className="text-xs text-muted-foreground">Blocked</p>
                      </div>
                      <div className="text-center">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
                          run.passRate >= 95 ? 'bg-green-500/20' :
                          run.passRate >= 80 ? 'bg-yellow-500/20' : 'bg-red-500/20'
                        }`}>
                          <span className="text-lg font-bold">{run.passRate?.toFixed(0) || 0}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="defects" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Defect Tracker</h3>
            <Button onClick={() => setShowDefectDialog(true)} data-testid="button-report-defect">
              <Bug className="h-4 w-4 mr-2" />
              Report Defect
            </Button>
          </div>

          {defectsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-20 bg-muted" />
                </Card>
              ))}
            </div>
          ) : defects.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <CheckCircle className="h-12 w-12 mx-auto text-green-500 mb-4" />
                <p className="text-muted-foreground">No defects reported. Great job!</p>
              </CardContent>
            </Card>
          ) : (
            defects.map((defect) => (
              <Card key={defect.id} className={defect.isDeploymentBlocker ? 'border-red-500' : ''} data-testid={`defect-${defect.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{defect.defectId}</Badge>
                        <Badge className={getSeverityColor(defect.severity)}>{defect.severity}</Badge>
                        <Badge className={getStatusColor(defect.status)}>{defect.status}</Badge>
                        {defect.isDeploymentBlocker && (
                          <Badge className="bg-red-600 text-white">
                            <AlertOctagon className="h-3 w-3 mr-1" />
                            BLOCKER
                          </Badge>
                        )}
                      </div>
                      <h4 className="font-medium mt-2">{defect.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{defect.description}</p>
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Module: {defect.module}</span>
                        {defect.feature && <span>Feature: {defect.feature}</span>}
                        <span>Type: {defect.defectType}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="icon" variant="ghost" data-testid={`view-defect-${defect.id}`}>
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="release" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Release Go / No-Go Decision</h3>
            <Button 
              onClick={() => evaluateReadinessMutation.mutate()} 
              disabled={evaluateReadinessMutation.isPending}
              data-testid="button-evaluate-release"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${evaluateReadinessMutation.isPending ? 'animate-spin' : ''}`} />
              Evaluate Release
            </Button>
          </div>

          {readinessLoading ? (
            <Card className="animate-pulse">
              <CardContent className="h-64 bg-muted" />
            </Card>
          ) : !readiness ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Rocket className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No release evaluation yet. Click "Evaluate Release" to start.</p>
              </CardContent>
            </Card>
          ) : (
            <>
              <Card className={`border-2 ${
                readiness.decision === 'GO' ? 'border-green-500 bg-green-500/5' :
                readiness.decision === 'NO_GO' ? 'border-red-500 bg-red-500/5' :
                'border-yellow-500 bg-yellow-500/5'
              }`}>
                <CardContent className="py-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-8">
                      <div className="text-center">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center ${
                          readiness.decision === 'GO' ? 'bg-green-500/20' :
                          readiness.decision === 'NO_GO' ? 'bg-red-500/20' :
                          'bg-yellow-500/20'
                        }`}>
                          <span className="text-5xl font-bold">{readiness.score}</span>
                        </div>
                        <p className="text-sm text-muted-foreground mt-2">Readiness Score</p>
                      </div>
                      <div className="space-y-4">
                        <div className="flex items-center gap-4">
                          <Badge className={`text-xl py-2 px-6 ${getDecisionColor(readiness.decision)}`}>
                            {readiness.decision === 'GO' ? 'GO FOR RELEASE' :
                             readiness.decision === 'NO_GO' ? 'DO NOT RELEASE' :
                             'CONDITIONAL RELEASE'}
                          </Badge>
                          <Badge variant="outline" className="text-lg py-2 px-4">
                            {readiness.confidence}% Confidence
                          </Badge>
                        </div>
                        <p className="text-lg">{readiness.riskSummary}</p>
                        <Badge className={getSeverityColor(readiness.riskLevel)}>
                          Risk Level: {readiness.riskLevel.toUpperCase()}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardHeader>
                    <CardTitle>Quality Metrics</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span>Test Pass Rate</span>
                        <Badge variant={readiness.metrics.testPassRate >= 95 ? "default" : "destructive"}>
                          {readiness.metrics.testPassRate.toFixed(1)}%
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Regression Coverage</span>
                        <Badge variant="outline">{readiness.metrics.regressionCoverage.toFixed(1)}%</Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Critical Bugs</span>
                        <Badge variant={readiness.metrics.criticalBugs > 0 ? "destructive" : "secondary"}>
                          {readiness.metrics.criticalBugs}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>High Bugs</span>
                        <Badge variant={readiness.metrics.highBugs > 3 ? "destructive" : "secondary"}>
                          {readiness.metrics.highBugs}
                        </Badge>
                      </div>
                      <div className="flex justify-between items-center">
                        <span>Blocked Tests</span>
                        <Badge variant="outline">{readiness.metrics.blockedTests}</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <AlertOctagon className="h-5 w-5 text-red-500" />
                      Blocking Reasons
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {readiness.blockingReasons.length === 0 ? (
                      <div className="flex items-center gap-2 text-green-500">
                        <CheckCircle className="h-5 w-5" />
                        <span>No blocking issues found</span>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {readiness.blockingReasons.map((br, idx) => (
                          <div key={idx} className="p-3 rounded border border-red-500/50 bg-red-500/5">
                            <div className="flex items-start gap-2">
                              <XCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                              <div>
                                <p className="font-medium">{br.reason}</p>
                                <div className="flex gap-2 mt-1">
                                  <Badge className={getSeverityColor(br.severity)}>{br.severity}</Badge>
                                  <Badge variant="outline">{br.module}</Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>

        <TabsContent value="ai" className="space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">AI Test Coverage Advisor</h3>
              <p className="text-sm text-muted-foreground">AI-powered suggestions for improving test coverage</p>
            </div>
            <Button 
              onClick={() => generateSuggestionsMutation.mutate()} 
              disabled={generateSuggestionsMutation.isPending}
              data-testid="button-generate-suggestions"
            >
              <Brain className={`h-4 w-4 mr-2 ${generateSuggestionsMutation.isPending ? 'animate-spin' : ''}`} />
              {generateSuggestionsMutation.isPending ? 'Analyzing...' : 'Generate Suggestions'}
            </Button>
          </div>

          {suggestionsLoading ? (
            <div className="space-y-2">
              {[...Array(3)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardContent className="h-32 bg-muted" />
                </Card>
              ))}
            </div>
          ) : suggestions.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No AI suggestions yet. Click "Generate Suggestions" to analyze test coverage.</p>
              </CardContent>
            </Card>
          ) : (
            suggestions.map((suggestion) => (
              <Card key={suggestion.id} data-testid={`suggestion-${suggestion.id}`}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="font-mono text-xs">{suggestion.suggestionId}</Badge>
                        <Badge className={getSeverityColor(suggestion.priority)}>{suggestion.priority}</Badge>
                        <Badge variant="secondary">{suggestion.category.replace('_', ' ')}</Badge>
                        <Badge className={getStatusColor(suggestion.status)}>{suggestion.status}</Badge>
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Brain className="h-3 w-3" />
                          {suggestion.confidence}% confidence
                        </Badge>
                      </div>
                      <h4 className="font-medium mt-2">{suggestion.title}</h4>
                      <p className="text-sm text-muted-foreground mt-1">{suggestion.description}</p>
                      {suggestion.reasoning && (
                        <p className="text-sm text-muted-foreground mt-2 italic">
                          <strong>Reasoning:</strong> {suggestion.reasoning}
                        </p>
                      )}
                      <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                        <span>Module: {suggestion.module}</span>
                        {suggestion.feature && <span>Feature: {suggestion.feature}</span>}
                      </div>
                    </div>
                    {suggestion.status === 'new' && (
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => reviewSuggestionMutation.mutate({ id: suggestion.id, action: 'accept' })}
                          data-testid={`accept-suggestion-${suggestion.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => reviewSuggestionMutation.mutate({ id: suggestion.id, action: 'dismiss' })}
                          data-testid={`dismiss-suggestion-${suggestion.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Dismiss
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>

      <CreateSuiteDialog 
        open={showSuiteDialog} 
        onOpenChange={setShowSuiteDialog}
        onSubmit={(data) => createSuiteMutation.mutate(data)}
        isPending={createSuiteMutation.isPending}
      />

      <CreateTestCaseDialog 
        open={showCaseDialog} 
        onOpenChange={setShowCaseDialog}
        onSubmit={(data) => createCaseMutation.mutate(data)}
        isPending={createCaseMutation.isPending}
        suites={suites}
      />

      <CreateTestRunDialog 
        open={showRunDialog} 
        onOpenChange={setShowRunDialog}
        onSubmit={(data) => createRunMutation.mutate(data)}
        isPending={createRunMutation.isPending}
        suites={suites}
      />

      <CreateDefectDialog 
        open={showDefectDialog} 
        onOpenChange={setShowDefectDialog}
        onSubmit={(data) => createDefectMutation.mutate(data)}
        isPending={createDefectMutation.isPending}
      />
    </div>
  );
}

function CreateSuiteDialog({ open, onOpenChange, onSubmit, isPending }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [module, setModule] = useState('');
  const [priority, setPriority] = useState('medium');

  const handleSubmit = () => {
    onSubmit({ name, description, module, priority });
    setName('');
    setDescription('');
    setModule('');
    setPriority('medium');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Test Suite</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Test suite name" data-testid="input-suite-name" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" data-testid="input-suite-description" />
          </div>
          <div>
            <Label>Module</Label>
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger data-testid="select-suite-module">
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Authentication">Authentication</SelectItem>
                <SelectItem value="Exam Management">Exam Management</SelectItem>
                <SelectItem value="Proctoring">Proctoring</SelectItem>
                <SelectItem value="Results">Results</SelectItem>
                <SelectItem value="Payment">Payment</SelectItem>
                <SelectItem value="Certificate">Certificate</SelectItem>
                <SelectItem value="Student Portal">Student Portal</SelectItem>
                <SelectItem value="Admin Portal">Admin Portal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger data-testid="select-suite-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !name || !module} data-testid="button-submit-suite">
            {isPending ? 'Creating...' : 'Create Suite'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateTestCaseDialog({ open, onOpenChange, onSubmit, isPending, suites }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  suites: TestSuite[];
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [module, setModule] = useState('');
  const [suiteId, setSuiteId] = useState('');
  const [priority, setPriority] = useState('medium');
  const [testType, setTestType] = useState('functional');
  const [expectedResult, setExpectedResult] = useState('');
  const [preconditions, setPreconditions] = useState('');

  const handleSubmit = () => {
    onSubmit({ 
      title, 
      description, 
      module, 
      suiteId: suiteId ? parseInt(suiteId) : undefined,
      priority, 
      testType, 
      expectedResult,
      preconditions 
    });
    setTitle('');
    setDescription('');
    setModule('');
    setSuiteId('');
    setPriority('medium');
    setTestType('functional');
    setExpectedResult('');
    setPreconditions('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle>Create Test Case</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <Label>Title</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Test case title" data-testid="input-case-title" />
            </div>
            <div className="col-span-2">
              <Label>Description</Label>
              <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" data-testid="input-case-description" />
            </div>
            <div>
              <Label>Suite</Label>
              <Select value={suiteId} onValueChange={setSuiteId}>
                <SelectTrigger data-testid="select-case-suite">
                  <SelectValue placeholder="Select suite" />
                </SelectTrigger>
                <SelectContent>
                  {suites.map((suite) => (
                    <SelectItem key={suite.id} value={suite.id.toString()}>{suite.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Module</Label>
              <Select value={module} onValueChange={setModule}>
                <SelectTrigger data-testid="select-case-module">
                  <SelectValue placeholder="Select module" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Authentication">Authentication</SelectItem>
                  <SelectItem value="Exam Management">Exam Management</SelectItem>
                  <SelectItem value="Proctoring">Proctoring</SelectItem>
                  <SelectItem value="Results">Results</SelectItem>
                  <SelectItem value="Payment">Payment</SelectItem>
                  <SelectItem value="Certificate">Certificate</SelectItem>
                  <SelectItem value="Student Portal">Student Portal</SelectItem>
                  <SelectItem value="Admin Portal">Admin Portal</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger data-testid="select-case-priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="critical">Critical</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Test Type</Label>
              <Select value={testType} onValueChange={setTestType}>
                <SelectTrigger data-testid="select-case-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="functional">Functional</SelectItem>
                  <SelectItem value="regression">Regression</SelectItem>
                  <SelectItem value="smoke">Smoke</SelectItem>
                  <SelectItem value="integration">Integration</SelectItem>
                  <SelectItem value="security">Security</SelectItem>
                  <SelectItem value="performance">Performance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="col-span-2">
              <Label>Preconditions</Label>
              <Textarea value={preconditions} onChange={(e) => setPreconditions(e.target.value)} placeholder="Setup requirements" data-testid="input-case-preconditions" />
            </div>
            <div className="col-span-2">
              <Label>Expected Result</Label>
              <Textarea value={expectedResult} onChange={(e) => setExpectedResult(e.target.value)} placeholder="Expected outcome" data-testid="input-case-expected" />
            </div>
          </div>
        </div>
        <DialogFooter className="flex-shrink-0">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !title || !module || !expectedResult} data-testid="button-submit-case">
            {isPending ? 'Creating...' : 'Create Test Case'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateTestRunDialog({ open, onOpenChange, onSubmit, isPending, suites }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
  suites: TestSuite[];
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [releaseVersion, setReleaseVersion] = useState('');
  const [environment, setEnvironment] = useState('staging');
  const [runType, setRunType] = useState('manual');

  const handleSubmit = () => {
    onSubmit({ name, description, releaseVersion, environment, runType });
    setName('');
    setDescription('');
    setReleaseVersion('');
    setEnvironment('staging');
    setRunType('manual');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Test Run</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Test run name" data-testid="input-run-name" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Description" data-testid="input-run-description" />
          </div>
          <div>
            <Label>Release Version</Label>
            <Input value={releaseVersion} onChange={(e) => setReleaseVersion(e.target.value)} placeholder="e.g., v2.1.0" data-testid="input-run-version" />
          </div>
          <div>
            <Label>Environment</Label>
            <Select value={environment} onValueChange={setEnvironment}>
              <SelectTrigger data-testid="select-run-environment">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="development">Development</SelectItem>
                <SelectItem value="staging">Staging</SelectItem>
                <SelectItem value="production">Production</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Run Type</Label>
            <Select value={runType} onValueChange={setRunType}>
              <SelectTrigger data-testid="select-run-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual</SelectItem>
                <SelectItem value="automated">Automated</SelectItem>
                <SelectItem value="regression">Regression</SelectItem>
                <SelectItem value="smoke">Smoke</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !name} data-testid="button-submit-run">
            {isPending ? 'Creating...' : 'Create Test Run'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateDefectDialog({ open, onOpenChange, onSubmit, isPending }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: any) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('medium');
  const [priority, setPriority] = useState('medium');
  const [defectType, setDefectType] = useState('functional');
  const [module, setModule] = useState('');
  const [stepsToReproduce, setStepsToReproduce] = useState('');
  const [expectedBehavior, setExpectedBehavior] = useState('');
  const [actualBehavior, setActualBehavior] = useState('');

  const handleSubmit = () => {
    onSubmit({ 
      title, 
      description, 
      severity, 
      priority, 
      defectType, 
      module,
      stepsToReproduce,
      expectedBehavior,
      actualBehavior
    });
    setTitle('');
    setDescription('');
    setSeverity('medium');
    setPriority('medium');
    setDefectType('functional');
    setModule('');
    setStepsToReproduce('');
    setExpectedBehavior('');
    setActualBehavior('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Report Defect</DialogTitle>
        </DialogHeader>
        <div className="grid grid-cols-2 gap-4 max-h-[60vh] overflow-y-auto">
          <div className="col-span-2">
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Defect title" data-testid="input-defect-title" />
          </div>
          <div className="col-span-2">
            <Label>Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Detailed description" data-testid="input-defect-description" />
          </div>
          <div>
            <Label>Severity</Label>
            <Select value={severity} onValueChange={setSeverity}>
              <SelectTrigger data-testid="select-defect-severity">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={priority} onValueChange={setPriority}>
              <SelectTrigger data-testid="select-defect-priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Type</Label>
            <Select value={defectType} onValueChange={setDefectType}>
              <SelectTrigger data-testid="select-defect-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="functional">Functional</SelectItem>
                <SelectItem value="ui">UI/UX</SelectItem>
                <SelectItem value="performance">Performance</SelectItem>
                <SelectItem value="security">Security</SelectItem>
                <SelectItem value="data">Data</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Module</Label>
            <Select value={module} onValueChange={setModule}>
              <SelectTrigger data-testid="select-defect-module">
                <SelectValue placeholder="Select module" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Authentication">Authentication</SelectItem>
                <SelectItem value="Exam Management">Exam Management</SelectItem>
                <SelectItem value="Proctoring">Proctoring</SelectItem>
                <SelectItem value="Results">Results</SelectItem>
                <SelectItem value="Payment">Payment</SelectItem>
                <SelectItem value="Certificate">Certificate</SelectItem>
                <SelectItem value="Student Portal">Student Portal</SelectItem>
                <SelectItem value="Admin Portal">Admin Portal</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="col-span-2">
            <Label>Steps to Reproduce</Label>
            <Textarea value={stepsToReproduce} onChange={(e) => setStepsToReproduce(e.target.value)} placeholder="1. Step one&#10;2. Step two" data-testid="input-defect-steps" />
          </div>
          <div className="col-span-2">
            <Label>Expected Behavior</Label>
            <Textarea value={expectedBehavior} onChange={(e) => setExpectedBehavior(e.target.value)} placeholder="What should happen" data-testid="input-defect-expected" />
          </div>
          <div className="col-span-2">
            <Label>Actual Behavior</Label>
            <Textarea value={actualBehavior} onChange={(e) => setActualBehavior(e.target.value)} placeholder="What actually happens" data-testid="input-defect-actual" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={isPending || !title || !description || !module} data-testid="button-submit-defect">
            {isPending ? 'Reporting...' : 'Report Defect'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
