import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogBody } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, TrendingUp, Target, Award, BookOpen, GraduationCap, BarChart3, Brain } from "lucide-react";
import { PerformanceAnalytics } from "@/components/student/PerformanceAnalytics";

interface StudentPerformanceDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  student: {
    id: number;
    name: string;
    grade?: string;
    school?: string;
    city?: string;
    state?: string;
  } | null;
  showFullAnalytics?: boolean;
}

function seededRandom(seed: number): () => number {
  let current = seed;
  return () => {
    current = (current * 9301 + 49297) % 233280;
    return current / 233280;
  };
}

export function StudentPerformanceDialog({ open, onOpenChange, student, showFullAnalytics = true }: StudentPerformanceDialogProps) {
  const [activeTab, setActiveTab] = useState("overview");
  
  if (!student) return null;

  const random = seededRandom(student.id * 1000);
  
  const latestOlympiad = {
    name: "Ganit Olympiad 2025",
    cityRank: Math.floor(random() * 20) + 1,
    stateRank: Math.floor(random() * 50) + 10,
    countryRank: Math.floor(random() * 300) + 50,
    score: Math.floor(random() * 30) + 70,
  };

  const overallStats = {
    cityRank: Math.floor(random() * 15) + 1,
    stateRank: Math.floor(random() * 40) + 5,
    countryRank: Math.floor(random() * 200) + 30,
    completedExams: Math.floor(random() * 5) + 1,
    avgScore: Math.floor(random() * 25) + 70,
    certificates: Math.floor(random() * 3) + 1,
    percentile: Math.floor(random() * 10) + 90,
  };

  const renderOverviewTab = () => (
    <div className="space-y-4">
      <div className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center text-white font-bold text-lg">
          {student.name.split(" ").map(n => n[0]).join("").toUpperCase()}
        </div>
        <div>
          <p className="font-semibold" data-testid="text-student-name">{student.name}</p>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {student.grade && <Badge variant="outline" className="text-xs">{student.grade}</Badge>}
            {student.school && <span>{student.school}</span>}
          </div>
        </div>
      </div>

      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Trophy className="w-4 h-4 text-amber-500" />
            Latest Olympiad - {latestOlympiad.name}
          </CardTitle>
          <CardDescription>Recent ranking across different regions</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/30 dark:to-orange-950/30 border border-amber-200 dark:border-amber-800">
              <p className="text-xs text-muted-foreground mb-1">City Rank</p>
              <p className="text-2xl font-black text-amber-600" data-testid="text-city-rank">{latestOlympiad.cityRank}</p>
              <p className="text-xs text-muted-foreground">{student.city || ""}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-950/30 dark:to-indigo-950/30 border border-blue-200 dark:border-blue-800">
              <p className="text-xs text-muted-foreground mb-1">State Rank</p>
              <p className="text-2xl font-black text-blue-600" data-testid="text-state-rank">{latestOlympiad.stateRank}</p>
              <p className="text-xs text-muted-foreground">{student.state || ""}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 border border-purple-200 dark:border-purple-800">
              <p className="text-xs text-muted-foreground mb-1">Country Rank</p>
              <p className="text-2xl font-black text-purple-600" data-testid="text-country-rank">{latestOlympiad.countryRank}</p>
              <p className="text-xs text-muted-foreground">India</p>
            </div>
          </div>
          <div className="mt-3 flex items-center justify-between text-sm border-t pt-3">
            <span className="text-muted-foreground">Score: <span className="font-semibold text-foreground">{latestOlympiad.score}%</span></span>
            <Badge variant="outline" className="text-amber-600 border-amber-300">Top Performer</Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-green-500" />
            Overall Performance - All Olympiads
          </CardTitle>
          <CardDescription>Cumulative ranking across all attempted olympiads</CardDescription>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-3 mb-3">
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800">
              <p className="text-xs text-muted-foreground mb-1">City Rank</p>
              <p className="text-2xl font-black text-green-600">{overallStats.cityRank}</p>
              <p className="text-xs text-muted-foreground">{student.city || ""}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-950/30 dark:to-cyan-950/30 border border-teal-200 dark:border-teal-800">
              <p className="text-xs text-muted-foreground mb-1">State Rank</p>
              <p className="text-2xl font-black text-teal-600">{overallStats.stateRank}</p>
              <p className="text-xs text-muted-foreground">{student.state || ""}</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-950/30 dark:to-pink-950/30 border border-rose-200 dark:border-rose-800">
              <p className="text-xs text-muted-foreground mb-1">Country Rank</p>
              <p className="text-2xl font-black text-rose-600">{overallStats.countryRank}</p>
              <p className="text-xs text-muted-foreground">India</p>
            </div>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground border-t pt-3">
            <span>Based on {overallStats.completedExams} olympiads attempted</span>
            <Badge variant="outline" className="text-green-600 border-green-300">Top {100 - overallStats.percentile}% Nationally</Badge>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-3 gap-3">
        <Card className="border shadow-sm">
          <CardContent className="p-4 text-center">
            <GraduationCap className="w-6 h-6 mx-auto text-purple-500 mb-2" />
            <p className="text-2xl font-black text-purple-600">{overallStats.completedExams}</p>
            <p className="text-xs text-muted-foreground">Exams Completed</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 text-center">
            <BookOpen className="w-6 h-6 mx-auto text-blue-500 mb-2" />
            <p className="text-2xl font-black text-blue-600">{overallStats.avgScore}%</p>
            <p className="text-xs text-muted-foreground">Average Score</p>
          </CardContent>
        </Card>
        <Card className="border shadow-sm">
          <CardContent className="p-4 text-center">
            <Award className="w-6 h-6 mx-auto text-amber-500 mb-2" />
            <p className="text-2xl font-black text-amber-600">{overallStats.certificates}</p>
            <p className="text-xs text-muted-foreground">Certificates</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh]">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <Target className="w-5 h-5 text-primary" />
            Student Performance
          </DialogTitle>
          <DialogDescription>
            Performance metrics and analytics for {student.name}
          </DialogDescription>
        </DialogHeader>

        <DialogBody>
          {showFullAnalytics ? (
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="overview" className="flex items-center gap-2" data-testid="tab-overview">
                  <Trophy className="w-4 h-4" />
                  Rankings Overview
                </TabsTrigger>
                <TabsTrigger value="analytics" className="flex items-center gap-2" data-testid="tab-analytics">
                  <Brain className="w-4 h-4" />
                  Deep Analytics
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="overview" className="mt-0">
                {renderOverviewTab()}
              </TabsContent>
              
              <TabsContent value="analytics" className="mt-0">
                <PerformanceAnalytics studentId={student.id} />
              </TabsContent>
            </Tabs>
          ) : (
            renderOverviewTab()
          )}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
