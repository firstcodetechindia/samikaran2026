import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import {
  Trophy, Medal, Award, Download, RefreshCw, Eye, EyeOff,
  Filter, FileSpreadsheet, Sparkles, MapPin, School, Users, Star
} from "lucide-react";

function fmtTime(sec: number | null) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60), s = sec % 60;
  return `${m}m ${s}s`;
}

const RANK_STYLES: Record<number, { bg: string; text: string; icon: any }> = {
  1: { bg: "bg-gradient-to-r from-yellow-400 to-amber-500", text: "text-white", icon: Trophy },
  2: { bg: "bg-gradient-to-r from-gray-300 to-slate-400", text: "text-white", icon: Medal },
  3: { bg: "bg-gradient-to-r from-orange-400 to-amber-600", text: "text-white", icon: Award },
};

export default function LeaderboardTab() {
  const { toast } = useToast();
  const [selectedOlympiad, setSelectedOlympiad] = useState<string>("");
  const [filterClass, setFilterClass] = useState("all");
  const [filterState, setFilterState] = useState("all");
  const [search, setSearch] = useState("");
  const [announcing, setAnnouncing] = useState(false);

  const { data: exams = [] } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/exams-list"],
    queryFn: () => fetch("/sysctrl/api/exams-list").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const { data: leaderboard = [], isLoading } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/leaderboards", selectedOlympiad],
    queryFn: () => fetch(`/sysctrl/api/leaderboards/${selectedOlympiad}`).then(r => r.json()).then(d => Array.isArray(d) ? d : []),
    enabled: !!selectedOlympiad,
  });

  const visibilityMut = useMutation({
    mutationFn: ({ id, visible }: any) => apiRequest("PUT", `/sysctrl/api/leaderboards/${id}/visibility`, { visible }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/sysctrl/api/leaderboards", selectedOlympiad] }); toast({ title: "Visibility updated" }); },
  });

  const filtered = leaderboard.filter((e: any) => {
    const matchSearch = !search || e.studentName?.toLowerCase().includes(search.toLowerCase()) || e.schoolName?.toLowerCase().includes(search.toLowerCase());
    const matchClass = filterClass === "all" || String(e.class) === filterClass;
    const matchState = filterState === "all" || e.state === filterState;
    return matchSearch && matchClass && matchState;
  });

  const states = [...new Set(leaderboard.map((e: any) => e.state).filter(Boolean))];
  const top3 = leaderboard.slice(0, 3);
  const selectedExam = exams.find((e: any) => String(e.id) === selectedOlympiad);

  const handleExportCSV = () => {
    const rows = [["Rank", "Student", "School", "City", "State", "Score", "Time"].join(","),
      ...filtered.map((e: any) => [e.rank, `"${e.studentName}"`, `"${e.schoolName}"`, e.city, e.state, e.score, fmtTime(e.timeTaken)].join(","))];
    const blob = new Blob([rows.join("\n")], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `leaderboard_${selectedOlympiad}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "CSV exported!" });
  };

  const handleAnnounce = async () => {
    if (!selectedOlympiad || top3.length === 0) return;
    setAnnouncing(true);
    try {
      const res = await apiRequest("POST", "/sysctrl/api/leaderboards/announce", { olympiadId: selectedOlympiad, olympiadName: selectedExam?.title, toppers: top3 });
      const data = await res.json();
      toast({ title: "Social post generated!", description: data.post?.slice(0, 100) });
    } catch {
      toast({ title: "Announcement failed", variant: "destructive" });
    } finally {
      setAnnouncing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-500" /> Leaderboard Management
          </h2>
          <p className="text-gray-500 text-sm mt-1">View, manage, and publish olympiad leaderboards</p>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" onClick={handleExportCSV} disabled={!selectedOlympiad || filtered.length === 0} data-testid="button-export-leaderboard">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
          </Button>
          <Button onClick={handleAnnounce} disabled={!selectedOlympiad || top3.length === 0 || announcing} className="bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white" data-testid="button-announce-toppers">
            <Sparkles className="w-4 h-4 mr-2" /> {announcing ? "Generating..." : "Announce Toppers"}
          </Button>
        </div>
      </div>

      {/* Olympiad Selector */}
      <Card className="shadow-sm border-0">
        <CardContent className="p-4">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div className="sm:col-span-2">
              <Label className="text-xs text-gray-500 mb-1 block">Select Olympiad</Label>
              <Select value={selectedOlympiad} onValueChange={setSelectedOlympiad}>
                <SelectTrigger data-testid="select-olympiad-leaderboard"><SelectValue placeholder="Choose an olympiad..." /></SelectTrigger>
                <SelectContent>
                  {exams.map((e: any) => <SelectItem key={e.id} value={String(e.id)}>{e.title}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Filter by Class</Label>
              <Select value={filterClass} onValueChange={setFilterClass}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Classes</SelectItem>
                  {[3,4,5,6,7,8,9,10,11,12].map(c => <SelectItem key={c} value={String(c)}>Class {c}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs text-gray-500 mb-1 block">Filter by State</Label>
              <Select value={filterState} onValueChange={setFilterState}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All States</SelectItem>
                  {states.map((s: string) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {!selectedOlympiad ? (
        <div className="text-center py-16 text-gray-400">
          <Trophy className="w-12 h-12 mx-auto mb-4 opacity-30" />
          <p className="font-medium text-lg">Select an Olympiad</p>
          <p className="text-sm">Choose an olympiad above to view its leaderboard</p>
        </div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-12 text-gray-400">
          <RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading leaderboard...
        </div>
      ) : (
        <>
          {/* Top 3 Podium */}
          {top3.length > 0 && (
            <div className="grid grid-cols-3 gap-4">
              {[top3[1], top3[0], top3[2]].filter(Boolean).map((s: any, i) => {
                const rank = i === 1 ? 1 : i === 0 ? 2 : 3;
                const style = RANK_STYLES[rank];
                return (
                  <Card key={s.id} className={`border-0 shadow-lg ${rank === 1 ? "order-first md:order-none scale-105" : ""}`}>
                    <CardContent className={`p-4 ${style.bg} rounded-lg text-center ${style.text}`}>
                      <div className="flex justify-center mb-2">
                        <style.icon className={`w-8 h-8 ${rank === 1 ? "w-10 h-10" : ""}`} />
                      </div>
                      <p className="font-bold text-lg">#{rank}</p>
                      <p className="font-semibold text-sm mt-1 truncate">{s.studentName || "—"}</p>
                      <p className="text-xs opacity-80 truncate">{s.schoolName || "—"}</p>
                      <p className="text-xl font-black mt-2">{s.score}</p>
                      <p className="text-xs opacity-80">points</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Search + Table */}
          <Card className="shadow-sm border-0">
            <CardHeader className="pb-3">
              <div className="flex items-center gap-3">
                <Input placeholder="Search student or school..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1" data-testid="input-search-leaderboard" />
                <Badge variant="outline">{filtered.length} entries</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              {filtered.length === 0 ? (
                <div className="text-center py-10 text-gray-400">
                  <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p>No leaderboard data found</p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow className="bg-gray-50/50">
                      <TableHead className="w-16">Rank</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>School</TableHead>
                      <TableHead>City</TableHead>
                      <TableHead>State</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Public</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filtered.map((e: any) => {
                      const rs = RANK_STYLES[e.rank];
                      return (
                        <TableRow key={e.id} data-testid={`row-leaderboard-${e.id}`} className={e.rank <= 3 ? "bg-amber-50/30" : ""}>
                          <TableCell>
                            {rs ? (
                              <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${rs.bg} ${rs.text}`}>
                                {e.rank}
                              </span>
                            ) : (
                              <span className="text-gray-500 font-mono text-sm">#{e.rank}</span>
                            )}
                          </TableCell>
                          <TableCell className="font-medium">{e.studentName || "—"}</TableCell>
                          <TableCell className="text-sm text-gray-600">{e.schoolName || "—"}</TableCell>
                          <TableCell className="text-sm">{e.city || "—"}</TableCell>
                          <TableCell className="text-sm">{e.state || "—"}</TableCell>
                          <TableCell>
                            <span className={`font-bold ${e.score >= 80 ? "text-emerald-600" : e.score >= 50 ? "text-amber-600" : "text-red-500"}`}>
                              {e.score}
                            </span>
                          </TableCell>
                          <TableCell className="text-sm text-gray-500">{fmtTime(e.timeTaken)}</TableCell>
                          <TableCell>
                            <Switch
                              checked={e.isPublic !== false}
                              onCheckedChange={v => visibilityMut.mutate({ id: e.id, visible: v })}
                              data-testid={`switch-visibility-${e.id}`}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
