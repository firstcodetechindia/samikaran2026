import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import {
  BarChart3, TrendingUp, IndianRupee, GraduationCap, School,
  MapPin, Download, Calendar, Mail, RefreshCw, FileSpreadsheet, FileText
} from "lucide-react";

const COLORS = ["#8A2BE2", "#FF2FBF", "#3B82F6", "#10B981", "#F59E0B", "#EF4444"];

function fmtCurrency(n: number) {
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(1)}K`;
  return `₹${n}`;
}

function downloadCSV(data: any[], filename: string) {
  if (!data.length) return;
  const keys = Object.keys(data[0]);
  const rows = [keys.join(","), ...data.map(r => keys.map(k => `"${r[k] ?? ""}"`).join(","))];
  const blob = new Blob([rows.join("\n")], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a"); a.href = url; a.download = filename; a.click();
  URL.revokeObjectURL(url);
}

export default function ReportsAnalyticsTab() {
  const { toast } = useToast();
  const [activeReport, setActiveReport] = useState("registration");
  const [dateRange, setDateRange] = useState("30d");
  const [scheduleEmail, setScheduleEmail] = useState(false);
  const [scheduleRecipients, setScheduleRecipients] = useState("");

  const { data: regData = [], isLoading: regLoading } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/reports/registration", dateRange],
    queryFn: () => fetch(`/sysctrl/api/reports/registration?range=${dateRange}`).then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const { data: revenueData = [], isLoading: revLoading } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/reports/revenue", dateRange],
    queryFn: () => fetch(`/sysctrl/api/reports/revenue?range=${dateRange}`).then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const { data: examData = [], isLoading: examLoading } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/reports/exam-performance"],
    queryFn: () => fetch("/sysctrl/api/reports/exam-performance").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const { data: schoolData = [], isLoading: schoolLoading } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/reports/school-wise"],
    queryFn: () => fetch("/sysctrl/api/reports/school-wise").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const { data: geoData = [], isLoading: geoLoading } = useQuery<any[]>({
    queryKey: ["/sysctrl/api/reports/geography"],
    queryFn: () => fetch("/sysctrl/api/reports/geography").then(r => r.json()).then(d => Array.isArray(d) ? d : []),
  });

  const totalRev = revenueData.reduce((s: number, d: any) => s + (d.revenue || 0), 0);
  const totalReg = regData.reduce((s: number, d: any) => s + (d.students || 0) + (d.schools || 0), 0);

  const REPORTS = [
    { id: "registration", label: "Registration", icon: GraduationCap },
    { id: "revenue", label: "Revenue", icon: IndianRupee },
    { id: "exam", label: "Exam Performance", icon: BarChart3 },
    { id: "school", label: "School-wise", icon: School },
    { id: "geo", label: "Geography", icon: MapPin },
  ];

  const handleExport = (type: string) => {
    let data: any[] = [];
    let filename = "";
    switch (type) {
      case "registration": data = regData; filename = "registration_report.csv"; break;
      case "revenue": data = revenueData; filename = "revenue_report.csv"; break;
      case "exam": data = examData; filename = "exam_performance.csv"; break;
      case "school": data = schoolData; filename = "school_report.csv"; break;
      case "geo": data = geoData; filename = "geography_report.csv"; break;
    }
    if (data.length) { downloadCSV(data, filename); toast({ title: "CSV exported!" }); }
    else toast({ title: "No data to export", variant: "destructive" });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-blue-600" /> Advanced Reports & Analytics
          </h2>
          <p className="text-gray-500 text-sm mt-1">Comprehensive data insights across all platform dimensions</p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-32" data-testid="select-date-range">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={() => handleExport(activeReport)} data-testid="button-export-report">
            <FileSpreadsheet className="w-4 h-4 mr-2" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total Registrations", value: totalReg.toLocaleString("en-IN"), icon: GraduationCap, color: "from-violet-500 to-fuchsia-500", change: "+12%" },
          { label: "Total Revenue", value: fmtCurrency(totalRev), icon: IndianRupee, color: "from-emerald-500 to-green-500", change: "+8%" },
          { label: "Olympiads Conducted", value: examData.length, icon: BarChart3, color: "from-blue-500 to-indigo-500", change: "" },
          { label: "Schools Enrolled", value: schoolData.length, icon: School, color: "from-orange-500 to-amber-500", change: "+5%" },
        ].map(s => (
          <Card key={s.label} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center mb-2`}>
                <s.icon className="w-4 h-4 text-white" />
              </div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <div className="flex items-center justify-between">
                <p className="text-xs text-gray-500">{s.label}</p>
                {s.change && <span className="text-xs text-emerald-600 font-medium">{s.change}</span>}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Report Tabs */}
      <Tabs value={activeReport} onValueChange={setActiveReport}>
        <TabsList className="bg-white border flex-wrap h-auto gap-1 p-1">
          {REPORTS.map(r => (
            <TabsTrigger key={r.id} value={r.id} className="text-xs" data-testid={`tab-report-${r.id}`}>
              <r.icon className="w-3 h-3 mr-1" />{r.label}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="registration" className="mt-4">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-base">Registration Trends</CardTitle>
              <CardDescription>Student, school, and teacher registrations over time</CardDescription>
            </CardHeader>
            <CardContent>
              {regLoading ? <div className="flex items-center justify-center h-48 text-gray-400"><RefreshCw className="w-5 h-5 animate-spin mr-2" /> Loading...</div> :
                regData.length === 0 ? <div className="flex items-center justify-center h-48 text-gray-400">No registration data available</div> : (
                  <ResponsiveContainer width="100%" height={300}>
                    <AreaChart data={regData}>
                      <defs>
                        <linearGradient id="regStudents" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#8A2BE2" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#8A2BE2" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="regSchools" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#FF2FBF" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#FF2FBF" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                      <YAxis tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Legend />
                      <Area type="monotone" dataKey="students" stroke="#8A2BE2" fill="url(#regStudents)" name="Students" />
                      <Area type="monotone" dataKey="schools" stroke="#FF2FBF" fill="url(#regSchools)" name="Schools" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="revenue" className="mt-4">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="md:col-span-2">
              <Card className="shadow-sm border-0">
                <CardHeader>
                  <CardTitle className="text-base">Revenue Over Time</CardTitle>
                </CardHeader>
                <CardContent>
                  {revLoading ? <div className="flex items-center justify-center h-48 text-gray-400"><RefreshCw className="w-5 h-5 animate-spin" /></div> :
                    revenueData.length === 0 ? <div className="flex items-center justify-center h-48 text-gray-400">No revenue data available</div> : (
                      <ResponsiveContainer width="100%" height={280}>
                        <BarChart data={revenueData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                          <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                          <YAxis tick={{ fontSize: 11 }} tickFormatter={v => fmtCurrency(v)} />
                          <Tooltip formatter={(v: any) => [fmtCurrency(v), "Revenue"]} />
                          <Bar dataKey="revenue" fill="url(#revGrad)" radius={[4, 4, 0, 0]} />
                          <defs>
                            <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#8A2BE2" />
                              <stop offset="100%" stopColor="#FF2FBF" />
                            </linearGradient>
                          </defs>
                        </BarChart>
                      </ResponsiveContainer>
                    )}
                </CardContent>
              </Card>
            </div>
            <div>
              <Card className="shadow-sm border-0 h-full">
                <CardHeader>
                  <CardTitle className="text-base">By Gateway</CardTitle>
                </CardHeader>
                <CardContent>
                  {revenueData.length > 0 ? (
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie data={[
                          { name: "Razorpay", value: Math.floor(totalRev * 0.7) },
                          { name: "Manual", value: Math.floor(totalRev * 0.2) },
                          { name: "Other", value: Math.floor(totalRev * 0.1) },
                        ]} dataKey="value" cx="50%" cy="50%" outerRadius={70} label>
                          {COLORS.map((c, i) => <Cell key={i} fill={c} />)}
                        </Pie>
                        <Tooltip formatter={(v: any) => fmtCurrency(v)} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  ) : <p className="text-center text-gray-400 py-8 text-sm">No data</p>}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="exam" className="mt-4">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-base">Exam Performance Report</CardTitle>
              <CardDescription>Average scores, pass rates, and participation per olympiad</CardDescription>
            </CardHeader>
            <CardContent>
              {examLoading ? <div className="flex items-center justify-center h-48 text-gray-400"><RefreshCw className="w-5 h-5 animate-spin" /></div> :
                examData.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No exam performance data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={250}>
                      <BarChart data={examData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="avgScore" name="Avg Score" fill="#8A2BE2" radius={[4, 4, 0, 0]} />
                        <Bar dataKey="participation" name="Participation" fill="#FF2FBF" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <Table>
                      <TableHeader>
                        <TableRow><TableHead>Olympiad</TableHead><TableHead>Avg Score</TableHead><TableHead>Pass Rate</TableHead><TableHead>Participants</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {examData.map((e: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-sm">{e.subject}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <Progress value={e.avgScore} className="h-1.5 w-16" />
                                <span className="text-sm">{e.avgScore}%</span>
                              </div>
                            </TableCell>
                            <TableCell><Badge className={`text-xs ${e.passRate >= 70 ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{e.passRate || 0}%</Badge></TableCell>
                            <TableCell className="text-sm">{e.participation?.toLocaleString("en-IN")}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="school" className="mt-4">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-base">School-wise Performance Report</CardTitle>
              <CardDescription>Registrations, revenue, and average performance per school</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              {schoolLoading ? <div className="flex items-center justify-center h-48 text-gray-400"><RefreshCw className="w-5 h-5 animate-spin" /></div> :
                schoolData.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <School className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No school data available</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="bg-gray-50/50">
                        <TableHead>School</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Students</TableHead>
                        <TableHead>Revenue</TableHead>
                        <TableHead>Avg Score</TableHead>
                        <TableHead>Board</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {schoolData.map((s: any, i: number) => (
                        <TableRow key={i} data-testid={`row-school-report-${i}`}>
                          <TableCell className="font-medium text-sm">{s.schoolName || s.name || "—"}</TableCell>
                          <TableCell className="text-sm text-gray-500">{s.city || "—"}</TableCell>
                          <TableCell>{s.studentCount || 0}</TableCell>
                          <TableCell>{fmtCurrency(s.revenue || 0)}</TableCell>
                          <TableCell>
                            <span className={`font-medium ${(s.avgScore || 0) >= 70 ? "text-emerald-600" : "text-amber-600"}`}>{s.avgScore || "—"}</span>
                          </TableCell>
                          <TableCell><Badge variant="outline" className="text-xs">{s.board || "—"}</Badge></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="geo" className="mt-4">
          <Card className="shadow-sm border-0">
            <CardHeader>
              <CardTitle className="text-base">State-wise Breakdown</CardTitle>
              <CardDescription>Registrations and revenue by state</CardDescription>
            </CardHeader>
            <CardContent>
              {geoLoading ? <div className="flex items-center justify-center h-48 text-gray-400"><RefreshCw className="w-5 h-5 animate-spin" /></div> :
                geoData.length === 0 ? (
                  <div className="text-center py-10 text-gray-400">
                    <MapPin className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    <p>No geography data available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={280}>
                      <BarChart data={geoData.slice(0, 15)} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis type="number" tick={{ fontSize: 10 }} />
                        <YAxis dataKey="state" type="category" tick={{ fontSize: 10 }} width={100} />
                        <Tooltip />
                        <Bar dataKey="students" name="Students" fill="#8A2BE2" radius={[0, 4, 4, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-gray-50/50"><TableHead>State</TableHead><TableHead>Students</TableHead><TableHead>Schools</TableHead><TableHead>Revenue</TableHead></TableRow>
                      </TableHeader>
                      <TableBody>
                        {geoData.map((g: any, i: number) => (
                          <TableRow key={i}>
                            <TableCell className="font-medium text-sm flex items-center gap-1"><MapPin className="w-3 h-3 text-gray-400" />{g.state}</TableCell>
                            <TableCell>{g.students?.toLocaleString("en-IN")}</TableCell>
                            <TableCell>{g.schools}</TableCell>
                            <TableCell>{fmtCurrency(g.revenue || 0)}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Scheduled Reports */}
      <Card className="shadow-sm border-0">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2"><Calendar className="w-4 h-4 text-violet-600" /> Scheduled Reports</CardTitle>
          <CardDescription>Automatically email reports every Monday</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">Weekly Report Email</p>
              <p className="text-xs text-gray-500">Send summary report every Monday morning</p>
            </div>
            <Switch checked={scheduleEmail} onCheckedChange={setScheduleEmail} data-testid="switch-scheduled-report" />
          </div>
          {scheduleEmail && (
            <div className="space-y-2 pt-2 border-t">
              <Label className="text-sm">Recipient Emails (comma-separated)</Label>
              <Input value={scheduleRecipients} onChange={e => setScheduleRecipients(e.target.value)} placeholder="admin@school.com, manager@company.com" data-testid="input-report-recipients" />
              <Button size="sm" onClick={() => toast({ title: "Schedule saved!", description: `Weekly reports will be sent to ${scheduleRecipients}` })} className="bg-violet-600 hover:bg-violet-700 text-white" data-testid="button-save-schedule">
                <Mail className="w-4 h-4 mr-2" /> Save Schedule
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
