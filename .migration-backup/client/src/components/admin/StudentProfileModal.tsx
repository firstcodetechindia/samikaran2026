import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  User, BookOpen, CreditCard, Shield, Bot,
  X, Download, Mail, Phone, MapPin, GraduationCap,
  Building2, Calendar, Hash, CheckCircle2, XCircle,
  AlertTriangle, Trophy, Clock, BarChart3, MessageSquare,
  FileText, Eye, Zap, Activity
} from "lucide-react";

interface StudentProfileModalProps {
  studentId: number;
  onClose: () => void;
}

function formatDate(d: string | null | undefined, includeTime = false): string {
  if (!d) return "—";
  try {
    return new Date(d).toLocaleString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      ...(includeTime ? { hour: "2-digit", minute: "2-digit" } : {}),
    });
  } catch { return "—"; }
}

function formatAmount(paise: number | null | undefined, currency = "INR"): string {
  if (paise == null) return "—";
  const amount = paise / 100;
  return new Intl.NumberFormat("en-IN", { style: "currency", currency }).format(amount);
}

function InfoRow({ icon: Icon, label, value, highlight }: { icon?: any; label: string; value: any; highlight?: "green" | "red" | "purple" }) {
  const color = highlight === "green" ? "text-green-600 font-semibold" : highlight === "red" ? "text-red-500 font-semibold" : highlight === "purple" ? "text-purple-600 font-semibold" : "text-foreground";
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-gray-100 last:border-0">
      {Icon && <Icon className="w-4 h-4 text-muted-foreground mt-0.5 flex-shrink-0" />}
      <span className="text-sm text-muted-foreground w-36 flex-shrink-0">{label}</span>
      <span className={`text-sm ${color} flex-1`}>{value ?? "—"}</span>
    </div>
  );
}

function SeverityBadge({ severity }: { severity: string }) {
  const map: Record<string, string> = {
    low: "bg-blue-100 text-blue-700",
    medium: "bg-yellow-100 text-yellow-700",
    high: "bg-orange-100 text-orange-700",
    critical: "bg-red-100 text-red-700",
  };
  return <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${map[severity] || map.low}`}>{severity}</span>;
}

function EmptyState({ icon: Icon, message }: { icon: any; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-3">
      <Icon className="w-10 h-10 opacity-20" />
      <p className="text-sm">{message}</p>
    </div>
  );
}

export default function StudentProfileModal({ studentId, onClose }: StudentProfileModalProps) {
  const [activeTab, setActiveTab] = useState("personal");

  const { data: profile, isLoading: profileLoading } = useQuery<any>({
    queryKey: ["/sysctrl/api/students", studentId, "profile"],
    queryFn: () => fetch(`/sysctrl/api/students/${studentId}/profile`).then(r => r.json()),
  });

  const { data: examHistoryRaw, isLoading: examLoading } = useQuery<any>({
    queryKey: ["/sysctrl/api/students", studentId, "exam-history"],
    queryFn: () => fetch(`/sysctrl/api/students/${studentId}/exam-history`).then(r => r.json()),
    enabled: activeTab === "exams",
  });
  const examHistory: any[] = Array.isArray(examHistoryRaw) ? examHistoryRaw : [];

  const { data: paymentsRaw, isLoading: payLoading } = useQuery<any>({
    queryKey: ["/sysctrl/api/students", studentId, "payments"],
    queryFn: () => fetch(`/sysctrl/api/students/${studentId}/payments`).then(r => r.json()),
    enabled: activeTab === "payments",
  });
  const payments: any[] = Array.isArray(paymentsRaw) ? paymentsRaw : [];

  const { data: proctoringLogsRaw, isLoading: procLoading } = useQuery<any>({
    queryKey: ["/sysctrl/api/students", studentId, "proctoring-logs"],
    queryFn: () => fetch(`/sysctrl/api/students/${studentId}/proctoring-logs`).then(r => r.json()),
    enabled: activeTab === "proctoring",
  });
  const proctoringLogs: any[] = Array.isArray(proctoringLogsRaw) ? proctoringLogsRaw : [];

  const { data: taraUsage, isLoading: taraLoading } = useQuery<any>({
    queryKey: ["/sysctrl/api/students", studentId, "tara-usage"],
    queryFn: () => fetch(`/sysctrl/api/students/${studentId}/tara-usage`).then(r => r.json()),
    enabled: activeTab === "tara",
  });

  const name = profile ? [profile.firstName, profile.lastName].filter(Boolean).join(" ") || "—" : "—";
  const initials = name === "—" ? "?" : name.split(" ").map((w: string) => w[0]).join("").toUpperCase().slice(0, 2);

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-4xl w-full max-h-[92vh] overflow-y-auto p-0 gap-0">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-pink-500 p-6 rounded-t-lg relative">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center transition-colors"
            data-testid="button-close-student-modal"
          >
            <X className="w-4 h-4 text-white" />
          </button>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur flex items-center justify-center text-white text-xl font-bold shadow-lg">
              {profileLoading ? "…" : initials}
            </div>
            <div>
              <DialogTitle className="text-xl font-bold text-white mb-1" data-testid="text-student-modal-name">
                {profileLoading ? "Loading…" : name}
              </DialogTitle>
              <div className="flex items-center gap-3 flex-wrap">
                {profile?.studentId && (
                  <span className="text-xs bg-white/20 text-white px-2 py-0.5 rounded-full font-mono" data-testid="text-student-modal-id">
                    {profile.studentId}
                  </span>
                )}
                {profile && (
                  <Badge
                    className={`text-[10px] ${profile.verified ? "bg-green-400/30 text-green-100 hover:bg-green-400/30" : "bg-red-400/30 text-red-100 hover:bg-red-400/30"}`}
                    data-testid="badge-student-status"
                  >
                    {profile.verified ? "Active" : "Inactive"}
                  </Badge>
                )}
                {profile?.gradeLevel && (
                  <span className="text-xs text-white/80">Class {profile.gradeLevel}</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="p-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-5 w-full mb-6" data-testid="tabs-student-profile">
              <TabsTrigger value="personal" className="text-xs gap-1.5" data-testid="tab-personal">
                <User className="w-3.5 h-3.5" /> Personal
              </TabsTrigger>
              <TabsTrigger value="exams" className="text-xs gap-1.5" data-testid="tab-exams">
                <BookOpen className="w-3.5 h-3.5" /> Exams
              </TabsTrigger>
              <TabsTrigger value="payments" className="text-xs gap-1.5" data-testid="tab-payments">
                <CreditCard className="w-3.5 h-3.5" /> Payments
              </TabsTrigger>
              <TabsTrigger value="proctoring" className="text-xs gap-1.5" data-testid="tab-proctoring">
                <Shield className="w-3.5 h-3.5" /> Proctoring
              </TabsTrigger>
              <TabsTrigger value="tara" className="text-xs gap-1.5" data-testid="tab-tara">
                <Bot className="w-3.5 h-3.5" /> TARA AI
              </TabsTrigger>
            </TabsList>

            {/* ── PERSONAL INFO ── */}
            <TabsContent value="personal">
              {profileLoading ? (
                <div className="space-y-3">{[1,2,3,4,5].map(i => <div key={i} className="h-10 bg-muted/50 rounded animate-pulse" />)}</div>
              ) : profile ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
                  <div className="space-y-0 border rounded-xl px-4 py-2 bg-gray-50/50">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 mb-1">Identity</h3>
                    <InfoRow icon={Hash} label="Student ID" value={<span className="font-mono">{profile.studentId || `#${profile.id}`}</span>} highlight="purple" />
                    <InfoRow icon={User} label="Full Name" value={name} />
                    <InfoRow icon={Calendar} label="Date of Birth" value={profile.dateOfBirth} />
                    <InfoRow icon={User} label="Gender" value={profile.gender} />
                    <InfoRow icon={Calendar} label="Joined" value={formatDate(profile.createdAt)} />
                    <InfoRow icon={Calendar} label="Last Login" value={formatDate(profile.lastLoginAt, true)} />
                  </div>
                  <div className="space-y-0 border rounded-xl px-4 py-2 bg-gray-50/50">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 mb-1">Contact & Location</h3>
                    <InfoRow icon={Mail} label="Email" value={profile.email} />
                    <InfoRow icon={Phone} label="Phone" value={profile.phone ? `${profile.countryCode || ""} ${profile.phone}` : "—"} />
                    <InfoRow icon={MapPin} label="City" value={profile.schoolCity || profile.cityId} />
                    <InfoRow icon={MapPin} label="State" value={profile.schoolLocation} />
                    <InfoRow icon={MapPin} label="Pincode" value={profile.pincode} />
                    <InfoRow icon={MapPin} label="Address" value={profile.addressLine1} />
                  </div>
                  <div className="space-y-0 border rounded-xl px-4 py-2 bg-gray-50/50 mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 mb-1">Academic</h3>
                    <InfoRow icon={GraduationCap} label="Class / Grade" value={profile.gradeLevel} />
                    <InfoRow icon={Building2} label="School Name" value={profile.schoolName} />
                    <InfoRow icon={Building2} label="Reg. Type" value={profile.registrationType} />
                  </div>
                  <div className="space-y-0 border rounded-xl px-4 py-2 bg-gray-50/50 mt-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground py-2 mb-1">Account Status</h3>
                    <InfoRow icon={CheckCircle2} label="Verified" value={profile.verified ? "Yes" : "No"} highlight={profile.verified ? "green" : "red"} />
                    <InfoRow icon={Mail} label="Email Verified" value={profile.emailVerified ? "Yes" : "No"} highlight={profile.emailVerified ? "green" : "red"} />
                    <InfoRow icon={Phone} label="Phone Verified" value={profile.phoneVerified ? "Yes" : "No"} highlight={profile.phoneVerified ? "green" : "red"} />
                    <InfoRow icon={Activity} label="Profile Status" value={profile.profileStatus} />
                    <InfoRow icon={Hash} label="Referral Code" value={profile.myReferralCode} />
                  </div>
                </div>
              ) : (
                <EmptyState icon={User} message="Student profile not found." />
              )}
            </TabsContent>

            {/* ── EXAM HISTORY ── */}
            <TabsContent value="exams">
              {examLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />)}</div>
              ) : examHistory.length === 0 ? (
                <EmptyState icon={BookOpen} message="No exam attempts found for this student." />
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm" data-testid="table-exam-history">
                    <thead>
                      <tr className="bg-muted/40 border-b">
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Olympiad / Exam</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Score</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Rank</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Result</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Certificate</th>
                      </tr>
                    </thead>
                    <tbody>
                      {examHistory.map((row: any, i: number) => {
                        const passed = row.score != null && row.score >= 40;
                        const durationMin = row.durationSeconds ? Math.round(row.durationSeconds / 60) : null;
                        return (
                          <tr key={row.attemptId || i} className={`border-b transition-colors hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/5"}`} data-testid={`row-exam-${row.attemptId}`}>
                            <td className="px-4 py-3 font-medium">{row.examTitle || row.olympiadName || "—"}</td>
                            <td className="px-4 py-3 text-muted-foreground">{formatDate(row.startTime)}</td>
                            <td className="px-4 py-3 text-center">
                              {row.score != null ? (
                                <span className={`font-semibold ${row.score >= 70 ? "text-green-600" : row.score >= 40 ? "text-yellow-600" : "text-red-500"}`}>
                                  {row.score}%
                                </span>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {row.rank ? (
                                <span className="flex items-center justify-center gap-1">
                                  <Trophy className="w-3.5 h-3.5 text-amber-500" />
                                  #{row.rank}
                                </span>
                              ) : "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {row.status === "completed" ? (
                                <Badge className={passed ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-red-100 text-red-700 hover:bg-red-100"}>
                                  {passed ? "Pass" : "Fail"}
                                </Badge>
                              ) : (
                                <Badge variant="outline" className="text-[10px]">{row.status || "—"}</Badge>
                              )}
                            </td>
                            <td className="px-4 py-3 text-center text-muted-foreground">
                              {durationMin ? `${durationMin} min` : "—"}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {row.certificateUrl ? (
                                <a href={row.certificateUrl} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" data-testid={`button-cert-${row.attemptId}`}>
                                    <Eye className="w-3 h-3" /> View
                                  </Button>
                                </a>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* ── PAYMENT HISTORY ── */}
            <TabsContent value="payments">
              {payLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-14 bg-muted/50 rounded animate-pulse" />)}</div>
              ) : payments.length === 0 ? (
                <EmptyState icon={CreditCard} message="No payment records found for this student." />
              ) : (
                <div className="border rounded-xl overflow-hidden">
                  <table className="w-full text-sm" data-testid="table-payment-history">
                    <thead>
                      <tr className="bg-muted/40 border-b">
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Transaction ID</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Description</th>
                        <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Amount</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Gateway</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
                        <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                        <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Invoice</th>
                      </tr>
                    </thead>
                    <tbody>
                      {payments.map((pay: any, i: number) => {
                        const statusColor: Record<string, string> = {
                          paid: "bg-green-100 text-green-700",
                          pending: "bg-yellow-100 text-yellow-700",
                          failed: "bg-red-100 text-red-700",
                          refunded: "bg-blue-100 text-blue-700",
                          cancelled: "bg-gray-100 text-gray-600",
                        };
                        return (
                          <tr key={pay.id || i} className={`border-b transition-colors hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/5"}`} data-testid={`row-payment-${pay.id}`}>
                            <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                              {pay.gatewayPaymentId || pay.transactionId || `#${pay.id}`}
                            </td>
                            <td className="px-4 py-3 text-sm">{pay.description || pay.examTitle || "Olympiad Registration"}</td>
                            <td className="px-4 py-3 text-right font-semibold">{formatAmount(pay.amount, pay.currency)}</td>
                            <td className="px-4 py-3 text-center">
                              <span className="text-xs px-2 py-0.5 rounded-full bg-muted font-medium capitalize">{pay.gateway || "—"}</span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${statusColor[pay.status] || "bg-gray-100 text-gray-600"}`}>
                                {pay.status || "—"}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-xs text-muted-foreground">{formatDate(pay.paidAt || pay.createdAt)}</td>
                            <td className="px-4 py-3 text-center">
                              {pay.invoiceUrl ? (
                                <a href={pay.invoiceUrl} target="_blank" rel="noopener noreferrer">
                                  <Button variant="outline" size="sm" className="h-7 text-xs gap-1" data-testid={`button-invoice-${pay.id}`}>
                                    <Download className="w-3 h-3" /> PDF
                                  </Button>
                                </a>
                              ) : <span className="text-xs text-muted-foreground">—</span>}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* ── PROCTORING LOG ── */}
            <TabsContent value="proctoring">
              {procLoading ? (
                <div className="space-y-3">{[1,2,3].map(i => <div key={i} className="h-16 bg-muted/50 rounded animate-pulse" />)}</div>
              ) : proctoringLogs.length === 0 ? (
                <EmptyState icon={Shield} message="No proctoring events found for this student." />
              ) : (
                <div className="space-y-3" data-testid="list-proctoring-logs">
                  {proctoringLogs.map((log: any, i: number) => {
                    const warningIcon: Record<string, any> = {
                      face_not_detected: AlertTriangle,
                      multiple_faces: User,
                      tab_switch: Activity,
                      fullscreen_exit: Eye,
                      copy_paste: FileText,
                      phone_detected: Phone,
                    };
                    const WarnIcon = warningIcon[log.warningType] || AlertTriangle;
                    return (
                      <div key={log.id || i} className="flex items-start gap-3 p-4 border rounded-xl hover:bg-muted/20 transition-colors" data-testid={`row-proctoring-${log.id}`}>
                        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                          log.severity === "critical" ? "bg-red-100" : log.severity === "high" ? "bg-orange-100" : log.severity === "medium" ? "bg-yellow-100" : "bg-blue-100"
                        }`}>
                          <WarnIcon className={`w-4 h-4 ${
                            log.severity === "critical" ? "text-red-600" : log.severity === "high" ? "text-orange-600" : log.severity === "medium" ? "text-yellow-600" : "text-blue-600"
                          }`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="text-sm font-medium capitalize">{(log.warningType || "").replace(/_/g, " ")}</span>
                            <SeverityBadge severity={log.severity || "low"} />
                            {log.autoDisqualified && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-semibold">AUTO-DISQUALIFIED</span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">{log.warningMessage || "No additional details"}</p>
                          <div className="flex items-center gap-4 mt-1.5 flex-wrap">
                            <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              {formatDate(log.sessionStart, true)}
                            </span>
                            {log.examId && (
                              <span className="text-[11px] text-muted-foreground">Exam #{log.examId}</span>
                            )}
                            {log.ipAddress && (
                              <span className="text-[11px] text-muted-foreground font-mono">{log.ipAddress}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </TabsContent>

            {/* ── TARA AI USAGE ── */}
            <TabsContent value="tara">
              {taraLoading ? (
                <div className="space-y-3">{[1,2].map(i => <div key={i} className="h-24 bg-muted/50 rounded animate-pulse" />)}</div>
              ) : !taraUsage ? (
                <EmptyState icon={Bot} message="No TARA AI usage data found for this student." />
              ) : (
                <div className="space-y-6">
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[
                      { label: "Total Credits Used", value: taraUsage.totalCredits ?? 0, icon: Zap, color: "from-purple-500 to-violet-500" },
                      { label: "Total Sessions", value: taraUsage.totalSessions ?? 0, icon: MessageSquare, color: "from-blue-500 to-cyan-500" },
                      { label: "Total Messages", value: taraUsage.totalMessages ?? 0, icon: Bot, color: "from-pink-500 to-rose-500" },
                      { label: "Avg Session (min)", value: taraUsage.avgSessionMin ?? 0, icon: Clock, color: "from-amber-500 to-orange-500" },
                    ].map((stat) => (
                      <div key={stat.label} className="border rounded-xl p-4" data-testid={`stat-tara-${stat.label.toLowerCase().replace(/ /g, '-')}`}>
                        <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${stat.color} flex items-center justify-center mb-3`}>
                          <stat.icon className="w-4.5 h-4.5 text-white" />
                        </div>
                        <div className="text-2xl font-bold">{stat.value}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">{stat.label}</div>
                      </div>
                    ))}
                  </div>

                  {/* Recent sessions */}
                  {taraUsage.recentSessions?.length > 0 && (
                    <div>
                      <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                        <BarChart3 className="w-4 h-4 text-purple-500" />
                        Recent Sessions
                      </h3>
                      <div className="border rounded-xl overflow-hidden">
                        <table className="w-full text-sm" data-testid="table-tara-sessions">
                          <thead>
                            <tr className="bg-muted/40 border-b">
                              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
                              <th className="text-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Credits</th>
                              <th className="text-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Messages</th>
                              <th className="text-center px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Duration</th>
                              <th className="text-left px-4 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Topic</th>
                            </tr>
                          </thead>
                          <tbody>
                            {taraUsage.recentSessions.map((s: any, i: number) => (
                              <tr key={s.id || i} className={`border-b hover:bg-muted/20 ${i % 2 === 0 ? "" : "bg-muted/5"}`}>
                                <td className="px-4 py-2.5 text-xs text-muted-foreground">{formatDate(s.sessionDate, true)}</td>
                                <td className="px-4 py-2.5 text-center font-semibold text-purple-600">{s.creditsUsed ?? 1}</td>
                                <td className="px-4 py-2.5 text-center">{s.messageCount ?? 0}</td>
                                <td className="px-4 py-2.5 text-center text-muted-foreground">{s.sessionDurationSeconds ? `${Math.round(s.sessionDurationSeconds / 60)} min` : "—"}</td>
                                <td className="px-4 py-2.5 text-xs capitalize">{(s.topicCategory || "general").replace(/_/g, " ")}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </TabsContent>
          </Tabs>

          {/* Action buttons */}
          <div className="flex flex-wrap gap-3 mt-6 pt-4 border-t" data-testid="section-student-actions">
            <Button variant="outline" size="sm" className="gap-2" data-testid="button-student-download-report">
              <Download className="w-4 h-4" /> Download Report
            </Button>
            <Button variant="outline" size="sm" className="gap-2 text-red-500 hover:text-red-600 hover:border-red-300" data-testid="button-student-deactivate">
              <XCircle className="w-4 h-4" /> Deactivate Account
            </Button>
            <Button size="sm" className="gap-2 bg-gradient-to-r from-purple-600 to-pink-500 text-white ml-auto" data-testid="button-student-send-message">
              <Mail className="w-4 h-4" /> Send Message
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
