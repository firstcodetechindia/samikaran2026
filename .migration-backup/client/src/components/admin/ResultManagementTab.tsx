import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import {
  Trophy, Calculator, Download, Search, RefreshCw, Eye, Lock, Unlock,
  ChevronRight, CheckCircle, XCircle, Clock, Users, Target, Award,
  BarChart3, FileText, Key, Globe, EyeOff, AlertCircle, Loader2,
  ArrowUpDown, Filter, ChevronLeft, Medal, TrendingUp, Calendar
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from "recharts";

const CHART_COLORS = ["#8B5CF6", "#EC4899", "#06B6D4", "#10B981", "#F59E0B", "#EF4444"];

interface OlympiadWithResults {
  id: number;
  title: string;
  subject: string;
  totalMarks: number;
  totalQuestions: number;
  startTime: string;
  endTime: string;
  status: string;
  negativeMarking: boolean;
  publication: {
    isCalculated: boolean;
    isPublished: boolean;
    isLocked: boolean;
    isAnswerKeyReleased: boolean;
    resultVisibility: string;
    totalStudentsAppeared: number;
    averageMarks: number;
    highestMarks: number;
    lowestMarks: number;
    passPercentage: number;
    scoreDistribution: { range: string; count: number }[];
    questionWiseAnalytics: any[];
    calculatedAt: string;
    publishedAt: string;
  } | null;
  totalAttempts: number;
  completedAttempts: number;
}

export default function ResultManagementTab() {
  const { toast } = useToast();
  const [selectedOlympiad, setSelectedOlympiad] = useState<OlympiadWithResults | null>(null);
  const [activeView, setActiveView] = useState<"list" | "results" | "analytics">("list");
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<"completed" | "ongoing" | "upcoming">("completed");
  const [calculateDialogOpen, setCalculateDialogOpen] = useState(false);
  const [tieBreakerCriteria, setTieBreakerCriteria] = useState<string[]>([]);
  const [rankingMethod, setRankingMethod] = useState<"standard" | "dense">("standard");
  const [resultsPage, setResultsPage] = useState(1);
  const [resultsSearch, setResultsSearch] = useState("");
  const [resultsSortBy, setResultsSortBy] = useState("rank");

  const { data: olympiads, isLoading: loadingOlympiads, refetch: refetchOlympiads } = useQuery<OlympiadWithResults[]>({
    queryKey: ["/api/admin/results/olympiads"],
  });

  useEffect(() => {
    if (selectedOlympiad && olympiads) {
      const updated = olympiads.find(o => o.id === selectedOlympiad.id);
      if (updated && JSON.stringify(updated.publication) !== JSON.stringify(selectedOlympiad.publication)) {
        setSelectedOlympiad(updated);
      }
    }
  }, [olympiads]);

  const { data: resultsData, isLoading: loadingResults, refetch: refetchResults } = useQuery({
    queryKey: [`/api/admin/results/${selectedOlympiad?.id}?page=${resultsPage}&search=${resultsSearch}&sortBy=${resultsSortBy}`],
    enabled: !!selectedOlympiad && activeView === "results",
  });

  const { data: toppersData, isLoading: loadingToppers } = useQuery({
    queryKey: [`/api/admin/results/${selectedOlympiad?.id}/toppers`],
    enabled: !!selectedOlympiad && activeView === "analytics",
  });

  const { data: auditLogs } = useQuery({
    queryKey: [`/api/admin/results/${selectedOlympiad?.id}/audit`],
    enabled: !!selectedOlympiad,
  });

  const calculateMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/admin/results/calculate/${selectedOlympiad?.id}`, { 
        adminName: "Super Admin", 
        tieBreakerCriteria,
        rankingMethod 
      });
      return res.json();
    },
    onSuccess: (data: any) => {
      toast({ title: "Results Calculated", description: data.message || "Results calculated successfully" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/results/olympiads"] });
      setCalculateDialogOpen(false);
      refetchOlympiads();
      refetchResults();
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message || "Failed to calculate results", variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async ({ publish, visibility }: { publish: boolean; visibility?: string }) => {
      return apiRequest("POST", `/api/admin/results/${selectedOlympiad?.id}/publish`, { publish, visibility, adminName: "Super Admin" });
    },
    onSuccess: () => {
      toast({ title: "Success", description: "Publication status updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/results/olympiads"] });
      refetchOlympiads();
    },
  });

  const lockMutation = useMutation({
    mutationFn: async (lock: boolean) => {
      return apiRequest("POST", `/api/admin/results/${selectedOlympiad?.id}/lock`, { lock, adminName: "Super Admin" });
    },
    onSuccess: (_, lock) => {
      toast({ title: "Success", description: lock ? "Results locked" : "Results unlocked" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/results/olympiads"] });
      refetchOlympiads();
    },
  });

  const answerKeyMutation = useMutation({
    mutationFn: async (release: boolean) => {
      return apiRequest("POST", `/api/admin/results/${selectedOlympiad?.id}/answer-key`, { release, adminName: "Super Admin" });
    },
    onSuccess: (_, release) => {
      toast({ title: "Success", description: release ? "Answer key released" : "Answer key hidden" });
      queryClient.invalidateQueries({ queryKey: ["/api/admin/results/olympiads"] });
      refetchOlympiads();
    },
  });

  const filteredOlympiads = olympiads?.filter(o => 
    o.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    o.subject.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleExport = async (formatType: "csv" | "json") => {
    if (!selectedOlympiad) return;
    try {
      const authData = localStorage.getItem("superAdminAuth");
      const headers: Record<string, string> = {};
      if (authData) {
        const parsed = JSON.parse(authData);
        if (parsed.sessionToken) {
          headers["Authorization"] = `Bearer ${parsed.sessionToken}`;
        }
      }
      const response = await fetch(`/api/admin/results/${selectedOlympiad.id}/export?format=${formatType}`, { headers, credentials: "include" });
      if (formatType === "csv") {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedOlympiad.title}_results.csv`;
        a.click();
      } else {
        const data = await response.json();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${selectedOlympiad.title}_results.json`;
        a.click();
      }
      toast({ title: "Export Complete", description: `Results exported as ${formatType.toUpperCase()}` });
    } catch {
      toast({ title: "Export Failed", description: "Could not export results", variant: "destructive" });
    }
  };

  const getStatusBadge = (pub: OlympiadWithResults["publication"]) => {
    if (!pub) return <Badge variant="outline">Not Calculated</Badge>;
    if (pub.isLocked) return <Badge className="bg-red-500/10 text-red-500">Locked</Badge>;
    if (pub.isPublished) return <Badge className="bg-green-500/10 text-green-500">Published</Badge>;
    if (pub.isCalculated) return <Badge className="bg-yellow-500/10 text-yellow-600">Ready</Badge>;
    return <Badge variant="outline">Pending</Badge>;
  };

  if (activeView === "list") {
    const pastOlympiads = filteredOlympiads.filter(o => new Date(o.endTime) < new Date());
    const activeOlympiads = filteredOlympiads.filter(o => new Date(o.startTime) <= new Date() && new Date(o.endTime) >= new Date());
    const upcomingOlympiads = filteredOlympiads.filter(o => new Date(o.startTime) > new Date());

    const renderOlympiadCard = (olympiad: OlympiadWithResults, index: number) => (
      <motion.div
        key={olympiad.id}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <div className="group relative overflow-hidden rounded-xl border bg-gradient-to-br from-card/80 to-card hover:shadow-lg hover:border-primary/30 transition-all duration-300">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-transparent to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          <div className="relative p-5">
            <div className="flex items-start justify-between gap-4">
              {/* Left side - clickable to view details */}
              <div 
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => {
                  setSelectedOlympiad(olympiad);
                  setActiveView("results");
                }}
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className={`p-2.5 rounded-xl ${
                    olympiad.publication?.isCalculated 
                      ? 'bg-gradient-to-br from-green-500/20 to-emerald-500/20' 
                      : olympiad.completedAttempts > 0 
                        ? 'bg-gradient-to-br from-amber-500/20 to-orange-500/20'
                        : 'bg-gradient-to-br from-gray-500/10 to-gray-500/5'
                  }`}>
                    <Trophy className={`w-5 h-5 ${
                      olympiad.publication?.isCalculated 
                        ? 'text-green-600' 
                        : olympiad.completedAttempts > 0 
                          ? 'text-amber-600'
                          : 'text-muted-foreground'
                    }`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-base truncate group-hover:text-primary transition-colors">
                      {olympiad.title}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs font-medium">
                        {olympiad.subject}
                      </Badge>
                      {getStatusBadge(olympiad.publication)}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-blue-600" />
                    <span><span className="font-semibold text-foreground">{olympiad.completedAttempts}</span> completed</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Target className="w-3.5 h-3.5 text-purple-600" />
                    <span><span className="font-semibold text-foreground">{olympiad.totalMarks}</span> marks</span>
                  </div>
                  {olympiad.publication?.isCalculated && (
                    <div className="flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-green-600" />
                      <span><span className="font-semibold text-foreground">{olympiad.publication.averageMarks.toFixed(1)}</span> avg</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Right side - arrow to view details */}
              <div className="flex flex-col items-end justify-center">
                <ChevronRight 
                  className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all cursor-pointer" 
                  onClick={() => {
                    setSelectedOlympiad(olympiad);
                    setActiveView("results");
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    );

    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20">
                <Trophy className="w-6 h-6 text-primary" />
              </div>
              Result Management
            </h2>
            <p className="text-muted-foreground mt-1">Calculate, analyze and publish olympiad results</p>
          </div>
          <Button onClick={() => refetchOlympiads()} variant="outline" size="sm" className="gap-2">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Search and Filter Row */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search olympiads..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-card/50 border-border/50"
              data-testid="input-search-olympiads"
            />
          </div>
          
          {/* Category Filter Tabs */}
          <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-lg">
            <Button
              size="sm"
              variant={categoryFilter === "completed" ? "default" : "ghost"}
              className={`gap-2 ${categoryFilter === "completed" ? "bg-green-600 hover:bg-green-700 text-white" : ""}`}
              onClick={() => setCategoryFilter("completed")}
              data-testid="filter-completed"
            >
              <CheckCircle className="w-4 h-4" />
              Completed ({pastOlympiads.length})
            </Button>
            <Button
              size="sm"
              variant={categoryFilter === "ongoing" ? "default" : "ghost"}
              className={`gap-2 ${categoryFilter === "ongoing" ? "bg-amber-600 hover:bg-amber-700 text-white" : ""}`}
              onClick={() => setCategoryFilter("ongoing")}
              data-testid="filter-ongoing"
            >
              <Clock className="w-4 h-4" />
              Ongoing ({activeOlympiads.length})
            </Button>
            <Button
              size="sm"
              variant={categoryFilter === "upcoming" ? "default" : "ghost"}
              className={`gap-2 ${categoryFilter === "upcoming" ? "bg-blue-600 hover:bg-blue-700 text-white" : ""}`}
              onClick={() => setCategoryFilter("upcoming")}
              data-testid="filter-upcoming"
            >
              <Calendar className="w-4 h-4" />
              Upcoming ({upcomingOlympiads.length})
            </Button>
          </div>
        </div>

        {loadingOlympiads ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-10 h-10 animate-spin text-primary" />
              <p className="text-muted-foreground text-sm">Loading olympiads...</p>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Display based on selected category */}
            {categoryFilter === "completed" && (
              pastOlympiads.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {pastOlympiads.map((olympiad, index) => renderOlympiadCard(olympiad, index))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex p-4 rounded-2xl bg-green-500/10 mb-4">
                    <CheckCircle className="w-12 h-12 text-green-500/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No completed olympiads</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Completed olympiads will appear here</p>
                </div>
              )
            )}

            {categoryFilter === "ongoing" && (
              activeOlympiads.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {activeOlympiads.map((olympiad, index) => renderOlympiadCard(olympiad, index))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex p-4 rounded-2xl bg-amber-500/10 mb-4">
                    <Clock className="w-12 h-12 text-amber-500/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No ongoing olympiads</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Active olympiads will appear here</p>
                </div>
              )
            )}

            {categoryFilter === "upcoming" && (
              upcomingOlympiads.length > 0 ? (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {upcomingOlympiads.map((olympiad, index) => renderOlympiadCard(olympiad, index))}
                </div>
              ) : (
                <div className="text-center py-16">
                  <div className="inline-flex p-4 rounded-2xl bg-blue-500/10 mb-4">
                    <Calendar className="w-12 h-12 text-blue-500/50" />
                  </div>
                  <p className="text-muted-foreground font-medium">No upcoming olympiads</p>
                  <p className="text-sm text-muted-foreground/70 mt-1">Scheduled olympiads will appear here</p>
                </div>
              )
            )}
          </div>
        )}
      </div>
    );
  }

  const publication = selectedOlympiad?.publication;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Button variant="ghost" onClick={() => {
          setActiveView("list");
          setSelectedOlympiad(null);
        }}>
          <ChevronLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <div className="flex-1">
          <h2 className="text-xl font-bold">{selectedOlympiad?.title}</h2>
          <p className="text-sm text-muted-foreground">{selectedOlympiad?.subject}</p>
        </div>
        {getStatusBadge(publication)}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publication?.totalStudentsAppeared || 0}</p>
                <p className="text-xs text-muted-foreground">Students Appeared</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-green-500/10">
                <TrendingUp className="w-5 h-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publication?.averageMarks?.toFixed(1) || "-"}</p>
                <p className="text-xs text-muted-foreground">Average Marks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-yellow-500/10">
                <Trophy className="w-5 h-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publication?.highestMarks || "-"}</p>
                <p className="text-xs text-muted-foreground">Highest Marks</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-blue-500/10">
                <Target className="w-5 h-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{publication?.passPercentage?.toFixed(1) || "-"}%</p>
                <p className="text-xs text-muted-foreground">Pass Percentage</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-shrink-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <CardTitle>Result Controls</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {!publication?.isCalculated ? (
                <Button onClick={() => setCalculateDialogOpen(true)} data-testid="button-calculate-results">
                  <Calculator className="w-4 h-4 mr-2" />
                  Calculate Results
                </Button>
              ) : (
                <>
                  {!publication.isLocked && (
                    <Button variant="outline" onClick={() => {
                      setTieBreakerCriteria([]);
                      calculateMutation.mutate();
                    }} disabled={calculateMutation.isPending}>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Recalculate
                    </Button>
                  )}
                  <Button
                    variant={publication.isPublished ? "outline" : "default"}
                    onClick={() => publishMutation.mutate({ 
                      publish: !publication.isPublished,
                      visibility: "students_only"
                    })}
                    disabled={publishMutation.isPending}
                    data-testid="button-publish-results"
                  >
                    {publication.isPublished ? (
                      <>
                        <EyeOff className="w-4 h-4 mr-2" />
                        Unpublish
                      </>
                    ) : (
                      <>
                        <Globe className="w-4 h-4 mr-2" />
                        Publish
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => lockMutation.mutate(!publication.isLocked)}
                    disabled={lockMutation.isPending}
                    data-testid="button-lock-results"
                  >
                    {publication.isLocked ? (
                      <>
                        <Unlock className="w-4 h-4 mr-2" />
                        Unlock
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Lock
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => answerKeyMutation.mutate(!publication.isAnswerKeyReleased)}
                    disabled={answerKeyMutation.isPending}
                    data-testid="button-answer-key"
                  >
                    <Key className="w-4 h-4 mr-2" />
                    {publication.isAnswerKeyReleased ? "Hide Key" : "Release Key"}
                  </Button>
                </>
              )}
            </div>
          </div>
        </CardHeader>
      </Card>

      <Tabs value={activeView} onValueChange={(v) => setActiveView(v as any)}>
        <TabsList>
          <TabsTrigger value="results">
            <Users className="w-4 h-4 mr-2" />
            Results
          </TabsTrigger>
          <TabsTrigger value="analytics">
            <BarChart3 className="w-4 h-4 mr-2" />
            Analytics
          </TabsTrigger>
        </TabsList>

        <TabsContent value="results" className="space-y-4">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={resultsSearch}
                onChange={(e) => setResultsSearch(e.target.value)}
                className="pl-10"
                data-testid="input-search-results"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={resultsSortBy} onValueChange={setResultsSortBy}>
                <SelectTrigger className="w-[140px]" data-testid="select-sort-results">
                  <ArrowUpDown className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="rank">Rank</SelectItem>
                  <SelectItem value="marks">Marks</SelectItem>
                  <SelectItem value="name">Name</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => handleExport("csv")} data-testid="button-export-csv">
                <Download className="w-4 h-4 mr-2" />
                CSV
              </Button>
              <Button variant="outline" onClick={() => handleExport("json")} data-testid="button-export-json">
                <Download className="w-4 h-4 mr-2" />
                JSON
              </Button>
            </div>
          </div>

          {loadingResults ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          ) : (
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">S.No</TableHead>
                    <TableHead className="w-16">Rank</TableHead>
                    <TableHead>Student</TableHead>
                    <TableHead>Grade</TableHead>
                    <TableHead className="text-center">Correct</TableHead>
                    <TableHead className="text-center">Wrong</TableHead>
                    <TableHead className="text-center">Marks</TableHead>
                    <TableHead className="text-center">%</TableHead>
                    <TableHead>Remark</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(resultsData as any)?.results?.map((item: any, index: number) => (
                    <TableRow key={item.result.id}>
                      <TableCell className="text-muted-foreground">
                        {((resultsPage - 1) * 50) + index + 1}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          {item.result.overallRank <= 3 && (
                            <Medal className={`w-4 h-4 ${
                              item.result.overallRank === 1 ? "text-yellow-500" :
                              item.result.overallRank === 2 ? "text-gray-400" :
                              "text-amber-600"
                            }`} />
                          )}
                          <span className="font-medium">{item.result.overallRank}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{item.student?.firstName} {item.student?.lastName}</p>
                          <p className="text-xs text-muted-foreground">{item.student?.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>{item.student?.gradeLevel || "-"}</TableCell>
                      <TableCell className="text-center">
                        <span className="text-green-600 font-medium">{item.result.correctAnswers}</span>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className="text-red-500">{item.result.wrongAnswers}</span>
                      </TableCell>
                      <TableCell className="text-center font-bold">
                        {item.result.finalObtainedMarks}/{item.result.totalMaxMarks}
                      </TableCell>
                      <TableCell className="text-center">
                        {item.result.percentage.toFixed(1)}%
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={
                          item.result.performanceRemark === "Excellent" ? "bg-green-500/10 text-green-600" :
                          item.result.performanceRemark === "Very Good" ? "bg-blue-500/10 text-blue-600" :
                          item.result.performanceRemark === "Good" ? "bg-yellow-500/10 text-yellow-600" :
                          "bg-gray-500/10"
                        }>
                          {item.result.performanceRemark}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )) || (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No results calculated yet
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Score Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                {publication?.scoreDistribution ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={publication.scoreDistribution}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" fontSize={12} />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#8B5CF6" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                    No data available
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Top 10 Performers</CardTitle>
              </CardHeader>
              <CardContent>
                {loadingToppers ? (
                  <div className="flex items-center justify-center h-[300px]">
                    <Loader2 className="w-6 h-6 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {(toppersData as any)?.map((item: any, idx: number) => (
                      <div key={item.result.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          idx === 0 ? "bg-yellow-500 text-white" :
                          idx === 1 ? "bg-gray-400 text-white" :
                          idx === 2 ? "bg-amber-600 text-white" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {item.result.overallRank}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {item.student?.firstName} {item.student?.lastName}
                          </p>
                          <p className="text-xs text-muted-foreground">{item.student?.schoolName || "N/A"}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-primary">{item.result.finalObtainedMarks}</p>
                          <p className="text-xs text-muted-foreground">{item.result.percentage.toFixed(1)}%</p>
                        </div>
                      </div>
                    )) || (
                      <div className="text-center py-8 text-muted-foreground">
                        No toppers data
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Question-wise Analysis</CardTitle>
              <CardDescription>Performance breakdown by question difficulty</CardDescription>
            </CardHeader>
            <CardContent>
              {publication?.questionWiseAnalytics?.length ? (
                <div className="space-y-2">
                  {publication.questionWiseAnalytics.slice(0, 10).map((q: any, idx: number) => (
                    <div key={q.questionId} className="flex items-center gap-4">
                      <span className="w-8 text-sm text-muted-foreground">Q{idx + 1}</span>
                      <div className="flex-1">
                        <Progress 
                          value={q.attempted > 0 ? (q.correct / q.attempted) * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                      <div className="flex items-center gap-4 text-sm w-40">
                        <span className="text-green-600">{q.correct} ✓</span>
                        <span className="text-red-500">{q.wrong} ✗</span>
                        <span className="text-muted-foreground">{q.difficulty}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  No question analytics available
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Audit Log</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-[200px] overflow-y-auto">
                {(auditLogs as any)?.map((log: any) => (
                  <div key={log.id} className="flex items-center gap-3 text-sm p-2 rounded bg-muted/50">
                    <Clock className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                    <span className="flex-1">
                      <span className="font-medium capitalize">{log.action.replace(/_/g, " ")}</span>
                      {" by "}{log.performedBy}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      {format(new Date(log.createdAt), "MMM d, yyyy HH:mm")}
                    </span>
                  </div>
                )) || (
                  <div className="text-center py-4 text-muted-foreground">
                    No audit logs
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Calculate Results Dialog - shared between list and detail views */}
      <Dialog open={calculateDialogOpen} onOpenChange={setCalculateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Calculate Results</DialogTitle>
            <DialogDescription>
              Calculate results for "{selectedOlympiad?.title}"
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-4 py-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Ranking Method</label>
              <p className="text-xs text-muted-foreground mb-2">
                Choose how ranks are assigned when students have the same marks.
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div 
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    rankingMethod === "standard" 
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" 
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                  }`}
                  onClick={() => setRankingMethod("standard")}
                  data-testid="ranking-standard"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      rankingMethod === "standard" ? "border-violet-500" : "border-gray-400"
                    }`}>
                      {rankingMethod === "standard" && <div className="w-2 h-2 rounded-full bg-violet-500" />}
                    </div>
                    <span className="font-medium text-sm">Standard Competition</span>
                  </div>
                  <p className="text-xs text-muted-foreground">1, 2, 2, 2, 5, 5, 7...</p>
                  <p className="text-xs text-muted-foreground mt-1">Gaps after ties (Olympics style)</p>
                </div>
                <div 
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    rankingMethod === "dense" 
                      ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" 
                      : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                  }`}
                  onClick={() => setRankingMethod("dense")}
                  data-testid="ranking-dense"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      rankingMethod === "dense" ? "border-violet-500" : "border-gray-400"
                    }`}>
                      {rankingMethod === "dense" && <div className="w-2 h-2 rounded-full bg-violet-500" />}
                    </div>
                    <span className="font-medium text-sm">Dense Ranking</span>
                  </div>
                  <p className="text-xs text-muted-foreground">1, 2, 2, 2, 3, 3, 4...</p>
                  <p className="text-xs text-muted-foreground mt-1">No gaps (Academic style)</p>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium">Tie-Breaker Criteria (Priority Order)</label>
              <p className="text-xs text-muted-foreground mb-2">
                Select multiple criteria. They will be applied in order from top to bottom.
              </p>
              <div className="space-y-3">
                {[
                  { id: "less_negative", label: "Less Negative Marks", desc: "Student with fewer wrong answers ranks higher" },
                  { id: "less_time", label: "Less Time Taken", desc: "Student who finished faster ranks higher" },
                  { id: "more_correct", label: "More Correct Answers", desc: "Student with more correct answers ranks higher" },
                  { id: "younger_first", label: "Younger Student First", desc: "Younger student (by DOB) ranks higher" },
                  { id: "elder_first", label: "Elder Student First", desc: "Older student (by DOB) ranks higher" },
                ].map((option) => (
                  <div 
                    key={option.id} 
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                      tieBreakerCriteria.includes(option.id) 
                        ? "border-violet-500 bg-violet-50 dark:bg-violet-950/30" 
                        : "border-gray-200 hover:border-gray-300 dark:border-gray-700"
                    }`}
                    onClick={() => {
                      setTieBreakerCriteria(prev => 
                        prev.includes(option.id) 
                          ? prev.filter(c => c !== option.id)
                          : [...prev, option.id]
                      );
                    }}
                  >
                    <Checkbox 
                      checked={tieBreakerCriteria.includes(option.id)}
                      onCheckedChange={(checked) => {
                        setTieBreakerCriteria(prev => 
                          checked 
                            ? [...prev, option.id]
                            : prev.filter(c => c !== option.id)
                        );
                      }}
                      data-testid={`checkbox-${option.id}`}
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium">{option.label}</p>
                      <p className="text-xs text-muted-foreground">{option.desc}</p>
                    </div>
                    {tieBreakerCriteria.includes(option.id) && (
                      <Badge variant="secondary" className="text-xs">
                        Priority {tieBreakerCriteria.indexOf(option.id) + 1}
                      </Badge>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {tieBreakerCriteria.length === 0 
                  ? "No tie-breaker selected. Students with same marks will get the same rank."
                  : `Selected: ${tieBreakerCriteria.length} criteria. Applied in selection order.`
                }
              </p>
            </div>
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <p className="font-medium mb-2">Summary</p>
              <ul className="space-y-1 text-muted-foreground">
                <li>Total Attempts: {selectedOlympiad?.totalAttempts}</li>
                <li>Completed: {selectedOlympiad?.completedAttempts}</li>
                <li>Max Marks: {selectedOlympiad?.totalMarks}</li>
                <li>Negative Marking: {selectedOlympiad?.negativeMarking ? "Yes" : "No"}</li>
              </ul>
            </div>
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCalculateDialogOpen(false)}>Cancel</Button>
            <Button 
              onClick={() => calculateMutation.mutate()}
              disabled={calculateMutation.isPending}
              data-testid="button-confirm-calculate"
            >
              {calculateMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Calculate Results
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
