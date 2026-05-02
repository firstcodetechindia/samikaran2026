import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion } from "framer-motion";
import { format } from "date-fns";

interface PerformanceReport {
  id: number;
  studentId: number;
  totalOlympiadsAttempted: number | null;
  totalOlympiadsCompleted: number | null;
  overallAveragePercentage: number | null;
  overallAccuracy: number | null;
  totalCorrectAnswers: number | null;
  totalWrongAnswers: number | null;
  totalQuestionsAttempted: number | null;
  bestPerformanceExamId: number | null;
  bestPerformancePercentage: number | null;
  bestPerformanceExam?: { id: number; title: string };
  worstPerformanceExamId: number | null;
  worstPerformancePercentage: number | null;
  worstPerformanceExam?: { id: number; title: string };
  improvementTrend: string | null;
  improvementScore: number | null;
  subjectWiseAnalysis: any;
  topicWiseAnalysis: any;
  criticalWeakAreas: any;
  avoidanceAreas: any;
  strengthAreas: any;
  previousReportId: number | null;
  subjectWiseChange: any;
  overallChange: any;
  insights: any;
  subjectSuggestions: any;
  topicSuggestions: any;
  behaviouralSuggestions: any;
  performanceTimeline: any;
  accuracyTimeline: any;
  isLatest: boolean | null;
  createdAt: string;
}

interface ReportResponse {
  report?: PerformanceReport;
  message?: string;
  hasData?: boolean;
}

interface QuickAnalyticsResponse {
  hasData: boolean;
  snapshot?: {
    totalExams: number;
    avgPercentage: number;
    accuracy: number;
    bestExam: { title: string; percentage: number };
    worstExam: { title: string; percentage: number };
  };
  message?: string;
}

interface HistoryResponse {
  reports: Array<{
    id: number;
    createdAt: string;
    overallAveragePercentage: number | null;
    overallAccuracy: number | null;
    improvementTrend: string | null;
    totalOlympiadsAttempted: number | null;
    isLatest: boolean | null;
  }>;
}
import {
  TrendingUp, TrendingDown, Minus, Trophy, Target, Clock, Brain,
  BarChart3, PieChart as PieChartIcon, RefreshCw, Download, ChevronRight,
  Lightbulb, AlertTriangle, CheckCircle, BookOpen, Award, History,
  Sparkles, ArrowUpRight, ArrowDownRight, Loader2, FileText
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, BarChart, Bar, RadarChart, Radar, PolarGrid,
  PolarAngleAxis, PolarRadiusAxis
} from "recharts";

const CHART_COLORS = ["#8B5CF6", "#EC4899", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];

interface PerformanceAnalyticsProps {
  studentId: number;
}

export function PerformanceAnalytics({ studentId }: PerformanceAnalyticsProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");

  const { data: reportData, isLoading: reportLoading } = useQuery<ReportResponse>({
    queryKey: ["/api/student/performance-report", studentId],
    enabled: !!studentId
  });

  const { data: quickData, isLoading: quickLoading } = useQuery<QuickAnalyticsResponse>({
    queryKey: ["/api/student/quick-analytics", studentId],
    enabled: !!studentId && !reportData?.report
  });

  const { data: historyData } = useQuery<HistoryResponse>({
    queryKey: ["/api/student/performance-report", studentId, "history"],
    enabled: !!studentId
  });

  const generateReportMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/student/performance-report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studentId, generatedBy: "student" })
      });
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to generate report");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/student/performance-report", studentId] });
      queryClient.invalidateQueries({ queryKey: ["/api/student/performance-report", studentId, "history"] });
      toast({ title: "Report Generated", description: "Your performance report has been updated." });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to generate report",
        variant: "destructive"
      });
    }
  });

  const report = reportData?.report;

  if (reportLoading || quickLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  if (!report && quickData?.hasData === false) {
    return (
      <Card className="bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-950/20 dark:to-pink-950/20 border-violet-200 dark:border-violet-800">
        <CardContent className="py-12 text-center">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-violet-500 opacity-50" />
          <h3 className="text-xl font-semibold mb-2">No Performance Data Yet</h3>
          <p className="text-muted-foreground mb-4">
            Complete your first olympiad exam to see your performance analytics.
          </p>
        </CardContent>
      </Card>
    );
  }

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case "upward": return <TrendingUp className="w-5 h-5 text-green-500" />;
      case "downward": return <TrendingDown className="w-5 h-5 text-red-500" />;
      default: return <Minus className="w-5 h-5 text-yellow-500" />;
    }
  };

  const getTrendColor = (trend: string) => {
    switch (trend) {
      case "upward": return "text-green-600 bg-green-50 dark:bg-green-950/30";
      case "downward": return "text-red-600 bg-red-50 dark:bg-red-950/30";
      default: return "text-yellow-600 bg-yellow-50 dark:bg-yellow-950/30";
    }
  };

  const getStrengthColor = (strength: string) => {
    switch (strength) {
      case "strong": return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400";
      case "weak": return "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400";
      default: return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400";
    }
  };

  const subjectAnalysis = report?.subjectWiseAnalysis as any[] || [];
  const insights = report?.insights as any[] || [];
  const subjectSuggestions = report?.subjectSuggestions as any[] || [];
  const behaviouralSuggestions = report?.behaviouralSuggestions as any[] || [];
  const performanceTimeline = report?.performanceTimeline as any[] || [];
  const overallChange = report?.overallChange as any;

  const radarData = subjectAnalysis.map(s => ({
    subject: s.subject,
    accuracy: s.accuracy,
    fullMark: 100
  }));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
            Performance Analytics
          </h2>
          <p className="text-muted-foreground">
            Your comprehensive performance insights across all olympiads
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => generateReportMutation.mutate()}
            disabled={generateReportMutation.isPending}
            data-testid="button-generate-report"
          >
            {generateReportMutation.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4 mr-2" />
            )}
            {report ? "Update Report" : "Generate Report"}
          </Button>
        </div>
      </div>

      {!report && quickData?.hasData && (
        <Card className="bg-gradient-to-r from-violet-500 to-pink-500 text-white border-0">
          <CardContent className="py-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <p className="text-violet-100 mb-1">Quick Snapshot</p>
                <p className="text-3xl font-bold">{quickData.snapshot.totalExams} Exams</p>
                <p className="text-violet-100">Avg: {quickData.snapshot.avgPercentage}%</p>
              </div>
              <Button 
                variant="secondary" 
                onClick={() => generateReportMutation.mutate()}
                disabled={generateReportMutation.isPending}
              >
                {generateReportMutation.isPending ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 mr-2" />
                )}
                Generate Full Report
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {report && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0 }}
            >
              <Card className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Trophy className="w-8 h-8 text-violet-500" />
                    <Badge className={getTrendColor(report.improvementTrend || "stable")}>
                      {getTrendIcon(report.improvementTrend || "stable")}
                      <span className="ml-1 capitalize">{report.improvementTrend}</span>
                    </Badge>
                  </div>
                  <p className="text-3xl font-bold">{report.totalOlympiadsCompleted}</p>
                  <p className="text-sm text-muted-foreground">Olympiads Completed</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <Target className="w-8 h-8 text-pink-500" />
                    {overallChange && (
                      <Badge variant={overallChange.changePercent >= 0 ? "default" : "destructive"} className="text-xs">
                        {overallChange.changePercent >= 0 ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                        {Math.abs(overallChange.changePercent).toFixed(1)}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-3xl font-bold">{report.overallAveragePercentage?.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Average Score</p>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>
                  <p className="text-3xl font-bold">{report.overallAccuracy?.toFixed(1)}%</p>
                  <p className="text-sm text-muted-foreground">Overall Accuracy</p>
                  <Progress value={report.overallAccuracy || 0} className="mt-2 h-2" />
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="hover-elevate">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Brain className="w-8 h-8 text-cyan-500" />
                  </div>
                  <p className="text-3xl font-bold">{report.totalQuestionsAttempted}</p>
                  <p className="text-sm text-muted-foreground">Questions Attempted</p>
                  <div className="flex gap-2 mt-2 text-xs">
                    <span className="text-green-600">{report.totalCorrectAnswers} correct</span>
                    <span className="text-red-600">{report.totalWrongAnswers} wrong</span>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg">
                    <Award className="w-6 h-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-green-600 dark:text-green-400 font-medium">Best Performance</p>
                    <p className="font-semibold truncate">{report.bestPerformanceExam?.title || "N/A"}</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">
                      {report.bestPerformancePercentage?.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 bg-orange-100 dark:bg-orange-900/50 rounded-lg">
                    <AlertTriangle className="w-6 h-6 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Needs Improvement</p>
                    <p className="font-semibold truncate">{report.worstPerformanceExam?.title || "N/A"}</p>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">
                      {report.worstPerformancePercentage?.toFixed(1)}%
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="subjects">Subjects</TabsTrigger>
              <TabsTrigger value="insights">Insights</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-violet-500" />
                    Performance Trend
                  </CardTitle>
                  <CardDescription>Your performance across all olympiads over time</CardDescription>
                </CardHeader>
                <CardContent>
                  {performanceTimeline.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={performanceTimeline}>
                          <defs>
                            <linearGradient id="colorPercentage" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                              <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis 
                            dataKey="examTitle" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis domain={[0, 100]} />
                          <Tooltip 
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                  <div className="bg-background border rounded-lg p-3 shadow-lg">
                                    <p className="font-medium">{data.examTitle}</p>
                                    <p className="text-violet-600">{data.percentage.toFixed(1)}%</p>
                                    <p className="text-xs text-muted-foreground">{data.subject}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Area 
                            type="monotone" 
                            dataKey="percentage" 
                            stroke="#8B5CF6" 
                            fillOpacity={1} 
                            fill="url(#colorPercentage)" 
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <BarChart3 className="w-12 h-12 mx-auto mb-4 opacity-30" />
                      <p>Not enough data for trend analysis</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="subjects" className="space-y-6 mt-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <PieChartIcon className="w-5 h-5 text-violet-500" />
                      Subject-wise Accuracy
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {subjectAnalysis.length > 0 ? (
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" />
                            <PolarRadiusAxis domain={[0, 100]} />
                            <Radar
                              name="Accuracy"
                              dataKey="accuracy"
                              stroke="#8B5CF6"
                              fill="#8B5CF6"
                              fillOpacity={0.5}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>
                    ) : (
                      <div className="text-center py-12 text-muted-foreground">
                        <p>No subject data available</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-violet-500" />
                      Subject Performance
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {subjectAnalysis.map((subject, index) => (
                        <div key={subject.subject} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{subject.subject}</span>
                              <Badge className={getStrengthColor(subject.strength)}>
                                {subject.strength}
                              </Badge>
                            </div>
                            <span className="text-sm font-bold">{subject.accuracy.toFixed(1)}%</span>
                          </div>
                          <Progress 
                            value={subject.accuracy} 
                            className="h-2"
                            style={{
                              background: `linear-gradient(to right, ${CHART_COLORS[index % CHART_COLORS.length]}20, transparent)`
                            }}
                          />
                          <div className="flex justify-between text-xs text-muted-foreground">
                            <span>{subject.totalAttempts} exams</span>
                            <span>{subject.correctAnswers} correct / {subject.wrongAnswers} wrong</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-violet-500" />
                    Subject Comparison
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {subjectAnalysis.length > 0 ? (
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={subjectAnalysis}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                          <XAxis dataKey="subject" />
                          <YAxis domain={[0, 100]} />
                          <Tooltip />
                          <Legend />
                          <Bar dataKey="accuracy" name="Accuracy %" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                          <Bar dataKey="avgScore" name="Avg Score %" fill="#EC4899" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-muted-foreground">
                      <p>No subject data available</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="insights" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="w-5 h-5 text-yellow-500" />
                    Smart Insights
                  </CardTitle>
                  <CardDescription>Personalized observations based on your performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {insights.length > 0 ? insights.map((insight, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`p-4 rounded-lg border ${
                          insight.priority === "high" 
                            ? "bg-red-50 border-red-200 dark:bg-red-950/20 dark:border-red-800" 
                            : insight.priority === "positive"
                            ? "bg-green-50 border-green-200 dark:bg-green-950/20 dark:border-green-800"
                            : "bg-yellow-50 border-yellow-200 dark:bg-yellow-950/20 dark:border-yellow-800"
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {insight.priority === "positive" ? (
                            <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                          ) : insight.priority === "high" ? (
                            <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                          ) : (
                            <Lightbulb className="w-5 h-5 text-yellow-600 mt-0.5" />
                          )}
                          <div>
                            <p className="text-sm">{insight.message}</p>
                            {insight.actionable && (
                              <Badge variant="outline" className="mt-2 text-xs">
                                Action Required
                              </Badge>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    )) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <Lightbulb className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>Complete more exams to get personalized insights</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <BookOpen className="w-5 h-5 text-violet-500" />
                      Subject Suggestions
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {subjectSuggestions.length > 0 ? subjectSuggestions.map((suggestion: any, index: number) => (
                        <div 
                          key={index}
                          className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                        >
                          <div>
                            <p className="font-medium">{suggestion.subject}</p>
                            <p className="text-sm text-muted-foreground">{suggestion.action}</p>
                          </div>
                          <Badge variant={
                            suggestion.priority === "high" ? "destructive" 
                            : suggestion.priority === "low" ? "secondary" 
                            : "default"
                          }>
                            {suggestion.priority}
                          </Badge>
                        </div>
                      )) : (
                        <p className="text-center text-muted-foreground py-4">
                          No suggestions available yet
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Brain className="w-5 h-5 text-pink-500" />
                      Behavioural Tips
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {behaviouralSuggestions.length > 0 ? behaviouralSuggestions.map((suggestion: any, index: number) => (
                        <div 
                          key={index}
                          className="p-3 rounded-lg bg-pink-50 dark:bg-pink-950/20 border border-pink-200 dark:border-pink-800"
                        >
                          <p className="text-sm">{suggestion.message}</p>
                        </div>
                      )) : (
                        <p className="text-center text-muted-foreground py-4">
                          Keep up the good work!
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="history" className="space-y-6 mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <History className="w-5 h-5 text-violet-500" />
                    Report History
                  </CardTitle>
                  <CardDescription>View your previous performance reports</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {historyData?.reports?.length > 0 ? historyData.reports.map((histReport: any) => (
                      <div 
                        key={histReport.id}
                        className={`flex items-center justify-between p-4 rounded-lg border transition-colors ${
                          histReport.isLatest 
                            ? "bg-violet-50 border-violet-200 dark:bg-violet-950/20 dark:border-violet-800" 
                            : "bg-muted/30 hover:bg-muted/50"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <FileText className={`w-5 h-5 ${histReport.isLatest ? "text-violet-600" : "text-muted-foreground"}`} />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="font-medium">
                                {format(new Date(histReport.createdAt), "PPP")}
                              </p>
                              {histReport.isLatest && (
                                <Badge className="bg-violet-500">Latest</Badge>
                              )}
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              <span>{histReport.totalOlympiadsAttempted} exams</span>
                              <span>{histReport.overallAveragePercentage?.toFixed(1)}% avg</span>
                              <span className="capitalize">{histReport.improvementTrend} trend</span>
                            </div>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      </div>
                    )) : (
                      <div className="text-center py-8 text-muted-foreground">
                        <History className="w-12 h-12 mx-auto mb-4 opacity-30" />
                        <p>No report history available</p>
                        <Button 
                          variant="outline" 
                          className="mt-4"
                          onClick={() => generateReportMutation.mutate()}
                          disabled={generateReportMutation.isPending}
                        >
                          Generate Your First Report
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  );
}
